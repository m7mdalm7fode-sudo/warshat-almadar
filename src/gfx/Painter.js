// رسّام Canvas 2D: نفس واجهة Phaser Graphics تقريباً، لكن مع تدرّجات تلقائية وإضاءة وحدود
// نرسم مرة واحدة إلى خامة (texture) ثم نعرضها كصورة: أجمل وأخف على المتصفح.
import { shade, ZOOM } from '../ui/theme.js';

const S = ZOOM;
export const rgba = (c, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

export class CanvasG {
  constructor(ctx, o = {}) {
    this.ctx = ctx;
    this.fillC = 0xffffff; this.fillA = 1;
    this.lineW = 1; this.lineC = 0; this.lineA = 1;
    this.grad = o.grad ?? 0.16;
    this.vgrad = null;
    this.ops = null;
  }

  // ---- الحالة ----
  fillStyle(c, a = 1) { this.fillC = c; this.fillA = a; this.vgrad = null; return this; }
  lineStyle(w, c, a = 1) { this.lineW = w; this.lineC = c; this.lineA = a; return this; }
  fillGradientStyle(tl, tr, bl, br, aTL = 1, aTR = 1, aBL = 1, aBR = 1) { this.vgrad = [tl, bl, aTL, aBL]; this.fillA = 1; return this; }
  save() { this.ctx.save(); return this; }
  restore() { this.ctx.restore(); return this; }
  translateCanvas(x, y) { this.ctx.translate(x, y); return this; }
  scaleCanvas(x, y) { this.ctx.scale(x, y); return this; }
  rotateCanvas(r) { this.ctx.rotate(r); return this; }
  clear() { return this; }

  _fill(build, y0, y1) {
    const ctx = this.ctx;
    ctx.save();
    if (this.vgrad) {
      const [t, b, at, ab] = this.vgrad;
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, rgba(t, at)); g.addColorStop(1, rgba(b, ab));
      ctx.fillStyle = g;
    } else {
      ctx.globalAlpha = this.fillA;
      const h = y1 - y0;
      if (this.grad && h > 7 && this.fillA > 0.3) {
        const g = ctx.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, rgba(shade(this.fillC, this.grad)));
        g.addColorStop(0.55, rgba(this.fillC));
        g.addColorStop(1, rgba(shade(this.fillC, -this.grad * 1.4)));
        ctx.fillStyle = g;
      } else ctx.fillStyle = rgba(this.fillC);
    }
    ctx.beginPath();
    build(ctx);
    ctx.fill();
    ctx.restore();
    return this;
  }

  _stroke(build) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this.lineA;
    ctx.strokeStyle = rgba(this.lineC);
    ctx.lineWidth = this.lineW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    build(ctx);
    ctx.stroke();
    ctx.restore();
    return this;
  }

  // ---- أشكال ----
  fillRect(x, y, w, h) { return this._fill((c) => c.rect(x, y, w, h), y, y + h); }
  fillCircle(x, y, r) { return this._fill((c) => c.arc(x, y, r, 0, Math.PI * 2), y - r, y + r); }
  fillEllipse(x, y, w, h) { return this._fill((c) => c.ellipse(x, y, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2), y - h / 2, y + h / 2); }
  fillRoundedRect(x, y, w, h, r = 8) { return this._fill((c) => rr(c, x, y, w, h, r), y, y + h); }
  fillTriangle(x1, y1, x2, y2, x3, y3) {
    return this._fill((c) => { c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); }, Math.min(y1, y2, y3), Math.max(y1, y2, y3));
  }
  fillPoints(pts) {
    const ys = pts.map((p) => p.y);
    return this._fill((c) => { c.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y); c.closePath(); }, Math.min(...ys), Math.max(...ys));
  }
  strokeRect(x, y, w, h) { return this._stroke((c) => c.rect(x, y, w, h)); }
  strokeCircle(x, y, r) { return this._stroke((c) => c.arc(x, y, r, 0, Math.PI * 2)); }
  strokeEllipse(x, y, w, h) { return this._stroke((c) => c.ellipse(x, y, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2)); }
  strokeRoundedRect(x, y, w, h, r = 8) { return this._stroke((c) => rr(c, x, y, w, h, r)); }
  lineBetween(x1, y1, x2, y2) { return this._stroke((c) => { c.moveTo(x1, y1); c.lineTo(x2, y2); }); }

  // ---- مسارات ----
  beginPath() { this.ops = []; return this; }
  arc(x, y, r, s, e, acw = false) { (this.ops || (this.ops = [])).push((c) => c.arc(x, y, r, s, e, acw)); this._arcY = [y - r, y + r]; return this; }
  moveTo(x, y) { (this.ops || (this.ops = [])).push((c) => c.moveTo(x, y)); return this; }
  lineTo(x, y) { (this.ops || (this.ops = [])).push((c) => c.lineTo(x, y)); return this; }
  closePath() { (this.ops || (this.ops = [])).push((c) => c.closePath()); return this; }
  strokePath() { const ops = this.ops || []; this.ops = null; return this._stroke((c) => ops.forEach((f) => f(c))); }
  fillPath() { const ops = this.ops || []; this.ops = null; const [a, b] = this._arcY || [0, 1]; return this._fill((c) => ops.forEach((f) => f(c)), a, b); }

  /** توهّج نيون ناعم */
  glow(x, y, r, color, a = 0.5) {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
    return this;
  }
}

