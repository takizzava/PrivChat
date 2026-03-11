defmodule PrivchatBackend.Messaging.Chat do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :name, :inserted_at]}
  schema "chats" do
    field :name, :string

    belongs_to :owner, PrivchatBackend.Accounts.User
    has_many :messages, PrivchatBackend.Messaging.Message

    timestamps()
  end

  def changeset(chat, attrs) do
    chat
    |> cast(attrs, [:name, :owner_id])
    |> validate_required([:name, :owner_id])
  end
end

