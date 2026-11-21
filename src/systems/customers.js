// بناء طابور الزبائن اليومي وتحويل بيانات JSON إلى زيارة جاهزة للعرض
import data from '../data/customers.json';
import { makeLook, hashStr, rng } from '../gfx/CharacterGenerator.js';
import { planSuspect, resolveSuspect, resolveOwner } from './cases.js';

const byId = {};
data.story.forEach((c) => { byId[c.id] = { ...c, kind: 'story' }; });
data.recurring.forEach((c) => { byId[c.id] = { ...c, kind: 'recurring' }; });

export const pickRand = (a) => a[Math.floor(Math.random() * a.length)];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function flagsOk(def, st) {
  return (def.requires || []).every((f) => st.flags[f]) && !(def.excludes || []).some((f) => st.flags[f]);
}

export function buildDayQueue(st) {
  let count = Math.min(7, 5 + Math.floor((st.day - 1) / 3) + (Math.random() < 0.35 ? 1 : 0));
  const special = [];

  // أحداث مجدولة (نتائج قرارات سابقة)
  const due = st.schedule.filter((s) => s.day <= st.day);
  st.schedule = st.schedule.filter((s) => s.day > st.day);
  due.forEach((s) => {
    if (s.kind === 'owner') { special.push({ type: 'owner', id: s.id, mode: s.mode, seed: s.seed }); return; }
    const d = byId[s.id];
    if (d && flagsOk(d, st)) special.push({ type: 'story', id: s.id });
  });

  // زبائن القصة الجدد
  const story = data.story
    .filter((c) => !c.trigger && !st.seen[c.id] && c.minDay <= st.day && flagsOk(c, st))
    .sort((a, b) => a.minDay - b.minDay);
  story.slice(0, st.day === 1 ? 1 : 2).forEach((c) => special.push({ type: 'story', id: c.id }));

  // زبون متكرر واحد
  const rec = data.recurring.filter((c) => {
    const m = st.memory[c.id];
    const visits = m ? m.visits : 0;
    const lastDay = m ? m.lastDay : -99;
    return c.minDay <= st.day && visits < c.visits.length && lastDay <= st.day - c.cooldown;
  });
  if (rec.length) special.push({ type: 'recurring', id: pickRand(rec).id });

  const suspect = planSuspect(st);
  if (suspect) special.push(suspect);

  count = Math.max(count, Math.min(8, special.length + 2));
  const q = [...special];
  while (q.length < count) q.push({ type: 'generic', seed: Math.floor(Math.random() * 1e9) });
  shuffle(q);
  return q;
}

export function priceOf(base, st, mods) {
  const dayMult = 1 + Math.min(0.5, (st.day - 1) * 0.045);
  const repMult = 0.7 + st.rep * 0.12;
  return Math.max(20, Math.round((base * dayMult * repMult * mods.payMult) / 5) * 5);
}

export function resolveVisit(entry, st, mods) {
  if (entry.type === 'generic') {
    const r = rng(entry.seed);
    const tpl = data.generic.problems[Math.floor(r() * data.generic.problems.length)];
    const rich = mods.payMult >= 1.4 && r() < 0.5;
    const look = makeLook(rich ? { accessory: 'chain' } : {}, entry.seed);
    const names = data.generic.names[look.species];
    const name = names[Math.floor(r() * names.length)];
    const greets = data.generic.greet[look.species];
    const greet = greets[Math.floor(r() * greets.length)];
    const ask = data.generic.ask[Math.floor(r() * data.generic.ask.length)];
    const base = tpl.pay[0] + Math.floor(r() * (tpl.pay[1] - tpl.pay[0]));
    return {
      id: null, memKey: null, kind: 'generic', name, look,
      itemKind: tpl.kind, itemName: tpl.item,
      lines: [greet, tpl.problem, ask],
      minigame: tpl.minigame,
      price: priceOf(base * (rich ? 1.2 : 1), st, mods),
    };
  }

  if (entry.type === 'suspect') return resolveSuspect(entry, st, (b) => priceOf(b, st, mods));
  if (entry.type === 'owner') return resolveOwner(entry, st);

  const def = byId[entry.id];
  if (!def) return null;
  const look = makeLook(def.look || {}, hashStr(def.lookSeed || def.id));
  const memKey = def.memKey || def.id;
  const mem = st.memory[memKey];

  if (def.kind === 'recurring') {
    const vi = mem ? mem.visits : 0;
    const v = def.visits[Math.min(vi, def.visits.length - 1)];
    const lines = [...v.dialog];
    if (mem && def.memory[mem.last]) lines.unshift(def.memory[mem.last]);
    return {
      id: def.id, memKey, kind: 'recurring', name: def.name, look,
      itemKind: v.item.kind, itemName: v.item.name,
      lines, minigame: v.minigame, price: priceOf(v.pay, st, mods),
    };
  }

  const lines = [...def.dialog];
  if (memKey === 'officer' && mem) lines.unshift('نتقابل كثير يا معلّم...');
  return {
    id: def.id, memKey, kind: 'story', name: def.name, look,
    itemKind: def.item ? def.item.kind : null,
    itemName: def.item ? def.item.name : null,
    lines, minigame: def.minigame,
    price: priceOf(def.pay || 80, st, mods),
    moral: def.moral || null,
  };
}

export function reactionLine(cat, v) {
  const line = pickRand(data.reactions[cat] || ['...']);
  return v && v.look && v.look.species === 'robot' ? `بيب! ${line}` : line;
}

export const CUSTOMER_DATA = data;
