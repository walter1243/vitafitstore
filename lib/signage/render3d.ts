/* eslint-disable */
// Visualizador 3D por software (canvas 2D, sem WebGL): ordena triângulos por profundidade e sombreia por normal.
import type { SceneObject } from './engine';

// ------------------------------------------------------------------ render 3D (software, sem WebGL)

export interface Cam { yaw: number; pitch: number; dist: number; cx: number; cy: number; cz: number }

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function render3D(ctx: CanvasRenderingContext2D, W: number, H: number, objs: SceneObject[], cam: Cam, explode: number, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1f2937'); g.addColorStop(1, '#0b0f14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const ex = cam.cx + cam.dist * cp * Math.cos(cam.yaw), ey = cam.cy + cam.dist * cp * Math.sin(cam.yaw), ez = cam.cz + cam.dist * sp;
  let fx = cam.cx - ex, fy = cam.cy - ey, fz = cam.cz - ez;
  let l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l;
  let rx = fy, ry = -fx, rz = 0;
  l = Math.hypot(rx, ry, rz) || 1; rx /= l; ry /= l; rz /= l;
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
  const focal = Math.min(W, H) * 1.05;

  let lx = -fx + 0.5 * ux - 0.35 * rx, ly = -fy + 0.5 * uy - 0.35 * ry, lz = -fz + 0.5 * uz - 0.35 * rz;
  l = Math.hypot(lx, ly, lz); lx /= l; ly /= l; lz /= l;

  type T = { d: number; x0: number; y0: number; x1: number; y1: number; x2: number; y2: number; c: string };
  const tris: T[] = [];
  for (const o of objs) {
    const [cr, cg, cb] = hexRgb(o.color);
    const dz = o.kind === 'face' ? (o.id.startsWith('b') || o.id.startsWith('cb') ? -explode : explode) : o.kind === 'plate' ? (o.color === '#b0bec5' ? -explode : explode * 2) : 0;
    const p = o.mesh.pos, ix = o.mesh.idx;
    const n = p.length / 3;
    const sx = new Float32Array(n), sy = new Float32Array(n), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const X = p[i * 3] - ex, Y = p[i * 3 + 1] - ey, Z = p[i * 3 + 2] + dz - ez;
      const zc = X * fx + Y * fy + Z * fz;
      const xc = X * rx + Y * ry + Z * rz, yc = X * ux + Y * uy + Z * uz;
      const inv = focal / Math.max(zc, 1e-3);
      sx[i] = W / 2 + xc * inv; sy[i] = H / 2 - yc * inv; sz[i] = zc;
    }
    for (let t = 0; t < ix.length; t += 3) {
      const a = ix[t], b = ix[t + 1], c = ix[t + 2];
      const ax = p[a * 3], ay = p[a * 3 + 1], az = p[a * 3 + 2];
      const ux1 = p[b * 3] - ax, uy1 = p[b * 3 + 1] - ay, uz1 = p[b * 3 + 2] - az;
      const vx1 = p[c * 3] - ax, vy1 = p[c * 3 + 1] - ay, vz1 = p[c * 3 + 2] - az;
      let nx = uy1 * vz1 - uz1 * vy1, ny = uz1 * vx1 - ux1 * vz1, nz = ux1 * vy1 - uy1 * vx1;
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const toEye = (ex - ax) * nx + (ey - ay) * ny + (ez - (az + dz)) * nz;
      if (toEye <= 0) continue;
      const lam = Math.max(0, nx * lx + ny * ly + nz * lz);
      const k = 0.28 + 0.72 * lam;
      tris.push({
        d: (sz[a] + sz[b] + sz[c]) / 3, x0: sx[a], y0: sy[a], x1: sx[b], y1: sy[b], x2: sx[c], y2: sy[c],
        c: `rgb(${Math.round(cr * k)},${Math.round(cg * k)},${Math.round(cb * k)})`,
      });
    }
  }
  tris.sort((a, b) => b.d - a.d);
  ctx.lineWidth = 0.7; ctx.lineJoin = 'round';
  for (const t of tris) {
    ctx.beginPath(); ctx.moveTo(t.x0, t.y0); ctx.lineTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.closePath();
    ctx.fillStyle = t.c; ctx.strokeStyle = t.c; ctx.fill(); ctx.stroke();
  }
}

