/* ============================================================================
   SEASON OF GHOSTS — Campaign Status Tracker
   All four acts, thirteen chapters · Foundry VTT v11 / v12 / v13 · PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   A checklist for the whole Adventure Path. Each chapter carries the decisions
   and items that outlive it; anything with a downstream payoff also appears on
   the Threads tab, which turns red once the party reaches the chapter that
   needs it. Reads the four chapter consoles' saved state for a live rollup.

   Defaults match the campaign notes as of 2026-08-04: Act 2, Chapter 5, week 3.
   ============================================================================ */

const CS_NS = "world";
const CS_KEY = "sogCampaign";
const CS_ID = `${CS_NS}.${CS_KEY}`;
const MAX_PCS = 4;

/* The chapter consoles, read for the rollup strip. Never written to. */
const CONSOLES = {
  downtime: "world.sogFallDowntime",
  festival: "world.sogFirstLongNight",
  path: "world.sogEnlightenedPath",
  ruins: "world.sogRuinsOfWisdom"
};

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

/* ------------------------------------------------------------------- acts */
const ACTS = {
  1: { name: "The Summer That Never Was", season: "Summer", tone: "ember" },
  2: { name: "Let the Leaves Fall", season: "Fall", tone: "rust" },
  3: { name: "No Breath to Cry", season: "Winter", tone: "slate" },
  4: { name: "To Bloom Below the Web", season: "Spring", tone: "moss" }
};

const STATUS = {
  todo: { label: "Not started", tone: "muted" },
  active: { label: "Running", tone: "ember" },
  done: { label: "Done", tone: "moss" }
};
const STATUS_ORDER = ["todo", "active", "done"];

/* --------------------------------------------------------------- chapters
   `pays` names where an item comes back; `at` is the chapter that needs it,
   which is what makes the Threads tab able to warn. `hard` marks the ones the
   next chapter genuinely cannot proceed without. */
