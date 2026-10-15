import * as THREE from "three"

import { getCampVisuals } from "../campVisuals"
import { getTexturePair } from "../textureLoader"

import type { CampVisuals } from "../campVisuals"
import type { TextureKind } from "../textureBuilder"
import type { LoadedTexPair as TexPair } from "../textureLoader"

/**
 * Kit de construcción compartido por todos los módulos del campamento:
 * materiales con texturas procedurales, geometrías cacheadas con UVs en metros,
 * helpers para colocar meshes/instancias/carteles y un registro de recursos
 * para liberarlo todo en `dispose()`.
 */

export interface Placement {
  x?: number
  y?: number
  z?: number
  rx?: number
  ry?: number
  rz?: number
  /** Escala uniforme o por eje. */
  s?: number | [number, number, number]
}

export interface MeshOptions extends Placement {
  parent?: THREE.Object3D
  /** Sombras: por defecto proyecta y recibe. */
  castShadow?: boolean
  receiveShadow?: boolean
}

/** Generador pseudoaleatorio determinístico (mulberry32): cada campamento se ve siempre igual. */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ajusta los UVs de una BoxGeometry para que la textura repita cada `tile` metros. */
function applyBoxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number, tile: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada una)
  const spans: Array<[number, number]> = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ]
  for (let face = 0; face < 6; face++) {
    const [su, sv] = spans[face]
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v
      uv.setXY(i, (uv.getX(i) * su) / tile, (uv.getY(i) * sv) / tile)
    }
  }
  uv.needsUpdate = true
}

