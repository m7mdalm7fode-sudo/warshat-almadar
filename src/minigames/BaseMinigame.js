// الأساس المشترك لكل الألعاب المصغّرة
export default class BaseMinigame {
  static baseTime = 30;

  constructor(scene, cfg) {
    this.s = scene;
    this.cfg = cfg;
    this.d = cfg.difficulty || 0;
    this.mods = cfg.mods || {};
    this.A = cfg.area;
    this.mistakes = 0;
    this.over = false;
  }

  get title() { return ''; }
  get hint() { return ''; }
  start() {}
  update() {}
  timeout() { return { success: false, accuracy: 0 }; }

  win(acc) {
    if (this.over) return;
    this.over = true;
    this.cfg.finish(true, Math.max(0, Math.min(1, acc)));
  }

  lose() {
    if (this.over) return;
    this.over = true;
    this.cfg.finish(false, 0);
  }
}
