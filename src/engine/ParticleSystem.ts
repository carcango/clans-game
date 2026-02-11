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

  createHolyAuraEffect(pos: THREE.Vector3, radius: number) {
    const goldColors = [0xffd700, 0xffec80, 0xffaa00, 0xffe066];
    const whiteColors = [0xffffff, 0xfff8dc, 0xfffacd];

    // Expanding holy ring — golden particles rushing outward along the ground
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const color = goldColors[i % goldColors.length];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.05, 0.1),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(pos.x, pos.y + 0.15, pos.z);
      this.scene.add(mesh);
      const speed = radius * 0.7 + Math.random() * 2;
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          0.3 + Math.random() * 0.5,
          Math.sin(angle) * speed
        ),
        life: 0.9 + Math.random() * 0.3,
      });
    }

    // Central radiant pillar — bright white/gold column shooting upward
    for (let i = 0; i < 14; i++) {
      const color = whiteColors[Math.floor(Math.random() * whiteColors.length)];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.4, 0.12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
      );
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.8,
        pos.y + 0.3 + i * 0.12,
        pos.z + (Math.random() - 0.5) * 0.8
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          10 + Math.random() * 6,
          (Math.random() - 0.5) * 0.4
        ),
        life: 0.5 + Math.random() * 0.3,
      });
    }

    // Floating golden orbs — slow-moving glowing spheres drifting outward and up
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.4;
      const color = goldColors[Math.floor(Math.random() * goldColors.length)];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.1 + Math.random() * 0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * dist,
        pos.y + 0.5 + Math.random() * 2,
        pos.z + Math.sin(angle) * dist
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (1 + Math.random()),
          2 + Math.random() * 3,
          Math.sin(angle) * (1 + Math.random())
        ),
        life: 1.0 + Math.random() * 0.5,
      });
    }

    // Central flash dome — large bright sphere that pops
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.25, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.5 })
    );
    flash.position.set(pos.x, pos.y + 1.5, pos.z);
    this.scene.add(flash);
    this.particles.push({
      mesh: flash,
      velocity: new THREE.Vector3(0, 0.5, 0),
      life: 0.5,
    });
  }

  createHolyHealEffect(pos: THREE.Vector3) {
    // Per-unit heal: golden sparkles rising upward
    const colors = [0xffd700, 0xffec80, 0xffffff, 0xffe066];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const color = colors[i % colors.length];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.08, 0.06),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * 0.5,
        pos.y + 0.3,
        pos.z + Math.sin(angle) * 0.5
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * 0.8,
          3 + Math.random() * 2,
          Math.sin(angle) * 0.8
        ),
        life: 0.8 + Math.random() * 0.4,
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

  createBackstabActivateEffect(pos: THREE.Vector3) {
    const shadowColors = [0x220033, 0x330044, 0x110022, 0x1a0033];
    const purpleColors = [0x8844cc, 0x6633aa, 0xaa55ee, 0x9944dd];

    // Shadow vortex — dark particles spiraling inward toward the rogue
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = 3 + Math.random() * 2;
      const color = shadowColors[Math.floor(Math.random() * shadowColors.length)];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * dist,
        pos.y + 0.5 + Math.random() * 2,
        pos.z + Math.sin(angle) * dist
      );
      this.scene.add(mesh);
      // Particles move inward + upward with spiral
      const inward = new THREE.Vector3(
        -Math.cos(angle) * 4 + Math.sin(angle) * 2,
        2 + Math.random() * 2,
        -Math.sin(angle) * 4 - Math.cos(angle) * 2
      );
      this.particles.push({ mesh, velocity: inward, life: 0.6 + Math.random() * 0.3 });
    }

    // Purple energy wisps — bright accents rising from feet
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const color = purpleColors[Math.floor(Math.random() * purpleColors.length)];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 6, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * 0.8,
        pos.y + 0.2,
        pos.z + Math.sin(angle) * 0.8
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          4 + Math.random() * 4,
          (Math.random() - 0.5) * 1.5
        ),
        life: 0.7 + Math.random() * 0.4,
      });
    }

    // Dark flash — shadowy sphere that pops around the rogue
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x330044, transparent: true, opacity: 0.5 })
    );
    flash.position.set(pos.x, pos.y + 1.5, pos.z);
    this.scene.add(flash);
    this.particles.push({ mesh: flash, velocity: new THREE.Vector3(0, 0.5, 0), life: 0.4 });
  }

  createBackstabHitEffect(pos: THREE.Vector3) {
    const slashColors = [0xcc44ff, 0xaa22dd, 0xff55ff, 0xdd33ee];

    // Cross slash — two perpendicular lines of particles forming an X
    for (let axis = 0; axis < 2; axis++) {
      for (let i = 0; i < 8; i++) {
        const t = (i / 7 - 0.5) * 2;
        const color = slashColors[Math.floor(Math.random() * slashColors.length)];
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.18, 0.05),
          new THREE.MeshBasicMaterial({ color })
        );
        if (axis === 0) {
          mesh.position.set(pos.x + t * 1.5, pos.y + Math.abs(t) * 0.3, pos.z);
        } else {
          mesh.position.set(pos.x, pos.y + Math.abs(t) * 0.3, pos.z + t * 1.5);
        }
        this.scene.add(mesh);
        const outward = axis === 0
          ? new THREE.Vector3(t * 4, 2 + Math.random() * 2, (Math.random() - 0.5) * 2)
          : new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random() * 2, t * 4);
        this.particles.push({ mesh, velocity: outward, life: 0.3 + Math.random() * 0.2 });
      }
    }

    // Dark burst — shadow shards exploding outward from impact
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 5;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x220033 })
      );
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          2 + Math.random() * 3,
          Math.sin(angle) * speed
        ),
        life: 0.4 + Math.random() * 0.3,
      });
    }

    // Purple flash — bright sphere at the stab point
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.7 })
    );
    flash.position.copy(pos);
    this.scene.add(flash);
    this.particles.push({ mesh: flash, velocity: new THREE.Vector3(0, 1, 0), life: 0.3 });
  }

  createArrowVolleyLaunch(pos: THREE.Vector3, direction: THREE.Vector3) {
    const dir = direction.clone().normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);

    // Bow string snap — bright yellow sparks in a line perpendicular to fire direction
    for (let i = 0; i < 12; i++) {
      const t = (Math.random() - 0.5) * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.04),
        new THREE.MeshBasicMaterial({ color: 0xffdd44 })
      );
      mesh.position.set(
        pos.x + perp.x * t * 1.5,
        pos.y + 2.0 + (Math.random() - 0.5) * 0.5,
        pos.z + perp.z * t * 1.5
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          perp.x * t * 3 + dir.x * 2,
          2 + Math.random() * 3,
          perp.z * t * 3 + dir.z * 2
        ),
        life: 0.3 + Math.random() * 0.2,
      });
    }

    // Wind gust — tan/white wisps rushing forward in the fire direction
    for (let i = 0; i < 10; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const launchDir = dir.clone().add(perp.clone().multiplyScalar(spread)).normalize();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.03, 0.15),
        new THREE.MeshBasicMaterial({ color: 0xddc89e, transparent: true, opacity: 0.4 })
      );
      mesh.position.set(
        pos.x + dir.x * 1.5,
        pos.y + 1.8 + Math.random() * 0.8,
        pos.z + dir.z * 1.5
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          launchDir.x * (10 + Math.random() * 5),
          0.5 + Math.random(),
          launchDir.z * (10 + Math.random() * 5)
        ),
        life: 0.25 + Math.random() * 0.15,
      });
    }

    // Ground dust kick — dirt puffs from the archer's stance
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.04, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x887755, transparent: true, opacity: 0.4 })
      );
      mesh.position.set(pos.x, pos.y + 0.1, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (2 + Math.random() * 2),
          0.3 + Math.random() * 0.5,
          Math.sin(angle) * (2 + Math.random() * 2)
        ),
        life: 0.4 + Math.random() * 0.2,
      });
    }
  }

  createFireballExplosion(pos: THREE.Vector3, radius: number) {
    // Central flash sphere — big bright burst that scales down
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.4, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 })
    );
    flash.position.copy(pos);
    flash.position.y += 1.0;
    this.scene.add(flash);
    this.particles.push({
      mesh: flash,
      velocity: new THREE.Vector3(0, 0.5, 0),
      life: 0.5,
    });

    // Fire chunks — large orange/red pieces flying outward
    const fireColors = [0xff4400, 0xff6600, 0xff2200, 0xffaa00, 0xcc2200];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI * 0.6;
      const speed = 4 + Math.random() * 8;
      const color = fireColors[Math.floor(Math.random() * fireColors.length)];
      const size = 0.1 + Math.random() * 0.15;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.copy(pos);
      mesh.position.y += 1.0 + Math.random();
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed + 2,
          Math.sin(angle) * Math.cos(elevation) * speed
        ),
        life: 0.6 + Math.random() * 0.5,
      });
    }

    // Smoke puffs — dark particles that rise slowly
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.3;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 + Math.random() * 0.2, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.5 })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * dist,
        pos.y + 1.5 + Math.random(),
        pos.z + Math.sin(angle) * dist
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          2 + Math.random() * 2,
          (Math.random() - 0.5) * 2
        ),
        life: 0.8 + Math.random() * 0.6,
      });
    }

    // Ground ring — embers spreading outward along the floor
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xff6600 })
      );
      mesh.position.set(pos.x, pos.y + 0.2, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (radius * 0.8 + Math.random() * 3),
          0.5 + Math.random(),
          Math.sin(angle) * (radius * 0.8 + Math.random() * 3)
        ),
        life: 0.5 + Math.random() * 0.3,
      });
    }
  }

  createNecromancyEffect(pos: THREE.Vector3) {
    const necroColors = [0x44dd88, 0x22aa66, 0x66ffaa, 0x11884f, 0x88ffcc];
    const darkColors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x111133];

    // Ground summoning circle — flat ring of dark particles expanding outward
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.03, 0.12),
        new THREE.MeshBasicMaterial({ color: necroColors[i % necroColors.length] })
      );
      mesh.position.set(pos.x, pos.y + 0.1, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * 5,
          0.2,
          Math.sin(angle) * 5
        ),
        life: 0.8 + Math.random() * 0.3,
      });
    }

    // Soul wisps — spiraling green orbs rising from the ground
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const spiralSpeed = 3 + Math.random() * 2;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 6, 6),
        new THREE.MeshBasicMaterial({
          color: necroColors[Math.floor(Math.random() * necroColors.length)],
          transparent: true,
          opacity: 0.7,
        })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * (1 + Math.random()),
        pos.y + 0.2,
        pos.z + Math.sin(angle) * (1 + Math.random())
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle + Math.PI * 0.5) * spiralSpeed,
          5 + Math.random() * 4,
          Math.sin(angle + Math.PI * 0.5) * spiralSpeed
        ),
        life: 0.9 + Math.random() * 0.6,
      });
    }

    // Dark energy burst — dark purple/blue chunks exploding upward
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const color = darkColors[Math.floor(Math.random() * darkColors.length)];
      const size = 0.08 + Math.random() * 0.1;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size * 2, size),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(pos.x, pos.y + 0.5 + Math.random() * 0.5, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (2 + Math.random() * 3),
          3 + Math.random() * 5,
          Math.sin(angle) * (2 + Math.random() * 3)
        ),
        life: 0.6 + Math.random() * 0.4,
      });
    }

    // Central green pillar — tall bright column shooting upward
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.3, 0.15),
        new THREE.MeshBasicMaterial({
          color: 0x44ff88,
          transparent: true,
          opacity: 0.8,
        })
      );
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.6,
        pos.y + 0.3 + i * 0.15,
        pos.z + (Math.random() - 0.5) * 0.6
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          8 + Math.random() * 6,
          (Math.random() - 0.5) * 0.5
        ),
        life: 0.5 + Math.random() * 0.4,
      });
    }

    // Skull-like flash — large central sphere that pops
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x33cc77, transparent: true, opacity: 0.6 })
    );
    flash.position.set(pos.x, pos.y + 1.5, pos.z);
    this.scene.add(flash);
    this.particles.push({
      mesh: flash,
      velocity: new THREE.Vector3(0, 1, 0),
      life: 0.4,
    });
  }

  createShieldBashEffect(pos: THREE.Vector3, direction: THREE.Vector3) {
    const dir = direction.clone().normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const metalColors = [0xc0c0c0, 0xd4d4d4, 0xa8a8a8, 0xe8e8e8];
    const sparkColors = [0xffd700, 0xffec80, 0xffaa00, 0xffffff];

    // Forward shockwave cone — metal shards blasting forward in a fan
    for (let i = 0; i < 20; i++) {
      const spread = (Math.random() - 0.5) * 1.4;
      const launchDir = dir.clone().add(perp.clone().multiplyScalar(spread)).normalize();
      const speed = 8 + Math.random() * 6;
      const color = metalColors[Math.floor(Math.random() * metalColors.length)];
      const size = 0.08 + Math.random() * 0.1;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size * 0.5, size),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(pos.x + dir.x * 1.5, pos.y + 1.0 + Math.random() * 1.5, pos.z + dir.z * 1.5);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          launchDir.x * speed,
          1 + Math.random() * 2,
          launchDir.z * speed
        ),
        life: 0.4 + Math.random() * 0.3,
      });
    }

    // Impact sparks — bright gold/white sparks at the bash point
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const color = sparkColors[Math.floor(Math.random() * sparkColors.length)];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.05),
        new THREE.MeshBasicMaterial({ color })
      );
      const spawnOffset = dir.clone().multiplyScalar(2);
      mesh.position.set(
        pos.x + spawnOffset.x,
        pos.y + 1.5 + (Math.random() - 0.5),
        pos.z + spawnOffset.z
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (4 + Math.random() * 3),
          2 + Math.random() * 4,
          Math.sin(angle) * (4 + Math.random() * 3)
        ),
        life: 0.3 + Math.random() * 0.3,
      });
    }

    // Ground dust wave — flat particles spreading forward along the ground
    for (let i = 0; i < 14; i++) {
      const spread = (Math.random() - 0.5) * 1.8;
      const launchDir = dir.clone().add(perp.clone().multiplyScalar(spread)).normalize();
      const speed = 5 + Math.random() * 4;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.04, 0.14),
        new THREE.MeshBasicMaterial({ color: 0x998866, transparent: true, opacity: 0.5 })
      );
      mesh.position.set(pos.x + dir.x, pos.y + 0.15, pos.z + dir.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          launchDir.x * speed,
          0.3 + Math.random() * 0.5,
          launchDir.z * speed
        ),
        life: 0.5 + Math.random() * 0.3,
      });
    }

    // Shield flash — bright burst at the shield position
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.7 })
    );
    flash.position.set(pos.x + dir.x * 1.5, pos.y + 1.5, pos.z + dir.z * 1.5);
    this.scene.add(flash);
    this.particles.push({
      mesh: flash,
      velocity: new THREE.Vector3(dir.x * 3, 0.5, dir.z * 3),
      life: 0.35,
    });
  }

  createLeapSlamEffect(pos: THREE.Vector3, radius: number) {
    // Ground shockwave ring
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.05, 0.14),
        new THREE.MeshBasicMaterial({ color: 0x886644 })
      );
      mesh.position.set(pos.x, pos.y + 0.15, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (radius * 0.8 + Math.random() * 3),
          0.5 + Math.random(),
          Math.sin(angle) * (radius * 0.8 + Math.random() * 3)
        ),
        life: 0.6 + Math.random() * 0.3,
      });
    }

    // Dust cloud
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x998866, transparent: true, opacity: 0.5 })
      );
      mesh.position.set(pos.x, pos.y + 0.3, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (2 + Math.random() * 3),
          1 + Math.random() * 2,
          Math.sin(angle) * (2 + Math.random() * 3)
        ),
        life: 0.7 + Math.random() * 0.4,
      });
    }

    // Central impact flash
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.3, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.6 })
    );
    flash.position.set(pos.x, pos.y + 0.5, pos.z);
    this.scene.add(flash);
    this.particles.push({ mesh: flash, velocity: new THREE.Vector3(0, 1, 0), life: 0.4 });
  }

  createDashTrailEffect(pos: THREE.Vector3, dir: THREE.Vector3) {
    const colors = [0xffd700, 0xffec80, 0xffffff];
    for (let i = 0; i < 6; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.03, 0.2),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
      );
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.8,
        pos.y + 0.5 + Math.random() * 2,
        pos.z + (Math.random() - 0.5) * 0.8
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          -dir.x * 3 + (Math.random() - 0.5),
          0.5 + Math.random(),
          -dir.z * 3 + (Math.random() - 0.5)
        ),
        life: 0.25 + Math.random() * 0.15,
      });
    }
  }

  createShadowStepEffect(pos: THREE.Vector3) {
    const colors = [0x220033, 0x330044, 0x8844cc, 0x6633aa];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
      );
      mesh.position.set(pos.x, pos.y + 1, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (2 + Math.random() * 2),
          2 + Math.random() * 3,
          Math.sin(angle) * (2 + Math.random() * 2)
        ),
        life: 0.5 + Math.random() * 0.3,
      });
    }
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x330044, transparent: true, opacity: 0.5 })
    );
    flash.position.set(pos.x, pos.y + 1.5, pos.z);
    this.scene.add(flash);
    this.particles.push({ mesh: flash, velocity: new THREE.Vector3(0, 0.5, 0), life: 0.35 });
  }

  createBlinkEffect(pos: THREE.Vector3) {
    const colors = [0x4488ff, 0x66aaff, 0xaaccff, 0xffffff];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(pos.x, pos.y + 1, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (3 + Math.random() * 2),
          2 + Math.random() * 3,
          Math.sin(angle) * (3 + Math.random() * 2)
        ),
        life: 0.4 + Math.random() * 0.3,
      });
    }
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.6 })
    );
    flash.position.set(pos.x, pos.y + 1.5, pos.z);
    this.scene.add(flash);
    this.particles.push({ mesh: flash, velocity: new THREE.Vector3(0, 0.5, 0), life: 0.4 });
  }

  createFrostNovaEffect(pos: THREE.Vector3, radius: number) {
    const iceColors = [0x88ccff, 0xaaddff, 0x66bbff, 0xffffff];
    // Expanding icy ring
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const color = iceColors[Math.floor(Math.random() * iceColors.length)];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.06, 0.12),
        new THREE.MeshBasicMaterial({ color })
      );
      mesh.position.set(pos.x, pos.y + 0.15, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (radius * 0.6 + Math.random() * 2),
          0.3 + Math.random() * 0.5,
          Math.sin(angle) * (radius * 0.6 + Math.random() * 2)
        ),
        life: 0.6 + Math.random() * 0.3,
      });
    }
    // Frost shards rising
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.3;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.2, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.8 })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * dist,
        pos.y + 0.3,
        pos.z + Math.sin(angle) * dist
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          4 + Math.random() * 3,
          (Math.random() - 0.5) * 2
        ),
        life: 0.5 + Math.random() * 0.3,
      });
    }
  }

  createSoulDrainEffect(pos: THREE.Vector3, radius: number) {
    const greenColors = [0x44dd88, 0x22aa66, 0x66ffaa, 0x88ffcc];
    // Green tendrils reaching outward
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const color = greenColors[Math.floor(Math.random() * greenColors.length)];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
      );
      mesh.position.set(pos.x, pos.y + 1, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (radius * 0.5 + Math.random() * 2),
          1 + Math.random() * 2,
          Math.sin(angle) * (radius * 0.5 + Math.random() * 2)
        ),
        life: 0.7 + Math.random() * 0.4,
      });
    }
    // Heal particles returning to center
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = radius * 0.4 + Math.random() * 2;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.8 })
      );
      mesh.position.set(
        pos.x + Math.cos(angle) * dist,
        pos.y + 1 + Math.random(),
        pos.z + Math.sin(angle) * dist
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          -Math.cos(angle) * 4,
          2 + Math.random() * 2,
          -Math.sin(angle) * 4
        ),
        life: 0.6 + Math.random() * 0.3,
      });
    }
  }

  createDodgeRollDust(pos: THREE.Vector3, dir: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.04, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x887755, transparent: true, opacity: 0.4 })
      );
      mesh.position.set(pos.x, pos.y + 0.1, pos.z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          -dir.x * 2 + (Math.random() - 0.5) * 3,
          0.3 + Math.random() * 0.5,
          -dir.z * 2 + (Math.random() - 0.5) * 3
        ),
        life: 0.4 + Math.random() * 0.2,
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
