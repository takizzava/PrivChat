defmodule PrivchatBackendWeb.UploadController do
  use PrivchatBackendWeb, :controller

  def create(%{assigns: %{current_user: _user}} = conn, %{"file" => %Plug.Upload{} = upload}) do
    filename = sanitize_filename(upload.filename || "file")
    ext = Path.extname(filename)
    base = Path.rootname(filename)

    id =
      :crypto.strong_rand_bytes(12)
      |> Base.url_encode64(padding: false)

    stored_name = "#{base}-#{id}#{ext}"
    target_dir = Path.join([:code.priv_dir(:privchat_backend), "static", "uploads"])
    File.mkdir_p!(target_dir)
    target_path = Path.join(target_dir, stored_name)

    File.cp!(upload.path, target_path)

    json(conn, %{
      ok: true,
      file: %{
        name: filename,
        type: upload.content_type,
        size: File.stat!(target_path).size,
        url: "/uploads/#{stored_name}"
      }
    })
  rescue
    e ->
      conn
      |> put_status(:bad_request)
      |> json(%{ok: false, error: "upload_failed", detail: inspect(e)})
  end

  def create(conn, _), do: unauthorized(conn)

  defp unauthorized(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: "unauthorized"})
  end

  defp sanitize_filename(name) do
    name
    |> to_string()
    |> String.trim()
    |> String.replace(~r/[^\p{L}\p{N}\.\-\_ ]/u, "")
    |> String.replace(~r/\s+/, "_")
    |> case do
      "" -> "file"
      s -> s
    end
  end
end

