/* ============================================================================
   WAFFLE HOUSE ISEKAI — GM Console
   Pathfinder Second Edition · Snowy's Maps slot-in session · 4–6 PCs of 10th level
   Foundry VTT v11 / v12 / v13 / v14  •  built for the pf2e system
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   One shift at the Waffle House. Five tasks, each tied to one of the Chef's
   attacks: finish a task and the Chef can't use that attack in the final
   fight. The console tracks each task the way the book scores it — every
   PC's save in the break room, the Clog's knockouts, the served tables and
   the Karen, the timed register problems, the three recipes — works out
   whether the task is done or failed, and carries that into Closing Time.

   Everything it points at belongs to the Snowy's Maps Waffle House Isekai
   PF2e module — journal pages, actors, items, playlists, and the map. Every
   id below was read out of the module's own adventure pack, and an adventure
   import keeps those ids. Nothing is duplicated here: no stat blocks.

   Without the module imported the console still runs; the buttons say what is
   missing instead of failing silently.
   ============================================================================ */

const WH_NS = "world";
const WH_KEY = "pf2eWaffleHouseIsekai";
const WH_ID = `${WH_NS}.${WH_KEY}`;
const MAX_PCS = 6;
const BOOK_LEVEL = 10;

const THEME = "nightshift";
const PALETTES = {
  /* 3 a.m. under the yellow sign. */
  nightshift: {
    paper: "#121214", card: "#1c1c20", ink: "#ece8df", line: "#36363d", muted: "#a19d94",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(255,199,44,.10)", field: "#0c0c0e",
    yolk: "#ffc72c", ketchup: "#e0533c", syrup: "#d9913a", mint: "#5fbf8a", denim: "#6d9fd0", grape: "#a88ad6"
  },
  daylight: {
    paper: "#f6f2e8", card: "#ffffff", ink: "#1c1c20", line: "#cfc6b4", muted: "#6b6458",
    stripe: "rgba(0,0,0,.04)", hover: "rgba(0,0,0,.06)", field: "#fbf8f2",
    yolk: "#9a6f00", ketchup: "#ad3220", syrup: "#8f5512", mint: "#1f7a4a", denim: "#22608f", grape: "#673fa0"
  }
};

/* --------------------------------------------------- inline check helper */
const checkSlug = (s) => s.trim().toLowerCase().replace(/\s+/g, "-");
const checkCode = (skill, dc) => `@Check[type:${checkSlug(skill)}|dc:${dc}]`;

/* ------------------------------------------------------------ the module
   Document ids from the module's adventure pack, "Waffle House Isekai". */
const MODULE = { id: "snowys-maps-waffle-house-isekai-pf2e", title: "Snowy's Maps Waffle House Isekai PF2e" };
const JOURNAL = "zfacoIbVRBM543Cb";          // Dungeon Design
const PAGES = {
  background: "LqaVuKAI3bfdhfah",            // GM Background
  beginning: "x8MQGs8DmfaOMH90",             // The Beginning
  a1: "VK6CcOYDncx8j364",                    // A1. Break Room
  a2: "6tJZkHKC65N2Kmzx",                    // A2. Bathrooms
  a3: "a4Hj6piXEbWG7I7i",                    // A3. Waiting Tables
  a4: "EFRw7eYXVupJp1ru",                    // A4. Cash Register
  a5: "t2DAwLryYB7KhSf8",                    // A5. Kitchen
  end: "Fvf5tUbrS85rDyQ6",                   // ...The End
  aftermath: "tdXBkrMG8wJCt2VF"              // Aftermath
};
const SCENE = { id: "evTqLHpKZY5qRI41", name: "[20x30] waffle house day" };

const FOES = {
  chef: { id: "YP149T1MIIBIX1ZT", name: "The Chef", level: 13 },
  clog: { id: "eZMdUoZR4CHEHHKj", name: "The Clog", level: 12 },
  ooze: { id: "8PzMRSPpcCYI5HII", name: "Mutated Sewer Ooze", level: 6 }
};
const ITEMS = {
  scour: { id: "RNAMWIOL8TdmJokG", name: "Scour" },
  pan: { id: "NFm5VTRsR5kFYUZQ", name: "Striking (Greater)" }
};
/* Not in the module: the coupon summons these, and they live in the system's
   own equipment compendium. */
const WAFFLES = { pack: "pf2e.equipment-srd", id: "awPkC6AWcHS3T4oz", name: "Cooperative Waffles (Greater)" };

/* One track per part of the restaurant. The journal swaps them as the party
   moves, so starting one here stops the other two. */
const MUSIC = {
  front: { pl: "fWwhFxPQ0BUfEdxw", s: "aWaOv7jyiiGM9KoC", list: "A1-A3.", name: "Awkward Spellcasting", where: "Break room, bathrooms, tables" },
  register: { pl: "Kej3sX7OzTfKLyqr", s: "8gcc84NHlWRa7aMw", list: "A4.", name: "Spilled Ale", where: "The cash register" },
  kitchen: { pl: "KRrwilu5LokuJ9bl", s: "IpjthTPhMyn4nXeb", list: "A5.", name: "Metallic Inspiration", where: "The kitchen, and the final fight" }
};

/* ------------------------------------------------------------- the tasks
   Each area's task and the Chef attack it takes away. `gist` is a reminder
   for the table, not the stat block — that lives on the Chef's sheet. */
const TASKS = [
  { key: "a1", n: "A1", name: "Break Room", job: "Mop the floors", tone: "denim", music: "front", icon: "fa-broom",
    ability: "Bad Review", item: "Bad Review (A1)", gist: "Scathing critiques at two creatures — Will save or stupefied, no reactions, maybe confused." },
  { key: "a2", n: "A2", name: "Bathrooms", job: "Clean the bathrooms", tone: "mint", music: "front", icon: "fa-toilet",
    ability: "Pay Docking", item: "Pay Docking (A2)", gist: "Two creatures pay 100 gp with an Interact, or take −2 to saves." },
  { key: "a3", n: "A3", name: "Waiting Tables", job: "Serve the customers", tone: "grape", music: "front", icon: "fa-mug-hot",
    ability: "Order Up", item: "Order Up (A3)", gist: "A snack that heals him 5d6+16, at −2 AC until his next turn." },
  { key: "a4", n: "A4", name: "Cash Register", job: "Ring up the orders", tone: "syrup", music: "register", icon: "fa-cash-register",
    ability: "Sticky Floors", item: "Sticky Floors (A4)", gist: "Grease in a 40-foot emanation — difficult terrain for a minute. He ignores it." },
  { key: "a5", n: "A5", name: "Kitchen", job: "Cook the orders", tone: "ketchup", music: "kitchen", icon: "fa-fire-burner",
    ability: "Closing Time", item: "Closing Time (A5)", gist: "Dominate at will, to make someone the shift manager." }
];
const taskFor = (key) => TASKS.find(t => t.key === key);
const ALWAYS = ["Chop", "Fry", "Home Turf", "Dominate (At Will)"];

const TABS = [
  { key: "start", label: "Clock In", sub: "before the shift", tone: "yolk", icon: "fa-clock" },
  ...TASKS.map(t => ({ key: t.key, label: `${t.n} ${t.name}`, task: t, tone: t.tone, icon: t.icon })),
  { key: "close", label: "Closing Time", sub: "the Chef", tone: "ketchup", icon: "fa-utensils" },
  { key: "table", label: "At the Table", sub: "map · music · items", tone: "denim", icon: "fa-music" }
];

/* ------------------------------------------------------------- the book */
const OPENING = {
  pitch: "A slot-in session for four to six 10th-level characters. The party has to survive a shift at the Waffle House.",
  background: "Separated by dimensions of space and time, in a reality similar to our own, there is a man named Ezekiel “Zeke” Brauner. Despite being a huge stoner, Zeke is the most reliable employee at a certain Waffle House. The bar is so, so very low. One night Zeke trips so hard on shrooms during his shift that he taps into latent mage abilities and opens a temporary rift between dimensions. Magic seeps through the tear, changing the nature of the restaurant's inhabitants.",
  rule: "Each area has a task to complete that corresponds to an attack the Chef can use. When a task is completed, its attack can no longer be used. Once every task is completed or failed, the shift is over and the Chef fights. Once he is defeated, the magic tethering the party to the Waffle House dissipates.",
  hooks: [
    { key: "sleep", label: "A strange sleep",
      text: "While the party rests at their local tavern, a strange sleep overcomes them — yes, even those who don't need sleep. When they wake up, they're in a strange building of polished wood and stone, glass and metal. Upon seeing them, Zeke assumes they must be the new hires, gleefully tells them the list of responsibilities, then goes on break." },
    { key: "portal", label: "A glowing tear",
      text: "The party notices a glowing tear in reality. Zeke appears in the portal, comments on how weird this dream is, and invites them through. Once they all enter, the portal closes up behind them and disappears." }
  ],
  chef: "The Chef is largely pacifistic. He won't attack without provocation until the shift is over — or if the party tries to harm a customer. He takes one smoke break a day, when the party is in the kitchen (A5). His goal is the same as every day: get through his shift without threatening to stab anyone. Again."
};

const PROBLEMS = [
  { q: "A customer orders a Classic Waffle for $5.20 and pays with a $10 bill. Give the correct amount of change in dollars and coins.",
    a: "Four $1 bills, three quarters, one nickel ($4.80)" },
  { q: "A customer orders an All Star Special (waffle, bacon, eggs, toast) for $12.10 and an Orange Juice for $2.90. They pay by card with a 10% tip. How much do they owe?",
    a: "$16.50" },
  { q: "A customer orders a Texas Sausage Egg and Cheese Melt, a Sausage Egg and Cheese Sandwich, a Bacon Egg and Cheese Sandwich, and a Texas Bacon Egg and Cheese Melt. Each item costs $6.50. What is the total?",
    a: "$26.00" },
  { q: "A customer buys a Chocolate Chip Waffle for $5.70 and Hash Browns for $3.15. They pay with a $20 bill. Give the correct amount of change in dollars and coins.",
    a: "One $10 bill, one $1 bill, one dime, one nickel ($11.15)" },
  { q: "A customer orders a Sausage Egg and Cheese Hashbrown Bowl for $10.80. They ask to add Hickory Smoked Ham and Sausage Gravy for $0.65 each. What is the total?",
    a: "$12.10" },
  { q: "A customer has a $20 bill and wants to buy as many sides of Bacon as possible. Each side is $4.20 and contains 3 pieces of bacon. How many pieces of bacon can they get?",
    a: "12 (four sides)" }
];

const RECIPES = [
  { key: "steak", name: "T-Bone Steak",
    skills: [["Survival", "enduring the searing heat"], ["Medicine", "identifying the right cut of meat"]] },
  { key: "burger", name: "Double Angus ¼ Pound Hamburger",
    skills: [["Crafting", "assembling it without the ingredients falling"], ["Performance", "delicious presentation"]] },
  { key: "chilli", name: "Bert's Chilli",
    skills: [["Athletics", "stirring the massive kettle of chilli"], ["Nature", "knowing the right spices to add to the pot"]] }
];

