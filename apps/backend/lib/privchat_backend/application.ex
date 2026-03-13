defmodule PrivchatBackend.Application do
  @moduledoc false

  use Application

  def start(_type, _args) do
    children = [
      PrivchatBackend.Repo,
      {Phoenix.PubSub, name: PrivchatBackend.PubSub, adapter: Phoenix.PubSub.PG2},
      PrivchatBackendWeb.Presence,
      {Task.Supervisor, name: PrivchatBackend.Tasks.Supervisor},
      PrivchatBackend.Tasks.WorkQueue,
      PrivchatBackendWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: PrivchatBackend.Supervisor]
    Supervisor.start_link(children, opts)
  end

  def config_change(changed, _new, removed) do
    PrivchatBackendWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
