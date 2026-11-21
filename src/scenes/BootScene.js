import Phaser from 'phaser';
import { drawGlove } from '../gfx/Hands.js';
import { paint, rgba } from '../gfx/Painter.js';

// توليد كل الخامات بالكود (لا توجد صور خارجية)
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8);
    g.generateTexture('px', 16, 16); g.clear();

    for (let r = 48; r > 0; r -= 4) { g.fillStyle(0xffffff, 0.06); g.fillCircle(48, 48, r); }
    g.generateTexture('soft', 96, 96); g.clear();

    for (let r = 48; r > 0; r -= 6) { g.fillStyle(0xffffff, 0.12); g.fillCircle(48, 48, r); }
    g.fillStyle(0xffffff, 0.3); g.fillCircle(48, 48, 30);
    g.generateTexture('brush', 96, 96); g.clear();
    g.destroy();

    // توهّج دائري ناعم حقيقي (تدرّج شعاعي)
    paint(this, 'glowTex', 128, 128, 64, 64, (pg, ctx) => {
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(-64, -64, 128, 128);
    }, { light: false });

    // شعاع كشّاف (للمدينة) يتلاشى للأعلى
    paint(this, 'beam', 120, 520, 60, 520, (pg, ctx) => {
      const gr = ctx.createLinearGradient(0, 0, 0, -520);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(60, -520); ctx.lineTo(-60, -520); ctx.closePath(); ctx.fill();
    }, { light: false });

    // مخروط ضوء المصباح فوق الطاولة
    paint(this, 'lampCone', 540, 420, 270, 0, (pg, ctx) => {
      const gr = ctx.createLinearGradient(0, 0, 0, 420);
      gr.addColorStop(0, 'rgba(255,241,190,0.30)');
      gr.addColorStop(1, 'rgba(255,241,190,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(60, 0); ctx.lineTo(270, 420); ctx.lineTo(-270, 420); ctx.closePath(); ctx.fill();
    }, { light: false });

    // مركبة طائرة بتدرّج وأضواء
    paint(this, 'car', 44, 20, 22, 10, (pg, ctx) => {
      pg.glow(18, 1, 10, 0xffe680, 0.5);
      pg.fillStyle(0xdde3f0); pg.fillRoundedRect(-18, -5, 34, 11, 5);
      pg.fillStyle(0x29f0ff, 0.9); pg.fillRoundedRect(-4, -8, 12, 6, 3);
      pg.fillStyle(0x3a4060); pg.fillRect(-16, 3, 30, 2);
      pg.fillStyle(0xfff3a0); pg.fillCircle(16, 1, 2.2);
      pg.fillStyle(0xff4d5e); pg.fillCircle(-18, 1, 2);
      ctx.fillStyle = rgba(0xff4d5e, 0.35); ctx.fillRect(-22, -1, 4, 4);
    }, { outline: 0.6, res: 1.5 });

    // القفاز: كبير لليدين وصغير لمؤشر الألعاب المصغّرة
    paint(this, 'gloveBig', 150, 200, 75, 110, (pg) => drawGlove(pg), { outline: 2, rim: 0x29f0ff, res: 1.2 });
    paint(this, 'glove', 80, 110, 40, 60, (pg) => { pg.scaleCanvas(0.42, 0.42); drawGlove(pg); }, { outline: 1.2, res: 1.2 });

    this.scene.start('Menu');
  }
}
