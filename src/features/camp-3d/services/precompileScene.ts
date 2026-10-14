import type * as THREE from "three"

/**
 * Compila los shaders de TODA la escena, incluidos los objetos que arrancan
 * ocultos (figuras de exploración…). `renderer.compile` ignora lo invisible, así
 * que sin esto esos materiales se compilaban de forma síncrona la primera vez
 * que aparecían y congelaban la animación.
 *
 * Debe llamarse con la escena COMPLETA (todas las luces agregadas): el número
 * de luces forma parte de la clave de cada shader, así que agregar una luz
 * después deja obsoleta la compilación.
 */
export function precompileScene(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
) {
  const hidden: THREE.Object3D[] = []
  scene.traverse((obj) => {
    if (!obj.visible) {
      hidden.push(obj)
      obj.visible = true
    }
  })
  renderer.compile(scene, camera)
  hidden.forEach((obj) => {
    obj.visible = false
  })
}
