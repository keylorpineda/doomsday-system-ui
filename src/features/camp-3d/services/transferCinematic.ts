import { CAMERA, GARAGE_DOOR, MAIN_GATE } from "./camp/layout"

import type { CameraState } from "../hooks/useThreeScene"

// ---- Cinemática de salida del camión (al crear un traslado) ----
// Keyframes de cámara en coordenadas de mundo, sincronizados con la línea de
// tiempo del camión (camp/truck.ts: arranca a los 1.2 s y acelera hasta
// perderse en la niebla a los 7.8 s). La cámara orbital se reconstruye cada
// frame desde camState, así que basta con interpolar theta/phi/radius/target.
interface CineKey {
  t: number
  target: [number, number, number]
  theta: number
  phi: number
  radius: number
}
export const CINE_KEYS: CineKey[] = [
  // Desde la avenida, mirando por el portón abierto del taller: el camión de
  // frente con los faros encendiéndose.
  { t: 0, target: [GARAGE_DOOR.x + 5.5, 1.6, GARAGE_DOOR.z], theta: Math.PI, phi: 1.4, radius: 11 },
  // El camión sale del taller; plano desde la barrera de admisiones.
  { t: 2.6, target: [GARAGE_DOOR.x, 1.8, GARAGE_DOOR.z + 0.5], theta: 2.5, phi: 1.25, radius: 13 },
  // Desde el interior del campamento: el camión encara el portón.
  { t: 4, target: [MAIN_GATE.x + 0.6, 2, MAIN_GATE.z - 5], theta: -2, phi: 1.15, radius: 18 },
  // Por encima de la muralla: ya va por la carretera.
  { t: 5.4, target: [MAIN_GATE.x, 2.5, MAIN_GATE.z + 12], theta: -1.75, phi: 1, radius: 24 },
  // Plano de despedida mientras se pierde en la niebla.
  { t: 7, target: [MAIN_GATE.x, 3, MAIN_GATE.z + 36], theta: -1.6, phi: 0.95, radius: 36 },
]
export const CINE_DURATION = 7.8
// Duración del blend-out al terminar la cinemática (transición suave de vuelta
// a la cámara orbital para evitar el tirón al cortar el control guionado).
export const CINE_BLEND_OUT = 2.2
// Pose de reposo: la misma con la que arranca la cámara orbital (layout.CAMERA).
export const CINE_REST: Omit<CineKey, "t"> = {
  target: [...CAMERA.initial.target],
  theta: CAMERA.initial.theta,
  phi: CAMERA.initial.phi,
  radius: CAMERA.initial.radius,
}

const smoothstep = (x: number) => x * x * (3 - 2 * x)

const lerp = (from: number, to: number, k: number) => from + (to - from) * k

/** Interpola entre dos poses de cámara con un factor ya suavizado `k`. */
function applyPose(cam: CameraState, a: Omit<CineKey, "t">, b: Omit<CineKey, "t">, k: number) {
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
 * recorre los keyframes guionados y luego hace un blend-out suave hacia la pose
 * de reposo (evita el tirón al devolver el control orbital).
 *
 * @returns `true` cuando la cinemática (incluido el blend-out) terminó.
 */
export function updateCinematicCamera(ct: number, cam: CameraState): boolean {
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
    applyPose(cam, a, b, smoothstep(Math.max(0, Math.min(1, (ct - a.t) / span))))
    return false
  }

  const blendT = Math.min((ct - CINE_DURATION) / CINE_BLEND_OUT, 1)
  applyPose(cam, CINE_KEYS[CINE_KEYS.length - 1], CINE_REST, smoothstep(blendT))
  return blendT >= 1
}
