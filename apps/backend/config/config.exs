import Config

config :privchat_backend,
  ecto_repos: [PrivchatBackend.Repo]

config :privchat_backend, PrivchatBackendWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [view: PrivchatBackendWeb.ErrorView, accepts: ~w(json), layout: false],
  pubsub_server: PrivchatBackend.PubSub

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"

