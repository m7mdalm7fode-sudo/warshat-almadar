// داخل الورشة: الجدران والرفوف ولوحات النيون والطاولة، تتغيّر حسب مرحلة التطوير
import Phaser from 'phaser';
import { T, HEX, shade } from '../ui/theme.js';
import { paint, painted, uniqueKey, addGlow, rgba } from './Painter.js';

export const WIN = { x: 90, y: 92, w: 360, h: 440 };
export const COUNTER_Y = 532;

function wallColor(st) {
  if (st.stage >= 3) return 0x2a2650;
  if (st.stage === 2) {
    if (st.shelterDesign === 'container') return 0x6a3220;
    if (st.shelterDesign === 'rock') return 0x4a3a30;
    return 0x22344c;
  }
  return 0x30264c;
}

function shelfItems(g, x, y, seed) {
  const cols = [0x29f0ff, 0xff3fa4, 0xffc94a, 0x3dff8a, 0xb87333];
  let cx = x + 6;
  for (let i = 0; i < 3; i++) {
    const t = (seed + i) % 4;
    const c = cols[(seed * 3 + i) % cols.length];
    if (t === 0) {
      g.glow(cx + 8, y - 11, 16, c, 0.25);
      g.fillStyle(c, 0.6); g.fillRoundedRect(cx, y - 24, 16, 24, 4);
      g.fillStyle(0x9aa5b1); g.fillRect(cx + 3, y - 28, 10, 5);
      g.fillStyle(0xffffff, 0.45); g.fillRect(cx + 3, y - 20, 3, 14);
      cx += 22;
    } else if (t === 1) {
      g.fillStyle(0x8a6d3b); g.fillRect(cx, y - 17, 24, 17);
      g.lineStyle(1, 0x4a3a20); g.lineBetween(cx, y - 9, cx + 24, y - 9);
      g.fillStyle(0xffc94a); g.fillRect(cx + 8, y - 14, 8, 3);
      cx += 28;
    } else if (t === 2) {
      g.lineStyle(5, 0xaeb7c4); g.lineBetween(cx + 2, y - 2, cx + 14, y - 24);
      g.fillStyle(0xaeb7c4); g.fillCircle(cx + 15, y - 25, 5);
      g.fillStyle(0x2b2f36); g.fillCircle(cx + 15, y - 25, 2);
      cx += 18;
    } else {
      g.lineStyle(3, c, 0.95); g.strokeCircle(cx + 9, y - 9, 8); g.strokeCircle(cx + 9, y - 9, 4);
      cx += 22;
    }
  }
}

