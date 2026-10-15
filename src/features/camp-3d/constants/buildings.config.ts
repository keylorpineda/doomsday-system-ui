import { TOOLTIP_ANCHORS } from "../services/camp/layout"

import type { BuildingConfig } from "../types/scene.types"

/** Posición del tooltip de cada edificio, tomada del plano maestro del campamento. */
const anchor = (id: keyof typeof TOOLTIP_ANCHORS) => {
  const [x, y, z] = TOOLTIP_ANCHORS[id]
  return { x, y, z }
}

/**
 * Catálogo de edificios interactivos del campamento 3D (plan TLoU2).
 *
 * Cada `meshNames` referencia los nombres que el constructor de escena
 * (services/camp/) asigna a los meshes principales. `requiredRoles`
 * y `reactiveData` los consumen los pasos de rol y de datos reactivos.
 *
 * Las rutas son las de la vista Admin; las variantes por rol (camp_leader,
 * resource_manager, etc.) se resuelven en el paso de roles. La armería, la
 * radio y la torre de spotlight quedaron decorativas (sin entrada aquí); el
 * Paso 07 las reutiliza como marcadores de perfil.
 */
export const BUILDINGS: BuildingConfig[] = [
  {
    id: "hq",
    label: "Cuartel General",
    meshNames: ["hq_mesh"],
    route: "/admin/dashboard",
    requiredRoles: ["admin", "camp_leader"],
    reactiveData: null,
    position3D: anchor("hq"),
  },
  {
    id: "gate",
    label: "Garita del Guardia",
    meshNames: ["gate_mesh"],
    route: "/admin/admissions",
    requiredRoles: ["admin", "camp_leader", "resource_manager"],
    reactiveData: "admissions_pending",
    position3D: anchor("gate"),
  },
  {
    id: "barracks",
    label: "Apartamentos",
    meshNames: ["barracks_mesh"],
    route: "/admin/people",
    requiredRoles: ["admin", "camp_leader"],
    reactiveData: null,
    position3D: anchor("barracks"),
  },
  {
    id: "watchtower",
    label: "Torre de Vigilancia",
    meshNames: ["watchtower_mesh"],
    route: "/admin/explorations",
    requiredRoles: ["admin", "camp_leader", "travel_manager", "worker"],
    reactiveData: "exploration_active",
    position3D: anchor("watchtower"),
  },
  {
    id: "warehouse",
    label: "Almacén",
    meshNames: ["warehouse_mesh"],
    route: "/admin/resources",
    requiredRoles: ["admin", "resource_manager", "camp_leader", "worker"],
    reactiveData: "inventory_alert",
    position3D: anchor("warehouse"),
  },
  {
    id: "garage",
    label: "Garaje de Traslados",
    meshNames: ["garage_mesh"],
    route: "/admin/transfers",
    requiredRoles: ["admin", "travel_manager", "camp_leader"],
    reactiveData: "transfer_active",
    position3D: anchor("garage"),
  },
]
