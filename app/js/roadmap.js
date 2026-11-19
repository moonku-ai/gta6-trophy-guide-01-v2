// The road to the platinum, in three stages, built from the official
// descriptions and the published roadmap (PowerPyx, 18 Nov 2026):
// story first, then the 100% checklist, then the leftover strands.
// Hours and difficulty are PowerPyx's estimates, cited in the app.

// ROADMAP_STAGES: one entry per stage. `stage` matches the `stage` field
// on each trophy in app/data/trophies.json (0 is the platinum itself).
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story',
    hours: '60–80 hours',
    blurb:
      'Finish all five chapters and enjoy the game. Every story trophy pops as you play, and progress toward the 100% checklist already counts. One thing to do on purpose: the Chapter 1 meditation at Jason’s house, the only trophy that may be missable. Keep a manual save at the start and end of each chapter — there is no mission replay.',
  },
  {
    stage: 2,
    title: 'Stage 2 — The 100% checklist',
    hours: 'About 100 hours',
    blurb:
      'After the story, the 100% Completion Checklist opens under Progress, then Stats. Its thresholds are lenient — closer to 60% of true completion — and most of it falls out of the other trophies: any 100 optional missions, 200 of 277 vehicles scanned, 100 of 255 animals studied, 70 of 80 challenges. Everything on the checklist is still available in free-roam.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Strangers & cleanup',
    hours: 'About 10 hours',
    blurb:
      'The checklist does not cover the stranger strands, the side-character questlines, the odd jobs or the robberies, so finish them here. Anything left over after this stage is a short grind: a few races, a few challenges, a few shops.',
  },
];

export const ROADMAP_FACTS = [
  { label: 'Difficulty', value: '4 / 10' },
  { label: 'Time to platinum', value: 'About 200 hours' },
  { label: 'Playthroughs', value: '1' },
  { label: 'Online trophies', value: '0 — all 55 are offline' },
  { label: 'Missable', value: 'Possibly 1 — Positive Mental Attitude' },
  { label: 'Cheats', value: 'Disable trophies and saving — keep them off' },
];

// Trophies of one stage, in list order.
export function trophiesInStage(trophies, stage) {
  return trophies.filter((t) => t.stage === stage);
}

// Stage progress: how many of a stage's trophies are earned.
export function stageProgress(trophies, earned, stage) {
  const list = trophiesInStage(trophies, stage);
  const done = list.filter((t) => earned.has(t.name)).length;
  return { done, total: list.length, percent: list.length === 0 ? 100 : Math.round((done / list.length) * 100) };
}
