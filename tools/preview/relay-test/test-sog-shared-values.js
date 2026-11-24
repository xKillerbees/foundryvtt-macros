"use strict";
/* Regression test: the Season of Ghosts campaign tracker and the chapter
   consoles share ONE value for every item they both track.

   It loads the real macros into one process, the way a GM runs them side by
   side in one Foundry client, against a settings stub that behaves like
   Foundry's (JSON storage, a fresh copy per get, updateSetting fired on the
   writing client too). It guards against:

     1. A tick in the tracker not reaching the console, or the reverse.
     2. Points granted twice, or not taken back: a shared beat moves its XP and
        pool points once, from whichever side ticks it, and unticking from the
        other side takes back exactly that.
     3. A console window open on the same client going stale after the tracker
        writes its setting, then saving the old state back over the change.
     4. The Fall Downtime Tracker going stale when another console moves the
        pools from the same client.
     5. A macro run a second time keeping the first run's hook, so the new
        window never hears about changes.
     6. The one-time reconciliation of ticks the tracker held privately.

   Run from anywhere:

       node tools/preview/relay-test/test-sog-shared-values.js
 */
const path = require("path");
const { loadMacro, sleep, getGame } = require("./harness.js");

const DIR = path.resolve(__dirname, "../../../macros/season-of-ghosts");
const M = (f) => path.join(DIR, f);
const get = (key) => getGame().settings.get("world", key);

let failures = 0;
function check(label, cond, detail) {
  if (cond) console.log("  PASS  " + label + (detail ? "  [" + detail + "]" : ""));
  else { failures++; console.log("  FAIL  " + label + (detail ? "  [" + detail + "]" : "")); }
}
const app = (i) => globalThis.__apps[i];

