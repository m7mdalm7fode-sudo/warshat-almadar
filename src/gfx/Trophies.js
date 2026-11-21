// رف الهدايا، الطائرة الحارسة، الفانوس، شريط الأخبار، ولوحة البلاغات
import { T, HEX, COL } from '../ui/theme.js';
import { paint, painted, addGlow } from './Painter.js';
import { TROPHIES, flavorNews } from '../systems/cases.js';

const ICONS = {
  gold_radio(g) {
    g.fillStyle(0xd4a62a); g.fillRoundedRect(-14, -10, 28, 20, 4);
    g.fillStyle(0x6b4a10); for (let x = -10; x < 0; x += 4) for (let y = -6; y < 8; y += 4) g.fillCircle(x, y, 1.2);
    g.fillStyle(0xfff1b0); g.fillCircle(7, 0, 4);
    g.lineStyle(2, 0xd4a62a); g.lineBetween(8, -10, 13, -18);
  },
  gold_falcon(g) {
    g.fillStyle(0x6b5a3a); g.fillRect(-10, 8, 20, 5);
    g.fillStyle(0xe8c34a);
    g.fillEllipse(0, 0, 14, 18); g.fillCircle(2, -10, 5);
    g.fillTriangle(5, -11, 10, -9, 5, -7);
    g.fillTriangle(-6, -4, -18, 6, -4, 6);
    g.fillStyle(0xfff1b0, 0.7); g.fillEllipse(-2, -2, 4, 8);
  },
  chip_frame(g) {
    g.fillStyle(0x8a6d3b); g.fillRect(-14, -12, 28, 24);
    g.fillStyle(0x1f6b45); g.fillRect(-10, -8, 20, 16);
    g.fillStyle(0x111318); g.fillRect(-5, -4, 10, 8);
    g.fillStyle(0xb36bff); g.fillCircle(0, 0, 2);
  },
  alien_crystal(g) {
    g.glow(0, -2, 18, 0x3dff8a, 0.4);
    g.fillStyle(0x7cffc0, 0.9); g.fillPoints([{ x: 0, y: -16 }, { x: 7, y: -2 }, { x: 3, y: 10 }, { x: -3, y: 10 }, { x: -7, y: -2 }]);
    g.fillStyle(0xffffff, 0.6); g.fillTriangle(0, -16, -3, -2, 2, -4);
    g.fillStyle(0x3a2e48); g.fillRect(-9, 10, 18, 4);
  },
  gold_dallah(g) {
    g.fillStyle(0xe8c34a);
    g.fillPoints([{ x: -8, y: 12 }, { x: 8, y: 12 }, { x: 6, y: -2 }, { x: -6, y: -2 }]);
    g.fillPoints([{ x: -4, y: -2 }, { x: 4, y: -2 }, { x: 3, y: -10 }, { x: -3, y: -10 }]);
    g.fillTriangle(-3, -12, 3, -12, 0, -18);
    g.fillPoints([{ x: -6, y: -2 }, { x: -8, y: -3 }, { x: -17, y: -12 }, { x: -15, y: -13 }]);
  },
  honor_medal(g) {
    g.fillStyle(0x29f0ff); g.fillTriangle(-8, -16, 0, -16, -2, -2); g.fillStyle(0xff3fa4); g.fillTriangle(8, -16, 0, -16, 2, -2);
    g.fillStyle(0xe8c34a); g.fillCircle(0, 4, 9);
    g.fillStyle(0xfff1b0); g.fillPoints([{ x: 0, y: -2 }, { x: 2, y: 3 }, { x: 6, y: 3 }, { x: 3, y: 6 }, { x: 4, y: 10 }, { x: 0, y: 7 }, { x: -4, y: 10 }, { x: -3, y: 6 }, { x: -6, y: 3 }, { x: -2, y: 3 }]);
  },
  pet_drone(g) {
    g.lineStyle(3, 0x44475a); g.lineBetween(-14, -6, 14, -6);
    g.fillStyle(0x9aa5b1, 0.6); g.fillEllipse(-14, -8, 14, 3); g.fillEllipse(14, -8, 14, 3);
    g.fillStyle(0xf08a24); g.fillRoundedRect(-9, -6, 18, 12, 5);
    g.fillStyle(0x0b1830); g.fillRoundedRect(-5, -3, 10, 5, 2);
    g.fillStyle(0x3dff8a); g.fillCircle(0, 8, 2);
  },
  lantern(g) {
    g.lineStyle(2, 0x6b5a3a); g.lineBetween(0, -24, 0, -14);
    g.fillStyle(0xc9a227); g.fillTriangle(-9, -10, 9, -10, 0, -16);
    g.fillStyle(0xfff1b0, 0.95); g.fillRoundedRect(-7, -10, 14, 20, 4);
    g.lineStyle(1.5, 0xc9a227); g.lineBetween(0, -10, 0, 10);
    g.fillStyle(0xc9a227); g.fillRoundedRect(-9, 9, 18, 4, 2);
  },
};

export function trophyIcon(scene, id) {
  return paint(scene, `trophy_${id}`, 48, 48, 24, 26, (g) => (ICONS[id] || ICONS.honor_medal)(g), { keep: true, res: 2.5, outline: 0.9 });
}

const SLOTS = [118, 150, 182, 214, 326, 358, 390, 422];

