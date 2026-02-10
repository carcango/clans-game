import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  clampMapPoint,
  intersectGroundPlane,
  pickMapTarget,
  screenToNdc,
  stepMovement,
} from '../math';
import { MapMovementParams, MovementState } from '../types';

const bounds = { minX: 50, maxX: 1150, minY: 50, maxY: 750 };

describe('map math', () => {
  it('clamps map point to bounds', () => {
    const clamped = clampMapPoint({ x: 5, y: 999 }, bounds);
    expect(clamped).toEqual({ x: 50, y: 750 });
  });

  it('converts screen point to normalized device coordinates', () => {
    const rect = { left: 0, top: 0, width: 200, height: 100 } as DOMRect;
    const ndc = screenToNdc(100, 50, rect);
    expect(ndc.x).toBeCloseTo(0);
    expect(ndc.y).toBeCloseTo(0);
  });

  it('intersects ground plane from centered camera ray', () => {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
    camera.position.set(600, 320, 700);
    camera.lookAt(600, 0, 400);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const point = intersectGroundPlane(camera, new THREE.Vector2(0, 0));
    expect(point).not.toBeNull();
    expect(point!.x).toBeCloseTo(600, 0);
    expect(point!.y).toBeCloseTo(400, 0);
  });

  it('returns null when camera ray is parallel to ground plane', () => {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
    camera.position.set(0, 20, 10);
    camera.lookAt(10, 30, 10);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const point = intersectGroundPlane(camera, new THREE.Vector2(0, 0));
    expect(point).toBeNull();
  });

  it('picks nearest location/enemy deterministically', () => {
    const target = pickMapTarget(
      { x: 304, y: 300 },
      [
        { id: 'town1', name: 'Town', type: 'town', faction: 'swadia', x: 300, y: 300 },
        { id: 'town2', name: 'Town2', type: 'town', faction: 'vaegirs', x: 500, y: 500 },
      ],
      [{ id: 'enemy1', name: 'Enemy', faction: 'bandit', x: 320, y: 300, stacks: [], isPlayer: false, color: '#8b0000' }],
      {
        locationRadiusByType: { town: 26, village: 22, castle: 26 },
        enemyRadius: 20,
      }
    );

    expect(target).toEqual({ kind: 'location', id: 'town1' });
  });

  it('returns move target when no entity is in range', () => {
    const target = pickMapTarget(
      { x: 600, y: 600 },
      [{ id: 'town1', name: 'Town', type: 'town', faction: 'swadia', x: 300, y: 300 }],
      [{ id: 'enemy1', name: 'Enemy', faction: 'bandit', x: 320, y: 300, stacks: [], isPlayer: false, color: '#8b0000' }],
      {
        locationRadiusByType: { town: 26, village: 22, castle: 26 },
        enemyRadius: 20,
      }
    );

    expect(target).toEqual({ kind: 'move', point: { x: 600, y: 600 } });
  });

  it('steps movement with acceleration and eventually arrives', () => {
    const params: MapMovementParams = {
      maxSpeed: 93,
      acceleration: 0.085,
      deceleration: 0.12,
      slowdownDistance: 55,
      arrivalThreshold: 2,
      bounds,
    };

    let movement: MovementState = {
      position: { x: 100, y: 100 },
      velocity: { x: 0, y: 0 },
    };

    const target = { x: 200, y: 100 };

    const firstStep = stepMovement(movement, target, 1 / 60, params);
    expect(firstStep.arrived).toBe(false);
    expect(firstStep.state.position.x).toBeGreaterThan(100);

    movement = firstStep.state;
    let arrived = false;

    for (let i = 0; i < 600; i += 1) {
      const step = stepMovement(movement, target, 1 / 60, params);
      movement = step.state;
      if (step.arrived) {
        arrived = true;
        break;
      }
    }

    expect(arrived).toBe(true);
    expect(movement.position.x).toBeCloseTo(200, 1);
    expect(movement.position.y).toBeCloseTo(100, 1);
    expect(movement.velocity.x).toBeCloseTo(0, 1);
    expect(movement.velocity.y).toBeCloseTo(0, 1);
  });
});
