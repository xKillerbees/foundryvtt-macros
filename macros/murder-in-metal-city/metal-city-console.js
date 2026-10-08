/* ============================================================================
   MURDER IN METAL CITY — GM Console
   Starfinder Second Edition Beginner Box · 1st-level characters · three chapters
   Foundry VTT v11 / v12 / v13 / v14  •  built for the sf2e system
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   Runs the whole adventure: the Downgrid Detour chase, replayed round by round
   from each PC's result; the clues on the GM Aid's Evidence Tracker and the
   five-piece threshold the Machine Court's verdict hangs on; every complex
   hazard's disable track; the Ice Well's obstacle chain and the shroomclaw
   that may or may not be on the party's side by the Gloaming; and an XP
   ledger of ticked awards, so every point traces back to where it was earned.

   Statblocks are not reproduced. Creature buttons look the actor up by name —
   in this world first, then in every Actor compendium — and open its sheet.
   ============================================================================ */

const MMC_NS = "world";
const MMC_KEY = "sf2eMurderMetalCity";
const MMC_ID = `${MMC_NS}.${MMC_KEY}`;
const MAX_PCS = 6;
const LEVEL_AT = 1000;

const THEME = "neon";  // or "daylight"
const PALETTES = {
  /* Downgrid Striving after dark: wet steel, magenta signage, cold cyan. */
  neon: {
    paper: "#0f0e15", card: "#18171f", ink: "#e4e1ee", line: "#302d3d", muted: "#8f8aa3",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(230,90,200,.10)", field: "#0b0a10",
    rust: "#ec5b4a", ember: "#f2a33a", moss: "#4fd6a0", slate: "#4fb8e6", plum: "#d36be0", gold: "#f2d16b"
  },
  daylight: {
    paper: "#f1f0f5", card: "#ffffff", ink: "#1a1824", line: "#cbc7d8", muted: "#615c74",
    stripe: "rgba(0,0,0,.04)", hover: "rgba(0,0,0,.06)", field: "#f8f7fb",
    rust: "#b2382a", ember: "#a8620f", moss: "#1d7a55", slate: "#1f6d9e", plum: "#8a3a9a", gold: "#8a6a12"
  }
};

/* --------------------------------------------------- inline check helper */
const SKILL_WORDS = ["Acrobatics", "Arcana", "Athletics", "Computers", "Crafting", "Deception",
  "Diplomacy", "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Piloting",
  "Religion", "Society", "Stealth", "Survival", "Thievery", "Perception",
  "Fortitude", "Reflex", "Will"];
const SAVES = ["Fortitude", "Reflex", "Will"];
const checkSlug = (s) => s.trim().toLowerCase().replace(/\s+/g, "-");
function checkCode(skill, dc, basic) {
  return `@Check[type:${checkSlug(skill)}|dc:${dc}${basic ? "|basic:true" : ""}]`;
}
/* Turns "DC 14 Perception" into an inline check. Lore names may be two words
   ("Life Science Lore"), and "basic Reflex" keeps its basic flag. */
function linkify(text) {
  const rx = new RegExp(`DC (\\d+) (basic )?((?:[A-Z][a-z]+ ){0,2}Lore|${SKILL_WORDS.join("|")})`, "g");
  return text.replace(rx, (_m, dc, basic, skill) => checkCode(skill, dc, !!basic && SAVES.includes(skill)));
}

/* Inside the window @Check text isn't enriched, so DCs are highlighted
   instead; the chat buttons post the same lines through linkify(), where
   Foundry turns them into rollable checks. */
const DC_RX = new RegExp(`DC (\\d+) (basic )?((?:[A-Z][a-z]+ ){0,2}Lore|${SKILL_WORDS.join("|")})`, "g");
const hl = (text) => text.replace(DC_RX, (m) => `<span class="dc">${m}</span>`);

/* XP for one creature or complex hazard against the party's level. */
const XP_BY_DIFF = { "-4": 10, "-3": 15, "-2": 20, "-1": 30, "0": 40, "1": 60, "2": 80, "3": 120, "4": 160 };
const xpFor = (lvl, pl) => XP_BY_DIFF[String(Math.max(-4, Math.min(4, lvl - pl)))] ?? 0;
const encounterXp = (list, pl) => list.reduce((n, c) => n + (c.n ?? 1) * xpFor(c.level, pl), 0);

/* ------------------------------------------------------------------- tabs */
const TABS = [
  { key: "ch1", label: "Cold Case", sub: "Chapter 1", tone: "slate", icon: "fa-mug-hot" },
  { key: "city", label: "Metal City", sub: "Ch 2 · the leads", tone: "plum", icon: "fa-city" },
  { key: "archive", label: "Archive 404", sub: "Ch 2 · framed", tone: "ember", icon: "fa-gavel" },
  { key: "well", label: "Ice Well", sub: "Ch 3 · the descent", tone: "moss", icon: "fa-snowflake" },
  { key: "fields", label: "Abaddon Fields", sub: "Ch 3 · the finale", tone: "rust", icon: "fa-skull" },
  { key: "case", label: "Case File", sub: "evidence · XP", tone: "gold", icon: "fa-folder-open" }
];

/* --------------------------------------------------------------- evidence
   The GM Aid's Evidence Tracker, in its own order. Five of these are what the
   Machine Court needs to clear the party outright. */
const EVIDENCE = [
  { key: "datapad", label: "Recovered the old datapad", where: "Ch 1 · the abandoned camp" },
  { key: "drone", label: "Recovered the wrecked drone", where: "Ch 1 · only if they caught it" },
  { key: "slice", label: "Learned someone cast slice reality to kill Tierny", where: "Ch 1 · the charging platform" },
  { key: "queries", label: "Learned about Tierny's queries", where: "Ch 2 · Processor" },
  { key: "briefing", label: "Discovered the mechanizers' mission briefing", where: "Ch 2 · Parade of Faiths" },
  { key: "glitch", label: "Learned of the security forces' “glitch”", where: "Ch 2 · Parade of Faiths" },
  { key: "keycaps", label: "Learned about the strange man who bought the keycaps", where: "Ch 2 · Hidden Truth Apothecary" },
  { key: "footage", label: "Learned someone tampered with the security footage at Magenta", where: "Ch 2 · Magenta" },
  { key: "off", label: "Sensed that getting into Archive 404 felt “off”", where: "Ch 2 · Archive 404" },
  { key: "scene", label: "Examined the crime scene at Archive 404", where: "Ch 2 · before the trial" }
];
const EVIDENCE_NEEDED = 5;

/* --------------------------------------------------------------- handouts */
const HANDOUTS = [
  [1, "Invitation to Analog", "Before the first scene"],
  [2, "Drone Programming Scan", "The foggy alley — only if they caught the drone"],
  [3, "Anacite Habits", "Getting on the case — Recall Knowledge or Gather Information"],
  [4, "Memory Storage", "The cache — DC 14 Computers on the encrypted file"],
  [5, "Note from Tierny", "The cache — in Tierny's hand"],
  [6, "Investigation Status", "Processor — from Hesop"],
  [7, "Log of Tier-99-Professor's Queries", "Processor — the transcripts"],
  [8, "Anacite Death Customs", "The memorial"],
  [9, "Mysterious Comm Unit Message", "After the trial"],
  [10, "Recording from Agent Z", "Dead End — the cyberwings play it"],
  [11, "About Insight Array App", "The first PC to download the app"],
  [12, "Public Profile: Prime-Facilitator", "The first time they look Prime-Facilitator up"],
  [13, "About Ice Wells", "Asking about the Ice Wells"],
  [14, "About Jinsuls", "Looking up or asking about jinsuls"],
  [15, "Special Notice! Parade of Faiths!", "Special job"],
  [16, "Special Notice! Pest Control!", "Special job"],
  [17, "Relic Scan", "The murderer's hideout"],
  [18, "Laptop Entry 1", "The hideout — once the laptop is hacked"],
  [19, "Laptop Entry 2", "The hideout — once the laptop is hacked"],
  [20, "Jeotanni's Comm Unit Contents", "The Gloaming — if they look her up"]
];

/* ------------------------------------------------------------- encounters
   Creature and hazard levels from the book, for XP. `name` is what the
   creature button searches for. */
const FOES = {
  smog2: [{ n: 2, name: "Smog Scamp", level: -1 }],
  smog4: [{ n: 4, name: "Smog Scamp", level: -1 }],
  stalker: [{ n: 1, name: "Shadowy Duplicates", level: 1, hazard: true }, { n: 2, name: "Anacite Wingbot", level: -1 }],
  parade: [{ n: 3, name: "Mechanizer Saboteur", level: -1 }],
  pest: [{ n: 3, name: "Young Sharpwing", level: -1 }],
  archive: [{ n: 1, name: "Archivist's Wrath", level: 1, hazard: true }, { n: 2, name: "Hardlight Dragonet", level: 0 }],
  deadend: [{ n: 2, name: "Cyberwing", level: 1 }],
  pack: [{ n: 2, name: "Shroomclaw", level: 0 }],
  swoop: [{ n: 2, name: "Young Sharpwing", level: -1 }],
  gloaming: [{ n: 1, name: "Dewblossom", level: 1, hazard: true }, { n: 2, name: "Shroomclaw", level: 0 }],
  wreck: [{ n: 1, name: "Particle Cannon", level: 1, hazard: true }, { n: 2, name: "Jinsul Lookout", level: 0 }],
  parting: [{ n: 1, name: "Warlord Hura", level: 1 }, { n: 1, name: "Sworn Blade of Shields", level: -1 },
            { n: 1, name: "Sworn Blade of Sigils", level: -1 }],
  agentz: [{ n: 1, name: "Agent Z", level: 5 }],
  protectors: [{ n: 2, name: "Anacite Protector", level: 2 }]
};

/* -------------------------------------------------------------- the chase
   Downgrid Detour. The PCs start at Cloaking; the drone starts one obstacle
   ahead and moves first, one obstacle a round, so during round N the PCs are
   chasing it at obstacle N+1. Reaching the drone's obstacle catches it. */
const CHASE = {
  droneStart: 1,
  degrees: { cs: 2, s: 1, f: 0, cf: -1, wait: 1 },
  obstacles: [
    { key: "cloak", name: "Cloaking", cp: 2,
      overcome: "DC 12 Perception or DC 12 Survival to notice the drone; DC 15 Crafting or DC 15 Computers to identify its electronic signature",
      text: "A flying drone equipped with an underslung laser pistol positioned like a wasp's stinger hovers nearby, then flickers as it activates its cloaking module." },
    { key: "traffic", name: "Traffic Crossing", cp: 3,
      overcome: "DC 15 Acrobatics or DC 15 Athletics to weave or sprint through; DC 13 Piloting to follow the flow",
      text: "Dozens of vehicles — sleek urban cruisers, hovercycles, all-terrain crawlers, and bulky autobuses — zip through this intersection at high speeds.",
      danger: "Critically failing here causes a minor collision: 1d6 bludgeoning damage." },
    { key: "safety", name: "Safety Crossing", cp: 2,
      overcome: "DC 14 Computers or DC 14 Thievery to hack or rewire the traffic signal",
      text: "A blinking traffic signal glows above the busy intersection, signaling when it's safe for pedestrians to cross.",
      wait: "A PC can spend the round doing nothing to gain 1 Chase Point automatically — but takes a −2 circumstance penalty on the Crowd that follows." },
    { key: "crowd", name: "Crowd", cp: 3,
      overcome: "DC 15 Acrobatics or DC 15 Athletics to weave or push through; DC 13 Society to follow the flow",
      text: "Throngs of people crowd the streets, making it difficult to continue the chase." },
    { key: "site", name: "Construction Site", cp: 2,
      overcome: "DC 13 Athletics to jump or break through the barricades; DC 15 Acrobatics or DC 15 Striving Lore to parkour through; DC 12 Labor Lore or DC 12 Stealth to sneak through the workers' entrance",
      text: "Metal barricades bar the path forward, blocking off a partially completed construction site heaped with scrap. The drone lazily weaves through gaps too small for most creatures." },
    { key: "holo", name: "Holo-Ads", cp: 2,
      overcome: "DC 13 Computers or DC 13 Perception to reprogram or disbelieve the holograms; DC 12 Technology Lore to identify them; a ranged attack against AC 12 to damage the holoprojector",
      text: "A burst of color, sound, and sensation washes over you as noisy holo-ads activate everywhere, targeting you based on your latest infosphere purchases." },
    { key: "mall", name: "Underground Mall", cp: 2,
      overcome: "DC 12 Diplomacy to get directions from a shopkeeper; DC 12 Piloting or DC 12 Survival to navigate out; DC 13 Society to find the nearest exit",
      text: "A confusing network of cement tunnels winds through an eclectic collection of shops selling curios, useful gadgets, and tourist trinkets." },
    { key: "flock", name: "Flock of Drones", cp: 2,
      overcome: "DC 13 Perception to identify the correct drone; DC 12 Survival to follow its path",
      text: "A cloud of drones nearly identical to the one you've been chasing glides busily through the street, moving in a dozen different directions. It's impossible to identify your target at a glance." }
  ]
};

/* ---------------------------------------------- obstacle checks (Ch 3)
   One check per PC. Two successes, or any critical success, is a pass. */
