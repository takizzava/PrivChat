defmodule PrivchatBackend.Repo do
  use Ecto.Repo,
    otp_app: :privchat_backend,
    adapter: Ecto.Adapters.Postgres
end

