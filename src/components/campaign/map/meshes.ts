import * as THREE from 'three';
import { CampaignLocation } from '../../../types/campaign';
import { WORLD_MAP_TERRAIN } from '../../../constants/worldMap';
import { sampleTerrainHeight } from './math';

function createTextTexture(text: string, fontSize: number, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    const fallback = document.createElement('canvas');
    return new THREE.CanvasTexture(fallback);
  }

  canvas.width = 320;
  canvas.height = 160;
  context.font = `700 ${fontSize}px Cinzel`;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.strokeStyle = '#20150d';
  context.lineWidth = 7;
  context.shadowColor = 'rgba(0,0,0,0.45)';
  context.shadowBlur = 10;
  context.strokeText(text, 160, 80);
  context.fillText(text, 160, 80);

  return new THREE.CanvasTexture(canvas);
}

export function createTextSprite(text: string, fontSize = 40, color = '#ffffff'): THREE.Sprite {
  const texture = createTextTexture(text, fontSize, color);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(24, 11, 1);
  return sprite;
}

export function updateTextSprite(sprite: THREE.Sprite, text: string, fontSize = 40, color = '#ffffff') {
  const material = sprite.material as THREE.SpriteMaterial;
  const previous = material.map;
  material.map = createTextTexture(text, fontSize, color);
  material.needsUpdate = true;
  previous?.dispose();
}

function deterministicNoise(seed: number): number {
  const value = Math.sin(seed * 12345.678 + 987.654) * 43758.5453;
  return value - Math.floor(value);
}

function factionAccentHex(faction: CampaignLocation['faction']): number {
  switch (faction) {
    case 'swadia':
      return 0xd97706;
    case 'rhodoks':
      return 0x15803d;
    case 'vaegirs':
      return 0x0f766e;
    case 'nords':
      return 0x2563eb;
    case 'khergit':
      return 0xb45309;
    default:
      return 0xa16207;
  }
}

function shouldSkipDecoration(x: number, y: number, locations: CampaignLocation[], margin: number) {
  for (const location of locations) {
    if (Math.hypot(location.x - x, location.y - y) < margin) {
      return true;
    }
  }
  return false;
}

export function createTerrainMesh(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(
    WORLD_MAP_TERRAIN.width,
    WORLD_MAP_TERRAIN.height,
    WORLD_MAP_TERRAIN.widthSegments,
    WORLD_MAP_TERRAIN.heightSegments
  );

  const vertices = geometry.attributes.position.array as Float32Array;
  const colors = new Float32Array((vertices.length / 3) * 3);

  const lowland = new THREE.Color('#4d6b3c');
  const grassland = new THREE.Color('#708f48');
  const upland = new THREE.Color('#8b7a4e');
  const ridge = new THREE.Color('#9b6f4a');
  const tempColor = new THREE.Color();

  for (let i = 0; i < vertices.length; i += 3) {
    const localX = vertices[i];
    const localY = vertices[i + 1];
    const worldX = localX + WORLD_MAP_TERRAIN.originX;
    const worldY = localY + WORLD_MAP_TERRAIN.originY;

    const height = sampleTerrainHeight(worldX, worldY);
    vertices[i + 2] = height;

    const elevation01 = THREE.MathUtils.clamp((height + 20) / 45, 0, 1);
    if (elevation01 < 0.35) {
      tempColor.lerpColors(lowland, grassland, elevation01 / 0.35);
    } else if (elevation01 < 0.75) {
      tempColor.lerpColors(grassland, upland, (elevation01 - 0.35) / 0.4);
    } else {
      tempColor.lerpColors(upland, ridge, (elevation01 - 0.75) / 0.25);
    }

    const noise = deterministicNoise(worldX * 0.014 + worldY * 0.018) * 0.14 - 0.07;
    tempColor.offsetHSL(noise * 0.2, noise * 0.4, noise);

    colors[i] = tempColor.r;
    colors[i + 1] = tempColor.g;
    colors[i + 2] = tempColor.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  const terrain = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.96,
      metalness: 0.02,
      emissive: new THREE.Color('#0b170d'),
      emissiveIntensity: 0.08,
    })
  );

  terrain.rotation.x = -Math.PI / 2;
  terrain.position.set(WORLD_MAP_TERRAIN.originX, 0, WORLD_MAP_TERRAIN.originY);
  terrain.receiveShadow = true;
  terrain.name = 'world-terrain';
  return terrain;
}