const CHAPTERS = [
  { n: 1, act: 1, title: "To Light the Night", level: 1, console: null,
    spine: "The party wakes in the woods after the festival to a monster-held Willowshore. Ends with Gurglegut dead and the Eternal Lantern relit.",
    note: "No deep guide and no source text — the vault page is reconstructed from downstream references.",
    items: [
      { key: "lantern", label: "Eternal Lantern relit — Gurglegut dead", pays: "Level 2 milestone" },
      { key: "abacus", label: "Abacus Sisters (Midori, Murasaki) survived", pays: "Ch 4 · E13", at: 4 },
      { key: "sumika", label: "Sumika of Silvermist rescued", pays: "Ch 3 · Silvermist consult", at: 3 },
      { key: "kappas", label: "Kappas met kindly", pays: "Ch 2 bathhouse · Ch 3 Missing Boats · Ch 6 Enko", at: 2 },
      { key: "elders", label: "Granny Hu and Old Matsuki met" },
      { key: "returning", label: "Returning Home encounter run (a PC lived downtown)" }
    ] },

  { n: 2, act: 1, title: "Reclaiming Willowshore", level: 1, console: null,
    spine: "Urban clearance downtown, ending with Gray Butcher and Mo Douqiu dead. Runs on Reputation only — but nearly every room swings Northridge or Southbank.",
    items: [
      { key: "butcher", label: "Gray Butcher dead — the roaming pacing valve" },
      { key: "douqiu", label: "Mo Douqiu dead (he monologues first; rolls Society for initiative)" },
      { key: "prison", label: "B4 — Zheng Peng and 10 guards freed" },
      { key: "will", label: "The Last Will and Testament of Qing Mai-Lai found in C1", hard: true,
        pays: "Ch 3 teahouse chain → Ch 5 Hope engine", at: 3 },
      { key: "elope", label: "The Yuli / Lelong elopement resolved", pays: "Ch 3 · Nadoya's attitude", at: 3,
        note: "Helping them run costs Southbank Rep and turns Nadoya unfriendly." }
    ] },

  { n: 3, act: 1, title: "The Willowshore Curse", level: 2, console: null,
    spine: "The sandbox chapter. Three investigations plus an Opportunities menu fill the summer, ending with the leadership duel.",
    items: [
      { key: "governor", label: "Missing Governor thread closed at Canary Inn", note: "A dead end by design — say so through fiction." },
      { key: "xungu", label: "Xungu killed at the Infested Grove (D7)", hard: true, pays: "gates the Great Willow" },
      { key: "willow", label: "Great Willow made friendly", pays: "Ch 5 research · Ch 9 expert consult", at: 5 },
      { key: "teahouse", label: "Cerulean Teahouse claimed (two pearls from the Eyes of Fumeiyoshi)",
        pays: "Ch 5 restoration and Host Ceremony", at: 5 },
      { key: "teafarm", label: "Tea Farm Infestation cleared" },
      { key: "expansion", label: "Investigate the Old Expansion — 8 VP", pays: "Act 2 food", at: 5 },
      { key: "duel", label: "Leadership duel resolved — a leader named", pays: "Level 3 milestone" },
      { key: "peachwood", label: "Peachwood grove intact", danger: true,
        note: "A critical failure while Collecting Peachwood kills a grove for the whole campaign." },
      { key: "cloak", label: "Hongrui's gratitude earned before claiming the red cloak", danger: true,
        note: "Claimed without it, the cloak swells to 5 Bulk and fuses to the wearer after a minute." },
      { key: "shinzo", label: "Shinzo's order system established", pays: "Act 3, when he is the only shop left", at: 8 },
      { key: "lesson1", label: "Unfinished Lesson seed 1 — Zhi Hui's name at the Great Willow", pays: "Ch 7 · Lotus", at: 7 }
    ] },

  { n: 4, act: 1, title: "The Wall of Ghosts", level: 3, console: null,
    spine: "The act's dungeon. Two noppera-bo factions in the lumber camp, then the Ritual Site and the first look at Kugaptee's reach.",
    items: [
      { key: "ledger", label: "Zoudou's ledger recovered", hard: true, danger: true,
        pays: "Ch 6 · teaches Consecrate, opens the Wall", at: 6,
        note: "Aklo and Chthonian. Do not let this walk out of the session in a corpse pile." },
      { key: "advance", label: "Advance Knowledge used before the assault",
        note: "Success is a map; a critical success drops the E6 secret door from DC 18 to DC 8." },
      { key: "bargain", label: "A faction bargain struck (E14 occultists or Mugirou)",
        note: "The two cancel each other. E14 pays a pendant of the occult; Mugirou frees the prisoners." },
      { key: "gift", label: "Shinzo's gift fork answered — cape of justice or noppera-bo hood" },
      { key: "effigy", label: "The Three Faces effigy solved (E14)" },
      { key: "irondoor", label: "The E11→E12 iron door opened (Thievery DC 20, three successes)" },
      { key: "intime", label: "Reached the Ritual Site in time — 3 blessings rather than 4" },
      { key: "mengsung", label: "Meng-sung saved" },
      { key: "pledge", label: "A PC took Zoudou's soul-pledge", danger: true,
        pays: "Atone, or a rescue in Act 4", at: 11,
        note: "Cuts that PC's soul from the cycle — if they die they cannot be raised. Make sure the player understood before they said the words." },
      { key: "abductees", label: "Abductees returned — +3 Rep with both factions" }
    ] },

  { n: 5, act: 2, title: "Turning of the Seasons", level: 4, console: "downtime",
    spine: "Twelve weeks of downtime building Hope, Food, and Security while researching the ritual that opens the Wall. Ends with the first vanishing.",
    note: "Every supernatural event is caused by Mago Kai's exorcists 115 years away — not by Kugaptee. The book says don't correct the party.",
    items: [
      { key: "research", label: "10 Research Points banked", hard: true, pays: "Ch 6 gate, with 5th level", at: 6,
        note: "No single source reaches 10. Show the players the caps or they'll grind one and stall." },
      { key: "restored", label: "Teahouse restored — 5 Restoration Points", hard: true,
        pays: "Host Ceremony · the week 10 Feast of the Kami", at: 5 },
      { key: "food", label: "Food at 12" },
      { key: "security", label: "Security at 12" },
      { key: "yami", label: "Yami bonded", note: "Also the culprit in week 5 — handle her carefully or she leaves town." },
      { key: "festival", label: "Week 3 — First Long Night resolved" },
      { key: "feast", label: "Week 10 — Feast of the Kami held (needs the restored teahouse)" },
      { key: "curse", label: "Week 11 — a random PC cursed", danger: true,
        note: "DC 19 Will or a permanent −1 to fear saves and stupefied 1 whenever they hit 0 HP. Roll randomly, as written." },
      { key: "vanishing", label: "Week 12 — the vanishing, ending the act",
        note: "Someone the party likes, but nobody load-bearing for Acts 3–4." },
      { key: "lesson2", label: "Unfinished Lesson seed 2 — Zhi Hui named in Solo Investigation", pays: "Ch 7 · Lotus", at: 7 }
    ] },

  { n: 6, act: 2, title: "The Enlightened Path", level: 5, console: "path",
    spine: "Into the Wall for Kugaptee's dream, then four days along the Pilgrim's Path and its three shrines.",
    items: [
      { key: "seed", label: "The soul seed planted — the road opens permanently" },
      { key: "bridge", label: "Bridge Shrine enlightenment — +1 Reflex", note: "Win the fight, then sleep there." },
      { key: "garden", label: "Garden Shrine enlightenment — +1 Will", note: "Six lanterns lit, then sleep there." },
      { key: "mountain", label: "Mountain Shrine enlightenment — +1 Fortitude", note: "Iogaka dead, bathe in the lake, then sleep." },
      { key: "iogaka", label: "Iogaka killed rather than dispelled", pays: "Ch 7 · statue three ends the storm for free", at: 7,
        note: "Purifying the third statue makes her vanish, robbing the fight of its payoff. Better they fight her." },
      { key: "enko", label: "Enko escorted to Mirror Lake", note: "He surfaces with a +1 striking silver shortsword, a wand of environmental endurance, and a minor sturdy shield." },
      { key: "bracelet", label: "Yeri's Bracelet carried out of the chapter", hard: true,
        pays: "Ch 7 · E2 — ends Yuni's ghost without a fight", at: 7 },
      { key: "gifts", label: "All three shrines reached — Pilgrimage Gifts at the crest", at: 7 },
      { key: "lesson3", label: "Unfinished Lesson seed 3 — the Path is Zhi Hui's own design", pays: "Ch 7 · Lotus", at: 7 }
    ] },

  { n: 7, act: 2, title: "In the Ruins of Wisdom", level: 6, console: "ruins",
    spine: "The Tan Sugi monastery, gated by four statue purifications. Ends with Xin Yue in the grave and the mindscape revealed.",
    items: [
      { key: "statues", label: "All four statues purified — the wall of force drops" },
      { key: "yenrui", label: "Yen Rui's hidden library (E11) found and talked to", hard: true,
        pays: "Watchers of the Cycle — how Act 3 gets researched", at: 8,
        note: "Also the chapter's safe camp. Purify two statues, then push them at E10's secret door." },
      { key: "watchers", label: "Watchers of the Cycle taken — reincarnate and the lore collection", hard: true,
        pays: "Ch 8–9 research DCs", at: 8 },
      { key: "head", label: "Pharasma's head recovered from the Tan Sugi (E13)", pays: "E5 purification", at: 7 },
      { key: "tea", label: "E6 refectory settled with a tea ceremony rather than a fight",
        note: "A critical success also reveals where Pharasma's head went. Re Tang's chapter." },
      { key: "yuni", label: "Yuni laid to rest with Yeri's bracelet (E2)" },
      { key: "xinyue", label: "Xin Yue defeated — both phases" },
      { key: "truth", label: "The truth told to Willowshore", danger: true,
        note: "Silence costs 4 Hope and 4 Rep with both factions. Make sure they know that before choosing it." },
      { key: "lesson", label: "Lotus's question asked of Zhi Hui", note: "Save it for the third or fourth purification, when she can stay long enough to answer." }
    ] },

  { n: 8, act: 3, title: "Oblivion of Truth", level: 7, console: null,
    spine: "Winter day one. Three fights ten minutes apart, research toward Mindscape Shift, and Heh Shan-Bao's softened-death mindscape.",
    note: "The winter clock starts: −1d4 Hope, −1 Food, −1 Security every week. Willowshore starts at 225 people — track the number.",
    items: [
      { key: "clock", label: "Weekly attrition clock started, population being tracked" },
      { key: "rescue", label: "All three saved in the Structural Collapse — +3 Hope, +1 Rep both, 120 XP" },
      { key: "jelly", label: "Mr Jelly recovered intact — boots of bounding" },
      { key: "mill", label: "The mill saved", note: "Losing it costs 1 Security, then 4 Security and 2 weeks to rebuild." },
      { key: "shift", label: "8 RP banked — Mindscape Shift unlocked", hard: true,
        note: "The Solo cap alone finishes it. Much lighter than Act 2's gate — don't drag it out." },
      { key: "talked", label: "Heh Shan-Bao talked to rather than killed",
        pays: "Ch 9 · Shinzo holds a killing against them", at: 9 },
      { key: "journal", label: "The transmigration journal recovered", hard: true,
        pays: "Ch 9 research and the resurrect formula", at: 9 },
      { key: "jorogumo", label: "His warning heard — a jorogumo will be drawn to the grave", pays: "Act 4", at: 11 }
    ] },

  { n: 9, act: 3, title: "Face-to-Face with Death", level: 8, console: null, rework: true,
    spine: "Seventy-two in-game days, the longest chapter in the AP. Shinzo's answers, the winter events, and the ritual that kills the party on purpose.",
    items: [
      { key: "answers", label: "Event 4 — Shinzo's Answers run as questions, not a monologue",
        note: "He's a shinigami; 115 loops; jorogumo rule Shenmen. Four heroic-legacy items, 120 XP." },
      { key: "told", label: "The town told the two truths — they're dead, and Heh caused it",
        note: "Hiding either costs 2 Rep with both factions per truth when it leaks." },
      { key: "faceless", label: "Event 5 — all four impersonators killed before prank five", danger: true,
        note: "At prank five they escalate to murder: 3 Rep with both factions and 1 population each." },
      { key: "chen", label: "Seance — Cao Chen pushed to Influence 4", hard: true,
        pays: "Ch 10 · C11 — he stays the shrine maiden's attack", at: 10,
        note: "The single best thing they can do to make Chapter 10 easier." },
      { key: "fenfang", label: "Seance — Pan Fenfang revealed as nindoru-corrupted", pays: "Ch 10 · C14", at: 10 },
      { key: "guanghao", label: "Seance — Sha Guanghao blurts out the bell ringer", pays: "Ch 10 · C13", at: 10 },
      { key: "renmeili", label: "Interview with a Spider — Influence 12 or better", hard: true,
        pays: "Silver collars — legal passes for Act 4", at: 11,
        note: "Below 6 she attacks, and Parting Ways is Extreme 9 against a level 13 creature." },
      { key: "seed1", label: "Rework seed 1 — an exorcist mutters about a woman in crimson silks", rework: true,
        pays: "Ch 11 · the Silkwasp camp", at: 11 },
      { key: "seed2", label: "Rework seed 2 — Ren Mei Li's \"owed a quarrel\" warning", rework: true,
        pays: "Ch 11 roses · Ch 12 alliance", at: 11 },
      { key: "transres", label: "8 RP — Transmigration research complete", hard: true },
      { key: "kiln", label: "Component — the kiln", note: "Free if the party supported Eternal Blaze Ironworks in Act 1." },
      { key: "feathers", label: "Component — heron feathers", note: "Free from Silvermist Lodge or Nine Ear Shrine." },
      { key: "slats", label: "Component — sakaki slats soaking", danger: true,
        note: "Six weeks, unshortenable, and it sets day 44. Start them the moment research hits 4 RP." },
      { key: "emotions", label: "Each player stated their character's strongest driving emotion at the kiln",
        pays: "Ch 10 · their ghost powers", at: 10 },
      { key: "between", label: "Between Life and Death survived — at least one PC stepped through" }
    ] },

  { n: 10, act: 3, title: "This Place Is Ours", level: 9, console: null,
    spine: "The party arrives in the real world 115 years later as phantoms on a one-month timer. For once, they are the ghost story.",
    note: "Foundry: the Terror in Karahai macro handles token positioning by terror level. Learn it before session.",
    items: [
      { key: "teach", label: "The Terror mechanic taught in the first ten minutes", danger: true,
        note: "If they don't grasp that terror is their primary weapon, this chapter kills them." },
      { key: "sweet", label: "Terror kept in the 3–5 band", note: "Terror 7 puts nine mercenaries in one room and locks every gate." },
      { key: "shrine", label: "C11 shrine resolved — Cao Chen defused it, or it was fought" },
      { key: "ringer", label: "The warding bell ringer recovered", hard: true, pays: "the Eternal Lantern", at: 10 },
      { key: "relit", label: "The Lantern relit in the ruins — the receptacle lights itself" },
      { key: "peace", label: "A negotiated end with Mago Kai",
        note: "If they take it, Shinzo tops their gear to 10th-level expectations so Act 4 isn't broken by their mercy." },
      { key: "bell", label: "The warding bell spared", pays: "Ch 11 · gifted back as a +2 shrine boon", at: 11 },
      { key: "uglycute", label: "Ugly Cute's remains found on the road out", note: "Mago Kai killed them. Don't comment on it." },
      { key: "transmigrate", label: "5th-rank Transmigrate cast from inside the mindscape (day 72)", hard: true,
        pays: "Ch 11 · Willowshore's fate", at: 11 },
      { key: "cashout", label: "Preparation Points counted at the casting", hard: true,
        pays: "Ch 11 · who comes back", at: 11,
        note: "Hope + Food + Security when the ritual fires. Tell the party before they dawdle." }
    ] },

  { n: 11, act: 4, title: "Willowshore's Return", level: 10, console: null, rework: true,
    spine: "Spring. The town returns in proportion to three acts of arithmetic, the manor is cleared, and a woman in red starts counting souls.",
    items: [
      { key: "fate", label: "Willowshore's Fate rolled up before session", danger: true,
        note: "Hope + Food + Security, +12 if the casting crit, +4 if population was 100+. Open with the description, not the math." },
      { key: "ancestry", label: "The ancestry swap offered a session in advance", note: "One-time offer at level 10 — it deserves thought, not a scramble." },
      { key: "pass", label: "Authorization pass obtained before entering the manor", note: "Without it every manor hazard DC is +2." },
      { key: "false", label: "The False Governor killed (A8)", hard: true,
        note: "The undead in A3 and A5 rejuvenate until it dies. The tell: it has never met the party and remembers nothing from Act 3." },
      { key: "bridge", label: "Karahai Bridge rebuilt", note: "A critical success finishes it in a month — before Chapter 12. 120 XP." },
      { key: "herald", label: "Hong Meigui re-flagged as the Weaver's herald", rework: true },
      { key: "clues", label: "The three Silkwasp clues planted — letters, roses, the count", rework: true,
        pays: "Ch 12–13 · the Weaver", at: 12 },
      { key: "roses", label: "The crimson roses destroyed (DC 22 Occultism)", rework: true,
        note: "They're scrying anchors. Destroying them blinds someone's distant eyes." },
      { key: "lokuon", label: "Lo Kuon freed from the Inveigle", note: "Only a freed Lo Kuon knows to tell them about mirrors and glutinous rice." },
      { key: "farewell", label: "Shinzo's farewell — last chance to shop" }
    ] },

  { n: 12, act: 4, title: "The Princess's Web", level: 11, console: null, rework: true,
    spine: "Ren Mei Li's five trials in one hand, Heh Shan-Bao's murders in the other. The prize is the Fang and Key.",
    note: "The heaviest rework chapter — structure unchanged, meaning transformed. The treasures are sealing anchors, and she says so.",
    items: [
      { key: "alliance", label: "The alliance reveal run — her cousin, and why she needs mortal hands", rework: true },
      { key: "collars", label: "Silver collars displayed — indifferent to friendly instantly" },
      { key: "spring", label: "Spring rite — Bright Spring Bird · anchor of Renewal" },
      { key: "summer", label: "Summer rite — Fiery Flowers · anchor of Vigor" },
      { key: "autumn", label: "Autumn rite — Sweet Fruits · anchor of Harvest" },
      { key: "winter", label: "Winter rite — Spiced Tea · anchor of Endurance", danger: true,
        note: "Severe 11 if it turns violent, and the rework adds +2 to the social DCs. Re Tang's chapter — push toward the ceremony." },
      { key: "beyond", label: "Beyond rite — Gossamer Path · anchor of Passage",
        note: "Arrive via the sash or it's DC 34 Diplomacy to stay the path maiden's attack." },
      { key: "witness", label: "The red-clad witness planted at Elizeth's murder", rework: true },
      { key: "tokens", label: "All three victims' tokens kept", hard: true,
        pays: "Ch 13 · +3 to free each soul", at: 13 },
      { key: "prevented", label: "Any murders prevented — 80 XP each", pays: "Ch 13 · that soul is freed automatically", at: 13 },
      { key: "fang", label: "The Fang and Key claimed", hard: true, pays: "Level 12 · the only thing that opens the domain", at: 13 },
      { key: "door", label: "The warning line delivered — \"a door opened once is a door my cousin can follow through\"", rework: true }
    ] },

  { n: 13, act: 4, title: "A Fiend in Two Worlds", level: 12, console: null, rework: true,
    spine: "The restored manor, Kugaptee's Grasp, the four season-rooms, then the governor's fate — and the breach that follows it.",
    note: "Do not run Kugaptee's Final Death as the ending. Beats 1–4 are untouched canon; the breach, the Crimson Weaver, and the Sealing replace the finale.",
    items: [
      { key: "portrait", label: "Freeing-object — Princess Ok Jinju's torn portrait (C2)", note: "Negates R2, the Flesh Tears." },
      { key: "sages", label: "Freeing-object — The Wisdom of the Seven Sages (C4 lion safe)", note: "Negates R3, the Mind Recoils." },
      { key: "letter", label: "Freeing-object — his parents' letter (C4, inside the scroll)", note: "Negates R1, the World Trembles." },
      { key: "camellia", label: "Freeing-object — camellia and gold ribbon (C8, from Ithiniak)", note: "Negates R4, the Final Death." },
      { key: "mantra", label: "The living-rune deactivation mantra found in C4's trapped compartment", pays: "C7c", at: 13 },
      { key: "souls", label: "All three chained souls freed", hard: true,
        note: "Each removes eyes from the altar: none leaves four Extreme 12 shisagishin, all three leaves two Moderate 12." },
      { key: "redeem", label: "Heh Shan-Bao redeemed — Influence 7 or better", rework: true,
        pays: "the Weaver loses her opening shield", at: 13,
        note: "Don't tell the players. Let them find out that mercy was also tactics." },
      { key: "breach", label: "The breach staged after his fate resolves, not before", rework: true },
      { key: "phase1", label: "Phase one — the Crimson Weaver and her loom", rework: true,
        note: "Three anchor-strands, Hardness 10, HP 30. Two or more standing and she has fast healing 10." },
      { key: "phase2", label: "Phase two — the Marrow Wears Her", rework: true,
        note: "Give the table one free round as the corpse rises: 4d8 healing, stand, reload, reposition." },
      { key: "bombs", label: "You So-Jin's silversoul bombs used on the vessel", rework: true,
        note: "Treat it as a nindoru, which is exactly what her formula was built for." },
      { key: "sealing", label: "The Sealing of Five Seasons run — five stations, five rounds", rework: true },
      { key: "ending", label: "The Dusklight Torch — Tan Sui-Jing restores the party and the tree" }
    ] }
];

