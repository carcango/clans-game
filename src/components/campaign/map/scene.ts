import * as THREE from 'three';
import { CampaignLocation, CampaignParty } from '../../../types/campaign';
import { getStackTroopCount } from '../../../campaign/rules';
import { MapPoint } from './types';
import {
  createFlagModel,
  createLocationModel,
  createMapDecorations,
  createTerrainMesh,
  updateTextSprite,
} from './meshes';
import { sampleTerrainHeight } from './math';

export interface WorldMapSceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  terrain: THREE.Mesh;
  locationMeshes: Map<string, THREE.Group>;
  enemyMeshes: Map<string, THREE.Group>;
  enemyLabels: Map<string, THREE.Sprite>;
  playerMesh: THREE.Group;
  playerLabel: THREE.Sprite | null;
  targetMarker: THREE.Mesh;
  decorationsRoot: THREE.Group;
  skyDome: THREE.Mesh;
  sunOrb: THREE.Mesh;
  container: HTMLDivElement;
}

function createSkyDome() {
  const skyGeometry = new THREE.SphereGeometry(2300, 48, 24);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color('#7ac2e5') },
      horizonColor: { value: new THREE.Color('#f6c88b') },
      bottomColor: { value: new THREE.Color('#e79e64') },
      offset: { value: 60 },
      exponent: { value: 0.8 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float upper = pow(max(h, 0.0), exponent);
        float lower = pow(max(1.0 - h, 0.0), exponent);
        vec3 topMix = mix(horizonColor, topColor, upper);
        vec3 color = mix(bottomColor, topMix, 1.0 - lower * 0.6);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthWrite: false,
  });

  const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);

  const sunOrb = new THREE.Mesh(
    new THREE.SphereGeometry(38, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffdf9e, transparent: true, opacity: 0.72 })
  );
  sunOrb.position.set(1020, 620, -280);

  return { skyDome, sunOrb };
}

function sampleFootprintMaxHeight(x: number, y: number, radius: number) {
  let maxHeight = sampleTerrainHeight(x, y);
  const samples = 10;

  for (let i = 0; i < samples; i += 1) {
    const angle = (i / samples) * Math.PI * 2;
    const sx = x + Math.cos(angle) * radius;
    const sy = y + Math.sin(angle) * radius;
    const h = sampleTerrainHeight(sx, sy);
    if (h > maxHeight) {
      maxHeight = h;
    }
  }

  return maxHeight;
}

function setMapPosition(object: THREE.Object3D, x: number, y: number, footprintRadius: number, lift = 0) {
  const groundedY = sampleFootprintMaxHeight(x, y, footprintRadius) + lift;
  object.position.set(x, groundedY, y);
}

function removeObject(root: THREE.Object3D, object: THREE.Object3D) {
  root.remove(object);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;

    const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
    if (geometry) {
      geometries.add(geometry);
    }

    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) {
      for (const item of material) {
        materials.add(item);
      }
    } else if (material) {
      materials.add(material);
    }
  });

  for (const material of materials) {
    const spriteMaterial = material as THREE.SpriteMaterial;
    spriteMaterial.map?.dispose();
    material.dispose();
  }

  for (const geometry of geometries) {
    geometry.dispose();
  }
}

function rebuildDecorations(state: WorldMapSceneState, locations: CampaignLocation[]) {
  if (state.decorationsRoot) {
    removeObject(state.scene, state.decorationsRoot);
  }

  state.decorationsRoot = createMapDecorations(locations);
  state.scene.add(state.decorationsRoot);
}

