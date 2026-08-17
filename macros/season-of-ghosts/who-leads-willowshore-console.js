/* ============================================================================
   WHO LEADS WILLOWSHORE? — the Champions' Duel
   Season of Ghosts, Act 1 Chapter 3 set-piece · the Level 3 milestone
   Foundry VTT v11 / v12 / v13 / v14  •  built for PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   Old Matsuki publicly challenges Granny Hu for Willowshore's leadership, and
   by old tradition the question is settled by a duel of champions in seven
   days. This console runs the whole event: the champion selection, the
   seven-day lead-up, the five-round Trial of Champions scored on two Favor
   tallies — and, when the table throws the fight, the alternate Suspicion
   track from "The Worked Duel" (Hu has privately conceded; the party stages a
   face-saving, fixed duel and must sell it without getting caught).

   Nothing to install. State lives in a hidden world setting.
   ============================================================================ */

const WLR_NS = "world";
const WLR_KEY = "sogWhoLeads";
const WLR_ID = `${WLR_NS}.${WLR_KEY}`;
const DOWNTIME_ID = "world.sogFallDowntime";   // read/write: Hope pool, Reputation
const MAX_PCS = 4;

const THEME = "parchment";
const PALETTES = {
  parchment: {
    paper: "#efe6d8", card: "#fbf7f0", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
    stripe: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.07)", field: "#fffdf8",
    rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12",
    ice: "#5b7f9e", snow: "#8fa6b5"
  },
  dark: {
    paper: "#1f1d1b", card: "#2a2724", ink: "#ece5da", line: "#544d44", muted: "#a4988a",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(255,255,255,.08)", field: "#171513",
    rust: "#d4664a", ember: "#e0a052", moss: "#96b06a", slate: "#7fa0bb", plum: "#b98ab0", gold: "#d9b74f",
    ice: "#7fa0bb", snow: "#aac0cf"
  }
};

/* --------------------------------------------------- inline check helper */
const SKILL_WORDS = ["Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy",
  "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Religion", "Society",
  "Stealth", "Survival", "Thievery", "Perception", "Fortitude", "Reflex", "Will",
  "Academia Lore", "Library Lore", "Willowshore Lore"];
const SAVES = ["Fortitude", "Reflex", "Will"];
const checkSlug = (s) => s.trim().toLowerCase().replace(/\s+/g, "-");
function checkCode(skill, dc) {
  const basic = SAVES.includes(skill) ? "|basic:true" : "";
  return `@Check[type:${checkSlug(skill)}|dc:${dc}${basic}]`;
}
function linkify(text) {
  const rx = new RegExp(`DC (\\d+) ((?:[A-Z][a-z]+ )?Lore|${SKILL_WORDS.join("|")})`, "g");
  return text.replace(rx, (_m, dc, skill) => checkCode(skill, dc));
}

/* -------------------------------------------------------------------- data
   The cast, the five Trial rounds, and the lead-up levers — authored from the
   "Who Leads Willowshore?" set-piece and its "Worked Duel" staging supplement.
   All DCs, deltas, and names verbatim from those two documents. No stat blocks. */

const ELDERS = {
  north: { name: "Old Matsuki", faction: "Northridge", icon: "fa-shield-halved", tone: "ember" },
  south: { name: "Granny Hu", faction: "Southbank", icon: "fa-hand-holding-heart", tone: "moss" }
};
const STAND_INS = { north: "Capt. Zheng Peng", south: "Yong Wu-Xiu" };

const CAST = [
  { name: "Old Matsuki", role: "Northridge elder", tone: "ember",
    text: "Stern, traditional, imperial-aligned — grim, proud, genuinely afraid for the town. Wins the crowd with strength, discipline, concrete defense & food plans, respect for tradition; loses it with coldness, heavy-handedness, treating folk as subjects. \"Rather feared and ready than loved and caught short.\"" },
  { name: "Granny Hu", role: "Southbank elder", tone: "moss",
    text: "Warm, shrewd, of the common folk; sharp-tongued and kind — a grandmother's grip on every favor owed in town. Wins with compassion, unity, practical mutual aid, humility, knowing folk by name; loses with sentimentality without a plan, looking weak before a hard winter." },
  { name: "Capt. Zheng Peng", role: "Northridge stand-in champion", tone: "ember",
    text: "A disciplined guard — fills the empty Northridge seat when no PC champions Matsuki. Rolls about +9 in his strong field, +5 otherwise." },
  { name: "Yong Wu-Xiu", role: "Southbank stand-in champion", tone: "moss",
    text: "A powerful smith — fills the empty Southbank seat when no PC champions Hu. Rolls about +9 in her strong field, +5 otherwise." },
  { name: "Shinzo", role: "trusted NPC", tone: "muted",
    text: "A natural voice for the day-0 plea: de-escalate, stand with a faction, or run as a third candidate. Watches from the back of the crowd at the duel." },
  { name: "Heh", role: "the previous leader", tone: "muted",
    text: "Whoever wins serves as interim governor only \"until Heh's fate is known.\"" }
];

const READALOUD = {
  opening: "Trapped, frightened, and leaderless, Willowshore's two factions finally crack. One summer evening, Old Matsuki publicly challenges Granny Hu for the town's leadership — and by old tradition, the question will be settled by a duel of champions in seven days. The town dreads a bloodbath.",
  riddle: "The harvest will fall short and no trade is coming. How do we eat till spring?",
  crowd: "Give the crowd a voice — a roar, a gasp, a heckler (\"Songs won't man the walls!\"), a held breath before the bout — and visibly shift bodies toward whichever side is winning Favor. NPCs the party has helped should be in the crowd cheering. Let it breathe: this is a relationship and worldbuilding episode as much as a contest."
};

const LEADUP = [
  { key: "courted", label: "Courted your elder to the Influence midpoint", effect: "+1 Favor to your side" },
  { key: "conceded", label: "7 Influence with the rival elder", effect: "they concede & step aside — end it without a duel" },
  { key: "rallied", label: "Rallied a named bloc (guards / smiths / dock / farmers)", effect: "+1 Favor each, max +2" },
  { key: "rehearsed", label: "Rehearsed / schemed (venue, anthem, a rival's embarrassment)", effect: "+2 circumstance to one chosen round" },
  { key: "defused", label: "Defused the dread (championed the non-lethal Trial)", effect: "goodwill with both factions, win or lose" }
];

const KNOWS_OPTIONS = [
  { key: "in", label: "In on it", note: "Cleanest, lowest risk — no acting required; the con is airtight." },
  { key: "won", label: "Thinks they genuinely won", note: "Authentic triumph — but the highest long-term risk if it ever comes out." },
  { key: "concession", label: "Knows {LE} conceded, not that it's thrown", note: "No acting required of them; the fix stays the party's secret." }
];

