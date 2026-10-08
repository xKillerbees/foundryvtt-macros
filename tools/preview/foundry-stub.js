/* Minimal Foundry VTT stand-in, just large enough to render a macro's window
   outside of Foundry so screenshots can be captured for the README.

   The macros in this repo touch a small, well-defined slice of the API:

     foundry.utils.{escapeHTML, mergeObject, deepClone, randomID}
     foundry.applications.api.ApplicationV2
     game.settings.{register, get, set, settings.has}
     game.actors (iterable, .get, .find, .party)
     game.users (iterable, .get, .activeGM), game.user, game.journal.getName
     game.journal / playlists / macros / scenes by real module ids, and
       foundry.documents.collections.Journal.show
     user.{getFlag, setFlag} — a real setFlag fires the updateUser hook
     game.socket.{on, emit} — looped back, but only for a namespace an
       installed package would have registered; anything else is dropped,
       exactly as the real server drops it
     actor.{skills, itemTypes.lore, system.abilities, testUserPermission}
     ChatMessage.{create, getSpeaker}, Dialog.confirm, Hooks.on, ui.notifications

   Everything below implements exactly that and nothing more. It is a preview
   harness, not an emulator — chat messages and settings writes go to the
   console instead of anywhere real. */

/* ------------------------------------------------------------------ actors */

/* Portraits are generated rather than shipped, so the harness stays
   self-contained and no adventure art ends up in the repository. */
function portrait(initials, bg, fg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
    <rect width="128" height="128" fill="${bg}"/>
    <circle cx="64" cy="50" r="26" fill="${fg}" opacity=".9"/>
    <path d="M18 128c0-27 21-44 46-44s46 17 46 44z" fill="${fg}" opacity=".9"/>
    <text x="64" y="118" font-family="serif" font-size="20" fill="${bg}"
          text-anchor="middle" opacity=".85">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/* Fictional sample party. Names are invented for the preview only.

   `skills` carries a handful of PF2e-shaped modifiers so macros that ask the
   party who should take a check have something to answer with. Only the skills
   worth distinguishing are listed; anything omitted falls back to BASE_SKILL,
   which is what keeps the sample party from looking uniformly competent. */
const BASE_SKILL = 8;

/* `ranks` carries proficiency (1 trained, 2 expert, …) for the skills where it
   isn't just trained; a downtime planner prices Earn Income off the rank, not
   the modifier. `con` feeds long-term rest. Anything unlisted is trained. */
const SAMPLE_PCS = [
  { name: "Aiko",  cls: "Champion",   ancestry: "Human",    level: 5, bg: "#5d3654", fg: "#efe6d8",
    perception: 11, con: 4, saves: { fortitude: 14, reflex: 10, will: 12 },
    skills: { athletics: 14, diplomacy: 13, intimidation: 12, religion: 11, medicine: 10 },
    ranks: { athletics: 2, diplomacy: 2 },
    lores: [["Warfare Lore", 1]] },
  { name: "Daizen", cls: "Wizard",    ancestry: "Kitsune",  level: 5, bg: "#3d4c59", fg: "#efe6d8",
    perception: 10, con: 1, saves: { fortitude: 9, reflex: 11, will: 14 },
    skills: { arcana: 15, crafting: 14, society: 13, occultism: 12, "absalom-lore": 11, nature: 10 },
    ranks: { arcana: 2, crafting: 2 },
    lores: [["Absalom Lore", 1], ["Academia Lore", 1]],
    /* The party's crafter, and the only one who knows any formulas. */
    formulas: ["Compendium.pf2e.equipment-srd.Item.aaaa0000",
               "Compendium.pf2e.equipment-srd.Item.cccc0000"] },
  { name: "Miyu",  cls: "Rogue",      ancestry: "Tengu",    level: 5, bg: "#4b5a34", fg: "#efe6d8",
    perception: 14, con: 2, saves: { fortitude: 10, reflex: 15, will: 12 },
    skills: { stealth: 16, thievery: 15, acrobatics: 14, deception: 13, "underworld-lore": 12, performance: 10 },
    ranks: { stealth: 2, thievery: 2, deception: 2 },
    /* Expert because she took it there by Dedicated Study — the planner should
       still price her Earn Income off trained. */
    lores: [["Underworld Lore", 2]] },
  { name: "Tenzo", cls: "Thaumaturge", ancestry: "Nagaji",  level: 5, bg: "#95381f", fg: "#efe6d8",
    perception: 12, con: 3, saves: { fortitude: 12, reflex: 12, will: 11 },
    skills: { intimidation: 15, "assassin-lore": 13, "warfare-lore": 12, survival: 11, athletics: 11 },
    ranks: { intimidation: 2 },
    lores: [["Assassin Lore", 1], ["Warfare Lore", 1]] }
];

/* The slugs a macro might ask for, so an unlisted skill still answers. */
const ALL_SKILLS = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy",
  "intimidation", "medicine", "nature", "occultism", "performance", "religion", "society",
  "stealth", "survival", "thievery"];

function labelFor(slug) {
  return slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}
/* "Absalom Lore" -> "absalom-lore", matching how PF2e slugs a Lore item. */
function slugFor(name) {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

class StubActor {
  constructor(spec, i) {
    this.id = `pc${i + 1}`;
    this.name = spec.name;
    this.type = "character";
    this.hasPlayerOwner = true;
    this.img = portrait(spec.name.slice(0, 2).toUpperCase(), spec.bg, spec.fg);
    this.prototypeToken = { texture: { src: this.img } };
    this.system = {
      details: {
        level: { value: globalThis.__previewPcLevel ?? spec.level },
        class: { name: spec.cls },
        ancestry: { name: spec.ancestry }
      },
      abilities: Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map(k =>
        [k, { mod: k === "con" ? (spec.con ?? 2) : 2 }])),
      crafting: { formulas: (spec.formulas ?? []).map(uuid => ({ uuid })) }
    };
    /* PF2e exposes statistics as objects with `.mod` and `.label`. */
    this.perception = { mod: spec.perception ?? 10, label: "Perception" };
    this.saves = Object.fromEntries(["fortitude", "reflex", "will"].map(k =>
      [k, { mod: spec.saves?.[k] ?? 10, label: labelFor(k) }]));

    /* PF2e keeps Lore skills as items on the actor, and that item is where the
       proficiency rank actually lives. Both halves are stubbed because a macro
       may reasonably read either. */
    const lores = spec.lores ?? [];
    this.itemTypes = {
      lore: lores.map(([name, rank]) => ({
        name, type: "lore", slug: slugFor(name),
        system: { proficient: { value: rank } }
      }))
    };

    const loreSlugs = lores.map(([name]) => slugFor(name));
    const slugs = new Set([...ALL_SKILLS, ...Object.keys(spec.skills ?? {}), ...loreSlugs]);
    this.skills = Object.fromEntries([...slugs].map(slug => {
      const lore = loreSlugs.includes(slug) || slug.endsWith("-lore");
      const fromLore = lores.find(([name]) => slugFor(name) === slug)?.[1];
      return [slug, {
        mod: spec.skills?.[slug] ?? BASE_SKILL,
        label: labelFor(slug),
        rank: spec.ranks?.[slug] ?? fromLore ?? 1,
        lore,
        slug
      }];
    }));

    /* Everyone in the sample party is player-owned, so the GM preview can edit
       any of them and the ownership check still runs. Previewing as a player
       (`__player` on a fixture) narrows it to that one actor, which is what
       makes a player-facing board's read-only branches show up. */
    this.testUserPermission = (user) => {
      if (user?.isGM) return true;
      const only = globalThis.__previewPlayer;
      return only ? this.id === only : this.hasPlayerOwner;
    };
    /* Character sheets don't exist out here, so opening one is a log line. */
    this.sheet = { render: () => console.log("[sheet]", this.name) };
  }
}

const ACTORS = SAMPLE_PCS.map((s, i) => new StubActor(s, i));

/* Player-owned, but not party members: a summoner's eidolon and the sort of
   utility actor that accumulates in a long-running world. A macro that scans
   the directory for player-owned characters picks these up and shouldn't —
   they exist here so that mistake shows in the preview. */
const TAG_ALONGS = [
  { name: "Brutal Beast", cls: "Eidolon", ancestry: "", level: 5, bg: "#4a3b52", fg: "#efe6d8" },
  { name: "(Quick Send To Chat)", cls: "", ancestry: "", level: 1, bg: "#3a3a3a", fg: "#efe6d8" }
].map((s, i) => new StubActor(s, ACTORS.length + i));

/* A boss NPC for the multi-part boss console. It carries a PF2e-shaped
   hp / ac / saves / defenses block (the paths the console reads), an `update`
   that records the mirrored token-HP write, and `type: "npc"` so the console's
   actor picker — which lists non-character actors — finds it. */
const BOSS_NPC = {
  id: "boss1",
  uuid: "Actor.boss1",
  name: "Menare the Great Worm",
  type: "npc",
  hasPlayerOwner: false,
  img: portrait("MW", "#5d1f1f", "#efe6d8"),
  prototypeToken: { texture: { src: "" } },
  system: {
    details: { level: { value: 23 } },
    attributes: {
      hp: { value: 412, max: 575, temp: 0 },
      ac: { value: 50 },
      damageResistances: [{ type: "physical", value: 10 }],
      damageWeaknesses: [{ type: "cold", value: 25 }],
      damageImmunities: [{ type: "fire" }, { type: "paralyzed" }, { type: "sleep" }]
    },
    saves: { fortitude: { value: 40 }, reflex: { value: 38 }, will: { value: 42 } }
  },
  update(data) { console.log("[actor.update]", this.name, data); return Promise.resolve(this); },
  sheet: { render: () => console.log("[sheet]", this.name) }
};

const ALL_ACTORS = [...ACTORS, ...TAG_ALONGS, BOSS_NPC];

/* Only the four real PCs, exactly as a curated party actor would hold them. */
const partyActor = { id: "party", name: "Party", type: "party", members: ACTORS };

const actorCollection = {
  party: partyActor,
  /* The directory holds the tag-alongs too — the party actor is what narrows
     it back down to the four. */
  get: (id) => ALL_ACTORS.find(a => a.id === id) ?? null,
  find: (fn) => ALL_ACTORS.find(fn) ?? null,
  [Symbol.iterator]: () => ALL_ACTORS[Symbol.iterator]()
};