export function createKit(root: THREE.Group, campId: string) {
  const visuals: CampVisuals = getCampVisuals(campId)
  const { seed, weathering } = visuals
  const C = visuals.colors
  const rand = seededRandom(seed)

  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()

  const track = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(r: T): T => {
    if (r instanceof THREE.BufferGeometry) geometries.add(r)
    else if (r instanceof THREE.Material) materials.add(r)
    else textures.add(r)
    return r
  }

  // ---- Texturas procedurales (una sola repetición: los UVs van en metros) ----
  // Se generan en un Web Worker (textureLoader): llegan provisorias y se
  // completan solas sin bloquear la interfaz. Están cacheadas y compartidas
  // entre escenas, así que NO se registran para liberarlas.
  const tex = (kind: TextureKind) => {
    const tp = getTexturePair(kind, seed, weathering)
    tp.map.repeat.set(1, 1)
    tp.normalMap.repeat.set(1, 1)
    tp.map.colorSpace = THREE.SRGBColorSpace
    return tp
  }
  // La chapa ondulada tiene un patrón de alta frecuencia: repetirla cada metro
  // produce moiré a distancia, así que se estira (cada onda queda de ~25 cm).
  const corrugated = tex("corrugated")
  corrugated.map.repeat.set(0.12, 0.12)
  corrugated.normalMap.repeat.set(0.12, 0.12)
  const TX = {
    brick: tex("brick"),
    corrugated,
    wood: tex("wood"),
    concrete: tex("concrete"),
    rust: tex("rust"),
    ground: tex("ground"),
    sandbag: tex("sandbag"),
  }

  // ---- Materiales ----
  const std = (params: THREE.MeshStandardMaterialParameters) =>
    track(new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...params }))
  const textured = (
    tp: TexPair,
    color: number,
    params: THREE.MeshStandardMaterialParameters = {},
  ) =>
    std({
      color,
      map: tp.map,
      normalMap: tp.normalMap,
      normalScale: new THREE.Vector2(1, 1),
      ...params,
    })

  /** Textura de franjas de seguridad (amarillo/negro, rojo/blanco…). */
  const stripeTexture = (a: string, b: string, stripes = 8) => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = a
      ctx.fillRect(0, 0, 128, 128)
      ctx.fillStyle = b
      const step = 128 / stripes
      for (let i = -stripes; i < stripes * 2; i += 2) {
        ctx.beginPath()
        ctx.moveTo(i * step, 0)
        ctx.lineTo((i + 1) * step, 0)
        ctx.lineTo((i + 1) * step - 128, 128)
        ctx.lineTo(i * step - 128, 128)
        ctx.fill()
      }
    }
    const t = new THREE.CanvasTexture(canvas)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.colorSpace = THREE.SRGBColorSpace
    return track(t)
  }

  const M = {
    ground: textured(TX.ground, C.ground, { roughness: 0.97 }),
    groundOuter: textured(TX.ground, C.grass, { roughness: 0.98 }),
    dirt: textured(TX.ground, C.dirt, { roughness: 0.97 }),
    gravel: textured(TX.concrete, 0x4a4840, { roughness: 0.96 }),
    asphalt: textured(TX.concrete, 0x1b1b1a, { roughness: 0.92 }),
    concrete: textured(TX.concrete, 0x8a8a80, { roughness: 0.9 }),
    concreteDark: textured(TX.concrete, 0x55554d, { roughness: 0.92 }),
    wall: textured(TX.concrete, 0x7c7a6e, { roughness: 0.93 }),
    brick: textured(TX.brick, 0x9a6448, { roughness: 0.86 }),
    wood: textured(TX.wood, C.wood, { roughness: 0.88 }),
    woodDark: textured(TX.wood, C.woodDark, { roughness: 0.92 }),
    corrugated: textured(TX.corrugated, 0x5a5f58, { roughness: 0.6, metalness: 0.45 }),
    corrugatedRust: textured(TX.corrugated, 0x7a4a2c, { roughness: 0.72, metalness: 0.3 }),
    rust: textured(TX.rust, C.rust, { roughness: 0.85, metalness: 0.25 }),
    metal: std({ color: C.metal, roughness: 0.45, metalness: 0.75 }),
    steel: std({ color: 0x4c5056, roughness: 0.4, metalness: 0.8 }),
    sandbag: textured(TX.sandbag, 0x6a5e40, { roughness: 0.95 }),
    canvasTent: std({ color: 0x6b6450, roughness: 1 }),
    canvasOlive: std({ color: 0x4a5236, roughness: 1 }),
    tarpBlue: std({ color: 0x23395a, roughness: 1 }),
    tarpRed: std({ color: 0x6a1d1a, roughness: 1 }),
    whitePaint: std({ color: 0xc8c6bc, roughness: 0.85 }),
    redCross: std({ color: 0xb0171a, emissive: 0x5a0000, emissiveIntensity: 0.4 }),
    tire: std({ color: 0x111111, roughness: 0.95 }),
    dark: std({ color: 0x0c0c0d, roughness: 0.95 }),
    interior: std({ color: 0x2a2620, roughness: 0.95 }),
    glass: std({ color: 0x0b1418, roughness: 0.15, metalness: 0.6 }),
    windowLit: std({ color: 0xffd9a0, emissive: 0xffb860, emissiveIntensity: 1.1 }),
    windowCold: std({ color: 0xbfd8ff, emissive: 0x8fb4ff, emissiveIntensity: 0.6 }),
    bulb: std({ color: 0xfff1cc, emissive: 0xffd28a, emissiveIntensity: 3 }),
    bulbRed: std({ color: 0xff5544, emissive: 0xff2200, emissiveIntensity: 3 }),
    bulbGreen: std({ color: 0x77ff77, emissive: 0x33ff33, emissiveIntensity: 2.5 }),
    hazard: std({ map: stripeTexture("#d8a21a", "#141414"), roughness: 0.8 }),
    barrier: std({ map: stripeTexture("#e8e4dc", "#b3181b", 6), roughness: 0.7 }),
    barrelBlue: std({ color: 0x1d3a5c, roughness: 0.6, metalness: 0.4 }),
    barrelRed: std({ color: 0x6a1c12, roughness: 0.6, metalness: 0.4 }),
    barrelOlive: std({ color: 0x3c4428, roughness: 0.6, metalness: 0.4 }),
    crate: textured(TX.wood, 0x7a6040, { roughness: 0.9 }),
    leaves: std({ color: 0x1d3318, roughness: 1 }),
    leavesDark: std({ color: 0x14240f, roughness: 1 }),
    bark: std({ color: 0x2b2018, roughness: 1 }),
    soil: std({ color: 0x2a1d12, roughness: 1 }),
    crop: std({ color: 0x3f6a26, roughness: 1 }),
    wire: std({ color: 0x8a8a80, roughness: 0.5, metalness: 0.7 }),
    rope: std({ color: 0x5a4a2a, roughness: 1 }),
    cloth: [0x8a2f2a, 0x2f4f7a, 0xb59a52, 0x4f6a3a, 0xd0ccc0].map((c) =>
      std({ color: c, roughness: 1, side: THREE.DoubleSide }),
    ),
  }

  // ---- Geometrías (cacheadas por dimensiones; UVs en metros) ----
  const cache = new Map<string, THREE.BufferGeometry>()
  const cached = <G extends THREE.BufferGeometry>(key: string, make: () => G): G => {
    let g = cache.get(key) as G | undefined
    if (!g) {
      g = track(make())
      cache.set(key, g)
    }
    return g
  }
  const G = {
    box: (w: number, h: number, d: number, tile = 2) =>
      cached(`b${w}:${h}:${d}:${tile}`, () => {
        const g = new THREE.BoxGeometry(w, h, d)
        applyBoxUV(g, w, h, d, tile)
        return g
      }),
    cyl: (rt: number, rb: number, h: number, seg = 12, open = false) =>
      cached(
        `c${rt}:${rb}:${h}:${seg}:${open}`,
        () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open),
      ),
    sphere: (r: number, seg = 10) =>
      cached(`s${r}:${seg}`, () => new THREE.SphereGeometry(r, seg, seg)),
    cone: (r: number, h: number, seg = 8) =>
      cached(`k${r}:${h}:${seg}`, () => new THREE.ConeGeometry(r, h, seg)),
    torus: (r: number, tube: number, seg = 10) =>
      cached(`t${r}:${tube}:${seg}`, () => new THREE.TorusGeometry(r, tube, 6, seg)),
    plane: (w: number, d: number, tile = 4) =>
      cached(`p${w}:${d}:${tile}`, () => {
        const g = new THREE.PlaneGeometry(w, d)
        g.rotateX(-Math.PI / 2)
        const uv = g.attributes.uv as THREE.BufferAttribute
        for (let i = 0; i < uv.count; i++)
          uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * d) / tile)
        return g
      }),
    /** Prisma triangular (techo a dos aguas) de ancho w, alto h y largo d (eje z). */
    gable: (w: number, h: number, d: number) =>
      cached(`g${w}:${h}:${d}`, () => {
        const shape = new THREE.Shape()
        shape.moveTo(-w / 2, 0)
        shape.lineTo(w / 2, 0)
        shape.lineTo(0, h)
        shape.closePath()
        const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false })
        g.translate(0, 0, -d / 2)
        return g
      }),
  }

  // ---- Colocación ----
  const place = (obj: THREE.Object3D, p: Placement = {}) => {
    obj.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0)
    obj.rotation.set(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0)
    if (p.s !== undefined) {
      if (Array.isArray(p.s)) obj.scale.set(...p.s)
      else obj.scale.setScalar(p.s)
    }
    return obj
  }

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, opts: MeshOptions = {}) => {
    const m = place(new THREE.Mesh(geo, mat), opts) as THREE.Mesh
    m.castShadow = opts.castShadow ?? true
    m.receiveShadow = opts.receiveShadow ?? true
    ;(opts.parent ?? root).add(m)
    return m
  }

  const box = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    opts: MeshOptions = {},
    tile = 2,
  ) => mesh(G.box(w, h, d, tile), mat, opts)

  const group = (opts: Placement & { parent?: THREE.Object3D } = {}) => {
    const g = place(new THREE.Group(), opts) as THREE.Group
    ;(opts.parent ?? root).add(g)
    return g
  }

  /** Muchas copias de la misma pieza en un solo draw call. */
  const instanced = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    placements: Placement[],
    opts: { parent?: THREE.Object3D; castShadow?: boolean; receiveShadow?: boolean } = {},
  ) => {
    const inst = new THREE.InstancedMesh(geo, mat, Math.max(placements.length, 1))
    const dummy = new THREE.Object3D()
    placements.forEach((p, i) => {
      place(dummy, p)
      if (p.s === undefined) dummy.scale.setScalar(1)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)
    })
    inst.count = placements.length
    inst.instanceMatrix.needsUpdate = true
    inst.castShadow = opts.castShadow ?? false
    inst.receiveShadow = opts.receiveShadow ?? true
    inst.computeBoundingSphere()
    ;(opts.parent ?? root).add(inst)
    return inst
  }

  /** Cartel con texto (canvas) y franja de color de la zona. */
  const sign = (
    text: string,
    accent: string,
    w: number,
    h: number,
    opts: MeshOptions & { emissive?: number } = {},
  ) => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = Math.max(64, Math.round((512 * h) / w))
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#15140f"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = accent
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.14)
      ctx.fillRect(0, canvas.height * 0.86, canvas.width, canvas.height * 0.14)
      ctx.fillStyle = "#ece6d4"
      ctx.font = `bold ${Math.round(canvas.height * 0.42)}px "Courier New", monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width * 0.92)
    }
    const t = track(new THREE.CanvasTexture(canvas))
    t.colorSpace = THREE.SRGBColorSpace
    const mat = std({
      map: t,
      emissive: 0xffffff,
      emissiveMap: t,
      emissiveIntensity: opts.emissive ?? 0.35,
      roughness: 0.8,
    })
    // UVs 0..1 en la cara frontal (sin escala en metros) para que el texto encaje
    const panel = mesh(track(new THREE.BoxGeometry(w, h, 0.12)), mat, {
      ...opts,
      castShadow: false,
    })
    return panel
  }

  const pointLight = (
    color: number,
    intensity: number,
    distance: number,
    p: Placement,
    parent: THREE.Object3D = root,
  ) => {
    const l = place(new THREE.PointLight(color, intensity, distance, 2), p) as THREE.PointLight
    parent.add(l)
    return l
  }

  /** Marca meshes como un edificio clickeable (comparten material para el resaltado). */
  const buildingMeshes: THREE.Object3D[] = []
  const tagBuilding = (id: string, meshes: THREE.Mesh[]) => {
    const shared = (meshes[0].material as THREE.MeshStandardMaterial).clone()
    track(shared)
    for (const m of meshes) {
      m.material = shared
      m.userData = { type: "building", id, baseEmissiveIntensity: shared.emissiveIntensity }
      buildingMeshes.push(m)
    }
  }

  /** Volumen invisible pero clickeable (para estructuras abiertas como la torre). */
  const hitVolume = (w: number, h: number, d: number, p: Placement) => {
    const mat = std({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
    mat.colorWrite = false
    const m = mesh(G.box(w, h, d), mat, { ...p, castShadow: false, receiveShadow: false })
    return m
  }

  const dispose = () => {
    geometries.forEach((g) => g.dispose())
    materials.forEach((m) => m.dispose())
    textures.forEach((t) => t.dispose())
  }

  return {
    root,
    visuals,
    C,
    rand,
    TX,
    M,
    G,
    track,
    std,
    place,
    mesh,
    box,
    group,
    instanced,
    sign,
    pointLight,
    tagBuilding,
    hitVolume,
    buildingMeshes,
    dispose,
  }
}

export type Kit = ReturnType<typeof createKit>
