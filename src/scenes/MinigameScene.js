import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera } from '../ui/theme.js';
import { Sfx, vibrate } from '../audio.js';
import { paint, painted, addGlow, addVignette } from '../gfx/Painter.js';
import LockGame from '../minigames/LockGame.js';
import CleanGame from '../minigames/CleanGame.js';
import ScrewsGame from '../minigames/ScrewsGame.js';
import WiresGame from '../minigames/WiresGame.js';
import SwapGame from '../minigames/SwapGame.js';
import CalibrateGame from '../minigames/CalibrateGame.js';

export const GAMES = { lock: LockGame, clean: CleanGame, screws: ScrewsGame, wires: WiresGame, swap: SwapGame, calibrate: CalibrateGame };

export const AREA = { x: 30, y: 165, w: 480, h: 705 };

export default class MinigameScene extends Phaser.Scene {
  constructor() { super('Minigame'); }

  create(data) {
    setupCamera(this, 0x000000);
    this.cameras.main.transparent = true;
    this.cfg = data;
    const Cls = GAMES[data.type] || GAMES.clean;

    this.add.rectangle(0, 0, W, H, 0x05030c, 0.9).setOrigin(0).setInteractive();
    const pp = paint(this, 'mgPanel', W, H, 0, 0, (g, ctx) => {
      const bg = ctx.createLinearGradient(0, 66, 0, H - 18);
      bg.addColorStop(0, '#1d1440'); bg.addColorStop(1, '#0b0718');
      ctx.fillStyle = bg;
      g.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(16, 66, W - 32, H - 84, 24) : ctx.rect(16, 66, W - 32, H - 84); ctx.fill(); g.restore();
      g.lineStyle(1, COL.cyan, 0.07);
      for (let x = 30; x < W - 20; x += 30) g.lineBetween(x, 160, x, H - 30);
      for (let y = 160; y < H - 20; y += 30) g.lineBetween(24, y, W - 24, y);
      g.glow(W / 2, 110, 220, COL.cyan, 0.12);
      g.lineStyle(8, COL.cyan, 0.15); g.strokeRoundedRect(16, 66, W - 32, H - 84, 24);
      g.lineStyle(3, COL.cyan, 0.9); g.strokeRoundedRect(16, 66, W - 32, H - 84, 24);
      g.fillStyle(COL.cyan, 0.9);
      [[30, 80], [W - 30, 80], [30, H - 32], [W - 30, H - 32]].forEach(([x, y]) => g.fillCircle(x, y, 3));
    }, { keep: true, light: false });
    painted(this, 0, 0, pp);

    const mult = data.mods.timeMult * (1 - 0.2 * data.difficulty);
    this.limit = Math.round(Cls.baseTime * mult);
    this.timeLeft = this.limit;
    this.running = false;

    this.game0 = new Cls(this, {
      difficulty: data.difficulty,
      mods: data.mods,
      area: AREA,
      itemKind: data.itemKind,
      finish: (s, a) => this.finish(s, a),
    });

    addGlow(this, T(this, W / 2, 100, this.game0.title, 30, '#bffaff', { weight: 900, align: 'center', shadow: HEX(COL.cyan) }), COL.cyan, 3);
    this.hint = T(this, W / 2, 140, this.game0.hint, 15, '#c6d2f2', { wrap: 460, align: 'center' });

    // شريط الوقت
    this.barG = this.add.graphics().setDepth(50);
    this.timeT = T(this, W - 40, H - 40, '', 16, '#eaf6ff', { bold: true, ox: 1 }).setDepth(50);

    // قفاز المؤشر
    this.glove = this.add.image(-100, -100, 'glove').setDepth(400).setOrigin(0.15, 0.1).setAlpha(0.95).setScale(1 / 2.4);
    this.input.on('pointermove', (p) => this.glove.setPosition(p.worldX + 6, p.worldY + 8));
    this.input.on('pointerdown', (p) => { this.glove.setPosition(p.worldX + 6, p.worldY + 8); this.glove.setScale(0.9 / 2.4); });
    this.input.on('pointerup', () => this.glove.setScale(1 / 2.4));

    this.game0.start();
    this.running = true;
    this.lastBeep = 99;
    this.cameras.main.fadeIn(200);
  }

  setHint(s) { this.hint.setText(s); }

  update(time, delta) {
    if (!this.running) return;
    const dt = delta / 1000;
    this.timeLeft -= dt;
    if (this.game0.update) this.game0.update(dt);
    const f = Math.max(0, this.timeLeft / this.limit);
    const g = this.barG;
    g.clear();
    g.fillStyle(0x07040f, 1); g.fillRoundedRect(40, H - 54, 380, 18, 9);
    const col = f > 0.5 ? COL.green : f > 0.25 ? COL.gold : COL.red;
    g.fillStyle(col, 1); g.fillRoundedRect(40, H - 54, Math.max(10, 380 * f), 18, 9);
    this.timeT.setText(`${Math.ceil(Math.max(0, this.timeLeft))} ث`);
    const sec = Math.ceil(this.timeLeft);
    if (sec <= 5 && sec !== this.lastBeep && sec > 0) { this.lastBeep = sec; Sfx.beep(1200, 0.06); }
    if (this.timeLeft <= 0) {
      const r = this.game0.timeout();
      this.finish(r.success, r.accuracy, true);
    }
  }

  finish(success, accuracy, timedOut = false) {
    if (!this.running) return;
    this.running = false;
    if (this.game0) this.game0.over = true;
    const timeUsed = this.limit - Math.max(0, this.timeLeft);
    const speed = Math.max(0, this.timeLeft) / this.limit;
    const score = success ? Phaser.Math.Clamp(accuracy * 0.7 + speed * 0.3 + 0.08, 0, 1) : 0;
    let label, color;
    if (!success) { label = timedOut ? 'انتهى الوقت!' : 'فشل الإصلاح'; color = COL.red; Sfx.fail(); vibrate([80, 50, 80]); }
    else if (score >= 0.85) { label = 'ممتاز! ★★★'; color = COL.gold; Sfx.success(); vibrate(40); }
    else if (score >= 0.6) { label = 'أحسنت ★★'; color = COL.green; Sfx.success(); }
    else { label = 'تمّ الإصلاح ★'; color = COL.cyan; Sfx.success(); }

    const c = this.add.container(W / 2, H / 2).setDepth(500);
    const g = this.add.graphics();
    g.fillStyle(0x07040f, 0.95); g.fillRoundedRect(-210, -70, 420, 140, 24);
    g.lineStyle(4, color, 1); g.strokeRoundedRect(-210, -70, 420, 140, 24);
    c.add(g);
    c.add(T(this, 0, -18, label, 34, HEX(color), { weight: 900, align: 'center', shadow: HEX(color) }));
    c.add(T(this, 0, 34, success ? `الدقة ${Math.round(accuracy * 100)}% · السرعة ${Math.round(speed * 100)}%` : 'الزبون لن يكون سعيداً...', 16, '#c6d2f2', { align: 'center' }));
    c.setScale(0.4);
    this.tweens.add({ targets: c, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(200);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const cb = this.cfg.onDone;
        this.scene.stop();
        cb({ success, accuracy, score, timeUsed });
      });
    });
  }
}
