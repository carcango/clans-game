import * as THREE from 'three';
import { UnitData } from '../types/game';

export class MinimapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(player: THREE.Group, allies: THREE.Group[], enemies: THREE.Group[]) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const sc = 1.2;

    ctx.fillStyle = 'rgba(20,30,20,0.9)';
    ctx.fillRect(0, 0, w, h);

    // Player (white)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player facing direction
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx - Math.sin(player.rotation.y) * 8,
      cy - Math.cos(player.rotation.y) * 8
    );
    ctx.stroke();

    // Allies (blue)
    allies.forEach((a) => {
      const data = a.userData as UnitData;
      if (data.health <= 0) return;
      const ex = cx + (a.position.x - player.position.x) * sc;
      const ey = cy + (a.position.z - player.position.z) * sc;
      if (ex > 5 && ex < w - 5 && ey > 5 && ey < h - 5) {
        ctx.fillStyle = '#4a9aff';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Enemies (red)
    enemies.forEach((e) => {
      const data = e.userData as UnitData;
      if (data.health <= 0) return;
      const ex = cx + (e.position.x - player.position.x) * sc;
      const ey = cy + (e.position.z - player.position.z) * sc;
      if (ex > 5 && ex < w - 5 && ey > 5 && ey < h - 5) {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Border
    ctx.strokeStyle = '#5a4a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}
