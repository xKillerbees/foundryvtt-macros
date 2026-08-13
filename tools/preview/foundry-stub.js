/* Minimal Foundry VTT stand-in, just large enough to render a macro's window
   outside of Foundry so screenshots can be captured for the README.

   The macros in this repo touch a small, well-defined slice of the API:

     foundry.utils.{escapeHTML, mergeObject, deepClone, randomID}
     foundry.applications.api.ApplicationV2
     game.settings.{register, get, set, settings.has}
     game.actors (iterable, .get, .find, .party)
     game.users (iterable, .get, .activeGM), game.user, game.journal.getName
     game.socket.{on, emit} — looped back, so a relayed write round-trips
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
    lores: [["Absalom Lore", 1], ["Academia Lore", 1]] },
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
        level: { value: spec.level },
        class: { name: spec.cls },
        ancestry: { name: spec.ancestry }
      },
      abilities: Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map(k =>
        [k, { mod: k === "con" ? (spec.con ?? 2) : 2 }]))
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

    /* Everyone in the sample party is player-owned, so the GM preview can
       edit any of them and the ownership check still runs. */
    this.testUserPermission = (user) => !!user?.isGM || this.hasPlayerOwner;
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

const ALL_ACTORS = [...ACTORS, ...TAG_ALONGS];

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

const SAMPLE_JOURNALS = [
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
  ? [] : [...SAMPLE_JOURNALS, ...BB_JOURNALS].map(s => new StubJournal(s));

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
  _changed(sound) {
    console.log("[playlist]", `${sound.playing ? "play" : "stop"} ${this.name} / ${sound.name}`);
    Hooks.callAll("updatePlaylistSound", sound, { playing: sound.playing }, {}, "gm");
  }
}

const STUB_PLAYLIST_DOCS = [...SAMPLE_PLAYLISTS, ...BB_PLAYLISTS].map(s => new StubPlaylist(s));

/* ------------------------------------------------------- macros and scenes
   Enough of each to let a console's "run the module's macro" and "activate
   the scene" buttons resolve. Neither actually does anything out here. */
const STUB_MACRO_DOCS = BB_MACROS.map(([id, name]) => ({
  id, name,
  execute: async () => console.log("[macro]", name)
}));
const macroCollection = {
  get: (id) => STUB_MACRO_DOCS.find(m => m.id === id) ?? null,
  getName: (name) => STUB_MACRO_DOCS.find(m => m.name === name) ?? null,
  [Symbol.iterator]: () => STUB_MACRO_DOCS[Symbol.iterator]()
};

const STUB_SCENE_DOCS = BB_SCENES.map(([id, name]) => ({
  id, name,
  activate: async () => console.log("[scene]", `activate ${name}`)
}));
const sceneCollection = {
  get: (id) => STUB_SCENE_DOCS.find(s => s.id === id) ?? null,
  getName: (name) => STUB_SCENE_DOCS.find(s => s.name === name) ?? null,
  [Symbol.iterator]: () => STUB_SCENE_DOCS[Symbol.iterator]()
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
   also reach for hung off the side. */
const userList = [{ id: "gm", isGM: true, active: true, character: null, name: "Gamemaster" }];
userList.get = (id) => userList.find(u => u.id === id) ?? null;
Object.defineProperty(userList, "activeGM", {
  get: () => userList.find(u => u.isGM && u.active) ?? null
});

/* Looped straight back, so a macro that relays a write to the GM and waits for
   it to come round again can be exercised with one browser open. */
const socketHandlers = new Map();
const socketStub = {
  on: (event, fn) => { socketHandlers.set(event, fn); },
  emit: (event, data) => {
    console.log("[socket]", event, data);
    const fn = socketHandlers.get(event);
    if (fn) setTimeout(() => fn(data), 0);
  }
};

globalThis.game = {
  user: { id: "gm", isGM: true, active: true, name: "Gamemaster" },
  users: userList,
  socket: socketStub,
  actors: actorCollection,
  journal: journalCollection,
  playlists: playlistCollection,
  macros: macroCollection,
  scenes: sceneCollection,
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

/* Compendium lookups resolve to a stand-in whose sheet render is a no-op, so
   "open the statblock" buttons can be exercised without a real world. */
globalThis.fromUuid = async (uuid) => ({
  uuid, name: uuid.split(".").pop(),
  sheet: { render: () => console.log("[sheet]", uuid) }
});

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
  applications: { api: {} }
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
