import { MapBounds, MapMovementParams, MapPickConfig } from '../components/campaign/map/types';

export const WORLD_MAP_BOUNDS: MapBounds = {
  minX: 50,
  maxX: 1150,
  minY: 50,
  maxY: 750,
};

export const WORLD_MAP_PICK_CONFIG: MapPickConfig = {
  locationRadiusByType: {
    town: 26,
    castle: 26,
    village: 22,
  },
  enemyRadius: 20,
};

export const WORLD_MAP_MOVEMENT: MapMovementParams = {
  maxSpeed: 93,
  acceleration: 0.085,
  deceleration: 0.12,
  slowdownDistance: 55,
  arrivalThreshold: 2,
  bounds: WORLD_MAP_BOUNDS,
};

export const WORLD_MAP_CAMERA = {
  baseYMultiplier: 0.55,
  rotationSpeed: 0.0045,
  minDistance: 200,
  maxDistance: 760,
  initialDistance: 380,
  wheelZoomFactor: 0.18,
};

export const WORLD_MAP_INPUT = {
  dragThresholdPx: 6,
  moveEmitIntervalMs: 100,
  moveEmitEpsilon: 0.35,
};

export const WORLD_MAP_TERRAIN = {
  width: 1200,
  height: 800,
  widthSegments: 90,
  heightSegments: 90,
  originX: 600,
  originY: 400,
};
