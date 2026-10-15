import { act, renderHook } from "@testing-library/react"
import * as THREE from "three"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  EVENT_DEBOUNCE_MS,
  FALLBACK_REFRESH_MS,
  useSceneReactiveData,
} from "../useSceneReactiveData"

import type { SceneHandles } from "../../types/scene.types"

const api = vi.hoisted(() => ({
  dashboard: vi.fn(),
  admissions: vi.fn(),
  explorations: vi.fn(),
  inventory: vi.fn(),
  persons: vi.fn(),
  transfers: vi.fn(),
}))
vi.mock("@/features/dashboard/services/dashboard.service", () => ({
  getDashboardMetrics: api.dashboard,
}))
vi.mock("@/features/admissions/services/admissions.service", () => ({
  getPendingAdmissions: api.admissions,
}))
vi.mock("@/features/explorations/services/explorations.service", () => ({
  getExplorations: api.explorations,
}))
vi.mock("@/features/inventory/services/inventory.service", () => ({ getInventory: api.inventory }))
vi.mock("@/features/persons/services/persons.service", () => ({ getPersons: api.persons }))
vi.mock("@/features/transfers/services/transfers.service", () => ({
  getCampTransfers: api.transfers,
}))

type Listener = (payload?: unknown) => void
const socket = vi.hoisted(() => {
  const listeners = new Map<string, Set<Listener>>()
  return {
    connected: true,
    emit: vi.fn(),
    on: vi.fn((event: string, cb: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(cb)
    }),
    off: vi.fn((event: string, cb: Listener) => listeners.get(event)?.delete(cb)),
    fire: (event: string, payload?: unknown) => listeners.get(event)?.forEach((cb) => cb(payload)),
    reset: () => listeners.clear(),
  }
})
vi.mock("@/hooks/useSocket", () => ({ useSocket: () => socket }))

const makeHandles = () =>
  ({
    playExplorationAnimation: vi.fn(),
    playTransferAnimation: vi.fn(),
    setWatchtowerMode: vi.fn(),
    reactiveRefs: {
      hqFlag: new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()),
      hqInteriorLight: new THREE.PointLight(),
      gateEmergencyLamp: new THREE.PointLight(),
      watchtowerSpot: new THREE.SpotLight(),
      warehouseLight: new THREE.PointLight(),
      warehouseAlertLight: new THREE.PointLight(),
      apartmentsLitWindows: new THREE.MeshStandardMaterial(),
      gateBarrierArm: new THREE.Object3D(),
      garageDoor: new THREE.Object3D(),
    },
  }) as unknown as SceneHandles

/** Deja que corran el arranque (250 ms), el debounce y las promesas. */
const settle = async (ms = 300 + EVENT_DEBOUNCE_MS) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe("useSceneReactiveData", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    socket.reset()
    api.dashboard.mockResolvedValue({ warehouse: {}, camp: { total_people: 1 } })
    api.admissions.mockResolvedValue({ total: 0, data: [] })
    api.explorations.mockResolvedValue([])
    api.inventory.mockResolvedValue([])
    api.persons.mockResolvedValue({ data: [] })
    api.transfers.mockResolvedValue([])
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("loads every source once the scene exists, then stops polling", async () => {
    const handlesRef = { current: makeHandles() }
    renderHook(() => useSceneReactiveData("1", handlesRef, "admin"))
    await settle()

    for (const fn of Object.values(api)) expect(fn).toHaveBeenCalledTimes(1)

    // Sin eventos no vuelve a consultar antes del respaldo
    await settle(FALLBACK_REFRESH_MS - 2000)
    for (const fn of Object.values(api)) expect(fn).toHaveBeenCalledTimes(1)
  })

  it("only requests what a worker is allowed to read", async () => {
    renderHook(() => useSceneReactiveData("1", { current: makeHandles() }, "worker"))
    await settle()

    expect(api.explorations).toHaveBeenCalled()
    expect(api.inventory).toHaveBeenCalled()
    expect(api.dashboard).not.toHaveBeenCalled()
    expect(api.persons).not.toHaveBeenCalled()
  })

  it("joins the camp room and refreshes only the topic that changed (plus dashboard)", async () => {
    renderHook(() => useSceneReactiveData("1", { current: makeHandles() }, "admin"))
    await settle()
    expect(socket.emit).toHaveBeenCalledWith("camp.join", { campId: "1" })
    vi.clearAllMocks()

    act(() => {
      socket.fire("camp.updated", { campId: 1, topic: "inventory" })
      socket.fire("camp.updated", { campId: 1, topic: "inventory" })
    })
    await settle()

    expect(api.inventory).toHaveBeenCalledTimes(1)
    expect(api.dashboard).toHaveBeenCalledTimes(1)
    expect(api.persons).not.toHaveBeenCalled()
    expect(api.transfers).not.toHaveBeenCalled()
  })

  it("ignores events for other camps", async () => {
    renderHook(() => useSceneReactiveData("1", { current: makeHandles() }, "admin"))
    await settle()
    vi.clearAllMocks()

    act(() => socket.fire("camp.updated", { campId: 2, topic: "inventory" }))
    await settle()

    expect(api.inventory).not.toHaveBeenCalled()
  })

  it("waits while paused and catches up when the scene is visible again", async () => {
    const { rerender } = renderHook(
      ({ paused }) => useSceneReactiveData("1", { current: makeHandles() }, "admin", paused),
      { initialProps: { paused: false } },
    )
    await settle()
    rerender({ paused: true })
    vi.clearAllMocks()

    act(() => socket.fire("camp.updated", { campId: 1, topic: "transfers" }))
    await settle()
    expect(api.transfers).not.toHaveBeenCalled()

    rerender({ paused: false })
    await settle()
    expect(api.transfers).toHaveBeenCalledTimes(1)
  })

  it("falls back to a full refresh every minute", async () => {
    renderHook(() => useSceneReactiveData("1", { current: makeHandles() }, "admin"))
    await settle()
    vi.clearAllMocks()

    await settle(FALLBACK_REFRESH_MS)

    expect(api.inventory).toHaveBeenCalledTimes(1)
    expect(api.dashboard).toHaveBeenCalledTimes(1)
  })

  it("plays the truck and the explorers only when the state turns on", async () => {
    const handles = makeHandles()
    api.transfers.mockResolvedValue([{ status: "in_transit" }])
    api.explorations.mockResolvedValue([
      {
        status: "in_progress",
        departure_date: new Date().toISOString(),
        estimated_days: 3,
        grace_days: 1,
      },
    ])
    renderHook(() => useSceneReactiveData("1", { current: handles }, "admin"))
    await settle()
    act(() => socket.fire("camp.updated", { campId: 1, topic: "transfers" }))
    act(() => socket.fire("camp.updated", { campId: 1, topic: "explorations" }))
    await settle()

    expect(handles.playTransferAnimation).toHaveBeenCalledTimes(1)
    expect(handles.playExplorationAnimation).toHaveBeenCalledTimes(1)
    expect(handles.setWatchtowerMode).toHaveBeenLastCalledWith("gate")
  })

  it("keeps working when an endpoint fails", async () => {
    api.dashboard.mockRejectedValue(new Error("500"))
    const handles = makeHandles()
    api.admissions.mockResolvedValue({ total: 2 })
    renderHook(() => useSceneReactiveData("1", { current: handles }, "admin"))
    await settle()

    expect(handles.reactiveRefs.gateEmergencyLamp.intensity).toBe(3)
  })
})
