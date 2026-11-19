# Leonida Ledger — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand
Theft Auto VI, built for the make.fun bounty `gta6-trophy-guide-01`.

## What it is

- **Checklist of the official 55** — every trophy with its official name,
  description and grade, a checkbox that saves to `localStorage`, a progress
  ring, and a per-trophy note field.
- **A guide for every trophy, in our own words, with its sources named
  beside it.** Steps come from the published guides (PowerPyx, 18 Nov 2026)
  and the official list (Exophase / PSNProfiles). Where no steps have been
  verified in the game yet — five trophies at launch — the guide says so
  plainly instead of inventing them.
- **Roadmap to the platinum** in three stages (story, 100% checklist,
  strangers & cleanup), with PowerPyx's estimates: difficulty 4/10, about
  200 hours, one playthrough, no online trophies.
- **Missables page** — the one trophy that may be missable (Positive Mental
  Attitude, the Chapter 1 meditation) with the exact moment it can be lost,
  plus the honest note that everything else is safe.
- **Filters by kind** (story, missable, collectibles, activities, side
  quests, robberies, money, odd jobs, platinum, online — the online filter
  shows an empty state, because GTA VI has no online trophies), search,
  earned-only, and a **spoiler setting** that hides the names and
  descriptions of unearned story trophies.
- **Export / import** of progress as JSON, and a **Next up** suggestion that
  picks the earliest unearned trophy in roadmap order.
- **100% offline** — every file the page loads sits under `app/`, system
  fonts only, no network requests at run time, no Rockstar artwork.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

Preview flags for screenshots and demos: `?demo=1` seeds 13 earned
trophies, `?view=roadmap` / `?view=missables` opens a section,
`?open=<trophy id>` opens a trophy's guide, `?spoiler=1` turns the spoiler
setting on, `?kind=story` filters the list.

## Tests

```sh
node --test tests/trophies.test.mjs tests/tracker.test.mjs tests/filters.test.mjs
```

28 tests: the trophy data against the official list (55 names, grade split
1/2/6/46, every guide non-blank and sourced, PSN targets, 28 hidden, one
missable, roadmap stages), plus tracker state and filter/spoiler/next-up
logic.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## License

MIT — see LICENSE.
