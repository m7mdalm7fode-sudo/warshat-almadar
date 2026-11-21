// مولّد الشخصيات: يركّب نوع غطاء الوجه + اللون + الملابس + الإكسسوار
// قاعدة صارمة: لا تُرسم أي ملامح وجه (لا عيون ولا فم ولا أنف). كل الشخصيات رجال أو روبوتات أو كائنات فضائية.
import Phaser from 'phaser';
import { T, HEX, shade } from '../ui/theme.js';
import { Sfx } from '../audio.js';
import { paint, painted, uniqueKey } from './Painter.js';

export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const pick = (r, a) => a[Math.floor(r() * a.length)];
const hx = (v) => (typeof v === 'string' ? parseInt(v.replace('#', ''), 16) : v);

const FABRIC = [0x3b4a6b, 0x5a3b2e, 0x2f5d50, 0x7a2e3a, 0x44475a, 0x8a6d3b, 0x1f2a44, 0x6b4f8a, 0xb5552b, 0x2b3a2e];
const THOBE = [0xf2efe6, 0xe9e4d8, 0xd8cdb5, 0xcfd6dc, 0x9aa3ad];
const METAL = [0x9aa5b1, 0x6b7785, 0xc9a227, 0x5c6b73, 0xb87333, 0x8892a6];
const NEON = [0x29f0ff, 0xff3fa4, 0xffc94a, 0x3dff8a, 0xb36bff, 0xff7a2f];
const ALIEN = [0x6fd18a, 0x8a7cff, 0x47c1b8, 0xd9739b, 0x9cc94a];
const HELMET = [0xe8ecf2, 0xf08a24, 0xd6dbe3, 0x3d6fb6, 0xc9cfd8, 0x9c2f2f];
const GLOVE = [0x22252b, 0x3a2d22, 0x4a4f57, 0x5b3a1e];

export const COVERS = ['shemagh', 'helmet', 'gasmask', 'screen', 'hood'];

export function makeLook(spec = {}, seed = 1) {
  const r = rng(seed);
  const species = spec.species || pick(r, ['human', 'human', 'human', 'robot', 'alien', 'alien']);
  const coverOpts = { human: ['shemagh', 'shemagh', 'helmet', 'gasmask', 'hood'], robot: ['screen'], alien: ['helmet', 'hood', 'gasmask'] };
  const cover = spec.cover || pick(r, coverOpts[species]);
  let outfit = spec.outfit;
  if (!outfit) {
    if (species === 'robot') outfit = 'chassis';
    else if (cover === 'shemagh') outfit = pick(r, ['thobe', 'thobe', 'jacket', 'coverall']);
    else if (cover === 'hood') outfit = pick(r, ['cloak', 'cloak', 'coverall']);
    else outfit = pick(r, ['jacket', 'armor', 'coverall']);
  }
  const primary = spec.primary ? hx(spec.primary) : outfit === 'thobe' ? pick(r, THOBE) : pick(r, FABRIC);
  const accOpts = ['none', 'none', 'antenna', 'scarf', 'shoulderLamp', 'pack', 'badge'];
  return {
    species, cover, outfit, primary,
    secondary: spec.secondary ? hx(spec.secondary) : pick(r, FABRIC),
    metal: spec.metal ? hx(spec.metal) : pick(r, METAL),
    accent: spec.accent ? hx(spec.accent) : pick(r, NEON),
    helmet: spec.helmet ? hx(spec.helmet) : pick(r, HELMET),
    skin: spec.skin ? hx(spec.skin) : pick(r, ALIEN),
    glove: pick(r, GLOVE),
    pattern: spec.pattern || pick(r, ['red', 'red', 'white', 'black']),
    bisht: spec.bisht ? hx(spec.bisht) : (outfit === 'thobe' && r() < 0.25 ? pick(r, [0x3b2a1a, 0x1a1a1a, 0x5a4026]) : null),
    accessory: spec.accessory || (species === 'robot' ? pick(r, ['none', 'antenna', 'shoulderLamp', 'pack']) : pick(r, accOpts)),
    sw: 56 + Math.floor(r() * 12),
  };
}