/* ---------------------------------------------------------------- journals

   A stand-in for an imported adventure. Five of the Season of Ghosts module's
   twenty-three journal entries — the ones this repo's macros link into — with their real document ids and page titles,
   so a macro's chapter and area lookups resolve exactly as they would in a
   world that has the adventure installed. No page text — only the structure a
   link has to navigate. Set `__journals: false` on a fixture to empty this and
   preview the "adventure not installed" branch instead. */
/* The Pathfinder Beginner Box module's own ids, alongside the Season of Ghosts
   ones, so the Menace Under Otari console's page links resolve too. */
const BB_JOURNALS = [
  { id: "qFSLpCM2cpRQWCR2", name: "Menace Under Otari", pages: [
    "UEuiUcrrPdr9eFqN|Hungry Rats", "VLztUZ1H5YEYPcx9|Drop into Darkness",
    "8Fr6KCxqXp322B5r|The Spider's Web", "Ccp3c9A1WH9tOCVO|The Barricade",
    "mJ3pVc1aJi98duaA|Forgotten Crypt", "u4m7Ttls4lBA9e96|Forgotten Shrine",
    "UCEZLyerntYnmzgX|Abandoned Storeroom", "rajhJ9Y006IkwuZa|Trapped Hallway",
    "bpVEaN8PUCgbuJvk|Gold Puzzle", "gz9x5HmzjSvvBLQp|Abadar's Vault",
    "KWTky7M63NvVIVRz|Kobolds and Traps", "2KRdW68qNXeJ6JpN|Kobold Lookouts",
    "UlIek5d97G6nHWEm|Soggy Crossroads", "7Ko4GJeI1K3Vy1Xp|Elements of Chaos",
    "CMjhAWaRWlbFVoF0|Xulgath Cave", "MSU45JsvJjOJc1dg|Mermaid Fountain",
    "0vJpmu4QJ7RgYLi2|Kobold Warren", "l6OIDtJFH40dtZHU|Dragonkeeper",
    "KMTBj18whqvjGZBz|Mushroom Grotto", "QFVMina0vPQXKUxC|Setting the Scene",
    "UP1WB6tI0SFgMMzC|Introduction", "WpWULbveo4SMmMj5|Pathfinder Society"
  ] },
  { id: "S1UnJk4t55aRFaCs", name: "Gamemastering", pages: ["ZFjG6Np42VRz5hFu|Encounters"] },
  { id: "KIpNnMtah73eyPC8", name: "Creating Your Hero", pages: [
    "DXbYBjutIcp4bmB7|Leveling Up", "RRxNZiD64dvvpWYt|Character Creation",
    "FM2SxBvhjufkiW44|Pregenerated Heroes"
  ] }
];

/* The Beginner Box's playlists, macros, and scenes, by their real ids. */
const BB_PLAYLISTS = [
  { id: "heHyhtPMGRCqJ2HL", name: "Floor 1 Exploration Ambience", ids: { "9VjwgeXsiou9mZ5A": "Deeds Done In Darkness" } },
  { id: "ixYF8x5F4rA6adgo", name: "Floor 2 Exploration Ambience", ids: { V2FUEfrTq9fvKoks: "Drones In The Deep" } },
  { id: "k0fOCWD3DBgSoHoZ", name: "Exploration Loops", ids: {
    u4mNGCTn8cPE8X9k: "Crypt Drone Loop", "0N9AZX11G0RYUoZn": "The Occasional Rat", Vl3tC8KlZmkUvR12: "The Occasional Drip" } },
  { id: "vb7AB47i1FnbnC6M", name: "Otari Fishery", ids: { NA4DUa5JCH6VcnT1: "Otari Fishery" } },
  { id: "nGTMCWOpjxgn3t3Q", name: "Otari Wharf", ids: { lZH9AhDY6fnhXyvN: "Otari Seaside" } },
  { id: "2oJDF1thojiM9tWg", name: "Floor 2 Soggy Crossroads", ids: { H7FMzZQcKgZ9XMNQ: "Watery Grave" } },
  { id: "0qdreI9KgZ0kYMki", name: "Floor 2 Mermaid Fountain", ids: {
    GNLKIThBSqgQ4tiQ: "The Mermaid Fountain Loop", BIt6uRTjcmXfS2Ao: "The Mermaid Fountain Basin Loop" } },
  { id: "J9UqsCkkPfzAA9Z1", name: "Soundboard Loops", ids: {
    upp10gFshBm3o4ts: "The Malevolent Dead", jMVdTW8tkIMG5B13: "Everything Is Fire",
    GgsDSD88cVftbskJ: "Irritated Xulgath Noises", opUA06LhpkTvpRxh: "Zolgran Plotting",
    acWIaATXvrV6TCYy: "Muffled Chattering" } },
  { id: "QN6rFt1K6zlkbI9I", name: "Barricades", ids: {
    BCLNoSQ51JmvXtWK: "Disassembling Barricade", "50s0sXyj8TlX8kWq": "Shattering Barricade",
    CI5aakOLeJDMGC6O: "Breaking The Stone Wall" } },
  { id: "PtzmQZ2WjuUK8XUF", name: "The Cinder Rat", ids: { cZS3HUei09Gxk0dv: "The Rat's On Fire" } },
  { id: "VS8FZvbRBnqt7Wid", name: "Dragon Soundboard", ids: {
    Fypler5gP0OSsaNq: "Wyrmling Growl Distant 01", drrfdsrUloVdYc8z: "Wyrmling Growl 1",
    PzgI66NU5R06KRZE: "Wyrmling Breath Weapon 01" } }
];

const BB_MACROS = [
  ["saQTdI63wy22v5yk", "Area 04 - Barricade"], ["pb7k8V9m7cFioy6B", "Area 12 - Barricade"],
  ["iPvtf4ZGr6qX8OnF", "Area 14- Cinder Rat"], ["NAxPG4cHu4dKrx6h", "Area 15 - Freshly Dug Tunnel"],
  ["MppBkkOiWyW1z6fW", "Quick Reference: Encounters"], ["x0YlgNBucXkYT6RG", "Quick Reference: DCs"]
];

const BB_SCENES = [
  ["c7E7PXzgT5RBkT7S", "Otari"], ["U5t0Mq8glKBXO3qH", "Landing"],
  ["JJJCFUCadDPRwnSX", "Floor 1"], ["cgv9iVmx3dNIL3YA", "Floor 2"]
];

/* The Murder in Metal City module's ids, generated from its adventure pack:
   every entry, and the pages the Metal City console links to. */
