import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera, fmt } from '../ui/theme.js';
import { Game, getMods, difficulty, clampRep } from '../state.js';
import { Sfx, vibrate } from '../audio.js';
import { buildDayQueue, resolveVisit, reactionLine } from '../systems/customers.js';
import { Character } from '../gfx/CharacterGenerator.js';
import { drawItem } from '../gfx/ItemArt.js';
import { drawCity } from '../gfx/City.js';
import { drawInterior, drawCounter, COUNTER_Y } from '../gfx/Interior.js';
import { PlayerHands } from '../gfx/Hands.js';
import { TopBar } from '../ui/TopBar.js';
import { DialogBox } from '../ui/DialogBox.js';
import { makeButton } from '../ui/Button.js';
import { floatText, banner, modal } from '../ui/Popup.js';
import { addVignette } from '../gfx/Painter.js';

const CHAR_X = 270;
const CHAR_Y = COUNTER_Y + 16;

export default class WorkshopScene extends Phaser.Scene {
  constructor() { super('Workshop'); }

  create() {
    setupCamera(this);
    if (!Game.state && !Game.load()) { this.scene.start('Menu'); return; }
    this.modalOpen = false;
    this.st = Game.state;
    this.st.pendingShop = false;
    this.mods = getMods(this.st);

    drawCity(this, 0, 58, W, 540, { depth: 0 });
    drawInterior(this, this.st);
    drawCounter(this, this.st);
    this.hands = new PlayerHands(this);
    addVignette(this, 0.32, 0.9);
    this.dialog = new DialogBox(this, 600);
    this.topBar = new TopBar(this, { onMenu: () => this.openMenu() });
    this.choices = [];
    this.itemLabel = null;

    this.dayTime = this.mods.dayTime;
    this.queue = buildDayQueue(this.st);
    this.total = this.queue.length;
    this.served = 0;
    this.log = { served: 0, refused: 0, failed: 0, earned: 0, fines: 0, bonus: 0, perfect: 0, repStart: this.st.rep, events: [] };
    this.refreshBar();

    this.cameras.main.fadeIn(400);
    if (!this.st.introSeen) this.time.delayedCall(450, () => this.showIntro());
    else this.time.delayedCall(500, () => this.startDayBanner());
  }

  refreshBar() {
    this.topBar.update(this.st, this.dayTime, Math.max(0, this.total - this.queue.length - 1), this.total);
  }

  showIntro() {
    modal(this, {
      title: 'أهلاً بك في سوق المدار',
      body: 'ورثتَ عن عمّك كشكاً صغيراً في سوق «المدار»، أكبر محطة تجارية تدور حول الكوكب.\n\nاستقبل الزبائن، وأصلح أغراضهم بيديك، وابنِ سمعتك.\nطوّر الكشك إلى ملجأ، ثم برج من أدوار... حتى تركّب له محركاً وتطلقه بين النجوم!\n\nانتبه: بعض الزبائن يحملون عروضاً مشبوهة، وقراراتك لها عواقب.',
      buttons: [{ label: 'يلّا نبدأ!', color: COL.green, onClick: () => { this.st.introSeen = true; Game.save(); this.startDayBanner(); } }],
    });
  }

  startDayBanner() {
    banner(this, `اليوم ${this.st.day} — ${this.total} زبائن`, COL.cyan, 1300);
    this.time.delayedCall(1500, () => this.nextCustomer());
  }

  openMenu() {
    if (this.modalOpen) return;
    const s = Game.settings;
    const m = modal(this, {
      title: 'استراحة',
      body: 'تقدّم اليوم الحالي لا يُحفظ إلا بنهايته.',
      buttons: [
        { label: 'استئناف', color: COL.green },
        { label: `الصوت: ${s.sound ? 'يعمل' : 'مغلق'}`, color: COL.cyan, onClick: () => { s.sound = !s.sound; Game.saveSettings(); if (!s.sound) Sfx.stopAmbient(); else Sfx.startAmbient(); this.time.delayedCall(10, () => this.openMenu()); } },
        { label: `الاهتزاز: ${s.vibration ? 'يعمل' : 'مغلق'}`, color: COL.purple, onClick: () => { s.vibration = !s.vibration; Game.saveSettings(); this.time.delayedCall(10, () => this.openMenu()); } },
        { label: 'القائمة الرئيسية', color: COL.red, onClick: () => { Game.load(); this.scene.start('Menu'); } },
      ],
    });
    return m;
  }

