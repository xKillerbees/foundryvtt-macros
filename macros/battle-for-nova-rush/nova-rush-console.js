/* ============================================================================
   BATTLE FOR NOVA RUSH — GM Console
   Starfinder Second Edition · four 1st-level characters · Free RPG Day 2025
   Foundry VTT v11 / v12 / v13  •  built for the sf2e system
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   Runs the whole one-shot: the brig escape and its modifiers, both decks, the
   sinkwell's three-success disable, the bridge fight's per-round battle damage,
   and the conclusion's escape check with every modifier applied for you.

   Statblocks are not reproduced. Creature buttons open the sf2e compendium
   actors directly; if your world doesn't have that module, the button simply
   reports the missing UUID.
   ============================================================================ */

const NR_NS = "world";
const NR_KEY = "sf2eNovaRush";
const NR_ID = `${NR_NS}.${NR_KEY}`;
const MAX_PCS = 4;

/* Actors as shipped by the sf2e system's compendiums. */
const UUIDS = {
  firestorm: "Compendium.sf2e.standalone-adventure-bestiary.Actor.bv2A6D8Z3EJSm4uG",
  pirate: "Compendium.sf2e.standalone-adventure-bestiary.Actor.etsfYvKACdEaTiNw",
  sinkwell: "Compendium.sf2e.standalone-adventure-bestiary.Actor.d3VwBxBy5VMwfgxG"
};

/* ------------------------------------------------------------------- FX
   Sequencer + JB2A, both optional. Every cue lists several database keys and
   the first one that actually exists in this world is used, because the free
   and Patreon JB2A modules carry different subsets. Swap in your own keys here
   if you'd rather — the FX tab has a Test button for each cue, and the
   Sequencer Database Viewer (under the module's settings) lists everything
   installed. With neither module present the console just says so and carries
   on; nothing else depends on this. */
const FX = {
  attack: {
    label: "We're Under Attack", where: "A1 — the Corpse Fleet's first volley",
    files: ["jb2a.explosion.01.orange", "jb2a.explosion.02.orange", "jb2a.impact.orange.0"],
    scale: 1.8, screen: true, shake: { duration: 1000, strength: 28 }
  },
  reactor: {
    label: "Reactor shock", where: "A8 — a failed repair attempt",
    files: ["jb2a.static_electricity.02.blue", "jb2a.static_electricity.01.blue",
            "jb2a.chain_lightning.primary.blue", "jb2a.lightning_ball.blue"],
    scale: 1.0, target: "selected"
  },
  sinkwell: {
    label: "Soul-Draining Wave", where: "B1 — the haunt triggers",
    files: ["jb2a.energy_strands.overlay.dark_purple.01",
            "jb2a.magic_signs.rune.necromancy.loop.dark_purple",
            "jb2a.impact.dark_purple.0", "jb2a.explosion.01.purple"],
    scale: 1.4, target: "selected", shake: { duration: 600, strength: 12 }
  },
  sparks: {
    label: "Battle damage — sparks", where: "B5 — the 1 result",
    files: ["jb2a.static_electricity.01.blue", "jb2a.chain_lightning.primary.blue"],
    scale: 0.9, target: "selected"
  },
  steam: {
    label: "Battle damage — steam", where: "B5 — the 2 result",
    files: ["jb2a.smoke.puff.centered.grey.0", "jb2a.smoke.puff.centered.dark_black.0",
            "jb2a.fog_cloud.01.white"],
    scale: 1.3, target: "selected"
  },
  lurch: {
    label: "Battle damage — lurch", where: "B5 — the 3 result",
    files: [], shake: { duration: 800, strength: 20 }
  },
  holo: {
    label: "Battle damage — Concierge", where: "B5 — the 4 result",
    files: ["jb2a.energy_field.02.above.blue", "jb2a.shield_themed.above.holy.blue.01",
            "jb2a.magic_signs.circle.02.illusion.loop.blue"],
    scale: 0.8, target: "selected"
  },
  escape: {
    label: "Breaking away", where: "The end of the cinematic escape",
    files: ["jb2a.portal.vortex.loop.blue", "jb2a.energy_beam.normal.blue.03",
            "jb2a.explosion.01.blue"],
    scale: 1.6, screen: true, shake: { duration: 700, strength: 14 }
  }
};

const THEME = "console";
const PALETTES = {
  /* A starship UI: dark hull, lit glass, amber alarms. */
  console: {
    paper: "#0e1116", card: "#161c24", ink: "#d9e3ee", line: "#2b3846", muted: "#8598ab",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(120,200,255,.10)", field: "#0b0f14",
    rust: "#e0563d", ember: "#f0a13c", moss: "#4fd6a0", slate: "#54a8dd", plum: "#a279e6", gold: "#f2d16b"
  },
  daylight: {
    paper: "#eef2f6", card: "#ffffff", ink: "#16202a", line: "#c2cedb", muted: "#5d6e7e",
    stripe: "rgba(0,0,0,.04)", hover: "rgba(0,0,0,.06)", field: "#f7fafc",
    rust: "#b03a22", ember: "#a86412", moss: "#1d7a55", slate: "#1f6d9e", plum: "#6a44ad", gold: "#8a6a12"
  }
};

/* --------------------------------------------------- inline check helper */
const SKILL_WORDS = ["Acrobatics", "Arcana", "Athletics", "Computers", "Crafting", "Deception",
  "Diplomacy", "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Piloting",
  "Religion", "Society", "Stealth", "Survival", "Thievery", "Perception",
  "Fortitude", "Reflex", "Will"];
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

/* ------------------------------------------------------------------- tabs */
const TABS = [
  { key: "brig", label: "A1 Brig", sub: "getting out" },
  { key: "lower", label: "Lower deck", sub: "A2 – A8" },
  { key: "upper", label: "Upper deck", sub: "B1 – B4" },
  { key: "bridge", label: "B5 Bridge", sub: "the finale" },
  { key: "escape", label: "Escape", sub: "the last check" },
  { key: "fx", label: "Effects", sub: "Sequencer · JB2A" }
];

/* ------------------------------------------------------------------- brig */
const BRIG = {
  boxed: "Nova Rush would be a nice ship — if you weren't locked in the brig! You were captured by pirates a week ago, and your life since has become a monotonous nightmare. The food's bland, time passes at a crawl, pirates are constantly threatening to hurt you, and you've all got to share a makeshift cell. You know who to blame for your troubles: Captain Phaedra Firestorm! She's been digging into your past, trying to determine if you're worth more alive or dead. Time is running short. You've got to escape!",
  setup: "One of the brig's two escape pods was jettisoned in the initial attack; Brinn deactivated the other and made it a cell. A crosshatched force barrier bars the entrance. Brinn and Captain Firestorm each carry a keycard. The party's confiscated gear sits in storage cubes across the room, out of reach.",
  brinn: "Brinn is delivering food as the adventure opens, and is clearly irritated — muttering, huffing, curt. Asked what's wrong, they scoff and cross their arms.",
  quote: "I'm a starship engineer! Babysitting prisoners and scrubbing toilets isn't in my job description! But the captain's got her favorites, and I'm not one of them.",
  methods: [
    { key: "talk", label: "Conversation", tone: "slate",
      base: "DC 15 Diplomacy or DC 15 Deception to talk Brinn into opening the cell",
      mod: { key: "flattery", label: "Complimented Brinn, insulted Firestorm, or promised to overthrow her", delta: -2 } },
    { key: "threat", label: "Threats", tone: "rust",
      base: "DC 15 Intimidation to bully Brinn, or DC 15 Athletics to grab them through the bars",
      note: "These DCs can't be reduced — Brinn is accustomed to threats and abuse." },
    { key: "trick", label: "Trickery", tone: "plum",
      base: "DC 15 Thievery to lift the keycard unnoticed",
      mod: { key: "distract", label: "Another PC distracted Brinn — DC 10 Deception, Diplomacy, or Performance", delta: -2 } }
  ],
  fallback: [
    "Once Brinn leaves: DC 13 Acrobatics, Athletics, or Crafting to reach the nearby tools.",
    "With the tools: DC 15 Computers, Crafting, or Thievery to disable or hack the lock, or DC 17 Athletics to Force Open the door."
  ],
  development: "Win Brinn over and they show the party a smuggling compartment in the floor, tell them to give Firestorm what she deserves, and leave. Escape without Brinn noticing and the party finds the compartment themselves.",
  treasure: "The compartment holds a commercial force field, a commercial phase shield, magboots, and two commercial incendiary grenades. The storage cubes return the party's own gear, plus a hacking toolkit and a commercial infiltrator's toolkit.",
  attack: {
    boxed: "A deafening roar breaks the silence as Nova Rush gives a great lurch. The hull creaks ominously, there's a shout in the distance, and the lights cut out. Another blast strikes the starship's hull, sending it rocking again. The lights flicker back on as a klaxon blares and a woman's voice shouts over the comms: \"Battle stations, ya filthy curs! We're under attack!\"",
    fail: "If the party never got out on their own, the attack shorts the cell door open — but they don't find the smuggling compartment."
  }
};

