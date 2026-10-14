import { useCallback, useEffect, useRef, useState } from "react"

import type { BuildingConfig } from "../types/scene.types"

const DENIED_VISIBLE_MS = 4200

export interface DeniedNotice {
  building: BuildingConfig
  /** Re-dispara la animación aunque se toque el mismo edificio dos veces. */
  nonce: number
}

/** Aviso temporal de "acceso denegado" al tocar un edificio sin autorización. */
export function useAccessDenied() {
  const [denied, setDenied] = useState<DeniedNotice | null>(null)
  const timerRef = useRef<number | null>(null)
  const nonceRef = useRef(0)

  const clearTimer = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const showDenied = useCallback((building: BuildingConfig) => {
    nonceRef.current += 1
    setDenied({ building, nonce: nonceRef.current })
    clearTimer()
    timerRef.current = window.setTimeout(() => setDenied(null), DENIED_VISIBLE_MS)
  }, [])

  const dismiss = useCallback(() => {
    clearTimer()
    setDenied(null)
  }, [])

  useEffect(() => clearTimer, [])

  return { denied, showDenied, dismiss }
}
