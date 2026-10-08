/* Checks the Waffle House Isekai console's references into the Snowy's Maps
   Waffle House Isekai PF2e module — its journal and pages, the map, the three
   playlists, the Chef, the Clog and the oozes, the two items, and the five
   task abilities on the Chef's sheet — against a real install of it.

     npm install classic-level
     node check-waffle-house.mjs /path/to/modules/snowys-maps-waffle-house-isekai-pf2e

   The pack is copied to a temporary directory before it's opened, because
   opening a LevelDB writes lock and log files into it.

   It also lists anything the module's journal links to that the console
   doesn't, which is how a module update that adds content shows up. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ClassicLevel } from "classic-level";

const here = path.dirname(fileURLToPath(import.meta.url));
const macroPath = path.join(here, "../../macros/waffle-house-isekai/waffle-house-console.js");
const modulePath = process.argv[2];
if (!modulePath) {
  console.error("usage: node check-waffle-house.mjs /path/to/modules/snowys-maps-waffle-house-isekai-pf2e");
  process.exit(2);
}
const packDir = path.join(modulePath, "packs/snowys-maps-waffle-house-isekai-pf2e");
if (!fs.existsSync(packDir)) {
  console.error(`No pack at ${packDir}. Point this at the module directory itself.`);
  process.exit(2);
}
const copy = fs.mkdtempSync(path.join(os.tmpdir(), "whi-pack-"));
fs.cpSync(packDir, copy, { recursive: true });
fs.rmSync(path.join(copy, "LOCK"), { force: true });
const db = new ClassicLevel(copy, { valueEncoding: "json" });
let adv;
for await (const [, value] of db.iterator()) adv = value;
await db.close();
fs.rmSync(copy, { recursive: true, force: true });

/* The tables, evaluated out of the macro source: everything above its state
   section is plain data with no calls into Foundry. */
const src = fs.readFileSync(macroPath, "utf8");
const cut = src.indexOf("/* ------------------------------------------------------------------ state */");
const body = src.slice(0, cut).replace(/^const /gm, "var ");
const C = {};
new Function("ctx", body + `\nObject.assign(ctx,{MODULE,JOURNAL,PAGES,SCENE,FOES,ITEMS,MUSIC,TASKS,ALWAYS});`)(C);

let bad = 0;
const fail = (m) => { console.log("FAIL", m); bad++; };
const ok = (m) => console.log("  ok", m);

const journal = adv.journal.find(j => j._id === C.JOURNAL);
if (!journal) fail(`journal ${C.JOURNAL}`);
else {
  ok(`journal ${journal.name}`);
  for (const [k, id] of Object.entries(C.PAGES)) {
    const p = journal.pages.find(x => x._id === id);
    if (!p) fail(`page ${k} (${id})`); else ok(`page ${k} → ${p.name}`);
  }
}

const scene = adv.scenes.find(s => s._id === C.SCENE.id);
if (!scene) fail(`scene ${C.SCENE.id}`);
else if (scene.name !== C.SCENE.name) fail(`scene name "${scene.name}", console says "${C.SCENE.name}"`);
else ok(`scene ${scene.name}`);

for (const [k, cue] of Object.entries(C.MUSIC)) {
  const pl = adv.playlists.find(p => p._id === cue.pl);
  const s = pl?.sounds.find(x => x._id === cue.s);
  if (!pl) fail(`playlist ${k} (${cue.pl})`);
  else if (!s) fail(`sound ${k} (${cue.s}) in ${pl.name}`);
  else if (!s.name.startsWith(cue.name)) fail(`sound ${k} is "${s.name}", console says "${cue.name}"`);
  else ok(`music ${k} → ${pl.name} / ${s.name}`);
}

for (const [k, foe] of Object.entries(C.FOES)) {
  const a = adv.actors.find(x => x._id === foe.id);
  if (!a) { fail(`actor ${k} (${foe.id})`); continue; }
  const lvl = a.system?.details?.level?.value;
  if (a.name !== foe.name) fail(`actor ${k} is "${a.name}", console says "${foe.name}"`);
  else if (lvl !== foe.level) fail(`actor ${k} is level ${lvl}, console says ${foe.level}`);
  else ok(`actor ${a.name}, level ${lvl}`);
  /* The Clog and the oozes are what "Hide them in the stalls" looks for. */
  const placed = (scene?.tokens ?? []).filter(t => t.actorId === foe.id).length;
  if (placed) ok(`  ${placed} token${placed > 1 ? "s" : ""} on the map`);
}

const chef = adv.actors.find(x => x._id === C.FOES.chef.id);
for (const name of [...C.TASKS.map(t => t.item), ...C.ALWAYS]) {
  if (!chef?.items.find(i => i.name === name)) fail(`Chef ability "${name}"`); else ok(`Chef has ${name}`);
}

for (const [k, def] of Object.entries(C.ITEMS)) {
  const i = adv.items.find(x => x._id === def.id);
  if (!i) fail(`item ${k} (${def.id})`);
  else if (i.name !== def.name) fail(`item ${k} is "${i.name}", console says "${def.name}"`);
  else ok(`item ${i.name}`);
}

/* Anything the journal links to that the console never names. */
const named = new Set([
  ...Object.values(C.FOES).map(f => f.id), ...Object.values(C.ITEMS).map(i => i.id),
  ...Object.values(C.MUSIC).map(m => m.pl)
]);
const linked = new Set();
for (const p of journal?.pages ?? []) {
  for (const m of (p.text?.content ?? "").matchAll(/@UUID\[(\w+)\.(\w+)\]/g)) linked.add(`${m[1]}.${m[2]}`);
}
const missing = [...linked].filter(l => !named.has(l.split(".")[1]));
if (missing.length) console.log("\nThe journal links to these, and the console doesn't:\n  " + missing.join("\n  "));

console.log(bad ? `\n${bad} problem${bad > 1 ? "s" : ""}.` : "\nEverything resolves.");
process.exit(bad ? 1 : 0);
