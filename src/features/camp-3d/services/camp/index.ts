import * as THREE from "three"

import { buildAtmosphere } from "./atmosphere"
import { buildExploration } from "./exploration"
import { createKit } from "./kit"
import { buildPerimeter } from "./perimeter"
import { buildTerrain } from "./terrain"
import { buildTruck } from "./truck"
import { buildCheckpoint } from "./zones/checkpoint"
import { buildCommand } from "./zones/command"
import { buildLogistics } from "./zones/logistics"
import { buildLookout } from "./zones/lookout"
import { buildMotorPool } from "./zones/motorPool"
import { buildResidential } from "./zones/residential"
import { buildSecondary } from "./zones/secondary"

import type { SceneHandles, WatchtowerMode } from "../../types/scene.types"

/**
 * Escala del campamento. El plano (layout.ts) ya está en metros, así que es 1;
 * se mantiene exportada para la proyección de tooltips y marcadores.
 */
export const SCENE_SCALE = 1

const GATE_SPEED = 0.6 // fracción de apertura por segundo

/**
 * Construye el campamento completo dentro de `scene` a partir del plano
 * maestro (layout.ts). Cada zona vive en su propio módulo; aquí sólo se
 * ensamblan y se coordinan las animaciones compartidas (portón y barrera).
 */
export function buildCampScene(scene: THREE.Scene, campId = "default"): SceneHandles {
  const root = new THREE.Group()
  root.name = "camp-root"
  scene.add(root)
  const kit = createKit(root, campId)

  buildTerrain(kit)
  const atmosphere = buildAtmosphere(kit, scene)
  const perimeter = buildPerimeter(kit)
  const command = buildCommand(kit)
  const checkpoint = buildCheckpoint(kit)
  const motorPool = buildMotorPool(kit)
  const logistics = buildLogistics(kit)
  const residential = buildResidential(kit)
  const lookout = buildLookout(kit)
  const secondary = buildSecondary(kit)

  // Portón y barrera: abiertos mientras alguien (traslado / expedición) lo pida.
  const gateHolds = new Set<string>()
  const holdGate = (key: string, open: boolean) => {
    if (open) gateHolds.add(key)
    else gateHolds.delete(key)
  }
  let gateAmount = 0

  const truck = buildTruck(kit, { setGarageDoor: motorPool.setDoorOpen, holdGate })
  const exploration = buildExploration(kit, { holdGate, followWithSpot: lookout.follow })

  let lastT = -1
  const animate = (t: number) => {
    const dt = lastT < 0 ? 0 : Math.min(0.05, t - lastT)
    lastT = t
    const target = gateHolds.size > 0 ? 1 : 0
    gateAmount += Math.max(-dt * GATE_SPEED, Math.min(dt * GATE_SPEED, target - gateAmount))
    const eased = gateAmount * gateAmount * (3 - 2 * gateAmount)
    perimeter.setGateOpen(eased)
    checkpoint.setBarrierOpen(Math.min(1, gateAmount * 1.8))

    perimeter.animate(t)
    command.animate(t)
    residential.animate(t)
    lookout.animate(t)
    secondary.animate(t)
    atmosphere.animate(t)
    truck.animate(t)
    exploration.animate(t)
  }

  const dispose = () => {
    root.traverse((obj) => {
      const light = obj as THREE.Light
      if (light.isLight) light.dispose()
    })
    kit.dispose()
    scene.remove(root)
  }

  return {
    animate,
    dispose,
    buildingMeshes: kit.buildingMeshes,
    playExplorationAnimation: exploration.play,
    playTransferAnimation: truck.play,
    setWatchtowerMode: (mode: WatchtowerMode) => lookout.setMode(mode),
    reactiveRefs: {
      hqFlag: command.flag,
      hqInteriorLight: command.interiorLight,
      gateBarrierArm: checkpoint.barrierArm,
      gateEmergencyLamp: checkpoint.emergencyLamp,
      watchtowerSpot: lookout.spot,
      warehouseLight: logistics.light,
      warehouseAlertLight: logistics.alertLight,
      garageDoor: motorPool.door,
      apartmentsLitWindows: residential.litWindows,
    },
  }
}
