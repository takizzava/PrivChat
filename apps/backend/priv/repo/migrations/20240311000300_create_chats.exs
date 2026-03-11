defmodule PrivchatBackend.Repo.Migrations.CreateChats do
  use Ecto.Migration

  def change do
    create table(:chats) do
      add :name, :string, null: false
      add :owner_id, references(:users, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:chats, [:owner_id])
  end
end

