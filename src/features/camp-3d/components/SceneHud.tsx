import type { Ref } from "react"

interface SceneHudProps {
  posRef: Ref<HTMLDivElement>
  zoomRef: Ref<HTMLDivElement>
}

/** Ayuda de controles y lectura de posición/zoom de la cámara. */
export function SceneHud({ posRef, zoomRef }: SceneHudProps) {
  return (
    <>
      <div className="camp3d-ctrl">
        WASD/Flechas Mover &nbsp;|&nbsp; Drag Rotar &nbsp;|&nbsp; Scroll Zoom &nbsp;|&nbsp; Q/E
        Altura
      </div>
      <div className="camp3d-inf">
        <div ref={posRef}>POS: 0,0</div>
        <div ref={zoomRef}>ZOOM: 30m</div>
      </div>
    </>
  )
}
