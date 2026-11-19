// Filtering, search, the spoiler rule and the "next up" planner.
// Pure functions only — no DOM — so node --test can drive them directly.

export const KIND_LABELS = {
  all: 'All trophies',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  side: 'Side quests',
  robbery: 'Robberies',
  money: 'Money',
  misc: 'Odd jobs',
  platinum: 'Platinum',
  online: 'Online',
};

export function filterTrophies(trophies, options = {}, earned = new Set()) {
  const { kind = 'all', query = '', earnedOnly = false } = options;
  const needle = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kind === 'online') return false; // GTA VI has no online trophies.
    if (kind !== 'all' && t.kind !== kind) return false;
    if (earnedOnly && !earned.has(t.name)) return false;
    if (needle !== '') {
      const hay = `${t.name} ${t.description} ${t.guide ?? ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

// Spoiler rule: with spoilers on, an unearned story trophy shows a
// placeholder instead of its name and description. Earned story trophies,
// and every non-story trophy, always show in full.
export function maskForSpoilers(trophies, earned, spoilersOn) {
  return trophies.map((t) => {
    const hidden = spoilersOn && t.kind === 'story' && !earned.has(t.name);
    return {
      ...t,
      displayName: hidden ? 'Hidden story trophy' : t.name,
      displayDescription: hidden ? 'Earn this trophy to reveal its name and description.' : t.description,
      spoilerHidden: hidden,
    };
  });
}

// Next up: the earliest unearned trophy in roadmap order (stage, then list
// order). The platinum waits until every other trophy is earned.
export function nextUp(trophies, earned) {
  const rest = trophies
    .filter((t) => t.kind !== 'platinum' && !earned.has(t.name))
    .sort((a, b) => a.stage - b.stage);
  if (rest.length > 0) return rest[0];
  const platinum = trophies.find((t) => t.kind === 'platinum');
  if (platinum && !earned.has(platinum.name)) return platinum;
  return null;
}

// Per-kind progress counts for the filter chips.
export function kindCounts(trophies, earned) {
  const counts = {};
  for (const t of trophies) {
    counts[t.kind] = counts[t.kind] ?? { total: 0, earned: 0 };
    counts[t.kind].total += 1;
    if (earned.has(t.name)) counts[t.kind].earned += 1;
  }
  counts.all = { total: trophies.length, earned: [...earned].filter((n) => trophies.some((t) => t.name === n)).length };
  counts.online = { total: 0, earned: 0 };
  return counts;
}
