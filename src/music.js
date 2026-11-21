// موسيقى مولّدة بالكود: مقام حجاز + إيقاع مقسوم بطابع خيال علمي
import { Sfx } from './audio.js';
import { Game } from './state.js';

const ROOT = 146.83; // D3
const HIJAZ = [0, 1, 4, 5, 7, 8, 10];
const semi = (s) => ROOT * Math.pow(2, s / 12);
const deg = (d) => {
  const o = Math.floor(d / 7);
  return HIJAZ[((d % 7) + 7) % 7] + 12 * o;
};

// أكوردات (نصف نغمات من الجذر)
const CH = {
  I: [0, 4, 7], // D F# A
  bII: [1, 5, 8], // Eb G Bb
  bVII: [-2, 1, 5], // C Eb G
  iv: [5, 8, 12], // G Bb D
};

// مقسوم: دُم تَك _ تَك دُم _ تَك _ (بالثُمن) => بالسادس عشر
const MAQSOUM = { 0: 'D', 2: 'T', 6: 'T', 8: 'D', 12: 'T' };

const TRACKS = {
  menu: {
    bpm: 84, bars: ['I', 'bII', 'I', 'bVII'], pad: 0.5, arp: true, drums: 0.45, hat: false, bass: true,
    lead: [[0, 7, 2], [4, 8, 2], [8, 9, 2], [10, 8, 1], [11, 7, 1], [12, 8, 4], [32, 11, 2], [36, 10, 2], [40, 9, 2], [42, 8, 2], [44, 7, 4]],
  },
  work: {
    bpm: 98, bars: ['I', 'I', 'bVII', 'iv'], pad: 0.32, arp: 'half', drums: 0.6, hat: true, bass: true,
    lead: [[0, 7, 1], [2, 8, 1], [4, 9, 2], [6, 8, 1], [7, 7, 1], [8, 8, 4], [16, 9, 1], [18, 10, 1], [20, 11, 2], [22, 10, 2], [24, 9, 4], [40, 7, 2], [42, 8, 2], [44, 7, 1], [45, 6, 1], [46, 7, 6]],
  },
  shop: {
    bpm: 90, bars: ['I', 'iv', 'bVII', 'I'], pad: 0.4, arp: true, drums: 0.35, hat: true, bass: true,
    lead: [[0, 9, 2], [2, 10, 2], [4, 11, 4], [16, 10, 2], [18, 9, 2], [20, 8, 4], [32, 9, 2], [34, 8, 2], [36, 7, 6]],
  },
  tension: {
    bpm: 136, bars: ['I', 'bII', 'I', 'bII'], pad: 0.25, arp: false, drums: 0.8, hat: true, bass: 'pulse',
    lead: [[0, 14, 1], [1, 15, 1], [8, 14, 1], [9, 15, 1], [32, 15, 1], [33, 14, 1], [40, 15, 2]],
  },
  ending: {
    bpm: 76, bars: ['I', 'bVII', 'iv', 'I'], pad: 0.6, arp: true, drums: 0.5, hat: false, bass: true,
    lead: [[0, 7, 2], [2, 8, 2], [4, 9, 4], [8, 11, 4], [16, 10, 2], [18, 9, 2], [20, 8, 4], [24, 7, 8], [32, 11, 2], [34, 12, 2], [36, 13, 4], [40, 14, 8], [48, 11, 4], [52, 9, 4], [56, 7, 8]],
  },
};

class MusicEngine {
  constructor() {
    this.track = null;
    this.want = null;
    this.timer = null;
  }

  get enabled() { return Game.settings.music !== false; }

  setup() {
    const c = Sfx.ensure();
    if (!c) return null;
    if (!this.bus) {
      this.bus = c.createGain();
      this.bus.gain.value = 0.0001;
      this.bus.connect(Sfx.master);
      // صدى بسيط يعطي مساحة
      this.delay = c.createDelay(1);
      this.delay.delayTime.value = 0.32;
      this.fb = c.createGain(); this.fb.gain.value = 0.28;
      this.wet = c.createGain(); this.wet.gain.value = 0.25;
      this.delay.connect(this.fb); this.fb.connect(this.delay);
      this.delay.connect(this.wet); this.wet.connect(this.bus);
    }
    return c;
  }

  play(name) {
    this.want = name;
    if (!this.enabled) return;
    const c = this.setup();
    if (!c) return;
    if (this.track === name && this.timer) return;
    this.track = name;
    this.T = TRACKS[name] || TRACKS.work;
    this.stepDur = 60 / this.T.bpm / 4;
    this.step = 0;
    this.next = c.currentTime + 0.15;
    const now = c.currentTime;
    this.bus.gain.cancelScheduledValues(now);
    this.bus.gain.setValueAtTime(Math.max(0.0001, this.bus.gain.value), now);
    this.bus.gain.exponentialRampToValueAtTime(0.32, now + 1.2);
    if (!this.timer) this.timer = setInterval(() => this.tick(), 30);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.track = null;
    if (this.bus && Sfx.ctx) {
      const now = Sfx.ctx.currentTime;
      this.bus.gain.cancelScheduledValues(now);
      this.bus.gain.setValueAtTime(Math.max(0.0001, this.bus.gain.value), now);
      this.bus.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    }
  }

