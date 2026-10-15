import { describe, expect, it } from "vitest"

import {
  BUILDINGS,
  CAMP,
  CAMERA,
  EXPLORATION_PATH,
  footprintBounds,
  footprintGap,
  GARAGE_DOOR,
  MAIN_GATE,
  MIN_CLEARANCE,
  PLAZA,
  PROFILE_SPOTS,
  ROADS,
  TRANSFER_PATH,
  WALL,
} from "../layout"

import type { Footprint } from "../layout"

const entries = Object.entries(BUILDINGS) as Array<[string, Footprint]>
const innerX = CAMP.halfX - WALL.thickness
const innerZ = CAMP.halfZ - WALL.thickness

describe("camp layout", () => {
  it.each(entries.flatMap(([a], i) => entries.slice(i + 1).map(([b]) => [a, b] as const)))(
    "keeps %s and %s apart",
    (a, b) => {
      const gap = footprintGap(
        BUILDINGS[a as keyof typeof BUILDINGS],
        BUILDINGS[b as keyof typeof BUILDINGS],
      )
      expect(gap).toBeGreaterThanOrEqual(MIN_CLEARANCE)
    },
  )

  it.each(entries)("keeps %s inside the wall with clearance", (_name, f) => {
    const b = footprintBounds(f)
    expect(b.minX).toBeGreaterThanOrEqual(-innerX + MIN_CLEARANCE)
    expect(b.maxX).toBeLessThanOrEqual(innerX - MIN_CLEARANCE)
    expect(b.minZ).toBeGreaterThanOrEqual(-innerZ + MIN_CLEARANCE)
    expect(b.maxZ).toBeLessThanOrEqual(innerZ - MIN_CLEARANCE)
  })

  it.each(entries)("does not build %s on the plaza", (_name, f) => {
    const b = footprintBounds(f)
    const nearestX = Math.max(b.minX, Math.min(PLAZA.x, b.maxX))
    const nearestZ = Math.max(b.minZ, Math.min(PLAZA.z, b.maxZ))
    expect(Math.hypot(nearestX - PLAZA.x, nearestZ - PLAZA.z)).toBeGreaterThan(PLAZA.radius)
  })

  it.each(ROADS.map((r, i) => [i, r] as const))(
    "road %i does not cut through a building",
    (_i, road) => {
      for (const [, f] of entries) {
        const a = footprintBounds(road)
        const b = footprintBounds(f)
        const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
        const overlapZ = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ)
        // Tocar el borde (muelle, puerta) está permitido; atravesarlo no.
        expect(overlapX > 0.01 && overlapZ > 0.01).toBe(false)
      }
    },
  )

  it("puts the garage door on the access road and the main gate in the south wall", () => {
    expect(GARAGE_DOOR.x).toBe(BUILDINGS.garage.x - BUILDINGS.garage.w / 2)
    expect(MAIN_GATE.z).toBe(CAMP.halfZ)
  })

  it("routes the truck and the explorers through the main gate opening", () => {
    for (const path of [TRANSFER_PATH, EXPLORATION_PATH]) {
      const atWall = path.find(([, , z]) => z === CAMP.halfZ)
      expect(atWall).toBeDefined()
      expect(Math.abs(atWall![0] - MAIN_GATE.x)).toBeLessThan(MAIN_GATE.width / 2 - 1.5)
      expect(path[path.length - 1][2]).toBeGreaterThan(CAMP.halfZ)
    }
  })

  it("keeps the truck path off the other buildings", () => {
    for (let i = 1; i < TRANSFER_PATH.length; i++) {
      const [x0, , z0] = TRANSFER_PATH[i - 1]
      const [x1, , z1] = TRANSFER_PATH[i]
      for (let s = 0; s <= 10; s++) {
        const x = x0 + ((x1 - x0) * s) / 10
        const z = z0 + ((z1 - z0) * s) / 10
        for (const [name, f] of entries) {
          if (name === "garage") continue
          expect(footprintGap(f, { x, z, w: 2.6, d: 2.6 })).toBeGreaterThan(0)
        }
      }
    }
  })

  it("places every profile spot inside the camp", () => {
    for (const [x, , z] of Object.values(PROFILE_SPOTS)) {
      expect(Math.abs(x)).toBeLessThan(innerX)
      expect(Math.abs(z)).toBeLessThan(innerZ)
    }
  })

  it("lets the camera reach the whole camp", () => {
    expect(CAMERA.bounds.minX).toBeLessThanOrEqual(-CAMP.halfX)
    expect(CAMERA.bounds.maxX).toBeGreaterThanOrEqual(CAMP.halfX)
    expect(CAMERA.bounds.minZ).toBeLessThanOrEqual(-CAMP.halfZ)
    expect(CAMERA.bounds.maxZ).toBeGreaterThanOrEqual(CAMP.halfZ)
  })
})