const MMC_JOURNALS = [
  { id: "sf2av00500frontm", name: "Frontmatter", pages: [
    "00introductio000|Introduction",
    "00gmreference000|GM Reference"
  ] },
  { id: "sf2av00500mimpsh", name: "Pregen Sheets", pages: [] },
  { id: "sf2av00501coldca", name: "Chapter 1: Cold Case", pages: [
    "01concludingch00|Concluding Chapter 1",
    "01stalkerinthe00|Stalker in the Shadows",
    "01tier99profes00|Tier-99-Professor’s Cache",
    "01downgridchar00|Downgrid Charging Platform",
    "01aboutanacite00|About Anacites",
    "01gmtipinvesti00|GM Tip: Investigations",
    "01gettingonthe00|Getting on the Case",
    "01gmtiprewards00|GM Tip: Rewards",
    "01smogalert00000|Smog Alert",
    "01gmtipcombata00|GM Tip: Combat and Maps",
    "01downgriddeto00|Downgrid Detour",
    "01tiernyslastw00|Tierny’s Last Words",
    "01interviewwit00|Interview with Ghellon",
    "01missedconnec00|Missed Connection",
    "01joiningthepa00|Joining the Party",
    "01coldcase000000|Cold Case"
  ] },
  { id: "sf2av00502seeker", name: "Chapter 2: Seekers in Striving", pages: [
    "02deadend0000000|Dead End?",
    "02machinecourt00|Machine Court’s Judgment",
    "02beforethetri00|Before the Trial",
    "02framed00000000|Framed!",
    "02searchingthe00|Searching the Archive",
    "02alltooeasy0000|All Too Easy",
    "02archive4040000|Archive 404",
    "02wrappingupat00|Wrapping up at Magenta",
    "02thrillseeker00|Thrill Seeker Approach",
    "02highrollerap00|High Roller Approach",
    "02infinitydeck00|Infinity Deck",
    "02magenta0000000|Magenta",
    "02pestcontrol000|Pest Control",
    "02hiddentrutha00|Hidden Truth Apothecary",
    "02memorialfora00|Memorial for a Soulless Machine",
    "02paradeoffait00|Parade of Faiths",
    "02theologychan00|Theology Channel",
    "02workingforin00|Working for Insight Array",
    "02insightarray00|Insight Array",
    "02theprofessor00|The Professor’s Queries",
    "02processorcen00|Processor (Central Circuit)",
    "02clinic00000000|Clinic",
    "02vendingservi00|Vending Services",
    "02centralarchi00|Central Archives",
    "02strivingpoly00|Striving Polytechnica",
    "02seekersinstr00|Seekers in Striving"
  ] },
  { id: "sf2av00503frozen", name: "Chapter 3: Frozen Heart of Aballon", pages: [
    "03continuingth00|Continuing the Campaign",
    "03facilitators00|Facilitator’s Fate",
    "03relicsfate0000|Relic’s Fate",
    "03conclusion0000|Conclusion",
    "03meetthemurde00|Meet the Murderer",
    "03partingshots00|Parting Shots",
    "03wreckoftheco00|Wreck of the Condemned Prophet",
    "03gmtiprunning00|GM Tip: Running Jinsuls",
    "03abaddonfield00|Abaddon Fields",
    "03thegloaming000|The Gloaming",
    "03whatdoyoudo000|What Do You Do?",
    "03wheresthemur00|Where’s the Murderer?",
    "03gatheringevi00|Gathering Evidence",
    "03murderershid00|Murderer’s Hideout",
    "03lastgoodbye000|Last Goodbye",
    "03canopy00000000|Canopy",
    "03daydelve000000|Day Delve",
    "03basecamp000000|Base Camp",
    "03frostlookout00|Frost Lookout",
    "03teardropicew00|Teardrop Ice Well",
    "03frozenhearto00|Frozen Heart of Aballon"
  ] },
  { id: "sf2av00504npcgal", name: "NPC Gallery", pages: [] },
  { id: "sf2av00505locati", name: "Locations", pages: [] },
  { id: "sf2av00506techfa", name: "Tech Faiths of Aballon", pages: [] },
  { id: "sf2av00507aliens", name: "Aliens & Adversaries", pages: [
    "07campaignrole00|Agent Z",
    "07strandedjins00|Stranded Jinsul"
  ] },
  { id: "sf2av00508khizar", name: "Khizar", pages: [] },
  { id: "sf2av005095artga", name: "Art Gallery", pages: [
    "95vazylyza000000|Vazylyza",
    "95springfrost000|Spring Frost",
    "95shalalamula000|Shalalamula",
    "95remenaremaum00|Remena Rema Umana of Clan Kalar",
    "95tier99profes00|Tier-99-Professor",
    "95archivist40400|Archivist 404",
    "95agentz00000000|Agent Z",
    "95primefacilit00|Prime-Facilitator",
    "95luckycompila00|Lucky Compilation of Numbers",
    "95hesop000000000|Hesop",
    "95ghellon0000000|Ghellon",
    "95eruditecolla00|Erudite-Collaborator aka Eruco",
    "95enaria00000000|Enaria",
    "95bebubelu000000|Bebubelu"
  ] },
  { id: "sf2av00509hando1", name: "Handouts", pages: [
    "09handout9000000|#9: Mysterious Comm Unit Message",
    "09handout8000000|#8: Anacite Death Customs",
    "09handout7000000|#7: Log of Tier-99-Professor's Queries",
    "09handout6000000|#6: Investigation Status",
    "09handout5000000|#5: Note from Tierny",
    "09handout4000000|#4: Memory Storage",
    "09handout3000000|#3: Anacite Habits",
    "09handout2000000|#20: Jeotanni's Comm Unit Contents",
    "09handout0200000|#2: Drone Programming Scan",
    "09handout1900000|#19: Laptop Entry 2",
    "09handout1800000|#18: Laptop Entry 1",
    "09handout1700000|#17: Relic Scan",
    "09handout1600000|#16: Special Notice! Pest Control!",
    "09handout1500000|#15: Special Notice! Parade of Faiths!",
    "09handout1400000|#14: About Jinsuls",
    "09handout1300000|#13: About Ice Wells",
    "09handout1200000|#12: Public Profile: Prime-Facilitator",
    "09handout1100000|#11: About Insight Array App",
    "09handout1000000|#10: Recording from Agent Z",
    "09handout0100000|#1: Invitation to Analog"
  ] }
];
const MMC_PLAYLISTS = [
  { id: "BM1DJfPk8QZQAcuY", name: "Loops", ids: {
    "gvZnoOFSlyVSHTlh": "Archivists Wrath", "StKSJ9wkUoXeN4dE": "Air Pump", "0ekcBqqPPb7zZ2MC": "Particle Cannon", "CcyxE8WYe7y3thzN": "Shadowy Duplicates" } },
  { id: "nO5b7gnQk3IiBabF", name: "Ambience", ids: {
    "nsIlmnLmfP5kJvNK": "Framed", "V54JSXQcS3Ztyntz": "Magenta", "d8K27xx3JBW3osxc": "Striving", "9R1cmSEe3GFDjTPn": "Abandoned Mall", "XMBPh44Gj1Rx2Vxh": "Analog Cafe", "aUPeBGITJJ0Hp2lf": "Archive 404", "br46kt27OGWJIE7n": "Central Circuit", "jZXaqBKSxCEyznhk": "Downgrid Charging Platform", "xhM86Z2Ci5WFuOHu": "Machine Court", "1xc9IZRrusHOF6Jl": "Parade Of Faiths", "l5TKHpk2cNO2BErw": "Striving Chase", "wF2Ab7D5QWCXDdaQ": "Striving Polytechnica", "ld4MKO9ABDLBBWsB": "Teardrop Ice Well" } }
];
const MMC_MACROS = [
  ["8fKLOhKtWWBZJoVs", "Open Settings"], ["ELotS5eg49qX2PLA", "Reveal Dewblossom"], ["GIWBA4UdAJNbBg4r", "Fix Air Pump"], ["I48RKo6weCl72u0l", "Archivist's Wrath"], ["LvE8MXiPru8TQtI9", "Landing Picker"], ["W4ExED1OE2dalBoP", "Enable Dynamic Token Ring and Turn Marker"]
];
const MMC_SCENES = [
  ["2Q318Qg20GcxIqlM", "Wreck of the Condemned Prophet"],
  ["4FfMTUqoLvtED4tG", "Landing"],
  ["DTgpMIggnM6Pj467", "Archive 404"],
  ["HoV0RL4I0HpLPSBD", "Archive 404"],
  ["JLOjySLNLqyi9Qs9", "Abandoned Mall"],
  ["NljaYtpj8rIAiWuQ", "The Gloaming"],
  ["Oq49LPP9tFWkjI0m", "Abandoned Mall"],
  ["Pj2R1MP1a8JhFeTb", "Theology Channel"],
  ["R69Xp3Pw1GOEsJvp", "Striving"],
  ["Swz9Qorj9zpfyQ0P", "Foggy Alley"],
  ["WzuvIDTSsKJbURJp", "Theology Channel"],
  ["YlufX3ZuhkLUsuIJ", "Tier-99-Professor’s Cache"],
  ["erex2weqrS2n6EWl", "Foggy Alley"],
  ["grLbO3iooOJUphzg", "Ice Well"],
  ["pNorQrVswYcO1BMv", "Ice Well"]
];

/* The Guilt of the Grave World module's ids, generated from its adventure
   pack: every entry, the pages the Grave World console links to, every
   playlist sound, macro, and scene. Page ids repeat between entries here —
   the NPC Gallery and the Art Gallery share several — which is why the
   console names a page together with its journal. */
