import { BUILDINGS, CHECKPOINT_BARRIER, HEIGHTS } from "../layout"

import type { Kit, Placement } from "../kit"

const ACCENT = "#ffaa22"

/**
 * Admisiones: caseta de control junto al portón, toldo de registro con mesa y
 * bancas, fila delimitada con postes y la barrera vehicular sobre la avenida.
 */
export function buildCheckpoint(kit: Kit) {
  const { M, G, box, mesh, group, instanced, sign } = kit
  const f = BUILDINGS.checkpoint
  const H = HEIGHTS.checkpoint
  const g = group({ x: f.x, z: f.z })
  const east = f.w / 2 // cara que mira a la avenida

  // Caseta tipo contenedor con techo de chapa y ventanal hacia la avenida
  const booth = box(f.w, H, f.d, M.whitePaint, { parent: g, y: H / 2 }, 2)
  box(f.w + 0.6, 0.25, f.d + 0.6, M.corrugated, { parent: g, y: H + 0.12 })
  box(0.1, 1.2, f.d * 0.7, M.windowLit, { parent: g, x: east + 0.04, y: 1.9, castShadow: false })
  box(0.12, 0.25, f.d * 0.75, M.steel, { parent: g, x: east + 0.1, y: 1.25 })
  box(1.2, 2.2, 0.1, M.steel, { parent: g, x: east - 1.6, y: 1.1, z: f.d / 2 + 0.04 })
  box(f.w, 0.4, 0.06, M.hazard, { parent: g, y: 0.2, z: f.d / 2 + 0.03, castShadow: false }, 1)
  sign("ADMISIONES", ACCENT, 5.2, 0.9, { parent: g, y: H + 0.85, z: f.d / 2 - 0.4, emissive: 0.75 })

  // Lámpara de emergencia en el techo (los datos reactivos cambian su color)
  mesh(G.sphere(0.28, 10), M.bulbGreen, {
    parent: g,
    x: east - 1,
    y: H + 0.5,
    z: -1.6,
    castShadow: false,
  })
  const emergencyLamp = kit.pointLight(0x44ff44, 1.5, 14, { x: east - 1, y: H + 1, z: -1.6 }, g)

  // Toldo de registro entre la caseta y la avenida
  const canopyX = east + 2.4
  box(4.2, 0.08, 6, M.tarpBlue, { parent: g, x: canopyX, y: 2.9, rz: 0.06, castShadow: false })
  instanced(
    G.cyl(0.07, 0.07, 2.9, 6),
    M.steel,
    [-1.9, 1.9].flatMap((dx) => [-2.8, 2.8].map((dz) => ({ x: canopyX + dx, y: 1.45, z: dz }))),
    { parent: g },
  )
  box(2.4, 0.08, 0.9, M.wood, { parent: g, x: canopyX - 0.4, y: 0.85, z: -0.6 })
  instanced(
    G.cyl(0.04, 0.04, 0.85, 5),
    M.steel,
    [-1, 1].flatMap((dx) =>
      [-0.3, 0.3].map((dz) => ({ x: canopyX - 0.4 + dx, y: 0.42, z: -0.6 + dz })),
    ),
    { parent: g },
  )
  // Papeles y una lámpara de escritorio sobre la mesa
  box(0.4, 0.02, 0.3, M.whitePaint, {
    parent: g,
    x: canopyX - 0.8,
    y: 0.9,
    z: -0.6,
    castShadow: false,
  })
  mesh(G.sphere(0.09, 6), M.bulb, {
    parent: g,
    x: canopyX + 0.4,
    y: 1.05,
    z: -0.7,
    castShadow: false,
  })
  // Bancas de espera
  const benches: Placement[] = [0.9, 2.1].map((dz) => ({ x: canopyX, y: 0.45, z: dz }))
  instanced(G.box(2.6, 0.1, 0.4), M.woodDark, benches, { parent: g })

  // Fila delimitada: postes con cuerda desde el portón hacia la caseta
  const posts: Placement[] = []
  for (let i = 0; i < 6; i++) posts.push({ x: east + 0.8 + i * 0.6, y: 0.5, z: f.d / 2 + 1.4 })
  instanced(G.cyl(0.05, 0.07, 1, 6), M.steel, posts, { parent: g })
  box(3.2, 0.04, 0.04, M.tarpRed, {
    parent: g,
    x: east + 2.3,
    y: 0.92,
    z: f.d / 2 + 1.4,
    castShadow: false,
  })

  // Barrera vehicular sobre la avenida (pivote en el borde oeste)
  const b = CHECKPOINT_BARRIER
  box(0.5, 1.2, 0.5, M.concreteDark, { x: b.x - 0.2, y: 0.6, z: b.z })
  const barrierArm = group({ x: b.x, y: 1.05, z: b.z })
  box(b.length, 0.16, 0.16, M.barrier, { parent: barrierArm, x: b.length / 2 }, 1)
  mesh(G.sphere(0.12, 6), M.bulbRed, {
    parent: barrierArm,
    x: b.length - 0.1,
    y: 0.12,
    castShadow: false,
  })
  box(0.3, 1, 0.3, M.concreteDark, { x: b.x + b.length + 0.2, y: 0.5, z: b.z })

  kit.tagBuilding("gate", [booth])

  /** 0 = barrera baja, 1 = levantada. */
  const setBarrierOpen = (amount: number) => {
    barrierArm.rotation.z = Math.max(0, Math.min(1, amount)) * 1.35
  }

  return { barrierArm, emergencyLamp, setBarrierOpen }
}
