defmodule PrivchatBackend.Repo.Migrations.AddChatKindAndMembers do
  use Ecto.Migration

  def change do
    alter table(:chats) do
      add :kind, :string, null: false, default: "direct"
      add :direct_key, :string
    end

    create table(:chat_members) do
      add :chat_id, references(:chats, on_delete: :delete_all), null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(updated_at: false)
    end

    create unique_index(:chat_members, [:chat_id, :user_id])
    create index(:chat_members, [:user_id])
    create unique_index(:chats, [:direct_key], where: "direct_key IS NOT NULL")

    execute("""
    INSERT INTO chat_members (chat_id, user_id, inserted_at)
    SELECT id, owner_id, NOW() FROM chats
    ON CONFLICT DO NOTHING;
    """)
  end
end
