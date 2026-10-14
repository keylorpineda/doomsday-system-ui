import { m } from "framer-motion"

interface WarningBeaconsProps {
  /** Girando y encendidas mientras la compuerta se mueve. */
  active: boolean
}

/**
 * Balizas ámbar giratorias sobre la compuerta: una carcasa con domo y un haz
 * de luz (gradiente cónico) que rota. Sólo se anima `transform` y `opacity`.
 */
export function WarningBeacons({ active }: WarningBeaconsProps) {
  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          className="absolute top-[6%] w-[64px] h-[64px] z-20 pointer-events-none"
          style={{ [side]: "8%" }}
          aria-hidden="true"
        >
          {/* Haz giratorio */}
          <m.div
            className="absolute left-1/2 top-1/2 w-[520px] h-[520px] -ml-[260px] -mt-[260px] rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(255,170,40,0.55) 0deg, rgba(255,170,40,0) 38deg, rgba(255,170,40,0) 180deg, rgba(255,170,40,0.55) 180deg, rgba(255,170,40,0) 218deg, rgba(255,170,40,0) 360deg)",
              maskImage: "radial-gradient(circle, black 0%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 70%)",
            }}
            animate={
              active
                ? { opacity: 1, rotate: side === "left" ? 360 : -360 }
                : { opacity: 0, rotate: 0 }
            }
            transition={
              active
                ? {
                    rotate: { duration: 0.9, repeat: Infinity, ease: "linear" },
                    opacity: { duration: 0.2 },
                  }
                : { duration: 0.2 }
            }
          />
          <svg viewBox="0 0 64 64" className="relative w-full h-full">
            <rect
              x="10"
              y="44"
              width="44"
              height="14"
              rx="3"
              fill="#2a2d31"
              stroke="#121315"
              strokeWidth="2"
            />
            <path d="M14 44 C14 22 50 22 50 44 Z" fill={active ? "#ffb020" : "#6b4a12"} />
            <path
              d="M20 40 C21 30 30 27 34 27"
              stroke="#fff3c4"
              strokeWidth="3"
              fill="none"
              opacity="0.6"
            />
          </svg>
        </div>
      ))}
    </>
  )
}