export function createWorldMapScene(
  container: HTMLDivElement,
  playerParty: CampaignParty,
  locations: CampaignLocation[],
  enemyParties: CampaignParty[]
): WorldMapSceneState {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#8bc5e3');
  scene.fog = new THREE.Fog('#ebbc86', 310, 1240);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 1, 2400);
  camera.position.set(600, 380, 650);
  camera.lookAt(600, 0, 400);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.pointerEvents = 'auto';
  renderer.domElement.style.touchAction = 'none';
  renderer.domElement.style.display = 'block';
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  container.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xfff5dc, 0x3b4b3d, 0.62);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xfff1d6, 0.24);
  scene.add(ambientLight);

  const sunlight = new THREE.DirectionalLight(0xffe0b0, 1.08);
  sunlight.position.set(180, 520, 220);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 1500;
  sunlight.shadow.camera.left = -700;
  sunlight.shadow.camera.right = 700;
  sunlight.shadow.camera.top = 700;
  sunlight.shadow.camera.bottom = -700;
  scene.add(sunlight);

  const bounceLight = new THREE.DirectionalLight(0x8dc6ff, 0.18);
  bounceLight.position.set(-320, 260, -160);
  scene.add(bounceLight);

  const { skyDome, sunOrb } = createSkyDome();
  scene.add(skyDome);
  scene.add(sunOrb);

  const terrain = createTerrainMesh();
  scene.add(terrain);

  const playerMesh = createFlagModel('#206db5', getStackTroopCount(playerParty.stacks), false, false);
  playerMesh.userData.troopCount = getStackTroopCount(playerParty.stacks);
  setMapPosition(playerMesh, playerParty.x, playerParty.y, 3.2, 0.2);
  scene.add(playerMesh);

  const playerLabel = (playerMesh.userData.countLabel as THREE.Sprite | undefined) ?? null;

  const targetMarker = new THREE.Mesh(
    new THREE.RingGeometry(8.4, 10.9, 48),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x8a4b0d,
      emissiveIntensity: 0.75,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
      roughness: 0.45,
      metalness: 0.15,
    })
  );
  targetMarker.rotation.x = -Math.PI / 2;
  targetMarker.visible = false;
  scene.add(targetMarker);

  const state: WorldMapSceneState = {
    scene,
    camera,
    renderer,
    terrain,
    locationMeshes: new Map(),
    enemyMeshes: new Map(),
    enemyLabels: new Map(),
    playerMesh,
    playerLabel,
    targetMarker,
    decorationsRoot: new THREE.Group(),
    skyDome,
    sunOrb,
    container,
  };

  rebuildDecorations(state, locations);
  syncLocationMeshes(state, locations);
  syncEnemyMeshes(state, enemyParties);

  return state;
}

export function syncLocationMeshes(state: WorldMapSceneState, locations: CampaignLocation[]) {
  const nextIds = new Set(locations.map((location) => location.id));

  for (const [id, mesh] of state.locationMeshes) {
    if (!nextIds.has(id)) {
      removeObject(state.scene, mesh);
      state.locationMeshes.delete(id);
    }
  }

  let requiresDecorationRebuild = false;

  for (const location of locations) {
    let mesh = state.locationMeshes.get(location.id);
    const signature = `${location.type}:${location.name}:${location.faction}`;

    if (mesh && mesh.userData.signature !== signature) {
      removeObject(state.scene, mesh);
      state.locationMeshes.delete(location.id);
      mesh = undefined;
      requiresDecorationRebuild = true;
    }

    if (!mesh) {
      mesh = createLocationModel(location);
      mesh.userData.signature = signature;
      state.scene.add(mesh);
      state.locationMeshes.set(location.id, mesh);
      requiresDecorationRebuild = true;
    }

    const footprint = location.type === 'village' ? 6 : 8;
    setMapPosition(mesh, location.x, location.y, footprint, 0.15);
  }

  if (requiresDecorationRebuild) {
    rebuildDecorations(state, locations);
  }
}

