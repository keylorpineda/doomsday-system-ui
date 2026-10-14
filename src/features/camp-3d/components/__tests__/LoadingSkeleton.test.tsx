import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LoadingSkeleton } from "../LoadingSkeleton"

describe("LoadingSkeleton", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("steps through the boot statuses and stops on the last one", () => {
    render(<LoadingSkeleton />)
    expect(screen.getByText("Inicializando motor 3D...")).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(screen.getByText("Cargando geometría del campamento...")).toBeInTheDocument()

    for (let i = 0; i < 10; i++) {
      act(() => {
        vi.advanceTimersByTime(2000)
      })
    }
    expect(screen.getByText("Sistema listo...")).toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("leaves no pending timers after unmounting mid-boot", () => {
    const { unmount } = render(<LoadingSkeleton />)
    act(() => {
      vi.advanceTimersByTime(1600)
    })

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
