defmodule PrivchatBackend.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :email, :display_name, :inserted_at]}
  schema "users" do
    field :email, :string
    field :password_hash, :string
    field :password, :string, virtual: true
    field :display_name, :string

    has_many :chats, PrivchatBackend.Messaging.Chat, foreign_key: :owner_id
    has_one :user_settings, PrivchatBackend.Accounts.UserSettings

    timestamps()
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :display_name])
    |> validate_required([:email, :password])
    |> unique_constraint(:email)
    |> validate_length(:password, min: 8)
    |> put_password_hash()
  end

  defp put_password_hash(changeset) do
    if pwd = get_change(changeset, :password) do
      change(changeset, password_hash: Pbkdf2.hash_pwd_salt(pwd))
    else
      changeset
    end
  end
end

