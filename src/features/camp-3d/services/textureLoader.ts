import * as THREE from "three"

import { getCampVisuals } from "./campVisuals"
import { TEXTURE_GENERATORS } from "./textureBuilder"

import type { TextureRequest, TextureResponse } from "./texture.worker"
import type { TextureKind } from "./textureBuilder"

export interface LoadedTexPair {
  map: THREE.Texture
  normalMap: THREE.Texture
}

const ALL_KINDS = Object.keys(TEXTURE_GENERATORS) as TextureKind[]

/**
 * Textura provisoria 1×1 (gris medio / normal plana) mientras llega la real.
 * Es una textura de IMAGEN (canvas), no un DataTexture: three.js sube cada tipo
 * por un camino distinto y la imagen real (ImageBitmap) debe ir por el mismo.
 */
function placeholder([r, g, b]: [number, number, number]) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(0, 0, 1, 1)
  }
  const t = new THREE.Texture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

function swapImage(
  texture: THREE.Texture,
  image: ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
) {
  texture.image = image
  // ImageBitmap no admite flipY en WebGL; para patrones repetidos no importa.
  texture.flipY = !(typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap)
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.needsUpdate = true
}

const cache = new Map<string, LoadedTexPair>()
let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, LoadedTexPair>()

const supportsWorker = () => typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined"

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./texture.worker.ts", import.meta.url), { type: "module" })
    worker.onmessage = (event: MessageEvent<TextureResponse>) => {
      const pair = pending.get(event.data.id)
      if (!pair) return
      pending.delete(event.data.id)
      swapImage(pair.map, event.data.map)
      swapImage(pair.normalMap, event.data.normalMap)
    }
  }
  return worker
}

/**
 * Devuelve al instante un par de texturas utilizable. Si el navegador soporta
 * Web Workers con OffscreenCanvas, arrancan como un píxel provisorio y la
 * imagen real se genera en segundo plano (el material ya tiene `map`, así que
 * reemplazar la imagen sólo la sube a la GPU: no recompila shaders). Si no,
 * se generan en el hilo principal como antes. Cacheado por tipo + semilla.
 */
export function getTexturePair(kind: TextureKind, seed: number, weathering: number): LoadedTexPair {
  const key = `${kind}:${seed}:${weathering}`
  const cached = cache.get(key)
  if (cached) return cached

  let pair: LoadedTexPair
  if (supportsWorker()) {
    pair = { map: placeholder([128, 128, 128]), normalMap: placeholder([128, 128, 255]) }
    const id = nextId++
    pending.set(id, pair)
    const request: TextureRequest = { id, kind, seed, weathering }
    getWorker().postMessage(request)
  } else {
    const generated = TEXTURE_GENERATORS[kind](seed, weathering)
    pair = { map: generated.map, normalMap: generated.normalMap }
  }
  cache.set(key, pair)
  return pair
}

/**
 * Empieza a generar en segundo plano las texturas de un campamento (p. ej.
 * durante la animación del login), para que la escena las encuentre listas.
 */
export function prewarmCampTextures(campId: string) {
  if (!supportsWorker()) return
  const { seed, weathering } = getCampVisuals(campId)
  ALL_KINDS.forEach((kind) => getTexturePair(kind, seed, weathering))
}