function rr(c, x, y, w, h, r) {
  let tl, tr, br, bl;
  if (typeof r === 'number') { tl = tr = br = bl = r; } else { tl = r.tl || 0; tr = r.tr || 0; br = r.br || 0; bl = r.bl || 0; }
  const m = Math.min(Math.abs(w), Math.abs(h)) / 2;
  tl = Math.min(tl, m); tr = Math.min(tr, m); br = Math.min(br, m); bl = Math.min(bl, m);
  c.moveTo(x + tl, y);
  c.lineTo(x + w - tr, y); c.quadraticCurveTo(x + w, y, x + w, y + tr);
  c.lineTo(x + w, y + h - br); c.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  c.lineTo(x + bl, y + h); c.quadraticCurveTo(x, y + h, x, y + h - bl);
  c.lineTo(x, y + tl); c.quadraticCurveTo(x, y, x + tl, y);
  c.closePath();
}

let uid = 0;
export const uniqueKey = (p) => `${p}_${++uid}`;

/**
 * يرسم إلى خامة Canvas.
 * w,h = حجم المنطقة بوحدات العالم، ox,oy = موضع الأصل داخلها.
 * o: { res, outline, outlineColor, light, rim, rim2, grad, keep }
 */
export function paint(scene, key, w, h, ox, oy, draw, o = {}) {
  const tm = scene.textures;
  if (tm.exists(key)) {
    if (o.keep) return { key, w, h, ox, oy, res: o.res || 1 };
    tm.remove(key);
  }
  const res = o.res || 1;
  const k = S * res;
  const cw = Math.max(2, Math.ceil(w * k)), chh = Math.max(2, Math.ceil(h * k));
  const art = document.createElement('canvas');
  art.width = cw; art.height = chh;
  const a = art.getContext('2d');
  a.setTransform(k, 0, 0, k, ox * k, oy * k);
  draw(new CanvasG(a, o), a);
  a.setTransform(1, 0, 0, 1, 0, 0);

  // تمرير الإضاءة: ضوء علوي وظل سفلي وإضاءة نيون جانبية
  if (o.light !== false) {
    a.globalCompositeOperation = 'source-atop';
    const g = a.createLinearGradient(0, 0, 0, chh);
    g.addColorStop(0, 'rgba(255,255,255,0.10)');
    g.addColorStop(0.5, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(12,0,30,0.32)');
    a.fillStyle = g; a.fillRect(0, 0, cw, chh);
    if (o.rim !== undefined && o.rim !== null) {
      const r = a.createLinearGradient(cw * 0.6, 0, cw, 0);
      r.addColorStop(0, rgba(o.rim, 0)); r.addColorStop(1, rgba(o.rim, 0.3));
      a.fillStyle = r; a.fillRect(0, 0, cw, chh);
    }
    if (o.rim2 !== undefined && o.rim2 !== null) {
      const r = a.createLinearGradient(0, 0, cw * 0.4, 0);
      r.addColorStop(0, rgba(o.rim2, 0.26)); r.addColorStop(1, rgba(o.rim2, 0));
      a.fillStyle = r; a.fillRect(0, 0, cw, chh);
    }
    a.globalCompositeOperation = 'source-over';
  }

  const tex = tm.createCanvas(key, cw, chh);
  const ctx = tex.getContext();
  if (o.outline) {
    const sil = document.createElement('canvas');
    sil.width = cw; sil.height = chh;
    const s = sil.getContext('2d');
    s.drawImage(art, 0, 0);
    s.globalCompositeOperation = 'source-in';
    s.fillStyle = rgba(o.outlineColor ?? 0x07040f, 1);
    s.fillRect(0, 0, cw, chh);
    const d = o.outline * k;
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      ctx.drawImage(sil, Math.cos(ang) * d, Math.sin(ang) * d);
    }
  }
  ctx.drawImage(art, 0, 0);
  tex.refresh();
  return { key, w, h, ox, oy, res };
}

/** صورة من خامة مرسومة، بحيث (x,y) = الأصل */
export function painted(scene, x, y, p) {
  return scene.add.image(x, y, p.key).setOrigin(p.ox / p.w, p.oy / p.h).setScale(1 / (S * p.res));
}

export function isWebGL(scene) {
  return scene.sys.renderer && scene.sys.renderer.type === 2;
}

/** توهّج FX لنصوص وصور النيون (WebGL فقط) */
export function addGlow(scene, obj, color, strength = 3) {
  if (!isWebGL(scene) || !obj.preFX) return obj;
  try { obj.preFX.setPadding(16); obj.preFX.addGlow(color, strength, 0, false, 0.1, 12); } catch (e) { /* ignore */ }
  return obj;
}

export function addVignette(scene, strength = 0.35, radius = 0.85) {
  if (!isWebGL(scene)) return;
  try { scene.cameras.main.postFX.addVignette(0.5, 0.5, radius, strength); } catch (e) { /* ignore */ }
}