function paintWalls(g, st) {
  const wall = wallColor(st);
  const panel = (x, y, w, h) => {
    g.fillStyle(wall); g.fillRect(x, y, w, h);
  };
  panel(0, 58, WIN.x, 540);
  panel(WIN.x + WIN.w, 58, 540 - WIN.x - WIN.w, 540);
  panel(WIN.x, 58, WIN.w, WIN.y - 58);

  if (st.stage === 2 && st.shelterDesign === 'container') {
    for (let x = 4; x < WIN.x; x += 11) { g.fillStyle(shade(wall, 0.18), 0.7); g.fillRect(x, 58, 4, 540); }
    for (let x = WIN.x + WIN.w + 4; x < 540; x += 11) { g.fillStyle(shade(wall, 0.18), 0.7); g.fillRect(x, 58, 4, 540); }
    g.fillStyle(0xffc94a, 0.9); g.fillRect(4, 64, 80, 6); g.fillRect(456, 64, 80, 6);
  } else if (st.stage === 2 && st.shelterDesign === 'rock') {
    for (let i = 0; i < 50; i++) {
      const rx = Math.random() < 0.5 ? Math.random() * WIN.x : WIN.x + WIN.w + Math.random() * 90;
      g.fillStyle(shade(wall, Math.random() * 0.3 - 0.15), 1);
      g.fillCircle(rx, 60 + Math.random() * 530, 6 + Math.random() * 14);
    }
  } else {
    // ألواح معدنية بمسامير
    for (let y = 58; y < 598; y += 120) {
      [[0, WIN.x], [WIN.x + WIN.w, 540 - WIN.x - WIN.w]].forEach(([px, pw]) => {
        g.fillStyle(shade(wall, 0.06)); g.fillRoundedRect(px + 4, y + 4, pw - 8, 112, 6);
        g.lineStyle(1.5, shade(wall, 0.3), 0.6); g.lineBetween(px + 6, y + 5, px + pw - 6, y + 5);
        g.lineStyle(2, shade(wall, -0.4), 0.8); g.lineBetween(px + 6, y + 116, px + pw - 6, y + 116);
        g.fillStyle(shade(wall, 0.35)); [[px + 10, y + 12], [px + pw - 10, y + 12], [px + 10, y + 108], [px + pw - 10, y + 108]].forEach(([a, b]) => g.fillCircle(a, b, 2.4));
      });
    }
  }

  // إطار النافذة المعدني
  const frame = st.stage >= 3 ? 0x5a4f9a : st.stage === 2 ? shade(wall, 0.35) : 0x4c4270;
  if (st.stage === 2 && st.shelterDesign === 'dome') {
    g.fillStyle(wall);
    const pts = [{ x: WIN.x, y: 58 }, { x: WIN.x, y: WIN.y }];
    for (let a = 180; a <= 360; a += 6) {
      const r = Phaser.Math.DegToRad(a);
      pts.push({ x: WIN.x + WIN.w / 2 + Math.cos(r) * (WIN.w / 2), y: WIN.y + 90 + Math.sin(r) * 90 });
    }
    pts.push({ x: WIN.x + WIN.w, y: WIN.y }, { x: WIN.x + WIN.w, y: 58 });
    g.fillPoints(pts, true);
    g.lineStyle(7, 0x8fd3e8, 0.85);
    g.beginPath(); g.arc(WIN.x + WIN.w / 2, WIN.y + 90, WIN.w / 2, Math.PI, Math.PI * 2); g.strokePath();
    g.lineStyle(2, 0x8fd3e8, 0.3);
    for (let i = 1; i < 4; i++) g.lineBetween(WIN.x + (WIN.w / 4) * i, WIN.y + 20, WIN.x + (WIN.w / 4) * i, WIN.y + WIN.h);
  }
  g.lineStyle(12, shade(frame, -0.35), 1); g.strokeRect(WIN.x, WIN.y, WIN.w, WIN.h);
  g.lineStyle(6, frame, 1); g.strokeRect(WIN.x, WIN.y, WIN.w, WIN.h);
  g.lineStyle(1.5, shade(frame, 0.5), 0.8); g.strokeRect(WIN.x - 3, WIN.y - 3, WIN.w + 6, WIN.h + 6);

  // مظلّة الكشك
  if (st.stage === 1) {
    const cols = [0xff3fa4, 0xf2efe6];
    const n = 9, sw = WIN.w / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle(cols[i % 2]);
      g.fillRect(WIN.x + i * sw, WIN.y - 8, sw, 28);
      g.beginPath(); g.arc(WIN.x + i * sw + sw / 2, WIN.y + 20, sw / 2, 0, Math.PI); g.fillPath();
    }
    g.fillStyle(0x000000, 0.25); g.fillRect(WIN.x, WIN.y + 20, WIN.w, 3);
  }

  // الرفوف
  [180, 300, 420].forEach((y, i) => {
    [[4, 82], [454, 82]].forEach(([sx, sw]) => {
      g.fillStyle(0x000000, 0.3); g.fillRect(sx + 2, y + 7, sw, 6);
      g.fillStyle(0x8a6d3b); g.fillRect(sx, y, sw, 8);
      g.fillStyle(0xc9a26a, 0.7); g.fillRect(sx, y, sw, 2);
    });
    shelfItems(g, 4, y, i + 1);
    shelfItems(g, 454, y, i + 4);
  });
  // أدوات معلّقة
  g.lineStyle(5, 0xaeb7c4);
  g.lineBetween(20, 470, 20, 520); g.lineBetween(40, 470, 46, 520);
  g.fillStyle(0xff4d5e); g.fillRoundedRect(14, 500, 12, 24, 3);
  g.lineStyle(4, 0xffc94a); g.strokeCircle(500, 495, 18);
  if (st.stage >= 3) {
    g.fillStyle(0x0b1018); g.fillRoundedRect(462, 460, 66, 36, 6);
    g.lineStyle(2, 0x3dff8a, 0.6); g.strokeRoundedRect(462, 460, 66, 36, 6);
  }
  // إطارات أنابيب النيون حول اللوحات
  g.lineStyle(2, 0xff3fa4, 0.5); g.strokeRoundedRect(6, 100, 78, 40, 10);
  g.lineStyle(2, 0x29f0ff, 0.5); g.strokeRoundedRect(456, 100, 78, 40, 10);
}

export function drawInterior(scene, st) {
  const key = uniqueKey('walls');
  const p = paint(scene, key, 540, 600, 0, 0, (g) => paintWalls(g, st), { light: false, grad: 0.12 });
  const img = painted(scene, 0, 0, p).setDepth(10);
  img.once('destroy', () => setTimeout(() => { if (scene.textures.exists(key)) scene.textures.remove(key); }, 0));

  // انسكاب ضوء النيون على الجدران
  const spill = [[45, 120, 0xff3fa4], [495, 120, 0x29f0ff], [270, 560, 0xb36bff]];
  spill.forEach(([x, y, c]) => scene.add.image(x, y, 'glowTex').setTint(c).setAlpha(0.28).setScale(1.6).setBlendMode('ADD').setDepth(11));

  // لوحات نيون
  const signs = [];
  const s1 = T(scene, 45, 120, 'ورشة', 22, HEX(0xff8fd0), { weight: 900, shadow: HEX(0xff3fa4), blur: 10, align: 'center' }).setDepth(12);
  const s2 = T(scene, 495, 120, 'مفتوح', 18, HEX(0x9ff8ff), { weight: 900, shadow: HEX(0x29f0ff), blur: 10, align: 'center' }).setDepth(12);
  addGlow(scene, s1, 0xff3fa4, 4); addGlow(scene, s2, 0x29f0ff, 4);
  signs.push(s1, s2);
  if (st.upgrades.neon) {
    const s3 = T(scene, 270, 75, '★ ورشة المدار ★', 18, HEX(0xffe28a), { weight: 900, shadow: HEX(0xffc94a), blur: 12, align: 'center' }).setDepth(12);
    addGlow(scene, s3, 0xffc94a, 4);
    signs.push(s3);
  }
  if (st.stage >= 3) {
    T(scene, 495, 478, `الأدوار ${st.floors.length}`, 13, HEX(0x3dff8a), { bold: true, align: 'center' }).setDepth(12);
  }
  signs.forEach((s, i) => {
    scene.time.addEvent({
      delay: 2200 + i * 700, loop: true,
      callback: () => { if (Math.random() < 0.5) scene.tweens.add({ targets: s, alpha: 0.25, duration: 60, yoyo: true, repeat: 2 }); },
    });
  });
  return { img, signs };
}