export function createFlagModel(color: string, unitCount: number, isBandit: boolean, isLord: boolean): THREE.Group {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.34, 13.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x3f2a16, roughness: 0.9, metalness: 0.15 })
  );
  pole.position.y = 6.7;
  group.add(pole);

  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 5.6, 4, 3),
    new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(color),
      emissiveIntensity: isBandit ? 0.22 : 0.11,
      roughness: 0.75,
      metalness: 0.05,
    })
  );
  banner.position.set(4.1, 9.5, 0);
  banner.rotation.y = Math.PI / 2;
  group.add(banner);

  const crest = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 18),
    new THREE.MeshStandardMaterial({
      color: isBandit ? 0x7f1d1d : 0xfef3c7,
      emissive: isBandit ? 0x3f1111 : 0x33210c,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
    })
  );
  crest.position.set(4.2, 9.5, 0);
  crest.rotation.y = Math.PI / 2;
  group.add(crest);

  if (isLord) {
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.14, 10, 32),
      new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0x6b4b00, emissiveIntensity: 0.25 })
    );
    trim.position.set(4.2, 9.5, 0);
    trim.rotation.y = Math.PI / 2;
    group.add(trim);
  }

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.45, 1.1, 12),
    new THREE.MeshStandardMaterial({
      color: isBandit ? 0x402022 : 0x1f2b33,
      roughness: 0.8,
      metalness: 0.2,
      emissive: isBandit ? 0x1d0909 : 0x060c12,
      emissiveIntensity: 0.25,
    })
  );
  base.position.y = 0.6;
  group.add(base);

  const countLabel = createTextSprite(String(unitCount), 50, '#f9fafb');
  countLabel.position.set(0, 15.5, 0);
  group.add(countLabel);

  group.userData.countLabel = countLabel;

  return group;
}

export function createLocationModel(location: CampaignLocation): THREE.Group {
  const group = new THREE.Group();
  const accent = factionAccentHex(location.faction);

  if (location.type === 'town') {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 6.1, 16.5, 10),
      new THREE.MeshStandardMaterial({ color: 0x8a8f95, roughness: 0.85, metalness: 0.12 })
    );
    tower.position.y = 8.2;
    group.add(tower);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(6.7, 6.2, 10),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.9, emissive: 0x2e0a0a, emissiveIntensity: 0.2 })
    );
    roof.position.y = 19.4;
    group.add(roof);

    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: accent, emissiveIntensity: 0.45 })
    );
    lantern.position.set(0, 12.5, 0);
    group.add(lantern);
  } else if (location.type === 'village') {
    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2;
      const hut = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 4.3, 3.8),
        new THREE.MeshStandardMaterial({ color: 0x8a5b34, roughness: 0.95 })
      );
      hut.position.set(Math.cos(angle) * 4.8, 2.15, Math.sin(angle) * 4.8);
      group.add(hut);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3.3, 2.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x4b2f1b, roughness: 0.95 })
      );
      roof.position.set(Math.cos(angle) * 4.8, 5.5, Math.sin(angle) * 4.8);
      group.add(roof);
    }

    const fire = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x78350f, emissiveIntensity: 0.7 })
    );
    fire.position.y = 1.2;
    group.add(fire);
  } else {
    const keep = new THREE.Mesh(
      new THREE.BoxGeometry(13.6, 10.4, 13.6),
      new THREE.MeshStandardMaterial({ color: 0x4f5b67, roughness: 0.85 })
    );
    keep.position.y = 5.2;
    group.add(keep);

    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 4.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x3b2a1b, roughness: 0.85 })
    );
    gate.position.set(0, 2.2, 7.2);
    group.add(gate);

    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: accent, emissiveIntensity: 0.5 })
    );
    beacon.position.y = 12;
    group.add(beacon);
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(location.type === 'village' ? 5.8 : 7.2, 0.45, 12, 48),
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.18, roughness: 0.7 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.45;
  group.add(ring);

  const nameLabel = createTextSprite(location.name, 32, '#fef3c7');
  nameLabel.position.set(0, location.type === 'village' ? 14 : 26, 0);
  group.add(nameLabel);

  return group;
}

function buildRoadNetwork(locations: CampaignLocation[]): Array<[CampaignLocation, CampaignLocation]> {
  const roads: Array<[CampaignLocation, CampaignLocation]> = [];
  const seen = new Set<string>();

  for (const source of locations) {
    const nearest = [...locations]
      .filter((entry) => entry.id !== source.id)
      .sort((a, b) => {
        const da = Math.hypot(a.x - source.x, a.y - source.y);
        const db = Math.hypot(b.x - source.x, b.y - source.y);
        return da - db;
      })
      .slice(0, 2);

    for (const target of nearest) {
      const key = [source.id, target.id].sort().join(':');
      if (!seen.has(key)) {
        seen.add(key);
        roads.push([source, target]);
      }
    }
  }

  return roads;
}

