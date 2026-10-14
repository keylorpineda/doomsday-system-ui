import { motion } from "framer-motion"

/** Duración total: coincide con la espera del Login antes de navegar (5.6 s). */
const TOTAL = 5.6

/**
 * Cierre del login: mientras el gafete flota hacia la luz verde, la pantalla
 * se ilumina suavemente y funde a negro justo antes de navegar, para que el
 * panel aparezca sin cortes. Sólo anima opacity (barato para la GPU).
 */
export function LoginExitTransition() {
  return (
    <div className="fixed inset-0 z-[105] pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(110,255,160,0.55) 0%, rgba(30,140,70,0.25) 40%, rgba(0,0,0,0) 75%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 0.6] }}
        transition={{ duration: TOTAL, times: [0, 0.55, 0.85, 1], ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-[#040704]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: TOTAL, times: [0, 0.8, 1], ease: "easeIn" }}
      />
    </div>
  )
}
