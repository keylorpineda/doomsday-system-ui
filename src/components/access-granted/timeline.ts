/**
 * Línea de tiempo de la secuencia de acceso concedido (segundos desde que
 * aparece). Termina antes de que Login navegue (5.6 s).
 */
export const TIMELINE = {
  /** La credencial sube desde abajo hasta quedar sobre la ranura del lector. */
  cardIn: { start: 0.15, end: 0.95 },
  /** Se inserta en la ranura. */
  insert: { start: 1.0, end: 1.5 },
  /** El lector lee la banda (LED ámbar, láser). */
  reading: { start: 1.5, end: 2.35 },
  /** Lectura válida: LED verde, sello y la credencial sale de la ranura. */
  granted: { start: 2.35, end: 2.9 },
  /** El lector baja y la compuerta blindada se abre. */
  door: { start: 2.9, end: 4.5 },
  /** La cámara avanza hacia el interior iluminado y funde a negro. */
  pushIn: { start: 4.3, end: 5.35 },
} as const

export const TOTAL_DURATION = TIMELINE.pushIn.end

export type ReaderPhase = "idle" | "reading" | "granted"

/** Convierte instantes absolutos en `times` (0–1) para un keyframe de framer-motion. */
export const keyTimes = (...seconds: number[]) => seconds.map((s) => s / TOTAL_DURATION)
