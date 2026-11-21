import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera } from '../ui/theme.js';
import { Game } from '../state.js';
import { Sfx, vibrate } from '../audio.js';
import { starField } from '../gfx/City.js';
import { makeButton } from '../ui/Button.js';
import { modal } from '../ui/Popup.js';

export default class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(data) {
    setupCamera(this);
    this.modalOpen = false;
    this.from = (data && data.from) || 'Menu';
    starField(this, 100);
    T(this, W / 2, 110, 'الإعدادات', 44, HEX(COL.purple), { weight: 900, align: 'center', shadow: HEX(COL.purple) });
    this.buildButtons();
    this.cameras.main.fadeIn(300);
  }

  buildButtons() {
    if (this.btns) this.btns.forEach((b) => b.destroy());
    const s = Game.settings;
    this.btns = [
      makeButton(this, W / 2, 280, `الصوت: ${s.sound ? 'يعمل ♪' : 'مغلق'}`, {
        w: 340, h: 66, color: s.sound ? COL.green : COL.dim, size: 24,
        onClick: () => {
          s.sound = !s.sound; Game.saveSettings();
          if (s.sound) { Sfx.coin(); Sfx.startAmbient(); } else Sfx.stopAmbient();
          this.buildButtons();
        },
      }),
      makeButton(this, W / 2, 370, `الاهتزاز: ${s.vibration ? 'يعمل' : 'مغلق'}`, {
        w: 340, h: 66, color: s.vibration ? COL.green : COL.dim, size: 24,
        onClick: () => { s.vibration = !s.vibration; Game.saveSettings(); vibrate(60); this.buildButtons(); },
      }),
      makeButton(this, W / 2, 500, 'مسح التقدّم المحفوظ', {
        w: 340, h: 60, color: COL.red, size: 20,
        onClick: () => modal(this, {
          title: 'متأكد؟',
          body: 'سيتم حذف الورشة وكل التطويرات والفلوس نهائياً.',
          buttons: [
            { label: 'نعم، احذف', color: COL.red, onClick: () => { Game.clear(); this.scene.start('Menu'); } },
            { label: 'تراجع', color: COL.cyan },
          ],
        }),
      }),
      makeButton(this, W / 2, 820, 'رجوع', { w: 260, h: 62, color: COL.cyan, size: 22, onClick: () => this.scene.start(this.from) }),
    ];
    T(this, W / 2, 640, 'اللعبة تعمل باللمس على الجوال وبالماوس على الكمبيوتر.\nالتقدّم يُحفظ تلقائياً في نهاية كل يوم وبعد كل عملية شراء.', 15, '#8a94b8', { align: 'center', wrap: 440 });
  }
}
