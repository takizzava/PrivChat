defmodule PrivchatBackendWeb.UploadController do
  use PrivchatBackendWeb, :controller

  def create(%{assigns: %{current_user: _user}} = conn, %{"file" => %Plug.Upload{} = upload} = params) do
    encrypted? = truthy?(Map.get(params, "encrypted", false))

    unless encrypted? do
      conn
      |> put_status(:unprocessable_entity)
      |> json(%{ok: false, error: "payload_must_be_encrypted"})
      |> halt()
    end

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

    PrivchatBackend.Tasks.WorkQueue.enqueue(fn ->
      # placeholder for heavy work like virus scanning or transcoding
      :ok = :timer.sleep(10)
      :ok
    end)

    json(conn, %{
      ok: true,
      file: %{
        name: filename,
        type: upload.content_type,
        size: File.stat!(target_path).size,
        url: public_url(stored_name),
        encrypted: true,
        iv: Map.get(params, "iv"),
        key_fingerprint: Map.get(params, "key_fingerprint")
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

  defp public_url(stored_name) do
    cdn_host = Application.get_env(:privchat_backend, :cdn_host)

    path = "/uploads/#{stored_name}"

    case cdn_host do
      nil -> path
      host -> host <> path
    end
  end

  defp truthy?(val) do
    case val do
      true -> true
      "true" -> true
      "1" -> true
      1 -> true
      _ -> false
    end
  end
end
