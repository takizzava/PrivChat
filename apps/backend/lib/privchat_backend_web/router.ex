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
    get "/users/search", UserController, :search
    get "/contacts", UserController, :contacts
    post "/contacts", UserController, :add_contact
    post "/uploads", UploadController, :create

    get "/chats", ChatController, :index
    post "/chats", ChatController, :create

    get "/chats/:id/messages", MessageController, :index
    post "/chats/:id/messages", MessageController, :create

    get "/settings", AuthController, :settings
    put "/settings", AuthController, :update_settings
  end

  defp fetch_current_user(conn, _opts) do
    with ["Bearer " <> token] <- Plug.Conn.get_req_header(conn, "authorization"),
         {:ok, %{"sub" => user_id}} <- PrivchatBackend.Auth.Token.verify(token),
         user <- PrivchatBackend.Accounts.get_user!(user_id) do
      Plug.Conn.assign(conn, :current_user, user)
    else
      _ -> conn
    end
  end
end
