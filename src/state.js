import upgradesData from './data/upgrades.json';
import thievesData from './data/thieves.json';

const SAVE_KEY = 'warshat-almadar-save-v1';
const SET_KEY = 'warshat-almadar-settings-v1';

function freshState() {
  return {
    version: 1,
    money: 120,
    rep: 2.5,
    day: 1,
    stage: 1,
    shelterDesign: null,
    floors: [],
    upgrades: {},
    flags: {},
    memory: {},
    seen: {},
    schedule: [],
    stats: { served: 0, earned: 0, perfect: 0, refused: 0, failed: 0, arrests: 0 },
    cases: {},
    board: [],
    trophies: [],
    news: [],
    introSeen: false,
    finished: false,
  };
}

function loadSettings() {
  const def = { sound: true, vibration: true, music: true, voice: 'auto' };
  try {
    const raw = localStorage.getItem(SET_KEY);
    if (raw) return { ...def, ...JSON.parse(raw) };
  } catch (e) { /* تخزين غير متاح */ }
  return def;
}

export const Game = {
  state: null,
  settings: loadSettings(),

  newGame() {
    this.state = freshState();
    this.save();
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      this.state = { ...freshState(), ...s, stats: { ...freshState().stats, ...(s.stats || {}) } };
      return true;
    } catch (e) {
      return false;
    }
  },
  save() {
    if (!this.state) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch (e) { /* ignore */ }
  },
  hasSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      return !s.finished;
    } catch (e) { return false; }
  },
  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    this.state = null;
  },
  saveSettings() {
    try { localStorage.setItem(SET_KEY, JSON.stringify(this.settings)); } catch (e) { /* ignore */ }
  },
};

export const UPGRADES = upgradesData.items;
export const DESIGNS = upgradesData.designs;
export const upgradeById = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

/** يجمع تأثيرات كل التطويرات المملوكة من upgrades.json */
export function getMods(st) {
  const m = { timeMult: 1, payMult: 1, repMult: 1, negotiate: 0, lockHint: 0, swapHint: 0, passive: 0 };
  for (const [id, lvl] of Object.entries(st.upgrades)) {
    const u = upgradeById[id];
    if (!u || !lvl) continue;
    for (const [k, v] of Object.entries(u.effect || {})) m[k] = (m[k] || 0) + v * lvl;
  }
  for (const id of st.trophies || []) {
    const t = thievesData.trophies[id];
    if (!t) continue;
    for (const [k, v] of Object.entries(t.effect || {})) m[k] = (m[k] || 0) + v;
  }
  m.dayTime = Math.round(240 * (1 + (m.timeMult - 1) * 0.5));
  return m;
}

export function difficulty(st) {
  return Math.min(1, Math.max(0, (st.day - 1) / 9));
}

export function clampRep(v) {
  return Math.max(0, Math.min(5, v));
}
