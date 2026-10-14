import { useEffect, useState } from "react"

import { resolveWorkerSubType } from "../constants/sceneNavigation"

import type { Camp3DRole } from "../types/scene.types"

import { workerService } from "@/features/worker/services/workerService"

/**
 * Sub-tipo del worker según su profesión (soldier / explorer / other), que
 * decide dónde aparece su marcador de perfil. Para otros roles es "other".
 */
export function useWorkerSubType(role: Camp3DRole) {
  const [subType, setSubType] = useState("other")

  useEffect(() => {
    if (role !== "worker") return
    let cancelled = false
    workerService
      .getMyProfile()
      .then((profile) => {
        if (!cancelled) setSubType(resolveWorkerSubType(profile.person?.profession?.name))
      })
      .catch(() => {
        if (!cancelled) setSubType("other")
      })
    return () => {
      cancelled = true
    }
  }, [role])

  return subType
}
