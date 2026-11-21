// عرض مقطعي للورشة/البرج يتحدّث مع كل تطوير
import { T, HEX, shade } from '../ui/theme.js';
import { upgradeById } from '../state.js';
import { paint, painted, uniqueKey } from './Painter.js';

function dashedRect(g, x, y, w, h, col, a = 0.5) {
  g.lineStyle(2, col, a);
  const seg = 8;
  for (let i = 0; i < w; i += seg * 2) { g.lineBetween(x + i, y, x + Math.min(w, i + seg), y); g.lineBetween(x + i, y + h, x + Math.min(w, i + seg), y + h); }
  for (let i = 0; i < h; i += seg * 2) { g.lineBetween(x, y + i, x, y + Math.min(h, i + seg)); g.lineBetween(x + w, y + i, x + w, y + Math.min(h, i + seg)); }
}

function drawShelter(g, design, x, y, w, h) {
  // (x,y) أعلى يسار، يرسم المقطع
  if (design === 'dome') {
    g.fillStyle(0x1c2a3d); g.fillRect(x, y + h * 0.35, w, h * 0.65);
    g.fillStyle(0x8fd3e8, 0.35); g.beginPath(); g.arc(x + w / 2, y + h * 0.4, w / 2, Math.PI, Math.PI * 2); g.fillPath();
    g.lineStyle(3, 0x8fd3e8, 0.9); g.beginPath(); g.arc(x + w / 2, y + h * 0.4, w / 2, Math.PI, Math.PI * 2); g.strokePath();
    g.lineStyle(1.5, 0x8fd3e8, 0.5); for (let i = 1; i < 4; i++) g.lineBetween(x + (w / 4) * i, y + h * 0.4 - Math.sin(Math.acos(Math.abs((w / 4) * i - w / 2) / (w / 2))) * (w / 2) + 2, x + (w / 4) * i, y + h * 0.4);
  } else if (design === 'container') {
    const cols = [0xb5552b, 0x2f6d8a, 0x8a6d3b];
    const hh = h / 2;
    [[x, y + hh, w * 0.55, hh, 0], [x + w * 0.55, y + hh, w * 0.45, hh, 1], [x + w * 0.15, y, w * 0.6, hh, 2]].forEach(([cx, cy, cw, ch, i]) => {
      g.fillStyle(cols[i]); g.fillRect(cx, cy, cw, ch);
      g.lineStyle(1.5, shade(cols[i], -0.35), 1); for (let k = cx + 5; k < cx + cw; k += 6) g.lineBetween(k, cy + 3, k, cy + ch - 3);
      g.lineStyle(2, shade(cols[i], -0.5)); g.strokeRect(cx, cy, cw, ch);
    });
  } else {
    g.fillStyle(0x5a4636);
    g.fillPoints([{ x, y: y + h }, { x: x + w * 0.05, y: y + h * 0.4 }, { x: x + w * 0.3, y: y + h * 0.05 }, { x: x + w * 0.7, y }, { x: x + w * 0.95, y: y + h * 0.35 }, { x: x + w, y: y + h }], true);
    g.fillStyle(0x7a6048); g.fillCircle(x + w * 0.3, y + h * 0.4, 12); g.fillCircle(x + w * 0.7, y + h * 0.3, 9);
    g.fillStyle(0x2a1f18); g.fillRoundedRect(x + w * 0.42, y + h * 0.55, w * 0.16, h * 0.45, { tl: 12, tr: 12, bl: 0, br: 0 });
  }
  // نافذة الورشة المضيئة
  g.fillStyle(0xffc94a, 0.85); g.fillRect(x + w * 0.12, y + h * 0.62, w * 0.22, h * 0.2);
  g.fillStyle(0x29f0ff, 0.85); g.fillRect(x + w * 0.66, y + h * 0.62, w * 0.2, h * 0.2);
}

function drawFloor(scene, c, g, id, x, y, w, h) {
  g.fillStyle(0x2a2550); g.fillRect(x, y, w, h);
  g.fillStyle(0x15122e); g.fillRect(x + 6, y + 6, w - 12, h - 14);
  g.fillStyle(0x4a3f7a); g.fillRect(x, y + h - 8, w, 8);
  if (id === 'floor_tools') {
    g.lineStyle(4, 0x9aa5b1); for (let i = 0; i < 4; i++) g.lineBetween(x + 22 + i * 18, y + 14, x + 22 + i * 18, y + 38);
    g.fillStyle(0xff4d5e); for (let i = 0; i < 4; i++) g.fillRect(x + 18 + i * 18, y + 36, 8, 12);
    g.fillStyle(0xffc94a); g.fillRect(x + w - 60, y + h - 26, 44, 16);
  } else if (id === 'floor_rich') {
    g.fillStyle(0x7a2e3a); g.fillRoundedRect(x + 20, y + h - 30, 60, 20, 6);
    g.fillStyle(0xffc94a); g.fillTriangle(x + w / 2 - 10, y + 8, x + w / 2 + 10, y + 8, x + w / 2, y + 22);
    g.fillStyle(0xffc94a, 0.25); g.fillCircle(x + w / 2, y + 24, 16);
    g.fillStyle(0x3dff8a); g.fillRoundedRect(x + w - 50, y + h - 40, 16, 30, 6);
  } else {
    g.fillStyle(0x8a6d3b);
    [[20, 22], [44, 22], [32, 2], [w - 70, 22], [w - 46, 22]].forEach(([dx, dy]) => {
      g.fillRect(x + dx, y + dy + 10, 22, 20); g.lineStyle(1, 0x5a4626); g.strokeRect(x + dx, y + dy + 10, 22, 20);
    });
  }
  const u = upgradeById[id];
  const t = T(scene, x + w / 2, y + h / 2 - 2, u ? u.label : '', 13, '#eaf6ff', { bold: true, align: 'center', stroke: '#15122e', strokeW: 4 });
  c.add(t);
}

