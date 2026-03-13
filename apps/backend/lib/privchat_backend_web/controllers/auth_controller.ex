defmodule PrivchatBackendWeb.AuthController do
  use PrivchatBackendWeb, :controller

  alias PrivchatBackend.Accounts
  alias PrivchatBackend.Auth.{Token, SessionManager}
  alias PrivchatBackend.Security

  def register(conn, params) do
    case Accounts.register_user(params) do
      {:ok, user} ->
        with {:ok, session, _raw} <- SessionManager.create_session(user.id, session_attrs(conn)),
             {:ok, jwt} <- Token.generate(user, session) do
          json(conn, %{token: jwt, user: user, session_id: session.id})
        else
          _ ->
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

  def login(conn, %{"identifier" => identifier, "password" => pwd} = params) do
    case Accounts.authenticate_user(identifier, pwd) do
      {:ok, user} ->
        with :ok <- ensure_second_factor(user, Map.get(params, "otp")),
             {:ok, session, _raw} <- SessionManager.create_session(user.id, session_attrs(conn)),
             {:ok, jwt} <- Token.generate(user, session) do
          json(conn, %{token: jwt, user: user, session_id: session.id})
        else
          {:error, :otp_required} ->
            conn |> put_status(:unauthorized) |> json(%{error: "otp_required"})

          {:error, :invalid_code} ->
            conn |> put_status(:unauthorized) |> json(%{error: "invalid_otp"})

          _ ->
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

  def setup_2fa(%{assigns: %{current_user: user}} = conn, _params) do
    case Accounts.init_two_factor(user.id) do
      {:ok, info} -> json(conn, info)
      {:error, _} -> conn |> put_status(:bad_request) |> json(%{error: "cannot_init_2fa"})
    end
  end

  def confirm_2fa(%{assigns: %{current_user: user}} = conn, %{"code" => code}) do
    case Accounts.confirm_two_factor(user.id, code) do
      {:ok, _} -> json(conn, %{ok: true})
      {:error, _} -> conn |> put_status(:unprocessable_entity) |> json(%{error: "invalid_code"})
    end
  end

  def disable_2fa(%{assigns: %{current_user: user}} = conn, params) do
    code = Map.get(params, "code")

    case Accounts.disable_two_factor(user.id, code) do
      {:ok, _} -> json(conn, %{ok: true})
      {:error, _} -> conn |> put_status(:unauthorized) |> json(%{error: "invalid_code"})
    end
  end

  def sessions(%{assigns: %{current_user: user}} = conn, _params) do
    sessions = SessionManager.list_sessions(user.id)
    json(conn, %{sessions: sessions})
  end

  def revoke_session(%{assigns: %{current_user: user}} = conn, %{"id" => id}) do
    case SessionManager.revoke_session(String.to_integer(to_string(id))) do
      {:ok, session} when session.user_id == user.id ->
        json(conn, %{ok: true})

      _ ->
        conn |> put_status(:unauthorized) |> json(%{error: "invalid_session"})
    end
  end

  def key_backup(%{assigns: %{current_user: user}} = conn, _params) do
    case Security.get_backup(user.id) do
      nil -> json(conn, %{backup: nil})
      backup -> json(conn, %{backup: backup})
    end
  end

  def put_key_backup(%{assigns: %{current_user: user}} = conn, params) do
    blob = Map.get(params, "blob")

    if is_binary(blob) do
      version = Map.get(params, "version", "v1")
      fingerprint = Map.get(params, "fingerprint")
      salt = Map.get(params, "salt")
      iv = Map.get(params, "iv")

      case Security.upsert_key_backup(user.id, blob, version, fingerprint, salt, iv) do
        {:ok, backup} -> json(conn, %{backup: backup})
        {:error, changeset} -> conn |> put_status(:unprocessable_entity) |> json(%{errors: format_changeset_errors(changeset)})
      end
    else
      conn |> put_status(:bad_request) |> json(%{error: "invalid_blob"})
    end
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

  defp ensure_second_factor(%{two_factor_enabled: false}, _), do: :ok

  defp ensure_second_factor(%{two_factor_enabled: true} = user, code) when is_binary(code) do
    case Accounts.verify_second_factor(user, code) do
      {:ok, _} -> :ok
      _ -> {:error, :invalid_code}
    end
  end

  defp ensure_second_factor(_user, _code), do: {:error, :otp_required}

  defp session_attrs(conn) do
    ua = Plug.Conn.get_req_header(conn, "user-agent") |> List.first()
    ip =
      case conn.remote_ip do
        nil -> nil
        tuple -> :inet.ntoa(tuple) |> to_string()
      end

    %{
      user_agent: ua,
      ip: ip,
      device_label: Plug.Conn.get_req_header(conn, "x-device-label") |> List.first()
    }
  end
end
