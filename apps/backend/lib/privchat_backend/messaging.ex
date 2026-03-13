defmodule PrivchatBackend.Messaging do
  import Ecto.Query, warn: false
  alias Ecto.{Changeset, Multi}
  alias PrivchatBackend.Repo
  alias PrivchatBackend.Messaging.{Chat, ChatMember, Message}

  def list_chats_for_user(user_id) do
    from(c in Chat,
      join: m in ChatMember,
      on: m.chat_id == c.id,
      where: m.user_id == ^user_id,
      order_by: [desc: c.updated_at, desc: c.inserted_at],
      preload: [members: :user]
    )
    |> Repo.all()
    |> Enum.map(&hydrate_member_ids/1)
  end

  def list_messages(chat_id, user_id, limit \\ 50) do
    if member?(chat_id, user_id) do
      from(m in Message,
        where: m.chat_id == ^chat_id,
        order_by: [desc: m.inserted_at],
        limit: ^limit
      )
      |> Repo.all()
      |> Enum.reverse()
    else
      []
    end
  end

  def member?(chat_id, user_id) do
    from(m in ChatMember, where: m.chat_id == ^chat_id and m.user_id == ^user_id)
    |> Repo.exists?()
  end

  def get_chat!(id), do: Repo.get!(Chat, id)

  def get_message(id), do: Repo.get(Message, id)
  def get_message!(id), do: Repo.get!(Message, id)

  def get_chat_for_user!(chat_id, user_id) do
    if member?(chat_id, user_id) do
      Repo.get!(Chat, chat_id)
    else
      raise Ecto.NoResultsError
    end
  end

  def create_direct_chat(owner_id, partner_id, attrs \\ %{})

  def create_direct_chat(owner_id, partner_id, _attrs) when owner_id == partner_id,
    do: {:error, :self_chat}

  def create_direct_chat(owner_id, partner_id, attrs) do
    key = direct_key(owner_id, partner_id)
    name = Map.get(attrs, "name") || "Диалог"

    Multi.new()
    |> Multi.run(:chat, fn repo, _ ->
      case repo.one(from c in Chat, where: c.direct_key == ^key and c.kind == "direct") do
        nil ->
          %Chat{}
          |> Chat.changeset(%{
            "name" => name,
            "owner_id" => owner_id,
            "kind" => "direct",
            "direct_key" => key
          })
          |> repo.insert()

        chat ->
          {:ok, chat}
      end
    end)
    |> Multi.run(:members, fn repo, %{chat: chat} ->
      members = [
        %{chat_id: chat.id, user_id: owner_id},
        %{chat_id: chat.id, user_id: partner_id}
      ]

      Enum.reduce_while(members, {:ok, []}, fn member_attrs, {:ok, acc} ->
        case repo.insert(ChatMember.changeset(%ChatMember{}, member_attrs),
               on_conflict: :nothing,
               conflict_target: [:chat_id, :user_id]
             ) do
          {:ok, member} -> {:cont, {:ok, [member | acc]}}
          {:error, reason} -> {:halt, {:error, reason}}
        end
      end)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{chat: chat}} ->
        chat = chat |> Repo.preload(members: :user) |> hydrate_member_ids()
        {:ok, chat}

      {:error, _step, reason, _} -> {:error, reason}
    end
  end

  def create_group_chat(owner_id, name, member_ids) when is_list(member_ids) do
    Multi.new()
    |> Multi.insert(:chat, Chat.changeset(%Chat{}, %{"name" => name, "owner_id" => owner_id, "kind" => "group"}))
    |> Multi.run(:members, fn repo, %{chat: chat} ->
      members = Enum.uniq([owner_id | member_ids])

      Enum.reduce_while(members, {:ok, []}, fn uid, {:ok, acc} ->
        case repo.insert(ChatMember.changeset(%ChatMember{}, %{chat_id: chat.id, user_id: uid})) do
          {:ok, member} -> {:cont, {:ok, [member | acc]}}
          {:error, reason} -> {:halt, {:error, reason}}
        end
      end)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{chat: chat}} ->
        chat = chat |> Repo.preload(members: :user) |> hydrate_member_ids()
        {:ok, chat}

      {:error, _step, reason, _} -> {:error, reason}
    end
  end

  def create_message(user_id, chat_id, attrs) do
    if member?(chat_id, user_id) do
      %Message{}
      |> Message.changeset(Map.merge(attrs, %{"sender_id" => user_id, "chat_id" => chat_id}))
      |> Repo.insert()
      |> case do
        {:ok, msg} ->
          Repo.get!(Chat, chat_id)
          |> Ecto.Changeset.change(%{updated_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)})
          |> Repo.update()

          {:ok, msg}

        other ->
          other
      end
    else
      {:error, :forbidden}
    end
  end

  def edit_message(user_id, message_id, attrs) when is_map(attrs) do
    with %Message{} = msg <- Repo.get(Message, message_id),
         true <- msg.sender_id == user_id,
         true <- member?(msg.chat_id, user_id) do
      now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      msg
      |> Message.changeset(attrs)
      |> Changeset.change(edited_at: now)
      |> Repo.update()
    else
      _ -> {:error, :forbidden}
    end
  end

  def forward_message(user_id, message_id, target_chat_id) do
    with %Message{} = msg <- Repo.get(Message, message_id),
         true <- member?(msg.chat_id, user_id),
         true <- member?(target_chat_id, user_id) do
      create_message(user_id, target_chat_id, %{
        "body" => msg.body,
        "encrypted" => msg.encrypted,
        "envelope_metadata" => msg.envelope_metadata,
        "forwarded_from_id" => msg.id
      })
    else
      _ -> {:error, :forbidden}
    end
  end

  def react_to_message(user_id, message_id, emoji, action \\ :add)
      when is_binary(emoji) and action in [:add, :remove] do
    with %Message{} = msg <- Repo.get(Message, message_id),
         true <- member?(msg.chat_id, user_id) do
      updated = update_reactions(msg.reactions || %{}, emoji, user_id, action)

      msg
      |> Changeset.change(reactions: updated)
      |> Repo.update()
    else
      _ -> {:error, :forbidden}
    end
  end

  def hydrate_member_ids(%Chat{members: members} = chat) when is_list(members) do
    member_ids = Enum.map(members, & &1.user_id)
    %{chat | member_ids: member_ids}
  end

  def hydrate_member_ids(chat), do: chat

  defp direct_key(a, b) do
    [min, max] = Enum.sort([a, b])
    "#{min}:#{max}"
  end

  defp update_reactions(reactions, emoji, user_id, :add) do
    current = Map.get(reactions, emoji, [])
    Map.put(reactions, emoji, Enum.uniq([user_id | current]))
  end

  defp update_reactions(reactions, emoji, user_id, :remove) do
    current = Map.get(reactions, emoji, [])

    case Enum.reject(current, &(&1 == user_id)) do
      [] -> Map.delete(reactions, emoji)
      remaining -> Map.put(reactions, emoji, remaining)
    end
  end
end
