defmodule PrivchatBackend.Repo.Migrations.NormalizeUsernamesAndPhones do
  use Ecto.Migration

  def change do
    execute("""
    UPDATE users
    SET
      username = lower(trim(username)),
      phone = regexp_replace(coalesce(phone, ''), '[^0-9+]', '', 'g'),
      display_name = COALESCE(display_name, trim(username))
    WHERE username IS NOT NULL;
    """)
  end
end
