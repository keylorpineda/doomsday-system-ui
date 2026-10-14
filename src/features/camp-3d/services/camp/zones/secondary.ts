import * as THREE from "three"

import { BUILDINGS, PLAZA } from "../layout"

import type { Kit, Placement } from "../kit"

/** Armería, enfermería, huerto, torre de agua y la plaza central. */
export function buildSecondary(kit: Kit) {
  const { M, G, box, mesh, group, instanced, sign, rand } = kit

  // ---- Armería: búnker bajo de concreto con sacos de arena en el techo ----
  {
    const f = BUILDINGS.armory
    const g = group({ x: f.x, z: f.z })
    box(f.w, 3, f.d, M.concreteDark, { parent: g, y: 1.5 }, 3)
    const bags: Placement[] = []
    for (let i = 0; i < 18; i++)
      bags.push({ x: -f.w / 2 + 0.4 + i * 0.66, y: 3.2, z: f.d / 2 - 0.3 })
    for (let i = 0; i < 18; i++)
      bags.push({ x: -f.w / 2 + 0.4 + i * 0.66, y: 3.2, z: -f.d / 2 + 0.3 })
    instanced(G.box(0.62, 0.36, 0.42, 1), M.sandbag, bags, { parent: g })
    box(2.6, 2.4, 0.16, M.steel, { parent: g, y: 1.2, z: f.d / 2 + 0.06 })
    box(2.6, 0.3, 0.2, M.hazard, { parent: g, y: 2.55, z: f.d / 2 + 0.08 }, 1)
    sign("ARMERÍA", "#ff5544", 3, 0.7, {
      parent: g,
      x: 3.4,
      y: 2.2,
      z: f.d / 2 + 0.1,
      emissive: 0.7,
    })
    // Blancos de práctica al este del búnker
    instanced(
      G.box(0.9, 1.4, 0.08, 1),
      M.wood,
      [0, 1, 2].map((i) => ({ x: f.w / 2 + 2.5, y: 1.3, z: -2 + i * 2, ry: -Math.PI / 2 })),
      { parent: g, castShadow: true },
    )
    instanced(
      G.cyl(0.32, 0.32, 0.1, 14),
      M.tarpRed,
      [0, 1, 2].map((i) => ({ x: f.w / 2 + 2.44, y: 1.45, z: -2 + i * 2, rz: Math.PI / 2 })),
      { parent: g },
    )
  }

  // ---- Enfermería: carpa blanca con cruces rojas y catres ----
  {
    const f = BUILDINGS.medical
    const g = group({ x: f.x, z: f.z })
    mesh(G.gable(f.d, 3.2, f.w), M.whitePaint, { parent: g, ry: Math.PI / 2 })
    for (const s of [-1, 1]) {
      box(2, 0.5, 0.06, M.redCross, {
        parent: g,
        y: 1.7,
        z: s * (f.d / 2 - 0.85),
        rx: s * 0.47,
        castShadow: false,
      })
      box(0.5, 0.06, 2, M.redCross, {
        parent: g,
        y: 1.7,
        z: s * (f.d / 2 - 0.85),
        rx: s * 0.47,
        castShadow: false,
      })
    }
    box(0.06, 2.2, 2.4, M.dark, { parent: g, x: f.w / 2, y: 1.1, castShadow: false })
    instanced(
      G.box(0.8, 0.45, 2),
      M.canvasOlive,
      [-3, -1, 1, 3].map((x) => ({ x, y: 0.25, z: 1.6 })),
      { parent: g },
    )
    sign("ENFERMERÍA", "#e8e4dc", 3.4, 0.7, {
      parent: g,
      x: f.w / 2 + 0.6,
      y: 2.6,
      ry: Math.PI / 2,
      emissive: 0.7,
    })
    kit.pointLight(0xe8f0ff, 1.6, 10, { x: f.w / 2 + 1.5, y: 2.4 }, g)
  }

  // ---- Huerto: bancales elevados con cultivos y cerca baja ----
  {
    const f = BUILDINGS.garden
    const g = group({ x: f.x, z: f.z })
    const beds = [-2.6, 0, 2.6]
    beds.forEach((bx) => {
      box(1.8, 0.45, f.d - 1, M.woodDark, { parent: g, x: bx, y: 0.22 })
      box(1.6, 0.05, f.d - 1.2, M.soil, { parent: g, x: bx, y: 0.46, castShadow: false })
    })
    const crops: Placement[] = []
    beds.forEach((bx) => {
      for (let i = 0; i < 9; i++) {
        crops.push({
          x: bx + (i % 2 ? 0.4 : -0.4),
          y: 0.7,
          z: -2.4 + i * 0.6,
          s: 0.7 + rand() * 0.5,
        })
      }
    })
    instanced(G.sphere(0.32, 6), M.crop, crops, { parent: g })
    // Cerca perimetral baja
    const fence: Placement[] = []
    for (let i = 0; i <= 9; i++) {
      fence.push({ x: -f.w / 2 + i, y: 0.5, z: -f.d / 2 }, { x: -f.w / 2 + i, y: 0.5, z: f.d / 2 })
    }
    instanced(G.box(0.1, 1, 0.1), M.wood, fence, { parent: g })
    instanced(G.cyl(0.4, 0.4, 0.9, 10), M.barrelBlue, [{ x: f.w / 2 + 0.6, y: 0.45, z: -2 }], {
      parent: g,
    })
  }

  // ---- Torre de agua ----
  {
    const f = BUILDINGS.waterTower
    const g = group({ x: f.x, z: f.z })
    instanced(
      G.cyl(0.14, 0.18, 8, 6),
      M.steel,
      [-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ x: sx * 1.6, y: 4, z: sz * 1.6 }))),
      { parent: g, castShadow: true },
    )
    mesh(G.cyl(2.2, 2.2, 3, 18), M.rust, { parent: g, y: 9.5 })
    mesh(G.cone(2.4, 1, 18), M.metal, { parent: g, y: 11.5 })
    box(0.06, 8, 0.5, M.steel, { parent: g, x: 1.75, y: 4 })
  }

  // ---- Plaza central: brasero, bancas, tablón de avisos y poste indicador ----
  {
    const g = group({ x: PLAZA.x, z: PLAZA.z })
    mesh(G.cyl(0.9, 0.6, 0.8, 12), M.rust, { parent: g, y: 0.4 })
    const flame = mesh(G.cone(0.55, 1.1, 8), M.bulb, { parent: g, y: 1.3, castShadow: false })
    const brazierLight = kit.pointLight(0xff9a3a, 5, 20, { y: 2.2 }, g)
    instanced(
      G.box(2.4, 0.12, 0.5),
      M.woodDark,
      [0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return { x: Math.cos(a) * 4.2, y: 0.45, z: Math.sin(a) * 4.2, ry: -a + Math.PI / 2 }
      }),
      { parent: g },
    )
    // Tablón de avisos
    box(2.6, 1.6, 0.12, M.woodDark, { parent: g, x: -5.6, y: 1.6, z: -3.2, ry: 0.9 })
    instanced(
      G.box(0.35, 0.45, 0.02),
      M.whitePaint,
      Array.from({ length: 6 }, (_, i) => ({
        x: -5.6 + Math.cos(0.9) * (-0.9 + (i % 3) * 0.9) + 0.06,
        y: 1.3 + Math.floor(i / 3) * 0.6,
        z: -3.2 - Math.sin(0.9) * (-0.9 + (i % 3) * 0.9) + 0.06,
        ry: 0.9,
        rz: (rand() - 0.5) * 0.2,
      })),
      { parent: g },
    )
    // Poste indicador con flechas hacia cada zona
    mesh(G.cyl(0.08, 0.1, 3.4, 6), M.woodDark, { parent: g, x: 5.4, y: 1.7, z: -3 })
    const arrows: Array<[string, string, number]> = [
      ["COMANDO", "#44aaff", -Math.PI / 2],
      ["LOGÍSTICA", "#6eff44", Math.PI],
      ["RESIDENCIAL", "#44aaff", 0],
      ["PORTÓN", "#c8761a", Math.PI / 2],
    ]
    arrows.forEach(([text, color, angle], i) => {
      const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
      sign(text, color, 1.6, 0.32, {
        parent: g,
        x: 5.4 + dir.x * 0.8,
        y: 2.9 - i * 0.4,
        z: -3 + dir.z * 0.8,
        ry: -angle,
        emissive: 0.45,
      })
    })

    return {
      animate: (t: number) => {
        const k = 0.85 + Math.sin(t * 8.3) * 0.1 + Math.sin(t * 15.7) * 0.05
        brazierLight.intensity = 5 * k
        flame.scale.set(1, k * 1.15, 1)
      },
    }
  }
}
