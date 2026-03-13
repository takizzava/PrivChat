defmodule PrivchatBackend.Repo.Migrations.AddSessionsAndKeyBackups do
  use Ecto.Migration

  def change do
    create table(:sessions) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :token_hash, :string, null: false
      add :device_label, :string
      add :user_agent, :text
      add :ip, :string
      add :expires_at, :naive_datetime
      add :revoked_at, :naive_datetime
      add :last_seen_at, :naive_datetime

      timestamps()
    end

    create index(:sessions, [:user_id])
    create unique_index(:sessions, [:token_hash])

    create table(:key_backups) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :encrypted_blob, :text, null: false
      add :version, :string, default: "v1", null: false
      add :key_fingerprint, :string
      add :salt, :string
      add :iv, :string

      timestamps()
    end

    create unique_index(:key_backups, [:user_id])
  end
end
