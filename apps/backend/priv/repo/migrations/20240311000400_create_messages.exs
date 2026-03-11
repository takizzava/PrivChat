defmodule PrivchatBackend.Repo.Migrations.CreateMessages do
  use Ecto.Migration

  def change do
    create table(:messages) do
      add :body, :text
      add :encrypted, :boolean, default: false, null: false
      add :envelope_metadata, :map, default: %{}, null: false

      add :chat_id, references(:chats, on_delete: :delete_all), null: false
      add :sender_id, references(:users, on_delete: :nilify_all), null: false

      timestamps()
    end

    create index(:messages, [:chat_id])
    create index(:messages, [:sender_id])
  end
end

