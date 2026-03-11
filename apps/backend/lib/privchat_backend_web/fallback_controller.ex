defmodule PrivchatBackendWeb.FallbackController do
  use PrivchatBackendWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: changeset})
  end

  def call(conn, {:error, :not_found}) do
    send_resp(conn, :not_found, "")
  end
end

