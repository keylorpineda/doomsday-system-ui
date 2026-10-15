import { CAMP, MAIN_GATE, WALL, WALL_TOWERS } from "./layout"

import type { Kit, Placement } from "./kit"
import type * as THREE from "three"

const T = WALL.thickness
const H = WALL.height
/** Línea central de cada muralla. */
const NORTH_Z = -(CAMP.halfZ + T / 2)
const SOUTH_Z = CAMP.halfZ + T / 2
const WEST_X = -(CAMP.halfX + T / 2)
const EAST_X = CAMP.halfX + T / 2
const OUTER_X = CAMP.halfX + T
const GATE_HALF = MAIN_GATE.width / 2

/** Tramo recto de muralla entre dos puntos alineados a un eje. */
interface Segment {
  axis: "x" | "z"
  /** Coordenada fija (z para tramos en x, x para tramos en z). */
  at: number
  from: number
  to: number
  /** Dirección hacia el interior del campamento (+1 / −1) en el eje perpendicular. */
  inward: number
}

const SEGMENTS: Segment[] = [
  { axis: "x", at: NORTH_Z, from: -OUTER_X, to: OUTER_X, inward: 1 },
  { axis: "x", at: SOUTH_Z, from: -OUTER_X, to: MAIN_GATE.x - GATE_HALF, inward: -1 },
  { axis: "x", at: SOUTH_Z, from: MAIN_GATE.x + GATE_HALF, to: OUTER_X, inward: -1 },
  { axis: "z", at: WEST_X, from: -CAMP.halfZ, to: CAMP.halfZ, inward: 1 },
  { axis: "z", at: EAST_X, from: -CAMP.halfZ, to: CAMP.halfZ, inward: -1 },
]

/** Puntos repartidos cada `step` metros a lo largo de un tramo. */
function along(seg: Segment, step: number, offset = step / 2) {
  const pts: Array<{ x: number; z: number; ry: number }> = []
  for (let s = seg.from + offset; s < seg.to; s += step) {
    pts.push(seg.axis === "x" ? { x: s, z: seg.at, ry: 0 } : { x: seg.at, z: s, ry: Math.PI / 2 })
  }
  return pts
}

/** Desplaza un punto hacia el interior (`d` > 0) o el exterior (`d` < 0) de la muralla. */
function offset(seg: Segment, p: { x: number; z: number }, d: number) {
  return seg.axis === "x"
    ? { x: p.x, z: p.z + seg.inward * d }
    : { x: p.x + seg.inward * d, z: p.z }
}

