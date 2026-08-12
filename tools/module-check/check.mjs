/* Checks the macros' references into the Season of Ghosts Foundry module —
   journal entries, journal pages, and playlist sounds — against a real
   install of it.

   The macros link to documents by id, and name playlist sounds exactly. Ids
   are stable — a Foundry adventure import preserves them — but they were
   transcribed, and a transcription can rot. This reads the module's own
   compendium pack and reports anything that no longer exists.

     npm install classic-level
     node check.mjs /path/to/modules/pf2e-season-of-ghosts

   Nothing in the repository depends on this. It is a check you run when you
   change the tables, not part of building or using a macro. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ClassicLevel } from "classic-level";

const here = path.dirname(fileURLToPath(import.meta.url));
const MACRO = path.join(here, "../../macros/season-of-ghosts/campaign-status-tracker.js");

const modulePath = process.argv[2];
if (!modulePath) {
  console.error("usage: node check.mjs /path/to/modules/pf2e-season-of-ghosts");
  process.exit(2);
}

/* ---- the module's adventure pack ---- */
const packDir = path.join(modulePath, "packs/adventures");
if (!fs.existsSync(packDir)) {
  console.error(`No pack at ${packDir}. Point this at the module directory itself.`);
  process.exit(2);
}
const db = new ClassicLevel(packDir, { valueEncoding: "json" });
let adventure;
for await (const [, value] of db.iterator()) adventure = value;
await db.close();

const entries = new Map();
const pages = new Map();
const playlists = new Map();
for (const j of adventure?.journal ?? []) {
  entries.set(j._id, j);
  for (const p of j.pages ?? []) pages.set(p._id, { entry: j._id, entryName: j.name, name: p.name });
}
for (const pl of adventure?.playlists ?? []) {
  playlists.set(pl._id, { name: pl.name, sounds: new Set((pl.sounds ?? []).map(x => x.name)) });
}

/* ---- the tracker's tables ----
   Pulled out of the macro source rather than imported, because the macro is a
   Foundry script, not a module: it has no exports and calls `game` on load. */
const src = fs.readFileSync(MACRO, "utf8");
const table = (name, open, close) => {
  const m = src.match(new RegExp(`const ${name} = (\\${open}[\\s\\S]*?\\n\\${close});`));
  if (!m) throw new Error(`${name} not found in ${path.basename(MACRO)}`);
  return eval(`(${m[1]})`);
};
const JOURNAL = table("JOURNAL", "{", "}");
const BY_ORD = table("JOURNAL_BY_ORD", "{", "}");
const PAGES = table("PAGES", "{", "}");
const LOOT_PAGES = table("LOOT_PAGES", "{", "}");
const CHAPTERS = table("CHAPTERS", "[", "]");
const LOOT = table("LOOT", "{", "}");

/* ---- checks ---- */
let failures = 0;
const fail = (msg) => { console.log(`  FAIL  ${msg}`); failures++; };

const checkEntry = (d, what) => {
  const e = entries.get(d.id);
  if (!e) return fail(`${what}: no entry with id ${d.id}`);
  if (e.name !== d.name) fail(`${what}: name "${d.name}" but the module says "${e.name}"`);
};
for (const [n, d] of Object.entries(JOURNAL.chapters)) checkEntry(d, `chapter ${n}`);
for (const d of JOURNAL.reference) checkEntry(d, `reference "${d.name}"`);

for (const [ord, id] of Object.entries(BY_ORD)) {
  if (!entries.has(id)) fail(`ordinal ${ord}: no entry with id ${id}`);
  else if (id.slice(8, 10) !== ord) fail(`ordinal ${ord} maps to ${id}, whose own ordinal differs`);
}

const itemKeys = new Set();
for (const c of CHAPTERS) for (const i of c.items) itemKeys.add(`${c.n}.${i.key}`);
const lootKeys = new Set();
for (const [n, list] of Object.entries(LOOT)) for (const i of list) lootKeys.add(`${n}.${i.key}`);

const checkPages = (map, keys, what) => {
  for (const [key, pageId] of Object.entries(map)) {
    if (!keys.has(key)) fail(`${what} ${key}: no such entry in the tracker`);
    const p = pages.get(pageId);
    if (!p) { fail(`${what} ${key}: no page with id ${pageId}`); continue; }
    if (BY_ORD[pageId.slice(0, 2)] !== p.entry) {
      fail(`${what} ${key}: ${pageId} starts "${pageId.slice(0, 2)}" but lives in ${p.entryName}`);
    }
  }
};
checkPages(PAGES, itemKeys, "item");
checkPages(LOOT_PAGES, lootKeys, "loot");

