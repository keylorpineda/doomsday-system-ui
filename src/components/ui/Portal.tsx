import { useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import type { ReactNode } from "react"

/**
 * Raíces de tema de cada rol: definen las variables CSS (`--tm-*`, `--admin-*`…)
 * y los selectores descendientes de sus vistas.
 */
const THEME_ROOTS = ["tm-container", "admin-root", "worker-layout"] as const

/**
 * Renderiza a `children` directamente en `document.body`.
 *
 * Los overlays (`position: fixed`) que viven dentro de un contenedor con
 * `transform`, `filter` o `backdrop-filter` quedan posicionados respecto a ese
 * contenedor —no a la pantalla— y se recortan con su `overflow`. Sacarlos al
 * body garantiza que ocupen toda la ventana del navegador.
 *
 * Al salir del árbol se perderían el tema y las variables de la vista, así que
 * el contenido se envuelve en la misma clase raíz del lugar donde se usa, con
 * `display: contents` (no genera caja ni hereda su maquetación).
 */
export function Portal({ children }: { children: ReactNode }) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [themeRoot, setThemeRoot] = useState<string | undefined>()

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    setThemeRoot(THEME_ROOTS.find((cls) => anchor.closest(`.${cls}`)))
  }, [])

  if (typeof document === "undefined") return null
  return (
    <>
      <span ref={anchorRef} hidden />
      {createPortal(
        <div className={themeRoot} style={{ display: "contents" }}>
          {children}
        </div>,
        document.body,
      )}
    </>
  )
}
