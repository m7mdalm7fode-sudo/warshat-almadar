// أصوات الشخصيات: صوت عربي حقيقي (ذكوري فقط) إن توفّر في الجهاز، وإلا "همهمة" مولّدة لكل شخصية
import { Sfx } from './audio.js';
import { Game } from './state.js';
import VOICEMAP from './data/voicemap.json';

// فهرس احتياطي: نفس الجملة بأي صوت مسجّل (للردود العامة)
const BY_TEXT = {};
Object.entries(VOICEMAP).forEach(([k, f]) => {
  const t = k.slice(k.indexOf('|') + 1);
  if (!BY_TEXT[t]) BY_TEXT[t] = f;
});

// أسماء أصوات ذكورية معروفة في أنظمة التشغيل (iOS/macOS/Windows/Android)
const MALE = /(maged|majed|naayf|naif|nayef|hamed|hamid|shakir|fahed|fahad|tarik|tarek|omar|hamdan|ahmed|ahmad|mohammed|mohamed|zayd|khalid|male)/i;
const FEMALE = /(female|hoda|salma|zariyah|laila|layla|mariam|maryam|amina|fatima|sana|hala|noura|amira|dalia|rana|mona|yasmin|lana|reem)/i;

class VoiceEngine {
  constructor() {
    this.voice = null;
    this.nodes = [];
    this.ready = false;
    try {
      if ('speechSynthesis' in window) {
        const load = () => this.pickVoice();
        load();
        window.speechSynthesis.onvoiceschanged = load;
      }
    } catch (e) { /* لا يوجد دعم */ }
  }

  pickVoice() {
    try {
      const vs = window.speechSynthesis.getVoices() || [];
      const ar = vs.filter((v) => /^ar/i.test(v.lang) && !FEMALE.test(v.name));
      this.voice = ar.find((v) => MALE.test(v.name)) || null;
      this.ready = true;
    } catch (e) { this.voice = null; }
  }

  get mode() { return Game.settings.voice || 'auto'; }

  /** يشغّل تسجيل ElevenLabs إن وجد، ويرجع مدته التقريبية */
  playRecorded(text, profile) {
    if (!Game.settings.sound) return null;
    const file = VOICEMAP[`${profile.voiceKey || 'F'}|${text}`] || BY_TEXT[text];
    if (!file) return null;
    try {
      const a = new Audio(`voices/${file}`);
      a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false;
      a.playbackRate = profile.species === 'robot' ? 1.12 : profile.species === 'alien' ? 0.9 : 1;
      a.volume = 0.95;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
      this.current = a;
      return Math.max(900, text.length * 75);
    } catch (e) { return null; }
  }
  get hasReal() { return !!this.voice; }

  /** يرجع المدة التقريبية للكلام بالملّي ثانية */
  speak(text, profile = {}) {
    this.stop();
    const mode = this.mode;
    if (mode === 'off' || !text) return 0;
    if (mode !== 'babble') {
      const d = this.playRecorded(text, profile);
      if (d) return d;
    }
    const clean = String(text)
      .replace(/\([^)]*\)/g, ' ')          // لا تقرأ الوصف اللي بين القوسين
      .replace(/[◈★♪✓✗«»"]/g, ' ')
      .replace(/\.{2,}|…/g, '، ')           // النقاط = وقفة قصيرة
      .replace(/[!؟?]+/g, (m) => (m.includes('؟') || m.includes('?') ? '؟' : '!'))
      .replace(/\s+/g, ' ')
      .replace(/^[،\s]+|[،\s]+$/g, '')
      .trim();
    if (!clean) return 0;
    if (mode !== 'babble' && this.voice) {
      try {
        const u = new SpeechSynthesisUtterance(clean);
        u.voice = this.voice;
        u.lang = this.voice.lang;
        // نبرة طبيعية قريبة من الصوت الأصلي حتى ما يطلع الكلام مشوّه
        const p = profile.pitch ?? 0.9;
        const human = 0.9 + Math.max(0, Math.min(1, (p - 0.72) / 0.34)) * 0.16;
        u.pitch = profile.species === 'robot' ? 1.25 : profile.species === 'alien' ? 0.8 : human;
        u.rate = 1.0;
        u.volume = 0.9;
        window.speechSynthesis.speak(u);
        return clean.length * 70;
      } catch (e) { /* نرجع للهمهمة */ }
    }
    return this.babble(clean, profile);
  }

  babble(text, profile) {
    if (!Game.settings.sound) return 0;
    const c = Sfx.ensure();
    if (!c) return 0;
    const words = text.split(/\s+/).filter(Boolean);
    const syl = Math.min(22, Math.max(2, Math.round(text.length / 2.6)));
    const base = 110 * (profile.pitch ?? 0.9) * (profile.species === 'robot' ? 2.2 : profile.species === 'alien' ? 0.8 : 1);
    let t = c.currentTime + 0.02;
    let wi = 0;
    for (let i = 0; i < syl; i++) {
      const dur = 0.06 + Math.random() * 0.05;
      const f = base * Math.pow(2, (Math.random() * 5 - 2) / 12) * (i === syl - 1 ? 0.85 : 1);
      this.syllable(t, dur, f, profile.species);
      t += dur + 0.025;
      // وقفة قصيرة بين الكلمات
      if (Math.random() < words.length / Math.max(1, syl)) { t += 0.05; wi++; }
    }
    return (t - c.currentTime) * 1000;
  }

  syllable(t, dur, f, species) {
    const c = Sfx.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    if (species === 'robot') {
      o.type = 'square';
      o.frequency.setValueAtTime(f, t);
      o.frequency.setValueAtTime(f * (Math.random() < 0.5 ? 1.25 : 0.8), t + dur / 2);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.035, t + 0.005);
      g.gain.setValueAtTime(0.035, t + dur - 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
    } else {
      // صوت بشري مبسّط: موجة سن منشار عبر مرشّح "حرف علّة"
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      o.frequency.linearRampToValueAtTime(f * (0.92 + Math.random() * 0.16), t + dur);
      const vowels = [[700, 1200], [400, 2000], [300, 900], [550, 1700]];
      const [f1, f2] = vowels[Math.floor(Math.random() * vowels.length)];
      const b1 = c.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = f1; b1.Q.value = 5;
      const b2 = c.createBiquadFilter(); b2.type = 'bandpass'; b2.frequency.value = f2; b2.Q.value = 7;
      const m = c.createGain(); m.gain.value = 1;
      o.connect(b1); o.connect(b2); b1.connect(m); b2.connect(m);
      if (species === 'alien') {
        const lfo = c.createOscillator(); lfo.frequency.value = 18;
        const lg = c.createGain(); lg.gain.value = f * 0.08;
        lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.02);
      }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      m.connect(g);
    }
    g.connect(Sfx.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  stop() {
    if (this.current) { try { this.current.pause(); } catch (e) { /* ignore */ } this.current = null; }
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  }
}

export const Voice = new VoiceEngine();
