defmodule PrivchatBackend.Auth.Token do
  @moduledoc """
  Minimal JWT helper using JOSE directly.
  Used only for auth; NOT for E2EE.
  """

  @algo "HS256"

  defp secret! do
    Application.fetch_env!(:privchat_backend, __MODULE__)[:secret_key]
  end

  defp jwk do
    # HMAC shared secret
    JOSE.JWK.from_oct(secret!())
  end

  @spec generate(%{id: any()}) :: {:ok, String.t()} | {:error, term()}
  def generate(user) do
    claims = %{"sub" => user.id}

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
        {:ok, claims}

      {false, _, _} ->
        {:error, :invalid_token}
    end
  rescue
    _ -> {:error, :invalid_token}
  end
end




