/* ============================================================================
   MENACE UNDER OTARI — GM Console
   Pathfinder Second Edition · the Beginner Box adventure · four 1st-level heroes
   Foundry VTT v11 / v12 / v13 / v14  •  built for the pf2e system
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   Runs the whole adventure: nineteen areas over two floors, the XP ledger that
   decides when the heroes hit 2nd level, and the handful of earlier choices
   that quietly change later rooms.

   Everything it points at belongs to the Pathfinder Beginner Box module —
   journal pages, creature and loot actors, playlists, scenes, and the module's
   own four area macros. Every id below was read out of the module's own
   adventure pack, not transcribed from the book, and an adventure import keeps
   those ids. Nothing is duplicated here: no stat blocks, no loot tables.

   Without the module imported the console still runs; the buttons say what is
   missing instead of failing silently.
   ============================================================================ */

const BB_NS = "world";
const BB_KEY = "pf2eMenaceUnderOtari";
const BB_ID = `${BB_NS}.${BB_KEY}`;
const MAX_PCS = 6;

const THEME = "lantern";
const PALETTES = {
  /* Torchlight on wet stone — the Otari caverns. */
  lantern: {
    paper: "#12100d", card: "#1b1815", ink: "#eae2d4", line: "#3a332a", muted: "#a2947f",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(240,190,110,.10)", field: "#0d0b09",
    rust: "#d05a3c", ember: "#e0a349", moss: "#69b87f", slate: "#6c9fc0", plum: "#a582cc", gold: "#e2c169"
  },
  daylight: {
    paper: "#f3efe7", card: "#ffffff", ink: "#1b1815", line: "#cbc0ae", muted: "#6a5f50",
    stripe: "rgba(0,0,0,.04)", hover: "rgba(0,0,0,.06)", field: "#faf7f1",
    rust: "#a63c22", ember: "#8c5c12", moss: "#1e7a49", slate: "#1f6289", plum: "#66429e", gold: "#8a6a12"
  }
};

