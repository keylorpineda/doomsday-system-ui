import * as THREE from "three"
import { describe, expect, it } from "vitest"

import {
  CINE_BLEND_OUT,
  CINE_DURATION,
  CINE_REST,
  updateCinematicCamera,
} from "../transferCinematic"

import type { CameraState } from "../../hooks/useThreeScene"

const camera = (): CameraState => ({
  theta: 0,
  phi: 0,
  radius: 0,
  target: new THREE.Vector3(),
})

describe("updateCinematicCamera", () => {
  it("starts at the first keyframe, close to the garage", () => {
    const cam = camera()
    expect(updateCinematicCamera(0, cam)).toBe(false)
    expect(cam.radius).toBe(7)
    expect(cam.target.toArray()).toEqual([18.9, 1.0, 11.9])
  })

  it("keeps running through the scripted keyframes and the blend-out", () => {
    const cam = camera()
    expect(updateCinematicCamera(CINE_DURATION / 2, cam)).toBe(false)
    expect(updateCinematicCamera(CINE_DURATION + CINE_BLEND_OUT / 2, cam)).toBe(false)
  })

  it("finishes exactly at the orbital rest pose", () => {
    const cam = camera()
    expect(updateCinematicCamera(CINE_DURATION + CINE_BLEND_OUT, cam)).toBe(true)
    expect(cam.target.toArray()).toEqual(CINE_REST.target)
    expect(cam.theta).toBeCloseTo(CINE_REST.theta)
    expect(cam.phi).toBeCloseTo(CINE_REST.phi)
    expect(cam.radius).toBeCloseTo(CINE_REST.radius)
  })

  it("moves the camera continuously, without jumps between frames", () => {
    const cam = camera()
    let prev: number | null = null
    for (let t = 0; t <= CINE_DURATION + CINE_BLEND_OUT; t += 1 / 60) {
      updateCinematicCamera(t, cam)
      if (prev !== null) expect(Math.abs(cam.radius - prev)).toBeLessThan(0.5)
      prev = cam.radius
    }
  })
})
