// 6) معايرة الطاقة: أوقف المؤشر في المنطقة الخضراء 3 مرات
import Phaser from 'phaser';
import BaseMinigame from './BaseMinigame.js';
import { T, COL, HEX } from '../ui/theme.js';
import { makeButton } from '../ui/Button.js';
import { Sfx, vibrate } from '../audio.js';

const D = Phaser.Math.DegToRad;
const MIN = -165, MAX = -15;

export default class CalibrateGame extends BaseMinigame {
  static baseTime = 30;
  get title() { return 'معايرة الطاقة'; }
  get hint() { return 'اضغط «أوقف!» لما يكون المؤشر داخل المنطقة الخضراء. تحتاج 3 إصابات.'; }

  start() {
    const s = this.s, A = this.A;
    this.cx = 270; this.cy = A.y + 330; this.R = 190;
    this.hits = 0;
    this.needed = 3;
    this.angle = MIN;
    this.dir = 1;
    this.speed = 120 + this.d * 100;
    this.zoneW = 28 - this.d * 12;
    this.closeness = [];
    this.paused = false;

    const core = s.add.graphics();
    core.fillStyle(0x29f0ff, 0.06); core.fillCircle(this.cx, this.cy + 40, 150);
    this.coreGlow = s.add.image(this.cx, this.cy + 40, 'soft').setTint(0x29f0ff).setScale(2.2).setAlpha(0.35).setBlendMode('ADD');
    s.tweens.add({ targets: this.coreGlow, alpha: 0.6, scale: 2.5, duration: 700, yoyo: true, repeat: -1 });
    core.fillStyle(0x23262d); core.fillCircle(this.cx, this.cy + 40, 70);
    core.fillStyle(0x0b1830); core.fillCircle(this.cx, this.cy + 40, 56);
    core.lineStyle(3, COL.cyan, 0.6); core.strokeCircle(this.cx, this.cy + 40, 56);

    const g = s.add.graphics();
    g.lineStyle(30, 0x1b1d2a, 1);
    g.beginPath(); g.arc(this.cx, this.cy, this.R, D(MIN - 4), D(MAX + 4)); g.strokePath();
    g.lineStyle(2, 0x8a94b8, 0.8);
    for (let a = MIN; a <= MAX; a += 10) {
      const r0 = this.R + 18, r1 = this.R + (a % 30 === 0 ? 32 : 26);
      g.lineBetween(this.cx + Math.cos(D(a)) * r0, this.cy + Math.sin(D(a)) * r0, this.cx + Math.cos(D(a)) * r1, this.cy + Math.sin(D(a)) * r1);
    }
    this.zoneG = s.add.graphics();
    this.needle = s.add.graphics();
    this.needle.fillStyle(0xff4d5e); this.needle.fillTriangle(0, -6, 0, 6, this.R + 6, 0);
    this.needle.fillStyle(0xeaf6ff); this.needle.fillCircle(0, 0, 14);
    this.needle.setPosition(this.cx, this.cy);

    this.lampG = s.add.graphics();
    this.drawLamps();
    this.newZone();

    this.btn = makeButton(s, 270, A.y + 600, 'أوقف!', { w: 300, h: 76, color: COL.green, size: 30, onClick: () => this.stop() });
    this.feedback = T(s, 270, A.y + 470, '', 24, HEX(COL.green), { weight: 900, align: 'center' });
    s.input.keyboard && s.input.keyboard.on('keydown-SPACE', () => this.stop());
  }

  newZone() {
    const half = this.zoneW / 2;
    this.zc = Phaser.Math.FloatBetween(MIN + half + 8, MAX - half - 8);
    const g = this.zoneG;
    g.clear();
    g.lineStyle(30, COL.green, 0.9);
    g.beginPath(); g.arc(this.cx, this.cy, this.R, D(this.zc - half), D(this.zc + half)); g.strokePath();
    g.lineStyle(10, COL.gold, 0.9);
    g.beginPath(); g.arc(this.cx, this.cy, this.R, D(this.zc - half * 0.25), D(this.zc + half * 0.25)); g.strokePath();
  }

  drawLamps() {
    const g = this.lampG;
    g.clear();
    for (let i = 0; i < this.needed; i++) {
      const x = 270 + (i - 1) * 70, y = this.A.y + 420;
      g.fillStyle(0x07040f); g.fillCircle(x, y, 20);
      g.fillStyle(i < this.hits ? COL.green : 0x2b2f36); g.fillCircle(x, y, 15);
      if (i < this.hits) { g.fillStyle(COL.green, 0.25); g.fillCircle(x, y, 28); }
    }
  }

  update(dt) {
    if (this.over || this.paused) return;
    this.angle += this.dir * this.speed * dt;
    if (this.angle > MAX) { this.angle = MAX; this.dir = -1; }
    if (this.angle < MIN) { this.angle = MIN; this.dir = 1; }
    this.needle.rotation = D(this.angle);
  }

  stop() {
    if (this.over || this.paused) return;
    const half = this.zoneW / 2;
    const off = Math.abs(this.angle - this.zc);
    this.paused = true;
    if (off <= half) {
      const close = 1 - off / half;
      this.closeness.push(close);
      this.hits += 1;
      this.drawLamps();
      Sfx.beep(900 + this.hits * 200, 0.12);
      vibrate(25);
      this.feedback.setText(close > 0.7 ? 'دقيق جداً!' : 'إصابة!').setColor(HEX(close > 0.7 ? COL.gold : COL.green));
      this.s.tweens.add({ targets: this.coreGlow, scale: 3.2, duration: 150, yoyo: true });
      if (this.hits >= this.needed) {
        const avg = this.closeness.reduce((a, b) => a + b, 0) / this.closeness.length;
        this.s.time.delayedCall(500, () => this.win(avg * 0.5 + 0.55 - this.mistakes * 0.1));
        return;
      }
      this.speed *= 1.15;
      this.zoneW = Math.max(10, this.zoneW - 2);
      this.s.time.delayedCall(450, () => { this.newZone(); this.paused = false; this.feedback.setText(''); });
    } else {
      this.mistakes += 1;
      Sfx.error();
      vibrate(70);
      this.s.cameras.main.shake(100, 0.004);
      this.feedback.setText(`خارج المنطقة! (${this.mistakes}/5)`).setColor(HEX(COL.red));
      if (this.mistakes >= 5) { this.s.time.delayedCall(400, () => this.lose()); return; }
      this.s.time.delayedCall(350, () => { this.paused = false; });
    }
  }
}
