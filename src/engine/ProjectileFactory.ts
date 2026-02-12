import * as THREE from 'three';

/**
 * Creates a class-specific projectile mesh for ranged basic attacks.
 */
export function createProjectileMesh(classId: string): THREE.Object3D {
  switch (classId) {
    case 'archer': {
      const group = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, emissive: 0x443008, emissiveIntensity: 0.3 })
      );
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.2, 4),
        new THREE.MeshStandardMaterial({ color: 0xc0c0c0, emissive: 0x888888, emissiveIntensity: 0.5 })
      );
      tip.rotation.x = -Math.PI / 2;
      tip.position.z = -0.4;
      const fletch = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.02, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xe9c46a })
      );
      fletch.position.z = 0.3;
      group.add(shaft, tip, fletch);
      return group;
    }
    case 'mage': {
      return new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 1.5 })
      );
    }
    case 'necromancer': {
      return new THREE.Mesh(
        new THREE.OctahedronGeometry(0.15),
        new THREE.MeshStandardMaterial({ color: 0x2d6a4f, emissive: 0x52b788, emissiveIntensity: 1.5 })
      );
    }
    default: {
      return new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xcccccc })
      );
    }
  }
}

/** Trail color per class for projectile particles. */
export function getProjectileTrailColor(classId: string): number {
  switch (classId) {
    case 'archer': return 0xe9c46a;
    case 'mage': return 0xff4400;
    case 'necromancer': return 0x52b788;
    default: return 0xcccccc;
  }
}

/**
 * Disposes all geometry and materials on a projectile Object3D (mesh or group).
 */
export function disposeProjectile(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
