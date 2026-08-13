/* ============================================================================
   PARTY DOWNTIME PLANNER — PF2e (Remaster)
   Foundry VTT v11 / v12 / v13 / v14
   ----------------------------------------------------------------------------
   Paste this whole file into a new Macro (Type: Script) and execute it.
   Give the macro to your players — this one is meant to be run by them.

   Players plan their own character's downtime; the GM owns the calendar.
   State lives in a hidden world setting. Players can't write world settings,
   so a player's edits are relayed over game.socket to the GM's client, which
   validates ownership and performs the write. No module needs installing.

   Everything here is rules as written by default. Three optional house rules
   ship switched off, and only the GM can turn them on:
     · Dedicated Study — raise a Lore during downtime, at the cost of Earn Income
     · Crafting at 75% total with a formula and a background reason
     · Additional Lore may be taken for a Lore you already have
   Search HOUSE RULE to find them. With all three off, the planner computes
   nothing the Player Core doesn't.
   ============================================================================ */

/* Set to "parchment" for a paper panel, or "dark" to sit inside Foundry's
   dark theme. */
const THEME = "parchment";

const PALETTES = {
  parchment: {
    paper: "#efe6d8", card: "#fbf7f0", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
    track: "rgba(0,0,0,.14)", stripe: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.07)",
    field: "#fffdf8", rust: "#95381f", ember: "#a45c14", moss: "#4b5a34",
    slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a15", teal: "#1f5f5b"
  },
  dark: {
    paper: "#1f1d1b", card: "#2a2724", ink: "#ece5da", line: "#544d44", muted: "#a4988a",
    track: "rgba(255,255,255,.12)", stripe: "rgba(255,255,255,.04)", hover: "rgba(255,255,255,.08)",
    field: "#171513", rust: "#d4664a", ember: "#e0a052", moss: "#96b06a",
    slate: "#7fa0bb", plum: "#b98ab0", gold: "#d8b545", teal: "#63b8b0"
  }
};

const SETTING_NS = "world";
const SETTING_KEY = "pf2eDowntimePlan";
const SETTING_ID = `${SETTING_NS}.${SETTING_KEY}`;

/* Foundry relays any socket event namespaced under module.* or system.*,
   whether or not a module by that name is installed. */
const SOCKET = "module.pf2e-downtime-planner";

const MAX_PCS = 8;
const DEGREES = ["cf", "f", "s", "cs"];
const DEGREE_LABEL = { cs: "Crit Success", s: "Success", f: "Failure", cf: "Crit Failure" };
const RANKS = ["Untrained", "Trained", "Expert", "Master", "Legendary"];

/* ------------------------------------------------------------- rules tables */

/* Level-based DCs, indexed by level 0–25. */
const LEVEL_DC = [14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30,
                  31, 32, 34, 35, 36, 38, 39, 40, 42, 44, 46, 48, 50];
const levelDC = (lvl) => LEVEL_DC[Math.max(0, Math.min(25, Math.round(lvl || 0)))];

/* Income Earned, in copper per day: [failure, trained, expert, master, legendary].
   Row 21 is the book's "20+" row, used only by a critical success at task 20. */
const INCOME = {
  0: [1, 5, 5, 5, 5],
  1: [2, 20, 20, 20, 20],
  2: [4, 30, 30, 30, 30],
  3: [8, 50, 50, 50, 50],
  4: [10, 70, 80, 80, 80],
  5: [20, 90, 100, 100, 100],
  6: [30, 150, 200, 200, 200],
  7: [40, 200, 250, 250, 250],
  8: [50, 250, 300, 300, 300],
  9: [60, 300, 400, 400, 400],
  10: [70, 400, 500, 600, 600],
  11: [80, 500, 600, 800, 800],
  12: [90, 600, 800, 1000, 1000],
  13: [100, 700, 1000, 1500, 1500],
  14: [150, 800, 1500, 2000, 2000],
  15: [200, 900, 2000, 2800, 2800],
  16: [250, 1000, 2500, 3600, 4000],
  17: [300, 1200, 3000, 4500, 5500],
  18: [400, 1500, 4500, 7000, 9000],
  19: [600, 2000, 6000, 10000, 13000],
  20: [800, 3000, 7500, 15000, 20000],
  21: [800, 4000, 9000, 17500, 30000]
};
const incomeRow = (lvl) => INCOME[Math.max(0, Math.min(21, Math.round(lvl || 0)))];

/* Copper earned per day at a given task level, proficiency rank, and degree. */
function earnPerDay(taskLevel, rank, degree) {
  if (degree === "cf") return 0;
  if (degree === "f") return incomeRow(taskLevel)[0];
  const lvl = degree === "cs" ? taskLevel + 1 : taskLevel;
  return incomeRow(lvl)[Math.max(1, Math.min(4, rank || 1))];
}

/* Learn a Spell, in copper, by spell rank (index 0 = cantrip). */
const SPELL_COST = [100, 200, 600, 1600, 3600, 7000, 14000, 30000, 65000, 150000, 700000];

/* The optional house rules, every one of them off until a GM says otherwise.
   An activity or a field carrying a `house` key is hidden while its rule is
   off, and the derived rules below check `planner.on(key)` before they bite. */
const HOUSE = {
  study: {
    label: "Dedicated Study",
    blurb: "Raise a Lore during downtime — 2 / 4 / 8 weeks for expert, master, legendary. No Earn Income during those weeks, and the rank lends nothing to it afterwards."
  },
  craft75: {
    label: "Crafting at 75%",
    blurb: "With the formula and a background reason, an item costs 75% of Price in total instead of 100%. Half is still due up front."
  },
  lore: {
    label: "Additional Lore, for a Lore you have",
    blurb: "The feat may be taken for a Lore you already have, keeping its automatic scaling. Reference only — it changes nothing the planner computes."
  }
};

/* HOUSE RULE — Dedicated Study. Raise a Lore during downtime without spending a
   feat or a skill increase. Level requirements are absolute; the teacher or
   library is the real gate, and the GM has to have established one in play. */
const STUDY = {
  2: { rank: 2, label: "Expert", days: 14, minLevel: 3 },
  3: { rank: 3, label: "Master", days: 28, minLevel: 7 },
  4: { rank: 4, label: "Legendary", days: 56, minLevel: 15 }
};
const STUDY_TRANSFER_DAYS = 7;

/* -------------------------------------------------------------- activities */
/* `fields` drives the config row generically. `type` is number, text, select,
   skill (the actor's trained skills), or lore (the actor's Lore skills). */

