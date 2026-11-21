// 5) تبديل القطعة التالفة: اسحب القطعة المحترقة للسلة، ثم اسحب القطعة الصحيحة من الدرج إلى مكانها
import Phaser from 'phaser';
import BaseMinigame from './BaseMinigame.js';
import { T, COL, HEX, shade } from '../ui/theme.js';
import { Sfx, vibrate } from '../audio.js';
import { paint, painted } from '../gfx/Painter.js';

const PCOLORS = [0x29f0ff, 0xff3fa4, 0xffc94a, 0x3dff8a];
const PINS = [2, 4, 6, 8];

function drawPart(g, p, broken = false) {
  const col = broken ? shade(PCOLORS[p.color], -0.55) : PCOLORS[p.color];
  const body = broken ? 0x2a2522 : 0x7d8796;
  // الأرجل
  g.fillStyle(broken ? 0x4a4a4a : 0xc9cfd8);
  const half = p.pins / 2;
  for (let i = 0; i < half; i++) {
    const x = -24 + (48 / (half - 1 || 1)) * i - (half === 1 ? -24 : 0);
    g.fillRect(x - 2.5, -42, 5, 14);
    g.fillRect(x - 2.5, 28, 5, 14);
  }
  g.fillStyle(body);
  switch (p.shape) {
    case 0: g.fillRoundedRect(-30, -30, 60, 60, 6); break;
    case 1: {
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; pts.push({ x: Math.cos(a) * 34, y: Math.sin(a) * 34 }); }
      g.fillPoints(pts, true); break;
    }
    case 2: g.fillCircle(0, 0, 32); break;
    default: g.fillPoints([{ x: 0, y: -36 }, { x: 36, y: 0 }, { x: 0, y: 36 }, { x: -36, y: 0 }], true); break;
  }
  g.fillStyle(0xffffff, broken ? 0.04 : 0.18);
  g.fillCircle(-10, -12, 10);
  g.fillStyle(col, 1);
  g.fillRoundedRect(-18, -6, 36, 12, 4);
  g.fillStyle(col, 0.5);
  g.fillCircle(0, -18, 5);
  if (broken) {
    g.fillStyle(0x000000, 0.6);
    g.fillCircle(-10, 12, 9); g.fillCircle(12, -10, 7);
    g.lineStyle(2, 0xff7a2f, 0.8);
    g.lineBetween(-14, -20, -2, -4); g.lineBetween(-2, -4, -10, 6);
  }
}

const same = (a, b) => a.shape === b.shape && a.color === b.color && a.pins === b.pins;

export default class SwapGame extends BaseMinigame {
  static baseTime = 34;
  get title() { return 'تبديل القطعة التالفة'; }
  get hint() { return 'اسحب القطعة المحترقة إلى السلة.'; }

  start() {
    const s = this.s, A = this.A;
    this.rounds = this.d >= 0.45 ? 2 : 1;
    this.round = 0;
    this.slot = { x: 230, y: A.y + 165 };
    this.bin = { x: 430, y: A.y + 165 };
    this.drawerTop = A.y + 340;

    const g = s.add.graphics();
    // لوحة الدائرة
    g.fillStyle(0x0f4a32); g.fillRoundedRect(46, A.y + 10, 448, 310, 16);
    g.lineStyle(3, 0xc9a227, 0.55);
    for (let i = 0; i < 9; i++) {
      const y = A.y + 40 + i * 32;
      g.lineBetween(60, y, 120 + Math.random() * 80, y);
      g.lineBetween(320 + Math.random() * 40, y, 380, y);
    }
    g.fillStyle(0xc9a227); for (let i = 0; i < 14; i++) g.fillCircle(60 + Math.random() * 320, A.y + 30 + Math.random() * 270, 4);
    // المقبس
    g.fillStyle(0x07140e); g.fillRoundedRect(this.slot.x - 54, this.slot.y - 58, 108, 116, 12);
    g.lineStyle(3, 0x3dff8a, 0.6); g.strokeRoundedRect(this.slot.x - 54, this.slot.y - 58, 108, 116, 12);
    // السلة
    g.fillStyle(0x2b2f36); g.fillRoundedRect(this.bin.x - 44, this.bin.y - 40, 88, 96, 10);
    g.fillStyle(0x44475a); g.fillRoundedRect(this.bin.x - 52, this.bin.y - 52, 104, 16, 6);
    g.lineStyle(3, 0x5c6b73); for (let x = -24; x <= 24; x += 16) g.lineBetween(this.bin.x + x, this.bin.y - 26, this.bin.x + x, this.bin.y + 44);
    T(s, this.bin.x, this.bin.y + 74, 'السلة', 14, '#8a94b8', { align: 'center' });
    // الدرج
    g.fillStyle(0x3a2e22); g.fillRoundedRect(40, this.drawerTop, 460, 300, 16);
    g.fillStyle(0x251c14); g.fillRoundedRect(52, this.drawerTop + 34, 436, 254, 10);
    g.fillStyle(0x9aa5b1); g.fillRoundedRect(230, this.drawerTop + 10, 80, 12, 6);
    T(s, 270, this.drawerTop + 300 + 22, 'الدرج', 14, '#8a94b8', { align: 'center' });

    this.smoke = s.add.particles(0, 0, 'soft', {
      speed: { min: 10, max: 40 }, angle: { min: 250, max: 290 }, scale: { start: 0.25, end: 0.7 },
      alpha: { start: 0.45, end: 0 }, lifespan: 1400, frequency: 140, tint: 0x555566,
    }).setDepth(25);
    this.parts = [];
    this.setupRound();

    s.input.on('drag', (p, obj, dx, dy) => { if (!this.over) obj.setPosition(dx, dy); });
    s.input.on('dragstart', (p, obj) => { obj.setDepth(40).setScale(1.12); Sfx.tick(); });
    s.input.on('dragend', (p, obj) => this.drop(obj));
  }

