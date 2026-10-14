import type { BuildingConfig, Camp3DRole } from "../types/scene.types"

/**
 * Reglas de navegación y presentación de la escena 3D por rol: a qué ruta lleva
 * cada edificio, dónde está el marcador de perfil de cada rol y qué texto se
 * muestra en el tooltip y en el aviso de acceso denegado.
 */

/** Posición (coordenadas raw, sin SCENE_SCALE) y ruta de un marcador de perfil. */
export interface ProfileMarkerConfig {
  pos: [number, number, number]
  route: string
}

/** Normaliza el role del backend a los roles que entiende la escena. */
export const normalizeRole = (role?: string): Camp3DRole => {
  const r = (role ?? "").toLowerCase()
  if (r.includes("admin")) return "admin"
  if (r === "camp_leader" || r === "resource_manager" || r === "travel_manager") return r
  return "worker"
}

/**
 * Paso 07 — marcador de perfil: cada rol tiene "su" espacio en el campamento.
 * Una luz azulada pulsa sobre esa zona; el click navega al perfil del usuario.
 */
export const PROFILE_MARKERS: Record<Camp3DRole, ProfileMarkerConfig> = {
  admin: { pos: [0, 3.3, -6.6], route: "/admin/profile" }, // ventana 2do piso CG
  camp_leader: { pos: [-4.4, 1.8, -10], route: "/campleader/dashboard" }, // ala lateral CG
  resource_manager: { pos: [-8.3, 2.2, 4], route: "/camp-manager" }, // oficina del almacén
  travel_manager: { pos: [11.0, 1.5, 6.2], route: "/travel-manager/dashboard" }, // fondo del garaje (lejos de la entrada)
  worker: { pos: [12.8, 1.5, -3.1], route: "/worker/dashboard" }, // default: apartamentos
}

/**
 * Paso 07 — sub-categorías de worker según profesión:
 *  - soldado → Armería (locker room)
 *  - explorador → Torre de Vigilancia (plataforma superior)
 *  - otro → Apartamentos (su unidad — default)
 */
export const WORKER_SUB_MARKERS: Record<string, ProfileMarkerConfig> = {
  soldier: { pos: [12, 1.5, 1.5], route: "/worker/profile" }, // armería locker
  explorer: { pos: [-17, 6.2, 11], route: "/worker/profile" }, // torre plataforma
  other: { pos: [12.8, 1.5, -3.1], route: "/worker/dashboard" }, // apartamentos
}

/** Resuelve la posición del perfil para workers según su profesión. */
export const resolveWorkerSubType = (professionName?: string): string => {
  const name = (professionName ?? "").toLowerCase()
  if (
    name.includes("soldado") ||
    name.includes("soldier") ||
    name.includes("guardia") ||
    name.includes("guard")
  )
    return "soldier"
  if (name.includes("explorador") || name.includes("explorer") || name.includes("scout"))
    return "explorer"
  return "other"
}

/** Nombre legible de cada rango para el aviso de acceso denegado. */
export const ROLE_LABELS: Record<Camp3DRole, string> = {
  admin: "ADMINISTRADOR",
  camp_leader: "LÍDER DE CAMPAMENTO",
  resource_manager: "GESTOR DE RECURSOS",
  travel_manager: "GESTOR DE VIAJES",
  worker: "OPERARIO",
}

/** Ruta "casa" de cada rol (fallback cuando un edificio no mapea a una vista propia). */
export const ROLE_HOME: Record<Camp3DRole, string> = {
  admin: "/admin/dashboard",
  camp_leader: "/campleader",
  resource_manager: "/camp-manager",
  travel_manager: "/travel-manager/dashboard",
  worker: "/worker/dashboard",
}

/**
 * Ruta destino por edificio y rol. Las rutas del catálogo apuntan a la vista
 * Admin; aquí se traducen al módulo equivalente de cada rol para que el click
 * no aterrice en una ruta protegida ajena. Si falta una entrada, se usa
 * ROLE_HOME[role] (los roles con navegación por pestañas — camp_leader,
 * resource_manager — caen en su tablero, que es destino válido).
 */
export const BUILDING_ROUTE_BY_ROLE: Record<string, Partial<Record<Camp3DRole, string>>> = {
  hq: { admin: "/admin/dashboard" },
  gate: { admin: "/admin/admissions" },
  barracks: { admin: "/admin/people" },
  watchtower: {
    admin: "/admin/explorations",
    travel_manager: "/travel-manager/expeditions",
    worker: "/worker/expeditions",
  },
  warehouse: {
    admin: "/admin/resources",
    worker: "/worker/resources",
  },
  garage: {
    admin: "/admin/transfers",
    travel_manager: "/travel-manager/transfers",
  },
}

export const resolveBuildingRoute = (role: Camp3DRole, building: BuildingConfig): string => {
  if (building.id === "profile") return building.route
  return BUILDING_ROUTE_BY_ROLE[building.id]?.[role] ?? ROLE_HOME[role]
}

/** Info por módulo para el marcador flotante de click */
export const BUILDING_INFO: Record<string, { desc: string; icon: string; color: string }> = {
  hq: { desc: "Comando y Operaciones", icon: "⌂", color: "#44aaff" },
  gate: { desc: "Control de Admisiones", icon: "⊕", color: "#ffaa22" },
  barracks: { desc: "Gestión de Personal", icon: "▲", color: "#44aaff" },
  watchtower: { desc: "Misiones y Vigilancia", icon: "◎", color: "#bb66ff" },
  warehouse: { desc: "Inventario y Recursos", icon: "▪", color: "#6eff44" },
  garage: { desc: "Traslados y Logística", icon: "⚙", color: "#ffdd00" },
  profile: { desc: "Tu Espacio Personal", icon: "✦", color: "#aaddff" },
}

/** Marcador de perfil del rol (los workers dependen de su profesión). */
export const resolveProfileMarker = (
  role: Camp3DRole,
  workerSubType: string,
): ProfileMarkerConfig =>
  role === "worker" ? WORKER_SUB_MARKERS[workerSubType] : PROFILE_MARKERS[role]