// ---------------- رسم الجسم ----------------
function drawBack(g, L) {
  if (L.accessory === 'pack') {
    g.fillStyle(shade(L.secondary, -0.35));
    g.fillRoundedRect(-L.sw - 8, -126, L.sw * 2 + 16, 130, 18);
  }
  if (L.cover === 'hood' || L.outfit === 'cloak') {
    g.fillStyle(shade(L.primary, -0.3));
    g.fillPoints([{ x: -L.sw - 10, y: -100 }, { x: L.sw + 10, y: -100 }, { x: L.sw + 22, y: 50 }, { x: -L.sw - 22, y: 50 }], true);
  }
}

function drawTorso(g, L) {
  const sw = L.sw;
  const base = L.outfit === 'chassis' ? L.metal : L.primary;
  // الرقبة
  const neck = L.species === 'robot' ? shade(L.metal, -0.35) : L.species === 'alien' ? L.skin : shade(L.secondary, -0.25);
  g.fillStyle(neck);
  g.fillRoundedRect(-14, -152, 28, 40, 6);
  // الجذع
  g.fillStyle(base);
  g.fillPoints([{ x: -sw, y: -108 }, { x: sw, y: -108 }, { x: sw * 0.86, y: 50 }, { x: -sw * 0.86, y: 50 }], true);
  g.fillRoundedRect(-sw + 2, -124, sw * 2 - 4, 34, 16);
  g.fillStyle(shade(base, -0.18), 1);
  g.fillPoints([{ x: sw * 0.55, y: -100 }, { x: sw, y: -104 }, { x: sw * 0.86, y: 50 }, { x: sw * 0.5, y: 50 }], true);

  switch (L.outfit) {
    case 'thobe': {
      g.fillStyle(shade(base, -0.1));
      g.fillRoundedRect(-18, -128, 36, 10, 4);
      g.fillRect(-4, -118, 8, 78);
      g.fillStyle(shade(base, -0.3));
      for (let i = 0; i < 4; i++) g.fillCircle(0, -110 + i * 16, 2.2);
      if (L.bisht) {
        g.fillStyle(L.bisht);
        g.fillPoints([{ x: -sw - 6, y: -114 }, { x: -sw * 0.38, y: -120 }, { x: -sw * 0.3, y: 50 }, { x: -sw * 0.98, y: 50 }], true);
        g.fillPoints([{ x: sw + 6, y: -114 }, { x: sw * 0.38, y: -120 }, { x: sw * 0.3, y: 50 }, { x: sw * 0.98, y: 50 }], true);
        g.lineStyle(3, 0xd4af37, 1);
        g.lineBetween(-sw * 0.38, -120, -sw * 0.3, 50);
        g.lineBetween(sw * 0.38, -120, sw * 0.3, 50);
      }
      break;
    }
    case 'jacket': {
      g.fillStyle(shade(base, 0.12));
      g.fillTriangle(-24, -124, -2, -124, -14, -88);
      g.fillTriangle(24, -124, 2, -124, 14, -88);
      g.lineStyle(3, shade(base, 0.35), 0.9);
      g.lineBetween(0, -118, 0, 50);
      g.fillStyle(L.accent, 0.9);
      g.fillRoundedRect(-sw * 0.62, -86, 22, 14, 3);
      g.fillStyle(shade(base, -0.3));
      g.fillRoundedRect(-sw + 2, -122, 26, 20, 8);
      g.fillRoundedRect(sw - 28, -122, 26, 20, 8);
      break;
    }
    case 'armor': {
      const m = shade(L.metal, 0.05);
      g.fillStyle(m);
      g.fillRoundedRect(-sw * 0.72, -114, sw * 1.44, 70, 16);
      g.lineStyle(2, shade(m, -0.4), 1);
      g.strokeRoundedRect(-sw * 0.72, -114, sw * 1.44, 70, 16);
      g.lineBetween(0, -110, 0, -48);
      g.fillStyle(shade(m, -0.15));
      for (let i = 0; i < 3; i++) g.fillRoundedRect(-sw * 0.6, -38 + i * 18, sw * 1.2, 13, 5);
      g.fillStyle(shade(L.metal, -0.1));
      g.fillEllipse(-sw + 4, -106, 44, 30);
      g.fillEllipse(sw - 4, -106, 44, 30);
      g.fillStyle(L.accent, 0.8);
      g.fillRect(-sw * 0.5, -66, 14, 4);
      break;
    }
    case 'coverall': {
      g.fillStyle(shade(base, -0.2));
      g.fillRoundedRect(-sw * 0.6, -84, 30, 26, 4);
      g.fillRoundedRect(sw * 0.6 - 30, -84, 30, 26, 4);
      g.lineStyle(5, shade(base, -0.35), 1);
      g.lineBetween(-sw * 0.45, -122, -sw * 0.3, 50);
      g.lineBetween(sw * 0.45, -122, sw * 0.3, 50);
      g.fillStyle(0xf2f2f2, 0.9);
      g.fillRoundedRect(sw * 0.6 - 28, -106, 26, 10, 3);
      g.fillStyle(L.accent);
      g.fillRect(-sw * 0.6 + 4, -80, 22, 3);
      break;
    }
    case 'cloak': {
      g.fillStyle(shade(base, -0.08));
      g.fillPoints([{ x: -sw - 8, y: -112 }, { x: sw + 8, y: -112 }, { x: sw + 14, y: 50 }, { x: -sw - 14, y: 50 }], true);
      g.lineStyle(2, shade(base, -0.35), 0.9);
      for (let i = -2; i <= 2; i++) g.lineBetween(i * 16, -96, i * 22, 50);
      g.fillStyle(L.accent);
      g.fillCircle(0, -112, 7);
      g.fillStyle(shade(L.accent, -0.4));
      g.fillCircle(0, -112, 3);
      break;
    }
    case 'chassis': {
      g.fillStyle(0x0b1018);
      g.fillRoundedRect(-sw * 0.55, -104, sw * 1.1, 46, 8);
      [0x3dff8a, 0xffc94a, 0xff4d5e].forEach((c, i) => {
        g.fillStyle(c, 1);
        g.fillCircle(-sw * 0.35 + i * 18, -82, 5);
      });
      g.fillStyle(L.accent, 0.8);
      g.fillRect(sw * 0.05, -90, sw * 0.4, 4);
      g.fillRect(sw * 0.05, -78, sw * 0.28, 4);
      g.lineStyle(3, shade(base, -0.35), 1);
      for (let i = 0; i < 4; i++) g.lineBetween(-sw * 0.5, -40 + i * 12, sw * 0.5, -40 + i * 12);
      g.fillStyle(shade(base, 0.35));
      [[-sw + 10, -112], [sw - 10, -112], [-sw * 0.8, 30], [sw * 0.8, 30]].forEach(([x, y]) => g.fillCircle(x, y, 3));
      break;
    }
    default: break;
  }

  // الإكسسوارات الأمامية
  switch (L.accessory) {
    case 'badge': {
      g.fillStyle(0xffc94a);
      g.fillPoints([{ x: sw * 0.42, y: -96 }, { x: sw * 0.62, y: -96 }, { x: sw * 0.62, y: -80 }, { x: sw * 0.52, y: -70 }, { x: sw * 0.42, y: -80 }], true);
      g.fillStyle(shade(0xffc94a, -0.4));
      g.fillCircle(sw * 0.52, -86, 4);
      break;
    }
    case 'chain': {
      g.lineStyle(3, 0xe8c34a, 1);
      g.beginPath();
      g.arc(0, -126, 34, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(150));
      g.strokePath();
      g.fillStyle(0xe8c34a);
      g.fillCircle(0, -92, 6);
      break;
    }
    case 'scarf': {
      g.fillStyle(L.accent === 0xffc94a ? 0x8a3b2b : L.accent);
      g.fillRoundedRect(-26, -134, 52, 18, 8);
      g.fillRoundedRect(8, -122, 14, 40, 5);
      break;
    }
    case 'shoulderLamp': {
      g.fillStyle(0x222630);
      g.fillRoundedRect(-sw - 4, -136, 22, 16, 4);
      g.fillStyle(0xfff6c0);
      g.fillCircle(-sw + 7, -128, 5);
      g.fillStyle(0xfff6c0, 0.18);
      g.fillCircle(-sw + 7, -128, 13);
      break;
    }
    case 'pack': {
      g.lineStyle(7, shade(L.secondary, -0.5), 1);
      g.lineBetween(-sw * 0.55, -122, -sw * 0.45, 30);
      g.lineBetween(sw * 0.55, -122, sw * 0.45, 30);
      break;
    }
    default: break;
  }
}

