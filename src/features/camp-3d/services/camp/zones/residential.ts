import * as THREE from "three"

import { BUILDINGS } from "../layout"

import type { Kit, Placement } from "../kit"

const ACCENT = "#44aaff"
const FLOOR_H = 3.2
const FLOORS = 3

/**
 * Residencial: bloque de apartamentos de tres pisos con balcones, ventanas
 * encendidas, ropa tendida y escalera exterior, más una zona de carpas con
 * fogata comunitaria.
 */
export function buildResidential(kit: Kit) {
  const { M, G, box, mesh, group, instanced, sign, std, rand } = kit
  const f = BUILDINGS.barracks
  const H = FLOOR_H * FLOORS
  const g = group({ x: f.x, z: f.z })
  const west = -f.w / 2 // fachada principal (hacia la calle)

  const body = box(f.w, H, f.d, M.brick, { parent: g, y: H / 2 }, 3)
  box(f.w + 0.4, 0.5, f.d + 0.4, M.concreteDark, { parent: g, y: H + 0.25 }, 3)
  for (let fl = 1; fl < FLOORS; fl++) {
    box(f.w + 0.2, 0.2, f.d + 0.2, M.concreteDark, { parent: g, y: fl * FLOOR_H }, 3)
  }

  // Ventanas: material propio (los datos reactivos ajustan su brillo según ocupación)
  const litWindows = std({ color: 0xffd9a0, emissive: 0xffb060, emissiveIntensity: 0.9 })
  const lit: Placement[] = []
  const dark: Placement[] = []
  const cols = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5]
  for (let fl = 0; fl < FLOORS; fl++) {
    const y = fl * FLOOR_H + 1.75
    for (const z of cols) {
      for (const [x, ry] of [
        [west - 0.04, 0],
        [-west + 0.04, 0],
      ] as const) {
        if (fl === 0 && x < 0 && Math.abs(z) < 2)
          continue // puerta de entrada
        ;(rand() < 0.62 ? lit : dark).push({ x, y, z, ry })
      }
    }
  }
  // Ventanas en las fachadas norte y sur (el bloque no debe verse como una caja ciega)
  for (let fl = 0; fl < FLOORS; fl++) {
    for (const x of [-4.5, -1.5, 1.5, 4.5]) {
      for (const z of [-f.d / 2 - 0.04, f.d / 2 + 0.04]) {
        ;(rand() < 0.55 ? lit : dark).push({ x, y: fl * FLOOR_H + 1.75, z, ry: Math.PI / 2 })
      }
    }
  }
  instanced(G.box(0.08, 1.3, 1.1), litWindows, lit, { parent: g })
  instanced(G.box(0.08, 1.3, 1.1), M.dark, dark, { parent: g })

  // Balcones con baranda y ropa tendida (pisos 2 y 3, fachada oeste)
  const slabs: Placement[] = []
  const rails: Placement[] = []
  const clothes: Array<Placement & { m: number }> = []
  for (let fl = 1; fl < FLOORS; fl++) {
    for (const z of [-6, 0, 6]) {
      const y = fl * FLOOR_H + 0.1
      slabs.push({ x: west - 0.8, y, z })
      rails.push({ x: west - 1.55, y: y + 0.55, z })
      for (let c = 0; c < 3; c++) {
        clothes.push({
          x: west - 1.6,
          y: y + 0.85,
          z: z - 1 + c * 0.9,
          m: Math.floor(rand() * M.cloth.length),
        })
      }
    }
  }
  instanced(G.box(1.6, 0.2, 3.4), M.concrete, slabs, { parent: g, castShadow: true })
  instanced(G.box(0.08, 1, 3.4), M.steel, rails, { parent: g })
  M.cloth.forEach((mat, i) => {
    const mine = clothes.filter((c) => c.m === i)
    if (mine.length) instanced(G.box(0.04, 0.55, 0.6), mat, mine, { parent: g })
  })

  // Entrada y cartel
  box(0.12, 2.5, 2.2, M.dark, { parent: g, x: west - 0.04, y: 1.25, castShadow: false })
  box(1.6, 0.15, 3, M.concreteDark, { parent: g, x: west - 0.8, y: 2.8 })
  sign("RESIDENCIAL", ACCENT, 3.6, 0.7, {
    parent: g,
    x: west - 0.1,
    y: 3.35,
    ry: -Math.PI / 2,
    emissive: 0.7,
  })

  // Escalera exterior en zigzag (cara sur)
  const south = f.d / 2
  for (let fl = 0; fl < FLOORS - 1; fl++) {
    const dir = fl % 2 ? -1 : 1
    const flight = new THREE.Group()
    for (let s = 0; s < 10; s++) {
      box(1.2, 0.12, 0.3, M.steel, {
        parent: flight,
        x: dir * (-2.5 + s * 0.5),
        y: s * (FLOOR_H / 10),
        z: 0,
      })
    }
    kit.place(flight, { x: 0, y: fl * FLOOR_H + 0.2, z: south + 0.9 })
    g.add(flight)
    box(1.6, 0.15, 1.4, M.steel, { parent: g, x: dir * 3.3, y: (fl + 1) * FLOOR_H, z: south + 0.9 })
  }

  // Techo: tanques de agua y chimenea
  instanced(
    G.cyl(0.9, 0.9, 1.6, 12),
    M.barrelBlue,
    [
      { x: 2, y: H + 1.3, z: -5 },
      { x: 2, y: H + 1.3, z: -2.6 },
    ],
    { parent: g, castShadow: true },
  )
  mesh(G.box(0.8, 2, 0.8), M.brick, { parent: g, x: -3, y: H + 1, z: 6 })

  // ---- Carpas y fogata ----
  const t = BUILDINGS.tents
  const tg = group({ x: t.x, z: t.z })
  ;[-4.6, 0, 4.6].forEach((dx, i) => {
    const mat = i === 1 ? M.canvasOlive : M.canvasTent
    mesh(G.gable(3.4, 2.4, 4.2), mat, { parent: tg, x: dx, ry: 0 })
    box(0.9, 1.6, 0.04, M.dark, { parent: tg, x: dx, y: 0.8, z: 2.12, castShadow: false })
  })
  // Tendedero entre postes
  instanced(
    G.cyl(0.05, 0.05, 2.2, 5),
    M.woodDark,
    [-6.4, 6.4].map((x) => ({ x, y: 1.1, z: -3 })),
    { parent: tg },
  )
  box(12.8, 0.02, 0.02, M.rope, { parent: tg, y: 2.1, z: -3, castShadow: false })
  M.cloth.forEach((mat, i) => {
    instanced(
      G.box(0.6, 0.7, 0.03),
      mat,
      [-5 + i * 2.2, -4 + i * 2.2].map((x) => ({ x, y: 1.7, z: -3, rz: (rand() - 0.5) * 0.1 })),
      { parent: tg },
    )
  })

  // Fogata comunitaria con troncos para sentarse
  const fire = group({ parent: tg, x: 0, z: 5.6 })
  instanced(
    G.box(0.35, 0.25, 0.3),
    M.concreteDark,
    Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2
      return { x: Math.cos(a) * 0.9, y: 0.12, z: Math.sin(a) * 0.9, ry: a }
    }),
    { parent: fire },
  )
  const flame = mesh(G.cone(0.45, 1, 8), M.bulb, { parent: fire, y: 0.5, castShadow: false })
  instanced(
    G.cyl(0.18, 0.18, 1.8, 6),
    M.bark,
    [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 + 0.4
      return { x: Math.cos(a) * 2.4, y: 0.2, z: Math.sin(a) * 2.4, ry: -a, rz: Math.PI / 2 }
    }),
    { parent: fire },
  )
  const fireLight = kit.pointLight(0xff8a2a, 4, 14, { y: 1.2 }, fire)

  kit.tagBuilding("barracks", [body])

  const animate = (time: number) => {
    const k = 0.85 + Math.sin(time * 9.1) * 0.1 + Math.sin(time * 17.3) * 0.06
    fireLight.intensity = 4 * k
    flame.scale.set(1, k * 1.1, 1)
  }

  return { litWindows, animate }
}
