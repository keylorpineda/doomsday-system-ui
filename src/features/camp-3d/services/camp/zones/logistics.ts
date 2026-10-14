import { BUILDINGS, HEIGHTS } from "../layout"

import type { Kit, Placement } from "../kit"

const ACCENT = "#6eff44"
const BRICK_H = 3.6

/**
 * Logística: almacén de ladrillo y chapa con muelle de carga hacia la calle,
 * portón abierto con el interior iluminado, montacargas, pallets y el depósito
 * de combustible con sus tanques.
 */
export function buildLogistics(kit: Kit) {
  const { M, G, box, mesh, group, instanced, sign } = kit
  const f = BUILDINGS.warehouse
  const H = HEIGHTS.warehouse - 1.6
  const g = group({ x: f.x, z: f.z })
  const east = f.w / 2

  const body = box(f.w, BRICK_H, f.d, M.brick, { parent: g, y: BRICK_H / 2 }, 3)
  box(f.w, H - BRICK_H, f.d, M.corrugated, { parent: g, y: BRICK_H + (H - BRICK_H) / 2 })
  mesh(G.gable(f.w + 0.8, 1.6, f.d + 0.8), M.corrugatedRust, { parent: g, y: H })
  // Ventanas altas (claraboyas laterales)
  instanced(
    G.box(0.08, 0.7, 2.2),
    M.windowLit,
    [-7, -2.5, 2.5, 7].flatMap((z) => [
      { x: east + 0.04, y: H - 1, z },
      { x: -east - 0.04, y: H - 1, z },
    ]),
    { parent: g },
  )

  // Muelle de carga sobre la cara este
  const dockX = east + 1.25
  box(2.5, 1.2, f.d - 4, M.concrete, { parent: g, x: dockX, y: 0.6 }, 2)
  box(0.12, 0.2, f.d - 4, M.hazard, { parent: g, x: dockX + 1.26, y: 1.1, castShadow: false }, 1)
  instanced(
    G.box(0.25, 0.5, 0.6),
    M.tire,
    [-6, -2, 2, 6].map((z) => ({ x: dockX + 1.3, y: 0.7, z })),
    { parent: g },
  )
  // Escalera del muelle
  for (let s = 0; s < 4; s++) {
    box(1.2, 0.3, 0.4, M.concreteDark, {
      parent: g,
      x: dockX + 0.6,
      y: 0.15 + s * 0.3,
      z: f.d / 2 - 2.6 + s * 0.4 - 1.6,
    })
  }

  // Portones: uno cerrado (chapa) y uno abierto con interior iluminado
  const doorY = 1.2 + 1.9
  box(0.15, 3.8, 4.4, M.corrugatedRust, { parent: g, x: east + 0.08, y: doorY, z: -4.5 })
  box(0.1, 3.8, 4.4, M.interior, { parent: g, x: east + 0.03, y: doorY, z: 3.5, castShadow: false })
  instanced(
    G.box(1, 1, 1, 1),
    M.crate,
    [
      { x: east - 0.6, y: 1.7, z: 2.2 },
      { x: east - 0.6, y: 1.7, z: 4.6 },
      { x: east - 0.6, y: 2.7, z: 3.4, ry: 0.3 },
    ],
    { parent: g },
  )
  for (const z of [-4.5, 3.5]) {
    box(0.3, 0.3, 4.9, M.hazard, { parent: g, x: east + 0.12, y: 1.2 + 3.95, z }, 1)
  }
  sign("LOGÍSTICA · ALMACÉN", ACCENT, 7, 1, {
    parent: g,
    x: east + 0.12,
    y: H - 0.2,
    ry: Math.PI / 2,
    emissive: 0.75,
  })

  // Luz cálida del muelle (reactiva al inventario) y baliza roja de alerta
  const light = kit.pointLight(0xffcc88, 3, 22, { x: dockX + 2, y: 4.5, z: 0 }, g)
  mesh(G.cyl(0.25, 0.25, 0.4, 10), M.bulbRed, {
    parent: g,
    x: east - 1,
    y: H + 1.8,
    z: 0,
    castShadow: false,
  })
  const alertLight = kit.pointLight(0xff2200, 0, 26, { x: east - 1, y: H + 2.4, z: 0 }, g)

  // Pallets con cajas frente al muelle
  const pallets: Placement[] = []
  const crates: Placement[] = []
  ;[
    [dockX + 4, -5],
    [dockX + 4, -2.5],
    [dockX + 6.5, -5],
  ].forEach(([px, pz]) => {
    pallets.push({ x: px, y: 0.08, z: pz })
    crates.push(
      { x: px - 0.3, y: 0.66, z: pz - 0.3 },
      { x: px + 0.35, y: 0.66, z: pz + 0.3, ry: 0.2 },
    )
    if (kit.rand() < 0.6) crates.push({ x: px, y: 1.66, z: pz, ry: 0.5 })
  })
  instanced(G.box(1.6, 0.16, 1.4), M.woodDark, pallets, { parent: g })
  instanced(G.box(1, 1, 1, 1), M.crate, crates, { parent: g, castShadow: true })

  // Montacargas
  const lift = group({ parent: g, x: dockX + 5, z: 2, ry: -Math.PI / 2 })
  box(1.3, 1, 2, M.hazard, { parent: lift, y: 0.8 }, 2)
  box(1.2, 0.08, 1.2, M.dark, { parent: lift, y: 2.3, z: -0.2 })
  for (const sx of [-1, 1])
    box(0.08, 1.5, 0.08, M.steel, { parent: lift, x: sx * 0.55, y: 1.55, z: -0.2 })
  for (const sx of [-1, 1])
    box(0.12, 2.6, 0.12, M.steel, { parent: lift, x: sx * 0.4, y: 1.3, z: 1.05 })
  for (const sx of [-1, 1])
    box(0.12, 0.06, 1.2, M.steel, { parent: lift, x: sx * 0.3, y: 0.2, z: 1.7 })
  instanced(
    G.cyl(0.3, 0.3, 0.25, 10),
    M.tire,
    [-0.7, 0.7].flatMap((x) => [-0.6, 0.6].map((z) => ({ x, y: 0.3, z, rz: Math.PI / 2 }))),
    { parent: lift },
  )

  // ---- Depósito de combustible ----
  const fuel = BUILDINGS.fuel
  const fg = group({ x: fuel.x, z: fuel.z })
  for (const dz of [-1.7, 1.7]) {
    mesh(G.cyl(1.5, 1.5, 4.2, 18), M.barrelOlive, { parent: fg, y: 2.1 + 0.3, z: dz })
    mesh(G.cyl(1.52, 1.52, 0.3, 18), M.hazard, { parent: fg, y: 3.6, z: dz })
    mesh(G.sphere(1.5, 14), M.barrelOlive, { parent: fg, y: 4.5, z: dz, s: [1, 0.25, 1] })
    // Escalera lateral
    box(0.06, 4.3, 0.5, M.steel, { parent: fg, x: 1.55, y: 2.3, z: dz })
  }
  box(fuel.w, 0.3, fuel.d, M.concrete, { parent: fg, y: 0.15, castShadow: false })
  mesh(G.cyl(0.15, 0.15, fuel.d, 8), M.rust, { parent: fg, x: -1.6, y: 0.6, rx: Math.PI / 2 })
  sign("COMBUSTIBLE", "#d8a21a", 2.6, 0.6, {
    parent: fg,
    x: fuel.w / 2 + 0.2,
    y: 1.2,
    ry: Math.PI / 2,
    emissive: 0.5,
  })

  kit.tagBuilding("warehouse", [body])

  return { light, alertLight }
}
