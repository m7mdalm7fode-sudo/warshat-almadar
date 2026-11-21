import { T, COL, HEX } from './theme.js';
import { Sfx, vibrate } from '../audio.js';

export function makeButton(scene, x, y, label, o = {}) {
  const w = o.w || 220, h = o.h || 62, color = o.color ?? COL.cyan, r = o.r ?? 16;
  const c = scene.add.container(x, y);
  if (o.depth !== undefined) c.setDepth(o.depth);
  const g = scene.add.graphics();
  const draw = (state) => {
    g.clear();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(-w / 2 + 2, -h / 2 + 5, w, h, r);
    g.fillStyle(o.fill ?? 0x140e28, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.fillStyle(color, state === 'hover' ? 0.38 : state === 'down' ? 0.5 : 0.2);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.lineStyle(3, color, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    g.fillStyle(0xffffff, 0.08);
    g.fillRoundedRect(-w / 2 + 6, -h / 2 + 4, w - 12, h * 0.35, r * 0.6);
  };
  draw('idle');
  const t = T(scene, 0, 0, label, o.size || 22, o.textColor || '#ffffff', { bold: true, align: 'center', wrap: o.wrapText ? w - 16 : undefined });
  c.add([g, t]);
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.label = t;
  c.enabled = true;
  let down = false;
  c.on('pointerover', () => c.enabled && draw('hover'));
  c.on('pointerout', () => { down = false; draw('idle'); c.setScale(1); });
  c.on('pointerdown', () => {
    if (!c.enabled) return;
    down = true;
    draw('down');
    c.setScale(0.95);
  });
  c.on('pointerup', () => {
    if (!c.enabled || !down) return;
    down = false;
    draw('hover');
    c.setScale(1);
    Sfx.click();
    vibrate(12);
    if (o.onClick) o.onClick();
  });
  c.setEnabled = (v) => {
    c.enabled = v;
    c.setAlpha(v ? 1 : 0.4);
    draw('idle');
    return c;
  };
  c.setLabel = (s) => { t.setText(s); return c; };
  if (o.disabled) c.setEnabled(false);
  return c;
}

export const btnColor = { green: COL.green, red: COL.red, gold: COL.gold, cyan: COL.cyan, pink: COL.pink, purple: COL.purple };
export const _hex = HEX;
