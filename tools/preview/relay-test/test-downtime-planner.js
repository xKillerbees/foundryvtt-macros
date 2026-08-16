"use strict";
/* Regression test for the downtime planner's player→GM relay.

   The browser preview harness can't exercise the two-client relay (its settings
   stub doesn't broadcast `updateSetting`, and one browser is one `game.user`).
   This Node harness loads the real macro against a stubbed Foundry and drives
   the relay both directions, so the two bugs it guards against stay dead:

     1. Row ids must be minted once and carried through the relay. A reducer op
        that creates a row (addRow, a setCraft drop) would otherwise roll a
        fresh id on every client, so the player's later edits keyed to that id
        never found the GM's copy and were dropped.
     2. The GM's relay handler must apply to the live state, not re-read the
        setting, so back-to-back relays see each other's changes.

   Run from anywhere:

       node tools/preview/relay-test/test-downtime-planner.js
 */
const path = require("path");
const { loadMacro, buildGame, sleep, getHooks } = require("./harness.js");

const MACRO = path.resolve(__dirname, "../../../macros/pf2e-downtime/downtime-planner.js");
const REQ_SCOPE = "world";
const REQ_KEY = "pf2eDowntimeRequest";
const EXPOSE = ["OPS", "blankState", "blankRow", "blankPeriod", "planFor", "studyFor",
  "Planner", "detectPCs", "loadState", "registerSetting", "uid", "ACTS", "HOUSE", "STUDY",
  "fmtReal", "worldDate", "stampPeriod", "newPeriod"];

let failures = 0;
function check(label, cond, detail) {
  if (cond) console.log("  PASS  " + label + (detail ? "  [" + detail + "]" : ""));
  else { failures++; console.log("  FAIL  " + label + (detail ? "  [" + detail + "]" : "")); }
}

