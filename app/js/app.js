// Leonida Ledger — boot and rendering. Loads the trophy data, owns the
// browser state (localStorage, URL preview flags) and renders the three
// views: checklist, roadmap, missables. All pure logic lives in tracker.js,
// filters.js and roadmap.js, which node --test drives directly.
import {
  STORAGE_KEY, DEMO_EARNED, createState, toggleEarned, setNote,
  progressOf, exportState, importState, serializeForStorage, parseFromStorage,
} from './tracker.js';
import { KIND_LABELS, filterTrophies, maskForSpoilers, nextUp, kindCounts } from './filters.js';
import { ROADMAP_STAGES, ROADMAP_FACTS, trophiesInStage, stageProgress } from './roadmap.js';

const SETTINGS_KEY = 'leonida-trophy-settings-v2';
const params = new URLSearchParams(location.search);

const $ = (id) => document.getElementById(id);
const els = {
  earnedCount: $('earnedCount'),
  progressLabel: $('progressLabel'),
  ringFill: $('ringFill'),
  nextUp: $('nextUp'),
  searchBox: $('searchBox'),
  spoilerToggle: $('spoilerToggle'),
  earnedOnly: $('earnedOnly'),
  exportBtn: $('exportBtn'),
  importFile: $('importFile'),
  resetBtn: $('resetBtn'),
  kindChips: $('kindChips'),
  listMeta: $('listMeta'),
  trophyList: $('trophyList'),
  detailPane: $('detailPane'),
  emptyNote: $('emptyNote'),
  roadmapFacts: $('roadmapFacts'),
  roadmapStages: $('roadmapStages'),
  missableHero: $('missableHero'),
};

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const names = trophies.map((t) => t.name);
const byId = new Map(trophies.map((t) => [t.id, t]));

// State: saved progress, or the demo preview (?demo=1) for screenshots.
let settings = { spoilersOn: false };
try {
  settings = { ...settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
} catch {
  // Keep defaults.
}
let state = parseFromStorage(localStorage.getItem(STORAGE_KEY));
if (params.get('demo') === '1') {
  state = createState();
  for (const name of DEMO_EARNED) state.earned.add(name);
  save();
}
if (params.get('spoiler') === '1') settings.spoilersOn = true;
// The view is session UI, not progress: a fresh load opens the checklist
// unless the URL asks for another section. Never restore a saved view.
const initialView = params.get('view') ?? 'checklist';

let kind = params.get('kind') ?? 'all';
let query = params.get('q') ?? '';
let selectedId = params.get('open') ?? null;
let earnedOnly = false;

function save() {
  localStorage.setItem(STORAGE_KEY, serializeForStorage(state));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function gradeLabel(t) {
  return t.grade === 'platinum' ? 'Platinum' : t.grade === 'gold' ? 'Gold' : t.grade === 'silver' ? 'Silver' : 'Bronze';
}

function renderHeader() {
  const p = progressOf(state, names);
  els.earnedCount.textContent = String(p.earned);
  els.progressLabel.textContent = `${p.percent}% to the platinum`;
  els.ringFill.style.strokeDashoffset = String(326.7 * (1 - p.percent / 100));
}

function renderNextUp() {
  const next = nextUp(trophies, state.earned);
  if (!next) {
    els.nextUp.hidden = true;
    return;
  }
  els.nextUp.hidden = false;
  els.nextUp.innerHTML =
    `<strong>Next up:</strong> ${esc(next.name)} <span class="nextup-kind">— ${esc(KIND_LABELS[next.kind] ?? next.kind)} · Stage ${next.stage} · ${esc(next.description)}</span> ` +
    `<button type="button" data-open="${esc(next.id)}">Open guide</button>`;
  els.nextUp.querySelector('[data-open]').addEventListener('click', (e) => selectTrophy(e.currentTarget.dataset.open));
}

function renderChips() {
  const counts = kindCounts(trophies, state.earned);
  const order = ['all', 'story', 'missable', 'collectibles', 'activities', 'side', 'robbery', 'money', 'misc', 'platinum', 'online'];
  els.kindChips.replaceChildren();
  for (const k of order) {
    const c = counts[k] ?? { total: 0, earned: 0 };
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (kind === k ? ' is-active' : '');
    chip.dataset.kind = k;
    chip.innerHTML = `${esc(KIND_LABELS[k])} <span class="count">${c.earned}/${c.total}</span>`;
    chip.addEventListener('click', () => { kind = k; render(); });
    els.kindChips.append(chip);
  }
}

function renderList() {
  const masked = maskForSpoilers(trophies, state.earned, settings.spoilersOn);
  const shown = filterTrophies(masked, { kind, query, earnedOnly }, state.earned);
  els.listMeta.textContent = kind === 'online'
    ? 'Online: there are no online trophies in GTA VI — all 55 are offline, single-player (PowerPyx).'
    : `Showing ${shown.length} of ${trophies.length} trophies.`;
  els.emptyNote.hidden = shown.length !== 0;
  els.trophyList.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (state.earned.has(t.name) ? ' is-earned' : '') + (t.id === selectedId ? ' is-selected' : '');
    li.dataset.id = t.id;
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `Open the guide for ${t.displayName}`);
    const target = t.target === null || t.target === undefined ? '' : `<span class="trophy-target">0/${Number(t.target).toLocaleString('en-US')}</span>`;
    const badges = `${t.missable ? '<span class="badge badge-missable">Missable</span>' : ''}${t.hidden ? '<span class="badge badge-hidden">Hidden on PSN</span>' : ''}`;
    li.innerHTML =
      `<input type="checkbox" class="trophy-check" ${state.earned.has(t.name) ? 'checked' : ''} aria-label="Mark ${esc(t.displayName)} earned">` +
      `<span class="grade-dot grade-${esc(t.grade)}" title="${esc(gradeLabel(t))}"></span>` +
      `<span><span class="trophy-name">${esc(t.displayName)}${badges}</span><br>` +
      `<span class="trophy-desc">${esc(t.displayDescription)}</span></span>` +
      `<span class="trophy-grade">${esc(gradeLabel(t))}${target ? '<br>' + target : ''}</span>`;
    li.querySelector('.trophy-check').addEventListener('change', (e) => {
      e.stopPropagation();
      toggleEarned(state, t.name, names);
      save();
      render();
    });
    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('trophy-check')) return;
      selectTrophy(t.id);
    });
    li.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === li) {
        e.preventDefault();
        selectTrophy(t.id);
      }
    });
    els.trophyList.append(li);
  }
}

