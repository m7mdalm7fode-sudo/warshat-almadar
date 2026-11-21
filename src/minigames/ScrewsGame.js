// 3) البراغي: فك البراغي بالترتيب الصحيح بحركة دائرية
import Phaser from 'phaser';
import BaseMinigame from './BaseMinigame.js';
import { T, COL, HEX, arDigits } from '../ui/theme.js';
import { Sfx, vibrate } from '../audio.js';
import { paint, painted } from '../gfx/Painter.js';

const SPOTS = [[-150, -150], [150, -150], [150, 150], [-150, 150], [0, -168], [0, 168], [-168, 0], [168, 0]];

export default class ScrewsGame extends BaseMinigame {
  static baseTime = 40;
  get title() { return 'فك البراغي'; }
  get hint() { return 'اضغط على البرغي حسب رقمه، ثم دوّر إصبعك حوله بحركة دائرية حتى يطلع.'; }

  start() {
    const s = this.s, A = this.A;
    this.cx = 270; this.cy = A.y + 300;
    const n = 4 + Math.round(this.d * 2);
    this.memory = this.d >= 0.5;
    this.required = Math.PI * 2 * (1.4 + this.d);

    this.plate = s.add.container(this.cx, this.cy);
    const pp = paint(s, 'plateTex', 440, 440, 220, 220, (g) => {
      g.fillStyle(0x6b7785); g.fillRoundedRect(-210, -210, 420, 420, 26);
      g.fillStyle(0x9aa3b8); g.fillRoundedRect(-200, -200, 400, 400, 20);
      g.lineStyle(1, 0xffffff, 0.08);
      for (let y = -196; y < 200; y += 3) g.lineBetween(-196, y, 196, y);
      g.lineStyle(2, 0x5c6b73); g.strokeRoundedRect(-120, -100, 240, 200, 12);
      g.fillStyle(0x1a1a1a); g.fillRect(-122, 58, 244, 28);
      g.fillStyle(0xffc94a); for (let i = -5; i < 5; i++) g.fillPoints([{ x: i * 24, y: 58 }, { x: i * 24 + 12, y: 58 }, { x: i * 24 - 2, y: 86 }, { x: i * 24 - 14, y: 86 }]);
      g.fillStyle(0x0b1018); g.fillRoundedRect(-80, -60, 160, 90, 10);
      g.glow(0, -16, 70, 0xff4d5e, 0.25);
    }, { keep: true, res: 1.2, outline: 1.5, rim: 0x29f0ff });
    const shadowP = s.add.image(8, 14, 'soft').setTint(0x000000).setAlpha(0.6).setScale(5);
    this.plate.add([shadowP, painted(s, 0, 0, pp)]);
    this.plate.add(T(s, 0, -16, 'خطر: جهد عالٍ', 18, HEX(COL.red), { weight: 900, align: 'center' }));

    const spots = Phaser.Utils.Array.Shuffle(SPOTS.slice()).slice(0, n);
    const order = Phaser.Utils.Array.Shuffle(Array.from({ length: n }, (_, i) => i));
    this.screws = spots.map(([x, y], i) => this.makeScrew(x, y, order[i]));
    this.nextIdx = 0;
    this.ring = s.add.graphics().setDepth(20);

    if (this.memory) {
      s.setHint('احفظ ترتيب الأرقام! ستختفي بعد لحظات، ثم فكّ البراغي بالترتيب بحركة دائرية.');
      s.time.delayedCall(2600, () => this.screws.forEach((sc) => s.tweens.add({ targets: sc.label, alpha: 0, duration: 300 })));
    }

    this.active = null;
    s.input.on('pointermove', (p) => this.onMove(p));
    s.input.on('pointerup', () => { this.active = null; this.ring.clear(); });
  }

