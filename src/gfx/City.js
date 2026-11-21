// مدينة فضائية خلف النافذة: سماء بسديم، كوكب بحلقة، ناطحات بطبقات وإضاءة نيون، كشّافات ومركبات طائرة
import Phaser from 'phaser';
import { paint, painted, rgba, uniqueKey } from './Painter.js';
import { shade } from '../ui/theme.js';

const NEONS = [0x29f0ff, 0xff3fa4, 0xb36bff, 0xffc94a];

function rnd(a, b) { return a + Math.random() * (b - a); }

function paintSky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#05021a');
  g.addColorStop(0.45, '#1a0a3e');
  g.addColorStop(0.8, '#4a1550');
  g.addColorStop(1, '#7a1f5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // سديم
  const neb = [[w * 0.25, h * 0.22, 0xb36bff], [w * 0.7, h * 0.35, 0xff3fa4], [w * 0.45, h * 0.12, 0x29f0ff]];
  neb.forEach(([x, y, c]) => {
    for (let i = 0; i < 5; i++) {
      const r = rnd(60, 160);
      const cx = x + rnd(-80, 80), cy = y + rnd(-40, 40);
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, rgba(c, 0.11)); rg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = rg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  });
  // نجوم
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * w, y = Math.random() * h * 0.7;
    const s = Math.random();
    ctx.fillStyle = `rgba(255,255,255,${0.2 + s * 0.7})`;
    ctx.fillRect(x, y, s > 0.92 ? 2 : 1, s > 0.92 ? 2 : 1);
    if (s > 0.97) { const rg = ctx.createRadialGradient(x, y, 0, x, y, 5); rg.addColorStop(0, 'rgba(255,255,255,0.5)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = rg; ctx.fillRect(x - 5, y - 5, 10, 10); }
  }
  // كوكب بحلقة
  const px = w * 0.76, py = h * 0.2, pr = Math.min(72, w * 0.14);
  const halo = ctx.createRadialGradient(px, py, pr * 0.8, px, py, pr * 2);
  halo.addColorStop(0, 'rgba(255,90,200,0.25)'); halo.addColorStop(1, 'rgba(255,90,200,0)');
  ctx.fillStyle = halo; ctx.fillRect(px - pr * 2, py - pr * 2, pr * 4, pr * 4);
  ctx.save();
  ctx.translate(px, py); ctx.rotate(-0.25);
  ctx.strokeStyle = 'rgba(255,190,240,0.35)'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.ellipse(0, 0, pr * 1.7, pr * 0.38, 0, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.restore();
  const pg = ctx.createRadialGradient(px - pr * 0.35, py - pr * 0.35, pr * 0.1, px, py, pr);
  pg.addColorStop(0, '#e7a4ff'); pg.addColorStop(0.45, '#9a45c8'); pg.addColorStop(1, '#3a1060');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.clip();
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) { ctx.fillRect(px - pr, py - pr * 0.6 + i * pr * 0.3, pr * 2, pr * 0.08); }
  ctx.globalAlpha = 1;
  const sh = ctx.createLinearGradient(px - pr, 0, px + pr, 0);
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(10,0,30,0.65)');
  ctx.fillStyle = sh; ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  ctx.restore();
  ctx.save();
  ctx.translate(px, py); ctx.rotate(-0.25);
  ctx.strokeStyle = 'rgba(255,200,245,0.75)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(0, 0, pr * 1.7, pr * 0.38, 0, 0, Math.PI); ctx.stroke();
  ctx.strokeStyle = 'rgba(41,240,255,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, pr * 1.9, pr * 0.45, 0, 0, Math.PI); ctx.stroke();
  ctx.restore();
}

function paintSkyline(ctx, w, h, layer) {
  const far = layer === 0;
  let bx = -20;
  while (bx < w + 20) {
    const bw = far ? rnd(22, 52) : rnd(40, 86);
    const bh = h * (far ? rnd(0.22, 0.5) : rnd(0.3, 0.72));
    const top = h - bh;
    const base = far ? 0x24145a : 0x140a30;
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, rgba(shade(base, far ? 0.12 : 0.2)));
    g.addColorStop(0.35, rgba(base));
    g.addColorStop(1, rgba(shade(base, -0.45)));
    ctx.fillStyle = g;
    ctx.beginPath();
    const roof = Math.floor(Math.random() * 4);
    ctx.moveTo(bx, h);
    ctx.lineTo(bx, top);
    if (roof === 1) { ctx.lineTo(bx + bw / 2, top - bw * 0.35); }
    if (roof === 2) { ctx.lineTo(bx + bw * 0.3, top); ctx.lineTo(bx + bw * 0.3, top - 18); ctx.lineTo(bx + bw * 0.7, top - 18); ctx.lineTo(bx + bw * 0.7, top); }
    ctx.lineTo(bx + bw, top);
    ctx.lineTo(bx + bw, h);
    ctx.closePath(); ctx.fill();
    if (roof === 3 && !far) {
      ctx.strokeStyle = '#3a3060'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + bw / 2, top); ctx.lineTo(bx + bw / 2, top - 36); ctx.stroke();
    }
    // نوافذ مضيئة
    const ws = far ? 7 : 10, wh = far ? 4 : 6;
    for (let y = top + 8; y < h - 6; y += far ? 9 : 13) {
      for (let x = bx + 5; x < bx + bw - 6; x += ws) {
        if (Math.random() < (far ? 0.28 : 0.24)) {
          const c = Math.random() < 0.7 ? 0xffe2a0 : NEONS[Math.floor(Math.random() * 4)];
          ctx.fillStyle = rgba(c, far ? 0.45 : 0.75);
          ctx.fillRect(x, y, far ? 3 : 5, wh);
          if (!far && Math.random() < 0.3) { ctx.fillStyle = rgba(c, 0.15); ctx.fillRect(x - 2, y - 2, 9, wh + 4); }
        }
      }
    }
    // شرائط نيون
    if (!far && Math.random() < 0.65) {
      const c = NEONS[Math.floor(Math.random() * 4)];
      const vx = bx + (Math.random() < 0.5 ? 3 : bw - 5);
      const lg = ctx.createLinearGradient(vx - 8, 0, vx + 10, 0);
      lg.addColorStop(0, rgba(c, 0)); lg.addColorStop(0.5, rgba(c, 0.35)); lg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = lg; ctx.fillRect(vx - 8, top + 6, 18, bh - 6);
      ctx.fillStyle = rgba(c, 0.95); ctx.fillRect(vx, top + 6, 2, bh - 6);
    }
    if (!far && Math.random() < 0.35) {
      const c = NEONS[Math.floor(Math.random() * 4)];
      const sy = top + bh * rnd(0.15, 0.4);
      ctx.fillStyle = rgba(c, 0.2); ctx.fillRect(bx + 4, sy - 6, bw - 8, 16);
      ctx.fillStyle = rgba(c, 0.9); ctx.fillRect(bx + 8, sy, bw - 16, 4);
    }
    bx += bw + (far ? 2 : rnd(2, 8));
  }
  // ضباب أسفل الطبقة
  const fog = ctx.createLinearGradient(0, h * 0.6, 0, h);
  fog.addColorStop(0, 'rgba(255,63,164,0)');
  fog.addColorStop(1, far ? 'rgba(255,63,164,0.25)' : 'rgba(120,30,110,0.45)');
  ctx.fillStyle = fog; ctx.fillRect(0, h * 0.6, w, h * 0.4);
}

