import * as THREE from "three"

import { SCENE_SCALE } from "./sceneBuilder"

import type { BuildingUserData } from "../types/scene.types"

const MARKER_COLOR = 0xaaddff
const BASE_EMISSIVE = 0.35

/**
 * Paso 07 — marcador de perfil: zona translúcida clickeable + luz que pulsa
 * lentamente sobre el espacio del usuario dentro del campamento.
 */
export interface ProfileMarker {
  /** Caja clickeable (objetivo del raycaster). */
  zone: THREE.Mesh
  /** Mueve el marcador (coordenadas raw, se escalan con SCENE_SCALE). */
  setPosition: (pos: [number, number, number]) => void
  /**
   * Oculta/muestra el marcador. Sólo se oculta la caja y se apaga la luz
   * (intensidad 0): ocultar el grupo cambiaría el número de luces de la escena
   * y forzaría a recompilar todos los shaders.
   */
  setHidden: (hidden: boolean) => void
  /** Pulso de la luz; se llama en cada frame. */
  update: (t: number) => void
  dispose: () => void
}

export function createProfileMarker(
  scene: THREE.Scene,
  pos: [number, number, number],
): ProfileMarker {
  const group = new THREE.Group()
  const geometry = new THREE.BoxGeometry(1.1, 1.1, 1.1)
  const material = new THREE.MeshStandardMaterial({
    color: MARKER_COLOR,
    emissive: MARKER_COLOR,
    emissiveIntensity: BASE_EMISSIVE,
    transparent: true,
    opacity: 0.22,
    roughness: 0.5,
  })
  const zone = new THREE.Mesh(geometry, material)
  const userData: BuildingUserData = {
    type: "building",
    id: "profile",
    baseEmissiveIntensity: BASE_EMISSIVE,
  }
  zone.userData = userData
  const light = new THREE.PointLight(MARKER_COLOR, 0.9, 6)
  group.add(zone, light)
  scene.add(group)

  let hidden = false

  const setPosition = ([x, y, z]: [number, number, number]) => {
    zone.position.set(x * SCENE_SCALE, y * SCENE_SCALE, z * SCENE_SCALE)
    light.position.set(x * SCENE_SCALE, (y + 0.5) * SCENE_SCALE, z * SCENE_SCALE)
  }
  setPosition(pos)

  return {
    zone,
    setPosition,
    setHidden: (value) => {
      hidden = value
      zone.visible = !value
      if (value) light.intensity = 0
    },
    update: (t) => {
      if (!hidden) light.intensity = 0.7 + Math.sin(t * 2.2) * 0.35
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
      light.dispose()
      group.removeFromParent()
    },
  }
}