  // ---------------- دورة الزبون ----------------
  nextCustomer() {
    this.clearChoices();
    if (this.queue.length && this.dayTime <= 0) {
      // انتهى الدوام: الزبائن المهمّون يرجعون بكرة
      this.queue.forEach((e) => { if (e.type === 'story') this.st.schedule.push({ id: e.id, day: this.st.day + 1 }); });
      this.queue = [];
      banner(this, 'انتهى وقت الدوام!', COL.red, 1500);
      this.time.delayedCall(1700, () => this.endDay());
      return;
    }
    if (!this.queue.length) { this.endDay(); return; }
    const entry = this.queue.shift();
    const v = resolveVisit(entry, this.st, this.mods);
    if (!v) { this.nextCustomer(); return; }
    if (v.id && v.kind === 'story') this.st.seen[v.id] = true;
    this.v = v;
    this.negotiated = false;
    this.refreshBar();

    const fromLeft = Math.random() < 0.5;
    const ch = new Character(this, fromLeft ? -140 : W + 140, CHAR_Y, v.look);
    ch.setDepth(20);
    this.char = ch;
    ch.enter(CHAR_X, () => {
      ch.react(v.moral ? 'thinking' : 'confused');
      const tag = v.moral ? COL.pink : v.kind === 'recurring' ? COL.gold : COL.cyan;
      this.dialog.show(v.name, v.lines, () => this.placeItem(), { tagColor: tag });
    });
  }

  placeItem() {
    const v = this.v;
    const after = () => (v.moral ? this.showMoral() : this.showChoices());
    if (!v.itemKind) { after(); return; }
    const scale = v.moral ? 0.62 : 0.85;
    const y = v.moral ? 790 : 800;
    this.item = drawItem(this, v.itemKind).setPosition(CHAR_X, 700).setDepth(40).setScale(scale).setAlpha(0);
    this.tweens.add({
      targets: this.item, y, alpha: 1, duration: 420, ease: 'Bounce.easeOut',
      onComplete: () => { Sfx.drop(); this.hands.flinch(); vibrate(20); },
    });
    this.itemLabel = T(this, CHAR_X, v.moral ? 836 : 866, v.itemName || '', 15, '#9fe9c8', { bold: true, align: 'center' }).setDepth(41);
    this.time.delayedCall(450, after);
  }

  clearChoices() {
    this.choices.forEach((b) => b.destroy());
    this.choices = [];
  }

  showChoices() {
    this.clearChoices();
    const v = this.v;
    const y = 912;
    this.choices.push(makeButton(this, 418, y, `قبول ◈${v.price}`, { w: 170, h: 60, color: COL.green, size: 20, depth: 70, onClick: () => this.accept() }));
    this.choices.push(makeButton(this, 270, y, 'فاوض', { w: 118, h: 60, color: COL.gold, size: 20, depth: 70, disabled: this.negotiated, onClick: () => this.negotiate() }));
    this.choices.push(makeButton(this, 122, y, 'رفض', { w: 170, h: 60, color: COL.red, size: 20, depth: 70, onClick: () => this.refuse() }));
    this.dialog.hold(v.name, `السعر المعروض: ${v.price} كريدت. وش قرارك؟`, COL.gold);
  }

