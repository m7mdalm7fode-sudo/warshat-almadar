import Phaser from 'phaser';
import { W, H, T, COL, HEX, setupCamera, fmt } from '../ui/theme.js';
import { Game, getMods, difficulty, clampRep } from '../state.js';
import { Sfx, vibrate } from '../audio.js';
import { buildDayQueue, resolveVisit, reactionLine, CUSTOMER_DATA } from '../systems/customers.js';
import { Character, makeLook, hashStr } from '../gfx/CharacterGenerator.js';
import { boardReports, stallPrompts, THIEF_DATA, TROPHIES } from '../systems/cases.js';
import { drawTrophies, newsTicker, reportsBoard, trophyIcon } from '../gfx/Trophies.js';
import { painted } from '../gfx/Painter.js';
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
    this.char = null; this.item = null; this.itemLabel = null; this.officer = null;
    this.stallHud = null; this.stallTick = null; this.copLights = null; this.copSiren = null;
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
    this.log = { served: 0, refused: 0, failed: 0, earned: 0, fines: 0, bonus: 0, perfect: 0, arrests: 0, repStart: this.st.rep, events: [] };

    // رف الهدايا، شريط الأخبار، لوحة البلاغات
    this.st.trophies = this.st.trophies || [];
    this.st.news = this.st.news || [];
    this.trophyLayer = drawTrophies(this, this.st);
    newsTicker(this, this.st);
    this.board = reportsBoard(this, () => this.openBoard());
    this.board.setCount(boardReports(this.st).length);
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
    this.board.pulse(v.kind === 'suspect');
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
    const after = () => {
      if (v.kind === 'suspect' && !this.st.tipBoard) { this.st.tipBoard = true; this.showSuspectTip(); return; }
      if (v.moral) this.showMoral(); else this.showChoices();
    };
    if (!v.itemKind) { after(); return; }
    const scale = v.moral ? 0.62 : 0.85;
    const y = v.moral ? 790 : 800;
    this.item = drawItem(this, v.itemKind).setPosition(CHAR_X, 700).setDepth(40).setScale(scale).setAlpha(0);
    this.tweens.add({
      targets: this.item, y, alpha: 1, duration: 420, ease: 'Bounce.easeOut',
      onComplete: () => { Sfx.drop(); this.hands.flinch(); vibrate(20); },
    });
    const label = v.engraving ? `${v.itemName} — محفور عليه: «${v.engraving}»` : (v.itemName || '');
    this.itemLabel = T(this, CHAR_X, v.moral ? 836 : 866, label, 15, v.engraving ? '#ffd28a' : '#9fe9c8', { bold: true, align: 'center' }).setDepth(41);
    this.time.delayedCall(450, after);
  }

  clearChoices() {
    this.choices.forEach((b) => b.destroy());
    this.choices = [];
  }

  showChoices() {
    this.clearChoices();
    const v = this.v;
    if (v.kind === 'suspect') { this.showSuspectChoices(); return; }
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
    if (this.v.kind === 'suspect' && this.v.thief) delete this.st.cases[this.v.ownerId];
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
    if (v.kind === 'suspect' && v.thief) {
      // صلّحت غرضاً مسروقاً: صاحبه سيأتي يسأل عنه لاحقاً
      this.st.cases[v.ownerId] = 'fenced';
      this.st.schedule.push({ kind: 'owner', id: v.ownerId, mode: 'lost', day: this.st.day + 2 });
    }
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
    if (eff.news) this.pushNews(eff.news);
    if (eff.trophy) this.giveTrophy(eff.trophy);
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

  // ================= نظام المسروقات =================
  openBoard() {
    if (this.modalOpen) return;
    const reps = boardReports(this.st);
    const body = reps.length
      ? reps.map((o, i) => `${i + 1}) مسروق: «${o.item.name}»\n    المالك: ${o.name}`).join('\n\n')
      : 'لا توجد بلاغات مسروقات اليوم.';
    modal(this, {
      title: 'لوحة بلاغات الأمن',
      body: `${body}\n\nإذا جاءك غرض محفور عليه اسم أحد الملّاك هنا... فهو مسروق.`,
      buttons: [{ label: 'تمام', color: COL.cyan }],
    });
  }

  showSuspectTip() {
    modal(this, {
      title: 'زبون مريب!',
      body: 'بعض الزبائن يجيبون أغراضاً مسروقة. قارن الاسم المحفور على الغرض مع «لوحة البلاغات» على الجدار يمين النافذة.\n\nإذا تطابق: بلّغ الشرطة بهدوء، وشغّل اللص بالكلام لين توصل، وانتبه لا يشكّ ويهرب.\n\nولو بلّغت على شخص بريء... تخسر من سمعتك.',
      buttons: [
        { label: 'افتح لوحة البلاغات', color: COL.gold, onClick: () => { this.showSuspectChoices(); this.time.delayedCall(50, () => this.openBoard()); } },
        { label: 'فهمت', color: COL.cyan, onClick: () => this.showSuspectChoices() },
      ],
    });
  }

  showSuspectChoices() {
    this.clearChoices();
    const v = this.v;
    const y = 912;
    this.choices.push(makeButton(this, 418, y, `اقبل ◈${v.price}`, { w: 170, h: 60, color: COL.green, size: 19, depth: 70, onClick: () => this.accept() }));
    this.choices.push(makeButton(this, 236, y, 'بلّغ الشرطة', { w: 180, h: 60, color: COL.pink, size: 19, depth: 70, onClick: () => this.reportPolice() }));
    this.choices.push(makeButton(this, 84, y, 'رفض', { w: 116, h: 60, color: COL.red, size: 19, depth: 70, onClick: () => this.refuse() }));
    this.dialog.hold(v.name, `يدفع ${v.price} كريدت... قارن الاسم المحفور بلوحة البلاغات قبل لا تقرّر.`, COL.pink);
  }

  reportPolice() {
    this.clearChoices();
    this.board.pulse(false);
    Sfx.beep(700, 0.05);
    const hud = this.add.container(0, 0).setDepth(85);
    this.stallHud = hud;
    const g = this.add.graphics();
    g.fillStyle(0x07040f, 0.9); g.fillRoundedRect(100, 100, 340, 80, 14);
    g.lineStyle(2, COL.pink, 0.8); g.strokeRoundedRect(100, 100, 340, 80, 14);
    hud.add(g);
    hud.add(T(this, 428, 122, 'وصول الشرطة', 13, '#9ff8ff', { bold: true, ox: 1 }));
    hud.add(T(this, 428, 156, 'شكّ الزبون', 13, '#ff9aa5', { bold: true, ox: 1 }));
    this.stallG = this.add.graphics();
    hud.add(this.stallG);
    hud.setAlpha(0);
    this.tweens.add({ targets: hud, alpha: 1, duration: 300 });
    this.eta = 0; this.sus = 10;
    this.drawStall();
    if (this.item) this.tweens.add({ targets: this.item, alpha: 0.3, duration: 300 });
    if (this.itemLabel) this.itemLabel.setVisible(false);
    this.stallQ = stallPrompts(3);
    this.stallI = 0;
    this.dialog.show('أنت', ['(تكتب رسالة للشرطة من تحت الطاولة...)', 'لازم أشغله بالكلام لين يوصلون.'], () => this.nextStall(), { tagColor: COL.pink });
  }

  drawStall() {
    const g = this.stallG;
    g.clear();
    g.fillStyle(0x1b1d2a); g.fillRoundedRect(112, 114, 224, 16, 8); g.fillRoundedRect(112, 148, 224, 16, 8);
    g.fillStyle(0x29f0ff); g.fillRoundedRect(112, 114, Math.max(10, (224 * this.eta) / 100), 16, 8);
    const sc = this.sus > 70 ? COL.red : this.sus > 40 ? COL.gold : COL.green;
    g.fillStyle(sc); g.fillRoundedRect(112, 148, Math.max(10, (224 * this.sus) / 100), 16, 8);
  }

  nextStall() {
    if (this.sus >= 100) { this.suspectRuns(); return; }
    if (this.stallI >= this.stallQ.length) { this.policeArrive(this.v.thief ? 'caught' : 'innocent'); return; }
    const p = this.stallQ[this.stallI++];
    this.char.react(this.sus > 50 ? 'impatient' : 'confused');
    this.dialog.show(this.v.name, [p.q], () => this.stallAnswers(p), { tagColor: COL.red });
  }

  stallAnswers(p) {
    this.clearChoices();
    this.dialog.hold(this.v.name, p.q, COL.red);
    [784, 838, 892].forEach((y, i) => {
      const [txt, val] = p.a[i];
      this.choices.push(makeButton(this, 270, y, txt, { w: 460, h: 46, size: 16, color: COL.cyan, depth: 70, onClick: () => this.answerStall(val) }));
    });
    this.stallLeft = 6;
    this.stallTimerG = this.add.graphics().setDepth(71);
    this.stallTick = this.time.addEvent({
      delay: 50, loop: true,
      callback: () => {
        this.stallLeft -= 0.05;
        const f = Math.max(0, this.stallLeft / 6);
        this.stallTimerG.clear();
        this.stallTimerG.fillStyle(0x07040f, 0.8); this.stallTimerG.fillRoundedRect(40, 748, 460, 10, 5);
        this.stallTimerG.fillStyle(f > 0.4 ? COL.cyan : COL.red); this.stallTimerG.fillRoundedRect(40, 748, 460 * f, 10, 5);
        if (this.stallLeft <= 0) this.answerStall(35, true);
      },
    });
  }

  answerStall(val, timedOut = false) {
    if (!this.stallTick) return;
    this.stallTick.remove(); this.stallTick = null;
    this.stallTimerG.destroy();
    this.clearChoices();
    const add = val + Math.random() * 8;
    this.sus = Math.min(100, this.sus + add);
    this.eta = Math.min(100, this.eta + 34);
    this.drawStall();
    if (timedOut) floatText(this, 270, 760, 'تأخّرت بالرد!', '#ff4d5e', 22);
    if (add >= 40) { this.char.react('angry'); vibrate(60); } else if (add >= 15) this.char.react('thinking'); else this.char.react('yes');
    Sfx.tick();
    this.time.delayedCall(800, () => this.nextStall());
  }

  suspectRuns() {
    const v = this.v;
    this.clearChoices();
    if (!v.thief) {
      this.char.react('angry');
      this.changeRep(-0.05);
      this.dialog.show(v.name, ['تتصل على أحد عني؟! أنا ماشي، وغرضي معي.'], () => this.finishCase(true), { auto: 1500 });
      return;
    }
    this.char.react('angry');
    Sfx.whoosh();
    this.dialog.show(v.name, [THIEF_DATA.stall.flee], () => {
      const ch = this.char; this.char = null;
      ch.leave(-180);
      this.time.delayedCall(700, () => this.policeArrive('escaped'));
    }, { auto: 900 });
  }

  officerLook() {
    const def = CUSTOMER_DATA.story.find((c) => c.id === 'officer_reward');
    return makeLook(def.look, hashStr('officer'));
  }

  policeLights(on) {
    if (this.copLights) { this.copLights.forEach((o) => o.destroy()); this.copLights = null; }
    if (this.copSiren) { this.copSiren.remove(); this.copSiren = null; }
    if (!on) return;
    const red = this.add.image(160, 300, 'glowTex').setTint(0xff2040).setScale(5).setBlendMode('ADD').setAlpha(0).setDepth(55);
    const blue = this.add.image(380, 300, 'glowTex').setTint(0x2060ff).setScale(5).setBlendMode('ADD').setAlpha(0).setDepth(55);
    this.copLights = [red, blue];
    let flip = false;
    this.copSiren = this.time.addEvent({
      delay: 330, loop: true,
      callback: () => {
        flip = !flip;
        red.setAlpha(flip ? 0.55 : 0.05); blue.setAlpha(flip ? 0.05 : 0.55);
        Sfx.tone(flip ? 720 : 960, 0.3, { type: 'sawtooth', vol: 0.05 });
      },
    });
  }

  policeArrive(mode) {
    this.clearChoices();
    this.dialog.hide();
    this.policeLights(true);
    vibrate([100, 60, 100]);
    const v = this.v;
    const off = new Character(this, W + 160, CHAR_Y, this.officerLook());
    off.setDepth(21);
    this.officer = off;
    if (this.char) { this.tweens.add({ targets: this.char, x: 180, duration: 500 }); this.char.react('surprised'); }
    off.enter(this.char ? 380 : CHAR_X, () => {
      const S = THIEF_DATA.stall;
      if (mode === 'caught') {
        this.dialog.show('الرقيب صخر', S.caught, () => this.arrest(), { tagColor: COL.cyan });
      } else if (mode === 'escaped') {
        this.dialog.show('الرقيب صخر', S.escaped, () => {
          this.changeRep(0.1);
          this.closeCaseReported('لص يهرب من ورشة المدار ويترك المسروقات خلفه');
          this.officerTakesItem(() => this.finishCase(false));
        }, { tagColor: COL.cyan });
      } else {
        this.dialog.show('الرقيب صخر', S.innocent, () => {
          this.changeRep(-0.3);
          this.log.events.push(`بلاغ خاطئ على ${v.name}`);
          this.char.react('angry');
          this.dialog.show(v.name, ['تتهمني قدّام الناس؟! ما عاد أرجع لورشتك.'], () => this.finishCase(true), { auto: 1600 });
        }, { tagColor: COL.cyan });
      }
    });
  }

  arrest() {
    const v = this.v;
    this.char.react('angry');
    this.cameras.main.flash(250, 255, 255, 255);
    Sfx.knock();
    this.time.delayedCall(150, () => Sfx.unlock());
    banner(this, 'تم القبض على اللص!', COL.green, 1500);
    this.st.stats.arrests = (this.st.stats.arrests || 0) + 1;
    this.log.arrests += 1;
    this.earn(100, true);
    this.changeRep(0.25);
    this.closeCaseReported(`القبض على «${v.name}» بعد بلاغ من ورشة المدار`);
    this.time.delayedCall(900, () => {
      const thief = this.char; this.char = null;
      if (thief) thief.leave(W + 200);
      this.time.delayedCall(250, () => this.officerTakesItem(() => this.finishCase(false)));
    });
  }

  closeCaseReported(news) {
    const v = this.v;
    this.st.cases[v.ownerId] = 'reported';
    this.st.schedule.push({ kind: 'owner', id: v.ownerId, mode: 'thanks', day: this.st.day + 1 });
    this.pushNews(news);
    this.log.events.push(news);
  }

  officerTakesItem(cb) {
    if (this.itemLabel) { this.itemLabel.destroy(); this.itemLabel = null; }
    if (this.item) {
      const it = this.item; this.item = null;
      this.tweens.add({ targets: it, x: 380, y: 560, alpha: 0, scale: 0.3, duration: 500, onComplete: () => it.destroy() });
    }
    const off = this.officer; this.officer = null;
    if (off) off.leave(W + 200);
    this.time.delayedCall(400, cb);
  }

  finishCase(customerLeaves) {
    if (this.stallHud) { this.stallHud.destroy(); this.stallHud = null; }
    this.served += 1;
    this.log.served += 1;
    const ch = this.char; this.char = null;
    if (customerLeaves && ch) ch.leave(Math.random() < 0.5 ? -160 : W + 160);
    if (this.officer) { this.officer.leave(W + 200); this.officer = null; }
    if (this.itemLabel) { this.itemLabel.destroy(); this.itemLabel = null; }
    if (this.item) { const it = this.item; this.item = null; this.tweens.add({ targets: it, alpha: 0, duration: 300, onComplete: () => it.destroy() }); }
    this.dialog.hide();
    this.time.delayedCall(1000, () => { this.policeLights(false); this.nextCustomer(); });
  }

  pushNews(s) {
    this.st.news = [...(this.st.news || []), s].slice(-8);
  }

  giveTrophy(id) {
    const st = this.st;
    if (!st.trophies.includes(id)) st.trophies.push(id);
    this.mods = getMods(st);
    if (this.trophyLayer) this.trophyLayer.destroy();
    this.trophyLayer = drawTrophies(this, st);
    const tr = TROPHIES[id] || { name: id, desc: '' };
    Sfx.success();
    modal(this, {
      title: 'هدية جديدة!',
      body: `${tr.name}\n${tr.desc}\n\nانحطّت على رف الهدايا في ورشتك.`,
      extra: {
        h: 110,
        build: (c, y) => {
          const gl = this.add.image(W / 2, y + 50, 'glowTex').setTint(0xffc94a).setAlpha(0.5).setScale(1.6).setBlendMode('ADD');
          const ic = painted(this, W / 2, y + 50, trophyIcon(this, id));
          ic.setScale(ic.scale * 2.2);
          c.add([gl, ic]);
          this.tweens.add({ targets: ic, angle: { from: -6, to: 6 }, duration: 700, yoyo: true, repeat: -1 });
          this.tweens.add({ targets: gl, scale: 2, alpha: 0.25, duration: 800, yoyo: true, repeat: -1 });
        },
      },
      buttons: [{ label: 'رائع!', color: COL.gold }],
    });
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