const ACTS = {
  income: {
    label: "Earn Income", icon: "fa-solid fa-coins", tone: "gold", check: true,
    blurb: "One check for the whole stretch, then that much every day you keep at it. A critical failure ends the job on the spot.",
    fields: [
      { k: "skill", label: "Skill", type: "skill", trainedOnly: true, best: true },
      { k: "task", label: "Task level", type: "number", min: 0, max: 25, def: 0 },
      { k: "what", label: "The work", type: "text", placeholder: "Scribing for the magistrate" }
    ],
    dc: (cfg) => levelDC(cfg.task),
    minDays: 1
  },

  study: {
    label: "Dedicated Study", icon: "fa-solid fa-book-journal-whills", tone: "plum", house: "study",
    blurb: "Raise a Lore without spending a feat or a skill increase. Needs a teacher or library that actually knows the subject at the rank you're reaching for — ask the GM before committing days.",
    fields: [
      { k: "lore", label: "Lore", type: "lore" },
      { k: "rank", label: "Target rank", type: "select", def: "2",
        options: [["2", "Expert — 2 weeks, level 3+"], ["3", "Master — 4 weeks, level 7+"], ["4", "Legendary — 8 weeks, level 15+"]] },
      { k: "teacher", label: "Teacher or library", type: "text", placeholder: "Igawa Jubei's collection" }
    ],
    minDays: 1
  },

  craft: {
    label: "Craft", icon: "fa-solid fa-hammer", tone: "rust", check: true,
    blurb: "Four days minimum, half the Price in materials up front. Extra days chip away at what's left to pay.",
    fields: [
      { k: "item", label: "Item", type: "text", placeholder: "+1 striking longsword" },
      { k: "ilvl", label: "Item level", type: "number", min: 0, max: 25, def: 1 },
      { k: "price", label: "Price (gp)", type: "number", min: 0, max: 100000, def: 0 },
      { k: "skill", label: "Skill", type: "skill", trainedOnly: true, def: "crafting" },
      /* HOUSE RULE — 75% total with a formula and a background reason. Hidden
         unless the GM has switched the rule on; the 50% up front is unchanged
         either way, and only the balance owed shrinks. */
      { k: "hr75", label: "House rule: 75% total", type: "select", def: "0", house: "craft75",
        options: [["0", "No — standard 50% + 50%"], ["1", "Yes — formula + background reason"]] }
    ],
    dc: (cfg) => levelDC(cfg.ilvl),
    minDays: 4
  },

  subsist: {
    label: "Subsist", icon: "fa-solid fa-campground", tone: "moss", check: true,
    blurb: "Food and shelter for yourself. On a critical success you cover somebody else too, or eat well for once.",
    fields: [
      { k: "skill", label: "Skill", type: "skill", trainedOnly: false, def: "survival" },
      { k: "dc", label: "DC", type: "number", min: 5, max: 60, def: 15 },
      { k: "where", label: "Where", type: "text", placeholder: "The hinterlands" }
    ],
    dc: (cfg) => cfg.dc,
    minDays: 1
  },

  rest: {
    label: "Long-Term Rest", icon: "fa-solid fa-bed", tone: "teal",
    blurb: "A full day of uninterrupted rest heals double a night's recovery. No check, no roll.",
    fields: [{ k: "note", label: "Note", type: "text", placeholder: "Recovering from the wight" }],
    minDays: 1
  },

  retrain: {
    label: "Retraining", icon: "fa-solid fa-rotate", tone: "slate",
    blurb: "Swap out a choice you regret. Usually needs a teacher, and the GM may charge for one.",
    fields: [
      { k: "what", label: "Retraining", type: "select", def: "feat",
        options: [["feat", "A feat — 1 week"], ["skill", "A skill increase — 1 week"], ["feature", "A class feature — a month or more"]] },
      { k: "from", label: "From", type: "text", placeholder: "Toughness" },
      { k: "to", label: "To", type: "text", placeholder: "Fleet" }
    ],
    minDays: 7
  },

  spell: {
    label: "Learn a Spell", icon: "fa-solid fa-wand-sparkles", tone: "plum", check: true,
    blurb: "Add a spell to your repertoire or book from a willing teacher or a written source. Failure costs you nothing but the materials.",
    fields: [
      { k: "spell", label: "Spell", type: "text", placeholder: "Heal" },
      { k: "rank", label: "Rank", type: "number", min: 0, max: 10, def: 1 },
      { k: "skill", label: "Tradition skill", type: "skill", trainedOnly: true, def: "arcana" }
    ],
    dc: (cfg) => levelDC(Math.max(1, (Number(cfg.rank) || 1) * 2 - 1)),
    minDays: 1
  },

  disease: {
    label: "Treat Disease", icon: "fa-solid fa-staff-snake", tone: "moss", check: true,
    blurb: "Eight hours caring for one patient. Success improves their next save against the disease.",
    fields: [
      { k: "patient", label: "Patient", type: "text", placeholder: "Mama Bao" },
      { k: "dc", label: "Disease DC", type: "number", min: 5, max: 60, def: 20 },
      { k: "skill", label: "Skill", type: "skill", trainedOnly: true, def: "medicine" }
    ],
    dc: (cfg) => cfg.dc,
    minDays: 1
  },

  forgery: {
    label: "Create Forgery", icon: "fa-solid fa-feather-pointed", tone: "slate", check: true, secret: true,
    blurb: "A day's work and a sample to copy from. The GM rolls this one in secret and compares it to whoever reads the thing.",
    fields: [
      { k: "doc", label: "Document", type: "text", placeholder: "A magistrate's writ" },
      { k: "dc", label: "DC", type: "number", min: 5, max: 60, def: 20 },
      { k: "skill", label: "Skill", type: "skill", trainedOnly: true, def: "society" }
    ],
    dc: (cfg) => cfg.dc,
    minDays: 1
  },

  research: {
    label: "Research a Topic", icon: "fa-solid fa-magnifying-glass", tone: "teal", check: true,
    blurb: "A library, an archive, or somebody who was there. Each day of digging turns up a little more.",
    fields: [
      { k: "topic", label: "Topic", type: "text", placeholder: "The Wall of Ghosts" },
      { k: "dc", label: "DC", type: "number", min: 5, max: 60, def: 18 },
      { k: "skill", label: "Skill", type: "skill", trainedOnly: false, def: "society" }
    ],
    dc: (cfg) => cfg.dc,
    minDays: 1
  },

  gather: {
    label: "Gather Information", icon: "fa-solid fa-comments", tone: "ember", check: true,
    blurb: "Work the taverns and the market. Slower and more thorough than the exploration version.",
    fields: [
      { k: "about", label: "About", type: "text", placeholder: "Who bought the lumber camp" },
      { k: "dc", label: "DC", type: "number", min: 5, max: 60, def: 18 },
      { k: "skill", label: "Skill", type: "skill", trainedOnly: false, def: "diplomacy" }
    ],
    dc: (cfg) => cfg.dc,
    minDays: 1
  },

  repair: {
    label: "Repair", icon: "fa-solid fa-screwdriver-wrench", tone: "rust", check: true,
    blurb: "Ten minutes and a repair kit per attempt. Listed here because downtime is when the whole party's kit gets seen to.",
    fields: [
      { k: "item", label: "Item", type: "text", placeholder: "Dented breastplate" },
      { k: "dc", label: "DC", type: "number", min: 5, max: 60, def: 15 },
      { k: "skill", label: "Skill", type: "skill", trainedOnly: true, def: "crafting" }
    ],
    dc: (cfg) => cfg.dc,
    minDays: 1
  },

  other: {
    label: "Something Else", icon: "fa-solid fa-pen", tone: "muted", check: true,
    blurb: "Anything the list doesn't cover. Write down what you're doing and settle it with the GM.",
    fields: [
      { k: "what", label: "Doing what", type: "text", placeholder: "Sitting with Goh by the river" },
      { k: "dc", label: "DC (optional)", type: "number", min: 0, max: 60, def: 0 },
      { k: "skill", label: "Skill (optional)", type: "skill", trainedOnly: false }
    ],
    dc: (cfg) => (Number(cfg.dc) > 0 ? Number(cfg.dc) : null),
    minDays: 1
  }
};

/* What each degree means, per activity. Player-facing, so it says what happens
   rather than quoting a table. */
const OUTCOMES = {
  income: {
    cs: "Outstanding work — paid at one task level higher, every day.",
    s: "Competent work — paid the going rate, every day.",
    f: "Shoddy work — a pittance per day.",
    cf: "Fired on the spot. Nothing earned, and the job is over."
  },
  craft: {
    cs: "Made, and the balance drops faster for every extra day you put in.",
    s: "Made. Pay the balance, or keep working to whittle it down.",
    f: "Not finished. You can salvage the materials.",
    cf: "Not finished, and a tenth of the materials are ruined."
  },
  subsist: {
    cs: "Enough for you and one other, or you eat and sleep comfortably.",
    s: "Enough for yourself.",
    f: "Exposed and underfed — fatigued until you find proper food and shelter.",
    cf: "Nothing found, and something found you instead."
  },
  spell: {
    cs: "Learned, and the materials go unspent.",
    s: "Learned. The materials are spent.",
    f: "Not learned. The materials are spent, but you can try again after a level-up.",
    cf: "Not learned, materials spent, and you can't retry until you gain a level."
  },
  disease: {
    cs: "+4 circumstance bonus to the patient's next save against the disease.",
    s: "+2 circumstance bonus to the patient's next save.",
    f: "No change either way.",
    cf: "−2 circumstance penalty to the patient's next save."
  },
  forgery: {
    cs: "Convincing enough that a reader is certain it's genuine.",
    s: "Passes unless the reader already has reason to be suspicious.",
    f: "A careful reader will spot it.",
    cf: "Obviously fake to anyone who looks."
  },
  research: {
    cs: "A real find — two steps forward.",
    s: "Something useful turns up.",
    f: "A day lost to dead ends.",
    cf: "You take a wrong turn and have to unlearn it."
  },
  gather: {
    cs: "You get the answer, and something nobody meant to tell you.",
    s: "You get the answer.",
    f: "Nothing but rumour.",
    cf: "Bad information, confidently given — and someone noticed you asking."
  },
  repair: {
    cs: "10 Hit Points restored, +10 per rank above trained.",
    s: "5 Hit Points restored, +5 per rank above trained.",
    f: "No progress.",
    cf: "2d6 damage dealt to the item."
  }
};