export function drawTrophies(scene, st) {
  const c = scene.add.container(0, 0).setDepth(13);
  const shelf = scene.add.graphics();
  shelf.fillStyle(0x8a6d3b); shelf.fillRect(96, 86, 348, 5);
  shelf.fillStyle(0xc9a26a, 0.7); shelf.fillRect(96, 86, 348, 1.5);
  c.add(shelf);
  const list = (st.trophies || []).filter((id) => id !== 'pet_drone' && id !== 'lantern');
  list.slice(0, SLOTS.length).forEach((id, i) => {
    const glow = scene.add.image(SLOTS[i], 74, 'glowTex').setTint(0xffc94a).setAlpha(0.22).setScale(0.35).setBlendMode('ADD');
    const ic = painted(scene, SLOTS[i], 74, trophyIcon(scene, id));
    c.add([glow, ic]);
    scene.tweens.add({ targets: glow, alpha: 0.4, duration: 1400 + i * 120, yoyo: true, repeat: -1 });
  });
  if ((st.trophies || []).includes('lantern')) {
    const lg = scene.add.image(112, 150, 'glowTex').setTint(0xffb050).setAlpha(0.35).setScale(1.3).setBlendMode('ADD');
    const lan = painted(scene, 112, 142, trophyIcon(scene, 'lantern')).setScale(1 / (2 * 2.5) * 1.3);
    c.add([lg, lan]);
    scene.tweens.add({ targets: lg, alpha: 0.22, scale: 1.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: lan, angle: { from: -4, to: 4 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  if ((st.trophies || []).includes('pet_drone')) {
    const dr = painted(scene, 150, 200, trophyIcon(scene, 'pet_drone')).setDepth(24).setScale(1 / (2 * 2.5) * 1.2);
    const light = scene.add.image(150, 214, 'glowTex').setTint(0x3dff8a).setAlpha(0.3).setScale(0.25).setBlendMode('ADD').setDepth(24);
    const fly = () => {
      if (!dr.active) return;
      const tx = 120 + Math.random() * 300, ty = 130 + Math.random() * 180;
      scene.tweens.add({ targets: dr, x: tx, y: ty, angle: tx > dr.x ? 8 : -8, duration: 1800 + Math.random() * 1500, ease: 'Sine.easeInOut', onComplete: fly });
    };
    fly();
    const follow = () => { if (dr.active) light.setPosition(dr.x, dr.y + 12); };
    scene.events.on('update', follow);
    c.once('destroy', () => {
      scene.events.off('update', follow);
      scene.tweens.killTweensOf(dr);
      dr.destroy(); light.destroy();
    });
  }
  return c;
}

/** شريط أخبار المدار المتحرك أسفل النافذة */
export function newsTicker(scene, st) {
  const y = 512;
  const bg = scene.add.graphics().setDepth(15);
  bg.fillStyle(0x07040f, 0.72); bg.fillRect(90, y - 10, 360, 20);
  bg.fillStyle(COL.red, 1); bg.fillRect(390, y - 10, 60, 20);
  const label = T(scene, 420, y, 'أخبار المدار', 10, '#ffffff', { weight: 900, align: 'center' }).setDepth(16);
  const maskG = scene.make.graphics({}, false);
  maskG.fillRect(90, y - 10, 300, 20);
  const mask = maskG.createGeometryMask();
  const items = [...(st.news || []).slice(-4).reverse(), ...flavorNews()];
  let idx = 0;
  const t = T(scene, 0, y, '', 11, '#ffe28a', { bold: true, ox: 1 }).setDepth(16);
  t.setMask(mask);
  const run = () => {
    if (!t.active) return;
    t.setText(`◆ ${items[idx % items.length]}`);
    idx += 1;
    t.x = 90;
    scene.tweens.add({ targets: t, x: 390 + t.displayWidth, duration: (300 + t.displayWidth) * 22, ease: 'Linear', onComplete: run });
  };
  run();
  return { bg, label, t };
}

/** لوحة البلاغات على الجدار */
export function reportsBoard(scene, onOpen) {
  const c = scene.add.container(495, 486).setDepth(14);
  const p = paint(scene, 'boardTex', 80, 80, 40, 40, (g) => {
    g.fillStyle(0x6b4a2a); g.fillRoundedRect(-36, -32, 72, 64, 6);
    g.fillStyle(0xb98a52); g.fillRoundedRect(-31, -27, 62, 54, 4);
    [[-24, -20, 0xf2efe6, -0.08], [-2, -22, 0xfff1b0, 0.06], [-20, 2, 0xf2efe6, 0.05], [4, 0, 0xffd0d0, -0.05]].forEach(([x, y, col]) => {
      g.fillStyle(col); g.fillRect(x, y, 20, 20);
      g.lineStyle(1, 0x555555, 0.6); g.lineBetween(x + 3, y + 7, x + 17, y + 7); g.lineBetween(x + 3, y + 12, x + 14, y + 12);
      g.fillStyle(0xff4d5e); g.fillCircle(x + 10, y + 2, 2.2);
    });
  }, { keep: true, res: 2, outline: 1 });
  const img = painted(scene, 0, 0, p);
  const title = T(scene, 0, 42, 'البلاغات', 11, '#ffd0d0', { weight: 900, align: 'center', stroke: '#07040f', strokeW: 3 });
  const badge = scene.add.container(30, -30);
  const bg = scene.add.graphics(); bg.fillStyle(COL.red); bg.fillCircle(0, 0, 9);
  const bt = T(scene, 0, 0, '0', 11, '#ffffff', { weight: 900, align: 'center' });
  badge.add([bg, bt]);
  c.add([img, title, badge]);
  c.setSize(80, 90).setInteractive({ useHandCursor: true });
  c.on('pointerup', onOpen);
  c.setCount = (n) => { bt.setText(String(n)); badge.setVisible(n > 0); };
  c.pulse = (on) => {
    if (c.pt) { c.pt.stop(); c.pt = null; c.setScale(1); }
    if (on) c.pt = scene.tweens.add({ targets: c, scale: 1.12, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };
  return c;
}

export { TROPHIES };
export const _G = addGlow;
export const _H = HEX;
