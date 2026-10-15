import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAccessDenied } from "../useAccessDenied"

import type { BuildingConfig } from "../../types/scene.types"

const hq = { id: "hq", label: "Cuartel" } as BuildingConfig

describe("useAccessDenied", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the notice and hides it after a while", () => {
    const { result } = renderHook(() => useAccessDenied())

    act(() => result.current.showDenied(hq))
    expect(result.current.denied?.building).toBe(hq)

    act(() => {
      vi.advanceTimersByTime(4200)
    })
    expect(result.current.denied).toBeNull()
  })

  it("bumps the nonce on repeated taps and can be dismissed", () => {
    const { result } = renderHook(() => useAccessDenied())

    act(() => result.current.showDenied(hq))
    const first = result.current.denied?.nonce ?? 0
    act(() => result.current.showDenied(hq))
    expect(result.current.denied?.nonce).toBe(first + 1)

    act(() => result.current.dismiss())
    expect(result.current.denied).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("clears its timer on unmount", () => {
    const { result, unmount } = renderHook(() => useAccessDenied())
    act(() => result.current.showDenied(hq))

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
