import Phaser from 'phaser';
import { W, H, ZOOM } from './ui/theme.js';
import { Sfx } from './audio.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import WorkshopScene from './scenes/WorkshopScene.js';
import MinigameScene from './scenes/MinigameScene.js';
import SummaryScene from './scenes/SummaryScene.js';
import ShopScene from './scenes/ShopScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import EndingScene from './scenes/EndingScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#07040f',
  width: W * ZOOM,
  height: H * ZOOM,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  disableContextMenu: true,
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, MenuScene, WorkshopScene, MinigameScene, SummaryScene, ShopScene, SettingsScene, EndingScene],
};

async function start() {
  // ننتظر خط Cairo قبل إنشاء النصوص حتى لا تظهر بخط بديل
  try {
    await Promise.race([
      Promise.all([document.fonts.load('400 20px Cairo'), document.fonts.load('700 20px Cairo'), document.fonts.load('900 20px Cairo')]),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
  } catch (e) { /* نكمل بخط بديل */ }
  const l = document.getElementById('loading');
  if (l) l.remove();
  const game = new Phaser.Game(config);
  window.__game = game;
  const unlock = () => { Sfx.ensure(); };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

start();
