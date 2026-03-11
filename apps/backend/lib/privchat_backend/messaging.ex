defmodule PrivchatBackend.Messaging do
  import Ecto.Query, warn: false
  alias PrivchatBackend.Repo
  alias PrivchatBackend.Messaging.{Chat, Message}

  def list_chats_for_user(user_id) do
    from(c in Chat,
      where: c.owner_id == ^user_id,
      order_by: [desc: c.inserted_at]
    )
    |> Repo.all()
  end

  def create_chat(owner_id, attrs) do
    %Chat{}
    |> Chat.changeset(Map.put(attrs, "owner_id", owner_id))
    |> Repo.insert()
  end

  def get_chat!(id), do: Repo.get!(Chat, id)

  def list_messages(chat_id, limit \\ 50) do
    from(m in Message,
      where: m.chat_id == ^chat_id,
      order_by: [desc: m.inserted_at],
      limit: ^limit
    )
    |> Repo.all()
    |> Enum.reverse()
  end

  def create_message(user_id, chat_id, attrs) do
    %Message{}
    |> Message.changeset(
      Map.merge(attrs, %{"sender_id" => user_id, "chat_id" => chat_id})
    )
    |> Repo.insert()
  end
end

