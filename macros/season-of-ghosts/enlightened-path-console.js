/* ============================================================================
   THE ENLIGHTENED PATH — Chapter 6 Console
   Season of Ghosts, Act 2 Chapter 2 · party level 5
   Foundry VTT v11 / v12 / v13  •  built for PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.
   Tracks the ritual, the vision inside the Wall, and the four-day pilgrimage,
   including which enlightenments the party banked before the monastery.
   ============================================================================ */

const EP_NS = "world";
const EP_KEY = "sogEnlightenedPath";
const EP_ID = `${EP_NS}.${EP_KEY}`;
const MAX_PCS = 4;

const THEME = "parchment";
const PALETTES = {
  parchment: {
    paper: "#efe6d8", card: "#fbf7f0", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
    stripe: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.07)", field: "#fffdf8",
    rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12"
  },
  dark: {
    paper: "#1f1d1b", card: "#2a2724", ink: "#ece5da", line: "#544d44", muted: "#a4988a",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(255,255,255,.08)", field: "#171513",
    rust: "#d4664a", ember: "#e0a052", moss: "#96b06a", slate: "#7fa0bb", plum: "#b98ab0", gold: "#d9b74f"
  }
};

/* --------------------------------------------------- inline check helper */
const SKILL_WORDS = ["Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy",
  "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Religion", "Society",
  "Stealth", "Survival", "Thievery", "Perception", "Fortitude", "Reflex", "Will"];
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

/* ------------------------------------------------------------- the stages */
const STAGES = [
  { key: "wall", label: "The Wall", sub: "ritual and vision" },
  { key: "d1", label: "First day", sub: "Bridge Shrine" },
  { key: "d2", label: "Second day", sub: "Garden Shrine" },
  { key: "d3", label: "Third day", sub: "Mountain Shrine" },
  { key: "d4", label: "Final day", sub: "the monastery" }
];

/* -------------------------------------------------- part 1: the ritual */
const RITUAL = {
  name: "Open the Wall of Ghosts",
  cost: "Rice grains and incense worth 60 gp. If the party is admired by at least one Willowshore faction, the town supplies them; otherwise they buy their own.",
  rules: [
    "Cast within 40 feet of the Wall, anywhere along its length. Casting takes a day, and the party won't be interrupted — though there's no need to tell the players that.",
    "On a success the ripple pushes the ghosts deeper into the mist and kills the wall's sound-dampening. Any caster who later comes within 40 feet opens a 10-foot tunnel onto the Path.",
    "A critical failure means a fight with two ghosts. Award that fight's XP as normal unless the party is already 5th level."
  ],
  xp: 80
};

const VISION = {
  intro: "The fog seals behind them. The terrain is wrong — a forested valley rather than forested hills. This is a second mindscape, spun from the dead Kugaptee's dreams, showing the monastery's site before the sealing tree ever grew.",
  rules: [
    "DC 20 Willowshore Lore, DC 22 Religion, or DC 22 Society places the terrain as the monastery site. A critical success dates the forest at nearly a thousand years younger, before the monastery was built.",
    "It is always late afternoon. Creatures seen through more than 60 feet of fog are concealed. Walking into the thick outer fog turns you around and spits you back out. Off-path forest is difficult terrain."
  ],
  beats: [
    { id: "A1", name: "Entrance", level: "", tone: "muted",
      text: "A gateway that stays put while the vision is unresolved. Stepping back through it returns the party toward Willowshore.",
      checks: [] },
    { id: "A2", name: "Tan Sui-Jing's Grave", level: "", tone: "plum",
      text: "A corpse with its heart torn out by a clawed hand, one arm pointing northeast. \"Kugaptee\" is carved nearby, and a whisper says: find the seed.",
      checks: ["DC 18 Survival to follow the trail northeast", "DC 21 Survival if the trail has gone cold"] },
    { id: "A3", name: "The Soulthief's Nest", level: "Low 5", tone: "rust",
      text: "A ravenous, intelligent vulture hunkers in its nest chewing at Sui-Jing's heart. It demands the party leave, then attacks — and three clots of blood rip free of the heart as cacodaemons wearing distorted copies of the corpse's face, yellow-eyed and full of teeth.",
      checks: ["DC 15 Nature or DC 18 Perception to spot the nest's trophies"],
      loot: "Two gemini trophy feathers in the nest." },
    { id: "A4", name: "Planting the Soul Seed", level: "Low 5", tone: "moss",
      text: "Taking the heart turns the mindscape to night, and Kugaptee's Anger wakes as a hazard across the whole forest. Returning the heart to the body is a single Interact action: the anger howls and flees into the distance, the body sinks into stone, and a hundred-foot sugi tree erupts, driving the fog away. Reality fades and the party stands on the real Pilgrim's Path.",
      checks: [],
      xp: 60, note: "The tunnel through the Wall is now permanently passable." }
  ]
};

