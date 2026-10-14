import * as THREE from "three"

import { CAMP, OUTER_ROAD, PLAZA, ROADS, WALL } from "./layout"

import type { Kit, Placement } from "./kit"

/**
 * Terreno: suelo del recinto, caminos, plaza, carretera exterior, bosque que
 * rodea la muralla y siluetas de una ciudad en ruinas en el horizonte.
 */
export function buildTerrain(kit: Kit) {
  const { M, G, mesh, instanced, rand } = kit

  // Suelo exterior (hierba/tierra oscura) y suelo interior (tierra compactada).
  mesh(G.plane(520, 520, 10), M.groundOuter, { y: -0.05, castShadow: false })
  mesh(
    G.plane(CAMP.halfX * 2 + WALL.thickness * 2, CAMP.halfZ * 2 + WALL.thickness * 2, 6),
    M.ground,
    {
      y: 0,
      castShadow: false,
    },
  )

  // Caminos interiores de grava, levemente elevados para evitar z-fighting.
  ROADS.forEach((r, i) => {
    mesh(G.plane(r.w, r.d, 4), M.gravel, { x: r.x, y: 0.02 + i * 0.001, z: r.z, castShadow: false })
  })

  // Plaza central: anillo de grava con borde de piedra.
  const plaza = new THREE.CircleGeometry(PLAZA.radius, 40)
  plaza.rotateX(-Math.PI / 2)
  kit.track(plaza)
  mesh(plaza, M.concreteDark, { x: PLAZA.x, y: 0.03, z: PLAZA.z, castShadow: false })
  instanced(
    G.box(0.9, 0.25, 0.5),
    M.concrete,
    Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2
      return {
        x: PLAZA.x + Math.cos(a) * (PLAZA.radius + 0.2),
        y: 0.12,
        z: PLAZA.z + Math.sin(a) * (PLAZA.radius + 0.2),
        ry: -a,
      }
    }),
  )

  // Carretera exterior: asfalto, arcenes y línea central discontinua.
  const roadLen = OUTER_ROAD.zEnd - OUTER_ROAD.zStart
  const roadZ = OUTER_ROAD.zStart + roadLen / 2
  mesh(G.plane(OUTER_ROAD.width, roadLen, 6), M.asphalt, {
    x: OUTER_ROAD.x,
    y: 0.02,
    z: roadZ,
    castShadow: false,
  })
  mesh(G.plane(OUTER_ROAD.width + 4, roadLen, 6), M.dirt, {
    x: OUTER_ROAD.x,
    y: 0.01,
    z: roadZ,
    castShadow: false,
  })
  instanced(
    G.box(0.18, 0.02, 2.2),
    M.whitePaint,
    Array.from({ length: Math.floor(roadLen / 6) }, (_, i) => ({
      x: OUTER_ROAD.x,
      y: 0.04,
      z: OUTER_ROAD.zStart + 4 + i * 6,
    })),
  )

  // Bosque: anillo de pinos y árboles secos fuera de la muralla (sin tapar la
  // carretera). Instanciado: cientos de árboles en un par de draw calls.
  const pines: Placement[] = []
  const dead: Placement[] = []
  for (let i = 0; i < 520; i++) {
    const x = (rand() - 0.5) * 300
    const z = (rand() - 0.5) * 280 - 10
    const outsideWall = Math.abs(x) > CAMP.halfX + 8 || Math.abs(z) > CAMP.halfZ + 8
    const offRoad = Math.abs(x - OUTER_ROAD.x) > OUTER_ROAD.width + 6 || z < CAMP.halfZ
    const clearOfGateApproach = !(z > CAMP.halfZ && z < CAMP.halfZ + 22 && Math.abs(x) < 26)
    if (!outsideWall || !offRoad || !clearOfGateApproach) continue
    const s = 0.8 + rand() * 0.9
    ;(rand() < 0.82 ? pines : dead).push({ x, z, ry: rand() * Math.PI * 2, s })
  }
  // Pino: tronco + 3 conos apilados (cada capa es una instancia del mismo cono).
  instanced(
    G.cyl(0.22, 0.32, 3, 6),
    M.bark,
    pines.map((p) => ({ ...p, y: 1.5 * (p.s as number) })),
  )
  ;[
    { y: 3.4, r: 2.6, h: 4.2 },
    { y: 5.6, r: 2.0, h: 3.6 },
    { y: 7.5, r: 1.3, h: 3 },
  ].forEach((layer, li) => {
    instanced(
      G.cone(layer.r, layer.h, 7),
      li % 2 ? M.leavesDark : M.leaves,
      pines.map((p) => {
        const s = p.s as number
        return { x: p.x, z: p.z, ry: p.ry, y: layer.y * s, s }
      }),
      { castShadow: false },
    )
  })
  instanced(
    G.cyl(0.12, 0.28, 6, 5),
    M.bark,
    dead.map((p) => ({ ...p, y: 3 * (p.s as number), rz: (rand() - 0.5) * 0.15 })),
  )

  // Rocas dispersas fuera de la muralla.
  const rocks: Placement[] = []
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2
    const r = 58 + rand() * 50
    const x = Math.cos(a) * r * 1.15
    const z = Math.sin(a) * r
    if (Math.abs(x) < OUTER_ROAD.width + 3 && z > 0) continue
    const s = 0.5 + rand() * 1.4
    rocks.push({ x, z, y: s * 0.3, s: [s * 1.4, s, s * 1.1], ry: rand() * 6 })
  }
  instanced(G.sphere(1, 6), M.concreteDark, rocks)

  // Ciudad en ruinas en el horizonte norte/este/oeste: bloques oscuros con
  // ventanas apagadas (y alguna encendida) que dan escala y contexto.
  const ruins = kit.group({ y: 0 })
  for (let i = 0; i < 26; i++) {
    const side = i % 3
    const t = rand() * 2 - 1
    const x = side === 0 ? t * 170 : side === 1 ? 150 + rand() * 30 : -150 - rand() * 30
    const z = side === 0 ? -150 - rand() * 40 : t * 120 - 20
    const w = 10 + rand() * 18
    const h = 14 + rand() * 40
    const d = 10 + rand() * 14
    const tilt = rand() < 0.25 ? (rand() - 0.5) * 0.12 : 0
    mesh(G.box(w, h, d, 6), M.concreteDark, {
      parent: ruins,
      x,
      y: h / 2 - 1,
      z,
      rz: tilt,
      castShadow: false,
    })
    if (rand() < 0.35) {
      mesh(G.box(1.2, 1.4, 0.2), M.windowLit, {
        parent: ruins,
        x: x + (rand() - 0.5) * w * 0.6,
        y: 4 + rand() * (h - 8),
        z: z + d / 2 + 0.12,
        castShadow: false,
        receiveShadow: false,
      })
    }
  }
}
