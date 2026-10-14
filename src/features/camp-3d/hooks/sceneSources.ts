import type { Camp3DRole, SceneHandles } from "../types/scene.types"
import type * as THREE from "three"

import { getPendingAdmissions } from "@/features/admissions/services/admissions.service"
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard.service"
import { getExplorations } from "@/features/explorations/services/explorations.service"
import { getInventory } from "@/features/inventory/services/inventory.service"
import { getPersons } from "@/features/persons/services/persons.service"
import { getCampTransfers } from "@/features/transfers/services/transfers.service"

/** Temas de datos que el backend notifica con `camp.updated`. */
export type CampTopic = "admissions" | "explorations" | "inventory" | "persons" | "transfers"

/** Cada fuente de datos reactiva: tema, permisos y cómo se refleja en la escena. */
export type SourceKey = CampTopic | "dashboard"

/** Estado entre consultas (para disparar animaciones sólo en el flanco de subida). */
export interface SourceMemory {
  explorationActive: boolean
  transferInTransit: boolean
}

interface SceneSource {
  /**
   * Los endpoints de dashboard, admisiones, traslados y personas devuelven 403
   * al worker: no se le piden para no generar requests que el backend rechaza.
   */
  managerOnly: boolean
  refresh: (campId: string, handles: SceneHandles, memory: SourceMemory) => Promise<void>
}

export const SOURCES: Record<SourceKey, SceneSource> = {
  // DASHBOARD → Comando (bandera y luz interior según el nivel de peligro)
  dashboard: {
    managerOnly: true,
    refresh: async (campId, { reactiveRefs: refs }) => {
      const metrics = await getDashboardMetrics(campId)
      const criticalResources = metrics.warehouse?.resources_with_alerts ?? 0
      const occupancy = metrics.camp?.occupancy_rate ?? 0
      const unavailable = metrics.camp?.unavailable_people ?? 0
      const total = metrics.camp?.total_people ?? 1

      let dangerLevel: "critical" | "high" | "low" = "low"
      if (criticalResources >= 3 || occupancy > 95) dangerLevel = "critical"
      else if (criticalResources >= 1 || unavailable / total > 0.3) dangerLevel = "high"

      const flagMat = refs.hqFlag.material as THREE.MeshStandardMaterial
      if (dangerLevel === "critical") {
        flagMat.color.setHex(0xff1100)
        flagMat.emissive.setHex(0xff1100)
        flagMat.emissiveIntensity = 0.6
      } else {
        flagMat.color.setHex(0x223388)
        flagMat.emissive.setHex(0x112266)
        flagMat.emissiveIntensity = 0.1
      }
      refs.hqInteriorLight.intensity =
        dangerLevel === "critical" ? 0.6 : dangerLevel === "high" ? 1.2 : 2.5
    },
  },

  // ADMISIONES → lámpara de emergencia de la caseta (roja con pendientes)
  admissions: {
    managerOnly: true,
    refresh: async (campId, { reactiveRefs: refs }) => {
      const admissions = await getPendingAdmissions({ campId })
      const pendingCount = admissions.total ?? admissions.data?.length ?? 0
      if (pendingCount > 0) {
        refs.gateEmergencyLamp.color.setHex(0xff2200)
        refs.gateEmergencyLamp.intensity = 3.0
      } else {
        refs.gateEmergencyLamp.color.setHex(0x44ff44)
        refs.gateEmergencyLamp.intensity = 1.5
      }
    },
  },

  // EXPLORACIONES → reflector de la torre y salida de exploradores
  explorations: {
    managerOnly: false,
    refresh: async (campId, handles, memory) => {
      const refs = handles.reactiveRefs
      const explorations = await getExplorations({ campId })
      // "Activa" = in_progress. "Overdue" no es un status: se calcula si venció
      // su plazo (estimated_days + grace_days).
      const active = explorations.filter((e) => e.status === "in_progress")
      const hasActive = active.length > 0
      const now = Date.now()
      const hasOverdue = active.some((e) => {
        const deadline =
          new Date(e.departure_date).getTime() +
          (e.estimated_days + (e.grace_days ?? 0)) * 86_400_000
        return Number.isFinite(deadline) && now > deadline
      })

      if (hasOverdue) {
        handles.setWatchtowerMode("overdue")
        refs.watchtowerSpot.color.setHex(0xff6600)
      } else {
        handles.setWatchtowerMode(hasActive ? "gate" : "sweep")
        refs.watchtowerSpot.color.setHex(0xdde8ff)
      }
      if (hasActive && !memory.explorationActive) handles.playExplorationAnimation()
      memory.explorationActive = hasActive
    },
  },

  // INVENTARIO → luz del almacén y baliza de alerta (naranja si falta combustible)
  inventory: {
    managerOnly: false,
    refresh: async (campId, { reactiveRefs: refs }) => {
      const inventory = await getInventory(campId)
      const hasAlert = inventory.some((item) => item.alert_active)
      const fuelItem = inventory.find(
        (item) =>
          item.resource?.category === "fuel" ||
          item.resource?.name?.toLowerCase().includes("combustible"),
      )
      const fuelCritical = fuelItem && fuelItem.current_quantity < fuelItem.minimum_stock_required

      refs.warehouseAlertLight.intensity = hasAlert ? 4.0 : 0
      const totalQty = inventory.reduce((sum, i) => sum + i.current_quantity, 0)
      const totalMin = inventory.reduce((sum, i) => sum + i.minimum_stock_required, 0)
      const ratio = totalMin > 0 ? totalQty / totalMin : 1
      refs.warehouseLight.intensity = ratio > 1.5 ? 5.0 : 3.0
      refs.warehouseLight.color.setHex(0xffcc88)
      if (fuelCritical) refs.warehouseAlertLight.color.setHex(0xff6600)
      else if (hasAlert) refs.warehouseAlertLight.color.setHex(0xff2200)
    },
  },

  // TRASLADOS → el camión sale cuando un traslado pasa a in_transit
  transfers: {
    managerOnly: true,
    refresh: async (campId, handles, memory) => {
      const transfers = await getCampTransfers(campId)
      const inTransit = transfers.some((t) => t.status === "in_transit")
      if (inTransit && !memory.transferInTransit) handles.playTransferAnimation()
      memory.transferInTransit = inTransit
    },
  },

  // PERSONAS → brillo de las ventanas de los apartamentos (proporción que puede trabajar)
  persons: {
    managerOnly: true,
    refresh: async (campId, { reactiveRefs: refs }) => {
      const persons = await getPersons({ campId, limit: 9999 })
      const people = persons.data ?? []
      const ratio = people.filter((p) => p.can_work).length / (people.length || 1)
      refs.apartmentsLitWindows.emissiveIntensity = 0.1 + ratio * 1.1
    },
  },
}

export const ALL_SOURCES = Object.keys(SOURCES) as SourceKey[]

/** Fuentes que el rol puede consultar. */
export const sourcesForRole = (role: Camp3DRole) =>
  ALL_SOURCES.filter((key) => role !== "worker" || !SOURCES[key].managerOnly)

/**
 * Fuentes a refrescar cuando el backend avisa un cambio en `topic`. El
 * dashboard agrega métricas de todas las áreas, así que acompaña a cualquiera.
 */
export const sourcesForTopic = (topic: CampTopic): SourceKey[] => [topic, "dashboard"]