const GGW_JOURNALS = [
  { id: "pzo2400601frontm", name: "Frontmatter", pages: [
    "01adventuresum00|Adventure Summary",
    "01adventurebac00|Adventure Background",
    "01gettingstart00|Getting Started"
  ] },
  { id: "pzo2400602echoes", name: "Ch 1: Echoes from the Grave", pages: [
    "02echoesfromth00|Echoes from the Grave",
    "02jobinterview00|Job Interview",
    "02toyourbattle00|To Your Battle Stations!",
    "02diasporadrif00|Diaspora Drifting",
    "02iovanstation00|Iovan Station Alpha",
    "02a1dockingpor00|Docking Port",
    "02a2airlockamb00|Airlock Ambush",
    "02a3safetycorr00|Safety Corridor",
    "02a4crewquarte00|Crew Quarters",
    "02a5auditorium00|Auditorium",
    "02a6gymnasium000|Gymnasium",
    "02a7utilitycor00|Utility Corridor",
    "02a8computerce00|Computer Center",
    "02a9arcanelabo00|Arcane Laboratory",
    "02a10hydroponi00|Hydroponics Bay",
    "02a11commandco00|Command Core",
    "02maliciousmar00|Malicious Marauders",
    "02concludingth00|Concluding the Chapter"
  ] },
  { id: "pzo2400603worldo", name: "Ch 2: World of the Dead", pages: [
    "03worldofthede00|World of the Dead",
    "03unlivinghosp00|Unliving Hospitality",
    "03hangingaroun00|Hanging Around or Heading Out",
    "03firstclassdi00|First Class Disaster",
    "03norestforthe00|No Rest for the Weary",
    "03snakeinthegl00|Snake in the Glass",
    "03overthedeadh00|Over the Dead Hills",
    "03campingoneox00|Camping on Eox",
    "03zephyrousshe00|Zephyrous Shelter",
    "03spookedxoala00|Spooked Xoalats",
    "03undeadreckon00|Undead Reckoning",
    "03etchedmemori00|Etched Memories",
    "03killsquad00000|Kill Squad",
    "03smileyoureon00|Smile, You're on Camera!",
    "03concludingth00|Concluding the Chapter"
  ] },
  { id: "pzo2400604hallso", name: "Ch 3: Halls of the Living", pages: [
    "04hallsoftheli00|Halls of the Living",
    "04petsnacks00000|Pet Snacks",
    "04frontroomdea00|Front Room Deals",
    "04sabotagesouf00|Sabotage Soufflé",
    "04bsoufflstadi00|Soufflé Stadium",
    "04b1themeatjun00|The Meat Jungle",
    "04b2kitchensta00|Kitchen Stage",
    "04b3gravediggi00|Gravedigging Grounds",
    "04b4flaminggau00|Flaming Gauntlet",
    "04letthemcook000|Let Them Cook!",
    "04sabotagespin00|Sabotage Spinner",
    "04cookingchall00|Cooking Challenge Results",
    "04tastingandju00|Tasting and Judgment",
    "04realhoardsof00|Real Hoards of Triaxus",
    "04thelastelebr00|The Last Elebrian",
    "04cfrontlinesf00|Front Lines Frayed",
    "04c1contestedl00|Contested Land",
    "04c2newcrater000|New Crater",
    "04c3trenches0000|Trenches",
    "04c4mortartube00|Mortar Tubes",
    "04c5dugout000000|Dugout",
    "04c6crossingpa00|Crossing Paths",
    "04c7commsbunke00|Comms Bunker",
    "04c8perimeterd00|Perimeter Defense",
    "04c9searchligh00|Searchlight Hill",
    "04c10landingzo00|Landing Zone",
    "04hallsoftheli01|Halls of the living",
    "04unlockingthe00|Unlocking the Data",
    "04meetingahmzo00|Meeting Ahmzovar",
    "04concludingth00|Concluding the Chapter"
  ] },
  { id: "pzo2400605intoth", name: "Ch 4: Into the Drift", pages: [
    "05intothedrift00|Into the Drift",
    "05farewelltopa00|Farewell to Pact Port",
    "05intothedrift01|Into the Drift",
    "05event1malfun00|Event 1: Malfunction",
    "05event2allhan00|Event 2: All Hands on Deck",
    "05event3conver00|Event 3: Convergence",
    "05dplanarfragm00|Planar Fragment",
    "05d1slipperysl00|Slippery Slope",
    "05d2lavaflow0000|Lava Flow",
    "05d3gravitywel00|Gravity Well",
    "05eventexplosi00|Event: Explosive Caldera",
    "05reciprocity000|Reciprocity",
    "05event4finalo00|Event 4: Final Onslaught",
    "05eventfaceoff00|Event 5: Face Off",
    "05cosmiccapers00|Cosmic Capers",
    "05thedefiance000|The Defiance",
    "05driftersdrau00|Drifter’s Draught",
    "05concludingth00|Concluding the Chapter"
  ] },
  { id: "pzo2400606robbin", name: "Ch 5: Robbing the Barrow", pages: [
    "06robbingtheba00|Robbing the Barrow",
    "06silentrunnin00|Silent Running",
    "06freefalling000|Free Falling",
    "06turretdefens00|Turret Defense",
    "06auxiliaryres00|Auxiliary Research Center",
    "06reinforcemen00|Reinforcements",
    "06event1welcom00|Event 1: Welcome Party",
    "06event2junior00|Event 2: Junior officers",
    "06event3ghostl00|Event 3: Ghostly Assassins",
    "06eauxiliaryre00|Auxiliary Research Center",
    "06e1loadingdoc01|Loading Dock",
    "06e2centralhal00|Central Hallway",
    "06e3morticlab000|Mortic Lab",
    "06e4necrotechl00|Necrotech Lab",
    "06e5geflab000000|Gef Lab",
    "06e6lab000000000|Lab",
    "06e7computerce00|Computer Center",
    "06e8destroyedl00|Destroyed Lab",
    "06e9theprisone00|The Prisoner",
    "06e10transport00|Transport Tubes",
    "06researchdome00|Research Dome",
    "06fobservation00|Observation Deck",
    "06concludingth00|Concluding the Adventure",
    "06continuingth00|Continuing the Campaign"
  ] },
  { id: "pzo2400607advent", name: "Adventures on Eox", pages: [
    "07theatraskien00|The Atraskien Shelf",
    "07thehallsofth00|The Halls of the Living",
    "07pactport000000|Pact Port"
  ] },
  { id: "pzo2400608advent", name: "Adventure Toolbox", pages: [] },
  { id: "pzo2400609elebri", name: "Elebrian", pages: [] },
  { id: "pzo2400610corpse", name: "Corpsefolk", pages: [] },
  { id: "pzo2400611aliena", name: "Alien Archive", pages: [] },
  { id: "pzo2400612npcgal", name: "NPC Gallery", pages: [
    "12sanimusslayn00|Sanimus Slayn",
    "12zo000000000000|Zo!",
    "12campaignrole02|Campaign Role"
  ] },
  { id: "pzo2400613player", name: "Player's Guide", pages: [] },
  { id: "pzo2400614artgal", name: "Art Gallery", pages: [
    "12afaella0000000|Afaella",
    "12ahmzovar000000|Ahmzovar",
    "12ancientmanor00|Ancient Manor",
    "12barrow00000000|Barrow",
    "12belenzeshadr00|Belenze Shadraz",
    "12bonespeakerb00|Bone Speaker Bobblehead",
    "12cameradrone000|Camera Drone",
    "12captainconci00|Captain Concierge",
    "12cloudnine00000|Cloud Nine",
    "12corpsefleets00|Corpse Fleet Ship",
    "12defiance000000|Defiance",
    "12emmozie0000000|Emmozie",
    "12eterrinariku00|Eterrina Rikutan",
    "12ghoulflighta00|Ghoul Flight Attendant",
    "12helmutnavdee00|Helmut Navdeep",
    "12iovanammunit00|Iovan Ammunition",
    "12ivorychomper00|Ivory Chompers",
    "12jazzymalsavi00|Jazzy Malsavis",
    "12kitthainekit00|Kitthaine Kitar",
    "12luwazielsebo00|Luwazi Elsebo",
    "12mummywasphiv00|Mummy Wasp Hive",
    "12nobromdarame00|Nobrom Darameer",
    "12noeli000000000|Noeli",
    "12opazari0000000|Opa Zari",
    "12rebechshadra00|Rebech Shadraz",
    "12replicazomic00|Replica Zo! Microphone",
    "12rexalliasrex00|Rexallias “Rex” Steelscale",
    "12sadratphain000|Sadrat Phain",
    "12sanimusslayn00|Sanimus Slayn",
    "12shredskin00000|Shredskin",
    "12shuttleticke00|Shuttle Ticket",
    "12telmarcijusi00|Telmarci Jusinoa",
    "12undeademerge00|Undead Emergency Supply Kit",
    "12vanyravoshin00|Vanyra Voshin",
    "12wazashakevir00|Wazasha Kevir",
    "12whatzonwhatz00|Whatzon Whatz-Gurz"
  ] }
];
const GGW_PLAYLISTS = [
  { id: "9Lmi6mJKs43KDJFy", name: "Loops", ids: {
    "EDmuX95psyohW3Xm": "Cascade Faults", "i76TrHnhY0OFlXzW": "Console Beeps", "MpZ85aVa6ASz8Xhk": "Flaming Gauntlet", "MyjxU0bUHI2QrMgf": "Force Field", "14s3H91shFKpXFEw": "Zombie Horde", "jHyQNoMKfDLtHMJ6": "Lava Flow", "FKRWxLySACPUGukZ": "Meat Jungle", "kWEP3JWKDqCCP1UG": "Mortar Shelling", "trSDeibA70BFTEDQ": "Ticking", "C98RZIykEBDI8U0p": "Projector", "ZTc3bFUhu6OboFp5": "Red Alert", "8VIHNRGy7zIwa2wk": "Shock Grid", "AfScCuh33AjBXYvV": "Souffle Surprise", "A5P0ockY0e6soolv": "Treadmill" } },
  { id: "Faqf1Y1hdWKxx6aH", name: "Ambience", ids: {
    "QcoQFEyV2e3odMuJ": "Absalom Station Indoors", "3UGHotPdDenpJ0xx": "Absalom Station", "YZNRG3iGdWkzkIbS": "Ancient Manor", "9ylvbnYTNWKdmtDI": "Atraskein Shelf", "dXyORrwHC7ALI87s": "Bar Music", "PDmuoBq1a3rF8M6m": "Barrow Facility", "m6hHF5YdOkoOGfKL": "Barrow", "1EA9IxEKf0jrQOfQ": "Depressurized", "znMGVRciBZSi242q": "Doomed Shuttle", "73GOLulbL9bsj1z0": "Drifter's Draught", "bNpJPkdmQS05jMiX": "Eterrina's Barn", "a0g0R1IvepTUBP1F": "Front Lines Frayed", "U3BdAWoQ79ZPyePy": "Halls of The Living", "VTeiXZGMgDq8Ta5Z": "Iovan Station Alpha", "oKWWG8MxcAirKvnv": "Nova Rush Under Attack", "whyK351dclCzDPae": "Nova Rush", "ImSQlwndv0RcTybd": "Pact Port", "bIyMAmdyK4GrlM1d": "Planar Fragment", "Kb5xmTOxogGxpmbC": "Shuttle", "Tdnek0YqeajWGvKc": "Souffle Stadium", "rUCcOxR6SimWAe6H": "Star Citadel Theodrane", "e5uXeWFPBvUdTxWj": "The Defiance", "Ovu1Tv4Ek4gZge93": "The Drift" } },
  { id: "hEYaHAjGo4J9n32B", name: "SFX", ids: {
    "G2VTgrEUFpA8NYFP": "Artillery Impact", "po7HlKwl9B9CN46h": "Burning Rockslide", "K3VHGKRIkERtusuz": "Crowd Boo", "6m8w6oiXRgjLdzNQ": "Crowd Cheer", "6oL9gc6dICwxV178": "Explosion", "DPp2a61nNGdUTeZ2": "Grave Digging", "G46SH1sf94U8ALDs": "Rapid Depressurization", "8jIKklCAaEqVRZ5V": "Sabotage Spinner Wheel", "Zs8WbPGd8RQy9lFB": "Toggle" } }
];
const GGW_MACROS = [
  ["FalzOIaHYaT1j8ye", "Activate Dynamic Ring"], ["LYVnBasloKBssEKp", "Create Crater"], ["9hlzMVsIgmiHl1cj", "Deactivate Force Field"],
  ["xNCCCbuEKNQLm7Du", "Depressurization"], ["OyM9SN0BGKKmda6M", "Dig Grave"], ["gyOntEj0c1MTB7mf", "Dig Grave 1"],
  ["uQWuTTIQ1nBvZg25", "Dig Grave 10"], ["ZeCarpppLZ7FSejU", "Dig Grave 11"], ["oLL01iJKCtBqao3f", "Dig Grave 12"],
  ["COmD9irXCXGWtMZ0", "Dig Grave 13"], ["dv4XzPx6qodeAkDp", "Dig Grave 14"], ["4LsiKqLntH16hRM4", "Dig Grave 15"],
  ["St0lZmXabN5G56S0", "Dig Grave 16"], ["o8n0a6RkFYchkuvF", "Dig Grave 2"], ["nQvprGCV4yEHgyi6", "Dig Grave 3"],
  ["h7LFrTHPg8X8qiBt", "Dig Grave 4"], ["UXlQ0r4GJdhCIpfR", "Dig Grave 5"], ["wWBnh6XBRe2CXHD9", "Dig Grave 6"],
  ["XAmX9YLBXSk6uW9u", "Dig Grave 7"], ["xQ3S9soTMHbdTgGf", "Dig Grave 8"], ["UIKMu8bHCjDH50lk", "Dig Grave 9"],
  ["gGGaSt5KtOSPwEwA", "Disable Anti-aircraft Turret (NE)"], ["4mb52YeU160coHgq", "Disable Anti-aircraft Turret (NW)"], ["8Y2rV7zTvE5BeJeL", "Disable Anti-aircraft Turret (SE)"],
  ["Ls5yjOghrPMAnk65", "Disable Anti-aircraft Turret (SW)"], ["2chjRLv3cI2eYsOe", "Disable Mortars"], ["efLoncochBWHbYYF", "Enable Rig Gradient"],
  ["BYUCaWAGxGY76NKd", "Landing Picker"], ["LdVAtoAoZTYAfDxA", "Preliminary Alert Door Lock"], ["F8AZY7YU9odAKAOb", "Reset Crater"],
  ["Q2pIDHw2j01PdVSu", "Toggle Decontamination"], ["MlMnLwg8fSALiidP", "Toggle Doomed Shuttle Ambience"], ["wPq3osEja3I2OMkd", "Toggle Emergency Force Fields"],
  ["kN83zK5AhmbpgcnK", "Toggle Forcefield"], ["eQc83NSruCwgGKjN", "Toggle Projector"], ["Q5V8s9eFpz5fSiVY", "Toggle Sandbags South"],
  ["bxEaLS7kVBGSiwc1", "Toggle Sandbags West"], ["lazBTVDVFVWQrEAm", "Toggle Shock Grid"], ["lgftdPI0jhVNepU2", "Toggle Token Gradient"]
];
const GGW_SCENES = [
  ["H8X4fWtzq41B0enD", "A. Iovan Station Alpha"],
  ["rDWDTtx1v0p7h0Vb", "Approaching Barrow"],
  ["fFyhdTnPerPaNgMc", "B. Souffle Stadium"],
  ["2uruu1TobCYonPjR", "C. Front Lines Frayed"],
  ["DUN5xy00cDwE9lkZ", "Camping On Eox"],
  ["rnkixlFpkxUDLP75", "Cosmic Capers"],
  ["2LmFAs5VSYgBX44i", "D. Planar Fragment"],
  ["1FOcKGf70ucG7oDX", "Drifter's Draught"],
  ["huhOUcVnEisQNHuR", "E. Auxiliary Research Center"],
  ["bCCpgI9PlQDQ2lA4", "F. Observation Deck"],
  ["UkviH2KWZEWHfeEe", "First Class Disaster"],
  ["gYrKcRYbLunH8CSq", "Kill Squad"],
  ["ddAa8hkhfLPGbDcd", "Landing"],
  ["FJsM8T7mIqKWSYbq", "Malicious Marauders"],
  ["BVeEq94IFopLoUJn", "Nova Rush Lower Deck"],
  ["DR5GA7lfexg7CwFp", "Nova Rush Upper Deck"],
  ["r3m0ZIfo2eHsFdcI", "Pact Port"],
  ["bgV6d83ucPv4SkcM", "Paizo Auxiliary Research Center"],
  ["OGDKtkKUg6aM72Ji", "Paizo Drifter\u2019s Draught"],
  ["fmphimrInA5PK8sC", "Paizo First Class Disaster"],
  ["esE4mMBCX3md5vAy", "Paizo Front Lines Frayed"],
  ["WSnqjdqg8qfQAxPf", "Paizo Iovan Station Alpha"],
  ["ilVUykpbKM92ZHFk", "Paizo Kill Squad"],
  ["8prhpjVFjdHcimkB", "Paizo Observation Deck"],
  ["eCjQJz87mkRdrlUA", "Paizo Pet Snacks"],
  ["Y5ivjR8PJJEkYnrp", "Paizo Planar Fragment"],
  ["eCgoKIVOSJBKo3L2", "Paizo Souffl\u00e9 Stadium"],
  ["LFxuKMrWCkjzxytB", "Paizo Spooked Xoalats"],
  ["lvaKWd7isP1mV11B", "Pet Snacks"],
  ["4fQ0jwzAh9BJq4GW", "Reciprocity"],
  ["PtFIUzqAlNiL1Lzm", "Snake in the Glass"],
  ["zJ2lsr3TjYhJpfF8", "Spooked Xoalats"],
  ["ieSNim8gyixONaFM", "Turret Defense"]
];