(async () => {
  const foundry = globalThis.foundry;

  /* ============ 1. player side: id minting + reducer determinism ========== */
  console.log("== 1. Row id must be identical on both sides of the relay ==");
  let { exports: X } = await loadMacro(MACRO, { user: "player", expose: EXPOSE });
  const { OPS, blankState, Planner, detectPCs, fmtReal, worldDate, stampPeriod, newPeriod } = X;

  const playerPlanner = new Planner(foundry.utils.deepClone(blankState()));
  playerPlanner.pcs = detectPCs();
  playerPlanner.app = { render() {} };

  await playerPlanner.apply("addRow", { actorId: "pc1", act: "income" });
  const reqAdd = globalThis.game.user.getFlag(REQ_SCOPE, REQ_KEY);

  const gmState = blankState();
  OPS[reqAdd.op](gmState, reqAdd.data);

  const playerRow = playerPlanner.rows("pc1")[0];
  const gmRow = gmState.periods["1"].plans.pc1.rows[0];

  check("relayed addRow carries an id", !!reqAdd.data.id, JSON.stringify(reqAdd.data));
  check("player row id === relayed id", playerRow && playerRow.id === reqAdd.data.id,
    `player=${playerRow?.id} relayed=${reqAdd.data.id}`);
  check("GM row id === player row id", gmRow && playerRow && gmRow.id === playerRow.id,
    `gm=${gmRow?.id} player=${playerRow?.id}`);

  await playerPlanner.apply("setRow", { actorId: "pc1", rowId: playerRow.id, patch: { cfg: { skill: "diplomacy" } } });
  const reqSet = globalThis.game.user.getFlag(REQ_SCOPE, REQ_KEY);
  OPS[reqSet.op](gmState, reqSet.data);
  const gmAfter = gmState.periods["1"].plans.pc1.rows[0];
  check("player edit (skill) lands on the GM copy", gmAfter && gmAfter.cfg.skill === "diplomacy",
    "gm.cfg.skill=" + (gmAfter && gmAfter.cfg.skill));

  await playerPlanner.apply("setRow", { actorId: "pc1", rowId: playerRow.id, patch: { days: 6 } });
  const reqDays = globalThis.game.user.getFlag(REQ_SCOPE, REQ_KEY);
  OPS[reqDays.op](gmState, reqDays.data);
  const gmDays = gmState.periods["1"].plans.pc1.rows[0];
  check("player day count (6 of 7) lands on the GM copy", gmDays && gmDays.days === 6, "gm.days=" + (gmDays && gmDays.days));

  /* Ownership: a player editing a character they don't own is refused before it
     reaches the relay. */
  const before = foundry.utils.deepClone(globalThis.game.user.flags);
  await playerPlanner.apply("addRow", { actorId: "pc2", act: "income" });
  check("player can't add a row for someone else's character",
    JSON.stringify(globalThis.game.user.flags) === JSON.stringify(before));

  /* ============ 2. period switching preserves selections ============ */
  console.log("\n== 2. Period switching must preserve prior selections ==");
  const gm2 = foundry.utils.deepClone(gmState);
  OPS.addRow(gm2, { actorId: "pc1", act: "study", id: "study-row-1" });
  const studyRow = gm2.periods["1"].plans.pc1.rows.find(r => r.id === "study-row-1");
  studyRow.cfg.lore = "Warfare Lore"; studyRow.cfg.rank = "2"; studyRow.cfg.teacher = "Igawa";
  studyRow.days = 7; studyRow.done = true;

  OPS.setPeriod(gm2, { n: 2 });
  OPS.addRow(gm2, { actorId: "pc2", act: "rest", id: "rest-row-2" });
  check("period 2 has its own row", gm2.periods["2"].plans.pc2.rows.length === 1);
  check("period 1 rows intact while on period 2", gm2.periods["1"].plans.pc1.rows.length >= 2,
    "count=" + gm2.periods["1"].plans.pc1.rows.length);

  OPS.setPeriod(gm2, { n: 1 });
  check("period 1 rows still present after returning",
    gm2.periods["1"].plans.pc1.rows.some(r => r.id === "study-row-1"));
  check("period 2 rows preserved too", gm2.periods["2"].plans.pc2.rows.length === 1);

  /* ============ 3. Dedicated Study progress derives across periods ========= */
  console.log("\n== 3. Dedicated Study progress derives from done rows ==");
  const planner = new Planner(gm2);
  planner.pcs = detectPCs();
  const pc1 = planner.pcs.find(p => p.actorId === "pc1");
  check("study days derive from the done row (7 days)", planner.studyDays("pc1", "Warfare Lore", 2) === 7);
  const st = planner.studyState(pc1, studyRow);
  check("study progress reads 7 / 14 days", st.done === 7 && st.target.days === 14, `${st.done}/${st.target.days}`);
  check("study not yet complete (needs 14)", st.complete === false);

  /* ============ 4. end-to-end: the GM's real updateUser handler ========== */
  console.log("\n== 4. End-to-end relay through the GM's updateUser handler ==");
  await loadMacro(MACRO, { user: "gm", expose: EXPOSE });   // boots as GM, registers the handler
  const Hooks = getHooks();
  const read = () => globalThis.game.settings.get("world", "pf2eDowntimePlan");
  const playerUser = buildGame("player").user;               // the relay source

  const id = "e2e-row-1";
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "addRow", data: { actorId: "pc1", act: "income", id }, t: 1 });
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "setRow", data: { actorId: "pc1", rowId: id, patch: { cfg: { skill: "diplomacy" } } }, t: 2 });
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "setRow", data: { actorId: "pc1", rowId: id, patch: { days: 6 } }, t: 3 });
  await sleep(30);

  let s = read();
  const e2eRow = s.periods["1"].plans.pc1.rows.find(r => r.id === id);
  check("row exists in the world setting", !!e2eRow);
  check("skill landed", e2eRow && e2eRow.cfg.skill === "diplomacy", "skill=" + (e2eRow && e2eRow.cfg.skill));
  check("days landed (6 of 7)", e2eRow && e2eRow.days === 6, "days=" + (e2eRow && e2eRow.days));

  // Dedicated Study "complete" — keyed by actorId, no rowId. The player owns
  // pc1, so this must land; the same op for someone else's character must not.
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "completeStudy", data: { actorId: "pc1", lore: "Absalom Lore", rank: 2 }, t: 4 });
  await sleep(30);
  s = read();
  check("study held rank saved for the player's own character",
    s.study?.pc1?.held?.lore === "Absalom Lore" && s.study.pc1.held.rank === 2,
    JSON.stringify(s.study?.pc1));

  const heldBefore = foundry.utils.deepClone(read().study);
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "completeStudy", data: { actorId: "pc2", lore: "Absalom Lore", rank: 2 }, t: 4 });
  await sleep(30);
  check("completeStudy for someone else's character is refused",
    JSON.stringify(read().study) === JSON.stringify(heldBefore));

  // GM-only op must be refused from a player relay.
  const periodBefore = s.period;
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "setPeriod", data: { n: 9 }, t: 5 });
  await sleep(30);
  check("GM-only setPeriod refused from a player relay", read().period === periodBefore, "period=" + read().period);

  const delBefore = JSON.stringify(read().periods);
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "delPeriod", data: { n: 1 }, t: 5 });
  await sleep(30);
  check("GM-only delPeriod refused from a player relay", JSON.stringify(read().periods) === delBefore);

  /* ============ 5. a player requests the next period ============ */
  console.log("\n== 5. A player requests the next period; the GM opens it ==");
  const chatBefore = (globalThis.__chat ?? []).length;
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "requestPeriod", data: { by: "spoofed", name: "spoofed" }, t: 6 });
  await sleep(30);
  s = read();
  check("request stored under the next period", s.requests?.["2"]?.["player"] === "Aiko",
    JSON.stringify(s.requests));
  check("sender is read from the hook, not the payload",
    s.requests?.["2"]?.["spoofed"] === undefined && Object.values(s.requests?.["2"] ?? {}).length === 1);
  check("a request does not itself change the period", s.period === 1, "period=" + s.period);
  check("request also lands in chat",
    (globalThis.__chat ?? []).length === chatBefore + 1 &&
    /asks the GM/.test(globalThis.__chat[globalThis.__chat.length - 1]?.content ?? "") &&
    /Aiko/.test(globalThis.__chat[globalThis.__chat.length - 1]?.content ?? ""),
    JSON.stringify((globalThis.__chat ?? []).map(m => m.content)));

  // A repeat request from the same player stays one entry, still the real sender.
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "requestPeriod", data: { by: "someone-else", name: "Evil" }, t: 7 });
  await sleep(30);
  s = read();
  check("repeat request still names the real sender once",
    s.requests?.["2"]?.["player"] === "Aiko" && Object.values(s.requests?.["2"] ?? {}).length === 1);

  // Withdraw clears it.
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "cancelRequest", data: { by: "spoofed" }, t: 8 });
  await sleep(30);
  s = read();
  check("withdraw clears the player's request", !s.requests?.["2"]?.["player"], JSON.stringify(s.requests));

  // The GM opens the period through the same reducer; its requests clear.
  playerUser.setFlag(REQ_SCOPE, REQ_KEY, { op: "requestPeriod", data: { by: "x", name: "y" }, t: 9 });
  await sleep(30);
  const opened = foundry.utils.deepClone(read());
  OPS.setPeriod(opened, { n: 2 });
  check("opening the period clears its requests", !opened.requests?.["2"], JSON.stringify(opened.requests));
  check("the next period now exists", !!opened.periods["2"]);

  // Requesting while the GM looks back at an older period still targets the
  // newest period + 1, never an already-open one.
  const back = foundry.utils.deepClone(opened);
  back.period = 1;
  OPS.requestPeriod(back, { by: "player", name: "Aiko" });
  check("request from an older period targets the newest + 1",
    !back.requests?.["2"] && back.requests?.["3"]?.["player"] === "Aiko",
    JSON.stringify(back.requests));

  /* ============ 6. period management: stamps + deletion ============ */
  console.log("\n== 6. Period management: creation stamps and deletion ==");
  const s6 = blankState();
  check("a fresh period 1 is unstamped (predates the feature)", !s6.periods["1"].created);

  stampPeriod(s6.periods["1"]);
  check("stampPeriod adds a real-world stamp", !!s6.periods["1"].created?.real);
  check("stamp is a wall-clock string", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s6.periods["1"].created.real));
  check("stamp carries a numeric ts", Number.isFinite(s6.periods["1"].created.ts));
  check("no calendar and no world clock -> no in-game time", s6.periods["1"].created.world === null);

  const np = newPeriod(7);
  check("newPeriod stamps the period it creates", !!np.created && !!np.created.real && np.label === "Downtime 7");

  OPS.setPeriod(s6, { n: 2 });
  check("setPeriod stamps a newly opened period", !!s6.periods["2"].created?.real);
  OPS.setPeriod(s6, { n: 3 });
  OPS.delPeriod(s6, { n: 3 });
  check("delPeriod removes the period", !s6.periods["3"] && !!s6.periods["2"] && !!s6.periods["1"]);
  OPS.delPeriod(s6, { n: 2 });
  check("deleting the current period jumps to the highest remaining", s6.period === 1);
  OPS.delPeriod(s6, { n: 1 });
  check("deleting the last period re-creates a fresh period 1", !!s6.periods["1"] && s6.period === 1);
  check("re-created period 1 is stamped", !!s6.periods["1"].created);
  check("fmtReal renders a stable wall-clock string", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(fmtReal(Date.now())));
  /* worldDate precedence: SimpleCalendar > Calendaria > PF2e world clock >
     bare world clock > null. */
  delete globalThis.SimpleCalendar;
  delete globalThis.CALENDARIA;
  globalThis.game.time = undefined;
  globalThis.game.pf2e = undefined;
  check("worldDate is null with no date source at all", worldDate() === null);

  globalThis.game.time = { worldTime: 3 * 86400 + 4 * 3600, getWorldTime: (s) => `${Math.floor(s / 86400)} days, ${Math.floor((s % 86400) / 3600)} hours` };
  check("worldDate falls back to the bare world clock", worldDate() === "3 days, 4 hours");
  globalThis.game.time = { worldTime: 0, getWorldTime: () => "0 days" };
  check("an un-advanced bare world clock reads null", worldDate() === null);

  globalThis.game.pf2e = { worldClock: {
    worldTime: { year: 2026, month: 8, day: 15, hour: 0, minute: 0, weekday: 6, isValid: true },
    year: 4722, month: "Abadius", weekday: "Moonday", era: "AR", dateTheme: "AR"
  } };
  check("worldDate reads the PF2e world clock's themed date", worldDate() === "Moonday, 15 of Abadius, 4722 AR");

  globalThis.game.pf2e = { worldClock: {
    worldTime: { year: 2026, month: 8, day: 15, hour: 9, minute: 30, weekday: 6, isValid: true }
  } };
  check("PF2e world clock numeric fallback without themed getters", worldDate() === "2026-08-15 09:30");

  globalThis.CALENDARIA = { api: {
    formatDate: () => "Abadius 15, 4722 AR",
    getCurrentDateTime: () => ({ year: 4722, month: 8, day: 15, hour: 0, minute: 0 })
  } };
  check("worldDate prefers Calendaria over the PF2e world clock", worldDate() === "Abadius 15, 4722 AR");

  globalThis.SimpleCalendar = { api: { currentDateTime: () => ({ display: { date: "Abadius 12, 4722 AR", time: "14:00" } }) } };
  check("worldDate prefers SimpleCalendar over Calendaria and the world clock", worldDate() === "Abadius 12, 4722 AR 14:00");

  console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
  process.exit(failures === 0 ? 0 : 1);
})();
