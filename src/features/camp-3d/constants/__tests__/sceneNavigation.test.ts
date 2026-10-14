import { describe, expect, it } from "vitest"

import {
  normalizeRole,
  resolveBuildingRoute,
  resolveProfileMarker,
  resolveWorkerSubType,
  WORKER_SUB_MARKERS,
} from "../sceneNavigation"

import type { BuildingConfig } from "../../types/scene.types"

const building = (id: string, route = "/admin/x"): BuildingConfig => ({
  id,
  label: id,
  meshNames: [],
  route,
  requiredRoles: ["admin"],
  reactiveData: null,
  position3D: { x: 0, y: 0, z: 0 },
})

describe("sceneNavigation", () => {
  it("normalizes backend roles", () => {
    expect(normalizeRole("SUPER_ADMIN")).toBe("admin")
    expect(normalizeRole("travel_manager")).toBe("travel_manager")
    expect(normalizeRole("cook")).toBe("worker")
    expect(normalizeRole(undefined)).toBe("worker")
  })

  it("maps professions to worker sub-types", () => {
    expect(resolveWorkerSubType("Soldado")).toBe("soldier")
    expect(resolveWorkerSubType("Scout")).toBe("explorer")
    expect(resolveWorkerSubType("Cocinero")).toBe("other")
  })

  it("routes buildings per role, falling back to the role home", () => {
    expect(resolveBuildingRoute("travel_manager", building("garage"))).toBe(
      "/travel-manager/transfers",
    )
    expect(resolveBuildingRoute("camp_leader", building("garage"))).toBe("/campleader")
    expect(resolveBuildingRoute("worker", building("profile", "/worker/profile"))).toBe(
      "/worker/profile",
    )
  })

  it("resolves the profile marker by role and worker sub-type", () => {
    expect(resolveProfileMarker("worker", "explorer")).toBe(WORKER_SUB_MARKERS.explorer)
    expect(resolveProfileMarker("admin", "explorer").route).toBe("/admin/profile")
  })
})
