import { describe, expect, it } from "vitest"

import { CAMP, GARAGE_DOOR } from "../layout"
import { ACCELERATION, initialDriveState, stepDrive, targetSpeedAt } from "../truckDrive"

describe("truck driving", () => {
  it("drives slowly in the workshop, faster in the camp and fastest on the road", () => {
    const garage = targetSpeedAt(GARAGE_DOOR.x + 3, GARAGE_DOOR.z)
    const camp = targetSpeedAt(0, 0)
    const gate = targetSpeedAt(0, CAMP.halfZ)
    const road = targetSpeedAt(0, CAMP.halfZ + 40)
    expect(garage).toBeLessThan(camp)
    expect(gate).toBeLessThan(camp)
    expect(road).toBeGreaterThan(camp)
  })

  it("never accelerates faster than a loaded truck can", () => {
    let state = initialDriveState()
    for (let i = 0; i < 30; i++) {
      const before = state.speed
      state = stepDrive(state, 0, CAMP.halfZ + 50, 1 / 60)
      expect(state.speed - before).toBeLessThanOrEqual(ACCELERATION / 60 + 1e-9)
    }
    expect(state.acceleration).toBeGreaterThan(0)
  })

  it("brakes (negative acceleration) when entering a slower zone", () => {
    let state = { distance: 0, speed: 17, acceleration: 0 }
    state = stepDrive(state, 0, CAMP.halfZ, 1 / 60)
    expect(state.acceleration).toBeLessThan(0)
    expect(state.speed).toBeLessThan(17)
  })

  it("keeps moving forward along the route", () => {
    let state = initialDriveState()
    let last = 0
    for (let i = 0; i < 120; i++) {
      state = stepDrive(state, 0, 0, 1 / 60)
      expect(state.distance).toBeGreaterThanOrEqual(last)
      last = state.distance
    }
    expect(state.distance).toBeGreaterThan(0)
  })
})
