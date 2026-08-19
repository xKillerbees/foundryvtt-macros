/* ============================================================================
   IN THE RUINS OF WISDOM — Chapter 7 Console
   Season of Ghosts, Act 2 Chapter 3 · party level 6
   Foundry VTT v11 / v12 / v13 / v14  •  built for PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.
   Runs the Tan Sugi monastery: the four corrupted statues and the escalating
   events each purification fires, all sixteen areas, and the aftermath ledger
   that pushes Hope and Reputation back into the Fall Downtime Tracker.
   ============================================================================ */

const RW_NS = "world";
const RW_KEY = "sogRuinsOfWisdom";
const RW_ID = `${RW_NS}.${RW_KEY}`;
const EP_ID = "world.sogEnlightenedPath";      // read: how many shrines were enlightened
const DOWNTIME_ID = "world.sogFallDowntime";   // write: the aftermath ledger
const MAX_PCS = 4;

const DEG = ["cs", "s", "f", "cf"];
const DEG_LABEL = { cs: "Crit Success", s: "Success", f: "Failure", cf: "Crit Failure" };

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

/* ------------------------------------------------------------------ tabs */
/* The tab strip carries the same colours the panels under it use, so the
   strip says where you are before you read it. */
const ZONES = [
  { key: "arrival", label: "Arrival", sub: "gifts and ground rules", tone: "gold", icon: "fa-mountain-sun" },
  { key: "statues", label: "The statues", sub: "purification", tone: "plum", icon: "fa-gopuram" },
  { key: "grounds", label: "E1–E5", sub: "gate to shrine", tone: "moss", icon: "fa-torii-gate" },
  { key: "halls", label: "E6–E9", sub: "refectory to dorms", tone: "ember", icon: "fa-utensils" },
  { key: "grove", label: "E10–E13", sub: "libraries and the tree", tone: "slate", icon: "fa-book" },
  { key: "below", label: "E14–E16", sub: "beneath the monastery", tone: "rust", icon: "fa-dungeon" },
  { key: "after", label: "Aftermath", sub: "back to Willowshore", tone: "gold", icon: "fa-scroll" }
];

/* -------------------------------------------------------------- arrival */
const ARRIVAL = {
  boxed: "The Path rises over one last crest and drops into a wide, forested caldera. An hour before sunset the party reaches a plain wooden arch and a small shrine, and the chill abates — fall warmth, birdsong, cicadas, and the scent of the forest all at once.",
  text: "Master Zhi Hui's spirit senses the party's approach. She is still trapped in Kugaptee's grave, but walking the Path earns them a reward scaled to how many of the three shrines they reached enlightenment at.",
  fewer: "The party feels an unseen disappointment and understands they should walk back to the shrines they missed. On a return visit, give them more to work with — extra visions, urgings from beyond. They may press on to the monastery instead, with no additional benefit.",
  all: "Welcoming pride, and an unmistakable sense of peril ahead. They also feel an urge to look inside the small shrine, where they find the Pilgrimage Gifts — magic items manifested by Zhi Hui's power, the same way Kugaptee's presence has manifested so many monsters.",
  gifts: "Choose one gift per PC from the Adventure Toolbox to suit their abilities and themes; each PC instinctively recognises which is meant for them. The Toolbox items also work as templates for gifts of your own design."
};

const FEATURES = [
  "Wood buildings on stone floors. Colonnades are 15 feet high, the larger chambers 40, and the main hall 60. The central sugi tree clears a hundred.",
  "No artificial light. Walkways are brightly lit by day, chambers dimly lit. Courtyard-facing windows are shuttered and glassless; moving through one is difficult terrain.",
  "Climbing an exterior wall is DC 15 Athletics, but getting over the overhanging rooflines needs DC 25 Athletics.",
  "Colonnade and building openings are easy for Medium or smaller creatures. Large creatures treat them as greater difficult terrain.",
  "The monastery's residents have had no visitors in ages. Most of them would rather talk first — unsettlingly — and attack after."
];

const RESTING = [
  "Until the party finds the hidden library (E11), the ruins are no place to sleep. The safest retreat is the 3-mile walk back to the Mountain Shrine.",
  "Anyone sleeping in the ruins before the statues are purified suffers nightmares of being buried alive, of tragic reincarnations, of grisly betrayals — treat as a Nightmare spell, DC 23 Will save.",
  "Purifying all four statues ends the nightmares. Sleep in the ruins still brings bad dreams, but nothing debilitating.",
  "If the players never think to purify the statues, use the nightmares to plant the idea — or simply let them realise it once they've seen two of the four."
];

/* ------------------------------------------------------------- statues */
const PURIFY = {
  traits: ["Concentrate", "Exploration"],
  requirement: "All hostile creatures in the encounter area where the statue stands are defeated.",
  text: "10 minutes offering prayers to the statue's guardian spirits, cleaning or repairing the damage, and removing malignant encrustations and supernatural markings. Other PCs can Aid with any of the allowed skills.",
  warn: "The failure damage is this chapter's real threat: 5d6 mental splashing onto every single Aider, at 6th level, off a DC 20. Everybody piling on to Aid is a plausible party wipe outside of combat. Say the Aid risk out loud once — after that it's their call.",
  checks: ["DC 20 Religion", "DC 22 Crafting", "DC 24 Thievery"],
  outcomes: {
    cs: "The statue is purified.",
    s: "The statue is purified, but a weakened blast of pure loathing lashes out as it's driven off — 2d6 mental damage, DC 22 basic Will save.",
    f: "The statue remains unpurified. A blast of psychic rage inflicts 5d6 mental damage (DC 22 basic Will) on you and everyone who Aided.",
    cf: "As failure, but 10d6 mental damage, and nobody can attempt this statue again for 1 hour."
  }
};

const STATUES = {
  e2: { area: "E2", name: "Kodama kami", where: "north-east of the courtyard (E2a)", tone: "moss", xp: 40,
        detail: "Three feet of stone under thick, foul-smelling black mold." },
  e3: { area: "E3", name: "Stone sugi", where: "the centre of the main hall", tone: "ember", xp: 40,
        detail: "A fifty-foot half-scale replica of the Tan Sugi. The haunt inside it has to be beaten first." },
  e5: { area: "E5", name: "Pharasma", where: "the dais in Pharasma's shrine", tone: "plum", xp: 40,
        detail: "Headless, bound in bloodstained rope and old bones. The head from E13 must be set on the neck stump first; on a successful purification it reattaches as though never struck off.",
        needsHead: true },
  e12: { area: "E12", name: "Stag", where: "beside the north-east door of the burial garden", tone: "slate", xp: 40,
         detail: "Wrapped in damp, diseased vines. The fungi in the room have to be cleared first." }
};

const PURIFICATION_EVENTS = [
  { n: 1, title: "First purification", questions: 1, tone: "gold",
    text: "Zhi Hui's ghost, until now trapped in Kugaptee's grave (E16), manifests out of the statue — forlorn and despondent, softening to relief and gratitude.",
    quote: "Thank you for this kindness. It has been so long since I've been able to see beyond the engulfing darkness, but it still pulls at me. I will not be able to remain for long, but I can remain long enough to answer a question you may have for me. Know that there are other statues. Cleanse them and I can aid you further.",
    after: "After her answer, or a few minutes, she cries out and appears to be ripped to bloody shreds before vanishing back into the grave." },
  { n: 2, title: "Second purification", questions: 2, tone: "slate",
    text: "The secret doors to the hidden library (E11) unlock and glow softly the next time the party approaches either of them. Zhi Hui manifests again to thank them and urge them on.",
    quote: "Seek the hidden library... my friend, Yen Rui, can help...",
    after: "Two questions this time, then she is ripped apart again as she goes." },
  { n: 3, title: "Third purification", questions: 3, tone: "moss",
    text: "The shadowy weight lifts. The party realises they've been spiritually oppressed since entering the ruins. If the storm still rages because Iogaka lives, it ends now and she vanishes from the mindscape. Birds and insects build in the forest, though the ruins stay grim.",
    quote: "",
    after: "Three questions, and this time she fades peacefully rather than being torn apart." },
  { n: 4, title: "Fourth purification", questions: Infinity, tone: "rust",
    text: "The sickened trees recover — all but the Tan Sugi itself. The weeds in E2 wither so the courtyard is no longer difficult terrain, the water runs clear and stops showing fiendish reflections, and the wall of force over the stair in the treasury (E15) fades.",
    quote: "In order to fully remove Kugaptee's influence, they must go down into his grave and defeat Xin Yue, who allowed the corruption to spread.",
    after: "Zhi Hui can now manifest at will at any statue, answer anything, and cast spells on the party. The statue sites are safe places to rest, and she will aid the final fight." }
];

