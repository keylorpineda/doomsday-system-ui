/**
 * Plano maestro del campamento: ÚNICA fuente de coordenadas de la escena.
 *
 * Unidades en metros. Ejes: +x = este, +z = sur (hacia el portón principal),
 * +y = arriba. Todos los edificios son rectángulos alineados a los ejes
 * (`Footprint`); el test de layout verifica que no se superpongan, que respeten
 * una separación mínima entre sí y que queden dentro de la muralla. Cualquier
 * edificio, camino, animación o marcador que dependa de una posición la toma de
 * aquí: así no vuelven a aparecer portones mal ubicados ni estructuras que se
 * atraviesan.
 */

export interface Footprint {
  /** Centro del rectángulo. */
  x: number
  z: number
  /** Ancho (eje x) y profundidad (eje z). */
  w: number
  d: number
}

export type Vec3 = [number, number, number]

/** Medio ancho / medio largo del recinto, medido a la cara interior de la muralla. */
export const CAMP = { halfX: 46, halfZ: 36 } as const

export const WALL = {
  height: 5.2,
  thickness: 1.4,
  /** Altura de la pasarela interior por la que caminan los guardias. */
  walkwayY: 3.9,
} as const

/** Portón principal: hueco en la muralla sur. */
export const MAIN_GATE = { x: 0, z: CAMP.halfZ, width: 10 } as const

/** Separación mínima entre edificios (y entre edificios y muralla). */
export const MIN_CLEARANCE = 4

/** Edificios principales (clickeables) y secundarios. */
export const BUILDINGS = {
  /** Comando — búnker de concreto de 2 pisos. */
  hq: { x: 0, z: -22, w: 18, d: 12 },
  /** Admisiones — caseta de control junto al portón. */
  checkpoint: { x: -12, z: 27, w: 8, d: 6 },
  /** Taller de vehículos / traslados — hangar con portón al oeste. */
  garage: { x: 16, z: 24, w: 14, d: 11 },
  /** Logística — almacén grande con muelle de carga al este. */
  warehouse: { x: -30, z: -4, w: 16, d: 22 },
  /** Residencial — bloque de apartamentos de 3 pisos. */
  barracks: { x: 30, z: -9, w: 14, d: 20 },
  /** Vigilancia — torre de expediciones. */
  watchtower: { x: -30, z: 22, w: 7, d: 7 },
  /** Armería (búnker bajo) en la esquina noreste. */
  armory: { x: 31, z: -27, w: 12, d: 7 },
  /** Enfermería de campaña en la esquina noroeste. */
  medical: { x: -31, z: -27, w: 12, d: 7 },
  /** Huerto de bancales elevados. */
  garden: { x: -13, z: 12, w: 9, d: 7 },
  /** Depósito de combustible (tanques). */
  fuel: { x: -15.5, z: -12, w: 5, d: 7 },
  /** Carpas residenciales. */
  tents: { x: 31, z: 10, w: 14, d: 7 },
  /** Torre de agua. */
  waterTower: { x: -17, z: -28, w: 5, d: 5 },
} as const satisfies Record<string, Footprint>

export type BuildingKey = keyof typeof BUILDINGS

/** Alturas de cada edificio (para cámaras, tooltips y marcadores). */
export const HEIGHTS: Record<BuildingKey, number> = {
  hq: 7,
  checkpoint: 3.4,
  garage: 6.2,
  warehouse: 8,
  barracks: 10,
  watchtower: 14,
  armory: 3.2,
  medical: 3.4,
  garden: 0.6,
  fuel: 5,
  tents: 2.6,
  waterTower: 12,
}

/** Caminos (rectángulos de grava/asfalto). */
export const ROADS: Footprint[] = [
  // Avenida principal: portón → plaza → comando
  { x: 0, z: 11, w: 7, d: 50 },
  // Calle este-oeste que cruza la plaza (logística ↔ residencial)
  { x: 0, z: 4, w: 44, d: 6 },
  // Acceso al taller desde la avenida
  { x: 6, z: 24, w: 6, d: 6 },
  // Acceso a la torre de vigilancia
  { x: -18, z: 21, w: 17, d: 5 },
]

/** Plaza central. */
export const PLAZA = { x: 0, z: 4, radius: 8 } as const

/** Carretera exterior que sale del portón hacia el sur. */
export const OUTER_ROAD = { x: 0, zStart: CAMP.halfZ, zEnd: 130, width: 8 } as const

/** Torres de la muralla: esquinas, puntos medios y las dos del portón. */
export const WALL_TOWERS: Array<{ x: number; z: number; gate?: boolean }> = [
  { x: -CAMP.halfX, z: -CAMP.halfZ },
  { x: CAMP.halfX, z: -CAMP.halfZ },
  { x: -CAMP.halfX, z: CAMP.halfZ },
  { x: CAMP.halfX, z: CAMP.halfZ },
  { x: 0, z: -CAMP.halfZ },
  { x: -CAMP.halfX, z: 0 },
  { x: CAMP.halfX, z: 0 },
  { x: -24, z: CAMP.halfZ },
  { x: MAIN_GATE.x - MAIN_GATE.width / 2 - 2, z: CAMP.halfZ, gate: true },
  { x: MAIN_GATE.x + MAIN_GATE.width / 2 + 2, z: CAMP.halfZ, gate: true },
]

/** Puerta del taller (cara oeste) y plaza de estacionamiento del camión. */
export const GARAGE_DOOR = {
  x: BUILDINGS.garage.x - BUILDINGS.garage.w / 2,
  z: BUILDINGS.garage.z,
  width: 6.4,
  height: 4.6,
} as const

