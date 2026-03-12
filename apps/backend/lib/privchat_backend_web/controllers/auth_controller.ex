defmodule PrivchatBackendWeb.AuthController do
  use PrivchatBackendWeb, :controller

  alias PrivchatBackend.Accounts
  alias PrivchatBackend.Auth.Token

  def register(conn, params) do
    case Accounts.register_user(params) do
      {:ok, user} ->
        case Token.generate(user) do
          {:ok, jwt} ->
            json(conn, %{token: jwt, user: user})

          {:error, _reason} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "token_generation_failed"})
        end

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_changeset_errors(changeset)})
    end
  end

  def login(conn, %{"identifier" => identifier, "password" => pwd}) do
    case Accounts.authenticate_user(identifier, pwd) do
      {:ok, user} ->
        case Token.generate(user) do
          {:ok, jwt} ->
            json(conn, %{token: jwt, user: user})

          {:error, _reason} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "token_generation_failed"})
        end

      {:error, :unauthorized} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "invalid_credentials"})
    end
  end

  def login(conn, %{"email" => email, "password" => pwd}) do
    login(conn, %{"identifier" => email, "password" => pwd})
  end

  def settings(%{assigns: %{current_user: user}} = conn, _params) do
    settings = Accounts.get_settings!(user.id)
    json(conn, %{settings: settings})
  end

  def settings(conn, _), do: unauthorized(conn)

  def update_settings(%{assigns: %{current_user: user}} = conn, params) do
    case Accounts.update_settings(user.id, params) do
      {:ok, settings} ->
        json(conn, %{settings: settings})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_changeset_errors(changeset)})
    end
  end

  def update_settings(conn, _), do: unauthorized(conn)

  defp unauthorized(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: "unauthorized"})
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)
  end
end