/* ------------------------------------------------------------ the treasure
   Keyed by chapter rather than folded into CHAPTERS, so the ledger reads as
   one list when you're checking what the party never picked up. Items already
   tracked as chapter decisions (Zoudou's ledger, the Fang and Key) live there
   and aren't repeated here. */
const LOOT = {
  2: [
    { key: "care", label: "Care package — 10 minor healing potions, 8 potency crystals", where: "The favored elder, before downtown" }
  ],
  3: [
    { key: "cloak", label: "Hongrui's red cloak", where: "Canary Inn D4", note: "Cursed unless her gratitude was earned first." },
    { key: "pearls", label: "Two pearls", where: "Eyes of Fumeiyoshi D9", note: "They claim the Cerulean Teahouse." },
    { key: "peachwood", label: "Peachwood", where: "Collecting Peachwood", note: "A critical failure kills the grove for the campaign." }
  ],
  4: [
    { key: "pendant", label: "Pendant of the occult", where: "E14 — the occultists' bargain" },
    { key: "gift", label: "Cape of justice, or the noppera-bo hood", where: "Shinzo's gift", note: "Whichever his question chose." },
    { key: "iron", label: "Invisibility potion and a 100 gp silver ingot", where: "Behind the E11→E12 iron door" }
  ],
  5: [
    { key: "yami", label: "Yami's weekly gift", where: "DC 11 flat at the end of each week" },
    { key: "shinzo", label: "Shinzo at 10% off", where: "During the First Long Night, week 3" }
  ],
  6: [
    { key: "enko", label: "+1 striking silver shortsword, wand of environmental endurance, minor sturdy shield", where: "Enko surfaces with them at Mirror Lake" },
    { key: "charges", label: "Six moderate ghost charges", where: "Bridge Shrine — fill the clay vials from the dippers" },
    { key: "orchids", label: "Six doses of lesser healing vapor", where: "Garden Shrine — the blue orchids in the oak's roots" },
    { key: "soap", label: "Four bars of invigorating soap", where: "The cave at the Mountain Shrine" },
    { key: "thurible", label: "Lesser thurible of revelation", where: "Mountain Shrine platform", note: "Iogaka filled it with mud and dead fish — clean it before use." }
  ],
  7: [
    { key: "fulus", label: "An escape fulu and two stumbling fulus", where: "E1 — the shredded gate" },
    { key: "shield", label: "Spellguard shield", where: "E3 — among the cushions east of the statue" },
    { key: "healer", label: "Two moderate healing potions, expanded healer's tools, healer's gloves", where: "E4 debris" },
    { key: "toolkit", label: "Sterling artisan's toolkit for tea, and 5 doses of poison", where: "E7 kitchen, once the haunt is beaten" },
    { key: "tea", label: "Rare tea worth 150 gp", where: "E8", note: "Using all of it gives +2 to Host Ceremony in E6." },
    { key: "pouch", label: "Type II spacious pouch — 200 gp of stolen art", where: "E8, under the loose floor stone" },
    { key: "ring", label: "Spiritsight ring", where: "E9 — under a mattress" },
    { key: "prayers", label: "Book of warding prayers", where: "E10 rubble" },
    { key: "scrolls", label: "Lesser tome of restorative cleansing and six scrolls", where: "E11 — Yen Rui's gifts" },
    { key: "staff", label: "Primeval mistletoe and a verdant staff", where: "E12, after the fungi" },
    { key: "axe", label: "+1 ghost touch striking silver battle axe", where: "E13 trunk", note: "Frightened-1 quirk on every draw until Xin Yue falls." },
    { key: "chest", label: "The treasury chest — emerald grasshopper talisman, +1 chain shirt, wand of clear mind", where: "E15" }
  ],
  8: [
    { key: "boots", label: "Boots of bounding", where: "Mr Jelly recovered intact" },
    { key: "tome", label: "Moderate tome of restorative cleansing", where: "What the transmigration journal becomes" },
    { key: "formula", label: "The resurrect formula", where: "Loose pages in the journal" }
  ],
  9: [
    { key: "legacy", label: "Four heroic-legacy items", where: "Shinzo, at Event 4" },
    { key: "collars", label: "Silver collars", where: "Ren Mei Li at Influence 12", note: "Legal passes to travel, read, and trade in Act 4." },
    { key: "msgring", label: "Messenger's ring", where: "Ren Mei Li at Influence 12" },
    { key: "dust", label: "Dust of corpse animation", where: "Ren Mei Li at Influence 16" }
  ],
  10: [
    { key: "codex", label: "The codex explaining the warding bell", where: "C20 — Mago Kai's quarters" },
    { key: "topup", label: "Shinzo's gear top-up — about 1,500 gp each, up to 3,000", where: "Only on the negotiated peace" }
  ],
  11: [
    { key: "lantern", label: "The Eternal Lantern's skill bonus rises to +2", where: "Automatic at the return" },
    { key: "bell", label: "The warding bell gifted back — +2 to a deity's divine skill", where: "If it was spared in Ch 10", note: "Installed at a different shrine than the lantern's, it's two skills." },
    { key: "farewell", label: "Shinzo's parting gifts — phoenix fulu holder with an anathema fulu, a needle thousand-pains fulu, two greater potency crystals", where: "His farewell" }
  ],
  12: [
    { key: "rites", label: "Rite bonus items — some at 10+ VP, all of them at 14+", where: "Across the five treasures" },
    { key: "bombs", label: "You So-Jin's silversoul bombs and formula", where: "Stolen at her murder", note: "They pay off on the vessel in the finale." }
  ],
  13: [
    { key: "hoard", label: "Hong Zhinü's hoard — the loom's red silk and court regalia at the level-12 allotment", where: "After phase two", note: "The silk becomes silkweave armour or three potent crafting components." },
    { key: "folio", label: "Her research folio on Kugaptee", where: "The hoard", note: "Keep it, burn it, or trade it to Ren Mei Li." }
  ]
};

