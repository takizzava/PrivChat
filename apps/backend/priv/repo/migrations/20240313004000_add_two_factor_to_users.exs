defmodule PrivchatBackend.Repo.Migrations.AddTwoFactorToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :two_factor_enabled, :boolean, default: false, null: false
      add :two_factor_secret, :string
      add :recovery_codes, {:array, :string}, default: [], null: false
      add :device_limit, :integer, default: 5, null: false
      add :last_key_rotation_at, :naive_datetime
    end
  end
end
