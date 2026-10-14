interface BlastDoorLeafProps {
  side: "left" | "right"
}

/**
 * Hoja de una compuerta blindada (SVG): acero con paneles, filas de
 * remaches, banda de franjas de seguridad, borde dentado de cierre y número de
 * compuerta estarcido. Las dos hojas encajan en el centro de la pantalla.
 */
export function BlastDoorLeaf({ side }: BlastDoorLeafProps) {
  const id = `door-${side}`
  const isLeft = side === "left"
  // Borde de cierre dentado: los dientes de una hoja encajan con los de la otra
  const teeth = Array.from({ length: 7 }, (_, i) => i)
  const edgeX = isLeft ? 400 : 0
  const toothDir = isLeft ? 1 : -1
  return (
    <svg
      viewBox="0 0 400 700"
      preserveAspectRatio="none"
      overflow="visible"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={isLeft ? "#3c4148" : "#2c3036"} />
          <stop offset="55%" stopColor="#474d55" />
          <stop offset="100%" stopColor={isLeft ? "#2a2e33" : "#40464e"} />
        </linearGradient>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9 0.04"
            numOctaves="2"
            seed={isLeft ? 3 : 9}
          />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" />
        </filter>
        <pattern
          id={`${id}-hazard`}
          width="56"
          height="56"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="56" height="56" fill="#d8a21a" />
          <rect width="28" height="56" fill="#16150f" />
        </pattern>
      </defs>

      {/* Acero base + veta del metal */}
      <rect width="400" height="700" fill={`url(#${id}-steel)`} />
      <rect width="400" height="700" filter={`url(#${id}-grain)`} />

      {/* Paneles con biseles */}
      {[30, 250, 470].map((y) => (
        <g key={y}>
          <rect
            x="34"
            y={y}
            width="332"
            height="200"
            rx="6"
            fill="none"
            stroke="#1a1d21"
            strokeWidth="6"
          />
          <rect x="38" y={y + 4} width="324" height="2" fill="#6b727c" opacity="0.5" />
        </g>
      ))}

      {/* Banda de seguridad central */}
      <rect x="0" y="318" width="400" height="64" fill={`url(#${id}-hazard)`} />
      <rect x="0" y="316" width="400" height="4" fill="#0c0d0f" />
      <rect x="0" y="380" width="400" height="4" fill="#0c0d0f" />

      {/* Remaches */}
      {[20, 680].map((y) =>
        Array.from({ length: 12 }, (_, i) => (
          <g key={`${y}-${i}`}>
            <circle cx={20 + i * 33} cy={y} r="5" fill="#1d2024" />
            <circle cx={19 + i * 33} cy={y - 1.5} r="1.8" fill="#8b929c" />
          </g>
        )),
      )}

      {/* Número de compuerta estarcido */}
      <text
        x={isLeft ? 300 : 100}
        y="200"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Courier New', sans-serif"
        fontSize="120"
        fill="#d8d2bd"
        opacity="0.16"
      >
        {isLeft ? "0" : "7"}
      </text>
      <text
        x="200"
        y="600"
        textAnchor="middle"
        fontFamily="'Courier New', monospace"
        fontWeight="700"
        fontSize="20"
        fill="#d8a21a"
        opacity="0.7"
        style={{ letterSpacing: "4px" }}
      >
        ZONA SEGURA
      </text>

      {/* Borde de cierre dentado */}
      {teeth.map((i) => {
        // Desfasados media posición entre hojas para que los dientes encajen
        const y = (isLeft ? 40 : 86) + i * 92
        return (
          <path
            key={i}
            d={`M${edgeX} ${y} l${toothDir * 22} 23 l${-toothDir * 22} 23 Z`}
            fill="#2a2e33"
            stroke="#121417"
            strokeWidth="2"
          />
        )
      })}
      <rect x={isLeft ? 388 : 0} y="0" width="12" height="700" fill="#0a0b0c" opacity="0.7" />
    </svg>
  )
}
