defmodule PrivchatBackend.Accounts.Contact do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :id, autogenerate: true}
  @derive {Jason.Encoder, only: [:id, :user_id, :contact_id, :status, :inserted_at]}
  schema "contacts" do
    field :status, :string, default: "accepted"

    belongs_to :user, PrivchatBackend.Accounts.User
    belongs_to :contact, PrivchatBackend.Accounts.User

    timestamps()
  end

  def changeset(contact, attrs) do
    contact
    |> cast(attrs, [:user_id, :contact_id, :status])
    |> validate_required([:user_id, :contact_id, :status])
    |> validate_inclusion(:status, ["accepted", "pending", "blocked"])
    |> check_constraint(:user_id, name: :no_self_contact)
    |> unique_constraint([:user_id, :contact_id])
  end
end
