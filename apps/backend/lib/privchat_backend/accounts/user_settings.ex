defmodule PrivchatBackend.Accounts.UserSettings do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :theme, :primary_color, :font_size, :density]}
  schema "user_settings" do
    field :theme, :string, default: "light"
    field :primary_color, :string, default: "#6366f1"
    field :font_size, :string, default: "md"
    field :density, :string, default: "comfortable"

    belongs_to :user, PrivchatBackend.Accounts.User

    timestamps()
  end

  def changeset(settings, attrs) do
    settings
    |> cast(attrs, [:theme, :primary_color, :font_size, :density])
    |> validate_inclusion(:theme, ["light", "dark"])
    |> validate_inclusion(:font_size, ["sm", "md", "lg"])
    |> validate_inclusion(:density, ["compact", "comfortable"])
  end
end

