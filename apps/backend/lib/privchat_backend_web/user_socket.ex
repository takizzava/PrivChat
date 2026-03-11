defmodule PrivchatBackendWeb.UserSocket do
  use Phoenix.Socket

  channel "chat:*", PrivchatBackendWeb.ChatChannel

  def connect(%{"token" => token}, socket, _connect_info) do
    with {:ok, %{"sub" => user_id}} <- PrivchatBackend.Auth.Token.verify(token) do
      {:ok, Phoenix.Socket.assign(socket, :user_id, user_id)}
    else
      _ -> :error
    end
  end

  def id(socket), do: "user_socket:#{socket.assigns.user_id}"
end

