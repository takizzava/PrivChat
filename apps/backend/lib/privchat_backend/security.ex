defmodule PrivchatBackend.Security do
  import Ecto.Query
  alias PrivchatBackend.Repo
  alias PrivchatBackend.Security.KeyBackup

  def upsert_key_backup(user_id, encrypted_blob, version \\ "v1", fingerprint \\ nil, salt \\ nil, iv \\ nil) do
    attrs = %{
      user_id: user_id,
      encrypted_blob: encrypted_blob,
      version: version,
      key_fingerprint: fingerprint,
      salt: salt,
      iv: iv
    }

    case Repo.get_by(KeyBackup, user_id: user_id) do
      nil ->
        %KeyBackup{} |> KeyBackup.changeset(attrs) |> Repo.insert()

      backup ->
        backup
        |> KeyBackup.changeset(attrs)
        |> Repo.update()
    end
  end

  def get_backup(user_id) do
    Repo.get_by(KeyBackup, user_id: user_id)
  end
end
