defmodule PrivchatBackend.AuthTest do
  use ExUnit.Case, async: true
  alias PrivchatBackend.Accounts
  alias PrivchatBackend.Auth.Token

  test "register and login user with JWT" do
    {:ok, user} =
      Accounts.register_user(%{
        "email" => "test@example.com",
        "password" => "password123",
        "display_name" => "Test"
      })

    {:ok, authed_user} = Accounts.authenticate_user("test@example.com", "password123")
    assert authed_user.id == user.id

    {:ok, jwt} = Token.generate(user)
    assert is_binary(jwt)

    {:ok, %{"sub" => sub}} = Token.verify(jwt)
    assert sub == user.id
  end
end