  makeScrew(x, y, num) {
    const s = this.s;
    const c = s.add.container(this.cx + x, this.cy + y).setDepth(10);
    const sh = s.add.image(3, 4, 'soft').setTint(0x000000).setAlpha(0.7).setScale(0.7);
    const head = s.add.container(0, 0);
    const sp = paint(s, 'screwTex', 64, 64, 32, 32, (g, ctx) => {
      g.fillStyle(0x5c6b73); g.fillCircle(0, 0, 26);
      const rg = ctx.createRadialGradient(-8, -8, 2, 0, 0, 23);
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.4, '#cfd6e2'); rg.addColorStop(1, '#6f7a8c');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
      g.fillStyle(0x2b2f36);
      g.fillRoundedRect(-15, -3.5, 30, 7, 2); g.fillRoundedRect(-3.5, -15, 7, 30, 2);
      g.lineStyle(1, 0xffffff, 0.4); g.lineBetween(-14, 4, 14, 4);
    }, { keep: true, res: 2, outline: 1.2, light: false });
    head.add(painted(s, 0, 0, sp));
    c.add([sh, head]);
    const label = T(s, this.cx + x + 34, this.cy + y - 30, arDigits(num + 1), 24, HEX(COL.gold), { weight: 900, align: 'center', stroke: '#07040f', strokeW: 5 }).setDepth(15);
    c.setSize(80, 80).setInteractive({ useHandCursor: true });
    const sc = { c, head, sh, label, num, turned: 0, out: false, x: this.cx + x, y: this.cy + y };
    c.on('pointerdown', (p) => this.grab(sc, p));
    return sc;
  }

  grab(sc, p) {
    if (this.over || sc.out) return;
    if (sc.num !== this.nextIdx) {
      this.mistakes += 1;
      Sfx.error();
      vibrate(60);
      this.s.cameras.main.shake(120, 0.004);
      this.s.tweens.add({ targets: sc.c, angle: { from: -10, to: 10 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => { sc.c.angle = 0; } });
      if (this.memory) {
        this.screws.forEach((o) => { if (!o.out) { o.label.setAlpha(1); this.s.tweens.add({ targets: o.label, alpha: 0, delay: 900, duration: 300 }); } });
      }
      return;
    }
    this.active = sc;
    this.lastAng = Math.atan2(p.worldY - sc.y, p.worldX - sc.x);
    this.acc = 0;
  }

  onMove(p) {
    const sc = this.active;
    if (!sc || this.over) return;
    const dx = p.worldX - sc.x, dy = p.worldY - sc.y;
    if (dx * dx + dy * dy < 14 * 14) return;
    const ang = Math.atan2(dy, dx);
    const delta = Phaser.Math.Angle.Wrap(ang - this.lastAng);
    this.lastAng = ang;
    if (Math.abs(delta) > 1.2) return;
    sc.turned += Math.abs(delta);
    sc.head.rotation += delta;
    this.acc += Math.abs(delta);
    if (this.acc > 0.5) { this.acc = 0; Sfx.ratchet(); }
    const prog = Math.min(1, sc.turned / this.required);
    sc.c.setScale(1 + prog * 0.3);
    sc.sh.setPosition(3 + prog * 8, 4 + prog * 10);
    this.drawRing(sc, prog);
    if (prog >= 1) this.popOut(sc);
  }

  drawRing(sc, prog) {
    const g = this.ring;
    g.clear();
    g.lineStyle(6, 0x07040f, 0.6); g.strokeCircle(sc.x, sc.y, 46);
    g.lineStyle(6, COL.cyan, 1);
    g.beginPath(); g.arc(sc.x, sc.y, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); g.strokePath();
  }

  popOut(sc) {
    sc.out = true;
    this.active = null;
    this.ring.clear();
    Sfx.pop();
    vibrate(25);
    sc.label.setAlpha(0);
    this.s.tweens.add({ targets: sc.c, y: sc.y - 60, x: sc.x + 40, alpha: 0, scale: 1.8, angle: 200, duration: 500, ease: 'Cubic.easeOut' });
    this.nextIdx += 1;
    if (this.nextIdx >= this.screws.length) {
      this.s.tweens.add({ targets: this.plate, y: this.cy - 40, alpha: 0, angle: -6, duration: 500, delay: 200 });
      this.s.time.delayedCall(700, () => this.win(1 - this.mistakes * 0.15));
    }
  }
}
