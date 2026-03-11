defmodule PrivchatBackendWeb.MessageController do
  use PrivchatBackendWeb, :controller

  alias PrivchatBackend.Messaging

  def index(%{assigns: %{current_user: _user}} = conn, %{"id" => chat_id}) do
    messages = Messaging.list_messages(String.to_integer(chat_id))
    json(conn, %{messages: messages})
  end

  def index(conn, _), do: unauthorized(conn)

  def create(%{assigns: %{current_user: user}} = conn, %{"id" => chat_id} = params) do
    attrs = %{
      "body" => Map.get(params, "body", ""),
      "encrypted" => Map.get(params, "encrypted", false),
      "envelope_metadata" => Map.get(params, "envelope_metadata", %{})
    }

    case Messaging.create_message(user.id, String.to_integer(chat_id), attrs) do
      {:ok, message} ->
        json(conn, %{message: message})

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