/* ---- coverage, which is information rather than a failure ---- */
const AREA_RE = /(?:^|[\s(])([A-E]\d{1,2}[a-d]?)(?=[\s),.:—→]|$)/;
let itemsLinked = 0;
const unlinked = [];
for (const c of CHAPTERS) for (const i of c.items) {
  const key = `${c.n}.${i.key}`;
  if (PAGES[key] || AREA_RE.test(i.label ?? "")) itemsLinked++;
  else unlinked.push(key);
}
let lootLinked = 0;
for (const [n, list] of Object.entries(LOOT)) for (const i of list) {
  if (LOOT_PAGES[`${n}.${i.key}`] || AREA_RE.test(i.where ?? "")) lootLinked++;
}

/* ---- the other consoles ----
   They link into the same adventure but hold far less: one or two entry ids
   and a handful of page ids each, with no table to cross-check. Scanning the
   source for anything shaped like a module id catches a stale one without
   needing to know how each macro is laid out. */
const OTHERS = ["fall-downtime-tracker", "first-long-night-console",
                "enlightened-path-console", "ruins-of-wisdom-console"];
for (const name of OTHERS) {
  const file = path.join(here, `../../macros/season-of-ghosts/${name}.js`);
  if (!fs.existsSync(file)) { fail(`${name}: not found`); continue; }
  const text = fs.readFileSync(file, "utf8");
  const entryIds = new Set([...text.matchAll(/"(pf2apsog\d\d\w+)"/g)].map(m => m[1]));
  const pageIds = new Set([...text.matchAll(/"(\d\d[a-z0-9]{14})"/g)].map(m => m[1]));
  for (const id of entryIds) if (!entries.has(id)) fail(`${name}: no entry with id ${id}`);
  for (const id of pageIds) if (!pages.has(id)) fail(`${name}: no page with id ${id}`);
  console.log(`${name}: ${entryIds.size} entr${entryIds.size === 1 ? "y" : "ies"}, ${pageIds.size} pages`);
}

/* ---- playlist sounds ----
   Every sound the tracker offers a play button for has to exist, in the
   playlist the tracker thinks it's in. `act.*` rows resolve against each act
   they claim, which is the whole point of pinning them down. */
const PLAYLISTS = table("PLAYLISTS", "{", "}");
const AUDIO = table("AUDIO", "{", "}");
const ACT_OF = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 3, 9: 3, 10: 3, 11: 4, 12: 4, 13: 4 };
const playlistId = (ref, act) => {
  const [group, kind] = String(ref).split(".");
  if (!kind) return PLAYLISTS[group];
  return (group === "act" ? PLAYLISTS[`a${act}`] : PLAYLISTS[group])?.[kind];
};
let soundsOk = 0;
const checkSounds = (ref, names, act, where) => {
  const pl = playlists.get(playlistId(ref, act));
  if (!pl) return fail(`${where}: no playlist for ${ref} in act ${act}`);
  for (const n of names) {
    if (pl.sounds.has(n)) soundsOk++;
    else fail(`${where}: "${n}" is not in ${pl.name} (${ref}, act ${act})`);
  }
};
for (const a of AUDIO.always) for (const act of a.acts ?? [1, 2, 3, 4]) {
  checkSounds(a.pl, a.sounds, act, "always");
}
for (const [ch, rows] of Object.entries(AUDIO.chapters)) {
  for (const a of rows) checkSounds(a.pl, a.sounds, ACT_OF[ch], `chapter ${ch}`);
}
for (const [ch, tracks] of Object.entries(AUDIO.track)) {
  checkSounds("looped", tracks, ACT_OF[ch], `track ${ch}`);
}
checkSounds("looped", [AUDIO.theme], 1, "theme");

console.log(`\n${entries.size} entries, ${pages.size} pages and ${playlists.size} playlists in ${adventure?.name ?? "the pack"}`);
console.log(`sounds ${soundsOk} references resolve`);
console.log(`items  ${itemsLinked}/${itemKeys.size} linked`);
console.log(`loot   ${lootLinked}/${lootKeys.size} linked`);
if (unlinked.length) console.log(`\nno page (expected for Two Weavers beats, which aren't in the book):\n  ${unlinked.join(", ")}`);
console.log(failures ? `\n${failures} failure${failures === 1 ? "" : "s"}.` : "\nAll ids resolve.");
process.exit(failures ? 1 : 0);
