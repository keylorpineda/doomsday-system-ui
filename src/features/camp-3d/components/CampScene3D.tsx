import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { AccessDeniedNotice } from "./AccessDeniedNotice"
import { BuildingTooltip } from "./BuildingTooltip"
import { CinematicLetterbox } from "./CinematicLetterbox"
import { SceneHud } from "./SceneHud"
import { BUILDINGS } from "../constants/buildings.config"
import {
  normalizeRole,
  resolveBuildingRoute,
  resolveProfileMarker,
} from "../constants/sceneNavigation"
import { useAccessDenied } from "../hooks/useAccessDenied"
import { useRaycaster } from "../hooks/useRaycaster"
import { useSceneReactiveData } from "../hooks/useSceneReactiveData"
import { useThreeScene } from "../hooks/useThreeScene"
import { useTransferCinematic } from "../hooks/useTransferCinematic"
import { useWorkerSubType } from "../hooks/useWorkerSubType"
import { buildCampScene } from "../services/camp"
import { precompileScene } from "../services/precompileScene"
import { createProfileMarker } from "../services/profileMarker"
import { positionTooltip, updateSceneHud } from "../services/sceneOverlayDom"

import type { ProfileMarker } from "../services/profileMarker"
import type { BuildingConfig, CampScene3DProps, SceneHandles } from "../types/scene.types"
import type * as THREE from "three"

import { useAuthStore } from "@/store/useAuthStore"

import "./CampScene3D.css"

type Props = CampScene3DProps & {
  /** Se dispara cuando la escena Three.js ha terminado de construirse. */
  onReady?: () => void
}

// El HUD de posición/zoom se refresca cada N frames (no hace falta a 60 Hz).
const HUD_EVERY_N_FRAMES = 3
// Oscurece los edificios a los que el rol actual no tiene acceso.
const RESTRICTED_COLOR_FACTOR = 0.35

/**
 * Escena 3D del campamento. Monta el canvas Three.js, construye la escena en
 * `onReady`, la anima cada frame y conecta el raycaster (hover + click →
 * navegación). La lógica vive en hooks/servicios dedicados; este componente
 * sólo los orquesta y compone el overlay.
 */
