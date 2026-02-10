import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CampaignHero, CampaignLocation, CampaignParty } from '../../types/campaign';
import { Card } from '../ui/card';
import { getStackTroopCount } from '../../campaign/rules';
import {
  WORLD_MAP_BOUNDS,
  WORLD_MAP_CAMERA,
  WORLD_MAP_INPUT,
  WORLD_MAP_MOVEMENT,
  WORLD_MAP_PICK_CONFIG,
} from '../../constants/worldMap';
import { attachMapInput } from './map/input';
import {
  clampMapPoint,
  intersectGroundPlane,
  pickMapTarget,
  screenToNdc,
  stepMovement,
} from './map/math';
import {
  WorldMapSceneState,
  createWorldMapScene,
  disposeWorldMapScene,
  renderWorldMapScene,
  resizeWorldMapScene,
  setTargetMarker,
  syncEnemyMeshes,
  syncLocationMeshes,
  updatePlayerMesh,
} from './map/scene';
import { MapPoint, MovementState } from './map/types';

interface WorldMapScreenProps {
  playerParty: CampaignParty;
  locations: CampaignLocation[];
  enemyParties: CampaignParty[];
  gold: number;
  hero: CampaignHero;
  partyCap: number;
  spottedBandits: number;
  trackingLevel: number;
  encounterDistance: number;
  onMovePlayer: (x: number, y: number) => void;
  onEnterLocation: (locationId: string) => void;
  onEngageEnemy: (enemyId: string) => void;
  onOpenCharacter: () => void;
  onBackToMenu: () => void;
  onStartNewCampaign: () => void;
}

function formatPoint(point: MapPoint | null) {
  if (!point) return 'none';
  return `${point.x.toFixed(1)}, ${point.y.toFixed(1)}`;
}

