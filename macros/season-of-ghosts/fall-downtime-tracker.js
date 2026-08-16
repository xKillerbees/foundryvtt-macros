/* ============================================================================
   SEASON OF GHOSTS — Act 2 Fall Downtime Tracker
   Foundry VTT v11 / v12 / v13 / v14  •  built for PF2e, but system-agnostic
   ----------------------------------------------------------------------------
   Paste this whole file into a new Macro (Type: Script) and execute it.
   State is stored on a JournalEntry flag, so it survives reloads and reboots.
   GM writes; players can be given the journal to read.
   ============================================================================ */

const FLAG_SCOPE = "world";
const FLAG_KEY = "sogFallDowntime";
const JOURNAL_NAME = "Season of Ghosts — Fall Downtime Tracker";
const MAX_PCS = 4;

/* Set to "parchment" for an autumn paper panel, or "dark" to sit inside
   Foundry's dark theme. */
const THEME = "parchment";

const PALETTES = {
  parchment: {
    paper: "#efe6d8", card: "#fbf7f0", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
    track: "rgba(0,0,0,.14)", stripe: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.07)",
    field: "#fffdf8", rust: "#95381f", ember: "#a45c14", moss: "#4b5a34",
    slate: "#3d4c59", plum: "#5d3654"
  },
  dark: {
    paper: "#1f1d1b", card: "#2a2724", ink: "#ece5da", line: "#544d44", muted: "#a4988a",
    track: "rgba(255,255,255,.12)", stripe: "rgba(255,255,255,.04)", hover: "rgba(255,255,255,.08)",
    field: "#171513", rust: "#d4664a", ember: "#e0a052", moss: "#96b06a",
    slate: "#7fa0bb", plum: "#b98ab0"
  }
};

const DEGREES = ["cf", "f", "s", "cs"];
const DEGREE_LABEL = { cs: "Crit Success", s: "Success", f: "Failure", cf: "Crit Failure" };

/* ---------------------------------------------------------------- calendar */
const EVENTS = {
  1:  { name: "An Offering for Daikitsu" },
  2:  { name: "A Slithering Situation" },
  3:  { name: "First Long Night", festival: true },
  4:  { name: "Haunted Hair", spooky: true },
  5:  { name: "The Missing Corpse" },
  6:  { name: "The Faceless Ghost", spooky: true },
  7:  { name: "An Icy Grasp", spooky: true },
  8:  { name: "Stable Fire", spooky: true },
  9:  { name: "Kimchi's Ascent", spooky: true },
  10: { name: "Feast of the Kami", feast: true },
  11: { name: "The Face at the Foot of the Bed", spooky: true },
  12: { name: "Vanishings", spooky: true }
};

/* ------------------------------------------------- PF2e inline check codes */
const SKILL_WORDS = ["Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy",
  "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Religion", "Society",
  "Stealth", "Survival", "Thievery", "Perception", "Fortitude", "Reflex", "Will"];
const SAVES = ["Fortitude", "Reflex", "Will"];

function checkSlug(skill) {
  return skill.trim().toLowerCase().replace(/\s+/g, "-");
}
function checkCode(skill, dc) {
  const type = checkSlug(skill);
  const basic = SAVES.includes(skill) ? "|basic:true" : "";
  return `@Check[type:${type}|dc:${dc}${basic}]`;
}
/* Turns every "DC 17 Farming Lore" in a block of prose into a rollable button. */
function linkifyChecks(text) {
  const rx = new RegExp(`DC (\\d+) ((?:[A-Z][a-z]+ )?Lore|${SKILL_WORDS.join("|")})`, "g");
  return text.replace(rx, (_m, dc, skill) => checkCode(skill, dc));
}

/* Roll a die formula through Foundry's Roll, tolerating the v13+ move of the
   constructor under foundry.dice. Returns the evaluated Roll, or null. */
async function rollDie(formula) {
  const C = globalThis.Roll ?? foundry.dice?.Roll ?? foundry.dice?.terms?.Roll;
  if (!C) return null;
  try { return await new C(formula).evaluate({ async: true }); } catch (err) {
    console.warn("Fall Downtime Tracker — die roll failed.", err);
    return null;
  }
}

/* --------------------------------------------------------- event details */
const EVENT_DETAIL = {
  1: {
    hook: "Minhwan, a child who nursed an injured fox back to health, dreamed of a white fox touching its nose to his head and is sure Daikitsu sent it. He shyly asks a PC what gift he should offer — nothing expensive, he adds — and offers a favor in return.",
    checks: ["DC 15 Religion to Recall Knowledge; worshippers of Daikitsu improve one degree. Simple, tasty food — inarizushi especially — left at Nine Ear Shrine. Any earnest suggestion of the players' own works too."],
    outcomes: [{ label: "Helped him choose in earnest", delta: { hope: 1 }, xp: 80 }]
  },
  2: {
    level: "Trivial 4",
    hook: "Matsu approaches, mortified: a viper swarm has nested in his outhouse pit and nearly killed him mid-business. He offers 2 gp and dinner.",
    checks: [
      "Straight to combat with the viper swarm, or let them scheme — one DC 19 check of whatever skill fits the plan (Nature to bait, Survival to smoke out, Crafting for a contraption, Diplomacy with Animal Empathy). Failure means the vipers attack.",
      "Matsu is a superb cook; dinner is its own reward, and he hands over a family ghost touch rune."
    ],
    outcomes: [
      { label: "Vipers removed, property intact", delta: { hope: 1 }, xp: 80 },
      { label: "Dealt with, but messily", xp: 80 }
    ]
  },
  3: {
    hook: "The biggest holiday in rural Shenmen, and the town badly needs it. Aid Festival Preparations is available to every PC this week only, and the contests run on the night itself.",
    checks: ["Crit successes and crit failures on Aid Festival Preparations carry a ±1 into each PC's contest checks."],
    outcomes: []
  },
  4: {
    level: "Low 4",
    hook: "Mama Bao finds clumps of hair hanging from her shop's rafters each morning, and today her customers bit into hair-filled steamed buns. She asks the PCs to spend the night and catch the culprit.",
    checks: [
      "DC 14 Perception — the strands are all one length, from one head.",
      "DC 17 Society or DC 17 Medicine — well-kept hair, plucked at the root rather than cut.",
      "DC 21 Willowshore Lore (or DC 21 Diplomacy to Gather Information the next day) — the old story of Hinode Akari, found near Gourd Lake with every hair plucked out."
    ],
    outcomes: [
      { label: "Haunt defeated or disabled", delta: { hope: 1 }, rep: { northridge: 1 } },
      { label: "Akari's story uncovered", delta: { hope: 1 } }
    ]
  },
  5: {
    hook: "Elizeth Candora reports a corpse walked out of her temple overnight and suspects You So-Jin of animating it. So-Jin is innocent — the culprit is Yami, who raised a woman who used to leave her food, and thinks it dances beautifully.",
    checks: [
      "DC 19 Perception while Investigating the temple — shambling tracks heading north.",
      "DC 20 Survival to track to the river, DC 18 Survival to pick the trail up on the far bank, DC 20 Survival to follow it to the teahouse.",
      "DC 21 Diplomacy or Intimidation to get Yami to give the zombie up; improved one degree if she's already been befriended. Intimidation or force makes her abandon Willowshore."
    ],
    outcomes: [
      { label: "Corpse returned to Elizeth", delta: { hope: 1 }, xp: 80 },
      { label: "Yami's friendship kept intact", delta: { hope: 1 } }
    ]
  },
  6: {
    level: "Low 4",
    hook: "Ho Jeong-hui, one of Willowshore's most eligible bachelors, fled his own home after a smoke-shaped figure in a featureless stone mask turned to look at him. It returns nightly and vanishes at dawn.",
    checks: [
      "DC 22 Religion to Recall Knowledge identifies the dalgyal gwishin from his description.",
      "If it isn't put down within three days it hunts Jeong-hui wherever he's hiding, then targets the PC with the highest Charisma."
    ],
    outcomes: [
      { label: "Dalgyal gwishin destroyed", delta: { hope: 1 }, rep: { northridge: 1 } },
      { label: "Ho Jeong-hui killed", delta: { hope: -1 }, rep: { northridge: -1 } }
    ]
  },
  7: {
    level: "Low 4",
    hook: "Goh, who let his younger brother drown fifty years ago, felt hands close on his ankles in the river today. The haunt is his own shame, not his brother — and it only manifests when Goh himself enters the water.",
    checks: [
      "DC 19 Perception as he tells the story to suspect the shame is the source; on a crit success, the PC works out that Diplomacy to help him forgive himself may end it outright.",
      "The haunt strikes the moment Goh steps into the river. He drowns if the party is slow."
    ],
    outcomes: [
      { label: "Haunt ended, Goh survives", delta: { hope: 1 } },
      { label: "Goh drowns", delta: { hope: -1 } }
    ]
  },
  8: {
    hook: "Smoke rises from the main barn at Willowshore Stables late in the week. The livestock are already out; the fire now threatens the pasture and the town beyond it.",
    checks: [
      "Fight Barn Fire — DC 19 Athletics (bucket brigade, fire breaks) or DC 21 Diplomacy (organize the townsfolk). Spellcasters may expend up to three helpful spells and roll their tradition skill at DC 17 for three, 19 for two, 21 for one.",
      "Crit success 2 VP and 1 Hope · success 1 VP · failure 3d6 fire, DC 19 basic Reflex · crit failure −1 VP and 3d10 fire, DC 19 basic Reflex.",
      "Afterward, an hour Investigating the ruin turns up a beheaded tengu skeleton with a mark of crime. DC 17 Willowshore Lore or DC 17 Diplomacy recalls the arsonist Nin Nok — whose unmarked grave northwest of town has been dug open from the inside."
    ],
    outcomes: [
      { label: "3+ VP — blaze contained", xp: 80, rep: { southbank: 1 } },
      { label: "−1 VP or worse — barn lost", delta: { food: -2, security: -2 }, rep: { southbank: -1 } },
      { label: "Nin Nok mystery uncovered", xp: 40 }
    ]
  },
  9: {
    hook: "Kimchi, a fluffy orange-and-white village cat, chased a squirrel thirty feet up a tree outside town and is now yowling for help. The villagers won't risk it.",
    checks: [
      "DC 15 Athletics to Climb, then DC 19 Athletics to grapple her — a crit failure means the PC falls.",
      "Climbing down takes −2 unless she's bagged. Animal Empathy plus DC 19 Diplomacy talks her down on her own.",
      "If nobody tries, a local youth attempts it and slips halfway down."
    ],
    outcomes: [
      { label: "Kimchi rescued", delta: { hope: 1 }, xp: 10 },
      { label: "Kimchi dies, or nobody tries", delta: { hope: -1 } }
    ]
  },
  10: {
    hook: "Shinzo arrives at the teahouse and suggests a feast for the town's kami — lifting the spirits of the actual spirits. Each PC gets three Prepare for the Feast activities this week instead of downtime.",
    checks: [
      "Decorate — DC 17 Art Lore or DC 19 Performance. Banquet — DC 17 Food Lore, DC 17 Drink Lore, or DC 19 Crafting. Invitations — DC 17 Religion or DC 19 Diplomacy.",
      "Every check after Great Willow is invited gains +1. The tea ceremony itself is DC 17 Tea Lore or DC 21 Society, modified by Banquet Points."
    ],
    outcomes: [
      { label: "Teahouse still in ruins — no feast", delta: { hope: -2 } }
    ]
  },
  11: {
    hook: "One PC dreams of a Willowshore whose people have clouds of blood-red butterflies for heads, wakes to their own upside-down ghostly face at the foot of the bed, and is cut by the butterflies it bursts into.",
    checks: [
      "Face at the Foot of the Bed, Curse 5 (rare, magical) — DC 19 Will. On a failure: −1 to saves against fear, and stupefied 1 for 24 hours each time the PC drops to 0 HP. The duration resets rather than stacking."
    ],
    outcomes: [],
    randomTarget: true
  },
  12: {
    hook: "Mago Kai's exorcists complete their first true exorcism, and a villager the party knows simply ceases to exist — the first true death in the mindscape in 115 years. They don't reset, and their soul never reaches the River of Souls.",
    checks: [
      "Pick someone the PCs befriended but who has no role in the next two acts: De-ge, Goh, Ha Hai-er, Ho Jeong-hui, Matsu, Kum Soon-Chung, Sumika, or Mama Bao.",
      "Best timed to the last day of fall so it lands right before the next act opens."
    ],
    outcomes: []
  }
};

/* -------------------------------------------------------------- activities */
const ACTIVITIES = {
  repair: {
    label: "Repair and Restore",
    track: "Teahouse",
    gives: "restores the teahouse",
    skills: [["Crafting", 19], ["Architecture Lore", 21], ["Labor Lore", 21], ["Athletics", 24]],
    hint: "Spend 10 gp on resources to improve the result one degree.",
    outcome: { cs: { restoration: 2 }, s: { restoration: 1 }, f: {}, cf: { restoration: -1 } }
  },
  yami: {
    label: "Befriend Yami",
    track: "Teahouse",
    gives: "teahouse · 1 Hope",
    skills: [["Nature", 14]],
    hint: "Crit success ends this activity permanently.",
    outcome: { cs: { hope: 1 }, s: {}, f: {}, cf: {} }
  },
  ceremony: {
    label: "Host Ceremony",
    track: "Hope",
    gives: "Hope",
    skills: [["Performance", 19], ["Society", 21]],
    hint: "Requires restored teahouse + tea ware. 10 gp of supplies (or 100 gp to treat a failure as a success).",
    outcome: { cs: { hope: 2 }, s: { hope: 1 }, f: {}, cf: { hope: -1 } }
  },
  harvest: {
    label: "Aid Harvest",
    track: "Food",
    gives: "Food",
    skills: [["Farming Lore", 17], ["Athletics", 19], ["Nature", 21]],
    outcome: { cs: { food: 2 }, s: { food: 1 }, f: {}, cf: { food: -1 } }
  },
  hunt: {
    label: "Aid Hunt",
    track: "Food",
    gives: "Food",
    skills: [["Fishing Lore", 17], ["Hunting Lore", 17], ["Survival", 19], ["Nature", 21]],
    hint: "Success or crit failure closes the activity for the rest of the week.",
    outcome: { cs: { food: 2 }, s: { food: 1 }, f: {}, cf: { food: -1 } }
  },
  townsfolk: {
    label: "Aid Townsfolk",
    track: "Security",
    gives: "Security, or Security + Hope",
    skills: [["Athletics", 17], ["Willowshore Lore", 19], ["Performance", 21]],
    hint: "On a crit success, choose 2 Security or 1 Security + 1 Hope.",
    outcome: { cs: { security: 2 }, s: { security: 1 }, f: {}, cf: { security: -1 } }
  },
  reinforce: {
    label: "Reinforce Buildings",
    track: "Security",
    gives: "Security",
    skills: [["Architecture Lore", 17], ["Engineering Lore", 17], ["Crafting", 19], ["Athletics", 21]],
    hint: "Crit failure: DC 20 Fortitude save or enfeebled 1 / clumsy 1 for a week.",
    outcome: { cs: { security: 2 }, s: { security: 1 }, f: {}, cf: { security: -1 } }
  },
  festival: {
    label: "Aid Festival Preparations",
    track: "Hope",
    gives: "Hope",
    week: 3,
    skills: [["Food Lore", 17], ["Games Lore", 17], ["Labor Lore", 17], ["Willowshore Lore", 17], ["Crafting", 19], ["Society", 21]],
    hint: "Week 3 only. Crit success / crit failure carries a ±1 into the First Long Night contests.",
    outcome: { cs: { hope: 2 }, s: { hope: 1 }, f: {}, cf: { hope: -1 } }
  }
};

/* Yami's Gifts — the d8 table the bonded PC rolls at the end of each week after
   a successful DC 11 flat check. Gifts 5–8 are one-time-only. */
const YAMI_GIFTS = {
  1: "A potato.",
  2: "Someone's undergarments.",
  3: "1 gold piece.",
  4: "A piece of parchment with a haiku written about the PC (it changes each time; each is written by Yami in secret).",
  5: "A jade cat talisman — one-time only; further rolls of this gift give 1 platinum piece.",
  6: "A minor armory bracelet — one-time only; further rolls give 1 platinum piece.",
  7: "A silver dagger with an inlaid emerald, worth 100 gp — one-time only; further rolls give 1 platinum piece.",
  8: "A wand of crushing leaps — one-time only; further rolls of this gift give 1 platinum piece."
};

/* Week 10's Feast of the Kami replaces downtime: each PC gets three
   Prepare-for-the-Feast checks, choosing from decorating, the banquet, or
   inviting the kami. Each check's points land in the existing feast totals. */
const FEAST_ACTS = {
  decorate: { label: "Decorate the teahouse", category: "decoration",
              skills: [["Art Lore", 17], ["Performance", 19]] },
  banquet:  { label: "Prepare the banquet", category: "banquet",
              skills: [["Food Lore", 17], ["Drink Lore", 17], ["Crafting", 19]] },
  invite:   { label: "Invite the kami", category: "entertainment",
              skills: [["Religion", 17], ["Diplomacy", 19]] }
};

/* The Night of the Feast resolves the preparation: the kami react to the
   decorations, the PCs serve the tea ceremony, and then perform. The tea
   ceremony's four degrees are recorded (the result is modified by Banquet
   Points — shown as a note, not applied — so the GM records the final degree).
   Each degree's pool delta is applied reversibly. */
const CEREMONY_OUTCOME = {
  cs: { delta: { food: 1, hope: 1 },
        note: "The kami are overwhelmed and bless the teahouse — +1 status bonus to Host Ceremony and to Crafting food and tea here from now on." },
  s:  { delta: { food: 1 },
        note: "The kami are delighted and help protect the town's food stores for the rest of winter." },
  f:  { delta: {},
        note: "Disappointed, but they don't openly mock the service." },
  cf: { delta: { food: -1, hope: -1 },
        note: "Insulted — they abandon the feast (no entertainment) and raid the food stores." }
};

/* The kami's reaction to the decorations, decided by Decoration Points. */
const DECOR_REACTION = [
  { key: "decoLow", label: "Kami mock the decor (3 or fewer)", delta: { security: -1 },
    note: "the teahouse needs Repair and Restore", when: (f) => f.decoration <= 3 },
  { key: "decoHigh", label: "Kami overwhelmed by the decor (6+)", delta: { security: 2 },
    note: "they bolster their own wards on the way home", when: (f) => f.decoration >= 6 }
];

/* After-the-Feast rewards, each toggled on/off like the event outcomes. */
const AFTER_FEAST = [
  { key: "base", label: "Feast complete", delta: { hope: 1 }, xp: 40,
    note: "regardless of how the feast went", when: () => true },
  { key: "deco", label: "Decorations 4+", delta: { security: 1 }, xp: 20,
    when: (f) => f.decoration >= 4 },
  { key: "banq", label: "Banquet 4+", delta: { food: 1 }, xp: 20,
    when: (f) => f.banquet >= 4 },
  { key: "ent",  label: "Entertainment 4+", delta: { hope: 1 }, xp: 20,
    when: (f) => f.entertainment >= 4 }
];

/* The second, non-preparation activity each PC gets every week. Stored as the
   label so states saved before this was more than a dropdown still read. */
const SECOND_SLOT = ["—", "Research the Curse", "Craft", "Earn Income", "Retraining", "Other"];
const SECOND_KEY = {
  "Research the Curse": "research", "Craft": "craft", "Earn Income": "income",
  "Retraining": "retrain", "Other": "other"
};

