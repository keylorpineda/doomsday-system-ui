import { domAnimation, LazyMotion, m } from "framer-motion"
import { useEffect, useState } from "react"

import { BlastDoorLeaf } from "./BlastDoor"
import { CardReader } from "./CardReader"
import { LoginBadgeReplica } from "./LoginBadgeReplica"
import { keyTimes, TIMELINE as T, TOTAL_DURATION } from "./timeline"
import { WarningBeacons } from "./WarningBeacons"

import type { ReaderPhase } from "./timeline"

const READER_W = 380
const READER_H = 270
/** Altura (px desde el borde superior del lector) de la ranura. */
const SLOT_Y = 35
/** Cuánto entra el gafete en la ranura (queda asomando la parte superior). */
const INSERT_DEPTH = 175
/** Cuánto vuelve a salir al ser aceptado. */
const EJECT_DEPTH = 95

/** Escala del conjunto lector + credencial para pantallas angostas. */
const kioskScale = () =>
  typeof window === "undefined" ? 1 : Math.min(1, (window.innerWidth - 32) / READER_W)

/**
 * Secuencia de acceso concedido: el gafete del login se inserta en el lector
 * del puesto de control, se verifica, y se abre la compuerta blindada hacia el
 * interior iluminado del refugio. No muestra ninguna credencial. Todo en SVG +
 * transform/opacity.
 */
export function AccessGrantedOverlay() {
  const [phase, setPhase] = useState<ReaderPhase>("idle")
  const [beacons, setBeacons] = useState(false)
  const [scale] = useState(kioskScale)

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase("reading"), T.reading.start * 1000),
      window.setTimeout(() => setPhase("granted"), T.granted.start * 1000),
      window.setTimeout(() => setBeacons(true), (T.door.start - 0.1) * 1000),
      window.setTimeout(() => setBeacons(false), (T.door.end + 0.4) * 1000),
    ]
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  const doorTimes = keyTimes(
    0,
    T.door.start,
    T.door.start + 0.12,
    T.door.start + 0.24,
    T.door.end,
    TOTAL_DURATION,
  )

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="fixed inset-0 z-[105] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        role="status"
        aria-live="polite"
        aria-label="Acceso concedido"
      >
        <div className="absolute inset-0 bg-[#050505]" />

        {/* Interior del refugio: luz cálida que aparece al abrirse la compuerta */}
        <m.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 45% 60% at 50% 50%, rgba(255,226,170,0.95) 0%, rgba(214,160,80,0.55) 35%, rgba(40,28,12,0) 75%)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0, 1, 1], scale: [0.8, 0.8, 1, 1.5] }}
          transition={{
            duration: TOTAL_DURATION,
            times: keyTimes(0, T.door.start, T.door.end, TOTAL_DURATION),
          }}
        />

        {/* Compuerta blindada (con avance de cámara al final) */}
        <m.div
          className="absolute inset-0"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1, 1.35] }}
          transition={{
            duration: TOTAL_DURATION,
            times: keyTimes(0, T.pushIn.start, TOTAL_DURATION),
            ease: "easeIn",
          }}
        >
          {(["left", "right"] as const).map((side) => {
            const dir = side === "left" ? -1 : 1
            return (
              <m.div
                key={side}
                className="absolute inset-y-0 w-1/2"
                style={{ [side]: 0, willChange: "transform" }}
                initial={{ x: "0%" }}
                animate={{
                  x: [
                    "0%",
                    "0%",
                    `${dir * 0.6}%`,
                    `${dir * 0.2}%`,
                    `${dir * 104}%`,
                    `${dir * 104}%`,
                  ],
                }}
                transition={{ duration: TOTAL_DURATION, times: doorTimes, ease: [0.55, 0, 0.3, 1] }}
              >
                <BlastDoorLeaf side={side} />
              </m.div>
            )
          })}
          {/* Marco superior e inferior de la compuerta */}
          <div className="absolute top-0 inset-x-0 h-[7%] bg-[#1a1c1f] border-b-4 border-[#0b0c0d]" />
          <div className="absolute bottom-0 inset-x-0 h-[4%] bg-[#1a1c1f] border-t-4 border-[#0b0c0d]" />
        </m.div>

        <WarningBeacons active={beacons} />

        {/* Lector + credencial: entra al inicio y baja cuando abre la compuerta */}
        <m.div
          className="absolute left-1/2 bottom-[5%] z-30"
          style={{
            width: READER_W,
            height: READER_H,
            x: "-50%",
            scale,
            transformOrigin: "bottom center",
          }}
          initial={{ y: 420, opacity: 0 }}
          animate={{ y: [420, 0, 0, 520], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: TOTAL_DURATION,
            times: keyTimes(0, 0.45, T.door.start, T.door.start + 0.7),
            ease: [0.3, 0, 0.2, 1],
          }}
        >
          {/* Gafete: detrás de la carcasa, así lo que entra en la ranura se oculta */}
          <m.div
            className="absolute left-1/2 z-10"
            style={{ bottom: READER_H - SLOT_Y, x: "-50%" }}
            initial={{ y: -320, opacity: 0, rotate: -4 }}
            animate={{
              y: [-320, -320, 0, 0, INSERT_DEPTH, INSERT_DEPTH, EJECT_DEPTH, EJECT_DEPTH],
              opacity: [0, 0, 1, 1, 1, 1, 1, 1],
              rotate: [-4, -4, 0, 0, 0, 0, 0, 0],
            }}
            transition={{
              duration: TOTAL_DURATION,
              times: keyTimes(
                0,
                T.cardIn.start,
                T.cardIn.end,
                T.insert.start,
                T.insert.end,
                T.granted.start,
                T.granted.start + 0.35,
                TOTAL_DURATION,
              ),
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <LoginBadgeReplica granted={phase === "granted"} />
          </m.div>
          <div className="relative z-20">
            <CardReader phase={phase} />
          </div>
        </m.div>

        {/* Pulso verde al conceder el acceso */}
        <m.div
          className="absolute inset-0 pointer-events-none z-40"
          style={{
            background:
              "radial-gradient(circle at 50% 80%, rgba(60,255,130,0.35), transparent 60%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0] }}
          transition={{
            duration: TOTAL_DURATION,
            times: keyTimes(0, T.granted.start, T.granted.start + 0.15, T.granted.end),
          }}
        />

        {/* Fundido final a negro para el cambio de ruta */}
        <m.div
          className="absolute inset-0 bg-black pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1] }}
          transition={{
            duration: TOTAL_DURATION,
            times: keyTimes(0, TOTAL_DURATION - 0.45, TOTAL_DURATION),
          }}
        />
      </m.div>
    </LazyMotion>
  )
}
