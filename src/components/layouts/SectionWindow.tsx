import { X } from "lucide-react"

import type { ReactNode } from "react"

interface SectionWindowProps {
  open: boolean
  title: string
  onClose: () => void
  /** Color del punto que parpadea junto al título. */
  pingColor?: string
  /** Clases extra del cuerpo (p. ej. tema de la vista). */
  bodyClassName?: string
  children: ReactNode
}

/**
 * Ventana de sección sobre el campamento 3D (compartida por todos los roles).
 *
 * Sin `backdrop-filter`: un contenedor con filtro convierte en relativos a él
 * los `position: fixed` de su interior, y los modales de las secciones
 * quedaban encerrados y recortados. El cuerpo tiene `min-h-0` + scroll para que
 * ningún contenido largo se corte.
 */
export function SectionWindow({
  open,
  title,
  onClose,
  pingColor = "#9c2720",
  bodyClassName = "",
  children,
}: SectionWindowProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-stretch justify-center bg-black/75 md:p-6"
      style={{ display: open ? "flex" : "none" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-label={title}
        className="relative flex flex-col w-full h-full min-h-0 md:max-w-6xl bg-[#0d0c0b] border-2 border-black shadow-[6px_6px_0px_#000000] overflow-hidden"
      >
        <div className="shrink-0 flex items-center justify-between gap-3 bg-[#121110] border-b-2 border-black px-4 py-2.5 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: pingColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ background: pingColor }}
              />
            </span>
            <span className="text-sm font-black text-[#df8120] uppercase tracking-widest truncate">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="CERRAR VENTANA"
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-[#9a9080] text-black hover:bg-red-700 hover:text-white transition-colors uppercase text-[11px] font-extrabold tracking-widest cursor-pointer"
          >
            <X className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">CERRAR</span>
          </button>
        </div>
        <div
          className={`relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
