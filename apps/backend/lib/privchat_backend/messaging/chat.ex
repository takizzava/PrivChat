defmodule PrivchatBackend.Messaging.Chat do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :name, :kind, :member_ids, :owner_id, :inserted_at, :updated_at]}
  schema "chats" do
    field :name, :string
    field :kind, :string, default: "direct"
    field :direct_key, :string
    field :member_ids, {:array, :integer}, virtual: true, default: []

    belongs_to :owner, PrivchatBackend.Accounts.User
    has_many :messages, PrivchatBackend.Messaging.Message
    has_many :members, PrivchatBackend.Messaging.ChatMember

    timestamps()
  end

  def changeset(chat, attrs) do
    chat
    |> cast(attrs, [:name, :owner_id, :kind, :direct_key])
    |> validate_required([:name, :owner_id, :kind])
    |> validate_inclusion(:kind, ["direct", "group"])
    |> unique_constraint(:direct_key)
  end
end