/* The Snowy's Maps Waffle House Isekai PF2e module's ids, from its adventure
   pack: its one journal with every page, its three playlists, the map, and
   the two items its journal links to. */
const WHI_JOURNALS = [
  { id: "zfacoIbVRBM543Cb", name: "Dungeon Design", pages: [
    "LqaVuKAI3bfdhfah|GM Background", "VK6CcOYDncx8j364|A1. Break Room", "6tJZkHKC65N2Kmzx|A2. Bathrooms",
    "a4Hj6piXEbWG7I7i|A3. Waiting Tables", "EFRw7eYXVupJp1ru|A4. Cash Register", "t2DAwLryYB7KhSf8|A5. Kitchen",
    "tdXBkrMG8wJCt2VF|Aftermath", "x8MQGs8DmfaOMH90|The Beginning", "Fvf5tUbrS85rDyQ6|...The End"
  ] }
];
const WHI_PLAYLISTS = [
  { id: "fWwhFxPQ0BUfEdxw", name: "A1-A3.", ids: { "aWaOv7jyiiGM9KoC": "Awkward Spellcasting - RPG Music Maker" } },
  { id: "Kej3sX7OzTfKLyqr", name: "A4.", ids: { "8gcc84NHlWRa7aMw": "Spilled Ale - RPG Music Maker" } },
  { id: "KRrwilu5LokuJ9bl", name: "A5.", ids: { "IpjthTPhMyn4nXeb": "Metallic Inspiration - RPG Music Maker" } }
];
const WHI_SCENES = [["evTqLHpKZY5qRI41", "[20x30] waffle house day"]];
const WHI_ITEMS = [["RNAMWIOL8TdmJokG", "Scour"], ["NFm5VTRsR5kFYUZQ", "Striking (Greater)"]];