/* ------------------------------------------------------------- the days */
const DAYS = {
  d1: {
    title: "The First Day", shrine: "Bridge Shrine",
    weather: "Crisp and cloudy",
    travel: "About five miles, walked slowly so the traveller reaches the shrine at sunset. Dense forest through the morning, then the shore of Mirror Lake. The road looks as it did half a century ago rather than the overgrown ruin it should be.",
    encounters: [
      { id: "B1", name: "Tormented Kappa", level: "Low 5", tone: "ember",
        text: "Enko the kappa trudges down the path at a snail's pace. The storm hag Iogaka tricked him into spilling his head-bowl by making him beg on hands and knees, then carried him off and dropped him far from any water. Carry him or the day's distance won't close.",
        checks: ["DC 15 Perception to hear Iogaka's wind-voice taunting him"],
        note: "Escorted and refilled, he turns helpful — and warns that Iogaka hates burning incense." },
      { id: "B2", name: "Serpent Ambush", level: "Low 5", tone: "rust",
        text: "Two amphisbaenas strike from either side of the path — one hidden in forest detritus, one in the shallow water at the lake's edge. They fight to the death.",
        checks: [],
        loot: "If Enko was escorted to the lake and survives, he dives and returns with a +1 striking silver shortsword and a wand of environmental endurance carried on a minor sturdy shield.",
        xp: 40, xpNote: "for escorting Enko to the water" }
    ],
    shrineEnc: {
      id: "B3", name: "Bridge Shrine", level: "Moderate 5", tone: "slate",
      text: "A twenty-foot rope bridge over the North Sugi River, with a hexagonal pagoda at its centre and a viewing portal onto the water below. Two brood leech swarms surge up as the Arms of the Drowned haunt erupts — hundreds of ghostly arms grabbing at the planks, through the central hole, over the railings. The leeches spell out \"Kugaptee\" as they seethe across the floor.",
      checks: ["DC 18 Religion for the shrine's purpose (automatic for Religion experts and followers of Sangpotshi)",
               "DC 15 Willowshore Lore — the shrine washed away in a flood a decade ago, yet here it stands",
               "DC 15 Athletics to swim the ten-foot-deep river"],
      conditions: [
        { key: "cleared", label: "Haunt and leech swarms defeated" },
        { key: "slept", label: "Spent the night in the shrine" }
      ],
      reward: "The six dippers fill themselves overnight. Filling the six clay vials turns each into a moderate ghost charge.",
      save: "Reflex", xp: 40
    }
  },
  d2: {
    title: "The Second Day", shrine: "Garden Shrine",
    weather: "Rain by noon, downpour by evening",
    travel: "Mirror Lake's shore, then the northern bank of the West Sugi River, climbing but not yet mountainous. Rain douses small flames and imposes −1 to Perception; the evening downpour raises that to −2. Approaching the shrine, each PC attempts a DC 18 Fortitude save or becomes fatigued — automatic success for anyone with Environmental Endurance or winter clothing.",
    encounters: [
      { id: "C1", name: "Hungry Foliage", level: "Low 5", tone: "moss",
        text: "Two twisted burls of wood on the forest side of the path unfold into mandragoras, feverishly whispering \"Kugaptee\" — an echo of the shrine in the lumber camp. They fight to the death.",
        checks: [],
        loot: "Each slain mandragora splits to reveal a clot of crystallised blood — a fear gem talisman." },
      { id: "C2", name: "The Girl in the Tree", level: "Low 5", tone: "plum",
        text: "A young woman sobs in a hollow at the base of a dead tree, crying for her big sister. She is Yeri, dead ten years and risen as the penanggalan that killed her. She turns at nightfall or when confronted.",
        checks: ["DC 22 Perception to spot the scar around her neck", "DC 20 Willowshore Lore or DC 25 Society to recall her disappearance"],
        loot: "Yeri's Bracelet — a charm of resistance granting resistance 5 to mental damage.",
        note: "Her ghost asks the party to find her sister Yuni and save her too. Yuni is waiting in the monastery." }
    ],
    shrineEnc: {
      id: "C3", name: "Garden Shrine", level: "Moderate 5", tone: "moss",
      text: "The only shrine that had keepers. Four caretakers stayed on as hermits after the monastery emptied, tried to turn the woodcutters away, and were burned alive when those woodcutters came back that evening as undead. They rise from the ashes crying out as their bodies burn.",
      checks: ["DC 15 Nature or DC 15 Religion — lavender incense stimulates the appetite",
               "DC 20 Perception while Searching to find the silver and oak incense burner"],
      conditions: [
        { key: "incense", label: "Incense lit in all six lanterns" },
        { key: "slept", label: "Spent the night here" }
      ],
      reward: "Green grass through the ashes and six blue orchids among the burned oak's roots. Plucked, each becomes a dose of lesser healing vapor.",
      note: "Lighting the six lanterns before the fight leaves the caretakers slowed 1. Incense is worth 25 gp a cone, the burner 50 gp.",
      save: "Will", xp: 40
    }
  },
  d3: {
    title: "The Third Day", shrine: "Mountain Shrine",
    weather: "Fog, then wind, then thunderstorm",
    travel: "Switchbacks and steep slopes, cliffs crowding the path. Fog lifts past noon; the wind then snuffs handheld flames and imposes −1 to physical ranged attacks. Once the fog clears, the view east shows Willowshore under what looks like a bowl of dark cloud.",
    encounters: [
      { id: "D1", name: "A Voice in the Fog", level: "Low 5", tone: "ember",
        text: "The highest Perception roll glimpses a dim lantern that immediately goes out. A will-o'-wisp has Gone Dark below a thirty-foot cliff. It screams in a frightened woman's voice, then lights up below and calls that she has fallen and broken her leg — roll Deception to lie. Born of Kugaptee's dreams, it appears not as a skull but as a mass of glowing blood-red butterflies.",
        checks: ["DC 20 Athletics to climb down the cliffside"],
        note: "If the party takes the bait it attacks as they approach, rolling Deception for initiative. If not, it Goes Dark and attacks on the ledge, rolling Stealth." },
      { id: "D2", name: "A Whisper in the Woods", level: "Low 5", tone: "rust",
        text: "Dozens of human heads hang by their hair from the branches, whispering that you will join us soon, we welcome you to our family, join our voices and become one with Great Kugaptee. One is a bare skull hanging in the middle of the path — a taunting monk's skull that orders the party back, Demoralizes them, and attacks anyone who comes within ten feet or tries to pass. It spits unholy ectoplasm and fights until destroyed.",
        checks: [] }
    ],
    shrineEnc: {
      id: "D3", name: "Mountain Shrine", level: "Moderate 5", tone: "plum",
      text: "A fifty-foot waterfall into the lake below, a rickety bridge, and steps winding up into the escarpments. The storm hag Iogaka — the same one who tormented Enko, and the source of the whole journey's weather — claims the shrine as her domain and takes the intrusion personally. Two spark moths attack from the lake while she uses wind blasts, recalled to her side the moment someone reaches melee. She fights to the death.",
      checks: ["DC 18 Religion for the shrine's purpose (automatic for Religion experts and followers of Sangpotshi)",
               "DC 25 Athletics to climb the rain-soaked cliffs, or take the steps instead",
               "DC 25 Athletics to swim the storm-tossed lake",
               "DC 15 Athletics to Move the Raft — crit 25 feet, success 15, failure 5",
               "DC 20 Reflex to land softly if the raft goes over the falls"],
      note: "She waits until the raft is a third of the way across, then Lightning Bolts the party and the far pulley. The raft drifts 20 feet toward the falls each round; Move the Raft rises to DC 25. On round two she claws the rope (AC 17, 15 HP). Going over means 50 feet of falling damage as if onto hard ground.",
      conditions: [
        { key: "iogaka", label: "Iogaka defeated" },
        { key: "bathe", label: "Bathed in the lake" },
        { key: "slept", label: "Spent the night here" }
      ],
      reward: "A cold clear morning, and the raft restored if it was destroyed.",
      loot: "Four bars of invigorating soap in the cave. A lesser thurible of revelation on the shrine platform, which Iogaka has filled with mud and dead fish — clean it before use.",
      save: "Fortitude", xp: 40
    }
  }
};

