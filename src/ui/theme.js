// ثوابت التصميم والأدوات المشتركة للنصوص والكاميرا
export const W = 540;
export const H = 960;
export const ZOOM = 2; // نرسم بضعف الدقة لتبقى الرسومات حادة على الجوال

export const FONT = 'Cairo, Tajawal, Tahoma, Arial, sans-serif';

export const COL = {
  bg: 0x07040f,
  panel: 0x140e28,
  panel2: 0x221842,
  cyan: 0x29f0ff,
  pink: 0xff3fa4,
  gold: 0xffc94a,
  green: 0x3dff8a,
  red: 0xff4d5e,
  purple: 0xb36bff,
  white: 0xffffff,
  dim: 0x8a94b8,
};

export const HEX = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');

export function setupCamera(scene, bg = COL.bg) {
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0);
  cam.setZoom(ZOOM);
  cam.setBackgroundColor(bg);
  return cam;
}

/**
 * نص عربي من اليمين لليسار.
 * ملاحظة: Phaser فيه خلل مع rtl + resolution، لذلك نرسم النص بضعف الحجم ونصغّره للنصف
 * فيبقى حاداً مع تكبير الكاميرا.
 */
const TS = ZOOM;
export function T(scene, x, y, str, size = 22, color = '#eaf6ff', o = {}) {
  const style = {
    fontFamily: FONT,
    fontSize: `${size * TS}px`,
    color,
    rtl: true,
    align: o.align || 'right',
    fontStyle: o.weight ? String(o.weight) : o.bold ? 'bold' : 'normal',
  };
  if (o.wrap) style.wordWrap = { width: o.wrap * TS, useAdvancedWrap: true };
  if (o.fixedWidth) style.fixedWidth = o.fixedWidth * TS;
  if (o.stroke) {
    style.stroke = o.stroke;
    style.strokeThickness = (o.strokeW || 4) * TS;
  }
  if (o.shadow) style.shadow = { offsetX: 0, offsetY: 0, color: o.shadow, blur: (o.blur || 10) * TS, fill: true, stroke: true };
  if (o.lineSpacing) style.lineSpacing = o.lineSpacing * TS;
  const t = scene.add.text(x, y, str, style);
  t.setOrigin(o.ox ?? 0.5, o.oy ?? 0.5);
  t.setScale(1 / TS);
  return t;
}

export function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

/** أرقام عربية-هندية للزينة */
export function arDigits(n) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
}

export function shade(c, f) {
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  if (f < 0) {
    r *= 1 + f; g *= 1 + f; b *= 1 + f;
  } else {
    r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f;
  }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

export function starPoints(cx, cy, r1, r2, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}
