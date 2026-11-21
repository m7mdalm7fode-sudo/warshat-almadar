import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera, fmt, arDigits } from '../ui/theme.js';
import { Game } from '../state.js';
import { Sfx, vibrate } from '../audio.js';
import { drawCity, starField } from '../gfx/City.js';
import { drawTower } from '../gfx/TowerView.js';
import { makeButton } from '../ui/Button.js';

const GOOD = ['reported_thief', 'helped_refugee', 'reported_inspector'];
const BAD = ['stolen_unlocked', 'smuggler_helped', 'smuggler_deep', 'sabotaged', 'bribed_inspector'];

export default class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }

  create() {
    setupCamera(this);
    if (!Game.state && !Game.load()) { this.scene.start('Menu'); return; }
    const st = Game.state;
    st.finished = true;
    Game.save();

    this.space = starField(this, 160, 0);
    this.world = this.add.container(0, 0).setDepth(1);
    const city = drawCity(this, 0, 0, W, 760, { depth: 1 });
    this.world.add(city);
    const ground = this.add.graphics();
    ground.fillStyle(0x15161f); ground.fillRect(0, 760, W, 400);
    ground.fillStyle(0x5b5f73); ground.fillRect(0, 752, W, 10);
    ground.fillStyle(0xffc94a); for (let x = 0; x < W; x += 40) ground.fillRect(x, 780, 20, 6);
    this.world.add(ground);

    this.tower = drawTower(this, st, { x: W / 2, y: 730, scale: 0.95, ghost: false, forceEngine: true }).setDepth(5);

    this.flame = this.add.particles(0, 0, 'soft', {
      speedY: { min: 220, max: 420 }, speedX: { min: -50, max: 50 },
      scale: { start: 0.55, end: 0.05 }, alpha: { start: 0.95, end: 0 },
      tint: [0xffffff, 0xffe680, 0xff9a2f, 0xff4d1a], lifespan: 600, frequency: 12, quantity: 3,
      blendMode: 'ADD', emitting: false,
    }).setDepth(4);
    this.smoke = this.add.particles(0, 0, 'soft', {
      speedX: { min: -260, max: 260 }, speedY: { min: -40, max: 20 },
      scale: { start: 0.6, end: 1.8 }, alpha: { start: 0.5, end: 0 }, tint: 0x8a8fa6,
      lifespan: 1600, frequency: 25, emitting: false,
    }).setDepth(6);

    this.cameras.main.fadeIn(600);
    this.countdown();
  }

  countdown() {
    const nums = ['٣', '٢', '١'];
    nums.forEach((n, i) => {
      this.time.delayedCall(800 + i * 900, () => {
        const t = T(this, W / 2, 330, n, 120, HEX(COL.gold), { weight: 900, align: 'center', shadow: HEX(COL.gold), blur: 30 }).setDepth(20);
        t.setScale(0.8);
        Sfx.beep(660 + i * 110, 0.2);
        vibrate(40);
        this.tweens.add({ targets: t, scale: 0.4, alpha: 0, duration: 850, onComplete: () => t.destroy() });
        if (i === 2) { this.flame.setPosition(W / 2, 760); this.flame.start(); }
      });
    });
    this.time.delayedCall(800 + 3 * 900, () => this.liftOff());
  }

  liftOff() {
    const t = T(this, W / 2, 300, 'انطلاق!', 72, HEX(COL.pink), { weight: 900, align: 'center', shadow: HEX(COL.pink), blur: 26 }).setDepth(20);
    this.tweens.add({ targets: t, alpha: 0, y: 240, duration: 1500, delay: 600, onComplete: () => t.destroy() });
    Sfx.launch();
    vibrate([200, 80, 200, 80, 400]);
    this.cameras.main.shake(2600, 0.008);
    this.smoke.setPosition(W / 2, 770);
    this.smoke.start();
    this.time.delayedCall(2200, () => this.smoke.stop());

    // البرج يرتفع والعالم ينزل كأن الكاميرا تتبعه
    this.tweens.add({ targets: this.tower, y: 520, duration: 2500, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: this.world, y: 1300, duration: 5000, ease: 'Quad.easeIn', delay: 900 });
    this.time.addEvent({
      delay: 16, loop: true,
      callback: () => { this.flame.setPosition(this.tower.x, this.tower.y + 30 * this.tower.scale); },
    });
    // نجوم مسرعة
    this.time.delayedCall(2500, () => {
      for (let i = 0; i < 40; i++) {
        const s = this.add.rectangle(Math.random() * W, -20, 2, 30 + Math.random() * 60, 0xffffff, 0.7).setDepth(2);
        this.tweens.add({ targets: s, y: H + 80, duration: 500 + Math.random() * 700, delay: Math.random() * 2500, onComplete: () => s.destroy() });
      }
      this.tweens.add({ targets: this.tower, y: 900, scale: 0.55, duration: 3000, ease: 'Sine.easeInOut' });
    });
    this.time.delayedCall(6200, () => this.credits());
  }

  credits() {
    const st = Game.state;
    const good = GOOD.filter((f) => st.flags[f]).length + Math.min(3, st.stats.arrests || 0);
    const bad = BAD.filter((f) => st.flags[f]).length;
    const verdict = good - bad >= 1 ? 'فنّي شريف تحكي عنه المحطة بأكملها' : bad - good >= 2 ? 'اسمك محفوظ في ملفات الأمن... للأبد' : 'فنّي شاطر... وله أسراره';
    const c = this.add.container(0, 0).setDepth(30).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x07040f, 0.97); g.fillRoundedRect(30, 70, 480, 520, 24);
    g.lineStyle(3, COL.cyan, 0.9); g.strokeRoundedRect(30, 70, 480, 520, 24);
    c.add(g);
    c.add(T(this, W / 2, 125, 'ورشة المدار تحلّق!', 38, HEX(COL.cyan), { weight: 900, align: 'center', shadow: HEX(COL.cyan) }));
    c.add(T(this, W / 2, 175, 'من كشك صغير إلى سفينة فضاء بين النجوم', 17, HEX(COL.pink), { align: 'center' }));
    const rows = [
      ['أيام العمل', arDigits(st.day - 1)],
      ['الزبائن المخدومون', arDigits(st.stats.served)],
      ['إصلاحات ممتازة', arDigits(st.stats.perfect)],
      ['مجموع الأرباح', `◈ ${fmt(st.stats.earned)}`],
      ['السمعة النهائية', `${st.rep.toFixed(1)} ★`],
    ];
    rows.forEach(([k, v], i) => {
      c.add(T(this, 470, 230 + i * 42, k, 19, '#b9c4e6', { ox: 1 }));
      c.add(T(this, 70, 230 + i * 42, v, 20, '#ffd34a', { weight: 900, ox: 0 }));
    });
    c.add(T(this, W / 2, 470, 'لقبك:', 16, '#8a94b8', { align: 'center' }));
    c.add(T(this, W / 2, 510, verdict, 21, HEX(COL.gold), { weight: 900, align: 'center', wrap: 440 }));
    c.add(T(this, W / 2, 560, 'شكراً للعب!', 16, '#8a94b8', { align: 'center' }));
    this.tweens.add({ targets: c, alpha: 1, duration: 800 });
    Sfx.success();

    makeButton(this, W / 2, 870, 'القائمة الرئيسية', { w: 300, h: 62, color: COL.cyan, size: 22, depth: 40, onClick: () => this.scene.start('Menu') });
  }
}
