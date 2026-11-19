// Tests for the trophy data file: the official 55, grades, guides and sources.
// Run: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, '..', 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = data.trophies;

// The official PlayStation 5 list, as published (Exophase / PSNProfiles, 18 Nov 2026).
const OFFICIAL_NAMES = [
  'Vice Got a Price!', 'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money',
  'Vice City, Baby!', 'Top Of The World, Ma', 'You Gotta Know When to Get Off', 'Trust',
  'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'A Long Road',
  'Cunning Stunts', 'Master of None', 'The Shootist', 'Top Fun', 'Earn Cash, Not Kudos',
  'Baited My Tackle', 'Stick Fiddler', 'Road to Rehabilitation', 'This Was No Boat Accident',
  'The Lone Rider', 'Strangers & Freaks', 'Supply & Demand', 'Spin On This!',
  'Positive Mental Attitude', 'Fair Game', "Don't Touch My Deck", 'You WAiNKer!',
  'One Last Thing', 'Hot Together', 'Retail Therapy', 'Whip It Good', 'Gunslinger',
  'Catch Me If You Can', 'Challenging Tank', 'Sneakthief', 'Maximum Withdrawal',
  'A Classic Blitz Play', 'The Goodtime State', 'Pest Control', 'In The Beginning…',
  'Capital Offense', 'Let’s Go Bowling', 'Personal Best', 'Actions Speak Louder',
  'Bad Luck, I Guess', 'The Truth Is Out There', 'Ten Pin', 'Dime on the Dollar',
  'Treat Yo Self', 'Little Boxes', 'On the Spot',
];

const KINDS = new Set(['platinum', 'story', 'missable', 'collectibles', 'activities', 'side', 'robbery', 'money', 'misc']);

// PSN progress targets, as PSNProfiles lists them (trophy list 43531).
const TARGETS = {
  'A Long Road': 100, 'Cunning Stunts': 250, 'Master of None': 9, 'The Shootist': 42,
  'Top Fun': 14, 'Earn Cash, Not Kudos': 20, 'Strangers & Freaks': 8,
  'Positive Mental Attitude': 18, "Don't Touch My Deck": 3, 'You WAiNKer!': 100,
  'One Last Thing': 50, 'Whip It Good': 100, 'Maximum Withdrawal': 5,
  'The Goodtime State': 52, 'Pest Control': 9, 'Actions Speak Louder': 500,
  'Dime on the Dollar': 250000, 'Treat Yo Self': 100000, 'Little Boxes': 8, 'On the Spot': 10,
};

test('data holds exactly the 55 official trophies, no more, no fewer', () => {
  assert.equal(trophies.length, 55);
  const names = new Set(trophies.map((t) => t.name));
  assert.equal(names.size, 55, 'trophy names must be unique');
  for (const name of OFFICIAL_NAMES) {
    assert.ok(names.has(name), `missing official trophy: ${name}`);
  }
});

test('grade split is 1 platinum, 2 gold, 6 silver, 46 bronze', () => {
  const counts = {};
  for (const t of trophies) counts[t.grade] = (counts[t.grade] ?? 0) + 1;
  assert.deepEqual(counts, { platinum: 1, gold: 2, silver: 6, bronze: 46 });
});

test('every trophy has its official description and a non-blank guide in our own words', () => {
  for (const t of trophies) {
    assert.ok(typeof t.description === 'string' && t.description.trim().length > 0, `${t.name}: description`);
    assert.ok(typeof t.guide === 'string' && t.guide.trim().length >= 40, `${t.name}: guide too short or blank`);
  }
});

test('every guide cites at least one named source with a link', () => {
  for (const t of trophies) {
    assert.ok(Array.isArray(t.sources) && t.sources.length >= 1, `${t.name}: no sources`);
    for (const s of t.sources) {
      assert.ok(typeof s.label === 'string' && s.label.trim().length > 0, `${t.name}: source without label`);
      assert.ok(typeof s.url === 'string' && /^https:\/\//.test(s.url), `${t.name}: source without https url`);
    }
  }
});

test('every trophy carries a valid kind, a missable flag and a roadmap stage', () => {
  for (const t of trophies) {
    assert.ok(KINDS.has(t.kind), `${t.name}: bad kind ${t.kind}`);
    assert.equal(typeof t.missable, 'boolean', `${t.name}: missable flag`);
    assert.ok([0, 1, 2, 3].includes(t.stage), `${t.name}: bad stage ${t.stage}`);
  }
});

test('exactly one trophy is missable: Positive Mental Attitude', () => {
  const missable = trophies.filter((t) => t.missable).map((t) => t.name);
  assert.deepEqual(missable, ['Positive Mental Attitude']);
});

test('28 trophies are hidden on PlayStation until earned', () => {
  const hidden = trophies.filter((t) => t.hidden === true);
  assert.equal(hidden.length, 28);
  assert.ok(hidden.some((t) => t.name === 'Trust'), 'story trophies are hidden');
  assert.ok(!hidden.some((t) => t.name === 'Vice Got a Price!'), 'platinum is visible');
});

test('PSN progress targets match PSNProfiles where a count exists', () => {
  for (const t of trophies) {
    if (TARGETS[t.name] !== undefined) {
      assert.equal(t.target, TARGETS[t.name], `${t.name}: target`);
    } else {
      assert.ok(t.target === null || t.target === undefined, `${t.name}: unexpected target`);
    }
  }
});

test('roadmap stages cover every trophy: 1 story, 15 checklist, 26 cleanup, 1 platinum', () => {
  const stages = {};
  for (const t of trophies) stages[t.stage] = (stages[t.stage] ?? 0) + 1;
  assert.deepEqual(stages, { 0: 1, 1: 13, 2: 15, 3: 26 });
});

test('kind filter buckets cover the required kinds', () => {
  const kinds = new Set(trophies.map((t) => t.kind));
  for (const k of ['story', 'missable', 'collectibles', 'activities']) {
    assert.ok(kinds.has(k), `kind ${k} missing`);
  }
  // No online trophies exist in GTA VI: nothing may claim kind "online".
  assert.ok(!kinds.has('online'), 'no trophy may be online');
});
