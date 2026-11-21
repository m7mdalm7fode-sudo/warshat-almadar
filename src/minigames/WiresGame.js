// 4) توصيل الأسلاك: وصّل الألوان المتطابقة بدون تقاطع
import Phaser from 'phaser';
import BaseMinigame from './BaseMinigame.js';
import { T, COL, HEX } from '../ui/theme.js';
import { Sfx, vibrate } from '../audio.js';

const COLORS = [0xff4d5e, 0x29f0ff, 0xffc94a, 0x3dff8a, 0xb36bff, 0xff8a2f];

export default class WiresGame extends BaseMinigame {
  static baseTime = 60;
  get title() { return 'توصيل الأسلاك'; }
  get hint() { return 'اسحب من كل طرف ملوّن إلى الطرف المطابق له. الأسلاك لا يجوز أن تتقاطع.'; }

  start() {
    const s = this.s, A = this.A;
    this.n = 5 + (this.d > 0.35 ? 1 : 0) + (this.d > 0.7 ? 1 : 0);
    this.k = this.n - 1;
    this.generate();
    this.size = 440;
    this.cell = this.size / this.n;
    this.bx = 270 - this.size / 2;
    this.by = A.y + 30;

    const g = s.add.graphics();
    g.fillStyle(0x0b1018); g.fillRoundedRect(this.bx - 12, this.by - 12, this.size + 24, this.size + 24, 18);
    g.lineStyle(2, COL.cyan, 0.5); g.strokeRoundedRect(this.bx - 12, this.by - 12, this.size + 24, this.size + 24, 18);
    for (let r = 0; r < this.n; r++) {
      for (let c = 0; c < this.n; c++) {
        g.fillStyle((r + c) % 2 ? 0x141a28 : 0x10151f);
        g.fillRect(this.bx + c * this.cell + 1, this.by + r * this.cell + 1, this.cell - 2, this.cell - 2);
      }
    }
    this.pathG = s.add.graphics();
    const eg = s.add.graphics();
    this.ep = {};
    this.endpoints.forEach(([a, b], ci) => {
      [a, b].forEach((cellIdx) => {
        this.ep[cellIdx] = ci;
        const { x, y } = this.center(cellIdx);
        eg.fillStyle(0x07040f); eg.fillCircle(x, y, this.cell * 0.36);
        eg.fillStyle(COLORS[ci]); eg.fillCircle(x, y, this.cell * 0.3);
        eg.fillStyle(0xffffff, 0.35); eg.fillCircle(x - this.cell * 0.08, y - this.cell * 0.08, this.cell * 0.09);
      });
    });

    this.paths = Array.from({ length: this.k }, () => []);
    this.complete = Array(this.k).fill(false);
    this.drawing = null;
    this.redraws = 0;
    this.statusT = T(s, 270, A.y + 520, '', 20, HEX(COL.cyan), { weight: 900, align: 'center' });
    this.updateStatus();

    s.input.on('pointerdown', (p) => this.onDown(p));
    s.input.on('pointermove', (p) => this.onMove(p));
    s.input.on('pointerup', () => { this.drawing = null; });
  }

  generate() {
    const n = this.n, N = n * n;
    const nb = (i) => {
      const r = Math.floor(i / n), c = i % n, out = [];
      if (r > 0) out.push(i - n);
      if (r < n - 1) out.push(i + n);
      if (c > 0) out.push(i - 1);
      if (c < n - 1) out.push(i + 1);
      return out;
    };
    for (let attempt = 0; attempt < 500; attempt++) {
      const grid = Array(N).fill(-1);
      const paths = [];
      let ok = true;
      for (let ci = 0; ci < this.k && ok; ci++) {
        let placed = false;
        for (let t = 0; t < 60 && !placed; t++) {
          const empty = [];
          for (let i = 0; i < N; i++) if (grid[i] < 0) empty.push(i);
          if (!empty.length) break;
          const start = empty[Math.floor(Math.random() * empty.length)];
          const path = [start];
          grid[start] = ci;
          const target = 3 + Math.floor(Math.random() * (n + 1));
          while (path.length < target) {
            const opts = nb(path[path.length - 1]).filter((j) => grid[j] < 0);
            if (!opts.length) break;
            const nx = opts[Math.floor(Math.random() * opts.length)];
            path.push(nx);
            grid[nx] = ci;
          }
          if (path.length >= 3) { placed = true; paths.push(path); }
          else path.forEach((j) => { grid[j] = -1; });
        }
        if (!placed) ok = false;
      }
      if (ok) { this.endpoints = paths.map((p) => [p[0], p[p.length - 1]]); return; }
    }
    // احتياطي نادر
    this.k = 2;
    this.endpoints = [[0, n - 1], [N - n, N - 1]];
  }

