/* Checks the Guilt of the Grave World console's references into its Foundry
   module — journal entries and pages, scenes and their Paizo maps, macros
   (the sixteen graves included), playlist sounds, NPC, foe, loot, and
   tracker actors, and effect items — against a real install of it.

     npm install classic-level
     node check-grave-world.mjs /path/to/modules/sf2e-guilt-of-the-grave-world

   The pack is copied to a temporary directory before it's opened, because
   opening a LevelDB writes lock and log files into it.

   It also lists anything the module's chapter journals link to — an actor, a
   sound, a macro — that the console doesn't, which is how a module update
   that adds content shows up. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ClassicLevel } from "classic-level";

const here = path.dirname(fileURLToPath(import.meta.url));
const macroPath = path.join(here, "../../macros/guilt-of-the-grave-world/grave-world-console.js");
const modulePath = process.argv[2];
if (!modulePath) {
  console.error("usage: node check-grave-world.mjs /path/to/modules/sf2e-guilt-of-the-grave-world");
  process.exit(2);
}
const packDir = path.join(modulePath, "packs/adventures");
if (!fs.existsSync(packDir)) {
  console.error(`No pack at ${packDir}. Point this at the module directory itself.`);
  process.exit(2);
}
const copy = fs.mkdtempSync(path.join(os.tmpdir(), "ggw-pack-"));
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
const ctx = {};
new Function("ctx", body + `\nObject.assign(ctx,{MODULE,JOURNALS,pageRef,SCENES,MOD_MACROS,GRAVE_MACROS,AUDIO,NPCS,SHOWS,LOOT,TRACKERS,EFFECTS,FOES,LINKS,CARDS,AWARDS});`)(ctx);
const C = ctx; let bad = 0; const fail = m => { console.log("FAIL", m); bad++; };

const J = new Map(adv.journal.map(j => [j._id, j]));
for (const [k, j] of Object.entries(C.JOURNALS)) { const e = J.get(j.id); if (!e) fail(`journal ${k}`); else if (e.name !== j.name) fail(`journal ${k} name ${e.name}`); }
const pageOk = (ref, what) => {
  const { j, id } = C.pageRef(ref);
  if (!C.JOURNALS[j]) return fail(`${what}: no journal "${j}"`);
  if (!J.get(C.JOURNALS[j].id)?.pages.find(p => p._id === id)) fail(`${what}: page ${ref}`);
};
const sc = new Map(adv.scenes.map(s => [s._id, s]));
const norm = (n) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/’/g, "'").replace(/^Paizo /, "").replace(/^[A-F]\. /, "");
for (const [k, s] of Object.entries(C.SCENES)) {
  if (sc.get(s.id)?.name !== s.name) fail(`scene ${k} -> ${sc.get(s.id)?.name}`);
  if (s.orig && norm(sc.get(s.orig)?.name ?? "?") !== norm(s.name)) fail(`orig scene ${k} -> ${sc.get(s.orig)?.name}`);
}
const mac = new Map(adv.macros.map(m => [m._id, m]));
for (const [k, m] of Object.entries(C.MOD_MACROS)) if (mac.get(m.id)?.name !== m.name) fail(`macro ${k} -> ${mac.get(m.id)?.name}`);
C.GRAVE_MACROS.forEach((id, i) => { if (mac.get(id)?.name !== `Dig Grave ${i + 1}`) fail(`grave ${i + 1} -> ${mac.get(id)?.name}`); });
const covered = new Set([...Object.values(C.MOD_MACROS).map(m => m.id), ...C.GRAVE_MACROS]);
for (const m of adv.macros) if (!covered.has(m._id)) console.log("  macro not in the console:", m.name);
const pls = new Map(adv.playlists.map(p => [p._id, p]));
for (const a of C.AUDIO) if (pls.get(a.pl)?.sounds.find(s => s._id === a.s)?.name !== a.name) fail(`sound ${a.name}`);
if (C.AUDIO.length !== adv.playlists.reduce((n, p) => n + p.sounds.length, 0)) fail("not every sound covered");
const act = new Map(adv.actors.map(a => [a._id, a]));
for (const [n, d] of Object.entries(C.NPCS)) { if (d.id && !act.get(d.id)) fail(`npc ${n}`); if (d.art) pageOk(d.art, `art ${n}`); }
for (const [k, x] of Object.entries(C.SHOWS)) pageOk(x.page, `show ${k}`);
for (const [n, id] of Object.entries(C.LOOT)) if (act.get(id)?.type !== "loot" || !n.startsWith(act.get(id).name)) fail(`loot ${n} -> ${act.get(id)?.name}`);
for (const [k, x] of Object.entries(C.TRACKERS)) if (act.get(x.id)?.name !== x.name) fail(`tracker ${k}`);
for (const [k, list] of Object.entries(C.FOES)) for (const f of list) {
  const a = act.get(f.id);
  if (a?.name !== f.name) { fail(`foe ${k}: ${f.name} -> ${a?.name}`); continue; }
  if (f.kind !== "ship" && a.system?.details?.level?.value !== f.level) fail(`foe ${k}: ${f.name} level ${a.system?.details?.level?.value}, console says ${f.level}`);
  if (a.type === "hazard" && (!!a.system?.details?.isComplex) !== (f.kind === "complex")) fail(`foe ${k}: ${f.name} complexity`);
}
const it = new Map(adv.items.map(i => [i._id, i]));
for (const [k, e] of Object.entries(C.EFFECTS)) if (it.get(e.id)?.name !== e.name) fail(`effect ${k}`);

const cardKeys = new Set(C.CARDS.map(c => c.key));
for (const [k, L] of Object.entries(C.LINKS)) {
  if (!cardKeys.has(k)) fail(`LINKS ${k} is no card`);
  (L.pages ?? []).forEach(ref => pageOk(ref, k));
  if (L.scene && !C.SCENES[L.scene]) fail(`${k} scene`);
  (L.audio ?? []).forEach(n => { if (!C.AUDIO.find(a => a.name === n)) fail(`${k} audio ${n}`); });
  (L.macros ?? []).forEach(m => { if (!C.MOD_MACROS[m]) fail(`${k} macro ${m}`); });
  (L.npcs ?? []).forEach(n => { if (!C.NPCS[n]) fail(`${k} npc ${n}`); });
  (L.loot ?? []).forEach(n => { if (!C.LOOT[n]) fail(`${k} loot ${n}`); });
  (L.effects ?? []).forEach(n => { if (!C.EFFECTS[n]) fail(`${k} effect ${n}`); });
  (L.shows ?? []).forEach(n => { if (!C.SHOWS[n]) fail(`${k} show ${n}`); });
  (L.trackers ?? []).forEach(n => { if (!C.TRACKERS[n]) fail(`${k} tracker ${n}`); });
}
for (const k of cardKeys) if (!C.LINKS[k]) console.log("  no LINKS for card", k);
for (const c of C.CARDS) {
  if (c.foes && !C.FOES[c.foes]) fail(`card ${c.key} foes ${c.foes}`);
  (c.xp ?? []).forEach(x => { if (!C.AWARDS.find(a => a.key === x)) fail(`card ${c.key} award ${x}`); });
}
for (const a of C.AWARDS) {
  if (a.foes && !C.FOES[a.foes]) fail(`award ${a.key} foes`);
  if (!C.CARDS.some(c => (c.xp ?? []).includes(a.key))) console.log("  award on no card:", a.key);
}

/* What the chapter journals link to that the console doesn't. */
const known = new Set([...Object.values(C.NPCS).map(n => n.id), ...Object.values(C.LOOT), ...Object.values(C.TRACKERS).map(x => x.id),
  ...Object.values(C.FOES).flat().map(f => f.id)]);
for (const j of adv.journal.filter(j => /^pzo240060[2-6]/.test(j._id))) for (const p of j.pages) {
  for (const m of (p.text?.content ?? "").matchAll(/@UUID\[Actor\.(\w+)\]/g)) {
    if (!known.has(m[1])) console.log(`  ${p.name}: links actor ${m[1]} (${act.get(m[1])?.name ?? "not in the pack"})`);
  }
}

console.log(bad ? `\n${bad} problem(s).` : "\nEvery reference resolves.");
process.exit(bad ? 1 : 0);