/* --------------------------------------------------------------- areas */
const AREAS = [
  /* ------------------------------------------------------------ grounds */
  { id: "E1", key: "e1", zone: "grounds", name: "Grand Gate", level: "", tone: "muted",
    boxed: "A wooden gatehouse in the monastery's southern wall. Shredded fulus hang from the bamboo bars, and a lone wind chime jingles from a rickety post over the gate.",
    text: "Departing monks each left a non-magical fulu on the gate — guilt for some, a silent wish for a successor for others. The residents shredded them all and left the remains hanging in mockery. The gates open easily onto an empty gatehouse.",
    treasure: "The nindorus were lazy about it: an escape fulu and two stumbling fulus survived." },

  { id: "E2", key: "e2", zone: "grounds", name: "Courtyard", level: "Low 6", tone: "moss",
    creatures: "Yuni (fiendish reflection)",
    boxed: "A polluted creek links half a dozen ponds in a weed-tangled courtyard. Mold-blotched sugi trees grow among small stone shrines, and the bridge between the gatehouse and the hall to the north lies in ruins.",
    text: "Thick weeds make the courtyard difficult terrain until the fourth statue is purified. The three-foot water is silted green with a foamy brown crust. Ten years ago two sisters walked the Path; the younger, Yeri, died in the woods (C2), and the elder, Yuni, got as far as this courtyard before a tiger kept by the corrupted monks killed her.",
    checks: ["DC 15 Fortitude or become sickened 1 after drinking the polluted water"],
    note: "Yuni hides in the shrine at E2b until someone comes within 30 feet, then rises where she was mauled, opens with Frightful Moan, and attacks. She can't leave E2 but keeps up ranged attacks while enemies are in sight.",
    beats: [
      { key: "charm", label: "A PC carries Yeri's charm of resistance (from C2)",
        note: "Yuni breaks off after round one and demands the bracelet: \"Give me my sister's bracelet! That isn't yours!\"" },
      { key: "given", label: "The charm was handed over",
        note: "She cradles it and asks where her little sister is. Truth — or a Lie she doesn't see through — and she returns the charm, thanks them for helping Yeri find peace, and fades. A Lie she catches drops the charm and renews the fight until she's destroyed." }
    ],
    hazard: "The water at the ruined bridge (E2c) is dark, clear, very reflective — and very haunted.",
    statue: "e2" },

  { id: "E3", key: "e3", zone: "grounds", name: "Main Hall", level: "Moderate 6", tone: "ember",
    creatures: "Ittan-momen (4) · Kugaptee's Tree haunt",
    boxed: "An open-air chamber with a sixty-foot ceiling. Between the archways, the hills and forests of Specterwood are carved and painted in fading colour. A fifty-foot stone tree rises in the centre, branches spread over circular rows of moldy cushions.",
    text: "The first stop for visitors. The stone tree is a half-scale replica of the Tan Sugi, built so pilgrims could touch an approximation of the sacred tree — only monks were allowed into the northern courtyard where the real one grows.",
    note: "The statue absorbed and purified Kugaptee's energy for years before it overflowed and corrupted it. The chamber now brims with so much evil that even the nindorus avoid it. Four of the cushions are ittan-momen tsukumogami; they rip free once the haunt triggers, pursue the party anywhere in the monastery, and fight to the death.",
    treasure: "A spellguard shield among the cushions east of the statue, left by an ill-fated looter.",
    statue: "e3" },

  { id: "E4", key: "e4", zone: "grounds", name: "Infirmary", level: "Moderate 6", tone: "rust",
    creatures: "Monks of Kugaptee (2)",
    boxed: "A large hole is torn through the northern door. Shredded cots, ruined furniture, and debris cover the floor, deep gashes score the walls, and a thick rancid smell fills the room. Battered shelves lie heaped against the west wall.",
    text: "Two of the monks who once treated the sick here joined Xin Yue and rose as kurobozus. They lurch forward but don't attack at once: \"Have you come to join Kugaptee? Are you here to escape the prison of life?\" They attack as soon as it's clear nobody is volunteering, and pursue foes anywhere except E2 — they still fear the ghost there.",
    treasure: "Two moderate healing potions, expanded healer's tools, and healer's gloves in the debris." },

  { id: "E5", key: "e5", zone: "grounds", name: "Pharasma's Shrine", level: "Low 6", tone: "plum",
    creatures: "Sojiruhs (3)",
    boxed: "A wooden statue of a regal woman sits meditating on a low dais. Bones, dead leaves, and chunks of mummified flesh heap around her; her head has been hewn off with a single blow. Bloodstained, moldy ropes bind the statue, with more old bones affixed among them.",
    text: "The monks followed Sangpotshi but raised this statue out of respect for Pharasma's role in the cycle. The nindorus defiled it on the first day of summer. The three \"praying monks\" are sojiruh nindorus meditating on the futility of Pharasma's place in the multiverse and preparing to rebind the statue in fresh rope.",
    checks: ["DC 10 Religion to Recall Knowledge and identify Pharasma — a critical success reads the defilement as a rejection of her power over life and death"],
    note: "Use the sojiruhs to leak what you like: that the remaining monks are undead, that someone named Xin Yue leads them, even that the founder's ghost is imprisoned here. Then they issue their challenge.",
    beats: [
      { key: "race", label: "The circuit challenge was run",
        note: "Race from here to E1, then E7, E6, E3, E4, and back before the nindorus finish rebinding the statue. They never actually start. On the party's return: \"You have run a circuit as we challenged you to, yet as with your cycle of life and death, the cycle itself is meaningless, hollow, and not to be trusted.\" Then they attack — as they do if the party refuses, opening with Stolen Scream. They fight to the death and pursue anywhere." },
      { key: "head", label: "Pharasma's head set on the neck stump",
        note: "Recovered from the sugi tree's branches in E13. Required before the statue can be purified; a PC who touched the glowing head has a +2 item bonus to the check." }
    ],
    statue: "e5" },

  /* -------------------------------------------------------------- halls */
  { id: "E6", key: "e6", zone: "halls", name: "Refectory", level: "Severe 6", tone: "rust",
    creatures: "Monks of Kugaptee (3)",
    boxed: "Ruined tables and broken benches lie heaped in the refectory. It might once have been a fine place to take a meal; now it is cold and empty.",
    text: "Three kurobozus stand listlessly, staring at a room that gave them camaraderie even after they betrayed their brothers and sisters. \"Do you realize what a pleasure it is to be able to eat?\" They press the party for favourite meals in more and more detail — and if any of them knows tea, ask them to fetch supplies from the pantry (E8), brew in the kitchen (E7), and serve it here.",
    note: "Serving requires Host Ceremony. A critical success and they thank the party, mention that they used the interloper's magical axe to take the death goddess's head and put it in the upper boughs of the sugi tree, then crumble to dust. A plain success gets the thanks and the dust, but not the hint. Return unprepared, or fail the ceremony, and all three attack in anguish until destroyed — they don't pursue.",
    beats: [
      { key: "supplies", label: "Tea supplies gathered from the pantry (E8)" },
      { key: "brewed", label: "Tea brewed in the kitchen (E7)" },
      { key: "served", label: "Host Ceremony succeeded — kurobozus satisfied",
        note: "Award XP as if the party had defeated the encounter. A critical success also reveals where Pharasma's head went." }
    ] },

  { id: "E7", key: "e7", zone: "halls", name: "Kitchen", level: "Trivial 6", tone: "ember",
    creatures: "Unholy Hunger (haunt)",
    boxed: "A clay furnace fills the south-east corner, a cooking pot bubbling under a stained lid over a lit hearth. Ruined tables and shelves lie scattered.",
    text: "The guhdggi from E9 is slow-cooking a vat of unpeeled onions, whole garlic, a clawed-apart radish, and the liver and intestines of an unlucky kurobozu, adding to it whenever it finds a new ingredient and occasionally rewarding the meokdans it lords over.",
    note: "Pull the lid and a boiled eyeball stares back out of the foul, haunted concoction.",
    treasure: "Beat the haunt and the pot boils dry to a sticky residue: 1 minute of work and DC 22 Crafting yields 5 doses of a poison equivalent to hunting spider venom (1 dose on a failure; none, and exposure, on a critical failure). A sterling artisan's toolkit for brewing and serving tea is among the utensils." },

  { id: "E8", key: "e8", zone: "halls", name: "Storage", level: "", tone: "muted",
    boxed: "Thick dust covers the shelves and containers of this pantry.",
    text: "Most of the food rotted away long ago.",
    checks: ["DC 27 Perception after 10 minutes Searching to find the loose floor stone in the south-west corner",
             "DC 15 Society or DC 15 Willowshore Lore to recognise the stolen goods"],
    treasure: "A minute of Searching turns up a large supply of tea leaves including a tin of rare tea worth 150 gp — using some to cover raw materials when crafting magic tea gives +1 item to the Crafting check, and using all of it for the ceremony in E6 gives +2 to Host Ceremony. Under the loose stone: a type II spacious pouch of jewellery, statuettes, and fine art worth 200 gp, stashed by the thief Kalen Bray before his capture.",
    beats: [
      { key: "stash", label: "The spacious pouch found" },
      { key: "returned", label: "Stolen goods returned to the townsfolk of Willowshore", xp: 60, hope: 2,
        note: "The pieces went missing a month or so before the last day of spring." }
    ] },

  { id: "E9", key: "e9", zone: "halls", name: "Dorms", level: "Moderate 6", tone: "moss",
    creatures: "Guhdggi · Meokdans (5)",
    boxed: "Twin rows of narrow bunks are the only decoration. Several have been crushed and pushed together under a hole in the roof to the north-east, forming a damp nest of rubble. The bedding is moldy and smells awful. Three collapsed dressers slump against the north wall.",
    text: "The monks slept here in shifts, the founder among them. A guhdggi — one of the largest nindorus in the ruins — has crushed several beds into its nest. It wanders out periodically to walk the woods and the Path up to the mountain shrine and back, gathering ingredients for the stew in E7; if the party leaves the monastery before killing it, they may meet it on the road. Five simpering meokdans massage its flanks and beg for food.",
    note: "It waves the party over and asks each of them for a story. It genuinely wants to hear them — but allow a DC 22 Perception to Sense Motive for the group as a whole each time a story starts, noting the lip-licking and the hidden stomach rumbles.",
    checks: ["DC 22 Perception to Sense Motive on the storytelling", "DC 24 Fortitude basic save against 5d6 poison damage for eating the stew", "DC 22 Perception while Searching to find the ring"],
    beats: [
      { key: "meal", label: "The party fetched dinner from E7 and ate it",
        note: "Carried unopened, the pot stays haunted but doesn't trigger for the guhdggi. Then it shares a tale of its own strolls — use that to reveal a danger or treasure the party hasn't found. Afterwards: \"You've been such great guests; it's a shame that we'll have to eat you all now too.\" It starts the fight sickened 2, and the meokdans are slowed 1 for two rounds, too busy belching compliments." }
    ],
    treasure: "A spiritsight ring hidden in a tear under one mattress." },

  /* -------------------------------------------------------------- grove */
  { id: "E10", key: "e10", zone: "grove", name: "Library", level: "Moderate 6", tone: "slate",
    creatures: "Ijda (2)",
    boxed: "The walls are charred black. Tatters of burned, ash-grey shelves drip dirty rainwater where the roof has caved in. Books and scrolls lie shredded; all the furniture is overturned.",
    text: "Decades of religious knowledge burned when Xin Yue and her followers cornered the last uncorrupted monks here with their hell hounds. The fire left the room in ruins, the monks dead, and Xin Yue convinced she'd chosen correctly.",
    note: "Two ijda nindorus sift the ashes with broken katanas. They ignore the party until attacked, addressed, or approached: \"Do you remember? What was here? Do you remember? Who was here?\" Answer with a story true or invented — DC 22 Deception or DC 22 Diplomacy either way.",
    outcomes: [
      "Critical Success — astounded, one reveals the hidden book: \"Then surely you must remember this?\" They don't attack first, but they've forgotten the whole encounter by the party's next visit. Attack them before leaving and the distracted fiends roll flat checks for initiative.",
      "Success — as above, without the treasure.",
      "Failure — \"If you don't remember, why lie to us? Perhaps your dying screams will reveal the truth!\" and they attack.",
      "Critical Failure — as failure, and the fumbling enrages them: quickened for two rounds, extra action for Stride or Strike only."
    ],
    checks: ["DC 22 Deception or DC 22 Diplomacy for the story",
             "DC 27 Perception after 10 minutes Searching to find the secret door",
             "DC 27 Athletics to Force Open the secret door, or DC 25 Thievery to Pick the Lock"],
    treasure: "10 minutes Searching the rubble uncovers a book of warding prayers devoted to Pharasma.",
    beats: [
      { key: "door", label: "Secret door to the hidden library found",
        note: "Two statues purified and it glows within 20 feet — automatic discovery, and unlocked." }
    ] },

  { id: "E11", key: "e11", zone: "grove", name: "Hidden Library", level: "Severe 6", tone: "gold",
    creatures: "Yen Rui's poltergeists (3) — only if provoked",
    boxed: "Shelves line the walls. A low round table sits in the middle among sitting cushions, and a skeleton is slumped over it, quill in hand, an open book beneath the skull.",
    text: "Yen Rui, the last loyal monk, was forced in here while the others died next door. She held wards against entry — and the traitors simply locked the doors and made the room her crypt. She died of thirst, but not before recording her research on Kugaptee.",
    note: "Her spirit infused every text rather than manifesting as a ghost. She greets the party from all corners of the room at once, works to convince them she isn't a sinister haunt, urges them to keep purifying statues, tells them where the other corrupted statues are, and promises that nothing in the ruins will interrupt their sleep here. She only manifests physically — three elite poltergeists — if she must.",
    beats: [
      { key: "yenrui", label: "Spoke with Yen Rui and learned what she knows", xp: 120 },
      { key: "gifts", label: "Yen Rui floated her gifts off the shelves",
        note: "A lesser tome of restorative cleansing; scrolls of entangle fate, life's fresh bloom, prophet's luck, sacred nimbus, tomorrow's dawn, and wall of mirrors; and Watchers of the Cycle — parables (+1 item to Sangpotshi Lore and Religion to Recall Knowledge on Sangpotshi or reincarnation), ritual formulas for gnaw at the moon, last night's vigil, ransack the night, regale the lost ones, and sweetest solstice, and on the final pages, reincarnate. Worth 90 gp." }
    ],
    treasure: "The book under the skull holds Yen Rui's notes — the same information, for a party that destroys the poltergeists instead of talking. The rare-book collection grants a +2 item bonus to Sangpotshi Lore, Nindoru Lore, and Religion checks to Investigate or Recall Knowledge on the philosophy; 12 Bulk, worth 600 gp, and the key to the next act.",
    aside: { title: "Reincarnation",
      text: "Learned from Watchers of the Cycle, reincarnate works normally — but anyone brought back stays part of the Willowshore mindscape, gains no insight into it, and is \"alive\" only as a trapped soul. Later in the campaign this knowledge becomes the route to undoing the mindscape entirely." } },

  { id: "E12", key: "e12", zone: "grove", name: "Burial Garden", level: "Moderate 6", tone: "slate",
    creatures: "Fungus leshies (6) · Slime molds (2)",
    boxed: "The air is humid and unusually warm. Four twenty-foot planter boxes run down the middle of the room, overgrown with diseased weeds, damp fungi, and glistening vines. A low table with moldy cushions sits east, near a small door to the north-east; a stag statue stands by that door under damp, diseased vines.",
    text: "The monks grew food and flowers here and buried their dead in the planters, so their remains could nurture the plants they hoped to reincarnate as. Once a body was bone, those bones were exhumed, powdered, and returned to the soil to bolster Tan Sui-Jing's vigil over Kugaptee's grave. The magic that let plants thrive indoors faded with the monastery.",
    checks: ["DC 20 Fortitude at the start of each turn in the room or become sickened 1 — sickened 2 on a critical failure"],
    note: "The spores are an olfactory poison effect; a critical success grants 24 hours of immunity. The fungal monsters rise as the party moves through, silent apart from wet shifting, and don't pursue. The north-east door leads down to E14.",
    treasure: "10 minutes Searching after the fungi die: a primeval mistletoe tangled in a leshy's remains, and a verdant staff under the vines behind the stag statue.",
    statue: "e12" },

  { id: "E13", key: "e13", zone: "grove", name: "The Tan Sugi", level: "Moderate 6", tone: "moss",
    creatures: "The Chewer · Ogre spider",
    boxed: "A hundred-foot sugi towers over the overgrown courtyard, shading the whole monastery. Glistening coils of rot climb from its roots along the trunk, and immense spiderwebs thicken the branches above. A large silver-bladed axe stands embedded in the trunk four feet up, black sap crusting down from the wound.",
    text: "The tree grew from Tan Sui-Jing's body — the form she reincarnated into to keep Kugaptee from reincarnating himself. The decay climbing from the chamber below has reset every year for 115 years, but Mago Kai's meddling has accelerated it: unchecked, the tree falls by midwinter, Kugaptee escapes, the mindscape is destroyed, and every soul in it is absorbed.",
    note: "If anyone proposes felling the tree, that only hastens the same ruin — and merely delays Kugaptee's rebirth into the modern world rather than preventing it. Give them visions, or a warning from Zhi Hui: the sugi must live.",
    checks: ["DC 20 Nature — the affliction will kill the tree in months, and its source is underground",
             "DC 24 Perception, secret, to notice the blue glow 75 feet up (DC 17 after dark); a critical success identifies a wooden statue head in the webs",
             "DC 15 Athletics to Climb the tree",
             "DC 22 Athletics to pull the axe free",
             "DC 20 Will each time the axe is drawn or become frightened 1"],
    creaturesNote: "The ogre spider lurks motionless 50 feet up. Below, an undead kitsune in rags gnaws the roots — a horticulturist monk of Xin Yue's who forgot his own name in undeath and now calls himself the Chewer. \"More teeth will bring down this forlorn tree more quickly — surely you aren't cruel-minded enough to let it continue to suffer?\" He confirms the tree grew from a heroine's remains and that her soul stays trapped while it lives, grows impatient at contradiction, then draws his temple sword. The spider drops down to join in and will chase fleeing PCs through the monastery; the Chewer won't.",
    beats: [
      { key: "head", label: "Pharasma's head recovered from the webs",
        note: "Once the Chewer and the spider are dead the glow brightens, dropping the DC to notice by 10. Touching it ends the glow and fills that PC with the urge to return it — +2 item bonus to purify the statue in E5." },
      { key: "axe", label: "The axe pulled free of the trunk",
        note: "A +1 ghost touch striking silver battle axe, enhanced over the years by Tan Sui-Jing. Until Xin Yue is defeated it carries a quirk: each draw brings the urge to bury it in a friend's skull — DC 20 Will or frightened 1 (emotion, fear, mental)." }
    ] },

  /* -------------------------------------------------------------- below */
  { id: "E14", key: "e14", zone: "below", name: "Storage Room", level: "Moderate 6", tone: "rust",
    creatures: "Monk of Kugaptee · Hell hounds (3)",
    boxed: "A large basement that might once have held gardening equipment, fertilizer, lumber, and tools. Today it is a slaughterhouse — dismembered corpses and splattered organs across the floor, and a stink of decay that makes breathing the cold air an agonizing chore.",
    text: "The cultists dump sacrificial victims here; the cold slows decay just enough to make it truly awful. The chamber also guards the route to Kugaptee's grave, so Xin Yue posted the monastery's old cook — now a kurobozu — with her three favourite hell hounds, which look more like burning feral foxes than dogs. The party arrives mid-game of fetch, played with a well-chewed skull.",
    note: "\"It's rude to interrupt someone's idle moments. Why are you here? Why should I not feed you to my pets?\" It will talk for a while, then snap its fingers and set the hounds on them.",
    qa: [
      ["Who are you?", "I can't remember, but it doesn't matter. I serve at Xin Yue's whim, and she serves the great Kugaptee."],
      ["Why are there so many corpses here?", "Leftovers. Food. Decoration. What other use do corpses have? … Xin Yue needs fresh flesh and warm blood to sate Kugaptee, to provide him with strength so that he may rise from his grave. Are you here to volunteer your meat and juices?"],
      ["Who is Xin Yue?", "She is our focus, our reason, our purpose. … She has only killed and offered souls to Kugaptee since we arrived. I think. She's quite unpleasant to be around. You must think that's quite disturbing coming from someone like me. You'll understand when you meet her."],
      ["Who is Kugaptee?", "Oh! You wish to meet Kugaptee? We can arrange a meeting. Just hold still... — and the hounds attack with a +2 circumstance bonus to initiative."]
    ],
    beats: [
      { key: "kalen", label: "Kalen Bray found chained in the north-west alcove",
        note: "A small-time thief from Absalom, captured a week before the mindscape formed and useless as a sacrifice once he rose as a zombie with his memories intact. 115 years of resets have merged into \"forever\", so he plays dead. \"Well, this is new! People who aren't monsters? Who might you be?\" He lies — a hunter sheltering from a storm — and his vague clues are maddening: he and the monks turned undead at the same time, many years ago, and he can't remember why." },
      { key: "freed", label: "Promised to free him — he gives up the E8 stash",
        note: "Evil, but not dangerous. Freed, he lurks in the woods until something finishes him off. \"It's nothing some new clothes and a mask can't hide.\"" }
    ] },

  { id: "E15", key: "e15", zone: "below", name: "Treasure Chamber", level: "", tone: "gold",
    boxed: "Empty shelves, barren platforms, unadorned weapon and armour racks, and open dust-filled chests. Only one chest by the west wall is still closed. A double door to the south is carved with a spiralling rune painted red.",
    text: "Anyone trained in Religion or Sangpotshi Lore reads the rune as a warning, as does DC 20 Society. Until all four statues are purified a wall of force bars the doors; afterwards they open easily onto a long stairwell that spirals down one lazy revolution to E16.",
    checks: ["DC 17 Sangpotshi Lore or DC 20 Religion to know that deliberately empty treasuries are a Sangpotshi tradition"],
    treasure: "The monks built false treasuries to make the point that material wealth meant nothing. Their corrupted successors disagreed: the closed chest holds 1,600 cp, 430 sp, 54 gp, 120 gp of jewellery, an emerald grasshopper talisman, a bloodstained +1 chain shirt, and a wand of clear mind." },

  { id: "E16", key: "e16", zone: "below", name: "Kugaptee's Grave", level: "Severe 6", tone: "plum",
    creatures: "Xin Yue · Monks of Kugaptee (6)",
    boxed: "Glowing rivulets of red wind across the floor of a damp, cold, thirty-foot cavern, dripping from enormous tree roots that hang from the ceiling and push through the walls like runny sap. The pool they form surrounds four immense stone fingers and a thumb, each tipped with a red crystal talon, reaching up as though from a buried statue.",
    text: "Sixty feet below ground. The roots are a sugi's, far too immense even for the tree above — the whole chamber is a larger-than-life manifestation of the ancient clash between Tan Sui-Jing and Kugaptee, his petrified fingers standing five feet each. The fluid is fresh warm blood, Kugaptee leeching the reincarnated life above. The roots don't reach the floor.",
    checks: ["DC 18 Nature to Recall Knowledge and identify the roots as a sugi's"],
    note: "Xin Yue stands shin-deep in the pool, months into a constant cycle of prayer to guide Kugaptee back to life, six monks of Kugaptee watching raptly. Left alone she brings the tree down and wakes him in the dead of winter.",
    quote: "Ah, yes. I've been expecting you. Great Kugaptee foretold that townsfolk playing at being heroes would arrive soon. … Your flesh, your blood, and your lives will quicken this process. You should feel honored to be chosen such a role. … I am Xin Yue, and I shall be the blade that severs you from the trap you know as the cycle of life and death.",
    phases: [
      "Let her finish the speech and she rolls Diplomacy for initiative; interrupt her and she rolls Perception.",
      "All seven at once is beyond an Extreme 6 encounter — but with four statues purified, Zhi Hui manifests at the party's side, becomes spiritual energy, and pours into the roots. They thrash down and crush the six kurobozus, leaving Xin Yue alone and furious.",
      "Beating her is only half of it. Her Profane Reincarnation splits her open as a sojiruh nindoru while Kugaptee's fingers flex; Zhi Hui screams as the roots wither, and the six crushed kurobozus split open as meokdan nindorus. Back to back, a Low 6 followed by a Moderate 6.",
      "If the party needs help in the final fight, Zhi Hui can manifest once more — but only to cast healing spells. Decide the trigger before session rather than in the moment; two PCs below half is a clean one."
    ] }
];