/* ---------------------------------------------------------------- the cues
   Foundry scenes, playlists, macros, and the table prep that has to happen
   before the session rather than during it. Taken from the campaign notes. */
const CUES = {
  2: [
    { key: "lantern", label: "`Eternal Lantern` loop — the ambient bed for every downtown scene" },
    { key: "bodies", label: "Mark the hanging-body squares before session" }
  ],
  3: [
    { key: "seasons", label: "`Willowshore Seasons` · `Enable Rain`" },
    { key: "rollers", label: "Both encounter rollers armed" },
    { key: "singing", label: "`Singing` loop for the Canary Inn approach" }
  ],
  4: [
    { key: "chant", label: "`Ritual Chanting` loop underneath the approach" },
    { key: "stop", label: "`Stop Chanting` one-shot at the disruption · `Interrupting The Ritual` SFX",
      note: "Cut the chant audio the instant the ritual breaks — the silence is the cue for the rumble beyond the Wall." }
  ],
  5: [
    { key: "consoles", label: "Fall Downtime Tracker and First Long Night Console open" },
    { key: "seasons", label: "`Willowshore Seasons` at the fall transition" },
    { key: "fire", label: "`Barn Fire` (week 8) · `Feast of the Kami` (week 10)" }
  ],
  6: [
    { key: "console", label: "Enlightened Path Console open" },
    { key: "wall", label: "`Open the Wall of Ghosts` · `Reveal Mandragoras` · `Terrifying Roar` · `Arms of the Drowned`" },
    { key: "weather", label: "`Dense Fog` / `Rain` / `Thunderstorm` across days 2–3 · `Lightning Bolt` at the Mountain Shrine" },
    { key: "raft", label: "Mirror Lake raft — map and drift counter ready before session" }
  ],
  7: [
    { key: "console", label: "Ruins of Wisdom Console open" },
    { key: "head", label: "`Return Head` at E5" },
    { key: "season", label: "`Change Season` at the act transition" },
    { key: "trigger", label: "Decide the Zhi Hui healing trigger before session", note: "Say, two PCs below half." }
  ],
  8: [
    { key: "omens", label: "Ill Omens table ready to roll — a couple an hour" },
    { key: "collapse", label: "Structural Collapse — the 6-round recollapse timer where you can see it" }
  ],
  9: [
    { key: "loop", label: "The weekly loop written down: attrition → downtime → event → DC 16 flat for Unexpected Troubles" },
    { key: "d44", label: "Day 44 — the sakaki slats come out" },
    { key: "d71", label: "Day 71 — Interview with a Spider" }
  ],
  10: [
    { key: "terror", label: "`Terror in Karahai` macro learned before session",
      note: "Terror level, night state, retreated groups, cross-scene death sync, reinforcement restoration." },
    { key: "bell", label: "`Warding Bell` · `Pan Fenfang True Form` effect" },
    { key: "wasted", label: "Play the first wasted round — let them learn the walls block incorporeal movement" },
    { key: "season", label: "`Change Season` at the act break" }
  ],
  11: [
    { key: "fate", label: "Willowshore's Fate rolled up before session — open with the description, not the math" },
    { key: "ancestry", label: "Warn the players about the ancestry swap a session ahead" }
  ],
  12: [
    { key: "murders", label: "The three murder scenes staged with their tokens in reach" }
  ],
  13: [
    { key: "freeround", label: "Decide the free-round trigger before the Weaver's second phase" },
    { key: "stations", label: "Five sealing stations mapped before the ritual round" }
  ]
};

/* ------------------------------------------------- the module's own macros
   The Season of Ghosts Foundry module ships a macro directory organised by
   act. These are reminders that the macro exists and where it lives — nothing
   here clicks them for you, because they're run from the directory.

   `chapters` holds the ones whose chapter is certain, either because the
   campaign notes name them or because the macro's name says so. `acts` holds
   the ones that could only be placed to an act; move them into `chapters`
   once you know. `always` is the Submacros folder, useful anywhere. */
const MODULE_MACROS = {
  chapters: {
    1: [{ name: "Light Eternal Lantern", folder: "Act 1" }],
    3: [{ name: "Enable Rain", folder: "Act 1" },
        { name: "Toggle Mindscape Border Visibility", folder: "Act 1", guess: true }],
    4: [{ name: "Stop Chanting", folder: "Act 1" }],
    5: [{ name: "Hinterlands Control", folder: "Act 2", guess: true }],
    6: [{ name: "Open the Wall of Ghosts", folder: "Act 2" },
        { name: "Reveal Mandragora", folder: "Act 2" }],
    7: [{ name: "Return Head", folder: "Act 2" },
        { name: "Change Season", folder: "Submacros" }],
    10: [{ name: "Terror in Karahai", folder: "Act 3" },
         { name: "Warding Bell", folder: "Act 3" },
         { name: "Change Season", folder: "Submacros" },
         { group: "Terror Macros", folder: "Act 3",
           items: ["Terror 1", "Terror 2", "Terror 3", "Terror 4", "Terror 5", "Terror 6",
                   "Terror 7", "Terror 8", "Nighttime", "Reinforcements",
                   "C1 Exorcists fled", "C1 Mercenaries fled", "Mago Kai fled"] }],
    11: [{ name: "Reset Willowshore", folder: "Act 4" },
         { name: "Toggle Governor's Manor", folder: "Act 4" },
         { name: "The Silkwasp Camp Alert Levels", folder: "Act 4" },
         { group: "The Silkwasp Camp Alert Levels", folder: "Act 4",
           items: ["Bandits on the Defensive", "Bridge Bandits Defeated", "Night", "Unexpected Visit"] }],
    12: [{ name: "The Algrievers Emerge", folder: "Act 4" },
         { group: "Algrievers", folder: "Act 4", items: ["Emerge", "Retreat"] }],
    13: [{ name: "Willowshore to Kugaptee's Grave", folder: "Act 4" },
         { name: "Kugaptee's Grave Weather Control", folder: "Act 4" },
         { group: "Kugaptee's Grave Weather Control", folder: "Act 4",
           items: ["Summer", "Winter", "Other"] },
         { name: "Sugi Tree Falls", folder: "Act 4", note: "D2 — the trunk's fall direction" },
         { group: "Sugi Tree Falls", folder: "Act 4",
           items: ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "Reset"] }]
  },
  acts: {
    1: [{ name: "Enable Blood Moon", folder: "Act 1" }],
    3: [{ name: "Open Portal", folder: "Act 3" },
        { name: "Partially Open Portal", folder: "Act 3" }]
  },
  always: [
    { name: "Change Season", folder: "Submacros" },
    { name: "Change Dynamic Ring and Turn Marker", folder: "Submacros" },
    { name: "Landing Picker", folder: "Submacros" },
    { name: "Roof Control", folder: "Submacros" },
    { name: "Toggle Party Platter (4 Characters)", folder: "Submacros" },
    { name: "Toggle Party Platter (6 Characters)", folder: "Submacros" }
  ]
};

