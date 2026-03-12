defmodule PrivchatBackend.Repo.Migrations.AddPhoneAndUsernameToUsers do
  use Ecto.Migration

  def change do
    # 1) добавляем nullable, чтобы не падать на старых данных
    alter table(:users) do
      modify :email, :string, null: true
      add :phone, :string
      add :username, :string
      modify :display_name, :string, null: true
    end

    # 2) заполняем пропущенные значения для уже существующих строк
    execute("""
    UPDATE users
    SET phone = COALESCE(phone, CONCAT('+1000000000', id)),
        username = COALESCE(username, CONCAT('user', id)),
        display_name = COALESCE(display_name, username)
    """)

    # 3) делаем поля обязательными
    alter table(:users) do
      modify :phone, :string, null: false
      modify :username, :string, null: false
    end

    drop_if_exists unique_index(:users, [:email])
    create unique_index(:users, [:email], where: "email IS NOT NULL")
    create unique_index(:users, [:phone])
    create unique_index(:users, [:username])
  end
end
