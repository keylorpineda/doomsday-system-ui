import { m } from "framer-motion"

interface LoginBadgeReplicaProps {
  /** Muestra el sello verde de acceso permitido. */
  granted: boolean
}

/** Tamaño real del gafete del login (BadgeLogin); aquí se dibuja a escala. */
export const BADGE_W = 420
export const BADGE_H = 580
export const BADGE_SCALE = 0.5

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")"

/** Mismo recorte de bordes gastados que el gafete del login. */
const WORN_EDGES =
  "polygon(0 8px, 4px 6px, 8px 0, 30% 0, 32% 4px, 35% 0, calc(100% - 8px) 0, 100% 8px, 100% 40%, 96% 42%, 100% 44%, 100% 80%, 97% 81%, 95% 83%, 98% 87%, 92% 89%, 95% 94%, 86% 96%, 82% 100%, 60% 100%, 58% 96%, 50% 100%, 8px 100%, 0 calc(100% - 8px), 0 60%, 4% 58%, 0 54%, 0 20%, 4% 16%, 1% 14%, 0 10%)"

const BARCODE =
  "linear-gradient(90deg,#000 10%,transparent 10%,transparent 15%,#000 15%,#000 20%,transparent 20%,transparent 25%,#000 25%,#000 35%,transparent 35%,transparent 40%,#000 40%,#000 45%,transparent 45%,transparent 50%,#000 50%,#000 65%,transparent 65%,transparent 80%,#000 80%,#000 90%,transparent 90%)"

/**
 * Réplica visual (no interactiva) del gafete del login para la secuencia de
 * acceso: mismo plástico envejecido, recorte, cordón, foto, código de barras y
 * holograma. Los campos NO muestran credenciales: van censurados.
 */
export function LoginBadgeReplica({ granted }: LoginBadgeReplicaProps) {
  return (
    <div
      style={{ width: BADGE_W * BADGE_SCALE, height: BADGE_H * BADGE_SCALE }}
      aria-label="Gafete de acceso"
      role="img"
    >
      <div
        style={{
          width: BADGE_W,
          height: BADGE_H,
          transform: `scale(${BADGE_SCALE})`,
          transformOrigin: "top left",
          filter:
            "drop-shadow(0 20px 25px rgba(0,0,0,0.8)) drop-shadow(0 5px 10px rgba(0,0,0,0.5))",
        }}
      >
        <div
          className="relative w-full h-full flex flex-col overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at center, #d8d3c5 0%, #b8b1a1 100%)",
            boxShadow:
              "inset 0 0 40px rgba(50,40,30,0.4), inset 2px 2px 10px rgba(255,255,255,0.6), 0 0 0 1px #222",
            clipPath: WORN_EDGES,
          }}
        >
          {/* Envejecido, desgaste blanco de los bordes y rayado fino */}
          <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20 bg-gradient-to-b from-transparent to-[#4a3e35]/30" />
          <div
            className="absolute inset-0 pointer-events-none rounded-xl border border-white/40"
            style={{
              boxShadow: "inset 0 0 15px rgba(255,255,255,1), inset 0 0 30px rgba(255,255,255,0.5)",
            }}
          />
          <div className="absolute top-0 left-0 w-[80px] h-[15px] bg-white opacity-50 blur-[2px] rounded-br-[40px]" />
          <div className="absolute bottom-[-10px] right-[-10px] w-[60px] h-[60px] bg-white opacity-60 blur-[3px]" />
          <div className="absolute top-[32%] right-[1px] w-[3px] h-[60px] bg-white opacity-90 blur-[0.5px]" />
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
            style={{ backgroundImage: NOISE }}
          />

          {/* Agujero del cordón */}
          <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[60px] h-[12px] bg-black rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.8),0_2px_0_rgba(255,255,255,0.7)] opacity-90" />

          <div className="relative flex-1 flex flex-col px-6" style={{ marginTop: "3.5rem" }}>
            {/* Encabezado */}
            <div className="border-b-[4px] border-[#3a3528] pb-3 mb-10 mx-auto w-[80%]">
              <h2 className="font-sans font-black text-[22px] tracking-tighter leading-none uppercase text-[#3a3528]">
                INICIO DE SESIÓN
              </h2>
              <p className="text-[10px] tracking-widest font-bold uppercase mt-1 text-[#3a3528]">
                Acceso Autorizado
              </p>
            </div>

            {/* Foto y campos censurados */}
            <div className="flex gap-4 w-[80%] mx-auto items-center">
              <div className="w-[110px] h-[140px] shrink-0 bg-[#8c8270] border-2 border-[#1a1712] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="w-[80px] h-[60px] bg-[#2a251a] rounded-t-[30px] absolute bottom-0 left-1/2 -translate-x-1/2" />
                <div className="w-[45px] h-[55px] bg-[#2a251a] rounded-[24px] absolute top-[25px] left-1/2 -translate-x-1/2" />
                <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]" />
              </div>
              <div className="flex-1 flex flex-col gap-4">
                {["USUARIO", "CONTRASEÑA"].map((label) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-black text-[#1a1a1a] tracking-[0.2em]">
                      {label}
                    </span>
                    <div className="h-[44px] rounded-[4px] border-2 border-black/20 bg-black/[0.05] flex items-center px-3">
                      <div className="h-[14px] w-full rounded-[2px] bg-[#1a1814]/85" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Código de barras y holograma */}
            <div className="w-[80%] mx-auto mt-auto mb-10 flex justify-between items-center gap-4">
              <div
                className="flex-1 h-[45px] border-y-2 border-black/80 opacity-70"
                style={{ backgroundImage: BARCODE }}
              />
              <div className="w-12 h-12 rounded-full border border-yellow-500/30 flex items-center justify-center bg-gradient-to-tr from-yellow-100 via-yellow-400 to-amber-600 opacity-80 mix-blend-multiply relative">
                <span className="text-[10px] font-black text-black/40 rotate-45 tracking-widest">
                  VALID
                </span>
                <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#555]/40" />
              </div>
            </div>
          </div>

          {/* Sello de acceso permitido */}
          <m.div
            className="absolute left-1/2 top-[56%] -translate-x-1/2 pointer-events-none"
            style={{ mixBlendMode: "multiply" }}
            initial={false}
            animate={
              granted
                ? { opacity: 0.9, scale: 1, rotate: -13 }
                : { opacity: 0, scale: 2.2, rotate: -18 }
            }
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="border-[5px] border-[#15803d] text-[#15803d] px-4 py-1.5 font-black text-[24px] tracking-[0.12em] uppercase whitespace-nowrap">
              ✓ Acceso Permitido
            </div>
          </m.div>
        </div>
      </div>
    </div>
  )
}
