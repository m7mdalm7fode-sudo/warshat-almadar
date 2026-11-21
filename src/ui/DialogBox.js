// صندوق الحوار مع تأثير الكتابة
import { T, COL, HEX } from './theme.js';
import { Sfx } from '../audio.js';

export class DialogBox {
  constructor(scene, y = 590) {
    this.s = scene;
    this.y = y;
    const c = scene.add.container(0, 0).setDepth(50).setVisible(false);
    this.c = c;
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.4); g.fillRoundedRect(22, y + 6, 496, 128, 18);
    g.fillStyle(0x120c26, 0.95); g.fillRoundedRect(20, y, 500, 128, 18);
    g.lineStyle(2, COL.cyan, 0.7); g.strokeRoundedRect(20, y, 500, 128, 18);
    g.fillStyle(COL.cyan, 0.08); g.fillRoundedRect(26, y + 6, 488, 30, 12);
    this.tagG = scene.add.graphics();
    this.name = T(scene, 496, y + 2, '', 16, '#07040f', { weight: 900, ox: 1, oy: 0.5 });
    this.text = T(scene, 498, y + 26, '', 19, '#eaf6ff', { wrap: 470, ox: 1, oy: 0, lineSpacing: 2 });
    this.arrow = T(scene, 40, y + 110, '◀', 14, HEX(COL.cyan), { align: 'center' });
    scene.tweens.add({ targets: this.arrow, x: 34, duration: 400, yoyo: true, repeat: -1 });
    c.add([g, this.tagG, this.name, this.text, this.arrow]);
    this.active = false;
    this.typing = false;
    scene.input.on('pointerdown', () => this.tap());
  }

  drawTag(color) {
    const w = Math.max(80, this.name.displayWidth + 28);
    this.tagG.clear();
    this.tagG.fillStyle(color, 1);
    this.tagG.fillRoundedRect(510 - w, this.y - 14, w, 30, 10);
  }

  show(name, lines, cb, o = {}) {
    this.c.setVisible(true);
    this.name.setText(name);
    this.drawTag(o.tagColor ?? COL.cyan);
    this.lines = lines.slice();
    this.cb = cb;
    this.auto = o.auto;
    this.active = true;
    this.next();
  }

  next() {
    if (!this.lines.length) {
      this.active = false;
      this.arrow.setVisible(false);
      const cb = this.cb;
      this.cb = null;
      if (cb) cb();
      return;
    }
    const line = this.lines.shift();
    this.full = line;
    this.idx = 0;
    this.typing = true;
    this.arrow.setVisible(false);
    this.text.setText('');
    if (this.ev) this.ev.remove();
    this.ev = this.s.time.addEvent({
      delay: 24, loop: true,
      callback: () => {
        this.idx += 1;
        this.text.setText(this.full.slice(0, this.idx));
        if (this.idx % 3 === 0) Sfx.blip();
        if (this.idx >= this.full.length) this.finishLine();
      },
    });
  }

  finishLine() {
    if (this.ev) { this.ev.remove(); this.ev = null; }
    this.typing = false;
    this.text.setText(this.full);
    this.arrow.setVisible(true);
    if (this.auto) {
      const tryNext = () => {
        if (!this.active || this.typing) return;
        if (this.s.modalOpen) { this.s.time.delayedCall(300, tryNext); return; }
        this.next();
      };
      this.s.time.delayedCall(this.auto, tryNext);
    }
  }

  tap() {
    if (!this.active || this.s.modalOpen) return;
    if (this.typing) this.finishLine();
    else this.next();
  }

  /** يعرض سطراً ثابتاً بدون انتظار */
  hold(name, line, tagColor) {
    this.c.setVisible(true);
    this.name.setText(name);
    this.drawTag(tagColor ?? COL.cyan);
    this.text.setText(line);
    this.arrow.setVisible(false);
    this.active = false;
  }

  hide() {
    this.c.setVisible(false);
    this.active = false;
    if (this.ev) { this.ev.remove(); this.ev = null; }
  }
}