/* --------------------------------------------------- inline check helper */
const SKILL_WORDS = ["Acrobatics", "Arcana", "Athletics", "Crafting", "Deception",
  "Diplomacy", "Intimidation", "Medicine", "Nature", "Occultism", "Performance",
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

/* ------------------------------------------------------------ the module
   Document ids from the Pathfinder Beginner Box module's adventure pack. An
   adventure import preserves them, so these resolve in any world that has
   imported "Menace Under Otari". */
const MODULE = { id: "pf2e-beginner-box", title: "Pathfinder Beginner Box" };
const JOURNAL = "qFSLpCM2cpRQWCR2";          // Menace Under Otari
const GM_JOURNAL = "S1UnJk4t55aRFaCs";       // Gamemastering
const HERO_JOURNAL = "KIpNnMtah73eyPC8";     // Creating Your Hero
const LEVEL_PAGE = "DXbYBjutIcp4bmB7";       // Creating Your Hero → Leveling Up

const SCENES = [
  { id: "c7E7PXzgT5RBkT7S", name: "Otari", note: "The town above — the fishery, and where the heroes sell and resupply." },
  { id: "U5t0Mq8glKBXO3qH", name: "Landing", note: "The fishery basement stairs." },
  { id: "JJJCFUCadDPRwnSX", name: "Floor 1", note: "Areas 1 – 11." },
  { id: "cgv9iVmx3dNIL3YA", name: "Floor 2", note: "Areas 12 – 19." }
];

/* The module's own macros. The journal tells the GM to click these, so the
   console offers them beside the area they belong to rather than making the
   GM hunt the directory. */
const MOD_MACROS = {
  barricade4: { id: "saQTdI63wy22v5yk", name: "Area 04 - Barricade" },
  barricade12: { id: "pb7k8V9m7cFioy6B", name: "Area 12 - Barricade" },
  cinder: { id: "iPvtf4ZGr6qX8OnF", name: "Area 14- Cinder Rat" },
  tunnel: { id: "NAxPG4cHu4dKrx6h", name: "Area 15 - Freshly Dug Tunnel" },
  encounters: { id: "MppBkkOiWyW1z6fW", name: "Quick Reference: Encounters" },
  dcs: { id: "x0YlgNBucXkYT6RG", name: "Quick Reference: DCs" }
};

/* Playlists and sounds, by id. The adventure ships its own audio and it is
   better than anything that could be substituted, so the console plays the
   module's own tracks rather than a generic library. */
const AUDIO = [
  { pl: "heHyhtPMGRCqJ2HL", s: "9VjwgeXsiou9mZ5A", name: "Deeds Done In Darkness", list: "Floor 1 Exploration", kind: "bed" },
  { pl: "ixYF8x5F4rA6adgo", s: "V2FUEfrTq9fvKoks", name: "Drones In The Deep", list: "Floor 2 Exploration", kind: "bed" },
  { pl: "k0fOCWD3DBgSoHoZ", s: "u4mNGCTn8cPE8X9k", name: "Crypt Drone Loop", list: "Exploration Loops", kind: "bed" },
  { pl: "k0fOCWD3DBgSoHoZ", s: "0N9AZX11G0RYUoZn", name: "The Occasional Rat", list: "Exploration Loops", kind: "bed" },
  { pl: "k0fOCWD3DBgSoHoZ", s: "Vl3tC8KlZmkUvR12", name: "The Occasional Drip", list: "Exploration Loops", kind: "bed" },
  { pl: "vb7AB47i1FnbnC6M", s: "NA4DUa5JCH6VcnT1", name: "Otari Fishery", list: "Otari Fishery", kind: "bed" },
  { pl: "nGTMCWOpjxgn3t3Q", s: "lZH9AhDY6fnhXyvN", name: "Otari Seaside", list: "Otari Wharf", kind: "bed" },
  { pl: "2oJDF1thojiM9tWg", s: "H7FMzZQcKgZ9XMNQ", name: "Watery Grave", list: "Soggy Crossroads", kind: "bed" },
  { pl: "0qdreI9KgZ0kYMki", s: "GNLKIThBSqgQ4tiQ", name: "The Mermaid Fountain Loop", list: "Mermaid Fountain", kind: "bed" },
  { pl: "0qdreI9KgZ0kYMki", s: "BIt6uRTjcmXfS2Ao", name: "The Mermaid Fountain Basin Loop", list: "Mermaid Fountain", kind: "bed" },
  { pl: "J9UqsCkkPfzAA9Z1", s: "upp10gFshBm3o4ts", name: "The Malevolent Dead", list: "Soundboard", kind: "cue" },
  { pl: "J9UqsCkkPfzAA9Z1", s: "jMVdTW8tkIMG5B13", name: "Everything Is Fire", list: "Soundboard", kind: "cue" },
  { pl: "J9UqsCkkPfzAA9Z1", s: "GgsDSD88cVftbskJ", name: "Irritated Xulgath Noises", list: "Soundboard", kind: "cue" },
  { pl: "J9UqsCkkPfzAA9Z1", s: "opUA06LhpkTvpRxh", name: "Zolgran Plotting", list: "Soundboard", kind: "cue" },
  { pl: "J9UqsCkkPfzAA9Z1", s: "acWIaATXvrV6TCYy", name: "Muffled Chattering", list: "Soundboard", kind: "cue" },
  { pl: "QN6rFt1K6zlkbI9I", s: "BCLNoSQ51JmvXtWK", name: "Disassembling Barricade", list: "Barricades", kind: "cue" },
  { pl: "QN6rFt1K6zlkbI9I", s: "50s0sXyj8TlX8kWq", name: "Shattering Barricade", list: "Barricades", kind: "cue" },
  { pl: "QN6rFt1K6zlkbI9I", s: "CI5aakOLeJDMGC6O", name: "Breaking The Stone Wall", list: "Barricades", kind: "cue" },
  { pl: "PtzmQZ2WjuUK8XUF", s: "cZS3HUei09Gxk0dv", name: "The Rat's On Fire", list: "Cinder Rat", kind: "cue" },
  { pl: "VS8FZvbRBnqt7Wid", s: "Fypler5gP0OSsaNq", name: "Wyrmling Growl Distant 01", list: "Dragon", kind: "cue" },
  { pl: "VS8FZvbRBnqt7Wid", s: "drrfdsrUloVdYc8z", name: "Wyrmling Growl 1", list: "Dragon", kind: "cue" },
  { pl: "VS8FZvbRBnqt7Wid", s: "PzgI66NU5R06KRZE", name: "Wyrmling Breath Weapon 01", list: "Dragon", kind: "cue" }
];
const audioBy = (name) => AUDIO.find(a => a.name === name);

/* ------------------------------------------------------------------- FX
   Optional animation through Sequencer and JB2A. Sound comes from the
   module's own playlists above rather than a generic library, so a cue with
   no JB2A installed still makes the right noise. Every key below was checked
   against the installed JB2A database. */
const FX = {
  crypt: { label: "The dead rise", where: "Area 5, the coffins open",
    files: ["jb2a.smoke.puff.centered.dark_black", "jb2a.smoke.puff.centered.grey"],
    sound: "The Malevolent Dead", scale: 1.3, target: "selected" },
  web: { label: "Web Strike", where: "Area 3, the spider immobilises a hero",
    files: ["jb2a.entangle.green", "jb2a.entangle.brown"], scale: 1.0, target: "selected" },
  ceiling: { label: "The ceiling falls", where: "Area 8, the trap triggers",
    files: ["jb2a.impact.010.orange", "jb2a.impact.010.blue"], scale: 1.2, target: "selected" },
  fountain: { label: "Pressurised water", where: "Area 16, the fountain's routine",
    files: ["jb2a.breath_weapons.poison.cone.blue"], scale: 1.0, target: "selected" },
  cinder: { label: "The rat ignites", where: "Area 14, the fire orb shatters",
    files: ["jb2a.flames.01.orange", "jb2a.fire_ring.500px.red"],
    sound: "The Rat's On Fire", scale: 1.1, target: "selected" },
  barrage: { label: "Force barrage", where: "Area 18, Zolgran's opening turn",
    files: ["jb2a.magic_missile.blue.30ft"], scale: 1.0, target: "selected" },
  breath: { label: "Poison breath", where: "Area 19, the dragon's 30-foot cone",
    files: ["jb2a.breath_weapons.poison.cone.green"],
    sound: "Wyrmling Breath Weapon 01", scale: 1.0, target: "selected" },
  levelup: { label: "2nd level", where: "The moment the ledger passes 1,000 XP",
    files: ["jb2a.healing_generic.200px.yellow", "jb2a.healing_generic.200px.green"],
    scale: 1.4, screen: true }
};

/* ------------------------------------------------------------------- tabs */
const TABS = [
  { key: "start", label: "Getting started", sub: "before area 1", tone: "gold", icon: "fa-scroll" },
  { key: "f1", label: "Floor 1", sub: "areas 1 – 11", tone: "moss", icon: "fa-stairs" },
  { key: "f2", label: "Floor 2", sub: "areas 12 – 19", tone: "rust", icon: "fa-dungeon" },
  { key: "table", label: "At the table", sub: "audio · scenes · DCs", tone: "slate", icon: "fa-music" }
];

const LEVEL_AT = 1000;

/* ---------------------------------------------------------------- opening */
const OPENING = {
  pitch: "Menace Under Otari teaches a new GM and new players how to play Pathfinder, one concept at a time. Four 1st-level heroes; two or three works with slight adjustments.",
  boxed: "The small seaside town of Otari is known for its fresh fish and skilled sailors, but above all, it's a big logging town, providing valuable wood to the nearby metropolis of Absalom. But for you, Otari is home. You grew up playing on the docks, getting lost in the nearby woods, and hearing the fantastical stories of travelers from faraway lands, tales of terrifying dragons and virtuous knights. Such adventure always seemed so distant — until today.\n\nWord has begun to spread around Otari that there's a problem down at the Otari Fishery. Some are saying that some sort of beast is lurking in the basement, feeding on the stores of salted fish. Folks are worried that whatever is eating the fish might get hungry enough to eat the fishers next!\n\nYou've received a letter from Tamily Tanderveil, the owner of the Fishery. Inside is a desperate plea for help. With the town guard busy protecting the loggers, she needs a few brave souls to venture down into the basement of her warehouse and put an end to the beast that's feasting on her fish! Do you have the courage to face the menace under Otari?",
  steps: [
    ["Pick heroes", "Each player takes one of the four pregenerated heroes, or builds their own. Give them 10–15 minutes with the sheet."],
    ["Read the introductions", "Name, ancestry, background, class — and what the hero looks like."],
    ["Place the tokens", "On the stairs into the basement, next to Area 1. Higher Hit Points and Armour Class in front."],
    ["Read the scene", "Then activate the Landing scene and open Area 1."]
  ],
  gmNote: "The job is worth 10 gp each from Tamily Tanderveil, who owns the fishery. She thinks it is a simple rat problem. It is not.",
  truth: "A kobold band under the town stole a dragon's egg and hatched it. The hatchling is always hungry, so they have been raiding the fishery to feed it. Boss Zolgran means to raise the dragon and take Otari with it."
};

const HEROES = [
  { name: "Valeros", cls: "Fighter", id: "vcwqnXHkhzFhrt7O", tone: "rust", note: "Most Hit Points and the best Armour Class — put him at the front of the marching order." },
  { name: "Kyra", cls: "Cleric", id: "yoAU5rWYH4KJGPr5", tone: "gold", note: "Heals, and the party's answer to the undead in Area 5." },
  { name: "Merisiel", cls: "Rogue", id: "czQ0MaZBu3BqMpce", tone: "moss", note: "Thievery for the locks and traps, and sneak attack when the party flanks." },
  { name: "Ezren", cls: "Wizard", id: "WNX5OQKPh4uaV7mW", tone: "slate", note: "The one who can read the scroll of force barrage out of Abadar's vault." }
];

/* ------------------------------------------------------------------ areas
   Nineteen areas across two floors. `xp` is the award the book prints for
   that area; `extra` are the conditional ones. `sets` and `reads` are the
   choices that reach forward into a later room. */
const AREAS = [
  { n: 1, key: "a1", floor: 1, page: "UEuiUcrrPdr9eFqN", name: "Hungry Rats", tone: "rust",
    lead: "The first encounter, in the fishery basement. The rats are already on the map but hidden — reveal them when they attack.",
    boxed: "The stairs leading into the basement of the Otari Fishery creak with age as you make your way downstairs to find the beast that has been eating all the fish. In the center of the room, between stone pillars holding up the fishery overhead, are barrels filled with salted fish. Two of these barrels have been smashed open, spilling their contents on the floor. In the east wall is a large hole, opening into darkness.",
    beats: [
      ["Before the fight", "Go around the table and ask each player the first thing their hero does. Let them move, but not leave the room."],
      ["Then", "A skittering from the hole — one giant rat per player rushes out. Roll initiative."],
      ["Teaches", "Initiative, Strike, targeting, critical hits, and applying damage."],
      ["After", "Tamily is relieved, but sure that rats could not have done all that damage. The heroes have to go deeper to earn the reward."]
    ],
    creatures: [{ name: "Giant Rat", id: "iIJPJcDT8wlJ8z5M", n: "one per player" }],
    xp: 80, xpLabel: "Giant rats defeated" },

  { n: 2, key: "a2", floor: 1, page: "VLztUZ1H5YEYPcx9", name: "Drop into Darkness", tone: "slate",
    lead: "A 10-foot cliff, slick with moisture. The adventure's first skill check.",
    boxed: "Squeezing through the hole, you find yourself in a cavern that seems to stretch endlessly beneath the streets of Otari. Who knows what menace could be lurking down here? Up ahead, the passageway ends in a cliff that plunges sharply into the darkness.",
    checks: [
      "DC 15 Athletics to Climb down safely.",
      "DC 10 Athletics with a rope tied to a stalagmite — and then only a natural 1 critically fails."
    ],
    beats: [
      ["Helping", "A hero can attempt their own Athletics check to assist: success gives the climber +1 circumstance, a critical success +2. The helper still has to climb themselves."],
      ["Failing", "Success climbs 5 feet and needs another check. Failure makes no progress. Critical failure falls — 5 damage from the top, 2 from halfway, none on a first check climbing up."],
      ["Teaches", "Skill checks and the four degrees of success."],
      ["From here on", "The dungeon is dark unless a description says otherwise, and the party explores at its own pace. Anything they leave alive heals up; anything they killed stays dead."]
    ],
    xp: 10, xpLabel: "Everyone down the cliff" },

  { n: 3, key: "a3", floor: 1, page: "8Fr6KCxqXp322B5r", name: "The Spider's Web", tone: "moss",
    lead: "A giant spider waiting in a webbed cavern. The webs are difficult terrain, not glue.",
    boxed: "The tunnel continues deeper underground, eventually opening into a large chamber. Patches of glowing blue fungus cling to the ceiling and provide dim light. You can just barely make out vast strands of webbing across the floor and walls of this cavern, stretching between stalactites like shimmering curtains.",
    checks: [
      "DC 15 Acrobatics to cross without touching a web. A failure brings the spider out.",
      "DC 15 Perception to find the bundle in the lair afterwards.",
      "DC 17 to Escape the web Strike, using Acrobatics, Athletics, or a fist attack."
    ],
    beats: [
      ["The bite", "Poison: a DC 16 Fortitude save, or the poison takes hold. Details on the stat block."],
      ["Web Strike", "A ranged Strike that deals no damage and immobilises instead. Escape is a single action against DC 17."],
      ["Teaches", "Saving throws, ranged Strikes, difficult terrain, and conditions."],
      ["Avoidable", "The heroes can slip past or flee. They still earn the XP the first time they get past it — and only the first time."]
    ],
    creatures: [{ name: "Giant Spider", id: "A4VgQIHsqJKssQOM" }],
    fx: "web",
    loot: { name: "Spider's Lair", id: "PziNyZC7L7e9SsGr",
      note: "A wrapped bundle of bones — a kobold, the first hint. Inside: a healing potion and a shortsword with an emerald pommel, worth 5 gp." },
    xp: 40, xpLabel: "Spider beaten or bypassed" },

  { n: 4, key: "a4", floor: 1, page: "Ccp3c9A1WH9tOCVO", name: "The Barricade", tone: "ember",
    lead: "A crude barricade over a side tunnel, and the adventure's first choice that reaches forward.",
    boxed: "After the web-infested cave, the passageway leading deeper underneath the streets of Otari appears to be mostly natural, but someone, or something, has worked to open the cavern and level out the floor, making the passage easily traveled. A crude barricade made from old wooden planks and part of a barrel blocks the entrance to a side tunnel, while the main passage continues off into the gloom.",
    checks: [
      "DC 15 Perception to hear a faint clattering beyond the barricade.",
      "DC 15 Crafting or DC 15 Thievery to take it apart quietly."
    ],
    beats: [
      ["Either way it comes down", "The check decides whether the undead in Area 5 hear it, not whether the barricade opens. Smashing it with weapons always alerts them."]
    ],
    macro: "barricade4",
    sets: { key: "barricade", options: [
      { v: "quiet", label: "Quietly", note: "The undead in Area 5 are still in their coffins and lose their first action standing up.", tone: "moss" },
      { v: "loud", label: "Noisily", note: "The skeletons and the zombie are already up and ready when the heroes walk in.", tone: "rust" }
    ] },
    audio: ["Disassembling Barricade", "Shattering Barricade"],
    xp: 10, xpLabel: "Barricade taken apart quietly", xpIf: (s) => s.flags.barricade === "quiet" },

  { n: 5, key: "a5", floor: 1, page: "mJ3pVc1aJi98duaA", name: "Forgotten Crypt", tone: "plum",
    lead: "An ancient burial vault. The hardest fight on this floor.",
    boxed: "Beyond the barricade, an old cavern corridor winds down into the earth, ending in an ancient burial vault lit by a strange glowing crystal emitting a blue flame. Alcoves line the walls, each one containing a rotten wooden coffin, while the center of the room has a raised platform holding a stone sarcophagus.",
    beats: [
      ["Teaches", "Resistance, weakness, and immunity — skeletons resist some damage, zombies are vulnerable to it, and neither can be affected by anything mental or poisonous."],
      ["Slow", "The zombie is permanently slowed: two actions a turn, no reactions."]
    ],
    creatures: [
      { name: "Skeleton Guard", id: "trchDxbDR2TiPMxT", n: 4 },
      { name: "Zombie Shambler", id: "Xo4IGzw28hivgMmM" }
    ],
    reads: { key: "barricade", quiet: "The undead are still in their coffins — each spends its first action standing.", loud: "They are already out and ready to fight." },
    fx: "crypt",
    audio: ["The Malevolent Dead"],
    loot: { name: "Forgotten Crypt", id: "sRzrLrMdVXKZjkFA",
      note: "An everlight crystal, and a polished shield carved as a roaring lion — usable, or 5 gp. If they take the crystal, turn the room's light off." },
    xp: 100, xpLabel: "Undead destroyed" },

  { n: 6, key: "a6", floor: 1, page: "u4m7Ttls4lBA9e96", name: "Forgotten Shrine", tone: "slate",
    lead: "A shrine to Gozreh on a ledge 10 feet up. No fight, and no XP — a pure reward room with a risk attached.",
    boxed: "The ancient wooden door creaks open on rusty hinges, revealing a ruined chamber. Mold and rot stain every surface. On the far side of the room is stone statue of a giant squid, its tentacles reaching toward an altar in the center of the chamber. The scum covers almost everything, but it hasn't touched the silver bowl sitting atop the stone altar. The water in the bowl is perfectly clear.",
    checks: [
      "DC 10 Athletics to climb up to the ledge.",
      "DC 15 Religion to recognise Gozreh, god of nature and the fury of the ocean.",
      "DC 20 Fortitude after drinking from the bowl."
    ],
    beats: [
      ["Drinking", "Heals 1d8 Hit Points either way, then the save. Once per hero per day; a second drink does nothing."],
      ["On a success", "For an hour they can spend a reaction, when hit by a critical hit, to make it an ordinary hit."],
      ["On a failure", "Sick for an hour: −1 status penalty to every d20 roll, to Armour Class, and to spell DCs."],
      ["The bowl", "Worth 5 gp if sold, but it loses all its magic the moment it leaves the shrine."]
    ],
    creatures: [{ name: "Forgotten Shrine", id: "3eDE2HOoewFgbSdn", note: "the shrine's own actor" }],
    xp: 0 },

  { n: 7, key: "a7", floor: 1, page: "UCEZLyerntYnmzgX", name: "Abandoned Storeroom", tone: "ember",
    lead: "Four kobolds trying to lever open a locked cell. They don't notice the heroes until someone comes within 10 feet.",
    boxed: "This large room looks like it was once a storeroom for a building above. At the far side, you can make out what might have been a cage or cell at some point, but it is now full of crates and barrels. Four lizardlike creatures the size of human children are clustered around the door to the cell, trying to pry it open.",
    checks: [
      "DC 15 Thievery to pick the cell lock with a thieves' toolkit.",
      "DC 25 Athletics to force the cell door instead."
    ],
    beats: [
      ["Teaches", "Flanking. Two kobolds on opposite sides of a hero make that hero off-guard — −2 circumstance to Armour Class — and their sneak attack adds damage on top."],
      ["Breaking the flank", "Move away, or drop one of the two."],
      ["The fish", "Some kobolds carry dried fish from the fishery. Far more is missing than four kobolds could eat."]
    ],
    creatures: [{ name: "Kobold Warrior", id: "BIZfjoz8DZt75EDn", n: 4 }],
    loot: { name: "Abandoned Storeroom", id: "yFRBdjHLEsCU66sI",
      note: "In the cell: 200 sp, a gold ring worth 5 gp, and a +1 shortsword — the party's first magic weapon." },
    xp: 80, xpLabel: "Kobolds defeated" },

  { n: 8, key: "a8", floor: 1, page: "rajhJ9Y006IkwuZa", name: "Trapped Hallway", tone: "rust",
    lead: "A simple trap — stone blocks from the ceiling on whoever steps wrong.",
    boxed: "This short hallway has smooth walls of worked stone with a door at either end, though the door at the far end is closed. The floor is tiled with large, square stone tiles.",
    checks: [
      "DC 20 Perception to notice the loose tile by the north door.",
      "DC 18 Thievery to Disable a Device once they know it is there."
    ],
    beats: [
      ["Teaches", "Hazards: noticing, disabling, and what a critical failure costs."],
      ["Trigger", "The trap makes one ranged Strike against every hero in the hallway, then it is spent. Critical hits still double."],
      ["Keep trying", "A failed Thievery check can be repeated. A critical failure sets it off."]
    ],
    creatures: [{ name: "Falling Ceiling", id: "Z9ggO7spfHwr8up1", note: "hazard" }],
    fx: "ceiling",
    xp: 8, xpLabel: "Trap disabled or endured" },

  { n: 9, key: "a9", floor: 1, page: "bpVEaN8PUCgbuJvk", name: "Gold Puzzle", tone: "gold",
    lead: "Nine gold coins, one counterfeit, and a statue of Abadar that raises the heavier hand. Two weighings.",
    boxed: "The door to this chamber silently glides open to reveal a long room. Two stone statues of priests stand in the corners along one side of the room, facing a towering statue of a man holding out both of his hands, palms up. In front of this statue is a stone altar holding nine golden coins. A voice booms out from the statue. \"In my hands I judge the value of all wealth, raising up whichever is greater. One of these coins is a deception. Find it using only two judgments and receive my blessing.\"",
    checks: ["DC 10 Religion to recognise Abadar, god of wealth and civilisation."],
    beats: [
      ["The solution", "Split the nine into three groups of three. Weigh two groups: if one hand rises, the fake is in the other; if neither, it is in the group on the altar. Repeat with that group, one coin per hand."],
      ["Running it", "Secretly pick a number 1–9 as the fake, and pick a new one whenever the puzzle resets. The players may guess right by luck — that is fine."],
      ["Resets", "A wrong answer, or taking coins off the altar, resets it. Real coins fed to the statue vanish into Abadar's vault in Area 10."],
      ["Failing is survivable", "It only means no vault, and no chance to turn the traps in Area 11 against the kobolds."]
    ],
    sets: { key: "puzzle", options: [
      { v: "solved", label: "Solved", note: "The real coins fall free — 1 gp each — the fake turns to lead, and the stone door into Area 10 swings open.", tone: "moss" },
      { v: "unsolved", label: "Not solved", note: "Area 10 stays sealed. There is no other way in.", tone: "muted" }
    ] },
    /* The companion macro in this collection. Named rather than kept by id,
       because it lives in the GM's own directory rather than the module. */
    companion: { name: "Abadar's Coin Puzzle", label: "Open the coin puzzle" },
    xp: 80, xpLabel: "Puzzle solved", xpIf: (s) => s.flags.puzzle === "solved" },

  { n: 10, key: "a10", floor: 1, page: "gz9x5HmzjSvvBLQp", name: "Abadar's Vault", tone: "gold",
    lead: "Only reachable by solving Area 9. The stone door cannot be broken or forced.",
    boxed: "This small chamber contains an old wooden chest emblazoned with the symbol of a key. Behind the chest is a massive contraption of gears and pulleys that looks like the inner workings of some unseen device.",
    checks: ["DC 15 Crafting to work out that the lever behind the chest controls a trap in Area 11."],
    beats: [
      ["Peepholes", "Tiny holes in the north wall look into Area 11: a kobold on watch, and fragments of talk about \"the boss's new pet\" and plans for \"the town above\"."],
      ["The lever", "It sits at disarmed. Setting it to active arms the central spears in Area 11 — and the kobolds are the ones who walk into it."]
    ],
    reads: { key: "puzzle", unsolved: "The heroes never opened this room. Skip it — and the spears in Area 11 stay dead." },
    sets: { key: "lever", options: [
      { v: "armed", label: "Lever set to active", note: "The central spears fire in Area 11 — most likely on the kobolds moving to block the stairs.", tone: "rust" },
      { v: "off", label: "Left disarmed", note: "The central spears have no effect at all.", tone: "muted" }
    ] },
    loot: { name: "Abadar's Vault", id: "8PgsPDw5TjD2dUTr",
      note: "214 cp, 22 sp, 3 gp plus anything the puzzle swallowed, an emerald worth 20 gp, and a scroll of force barrage — Ezren can read it." },
    xp: 30, xpLabel: "Lever found and set to active", xpIf: (s) => s.flags.lever === "armed" },

  { n: 11, key: "a11", floor: 1, page: "KWTky7M63NvVIVRz", name: "Kobolds and Traps", tone: "rust",
    lead: "An old audience hall, three kobolds, and two kinds of trap. The last room on this floor.",
    boxed: "The door opens with a creak, revealing a massive chamber that looks like an audience hall. On the far side, a broad set of stairs leads up to where a throne might once have been. Pillars support the high ceiling, and the ruined tatters of once decorative banners still hang from them. A decorative tile pattern centered in the middle of the room shows through the grim coating the floor.",
    beats: [
      ["Tactics", "The kobolds hear the door. The two warriors move to block the spiral stairs on their first turn — through the spear trap, if it is armed. The trapmaster spends her whole first turn setting her last spike trap, then throws spears."],
      ["Traps", "Perception to notice when a hero first moves next to one; 2 actions and Thievery to disable, at the DCs on the hazard sheets. The spears reset after a minute; the snares are one-use."],
      ["The necklace", "The trapmaster wears a copper chain with a piece of eggshell — ivory, green-veined, from an egg at least two feet across. Nobody in town can identify it."],
      ["Rest here", "The right moment to go back up to Otari, sell, resupply, and hear Tamily's worry that something far hungrier is down there. She will hand over two potions of healing if the party is struggling."]
    ],
    creatures: [
      { name: "Kobold Trapmaster", id: "4Axci50gPQArPg7d" },
      { name: "Kobold Warrior", id: "BIZfjoz8DZt75EDn", n: 2 },
      { name: "Central Spears", id: "j8qD2LVDSP2lhLUO", note: "hazard" },
      { name: "Spike Trap", id: "X1ZVzivrcAqbNDq2", note: "marks the snares" }
    ],
    reads: { key: "lever", armed: "The central spears are live. The kobolds trip them moving to block the stairs.", off: "The central spears never fire." },
    xp: 136, xpLabel: "Kobolds and hazards overcome" },

  { n: 12, key: "a12", floor: 2, page: "2KRdW68qNXeJ6JpN", name: "Kobold Lookouts", tone: "ember",
    lead: "The bottom of the spiral stairs, prepared against intruders. Two kobold scouts start hidden.",
    boxed: "The stairs spiral down deep into the earth before ending in a chamber that looks like it's been prepared specifically to defend against intruders. On one side of the room, a table has been turned on its side to provide cover, while on the other, crates and barrels have been piled up to create a second barrier.",
    checks: [
      "DC 10 Perception at the back barricade — a stench of rotten fish and sweat.",
      "DC 20 Perception there also catches dripping water in the distance."
    ],
    beats: [
      ["Hidden kobolds", "Ask each player for their Perception DC — Perception + 10. Roll the kobolds' Stealth once. If it beats the highest, the room looks empty; that roll is also their initiative."],
      ["Opening shot", "A kobold whose turn starts hidden fires a crossbow: the target is off-guard, so sneak attack applies. Then reveal them."],
      ["Floor 2", "Everything down here is more dangerous. Activate the second floor of the map and put the heroes on the stairs."]
    ],
    creatures: [{ name: "Kobold Scout", id: "PcHQDmPTztw32PhL", n: 2 }],
    macro: "barricade12",
    audio: ["Watery Grave", "Drones In The Deep"],
    note: "The barricade at the back works like Area 4's, but nothing can hear the heroes this time — they have no way of knowing that.",
    xp: 80, xpLabel: "Lookouts overcome" },

  { n: 13, key: "a13", floor: 2, page: "UlIek5d97G6nHWEm", name: "Soggy Crossroads", tone: "slate",
    lead: "A junction. No encounter, no XP — a choice of which way to go first.",
    boxed: "Beyond the barricade, the passageway meanders briefly. The floor descends slightly and soon becomes flooded by a shallow pool of water. The water appears to be flowing out of a passageway to the right, and a shimmering blue light in that direction reflects off of the water there. The main passageway continues to the left, over the slight depression in the floor where the water has pooled. An overpowering stench drifts from around a bend.",
    beats: [
      ["Right, toward the light", "Area 14 — the shimmer is the elemental orbs, with firelight further off."],
      ["Left, toward the stench", "Area 15 — and a faint growling further up the main passage."]
    ],
    xp: 0 },

  { n: 14, key: "a14", floor: 2, page: "7Ko4GJeI1K3Vy1Xp", name: "Elements of Chaos", tone: "ember",
    lead: "Four elemental orbs, one of which is about to shatter and let a burning rat out.",
    boxed: "On the far side of the puddle of water is a strange chamber, crackling with magical energy. Pulsing orbs float in three of the four corners of this room. The orb in the southwest is made of brown earth and stone, whereas the one in the northeast looks to be made of glass, and is filled with a swirling cloud. The orb in the far corner holds a roaring flame; opposite that orb are shattered remains and the water that flows down the passageway to the northwest.",
    beats: [
      ["Teaches", "Concealment and persistent damage. The rat's smoke makes it concealed — a DC 5 flat check before every attack on it — and its hits set heroes on fire."],
      ["Persistent fire", "1d4 at the end of the burning hero's turn, then a DC 15 flat check to put it out. An action to pat it out earns an immediate check; lying down in the water puts it out automatically."],
      ["It cannot cross water", "Which is why it is stuck in here."],
      ["The other two orbs", "Air: once in 24 hours, one action to fly 40 feet — landing on solid ground or falling. Earth: once in 24 hours, one action for +2 damage on melee Strikes until the start of their next turn. One use each, then the orbs go quiet forever."]
    ],
    creatures: [{ name: "Cinder Rat", id: "xN5J9S485LxFZMkL" }],
    macro: "cinder",
    fx: "cinder",
    audio: ["Everything Is Fire"],
    xp: 80, xpLabel: "Cinder rat defeated" },

  { n: 15, key: "a15", floor: 2, page: "CMjhAWaRWlbFVoF0", name: "Xulgath Cave", tone: "moss",
    lead: "Three xulgaths bickering over a piece of meat, and a smell that makes people sick.",
    boxed: "There is an overpowering stench in this chamber, like rotten fish mixed with oily sweat. The warm, humid air only adds to the foul atmosphere. Unlike the previous chambers, this one appears to be a natural cavern, dotted with limestone stalactites and stalagmites, making it hard to see where the room ends.",
    checks: [
      "DC 19 Fortitude on entering, or be sickened 1 until they spend an action to retch.",
      "DC 20 Athletics to break open the thin wall into Area 17."
    ],
    beats: [
      ["Surprised", "They are sitting, unarmed. Until each spends an action to Stand they are off-guard, and they need another action to draw a club. They fight to the death."],
      ["The other tunnel", "Leads down into the Darklands. Beyond this adventure — after an hour of travel, tell the party to turn back."],
      ["Peeking through", "A hole in the dug tunnel looks into Area 17. Listening picks up \"when we stole the egg\" and \"more fish for the pet\"."]
    ],
    creatures: [{ name: "Xulgath Warrior", id: "5vBG8a8dnJfmVd3Y", n: 3 }],
    macro: "tunnel",
    audio: ["Irritated Xulgath Noises", "Breaking The Stone Wall"],
    sets: { key: "wall", options: [
      { v: "quiet", label: "Wall broken cleanly", note: "The kobolds in Area 17 are relaxed when the heroes arrive — three at the table, three in the alcoves.", tone: "moss" },
      { v: "loud", label: "Failed the check", note: "The wall holds and the kobolds in Area 17 hear it. All six are in the middle of the room, ready.", tone: "rust" }
    ] },
    loot: { name: "Small Bag", id: "AkfRXhJ81gNlWhhR",
      note: "Strange coins from a kingdom deep underground — a tower in a cave on one face, a snake-headed humanoid on the other. 38 sp and 4 gp." },
    xp: 120, xpLabel: "Xulgaths defeated" },

  { n: 16, key: "a16", floor: 2, page: "MSU45JsvJjOJc1dg", name: "Mermaid Fountain", tone: "slate",
    lead: "A complex hazard — it takes turns like a monster.",
    boxed: "While much of this rectangular chamber is in ruins, the center contains a fountain of pristine water with something glittering at the bottom. In the middle of the pool is a marble statue of a mermaid, her lips pursed as if she were about to blow a kiss, or maybe whistle. Each corner of the pool has some sort of mechanism embedded in the stones, but the one in the southwest corner appears to be smashed.",
    checks: [
      "DC 20 Perception on entry — note the totals, they are also the initiative order.",
      "DC 20 Thievery, 2 actions, from an adjacent square to disable one corner mechanism."
    ],
    beats: [
      ["Teaches", "Complex hazards. It rolls Stealth for initiative and has a Routine that fires water at different parts of the room each round."],
      ["Three mechanisms", "The southwest one is already broken. Disable or smash the other three and the trap stops. They can be attacked using the Armour Class and Hit Points on the sheet — remember Hardness."],
      ["Or just avoid it", "Anyone who spots it can keep everyone out of the squares next to the pool."]
    ],
    creatures: [{ name: "Mermaid Fountain", id: "v51J7K27abdDyLgJ", note: "complex hazard" }],
    fx: "fountain",
    audio: ["The Mermaid Fountain Loop"],
    sets: { key: "fountain", options: [
      { v: "quiet", label: "Disabled or avoided", note: "Nothing carries to Area 17.", tone: "moss" },
      { v: "smashed", label: "Mechanisms destroyed", note: "The noise reaches Area 17 — all six kobolds are up and waiting.", tone: "rust" }
    ] },
    loot: { name: "Mermaid Fountain", id: "xhyzSiXfoAxud376",
      note: "28 cp, 8 sp, 2 gp in a foot of very cold water. The loot sheet's \"distribute coins\" button splits it for you." },
    xp: 80, xpLabel: "Fountain bypassed, disabled, or destroyed" },

  { n: 17, key: "a17", floor: 2, page: "0vJpmu4QJ7RgYLi2", name: "Kobold Warren", tone: "rust",
    lead: "Six kobolds at home. The last one surrenders — and will talk.",
    boxed: "As the door opens, the smell of rotten fish and mold wafts out. On the west side of this vast room is a large table with benches on either side. Old food scraps, dirty knives, and broken plates cover the table. Off to the east side, burrows have been dug into the wall to make small sleeping chambers filled with straw mats. This must be the kobolds' warren!",
    checks: [
      "DC 10 Diplomacy or DC 10 Intimidation to make the survivor talk about the boss.",
      "A total of 20 or more on that check gets the dragon as well.",
      "DC 10 Acrobatics each time an oiled hero Strides, or falls prone instead."
    ],
    beats: [
      ["Bed cover", "One action to pull a sleeping mat up as cover until they move or their next turn starts."],
      ["Food fight", "One action, ranged Strike at +5, no damage — the hero is sickened until they spend an action cleaning up."],
      ["Oil attack", "One action to open the chest, then one to throw a jar. +5 ranged. Hit coats the hero and their square; miss coats just the square."],
      ["Or buy it", "10 gp gets the boss, 20 gp total gets the dragon too."]
    ],
    creatures: [{ name: "Kobold Warrior", id: "BIZfjoz8DZt75EDn", n: 6 }],
    reads: { key: "warned", yes: "The kobolds heard the heroes coming — all six are in the middle of the room, ready to attack.", no: "Three are at the table and three in the sleeping alcoves." },
    quotes: [
      ["About the boss", "Boss Zolgran is the big leader of the mighty kobolds, and she has powerful magics to roast you alive! She's very angry all the time and demands much from her servants. Especially now that we have a powerful new friend!"],
      ["About the dragon", "The friend is a dragon and a blessing from the gods, a sign that kobolds are destined to return to the surface and conquer the pathetic human town. As soon as the hatchling is all grown, we'll rise up to take what is ours!"]
    ],
    audio: ["Muffled Chattering"],
    loot: { name: "Kobold Loot", id: "1S486XWdfcEWYv6T",
      note: "Silk worth 5 gp, a painting worth 2 gp, 20 sp, a crystal decanter worth 1 gp, three jars of oil, a marvelous miniature ladder, and a healing potion." },
    xp: 120, xpLabel: "Warren cleared",
    extra: [
      { key: "boss", xp: 10, label: "The survivor talked about the boss" },
      { key: "dragon", xp: 20, label: "…and about the dragon (30 XP in total)" }
    ] },

  { n: 18, key: "a18", floor: 2, page: "l6OIDtJFH40dtZHU", name: "Dragonkeeper", tone: "plum",
    lead: "Boss Zolgran on her throne, two scouts at the stairs, and a 20-foot pit between.",
    boxed: "A gaping pit opens in the floor in the center of this large, natural chamber. On the far side, a ledge overlooks the entry. Atop this ledge is an ornate stone throne that looks entirely out of place for this room. A regal kobold wearing an oversized crown made of fish bones sits atop the throne. \"Kill the intruders!\" she snarls at the two kobold guards at the foot of the stairs.",
    checks: [
      "DC 15 Athletics and 2 actions to leap the pit — a failure is a 10-damage fall.",
      "DC 10 Athletics twice in a row to climb back out of the pit.",
      "DC 25 Thievery on the iron chest, if they never found the key on Zolgran's belt."
    ],
    beats: [
      ["Level up first", "Through Area 17 the heroes should have the 1,000 XP for 2nd level. Show the players the Leveling Up handout and encourage a rest — the last two fights need it."],
      ["Zolgran's turns", "All three actions on force barrage at the nearest three heroes on turn one. Command on anyone who gets past her guards. Gouging claw when the 1st-rank slots run out. The staff only as a last resort."],
      ["The guards", "The two scouts flank the pit to block the way up, but they chase anyone who slips past."],
      ["If the party retreats", "Zolgran stays put but sends the guards. Kill the guards and retreat anyway and she recruits two kobold warriors before the next attempt."]
    ],
    creatures: [
      { name: "Kobold Boss Zolgran", id: "AleeS0IRqT4tUphB" },
      { name: "Kobold Scout", id: "PcHQDmPTztw32PhL", n: 2 }
    ],
    fx: "barrage",
    audio: ["Zolgran Plotting"],
    loot: { name: "Zolgran's Treasure", id: "p84EOttaNannSP3y",
      note: "A silver bracelet worth 5 gp, a very old map of a strange dungeon, a smoking sword, a wand of heal, two healing potions, and a masquerade scarf. On the chest: the broken eggshell, two feet tall, with claw marks down one side." },
    xp: 100, xpLabel: "Zolgran and her guards defeated",
    extra: [{ key: "hardfight", xp: 40, label: "The party was still 1st level for this fight" }] },

  { n: 19, key: "a19", floor: 2, page: "KMTBj18whqvjGZBz", name: "Mushroom Grotto", tone: "moss",
    lead: "The dragon. The hardest fight in the adventure — offer a rest first.",
    boxed: "Towering yellow mushrooms cover the floor of this vast cave, some reaching over ten feet in height. They seem to emit a pale light, giving the entire chamber an eerie glow. Shattered remnants of barrels — torn open with their contents nowhere to be seen — lay scattered around the base of the mushrooms. Somewhere off on the far side of the chamber, something stirs, and a faint snarl comes from the shadows.",
    boxed2: "A green horned dragon leaps into view, and although the beast isn't much larger than you, large leathery wings and snapping jaws make the hatchling look like an ancient wyrm. The creature gazes at you with cunning eyes and snorts a cloud of yellow vapor. With a fierce roar, the dragon charges forward to attack!",
    checks: [
      "DC 20 Athletics to climb a mushroom for a better look — which is what starts the fight.",
      "DC 15 Athletics to climb the treasure ledge afterwards."
    ],
    beats: [
      ["Poison breath", "Two actions, a 30-foot cone. The juvenile aims at the nearest hero rather than catching the whole party — it does not know better yet. Then it is unavailable for 1d4 rounds, or until it critically hits."],
      ["Draconic Frenzy", "Two actions for two claws and a tail in any order. The multiple attack penalty is −5 and −10, or −4 and −8 where a claw is used."],
      ["Twisting Tail", "A reaction against anyone moving within 10 feet. On a hit they stop and lose the rest of that action."],
      ["Retreat is allowed", "The kobolds trained it to stay in this cave, so the party can back off and recover."],
      ["If they leave it alive", "The dragon eventually leaves and hunts the countryside for years. Dragons grow slowly — the heroes might come back for it."]
    ],
    creatures: [{ name: "Juvenile Horned Dragon", id: "WPsgrCUSFCqgDvJi" }],
    fx: "breath",
    audio: ["Wyrmling Growl Distant 01", "Wyrmling Growl 1", "Wyrmling Breath Weapon 01"],
    loot: { name: "Dragon's Lair", id: "mygajPl08HHktFRV",
      note: "429 cp, 63 sp, 18 gp, and an emerald that looks like the dragon's eye, worth 20 gp." },
    xp: 120, xpLabel: "Dragon defeated" }
];

const ENDING = {
  title: "Wrapping Up",
  text: "With a lot of courage and a bit of luck, the adventurers survived the kobolds and their \"pet\" and come back to town as heroes. Tamily is truly relieved once she learns how dangerous it really was. Over the coming weeks news of the deed travels across Otari, and the offers of work start arriving.",
  next: "The Otari Gazetteer in the module has the town written up for whatever comes next. Troubles in Otari and the Abomination Vaults Adventure Path both continue these characters' stories.",
  early: "The adventure can also end cleanly after Area 18. If the party never opens the dragon's cave, Tamily still pays — she just never finds out what was in that egg."
};

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "start", pcs,
    /* XP is a set of ticked awards rather than a running number, so the ledger
       always says which room paid for which points. */
    xp: {},
    areas: {},   // key -> visited/done
    loot: {},    // key -> claimed
    flags: { barricade: null, puzzle: null, lever: null, wall: null, fountain: null },
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
  return [...seen.values()].slice(0, MAX_PCS);
}
function refreshPCs(pcs) {
  const detected = detectPCs();
  if (!pcs?.length) return detected;
  const kept = pcs.map((pc) => {
    const a = pc.actorId ? game.actors.get(pc.actorId) : null;
    return a ? { name: a.name, actorId: a.id, img: pickArt(a) } : null;
  }).filter(Boolean);
  return kept.length ? kept : detected;
}
function registerSetting() {
  if (!game.settings.settings.has(BB_ID)) {
    game.settings.register(BB_NS, BB_KEY, { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const areaFor = (key) => AREAS.find(a => a.key === key);

/* ----------------------------------------------------------------- engine */
class Otari {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(BB_NS, BB_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  /* ----- the XP ledger -----
     Every award is one ticked box, so the total is always explainable and any
     tick can be taken back. */
  awards() {
    const out = [];
    for (const a of AREAS) {
      if (a.xp) out.push({ key: a.key, xp: a.xp, label: a.xpLabel ?? a.name, area: a, gated: a.xpIf });
      for (const e of a.extra ?? []) out.push({ key: `${a.key}:${e.key}`, xp: e.xp, label: e.label, area: a });
    }
    return out;
  }
  get xpTotal() {
    return this.awards().reduce((n, a) => n + (this.s.xp[a.key] ? a.xp : 0), 0);
  }
  get xpMax() { return this.awards().reduce((n, a) => n + a.xp, 0); }
  get level() { return this.xpTotal >= LEVEL_AT ? 2 : 1; }
  toggleXp(key) {
    if (this.s.xp[key]) delete this.s.xp[key]; else this.s.xp[key] = true;
    const before = this.level;
    this.touch();
    if (this.s.xp[key] && before === 1 && this.level === 2) {
      ui.notifications.info("1,000 XP — the heroes reach 2nd level. Show them the Leveling Up handout.");
      this.fx("levelup");
    }
  }

  toggleArea(key) {
    const on = !!this.s.areas[key];
    this.s.areas[key] = !on;
    this.log(`Area ${areaFor(key).n}: ${on ? "reopened" : "done"}.`);
    this.touch();
  }
  toggleLoot(key) {
    if (this.s.loot[key]) delete this.s.loot[key]; else this.s.loot[key] = true;
    this.touch();
  }
  setFlag(key, value) {
    this.s.flags[key] = this.s.flags[key] === value ? null : value;
    this.touch();
  }
  /* Two different rooms can put the warren on alert, so it is derived rather
     than stored — undoing either one puts the kobolds back to relaxed. */
  get warned() {
    return this.s.flags.wall === "loud" || this.s.flags.fountain === "smashed" ? "yes" : "no";
  }
  flagValue(key) { return key === "warned" ? this.warned : this.s.flags[key]; }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Menace Under Otari reset.");
    this.touch();
  }

  /* ----- the module ----- */
  get imported() { return !!game.journal?.get(JOURNAL); }

  openPage(pageId) {
    const entry = game.journal?.get(JOURNAL);
    if (!entry) return ui.notifications.warn(`Import the ${MODULE.title} module's "Menace Under Otari" adventure to use the journal links.`);
    const page = entry.pages.get(pageId);
    if (!page) return ui.notifications.warn("That page is not in the imported journal.");
    entry.sheet.render(true, { pageId });
  }
  openJournalPage(entryId, pageId) {
    const entry = game.journal?.get(entryId);
    if (!entry) return ui.notifications.warn(`Import the ${MODULE.title} module to use this link.`);
    entry.sheet.render(true, pageId ? { pageId } : {});
  }

  /* Adventure import keeps the module's ids, so a world actor is the first
     place to look; the compendium search is the fallback for a world that
     only installed the module. */
  async openActor(id, name) {
    const actor = game.actors?.get(id);
    if (actor) return actor.sheet.render(true);
    for (const pack of [...(game.packs ?? [])].filter(p => p.documentName === "Actor")) {
      const index = await pack.getIndex();
      const hit = [...index].find(e => e._id === id || e.name?.toLowerCase() === String(name).toLowerCase());
      if (hit) return (await pack.getDocument(hit._id))?.sheet.render(true);
    }
    ui.notifications.warn(`"${name}" isn't in this world. Import the ${MODULE.title} adventure and it will appear.`);
  }

  async runMacro(key) {
    const def = MOD_MACROS[key];
    const macro = game.macros?.get(def.id) ?? game.macros?.getName?.(def.name);
    if (!macro) return ui.notifications.warn(`"${def.name}" isn't in this world — it comes with the ${MODULE.title} adventure.`);
    await macro.execute();
  }

  async runByName(name) {
    const macro = game.macros?.getName?.(name);
    if (!macro) return ui.notifications.warn(`No macro called "${name}" in this world. It's the companion macro in this collection — paste it in as a script macro and give it that name.`);
    await macro.execute();
  }

  async activateScene(id, name) {
    const scene = game.scenes?.get(id);
    if (!scene) return ui.notifications.warn(`The "${name}" scene isn't in this world.`);
    await scene.activate();
  }

  /* ----- audio ----- */
  soundState(cue) {
    const pl = game.playlists?.get(cue.pl);
    const sound = pl?.sounds?.get(cue.s);
    if (!pl || !sound) return { ok: false, playing: false };
    return { ok: true, playing: !!sound.playing };
  }
  async toggleSound(cue) {
    const pl = game.playlists?.get(cue.pl);
    const sound = pl?.sounds?.get(cue.s);
    if (!pl || !sound) return ui.notifications.warn(`"${cue.name}" isn't in this world — it comes with the ${MODULE.title} adventure.`);
    await (sound.playing ? pl.stopSound(sound) : pl.playSound(sound));
    this.render();
  }
  async playByName(name) {
    const cue = audioBy(name);
    if (cue) return this.toggleSound(cue);
  }

  /* ----- effects ----- */
  get fxReady() { return typeof Sequence !== "undefined" && !!globalThis.Sequencer; }
  resolveFx(key) {
    const cue = FX[key];
    if (!cue || !this.fxReady) return null;
    for (const f of cue.files ?? []) {
      if (Sequencer.Database?.entryExists?.(f)) return f;
    }
    return null;
  }
  fxStatus(key) {
    const cue = FX[key];
    if (!cue) return { state: "off" };
    if (!this.fxReady) return { state: "off" };
    const file = this.resolveFx(key);
    if (!file && !cue.sound) return { state: "missing" };
    return { state: "ok", detail: file ?? "sound only", sound: cue.sound };
  }
  async fx(key) {
    const cue = FX[key];
    if (!cue) return;
    if (cue.sound) this.playByName(cue.sound);
    const file = this.resolveFx(key);
    if (!file) return;
    try {
      const seq = new Sequence();
      const target = canvas?.tokens?.controlled?.[0];
      const e = seq.effect().file(file).scale(cue.scale ?? 1);
      if (cue.screen || !target) e.screenSpace().screenSpaceAnchor({ x: 0.5, y: 0.5 });
      else e.atLocation(target);
      await seq.play();
    } catch (err) {
      console.error("Menace Under Otari — effect failed", err);
    }
  }

  /* ----- chat ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "gold") {
    const C = { ember: "#e0a349", moss: "#69b87f", slate: "#6c9fc0", plum: "#a582cc",
                gold: "#e2c169", rust: "#d05a3c", muted: "#a2947f" };
    await ChatMessage.create({
      content: `<div style="background:#1b1815;color:#eae2d4;border:1px solid #3a332a;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.gold};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#a2947f">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "Menace Under Otari" }
    });
  }
  postBoxed(key, which = "boxed") {
    if (key === "opening") return this.postCard("Setting the Scene", "Menace Under Otari",
      OPENING.boxed.split("\n\n").map(p => `<p style="margin:0 0 6px;font-style:italic">${p}</p>`).join(""), "gold");
    const a = areaFor(key);
    const text = which === "boxed2" ? a?.boxed2 : a?.boxed;
    if (!text) return ui.notifications.warn("Nothing to read aloud there.");
    return this.postCard(`Area ${a.n}`, a.name, `<p style="margin:0;font-style:italic">${text}</p>`, a.tone);
  }
  postChecks(key) {
    const a = areaFor(key);
    if (!a?.checks?.length) return ui.notifications.warn("No checks in that area.");
    return this.postCard(`Area ${a.n} · checks`, a.name,
      `<ul style="margin:0;padding-left:1.1em">${a.checks.map(c => `<li style="margin-bottom:4px">${linkify(c)}</li>`).join("")}</ul>`,
      a.tone);
  }
  postXp() {
    const t = this.xpTotal;
    return this.postCard("Menace Under Otari", `${t} XP each`,
      `<p style="margin:0 0 6px"><b>Level ${this.level}</b>${this.level === 1 ? ` — ${LEVEL_AT - t} to go` : " — 2nd level"}</p>
       <p style="margin:0">${AREAS.filter(a => this.s.areas[a.key]).length} of ${AREAS.length} areas behind them.</p>`,
      this.level === 2 ? "moss" : "gold");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class BBApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "bb-console", tag: "div", classes: ["bb-console"],
    position: { width: 940, height: "auto" },
    window: { title: "Menace Under Otari", icon: "fa-solid fa-dungeon", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "bb-console", classes: ["bb-console"], title: "Menace Under Otari",
      width: 940, height: "auto", resizable: true
    });
  }
  get title() { return "Menace Under Otari"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="bb-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  markup() {
    const t = this.t, s = t.s, ro = !t.editable;
    return `${this.styles()}
      <div class="bb">
        ${this.header(ro)}
        <nav class="tabs">
          ${TABS.map(x => `<button type="button" class="tab ${s.tab === x.key ? "on" : ""}" style="--tt:var(--${x.tone})" data-act="tab" data-k="${x.key}">
            <b><i class="fa-solid ${x.icon}"></i> ${x.label}</b><small>${x.sub}</small></button>`).join("")}
        </nav>
        ${!t.imported ? `<p class="warn"><i class="fa-solid fa-triangle-exclamation"></i>
          The ${MODULE.title} adventure isn't imported into this world, so the journal, actor, playlist, and scene buttons have nothing to open. Everything else works.</p>` : ""}
        ${s.tab === "start" ? this.startTab(ro) : ""}
        ${s.tab === "f1" ? this.floorTab(1, ro) : ""}
        ${s.tab === "f2" ? this.floorTab(2, ro) : ""}
        ${s.tab === "table" ? this.tableTab(ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t, xp = t.xpTotal, pct = Math.min(100, (xp / LEVEL_AT) * 100);
    const done = AREAS.filter(a => t.s.areas[a.key]).length;
    return `
      <header class="topbar">
        <div class="score">
          <span>XP each</span><b class="${t.level === 2 ? "hit" : ""}">${xp}<i>/${LEVEL_AT}</i></b>
        </div>
        <div class="track">
          <div class="bar"><span style="width:${pct}%"></span></div>
          <small>${t.level === 2 ? "2nd level — show them the Leveling Up handout" : `${LEVEL_AT - xp} XP to 2nd level`}</small>
        </div>
        <div class="lamps">
          <span class="lamp ${done ? "lit" : ""}" title="Areas marked done"><i class="fa-solid fa-map-location-dot"></i>${done}/${AREAS.length}</span>
          <span class="lamp ${t.level === 2 ? "lit" : ""}" title="Character level"><i class="fa-solid fa-star"></i>Level ${t.level}</span>
          <span class="lamp ${t.fxReady ? "lit" : ""}" title="${t.fxReady ? "Sequencer detected — the optional animation cues will fire" : "Sequencer not detected. Every cue still plays the module's own sound."}"><i class="fa-solid fa-wand-sparkles"></i>FX</span>
        </div>
        <button type="button" class="say" data-act="postxp" title="Post the party's XP to chat"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset the adventure" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  /* ------------------------------------------------------------ start tab */
  startTab(ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>Setting the Scene
          <button type="button" class="say" data-act="postboxed" data-k="opening" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="text">${OPENING.pitch}</p>
        ${OPENING.boxed.split("\n\n").map(p => `<p class="boxed">${p}</p>`).join("")}
        <p class="note"><b>The job:</b> ${OPENING.gmNote}</p>
        <p class="note"><b>What's really going on — for you, not them:</b> ${OPENING.truth}</p>
      </section>

      <section class="panel" style="--tone:var(--moss)">
        <h3>Before you start</h3>
        ${OPENING.steps.map(([k, v]) => `<p class="branch"><b>${k}</b>${v}</p>`).join("")}
        <div class="btnrow">
          <button type="button" class="ghost" data-act="journal" data-e="${HERO_JOURNAL}">Creating Your Hero</button>
          <button type="button" class="ghost" data-act="journal" data-e="${GM_JOURNAL}">Gamemastering</button>
          <button type="button" class="ghost" data-act="macro" data-k="encounters">Quick Reference: Encounters</button>
          <button type="button" class="ghost" data-act="macro" data-k="dcs">Quick Reference: DCs</button>
        </div>
      </section>

      <section class="panel" style="--tone:var(--slate)">
        <h3>The pregenerated heroes <small>four 1st-level characters</small></h3>
        ${HEROES.map(h => `
          <p class="branch" style="--tone:var(--${h.tone})">
            <b><button type="button" class="cn" data-act="actor" data-k="${h.id}" data-n="${esc(h.name)}">${h.name}</button>, ${h.cls}</b>${h.note}</p>`).join("")}
        <p class="note">Two or three players works with slight adjustments. If your table is running their own characters instead, the console reads whoever is in the party.</p>
      </section>

      ${this.xpPanel(ro)}`;
  }

  xpPanel(ro) {
    const t = this.t;
    const rows = t.awards();
    return `
      <section class="panel" style="--tone:var(--ember)">
        <h3>XP ledger <small>${t.xpTotal} of a possible ${t.xpMax}</small></h3>
        <p class="text">Every hero gets the same award, so this tracks one number. Tick a room as the party earns it — nothing is counted twice, and un-ticking takes it straight back off.</p>
        <div class="ledger">
          ${rows.map(r => {
            const on = !!t.s.xp[r.key];
            const blocked = r.gated && !r.gated(t.s);
            return `<label class="xprow ${on ? "on" : ""} ${blocked && !on ? "gated" : ""}">
              <input type="checkbox" data-act="xp" data-k="${r.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}>
              <span class="eid sm">${r.area.n}</span>
              <span class="lbl">${r.label}</span>
              <b>${r.xp}</b>
            </label>`;
          }).join("")}
        </div>
        <p class="hint">Greyed rows are conditional — the book only pays them if the choice on that area's card went the right way.</p>
        ${t.level === 2 ? `<p class="bonus">2nd level. Open the Leveling Up handout and click Show Players.
          <button type="button" class="ghost sm" data-act="journal" data-e="${HERO_JOURNAL}" data-p="${LEVEL_PAGE}">Leveling Up</button></p>` : ""}
      </section>`;
  }

  /* ----------------------------------------------------------- floor tabs */
  floorTab(floor, ro) {
    const areas = AREAS.filter(a => a.floor === floor);
    const head = floor === 2 ? `
      <section class="panel" style="--tone:var(--rust)">
        <h3>Floor Two <small>more dangerous than the first</small></h3>
        <p class="text">A band of kobolds has hatched a horned dragon wyrmling and has been raiding the fishery to feed it. If the heroes don't stop this, the dragon grows up into a menace for the whole region. Activate the second floor of the map and put the heroes' tokens on the staircase.</p>
      </section>` : "";
    const tail = floor === 2 ? `
      <section class="panel" style="--tone:var(--gold)">
        <h3>${ENDING.title}</h3>
        <p class="text">${ENDING.text}</p>
        <p class="note">${ENDING.early}</p>
        <p class="note">${ENDING.next}</p>
      </section>` : "";
    return head + areas.map(a => this.areaCard(a, ro)).join("") + tail;
  }

  areaCard(a, ro) {
    const t = this.t, done = !!t.s.areas[a.key];
    const award = t.awards().filter(x => x.area === a);
    return `
      <section class="panel area ${done ? "done" : ""}" style="--tone:var(--${a.tone})">
        <h3><span class="eid">${a.n}</span>${a.name}
          ${a.xp ? `<span class="lvl">${a.xp} XP</span>` : `<span class="lvl">no XP</span>`}
          ${t.imported ? `<button type="button" class="say" data-act="page" data-k="${a.page}" title="Open this area's journal page"><i class="fa-solid fa-book-open"></i></button>` : ""}
          ${a.boxed ? `<button type="button" class="say" data-act="postboxed" data-k="${a.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>` : ""}
        </h3>
        ${a.lead ? `<p class="text">${a.lead}</p>` : ""}
        ${a.boxed ? `<p class="boxed">${a.boxed}</p>` : ""}
        ${a.creatures ? `<div class="crew">${a.creatures.map(c => `
          <button type="button" class="mon" data-act="actor" data-k="${c.id}" data-n="${esc(c.name)}" title="Open ${esc(c.name)}">
            <i class="fa-solid fa-skull"></i>${c.n ? `${c.n} × ` : ""}${esc(c.name)}${c.note ? ` <em>${c.note}</em>` : ""}</button>`).join("")}</div>` : ""}
        ${a.reads ? this.readsBlock(a) : ""}
        ${a.checks?.length ? `<ul class="checks">${a.checks.map(c => `<li>${c}</li>`).join("")}</ul>
          <div class="btnrow"><button type="button" class="ghost sm" data-act="postchecks" data-k="${a.key}"><i class="fa-solid fa-dice-d20"></i> Post these as rollable checks</button></div>` : ""}
        ${a.beats ? a.beats.map(([k, v]) => `<p class="branch"><b>${k}</b>${v}</p>`).join("") : ""}
        ${a.boxed2 ? `<p class="boxed">${a.boxed2}
          <button type="button" class="say inline" data-act="postboxed" data-k="${a.key}" data-w="boxed2" title="Read to the table"><i class="fa-solid fa-comment"></i></button></p>` : ""}
        ${a.quotes ? a.quotes.map(([k, v]) => `<p class="quote"><b>${k}</b> “${v}”</p>`).join("") : ""}
        ${a.sets ? this.setsBlock(a, ro) : ""}
        ${a.note ? `<p class="note">${a.note}</p>` : ""}
        ${a.loot ? `
          <div class="loot ${t.s.loot[a.key] ? "claimed" : ""}">
            <button type="button" class="lootbtn" data-act="actor" data-k="${a.loot.id}" data-n="${esc(a.loot.name)}" title="Open the loot actor">
              <i class="fa-solid fa-sack-dollar"></i> ${esc(a.loot.name)}</button>
            <span>${a.loot.note}</span>
            <button type="button" class="opt sm ${t.s.loot[a.key] ? "on" : ""}" data-act="loot" data-k="${a.key}" ${ro ? "disabled" : ""}>${t.s.loot[a.key] ? "Claimed" : "Claim"}</button>
          </div>` : ""}
        <div class="btnrow">
          ${award.map(x => `<button type="button" class="opt sm ${t.s.xp[x.key] ? "on" : ""}" data-act="xp" data-k="${x.key}" ${ro ? "disabled" : ""}>
            ${t.s.xp[x.key] ? "✓ " : "+"}${x.xp} XP</button>`).join("")}
          ${a.macro ? `<button type="button" class="ghost sm" data-act="macro" data-k="${a.macro}" title="Run the module's own macro"><i class="fa-solid fa-play"></i> ${MOD_MACROS[a.macro].name}</button>` : ""}
          ${a.companion ? `<button type="button" class="opt sm" data-act="companion" data-k="${esc(a.companion.name)}" title="The playable board in this collection — hand it to the players"><i class="fa-solid fa-coins"></i> ${a.companion.label}</button>` : ""}
          ${a.fx ? this.fxBtn(a.fx) : ""}
          ${(a.audio ?? []).map(name => this.soundBtn(name)).join("")}
          <button type="button" class="${done ? "ghost" : "primary"} sm" data-act="area" data-k="${a.key}" ${ro ? "disabled" : ""}>${done ? "Reopen" : "Mark done"}</button>
        </div>
      </section>`;
  }

  readsBlock(a) {
    const t = this.t, v = t.flagValue(a.reads.key);
    if (!v || !a.reads[v]) return `<p class="carry pending"><i class="fa-solid fa-link"></i> Depends on an earlier choice that hasn't been recorded yet.</p>`;
    return `<p class="carry"><i class="fa-solid fa-link"></i> ${a.reads[v]}</p>`;
  }

  setsBlock(a, ro) {
    const t = this.t, cur = t.s.flags[a.sets.key];
    return `
      <div class="fork">
        <div class="subhead">This changes a later room</div>
        <div class="btnrow">
          ${a.sets.options.map(o => `<button type="button" class="opt ${cur === o.v ? "on" : ""}" style="--tone:var(--${o.tone})"
            data-act="flag" data-g="${a.sets.key}" data-k="${o.v}" ${ro ? "disabled" : ""}>${o.label}</button>`).join("")}
        </div>
        ${a.sets.options.map(o => cur === o.v ? `<p class="deg" style="--tone:var(--${o.tone})"><b>${o.label}</b> ${o.note}</p>` : "").join("")}
      </div>`;
  }

  fxBtn(key) {
    const st = this.t.fxStatus(key);
    const cue = FX[key];
    const why = st.state === "off" ? "Sequencer not detected — the animation is optional and the module's own sound still plays"
      : st.state === "missing" ? "No matching JB2A file installed"
      : `${st.detail}${st.sound ? ` · ${st.sound}` : ""}`;
    return `<button type="button" class="ghost sm fxbtn ${st.state}" data-act="fx" data-k="${key}"
      title="${esc(cue.label)} — ${esc(why)}"><i class="fa-solid fa-wand-sparkles"></i> ${esc(cue.label)}</button>`;
  }

  soundBtn(name) {
    const cue = audioBy(name);
    if (!cue) return "";
    const st = this.t.soundState(cue);
    return `<button type="button" class="ghost sm snd ${st.playing ? "on" : ""}" data-act="sound" data-k="${esc(name)}"
      ${!st.ok ? "disabled" : ""} title="${esc(st.ok ? `${cue.list} — ${name}` : `"${name}" isn't in this world`)}">
      <i class="fa-solid ${st.playing ? "fa-stop" : "fa-play"}"></i> ${esc(name)}</button>`;
  }

  /* ------------------------------------------------------------ table tab */
  tableTab(ro) {
    const t = this.t;
    const group = (kind, title, note) => `
      <section class="panel" style="--tone:var(--${kind === "bed" ? "slate" : "ember"})">
        <h3>${title} <small>${note}</small></h3>
        <div class="btnrow">${AUDIO.filter(a => a.kind === kind).map(a => this.soundBtn(a.name)).join("")}</div>
      </section>`;
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>Scenes</h3>
        <div class="scenes">
          ${SCENES.map(s => `
            <div class="scenerow">
              <button type="button" class="opt" data-act="scene" data-k="${s.id}" data-n="${esc(s.name)}"><i class="fa-solid fa-map"></i> ${s.name}</button>
              <span>${s.note}</span>
            </div>`).join("")}
        </div>
        <p class="hint">These activate the scene for everyone at the table.</p>
      </section>
      ${group("bed", "Ambience", "loops — one at a time, per area")}
      ${group("cue", "Soundboard", "one-shots and stingers")}
      <section class="panel" style="--tone:var(--plum)">
        <h3>Effect cues <small>animation from JB2A, sound from the adventure's own audio</small></h3>
        <div class="fxlist">
          ${Object.entries(FX).map(([k, cue]) => {
            const st = t.fxStatus(k);
            return `<div class="fxrow">
              <span class="dot ${st.state}"></span>
              <div class="fxname"><b>${cue.label}</b><small>${cue.where}</small></div>
              <span class="fxfile">${st.state === "ok" ? esc(st.detail) : st.state === "off" ? "Sequencer not detected" : "no matching file"}</span>
              ${this.fxBtn(k)}
            </div>`;
          }).join("")}
        </div>
        <p class="hint">Every cue works without Sequencer — the module's own sound still plays. To swap an animation, open Sequencer's Database Viewer and put your key at the top of that cue's list in the <code>FX</code> block near the top of the macro.</p>
      </section>
      <section class="panel" style="--tone:var(--moss)">
        <h3>Reference</h3>
        <div class="btnrow">
          <button type="button" class="ghost" data-act="macro" data-k="dcs"><i class="fa-solid fa-play"></i> Quick Reference: DCs</button>
          <button type="button" class="ghost" data-act="macro" data-k="encounters"><i class="fa-solid fa-play"></i> Quick Reference: Encounters</button>
          <button type="button" class="ghost" data-act="journal" data-e="${GM_JOURNAL}">Gamemastering journal</button>
          <button type="button" class="ghost" data-act="journal" data-e="${JOURNAL}">Menace Under Otari journal</button>
        </div>
        <p class="note">The two Quick Reference macros ship with the adventure and post their tables to chat.</p>
      </section>`;
  }

  /* -------------------------------------------------------------- wiring */
  wire(root) {
    if (!root || root.dataset?.bbWired === "1") return;
    if (root.dataset) root.dataset.bbWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const d = btn.dataset, a = d.act;
      if (a === "tab") { t.s.tab = d.k; t.touch(); }
      else if (a === "area") t.toggleArea(d.k);
      else if (a === "loot") t.toggleLoot(d.k);
      else if (a === "xp") t.toggleXp(d.k);
      else if (a === "flag") t.setFlag(d.g, d.k);
      else if (a === "actor") t.openActor(d.k, d.n);
      else if (a === "page") t.openPage(d.k);
      else if (a === "journal") t.openJournalPage(d.e, d.p);
      else if (a === "macro") t.runMacro(d.k);
      else if (a === "companion") t.runByName(d.k);
      else if (a === "scene") t.activateScene(d.k, d.n);
      else if (a === "sound") t.playByName(d.k);
      else if (a === "fx") t.fx(d.k);
      else if (a === "postboxed") t.postBoxed(d.k, d.w);
      else if (a === "postchecks") t.postChecks(d.k);
      else if (a === "postxp") t.postXp();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "xp") t.toggleXp(el.dataset.k);
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.lantern;
    return `<style>
      #bb-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #bb-console .window-content > * { background:transparent; }
      .bb { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .bb * { box-sizing:border-box; }
      .bb button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; }
      .bb button:hover:not(:disabled) { background:var(--hover); }
      .bb button:disabled { opacity:.4; cursor:not-allowed; }
      .bb input[type="checkbox"] { accent-color:var(--ember); margin:0; flex:none; }
      .bb h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.05em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
               padding-bottom:.3rem; flex-wrap:wrap; }
      .bb h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .bb h1, .bb h2, .bb h4, .bb legend { color:var(--ink); }
      .bb .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem; background:var(--card); }
      .bb .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .bb .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .bb .panel.done { opacity:.7; }
      .bb .warn { font-size:.78rem; line-height:1.45; color:var(--ember); border:1px solid var(--ember);
                  border-radius:3px; padding:.45rem .55rem; margin:0 0 .6rem; display:flex; gap:.45rem; align-items:flex-start; }
      .bb .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 7px; letter-spacing:.06em; font-weight:700; }
      .bb .eid.sm { font-size:.62rem; padding:0 5px; background:var(--muted); }
      .bb .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .bb .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .bb .say.inline { margin-left:.35rem; width:20px; height:18px; }
      .bb .say + .say { margin-left:.25rem; }
      .bb .boxed { font-size:.82rem; line-height:1.55; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; }
      .bb .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .bb .note { font-size:.78rem; line-height:1.45; color:var(--muted); margin:.2rem 0 .4rem; }
      .bb .hint { font-size:.73rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .bb .bonus { font-size:.79rem; font-weight:600; color:var(--moss); margin:.35rem 0 .2rem; line-height:1.5;
                   display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
      .bb .quote { font-size:.8rem; line-height:1.5; margin:.3rem 0; padding-left:.55rem;
                   border-left:2px solid var(--tone, var(--line)); font-style:italic; }
      .bb .quote b { display:block; font-style:normal; color:var(--muted); font-size:.7rem;
                     text-transform:uppercase; letter-spacing:.05em; }
      .bb .branch { font-size:.79rem; line-height:1.5; margin:.25rem 0; }
      .bb .branch b { display:block; color:var(--tone, var(--muted)); font-size:.72rem;
                      text-transform:uppercase; letter-spacing:.05em; }
      .bb .checks { margin:.2rem 0 .3rem; padding-left:1.1rem; font-size:.79rem; line-height:1.5; color:var(--slate); }
      .bb .checks li { margin-bottom:.2rem; }
      .bb .deg { font-size:.78rem; line-height:1.45; margin:.3rem 0 0; }
      .bb .deg b { color:var(--tone, var(--ink)); }
      .bb .subhead { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin-bottom:.25rem; }
      .bb .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.4rem 0 .1rem; }
      .bb .primary { background:var(--tone, var(--ember)); border-color:var(--tone, var(--ember));
                     color:var(--paper); font-weight:700; padding:.3rem .7rem; font-size:.76rem; }
      .bb .primary:hover:not(:disabled) { filter:brightness(1.15); background:var(--tone, var(--ember)); }
      .bb .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .bb .ghost.sm, .bb .opt.sm { padding:.22rem .5rem; font-size:.7rem; }
      .bb .opt { padding:.28rem .6rem; font-size:.75rem; }
      .bb .opt.on { background:var(--tone, var(--ember)); border-color:var(--tone, var(--ember)); color:var(--paper); font-weight:600; }
      .bb .snd.on { color:var(--moss); border-color:var(--moss); }
      .bb .fxbtn.off, .bb .fxbtn.missing { opacity:.55; }

      .bb .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .bb .score { display:flex; flex-direction:column; }
      .bb .score span { font-size:.56rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .bb .score b { font-size:1.2rem; line-height:1; color:var(--ember); }
      .bb .score b i { font-size:.7rem; font-style:normal; color:var(--muted); }
      .bb .score b.hit { color:var(--moss); }
      .bb .track { flex:1; min-width:180px; }
      .bb .track small { font-size:.62rem; color:var(--muted); }
      .bb .bar { height:8px; border:1px solid var(--line); border-radius:4px; background:var(--stripe);
                 overflow:hidden; margin-bottom:.15rem; }
      .bb .bar span { display:block; height:100%; background:var(--ember); }
      .bb .lamps { display:flex; gap:.35rem; flex-wrap:wrap; }
      .bb .lamp { display:inline-flex; align-items:center; gap:.3rem; font-size:.67rem; text-transform:uppercase;
                  letter-spacing:.05em; color:var(--muted); border:1px solid var(--line); border-radius:10px; padding:2px 8px; }
      .bb .lamp i { font-size:.6rem; opacity:.4; }
      .bb .lamp.lit { color:var(--gold); border-color:var(--gold); font-weight:700; }
      .bb .lamp.lit i { opacity:1; }

      .bb .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .bb .tab { flex:1; padding:.3rem .2rem; font-size:.77rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .bb .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .bb .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .bb .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .bb .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .bb .tab.on b i, .bb .tab.on small { color:var(--paper); opacity:.85; }

      .bb button.cn { background:transparent; border:0; padding:0; color:inherit; font-family:inherit;
                      font-size:inherit; text-transform:inherit; letter-spacing:inherit; cursor:pointer; }
      .bb button.cn:hover { text-decoration:underline; background:transparent; }
      .bb .crew { display:flex; gap:.35rem; flex-wrap:wrap; margin:.1rem 0 .45rem; }
      .bb .mon { font-size:.74rem; padding:.22rem .55rem; color:var(--rust); border-color:var(--rust); }
      .bb .mon em { color:var(--muted); font-style:normal; font-size:.68rem; }

      .bb .carry { font-size:.78rem; line-height:1.45; margin:.3rem 0; padding:.35rem .5rem;
                   border:1px dashed var(--tone, var(--line)); border-radius:3px; background:var(--stripe);
                   display:flex; gap:.45rem; align-items:flex-start; }
      .bb .carry i { color:var(--tone, var(--muted)); font-size:.7rem; margin-top:.15rem; }
      .bb .carry.pending { color:var(--muted); border-color:var(--line); }
      .bb .fork { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0; background:var(--stripe); }

      .bb .loot { display:grid; grid-template-columns:auto 1fr auto; gap:.5rem; align-items:center;
                  border:1px solid var(--gold); border-radius:3px; padding:.35rem .45rem; margin:.4rem 0;
                  font-size:.77rem; line-height:1.45; }
      .bb .loot.claimed { opacity:.6; }
      .bb .lootbtn { font-size:.74rem; padding:.2rem .5rem; color:var(--gold); border-color:var(--gold); white-space:nowrap; }

      .bb .ledger { display:flex; flex-direction:column; gap:2px; }
      .bb .xprow { display:grid; grid-template-columns:auto 1.6rem 1fr auto; gap:.5rem; align-items:center;
                   border:1px solid transparent; border-radius:3px; padding:.22rem .4rem; font-size:.78rem; cursor:pointer; }
      .bb .xprow:hover { background:var(--stripe); }
      .bb .xprow.on { border-color:var(--moss); }
      .bb .xprow.on b { color:var(--moss); }
      .bb .xprow.gated { opacity:.5; }
      .bb .xprow b { color:var(--muted); font-variant-numeric:tabular-nums; }
      .bb .xprow .lbl { overflow:hidden; text-overflow:ellipsis; }

      .bb .scenes { display:flex; flex-direction:column; gap:.3rem; }
      .bb .scenerow { display:grid; grid-template-columns:9rem 1fr; gap:.6rem; align-items:center;
                      font-size:.78rem; color:var(--muted); }

      .bb .fxlist { display:flex; flex-direction:column; gap:2px; }
      .bb .fxrow { display:grid; grid-template-columns:10px 1fr 13rem auto; gap:.55rem; align-items:center;
                   padding:.3rem .25rem; border-top:1px solid var(--stripe); }
      .bb .dot { width:10px; height:10px; border-radius:50%; border:1px solid var(--line); }
      .bb .dot.ok { background:var(--moss); border-color:var(--moss); }
      .bb .dot.missing { background:var(--ember); border-color:var(--ember); }
      .bb .fxname b { font-size:.8rem; display:block; }
      .bb .fxname small { font-size:.7rem; color:var(--muted); }
      .bb .fxfile { font-size:.68rem; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

      @media (max-width:860px) {
        .bb .tabs { flex-wrap:wrap; }
        .bb .loot { grid-template-columns:1fr; }
        .bb .scenerow { grid-template-columns:1fr; }
        .bb .fxrow { grid-template-columns:10px 1fr auto; }
        .bb .fxfile { display:none; }
        .bb .xprow { grid-template-columns:auto 1.6rem 1fr auto; }
      }
    </style>`;
  }
}

if (AppV2) {
  BBApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSetting();
  let state = game.settings.get(BB_NS, BB_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(BB_NS, BB_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const run = new Otari(state);
  const app = new BBApp(run);

  if (!globalThis.__bbHook) {
    globalThis.__bbHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== BB_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { run.state = fresh; run.render(); }
    });
  }
  /* Playlist changes made from the sidebar have to repaint the play buttons. */
  if (!globalThis.__bbSoundHook) {
    globalThis.__bbSoundHook = Hooks.on("updatePlaylistSound", () => run.render());
  }
  app.render(true);
})();