const OBSTACLES = {
  dd_leads: { name: "Track Down Leads", where: "Day Delve",
    overcome: "DC 13 Survival to find and follow tracks; DC 12 Perception to spot destruction; DC 12 Society to identify Pact Worlds boot prints; DC 14 Society to recognize jinsul blade scuffs",
    pass: "They follow the blade scuffs to churned, bare earth. Two feet down: a brutalist steel lockbox holding an autograppler, a climbing kit, a commercial plasma cannon (100 charges), commercial aegis series armor, and a commando serum. DC 16 Society or DC 14 Scoured Stars Lore identifies them as jinsul-made.",
    fail: "They keep moving, but the lockbox stays buried." },
  dd_pack: { name: "Hunting Shroomclaw Pack", where: "Day Delve",
    overcome: "DC 13 Deception or DC 13 Survival to evade the pursuers; DC 14 Stealth to hide; DC 14 Nature to tame an injured shroomclaw",
    each: "Any PC who fails is singled out: 1d6+3 piercing damage before the predator vanishes into the undergrowth.",
    pass: "They spot a young, limping shroomclaw lingering behind the pack. It can be tamed with patience and food — after the third feeding it guards camp.",
    fail: "A pair of shroomclaws attacks.", foes: "pack" },
  dd_drop: { name: "Treacherous Drop", where: "Day Delve",
    overcome: "DC 14 Athletics to Climb down; DC 14 Acrobatics to rappel; DC 15 Crafting to rig a pulley",
    each: "Failure: fatigued after the climb. Critical failure: also falls 20 feet for 2d6 bludgeoning — but makes it down.",
    pass: "Down cleanly.", fail: "Down, the hard way." },
  cn_wings: { name: "Hunting Sharpwings", where: "Canopy",
    overcome: "DC 13 Athletics or DC 13 Acrobatics to block the attack; DC 12 Stealth to hide; DC 14 Survival to create camouflage; DC 14 Nature to repel or lure it away",
    each: "Any PC who fails takes 1d4 slashing from the mature sharpwing's swooping claws.",
    pass: "The sharpwing loses interest.", fail: "A pair of young sharpwings attacks.", foes: "swoop" },
  cn_walls: { name: "Climb Steep Walls", where: "Canopy",
    overcome: "DC 13 Athletics to Climb down; DC 12 Acrobatics to rappel; DC 15 Crafting to rig a belay",
    each: "Failure: fatigued after the climb. A critical failure tangles in vines rather than falling.",
    pass: "Down cleanly.", fail: "Down, tired." },
  cn_leads: { name: "Track Down Leads", where: "Canopy",
    overcome: "DC 15 Survival to find and follow tracks; DC 12 Perception to spot destruction; DC 15 Society to identify Pact Worlds boot prints or jinsul blade scuffs",
    pass: "Boot prints lead to Last Goodbye — and they also find laser fire concentrated near the boulder, and jinsul scuffs leading deeper into the Ice Well.",
    fail: "Boot prints lead to Last Goodbye. Nothing else stands out in the undergrowth." },
  lg_truth: { name: "Discover Hidden Truth", where: "Last Goodbye",
    overcome: "DC 14 Survival to follow tracks; DC 15 Perception to spot an outline or melted snow; detect magic reveals it; DC 15 Arcana, DC 15 Occultism, or DC 15 Religion to recognize the Eloritu rune",
    pass: "They find the hidden door fifteen feet down, across a narrow rope bridge. Drawing one of the other runes (DC 16 Religion; a worshipper of Eloritu needs no check) lights the door's outline in violet.",
    fail: "No door — yet. Let them follow the tracks on to the Gloaming, or try again with a cost." },
  gl_gloom: { name: "Persistent Gloom", where: "The Gloaming",
    overcome: "DC 15 Arcana to counteract the magic; DC 15 Occultism to purge the psychic residue; DC 15 Religion to bless the space",
    pass: "The darkness recedes for 24 hours — they see normally.",
    fail: "Light sources work at half range and brightness; darkvision sees half as far." },
  af_outpost: { name: "Finding the Raider Outpost", where: "Abaddon Fields",
    overcome: "DC 13 Arcana, DC 13 Occultism, or DC 13 Religion to sense ritual residue; DC 14 Survival to follow tracks; DC 14 Piloting to navigate; an appropriate item or spell overcomes it",
    pass: "The outpost is found after 1d4 hours.",
    fail: "Nearly a full day of searching. Every PC who failed is demoralized: −2 to initiative in Abaddon Fields until they've rested 8 hours outside the Ice Well." }
};

/* --------------------------------------------------- complex hazard tracks */
const TRACKS = {
  archive: { name: "Archivist's Wrath", need: 4,
    disable: ["DC 13 Computers (trained) overrides the security program",
              "DC 15 Crafting or DC 15 Thievery (trained) disables the hardlight projector",
              "DC 17 Diplomacy convinces the Archivist to reconsider"] },
  entry: { name: "Getting into Archive 404", need: 4 },
  puzzle: { name: "Puzzle Lock", need: 2 },
  dew: { name: "Dewblossom", need: 4,
    disable: ["DC 14 Athletics (trained) to wrestle its vines",
              "DC 14 Acrobatics (trained) to dodge around it",
              "DC 13 Nature (trained) to entice the flower to stop"] },
  cannon: { name: "Particle Cannon", need: 3,
    disable: ["DC 14 Crafting or DC 14 Thievery (trained) to disable or jam it",
              "DC 17 Arcana, DC 17 Occultism, DC 17 Nature, or DC 17 Religion (trained) to counteract the beam"] },
  defense: { name: "A case on the fly", need: 3 },
  crowd: { name: "Directing the crowd", need: 2 }
};

/* ---------------------------------------------------------------- the XP
   Every award the book prints, plus each fight's XP from its creatures'
   levels. Ticking one stores the amount granted, so un-ticking takes back
   exactly that even if the party has levelled in between. `gate` returns
   a reason when the award isn't earned yet. */
const AWARDS = [
  { key: "analog", ch: 1, label: "Roleplaying or investigating at Analog", xp: 10 },
  { key: "ghellon", ch: 1, label: "Talking to Ghellon", xp: 10 },
  { key: "chase", ch: 1, label: "The chase scene, caught or not", xp: 40,
    gate: (t) => t.chase.outcome === "running" ? "The chase is still running" : null },
  { key: "caught", ch: 1, label: "…and they caught up with the drone", xp: 40,
    gate: (t) => t.chase.outcome !== "caught" ? "Only if they caught the drone" : null },
  { key: "f_smog", ch: 1, label: "Smog scamps defeated or talked down", foes: (t) => t.chase.outcome === "lost" ? FOES.smog4 : FOES.smog2,
    gate: (t) => t.chase.outcome === "running" ? "Finish the chase first — it decides how many scamps there are" : null },
  { key: "camp", ch: 1, label: "Searching the abandoned camp", xp: 10 },
  { key: "cache", ch: 1, label: "Investigating the charging platform", xp: 20 },
  { key: "glimpse", ch: 1, label: "First glimpse of Tierny's killer", xp: 40 },
  { key: "f_stalker", ch: 1, label: "Shadowy duplicates and wingbots", foes: () => FOES.stalker },

  { key: "hesop", ch: 2, label: "Talking to Hesop and downloading the app", xp: 30 },
  { key: "queries", ch: 2, label: "Reviewing Tierny's query transcripts", xp: 20 },
  { key: "crowd", ch: 2, label: "Facing the crowd at the parade", xp: 10 },
  { key: "dispersed", ch: 2, label: "…and dispersing it", xp: 10,
    gate: (t) => t.s.tracks.crowd < TRACKS.crowd.need ? "Only if they redirected the crowd" : null },
  { key: "f_parade", ch: 2, label: "Mechanizer saboteurs", foes: () => FOES.parade },
  { key: "remena", ch: 2, label: "Speaking with Remena", xp: 20 },
  { key: "f_pest", ch: 2, label: "Sharpwings at the abandoned mall", foes: () => FOES.pest },
  { key: "magenta", ch: 2, label: "Investigating Magenta", xp: 80 },
  { key: "tamper", ch: 2, label: "…and discovering the footage tampering", xp: 20,
    gate: (t) => !t.s.evidence.footage ? "Only with the Magenta footage clue" : null },
  { key: "f_archive", ch: 2, label: "Archivist's Wrath and hardlight dragonets", foes: () => FOES.archive },
  { key: "trial", ch: 2, label: "Participating in the trial", xp: 40 },
  { key: "innocent", ch: 2, label: "…and convincing the court they're innocent", xp: 80,
    gate: (t) => t.s.trial.verdict !== "innocent" ? "Only with an innocent verdict" : null },
  { key: "f_deadend", ch: 2, label: "Cyberwings in the foggy alley", foes: () => FOES.deadend },

  { key: "f_pack", ch: 3, label: "Shroomclaw pack (Day Delve, if it came to a fight)", foes: () => FOES.pack,
    gate: (t) => t.s.obst.dd_pack !== "fail" ? "Only if the pack check went badly" : null },
  { key: "canopy", ch: 3, label: "Day Delve's obstacles — reaching Canopy", xp: 20 },
  { key: "f_swoop", ch: 3, label: "Young sharpwings (Canopy, if it came to a fight)", foes: () => FOES.swoop,
    gate: (t) => t.s.obst.cn_wings !== "fail" ? "Only if the sharpwing check went badly" : null },
  { key: "goodbye", ch: 3, label: "Reaching Last Goodbye", xp: 20 },
  { key: "relic", ch: 3, label: "Recovering the relic", xp: 120 },
  { key: "laptop", ch: 3, label: "Accessing the laptop's records", xp: 40 },
  { key: "bug", ch: 3, label: "Finding the listening device", xp: 20 },
  { key: "f_gloaming", ch: 3, label: "Dewblossom and shroomclaws (full XP even if the shroomclaws side with them)", foes: () => FOES.gloaming },
  { key: "f_wreck", ch: 3, label: "Particle cannon and jinsul lookouts", foes: () => FOES.wreck },
  { key: "f_parting", ch: 3, label: "Warlord Hura and the sworn blades", foes: () => FOES.parting },
  { key: "meetz", ch: 3, label: "Meeting Agent Z", xp: 120 },
  { key: "f_agentz", ch: 3, label: "Agent Z — helped destroy the relic, or defeated in combat", foes: () => FOES.agentz,
    gate: (t) => !["destroyed", "fought"].includes(t.s.agentz) ? "Only if they helped destroy the relic or fought him" : null }
];

/* ------------------------------------------------------------------- cards
   Every scene in the book, in order. `widget` names an interactive panel the
   card carries; `ev` and `xp` put those trackers' toggles in the card. */
