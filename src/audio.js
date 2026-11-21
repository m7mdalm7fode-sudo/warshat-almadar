// كل الأصوات مولّدة بـ Web Audio API، بدون ملفات صوتية
import { Game } from './state.js';

class SfxEngine {
  constructor() {
    this.ctx = null;
    this.amb = null;
    this.last = {};
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  ok() {
    return Game.settings.sound && this.ensure();
  }

  throttle(key, ms) {
    const now = performance.now();
    if (this.last[key] && now - this.last[key] < ms) return false;
    this.last[key] = now;
    return true;
  }

  tone(f, dur, o = {}) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    const v = o.vol ?? 0.25;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  noise(dur, o = {}) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    const v = o.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  // ---- مؤثرات اللعبة ----
  click() { this.tone(880, 0.06, { type: 'square', vol: 0.08, slide: 620 }); }
  blip() { if (this.throttle('blip', 45)) this.tone(520 + Math.random() * 160, 0.035, { type: 'triangle', vol: 0.05 }); }
  coin() {
    this.tone(1318, 0.12, { type: 'square', vol: 0.07 });
    this.tone(1760, 0.25, { type: 'square', vol: 0.07, delay: 0.08 });
    this.tone(2637, 0.2, { type: 'sine', vol: 0.05, delay: 0.16 });
  }
  buy() { this.coin(); this.tone(392, 0.3, { type: 'triangle', vol: 0.12, slide: 784 }); }
  error() {
    this.tone(160, 0.22, { type: 'sawtooth', vol: 0.12 });
    this.tone(120, 0.26, { type: 'square', vol: 0.06, delay: 0.05 });
  }
  success() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', vol: 0.12, delay: i * 0.08 }));
  }
  fail() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, { type: 'sawtooth', vol: 0.07, delay: i * 0.11 }));
  }
  ratchet() { if (this.throttle('ratchet', 55)) this.noise(0.04, { freq: 3200, q: 6, vol: 0.25 }); }
  pop() { this.tone(300, 0.12, { type: 'sine', vol: 0.2, slide: 900 }); this.noise(0.05, { freq: 2000, vol: 0.12 }); }
  knock() { this.tone(110, 0.09, { type: 'sine', vol: 0.4, slide: 60 }); this.noise(0.05, { freq: 500, vol: 0.2, filter: 'lowpass' }); }
  scrub() { if (this.throttle('scrub', 90)) this.noise(0.09, { freq: 1400 + Math.random() * 1600, q: 0.8, vol: 0.09 }); }
  drop() { this.tone(90, 0.18, { type: 'sine', vol: 0.4, slide: 45 }); this.noise(0.1, { freq: 300, filter: 'lowpass', vol: 0.2 }); }
  door() { this.noise(0.35, { freq: 600, slide: 2400, q: 2, vol: 0.12 }); this.tone(660, 0.1, { type: 'sine', vol: 0.06, delay: 0.25 }); this.tone(880, 0.15, { type: 'sine', vol: 0.06, delay: 0.35 }); }
  connect() { this.tone(660, 0.08, { type: 'square', vol: 0.07 }); this.tone(990, 0.14, { type: 'square', vol: 0.07, delay: 0.06 }); }
  unlock() { this.noise(0.06, { freq: 2500, q: 4, vol: 0.2 }); this.tone(1200, 0.1, { type: 'square', vol: 0.06, delay: 0.08 }); this.tone(1600, 0.18, { type: 'square', vol: 0.06, delay: 0.16 }); }
  beep(f = 880, d = 0.08) { this.tone(f, d, { type: 'square', vol: 0.06 }); }
  tick() { this.tone(1500, 0.03, { type: 'square', vol: 0.04 }); }
  whoosh() { this.noise(0.4, { freq: 400, slide: 3000, q: 1.5, vol: 0.12 }); }
  spark() { this.noise(0.08, { freq: 5000, q: 3, vol: 0.12 }); }
  growl() { this.tone(90, 0.3, { type: 'sawtooth', vol: 0.08, slide: 70 }); }
  rumble(d = 3) {
    this.noise(d, { freq: 120, filter: 'lowpass', vol: 0.5, attack: 0.6 });
    this.tone(45, d, { type: 'sawtooth', vol: 0.12, attack: 0.5 });
  }
  launch() {
    this.noise(5, { freq: 200, slide: 1800, filter: 'lowpass', vol: 0.55, attack: 0.3 });
    this.tone(60, 5, { type: 'sawtooth', vol: 0.15, slide: 220, attack: 0.3 });
  }

  startAmbient() {
    return;
    // eslint-disable-next-line no-unreachable
    if (!this.ok() || this.amb) return;
    const c = this.ctx;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.03, c.currentTime + 2);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 380;
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sawtooth';
    o1.frequency.value = 55; o2.frequency.value = 82.6;
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.08; lg.gain.value = 160;
    lfo.connect(lg); lg.connect(f.frequency);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.master);
    o1.start(); o2.start(); lfo.start();
    this.amb = { g, nodes: [o1, o2, lfo] };
  }

  stopAmbient() {
    if (!this.amb || !this.ctx) return;
    const { g, nodes } = this.amb;
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    nodes.forEach((n) => n.stop(t + 0.6));
    this.amb = null;
  }
}

export const Sfx = new SfxEngine();

export function vibrate(p = 30) {
  if (!Game.settings.vibration) return;
  try {
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;
    if (navigator.vibrate) navigator.vibrate(p);
  } catch (e) { /* ignore */ }
}
