// رسومات الأغراض المعطوبة على الطاولة، كلها بالكود
import Phaser from 'phaser';
import { shade } from '../ui/theme.js';
import { paint, painted } from './Painter.js';

const D = Phaser.Math.DegToRad;

function lights(g, xs, y, cols = [0x3dff8a, 0xffc94a, 0xff4d5e]) {
  xs.forEach((x, i) => { g.fillStyle(cols[i % cols.length]); g.fillCircle(x, y, 4); });
}

const DRAW = {
  cooler(g) {
    g.fillStyle(0x7fa7c9); g.fillRoundedRect(-62, -48, 124, 96, 14);
    g.fillStyle(shade(0x7fa7c9, -0.25)); g.fillRoundedRect(-62, 30, 124, 18, 8);
    g.fillStyle(0x1d2a3a); g.fillCircle(-16, -2, 32);
    g.lineStyle(3, 0x7fa7c9); for (let a = 0; a < 360; a += 60) g.lineBetween(-16, -2, -16 + Math.cos(D(a)) * 28, -2 + Math.sin(D(a)) * 28);
    g.strokeCircle(-16, -2, 30);
    g.fillStyle(0xdde7f0); g.fillCircle(-16, -2, 6);
    lights(g, [34, 48], -24); g.fillStyle(0x0b1018); g.fillRoundedRect(28, -6, 26, 26, 4);
  },
  radio(g) {
    g.lineStyle(3, 0x9aa5b1); g.lineBetween(40, -46, 62, -86); g.fillStyle(0xff4d5e); g.fillCircle(62, -88, 4);
    g.fillStyle(0xa0522d); g.fillRoundedRect(-70, -46, 140, 92, 16);
    g.fillStyle(0x3a2416); g.fillRoundedRect(-58, -34, 64, 68, 10);
    g.fillStyle(0x1a110b); for (let y = -28; y < 30; y += 8) for (let x = -52; x < 0; x += 8) g.fillCircle(x, y, 2.4);
    g.fillStyle(0xf2e3c0); g.fillRoundedRect(16, -30, 44, 20, 4); g.lineStyle(2, 0xff4d5e); g.lineBetween(34, -30, 34, -10);
    g.fillStyle(0xd9c08a); g.fillCircle(26, 18, 10); g.fillCircle(52, 18, 10);
    g.fillStyle(0x6b3a1f); g.fillCircle(26, 18, 4); g.fillCircle(52, 18, 4);
  },
  drill(g) {
    g.fillStyle(0x9aa5b1); g.fillTriangle(60, -10, 60, 10, 98, 0);
    g.fillStyle(0x6b7785); g.fillRect(44, -12, 18, 24);
    g.fillStyle(0xf08a24); g.fillRoundedRect(-60, -30, 110, 50, 18);
    g.fillStyle(0x2b2f36); g.fillRoundedRect(-44, 10, 34, 50, 10);
    g.fillStyle(shade(0xf08a24, -0.3)); g.fillRoundedRect(-60, -30, 30, 50, 14);
    g.fillStyle(0x29f0ff); g.fillRect(-10, -18, 36, 6);
    g.fillStyle(0x111111); for (let i = 0; i < 4; i++) g.fillRect(-52 + i * 7, -20, 3, 26);
  },
  phone(g) {
    g.fillStyle(0x23262d); g.fillRoundedRect(-42, -62, 84, 124, 14);
    g.fillStyle(0x0b1830); g.fillRoundedRect(-34, -52, 68, 96, 8);
    g.fillStyle(0x29f0ff, 0.25); g.fillRoundedRect(-34, -52, 68, 96, 8);
    g.fillStyle(0xffc94a); g.fillRoundedRect(-12, -8, 24, 20, 4);
    g.lineStyle(4, 0xffc94a); g.beginPath(); g.arc(0, -8, 9, D(180), D(360)); g.strokePath();
    g.fillStyle(0x6b7785); g.fillRoundedRect(-12, 50, 24, 6, 3);
  },
  toolbox(g) {
    g.lineStyle(8, 0x2b2f36); g.beginPath(); g.arc(0, -40, 26, D(180), D(360)); g.strokePath();
    g.fillStyle(0xc0262d); g.fillRoundedRect(-72, -40, 144, 84, 10);
    g.fillStyle(shade(0xc0262d, -0.25)); g.fillRect(-72, -14, 144, 8);
    g.fillStyle(0x9aa5b1); g.fillRoundedRect(-16, -22, 32, 30, 5);
    g.fillStyle(0x111111); g.fillCircle(0, -10, 5); g.fillRect(-2, -10, 4, 10);
    g.fillStyle(0xffc94a); [-60, 52].forEach((x) => g.fillRect(x, -36, 8, 8));
  },
  nav(g) {
    g.fillStyle(0x6b5a3a); g.fillCircle(0, 0, 58);
    g.fillStyle(0xc9a227); g.fillCircle(0, 0, 52);
    g.fillStyle(0x0b1830); g.fillCircle(0, 0, 44);
    g.lineStyle(2, 0x29f0ff, 0.5); g.strokeCircle(0, 0, 34);
    for (let a = 0; a < 360; a += 30) g.lineBetween(Math.cos(D(a)) * 38, Math.sin(D(a)) * 38, Math.cos(D(a)) * 44, Math.sin(D(a)) * 44);
    g.fillStyle(0xff4d5e); g.fillTriangle(-6, 0, 6, 0, 0, -36);
    g.fillStyle(0xeaf6ff); g.fillTriangle(-6, 0, 6, 0, 0, 36);
    g.fillStyle(0xffc94a); g.fillCircle(0, 0, 5);
  },
  jetpack(g) {
    [-30, 30].forEach((x) => {
      g.fillStyle(0x9aa5b1); g.fillRoundedRect(x - 24, -58, 48, 100, 20);
      g.fillStyle(shade(0x9aa5b1, 0.25)); g.fillRoundedRect(x - 18, -52, 12, 86, 6);
      g.fillStyle(0x2b2f36); g.fillTriangle(x - 16, 42, x + 16, 42, x, 62);
      g.fillStyle(0xff7a2f, 0.6); g.fillTriangle(x - 8, 58, x + 8, 58, x, 74);
    });
    g.fillStyle(0x7a2e3a); g.fillRoundedRect(-14, -40, 28, 60, 6);
    lights(g, [0], -24, [0x3dff8a]);
  },
  drone(g) {
    g.lineStyle(6, 0x44475a);
    g.lineBetween(-56, -30, 56, 30); g.lineBetween(-56, 30, 56, -30);
    [[-56, -30], [56, -30], [-56, 30], [56, 30]].forEach(([x, y]) => {
      g.fillStyle(0x2b2f36); g.fillCircle(x, y, 8);
      g.fillStyle(0x9aa5b1, 0.5); g.fillEllipse(x, y - 6, 54, 8);
    });
    g.fillStyle(0xc9a227); g.fillRoundedRect(-30, -20, 60, 40, 12);
    g.fillStyle(0x0b1830); g.fillRoundedRect(-18, -10, 36, 16, 6);
    lights(g, [-12, 0, 12], 14);
  },
  lamp(g) {
    g.lineStyle(4, 0x6b5a3a); g.beginPath(); g.arc(0, -58, 16, D(180), D(360)); g.strokePath();
    g.fillStyle(0xc9a227); g.fillTriangle(-36, -44, 36, -44, 0, -64);
    g.fillStyle(0xfff1b0, 0.85); g.fillRoundedRect(-28, -44, 56, 76, 10);
    g.lineStyle(3, 0xc9a227); for (let x = -18; x <= 18; x += 18) g.lineBetween(x, -44, x, 32);
    g.fillStyle(0xc9a227); g.fillRoundedRect(-38, 30, 76, 16, 5);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(0, -6, 10);
  },
  safe(g) {
    g.fillStyle(0x5c4a1e); g.fillRoundedRect(-66, -60, 132, 120, 10);
    g.fillStyle(0xc9a227); g.fillRoundedRect(-58, -52, 116, 104, 8);
    g.lineStyle(3, shade(0xc9a227, -0.35)); g.strokeRoundedRect(-50, -44, 100, 88, 6);
    g.fillStyle(0x2b2f36); g.fillCircle(0, 0, 28);
    g.fillStyle(0x9aa5b1); g.fillCircle(0, 0, 22);
    g.lineStyle(2, 0x2b2f36); for (let a = 0; a < 360; a += 30) g.lineBetween(Math.cos(D(a)) * 16, Math.sin(D(a)) * 16, Math.cos(D(a)) * 22, Math.sin(D(a)) * 22);
    g.fillStyle(0x2b2f36); g.fillRect(-3, -22, 6, 14);
    g.fillStyle(0x6b7785); g.fillRoundedRect(36, -12, 10, 24, 3);
  },
  mask(g) {
    g.lineStyle(5, 0x3a3f4a); g.beginPath(); g.arc(0, -10, 60, D(200), D(340)); g.strokePath();
    g.fillStyle(0x8fd3e8, 0.6); g.fillEllipse(0, -6, 92, 70);
    g.lineStyle(4, 0x6b7785); g.strokeEllipse(0, -6, 92, 70);
    g.fillStyle(0x3a3f4a); g.fillRoundedRect(-20, 18, 40, 34, 10);
    g.fillStyle(0x9aa5b1); g.fillCircle(0, 40, 12);
    g.lineStyle(2, 0x2b2f36); g.lineBetween(-6, 36, 6, 36); g.lineBetween(-6, 42, 6, 42);
    g.lineStyle(6, 0x2b2f36); g.lineBetween(12, 48, 70, 60);
  },
  generator(g) {
    g.fillStyle(0x3a3f4a); g.fillRoundedRect(-72, -50, 144, 100, 10);
    g.fillStyle(0xffc94a); for (let i = -6; i < 6; i++) g.fillTriangle(i * 14, 36, i * 14 + 7, 36, i * 14 - 3, 50);
    g.fillStyle(0x1b1d24); g.fillRoundedRect(-60, -38, 70, 64, 6);
    g.lineStyle(3, 0xb87333); for (let y = -30; y < 22; y += 7) g.lineBetween(-54, y, 4, y);
    g.fillStyle(0x0b1018); g.fillRoundedRect(20, -38, 40, 26, 4);
    g.fillStyle(0x3dff8a); g.fillRect(24, -34, 22, 6);
    lights(g, [26, 40, 54], 2);
  },
  crystal(g) {
    g.fillStyle(0x3a2e48); g.fillRoundedRect(-64, 20, 128, 30, 8);
    g.fillStyle(0x6b4f8a); g.fillRoundedRect(-56, 26, 112, 8, 3);
    g.fillStyle(0x7cf7ff, 0.85); g.fillPoints([{ x: 0, y: -70 }, { x: 26, y: -20 }, { x: 14, y: 22 }, { x: -14, y: 22 }, { x: -26, y: -20 }], true);
    g.fillStyle(0xffffff, 0.5); g.fillTriangle(0, -70, -10, -20, 6, -24);
    g.fillStyle(0xb36bff, 0.7); g.fillPoints([{ x: -36, y: -24 }, { x: -24, y: -2 }, { x: -30, y: 22 }, { x: -44, y: 22 }, { x: -48, y: -2 }], true);
    g.lineStyle(2, 0xb87333); g.lineBetween(30, 20, 54, -30); g.fillStyle(0xb87333); g.fillCircle(54, -32, 5);
  },
  robotarm(g) {
    g.fillStyle(0x44475a); g.fillRoundedRect(-70, 26, 60, 26, 6);
    g.lineStyle(20, 0xf08a24); g.lineBetween(-40, 30, -10, -30); g.lineBetween(-10, -30, 44, -20);
    g.fillStyle(0x2b2f36); g.fillCircle(-40, 30, 13); g.fillCircle(-10, -30, 13);
    g.fillStyle(0x9aa5b1); g.fillCircle(-40, 30, 6); g.fillCircle(-10, -30, 6);
    g.fillStyle(0x6b7785); g.fillTriangle(44, -32, 76, -42, 66, -24); g.fillTriangle(44, -8, 76, 2, 66, -16);
  },
  coil(g) {
    g.fillStyle(0x2b2f36); g.fillRoundedRect(-70, -36, 20, 72, 6); g.fillRoundedRect(50, -36, 20, 72, 6);
    g.fillStyle(0x5c6b73); g.fillRect(-52, -14, 104, 28);
    g.lineStyle(6, 0xd9823b); for (let x = -46; x <= 46; x += 9) g.lineBetween(x, -26, x + 4, 26);
    g.lineStyle(2, 0xffc08a, 0.7); for (let x = -46; x <= 46; x += 9) g.lineBetween(x - 1, -24, x + 2, 0);
    g.fillStyle(0x29f0ff); g.fillCircle(-60, -26, 4); g.fillCircle(60, -26, 4);
  },
  dallah(g) {
    // دلّة قهوة إلكترونية
    g.fillStyle(0xc9a227);
    g.fillPoints([{ x: -30, y: 50 }, { x: 30, y: 50 }, { x: 22, y: -6 }, { x: -22, y: -6 }], true);
    g.fillEllipse(0, -6, 46, 16);
    g.fillPoints([{ x: -14, y: -8 }, { x: 14, y: -8 }, { x: 10, y: -40 }, { x: -10, y: -40 }], true);
    g.fillTriangle(-12, -46, 12, -46, 0, -66);
    g.fillStyle(shade(0xc9a227, -0.3)); g.fillRect(-14, -44, 28, 6);
    g.fillPoints([{ x: -24, y: -8 }, { x: -30, y: -10 }, { x: -64, y: -46 }, { x: -58, y: -50 }], true);
    g.lineStyle(6, shade(0xc9a227, -0.35)); g.beginPath(); g.arc(30, 14, 18, D(-80), D(80)); g.strokePath();
    g.fillStyle(0x0b1018); g.fillRoundedRect(-14, 16, 28, 14, 3); g.fillStyle(0xff4d5e); g.fillRect(-10, 20, 12, 6);
  },
  chip(g) {
    g.fillStyle(0x1f6b45); g.fillRoundedRect(-66, -46, 132, 92, 8);
    g.lineStyle(2, 0xc9a227, 0.8); for (let i = -3; i <= 3; i++) { g.lineBetween(-66, i * 12, -30, i * 12); g.lineBetween(30, i * 12, 66, i * 12); }
    g.fillStyle(0x111318); g.fillRoundedRect(-30, -30, 60, 60, 6);
    g.fillStyle(0x9aa5b1); for (let i = -2; i <= 2; i++) { g.fillRect(-38, i * 11 - 2, 8, 4); g.fillRect(30, i * 11 - 2, 8, 4); }
    g.fillStyle(0x29f0ff, 0.6); g.fillCircle(0, 0, 8);
  },
  box(g) {
    g.fillStyle(0x5c6b73); g.fillRoundedRect(-60, -44, 120, 88, 12);
    g.fillStyle(0x0b1018); g.fillRoundedRect(-44, -30, 60, 40, 6);
    lights(g, [32, 46], -20);
  },
};

export const ITEM_KINDS = Object.keys(DRAW);

export function drawItemGraphics(g, kind) {
  (DRAW[kind] || DRAW.box)(g);
}

export function itemTexture(scene, kind) {
  const k = DRAW[kind] ? kind : 'box';
  return paint(scene, `item_${k}`, 220, 200, 110, 100, (g) => drawItemGraphics(g, k), {
    keep: true, res: 2.6, outline: 1.4, rim: 0x29f0ff, rim2: 0xff3fa4,
  });
}

export function drawItem(scene, kind) {
  const c = scene.add.container(0, 0);
  const shadow = scene.add.image(0, 58, 'soft').setTint(0x000000).setAlpha(0.55).setScale(1.8, 0.32);
  const img = painted(scene, 0, 0, itemTexture(scene, kind));
  c.add([shadow, img]);
  return c;
}
