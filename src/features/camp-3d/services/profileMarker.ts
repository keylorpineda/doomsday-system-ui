import * as THREE from "three"

import { SCENE_SCALE } from "./camp"

import type { BuildingUserData } from "../types/scene.types"

const MARKER_COLOR = 0xaaddff
const BASE_EMISSIVE = 0.35

/**
 * Paso 07 — marcador de perfil: zona translúcida clickeable que pulsa
 * lentamente sobre el espacio del usuario dentro del campamento. Pulsa su
 * opacidad (no usa una luz real: cada luz dinámica encarece todos los shaders,
 * y el brillo emisivo lo usa el resaltado del hover).
 */
export interface ProfileMarker {
  /** Caja clickeable (objetivo del raycaster). */
  zone: THREE.Mesh
  /** Mueve el marcador (coordenadas raw, se escalan con SCENE_SCALE). */
  setPosition: (pos: [number, number, number]) => void
  /** Oculta/muestra el marcador (p. ej. durante la cinemática del camión). */
  setHidden: (hidden: boolean) => void
  /** Pulso de opacidad; se llama en cada frame. */
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
  group.add(zone)
  scene.add(group)

  let hidden = false

  const setPosition = ([x, y, z]: [number, number, number]) => {
    zone.position.set(x * SCENE_SCALE, y * SCENE_SCALE, z * SCENE_SCALE)
  }
  setPosition(pos)

  return {
    zone,
    setPosition,
    setHidden: (value) => {
      hidden = value
      zone.visible = !value
    },
    update: (t) => {
      if (!hidden) material.opacity = 0.22 + Math.sin(t * 2.2) * 0.1
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
      group.removeFromParent()
    },
  }
}