function sleeveColor(L) {
  if (L.outfit === 'chassis') return shade(L.metal, -0.1);
  if (L.outfit === 'thobe' && L.bisht) return L.bisht;
  if (L.outfit === 'armor') return shade(L.primary, -0.1);
  return shade(L.primary, -0.06);
}

function drawArm(g, L, side) {
  const sw = L.sw;
  const sx = side * (sw - 12), sy = -104;
  const ex = side * (sw + 10), ey = -54;
  const hxp = side * (sw * 0.6), hy = -14;
  const col = sleeveColor(L);
  g.lineStyle(26, col, 1);
  g.lineBetween(sx, sy, ex, ey);
  g.lineBetween(ex, ey, hxp, hy);
  g.fillStyle(col);
  g.fillCircle(sx, sy, 13);
  g.fillCircle(ex, ey, 13);
  if (L.outfit === 'jacket' || L.outfit === 'coverall') {
    g.lineStyle(4, L.accent, 0.8);
    g.lineBetween(ex - side * 2, ey - 18, ex + side * 2, ey - 6);
  }
  // اليد
  if (L.species === 'robot') {
    g.fillStyle(shade(L.metal, -0.25));
    g.fillCircle(hxp, hy, 13);
    g.fillStyle(shade(L.metal, 0.15));
    g.fillRoundedRect(hxp - side * 4 - 4, hy + 4, 8, 14, 3);
    g.fillRoundedRect(hxp + side * 8 - 4, hy + 2, 8, 14, 3);
  } else if (L.species === 'alien') {
    g.fillStyle(L.skin);
    g.fillCircle(hxp, hy, 12);
    g.fillStyle(shade(L.skin, -0.15));
    for (let i = -1; i <= 1; i++) g.fillEllipse(hxp + side * 4 + i * 8, hy + 12, 6, 16);
  } else {
    g.fillStyle(shade(col, -0.3));
    g.fillRoundedRect(hxp - 14, hy - 12, 28, 8, 3);
    g.fillStyle(L.glove);
    g.fillCircle(hxp, hy, 14);
    g.fillStyle(shade(L.glove, 0.12));
    for (let i = -1; i <= 2; i++) g.fillEllipse(hxp + i * 7 * side - 3 * side, hy + 11, 7, 12);
  }
}

