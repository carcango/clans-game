import * as THREE from 'three';

interface DamageNumber {
  sprite: THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
}

export class DamageNumberSystem {
  private scene: THREE.Scene;
  private numbers: DamageNumber[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(position: THREE.Vector3, damage: number, isCrit = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.font = `bold ${isCrit ? 48 : 36}px Cinzel, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(`${damage}`, 64, 32);

    // Fill
    ctx.fillStyle = isCrit ? '#ffd700' : '#ff4444';
    ctx.fillText(`${damage}`, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(
      position.x + (Math.random() - 0.5) * 1.0,
      position.y + 3.5 + Math.random() * 0.5,
      position.z + (Math.random() - 0.5) * 1.0
    );
    sprite.scale.set(isCrit ? 2.0 : 1.5, isCrit ? 1.0 : 0.75, 1);
    this.scene.add(sprite);

    this.numbers.push({
      sprite,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        3 + Math.random() * 2,
        (Math.random() - 0.5) * 2
      ),
      life: 1.0,
    });
  }

  update(dt: number) {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.velocity.y -= 5 * dt;
      n.sprite.position.add(n.velocity.clone().multiplyScalar(dt));
      n.life -= dt;

      // Fade out
      (n.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, n.life);

      if (n.life <= 0) {
        this.scene.remove(n.sprite);
        (n.sprite.material as THREE.SpriteMaterial).map?.dispose();
        (n.sprite.material as THREE.SpriteMaterial).dispose();
        n.sprite.geometry.dispose();
        this.numbers.splice(i, 1);
      }
    }
  }

  dispose() {
    for (const n of this.numbers) {
      this.scene.remove(n.sprite);
      (n.sprite.material as THREE.SpriteMaterial).map?.dispose();
      (n.sprite.material as THREE.SpriteMaterial).dispose();
      n.sprite.geometry.dispose();
    }
    this.numbers = [];
  }
}
