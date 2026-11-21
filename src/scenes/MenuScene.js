import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera } from '../ui/theme.js';
import { Game } from '../state.js';
import { Music } from '../music.js';
import { Sfx } from '../audio.js';
import { drawCity } from '../gfx/City.js';
import { Character, makeLook } from '../gfx/CharacterGenerator.js';
import { makeButton } from '../ui/Button.js';
import { modal } from '../ui/Popup.js';
import { addGlow, addVignette, isWebGL } from '../gfx/Painter.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    setupCamera(this);
    this.modalOpen = false;
    this.showcase = null;
    drawCity(this, 0, 0, W, 620);
    const g = this.add.graphics().setDepth(5);
    g.fillGradientStyle(0x1c1f2e, 0x1c1f2e, 0x07040f, 0x07040f, 1);
    g.fillRect(0, 600, W, 360);
    g.fillStyle(0x6b7088); g.fillRect(0, 590, W, 14);
    g.fillStyle(0xb9bfd6); g.fillRect(0, 590, W, 2);
    this.add.image(W / 2, 640, 'glowTex').setTint(0xff3fa4).setAlpha(0.25).setScale(5, 1.2).setBlendMode('ADD').setDepth(6);

    // العنوان
    const title = T(this, W / 2, 128, 'ورشة المدار', 64, '#c8fcff', { weight: 900, align: 'center', shadow: HEX(COL.cyan), blur: 22 }).setDepth(20);
    addGlow(this, title, COL.cyan, 5);
    if (isWebGL(this) && title.preFX) { try { title.preFX.addShine(0.6, 0.3, 4); } catch (e) { /* ignore */ } }
    addVignette(this, 0.35, 0.85);
    T(this, W / 2, 196, 'محاكي ورشة تصليح في مدينة فضائية', 19, HEX(COL.pink), { bold: true, align: 'center', shadow: HEX(COL.pink) }).setDepth(20);
    this.time.addEvent({
      delay: 2600, loop: true,
      callback: () => this.tweens.add({ targets: title, alpha: 0.4, duration: 50, yoyo: true, repeat: 3 }),
    });

    // عرض مولّد الشخصيات
    this.showcaseX = W / 2;
    this.spawnShowcase();
    this.time.addEvent({ delay: 2800, loop: true, callback: () => this.spawnShowcase() });

    const hasSave = Game.hasSave();
    let y = 690;
    if (hasSave) {
      makeButton(this, W / 2, y, 'متابعة', { w: 300, h: 64, color: COL.green, size: 26, depth: 30, onClick: () => this.continueGame() });
      y += 82;
    }
    makeButton(this, W / 2, y, 'لعبة جديدة', {
      w: 300, h: 64, color: COL.cyan, size: 26, depth: 30,
      onClick: () => {
        if (hasSave) {
          modal(this, {
            title: 'لعبة جديدة؟',
            body: 'سيُحذف تقدّمك الحالي في الورشة. متأكد؟',
            buttons: [
              { label: 'نعم، ابدأ من جديد', color: COL.red, onClick: () => this.newGame() },
              { label: 'تراجع', color: COL.cyan },
            ],
          });
        } else this.newGame();
      },
    });
    y += 82;
    makeButton(this, W / 2, y, 'الإعدادات', { w: 300, h: 60, color: COL.purple, size: 22, depth: 30, onClick: () => this.scene.start('Settings', { from: 'Menu' }) });

    T(this, W / 2, H - 22, 'كل الرسومات والأصوات مولّدة بالكود', 12, '#5a6488', { align: 'center' }).setDepth(30);
    this.cameras.main.fadeIn(500);
    Music.play('menu');
  }

  spawnShowcase() {
    const old = this.showcase;
    if (old && old.scene) old.leave(-200);
    const look = makeLook({}, Math.floor(Math.random() * 1e9));
    const ch = new Character(this, W + 200, 590, look, 1.05);
    ch.setDepth(4);
    this.showcase = ch;
    ch.enter(this.showcaseX, () => {
      const moods = ['happy', 'confused', 'thinking', 'money', 'surprised', 'impatient', 'great'];
      ch.react(moods[Math.floor(Math.random() * moods.length)]);
    });
  }

  newGame() {
    Game.newGame();
    this.go('Workshop');
  }

  continueGame() {
    if (!Game.load()) { this.newGame(); return; }
    this.go(Game.state.day > 1 && Game.state.pendingShop ? 'Shop' : 'Workshop');
  }

  go(key) {
    Sfx.startAmbient();
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key));
  }
}