const COMMON_KNOWLEDGE = [
  "The monk Zhi Hui founded the monastery around an ancient sugi tree, and Willowshore was built to support it.",
  "The monastery emptied decades ago, and in 7062 woodcutters who tried to fell the sugi trees returned that night as undead — the Night of Broken Blades. Dozens of townsfolk died.",
  "The thirteen-mile route is meant to be walked slowly, over four days, past three shrines standing for the traveller's past, future, and present lives."
];

const PATH_RULES = [
  "Only the Path and the monastery exist here. Leave the trail and you are turned around and returned to it without noticing. Flight above 120 feet veers back down.",
  "Travel can't be rushed: every leg takes 8 hours regardless of pace. Returning to the Wall never takes more than an hour, and passed shrines are skipped on the way back.",
  "Restarting the trek means revisiting every shrine in order — but nothing resets. Encounters stay cleared and items stay where they were left.",
  "DC 20 Occultism recognises the Path as a tighter version of the curse holding Willowshore, and that the real revelation waits at the monastery."
];

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "wall", pcs,
    ritual: { components: false, cast: null, xp: false },
    vision: {},
    days: { d1: {}, d2: {}, d3: {} },
    shrines: { d1: {}, d2: {}, d3: {} },
    xp: 0,
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
function registerSetting() {
  if (!game.settings.settings.has(EP_ID)) {
    game.settings.register(EP_NS, EP_KEY, { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ----------------------------------------------------------------- engine */
class PathTracker {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(EP_NS, EP_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  enlightened(dayKey) {
    const shrine = DAYS[dayKey].shrineEnc;
    const st = this.s.shrines[dayKey] ?? {};
    return shrine.conditions.every(c => st[c.key]);
  }
  get saveBonuses() {
    return Object.keys(DAYS).filter(k => this.enlightened(k)).map(k => DAYS[k].shrineEnc.save);
  }
  get enlightenmentCount() { return this.saveBonuses.length; }

  toggleCondition(dayKey, condKey) {
    const st = this.s.shrines[dayKey] ?? (this.s.shrines[dayKey] = {});
    const was = this.enlightened(dayKey);
    st[condKey] = !st[condKey];
    const now = this.enlightened(dayKey);
    const shrine = DAYS[dayKey].shrineEnc;
    if (now && !was) {
      this.s.xp += shrine.xp;
      ui.notifications.info(`${shrine.name} enlightenment — award ${shrine.xp} XP and a +1 item bonus to ${shrine.save} saves until the end of the act.`);
      this.log(`${shrine.name}: enlightenment achieved (+1 ${shrine.save}, ${shrine.xp} XP).`);
    } else if (!now && was) {
      this.s.xp -= shrine.xp;
      this.log(`${shrine.name}: enlightenment undone.`);
    }
    this.touch();
  }

  toggleEncounter(dayKey, id, xp) {
    const bucket = dayKey === "vision" ? this.s.vision : (this.s.days[dayKey] ?? (this.s.days[dayKey] = {}));
    const on = !!bucket[id];
    bucket[id] = !on;
    if (xp) {
      this.s.xp += on ? -xp : xp;
      if (!on) ui.notifications.info(`Award ${xp} XP.`);
    }
    this.log(`${id}: ${on ? "reopened" : "cleared"}.`);
    this.touch();
  }

  setRitual(result) {
    const r = this.s.ritual;
    const was = r.cast;
    r.cast = was === result ? null : result;
    if (r.cast === "success" && was !== "success") {
      this.s.xp += RITUAL.xp;
      ui.notifications.info(`Award ${RITUAL.xp} XP for casting Open the Wall of Ghosts.`);
    } else if (was === "success" && r.cast !== "success") this.s.xp -= RITUAL.xp;
    this.log(`Ritual: ${r.cast ? r.cast : "cleared"}.`);
    this.touch();
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("The Enlightened Path reset.");
    this.touch();
  }

  async postCard(eyebrow, title, bodyHtml, tone = "ember") {
    const C = { ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12", rust: "#95381f", muted: "#6d6052" };
    await ChatMessage.create({
      content: `<div style="background:#efe6d8;color:#241c18;border:1px solid #b9a687;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.ember};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "The Pilgrim's Path" }
    });
  }

  findEncounter(id) {
    for (const b of VISION.beats) if (b.id === id) return b;
    for (const d of Object.values(DAYS)) {
      for (const e of d.encounters) if (e.id === id) return e;
      if (d.shrineEnc.id === id) return d.shrineEnc;
    }
    return null;
  }
  postEncounter(id) {
    const e = this.findEncounter(id);
    if (!e) return;
    const body = `<p style="margin:0 0 6px">${e.text}</p>` +
      (e.note ? `<p style="margin:0 0 6px;font-style:italic">${e.note}</p>` : "") +
      (e.loot ? `<p style="margin:0;font-size:11px"><b>Treasure</b> ${e.loot}</p>` : "");
    return this.postCard(e.level || "Scene", e.name, body, e.tone);
  }
  postChecks(id) {
    const e = this.findEncounter(id);
    if (!e?.checks?.length) return ui.notifications.warn("No checks recorded for this encounter.");
    return this.postCard("Checks", e.name,
      `<ul style="margin:0;padding-left:1.1em">${e.checks.map(c => `<li style="margin-bottom:4px">${linkify(c)}</li>`).join("")}</ul>`, e.tone);
  }
  postDay(dayKey) {
    const d = DAYS[dayKey];
    return this.postCard(d.weather, d.title, `<p style="margin:0">${d.travel}</p>`, "slate");
  }
  postStatus() {
    const bonuses = this.saveBonuses;
    return this.postCard("Chapter 6", "The Enlightened Path",
      `<p style="margin:0 0 6px"><b>Enlightenments</b> ${this.enlightenmentCount} of 3${bonuses.length ? ` — +1 item bonus to ${bonuses.join(", ")} until the end of the act` : ""}</p>
       <p style="margin:0"><b>Milestone XP awarded</b> ${this.s.xp}</p>`, "gold");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class EPApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "ep-console", tag: "div", classes: ["ep-console"],
    position: { width: 900, height: "auto" },
    window: { title: "The Enlightened Path", icon: "fa-solid fa-torii-gate", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "ep-console", classes: ["ep-console"], title: "The Enlightened Path",
      width: 900, height: "auto", resizable: true
    });
  }
  get title() { return "The Enlightened Path"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="ep-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  /* -------------------------------------------------------------- markup */
  markup() {
    const t = this.t, s = t.s, ro = !t.editable;
    return `${this.styles()}
      <div class="ep">
        ${this.header(ro)}
        <nav class="tabs">
          ${STAGES.map(x => `<button type="button" class="tab ${s.tab === x.key ? "on" : ""}" data-act="tab" data-k="${x.key}">
            <b>${x.label}</b><small>${x.sub}</small></button>`).join("")}
        </nav>
        ${s.tab === "wall" ? this.wallTab(ro) : ""}
        ${["d1", "d2", "d3"].includes(s.tab) ? this.dayTab(s.tab, ro) : ""}
        ${s.tab === "d4" ? this.arrivalTab() : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t;
    const bonuses = t.saveBonuses;
    const badge = (save) => `<span class="save ${bonuses.includes(save) ? "on" : ""}">${save}${bonuses.includes(save) ? " +1" : ""}</span>`;
    return `
      <header class="topbar">
        <div class="lamps">
          ${Object.keys(DAYS).map(k => `<span class="lamp ${t.enlightened(k) ? "lit" : ""}" title="${DAYS[k].shrine}"></span>`).join("")}
          <span class="lampcount">${t.enlightenmentCount} of 3 enlightenments</span>
        </div>
        <div class="saves">${badge("Reflex")}${badge("Will")}${badge("Fortitude")}</div>
        <div class="xp"><span>Milestone XP</span><b>${t.s.xp}</b></div>
        <button type="button" class="say" data-act="poststatus" title="Post the party's standing"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset the chapter" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  encCard(dayKey, e, ro) {
    const t = this.t;
    const bucket = dayKey === "vision" ? t.s.vision : (t.s.days[dayKey] ?? {});
    const done = !!bucket[e.id];
    return `
      <article class="panel enc ${done ? "done" : ""}" style="--tone:var(--${e.tone})">
        <h3>
          <span class="eid">${e.id}</span>${e.name}
          ${e.level ? `<span class="lvl">${e.level}</span>` : ""}
          <button type="button" class="say" data-act="postenc" data-id="${e.id}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="text">${e.text}</p>
        ${e.checks?.length ? `<ul class="checks">${e.checks.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
        ${e.note ? `<p class="note">${e.note}</p>` : ""}
        ${e.loot ? `<p class="loot"><b>Treasure</b> ${e.loot}</p>` : ""}
        <div class="btnrow">
          <button type="button" class="${done ? "ghost" : "primary"}" data-act="toggleenc" data-day="${dayKey}" data-id="${e.id}" data-xp="${e.xp ?? 0}" ${ro ? "disabled" : ""}>
            ${done ? "Reopen" : "Mark cleared"}${e.xp && !done ? ` · ${e.xp} XP` : ""}
          </button>
          ${e.checks?.length ? `<button type="button" class="ghost" data-act="postchecks" data-id="${e.id}"><i class="fa-solid fa-dice-d20"></i> Post checks</button>` : ""}
        </div>
        ${e.xpNote && e.xp ? `<p class="hint">${e.xp} XP ${e.xpNote}.</p>` : ""}
      </article>`;
  }

  wallTab(ro) {
    const t = this.t, r = t.s.ritual;
    const opt = (k, label) => `<button type="button" class="rit ${r.cast === k ? "on" : ""} ${k}" data-act="ritual" data-r="${k}" ${ro ? "disabled" : ""}>${label}</button>`;
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>Performing the ritual <small>${RITUAL.name}</small></h3>
        <label class="check"><input type="checkbox" data-act="components" ${r.components ? "checked" : ""} ${ro ? "disabled" : ""}> Components secured — <span class="soft">${RITUAL.cost}</span></label>
        <ul class="checks">${RITUAL.rules.map(x => `<li>${x}</li>`).join("")}</ul>
        <div class="btnrow">${opt("success", "Cast successfully · 80 XP")}${opt("critfail", "Critical failure · two ghosts")}</div>
      </section>

      <section class="panel" style="--tone:var(--plum)">
        <h3>Into the Wall of Ghosts <small>Kugaptee's dream</small></h3>
        <p class="text">${VISION.intro}</p>
        <ul class="checks">${VISION.rules.map(x => `<li>${x}</li>`).join("")}</ul>
      </section>

      <div class="grid">${VISION.beats.map(b => this.encCard("vision", b, ro)).join("")}</div>`;
  }

  dayTab(dayKey, ro) {
    const t = this.t, d = DAYS[dayKey], sh = d.shrineEnc;
    const st = t.s.shrines[dayKey] ?? {};
    const lit = t.enlightened(dayKey);
    return `
      <section class="panel daybar" style="--tone:var(--slate)">
        <h3>${d.title} <small>${d.weather}</small>
          <button type="button" class="say" data-act="postday" data-k="${dayKey}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="text">${d.travel}</p>
      </section>

      <div class="grid">${d.encounters.map(e => this.encCard(dayKey, e, ro)).join("")}</div>

      <section class="panel shrine ${lit ? "lit" : ""}" style="--tone:var(--${sh.tone})">
        <h3><span class="eid">${sh.id}</span>${sh.name} <span class="lvl">${sh.level}</span>
          <button type="button" class="say" data-act="postenc" data-id="${sh.id}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="text">${sh.text}</p>
        <ul class="checks">${sh.checks.map(c => `<li>${c}</li>`).join("")}</ul>
        ${sh.note ? `<p class="note">${sh.note}</p>` : ""}
        ${sh.loot ? `<p class="loot"><b>Treasure</b> ${sh.loot}</p>` : ""}
        <div class="enl">
          <div class="enl-head">Enlightenment${lit ? ` <span class="got">achieved</span>` : ""}</div>
          ${sh.conditions.map(c => `<label class="check"><input type="checkbox" data-act="cond" data-day="${dayKey}" data-c="${c.key}" ${st[c.key] ? "checked" : ""} ${ro ? "disabled" : ""}> ${c.label}</label>`).join("")}
          <p class="reward">${sh.reward}</p>
          <p class="bonus">+1 item bonus to ${sh.save} saves until the end of the act · ${sh.xp} XP</p>
        </div>
        <div class="btnrow">
          <button type="button" class="ghost" data-act="postchecks" data-id="${sh.id}"><i class="fa-solid fa-dice-d20"></i> Post checks</button>
        </div>
      </section>`;
  }

  arrivalTab() {
    const t = this.t;
    const bonuses = t.saveBonuses;
    const missing = Object.keys(DAYS).filter(k => !t.enlightened(k)).map(k => DAYS[k].shrineEnc.name);
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>The final day <small>uneventful, and cold</small></h3>
        <p class="text">If Iogaka fell, the party wakes to clear blue skies; if she didn't, the storm continues for the rest of the act. Either way the temperature keeps dropping, feeling less like fall and more like winter. The Path crests a final ridge and descends toward the ruined Tan Sugi monastery — Chapter 7.</p>
      </section>

      <section class="panel" style="--tone:var(--plum)">
        <h3>Carried into the monastery</h3>
        <div class="carry">
          <div class="cbox">
            <b>${t.enlightenmentCount} of 3 enlightenments</b>
            <p>${bonuses.length ? `+1 item bonus to ${bonuses.join(", ")} saves until the end of the act.` : "No save bonuses banked."}</p>
            ${missing.length ? `<p class="hint">Missed: ${missing.join(", ")}. Master Zhi Hui's ghost rewards the party by how many they reached.</p>` : `<p class="hint">All three. The party walks in buffed on every save.</p>`}
          </div>
          <div class="cbox">
            <b>Threads</b>
            <p>Yeri asked the party to find her sister Yuni and save her too — Yuni is waiting in the monastery.</p>
            <p>Iogaka tormented Enko before she ever met the party. If they escorted him, that debt is paid.</p>
          </div>
        </div>
      </section>

      <section class="panel">
        <h3>Common knowledge <small>give this freely</small></h3>
        <ul class="checks">${COMMON_KNOWLEDGE.map(x => `<li>${x}</li>`).join("")}</ul>
      </section>

      <section class="panel">
        <h3>Walking the Path <small>the rules of the place</small></h3>
        <ul class="checks">${PATH_RULES.map(x => `<li>${x}</li>`).join("")}</ul>
      </section>`;
  }

  /* ---------------------------------------------------------- listeners */
  wire(root) {
    if (!root || root.dataset?.epWired === "1") return;
    if (root.dataset) root.dataset.epWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act;
      if (a === "tab") { t.s.tab = btn.dataset.k; t.touch(); }
      else if (a === "toggleenc") t.toggleEncounter(btn.dataset.day, btn.dataset.id, Number(btn.dataset.xp) || 0);
      else if (a === "ritual") t.setRitual(btn.dataset.r);
      else if (a === "postenc") t.postEncounter(btn.dataset.id);
      else if (a === "postchecks") t.postChecks(btn.dataset.id);
      else if (a === "postday") t.postDay(btn.dataset.k);
      else if (a === "poststatus") t.postStatus();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "cond") t.toggleCondition(el.dataset.day, el.dataset.c);
      else if (el.dataset.act === "components") { t.s.ritual.components = el.checked; t.touch(); }
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #ep-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #ep-console .window-content > * { background:transparent; }
      .ep { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .ep * { box-sizing:border-box; }
      .ep button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
      .ep button:hover:not(:disabled) { background:var(--hover); }
      .ep button:disabled { opacity:.45; cursor:not-allowed; }
      .ep input[type="checkbox"] { accent-color:var(--ember); }
      .ep h3 { color:var(--ink); font-size:.9rem; margin:0 0 .5rem; letter-spacing:.04em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
               padding-bottom:.3rem; }
      .ep h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .ep h1, .ep h2, .ep h4, .ep legend { color:var(--ink); }
      .ep .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .ep .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .ep .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .ep .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 5px; letter-spacing:.06em; }
      .ep .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .ep .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .ep .say + .say { margin-left:.25rem; }
      .ep .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .ep .note { font-size:.78rem; line-height:1.45; color:var(--muted); font-style:italic; margin:.2rem 0 .4rem; }
      .ep .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .ep .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .ep .soft { font-weight:400; color:var(--muted); }
      .ep .checks { margin:0 0 .45rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; color:var(--muted); }
      .ep .checks li { margin-bottom:.25rem; }
      .ep .check { display:block; font-size:.8rem; margin-bottom:.25rem; line-height:1.4; }
      .ep .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; }
      .ep .primary { background:var(--tone, var(--ember)); border-color:var(--tone, var(--ember));
                     color:var(--paper); font-weight:600; padding:.3rem .7rem; font-size:.76rem; }
      .ep .primary:hover:not(:disabled) { filter:brightness(1.1); background:var(--tone, var(--ember)); }
      .ep .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }

      .ep .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .ep .lamps { display:flex; align-items:center; gap:.35rem; }
      .ep .lamp { width:12px; height:12px; border-radius:50%; border:1px solid var(--line); display:block; }
      .ep .lamp.lit { background:var(--gold); border-color:var(--gold); box-shadow:0 0 6px var(--gold); }
      .ep .lampcount { font-size:.72rem; color:var(--muted); margin-left:.25rem; }
      .ep .saves { display:flex; gap:.3rem; }
      .ep .save { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:2px 7px;
                  border-radius:10px; border:1px solid var(--line); color:var(--muted); }
      .ep .save.on { border-color:var(--moss); color:var(--moss); font-weight:700; }
      .ep .xp { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; }
      .ep .xp span { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .ep .xp b { font-size:1rem; line-height:1; }

      .ep .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .ep .tab { flex:1; padding:.3rem .2rem; font-size:.78rem; display:flex; flex-direction:column; line-height:1.2; }
      .ep .tab small { font-size:.62rem; color:var(--muted); font-weight:400; }
      .ep .tab.on { background:var(--plum); border-color:var(--plum); color:var(--paper); }
      .ep .tab.on small { color:var(--paper); opacity:.8; }

      .ep .grid { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
      .ep .enc.done { opacity:.72; }
      .ep .enc.done h3 { text-decoration:line-through; text-decoration-color:var(--muted); }
      .ep .rit { padding:.3rem .7rem; font-size:.76rem; }
      .ep .rit.on.success { background:var(--moss); border-color:var(--moss); color:var(--paper); }
      .ep .rit.on.critfail { background:var(--rust); border-color:var(--rust); color:var(--paper); }

      .ep .shrine.lit { box-shadow:inset 0 0 0 1px var(--gold); }
      .ep .enl { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0; background:var(--stripe); }
      .ep .enl-head { font-size:.66rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin-bottom:.3rem; }
      .ep .got { color:var(--gold); border:1px solid var(--gold); border-radius:10px; padding:0 6px; margin-left:4px; }
      .ep .reward { font-size:.78rem; line-height:1.45; margin:.35rem 0 .2rem; }
      .ep .bonus { font-size:.76rem; font-weight:600; color:var(--moss); margin:0; }

      .ep .carry { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
      .ep .cbox { font-size:.8rem; line-height:1.45; }
      .ep .cbox p { margin:.25rem 0; }

      @media (max-width:760px) {
        .ep .grid, .ep .carry { grid-template-columns:1fr; }
        .ep .tabs { flex-wrap:wrap; }
      }
    </style>`;
  }
}

if (AppV2) {
  EPApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSetting();
  let state = game.settings.get(EP_NS, EP_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(EP_NS, EP_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const tracker = new PathTracker(state);
  const app = new EPApp(tracker);

  if (!globalThis.__epHook) {
    globalThis.__epHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== EP_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { tracker.state = fresh; tracker.render(); }
    });
  }
  app.render(true);
})();