/* ------------------------------------------------------------------ areas */
const AREAS = [
  { id: "A2", key: "a2", deck: "lower", name: "Rec Room", level: "Moderate 1", tone: "rust",
    boxed: "An arc-shaped, messy rec room with a bar, couches bolted to the floor, and an alien pelt thrown down like a carpet. A window behind the bar overlooks the munitions room and its coils of starship bullets. Reactor light pours through the rear window in a blue glow. Out the forward window, Nova Rush is under attack by starships of jagged bone and sinew — Corpse Fleet raiders! One other ship, a fast junker named Split Blade, fights alongside her.",
    creatures: [{ n: 4, name: "Nova Pirate", uuid: "pirate" }],
    text: "As the party approaches the door to either the lower cargo hold (A4) or the medbay (A7), four space pirates rush in, two through each door. They hurl insults, fire laser pistols, and Take Cover behind the couches and medbay furniture. If the party does the same, the pirates lob grenades behind their cover to drive them out. A pirate pressed into melee Strides away, fires, and repositions — so the fight likely ranges across the lounge, medbay, and cargo hold. Cornered, they draw phase cutlasses. They fight to the death, fearing Firestorm's intolerance for cowardice.",
    knowledge: {
      lead: "Each PC can Recall Knowledge about the Corpse Fleet: DC 15 Society, or an applicable DC 13 Lore — Corpse Fleet Lore, Eox Lore, Piracy Lore, or Warfare Lore.",
      degrees: [
        ["Critical Success", "As success, and the PC knows that surrendering to the Corpse Fleet would almost certainly mean death."],
        ["Success", "A military organization of violent undead renegades who seek to undo the unity of the Pact Worlds and restore their home world, Eox, to power and glory."],
        ["Critical Failure", "A military organization of undead who attack on sight — but they'd probably offer mercy to foes who surrender."]
      ]
    },
    treasure: "A cellular stimulant spell amp on the bar." },

  { id: "A3", key: "a3", deck: "lower", name: "Escape Pods", tone: "muted",
    text: "Launching a pod needs a passcode, and would be a terrible idea mid-battle. Tamper with them and an automated Captain Concierge appears on a terminal, waggling a finger.",
    quote: "Nuh-uh-uh! By order of Captain Firestorm, all escape pods are deactivated! I'm ordered to call you a coward and demand you return to your post. Have a stellar day!" },

  { id: "A4", key: "a4", deck: "lower", name: "Lower Cargo Hold", tone: "slate",
    text: "Mostly clear, with the bulk of the cargo in the adjoining port and starboard holds. A catwalk with metal guardrails sits 15 feet up, reached by ladder. The port stairs lead to the upper deck.",
    treasure: "A commercial autograppler, 50 feet of cable line, 50 projectile ammunition, and 5 commercial batteries." },

  { id: "A5", key: "a5", deck: "lower", name: "Control Room", tone: "slate",
    text: "Windows over the ship's aft and camera displays covering the exterior. From here a PC can work the exterior cargo crane or extend and retract the accordion gangways on the upper hold. Anyone who examines the cameras spots that the starboard forward missile launcher is jammed — and could be repaired by someone standing on the starboard external bridgeway (B2).",
    treasure: "A programmer's plushie that looks like Captain Concierge, in the cabinets." },

  { id: "A6", key: "a6", deck: "lower", name: "Munitions", tone: "ember",
    text: "Reached by crawling through one of the alien heads on the rec room wall. Coils of starship-grade munitions run through the ceiling to feed the machine guns. Brinn lies in a hammock with headphones on, pointedly ignoring the alarms.",
    branches: [
      ["If Brinn helped them escape", "Shouldn't you be gutting the captain by now? She's on the bridge."],
      ["If Brinn didn't", "Look at you, seizing your independence. I won't stand in your way. Now, scram! There's nothing worth stealing here."]
    ] },

  { id: "A7", key: "a7", deck: "lower", name: "Medbay", tone: "moss",
    text: "Well stocked: two beds, a worktable, cabinets, a computer station. Messy, but the centrifuge, microscope, and other devices haven't been used in weeks.",
    treasure: "A commercial medkit, two commercial medpatches, and a bone serum." },

  { id: "A8", key: "a8", deck: "lower", name: "Reactor Access", tone: "ember",
    text: "A cramped room holding the engine and reactor — sparking and overloading. The first time the party enters, a glitchy Captain Concierge projects from the control panel and warns them to be careful. The first time a PC is hurt by the reactor he remarks, unhelpfully, \"Ooh, shocking!\"" },

  { id: "B1", key: "b1", deck: "upper", name: "Upper Cargo Hold", level: "Trivial 1", tone: "plum",
    boxed: "The upper cargo hold is empty, floored with metal grating. Doors in the port and starboard hull lead to the external bridgeways. Opening one forms an enviro-seal across it, preventing decompression while still letting people and objects through.",
    text: "Polly, a snarky electrovore, is a serpentine creature who feeds on electricity and has made this her spot. Short-tempered and loyal to Captain Firestorm, she greets the party with threats and a bad attitude. Give them a chance to talk to her.",
    creatures: [{ n: 1, name: "Spiritual Sinkwell", uuid: "sinkwell", note: "Hazard 1 · complex haunt" }] },

  { id: "B2", key: "b2", deck: "upper", name: "Bridgeway", tone: "slate",
    text: "No oxygen and no gravity out here. Armor environmental protections let a PC breathe in vacuum; magboots activate as a single action and let them walk normally. Otherwise they need the guardrail or a cable line to avoid drifting into space.",
    note: "A PC on the starboard bridgeway can move fore and repair the jammed missile launcher." },

  { id: "B3", key: "b3", deck: "upper", name: "Mess", tone: "muted",
    text: "The kitchen uses the reactor core's exposed tubing in the rear wall as its heat source. A Y-shaped table sits at the centre, with a coffee bar and a cereal bar at the forward ends." },

  { id: "B4", key: "b4", deck: "upper", name: "Bedrooms", tone: "muted",
    text: "Two private rooms — B4a is Captain Firestorm's, B4b is unoccupied — and two shared rooms, B4c and B4d, with two bunk beds each. Firestorm's door is locked and needs two successful DC 15 Thievery checks.",
    treasure: "Inside Firestorm's room: Vidia's commercial holoskin and a tactical arc pistol." }
];

/* --------------------------------------------------------- the two repairs */
const REPAIRS = {
  reactor: {
    area: "A8", name: "The overloading reactor", tone: "ember",
    check: "DC 17 Computers or DC 17 Crafting, 1 minute",
    cost: "Every attempt deals 1d6 electricity damage to the PC making it, DC 15 basic Reflex.",
    polly: "If Polly is helping, she harmlessly drinks the electricity instead and the damage doesn't happen.",
    pays: "Reduces the escape DC by 1."
  },
  launcher: {
    area: "B2", name: "The jammed missile launcher", tone: "slate",
    check: "DC 15 Acrobatics, Athletics, or Crafting, 1 minute",
    cost: "Reached from the starboard bridgeway, which means vacuum: environmental protections to breathe, magboots or a handhold to not drift off.",
    pays: "Adds a second gunner slot in the escape."
  }
};

/* ---------------------------------------------------------------- allies */
const ALLIES = {
  brinn: {
    name: "Brinn", who: "bitter agender android engineer", where: "A6 Munitions", tone: "ember",
    ask: "DC 14 Deception or DC 14 Diplomacy, or DC 16 Intimidation. A bribe worth at least 40 credits drops those by 3.",
    limits: "Refuses to fight and won't set foot on the bridgeway. Will help with the engine or with opening locked doors.",
    skills: "Computers +7, Crafting +7, Thievery +7 — and can't critically fail an attempt to Aid with them."
  },
  polly: {
    name: "Polly", who: "snarky electrovore", where: "B1 Upper Cargo Hold", tone: "plum",
    ask: "Not a check — save her from the sinkwell. Disable the haunt and she says \"Guess I owe you one!\"",
    limits: "Lets the party pass without ratting them out, and helps with the overloading reactor. Refuses to fight: \"Whoa, I owe you one, not a dozen! I'm not risking these beautiful scales!\"",
    skills: "Feeds on electricity, so she soaks the reactor's shock for whoever is repairing it.",
    danger: "If the party flees the haunt instead of disabling it, Polly is killed."
  }
};

/* ---------------------------------------------------------- the sinkwell */
const SINKWELL = {
  name: "Spiritual Sinkwell", level: "Hazard 1", traits: ["Uncommon", "Complex", "Haunt", "Magical"],
  trigger: "Midway through the conversation with Polly — or the moment the party attacks her — a blast of life-siphoning energy from a Corpse Fleet ship punches through the hull, opening a 10-foot-square spiritual sinkwell in the middle of the hold.",
  aim: "Make sure the hazard targets Polly at least once.",
  stealth: "Stealth +13 (trained)",
  disable: [
    { key: "arcane", label: "DC 16 Arcana, Occultism, or Religion (trained) — safely disperse the void energy" },
    { key: "physical", label: "DC 18 Athletics or Thievery (trained) — sabotage the sinkwell" }
  ],
  successes: 3,
  wave: "Soul-Draining Wave (spirit, void) — 1d6+3 spirit damage to everyone in B1, DC 18 basic Fortitude. The haunt sprouts tentacle-like void lashes and rolls initiative.",
  routine: "Routine (5 actions): two void lash Strikes against targets it hasn't grabbed, then Grab each creature it hit with no multiple attack penalty. It pulls grabbed creatures 5 feet toward its centre, then deals 1d6+3 spirit damage (DC 18 basic Fortitude) to everyone within 10 feet of its centre. A critical failure also inflicts drained 1.",
  lash: "Ranged void lash +9 (range 40 feet), 1d6+3 void plus Grab (+9 Athletics)",
  reset: "It deactivates after 1 minute and does not reactivate."
};

/* ------------------------------------------------------ Captain Concierge */
const CONCIERGE = {
  intro: "Once the pirates in A2 are down, a holoprojector lights up and a smiling blue skittermander in a sailor's hat appears.",
  hello: "Hi newfriends! Wow-ee that was some stellar shooting! I knew you were right for the job! I'm Captain Concierge, the Nova Rush's incredibly clever virtual intelligence! Think of me as your best pal and a direct connection to the ship. I was made by Vidia Vane — the original owner of this fine starship. But Vidia's not around anymore and I'm not so keen on helping Captain Firestorm. I'd rather help you! So, how about it? Shall we liberate the Nova Rush from pirates and get out of here?",
  qa: [
    ["What happened to Vidia Vane?", "Captain Firestorm spaced her."],
    ["Why are you helping us?", "The Nova Rush and I are inseparable, but I'm not feeling the change in management, if you catch my drift. Captain Firestorm's going to kill you if you don't kill her first. I say we need a new captain! It's a match made in — well, the Diaspora!"],
    ["If you're a VI, don't you have to listen to Captain Firestorm?", "My programming forces me to execute her commands, but I have some, shall we say, interpretive freedom. She's a ruthless killer, so I undermine her intent whenever I can. Sadly, she's getting better at phrasing her requests…"],
    ["Where are the other pirates?", "After the missile launcher got jammed, Captain Firestorm sent some of her crew out onto the bridgeway to repair it. Crane malfunction coupled with a comms failure took 'em out. Lucky for you! Brinn's not so bad. They're in the munitions room — you've got to crawl through one of the alien heads in the rec room to get there. The rest of the crew is on the bridge with Captain Firestorm. There's also Polly, in the upper cargo hold. She's a snitch, but I kind of like her. She might be useful with the overloading engine, if you can convince her to switch sides."],
    ["Sounds like a shoddy ship.", "Don't worry, I'm sure it'll operate at peak efficiency under your command!"]
  ],
  brief: "Excellent! To liberate Nova Rush you'll need to seize the bridge. That's upstairs, at the fore. But we're also under attack! You might wanna fix the overloading engine and the jammed missile launcher if you want a fighting chance. I've gotta turn my attention back to the bridge — lots to do if we're gonna survive! Best of luck!",
  hit: "Describe the starship battle often — lights flicker, sparks fly from cables, the ship tilts, pipes burst into steam. None of it has mechanical effect until the bridge."
};

