// الشريط العلوي: الفلوس، السمعة بالنجوم، اليوم، الوقت المتبقي
import { W, T, COL, fmt, starPoints } from './theme.js';

export class TopBar {
  constructor(scene, o = {}) {
    this.s = scene;
    const c = scene.add.container(0, 0).setDepth(o.depth ?? 100);
    this.c = c;
    const g = scene.add.graphics();
    g.fillStyle(0x0d0a1c, 0.94); g.fillRect(0, 0, W, 58);
    g.lineStyle(2, COL.cyan, 0.55); g.lineBetween(0, 58, W, 58);
    g.fillStyle(COL.gold); g.fillCircle(508, 29, 10);
    g.fillStyle(0x8a6400); g.fillCircle(508, 29, 5);
    c.add(g);
    this.money = T(scene, 490, 30, '', 22, '#ffd34a', { weight: 900, ox: 1 });
    this.stars = scene.add.graphics();
    this.day = T(scene, 222, 21, '', 16, '#eaf6ff', { bold: true, align: 'center' });
    this.queue = T(scene, 222, 42, '', 12, '#8a94b8', { align: 'center' });
    this.clockG = scene.add.graphics();
    this.clock = T(scene, 104, 30, '', 18, '#29f0ff', { bold: true, ox: 1 });
    c.add([this.money, this.stars, this.day, this.queue, this.clockG, this.clock]);
    this.showTimer = o.showTimer !== false;
    if (this.showTimer) {
      this.clockG.lineStyle(2.5, COL.cyan); this.clockG.strokeCircle(118, 29, 9);
      this.clockG.lineBetween(118, 29, 118, 23); this.clockG.lineBetween(118, 29, 122, 31);
    }
    if (o.onMenu) {
      const mb = scene.add.zone(26, 29, 48, 50).setInteractive({ useHandCursor: true });
      const mg = scene.add.graphics();
      mg.fillStyle(0xeaf6ff, 0.85);
      [-8, 0, 8].forEach((dy) => mg.fillRoundedRect(14, 29 + dy - 2, 24, 4, 2));
      mb.on('pointerup', o.onMenu);
      c.add([mg, mb]);
    }
    this.shownMoney = null;
  }

  drawStars(rep) {
    const g = this.stars;
    g.clear();
    for (let i = 0; i < 5; i++) {
      const cx = 390 - i * 24, cy = 29;
      const fill = Math.max(0, Math.min(1, rep - i));
      g.fillStyle(0x3a3456, 1); g.fillPoints(starPoints(cx, cy, 10, 4.4), true);
      if (fill > 0) {
        g.fillStyle(COL.gold, 0.35 + 0.65 * fill);
        g.fillPoints(starPoints(cx, cy, 10 * (0.5 + fill * 0.5), 4.4 * (0.5 + fill * 0.5)), true);
      }
    }
  }

  update(st, timeLeft, served, total) {
    if (this.shownMoney === null || !this.s.tweens) this.shownMoney = st.money;
    const from = this.shownMoney;
    if (from !== st.money) {
      const obj = { v: from };
      this.s.tweens.add({
        targets: obj, v: st.money, duration: 500,
        onUpdate: () => this.money.setText(fmt(obj.v)),
        onComplete: () => this.money.setText(fmt(st.money)),
      });
      this.s.tweens.add({ targets: this.money, scale: 0.62, duration: 120, yoyo: true });
      this.shownMoney = st.money;
    } else {
      this.money.setText(fmt(st.money));
    }
    this.drawStars(st.rep);
    this.day.setText(`اليوم ${st.day}`);
    if (total) this.queue.setText(`زبون ${Math.min(served + 1, total)} من ${total}`);
    else this.queue.setText('');
    if (this.showTimer && timeLeft !== undefined) {
      const t = Math.max(0, Math.ceil(timeLeft));
      this.clock.setText(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`);
      this.clock.setColor(t < 40 ? '#ff4d5e' : '#29f0ff');
    }
  }
}
