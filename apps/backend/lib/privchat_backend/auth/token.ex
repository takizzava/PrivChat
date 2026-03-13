defmodule PrivchatBackend.Auth.Token do
  @moduledoc """
  Minimal JWT helper using JOSE directly.
  Used only for auth; NOT for E2EE.
  """

  @algo "HS256"

  @ttl_seconds 60 * 60 * 24 * 14

  defp secret! do
    Application.fetch_env!(:privchat_backend, __MODULE__)[:secret_key]
  end

  defp jwk do
    # HMAC shared secret
    JOSE.JWK.from_oct(secret!())
  end

  @spec generate(%{id: any()}, map() | nil) :: {:ok, String.t()} | {:error, term()}
  def generate(user, session \\ nil) do
    now = System.os_time(:second)
    claims =
      %{"sub" => user.id, "exp" => now + @ttl_seconds}
      |> maybe_put_session(session)

    try do
      {_, token} =
        jwk()
        |> JOSE.JWT.sign(%{"alg" => @algo, "typ" => "JWT"}, claims)
        |> JOSE.JWS.compact()

      {:ok, token}
    rescue
      e -> {:error, e}
    end
  end

  @spec verify(String.t()) :: {:ok, map()} | {:error, term()}
  def verify(token) do
    case JOSE.JWT.verify_strict(jwk(), [@algo], token) do
      {true, %JOSE.JWT{fields: claims}, _jws} ->
        if expired?(claims) do
          {:error, :expired}
        else
          {:ok, claims}
        end

      {false, _, _} ->
        {:error, :invalid_token}
    end
  rescue
    _ -> {:error, :invalid_token}
  end

  defp expired?(%{"exp" => exp}) when is_integer(exp) do
    exp <= System.os_time(:second)
  end

  defp expired?(_), do: false

  defp maybe_put_session(claims, nil), do: claims
  defp maybe_put_session(claims, %{id: sid}), do: Map.put(claims, "sid", sid)
end



