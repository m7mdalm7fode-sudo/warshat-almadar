// قضايا المسروقات: لصوص، أبرياء بشكل مريب، لوحة البلاغات، وزيارات أصحاب الأغراض
import T from '../data/thieves.json';
import { makeLook, rng } from '../gfx/CharacterGenerator.js';

export const THIEF_DATA = T;
export const OWNERS = Object.fromEntries(T.owners.map((o) => [o.id, o]));
export const TROPHIES = T.trophies;

const pickR = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const MINIS = ['lock', 'clean', 'screws', 'wires', 'swap', 'calibrate'];

/** يقرّر هل يأتي مشتبه اليوم، ويملأ لوحة البلاغات */
export function planSuspect(st) {
  st.cases = st.cases || {};
  st.board = [];
  if (st.day < 2) return null;
  const free = T.owners.filter((o) => !st.cases[o.id]);
  let entry = null;
  const chance = st.day === 2 ? 1 : 0.7;
  if (Math.random() < chance) {
    const seed = Math.floor(Math.random() * 1e9);
    // أول مشتبه دائماً لص حقيقي حتى يتعلّم اللاعب الفكرة
    const isThief = free.length > 0 && (st.day === 2 || Math.random() < 0.7);
    if (isThief) {
      const o = free[Math.floor(Math.random() * free.length)];
      st.cases[o.id] = 'pending';
      entry = { type: 'suspect', thief: true, owner: o.id, seed };
    } else {
      entry = { type: 'suspect', thief: false, seed };
    }
  }
  const decoys = shuffle(free.filter((o) => !entry || o.id !== entry.owner)).slice(0, entry && entry.thief ? 1 : 2);
  st.board = shuffle([...(entry && entry.thief ? [entry.owner] : []), ...decoys.map((o) => o.id)]);
  return entry;
}

export function resolveSuspect(entry, st, priceOf) {
  const r = rng(entry.seed);
  const look = makeLook(pickR(r, T.thieves.looks), entry.seed);
  let name, itemKind, itemName, engraving, claim;
  if (entry.thief) {
    const o = OWNERS[entry.owner];
    name = pickR(r, T.thieves.names);
    itemKind = o.item.kind; itemName = o.item.name; engraving = o.name;
    claim = pickR(r, T.thieves.claims);
  } else {
    const o = pickR(r, T.owners);
    name = pickR(r, T.innocents.names);
    itemKind = o.item.kind; itemName = o.item.name.replace('الأجداد', 'قديمة').replace('العائلة', 'قديم');
    engraving = name;
    claim = pickR(r, T.innocents.claims);
  }
  const lines = claim.map((l) => l.replace('{item}', itemName));
  return {
    id: null, memKey: null, kind: 'suspect', thief: !!entry.thief, ownerId: entry.owner || null,
    name, look, itemKind, itemName, engraving, lines,
    minigame: pickR(r, MINIS),
    price: priceOf(entry.thief ? 160 : 100),
  };
}

export function resolveOwner(entry, st) {
  const o = OWNERS[entry.id];
  if (!o) return null;
  const look = makeLook(o.look, entry.seed || 7);
  if (entry.mode === 'lost') {
    return {
      id: null, memKey: `owner_${o.id}`, kind: 'owner', name: o.name, look, itemKind: null,
      lines: [...o.lost, 'تدري عنه شي يا معلّم؟'],
      moral: {
        options: [
          { label: 'أعترف: مرّ عليّ', money: -80, rep: 0.05, reply: 'على الأقل صدقت معي... بعطي الشرطة الوصف، وخذها درس.', mood: 'sad' },
          { label: 'ما شفته', money: 0, rep: -0.15, reply: 'طيب... الله يعوّضني.', mood: 'sad' },
        ],
      },
    };
  }
  const g = o.gift;
  const tr = TROPHIES[g.trophy];
  return {
    id: null, memKey: `owner_${o.id}`, kind: 'owner', name: o.name, look, itemKind: null,
    lines: o.thanks,
    moral: {
      options: [
        { label: `تشرّفنا (هدية: ${tr ? tr.name : ''})`, money: g.money, rep: 0.15, trophy: g.trophy, reply: 'ورشتك صارت حديث السوق. الله يحفظك.', mood: 'great', news: `${o.name} يستعيد «${o.item.name}» ويكرّم ورشة المدار` },
      ],
    },
  };
}

export function boardReports(st) {
  return (st.board || []).map((id) => OWNERS[id]).filter(Boolean);
}

export function stallPrompts(n = 3) {
  return shuffle(T.stall.prompts.slice()).slice(0, n).map((p) => ({ q: p.q, a: shuffle(p.a.slice()) }));
}

export function flavorNews() {
  return T.news;
}
