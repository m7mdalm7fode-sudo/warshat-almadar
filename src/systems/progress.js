// عمق اللعب: أحداث يومية، عقود يومية، مهارات لكل نوع إصلاح، وسلاسل إتقان

export const TYPE_NAMES = {
  lock: 'فك الأقفال', clean: 'التنظيف', screws: 'البراغي', wires: 'الأسلاك', swap: 'تبديل القطع', calibrate: 'المعايرة',
};
export const TYPES = Object.keys(TYPE_NAMES);

// ---------- الأحداث اليومية ----------
export const EVENTS = {
  solar_storm: { name: 'عاصفة شمسية', desc: 'الأجهزة الملاحية تخرّبت: أجر المعايرة ×1.8، والوقت في الإصلاح أقل 10%.', pay: { calibrate: 1.8 }, bias: 'calibrate', time: 0.9, color: 0xffc94a },
  festival: { name: 'مهرجان السوق', desc: 'زحمة زبائن (+2) والناس كريمة: كل الأجور +20%.', extra: 2, payAll: 1.2, color: 0xff3fa4 },
  blackout: { name: 'انقطاع كهرباء جزئي', desc: 'الدوام أقصر 25%، والناس انقفلت أجهزتها: أجر الأقفال ×1.7.', pay: { lock: 1.7 }, bias: 'lock', day: 0.75, color: 0x8a94b8 },
  dust: { name: 'عاصفة غبار', desc: 'كل شي تغبّر: أجر التنظيف ×1.6.', pay: { clean: 1.6 }, bias: 'clean', color: 0xb87333 },
  meteor: { name: 'زخّة نيازك', desc: 'قطع محروقة في كل مكان: أجر تبديل القطع والأسلاك ×1.5.', pay: { swap: 1.5, wires: 1.5 }, bias: 'swap', color: 0xff7a2f },
};

export function pickEvent(st) {
  if (st.day < 3 || Math.random() > 0.45) { st.event = null; return null; }
  const ids = Object.keys(EVENTS).filter((k) => k !== st.lastEvent);
  const id = ids[Math.floor(Math.random() * ids.length)];
  st.event = id;
  st.lastEvent = id;
  return EVENTS[id];
}

export function currentEvent(st) {
  return st.event ? EVENTS[st.event] : null;
}

// ---------- المهارات ----------
const LEVELS = [0, 3, 8, 15, 25];
export function skillLevel(xp = 0) {
  let l = 0;
  LEVELS.forEach((t) => { if (xp >= t) l += 1; });
  return l;
}
export function nextLevelXp(xp = 0) {
  return LEVELS.find((t) => t > xp) ?? null;
}
export function skillBonus(st, type) {
  const lvl = skillLevel((st.mastery || {})[type] || 0);
  return { lvl, time: 1 + 0.06 * (lvl - 1), pay: 1 + 0.05 * (lvl - 1) };
}
/** يرجع المستوى الجديد إذا ارتفع */
export function addXp(st, type, amount) {
  st.mastery = st.mastery || {};
  const before = skillLevel(st.mastery[type] || 0);
  st.mastery[type] = (st.mastery[type] || 0) + amount;
  const after = skillLevel(st.mastery[type]);
  return after > before ? after : 0;
}

// ---------- العقود اليومية ----------
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function makeContracts(st, queue) {
  const types = {};
  queue.forEach(() => {});
  const pool = [];
  const t = pick(TYPES);
  const g = Math.random() < 0.5 ? 2 : 3;
  pool.push({ kind: 'type', type: t, goal: g, reward: 70 + g * 15, text: `أصلح ${g} أغراض من نوع «${TYPE_NAMES[t]}»` });
  pool.push({ kind: 'perfect', goal: 2, reward: 110, text: 'حقّق إصلاحين بتقييم ممتاز' });
  const earn = Math.round((260 + st.day * 30) / 10) * 10;
  pool.push({ kind: 'earn', goal: earn, reward: 100, text: `اكسب ${earn} كريدت من الإصلاحات اليوم` });
  pool.push({ kind: 'norefuse', goal: 1, reward: 80, text: 'لا ترفض أي زبون اليوم' });
  pool.push({ kind: 'combo', goal: 3, reward: 150, text: 'حقّق سلسلة إتقان ×3 (ثلاث إصلاحات ممتازة ورا بعض)' });
  if (queue.some((e) => e.type === 'suspect')) pool.push({ kind: 'arrest', goal: 1, reward: 150, text: 'اقبض على لص اليوم' });
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  st.contracts = pool.slice(0, 2).map((c) => ({ ...c, progress: 0, done: false, failed: false }));
  return st.contracts;
}

/** يحدّث العقود ويرجع العقود اللي اكتملت للتو */
export function trackContracts(st, ev) {
  const done = [];
  (st.contracts || []).forEach((c) => {
    if (c.done || c.failed) return;
    if (c.kind === 'type' && ev.type === 'repair' && ev.success && ev.minigame === c.type) c.progress += 1;
    if (c.kind === 'perfect' && ev.type === 'repair' && ev.success && ev.score >= 0.85) c.progress += 1;
    if (c.kind === 'earn' && ev.type === 'earn') c.progress += ev.amount;
    if (c.kind === 'combo' && ev.type === 'combo') c.progress = Math.max(c.progress, ev.n);
    if (c.kind === 'arrest' && ev.type === 'arrest') c.progress += 1;
    if (c.kind === 'norefuse' && ev.type === 'refuse') c.failed = true;
    if (c.kind === 'norefuse' && ev.type === 'dayEnd') c.progress = 1;
    if (c.kind !== 'norefuse' || ev.type === 'dayEnd') {
      if (!c.failed && c.progress >= c.goal) { c.done = true; done.push(c); }
    }
  });
  return done;
}

export function contractLine(c) {
  const state = c.done ? '✓' : c.failed ? '✗' : c.kind === 'earn' ? `${Math.min(c.progress, c.goal)}/${c.goal}` : c.kind === 'norefuse' ? '…' : `${Math.min(c.progress, c.goal)}/${c.goal}`;
  return `${c.text}\n   [${state}]  المكافأة: ${c.reward} كريدت`;
}