// ---------------- رسم الرأس (بدون ملامح) ----------------
function drawShemagh(g, L) {
  const black = L.pattern === 'black';
  const cloth = black ? 0x2a2d35 : 0xf2efe6;
  const pat = L.pattern === 'red' ? 0xc0262d : black ? 0x15171c : null;
  g.fillStyle(shade(cloth, -0.08));
  g.fillPoints([{ x: -32, y: -8 }, { x: -18, y: 14 }, { x: -24, y: 86 }, { x: -60, y: 80 }], true);
  g.fillPoints([{ x: 32, y: -8 }, { x: 18, y: 14 }, { x: 24, y: 86 }, { x: 60, y: 80 }], true);
  g.fillStyle(cloth);
  g.fillEllipse(0, 10, 78, 84);
  g.fillCircle(0, -4, 38);
  if (pat) {
    g.fillStyle(pat, black ? 0.9 : 0.75);
    for (let y = -40; y <= 50; y += 8) {
      for (let x = -40; x <= 40; x += 8) {
        const inside = (x * x) / (38 * 38) + ((y - 4) * (y - 4)) / (46 * 46) < 0.86;
        if (inside && (Math.abs(x / 8 + y / 8) % 2 === 0)) g.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }
  }
  // طيّات اللثام
  g.lineStyle(2, shade(cloth, -0.22), 0.9);
  g.beginPath(); g.arc(0, 18, 30, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160)); g.strokePath();
  g.beginPath(); g.arc(0, 26, 26, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(150)); g.strokePath();
  // منطقة العين: ظل داكن فقط
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(-29, -11, 58, 22, 10);
  g.fillStyle(0x07060c, 1);
  g.fillRoundedRect(-25, -7, 50, 14, 7);
  // العقال
  g.lineStyle(5, 0x111111, 1);
  g.strokeEllipse(0, -28, 72, 16);
  g.lineStyle(4, 0x1d1d1d, 1);
  g.strokeEllipse(0, -34, 66, 13);
}