const WorldMapScreen: React.FC<WorldMapScreenProps> = ({
  playerParty,
  locations,
  enemyParties,
  gold,
  hero,
  partyCap,
  spottedBandits,
  trackingLevel,
  encounterDistance,
  onMovePlayer,
  onEnterLocation,
  onEngageEnemy,
  onOpenCharacter,
  onBackToMenu,
  onStartNewCampaign,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<WorldMapSceneState | null>(null);

  const [debugState, setDebugState] = useState({
    clickPoint: 'none',
    pickedTarget: 'none',
    movementTarget: 'none',
  });

  const debugEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('mapDebug') === '1';
  }, []);

  const movementRef = useRef<MovementState>({
    position: { x: playerParty.x, y: playerParty.y },
    velocity: { x: 0, y: 0 },
  });
  const movementTargetRef = useRef<MapPoint | null>(null);
  const totalTroopsRef = useRef(getStackTroopCount(playerParty.stacks));
  const cameraAngleRef = useRef(0);
  const cameraDistanceRef = useRef(WORLD_MAP_CAMERA.initialDistance);

  const lastMoveEmitTimeRef = useRef(0);
  const lastMoveEmitPositionRef = useRef<MapPoint>({ x: playerParty.x, y: playerParty.y });

  const locationsRef = useRef(locations);
  const enemyPartiesRef = useRef(enemyParties);
  const encounterDistanceRef = useRef(encounterDistance);
  const onMovePlayerRef = useRef(onMovePlayer);
  const onEnterLocationRef = useRef(onEnterLocation);
  const onEngageEnemyRef = useRef(onEngageEnemy);

  useEffect(() => {
    onMovePlayerRef.current = onMovePlayer;
    onEnterLocationRef.current = onEnterLocation;
    onEngageEnemyRef.current = onEngageEnemy;
  }, [onMovePlayer, onEnterLocation, onEngageEnemy]);

  useEffect(() => {
    encounterDistanceRef.current = encounterDistance;
  }, [encounterDistance]);

  useEffect(() => {
    totalTroopsRef.current = getStackTroopCount(playerParty.stacks);
  }, [playerParty.stacks]);

  useEffect(() => {
    const incoming = { x: playerParty.x, y: playerParty.y };
    const current = movementRef.current.position;
    const delta = Math.hypot(incoming.x - current.x, incoming.y - current.y);

    if (!movementTargetRef.current || delta > 30) {
      movementRef.current = {
        position: incoming,
        velocity: { x: 0, y: 0 },
      };
      if (delta > 30) {
        movementTargetRef.current = null;
        const scene = sceneRef.current;
        if (scene) {
          setTargetMarker(scene, null);
        }
      }
    }
  }, [playerParty.x, playerParty.y]);

  useEffect(() => {
    locationsRef.current = locations;
    const scene = sceneRef.current;
    if (scene) {
      syncLocationMeshes(scene, locations);
    }
  }, [locations]);

  useEffect(() => {
    enemyPartiesRef.current = enemyParties;
    const scene = sceneRef.current;
    if (scene) {
      syncEnemyMeshes(scene, enemyParties);
    }
  }, [enemyParties]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = createWorldMapScene(containerRef.current, playerParty, locationsRef.current, enemyPartiesRef.current);
    sceneRef.current = scene;

    const handlePrimaryClick = (clientX: number, clientY: number) => {
      const rendererRect = scene.renderer.domElement.getBoundingClientRect();
      const ndc = screenToNdc(clientX, clientY, rendererRect);
      const worldPoint = intersectGroundPlane(scene.camera, ndc);
      if (!worldPoint) {
        if (debugEnabled) {
          setDebugState((prev) => ({ ...prev, clickPoint: 'none', pickedTarget: 'none' }));
        }
        return;
      }

      const clampedPoint = clampMapPoint(worldPoint, WORLD_MAP_BOUNDS);
      const target = pickMapTarget(clampedPoint, locationsRef.current, enemyPartiesRef.current, WORLD_MAP_PICK_CONFIG);

      if (debugEnabled) {
        let picked = 'move';
        if (target.kind === 'location') picked = `location:${target.id}`;
        if (target.kind === 'enemy') picked = `enemy:${target.id}`;

        setDebugState((prev) => ({
          ...prev,
          clickPoint: formatPoint(clampedPoint),
          pickedTarget: picked,
        }));
      }

      if (target.kind === 'location') {
        movementTargetRef.current = null;
        movementRef.current.velocity = { x: 0, y: 0 };
        setTargetMarker(scene, null);
        if (debugEnabled) {
          setDebugState((prev) => ({ ...prev, movementTarget: 'none' }));
        }
        onEnterLocationRef.current(target.id);
        return;
      }

      if (target.kind === 'enemy') {
        movementTargetRef.current = null;
        movementRef.current.velocity = { x: 0, y: 0 };
        setTargetMarker(scene, null);
        if (debugEnabled) {
          setDebugState((prev) => ({ ...prev, movementTarget: 'none' }));
        }
        onEngageEnemyRef.current(target.id);
        return;
      }

      movementTargetRef.current = target.point;
      setTargetMarker(scene, target.point);
      if (debugEnabled) {
        setDebugState((prev) => ({ ...prev, movementTarget: formatPoint(target.point) }));
      }
    };

    const detachInput = attachMapInput(scene.renderer.domElement, {
      dragThresholdPx: WORLD_MAP_INPUT.dragThresholdPx,
      onPrimaryClick: handlePrimaryClick,
      onRotate: (deltaX) => {
        cameraAngleRef.current += deltaX * WORLD_MAP_CAMERA.rotationSpeed;
      },
      onZoom: (deltaY) => {
        cameraDistanceRef.current += deltaY * WORLD_MAP_CAMERA.wheelZoomFactor;
        cameraDistanceRef.current = Math.max(
          WORLD_MAP_CAMERA.minDistance,
          Math.min(WORLD_MAP_CAMERA.maxDistance, cameraDistanceRef.current)
        );
      },
    });

    const handleResize = () => {
      const currentScene = sceneRef.current;
      if (!currentScene) return;
      resizeWorldMapScene(currentScene);
    };

    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let lastFrame = performance.now();

    const animate = (now: number) => {
      const currentScene = sceneRef.current;
      if (!currentScene) return;

      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      const target = movementTargetRef.current;
      if (target) {
        const step = stepMovement(movementRef.current, target, dt, WORLD_MAP_MOVEMENT);
        movementRef.current = step.state;

        const collidedEnemy = enemyPartiesRef.current.find((party) => {
          if (party.faction !== 'bandit') return false;
          const dx = party.x - step.state.position.x;
          const dy = party.y - step.state.position.y;
          return Math.hypot(dx, dy) < encounterDistanceRef.current;
        });

        if (collidedEnemy) {
          movementTargetRef.current = null;
          movementRef.current = {
            position: step.state.position,
            velocity: { x: 0, y: 0 },
          };
          setTargetMarker(currentScene, null);
          onMovePlayerRef.current(step.state.position.x, step.state.position.y);
          onEngageEnemyRef.current(collidedEnemy.id);
          if (debugEnabled) {
            setDebugState((prev) => ({ ...prev, movementTarget: 'none' }));
          }
        } else if (step.arrived) {
          movementTargetRef.current = null;
          setTargetMarker(currentScene, null);
          onMovePlayerRef.current(step.state.position.x, step.state.position.y);
          lastMoveEmitTimeRef.current = now;
          lastMoveEmitPositionRef.current = { ...step.state.position };
          if (debugEnabled) {
            setDebugState((prev) => ({ ...prev, movementTarget: 'none' }));
          }
        } else {
          const sinceLastEmit = now - lastMoveEmitTimeRef.current;
          const movedSinceEmit = Math.hypot(
            step.state.position.x - lastMoveEmitPositionRef.current.x,
            step.state.position.y - lastMoveEmitPositionRef.current.y
          );

          if (
            sinceLastEmit >= WORLD_MAP_INPUT.moveEmitIntervalMs &&
            movedSinceEmit >= WORLD_MAP_INPUT.moveEmitEpsilon
          ) {
            onMovePlayerRef.current(step.state.position.x, step.state.position.y);
            lastMoveEmitTimeRef.current = now;
            lastMoveEmitPositionRef.current = { ...step.state.position };
          }
        }
      }

      updatePlayerMesh(currentScene, movementRef.current.position, totalTroopsRef.current);
      renderWorldMapScene(
        currentScene,
        movementRef.current.position,
        cameraAngleRef.current,
        cameraDistanceRef.current,
        now,
        WORLD_MAP_CAMERA.baseYMultiplier
      );

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      detachInput();

      const currentScene = sceneRef.current;
      if (currentScene) {
        disposeWorldMapScene(currentScene);
      }
      sceneRef.current = null;
    };
  }, [debugEnabled]);

  const totalTroops = getStackTroopCount(playerParty.stacks);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[var(--color-bg)]">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(212,168,67,0.06),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(107,79,160,0.06),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
      <div ref={containerRef} className="relative z-10 h-full w-full" />

      {/* ── Top bar ── */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20">
        <div className="campaign-gold-accent" />
        <div className="pointer-events-auto relative overflow-hidden border-b-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] shadow-[0_4px_0_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {/* Subtle gold inner glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[rgba(212,168,67,0.05)] to-transparent" />

          <div className="relative flex items-center justify-between px-5 py-3">
            {/* ── Left: Hero emblem + resources ── */}
            <div className="flex items-center gap-5">
              {/* Hero emblem & name */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[rgba(212,168,67,0.35)] bg-gradient-to-br from-[rgba(212,168,67,0.15)] via-[rgba(212,168,67,0.06)] to-transparent shadow-[inset_0_1px_0_rgba(212,168,67,0.2),0_2px_8px_rgba(0,0,0,0.3)]">
                  <span className="text-lg leading-none text-[var(--color-primary)]">⚔</span>
                </div>
                <div>
                  <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                    Banner Camp
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-accent text-xl font-bold leading-tight text-[var(--color-text-heading)]">
                      {hero.classId.charAt(0).toUpperCase() + hero.classId.slice(1)}
                    </p>
                    <span className="inline-flex h-[18px] items-center rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 text-[10px] font-bold tabular-nums text-[var(--color-text-muted)]">
                      LV {hero.level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ornamental diamond divider */}
              <div className="flex h-10 flex-col items-center justify-center">
                <div className="h-3 w-px bg-gradient-to-b from-transparent to-[rgba(212,168,67,0.4)]" />
                <div className="my-0.5 h-1.5 w-1.5 rotate-45 border border-[rgba(212,168,67,0.5)] bg-[rgba(212,168,67,0.15)]" />
                <div className="h-3 w-px bg-gradient-to-t from-transparent to-[rgba(212,168,67,0.4)]" />
              </div>

              {/* Resource plaques */}
              <div className="flex items-center gap-1.5">
                <div className="flex min-w-[4rem] flex-col items-center rounded-lg border border-[rgba(61,53,85,0.6)] bg-gradient-to-b from-[rgba(30,26,46,0.6)] to-transparent px-3 py-1.5">
                  <span className="font-accent text-[9px] font-semibold uppercase leading-none tracking-[0.15em] text-[var(--color-text-muted)]">Army</span>
                  <span className="font-accent text-base font-bold tabular-nums leading-snug text-[var(--color-text)]">
                    {totalTroops}<span className="text-xs text-[var(--color-text-muted)]">/{partyCap}</span>
                  </span>
                </div>

                <div className="flex min-w-[4rem] flex-col items-center rounded-lg border border-[rgba(212,168,67,0.25)] bg-gradient-to-b from-[rgba(212,168,67,0.1)] to-transparent px-3 py-1.5">
                  <span className="font-accent text-[9px] font-semibold uppercase leading-none tracking-[0.15em] text-[var(--color-primary)]">Gold</span>
                  <span className="font-accent text-base font-bold tabular-nums leading-snug text-[var(--color-gold)]">{gold}</span>
                </div>

                <div className="flex min-w-[4rem] flex-col items-center rounded-lg border border-[rgba(61,53,85,0.6)] bg-gradient-to-b from-[rgba(30,26,46,0.6)] to-transparent px-3 py-1.5">
                  <span className="font-accent text-[9px] font-semibold uppercase leading-none tracking-[0.15em] text-[var(--color-text-muted)]">Tracking</span>
                  <span className="font-accent text-base font-bold tabular-nums leading-snug text-[var(--color-text)]">{trackingLevel}</span>
                </div>

                <div className="flex min-w-[4rem] flex-col items-center rounded-lg border border-[rgba(61,53,85,0.6)] bg-gradient-to-b from-[rgba(30,26,46,0.6)] to-transparent px-3 py-1.5">
                  <span className="font-accent text-[9px] font-semibold uppercase leading-none tracking-[0.15em] text-[var(--color-text-muted)]">Spotted</span>
                  <span className="font-accent text-base font-bold tabular-nums leading-snug text-[var(--color-text)]">{spottedBandits}</span>
                </div>
              </div>
            </div>

            {/* ── Right: actions ── */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={onOpenCharacter}
                className="inline-flex h-10 items-center gap-2.5 rounded-lg border border-[rgba(212,168,67,0.3)] bg-gradient-to-b from-[rgba(212,168,67,0.12)] to-[rgba(212,168,67,0.04)] pl-5 pr-6 font-accent text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)] transition-all duration-150 hover:border-[rgba(212,168,67,0.5)] hover:from-[rgba(212,168,67,0.2)] hover:to-[rgba(212,168,67,0.08)] hover:shadow-[0_0_12px_rgba(212,168,67,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 1L2 3v4c0 3.5 5 6 5 6s5-2.5 5-6V3L7 1z" />
                </svg>
                Character
              </button>

              <button
                onClick={onStartNewCampaign}
                className="inline-flex h-10 items-center gap-2.5 rounded-lg border border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] pl-5 pr-6 font-accent text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)] backdrop-blur-md transition-all duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 1v12M3 2h7l-2 3 2 3H3" />
                </svg>
                New Campaign
              </button>

              <div className="mx-1 flex h-7 flex-col items-center justify-center">
                <div className="h-2.5 w-px bg-gradient-to-b from-transparent to-[var(--color-border-strong)]" />
                <div className="my-px h-1 w-1 rotate-45 bg-[var(--color-border-strong)]" />
                <div className="h-2.5 w-px bg-gradient-to-t from-transparent to-[var(--color-border-strong)]" />
              </div>

              <button
                onClick={onBackToMenu}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-all duration-150 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                title="Back to menu"
              >
                <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 4h10M2 7h10M2 10h10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {debugEnabled && (
        <div className="pointer-events-none absolute left-6 top-24 z-20 space-y-2">
          <Card className="px-3 py-2 text-[11px] text-[var(--color-text)]">Click: {debugState.clickPoint}</Card>
          <Card className="px-3 py-2 text-[11px] text-[var(--color-text)]">Picked: {debugState.pickedTarget}</Card>
          <Card className="px-3 py-2 text-[11px] text-[var(--color-text)]">Move Target: {debugState.movementTarget}</Card>
        </div>
      )}

      {/* ── Bottom hint ── */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-5">
        <p className="rounded-[var(--radius-full)] border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] px-6 py-2.5 text-center text-xs text-[var(--color-text-muted)] shadow-[var(--shadow-hud)] backdrop-blur-md">
          Left click to move or interact · Towns open management · Hostile parties start battle
        </p>
      </div>
    </div>
  );
};

export default WorldMapScreen;
