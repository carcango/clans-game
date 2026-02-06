import * as THREE from 'three';
import { ParticleData } from '../types/game';

export class ParticleSystem {
  private particles: ParticleData[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createBloodEffect(pos: THREE.Vector3) {
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xaa2222 })
      );
      mesh.position.copy(pos);
      mesh.position.y += 2.0;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 3
        ),
        life: 1.0,
      });
    }
  }

  createBlockSparks(pos: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xffcc44 })
      );
      mesh.position.set(pos.x, pos.y + 2.0, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 2 + 1,
          (Math.random() - 0.5) * 4
        ),
        life: 0.8,
      });
    }
  }

  createProjectile(
    start: THREE.Vector3,
    direction: THREE.Vector3,
    color: number,
    speed: number,
    onHit: (pos: THREE.Vector3) => void
  ): { update: (dt: number) => boolean } {
    const size = 0.12;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 6, 6),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.copy(start);
    mesh.position.y += 2.0;
    this.scene.add(mesh);

    const vel = direction.clone().normalize().multiplyScalar(speed);
    let life = 2.0;

    return {
      update: (dt: number): boolean => {
        mesh.position.add(vel.clone().multiplyScalar(dt));
        life -= dt;
        if (life <= 0 || mesh.position.y < 0) {
          this.scene.remove(mesh);
          return false;
        }
        return true;
      },
    };
  }

  createMagicEffect(pos: THREE.Vector3, color: number, radius: number) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * radius * 0.3,
        pos.y + 0.5,
        pos.z + Math.sin(angle) * radius * 0.3
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * 2,
          Math.random() * 3 + 1,
          Math.sin(angle) * 2
        ),
        life: 0.8,
      });
    }
  }

  createHealEffect(pos: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        new THREE.MeshBasicMaterial({ color: 0x44ff88 })
      );
      mesh.position.copy(pos);
      mesh.position.y += 0.5;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          Math.random() * 2 + 1.5,
          (Math.random() - 0.5) * 1.5
        ),
        life: 1.2,
      });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.velocity.y -= 15 * dt;
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
      p.mesh.scale.multiplyScalar(1 - dt * 2);
      p.life -= dt;
      if (p.life <= 0 || p.mesh.scale.x < 0.02) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  dispose() {
    this.particles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.particles = [];
  }
}