const SAMPLE_JOURNALS = [
  { id: "pf2apsog02willow", name: "Willowshore", pages: [
    "02willowshores01|Willowshore's Hinterlands",
    "02thewillowsho01|The Willowshore Rumormill",
    "02w38woodedcle00|Wooded Clearing",
    "02w37thegreatw00|The Great Willow",
    "02w36bonesofth00|Bones of the Forgotten",
    "02w35theleshys00|The Leshy's Salon",
    "02w34kawakasho00|Kawaka's Home",
    "02w33spidergat00|Spider Gate",
    "02w32themushro00|The Mushroom House",
    "02w31dock0000000|Dock",
    "02w30fisheries00|Fisheries",
    "02w29tradeoffi00|Trade Office",
    "02w28mothersco00|Mother's Coil",
    "02w27thehandof00|The Hand of Spring",
    "02w26secondbes00|Second Best",
    "02w25woodcarve00|Woodcarver's Guild",
    "02w24hojeonghu00|Ho Jeong-hui's Home",
    "02w23abandoned00|Abandoned Estates",
    "02w22thecerule00|The Cerulean Teahouse",
    "02w21mamabaos000|Mama Bao's",
    "02w20luoandlaw00|Luo and Laws",
    "02w19downtownw00|Downtown Willowshore",
    "02w18willowsho00|Willowshore Dam",
    "02w17woodraftl00|Woodraft Lake",
    "02w16nineearsh00|Nine Ear Shrine",
    "02w15rebelslea00|Rebel's Leatherworks",
    "02w14cloudpape00|Cloud Paper House",
    "02w13jadeitees00|Jadeite Essentials",
    "02w13w15indust00|Industrial District",
    "02w12matsushom00|Matsu's Home",
    "02w11dawnstepb00|Dawnstep Bridge",
    "02w10eternalla00|Eternal Lantern",
    "02w9ladyofsoul00|Lady of Souls",
    "02w8millinghou00|Milling Houses",
    "02w7silvermist00|Silvermist Lodges",
    "02w6thricebles00|Thrice-Blessed Inn",
    "02w5matsukiest00|Matsuki Estate",
    "02w4abadarshri00|Abadar Shrine",
    "02w3gravesidem00|Graveside Manners",
    "02w2willowshor00|Willowshore Stables",
    "02w1eternalbla00|Eternal Blaze Ironworks",
    "02locationsupp00|Location Support",
    "02willowshores00|Willowshore's Rivers and Creeks",
    "02willowshorel00|Willowshore Locations",
    "02buildingrepu00|Building Reputation",
    "02peopleofwill00|People of Willowshore",
    "02thewillowsho00|The Willowshore Mindscape",
    "02willowshore000|Willowshore"
  ] },
  { id: "pf2apsog03toligh", name: "Act 1.1: To Light the Night", pages: [
    "03lightthenigh00|Light the Night",
    "03retakingdawn00|Retaking Dawnstep",
    "03liberatingth00|Liberating the Bridge",
    "03shrinelocati00|Shrine Locations",
    "03blessingthec00|Blessing the Coins",
    "03theworstpuzz00|The Worst Puzzle",
    "03a2clashatthe00|Clash at the Clinic",
    "03a1thetrapped00|The Trapped Hunter",
    "03firstmission00|First Missions",
    "03additionalre00|Additional Requests",
    "03meetinggrann00|Meeting Granny Hu",
    "03crossingthew00|Crossing the Water",
    "03makingcontac01|Making Contact: Northridge",
    "03meetingoldma00|Meeting Old Matsuki",
    "03makingcontac00|Making Contact: Southbank",
    "03returninghom00|Returning Home",
    "03willowshoref00|Willowshore Features",
    "03randomencoun00|Random Encounters",
    "03backtotown0000|Back to Town",
    "03easternwatch00|Eastern Watchtower",
    "03thespiderles00|The Spiderless Gate",
    "03mazeofmistra00|Maze of Mist, Rain of Blood",
    "03strangeaggre00|Strange Aggression",
    "03thefirstdayo00|The First Day of Summer",
    "03gettingstart00|Getting Started",
    "03tolighttheni00|To Light the Night"
  ] },
  { id: "pf2apsog04reclai", name: "Act 1.2: Reclaiming Willowshire", pages: [
    "04b13bathhouse00|Bathhouse Foyer",
    "04b12backyards00|Backyard Storage",
    "04b11mudwallho00|Mudwall House",
    "04b10sanmihous00|Sanmi Household",
    "04b9treesparro00|Treesparrow's Rest",
    "04b8infestedst00|Infested Stables",
    "04b7trainingya00|Training Yard",
    "04b6armory000000|Armory",
    "04b5outdoorpri00|Outdoor Prison Cell",
    "04b4prison000000|Prison",
    "04b3guardhouse00|Guard House Courtyard",
    "04b2imperialgu00|Imperial Guard Office",
    "04b1emptylot0000|Empty Lot",
    "04downtownloca00|Downtown Locations",
    "04liberatingdo00|Liberating Downtown",
    "04reclaimingwi00|Reclaiming Willowshire",
    "04concludingth00|Concluding the Chapter",
    "04c4secondfloo00|Second Floor",
    "04c3privateban00|Private Banquet Hall",
    "04c2pantrypris00|Pantry Prison",
    "04c1publicfloo00|Public Floor",
    "04ceruleanteah00|Cerulean Teahouse",
    "04aparadeofcoo00|A Parade of Cookware",
    "04b17shelynshr00|Shelyn Shrine",
    "04b16publicsta00|Public Stage",
    "04b15mostlyhap00|Mostly Happy Kappas",
    "04b14bathhouse00|Bathhouse Lockers"
  ] },
  { id: "pf2apsog06thewal", name: "Act 1.4: The Wall of Ghosts", pages: [
    "06concludingac00|Concluding Act 1",
    "06arrivingtool00|Arriving too Late",
    "06interrupting00|Interrupting the Ritual",
    "06horrorfrombe00|Horror from Beyond",
    "06zoudousrite000|Zoudou's Rite",
    "06theritualsit00|The Ritual Site",
    "06e17logpiles000|Log Piles",
    "06e16mugiroust00|Mugirou's Throne",
    "06e15outhouses00|Outhouses",
    "06e14workersdo00|Worker's Dormitory",
    "06e13guesthous00|Guest House",
    "06e12treasury000|Treasury",
    "06e11campoffic00|Camp Office",
    "06e10managersd00|Manager's Dormitory",
    "06e9storeroom000|Storeroom",
    "06e8kitchen00000|Kitchen",
    "06e7courtyard000|Courtyard",
    "06e6secretdoor00|Secret Door",
    "06e5loadingisl00|Loading Island",
    "06e4guarddormi00|Guard Dormitory",
    "06e3oxstables000|Ox Stables",
    "06e2guardtower00|Guard Tower",
    "06e1entrance0000|Entrance",
    "06lumbercampfe00|Lumber Camp Features",
    "06themerchantr00|The Merchant Returns",
    "06advanceknowl00|Advance Knowledge",
    "06thelumbercam00|The Lumber Camp",
    "06thewallofgho00|The Wall of Ghosts"
  ] },
  { id: "pf2apsog05thewil", name: "Act 1.3: The Willowshore Curse", pages: [
    "05wholeadswill00|Who Leads Willowshore?",
    "05speakingwith00|Speaking with Ugly Cute",
    "05rescuingugly00|Rescuing Ugly Cute",
    "05searchingthe00|Searching the Hinterlands",
    "05consultingsi00|Consulting Silvermist",
    "05searchingfor00|Searching for Ugly Cute",
    "05returningtog00|Returning to Great Willow",
    "05intotheinfes00|Into the Infestation",
    "05talkingwithg00|Talking with Great Willow",
    "05visitinggrea00|Visiting Great Willow",
    "05themists000000|The Mists",
    "05songsatcanar00|Songs at Canary Inn",
    "05ghostsintheg00|Ghosts in the Grass",
    "05themissinggo00|The Missing Governor",
    "05investigatin00|Investigating the Curse",
    "05opportunitie00|Opportunities",
    "05wallofghosts00|Wall of Ghosts",
    "05ppeachwoodgr00|Peachwood Grove",
    "05d13theroadto00|The Road to Enlightenment",
    "05d12ritualsit00|Ritual Site",
    "05d11lumbercam00|Lumber Camp",
    "05d10gorgeoffa00|Gorge of Fangs and Teeth",
    "05d9eyesoffume00|Eyes of Fumeiyoshi",
    "05d8oldvillage00|Old Village Expansion",
    "05d7infestedgr00|Infested Grove",
    "05d6huntershut00|Hunter’s Hut",
    "05d5greensilkp00|Green Silk Peak",
    "05d4canaryinn000|Canary Inn",
    "05d3treacherou00|Treacherous Trail",
    "05d2gourdlake000|Gourd Lake",
    "05d1willowshor00|Willowshore",
    "05exploringthe00|Exploring the Hinterlands",
    "05themindscape00|The Mindscape Border",
    "05intothehinte00|Into the Hinterlands",
    "05themysteriou00|The Mysterious Merchant",
    "05thewillowsho00|The Willowshore Curse"
  ] },
  { id: "pf2apsog07turnin", name: "Act 2.1: Turning of the Seasons", pages: [
    "07week12vanish00|Week 12: Vanishings",
    "07week11thefac00|Week 11: The Face at the Foot of the Bed",
    "07thenextday0000|The Next Day",
    "07afterthefeas00|After the Feast",
    "07nightofthefe00|Night of the Feast",
    "07preparingfor01|Preparing for the Feast",
    "07shinzossugge00|Shinzo’s Suggestion",
    "07week10feasto00|Week 10: Feast of the Kami",
    "07week9kimchis00|Week 9: Kimchi’s Ascent",
    "07week8stablef00|Week 8: Stable Fire",
    "07week7anicygr00|Week 7: An Icy Grasp",
    "07week6theface00|Week 6: The Faceless Ghost",
    "07week5themiss00|Week 5: The Missing Corpse",
    "07week4haunted00|Week 4: Haunted Hair",
    "07shinzosvisit00|Shinzo’s Visit",
    "07onthenightof00|On the Night of the Festival",
    "07week3firstlo00|Week 3: First Long Night",
    "07week2aslithe00|Week 2: A Slithering Situation",
    "07week1anoffer00|Week 1: An Offering for Daikitsu",
    "07willowshoree00|Willowshore Events",
    "07researchingt00|Researching the Curse",
    "07increasingse00|Increasing Security",
    "07gatheringfoo00|Gathering Food",
    "07restoringthe00|Restoring the Teahouse",
    "07bolsteringho00|Bolstering Hope",
    "07preparingfor00|Preparing for Winter",
    "07willowshorei00|Willowshore in the Fall",
    "07gettingstart00|Getting Started",
    "07turningofthe00|Turning of the Seasons"
  ] },
  { id: "pf2apsog08theenl", name: "Act 2.2: The Enlightened Path", pages: [
    "08thefinalday000|The Final Day",
    "08d3mountainsh00|Mountain Shrine",
    "08d2awhisperin00|A Whisper in the Woods",
    "08d1avoiceinth00|A Voice in the Fog",
    "08thethirdday000|The Third Day",
    "08c3gardenshri00|Garden Shrine",
    "08c2thegirlint00|The Girl in the Tree",
    "08c1hungryfoli00|Hungry Foliage",
    "08thesecondday00|The Second Day",
    "08b3bridgeshri00|Bridge Shrine",
    "08b2serpentamb00|Serpent Ambush",
    "08b1tormentedk00|Tormented Kappa",
    "08thefirstday000|The First Day",
    "08walkingthepa00|Walking the Path",
    "08thepilgrimsp00|The Pilgrim’s Path",
    "08plantingthes00|Planting the Soul Seed",
    "08a3thesoulthi00|The Soulthief’s Nest",
    "08a2tansuijing00|Tan Sui-Jing’s Grave",
    "08a1entrance0000|Entrance",
    "08intothewallo00|Into the Wall of Ghosts",
    "08performingth00|Performing the Ritual",
    "08throughthewa00|Through the Wall of Ghosts",
    "08theenlighten00|The Enlightened Path"
  ] },
  { id: "pf2apsog09inther", name: "Act 2.3: In the Ruins of Wisdom", pages: [
    "09returntowill00|Return to Willowshore",
    "09concludingth00|Concluding the Act",
    "09e16kugaptees00|Kugaptee’s Grave",
    "09e15treasurec00|Treasure Chamber",
    "09e14storagero00|Storage Room",
    "09e13thetansug00|The Tan Sugi",
    "09e12burialgar00|Burial Garden",
    "09e11hiddenlib00|Hidden Library",
    "09e10library0000|Library",
    "09e9dorms0000000|Dorms",
    "09e8storage00000|Storage",
    "09e7kitchen00000|Kitchen",
    "09e6refectory000|Refectory",
    "09e5pharasmass00|Pharasma’s Shrine",
    "09e4infirmary000|Infirmary",
    "09e3mainhall0000|Main Hall",
    "09e2courtyard000|Courtyard",
    "09e1grandgate000|Grand Gate",
    "09monasteryfea00|Monastery Features",
    "09fourthpurifi00|Fourth Purification",
    "09thirdpurific00|Third Purification",
    "09secondpurifi00|Second Purification",
    "09firstpurific00|First Purification",
    "09purifyingthe00|Purifying the Monastery",
    "09resting0000000|Resting",
    "09tansugimonas00|Tan Sugi Monastery",
    "09intheruinsof00|In the Ruins of Wisdom"
  ] },
  { id: "pf2apsog17firstl", name: "First Long Night", pages: [
    "17blacksesames00|Black Sesame Soup with Peanut-filled Glutinous Ric",
    "17shenmensalta00|Shenmen Salt and Pepper Mooncakes",
    "17festivalfood00|Festival Foods",
    "17festivalfash00|Festival Fashion",
    "17lanternmakin00|Lantern Making",
    "17bundlecuttin00|Bundle-Cutting",
    "17admiringthem00|Admiring the Moon",
    "17traditionalc00|Traditional Contests",
    "17agilityunder00|Agility under Oppression",
    "17seasonalmark00|Seasonal Markets",
    "17bribingfumei00|Bribing Fumeiyoshi",
    "17ghostsorance00|Ghosts... or Ancestors-",
    "17enlighteneds00|Enlightened Self-Interest",
    "17communalrevi00|Communal Revivals",
    "17coldnightswa00|Cold Nights, Warm Hearts",
    "17festivalcele00|Festival Celebrations",
    "17firstlongnig00|First Long Night"
  ] },
];