  negotiate() {
    this.clearChoices();
    this.negotiated = true;
    const chance = Phaser.Math.Clamp(0.3 + this.st.rep * 0.08 + this.mods.negotiate, 0.1, 0.92);
    this.dialog.show('أنت', [reactionLine('playerNegotiate')], () => {
      const roll = Math.random();
      if (roll < chance) {
        this.v.price = Math.round((this.v.price * 1.3) / 5) * 5;
        this.char.react('yes');
        Sfx.coin();
        this.dialog.show(this.v.name, [reactionLine('negYes', this.v)], () => this.showChoices());
      } else if (Math.random() < 0.3) {
        this.char.react('angry');
        vibrate([40, 40, 40]);
        this.changeRep(-0.05);
        this.remember('refused');
        this.dialog.show(this.v.name, [reactionLine('negLeave', this.v)], () => this.leave(), { auto: 1400 });
      } else {
        this.char.react('impatient');
        this.dialog.show(this.v.name, [reactionLine('negNo', this.v)], () => this.showChoices());
      }
    }, { tagColor: COL.green });
  }

  refuse() {
    this.clearChoices();
    this.char.react('no');
    this.log.refused += 1;
    this.st.stats.refused += 1;
    this.changeRep(-0.03);
    this.remember('refused');
    this.dialog.show(this.v.name, [reactionLine('refused', this.v)], () => this.leave(), { auto: 1300 });
  }

  accept() {
    this.clearChoices();
    this.char.react('happy');
    this.hands.reach(() => this.launchMinigame(this.v.minigame, (res) => this.afterRepair(res)));
  }

  launchMinigame(type, cb) {
    this.dialog.hide();
    this.scene.launch('Minigame', {
      type,
      difficulty: difficulty(this.st),
      mods: this.mods,
      itemKind: this.v.itemKind,
      itemName: this.v.itemName,
      onDone: (res) => {
        this.scene.resume();
        this.dayTime = Math.max(0, this.dayTime - res.timeUsed);
        this.refreshBar();
        cb(res);
      },
    });
    this.scene.pause();
  }

  afterRepair(res) {
    const v = this.v;
    let pay = 0, dRep, cat, mood;
    if (res.success) {
      pay = Math.round(v.price * (0.45 + 0.55 * res.score));
      if (res.score >= 0.85) { dRep = 0.12; cat = 'great'; mood = 'great'; this.log.perfect += 1; this.st.stats.perfect += 1; }
      else if (res.score >= 0.6) { dRep = 0.05; cat = 'ok'; mood = 'happy'; }
      else { dRep = -0.08; cat = 'bad'; mood = 'sad'; }
      this.remember(res.score >= 0.6 ? 'good' : 'bad');
    } else {
      dRep = -0.3; cat = 'fail'; mood = 'angry';
      this.log.failed += 1;
      this.st.stats.failed += 1;
      this.remember('bad');
    }
    this.served += 1;
    this.log.served += 1;
    this.st.stats.served += 1;
    this.char.react(mood);
    if (pay > 0) this.earn(pay);
    this.changeRep(dRep);
    this.dialog.show(v.name, [reactionLine(cat, v)], () => this.leave(), { auto: 1500 });
  }

  // ---------------- الخيارات الأخلاقية ----------------
  showMoral() {
    this.clearChoices();
    const opts = this.v.moral.options;
    const pos = opts.length === 1 ? [[270, 902]] : opts.length === 2 ? [[392, 902], [148, 902]] : [[392, 874], [148, 874], [270, 932]];
    opts.forEach((o, i) => {
      const [x, y] = pos[i];
      const color = (o.rep ?? 0) < 0 || (o.money ?? 0) > 150 ? COL.pink : (o.rep ?? 0) > 0 ? COL.green : o.check ? COL.gold : COL.cyan;
      this.choices.push(makeButton(this, x, y, o.label, { w: opts.length === 1 ? 300 : 230, h: 50, color, size: 17, depth: 70, onClick: () => this.chooseMoral(o) }));
    });
    this.dialog.hold(this.v.name, 'القرار لك... وكل قرار له ثمن.', COL.pink);
  }

