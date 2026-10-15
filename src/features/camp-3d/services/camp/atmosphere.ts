import * as THREE from "three"

import { BUILDINGS, CAMP, FOG_SCALE, footprintGap, isFreeSpot, PLAZA, ROADS } from "./layout"

import type { Kit, Placement } from "./kit"

/**
 * Iluminación global, niebla, faroles de los caminos y partículas (polvo en
 * suspensión, brasas y humo de las fogatas).
 */
export function buildAtmosphere(kit: Kit, scene: THREE.Scene) {
  const { M, G, instanced, rand, visuals } = kit
  const L = visuals.lighting

  scene.fog = new THREE.Fog(
    visuals.colors.fog,
    visuals.fog.near * FOG_SCALE.near,
    visuals.fog.far * FOG_SCALE.far,
  )
  scene.background = new THREE.Color(visuals.colors.fog)

  kit.root.add(new THREE.AmbientLight(L.ambientColor, L.ambientIntensity * 0.85))
  kit.root.add(new THREE.HemisphereLight(L.skyColor, 0x1a1c14, L.skyIntensity * 1.8))

  // Luna con sombras que cubren todo el recinto
  const moon = new THREE.DirectionalLight(L.moonColor, L.moonIntensity * 1.35)
  // Desde el sureste: ilumina las fachadas principales (las que miran a la plaza y al portón)
  moon.position.set(38, 70, 48)
  moon.castShadow = true
  moon.shadow.mapSize.set(2048, 2048)
  const sc = moon.shadow.camera
  // La luz llega en diagonal: el recinto proyectado en su plano es más ancho
  // que el rectángulo del campamento, así que se cubre con margen.
  const reach = Math.hypot(CAMP.halfX, CAMP.halfZ) + 6
  sc.left = -reach
  sc.right = reach
  sc.top = reach
  sc.bottom = -reach
  sc.near = 10
  sc.far = 160
  moon.shadow.bias = -0.0008
  moon.shadow.normalBias = 0.04
  kit.root.add(moon, moon.target)

  // Faroles a lo largo de los caminos (bombillas emisivas, sin luz real)
  const poles: Placement[] = []
  const heads: Placement[] = []
  const addLamp = (x: number, z: number) => {
    poles.push({ x, y: 2.4, z })
    heads.push({ x, y: 4.85, z })
  }
  for (const r of ROADS) {
    const long = r.d > r.w
    const len = long ? r.d : r.w
    const count = Math.floor(len / 9)
    for (let i = 1; i < count; i++) {
      const t = -len / 2 + (i * len) / count
      const side = i % 2 ? 1 : -1
      const x = long ? r.x + side * (r.w / 2 + 0.6) : r.x + t
      const z = long ? r.z + t : r.z + side * (r.d / 2 + 0.6)
      if (!isFreeSpot(x, z, 0.3)) continue
      // El toldo de registro de admisiones ocupa la franja entre la caseta y la avenida
      if (footprintGap(BUILDINGS.checkpoint, { x, z, w: 0.6, d: 0.6 }) < 5) continue
      addLamp(x, z)
    }
  }
  instanced(G.cyl(0.08, 0.12, 4.8, 6), M.steel, poles, { castShadow: true })
  instanced(G.box(0.5, 0.18, 0.3), M.bulb, heads)

  // ---- Partículas ----
  const particles: Array<{ geo: THREE.BufferGeometry; update: (t: number) => void }> = []

  /** Nube de puntos que sube desde una fuente y se reinicia al llegar arriba. */
  const emitter = (
    count: number,
    origin: [number, number, number],
    spread: number,
    height: number,
    speed: number,
    material: THREE.PointsMaterial,
  ) => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    const reset = (i: number, randomHeight: boolean) => {
      pos[i * 3] = origin[0] + (rand() - 0.5) * spread
      pos[i * 3 + 1] = origin[1] + (randomHeight ? rand() * height : 0)
      pos[i * 3 + 2] = origin[2] + (rand() - 0.5) * spread
      vel[i] = speed * (0.6 + rand() * 0.8)
    }
    for (let i = 0; i < count; i++) reset(i, true)
    const geo = kit.track(new THREE.BufferGeometry())
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    const points = new THREE.Points(geo, kit.track(material))
    kit.root.add(points)
    particles.push({
      geo,
      update: (t) => {
        for (let i = 0; i < count; i++) {
          pos[i * 3 + 1] += vel[i]
          pos[i * 3] += Math.sin(t * 1.3 + i) * 0.004
          if (pos[i * 3 + 1] > origin[1] + height) reset(i, false)
        }
        geo.attributes.position.needsUpdate = true
      },
    })
  }

  const ember = new THREE.PointsMaterial({
    color: 0xff8a3a,
    size: 0.12,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  })
  const smoke = new THREE.PointsMaterial({
    color: 0x8a8a84,
    size: 0.9,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  })
  const tents = BUILDINGS.tents
  emitter(40, [PLAZA.x, 1.4, PLAZA.z], 0.8, 4, 0.025, ember)
  emitter(40, [tents.x, 0.8, tents.z + 5.6], 0.8, 3.5, 0.022, ember.clone())
  emitter(30, [PLAZA.x, 1.8, PLAZA.z], 1.2, 9, 0.02, smoke)
  emitter(
    24,
    [BUILDINGS.hq.x + BUILDINGS.hq.w / 2 + 2.9, 3.2, BUILDINGS.hq.z - 2.5],
    0.4,
    7,
    0.018,
    smoke.clone(),
  )

  // Polvo en suspensión sobre todo el recinto
  {
    const count = 260
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * CAMP.halfX * 2
      pos[i * 3 + 1] = rand() * 9
      pos[i * 3 + 2] = (rand() - 0.5) * CAMP.halfZ * 2
    }
    const geo = kit.track(new THREE.BufferGeometry())
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    const dust = new THREE.Points(
      geo,
      kit.track(
        new THREE.PointsMaterial({
          color: 0xb8b39a,
          size: 0.07,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        }),
      ),
    )
    kit.root.add(dust)
    particles.push({
      geo,
      update: (t) => {
        dust.position.x = Math.sin(t * 0.05) * 3
        dust.position.y = Math.sin(t * 0.13) * 0.4
      },
    })
  }

  return {
    moon,
    animate: (t: number) => particles.forEach((p) => p.update(t)),
  }
}
