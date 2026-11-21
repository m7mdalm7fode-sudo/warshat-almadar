import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera } from '../ui/theme.js';
import { Game } from '../state.js';
import { Voice } from '../voice.js';
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
    if (this.info) this.info.destroy();
    const s = Game.settings;
    const voiceNames = { auto: 'تلقائي', babble: 'همهمة', off: 'بدون' };
    const voiceNext = { auto: 'babble', babble: 'off', off: 'auto' };
    const row = (y, label, on, onClick) => makeButton(this, W / 2, y, label, { w: 360, h: 62, color: on ? COL.green : COL.dim, size: 22, onClick });
    this.btns = [
      row(230, `المؤثرات: ${s.sound ? 'تعمل' : 'مغلقة'}`, s.sound, () => { s.sound = !s.sound; Game.saveSettings(); if (s.sound) Sfx.coin(); this.buildButtons(); }),
      row(320, `أصوات الشخصيات: ${voiceNames[s.voice || 'auto']}`, (s.voice || 'auto') !== 'off', () => {
        s.voice = voiceNext[s.voice || 'auto']; Game.saveSettings(); this.buildButtons();
        if (s.voice !== 'off') Voice.speak('هلا والله، أنا زبونك الجديد', { species: 'human', pitch: 0.85 });
      }),
      row(410, `الاهتزاز: ${s.vibration ? 'يعمل' : 'مغلق'}`, s.vibration, () => { s.vibration = !s.vibration; Game.saveSettings(); vibrate(60); this.buildButtons(); }),
      makeButton(this, W / 2, 520, 'مسح التقدّم المحفوظ', {
        w: 360, h: 56, color: COL.red, size: 19,
        onClick: () => modal(this, {
          title: 'متأكد؟',
          body: 'سيتم حذف الورشة وكل التطويرات والفلوس نهائياً.',
          buttons: [
            { label: 'نعم، احذف', color: COL.red, onClick: () => { Game.clear(); this.scene.start('Menu'); } },
            { label: 'تراجع', color: COL.cyan },
          ],
        }),
      }),
      makeButton(this, W / 2, 860, 'رجوع', { w: 260, h: 62, color: COL.cyan, size: 22, onClick: () => { Voice.stop(); this.scene.start(this.from); } }),
    ];
    const vinfo = Voice.hasReal ? 'جهازك فيه صوت عربي رجالي: الشخصيات تقرأ كلامها بصوت حقيقي في الوضع التلقائي.' : 'جهازك ما فيه صوت عربي رجالي، فالشخصيات تتكلم بالهمهمة (لكل شخصية نبرتها).';
    this.info = T(this, W / 2, 700, `${vinfo}
التقدّم يُحفظ تلقائياً في نهاية كل يوم وبعد كل شراء.`, 14, '#8a94b8', { align: 'center', wrap: 440 });
  }
}
