import { useEffect, useRef } from "react"

import type { Scene3DState } from "../types/scene.types"

import { use3DStore } from "@/store/use3DStore"

/**
 * Consume las solicitudes de "abrir el campamento 3D" (botón Ver Campamento,
 * entrada desde el mapa táctico, aterrizaje tras el login).
 *
 * El campamento 3D es el fondo permanente de cada layout, así que "abrirlo"
 * significa cerrar la ventana/capa que lo tapa (y, en Admin, cambiar al
 * campamento pedido). El flag `is3DActive` funciona como un evento: se consume
 * y se vuelve a `false` en cuanto se atiende. Se revisa también al montar, para
 * atender solicitudes hechas justo antes de navegar (p. ej. desde el login).
 */
export function useOpen3DRequest(onOpen: (campId: string | null) => void) {
  const onOpenRef = useRef(onOpen)
  useEffect(() => {
    onOpenRef.current = onOpen
  })

  useEffect(() => {
    const consume = (state: Scene3DState) => {
      if (!state.is3DActive) return
      use3DStore.setState({ is3DActive: false })
      onOpenRef.current(state.activeCamp3DId)
    }
    consume(use3DStore.getState())
    return use3DStore.subscribe(consume)
  }, [])
}