/* Income Earned, in copper per day: [failure, trained, expert, master, legendary].
   Row 21 is the book's "20+" row, used only by a critical success at task 20.
   Duplicated from the downtime planner on purpose — every macro here is a
   single file somebody pastes into Foundry, with nothing to import from. */
const INCOME = {
  0: [1, 5, 5, 5, 5], 1: [2, 20, 20, 20, 20], 2: [4, 30, 30, 30, 30], 3: [8, 50, 50, 50, 50],
  4: [10, 70, 80, 80, 80], 5: [20, 90, 100, 100, 100], 6: [30, 150, 200, 200, 200],
  7: [40, 200, 250, 250, 250], 8: [50, 250, 300, 300, 300], 9: [60, 300, 400, 400, 400],
  10: [70, 400, 500, 600, 600], 11: [80, 500, 600, 800, 800], 12: [90, 600, 800, 1000, 1000],
  13: [100, 700, 1000, 1500, 1500], 14: [150, 800, 1500, 2000, 2000],
  15: [200, 900, 2000, 2800, 2800], 16: [250, 1000, 2500, 3600, 4000],
  17: [300, 1200, 3000, 4500, 5500], 18: [400, 1500, 4500, 7000, 9000],
  19: [600, 2000, 6000, 10000, 13000], 20: [800, 3000, 7500, 15000, 20000],
  21: [800, 4000, 9000, 17500, 30000]
};
const LEVEL_DC = [14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27, 28, 30,
                  31, 32, 34, 35, 36, 38, 39, 40, 42, 44, 46, 48, 50];
const levelDC = (lvl) => LEVEL_DC[Math.max(0, Math.min(25, Math.round(lvl || 0)))];
const incomeRow = (lvl) => INCOME[Math.max(0, Math.min(21, Math.round(lvl || 0)))];
function earnPerDay(taskLevel, rank, degree) {
  if (degree === "cf") return 0;
  if (degree === "f") return incomeRow(taskLevel)[0];
  return incomeRow(degree === "cs" ? taskLevel + 1 : taskLevel)[Math.max(1, Math.min(4, rank || 1))];
}
function coin(cp) {
  cp = Math.round(cp || 0);
  if (!cp) return "nothing";
  const gp = Math.floor(cp / 100), sp = Math.floor((cp % 100) / 10), c = cp % 10;
  const bits = [];
  if (gp) bits.push(`${gp.toLocaleString()} gp`);
  if (sp) bits.push(`${sp} sp`);
  if (c) bits.push(`${c} cp`);
  return bits.join(" ");
}

/* The actor's skills, PF2e-shaped, with Lores flagged. Used to price Earn
   Income off the proficiency rank rather than the modifier. */
function skillsOf(actor) {
  const out = [];
  for (const [slug, st] of Object.entries(actor?.skills ?? {})) {
    if (!st) continue;
    const lore = st.lore ?? /-lore$/.test(slug);
    const item = (actor?.itemTypes?.lore ?? []).find(i => (i.slug ?? slugish(i.name)) === slug);
    const rank = Number.isInteger(item?.system?.proficient?.value) ? item.system.proficient.value
      : Number.isInteger(st.rank) ? st.rank : 1;
    out.push({ slug, label: st.label ?? slug, rank, lore });
  }
  return out.sort((a, b) => (a.lore === b.lore ? a.label.localeCompare(b.label) : (a.lore ? 1 : -1)));
}
const slugish = (s) => String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* -------------------------------------------------------------- dropped items
   Dragging an item onto the Craft second activity fills in its level and
   Price. Duplicated from the downtime planner on purpose — every macro here is
   a single file somebody pastes into Foundry, with nothing to import from. */

function readDropData(event) {
  const TE = foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
  try {
    if (TE?.getDragEventData) return TE.getDragEventData(event);
    return JSON.parse(event.dataTransfer.getData("text/plain"));
  } catch { return null; }
}

/* PF2e stores a Price as a coin purse; flatten it to the gp the book quotes. */
function priceInGP(doc) {
  const p = doc?.system?.price?.value ?? {};
  const gp = (p.pp ?? 0) * 10 + (p.gp ?? 0) + (p.sp ?? 0) / 10 + (p.cp ?? 0) / 100;
  const per = doc?.system?.price?.per ?? 1;
  return Math.round((per > 1 ? gp / per : gp) * 100) / 100;
}

/* The formula halves Craft's setup from two days to one. */
function knowsFormula(actor, doc) {
  const list = actor?.system?.crafting?.formulas ?? [];
  if (!list.length) return false;
  const want = new Set([doc?.uuid, doc?.sourceId, doc?._stats?.compendiumSource].filter(Boolean));
  return list.some(f => f?.uuid && want.has(f.uuid));
}

function itemFacts(doc, actor) {
  return {
    name: doc.name ?? "",
    level: doc.system?.level?.value ?? doc.level ?? 0,
    price: priceInGP(doc),
    uuid: doc.uuid ?? "",
    rarity: doc.system?.traits?.rarity ?? "common",
    formula: knowsFormula(actor, doc)
  };
}

/* ---------------------------------------------------------------- research */
/* `skills` is what the panels print; `opts` is the same thing parsed, so a
   player can pick one and roll it. */
const RESEARCH = {
  sojin:  { label: "You So-Jin", max: 2, skills: "DC 17 Willowshore Lore / DC 19 Diplomacy",
            opts: [["Willowshore Lore", 17], ["Diplomacy", 19]] },
  igawa:  { label: "Igawa Jubei", max: 2, skills: "DC 17 Library Lore / DC 19 Arcana",
            opts: [["Library Lore", 17], ["Arcana", 19]] },
  willow: { label: "Great Willow", max: 2, skills: "DC 19 Nature",
            opts: [["Nature", 19]] },
  solo:   { label: "Solo Investigation", max: 4, skills: "DC 17 Sangpotshi Lore / DC 19 Occultism",
            opts: [["Sangpotshi Lore", 17], ["Occultism", 19]] },
  zoudou: { label: "Zoudou's Notes", max: 3, skills: "DC 17 Academia Lore / DC 19 Religion (+2 if paired)",
            opts: [["Academia Lore", 17], ["Religion", 19]] }
};
const RANK_WORD = ["Untrained", "Trained", "Expert", "Master", "Legendary"];
const RP_MILESTONES = {
  2: "The Wall of Ghosts is the softest border — and the Tan Sugi monastery lies beyond it.",
  4: "The noppera-bo worshipped “Kugaptee.” Nindorus can now be Recalled.",
  6: "Kugaptee was a nindoru felled by Tan Sui-Jing, who reincarnated as the great sugi.",
  8: "A specialized ritual could open a passage through the Wall of Ghosts.",
  10: "Open the Wall of Ghosts is complete. Award 120 XP. Chapter 6 is open."
};

/* ------------------------------------------------------------------- state */
function blankWeek() {
  return { entries: {}, locks: {}, pen: {}, eventDone: false, log: [], feastPcs: {} };
}
function blankState(pcs) {
  return {
    v: 1,
    week: 1,
    leader: "other",
    pcs,
    pools: { hope: 3, food: 0, security: 0, restoration: 0 },
    rep: { southbank: 0, northridge: 0 },
    research: { sojin: 0, igawa: 0, willow: 0, solo: 0, zoudou: 0 },
    feast: { decoration: 0, banquet: 0, entertainment: 0, ceremony: null, entertain: {}, after: {} },
    opts: { expansion: false, teaware: false },
    yami: { bonded: false, pc: "", pcIdx: null, lockUntil: 0 },
    milestones: {},
    researchDone: false,
    playerVisible: false,
    ui: { eventOpen: true },
    weeks: { 1: blankWeek() }
  };
}

const PC_ACCENTS = ["--ember", "--moss", "--slate", "--plum"];

function pickArt(actor) {
  const token = actor.prototypeToken?.texture?.src ?? "";
  const usable = token && !/\.(webm|mp4|m4v)$/i.test(token) && !token.includes("*");
  return usable ? token : (actor.img || "icons/svg/mystery-man.svg");
}

function pcInfo(actor) {
  const sys = actor.system?.details ?? {};
  return {
    name: actor.name,
    actorId: actor.id,
    img: pickArt(actor),
    level: sys.level?.value ?? null,
    cls: sys.class?.name ?? actor.class?.name ?? "",
    ancestry: sys.ancestry?.name ?? actor.ancestry?.name ?? ""
  };
}

/* Re-reads names, art, and level from the linked actors so saved state never
   goes stale after a level-up, rename, or art change. */
function refreshPCs(pcs) {
  const detected = detectPCs();
  return (pcs ?? []).map((pc, i) => {
    const actor = pc.actorId ? game.actors.get(pc.actorId) : null;
    if (actor) return pcInfo(actor);
    if (detected[i]?.actorId) return detected[i];
    return { name: pc.name ?? `PC ${i + 1}`, actorId: "", img: pc.img || "icons/svg/mystery-man.svg",
             level: null, cls: "", ancestry: "" };
  });
}

/* Prefers the PF2e party actor, then assigned player characters, then any
   player-owned character in the directory. */
function detectPCs() {
  const seen = new Map();
  const add = (a) => { if (a?.id && !seen.has(a.id)) seen.set(a.id, pcInfo(a)); };

  const party = game.actors.party ?? game.actors.find(a => a.type === "party");
  for (const m of party?.members ?? []) add(m);

  if (seen.size < MAX_PCS) for (const u of game.users) { if (!u.isGM) add(u.character); }
  if (seen.size < MAX_PCS) {
    for (const a of game.actors) {
      if (seen.size >= MAX_PCS) break;
      if (a.hasPlayerOwner && (a.type === "character" || a.type === "PC")) add(a);
    }
  }

  const list = [...seen.values()].slice(0, MAX_PCS);
  while (list.length < MAX_PCS) {
    list.push({ name: `PC ${list.length + 1}`, actorId: "", img: "icons/svg/mystery-man.svg", level: null, cls: "", ancestry: "" });
  }
  return list;
}

const SETTING_NS = "world";
const SETTING_KEY = "sogFallDowntime";
const SETTING_ID = `${SETTING_NS}.${SETTING_KEY}`;

function registerSetting() {
  if (game.settings.settings.has(SETTING_ID)) return;
  game.settings.register(SETTING_NS, SETTING_KEY, {
    name: "Season of Ghosts fall downtime state",
    scope: "world",
    config: false,
    type: Object,
    default: null
  });
}

/* ------------------------------------------------------------ player relay
   Players can't write world settings, so the few things a player is allowed to
   change are sent to the GM's client, which re-checks ownership and performs
   the write.

   The channel is a flag on the player's own User document. `game.socket` is
   not an option here: a socket namespace has to be registered with the server
   by an installed package, so an invented `module.something` name is accepted
   by emit and then silently dropped — the sender's own optimistic repaint
   makes it look like it worked. A user may always update their own User, and
   that update fires `updateUser` on every client, including the GM's.

   Deliberately narrow: a player assigns their own character's work and rolls
   for it. Recording the result moves the town's pools, and that stays the GM's
   to do — a player's roll only proposes a degree. */
const REQ_SCOPE = "world";
const REQ_KEY = "sogDowntimeRequest";

const PLAYER_OPS = {
  pick(t, { pc, key }) {
    const w = t.w;
    const prev = w.entries[pc] ?? {};
    if (prev.result) return;
    w.entries[pc] = { activity: key || null, skill: "", result: null, delta: null,
                      rolled: null, second: prev.second ?? "—" };
    const act = ACTIVITIES[key];
    if (act) w.entries[pc].skill = `${act.skills[0][0]}|${act.skills[0][1]}`;
  },
  skill(t, { pc, value }) {
    const e = (t.w.entries[pc] ??= {});
    if (e.result) return;
    e.skill = value;
  },
  second(t, { pc, value }) {
    const e = (t.w.entries[pc] ??= {});
    e.second = value;
    /* A different activity means a different configuration; keeping the old
       one around would carry a research source into an Earn Income row. */
    e.sec = blankSecond(SECOND_KEY[value], t, pc);
  },
  secCfg(t, { pc, patch }) {
    const e = (t.w.entries[pc] ??= {});
    e.sec = e.sec ?? blankSecond(SECOND_KEY[e.second], t, pc);
    if (e.sec.applied) return;
    Object.assign(e.sec, patch ?? {});
    /* Switching research source invalidates the skill picked for the old one. */
    if (patch?.src) e.sec.skill = RESEARCH[patch.src]?.opts?.[0]?.join("|") ?? "";
  },
  secItem(t, { pc, item }) {
    const e = (t.w.entries[pc] ??= {});
    if (e.second !== "Craft") return;
    e.sec = e.sec ?? blankSecond("craft", t, pc);
    if (e.sec.applied) return;
    Object.assign(e.sec, {
      item: String(item?.name ?? "").slice(0, 120),
      ilvl: Math.max(0, Math.min(25, Math.round(Number(item?.level) || 0))),
      price: Math.max(0, Math.min(100000, Number(item?.price) || 0)),
      uuid: String(item?.uuid ?? ""),
      rarity: String(item?.rarity ?? "common"),
      formula: !!item?.formula
    });
  },
  secRolled(t, { pc, degree }) {
    const e = (t.w.entries[pc] ??= {});
    e.sec = e.sec ?? blankSecond(SECOND_KEY[e.second], t, pc);
    if (e.sec.applied) return;
    e.sec.rolled = DEGREES.includes(degree) ? degree : null;
  },
  rolled(t, { pc, degree }) {
    const e = (t.w.entries[pc] ??= {});
    if (e.result) return;
    e.rolled = DEGREES.includes(degree) ? degree : null;
  },
  feastPick(t, { pc, slot, act }) {
    const f = t.feastSlots(pc);
    f[slot] = { act: act || null, skill: act ? FEAST_ACTS[act].skills[0].join("|") : "", rolled: null };
  },
  feastSkill(t, { pc, slot, value }) {
    t.feastSlots(pc)[slot].skill = value;
  },
  feastRolled(t, { pc, slot, degree }) {
    t.feastSlots(pc)[slot].rolled = DEGREES.includes(degree) ? degree : null;
  }
};

/* Config for whichever second activity is selected. `applied` is set once the
   GM has banked a research roll, which freezes the row. */
function blankSecond(key, t, pc) {
  const base = { key: key ?? null, rolled: null, applied: false, note: "" };
  if (key === "research") return { ...base, src: "sojin", skill: RESEARCH.sojin.opts[0].join("|") };
  /* Opens on the work that pays best at the level the character can actually
     attempt, rather than whatever sorts first alphabetically at task level 0. */
  if (key === "income") return { ...base, skill: t?.skillFor(pc, "")?.slug ?? "",
                                 task: Math.max(0, t?.s?.pcs?.[pc]?.level ?? 0), days: 7 };
  if (key === "craft") return { ...base, skill: "crafting", item: "", ilvl: 1, price: 0,
                                uuid: "", rarity: "common", formula: false };
  return base;
}

function ownsPC(user, state, pcIdx) {
  const id = state?.pcs?.[pcIdx]?.actorId;
  if (!id) return false;
  const actor = game.actors.get(id);
  return !!actor && (user.isGM || actor.testUserPermission(user, "OWNER"));
}
const myPCIndexes = (state) =>
  (state.pcs ?? []).map((_, i) => i).filter(i => ownsPC(game.user, state, i));

const isPrimaryGM = () => {
  const gm = game.users.activeGM;
  if (gm) return gm.id === game.user.id;
  const gms = game.users.filter(u => u.isGM && u.active).sort((a, b) => a.id.localeCompare(b.id));
  return gms[0]?.id === game.user.id;
};
const anyGMOnline = () => game.users.some(u => u.isGM && u.active);

async function getJournal(create = false) {
  let j = game.journal.getName(JOURNAL_NAME);
  if (!j && create && game.user.isGM) {
    j = await JournalEntry.create({
      name: JOURNAL_NAME,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      pages: [{
        name: "About",
        type: "text",
        text: { content: "<p>Live state for the Act 2 fall preparation subsystem. Run the <em>Fall Downtime Tracker</em> macro to open it.</p>" }
      }]
    });
  }
  return j;
}

/* ------------------------------------------------------------------ engine */
class Tracker {
  constructor(journal, state) {
    this.journal = journal;
    this.state = state;
  }
  get s() { return this.state; }
  get w() {
    const k = String(this.s.week);
    if (!this.s.weeks[k]) this.s.weeks[k] = blankWeek();
    return this.s.weeks[k];
  }
  get event() { return EVENTS[this.s.week] ?? { name: "—" }; }
  get editable() { return game.user.isGM; }
  get teahouseDone() { return this.s.pools.restoration >= 5; }
  get rpTotal() { return Object.values(this.s.research).reduce((a, b) => a + b, 0); }
  get hopePenalty() { return this.s.pools.hope < 0; }

  log(msg) { this.w.log.unshift(msg); this.w.log = this.w.log.slice(0, 40); }

  async save() {
    if (!this.editable) return;
    await game.settings.set(SETTING_NS, SETTING_KEY, this.s);
  }

  /* The one way a player changes anything. The GM runs the op locally; a
     player runs it for an immediate repaint and relays it, and the GM's write
     comes back through the updateSetting hook as the authority. */
  async apply(op, data) {
    if (!PLAYER_OPS[op]) return;
    if (this.editable) {
      PLAYER_OPS[op](this, data);
      this.render();
      await this.save();
      return;
    }
    if (!ownsPC(game.user, this.s, data?.pc)) return ui.notifications.warn("That isn't your character.");
    if (!anyGMOnline()) {
      return ui.notifications.error("No GM is logged in, so that can't be saved. Your change was not kept.");
    }
    PLAYER_OPS[op](this, data);
    this.render();
    /* The timestamp guarantees a diff, so repeating the same choice still
       reaches the GM rather than being collapsed as a no-op update. */
    try {
      await game.user.setFlag(REQ_SCOPE, REQ_KEY, { op, data, t: Date.now() });
    } catch (err) {
      console.error("Fall Downtime Tracker — couldn't send that to the GM.", err);
      ui.notifications.error("That couldn't be sent to the GM. Your change was not kept.");
    }
  }

  /* Rolls the character's own statistic where the system offers one, so the
     result lands in chat with every modifier applied, and records the degree
     as a proposal for the GM. Falls back to posting a rollable inline check. */
  async rollCheck(pcIdx) {
    const e = this.w.entries[pcIdx];
    if (!e?.activity || !e.skill) return ui.notifications.warn("Pick an activity and a skill first.");
    if (e.result) return ui.notifications.info("The GM has already recorded this week's result.");
    const [skill, dc] = e.skill.split("|");
    const pc = this.s.pcs[pcIdx];
    const actor = pc?.actorId ? game.actors.get(pc.actorId) : null;
    const st = actor?.skills?.[checkSlug(skill)];
    if (st?.roll) {
      try {
        const r = await st.roll({ dc: { value: Number(dc) }, label: ACTIVITIES[e.activity]?.label });
        const d = r?.degreeOfSuccess ?? r?.options?.degreeOfSuccess;
        if (Number.isInteger(d)) await this.apply("rolled", { pc: pcIdx, degree: DEGREES[d] });
        return;
      } catch (err) {
        console.warn("Fall Downtime Tracker — statistic roll failed, posting an inline check instead.", err);
      }
    }
    return this.postCheck(pcIdx);
  }

  /* ----- the second, non-preparation activity ----- */

  secOf(pcIdx) {
    const e = this.w.entries[pcIdx] ?? {};
    const key = SECOND_KEY[e.second];
    if (!key) return null;
    const sec = e.sec ?? blankSecond(key, this, pcIdx);
    /* A state saved before the second slot did anything has a label but no
       config; treat it as freshly chosen rather than losing the choice. */
    return sec.key === key ? sec : blankSecond(key, this, pcIdx);
  }

