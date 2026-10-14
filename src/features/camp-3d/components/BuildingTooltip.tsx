import { BUILDING_INFO } from "../constants/sceneNavigation"

import type { BuildingConfig } from "../types/scene.types"
import type { CSSProperties, Ref } from "react"

const DEFAULT_INFO = { desc: "Módulo del Campamento", icon: "◉", color: "#6eff44" }
const RESTRICTED_INFO = { desc: "Zona Restringida", icon: "🔒", color: "#ff4444" }

interface BuildingTooltipProps {
  building: BuildingConfig
  restricted: boolean
  /** El loop de render lo reposiciona cada frame (ver sceneOverlayDom). */
  tooltipRef: Ref<HTMLDivElement>
}

/** Tooltip flotante sobre el edificio bajo el cursor. */
export function BuildingTooltip({ building, restricted, tooltipRef }: BuildingTooltipProps) {
  const info = restricted ? RESTRICTED_INFO : (BUILDING_INFO[building.id] ?? DEFAULT_INFO)
  return (
    <div ref={tooltipRef} className="camp3d-marker" style={{ "--mc": info.color } as CSSProperties}>
      <div className="camp3d-marker-box">
        <div className="camp3d-marker-icon">{info.icon}</div>
        <div className="camp3d-marker-title">{building.label}</div>
        <div className="camp3d-marker-desc">{info.desc}</div>
        <div className="camp3d-marker-cta">
          {restricted ? "⛔ Acceso no autorizado" : "◎ Haz clic para entrar"}
        </div>
      </div>
      <div className="camp3d-marker-line" />
    </div>
  )
}
