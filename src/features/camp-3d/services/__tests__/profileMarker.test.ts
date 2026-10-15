import * as THREE from "three"
import { describe, expect, it } from "vitest"

import { SCENE_SCALE } from "../camp"
import { createProfileMarker } from "../profileMarker"

const pointLights = (scene: THREE.Scene) => {
  const lights: THREE.PointLight[] = []
  scene.traverse((o) => {
    if (o instanceof THREE.PointLight) lights.push(o)
  })
  return lights
}

describe("createProfileMarker", () => {
  it("places a clickable zone tagged as the profile building", () => {
    const scene = new THREE.Scene()
    const marker = createProfileMarker(scene, [1, 2, 3])

    expect(marker.zone.userData).toMatchObject({ type: "building", id: "profile" })
    expect(marker.zone.position.toArray()).toEqual([
      1 * SCENE_SCALE,
      2 * SCENE_SCALE,
      3 * SCENE_SCALE,
    ])
  })

  it("adds no dynamic light to the scene (keeps shaders cheap)", () => {
    const scene = new THREE.Scene()
    createProfileMarker(scene, [0, 0, 0])
    expect(pointLights(scene)).toHaveLength(0)
  })

  it("pulses its opacity and can be hidden during the cinematic", () => {
    const scene = new THREE.Scene()
    const marker = createProfileMarker(scene, [0, 0, 0])
    const material = marker.zone.material as THREE.MeshStandardMaterial

    marker.update(0.7)
    const a = material.opacity
    marker.update(1.4)
    expect(material.opacity).not.toBe(a)

    marker.setHidden(true)
    expect(marker.zone.visible).toBe(false)
    marker.setHidden(false)
    expect(marker.zone.visible).toBe(true)
  })

  it("moves and disposes cleanly", () => {
    const scene = new THREE.Scene()
    const marker = createProfileMarker(scene, [0, 0, 0])

    marker.setPosition([2, 0, 0])
    expect(marker.zone.position.x).toBeCloseTo(2 * SCENE_SCALE)

    marker.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
