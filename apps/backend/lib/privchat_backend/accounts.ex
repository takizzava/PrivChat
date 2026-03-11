defmodule PrivchatBackend.Accounts do
  import Ecto.Query, warn: false
  alias PrivchatBackend.Repo
  alias PrivchatBackend.Accounts.{User, UserSettings}

  def get_user!(id), do: Repo.get!(User, id)

  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  def register_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, user} ->
        ensure_default_settings(user)
        {:ok, user}

      error ->
        error
    end
  end

  def authenticate_user(email, password) do
    with %User{} = user <- get_user_by_email(email),
         true <- Pbkdf2.verify_pass(password, user.password_hash) do
      {:ok, user}
    else
      _ -> {:error, :unauthorized}
    end
  end

  def get_settings!(user_id) do
    Repo.get_by!(UserSettings, user_id: user_id)
  end

  def update_settings(user_id, attrs) do
    settings = get_settings!(user_id)

    settings
    |> UserSettings.changeset(attrs)
    |> Repo.update()
  end

  defp ensure_default_settings(%User{id: user_id}) do
    %UserSettings{user_id: user_id}
    |> UserSettings.changeset(%{})
    |> Repo.insert(on_conflict: :nothing)
  end
end

