import { useState } from "react"

import CampScene3D from "./CampScene3D"
import { LoadingSkeleton } from "./LoadingSkeleton"
import { SceneErrorBoundary } from "./SceneErrorBoundary"

import type { CampScene3DProps } from "../types/scene.types"

import "./CampScene3DWrapper.css"

/**
 * Envoltorio de la escena 3D: overlay a pantalla completa con skeleton de carga
 * durante la inicialización de Three.js y un error boundary que captura fallos
 * de WebGL. La escena se mantiene montada bajo el skeleton para que su `onReady`
 * pueda apagarlo.
 */
export default function CampScene3DWrapper({
  campId,
  onClose,
  embedded,
  onBuildingSelect,
  paused,
}: CampScene3DProps) {
  const [loading, setLoading] = useState(true)

  return (
    <div className="camp3d-overlay">
      {/* El skeleton vive DENTRO del boundary: si la escena falla, el fallback
          de error reemplaza a ambos y el mensaje nunca queda tapado. */}
      <SceneErrorBoundary onClose={onClose}>
        <CampScene3D
          campId={campId}
          onClose={onClose}
          embedded={embedded}
          onBuildingSelect={onBuildingSelect}
          paused={paused}
          onReady={() => setLoading(false)}
        />
        {loading ? <LoadingSkeleton /> : null}
      </SceneErrorBoundary>
    </div>
  )
}
