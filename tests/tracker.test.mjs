// Tests for the tracker state: localStorage save, toggle, progress, notes,
// export/import round-trip. Pure logic lives in app/js/tracker.js (no DOM at import).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, toggleEarned, setNote, progressOf, exportState, importState, demoState } from '../app/js/tracker.js';

const NAMES = ['Alpha Trophy', 'Beta Trophy', 'Gamma Trophy'];

test('a fresh state earns nothing and reports 0%', () => {
  const s = createState(NAMES);
  assert.equal(progressOf(s, NAMES).earned, 0);
  assert.equal(progressOf(s, NAMES).percent, 0);
});

test('toggling a trophy marks it earned, toggling again clears it', () => {
  const s = createState(NAMES);
  toggleEarned(s, 'Alpha Trophy');
  assert.ok(s.earned.has('Alpha Trophy'));
  assert.equal(progressOf(s, NAMES).earned, 1);
  toggleEarned(s, 'Alpha Trophy');
  assert.ok(!s.earned.has('Alpha Trophy'));
  assert.equal(progressOf(s, NAMES).earned, 0);
});

test('toggling an unknown name changes nothing', () => {
  const s = createState(NAMES);
  toggleEarned(s, 'Not A Trophy');
  assert.equal(progressOf(s, NAMES).earned, 0);
});

test('progress percent rounds to a whole number', () => {
  const s = createState(NAMES);
  toggleEarned(s, 'Alpha Trophy');
  assert.equal(progressOf(s, NAMES).percent, 33);
  toggleEarned(s, 'Beta Trophy');
  assert.equal(progressOf(s, NAMES).percent, 67);
});

test('notes are stored per trophy and survive a round-trip', () => {
  const s = createState(NAMES);
  setNote(s, 'Beta Trophy', 'Do this after chapter 2');
  assert.equal(s.notes['Beta Trophy'], 'Do this after chapter 2');
  const back = importState(exportState(s), NAMES);
  assert.equal(back.notes['Beta Trophy'], 'Do this after chapter 2');
});

test('export then import restores the same earned set', () => {
  const s = createState(NAMES);
  toggleEarned(s, 'Alpha Trophy');
  toggleEarned(s, 'Gamma Trophy');
  const text = exportState(s);
  const back = importState(text, NAMES);
  assert.deepEqual([...back.earned].sort(), ['Alpha Trophy', 'Gamma Trophy']);
});

test('import drops unknown names and keeps only real trophies', () => {
  const s = importState(JSON.stringify({ earned: ['Alpha Trophy', 'Fake Trophy'], notes: {} }), NAMES);
  assert.deepEqual([...s.earned], ['Alpha Trophy']);
});

test('import rejects broken JSON and non-object payloads', () => {
  assert.throws(() => importState('not json', NAMES));
  assert.throws(() => importState('[]', NAMES));
  assert.throws(() => importState('{"earned":"nope"}', NAMES));
});

test('demo state earns exactly 13 trophies', () => {
  const s = demoState(NAMES.concat(Array.from({ length: 52 }, (_, i) => `Trophy ${i}`)));
  assert.equal(s.earned.size, 13);
});