function paintCounter(g, st) {
  const Y = COUNTER_Y;
  // سطح الطاولة الأمامي
  g.fillStyle(0x6b7088); g.fillRect(0, Y, 540, 18);
  g.fillStyle(0xb9bfd6); g.fillRect(0, Y, 540, 2.5);
  g.fillStyle(0x15161f); g.fillRect(0, Y + 18, 540, 30);
  g.fillStyle(0xffc94a);
  for (let x = -40; x < 560; x += 36) g.fillPoints([{ x, y: Y + 18 }, { x: x + 18, y: Y + 18 }, { x: x + 6, y: Y + 48 }, { x: x - 12, y: Y + 48 }], true);
  g.fillStyle(0x000000, 0.35); g.fillRect(0, Y + 44, 540, 4);
  // طاولة العمل
  g.fillStyle(0x1c1f2e); g.fillRect(0, Y + 48, 540, 380);
  g.fillStyle(0x0e3a32); g.fillRoundedRect(22, Y + 62, 496, 400, 14);
  g.lineStyle(1, 0x3dff8a, 0.13);
  for (let x = 42; x < 518; x += 24) g.lineBetween(x, Y + 62, x, 960);
  for (let y = Y + 80; y < 960; y += 24) g.lineBetween(22, y, 518, y);
  g.lineStyle(2, 0x3dff8a, 0.35); g.strokeRoundedRect(22, Y + 62, 496, 400, 14);
  g.lineStyle(1, 0xeaf6ff, 0.4);
  for (let x = 30; x < 510; x += 12) g.lineBetween(x, Y + 64, x, Y + 64 + (x % 60 === 30 ? 10 : 5));
  // أدوات ملقاة على الطاولة
  g.lineStyle(6, 0xaeb7c4); g.lineBetween(40, 650, 92, 620);
  g.fillStyle(0xff4d5e); g.fillRoundedRect(84, 608, 26, 14, 5);
  g.fillStyle(0xaeb7c4);
  [[480, 700], [500, 640], [40, 760], [70, 700]].forEach(([x, y]) => { g.fillCircle(x, y, 4.5); });
  g.fillStyle(0x2b2f36);
  [[480, 700], [500, 640], [40, 760], [70, 700]].forEach(([x, y]) => { g.fillRect(x - 3, y - 0.8, 6, 1.6); });
  if (st && st.upgrades && st.upgrades.coffee) {
    // فنجال قهوة
    g.fillStyle(0xf2efe6); g.fillRoundedRect(470, 600, 26, 22, { tl: 2, tr: 2, bl: 10, br: 10 });
    g.fillStyle(0x6b3a1f); g.fillEllipse(483, 602, 22, 6);
    g.lineStyle(3, 0xf2efe6); g.strokeCircle(499, 610, 6);
  }
}

export function drawCounter(scene, st) {
  const key = uniqueKey('counter');
  const p = paint(scene, key, 540, 428, 0, -COUNTER_Y, (g) => paintCounter(g, st), { light: false, grad: 0.1 });
  const img = painted(scene, 0, 0, p).setDepth(30);
  img.once('destroy', () => setTimeout(() => { if (scene.textures.exists(key)) scene.textures.remove(key); }, 0));
  // مخروط ضوء المصباح وغبار يطفو فيه
  scene.add.image(270, COUNTER_Y + 40, 'lampCone').setOrigin(0.5, 0).setScale(0.5).setBlendMode('ADD').setAlpha(0.55).setDepth(31);
  const dust = scene.add.particles(0, 0, 'px', {
    x: { min: 120, max: 420 }, y: { min: COUNTER_Y + 60, max: 900 },
    speedY: { min: -8, max: 8 }, speedX: { min: -6, max: 6 },
    scale: { min: 0.08, max: 0.18 }, alpha: { start: 0, end: 0.6, ease: 'Sine.easeInOut' },
    lifespan: 4000, frequency: 260, tint: 0xfff1c0, blendMode: 'ADD',
  }).setDepth(32);
  return { img, dust };
}
