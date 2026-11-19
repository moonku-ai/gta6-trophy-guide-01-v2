// Tests for filtering, search, the spoiler rule and the "next up" planner.
// Pure logic lives in app/js/filters.js (no DOM at import).
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTrophies, maskForSpoilers, nextUp } from '../app/js/filters.js';

function trophy(name, kind, stage, hidden = false, description = '') {
  return { name, kind, stage, hidden, description, grade: 'bronze', missable: kind === 'missable' };
}

const LIST = [
  trophy('Story One', 'story', 1, true, 'Complete Chapter 1.'),
  trophy('Story Two', 'story', 1, true, 'Complete Chapter 2.'),
  trophy('Meditate All', 'missable', 1, false, 'Meditate at every spot.'),
  trophy('Card Sets', 'collectibles', 2, false, 'Complete 3 Collectible Card sets.'),
  trophy('Stunt King', 'activities', 2, false, 'Complete 250 Stunts.'),
  trophy('Side Pal', 'side', 3, true, 'Complete the final mission for Andy.'),
  trophy('Rob Bank', 'robbery', 3, false, 'Rob 5 Bank Vaults and escape.'),
  trophy('Spend Cash', 'money', 3, false, 'Spend $100,000 across all shops.'),
  trophy('Odd One', 'misc', 3, true, 'What the hell just happened?'),
  trophy('Platinum', 'platinum', 0, false, 'Earn every other trophy.'),
];

test('kind filter returns only that kind', () => {
  assert.deepEqual(filterTrophies(LIST, { kind: 'story' }).map((t) => t.name), ['Story One', 'Story Two']);
  assert.deepEqual(filterTrophies(LIST, { kind: 'missable' }).map((t) => t.name), ['Meditate All']);
  assert.deepEqual(filterTrophies(LIST, { kind: 'collectibles' }).map((t) => t.name), ['Card Sets']);
  assert.deepEqual(filterTrophies(LIST, { kind: 'activities' }).map((t) => t.name), ['Stunt King']);
});

test('online filter returns nothing: GTA VI has no online trophies', () => {
  assert.deepEqual(filterTrophies(LIST, { kind: 'online' }), []);
});

test('search matches name and description, case-insensitive', () => {
  assert.deepEqual(filterTrophies(LIST, { query: 'bank' }).map((t) => t.name), ['Rob Bank']);
  assert.deepEqual(filterTrophies(LIST, { query: 'CHAPTER' }).map((t) => t.name), ['Story One', 'Story Two']);
  assert.deepEqual(filterTrophies(LIST, { query: 'zzz' }), []);
});

test('earned filter shows only earned trophies', () => {
  const earned = new Set(['Story One', 'Card Sets']);
  assert.deepEqual(filterTrophies(LIST, { earnedOnly: true }, earned).map((t) => t.name), ['Story One', 'Card Sets']);
});

test('spoiler mode hides name and description of unearned story trophies', () => {
  const earned = new Set(['Story Two']);
  const masked = maskForSpoilers(LIST, earned, true);
  const one = masked.find((t) => t.name === 'Story One');
  assert.equal(one.displayName, 'Hidden story trophy');
  assert.equal(one.displayDescription, 'Earn this trophy to reveal its name and description.');
  const two = masked.find((t) => t.name === 'Story Two');
  assert.equal(two.displayName, 'Story Two');
  const card = masked.find((t) => t.name === 'Card Sets');
  assert.equal(card.displayName, 'Card Sets', 'non-story trophies are never hidden');
});

test('spoiler mode off shows every name', () => {
  const masked = maskForSpoilers(LIST, new Set(), false);
  assert.equal(masked.find((t) => t.name === 'Story One').displayName, 'Story One');
});

test('next up picks the earliest unearned trophy by roadmap stage', () => {
  const earned = new Set(['Story One', 'Story Two', 'Meditate All']);
  assert.equal(nextUp(LIST, earned).name, 'Card Sets');
});

test('next up skips the platinum until everything else is earned', () => {
  const earned = new Set(LIST.filter((t) => t.kind !== 'platinum').map((t) => t.name));
  assert.equal(nextUp(LIST, earned).name, 'Platinum');
});

test('next up is null when everything is earned', () => {
  const earned = new Set(LIST.map((t) => t.name));
  assert.equal(nextUp(LIST, earned), null);
});
