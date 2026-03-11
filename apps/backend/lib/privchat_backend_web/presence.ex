defmodule PrivchatBackendWeb.Presence do
  use Phoenix.Presence,
    otp_app: :privchat_backend,
    pubsub_server: PrivchatBackend.PubSub
end

