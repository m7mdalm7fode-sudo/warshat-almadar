// 2) التنظيف: امسح الصدأ والأوساخ باللمس حتى 100%
import Phaser from 'phaser';
import BaseMinigame from './BaseMinigame.js';
import { T, COL, HEX } from '../ui/theme.js';
import { drawItem } from '../gfx/ItemArt.js';
import { Sfx, vibrate } from '../audio.js';

const SIZE = 400, RAD = 186, CELL = 20;

export default class CleanGame extends BaseMinigame {
  static baseTime = 28;
  get title() { return 'التنظيف'; }
  get hint() { return 'امسح الصدأ والأوساخ بإصبعك. البقع الحمراء تحتاج فرك أكثر!'; }

  start() {
    const s = this.s, A = this.A;
    this.cx = 270; this.cy = A.y + 290;
    const item = drawItem(s, this.cfg.itemKind || 'cooler');
    item.setPosition(this.cx, this.cy).setScale(2.2);

    this.ox = this.cx - SIZE / 2; this.oy = this.cy - SIZE / 2;
    this.rt = s.add.renderTexture(this.ox, this.oy, SIZE, SIZE).setOrigin(0, 0);
    const g = s.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x5e4126, 0.97); g.fillCircle(SIZE / 2, SIZE / 2, RAD);
    const dirt = [0x4a3520, 0x6e5233, 0x7a5a35, 0x3d2c1a, 0x5a4a2a];
    for (let i = 0; i < 160; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (RAD - 24);
      g.fillStyle(dirt[i % dirt.length], 0.7);
      g.fillCircle(SIZE / 2 + Math.cos(a) * r, SIZE / 2 + Math.sin(a) * r, 8 + Math.random() * 22);
    }
    // بقع صدأ تحتاج فرك أكثر
    this.rust = [];
    const nr = 3 + Math.round(this.d * 4);
    for (let i = 0; i < nr; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * (RAD - 60);
      const x = SIZE / 2 + Math.cos(a) * r, y = SIZE / 2 + Math.sin(a) * r, rr = 26 + Math.random() * 18;
      this.rust.push({ x, y, r: rr });
      g.fillStyle(0x9c3d14, 0.95); g.fillCircle(x, y, rr);
      g.fillStyle(0xc0561e, 0.8);
      for (let k = 0; k < 8; k++) g.fillCircle(x + (Math.random() - 0.5) * rr * 1.4, y + (Math.random() - 0.5) * rr * 1.4, 4 + Math.random() * 6);
    }
    this.rt.draw(g);
    g.destroy();

    // شبكة الخلايا لحساب نسبة النظافة
    this.cells = [];
    const base = 4 + Math.round(this.d * 3);
    this.total = 0;
    for (let y = CELL / 2; y < SIZE; y += CELL) {
      for (let x = CELL / 2; x < SIZE; x += CELL) {
        const dx = x - SIZE / 2, dy = y - SIZE / 2;
        if (dx * dx + dy * dy > (RAD - 6) * (RAD - 6)) continue;
        let hp = base;
        if (this.rust.some((r) => (x - r.x) ** 2 + (y - r.y) ** 2 < r.r * r.r)) hp = base * 2 + 1;
        this.cells.push({ x, y, hp, dmg: 0 });
        this.total += hp;
      }
    }
    this.done = 0;

    this.brushR = 40 - this.d * 10;
    this.brush = s.make.image({ key: 'brush', add: false }).setScale(this.brushR / 48);
    this.sparkle = s.add.particles(0, 0, 'px', {
      speed: { min: 40, max: 160 }, scale: { start: 0.5, end: 0 }, lifespan: 500,
      tint: [0xffffff, 0x29f0ff, 0xffe680], blendMode: 'ADD', emitting: false,
    }).setDepth(30);

    this.pctT = T(s, 270, A.y + 560, 'النظافة: 0%', 24, HEX(COL.cyan), { weight: 900, align: 'center' });
    this.barG = s.add.graphics();
    this.drawBar();

    this.down = false;
    this.last = null;
    s.input.on('pointerdown', (p) => { this.down = true; this.last = { x: p.worldX, y: p.worldY }; this.scrubAt(p.worldX, p.worldY); });
    s.input.on('pointermove', (p) => {
      if (!this.down || this.over) return;
      const nx = p.worldX, ny = p.worldY;
      const dx = nx - this.last.x, dy = ny - this.last.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / 9));
      for (let i = 1; i <= steps; i++) this.scrubAt(this.last.x + (dx * i) / steps, this.last.y + (dy * i) / steps);
      this.last = { x: nx, y: ny };
    });
    s.input.on('pointerup', () => { this.down = false; });
  }

  scrubAt(wx, wy) {
    if (this.over || this.completed) return;
    const lx = wx - this.ox, ly = wy - this.oy;
    if (lx < -40 || ly < -40 || lx > SIZE + 40 || ly > SIZE + 40) return;
    this.rt.erase(this.brush, lx, ly);
    const r2 = (this.brushR * 0.85) ** 2;
    let hit = false;
    for (const c of this.cells) {
      if (c.dmg >= c.hp) continue;
      if ((c.x - lx) ** 2 + (c.y - ly) ** 2 < r2) { c.dmg += 1; this.done += 1; hit = true; }
    }
    if (hit) {
      Sfx.scrub();
      if (Math.random() < 0.25) this.sparkle.emitParticleAt(wx, wy, 2);
      this.drawBar();
    }
  }

  get progress() { return this.total ? this.done / this.total : 1; }

  drawBar() {
    const p = Math.min(1, this.progress);
    const shown = p >= 0.97 ? 100 : Math.floor(p * 100);
    this.pctT.setText(`النظافة: ${shown}%`);
    const g = this.barG, y = this.A.y + 600;
    g.clear();
    g.fillStyle(0x07040f); g.fillRoundedRect(70, y, 400, 22, 11);
    g.fillStyle(p > 0.8 ? COL.green : COL.cyan); g.fillRoundedRect(70, y, Math.max(12, 400 * p), 22, 11);
    if (p >= 0.97 && !this.completed) {
      this.completed = true;
      this.rt.clear();
      this.sparkle.explode(40, this.cx, this.cy);
      vibrate(30);
      this.s.time.delayedCall(350, () => this.win(1));
    }
  }

  timeout() {
    const p = this.progress;
    return { success: p >= 0.6, accuracy: p };
  }
}

export const _P = Phaser;
