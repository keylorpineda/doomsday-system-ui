import * as THREE from "three"

import { EXPLORATION_PATH } from "./layout"

import type { Kit } from "./kit"

const DURATION = 9
const SPACING = 0.035 // separación entre exploradores sobre la ruta (fracción)

interface Limbs {
  lArm: THREE.Group
  rArm: THREE.Group
  lLeg: THREE.Group
  rLeg: THREE.Group
}

const OUTFITS = [
  { jacket: 0x353c30, pants: 0x28302a, hat: 0x2a3025 },
  { jacket: 0x3c3828, pants: 0x303028, hat: 0x383420 },
  { jacket: 0x2e3a2e, pants: 0x2a2e2c, hat: 0x263224 },
]

export interface ExplorationControls {
  holdGate: (key: string, open: boolean) => void
  /** El reflector de la torre sigue al primer explorador (null al terminar). */
  followWithSpot: (target: THREE.Vector3 | null) => void
}

/** Salida de exploración: tres figuras caminan de la torre al portón y salen. */
export function buildExploration(kit: Kit, controls: ExplorationControls) {
  const { G, std } = kit
  const skin = std({ color: 0x8a6050, roughness: 0.85 })
  const boot = std({ color: 0x1a1810, roughness: 0.95 })
  const gear = std({ color: 0x3a3c34, roughness: 0.72, metalness: 0.18 })

  const figures: THREE.Group[] = []
  const limbs: Limbs[] = []
  const part = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D,
  ) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = true
    parent.add(m)
    return m
  }
  const limb = (
    x: number,
    y: number,
    len: number,
    w: number,
    mat: THREE.Material,
    end: THREE.Material,
    fig: THREE.Group,
  ) => {
    const pivot = new THREE.Group()
    pivot.position.set(x, y, 0)
    part(G.box(w, len, w), mat, 0, -len / 2, 0, pivot)
    part(G.box(w * 0.9, 0.14, w * 1.3), end, 0, -len - 0.05, 0.03, pivot)
    fig.add(pivot)
    return pivot
  }

  for (const fit of OUTFITS) {
    const fig = new THREE.Group()
    const jacket = std({ color: fit.jacket, roughness: 0.92 })
    const pants = std({ color: fit.pants, roughness: 0.92 })
    part(G.box(0.36, 0.6, 0.22), jacket, 0, 0.92, 0, fig)
    part(G.box(0.26, 0.38, 0.2), gear, 0, 0.92, -0.2, fig)
    part(G.cyl(0.065, 0.07, 0.14, 6), skin, 0, 1.27, 0, fig)
    part(G.sphere(0.13, 8), skin, 0, 1.44, 0, fig).scale.y = 1.2
    part(G.cyl(0.155, 0.14, 0.14, 8), std({ color: fit.hat, roughness: 0.88 }), 0, 1.59, 0, fig)
    limbs.push({
      lArm: limb(-0.26, 1.16, 0.42, 0.11, jacket, skin, fig),
      rArm: limb(0.26, 1.16, 0.42, 0.11, jacket, skin, fig),
      lLeg: limb(-0.12, 0.62, 0.46, 0.14, pants, boot, fig),
      rLeg: limb(0.12, 0.62, 0.46, 0.14, pants, boot, fig),
    })
    fig.visible = false
    kit.root.add(fig)
    figures.push(fig)
  }

  const path = new THREE.CatmullRomCurve3(
    EXPLORATION_PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  )
  const p = new THREE.Vector3()
  const ahead = new THREE.Vector3()
  const spotTarget = new THREE.Vector3()
  let start = -1
  let queued = false

  const animate = (t: number) => {
    if (queued) {
      queued = false
      start = t
      figures.forEach((f) => (f.visible = true))
      controls.holdGate("exploration", true)
    }
    if (start < 0) return
    const progress = (t - start) / DURATION
    if (progress >= 1 + SPACING * figures.length) {
      start = -1
      figures.forEach((f) => (f.visible = false))
      controls.holdGate("exploration", false)
      controls.followWithSpot(null)
      return
    }
    figures.forEach((fig, i) => {
      const u = progress - i * SPACING
      if (u >= 1) {
        fig.visible = false
        return
      }
      fig.visible = true
      path.getPointAt(Math.max(u, 0), p)
      path.getPointAt(Math.min(u + 0.01, 1), ahead)
      fig.position.set(p.x, Math.abs(Math.sin(t * 8.5 + i * 2)) * 0.04, p.z)
      fig.lookAt(ahead.x, fig.position.y, ahead.z)
      const swing = Math.sin(t * 7.5 + i * 2.1) * 0.52
      limbs[i].lArm.rotation.x = swing
      limbs[i].rArm.rotation.x = -swing
      limbs[i].lLeg.rotation.x = -swing * 0.65
      limbs[i].rLeg.rotation.x = swing * 0.65
      if (i === 0) {
        spotTarget.set(p.x, 0, p.z)
        controls.followWithSpot(spotTarget)
      }
    })
  }

  return {
    animate,
    play: () => {
      if (start < 0) queued = true
    },
  }
}
