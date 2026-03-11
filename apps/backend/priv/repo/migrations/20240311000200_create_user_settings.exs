defmodule PrivchatBackend.Repo.Migrations.CreateUserSettings do
  use Ecto.Migration

  def change do
    create table(:user_settings) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :theme, :string, default: "light"
      add :primary_color, :string, default: "#6366f1"
      add :font_size, :string, default: "md"
      add :density, :string, default: "comfortable"

      timestamps()
    end

    create unique_index(:user_settings, [:user_id])
  end
end

