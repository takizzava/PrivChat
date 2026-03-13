defmodule PrivchatBackend.Repo.Migrations.ExtendMessagesWithReactions do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :edited_at, :naive_datetime
      add :reactions, :map, default: %{}, null: false
      add :forwarded_from_id, references(:messages, on_delete: :nilify_all)
    end

    create index(:messages, [:forwarded_from_id])
  end
end
