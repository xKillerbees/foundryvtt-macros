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

## Murder in Metal City

`check-metal-city.mjs` does the same for the Metal City console, against the
`sf2e-murder-in-metal-city` module:

```bash
node check-metal-city.mjs ~/Documents/sf2e/sf2e-murder-in-metal-city
```

It checks every journal entry, page, handout, scene (and its *Original Maps* twin), macro,
playlist sound, actor, and effect item the console names. It checks that each `LINKS` entry
belongs to a real card and points only at things in those tables. It also checks that every
`FOES` creature has a module actor id. It then lists anything the module's own journal links
to that the console doesn't, which is how new content in a module update shows up. The pack
is copied to a temporary directory before it's opened, so the module's own files are never
touched.

## Guilt of the Grave World

`check-grave-world.mjs` does the same for the Grave World console, against the
`sf2e-guilt-of-the-grave-world` module:

```bash
node check-grave-world.mjs ~/Documents/sf2e/sf2e-guilt-of-the-grave-world
```

Page ids in this module are only unique inside their journal, so pages are checked in the
journal the console names. The script checks every journal, page, and Art Gallery piece.
It checks every scene and its Paizo map, every macro (including all sixteen *Dig Grave*
macros, in order), every playlist sound, and every NPC, foe, loot, and tracker actor. It
checks each foe's level and hazard complexity against the console, and the effect items. It
lists any module macro the console doesn't offer, and any actor a chapter journal links to
that the console doesn't know.