  chooseMoral(opt) {
    this.clearChoices();
    let eff = opt;
    if (opt.check) eff = this.st.rep >= opt.check.rep ? opt.pass : opt.fail;
    if (opt.repair) {
      this.char.react('yes');
      this.hands.reach(() => this.launchMinigame(this.v.minigame, (res) => {
        this.served += 1; this.log.served += 1; this.st.stats.served += 1;
        if (res.success) {
          this.applyEffects(eff, res.score);
          this.remember(res.score >= 0.6 ? 'good' : 'bad');
          this.char.react(eff.mood || 'happy');
          this.dialog.show(this.v.name, [eff.reply], () => this.leave(), { auto: 1700 });
        } else {
          this.changeRep(-0.2);
          this.remember('bad');
          this.log.failed += 1;
          this.char.react('angry');
          this.dialog.show(this.v.name, [reactionLine('repairFail', this.v)], () => this.leave(), { auto: 1500 });
        }
      }));
      return;
    }
    this.served += 1;
    this.applyEffects(eff, 1);
    this.remember(eff.rep >= 0 ? 'good' : 'bad');
    this.char.react(eff.mood || ((eff.rep ?? 0) >= 0 ? 'yes' : 'angry'));
    this.dialog.show(this.v.name, [eff.reply], () => this.leave(), { auto: 1800 });
  }

  applyEffects(eff, score = 1) {
    const st = this.st;
    let money = eff.money || 0;
    if (money > 0 && eff.repair) money = Math.round(money * (0.7 + 0.3 * score));
    if (money > 0) this.earn(money, true);
    if (money < 0) {
      st.money = Math.max(0, st.money + money);
      this.log.fines += -money;
      this.log.events.push(`${this.v.name}: −${fmt(-money)}`);
      floatText(this, 270, 470, `−◈${fmt(-money)}`, '#ff4d5e');
      Sfx.error();
      vibrate([60, 40, 60]);
    }
    if (eff.rep) this.changeRep(eff.rep);
    (eff.flags || []).forEach((f) => { st.flags[f] = true; });
    (eff.schedule || []).forEach((s) => st.schedule.push({ id: s.id, day: st.day + s.delay }));
    this.refreshBar();
  }

  earn(amount, special = false) {
    this.st.money += amount;
    this.st.stats.earned += amount;
    this.log.earned += amount;
    if (special) { this.log.bonus += amount; this.log.events.push(`${this.v.name}: +${fmt(amount)}`); }
    floatText(this, 270, 470, `+◈${fmt(amount)}`, '#ffd34a');
    Sfx.coin();
    this.refreshBar();
  }

  changeRep(d) {
    if (!d) return;
    const dd = d > 0 ? d * this.mods.repMult : d;
    this.st.rep = clampRep(this.st.rep + dd);
    floatText(this, 380, 90, `${dd > 0 ? '+' : '−'}${Math.abs(dd).toFixed(2)} ★`, dd > 0 ? '#ffd34a' : '#ff4d5e', 18);
    this.refreshBar();
  }

  remember(outcome) {
    const k = this.v.memKey;
    if (!k) return;
    const prev = this.st.memory[k] || { visits: 0 };
    this.st.memory[k] = { visits: prev.visits + 1, last: outcome, lastDay: this.st.day };
  }

  leave() {
    this.clearChoices();
    this.dialog.hide();
    if (this.itemLabel) { this.itemLabel.destroy(); this.itemLabel = null; }
    if (this.item) {
      const it = this.item;
      this.item = null;
      this.tweens.add({ targets: it, y: 640, alpha: 0, scale: 0.4, duration: 380, ease: 'Cubic.easeIn', onComplete: () => it.destroy() });
    }
    const ch = this.char;
    this.char = null;
    if (ch) ch.leave(Math.random() < 0.5 ? -160 : W + 160);
    this.time.delayedCall(1100, () => this.nextCustomer());
  }

  endDay() {
    const st = this.st;
    const passive = this.mods.passive || 0;
    st.money += passive;
    const log = { ...this.log, passive, repEnd: st.rep, day: st.day };
    st.day += 1;
    st.pendingShop = true;
    Game.save();
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Summary', { log }));
  }
}