/* --------------------------------------------------------------- the bridge */
const BRIDGE = {
  boxed: "The rear of the bridge is raised a few feet above the fore. A holographic map and several computer consoles sit at the rear, along with the airlock to the starboard missile launcher. At the fore: a pilot's chair and a gunnery bay.",
  quote: "You scum dare challenge me?! This ship is mine! But I'm happy to splatter the walls with your blood!",
  creatures: [
    { n: 1, name: "Captain Phaedra Firestorm", uuid: "firestorm", note: "Creature 2 · unique" },
    { n: 2, name: "Nova Pirate", uuid: "pirate", note: "One in the gunnery bay, one at a console" }
  ],
  tactics: [
    "Firestorm fights in melee with Vitriolic Swing and grindblade Strikes, and takes Kill Steal whenever it triggers.",
    "The two lackeys attack at range and switch to melee if the party closes.",
    "Firestorm flees at 10 Hit Points or fewer, making for an escape pod and the Split Blade.",
    "The lackeys fight to the death — unless Firestorm is defeated, in which case they surrender at 4 Hit Points or fewer.",
    "A third pirate is flying the ship and is not a combatant; they call for mercy if attacked, and hand the controls to a PC afterwards, pointedly calling them captain."
  ],
  damage: [
    { roll: 1, fx: "sparks", label: "Sparks", text: "Sparks burst from one random console or panel — 1d6 electricity damage in a 10-foot emanation, DC 14 basic Reflex." },
    { roll: 2, fx: "steam", label: "Steam", text: "A pipe sprays steam into the fore or the rear of the bridge. Creatures in the area are concealed until the end of the round." },
    { roll: 3, fx: "lurch", label: "Lurch", text: "Violent motion knocks every non-seated creature prone — DC 14 Reflex negates." },
    { roll: 4, fx: "holo", label: "Concierge", text: "Captain Concierge fires a hologram into Captain Firestorm's face, making her off-guard until the end of the round." }
  ]
};

/* ------------------------------------------------------------ the escape */
const ESCAPE = {
  base: 15,
  text: "With Captain Concierge's full capabilities unlocked, the party runs for it. Each PC attempts a DC 15 check with any skill that could plausibly help them escape the Corpse Fleet.",
  rules: [
    "At least one PC must use Piloting.",
    "One PC — two, if the missile launcher was repaired — can crew the guns and make a ranged Strike in place of a skill check.",
    "Every PC gains a +1 circumstance bonus if Brinn or Polly is assisting.",
    "Repairing the reactor reduces the DCs by 1.",
    "If at least half the PCs succeed, Nova Rush escapes without further damage. Otherwise she gets out badly hurt."
  ],
  win: "Captain Concierge chimes in, asking where they'd like to go. Nova Rush is theirs, and the future is in their hands.",
  roles: [
    { key: "skill", label: "Skill check" },
    { key: "pilot", label: "Piloting" },
    { key: "gunner", label: "Gunner — ranged Strike" }
  ]
};

/* -------------------------------------------------- the cinematic version
   The adventure resolves the escape with one check each. This runs it instead
   as a Cinematic Starship Scene (SF2e GM Core): encounter mode, roles reset
   every round, PCs may switch between rounds, and a Victory Point track for
   the victory condition.

   The scene itself — which roles, which actions, the VP goal and the hull
   clock — is the GM's to design under those rules, so this is one build of it,
   pitched at the adventure's own DC 15. Every modifier the book grants still
   applies: the reactor lowers DCs, an ally gives a circumstance bonus, and the
   missile launcher opens the second gunner seat. */
const SCENE = {
  goal: 10,
  hull: 6,
  maxRounds: 5,
  brief: "Nova Rush breaks for open space with Corpse Fleet raiders on her tail. Roles reset at the top of each round and a PC may take a different one; each action is 2 actions, leaving a spare for something else.",
  initiative: "Roll initiative with the skill your role uses — Piloting for the pilot, Computers or Perception for the science officer, and so on.",
  volley: "At the end of each round the raiders fire: Nova Rush takes 1 hull. A critical success anywhere in the round means the shot goes wide instead.",
  ends: [
    "Reach the Victory Point goal and Nova Rush breaks away clean — the adventure's better ending.",
    "Hull reaches zero, or the rounds run out, and she escapes severely damaged — the adventure's other ending. She is disabled, never destroyed.",
    "Either way, the ship is theirs."
  ]
};

/* vp and hull are deltas. Anything not listed is zero. */
const ROLES = {
  captain: { label: "Captain", tone: "gold", seats: 1,
    action: "Rally the Crew", skills: "Diplomacy or Intimidation",
    text: "Orders, encouragement, or an insult aimed at the raiders — whatever gets the next station moving.",
    outcome: { cs: { vp: 1, note: "and one crewmate may reroll their check this round" },
               s: { vp: 0, note: "the next PC to act this round gets a +1 circumstance bonus" },
               f: {}, cf: { vp: -1, note: "the wrong order at the wrong moment" } } },

  pilot: { label: "Pilot", tone: "slate", seats: 2, required: true,
    action: "Evasive Burn", skills: "Piloting",
    text: "Throw Nova Rush through the debris and the raiders' firing solutions.",
    outcome: { cs: { vp: 2, note: "and this round's volley goes wide" },
               s: { vp: 1 }, f: {}, cf: { hull: -1, note: "she clips something" } } },

  gunner: { label: "Gunner", tone: "rust", seats: 1, seatsWithLauncher: 2,
    action: "Fire at Will", skills: "a ranged Strike, or Computers to let the turret aim",
    text: "Keep the raiders at arm's length. The second seat only opens if the missile launcher was unjammed.",
    outcome: { cs: { vp: 2 }, s: { vp: 1 }, f: {}, cf: { hull: -1, note: "a misfire in the tube" } } },

  engineer: { label: "Engineer", tone: "ember", seats: 2,
    action: "Reroute Power", skills: "Crafting or Computers",
    text: "Patch what the raiders keep breaking. Brinn Aids this one gladly; Polly drinks the feedback.",
    outcome: { cs: { hull: 2 }, s: { hull: 1 }, f: {},
               cf: { hull: -1, note: "unless Polly is aboard to swallow the surge" } } },

  science: { label: "Science Officer", tone: "moss", seats: 2,
    action: "Read the Void", skills: "Computers, Perception, or an applicable Lore",
    text: "Find the gap in the pursuit and call it out before it closes.",
    outcome: { cs: { vp: 1, note: "and the next PC this round gets a +2 circumstance bonus" },
               s: { vp: 0, note: "the next PC this round gets a +1 circumstance bonus" },
               f: {}, cf: {} } },

  magic: { label: "Magic Officer", tone: "plum", seats: 2,
    action: "Ward the Hull", skills: "Arcana, Nature, Occultism, or Religion",
    text: "The raiders' guns fire something worse than plasma. Meet it in kind.",
    outcome: { cs: { vp: 1, hull: 1 }, s: { hull: 1 }, f: {}, cf: { hull: -1 } } }
};

