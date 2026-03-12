defmodule PrivchatBackendWeb.ChatController do
  use PrivchatBackendWeb, :controller

  alias PrivchatBackend.Messaging
  alias PrivchatBackend.Accounts

  def index(%{assigns: %{current_user: user}} = conn, _params) do
    chats = Messaging.list_chats_for_user(user.id)
    json(conn, %{chats: Enum.map(chats, &chat_payload(&1, user.id))})
  end

  def index(conn, _), do: unauthorized(conn)

  def create(%{assigns: %{current_user: user}} = conn, %{"partner_id" => partner_id} = params) do
    with {partner_id_int, ""} <- Integer.parse(to_string(partner_id)),
         %Accounts.User{} <- Accounts.get_user(partner_id_int),
         {:ok, chat} <- Messaging.create_direct_chat(user.id, partner_id_int, params) do
      json(conn, %{chat: chat_payload(chat, user.id)})
    else
      {:error, :self_chat} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "cannot_chat_with_self"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_changeset_errors(changeset)})

      _ ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "cannot_create_chat"})
    end
  end

  def create(
        %{assigns: %{current_user: user}} = conn,
        %{"name" => name, "member_ids" => member_ids, "kind" => "group"}
      )
      when is_list(member_ids) do
    case Messaging.create_group_chat(user.id, name, member_ids) do
      {:ok, chat} ->
        json(conn, %{chat: chat_payload(chat, user.id)})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_changeset_errors(changeset)})
    end
  end

  def create(conn, _), do: unauthorized(conn)

  defp unauthorized(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: "unauthorized"})
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end

  defp chat_payload(chat, current_user_id) do
    members =
      (chat.members || [])
      |> Enum.map(fn m ->
        %{
          id: m.user_id,
          username: m.user && m.user.username,
          display_name: m.user && m.user.display_name,
          phone: m.user && m.user.phone
        }
      end)

    other =
      members
      |> Enum.find(fn m -> m.id != current_user_id end)

    name =
      case chat.kind do
        "direct" ->
          (other && (other.display_name || other.username)) || "Диалог"

        _ ->
          chat.name || "Чат"
      end

    %{
      id: chat.id,
      name: name,
      owner_id: chat.owner_id,
      kind: chat.kind,
      member_ids: chat.member_ids || Enum.map(members, & &1.id),
      members: members,
      inserted_at: chat.inserted_at,
      updated_at: chat.updated_at
    }
  end
end
