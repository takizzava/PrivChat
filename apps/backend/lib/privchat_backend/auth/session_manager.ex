defmodule PrivchatBackend.Auth.SessionManager do
  @moduledoc """
  Stateful helpers for device/session limits.
  """
  import Ecto.Query
  alias PrivchatBackend.{Repo, Accounts}
  alias PrivchatBackend.Auth.Session
  alias Ecto.Changeset

  @default_ttl_days 14

  def create_session(user_id, attrs \\ %{}) do
    token = generate_token()
    hash = hash(token)
    expires_at = NaiveDateTime.utc_now() |> NaiveDateTime.add(@default_ttl_days * 86_400, :second)

    params =
      attrs
      |> Map.put(:user_id, user_id)
      |> Map.put(:token_hash, hash)
      |> Map.put(:expires_at, expires_at)
      |> Map.put(:last_seen_at, NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second))

    with {:ok, session} <- %Session{} |> Session.changeset(params) |> Repo.insert(),
         :ok <- enforce_limit(user_id) do
      {:ok, session, token}
    end
  end

  def validate_session(nil), do: {:error, :invalid_session}

  def validate_session(session_id) do
    case Repo.get(Session, session_id) do
      %Session{revoked_at: nil, expires_at: exp} = s ->
        if NaiveDateTime.compare(exp, NaiveDateTime.utc_now()) == :gt do
          {:ok, s}
        else
          {:error, :expired}
        end

      _ ->
        {:error, :invalid_session}
    end
  end

  def revoke_session(session_id) do
    case Repo.get(Session, session_id) do
      %Session{} = s ->
        s
        |> Changeset.change(revoked_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second))
        |> Repo.update()

      _ ->
        {:error, :not_found}
    end
  end

  def touch_session(session_id) do
    from(s in Session, where: s.id == ^session_id)
    |> Repo.update_all(set: [last_seen_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)])
    :ok
  end

  def list_sessions(user_id) do
    from(s in Session, where: s.user_id == ^user_id, order_by: [desc: s.inserted_at])
    |> Repo.all()
  end

  defp enforce_limit(user_id) do
    limit =
      case Accounts.get_user(user_id) do
        %{device_limit: dl} when is_integer(dl) and dl > 0 -> dl
        _ -> 5
      end

    query =
      from(s in Session,
        where: s.user_id == ^user_id and is_nil(s.revoked_at),
        order_by: [desc: s.last_seen_at, desc: s.inserted_at]
      )

    sessions = Repo.all(query)

    if length(sessions) > limit do
      sessions
      |> Enum.drop(limit)
      |> Enum.each(fn s ->
        revoke_session(s.id)
      end)
    end

    :ok
  end

  defp generate_token do
    :crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false)
  end

  def hash(token) do
    :crypto.hash(:sha256, token) |> Base.encode16(case: :lower)
  end
end