const ROUNDS = [
  {
    key: "r1", num: "I", name: "The Address", sub: "the crowd's ear", tone: "gold", icon: "fa-bullhorn",
    skills: "Diplomacy, Performance, or Deception",
    dcText: "No fixed DC — the higher degree (then higher total) takes the round; a Society angle (a real, concrete policy) grants +2.",
    text: "Each champion makes the case for their elder before the whole town. Higher degree of success, then higher total, takes the round.",
    crowd: "Faction banners roar; waverers lean toward the better speaker.",
    thrown: "{T} argues {LE}'s case half-heartedly and loses with grace — the first sell. Deception or Performance (DC 18) to make the concession read as a close, principled loss.",
    checks: []
  },
  {
    key: "r2", num: "II", name: "The Trial of Arms", sub: "the bout", tone: "rust", icon: "fa-hand-fist",
    skills: "Athletics or Attack (non-lethal) — Acrobatics to evade",
    dcText: "Best-of-3 opposed exchanges (attack roll or Athletics); first to two wins. To first yield or disarm.",
    text: "A formal champion's bout to first yield or disarm — non-lethal by the Trial. (Or swap in a formal blood-duel, GM Core pp. 202–203.)",
    crowd: "The loudest round. First blood, if any, flips waverers against the one who drew it.",
    thrown: "{T} must fight hard and lose. Deception/Performance DC 18 to sell a valiant near-miss; a clumsy dive reads off. If {T} starts genuinely winning, they have to lose even harder to get back on script.",
    checks: []
  },
  {
    key: "r3", num: "III", name: "The Trial of Wisdom", sub: "lead us through winter", tone: "slate", icon: "fa-brain",
    skills: "Society or a fitting Lore (or judge the actual idea)",
    dcText: "DC 20 Society, or a fitting Lore — or the GM judges the plan the player actually gives.",
    text: "The town's real problem is posed: \"The harvest will fall short and no trade is coming. How do we eat till spring?\" The best plan wins.",
    crowd: "Merchants and farmers swayed; the practical-minded lean to the better plan.",
    thrown: "{T} offers a solid-but-plain plan and lets {W}'s \"vision\" outshine it — sell the shrug, not the failure.",
    checks: ["DC 20 Society"]
  },
  {
    key: "r4", num: "IV", name: "The Trial of the People", sub: "the heart · double favor", tone: "moss", icon: "fa-hand-holding-heart",
    skills: "Diplomacy, Medicine, or Society",
    dcText: "DC 18 — but judge sincerity over the die.",
    text: "A planted moment of need steps from the crowd — a sick child, a feud between neighbors, a grieving widow. The champion must help, not perform. WORTH DOUBLE FAVOR.",
    crowd: "A cold or cynical handling can lose a champion the whole town, even from ahead.",
    thrown: "The easiest round to sell — {T} helps warmly, then defers the credit. But overdoing humility reads as defeatism (+Suspicion).",
    checks: ["DC 18 Society", "DC 18 Medicine"],
    double: true
  },
  {
    key: "r5", num: "V", name: "The People's Verdict", sub: "the finale", tone: "plum", icon: "fa-scale-balanced",
    skills: "A closing word, then the tally",
    dcText: "Most Favor after Round V wins. A tie is broken by a final opposed Diplomacy before the crowd.",
    text: "Each champion gets one last appeal; then tally all Favor — most Favor acclaims that elder interim governor. The grace note: a unifying gesture (victor honoring loser, loser pledging support) can heal the rift.",
    crowd: "The whole square holds its breath for the tally.",
    thrown: "THE MONEY SHOT. {W} lands the \"deciding\" blow; {T} sells the dramatic, valiant fall — one last Deception/Performance, bonus if Suspicion is low, penalty if high. {LE} steps forward, clasps {WE}'s hand, and concedes to cheers.",
    checks: []
  }
];

const WINNERS = [
  { key: "north", label: "Old Matsuki", sub: "wins — interim governor; winter leans to order, walls, rationing", tone: "ember" },
  { key: "south", label: "Granny Hu", sub: "wins — winter leans to mutual aid, open stores", tone: "moss" },
  { key: "third", label: "A PC (third candidate)", sub: "takes the seat — a real say in winter, and a yoke around their neck", tone: "gold" },
  { key: "gm", label: "GM decides (party stayed out)", sub: "pick the elder the party favors less, so inaction has teeth", tone: "slate" }
];

const BEATS = [
  { key: "rift", label: "Healed the rift (grace note)", tone: "moss",
    note: "The best ending: the loser concedes graciously, the town unites going into winter. +1 Hope, +1 Reputation with BOTH factions." },
  { key: "backed", label: "The party backed the winner", tone: "gold",
    note: "+1 Reputation with the winner's faction (requires a Northridge or Southbank winner)." },
  { key: "blood", label: "Fought to the death (a bloodbath)", tone: "rust",
    note: "The winner's faction becomes feared; −1 Reputation with the loser's faction. Exactly the bloodbath the town dreaded." }
];

/* ------------------------------------------------------------------- state */
function blankState(pcs) {
  return {
    v: 1, tab: "setup", pcs,
    mode: "trial",                       // "trial" | "thrown"
    north: { kind: "npc", actorId: "", name: STAND_INS.north },
    south: { kind: "npc", actorId: "", name: STAND_INS.south },
    third: { on: false, kind: "pc", actorId: "", name: "" },
    thrownWinner: "north",               // thrown mode: which elder the fix delivers to
    knows: "in",                         // thrown mode: does that winner know it's thrown
    favorStart: { north: 0, south: 0 },  // starting Favor set from the lead-up
    leadup: { courted: false, conceded: false, rallied: false, rehearsed: false, defused: false },
    rounds: { r1: null, r2: null, r3: null, r4: null, r5: null },
    winner: "",                          // "" | "north" | "south" | "third" | "gm"
    beats: { rift: false, backed: false, blood: false },
    leveled: false,
    log: []
  };
}