export function buildPerimeter(kit: Kit) {
  const { M, G, mesh, box, instanced, group, sign } = kit

  // ---- Muros, pasarela y almenas ----
  const merlons: Placement[] = []
  const posts: Placement[] = []
  const pilasters: Placement[] = []
  const wire: Placement[] = []
  for (const seg of SEGMENTS) {
    const len = seg.to - seg.from
    const mid = (seg.from + seg.to) / 2
    const center = seg.axis === "x" ? { x: mid, z: seg.at } : { x: seg.at, z: mid }
    const wallSize: [number, number] = seg.axis === "x" ? [len, T] : [T, len]
    box(wallSize[0], H, wallSize[1], M.wall, { x: center.x, y: H / 2, z: center.z }, 3)
    // Zócalo más oscuro (salpicaduras de barro)
    box(
      wallSize[0] + 0.06,
      0.9,
      wallSize[1] + 0.06,
      M.concreteDark,
      { x: center.x, y: 0.45, z: center.z },
      3,
    )

    // Pasarela de tablones por el lado interior
    const walk = offset(seg, center, T / 2 + 0.65)
    const walkSize: [number, number] = seg.axis === "x" ? [len, 1.3] : [1.3, len]
    box(walkSize[0], 0.18, walkSize[1], M.woodDark, { x: walk.x, y: WALL.walkwayY, z: walk.z }, 2)
    along(seg, 4).forEach((p) => {
      const o = offset(seg, p, T / 2 + 1.15)
      posts.push({ x: o.x, y: WALL.walkwayY / 2, z: o.z })
    })

    along(seg, 2.4).forEach((p) => merlons.push({ x: p.x, y: H + 0.45, z: p.z, ry: p.ry }))
    along(seg, 8).forEach((p) => {
      const o = offset(seg, p, -(T / 2 + 0.25))
      pilasters.push({ x: o.x, y: H / 2, z: o.z, ry: p.ry })
    })
    along(seg, 0.9).forEach((p) => {
      const o = offset(seg, p, -(T / 2 - 0.1))
      wire.push({ x: o.x, y: H + 1.05, z: o.z, ry: p.ry + Math.PI / 2 })
    })
  }
  instanced(G.box(1.2, 0.9, T + 0.1, 2), M.wall, merlons, { castShadow: true })
  instanced(G.cyl(0.11, 0.11, WALL.walkwayY, 6), M.woodDark, posts)
  instanced(G.box(0.9, H, 0.5, 2), M.concreteDark, pilasters, { castShadow: true })
  instanced(G.torus(0.32, 0.02, 10), M.wire, wire)

  // ---- Torres de vigilancia ----
  const lamps: THREE.Mesh[] = []
  for (const tw of WALL_TOWERS) {
    const tx = tw.x === CAMP.halfX ? EAST_X : tw.x === -CAMP.halfX ? WEST_X : tw.x
    const tz = tw.z === CAMP.halfZ ? SOUTH_Z : tw.z === -CAMP.halfZ ? NORTH_Z : tw.z
    const t = group({ x: tx, z: tz })
    const baseH = tw.gate ? 9.5 : 8.5
    box(3.8, baseH, 3.8, M.wall, { parent: t, y: baseH / 2 }, 3)
    box(4.1, 0.5, 4.1, M.concreteDark, { parent: t, y: baseH }, 3)
    // Cabina de madera con ventanas a los cuatro lados
    const cabY = baseH + 1.35
    box(3.6, 2.2, 3.6, M.wood, { parent: t, y: cabY }, 2)
    for (let side = 0; side < 4; side++) {
      const a = (side * Math.PI) / 2
      box(2.4, 0.8, 0.12, M.dark, {
        parent: t,
        x: Math.sin(a) * 1.82,
        y: cabY + 0.35,
        z: Math.cos(a) * 1.82,
        ry: a,
        castShadow: false,
      })
    }
    // Techo a cuatro aguas con alero
    mesh(G.cone(3.4, 1.6, 4), M.corrugatedRust, { parent: t, y: cabY + 1.9, ry: Math.PI / 4 })
    // Barandal de la plataforma
    box(4.3, 0.1, 4.3, M.metal, { parent: t, y: baseH + 0.9, castShadow: false })
    // Lámpara: bombilla emisiva (sin luz real; el presupuesto de luces es limitado)
    const lamp = mesh(G.sphere(0.22, 8), M.bulb, {
      parent: t,
      y: cabY + 1.2,
      z: 1.95,
      castShadow: false,
    })
    lamps.push(lamp)
  }

  // ---- Portón principal ----
  const gateG = group({ x: MAIN_GATE.x, z: SOUTH_Z })
  // Dintel con cartel
  box(MAIN_GATE.width + 3.4, 1.4, T + 0.4, M.concreteDark, { parent: gateG, y: H + 1.6 }, 3)
  sign("PUESTO DE SUPERVIVENCIA", "#c8761a", MAIN_GATE.width + 2, 1.1, {
    parent: gateG,
    y: H + 1.6,
    z: T / 2 + 0.26,
    emissive: 0.6,
  })
  // Franjas de seguridad en los marcos
  for (const sx of [-1, 1]) {
    box(0.5, H, T + 0.3, M.hazard, { parent: gateG, x: sx * (GATE_HALF + 0.25), y: H / 2 }, 1)
  }

  // Hojas del portón: pivote en cada marco, se abren hacia el interior (−z).
  const leaves: THREE.Group[] = []
  for (const sx of [-1, 1]) {
    const pivot = group({ parent: gateG, x: sx * GATE_HALF })
    const leaf = group({ parent: pivot, x: -sx * (GATE_HALF / 2) })
    const leafW = GATE_HALF - 0.1
    box(leafW, 4.8, 0.22, M.corrugated, { parent: leaf, y: 2.5 }, 2)
    // Bastidor y refuerzos en X
    box(leafW, 0.25, 0.32, M.steel, { parent: leaf, y: 0.25 })
    box(leafW, 0.25, 0.32, M.steel, { parent: leaf, y: 4.8 })
    box(0.25, 4.8, 0.32, M.steel, { parent: leaf, x: (sx * leafW) / 2, y: 2.5 })
    const diag = Math.hypot(leafW, 4.4)
    const ang = Math.atan2(4.4, leafW)
    box(diag, 0.18, 0.3, M.steel, { parent: leaf, y: 2.5, rz: ang })
    box(diag, 0.18, 0.3, M.steel, { parent: leaf, y: 2.5, rz: -ang })
    box(leafW, 0.5, 0.26, M.hazard, { parent: leaf, y: 0.8 }, 1)
    leaves.push(pivot)
  }

  /** Abre el portón: 0 = cerrado, 1 = abierto hacia el interior. */
  const setGateOpen = (amount: number) => {
    const a = Math.max(0, Math.min(1, amount)) * 1.55
    leaves[0].rotation.y = a
    leaves[1].rotation.y = -a
  }

  const animate = (t: number) => {
    // Las bombillas de las torres titilan levemente (generador inestable).
    const flicker = 2.6 + Math.sin(t * 7.3) * 0.25 + Math.sin(t * 13.1) * 0.15
    ;(M.bulb as THREE.MeshStandardMaterial).emissiveIntensity = flicker
  }

  return { setGateOpen, animate, lamps }
}
