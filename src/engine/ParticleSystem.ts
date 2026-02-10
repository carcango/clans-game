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
  ): { update: (dt: number) => boolean; mesh: THREE.Mesh } {
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
      mesh,
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

  createDeathExplosion(pos: THREE.Vector3, team: 'ally' | 'enemy' | 'player') {
    const teamColor = team === 'enemy' ? 0xaa2222 : team === 'ally' ? 0x2255aa : 0xcccccc;
    const colors = [teamColor, 0x555555, 0x888888, teamColor];
    for (let i = 0; i < 20; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(pos.x, pos.y + 1.5, pos.z);
      this.scene.add(mesh);
      const angle = (i / 20) * Math.PI * 2;
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (3 + Math.random() * 3),
          Math.random() * 4 + 2,
          Math.sin(angle) * (3 + Math.random() * 3)
        ),
        life: 0.8 + Math.random() * 0.4,
      });
    }
  }

  createSlashTrail(pos: THREE.Vector3, direction: THREE.Vector3, color: number) {
    const perp = new THREE.Vector3(-direction.z, 0, direction.x);
    for (let i = 0; i < 5; i++) {
      const t = (i / 4) - 0.5;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.15, 0.04),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(
        pos.x + perp.x * t * 2,
        pos.y + Math.abs(t) * 0.3,
        pos.z + perp.z * t * 2
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          direction.x * 2 + (Math.random() - 0.5),
          0.5 + Math.random(),
          direction.z * 2 + (Math.random() - 0.5)
        ),
        life: 0.3,
      });
    }
  }

  createTrailParticle(pos: THREE.Vector3, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.05),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
    );
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.2,
      pos.y + (Math.random() - 0.5) * 0.2,
      pos.z + (Math.random() - 0.5) * 0.2
    );
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(0, 0.3, 0),
      life: 0.4,
    });
  }

  createShieldBashEffect(pos: THREE.Vector3) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.06, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xffd700 })
      );
      mesh.position.set(pos.x, pos.y + 1.0, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * 6,
          0.5,
          Math.sin(angle) * 6
        ),
        life: 0.6,
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