export default function CampScene3D({
  campId,
  onClose,
  onReady,
  embedded,
  onBuildingSelect,
  paused = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const posRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  const handlesRef = useRef<SceneHandles | null>(null)
  const markerRef = useRef<ProfileMarker | null>(null)
  const targetsRef = useRef<THREE.Object3D[]>([])
  const frameRef = useRef(0)
  const hoveredRef = useRef<BuildingConfig | null>(null)
  const [hovered, setHovered] = useState<BuildingConfig | null>(null)

  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = normalizeRole(user?.role)
  const workerSubType = useWorkerSubType(role)
  const marker = resolveProfileMarker(role, workerSubType)
  const { denied, showDenied, dismiss: dismissDenied } = useAccessDenied()
  const cinematic = useTransferCinematic(handlesRef, markerRef)

  // Edificios accesibles por el rol actual (admin ve todo).
  const allowedIds = useMemo(
    () => new Set(BUILDINGS.filter((b) => b.requiredRoles.includes(role)).map((b) => b.id)),
    [role],
  )

  // Config sintética del marcador de perfil (Paso 07) para tooltip y click.
  const profileBuilding = useMemo<BuildingConfig>(
    () => ({
      id: "profile",
      label: `Tu Perfil — ${user?.username ?? role}`,
      meshNames: [],
      route: marker.route,
      requiredRoles: [role],
      reactiveData: null,
      position3D: { x: marker.pos[0], y: marker.pos[1], z: marker.pos[2] },
    }),
    [marker, role, user?.username],
  )

  const contextRef = useThreeScene(canvasRef, {
    onReady: ({ scene, camera, renderer }) => {
      const handles = buildCampScene(scene, campId)
      handlesRef.current = handles

      // Paso 09 — filtro por rol: los edificios sin acceso se oscurecen pero
      // SIGUEN siendo clickeables; al tocarlos se muestra el aviso de acceso
      // denegado (admin ve todo sin cambios).
      handles.buildingMeshes.forEach((obj) => {
        if (allowedIds.has(obj.userData.id)) return
        const material = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
        material.color.multiplyScalar(RESTRICTED_COLOR_FACTOR)
        material.emissiveIntensity = 0
      })

      const profileMarker = createProfileMarker(scene, marker.pos)
      markerRef.current = profileMarker
      targetsRef.current = [...handles.buildingMeshes, profileMarker.zone]

      // Con la escena COMPLETA (incluida la luz del marcador): ver precompileScene.
      precompileScene(scene, camera, renderer)

      if (import.meta.env.DEV) {
        // Atajos de depuración desde la consola del navegador (sólo en desarrollo).
        const debug = window as unknown as Record<string, unknown>
        debug.__playTransfer = cinematic.start
        debug.__camp3d = {
          scene,
          camera,
          renderer,
          handles,
          camState: contextRef.current?.camState,
        }
      }

      onReady?.()
      cinematic.playPendingWhenReady()
    },
    onFrame: (t, { camera, camState }) => {
      // Cámara guionada de la cinemática (sobrescribe el control orbital).
      cinematic.updateCamera(t, camState)
      handlesRef.current?.animate(t)
      markerRef.current?.update(t)

      const building = hoveredRef.current
      if (building && tooltipRef.current && canvasRef.current) {
        positionTooltip(tooltipRef.current, building, camera, canvasRef.current)
      }

      frameRef.current += 1
      if (frameRef.current % HUD_EVERY_N_FRAMES === 0) {
        updateSceneHud(posRef.current, zoomRef.current, camState)
      }
    },
    paused,
  })

  // El perfil del worker llega después de construir la escena: mover el marcador.
  useEffect(() => {
    markerRef.current?.setPosition(marker.pos)
  }, [marker])

  // Paso Reactivo — refleja el estado del campamento en la escena. Se actualiza
  // por eventos del backend (WebSocket) y no consulta mientras está pausada.
  useSceneReactiveData(campId, handlesRef, role, paused)

  useRaycaster(canvasRef, contextRef, targetsRef, {
    onBuildingClick: (building) => {
      // El perfil siempre es accesible; los demás se validan contra el rol.
      if (building.id !== "profile" && !allowedIds.has(building.id)) {
        showDenied(building)
        return
      }
      // Layouts por pestañas: abrir la pestaña en vez de navegar por router.
      if (onBuildingSelect) {
        onBuildingSelect(building.id)
        return
      }
      // En modo embebido la escena es el FONDO del panel: navegar abre la
      // sección como ventana encima sin desmontar el campamento. En modo overlay
      // a pantalla completa se cierra la escena antes de navegar.
      if (!embedded) onClose()
      navigate(resolveBuildingRoute(role, building))
    },
    onHoverChange: (building) => {
      hoveredRef.current = building
      setHovered(building)
    },
    extraBuildings: [profileBuilding],
  })

  // Libera la escena al desmontar (el renderer lo libera useThreeScene).
  useEffect(
    () => () => {
      handlesRef.current?.dispose()
      handlesRef.current = null
      markerRef.current?.dispose()
      markerRef.current = null
      targetsRef.current = []
    },
    [],
  )

  return (
    <div className="camp3d-root" data-camp-id={campId}>
      <canvas ref={canvasRef} className="camp3d-canvas" />

      {!embedded && (
        <button type="button" className="camp3d-back" onClick={onClose}>
          ◄ Ir al Panel
        </button>
      )}

      {cinematic.showCinematic ? <CinematicLetterbox /> : null}

      {hovered ? (
        <BuildingTooltip
          building={hovered}
          restricted={hovered.id !== "profile" && !allowedIds.has(hovered.id)}
          tooltipRef={tooltipRef}
        />
      ) : null}

      {denied ? (
        // La key re-dispara la animación aunque se toque el mismo edificio dos veces.
        <AccessDeniedNotice key={denied.nonce} notice={denied} onDismiss={dismissDenied} />
      ) : null}

      <SceneHud posRef={posRef} zoomRef={zoomRef} />
    </div>
  )
}