/** Camión estacionado dentro del taller, mirando hacia la puerta (−x). */
export const TRUCK_PARK = {
  x: BUILDINGS.garage.x + 1.5,
  z: BUILDINGS.garage.z,
  heading: -Math.PI / 2,
}

/** Ruta del camión al crear un traslado: taller → avenida → portón → carretera. */
export const TRANSFER_PATH: Vec3[] = [
  [TRUCK_PARK.x, 0, TRUCK_PARK.z],
  [GARAGE_DOOR.x - 1, 0, GARAGE_DOOR.z],
  [3.5, 0, 25.5],
  [0.8, 0, 29.5],
  [0, 0, CAMP.halfZ],
  [0, 0, CAMP.halfZ + 12],
  [0, 0, CAMP.halfZ + 34],
  [0.3, 0, CAMP.halfZ + 70],
]

/** Ruta de los exploradores: base de la torre → portón → afuera. */
export const EXPLORATION_PATH: Vec3[] = [
  [BUILDINGS.watchtower.x + 4.5, 0, BUILDINGS.watchtower.z + 1],
  [-18, 0, 21.5],
  [-7, 0, 22],
  [-2.5, 0, 30],
  [0, 0, CAMP.halfZ],
  [0, 0, CAMP.halfZ + 9],
]

/** Barrera vehicular de admisiones (pivote al borde oeste de la avenida). */
export const CHECKPOINT_BARRIER = { x: -3.6, z: 31, length: 7.2 } as const

/** Cámara orbital: pose inicial y límites (los usa useThreeScene y la cinemática). */
export const CAMERA = {
  initial: { theta: Math.PI * 0.5, phi: 1.02, radius: 72, target: [0, 0, 6] as Vec3 },
  bounds: { minX: -52, maxX: 52, minZ: -44, maxZ: 70, minRadius: 10, maxRadius: 110 },
  far: 420,
} as const

/** Multiplicador de la niebla del tema (el campamento es más grande que el original). */
export const FOG_SCALE = { near: 2.3, far: 2.7 } as const

/** Puntos donde aparece el marcador de perfil de cada rol (coordenadas mundo). */
export const PROFILE_SPOTS = {
  admin: [0, 5.2, BUILDINGS.hq.z + BUILDINGS.hq.d / 2 + 0.8] as Vec3,
  camp_leader: [BUILDINGS.hq.x + BUILDINGS.hq.w / 2 + 1.2, 1.6, BUILDINGS.hq.z] as Vec3,
  resource_manager: [BUILDINGS.warehouse.x + BUILDINGS.warehouse.w / 2 + 1.5, 1.6, 4] as Vec3,
  travel_manager: [BUILDINGS.garage.x + 4.5, 1.6, BUILDINGS.garage.z - 3.5] as Vec3,
  worker: [
    BUILDINGS.barracks.x - BUILDINGS.barracks.w / 2 - 1.4,
    1.6,
    BUILDINGS.barracks.z + 3,
  ] as Vec3,
  soldier: [BUILDINGS.armory.x, 1.6, BUILDINGS.armory.z + BUILDINGS.armory.d / 2 + 1.4] as Vec3,
  explorer: [BUILDINGS.watchtower.x, HEIGHTS.watchtower - 2.2, BUILDINGS.watchtower.z] as Vec3,
}

/** Puntos de anclaje de los tooltips de los edificios clickeables. */
export const TOOLTIP_ANCHORS: Record<
  "hq" | "gate" | "barracks" | "watchtower" | "warehouse" | "garage",
  Vec3
> = {
  hq: [BUILDINGS.hq.x, HEIGHTS.hq, BUILDINGS.hq.z],
  gate: [BUILDINGS.checkpoint.x, HEIGHTS.checkpoint, BUILDINGS.checkpoint.z],
  barracks: [BUILDINGS.barracks.x, HEIGHTS.barracks, BUILDINGS.barracks.z],
  watchtower: [BUILDINGS.watchtower.x, HEIGHTS.watchtower, BUILDINGS.watchtower.z],
  warehouse: [BUILDINGS.warehouse.x, HEIGHTS.warehouse, BUILDINGS.warehouse.z],
  garage: [BUILDINGS.garage.x, HEIGHTS.garage, BUILDINGS.garage.z],
}

// ---- Utilidades geométricas (usadas por el test y por la colocación de props) ----

export const footprintBounds = (f: Footprint) => ({
  minX: f.x - f.w / 2,
  maxX: f.x + f.w / 2,
  minZ: f.z - f.d / 2,
  maxZ: f.z + f.d / 2,
})

/** Distancia mínima entre dos rectángulos alineados a ejes (0 si se tocan o solapan). */
export function footprintGap(a: Footprint, b: Footprint) {
  const A = footprintBounds(a)
  const B = footprintBounds(b)
  const dx = Math.max(0, Math.max(A.minX, B.minX) - Math.min(A.maxX, B.maxX))
  const dz = Math.max(0, Math.max(A.minZ, B.minZ) - Math.min(A.maxZ, B.maxZ))
  return Math.hypot(dx, dz)
}

/** True si el punto (con un margen) no cae sobre ningún edificio ni camino. */
export function isFreeSpot(x: number, z: number, margin = 1) {
  const probe: Footprint = { x, z, w: margin * 2, d: margin * 2 }
  const obstacles: Footprint[] = [...Object.values(BUILDINGS), ...ROADS]
  if (obstacles.some((f) => footprintGap(f, probe) === 0)) return false
  if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.radius + margin) return false
  return (
    Math.abs(x) < CAMP.halfX - WALL.thickness - margin &&
    Math.abs(z) < CAMP.halfZ - WALL.thickness - margin
  )
}
