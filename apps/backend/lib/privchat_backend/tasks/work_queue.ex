defmodule PrivchatBackend.Tasks.WorkQueue do
  use GenServer

  @moduledoc """
  Lightweight in-memory queue for heavy/async work (file processing, transcription stubs).
  """

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def enqueue(fun, opts \\ []) when is_function(fun, 0) do
    GenServer.cast(__MODULE__, {:enqueue, fun, opts})
  end

  @impl true
  def init(opts) do
    {:ok,
     %{
       queue: :queue.new(),
       running: 0,
       concurrency: Keyword.get(opts, :concurrency, 5)
     }}
  end

  @impl true
  def handle_cast({:enqueue, fun, _opts}, state) do
    state
    |> enqueue_job(fun)
    |> maybe_schedule()
    |> noreply()
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, _pid, _reason}, state) do
    state
    |> decrement()
    |> maybe_schedule()
    |> noreply()
  end

  defp enqueue_job(state, fun) do
    %{state | queue: :queue.in(fun, state.queue)}
  end

  defp maybe_schedule(%{running: running, concurrency: limit} = state) when running < limit do
    case :queue.out(state.queue) do
      {{:value, fun}, rest} ->
        {:ok, pid} =
          Task.Supervisor.start_child(PrivchatBackend.Tasks.Supervisor, fn ->
            try do
              fun.()
            rescue
              _ -> :ok
            end
          end)

        Process.monitor(pid)

        %{state | queue: rest, running: running + 1}
        |> maybe_schedule()

      {:empty, _} ->
        state
    end
  end

  defp maybe_schedule(state), do: state

  defp decrement(state) do
    %{state | running: max(state.running - 1, 0)}
  end

  defp noreply(state), do: {:noreply, state}
end