  refresh() {
    if (this.enabled) { const w = this.want || 'menu'; this.track = null; this.play(w); } else this.stop();
  }

  tick() {
    const c = Sfx.ctx;
    if (!c || c.state !== 'running') return;
    if (this.next < c.currentTime - 0.5) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.18) {
      this.playStep(this.step, this.next);
      this.next += this.stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  playStep(s, t) {
    const T = this.T;
    const bar = Math.floor(s / 16), b = s % 16;
    const chord = CH[T.bars[bar]] || CH.I;
    const bd = this.stepDur * 16;

    if (b === 0 && T.pad) this.pad(t, chord, bd * 0.98, T.pad);
    // باص
    if (T.bass === 'pulse') {
      if (b % 2 === 0) this.bass(t, semi(chord[0] - 12 + (b % 8 === 6 ? 1 : 0)), this.stepDur * 1.6, 0.16);
    } else if (T.bass) {
      if (b === 0 || b === 8) this.bass(t, semi(chord[0] - 12), this.stepDur * 6, 0.2);
      if (b === 14) this.bass(t, semi(chord[1] - 12), this.stepDur * 2, 0.12);
    }
    // طبول (مقسوم)
    if (T.drums) {
      const hit = MAQSOUM[b];
      if (hit === 'D') this.doum(t, T.drums);
      if (hit === 'T') this.tek(t, T.drums * 0.8);
      if (T.bpm > 120 && (b === 4 || b === 10)) this.tek(t, T.drums * 0.5);
    }
    if (T.hat && b % 2 === 1) this.hat(t, b % 4 === 3 ? 0.05 : 0.03);
    // قانون (أربيجيو)
    const arpOn = T.arp === true || (T.arp === 'half' && bar >= 2);
    if (arpOn && b % 2 === 0) {
      const seq = [0, 1, 2, 1, 2, 0, 1, 2];
      const n = chord[seq[(b / 2) % seq.length]] + 12 + (b >= 8 ? 12 : 0);
      this.pluck(t, semi(n), 0.07);
    }
    // اللحن
    for (const [st, d, len] of T.lead) {
      if (st === s) this.lead(t, semi(deg(d)), this.stepDur * len * 0.95, 0.07);
    }
  }

  // ---- آلات ----
  env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  }

  pad(t, chord, dur, vol) {
    const c = Sfx.ctx;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045 * vol * 2, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    chord.forEach((n) => {
      [-6, 6].forEach((det) => {
        const o = c.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = semi(n); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + dur + 0.05);
      });
    });
    f.connect(g); g.connect(this.bus);
  }

  bass(t, freq, dur, vol) {
    const c = Sfx.ctx;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
    const f = c.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(160, t + dur);
    const g = c.createGain(); this.env(g, t, 0.01, vol, dur);
    o.connect(f); f.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  pluck(t, freq, vol) {
    const c = Sfx.ctx;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = freq * 2;
    const g2 = c.createGain(); g2.gain.value = 0.15;
    const g = c.createGain(); this.env(g, t, 0.004, vol, 0.5);
    o.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(this.bus); g.connect(this.delay);
    o.start(t); o2.start(t); o.stop(t + 0.55); o2.stop(t + 0.55);
  }

  lead(t, freq, dur, vol) {
    const c = Sfx.ctx;
    const o = c.createOscillator(); o.type = 'square'; o.frequency.value = freq;
    const lfo = c.createOscillator(); lfo.frequency.value = 5.5;
    const lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(0.4, dur));
    lfo.connect(lg); lg.connect(o.frequency);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.setValueAtTime(vol, t + Math.max(0.04, dur - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    o.connect(f); f.connect(g); g.connect(this.bus); g.connect(this.delay);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.15); lfo.stop(t + dur + 0.15);
  }

  doum(t, vol) {
    const c = Sfx.ctx;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    const g = c.createGain(); this.env(g, t, 0.003, 0.5 * vol, 0.32);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.35);
  }

  tek(t, vol) {
    const c = Sfx.ctx;
    const src = c.createBufferSource(); src.buffer = Sfx.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 2;
    const g = c.createGain(); this.env(g, t, 0.002, 0.28 * vol, 0.07);
    src.connect(f); f.connect(g); g.connect(this.bus);
    src.start(t, Math.random() * 0.5); src.stop(t + 0.09);
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 420;
    const g2 = c.createGain(); this.env(g2, t, 0.002, 0.08 * vol, 0.05);
    o.connect(g2); g2.connect(this.bus); o.start(t); o.stop(t + 0.07);
  }

  hat(t, vol) {
    const c = Sfx.ctx;
    const src = c.createBufferSource(); src.buffer = Sfx.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = c.createGain(); this.env(g, t, 0.001, vol, 0.04);
    src.connect(f); f.connect(g); g.connect(this.bus);
    src.start(t, Math.random() * 0.5); src.stop(t + 0.05);
  }
}

export const Music = new MusicEngine();
