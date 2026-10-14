import type { CameraState } from "../hooks/useThreeScene"

// ---- Cinemática de salida del camión (al crear un traslado) ----
// Keyframes de cámara en coordenadas de MUNDO (raw × SCENE_SCALE). La cámara
// orbital se reconstruye cada frame desde camState, así que basta con interpolar
// theta/phi/radius/target a lo largo de estos puntos para "guionar" el plano.
// Keyframe 0: cámara frente a la entrada del garaje (exterior, z>19.6 world),
// mirando hacia el interior donde el camión está aparcado — la puerta ya abrió.
interface CineKey {
  t: number
  target: [number, number, number]
  theta: number
  phi: number
  radius: number
}
const CINE_KEYS: CineKey[] = [
  // t=0: cámara casi en la entrada del garaje (radius=7 → z≈18.8 world, entrada en z=16.9).
  // El camión llena el frame desde dentro — sus faros encendidos son lo primero que se ve.
  // phi=1.40 pone y≈2.2, exactamente a altura de los faros del camión.
  { t: 0.0, target: [18.9, 1.0, 11.9], theta: 1.571, phi: 1.4, radius: 7 },
  // t=1.8: retrocede y sube levemente para encuadrar la salida completa
  { t: 1.8, target: [18.0, 1.6, 19.5], theta: 2.05, phi: 1.12, radius: 20 },
  // t=3.5: seguimiento al giro en la carretera de acceso
  { t: 3.5, target: [11.0, 1.6, 22.5], theta: 2.4, phi: 1.0, radius: 23 },
  // t=5.5: camión pasando el portón principal, plano amplio
  { t: 5.5, target: [2.0, 2.0, 23.5], theta: 2.7, phi: 0.95, radius: 29 },
  // t=7.2: plano panorámico de despedida
  { t: 7.2, target: [0.0, 2.0, 22.0], theta: 2.9, phi: 0.95, radius: 34 },
]
export const CINE_DURATION = 7.8
// Duración del blend-out al terminar la cinemática (transición suave de vuelta
// a la cámara orbital para evitar el tirón al cortar el control guionado).
export const CINE_BLEND_OUT = 1.5
// Posición de reposo a la que vuelve la cámara al terminar la cinemática —
// coincide con camState inicial de useThreeScene para que la transición sea natural.
export const CINE_REST: Omit<CineKey, "t"> = {
  target: [0, 0.5, 13],
  theta: Math.PI * 0.48,
  phi: 1.28,
  radius: 40,
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
