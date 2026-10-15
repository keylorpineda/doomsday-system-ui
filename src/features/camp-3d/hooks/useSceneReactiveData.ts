import { useEffect, useRef } from "react"

import { sourcesForRole, sourcesForTopic, SOURCES } from "./sceneSources"

import type { CampTopic, SourceKey, SourceMemory } from "./sceneSources"
import type { Camp3DRole, SceneHandles } from "../types/scene.types"
import type { RefObject } from "react"

import { useSocket } from "@/hooks/useSocket"

/**
 * Respaldo por si el WebSocket se cae o se pierde un evento. Antes se
 * consultaban 6 endpoints cada 8 s; ahora los cambios llegan por `camp.updated`.
 */
export const FALLBACK_REFRESH_MS = 60_000
/** Agrupa ráfagas de eventos (p. ej. una llegada de traslado emite 3 temas). */
export const EVENT_DEBOUNCE_MS = 400

interface CampUpdatedEvent {
  campId: number | string
  topic: CampTopic
}

/**
 * Puente de datos reactivos: refleja el estado real del campamento en la
 * escena 3D (luces, colores, animaciones).
 *
 * - Carga todo una vez al montar.
 * - Después sólo refresca el tema que el backend avisa por WebSocket
 *   (`camp.updated`), con un respaldo cada minuto.
 * - No consulta nada mientras la escena está pausada o la pestaña oculta, y se
 *   pone al día al volver.
 */
export function useSceneReactiveData(
  campId: string,
  handlesRef: RefObject<SceneHandles | null>,
  role: Camp3DRole,
  paused = false,
) {
  const socket = useSocket()
  const memory = useRef<SourceMemory>({ explorationActive: false, transferInTransit: false })
  const pausedRef = useRef(paused)
  const staleRef = useRef(new Set<SourceKey>())
  const flushRef = useRef<() => void>(() => undefined)

  useEffect(() => {
    if (!campId) return
    let cancelled = false
    const allowed = new Set(sourcesForRole(role))
    const pending = new Set<SourceKey>()
    let debounce: number | null = null

    const run = async (keys: Iterable<SourceKey>) => {
      const handles = handlesRef.current
      if (!handles) return
      for (const key of keys) {
        if (cancelled || !allowed.has(key)) continue
        try {
          await SOURCES[key].refresh(campId, handles, memory.current)
        } catch {
          // Un endpoint caído no debe romper la escena: se deja el estado previo.
        }
      }
    }

    /** Refresca ahora o, si la escena no se ve, lo deja marcado para después. */
    const request = (keys: SourceKey[]) => {
      if (pausedRef.current || document.hidden || !handlesRef.current) {
        keys.forEach((k) => staleRef.current.add(k))
        return
      }
      keys.forEach((k) => pending.add(k))
      if (debounce !== null) return
      debounce = window.setTimeout(() => {
        debounce = null
        const keysNow = [...pending]
        pending.clear()
        void run(keysNow)
      }, EVENT_DEBOUNCE_MS)
    }

    flushRef.current = () => {
      if (staleRef.current.size === 0) return
      const keys = [...staleRef.current]
      staleRef.current.clear()
      request(keys)
    }

    const all = sourcesForRole(role)
    // La escena puede tardar en construirse: se marca todo como pendiente y se
    // carga en cuanto haya handles (el primer frame dispara flush vía intervalo corto).
    all.forEach((k) => staleRef.current.add(k))
    const bootstrap = window.setInterval(() => {
      if (!handlesRef.current) return
      window.clearInterval(bootstrap)
      flushRef.current()
    }, 250)

    const fallback = window.setInterval(() => request(all), FALLBACK_REFRESH_MS)
    const onVisibility = () => {
      if (!document.hidden) flushRef.current()
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(bootstrap)
      window.clearInterval(fallback)
      if (debounce !== null) window.clearTimeout(debounce)
      document.removeEventListener("visibilitychange", onVisibility)
      flushRef.current = () => undefined
    }
  }, [campId, handlesRef, role])

  // Al quitar la pausa, ponerse al día con lo que cambió mientras no se veía.
  useEffect(() => {
    pausedRef.current = paused
    if (!paused) flushRef.current()
  }, [paused])

  // Eventos del backend: unirse a la sala del campamento y refrescar por tema.
  useEffect(() => {
    if (!socket || !campId) return
    const join = () => socket.emit("camp.join", { campId })
    const onUpdate = (event: CampUpdatedEvent) => {
      if (String(event.campId) !== String(campId)) return
      sourcesForTopic(event.topic).forEach((k) => staleRef.current.add(k))
      flushRef.current()
    }
    if (socket.connected) join()
    socket.on("connect", join)
    socket.on("camp.updated", onUpdate)
    return () => {
      socket.off("connect", join)
      socket.off("camp.updated", onUpdate)
    }
  }, [socket, campId])
}
