defmodule PrivchatBackend.Security.KeyBackup do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder,
           only: [
             :id,
             :user_id,
             :version,
             :key_fingerprint,
             :encrypted_blob,
             :salt,
             :iv,
             :inserted_at,
             :updated_at
           ]}
  schema "key_backups" do
    field :encrypted_blob, :string
    field :version, :string, default: "v1"
    field :key_fingerprint, :string
    field :salt, :string
    field :iv, :string

    belongs_to :user, PrivchatBackend.Accounts.User

    timestamps()
  end

  def changeset(backup, attrs) do
    backup
    |> cast(attrs, [:user_id, :encrypted_blob, :version, :key_fingerprint, :salt, :iv])
    |> validate_required([:user_id, :encrypted_blob, :version, :salt, :iv])
  end
end