class StubJournal {
  constructor(spec) {
    this.id = spec.id;
    this.name = spec.name;
    this.pages = spec.pages.map(p => {
      const [id, name] = p.split("|");
      return { id, name };
    });
    this.pages.get = (id) => this.pages.find(p => p.id === id) ?? null;
    this.sheet = {
      render: (force, opts = {}) => {
        const page = this.pages.find(p => p.id === opts.pageId);
        console.log("[journal]", this.name, page ? `→ ${page.name}` : "(first page)");
      }
    };
  }
}

/* Named defensively: a macro and the stub share one global scope out here,
   which they never do inside Foundry, so anything generic — `JOURNALS`, say —
   will eventually collide with a macro's own constant and stop it loading. */
const STUB_JOURNAL_DOCS = globalThis.__previewJournals === false
  ? [] : [...SAMPLE_JOURNALS, ...BB_JOURNALS, ...MMC_JOURNALS, ...GGW_JOURNALS, ...WHI_JOURNALS].map(s => new StubJournal(s));

const journalCollection = {
  get: (id) => STUB_JOURNAL_DOCS.find(j => j.id === id) ?? null,
  getName: (name) => STUB_JOURNAL_DOCS.find(j => j.name === name) ?? null,
  find: (fn) => STUB_JOURNAL_DOCS.find(fn) ?? null,
  [Symbol.iterator]: () => STUB_JOURNAL_DOCS[Symbol.iterator]()
};

/* --------------------------------------------------------------- playlists

   Two of the Season of Ghosts module's fifteen playlists, with their real
   document ids and sound names, so a console's play buttons resolve and
   toggle the way they will in a world that has the adventure. Nothing is
   decoded or played — `playing` is a flag, and starting a sound fires
   `updatePlaylistSound` so anything listening repaints. */
const SAMPLE_PLAYLISTS = [
  { id: "HgqDtdyAVJFT3Dr1", name: "Ambience", sounds: [
    "Woods", "Mist Urban", "Mist Nature", "Indoors", "Occupied Willowshore", "Willowshore",
    "Willowshore Hinterlands", "Dense Fog", "Canary Inn", "Wind", "The Lumber Camp"
  ] },
  { id: "jXKZ6O8NnYJaazKE", name: "Ambiance", sounds: [
    "Indoors", "Feast Of The Kami", "Willowshore", "Willowshore Hinterlands", "Mist Indoors",
    "Mist Outdoors", "Dense Fog", "Woods", "Festival", "Barn Fire", "Rain", "Thunderstorm",
    "Old Large Monastery", "Kugaptees Grave"
  ] },
  { id: "e2Pf6JGVba202cFB", name: "Loop", sounds: ["River", "Waterfall"] },
  { id: "dbfW0zvQ2tf5VOCx", name: "Looped Soundtrack", sounds: [
    "09 Let The Leaves Fall Loop", "10 Researching The Curse Loop", "13 First Long Night Loop",
    "01 Season of Ghosts Loop"
  ] }
];

class StubPlaylist {
  constructor(spec) {
    this.id = spec.id;
    this.name = spec.name;
    /* `sounds` invents ids positionally; `ids` gives them explicitly, which is
       what a console keyed to a real module's sound ids needs. */
    const sounds = spec.ids
      ? Object.entries(spec.ids).map(([id, name]) => ({ id, name, playing: false }))
      : spec.sounds.map((name, i) => ({ id: `${spec.id}s${i}`, name, playing: false }));
    this.sounds = {
      getName: (n) => sounds.find(s => s.name === n) ?? null,
      get: (id) => sounds.find(s => s.id === id) ?? null,
      [Symbol.iterator]: () => sounds[Symbol.iterator]()
    };
    this._sounds = sounds;
  }
  async playSound(sound) { sound.playing = true; this._changed(sound); }
  async stopSound(sound) { sound.playing = false; this._changed(sound); }
  async stopAll() { for (const s of this._sounds) if (s.playing) await this.stopSound(s); }
  _changed(sound) {
    console.log("[playlist]", `${sound.playing ? "play" : "stop"} ${this.name} / ${sound.name}`);
    Hooks.callAll("updatePlaylistSound", sound, { playing: sound.playing }, {}, "gm");
  }
}

const STUB_PLAYLIST_DOCS = [...SAMPLE_PLAYLISTS, ...BB_PLAYLISTS, ...MMC_PLAYLISTS, ...GGW_PLAYLISTS, ...WHI_PLAYLISTS].map(s => new StubPlaylist(s));

/* ------------------------------------------------------- macros and scenes
   Enough of each to let a console's "run the module's macro" and "activate
   the scene" buttons resolve. Neither actually does anything out here. */
const STUB_MACRO_DOCS = [...BB_MACROS, ...MMC_MACROS, ...GGW_MACROS].map(([id, name]) => ({
  id, name,
  execute: async () => console.log("[macro]", name)
}));
const macroCollection = {
  get: (id) => STUB_MACRO_DOCS.find(m => m.id === id) ?? null,
  getName: (name) => STUB_MACRO_DOCS.find(m => m.name === name) ?? null,
  [Symbol.iterator]: () => STUB_MACRO_DOCS[Symbol.iterator]()
};

const STUB_SCENE_DOCS = [...BB_SCENES, ...MMC_SCENES, ...GGW_SCENES, ...WHI_SCENES].map(([id, name]) => ({
  id, name,
  activate: async () => console.log("[scene]", `activate ${name}`),
  view: async () => console.log("[scene]", `view ${name}`)
}));
const sceneCollection = {
  get: (id) => STUB_SCENE_DOCS.find(s => s.id === id) ?? null,
  getName: (name) => STUB_SCENE_DOCS.find(s => s.name === name) ?? null,
  [Symbol.iterator]: () => STUB_SCENE_DOCS[Symbol.iterator]()
};
/* World items, by id — the ones an adventure import brings in. */
const STUB_WORLD_ITEMS = WHI_ITEMS.map(([id, name]) => ({
  id, name, sheet: { render: () => console.log("[sheet]", name) }
}));
const itemCollection = {
  get: (id) => STUB_WORLD_ITEMS.find(i => i.id === id) ?? null,
  getName: (name) => STUB_WORLD_ITEMS.find(i => i.name === name) ?? null,
  [Symbol.iterator]: () => STUB_WORLD_ITEMS[Symbol.iterator]()
};
const playlistCollection = {
  get size() { return STUB_PLAYLIST_DOCS.length; },
  get: (id) => STUB_PLAYLIST_DOCS.find(p => p.id === id) ?? null,
  getName: (name) => STUB_PLAYLIST_DOCS.find(p => p.name === name) ?? null,
  find: (fn) => STUB_PLAYLIST_DOCS.find(fn) ?? null,
  [Symbol.iterator]: () => STUB_PLAYLIST_DOCS[Symbol.iterator]()
};

/* ----------------------------------------------------------------- globals */

const settingStore = new Map();
const settingDefs = new Map();

/* An array, because macros iterate it — with the two collection members they
   also reach for hung off the side. The GM stays active even when previewing
   as a player, so a macro that relays writes to the GM doesn't take its "no
   GM logged in" branch. */
const PREVIEW_PLAYER = globalThis.__previewPlayer ?? null;

/* A User a macro can hang a flag on. Setting one fires `updateUser` with the
   same `changes` shape Foundry sends, which is how a player-facing board
   relays a request to the GM without a registered socket namespace. */
function stubUser(spec) {
  const u = { flags: {}, ...spec };
  u.getFlag = (scope, key) => u.flags?.[scope]?.[key];
  u.setFlag = async (scope, key, value) => {
    (u.flags[scope] ??= {})[key] = value;
    globalThis.Hooks.call("updateUser", u, { flags: { [scope]: { [key]: value } } }, {}, u.id);
    return u;
  };
  u.unsetFlag = async (scope, key) => { delete u.flags?.[scope]?.[key]; return u; };
  return u;
}

const userList = [stubUser({ id: "gm", isGM: true, active: true, character: null, name: "Gamemaster" })];
if (PREVIEW_PLAYER) {
  userList.push(stubUser({ id: "player", isGM: false, active: true, name: "Player",
                           character: ACTORS.find(a => a.id === PREVIEW_PLAYER) ?? null }));
}
userList.get = (id) => userList.find(u => u.id === id) ?? null;
Object.defineProperty(userList, "activeGM", {
  get: () => userList.find(u => u.isGM && u.active) ?? null
});

/* Looped back, but only for a namespace the real server would actually relay.
   A socket namespace has to be registered by an installed package, so
   `module.<id>` works only for an active module and `system.<id>` only for the
   active system; anything else is accepted by emit and silently dropped. That
   silence is worth reproducing — a macro that invents a namespace looks like it
   works on the sender's own screen, and this is the harness that should catch
   it rather than a live table. */
const socketHandlers = new Map();
const socketRelays = (event) => {
  const [kind, id] = String(event).split(".");
  if (kind === "system") return id === globalThis.game?.system?.id;
  if (kind === "module") return !!globalThis.game?.modules?.get(id)?.active;
  return false;
};
const socketStub = {
  on: (event, fn) => { socketHandlers.set(event, fn); },
  emit: (event, data) => {
    if (!socketRelays(event)) {
      console.warn("[socket] dropped —", event,
        "is not a namespace any installed package registered. Foundry accepts the emit and relays nothing.");
      return;
    }
    console.log("[socket]", event, data);
    const fn = socketHandlers.get(event);
    if (fn) setTimeout(() => fn(data), 0);
  }
};

globalThis.game = {
  user: PREVIEW_PLAYER
    ? userList.find(u => u.id === "player")
    : userList.find(u => u.id === "gm"),
  users: userList,
  socket: socketStub,
  /* No modules installed unless a fixture asks for the Sequencer stand-in,
     which is what makes the socket namespace check above mean something. */
  system: { id: "pf2e", title: "Pathfinder Second Edition" },
  modules: { get: () => ({ active: false }) },
  actors: actorCollection,
  journal: journalCollection,
  playlists: playlistCollection,
  macros: macroCollection,
  scenes: sceneCollection,
  items: itemCollection,
  packs: [],   /* no compendiums out here; the world lookup is what's exercised */
  settings: {
    settings: settingDefs,
    register: (ns, key, def) => settingDefs.set(`${ns}.${key}`, def),
    get: (ns, key) => settingStore.get(`${ns}.${key}`) ?? null,
    set: (ns, key, value) => { settingStore.set(`${ns}.${key}`, value); return Promise.resolve(value); }
  }
};

