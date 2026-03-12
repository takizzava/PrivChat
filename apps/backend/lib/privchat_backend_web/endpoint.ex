defmodule PrivchatBackendWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :privchat_backend

  socket "/socket", PrivchatBackendWeb.UserSocket,
    websocket: true,
    longpoll: false

  plug Plug.Static,
    at: "/",
    from: :privchat_backend,
    gzip: false,
    only: ~w(uploads)

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug CORSPlug, origin: ["*"]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Jason

  plug Plug.MethodOverride
  plug Plug.Head

  plug PrivchatBackendWeb.Router
end

