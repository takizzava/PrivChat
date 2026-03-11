defmodule PrivchatBackendWeb.ChatController do
  use PrivchatBackendWeb, :controller

  alias PrivchatBackend.Messaging

  def index(%{assigns: %{current_user: user}} = conn, _params) do
    chats = Messaging.list_chats_for_user(user.id)
    json(conn, %{chats: chats})
  end

  def index(conn, _), do: unauthorized(conn)

  def create(%{assigns: %{current_user: user}} = conn, %{"name" => name}) do
    case Messaging.create_chat(user.id, %{"name" => name}) do
      {:ok, chat} ->
        json(conn, %{chat: chat})

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
end