  /* Skill and DC for whatever the second activity currently is. */
  secCheck(pcIdx) {
    const sec = this.secOf(pcIdx);
    if (!sec) return null;
    if (sec.key === "research") {
      const [skill, dc] = String(sec.skill || "").split("|");
      return skill ? { skill, dc: Number(dc) } : null;
    }
    if (sec.key === "income") {
      const sk = this.skillFor(pcIdx, sec.skill);
      return sk ? { skill: sk.label, dc: levelDC(sec.task), slug: sk.slug } : null;
    }
    if (sec.key === "craft") {
      const sk = this.skillFor(pcIdx, sec.skill || "crafting");
      return sk ? { skill: sk.label, dc: levelDC(sec.ilvl), slug: sk.slug } : null;
    }
    return null;
  }

  /* An empty slug means "whatever pays most" — the right opening guess for
     Earn Income, where alphabetical order lands on Acrobatics. */
  skillFor(pcIdx, slug) {
    const all = skillsOf(this.actorOf(pcIdx));
    if (slug) return all.find(s => s.slug === slug) ?? all.find(s => s.slug === "crafting") ?? all[0] ?? null;
    return [...all].filter(s => s.rank >= 1).sort((a, b) => b.rank - a.rank)[0] ?? all[0] ?? null;
  }

  actorOf(pcIdx) {
    const id = this.s.pcs[pcIdx]?.actorId;
    return id ? game.actors.get(id) : null;
  }

  /* What an Earn Income roll is actually worth, at the character's real rank. */
  secIncome(pcIdx) {
    const sec = this.secOf(pcIdx);
    if (sec?.key !== "income") return null;
    const sk = this.skillFor(pcIdx, sec.skill);
    const rank = sk?.rank ?? 1;
    const per = (d) => earnPerDay(sec.task, rank, d);
    return {
      rank, days: sec.days, task: sec.task,
      perDay: { cs: per("cs"), s: per("s"), f: per("f"), cf: 0 },
      total: sec.rolled ? per(sec.rolled) * sec.days : null
    };
  }

  async rollSecond(pcIdx) {
    const sec = this.secOf(pcIdx);
    const chk = this.secCheck(pcIdx);
    if (!sec || !chk) return ui.notifications.warn("Choose a second activity and a skill for it first.");
    if (sec.applied) return ui.notifications.info("The GM has already banked this one.");
    const actor = this.actorOf(pcIdx);
    const st = actor?.skills?.[chk.slug ?? checkSlug(chk.skill)];
    if (st?.roll) {
      try {
        const r = await st.roll({ dc: { value: chk.dc }, label: this.w.entries[pcIdx]?.second });
        const d = r?.degreeOfSuccess ?? r?.options?.degreeOfSuccess;
        if (Number.isInteger(d)) await this.apply("secRolled", { pc: pcIdx, degree: DEGREES[d] });
        return;
      } catch (err) {
        console.warn("Fall Downtime Tracker — statistic roll failed, posting an inline check instead.", err);
      }
    }
    const pc = this.s.pcs[pcIdx];
    await ChatMessage.create({
      content: `<p style="margin:0 0 4px"><b>${esc(pc.name)}</b> — ${esc(this.w.entries[pcIdx]?.second ?? "")}</p>${checkCode(chk.skill, chk.dc)}`,
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : { alias: "Willowshore" }
    });
  }

  /* GM only: bank a player's research roll into the Research Point tally. The
     roll itself proposes; this is what actually moves the number. */
  bankResearch(pcIdx) {
    const sec = this.secOf(pcIdx);
    if (!this.editable || sec?.key !== "research" || !sec.rolled || sec.applied) return;
    this.addResearch(sec.src, sec.rolled);
    const e = this.w.entries[pcIdx];
    e.sec = { ...sec, applied: true };
    this.render();
    this.save();
  }

  /* ----- Yami's weekly gift ----- */
  /* Which PC Yami is bonded to, by stored index with a name fallback for states
     saved before the index existed. */
  yamiPcIndex() {
    const y = this.s.yami;
    if (!y?.bonded) return null;
    if (y.pcIdx != null && this.s.pcs[y.pcIdx]) return y.pcIdx;
    const byName = this.s.pcs.findIndex(p => p.name === y.pc);
    return byName >= 0 ? byName : null;
  }

  /* The reminder shown inside the bonded PC's own card: an obvious banner with
     the end-of-week DC 11 flat check and the follow-up d8 gift roll. */
  yamiBanner(i, ro) {
    if (this.yamiPcIndex() !== i) return "";
    const name = this.s.pcs[i]?.name ?? this.s.yami.pc;
    return `
      <div class="yami-banner">
        <div class="yb-title"><i class="fa-solid fa-cat"></i> Yami is bonded to ${esc(name)}</div>
        <div class="yb-text">At the end of each week, roll a DC 11 flat check. On a success, Yami brings a gift — roll a d8 on Yami's Gifts.</div>
        <button type="button" class="yb-btn" data-act="yamigift" ${ro ? "disabled" : ""}><i class="fa-solid fa-dice-d20"></i> Roll Yami's gift <small>DC 11 flat check, then d8</small></button>
      </div>`;
  }

  /* Rolls the DC 11 flat check; on a success it rolls the d8 and names the
     gift. Personal, so it posts straight to chat — no pool moves, no relay. */
  async rollYamiGift() {
    const i = this.yamiPcIndex();
    const pc = i != null ? this.s.pcs[i] : null;
    const name = pc?.name ?? this.s.yami?.pc ?? "the PC";
    const actor = pc?.actorId ? game.actors.get(pc.actorId) : null;
    const speaker = actor ? ChatMessage.getSpeaker({ actor }) : { alias: "Yami" };

    const flat = await rollDie("1d20");
    if (!flat) {
      return ChatMessage.create({
        content: `<p style="margin:0 0 4px"><b>${esc(name)}</b> — Yami's gift: DC 11 flat check (on a success, roll a d8 on Yami's Gifts)</p>@Check[type:flat|dc:11]`,
        speaker
      });
    }
    const ok = flat.total >= 11;
    await flat.toMessage({ flavor: `Yami's gift — ${esc(name)} rolls a DC 11 flat check: ${ok ? "success" : "failure"}`, speaker });
    if (!ok) return ChatMessage.create({ content: "<p>No gift this week — Yami keeps her treasures to herself.</p>", speaker: { alias: "Yami" } });

    const d8 = await rollDie("1d8");
    if (!d8) return ChatMessage.create({ content: `<p>Yami brings ${esc(name)} a gift — roll a d8 on Yami's Gifts.</p>`, speaker: { alias: "Yami" } });
    const gift = YAMI_GIFTS[d8.total] ?? "Something unexpected.";
    await d8.toMessage({ flavor: `Yami brings ${esc(name)} a gift — ${gift}`, speaker });
  }

  /* ----- Week 10: Feast of the Kami ----- */

  feastSlots(pcIdx) {
    const w = this.w;
    w.feastPcs = w.feastPcs ?? {};
    return w.feastPcs[pcIdx] ??= [{}, {}, {}];
  }

  async rollFeast(pcIdx, slotIdx) {
    const slot = this.feastSlots(pcIdx)[slotIdx];
    if (!slot?.act || !slot.skill) return ui.notifications.warn("Pick a feast activity and a skill first.");
    const [skill, dc] = slot.skill.split("|");
    const pc = this.s.pcs[pcIdx];
    const actor = pc?.actorId ? game.actors.get(pc.actorId) : null;
    const st = actor?.skills?.[checkSlug(skill)];
    if (st?.roll) {
      try {
        const r = await st.roll({ dc: { value: Number(dc) }, label: FEAST_ACTS[slot.act].label });
        const d = r?.degreeOfSuccess ?? r?.options?.degreeOfSuccess;
        if (Number.isInteger(d)) await this.apply("feastRolled", { pc: pcIdx, slot: slotIdx, degree: DEGREES[d] });
        return;
      } catch (err) {
        console.warn("Fall Downtime Tracker — feast roll failed, posting an inline check instead.", err);
      }
    }
    await ChatMessage.create({
      content: `<p style="margin:0 0 4px"><b>${esc(pc.name)}</b> — ${FEAST_ACTS[slot.act].label}</p>${checkCode(skill, dc)}`,
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : { alias: "Willowshore" }
    });
  }

  bankFeast(pcIdx, slotIdx) {
    if (!this.editable) return;
    const slot = this.feastSlots(pcIdx)[slotIdx];
    if (!slot?.act || !slot.rolled || slot.applied) return;
    const cat = FEAST_ACTS[slot.act].category;
    const gain = slot.rolled === "cs" ? 2 : slot.rolled === "s" ? 1 : slot.rolled === "cf" ? -1 : 0;
    this.s.feast = this.s.feast ?? { decoration: 0, banquet: 0, entertainment: 0 };
    this.s.feast[cat] = Math.max(0, (this.s.feast[cat] ?? 0) + gain);
    slot.applied = true;
    const note = slot.rolled === "cs" ? " — one of the two points may go to any category" : "";
    this.log(`Feast — ${this.s.pcs[pcIdx].name}, ${FEAST_ACTS[slot.act].label}: ${DEGREE_LABEL[slot.rolled]}${gain ? ` (${gain > 0 ? "+" : ""}${gain} ${cap(cat)})` : ""}${note}`);
    this.afterChange();
  }

  /* ----- Night of the Feast: ceremony, entertainment, rewards ----- */

  async postNightChecks() {
    await ChatMessage.create({
      content: `<p style="margin:0 0 4px"><b>Night of the Feast — the tea ceremony</b></p>` +
        `<p style="margin:0 0 4px">One organizer attempts ${checkCode("Tea Lore", 17)} or ${checkCode("Society", 21)} — other PCs Aid with Tea Lore or Society.</p>` +
        `<p style="margin:0">Entertainment — each PC describes their act and attempts a check against DC 19 with the skill that fits (e.g. ${checkCode("Performance", 19)}, ${checkCode("Acrobatics", 19)}, ${checkCode("Athletics", 19)}, or a tradition skill).</p>`,
      speaker: { alias: "Willowshore" }
    });
  }

  setCeremony(degree) {
    const f = this.s.feast ??= { decoration: 0, banquet: 0, entertainment: 0, ceremony: null, entertain: {}, after: {} };
    if (!DEGREES.includes(degree)) return;
    const prev = f.ceremony;
    if (prev === degree) f.ceremony = null;
    else f.ceremony = degree;
    if (prev) this.applyDelta(Object.fromEntries(Object.entries(CEREMONY_OUTCOME[prev].delta).map(([k, v]) => [k, -v])));
    if (f.ceremony) this.applyDelta(CEREMONY_OUTCOME[f.ceremony].delta);
    this.log(`Feast — tea ceremony: ${f.ceremony ? DEGREE_LABEL[f.ceremony] : "cleared"}.`);
    this.afterChange();
  }

  setEntertain(pcIdx, degree) {
    const f = this.s.feast ??= { decoration: 0, banquet: 0, entertainment: 0, ceremony: null, entertain: {}, after: {} };
    f.entertain = f.entertain ?? {};
    if (f.entertain[pcIdx] === degree) delete f.entertain[pcIdx];
    else f.entertain[pcIdx] = DEGREES.includes(degree) ? degree : undefined;
    const name = this.s.pcs[pcIdx]?.name ?? "PC";
    this.log(`Feast — ${name} entertainment: ${f.entertain[pcIdx] ? DEGREE_LABEL[f.entertain[pcIdx]] : "cleared"}.`);
    this.afterChange();
  }

  toggleAfterFeast(key) {
    const f = this.s.feast ??= { decoration: 0, banquet: 0, entertainment: 0, ceremony: null, entertain: {}, after: {} };
    f.after = f.after ?? {};
    const row = [...DECOR_REACTION, ...AFTER_FEAST].find(r => r.key === key);
    if (!row) return;
    const on = !!f.after[key];
    const sign = on ? -1 : 1;
    if (row.delta) this.applyDelta(Object.fromEntries(Object.entries(row.delta).map(([k, v]) => [k, v * sign])));
    if (row.xp && !on) ui.notifications.info(`Award ${row.xp} XP — ${row.label}.`);
    f.after[key] = !on;
    const bits = [];
    if (row.delta) bits.push(...Object.entries(row.delta).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`));
    if (row.xp) bits.push(`${row.xp} XP`);
    this.log(`Feast — ${on ? "undid" : "applied"}: ${row.label}${bits.length ? " (" + bits.join(", ") + ")" : ""}.`);
    this.afterChange();
  }

  toggleFeastRep(faction) {
    const f = this.s.feast ??= { decoration: 0, banquet: 0, entertainment: 0, ceremony: null, entertain: {}, after: {} };
    f.after = f.after ?? {};
    const cur = f.after.rep;
    if (cur === faction) {
      this.s.rep[faction] -= 1;
      f.after.rep = null;
      this.log(`Feast — undid: +1 Rep ${cap(faction)} (10+ points).`);
    } else {
      if (cur) this.s.rep[cur] -= 1;
      this.s.rep[faction] += 1;
      f.after.rep = faction;
      this.log(`Feast — +1 Rep ${cap(faction)} (10+ points total).`);
    }
    this.afterChange();
  }

  activityAvailable(key, pcIdx) {
    const act = ACTIVITIES[key];
    if (act.week && act.week !== this.s.week) return "Week " + act.week + " only";
    if (key === "repair" && this.teahouseDone) return "Teahouse restored";
    if (key === "yami" && this.s.yami.bonded) return "Yami is bonded";
    if (key === "yami" && this.s.week <= this.s.yami.lockUntil) return "Yami is hiding";
    if (key === "ceremony" && !this.teahouseDone) return "Teahouse not restored";
    if (key === "ceremony" && !this.s.opts.teaware) return "No tea ware";
    if (key === "ceremony" && this.w.locks.ceremony) return "Closed this week";
    if (key === "hunt" && this.w.locks.hunt) return "Hunted out this week";
    void pcIdx;
    return null;
  }

  checkModifier(key) {
    const mods = [];
    if (this.hopePenalty) mods.push(["-1", "Hope is negative"]);
    if (key === "harvest" && this.s.opts.expansion) mods.push(["+1", "Village expansion secured"]);
    if (key === "ceremony" && this.w.pen.ceremony) mods.push(["-1", "Earlier ceremony faltered"]);
    return mods;
  }

  /* ----- resolve one preparation check ----- */
  resolve(pcIdx, degree) {
    const entry = this.w.entries[pcIdx];
    if (!entry?.activity) return ui.notifications.warn("Pick an activity first.");
    const key = entry.activity;
    const act = ACTIVITIES[key];
    const pc = this.s.pcs[pcIdx].name;
    let final = degree;
    const notes = [];

    // Aid Harvest: first roll of the week is improved by one degree if the expansion was secured.
    if (key === "harvest" && this.s.opts.expansion && !this.w.locks.harvestBumped) {
      final = DEGREES[Math.min(3, DEGREES.indexOf(final) + 1)];
      this.w.locks.harvestBumped = true;
      notes.push("first harvest of the week improved one degree");
    }

    const delta = { ...(act.outcome[final] ?? {}) };
    entry.result = final;
    entry.pending = null;

    // per-activity side effects
    if (key === "hunt" && (final === "s" || final === "cf")) {
      this.w.locks.hunt = true;
      notes.push("no further Aid Hunt this week");
    }
    if (key === "ceremony") {
      if (final === "f") { this.w.pen.ceremony = true; notes.push("-1 to the next ceremony this week"); }
      if (final === "cf") {
        this.w.locks.ceremony = true;
        const nk = String(this.s.week + 1);
        this.s.weeks[nk] = this.s.weeks[nk] ?? blankWeek();
        this.s.weeks[nk].pen.ceremony = true;
        notes.push("closed for the week, -1 next week");
      }
    }
    if (key === "yami") {
      if (final === "cs") {
        this.s.yami.bonded = true;
        this.s.yami.pc = pc;
        this.s.yami.pcIdx = pcIdx;
        notes.push(`Yami adopts ${pc} — DC 11 flat check each week for a gift. Award 80 XP`);
      }
      if (final === "cf") { this.s.yami.lockUntil = this.s.week + 1; notes.push("Yami bolts — unavailable this week and next"); }
    }
    if (key === "townsfolk") {
      if (final === "cs") { entry.pending = "townsfolk"; delta.security = 0; notes.push("choose the reward"); }
      if (final === "cf" && !this.w.locks.townsfolkMorale) {
        this.w.locks.townsfolkMorale = true;
        delta.hope = (delta.hope ?? 0) - 1;
        notes.push("first crit failure this week also costs 1 Hope");
      }
    }
    if (key === "reinforce" && final === "cf") notes.push(`${pc} must attempt a DC 20 Fortitude save`);
    if (key === "festival") {
      if (final === "cs") notes.push(`${pc} gains +1 to First Long Night contest checks`);
      if (final === "cf") notes.push(`${pc} takes -1 to First Long Night contest checks`);
    }

    this.applyDelta(delta);
    entry.delta = delta;

    const bits = Object.entries(delta).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`);
    this.log(`${pc} — ${act.label}: ${DEGREE_LABEL[final]}${bits.length ? " (" + bits.join(", ") + ")" : ""}${notes.length ? " · " + notes.join("; ") : ""}`);
    this.afterChange();
  }

  townsfolkChoice(pcIdx, which) {
    const entry = this.w.entries[pcIdx];
    const pc = this.s.pcs[pcIdx].name;
    const delta = which === "split" ? { security: 1, hope: 1 } : { security: 2 };
    entry.pending = null;
    entry.delta = delta;
    this.applyDelta(delta);
    this.log(`${pc} — Aid Townsfolk reward: ${which === "split" ? "+1 Security, +1 Hope" : "+2 Security"}`);
    this.afterChange();
  }

  applyDelta(delta) {
    for (const [k, v] of Object.entries(delta)) {
      if (!v) continue;
      this.s.pools[k] = (this.s.pools[k] ?? 0) + v;
    }
    if (this.s.pools.restoration > 5) this.s.pools.restoration = 5;
    if (this.s.pools.restoration < 0) this.s.pools.restoration = 0;
  }

  afterChange() {
    // Preparation awards: first time a category reaches 12.
    for (const k of ["hope", "food", "security"]) {
      if (this.s.pools[k] >= 12 && !this.s.milestones[k]) {
        this.s.milestones[k] = true;
        ui.notifications.info(`${cap(k)} Points reached 12 — award 40 XP and 1 Reputation Point.`);
        this.log(`★ ${cap(k)} hit 12 — 40 XP and 1 Reputation Point to a faction of the party's choice.`);
      }
    }
    if (this.teahouseDone && !this.s.milestones.teahouse) {
      this.s.milestones.teahouse = true;
      ui.notifications.info("The Cerulean Teahouse is restored — award 80 XP and 1 Reputation Point with both factions.");
      this.log("★ Cerulean Teahouse restored — 80 XP, +1 Reputation with both factions.");
    }
    this.render();
    this.save();
  }

