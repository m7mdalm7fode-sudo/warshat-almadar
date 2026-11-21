import { W, H, T, COL, HEX } from './theme.js';
import { makeButton } from './Button.js';

export function floatText(scene, x, y, str, color = '#ffd34a', size = 28) {
  const t = T(scene, x, y, str, size, color, { weight: 900, align: 'center', stroke: '#07040f', strokeW: 6 }).setDepth(150);
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 1500, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  return t;
}

export function banner(scene, str, color = COL.cyan, ms = 1400) {
  const c = scene.add.container(W / 2, H * 0.42).setDepth(180);
  const g = scene.add.graphics();
  g.fillStyle(0x07040f, 0.92); g.fillRoundedRect(-230, -42, 460, 84, 20);
  g.lineStyle(3, color, 1); g.strokeRoundedRect(-230, -42, 460, 84, 20);
  const t = T(scene, 0, 0, str, 28, HEX(color), { weight: 900, align: 'center', shadow: HEX(color) });
  c.add([g, t]);
  c.setScale(0.5).setAlpha(0);
  scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  scene.time.delayedCall(ms, () => scene.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() }));
  return c;
}

/**
 * نافذة منبثقة تمنع اللمس خلفها
 * buttons: [{label, color, onClick, keepOpen}]
 */
export function modal(scene, { title, body, buttons = [], width = 470, extra }) {
  scene.modalOpen = true;
  const c = scene.add.container(0, 0).setDepth(300);
  const blocker = scene.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive();
  c.add(blocker);
  const bodyT = body ? T(scene, W / 2 + width / 2 - 26, 0, body, 18, '#d8e2ff', { wrap: width - 52, ox: 1, oy: 0, lineSpacing: 4 }) : null;
  const bodyH = bodyT ? bodyT.displayHeight : 0;
  const extraH = extra ? extra.h : 0;
  const h = 100 + bodyH + extraH + buttons.length * 70 + 10;
  const top = H / 2 - h / 2;
  const g = scene.add.graphics();
  g.fillStyle(0x120c26, 0.98); g.fillRoundedRect(W / 2 - width / 2, top, width, h, 22);
  g.lineStyle(3, COL.pink, 0.9); g.strokeRoundedRect(W / 2 - width / 2, top, width, h, 22);
  c.add(g);
  const tt = T(scene, W / 2, top + 40, title || '', 26, HEX(COL.gold), { weight: 900, align: 'center' });
  c.add(tt);
  if (bodyT) { bodyT.y = top + 72; c.add(bodyT); }
  if (extra) { extra.build(c, top + 80 + bodyH); }
  const close = () => { scene.modalOpen = false; c.destroy(); };
  buttons.forEach((b, i) => {
    const by = top + 100 + bodyH + extraH + i * 70 + 26;
    const btn = makeButton(scene, W / 2, by, b.label, {
      w: width - 80, h: 56, color: b.color ?? COL.cyan, size: 20,
      onClick: () => { if (!b.keepOpen) close(); if (b.onClick) b.onClick(); },
    });
    c.add(btn);
  });
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 200 });
  c.close = close;
  return c;
}