export function createMapDecorations(locations: CampaignLocation[]): THREE.Group {
  const root = new THREE.Group();

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_MAP_TERRAIN.width + 700, WORLD_MAP_TERRAIN.height + 700),
    new THREE.MeshStandardMaterial({
      color: 0x234f6d,
      emissive: 0x0a2233,
      emissiveIntensity: 0.42,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(WORLD_MAP_TERRAIN.originX, -7.8, WORLD_MAP_TERRAIN.originY);
  root.add(sea);

  const shoreline = new THREE.Mesh(
    new THREE.RingGeometry(660, 770, 80),
    new THREE.MeshStandardMaterial({
      color: 0xc4a365,
      emissive: 0x4f3d1f,
      emissiveIntensity: 0.22,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
  );
  shoreline.rotation.x = -Math.PI / 2;
  shoreline.position.set(WORLD_MAP_TERRAIN.originX, -0.65, WORLD_MAP_TERRAIN.originY);
  root.add(shoreline);

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x9d7f4a,
    roughness: 0.97,
    metalness: 0.03,
    emissive: 0x332713,
    emissiveIntensity: 0.08,
  });

  const roads = buildRoadNetwork(locations);
  for (const [start, end] of roads) {
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.max(6, Math.floor(distance / 26));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const wobble = Math.sin(t * Math.PI * 4 + start.x * 0.011 + end.y * 0.013) * 8;
      const nx = THREE.MathUtils.lerp(start.x, end.x, t) + Math.cos(t * Math.PI * 2) * wobble * 0.28;
      const ny = THREE.MathUtils.lerp(start.y, end.y, t) + Math.sin(t * Math.PI * 2) * wobble * 0.22;
      const roadStone = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.4, 0.35, 12), roadMaterial);
      roadStone.position.set(nx, sampleTerrainHeight(nx, ny) + 0.08, ny);
      roadStone.rotation.y = deterministicNoise(nx + ny) * Math.PI;
      root.add(roadStone);
    }
  }

  for (let i = 0; i < 90; i += 1) {
    const rx = 70 + deterministicNoise(i * 2.31) * 1060;
    const ry = 70 + deterministicNoise(i * 4.17) * 660;
    if (shouldSkipDecoration(rx, ry, locations, 42)) {
      continue;
    }

    const treeScale = 0.75 + deterministicNoise(i * 9.13) * 1.15;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5 * treeScale, 0.7 * treeScale, 4.2 * treeScale, 8),
      new THREE.MeshStandardMaterial({ color: 0x553620, roughness: 0.95 })
    );

    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(2.6 * treeScale, 5.4 * treeScale, 7),
      new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0x3d7a3c : 0x5a7f2c,
        roughness: 0.92,
        emissive: 0x0c1409,
        emissiveIntensity: 0.1,
      })
    );

    const y = sampleTerrainHeight(rx, ry);
    trunk.position.set(rx, y + 2.1 * treeScale, ry);
    crown.position.set(rx, y + 5.8 * treeScale, ry);

    root.add(trunk);
    root.add(crown);
  }

  for (let i = 0; i < 58; i += 1) {
    const rx = 80 + deterministicNoise(i * 5.72 + 33) * 1040;
    const ry = 80 + deterministicNoise(i * 8.19 + 72) * 640;
    if (shouldSkipDecoration(rx, ry, locations, 28)) {
      continue;
    }

    const rockScale = 0.65 + deterministicNoise(i * 3.31 + 19) * 1.25;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.9 * rockScale, 0),
      new THREE.MeshStandardMaterial({ color: 0x63666c, roughness: 0.88, metalness: 0.06 })
    );

    const y = sampleTerrainHeight(rx, ry);
    rock.position.set(rx, y + 0.8 * rockScale, ry);
    rock.rotation.set(
      deterministicNoise(rx * 0.3) * Math.PI,
      deterministicNoise(ry * 0.2) * Math.PI,
      deterministicNoise((rx + ry) * 0.1) * Math.PI
    );

    root.add(rock);
  }

  const borderMaterial = new THREE.MeshStandardMaterial({ color: 0x7b5b3f, roughness: 0.9, emissive: 0x20140c, emissiveIntensity: 0.2 });
  const borderSegments = [
    { x: WORLD_MAP_TERRAIN.originX, y: 18, z: 20, w: 1220, h: 36, d: 40 },
    { x: WORLD_MAP_TERRAIN.originX, y: 18, z: 780, w: 1220, h: 36, d: 40 },
    { x: 20, y: 18, z: WORLD_MAP_TERRAIN.originY, w: 40, h: 36, d: 840 },
    { x: 1180, y: 18, z: WORLD_MAP_TERRAIN.originY, w: 40, h: 36, d: 840 },
  ];

  for (const segment of borderSegments) {
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(segment.w, segment.h, segment.d), borderMaterial);
    cliff.position.set(segment.x, segment.y, segment.z);
    root.add(cliff);
  }

  return root;
}