function pickArt(a) {
  const t = a.prototypeToken?.texture?.src ?? "";
  return (t && !/\.(webm|mp4|m4v)$/i.test(t) && !t.includes("*")) ? t : (a.img || "icons/svg/mystery-man.svg");
}
function detectPCs() {
  const seen = new Map();
  const add = (a) => { if (a?.id && !seen.has(a.id)) seen.set(a.id, { name: a.name, actorId: a.id, img: pickArt(a) }); };
  const party = game.actors.party ?? game.actors.find(a => a.type === "party");
  for (const m of party?.members ?? []) add(m);
  if (seen.size < MAX_PCS) for (const u of game.users) { if (!u.isGM) add(u.character); }
  if (seen.size < MAX_PCS) for (const a of game.actors) {
    if (seen.size >= MAX_PCS) break;
    if (a.hasPlayerOwner && (a.type === "character" || a.type === "PC")) add(a);
  }
  const list = [...seen.values()].slice(0, MAX_PCS);
  while (list.length < MAX_PCS) list.push({ name: `PC ${list.length + 1}`, actorId: "", img: "icons/svg/mystery-man.svg" });
  return list;
}
function refreshPCs(pcs) {
  const detected = detectPCs();
  return (pcs ?? []).map((pc, i) => {
    const a = pc.actorId ? game.actors.get(pc.actorId) : null;
    if (a) return { name: a.name, actorId: a.id, img: pickArt(a) };
    return detected[i]?.actorId ? detected[i] : { name: pc.name ?? `PC ${i + 1}`, actorId: "", img: pc.img || "icons/svg/mystery-man.svg" };
  });
}
function registerSettings() {
  if (!game.settings.settings.has(WLR_ID)) {
    game.settings.register(WLR_NS, WLR_KEY, { scope: "world", config: false, type: Object, default: null });
  }
  /* Registered so the resolution can write Hope / Reputation to the Fall
     Downtime Tracker whether or not that macro has run yet in this world. */
  if (!game.settings.settings.has(DOWNTIME_ID)) {
    game.settings.register("world", "sogFallDowntime", { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ----------------------------------------------------------------- engine */
class WhoLeads {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 60); }
  async save() { if (this.editable) await game.settings.set(WLR_NS, WLR_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  downtime() { return game.settings.get("world", "sogFallDowntime"); }
  get hasDowntime() { return !!this.downtime()?.pools; }
  standIn(side) { return STAND_INS[side]; }

  /* ----- setup ----- */
  setMode(m) {
    this.s.mode = m;
    this.log(`Mode: ${m === "trial" ? "Trial of Champions" : "Thrown duel"}.`);
    this.touch();
  }
  setChamp(side, value) {
    if (value === "npc") this.s[side] = { kind: "npc", actorId: "", name: STAND_INS[side] };
    else if (value.startsWith("pc:")) {
      const id = value.slice(3);
      const pc = this.s.pcs.find(p => p.actorId === id);
      this.s[side] = { kind: "pc", actorId: id, name: pc?.name ?? "PC" };
    }
    this.log(`${ELDERS[side].name}'s champion: ${this.s[side].name}.`);
    this.touch();
  }
  setThird(value) {
    if (value === "off") this.s.third = { on: false, kind: "pc", actorId: "", name: "" };
    else if (value === "party") this.s.third = { on: true, kind: "party", actorId: "", name: "the party" };
    else if (value.startsWith("pc:")) {
      const id = value.slice(3);
      const pc = this.s.pcs.find(p => p.actorId === id);
      this.s.third = { on: true, kind: "pc", actorId: id, name: pc?.name ?? "PC" };
    }
    this.log(this.s.third.on ? `Third candidate: ${this.s.third.name}.` : "Third candidate cleared.");
    this.touch();
  }
  setKnows(k) {
    this.s.knows = k;
    const opt = KNOWS_OPTIONS.find(x => x.key === k);
    this.log(`Does ${ELDERS[this.thrownWinnerSide].name} know? — ${this.fillThrown(opt?.label ?? k)}.`);
    this.touch();
  }

  /* ----- the thrown fix ----- */
  get thrownWinnerSide() { return this.s.thrownWinner === "south" ? "south" : "north"; }
  get throwerSide() { return this.thrownWinnerSide === "north" ? "south" : "north"; }
  get outcomeSide() { return this.s.mode === "thrown" ? this.thrownWinnerSide : this.s.winner; }
  setThrownWinner(w) {
    this.s.thrownWinner = w;
    if (this.s.mode === "thrown") this.s.winner = w;   // keep the verdict in sync
    this.log(`The fix delivers to ${ELDERS[w].name} — ${ELDERS[this.throwerSide].name}'s champion throws.`);
    this.touch();
  }
  thrownTokens() {
    const w = this.thrownWinnerSide, t = this.throwerSide;
    return {
      "{W}": this.s[w].name, "{T}": this.s[t].name,
      "{WE}": ELDERS[w].name, "{LE}": ELDERS[t].name
    };
  }
  fillThrown(text) {
    return Object.entries(this.thrownTokens()).reduce((acc, [k, v]) => acc.split(k).join(v), text);
  }

  /* ----- lead-up ----- */
  setFavorStart(side, d) {
    this.s.favorStart[side] = Math.max(0, (this.s.favorStart[side] ?? 0) + d);
    this.log(`Starting ${ELDERS[side].faction} Favor: ${this.s.favorStart[side]}.`);
    this.touch();
  }
  toggleLeadup(k) {
    this.s.leadup[k] = !this.s.leadup[k];
    this.log(`Lead-up — ${k}: ${this.s.leadup[k] ? "done" : "undone"}.`);
    this.touch();
  }

  /* ----- rounds ----- */
  trialDelta(code) {
    switch (code) {
      case "n": return { north: 2, south: 0 };
      case "N": return { north: 3, south: 0 };
      case "s": return { north: 0, south: 2 };
      case "S": return { north: 0, south: 3 };
      case "t": return { north: 1, south: 1 };
      default: return { north: 0, south: 0 };
    }
  }
  thrownDelta(code) {
    switch (code) {
      case "g": return -1;
      case "c": return 0;
      case "k": return 1;
      case "b": return 2;
      case "w": return 1;
      default: return 0;
    }
  }
  get favor() {
    let n = this.s.favorStart.north ?? 0, s2 = this.s.favorStart.south ?? 0;
    for (const r of ROUNDS) {
      const d = this.trialDelta(this.s.rounds[r.key]);
      const mult = r.double ? 2 : 1;
      n += d.north * mult; s2 += d.south * mult;
    }
    return { north: n, south: s2 };
  }
  get suspicion() {
    return ROUNDS.reduce((acc, r) => acc + this.thrownDelta(this.s.rounds[r.key]), 0);
  }
  get band() {
    const s = this.suspicion;
    if (s <= 3) return { label: "Flawless", tone: "moss" };
    if (s <= 6) return { label: "Whispers", tone: "gold" };
    return { label: "Exposed", tone: "rust" };
  }
  setRound(key, code) {
    const cur = this.s.rounds[key];
    this.s.rounds[key] = (cur === code) ? null : code;
    const r = ROUNDS.find(x => x.key === key);
    this.log(`${r.num}. ${r.name}: ${this.s.rounds[key] ? code : "cleared"}.`);
    this.touch();
  }

  /* ----- resolution ----- */
  setWinner(w) {
    this.s.winner = (this.s.winner === w) ? "" : w;
    this.log(`Winner: ${w}.`);
    this.touch();
  }
  async toggleBeat(key) {
    const on = !this.s.beats[key];
    this.s.beats[key] = on;
    const d = on ? 1 : -1;
    const dt = this.downtime();
    const rep = () => { dt.rep = dt.rep ?? { southbank: 0, northridge: 0 }; return dt.rep; };
    if (dt?.pools) {
      if (key === "rift") {
        dt.pools.hope = (dt.pools.hope ?? 0) + d;
        rep().southbank = (rep().southbank ?? 0) + d;
        rep().northridge = (rep().northridge ?? 0) + d;
      } else if (key === "backed") {
        if (this.outcomeSide === "north") rep().northridge = (rep().northridge ?? 0) + d;
        else if (this.outcomeSide === "south") rep().southbank = (rep().southbank ?? 0) + d;
        else ui.notifications.warn("Backing the winner needs a Northridge or Southbank winner selected.");
      } else if (key === "blood") {
        if (this.outcomeSide === "north") rep().southbank = (rep().southbank ?? 0) - d;
        else if (this.outcomeSide === "south") rep().northridge = (rep().northridge ?? 0) - d;
      }
      await game.settings.set("world", "sogFallDowntime", dt);
    }
    this.log(`Resolution — ${key}: ${on ? "applied" : "reversed"}.`);
    this.touch();
  }
  toggleLeveled() {
    this.s.leveled = !this.s.leveled;
    this.log(this.s.leveled ? "Level the party to 3." : "Level 3 milestone cleared.");
    this.touch();
  }

  /* ----- chat ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "gold") {
    const C = { rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12", ice: "#5b7f9e", muted: "#6d6052" };
    await ChatMessage.create({
      content: `<div style="background:#efe6d8;color:#241c18;border:1px solid #b9a687;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.gold};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "Who Leads Willowshore?" }
    });
  }
  async postOpening() {
    return this.postCard("The Challenge", "Seven days hence",
      `<p style="margin:0">${READALOUD.opening}</p>`, "gold");
  }
  async postRound(key) {
    const r = ROUNDS.find(x => x.key === key);
    const checks = (r.checks ?? []).map(c => linkify(c)).join(" · ");
    const body = `<p style="margin:0 0 4px"><b>${r.num}. ${r.name}</b> — ${r.skills}</p>` +
      (checks ? `<p style="margin:0 0 4px">${checks}</p>` : "") +
      (r.dcText ? `<p style="margin:0"><i>${r.dcText}</i></p>` : "");
    return this.postCard("Trial of Champions", `${r.num}. ${r.name}`, body, r.tone);
  }
  async postStatus() {
    const s = this.s, f = this.favor;
    // The Suspicion track is GM-only — a thrown duel has no public standing to
    // post, so in thrown mode only the champions are shared.
    const modeLine = s.mode === "trial"
      ? `<p style="margin:0 0 4px"><b>Favor</b> Northridge ${f.north} · Southbank ${f.south}</p>`
      : "";
    return this.postCard("Who Leads Willowshore?", "The standing",
      `<p style="margin:0 0 4px"><b>Champions</b> ${esc(s.north.name)} (Northridge) · ${esc(s.south.name)} (Southbank)</p>${modeLine}`, "gold");
  }
  async postVerdict() {
    const s = this.s;
    const pro = {
      north: "Old Matsuki is acclaimed interim governor of Willowshore. Granny Hu steps forward and clasps his hand as the Northridge banners dip.",
      south: "Granny Hu is acclaimed interim governor of Willowshore. Old Matsuki bows stiffly as the Southbank erupts in cheers.",
      third: `${esc(s.third.name || "A champion")} steps forward to take the town's reins as its new leader.`,
      gm: "The elders step aside, and Willowshore names a new leader to carry it through the coming season."
    }[this.outcomeSide] || "Willowshore names its new leader.";
    return this.postCard("The People's Verdict", "A new leader for Willowshore",
      `<p style="margin:0">${pro}</p>`, "gold");
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Who Leads Willowshore? reset.");
    this.touch();
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;
const TONES = ["rust", "ember", "moss", "slate", "plum", "gold", "ice", "muted"];

class WLRApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "wlw-console", tag: "div", classes: ["wlw-console"],
    position: { width: 880, height: "auto" },
    window: { title: "Who Leads Willowshore?", icon: "fa-solid fa-crown", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "wlw-console", classes: ["wlw-console"], title: "Who Leads Willowshore?",
      width: 880, height: "auto", resizable: true
    });
  }
  get title() { return "Who Leads Willowshore?"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="wlw-root">${this.markup()}</div>`);
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
    const t = this.t, s = t.s, ro = !t.editable;
    return `${this.styles()}
      <div class="wlw">
        ${this.header(ro)}
        <nav class="tabs">
          ${[["setup", "The Challenge", "champions & lead-up", "gold", "fa-crown"],
             ["trial", "The Trial", "the five rounds", "ember", "fa-scale-balanced"],
             ["verdict", "The Verdict", "who leads", "plum", "fa-flag"]].map(([k, label, sub, tone, icon]) =>
            `<button type="button" class="tab ${s.tab === k ? "on" : ""}" style="--tt:var(--${tone})" data-act="tab" data-k="${k}">
              <b><i class="fa-solid ${icon}"></i> ${label}</b><small>${sub}</small></button>`).join("")}
        </nav>
        ${s.tab === "setup" ? this.setupTab(ro) : ""}
        ${s.tab === "trial" ? this.trialTab(ro) : ""}
        ${s.tab === "verdict" ? this.verdictTab(ro) : ""}
      </div>`;
  }

  /* --------------------------------------------- non-spoiler player view
     The board players open on their own clients. It shows only what the crowd
     sees — the champions, the five public rounds, the Trial's Favor tallies,
     and the announced verdict. Every GM-only thread (the thrown fix, the
     Suspicion track, who-knows-what, the cast's secrets, beats, level) stays
     out. Auto-syncs via the updateSetting hook: every GM save re-renders. */
  playerMarkup() {
    const t = this.t, s = t.s, f = t.favor;
    const isTrial = s.mode === "trial";
    const decided = ROUNDS.filter(r => s.rounds[r.key] != null);
    const next = ROUNDS.find(r => s.rounds[r.key] == null);
    const finished = ROUNDS.every(r => s.rounds[r.key] != null);
    const before = decided.length === 0;
    // The verdict is only public once the five rounds are done — in thrown mode
    // `winner` is set at setup time (it mirrors the fix), so gating on
    // `finished` keeps that premature outcome off the player board.
    const showVerdict = !!s.winner && (finished || s.winner === "gm");

    const status = showVerdict ? "The people have spoken"
      : before ? "Seven days hence"
      : next ? `Round ${next.num} of V — ${next.name}`
      : "The trial is underway";

    const winnerName = s.winner === "north" ? ELDERS.north.name
      : s.winner === "south" ? ELDERS.south.name
      : s.winner === "third" ? (s.third.name || "A champion") : "";

    const roundMark = (r) => {
      const code = s.rounds[r.key];
      const done = code != null;
      const isNext = !showVerdict && !done && next?.key === r.key;
      const win = done && isTrial
        ? (code === "t" ? "Tie" : code[0].toLowerCase() === "n" ? "Northridge" : "Southbank")
        : "";
      return `
        <div class="step ${done ? "done" : ""} ${isNext ? "next" : ""}" style="--st:var(--${TONES.includes(r.tone) ? r.tone : "muted"})">
          <span class="snum">${r.num}</span>
          <span class="sname">${esc(r.name)}</span>
          <span class="swin">${done ? (isTrial ? esc(win) : "done") : (isNext ? "up next" : "")}</span>
        </div>`;
    };

    const total = Math.max(1, f.north + f.south);
    const pct = (n) => Math.round(n / total * 100);

    const verdict = showVerdict ? `
      <section class="panel verdict" style="--tone:var(--plum)">
        <h3>The People's Verdict</h3>
        <p class="vline">${s.winner === "gm"
          ? "The elders step aside, and Willowshore names a new leader to carry it through the coming season."
          : s.winner === "third"
            ? `${esc(s.third.name || "A champion")} steps forward to take up Willowshore's leadership.`
            : `${esc(winnerName)} is acclaimed Willowshore's new leader.`}</p>
      </section>` : "";

    return `${this.styles()}
      <div class="wlw player">
        <header class="ptop">
          <div class="ptitle"><i class="fa-solid fa-crown"></i> The Champions' Duel</div>
          <div class="pstatus">${status}</div>
        </header>

        <section class="panel" style="--tone:var(--gold)">
          <h3>The Champions</h3>
          <div class="champs ${s.third.on ? "three" : ""}">
            ${this.champBadge("north")}${this.champBadge("south")}
            ${s.third.on ? `<div class="champ third"><i class="fa-solid fa-user"></i><span class="cname">${esc(s.third.name || "A third candidate")}</span><small>third candidate</small></div>` : ""}
          </div>
        </section>

        <section class="panel" style="--tone:var(--ember)">
          <h3>The Trial <small>five rounds</small></h3>
          <div class="stepper">${ROUNDS.map(r => roundMark(r)).join("")}</div>
          ${isTrial ? `
            <div class="tally">
              <div class="tbar"><div class="tf n" style="width:${pct(f.north)}%"></div><div class="tf s" style="width:${pct(f.south)}%"></div></div>
              <div class="tlabels"><span class="n"><b>${f.north}</b> Northridge</span><span class="s"><b>${f.south}</b> Southbank</span></div>
            </div>` : ""}
        </section>

        ${verdict}

        ${before ? `
        <section class="panel" style="--tone:var(--moss)">
          <h3>The Challenge</h3>
          <p class="boxed">${READALOUD.opening}</p>
        </section>` : ""}

        <p class="hint" style="text-align:center">The duel updates as your GM records it.</p>
      </div>`;
  }

  header(ro) {
    const t = this.t, s = t.s, f = t.favor, sus = t.suspicion, b = t.band;
    return `
      <header class="topbar">
        <span class="flag on">${s.mode === "trial" ? "Trial of Champions" : "Thrown duel"}</span>
        ${s.mode === "trial"
          ? `<span class="flag">North <b>${f.north}</b></span><span class="flag">South <b>${f.south}</b></span>`
          : `<span class="flag ${sus > 6 ? "warn" : ""}">Suspicion <b>${sus}</b> · ${b.label}</span>`}
        <span class="flag ${s.leveled ? "on" : ""}">${s.leveled ? "Level 3" : "Pre-level 3"}</span>
        <button type="button" class="say" data-act="poststatus" title="Post the standing"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  /* ---------------- setup tab ---------------- */
  champOptions(side) {
    const cur = this.t.s[side];
    const sel = cur.kind === "pc" ? `pc:${cur.actorId}` : "npc";
    const pcOpts = this.t.s.pcs.filter(p => p.actorId).map(p =>
      `<option value="pc:${p.actorId}" ${sel === `pc:${p.actorId}` ? "selected" : ""}>${esc(p.name)} (PC)</option>`).join("");
    return `<option value="npc" ${sel === "npc" ? "selected" : ""}>${esc(this.t.standIn(side))} (stand-in)</option>${pcOpts}`;
  }
  thirdOptions() {
    const t3 = this.t.s.third;
    const sel = !t3.on ? "off" : (t3.kind === "party" ? "party" : `pc:${t3.actorId}`);
    const pcOpts = this.t.s.pcs.filter(p => p.actorId).map(p =>
      `<option value="pc:${p.actorId}" ${sel === `pc:${p.actorId}` ? "selected" : ""}>${esc(p.name)} (PC)</option>`).join("");
    return `<option value="off" ${sel === "off" ? "selected" : ""}>No third candidate</option>` +
      `<option value="party" ${sel === "party" ? "selected" : ""}>The whole party</option>${pcOpts}`;
  }

  setupTab(ro) {
    const t = this.t, s = t.s;
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>The Challenge <small>evening 0 · seven days to the duel</small>
          <button type="button" class="say" data-act="postopening" title="Read to the table"><i class="fa-solid fa-comment"></i></button></h3>
        <p class="boxed">${READALOUD.opening}</p>
        <p class="text">An NPC the party trusts — Shinzo, a saved villager, a worried friend — begs them to de-escalate, stand with a faction, or run as a third candidate. Run the week as scenes, not a checklist: everything done in those seven days sets the duel's starting Favor and earns round bonuses.</p>
      </section>

      <section class="panel" style="--tone:var(--ember)">
        <h3>Champions <small>two seats to fill</small></h3>
        <div class="moderow">
          <button type="button" class="chip ${s.mode === "trial" ? "on" : ""}" data-act="mode" data-m="trial" ${ro ? "disabled" : ""}>Trial of Champions</button>
          <button type="button" class="chip ${s.mode === "thrown" ? "on" : ""}" data-act="mode" data-m="thrown" ${ro ? "disabled" : ""}>Thrown duel</button>
        </div>
        ${s.mode === "thrown" ? `
        <div class="fixrow">
          ${["north", "south"].map(w => `<button type="button" class="chip ${t.thrownWinnerSide === w ? "on" : ""}" data-act="fixwinner" data-w="${w}" ${ro ? "disabled" : ""}>
            ${esc(ELDERS[w].name)}<small>— ${esc(ELDERS[w === "north" ? "south" : "north"].name)}'s champion throws</small></button>`).join("")}
        </div>` : ""}
        <div class="champgrid">
          <label class="champsel"><span class="side n">Northridge <i>${esc(ELDERS.north.name)}</i></span>
            <select data-act="champ" data-side="north" ${ro ? "disabled" : ""}>${this.champOptions("north")}</select></label>
          <label class="champsel"><span class="side s">Southbank <i>${esc(ELDERS.south.name)}</i></span>
            <select data-act="champ" data-side="south" ${ro ? "disabled" : ""}>${this.champOptions("south")}</select></label>
        </div>
        <label class="champsel third"><span class="side">Third candidate <i>a PC takes the town's seat</i></span>
          <select data-act="third" ${ro ? "disabled" : ""}>${this.thirdOptions()}</select></label>
        <p class="hint">PC vs PC is the ideal. One side, or both, can fall to a stand-in — Zheng Peng for Northridge, Yong Wu-Xiu for Southbank. With no PC champion at all it is the two stand-ins.</p>
        ${s.mode === "thrown" ? `
        <div class="knows">
          <div class="subhead"><i class="fa-solid fa-masks-theater"></i> Does ${esc(ELDERS[t.thrownWinnerSide].name)} know? <span>pick one</span></div>
          <select data-act="knows" ${ro ? "disabled" : ""}>
            ${KNOWS_OPTIONS.map(k => `<option value="${k.key}" ${s.knows === k.key ? "selected" : ""}>${esc(t.fillThrown(k.label))}</option>`).join("")}
          </select>
          <p class="note">${esc(t.fillThrown(KNOWS_OPTIONS.find(k => k.key === s.knows)?.note ?? ""))}</p>
        </div>` : ""}
      </section>

      <section class="panel" style="--tone:var(--moss)">
        <h3>The Lead-Up <small>what the week earned — sets the starting Favor</small></h3>
        <div class="favorrow">
          <span class="flabel">Starting Favor</span>
          <span class="fslot n"><b>${t.favor.north}</b> Northridge</span>
          <button type="button" class="qbtn" data-act="fav" data-side="north" data-d="-1" ${ro ? "disabled" : ""}>−</button>
          <button type="button" class="qbtn" data-act="fav" data-side="north" data-d="1" ${ro ? "disabled" : ""}>+</button>
          <span class="fslot s"><b>${t.favor.south}</b> Southbank</span>
          <button type="button" class="qbtn" data-act="fav" data-side="south" data-d="-1" ${ro ? "disabled" : ""}>−</button>
          <button type="button" class="qbtn" data-act="fav" data-side="south" data-d="1" ${ro ? "disabled" : ""}>+</button>
        </div>
        <p class="hint">Set the two tallies from what the week earned (reputation edge, a courted elder, rallied blocs). The checklist below tracks what happened but does not add by itself.</p>
        <div class="leads">
          ${LEADUP.map(l => `
            <label class="check"><input type="checkbox" data-act="leadup" data-k="${l.key}" ${s.leadup[l.key] ? "checked" : ""} ${ro ? "disabled" : ""}>
              ${l.label} <span class="tag">${esc(l.effect)}</span></label>`).join("")}
        </div>
      </section>

      <section class="panel" style="--tone:var(--slate)">
        <h3>The Cast <small>who is watching</small></h3>
        <div class="cast">
          ${CAST.map(c => `<div class="castrow" style="--ct:var(--${TONES.includes(c.tone) ? c.tone : "muted"})">
            <span class="cname">${esc(c.name)}</span><span class="crole">${esc(c.role)}</span>
            <p class="ctext">${esc(c.text)}</p></div>`).join("")}
        </div>
      </section>`;
  }

  /* ---------------- trial tab ---------------- */
  champBadge(side) {
    const c = this.t.s[side];
    const img = c.kind === "pc" ? this.t.s.pcs.find(p => p.actorId === c.actorId)?.img : null;
    return `<div class="champ ${side}">
      ${img ? `<img src="${esc(img)}" alt="">` : `<i class="fa-solid ${ELDERS[side].icon}"></i>`}
      <span class="cname">${esc(c.name)}</span><small>for ${esc(ELDERS[side].name)}</small>
    </div>`;
  }

  trialTab(ro) {
    const t = this.t, s = t.s, f = t.favor, sus = t.suspicion, b = t.band;
    const total = Math.max(1, f.north + f.south);
    const pct = (n) => Math.round(n / total * 100);
    const tally = `
      <section class="panel" style="--tone:var(--gold)">
        <h3>${s.mode === "trial" ? "Crowd Favor" : "Suspicion"} <small>${s.mode === "trial" ? "most Favor after Round V is acclaimed" : "0–3 Flawless · 4–6 Whispers · 7+ Exposed"}</small></h3>
        <div class="champs">${this.champBadge("north")}${this.champBadge("south")}</div>
        ${s.mode === "trial"
          ? `<div class="tally">
              <div class="tbar"><div class="tf n" style="width:${pct(f.north)}%"></div><div class="tf s" style="width:${pct(f.south)}%"></div></div>
              <div class="tlabels"><span class="n"><b>${f.north}</b> Northridge</span><span class="s"><b>${f.south}</b> Southbank</span></div>
            </div>`
          : `<div class="tally susp">
              <div class="snum"><b>${sus}</b><span>${b.label}</span></div>
              <div class="tbar"><div class="tf s" style="width:${Math.min(100, sus / 10 * 100)}%"></div></div>
              <p class="note">${sus <= 3 ? "A convincing, hard-fought contest — nobody smells the fix." : sus <= 6 ? "A rumor of a fix starts to circulate." : "Exposed: worse than an honest concession. Hu looks a caught schemer, Matsuki's win is tainted, and the party is implicated."}</p>
            </div>`}
        <p class="hint">${s.mode === "trial" ? "Round IV (the People) is worth double Favor. Near-ties give +1 to each side." : "Hu's champion sells each round with Deception/Performance (DC 18). A round sold clean is +0; shaky +1; botched +2; a gorgeous near-loss −1; Matsuki looking too good is a +1 blowout."}</p>
      </section>`;

    return tally + ROUNDS.map(r => this.roundPanel(r, ro)).join("");
  }

  roundPanel(r, ro) {
    const t = this.t, s = t.s;
    const cur = s.rounds[r.key];
    const body = s.mode === "thrown" && r.thrown ? t.fillThrown(r.thrown) : r.text;
    const vals = s.mode === "trial"
      ? [["n", `North ${r.double ? "+4" : "+2"}`], ["N", `North ${r.double ? "+6" : "+3"} crit`],
         ["s", `South ${r.double ? "+4" : "+2"}`], ["S", `South ${r.double ? "+6" : "+3"} crit`],
         ["t", `Tie ${r.double ? "+2" : "+1"} each`]]
      : [["g", "−1 Gorgeous"], ["c", "+0 Clean"], ["k", "+1 Shaky"], ["b", "+2 Botched"], ["w", "+1 Blowout"]];
    return `
      <section class="panel round" style="--tone:var(--${TONES.includes(r.tone) ? r.tone : "muted"})">
        <h3><span class="eid">${r.num}</span> ${r.name} ${r.double ? `<span class="tag warn">double</span>` : ""}
          <small>${r.sub}</small>
          <button type="button" class="say" data-act="postround" data-k="${r.key}" title="Post this round's checks"><i class="fa-solid fa-dice-d20"></i></button></h3>
        <p class="text">${body}</p>
        <p class="req"><b>${r.skills}</b></p>
        <p class="note">${r.dcText}</p>
        <p class="crowd">Crowd: ${r.crowd}</p>
        <div class="rbtnrow">
          ${vals.map(([code, label]) => `<button type="button" class="rbtn ${cur === code ? "on" : ""}" data-act="round" data-k="${r.key}" data-code="${code}" ${ro ? "disabled" : ""}>${label}</button>`).join("")}
        </div>
      </section>`;
  }

  /* ---------------- verdict tab ---------------- */
  verdictTab(ro) {
    const t = this.t, s = t.s, f = t.favor;
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3>Who Leads <small>interim governor, until Heh's fate is known</small>
          <button type="button" class="say" data-act="postverdict" title="Post the verdict"><i class="fa-solid fa-comment"></i></button></h3>
        ${s.mode === "trial"
          ? `<div class="winrow">
              ${WINNERS.map(w => `<button type="button" class="wbtn ${s.winner === w.key ? "on" : ""}" style="--tt:var(--${TONES.includes(w.tone) ? w.tone : "muted"})" data-act="winner" data-w="${w.key}" ${ro ? "disabled" : ""}>
                <b>${w.label}</b><small>${w.sub}</small></button>`).join("")}
            </div>`
          : `<p class="text">The fix delivers to <b>${esc(ELDERS[t.thrownWinnerSide].name)}</b> — set on the Challenge tab. ${esc(ELDERS[t.throwerSide].name)}'s champion throws the fight.</p>`}
      </section>

      <section class="panel" style="--tone:var(--moss)">
        <h3>What Follows <small>reversible — writes through to the Fall Downtime Tracker</small></h3>
        ${s.mode === "trial" ? `<p class="text">Final Favor — Northridge ${f.north} · Southbank ${f.south}. ${f.north === f.south ? "A tie — settle it with a final opposed Diplomacy." : f.north > f.south ? "Northridge carries the town." : "Southbank carries the town."}</p>`
          : `<p class="text">Final Suspicion ${t.suspicion} — ${t.band.label}.</p>`}
        ${BEATS.map(b => `
          <label class="check big"><input type="checkbox" data-act="beat" data-k="${b.key}" ${s.beats[b.key] ? "checked" : ""} ${ro ? "disabled" : ""}>
            ${b.label}</label>
          <p class="beatnote">${b.note}</p>`).join("")}
        ${!t.hasDowntime ? `<p class="hint">Run the Fall Downtime Tracker once and these toggles write Hope / Reputation through to its pools.</p>` : ""}
        <label class="check big level"><input type="checkbox" data-act="leveled" ${s.leveled ? "checked" : ""} ${ro ? "disabled" : ""}>
          Name the new leader — level the party to 3</label>
      </section>

      ${s.log.length ? `<section class="panel" style="--tone:var(--muted)">
        <h3>Log</h3>
        <ul class="log">${s.log.slice(0, 20).map(m => `<li>${esc(m)}</li>`).join("")}</ul>
      </section>` : ""}`;
  }

  /* ---------------------------------------------------------- listeners */
  wire(root) {
    if (!root || root.dataset?.wlwWired === "1") return;
    if (root.dataset) root.dataset.wlwWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act;
      if (a === "tab") { t.s.tab = btn.dataset.k; t.touch(); }
      else if (a === "mode") t.setMode(btn.dataset.m);
      else if (a === "fixwinner") t.setThrownWinner(btn.dataset.w);
      else if (a === "fav") t.setFavorStart(btn.dataset.side, Number(btn.dataset.d));
      else if (a === "round") t.setRound(btn.dataset.k, btn.dataset.code);
      else if (a === "winner") t.setWinner(btn.dataset.w);
      else if (a === "postopening") t.postOpening();
      else if (a === "postround") t.postRound(btn.dataset.k);
      else if (a === "poststatus") t.postStatus();
      else if (a === "postverdict") t.postVerdict();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      const a = el.dataset.act;
      if (a === "champ") t.setChamp(el.dataset.side, el.value);
      else if (a === "third") t.setThird(el.value);
      else if (a === "knows") t.setKnows(el.value);
      else if (a === "leadup") t.toggleLeadup(el.dataset.k);
      else if (a === "beat") t.toggleBeat(el.dataset.k);
      else if (a === "leveled") t.toggleLeveled();
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #wlw-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #wlw-console .window-content > * { background:transparent; }
      .wlw { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --ice:${p.ice}; --snow:${p.snow}; --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .wlw * { box-sizing:border-box; }
      .wlw button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
      .wlw button:hover:not(:disabled) { background:var(--hover); }
      .wlw button:disabled { opacity:.45; cursor:not-allowed; }
      .wlw input[type="checkbox"] { accent-color:var(--gold); }
      .wlw select { font-family:inherit; font-size:.8rem; color:var(--ink); background:var(--field);
                    border:1px solid var(--line); border-radius:3px; padding:.2rem .3rem; max-width:100%; }
      .wlw h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.04em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:2px solid var(--tone, var(--line));
               padding-bottom:.3rem; flex-wrap:wrap; }
      .wlw h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .wlw .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .wlw .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .wlw .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .wlw .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 5px; letter-spacing:.06em; }
      .wlw .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .wlw .say + .say { margin-left:.25rem; }
      .wlw .boxed { font-size:.82rem; line-height:1.5; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; white-space:pre-line; }
      .wlw .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; white-space:pre-line; }
      .wlw .req { font-size:.8rem; margin:.1rem 0 .35rem; }
      .wlw .req b { color:var(--tone, var(--ink)); }
      .wlw .note { font-size:.78rem; line-height:1.45; color:var(--muted); font-style:italic; margin:.2rem 0 .4rem; white-space:pre-line; }
      .wlw .crowd { font-size:.76rem; line-height:1.4; color:var(--muted); margin:.1rem 0 .45rem;
                    padding-left:.5rem; border-left:1px solid var(--line); }
      .wlw .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .wlw .tag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--moss); color:var(--moss); margin-left:.25rem; font-style:normal; }
      .wlw .tag.warn { border-color:var(--rust); color:var(--rust); }
      .wlw .beatnote { font-size:.75rem; line-height:1.45; color:var(--muted); margin:.1rem 0 .4rem 1.35rem;
                      padding-left:.5rem; border-left:1px solid var(--line); }

      .wlw .topbar { display:flex; align-items:center; gap:.6rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .wlw .flag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:2px 7px;
                  border-radius:10px; border:1px solid var(--line); color:var(--muted); }
      .wlw .flag.on { border-color:var(--moss); color:var(--moss); font-weight:700; }
      .wlw .flag.warn { border-color:var(--rust); color:var(--rust); font-weight:700; }

      .wlw .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .wlw .tab { flex:1; padding:.3rem .2rem; font-size:.76rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .wlw .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .wlw .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .wlw .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .wlw .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .wlw .tab.on b i, .wlw .tab.on small { color:var(--paper); opacity:.85; }

      .wlw .moderow { display:flex; gap:.4rem; margin-bottom:.5rem; }
      .wlw .chip { padding:.3rem .8rem; font-size:.8rem; font-weight:600; }
      .wlw .chip.on { background:var(--ember); border-color:var(--ember); color:var(--paper); }
      .wlw .fixrow { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:.5rem; }
      .wlw .fixrow .chip { flex-direction:column; align-items:flex-start; padding:.3rem .6rem; text-align:left; white-space:normal; }
      .wlw .fixrow .chip small { font-size:.64rem; font-weight:400; color:var(--muted); }
      .wlw .fixrow .chip.on small { color:var(--paper); opacity:.85; }
      .wlw .champgrid { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-bottom:.4rem; }
      .wlw .champsel { display:flex; flex-direction:column; gap:.25rem; font-size:.72rem; }
      .wlw .champsel .side { text-transform:uppercase; letter-spacing:.07em; color:var(--muted); }
      .wlw .champsel .side i { font-style:normal; text-transform:none; letter-spacing:0; color:var(--ink); }
      .wlw .champsel .side.n i { color:var(--ember); }
      .wlw .champsel .side.s i { color:var(--moss); }
      .wlw .champsel.third { margin-top:.4rem; }
      .wlw .knows { border:1px solid var(--line); border-radius:4px; padding:.4rem .5rem; margin-top:.5rem; background:var(--stripe); }
      .wlw .knows .subhead { display:flex; align-items:center; gap:.4rem; font-size:.7rem; text-transform:uppercase;
                            letter-spacing:.08em; font-weight:700; color:var(--plum); margin-bottom:.4rem; }
      .wlw .knows .subhead span { margin-left:auto; font-weight:600; color:var(--muted); }

      .wlw .favorrow { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; margin:.3rem 0 .5rem; }
      .wlw .flabel { font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .wlw .fslot { font-size:.78rem; padding:2px 8px; border-radius:10px; border:1px solid var(--line); }
      .wlw .fslot b { font-size:1rem; }
      .wlw .fslot.n b { color:var(--ember); }
      .wlw .fslot.s b { color:var(--moss); }
      .wlw .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }
      .wlw .leads { margin:.3rem 0; }
      .wlw .check { display:block; font-size:.8rem; margin-bottom:.25rem; line-height:1.4; }
      .wlw .check.big { font-size:.86rem; margin:.45rem 0 .2rem; }
      .wlw .check.level { font-weight:700; color:var(--gold); margin-top:.6rem; }

      .wlw .cast { display:flex; flex-direction:column; gap:.4rem; }
      .wlw .castrow { border-left:3px solid var(--ct, var(--line)); padding-left:.5rem; }
      .wlw .cname { font-weight:700; font-size:.82rem; }
      .wlw .crole { font-size:.68rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-left:.4rem; }
      .wlw .ctext { font-size:.78rem; line-height:1.45; color:var(--muted); margin:.1rem 0 0; }

      .wlw .champs { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-bottom:.5rem; }
      .wlw .champ { display:flex; align-items:center; gap:.5rem; border:1px solid var(--line); border-radius:4px; padding:.4rem .5rem; }
      .wlw .champ img { width:32px; height:32px; border-radius:3px; object-fit:cover; }
      .wlw .champ i { font-size:1.1rem; width:32px; height:32px; display:flex; align-items:center; justify-content:center;
                     border-radius:3px; background:var(--stripe); }
      .wlw .champ.north i { color:var(--ember); }
      .wlw .champ.south i { color:var(--moss); }
      .wlw .champ .cname { font-weight:700; font-size:.84rem; }
      .wlw .champ small { display:block; font-size:.68rem; color:var(--muted); }

      .wlw .tally { margin:.3rem 0; }
      .wlw .tbar { display:flex; height:14px; border-radius:7px; overflow:hidden; border:1px solid var(--line); background:var(--stripe); }
      .wlw .tf.n { background:var(--ember); }
      .wlw .tf.s { background:var(--moss); }
      .wlw .tlabels { display:flex; justify-content:space-between; margin-top:.25rem; font-size:.76rem; }
      .wlw .tlabels .n b { color:var(--ember); }
      .wlw .tlabels .s b { color:var(--moss); }
      .wlw .tally.susp .snum { display:flex; align-items:baseline; gap:.5rem; margin-bottom:.3rem; }
      .wlw .tally.susp .snum b { font-size:1.6rem; line-height:1; color:var(--rust); }
      .wlw .tally.susp .snum span { font-size:.78rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }

      .wlw .round .eid { background:var(--tone, var(--muted)); }
      .wlw .rbtnrow { display:flex; gap:.3rem; flex-wrap:wrap; margin-top:.3rem; }
      .wlw .rbtn { padding:.28rem .6rem; font-size:.76rem; }
      .wlw .rbtn.on { background:var(--tone, var(--ice)); border-color:var(--tone, var(--ice)); color:var(--paper); font-weight:600; }

      .wlw .winrow { display:grid; grid-template-columns:1fr 1fr; gap:.4rem; }
      .wlw .wbtn { flex-direction:column; align-items:flex-start; gap:.15rem; padding:.4rem .55rem; font-size:.8rem;
                  border-top:3px solid var(--tt, var(--line)); border-radius:3px; text-align:left; white-space:normal; }
      .wlw .wbtn small { font-size:.68rem; color:var(--muted); font-weight:400; }
      .wlw .wbtn.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .wlw .wbtn.on small { color:var(--paper); opacity:.85; }

      .wlw .log { margin:.2rem 0 0; padding-left:1.1rem; font-size:.76rem; line-height:1.5; color:var(--muted); }
      .wlw .log li { margin-bottom:.15rem; }

      /* player view */
      .wlw .ptop { display:flex; flex-direction:column; gap:.15rem; border:1px solid var(--line);
                   border-radius:4px; background:var(--card); padding:.5rem .6rem; margin-bottom:.5rem; }
      .wlw .ptitle { font-size:1.05rem; font-weight:700; display:flex; align-items:center; gap:.5rem; }
      .wlw .ptitle i { color:var(--gold); }
      .wlw .pstatus { font-size:.78rem; color:var(--muted); }
      .wlw .champs.three { grid-template-columns:repeat(3,1fr); }
      .wlw .champ.third i { color:var(--gold); }
      .wlw .stepper { display:flex; gap:.3rem; margin:.3rem 0 .5rem; }
      .wlw .step { flex:1; display:flex; flex-direction:column; align-items:center; gap:.15rem;
                   border:1px solid var(--line); border-radius:4px; padding:.35rem .1rem;
                   background:var(--stripe); text-align:center; }
      .wlw .step .snum { font-size:.7rem; color:var(--paper); background:var(--muted);
                         border-radius:3px; padding:0 5px; letter-spacing:.06em; }
      .wlw .step .sname { font-size:.66rem; line-height:1.15; font-weight:600; }
      .wlw .step .swin { font-size:.6rem; color:var(--muted); min-height:.75rem; }
      .wlw .step.done { border-color:var(--st, var(--moss)); background:var(--card); }
      .wlw .step.done .snum { background:var(--st, var(--moss)); }
      .wlw .step.done .swin { color:var(--st, var(--moss)); font-weight:700; }
      .wlw .step.next { border-color:var(--gold); border-top:3px solid var(--gold); background:var(--card); }
      .wlw .step.next .swin { color:var(--gold); font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
      .wlw .verdict { border-left:3px solid var(--plum); }
      .wlw .vline { font-size:.9rem; line-height:1.5; margin:.2rem 0 .4rem; }

      @media (max-width:800px) {
        .wlw .champgrid, .wlw .champs, .wlw .champs.three, .wlw .winrow { grid-template-columns:1fr; }
        .wlw .tabs { flex-wrap:wrap; }
      }
    </style>`;
  }
}

if (AppV2) {
  WLRApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSettings();
  let state = game.settings.get(WLR_NS, WLR_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(WLR_NS, WLR_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const whoLeads = new WhoLeads(state);
  const app = new WLRApp(whoLeads);

  if (!globalThis.__wlwHook) {
    globalThis.__wlwHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if ((setting.key !== WLR_ID && setting.key !== DOWNTIME_ID) || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { whoLeads.state = fresh; whoLeads.render(); }
    });
  }
  app.render(true);
})();
