alias PrivchatBackend.{Accounts, Messaging}

demo_users = [
  %{phone: "+70000000001", username: "demo1", password: "password123", display_name: "Демо 1", email: "demo1@example.com"},
  %{phone: "+70000000002", username: "demo2", password: "password123", display_name: "Демо 2", email: "demo2@example.com"}
]

created =
  Enum.map(demo_users, fn attrs ->
    Accounts.get_user_by_username(attrs.username) ||
      (Accounts.register_user(attrs) |> case do
        {:ok, user} -> user
        {:error, _} -> Accounts.get_user_by_username(attrs.username)
      end)
  end)
  |> Enum.reject(&is_nil/1)

case created do
  [u1, u2] ->
    Accounts.add_contact(u1.id, u2.id)
    {:ok, chat} = Messaging.create_direct_chat(u1.id, u2.id, %{name: "Демо чат"})
    Messaging.create_message(u1.id, chat.id, %{"body" => "Привет! Это демо-сообщение."})
    Messaging.create_message(u2.id, chat.id, %{"body" => "Ответ из второго аккаунта."})

  _ ->
    :ok
end