const CARDS = [
  /* ============================== CHAPTER 1 ============================== */
  { key: "analog", tab: "ch1", eid: "1", title: "Analog Café", tone: "slate", sub: "downgrid Striving",
    boxed: "Air pumps exhale swirls of sickly fog that cling to the feet of skyscrapers and rub against windows like affectionate squoxes. The silhouettes of floating towers are dimly visible through the fog, hovering ponderously over busy thoroughfares. Agile maintenance bots skitter up and down skyscrapers' slick angular surfaces, gleaming silver in the faltering sunlight. Crowded into a niche on the first two floors of one of dozens of lofty towers lining the streets of downgrid Striving, Analog is a boxy cafe with an overhanging roof and a two-story patio constantly shrouded in thick, swirling gases.",
    text: ["Hand out <b>Handout #1</b> first. Have each player introduce their character and how they arrive — this is the party coming together.",
      "The PCs' names are on Tierny's reservation: a private alcove at the back. A table hologram takes their dining algorithm; everything is on Tierny's open tab. The chef's special is an Ice Well four-course. Tierny never arrives — eventually Ghellon offers to call them an autocab."],
    qa: [["How do you know Tierny?", "They're a regular customer… started coming here about ten years ago during a blackout."],
      ["When did they give you that vid?", "A month ago. I haven't seen them since."],
      ["Who are their friends?", "Just about everybody. Lately, a visiting professor — I think his name started with a Z. Zamie, maybe?"],
      ["Would anybody want to hurt them?", "No. Everybody liked Tierny. Even their rivals!"],
      ["Where do they spend time?", "They work at Polytechnica. Otherwise, their charging platform here in North Circuit."],
      ["Where were you two weeks ago?", "I work every night unless I'm sick." + " (She has footage and logs to back it.)"]],
    note: "Ghellon says little about Tierny unless the PCs have ordered something. She hands over the holovid only if someone speaks the passphrase: <b>“incredulous static.”</b> Shown the vid, she's worried — Tierny had seemed down and was avoiding friends.",
    xp: ["analog", "ghellon"] },

  { key: "holovid", tab: "ch1", eid: "2", title: "Tierny's Last Words", tone: "plum", sub: "the holovid",
    boxed: "“Greetings, former companions. If you're watching this, it's because I have experienced an unexpected shutdown — in organic terms, I am dead. I propose you enjoy a meal on my prepaid tab and seek emotional support. My shutdown is within the normal range of variability, however it has occurred prematurely and left many of my tasks incomplete. In fact, the reason I invited you out tonight was to share a new theory with you: I am being pursued by a clever adversary who intends to shut me down permanently. I had planned to ask for your protection in exchange for payment. But the scenario has evolved. As I no longer have need of protection, I have an alternative proposal for you: solve my murder.”",
    boxed2: "Suddenly a laser streaks through the window, passing directly through the center of the holographic anacite's head in a hard light copy of a kill shot. The image explodes in a frenzy of light and static.",
    text: ["A cloaked stealth drone shot the hologram, missed everyone living, and is fleeing down the alley. If the PCs leave Analog without watching the vid, the drone shoots at them outside instead. Either way, run the chase."] },

  { key: "chase", tab: "ch1", eid: "3", title: "Downgrid Detour", level: "Trivial 1", tone: "ember", sub: "chase scene",
    text: ["Ask how each PC reacts, then let them roll initiative with a fitting skill. The drone acts first every round and moves one obstacle; the party gains <b>2</b> Chase Points on a critical success, <b>1</b> on a success, and loses <b>1</b> on a critical failure. Extra points don't carry over, but PCs who haven't acted yet can work on the next obstacle."],
    widget: "chase", ev: ["drone"], xp: ["chase", "caught"] },

  { key: "smog", tab: "ch1", eid: "4", title: "Smog Alert", tone: "rust", sub: "the foggy alley", levelFn: (t) => t.chase.outcome === "lost" ? "Moderate 1" : "Trivial 1",
    boxed: "This ramshackle hideout seems out of place in the otherwise orderly megaplex. A lean-to made of a heavy tarp and the roof of an old autobus is wedged between the back stoops of a computer repair shop and recycling center. Trash, stained clothing, and food remnants litter the narrow alley. A thin bedroll peeks out from behind the tarp. Ashes from old fires sit in a metal drum nearby, but the makeshift camp was deserted some time ago, and thick tendrils of milky fog are starting to creep in.",
    widget: "smog",
    checks: ["DC 14 Perception or DC 14 Survival: someone has lived here on and off for months, scavenging dumpsters and vending machines.",
      "Talked to (Diplomacy or Intimidation), the scamps call him “the man in the mask” — he bribed officials to keep their vent smoggy. DC 13 Society or DC 11 Striving Lore: he was lying; no bribe was ever needed."],
    treasure: "An old datapad with a wiped profile named “Z” — grainy images of the PCs, Tierny, and Ghellon — plus a commercial medpatch, microgoggles, and an infiltrator serum. If they caught the drone, it lies nearby: give them <b>Handout #2</b>.",
    ev: ["datapad", "drone"], xp: ["f_smog", "camp"] },

  { key: "case", tab: "ch1", eid: "5", title: "Getting on the Case", tone: "muted", sub: "between scenes",
    text: ["The authorities (a long wait for Prudent-Decision) say Tierny hasn't been reported missing and is probably at work or at their charging platform. They want the PCs to “report an error” first.",
      "Back at Analog, Ghellon confirms the visiting professor often wore a mask, and points them at Tierny's charging platform."],
    checks: ["Anacite habits: DC 10 Aballon Lore or DC 10 Anacite Lore, or DC 12 Society to Recall Knowledge; DC 12 Diplomacy to Gather Information. Success: <b>Handout #3</b>. Critical success: also the nearest charging platform's location and layout, and a rumor that it's an eccentric neighborhood."] },

  { key: "platform", tab: "ch1", eid: "6", title: "Downgrid Charging Platform", tone: "slate", sub: "Tierny's cache",
    text: ["A 2,036-foot Y-shaped tower. The elevator warns organics that fullbright sun is dangerous — stepping onto a platform exposes them to it. Shalalamula lives here among her sculptures; she knows exactly where Tierny's cache is and is shocked to learn they're dead.",
      "The cache is a 4-foot opal plinth beside a deep well — and it has been sliced cleanly in half at an atomic level. An anacite links wirelessly; anyone else needs an adapter (5 credits from a street vendor) or a DC 13 Crafting check to rig their charger."],
    checks: ["Finding Tierny's cell among the statues: about an hour of Searching with a comm unit. DC 14 Mining Lore or DC 16 Crafting: the “petrified trees” are carved amethyst and jade.",
      "DC 15 Computers to Hack the console. A critical failure locks it out for 10 minutes.",
      "Memory storage: DC 14 Computers decodes the encrypted file — <b>Handout #4</b>. On a failure they can download it and retry in 24 hours.",
      "Object storage: two DC 15 Thievery checks, or the open command from memory storage. Tierny's chassis is curled inside, clutching a folded note — <b>Handout #5</b>.",
      "The body: DC 14 Medicine or DC 14 Perception spots a near-invisible surgical wound. DC 14 Arcana, DC 14 Occultism, or DC 14 Religion to Identify Magic: <b>slice reality</b>.",
      "The flora: DC 15 Nature or DC 13 Life Science Lore — all native to the Ice Wells. The well drops 20 feet into the city's maintenance tunnels."],
    treasure: "A commercial null space chamber: 2 cellular stimulant spell amps, a chemalyzer, 2 commercial smoke grenades, a commercial irising shield, commercial carbon skin with a darkvision visor, an antiquated theremin shock pad, an akashic download spell gem (1st rank), a breaching gun, and a commercial starfall pistol with silencer and battery. Plus 50 credits for each PC.",
    ev: ["slice"], xp: ["cache"] },

  { key: "stalker", tab: "ch1", eid: "7", title: "Stalker in the Shadows", level: "Moderate 1", tone: "rust", sub: "after they search, or call for help",
    boxed: "A booming voice echoes, bouncing off the statues in a melodious disharmony. The voice is accompanied by strange static: “You have no idea what you're involved with. Thus, I give you a final chance. Stay out of it!”",
    text: ["Four staticky projections of a masked, hooded figure surround the party — Agent Z, from very slightly parallel realities. Two wingbots, hacked by Prime-Facilitator to record the fight, screen them and fight until destroyed. Shalalamula hides, then offers healing afterward. Uses one side of the Flip-Mat."],
    widget: "dupes", foes: "stalker",
    checks: ["After: DC 14 Survival to Track finds old footprints down the well, but the trail splits into a half-dozen tunnels. The stalker is long gone."],
    note: "<b>Concluding Chapter 1.</b> A cliffhanger — a good place to end the session.",
    xp: ["glimpse", "f_stalker"] },

  /* ============================== CHAPTER 2 ============================== */
  { key: "seekers", tab: "city", title: "Seekers in Striving", tone: "plum", sub: "how the chapter runs",
    text: ["The PCs can visit these locations in any order, over several days. Stuck parties get nudged toward Insight Array's Processor in Central Circuit — where the authorities also send them.",
      "Prime-Facilitator is the hidden enemy: they bury the PCs in mundane shifts and steer them into lethal “special jobs.” Drop those in when the pace sags. At the end of the chapter, Prime-Facilitator frames them for the relic's theft.",
      "To rest: Shalalamula lets them camp among her sculptures, or Ghellon finds them a one-room apartment near Analog."],
    checks: ["<b>The Insight Array app.</b> +2 item bonus to Recall Knowledge about Aballon and anacites, Piloting or Survival to get around, and Society to Decipher Writing on Aballon. Give the first PC to download it <b>Handout #11</b>. Refusing escalates from notices to drones to video calls to escorted visits — all “standard protocol.”",
      "<b>Work.</b> Jobs are assigned by trained skill: Computers (data analysts), Athletics or Crafting (technicians), Diplomacy or Deception (event planning), Medicine or Performance (hospital), Arcana, Academia Lore, or Occultism (Polytechnica researchers), Religion (Theology Channel), Intimidation, Piloting, or Warfare Lore (Firewall guards). Two 4-hour shifts a week, 20 credits a shift."] },

  { key: "poly", tab: "city", title: "Striving Polytechnica", tone: "slate", sub: "Central Archives",
    checks: ["DC 13 Computers or DC 13 Diplomacy to Gather Information: Tierny worked at Central Archives with an assistant nicknamed Eruco.",
      "Restricted areas: befriend a worker (such as Eruco), or DC 18 Computers to Hack in for much the same information.",
      "Vending services: eat something and succeed at DC 12 Diplomacy or DC 12 Perception to hear “The Prof” acted erratically before leaving for deepsync.",
      "No record of Zirem or any Prelurian professor exists. DC 13 Computers: the records were expertly tampered with. Critical success: an inside job, by someone with very strong credentials."],
    text: ["<b>Eruco</b> (Erudite-Collaborator) is truthful and wants to help. Tierny talked about the First Ones and the Akiton wreck, then about a stalker. After a foiled break-in, they had the “transistor” relic moved to <b>Archive 404</b>, with two others filed as “orb” and “piston.” The next day Tierny entered deepsync and never came back. Eruco urges them to start the Archive 404 clearance now — it takes time.",
      "Eruco also names <b>Vazylyza</b>, who kept trying to buy First Ones relics from Tierny and reportedly won one in a bet. She gambles at <b>Magenta</b>.",
      "<b>The clinic.</b> Peppup (ysoki nurse) diagnoses and treats conditions at half price, or free for the broke, and offers half-price augmentations (up to 2nd level) as a teaching case."],
    treasure: "DC 14 Perception in the courtyard: a moved stone hides a vending pass with 3 credits. Unlimited vending food and drink; each credit buys any common level 0–1 magic or tech item worth up to 100 credits." },

  { key: "processor", tab: "city", title: "Processor", tone: "plum", sub: "Central Circuit",
    text: ["<b>Hesop</b> (anxious lashunta bureaucrat) intercepts them, apologizes that Processor isn't open to tours, and walks them through downloading the app. On the case, he shares <b>Handout #6</b>. Foul play would go to the Machine Court, which they can't contact unless called. Polite → friendly; DC 13 to help him with his coworkers → helpful (+1 circumstance to one Computers or Thievery check per day).",
      "<b>Prime-Facilitator</b> oversees this facility. The first time the PCs look them up, give them <b>Handout #12</b>."],
    danger: "A critically failed Hack, harming a worker, or damaging equipment sets off the alarm: two anacite protectors arrive in 1 minute to remove or subdue the threat.",
    foes: "protectors",
    xp: ["hesop"] },

  { key: "queries", tab: "city", title: "The Professor's Queries", tone: "slate", sub: "at Processor",
    checks: ["DC 16 Computers to search the transcripts, or get Hesop to Helpful. <b>Handout #7</b>: biometric lock malfunction, Polytechnica security protocols, Preluria, the Akiton wreck — and searches for “Vazylyza” and “Zirem.”",
      "Preluria: trained in Piloting Lore or Society knows it's in Near Space; DC 14 to Recall Knowledge — a feuding gas giant of moons and mercenaries.",
      "The Akiton wreck: DC 12 Computers or DC 12 Diplomacy to Gather Information — salvage has reached Aballon, and Polytechnica is studying it.",
      "Vazylyza's socials: hours of scrolling, or DC 14 Computers — she collects pre-Gap tech relics, sourced from auctions or “from a friend.” “Zirem” is a dead end."],
    ev: ["queries"], xp: ["queries"] },

  { key: "parade", tab: "city", title: "Parade of Faiths", level: "Low 1", tone: "ember", sub: "special job · Handout #15",
    text: ["Each PC attempts a DC 14 check with a skill from their work assignment to prepare the festival; those who fail take −2 to initiative when three mechanizer saboteurs attack the procession 20 minutes later. No authorities come — Prime-Facilitator sent them to the wrong place. The mechanizers think the PCs are their targets; they fight hard and don't surrender."],
    widget: "crowd", foes: "parade",
    checks: ["A captured mechanizer and DC 15 Intimidation, or DC 13 Computers to Hack their comm units: a “special” message from the Singularity named each PC as the true target.",
      "The anacite protectors arrive far too late. DC 15 Diplomacy: a “rare glitch” sent them ten blocks away."],
    ev: ["briefing", "glitch"], xp: ["crowd", "dispersed", "f_parade"] },

  { key: "memorial", tab: "city", title: "Memorial for a Soulless Machine", tone: "plum", sub: "Theology Channel",
    text: ["A shimmering holo of Tierny waves at passersby above a carved niche; food, trinkets, and UPBs pile up below."],
    checks: ["DC 15 Diplomacy or DC 15 Religion, or DC 13 Engineering Lore, Anacite Lore, or Aballon Lore: <b>Handout #8</b>. Anacites don't hold memorials.",
      "A ysoki PC, or DC 14 Society: leaving gifts is a ysoki custom, from Lao Shu Po.",
      "DC 14 Perception or detect magic: a chain of chunky plastic beads. DC 13 Arcana: consecrated datapad keycaps. DC 14 Religion: Eloritu's symbols. A note reads “Sorry” in spidery handwriting."] },

  { key: "apothecary", tab: "city", title: "Hidden Truth Apothecary", tone: "moss", sub: "Eloritu's shrine",
    text: ["<b>Remena</b> (kasatha herbalist-priest) confirms she blessed the keycaps a few days ago for a practitioner who kept his face covered, had a service drone, and was staying out in the wilderness. She thinks the anacite's death hit him hard."],
    treasure: "Help at the shrine for a day — DC 15 Chemistry Lore, DC 15 Medicine, DC 15 Nature, or DC 15 Religion. First success: a low-level commercial healing item. Second: a programmer's plushie, a purple squox with an Eloritu symbol.",
    ev: ["keycaps"], xp: ["remena"] },

  { key: "pest", tab: "city", title: "Pest Control", level: "Low 1", tone: "rust", sub: "special job · Handout #16",
    text: ["Travel outside Firewall is restricted; Insight Array sends the PCs to an abandoned mall a block outside to deal with “dangerous fauna.” Its security went offline years ago — Prime-Facilitator hopes they disappear there. Three young sharpwings dive from cover, swipe, and retreat."],
    checks: ["DC 14 Nature on the satellite images: a sharpwing, and they can Recall Knowledge. A critical failure calls it a local cryptid."],
    foes: "pest",
    treasure: "An autoCPR unit, a commercial hacking toolkit, a commercial repair toolkit, and a reusable grenade shell.",
    xp: ["f_pest"] },

  { key: "magenta", tab: "city", title: "Magenta", tone: "plum", sub: "the orbital casino",
    text: ["Vazylyza holds a private booth in the VIP lounge and won't acknowledge anyone who doesn't impress her. Enaria and Bebubelu lounge nearby; both can get the PCs a meeting, and both remember the night a human in fancy, forgettable clothes picked a fight with Vazylyza — and that the vids never caught him.",
      "<b>Lucky Compilation of Numbers</b> (an SRO gambler) turns up for anyone gathering rumors or gambling. After a few hands, Lucky admits Vazylyza conned them into betting relics from their old job, and confirms the stranger's threat.",
      "<b>Vazylyza</b> can prove where she was every minute. A week ago the stranger nodded at her with a crooked smile and left a mechanical flower and a note — “Sorry,” in the memorial's handwriting. Security footage of him is always missing or “restricted.”"],
    checks: ["High roller: a bid of at least 100 credits. Without cards, a DC 18 flat check — success wins back the bid plus 100; failure loses it all.",
      "Thrill seeker: beat her at her own game — DC 16 Deception or DC 16 Gambling Lore.",
      "Bebubelu: DC 15 Diplomacy, or DC 14 Perception to recognize an Analog regular (+1 for visiting Analog, +3 for staying there).",
      "Enaria: DC 16 Deception or DC 16 Stealth past the bodyguards, then DC 14 Intimidation or DC 15 Society.",
      "The flower is junk: DC 16 Crafting or DC 16 Society, or DC 14 First Ones Lore."],
    danger: "Vazylyza won't fight; she surrenders and dies under sustained fire. Violence brings anacite protectors in 1d6+1 minutes — and the Machine Court.",
    ev: ["footage"], xp: ["magenta", "tamper"] },

  /* ============================== ARCHIVE / TRIAL ======================== */
  { key: "entry", tab: "archive", title: "All Too Easy", tone: "ember", sub: "getting into Archive 404",
    text: ["Prime-Facilitator wants them in. Four successes get them through the door (a critical success counts as two). If they haven't got four by the time each PC has tried twice, they get in anyway — but nobody gets the check to notice something is off."],
    widget: "entry", ev: ["off"] },

  { key: "search", tab: "archive", title: "Searching the Archive", level: "Moderate 1", tone: "rust", sub: "Archivist 404",
    text: ["Archivist 404 is a VI living in the hardlight projector, on high alert thanks to Prime-Facilitator — it attacks even if they have permission. Its cameras (DC 15 Perception to notice) see the whole complex. Two hardlight dragonets fight until destroyed or until the Archivist is disabled."],
    widget: "archive", foes: "archive",
    checks: ["<b>Intruder Alert!</b> When it detects them: 1d6 fire to every non-hardlight creature, DC 15 basic Reflex, then it rolls initiative.",
      "Projector AC 14, Hardness 2, HP 24 (BT 12). Every 6 hours a backup restores the Archivist if it's disabled."],
    note: "Disabled, the Archivist apologizes and helps. The display is easy to find — and empty. It was in this morning's inventory, nothing tripped, and the only visitors were the PCs. When they work that out or try to leave: <b>Framed!</b>",
    xp: ["f_archive"] },

  { key: "framed", tab: "archive", title: "Framed!", tone: "plum", sub: "the case turns",
    boxed: "Flashing lights, insistent angry beeping, and frantic clicking of metal shutters fill the senses as a wave of security drones and camera-toting crews engulf the premises. An alarm blares somewhere nearby and suddenly there's shattered glass on the floor as the display case bursts apart. The buzz of magic creeps along the skin like a shiver and disappears, leaving only the clamoring security drones forcing themselves between the suspects and the presumed crime scene.",
    widget: "framed",
    text: ["Detect magic, or anyone trained in Arcana or Occultism, recognizes reality-warping magic did this. Elite protectors escort them out. Whatever they suspect, Hesop finds sketchy logs on Prime-Facilitator's terminal, warns them someone inside is framing them, and offers to represent them."] },

  { key: "pretrial", tab: "archive", title: "Before the Trial", tone: "slate", sub: "seven days",
    text: ["Wingbots and anacite protectors escort them everywhere and use nonlethal force against escape. Without local friends, a −2 circumstance penalty applies to most social checks."],
    checks: ["Back at Archive 404: DC 14 Life Science Lore, DC 14 Perception, or DC 14 Survival — the fingerprints and fibers aren't theirs."],
    ev: ["scene"] },

  { key: "trial", tab: "archive", title: "Machine Court's Judgment", tone: "gold", sub: "the trial",
    text: ["Prime-Facilitator leads the prosecution with obviously falsified recordings. The PCs argue their own case, or Hesop or a friendly NPC stands in. Accuse Prime-Facilitator and the anacites stop translating — rapid Trinary about “the task” versus “the units.” Insight Array will deal with Prime-Facilitator, outside this adventure."],
    widget: "trial",
    xp: ["trial", "innocent"] },

  { key: "deadend", tab: "archive", title: "Dead End?", level: "Moderate 1", tone: "rust", sub: "back where it began",
    text: ["Soon after the trial, <b>Handout #9</b> sends them back to the foggy alley. The scamps are gone; two cyberwings wait in the shadows and play Agent Z's recording — <b>Handout #10</b> — until Prime-Facilitator hacks them mid-sentence. They fight to the death.",
      "With the cyberwings down, the trail leads to the Teardrop Ice Well."],
    checks: ["DC 13 Nature or DC 11 Life Science Lore: modified sharpwings, from the Ice Wells."],
    foes: "deadend", xp: ["f_deadend"] },

  /* ============================== CHAPTER 3 ============================== */
  { key: "journey", tab: "well", title: "Getting There", tone: "slate", sub: "northeast of Striving",
    text: ["A private shuttle takes 45 minutes — a VIP or a well-connected bartender can arrange one. Otherwise 3 hours by vehicle or a day on foot.",
      "Outside Striving the air is thin. Unacclimated creatures are fatigued after a few hours, and at the end of each day attempt a DC 14 Fortitude save. Three consecutive successes acclimate them (a critical success counts as two). Breathing magic or tech suppresses the fatigue but doesn't help acclimate."],
    widget: "acclim",
    note: "The PCs should reach 2nd level at or slightly before the end of this chapter. The book suggests adjusting the last fights if they'll be too easy for 2nd-level characters." },

  { key: "lookout", tab: "well", title: "Frost Lookout", tone: "moss", sub: "base camp · Handout #13",
    boxed: "A precarious ramp with no railing hugs the dull blue ice shaft as it winds down into the pit, offering dizzying views of radial layers of frost-crusted greenery spiraling down into darkness. Frigid wind whistles up from the deep, carrying the odor of slow decay and fragrant wood. Most expeditions into the Ice Well meet here, and a few scattered tents and firepits surround the outskirts of the largest structure in the area — a cabin that looks like it's made of petrified wood.",
    text: ["<b>Spring Frost</b> expects them — cookies, hot spice tea, and a lot to say about the zones and the worsening jinsul presence. Of Zirem he knows only that he's an offworld explorer who visits the Ice Wells between stays in Striving.",
      "<b>Shop:</b> climbing kits, camping kits, cable line, rations, and common tech up to level 2; special orders arrive by drone in a day. <b>Guide:</b> 50 credits a day — a pacifist (Nature +8, Perception +6, Survival +6); with him they needn't Subsist.",
      "<b>Earning income:</b> Ghellon, Enaria, and Remena buy wild ingredients (secret Nature, Survival, or Life Science Lore check). The first critical failure ends Ghellon's orders — and Enaria declares the poison the next Nightarch fad."],
    treasure: "A homemade kit for each PC: an edible-plants guide (+2 item bonus to identify, harvest, or Recall Knowledge about Ice Well plants and fungus), trail mix (3 days of rations), explorer's bandages (2 commercial medpatches), and an air bubble spell gem." },

  { key: "daydelve", tab: "well", title: "Day Delve", tone: "moss", sub: "frost tundra",
    boxed: "Silvery grass grows thick beneath gnarled trees with drooping canopies of blue and white flowers, some of which have ripened into sweet berries. Icy waterfalls sparkle along the cavern walls, trickling into shallow pools full of mossy stones.",
    text: ["Each PC makes one check per obstacle. They make progress regardless; the results decide what they find and what finds them. Each obstacle can be hours or days."],
    obstacles: ["dd_leads", "dd_pack", "dd_drop"], widget: "tame",
    xp: ["f_pack", "canopy"] },

  { key: "canopy", tab: "well", title: "Canopy", tone: "moss", sub: "the frosty rainforest",
    text: ["Tiered cliffs of rainforest slope down toward the bottom of the Ice Well. The atmosphere is normal from here down."],
    obstacles: ["cn_wings", "cn_walls", "cn_leads"],
    xp: ["f_swoop", "goodbye"] },

  { key: "goodbye", tab: "well", title: "Last Goodbye", tone: "plum", sub: "the hidden door",
    boxed: "Biting wind howls over the precipice of this steep cliff — a ledge of jagged rock is the only barrier to the abyss below. A few yards from the ledge, sheltered by some thorny shrubs with sweet blue berries, a gentler slope is partly obscured behind a boulder painted with a strange symbol.",
    obstacles: ["lg_truth"], widget: "puzzle",
    note: "Failing here mustn't stall the game: let them go on to the Gloaming, or retry with a cost — less loot in the hideout, or sharpwings attacking while they work." },

  { key: "hideout", tab: "well", title: "Murderer's Hideout", tone: "ember", sub: "Agent Z's bunker",
    boxed: "A door opens in the rock. Smooth, marble steps completely out of place inside the ice-rimed rock pit — almost as if they were ripped from another world — descend 20 feet to a frigid hallway of bare gray stone. A heavy airlock door hangs open, leading to a one-room survival bunker.",
    treasure: "Canned rations and water, a chemalyzer, an explorer's canteen, a tactical hypopen, 4 medpatches, and an emergency beacon. A commercial laser pistol in pieces on the card table (DC 13 Crafting to reassemble), and a commercial plasma sword with a stylized Z on the hilt.",
    text: ["<b>The transistor relic</b> is in a null space chamber behind a mattress, under vintage racing magazines — <b>Handout #17</b>. They can't use it; they may return it to the university, the authorities, or even Agent Z.",
      "<b>The laptop</b> holds Agent Z's thesis — the First Ones mean to use this reality as fuel — his signed confession, the memorial he made out of guilt, plans of Archive 404, files on each PC, and logs with an inside source in Central Circuit. It exonerates the PCs and implicates Prime-Facilitator. Its security feed shows jinsul raiders breaking the electrified door."],
    checks: ["The laptop: DC 15 Computers to Hack (they can retry, or get help) — <b>Handouts #18 and #19</b>.",
      "DC 15 Perception or detect magic: a pebble-sized device on a ceiling pipe. DC 17 Society or DC 14 Scoured Stars Lore: jinsul-made. DC 14 Crafting or DC 14 Computers: a live bug. DC 16 Arcana or DC 16 Computers traces it to Abaddon Fields and the wreck."],
    xp: ["relic", "laptop", "bug"] },

  { key: "where", tab: "well", title: "Where's the Murderer?", tone: "rust", sub: "the live feed",
    text: ["A hacked wingbot pings the laptop with a live feed: the masked figure, clutching their side, blasts back one six-limbed bladed alien — then two more reach him. He kneels with a blade on either side of his neck. The location is a zone down, in the Gloaming.",
      "<b>What do you do?</b> Rescue the murderer and end the cycle of violence, take revenge, or leave him to his fate and deal with the jinsuls for their own reasons. Let the table argue it out — in and out of character. Don't rush it. The bunker makes a fine new base, but his fate hangs on how long they take."] },

  { key: "gloaming", tab: "fields", title: "The Gloaming", level: "Moderate 1", tone: "plum", sub: "a few hours through the dark",
    text: ["A deep fungal understory: 6 hours of dim light a day, 6 of total darkness. Light sources work at half range and brightness, and darkvision sees half as far."],
    obstacles: ["gl_gloom"], widget: "dew", foes: "gloaming",
    checks: ["<b>Detect Prey</b> (within 60 feet): DC 15 Will, or spend the next action moving toward it (two actions on a critical failure).",
      "<b>Vine snatch</b> +9, reach 30 feet, 1d6+3 slashing plus rancid grip — grabbed until it Escapes (DC 17), 1d6+3 poison at the end of each of its turns. <b>Thorn dart</b> answers any attack: 1d4 piercing, DC 17 basic Reflex.",
      "Killing it: DC 12 Nature or DC 12 Survival to judge the damage to the ecosystem — though it has killed explorers before."],
    treasure: "A ruined backpack with an orange kerchief: a Strawberry Machine Cake thermos (empty), soggy rations, a flashlight, a commercial glow up spell amp, a tactical medpatch, a glamer projector, and the comm unit of Jeotanni, a pahtra explorer — <b>Handout #20</b> if they look her up.",
    xp: ["f_gloaming"] },

  { key: "abaddon", tab: "fields", title: "Abaddon Fields", tone: "slate", sub: "the bottom of the well",
    text: ["A mile of dark, severely cold ice fields where satellite imaging can't reach. Jinsuls stranded here in the Drift Crisis exterminated the ecosystem in days to build a covert outpost. The Xenowardens will reward driving them out, at your discretion. Asking about jinsuls: <b>Handout #14</b>.",
      "Jinsuls are fanatics who can't be bargained with — they might surrender only if they keep their dignity and freedom."],
    checks: ["DC 13 Aballon Lore, DC 13 History Lore, or DC 13 Scoured Stars Lore: the name was once an ironic joke, given to the cenote's most beautiful depths."],
    obstacles: ["af_outpost"] },

  { key: "wreck", tab: "fields", title: "Wreck of the Condemned Prophet", level: "Moderate 1", tone: "rust", sub: "Ice Wells side of the Flip-Mat",
    boxed: "The broken hull of a dark gray, angular fighter craft juts out of the Ice Well's rocky side. It's sheared nearly in half and scorched by fire, but part of its hull is still intact. It's shackled to the cliff face with articulated metal chains and peculiar purple symbols blaze in the air above the wreck.",
    text: ["Climbing the perma-ice cliff needs DC 20 Athletics without gear. Speeds (including Climb) double on the ice; anyone who travels at that speed attempts DC 13 Reflex at the end of the round — off-guard for a round on a failure, prone on a critical failure. The jinsuls always take the speed.",
      "Two jinsul lookouts attack on sight and fight to the death. Warlord Hura works the cannon from inside."],
    widget: "cannon", foes: "wreck",
    xp: ["f_wreck"] },

  { key: "parting", tab: "fields", title: "Parting Shots", level: "Moderate 1", tone: "rust", sub: "inside the wreck",
    text: ["Hura and the guards hunker down for at least 10 minutes — time to rest and recover Focus Points. They restart the cannon if it wasn't destroyed, or repair it if the PCs leave.",
      "Prime-Facilitator tipped the jinsuls off. They want Agent Z alive to learn the relic, and they know the PCs are here from the bug. They taunt the PCs with him if they bargain, but never release him. Combat comes as soon as the PCs threaten or look like leaving; the jinsuls fight to the death."],
    foes: "parting", xp: ["f_parting"] },

  { key: "agentz", tab: "fields", title: "Meet the Murderer", tone: "gold", sub: "Agent Z",
    boxed: "“What next? Got a minute to hear my side of the story?”",
    text: ["He slips his restraints as the battle ends and limps out, bloodied but triumphant. He confesses and apologizes. He never meant to kill Tierny; he thought the relic was in the cache. He begs them to destroy it, or let him take it far from the machines built to activate it — especially from Prime-Facilitator, “who I foolishly underestimated and who will stop at nothing to use the device.”",
      "Talked down, he'll try to <b>deactivate</b> it without destroying it: a Diplomacy check to convince him, or an Arcana or Crafting check to help with the ritual. One success and he succeeds; fail both and it's destroyed.",
      "Attacked, he fights to the bitter end, even weakened."],
    widget: "agentz", foes: "agentz",
    note: "The book prints no DC for the deactivation checks. DC 15 (the level-1 DC on the inside cover) is this console's suggestion, not the book's.",
    xp: ["meetz", "f_agentz"] },

  { key: "ending", tab: "fields", title: "Conclusion", tone: "moss", sub: "the relic's fate",
    widget: "fate",
    text: ["Solving the death of a beloved community figure brings renown and reward. Level the PCs to 2nd if they haven't already. Onward: Aballon as freelance investigators, Tierny's research, or Akiton and the Wreck of the Returned — <i>Starfinder Society Scenario #1-01: Invasion's Edge</i>."] }
];

