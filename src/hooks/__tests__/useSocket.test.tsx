import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useSocket } from "../useSocket"

import { useTokenStore } from "@/store/useAuthStore"

const disconnect = vi.fn()
const io = vi.fn()

vi.mock("socket.io-client", () => ({
  io: (...args: unknown[]) => io(...args),
}))

describe("useSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    useTokenStore.getState().setToken(null)
    io.mockReturnValue({ connected: true, disconnect })
  })

  it("returns null when there is no token", () => {
    const { result } = renderHook(() => useSocket())

    expect(result.current).toBeNull()
    expect(io).not.toHaveBeenCalled()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("creates one shared socket and disconnects after the last consumer unmounts", () => {
    vi.useFakeTimers()
    act(() => useTokenStore.getState().setToken("token-1"))

    const first = renderHook(() => useSocket())
    const second = renderHook(() => useSocket())

    expect(io).toHaveBeenCalledTimes(1)
    expect(io).toHaveBeenCalledWith(expect.any(String), {
      auth: { token: "token-1" },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    first.unmount()
    expect(disconnect).not.toHaveBeenCalled()

    second.unmount()
    // La desconexión se difiere 150 ms para tolerar el remount de StrictMode
    expect(disconnect).not.toHaveBeenCalled()
    vi.advanceTimersByTime(150)
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it("keeps the socket alive when a consumer remounts before the disconnect delay", () => {
    vi.useFakeTimers()
    act(() => useTokenStore.getState().setToken("token-1"))

    renderHook(() => useSocket()).unmount()
    const remounted = renderHook(() => useSocket())
    vi.advanceTimersByTime(150)

    expect(io).toHaveBeenCalledTimes(1)
    expect(disconnect).not.toHaveBeenCalled()

    remounted.unmount()
    vi.advanceTimersByTime(150)
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
