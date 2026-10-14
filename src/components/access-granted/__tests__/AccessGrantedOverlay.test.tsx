import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AccessGrantedOverlay } from "../AccessGrantedOverlay"
import { TIMELINE, TOTAL_DURATION } from "../timeline"

describe("AccessGrantedOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const advanceTo = (seconds: number) =>
    act(() => {
      vi.advanceTimersByTime(seconds * 1000)
    })

  it("walks the reader through insert → reading → granted", () => {
    render(<AccessGrantedOverlay />)
    expect(screen.getByRole("img", { name: "INSERTE CREDENCIAL" })).toBeInTheDocument()

    advanceTo(TIMELINE.reading.start)
    expect(screen.getByRole("img", { name: "LEYENDO…" })).toBeInTheDocument()

    advanceTo(TIMELINE.granted.start - TIMELINE.reading.start)
    expect(screen.getByRole("img", { name: "ACCESO CONCEDIDO" })).toBeInTheDocument()
  })

  it("shows the login badge without any credential", () => {
    render(<AccessGrantedOverlay />)

    expect(screen.getByRole("img", { name: "Gafete de acceso" })).toBeInTheDocument()
    expect(screen.getByText("USUARIO")).toBeInTheDocument()
    expect(screen.getByText("CONTRASEÑA")).toBeInTheDocument()
    // Ningún input ni valor: los campos van censurados
    expect(document.querySelectorAll("input")).toHaveLength(0)
  })

  it("finishes before the login navigates (5.6 s) and leaves no timers behind", () => {
    expect(TOTAL_DURATION).toBeLessThan(5.6)
    const { unmount } = render(<AccessGrantedOverlay />)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