/* ------------------------------------------------------------- aftermath */
const CONCLUSION = {
  boxed: "A roar rips through the cavern and a shape of bloody mist and shadow coils up, never settling on one form, reaching with many arms and demonic heads on coiling stalks. Then the cavern shrinks — a lurch of vertigo, roots growing smaller and more numerous, wrapping the shape and cutting off the roar. The party stands in a cramped, root-filled hollow. No fingers remain, and Xin Yue's dead human body lies at peace on the ground with her gear.",
  text: "The stairs back up are much shorter. The monastery is still in ruins, but every undead, monster, haunt, and nindoru is gone, and the Tan Sugi stands healthy — no webs, no diseased streaks. Zhi Hui appears one last time. This is the party's final chance to ask her anything, so give them room.",
  reveals: [
    "Willowshore isn't cursed. It's a cyclic mindscape repeating the same year, created when the town's governor tried and failed to perform a ritual meant to protect everyone from Kugaptee.",
    "The Kugaptee threat is gone, but the party is still trapped, with no idea how many times the year has repeated.",
    "If they never found the hidden library (E11), Zhi Hui leads them to it now.",
    "Once she's finished, her spirit merges with the Tan Sugi. A reset starts everything over; breaking the mindscape lets her finally move on."
  ],
  next: "Nothing left but the walk home and the last several weeks of fall. Researching the mindscape and finding Heh Shan-Bao open the next act, on the first day of winter. The hauntings in Willowshore were never Kugaptee's doing — that mystery belongs to the next act."
};

