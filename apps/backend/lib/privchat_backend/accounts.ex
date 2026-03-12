defmodule PrivchatBackend.Accounts do
  import Ecto.Query, warn: false
  alias PrivchatBackend.Repo
  alias PrivchatBackend.Accounts.{User, UserSettings, Contact}

  def get_user(id), do: Repo.get(User, id)
  def get_user!(id), do: Repo.get!(User, id)

  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  def get_user_by_phone(phone) when is_binary(phone) do
    normalized = normalize_phone(phone)
    Repo.get_by(User, phone: normalized)
  end

  def get_user_by_username(username) when is_binary(username) do
    Repo.get_by(User, username: String.downcase(username))
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

  def authenticate_user(identifier, password) do
    with %User{} = user <- get_by_identifier(identifier),
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

  def list_contacts(user_id) do
    from(c in Contact,
      where: c.user_id == ^user_id,
      join: u in assoc(c, :contact),
      preload: [contact: u],
      order_by: [desc: c.inserted_at]
    )
    |> Repo.all()
  rescue
    Postgrex.Error -> []
  end

  def add_contact(user_id, target_id) when user_id == target_id, do: {:error, :self}

  def add_contact(user_id, target_id) do
    Repo.transaction(fn ->
      with {:ok, _} <- upsert_contact(user_id, target_id),
           {:ok, _} <- upsert_contact(target_id, user_id) do
        list_contacts(user_id)
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  def search_users(query, current_user_id) when is_binary(query) do
    trimmed = String.trim(query)

    if trimmed == "" do
      []
    else
      normalized_phone = normalize_phone(trimmed)
      digits_only = trimmed |> String.replace(~r/[^0-9]/, "")
      pattern = "%#{trimmed}%"

      from(u in User,
        where: u.id != ^current_user_id,
        where:
          ilike(u.username, ^pattern) or
            ilike(u.display_name, ^pattern) or
            u.phone == ^normalized_phone or
            fragment("regexp_replace(?, '[^0-9]', '', 'g') = ?", u.phone, ^digits_only),
        select: %{id: u.id, username: u.username, display_name: u.display_name, phone: u.phone},
        limit: 20
      )
      |> Repo.all()
      |> Enum.map(fn u ->
        Map.put(u, :status, contact_status(current_user_id, u.id))
      end)
    end
  end

  def contact_status(user_id, target_id) do
    case Repo.get_by(Contact, user_id: user_id, contact_id: target_id) do
      %Contact{status: status} -> status
      _ -> "none"
    end
  rescue
    Postgrex.Error -> "none"
  end

  defp ensure_default_settings(%User{id: user_id}) do
    %UserSettings{user_id: user_id}
    |> UserSettings.changeset(%{})
    |> Repo.insert(on_conflict: :nothing)
  end

  defp upsert_contact(user_id, target_id) do
    %Contact{}
    |> Contact.changeset(%{user_id: user_id, contact_id: target_id, status: "accepted"})
    |> Repo.insert(on_conflict: {:replace_all_except, [:id, :inserted_at]}, conflict_target: [:user_id, :contact_id])
  end

  defp get_by_identifier(identifier) do
    get_user_by_email(identifier) ||
      get_user_by_phone(identifier) ||
      get_user_by_username(identifier)
  end

  def normalize_phone(phone) when is_binary(phone) do
    digits = phone |> String.replace(~r/[^0-9\+]/, "") |> String.trim()

    cond do
      digits == "" -> ""
      String.starts_with?(digits, "+") -> digits
      true -> "+" <> digits
    end
  end
end
