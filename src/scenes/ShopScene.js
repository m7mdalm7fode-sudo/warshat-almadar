import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera, fmt } from '../ui/theme.js';
import { Game, UPGRADES, DESIGNS } from '../state.js';
import { Music } from '../music.js';
import { Sfx, vibrate } from '../audio.js';
import { starField } from '../gfx/City.js';
import { drawTower } from '../gfx/TowerView.js';
import { makeButton } from '../ui/Button.js';
import { addVignette } from '../gfx/Painter.js';
import { modal, floatText } from '../ui/Popup.js';
import { TYPES, TYPE_NAMES, skillLevel, nextLevelXp } from '../systems/progress.js';

export default class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }

  create() {
    setupCamera(this);
    Music.play('shop');
    if (!Game.state && !Game.load()) { this.scene.start('Menu'); return; }
    this.modalOpen = false;
    starField(this, 90);
    this.st = Game.state;
    this.build();
    addVignette(this, 0.3, 0.9);
    this.cameras.main.fadeIn(300);
  }

  build() {
    if (this.layer) this.layer.destroy();
    const st = this.st;
    const L = this.add.container(0, 0);
    this.layer = L;
    L.add(T(this, W / 2, 40, 'متجر التطويرات', 32, HEX(COL.gold), { weight: 900, align: 'center', shadow: HEX(COL.gold) }));
    L.add(T(this, W / 2, 82, `◈ ${fmt(st.money)}`, 24, '#ffd34a', { weight: 900, align: 'center' }));
    const stageNames = ['', 'كشك صغير', 'ملجأ', 'برج من أدوار', 'سفينة فضاء'];
    L.add(T(this, W / 2, 112, `المرحلة ${st.stage}: ${stageNames[st.stage]}`, 15, '#8a94b8', { align: 'center' }));

    const tower = drawTower(this, st, { x: W / 2, y: 364, scale: 0.6, ghost: true });
    L.add(tower);

    const items = this.available();
    const top = 392, gap = 61;
    items.forEach((u, i) => this.card(L, u, top + i * gap));
    if (!items.length) L.add(T(this, W / 2, 500, 'اشتريت كل شيء!', 20, '#8a94b8', { align: 'center' }));

    L.add(makeButton(this, 330, 912, `ابدأ اليوم ${st.day}`, { w: 300, h: 62, color: COL.green, size: 22, onClick: () => this.startDay() }));
    L.add(makeButton(this, 76, 82, 'المهارات', { w: 112, h: 40, color: COL.green, size: 15, onClick: () => this.showSkills() }));
    L.add(makeButton(this, 92, 912, 'القائمة', { w: 130, h: 62, color: COL.purple, size: 18, onClick: () => { Game.save(); this.scene.start('Menu'); } }));
  }

  showSkills() {
    const m = this.st.mastery || {};
    const lines = TYPES.map((t) => {
      const xp = m[t] || 0, lvl = skillLevel(xp), nx = nextLevelXp(xp);
      const bar = '▰'.repeat(lvl) + '▱'.repeat(5 - lvl);
      return `${TYPE_NAMES[t]}: مستوى ${lvl} ${bar}\n   +${(lvl - 1) * 6}% وقت · +${(lvl - 1) * 5}% أجر${nx ? ` · الخبرة ${xp}/${nx}` : ' · أعلى مستوى!'}`;
    });
    modal(this, {
      title: 'مهارات الفنّي',
      body: `كل إصلاح ناجح يعطيك خبرة في نوعه (والممتاز ضعفها).\n\n${lines.join('\n')}`,
      buttons: [{ label: 'تمام', color: COL.cyan }],
    });
  }

  available() {
    const st = this.st;
    return UPGRADES.filter((u) => {
      const lvl = st.upgrades[u.id] || 0;
      if (u.type === 'tool') return lvl < u.cost.length || false;
      if (u.type === 'stage') return st.stage === 1;
      if (u.type === 'floor') return st.stage >= 2 && !lvl;
      if (u.type === 'engine') return st.stage >= 2 && !lvl;
      return false;
    });
  }

  card(L, u, y) {
    const st = this.st;
    const lvl = st.upgrades[u.id] || 0;
    const cost = u.cost[Math.min(lvl, u.cost.length - 1)];
    const locked = u.type === 'engine' && st.floors.length < (u.requiresFloors || 0);
    const can = !locked && st.money >= cost;
    const accent = u.type === 'engine' ? COL.pink : u.type === 'floor' ? COL.purple : u.type === 'stage' ? COL.gold : COL.cyan;
    const g = this.add.graphics();
    g.fillStyle(0x120c26, 0.95); g.fillRoundedRect(24, y - 27, 492, 55, 14);
    g.lineStyle(2, accent, 0.7); g.strokeRoundedRect(24, y - 27, 492, 55, 14);
    g.fillStyle(accent, 1); g.fillRoundedRect(506, y - 20, 5, 40, 2);
    L.add(g);
    const lvlTxt = u.cost.length > 1 ? `  (${lvl}/${u.cost.length})` : '';
    L.add(T(this, 496, y - 11, u.name + lvlTxt, 18, '#eaf6ff', { bold: true, ox: 1 }));
    L.add(T(this, 496, y + 13, locked ? `يتطلب بناء ${u.requiresFloors} أدوار أولاً` : u.desc, 12, locked ? '#ff8fd0' : '#9aa7c7', { ox: 1, wrap: 330 }));
    const b = makeButton(this, 96, y, `◈ ${fmt(cost)}`, {
      w: 130, h: 42, color: can ? COL.green : COL.dim, size: 18, disabled: !can,
      onClick: () => this.buy(u, cost),
    });
    L.add(b);
  }

  buy(u, cost) {
    const st = this.st;
    if (st.money < cost) return;
    if (u.type === 'stage') { this.chooseDesign(u, cost); return; }
    if (u.type === 'engine') {
      modal(this, {
        title: 'جاهز للإطلاق؟',
        body: 'تركيب المحرّك المداري يحوّل ورشتك إلى سفينة فضاء وتنطلق بها نحو النجوم. هذه نهاية رحلتك في سوق المدار!',
        buttons: [
          { label: 'ركّب المحرّك وانطلق!', color: COL.pink, onClick: () => this.purchase(u, cost, () => this.launch()) },
          { label: 'ليس بعد', color: COL.cyan },
        ],
      });
      return;
    }
    this.purchase(u, cost);
  }

  purchase(u, cost, after) {
    const st = this.st;
    st.money -= cost;
    st.upgrades[u.id] = (st.upgrades[u.id] || 0) + 1;
    if (u.type === 'floor') st.floors.push(u.id);
    if (u.toStage) st.stage = Math.max(st.stage, u.toStage);
    Game.save();
    Sfx.buy();
    vibrate(30);
    this.cameras.main.flash(200, 255, 201, 74);
    if (after) { after(); return; }
    this.build();
    floatText(this, W / 2, 300, `تم شراء: ${u.name}`, '#3dff8a', 22);
  }

  chooseDesign(u, cost) {
    const c = modal(this, {
      title: 'اختر تصميم الملجأ',
      body: 'كل تصميم يغيّر شكل ورشتك من الداخل والخارج.',
      width: 490,
      extra: {
        h: 250,
        build: (cont, y) => {
          DESIGNS.forEach((d, i) => {
            const x = W / 2 + (1 - i) * 150;
            const fake = { ...this.st, stage: 2, shelterDesign: d.id, floors: [], upgrades: {} };
            const tw = drawTower(this, fake, { x, y: y + 150, scale: 0.55, ghost: false });
            cont.add(tw);
            const btn = makeButton(this, x, y + 200, d.name, {
              w: 140, h: 48, color: [COL.cyan, COL.gold, COL.pink][i], size: 15,
              onClick: () => {
                c.close();
                this.st.shelterDesign = d.id;
                this.purchase(u, cost);
              },
            });
            cont.add(btn);
            cont.add(T(this, x, y + 238, d.desc, 11, '#9aa7c7', { align: 'center', wrap: 140 }));
          });
        },
      },
      buttons: [{ label: 'تراجع', color: COL.red }],
    });
  }

  launch() {
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Ending'));
  }

  startDay() {
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Workshop'));
  }
}
