defmodule PrivchatBackendWeb.UserController do
  use PrivchatBackendWeb, :controller

  alias PrivchatBackend.Accounts

  def search(%{assigns: %{current_user: user}} = conn, %{"q" => query}) do
    results =
      query
      |> String.trim()
      |> case do
        "" -> []
        q -> Accounts.search_users(q, user.id)
      end

    json(conn, %{results: results})
  rescue
    e ->
      conn
      |> put_status(:bad_request)
      |> json(%{error: "search_failed", detail: inspect(e)})
  end

  def search(conn, _), do: unauthorized(conn)

  def contacts(%{assigns: %{current_user: user}} = conn, _params) do
    contacts =
      Accounts.list_contacts(user.id)
      |> Enum.map(&contact_payload/1)

    json(conn, %{contacts: contacts})
  end

  def contacts(conn, _), do: unauthorized(conn)

  def add_contact(%{assigns: %{current_user: user}} = conn, %{"user_id" => target_id}) do
    with {target_id_int, ""} <- Integer.parse(to_string(target_id)),
         result <- Accounts.add_contact(user.id, target_id_int) do
      case result do
        {:ok, contacts} ->
          conn
          |> json(%{contacts: Enum.map(contacts, &contact_payload/1)})

        {:error, :self} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: "cannot_add_self"})

        {:error, %Ecto.Changeset{} = changeset} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{errors: format_changeset_errors(changeset)})

        {:error, reason} ->
          conn
          |> put_status(:bad_request)
          |> json(%{error: inspect(reason)})

        contacts when is_list(contacts) ->
          conn
          |> json(%{contacts: Enum.map(contacts, &contact_payload/1)})
      end
    else
      _ ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "invalid_target"})
    end
  end

  def add_contact(conn, _), do: unauthorized(conn)

  defp contact_payload(contact) do
    %{
      id: contact.id,
      user_id: contact.user_id,
      contact_id: contact.contact_id,
      status: contact.status,
      inserted_at: contact.inserted_at,
      user: %{
        id: contact.contact.id,
        display_name: contact.contact.display_name,
        username: contact.contact.username,
        phone: contact.contact.phone
      }
    }
  end

  defp unauthorized(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: "unauthorized"})
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end
end
