import { BUILDINGS, GARAGE_DOOR } from "../layout"

import type { Kit, Placement } from "../kit"

const ACCENT = "#ffdd00"
const WALL_H = 4.9
const ROOF_H = 1.5
const PANEL = 0.3

/**
 * Taller de vehículos (traslados): hangar de chapa con paredes reales —no una
 * caja sólida— para que al subir la cortina metálica se vea el interior: el
 * camión estacionado, el banco de trabajo, herramientas y luz cálida.
 */
export function buildMotorPool(kit: Kit) {
  const { M, G, box, mesh, group, instanced, sign } = kit
  const f = BUILDINGS.garage
  const g = group({ x: f.x, z: f.z })
  const hw = f.w / 2
  const hd = f.d / 2
  const doorHalf = GARAGE_DOOR.width / 2
  const sidePiece = hd - doorHalf

  // Losa de concreto (interior y delantal frente al portón)
  box(f.w, 0.12, f.d, M.concreteDark, { parent: g, y: 0.06, castShadow: false }, 3)
  box(
    3,
    0.1,
    GARAGE_DOOR.width + 1,
    M.concreteDark,
    { parent: g, x: -hw - 1.5, y: 0.05, castShadow: false },
    3,
  )

  // Paredes de chapa: norte, sur, fondo (este) y frente (oeste) con el hueco del portón
  const shell = [
    box(f.w, WALL_H, PANEL, M.corrugated, { parent: g, y: WALL_H / 2, z: -hd + PANEL / 2 }),
    box(f.w, WALL_H, PANEL, M.corrugated, { parent: g, y: WALL_H / 2, z: hd - PANEL / 2 }),
    box(PANEL, WALL_H, f.d, M.corrugated, { parent: g, x: hw - PANEL / 2, y: WALL_H / 2 }),
    box(PANEL, WALL_H, sidePiece, M.corrugated, {
      parent: g,
      x: -hw + PANEL / 2,
      y: WALL_H / 2,
      z: -hd + sidePiece / 2,
    }),
    box(PANEL, WALL_H, sidePiece, M.corrugated, {
      parent: g,
      x: -hw + PANEL / 2,
      y: WALL_H / 2,
      z: hd - sidePiece / 2,
    }),
    box(PANEL, WALL_H - GARAGE_DOOR.height, GARAGE_DOOR.width, M.corrugated, {
      parent: g,
      x: -hw + PANEL / 2,
      y: GARAGE_DOOR.height + (WALL_H - GARAGE_DOOR.height) / 2,
    }),
    // Techo a dos aguas con la cumbrera a lo largo del hangar (eje x)
    mesh(G.gable(f.d + 0.8, ROOF_H, f.w + 0.8), M.corrugated, {
      parent: g,
      y: WALL_H,
      ry: Math.PI / 2,
    }),
  ]
  // Marco del portón con franjas de seguridad
  for (const sz of [-1, 1]) {
    box(
      0.35,
      GARAGE_DOOR.height,
      0.35,
      M.hazard,
      {
        parent: g,
        x: -hw - 0.05,
        y: GARAGE_DOOR.height / 2,
        z: sz * (doorHalf + 0.17),
      },
      1,
    )
  }
  sign("TALLER · TRASLADOS", ACCENT, 6, 0.85, {
    parent: g,
    x: -hw - 0.2,
    y: GARAGE_DOOR.height + 0.2 + 0.43,
    ry: -Math.PI / 2,
    emissive: 0.75,
  })

  // Cortina metálica enrollable: se "enrolla" hacia el tambor superior
  const drumY = GARAGE_DOOR.height + 0.05
  mesh(G.cyl(0.3, 0.3, GARAGE_DOOR.width + 0.2, 10), M.steel, {
    parent: g,
    x: -hw + 0.55,
    y: drumY,
    rx: Math.PI / 2,
  })
  const door = group({ parent: g, x: -hw + 0.45 })
  const doorPanel = box(0.12, GARAGE_DOOR.height, GARAGE_DOOR.width, M.corrugated, {
    parent: door,
    y: GARAGE_DOOR.height / 2,
  })
  const setDoorOpen = (amount: number) => {
    const a = Math.max(0, Math.min(1, amount))
    const visible = 1 - a * 0.96
    doorPanel.scale.y = visible
    doorPanel.position.y = GARAGE_DOOR.height - (GARAGE_DOOR.height * visible) / 2
  }

  // ---- Interior ----
  // Banco de trabajo con tornillo de banco y panel de herramientas
  box(5, 0.12, 1, M.wood, { parent: g, x: 2, y: 1, z: -hd + 1 })
  box(5, 0.9, 0.9, M.woodDark, { parent: g, x: 2, y: 0.47, z: -hd + 1 })
  box(5.2, 1.8, 0.08, M.woodDark, { parent: g, x: 2, y: 2.3, z: -hd + PANEL + 0.05 })
  const tools: Placement[] = []
  for (let i = 0; i < 9; i++)
    tools.push({
      x: -0.2 + i * 0.55,
      y: 2.2 + (i % 3) * 0.35,
      z: -hd + PANEL + 0.12,
      rz: (i % 2) * 0.6,
    })
  instanced(G.box(0.08, 0.5, 0.05), M.steel, tools, { parent: g })
  mesh(G.box(0.3, 0.25, 0.3), M.steel, { parent: g, x: 0, y: 1.2, z: -hd + 1 })

  // Pila de neumáticos y tambores de aceite al fondo
  instanced(
    G.torus(0.45, 0.18, 12),
    M.tire,
    [0, 1, 2, 3].map((i) => ({ x: hw - 1.2, y: 0.2 + i * 0.36, z: hd - 1.4, rx: Math.PI / 2 })),
    { parent: g, castShadow: true },
  )
  instanced(
    G.cyl(0.35, 0.35, 1, 12),
    M.barrelRed,
    [
      { x: hw - 1, y: 0.5, z: -hd + 1.2 },
      { x: hw - 1.8, y: 0.5, z: -hd + 1 },
      { x: hw - 1.3, y: 0.5, z: -hd + 2 },
    ],
    { parent: g, castShadow: true },
  )
  // Manchas de aceite en el piso
  instanced(
    G.cyl(0.9, 0.9, 0.01, 14),
    M.dark,
    [
      { x: 0.5, y: 0.13, z: 0.6, s: [1.3, 1, 0.8] },
      { x: -2.5, y: 0.13, z: -0.8 },
    ],
    { parent: g },
  )

  // Lámparas colgantes (emisivas) + una luz cálida real que baña al camión
  const lamps: Placement[] = [-3, 1, 4.5].map((x) => ({ x, y: WALL_H - 0.4, z: 0 }))
  instanced(G.cone(0.45, 0.35, 10), M.steel, lamps, { parent: g })
  instanced(
    G.sphere(0.16, 8),
    M.bulb,
    lamps.map((p) => ({ ...p, y: (p.y as number) - 0.2 })),
    { parent: g },
  )
  const interiorLight = kit.pointLight(0xffc98a, 6, 18, { x: -1, y: WALL_H - 0.8, z: 0 }, g)
  // Foco exterior sobre el portón
  mesh(G.box(0.5, 0.25, 0.4), M.bulb, {
    parent: g,
    x: -hw - 0.3,
    y: WALL_H + 0.2,
    castShadow: false,
  })

  kit.tagBuilding("garage", shell)

  return { door, setDoorOpen, interiorLight }
}