const DEGREES = [["cs", "Crit success"], ["s", "Success"], ["f", "Failure"], ["cf", "Crit failure"]];

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "brig", pcs,
    brig: { mods: {}, escaped: null, brinnHelped: false, compartment: false },
    areas: {},          // area key -> cleared
    repairs: { reactor: false, launcher: false },
    allies: { brinn: false, polly: false },
    sinkwell: { successes: 0, active: false, defeated: false },
    round: 0,
    lastDamage: null,
    mode: "book",       // "book" = the printed single check, "cinematic" = the scene
    crew: {},           // pc index -> { role, result }
    /* One entry per round: { assign: {pcIndex: roleKey}, results: {pcIndex: degree} }.
       Totals are replayed from this rather than accumulated, so un-ticking any
       result rolls the whole scene back exactly. */
    scene: { rounds: [{ assign: {}, results: {} }] },
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
  if (!game.settings.settings.has(NR_ID)) {
    game.settings.register(NR_NS, NR_KEY, { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const areaFor = (key) => AREAS.find(a => a.key === key);

/* ----------------------------------------------------------------- engine */
class NovaRush {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(NR_NS, NR_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  /* ----- brig ----- */
  dcFor(method) {
    const m = BRIG.methods.find(x => x.key === method);
    if (!m?.mod) return null;
    return this.s.brig.mods[m.mod.key] ? m.mod.delta : 0;
  }
  toggleMod(key) {
    const on = !!this.s.brig.mods[key];
    if (on) delete this.s.brig.mods[key]; else this.s.brig.mods[key] = true;
    this.touch();
  }
  setEscape(how) {
    this.s.brig.escaped = this.s.brig.escaped === how ? null : how;
    /* Only a party that got itself out finds the smuggling compartment; if the
       attack shorts the door open, the compartment stays hidden. */
    if (this.s.brig.escaped === "shorted") { this.s.brig.compartment = false; this.s.brig.brinnHelped = false; }
    this.log(`Brig: ${this.s.brig.escaped ?? "unresolved"}.`);
    this.touch();
  }
  toggleBrigFlag(key) {
    this.s.brig[key] = !this.s.brig[key];
    if (key === "brinnHelped" && this.s.brig.brinnHelped) this.s.brig.compartment = true;
    this.touch();
  }

  /* ----- objectives ----- */
  toggleRepair(key) {
    this.s.repairs[key] = !this.s.repairs[key];
    const r = REPAIRS[key];
    ui.notifications.info(`${r.name} — ${this.s.repairs[key] ? "repaired" : "still broken"}.`);
    this.log(`${r.area}: ${r.name} ${this.s.repairs[key] ? "repaired" : "reopened"}.`);
    this.touch();
  }
  toggleAlly(key) {
    this.s.allies[key] = !this.s.allies[key];
    this.log(`${ALLIES[key].name}: ${this.s.allies[key] ? "recruited" : "not helping"}.`);
    this.touch();
  }
  toggleArea(key) {
    const on = !!this.s.areas[key];
    this.s.areas[key] = !on;
    this.log(`${areaFor(key).id}: ${on ? "reopened" : "cleared"}.`);
    this.touch();
  }

  /* ----- the sinkwell ----- */
  bumpSinkwell(n) {
    const sw = this.s.sinkwell;
    sw.successes = Math.max(0, Math.min(SINKWELL.successes, sw.successes + n));
    sw.defeated = sw.successes >= SINKWELL.successes;
    if (sw.defeated) {
      sw.active = false;
      ui.notifications.info("The sinkwell is disabled — Polly owes them one.");
      this.log("Spiritual Sinkwell disabled.");
    }
    this.touch();
  }
  toggleSinkwell() {
    const sw = this.s.sinkwell;
    sw.active = !sw.active;
    if (sw.active) this.postCard("Hazard 1 · complex haunt", SINKWELL.name,
      `<p style="margin:0 0 6px">${SINKWELL.wave}</p><p style="margin:0;font-size:11px">${SINKWELL.reset}</p>`, "plum");
    this.touch();
  }

  /* ----- the bridge fight ----- */
  async rollBattleDamage() {
    const roll = await (new Roll("1d4")).evaluate();
    const face = BRIDGE.damage[roll.total - 1];
    this.s.round += 1;
    this.s.lastDamage = face.roll;
    await this.postCard(`Round ${this.s.round} · battle damage`, face.label,
      `<p style="margin:0">${linkify(face.text)}</p>`, "rust");
    if (face.fx) this.fx(face.fx);        // fires only if Sequencer is up
    this.log(`Round ${this.s.round}: ${face.label}.`);
    this.touch();
  }
  resetRounds() { this.s.round = 0; this.s.lastDamage = null; this.touch(); }

  /* ----- the escape check ----- */
  get escapeDC() { return ESCAPE.base - (this.s.repairs.reactor ? 1 : 0); }
  get escapeBonus() { return (this.s.allies.brinn || this.s.allies.polly) ? 1 : 0; }
  get gunnerSlots() { return this.s.repairs.launcher ? 2 : 1; }

  crewOf(i) { return this.s.crew[i] ?? { role: "skill", result: null }; }
  setRole(i, role) {
    const c = this.crewOf(i);
    this.s.crew[i] = { ...c, role };
    this.touch();
  }
  setResult(i, result) {
    const c = this.crewOf(i);
    this.s.crew[i] = { ...c, result: c.result === result ? null : result };
    this.touch();
  }

  get escapeState() {
    const rows = this.s.pcs.map((pc, i) => ({ pc, i, ...this.crewOf(i) }));
    const gunners = rows.filter(r => r.role === "gunner").length;
    const pilots = rows.filter(r => r.role === "pilot").length;
    const passed = rows.filter(r => r.result === "success").length;
    const rolled = rows.filter(r => r.result).length;
    const need = Math.ceil(rows.length / 2);
    return {
      rows, gunners, pilots, passed, rolled, need,
      overGunned: gunners > this.gunnerSlots,
      noPilot: pilots === 0,
      clean: passed >= need,
      resolved: rolled === rows.length
    };
  }

  /* ----- effects -----
     Everything here is feature-detected. Sequencer's API surface has moved
     between major versions and JB2A's free and Patreon libraries hold
     different files, so nothing is assumed to exist. */
  get fxReady() {
    return !!(globalThis.Sequencer && game.modules?.get("sequencer")?.active);
  }
  resolveFx(key) {
    const cue = FX[key];
    if (!cue) return null;
    if (!this.fxReady) return null;
    const db = globalThis.Sequencer.Database;
    for (const f of cue.files) {
      const exists = typeof db?.entryExists === "function" ? db.entryExists(f)
        : typeof db?.getEntry === "function" ? !!db.getEntry(f) : false;
      if (exists) return f;
    }
    return null;
  }
  /* A cue with no art but a shake is still playable; one that needs art and
     has none is not. */
  fxStatus(key) {
    const cue = FX[key];
    if (!this.fxReady) return { state: "off", detail: "Sequencer not detected" };
    const file = this.resolveFx(key);
    if (file) return { state: "ok", detail: file };
    if (!cue.files.length && cue.shake) return { state: "ok", detail: "camera shake only" };
    return { state: "missing", detail: "no matching JB2A file installed" };
  }

  async fx(key) {
    const cue = FX[key];
    if (!cue) return;
    if (!this.fxReady) return ui.notifications.info("Sequencer isn't active — no effect played.");
    const file = this.resolveFx(key);
    if (!file && !cue.shake) {
      return ui.notifications.warn(`No JB2A file found for "${cue.label}". Set your own key in the FX tab's list.`);
    }
    try {
      const seq = new globalThis.Sequence();
      if (file) {
        const targets = cue.target === "selected" ? (canvas?.tokens?.controlled ?? []) : [];
        if (cue.screen || !targets.length) {
          /* Screen space keeps a ship-wide cue from needing a token selected. */
          const e = seq.effect().file(file).scale(cue.scale ?? 1);
          if (typeof e.screenSpace === "function") e.screenSpace().screenSpaceAnchor({ x: 0.5, y: 0.5 });
          else if (canvas?.scene) e.atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 });
        } else {
          for (const t of targets) seq.effect().file(file).atLocation(t).scale(cue.scale ?? 1);
        }
      }
      if (cue.shake && typeof seq.canvasPan === "function") {
        const pan = seq.canvasPan();
        if (typeof pan.shake === "function") pan.shake(cue.shake);
      }
      await seq.play();
    } catch (err) {
      console.error("Nova Rush | effect failed", err);
      ui.notifications.warn(`Couldn't play "${cue.label}" — see the console. The rest of the macro is unaffected.`);
    }
  }

  /* ----- the cinematic scene -----
     Totals are derived by replaying every recorded round, so any result can be
     un-ticked and the track rewinds exactly. */
  get rounds() { return this.s.scene.rounds; }
  get roundNo() { return this.rounds.length; }

  seatsFor(role) {
    const r = ROLES[role];
    if (role === "gunner") return this.s.repairs.launcher ? r.seatsWithLauncher : r.seats;
    return r.seats;
  }

  sceneTotals() {
    let vp = 0, hull = SCENE.hull;
    const volleys = [];
    this.rounds.forEach((rd, idx) => {
      let critHere = false;
      for (const [i, degree] of Object.entries(rd.results ?? {})) {
        const role = rd.assign?.[i];
        if (!role || !degree) continue;
        const out = ROLES[role].outcome[degree] ?? {};
        if (degree === "cs") critHere = true;
        vp += out.vp ?? 0;
        /* Polly drinks the feedback the engineer would otherwise eat. */
        const spared = role === "engineer" && degree === "cf" && this.s.allies.polly;
        if (!spared) hull += out.hull ?? 0;
      }
      /* The volley lands at the end of a round the table has finished. */
      const finished = idx < this.rounds.length - 1;
      const wide = critHere;
      if (finished) { volleys.push(wide ? 0 : -1); hull += wide ? 0 : -1; }
    });
    vp = Math.max(0, vp);
    hull = Math.max(0, Math.min(SCENE.hull, hull));
    const outOfRounds = this.roundNo > SCENE.maxRounds;
    return {
      vp, hull, volleys,
      won: vp >= SCENE.goal,
      lost: hull <= 0 || (outOfRounds && vp < SCENE.goal),
      over: vp >= SCENE.goal || hull <= 0 || outOfRounds
    };
  }

  /* Seats are advisory — the console flags an overfull role rather than
     blocking it, because a GM may well allow it. */
  seatUse(roleKey) {
    const rd = this.rounds[this.roundNo - 1];
    return Object.values(rd.assign ?? {}).filter(r => r === roleKey).length;
  }
  assignRole(i, role) {
    const rd = this.rounds[this.roundNo - 1];
    rd.assign = rd.assign ?? {};
    if (rd.assign[i] === role) { delete rd.assign[i]; delete rd.results?.[i]; }
    else rd.assign[i] = role;
    this.touch();
  }
  setDegree(i, degree) {
    const rd = this.rounds[this.roundNo - 1];
    if (!rd.assign?.[i]) return ui.notifications.warn("Give them a role first.");
    rd.results = rd.results ?? {};
    if (rd.results[i] === degree) delete rd.results[i]; else rd.results[i] = degree;
    this.touch();
  }
  nextRound() {
    if (this.roundNo >= SCENE.maxRounds + 1) return ui.notifications.warn("The scene is out of rounds.");
    const prev = this.rounds[this.roundNo - 1];
    this.rounds.push({ assign: { ...(prev.assign ?? {}) }, results: {} });
    this.log(`Escape round ${this.roundNo}.`);
    this.touch();
  }
  undoRound() {
    if (this.roundNo <= 1) return;
    this.rounds.pop();
    this.touch();
  }
  resetScene() {
    this.s.scene = { rounds: [{ assign: {}, results: {} }] };
    this.touch();
  }
  setMode(mode) { this.s.mode = mode; this.touch(); }

  async postSceneStatus() {
    const t = this.sceneTotals();
    return this.postCard(`Round ${this.roundNo} of ${SCENE.maxRounds}`, "Nova Rush — breaking away",
      `<p style="margin:0 0 6px"><b>Victory Points</b> ${t.vp} of ${SCENE.goal} · <b>Hull</b> ${t.hull} of ${SCENE.hull}</p>
       <p style="margin:0">${t.won ? "She's clear." : t.lost ? "She's out, and badly hurt." : "Still running."}</p>`,
      t.won ? "moss" : t.lost ? "rust" : "slate");
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Battle for Nova Rush reset.");
    this.touch();
  }

  /* ----- chat and compendium ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "slate") {
    const C = { ember: "#f0a13c", moss: "#4fd6a0", slate: "#54a8dd", plum: "#a279e6",
                gold: "#f2d16b", rust: "#e0563d", muted: "#8598ab" };
    await ChatMessage.create({
      content: `<div style="background:#161c24;color:#d9e3ee;border:1px solid #2b3846;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.slate};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#8598ab">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "Nova Rush" }
    });
  }

  async openActor(which) {
    const uuid = UUIDS[which];
    if (typeof fromUuid !== "function") return ui.notifications.warn("No compendium available here.");
    const doc = await fromUuid(uuid);
    if (!doc) return ui.notifications.error(`Not found: ${uuid}. Is the sf2e system's bestiary compendium available?`);
    doc.sheet.render(true);
  }

  postBoxed(key) {
    if (key === "brig") return this.postCard("A1 · Brig", "Battle for Nova Rush",
      `<p style="margin:0;font-style:italic">${BRIG.boxed}</p>`, "slate");
    if (key === "attack") return this.postCard("A1 · the Corpse Fleet strikes", "We're Under Attack!",
      `<p style="margin:0;font-style:italic">${BRIG.attack.boxed}</p>`, "rust");
    if (key === "concierge") return this.postCard("A2 · after the pirates", "Captain Concierge",
      `<p style="margin:0;font-style:italic">${CONCIERGE.hello}</p>`, "moss");
    if (key === "bridge") return this.postCard("B5 · Bridge", "Captain Phaedra Firestorm",
      `<p style="margin:0 0 6px">${BRIDGE.boxed}</p><p style="margin:0;font-style:italic">“${BRIDGE.quote}”</p>`, "rust");
    const a = areaFor(key);
    if (a?.boxed) return this.postCard(`${a.id}${a.level ? ` · ${a.level}` : ""}`, a.name,
      `<p style="margin:0;font-style:italic">${a.boxed}</p>`, a.tone);
    return ui.notifications.warn("Nothing to read aloud for that area.");
  }

  postStatus() {
    const r = this.s.repairs, al = this.s.allies;
    const yes = (v) => v ? "yes" : "no";
    return this.postCard("Battle for Nova Rush", "Ship status",
      `<p style="margin:0 0 6px"><b>Reactor</b> ${yes(r.reactor)} · <b>Missile launcher</b> ${yes(r.launcher)}</p>
       <p style="margin:0 0 6px"><b>Brinn</b> ${yes(al.brinn)} · <b>Polly</b> ${yes(al.polly)}</p>
       <p style="margin:0"><b>Escape DC</b> ${this.escapeDC}${this.escapeBonus ? `, with a +${this.escapeBonus} circumstance bonus` : ""} · <b>gunner slots</b> ${this.gunnerSlots}</p>`,
      "gold");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class NRApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "nr-console", tag: "div", classes: ["nr-console"],
    position: { width: 920, height: "auto" },
    window: { title: "Battle for Nova Rush", icon: "fa-solid fa-rocket", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "nr-console", classes: ["nr-console"], title: "Battle for Nova Rush",
      width: 920, height: "auto", resizable: true
    });
  }
  get title() { return "Battle for Nova Rush"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="nr-root">${this.markup()}</div>`);
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
      <div class="nr">
        ${this.header(ro)}
        <nav class="tabs">
          ${TABS.map(x => `<button type="button" class="tab ${s.tab === x.key ? "on" : ""}" data-act="tab" data-k="${x.key}">
            <b>${x.label}</b><small>${x.sub}</small></button>`).join("")}
        </nav>
        ${s.tab === "brig" ? this.brigTab(ro) : ""}
        ${s.tab === "lower" ? this.deckTab("lower", ro) : ""}
        ${s.tab === "upper" ? this.deckTab("upper", ro) : ""}
        ${s.tab === "bridge" ? this.bridgeTab(ro) : ""}
        ${s.tab === "escape" ? (s.mode === "cinematic" ? this.sceneTab(ro) : this.escapeTab(ro)) : ""}
        ${s.tab === "fx" ? this.fxTab(ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t, r = t.s.repairs, al = t.s.allies;
    const lamp = (on, label, title) => `<span class="lamp ${on ? "lit" : ""}" title="${title}"><i class="fa-solid fa-circle"></i>${label}</span>`;
    return `
      <header class="topbar">
        <div class="lamps">
          ${lamp(r.reactor, "Reactor", "A8 — reduces the escape DC by 1")}
          ${lamp(r.launcher, "Launcher", "B2 — adds a second gunner slot")}
          ${lamp(al.brinn, "Brinn", "A6 — +1 circumstance to the escape")}
          ${lamp(al.polly, "Polly", "B1 — +1 circumstance, and soaks the reactor's shock")}
        </div>
        <div class="dcbox">
          <span>Escape DC</span><b>${t.escapeDC}${t.escapeBonus ? ` −${t.escapeBonus}` : ""}</b>
        </div>
        <button type="button" class="say" data-act="poststatus" title="Post ship status"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset the adventure" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  creatureRow(list) {
    return `<div class="crew">
      ${list.map(c => `
        <button type="button" class="mon" data-act="actor" data-k="${c.uuid}" title="Open the compendium actor">
          <i class="fa-solid fa-skull"></i>${c.n > 1 ? `${c.n} × ` : ""}${c.name}${c.note ? ` <em>${c.note}</em>` : ""}
        </button>`).join("")}
    </div>`;
  }

  /* ---------------------------------------------------------------- brig */
  brigTab(ro) {
    const t = this.t, b = t.s.brig;
    return `
      <section class="panel" style="--tone:var(--slate)">
        <h3>A1. Brig <small>the party starts here</small>
          <button type="button" class="say" data-act="postboxed" data-k="brig" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="boxed">${BRIG.boxed}</p>
        <p class="text">${BRIG.setup}</p>
        <p class="text">${BRIG.brinn}</p>
        <p class="quote">“${BRIG.quote}”</p>
      </section>

      <div class="grid">
        ${BRIG.methods.map(m => {
          const delta = m.mod && b.mods[m.mod.key] ? m.mod.delta : 0;
          return `
          <article class="panel" style="--tone:var(--${m.tone})">
            <h3>${m.label}${delta ? `<span class="lvl">${delta} DC</span>` : ""}</h3>
            <p class="dcs">${m.base}</p>
            ${m.mod ? `<label class="check"><input type="checkbox" data-act="brigmod" data-k="${m.mod.key}" ${b.mods[m.mod.key] ? "checked" : ""} ${ro ? "disabled" : ""}>
              ${m.mod.label} <span class="pip">${m.mod.delta} DC</span></label>` : ""}
            ${m.note ? `<p class="note">${m.note}</p>` : ""}
          </article>`;
        }).join("")}
      </div>

      <section class="panel">
        <h3>If none of that works</h3>
        <ul class="checks">${BRIG.fallback.map(f => `<li>${f}</li>`).join("")}</ul>
      </section>

      <section class="panel" style="--tone:var(--ember)">
        <h3>How they got out</h3>
        <div class="btnrow">
          ${[["own", "Out on their own"], ["brinn", "Brinn let them out"], ["shorted", "Never escaped — the attack shorted the door"]]
            .map(([k, label]) => `<button type="button" class="opt ${b.escaped === k ? "on" : ""}" data-act="escaped" data-k="${k}" ${ro ? "disabled" : ""}>${label}</button>`).join("")}
        </div>
        <p class="text">${BRIG.development}</p>
        <label class="check"><input type="checkbox" data-act="brigflag" data-k="compartment" ${b.compartment ? "checked" : ""} ${ro || b.escaped === "shorted" ? "disabled" : ""}>
          Smuggling compartment found</label>
        <p class="loot"><b>Treasure</b> ${BRIG.treasure}</p>
      </section>

      <section class="panel" style="--tone:var(--rust)">
        <h3>We're Under Attack! <small>fires however the escape went</small>
          <button type="button" class="say" data-act="postboxed" data-k="attack" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="boxed">${BRIG.attack.boxed}</p>
        <p class="note">${BRIG.attack.fail}</p>
        <div class="btnrow">
          <button type="button" class="primary" data-act="fx" data-k="attack">
            <i class="fa-solid fa-wand-sparkles"></i> Play the hit
          </button>
        </div>
      </section>`;
  }

  /* --------------------------------------------------------------- decks */
  deckTab(deck, ro) {
    const t = this.t;
    const areas = AREAS.filter(a => a.deck === deck).map(a => this.areaCard(a, ro)).join("");
    if (deck === "lower") {
      return `${this.areaCard(areaFor("a2"), ro)}
              ${this.conciergePanel()}
              ${AREAS.filter(a => a.deck === "lower" && a.key !== "a2").map(a =>
                a.key === "a6" ? this.areaCard(a, ro) + this.allyPanel("brinn", ro)
                : a.key === "a8" ? this.areaCard(a, ro) + this.repairPanel("reactor", ro)
                : this.areaCard(a, ro)).join("")}`;
    }
    return `${this.areaCard(areaFor("b1"), ro)}
            ${this.sinkwellPanel(ro)}
            ${this.allyPanel("polly", ro)}
            ${this.areaCard(areaFor("b2"), ro)}
            ${this.repairPanel("launcher", ro)}
            ${AREAS.filter(a => ["b3", "b4"].includes(a.key)).map(a => this.areaCard(a, ro)).join("")}`;
  }

  areaCard(a, ro) {
    const t = this.t, cleared = !!t.s.areas[a.key];
    return `
      <section class="panel area ${cleared ? "done" : ""}" style="--tone:var(--${a.tone})">
        <h3><span class="eid">${a.id}</span>${a.name}
          ${a.level ? `<span class="lvl">${a.level}</span>` : ""}
          ${a.boxed ? `<button type="button" class="say" data-act="postboxed" data-k="${a.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>` : ""}
        </h3>
        ${a.boxed ? `<p class="boxed">${a.boxed}</p>` : ""}
        ${a.creatures ? this.creatureRow(a.creatures) : ""}
        ${a.text ? `<p class="text">${a.text}</p>` : ""}
        ${a.quote ? `<p class="quote">“${a.quote}”</p>` : ""}
        ${a.branches ? a.branches.map(([when, line]) => `<p class="branch"><b>${when}</b> “${line}”</p>`).join("") : ""}
        ${a.knowledge ? `
          <div class="know">
            <div class="subhead">Recall Knowledge — the Corpse Fleet</div>
            <p class="dcs">${a.knowledge.lead}</p>
            ${a.knowledge.degrees.map(([d, txt]) => `<p class="deg"><b>${d}</b> ${txt}</p>`).join("")}
          </div>` : ""}
        ${a.note ? `<p class="note">${a.note}</p>` : ""}
        ${a.treasure ? `<p class="loot"><b>Treasure</b> ${a.treasure}</p>` : ""}
        <div class="btnrow">
          <button type="button" class="${cleared ? "ghost" : "primary"}" data-act="area" data-k="${a.key}" ${ro ? "disabled" : ""}>
            ${cleared ? "Reopen" : "Mark done"}
          </button>
        </div>
      </section>`;
  }

  conciergePanel() {
    return `
      <section class="panel" style="--tone:var(--moss)">
        <h3>Greetings from the Captain <small>after A2 is won</small>
          <button type="button" class="say" data-act="postboxed" data-k="concierge" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="text">${CONCIERGE.intro}</p>
        <p class="quote">“${CONCIERGE.hello}”</p>
        <div class="qa">${CONCIERGE.qa.map(([q, a]) => `<p><b>${q}</b> “${a}”</p>`).join("")}</div>
        <p class="quote">“${CONCIERGE.brief}”</p>
        <p class="note">${CONCIERGE.hit}</p>
      </section>`;
  }

  repairPanel(key, ro) {
    const t = this.t, r = REPAIRS[key], done = t.s.repairs[key];
    return `
      <section class="panel repair ${done ? "done" : ""}" style="--tone:var(--${r.tone})">
        <h3><i class="fa-solid fa-screwdriver-wrench"></i> ${r.name} <small>${r.area}</small>
          ${done ? `<span class="lvl">repaired</span>` : ""}</h3>
        <p class="dcs">${r.check}</p>
        <p class="note">${r.cost}</p>
        ${r.polly ? `<p class="note">${t.s.allies.polly ? "<b>Polly is helping</b> — " : ""}${r.polly}</p>` : ""}
        <p class="bonus">${r.pays}</p>
        <div class="btnrow">
          ${key === "reactor" ? `<button type="button" class="ghost" data-act="fx" data-k="reactor"><i class="fa-solid fa-bolt"></i> Shock</button>` : ""}
          <button type="button" class="${done ? "ghost" : "primary"}" data-act="repair" data-k="${key}" ${ro ? "disabled" : ""}>
            ${done ? "Mark unrepaired" : "Mark repaired"}
          </button>
        </div>
      </section>`;
  }

  allyPanel(key, ro) {
    const t = this.t, a = ALLIES[key], got = t.s.allies[key];
    return `
      <section class="panel ally ${got ? "on" : ""}" style="--tone:var(--${a.tone})">
        <h3><i class="fa-solid fa-handshake-angle"></i> ${a.name} <small>${a.who}</small>
          <span class="lvl">${a.where}</span></h3>
        <p class="dcs">${a.ask}</p>
        <p class="text">${a.limits}</p>
        <p class="note">${a.skills}</p>
        ${a.danger ? `<p class="danger">${a.danger}</p>` : ""}
        <p class="bonus">+1 circumstance bonus to every PC's escape check.</p>
        <div class="btnrow">
          <button type="button" class="${got ? "ghost" : "primary"}" data-act="ally" data-k="${key}" ${ro ? "disabled" : ""}>
            ${got ? "Not helping after all" : "Recruited"}
          </button>
        </div>
      </section>`;
  }

  sinkwellPanel(ro) {
    const t = this.t, sw = t.s.sinkwell;
    const pips = Array.from({ length: SINKWELL.successes }, (_, i) =>
      `<span class="pipdot ${i < sw.successes ? "on" : ""}"></span>`).join("");
    return `
      <section class="panel hazard ${sw.defeated ? "done" : sw.active ? "live" : ""}" style="--tone:var(--plum)">
        <h3><span class="eid">B1</span>${SINKWELL.name} <span class="lvl">${SINKWELL.level}</span>
          ${SINKWELL.traits.map(x => `<span class="pip">${x}</span>`).join("")}
        </h3>
        <p class="text">${SINKWELL.trigger}</p>
        <p class="note">${SINKWELL.aim}</p>
        <p class="dcs">${SINKWELL.stealth}</p>
        <p class="text"><b>Soul-Draining Wave</b> ${SINKWELL.wave}</p>
        <p class="text"><b>Routine</b> ${SINKWELL.routine}</p>
        <p class="text"><b>Void lash</b> ${SINKWELL.lash}</p>
        <p class="note">${SINKWELL.reset}</p>

        <div class="disable">
          <div class="subhead">Disable — three total successes</div>
          ${SINKWELL.disable.map(d => `<p class="dcs sm">${d.label}</p>`).join("")}
          <div class="counter">
            <button type="button" class="qbtn" data-act="sink" data-n="-1" ${ro || sw.successes === 0 ? "disabled" : ""}>−</button>
            <span class="pips">${pips}</span>
            <b>${sw.successes} of ${SINKWELL.successes}</b>
            <button type="button" class="qbtn" data-act="sink" data-n="1" ${ro || sw.defeated ? "disabled" : ""}>+</button>
            <button type="button" class="ghost" data-act="sinktoggle" ${ro ? "disabled" : ""}>
              ${sw.active ? "Stand it down" : "Trigger the wave"}
            </button>
            <button type="button" class="ghost" data-act="fx" data-k="sinkwell"><i class="fa-solid fa-wand-sparkles"></i> Effect</button>
          </div>
          ${sw.defeated ? `<p class="bonus">Disabled — “Guess I owe you one!” Polly will help with the reactor.</p>` : ""}
        </div>
      </section>`;
  }

  /* -------------------------------------------------------------- bridge */
  bridgeTab(ro) {
    const t = this.t, s = t.s;
    return `
      <section class="panel" style="--tone:var(--rust)">
        <h3><span class="eid">B5</span>Bridge <span class="lvl">Moderate 1</span>
          <button type="button" class="say" data-act="postboxed" data-k="bridge" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="boxed">${BRIDGE.boxed}</p>
        ${this.creatureRow(BRIDGE.creatures)}
        <p class="quote">“${BRIDGE.quote}”</p>
        <ul class="checks">${BRIDGE.tactics.map(x => `<li>${x}</li>`).join("")}</ul>
      </section>

      <section class="panel dmg" style="--tone:var(--ember)">
        <h3><i class="fa-solid fa-burst"></i> Battle damage <small>one at the start of every round</small>
          <span class="lvl">round ${s.round}</span>
        </h3>
        <div class="btnrow">
          <button type="button" class="primary" data-act="rolldmg" ${ro ? "disabled" : ""}>
            <i class="fa-solid fa-dice-d20"></i> Roll and post the next round
          </button>
          <button type="button" class="ghost" data-act="resetrounds" ${ro ? "disabled" : ""}>Reset the counter</button>
        </div>
        <div class="faces">
          ${BRIDGE.damage.map(d => `
            <div class="face ${s.lastDamage === d.roll ? "hit" : ""}">
              <b>${d.roll}</b><span><i>${d.label}</i> ${d.text}</span>
            </div>`).join("")}
        </div>
      </section>`;
  }

  /* -------------------------------------------------------------- escape */
  modeSwitch(ro) {
    const t = this.t;
    return `
      <div class="modes">
        <span class="subhead">How you're running it</span>
        <button type="button" class="opt ${t.s.mode === "book" ? "on" : ""}" data-act="mode" data-k="book" ${ro ? "disabled" : ""}>As printed — one check each</button>
        <button type="button" class="opt ${t.s.mode === "cinematic" ? "on" : ""}" data-act="mode" data-k="cinematic" ${ro ? "disabled" : ""}>Cinematic starship scene</button>
      </div>`;
  }

  /* ------------------------------------------------------ cinematic scene */
  sceneTab(ro) {
    const t = this.t, totals = t.sceneTotals(), dc = t.escapeDC, bonus = t.escapeBonus;
    const rd = t.rounds[t.roundNo - 1];
    const vpPct = Math.min(100, Math.round((totals.vp / SCENE.goal) * 100));
    const hullPct = Math.round((totals.hull / SCENE.hull) * 100);
    return `
      ${this.modeSwitch(ro)}

      <section class="panel scenebar" style="--tone:var(--gold)">
        <h3>Breaking away <small>round ${t.roundNo} of ${SCENE.maxRounds}</small>
          <button type="button" class="say" data-act="postscene" title="Post the scene's standing"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <div class="tracks">
          <div class="track">
            <div class="tlabel"><span>Victory Points</span><b>${totals.vp} / ${SCENE.goal}</b></div>
            <div class="bar"><span class="vp" style="width:${vpPct}%"></span></div>
          </div>
          <div class="track">
            <div class="tlabel"><span>Hull</span><b>${totals.hull} / ${SCENE.hull}</b></div>
            <div class="bar"><span class="hull ${totals.hull <= 2 ? "low" : ""}" style="width:${hullPct}%"></span></div>
          </div>
          <div class="track thin">
            <div class="tlabel"><span>Each check</span><b>DC ${dc}${bonus ? ` (+${bonus})` : ""}</b></div>
            <div class="tnote">${t.s.repairs.reactor ? "Reactor repaired — DC −1. " : ""}${bonus ? "An ally is assisting — +1 circumstance." : "No ally assisting."}</div>
          </div>
        </div>
        <p class="text">${SCENE.brief}</p>
        <p class="note">${SCENE.initiative}</p>
        <p class="note">${SCENE.volley}</p>
      </section>

      ${totals.over ? `
      <section class="panel verdict ${totals.won ? "good" : "bad"}" style="--tone:var(--${totals.won ? "moss" : "rust"})">
        <h3>${totals.won ? "Clear of the Corpse Fleet" : "Out, and badly hurt"}</h3>
        <p class="text">${totals.won
          ? "Nova Rush breaks away without sustaining further damage — the adventure's better ending."
          : "Nova Rush escapes severely damaged. She is disabled, never destroyed, and she is still theirs."}</p>
        <p class="quote">${ESCAPE.win}</p>
        <div class="btnrow">
          <button type="button" class="primary" data-act="fx" data-k="escape">
            <i class="fa-solid fa-wand-sparkles"></i> Play the breakaway
          </button>
        </div>
      </section>` : ""}

      <section class="panel">
        <h3>This round's stations <small>roles reset every round</small></h3>
        <div class="crewgrid">
          ${t.s.pcs.map((pc, i) => {
            const role = rd.assign?.[i] ?? null;
            const degree = rd.results?.[i] ?? null;
            return `
              <div class="scenerow ${degree ? "res-" + degree : ""}">
                <img src="${pc.img}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
                <div class="cn">${esc(pc.name)}</div>
                <div class="roles">
                  ${Object.entries(ROLES).map(([k, r]) => {
                    const used = t.seatUse(k), full = used >= t.seatsFor(k) && role !== k;
                    return `<button type="button" class="opt sm ${role === k ? "on" : ""} ${full ? "full" : ""}"
                      data-act="assign" data-i="${i}" data-k="${k}" ${ro ? "disabled" : ""}
                      title="${r.action} — ${r.skills}${full ? " · every seat taken" : ""}">${r.label}</button>`;
                  }).join("")}
                </div>
                <div class="res">
                  ${DEGREES.map(([d, label]) => `<button type="button" class="opt sm deg-${d} ${degree === d ? "on" : ""}"
                    data-act="degree" data-i="${i}" data-k="${d}" ${ro || !role ? "disabled" : ""}>${label}</button>`).join("")}
                </div>
              </div>`;
          }).join("")}
        </div>
        <div class="btnrow" style="margin-top:.5rem">
          <button type="button" class="primary" data-act="nextround" ${ro || totals.over ? "disabled" : ""}>
            <i class="fa-solid fa-forward"></i> End the round — raiders fire
          </button>
          <button type="button" class="ghost" data-act="undoround" ${ro || t.roundNo <= 1 ? "disabled" : ""}>Undo the round</button>
          <button type="button" class="ghost" data-act="resetscene" ${ro ? "disabled" : ""}>Reset the scene</button>
        </div>
        ${totals.volleys.length ? `<p class="hint">Volleys so far: ${totals.volleys.map((v, i) => `round ${i + 1} ${v ? "hit" : "went wide"}`).join(" · ")}.</p>` : ""}
      </section>

      <div class="grid roles">
        ${Object.entries(ROLES).map(([k, r]) => `
          <article class="panel role" style="--tone:var(--${r.tone})">
            <h3>${r.label} <span class="lvl">${t.seatsFor(k)} seat${t.seatsFor(k) === 1 ? "" : "s"}</span></h3>
            <p class="dcs">${r.action} — ${r.skills}</p>
            <p class="text">${r.text}</p>
            <ul class="checks">
              ${DEGREES.map(([d, label]) => {
                const o = r.outcome[d] ?? {};
                const bits = [];
                if (o.vp) bits.push(`${o.vp > 0 ? "+" : ""}${o.vp} VP`);
                if (o.hull) bits.push(`${o.hull > 0 ? "+" : ""}${o.hull} hull`);
                if (o.note) bits.push(o.note);
                return `<li><b>${label}</b> ${bits.length ? bits.join(", ") : "no change"}</li>`;
              }).join("")}
            </ul>
          </article>`).join("")}
      </div>

      <section class="panel">
        <h3>How it ends</h3>
        <ul class="checks">${SCENE.ends.map(x => `<li>${x}</li>`).join("")}</ul>
        <p class="hint">Designed against the SF2e Cinematic Starship Scene framework — roles, per-round role switching, and a Victory Point victory condition — at the adventure's own DC 15.</p>
      </section>`;
  }

  /* ------------------------------------------------------------------ fx */
  fxTab(ro) {
    const t = this.t, ready = t.fxReady;
    return `
      <section class="panel" style="--tone:var(--${ready ? "moss" : "muted"})">
        <h3>Sequencer and JB2A <small>${ready ? "detected" : "not detected"}</small></h3>
        <p class="text">Both modules are optional — everything in this console works without them. When they're active, the cues below fire from their buttons, and the bridge's battle damage plays its own effect as you roll it.</p>
        ${ready ? "" : `<p class="note">Install and enable <b>Sequencer</b> and a <b>JB2A</b> module (the free library covers most of these) and reopen this macro.</p>`}
        <p class="hint">Each cue tries several JB2A database keys and uses the first one your world actually has. If a cue reads “no matching file”, open Sequencer's Database Viewer, find something you like, and put its key at the top of that cue's list in the <code>FX</code> block near the top of this macro.</p>
      </section>

      <section class="panel">
        <h3>Cues</h3>
        <div class="fxlist">
          ${Object.entries(FX).map(([k, cue]) => {
            const st = t.fxStatus(k);
            return `
              <div class="fxrow">
                <span class="dot ${st.state}"></span>
                <div class="fxname"><b>${cue.label}</b><small>${cue.where}</small></div>
                <code class="fxfile">${st.detail}</code>
                <button type="button" class="opt sm" data-act="fx" data-k="${k}" ${ro || !ready ? "disabled" : ""}>Test</button>
              </div>`;
          }).join("")}
        </div>
        <p class="hint">Cues marked “selected” play on the tokens you have selected; ship-wide ones play in screen space and don't need a selection.</p>
      </section>`;
  }

  escapeTab(ro) {
    const t = this.t, e = t.escapeState, dc = t.escapeDC, bonus = t.escapeBonus;
    return `
      ${this.modeSwitch(ro)}
      <section class="panel" style="--tone:var(--gold)">
        <h3>Conclusion <small>the run for it</small></h3>
        <p class="text">${ESCAPE.text}</p>
        <ul class="checks">${ESCAPE.rules.map(x => `<li>${x}</li>`).join("")}</ul>
        <div class="mods">
          <div class="mod ${t.s.repairs.reactor ? "on" : ""}"><span>Reactor</span><b>${t.s.repairs.reactor ? "DC −1" : "no change"}</b></div>
          <div class="mod ${t.s.repairs.launcher ? "on" : ""}"><span>Launcher</span><b>${t.gunnerSlots} gunner${t.gunnerSlots === 1 ? "" : "s"}</b></div>
          <div class="mod ${bonus ? "on" : ""}"><span>Ally</span><b>${bonus ? "+1 circumstance" : "none"}</b></div>
          <div class="mod big"><span>Each PC rolls</span><b>DC ${dc}${bonus ? ` (+${bonus})` : ""}</b></div>
        </div>
      </section>

      <section class="panel">
        <h3>The crew</h3>
        ${e.noPilot ? `<p class="danger">Nobody is on Piloting — at least one PC must use it.</p>` : ""}
        ${e.overGunned ? `<p class="danger">${e.gunners} gunners, but only ${t.gunnerSlots} slot${t.gunnerSlots === 1 ? "" : "s"}. Repair the missile launcher or move someone to a skill check.</p>` : ""}
        <div class="crewgrid">
          ${e.rows.map(r => `
            <div class="crewrow ${r.result ?? ""}">
              <img src="${r.pc.img}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
              <div class="cn">${esc(r.pc.name)}</div>
              <div class="roles">
                ${ESCAPE.roles.map(role => `
                  <button type="button" class="opt sm ${r.role === role.key ? "on" : ""}" data-act="role" data-i="${r.i}" data-k="${role.key}" ${ro ? "disabled" : ""}>${role.label}</button>`).join("")}
              </div>
              <div class="res">
                <button type="button" class="opt sm good ${r.result === "success" ? "on" : ""}" data-act="result" data-i="${r.i}" data-k="success" ${ro ? "disabled" : ""}>Success</button>
                <button type="button" class="opt sm bad ${r.result === "failure" ? "on" : ""}" data-act="result" data-i="${r.i}" data-k="failure" ${ro ? "disabled" : ""}>Failure</button>
              </div>
            </div>`).join("")}
        </div>
      </section>

      <section class="panel verdict ${e.resolved ? (e.clean ? "good" : "bad") : ""}" style="--tone:var(--${e.resolved ? (e.clean ? "moss" : "rust") : "muted"})">
        <h3>Outcome <small>${e.passed} of ${e.rows.length} succeeded · ${e.need} needed</small></h3>
        ${e.resolved
          ? (e.clean
            ? `<p class="text"><b>Clean getaway.</b> Nova Rush escapes the Corpse Fleet without sustaining further damage.</p>
               <p class="quote">${ESCAPE.win}</p>`
            : `<p class="text"><b>They get out, barely.</b> Nova Rush is severely damaged in the escape — but she's theirs.</p>
               <p class="quote">${ESCAPE.win}</p>`)
          : `<p class="hint">Mark each PC's result to see how it lands.</p>`}
      </section>`;
  }

  /* ---------------------------------------------------------- listeners */
  wire(root) {
    if (!root || root.dataset?.nrWired === "1") return;
    if (root.dataset) root.dataset.nrWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act;
      if (a === "tab") { t.s.tab = btn.dataset.k; t.touch(); }
      else if (a === "area") t.toggleArea(btn.dataset.k);
      else if (a === "repair") t.toggleRepair(btn.dataset.k);
      else if (a === "ally") t.toggleAlly(btn.dataset.k);
      else if (a === "escaped") t.setEscape(btn.dataset.k);
      else if (a === "sink") t.bumpSinkwell(Number(btn.dataset.n));
      else if (a === "sinktoggle") t.toggleSinkwell();
      else if (a === "rolldmg") t.rollBattleDamage();
      else if (a === "resetrounds") t.resetRounds();
      else if (a === "mode") t.setMode(btn.dataset.k);
      else if (a === "assign") t.assignRole(Number(btn.dataset.i), btn.dataset.k);
      else if (a === "degree") t.setDegree(Number(btn.dataset.i), btn.dataset.k);
      else if (a === "nextround") t.nextRound();
      else if (a === "undoround") t.undoRound();
      else if (a === "resetscene") t.resetScene();
      else if (a === "postscene") t.postSceneStatus();
      else if (a === "fx") t.fx(btn.dataset.k);
      else if (a === "role") t.setRole(Number(btn.dataset.i), btn.dataset.k);
      else if (a === "result") t.setResult(Number(btn.dataset.i), btn.dataset.k);
      else if (a === "actor") t.openActor(btn.dataset.k);
      else if (a === "postboxed") t.postBoxed(btn.dataset.k);
      else if (a === "poststatus") t.postStatus();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "brigmod") t.toggleMod(el.dataset.k);
      else if (el.dataset.act === "brigflag") t.toggleBrigFlag(el.dataset.k);
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.console;
    return `<style>
      #nr-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #nr-console .window-content > * { background:transparent; }
      .nr { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .nr * { box-sizing:border-box; }
      .nr button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; }
      .nr button:hover:not(:disabled) { background:var(--hover); }
      .nr button:disabled { opacity:.4; cursor:not-allowed; }
      .nr input[type="checkbox"] { accent-color:var(--slate); margin-top:.15rem; flex:none; }
      .nr h3 { color:var(--ink); font-size:.88rem; margin:0 0 .5rem; letter-spacing:.05em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
               padding-bottom:.3rem; flex-wrap:wrap; }
      .nr h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .nr h1, .nr h2, .nr h4, .nr legend { color:var(--ink); }
      .nr .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .nr .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .nr .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .nr .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 6px; letter-spacing:.06em; font-weight:700; }
      .nr .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .nr .pip { font-size:.57rem; text-transform:uppercase; letter-spacing:.07em; padding:0 5px;
                 border-radius:8px; border:1px solid var(--line); color:var(--muted); }
      .nr .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .nr .say + .say { margin-left:.25rem; }
      .nr .boxed { font-size:.82rem; line-height:1.55; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; }
      .nr .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .nr .quote { font-size:.82rem; line-height:1.5; margin:.3rem 0 .45rem; padding-left:.55rem;
                   border-left:2px solid var(--tone, var(--line)); font-style:italic; }
      .nr .note { font-size:.78rem; line-height:1.45; color:var(--muted); margin:.2rem 0 .4rem; }
      .nr .danger { font-size:.79rem; line-height:1.45; color:var(--rust); margin:.2rem 0 .4rem; font-weight:600; }
      .nr .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .nr .loot b { color:var(--gold); }
      .nr .branch { font-size:.79rem; line-height:1.5; margin:.2rem 0; }
      .nr .branch b { display:block; color:var(--muted); font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; }
      .nr .dcs { font-size:.8rem; font-weight:600; margin:.2rem 0 .4rem; color:var(--slate); line-height:1.45; }
      .nr .dcs.sm { font-size:.76rem; font-weight:500; }
      .nr .bonus { font-size:.77rem; font-weight:600; color:var(--moss); margin:.3rem 0 .4rem; }
      .nr .hint { font-size:.75rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .nr .checks { margin:0 0 .45rem; padding-left:1.1rem; font-size:.79rem; line-height:1.5; color:var(--muted); }
      .nr .checks li { margin-bottom:.25rem; }
      .nr .check { display:flex; gap:.45rem; align-items:flex-start; font-size:.79rem; line-height:1.4; margin:.25rem 0; }
      .nr .subhead { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin-bottom:.25rem; }
      .nr .qa { font-size:.79rem; line-height:1.5; margin:.3rem 0; }
      .nr .qa p { margin:.3rem 0; }
      .nr .qa b { display:block; color:var(--moss); }
      .nr .know { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0; background:var(--stripe); }
      .nr .deg { font-size:.78rem; line-height:1.45; margin:.2rem 0; }
      .nr .deg b { color:var(--tone, var(--ink)); }
      .nr .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; }
      .nr .primary { background:var(--tone, var(--slate)); border-color:var(--tone, var(--slate));
                     color:var(--paper); font-weight:700; padding:.3rem .7rem; font-size:.76rem; }
      .nr .primary:hover:not(:disabled) { filter:brightness(1.15); background:var(--tone, var(--slate)); }
      .nr .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .nr .opt { padding:.28rem .6rem; font-size:.75rem; }
      .nr .opt.sm { padding:.2rem .45rem; font-size:.68rem; }
      .nr .opt.on { background:var(--slate); border-color:var(--slate); color:var(--paper); font-weight:600; }
      .nr .opt.good.on { background:var(--moss); border-color:var(--moss); }
      .nr .opt.bad.on { background:var(--rust); border-color:var(--rust); }

      .nr .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .nr .lamps { display:flex; gap:.4rem; flex-wrap:wrap; }
      .nr .lamp { display:inline-flex; align-items:center; gap:.3rem; font-size:.68rem; text-transform:uppercase;
                  letter-spacing:.06em; color:var(--muted); border:1px solid var(--line); border-radius:10px; padding:2px 8px; }
      .nr .lamp i { font-size:.5rem; opacity:.35; }
      .nr .lamp.lit { color:var(--moss); border-color:var(--moss); font-weight:700; }
      .nr .lamp.lit i { opacity:1; text-shadow:0 0 6px var(--moss); }
      .nr .dcbox { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; }
      .nr .dcbox span { font-size:.58rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .nr .dcbox b { font-size:1.05rem; line-height:1; color:var(--gold); }

      .nr .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .nr .tab { flex:1; padding:.3rem .2rem; font-size:.77rem; display:flex; flex-direction:column; line-height:1.2; }
      .nr .tab small { font-size:.6rem; color:var(--muted); font-weight:400; }
      .nr .tab.on { background:var(--slate); border-color:var(--slate); color:var(--paper); }
      .nr .tab.on small { color:var(--paper); opacity:.85; }

      .nr .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.5rem; }
      .nr .crew { display:flex; gap:.35rem; flex-wrap:wrap; margin:.1rem 0 .45rem; }
      .nr .mon { font-size:.74rem; padding:.22rem .55rem; color:var(--rust); border-color:var(--rust); }
      .nr .mon em { color:var(--muted); font-style:normal; font-size:.68rem; }
      .nr .area.done { opacity:.75; }
      .nr .ally.on, .nr .repair.done { box-shadow:inset 0 0 0 1px var(--moss); }

      .nr .hazard.live { box-shadow:inset 0 0 0 1px var(--rust); }
      .nr .hazard.done { opacity:.8; box-shadow:inset 0 0 0 1px var(--moss); }
      .nr .disable { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin-top:.4rem; background:var(--stripe); }
      .nr .counter { display:flex; align-items:center; gap:.4rem; margin-top:.35rem; flex-wrap:wrap; }
      .nr .counter b { font-size:.76rem; color:var(--muted); }
      .nr .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }
      .nr .pips { display:inline-flex; gap:3px; }
      .nr .pipdot { width:10px; height:10px; border-radius:50%; border:1px solid var(--line); display:block; }
      .nr .pipdot.on { background:var(--plum); border-color:var(--plum); box-shadow:0 0 6px var(--plum); }

      .nr .faces { display:grid; grid-template-columns:1fr 1fr; gap:.35rem; margin-top:.5rem; }
      .nr .face { display:flex; gap:.45rem; font-size:.77rem; line-height:1.45; border:1px solid var(--line);
                  border-radius:3px; padding:.35rem .45rem; color:var(--muted); }
      .nr .face b { color:var(--ember); flex:none; }
      .nr .face i { color:var(--ink); font-style:normal; font-weight:600; }
      .nr .face.hit { border-color:var(--ember); background:var(--stripe); color:var(--ink); }

      .nr .mods { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.5rem; }
      .nr .mod { border:1px solid var(--line); border-radius:3px; padding:.3rem .6rem; min-width:110px; }
      .nr .mod span { display:block; font-size:.58rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .nr .mod b { font-size:.82rem; color:var(--muted); }
      .nr .mod.on { border-color:var(--moss); }
      .nr .mod.on b { color:var(--moss); }
      .nr .mod.big b { font-size:1.05rem; color:var(--gold); }

      .nr .crewgrid { display:flex; flex-direction:column; gap:.3rem; }
      .nr .crewrow { display:grid; grid-template-columns:28px 8rem 1fr auto; gap:.5rem; align-items:center;
                     border:1px solid var(--line); border-radius:3px; padding:.3rem .4rem; }
      .nr .crewrow img { width:28px; height:28px; border-radius:3px; object-fit:cover; border:1px solid var(--line); }
      .nr .crewrow .cn { font-size:.82rem; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .nr .crewrow .roles, .nr .crewrow .res { display:flex; gap:.25rem; flex-wrap:wrap; }
      .nr .crewrow.success { border-color:var(--moss); }
      .nr .crewrow.failure { border-color:var(--rust); }
      .nr .verdict.good { box-shadow:inset 0 0 0 1px var(--moss); }
      .nr .verdict.bad { box-shadow:inset 0 0 0 1px var(--rust); }

      .nr .modes { display:flex; align-items:center; gap:.35rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .nr .modes .subhead { margin:0 .35rem 0 0; }
      .nr .tracks { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:.5rem; }
      .nr .track { flex:1; min-width:170px; }
      .nr .track.thin { flex:0 0 auto; }
      .nr .tlabel { display:flex; justify-content:space-between; align-items:baseline; gap:.5rem; }
      .nr .tlabel span { font-size:.58rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .nr .tlabel b { font-size:.9rem; color:var(--gold); }
      .nr .tnote { font-size:.7rem; color:var(--muted); margin-top:.2rem; }
      .nr .bar { height:8px; border:1px solid var(--line); border-radius:4px; background:var(--stripe);
                 overflow:hidden; margin-top:.2rem; }
      .nr .bar span { display:block; height:100%; }
      .nr .bar .vp { background:var(--moss); }
      .nr .bar .hull { background:var(--slate); }
      .nr .bar .hull.low { background:var(--rust); }
      .nr .scenerow { display:grid; grid-template-columns:28px 7.5rem 1fr auto; gap:.5rem; align-items:center;
                      border:1px solid var(--line); border-radius:3px; padding:.3rem .4rem; }
      .nr .scenerow img { width:28px; height:28px; border-radius:3px; object-fit:cover; border:1px solid var(--line); }
      .nr .scenerow .cn { font-size:.8rem; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .nr .scenerow .roles, .nr .scenerow .res { display:flex; gap:.22rem; flex-wrap:wrap; }
      .nr .scenerow.res-cs { border-color:var(--moss); }
      .nr .scenerow.res-s { border-color:var(--slate); }
      .nr .scenerow.res-f { border-color:var(--muted); }
      .nr .scenerow.res-cf { border-color:var(--rust); }
      .nr .opt.full { opacity:.5; }
      .nr .opt.deg-cs.on { background:var(--moss); border-color:var(--moss); }
      .nr .opt.deg-s.on { background:var(--slate); border-color:var(--slate); }
      .nr .opt.deg-f.on { background:var(--muted); border-color:var(--muted); }
      .nr .opt.deg-cf.on { background:var(--rust); border-color:var(--rust); }
      .nr .grid.roles { grid-template-columns:repeat(3,1fr); }
      .nr .role .checks { color:var(--ink); }
      .nr .role .checks b { color:var(--tone); }

      .nr .fxlist { display:flex; flex-direction:column; gap:2px; }
      .nr .fxrow { display:grid; grid-template-columns:10px 1fr 15rem auto; gap:.55rem; align-items:center;
                   padding:.3rem .25rem; border-top:1px solid var(--stripe); }
      .nr .dot { width:10px; height:10px; border-radius:50%; border:1px solid var(--line); }
      .nr .dot.ok { background:var(--moss); border-color:var(--moss); box-shadow:0 0 6px var(--moss); }
      .nr .dot.missing { background:var(--ember); border-color:var(--ember); }
      .nr .fxname b { font-size:.8rem; display:block; }
      .nr .fxname small { font-size:.7rem; color:var(--muted); }
      .nr .fxfile { font-size:.68rem; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

      @media (max-width:820px) {
        .nr .grid, .nr .faces, .nr .grid.roles { grid-template-columns:1fr; }
        .nr .scenerow { grid-template-columns:28px 1fr; }
        .nr .scenerow .roles, .nr .scenerow .res { grid-column:2; }
        .nr .fxrow { grid-template-columns:10px 1fr auto; }
        .nr .fxfile { display:none; }
        .nr .tabs { flex-wrap:wrap; }
        .nr .crewrow { grid-template-columns:28px 1fr; }
        .nr .crewrow .roles, .nr .crewrow .res { grid-column:2; }
      }
    </style>`;
  }
}

if (AppV2) {
  NRApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSetting();
  let state = game.settings.get(NR_NS, NR_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(NR_NS, NR_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const run = new NovaRush(state);
  const app = new NRApp(run);

  if (!globalThis.__nrHook) {
    globalThis.__nrHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== NR_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { run.state = fresh; run.render(); }
    });
  }
  app.render(true);
})();
