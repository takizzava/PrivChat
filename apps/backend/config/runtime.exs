import Config

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise "DATABASE_URL env var is required"

  config :privchat_backend, PrivchatBackend.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise "SECRET_KEY_BASE env var is required"

  config :privchat_backend, PrivchatBackendWeb.Endpoint,
    http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT") || "4000")],
    secret_key_base: secret_key_base
end

jwt_secret =
  System.get_env("JWT_SECRET") ||
    "dev_jwt_secret_change_me"

config :privchat_backend, PrivchatBackend.Auth.Token,
  secret_key: jwt_secret

cdn_host = System.get_env("CDN_HOST")

if cdn_host do
  config :privchat_backend, :cdn_host, cdn_host
end