function renderDetail() {
  const t = byId.get(selectedId) ?? null;
  if (!t) {
    els.detailPane.innerHTML = '<p class="detail-empty">Pick a trophy from the list to read its guide, sources and notes.</p>';
    return;
  }
  const earned = state.earned.has(t.name);
  const sources = t.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('');
  els.detailPane.innerHTML =
    `<h2>${esc(t.name)}</h2>` +
    `<p class="detail-grade">${esc(gradeLabel(t))} · ${esc(KIND_LABELS[t.kind] ?? t.kind)}${t.hidden ? ' · Hidden on PSN' : ''}${t.missable ? ' · Missable' : ''}${t.target ? ` · PSN target ${Number(t.target).toLocaleString('en-US')}` : ''} · <label><input type="checkbox" id="detailEarned" ${earned ? 'checked' : ''}> Earned</label></p>` +
    `<p class="official">“${esc(t.description)}” — official description</p>` +
    `<h3>Guide</h3><p class="guide-text">${esc(t.guide)}</p>` +
    `<h3>Sources</h3><ul class="sources">${sources}</ul>` +
    `<h3>Your note</h3><textarea id="detailNote" aria-label="Your note for this trophy" placeholder="Where it is, what worked, what to try next…">${esc(state.notes[t.name] ?? '')}</textarea>` +
    `<p class="note-hint">Notes are saved in this browser with your progress.</p>`;
  $('detailEarned').addEventListener('change', () => {
    toggleEarned(state, t.name, names);
    save();
    render();
  });
  $('detailNote').addEventListener('input', (e) => {
    setNote(state, t.name, e.target.value);
    save();
  });
}

function renderRoadmap() {
  els.roadmapFacts.replaceChildren();
  for (const f of ROADMAP_FACTS) {
    const div = document.createElement('div');
    div.className = 'fact';
    div.innerHTML = `<div class="fact-label">${esc(f.label)}</div><div class="fact-value">${esc(f.value)}</div>`;
    els.roadmapFacts.append(div);
  }
  els.roadmapStages.replaceChildren();
  for (const s of ROADMAP_STAGES) {
    const p = stageProgress(trophies, state.earned, s.stage);
    const li = document.createElement('li');
    li.className = 'stage-card';
    const items = trophiesInStage(trophies, s.stage)
      .map((t) => `<li class="${state.earned.has(t.name) ? 'is-earned' : ''}">${esc(t.name)} <span class="trophy-grade">· ${esc(gradeLabel(t))}</span></li>`)
      .join('');
    li.innerHTML =
      `<h2>${esc(s.title)}</h2>` +
      `<p class="stage-hours">${esc(s.hours)}</p>` +
      `<p>${esc(s.blurb)}</p>` +
      `<p class="stage-progress">${p.done} of ${p.total} trophies in this stage earned (${p.percent}%)</p>` +
      `<ul class="stage-trophies">${items}</ul>`;
    els.roadmapStages.append(li);
  }
}

function renderMissables() {
  const m = trophies.find((t) => t.missable);
  els.missableHero.innerHTML =
    `<h2>${esc(m.name)} — the one trophy that may be missable</h2>` +
    `<p>${esc(m.description)}</p>` +
    `<p>${esc(m.guide)}</p>` +
    `<p>Sources: ${m.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(' · ')}</p>`;
}

function selectTrophy(id) {
  selectedId = id;
  showView('checklist');
  render();
}

function showView(view) {
  for (const btn of document.querySelectorAll('.view-tab')) {
    btn.classList.toggle('is-active', btn.dataset.view === view);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.classList.toggle('is-active', section.id === `view-${view}`);
  }
}

function render() {
  renderHeader();
  renderNextUp();
  renderChips();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

for (const btn of document.querySelectorAll('.view-tab')) {
  btn.addEventListener('click', () => showView(btn.dataset.view));
}
els.searchBox.value = query;
els.searchBox.addEventListener('input', (e) => { query = e.target.value; renderList(); });
els.spoilerToggle.checked = settings.spoilersOn;
els.spoilerToggle.addEventListener('change', (e) => {
  settings.spoilersOn = e.target.checked;
  save();
  render();
});
els.earnedOnly.addEventListener('change', (e) => { earnedOnly = e.target.checked; renderList(); });
els.exportBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exportState(state)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
els.importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    state = importState(await file.text(), names);
    save();
    render();
  } catch (err) {
    alert(err.message);
  }
  e.target.value = '';
});
els.resetBtn.addEventListener('click', () => {
  if (!confirm('Clear all earned trophies and notes?')) return;
  state = createState();
  save();
  render();
});

showView(initialView);
render();