function drawHelmet(g, L) {
  const c = L.helmet;
  if (L.species === 'alien') {
    g.fillStyle(L.skin);
    g.fillTriangle(-36, -12, -62, -44, -28, -30);
    g.fillTriangle(36, -12, 62, -44, 28, -30);
  }
  g.fillStyle(shade(c, -0.35));
  g.fillRoundedRect(-34, 28, 68, 16, 8);
  g.fillStyle(c);
  g.fillCircle(0, 0, 42);
  g.fillStyle(shade(c, 0.3), 0.55);
  g.fillCircle(-14, -18, 15);
  // الزجاج العاكس
  g.fillStyle(shade(c, -0.4));
  g.fillEllipse(0, 6, 68, 52);
  g.fillStyle(0x0a1022);
  g.fillEllipse(0, 6, 62, 46);
  g.fillStyle(0x1b3566, 0.85);
  g.fillEllipse(0, -1, 54, 30);
  g.fillStyle(0x0a1022, 0.7);
  g.fillEllipse(0, 13, 58, 24);
  g.fillStyle(L.accent, 0.35);
  g.fillEllipse(8, 18, 34, 6);
  g.lineStyle(4, 0xffffff, 0.75);
  g.beginPath(); g.arc(0, 6, 22, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(245)); g.strokePath();
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(15, -7, 3);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(20, -1, 1.6);
  // مصباح جانبي
  g.fillStyle(shade(c, -0.25));
  g.fillRoundedRect(36, -10, 11, 20, 3);
  g.fillStyle(L.accent);
  g.fillRect(38, -6, 7, 7);
  if (L.accessory === 'antenna') {
    g.lineStyle(3, shade(c, -0.4));
    g.lineBetween(-26, -30, -38, -66);
    g.fillStyle(L.accent);
    g.fillCircle(-38, -68, 5);
  }
}