/* ------------------------------------------------------ the rework tracker */
const REWORK = {
  pitch: "The book sets jorogumo politics beside the Kugaptee plot. This welds them together: two jorogumo, one patron and one villain, turn the stewardship trials into a sealing ritual and end the campaign with a two-phase boss — so the party fights Kugaptee without breaking the lore that he cannot truly die.",
  weavers: [
    { who: "Ren Mei Li — the Silversilk Princess", role: "Patron · Lv 13 · canon",
      wants: "Kugaptee sealed. She's fortifying a border.",
      tell: "Silver mist, and the dweomercat Amai.", tone: "slate" },
    { who: "Hong Zhinü — the Crimson Weaver", role: "Villain · Lv 13–14 · new",
      wants: "Kugaptee harvested — his marrow drawn like silk.",
      tell: "Rose over rot, the same smell that clung to Hong Meigui. Her shadow has too many joints.", tone: "rust" }
  ],
  caution: "She is not good. She's a predator whose interests currently align with Willowshore's survival. Don't sand off the fealty tension.",
  checklist: [
    { key: "r1", ch: 9, label: "Seance — one exorcist mentions a woman in crimson silks", optional: true },
    { key: "r2", ch: 9, label: "Interview — Ren Mei Li's \"owed a quarrel\" warning", optional: true },
    { key: "r3", ch: 11, label: "Re-flag Hong Meigui as the Weaver's herald" },
    { key: "r4", ch: 11, label: "Plant the three clues at the Silkwasp camp" },
    { key: "r5", ch: 12, label: "Ren Mei Li's alliance reveal at Meeting the Princess" },
    { key: "r6", ch: 12, label: "Reframe the Five-Season Treasures as sealing anchors" },
    { key: "r7", ch: 12, label: "Red-clad witness at murder #2 (Elizeth)" },
    { key: "r8", ch: 12, label: "Fang-and-Key warning about the opened door" },
    { key: "r9", ch: 13, label: "Stage the breach after Heh Shan-Bao's fate resolves" },
    { key: "r10", ch: 13, label: "Redeemed governor strips the Weaver's opening shield" },
    { key: "r11", ch: 13, label: "Swap Kugaptee's Final Death for the Sealing of Five Seasons" }
  ]
};

/* ------------------------------------------------------------- milestones */
const MILESTONES = [
  [2, "Lantern relit"], [3, "Leader named"], [4, "Fall begins"], [5, "10 Research Points"],
  [6, "Reach the monastery"], [7, "Xin Yue falls"], [8, "The truth"], [9, "Cast Transmigrate"],
  [10, "Return to life — ancestry swap"], [11, "Before Ren Mei Li's missions"], [12, "Claim the Fang and Key"]
];

