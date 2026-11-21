// 1) فك قفل جهاز: لغز رقم سري من 4 خانات بتلميحات (Mastermind مبسّط)
import Phaser from 'phaser';
import BaseMinigame from './BaseMinigame.js';
import { T, COL, HEX } from '../ui/theme.js';
import { makeButton } from '../ui/Button.js';
import { Sfx, vibrate } from '../audio.js';

export default class LockGame extends BaseMinigame {
  static baseTime = 80;
  get title() { return 'فكّ القفل'; }
  get hint() { return 'خمّن الرمز (أرقام بدون تكرار). الأخضر: صحيح بمكانه · الذهبي: موجود بمكان آخر · الرمادي: غير موجود'; }

  start() {
    const s = this.s, A = this.A;
    this.maxDigit = 5 + Math.round(this.d * 3);
    this.maxTries = 8 - Math.round(this.d * 2);
    const pool = Phaser.Utils.Array.Shuffle(Array.from({ length: this.maxDigit }, (_, i) => i + 1));
    this.code = pool.slice(0, 4);
    this.guess = [1, 2, 3, 4];
    this.locked = [false, false, false, false];
    this.tries = 0;
    if (this.mods.lockHint) {
      const i = Phaser.Math.Between(0, 3);
      this.locked[i] = true;
      this.guess[i] = this.code[i];
      // باقي الخانات تبدأ بأرقام مختلفة عن الرقم المكشوف
      const rest = Array.from({ length: this.maxDigit }, (_, k) => k + 1).filter((v) => v !== this.code[i]);
      for (let k = 0, r = 0; k < 4; k++) if (k !== i) this.guess[k] = rest[r++];
    }

    // شاشة الجهاز
    const g = s.add.graphics();
    g.fillStyle(0x23262d); g.fillRoundedRect(70, A.y + 10, 400, 70, 14);
    g.fillStyle(0x061018); g.fillRoundedRect(80, A.y + 18, 380, 54, 10);
    this.screen = T(s, 270, A.y + 45, `مقفل · الأرقام من 1 إلى ${this.maxDigit}`, 18, HEX(COL.red), { bold: true, align: 'center' });
    this.triesT = T(s, 270, A.y + 97, '', 15, '#8a94b8', { align: 'center' });

    // الخانات (من اليسار لليمين مثل لوحة الأرقام)
    this.slotT = [];
    const sy = A.y + 215;
    for (let i = 0; i < 4; i++) {
      const x = 270 + (i - 1.5) * 104;
      makeButton(s, x, sy - 70, '▲', { w: 84, h: 46, color: COL.cyan, size: 20, onClick: () => this.bump(i, 1) });
      makeButton(s, x, sy + 70, '▼', { w: 84, h: 46, color: COL.cyan, size: 20, onClick: () => this.bump(i, -1) });
      const sg = s.add.graphics();
      sg.fillStyle(this.locked[i] ? 0x3a2e08 : 0x0b1830); sg.fillRoundedRect(x - 42, sy - 40, 84, 80, 14);
      sg.lineStyle(3, this.locked[i] ? COL.gold : COL.cyan, 0.9); sg.strokeRoundedRect(x - 42, sy - 40, 84, 80, 14);
      this.slotT.push(T(s, x, sy, '', 44, this.locked[i] ? HEX(COL.gold) : HEX(COL.cyan), { weight: 900, align: 'center' }));
    }
    this.tryBtn = makeButton(s, 270, A.y + 348, 'جرّب الرمز', { w: 260, h: 54, color: COL.green, size: 22, onClick: () => this.submit() });

    this.histY = A.y + 392;
    this.histG = s.add.graphics();
    this.refresh();
  }

  bump(i, dir) {
    if (this.over || this.locked[i]) { if (this.locked[i]) Sfx.tick(); return; }
    let v = this.guess[i] + dir;
    if (v > this.maxDigit) v = 1;
    if (v < 1) v = this.maxDigit;
    this.guess[i] = v;
    Sfx.tick();
    this.refresh();
  }

  refresh() {
    this.guess.forEach((v, i) => this.slotT[i].setText(String(v)));
    this.triesT.setText(`المحاولات: ${this.tries} من ${this.maxTries}`);
  }

  submit() {
    if (this.over) return;
    if (new Set(this.guess).size < 4) {
      this.s.setHint('لا تكرّر نفس الرقم في الرمز!');
      Sfx.error();
      return;
    }
    const res = this.score(this.guess);
    this.tries += 1;
    this.drawRow(this.tries - 1, this.guess, res);
    this.refresh();
    if (res.every((r) => r === 2)) {
      this.screen.setText('✓ مفتوح').setColor(HEX(COL.green));
      Sfx.unlock();
      vibrate(40);
      this.s.time.delayedCall(500, () => this.win(1.12 - 0.1 * this.tries));
    } else if (this.tries >= this.maxTries) {
      this.screen.setText(`الرمز كان: ${this.code.join(' ')}`).setColor(HEX(COL.red));
      this.s.time.delayedCall(900, () => this.lose());
    } else {
      Sfx.beep(500, 0.08);
      this.s.tweens.add({ targets: this.screen, x: { from: 264, to: 276 }, duration: 50, yoyo: true, repeat: 2, onComplete: () => { this.screen.x = 270; } });
    }
  }

  score(guess) {
    const res = [0, 0, 0, 0];
    guess.forEach((v, i) => {
      if (this.code[i] === v) res[i] = 2;
      else if (this.code.includes(v)) res[i] = 1;
    });
    return res;
  }

  drawRow(r, guess, res) {
    const s = this.s, g = this.histG;
    const y = this.histY + r * 38;
    const cols = [0x3a3f4a, COL.gold, COL.green];
    T(s, 420, y + 15, `#${r + 1}`, 14, '#8a94b8', { ox: 0 });
    guess.forEach((v, i) => {
      const x = 270 + (i - 1.5) * 56;
      g.fillStyle(cols[res[i]], res[i] ? 0.85 : 1);
      g.fillRoundedRect(x - 24, y, 48, 31, 7);
      T(s, x, y + 15, String(v), 18, res[i] ? '#07040f' : '#c6d2f2', { weight: 900, align: 'center' });
    });
  }
}
