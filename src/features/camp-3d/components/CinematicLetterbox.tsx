/** Barras de cine y título mientras corre la cinemática del camión. */
export function CinematicLetterbox() {
  return (
    <div className="camp3d-cine">
      <div className="camp3d-cine-bar camp3d-cine-bar-top" />
      <div className="camp3d-cine-bar camp3d-cine-bar-bottom" />
      <div className="camp3d-cine-title">
        <div className="camp3d-cine-kicker">{"// DESPACHO DE CONVOY"}</div>
        <div className="camp3d-cine-main">TRASLADO EN MARCHA</div>
      </div>
    </div>
  )
}
