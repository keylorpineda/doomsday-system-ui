import { useCallback, useEffect, useRef, useState } from "react"

import { updateCinematicCamera } from "../services/transferCinematic"

import type { CameraState } from "./useThreeScene"
import type { ProfileMarker } from "../services/profileMarker"
import type { CinematicMemory } from "../services/transferCinematic"
import type { SceneHandles } from "../types/scene.types"
import type { RefObject } from "react"

import { use3DStore } from "@/store/use3DStore"

// Nonce del store ya consumido; module-level para que un remount de la escena
// no vuelva a reproducir una cinemática ya vista.
let lastConsumedCinematic = 0

/**
 * Cinemática del camión al crear un traslado: escucha `transferCinematic` del
 * store, arranca la animación del camión y guiona la cámara frame a frame.
 */
export function useTransferCinematic(
  handlesRef: RefObject<SceneHandles | null>,
  markerRef: RefObject<ProfileMarker | null>,
) {
  const [showCinematic, setShowCinematic] = useState(false)
  const activeRef = useRef(false)
  const startTimeRef = useRef<number | null>(null)
  const memoryRef = useRef<CinematicMemory>({})
  const pendingTimerRef = useRef<number | null>(null)

  const start = useCallback(() => {
    const handles = handlesRef.current
    if (!handles || activeRef.current) return
    // El marcador de perfil no debe aparecer en el plano de la cinemática.
    markerRef.current?.setHidden(true)
    handles.playTransferAnimation()
    activeRef.current = true
    startTimeRef.current = null
    memoryRef.current = {}
    setShowCinematic(true)
  }, [handlesRef, markerRef])

  const consumeIfPending = useCallback(() => {
    const requested = use3DStore.getState().transferCinematic
    if (requested > lastConsumedCinematic && handlesRef.current) {
      lastConsumedCinematic = requested
      start()
    }
  }, [handlesRef, start])

  /**
   * Para llamar cuando la escena terminó de construirse: atiende una cinemática
   * pedida antes de que existiera (p. ej. al crear un traslado y volver al
   * campamento). Se difiere un tick y el timer se cancela al desmontar, así el
   * doble montaje de StrictMode sólo la reproduce en la escena que sobrevive.
   */
  const playPendingWhenReady = useCallback(() => {
    if (pendingTimerRef.current !== null) window.clearTimeout(pendingTimerRef.current)
    pendingTimerRef.current = window.setTimeout(() => {
      pendingTimerRef.current = null
      consumeIfPending()
    }, 0)
  }, [consumeIfPending])

  // Escena ya abierta: un traslado nuevo incrementa `transferCinematic`.
  useEffect(() => use3DStore.subscribe(() => consumeIfPending()), [consumeIfPending])

  useEffect(
    () => () => {
      if (pendingTimerRef.current !== null) window.clearTimeout(pendingTimerRef.current)
    },
    [],
  )

  /** Llamar en cada frame: guiona la cámara mientras la cinemática esté activa. */
  const updateCamera = useCallback(
    (t: number, camState: CameraState) => {
      if (!activeRef.current) return
      if (startTimeRef.current === null) startTimeRef.current = t
      const focus = handlesRef.current?.getCinematicFocus() ?? null
      const finished = updateCinematicCamera(
        t - startTimeRef.current,
        camState,
        focus,
        memoryRef.current,
      )
      if (finished) {
        activeRef.current = false
        markerRef.current?.setHidden(false)
        setShowCinematic(false)
      }
    },
    [handlesRef, markerRef],
  )

  return { showCinematic, start, playPendingWhenReady, updateCamera }
}