  addResearch(key, degree) {
    const src = RESEARCH[key];
    const gain = degree === "cs" ? 2 : degree === "s" ? 1 : degree === "cf" ? -1 : 0;
    const before = this.rpTotal;
    let val = this.s.research[key] + gain;
    val = Math.max(0, Math.min(src.max, val));
    const actual = val - this.s.research[key];
    this.s.research[key] = val;
    this.log(`Research — ${src.label}: ${DEGREE_LABEL[degree]}${actual ? ` (${actual > 0 ? "+" : ""}${actual} RP)` : " (capped)"}`);
    for (const step of [2, 4, 6, 8, 10]) {
      if (before < step && this.rpTotal >= step) {
        ui.notifications.info(`${step} Research Points: ${RP_MILESTONES[step]}`);
        this.log(`★ ${step} RP — ${RP_MILESTONES[step]}`);
      }
    }
    this.afterChange();
  }

  /* Once the research reaches 10 RP and the GM has explained the milestone to
     the players, this swaps the research panel for the next steps. */
  toggleResearchDone() {
    if (this.rpTotal < 10) return ui.notifications.warn("Reach 10 Research Points before marking the research complete.");
    this.s.researchDone = !this.s.researchDone;
    this.log(this.s.researchDone
      ? "★ Research complete — the Open the Wall of Ghosts ritual is known. Next: Chapter 6."
      : "Research panel reopened.");
    this.render();
    this.save();
  }

  bump(pool, n) {
    this.applyDelta({ [pool]: n });
    this.log(`Manual adjustment: ${n > 0 ? "+" : ""}${n} ${cap(pool)}`);
    this.afterChange();
  }

  setWeek(n) {
    n = Math.max(1, Math.min(12, n));
    this.s.week = n;
    if (!this.s.weeks[String(n)]) this.s.weeks[String(n)] = blankWeek();
    this.render();
    this.save();
  }

  toggleEvent() {
    const ev = this.event;
    this.w.eventDone = !this.w.eventDone;
    if (ev.spooky) {
      const d = this.w.eventDone ? -1 : 1;
      this.applyDelta({ hope: d });
      this.log(`${ev.name} ${this.w.eventDone ? "resolved" : "un-resolved"} — ${d > 0 ? "+" : ""}${d} Hope (supernatural event).`);
    } else {
      this.log(`${ev.name} ${this.w.eventDone ? "resolved" : "un-resolved"}.`);
    }
    this.afterChange();
  }

  toggleEventOutcome(idx) {
    const det = EVENT_DETAIL[this.s.week];
    const o = det?.outcomes?.[idx];
    if (!o) return;
    const w = this.w;
    w.eventOutcomes = w.eventOutcomes ?? {};
    const on = !!w.eventOutcomes[idx];
    const sign = on ? -1 : 1;
    if (o.delta) this.applyDelta(Object.fromEntries(Object.entries(o.delta).map(([k, v]) => [k, v * sign])));
    if (o.rep) for (const [k, v] of Object.entries(o.rep)) this.s.rep[k] += v * sign;
    if (o.xp && !on) ui.notifications.info(`Award ${o.xp} XP — ${o.label}.`);
    w.eventOutcomes[idx] = !on;
    const bits = [];
    if (o.delta) bits.push(...Object.entries(o.delta).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`));
    if (o.rep) bits.push(...Object.entries(o.rep).map(([k, v]) => `${v > 0 ? "+" : ""}${v} Rep ${cap(k)}`));
    if (o.xp) bits.push(`${o.xp} XP`);
    this.log(`${this.event.name} — ${on ? "undid" : "applied"}: ${o.label}${bits.length ? " (" + bits.join(", ") + ")" : ""}`);
    this.afterChange();
  }

  pickRandomTarget() {
    const pc = this.s.pcs[Math.floor(Math.random() * this.s.pcs.length)];
    this.w.eventTarget = pc.name;
    this.log(`${this.event.name} targets ${pc.name}.`);
    ui.notifications.info(`The face at the foot of the bed belongs to ${pc.name}.`);
    this.afterChange();
  }

  async postCheck(pcIdx) {
    const e = this.w.entries[pcIdx];
    if (!e?.activity || !e.skill) return ui.notifications.warn("Pick an activity and skill first.");
    const [skill, dc] = e.skill.split("|");
    const act = ACTIVITIES[e.activity];
    const pc = this.s.pcs[pcIdx];
    const actor = pc.actorId ? game.actors.get(pc.actorId) : null;
    await ChatMessage.create({
      content: `<p style="margin:0 0 4px"><b>${esc(pc.name)}</b> — ${act.label}</p>${checkCode(skill, dc)}`,
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : { alias: "Willowshore" }
    });
  }

  async postEventChecks() {
    const d = EVENT_DETAIL[this.s.week];
    if (!d?.checks?.length) return ui.notifications.warn("This event has no checks to post.");
    const body = d.checks.map(c => `<li style="margin-bottom:4px">${linkifyChecks(c)}</li>`).join("");
    await ChatMessage.create({
      content: `<p style="margin:0 0 4px"><b>${this.event.name}</b></p><ul style="margin:0;padding-left:1.1em;font-size:13px">${body}</ul>`,
      speaker: { alias: "Willowshore" }
    });
  }

  async writeJournal() {
    if (!this.editable) return;
    this.journal = this.journal ?? await getJournal(true);
    const page = this.journal?.pages?.contents?.[0];
    if (!page) return;
    const pl = this.s.pools;
    const chip = (l, v) => `<td style="padding:3px 10px 3px 0"><b>${l}</b> ${v}</td>`;
    const history = Object.keys(this.s.weeks).map(Number).sort((a, b) => a - b).map(wn => {
      const w = this.s.weeks[String(wn)];
      const done = Object.entries(w.entries ?? {}).filter(([, e]) => e?.activity);
      const feast = wn === 10 ? Object.entries(w.feastPcs ?? {}).flatMap(([i, slots]) =>
        (slots ?? []).filter(s => s?.act).map(s =>
          `${this.s.pcs[i]?.name ?? "?"}: ${FEAST_ACTS[s.act]?.label ?? "?"}${s.rolled ? ` (${DEGREE_LABEL[s.rolled]}${s.applied ? "" : ", proposed"})` : ""}`)) : [];
      const cells = [...done.map(([i, e]) =>
        `${this.s.pcs[i]?.name ?? "?"}: ${ACTIVITIES[e.activity]?.label ?? "?"}${e.result ? ` (${DEGREE_LABEL[e.result]})` : ""}`), ...feast].join("; ");
      if (!cells) return "";
      return `<tr><td style="padding:3px 10px 3px 0;white-space:nowrap"><b>Week ${wn}</b></td><td style="padding:3px 0">${cells}</td></tr>`;
    }).join("");

    const html = `
      <h2>Willowshore — week ${this.s.week} of fall</h2>
      <p><em>${this.event.name}</em></p>
      <table><tr>${chip("Hope", pl.hope)}${chip("Food", pl.food)}${chip("Security", pl.security)}${chip("Teahouse", pl.restoration)}${chip("Research", this.rpTotal)}</tr></table>
      <p><b>Reputation</b> — Southbank ${this.s.rep.southbank}, Northridge ${this.s.rep.northridge}</p>
      ${history ? `<h3>What the party has done</h3><table>${history}</table>` : "<p><em>No preparation work recorded yet.</em></p>"}
      <hr><p style="font-size:12px"><em>Written by the Fall Downtime Tracker macro. Edits here are overwritten.</em></p>`;
    await page.update({ "text.content": html }, { render: false });
  }

  syncParty() {
    const fresh = detectPCs();
    this.s.pcs = fresh;
    const named = fresh.filter(p => p.actorId).map(p => p.name);
    ui.notifications.info(named.length ? `Party synced: ${named.join(", ")}.` : "No party members found.");
    this.render();
    this.save();
  }

  clearWeek() {
    const k = String(this.s.week);
    this.s.weeks[k] = blankWeek();
    this.log(`Week ${k} assignments cleared (pool totals untouched).`);
    this.render();
    this.save();
  }

  async postSummary() {
    const pl = this.s.pools;
    const ev = this.event;
    const D = { paper: "#efe6d8", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
                ember: "#a45c14", moss: "#4b5a34", rust: "#95381f", slate: "#3d4c59" };

    const meter = (label, val, color) => `
      <td style="padding:0 3px 0 0;width:20%;vertical-align:top;border-top:2px solid ${color}">
        <div style="font-size:9px;letter-spacing:0;text-transform:uppercase;color:${D.muted};padding-top:3px;white-space:nowrap">${label}</div>
        <div style="font-size:16px;font-weight:600;color:${color};line-height:1.2;white-space:nowrap">${val}</div>
      </td>`;

    const rows = Object.entries(this.w.entries).map(([i, e]) => {
      if (!e?.activity) return "";
      const act = ACTIVITIES[e.activity];
      const bits = e.delta ? Object.entries(e.delta).filter(([, v]) => v)
        .map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`).join(", ") : "";
      const good = e.result === "cs" || e.result === "s";
      const tone = !e.result ? D.muted : good ? D.moss : D.rust;
      return `<tr>
        <td style="padding:3px 8px 3px 0;border-top:1px solid rgba(0,0,0,.1);font-weight:600;white-space:nowrap">${esc(this.s.pcs[i]?.name ?? "?")}</td>
        <td style="padding:3px 8px 3px 0;border-top:1px solid rgba(0,0,0,.1)">${act.label}</td>
        <td style="padding:3px 0;border-top:1px solid rgba(0,0,0,.1);text-align:right;white-space:nowrap;color:${tone}">
          ${e.result ? DEGREE_LABEL[e.result] : "pending"}${bits ? `<div style="font-size:10px;color:${D.muted}">${bits}</div>` : ""}</td>
      </tr>`;
    }).join("");

    /* Week 10 replaces the preparation rows with the three feast checks per PC. */
    const feastRows = this.s.week === 10
      ? Object.entries(this.w.feastPcs ?? {}).map(([i, slots]) => {
          const chosen = (slots ?? []).filter(s => s?.act);
          if (!chosen.length) return "";
          const cells = chosen.map(s => {
            const tone = s.applied ? D.moss : s.rolled ? D.ember : D.muted;
            const state = s.applied ? DEGREE_LABEL[s.rolled]
              : s.rolled ? `${DEGREE_LABEL[s.rolled]} · proposed` : "chosen";
            return `${FEAST_ACTS[s.act]?.label ?? "?"} — <span style="color:${tone}">${state}</span>`;
          }).join("<br>");
          return `<tr>
            <td style="padding:3px 8px 3px 0;border-top:1px solid rgba(0,0,0,.1);font-weight:600;white-space:nowrap">${esc(this.s.pcs[i]?.name ?? "?")}</td>
            <td style="padding:3px 0;border-top:1px solid rgba(0,0,0,.1)">${cells}</td>
          </tr>`;
        }).join("")
      : "";
    const workRows = this.s.week === 10 ? feastRows : rows;
    const workEmpty = this.s.week === 10 ? "No feast preparations recorded yet." : "No preparation work recorded yet this week.";

    /* Which sources are still worth a PC's second activity, and what they can
       roll. Skill names only — the DCs stay on the GM's side of the screen,
       as do the point totals each source is worth. */
    /* Two stacked lines per source rather than three columns: the chat sidebar
       is narrow enough that a skills column gets squeezed under its minimum
       width and the browser starts breaking words mid-syllable. */
    const research = Object.entries(RESEARCH).map(([key, src]) => {
      const left = src.max - this.s.research[key];
      const spent = left <= 0;
      return `<tr>
        <td style="padding:4px 8px 0 0;border-top:1px solid rgba(0,0,0,.1);font-weight:600;
                   color:${spent ? D.muted : D.ink}">${src.label}</td>
        <td style="padding:4px 0 0;border-top:1px solid rgba(0,0,0,.1);text-align:right;white-space:nowrap;
                   vertical-align:top;color:${spent ? D.muted : "#5d3654"};font-weight:${spent ? 400 : 600}">
          ${spent ? "exhausted" : `${left} more`}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:0 0 4px;font-size:11px;line-height:1.3;
                   color:${D.muted}">${skillsOnly(src.skills)}</td>
      </tr>`;
    }).join("");

    const content = `
      <div style="background:${D.paper};color:${D.ink};border:1px solid ${D.line};border-radius:4px;
                  padding:8px 10px;font-family:Signika,sans-serif;line-height:1.35">
        <div style="border-left:3px solid ${ev.spooky ? "#5d3654" : D.ember};padding-left:8px;margin-bottom:8px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:${D.muted}">Week ${this.s.week} of 12</div>
          <div style="font-size:15px;font-weight:600">${ev.name}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:8px"><tr>
          ${meter("Hope", pl.hope, D.ember)}${meter("Food", pl.food, D.moss)}${meter("Security", pl.security, D.slate)}${meter("Teahouse", pl.restoration, D.rust)}${meter("Research", this.rpTotal, "#5d3654")}
        </tr></table>
        ${this.s.week === 10 ? `<div style="font-size:11px;margin-bottom:6px"><b>Feast of the Kami</b> — Decoration ${this.s.feast?.decoration ?? 0} · Banquet ${this.s.feast?.banquet ?? 0} · Entertainment ${this.s.feast?.entertainment ?? 0}${this.s.feast?.ceremony ? ` · Tea ceremony ${DEGREE_LABEL[this.s.feast.ceremony]}` : ""}</div>` : ""}
        ${workRows
          ? `<table style="width:100%;border-collapse:collapse;font-size:12px">${workRows}</table>`
          : `<div style="font-size:12px;color:${D.muted}">${workEmpty}</div>`}
        <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:${D.muted};margin:10px 0 2px">
          Researching the curse
        </div>
        <div style="font-size:10px;color:${D.muted};margin-bottom:2px">One non-preparation activity per PC per week</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">${research}</table>
      </div>`;
    await ChatMessage.create({ content, speaker: { alias: "Willowshore Trade Office" } });
  }

  render() { this.app?.render(); }
}

/* ------------------------------------------------------------- the journal
   The Season of Ghosts module ships this chapter as a journal entry with a
   fixed id, and a Foundry adventure import keeps that id — so a button can
   open the page a section came from rather than leaving you to find it. Ids
   read out of the module's pack.

   None of this is required. The entry resolves by id, then by name, then
   through the compendiums, and if the adventure isn't in the world no link
   renders at all. */
const JOURNAL = { id: "pf2apsog07turnin", name: "Act 2.1: Turning of the Seasons" };
const JPAGE = {
  chapter: "07turningofthe00", start: "07gettingstart00", fall: "07willowshorei00",
  winter: "07preparingfor00", events: "07willowshoree00",
  hope: "07bolsteringho00", food: "07gatheringfoo00", security: "07increasingse00",
  teahouse: "07restoringthe00", research: "07researchingt00",
  feastPrep: "07preparingfor01", feastNight: "07nightofthefe00", afterFeast: "07afterthefeas00",
  nextDay: "07thenextday0000", shinzo: "07shinzosvisit00"
};
/* The twelve town events, each its own page. */
const JWEEK = {
  1: "07week1anoffer00", 2: "07week2aslithe00", 3: "07week3firstlo00", 4: "07week4haunted00",
  5: "07week5themiss00", 6: "07week6theface00", 7: "07week7anicygr00", 8: "07week8stablef00",
  9: "07week9kimchis00", 10: "07week10feasto00", 11: "07week11thefac00", 12: "07week12vanish00"
};
/* Which page explains each preparation activity. */
const JACTIVITY = {
  repair: "07restoringthe00", yami: "07restoringthe00", ceremony: "07restoringthe00",
  harvest: "07gatheringfoo00", hunt: "07gatheringfoo00",
  townsfolk: "07bolsteringho00", reinforce: "07increasingse00", festival: "07week3firstlo00"
};

const jnorm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* World only, and synchronous — the UI uses it to decide whether a link is
   worth offering before anyone clicks it. */
function journalEntry() {
  const byId = game.journal?.get?.(JOURNAL.id);
  if (byId) return byId;
  const want = jnorm(JOURNAL.name), all = [...(game.journal ?? [])];
  return all.find(j => jnorm(j.name) === want)
      ?? all.find(j => jnorm(j.name).endsWith(want)) ?? null;
}

async function journalDoc() {
  const local = journalEntry();
  if (local) return local;
  const want = jnorm(JOURNAL.name);
  for (const pack of game.packs ?? []) {
    if (pack.documentName !== "JournalEntry") continue;
    const idx = [...pack.index];
    const hit = pack.index.get?.(JOURNAL.id) ?? idx.find(e => jnorm(e.name) === want);
    if (hit) return pack.getDocument(hit._id);
  }
  return null;
}

const journalPage = (entry, pageId) =>
  (entry?.pages?.contents ?? entry?.pages ?? []).find(p => p.id === pageId) ?? null;

