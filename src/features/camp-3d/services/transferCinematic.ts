import { CAMERA, MAIN_GATE, TRUCK_PARK } from "./camp/layout"

import type { CameraState } from "../hooks/useThreeScene"
import type * as THREE from "three"

// ---- Cinemática de salida del camión (al crear un traslado) ----
// Planos de cámara sincronizados con la conducción del camión (camp/truck.ts:
// sale del taller ~4 s, cruza el portón ~8 s y acelera por la carretera). Cada
// plano fija ángulo y distancia; `follow` indica cuánto apunta la cámara a la
// posición REAL del camión (1 = lo sigue por completo), así nunca sale de cuadro.
interface CinePose {
  target: [number, number, number]
  theta: number
  phi: number
  radius: number
}
interface CineKey extends CinePose {
  t: number
  follow: number
}
export const CINE_KEYS: CineKey[] = [
  // Desde la avenida, mirando por el portón abierto del taller: el camión de
  // frente con los faros encendiéndose.
  {
    t: 0,
    target: [TRUCK_PARK.x - 2, 1.6, TRUCK_PARK.z],
    theta: Math.PI,
    phi: 1.4,
    radius: 11,
    follow: 0.5,
  },
  // Sale del taller; plano lateral bajo desde la barrera de admisiones.
  { t: 3.4, target: [6, 1.6, 25], theta: 2.5, phi: 1.25, radius: 13, follow: 1 },
  // Encara el portón: plano desde el interior del campamento.
  {
    t: 6.2,
    target: [MAIN_GATE.x, 2, MAIN_GATE.z - 5],
    theta: -2,
    phi: 1.15,
    radius: 17,
    follow: 1,
  },
  // Cruza el portón: plano alto, por encima de la muralla.
  {
    t: 8.4,
    target: [MAIN_GATE.x, 2, MAIN_GATE.z + 6],
    theta: -1.75,
    phi: 0.98,
    radius: 21,
    follow: 1,
  },
  // En la carretera: cámara de persecución desde atrás.
  {
    t: 10.6,
    target: [MAIN_GATE.x, 1.6, MAIN_GATE.z + 40],
    theta: -Math.PI / 2,
    phi: 1.22,
    radius: 15,
    follow: 1,
  },
  // Despedida: plano abierto mientras se aleja hacia la niebla.
  {
    t: 12.8,
    target: [MAIN_GATE.x, 3, MAIN_GATE.z + 70],
    theta: -1.4,
    phi: 0.95,
    radius: 32,
    follow: 0.7,
  },
]
export const CINE_DURATION = 13.2
// Duración del blend-out al terminar la cinemática (transición suave de vuelta
// a la cámara orbital para evitar el tirón al cortar el control guionado).
export const CINE_BLEND_OUT = 2.4
// Pose de reposo: la misma con la que arranca la cámara orbital (layout.CAMERA).
export const CINE_REST: CinePose = {
  target: [...CAMERA.initial.target],
  theta: CAMERA.initial.theta,
  phi: CAMERA.initial.phi,
  radius: CAMERA.initial.radius,
}

/** Memoria entre frames: la pose real desde la que arranca el blend-out. */
export interface CinematicMemory {
  blendFrom?: CinePose
}

const smoothstep = (x: number) => x * x * (3 - 2 * x)

const lerp = (from: number, to: number, k: number) => from + (to - from) * k

/** Interpola entre dos poses de cámara con un factor ya suavizado `k`. */
function applyPose(cam: CameraState, a: CinePose, b: CinePose, k: number) {
  cam.target.set(
    lerp(a.target[0], b.target[0], k),
    lerp(a.target[1], b.target[1], k),
    lerp(a.target[2], b.target[2], k),
  )
  cam.theta = lerp(a.theta, b.theta, k)
  cam.phi = lerp(a.phi, b.phi, k)
  cam.radius = lerp(a.radius, b.radius, k)
}

/**
 * Coloca la cámara orbital en el instante `ct` (s) de la cinemática: primero
 * recorre los planos guionados (apuntando al camión según `follow` si se pasa
 * `focus`) y luego hace un blend-out suave desde la pose real hasta la de
 * reposo (evita el tirón al devolver el control orbital).
 *
 * @returns `true` cuando la cinemática (incluido el blend-out) terminó.
 */
export function updateCinematicCamera(
  ct: number,
  cam: CameraState,
  focus: THREE.Vector3 | null = null,
  memory: CinematicMemory = {},
): boolean {
  if (ct <= CINE_DURATION) {
    let a = CINE_KEYS[0]
    let b = CINE_KEYS[CINE_KEYS.length - 1]
    for (let i = 0; i < CINE_KEYS.length - 1; i++) {
      if (ct >= CINE_KEYS[i].t && ct <= CINE_KEYS[i + 1].t) {
        a = CINE_KEYS[i]
        b = CINE_KEYS[i + 1]
        break
      }
    }
    const span = b.t - a.t || 1
    const k = smoothstep(Math.max(0, Math.min(1, (ct - a.t) / span)))
    applyPose(cam, a, b, k)
    if (focus) cam.target.lerp(focus, lerp(a.follow, b.follow, k))
    return false
  }

  if (!memory.blendFrom) {
    memory.blendFrom = {
      target: cam.target.toArray() as [number, number, number],
      theta: cam.theta,
      phi: cam.phi,
      radius: cam.radius,
    }
  }
  // Tolerancia: sumas de tiempos en punto flotante pueden quedar 1e-15 cortas
  const blendT = Math.min((ct - CINE_DURATION) / CINE_BLEND_OUT + 1e-9, 1)
  applyPose(cam, memory.blendFrom, CINE_REST, smoothstep(blendT))
  return blendT >= 1
}