globalThis.ui = {
  notifications: {
    info: (m) => console.info("[notify]", m),
    warn: (m) => console.warn("[notify]", m),
    error: (m) => console.error("[notify]", m)
  }
};

/* Hooks really dispatch here: a console that repaints itself when something
   outside it changes — a playlist starting, say — can only be exercised if
   the hook it listens on actually fires. */
const hookHandlers = new Map();
let hookId = 0;
globalThis.Hooks = {
  on: (name, fn) => { const id = ++hookId;
    if (!hookHandlers.has(name)) hookHandlers.set(name, new Map());
    hookHandlers.get(name).set(id, fn); return id; },
  once: (name, fn) => globalThis.Hooks.on(name, fn),
  off: (name, id) => { hookHandlers.get(name)?.delete(id); },
  call: (name, ...args) => { for (const fn of hookHandlers.get(name)?.values() ?? []) fn(...args); return true; },
  callAll: (name, ...args) => globalThis.Hooks.call(name, ...args)
};

/* ------------------------------------------------------------------- items

   A few PF2e-shaped physical items so a macro that accepts a dragged item can
   be exercised: a coin-purse Price, a level, a rarity, and a uuid. Aiko knows
   the first one's formula and nobody knows the rest. */
const STUB_ITEMS = [
  { uuid: "Compendium.pf2e.equipment-srd.Item.aaaa0000", name: "Staff of Fire", level: 8,
    price: { gp: 230 }, rarity: "common" },
  { uuid: "Compendium.pf2e.equipment-srd.Item.bbbb0000", name: "+1 Striking Longsword", level: 4,
    price: { gp: 35 }, rarity: "common" },
  { uuid: "Compendium.pf2e.equipment-srd.Item.cccc0000", name: "Ghost Touch Rune", level: 4,
    price: { gp: 77 }, rarity: "uncommon" },
  { uuid: "Compendium.pf2e.equipment-srd.Item.dddd0000", name: "Healing Potion (Minor)", level: 1,
    price: { gp: 4 }, rarity: "common" },
  /* Priced in mixed coin, to prove the flattening to gp. */
  { uuid: "Compendium.pf2e.equipment-srd.Item.eeee0000", name: "Everburning Torch", level: 2,
    price: { gp: 15, sp: 5 }, rarity: "common" },
  /* Not a physical item: no Price at all, so it must be refused. */
  { uuid: "Compendium.pf2e.feats-srd.Item.ffff0000", name: "Toughness", level: 1,
    price: undefined, rarity: "common" }
].map(spec => ({
  uuid: spec.uuid,
  name: spec.name,
  system: {
    level: { value: spec.level },
    ...(spec.price === undefined ? {} : { price: { value: spec.price } }),
    traits: { rarity: spec.rarity }
  },
  sheet: { render: () => console.log("[sheet]", spec.name) }
}));

/* Foundry v13 moved TextEditor under foundry.applications.ux; macros are
   written against both, so both are answered here. */
const dragEventData = (event) => {
  try { return JSON.parse(event.dataTransfer.getData("text/plain")); } catch { return null; }
};
globalThis.TextEditor = { getDragEventData: dragEventData };

globalThis.ChatMessage = {
  getSpeaker: () => ({ alias: "Gamemaster" }),
  create: (data) => { console.log("[chat]", data?.content ?? data); return Promise.resolve(data); }
};

globalThis.Dialog = { confirm: () => Promise.resolve(false) };

/* Enough of Roll for macros that roll a die and read .total. Seeded so a
   capture of a rolled result is reproducible rather than flickering. */
let rollSeed = 1;
globalThis.Roll = class Roll {
  constructor(formula) { this.formula = formula; this.total = 0; }
  async evaluate() {
    const m = /^(\d*)d(\d+)([+-]\d+)?$/.exec(this.formula.replace(/\s/g, ""));
    if (!m) { this.total = 0; return this; }
    const count = Number(m[1] || 1), faces = Number(m[2]), flat = Number(m[3] || 0);
    let sum = flat;
    for (let i = 0; i < count; i++) {
      rollSeed = (rollSeed * 1103515245 + 12345) & 0x7fffffff;   // deterministic
      sum += (rollSeed % faces) + 1;
    }
    this.total = sum;
    return this;
  }
  roll() { return this.evaluate(); }
};

/* Compendium lookups resolve to one of the sample items where the uuid matches
   one, so a dragged item carries a real Price and level; anything else gets a
   stand-in whose sheet render is a no-op, so "open the statblock" buttons can
   be exercised without a real world. */
globalThis.fromUuid = async (uuid) => STUB_ITEMS.find(i => i.uuid === uuid) ?? {
  uuid, name: uuid.split(".").pop(),
  sheet: { render: () => console.log("[sheet]", uuid) }
};

/* Opt-in Sequencer stand-in, switched on by a fixture setting
   `__previewSequencer`. It reports any jb2a./psfx. key as installed and
   records what a sequence was built from, so effect code paths can be
   exercised and asserted without the real modules. Never on by default —
   a macro's "no Sequencer" branch needs testing too. */
if (globalThis.__previewSequencer) {
  const calls = [];
  globalThis.__sequences = calls;
  const section = (kind, entry) => {
    const self = {
      file: (f) => { entry.file = f; return self; },
      atLocation: (t) => { entry.at = t?.name ?? "location"; return self; },
      scale: (n) => { entry.scale = n; return self; },
      screenSpace: () => { entry.screenSpace = true; return self; },
      screenSpaceAnchor: (a) => { entry.anchor = a; return self; },
      shake: (o) => { entry.shake = o; return self; }
    };
    entry.kind = kind;
    return self;
  };
  globalThis.Sequence = class Sequence {
    constructor() { this.parts = []; calls.push(this.parts); }
    effect() { const e = {}; this.parts.push(e); return section("effect", e); }
    sound() { const e = {}; this.parts.push(e); return section("sound", e); }
    canvasPan() { const e = {}; this.parts.push(e); return section("canvasPan", e); }
    async play() { return this; }
  };
  globalThis.Sequencer = {
    Database: { entryExists: (k) => /^(jb2a|psfx)\./.test(k) }
  };
  game.modules = { get: (id) => ({ id, active: ["sequencer", "jb2a_patreon", "psfx"].includes(id) }) };
  globalThis.canvas = { tokens: { controlled: [] }, dimensions: { width: 4000, height: 3000 }, scene: {} };
}

globalThis.foundry = {
  utils: {
    escapeHTML: (s) => String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    deepClone: (v) => (v === null || typeof v !== "object") ? v : JSON.parse(JSON.stringify(v)),
    randomID: (n = 16) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let out = ""; for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    },
    mergeObject: (original, other = {}, options = {}) => {
      const target = options.inplace === false
        ? globalThis.foundry.utils.deepClone(original)
        : original;
      const merge = (dst, src) => {
        for (const [k, v] of Object.entries(src ?? {})) {
          if (v && typeof v === "object" && !Array.isArray(v) &&
              dst[k] && typeof dst[k] === "object" && !Array.isArray(dst[k])) merge(dst[k], v);
          else dst[k] = v;
        }
        return dst;
      };
      return merge(target, other);
    }
  },
  /* Journal.show, where v13 keeps it — enough for a "show to players"
     button to resolve. Nothing is shown; the call is logged. */
  documents: {
    collections: {
      Journal: { show: async (doc, opts = {}) => console.log("[journal.show]", doc?.name, opts.force ? "(forced)" : "") }
    }
  },
  applications: {
    api: {},
    /* v13 moved TextEditor here; the v11/v12 global above still answers too. */
    ux: { TextEditor: { implementation: { getDragEventData: dragEventData } } }
  }
};

/* ------------------------------------------------------ ApplicationV2 stub */

/* Reproduces the DOM shape the real ApplicationV2 builds — an outer element
   carrying the app id, a window header, and a `.window-content` section — so
   selectors like `#ep-console .window-content` match here the same way they
   match in Foundry. */
class ApplicationV2 {
  constructor(options = {}) {
    this.options = options;
    globalThis.__previewApp = this;
  }

  static DEFAULT_OPTIONS = {};

  get opts() {
    return { ...ApplicationV2.DEFAULT_OPTIONS, ...(this.constructor.DEFAULT_OPTIONS ?? {}) };
  }

  async render() {
    const o = this.opts;
    const host = document.getElementById("stage");
    let app = document.getElementById(o.id);

    if (!app) {
      const width = o.position?.width;
      app = document.createElement("div");
      app.id = o.id;
      app.className = `application ${(o.classes ?? []).join(" ")}`;
      if (typeof width === "number") app.style.width = `${width}px`;
      app.innerHTML = `
        <header class="window-header">
          <i class="${o.window?.icon ?? "fa-solid fa-scroll"}"></i>
          <h4 class="window-title">${this.title ?? o.window?.title ?? "Macro"}</h4>
          <button type="button" class="header-control"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <section class="window-content"></section>`;
      host.appendChild(app);
    }

    const content = app.querySelector(".window-content");
    const result = await this._renderHTML();

    if (typeof this._replaceHTML === "function") this._replaceHTML(result, content);
    else { content.innerHTML = result; this.wire?.(content); }

    document.body.dataset.ready = "true";
    return this;
  }

  close() { return Promise.resolve(this); }
  bringToFront() {}
}

globalThis.foundry.applications.api.ApplicationV2 = ApplicationV2;
globalThis.Application = ApplicationV2;

/* Seeded state, set by the page before the macro script loads. Lets a preview
   show a console mid-session rather than an untouched one. */
if (globalThis.__previewSeed) {
  for (const [id, value] of Object.entries(globalThis.__previewSeed)) {
    if (id.startsWith("__")) continue;
    settingStore.set(id, value);
    settingDefs.set(id, { scope: "world", config: false, type: Object, default: null });
  }
}
