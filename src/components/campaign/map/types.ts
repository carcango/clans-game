import type { LocationType } from '../../../types/campaign';

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export type MapTarget =
  | { kind: 'move'; point: MapPoint }
  | { kind: 'location'; id: string }
  | { kind: 'enemy'; id: string };

export interface MovementState {
  position: MapPoint;
  velocity: { x: number; y: number };
}

export interface MapPickConfig {
  locationRadiusByType: Record<LocationType, number>;
  enemyRadius: number;
}

export interface MapMovementParams {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  slowdownDistance: number;
  arrivalThreshold: number;
  bounds: MapBounds;
}
