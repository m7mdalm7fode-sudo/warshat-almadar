// يدا اللاعب بالقفازات (منظور الشخص الأول)
import { shade } from '../ui/theme.js';
import { painted } from './Painter.js';

export function drawGlove(g, col = 0xd9822b) {
  const cuff = 0x2b2f36;
  g.fillStyle(cuff); g.fillRoundedRect(-42, 38, 84, 70, 10);
  g.fillStyle(0x29f0ff, 0.85); g.fillRect(-42, 52, 84, 6);
  g.fillStyle(shade(col, -0.15));
  // الإبهام
  g.fillPoints([{ x: 30, y: 20 }, { x: 52, y: -20 }, { x: 64, y: -14 }, { x: 46, y: 34 }], true);
  g.fillCircle(58, -18, 8);
  // الأصابع
  g.fillStyle(col);
  [[-34, -62, 46], [-15, -72, 56], [4, -70, 54], [22, -58, 44]].forEach(([x, y, h]) => {
    g.fillRoundedRect(x, y, 17, h, 8);
    g.fillStyle(shade(col, -0.25));
    g.fillRect(x + 2, y + 18, 13, 3);
    g.fillStyle(col);
  });
  g.fillRoundedRect(-40, -28, 80, 72, 22);
  g.fillStyle(shade(col, -0.3));
  g.fillRoundedRect(-30, -20, 60, 18, 8);
  g.lineStyle(2, shade(col, 0.35), 0.8);
  for (let x = -24; x <= 24; x += 8) g.lineBetween(x, 6, x + 3, 12);
  g.fillStyle(0x1a1a1a);
  g.fillRoundedRect(-36, 22, 72, 16, 6);
}

export class PlayerHands {
  constructor(scene) {
    this.scene = scene;
    this.left = scene.add.container(80, 940).setDepth(60);
    this.right = scene.add.container(460, 940).setDepth(60);
    const tex = { key: 'gloveBig', w: 150, h: 200, ox: 75, oy: 110, res: 1.2 };
    const gl = painted(scene, 0, 0, tex);
    const gr = painted(scene, 0, 0, tex);
    this.left.add(gl).setRotation(0.38);
    this.right.add(gr).setScale(-1, 1).setRotation(-0.38);
    this.home = { lx: 80, rx: 460, y: 940 };
    scene.tweens.add({ targets: this.left, y: 944, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: this.right, y: 943, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
  }

  reach(cb) {
    const s = this.scene;
    s.tweens.add({ targets: this.left, x: 190, y: 860, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
    s.tweens.add({ targets: this.right, x: 350, y: 860, duration: 220, yoyo: true, ease: 'Quad.easeOut', onComplete: () => cb && cb() });
  }

  flinch() {
    this.scene.tweens.add({ targets: [this.left, this.right], scaleY: { from: 1, to: 0.94 }, duration: 90, yoyo: true });
  }

  wave() {
    this.scene.tweens.add({ targets: this.right, rotation: -0.1, duration: 160, yoyo: true, repeat: 2 });
  }
}