export function drawCity(scene, x, y, w, h, opts = {}) {
  const c = scene.add.container(0, 0).setDepth(opts.depth ?? 0);
  const keys = [uniqueKey('sky'), uniqueKey('far'), uniqueKey('near')];
  const sky = paint(scene, keys[0], w, h, 0, 0, (g, ctx) => paintSky(ctx, w, h), { light: false, res: 1 });
  c.add(painted(scene, x, y, sky));

  // نجوم تومض
  for (let i = 0; i < 16; i++) {
    const s = scene.add.image(x + Math.random() * w, y + Math.random() * h * 0.55, 'glowTex').setScale(0.06).setAlpha(0.3).setBlendMode('ADD');
    c.add(s);
    scene.tweens.add({ targets: s, alpha: 1, scale: 0.1, duration: 600 + Math.random() * 1600, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
  }

  // كشّافات تمسح السماء
  [[0.2, 0xb36bff], [0.72, 0x29f0ff]].forEach(([fx, col], i) => {
    const b = scene.add.image(x + w * fx, y + h, 'beam').setOrigin(0.5, 1).setTint(col).setAlpha(0.22).setBlendMode('ADD').setScale(0.5, h / 1040);
    b.rotation = i ? 0.35 : -0.35;
    c.add(b);
    scene.tweens.add({ targets: b, rotation: i ? -0.25 : 0.3, duration: 5000 + i * 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });

  // قمر يتحرك ببطء
  const moon = paint(scene, 'moonTex', 30, 30, 15, 15, (g) => { g.fillStyle(0xd6def5); g.fillCircle(0, 0, 9); g.fillStyle(0x8f98bb); g.fillCircle(-3, 2, 2.5); g.fillCircle(3, -3, 1.6); }, { keep: true, rim2: 0xff3fa4 });
  const mi = painted(scene, x + w * 0.2, y + h * 0.14, moon);
  c.add(mi);
  scene.tweens.add({ targets: mi, x: mi.x + 30, y: mi.y + 6, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  const farH = h * 0.62, nearH = h * 0.7;
  const far = paint(scene, keys[1], w, farH, 0, 0, (g, ctx) => paintSkyline(ctx, w, farH, 0), { light: false });
  c.add(painted(scene, x, y + h - farH, far));

  // مركبات طائرة بين الطبقتين
  const lanes = [y + h * 0.36, y + h * 0.47, y + h * 0.56];
  const carLayer = scene.add.container(0, 0);
  c.add(carLayer);

  const near = paint(scene, keys[2], w, nearH, 0, 0, (g, ctx) => paintSkyline(ctx, w, nearH, 1), { light: false });
  c.add(painted(scene, x, y + h - nearH, near));

  // أضواء تحذير حمراء على الأسطح
  for (let i = 0; i < 6; i++) {
    const b = scene.add.image(x + Math.random() * w, y + h - nearH * rnd(0.45, 0.85), 'glowTex').setTint(0xff4d5e).setScale(0.12).setBlendMode('ADD');
    c.add(b);
    scene.tweens.add({ targets: b, alpha: 0.1, duration: 700, yoyo: true, repeat: -1, delay: Math.random() * 1400 });
  }

  const spawn = () => {
    if (!c.active) return;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const ly = lanes[Math.floor(Math.random() * lanes.length)] + Math.random() * 10;
    const sc = 0.45 + Math.random() * 0.6;
    const car = scene.add.image(dir > 0 ? x - 30 : x + w + 30, ly, 'car').setFlipX(dir < 0).setScale(sc / 4).setAlpha(0.6 + sc * 0.35);
    carLayer.add(car);
    scene.tweens.add({
      targets: car, x: dir > 0 ? x + w + 30 : x - 30, y: ly + (Math.random() * 20 - 10),
      duration: 3000 + Math.random() * 4000, onComplete: () => car.destroy(),
    });
  };
  for (let i = 0; i < 3; i++) scene.time.delayedCall(Math.random() * 1500, spawn);
  scene.time.addEvent({ delay: 1300, loop: true, callback: () => { if (Math.random() < 0.8) spawn(); } });

  c.once('destroy', () => {
    const tm = scene.textures;
    setTimeout(() => keys.forEach((k) => { if (tm.exists(k)) tm.remove(k); }), 0);
  });
  return c;
}

/** خلفية نجوم لمشاهد القوائم */
export function starField(scene, n = 120, depth = 0) {
  const c = scene.add.container(0, 0).setDepth(depth);
  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x05021a, 0x05021a, 0x1a0a3e, 0x1a0a3e, 1);
  bg.fillRect(0, 0, 540, 960);
  c.add(bg);
  [[120, 260, 0xb36bff], [430, 640, 0xff3fa4], [300, 120, 0x29f0ff]].forEach(([nx, ny, col]) => {
    c.add(scene.add.image(nx, ny, 'glowTex').setTint(col).setAlpha(0.18).setScale(4.5).setBlendMode('ADD'));
  });
  for (let i = 0; i < n; i++) {
    const s = scene.add.image(Math.random() * 540, Math.random() * 960, 'px').setScale(Math.random() * 0.3 + 0.08).setAlpha(Math.random() * 0.8 + 0.2);
    c.add(s);
    if (Math.random() < 0.3) scene.tweens.add({ targets: s, alpha: 0.1, duration: 800 + Math.random() * 1500, yoyo: true, repeat: -1 });
  }
  return c;
}

export const _P = Phaser;
