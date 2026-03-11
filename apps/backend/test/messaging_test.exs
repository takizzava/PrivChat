defmodule PrivchatBackend.MessagingTest do
  use ExUnit.Case, async: true
  alias PrivchatBackend.{Accounts, Messaging}

  setup do
    {:ok, user} =
      Accounts.register_user(%{
        "email" => "chat@example.com",
        "password" => "password123",
        "display_name" => "Chatter"
      })

    {:ok, chat} = Messaging.create_chat(user.id, %{"name" => "Test Chat"})
    {:ok, user: user, chat: chat}
  end

  test "create and list messages", %{user: user, chat: chat} do
    {:ok, msg} =
      Messaging.create_message(user.id, chat.id, %{
        "body" => "Hello",
        "encrypted" => false,
        "envelope_metadata" => %{}
      })

    assert msg.body == "Hello"

    msgs = Messaging.list_messages(chat.id)
    assert length(msgs) == 1
  end
end

