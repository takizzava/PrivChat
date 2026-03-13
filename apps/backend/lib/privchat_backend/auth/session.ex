defmodule PrivchatBackend.Auth.Session do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder,
           only: [:id, :user_id, :device_label, :user_agent, :ip, :expires_at, :revoked_at, :last_seen_at, :inserted_at]}
  schema "sessions" do
    field :token_hash, :string
    field :device_label, :string
    field :user_agent, :string
    field :ip, :string
    field :expires_at, :naive_datetime
    field :revoked_at, :naive_datetime
    field :last_seen_at, :naive_datetime

    belongs_to :user, PrivchatBackend.Accounts.User

    timestamps()
  end

  def changeset(session, attrs) do
    session
    |> cast(attrs, [:user_id, :token_hash, :device_label, :user_agent, :ip, :expires_at, :revoked_at, :last_seen_at])
    |> validate_required([:user_id, :token_hash])
  end
end
