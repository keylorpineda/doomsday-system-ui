import { useEffect, useState } from "react"

const STATUSES = [
  "Inicializando motor 3D...",
  "Cargando geometría del campamento...",
  "Compilando shaders...",
  "Posicionando estructuras...",
  "Calibrando cámara orbital...",
  "Cargando datos del campamento...",
  "Enlazando sensores de zona...",
  "Sistema listo...",
]
// Cuánto se muestra cada estado (ms); el último se queda fijo.
const STATUS_DURATIONS_MS = [600, 900, 700, 1100, 800, 950, 750]

/** Pantalla de carga inmersiva mostrada mientras Three.js inicializa la escena. */
export function LoadingSkeleton() {
  const [statusIdx, setStatusIdx] = useState(0)

  // Avanza un estado por vez; cada cambio agenda el siguiente y el cleanup
  // cancela el timer pendiente (antes sólo se cancelaba el primero y el resto
  // seguía disparando setState tras desmontar).
  useEffect(() => {
    const duration = STATUS_DURATIONS_MS[statusIdx]
    if (duration === undefined) return
    const timer = window.setTimeout(() => setStatusIdx((i) => i + 1), duration)
    return () => window.clearTimeout(timer)
  }, [statusIdx])

  return (
    <div className="camp3d-loading">
      <div className="camp3d-loading-content">
        {/* Emblema / ícono */}
        <div className="camp3d-loading-emblem" aria-hidden="true">
          ⬡
        </div>

        <div className="camp3d-loading-divider" />

        {/* Título */}
        <div className="camp3d-loading-title">
          <div className="camp3d-loading-kicker">{"// Sistema de campamento"}</div>
          <div className="camp3d-loading-main">Cargando Vista 3D</div>
        </div>

        {/* Mensaje de estado animado */}
        <div className="camp3d-loading-status" aria-live="polite">
          {STATUSES[statusIdx]}
        </div>

        {/* Barra de progreso */}
        <div className="camp3d-loading-bar-wrap">
          <div className="camp3d-loading-bar-label">
            <span>Inicializando</span>
            <span>...</span>
          </div>
          <div className="camp3d-loading-bar">
            <div className="camp3d-loading-fill" />
          </div>
        </div>

        {/* Puntos pulsantes */}
        <div className="camp3d-loading-dots" aria-hidden="true">
          <div className="camp3d-loading-dot" />
          <div className="camp3d-loading-dot" />
          <div className="camp3d-loading-dot" />
        </div>
      </div>

      <div className="camp3d-loading-footnote">DOOMSDAY SYSTEM · MÓDULO DE VISUALIZACIÓN 3D</div>
    </div>
  )
}