const DEG = {
  cs: { label: "Crit success", short: "CS", tone: "mint", ok: true, score: 3 },
  s: { label: "Success", short: "S", tone: "denim", ok: true, score: 2 },
  f: { label: "Failure", short: "F", tone: "syrup", ok: false, score: 1 },
  cf: { label: "Crit failure", short: "CF", tone: "ketchup", ok: false, score: 0 }
};

/* ---------------------------------------------------------------- threat
   The book prints creature levels, not a threat. These are the GM Core
   tables, so the cards can say what each fight is for the party at hand. */
const XP_BY_DIFF = { "-4": 10, "-3": 15, "-2": 20, "-1": 30, "0": 40, "1": 60, "2": 80, "3": 120, "4": 160 };
const BUDGETS = [["trivial", 40, 10], ["low", 60, 15], ["moderate", 80, 20], ["severe", 120, 30], ["extreme", 160, 40]];
function creatureXp(level, partyLevel) {
  const d = Math.max(-4, Math.min(4, level - partyLevel));
  return level - partyLevel < -4 ? 0 : XP_BY_DIFF[String(d)];
}
function threatFor(xp, n) {
  const scaled = BUDGETS.map(([k, base, adj]) => [k, base + adj * (n - 4)]);
  const hit = scaled.find(([, v]) => xp <= v);
  return { label: hit ? hit[0] : "beyond extreme", budget: hit ? hit[1] : null };
}

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "start", pcs, hook: null,
    a1: { res: {}, help: {}, after: {}, scour: false },
    a2: { ko: 0, won: false, elite: null, hidden: null },
    a3: { rolls: [], karen: null },
    a4: { secs: 20, rows: null },
    a5: { rec: {} },
    over: {},           // task key -> "done" | "failed", a GM ruling over the derived result
    finale: { result: null, coupon: null },
    log: []
  };
}