async function openJournal(pageId) {
  const entry = await journalDoc();
  if (!entry) {
    ui.notifications.warn(`No journal found for "${JOURNAL.name}". Looked for the id ${JOURNAL.id}, then that name in the journal directory and the compendiums.`);
    return;
  }
  const page = journalPage(entry, pageId);
  entry.sheet.render(true, page ? { pageId: page.id } : {});
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/* "DC 17 Willowshore Lore / DC 19 Diplomacy" -> "Willowshore Lore / Diplomacy" */
const skillsOnly = (s) => s.replace(/DC \d+ /g, "");
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s)) : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* --------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class SoGDowntimeApp extends BaseApp {
  constructor(tracker, ...args) {
    super(...args);
    this.tracker = tracker;
    tracker.app = this;
  }

  static DEFAULT_OPTIONS = {
    id: "sog-downtime",
    tag: "div",
    classes: ["sog-downtime"],
    position: { width: 880, height: "auto" },
    window: { title: "Willowshore — Fall Downtime", icon: "fa-solid fa-leaf", resizable: true }
  };

  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "sog-downtime",
      classes: ["sog-downtime"],
      title: "Willowshore — Fall Downtime",
      width: 880,
      height: "auto",
      resizable: true
    });
  }

  get title() { return "Willowshore — Fall Downtime"; }

  /* ---- v13 / ApplicationV2 render path ----
     (_replaceHTML is attached below the class: v1 and v2 use the same method
      name with incompatible signatures, so it can only be defined for v2.) */
  async _renderHTML() { return this.markup(); }

  /* ---- v11 / v12 Application render path ---- */
  async _renderInner() {
    const $el = $(`<div class="sog-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  /* -------------------------------------------------------------- markup */
  markup() {
    if (!game.user.isGM) return this.playerMarkup();
    const t = this.tracker, s = t.s, ev = t.event;
    const ro = !t.editable;

    const pool = (key, label, target) => {
      const val = s.pools[key];
      const pct = target ? Math.max(0, Math.min(100, (val / target) * 100)) : 0;
      const done = target && val >= target;
      return `
        <div class="pool ${key} ${done ? "met" : ""}">
          <div class="pool-head"><span>${label}</span>${target ? `<span class="target">${val}/${target}</span>` : `<span class="target">${val}</span>`}</div>
          <div class="pool-val">${val}</div>
          ${target ? `<div class="bar"><i style="width:${pct}%"></i></div>` : `<div class="bar ghost"></div>`}
          <div class="pool-btns">
            <button type="button" data-act="bump" data-pool="${key}" data-n="-1" ${ro ? "disabled" : ""}>−</button>
            <button type="button" data-act="bump" data-pool="${key}" data-n="1" ${ro ? "disabled" : ""}>+</button>
          </div>
        </div>`;
    };

    const cards = s.pcs.map((pc, i) => this.pcCard(pc, i, ro)).join("");

    const researchRows = Object.entries(RESEARCH).map(([k, r]) => {
      const v = s.research[k];
      const full = v >= r.max;
      return `
        <div class="res-row ${full ? "full" : ""}">
          <div class="res-name"><b>${r.label}</b><small>${r.skills}</small></div>
          <div class="res-val">${v}<span>/${r.max}</span></div>
          <div class="res-btns">
            ${DEGREES.slice().reverse().map(d => `<button type="button" class="deg ${d}" data-act="research" data-src="${k}" data-deg="${d}" title="${DEGREE_LABEL[d]}" ${ro ? "disabled" : ""}>${d === "cs" ? "CS" : d === "s" ? "S" : d === "f" ? "F" : "CF"}</button>`).join("")}
          </div>
        </div>`;
    }).join("");

    const rpPct = Math.min(100, (t.rpTotal / 10) * 100);

    const feast = s.week === 10 ? `
      <section class="panel feast">
        <h3>Feast of the Kami <small>three Prepare for the Feast activities per PC — no downtime this week</small> ${this.jbtn(JPAGE.feastPrep)}</h3>
        <div class="feast-grid">
          ${[["decoration", "Decorations", "4+ respected · 6+ = +2 Security"], ["banquet", "Banquet", "4–6 fine · 7+ = tea ceremony up one degree"], ["entertainment", "Entertainment", "4–6 = +1 · 7+ = +1 and one degree up"]]
        .map(([k, label, note]) => `
            <div class="feast-cell ${s.feast[k] >= 4 ? "ok" : "low"}">
              <div class="fc-head">${label}</div>
              <div class="fc-val">${s.feast[k]}</div>
              <div class="fc-note">${note}</div>
              <div class="fc-btns">
                <button type="button" data-act="feast" data-key="${k}" data-n="-1" ${ro ? "disabled" : ""}>−</button>
                <button type="button" data-act="feast" data-key="${k}" data-n="1" ${ro ? "disabled" : ""}>+</button>
              </div>
            </div>`).join("")}
        </div>
        ${this.feastNight(ro)}
        ${this.feastAfter(ro)}
      </section>` : "";

    const logRows = t.w.log.length
      ? t.w.log.map(l => `<li>${esc(l)}</li>`).join("")
      : `<li class="muted">Nothing logged for this week yet.</li>`;

    return `
      ${this.styles()}
      <div class="sog">

        <header class="topbar">
          <div class="weeknav">
            <button type="button" data-act="week" data-n="-1" title="Previous week">◀</button>
            <div class="wk">
              <span class="wk-label">Week</span>
              <span class="wk-num">${s.week}</span>
              <span class="wk-of">of 12</span>
            </div>
            <button type="button" data-act="week" data-n="1" title="Next week">▶</button>
          </div>
          <div class="event ${ev.spooky ? "spooky" : ""} ${ev.festival ? "festival" : ""}">
            <span class="ev-eyebrow">${ev.spooky ? "Supernatural event · −1 Hope" : ev.festival ? "Festival" : ev.feast ? "Feast" : "Town event"}</span>
            <span class="ev-name">${ev.name}</span>
          </div>
          <label class="evdone">
            <input type="checkbox" data-act="eventdone" ${t.w.eventDone ? "checked" : ""} ${ro ? "disabled" : ""}>
            <span>Resolved</span>
          </label>
        </header>

        <nav class="weektabs">
          ${Array.from({ length: 12 }, (_, n) => {
            const wn = n + 1;
            const wk = s.weeks[String(wn)];
            const used = wk && Object.values(wk.entries ?? {}).some(e => e?.result);
            const e = EVENTS[wn];
            return `<button type="button" class="wtab ${wn === s.week ? "on" : ""} ${used ? "used" : ""} ${e.spooky ? "spooky" : ""}" data-act="gotoweek" data-n="${wn}" title="${e.name}">${wn}</button>`;
          }).join("")}
        </nav>

        ${this.eventPanel(ro)}

        ${t.hopePenalty ? `<div class="alarm">Hope is negative — every preparation check this week takes a −1 circumstance penalty.</div>` : ""}
        ${ro ? `<div class="alarm quiet">Read-only. Only the GM can record results.</div>` : ""}

        <section class="pools">
          ${pool("hope", "Hope")}
          ${pool("food", "Food", 12)}
          ${pool("security", "Security", 12)}
          ${pool("restoration", "Teahouse", 5)}
        </section>

        <section class="grid">${cards}</section>

        ${feast}

        ${s.researchDone ? this.researchDonePanel(ro) : `
        <section class="panel research">
          <h3>Researching the Curse <small>one non-preparation activity per PC per week</small> ${this.jbtn(JPAGE.research)}</h3>
          <div class="rp-total">
            <div class="rp-num">${t.rpTotal}<span>/10 RP</span></div>
            <div class="bar"><i style="width:${rpPct}%"></i></div>
          </div>
          <div class="res-list">${researchRows}</div>
          ${t.rpTotal >= 10 ? `<button type="button" class="markdone" data-act="researchdone" ${ro ? "disabled" : ""}>Mark research complete — explained to the players</button>` : ""}
        </section>`}

        <section class="panel setup">
          <h3>Campaign state ${this.jbtn(JPAGE.chapter)}</h3>
          <div class="setup-grid">
            <label>Town elder
              <select data-act="leader" ${ro ? "disabled" : ""}>
                <option value="other" ${s.leader === "other" ? "selected" : ""}>Someone else</option>
                <option value="matsuki" ${s.leader === "matsuki" ? "selected" : ""}>Old Matsuki (+3 Food at start)</option>
                <option value="hu" ${s.leader === "hu" ? "selected" : ""}>Granny Hu (+3 Security at start)</option>
              </select>
            </label>
            <label class="check"><input type="checkbox" data-act="opt" data-key="expansion" ${s.opts.expansion ? "checked" : ""} ${ro ? "disabled" : ""}> Village expansion secured <small>+1 to Aid Harvest, first roll each week improved a degree</small></label>
            <div class="syncrow">
              <button type="button" data-act="syncparty" ${ro ? "disabled" : ""}><i class="fa-solid fa-users"></i> Sync with party</button>
              <small>Pulls names, levels, and token art from the PF2e party actor.</small>
            </div>
            <label class="check"><input type="checkbox" data-act="playervis" ${s.playerVisible ? "checked" : ""} ${ro ? "disabled" : ""}> Show the board to players <small>read-only, current week only, no log</small></label>
            <label class="check"><input type="checkbox" data-act="opt" data-key="teaware" ${s.opts.teaware ? "checked" : ""} ${ro ? "disabled" : ""}> Tea ware acquired <small>required to Host Ceremony</small></label>
            <div class="rep">
              <span>Reputation</span>
              <div class="rep-row">Southbank
                <button type="button" data-act="rep" data-key="southbank" data-n="-1" ${ro ? "disabled" : ""}>−</button>
                <b>${s.rep.southbank}</b>
                <button type="button" data-act="rep" data-key="southbank" data-n="1" ${ro ? "disabled" : ""}>+</button>
              </div>
              <div class="rep-row">Northridge
                <button type="button" data-act="rep" data-key="northridge" data-n="-1" ${ro ? "disabled" : ""}>−</button>
                <b>${s.rep.northridge}</b>
                <button type="button" data-act="rep" data-key="northridge" data-n="1" ${ro ? "disabled" : ""}>+</button>
              </div>
            </div>
          </div>
          ${s.yami.bonded ? `<p class="yami">Yami has adopted <b>${esc(s.yami.pc)}</b> — DC 11 flat check at the end of each week for a gift.</p>` : ""}
        </section>

        <section class="panel logpanel">
          <h3>Week ${s.week} log</h3>
          <ul class="log">${logRows}</ul>
        </section>

        <footer class="actions">
          <button type="button" data-act="chat"><i class="fa-solid fa-comment"></i> Post week to chat</button>
          <button type="button" data-act="journal" ${ro ? "disabled" : ""}><i class="fa-solid fa-book"></i> Update journal</button>
          <button type="button" data-act="clear" ${ro ? "disabled" : ""}><i class="fa-solid fa-eraser"></i> Clear this week</button>
          <button type="button" data-act="reset" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i> Reset campaign</button>
        </footer>
      </div>`;
  }

  eventPanel(ro) {
    const t = this.tracker, s = t.s, ev = t.event;
    const d = EVENT_DETAIL[s.week];
    if (!d) return "";
    const open = s.ui?.eventOpen !== false;
    const done = t.w.eventOutcomes ?? {};

    const body = !open ? "" : `
      <p class="hook">${d.hook}</p>
      ${d.checks?.length ? `<ul class="checks">${d.checks.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
      ${d.randomTarget ? `
        <div class="etarget">
          ${t.w.eventTarget ? `<b>${esc(t.w.eventTarget)}</b> saw their own face.` : `<span class="muted">No target chosen yet.</span>`}
          <button type="button" data-act="randtarget" ${ro ? "disabled" : ""}>Choose at random</button>
        </div>` : ""}
      ${d.outcomes?.length ? `
        <div class="eoutcomes">
          ${d.outcomes.map((o, i) => {
            const bits = [];
            if (o.delta) bits.push(...Object.entries(o.delta).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`));
            if (o.rep) bits.push(...Object.entries(o.rep).map(([k, v]) => `${v > 0 ? "+" : ""}${v} Rep`));
            if (o.xp) bits.push(`${o.xp} XP`);
            return `<button type="button" class="eout ${done[i] ? "on" : ""}" data-act="eoutcome" data-i="${i}" ${ro ? "disabled" : ""}>
              ${o.label}${bits.length ? `<span class="ebits">${bits.join(" · ")}</span>` : ""}</button>`;
          }).join("")}
        </div>` : ""}`;

    return `
      <section class="panel eventpanel ${ev.spooky ? "spooky" : ""}">
        <h3>
          <button type="button" class="collapse" data-act="toggleeventpanel" title="Show or hide">${open ? "▾" : "▸"}</button>
          Running: ${ev.name}
          ${d.level ? `<small class="lvl">${d.level}</small>` : ""}
          ${this.jbtn(JWEEK[this.tracker.s.week])}
          ${ev.spooky ? `<small>supernatural — the Resolved box docks 1 Hope</small>` : ""}
          ${d.checks?.length ? `<button type="button" class="postchecks" data-act="posteventchecks" title="Post rollable checks to chat"><i class="fa-solid fa-dice-d20"></i> Post checks</button>` : ""}
        </h3>
        ${body}
      </section>`;
  }

  /* A link into the module's journal, or nothing at all when the adventure
     isn't in this world. A button that could only ever say "not found" would
     be worse than no button. */
  jbtn(pageId, label = "") {
    const entry = journalEntry();
    if (!entry || !pageId) return "";
    const page = journalPage(entry, pageId);
    return `<button type="button" class="jbtn" data-act="journal" data-r="${esc(pageId)}"
      title="Open the journal: ${esc(page ? page.name : entry.name)}"><i class="fa-solid fa-book-open"></i>${label ? ` ${label}` : ""}</button>`;
  }

  /* Shown in place of the research panel once the GM marks the research done.
     The next step is the Open the Wall of Ghosts ritual, and when to begin it. */
  researchDonePanel(ro) {
    return `
      <section class="panel research done">
        <h3>Next steps — Open the Wall of Ghosts ${this.jbtn(JPAGE.research)}</h3>
        <div class="nextsteps">
          <p class="read"><i class="fa-solid fa-book-open"></i> Read this to the players:</p>
          <p>Your research into the nature of the so-called Willowshore Curse has revealed a possible method of opening a doorway through the eerie Wall of Ghosts found west of town.</p>
          <p>By starting with a <b>Consecrate</b> ritual and then applying Sangpotshi theories of the cyclical nature of life and reincarnation, along with insights gleaned from Zoudou's notes, you've created a magical ritual that can quiet the angry spirits that haunt this misty barrier and allow other creatures to pass through into the regions beyond.</p>
          <p>This ritual is unlikely to grant total protection from the ghosts or evil spirits within the wall itself, so once you open the wall, you and your allies might need to face additional dangers within before you can exit the other side.</p>
          <p>In addition, the ritual must be performed during a <b>crescent or new moon</b> (a time that equates to the second half of each month).</p>
          <p class="gmnote"><b>Award 120 XP</b> for completing this research.</p>
          <button type="button" class="markdone" data-act="researchdone" ${ro ? "disabled" : ""}>Reopen the research panel</button>
        </div>
      </section>`;
  }

  pcCard(pc, i, ro) {
    const t = this.tracker;
    if (t.s.week === 10) return this.feastCard(pc, i, ro);
    const entry = t.w.entries[i] ?? {};
    const opts = Object.entries(ACTIVITIES).map(([k, a]) => {
      const blocked = t.activityAvailable(k, i);
      const sel = entry.activity === k ? "selected" : "";
      const what = a.gives ? ` — ${a.gives}` : "";
      return `<option value="${k}" ${sel} ${blocked && entry.activity !== k ? "disabled" : ""}>${a.label}${what}${blocked ? ` · ${blocked.toLowerCase()}` : ""}</option>`;
    }).join("");

    const act = ACTIVITIES[entry.activity];
    const skillOpts = act
      ? act.skills.map(([n, dc]) => `<option value="${n}|${dc}" ${entry.skill === `${n}|${dc}` ? "selected" : ""}>${n} — DC ${dc}</option>`).join("")
      : `<option value="">—</option>`;

    const mods = act ? t.checkModifier(entry.activity) : [];
    const modLine = mods.length
      ? `<div class="mods">${mods.map(([v, why]) => `<span class="mod ${v.startsWith("-") ? "bad" : "good"}">${v} ${why}</span>`).join("")}</div>` : "";

    const resolved = entry.result;
    const deltaBits = entry.delta ? Object.entries(entry.delta).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`).join(", ") : "";

    const pendingUI = entry.pending === "townsfolk" ? `
      <div class="pending">
        <span>Critical success — pick the reward:</span>
        <button type="button" data-act="tchoice" data-pc="${i}" data-which="sec" ${ro ? "disabled" : ""}>+2 Security</button>
        <button type="button" data-act="tchoice" data-pc="${i}" data-which="split" ${ro ? "disabled" : ""}>+1 Sec / +1 Hope</button>
      </div>` : "";


    const sub = [pc.level ? `Level ${pc.level}` : "", pc.ancestry, pc.cls].filter(Boolean).join(" · ");
    const state = resolved ? "done" : act ? "set" : "idle";
    const stateLabel = resolved ? DEGREE_LABEL[resolved] : act ? "Assigned" : "Idle";

    return `
      <article class="card ${resolved ? "done" : ""} ${act ? "assigned" : ""}" style="--acc:var(${PC_ACCENTS[i % PC_ACCENTS.length]})">
        <div class="card-head">
          <img class="avatar" src="${pc.img || "icons/svg/mystery-man.svg"}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
          <div class="who">
            ${pc.actorId
              ? `<button type="button" class="pcname link" data-act="sheet" data-id="${pc.actorId}" title="Open ${esc(pc.name)}'s character sheet">${esc(pc.name)}</button>`
              : `<span class="pcname">${esc(pc.name)}</span>`}
            ${sub ? `<span class="pcsub">${esc(sub)}</span>` : ""}
          </div>
          <span class="status ${state}"><i></i>${stateLabel}</span>
        </div>
        ${act ? `<div class="trackbar ${act.track.toLowerCase()}">${act.track}</div>` : ""}

        <label class="fld">Preparation activity ${entry.activity ? this.jbtn(JACTIVITY[entry.activity]) : ""}
          <select data-act="pick" data-pc="${i}" ${ro ? "disabled" : ""}>
            <option value="">— choose —</option>
            ${opts}
          </select>
        </label>

        <label class="fld">Skill
          <div class="skillrow">
            <select data-act="skill" data-pc="${i}" ${ro || !act ? "disabled" : ""}>${skillOpts}</select>
            <button type="button" class="rollbtn" data-act="postcheck" data-pc="${i}" title="Post this check to chat" ${ro || !act ? "disabled" : ""}><i class="fa-solid fa-dice-d20"></i></button>
          </div>
        </label>

        ${modLine}
        ${act?.hint ? `<p class="hint">${act.hint}</p>` : ""}

        ${entry.rolled && !entry.result
          ? `<div class="proposed">${esc(pc.name)} rolled <b>${DEGREE_LABEL[entry.rolled]}</b> — click it to record what it does for the town.</div>`
          : ""}

        <div class="degrees">
          ${DEGREES.slice().reverse().map(d => `
            <button type="button" class="deg ${d} ${entry.result === d ? "on" : ""} ${!entry.result && entry.rolled === d ? "proposed" : ""}" data-act="resolve" data-pc="${i}" data-deg="${d}" ${ro || !act ? "disabled" : ""}>${DEGREE_LABEL[d]}</button>`).join("")}
        </div>

        ${pendingUI}
        ${resolved ? `<div class="outcome">${DEGREE_LABEL[resolved]}${deltaBits ? ` · ${deltaBits}` : " · no change"}</div>` : ""}

        ${this.secondBlock(i, ro)}
        ${t.yamiBanner(i, ro)}
      </article>`;
  }

  /* Week 10 has no downtime: the whole card becomes the three Prepare-for-the-
     Feast checks. Same chrome as pcCard, but the body is the feast block. */
  feastCard(pc, i, ro) {
    const t = this.tracker;
    const anyRolled = t.feastSlots(i).some(s => s.rolled);
    const sub = [pc.level ? `Level ${pc.level}` : "", pc.ancestry, pc.cls].filter(Boolean).join(" · ");
    return `
      <article class="card ${anyRolled ? "assigned" : ""}" style="--acc:var(${PC_ACCENTS[i % PC_ACCENTS.length]})">
        <div class="card-head">
          <img class="avatar" src="${pc.img || "icons/svg/mystery-man.svg"}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
          <div class="who">
            ${pc.actorId
              ? `<button type="button" class="pcname link" data-act="sheet" data-id="${pc.actorId}" title="Open ${esc(pc.name)}'s character sheet">${esc(pc.name)}</button>`
              : `<span class="pcname">${esc(pc.name)}</span>`}
            ${sub ? `<span class="pcsub">${esc(sub)}</span>` : ""}
          </div>
          <span class="status ${anyRolled ? "set" : "idle"}"><i></i>${anyRolled ? "Preparing" : "Idle"}</span>
        </div>
        <div class="trackbar hope">Feast of the Kami</div>
        ${this.feastBlock(i, ro)}
        ${t.yamiBanner(i, ro)}
      </article>`;
  }

  /* The three Prepare-for-the-Feast slots for one PC, shared by the GM and
     player cards. Rolls propose; the GM banks them into the feast totals. */
  feastBlock(i, ro) {
    const t = this.tracker;
    const slots = t.feastSlots(i);
    const rows = slots.map((f, slot) => {
      const actOpts = Object.entries(FEAST_ACTS).map(([k, a]) =>
        `<option value="${k}" ${f.act === k ? "selected" : ""}>${a.label}</option>`).join("");
      const act = FEAST_ACTS[f.act];
      const skillOpts = act
        ? act.skills.map(([n, dc]) => `<option value="${n}|${dc}" ${f.skill === `${n}|${dc}` ? "selected" : ""}>${n} — DC ${dc}</option>`).join("")
        : `<option value="">—</option>`;
      const badge = f.rolled
        ? `<span class="secres ${f.applied ? "done" : "rolled"}">${DEGREE_LABEL[f.rolled]}${f.applied ? " · banked" : ""}</span>` : "";
      const bank = t.editable && f.rolled && !f.applied
        ? `<button type="button" class="bank" data-act="feast-bank" data-pc="${i}" data-slot="${slot}">Bank ${DEGREE_LABEL[f.rolled]} into ${cap(FEAST_ACTS[f.act].category)}</button>` : "";
      return `
        <div class="secrow">
          <select data-act="feast-pick" data-pc="${i}" data-slot="${slot}" ${ro ? "disabled" : ""}>
            <option value="">— choose —</option>${actOpts}
          </select>
          <select data-act="feast-skill" data-pc="${i}" data-slot="${slot}" ${ro || !act ? "disabled" : ""}>${skillOpts}</select>
          <button type="button" class="rollbtn" data-act="feast-roll" data-pc="${i}" data-slot="${slot}"
                  title="Roll this check" ${ro || !act ? "disabled" : ""}><i class="fa-solid fa-dice-d20"></i></button>
          ${badge}
        </div>
        ${bank ? `<div class="secrow">${bank}</div>` : ""}`;
    }).join("");
    return `
      <div class="feast-pc">
        <div class="feast-pc-head">Prepare for the Feast — three checks this week, no downtime ${this.jbtn(JPAGE.feastPrep)}</div>
        ${rows}
      </div>`;
  }

  /* The Night of the Feast: the kami's reaction to the decorations, the tea
     ceremony, and the post-meal show — the GM-side resolution of week 10. */
  feastNight(ro) {
    const t = this.tracker, s = t.s;
    const f = s.feast ?? { decoration: 0, banquet: 0, entertainment: 0 };
    const banquet = f.banquet ?? 0, ent = f.entertainment ?? 0;

    const banquetMod = banquet <= 3
      ? `<span class="mod bad">−1 degree</span> (3 or fewer Banquet Points)`
      : banquet >= 7
        ? `<span class="mod good">+1 degree</span> (7 or more Banquet Points)`
        : `<span class="mod">no change</span> (4–6 Banquet Points)`;
    const entMod = ent <= 3
      ? `<span class="mod bad">−2 circumstance</span>`
      : ent >= 7
        ? `<span class="mod good">+1 circumstance, one degree up</span>`
        : `<span class="mod good">+1 circumstance</span>`;

    const cerBtns = DEGREES.slice().reverse().map(d =>
      `<button type="button" class="deg ${d} ${f.ceremony === d ? "on" : ""}" data-act="ceremony" data-deg="${d}" title="${DEGREE_LABEL[d]}" ${ro ? "disabled" : ""}>${DEGREE_LABEL[d]}</button>`).join("");
    const cer = f.ceremony ? CEREMONY_OUTCOME[f.ceremony] : null;
    const cerBits = cer ? Object.entries(cer.delta).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`).join(", ") : "";

    const entertainRows = s.pcs.map((pc, i) => {
      const deg = f.entertain?.[i];
      const btns = DEGREES.slice().reverse().map(d =>
        `<button type="button" class="deg ${d} ${deg === d ? "on" : ""}" data-act="entertain" data-pc="${i}" data-deg="${d}" title="${DEGREE_LABEL[d]}" ${ro ? "disabled" : ""}>${d === "cs" ? "CS" : d === "s" ? "S" : d === "f" ? "F" : "CF"}</button>`).join("");
      return `<div class="secrow"><span class="en-pc">${esc(pc.name)}</span><span class="en-degrees">${btns}</span></div>`;
    }).join("");
    const entSucceeded = s.pcs.filter((_, i) => ["s", "cs"].includes(f.entertain?.[i])).length;

    const deco = f.decoration ?? 0;
    const decoNote = deco <= 3
      ? `<span class="mod bad">${deco} — they mock and get rowdy</span>`
      : deco >= 6
        ? `<span class="mod good">${deco} — they're overwhelmed</span>`
        : `<span class="mod">${deco} — impressed, they treat the teahouse with respect</span>`;
    const decorBtns = DECOR_REACTION.filter(r => r.when(f)).map(r => {
      const on = !!f.after?.[r.key];
      const bits = Object.entries(r.delta).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`).join("");
      return `<button type="button" class="eout ${on ? "on" : ""}" data-act="afterfeast" data-key="${r.key}" ${ro ? "disabled" : ""}>${r.label}<span class="ebits">${bits}${r.note ? " · " + r.note : ""}</span></button>`;
    }).join("");

    return `
      <div class="feast-night">
        <h4>Night of the Feast ${this.jbtn(JPAGE.feastNight)}</h4>
        <div class="fn-block">
          <div class="fn-head">Tea ceremony <span class="fn-sub">one organizer — DC 17 Tea Lore or DC 21 Society, other PCs Aid · result modified by Banquet Points: ${banquetMod}</span></div>
          <div class="degrees">${cerBtns}</div>
          ${cer ? `<div class="fn-result">${DEGREE_LABEL[f.ceremony]}: ${cer.note}${cerBits ? ` <b>(${cerBits})</b>` : ""}</div>` : ""}
          <button type="button" class="postchecks" data-act="postnight" ${ro ? "disabled" : ""}><i class="fa-solid fa-dice-d20"></i> Post the night's checks</button>
        </div>
        <div class="fn-block">
          <div class="fn-head">Entertainment <span class="fn-sub">each PC vs DC 19, skill to suit the act · Entertainment Points set the modifier: ${entMod}</span></div>
          ${entertainRows}
          <div class="fn-line">${entSucceeded} of ${s.pcs.length} succeeded — ${entSucceeded >= 2 ? "the kami leave a gift to find in the morning." : "no morning gift (two successes needed)."}</div>
        </div>
        <div class="fn-block">
          <div class="fn-head">Decorations <span class="fn-sub">${decoNote}</span></div>
          ${decorBtns ? `<div class="fn-decor">${decorBtns}</div>` : ""}
        </div>
      </div>`;
  }

  /* After the Feast: the threshold rewards, the Reputation point, and the next
     morning's visit from Shinzo. */
  feastAfter(ro) {
    const t = this.tracker, s = t.s;
    const f = s.feast ?? { decoration: 0, banquet: 0, entertainment: 0 };
    f.after = f.after ?? {};

    const rewardBtns = AFTER_FEAST.map(r => {
      const met = r.when(f);
      const on = !!f.after[r.key];
      const bits = [];
      if (r.delta) bits.push(...Object.entries(r.delta).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${cap(k)}`));
      if (r.xp) bits.push(`${r.xp} XP`);
      return `<button type="button" class="eout ${on ? "on" : ""}" data-act="afterfeast" data-key="${r.key}"
        ${ro || !met ? "disabled" : ""}>${r.label}
        ${met ? `<span class="ebits">${bits.join(" · ")}${r.note ? " · " + r.note : ""}</span>` : `<span class="ebits">not met</span>`}</button>`;
    }).join("");

    const repMet = (f.decoration + f.banquet + f.entertainment) >= 10;
    const repRow = repMet ? `
      <div class="fn-line">10+ points overall — 1 Reputation to the faction of the party's choice:
        ${[["southbank", "Southbank"], ["northridge", "Northridge"]].map(([k, label]) =>
          `<button type="button" class="eout ${f.after.rep === k ? "on" : ""}" data-act="feastrep" data-faction="${k}" ${ro ? "disabled" : ""}>+1 ${label}</button>`).join(" ")}
      </div>` : "";

    const entSucceeded = s.pcs.filter((_, i) => ["s", "cs"].includes(f.entertain?.[i])).length;
    const attempted = Object.values(t.w.feastPcs ?? {}).some(slots => (slots ?? []).some(x => x?.applied)) || !!f.ceremony;
    const nextDay = `
      <div class="fn-block">
        <div class="fn-head">The next day ${this.jbtn(JPAGE.nextDay)}</div>
        ${entSucceeded >= 2 ? `<div class="fn-line">Shinzo's gift — a 5th-level permanent item for each PC (a +1 armor potency rune or a 2nd-level wand fit well).</div>` : ""}
        ${attempted ? `<div class="fn-line">Shinzo returns with a green-cloth book holding every Magic Tea formula, plus the <em>Winter's Breath</em> formula.</div>` : ""}
      </div>`;

    return `
      <div class="feast-after">
        <h4>After the feast ${this.jbtn(JPAGE.afterFeast)}</h4>
        <div class="fn-decor">${rewardBtns}</div>
        ${repRow}
        ${nextDay}
      </div>`;
  }

  /* The second activity, made doable rather than just named. Shared by the GM
     card and the player card — the only difference is who may touch it and
     that banking a research roll is the GM's. */
  secondBlock(i, ro) {
    const t = this.tracker;
    const e = t.w.entries[i] ?? {};
    const sec = t.secOf(i);
    const dis = (ro || sec?.applied) ? "disabled" : "";

    const head = `
      <label class="fld second">Second activity
        <select data-act="second" data-pc="${i}" ${ro ? "disabled" : ""}>
          ${SECOND_SLOT.map(o => `<option value="${o}" ${(e.second ?? "—") === o ? "selected" : ""}>${o}</option>`).join("")}
        </select>
      </label>`;
    if (!sec) return head;

    const rolledBadge = sec.rolled
      ? `<span class="secres ${sec.applied ? "done" : "rolled"}">${DEGREE_LABEL[sec.rolled]}${sec.applied ? " · banked" : ""}</span>`
      : "";
    const rollBtn = `<button type="button" class="rollbtn" data-act="sec-roll" data-pc="${i}"
        title="Roll this check" ${dis || !t.secCheck(i) ? "disabled" : ""}><i class="fa-solid fa-dice-d20"></i></button>`;

    if (sec.key === "research") {
      const src = RESEARCH[sec.src] ?? RESEARCH.sojin;
      const left = src.max - (t.s.research[sec.src] ?? 0);
      const srcOpts = Object.entries(RESEARCH).map(([k, r]) => {
        const rem = r.max - (t.s.research[k] ?? 0);
        return `<option value="${k}" ${sec.src === k ? "selected" : ""} ${rem <= 0 && sec.src !== k ? "disabled" : ""}>${r.label}${rem <= 0 ? " · exhausted" : ""}</option>`;
      }).join("");
      const skillOpts = src.opts.map(([n, dc]) =>
        `<option value="${n}|${dc}" ${sec.skill === `${n}|${dc}` ? "selected" : ""}>${n} — DC ${dc}</option>`).join("");
      return `${head}
        <div class="secbox research">
          <div class="secrow">
            <select data-act="sec-src" data-pc="${i}" ${dis}>${srcOpts}</select>
            <select data-act="sec-skill" data-pc="${i}" ${dis}>${skillOpts}</select>
            ${rollBtn}${rolledBadge}
          </div>
          <div class="sechint">${left > 0 ? `${left} more insight${left === 1 ? "" : "s"} to be had here.` : "Nothing more to learn from this one."}</div>
          ${!ro && sec.rolled && !sec.applied && t.editable
            ? `<button type="button" class="bank" data-act="sec-bank" data-pc="${i}">Bank ${DEGREE_LABEL[sec.rolled]} into the research total</button>` : ""}
        </div>`;
    }

    if (sec.key === "income") {
      const inc = t.secIncome(i);
      const skills = skillsOf(t.actorOf(i)).filter(s => s.rank >= 1);
      const skillOpts = skills.length
        ? skills.map(s => `<option value="${s.slug}" ${sec.skill === s.slug ? "selected" : ""}>${esc(s.label)} (${RANK_WORD[s.rank] ?? "Trained"})</option>`).join("")
        : `<option value="">No trained skills found</option>`;
      return `${head}
        <div class="secbox income">
          <div class="secrow">
            <select data-act="sec-skill" data-pc="${i}" ${dis}>${skillOpts}</select>
            <label class="mini">Task lv<input type="number" min="0" max="25" value="${sec.task}" data-act="sec-num" data-k="task" data-pc="${i}" ${dis}></label>
            <label class="mini">Days<input type="number" min="0" max="60" value="${sec.days}" data-act="sec-num" data-k="days" data-pc="${i}" ${dis}></label>
            ${rollBtn}${rolledBadge}
          </div>
          <div class="sechint">DC ${levelDC(sec.task)} · ${coin(inc.perDay.s)} a day on a success, ${coin(inc.perDay.cs)} on a critical
            ${inc.total != null ? ` · <b>earned ${coin(inc.total)}</b> over ${sec.days} day${sec.days === 1 ? "" : "s"}` : ""}</div>
        </div>`;
    }

    if (sec.key === "craft") {
      const skills = skillsOf(t.actorOf(i)).filter(s => s.rank >= 1);
      const skillOpts = skills.map(s => `<option value="${s.slug}" ${sec.skill === s.slug ? "selected" : ""}>${esc(s.label)}</option>`).join("");
      const half = Math.round((Number(sec.price) || 0) * 50);
      const setup = sec.formula ? 1 : 2;
      const rare = sec.rarity && sec.rarity !== "common";
      const chip = sec.uuid ? `
        <div class="itemchip ${rare ? "rare" : ""}">
          <button type="button" class="ilink" data-act="opendoc" data-uuid="${esc(sec.uuid)}"
                  title="Open ${esc(sec.item)}"><i class="fa-solid fa-up-right-from-square"></i>${esc(sec.item)}</button>
          <span class="ilvl">Level ${sec.ilvl}</span>
          <div class="inotes">
            ${rare ? `<span class="bad">${cap(sec.rarity)} — you need access before you can Craft one.</span> ` : ""}
            <span class="${sec.formula ? "good" : "bad"}">${sec.formula ? "You have the formula — one day of setup." : "No formula — two days of setup."}</span>
          </div>
        </div>` : "";
      return `${head}
        <div class="secbox craft" ${dis ? "" : `data-drop="${i}"`}>
          ${chip}
          <div class="secrow">
            <input type="text" class="grow" placeholder="Drop an item here, or type its name" value="${esc(sec.item)}" data-act="sec-note" data-k="item" data-pc="${i}" ${dis}>
            <label class="mini">Item lv<input type="number" min="0" max="25" value="${sec.ilvl}" data-act="sec-num" data-k="ilvl" data-pc="${i}" ${dis}></label>
            <label class="mini">Price gp<input type="number" min="0" max="100000" step="0.01" value="${sec.price}" data-act="sec-num" data-k="price" data-pc="${i}" ${dis}></label>
          </div>
          <div class="secrow">
            <select data-act="sec-skill" data-pc="${i}" ${dis}>${skillOpts}</select>
            ${rollBtn}${rolledBadge}
          </div>
          <div class="sechint">DC ${levelDC(sec.ilvl)} · ${setup} day${setup === 1 ? "" : "s"} of setup before the check${half ? `, then ${coin(half)} in materials` : " — drop an item or set the Price to see the materials cost"}</div>
        </div>`;
    }

    return `${head}
      <div class="secbox">
        <div class="secrow">
          <input type="text" class="grow" placeholder="${sec.key === "retrain" ? "Retraining what, into what?" : "What are you doing?"}"
                 value="${esc(sec.note)}" data-act="sec-note" data-k="note" data-pc="${i}" ${dis}>
        </div>
        <div class="sechint">${sec.key === "retrain"
          ? "A week of downtime, and usually a teacher. No check — settle it with the GM."
          : "No check. Tell the GM what you're up to."}</div>
      </div>`;
  }

  /* Resolved on the client that dropped it; only the plain facts read off the
     document are stored and relayed to the GM. */
  async dropItem(event, pcIdx) {
    const t = this.tracker;
    if (!Number.isInteger(pcIdx)) return;
    if (!t.editable && !ownsPC(game.user, t.s, pcIdx)) return;
    const data = readDropData(event);
    if (!data || data.type !== "Item") {
      if (data) ui.notifications.warn("Only items can be dropped here.");
      return;
    }
    let doc = null;
    try { doc = await fromUuid(data.uuid); } catch { /* handled below */ }
    if (!doc) return ui.notifications.warn("That item couldn't be read.");
    if (doc.system?.price === undefined) {
      return ui.notifications.warn(`${doc.name} isn't a physical item, so it has no Price to craft against.`);
    }
    const facts = itemFacts(doc, t.actorOf(pcIdx));
    await t.apply("secItem", { pc: pcIdx, item: facts });
    ui.notifications.info(`${facts.name} — level ${facts.level}, ${facts.price} gp.`);
  }

  /* ------------------------------------------------------------ listeners */
  wire(root) {
    if (!root || root.dataset?.sogWired === "1") return;
    if (root.dataset) root.dataset.sogWired = "1";
    const t = this.tracker;

    /* Drag an item onto a Craft second activity to fill in its level and
       Price. Delegated like everything else here, so it survives a re-render. */
    root.addEventListener("dragover", (ev) => {
      const zone = ev.target.closest("[data-drop]");
      if (!zone) return;
      ev.preventDefault();
      zone.classList.add("dragover");
    });
    root.addEventListener("dragleave", (ev) => {
      ev.target.closest("[data-drop]")?.classList.remove("dragover");
    });
    root.addEventListener("drop", async (ev) => {
      const zone = ev.target.closest("[data-drop]");
      if (!zone) return;
      ev.preventDefault();
      zone.classList.remove("dragover");
      await this.dropItem(ev, Number(zone.dataset.drop));
    });

    root.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act;
      const pc = Number(btn.dataset.pc);
      if (a === "week") t.setWeek(t.s.week + Number(btn.dataset.n));
      else if (a === "journal") openJournal(btn.dataset.r);
      else if (a === "sheet") {
        const actor = game.actors.get(btn.dataset.id);
        if (actor) actor.sheet?.render(true);
        else ui.notifications.warn("That character's actor is no longer in this world.");
      }
      else if (a === "pmy-roll") t.rollCheck(pc);
      else if (a === "sec-roll") t.rollSecond(pc);
      else if (a === "sec-bank") t.bankResearch(pc);
      else if (a === "feast-roll") t.rollFeast(pc, Number(btn.dataset.slot));
      else if (a === "feast-bank") t.bankFeast(pc, Number(btn.dataset.slot));
      else if (a === "ceremony") t.setCeremony(btn.dataset.deg);
      else if (a === "entertain") t.setEntertain(pc, btn.dataset.deg);
      else if (a === "afterfeast") t.toggleAfterFeast(btn.dataset.key);
      else if (a === "feastrep") t.toggleFeastRep(btn.dataset.faction);
      else if (a === "postnight") t.postNightChecks();
      else if (a === "opendoc") {
        const doc = await fromUuid(btn.dataset.uuid).catch(() => null);
        if (doc?.sheet) doc.sheet.render(true);
        else ui.notifications.warn("That item is no longer available in this world.");
      }
      else if (a === "gotoweek") t.setWeek(Number(btn.dataset.n));
      else if (a === "eoutcome") t.toggleEventOutcome(Number(btn.dataset.i));
      else if (a === "randtarget") t.pickRandomTarget();
      else if (a === "postcheck") t.postCheck(pc);
      else if (a === "posteventchecks") t.postEventChecks();
      else if (a === "journal") t.writeJournal();
      else if (a === "syncparty") t.syncParty();
      else if (a === "toggleeventpanel") {
        t.s.ui = t.s.ui ?? {};
        t.s.ui.eventOpen = t.s.ui.eventOpen === false;
        t.render(); t.save();
      }

      else if (a === "bump") t.bump(btn.dataset.pool, Number(btn.dataset.n));
      else if (a === "rep") { t.s.rep[btn.dataset.key] += Number(btn.dataset.n); t.afterChange(); }
      else if (a === "feast") { t.s.feast[btn.dataset.key] = Math.max(0, t.s.feast[btn.dataset.key] + Number(btn.dataset.n)); t.afterChange(); }
      else if (a === "resolve") t.resolve(pc, btn.dataset.deg);
      else if (a === "tchoice") t.townsfolkChoice(pc, btn.dataset.which);
      else if (a === "research") t.addResearch(btn.dataset.src, btn.dataset.deg);
      else if (a === "chat") t.postSummary();
      else if (a === "clear") t.clearWeek();
      else if (a === "reset") {
        const ok = await confirmReset();
        if (!ok) return;
        t.state = blankState(t.s.pcs);
        t.render();
        t.save();
      }
      else if (a === "yamigift") t.rollYamiGift();
      else if (a === "researchdone") t.toggleResearchDone();
    });

    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      const a = el.dataset.act;
      const pc = Number(el.dataset.pc);
      const week = t.w;
      /* The player board's own controls, which route through the relay rather
         than writing the setting directly. */
      if (a === "pmy-pick") return void t.apply("pick", { pc, key: el.value });
      if (a === "pmy-skill") return void t.apply("skill", { pc, value: el.value });
      if (a === "feast-pick") return void t.apply("feastPick", { pc, slot: Number(el.dataset.slot), act: el.value });
      if (a === "feast-skill") return void t.apply("feastSkill", { pc, slot: Number(el.dataset.slot), value: el.value });
      /* The second-activity controls are the same markup on both boards, so
         they route through the relay for everyone. */
      if (a === "second") return void t.apply("second", { pc, value: el.value });
      if (a === "sec-src") return void t.apply("secCfg", { pc, patch: { src: el.value } });
      if (a === "sec-skill") return void t.apply("secCfg", { pc, patch: { skill: el.value } });
      if (a === "sec-num") return void t.apply("secCfg", { pc, patch: { [el.dataset.k]: Number(el.value) } });
      if (a === "sec-note") return void t.apply("secCfg", { pc, patch: { [el.dataset.k]: el.value } });
      if (a === "pick") {
        week.entries[pc] = { activity: el.value || null, skill: "", result: null, delta: null, second: week.entries[pc]?.second ?? "—" };
        const act = ACTIVITIES[el.value];
        if (act) week.entries[pc].skill = `${act.skills[0][0]}|${act.skills[0][1]}`;
        t.render(); t.save();
      } else if (a === "skill") {
        week.entries[pc] = week.entries[pc] ?? {};
        week.entries[pc].skill = el.value;
        t.save();
      } else if (a === "rename") {
        t.s.pcs[pc].name = el.value.trim() || `PC ${pc + 1}`;
        t.save();
      } else if (a === "eventdone") {
        t.toggleEvent();
      } else if (a === "leader") {
        t.s.leader = el.value;
        t.save();
      } else if (a === "opt") {
        t.s.opts[el.dataset.key] = el.checked;
        t.render(); t.save();
      } else if (a === "playervis") {
        t.s.playerVisible = el.checked;
        t.render(); t.save();
      }
    });
  }


  /* ------------------------------------------------------- player board */
  playerMarkup() {
    const t = this.tracker, s = t.s;
    if (!s.playerVisible) {
      return `${this.styles()}
        <div class="sog">
          <div class="closed">
            <h3 style="border:none">The trade office is quiet</h3>
            <p>Willowshore's preparations aren't posted yet. Check back once the elders have work to hand out.</p>
          </div>
        </div>`;
    }

    const pool = (key, label) => `
      <div class="pool ${key}">
        <div class="pool-head"><span>${label}</span></div>
        <div class="pool-val">${s.pools[key]}</div>
      </div>`;

    const mine = myPCIndexes(s);

    const rows = s.pcs.map((pc, i) => {
      const e = t.w.entries[i];
      const act = e?.activity ? ACTIVITIES[e.activity] : null;
      const skill = e?.skill ? e.skill.split("|") : null;
      const shown = e?.result ? DEGREE_LABEL[e.result]
        : e?.rolled ? `${DEGREE_LABEL[e.rolled]} <span class="muted">rolled</span>` : "";
      return `
        <tr class="${mine.includes(i) ? "mine" : ""}">
          <td class="pwho"><img class="avatar sm" src="${pc.img || "icons/svg/mystery-man.svg"}" alt="" onerror="this.src='icons/svg/mystery-man.svg'"><span>${esc(pc.name)}</span></td>
          <td>${act ? act.label : "<span class='muted'>nothing yet</span>"}</td>
          <td class="rt">${skill ? `${skill[0]} DC ${skill[1]}` : ""}</td>
          <td class="rt">${shown}</td>
        </tr>`;
    }).join("");

    return `${this.styles()}
      <div class="sog">
        <header class="topbar">
          <div class="wk"><span class="wk-label">Week</span><span class="wk-num">${s.week}</span><span class="wk-of">of 12</span></div>
          <div class="event"><span class="ev-eyebrow">This week in Willowshore</span><span class="ev-name">${EVENTS[s.week].name}</span></div>
        </header>

        ${t.hopePenalty ? `<div class="alarm">Spirits are low. Every effort this week is harder than it should be.</div>` : ""}

        <section class="pools">
          ${pool("hope", "Hope")}
          ${pool("food", "Food")}
          ${pool("security", "Security")}
          ${pool("restoration", "Teahouse")}
        </section>

        ${mine.length
          ? mine.map(i => this.playerCard(s.pcs[i], i)).join("")
          : `<div class="alarm quiet">You don't have a character in the party list, so this is a read-only view.</div>`}

        <section class="panel">
          <h3>This week's work</h3>
          <table class="ptable">
            <thead><tr><th>Who</th><th>Activity</th><th class="rt">Check</th><th class="rt">Result</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>

        ${s.researchDone ? `
        <section class="panel research done">
          <h3>Next steps — Open the Wall of Ghosts</h3>
          <div class="nextsteps">
            <p>Your research into the nature of the so-called Willowshore Curse has revealed a possible method of opening a doorway through the eerie Wall of Ghosts found west of town.</p>
            <p>By starting with a <b>Consecrate</b> ritual and then applying Sangpotshi theories of the cyclical nature of life and reincarnation, along with insights gleaned from Zoudou's notes, you've created a magical ritual that can quiet the angry spirits that haunt this misty barrier and allow other creatures to pass through into the regions beyond.</p>
            <p>This ritual is unlikely to grant total protection from the ghosts or evil spirits within the wall itself, so once you open the wall, you and your allies might need to face additional dangers within before you can exit the other side.</p>
            <p>In addition, the ritual must be performed during a <b>crescent or new moon</b> (a time that equates to the second half of each month).</p>
          </div>
        </section>` : `
        <section class="panel">
          <h3>Researching the curse</h3>
          <div class="rp-total">
            <div class="rp-num">${t.rpTotal}<span> insights gathered</span></div>
          </div>
          <div class="res-list">
            ${Object.entries(RESEARCH).map(([k, r]) => `
              <div class="res-row ${s.research[k] >= r.max ? "full" : ""}">
                <div class="res-name"><b>${r.label}</b><small>${r.skills}</small></div>
                <div class="res-val">${s.research[k]}</div>
              </div>`).join("")}
          </div>
        </section>`}

        <p class="hint" style="text-align:center">${mine.length
          ? "Your roll is sent to the GM, who records what it does for the town."
          : "Read-only. Ask your GM to record results."}</p>
      </div>`;
  }

  /* A player's own character: choose the week's preparation activity and the
     skill for it, roll, and pick the second activity. Point totals and targets
     stay off this card — the pools above are the only numbers players see. */
  playerCard(pc, i) {
    const t = this.tracker;
    if (t.s.week === 10) return this.playerFeastCard(pc, i);
    const e = t.w.entries[i] ?? {};
    const act = ACTIVITIES[e.activity];
    const locked = !!e.result;

    const opts = Object.entries(ACTIVITIES).map(([k, a]) => {
      const blocked = t.activityAvailable(k, i);
      const sel = e.activity === k ? "selected" : "";
      return `<option value="${k}" ${sel} ${blocked && e.activity !== k ? "disabled" : ""}>${a.label}${a.gives ? ` — ${a.gives}` : ""}${blocked ? ` · ${blocked.toLowerCase()}` : ""}</option>`;
    }).join("");

    const skillOpts = act
      ? act.skills.map(([n, dc]) => `<option value="${n}|${dc}" ${e.skill === `${n}|${dc}` ? "selected" : ""}>${n} — DC ${dc}</option>`).join("")
      : `<option value="">—</option>`;

    const mods = act ? t.checkModifier(e.activity) : [];

    return `
      <section class="panel mycard">
        <div class="my-head">
          <img class="avatar" src="${pc.img || "icons/svg/mystery-man.svg"}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
          <div class="who">
            <span class="pcname">${esc(pc.name)}</span>
            <span class="pcsub">${locked ? "Recorded by the GM" : act ? "Ready to roll" : "Nothing chosen yet"}</span>
          </div>
          ${e.result
            ? `<span class="myres done">${DEGREE_LABEL[e.result]}</span>`
            : e.rolled ? `<span class="myres rolled">${DEGREE_LABEL[e.rolled]} · with the GM</span>` : ""}
        </div>

        <label class="fld">This week's preparation
          <select data-act="pmy-pick" data-pc="${i}" ${locked ? "disabled" : ""}>
            <option value="">— choose —</option>
            ${opts}
          </select>
        </label>

        <label class="fld">Skill
          <div class="skillrow">
            <select data-act="pmy-skill" data-pc="${i}" ${locked || !act ? "disabled" : ""}>${skillOpts}</select>
            <button type="button" class="rollbtn" data-act="pmy-roll" data-pc="${i}"
                    title="Roll this check" ${locked || !act ? "disabled" : ""}><i class="fa-solid fa-dice-d20"></i></button>
          </div>
        </label>

        ${mods.length ? `<div class="mods">${mods.map(([v, why]) => `<span class="mod ${v.startsWith("-") ? "bad" : "good"}">${v} ${why}</span>`).join("")}</div>` : ""}
        ${act?.hint ? `<p class="hint">${act.hint}</p>` : ""}

        ${this.secondBlock(i, false)}
        ${t.yamiBanner(i, false)}
      </section>`;
  }

  /* Week 10 player card: the same three feast checks, minus the GM's bank
     button (the roll is sent to the GM as a proposal). */
  playerFeastCard(pc, i) {
    const t = this.tracker;
    const anyRolled = t.feastSlots(i).some(s => s.rolled);
    return `
      <section class="panel mycard">
        <div class="my-head">
          <img class="avatar" src="${pc.img || "icons/svg/mystery-man.svg"}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
          <div class="who">
            <span class="pcname">${esc(pc.name)}</span>
            <span class="pcsub">${anyRolled ? "Feast rolls sent to the GM" : "Three checks to prepare for the feast"}</span>
          </div>
        </div>
        ${this.feastBlock(i, false)}
        ${t.yamiBanner(i, false)}
      </section>`;
  }

  /* --------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #sog-downtime .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      /* Everything except the board itself. Blanking .sog too left the board
         with no background of its own, so wherever the host theme won the
         .window-content rule the whole thing went dark under the panels. */
      #sog-downtime .window-content > *:not(.sog) { background:transparent; }
      #sog-downtime .sog { background:${p.paper}; color:${p.ink}; }
      .sog { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line};
             --rust:${p.rust}; --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate};
             --plum:${p.plum}; --muted:${p.muted}; --track:${p.track}; --stripe:${p.stripe};
             --hover:${p.hover}; --field:${p.field};
             font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .sog * { box-sizing:border-box; }
      .sog button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
      /* color-scheme drives the native dropdown popup. Without it, a world on
         Foundry's dark theme opens a select over a black list with black text
         — the control looks right and the menu is unreadable. */
      .sog { color-scheme:${THEME === "dark" ? "dark" : "light"}; }
      .sog select, .sog input[type="text"], .sog input[type="number"] {
             background:var(--field); color:var(--ink); color-scheme:${THEME === "dark" ? "dark" : "light"};
             border:1px solid var(--line); border-radius:3px; height:auto; padding:2px 4px; }
      .sog option { background:var(--field); color:var(--ink); }
      .sog option:disabled { color:var(--muted); }
      .sog input[type="checkbox"] { accent-color:var(--ember); }
      /* A panel is titled in large ink over a thick rule in its own tone, so
         it reads ahead of anything nested inside it. */
      .sog h3 { font-size:.95rem; margin:0 0 .55rem; letter-spacing:.04em; text-transform:uppercase;
                display:flex; align-items:center; gap:.5rem; border-bottom:2px solid var(--tone, var(--line));
                padding-bottom:.3rem; color:var(--ink); flex-wrap:wrap; }

      /* A link into the module's journal. */
      .sog .jbtn { font-size:.62rem; padding:1px 5px; border-radius:3px; color:var(--slate);
                   border:1px solid var(--line); background:transparent; flex:none; letter-spacing:.04em;
                   display:inline-flex; align-items:center; gap:.25rem; cursor:pointer;
                   height:auto; min-height:0; font-family:inherit; }
      .sog .jbtn:hover { background:var(--hover); }
      .sog .jbtn i { font-size:.66rem; }
      .sog h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.75rem; }

      .sog .eventpanel h3 { align-items:center; }
      .sog .eventpanel.spooky h3 { border-bottom-color:var(--plum); }
      .sog .eventpanel .lvl { border:1px solid var(--line); border-radius:10px; padding:0 6px; color:var(--muted); }
      .sog .collapse { border:none; background:transparent; font-size:.9rem; padding:0 .3rem 0 0; color:var(--muted); }
      .sog .hook { font-size:.82rem; line-height:1.45; margin:0 0 .45rem; }
      .sog .checks { margin:0 0 .5rem; padding-left:1.1rem; font-size:.78rem; line-height:1.4; color:var(--muted); }
      .sog .checks li { margin-bottom:.2rem; }
      .sog .etarget { display:flex; align-items:center; gap:.5rem; font-size:.8rem; margin-bottom:.45rem; }
      .sog .etarget button { font-size:.72rem; padding:.2rem .5rem; border:1px solid var(--line);
                        background:transparent; border-radius:3px; }
      .sog .etarget .muted { color:var(--muted); }
      .sog .eoutcomes { display:flex; flex-wrap:wrap; gap:.35rem; }
      .sog .eout { display:flex; flex-direction:column; align-items:flex-start; gap:1px; text-align:left;
              font-size:.78rem; padding:.3rem .5rem; border:1px solid var(--line);
              background:transparent; border-radius:3px; line-height:1.2; }
      .sog .eout .ebits { font-size:.68rem; color:var(--muted); }
      .sog .eout.on { background:var(--moss); border-color:var(--moss); color:var(--paper); }
      .sog .eout.on .ebits { color:var(--paper); opacity:.85; }

      .sog .card { border-top:3px solid var(--acc, var(--line)); }
      .sog .avatar { width:34px; height:34px; border-radius:50%; object-fit:cover; flex:none;
                     border:1px solid var(--line); background:var(--stripe); }
      .sog .avatar.sm { width:20px; height:20px; vertical-align:-6px; margin-right:6px; }
      .sog .who { display:flex; flex-direction:column; flex:1; min-width:0; }
      .sog .pcname { font-weight:600; font-size:.95rem; line-height:1.15; white-space:nowrap;
                     overflow:hidden; text-overflow:ellipsis; }
      /* The name is a button when there's an actor behind it. The display:block
         is load-bearing: the base button rule is an inline-flex centred on its
         own axis, which would centre the name over a left-aligned sub-line and
         break the ellipsis. */
      .sog button.pcname { display:block; width:100%; background:transparent; border:0; padding:0;
                           color:var(--ink); font-family:inherit; text-align:left; cursor:pointer; }
      .sog button.pcname:hover { text-decoration:underline; }
      .sog .pcsub { font-size:.66rem; color:var(--muted); white-space:nowrap; overflow:hidden;
                    text-overflow:ellipsis; }
      .sog .status { display:flex; align-items:center; gap:4px; font-size:.6rem; text-transform:uppercase;
                     letter-spacing:.07em; color:var(--muted); white-space:nowrap; }
      .sog .status i { width:6px; height:6px; border-radius:50%; background:var(--line); display:block; }
      .sog .status.set i { background:var(--ember); }
      .sog .status.done i { background:var(--moss); }
      .sog .status.done { color:var(--moss); }
      .sog .trackbar { font-size:.6rem; text-transform:uppercase; letter-spacing:.09em; color:var(--paper);
                       background:var(--line); border-radius:2px; padding:1px 6px; display:inline-block;
                       margin-bottom:.35rem; }
      .sog .trackbar.hope { background:var(--ember); }
      .sog .trackbar.food { background:var(--moss); }
      .sog .trackbar.security { background:var(--slate); }
      .sog .trackbar.teahouse { background:var(--rust); }
      .sog .syncrow { grid-column:1 / -1; display:flex; align-items:center; gap:.5rem; }
      .sog .syncrow button { font-size:.75rem; padding:.25rem .6rem; border:1px solid var(--line);
                             background:transparent; border-radius:3px; white-space:nowrap; }
      .sog .syncrow small { color:var(--muted); font-size:.68rem; }

      .sog .skillrow { display:flex; gap:.25rem; }
      .sog .skillrow select { flex:1; min-width:0; }
      .sog .rollbtn { width:26px; border:1px solid var(--line); background:transparent; border-radius:3px;
                      font-size:.75rem; flex:none; }
      .sog .postchecks { margin-left:auto; font-size:.68rem; padding:.15rem .45rem; border:1px solid var(--line);
                         background:transparent; border-radius:3px; text-transform:none; letter-spacing:0; }

      .sog .weektabs { display:flex; gap:3px; margin:0 0 .6rem; }
      .sog .wtab { flex:1; padding:.25rem 0; font-size:.72rem; border:1px solid var(--line);
              background:transparent; border-radius:3px; line-height:1; }
      .sog .wtab.used { background:var(--stripe); font-weight:600; }
      .sog .wtab.spooky { border-bottom:2px solid var(--plum); }
      .sog .wtab.on { background:var(--ember); border-color:var(--ember); color:var(--paper); font-weight:700; }
      .sog .closed { text-align:center; padding:1.5rem .5rem; color:var(--muted); }
      /* Prefixed with the window id, not just .sog: the PF2e system styles
         tables inside application windows — a tinted thead and its own row
         striping, chosen for a dark theme — and a bare class selector loses to
         it, which is what turned this table into an unreadable dark band. */
      #sog-downtime .ptable { width:100%; border-collapse:collapse; font-size:.82rem;
                   background:transparent; color:var(--ink); border:none; }
      #sog-downtime .ptable thead, #sog-downtime .ptable tbody,
      #sog-downtime .ptable tr { background:transparent; border:none; }
      #sog-downtime .ptable th { text-align:left; font-size:.65rem; text-transform:uppercase;
                   letter-spacing:.07em; color:var(--muted); font-weight:600; background:transparent;
                   border:none; border-bottom:1px solid var(--line); padding:.2rem .4rem .2rem 0; }
      #sog-downtime .ptable td { padding:.3rem .4rem .3rem 0; background:transparent; color:var(--ink);
                   border:none; border-bottom:1px solid var(--line); vertical-align:middle; }
      #sog-downtime .ptable tbody tr:nth-child(odd) td { background:var(--stripe); }
      #sog-downtime .ptable tbody tr:last-child td { border-bottom:none; }
      #sog-downtime .ptable .rt { text-align:right; padding-right:0; }
      #sog-downtime .ptable .muted { color:var(--muted); }
      /* Its own class, not the card header's .who — that one is a column
         flexbox, and sharing it stacked the avatar on top of the name. */
      #sog-downtime .ptable td.pwho { white-space:nowrap; }
      #sog-downtime .ptable td.pwho img { vertical-align:middle; margin-right:.4rem; }
      #sog-downtime .ptable td.pwho span { vertical-align:middle; font-weight:600; }
      /* First cell only — on every cell it draws a rule down each column. */
      #sog-downtime .ptable .mine td:first-child { box-shadow:inset 3px 0 0 -1px var(--ember); }

      .sog .mycard { border-left:3px solid var(--ember); }
      .sog .my-head { display:flex; align-items:center; gap:.5rem; margin-bottom:.45rem; }
      .sog .my-head .avatar { width:34px; height:34px; border-radius:3px; object-fit:cover;
                    border:1px solid var(--line); }
      .sog .my-head .who { display:flex; flex-direction:column; line-height:1.2; }
      .sog .my-head .pcname { font-weight:700; font-size:.95rem; }
      .sog .my-head .pcsub { font-size:.68rem; color:var(--muted); }
      .sog .myres { margin-left:auto; font-size:.72rem; font-weight:600; border-radius:3px;
                    padding:.2rem .45rem; border:1px solid var(--line); }
      .sog .myres.done { color:var(--moss); border-color:var(--moss); }
      .sog .myres.rolled { color:var(--ember); border-color:var(--ember); }
      .sog .proposed { font-size:.74rem; background:var(--stripe); border-left:3px solid var(--ember);
                    border-radius:3px; padding:.3rem .45rem; margin:.35rem 0; }
      .sog .deg.proposed { box-shadow:inset 0 0 0 2px var(--ember); font-weight:700; }

      .sog .secbox { border:1px solid var(--line); border-left:3px solid var(--plum); border-radius:3px;
                     padding:.35rem .45rem; margin:-.15rem 0 .4rem; background:var(--stripe); }
      .sog .secbox.income { border-left-color:var(--ember); }
      .sog .secbox.craft { border-left-color:var(--rust); }
      .sog .secrow { display:flex; align-items:center; gap:.3rem; flex-wrap:wrap; margin-bottom:.25rem; }
      .sog .secrow > select { flex:1 1 7rem; min-width:0; }
      .sog .secrow .grow { flex:1 1 8rem; min-width:0; }
      .sog .secrow .mini { display:flex; align-items:center; gap:.25rem; font-size:.66rem;
                     color:var(--muted); white-space:nowrap; }
      .sog .secrow .mini input { width:3.4rem; }
      .sog .sechint { font-size:.68rem; color:var(--muted); line-height:1.35; }
      .sog .sechint b { color:var(--ink); }
      .sog .secres { font-size:.68rem; font-weight:600; border:1px solid var(--line); border-radius:3px;
                     padding:.12rem .35rem; white-space:nowrap; }
      .sog .secres.rolled { color:var(--ember); border-color:var(--ember); }
      .sog .secres.done { color:var(--moss); border-color:var(--moss); }
      .sog .secbox .bank { width:100%; margin-top:.3rem; font-size:.72rem; padding:.25rem;
                     border:1px solid var(--plum); color:var(--plum); background:transparent;
                     border-radius:3px; height:auto; display:inline-flex; align-items:center;
                     justify-content:center; }
      .sog .secbox .bank:hover { background:var(--hover); }
      .sog [data-drop].dragover { outline:2px dashed var(--rust); outline-offset:-3px; }
      .sog .itemchip { border:1px solid var(--line); border-left:3px solid var(--rust); border-radius:3px;
                       padding:.25rem .35rem; margin-bottom:.3rem; background:var(--card); }
      .sog .itemchip.rare { border-left-color:var(--plum); }
      .sog .itemchip .ilink { padding:0; border:none; background:transparent; font-weight:600;
                       font-size:.8rem; color:var(--ink); height:auto; }
      .sog .itemchip .ilink:hover { background:transparent; text-decoration:underline; }
      .sog .itemchip .ilink i { font-size:.6rem; color:var(--muted); }
      .sog .itemchip .ilvl { font-size:.66rem; color:var(--muted); margin-left:.3rem; }
      .sog .itemchip .inotes { font-size:.66rem; line-height:1.35; margin-top:.1rem; }
      .sog .itemchip .good { color:var(--moss); }
      .sog .itemchip .bad { color:var(--rust); }

      .sog .topbar { display:flex; align-items:center; gap:.75rem; padding:.5rem .25rem .75rem; }
      .sog .weeknav { display:flex; align-items:center; gap:.35rem; }
      .sog .weeknav button { width:26px; height:26px; border:1px solid var(--line); background:transparent; border-radius:3px; line-height:1; }
      .sog .wk { display:flex; align-items:baseline; gap:.3rem; }
      .sog .wk-label, .sog .wk-of { font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .sog .wk-num { font-size:1.6rem; font-weight:700; line-height:1; }
      .sog .event { flex:1; display:flex; flex-direction:column; padding-left:.75rem; border-left:3px solid var(--line); }
      .sog .event.spooky { border-left-color:var(--plum); }
      .sog .event.festival { border-left-color:var(--ember); }
      .sog .ev-eyebrow { font-size:.65rem; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); }
      .sog .event.spooky .ev-eyebrow { color:var(--plum); }
      .sog .ev-name { font-size:1.05rem; font-weight:600; }
      .sog .evdone { display:flex; align-items:center; gap:.3rem; font-size:.8rem; white-space:nowrap; }

      .sog .alarm { background:rgba(168,68,42,.12); border:1px solid var(--rust); color:var(--rust);
               padding:.4rem .6rem; border-radius:3px; font-size:.8rem; margin-bottom:.6rem; }
      .sog .alarm.quiet { background:var(--stripe); border-color:var(--line); color:var(--muted); }

      .sog .pools { display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem; margin-bottom:.75rem; }
      .sog .pool { border:1px solid var(--line); border-radius:4px; padding:.45rem .55rem; background:var(--card); }
      .sog .pool-head { display:flex; justify-content:space-between; font-size:.7rem; text-transform:uppercase;
                   letter-spacing:.08em; color:var(--muted); }
      .sog .pool-val { font-size:1.7rem; font-weight:700; line-height:1.1; }
      .sog .pool.hope .pool-val { color:var(--ember); }
      .sog .pool.food .pool-val { color:var(--moss); }
      .sog .pool.security .pool-val { color:var(--slate); }
      .sog .pool.restoration .pool-val { color:var(--rust); }
      .sog .pool.met { box-shadow:inset 0 0 0 1px var(--moss); }
      .sog .bar { height:4px; background:var(--track); border-radius:2px; overflow:hidden; margin:.25rem 0; }
      .sog .bar i { display:block; height:100%; background:currentColor; }
      .sog .pool.hope .bar i { background:var(--ember); } .sog .pool.food .bar i { background:var(--moss); }
      .sog .pool.security .bar i { background:var(--slate); } .sog .pool.restoration .bar i { background:var(--rust); }
      .sog .bar.ghost { opacity:.35; }
      .sog .pool-btns { display:flex; gap:.25rem; }
      .sog .pool-btns button { flex:1; height:20px; line-height:1; border:1px solid var(--line); background:transparent; border-radius:3px; }

      .sog .grid { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-bottom:.75rem; }
      .sog .card { border:1px solid var(--line); border-radius:4px; padding:.55rem; background:var(--card); }
      .sog .card.done { border-color:var(--moss); }
      .sog .card-head { display:flex; align-items:center; gap:.4rem; margin-bottom:.4rem; }
      .sog .tag { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:2px 6px;
             border-radius:10px; border:1px solid var(--line); color:var(--muted); white-space:nowrap; }
      .sog .tag.hope { border-color:var(--ember); color:var(--ember); }
      .sog .tag.food { border-color:var(--moss); color:var(--moss); }
      .sog .tag.security { border-color:var(--slate); color:var(--slate); }
      .sog .tag.teahouse { border-color:var(--rust); color:var(--rust); }
      .sog .fld { display:block; font-size:.68rem; text-transform:uppercase; letter-spacing:.07em;
             color:var(--muted); margin-bottom:.35rem; }
      .sog .fld select { width:100%; font-size:.82rem; text-transform:none; letter-spacing:0; color:var(--ink); }
      .sog .hint { font-size:.72rem; color:var(--muted); margin:.15rem 0 .35rem; line-height:1.3; }
      .sog .mods { display:flex; flex-wrap:wrap; gap:.25rem; margin-bottom:.3rem; }
      .sog .mod { font-size:.68rem; padding:1px 5px; border-radius:3px; }
      .sog .mod.good { background:rgba(93,107,69,.18); color:var(--moss); }
      .sog .mod.bad { background:rgba(168,68,42,.15); color:var(--rust); }

      .sog .degrees { display:grid; grid-template-columns:repeat(4,1fr); gap:.2rem; }
      .sog .deg { font-size:.65rem; padding:.3rem .1rem; border:1px solid var(--line); background:transparent;
             border-radius:3px; line-height:1.1; }
      .sog .deg.cs:hover, .sog .deg.cs.on { background:var(--moss); color:var(--paper); border-color:var(--moss); }
      .sog .deg.s:hover, .sog .deg.s.on { background:rgba(93,107,69,.35); border-color:var(--moss); }
      .sog .deg.f:hover, .sog .deg.f.on { background:var(--hover); }
      .sog .deg.cf:hover, .sog .deg.cf.on { background:var(--rust); color:var(--paper); border-color:var(--rust); }
      .sog .deg:disabled { opacity:.4; cursor:not-allowed; }

      .sog .pending { margin-top:.35rem; font-size:.72rem; display:flex; align-items:center; gap:.3rem; flex-wrap:wrap; }
      .sog .pending button { font-size:.7rem; padding:.15rem .4rem; border:1px solid var(--ember); background:transparent; border-radius:3px; }
      .sog .outcome { margin-top:.35rem; font-size:.75rem; font-weight:600; color:var(--slate); }
      .sog .second { margin-top:.4rem; }

      .sog h1, .sog h2, .sog h4, .sog legend { color:var(--ink); }
      .sog .panel { border:1px solid var(--line); border-radius:4px; padding:.55rem; margin-bottom:.6rem;
               background:var(--card); }
      .sog .rp-total { display:flex; align-items:center; gap:.6rem; margin-bottom:.4rem; }
      .sog .rp-num { font-size:1.3rem; font-weight:700; }
      .sog .rp-num span { font-size:.7rem; font-weight:400; color:var(--muted); }
      .sog .rp-total .bar { flex:1; height:6px; }
      .sog .rp-total .bar i { background:var(--plum); }
      .sog .res-list { display:grid; gap:.25rem; }
      .sog .res-row { display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:.5rem;
                 padding:.25rem .3rem; border-radius:3px; }
      .sog .res-row:nth-child(odd) { background:var(--stripe); }
      .sog .res-row.full { opacity:.55; }
      .sog .res-name small { display:block; font-size:.68rem; color:var(--muted); }
      .sog .res-val { font-weight:700; }
      .sog .res-val span { font-weight:400; color:var(--muted); font-size:.75rem; }
      .sog .res-btns { display:flex; gap:.15rem; }
      .sog .res-btns .deg { width:30px; }

      .sog .feast-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.5rem; }
      .sog .feast-cell { border:1px solid var(--line); border-radius:4px; padding:.4rem; text-align:center; }
      .sog .feast-cell.ok { border-color:var(--moss); }
      .sog .fc-head { font-size:.7rem; text-transform:uppercase; letter-spacing:.07em; color:var(--muted); }
      .sog .fc-val { font-size:1.5rem; font-weight:700; }
      .sog .fc-note { font-size:.65rem; color:var(--muted); line-height:1.25; margin-bottom:.25rem; }
      .sog .fc-btns { display:flex; gap:.25rem; }
      .sog .fc-btns button { flex:1; border:1px solid var(--line); background:transparent; border-radius:3px; }
      .sog .feast-pc { border-top:1px dashed var(--line); margin-top:.4rem; padding-top:.4rem; }
      .sog .feast-pc-head { font-size:.68rem; text-transform:uppercase; letter-spacing:.06em;
                            color:var(--muted); margin-bottom:.35rem; display:flex; align-items:center;
                            justify-content:space-between; gap:.5rem; }

      /* Night of the Feast / After the Feast — the week-10 resolution. */
      .sog .feast-night, .sog .feast-after { border-top:1px dashed var(--line); margin-top:.5rem; padding-top:.45rem; }
      .sog .feast-night h4, .sog .feast-after h4 { font-size:.72rem; text-transform:uppercase; letter-spacing:.07em;
        color:var(--ember); margin:0 0 .4rem; display:flex; align-items:center; gap:.4rem; border:none; padding:0; }
      .sog .fn-block { border:1px solid var(--line); border-radius:3px; padding:.4rem .5rem; margin-bottom:.4rem; background:var(--stripe); }
      .sog .fn-head { font-size:.72rem; font-weight:700; margin-bottom:.3rem; line-height:1.35; }
      .sog .fn-sub { font-weight:400; color:var(--muted); font-size:.68rem; }
      .sog .fn-line { font-size:.72rem; line-height:1.4; margin:.25rem 0; }
      .sog .fn-result { font-size:.74rem; line-height:1.4; margin-top:.35rem; padding:.3rem .4rem;
        border-left:3px solid var(--moss); background:var(--card); border-radius:3px; }
      .sog .fn-result b { color:var(--moss); }
      .sog .fn-decor { display:flex; flex-wrap:wrap; gap:.35rem; align-items:center; }
      .sog .en-pc { flex:0 0 7.5rem; font-size:.74rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .sog .en-degrees { display:inline-flex; gap:.2rem; }
      .sog .en-degrees .deg { padding:.18rem .32rem; font-size:.62rem; }
      .sog .feast-night .degrees { margin-bottom:.35rem; }
      .sog .feast-night .postchecks { margin:.35rem 0 0; }
      .sog .feast-night .fn-block .eout { margin-top:.25rem; }

      .sog .setup-grid { display:grid; grid-template-columns:1fr 1fr; gap:.4rem .75rem; font-size:.8rem; }
      .sog .setup-grid label { display:block; font-size:.7rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
      .sog .setup-grid label.check { text-transform:none; letter-spacing:0; font-size:.8rem; color:var(--ink); }
      .sog .setup-grid label.check small { display:block; color:var(--muted); font-size:.68rem; }
      .sog .setup-grid select { width:100%; color:var(--ink); }
      .sog .rep { grid-column:1 / -1; display:flex; align-items:center; gap:.75rem; font-size:.75rem;
             border-top:1px solid var(--line); padding-top:.4rem; }
      .sog .rep > span { text-transform:uppercase; letter-spacing:.06em; color:var(--muted); font-size:.7rem; }
      .sog .rep-row { display:flex; align-items:center; gap:.3rem; }
      .sog .rep-row button { width:20px; height:20px; line-height:1; border:1px solid var(--line); background:transparent; border-radius:3px; }
      .sog .yami { font-size:.75rem; color:var(--moss); margin:.4rem 0 0; }
      .sog .yami-banner { margin-top:.45rem; padding:.5rem .6rem; border:1px solid var(--moss);
             border-left:4px solid var(--moss); border-radius:3px; background:rgba(75,90,52,.12); }
      .sog .yami-banner .yb-title { font-size:.8rem; font-weight:700; color:var(--moss); margin-bottom:.15rem; }
      .sog .yami-banner .yb-text { font-size:.72rem; line-height:1.35; margin-bottom:.35rem; }
      .sog .yami-banner .yb-btn { font-size:.75rem; padding:.3rem .5rem; border:1px solid var(--moss);
             color:var(--moss); border-radius:3px; background:transparent; }
      .sog .yami-banner .yb-btn:hover:not(:disabled) { background:var(--moss); color:var(--paper); }
      .sog .yami-banner .yb-btn small { display:block; font-size:.62rem; opacity:.85; }
      .sog .nextsteps p { font-size:.8rem; line-height:1.4; margin:.15rem 0 .4rem; }
      .sog .nextsteps p.read { font-size:.68rem; text-transform:uppercase; letter-spacing:.06em;
             color:var(--muted); margin:.1rem 0 .3rem; }
      .sog .nextsteps p.gmnote { font-size:.78rem; color:var(--moss); margin-top:.5rem;
             padding-top:.4rem; border-top:1px solid var(--line); }
      .sog .panel.research.done { border-color:var(--plum); }
      .sog .markdone { margin-top:.45rem; font-size:.75rem; padding:.3rem .5rem;
             border:1px solid var(--plum); color:var(--plum); border-radius:3px; background:transparent; }
      .sog .markdone:hover:not(:disabled) { background:var(--plum); color:var(--paper); }

      .sog .log { list-style:none; margin:0; padding:0; max-height:150px; overflow-y:auto; font-size:.75rem; }
      .sog .log li { padding:.2rem 0; border-bottom:1px dotted var(--line); line-height:1.35; }
      .sog .log li.muted { color:var(--muted); border:none; }

      .sog .actions { display:flex; gap:.4rem; }
      .sog .actions button { flex:1; padding:.4rem; border:1px solid var(--line); background:transparent;
                        border-radius:3px; font-size:.8rem; }
      .sog .actions button:hover:not(:disabled) { background:var(--hover); }

      @media (max-width:700px) {
        .sog .grid, .sog .pools, .sog .setup-grid, .sog .feast-grid { grid-template-columns:1fr; }
        .sog .topbar { flex-wrap:wrap; }
      }
    </style>`;
  }
}

