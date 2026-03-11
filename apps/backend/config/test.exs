import Config

config :privchat_backend, PrivchatBackend.Repo,
  username: System.get_env("POSTGRES_USER", "privchat"),
  password: System.get_env("POSTGRES_PASSWORD", "privchat"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database: "privchat_test",
  pool: Ecto.Adapters.SQL.Sandbox

config :privchat_backend, PrivchatBackendWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4001],
  server: false

