defmodule PrivchatBackendWeb do
  def controller do
    quote do
      use Phoenix.Controller, namespace: PrivchatBackendWeb

      import Plug.Conn
      alias PrivchatBackendWeb.Router.Helpers, as: Routes
      action_fallback PrivchatBackendWeb.FallbackController
    end
  end

  def router do
    quote do
      use Phoenix.Router

      import Plug.Conn
      import Phoenix.Controller
    end
  end

  def channel do
    quote do
      use Phoenix.Channel
      alias PrivchatBackend.Accounts
      alias PrivchatBackend.Messaging
    end
  end

  def view do
    quote do
      use Phoenix.View,
        root: "lib/privchat_backend_web/templates",
        namespace: PrivchatBackendWeb

      import Phoenix.Controller,
        only: [get_flash: 1, get_flash: 2, view_module: 1, view_template: 1]
    end
  end

  defmacro __using__(which) when is_atom(which), do: apply(__MODULE__, which, [])
end

