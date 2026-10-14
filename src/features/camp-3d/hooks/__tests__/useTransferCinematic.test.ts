import { act, renderHook } from "@testing-library/react"
import * as THREE from "three"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CINE_BLEND_OUT, CINE_DURATION } from "../../services/transferCinematic"
import { useTransferCinematic } from "../useTransferCinematic"

import type { ProfileMarker } from "../../services/profileMarker"
import type { SceneHandles } from "../../types/scene.types"
import type { CameraState } from "../useThreeScene"

import { use3DStore } from "@/store/use3DStore"

const setup = () => {
  const handles = { playTransferAnimation: vi.fn() } as unknown as SceneHandles
  const marker = { setHidden: vi.fn() } as unknown as ProfileMarker
  const handlesRef = { current: handles }
  const markerRef = { current: marker }
  const hook = renderHook(() => useTransferCinematic(handlesRef, markerRef))
  return { handles, marker, hook }
}

const camera = (): CameraState => ({ theta: 0, phi: 0, radius: 0, target: new THREE.Vector3() })

describe("useTransferCinematic", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("plays when a transfer is created while the scene is open", () => {
    const { handles, marker, hook } = setup()

    act(() => use3DStore.getState().startTransferCinematic("1"))

    expect(handles.playTransferAnimation).toHaveBeenCalledTimes(1)
    expect(marker.setHidden).toHaveBeenCalledWith(true)
    expect(hook.result.current.showCinematic).toBe(true)
  })

  it("drives the camera and restores the marker when it ends", () => {
    const { marker, hook } = setup()
    act(() => use3DStore.getState().startTransferCinematic("1"))

    const cam = camera()
    act(() => hook.result.current.updateCamera(10, cam))
    act(() => hook.result.current.updateCamera(10 + CINE_DURATION + CINE_BLEND_OUT, cam))

    expect(marker.setHidden).toHaveBeenLastCalledWith(false)
    expect(hook.result.current.showCinematic).toBe(false)
  })

  it("plays a cinematic requested before the scene was ready, only once", () => {
    act(() => use3DStore.getState().startTransferCinematic("1"))
    const { handles, hook } = setup()

    act(() => {
      hook.result.current.playPendingWhenReady()
      vi.runAllTimers()
    })
    act(() => {
      hook.result.current.playPendingWhenReady()
      vi.runAllTimers()
    })

    expect(handles.playTransferAnimation).toHaveBeenCalledTimes(1)
  })

  it("cancels the deferred pending check on unmount", () => {
    const { hook } = setup()
    act(() => hook.result.current.playPendingWhenReady())

    hook.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
