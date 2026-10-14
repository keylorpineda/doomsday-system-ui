import * as THREE from "three"

import { BUILDINGS, HEIGHTS } from "../layout"

import type { Kit, Placement } from "../kit"

const ACCENT = "#44aaff"

/** Comando (HQ): búnker de concreto de dos pisos con antena, bandera y sacos de arena. */
export function buildCommand(kit: Kit) {
  const { M, G, box, mesh, group, instanced, sign, std } = kit
  const f = BUILDINGS.hq
  const H = HEIGHTS.hq
  const g = group({ x: f.x, z: f.z })
  const front = f.d / 2 // cara sur (hacia la plaza)

  // Cuerpo principal + cornisa entre pisos + parapeto del techo
  const body = box(f.w, H, f.d, M.concrete, { parent: g, y: H / 2 }, 3)
  box(f.w + 0.3, 0.35, f.d + 0.3, M.concreteDark, { parent: g, y: 3.5 }, 3)
  box(f.w + 0.2, 0.9, 0.35, M.concreteDark, { parent: g, y: H + 0.45, z: front - 0.15 }, 3)
  box(f.w + 0.2, 0.9, 0.35, M.concreteDark, { parent: g, y: H + 0.45, z: -front + 0.15 }, 3)
  box(0.35, 0.9, f.d, M.concreteDark, { parent: g, x: f.w / 2 - 0.15, y: H + 0.45 }, 3)
  box(0.35, 0.9, f.d, M.concreteDark, { parent: g, x: -f.w / 2 + 0.15, y: H + 0.45 }, 3)

  // Ventanas: tiras iluminadas en el piso superior, troneras en el inferior
  const upper: Placement[] = []
  const lower: Placement[] = []
  for (let i = -3; i <= 3; i++) {
    if (i !== 0) lower.push({ x: i * 2.4, y: 1.9, z: front + 0.03 })
    upper.push({ x: i * 2.4, y: 5.2, z: front + 0.03 })
    upper.push({ x: i * 2.4, y: 5.2, z: -front - 0.03 })
  }
  instanced(G.box(1.6, 1.1, 0.08), M.windowCold, upper, { parent: g })
  instanced(G.box(1.4, 0.35, 0.08), M.dark, lower, { parent: g })
  // Ventanas laterales
  instanced(
    G.box(0.08, 1.1, 1.6),
    M.windowCold,
    [-3, 0, 3].flatMap((z) => [
      { x: f.w / 2 + 0.03, y: 5.2, z },
      { x: -f.w / 2 - 0.03, y: 5.2, z },
    ]),
    { parent: g },
  )

  // Entrada: hueco oscuro, puerta blindada, marquesina y cartel
  box(3.2, 2.9, 0.1, M.dark, { parent: g, y: 1.45, z: front + 0.04, castShadow: false })
  box(2.6, 2.6, 0.14, M.steel, { parent: g, y: 1.3, z: front + 0.08 })
  box(5.4, 0.25, 2.6, M.concreteDark, { parent: g, y: 3.1, z: front + 1.3 })
  for (const sx of [-1, 1])
    box(0.3, 3, 0.3, M.concreteDark, { parent: g, x: sx * 2.4, y: 1.5, z: front + 2.4 })
  sign("COMANDO", ACCENT, 5, 0.9, { parent: g, y: 3.65, z: front + 0.12, emissive: 0.7 })

  // Muro de sacos de arena en U frente a la entrada (con hueco central)
  const bags: Placement[] = []
  for (let row = 0; row < 3; row++) {
    for (let i = -9; i <= 9; i++) {
      if (Math.abs(i) < 3) continue
      bags.push({ x: i * 0.62, y: 0.2 + row * 0.36, z: front + 5.2, ry: (row % 2) * 0.12 })
    }
    for (let j = 0; j < 7; j++) {
      for (const sx of [-1, 1])
        bags.push({ x: sx * 5.9, y: 0.2 + row * 0.36, z: front + 1.4 + j * 0.62, ry: Math.PI / 2 })
    }
  }
  instanced(G.box(0.62, 0.36, 0.42, 1), M.sandbag, bags, { parent: g, castShadow: true })

  // Techo: antena de radio con tensores, antena parabólica, aires acondicionados
  const mastX = -f.w / 2 + 3
  mesh(G.cyl(0.12, 0.18, 9, 6), M.steel, { parent: g, x: mastX, y: H + 4.5, z: -2 })
  mesh(G.sphere(0.18, 6), M.bulbRed, { parent: g, x: mastX, y: H + 9.1, z: -2, castShadow: false })
  const dish = mesh(
    new THREE.SphereGeometry(1.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.6),
    M.whitePaint,
    {
      parent: g,
      x: f.w / 2 - 3,
      y: H + 1.6,
      z: 1.5,
      rx: -0.9,
      ry: 0.6,
    },
  )
  kit.track(dish.geometry)
  mesh(G.cyl(0.08, 0.08, 1.4, 6), M.steel, { parent: g, x: f.w / 2 - 3, y: H + 0.7, z: 1.5 })
  instanced(
    G.box(1.4, 0.9, 1.1),
    M.metal,
    [
      { x: 1, y: H + 0.45, z: -3 },
      { x: 3.2, y: H + 0.45, z: -3 },
    ],
    { parent: g, castShadow: true },
  )

  // Generador lateral con tubo de escape
  box(2.4, 1.6, 1.6, M.barrelOlive, { parent: g, x: f.w / 2 + 2, y: 0.8, z: -2.5 })
  mesh(G.cyl(0.1, 0.1, 2.2, 6), M.rust, { parent: g, x: f.w / 2 + 2.9, y: 2.2, z: -2.5 })
  const generator = box(0.6, 0.4, 0.05, M.bulbGreen, {
    parent: g,
    x: f.w / 2 + 2,
    y: 1.2,
    z: -1.68,
    castShadow: false,
  })

  // Mástil y bandera (su material es propio: los datos reactivos lo recolorean)
  const poleX = 4.2
  mesh(G.cyl(0.07, 0.09, 8, 6), M.steel, { parent: g, x: poleX, y: 4, z: front + 3.6 })
  const flagMat = std({ color: 0x3c5a2a, roughness: 1, side: THREE.DoubleSide })
  const flagPivot = group({ parent: g, x: poleX, y: 7.2, z: front + 3.6 })
  const flag = mesh(G.box(1.8, 1.1, 0.02), flagMat, {
    parent: flagPivot,
    x: 0.92,
    castShadow: false,
  })

  const interiorLight = kit.pointLight(0xbfd8ff, 1.2, 16, { x: 0, y: 3.2, z: front + 2 }, g)

  kit.tagBuilding("hq", [body])

  const animate = (t: number) => {
    flagPivot.rotation.y = Math.sin(t * 1.1) * 0.35
    flag.rotation.x = Math.sin(t * 2.3) * 0.08
    generator.visible = Math.sin(t * 3) > -0.6
  }

  return { flag, interiorLight, animate }
}
