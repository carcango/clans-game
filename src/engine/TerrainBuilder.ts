import * as THREE from 'three';

const matBrown = () => new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
const matWood = () => new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });

function createTree(scene: THREE.Scene, x: number, z: number) {
  const tree = new THREE.Group();
  const h = 3 + Math.random() * 3;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, h, 6), matBrown());
  trunk.position.y = h / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  for (let j = 0; j < 2 + Math.floor(Math.random() * 2); j++) {
    const fol = new THREE.Mesh(
      new THREE.SphereGeometry(1.5 + Math.random() * 1.5, 8, 6),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(
          0.28 + Math.random() * 0.08,
          0.4 + Math.random() * 0.2,
          0.25 + Math.random() * 0.15
        ),
        roughness: 0.9,
      })
    );
    fol.position.set((Math.random() - 0.5) * 1.5, h + j * 1.2, (Math.random() - 0.5) * 1.5);
    fol.castShadow = true;
    tree.add(fol);
  }
  tree.position.set(x, 0, z);
  scene.add(tree);
}

function createBanner(scene: THREE.Scene, x: number, z: number, color: number) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 6), matWood());
  pole.position.y = 3;
  g.add(pole);
  const b = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2, 4, 6),
    new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.8 })
  );
  b.position.set(0.75, 5, 0);
  b.castShadow = true;
  g.add(b);
  g.position.set(x, 0, z);
  scene.add(g);
}

export function buildTerrain(scene: THREE.Scene) {
  // Ground plane
  const geo = new THREE.PlaneGeometry(300, 300, 80, 80);
  const v = geo.attributes.position.array as Float32Array;
  for (let i = 0; i < v.length; i += 3) v[i + 2] += (Math.random() - 0.5) * 0.8;
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.95 })
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Dirt patches
  for (let i = 0; i < 15; i++) {
    const p = new THREE.Mesh(
      new THREE.CircleGeometry(3 + Math.random() * 5, 16),
      new THREE.MeshStandardMaterial({ color: 0x5a4a2a, roughness: 1 })
    );
    p.rotation.x = -Math.PI / 2;
    p.position.set((Math.random() - 0.5) * 100, 0.02, (Math.random() - 0.5) * 100);
    scene.add(p);
  }

  // Trees
  for (let i = 0; i < 40; i++) {
    const tx = (Math.random() - 0.5) * 250;
    const tz = (Math.random() - 0.5) * 250;
    if (Math.abs(tx) < 35 && Math.abs(tz) < 35) continue;
    createTree(scene, tx, tz);
  }

  // Rocks
  for (let i = 0; i < 20; i++) {
    const r = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.5 + Math.random() * 1.5, 1),
      new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.9 })
    );
    r.position.set((Math.random() - 0.5) * 120, 0.3, (Math.random() - 0.5) * 120);
    r.rotation.set(Math.random(), Math.random(), Math.random());
    r.castShadow = true;
    scene.add(r);
  }

  // Banners
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = 40;
    createBanner(
      scene,
      Math.cos(angle) * dist,
      Math.sin(angle) * dist,
      i % 2 === 0 ? 0x8b1a1a : 0x1a3a6b
    );
  }
}