/* ------------------------------------------------------------------ helpers */
const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
const esc = (s) => (foundry.utils?.escapeHTML
  ? foundry.utils.escapeHTML(String(s ?? ""))
  : String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
const titleize = (slug) => String(slug).split("-").map(cap).join(" ");
const uid = () => (foundry.utils?.randomID ? foundry.utils.randomID(10) : Math.random().toString(36).slice(2, 12));

/* Copper to "1 gp 5 sp". */
function coin(cp) {
  cp = Math.round(cp || 0);
  if (!cp) return "—";
  const neg = cp < 0; cp = Math.abs(cp);
  const gp = Math.floor(cp / 100), sp = Math.floor((cp % 100) / 10), c = cp % 10;
  const bits = [];
  if (gp) bits.push(`${gp.toLocaleString()} gp`);
  if (sp) bits.push(`${sp} sp`);
  if (c) bits.push(`${c} cp`);
  return (neg ? "−" : "") + bits.join(" ");
}
const days2 = (n) => `${n} ${n === 1 ? "day" : "days"}`;
function weeksish(n) {
  if (n % 7 === 0 && n >= 7) { const w = n / 7; return `${w} ${w === 1 ? "week" : "weeks"}`; }
  return days2(n);
}

/* PF2e inline check code, so a posted card is rollable by whoever gets it. */
function checkCode(slug, dc, label, secret) {
  const traits = ["skill", secret ? "secret" : null].filter(Boolean).join(",");
  return `@Check[${slug}|dc:${dc}${traits ? `|traits:${traits}` : ""}${label ? `|name:${label}` : ""}]`;
}

/* --------------------------------------------------------------- actor data */

function pickArt(actor) {
  const token = actor.prototypeToken?.texture?.src ?? "";
  const usable = token && !/\.(webm|mp4|m4v)$/i.test(token) && !token.includes("*");
  return usable ? token : (actor.img || "icons/svg/mystery-man.svg");
}

/* A Lore's rank lives on the Lore *item* in PF2e; the statistic doesn't always
   carry one on older cores, so the item wins where it exists. */
function rankOf(actor, slug, st) {
  const lore = (actor?.itemTypes?.lore ?? []).find(i => (i.slug ?? i.name?.toLowerCase().replace(/\s+/g, "-")) === slug);
  const fromItem = lore?.system?.proficient?.value;
  if (Number.isInteger(fromItem)) return fromItem;
  if (Number.isInteger(st?.rank)) return st.rank;
  if (Number.isInteger(st?.proficient)) return st.proficient;
  return 1;
}

/* Rebuilt once per actor per render — the skill list is read by every option of
   every select, and recomputing it each time is the difference between a snappy
   window and a visible stutter on a six-row plan. */
const SKILL_CACHE = new Map();
const clearSkillCache = () => SKILL_CACHE.clear();

function skillsFor(actor) {
  if (!actor) return [];
  if (SKILL_CACHE.has(actor.id)) return SKILL_CACHE.get(actor.id);
  const built = buildSkills(actor);
  SKILL_CACHE.set(actor.id, built);
  return built;
}

function buildSkills(actor) {
  const src = actor?.skills ?? {};
  const out = [];
  for (const [slug, st] of Object.entries(src)) {
    if (!st) continue;
    const lore = st.lore ?? /-lore$/.test(slug);
    out.push({
      slug,
      label: st.label ?? titleize(slug),
      rank: rankOf(actor, slug, st),
      mod: st.mod ?? st.totalModifier ?? st.value ?? 0,
      lore
    });
  }
  /* Ordinary skills first, then Lores, each alphabetical. */
  return out.sort((a, b) => (a.lore === b.lore ? a.label.localeCompare(b.label) : (a.lore ? 1 : -1)));
}

const loresFor = (actor) => skillsFor(actor).filter(s => s.lore);

function pcInfo(actor) {
  const d = actor.system?.details ?? {};
  return {
    name: actor.name,
    actorId: actor.id,
    img: pickArt(actor),
    level: d.level?.value ?? 1,
    cls: d.class?.name ?? actor.class?.name ?? "",
    ancestry: d.ancestry?.name ?? actor.ancestry?.name ?? "",
    con: actor.system?.abilities?.con?.mod ?? 0
  };
}

/* Companions and utility actors are player-owned too, so ownership alone isn't
   enough to call something a party member. An eidolon is a character-type actor
   in PF2e, which is why the class is checked as well as the type. */
const NON_PC_TYPES = new Set(["familiar", "eidolon", "npc", "hazard", "loot", "vehicle", "party", "army"]);
function isPlayerCharacter(a) {
  if (!a?.id) return false;
  if (NON_PC_TYPES.has(a.type)) return false;
  if (a.type !== "character" && a.type !== "PC") return false;
  if (/eidolon|animal companion/i.test(a.system?.details?.class?.name ?? "")) return false;
  return true;
}

/* The party actor is the answer wherever a world has one — it is the list the
   table already curates, and scanning the directory on top of it drags in
   eidolons, companions, and whatever utility actors happen to be player-owned.
   The fallbacks below only run in a world with no party actor at all. */
function detectPCs() {
  const party = game.actors.party ?? game.actors.find(a => a.type === "party");
  const members = [...(party?.members ?? [])].filter(isPlayerCharacter);
  if (members.length) return members.slice(0, MAX_PCS).map(pcInfo);

  const seen = new Map();
  const add = (a) => { if (isPlayerCharacter(a) && !seen.has(a.id)) seen.set(a.id, pcInfo(a)); };
  for (const u of game.users) if (!u.isGM) add(u.character);
  if (seen.size < MAX_PCS) {
    for (const a of game.actors) {
      if (seen.size >= MAX_PCS) break;
      if (a.hasPlayerOwner) add(a);
    }
  }
  return [...seen.values()].slice(0, MAX_PCS);
}

const ownsActor = (user, actorId) => {
  const a = game.actors.get(actorId);
  return !!a && (user.isGM || a.testUserPermission(user, "OWNER"));
};
const myPCs = (pcs) => pcs.filter(p => ownsActor(game.user, p.actorId));

/* ------------------------------------------------------------------- state */

function blankPeriod(n) {
  return { label: `Downtime ${n}`, days: 7, plans: {} };
}
function blankState() {
  return {
    v: 1,
    period: 1,
    settlement: 5,
    /* Rules as written until a GM opts in. */
    house: Object.fromEntries(Object.keys(HOUSE).map(k => [k, false])),
    periods: { 1: blankPeriod(1) },
    study: {},
    ui: {}
  };
}
/* A skill or lore select has to be *stored* as well as shown. Resolving it
   against the actor here — rather than letting the markup fall back to the
   first option — is what keeps a freshly added row rollable before anyone has
   touched the dropdown. */
function blankRow(act, actorId) {
  const def = ACTS[act];
  const actor = actorId ? game.actors.get(actorId) : null;
  const cfg = {};
  for (const f of def.fields) {
    if (f.type === "skill" || f.type === "lore") {
      const opts = (f.type === "lore" ? loresFor(actor) : skillsFor(actor))
        .filter(s => !f.trainedOnly || s.rank >= 1);
      /* `best` means "whatever pays most" — the right opening guess for Earn
         Income, where alphabetical order would land on Acrobatics. */
      const top = f.best ? [...opts].sort((a, b) => b.rank - a.rank)[0] : null;
      const pick = opts.find(s => s.slug === f.def) ?? top ?? opts[0];
      if (pick) cfg[f.k] = f.type === "lore" ? pick.label : pick.slug;
      else if (f.def !== undefined) cfg[f.k] = f.def;
      continue;
    }
    if (f.def !== undefined) cfg[f.k] = f.def;
  }
  return { id: uid(), act, days: def.minDays ?? 1, cfg, degree: null, done: false, note: "" };
}

function registerSetting() {
  if (game.settings.settings.has(SETTING_ID)) return;
  game.settings.register(SETTING_NS, SETTING_KEY, {
    name: "Party downtime plan",
    scope: "world",
    config: false,
    type: Object,
    default: null
  });
}
const loadState = () => {
  const raw = game.settings.get(SETTING_NS, SETTING_KEY);
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return parsed ? foundry.utils.mergeObject(blankState(), parsed, { inplace: false }) : blankState();
};

/* --------------------------------------------------------------- mutations
   Every change to the plan goes through one of these. The GM's client runs
   them locally; a player's client sends the same op over the socket and the
   GM runs it there, so there is exactly one implementation of each rule. */

function planFor(s, actorId) {
  const p = s.periods[String(s.period)] ??= blankPeriod(s.period);
  return (p.plans[actorId] ??= { rows: [] });
}
function studyFor(s, actorId) {
  return (s.study[actorId] ??= { held: null, prevHeld: null });
}

const OPS = {
  addRow(s, { actorId, act }) {
    planFor(s, actorId).rows.push(blankRow(act, actorId));
  },
  setRow(s, { actorId, rowId, patch }) {
    const row = planFor(s, actorId).rows.find(r => r.id === rowId);
    if (!row) return;
    if (patch.cfg) Object.assign(row.cfg, patch.cfg);
    for (const k of ["days", "degree", "done", "note"]) if (k in patch) row[k] = patch[k];
    if (row.days != null) row.days = Math.max(0, Math.min(365, Math.round(row.days)));
  },
  delRow(s, { actorId, rowId }) {
    const plan = planFor(s, actorId);
    plan.rows = plan.rows.filter(r => r.id !== rowId);
  },
  clearActor(s, { actorId }) {
    planFor(s, actorId).rows = [];
  },
  /* Dedicated Study is the one thing that outlives a downtime period, so
     completing it is its own explicit, reversible step. */
  completeStudy(s, { actorId, lore, rank }) {
    const st = studyFor(s, actorId);
    st.prevHeld = st.held ?? null;
    st.held = { lore, rank: Number(rank) };
  },
  undoStudy(s, { actorId }) {
    const st = studyFor(s, actorId);
    st.held = st.prevHeld ?? null;
    st.prevHeld = null;
  },
  /* GM only, below. */
  setPeriod(s, { n }) {
    s.period = Math.max(1, Math.round(n));
    s.periods[String(s.period)] ??= blankPeriod(s.period);
  },
  setPeriodMeta(s, { label, days }) {
    const p = s.periods[String(s.period)] ??= blankPeriod(s.period);
    if (label != null) p.label = String(label).slice(0, 60);
    if (days != null) p.days = Math.max(0, Math.min(365, Math.round(days)));
  },
  setSettlement(s, { level }) {
    s.settlement = Math.max(0, Math.min(25, Math.round(level)));
  },
  setHouse(s, { key, on }) {
    if (!(key in HOUSE)) return;
    (s.house ??= {})[key] = !!on;
  }
};
const GM_ONLY = new Set(["setPeriod", "setPeriodMeta", "setSettlement", "setHouse"]);

const isPrimaryGM = () => {
  const gm = game.users.activeGM;
  if (gm) return gm.id === game.user.id;
  const gms = game.users.filter(u => u.isGM && u.active).sort((a, b) => a.id.localeCompare(b.id));
  return gms[0]?.id === game.user.id;
};
const anyGMOnline = () => game.users.some(u => u.isGM && u.active);

/* ------------------------------------------------------------------ engine */
class Planner {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get period() { return this.s.periods[String(this.s.period)] ??= blankPeriod(this.s.period); }
  get isGM() { return game.user.isGM; }

  /* The single gate every optional rule reads. Off unless a GM said otherwise,
     including for a state saved before the toggles existed. */
  on(key) { return !!this.s.house?.[key]; }
  get anyHouse() { return Object.keys(HOUSE).some(k => this.on(k)); }
  /* An activity is offered only if its rule is on, or it has no rule. */
  availableActs() { return Object.entries(ACTS).filter(([, a]) => !a.house || this.on(a.house)); }

  rows(actorId) { return this.period.plans?.[actorId]?.rows ?? []; }
  held(actorId) { return this.s.study?.[actorId]?.held ?? null; }
  canEdit(actorId) { return this.isGM || ownsActor(game.user, actorId); }

  /* One entry point for every change. The GM writes; a player relays. */
  async apply(op, data) {
    if (!OPS[op]) return;
    if (this.isGM) {
      OPS[op](this.s, data);
      await game.settings.set(SETTING_NS, SETTING_KEY, this.s);
      this.render();
      return;
    }
    if (GM_ONLY.has(op)) return ui.notifications.warn("Only the GM can change the calendar.");
    if (data?.actorId && !ownsActor(game.user, data.actorId)) {
      return ui.notifications.warn("That isn't your character.");
    }
    if (!anyGMOnline()) {
      return ui.notifications.error("No GM is logged in, so the plan can't be saved. Your change was not kept.");
    }
    /* Render straight away and let the GM's write come back and reconcile. */
    OPS[op](this.s, data);
    this.render();
    game.socket.emit(SOCKET, { op, data, userId: game.user.id });
  }

  /* ----- day budget ----- */
  daysUsed(actorId) { return this.rows(actorId).reduce((a, r) => a + (r.days || 0), 0); }
  daysLeft(actorId) { return this.period.days - this.daysUsed(actorId); }

  /* ----- Dedicated Study ----- */

  /* Progress is derived from the committed rows rather than stored, so removing
     a row or shortening it walks the study back by exactly that much. */
  studyDays(actorId, lore, rank) {
    let total = 0;
    for (const p of Object.values(this.s.periods)) {
      for (const r of p.plans?.[actorId]?.rows ?? []) {
        if (r.act !== "study" || !r.done) continue;
        if (r.cfg.lore !== lore || String(r.cfg.rank) !== String(rank)) continue;
        total += r.days || 0;
      }
    }
    return total;
  }

  studyState(pc, row) {
    const target = STUDY[String(row.cfg.rank)] ?? STUDY[2];
    const lore = row.cfg.lore || "";
    const done = this.studyDays(pc.actorId, lore, target.rank);
    const held = this.held(pc.actorId);
    const blockers = [];
    if (!lore) blockers.push("Pick a Lore.");
    if ((pc.level ?? 1) < target.minLevel) blockers.push(`${target.label} needs level ${target.minLevel} — that one is absolute.`);
    if (!row.cfg.teacher) blockers.push("Name the teacher or library. Ask the GM before committing days.");
    if (held && lore && held.lore !== lore) {
      blockers.push(`${held.lore} already holds your Dedicated Study rank. Moving it costs a week and a new teacher, and ${held.lore} drops back to trained.`);
    }
    return { target, lore, done, held, blockers, complete: done >= target.days && !!lore };
  }

  /* HOUSE RULE — the rank a Dedicated Study Lore lends to Earn Income is
     trained, however high the study took it. Rules as written, a Lore earns at
     whatever rank the sheet says, so this only bites when the rule is on. */
  effectiveRank(pc, slug) {
    const actor = game.actors.get(pc.actorId);
    const sk = skillsFor(actor).find(s => s.slug === slug);
    if (!sk) return 1;
    if (!this.on("study")) return sk.rank;
    const held = this.held(pc.actorId);
    if (held && sk.lore && slugify(held.lore) === slug) return Math.min(sk.rank, 1);
    return sk.rank;
  }

  /* ----- projections ----- */

  incomeFor(pc, row) {
    const rank = this.effectiveRank(pc, row.cfg.skill);
    const task = Number(row.cfg.task) || 0;
    const days = row.days || 0;
    const per = (d) => earnPerDay(task, rank, d);
    return {
      rank, task, days,
      perDay: { cs: per("cs"), s: per("s"), f: per("f"), cf: 0 },
      total: row.degree ? per(row.degree) * days : null,
      best: per("s") * days
    };
  }

  /* Half the Price up front either way; the house rule only shrinks the
     balance owed on completion, from 50% of Price to 25%. */
  craftFor(pc, row) {
    const price = Math.round((Number(row.cfg.price) || 0) * 100);
    const hr = this.on("craft75") && String(row.cfg.hr75) === "1";
    const upFront = Math.floor(price / 2);
    const balance = hr ? Math.floor(price / 4) : price - upFront;
    const extra = Math.max(0, (row.days || 0) - 4);
    const rank = this.effectiveRank(pc, row.cfg.skill || "crafting");
    const ilvl = Number(row.cfg.ilvl) || 0;
    const perDay = row.degree === "cs" ? incomeRow(ilvl + 1)[Math.max(1, rank)] : incomeRow(ilvl)[Math.max(1, rank)];
    const reduced = Math.min(balance, extra * perDay);
    return { price, upFront, balance, extra, perDay, reduced, owed: Math.max(0, balance - reduced), hr };
  }

  restFor(pc, row) {
    const perDay = Math.max(1, pc.con ?? 0) * (pc.level ?? 1) * 2;
    return { perDay, total: perDay * (row.days || 0) };
  }

  spellCost(row) { return SPELL_COST[Math.max(0, Math.min(10, Number(row.cfg.rank) || 0))]; }

  /* Earn Income and Dedicated Study compete for the same days. This is what
     the forgone gold actually comes to for this character. */
  tuition(pc) {
    if (!this.on("study")) return null;
    const studyDays = this.rows(pc.actorId).filter(r => r.act === "study").reduce((a, r) => a + (r.days || 0), 0);
    if (!studyDays) return null;
    const best = this.bestIncomeRate(pc);
    return { days: studyDays, rate: best.rate, skill: best.label, cp: best.rate * studyDays };
  }

  /* The best per-day Success rate this character could get instead, at the
     highest task level the settlement and their own level allow. */
  bestIncomeRate(pc) {
    const actor = game.actors.get(pc.actorId);
    const task = Math.min(this.s.settlement, pc.level ?? 1);
    let rate = 0, label = "—";
    for (const sk of skillsFor(actor)) {
      const rank = this.effectiveRank(pc, sk.slug);
      if (rank < 1) continue;
      const r = earnPerDay(task, rank, "s");
      if (r > rate) { rate = r; label = sk.label; }
    }
    return { rate, label, task };
  }

  partyIncome() {
    let cp = 0;
    for (const pc of this.pcs) {
      for (const r of this.rows(pc.actorId)) {
        if (r.act !== "income") continue;
        const inc = this.incomeFor(pc, r);
        cp += inc.total ?? 0;
      }
    }
    return cp;
  }

  warnings(pc) {
    const out = [];
    const over = -this.daysLeft(pc.actorId);
    if (over > 0) out.push(`${days2(over)} over the ${days2(this.period.days)} available.`);
    const rows = this.rows(pc.actorId);
    const hasStudy = rows.some(r => r.act === "study" && (r.days || 0) > 0);
    const hasIncome = rows.some(r => r.act === "income" && (r.days || 0) > 0);
    if (hasStudy && hasIncome && this.on("study")) {
      out.push("Dedicated Study days can't also be Earn Income days — the forgone gold is the tuition. Keep the two from overlapping.");
    }
    /* A plan can outlive the rule being switched off. Say so rather than
       quietly costing it as though the rule were still in play. */
    if (hasStudy && !this.on("study")) {
      out.push("This plan has Dedicated Study days, but the GM has that house rule switched off.");
    }
    for (const r of rows) {
      if (r.act !== "income") continue;
      const task = Number(r.cfg.task) || 0;
      if (task > (pc.level ?? 1)) out.push(`A level ${task} task is above ${pc.name}'s level.`);
      else if (task > this.s.settlement) out.push(`No level ${task} work here — the settlement tops out at level ${this.s.settlement}.`);
      if (this.effectiveRank(pc, r.cfg.skill) < 1) out.push("Earn Income needs you trained in the skill.");
    }
    for (const r of rows) {
      if (r.act === "craft" && (r.days || 0) < 4) out.push("Craft takes at least four days.");
    }
    return [...new Set(out)];
  }

  get pcs() { return this._pcs ?? []; }
  set pcs(v) { this._pcs = v; }

  render() { clearSkillCache(); this.app?.render(); }

  /* ----- chat ----- */

  rowLine(pc, row) {
    const def = ACTS[row.act];
    const bits = [];
    if (row.act === "income") {
      const i = this.incomeFor(pc, row);
      bits.push(`${days2(row.days)}, task level ${i.task}`);
      if (i.total != null) bits.push(`<b>${coin(i.total)}</b>`);
      else bits.push(`${coin(i.perDay.s)}/day on a success`);
    } else if (row.act === "study") {
      const st = this.studyState(pc, row);
      bits.push(`${st.lore || "a Lore"} → ${st.target.label}`);
      bits.push(`${st.done}/${st.target.days} days`);
    } else if (row.act === "craft") {
      const c = this.craftFor(pc, row);
      bits.push(esc(row.cfg.item || "an item"));
      bits.push(`${days2(row.days)}`);
      if (c.price) bits.push(`${coin(c.upFront)} up front${c.hr ? ", 75% rule" : ""}`);
    } else {
      bits.push(days2(row.days));
      const first = def.fields.find(f => f.type === "text");
      if (first && row.cfg[first.k]) bits.push(esc(row.cfg[first.k]));
    }
    if (row.degree) bits.push(DEGREE_LABEL[row.degree]);
    return `${def.label} — ${bits.join(" · ")}`;
  }

  async postPlan(only = null) {
    const D = PALETTES.parchment;
    const list = only ? this.pcs.filter(p => p.actorId === only) : this.pcs;
    const body = list.map(pc => {
      const rows = this.rows(pc.actorId);
      const used = this.daysUsed(pc.actorId);
      const tu = this.tuition(pc);
      const lines = rows.length
        ? rows.map(r => `<li style="margin-bottom:2px">${this.rowLine(pc, r)}</li>`).join("")
        : `<li style="color:${D.muted}">Nothing planned.</li>`;
      return `
        <tr><td style="padding:6px 0 0;border-top:1px solid rgba(0,0,0,.12)">
          <div style="font-weight:600">${esc(pc.name)}
            <span style="font-weight:400;color:${D.muted};font-size:11px">
              — ${used}/${this.period.days} days</span></div>
          <ul style="margin:2px 0 4px;padding-left:1.1em;font-size:12px">${lines}</ul>
          ${tu ? `<div style="font-size:11px;color:${D.plum}">Tuition — ${coin(tu.cp)} of ${esc(tu.skill)} work forgone over ${days2(tu.days)}.</div>` : ""}
        </td></tr>`;
    }).join("");

    const gold = this.partyIncome();
    const content = `
      <div style="background:${D.paper};color:${D.ink};border:1px solid ${D.line};border-radius:4px;
                  padding:8px 10px;font-family:Signika,sans-serif;line-height:1.35">
        <div style="border-left:3px solid ${D.gold};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:${D.muted}">Downtime plan</div>
          <div style="font-size:15px;font-weight:600">${esc(this.period.label)}</div>
          <div style="font-size:11px;color:${D.muted}">${days2(this.period.days)} · work available up to level ${this.s.settlement}</div>
        </div>
        <table style="width:100%;border-collapse:collapse">${body}</table>
        ${gold ? `<div style="margin-top:6px;padding-top:5px;border-top:1px solid rgba(0,0,0,.12);
                    font-size:12px"><b>Earned so far</b> — ${coin(gold)}</div>` : ""}
      </div>`;
    await ChatMessage.create({ content, speaker: { alias: "Downtime" } });
  }
}

const slugify = (s) => String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* --------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class DowntimeApp extends BaseApp {
  constructor(planner, ...args) {
    super(...args);
    this.planner = planner;
    planner.app = this;
    /* Players open on their own character; the GM opens on whoever the plan
       was last left showing, then on the first of the party. */
    this.sel = (planner.isGM ? planner.s.ui?.sel : null)
      ?? myPCs(planner.pcs)[0]?.actorId ?? planner.pcs[0]?.actorId ?? null;
  }

  static DEFAULT_OPTIONS = {
    id: "pf2e-downtime-planner",
    tag: "div",
    classes: ["pf2e-downtime-planner"],
    position: { width: 900, height: "auto" },
    window: { title: "Downtime Planner", icon: "fa-solid fa-hourglass-half", resizable: true }
  };

  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "pf2e-downtime-planner",
      classes: ["pf2e-downtime-planner"],
      title: "Downtime Planner",
      width: 900,
      height: "auto",
      resizable: true
    });
  }

  get title() { return "Downtime Planner"; }

  async _renderHTML() { return this.markup(); }

  async _renderInner() {
    const $el = $(`<div class="dtp-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  get pc() { return this.planner.pcs.find(p => p.actorId === this.sel) ?? null; }

  /* ------------------------------------------------------------ fragments */

  field(pc, row, f) {
    const id = `f-${row.id}-${f.k}`;
    const val = row.cfg[f.k] ?? "";
    const ro = this.planner.canEdit(pc.actorId) ? "" : "disabled";
    const actor = game.actors.get(pc.actorId);

    if (f.type === "skill" || f.type === "lore") {
      const all = f.type === "lore" ? loresFor(actor) : skillsFor(actor);
      const opts = all.filter(s => !f.trainedOnly || s.rank >= 1);
      if (!opts.length) {
        return `<label class="fld"><span>${f.label}</span>
          <input type="text" id="${id}" data-act="cfg" data-row="${row.id}" data-k="${f.k}"
                 value="${esc(val)}" placeholder="${f.type === "lore" ? "No Lore skills found" : "No skills found"}" ${ro}></label>`;
      }
      const cur = val || f.def || opts[0].slug;
      const body = opts.map(s => {
        const v = f.type === "lore" ? s.label : s.slug;
        const eff = this.planner.effectiveRank(pc, s.slug);
        const tag = f.trainedOnly && ACTS[row.act].label === "Earn Income" && eff < s.rank
          ? ` (${RANKS[eff]} for income)` : ` (${RANKS[s.rank]})`;
        return `<option value="${esc(v)}" ${String(cur) === String(v) ? "selected" : ""}>${esc(s.label)}${tag}</option>`;
      }).join("");
      return `<label class="fld"><span>${f.label}</span>
        <select id="${id}" data-act="cfg" data-row="${row.id}" data-k="${f.k}" ${ro}>${body}</select></label>`;
    }

    if (f.type === "select") {
      const cur = String(val || f.def);
      const body = f.options.map(([v, l]) =>
        `<option value="${esc(v)}" ${cur === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("");
      return `<label class="fld"><span>${f.label}</span>
        <select id="${id}" data-act="cfg" data-row="${row.id}" data-k="${f.k}" ${ro}>${body}</select></label>`;
    }

    if (f.type === "number") {
      return `<label class="fld num"><span>${f.label}</span>
        <input type="number" id="${id}" data-act="cfg" data-row="${row.id}" data-k="${f.k}"
               value="${esc(val === "" ? (f.def ?? 0) : val)}" min="${f.min ?? 0}" max="${f.max ?? 999}" ${ro}></label>`;
    }

    return `<label class="fld wide"><span>${f.label}</span>
      <input type="text" id="${id}" data-act="cfg" data-row="${row.id}" data-k="${f.k}"
             value="${esc(val)}" placeholder="${esc(f.placeholder ?? "")}" ${ro}></label>`;
  }

  /* The per-activity readout under the config fields — what this row is
     actually worth, given the days and the degree recorded so far. */
  payoutBlock(pc, row) {
    const P = this.planner;
    if (row.act === "income") {
      const i = P.incomeFor(pc, row);
      const cell = (d) => `
        <div class="pay ${row.degree === d ? "on" : ""}">
          <span>${DEGREE_LABEL[d]}</span>
          <b>${coin(i.perDay[d])}</b><small>per day</small>
          <em>${coin(i.perDay[d] * i.days)}</em>
        </div>`;
      return `<div class="paygrid">${DEGREES.slice().reverse().map(cell).join("")}</div>
        <div class="payfoot">${RANKS[i.rank]} · task level ${i.task} · DC ${levelDC(i.task)} · ${days2(i.days)}</div>`;
    }

    if (row.act === "study") {
      const st = P.studyState(pc, row);
      const pct = Math.min(100, st.target.days ? (st.done / st.target.days) * 100 : 0);
      return `
        <div class="studybar">
          <div class="sb-head"><span>${esc(st.lore || "Lore")} → ${st.target.label}</span>
            <span>${st.done} / ${st.target.days} days</span></div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="payfoot">Level ${st.target.minLevel}+ · ${weeksish(st.target.days)} · no Earn Income during these weeks</div>
        </div>
        ${st.blockers.length ? `<ul class="blockers">${st.blockers.map(b => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
        ${st.complete ? `<div class="rowbtns">
            ${st.held && st.held.lore === st.lore && st.held.rank === st.target.rank
              ? `<button type="button" class="ghost" data-act="undostudy" data-pc="${pc.actorId}">Undo — put it back</button>
                 <span class="ok">${esc(st.lore)} holds ${st.target.label}.</span>`
              : `<button type="button" class="go" data-act="dostudy" data-pc="${pc.actorId}" data-row="${row.id}">Finish — ${esc(st.lore)} becomes ${st.target.label}</button>`}
          </div>` : ""}`;
    }

    if (row.act === "craft") {
      const c = P.craftFor(pc, row);
      if (!c.price) return `<div class="payfoot">Enter the item's Price to see what you owe.</div>`;
      return `
        <div class="paygrid three">
          <div class="pay"><span>Up front</span><b>${coin(c.upFront)}</b><small>materials</small></div>
          <div class="pay"><span>Balance</span><b>${coin(c.balance)}</b><small>${c.hr ? "75% rule" : "on completion"}</small></div>
          <div class="pay ${c.owed === 0 ? "on" : ""}"><span>Still owed</span><b>${coin(c.owed)}</b>
            <small>${c.extra ? `after ${days2(c.extra)} extra` : "no extra days"}</small></div>
        </div>
        <div class="payfoot">DC ${levelDC(row.cfg.ilvl)} · each day past the fourth knocks off ${coin(c.perDay)}${c.hr ? " · house rule: 75% of Price in total" : ""}</div>`;
    }

    if (row.act === "rest") {
      const r = P.restFor(pc, row);
      return `<div class="paygrid three">
          <div class="pay"><span>Per day</span><b>${r.perDay} HP</b><small>double a night's rest</small></div>
          <div class="pay on"><span>Over ${days2(row.days)}</span><b>${r.total} HP</b><small>uninterrupted</small></div>
          <div class="pay"><span>No check</span><b>—</b><small>nothing to roll</small></div>
        </div>`;
    }

    if (row.act === "spell") {
      const cost = P.spellCost(row);
      const lvl = Math.max(1, (Number(row.cfg.rank) || 1) * 2 - 1);
      return `<div class="payfoot">Rank ${row.cfg.rank || 1} · spell level ${lvl} · DC ${levelDC(lvl)} · ${coin(cost)} in materials · ${(Number(row.cfg.rank) || 1)} hour${(Number(row.cfg.rank) || 1) === 1 ? "" : "s"} of work</div>`;
    }

    if (row.act === "retrain") {
      const what = row.cfg.what || "feat";
      const time = what === "feature" ? "a month or more, at the GM's call" : "one week";
      return `<div class="payfoot">${cap(what === "skill" ? "skill increase" : what)} · ${time} · usually needs a teacher, and the GM may charge for one</div>`;
    }

    const def = ACTS[row.act];
    const dc = def.dc?.(row.cfg);
    return dc ? `<div class="payfoot">DC ${dc} · ${days2(row.days)}${def.secret ? " · the GM rolls this one in secret" : ""}</div>` : "";
  }

  rowCard(pc, row) {
    const def = ACTS[row.act];
    const P = this.planner;
    const editable = P.canEdit(pc.actorId);
    const ro = editable ? "" : "disabled";
    const out = OUTCOMES[row.act];

    return `
      <section class="row t-${def.tone}">
        <header>
          <i class="${def.icon}"></i>
          <h4>${def.label}${def.house ? `<span class="hr">house rule</span>` : ""}</h4>
          <label class="days"><span>Days</span>
            <input type="number" min="0" max="365" value="${row.days}" data-act="days" data-row="${row.id}" ${ro}></label>
          <button type="button" class="x" data-act="del" data-row="${row.id}" title="Remove" ${ro}>✕</button>
        </header>
        <p class="blurb">${def.blurb}</p>
        <div class="fields">${def.fields
          .filter(f => !f.house || P.on(f.house))
          .map(f => this.field(pc, row, f)).join("")}</div>
        ${this.payoutBlock(pc, row)}
        ${def.check ? `
          <div class="rowbtns">
            <button type="button" class="go" data-act="roll" data-row="${row.id}" ${ro}>
              <i class="fa-solid fa-dice-d20"></i> Roll it</button>
            <button type="button" class="ghost" data-act="post" data-row="${row.id}" ${ro}>Post to chat</button>
            <span class="spacer"></span>
            ${DEGREES.slice().reverse().map(d => `
              <button type="button" class="deg ${d} ${row.degree === d ? "on" : ""}"
                      data-act="degree" data-row="${row.id}" data-deg="${d}"
                      title="${DEGREE_LABEL[d]}" ${ro}>${d === "cs" ? "CS" : d === "s" ? "S" : d === "f" ? "F" : "CF"}</button>`).join("")}
          </div>
          ${row.degree && out ? `<div class="outcome ${row.degree}">${out[row.degree]}</div>` : ""}
        ` : `
          <div class="rowbtns">
            <label class="check"><input type="checkbox" data-act="done" data-row="${row.id}" ${row.done ? "checked" : ""} ${ro}>
              <span>${row.act === "study" ? "These days are spent" : "Done"}</span></label>
          </div>`}
      </section>`;
  }

  addBar(pc) {
    if (!this.planner.canEdit(pc.actorId)) return "";
    return `<div class="addbar">
      <span>Add</span>
      ${this.planner.availableActs().map(([k, a]) =>
        `<button type="button" data-act="add" data-key="${k}" class="t-${a.tone}">
           <i class="${a.icon}"></i>${a.label}</button>`).join("")}
    </div>`;
  }

  /* The GM's switchboard. Players get the same list as a read-only line, so
     they can see which optional rules are actually in play. */
  houseBar() {
    const P = this.planner;
    const keys = Object.keys(HOUSE);
    if (!P.isGM) {
      const on = keys.filter(k => P.on(k));
      return `<div class="housebar reading">
        <span class="hb-label">Rules</span>
        ${on.length
          ? on.map(k => `<span class="hb-on" title="${esc(HOUSE[k].blurb)}">${esc(HOUSE[k].label)}</span>`).join("")
          : `<span class="hb-raw">Rules as written — no house rules in play.</span>`}
      </div>`;
    }
    return `<div class="housebar">
      <span class="hb-label">House rules</span>
      ${keys.map(k => `
        <label class="hbtog ${P.on(k) ? "on" : ""}" title="${esc(HOUSE[k].blurb)}">
          <input type="checkbox" data-act="house" data-key="${k}" ${P.on(k) ? "checked" : ""}>
          <span>${esc(HOUSE[k].label)}</span>
        </label>`).join("")}
      <span class="hb-raw">${P.anyHouse ? "" : "All off — everything follows the book."}</span>
    </div>`;
  }

  pcStrip() {
    const P = this.planner;
    return `<div class="strip">${P.pcs.map(pc => {
      const used = P.daysUsed(pc.actorId);
      const pct = P.period.days ? Math.min(100, (used / P.period.days) * 100) : 0;
      const over = used > P.period.days;
      const gold = P.rows(pc.actorId).filter(r => r.act === "income")
        .reduce((a, r) => a + (P.incomeFor(pc, r).total ?? 0), 0);
      const held = P.on("study") ? P.held(pc.actorId) : null;
      const mine = ownsActor(game.user, pc.actorId);
      return `
        <button type="button" class="pcchip ${this.sel === pc.actorId ? "on" : ""} ${mine ? "mine" : ""}"
                data-act="sel" data-pc="${pc.actorId}">
          <img src="${esc(pc.img)}" alt="">
          <span class="nm">${esc(pc.name)}</span>
          <span class="lv">Lv ${pc.level ?? "?"}${pc.cls ? ` ${esc(pc.cls)}` : ""}</span>
          <span class="bar ${over ? "over" : ""}"><i style="width:${pct}%"></i></span>
          <span class="meta">${used}/${P.period.days} d${gold ? ` · ${coin(gold)}` : ""}</span>
          ${held ? `<span class="lore" title="Dedicated Study">${esc(held.lore)} · ${RANKS[held.rank]}</span>` : ""}
        </button>`;
    }).join("")}</div>`;
  }

  gmBar() {
    const P = this.planner;
    if (!P.isGM) {
      return `<div class="gmbar reading">
        <span><b>${esc(P.period.label)}</b> — ${days2(P.period.days)}</span>
        <span>Work available up to level ${P.s.settlement}</span>
        ${anyGMOnline() ? "" : `<span class="warn">No GM online — changes won't save.</span>`}
      </div>`;
    }
    return `<div class="gmbar">
      <label class="fld wide"><span>Period</span>
        <input type="text" value="${esc(P.period.label)}" data-act="plabel"></label>
      <label class="fld num"><span>Days</span>
        <input type="number" min="0" max="365" value="${P.period.days}" data-act="pdays"></label>
      <label class="fld num"><span>Settlement level</span>
        <input type="number" min="0" max="25" value="${P.s.settlement}" data-act="settle"></label>
      <span class="spacer"></span>
      <button type="button" data-act="period" data-n="-1" title="Previous period">◀</button>
      <span class="pnum">${P.s.period}</span>
      <button type="button" data-act="period" data-n="1" title="Next period">▶</button>
    </div>`;
  }

  reference(pc) {
    const P = this.planner;
    const actor = game.actors.get(pc.actorId);
    const task = Math.min(P.s.settlement, pc.level ?? 1);
    const best = P.bestIncomeRate(pc);
    const tu = P.tuition(pc);
    /* Best earners first, but never at the cost of hiding a Lore — a Lore is
       the one row where Dedicated Study's "lends nothing to income" cap shows
       up, which is the whole reason this panel is here. */
    const trained = skillsFor(actor).filter(s => s.rank >= 1);
    const byRate = [...trained].sort((a, b) =>
      earnPerDay(task, P.effectiveRank(pc, b.slug), "s") - earnPerDay(task, P.effectiveRank(pc, a.slug), "s")
      || a.label.localeCompare(b.label));
    const shown = byRate.slice(0, 10);
    for (const s of trained) if (s.lore && !shown.includes(s)) shown.push(s);

    const table = shown.map(s => {
      const rank = P.effectiveRank(pc, s.slug);
      const capped = rank < s.rank;
      return `<tr class="${capped ? "capped" : ""}">
        <td>${esc(s.label)}</td>
        <td>${RANKS[rank]}${capped ? ` <small>(${RANKS[s.rank]}, but Dedicated Study lends nothing to income)</small>` : ""}</td>
        <td class="r">${coin(earnPerDay(task, rank, "s"))}</td>
        <td class="r">${coin(earnPerDay(task, rank, "cs"))}</td>
      </tr>`;
    }).join("");

    return `
      <section class="panel ref">
        <h3>What ${esc(pc.name)} can earn</h3>
        <p class="sub">At the best work going here — a level ${task} task, DC ${levelDC(task)}.</p>
        <table class="reftab">
          <thead><tr><th>Skill</th><th>Rank</th><th class="r">Success</th><th class="r">Crit</th></tr></thead>
          <tbody>${table || `<tr><td colspan="4" class="muted">No trained skills found on this actor.</td></tr>`}</tbody>
        </table>
        ${tu ? `<div class="tuition">
            <b>Tuition</b> — ${days2(tu.days)} of Dedicated Study means about <b>${coin(tu.cp)}</b> not earned,
            at ${esc(tu.skill)}'s ${coin(tu.rate)} a day. That forgone gold is the cost of the rank.
          </div>` : `<div class="sub">Best rate here: ${esc(best.label)} at ${coin(best.rate)} a day.</div>`}
        ${this.houseRuleNotes()}
      </section>`;
  }

  /* Only the rules actually switched on. With none of them on the panel says so
     plainly, rather than listing rules this table isn't using. */
  houseRuleNotes() {
    const P = this.planner;
    const notes = {
      study: "<b>Dedicated Study</b> raises a Lore over 2 / 4 / 8 weeks for expert / master / legendary. Level 3 / 7 / 15 minimums are absolute, only one Lore holds the rank at a time, and it lends nothing to Earn Income.",
      craft75: "<b>Crafting</b> costs 75% of Price in total if you have the formula and a background reason for it — 50% still due up front.",
      lore: "<b>Additional Lore</b> may be taken for a Lore you already have; it still scales to expert at 3rd, master at 7th, legendary at 15th."
    };
    const live = Object.keys(HOUSE).filter(k => P.on(k));
    if (!live.length) {
      return `<div class="houserules">
        <h4>Rules</h4>
        <p class="sub">Rules as written. No house rules are switched on${P.isGM ? " — the row above turns them on" : ""}.</p>
      </div>`;
    }
    return `<div class="houserules">
      <h4>House rules in play</h4>
      <ul>${live.map(k => `<li>${notes[k]}</li>`).join("")}</ul>
    </div>`;
  }

  playerNote() {
    if (this.planner.isGM) return "";
    const mine = myPCs(this.planner.pcs);
    if (mine.length) return "";
    return `<div class="note">You don't own any of the party's characters, so this is read-only for you.</div>`;
  }

  markup() {
    const P = this.planner;
    if (!P.pcs.length) {
      return `${this.styles()}<div class="dtp"><div class="empty">
        <h3>No party found</h3>
        <p>Add characters to the PF2e party actor, or assign player characters to your users, then run this again.</p>
      </div></div>`;
    }
    const pc = this.pc ?? P.pcs[0];
    const rows = P.rows(pc.actorId);
    const warn = P.warnings(pc);
    const left = P.daysLeft(pc.actorId);

    return `
      ${this.styles()}
      <div class="dtp">
        ${this.gmBar()}
        ${this.houseBar()}
        ${this.pcStrip()}
        ${this.playerNote()}

        <div class="cols">
          <div class="main">
            <section class="panel">
              <h3>${esc(pc.name)}<span class="budget ${left < 0 ? "over" : ""}">
                ${left < 0 ? `${days2(-left)} over budget` : `${days2(left)} left`}</span></h3>
              ${warn.length ? `<ul class="warns">${warn.map(w => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}
              ${rows.length
                ? rows.map(r => this.rowCard(pc, r)).join("")
                : `<p class="muted">Nothing planned yet. Pick something below.</p>`}
              ${this.addBar(pc)}
            </section>
          </div>
          <aside class="side">
            ${this.reference(pc)}
          </aside>
        </div>

        <div class="actions">
          <button type="button" data-act="postmine" data-pc="${pc.actorId}">Post ${esc(pc.name)}'s plan</button>
          <button type="button" data-act="postall">Post the party's plan</button>
          ${P.canEdit(pc.actorId) ? `<button type="button" data-act="clear" data-pc="${pc.actorId}">Clear this period</button>` : ""}
          <button type="button" data-act="sheet" data-pc="${pc.actorId}">Open sheet</button>
        </div>
      </div>`;
  }

  /* ---------------------------------------------------------------- wiring */
  wire(root) {
    if (!root) return;
    const P = this.planner;
    const pcId = () => (this.pc ?? P.pcs[0])?.actorId;
    const rowOf = (id) => P.rows(pcId()).find(r => r.id === id);

    root.querySelectorAll("[data-act]").forEach(el => {
      const act = el.dataset.act;
      const tag = el.tagName;

      /* text / number / select inputs commit on change */
      if (tag === "INPUT" || tag === "SELECT") {
        const ev = (el.type === "checkbox" || tag === "SELECT") ? "change" : "change";
        el.addEventListener(ev, async () => {
          const v = el.type === "checkbox" ? el.checked : el.value;
          switch (act) {
            case "cfg":
              return P.apply("setRow", { actorId: pcId(), rowId: el.dataset.row, patch: { cfg: { [el.dataset.k]: v } } });
            case "days":
              return P.apply("setRow", { actorId: pcId(), rowId: el.dataset.row, patch: { days: Number(v) } });
            case "done":
              return P.apply("setRow", { actorId: pcId(), rowId: el.dataset.row, patch: { done: !!v } });
            case "house": return P.apply("setHouse", { key: el.dataset.key, on: !!v });
            case "plabel": return P.apply("setPeriodMeta", { label: v });
            case "pdays": return P.apply("setPeriodMeta", { days: Number(v) });
            case "settle": return P.apply("setSettlement", { level: Number(v) });
          }
        });
        return;
      }

      el.addEventListener("click", async (event) => {
        event.preventDefault();
        switch (act) {
          case "sel":
            this.sel = el.dataset.pc; return this.render();
          case "add":
            return P.apply("addRow", { actorId: pcId(), act: el.dataset.key });
          case "del":
            return P.apply("delRow", { actorId: pcId(), rowId: el.dataset.row });
          case "degree": {
            const row = rowOf(el.dataset.row);
            const next = row?.degree === el.dataset.deg ? null : el.dataset.deg;
            return P.apply("setRow", { actorId: pcId(), rowId: el.dataset.row, patch: { degree: next } });
          }
          case "roll": return this.roll(rowOf(el.dataset.row));
          case "post": return this.post(rowOf(el.dataset.row));
          case "dostudy": {
            const row = rowOf(el.dataset.row);
            const st = P.studyState(this.pc, row);
            if (st.blockers.length) return ui.notifications.warn(st.blockers[0]);
            return P.apply("completeStudy", { actorId: el.dataset.pc, lore: st.lore, rank: st.target.rank });
          }
          case "undostudy": return P.apply("undoStudy", { actorId: el.dataset.pc });
          case "period": return P.apply("setPeriod", { n: P.s.period + Number(el.dataset.n) });
          case "clear": return P.apply("clearActor", { actorId: el.dataset.pc });
          case "postmine": return P.postPlan(el.dataset.pc);
          case "postall": return P.postPlan(null);
          case "sheet": return game.actors.get(el.dataset.pc)?.sheet?.render(true);
        }
      });
    });
  }

  /* Roll through the actor's own statistic where the system offers one, so the
     result lands in chat with all the character's modifiers. Older cores and
     the preview harness fall back to posting a rollable inline check. */
  async roll(row) {
    if (!row) return;
    const pc = this.pc;
    const P = this.planner;
    const def = ACTS[row.act];
    const dc = def.dc?.(row.cfg);
    const slug = row.cfg.skill;
    const actor = game.actors.get(pc.actorId);
    const st = actor?.skills?.[slug];

    if (st?.roll && dc) {
      try {
        const r = await st.roll({ dc: { value: dc }, label: def.label, rollMode: def.secret ? "blindroll" : undefined });
        const d = r?.degreeOfSuccess ?? r?.options?.degreeOfSuccess;
        if (Number.isInteger(d)) {
          await P.apply("setRow", { actorId: pc.actorId, rowId: row.id, patch: { degree: DEGREES[d] } });
        }
        return;
      } catch (err) {
        console.warn("Downtime Planner — statistic roll failed, posting an inline check instead.", err);
      }
    }
    return this.post(row);
  }

  async post(row) {
    if (!row) return;
    const pc = this.pc;
    const def = ACTS[row.act];
    const dc = def.dc?.(row.cfg);
    const actor = game.actors.get(pc.actorId);
    const slug = row.cfg.skill || "";
    const body = dc && slug
      ? checkCode(slug, dc, def.label, def.secret)
      : `<em>No check for this one — settle it with the GM.</em>`;
    await ChatMessage.create({
      content: `<p style="margin:0 0 4px"><b>${esc(pc.name)}</b> — ${def.label}
        <span style="opacity:.7">· ${days2(row.days)}</span></p>${body}`,
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : { alias: "Downtime" }
    });
  }

  /* ---------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    const vars = Object.entries(p).map(([k, v]) => `--${k}:${v}`).join(";");
    return `
    <style>
      /* The scroll clamp belongs on the window content, matching the other
         consoles — it is what the preview harness lifts to measure height. */
      #pf2e-downtime-planner .window-content { background:${p.paper}; color:${p.ink};
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #pf2e-downtime-planner .window-content > * { background:transparent; }
      .dtp { ${vars}; background:var(--paper); color:var(--ink); font-family:Signika,sans-serif;
             padding:.6rem; }
      .dtp h3, .dtp h4 { color:var(--ink); margin:0; border:none; }
      .dtp button { height:auto; display:inline-flex; align-items:center; justify-content:center;
                    gap:.3rem; line-height:1.2; cursor:pointer; color:var(--ink);
                    border:1px solid var(--line); background:transparent; border-radius:3px;
                    padding:.3rem .5rem; font-size:.8rem; font-family:inherit; }
      .dtp button:hover:not(:disabled) { background:var(--hover); }
      .dtp button:disabled { opacity:.45; cursor:default; }
      .dtp input, .dtp select { background:var(--field); color:var(--ink); border:1px solid var(--line);
                                border-radius:3px; padding:.2rem .3rem; font-family:inherit; font-size:.8rem; }
      .dtp .muted, .dtp .sub { color:var(--muted); font-size:.78rem; }
      .dtp .spacer { flex:1; }
      .dtp .empty { padding:2rem; text-align:center; }

      .dtp .gmbar { display:flex; align-items:flex-end; gap:.5rem; flex-wrap:wrap;
                    background:var(--card); border:1px solid var(--line); border-radius:4px;
                    padding:.4rem .5rem; margin-bottom:.5rem; }
      .dtp .gmbar.reading { align-items:center; font-size:.82rem; color:var(--muted); gap:1rem; }
      .dtp .gmbar.reading b { color:var(--ink); }
      .dtp .gmbar .warn { color:var(--rust); font-weight:600; }
      .dtp .pnum { font-size:1rem; font-weight:600; min-width:1.4rem; text-align:center; }

      .dtp .fld { display:flex; flex-direction:column; gap:.15rem; flex:1 1 8rem; min-width:0; }
      .dtp .fld > span { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
      .dtp .fld.num { flex:0 0 6.5rem; }
      .dtp .fld.wide { flex:2 1 12rem; }

      .dtp .strip { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:.5rem; }
      .dtp .pcchip { display:grid; grid-template-columns:34px 1fr; grid-template-rows:auto auto auto auto;
                     gap:0 .4rem; align-items:center; text-align:left; padding:.35rem .5rem;
                     background:var(--card); flex:1 1 10rem; }
      .dtp .pcchip.on { border-color:var(--ember); box-shadow:inset 0 0 0 1px var(--ember); }
      .dtp .pcchip.mine .nm::after { content:" ●"; color:var(--moss); font-size:.6rem; vertical-align:middle; }
      /* 1 / -1, and the Lore pinned to column 2: with a fixed span the Lore
         line auto-places into the 34px avatar column and ellipses to nothing. */
      .dtp .pcchip img { grid-row:1 / -1; width:34px; height:34px; object-fit:cover; border-radius:3px;
                         border:1px solid var(--line); }
      .dtp .pcchip .lore { grid-column:2; }
      .dtp .pcchip .nm { font-weight:600; font-size:.85rem; }
      .dtp .pcchip .lv, .dtp .pcchip .meta, .dtp .pcchip .lore { font-size:.66rem; color:var(--muted); }
      .dtp .pcchip .lore { color:var(--plum); }
      /* One line each, ellipsed — a long Lore name otherwise wraps to three
         lines and the chip stops matching the ones beside it. */
      .dtp .pcchip .nm, .dtp .pcchip .lv, .dtp .pcchip .meta, .dtp .pcchip .lore {
             min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .dtp .pcchip .bar { height:3px; background:var(--track); border-radius:2px; overflow:hidden; margin:.15rem 0; }
      .dtp .pcchip .bar i { display:block; height:100%; background:var(--moss); }
      .dtp .pcchip .bar.over i { background:var(--rust); }

      .dtp .housebar { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap;
                       background:var(--card); border:1px solid var(--line); border-radius:4px;
                       padding:.3rem .5rem; margin-bottom:.5rem; }
      .dtp .hb-label { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em;
                       color:var(--muted); margin-right:.1rem; }
      .dtp .hbtog { display:inline-flex; align-items:center; gap:.3rem; font-size:.74rem;
                    border:1px solid var(--line); border-radius:3px; padding:.15rem .4rem;
                    cursor:pointer; color:var(--muted); }
      .dtp .hbtog.on { color:var(--plum); border-color:var(--plum); background:var(--stripe); }
      .dtp .hb-on { font-size:.74rem; color:var(--plum); border:1px solid var(--plum);
                    border-radius:3px; padding:.15rem .4rem; background:var(--stripe); }
      .dtp .hb-raw { font-size:.72rem; color:var(--muted); font-style:italic; }

      .dtp .note { background:var(--card); border:1px solid var(--line); border-left:3px solid var(--slate);
                   border-radius:3px; padding:.4rem .6rem; font-size:.78rem; color:var(--muted); margin-bottom:.5rem; }

      .dtp .cols { display:grid; grid-template-columns:1fr 20rem; gap:.5rem; align-items:start; }
      .dtp .panel { background:var(--card); border:1px solid var(--line); border-radius:4px; padding:.5rem .6rem; }
      .dtp .panel > h3 { font-size:1rem; font-weight:600; display:flex; align-items:baseline; gap:.5rem;
                         border-bottom:2px solid var(--line); padding-bottom:.3rem; margin-bottom:.4rem; }
      .dtp .budget { margin-left:auto; font-size:.72rem; font-weight:400; color:var(--moss); }
      .dtp .budget.over { color:var(--rust); font-weight:600; }

      .dtp .warns { list-style:none; margin:0 0 .5rem; padding:.35rem .5rem; border-radius:3px;
                    background:var(--stripe); border-left:3px solid var(--ember); font-size:.75rem; }
      .dtp .warns li { padding:.1rem 0; }

      .dtp .row { border:1px solid var(--line); border-left:3px solid var(--line); border-radius:3px;
                  padding:.4rem .5rem; margin-bottom:.45rem; background:var(--paper); }
      .dtp .row.t-gold { border-left-color:var(--gold); }
      .dtp .row.t-plum { border-left-color:var(--plum); }
      .dtp .row.t-rust { border-left-color:var(--rust); }
      .dtp .row.t-moss { border-left-color:var(--moss); }
      .dtp .row.t-slate { border-left-color:var(--slate); }
      .dtp .row.t-teal { border-left-color:var(--teal); }
      .dtp .row.t-ember { border-left-color:var(--ember); }
      .dtp .row > header { display:flex; align-items:center; gap:.45rem; }
      .dtp .row > header h4 { font-size:.88rem; font-weight:600; display:flex; align-items:center; gap:.35rem; }
      .dtp .row > header i { color:var(--muted); width:1rem; text-align:center; }
      .dtp .row .hr { font-size:.6rem; text-transform:uppercase; letter-spacing:.06em; color:var(--plum);
                      border:1px solid var(--plum); border-radius:2px; padding:0 .2rem; }
      .dtp .row .days { flex-direction:row; align-items:center; gap:.3rem; margin-left:auto; flex:0 0 auto; }
      .dtp .row .days input { width:3.4rem; }
      .dtp .row .x { padding:.15rem .35rem; color:var(--muted); }
      .dtp .blurb { margin:.25rem 0 .35rem; font-size:.75rem; color:var(--muted); line-height:1.35; }
      .dtp .fields { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:.4rem; }

      .dtp .paygrid { display:grid; grid-template-columns:repeat(4,1fr); gap:.3rem; margin-bottom:.3rem; }
      .dtp .paygrid.three { grid-template-columns:repeat(3,1fr); }
      .dtp .pay { border:1px solid var(--line); border-radius:3px; padding:.25rem .35rem; background:var(--card); }
      .dtp .pay.on { border-color:var(--ember); background:var(--stripe); }
      .dtp .pay span { display:block; font-size:.6rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
      .dtp .pay b { display:block; font-size:.9rem; }
      .dtp .pay small, .dtp .pay em { display:block; font-size:.62rem; color:var(--muted); font-style:normal; }
      .dtp .payfoot { font-size:.7rem; color:var(--muted); }

      .dtp .studybar .sb-head { display:flex; justify-content:space-between; font-size:.75rem; margin-bottom:.2rem; }
      .dtp .bar { height:6px; background:var(--track); border-radius:3px; overflow:hidden; margin-bottom:.2rem; }
      .dtp .bar i { display:block; height:100%; background:var(--plum); }
      .dtp .blockers { list-style:none; margin:.3rem 0 0; padding:.3rem .5rem; font-size:.72rem;
                       background:var(--stripe); border-left:3px solid var(--plum); border-radius:3px; }
      .dtp .blockers li { padding:.1rem 0; }
      .dtp .ok { font-size:.75rem; color:var(--moss); align-self:center; }

      .dtp .rowbtns { display:flex; align-items:center; gap:.3rem; flex-wrap:wrap; margin-top:.35rem; }
      .dtp .rowbtns .go { border-color:var(--ember); }
      .dtp .check { display:flex; align-items:center; gap:.3rem; font-size:.76rem; }
      .dtp .deg { width:2.1rem; font-size:.68rem; font-weight:600; padding:.25rem 0; }
      .dtp .deg.cs { color:var(--moss); } .dtp .deg.s { color:var(--teal); }
      .dtp .deg.f { color:var(--ember); } .dtp .deg.cf { color:var(--rust); }
      .dtp .deg.on { background:var(--hover); box-shadow:inset 0 0 0 1px currentColor; }
      .dtp .outcome { margin-top:.3rem; font-size:.75rem; padding:.25rem .4rem; border-radius:3px;
                      background:var(--stripe); border-left:3px solid var(--line); }
      .dtp .outcome.cs { border-left-color:var(--moss); } .dtp .outcome.s { border-left-color:var(--teal); }
      .dtp .outcome.f { border-left-color:var(--ember); } .dtp .outcome.cf { border-left-color:var(--rust); }

      .dtp .addbar { display:flex; flex-wrap:wrap; gap:.3rem; align-items:center; border-top:1px solid var(--line);
                     padding-top:.4rem; margin-top:.2rem; }
      .dtp .addbar > span { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
      .dtp .addbar button { font-size:.72rem; }
      .dtp .addbar button i { color:var(--muted); }

      .dtp .ref h3 { font-size:.9rem; font-weight:600; border-bottom:2px solid var(--line);
                     padding-bottom:.25rem; margin-bottom:.3rem; }
      /* Foundry styles tables inside application windows — a tinted thead and
         striped rows, picked for its own dark theme. Left alone it paints a
         muddy band under this panel, so every background and colour here is
         set explicitly and the striping is our own. */
      /* Prefixed with the window id, not just .dtp: the PF2e system styles
         tables inside application windows fairly aggressively, and a bare
         class selector loses to it. */
      #pf2e-downtime-planner .reftab { width:100%; border-collapse:collapse; font-size:.72rem;
                     margin:.3rem 0; background:transparent; color:var(--ink); border:none; }
      #pf2e-downtime-planner .reftab thead,
      #pf2e-downtime-planner .reftab tbody,
      #pf2e-downtime-planner .reftab tr { background:transparent; border:none; }
      #pf2e-downtime-planner .reftab th { text-align:left; font-size:.62rem; text-transform:uppercase;
                        letter-spacing:.05em; color:var(--muted); font-weight:600; background:transparent;
                        border:none; border-bottom:1px solid var(--line); padding:.2rem .3rem .2rem 0; }
      #pf2e-downtime-planner .reftab td { padding:.22rem .3rem .22rem 0; background:transparent;
                        color:var(--ink); border:none; border-bottom:1px solid var(--line); }
      #pf2e-downtime-planner .reftab tbody tr:nth-child(odd) td { background:var(--stripe); }
      #pf2e-downtime-planner .reftab tbody tr:last-child td { border-bottom:none; }
      #pf2e-downtime-planner .reftab .r { text-align:right; white-space:nowrap;
                        font-variant-numeric:tabular-nums; font-weight:600; padding-right:0; }
      #pf2e-downtime-planner .reftab tr.capped td { color:var(--plum); }
      #pf2e-downtime-planner .reftab small { color:var(--muted); font-weight:400; }
      .dtp .tuition { font-size:.74rem; background:var(--stripe); border-left:3px solid var(--plum);
                      border-radius:3px; padding:.35rem .5rem; margin:.4rem 0; line-height:1.4; }
      .dtp .houserules { border-top:1px solid var(--line); padding-top:.35rem; margin-top:.4rem; }
      .dtp .houserules h4 { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em;
                            color:var(--muted); margin-bottom:.25rem; }
      .dtp .houserules ul { margin:0; padding-left:1rem; font-size:.72rem; line-height:1.4; }
      .dtp .houserules li { margin-bottom:.25rem; }

      .dtp .actions { display:flex; gap:.4rem; margin-top:.5rem; flex-wrap:wrap; }
      .dtp .actions button { flex:1 1 8rem; padding:.4rem; }

      @media (max-width:820px) {
        .dtp .cols { grid-template-columns:1fr; }
        .dtp .paygrid, .dtp .paygrid.three { grid-template-columns:repeat(2,1fr); }
      }
    </style>`;
  }
}

/* ApplicationV2 and Application both declare _replaceHTML, with different
   signatures. Only install the v2 version when v2 is what we extended. */
if (AppV2) {
  DowntimeApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSetting();

  let state = loadState();
  if (game.user.isGM && !game.settings.get(SETTING_NS, SETTING_KEY)) {
    await game.settings.set(SETTING_NS, SETTING_KEY, state);
  }

  const planner = new Planner(state);
  planner.pcs = detectPCs();
  const app = new DowntimeApp(planner);

  /* The GM's client is the only one that can write, so it is the only one that
     listens. Ownership is re-checked here rather than trusted from the sender. */
  if (game.user.isGM && !globalThis.__dtpSocket) {
    globalThis.__dtpSocket = true;
    game.socket.on(SOCKET, async ({ op, data, userId }) => {
      if (!isPrimaryGM()) return;
      const user = game.users.get(userId);
      if (!user || !OPS[op] || GM_ONLY.has(op)) return;
      if (data?.actorId && !ownsActor(user, data.actorId)) return;
      const fresh = loadState();
      OPS[op](fresh, data);
      await game.settings.set(SETTING_NS, SETTING_KEY, fresh);
    });
  }

  /* Re-registered rather than guarded: running the macro again builds a new
     planner, and a hook still closed over the previous one would keep the
     stale window in sync and leave the live one frozen. */
  {
    if (globalThis.__dtpHook) Hooks.off("updateSetting", globalThis.__dtpHook);
    globalThis.__dtpHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== SETTING_ID) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (!fresh) return;
      /* Reconcile every open copy, including the one that asked for the change:
         the GM's write is the authority. */
      planner.state = foundry.utils.mergeObject(blankState(), fresh, { inplace: false });
      planner.pcs = detectPCs();
      planner.render();
      void changes; void opts; void userId;
    });
  }

  app.render(true);
})();
