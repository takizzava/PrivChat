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
    |> validate_message_has_content()
    |> validate_body_length_if_present()
  end

  defp validate_body_length_if_present(changeset) do
    case get_field(changeset, :body) do
      nil -> changeset
      "" -> changeset
      _ -> validate_length(changeset, :body, min: 1)
    end
  end

  defp validate_message_has_content(changeset) do
    body = get_field(changeset, :body)
    meta = get_field(changeset, :envelope_metadata) || %{}

    attachments =
      cond do
        is_map(meta) and Map.has_key?(meta, "attachments") -> Map.get(meta, "attachments")
        is_map(meta) and Map.has_key?(meta, :attachments) -> Map.get(meta, :attachments)
        true -> nil
      end

    has_body =
      body
      |> to_string()
      |> String.trim()
      |> case do
        "" -> false
        _ -> true
      end

    has_attachments = is_list(attachments) and length(attachments) > 0

    if has_body or has_attachments do
      changeset
    else
      add_error(changeset, :body, "can't be blank")
    end
  end
end
