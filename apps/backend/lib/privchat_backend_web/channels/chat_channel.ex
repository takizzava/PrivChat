defmodule PrivchatBackendWeb.ChatChannel do
  use PrivchatBackendWeb, :channel
  alias PrivchatBackend.Messaging
  alias PrivchatBackendWeb.Presence

  @impl true
  def join("chat:" <> chat_id, _params, socket) do
    send(self(), {:after_join, chat_id})
    {:ok, Phoenix.Socket.assign(socket, :chat_id, String.to_integer(chat_id))}
  end

  @impl true
  def handle_info({:after_join, chat_id}, socket) do
    {:ok, _} =
      Presence.track(socket, "user:#{socket.assigns.user_id}", %{
        online_at: inspect(System.system_time(:second)),
        chat_id: chat_id
      })

    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  @impl true
  def handle_in("message:new", %{"body" => body} = payload, socket) do
    user_id = socket.assigns.user_id
    chat_id = socket.assigns.chat_id

    encrypted = Map.get(payload, "encrypted", false)
    env_meta = Map.get(payload, "envelope_metadata", %{})

    {:ok, msg} =
      Messaging.create_message(user_id, chat_id, %{
        "body" => body,
        "encrypted" => !!encrypted,
        "envelope_metadata" => env_meta
      })

    broadcast!(socket, "message:new", %{
      id: msg.id,
      body: msg.body,
      sender_id: msg.sender_id,
      chat_id: msg.chat_id,
      inserted_at: msg.inserted_at,
      encrypted: msg.encrypted,
      envelope_metadata: msg.envelope_metadata
    })

    {:noreply, socket}
  end
end

