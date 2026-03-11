defmodule PrivchatBackend.Messaging.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :body, :sender_id, :chat_id, :inserted_at, :encrypted, :envelope_metadata]}
  schema "messages" do
    field :body, :string
    field :encrypted, :boolean, default: false
    field :envelope_metadata, :map, default: %{}

    belongs_to :chat, PrivchatBackend.Messaging.Chat
    belongs_to :sender, PrivchatBackend.Accounts.User

    timestamps()
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:body, :chat_id, :sender_id, :encrypted, :envelope_metadata])
    |> validate_required([:chat_id, :sender_id])
  end
end

