import { CAMP, GARAGE_DOOR } from "./layout"

/**
 * Conducción del camión con una cinemática simple pero creíble: velocidad
 * objetivo por zona, aceleración y frenado limitados. Puro (sin three.js) para
 * poder testearlo y precalcular cuándo pasa por cada punto.
 */

/** m/s² — un camión cargado acelera despacio y frena algo más fuerte. */
export const ACCELERATION = 2.4
export const BRAKING = 3.6

/** Velocidad objetivo (m/s) según dónde está el camión. */
export function targetSpeedAt(x: number, z: number): number {
  if (x > GARAGE_DOOR.x - 1.5) return 3.5 // maniobra dentro del taller
  if (z < CAMP.halfZ - 9) return 6.5 // calles internas
  if (z < CAMP.halfZ + 4) return 5 // cruce del portón (frena un poco)
  return 17 // carretera
}

export interface DriveState {
  /** Distancia recorrida sobre la ruta (m). */
  distance: number
  speed: number
  /** Aceleración del último paso (m/s²): + acelera, − frena. */
  acceleration: number
}

export const initialDriveState = (): DriveState => ({ distance: 0, speed: 0, acceleration: 0 })

/** Avanza la simulación `dt` segundos en la posición (x, z). */
export function stepDrive(state: DriveState, x: number, z: number, dt: number): DriveState {
  const target = targetSpeedAt(x, z)
  let speed = state.speed
  if (speed < target) speed = Math.min(target, speed + ACCELERATION * dt)
  else speed = Math.max(target, speed - BRAKING * dt)
  return {
    distance: state.distance + speed * dt,
    speed,
    acceleration: dt > 0 ? (speed - state.speed) / dt : 0,
  }
}
