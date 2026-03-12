defmodule PrivchatBackend.Messaging.ChatMember do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :chat_id, :user_id, :inserted_at]}
  schema "chat_members" do
    belongs_to :chat, PrivchatBackend.Messaging.Chat
    belongs_to :user, PrivchatBackend.Accounts.User

    timestamps(updated_at: false)
  end

  def changeset(member, attrs) do
    member
    |> cast(attrs, [:chat_id, :user_id])
    |> validate_required([:chat_id, :user_id])
    |> unique_constraint([:chat_id, :user_id])
  end
end
