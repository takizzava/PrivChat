defmodule PrivchatBackend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :email, :phone, :username, :display_name, :inserted_at]}
  schema "users" do
    field :email, :string
    field :password_hash, :string
    field :password, :string, virtual: true
    field :display_name, :string
    field :phone, :string
    field :username, :string

    has_many :chats, PrivchatBackend.Messaging.Chat, foreign_key: :owner_id
    has_one :user_settings, PrivchatBackend.Accounts.UserSettings

    timestamps()
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :display_name, :phone, :username])
    |> update_change(:phone, &PrivchatBackend.Accounts.normalize_phone/1)
    |> update_change(:username, fn u -> u |> String.trim() |> String.downcase() end)
    |> update_change(:email, fn e -> e && e |> String.trim() |> String.downcase() end)
    |> update_change(:display_name, fn d -> d && String.trim(d) end)
    |> validate_required([:password, :phone, :username])
    |> validate_format(:phone, ~r/^\+?\d{10,15}$/)
    |> validate_length(:username, min: 3, max: 20)
    |> validate_format(:username, ~r/^[a-zA-Z0-9_\.]+$/)
    |> put_default_display_name()
    |> unique_constraint(:email)
    |> unique_constraint(:phone)
    |> unique_constraint(:username)
    |> validate_length(:password, min: 8)
    |> put_password_hash()
  end

  defp put_default_display_name(changeset) do
    case {get_field(changeset, :display_name), get_field(changeset, :username)} do
      {nil, username} when is_binary(username) ->
        put_change(changeset, :display_name, username)

      _ ->
        changeset
    end
  end

  defp put_password_hash(changeset) do
    if pwd = get_change(changeset, :password) do
      change(changeset, password_hash: Pbkdf2.hash_pwd_salt(pwd))
    else
      changeset
    end
  end
end
