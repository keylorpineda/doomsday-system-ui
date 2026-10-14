import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useOpen3DRequest } from "../useOpen3DRequest"

import { use3DStore } from "@/store/use3DStore"

describe("useOpen3DRequest", () => {
  beforeEach(() => {
    use3DStore.setState({ is3DActive: false, activeCamp3DId: null })
  })

  it("handles a request made while mounted and consumes the flag", () => {
    const onOpen = vi.fn()
    renderHook(() => useOpen3DRequest(onOpen))

    act(() => {
      use3DStore.getState().setActiveCamp("7")
      use3DStore.getState().setIs3DActive(true)
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith("7")
    expect(use3DStore.getState().is3DActive).toBe(false)
  })

  it("handles a request made before mounting (e.g. right after login)", () => {
    use3DStore.setState({ is3DActive: true, activeCamp3DId: "3" })
    const onOpen = vi.fn()

    renderHook(() => useOpen3DRequest(onOpen))

    expect(onOpen).toHaveBeenCalledWith("3")
    expect(use3DStore.getState().is3DActive).toBe(false)
  })

  it("ignores store changes that are not open requests", () => {
    const onOpen = vi.fn()
    renderHook(() => useOpen3DRequest(onOpen))

    act(() => use3DStore.getState().setActiveCamp("9"))

    expect(onOpen).not.toHaveBeenCalled()
  })

  it("uses the latest callback without resubscribing", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ cb }) => useOpen3DRequest(cb), {
      initialProps: { cb: first },
    })

    rerender({ cb: second })
    act(() => use3DStore.getState().setIs3DActive(true))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
