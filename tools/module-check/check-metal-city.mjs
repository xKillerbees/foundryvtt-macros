/* Checks the Murder in Metal City console's references into its Foundry
   module — journal entries and pages, handouts, scenes, macros, playlist
   sounds, actors, and effect items — against a real install of it.

     npm install classic-level
     node check-metal-city.mjs /path/to/modules/sf2e-murder-in-metal-city

   The pack is copied to a temporary directory before it's opened, because
   opening a LevelDB writes lock and log files into it.

   It also lists anything the module's own journal links to — an actor, a
   sound, a macro, a scene, an effect — that the console doesn't, which is
   how a module update that adds content shows up. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ClassicLevel } from "classic-level";

const here = path.dirname(fileURLToPath(import.meta.url));
const macroPath = path.join(here, "../../macros/murder-in-metal-city/metal-city-console.js");
const modulePath = process.argv[2];
if (!modulePath) {
  console.error("usage: node check-metal-city.mjs /path/to/modules/sf2e-murder-in-metal-city");
  process.exit(2);
}
const packDir = path.join(modulePath, "packs/adventures");
if (!fs.existsSync(packDir)) {
  console.error(`No pack at ${packDir}. Point this at the module directory itself.`);
  process.exit(2);
}
const copy = fs.mkdtempSync(path.join(os.tmpdir(), "mmc-pack-"));
fs.cpSync(packDir, copy, { recursive: true });
const db = new ClassicLevel(copy, { valueEncoding: "json" });
let adv;
for await (const [, value] of db.iterator()) adv = value;
await db.close();
fs.rmSync(copy, { recursive: true, force: true });

const src = fs.readFileSync(macroPath, "utf8");
/* The tables, evaluated out of the macro source: everything above its state
   section is plain data with no calls into Foundry. */
const cut = src.indexOf("/* ------------------------------------------------------------------ state */");
const body = src.slice(0, cut).replace(/^const /gm, "var ");
const ctx = {}; new Function("ctx", body + `\nObject.assign(ctx,{MODULE,JOURNALS,PAGE_PREFIX,entryForPage,SCENES,MOD_MACROS,AUDIO,ACTOR_IDS,NPCS,LOOT,EFFECTS,HANDOUTS,LINKS,CARDS,FOES});`)(ctx);
const C = ctx; let bad = 0; const fail = m => { console.log("FAIL", m); bad++; };
const J = new Map(adv.journal.map(j => [j._id, j]));
for (const [k, j] of Object.entries(C.JOURNALS)) { const e = J.get(j.id); if (!e) fail(`journal ${k}`); else if (e.name !== j.name) fail(`journal ${k} name ${e.name}`); }
const pageOk = (id, what) => { const e = J.get(C.entryForPage(id)); if (!e?.pages.find(p => p._id === id)) fail(`${what}: page ${id}`); };
const sc = new Map(adv.scenes.map(s => [s._id, s]));
for (const [k, s] of Object.entries(C.SCENES)) { if (sc.get(s.id)?.name !== s.name) fail(`scene ${k} ${sc.get(s.id)?.name}`); if (s.orig && sc.get(s.orig)?.name !== s.name) fail(`orig scene ${k}`); }
const mac = new Map(adv.macros.map(m => [m._id, m]));
for (const [k, m] of Object.entries(C.MOD_MACROS)) if (mac.get(m.id)?.name !== m.name) fail(`macro ${k}`);
const pls = new Map(adv.playlists.map(p => [p._id, p]));
for (const a of C.AUDIO) if (pls.get(a.pl)?.sounds.find(s => s._id === a.s)?.name !== a.name) fail(`sound ${a.name}`);
if (C.AUDIO.length !== adv.playlists.reduce((n, p) => n + p.sounds.length, 0)) fail("not every sound covered");
const act = new Map(adv.actors.map(a => [a._id, a]));
for (const [n, id] of Object.entries(C.ACTOR_IDS)) if (act.get(id)?.name !== n) fail(`actor ${n} -> ${act.get(id)?.name}`);
for (const [n, d] of Object.entries(C.NPCS)) { if (d.id && !act.get(d.id)) fail(`npc ${n}`); if (d.art) pageOk(d.art, `art ${n}`); }
for (const [n, id] of Object.entries(C.LOOT)) if (act.get(id)?.name !== n) fail(`loot ${n} -> ${act.get(id)?.name}`);
const it = new Map(adv.items.map(i => [i._id, i]));
for (const [k, e] of Object.entries(C.EFFECTS)) if (it.get(e.id)?.name !== e.name) fail(`effect ${k}`);
for (const [n, name, , pid] of C.HANDOUTS) { const p = J.get(C.entryForPage(pid))?.pages.find(p => p._id === pid); if (!p?.name.startsWith(`#${n}:`)) fail(`handout ${n} -> ${p?.name}`); }
const cardKeys = new Set(C.CARDS.map(c => c.key));
for (const [k, L] of Object.entries(C.LINKS)) {
  if (!cardKeys.has(k)) fail(`LINKS ${k} is no card`);
  (L.pages ?? []).forEach(id => pageOk(id, k));
  if (L.scene && !C.SCENES[L.scene]) fail(`${k} scene`);
  (L.audio ?? []).forEach(n => { if (!C.AUDIO.find(a => a.name === n)) fail(`${k} audio ${n}`); });
  if (L.macro && !C.MOD_MACROS[L.macro]) fail(`${k} macro`);
  (L.npcs ?? []).forEach(n => { if (!C.NPCS[n]) fail(`${k} npc ${n}`); });
  (L.loot ?? []).forEach(n => { if (!C.LOOT[n]) fail(`${k} loot ${n}`); });
  (L.effects ?? []).forEach(n => { if (!C.EFFECTS[n]) fail(`${k} effect ${n}`); });
  (L.handouts ?? []).forEach(n => { if (!C.HANDOUTS.find(h => h[0] === n)) fail(`${k} handout ${n}`); });
}
for (const k of cardKeys) if (!C.LINKS[k]) console.log("  no LINKS for card", k);
for (const list of Object.values(C.FOES)) for (const f of list) if (!C.ACTOR_IDS[f.name]) fail(`foe ${f.name} has no id`);
const linked = new Set(Object.values(C.LINKS).flatMap(L => L.handouts ?? []));
for (const [n] of C.HANDOUTS) if (!linked.has(n)) console.log("  handout not on any card:", n);
// every module @UUID link from chapter pages to Actor/Playlist/Macro/Scene/Item: is it covered?
const covered = new Set([...Object.values(C.ACTOR_IDS), ...Object.values(C.NPCS).map(n => n.id), ...Object.values(C.LOOT),
  ...C.AUDIO.map(a => a.s), ...Object.values(C.MOD_MACROS).map(m => m.id), ...Object.values(C.SCENES).flatMap(s => [s.id, s.orig]), ...Object.values(C.EFFECTS).map(e => e.id)]);
for (const j of adv.journal) for (const p of j.pages) for (const m of (p.text?.content ?? "").matchAll(/@UUID\[(?:Actor|Item|Macro|Scene|Playlist\.\w+\.PlaylistSound)\.(\w+)\]/g))
  if (!covered.has(m[1])) console.log("  journal links but console doesn't:", p.name, m[0]);
console.log(bad ? `${bad} failures` : "all module references resolve");
process.exit(bad ? 1 : 0);