export function syncEnemyMeshes(state: WorldMapSceneState, enemyParties: CampaignParty[]) {
  const nextIds = new Set(enemyParties.map((party) => party.id));

  for (const [id, mesh] of state.enemyMeshes) {
    if (!nextIds.has(id)) {
      removeObject(state.scene, mesh);
      state.enemyMeshes.delete(id);
      state.enemyLabels.delete(id);
    }
  }

  for (const party of enemyParties) {
    const unitCount = getStackTroopCount(party.stacks);
    const isBandit = party.faction === 'bandit';
    const isLord = party.faction !== 'bandit' && party.faction !== 'player';
    const signature = `${party.faction}:${party.color}:${isBandit}:${isLord}`;

    let mesh = state.enemyMeshes.get(party.id);
    if (mesh && mesh.userData.signature !== signature) {
      removeObject(state.scene, mesh);
      state.enemyMeshes.delete(party.id);
      state.enemyLabels.delete(party.id);
      mesh = undefined;
    }

    if (!mesh) {
      mesh = createFlagModel(party.color, unitCount, isBandit, isLord);
      mesh.userData.signature = signature;
      mesh.userData.troopCount = unitCount;
      state.scene.add(mesh);
      state.enemyMeshes.set(party.id, mesh);

      const label = (mesh.userData.countLabel as THREE.Sprite | undefined) ?? null;
      if (label) {
        state.enemyLabels.set(party.id, label);
      }
    }

    setMapPosition(mesh, party.x, party.y, 3.2, 0.2);

    const label = state.enemyLabels.get(party.id);
    if (label && mesh.userData.troopCount !== unitCount) {
      updateTextSprite(label, String(unitCount), 50, '#f9fafb');
      mesh.userData.troopCount = unitCount;
    }
  }
}

export function updatePlayerMesh(state: WorldMapSceneState, position: MapPoint, troopCount: number) {
  setMapPosition(state.playerMesh, position.x, position.y, 3.2, 0.2);
  if (state.playerLabel && state.playerMesh.userData.troopCount !== troopCount) {
    updateTextSprite(state.playerLabel, String(troopCount), 50, '#f9fafb');
    state.playerMesh.userData.troopCount = troopCount;
  }
}

export function setTargetMarker(state: WorldMapSceneState, target: MapPoint | null) {
  if (!target) {
    state.targetMarker.visible = false;
    return;
  }

  state.targetMarker.position.set(target.x, sampleFootprintMaxHeight(target.x, target.y, 9) + 0.8, target.y);
  state.targetMarker.visible = true;
}

export function renderWorldMapScene(
  state: WorldMapSceneState,
  cameraTarget: MapPoint,
  cameraAngle: number,
  cameraDistance: number,
  elapsedMs: number,
  cameraYMultiplier: number
) {
  const cameraX = cameraTarget.x + Math.sin(cameraAngle) * cameraDistance;
  const cameraZ = cameraTarget.y + Math.cos(cameraAngle) * cameraDistance;
  const cameraY = cameraDistance * cameraYMultiplier;

  state.camera.position.set(cameraX, cameraY, cameraZ);
  state.camera.lookAt(cameraTarget.x, 0, cameraTarget.y);

  state.sunOrb.position.x = 980 + Math.sin(elapsedMs * 0.00012) * 40;
  state.sunOrb.position.y = 600 + Math.sin(elapsedMs * 0.0003) * 14;
  const sunMaterial = state.sunOrb.material as THREE.MeshBasicMaterial;
  sunMaterial.opacity = 0.66 + Math.sin(elapsedMs * 0.0012) * 0.06;

  if (state.targetMarker.visible) {
    const pulse = Math.sin(elapsedMs * 0.0035) * 0.5 + 0.5;
    const material = state.targetMarker.material as THREE.MeshStandardMaterial;
    material.opacity = 0.38 + pulse * 0.45;
    material.emissiveIntensity = 0.5 + pulse * 0.7;
  }

  state.renderer.render(state.scene, state.camera);
}

export function resizeWorldMapScene(state: WorldMapSceneState) {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

export function disposeWorldMapScene(state: WorldMapSceneState) {
  for (const mesh of state.locationMeshes.values()) {
    removeObject(state.scene, mesh);
  }
  for (const mesh of state.enemyMeshes.values()) {
    removeObject(state.scene, mesh);
  }

  removeObject(state.scene, state.playerMesh);
  removeObject(state.scene, state.targetMarker);
  removeObject(state.scene, state.terrain);
  removeObject(state.scene, state.decorationsRoot);
  removeObject(state.scene, state.skyDome);
  removeObject(state.scene, state.sunOrb);

  state.locationMeshes.clear();
  state.enemyMeshes.clear();
  state.enemyLabels.clear();

  state.renderer.dispose();
  if (state.container.contains(state.renderer.domElement)) {
    state.container.removeChild(state.renderer.domElement);
  }
}