/* ApplicationV2 and Application both declare _replaceHTML, with different
   signatures. Only install the v2 version when v2 is what we extended. */
if (AppV2) {
  SoGDowntimeApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

async function confirmReset() {
  const D = foundry.applications?.api?.DialogV2;
  if (D) return D.confirm({ window: { title: "Reset the tracker?" }, content: "<p>This wipes all points, weeks, and logs. This cannot be undone.</p>" });
  return Dialog.confirm({ title: "Reset the tracker?", content: "<p>This wipes all points, weeks, and logs. This cannot be undone.</p>" });
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSetting();

  let state = game.settings.get(SETTING_NS, SETTING_KEY);

  // One-time migration from the old journal-flag storage.
  if (!state && game.user.isGM) {
    const old = game.journal.getName(JOURNAL_NAME)?.getFlag(FLAG_SCOPE, FLAG_KEY);
    if (old) {
      state = old;
      await game.settings.set(SETTING_NS, SETTING_KEY, state);
    }
  }

  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(SETTING_NS, SETTING_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }

  const tracker = new Tracker(game.journal.getName(JOURNAL_NAME) ?? null, state);
  const app = new SoGDowntimeApp(tracker);

  /* The GM's client is the only one that can write, so it is the only one that
     listens. Ownership is re-checked here rather than trusted from the sender,
     and the op set is the narrow player one — nothing here moves a pool. */
  if (globalThis.__sogDowntimeReq) Hooks.off("updateUser", globalThis.__sogDowntimeReq);
  globalThis.__sogDowntimeReq = Hooks.on("updateUser", async (user, changes) => {
    if (!game.user.isGM || !isPrimaryGM()) return;
    /* `changes` is a partial diff: on a re-sent op, only the fields that
       actually changed survive, so `op` and `data.pc` can be missing from it.
       Use the diff only to know this update touched our flag, then read the
       full current value straight off the User document. */
    if (!changes?.flags?.[REQ_SCOPE]?.[REQ_KEY]) return;
    const req = user.getFlag(REQ_SCOPE, REQ_KEY);
    if (!req || !PLAYER_OPS[req.op]) return;
    if (!ownsPC(user, tracker.s, req.data?.pc)) return;
    PLAYER_OPS[req.op](tracker, req.data);
    tracker.render();
    await tracker.save();
  });

  /* Re-registered rather than guarded: running the macro again builds a new
     tracker, and a hook still closed over the previous one would keep the
     stale window in sync and leave the live one frozen. */
  {
    if (globalThis.__sogDowntimeHook) Hooks.off("updateSetting", globalThis.__sogDowntimeHook);
    globalThis.__sogDowntimeHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== SETTING_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (!fresh) return;
      tracker.state = fresh;
      tracker.render();
    });
  }

  app.render(true);
})();
