# Module reference check

The macros reach into the [Season of Ghosts Foundry module](https://paizo.com/): journal
entries and pages by document id, and playlist sounds by exact name. Ids are stable — a
Foundry adventure import preserves them — but everything here was transcribed from the module,
and a transcription can rot when the module updates.

This script reads the module's own compendium pack and reports anything that no longer
resolves.

```bash
npm install classic-level
node check.mjs ~/Documents/modules/pf2e-season-of-ghosts
```

It exits non-zero on the first kind of problem worth acting on:

- a chapter or reference entry id that isn't in the pack, or whose name has changed
- a page id in `PAGES` or `LOOT_PAGES` that isn't in the pack
- a page id whose leading ordinal doesn't match the entry it actually lives in
- a table key that doesn't correspond to any item or loot row in the tracker
- a playlist sound the tracker offers a play button for that isn't in the playlist it names,
  checked against every act an `act.*` row claims

It also prints coverage. Items with no page are expected — the Two Weavers rework beats are
invented, so there is nothing in the book to point at.

Nothing else in the repository depends on this. `classic-level` is installed here and only
here; the macros themselves stay dependency-free, and `tools/preview/` needs nothing but a
browser.