  randPart() {
    return { shape: Phaser.Math.Between(0, 3), color: Phaser.Math.Between(0, 3), pins: PINS[Phaser.Math.Between(0, 3)] };
  }

  makePartObj(p, x, y, broken) {
    const s = this.s;
    const c = s.add.container(x, y).setDepth(broken ? 22 : 20);
    const key = `part_${p.shape}_${p.color}_${p.pins}_${broken ? 1 : 0}`;
    const tex = paint(s, key, 100, 100, 50, 50, (g) => {
      if (!broken) g.glow(0, 0, 48, PCOLORS[p.color], 0.18);
      drawPart(g, p, broken);
    }, { keep: true, res: 1.6, outline: 1.3, rim: 0x29f0ff });
    c.add(painted(s, 0, 0, tex));
    c.setSize(84, 90).setInteractive({ draggable: true, useHandCursor: true });
    c.part = p; c.broken = broken; c.home = { x, y };
    return c;
  }

  setupRound() {
    const s = this.s;
    this.parts.forEach((o) => o.destroy());
    this.parts = [];
    this.correct = this.randPart();
    this.phase = 'remove';
    s.setHint(this.rounds > 1 ? `القطعة ${this.round + 1} من ${this.rounds}: اسحب المحترقة إلى السلة.` : 'اسحب القطعة المحترقة إلى السلة.');
    this.brokenObj = this.makePartObj(this.correct, this.slot.x, this.slot.y, true);
    this.smoke.startFollow(this.brokenObj, 0, -20);
    this.smoke.start();

    const nDecoy = 3 + Math.round(this.d * 4);
    const pool = [this.correct];
    let guard = 0;
    while (pool.length < nDecoy + 1 && guard++ < 300) {
      const q = { ...this.correct };
      const keys = Phaser.Utils.Array.Shuffle(['shape', 'color', 'pins']);
      const changes = this.d >= 0.5 ? 1 : 2;
      for (let i = 0; i < changes; i++) {
        const k = keys[i];
        if (k === 'pins') q.pins = PINS[Phaser.Math.Between(0, 3)];
        else q[k] = Phaser.Math.Between(0, 3);
      }
      if (!pool.some((o) => same(o, q))) pool.push(q);
    }
    Phaser.Utils.Array.Shuffle(pool);
    const cols = 4;
    let dimmed = 0;
    pool.forEach((p, i) => {
      const row = Math.floor(i / cols), col = i % cols;
      const x = 270 + (col - 1.5) * 108;
      const y = this.drawerTop + 98 + row * 126;
      const o = this.makePartObj(p, x, y, false);
      o.setAlpha(0.55);
      this.s.input.setDraggable(o, false);
      if (this.mods.swapHint && dimmed < this.mods.swapHint && !same(p, this.correct)) {
        o.excluded = true; dimmed += 1;
      }
      this.parts.push(o);
    });
  }

  enableDrawer() {
    this.parts.forEach((o) => {
      if (o.excluded) { o.setAlpha(0.18); return; }
      o.setAlpha(1);
      this.s.input.setDraggable(o, true);
    });
  }

  back(obj) {
    this.s.tweens.add({ targets: obj, x: obj.home.x, y: obj.home.y, scale: 1, duration: 220, ease: 'Back.easeOut', onComplete: () => obj.setDepth(obj.broken ? 22 : 20) });
  }

  drop(obj) {
    if (this.over) return;
    const dist = (a) => Math.hypot(obj.x - a.x, obj.y - a.y);
    if (obj.broken) {
      if (dist(this.bin) < 85) {
        this.smoke.stop();
        this.smoke.stopFollow();
        Sfx.drop();
        this.s.tweens.add({ targets: obj, x: this.bin.x, y: this.bin.y, scale: 0.3, alpha: 0, duration: 250, onComplete: () => obj.destroy() });
        this.phase = 'insert';
        this.s.setHint('ممتاز! الآن اسحب القطعة المطابقة تماماً (الشكل، اللون، عدد الأرجل) إلى المقبس.');
        this.enableDrawer();
      } else this.back(obj);
      return;
    }
    if (this.phase !== 'insert') { this.back(obj); return; }
    if (dist(this.slot) < 75) {
      if (same(obj.part, this.correct)) {
        obj.disableInteractive();
        Sfx.connect();
        vibrate(25);
        this.s.tweens.add({ targets: obj, x: this.slot.x, y: this.slot.y, scale: 1, duration: 150 });
        this.s.cameras.main.flash(150, 61, 255, 138);
        this.round += 1;
        if (this.round >= this.rounds) this.s.time.delayedCall(450, () => this.win(1 - this.mistakes * 0.2));
        else this.s.time.delayedCall(700, () => { obj.destroy(); this.setupRound(); });
        this.parts = this.parts.filter((o) => o !== obj);
      } else {
        this.mistakes += 1;
        Sfx.error();
        vibrate(70);
        this.s.cameras.main.shake(120, 0.004);
        this.s.setHint('قطعة غير مطابقة! قارن الشكل واللون وعدد الأرجل.');
        this.back(obj);
      }
    } else this.back(obj);
  }

  timeout() { return { success: false, accuracy: 0 }; }
}

export const _H = HEX;
export const _C = COL;
