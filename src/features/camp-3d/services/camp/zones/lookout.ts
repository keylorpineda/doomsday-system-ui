import * as THREE from "three"

import { BUILDINGS, HEIGHTS, MAIN_GATE } from "../layout"

import type { WatchtowerMode } from "../../../types/scene.types"
import type { Kit, Placement } from "../kit"

const ACCENT = "#bb66ff"
const PLATFORM_Y = 10.6

/**
 * Vigilancia: torre de expediciones de 14 m con reflector, escalera y la zona
 * de partida de expediciones (mesa de mapas, mochilas y cajas).
 */
export function buildLookout(kit: Kit) {
  const { M, G, box, mesh, group, instanced, sign } = kit
  const f = BUILDINGS.watchtower
  const g = group({ x: f.x, z: f.z })
  const half = 2.8

  // Patas y arriostramiento en X (comparten material: se resaltan juntas)
  const frame: THREE.Mesh[] = []
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      frame.push(
        box(0.4, PLATFORM_Y, 0.4, M.woodDark, {
          parent: g,
          x: sx * half,
          y: PLATFORM_Y / 2,
          z: sz * half,
        }),
      )
    }
  }
  const span = half * 2
  for (const level of [2.8, 7.2]) {
    const len = Math.hypot(span, 4)
    const ang = Math.atan2(4, span)
    for (const [axis, at] of [
      ["x", -half],
      ["x", half],
      ["z", -half],
      ["z", half],
    ] as const) {
      for (const sign of [1, -1]) {
        frame.push(
          box(len, 0.18, 0.18, M.woodDark, {
            parent: g,
            x: axis === "z" ? at : 0,
            z: axis === "x" ? at : 0,
            y: level,
            ry: axis === "z" ? Math.PI / 2 : 0,
            rz: sign * ang,
          }),
        )
      }
    }
  }
  // Plataforma, barandal y techo inclinado sobre postes
  frame.push(box(span + 1.2, 0.3, span + 1.2, M.woodDark, { parent: g, y: PLATFORM_Y }))
  const rails: Placement[] = []
  for (const s of [-1, 1]) {
    rails.push({ x: 0, y: PLATFORM_Y + 0.9, z: s * (half + 0.55), ry: 0 })
    rails.push({ x: s * (half + 0.55), y: PLATFORM_Y + 0.9, z: 0, ry: Math.PI / 2 })
  }
  instanced(G.box(span + 1.2, 1.1, 0.12), M.wood, rails, { parent: g, castShadow: true })
  instanced(
    G.cyl(0.1, 0.1, 2.8, 6),
    M.steel,
    [-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => ({ x: sx * half, y: PLATFORM_Y + 1.5, z: sz * half })),
    ),
    { parent: g },
  )
  box(span + 1.8, 0.16, span + 1.8, M.corrugatedRust, {
    parent: g,
    y: HEIGHTS.watchtower - 1.1,
    rx: 0.08,
  })

  // Escalera (cara este, hacia el camino)
  box(0.08, PLATFORM_Y, 0.08, M.steel, { parent: g, x: half + 0.3, y: PLATFORM_Y / 2, z: -0.4 })
  box(0.08, PLATFORM_Y, 0.08, M.steel, { parent: g, x: half + 0.3, y: PLATFORM_Y / 2, z: 0.4 })
  instanced(
    G.box(0.06, 0.06, 0.8),
    M.steel,
    Array.from({ length: Math.floor(PLATFORM_Y / 0.4) }, (_, i) => ({
      x: half + 0.3,
      y: 0.3 + i * 0.4,
      z: 0,
    })),
    { parent: g },
  )

  // Reflector: carcasa + foco real
  const lampHousing = mesh(G.cyl(0.35, 0.45, 0.7, 12), M.steel, {
    parent: g,
    x: 1.6,
    y: PLATFORM_Y + 1.5,
    z: 1.6,
    rx: Math.PI / 2.4,
  })
  mesh(G.cyl(0.32, 0.32, 0.05, 12), M.bulb, { parent: lampHousing, y: 0.36, castShadow: false })
  const spot = new THREE.SpotLight(0xdde8ff, 12, 70, Math.PI / 12, 0.4, 1.4)
  spot.position.set(f.x + 1.6, PLATFORM_Y + 1.6, f.z + 1.6)
  kit.root.add(spot, spot.target)

  sign("VIGILANCIA · EXPEDICIONES", ACCENT, 5.4, 0.8, {
    parent: g,
    x: half + 1.2,
    y: 2.4,
    z: 3.4,
    emissive: 0.75,
  })

  // Zona de partida de expediciones
  const yard = group({ parent: g, x: half + 3.4, z: 3.6 })
  box(1.8, 0.08, 1.1, M.wood, { parent: yard, y: 0.9 })
  box(1.5, 0.02, 0.9, M.whitePaint, { parent: yard, y: 0.95, ry: 0.15, castShadow: false })
  instanced(
    G.cyl(0.05, 0.05, 0.9, 5),
    M.woodDark,
    [-0.8, 0.8].flatMap((x) => [-0.45, 0.45].map((z) => ({ x, y: 0.45, z }))),
    { parent: yard },
  )
  mesh(G.sphere(0.1, 6), M.bulb, { parent: yard, x: 0.6, y: 1.05, castShadow: false })
  instanced(
    G.box(0.45, 0.6, 0.3),
    M.canvasOlive,
    [
      { x: -1.4, y: 0.3, z: 1 },
      { x: -0.8, y: 0.3, z: 1.2, ry: 0.4 },
      { x: -1.1, y: 0.3, z: 1.8, ry: -0.3 },
    ],
    { parent: yard, castShadow: true },
  )
  instanced(
    G.box(0.9, 0.9, 0.9, 1),
    M.crate,
    [
      { x: 1.6, y: 0.45, z: 1.4 },
      { x: 2.6, y: 0.45, z: 1.2, ry: 0.3 },
    ],
    { parent: yard, castShadow: true },
  )

  kit.tagBuilding("watchtower", frame)

  let mode: WatchtowerMode = "sweep"
  /** Si hay exploradores saliendo, el foco los sigue (lo controla exploration.ts). */
  let followTarget: THREE.Vector3 | null = null

  const animate = (t: number) => {
    if (followTarget) {
      spot.target.position.copy(followTarget)
      spot.intensity = 14
    } else if (mode === "sweep") {
      spot.target.position.set(Math.sin(t * 0.22) * 34, 0, Math.cos(t * 0.22) * 26)
      spot.intensity = 12
    } else {
      // 'gate' / 'overdue': apunta fijo a la salida; 'overdue' además parpadea.
      spot.target.position.set(MAIN_GATE.x, 0, MAIN_GATE.z - 2)
      spot.intensity = mode === "overdue" ? 9 + Math.abs(Math.sin(t * 4)) * 8 : 12
    }
    spot.target.updateMatrixWorld()
    lampHousing.rotation.z =
      Math.atan2(
        spot.target.position.x - spot.position.x,
        spot.target.position.z - spot.position.z,
      ) * 0.2
  }

  return {
    spot,
    animate,
    setMode: (m: WatchtowerMode) => {
      mode = m
    },
    follow: (target: THREE.Vector3 | null) => {
      followTarget = target
    },
  }
}