(async () => {
  /* Boot order matches a table mid-campaign: the downtime pools exist first. */
  await loadMacro(M("fall-downtime-tracker.js"));
  const fall = app(0).tracker;
  await loadMacro(M("enlightened-path-console.js"));
  const pathC = app(1).t;
  await loadMacro(M("no-breath-to-cry-console.js"), { expose: ["CH8_EVENTS", "CH9_PIECES"] });
  const winterExports = globalThis.__macro;
  const winter = app(2).t;
  await loadMacro(M("campaign-status-tracker.js"));
  const cst = app(3).t;
  await sleep(10);

  const wrap = winterExports.CH8_EVENTS.find(c => c.key === "ch8-wrapping-up");
  const beat = (k) => wrap.beats.find(b => b.key === k);
  const pools0 = { ...get("sogFallDowntime").pools }, rep0 = { ...(get("sogFallDowntime").rep ?? {}) };

  console.log("== 1. Tracker tick reaches the winter console, with its points once ==");
  await cst.toggleFlag(8, "rescue");
  await sleep(5);
  let W = get("sogWinter"), D = get("sogFallDowntime");
  check("winter setting has the rescue beat", W.beats?.["ch8-wrapping-up"]?.["ch8-rescue-3"] === 1);
  check("winter's open window adopted it", winter.s.beats?.["ch8-wrapping-up"]?.["ch8-rescue-3"] === 1);
  check("winter XP +120", W.xp === 120, `xp ${W.xp}`);
  check("Hope +3 in the pools", D.pools.hope === pools0.hope + 3, `${pools0.hope} → ${D.pools.hope}`);
  check("Rep +1 both factions", D.rep.southbank === (rep0.southbank ?? 0) + 1 && D.rep.northridge === (rep0.northridge ?? 0) + 1);
  check("fall tracker's open window sees the new Hope", fall.state.pools.hope === pools0.hope + 3, `${fall.state.pools.hope}`);
  check("tracker reads it as done", cst.flag(8, "rescue") === true);
  check("winter log notes where it came from", /campaign tracker/.test(W.log?.[0] ?? ""), W.log?.[0]);

  console.log("== 2. The stale-window overwrite is gone ==");
  winter.setTerror(1);           // an unrelated winter action that saves the whole state
  fall.state.week = fall.state.week; await fall.save?.();
  await sleep(5);
  W = get("sogWinter"); D = get("sogFallDowntime");
  check("winter's next save keeps the rescue tick", W.beats?.["ch8-wrapping-up"]?.["ch8-rescue-3"] === 1);
  check("the fall tracker's next save keeps the Hope", D.pools.hope === pools0.hope + 3, `${D.pools.hope}`);

  console.log("== 3. Untick in the winter console — the tracker follows, points come back off ==");
  await winter.toggleBeat("ch8-wrapping-up", "ch8-rescue-3", beat("ch8-rescue-3"));
  await sleep(5);
  W = get("sogWinter"); D = get("sogFallDowntime");
  check("tracker reads it as not done", cst.flag(8, "rescue") === false);
  check("winter XP back to 0", W.xp === 0, `xp ${W.xp}`);
  check("Hope back where it was", D.pools.hope === pools0.hope, `${D.pools.hope}`);
  check("Rep back where it was", D.rep.southbank === (rep0.southbank ?? 0) && D.rep.northridge === (rep0.northridge ?? 0));

  console.log("== 4. Tick exactly one: the tracker won't stack a second rescue tier ==");
  await winter.toggleBeat("ch8-wrapping-up", "ch8-rescue-2", beat("ch8-rescue-2"));
  await cst.toggleFlag(8, "rescue");
  await sleep(5);
  check("refused while the 2-rescued tier is ticked", get("sogWinter").beats["ch8-wrapping-up"]["ch8-rescue-3"] !== 1);
  await winter.toggleBeat("ch8-wrapping-up", "ch8-rescue-2", beat("ch8-rescue-2"));

  console.log("== 5. Read-only items follow the console's numbers ==");
  winter.setInfluence("ch9-seance-chen", 4, 4);
  await sleep(5);
  check("Cao Chen at 4 ticks the tracker item", cst.flag(9, "chen") === true);
  cst.toggleFlag(9, "chen");
  await sleep(5);
  check("clicking it in the tracker changes nothing", get("sogWinter").influence["ch9-seance-chen"] === 4);
  winter.setRp("ch9", 8);
  await sleep(5);
  check("8 RP ticks the transmigration research", cst.flag(9, "transres") === true);

  console.log("== 6. Components and no-points beats, both directions ==");
  await cst.toggleFlag(9, "kiln");
  await sleep(5);
  check("tracker → winter: kiln secured", winter.s.components.kiln === true);
  winter.toggleComponent("kiln");
  await sleep(5);
  check("winter → tracker: kiln unsecured", cst.flag(9, "kiln") === false);
  await cst.toggleFlag(10, "transmigrate");
  await sleep(5);
  check("the casting and the cash-out are one value", cst.flag(10, "cashout") === true);

  console.log("== 7. Enlightened Path shrines move the console's XP too ==");
  const xp0 = get("sogEnlightenedPath").xp ?? 0;
  await cst.toggleConsoleByKey("6.bridge");
  await sleep(5);
  check("Bridge Shrine lit from the tracker awards 40 XP", get("sogEnlightenedPath").xp === xp0 + 40, `${get("sogEnlightenedPath").xp}`);
  check("the Path window adopted it", pathC.s.shrines.d1.slept === true);
  pathC.toggleCondition("d1", "slept");
  await sleep(5);
  check("unticking a condition in the console takes the 40 back", get("sogEnlightenedPath").xp === xp0);
  check("tracker sees the shrine dark", cst.flag(6, "bridge") === false);

  console.log("== 8. A second run of a macro gets the updates, not the first ==");
  await loadMacro(M("no-breath-to-cry-console.js"));
  const winter2 = globalThis.__apps[globalThis.__apps.length - 1].t;
  await cst.toggleFlag(8, "jelly");
  await sleep(5);
  check("the reopened winter window adopted the tracker's tick", winter2.s.beats?.["ch8-wrapping-up"]?.["ch8-mr-jelly"] === 1);
  check("the closed window's hook was removed", !winter.s.beats?.["ch8-wrapping-up"]?.["ch8-mr-jelly"]);

  console.log("== 9. Private tracker ticks are reconciled once, never pushed with points ==");
  const cs = get("sogCampaign");
  cs.flags = { ...(cs.flags ?? {}), "8.jelly": true, "8.journal": true };
  await getGame().settings.set("world", "sogCampaign", cs);
  globalThis.__chat.length = 0;
  const xpBefore = get("sogWinter").xp;
  await loadMacro(M("campaign-status-tracker.js"));
  await sleep(10);
  const after = get("sogCampaign");
  check("both private ticks dropped", !after.flags["8.jelly"] && !after.flags["8.journal"]);
  const note = globalThis.__chat.find(m => /share one value/.test(m.content ?? ""));
  check("the GM is told about the one the console disagrees with", !!note && /transmigration journal/.test(note.content) && !/Mr Jelly/.test(note.content));
  check("no XP moved by the reconciliation", get("sogWinter").xp === xpBefore);

  console.log(failures ? `\n${failures} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
