/// <reference lib="webworker" />
import { TEXTURE_GENERATORS } from "./textureBuilder"

import type { TextureKind } from "./textureBuilder"

export interface TextureRequest {
  id: number
  kind: TextureKind
  seed: number
  weathering: number
}

export interface TextureResponse {
  id: number
  map: ImageBitmap
  normalMap: ImageBitmap
}

/**
 * Genera las texturas procedurales del campamento fuera del hilo principal
 * (ruido fractal + mapas de normales por píxel: ~1 s de CPU en total) y las
 * devuelve como ImageBitmap transferibles, sin copias.
 */
self.onmessage = (event: MessageEvent<TextureRequest>) => {
  const { id, kind, seed, weathering } = event.data
  const pair = TEXTURE_GENERATORS[kind](seed, weathering)
  const map = (pair.map.image as OffscreenCanvas).transferToImageBitmap()
  const normalMap = (pair.normalMap.image as OffscreenCanvas).transferToImageBitmap()
  const response: TextureResponse = { id, map, normalMap }
  ;(self as unknown as DedicatedWorkerGlobalScope).postMessage(response, [map, normalMap])
}
