import { m } from "framer-motion"

import type { ReaderPhase } from "./timeline"

interface CardReaderProps {
  phase: ReaderPhase
}

const SCREEN: Record<ReaderPhase, { title: string; subtitle: string; color: string }> = {
  idle: { title: "INSERTE CREDENCIAL", subtitle: "PUESTO DE CONTROL 07", color: "#9fd6a8" },
  reading: { title: "LEYENDO…", subtitle: "VERIFICANDO BANDA MAGNÉTICA", color: "#ffcf5a" },
  granted: { title: "ACCESO CONCEDIDO", subtitle: "IDENTIDAD VERIFICADA", color: "#5dff9a" },
}

const LED: Record<ReaderPhase, string> = {
  idle: "#7a1d14",
  reading: "#ffb020",
  granted: "#33ff77",
}

/**
 * Terminal lectora del puesto de control (SVG): carcasa metálica atornillada,
 * ranura con láser de lectura, pantalla LCD con estados, LED y teclado. La
 * credencial se inserta por detrás de la carcasa (z-index menor), así que la
 * parte que entra en la ranura se oculta de forma natural.
 */
export function CardReader({ phase }: CardReaderProps) {
  const screen = SCREEN[phase]
  return (
    <svg
      viewBox="0 0 380 270"
      width="380"
      height="270"
      className="block"
      role="img"
      aria-label={screen.title}
    >
      <defs>
        <linearGradient id="reader-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5d6168" />
          <stop offset="18%" stopColor="#3c4046" />
          <stop offset="100%" stopColor="#24272b" />
        </linearGradient>
        <linearGradient id="reader-bevel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b9098" />
          <stop offset="100%" stopColor="#2b2e33" />
        </linearGradient>
        <pattern id="reader-scan" width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="#000" opacity="0.35" />
        </pattern>
        <radialGradient id="reader-led-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={LED[phase]} stopOpacity="0.9" />
          <stop offset="100%" stopColor={LED[phase]} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Carcasa */}
      <rect x="4" y="10" width="372" height="256" rx="18" fill="url(#reader-bevel)" />
      <rect x="10" y="16" width="360" height="244" rx="14" fill="url(#reader-metal)" />
      {[
        [26, 32],
        [354, 32],
        [26, 244],
        [354, 244],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="6" fill="#1b1d20" />
          <path d={`M${cx - 4} ${cy} H${cx + 4}`} stroke="#5d6168" strokeWidth="1.6" />
        </g>
      ))}

      {/* Ranura de la credencial y láser de lectura */}
      <rect x="32" y="28" width="316" height="14" rx="5" fill="#08090a" />
      <rect x="32" y="40" width="316" height="3" fill="#000" opacity="0.6" />
      <m.rect
        x="36"
        y="44"
        width="308"
        height="2"
        rx="1"
        fill={phase === "granted" ? "#33ff77" : "#ff3b2f"}
        animate={{
          opacity: phase === "reading" ? [0.3, 1, 0.3] : phase === "granted" ? 0.9 : 0.15,
        }}
        transition={{ duration: 0.4, repeat: phase === "reading" ? Infinity : 0 }}
      />

      {/* Pantalla LCD */}
      <rect
        x="40"
        y="62"
        width="300"
        height="92"
        rx="6"
        fill="#0d1a12"
        stroke="#000"
        strokeWidth="3"
      />
      <rect x="40" y="62" width="300" height="92" rx="6" fill="url(#reader-scan)" />
      <text
        x="190"
        y="104"
        textAnchor="middle"
        fontFamily="'Courier New', monospace"
        fontWeight="700"
        fontSize="22"
        fill={screen.color}
        style={{ letterSpacing: "2px" }}
      >
        {screen.title}
      </text>
      <text
        x="190"
        y="128"
        textAnchor="middle"
        fontFamily="'Courier New', monospace"
        fontSize="10"
        fill={screen.color}
        opacity="0.75"
        style={{ letterSpacing: "2px" }}
      >
        {screen.subtitle}
      </text>
      {/* Barra de progreso de lectura (escala en x, sin animar el ancho) */}
      <rect x="70" y="138" width="240" height="6" rx="3" fill="#1f2f24" />
      <m.rect
        x="70"
        y="138"
        width="240"
        height="6"
        rx="3"
        fill={screen.color}
        style={{ transformOrigin: "70px 141px", transformBox: "view-box" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: phase === "idle" ? 0 : 1 }}
        transition={{ duration: phase === "reading" ? 0.8 : 0.2, ease: "easeInOut" }}
      />

      {/* Teclado */}
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={44 + (i % 4) * 30}
          y={172 + Math.floor(i / 4) * 26}
          width="24"
          height="20"
          rx="3"
          fill="#2a2d31"
          stroke="#121315"
          strokeWidth="1.5"
        />
      ))}
      {/* Rejilla del altavoz */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x="190" y={176 + i * 11} width="86" height="4" rx="2" fill="#141518" />
      ))}

      {/* LED de estado */}
      <circle cx="320" cy="210" r="26" fill="url(#reader-led-glow)" />
      <m.circle
        cx="320"
        cy="210"
        r="9"
        fill={LED[phase]}
        stroke="#0b0b0b"
        strokeWidth="2"
        animate={{ opacity: phase === "reading" ? [1, 0.35, 1] : 1 }}
        transition={{ duration: 0.3, repeat: phase === "reading" ? Infinity : 0 }}
      />
      <text x="320" y="246" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#8b9098">
        ESTADO
      </text>
    </svg>
  )
}
