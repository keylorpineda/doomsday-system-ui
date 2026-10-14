import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import RoleShell from "../RoleShell"

import type { ComponentProps } from "react"

import { use3DStore } from "@/store/use3DStore"

// El campamento 3D (three.js) no corre en jsdom; el stub expone si está pausado.
vi.mock("@/features/camp-3d/components/CampScene3DWrapper", () => ({
  default: ({ paused }: { paused?: boolean }) => (
    <div data-testid="camp-3d-wrapper" data-paused={String(Boolean(paused))} />
  ),
}))

const renderShell = (props: Partial<ComponentProps<typeof RoleShell>> = {}) =>
  render(
    <RoleShell
      brandTitle="BASE"
      brandSubtitle="SUB"
      navItems={[]}
      activeKey="camp"
      onSelect={vi.fn()}
      windowTitle="SECCIÓN"
      showWindow={false}
      onCloseWindow={vi.fn()}
      campId="1"
      userInitial="K"
      userName="keylor"
      roleLabel="LÍDER"
      onLogout={vi.fn()}
      onViewProfile={vi.fn()}
      utcTime="00:00"
      {...props}
    >
      <div>contenido</div>
    </RoleShell>,
  )

describe("RoleShell", () => {
  beforeEach(() => {
    use3DStore.setState({ transferCinematic: 0, is3DActive: false })
  })

  it("keeps the 3D background rendering when no section window covers it", async () => {
    renderShell({ showWindow: false })

    expect(await screen.findByTestId("camp-3d-wrapper")).toHaveAttribute("data-paused", "false")
  })

  it("pauses the 3D background while a section window covers it", async () => {
    renderShell({ showWindow: true })

    expect(await screen.findByTestId("camp-3d-wrapper")).toHaveAttribute("data-paused", "true")
  })

  it("closes the section window when the camp 3D view is requested", () => {
    const onCloseWindow = vi.fn()
    renderShell({ showWindow: true, onCloseWindow })

    act(() => use3DStore.getState().setIs3DActive(true))

    expect(onCloseWindow).toHaveBeenCalledTimes(1)
    expect(use3DStore.getState().is3DActive).toBe(false)
  })

  it("closes the section window when a transfer cinematic starts", () => {
    const onCloseWindow = vi.fn()
    renderShell({ showWindow: true, onCloseWindow })

    act(() => use3DStore.getState().startTransferCinematic("1"))

    expect(onCloseWindow).toHaveBeenCalledTimes(1)
  })
})
