import * as THREE from "three"

import { SCENE_SCALE } from "./sceneBuilder"

import type { CameraState } from "../hooks/useThreeScene"
import type { BuildingConfig } from "../types/scene.types"

/*
 * Actualizaciones del overlay HTML que corren dentro del loop de render: se
 * escribe el DOM directamente para no provocar un re-render de React por frame.
 */

// Vector reutilizado: el tooltip se reposiciona en cada frame durante el hover.
const worldPos = new THREE.Vector3()

/** Proyecta el edificio a pantalla y mueve el tooltip encima (sin re-render). */
export function positionTooltip(
  el: HTMLDivElement,
  building: BuildingConfig,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
) {
  const p = building.position3D
  worldPos.set(p.x * SCENE_SCALE, p.y * SCENE_SCALE + 3.5, p.z * SCENE_SCALE).project(camera)
  el.style.left = `${Math.round((worldPos.x * 0.5 + 0.5) * canvas.clientWidth)}px`
  el.style.top = `${Math.round((-worldPos.y * 0.5 + 0.5) * canvas.clientHeight)}px`
}

/** Actualiza el HUD escribiendo el DOM directamente (lo llama el loop de render). */
export function updateSceneHud(
  posEl: HTMLDivElement | null,
  zoomEl: HTMLDivElement | null,
  cam: CameraState,
) {
  if (posEl) posEl.textContent = `POS: ${cam.target.x.toFixed(1)},${cam.target.z.toFixed(1)}`
  if (zoomEl) zoomEl.textContent = `ZOOM: ${cam.radius.toFixed(0)}m`
}
