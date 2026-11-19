// Tracker state: which trophies are earned, notes per trophy, and the
// export/import round-trip. Pure functions only — no DOM, no storage here,
// so node --test can drive them directly. The browser shell (app.js) owns
// localStorage and the file download.

export const STORAGE_KEY = 'leonida-trophy-tracker-v2';

// The 13 trophies the ?demo=1 preview marks earned, so the tracker reads
// as a playthrough in progress instead of an empty list.
export const DEMO_EARNED = [
  'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!',
  'Top Of The World, Ma', 'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL',
  'Hi-Jacked', 'Snow Storm', 'Baited My Tackle', 'Stick Fiddler',
];

export function createState() {
  return { earned: new Set(), notes: {} };
}

export function toggleEarned(state, name, knownNames) {
  if (knownNames && !knownNames.includes(name)) return false;
  if (state.earned.has(name)) state.earned.delete(name);
  else state.earned.add(name);
  return true;
}

export function setNote(state, name, text) {
  const clean = String(text ?? '').trim();
  if (clean === '') delete state.notes[name];
  else state.notes[name] = clean;
}

export function progressOf(state, allNames) {
  const total = allNames.length;
  const earned = allNames.filter((n) => state.earned.has(n)).length;
  return { earned, total, remaining: total - earned, percent: total === 0 ? 0 : Math.round((earned / total) * 100) };
}

export function exportState(state) {
  return JSON.stringify({ app: 'leonida-trophy-tracker', version: 2, earned: [...state.earned].sort(), notes: state.notes }, null, 2);
}

export function importState(text, knownNames) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('That file is not a trophy progress export.');
  }
  if (!Array.isArray(parsed.earned)) {
    throw new Error('That file has no earned list.');
  }
  const state = createState();
  const known = new Set(knownNames ?? []);
  for (const name of parsed.earned) {
    if (typeof name === 'string' && (known.size === 0 || known.has(name))) state.earned.add(name);
  }
  if (parsed.notes && typeof parsed.notes === 'object') {
    for (const [name, note] of Object.entries(parsed.notes)) {
      if (typeof note === 'string' && (known.size === 0 || known.has(name))) state.notes[name] = note;
    }
  }
  return state;
}

export function demoState(names) {
  const state = createState();
  for (const name of names.slice(0, 13)) state.earned.add(name);
  return state;
}

export function serializeForStorage(state) {
  return JSON.stringify({ earned: [...state.earned], notes: state.notes });
}

export function parseFromStorage(text) {
  if (!text) return createState();
  try {
    const parsed = JSON.parse(text);
    const state = createState();
    if (Array.isArray(parsed.earned)) for (const n of parsed.earned) if (typeof n === 'string') state.earned.add(n);
    if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
    return state;
  } catch {
    return createState();
  }
}
