defmodule PrivchatBackendWeb.Router do
  use PrivchatBackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_current_user
  end

  scope "/api", PrivchatBackendWeb do
    pipe_through :api

    post "/auth/register", AuthController, :register
    post "/auth/login", AuthController, :login
    post "/auth/2fa/setup", AuthController, :setup_2fa
    post "/auth/2fa/confirm", AuthController, :confirm_2fa
    post "/auth/2fa/disable", AuthController, :disable_2fa
    get "/auth/sessions", AuthController, :sessions
    post "/auth/sessions/:id/revoke", AuthController, :revoke_session
    get "/auth/key-backup", AuthController, :key_backup
    put "/auth/key-backup", AuthController, :put_key_backup
    get "/users/search", UserController, :search
    get "/contacts", UserController, :contacts
    post "/contacts", UserController, :add_contact
    post "/uploads", UploadController, :create

    get "/chats", ChatController, :index
    post "/chats", ChatController, :create

    get "/chats/:id/messages", MessageController, :index
    post "/chats/:id/messages", MessageController, :create
    put "/chats/:id/messages/:message_id", MessageController, :update
    post "/chats/:id/messages/:message_id/forward", MessageController, :forward
    post "/chats/:id/messages/:message_id/reactions", MessageController, :react
    delete "/chats/:id/messages/:message_id/reactions/:emoji", MessageController, :unreact

    get "/settings", AuthController, :settings
    put "/settings", AuthController, :update_settings
  end

  defp fetch_current_user(conn, _opts) do
    with ["Bearer " <> token] <- Plug.Conn.get_req_header(conn, "authorization"),
         {:ok, %{"sub" => user_id, "sid" => sid}} <- PrivchatBackend.Auth.Token.verify(token),
         {:ok, _session} <- PrivchatBackend.Auth.SessionManager.validate_session(sid),
         user <- PrivchatBackend.Accounts.get_user!(user_id) do
      PrivchatBackend.Auth.SessionManager.touch_session(sid)

      conn
      |> Plug.Conn.assign(:current_user, user)
      |> Plug.Conn.assign(:session_id, sid)
    else
      _ -> conn
    end
  end
end
