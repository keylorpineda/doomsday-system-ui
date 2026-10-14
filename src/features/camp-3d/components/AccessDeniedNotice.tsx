import { ROLE_LABELS } from "../constants/sceneNavigation"

import type { DeniedNotice } from "../hooks/useAccessDenied"

interface AccessDeniedNoticeProps {
  notice: DeniedNotice
  onDismiss: () => void
}

/** Aviso de "acceso denegado" al tocar un edificio que el rango actual no puede abrir. */
export function AccessDeniedNotice({ notice, onDismiss }: AccessDeniedNoticeProps) {
  return (
    <div
      className="camp3d-denied"
      role="button"
      tabIndex={0}
      aria-label="Cerrar aviso de acceso denegado"
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") onDismiss()
      }}
    >
      <div className="camp3d-denied-box">
        <div className="camp3d-denied-stripe" />
        <div className="camp3d-denied-icon">⛔</div>
        <div className="camp3d-denied-title">ACCESO DENEGADO</div>
        <div className="camp3d-denied-sub">AUTORIZACIÓN INSUFICIENTE</div>
        <div className="camp3d-denied-target">{`// ${notice.building.label}`}</div>
        <div className="camp3d-denied-info">
          RANGO REQUERIDO:{" "}
          {notice.building.requiredRoles.map((r) => ROLE_LABELS[r] ?? r).join(" · ")}
        </div>
        <div className="camp3d-denied-bar">
          <div className="camp3d-denied-fill" />
        </div>
      </div>
    </div>
  )
}
