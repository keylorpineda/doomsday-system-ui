import * as THREE from "three"

import { TRANSFER_PATH, TRUCK_PARK } from "./layout"

import type { Kit } from "./kit"

/** Línea de tiempo del traslado (segundos desde que se dispara). */
export const TRANSFER_TIMELINE = {
  doorOpen: [0, 1.1],
  lightsOn: [0.2, 0.8],
  driveStart: 1.2,
  driveDuration: 6.6,
  /** Tras perderse en la niebla: se cierran puertas y el camión vuelve al taller. */
  reset: 10.6,
} as const

const DRIVE_END = TRANSFER_TIMELINE.driveStart + TRANSFER_TIMELINE.driveDuration
/** Aceleración: arranca despacio dentro del taller y acelera en la carretera. */
const ease = (s: number) => Math.pow(s, 1.8)

export interface TruckControls {
  setGarageDoor: (amount: number) => void
  /** Pide (o libera) que el portón principal y la barrera estén abiertos. */
  holdGate: (key: string, open: boolean) => void
}

/** Camión militar del traslado: modelo detallado + animación de salida del campamento. */
export function buildTruck(kit: Kit, controls: TruckControls) {
  const { M, G, std, track } = kit
  const truck = new THREE.Group()
  const add = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    rx = 0,
    rz = 0,
  ) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.rotation.set(rx, 0, rz)
    m.castShadow = true
    m.receiveShadow = true
    truck.add(m)
    return m
  }

  // Materiales: verde oliva envejecido, metal reflectivo y cristal
  const body = std({
    color: 0x5c6442,
    map: kit.TX.rust.map,
    normalMap: kit.TX.rust.normalMap,
    roughness: 0.84,
    metalness: 0.1,
  })
  const cab = std({
    color: 0x4a5234,
    map: kit.TX.rust.map,
    normalMap: kit.TX.rust.normalMap,
    roughness: 0.8,
    metalness: 0.15,
  })
  const metal = std({ color: kit.C.metal, roughness: 0.38, metalness: 0.78 })
  const glass = std({
    color: 0x3a5060,
    transparent: true,
    opacity: 0.55,
    roughness: 0.04,
    metalness: 0.45,
  })
  const headMat = std({
    color: 0xfffde8,
    emissive: 0xffcc66,
    emissiveIntensity: 0,
    roughness: 0.1,
    metalness: 0.4,
  })
  const tailMat = std({ color: 0x440000, emissive: 0xff1100, emissiveIntensity: 0, roughness: 0.3 })

  // Chasis y travesaños
  add(G.box(0.2, 0.22, 6), metal, -0.85, 0.48, -0.1)
  add(G.box(0.2, 0.22, 6), metal, 0.85, 0.48, -0.1)
  for (const cz of [-2.4, -1.2, 0.2, 1.4, 2.4]) add(G.box(1.9, 0.16, 0.2), metal, 0, 0.48, cz)
  // Caja de carga con costillas y compuerta
  add(G.box(2.1, 1.55, 3.85, 1.5), body, 0, 1.66, -0.95)
  add(G.box(2.2, 0.12, 4), metal, 0, 2.5, -0.95)
  for (let i = 0; i < 4; i++) {
    add(G.box(0.09, 1.55, 0.14), metal, -1.08, 1.66, -2.4 + i * 0.9)
    add(G.box(0.09, 1.55, 0.14), metal, 1.08, 1.66, -2.4 + i * 0.9)
  }
  add(G.box(2.05, 1.5, 0.1), body, 0, 1.64, -2.92, 0.08)
  // Cabina, techo, capó, frente, parrilla y paragolpes reforzado
  add(G.box(2.05, 1.55, 1.95, 1.5), cab, 0, 1.72, 1.62)
  add(G.box(2.15, 0.14, 2.05), metal, 0, 2.56, 1.58)
  add(G.box(1.95, 0.55, 1.7), cab, 0, 1.28, 2.8, -0.07)
  add(G.box(1.95, 1.35, 0.2), M.dark, 0, 0.98, 3.62)
  add(G.box(1.5, 0.65, 0.08), metal, 0, 0.88, 3.72)
  add(G.box(2.3, 0.42, 0.25), metal, 0, 0.45, 3.72)
  add(G.box(0.22, 0.58, 0.55), metal, -0.9, 0.45, 3.54)
  add(G.box(0.22, 0.58, 0.55), metal, 0.9, 0.45, 3.54)
  // Cristales
  add(G.box(1.75, 0.82, 0.08), glass, 0, 2.1, 2.6, -0.3)
  add(G.box(0.08, 0.72, 1), glass, -1.03, 2.05, 1.62)
  add(G.box(0.08, 0.72, 1), glass, 1.03, 2.05, 1.62)
  // Faros y luces traseras (emisivos animados)
  add(G.sphere(0.18, 8), headMat, -0.68, 1, 3.74)
  add(G.sphere(0.18, 8), headMat, 0.68, 1, 3.74)
  add(G.box(0.22, 0.16, 0.05), tailMat, -0.85, 0.95, -3.1)
  add(G.box(0.22, 0.16, 0.05), tailMat, 0.85, 0.95, -3.1)
  // Espejos, escape, tanque, rueda de repuesto y escalones
  add(G.box(0.3, 0.18, 0.12), metal, -1.2, 2.35, 2.3)
  add(G.box(0.3, 0.18, 0.12), metal, 1.2, 2.35, 2.3)
  add(G.cyl(0.055, 0.06, 1.55, 8), metal, -1.18, 1.98, 0.95)
  add(G.cyl(0.28, 0.28, 1.2, 10), metal, 0.92, 0.5, -0.95, 0, Math.PI / 2)
  add(G.cyl(0.48, 0.48, 0.25, 12), M.tire, 0, 1.58, -2.98, Math.PI / 2)
  add(G.box(0.38, 0.08, 0.52), metal, -1.1, 0.58, 1.35)
  add(G.box(0.38, 0.08, 0.52), metal, 1.1, 0.58, 1.35)
  // Ruedas (se guardan para animar la rodadura)
  const wheels: THREE.Mesh[] = []
  const rim = G.cyl(0.3, 0.3, 0.36, 10)
  const wheel = (r: number, x: number, z: number) => {
    const w = add(G.cyl(r, r, r > 0.51 ? 0.34 : 0.28, 14), M.tire, x, r, z, 0, Math.PI / 2)
    add(rim, metal, x, r, z, 0, Math.PI / 2)
    wheels.push(w)
  }
  wheel(0.52, -0.95, 2.78)
  wheel(0.52, 0.95, 2.78)
  for (const [x, z] of [
    [-0.88, -0.62],
    [0.88, -0.62],
    [-0.88, -1.85],
    [0.88, -1.85],
  ]) {
    wheel(0.5, x, z)
  }

  // Luces reales: un foco frontal y la luz trasera. Se quedan SIEMPRE en la
  // escena (intensidad 0 en reposo): ocultarlas cambiaría el número de luces y
  // forzaría a recompilar todos los shaders.
  const headSpot = new THREE.SpotLight(0xfff5cc, 0, 45, Math.PI / 6, 0.45, 1.4)
  headSpot.position.set(0, 1.05, 3.8)
  headSpot.target.position.set(0, 0.3, 14)
  const rearLight = new THREE.PointLight(0xff2200, 0, 9)
  rearLight.position.set(0, 0.95, -3.4)
  truck.add(headSpot, headSpot.target, rearLight)

  const park = () => {
    truck.position.set(TRUCK_PARK.x, 0, TRUCK_PARK.z)
    truck.rotation.set(0, TRUCK_PARK.heading, 0)
  }
  park()
  kit.root.add(truck)

  const body3D = truck.children.filter((c) => !(c as THREE.Light).isLight)
  const setBodyVisible = (v: boolean) => body3D.forEach((c) => (c.visible = v))

  // Humo de los neumáticos (instanciado)
  const SMOKE = 120
  const smoke = new THREE.InstancedMesh(
    track(new THREE.SphereGeometry(0.4, 6, 4)),
    std({ color: 0x8f8a84, transparent: true, opacity: 0.4, depthWrite: false }),
    SMOKE,
  )
  smoke.count = 0
  kit.root.add(smoke)
  const life = new Float32Array(SMOKE)
  const smokePos = new Float32Array(SMOKE * 3)
  let smokeIdx = 0
  const m4 = new THREE.Matrix4()

  const path = new THREE.CatmullRomCurve3(
    TRANSFER_PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  )
  const p = new THREE.Vector3()
  const ahead = new THREE.Vector3()
  const exhaust = new THREE.Vector3()
  let start = -1
  let queued = false
  let wheelAngle = 0
  let bodyVisible = true
  let lastDist = 0
  let lastT = 0
  const curveLen = path.getLength()

  const setLights = (k: number) => {
    headSpot.intensity = k * 26
    rearLight.intensity = k * 6
    headMat.emissiveIntensity = k * 9
    tailMat.emissiveIntensity = k * 5
  }

  const animate = (t: number) => {
    const dt = Math.min(0.05, Math.max(0, t - lastT))
    lastT = t
    if (queued) {
      queued = false
      start = t
      park()
      bodyVisible = true
      setBodyVisible(true)
      wheelAngle = 0
      lastDist = 0
      controls.holdGate("truck", true)
    }

    // Humo: envejece y sube aunque el camión ya no esté (se disipa suave)
    let alive = 0
    for (let i = 0; i < SMOKE; i++) {
      if (life[i] <= 0) continue
      life[i] -= dt * 0.8
      smokePos[i * 3 + 1] += dt * 0.6
      const s = 0.6 + (1 - Math.max(life[i], 0)) * 2.6
      m4.makeScale(s, s * 0.7, s).setPosition(
        smokePos[i * 3],
        smokePos[i * 3 + 1],
        smokePos[i * 3 + 2],
      )
      smoke.setMatrixAt(i, life[i] > 0 ? m4 : m4.makeScale(0, 0, 0))
      alive++
    }
    smoke.count = alive > 0 ? SMOKE : 0
    smoke.instanceMatrix.needsUpdate = alive > 0

    if (start < 0) return
    const tk = t - start
    const [d0, d1] = TRANSFER_TIMELINE.doorOpen
    controls.setGarageDoor(
      tk < DRIVE_END ? Math.min(1, (tk - d0) / (d1 - d0)) : Math.max(0, 1 - (tk - DRIVE_END) / 1.2),
    )
    const [l0, l1] = TRANSFER_TIMELINE.lightsOn
    const ignition = tk < l1 ? 0.5 + Math.random() * 0.5 : 1
    setLights(tk < DRIVE_END ? Math.max(0, Math.min(1, (tk - l0) / (l1 - l0))) * ignition : 0)

    if (tk >= TRANSFER_TIMELINE.driveStart && tk < DRIVE_END) {
      const s = (tk - TRANSFER_TIMELINE.driveStart) / TRANSFER_TIMELINE.driveDuration
      const u = ease(s)
      path.getPointAt(u, p)
      path.getPointAt(Math.min(u + 0.012, 1), ahead)
      const dist = u * curveLen
      wheelAngle += (dist - lastDist) / 0.52
      lastDist = dist
      truck.position.set(p.x, Math.sin(wheelAngle * 1.7) * 0.025, p.z)
      truck.rotation.y = Math.atan2(ahead.x - p.x, ahead.z - p.z)
      truck.rotation.z = Math.sin(wheelAngle * 0.9) * 0.012
      wheels.forEach((w) => (w.rotation.x = -wheelAngle))
      truck.updateMatrixWorld()
      // Humo de escape/neumáticos detrás del camión
      if (Math.random() < 0.7) {
        exhaust.set(0, 0.35, -3.2).applyMatrix4(truck.matrixWorld)
        const i = smokeIdx
        smokeIdx = (smokeIdx + 1) % SMOKE
        life[i] = 0.8 + Math.random() * 0.6
        smokePos[i * 3] = exhaust.x + (Math.random() - 0.5) * 0.6
        smokePos[i * 3 + 1] = exhaust.y
        smokePos[i * 3 + 2] = exhaust.z
      }
    }
    if (tk >= DRIVE_END && bodyVisible) {
      bodyVisible = false
      setBodyVisible(false)
      controls.holdGate("truck", false)
    }
    if (tk >= TRANSFER_TIMELINE.reset) {
      start = -1
      park()
      bodyVisible = true
      setBodyVisible(true)
      controls.setGarageDoor(0)
    }
  }

  return {
    animate,
    play: () => {
      if (start < 0) queued = true
    },
  }
}