const TELLING = {
  cs: { hope: 2, label: "Critical success" },
  s: { hope: 1, label: "Success" },
  f: { hope: -1, label: "Failure" },
  cf: { hope: -3, label: "Critical failure" }
};

const HOUSEKEEPING = [
  "Run the Change Season macro on the Willowshore and Willowshore Hinterlands scenes.",
  "Fall Downtime Tracker: the party returns to the remaining weeks of fall.",
  "Any Pilgrimage Gifts and the +1 save bonuses from the shrines last until the end of the act."
];

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "arrival", pcs,
    statues: {},          // key -> { result }
    order: [],            // statue keys, in the order they were purified
    zhi: {},              // purification ordinal -> questions asked
    cleared: {},          // area key -> encounter cleared
    beats: {},            // area key -> { beat key: true }
    ledger: { hope: 0, rep: 2, told: null, secret: false, pushed: false },
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
function registerSettings() {
  if (!game.settings.settings.has(RW_ID)) {
    game.settings.register(RW_NS, RW_KEY, { scope: "world", config: false, type: Object, default: null });
  }
  /* Registered so this console can read what the pilgrimage banked and write
     the aftermath back, whether or not those macros have been run yet. */
  for (const id of [EP_ID, DOWNTIME_ID]) {
    if (!game.settings.settings.has(id)) {
      const [ns, key] = id.split(".");
      game.settings.register(ns, key, { scope: "world", config: false, type: Object, default: null });
    }
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const areaFor = (key) => AREAS.find(a => a.key === key);
const statueArea = (statueKey) => AREAS.find(a => a.statue === statueKey);

/* ------------------------------------------------------------- the journal
   The Season of Ghosts module ships this chapter as a journal entry with a
   fixed id, and a Foundry adventure import keeps that id — so a button can
   open the page for an area rather than leaving you to find it.

   An area resolves from its own E-number, because the module encodes the area
   code in the page id (`09e11hiddenlib00` is E11) even though the page is
   named just "Hidden Library". Ids read out of the module's pack.

   None of this is required. The entry resolves by id, then by name, then
   through the compendiums, and if the adventure isn't in the world no link
   renders at all. */
const JOURNAL = { id: "pf2apsog09inther", name: "Act 2.3: In the Ruins of Wisdom", ord: "09" };
const JPAGE = {
  chapter: "09intheruinsof00", monastery: "09tansugimonas00", features: "09monasteryfea00",
  resting: "09resting0000000", purify: "09purifyingthe00",
  purify1: "09firstpurific00", purify2: "09secondpurifi00",
  purify3: "09thirdpurific00", purify4: "09fourthpurifi00",
  back: "09returntowill00", concluding: "09concludingth00"
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

/* A ref is either an exact page id or an area code. The guard on the
   character after the code stops E1 matching E11. */
function journalPage(entry, ref) {
  if (!ref) return null;
  const pages = entry?.pages?.contents ?? entry?.pages ?? [];
  if (/^\d/.test(ref)) return pages.find(p => p.id === ref) ?? null;
  const head = `${JOURNAL.ord}${ref}`.toLowerCase();
  return pages.find(p => p.id.toLowerCase().startsWith(head)
    && !/\d/.test(p.id.charAt(head.length))) ?? null;
}

async function openJournal(ref) {
  const entry = await journalDoc();
  if (!entry) {
    ui.notifications.warn(`No journal found for "${JOURNAL.name}". Looked for the id ${JOURNAL.id}, then that name in the journal directory and the compendiums.`);
    return;
  }
  const page = journalPage(entry, ref);
  entry.sheet.render(true, page ? { pageId: page.id } : {});
}

/* ----------------------------------------------------------------- engine */
class Monastery {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(RW_NS, RW_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  /* ----- statues ----- */
  purified(key) { return ["cs", "s"].includes(this.s.statues[key]?.result); }
  get purifiedCount() { return this.s.order.length; }
  ordinalOf(key) { return this.s.order.indexOf(key) + 1; }

  /* Gates drawn from the count, so reversing a purification reverses them all. */
  get libraryOpen() { return this.purifiedCount >= 2; }
  get stormEnded() { return this.purifiedCount >= 3; }
  get graveOpen() { return this.purifiedCount >= 4; }

  canPurify(key) {
    const area = statueArea(key);
    if (!this.s.cleared[area.key]) return `Clear ${area.id} first — every hostile in the area must be defeated.`;
    if (STATUES[key].needsHead && !this.beat("e5", "head")) return "Set Pharasma's head on the neck stump first (recovered in E13).";
    return null;
  }

  setStatue(key, degree) {
    const st = this.s.statues[key] ?? (this.s.statues[key] = { result: null });
    const was = st.result;
    st.result = was === degree ? null : degree;

    const nowPure = this.purified(key), wasPure = ["cs", "s"].includes(was);
    const statue = STATUES[key];
    if (nowPure && !wasPure) {
      this.s.order.push(key);
      this.s.xp += statue.xp;
      const n = this.purifiedCount;
      ui.notifications.info(`${statue.name} purified — award ${statue.xp} XP. That's purification ${n} of 4.`);
      this.log(`${statue.area} ${statue.name}: purified (${DEG_LABEL[st.result]}) — purification ${n}.`);
    } else if (!nowPure && wasPure) {
      this.s.order = this.s.order.filter(k => k !== key);
      this.s.xp -= statue.xp;
      this.log(`${statue.area} ${statue.name}: purification undone.`);
    } else if (st.result) {
      this.log(`${statue.area} ${statue.name}: ${DEG_LABEL[st.result]}.`);
    }
    this.touch();
  }

  askQuestion(n, delta) {
    const asked = Math.max(0, (this.s.zhi[n] ?? 0) + delta);
    this.s.zhi[n] = asked;
    this.touch();
  }

  /* ----- areas ----- */
  toggleCleared(areaKey) {
    const on = !!this.s.cleared[areaKey];
    this.s.cleared[areaKey] = !on;
    this.log(`${areaFor(areaKey).id}: ${on ? "reopened" : "cleared"}.`);
    this.touch();
  }

  beat(areaKey, beatKey) { return !!this.s.beats[areaKey]?.[beatKey]; }

  toggleBeat(areaKey, beatKey) {
    const bucket = this.s.beats[areaKey] ?? (this.s.beats[areaKey] = {});
    const area = areaFor(areaKey);
    const beat = area.beats.find(b => b.key === beatKey);
    const on = !!bucket[beatKey];
    bucket[beatKey] = !on;

    if (beat.xp) {
      this.s.xp += on ? -beat.xp : beat.xp;
      if (!on) ui.notifications.info(`Award ${beat.xp} XP.`);
    }
    if (beat.hope) {
      this.s.ledger.hope += on ? -beat.hope : beat.hope;
      if (!on) ui.notifications.info(`${beat.hope} Hope Points, banked for the return to Willowshore.`);
    }
    this.log(`${area.id} — ${beat.label}: ${on ? "undone" : "done"}.`);
    this.touch();
  }

  /* ----- aftermath ----- */
  setTelling(degree) {
    const l = this.s.ledger;
    const was = l.told;
    if (was) l.hope -= TELLING[was].hope;
    l.told = was === degree ? null : degree;
    if (l.told) l.hope += TELLING[l.told].hope;
    this.log(`Telling Willowshore: ${l.told ? TELLING[l.told].label : "cleared"}.`);
    this.touch();
  }

  toggleSecret() {
    const l = this.s.ledger;
    l.secret = !l.secret;
    /* Secrecy is the alternative to telling, so it clears any recorded check. */
    if (l.secret && l.told) { l.hope -= TELLING[l.told].hope; l.told = null; }
    l.hope += l.secret ? -4 : 4;
    l.rep = l.secret ? -4 : 2;
    this.log(`Kept the monastery secret: ${l.secret ? "yes" : "no"}.`);
    this.touch();
  }

  async pushToDowntime() {
    const dt = game.settings.get("world", "sogFallDowntime");
    if (!dt) return ui.notifications.error("No downtime tracker state found. Run the Fall Downtime Tracker macro once first.");
    const l = this.s.ledger;
    dt.pools.hope += l.hope;
    dt.rep.southbank += l.rep;
    dt.rep.northridge += l.rep;
    const wk = dt.weeks?.[String(dt.week)];
    if (wk?.log) wk.log.unshift(`Return from the monastery: ${l.hope >= 0 ? "+" : ""}${l.hope} Hope, ${l.rep >= 0 ? "+" : ""}${l.rep} Reputation with both factions.`);
    await game.settings.set("world", "sogFallDowntime", dt);
    l.pushed = true;
    ui.notifications.info(`Sent to the downtime tracker: ${l.hope >= 0 ? "+" : ""}${l.hope} Hope and ${l.rep >= 0 ? "+" : ""}${l.rep} Reputation with each faction.`);
    this.log("Aftermath ledger pushed to the downtime tracker.");
    this.touch();
  }

  /* ----- the pilgrimage the party walked in on ----- */
  get enlightenments() {
    const ep = game.settings.get("world", "sogEnlightenedPath");
    if (!ep?.shrines) return null;
    const conds = { d1: ["cleared", "slept"], d2: ["incense", "slept"], d3: ["iogaka", "bathe", "slept"] };
    return Object.entries(conds).filter(([day, keys]) => keys.every(k => ep.shrines[day]?.[k])).length;
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("In the Ruins of Wisdom reset.");
    this.touch();
  }

  /* ----- chat ----- */
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
      speaker: { alias: "Tan Sugi Monastery" }
    });
  }

  postArea(key) {
    const a = areaFor(key);
    if (!a) return;
    const body = `<p style="margin:0 0 6px">${a.boxed}</p>` +
      (a.quote ? `<p style="margin:0;font-style:italic">“${a.quote}”</p>` : "");
    return this.postCard(a.level || "Area", `${a.id}. ${a.name}`, body, a.tone);
  }
  postChecks(key) {
    const a = areaFor(key);
    if (!a?.checks?.length) return ui.notifications.warn("No checks recorded for this area.");
    return this.postCard("Checks", `${a.id}. ${a.name}`,
      `<ul style="margin:0;padding-left:1.1em">${a.checks.map(c => `<li style="margin-bottom:4px">${linkify(c)}</li>`).join("")}</ul>`, a.tone);
  }
  postPurify() {
    return this.postCard("Exploration · Concentrate", "Purify Statue",
      `<p style="margin:0 0 6px">${PURIFY.text}</p>
       <p style="margin:0 0 6px">${PURIFY.checks.map(c => linkify(c)).join(" · ")}</p>
       <p style="margin:0;font-size:11px"><b>Requirement</b> ${PURIFY.requirement}</p>`, "gold");
  }
  postEvent(n) {
    const e = PURIFICATION_EVENTS[n - 1];
    return this.postCard(`Purification ${n} of 4`, e.title,
      `<p style="margin:0 0 6px">${e.text}</p>${e.quote ? `<p style="margin:0;font-style:italic">“${e.quote}”</p>` : ""}`, e.tone);
  }
  /* When the Enlightened Path console was never run there is nothing to read
     the welcome off, and guessing costs the table a scene — "fewer than three"
     tells them they missed shrines they may well have reached. Post the
     approach alone and let the GM pick the welcome. */
  postArrival() {
    const count = this.enlightenments;
    if (count === null) ui.notifications.info("No Enlightened Path state saved, so Zhi Hui's welcome is left off the card — tick the shrines on the Arrival tab's console, or read the welcome yourself.");
    const welcome = count === null ? ""
      : `<p style="margin:0">${count === 3 ? ARRIVAL.all : ARRIVAL.fewer}</p>`;
    return this.postCard("Chapter 7", "In the Ruins of Wisdom",
      `<p style="margin:0${welcome ? " 0 6px" : ""}">${ARRIVAL.boxed}</p>${welcome}`, "gold");
  }
  postConclusion() {
    return this.postCard("Concluding the act", "The grave restored",
      `<p style="margin:0 0 6px">${CONCLUSION.boxed}</p><p style="margin:0">${CONCLUSION.text}</p>`, "plum");
  }
  postStatus() {
    return this.postCard("Chapter 7", "Tan Sugi Monastery",
      `<p style="margin:0 0 6px"><b>Statues purified</b> ${this.purifiedCount} of 4</p>
       <p style="margin:0 0 6px"><b>Hidden library</b> ${this.libraryOpen ? "open" : "sealed"} · <b>Storm</b> ${this.stormEnded ? "broken" : "raging"} · <b>Kugaptee's grave</b> ${this.graveOpen ? "open" : "warded"}</p>
       <p style="margin:0"><b>Milestone XP awarded</b> ${this.s.xp}</p>`, "gold");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class RWApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "rw-console", tag: "div", classes: ["rw-console"],
    position: { width: 940, height: "auto" },
    window: { title: "In the Ruins of Wisdom", icon: "fa-solid fa-place-of-worship", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "rw-console", classes: ["rw-console"], title: "In the Ruins of Wisdom",
      width: 940, height: "auto", resizable: true
    });
  }
  get title() { return "In the Ruins of Wisdom"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="rw-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  /* -------------------------------------------------------------- markup */
  /* A link into the module's journal, or nothing at all when the adventure
     isn't in this world. A button that could only ever say "not found" would
     be worse than no button. */
  jbtn(ref, label = "") {
    const entry = journalEntry();
    if (!entry) return "";
    const page = journalPage(entry, ref);
    return `<button type="button" class="jbtn" data-act="journal" data-r="${esc(ref ?? "")}"
      title="Open the journal: ${esc(page ? page.name : entry.name)}"><i class="fa-solid fa-book-open"></i>${label ? ` ${label}` : ""}</button>`;
  }

  markup() {
    const t = this.t, s = t.s, ro = !t.editable;
    const zoneTab = ["grounds", "halls", "grove", "below"].includes(s.tab);
    return `${this.styles()}
      <div class="rw">
        ${this.header(ro)}
        <nav class="tabs">
          ${ZONES.map(z => `<button type="button" class="tab ${s.tab === z.key ? "on" : ""}" style="--tt:var(--${z.tone})" data-act="tab" data-k="${z.key}">
            <b><i class="fa-solid ${z.icon}"></i> ${z.label}</b><small>${z.sub}</small></button>`).join("")}
        </nav>
        ${s.tab === "arrival" ? this.arrivalTab() : ""}
        ${s.tab === "statues" ? this.statuesTab(ro) : ""}
        ${zoneTab ? this.zoneTab(s.tab, ro) : ""}
        ${s.tab === "after" ? this.afterTab(ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t;
    const flag = (on, label) => `<span class="flag ${on ? "on" : ""}">${label}</span>`;
    return `
      <header class="topbar">
        <div class="lamps">
          ${Object.keys(STATUES).map(k => `<span class="lamp ${t.purified(k) ? "lit" : ""}" title="${STATUES[k].area} — ${STATUES[k].name}"></span>`).join("")}
          <span class="lampcount">${t.purifiedCount} of 4 statues purified</span>
        </div>
        <div class="flags">
          ${flag(t.libraryOpen, "Hidden library")}
          ${flag(t.stormEnded, "Storm broken")}
          ${flag(t.graveOpen, "Grave open")}
        </div>
        <div class="xp"><span>Milestone XP</span><b>${t.s.xp}</b></div>
        <button type="button" class="say" data-act="poststatus" title="Post the party's standing"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset the chapter" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  /* ------------------------------------------------------------- arrival */
  arrivalTab() {
    const count = this.t.enlightenments;
    const known = count !== null;
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>The end of the Pilgrim's Path <small>an hour before sunset</small>
          ${this.jbtn(JPAGE.monastery)}
          <button type="button" class="say" data-act="postarrival" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="boxed">${ARRIVAL.boxed}</p>
        <p class="text">${ARRIVAL.text}</p>
      </section>

      <section class="panel" style="--tone:var(--plum)">
        <h3>Zhi Hui's welcome ${known ? `<small>${count} of 3 shrines enlightened</small>` : `<small>pilgrimage state unknown</small>`}</h3>
        ${known
          ? (count === 3
            ? `<p class="text"><b>All three shrines.</b> ${ARRIVAL.all}</p>
               <p class="note">${ARRIVAL.gifts}</p>`
            : `<p class="text"><b>Fewer than three shrines.</b> ${ARRIVAL.fewer}</p>
               <p class="hint">Reach all three and the small shrine holds the Pilgrimage Gifts instead.</p>`)
          : `<p class="hint">Run the Enlightened Path console once and this reads the party's enlightenments automatically. Until then: three shrines means Pilgrimage Gifts from the small shrine, fewer means an unseen disappointment and an urge to go back for the ones they missed.</p>`}
      </section>

      <section class="panel" style="--tone:var(--slate)">
        <h3>Monastery features ${this.jbtn(JPAGE.features)}</h3>
        <ul class="checks">${FEATURES.map(f => `<li>${f}</li>`).join("")}</ul>
      </section>

      <section class="panel" style="--tone:var(--rust)">
        <h3>Resting <small>the ruins are not safe</small> ${this.jbtn(JPAGE.resting)}</h3>
        <ul class="checks">${RESTING.map(r => `<li>${r}</li>`).join("")}</ul>
      </section>`;
  }

  /* ------------------------------------------------------------- statues */
  statuesTab(ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>Purify Statue <small>${PURIFY.traits.join(" · ")}</small>
          ${this.jbtn(JPAGE.purify)}
          <button type="button" class="say" data-act="postpurify" title="Post the activity"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="req"><b>Requirements</b> ${PURIFY.requirement}</p>
        <p class="text">${PURIFY.text}</p>
        <p class="dcs">${PURIFY.checks.join(" &nbsp;·&nbsp; ")}</p>
        <ul class="outcomes">
          ${DEG.map(d => `<li><b>${DEG_LABEL[d]}</b> ${PURIFY.outcomes[d]}</li>`).join("")}
        </ul>
        <p class="blocked"><i class="fa-solid fa-triangle-exclamation"></i> ${PURIFY.warn}</p>
      </section>

      <div class="grid">${Object.keys(STATUES).map(k => this.statueCard(k, ro)).join("")}</div>

      ${PURIFICATION_EVENTS.map(e => this.eventCard(e, ro)).join("")}`;
  }

  statueCard(key, ro) {
    const t = this.t, st = STATUES[key], res = t.s.statues[key]?.result ?? null;
    const done = t.purified(key);
    const blocked = t.canPurify(key);
    const n = t.ordinalOf(key);
    const bonus = key === "e5" && t.beat("e13", "head");
    return `
      <article class="panel statue ${done ? "pure" : ""}" style="--tone:var(--${st.tone})">
        <h3><span class="eid">${st.area}</span>${st.name}
          ${done ? `<span class="lvl">purification ${n}</span>` : ""}</h3>
        <p class="text">${st.detail}</p>
        <p class="hint">Stands ${st.where}.</p>
        ${blocked ? `<p class="blocked"><i class="fa-solid fa-lock"></i> ${blocked}</p>` : ""}
        ${bonus && !blocked ? `<p class="bonus">+2 item bonus — a PC touched the glowing head.</p>` : ""}
        <div class="btnrow">
          ${DEG.map(d => `<button type="button" class="deg ${res === d ? "on" : ""} ${d}" data-act="statue" data-k="${key}" data-d="${d}"
            ${ro || blocked ? "disabled" : ""}>${DEG_LABEL[d]}</button>`).join("")}
        </div>
        ${done ? `<p class="bonus">Purified · ${st.xp} XP</p>` : ""}
        ${res && !done ? `<p class="note">${PURIFY.outcomes[res]}</p>` : ""}
      </article>`;
  }

  eventCard(e, ro) {
    const t = this.t;
    const fired = t.purifiedCount >= e.n;
    const asked = t.s.zhi[e.n] ?? 0;
    const budget = e.questions === Infinity ? "unlimited" : `${asked} of ${e.questions}`;
    return `
      <section class="panel event ${fired ? "fired" : "pending"}" style="--tone:var(--${e.tone})">
        <h3><span class="eid">${e.n}</span>${e.title}
          <span class="lvl">${fired ? "fired" : "pending"}</span>
          <button type="button" class="say" data-act="postevent" data-n="${e.n}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="text">${e.text}</p>
        ${e.quote ? `<p class="quote">“${e.quote}”</p>` : ""}
        <p class="note">${e.after}</p>
        ${fired ? `
          <div class="qbox">
            <span class="qlabel">Questions answered</span>
            <button type="button" class="qbtn" data-act="ask" data-n="${e.n}" data-d="-1" ${ro ? "disabled" : ""}>−</button>
            <b>${budget}</b>
            <button type="button" class="qbtn" data-act="ask" data-n="${e.n}" data-d="1"
              ${ro || asked >= e.questions ? "disabled" : ""}>+</button>
          </div>` : ""}
      </section>`;
  }

  /* --------------------------------------------------------------- areas */
  zoneTab(zone, ro) {
    return AREAS.filter(a => a.zone === zone).map(a => this.areaCard(a, ro)).join("");
  }

  areaCard(a, ro) {
    const t = this.t;
    const cleared = !!t.s.cleared[a.key];
    const beats = a.beats ?? [];
    return `
      <section class="panel area ${cleared ? "done" : ""}" style="--tone:var(--${a.tone})">
        <h3><span class="eid">${a.id}</span>${a.name}
          ${a.level ? `<span class="lvl">${a.level}</span>` : ""}
          ${this.jbtn(a.key)}
          <button type="button" class="say" data-act="postarea" data-k="${a.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
          ${a.checks?.length ? `<button type="button" class="say" data-act="postchecks" data-k="${a.key}" title="Post the checks"><i class="fa-solid fa-dice-d20"></i></button>` : ""}
        </h3>
        <p class="boxed">${a.boxed}</p>
        ${a.creatures ? `<p class="crea"><b>Creatures</b> ${a.creatures}</p>` : ""}
        <p class="text">${a.text}</p>
        ${a.creaturesNote ? `<p class="text">${a.creaturesNote}</p>` : ""}
        ${a.quote ? `<p class="quote">“${a.quote}”</p>` : ""}
        ${a.checks?.length ? `<ul class="checks">${a.checks.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
        ${a.note ? `<p class="note">${a.note}</p>` : ""}
        ${a.outcomes?.length ? `<ul class="outcomes">${a.outcomes.map(o => `<li>${o}</li>`).join("")}</ul>` : ""}
        ${a.qa?.length ? `<div class="qa">${a.qa.map(([q, ans]) => `<p><b>${q}</b> “${ans}”</p>`).join("")}</div>` : ""}
        ${a.phases?.length ? `<ol class="phases">${a.phases.map(p => `<li>${p}</li>`).join("")}</ol>` : ""}
        ${a.hazard ? `<p class="loot"><b>Hazard</b> ${a.hazard}</p>` : ""}
        ${a.treasure ? `<p class="loot"><b>Treasure</b> ${a.treasure}</p>` : ""}
        ${a.aside ? `<div class="aside"><b>${a.aside.title}</b><p>${a.aside.text}</p></div>` : ""}
        ${beats.length ? `<div class="sub beats">
          <div class="subhead"><i class="fa-solid fa-circle-check"></i> What can happen here <span>${beats.filter(b => t.beat(a.key, b.key)).length} of ${beats.length}</span></div>
          ${beats.map(b => `
            <label class="check"><input type="checkbox" data-act="beat" data-k="${a.key}" data-b="${b.key}" ${t.beat(a.key, b.key) ? "checked" : ""} ${ro ? "disabled" : ""}>
              ${b.label}${b.xp ? ` <span class="tag">${b.xp} XP</span>` : ""}${b.hope ? ` <span class="tag">${b.hope} Hope</span>` : ""}</label>
            ${b.note ? `<p class="beatnote">${b.note}</p>` : ""}`).join("")}
        </div>` : ""}
        ${a.statue ? `<p class="hint"><i class="fa-solid fa-gopuram"></i> Holds the ${STATUES[a.statue].name} statue — one of the four.</p>` : ""}
        <div class="btnrow">
          <button type="button" class="${cleared ? "ghost" : "primary"}" data-act="cleared" data-k="${a.key}" ${ro ? "disabled" : ""}>
            ${cleared ? "Reopen the area" : "Mark area cleared"}
          </button>
        </div>
      </section>`;
  }

  /* ----------------------------------------------------------- aftermath */
  afterTab(ro) {
    const t = this.t, l = t.s.ledger;
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3>Concluding the act
          ${this.jbtn(JPAGE.concluding)}
          <button type="button" class="say" data-act="postconc" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="boxed">${CONCLUSION.boxed}</p>
        <p class="text">${CONCLUSION.text}</p>
        <ul class="checks">${CONCLUSION.reveals.map(r => `<li>${r}</li>`).join("")}</ul>
      </section>

      <section class="panel" style="--tone:var(--gold)">
        <h3>Return to Willowshore <small>fame, and what they choose to say</small></h3>
        <p class="text">Ending the Kugaptee threat earns 2 Reputation Points with both factions. The townsfolk want the story — but learning the town isn't cursed, only trapped, and that there's no solution yet, may confuse or distress them.</p>

        <label class="check big"><input type="checkbox" data-act="secret" ${l.secret ? "checked" : ""} ${ro ? "disabled" : ""}>
          Kept it secret <span class="tag warn">−4 Hope · −4 Reputation with each faction</span></label>

        <div class="telling ${l.secret ? "off" : ""}">
          <p class="hint">Otherwise one PC either Lies (DC 22 Deception) or tells the truth (DC 22 Diplomacy); the others can Aid.</p>
          <div class="btnrow">
            ${DEG.map(d => `<button type="button" class="deg ${l.told === d ? "on" : ""} ${d}" data-act="tell" data-d="${d}"
              ${ro || l.secret ? "disabled" : ""}>${TELLING[d].label} · ${TELLING[d].hope > 0 ? "+" : ""}${TELLING[d].hope} Hope</button>`).join("")}
          </div>
        </div>
      </section>

      <section class="panel ledger" style="--tone:var(--moss)">
        <h3>Ledger <small>banked for the rest of fall</small></h3>
        <div class="lrow">
          <div class="lcell"><span>Hope</span><b class="${l.hope < 0 ? "neg" : ""}">${l.hope > 0 ? "+" : ""}${l.hope}</b></div>
          <div class="lcell"><span>Reputation each</span><b class="${l.rep < 0 ? "neg" : ""}">${l.rep > 0 ? "+" : ""}${l.rep}</b></div>
          <button type="button" class="primary" data-act="push" ${ro ? "disabled" : ""}>
            <i class="fa-solid fa-right-to-bracket"></i> Send to the downtime tracker
          </button>
        </div>
        ${l.pushed ? `<p class="hint">Already sent once — sending again adds it a second time.</p>` : ""}
      </section>

      <section class="panel">
        <h3>Housekeeping</h3>
        <ul class="checks">${HOUSEKEEPING.map(h => `<li>${h}</li>`).join("")}</ul>
        <p class="text">${CONCLUSION.next}</p>
      </section>`;
  }

  /* ---------------------------------------------------------- listeners */
  wire(root) {
    if (!root || root.dataset?.rwWired === "1") return;
    if (root.dataset) root.dataset.rwWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act;
      if (a === "tab") { t.s.tab = btn.dataset.k; t.touch(); }
      else if (a === "journal") openJournal(btn.dataset.r || null);
      else if (a === "statue") t.setStatue(btn.dataset.k, btn.dataset.d);
      else if (a === "ask") t.askQuestion(Number(btn.dataset.n), Number(btn.dataset.d));
      else if (a === "cleared") t.toggleCleared(btn.dataset.k);
      else if (a === "tell") t.setTelling(btn.dataset.d);
      else if (a === "push") t.pushToDowntime();
      else if (a === "postarea") t.postArea(btn.dataset.k);
      else if (a === "postchecks") t.postChecks(btn.dataset.k);
      else if (a === "postpurify") t.postPurify();
      else if (a === "postevent") t.postEvent(Number(btn.dataset.n));
      else if (a === "postarrival") t.postArrival();
      else if (a === "postconc") t.postConclusion();
      else if (a === "poststatus") t.postStatus();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "beat") t.toggleBeat(el.dataset.k, el.dataset.b);
      else if (el.dataset.act === "secret") t.toggleSecret();
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #rw-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #rw-console .window-content > * { background:transparent; }
      .rw { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .rw * { box-sizing:border-box; }
      .rw button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
      .rw button:hover:not(:disabled) { background:var(--hover); }
      .rw button:disabled { opacity:.45; cursor:not-allowed; }
      .rw input[type="checkbox"] { accent-color:var(--ember); }
      /* Two levels of heading that must not compete: a panel is titled in
         large ink over a thick rule in its own tone, a block inside it wears
         a small filled bar. Outer reads first, inner sorts what's under it. */
      .rw h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.04em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:2px solid var(--tone, var(--line));
               padding-bottom:.3rem; flex-wrap:wrap; }
      .rw h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .rw h1, .rw h2, .rw h4, .rw legend { color:var(--ink); }
      .rw .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .rw .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .rw .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .rw .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 5px; letter-spacing:.06em; }
      .rw .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .rw .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .rw .say + .say { margin-left:.25rem; }
      .rw .boxed { font-size:.82rem; line-height:1.5; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; }
      .rw .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .rw .quote { font-size:.82rem; line-height:1.5; margin:.3rem 0 .45rem; padding-left:.55rem;
                   border-left:2px solid var(--tone, var(--line)); font-style:italic; color:var(--ink); }
      .rw .note { font-size:.78rem; line-height:1.45; color:var(--muted); font-style:italic; margin:.2rem 0 .4rem; }
      .rw .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .rw .crea { font-size:.76rem; margin:.1rem 0 .35rem; color:var(--muted); }
      .rw .crea b { color:var(--tone, var(--ink)); }
      .rw .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .rw .req { font-size:.76rem; margin:.1rem 0 .35rem; }
      .rw .dcs { font-size:.8rem; font-weight:600; margin:.2rem 0 .4rem; color:var(--gold); }
      .rw .checks { margin:0 0 .45rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; color:var(--muted); }
      .rw .checks li { margin-bottom:.25rem; }
      .rw .outcomes { margin:.2rem 0 .3rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; }
      .rw .outcomes li { margin-bottom:.25rem; }
      .rw .outcomes b { color:var(--tone, var(--ink)); }
      .rw .phases { margin:.2rem 0 .3rem; padding-left:1.2rem; font-size:.79rem; line-height:1.5; }
      .rw .phases li { margin-bottom:.3rem; }
      .rw .qa { font-size:.78rem; line-height:1.45; margin:.2rem 0 .4rem; }
      .rw .qa p { margin:.2rem 0; }
      .rw .qa b { display:block; color:var(--tone, var(--ink)); }
      .rw .aside { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0;
                   background:var(--stripe); font-size:.78rem; line-height:1.45; }
      .rw .aside b { display:block; text-transform:uppercase; letter-spacing:.07em; font-size:.68rem;
                     font-weight:700; color:var(--slate); margin-bottom:.25rem; }
      .rw .aside p { margin:0; }
      .rw .check { display:block; font-size:.8rem; margin-bottom:.25rem; line-height:1.4; }
      .rw .check.big { font-size:.84rem; margin:.4rem 0; }
      .rw .tag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--moss); color:var(--moss); margin-left:.25rem; }
      .rw .tag.warn { border-color:var(--rust); color:var(--rust); }
      .rw .beatnote { font-size:.75rem; line-height:1.45; color:var(--muted); margin:.1rem 0 .4rem 1.35rem;
                      padding-left:.5rem; border-left:1px solid var(--line); }

      /* A block inside a panel: a tinted well headed by a filled bar in its
         own accent. On parchment a tinted label reads as decoration; a solid
         one reads as a heading, which is the point of it. */
      .rw .sub { --sub:var(--line); background:var(--stripe); border:1px solid var(--sub);
                 border-radius:4px; overflow:hidden; padding:.4rem .5rem .45rem; margin:.5rem 0; }
      .rw .sub.beats { --sub:var(--moss); }
      .rw .subhead { font-size:.66rem; text-transform:uppercase; letter-spacing:.1em; font-weight:700;
                     display:flex; align-items:center; gap:.4rem;
                     background:var(--sub, var(--muted)); color:var(--paper);
                     margin:-.4rem -.5rem .45rem; padding:.28rem .5rem; border-radius:2px 2px 0 0; }
      .rw .subhead i { color:var(--paper); opacity:.8; font-size:.72rem; }
      .rw .subhead span { margin-left:auto; font-weight:600; color:var(--paper); letter-spacing:.06em;
                          border-radius:8px; padding:0 7px; background:rgba(0,0,0,.22); }

      /* A link into the module's journal. */
      .rw .jbtn { font-size:.62rem; padding:1px 5px; border-radius:3px; color:var(--slate);
                  border-color:var(--line); flex:none; letter-spacing:.04em; }
      .rw .jbtn i { font-size:.66rem; }
      .rw .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; }
      .rw .primary { background:var(--tone, var(--ember)); border-color:var(--tone, var(--ember));
                     color:var(--paper); font-weight:600; padding:.3rem .7rem; font-size:.76rem; }
      .rw .primary:hover:not(:disabled) { filter:brightness(1.1); background:var(--tone, var(--ember)); }
      .rw .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .rw .deg { padding:.3rem .6rem; font-size:.74rem; flex:1; }
      .rw .deg.on.cs { background:var(--moss); border-color:var(--moss); color:var(--paper); font-weight:600; }
      .rw .deg.on.s { background:var(--slate); border-color:var(--slate); color:var(--paper); font-weight:600; }
      .rw .deg.on.f { background:var(--ember); border-color:var(--ember); color:var(--paper); font-weight:600; }
      .rw .deg.on.cf { background:var(--rust); border-color:var(--rust); color:var(--paper); font-weight:600; }
      .rw .blocked { font-size:.76rem; color:var(--rust); margin:.2rem 0 .4rem; }
      .rw .bonus { font-size:.76rem; font-weight:600; color:var(--moss); margin:.3rem 0 0; }

      .rw .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .rw .lamps { display:flex; align-items:center; gap:.35rem; }
      .rw .lamp { width:12px; height:12px; border-radius:50%; border:1px solid var(--line); display:block; }
      .rw .lamp.lit { background:var(--gold); border-color:var(--gold); box-shadow:0 0 6px var(--gold); }
      .rw .lampcount { font-size:.72rem; color:var(--muted); margin-left:.25rem; }
      .rw .flags { display:flex; gap:.3rem; }
      .rw .flag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:2px 7px;
                  border-radius:10px; border:1px solid var(--line); color:var(--muted); }
      .rw .flag.on { border-color:var(--moss); color:var(--moss); font-weight:700; }
      .rw .xp { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; }
      .rw .xp span { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .rw .xp b { font-size:1rem; line-height:1; }

      .rw .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .rw .tab { flex:1; padding:.3rem .2rem; font-size:.76rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .rw .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .rw .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .rw .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .rw .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .rw .tab.on b i, .rw .tab.on small { color:var(--paper); opacity:.85; }

      .rw .grid > * { align-self:start; }

      .rw .grid { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-bottom:.6rem; }
      .rw .statue.pure { box-shadow:inset 0 0 0 1px var(--gold); }
      .rw .area.done h3 .eid { opacity:.6; }
      .rw .event.pending { opacity:.72; }
      .rw .qbox { display:flex; align-items:center; gap:.4rem; border-top:1px solid var(--line);
                  padding-top:.4rem; margin-top:.4rem; }
      .rw .qlabel { font-size:.68rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .rw .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }

      .rw .telling.off { opacity:.45; }
      .rw .ledger .lrow { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
      .rw .lcell { display:flex; flex-direction:column; }
      .rw .lcell span { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .rw .lcell b { font-size:1.1rem; line-height:1.1; color:var(--moss); }
      .rw .lcell b.neg { color:var(--rust); }
      .rw .ledger .primary { margin-left:auto; }

      @media (max-width:800px) {
        .rw .grid { grid-template-columns:1fr; }
        .rw .tabs { flex-wrap:wrap; }
        .rw .ledger .primary { margin-left:0; }
      }
    </style>`;
  }
}

if (AppV2) {
  RWApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSettings();
  let state = game.settings.get(RW_NS, RW_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(RW_NS, RW_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const monastery = new Monastery(state);
  const app = new RWApp(monastery);

  if (!globalThis.__rwHook) {
    globalThis.__rwHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== RW_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { monastery.state = fresh; monastery.render(); }
    });
  }
  app.render(true);
})();