/* Arcs from the campaign notes, matched to whatever the party actor holds. */
const ARCS = {
  "Lotus Leaf-Flower": "Created by Master Zhi Hui — The Unfinished Lesson, landing in Ch 7",
  "Lysander Vargas": "Thief-bartender, ward Erin, smuggling ties. Leads Faceless Evil in Ch 9.",
  "Re Tang": "Cerulean Teahouse owner — the tea ceremonies in Ch 7 and Ch 12 are hers",
  "Zhu Chao": "Harpist, 17, tool-shop family"
};

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "campaign", pcs,
    /* Seeded from the campaign notes: Act 1 complete, Chapter 5 running. */
    chapters: { 1: "done", 2: "done", 3: "done", 4: "done", 5: "active" },
    flags: {},
    loot: {},
    cues: {},
    rework: {},
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
  if (!game.settings.settings.has(CS_ID)) {
    game.settings.register(CS_NS, CS_KEY, { scope: "world", config: false, type: Object, default: null });
  }
  /* The chapter consoles, registered so the rollup can read them whether or
     not those macros have been run in this world yet. */
  for (const id of Object.values(CONSOLES)) {
    if (!game.settings.settings.has(id)) {
      const [ns, key] = id.split(".");
      game.settings.register(ns, key, { scope: "world", config: false, type: Object, default: null });
    }
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const chapter = (n) => CHAPTERS.find(c => c.n === Number(n));

/* ----------------------------------------------------------------- engine */
class Campaign {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(CS_NS, CS_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  /* ----- position ----- */
  statusOf(n) { return this.s.chapters[n] ?? "todo"; }

  /* Where the table is: whatever is running, else the first unplayed chapter. */
  get current() {
    const active = CHAPTERS.find(c => this.statusOf(c.n) === "active");
    if (active) return active;
    const next = CHAPTERS.find(c => this.statusOf(c.n) !== "done");
    return next ?? CHAPTERS[CHAPTERS.length - 1];
  }
  get partyLevel() { return Math.max(1, this.current.level); }

  cycleStatus(n) {
    const cur = this.statusOf(n);
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(cur) + 1) % STATUS_ORDER.length];
    this.s.chapters[n] = next;
    /* Only one chapter runs at a time. */
    if (next === "active") {
      for (const c of CHAPTERS) if (c.n !== Number(n) && this.statusOf(c.n) === "active") this.s.chapters[c.n] = "done";
    }
    this.log(`Ch ${n} — ${STATUS[next].label.toLowerCase()}.`);
    this.touch();
  }

  /* ----- flags ----- */
  flagId(n, key) { return `${n}.${key}`; }
  flag(n, key) { return !!this.s.flags[this.flagId(n, key)]; }
  toggleFlag(n, key) {
    const id = this.flagId(n, key);
    const on = !!this.s.flags[id];
    if (on) delete this.s.flags[id]; else this.s.flags[id] = true;
    const item = chapter(n)?.items.find(i => i.key === key);
    this.log(`Ch ${n} — ${item?.label ?? key}: ${on ? "cleared" : "done"}.`);
    this.touch();
  }
  toggleRework(key) {
    const on = !!this.s.rework[key];
    if (on) delete this.s.rework[key]; else this.s.rework[key] = true;
    this.touch();
  }

  /* ----- treasure and cues -----
     Same shape as flags, in their own buckets so the checklist count doesn't
     get diluted by loot the party simply never found. */
  lootFor(n) { return LOOT[n] ?? []; }
  cuesFor(n) { return CUES[n] ?? []; }

  /* A chapter's module macros, plus any that could only be placed to its act,
     flagged so you can see the difference. */
  macrosFor(n) {
    const act = chapter(n)?.act;
    const placed = MODULE_MACROS.chapters[n] ?? [];
    const actOnly = (MODULE_MACROS.acts[act] ?? []).map(m => ({ ...m, actOnly: true }));
    return [...placed, ...actOnly];
  }
  claimed(n, key) { return !!this.s.loot[`${n}.${key}`]; }
  cued(n, key) { return !!this.s.cues[`${n}.${key}`]; }

  toggleLoot(n, key) {
    const id = `${n}.${key}`;
    const on = !!this.s.loot[id];
    if (on) delete this.s.loot[id]; else this.s.loot[id] = true;
    const it = this.lootFor(n).find(x => x.key === key);
    this.log(`Ch ${n} loot — ${it?.label ?? key}: ${on ? "unclaimed" : "claimed"}.`);
    this.touch();
  }
  toggleCue(n, key) {
    const id = `${n}.${key}`;
    const on = !!this.s.cues[id];
    if (on) delete this.s.cues[id]; else this.s.cues[id] = true;
    this.touch();
  }

  /* Everything the party could still walk away from, current chapter first. */
  get lootLedger() {
    const rows = [];
    for (const c of CHAPTERS) {
      for (const it of this.lootFor(c.n)) {
        rows.push({ ...it, ch: c.n, claimed: this.claimed(c.n, it.key), here: c.n === this.current.n });
      }
    }
    return rows;
  }

  progress(n) {
    const items = chapter(n).items;
    return {
      done: items.filter(i => this.flag(n, i.key)).length, total: items.length,
      loot: this.lootFor(n).filter(i => this.claimed(n, i.key)).length, lootTotal: this.lootFor(n).length,
      cues: this.cuesFor(n).filter(i => this.cued(n, i.key)).length, cueTotal: this.cuesFor(n).length
    };
  }
  get overall() {
    let done = 0, total = 0;
    for (const c of CHAPTERS) { const p = this.progress(c.n); done += p.done; total += p.total; }
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  /* ----- threads -----
     Anything with a downstream payoff, sorted by when it comes due. A thread
     is overdue once the table has reached the chapter that needs it. */
  get threads() {
    const out = [];
    for (const c of CHAPTERS) {
      for (const item of c.items) {
        if (!item.at) continue;
        const carried = this.flag(c.n, item.key);
        const due = this.current.n >= item.at;
        out.push({
          from: c.n, at: item.at, label: item.label, pays: item.pays ?? "",
          hard: !!item.hard, rework: !!item.rework, carried,
          state: carried ? "ok" : due ? "overdue" : "pending"
        });
      }
    }
    return out.sort((a, b) => a.at - b.at || a.from - b.from);
  }
  get overdue() { return this.threads.filter(t => t.state === "overdue"); }

  /* ----- the chapter consoles ----- */
  consoleState(which) { return game.settings.get("world", CONSOLES[which].split(".")[1]); }

  get rollup() {
    const dt = this.consoleState("downtime");
    const ruins = this.consoleState("ruins");
    const path = this.consoleState("path");
    const out = [];
    if (dt?.pools) {
      out.push({ label: "Hope", value: dt.pools.hope, tone: "ember" });
      out.push({ label: "Food", value: `${dt.pools.food}/12`, tone: "moss" });
      out.push({ label: "Security", value: `${dt.pools.security}/12`, tone: "slate" });
      out.push({ label: "Teahouse", value: `${dt.pools.restoration}/5`, tone: "rust" });
      const rp = Object.values(dt.research ?? {}).reduce((a, b) => a + b, 0);
      out.push({ label: "Research", value: `${rp}/10 RP`, tone: "plum" });
      out.push({ label: "Week", value: `${dt.week} of 12`, tone: "gold" });
    }
    if (path?.shrines) {
      const conds = { d1: ["cleared", "slept"], d2: ["incense", "slept"], d3: ["iogaka", "bathe", "slept"] };
      const lit = Object.entries(conds).filter(([d, keys]) => keys.every(k => path.shrines[d]?.[k])).length;
      out.push({ label: "Shrines", value: `${lit} of 3`, tone: "gold" });
    }
    if (ruins?.order) out.push({ label: "Statues", value: `${ruins.order.length} of 4`, tone: "plum" });
    return out;
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Campaign tracker reset to the start of Chapter 5.");
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
      speaker: { alias: "Season of Ghosts" }
    });
  }

  /* Player-facing: where the story stands and what's behind them. No pending
     chapters, no thread state, no prep warnings. */
  postRecap() {
    const c = this.current, act = ACTS[c.act];
    const done = CHAPTERS.filter(x => this.statusOf(x.n) === "done");
    const rows = done.map(x => `<li style="margin-bottom:2px">${x.title}</li>`).join("");
    return this.postCard(`Act ${c.act} — ${act.name}`, c.title,
      `<p style="margin:0 0 6px">${act.season}, and the party stands at level ${c.level}.</p>
       ${rows ? `<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052;margin-bottom:2px">Behind them</div>
       <ul style="margin:0;padding-left:1.1em">${rows}</ul>` : ""}`, act.tone);
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class CSApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "cst-console", tag: "div", classes: ["cst-console"],
    position: { width: 960, height: "auto" },
    window: { title: "Season of Ghosts — Campaign Status", icon: "fa-solid fa-ghost", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "cst-console", classes: ["cst-console"], title: "Season of Ghosts — Campaign Status",
      width: 960, height: "auto", resizable: true
    });
  }
  get title() { return "Season of Ghosts — Campaign Status"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="cst-root">${this.markup()}</div>`);
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
    const tabs = [
      { key: "campaign", label: "Campaign", sub: "where the table is" },
      { key: "act1", label: "Act 1", sub: ACTS[1].name },
      { key: "act2", label: "Act 2", sub: ACTS[2].name },
      { key: "act3", label: "Act 3", sub: ACTS[3].name },
      { key: "act4", label: "Act 4", sub: ACTS[4].name },
      { key: "threads", label: "Threads", sub: "what carries forward" },
      { key: "loot", label: "Treasure", sub: "the loot ledger" },
      { key: "rework", label: "Two Weavers", sub: "rework continuity" }
    ];
    const actTab = /^act[1-4]$/.test(s.tab) ? Number(s.tab.slice(3)) : null;
    return `${this.styles()}
      <div class="cst">
        ${this.header(ro)}
        <nav class="tabs">
          ${tabs.map(x => `<button type="button" class="tab ${s.tab === x.key ? "on" : ""}" data-act="tab" data-k="${x.key}">
            <b>${x.label}</b><small>${x.sub}</small></button>`).join("")}
        </nav>
        ${s.tab === "campaign" ? this.campaignTab(ro) : ""}
        ${actTab ? this.actTab(actTab, ro) : ""}
        ${s.tab === "threads" ? this.threadsTab() : ""}
        ${s.tab === "loot" ? this.lootTab(ro) : ""}
        ${s.tab === "rework" ? this.reworkTab(ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t, c = t.current, o = t.overall, od = t.overdue.length;
    return `
      <header class="topbar">
        <div class="where">
          <span class="eyebrow">Act ${c.act} · Chapter ${c.n}</span>
          <b>${c.title}</b>
        </div>
        <span class="lvl">Level ${c.level}</span>
        ${od ? `<span class="alarm" title="Threads due now and not carried"><i class="fa-solid fa-triangle-exclamation"></i> ${od} overdue</span>` : ""}
        <div class="prog">
          <div class="bar"><span style="width:${o.pct}%"></span></div>
          <small>${o.done} of ${o.total} logged</small>
        </div>
        <button type="button" class="say" data-act="postrecap" title="Post a spoiler-free recap"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset the tracker" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }


  /* Reference only — these are run from Foundry's macro directory, so there is
     nothing to tick. Naming them exactly as they appear there is the point. */
  macroList(list) {
    if (!list.length) return "";
    return `<div class="macros">
      ${list.map(m => m.group
        ? `<div class="mrow group"><i class="fa-solid fa-folder"></i>
             <span class="mname">${m.group}<small>${m.folder}</small></span>
             <span class="mitems">${m.items.join(" · ")}</span></div>`
        : `<div class="mrow"><i class="fa-solid fa-bolt"></i>
             <span class="mname">${m.name}<small>${m.folder}${m.note ? ` · ${m.note}` : ""}</small></span>
             ${m.actOnly ? `<span class="pip">act only</span>` : m.guess ? `<span class="pip">placed by guess</span>` : ""}</div>`
      ).join("")}
    </div>`;
  }

  /* ------------------------------------------------------------ campaign */
  campaignTab(ro) {
    const t = this.t, c = t.current, roll = t.rollup;
    const od = t.overdue;
    return `
      ${roll.length ? `
      <section class="panel" style="--tone:var(--gold)">
        <h3>Live from the chapter consoles</h3>
        <div class="rollup">
          ${roll.map(r => `<div class="meter" style="--tone:var(--${r.tone})">
            <span>${r.label}</span><b>${r.value}</b></div>`).join("")}
        </div>
      </section>` : `
      <section class="panel">
        <h3>Live from the chapter consoles</h3>
        <p class="hint">Nothing to read yet. Run the Fall Downtime Tracker, the Enlightened Path, or the Ruins of Wisdom console once and their state appears here.</p>
      </section>`}

      ${od.length ? `
      <section class="panel" style="--tone:var(--rust)">
        <h3>Due now, not carried <small>${od.length} thread${od.length === 1 ? "" : "s"}</small></h3>
        ${od.map(x => `<p class="alarmrow"><span class="chip">Ch ${x.from} → ${x.at}</span> ${x.label}${x.pays ? ` <em>${x.pays}</em>` : ""}</p>`).join("")}
      </section>` : ""}

      ${(() => {
        const cues = t.cuesFor(c.n), loot = t.lootFor(c.n).filter(i => !t.claimed(c.n, i.key));
        const macros = t.macrosFor(c.n);
        if (!cues.length && !loot.length && !macros.length) return "";
        return `
        <section class="panel" style="--tone:var(--ember)">
          <h3>Before this session <small>Chapter ${c.n}</small></h3>
          <div class="cols">
            ${cues.length ? `<div>
              <div class="subhead"><i class="fa-solid fa-clapperboard"></i> Scenes and cues</div>
              ${cues.map(q => `<label class="check ${t.cued(c.n, q.key) ? "on" : ""}">
                  <input type="checkbox" data-act="cue" data-n="${c.n}" data-k="${q.key}" ${t.cued(c.n, q.key) ? "checked" : ""} ${ro ? "disabled" : ""}>
                  <span class="lbl">${q.label}</span></label>`).join("")}
            </div>` : ""}
            ${macros.length ? `<div>
              <div class="subhead"><i class="fa-solid fa-bolt"></i> Module macros for this chapter</div>
              ${this.macroList(macros)}
            </div>` : ""}
            ${loot.length ? `<div>
              <div class="subhead"><i class="fa-solid fa-sack-xmark"></i> Treasure still on the table</div>
              ${loot.map(it => `<label class="check">
                  <input type="checkbox" data-act="loot" data-n="${c.n}" data-k="${it.key}" ${ro ? "disabled" : ""}>
                  <span class="lbl">${it.label}${it.where ? `<em class="pays">${it.where}</em>` : ""}</span></label>`).join("")}
            </div>` : ""}
          </div>
        </section>`;
      })()}

      <div class="cols">
        <section class="panel" style="--tone:var(--plum)">
          <h3>The party</h3>
          ${t.s.pcs.map(pc => `
            <div class="pc">
              <img src="${pc.img}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
              <div><b>${esc(pc.name)}</b>${ARCS[pc.name] ? `<small>${ARCS[pc.name]}</small>` : ""}</div>
            </div>`).join("")}
        </section>

        <section class="panel" style="--tone:var(--ember)">
          <h3>Submacros <small>useful in any chapter</small></h3>
          ${this.macroList(MODULE_MACROS.always)}
        </section>

        <section class="panel" style="--tone:var(--slate)">
          <h3>Milestone leveling <small>level = chapter − 1</small></h3>
          <div class="miles">
            ${MILESTONES.map(([lvl, what]) => `
              <div class="mile ${c.level >= lvl ? "got" : ""}"><b>${lvl}</b><span>${what}</span></div>`).join("")}
          </div>
        </section>
      </div>

      <section class="panel">
        <h3>All thirteen chapters</h3>
        <div class="chaplist">
          ${CHAPTERS.map(x => {
            const st = t.statusOf(x.n), p = t.progress(x.n);
            return `<button type="button" class="chaprow ${st}" data-act="gotoact" data-k="${x.act}" title="Open Act ${x.act}">
              <span class="cn">${x.n}</span>
              <span class="ct">${x.title}${x.rework ? ` <i class="fa-solid fa-spider" title="Two Weavers rework"></i>` : ""}</span>
              <span class="cs">Lv ${x.level}</span>
              <span class="cp">${p.done}/${p.total}</span>
              <span class="cb ${st}">${STATUS[st].label}</span>
            </button>`;
          }).join("")}
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------------- acts */
  actTab(act, ro) {
    const t = this.t, a = ACTS[act];
    return `
      <section class="panel actbar" style="--tone:var(--${a.tone})">
        <h3>Act ${act} — ${a.name} <small>${a.season}</small></h3>
      </section>
      ${CHAPTERS.filter(c => c.act === act).map(c => this.chapterCard(c, ro)).join("")}`;
  }

  chapterCard(c, ro) {
    const t = this.t, st = t.statusOf(c.n), p = t.progress(c.n);
    return `
      <section class="panel chap ${st}" style="--tone:var(--${ACTS[c.act].tone})">
        <h3>
          <span class="eid">Ch ${c.n}</span>${c.title}
          <span class="lvl">Level ${c.level}</span>
          ${c.rework ? `<span class="tag web">Two Weavers</span>` : ""}
          ${c.console ? `<span class="tag">${c.console} console</span>` : ""}
          <button type="button" class="statbtn ${st}" data-act="cycle" data-n="${c.n}" ${ro ? "disabled" : ""}
            title="Click to advance status">${STATUS[st].label}</button>
        </h3>
        <p class="text">${c.spine}</p>
        ${c.note ? `<p class="note">${c.note}</p>` : ""}
        <div class="items">
          ${c.items.map(i => {
            const on = t.flag(c.n, i.key);
            const overdue = !on && i.at && t.current.n >= i.at;
            return `
              <label class="check ${on ? "on" : ""} ${overdue ? "overdue" : ""}">
                <input type="checkbox" data-act="flag" data-n="${c.n}" data-k="${i.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}>
                <span class="lbl">${i.label}
                  ${i.hard ? `<span class="pip hard" title="A later chapter depends on this">required</span>` : ""}
                  ${i.danger ? `<span class="pip danger" title="Permanent or costly consequence">consequence</span>` : ""}
                  ${i.rework ? `<span class="pip web" title="Two Weavers rework">rework</span>` : ""}
                  ${i.pays ? `<em class="pays">→ ${i.pays}</em>` : ""}
                </span>
              </label>
              ${i.note ? `<p class="itemnote">${i.note}</p>` : ""}`;
          }).join("")}
        </div>

        ${p.lootTotal ? `
        <div class="sub loot">
          <div class="subhead"><i class="fa-solid fa-sack-xmark"></i> Treasure <span>${p.loot} of ${p.lootTotal}</span></div>
          ${t.lootFor(c.n).map(it => {
            const on = t.claimed(c.n, it.key);
            return `<label class="check ${on ? "on" : ""}">
                <input type="checkbox" data-act="loot" data-n="${c.n}" data-k="${it.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}>
                <span class="lbl">${it.label}${it.where ? `<em class="pays">${it.where}</em>` : ""}</span>
              </label>
              ${it.note ? `<p class="itemnote">${it.note}</p>` : ""}`;
          }).join("")}
        </div>` : ""}

        ${t.macrosFor(c.n).length ? `
        <div class="sub">
          <div class="subhead"><i class="fa-solid fa-bolt"></i> Module macros <span>${t.macrosFor(c.n).length}</span></div>
          ${this.macroList(t.macrosFor(c.n))}
        </div>` : ""}

        ${p.cueTotal ? `
        <div class="sub cues">
          <div class="subhead"><i class="fa-solid fa-clapperboard"></i> Scenes and cues <span>${p.cues} of ${p.cueTotal}</span></div>
          ${t.cuesFor(c.n).map(q => {
            const on = t.cued(c.n, q.key);
            return `<label class="check ${on ? "on" : ""}">
                <input type="checkbox" data-act="cue" data-n="${c.n}" data-k="${q.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}>
                <span class="lbl">${q.label}</span>
              </label>
              ${q.note ? `<p class="itemnote">${q.note}</p>` : ""}`;
          }).join("")}
        </div>` : ""}

        <p class="hint">${p.done} of ${p.total} logged.</p>
      </section>`;
  }

  /* ---------------------------------------------------------------- loot */
  lootTab(ro) {
    const t = this.t, rows = t.lootLedger;
    const open = rows.filter(r => !r.claimed);
    const block = (list, title, tone, blurb) => list.length ? `
      <section class="panel" style="--tone:var(--${tone})">
        <h3>${title} <small>${list.length}</small></h3>
        ${blurb ? `<p class="hint">${blurb}</p>` : ""}
        <div class="items">
          ${list.map(r => `
            <label class="check ${r.claimed ? "on" : ""} ${r.here && !r.claimed ? "here" : ""}">
              <input type="checkbox" data-act="loot" data-n="${r.ch}" data-k="${r.key}" ${r.claimed ? "checked" : ""} ${ro ? "disabled" : ""}>
              <span class="lbl"><span class="chip">Ch ${r.ch}</span> ${r.label}
                ${r.where ? `<em class="pays">${r.where}</em>` : ""}</span>
            </label>
            ${r.note ? `<p class="itemnote">${r.note}</p>` : ""}`).join("")}
        </div>
      </section>` : "";

    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>The loot ledger <small>${rows.length - open.length} of ${rows.length} claimed</small></h3>
        <p class="text">Every named piece of treasure in the campaign, chapter by chapter. Things already tracked as chapter decisions — Zoudou's ledger, Watchers of the Cycle, the Fang and Key — live on their act's tab instead of being counted twice here.</p>
      </section>
      ${block(open.filter(r => r.here), "In the chapter you're running", "ember", "Still on the table right now.")}
      ${block(open.filter(r => r.ch < t.current.n), "Left behind", "rust", "Earlier chapters the party never emptied. Some can still be gone back for; some can't.")}
      ${block(open.filter(r => r.ch > t.current.n), "Still ahead", "slate", "")}
      ${block(rows.filter(r => r.claimed), "Claimed", "moss", "")}`;
  }

  /* ------------------------------------------------------------- threads */
  threadsTab() {
    const t = this.t, threads = t.threads;
    const group = (state, title, tone, blurb) => {
      const rows = threads.filter(x => x.state === state);
      if (!rows.length) return "";
      return `
        <section class="panel" style="--tone:var(--${tone})">
          <h3>${title} <small>${rows.length}</small></h3>
          <p class="hint">${blurb}</p>
          <div class="threads">
            ${rows.map(x => `
              <div class="thread">
                <span class="chip">Ch ${x.from}</span>
                <span class="tl">${x.label}
                  ${x.hard ? `<span class="pip hard">required</span>` : ""}
                  ${x.rework ? `<span class="pip web">rework</span>` : ""}
                </span>
                <span class="tp">${x.pays}</span>
                <span class="tat">due Ch ${x.at}</span>
              </div>`).join("")}
          </div>
        </section>`;
    };
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>What carries forward</h3>
        <p class="text">Every item whose payoff lands in a later chapter, sorted by when it comes due. A thread goes red once the table reaches the chapter that needs it and the box is still empty.</p>
      </section>
      ${group("overdue", "Overdue", "rust", "The table has reached the chapter that wanted these. Either they happened and want ticking, or you need a workaround.")}
      ${group("pending", "Still ahead", "slate", "Not due yet. Worth a glance before the chapter that needs them.")}
      ${group("ok", "Carried", "moss", "Logged and in hand.")}`;
  }

  /* -------------------------------------------------------------- rework */
  reworkTab(ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3>The Web Has Two Weavers <small>what it fixes</small></h3>
        <p class="text">${REWORK.pitch}</p>
        <p class="note">Everything not flagged here runs exactly as the book prints it.</p>
      </section>

      <div class="cols">
        ${REWORK.weavers.map(w => `
          <section class="panel" style="--tone:var(--${w.tone})">
            <h3>${w.who}</h3>
            <p class="crea"><b>Role</b> ${w.role}</p>
            <p class="text"><b>Wants</b> ${w.wants}</p>
            <p class="note"><b>Tell</b> ${w.tell}</p>
          </section>`).join("")}
      </div>

      <section class="panel" style="--tone:var(--rust)">
        <h3>Keep the leash tight</h3>
        <p class="text">${REWORK.caution}</p>
      </section>

      <section class="panel" style="--tone:var(--gold)">
        <h3>Continuity checklist</h3>
        <div class="items">
          ${REWORK.checklist.map(r => {
            const on = !!t.s.rework[r.key];
            const overdue = !on && t.current.n >= r.ch;
            return `<label class="check ${on ? "on" : ""} ${overdue ? "overdue" : ""}">
              <input type="checkbox" data-act="rework" data-k="${r.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}>
              <span class="lbl"><span class="chip">Ch ${r.ch}</span> ${r.label}
                ${r.optional ? `<span class="pip">optional</span>` : ""}</span>
            </label>`;
          }).join("")}
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------- listeners */
  wire(root) {
    if (!root || root.dataset?.cstWired === "1") return;
    if (root.dataset) root.dataset.cstWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act;
      if (a === "tab") { t.s.tab = btn.dataset.k; t.touch(); }
      else if (a === "gotoact") { t.s.tab = `act${btn.dataset.k}`; t.touch(); }
      else if (a === "cycle") t.cycleStatus(btn.dataset.n);
      else if (a === "postrecap") t.postRecap();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "flag") t.toggleFlag(el.dataset.n, el.dataset.k);
      else if (el.dataset.act === "loot") t.toggleLoot(el.dataset.n, el.dataset.k);
      else if (el.dataset.act === "cue") t.toggleCue(el.dataset.n, el.dataset.k);
      else if (el.dataset.act === "rework") t.toggleRework(el.dataset.k);
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #cst-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #cst-console .window-content > * { background:transparent; }
      .cst { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
             --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
             --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
             font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .cst * { box-sizing:border-box; }
      .cst button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                    border:1px solid var(--line); border-radius:3px; line-height:1.25;
                    display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                    height:auto; min-height:0; }
      .cst button:hover:not(:disabled) { background:var(--hover); }
      .cst button:disabled { opacity:.45; cursor:not-allowed; }
      .cst input[type="checkbox"] { accent-color:var(--ember); margin-top:.15rem; flex:none; }
      .cst h3 { color:var(--ink); font-size:.9rem; margin:0 0 .5rem; letter-spacing:.04em; text-transform:uppercase;
                display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
                padding-bottom:.3rem; flex-wrap:wrap; }
      .cst h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .cst h1, .cst h2, .cst h4, .cst legend { color:var(--ink); }
      .cst .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                    background:var(--card); }
      .cst .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .cst .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .cst .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                  border-radius:3px; padding:1px 5px; letter-spacing:.06em; }
      .cst .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                  border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .cst .say { margin-left:.25rem; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .cst .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .cst .note { font-size:.78rem; line-height:1.45; color:var(--muted); font-style:italic; margin:.2rem 0 .4rem; }
      .cst .crea { font-size:.76rem; margin:.1rem 0 .35rem; color:var(--muted); }
      .cst .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .cst .chip { font-size:.62rem; text-transform:uppercase; letter-spacing:.06em; padding:1px 6px;
                   border-radius:3px; background:var(--stripe); border:1px solid var(--line);
                   color:var(--muted); white-space:nowrap; }
      .cst .tag { font-size:.6rem; text-transform:uppercase; letter-spacing:.07em; padding:1px 6px;
                  border-radius:10px; border:1px solid var(--line); color:var(--muted); }
      .cst .tag.web { border-color:var(--plum); color:var(--plum); }
      .cst .pip { font-size:.58rem; text-transform:uppercase; letter-spacing:.07em; padding:0 5px;
                  border-radius:8px; border:1px solid var(--line); color:var(--muted); margin-left:.3rem;
                  white-space:nowrap; }
      .cst .pip.hard { border-color:var(--gold); color:var(--gold); }
      .cst .pip.danger { border-color:var(--rust); color:var(--rust); }
      .cst .pip.web { border-color:var(--plum); color:var(--plum); }

      .cst .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                     border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .cst .where { display:flex; flex-direction:column; line-height:1.2; }
      .cst .eyebrow { font-size:.6rem; text-transform:uppercase; letter-spacing:.09em; color:var(--muted); }
      .cst .where b { font-size:.95rem; }
      .cst .alarm { font-size:.68rem; text-transform:uppercase; letter-spacing:.06em; padding:2px 8px;
                    border-radius:10px; border:1px solid var(--rust); color:var(--rust); font-weight:700; }
      .cst .prog { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
      .cst .prog small { font-size:.62rem; color:var(--muted); }
      .cst .bar { width:150px; height:6px; border:1px solid var(--line); border-radius:3px;
                  background:var(--stripe); overflow:hidden; }
      .cst .bar span { display:block; height:100%; background:var(--moss); }

      .cst .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .cst .tab { flex:1; padding:.3rem .2rem; font-size:.76rem; display:flex; flex-direction:column; line-height:1.2;
                  overflow:hidden; }
      .cst .tab small { font-size:.58rem; color:var(--muted); font-weight:400; white-space:nowrap;
                        text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .cst .tab.on { background:var(--plum); border-color:var(--plum); color:var(--paper); }
      .cst .tab.on small { color:var(--paper); opacity:.8; }

      .cst .cols { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
      .cst .rollup { display:flex; gap:.5rem; flex-wrap:wrap; }
      .cst .meter { border-top:2px solid var(--tone); padding:.25rem .6rem .1rem 0; min-width:78px; }
      .cst .meter span { display:block; font-size:.58rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .cst .meter b { font-size:1rem; color:var(--tone); line-height:1.2; }

      .cst .alarmrow { font-size:.79rem; line-height:1.45; margin:.25rem 0; }
      .cst .alarmrow em { color:var(--muted); font-size:.74rem; }

      .cst .pc { display:flex; gap:.5rem; align-items:center; margin-bottom:.4rem; }
      .cst .pc img { width:30px; height:30px; border-radius:3px; object-fit:cover; border:1px solid var(--line); flex:none; }
      .cst .pc b { font-size:.82rem; display:block; }
      .cst .pc small { font-size:.7rem; color:var(--muted); line-height:1.35; display:block; }

      .cst .miles { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:.2rem .5rem; }
      .cst .mile { display:flex; gap:.35rem; align-items:baseline; font-size:.74rem; color:var(--muted); }
      .cst .mile b { color:var(--line); font-size:.8rem; min-width:1.1rem; }
      .cst .mile.got { color:var(--ink); }
      .cst .mile.got b { color:var(--gold); }

      .cst .chaplist { display:flex; flex-direction:column; gap:2px; }
      .cst .chaprow { display:grid; grid-template-columns:2rem 1fr 4rem 3rem 5.5rem; align-items:center;
                      gap:.5rem; text-align:left; padding:.25rem .4rem; font-size:.8rem; justify-content:start; }
      .cst .chaprow .cn { font-weight:700; color:var(--muted); }
      .cst .chaprow .ct { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .cst .chaprow .cs, .cst .chaprow .cp { font-size:.7rem; color:var(--muted); }
      .cst .chaprow .cb { font-size:.6rem; text-transform:uppercase; letter-spacing:.06em; text-align:center;
                          border-radius:10px; border:1px solid var(--line); color:var(--muted); padding:1px 0; }
      .cst .chaprow .cb.done { border-color:var(--moss); color:var(--moss); }
      .cst .chaprow .cb.active { border-color:var(--ember); color:var(--ember); font-weight:700; }
      .cst .chaprow.done .ct { color:var(--muted); }

      .cst .chap.done { opacity:.85; }
      .cst .statbtn { margin-left:auto; font-size:.62rem; text-transform:uppercase; letter-spacing:.07em;
                      padding:2px 9px; border-radius:10px; }
      .cst .statbtn.done { border-color:var(--moss); color:var(--moss); }
      .cst .statbtn.active { border-color:var(--ember); color:var(--ember); font-weight:700; }

      .cst .items { display:flex; flex-direction:column; }
      .cst .check { display:flex; gap:.45rem; align-items:flex-start; font-size:.8rem; line-height:1.4;
                    padding:.15rem .25rem; border-radius:3px; }
      .cst .check.on .lbl { color:var(--muted); }
      .cst .check.overdue { background:rgba(149,56,31,.09); }
      .cst .check.overdue .lbl { color:var(--rust); }
      .cst .check.here { background:rgba(164,92,20,.10); }
      .cst .lbl { flex:1; }
      .cst .pays { color:var(--muted); font-size:.72rem; display:block; }

      .cst .sub { border-top:1px dashed var(--line); margin-top:.45rem; padding-top:.4rem; }
      .cst .subhead { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted);
                      display:flex; align-items:center; gap:.35rem; margin-bottom:.25rem; }
      .cst .subhead span { margin-left:auto; }
      .cst .sub.loot .check.on .lbl { text-decoration:line-through; text-decoration-color:var(--line); }
      .cst .itemnote { font-size:.74rem; line-height:1.45; color:var(--muted); margin:0 0 .3rem 1.5rem; }

      .cst .macros { display:flex; flex-direction:column; gap:1px; }
      .cst .mrow { display:flex; gap:.45rem; align-items:baseline; font-size:.79rem; padding:.12rem 0; }
      .cst .mrow i { color:var(--muted); font-size:.7rem; width:.9rem; flex:none; }
      .cst .mname { font-weight:600; }
      .cst .mname small { display:block; font-weight:400; font-size:.68rem; color:var(--muted); }
      .cst .mitems { color:var(--muted); font-size:.72rem; flex:1; }
      .cst .mrow.group .mname { color:var(--ember); }

      .cst .threads { display:flex; flex-direction:column; gap:1px; }
      .cst .thread { display:grid; grid-template-columns:3.4rem 1fr 12rem 5rem; gap:.5rem; align-items:baseline;
                     font-size:.78rem; padding:.22rem .25rem; border-top:1px solid var(--stripe); }
      .cst .thread .tp { color:var(--muted); font-size:.72rem; }
      .cst .thread .tat { color:var(--muted); font-size:.68rem; text-align:right; white-space:nowrap; }

      @media (max-width:820px) {
        .cst .cols { grid-template-columns:1fr; }
        .cst .tabs { flex-wrap:wrap; }
        .cst .thread { grid-template-columns:3.4rem 1fr; }
        .cst .thread .tp, .cst .thread .tat { grid-column:2; text-align:left; }
        .cst .chaprow { grid-template-columns:2rem 1fr 5.5rem; }
        .cst .chaprow .cs, .cst .chaprow .cp { display:none; }
      }
    </style>`;
  }
}

if (AppV2) {
  CSApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSettings();
  let state = game.settings.get(CS_NS, CS_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(CS_NS, CS_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const campaign = new Campaign(state);
  const app = new CSApp(campaign);

  if (!globalThis.__cstHook) {
    globalThis.__cstHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== CS_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { campaign.state = fresh; campaign.render(); }
    });
  }
  app.render(true);
})();
