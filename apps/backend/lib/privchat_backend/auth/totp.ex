defmodule PrivchatBackend.Auth.TOTP do
  @moduledoc """
  Minimal TOTP implementation without external deps.
  """

  use Bitwise

  @time_step 30
  @digits 6
  @window 1

  def generate_secret do
    :crypto.strong_rand_bytes(20) |> Base.encode32(case: :lower, padding: false)
  end

  def otp_at(secret, ts \\ System.os_time(:second)) do
    counter = div(ts, @time_step)
    key = Base.decode32!(secret, case: :lower, padding: false)
    bin_counter = <<counter::unsigned-big-integer-size(64)>>

    mac = :crypto.mac(:hmac, :sha, key, bin_counter)
    offset = :binary.last(mac) &&& 0x0f
    <<_::binary-size(offset), chunk::32, _::binary>> = mac
    code = rem(chunk &&& 0x7fffffff, :math.pow(10, @digits) |> trunc())
    :io_lib.format("~#{@digits}..0B", [code]) |> IO.iodata_to_binary()
  end

  def verify(secret, code) when is_binary(code) do
    clean =
      code
      |> String.trim()
      |> String.pad_leading(@digits, "0")

    Enum.any?(-@window..@window, fn offset ->
      expected = otp_at(secret, System.os_time(:second) + offset * @time_step)
      secure_compare(expected, clean)
    end)
  rescue
    _ -> false
  end

  defp secure_compare(a, b) when byte_size(a) == byte_size(b) do
    a
    |> :binary.bin_to_list()
    |> Enum.zip(:binary.bin_to_list(b))
    |> Enum.reduce(0, fn {x, y}, acc -> acc ||| bxor(x, y) end)
    |> Kernel.==(0)
  end

  defp secure_compare(_, _), do: false
end