const FATES = {
  returned: { label: "Returned, untampered", tone: "rust",
    text: "Other anacites take up Tierny's task and crack the activation code. Months later they switch it on — and summon godlike dimension-hopping entities who drain this reality and move on as it collapses. Somewhere else, a different Agent Z tries again." },
  deactivated: { label: "Deactivated", tone: "moss",
    text: "A First Ones incursion is prevented. For now, the PCs, their loved ones, and their entire existence are safe." },
  destroyed: { label: "Destroyed", tone: "moss",
    text: "A First Ones incursion is prevented. For now, the PCs, their loved ones, and their entire existence are safe." },
  hidden: { label: "Kept hidden", tone: "slate",
    text: "A First Ones incursion is prevented — for as long as it stays hidden." }
};
const AGENT_Z = [
  ["deactivated", "Talked down — deactivated"],
  ["destroyed", "Helped him destroy it"],
  ["fought", "Fought him"],
  ["spared", "Let him go"],
  ["court", "Brought to the Machine Court"]
];

/* ------------------------------------------------------------------ state */
const DEGREES = [["cs", "Crit"], ["s", "Success"], ["f", "Fail"], ["cf", "Crit fail"]];

function blankState(pcs) {
  return {
    v: 1, tab: "ch1", pcs,
    done: {},          // card key -> true
    evidence: {},      // evidence key -> true
    handouts: {},      // number -> true
    xp: {},            // award key -> XP granted (stored, so it reverses exactly)
    /* Each round is an ordered list of { pc, d }. Positions are replayed from
       this, so un-ticking any result rewinds the chase exactly. */
    chase: { rounds: [[]], ended: false, override: null },
    pump: false,
    dupes: [false, false, false, false],
    tracks: { archive: 0, entry: 0, puzzle: 0, dew: 0, cannon: 0, defense: 0, crowd: 0 },
    approach: null,    // "intrigue" | "infiltration"
    trial: { verdict: null },
    obst: {},          // obstacle key -> "pass" | "fail"
    tamed: false,
    acclim: {},        // pc index -> consecutive successes
    agentz: null,
    fate: null,
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
  for (const u of game.users) { if (!u.isGM) add(u.character); }
  for (const a of game.actors) {
    if (seen.size >= MAX_PCS) break;
    if (a.hasPlayerOwner && (a.type === "character" || a.type === "PC")) add(a);
  }
  const list = [...seen.values()].slice(0, MAX_PCS);
  while (list.length < 4) list.push({ name: `PC ${list.length + 1}`, actorId: "", img: "icons/svg/mystery-man.svg" });
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
  if (!game.settings.settings.has(MMC_ID)) {
    game.settings.register(MMC_NS, MMC_KEY, { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cardFor = (key) => CARDS.find(c => c.key === key);
const awardFor = (key) => AWARDS.find(a => a.key === key);

/* ----------------------------------------------------------------- engine */
class MetalCity {
  constructor(state) { this.state = state; this.actorCache = new Map(); }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(MMC_NS, MMC_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  toggleDone(key) { this.s.done[key] = !this.s.done[key]; if (!this.s.done[key]) delete this.s.done[key]; this.touch(); }
  toggleEvidence(key) {
    if (this.s.evidence[key]) delete this.s.evidence[key]; else this.s.evidence[key] = true;
    const n = this.evidenceCount;
    if (this.s.evidence[key] && n === EVIDENCE_NEEDED) ui.notifications.info(`${n} pieces of evidence — enough to satisfy the Machine Court.`);
    this.touch();
  }
  get evidenceCount() { return EVIDENCE.filter(e => this.s.evidence[e.key]).length; }
  toggleHandout(n) { if (this.s.handouts[n]) delete this.s.handouts[n]; else this.s.handouts[n] = true; this.touch(); }

  /* ----- the XP ledger ----- */
  get xpTotal() { return Object.values(this.s.xp).reduce((n, v) => n + (Number(v) || 0), 0); }
  get level() { return this.xpTotal >= LEVEL_AT ? 2 : 1; }
  awardValue(a) { return a.foes ? encounterXp(a.foes(this), this.level) : a.xp; }
  awardGate(a) { return a.gate ? a.gate(this) : null; }
  toggleXp(key) {
    const a = awardFor(key);
    if (!a) return;
    const before = this.level;
    if (this.s.xp[key] != null) {
      delete this.s.xp[key];
    } else {
      const why = this.awardGate(a);
      if (why) return ui.notifications.warn(why);
      this.s.xp[key] = this.awardValue(a);
      this.log(`+${this.s.xp[key]} XP — ${a.label}.`);
    }
    if (before === 1 && this.level === 2) ui.notifications.info("1,000 XP — the party reaches 2nd level.");
    this.touch();
  }

  /* ----- the chase ----- */
  get chase() {
    const ch = this.s.chase, obs = CHASE.obstacles, last = obs.length - 1;
    let p = 0, cp = 0, caught = null;
    const cleared = [];
    ch.rounds.forEach((rd, r) => {
      const drone = Math.min(last, CHASE.droneStart + r + 1);
      for (const e of rd) {
        if (caught) break;
        cp = Math.max(0, cp + (CHASE.degrees[e.d] ?? 0));
        if (cp >= obs[p].cp) {
          cleared.push({ round: r + 1, obstacle: obs[p].name });
          p = Math.min(last, p + 1); cp = 0;
        }
        if (p >= drone) caught = r + 1;
      }
    });
    const round = ch.rounds.length;
    const drone = Math.min(last, CHASE.droneStart + round);
    let outcome = caught ? "caught" : ch.ended ? "lost" : "running";
    if (ch.override) outcome = ch.override;
    return { p, cp, need: obs[p].cp, round, drone, caught, cleared, outcome, final: drone >= last };
  }
  chaseResult(i, d) {
    if (this.chase.outcome !== "running") return ui.notifications.warn("The chase is over — undo a round or reset it to change results.");
    const rd = this.s.chase.rounds[this.s.chase.rounds.length - 1];
    const at = rd.findIndex(e => e.pc === i);
    if (at >= 0 && rd[at].d === d) rd.splice(at, 1);
    else if (at >= 0) rd[at].d = d;
    else rd.push({ pc: i, d });
    this.touch();
  }
  chaseNext() {
    const c = this.chase;
    if (c.outcome !== "running") return;
    if (c.final) {
      this.s.chase.ended = true;
      this.log("The drone reached the Flock of Drones.");
      ui.notifications.info("The drone reaches its pickup point — the chase is lost.");
    } else {
      this.s.chase.rounds.push([]);
    }
    this.touch();
  }
  chaseUndo() {
    const ch = this.s.chase;
    if (ch.ended) ch.ended = false;
    else if (ch.rounds.length > 1) ch.rounds.pop();
    else ch.rounds = [[]];
    this.touch();
  }
  chaseReset() { this.s.chase = { rounds: [[]], ended: false, override: null }; this.touch(); }
  chaseOverride(k) { this.s.chase.override = this.s.chase.override === k ? null : k; this.touch(); }

  /* ----- counters ----- */
  bump(track, n) {
    const T = TRACKS[track];
    const v = Math.max(0, Math.min(T.need, (this.s.tracks[track] ?? 0) + n));
    const was = this.s.tracks[track] ?? 0;
    this.s.tracks[track] = v;
    if (v >= T.need && was < T.need) {
      ui.notifications.info(`${T.name} — done.`);
      this.log(`${T.name}: ${T.need} successes.`);
    }
    this.touch();
  }
  toggleDupe(i) { this.s.dupes[i] = !this.s.dupes[i]; this.touch(); }
  setObst(key, v) { this.s.obst[key] = this.s.obst[key] === v ? undefined : v; if (!this.s.obst[key]) delete this.s.obst[key]; this.touch(); }
  choose(key, v) { this.s[key] = this.s[key] === v ? null : v; this.touch(); }
  toggleFlag(key) { this.s[key] = !this.s[key]; this.touch(); }
  setVerdict(v) { this.s.trial.verdict = this.s.trial.verdict === v ? null : v; this.touch(); }
  bumpAcclim(i, n) {
    if (n === 0) this.s.acclim[i] = 0;
    else this.s.acclim[i] = Math.min(3, (this.s.acclim[i] ?? 0) + n);
    if (this.s.acclim[i] >= 3) ui.notifications.info(`${this.s.pcs[i]?.name ?? "That PC"} is acclimated.`);
    this.touch();
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Murder in Metal City reset.");
    this.touch();
  }
  rescanPCs() { this.s.pcs = detectPCs(); this.touch(); }

  /* ----- chat and actors ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "slate") {
    const p = PALETTES.neon;
    const C = { ember: p.ember, moss: p.moss, slate: p.slate, plum: p.plum, gold: p.gold, rust: p.rust, muted: p.muted };
    await ChatMessage.create({
      content: `<div style="background:${p.card};color:${p.ink};border:1px solid ${p.line};border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.slate};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:${p.muted}">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "Murder in Metal City" }
    });
  }
  postBoxed(key, which = "boxed") {
    const c = cardFor(key);
    const text = c?.[which];
    if (!text) return ui.notifications.warn("Nothing to read aloud there.");
    return this.postCard("Murder in Metal City", c.title, `<p style="margin:0;font-style:italic">${text}</p>`, c.tone);
  }
  /* Players see the obstacle and how they might get past it — never the
     Chase Points it takes or where the drone is. */
  postObstacle() {
    const o = CHASE.obstacles[this.chase.p];
    return this.postCard("Downgrid Detour", o.name,
      `<p style="margin:0 0 6px;font-style:italic">${o.text}</p><p style="margin:0">${linkify(o.overcome)}</p>`, "ember");
  }
  postChecks(key) {
    const c = cardFor(key);
    if (!c?.checks) return;
    return this.postCard("Murder in Metal City", c.title,
      `<ul style="margin:0;padding-left:1.1em">${c.checks.map(x => `<li style="margin-bottom:4px">${linkify(x)}</li>`).join("")}</ul>`, c.tone);
  }
  postObstacleCheck(key) {
    const o = OBSTACLES[key];
    return this.postCard(o.where, o.name, `<p style="margin:0">${linkify(o.overcome)}</p>`, "moss");
  }

  /* Statblocks live in the compendiums. Look the actor up by name — this
     world first, then every Actor pack, preferring sf2e and Beginner Box ones. */
  async openActor(name) {
    const want = name.toLowerCase();
    let doc = this.actorCache.get(want) ?? game.actors.find(a => a.name.toLowerCase() === want);
    if (!doc) {
      const packs = [...game.packs].filter(p => p.documentName === "Actor");
      const rank = (p) => /metal|beginner|sf2e|starfinder/i.test(`${p.collection} ${p.metadata?.label}`) ? 0 : 1;
      packs.sort((a, b) => rank(a) - rank(b));
      for (const pack of packs) {
        const index = await pack.getIndex();
        const hit = index.find(e => e.name?.toLowerCase() === want);
        if (hit) { doc = await pack.getDocument(hit._id); break; }
      }
    }
    if (!doc) return ui.notifications.warn(`No actor named “${name}” in this world or its compendiums. Is the sf2e bestiary or the Beginner Box module enabled?`);
    this.actorCache.set(want, doc);
    doc.sheet?.render(true);
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class MMCApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "mmc-console", tag: "div", classes: ["mmc-console"],
    position: { width: 940, height: "auto" },
    window: { title: "Murder in Metal City", icon: "fa-solid fa-magnifying-glass", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "mmc-console", classes: ["mmc-console"], title: "Murder in Metal City",
      width: 940, height: "auto", resizable: true
    });
  }
  get title() { return "Murder in Metal City"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="mmc-root">${this.markup()}</div>`);
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
    const body = s.tab === "case" ? this.caseTab(ro)
      : CARDS.filter(c => c.tab === s.tab).map(c => this.card(c, ro)).join("");
    return `${this.styles()}
      <div class="mmc">
        ${this.header(ro)}
        <nav class="tabs">
          ${TABS.map(x => `<button type="button" class="tab ${s.tab === x.key ? "on" : ""}" style="--tt:var(--${x.tone})" data-act="tab" data-k="${x.key}">
            <b><i class="fa-solid ${x.icon}"></i> ${x.label}</b><small>${x.sub}</small></button>`).join("")}
        </nav>
        ${body}
      </div>`;
  }

  header(ro) {
    const t = this.t, s = t.s, c = t.chase, ev = t.evidenceCount;
    const lamp = (on, label, title, tone = "moss") =>
      `<span class="lamp ${on ? "lit" : ""}" style="--lt:var(--${tone})" title="${esc(title)}"><i class="fa-solid fa-circle"></i>${label}</span>`;
    const xp = t.xpTotal;
    return `
      <header class="topbar">
        <div class="lamps">
          ${lamp(c.outcome !== "running", c.outcome === "caught" ? "Drone caught" : c.outcome === "lost" ? "Drone lost" : "Chase",
            "Downgrid Detour — catching the drone means two scamps instead of four, the easier pump repair, and the drone as evidence",
            c.outcome === "lost" ? "rust" : "moss")}
          ${lamp(ev >= EVIDENCE_NEEDED, `Evidence ${ev}`, `${EVIDENCE_NEEDED} pieces satisfy the Machine Court outright`, "gold")}
          ${lamp(!!s.trial.verdict, s.trial.verdict === "guilty" ? "Guilty" : s.trial.verdict === "innocent" ? "Innocent" : "Trial",
            "The Machine Court's verdict", s.trial.verdict === "guilty" ? "rust" : "moss")}
          ${lamp(s.tamed, "Shroomclaw", "Fed the injured shroomclaw in Day Delve — the Gloaming's shroomclaws fight on their side")}
          ${lamp(s.xp.relic != null, "Relic", "Recovered the transistor relic from the hideout")}
        </div>
        <div class="xpbox" title="XP each — ${LEVEL_AT} for 2nd level">
          <span>XP each · level ${t.level}</span><b>${xp}</b>
        </div>
        <button type="button" class="say" data-act="rescan" title="Re-detect the party" ${ro ? "disabled" : ""}><i class="fa-solid fa-users"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset the adventure" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  /* ---------------------------------------------------------- generic card */
  card(c, ro) {
    const t = this.t, done = !!t.s.done[c.key];
    const level = c.levelFn ? c.levelFn(t) : c.level;
    return `
      <section class="panel ${done ? "done" : ""}" style="--tone:var(--${c.tone})">
        <h3>${c.eid ? `<span class="eid">${c.eid}</span>` : ""}${c.title}
          ${c.sub ? `<small>${c.sub}</small>` : ""}
          ${level ? `<span class="lvl">${level}</span>` : ""}
          ${c.boxed ? `<button type="button" class="say" data-act="postboxed" data-k="${c.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>` : ""}
        </h3>
        ${c.boxed ? `<p class="boxed">${c.boxed}</p>` : ""}
        ${c.boxed2 ? `<p class="boxed">${c.boxed2}
          <button type="button" class="say inline" data-act="postboxed2" data-k="${c.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button></p>` : ""}
        ${(c.text ?? []).map(x => `<p class="text">${x}</p>`).join("")}
        ${c.qa ? `<div class="qa">${c.qa.map(([q, a]) => `<p><b>${q}</b> “${a}”</p>`).join("")}</div>` : ""}
        ${c.foes ? this.foeRow(FOES[c.foes]) : ""}
        ${c.widget ? this[`w_${c.widget}`](ro) : ""}
        ${c.obstacles ? c.obstacles.map(k => this.obstacle(k, ro)).join("") : ""}
        ${c.checks ? `<div class="checkhead"><span class="subhead inline">Checks</span>
          <button type="button" class="say" data-act="postchecks" data-k="${c.key}" title="Post these checks to chat as rollable links"><i class="fa-solid fa-dice-d20"></i></button></div>
          <ul class="checks">${c.checks.map(x => `<li>${hl(x)}</li>`).join("")}</ul>` : ""}
        ${c.danger ? `<p class="danger">${c.danger}</p>` : ""}
        ${c.note ? `<p class="note">${c.note}</p>` : ""}
        ${c.treasure ? `<p class="loot"><b>Treasure</b> ${hl(c.treasure)}</p>` : ""}
        ${c.ev || c.xp ? `<div class="ticks">
          ${(c.ev ?? []).map(k => this.evTick(k, ro)).join("")}
          ${(c.xp ?? []).map(k => this.xpTick(k, ro)).join("")}
        </div>` : ""}
        <div class="btnrow end">
          <button type="button" class="${done ? "ghost" : "primary"} sm" data-act="done" data-k="${c.key}" ${ro ? "disabled" : ""}>
            ${done ? "Reopen" : "Mark done"}</button>
        </div>
      </section>`;
  }

  foeRow(list) {
    const pl = this.t.level;
    return `<div class="crew">
      ${list.map(c => `
        <button type="button" class="mon" data-act="actor" data-k="${esc(c.name)}" title="Open the ${c.hazard ? "hazard" : "creature"} — ${xpFor(c.level, pl)} XP each at party level ${pl}">
          <i class="fa-solid ${c.hazard ? "fa-triangle-exclamation" : "fa-skull"}"></i>${c.n > 1 ? `${c.n} × ` : ""}${c.name}
          <em>${c.hazard ? "hazard" : "creature"} ${c.level}</em>
        </button>`).join("")}
      <span class="foexp">${encounterXp(list, pl)} XP</span>
    </div>`;
  }

  evTick(key, ro) {
    const e = EVIDENCE.find(x => x.key === key), on = !!this.t.s.evidence[key];
    return `<button type="button" class="tick ev ${on ? "on" : ""}" data-act="ev" data-k="${key}" ${ro ? "disabled" : ""} title="Evidence Tracker">
      <i class="fa-solid ${on ? "fa-square-check" : "fa-square"}"></i> <span class="pip">evidence</span> ${e.label}</button>`;
  }
  xpTick(key, ro) {
    const t = this.t, a = awardFor(key), got = t.s.xp[key];
    const on = got != null;
    const why = on ? null : t.awardGate(a);
    const val = on ? got : t.awardValue(a);
    return `<button type="button" class="tick xp ${on ? "on" : ""} ${why ? "gated" : ""}" data-act="xp" data-k="${key}"
      ${ro || why ? "disabled" : ""} title="${esc(why ?? (on ? "Granted — click to take it back" : "Grant this award"))}">
      <i class="fa-solid ${on ? "fa-square-check" : "fa-square"}"></i> <span class="pip">${val} XP</span> ${a.label}</button>`;
  }

  counter(track, ro, label) {
    const T = TRACKS[track], v = this.t.s.tracks[track] ?? 0;
    const pips = Array.from({ length: T.need }, (_, i) => `<span class="pipdot ${i < v ? "on" : ""}"></span>`).join("");
    return `<div class="counter">
      ${label ? `<span class="clabel">${label}</span>` : ""}
      <button type="button" class="qbtn" data-act="bump" data-k="${track}" data-n="-1" ${ro || v === 0 ? "disabled" : ""}>−</button>
      <span class="pips">${pips}</span>
      <button type="button" class="qbtn" data-act="bump" data-k="${track}" data-n="1" ${ro || v >= T.need ? "disabled" : ""}>+1</button>
      <button type="button" class="qbtn wide" data-act="bump" data-k="${track}" data-n="2" ${ro || v >= T.need ? "disabled" : ""} title="A critical success counts as two">+2</button>
      <b>${v} of ${T.need}</b>
    </div>`;
  }

  obstacle(key, ro) {
    const o = OBSTACLES[key], v = this.t.s.obst[key];
    return `<div class="obst ${v ?? ""}">
      <div class="ohead"><span class="pip">obstacle 1</span> <b>${o.name}</b>
        <button type="button" class="say" data-act="postobst" data-k="${key}" title="Post the checks to chat"><i class="fa-solid fa-comment"></i></button></div>
      <p class="dcs sm">${hl(o.overcome)}</p>
      ${o.each ? `<p class="note">${hl(o.each)}</p>` : ""}
      <div class="btnrow">
        <button type="button" class="opt good ${v === "pass" ? "on" : ""}" data-act="obst" data-k="${key}" data-v="pass" ${ro ? "disabled" : ""}>Two succeeded, or a crit</button>
        <button type="button" class="opt bad ${v === "fail" ? "on" : ""}" data-act="obst" data-k="${key}" data-v="fail" ${ro ? "disabled" : ""}>Fewer than two</button>
      </div>
      ${v === "pass" ? `<p class="bonus">${hl(o.pass)}</p>` : ""}
      ${v === "fail" ? `<p class="danger">${hl(o.fail)}</p>${o.foes ? this.foeRow(FOES[o.foes]) : ""}` : ""}
    </div>`;
  }

  pcCell(pc) {
    return pc.actorId
      ? `<button type="button" class="cn" data-act="sheet" data-id="${pc.actorId}" title="Open ${esc(pc.name)}'s sheet">${esc(pc.name)}</button>`
      : `<span class="cn">${esc(pc.name)}</span>`;
  }

  /* -------------------------------------------------------------- widgets */
  w_chase(ro) {
    const t = this.t, c = t.chase, obs = CHASE.obstacles, o = obs[c.p];
    const rd = t.s.chase.rounds[t.s.chase.rounds.length - 1];
    const lane = obs.map((x, i) => {
      const cls = i < c.p ? "past" : i === c.p ? "here" : "";
      return `<div class="lanecell ${cls} ${i === c.drone ? "drone" : ""}" title="${esc(x.name)} — ${x.cp} Chase Points">
        <span class="lname">${x.name}</span>
        <span class="lmarks">${i === c.p ? `<i class="fa-solid fa-person-running" title="The party"></i>` : ""}${i === c.drone ? `<i class="fa-solid fa-satellite" title="The drone"></i>` : ""}</span>
        <span class="lcp">${i === c.p ? `${c.cp}/${x.cp}` : x.cp}</span>
      </div>`;
    }).join("");
    const status = c.outcome === "caught" ? `<p class="bonus">Caught it${c.caught ? ` in round ${c.caught}` : ""}. A shadowy figure in an alley reaches out to catch the drone like a falconer, sees them, and vanishes; the drone short-circuits and drops. On to Smog Alert — two scamps.</p>`
      : c.outcome === "lost" ? `<p class="danger">The drone reached its pickup point. The PCs still find the hideout, but the figure has collected the drone and left a nasty surprise — four scamps, and a worse pump.</p>`
      : c.final ? `<p class="note">Round ${c.round}: the drone is at the Flock of Drones. This is the PCs' last turn to catch up.</p>`
      : `<p class="note">Round ${c.round}: the drone is at <b>${obs[c.drone].name}</b>. Reach it to catch it.</p>`;
    return `<div class="widget">
      <div class="lane">${lane}</div>
      ${status}
      <div class="obsnow">
        <div class="ohead"><span class="pip">obstacle 1</span> <b>${o.name}</b> <span class="lvl">${o.cp} Chase Points</span>
          <button type="button" class="say" data-act="postchase" title="Post this obstacle to chat (no points, no drone position)"><i class="fa-solid fa-comment"></i></button></div>
        <p class="text">${o.text}</p>
        <p class="dcs sm">${hl(o.overcome)}</p>
        ${o.danger ? `<p class="danger">${o.danger}</p>` : ""}
        ${o.wait ? `<p class="note">${o.wait}</p>` : ""}
      </div>
      <div class="subhead">Round ${c.round} — results in turn order</div>
      <div class="pcrows">
        ${t.s.pcs.map((pc, i) => {
          const e = rd.find(x => x.pc === i);
          const order = e ? rd.indexOf(e) + 1 : null;
          return `<div class="pcrow">
            <img src="${esc(pc.img)}" alt="">
            ${this.pcCell(pc)}
            <span class="ord">${order ? `#${order}` : ""}</span>
            <div class="res">
              ${DEGREES.map(([d, label]) => `<button type="button" class="opt sm deg-${d} ${e?.d === d ? "on" : ""}" data-act="chase" data-i="${i}" data-k="${d}" ${ro || c.outcome !== "running" ? "disabled" : ""}>${label}</button>`).join("")}
              ${o.wait ? `<button type="button" class="opt sm deg-s ${e?.d === "wait" ? "on" : ""}" data-act="chase" data-i="${i}" data-k="wait" ${ro || c.outcome !== "running" ? "disabled" : ""} title="Wait out the signal: +1 CP, −2 on the Crowd">Wait</button>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
      ${c.cleared.length ? `<p class="hint">Cleared: ${c.cleared.map(x => `${x.obstacle} (r${x.round})`).join(" · ")}</p>` : ""}
      <div class="btnrow">
        <button type="button" class="primary" data-act="chasenext" ${ro || c.outcome !== "running" ? "disabled" : ""}>
          ${c.final ? "End of round — the drone gets away" : "Next round — the drone moves"}</button>
        <button type="button" class="ghost" data-act="chaseundo" ${ro || (c.round <= 1 && !t.s.chase.ended && !rd.length) ? "disabled" : ""}>Undo round</button>
        <button type="button" class="ghost" data-act="chasereset" ${ro ? "disabled" : ""}>Reset</button>
        <span class="spacer"></span>
        <span class="subhead inline">Override</span>
        <button type="button" class="opt sm good ${t.s.chase.override === "caught" ? "on" : ""}" data-act="chaseover" data-k="caught" ${ro ? "disabled" : ""}>Caught</button>
        <button type="button" class="opt sm bad ${t.s.chase.override === "lost" ? "on" : ""}" data-act="chaseover" data-k="lost" ${ro ? "disabled" : ""}>Lost</button>
      </div>
    </div>`;
  }

  w_smog(ro) {
    const t = this.t, lost = t.chase.outcome === "lost";
    return `<div class="widget">
      ${this.foeRow(lost ? FOES.smog4 : FOES.smog2)}
      <p class="text">${lost ? "The figure had time to rile the scamps up against the PCs: <b>four</b> scamps." : "The figure broke the pump and fled: <b>two</b> scamps."}
        They pop out of hiding, use Filthy Fog on as many PCs as they can, then fly by easy targets. The last one surrenders at 3 HP or fewer.</p>
      <p class="text"><b>Broken air pump.</b> −4 circumstance to visual Perception, initiative included; scamps ignore it and have lesser cover in the fog.
        Adjacent, 2 actions: ${hl(`DC ${lost ? 16 : 14} Crafting`)} to repair it — the smog clears a round later.</p>
      <div class="btnrow">
        <button type="button" class="opt ${t.s.pump ? "on" : ""}" data-act="flag" data-k="pump" ${ro ? "disabled" : ""}>
          <i class="fa-solid fa-wrench"></i> ${t.s.pump ? "Pump repaired" : "Pump still leaking"}</button>
      </div>
    </div>`;
  }

  w_dupes(ro) {
    const t = this.t, gone = t.s.dupes.filter(Boolean).length, actions = Math.max(0, 4 - gone);
    return `<div class="widget hazard ${actions === 0 ? "done" : ""}">
      <div class="ohead"><span class="pip">hazard 1</span> <b>Shadowy Duplicates</b> <span class="pip">complex · magical</span></div>
      <p class="text"><b>Quantum Field</b> as they appear: a 30-foot burst of difficult terrain within 100 feet, placed to catch the most PCs. Then they roll initiative (Stealth +7).</p>
      <p class="text"><b>Routine</b> — one action per duplicate still standing. Each action: a duplicate moves 20 feet or shifts the field 20 feet, then <b>mind-slicing blast</b> +9 at one creature within 40 feet, 1d4 piercing plus 1d4 mental, no multiple attack penalty.</p>
      <p class="dcs sm">AC 13, Fort +10, Ref +4 · each duplicate HP 6 (BT 3)</p>
      <ul class="checks">${["DC 14 Arcana or DC 14 Occultism to seal a duplicate away",
        "DC 15 Engineering Lore or DC 15 Physical Science Lore to disable the quantum field with contradicting theory",
        "DC 16 Athletics to disable a duplicate by force"].map(x => `<li>${hl(x)}</li>`).join("")}</ul>
      <div class="dupes">
        ${t.s.dupes.map((d, i) => `<button type="button" class="opt ${d ? "on bad" : ""}" data-act="dupe" data-i="${i}" ${ro ? "disabled" : ""}>
          <i class="fa-solid ${d ? "fa-ghost" : "fa-user-secret"}"></i> Duplicate ${i + 1}${d ? " — gone" : ""}</button>`).join("")}
        <b class="actions">${actions} action${actions === 1 ? "" : "s"} a turn</b>
      </div>
      <p class="note">They vanish after 1 minute and never come back.</p>
    </div>`;
  }

  w_crowd(ro) {
    const t = this.t, done = (t.s.tracks.crowd ?? 0) >= TRACKS.crowd.need;
    return `<div class="widget">
      <div class="ohead"><span class="pip">hazard</span> <b>The panicking crowd</b></div>
      <p class="text">The first move action on each character's turn needs ${hl("DC 13 Athletics or DC 13 Acrobatics")} first: shoved 5 feet in a random direction on a failure, the action lost on a critical failure. The mechanizers are unaffected.</p>
      <p class="text">As an action, ${hl("DC 13 Diplomacy or DC 13 Intimidation")} directs the crowd — no shoving for a round. Two successes, or a critical success, disperse it.</p>
      ${this.counter("crowd", ro, "Directing")}
      ${done ? `<p class="bonus">Dispersed.</p>` : `<p class="danger">Still here on round 3: it tramples them. Each PC attempts ${hl("DC 13 Reflex")} — crit success: no damage, lesser cover until their next turn; failure: 1d6+2 bludgeoning; crit failure: 2d6+4 and prone. Then it disperses.</p>`}
    </div>`;
  }

  w_entry(ro) {
    const t = this.t, ap = t.s.approach, v = t.s.tracks.entry ?? 0;
    const lists = {
      intrigue: ["Search for loopholes in academic bureaucracy: DC 14 Academia Lore or DC 14 Perception",
        "Gather Information: DC 13 Computers or DC 13 Diplomacy", "Fill out paperwork: DC 13 Computers or DC 13 Perception",
        "Forge documents: DC 15 Computers or DC 15 Society", "Call in favors or charm officials: DC 14 Diplomacy",
        "Con officials: DC 15 Deception", "Strongarm their way in: DC 14 Intimidation"],
      infiltration: ["Hack the floor plan or security codes: DC 15 Computers", "Copy a key: DC 14 Crafting or DC 14 Engineering Lore",
        "Infiltrate or scout beforehand: DC 13 Deception or DC 13 Stealth", "Expending a useful spell or item counts as a success"]
    };
    return `<div class="widget">
      <div class="btnrow">
        <span class="subhead inline">Approach</span>
        <button type="button" class="opt ${ap === "intrigue" ? "on" : ""}" data-act="choose" data-k="approach" data-v="intrigue" ${ro ? "disabled" : ""}>Intrigue — permission</button>
        <button type="button" class="opt ${ap === "infiltration" ? "on" : ""}" data-act="choose" data-k="approach" data-v="infiltration" ${ro ? "disabled" : ""}>Infiltration — break in</button>
      </div>
      ${ap === "intrigue" ? `<p class="note">Each check is a day of work; a critical success takes only hours, so that PC may try again that day. Aiding costs your own check that day.</p>` : ""}
      ${ap ? `<ul class="checks">${lists[ap].map(x => `<li>${hl(x)}</li>`).join("")}</ul>` : `<p class="note">Pick how they're going about it.</p>`}
      ${this.counter("entry", ro, "Successes")}
      ${v >= TRACKS.entry.need ? `<p class="bonus">They're in on their own. Each PC can attempt a DC 15 check fitting their method — success: something feels “off,” as if someone behind the scenes is making sure they get in.</p>` : ""}
    </div>`;
  }

  w_archive(ro) {
    const t = this.t, v = t.s.tracks.archive ?? 0, done = v >= TRACKS.archive.need;
    return `<div class="widget hazard ${done ? "done" : ""}">
      <div class="ohead"><span class="pip">hazard 1</span> <b>Archivist's Wrath</b> <span class="pip">complex · tech</span></div>
      <ul class="checks">${TRACKS.archive.disable.map(x => `<li>${hl(x)}</li>`).join("")}</ul>
      ${this.counter("archive", ro, "Disable")}
      <p class="text"><b>Routine</b> (1 action): a laser at every intruder — <b>+${9 - v}</b>${v ? ` (−${v} for their successes)` : ""}, 1d6+3 fire, no multiple attack penalty.</p>
      ${done ? `<p class="bonus">Disabled — the Archivist stands down and the dragonets are neutralized.</p>` : ""}
    </div>`;
  }

  w_framed() {
    const ap = this.t.s.approach;
    if (!ap) return `<p class="note">The news story depends on how they got in — set the approach on All Too Easy.</p>`;
    return `<p class="danger">${ap === "infiltration"
      ? "The news: they violently broke into the secure facility, destroyed university assets, and stole a priceless item that could be the key to communicating with the First Ones."
      : "The news: they infiltrated Striving's system and sabotaged the city's most precious resources from inside."}</p>`;
  }

  w_trial(ro) {
    const t = this.t, ev = t.evidenceCount, enough = ev >= EVIDENCE_NEEDED, v = t.s.trial.verdict;
    return `<div class="widget">
      <div class="evmeter">
        ${EVIDENCE.map(e => `<span class="evdot ${t.s.evidence[e.key] ? "on" : ""}" title="${esc(e.label)}"></span>`).join("")}
        <b>${ev} piece${ev === 1 ? "" : "s"} of evidence</b>
      </div>
      ${enough
        ? `<p class="bonus">${ev} pieces — their case satisfies the Machine Court.</p>`
        : `<p class="text">Short of ${EVIDENCE_NEEDED}: they make the case on the fly. Three successes, about DC 15: Deception to Lie, Diplomacy to Make an Impression on the judges, Legal Lore or Society for a legal argument, Aballon Lore or Society to appeal to local custom.</p>
           ${this.counter("defense", ro, "Arguments")}`}
      <p class="note">For a crunchier trial the book suggests Victory Points: each piece of evidence a point, skill checks for more.</p>
      <div class="btnrow">
        <span class="subhead inline">Verdict</span>
        <button type="button" class="opt good ${v === "innocent" ? "on" : ""}" data-act="verdict" data-k="innocent" ${ro ? "disabled" : ""}>Innocent</button>
        <button type="button" class="opt bad ${v === "guilty" ? "on" : ""}" data-act="verdict" data-k="guilty" ${ro ? "disabled" : ""}>Guilty</button>
      </div>
      ${v === "innocent" ? `<p class="bonus">Free to go, no escort.</p>` : ""}
      ${v === "guilty" ? `<p class="danger">An escort everywhere in Striving for 30 days while the court decides next steps. More disruption may mean deportation. (The hideout's laptop clears them.)</p>` : ""}
    </div>`;
  }

  w_acclim(ro) {
    const t = this.t;
    return `<div class="widget">
      <div class="subhead">Acclimation — consecutive successful saves</div>
      <div class="pcrows">
        ${t.s.pcs.map((pc, i) => {
          const n = t.s.acclim[i] ?? 0;
          return `<div class="pcrow">
            <img src="${esc(pc.img)}" alt="">
            ${this.pcCell(pc)}
            <span class="pips">${[0, 1, 2].map(k => `<span class="pipdot ${k < n ? "on" : ""}"></span>`).join("")}</span>
            <div class="res">
              ${n >= 3 ? `<span class="bonus inline">Acclimated</span>` : `
              <button type="button" class="opt sm deg-cs" data-act="acclim" data-i="${i}" data-n="2" ${ro ? "disabled" : ""}>Crit</button>
              <button type="button" class="opt sm deg-s" data-act="acclim" data-i="${i}" data-n="1" ${ro ? "disabled" : ""}>Success</button>`}
              <button type="button" class="opt sm deg-cf" data-act="acclim" data-i="${i}" data-n="0" ${ro || !n ? "disabled" : ""} title="A failed save breaks the streak">Fail / reset</button>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }

  w_tame(ro) {
    const t = this.t, can = t.s.obst.dd_pack === "pass";
    return `<div class="widget">
      <div class="btnrow">
        <button type="button" class="opt good ${t.s.tamed ? "on" : ""}" data-act="toggle" data-k="tamed" ${ro || (!can && !t.s.tamed) ? "disabled" : ""}
          title="${can ? "They fed the injured shroomclaw" : "Only if the pack check went well"}">
          <i class="fa-solid fa-paw"></i> ${t.s.tamed ? "The young shroomclaw follows them" : "Fed the injured shroomclaw"}</button>
      </div>
      <p class="note">It follows at a distance and appears at dawn and dusk; after the third feeding it guards camp and defends them. It stops limping in a few days, sooner with medical care. Tamed, the Gloaming's shroomclaws take their side.</p>
    </div>`;
  }

  w_puzzle(ro) {
    const done = (this.t.s.tracks.puzzle ?? 0) >= TRACKS.puzzle.need;
    return `<div class="obst">
      <div class="ohead"><span class="pip">obstacle 1</span> <b>Puzzle Lock</b></div>
      <p class="dcs sm">${hl("DC 14 Crafting to disable the mechanism; DC 14 Arcana, DC 14 Occultism, or DC 14 Religion to extrapolate a sixth rune from Eloritu's symbology; DC 14 Perception to align it by trial and error")}</p>
      ${this.counter("puzzle", ro, "Successes")}
      ${done ? `<p class="bonus">The door opens.</p>` : ""}
    </div>`;
  }

  w_dew(ro) {
    const t = this.t, v = t.s.tracks.dew ?? 0, done = v >= TRACKS.dew.need;
    return `<div class="widget hazard ${done ? "done" : ""}">
      <div class="ohead"><span class="pip">hazard 1</span> <b>Dewblossom</b> <span class="pip">rare · complex · environmental</span></div>
      <p class="dcs sm">Stealth +8 · AC 13, Fort +8, Ref +2 · HP 24, weakness fire 3</p>
      <ul class="checks">${TRACKS.dew.disable.map(x => `<li>${hl(x)}</li>`).join("")}</ul>
      <p class="note">Four successes or half its HP (12) disables it. Anyone who succeeds at a disable check gains +2 circumstance to AC and saves against it. Routine (1 action): vine snatch against the nearest creature.</p>
      ${this.counter("dew", ro, "Disable")}
      ${done ? `<p class="bonus">It spits out its victim, uproots, and rolls away at 100 feet a round. It resets in an hour, or a day if it fed.</p>` : ""}
      ${t.s.tamed
        ? `<p class="bonus">They fed the injured shroomclaw — the two shroomclaws harry the dewblossom instead. Award the XP as if they were defeated.</p>`
        : `<p class="danger">The shroomclaws from Day Delve ambush them at the dewblossom.</p>`}
    </div>`;
  }

  w_cannon(ro) {
    const t = this.t, v = t.s.tracks.cannon ?? 0, done = v >= TRACKS.cannon.need;
    return `<div class="widget hazard ${done ? "done" : ""}">
      <div class="ohead"><span class="pip">hazard 1</span> <b>Particle Cannon</b> <span class="pip">unique · complex · tech · trap</span></div>
      <p class="dcs sm">Perception +5 · AC 14, Fort +4, Ref +0 · HP 24 (BT 12), Hardness 5</p>
      <p class="text"><b>Charge Up</b> when a lookout spots a threat: Hura takes the gunner seat and it rolls initiative. <b>Routine</b> (2 actions): ${hl("1d6+3 fire to everyone in a 90-foot line, DC 14 basic Reflex")}.</p>
      <ul class="checks">${TRACKS.cannon.disable.map(x => `<li>${hl(x)}</li>`).join("")}</ul>
      <p class="note">Disabled, it's down for one round while Hura troubleshoots, then fires again. Hura gives up when the lookouts are dead or it's been disabled three times.</p>
      ${this.counter("cannon", ro, "Times disabled")}
      ${done ? `<p class="bonus">Hura stops firing.</p>` : ""}
    </div>`;
  }

  w_agentz(ro) {
    const t = this.t, z = t.s.agentz;
    return `<div class="widget">
      <ul class="checks"><li>${hl("Convince him: DC 15 Diplomacy")}</li><li>${hl("Help with the ritual: DC 15 Arcana or DC 15 Crafting")}</li></ul>
      <div class="btnrow">
        ${AGENT_Z.map(([k, label]) => `<button type="button" class="opt ${z === k ? "on" : ""}" data-act="choose" data-k="agentz" data-v="${k}" ${ro ? "disabled" : ""}>${label}</button>`).join("")}
      </div>
      ${z === "court" ? `<p class="note">The Machine Court sentences him to deportation and exile from Aballon.</p>` : ""}
      ${z ? `<p class="note">Whatever they decide, Agent Z accepts it. They've made an enduring enemy, or an unpredictable ally.</p>` : ""}
    </div>`;
  }

  w_fate(ro) {
    const f = this.t.s.fate;
    return `<div class="widget">
      <div class="btnrow">
        ${Object.entries(FATES).map(([k, x]) => `<button type="button" class="opt ${f === k ? "on" : ""}" data-act="choose" data-k="fate" data-v="${k}" ${ro ? "disabled" : ""}>${x.label}</button>`).join("")}
      </div>
      ${f ? `<p class="${FATES[f].tone === "rust" ? "danger" : "bonus"}">${FATES[f].text}</p>` : ""}
    </div>`;
  }

  /* ------------------------------------------------------------ case file */
  caseTab(ro) {
    const t = this.t, s = t.s, ev = t.evidenceCount, xp = t.xpTotal;
    const pct = Math.min(100, xp / LEVEL_AT * 100);
    const chapter = (n) => AWARDS.filter(a => a.ch === n);
    const sum = (n) => chapter(n).reduce((m, a) => m + (s.xp[a.key] ?? 0), 0);
    return `
      <div class="grid2">
        <section class="panel" style="--tone:var(--gold)">
          <h3>Evidence Tracker <small>the GM Aid</small><span class="lvl">${ev} of ${EVIDENCE.length}</span></h3>
          <p class="note">The Machine Court is satisfied by ${EVIDENCE_NEEDED} pieces. Short of that, the party argues it on the fly.</p>
          <div class="ticks col">
            ${EVIDENCE.map(e => `<button type="button" class="tick ev ${s.evidence[e.key] ? "on" : ""}" data-act="ev" data-k="${e.key}" ${ro ? "disabled" : ""}>
              <i class="fa-solid ${s.evidence[e.key] ? "fa-square-check" : "fa-square"}"></i> ${e.label} <em>${e.where}</em></button>`).join("")}
          </div>
        </section>
        <section class="panel" style="--tone:var(--plum)">
          <h3>Handouts <small>given out</small></h3>
          <div class="ticks col">
            ${HANDOUTS.map(([n, name, where]) => `<button type="button" class="tick ${s.handouts[n] ? "on" : ""}" data-act="handout" data-k="${n}" ${ro ? "disabled" : ""}>
              <i class="fa-solid ${s.handouts[n] ? "fa-square-check" : "fa-square"}"></i> <span class="pip">#${n}</span> ${name} <em>${where}</em></button>`).join("")}
          </div>
        </section>
      </div>
      <section class="panel" style="--tone:var(--moss)">
        <h3>XP Ledger <small>the same for every PC</small><span class="lvl">level ${t.level}</span></h3>
        <div class="xpbar"><span style="width:${pct}%"></span></div>
        <p class="note">${xp} XP${t.level === 1 ? ` — ${LEVEL_AT - xp} to 2nd level` : " — 2nd level"}. Fight XP is worked out from each creature's level against the party's at the moment it's ticked, and stored, so un-ticking takes back exactly what was given.</p>
        ${[1, 2, 3].map(n => `
          <div class="subhead">Chapter ${n} · ${sum(n)} XP</div>
          <div class="ticks col">${chapter(n).map(a => this.xpTick(a.key, ro)).join("")}</div>`).join("")}
      </section>
      ${s.log.length ? `<section class="panel"><h3>Log</h3><ul class="checks">${s.log.slice(0, 12).map(l => `<li>${esc(l)}</li>`).join("")}</ul></section>` : ""}`;
  }

  /* --------------------------------------------------------------- wiring */
  wire(root) {
    if (!root || root.dataset?.mmcWired === "1") return;
    if (root.dataset) root.dataset.mmcWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act, k = btn.dataset.k;
      if (a === "tab") { t.s.tab = k; t.touch(); }
      else if (a === "sheet") {
        const actor = game.actors.get(btn.dataset.id);
        if (actor) actor.sheet?.render(true);
        else ui.notifications.warn("That character's actor is no longer in this world.");
      }
      else if (a === "done") t.toggleDone(k);
      else if (a === "ev") t.toggleEvidence(k);
      else if (a === "xp") t.toggleXp(k);
      else if (a === "handout") t.toggleHandout(k);
      else if (a === "actor") t.openActor(k);
      else if (a === "postboxed") t.postBoxed(k);
      else if (a === "postboxed2") t.postBoxed(k, "boxed2");
      else if (a === "postchase") t.postObstacle();
      else if (a === "postchecks") t.postChecks(k);
      else if (a === "postobst") t.postObstacleCheck(k);
      else if (a === "chase") t.chaseResult(Number(btn.dataset.i), k);
      else if (a === "chasenext") t.chaseNext();
      else if (a === "chaseundo") t.chaseUndo();
      else if (a === "chasereset") t.chaseReset();
      else if (a === "chaseover") t.chaseOverride(k);
      else if (a === "bump") t.bump(k, Number(btn.dataset.n));
      else if (a === "dupe") t.toggleDupe(Number(btn.dataset.i));
      else if (a === "obst") t.setObst(k, btn.dataset.v);
      else if (a === "flag" || a === "toggle") t.toggleFlag(k);
      else if (a === "choose") t.choose(k, btn.dataset.v);
      else if (a === "verdict") t.setVerdict(k);
      else if (a === "acclim") t.bumpAcclim(Number(btn.dataset.i), Number(btn.dataset.n));
      else if (a === "rescan") t.rescanPCs();
      else if (a === "reset") this.confirmReset();
    });
  }

  async confirmReset() {
    const title = "Reset Murder in Metal City?";
    const content = "<p>Evidence, XP, and every tracker go back to the start.</p>";
    const D2 = foundry.applications?.api?.DialogV2;
    const ok = D2 ? await D2.confirm({ window: { title }, content })
      : globalThis.Dialog ? await Dialog.confirm({ title, content }) : true;
    if (ok) this.t.reset();
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.neon;
    return `<style>
      #mmc-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #mmc-console .window-content > * { background:transparent; }
      .mmc { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .mmc * { box-sizing:border-box; }
      .mmc button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; width:auto; margin:0; }
      .mmc button:hover:not(:disabled) { background:var(--hover); }
      .mmc button:disabled { opacity:.4; cursor:not-allowed; }
      .mmc h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.05em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
               padding-bottom:.3rem; flex-wrap:wrap; }
      .mmc h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .mmc h1, .mmc h2, .mmc h4, .mmc legend { color:var(--ink); }
      .mmc .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .mmc .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .mmc .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .mmc .panel.done { opacity:.62; }
      .mmc .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 6px; letter-spacing:.06em; font-weight:700; }
      .mmc .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .mmc .pip { font-size:.57rem; text-transform:uppercase; letter-spacing:.07em; padding:0 5px;
                 border-radius:8px; border:1px solid var(--line); color:var(--muted); white-space:nowrap; }
      .mmc .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .mmc .say.inline { margin-left:.4rem; vertical-align:middle; font-style:normal; }
      .mmc .boxed { font-size:.82rem; line-height:1.55; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; }
      .mmc .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .mmc .note { font-size:.78rem; line-height:1.45; color:var(--muted); margin:.2rem 0 .4rem; }
      .mmc .danger { font-size:.79rem; line-height:1.45; color:var(--rust); margin:.2rem 0 .4rem; font-weight:600; }
      .mmc .bonus { font-size:.79rem; line-height:1.45; font-weight:600; color:var(--moss); margin:.3rem 0 .4rem; }
      .mmc .bonus.inline { margin:0; font-size:.72rem; }
      .mmc .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .mmc .loot b { color:var(--gold); }
      .mmc .dcs { font-size:.8rem; font-weight:600; margin:.2rem 0 .4rem; color:var(--slate); line-height:1.45; }
      .mmc .dcs.sm { font-size:.77rem; font-weight:500; }
      .mmc .dc { color:var(--slate); font-weight:600; white-space:nowrap; }
      .mmc .dcs .dc { color:inherit; }
      .mmc .checkhead { display:flex; align-items:center; gap:.4rem; margin-top:.4rem; }
      .mmc .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0; line-height:1.4; }
      .mmc .checks { margin:.2rem 0 .45rem; padding-left:1.1rem; font-size:.79rem; line-height:1.5; }
      .mmc .checks li { margin-bottom:.25rem; }
      .mmc .subhead { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin:.4rem 0 .25rem; }
      .mmc .subhead.inline { margin:0 .2rem 0 0; }
      .mmc .qa { font-size:.79rem; line-height:1.5; margin:.3rem 0; }
      .mmc .qa p { margin:.3rem 0; }
      .mmc .qa b { display:block; color:var(--tone, var(--moss)); }
      .mmc .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.3rem 0; }
      .mmc .btnrow.end { justify-content:flex-end; margin-bottom:0; }
      .mmc .spacer { flex:1; }
      .mmc .primary { background:var(--tone, var(--slate)); border-color:var(--tone, var(--slate));
                     color:var(--paper); font-weight:700; padding:.3rem .7rem; font-size:.76rem; }
      .mmc .primary:hover:not(:disabled) { filter:brightness(1.15); background:var(--tone, var(--slate)); }
      .mmc .primary.sm, .mmc .ghost.sm { padding:.18rem .55rem; font-size:.68rem; }
      .mmc .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .mmc .opt { padding:.28rem .6rem; font-size:.75rem; }
      .mmc .opt.sm { padding:.18rem .42rem; font-size:.68rem; }
      .mmc .opt.on { background:var(--slate); border-color:var(--slate); color:var(--paper); font-weight:600; }
      .mmc .opt.good.on { background:var(--moss); border-color:var(--moss); }
      .mmc .opt.bad.on { background:var(--rust); border-color:var(--rust); }
      .mmc .opt.deg-cs.on { background:var(--moss); border-color:var(--moss); }
      .mmc .opt.deg-s.on { background:var(--slate); border-color:var(--slate); }
      .mmc .opt.deg-f.on { background:var(--muted); border-color:var(--muted); }
      .mmc .opt.deg-cf.on { background:var(--rust); border-color:var(--rust); }

      .mmc .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .mmc .lamps { display:flex; gap:.4rem; flex-wrap:wrap; }
      .mmc .lamp { display:inline-flex; align-items:center; gap:.3rem; font-size:.68rem; text-transform:uppercase;
                  letter-spacing:.06em; color:var(--muted); border:1px solid var(--line); border-radius:10px; padding:2px 8px; }
      .mmc .lamp i { font-size:.5rem; opacity:.35; }
      .mmc .lamp.lit { color:var(--lt); border-color:var(--lt); font-weight:700; }
      .mmc .lamp.lit i { opacity:1; text-shadow:0 0 6px var(--lt); }
      .mmc .xpbox { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; }
      .mmc .xpbox span { font-size:.58rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .mmc .xpbox b { font-size:1.05rem; line-height:1; color:var(--gold); }
      .mmc .topbar .say { margin-left:0; }

      .mmc .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .mmc .tab { flex:1; padding:.3rem .2rem; font-size:.77rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .mmc .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .mmc .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .mmc .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .mmc .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .mmc .tab.on b i, .mmc .tab.on small { color:var(--paper); opacity:.85; }

      .mmc .crew { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.2rem 0 .45rem; }
      .mmc .mon { font-size:.74rem; padding:.22rem .55rem; color:var(--rust); border-color:var(--rust); }
      .mmc .mon em { color:var(--muted); font-style:normal; font-size:.66rem; }
      .mmc .foexp { font-size:.68rem; color:var(--gold); letter-spacing:.04em; }

      .mmc .widget { border:1px dashed var(--line); border-radius:3px; padding:.5rem; margin:.45rem 0; background:var(--stripe); }
      .mmc .widget.hazard.done { border-color:var(--moss); border-style:solid; }
      .mmc .ohead { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; font-size:.82rem; margin-bottom:.2rem; }
      .mmc .ohead .say { margin-left:auto; }
      .mmc .obst { border:1px solid var(--line); border-radius:3px; padding:.45rem .5rem; margin:.4rem 0; background:var(--stripe); }
      .mmc .obst.pass { border-color:var(--moss); }
      .mmc .obst.fail { border-color:var(--rust); }
      .mmc .obsnow { border:1px solid var(--ember); border-radius:3px; padding:.45rem .5rem; margin:.45rem 0; }

      .mmc .counter { display:flex; align-items:center; gap:.4rem; margin:.35rem 0; flex-wrap:wrap; }
      .mmc .counter b { font-size:.76rem; color:var(--muted); }
      .mmc .clabel { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); min-width:5.5rem; }
      .mmc .qbtn { min-width:24px; height:22px; padding:0 .3rem; font-size:.74rem; }
      .mmc .pips { display:inline-flex; gap:3px; }
      .mmc .pipdot { width:10px; height:10px; border-radius:50%; border:1px solid var(--line); display:block; }
      .mmc .pipdot.on { background:var(--tone, var(--plum)); border-color:var(--tone, var(--plum)); box-shadow:0 0 6px var(--tone, var(--plum)); }

      .mmc .lane { display:grid; grid-template-columns:repeat(8, 1fr); gap:3px; margin-bottom:.4rem; }
      .mmc .lanecell { border:1px solid var(--line); border-radius:3px; padding:.25rem .3rem; display:flex; flex-direction:column;
                       gap:.15rem; min-height:58px; background:var(--card); }
      .mmc .lanecell.past { opacity:.45; }
      .mmc .lanecell.here { border-color:var(--ember); box-shadow:inset 0 0 0 1px var(--ember); }
      .mmc .lanecell.drone { border-color:var(--plum); }
      .mmc .lname { font-size:.62rem; line-height:1.15; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
      .mmc .lmarks { display:flex; gap:.3rem; font-size:.85rem; min-height:1rem; }
      .mmc .lmarks .fa-person-running { color:var(--ember); }
      .mmc .lmarks .fa-satellite { color:var(--plum); }
      .mmc .lcp { font-size:.7rem; color:var(--gold); margin-top:auto; }

      .mmc .pcrows { display:flex; flex-direction:column; gap:.3rem; }
      .mmc .pcrow { display:grid; grid-template-columns:28px 8rem 2rem 1fr; gap:.5rem; align-items:center;
                    border:1px solid var(--line); border-radius:3px; padding:.3rem .4rem; background:var(--card); }
      .mmc .pcrow img { width:28px; height:28px; border-radius:3px; object-fit:cover; border:1px solid var(--line); }
      .mmc .pcrow .cn { font-size:.82rem; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .mmc .pcrow .ord { font-size:.68rem; color:var(--muted); }
      .mmc .pcrow .res { display:flex; gap:.25rem; flex-wrap:wrap; justify-content:flex-end; }
      .mmc button.cn { background:transparent; border:0; padding:0; color:var(--ink); font-family:inherit;
                      text-align:left; cursor:pointer; justify-content:flex-start; }
      .mmc button.cn:hover { text-decoration:underline; background:transparent; }

      .mmc .dupes { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.35rem 0; }
      .mmc .dupes .actions { font-size:.78rem; color:var(--gold); margin-left:auto; }

      .mmc .ticks { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.45rem; padding-top:.4rem; border-top:1px solid var(--line); }
      .mmc .ticks.col { flex-direction:column; border-top:0; padding-top:0; margin-top:.2rem; }
      .mmc .tick { justify-content:flex-start; text-align:left; font-size:.75rem; padding:.22rem .5rem; color:var(--muted); }
      .mmc .tick i { color:var(--muted); }
      .mmc .tick em { color:var(--muted); font-style:normal; font-size:.66rem; margin-left:auto; padding-left:.5rem; }
      .mmc .tick.on { color:var(--ink); border-color:var(--moss); }
      .mmc .tick.on i { color:var(--moss); }
      .mmc .tick.ev.on { border-color:var(--gold); }
      .mmc .tick.ev.on i { color:var(--gold); }
      .mmc .tick.gated { border-style:dashed; }

      .mmc .evmeter { display:flex; align-items:center; gap:4px; margin-bottom:.35rem; }
      .mmc .evdot { width:14px; height:14px; border-radius:3px; border:1px solid var(--line); }
      .mmc .evdot.on { background:var(--gold); border-color:var(--gold); }
      .mmc .evmeter b { font-size:.78rem; color:var(--muted); margin-left:.4rem; }

      .mmc .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
      .mmc .xpbar { height:8px; border:1px solid var(--line); border-radius:4px; background:var(--stripe); overflow:hidden; margin:.2rem 0 .4rem; }
      .mmc .xpbar span { display:block; height:100%; background:var(--moss); }

      @media (max-width:820px) {
        .mmc .grid2 { grid-template-columns:1fr; }
        .mmc .lane { grid-template-columns:repeat(4, 1fr); }
        .mmc .tabs { flex-wrap:wrap; }
        .mmc .pcrow { grid-template-columns:28px 1fr 2rem; }
        .mmc .pcrow .res { grid-column:1 / -1; justify-content:flex-start; }
      }
    </style>`;
  }
}

if (AppV2) {
  MMCApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  /* Every tab carries DCs, XP targets, and what's coming next — none of it is
     for the players, so the console only opens for a GM. Players see the
     chat cards it posts. */
  if (!game.user.isGM) return ui.notifications.warn("Murder in Metal City is a GM console.");
  registerSetting();
  let state = game.settings.get(MMC_NS, MMC_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(MMC_NS, MMC_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const run = new MetalCity(state);
  const app = new MMCApp(run);

  if (!globalThis.__mmcHook) {
    globalThis.__mmcHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== MMC_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh && globalThis.__mmcRun) { globalThis.__mmcRun.state = fresh; globalThis.__mmcRun.render(); }
    });
  }
  globalThis.__mmcRun = run;
  app.render(true);
})();
