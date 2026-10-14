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

  it("hides without removing its light, so shaders are not recompiled", () => {
    const scene = new THREE.Scene()
    const marker = createProfileMarker(scene, [0, 0, 0])

    marker.setHidden(true)
    marker.update(1)

    expect(marker.zone.visible).toBe(false)
    const lights = pointLights(scene)
    expect(lights).toHaveLength(1)
    expect(lights[0].visible).toBe(true)
    expect(lights[0].intensity).toBe(0)

    marker.setHidden(false)
    marker.update(1)
    expect(marker.zone.visible).toBe(true)
    expect(lights[0].intensity).toBeGreaterThan(0)
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