/**
 * يرسم البرج: الأساس عند (x,y) أسفل المنتصف
 * opts: { scale, ghost, engineOn }
 */
export function drawTower(scene, st, opts = {}) {
  const c = scene.add.container(opts.x ?? 270, opts.y ?? 400).setScale(opts.scale ?? 1);
  // نسجّل أوامر الرسم ثم نرسمها دفعة واحدة على خامة مظلّلة
  const calls = [];
  const g = new Proxy({}, { get: (t, name) => (...args) => { calls.push([name, args]); return g; } });
  const ghost = opts.ghost !== false;
  const hasEngine = !!st.upgrades.engine || opts.forceEngine;
  let top = 0;

  // المحرك
  const EW = 220, EH = 52;
  if (hasEngine) {
    g.fillStyle(0x3a3f4a); g.fillPoints([{ x: -EW / 2, y: -EH }, { x: EW / 2, y: -EH }, { x: EW / 2 - 20, y: 0 }, { x: -EW / 2 + 20, y: 0 }], true);
    g.fillStyle(0xffc94a); for (let i = -4; i < 4; i++) g.fillRect(i * 26 + 4, -EH + 6, 14, 6);
    [-60, 0, 60].forEach((nx) => {
      g.fillStyle(0x6b7785); g.fillPoints([{ x: nx - 18, y: 0 }, { x: nx + 18, y: 0 }, { x: nx + 26, y: 22 }, { x: nx - 26, y: 22 }], true);
      g.fillStyle(0x29f0ff, 0.6); g.fillEllipse(nx, 20, 40, 8);
    });
    top = -EH;
  } else if (ghost) {
    dashedRect(g, -EW / 2, -EH, EW, EH, 0x29f0ff, 0.35);
    c.add(T(scene, 0, -EH / 2, 'المحرّك', 12, '#29f0ff', { align: 'center' }).setAlpha(0.6));
    top = -EH;
  }

  // الأساس: كشك أو ملجأ
  const SW = 210, SH = 120;
  if (st.stage >= 2) {
    drawShelter(g, st.shelterDesign || 'dome', -SW / 2, top - SH, SW, SH);
    top -= SH;
  } else {
    // كشك صغير
    const KW = 120, KH = 90;
    if (ghost) {
      dashedRect(g, -SW / 2, top - SH, SW, SH, 0xffc94a, 0.35);
      c.add(T(scene, -SW / 2 + 40, top - SH + 16, 'ملجأ', 12, '#ffc94a', { align: 'center' }).setAlpha(0.6));
    }
    g.fillStyle(0x3c3358); g.fillRect(-KW / 2, top - KH, KW, KH);
    g.fillStyle(0x0b1018); g.fillRect(-KW / 2 + 14, top - KH + 26, KW - 28, 36);
    g.fillStyle(0xffc94a, 0.6); g.fillRect(-KW / 2 + 14, top - KH + 26, KW - 28, 36);
    const n = 6, sw = KW / n;
    for (let i = 0; i < n; i++) { g.fillStyle(i % 2 ? 0xf2efe6 : 0xff3fa4); g.fillRect(-KW / 2 + i * sw, top - KH, sw, 16); }
    g.fillStyle(0x6b5a3a); g.fillRect(-KW / 2 - 6, top - 10, KW + 12, 10);
    top -= SH;
  }

  // الأدوار
  const FW = 180, FH = 62;
  const floors = st.floors || [];
  const allFloors = ['floor_tools', 'floor_rich', 'floor_storage'];
  floors.forEach((id) => { drawFloor(scene, c, g, id, -FW / 2, top - FH, FW, FH); top -= FH; });
  if (ghost) {
    allFloors.filter((f) => !floors.includes(f)).forEach(() => {
      dashedRect(g, -FW / 2, top - FH, FW, FH, 0xb36bff, 0.35);
      top -= FH;
    });
  }

  // الهوائي والقمة
  const realTop = -(hasEngine || ghost ? EH : 0) - SH - floors.length * FH;
  const antY = ghost ? top : realTop;
  g.lineStyle(4, 0x9aa5b1); g.lineBetween(0, antY, 0, antY - 34);
  const beacon = scene.add.image(0, antY - 36, 'glowTex').setTint(0xff4d5e).setScale(0.18).setBlendMode('ADD');
  c.add(beacon);
  scene.tweens.add({ targets: beacon, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });
  if (st.stage >= 3 || hasEngine) {
    c.add(T(scene, 62, realTop - 16, 'ورشة المدار', 14, HEX(0xff3fa4), { weight: 900, align: 'center', shadow: HEX(0xff3fa4) }));
  }
  const key = uniqueKey('tower');
  const p = paint(scene, key, 320, 660, 160, 620, (pg) => calls.forEach(([n, a]) => pg[n](...a)), { outline: 1.5, rim: 0x29f0ff, rim2: 0xff3fa4, res: (opts.scale ?? 1) > 0.8 ? 1.2 : 1 });
  c.addAt(painted(scene, 0, 0, p), 0);
  c.once('destroy', () => setTimeout(() => { if (scene.textures.exists(key)) scene.textures.remove(key); }, 0));
  const lightG = scene.add.image(0, -40, 'glowTex').setTint(0xffc94a).setAlpha(0.18).setScale(2.2).setBlendMode('ADD');
  c.addAt(lightG, 0);
  c.towerHeight = -antY + 40;
  c.engineY = 22;
  return c;
}