function drawGasmask(g, L) {
  const hood = L.secondary;
  if (L.species === 'alien') {
    g.fillStyle(L.skin);
    g.fillEllipse(-40, -26, 14, 34);
    g.fillEllipse(40, -26, 14, 34);
  }
  g.fillStyle(hood);
  g.fillCircle(0, -6, 39);
  g.fillRoundedRect(-39, -6, 78, 44, 14);
  g.lineStyle(4, shade(hood, -0.4));
  g.lineBetween(-36, -2, -26, -10);
  g.lineBetween(36, -2, 26, -10);
  const rub = 0x2b2f36;
  g.fillStyle(rub);
  g.fillRoundedRect(-32, -20, 64, 56, 20);
  // نظّارة مستمرة واحدة داكنة
  g.fillStyle(0x0d0f13);
  g.fillRoundedRect(-30, -17, 60, 19, 9);
  g.fillStyle(0xffffff, 0.22);
  g.fillRoundedRect(-24, -14, 20, 4, 2);
  g.fillStyle(L.accent, 0.3);
  g.fillRoundedRect(6, -6, 18, 3, 1);
  g.fillStyle(shade(rub, 0.12));
  g.fillRoundedRect(-14, 6, 28, 26, 10);
  [-1, 1].forEach((s) => {
    const fx = s * 28, fy = 26;
    g.fillStyle(L.metal);
    g.fillCircle(fx, fy, 13);
    g.fillStyle(shade(L.metal, -0.4));
    g.fillCircle(fx, fy, 8);
    g.lineStyle(2, shade(L.metal, 0.3));
    g.strokeCircle(fx, fy, 13);
    g.lineStyle(1.5, 0x111111);
    for (let k = -1; k <= 1; k++) g.lineBetween(fx - 5, fy + k * 3, fx + 5, fy + k * 3);
  });
  g.fillStyle(L.metal);
  g.fillCircle(0, 32, 8);
  g.lineStyle(1.5, 0x111111);
  g.lineBetween(-4, 30, 4, 30);
  g.lineBetween(-4, 34, 4, 34);
}

function drawScreenHead(g, L) {
  const m = L.metal;
  g.lineStyle(3, shade(m, -0.3));
  g.lineBetween(0, -36, 0, -56);
  g.fillStyle(L.accent);
  g.fillCircle(0, -58, 5);
  if (L.accessory === 'antenna') {
    g.lineStyle(3, shade(m, -0.3));
    g.lineBetween(-30, -34, -42, -60);
    g.fillStyle(L.accent);
    g.fillCircle(-42, -62, 4);
  }
  g.fillStyle(shade(m, -0.3));
  g.fillRoundedRect(-53, -13, 11, 26, 4);
  g.fillRoundedRect(42, -13, 11, 26, 4);
  g.fillStyle(m);
  g.fillRoundedRect(-45, -37, 90, 74, 14);
  g.fillStyle(shade(m, 0.3), 0.5);
  g.fillRoundedRect(-41, -34, 82, 10, 6);
  g.fillStyle(0x050b12);
  g.fillRoundedRect(-36, -27, 72, 54, 9);
  g.fillStyle(L.accent, 0.1);
  g.fillRoundedRect(-36, -27, 72, 54, 9);
  g.lineStyle(1, L.accent, 0.12);
  for (let y = -22; y < 26; y += 5) g.lineBetween(-33, y, 33, y);
}

function drawHood(g, L) {
  const c = L.primary;
  if (L.species === 'alien') {
    g.fillStyle(L.skin);
    g.fillTriangle(-30, -30, -48, -70, -18, -40);
    g.fillTriangle(30, -30, 48, -70, 18, -40);
  }
  g.fillStyle(shade(c, -0.15));
  g.fillPoints([{ x: -40, y: 0 }, { x: 40, y: 0 }, { x: 64, y: 86 }, { x: -64, y: 86 }], true);
  g.fillStyle(c);
  g.fillEllipse(0, 2, 92, 102);
  g.fillTriangle(-28, -36, 28, -36, 8, -66);
  g.lineStyle(2, shade(c, 0.18), 0.6);
  g.beginPath(); g.arc(0, 4, 42, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(260)); g.strokePath();
  g.fillStyle(shade(c, -0.4));
  g.fillEllipse(0, 9, 62, 72);
  g.fillStyle(0x040307);
  g.fillEllipse(0, 11, 52, 62);
}

/** شخصية كاملة كحاوية Phaser مع حركات تعبيرية */
export class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y, look, scale = 1) {
    super(scene, x, y);
    scene.add.existing(this);
    this.look = look;
    this.baseY = y;
    this.setScale(scale);

