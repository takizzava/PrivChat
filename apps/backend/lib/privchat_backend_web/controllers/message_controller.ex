defmodule PrivchatBackendWeb.MessageController do
  use PrivchatBackendWeb, :controller

  alias PrivchatBackend.Messaging

  def index(%{assigns: %{current_user: user}} = conn, %{"id" => chat_id}) do
    chat_id_int = String.to_integer(to_string(chat_id))

    if Messaging.member?(chat_id_int, user.id) do
      messages = Messaging.list_messages(chat_id_int, user.id)
      json(conn, %{messages: messages})
    else
      unauthorized(conn)
    end
  end

  def index(conn, _), do: unauthorized(conn)

  def create(%{assigns: %{current_user: user}} = conn, %{"id" => chat_id} = params) do
    chat_id_int = String.to_integer(to_string(chat_id))

    attrs = %{
      "body" => Map.get(params, "body", ""),
      "encrypted" => Map.get(params, "encrypted", false),
      "envelope_metadata" => Map.get(params, "envelope_metadata", %{})
    }

    case Messaging.create_message(user.id, chat_id_int, attrs) do
      {:ok, message} ->
        PrivchatBackendWeb.Endpoint.broadcast!("chat:#{chat_id_int}", "message:new", %{
          id: message.id,
          body: message.body,
          sender_id: message.sender_id,
          chat_id: message.chat_id,
          inserted_at: message.inserted_at,
          encrypted: message.encrypted,
          envelope_metadata: message.envelope_metadata
        })

        json(conn, %{message: message})

      {:error, :forbidden} ->
        unauthorized(conn)

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