function pickArt(a) {
  const t = a.prototypeToken?.texture?.src ?? "";
  return (t && !/\.(webm|mp4|m4v)$/i.test(t) && !t.includes("*")) ? t : (a.img || "icons/svg/mystery-man.svg");
}
const actorLevel = (a) => Number(a?.level ?? a?.system?.details?.level?.value ?? 0) || null;
function pcEntry(a) { return { name: a.name, id: a.id, img: pickArt(a), level: actorLevel(a) }; }
function detectPCs() {
  const seen = new Map();
  const add = (a) => { if (a?.id && !seen.has(a.id)) seen.set(a.id, pcEntry(a)); };
  /* The party size sets the Clog's elite adjustment, every fight's threat, and
     how many orders the register deals, so a Party actor with members is taken
     as the whole party — an eidolon or a familiar a player owns isn't a PC. */
  const party = game.actors.party ?? game.actors.find(a => a.type === "party");
  for (const m of party?.members ?? []) add(m);
  if (seen.size) return [...seen.values()].slice(0, MAX_PCS);
  for (const u of game.users) { if (!u.isGM) add(u.character); }
  if (seen.size < MAX_PCS) for (const a of game.actors) {
    if (seen.size >= MAX_PCS) break;
    if (a.hasPlayerOwner && (a.type === "character" || a.type === "PC")) add(a);
  }
  return [...seen.values()].slice(0, MAX_PCS);
}
function refreshPCs(pcs) {
  const detected = detectPCs();
  if (!pcs?.length) return detected;
  const kept = pcs.map((pc) => {
    const a = pc.id ? game.actors.get(pc.id) : null;
    return a ? pcEntry(a) : null;
  }).filter(Boolean);
  return kept.length ? kept : detected;
}
function registerSetting() {
  if (!game.settings.settings.has(WH_ID)) {
    game.settings.register(WH_NS, WH_KEY, { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ----------------------------------------------------------------- engine */
class Shift {
  constructor(state) { this.state = state; this.timer = null; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(WH_NS, WH_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  /* ----- the party ----- */
  get pcs() { return this.s.pcs ?? []; }
  get partySize() { return this.pcs.length || 4; }
  get partyLevel() {
    const lv = this.pcs.map(p => p.level).filter(Boolean);
    return lv.length ? Math.round(lv.reduce((a, b) => a + b, 0) / lv.length) : BOOK_LEVEL;
  }
  pcName(id) { return this.pcs.find(p => p.id === id)?.name ?? "—"; }

  /* ----- task outcomes -----
     Every task's result is worked out from what's been ticked, so undoing a
     tick undoes the result. A GM ruling in `over` wins when there is one. */
  derive(key) {
    const s = this.s;
    if (key === "a1") {
      const ids = this.pcs.map(p => p.id);
      if (!ids.length) return { st: "open", why: "No PCs detected." };
      const failers = ids.filter(id => s.a1.res[id] === "f");
      const unrolled = ids.filter(id => !s.a1.res[id]);
      const stuck = failers.filter(id => s.a1.after[id] === "f");
      if (stuck.length) return { st: "failed", why: `${stuck.map(id => this.pcName(id)).join(", ")} still didn't make the save.` };
      const unhelped = failers.filter(id => !s.a1.help[id]);
      if (!unrolled.length && unhelped.length && !this.a1Helpers().length)
        return { st: "failed", why: "Someone failed and nobody who succeeded is left to help." };
      if (unrolled.length) return { st: "open", why: `${unrolled.length} PC${unrolled.length > 1 ? "s" : ""} still to save.` };
      if (failers.some(id => s.a1.after[id] !== "s")) return { st: "open", why: "Waiting on the help." };
      return { st: "done", why: "Every PC made it through the mopping." };
    }
    if (key === "a2") {
      if (s.a2.ko > 1) return { st: "failed", why: `The Clog knocked out ${s.a2.ko} PCs.` };
      if (s.a2.won) return { st: "done", why: s.a2.ko ? "The Clog is down, and only one PC went under." : "The Clog is down, and nobody went under." };
      return { st: "open", why: "The Clog is still bubbling." };
    }
    if (key === "a3") {
      const ok = s.a3.rolls.filter(r => DEG[r]?.ok).length;
      const karen = s.a3.rolls.some(r => !DEG[r]?.ok);
      if (s.a3.karen === "stormed") return { st: "failed", why: "The Karen stormed out." };
      if (karen && s.a3.karen !== "appeased") return { st: "open", why: "There's a Karen. Charm her or lose the section." };
      if (ok >= 3) return { st: "done", why: karen ? "Every table served, and the Karen talked down." : "Every table served without a hitch." };
      return { st: "open", why: `${3 - ok} more table${3 - ok > 1 ? "s" : ""} to serve.` };
    }
    if (key === "a4") {
      const rows = this.a4Rows();
      const bad = rows.filter(r => r.res === "f").length;
      const open = rows.filter(r => !r.res).length;
      if (bad > rows.length / 2) return { st: "failed", why: `${bad} of ${rows.length} orders rung up wrong.` };
      if (bad + open <= rows.length / 2 && rows.length) return { st: "done", why: open ? "Enough orders right that the rest can't sink it." : `${rows.length - bad} of ${rows.length} orders right.` };
      return { st: "open", why: `${open} order${open > 1 ? "s" : ""} still to ring up.` };
    }
    if (key === "a5") {
      const res = RECIPES.map(r => s.a5.rec[r.key]?.d ?? null);
      const bad = res.filter(d => d && !DEG[d].ok).length;
      const open = res.filter(d => !d).length;
      if (bad > 1) return { st: "failed", why: `${bad} of the three recipes ruined.` };
      if (bad + open <= 1) return { st: "done", why: open ? "Two dishes out — the last can't sink it." : bad ? "Two of the three dishes came out." : "All three dishes came out." };
      return { st: "open", why: `${open} recipe${open > 1 ? "s" : ""} still on the stove.` };
    }
    return { st: "open", why: "" };
  }
  status(key) {
    const d = this.derive(key);
    const o = this.s.over[key];
    return o ? { st: o, why: `Your ruling. Worked out from the ticks: ${d.st}.`, ruled: true, derived: d.st } : d;
  }
  get resolved() { return TASKS.filter(t => this.status(t.key).st !== "open").length; }
  get shiftOver() { return this.resolved === TASKS.length; }
  /* An ability is gone only once its task is done; a failed or unfinished task
     leaves it to the Chef. */
  abilityLive(key) { return this.status(key).st !== "done"; }
  setOver(key, v) {
    const before = this.status(key).st;
    this.s.over[key] = this.s.over[key] === v ? null : v;
    this.afterChange(key, before);
  }
  /* Every task change goes through here, so the moment a task flips to done
     or failed gets announced the same way wherever it was clicked. */
  afterChange(key, before) {
    const t = taskFor(key), now = this.status(key).st;
    if (now !== before) {
      if (now === "done") { this.log(`${t.n} done — the Chef loses ${t.ability}.`); ui.notifications.info(`${t.n} ${t.name} done. The Chef can't use ${t.ability}.`); }
      else if (now === "failed") { this.log(`${t.n} failed — ${t.ability} stays.`); ui.notifications.info(`${t.n} ${t.name} failed. The Chef keeps ${t.ability}.`); }
      else this.log(`${t.n} reopened.`);
      if (this.shiftOver && before === "open") ui.notifications.info("Every task is settled. The shift is over — Closing Time.");
    }
    this.touch();
  }
  mutate(key, fn) {
    const before = this.status(key).st;
    fn();
    this.afterChange(key, before);
  }

  /* ----- A1 ----- */
  a1Helpers() {
    const used = new Set(Object.values(this.s.a1.help));
    return this.pcs.filter(p => this.s.a1.res[p.id] === "s" && !used.has(p.id));
  }
  a1Result(id, v) {
    this.mutate("a1", () => {
      const a1 = this.s.a1;
      if (a1.res[id] === v) delete a1.res[id]; else a1.res[id] = v;
      /* A PC who no longer failed needs no help; one who no longer succeeded
         can't be giving it. */
      if (a1.res[id] !== "f") { delete a1.help[id]; delete a1.after[id]; }
      if (a1.res[id] !== "s") for (const [k, h] of Object.entries(a1.help)) if (h === id) { delete a1.help[k]; delete a1.after[k]; }
    });
  }
  a1Help(id, helper) {
    this.mutate("a1", () => {
      const a1 = this.s.a1;
      if (a1.help[id] === helper) { delete a1.help[id]; delete a1.after[id]; } else a1.help[id] = helper;
    });
  }
  a1After(id, v) {
    this.mutate("a1", () => { const a1 = this.s.a1; if (a1.after[id] === v) delete a1.after[id]; else a1.after[id] = v; });
  }

  /* ----- A2 ----- */
  get eliteClog() { return this.s.a2.elite ?? this.partySize >= 6; }
  a2Ko(delta) { this.mutate("a2", () => { this.s.a2.ko = Math.max(0, Math.min(this.partySize, this.s.a2.ko + delta)); }); }
  a2Won() { this.mutate("a2", () => { this.s.a2.won = !this.s.a2.won; }); }
  bathroomThreat() {
    const L = this.partyLevel, n = this.partySize;
    const xp = creatureXp(FOES.clog.level + (this.eliteClog ? 1 : 0), L) + 3 * creatureXp(FOES.ooze.level, L);
    return { xp, ...threatFor(xp, n) };
  }
  chefThreat() {
    const xp = creatureXp(FOES.chef.level, this.partyLevel);
    return { xp, ...threatFor(xp, this.partySize) };
  }
  sceneTokens(actorIds) {
    const scene = game.scenes?.get(SCENE.id);
    return [...(scene?.tokens ?? [])].filter(t => actorIds.includes(t.actorId));
  }
  /* The book makes the Clog elite for six adventurers. The toggle is kept in
     the console's own state; the map's Clog tokens are switched to match, the
     same way the sheet's elite button does it. */
  async setElite(on) {
    this.s.a2.elite = on;
    this.touch();
    const toks = this.sceneTokens([FOES.clog.id]);
    let n = 0;
    for (const t of toks) {
      const a = t.actor;
      if (typeof a?.applyAdjustment !== "function") continue;
      if (!!a.isElite !== on) { await a.applyAdjustment(on ? "elite" : null); n++; }
    }
    if (!toks.length) ui.notifications.info(`No Clog token on the "${SCENE.name}" scene to change — the console has noted it either way.`);
    else if (n) ui.notifications.info(`The Clog on the map is ${on ? "elite" : "back to normal"}.`);
  }
  /* The module drops the Clog and its oozes on the map in plain sight. */
  async setFoesHidden(hidden) {
    const scene = game.scenes?.get(SCENE.id);
    const toks = this.sceneTokens([FOES.clog.id, FOES.ooze.id]);
    if (!scene || !toks.length) return ui.notifications.warn(`No Clog or ooze tokens on the "${SCENE.name}" scene.`);
    await scene.updateEmbeddedDocuments("Token", toks.map(t => ({ _id: t.id, hidden })));
    this.s.a2.hidden = hidden;
    this.touch();
  }

  /* ----- A3 ----- */
  a3Roll(d) { this.mutate("a3", () => { this.s.a3.rolls.push(d); }); }
  a3Undo() {
    this.mutate("a3", () => {
      this.s.a3.rolls.pop();
      if (this.s.a3.rolls.every(r => DEG[r]?.ok)) this.s.a3.karen = null;
    });
  }
  a3Karen(v) { this.mutate("a3", () => { this.s.a3.karen = this.s.a3.karen === v ? null : v; }); }

  /* ----- A4 -----
     One order per PC, in seat order, until the GM deals more. */
  a4Rows() {
    if (Array.isArray(this.s.a4.rows)) return this.s.a4.rows;
    return this.pcs.map((p, i) => ({ pc: p.id, prob: i % PROBLEMS.length, aid: null, res: null }));
  }
  a4Edit(fn) {
    this.mutate("a4", () => {
      const rows = foundry.utils.deepClone(this.a4Rows());
      fn(rows);
      this.s.a4.rows = rows;
    });
  }
  a4Set(i, field, v) { this.a4Edit(rows => { if (rows[i]) rows[i][field] = rows[i][field] === v ? null : v; }); }
  a4Pick(i, field, v) { this.a4Edit(rows => { if (rows[i]) rows[i][field] = v; }); }
  a4Add() {
    this.a4Edit(rows => {
      const used = new Set(rows.map(r => r.prob));
      const next = PROBLEMS.findIndex((_, i) => !used.has(i));
      rows.push({ pc: this.pcs[rows.length % Math.max(1, this.pcs.length)]?.id ?? null, prob: next < 0 ? 0 : next, aid: null, res: null });
    });
  }
  a4Remove(i) { this.a4Edit(rows => { rows.splice(i, 1); }); }
  a4Secs(v) { this.s.a4.secs = Math.max(10, Math.min(30, Number(v) || 20)); this.touch(); }
  rowSecs(r) { return this.s.a4.secs * (r.aid === "s" ? 2 : 1); }

  /* The timer is local to this client and never saved: a reload mid-order
     drops it, which costs nothing. */
  startTimer(i) {
    const r = this.a4Rows()[i];
    if (!r) return;
    this.stopTimer(false);
    const secs = this.rowSecs(r);
    this.timer = { i, end: Date.now() + secs * 1000, secs };
    this.postCard("Cash Register", `${this.pcName(r.pc)}, you're up`,
      `<p style="margin:0 0 6px">${esc(PROBLEMS[r.prob].q)}</p><p style="margin:0"><b>${secs} seconds.</b> No calculators.</p>`, "syrup");
    this.timer.handle = setInterval(() => this.tick(), 250);
    this.render();
  }
  stopTimer(rerender = true) {
    if (this.timer?.handle) clearInterval(this.timer.handle);
    this.timer = null;
    if (rerender) this.render();
  }
  tick() {
    if (!this.timer) return;
    const left = Math.max(0, Math.ceil((this.timer.end - Date.now()) / 1000));
    for (const el of document.querySelectorAll("#wh-console .wh-clock")) {
      el.textContent = `${left}s`;
      el.classList.toggle("low", left <= 5);
    }
    if (left <= 0) {
      this.stopTimer();
      ui.notifications.info("Time!");
      this.postCard("Cash Register", "Time!", `<p style="margin:0">The customer is waiting.</p>`, "ketchup");
    }
  }

  /* ----- A5 ----- */
  recipe(key) { return this.s.a5.rec[key] ?? { guess: 0, via: 0, pc: null, d: null }; }
  a5Set(key, field, v) {
    this.mutate("a5", () => {
      const cur = { ...this.recipe(key) };
      cur[field] = (field === "d" && cur.d === v) ? null : v;
      this.s.a5.rec[key] = cur;
    });
  }
  /* `via` is 0 or 1 for the recipe's two skills, 2 for Cooking Lore. */
  recipeDc(key) {
    const r = this.recipe(key);
    return (r.via === 2 ? 23 : 27) - (r.guess ?? 0);
  }
  recipeSkill(rec, via) { return via === 2 ? "Cooking Lore" : rec.skills[via][0]; }
  get panEarned() { return RECIPES.every(r => DEG[this.recipe(r.key).d]?.ok); }
  /* The book gives the coupon to "the party member that did the best in Area
     5". Each PC's recipes are scored by degree; a tie is the GM's call. */
  a5Leaders() {
    const score = new Map();
    for (const r of RECIPES) {
      const x = this.recipe(r.key);
      if (!x.pc || !x.d) continue;
      score.set(x.pc, (score.get(x.pc) ?? 0) + DEG[x.d].score);
    }
    const best = Math.max(0, ...score.values());
    return best ? [...score.entries()].filter(([, v]) => v === best).map(([id]) => id) : [];
  }
  get couponHolder() {
    if (this.s.finale.coupon) return this.s.finale.coupon;
    const lead = this.a5Leaders();
    return lead.length === 1 ? lead[0] : null;
  }
  setCoupon(id) { this.s.finale.coupon = this.s.finale.coupon === id ? null : id; this.touch(); }
  setResult(v) {
    this.s.finale.result = this.s.finale.result === v ? null : v;
    if (this.s.finale.result) this.log(v === "won" ? "The Chef is defeated." : "The party fell to the Chef.");
    this.touch();
  }
  setHook(v) { this.s.hook = this.s.hook === v ? null : v; this.touch(); }
  toggleScour() { this.s.a1.scour = !this.s.a1.scour; this.touch(); }

  reset() {
    this.stopTimer(false);
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Waffle House Isekai reset. New shift.");
    this.touch();
  }
  rereadParty() {
    this.s.pcs = detectPCs();
    ui.notifications.info(`${this.s.pcs.length} PCs on the shift.`);
    this.touch();
  }

  /* ----- the module ----- */
  get imported() { return !!game.journal?.get(JOURNAL); }
  openPage(pageId) {
    const entry = game.journal?.get(JOURNAL);
    if (!entry) return ui.notifications.warn(`Import the ${MODULE.title} adventure to use the journal links.`);
    if (pageId && !entry.pages.get(pageId)) return ui.notifications.warn("That page isn't in the imported journal.");
    entry.sheet.render(true, pageId ? { pageId } : {});
  }
  /* Adventure import keeps the module's ids, so a world actor is the first
     place to look; a compendium search by name is the fallback. */
  async findActor(key) {
    const def = FOES[key];
    const actor = game.actors?.get(def.id) ?? game.actors?.getName?.(def.name);
    if (actor) return actor;
    for (const pack of [...(game.packs ?? [])].filter(p => p.documentName === "Actor")) {
      const index = await pack.getIndex();
      const hit = [...index].find(e => e._id === def.id || e.name?.toLowerCase() === def.name.toLowerCase());
      if (hit) return pack.getDocument(hit._id);
    }
    return null;
  }
  async openActor(key) {
    const a = await this.findActor(key);
    if (a) return a.sheet.render(true);
    ui.notifications.warn(`"${FOES[key].name}" isn't in this world. Import the ${MODULE.title} adventure and it will appear.`);
  }
  async openItem(key) {
    const def = ITEMS[key];
    const item = game.items?.get(def.id) ?? game.items?.getName?.(def.name);
    if (item) return item.sheet.render(true);
    ui.notifications.warn(`"${def.name}" isn't in this world — it comes with the ${MODULE.title} adventure.`);
  }
  async openWaffles() {
    const pack = game.packs?.get?.(WAFFLES.pack);
    if (pack) {
      const index = await pack.getIndex();
      const all = [...index].filter(e => /cooperative waffle/i.test(e.name ?? ""));
      const hit = all.find(e => e._id === WAFFLES.id) ?? all.find(e => /greater/i.test(e.name)) ?? all[0];
      if (hit) return (await pack.getDocument(hit._id))?.sheet.render(true);
    }
    ui.notifications.warn(`Couldn't find "${WAFFLES.name}" in the ${WAFFLES.pack} compendium.`);
  }
  /* Posts the Chef's own ability card from his sheet, so the table sees the
     real text. A locked ability isn't offered at all. */
  async postAbility(itemName) {
    const chef = await this.findActor("chef");
    const item = chef?.items?.find?.(i => i.name === itemName);
    if (!item) return ui.notifications.warn(`"${itemName}" isn't on the Chef's sheet in this world.`);
    if (typeof item.toMessage === "function") return item.toMessage();
    item.sheet?.render(true);
  }
  async activateScene(view = false) {
    const scene = game.scenes?.get(SCENE.id);
    if (!scene) return ui.notifications.warn(`The "${SCENE.name}" scene isn't in this world.`);
    await (view ? scene.view() : scene.activate());
  }

  /* ----- music ----- */
  sound(key) {
    const cue = MUSIC[key];
    const pl = game.playlists?.get(cue.pl);
    return { pl, sound: pl?.sounds?.get(cue.s) };
  }
  soundState(key) {
    const { pl, sound } = this.sound(key);
    return { ok: !!(pl && sound), playing: !!sound?.playing };
  }
  async toggleMusic(key) {
    const { pl, sound } = this.sound(key);
    if (!pl || !sound) return ui.notifications.warn(`"${MUSIC[key].name}" isn't in this world — it comes with the ${MODULE.title} adventure.`);
    if (sound.playing) await pl.stopSound(sound);
    else {
      for (const other of Object.keys(MUSIC)) {
        if (other === key) continue;
        const o = this.sound(other);
        if (o.sound?.playing) await o.pl.stopSound(o.sound);
      }
      await pl.playSound(sound);
    }
    this.render();
  }

  /* ----- chat ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "yolk") {
    const p = PALETTES.nightshift;
    await ChatMessage.create({
      content: `<div style="background:${p.card};color:${p.ink};border:1px solid ${p.line};border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${p[tone] ?? p.yolk};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:${p.muted}">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "Waffle House" }
    });
  }
  postHook() {
    const h = OPENING.hooks.find(x => x.key === this.s.hook) ?? OPENING.hooks[0];
    return this.postCard("Waffle House Isekai", h.label, `<p style="margin:0;font-style:italic">${esc(h.text)}</p>`, "yolk");
  }
  postCheck(eyebrow, title, lines, tone) {
    return this.postCard(eyebrow, title,
      `<ul style="margin:0;padding-left:1.1em">${lines.map(l => `<li style="margin-bottom:4px">${l}</li>`).join("")}</ul>`, tone);
  }
  postTaskCheck(key) {
    const t = taskFor(key);
    if (key === "a1") return this.postCheck("A1 · Break Room", "Mopping the floors",
      [`Ten minutes of mopping. Everyone attempts ${checkCode("Fortitude", 27)}.`], t.tone);
    if (key === "a3") return this.postCheck("A3 · Waiting Tables", "Serving the customers",
      [`${checkCode("Acrobatics", 27)} or ${checkCode("Diplomacy", 27)}`], t.tone);
    if (key === "a4") return this.postCheck("A4 · Cash Register", "Before you ring anything up",
      [`${checkCode("Arcana", 27)} or ${checkCode("Accounting Lore", 23)} for more time on your order.`], t.tone);
  }
  postRecipe(key) {
    const rec = RECIPES.find(r => r.key === key), x = this.recipe(key);
    const dc = this.recipeDc(key);
    const lines = x.via === 2 ? [checkCode("Cooking Lore", dc)]
      : [checkCode(rec.skills[x.via ?? 0][0], dc), `or ${checkCode("Cooking Lore", 23 - (x.guess ?? 0))}`];
    return this.postCheck("A5 · Kitchen", rec.name, lines, "ketchup");
  }
  /* Player-facing: what got done and what didn't, no counts or targets. */
  postReport() {
    const rows = TASKS.map(t => {
      const st = this.status(t.key).st;
      const mark = st === "done" ? "✔" : st === "failed" ? "✘" : "…";
      return `<li style="margin-bottom:3px">${mark} ${t.job}</li>`;
    }).join("");
    return this.postCard("Waffle House", this.shiftOver ? "The shift is over" : "How the shift is going",
      `<ul style="margin:0;padding-left:1.1em;list-style:none">${rows}</ul>
       ${this.shiftOver ? `<p style="margin:6px 0 0;font-style:italic">Zeke clocks out immediately. The Chef says there's one last task: exterminating the rats. He readies his cleaver.</p>` : ""}`,
      this.shiftOver ? "ketchup" : "yolk");
  }
  postCoupon() {
    const id = this.couponHolder;
    if (!id) return ui.notifications.warn("Pick who did best in the kitchen first.");
    return this.postCard("Aftermath", "The Waffle House Coupon",
      `<p style="margin:0 0 6px;font-style:italic">You wake up back home. Was it all a dream? Checking their pockets, ${esc(this.pcName(id))} finds a strange piece of paper…</p>
       <p style="margin:0">Once per hour it summons <b>Cooperative Waffles (Greater)</b>. They can't be sold, and if they aren't eaten they vanish within the hour.</p>`, "yolk");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class WHApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "wh-console", tag: "div", classes: ["wh-console"],
    position: { width: 960, height: "auto" },
    window: { title: "Waffle House Isekai", icon: "fa-solid fa-utensils", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "wh-console", classes: ["wh-console"], title: "Waffle House Isekai",
      width: 960, height: "auto", resizable: true
    });
  }
  get title() { return "Waffle House Isekai"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="wh-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }
  async close(...args) { this.t.stopTimer(false); return super.close(...args); }

  markup() {
    const t = this.t, s = t.s, ro = !t.editable;
    const tab = s.tab;
    return `${this.styles()}
      <div class="wh">
        ${this.header(ro)}
        <nav class="tabs">
          ${TABS.map(x => {
            const st = x.task ? t.status(x.task.key).st : null;
            const sub = x.task ? (st === "done" ? `✔ no ${x.task.ability}` : st === "failed" ? `✘ ${x.task.ability} stays` : x.task.job) : x.sub;
            return `<button type="button" class="tab ${tab === x.key ? "on" : ""} ${st ? `st-${st}` : ""}" style="--tt:var(--${x.tone})" data-act="tab" data-k="${x.key}">
              <b><i class="fa-solid ${x.icon}"></i> ${x.label}</b><small>${sub}</small></button>`;
          }).join("")}
        </nav>
        ${!t.imported ? `<p class="warn"><i class="fa-solid fa-triangle-exclamation"></i>
          The Waffle House Isekai adventure isn't imported into this world, so the journal, actor, item, playlist, and scene buttons have nothing to open. Import it from the ${MODULE.title} module's compendium. Everything else works.</p>` : ""}
        ${tab === "start" ? this.startTab(ro) : ""}
        ${tab === "a1" ? this.a1Tab(ro) : ""}
        ${tab === "a2" ? this.a2Tab(ro) : ""}
        ${tab === "a3" ? this.a3Tab(ro) : ""}
        ${tab === "a4" ? this.a4Tab(ro) : ""}
        ${tab === "a5" ? this.a5Tab(ro) : ""}
        ${tab === "close" ? this.closeTab(ro) : ""}
        ${tab === "table" ? this.tableTab(ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t;
    const live = TASKS.filter(x => t.abilityLive(x.key)).length;
    return `
      <header class="topbar">
        <div class="score">
          <span>Shift</span><b class="${t.shiftOver ? "hit" : ""}">${t.resolved}<i>/${TASKS.length} settled</i></b>
        </div>
        <div class="board">
          ${TASKS.map(x => {
            const st = t.status(x.key).st;
            return `<button type="button" class="chip st-${st}" style="--tone:var(--${x.tone})" data-act="tab" data-k="${x.key}"
              title="${esc(`${x.n} ${x.name}: ${st}. ${st === "done" ? `The Chef can't use ${x.ability}.` : `The Chef still has ${x.ability}.`}`)}">
              <em>${x.n}</em><span>${x.ability}</span></button>`;
          }).join("")}
        </div>
        <div class="lamps">
          <span class="lamp" title="The PCs on the shift, and their average level"><i class="fa-solid fa-users"></i>${t.partySize} × L${t.partyLevel}</span>
          <span class="lamp ${live < TASKS.length ? "lit" : ""}" title="Task abilities the Chef still has"><i class="fa-solid fa-utensils"></i>${live} left</span>
        </div>
        <button type="button" class="say" data-act="report" title="Post the shift so far to chat — what's done, not what's left"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Start a new shift" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  /* ---------------------------------------------------------- shared bits */
  taskHead(task, extra = "") {
    const t = this.t, st = t.status(task.key), ro = !t.editable;
    return `
      <section class="panel stake st-${st.st}" style="--tone:var(--${task.tone})">
        <h3><span class="eid">${task.n}</span>${task.name} <small>${task.job}</small>
          <span class="pill st-${st.st}">${st.st === "done" ? "Done" : st.st === "failed" ? "Failed" : "Open"}</span>
          ${t.imported ? `<button type="button" class="say" data-act="page" data-k="${PAGES[task.key]}" title="Open this area's journal page"><i class="fa-solid fa-book-open"></i></button>` : ""}
        </h3>
        <p class="why">${st.why}</p>
        <p class="ability ${t.abilityLive(task.key) ? "" : "gone"}"><b>At stake: ${task.ability}</b> ${task.gist}</p>
        <div class="btnrow">
          ${this.musicBtn(task.music)}
          ${extra}
          <span class="spacer"></span>
          <span class="subhead">Rule it yourself</span>
          ${["done", "failed"].map(v => `<button type="button" class="opt sm ${t.s.over[task.key] === v ? "on" : ""}" style="--tone:var(--${v === "done" ? "mint" : "ketchup"})"
            data-act="over" data-k="${task.key}" data-v="${v}" ${ro ? "disabled" : ""}>${v === "done" ? "Done" : "Failed"}</button>`).join("")}
        </div>
      </section>`;
  }
  musicBtn(key) {
    const cue = MUSIC[key], st = this.t.soundState(key);
    return `<button type="button" class="ghost sm snd ${st.playing ? "on" : ""}" data-act="music" data-k="${key}"
      ${!st.ok ? "disabled" : ""} title="${esc(st.ok ? `Playlist ${cue.list} — ${cue.where}. Starting it stops the other two.` : `"${cue.name}" isn't in this world`)}">
      <i class="fa-solid ${st.playing ? "fa-stop" : "fa-play"}"></i> ${esc(cue.name)}</button>`;
  }
  degBtns(act, key, cur, ro, extra = "", only = ["cs", "s", "f", "cf"]) {
    return only.map(d => `<button type="button" class="deg ${cur === d ? "on" : ""}" style="--tone:var(--${DEG[d].tone})"
      data-act="${act}" data-k="${key}" data-v="${d}" ${extra} ${ro ? "disabled" : ""} title="${DEG[d].label}">${DEG[d].short}</button>`).join("");
  }
  pcCell(p) {
    return `<span class="who"><img src="${esc(p.img)}" alt="">${esc(p.name)}</span>`;
  }
  noPcs() {
    return `<p class="note">No PCs found. Put them in the Party actor or assign characters to players, then <button type="button" class="ghost sm" data-act="party">re-read the party</button>.</p>`;
  }

  /* ------------------------------------------------------------ clock in */
  startTab(ro) {
    const t = this.t, s = t.s;
    return `
      <section class="panel" style="--tone:var(--yolk)">
        <h3>The night shift <small>${OPENING.pitch}</small>
          ${t.imported ? `<button type="button" class="say" data-act="page" data-k="${PAGES.background}" title="GM Background"><i class="fa-solid fa-book-open"></i></button>` : ""}
        </h3>
        <p class="text">${OPENING.background}</p>
        <p class="note"><b>How it works.</b> ${OPENING.rule}</p>
      </section>

      <section class="panel" style="--tone:var(--grape)">
        <h3>Getting them there
          <button type="button" class="say" data-act="posthook" title="Read the chosen hook to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <div class="btnrow">
          ${OPENING.hooks.map(h => `<button type="button" class="opt ${s.hook === h.key ? "on" : ""}" style="--tone:var(--grape)"
            data-act="hook" data-k="${h.key}" ${ro ? "disabled" : ""}>${h.label}</button>`).join("")}
        </div>
        ${OPENING.hooks.map(h => `<p class="boxed ${s.hook && s.hook !== h.key ? "dim" : ""}"><b>${h.label}.</b> ${h.text}</p>`).join("")}
        <p class="note">Use the glowing tear if you'd like it less dream-like.</p>
      </section>

      <section class="panel" style="--tone:var(--ketchup)">
        <h3>The tasks and what they cost the Chef <small>any order — the party goes where it likes</small></h3>
        <div class="stakes">
          ${TASKS.map(x => {
            const st = t.status(x.key);
            return `<button type="button" class="stakerow st-${st.st}" style="--tone:var(--${x.tone})" data-act="tab" data-k="${x.key}">
              <span class="eid">${x.n}</span>
              <span class="sname"><b>${x.name}</b><small>${x.job}</small></span>
              <span class="sab"><b>${x.ability}</b><small>${x.gist}</small></span>
              <span class="pill st-${st.st}">${st.st === "done" ? "Gone" : st.st === "failed" ? "He keeps it" : "Open"}</span>
            </button>`;
          }).join("")}
        </div>
        <p class="note">${OPENING.chef}</p>
        <p class="hint">Always his, whatever happens: ${ALWAYS.join(", ")}.</p>
      </section>

      <section class="panel" style="--tone:var(--denim)">
        <h3>On the shift <small>${t.partySize} PCs, average level ${t.partyLevel}</small>
          <button type="button" class="say" data-act="party" title="Re-read the party" ${ro ? "disabled" : ""}><i class="fa-solid fa-users-rays"></i></button>
        </h3>
        ${t.pcs.length ? `<div class="crew">${t.pcs.map(p => this.pcCell(p)).join("")}</div>` : this.noPcs()}
        ${t.partyLevel !== BOOK_LEVEL ? `<p class="carry"><i class="fa-solid fa-triangle-exclamation"></i> The session is written for 10th level. The DCs stay as printed; the threat on each fight is worked out for level ${t.partyLevel}.</p>` : ""}
        ${t.partySize >= 6 ? `<p class="carry"><i class="fa-solid fa-link"></i> Six PCs: the book makes the Clog elite. That's switched on in A2.</p>` : ""}
        <div class="btnrow">
          <button type="button" class="ghost" data-act="scene" title="Activate the map for everyone"><i class="fa-solid fa-map"></i> Activate the Waffle House</button>
          ${this.musicBtn("front")}
          ${t.imported ? `<button type="button" class="ghost" data-act="page" data-k="${PAGES.beginning}"><i class="fa-solid fa-book-open"></i> The Beginning</button>` : ""}
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------------- A1 */
  a1Tab(ro) {
    const t = this.t, a1 = t.s.a1, task = taskFor("a1");
    const helpers = t.a1Helpers();
    return `
      ${this.taskHead(task, `<button type="button" class="ghost sm" data-act="postcheck" data-k="a1"><i class="fa-solid fa-dice-d20"></i> Post the save</button>`)}
      <section class="panel" style="--tone:var(--denim)">
        <h3>Zeke, on break</h3>
        <p class="text">Zeke is (very unhelpfully) on break here. If questioned, he doesn't notice anything wrong with the Chef or the shadowy customers. He asks if the party would mind mopping the floors, as <q>his legs are totally growing roots into the floor right now.</q></p>
        <div class="loot ${a1.scour ? "claimed" : ""}">
          <button type="button" class="lootbtn" data-act="item" data-k="scour" title="Open the module's Scour item"><i class="fa-solid fa-cannabis"></i> Scour</button>
          <span>In exchange he offers some <q>totally wicked mushrooms</q> — they work as scour. One portion per PC: ${t.partySize}.</span>
          <button type="button" class="opt sm ${a1.scour ? "on" : ""}" data-act="scour" ${ro ? "disabled" : ""}>${a1.scour ? "Handed out" : "Hand out"}</button>
        </div>
      </section>

      <section class="panel" style="--tone:var(--denim)">
        <h3>Mopping the floors <small>10 minutes · DC 27 Fortitude each</small></h3>
        ${t.pcs.length ? `<div class="grid">
          ${t.pcs.map(p => {
            const r = a1.res[p.id];
            const helper = a1.help[p.id];
            const choices = r === "f" ? [...helpers, ...(helper ? [t.pcs.find(x => x.id === helper)].filter(Boolean) : [])] : [];
            return `<div class="gridrow">
              ${this.pcCell(p)}
              <div class="btnrow tight">
                <button type="button" class="deg ${r === "s" ? "on" : ""}" style="--tone:var(--mint)" data-act="a1res" data-k="${p.id}" data-v="s" ${ro ? "disabled" : ""}>Made it</button>
                <button type="button" class="deg ${r === "f" ? "on" : ""}" style="--tone:var(--syrup)" data-act="a1res" data-k="${p.id}" data-v="f" ${ro ? "disabled" : ""}>Failed</button>
              </div>
              <div class="btnrow tight">
                ${r === "f" ? (choices.length ? `<span class="subhead">Help from</span>${choices.map(h => `<button type="button" class="opt sm ${helper === h.id ? "on" : ""}" style="--tone:var(--denim)"
                  data-act="a1help" data-k="${p.id}" data-v="${h.id}" ${ro ? "disabled" : ""}>${esc(h.name)}</button>`).join("")}`
                  : `<span class="hint">Nobody left to help.</span>`) : ""}
                ${r === "f" && helper ? `<span class="subhead">Then</span>
                  <button type="button" class="deg ${a1.after[p.id] === "s" ? "on" : ""}" style="--tone:var(--mint)" data-act="a1after" data-k="${p.id}" data-v="s" ${ro ? "disabled" : ""}>Made it</button>
                  <button type="button" class="deg ${a1.after[p.id] === "f" ? "on" : ""}" style="--tone:var(--ketchup)" data-act="a1after" data-k="${p.id}" data-v="f" ${ro ? "disabled" : ""}>Still failed</button>` : ""}
              </div>
            </div>`;
          }).join("")}
        </div>` : this.noPcs()}
        <p class="note">Each PC who succeeds can help one who failed, once. If anyone still hasn't succeeded, the section fails. The book doesn't say how the help resolves — a reroll with Aid, or a straight pass — so record whatever you rule.</p>
      </section>`;
  }

  /* ---------------------------------------------------------------- A2 */
  a2Tab(ro) {
    const t = this.t, a2 = t.s.a2, task = taskFor("a2");
    const th = t.bathroomThreat();
    return `
      ${this.taskHead(task)}
      <section class="panel" style="--tone:var(--mint)">
        <h3>Something in the stalls <small>${th.xp} XP — ${th.label} for ${t.partySize} PCs at level ${t.partyLevel}</small></h3>
        <p class="text">The bathrooms are in an okay state. As the party begins freshening them up, the Clog and three mutated sewer oozes burst from the stalls and attack. The party has to defeat the sentient blob of sewage to finish cleaning the bathroom.</p>
        <div class="crew">
          <button type="button" class="mon" data-act="actor" data-k="clog"><i class="fa-solid fa-skull"></i>${t.eliteClog ? "Elite " : ""}The Clog <em>creature ${FOES.clog.level + (t.eliteClog ? 1 : 0)}</em></button>
          <button type="button" class="mon" data-act="actor" data-k="ooze"><i class="fa-solid fa-skull"></i>3 × Mutated Sewer Ooze <em>creature ${FOES.ooze.level}</em></button>
        </div>
        <div class="btnrow">
          <button type="button" class="opt sm ${t.eliteClog ? "on" : ""}" style="--tone:var(--mint)" data-act="elite" ${ro ? "disabled" : ""}
            title="The book makes the Clog elite for six adventurers. This also switches the Clog token on the map.">${t.eliteClog ? "✓ Elite Clog" : "Make the Clog elite"}</button>
          <button type="button" class="ghost sm" data-act="hide" data-v="1" ${ro ? "disabled" : ""} title="The module places them on the map in plain sight"><i class="fa-solid fa-eye-slash"></i> Hide them in the stalls</button>
          <button type="button" class="ghost sm" data-act="hide" data-v="0" ${ro ? "disabled" : ""}><i class="fa-solid fa-eye"></i> They burst out</button>
        </div>
        <p class="hint">${a2.elite === null ? `Elite is ${t.partySize >= 6 ? "on" : "off"} by party size; click to decide yourself.` : "Set by hand."} The Clog goal is to survive: it jumps stall to stall through the pipes, but it can't leave the bathroom.</p>
      </section>

      <section class="panel" style="--tone:var(--mint)">
        <h3>Knocked out by the Clog <small>more than one fails the section</small></h3>
        <div class="counter">
          <button type="button" class="opt" data-act="ko" data-v="-1" ${ro || !a2.ko ? "disabled" : ""}>−</button>
          <b class="${a2.ko > 1 ? "bad" : ""}">${a2.ko}</b>
          <button type="button" class="opt" data-act="ko" data-v="1" ${ro ? "disabled" : ""}>+</button>
          <span class="note">Only the Clog's knockouts count, not the oozes'.</span>
        </div>
        <div class="btnrow">
          <button type="button" class="${a2.won ? "opt on" : "primary"} sm" style="--tone:var(--mint)" data-act="won" ${ro ? "disabled" : ""}>${a2.won ? "✓ The Clog is defeated" : "The Clog is defeated"}</button>
        </div>
        <p class="note">Once defeated it turns into harmless piles of human waste, which still need cleaning up.</p>
      </section>`;
  }

  /* ---------------------------------------------------------------- A3 */
  a3Tab(ro) {
    const t = this.t, a3 = t.s.a3, task = taskFor("a3");
    const ok = a3.rolls.filter(r => DEG[r]?.ok).length;
    const karen = a3.rolls.some(r => !DEG[r]?.ok);
    return `
      ${this.taskHead(task, `<button type="button" class="ghost sm" data-act="postcheck" data-k="a3"><i class="fa-solid fa-dice-d20"></i> Post the checks</button>`)}
      <section class="panel" style="--tone:var(--grape)">
        <h3>The customers <small>three successful DC 27 Acrobatics or Diplomacy checks</small></h3>
        <p class="text">The customers here look shadowy and indistinct. They garble out orders in a language similar enough to Common.</p>
        <div class="tickets">
          ${a3.rolls.map((r, i) => `<span class="ticket" style="--tone:var(--${DEG[r].tone})">${i + 1}. ${DEG[r].label}</span>`).join("") || `<span class="hint">No checks yet.</span>`}
        </div>
        <div class="btnrow">
          <span class="subhead">Next check</span>
          ${["cs", "s", "f", "cf"].map(d => `<button type="button" class="deg" style="--tone:var(--${DEG[d].tone})" data-act="a3roll" data-v="${d}" ${ro || ok >= 3 || a3.karen === "stormed" ? "disabled" : ""}>${DEG[d].label}</button>`).join("")}
          <button type="button" class="ghost sm" data-act="a3undo" ${ro || !a3.rolls.length ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i> Undo</button>
        </div>
        <p class="hint">${ok} served.</p>
      </section>

      <section class="panel ${karen ? "" : "dimmed"}" style="--tone:var(--ketchup)">
        <h3>The Karen <small>${karen ? "she's here" : "turns up on a failure"}</small></h3>
        <p class="text">She complains first that her drink is empty, then that her food is too cold, then about a hair on her plate. She demands to see the manager — there isn't one in today — and threatens to leave a bad review on Yelp unless they appease her.</p>
        <div class="btnrow">
          <button type="button" class="opt ${a3.karen === "appeased" ? "on" : ""}" style="--tone:var(--mint)" data-act="karen" data-v="appeased" ${ro || !karen ? "disabled" : ""}>Charmed with good service</button>
          <button type="button" class="opt ${a3.karen === "stormed" ? "on" : ""}" style="--tone:var(--ketchup)" data-act="karen" data-v="stormed" ${ro || !karen ? "disabled" : ""}>She storms out</button>
        </div>
        <p class="note">If she storms out, the section fails. The book gives no check for charming her; a DC 27 Diplomacy, the shift's usual DC, fits.</p>
      </section>`;
  }

  /* ---------------------------------------------------------------- A4 */
  a4Tab(ro) {
    const t = this.t, a4 = t.s.a4, task = taskFor("a4");
    const rows = t.a4Rows();
    const running = t.timer;
    return `
      ${this.taskHead(task, `<button type="button" class="ghost sm" data-act="postcheck" data-k="a4"><i class="fa-solid fa-dice-d20"></i> Post the extra-time check</button>`)}
      <section class="panel" style="--tone:var(--syrup)">
        <h3>The register <small>no calculators · more than half wrong fails it</small></h3>
        <p class="text">Every PC rings up one order against a timer. A PC who succeeds at a DC 27 Arcana or DC 23 Accounting Lore check gets double the time. Deal more orders if you're feeling vindictive.</p>
        <div class="counter">
          <span class="subhead">Timer</span>
          <input type="range" min="10" max="30" step="5" value="${a4.secs}" data-act="secs" ${ro ? "disabled" : ""}>
          <b>${a4.secs}s</b>
          <span class="note">10 to 30 seconds, depending on how bad at math your party is and how mean you feel.</span>
        </div>
        ${rows.length ? rows.map((r, i) => `
          <div class="order ${r.res ? `res-${r.res}` : ""} ${running?.i === i ? "live" : ""}">
            <div class="ordertop">
              <span class="eid sm">${i + 1}</span>
              <select data-act="a4pc" data-k="${i}" ${ro ? "disabled" : ""}>
                ${t.pcs.map(p => `<option value="${p.id}" ${r.pc === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}
              </select>
              <select data-act="a4prob" data-k="${i}" ${ro ? "disabled" : ""}>
                ${PROBLEMS.map((pr, j) => `<option value="${j}" ${r.prob === j ? "selected" : ""}>Order ${j + 1}</option>`).join("")}
              </select>
              <span class="subhead">Extra time</span>
              <button type="button" class="deg ${r.aid === "s" ? "on" : ""}" style="--tone:var(--mint)" data-act="a4set" data-k="${i}" data-f="aid" data-v="s" ${ro ? "disabled" : ""}>Earned</button>
              <span class="spacer"></span>
              ${running?.i === i
                ? `<span class="wh-clock">${Math.max(0, Math.ceil((running.end - Date.now()) / 1000))}s</span>
                   <button type="button" class="ghost sm" data-act="stop"><i class="fa-solid fa-stop"></i> Stop</button>`
                : `<button type="button" class="primary sm" style="--tone:var(--syrup)" data-act="start" data-k="${i}" ${ro ? "disabled" : ""} title="Post the order to chat and start the clock"><i class="fa-solid fa-stopwatch"></i> Ring it up · ${t.rowSecs(r)}s</button>`}
              ${Array.isArray(a4.rows) && i >= t.pcs.length ? `<button type="button" class="say" data-act="a4del" data-k="${i}" title="Remove this order" ${ro ? "disabled" : ""}><i class="fa-solid fa-xmark"></i></button>` : ""}
            </div>
            <p class="q">${esc(PROBLEMS[r.prob].q)}</p>
            <p class="ans"><b>Answer</b> ${esc(PROBLEMS[r.prob].a)}</p>
            <div class="btnrow tight">
              <button type="button" class="deg ${r.res === "s" ? "on" : ""}" style="--tone:var(--mint)" data-act="a4set" data-k="${i}" data-f="res" data-v="s" ${ro ? "disabled" : ""}>Right</button>
              <button type="button" class="deg ${r.res === "f" ? "on" : ""}" style="--tone:var(--ketchup)" data-act="a4set" data-k="${i}" data-f="res" data-v="f" ${ro ? "disabled" : ""}>Wrong or too slow</button>
            </div>
          </div>`).join("") : this.noPcs()}
        <div class="btnrow">
          <button type="button" class="ghost sm" data-act="a4add" ${ro ? "disabled" : ""}><i class="fa-solid fa-plus"></i> Deal another order</button>
        </div>
        <p class="hint">Ringing up posts the order to chat — never the answer — and runs the clock here. Adapt the money to your home currency if you like.</p>
      </section>`;
  }

  /* ---------------------------------------------------------------- A5 */
  a5Tab(ro) {
    const t = this.t, task = taskFor("a5");
    const lead = t.a5Leaders();
    return `
      ${this.taskHead(task, `<button type="button" class="mon sm" data-act="actor" data-k="chef"><i class="fa-solid fa-smoking"></i> The Chef</button>`)}
      <section class="panel" style="--tone:var(--ketchup)">
        <h3>Smoke break <small>more than one ruined recipe fails it</small></h3>
        <p class="text">The Chef steps out for a smoke break, leaving the kitchen empty. The party picks the skill they'd like to roll for each dish. Guessing one of the dish's checks lowers its DC by 1; guessing both lowers it by 2. Any dish can be made with DC 23 Cooking Lore instead.</p>
        ${RECIPES.map(rec => {
          const x = t.recipe(rec.key), dc = t.recipeDc(rec.key);
          return `
          <div class="recipe ${x.d ? `res-${DEG[x.d].ok ? "s" : "f"}` : ""}">
            <div class="ordertop">
              <b class="dish">${rec.name}</b>
              <span class="dc">DC ${dc}</span>
              <span class="spacer"></span>
              <button type="button" class="say inline" data-act="postrecipe" data-k="${rec.key}" title="Post this check to chat"><i class="fa-solid fa-dice-d20"></i></button>
            </div>
            <p class="opts">${rec.skills.map(([sk, why]) => `<span><b>${sk}</b> ${why}</span>`).join("")}</p>
            <div class="btnrow tight">
              <span class="subhead">Guessed</span>
              ${[0, 1, 2].map(g => `<button type="button" class="opt sm ${(x.guess ?? 0) === g ? "on" : ""}" style="--tone:var(--yolk)"
                data-act="a5" data-k="${rec.key}" data-f="guess" data-v="${g}" ${ro ? "disabled" : ""}>${g === 0 ? "Neither" : g === 1 ? "One (−1)" : "Both (−2)"}</button>`).join("")}
              <span class="subhead">Rolls</span>
              ${[0, 1, 2].map(v => `<button type="button" class="opt sm ${(x.via ?? 0) === v ? "on" : ""}" style="--tone:var(--denim)"
                data-act="a5" data-k="${rec.key}" data-f="via" data-v="${v}" ${ro ? "disabled" : ""}>${t.recipeSkill(rec, v)}</button>`).join("")}
            </div>
            <div class="btnrow tight">
              <select data-act="a5pc" data-k="${rec.key}" ${ro ? "disabled" : ""}>
                <option value="">Who cooks it?</option>
                ${t.pcs.map(p => `<option value="${p.id}" ${x.pc === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}
              </select>
              ${this.degBtns("a5d", rec.key, x.d, ro)}
            </div>
          </div>`;
        }).join("")}
        <p class="note">The book doesn't say whether the guess lowers the Cooking Lore DC too. The console lowers it, since the guess is about the dish, not the skill.</p>
      </section>

      <section class="panel ${t.panEarned ? "" : "dimmed"}" style="--tone:var(--yolk)">
        <h3>The Good Ol' Pan <small>${t.panEarned ? "earned" : "every dish has to come out"}</small></h3>
        <p class="text">If every check succeeds, the Chef is very pleased when he gets back. He gives the party <b>“The Good Ol' Pan”</b> — a +2 striking frying pan (GM Core) — and points them toward the break room.</p>
        <div class="btnrow">
          <button type="button" class="lootbtn" data-act="item" data-k="pan" title="The module links a Striking (Greater) rune item here"><i class="fa-solid fa-gem"></i> The module's item</button>
        </div>
        <p class="hint">The module's link opens a Striking (Greater) rune. The book's pan is a +2 striking weapon; build one from a club and rename it if you'd rather match the book.</p>
      </section>

      <section class="panel" style="--tone:var(--yolk)">
        <h3>Best in the kitchen <small>gets the coupon in the Aftermath</small></h3>
        ${lead.length ? `<p class="text">${lead.length === 1 ? `<b>${esc(t.pcName(lead[0]))}</b> did best.` : `A tie: ${lead.map(id => `<b>${esc(t.pcName(id))}</b>`).join(", ")}. Pick on Closing Time.`}</p>` : `<p class="hint">Fills in as the dishes are rolled. Each PC's dishes are scored by degree.</p>`}
      </section>`;
  }

  /* ------------------------------------------------------- closing time */
  closeTab(ro) {
    const t = this.t, f = t.s.finale, th = t.chefThreat();
    const holder = t.couponHolder, lead = t.a5Leaders();
    return `
      <section class="panel" style="--tone:var(--ketchup)">
        <h3>…And the End <small>${t.shiftOver ? "the shift is over" : `${TASKS.length - t.resolved} task${TASKS.length - t.resolved > 1 ? "s" : ""} still open`}</small>
          ${t.imported ? `<button type="button" class="say" data-act="page" data-k="${PAGES.end}" title="Open the journal page"><i class="fa-solid fa-book-open"></i></button>` : ""}
          <button type="button" class="say" data-act="report" title="Post the shift report to chat"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="text">Once every task is completed or failed, the shift is over. Zeke clocks out immediately, leaving only the party and the Chef. The Chef says there's one last task: exterminating the rats. He readies his cleaver and charges.</p>
        <div class="crew">
          <button type="button" class="mon" data-act="actor" data-k="chef"><i class="fa-solid fa-skull"></i>The Chef <em>creature ${FOES.chef.level} · ${th.xp} XP — ${th.label} for ${t.partySize} PCs</em></button>
          ${this.musicBtn("kitchen")}
        </div>
      </section>

      <section class="panel" style="--tone:var(--ketchup)">
        <h3>What the Chef has left</h3>
        <div class="abilities">
          ${TASKS.map(x => {
            const live = t.abilityLive(x.key), st = t.status(x.key).st;
            return `<div class="abrow ${live ? "live" : "gone"}" style="--tone:var(--${x.tone})">
              <span class="eid">${x.n}</span>
              <span class="abname"><b>${x.ability}</b><small>${live ? x.gist : `Gone — ${x.job.toLowerCase()} done.`}</small></span>
              <span class="pill st-${st}">${live ? (st === "failed" ? "Failed task" : "Task open") : "Locked"}</span>
              ${live ? `<button type="button" class="ghost sm" data-act="ability" data-k="${esc(x.item)}" title="Post the ability from the Chef's sheet"><i class="fa-solid fa-comment"></i> Post</button>` : `<span></span>`}
            </div>`;
          }).join("")}
          ${ALWAYS.map(n => `<div class="abrow live always">
              <span class="eid sm">—</span>
              <span class="abname"><b>${n}</b><small>Always his.</small></span>
              <span></span>
              <button type="button" class="ghost sm" data-act="ability" data-k="${esc(n)}"><i class="fa-solid fa-comment"></i> Post</button>
            </div>`).join("")}
        </div>
        <p class="hint">A task left open still counts as his. Locked abilities stay on his sheet — the console just won't offer them; don't use them.</p>
      </section>

      <section class="panel" style="--tone:var(--yolk)">
        <h3>Aftermath
          ${t.imported ? `<button type="button" class="say" data-act="page" data-k="${PAGES.aftermath}" title="Open the journal page"><i class="fa-solid fa-book-open"></i></button>` : ""}
        </h3>
        <div class="btnrow">
          <button type="button" class="opt ${f.result === "won" ? "on" : ""}" style="--tone:var(--mint)" data-act="result" data-v="won" ${ro ? "disabled" : ""}>The Chef is defeated</button>
          <button type="button" class="opt ${f.result === "tpk" ? "on" : ""}" style="--tone:var(--ketchup)" data-act="result" data-v="tpk" ${ro ? "disabled" : ""}>TPK</button>
        </div>
        <p class="text">Either way, they wake up back home. Was it all a dream? Was any of it real? Who knows! But the party member who did best in the kitchen finds a strange piece of paper in their pocket: <b>the Waffle House Coupon</b>. Once per hour it summons Cooperative Waffles (Greater) (Treasure Vault). The waffles can't be sold, and vanish within an hour if they aren't eaten.</p>
        <div class="btnrow">
          <span class="subhead">Coupon goes to</span>
          ${t.pcs.map(p => `<button type="button" class="opt sm ${holder === p.id ? "on" : ""}" style="--tone:var(--yolk)" data-act="coupon" data-k="${p.id}" ${ro ? "disabled" : ""}
            title="${lead.includes(p.id) ? "Did best in the kitchen" : ""}">${lead.includes(p.id) ? "★ " : ""}${esc(p.name)}</button>`).join("")}
        </div>
        <div class="btnrow">
          <button type="button" class="ghost sm" data-act="waffles"><i class="fa-solid fa-book"></i> Cooperative Waffles (Greater)</button>
          <button type="button" class="ghost sm" data-act="postcoupon" ${!holder ? "disabled" : ""}><i class="fa-solid fa-comment"></i> Read it to the table</button>
        </div>
        ${!f.coupon && lead.length > 1 ? `<p class="hint">The kitchen was a tie — pick one.</p>` : ""}
      </section>`;
  }

  /* ------------------------------------------------------------ the table */
  tableTab(ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--yolk)">
        <h3>The map <small>one scene, 20 × 30</small></h3>
        <div class="btnrow">
          <button type="button" class="opt" data-act="scene"><i class="fa-solid fa-map"></i> Activate for everyone</button>
          <button type="button" class="ghost" data-act="sceneview"><i class="fa-solid fa-eye"></i> View it yourself</button>
          <button type="button" class="ghost" data-act="hide" data-v="1" ${ro ? "disabled" : ""}><i class="fa-solid fa-eye-slash"></i> Hide the bathroom foes</button>
          <button type="button" class="ghost" data-act="hide" data-v="0" ${ro ? "disabled" : ""}><i class="fa-solid fa-eye"></i> Reveal them</button>
        </div>
        <p class="hint">The module places the Clog and its three oozes in the bathrooms, and the Chef in the kitchen, all visible. Its map notes open each area's journal page.</p>
      </section>
      <section class="panel" style="--tone:var(--denim)">
        <h3>Music <small>starting one stops the other two</small></h3>
        ${Object.entries(MUSIC).map(([k, cue]) => `<div class="scenerow">${this.musicBtn(k)}<span>${cue.where} · playlist ${cue.list}</span></div>`).join("")}
      </section>
      <section class="panel" style="--tone:var(--ketchup)">
        <h3>Creatures and items</h3>
        <div class="crew">
          ${Object.keys(FOES).map(k => `<button type="button" class="mon" data-act="actor" data-k="${k}"><i class="fa-solid fa-skull"></i>${FOES[k].name} <em>creature ${FOES[k].level}</em></button>`).join("")}
        </div>
        <div class="btnrow">
          <button type="button" class="lootbtn" data-act="item" data-k="scour"><i class="fa-solid fa-cannabis"></i> Scour</button>
          <button type="button" class="lootbtn" data-act="item" data-k="pan"><i class="fa-solid fa-gem"></i> Striking (Greater)</button>
          <button type="button" class="lootbtn" data-act="waffles"><i class="fa-solid fa-book"></i> Cooperative Waffles (Greater)</button>
        </div>
      </section>
      <section class="panel" style="--tone:var(--grape)">
        <h3>Journal <small>Dungeon Design</small></h3>
        <div class="btnrow">
          ${[["background", "GM Background"], ["beginning", "The Beginning"], ...TASKS.map(x => [x.key, `${x.n}. ${x.name}`]), ["end", "…The End"], ["aftermath", "Aftermath"]]
            .map(([k, label]) => `<button type="button" class="ghost sm" data-act="page" data-k="${PAGES[k]}" ${t.imported ? "" : "disabled"}>${label}</button>`).join("")}
        </div>
      </section>
      ${t.s.log.length ? `<section class="panel" style="--tone:var(--muted)">
        <h3>Shift log</h3>
        <ul class="log">${t.s.log.slice(0, 12).map(l => `<li>${esc(l)}</li>`).join("")}</ul>
      </section>` : ""}`;
  }

  /* -------------------------------------------------------------- wiring */
  wire(root) {
    if (!root || root.dataset?.whWired === "1") return;
    if (root.dataset) root.dataset.whWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const d = btn.dataset, a = d.act;
      if (a === "tab") { t.s.tab = d.k; t.touch(); }
      else if (a === "over") t.setOver(d.k, d.v);
      else if (a === "hook") t.setHook(d.k);
      else if (a === "posthook") t.postHook();
      else if (a === "party") t.rereadParty();
      else if (a === "scour") t.toggleScour();
      else if (a === "a1res") t.a1Result(d.k, d.v);
      else if (a === "a1help") t.a1Help(d.k, d.v);
      else if (a === "a1after") t.a1After(d.k, d.v);
      else if (a === "ko") t.a2Ko(Number(d.v));
      else if (a === "won") t.a2Won();
      else if (a === "elite") t.setElite(!t.eliteClog);
      else if (a === "hide") t.setFoesHidden(d.v === "1");
      else if (a === "a3roll") t.a3Roll(d.v);
      else if (a === "a3undo") t.a3Undo();
      else if (a === "karen") t.a3Karen(d.v);
      else if (a === "a4set") t.a4Set(Number(d.k), d.f, d.v);
      else if (a === "a4add") t.a4Add();
      else if (a === "a4del") t.a4Remove(Number(d.k));
      else if (a === "start") t.startTimer(Number(d.k));
      else if (a === "stop") t.stopTimer();
      else if (a === "a5") t.a5Set(d.k, d.f, Number(d.v));
      else if (a === "a5d") t.a5Set(d.k, "d", d.v);
      else if (a === "postrecipe") t.postRecipe(d.k);
      else if (a === "postcheck") t.postTaskCheck(d.k);
      else if (a === "coupon") t.setCoupon(d.k);
      else if (a === "postcoupon") t.postCoupon();
      else if (a === "result") t.setResult(d.v);
      else if (a === "report") t.postReport();
      else if (a === "ability") t.postAbility(d.k);
      else if (a === "actor") t.openActor(d.k);
      else if (a === "item") t.openItem(d.k);
      else if (a === "waffles") t.openWaffles();
      else if (a === "page") t.openPage(d.k);
      else if (a === "scene") t.activateScene(false);
      else if (a === "sceneview") t.activateScene(true);
      else if (a === "music") t.toggleMusic(d.k);
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      const d = el.dataset;
      if (d.act === "secs") t.a4Secs(el.value);
      else if (d.act === "a4pc") t.a4Pick(Number(d.k), "pc", el.value);
      else if (d.act === "a4prob") t.a4Pick(Number(d.k), "prob", Number(el.value));
      else if (d.act === "a5pc") t.a5Set(d.k, "pc", el.value || null);
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.nightshift;
    return `<style>
      #wh-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #wh-console .window-content > * { background:transparent; }
      .wh { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --yolk:${p.yolk};
            --ketchup:${p.ketchup}; --syrup:${p.syrup}; --mint:${p.mint}; --denim:${p.denim}; --grape:${p.grape};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .wh * { box-sizing:border-box; }
      .wh button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; margin:0; }
      .wh button:hover:not(:disabled) { background:var(--hover); }
      .wh button:disabled { opacity:.4; cursor:not-allowed; }
      .wh select { background:var(--field); color:var(--ink); border:1px solid var(--line); border-radius:3px;
                   font-family:inherit; font-size:.74rem; height:auto; padding:.15rem .3rem; width:auto; }
      .wh select option { background:var(--field); color:var(--ink); }
      .wh input[type="range"] { accent-color:var(--syrup); width:9rem; margin:0; }
      .wh h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.05em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
               padding-bottom:.3rem; flex-wrap:wrap; }
      .wh h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .wh h1, .wh h2, .wh h4, .wh legend { color:var(--ink); }
      .wh q { quotes:"“" "”"; font-style:italic; }
      .wh .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem; background:var(--card); }
      .wh .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .wh .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .wh .panel.dimmed { opacity:.6; }
      .wh .warn { font-size:.78rem; line-height:1.45; color:var(--syrup); border:1px solid var(--syrup);
                  border-radius:3px; padding:.45rem .55rem; margin:0 0 .6rem; display:flex; gap:.45rem; align-items:flex-start; }
      .wh .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 7px; letter-spacing:.06em; font-weight:700; flex:none; }
      .wh .eid.sm { font-size:.62rem; padding:0 5px; background:var(--muted); }
      .wh .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .wh .say.inline { margin-left:.35rem; width:22px; height:20px; }
      .wh .say + .say { margin-left:.25rem; }
      .wh .boxed { font-size:.82rem; line-height:1.55; margin:.3rem 0 .4rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; }
      .wh .boxed b { font-style:normal; }
      .wh .boxed.dim { opacity:.45; }
      .wh .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .wh .note { font-size:.78rem; line-height:1.45; color:var(--muted); margin:.3rem 0 .2rem; }
      .wh .hint { font-size:.73rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .wh .subhead { font-size:.62rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .wh .spacer { flex:1; }
      .wh .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.4rem 0 .1rem; }
      .wh .btnrow.tight { margin:.15rem 0; }
      .wh .primary { background:var(--tone, var(--yolk)); border-color:var(--tone, var(--yolk));
                     color:var(--paper); font-weight:700; padding:.3rem .7rem; font-size:.76rem; }
      .wh .primary:hover:not(:disabled) { filter:brightness(1.15); background:var(--tone, var(--yolk)); }
      .wh .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .wh .ghost.sm, .wh .opt.sm, .wh .primary.sm, .wh .mon.sm { padding:.22rem .5rem; font-size:.7rem; }
      .wh .opt { padding:.28rem .6rem; font-size:.75rem; }
      .wh .opt.on { background:var(--tone, var(--yolk)); border-color:var(--tone, var(--yolk)); color:var(--paper); font-weight:600; }
      .wh .opt.on:hover:not(:disabled) { background:var(--tone, var(--yolk)); filter:brightness(1.12); }
      .wh .deg { padding:.18rem .5rem; font-size:.7rem; color:var(--tone); border-color:var(--tone); min-width:2.2rem; }
      .wh .deg.on { background:var(--tone); color:var(--paper); font-weight:700; }
      .wh .deg.on:hover:not(:disabled) { background:var(--tone); filter:brightness(1.12); }
      .wh .snd.on { color:var(--mint); border-color:var(--mint); }

      .wh .pill { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 7px; border-radius:10px;
                  border:1px solid var(--line); color:var(--muted); white-space:nowrap; flex:none; }
      .wh .pill.st-done { border-color:var(--mint); color:var(--mint); }
      .wh .pill.st-failed { border-color:var(--ketchup); color:var(--ketchup); }
      .wh h3 .pill { margin-left:auto; }
      .wh h3 .pill + .say { margin-left:.35rem; }
      .wh .why { font-size:.8rem; margin:.1rem 0 .35rem; color:var(--ink); }
      .wh .stake.st-done .why { color:var(--mint); }
      .wh .stake.st-failed .why { color:var(--ketchup); }
      .wh .ability { font-size:.78rem; line-height:1.45; margin:.2rem 0; padding:.35rem .5rem;
                     border:1px dashed var(--tone, var(--line)); border-radius:3px; background:var(--stripe); }
      .wh .ability b { color:var(--tone); margin-right:.3rem; }
      .wh .ability.gone { opacity:.6; text-decoration:line-through; }

      .wh .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .wh .score { display:flex; flex-direction:column; }
      .wh .score span { font-size:.56rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .wh .score b { font-size:1.2rem; line-height:1; color:var(--yolk); white-space:nowrap; }
      .wh .score b i { font-size:.68rem; font-style:normal; color:var(--muted); margin-left:.15rem; }
      .wh .score b.hit { color:var(--ketchup); }
      .wh .board { flex:1; display:flex; gap:4px; min-width:260px; }
      .wh .chip { flex:1; flex-direction:column; padding:.2rem .3rem; font-size:.66rem; line-height:1.15;
                  border-color:var(--line); border-top:3px solid var(--tone); }
      .wh .chip em { font-style:normal; font-weight:700; color:var(--tone); font-size:.6rem; letter-spacing:.06em; }
      .wh .chip span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
      .wh .chip.st-done span { text-decoration:line-through; color:var(--muted); }
      .wh .chip.st-done { border-color:var(--mint); border-top-color:var(--mint); }
      .wh .chip.st-failed { border-color:var(--ketchup); border-top-color:var(--ketchup); }
      .wh .chip.st-failed span { color:var(--ketchup); }
      .wh .lamps { display:flex; gap:.35rem; flex-wrap:wrap; }
      .wh .lamp { display:inline-flex; align-items:center; gap:.3rem; font-size:.67rem; text-transform:uppercase;
                  letter-spacing:.05em; color:var(--muted); border:1px solid var(--line); border-radius:10px; padding:2px 8px; white-space:nowrap; }
      .wh .lamp i { font-size:.6rem; opacity:.6; }
      .wh .lamp.lit { color:var(--yolk); border-color:var(--yolk); font-weight:700; }
      .wh .lamp.lit i { opacity:1; }

      .wh .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .wh .tab { flex:1; padding:.3rem .2rem; font-size:.74rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; min-width:0; }
      .wh .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; white-space:nowrap; }
      .wh .tab b i { font-size:.64rem; color:var(--tt, var(--muted)); }
      .wh .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .wh .tab.st-done small { color:var(--mint); }
      .wh .tab.st-failed small { color:var(--ketchup); }
      .wh .tab.on, .wh .tab.on:hover:not(:disabled) { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .wh .tab.on:hover:not(:disabled) { filter:brightness(1.1); }
      .wh .tab.on b i, .wh .tab.on small { color:var(--paper); opacity:.85; }

      .wh .crew { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.1rem 0 .45rem; }
      .wh .mon { font-size:.74rem; padding:.22rem .55rem; color:var(--ketchup); border-color:var(--ketchup); }
      .wh .mon em { color:var(--muted); font-style:normal; font-size:.68rem; }
      .wh .who { display:inline-flex; align-items:center; gap:.4rem; font-size:.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .wh .who img { width:26px; height:26px; border-radius:50%; border:1px solid var(--line); object-fit:cover; flex:none; }
      .wh .crew .who { border:1px solid var(--line); border-radius:14px; padding:2px 10px 2px 2px; }
      .wh .carry { font-size:.78rem; line-height:1.45; margin:.3rem 0; padding:.35rem .5rem;
                   border:1px dashed var(--tone, var(--line)); border-radius:3px; background:var(--stripe);
                   display:flex; gap:.45rem; align-items:flex-start; }
      .wh .carry i { color:var(--tone, var(--muted)); font-size:.7rem; margin-top:.15rem; }

      .wh .stakes { display:flex; flex-direction:column; gap:3px; }
      .wh .stakerow { display:grid; grid-template-columns:2.4rem 11rem 1fr auto; gap:.55rem; align-items:center;
                      text-align:left; justify-content:stretch; padding:.35rem .45rem; border-left:3px solid var(--tone); }
      .wh .stakerow small { display:block; font-size:.7rem; color:var(--muted); line-height:1.35; }
      .wh .stakerow .sab b { color:var(--tone); }
      .wh .stakerow.st-done .sab b { text-decoration:line-through; }

      .wh .loot { display:grid; grid-template-columns:auto 1fr auto; gap:.5rem; align-items:center;
                  border:1px solid var(--yolk); border-radius:3px; padding:.35rem .45rem; margin:.4rem 0;
                  font-size:.77rem; line-height:1.45; }
      .wh .loot.claimed { opacity:.6; }
      .wh .lootbtn { font-size:.74rem; padding:.22rem .55rem; color:var(--yolk); border-color:var(--yolk); white-space:nowrap; }

      .wh .grid { display:flex; flex-direction:column; gap:3px; }
      .wh .gridrow { display:grid; grid-template-columns:11rem auto 1fr; gap:.6rem; align-items:center;
                     padding:.25rem .35rem; border-top:1px solid var(--stripe); }

      .wh .counter { display:flex; align-items:center; gap:.6rem; margin:.3rem 0; flex-wrap:wrap; }
      .wh .counter b { font-size:1.3rem; min-width:1.5rem; text-align:center; color:var(--mint); }
      .wh .counter b.bad { color:var(--ketchup); }
      .wh .counter .opt { width:28px; padding:.15rem 0; font-size:.9rem; }
      .wh .counter .note { margin:0; }

      .wh .tickets { display:flex; gap:.3rem; flex-wrap:wrap; margin:.2rem 0; }
      .wh .ticket { font-size:.72rem; padding:.15rem .5rem; border:1px solid var(--tone); color:var(--tone); border-radius:3px; }

      .wh .order, .wh .recipe { border:1px solid var(--line); border-radius:3px; padding:.4rem .5rem; margin:.4rem 0; background:var(--stripe); }
      .wh .order.res-s, .wh .recipe.res-s { border-color:var(--mint); }
      .wh .order.res-f, .wh .recipe.res-f { border-color:var(--ketchup); }
      .wh .order.live { border-color:var(--syrup); box-shadow:0 0 0 1px var(--syrup) inset; }
      .wh .ordertop { display:flex; gap:.4rem; align-items:center; flex-wrap:wrap; }
      .wh .order .q { font-size:.8rem; line-height:1.45; margin:.35rem 0 .2rem; }
      .wh .order .ans { font-size:.76rem; margin:0 0 .2rem; color:var(--yolk); }
      .wh .order .ans b { font-size:.62rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin-right:.3rem; }
      .wh .wh-clock { font-size:1.1rem; font-weight:700; color:var(--syrup); font-variant-numeric:tabular-nums; min-width:2.6rem; text-align:right; }
      .wh .wh-clock.low { color:var(--ketchup); }
      .wh .recipe .dish { font-size:.86rem; }
      .wh .recipe .dc { font-size:.68rem; font-weight:700; color:var(--paper); background:var(--ketchup); border-radius:3px; padding:1px 6px; }
      .wh .recipe .opts { font-size:.75rem; color:var(--muted); margin:.25rem 0; display:flex; gap:1rem; flex-wrap:wrap; }
      .wh .recipe .opts b { color:var(--ink); }

      .wh .abilities { display:flex; flex-direction:column; gap:2px; }
      .wh .abrow { display:grid; grid-template-columns:2.4rem 1fr auto auto; gap:.55rem; align-items:center;
                   padding:.3rem .35rem; border-top:1px solid var(--stripe); }
      .wh .abrow .abname b { display:block; font-size:.82rem; color:var(--tone, var(--ink)); }
      .wh .abrow .abname small { font-size:.72rem; color:var(--muted); }
      .wh .abrow.gone { opacity:.5; }
      .wh .abrow.gone .abname b { text-decoration:line-through; }
      .wh .abrow.always .abname b { color:var(--muted); }

      .wh .scenerow { display:grid; grid-template-columns:13rem 1fr; gap:.6rem; align-items:center;
                      font-size:.78rem; color:var(--muted); margin:.2rem 0; }
      .wh .scenerow button { justify-content:flex-start; }
      .wh .log { margin:0; padding-left:1.1rem; font-size:.75rem; color:var(--muted); line-height:1.5; }

      @media (max-width:860px) {
        .wh .tabs { flex-wrap:wrap; }
        .wh .tab { flex:1 1 23%; }
        .wh .loot, .wh .scenerow, .wh .gridrow { grid-template-columns:1fr; }
        .wh .stakerow { grid-template-columns:2.4rem 1fr auto; }
        .wh .stakerow .sab small { display:none; }
      }
    </style>`;
  }
}

if (AppV2) {
  WHApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  if (!game.user.isGM) return ui.notifications.warn("The Waffle House console is for the GM — it shows every answer and what the Chef has left.");
  registerSetting();
  let state = game.settings.get(WH_NS, WH_KEY);
  if (!state) {
    state = blankState(detectPCs());
    await game.settings.set(WH_NS, WH_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  /* A re-run replaces the old window rather than stacking a second one. */
  globalThis.__whShift?.stopTimer?.(false);
  const run = new Shift(state);
  globalThis.__whShift = run;
  const app = new WHApp(run);

  if (!globalThis.__whHook) {
    globalThis.__whHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== WH_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      const cur = globalThis.__whShift;
      if (fresh && cur) { cur.state = fresh; cur.render(); }
    });
  }
  /* Playlist changes made from the sidebar have to repaint the play buttons. */
  if (!globalThis.__whSoundHook) {
    globalThis.__whSoundHook = Hooks.on("updatePlaylistSound", () => globalThis.__whShift?.render());
  }
  app.render(true);
})();