    this.inner = scene.add.container(0, 0);
    this.bodyC = scene.add.container(0, 0);
    // نرسم كل جزء مرة واحدة إلى خامة بتدرّجات وحدود وإضاءة نيون
    const lightO = { outline: 1.6, rim: 0x29f0ff, rim2: 0xff3fa4, res: 1.2 };
    this.texKeys = [uniqueKey('chb'), uniqueKey('cha'), uniqueKey('chh')];
    const pb = paint(scene, this.texKeys[0], 260, 240, 130, 170, (g) => {
      drawBack(g, look); drawTorso(g, look); drawArm(g, look, -1);
    }, lightO);
    const pa = paint(scene, this.texKeys[1], 260, 240, 130, 170, (g) => drawArm(g, look, 1), lightO);
    // ظل خفيف على الطاولة
    const shadow = scene.add.image(0, 6, 'soft').setTint(0x000000).setAlpha(0.45).setScale(2.6, 0.35);
    this.bodyC.add([shadow, painted(scene, 0, 0, pb)]);
    this.armR = painted(scene, 0, 0, pa);
    this.bodyC.add(this.armR);

    this.headWrap = scene.add.container(0, -176);
    this.headC = scene.add.container(0, 0);
    const ph = paint(scene, this.texKeys[2], 170, 190, 85, 90, (hg) => {
      switch (look.cover) {
        case 'shemagh': drawShemagh(hg, look); break;
        case 'helmet': drawHelmet(hg, look); break;
        case 'gasmask': drawGasmask(hg, look); break;
        case 'hood': drawHood(hg, look); break;
        default: drawScreenHead(hg, look); break;
      }
    }, { ...lightO, res: 1.5 });
    this.headC.add(painted(scene, 0, 0, ph));
    this.screenText = null;
    this.glow = null;
    switch (look.cover) {
      case 'shemagh': case 'helmet': case 'gasmask': break;
      case 'hood': {
        // نقطتا ضوء داخل الظلام (مسموح)
        this.glow = scene.add.graphics();
        this.glow.fillStyle(look.accent, 0.25);
        this.glow.fillCircle(-11, 6, 8); this.glow.fillCircle(11, 6, 8);
        this.glow.fillStyle(look.accent, 1);
        this.glow.fillCircle(-11, 6, 3.5); this.glow.fillCircle(11, 6, 3.5);
        this.headC.add(this.glow);
        scene.tweens.add({ targets: this.glow, alpha: 0.55, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;
      }
      case 'screen':
      default: {
        this.screenText = T(scene, 0, 0, '…', 30, HEX(look.accent), { bold: true, align: 'center' });
        this.headC.add(this.screenText);
        break;
      }
    }
    this.headWrap.add(this.headC);

    // فقاعة الرموز
    this.bubble = scene.add.container(0, -272);
    const bg = scene.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-34, -30, 68, 52, 18);
    bg.fillTriangle(-12, 18, 8, 18, -16, 36);
    bg.lineStyle(3, 0x1a1230, 0.25);
    bg.strokeRoundedRect(-34, -30, 68, 52, 18);
    this.bubbleT = T(scene, 0, -4, '', 30, '#1a1230', { weight: 900, align: 'center' });
    this.bubble.add([bg, this.bubbleT]);
    this.bubble.setVisible(false);

    this.inner.add([this.bodyC, this.headWrap, this.bubble]);
    this.add(this.inner);

    this.idleTw = [
      scene.tweens.add({ targets: this.headWrap, y: -173, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      scene.tweens.add({ targets: this.bodyC, y: 1.5, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
    ];
  }

  preDestroy() {
    if (this.bubbleTimer) this.bubbleTimer.remove();
    if (this.scene) this.scene.tweens.killTweensOf([this, this.inner, this.headC, this.headWrap, this.bodyC, this.armR, this.bubble, this.glow].filter(Boolean));
    super.preDestroy && super.preDestroy();
    const tm = this.scene ? this.scene.textures : null;
    const keys = this.texKeys || [];
    if (tm) setTimeout(() => keys.forEach((k) => { if (tm.exists(k)) tm.remove(k); }), 0);
  }

  setScreen(sym) {
    if (this.screenText) this.screenText.setText(sym);
  }

  say(sym, color = '#1a1230', ms = 1600) {
    this.bubbleT.setText(sym).setColor(color);
    this.bubble.setVisible(true).setScale(0.2).setAlpha(1);
    this.setScreen(sym);
    this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: 260, ease: 'Back.easeOut' });
    if (this.bubbleTimer) this.bubbleTimer.remove();
    this.bubbleTimer = this.scene.time.delayedCall(ms, () => {
      if (!this.scene) return;
      this.scene.tweens.add({
        targets: this.bubble, alpha: 0, duration: 200,
        onComplete: () => { this.bubble.setVisible(false); this.setScreen('…'); },
      });
    });
  }

  nod() {
    this.scene.tweens.add({ targets: this.headC, y: 7, duration: 130, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
  }
  headShake() {
    this.scene.tweens.add({
      targets: this.headC, x: { from: -7, to: 7 }, duration: 90, yoyo: true, repeat: 2,
      onComplete: () => { this.headC.x = 0; },
    });
  }
  tilt() {
    this.scene.tweens.add({ targets: this.headC, rotation: 0.2, duration: 220, yoyo: true, hold: 700, ease: 'Sine.easeInOut' });
  }
  hop() {
    this.scene.tweens.add({ targets: this.inner, y: -16, duration: 150, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }
  droop() {
    this.scene.tweens.add({ targets: this.headC, y: 9, rotation: 0.12, duration: 300, yoyo: true, hold: 900 });
  }
  angryShake() {
    Sfx.growl();
    this.scene.tweens.add({
      targets: this.inner, x: { from: -6, to: 6 }, duration: 45, yoyo: true, repeat: 6,
      onComplete: () => { this.inner.x = 0; },
    });
  }
  knock() {
    this.scene.tweens.add({
      targets: this.armR, y: -22, duration: 110, yoyo: true, repeat: 2, ease: 'Quad.easeOut',
      onYoyo: () => { Sfx.knock(); this.scene.cameras.main.shake(60, 0.002); },
    });
  }

  react(mood) {
    switch (mood) {
      case 'great': this.say('★', '#c98a00'); this.hop(); break;
      case 'happy': this.say('♪', '#1a8a4a'); this.nod(); break;
      case 'angry': this.say('!!', '#d42a3a'); this.angryShake(); break;
      case 'confused': this.say('؟', '#3a4a9a'); this.tilt(); break;
      case 'thinking': this.say('…', '#3a4a9a'); break;
      case 'impatient': this.say('…', '#b05a00'); this.knock(); break;
      case 'sad': this.say('…', '#5a6a9a'); this.droop(); break;
      case 'money': this.say('◈', '#c98a00'); this.nod(); break;
      case 'surprised': this.say('!', '#d42a3a'); this.hop(); break;
      case 'no': this.say('✗', '#d42a3a'); this.headShake(); break;
      case 'yes': this.say('✓', '#1a8a4a'); this.nod(); break;
      default: break;
    }
  }

  enter(toX, cb) {
    Sfx.door();
    this.scene.tweens.add({ targets: this.inner, y: -8, duration: 180, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    this.scene.tweens.add({ targets: this, x: toX, duration: 1000, ease: 'Cubic.easeOut', onComplete: () => cb && cb() });
  }

  leave(toX, cb) {
    this.scene.tweens.add({ targets: this.inner, y: -8, duration: 180, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    this.scene.tweens.add({
      targets: this, x: toX, duration: 900, ease: 'Cubic.easeIn',
      onComplete: () => { cb && cb(); if (this.scene) this.destroy(); },
    });
  }
}
