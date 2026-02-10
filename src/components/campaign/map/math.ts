import * as THREE from 'three';
import { CampaignLocation, CampaignParty } from '../../../types/campaign';
import { WORLD_MAP_TERRAIN } from '../../../constants/worldMap';
import {
  MapBounds,
  MapMovementParams,
  MapPickConfig,
  MapPoint,
  MapTarget,
  MovementState,
} from './types';

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();

export function clampMapPoint(point: MapPoint, bounds: MapBounds): MapPoint {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y)),
  };
}

export function screenToNdc(clientX: number, clientY: number, rect: DOMRect): THREE.Vector2 {
  return new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
}

export function intersectGroundPlane(camera: THREE.Camera, ndc: THREE.Vector2): MapPoint | null {
  raycaster.setFromCamera(ndc, camera);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(groundPlane, hit)) {
    return null;
  }

  return {
    x: hit.x,
    y: hit.z,
  };
}

export function pickMapTarget(
  point: MapPoint,
  locations: CampaignLocation[],
  enemies: CampaignParty[],
  config: MapPickConfig
): MapTarget {
  let nearestTarget: MapTarget | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const location of locations) {
    const dx = location.x - point.x;
    const dy = location.y - point.y;
    const distance = Math.hypot(dx, dy);
    const radius = config.locationRadiusByType[location.type];
    if (distance <= radius && distance < nearestDistance) {
      nearestDistance = distance;
      nearestTarget = { kind: 'location', id: location.id };
    }
  }

  for (const enemy of enemies) {
    const dx = enemy.x - point.x;
    const dy = enemy.y - point.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= config.enemyRadius && distance < nearestDistance) {
      nearestDistance = distance;
      nearestTarget = { kind: 'enemy', id: enemy.id };
    }
  }

  if (nearestTarget) {
    return nearestTarget;
  }

  return { kind: 'move', point };
}

export function stepMovement(
  movement: MovementState,
  target: MapPoint,
  dt: number,
  params: MapMovementParams
): { state: MovementState; arrived: boolean } {
  const seconds = Math.max(0, dt);
  const distanceScale = Math.max(0, seconds * 60);

  const dx = target.x - movement.position.x;
  const dy = target.y - movement.position.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= params.arrivalThreshold) {
    return {
      arrived: true,
      state: {
        position: clampMapPoint(target, params.bounds),
        velocity: { x: 0, y: 0 },
      },
    };
  }

  const dirX = dx / distance;
  const dirY = dy / distance;
  const speedMultiplier = Math.min(1, distance / params.slowdownDistance);
  const desiredSpeed = params.maxSpeed * speedMultiplier;
  const desiredVx = dirX * desiredSpeed;
  const desiredVy = dirY * desiredSpeed;

  const blend = Math.min(
    1,
    (distance < params.slowdownDistance ? params.deceleration : params.acceleration) * distanceScale
  );

  const nextVelocity = {
    x: movement.velocity.x + (desiredVx - movement.velocity.x) * blend,
    y: movement.velocity.y + (desiredVy - movement.velocity.y) * blend,
  };

  const unclampedPosition = {
    x: movement.position.x + nextVelocity.x * seconds,
    y: movement.position.y + nextVelocity.y * seconds,
  };

  const nextPosition = clampMapPoint(unclampedPosition, params.bounds);

  return {
    arrived: false,
    state: {
      position: nextPosition,
      velocity: nextVelocity,
    },
  };
}

export function sampleTerrainHeight(x: number, y: number): number {
  const localX = x - WORLD_MAP_TERRAIN.originX;
  const localY = y - WORLD_MAP_TERRAIN.originY;
  return (
    Math.sin(localX * 0.01) * 7 +
    Math.cos(localY * 0.013) * 8 +
    Math.sin((localX + localY) * 0.02) * 4
  );
}
