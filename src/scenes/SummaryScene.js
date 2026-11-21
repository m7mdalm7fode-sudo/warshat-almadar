import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera, fmt } from '../ui/theme.js';
import { Game } from '../state.js';
import { Sfx } from '../audio.js';
import { starField } from '../gfx/City.js';
import { drawTower } from '../gfx/TowerView.js';
import { makeButton } from '../ui/Button.js';
import { addVignette } from '../gfx/Painter.js';

export default class SummaryScene extends Phaser.Scene {
  constructor() { super('Summary'); }

  create(data) {
    setupCamera(this);
    if (!Game.state && !Game.load()) { this.scene.start('Menu'); return; }
    const st = Game.state;
    const log = data.log;
    starField(this, 110);
    T(this, W / 2, 70, `نهاية اليوم ${log.day}`, 40, HEX(COL.cyan), { weight: 900, align: 'center', shadow: HEX(COL.cyan) });

    drawTower(this, st, { x: W / 2, y: 330, scale: 0.42, ghost: true });

    const g = this.add.graphics();
    g.fillStyle(0x120c26, 0.95); g.fillRoundedRect(40, 360, 460, 420, 20);
    g.lineStyle(2, COL.pink, 0.8); g.strokeRoundedRect(40, 360, 460, 420, 20);

    const repD = log.repEnd - log.repStart;
    const rows = [
      ['الزبائن المخدومون', `${log.served}`, '#eaf6ff'],
      ['المرفوضون', `${log.refused}`, '#eaf6ff'],
      ['إصلاحات ممتازة', `${log.perfect}`, '#ffd34a'],
      ['إصلاحات فاشلة', `${log.failed}`, log.failed ? '#ff4d5e' : '#eaf6ff'],
      ['الدخل', `◈ ${fmt(log.earned)}`, '#ffd34a'],
      ['دخل المخزن', `◈ ${fmt(log.passive)}`, '#ffd34a'],
      ['غرامات ورشاوى', `◈ ${fmt(log.fines)}`, log.fines ? '#ff4d5e' : '#eaf6ff'],
      ['السمعة', `${log.repStart.toFixed(1)} ← ${log.repEnd.toFixed(1)} ${repD >= 0 ? '▲' : '▼'}`, repD >= 0 ? '#3dff8a' : '#ff4d5e'],
    ];
    rows.forEach(([k, v, c], i) => {
      const y = 392 + i * 40;
      const a = T(this, 470, y, k, 19, '#b9c4e6', { ox: 1 });
      const b = T(this, 70, y, v, 20, c, { weight: 900, ox: 0 });
      a.setAlpha(0); b.setAlpha(0);
      this.tweens.add({ targets: [a, b], alpha: 1, delay: 150 + i * 110, duration: 250, onStart: () => Sfx.tick() });
    });
    if (log.events.length) {
      T(this, 470, 722, `أحداث: ${log.events.slice(0, 2).join(' · ')}`, 14, '#ff8fd0', { ox: 1, wrap: 420 });
    }
    T(this, W / 2, 810, `رصيدك: ◈ ${fmt(st.money)}`, 26, '#ffd34a', { weight: 900, align: 'center' });

    makeButton(this, W / 2, 880, 'إلى المتجر', { w: 300, h: 64, color: COL.green, size: 24, onClick: () => this.go() });
    this.time.delayedCall(300, () => Sfx.coin());
    addVignette(this, 0.3, 0.9);
    this.cameras.main.fadeIn(400);
  }

  go() {
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Shop'));
  }
}