  center(i) {
    return { x: this.bx + (i % this.n) * this.cell + this.cell / 2, y: this.by + Math.floor(i / this.n) * this.cell + this.cell / 2 };
  }

  cellAt(p) {
    const c = Math.floor((p.worldX - this.bx) / this.cell), r = Math.floor((p.worldY - this.by) / this.cell);
    if (c < 0 || r < 0 || c >= this.n || r >= this.n) return -1;
    return r * this.n + c;
  }

  ownerOf(cell) {
    for (let ci = 0; ci < this.k; ci++) if (this.paths[ci].includes(cell)) return ci;
    return -1;
  }

  onDown(p) {
    if (this.over) return;
    const cell = this.cellAt(p);
    if (cell < 0) return;
    if (this.ep[cell] !== undefined) {
      const ci = this.ep[cell];
      if (this.complete[ci] || this.paths[ci].length > 1) this.redraws += 1;
      this.paths[ci] = [cell];
      this.complete[ci] = false;
      this.drawing = ci;
      Sfx.tick();
    } else {
      const ci = this.ownerOf(cell);
      if (ci < 0) return;
      const path = this.paths[ci];
      path.length = path.indexOf(cell) + 1;
      this.complete[ci] = false;
      this.drawing = ci;
    }
    this.redraw();
  }

  onMove(p) {
    if (this.drawing === null || this.over) return;
    const target = this.cellAt(p);
    if (target < 0) return;
    let guard = 0;
    while (guard++ < 12) {
      const path = this.paths[this.drawing];
      const last = path[path.length - 1];
      if (last === target) break;
      const lr = Math.floor(last / this.n), lc = last % this.n;
      const tr = Math.floor(target / this.n), tc = target % this.n;
      let next;
      if (Math.abs(tr - lr) >= Math.abs(tc - lc)) next = last + Math.sign(tr - lr) * this.n;
      else next = last + Math.sign(tc - lc);
      if (!this.step(next)) break;
      if (this.drawing === null) break;
    }
    this.redraw();
  }

  step(next) {
    const ci = this.drawing;
    const path = this.paths[ci];
    const idx = path.indexOf(next);
    if (idx >= 0) { path.length = idx + 1; this.complete[ci] = false; return true; }
    if (this.complete[ci]) return false;
    const epc = this.ep[next];
    if (epc !== undefined) {
      if (epc === ci && next !== path[0]) {
        path.push(next);
        this.complete[ci] = true;
        this.drawing = null;
        Sfx.connect();
        vibrate(20);
        this.updateStatus();
        this.checkWin();
        return true;
      }
      return false;
    }
    if (this.ownerOf(next) >= 0) { Sfx.spark(); return false; }
    path.push(next);
    if (path.length % 2 === 0) Sfx.tick();
    return true;
  }

  redraw() {
    const g = this.pathG;
    g.clear();
    this.paths.forEach((path, ci) => {
      if (path.length < 2) return;
      const w = this.cell * 0.3;
      g.lineStyle(w + 6, 0x000000, 0.4);
      for (let i = 1; i < path.length; i++) { const a = this.center(path[i - 1]), b = this.center(path[i]); g.lineBetween(a.x + 2, a.y + 3, b.x + 2, b.y + 3); }
      g.lineStyle(w, COLORS[ci], this.complete[ci] ? 1 : 0.8);
      g.fillStyle(COLORS[ci], 1);
      for (let i = 1; i < path.length; i++) {
        const a = this.center(path[i - 1]), b = this.center(path[i]);
        g.lineBetween(a.x, a.y, b.x, b.y);
        g.fillCircle(b.x, b.y, w / 2);
      }
      g.lineStyle(2, 0xffffff, 0.3);
      for (let i = 1; i < path.length; i++) { const a = this.center(path[i - 1]), b = this.center(path[i]); g.lineBetween(a.x - 2, a.y - 2, b.x - 2, b.y - 2); }
    });
    this.updateStatus();
  }

  updateStatus() {
    const done = this.complete ? this.complete.filter(Boolean).length : 0;
    this.statusT.setText(`الأسلاك الموصولة: ${done} من ${this.k}`);
  }

  checkWin() {
    if (this.complete.every(Boolean)) {
      Sfx.success();
      this.s.cameras.main.flash(200, 41, 240, 255);
      this.s.time.delayedCall(400, () => this.win(1 - Math.min(0.5, this.redraws * 0.05)));
    }
  }
}

export const _P = Phaser;
