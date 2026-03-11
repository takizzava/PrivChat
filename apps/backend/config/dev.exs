import Config

config :privchat_backend, PrivchatBackendWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 4000],
  debug_errors: true,
  secret_key_base: "dev_secret_key_base_should_be_overridden"

config :privchat_backend, PrivchatBackend.Repo,
  username: System.get_env("POSTGRES_USER", "postgres"),
  password: System.get_env("POSTGRES_PASSWORD", "123698745"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database: System.get_env("POSTGRES_DB", "privchat_dev"),
  pool_size: 10,
  show_sensitive_data_on_connection_error: true
