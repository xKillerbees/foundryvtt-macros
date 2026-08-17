/* ============================================================================
   NO BREATH TO CRY — Winter Console (Act 3)
   Season of Ghosts, Act 3 · Chapters 8–10 · party levels 7–9
   Foundry VTT v11 / v12 / v13 / v14  •  built for PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.
   Runs the whole of winter: the attrition clock that draws down the town's
   Hope / Food / Security pools, Chapter 8's three fights and Heh Shan-Bao's
   dream, Chapter 9's seventy-two-day timeline and the two rituals' research,
   and Chapter 10's Terror-driven raid on Karahai.
   ============================================================================ */

const WNR_NS = "world";
const WNR_KEY = "sogWinter";
const WNR_ID = `${WNR_NS}.${WNR_KEY}`;
const DOWNTIME_ID = "world.sogFallDowntime";   // read/write: Hope / Food / Security pools, Reputation
const MAX_PCS = 4;

const DEG = ["cs", "s", "f", "cf"];
const DEG_LABEL = { cs: "Crit Success", s: "Success", f: "Failure", cf: "Crit Failure" };

const THEME = "parchment";
const PALETTES = {
  parchment: {
    paper: "#efe6d8", card: "#fbf7f0", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
    stripe: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.07)", field: "#fffdf8",
    rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12", plumSoft: "rgba(93,54,84,.10)",
    ice: "#5b7f9e", snow: "#8fa6b5"
  },
  dark: {
    paper: "#1f1d1b", card: "#2a2724", ink: "#ece5da", line: "#544d44", muted: "#a4988a",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(255,255,255,.08)", field: "#171513",
    rust: "#d4664a", ember: "#e0a052", moss: "#96b06a", slate: "#7fa0bb", plum: "#b98ab0", gold: "#d9b74f", plumSoft: "rgba(185,138,176,.16)",
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

/* ----------------------------------------------------------------- chapters
   Three chapters, one window. The top tab strip carries the act's spine and
   the three chapters; a second strip under it switches views inside a chapter. */
const CHAPTERS = {
  ch8: {
    key: "ch8", title: "Oblivion of Truth", level: 7, act: "Ch 8",
    journal: { id: "pf2apsog10oblivi", name: "Act 3.1: Oblivion of Truth", ord: "10" },
    tone: "rust", icon: "fa-mask",
    subs: [
      { key: "events", label: "Red Smoke", sub: "three fights", icon: "fa-fire-flame-curved" },
      { key: "research", label: "Research", sub: "mindscape shift", icon: "fa-book" },
      { key: "dream", label: "The Dream", sub: "Heh Shan-Bao", icon: "fa-cloud-moon" }
    ]
  },
  ch9: {
    key: "ch9", title: "Face-to-Face with Death", level: 8, act: "Ch 9",
    journal: { id: "pf2apsog11faceto", name: "Act 3.2: Face-to-Face with Death", ord: "11" },
    tone: "slate", icon: "fa-skull",
    subs: [
      { key: "timeline", label: "Timeline", sub: "the winter events", icon: "fa-calendar-days" },
      { key: "research", label: "Research", sub: "transmigrate", icon: "fa-book" },
      { key: "pieces", label: "Set pieces", sub: "seance · interview · borderland", icon: "fa-spider" }
    ]
  },
  ch10: {
    key: "ch10", title: "This Place Is Ours", level: 9, act: "Ch 10",
    journal: { id: "pf2apsog12thispl", name: "Act 3.3: This Place is Ours", ord: "12" },
    tone: "plum", icon: "fa-ghost",
    subs: [
      { key: "terror", label: "Terror", sub: "the engine", icon: "fa-face-frown-open" },
      { key: "fortress", label: "Karahai", sub: "village and fort", icon: "fa-tower-observation" },
      { key: "after", label: "Aftermath", sub: "the lantern relit", icon: "fa-sun" }
    ]
  }
};
const TABS = [
  { key: "clock", label: "Winter", sub: "the clock", tone: "ice", icon: "fa-snowflake" },
  { key: "ch8", label: "Oblivion", sub: "Ch 8", tone: CHAPTERS.ch8.tone, icon: CHAPTERS.ch8.icon },
  { key: "ch9", label: "Face to Face", sub: "Ch 9", tone: CHAPTERS.ch9.tone, icon: CHAPTERS.ch9.icon },
  { key: "ch10", label: "This Place", sub: "Ch 10", tone: CHAPTERS.ch10.tone, icon: CHAPTERS.ch10.icon }
];

/* ==========================================================================
   CHAPTER DATA
   The card objects below are authored from the chapter guides. Each card is
   rendered by the shared `cardMarkup()` below — see its schema comment.

   Card schema (all fields optional except key/name):
     id         badge text (an area code like "C1" or "Event 4"); also the
                journal-link ref — resolved as `<ordinal><id><slug>`
     key        UNIQUE state key (prefix ch8-/ch9-/ch10-)
     name       card title
     when       timing subtitle (optional)
     level      encounter level, e.g. "Moderate 7" (optional)
     tone       accent: moss/ember/slate/plum/gold/rust/ice/muted
     creatures  "Name (count) · …" — names only, never stat blocks
     boxed      read-aloud text
     text       GM notes / what is happening
     note       extra GM note (italic)
     quote      a line of dialogue (rendered as a quotation)
     checks     list of "DC 20 Skill" strings (auto-linkified)
     outcomes   list of degree/outcome strings
     qa         [[question, answer], …]
     phases     ordered list of phase notes
     hazard     hazard text (labelled "Hazard")
     treasure   treasure text (labelled "Treasure")
     beats      [{ key, label, note, xp, hope, food, security, rep, terror }]
                — toggles; xp/terror accrue in this console, hope/food/security
                and rep (both factions) write through to the downtime tracker
     aside      { title, text }
     influence  [{ key, label, max, note, reveal }] — a +/- tracker (the seance)

   Research schema (CH8_RESEARCH / CH9_RESEARCH):
     { title, subtitle, total, finalXp, modes:[{name,max,checks}],
       thresholds:[{rp,xp,text}], cast:{title,text} }

   Terror schema (CH10_TERROR):
     { note, decay, teach, thresholds:[[terror,fear,response],…],
       menu:[{action,points,note}] }
   ========================================================================== */



// ============================================================================
// Chapter 8 — "Oblivion of Truth" (Season of Ghosts, Act 3 Chapter 1)
// Winter-console macro DATA layer.
// Source: digests/chapter1.md (complete mechanical digest of the Act3Ch1 guide
// and full adventure chapter text). All DCs, XP awards, rewards, and named
// items verbatim from the book. No stat blocks.
// ============================================================================

const CH8_EVENTS = [
  {
    id: "W14",
    key: "ch8-opening",
    name: "Red Smoke, Gold Eyes",
    when: "First day of winter · mid-morning",
    tone: "ember",
    boxed: "Four glowing golden eyes blaze into existence in the smoke, moving forward without a body or legs to carry them. A monstrous red visage bleeds into air around them for just a moment, yellowed fangs twisting gruesomely out of its mouth before abruptly vanishing. Black sleeves billow around a crimson body, slipping into reality in torrents of cloth and leaking rolling clouds of incense before collapsing into ash and blowing away in the wind. A few paces more, and the golden eyes wink out. The acrid smell of smoke remains, and calls for help continue to ring out from the collapsing building beyond.",
    text: "During the final week of the previous act, one citizen mysteriously vanished (exorcised). Now, mid-morning, red smoke (no flame) pours from the Cloud Paper House (W14) on the southern shore of Woodraft Lake — the exorcists' living-world ritual “seeps” into the mindscape. Dozens of frightened townsfolk report parts of the building vanishing into smoke; three civilians are trapped inside the slowly collapsing building. The PCs begin the act knowing they are trapped in a cyclic mindscape that resets every year on the last day of spring, with the texts recovered from the Tan Sugi monastery in hand.",
    checks: [
      "DC 23 Religion to Recall Knowledge (the strangely dressed figure in the smoke)"
    ],
    outcomes: [
      "Critical success: the image may have been projected from another mindscape entirely… perhaps the one Governor Heh Shan-Bao is trapped in."
    ],
    note: "Chapter-wide rule for these events: NPCs of 6th level or lower who die in this encounter vanish entirely — spirit exorcised to the afterlife in the Great Beyond; the body simply vanishes without a trace. Creatures of 7th level or higher (i.e., the PCs) cannot be banished this way; bodies and souls remain trapped in the mindscape. To be safe from the hazards, an NPC (or doll) must reach the street south of the ruined building, then flee east or west; the crowd of onlookers takes care of them. Aruka and Zhen Luoyang are Bulk 6; Yu Er is Bulk 3."
  },
  {
    id: "Event 1",
    key: "ch8-event1",
    name: "Event 1 · Structural Collapse",
    level: "Moderate 7",
    tone: "rust",
    creatures: "Spiritual Disruptors (2) · three trapped civilians (Aruka, Yu Er, Zhen Luoyang)",
    text: "The exorcism in the living world manifests here as a pair of spiritual disruptor hazards, located at the two A4 map areas at the start of the event. Three civilians are trapped in the slowly collapsing Cloud Paper House. The event ends automatically 1 round after all trapped NPCs are rescued. See the A1–A4 cards for the trapped civilians and the hazards.",
    note: "Recurring collapse: if the PCs take longer than 6 rounds to resolve the situation and at least one hazard remains active, more of the structure collapses: 2d6 + 6 bludgeoning damage to all within the building (DC 15 Basic Reflex save). This repeats every 6 rounds until all NPCs are rescued. If this collapse takes place while no living characters are within the building, the entire structure collapses and the spiritual disruptors vanish.",
    hazard: "Spiritual Disruptors (2) — see card A4"
  },
  {
    id: "A1",
    key: "ch8-a1-aruka",
    name: "A1 · Aruka",
    tone: "rust",
    creatures: "Aruka (1) · kitsune log-hauler",
    text: "Solidly built kitsune woman hauling logs when the ceiling fell, pinning her leg under a collapsed table (her alternate form is human, not fox, so shape-shifting can't free her). On her turn each round she attempts Athletics to Escape with a +3 bonus; if free, she hobbles toward the street. She currently has 2 HP and is Slowed 2.",
    checks: [
      "DC 23 Athletics to Escape (by her or an adjacent PC)",
      "DC 23 Athletics to Force Open (by her or an adjacent PC)",
      "DC 20 Medicine to Treat Wounds (or Battle Medicine at the same DC — removes Slowed 2)"
    ],
    hazard: "Collapsed table and rubble — AC 15, Hardness 10, HP 30 (BT 15)",
    note: "Destroying the rubble (AC 15, Hardness 10, HP 30, BT 15) drops the Escape/Force Open DCs to 18. Healing Aruka to full HP removes Slowed 2; a successful DC 20 Medicine (Treat Wounds) also removes the slowed condition — the 10-minute Treat Wounds is usually too slow."
  },
  {
    id: "A2",
    key: "ch8-a2-yuer",
    name: "A2 · Yu Er & Mr. Jelly",
    tone: "gold",
    creatures: "Yu Er (1) · five-year-old girl · Mr. Jelly (doll)",
    text: "Yu Er fell through a loft floor into paper pulp (only superficial scrapes), but her favorite doll, Mr. Jelly, hangs by its cape from a snapped bamboo pole 20 feet up. One of her parents races in to collect her, but she refuses to leave without Mr. Jelly.",
    checks: [
      "DC 20 Nature or DC 20 Society to Recall Knowledge (identifies the doll as a caricature of Taljjae)",
      "DC 25 Athletics to climb the crumbling wall (an adjacent PC can then pick up the doll automatically as an Interact action)",
      "DC 22 Reflex save or DC 22 Thievery to avoid damaging the doll on each retrieval attempt",
      "DC 25 Crafting as a three-action activity with a repair toolkit (to fix a damaged doll)",
      "DC 25 Deception, DC 25 Diplomacy, or DC 25 Intimidation to calm Yu Er without the doll"
    ],
    outcomes: [
      "Mr. Jelly intact and returned: Yu Er calms immediately.",
      "Mr. Jelly damaged: she throws an epic tantrum — repair the doll (see checks) or calm her without it."
    ],
    note: "Knock the doll loose: ranged Strike vs AC 24; on a hit, succeed at a DC 16 Flat Check; a critical hit knocks it loose automatically. Magical solutions (e.g., *Telekinetic Projectile* hurling it downward) recover it automatically. Once the doll is damaged, no further damage-avoidance checks are needed. Repair options: DC 25 Crafting as a three-action activity, or automatically as a single action with the Quick Repair feat, or by casting *Mending* or *Item Facade*. Mr. Jelly is a straw-stuffed, six-limbed humanoid with a mask and cape — a caricature of Hwanggot's mysterious Taljjae (Pathfinder Lost Omens Monsters of Myth, pages 96–101)."
  },
  {
    id: "A3",
    key: "ch8-a3-zhen",
    name: "A3 · Zhen Luoyang",
    tone: "rust",
    creatures: "Zhen Luoyang (1) · elderly man",
    text: "Spry elderly man delivering a homemade lunch to his nephew (a panicked young man in the crowd) when debris buried him under crumbled plaster and dust. He is unconscious and prone.",
    checks: [
      "DC 20 Perception (Search) to locate him while buried"
    ],
    note: "Each round on his turn he attempts a DC 20 Fortitude save (with a +6 Fortitude save bonus); on success he wakes, hobbles to his feet, and limps at 5 feet toward safety. Treat his wounds as for Aruka (A1) to restore his full 25-foot Speed."
  },
  {
    id: "A4",
    key: "ch8-a4-disruptors",
    name: "A4 · Spiritual Disruptors",
    tone: "slate",
    creatures: "Spiritual Disruptors (2)",
    hazard: "Spiritual Disruptors (2) — the exorcism in the living world manifests here",
    text: "A pair of spiritual disruptor hazards, located at the two A4 map areas at the start of the event. While at least one remains active, the building keeps collapsing on the 6-round timer (see Event 1). If a collapse takes place while no living characters are within the building, the entire structure collapses and the spiritual disruptors vanish."
  },
  {
    id: "A5",
    key: "ch8-event2",
    name: "Event 2 · Unnatural Uprising",
    level: "Moderate 7",
    tone: "moss",
    creatures: "Willowshore Waldgeists (2)",
    text: "After the NPCs are rescued and the spiritual disruptors are gone, the PCs have time to rest. After 10 minutes pass, or as soon as the PCs decide to leave (whichever comes first), another plume of red smoke rises. The failed mass exorcism in the real world forces accumulated spiritual energy (loss of non-sapient life) out of the living world into the mindscape, infusing the plants and trees that overgrew Cloud Paper House's ruins.",
    note: "The waldgeists appear as deformed, miniature willow trees with screaming animal faces growing from their trunks — incorporeal spirits drifting like ghostly jellyfish, attacking with dangling roots. Variant: much larger than typical waldgeists; their spiritual entanglement with Cloud Paper House has adjusted their Lignify ability into one that transforms flesh into paper; they aren't quite as powerful as normal specimens."
  },
  {
    id: "Event 3",
    key: "ch8-event3",
    name: "Event 3 · Tomorrow's Shadows",
    level: "Low 7",
    tone: "slate",
    creatures: "Familiar Shadows (4) · one per PC",
    text: "About 10 minutes after Event 2 ends, each PC feels a strange chill — “someone just walked over your grave.” Nebulous black forms rise from each PC's own shadow: smoky, distorted ghosts of each character, echoes of the PCs' own hauntings extending back from the future through the mindscape's borders.",
    note: "Each functions as a typical shadow except they lack the ability to spawn shadows from foes, and they have the unusual ability to infest the shadows of those whose forms they duplicate (per the stat block). They focus their attacks only on the PC they duplicate, ignoring others unless they've already slain that PC. The encounter assumes four shadows; adjust so each PC faces their own. They fight until destroyed; when the last falls, a sense of relief washes over the party."
  },
  {
    id: "Wrapping Up",
    key: "ch8-wrapping-up",
    name: "Wrapping Up",
    tone: "gold",
    text: "Tone of the aftermath scales with PC success: extensive destruction → silent, somber town; good containment → defiant, with elders loudly insulting the unseen forces. Tick exactly one rescue tier, plus the mill beat if the mill was lost. Myna Kawaka, owner of Cloud Paper House (W14), visits the next day with gifts (cumulative by lives saved).",
    beats: [
      { key: "ch8-rescue-3", label: "All 3 civilians rescued", note: "tick exactly one", xp: 120, hope: 3, rep: 1 },
      { key: "ch8-rescue-2", label: "2 civilians rescued", note: "tick exactly one · +1 reputation with ONE faction, the party's choice (the book deviates from the both-factions default here)", xp: 80, hope: 1, rep: 1 },
      { key: "ch8-rescue-1", label: "1 civilian rescued", note: "tick exactly one · no Hope gain or loss", xp: 40 },
      { key: "ch8-rescue-0", label: "0 civilians rescued", note: "tick exactly one · lose 2 Hope Points and 1 Reputation Point with each faction", hope: -2, rep: -1 },
      { key: "ch8-mill-collapse", label: "Cloud Paper House collapsed (or damaged)", note: "Lose 1 Security Point; the mill can no longer be used as a work site or to purchase paper/paper products (also unavailable if only damaged). If damaged, spending 4 Security Points repairs it after 2 weeks of work.", security: -1 }
    ],
    treasure: "Myna's Gift (cumulative by lives saved): saved at least 1 → a greater smokestick and four moderate healing potions; saved at least 2 → additionally a vial of everlasting adhesive and four additional moderate healing potions; saved all 3 → a potion of quickness and a runestone bearing a resilient armor rune. Yu Er's Parents' Thanks (if Mr. Jelly was recovered intact): a pair of boots of bounding. Townsfolks' Rewards (if both waldgeists were defeated before they vanished — if allowed to vanish on their own, fears they may return linger): a pair of leather bands of force and a celadon vase decorated with phoenixes worth 150 gp.",
    note: "Shadow-curse follow-up: if the PCs became infested with the familiar shadows' curse and have no curse-removal method, consider having Shinzo deliver a few 4th-rank scrolls of cleanse affliction for free, saying he had a feeling they could use them."
  }
];

const CH8_RESEARCH = {
  title: "Mindscape Shift",
  subtitle: "Another Willowshore · Research 7 — after the three events, Mago Kai's exorcists retreat (strategic, not permanent) to report to Mago Kai at Karahai. The PCs are free to research the Willowshore Mindscape. Uses the research subsystem (Pathfinder GM Core 190). No time limit, but every research day is a day winter's events keep ticking.",
  total: 7,
  modes: [
    {
      name: "Solo Investigations",
      max: 8,
      checks: [
        "DC 21 Academia Lore or DC 21 Library Lore — spend the day with the books and scrolls from the hidden Tan Sugi monastery library",
        "DC 23 Arcana, DC 23 Nature, DC 23 Occultism, or DC 23 Religion"
      ]
    },
    {
      name: "Brainstorming Solutions",
      max: 4,
      checks: [
        "DC 23 Arcana, DC 23 Nature, DC 23 Occultism, or DC 23 Religion — discuss theories with learned locals in Willowshore",
        "DC 25 Diplomacy"
      ]
    }
  ],
  thresholds: [
    { rp: 2, xp: 0, title: "The Failed Ritual", text: "Governor Heh Shan-Bao's failed ritual to offer protection from Kugaptee's influence backfired; it created the mindscape the PCs are trapped in and allowed the fiend's influence to grow stronger." },
    { rp: 4, xp: 0, title: "A Greater Effect at Play", text: "After the PCs' Act 2 triumphs, Kugaptee no longer directly threatens the mindscape, yet it persists — a greater effect is at play. Heh likely performed the ritual in his manor, and when it failed, he and the manor were shunted into their own mindscape parallel to the rest of Willowshore." },
    { rp: 6, xp: 0, title: "A Door Between Mindscapes", text: "Normally one needs the complex ritual *mindscape door* to enter or exit a mindscape. The full ritual is beyond reach with current resources, but a similar, more focused ritual could open a door into Heh Shan-Bao's mindscape because of its metaphysically close proximity. With Heh's aid or references in his manor, the full *mindscape door* ritual (full escape) might be researched." },
    { rp: 8, xp: 120, title: "Mindscape Shift Discovered", text: "The PCs discover the Mindscape Shift ritual — travel to and from Heh Shan-Bao's mindscape. The PCs earn 120 XP." }
  ],
  cast: {
    title: "Casting Mindscape Shift",
    text: "Primary skill check DC 27; secondary skill check DC 22. Must be cast within Willowshore — the wards on the governor's manor prevent appearing inside the structure; casting in the empty lot where the manor once stood puts the PCs at the edge of the lot. Faction subsidy: if a faction at least admires the PCs, it subsidizes the cost once per week; if a faction reveres them, once per day. More than 4 characters: increase the number of targets the ritual transports rather than casting multiple times. Until the PCs cast Mindscape Shift, the plot cannot progress beyond the scheduled Chapter 9 winter events."
  },
  aside: {
    title: "Softened Death",
    text: "Special condition in Heh's mindscape. The PCs are closer to existing as spirits here than they realize (they won't realize the truth until the chapter's end). A PC who dies in Heh Shan-Bao's mindscape doesn't die: their body vanishes from the mindscape and they awaken back in their own Willowshore at the location where Mindscape Shift was first cast, becoming Doomed 1 with 1 Hit Point, otherwise in the same condition as before."
  }
};

const CH8_DREAM = [
  {
    id: "Dream",
    key: "ch8-dream-setting",
    name: "The Governor's Dying Dream",
    tone: "ice",
    text: "Setting. A near-duplicate of the PCs' Willowshore, but much smaller — its borders wrap around the town's boundaries rather than extending into the hinterlands. Buildings restored or destroyed in the PCs' mindscape aren't altered here: the Cerulean Teahouse remains in ruins, Cloud Paper House is still standing, and the governor's manor remains in place in downtown Willowshore. The grim truth: when his ritual failed, Kugaptee devoured Heh entirely — mind, body, and soul; this mindscape sprang from the last flickers of his panicked consciousness as his mind struggles to maintain individuality before Kugaptee absorbs him. Lean into the wrongness.",
    note: "First impression: a lovely winter afternoon — damp warmth, chirping crickets, sweet smells of incense, wood smoke, and cooking food. Residents are friendly to a fault and prioritize routines over conversation; even quarrelsome residents are playful; none recognize the PCs — they treat them as welcome but unknown visitors.",
    phases: [
      "By day: friendly facade.",
      "Toward dusk: the facade thins — stilted residents with glassy stares and vacant answers; swarms of red butterflies cluster on people and the manor walls; bits of town (shop signs, lesser shrines) vanish as if erased; smells become unnaturally luscious, stoking unquenchable, inappropriate hungers.",
      "At nightfall: all pretense drops — townsfolk become unresponsive, shuffle to surround the governor's manor, and stare hungrily at its doors and windows, unable to approach the incense and warding fulus adorning its walls. They wait still and silent until first light, then walk home and sleep; hours later they wake recalling nothing past sundown."
    ]
  },
  {
    id: "Ill Omens",
    key: "ch8-ill-omens",
    name: "Ill Omens",
    tone: "plum",
    text: "Use the 1d10 table while the PCs wander, to unnerve players:\n1. Someone bites a large ripe persimmon; the juice running down their chin smells overwhelmingly sweet but looks exactly like blood; no accusation or persuasion makes them cognizant of this.\n2. A PC feels a taut strand of hair snap across their cheek while walking forward and takes 1 slashing damage; a razor-thin cut appears.\n3. A PC feels something soft brush their skin — a ball of silkworms has fallen from on high and struck them; the caterpillars writhe like maggots (no mulberry trees in winter).\n4. A mysterious black shadow slowly appears on a building near a PC, as if the walls were burning from inside; investigation reveals no fire, but the stink of smoke lingers.\n5. A PC hears a sharp crunching beneath their feet — broken fragments of teeth embedded in their shoes or skin; no lasting damage, just disquiet.\n6. A person minces river fish for fermentation into fish paste; the fish have glassy human eyes and prominent human teeth, unnoticed by the mincer.\n7. A crimson butterfly emerges from an unexpected spot (a cup of tea, or a PC's mouth when they sneeze), flutters a few rounds, drops, and melts into a bloodstain.\n8. A strangely cold breeze rustles through; one random PC hears threatening whispers promising death and doom — in the voice of a different PC.\n9. The light dims as if a cloud passed over sun or moon (no corresponding sky event); the PCs feel a chill in their bones and the hideous gnaw of hunger; a moment later all returns to normal.\n10. During a discussion between at least two PCs, one PC hears another say the name “Kugaptee” in place of another word; the speaker and other listeners hear nothing; the hearer spends the rest of the hour unnerved, certain they're being watched."
  },
  {
    id: "Unprovoked Murder",
    key: "ch8-unprovoked-murder",
    name: "Unprovoked Murder",
    tone: "rust",
    text: "The townsfolk of Heh Shan-Bao's Willowshore are thoughtforms, not noppera-bos. If a PC attacks any citizen, treat them all as Commoners — attacked residents shriek and retreat (fight if cornered). A slain villager collapses and their face fades to a blank, featureless ovoid; their gear turns out to be cheap props. Other townsfolk don't react to violence unless attacked themselves.",
    note: "The PCs may suspect noppera-bos — they aren't, but this foreshadows the noppera-bos at the manor."
  },
  {
    id: "Your Face Is Mine",
    key: "ch8-your-face",
    name: "Your Face Is Mine",
    tone: "slate",
    text: "One noppera-bo for each PC dwells in this mindscape, manifested from Kugaptee's dead dreams, each with the appearance of its associated PC — except for the lack of a face. For now they avoid the PCs and don't attack unless forced to in self-defense or if the PCs fail at pursuing the governor (The Governor Escapes). They observe, the better to mimic behavior later.",
    note: "Townsfolk confuse PCs and doubles (“Oh, welcome back!” / “Did you forget something?”). Persistent PCs can force an early fight — nearby townsfolk treat the noppera-bos as the “real” people; each noppera-bo impersonator focuses its attacks on the PC it imitates."
  },
  {
    id: "Dead Man Walking",
    key: "ch8-dead-man-walking",
    name: "Dead Man Walking",
    level: "Moderate 7",
    tone: "muted",
    creatures: "Heh Shan-Bao (1) · scholar, not a fighter",
    text: "Governor Heh Shan-Bao understands that he and all the people of Willowshore died and were “reborn” trapped between life and death. Each year he attempts to engineer a Transmigrate ritual to escape the mindscape and reincarnate into the living world, hoping to resurrect the townsfolk, evacuate Willowshore, and recruit help to seal Kugaptee more safely. He can never succeed — he'd simply appear in the living world as a ghostly spirit — but this truth eludes him, and his memory resets each cycle (115 attempts so far, all forgotten).",
    note: "When the PCs arrive, he is out gathering supplies at the Hand of Spring. Any resident can direct the PCs to him; alternatively, after an hour of exploring, they spot him walking home; or the GM can arrange a street encounter to avoid clashing with the manor wards."
  },
  {
    id: "Head Off at the Pass",
    key: "ch8-head-off",
    name: "Head Off at the Pass",
    tone: "ember",
    text: "Setup for the chase. If the PCs deduce his destination and ambush him at the manor: each PC attempts DC 25 Stealth against Shan-Bao's Perception DC of 25 to surprise him. If spotted, he flees (potentially a new chase) and avoids home; at dusk desperation forces him to run for the manor — allow the PCs a single round to overcome the Last-Ditch Run obstacle or he slips by into the manor.",
    checks: [
      "DC 25 Stealth to ambush Heh at the manor (opposed by his Perception DC 25)"
    ],
    note: "Flavor — this isn't the man they remember: hair that was pulled up in a courtly style now hangs loose and unkempt; his black outer robe (once silver-embroidered) is ripped at the edges and burned, more a ragged dressing gown; his haunted expression fights off frenzied laughter or an urge to scream. He immediately recognizes the PCs as real — and, with the noppera-bo impersonators posing as the heroes reinforcing the idea, assumes they are sinister beings related to Kugaptee. He attempts to evade the PCs, leading a chase throughout town."
  },
  {
    id: "The Chase",
    key: "ch8-chase",
    name: "The Chase",
    tone: "rust",
    text: "Chase rules: Pathfinder GM Core, page 192. This is a “chase down” chase — the PCs pursue. PCs go second in initiative (pursuers); Governor Heh starts at obstacle 2 (Qi Zhong's Ire) and auto-advances to the next obstacle at the end of each round without rolling. Each round of the chase takes 10 minutes. If the PCs reach an obstacle before the governor has left it → The Governor Caught. If they don't catch up by the end of round 5 → The Governor Escapes.",
    note: "Five obstacles, all level 7: 1. Where Is the Governor? (7 Chase Points), 2. Qi Zhong's Ire (3 CP), 3. Plowing Through Crowds (4 CP), 4. Which Way Did He Go? (4 CP), 5. Last-Ditch (3 CP). See the individual obstacle cards."
  },
  {
    id: "Chase 1",
    key: "ch8-chase-1",
    name: "The Chase · 1: Where Is the Governor?",
    level: "Level 7",
    tone: "muted",
    text: "The chase begins as the PCs learn the governor is shopping at the Hand of Spring and try to approach without giving themselves away.",
    checks: [
      "DC 21 Society or DC 19 Willowshore Lore to identify his official robes",
      "DC 23 Stealth to sneak up before he notices",
      "DC 25 Perception to Sense his Motive and intention to slip away"
    ],
    note: "Chase Points: 7."
  },
  {
    id: "Chase 2",
    key: "ch8-chase-2",
    name: "The Chase · 2: Qi Zhong's Ire",
    level: "Level 7",
    tone: "moss",
    text: "If the PCs wildly succeed at the previous obstacle and reach this one on the chase's first round, they catch the governor before he realizes he's being pursued. Otherwise, the Hand of Spring is in chaos: Doctor Dami and his assistants panic as they work to calm an irate phantom gecko — a magical guardian of the Hand of Spring, frenzied because Heh slashed a small paper shrine devoted to Qi Zhong in the clinic's courtyard to create mayhem and buy a head start.",
    checks: [
      "DC 21 Qi Zhong Lore or DC 21 Religion to placate the guardian gecko spirit with proper prayers",
      "DC 23 Diplomacy to apologize to Doctor Dami for the sacrilege",
      "DC 25 Crafting to quickly repair the damage"
    ],
    note: "Chase Points: 3."
  },
  {
    id: "Chase 3",
    key: "ch8-chase-3",
    name: "The Chase · 3: Plowing Through Crowds",
    level: "Level 7",
    tone: "gold",
    text: "The governor slips through a throng of haggling merchants on a bridge crossing a narrow creek, as if he knows every movement in advance; the PCs face congested bridge and street traffic, dense crowds difficult to navigate.",
    checks: [
      "DC 23 Intimidation to make merchants step aside",
      "DC 25 Acrobatics to balance across the bridge railing",
      "DC 27 Athletics to shove through the crowd"
    ],
    note: "Chase Points: 4. Any PC who has a fly Speed, climb Speed, or the ability to bypass difficult terrain created by crowds gains a +4 circumstance bonus."
  },
  {
    id: "Chase 4",
    key: "ch8-chase-4",
    name: "The Chase · 4: Which Way Did He Go?",
    level: "Level 7",
    tone: "slate",
    text: "In desperation Heh uses a scroll of *Illusory Scene* to create multiple versions of himself wandering the streets and alleyways; the rushed illusion is imperfect — knowledge of magic reveals the flaws.",
    checks: [
      "DC 23 Arcana or DC 23 Occultism to detect flaws in the illusion",
      "DC 25 Survival to follow the real trail",
      "DC 27 Perception to notice reality behind the illusion"
    ],
    note: "Chase Points: 4. Any PC who succeeds at a DC 28 Will save to disbelieve the illusion gains a +4 circumstance bonus; every PC gains the bonus if the illusion is dispelled."
  },
  {
    id: "Chase 5",
    key: "ch8-chase-5",
    name: "The Chase · 5: Last-Ditch",
    level: "Level 7",
    tone: "ember",
    text: "With the entrance to his manor in sight, the governor sprints, desperate to reach his fulu-warded home.",
    checks: [
      "DC 23 Diplomacy or DC 23 Deception to convince the governor you aren't impostors",
      "DC 25 Athletics to run him down",
      "DC 27 Intimidation (yelled threat)"
    ],
    note: "Chase Points: 3. Speed 35+: +2 circumstance bonus to Athletics; Speed 50+ (or who can teleport ahead of him): +4."
  },
  {
    id: "Governor Caught",
    key: "ch8-governor-caught",
    name: "The Governor Caught",
    tone: "gold",
    text: "If the PCs catch up before he reaches the manor, he slumps and prepares for a fight (see Fighting the Governor) but doesn't initiate combat. If not attacked, he agrees to talk but insists on speaking in his manor rather than out in the open. He asks for a brush and ink, retrieves them from his sleeves, and scrawls a symbol on the back of each PC's hand — a seal allowing them to enter his manor without fear of his wards.",
    note: "The seal persists while the PCs remain in the mindscape or until a PC takes an Interact action to wipe it off. If they want to keep exploring, he tells them to arrive at the manor before sunset, insisting repeatedly they don't wash off or smear the ink, then retreats home. Reward: 120 XP if the PCs catch the governor before he reaches his manor.",
    beats: [
      { key: "ch8-governor-caught-xp", label: "Caught the governor before he reached his manor", xp: 120 }
    ]
  },
  {
    id: "Governor Escapes",
    key: "ch8-governor-escapes",
    name: "The Governor Escapes",
    tone: "slate",
    text: "If Heh makes it back to his manor, he locks himself in and refuses to exit while the PCs remain obviously in town. The PCs must overcome the manor wards to break in, or retreat and try to contact him later."
  },
  {
    id: "Manor Wards",
    key: "ch8-manor-wards",
    name: "Manor Wards",
    level: "Severe 7",
    tone: "plum",
    hazard: "Manor Wards (Severe 7) — psyche-fueled wall of fulus",
    text: "Heh knows things grow more dangerous at night and Kugaptee's influence strengthens after sunset. He doesn't realize the townsfolk “survived” in a parallel mindscape; each cycle he comes to believe the town's citizens are all “ghosts” — phantasms who by day ignorantly repeat their duties but grow angry and vengeful at night as they march upon his manor. Tormented by guilt, he covers the manor's outer walls with wards (non-magical fulus and charms) every cycle; by each cycle's end the manor is all but mummified in strips of paper and fluttering prayers. The cumulative effect draws upon Heh's psyche to protect the manor.",
    checks: [
      "DC 25 Occultism or DC 25 Religion to Recall Knowledge (after Investigating the wards as a 10-minute activity)"
    ],
    outcomes: [
      "Success: determine the wards bar undead, evil spirits, and supernatural creatures from other realms — but can't explain why they work against the PCs (possibly because the wards interpret the PCs as spirits, visitors from a different mindscape)."
    ],
    note: "Hazard effect: a PC who approaches within 5 feet of the manor can't proceed further — physically blocked by an invisible wall when the magical ward triggers (a psyche-fueled wall of fulus that bars spirits and otherworld visitors — i.e., the PCs). Bypass options: the seal inked on the PCs' hands (The Governor Caught), or e.g. *Translocate* to teleport into the manor. Reward: award XP for bypassing the hazard if Heh Shan-Bao inks their hands with the seal script that lets them pass freely through the wards."
  },
  {
    id: "Breaking In",
    key: "ch8-breaking-in",
    name: "Breaking Into the Manor",
    tone: "muted",
    text: "Any well-reasoned argument or demand voiced by the PCs automatically succeeds at convincing Shan-Bao to sit down and talk — assuming no fight, proceed with Know and Despair."
  },
  {
    id: "Manor Interior",
    key: "ch8-manor-interior",
    name: "Manor Interior",
    tone: "moss",
    text: "Wooden manor; external walls thick and solid, internal walls made of paper decorated with idyllic country and wilderness scenes. Former guards and treasures are gone — the place feels like a display, not a home. No dangers await; explore freely with the map. During the day nothing of interest.",
    note: "After dark, Governor Heh greets the PCs in the courtyard once he notices their arrival, demanding they leave at once. He prepares for a fight but won't initiate combat — attacking only if the PCs attack first, begin damaging his home, or take hostile action."
  },
  {
    id: "Fighting the Governor",
    key: "ch8-fight-governor",
    name: "Fighting the Governor",
    level: "Moderate 7",
    tone: "ember",
    creatures: "Heh Shan-Bao (1) · a scholar, not a fighter",
    text: "If confronted outside his manor, his goal is to escape the fight and reach home; if attacked in the manor, he fights to the death. He keeps his distance, using as many defensive scrolls as possible at the start of a fight before his more offensive scrolls; only when all scrolls are consumed does he resort to swordplay. He fights to the death knowing the mindscape reset gives him another chance.",
    quote: "I offer thee my soul, Kugaptee! Unbind me from that which was my fate!",
    note: "As he dies, his soul loses its last grip on humanity and he calls out to Kugaptee. A few moments later, the nindoru's presence reacts as detailed in End of the Dream. Kugaptee is a nindoru — the fiend devoured Heh entirely — mind, body, and soul — when his ritual failed."
  },
  {
    id: "Know and Despair",
    key: "ch8-know-despair",
    name: "Know and Despair",
    tone: "plum",
    text: "THE REVEAL (roleplay encounter). If the PCs win the governor's trust, he escorts them to the manor's meeting room in the southeast corner and seats them on cushions around one of the long tables. Despite no servants, a spread of food and drink — hearty meat dishes, hot tea, plenty of alcohol — waits on the table; he accepts it without surprise: “My servants are gone, but my needs are attended nonetheless in this place.” (In truth, the mindscape keeps him nourished.) He pours for everyone with shaking hands. A small black cat peeks from a nest of pillows.",
    quote: "You remember my cat, Black Bean? Such an excellent cat. Such a little cat. You wouldn't be cruel to Black Bean, would you? She would hunt mice for you. She could play with the children.",
    checks: [
      "DC 25 Perception (Sense Motive) to realize he is treating the PCs as if they were ghosts"
    ],
    note: "He sets out small bowls of rice with black chopsticks plunged upright in the center of each, placed sharply next to each teacup, then sits at the head of the table; the cat squeaks and climbs into his lap. The PCs should automatically recognize rice with incense sticks/upright chopsticks as an offering for the dead. This, plus his earlier tea-serving respect, allows the DC 25 Perception (Sense Motive) check. He has difficulty explaining anything verbally unless asked first. As the conversation progresses, the sun sets (regardless of when it began) and scraping and pounding sounds grow at the front doors; Heh ignores them unless the PCs investigate, then demands they leave it alone “unless they want to die” — his wards have somehow weakened, letting the townsfolk try to break in.",
    qa: [
      ["Willowshore's Death (if the PCs question the rice offering, the fulus, or the mindscape)", "“Haven't you figured it out? You must have suspected. My fulus, the townspeople's strange behavior, the impassible barriers around our domain, they all point to the same thing. We are all nothing more than hungry ghosts.” If the PCs protest the word “ghost” due to taboo: “Don't be so naive! Do you think that friendly greetings will save you from the grave? Do you still avoid whistling or doing laundry at night? Are you scared you'll get offended and eat yourselves? Huh? No... we're all dead. We have no breath to cry now. That time is behind us. We've been dead since the last day of spring. Since Kugaptee killed us all.”"],
      ["Cause of Destruction", "“Kugaptee lashed out from his grave beneath the Tan Sugi. What's it they say? 'Cut off the head of an eel, and it can still bite.' … Did you know he was down there? Surely you must have at least suspected. Willowshore is a strange place. Who would have thought a backwater village would have such a saintly legacy, or hide such an unfathomable evil?”"],
      ["Kugaptee's Awakening", "“I did. What a terrible thing I've done. Go ahead, hate me for it. Let your rage turn you from ghosts into vengeful spirits, and devour all who threaten our town!” — then unhinged laughter. After calming: “It was foolish. I wanted to protect Willowshore from Kugaptee, to hide him before the jorogumo found him. An evil as powerful as Kugaptee can't be stopped, only sealed. The more of him that shakes loose, the more he will try to consume us. And so long as that sacred tree remains sickened by his poisons, one of the spider women will be drawn to Kugaptee's grave eventually. They think like me, do you understand? They love powerful servitors and beautiful people. Well, I'm a sinful man, but I'm a thousand sins short of jorogumo. You never loved me or my empire, but you have no idea what the jorogumo will do to you when they arrive.” … “I sought to heal the Tan Sugi, to help it keep the fiend imprisoned, but even in death, Kugaptee was too powerful for me to overcome. I thought I could control him like a mere spirit, but he was beyond what I could have possibly imagined. What a magnificent being! What magnificent evil! A pure-hearted priestess, free of earthly attachments, might have stood a chance. I was nothing to him. He devoured me, every part, inside and out. Do you see now? I am Kugaptee, the beast that slaughtered you all. I am the villain who keeps you imprisoned here!”"],
      ["The Monsters and Hauntings", "“Kugaptee might have killed you, but he's still dead and imprisoned, his tongue lolling hungrily toward your blood. He thinks of nothing but consuming those he has tasted. Those faceless dolls and hissing creatures that plague our town are his first step. When you rashly came here, Kugaptee pulled a tiny piece of your soul away with his teeth and turned it into a servitor. Even now, your doubles hammer at the doors to this manor, eager to take your faces for their own. That's who waits for you when you leave this place. That's what fate has in store for you. You see... ghosts like us can die, too...”"],
      ["“We came from a different mindscape than yours”", "“Nonsense. You've been here all along. Death does things to the mind, you know. It's okay. I understand.” — Nothing the PCs say can convince him in the short time they have."],
      ["“What do we do now?”", "“Why would you ask me? It is too late for forgiveness. We're all dead. In the end, I couldn't protect anything. I failed as a governor. I failed as a savior. I failed as a human being. Were you hoping I could somehow save you? That my magic could bring you back to life? Or do you want to have it out?”"]
    ]
  },
  {
    id: "Asking for Help",
    key: "ch8-asking-help",
    name: "Asking for Help",
    tone: "gold",
    quote: "There might just be a way. We're dead. Kugaptee slew us all. That is to say, I slew us all. But our souls didn't move on to the afterlife. We became trapped here, in cages forged from Kugaptee's dreams and our own fears.",
    text: "Asked directly for aid, he admits the above. “But with the right tools, any cage can be opened. Alas, those tools lie beyond my reach. I can see them, but I can't use them.” … “Perhaps, though... you could finish what I've started? Yes. Yes! You aren't Kugaptee. Your souls and minds remain your own. You can still transmigrate back to the living realm, still reincarnate back from death. Finish what I started! We can all escape if you find the way!”",
    note: "He reaches into his greater sleeves of storage and withdraws a thick journal of loose pages and scribbled scrolls — his total notes on the ritual to strengthen the Tan Sugi tree and the Transmigrate ritual he works on each cycle. He asks one final time: “You won't be cruel to Black Bean, will you? She didn't choose her master. She didn't do anything wrong.”"
  },
  {
    id: "End of the Dream",
    key: "ch8-end-of-dream",
    name: "End of the Dream",
    level: "Severe 7",
    tone: "rust",
    creatures: "Noppera-bo Impersonators (4) · one mimicking each PC",
    text: "The moment he hands over the journal (or alternatively, once he begs Kugaptee to take him after being defeated in combat), Heh Shan-Bao's body lurches and thrashes in convulsions, then rips open with the sound of tearing fabric as a cloud of crimson butterflies erupts from his hollow shell. If in the manor, the doors smash inward and the noppera-bo impersonators surge through with a mass of howling, shrieking townsfolk behind them (if elsewhere, they surge from alleys, doors, or woods). Kugaptee's remaining influence knows the PCs can achieve what the governor couldn't and attempts to stop them here.",
    note: "One noppera-bo mimicking each PC; the howling townsfolk remain behind, cheering on their “heroes” but taking no part in the fight. When slain, each bursts into a cloud of short-lived red butterflies. As soon as the final one is defeated (or as soon as the PCs are slain), the mindscape fades — its purpose for this cycle fulfilled — and the PCs return to the Willowshore mindscape where they cast Mindscape Shift.",
    beats: [
      { key: "ch8-end-xp", label: "Confronted the governor and obtained his notes on the Transmigrate ritual", xp: 120 },
      { key: "ch8-end-help-xp", label: "Received Heh Shan-Bao's help willingly", note: "Grant XP as if the PCs had defeated him in combat — the book gives no fixed number; award per the standard creature-XP rules and adjust manually.", xp: 0 }
    ]
  },
  {
    id: "Treasure",
    key: "ch8-manifestation",
    name: "Treasure · Manifestation",
    tone: "gold",
    treasure: "Heh Shan-Bao's journal — along with his greater choker of elocution, +1 striking longsword, +1 resilient padded armor, and greater sleeves of storage — manifest along with the PCs when they return to their own mindscape. The act of returning has transformed the journal: it still contains dozens of loose sheets and scrolls (containing the important research needed in the next chapter, in addition to the formula for *resurrect*), but the journal itself has become a moderate tome of restorative cleansing.",
    text: "The treasure manifests with the PCs when they return to the Willowshore mindscape at the spot where Mindscape Shift was cast."
  }
];





// Season of Ghosts — Chapter 9: Face-to-Face with Death (Act 3, Chapter 2)
// Data layer for the winter-console macro. Sources: book-accurate digest
// (Act3chapter2.docx + Two Weavers Rework Guide PDF). Rework-only content is
// flagged "Two Weavers rework" on its beats — it is ADD, not in the printed book.

const CH9_TIMELINE = [
  {
    id: "Transition",
    key: "ch9-winter-start",
    name: "Winter in Willowshore",
    when: "Start of winter (weekly thereafter)",
    tone: "ice",
    creatures: "Black Bean the cat (1) · Yami the bakeneko (1)",
    boxed: "Governor Heh's manor has returned to Willowshore as if it had never vanished. Its doors have been ripped open and the warding fulus lie in tatters. Anyone can enter, but no villager dares.",
    text: "With the mindscape over, Heh Shan-Bao's soul becomes Kugaptee's prisoner. Inside the manor, a plaintive wailing comes from a battered cupboard: Black Bean, a little black cat — frightened, clingy, and starving, but otherwise healthy. Yami the bakeneko tolerates Black Bean but bullies him by smacking him on the head.",
    note: "Weekly attrition (the winter clock): every week −1d4 Hope, −1 Food, −1 Security. A depleted track culls population. Run in weekly downtime mode: (1) apply attrition, (2) one downtime activity per PC, (3) play scheduled events — events don't consume the downtime pursuit.",
    checks: [
      "DC 16 Flat Check (start of every week — Unexpected Troubles complication roll)",
      "DC 24 Nature or DC 24 Survival (minimize 1d4 Food Point loss)",
      "DC 24 Diplomacy or DC 24 Performance (minimize 1d4 + 2 Hope Point loss)",
      "DC 24 Athletics or DC 24 Crafting (minimize 1d4 Security Point loss)"
    ],
    outcomes: [
      "Unexpected Troubles table (roll 1–2 / 3–4 / 5–6): 1d4 Food · 1d4 + 2 Hope · 1d4 Security points lost for the week.",
      "Minimizing: critical success — no points lost; success — only 1 point lost; critical failure — twice as many points lost. A particularly helpful spell, ritual, or tactic may increase the result by one degree of success (GM discretion). Other PCs may spend downtime to Aid.",
      "Creating Food saves lives: if a Hope Point loss on a 0-Food week would kill 2d6 locals, the deaths are prevented if the PCs cast enough create food spells to feed a minimum of 12 people within an hour of the loss (regardless of the 2d6 roll). Create food meals last less than a day — they can't bulk up Food Points."
    ],
    beats: [
      { key: "ch9-winter-attrition", label: "Weekly attrition applied", note: "−1d4 Hope, −1 Food, −1 Security each week (tick/untick as the dice fall)." },
      { key: "ch9-winter-troubles", label: "Unexpected Troubles complication", note: "Rolled at the start of every week on a DC 16 Flat Check; see the table above for the Preparation Point loss and its DC 24 minimize check." },
      { key: "ch9-winter-bean", label: "Black Bean found in the manor", note: "Frightened, clingy, starving but healthy — he can be adopted." }
    ]
  },
  {
    id: "Event 4",
    key: "ch9-e4-shinzo",
    name: "Event 4 — Shinzo's Answers",
    when: "Day after returning from Heh's mindscape",
    level: "None (social exposition)",
    tone: "gold",
    creatures: "None — Shinzo and his raven Yix (1)",
    boxed: "“You've uncovered the truth. Congratulations. You don't always. I expect you have many more questions. Now that you know what you are, I am allowed to answer them.”",
    quote: "“Yes, I'm afraid you are, yet you are also still alive. You are trapped between life and death…” — “You have repeated your year a hundred and fifteen times. This may be the last.”",
    text: "Shinzo approaches with his raven companion Yix and suggests retiring to the Cerulean Teahouse, but will answer on the spot. Key revealed facts: the party is dead yet alive, trapped between life and death; unquiet spirits forget the truth when told (\"You forgot my words the second I spoke them\"); Shinzo arrived seven years after Willowshore died and has stood vigil one hundred and eight more; the jorogumo rule Shenmen (\"The spider women are not kind. They take tribute in silver, lumber, and people…\"); Willowshore lies in ruins and Mago Kai seeks to reclaim it as a base to harvest lumber. He cannot grant life or kill without orders, but can bring information and things from the living world and foretell the future: a severe winter storm in three weeks, with heavy fog, and a \"version\" of the jorogumo princess Ren Mei Li who will visit during the winter solstice to force fealty (\"She isn't the actual princess, but she thinks she is, and she can still kill you.\").",
    note: "The plan: complete Governor Heh's Transmigrate ritual. \"Mago Kai has taken your Eternal Lantern's flame as a trophy… without it… the most you can do with transmigration is to manifest temporarily as spirits… Return the lantern's flame from Karahai to Willowshore's ruins, and it will serve as an anchor and a lure.\" Yix is a nosoi psychopomp minder — Shinzo is being punished by Pharasma for caring too much. He returns every other week to trade, offer help, and advice; his payments go to others in the Great Beyond (\"Do not mistake me for a generous friend.\"). If the PCs slew Governor Heh in his mindscape: \"Save him? You're the ones who destroyed what little of his soul was left to him.\"",
    checks: [
      "DC 26 Occultism or DC 26 Religion (recognize a shinigami as an incarnation of cosmic law; Shinzo has an unusually human personality)",
      "DC 24 Perception (Sense Motive — Shinzo is invested in Willowshore returning to life far more than an unbiased shinigami should be; he and his raven are at odds about it)",
      "DC 20 Diplomacy (Spreading the News — credit Heh with the ritual to minimize the Security loss)"
    ],
    treasure: "Shinzo's Gifts — four functional replicas of famous magical items once owned by notables from the distant past (names on the Heroic Legacies handout).",
    beats: [
      { key: "ch9-e4-reveal", label: "The 115 loops revealed — the plan and Mago Kai", xp: 120, note: "120 XP for discovering the 115-cycle repetition and learning of Mago Kai." },
      { key: "ch9-e4-news-dead", label: "Spreading the News: the town is dead", hope: -2, note: "−2d6 Hope Points, minimized to −2 if the PCs also spread the word that a ritual (from Governor Heh) may bring everyone back to life." },
      { key: "ch9-e4-news-blame", label: "Spreading the News: blaming Heh", security: -1, note: "−1d4 + 2 Security Points, reduced to −1 with a DC 20 Diplomacy check crediting Heh with the ritual. Sitting on big truths that later leak: −2 Reputation Points with each faction every time a significant hidden truth is made public." }
    ]
  },
  {
    id: "Event 5",
    key: "ch9-e5-faceless",
    name: "Event 5 — Faceless Evil",
    when: "Begins the day after Heh's mindscape; incidents every 1d4 days",
    level: "Moderate 8",
    tone: "slate",
    creatures: "Noppera-bo impersonators (4)",
    boxed: "“You think you're clever? I know what you did — stuffing needles into the dumplings you gave me!”",
    text: "Four noppera-bo impersonate the PCs, duplicating their faces and operating where the PCs don't frequent. Left alone, they cause an incident every 1d4 days — needles in food, insults, vandalism — escalating to murder. The party is alerted the day after the first incident by an unbefriended or antagonistic NPC accusing a PC; a DC 20 Diplomacy check by the accused PC clears the air — on failure the party loses 1 Reputation Point from a faction of the GM's choice (track lost Reputation; it can be regained). Every 1d4 days brings another incident and −1 Reputation Point; on the 5th prank a minor NPC dies (population −1); every prank after that is a murder, and each murder costs 3 Reputation Points from both factions. The impersonators fight to the death, gathering as a group.",
    note: "Investigation (the resolution): once per day a PC can spend a few hours (in addition to weekly downtime) Investigating with a secret check. Success confirms the impersonators; critical success means they don't immediately notice (ambush/lure opportunity).",
    checks: [
      "DC 20 Diplomacy (defuse the accusation; failure: −1 Reputation Point from a faction of the GM's choice)",
      "DC 22 Willowshore Lore, DC 24 Society, or DC 26 Perception (secret Investigation — once per day, a few hours)"
    ],
    outcomes: [
      "Publicly revealing the impersonators costs −1 Hope Point (or −1d6 if at least one murder occurred).",
      "All Reputation lost to this event is restored if no townsfolk were murdered; each murder lowers the restored total by 2.",
      "40 XP if no townsfolk were murdered; −10 XP per murdered local."
    ],
    beats: [
      { key: "ch9-e5-reveal", label: "Impersonators publicly revealed", hope: -1, xp: 40, note: "−1 Hope (or −1d6 if ≥1 murder); 40 XP if no townsfolk were murdered, −10 XP per murdered local (adjust the XP tick accordingly)." },
      { key: "ch9-e5-rep", label: "Reputation fallout resolved", note: "Each incident cost −1 Reputation Point; the 5th prank killed a minor NPC (population −1); each murder cost 3 Reputation Points from both factions. On resolution, all Reputation lost to this event is restored if no one was murdered — each murder lowers the restored total by 2." }
    ]
  },
  {
    id: "Event 6",
    key: "ch9-e6-gifts",
    name: "Event 6 — Little Gifts",
    when: "Every 7 days",
    tone: "gold",
    creatures: "Yami the bakeneko (1)",
    text: "If befriended in the previous act, Yami the bakeneko brings gifts to favored PCs each week. Yami tolerates Black Bean but smacks him on the head. Roll 1d8 on Yami's Gift table:",
    outcomes: [
      "1 — A partially chewed origami crane.",
      "2 — A partially eaten sparrow (possibly still alive).",
      "3 — A squished lemon.",
      "4 — A fresh dumpling from Mama Bao's.",
      "5 — A grim trophy talisman that appears to be a still-bloody human ear. *",
      "6 — A waterproof bag of saffron worth 100 gp. *",
      "7 — A greater smoke ball. *",
      "8 — A greater mage's hat currently in the form of a zhanjiao putou — a black hat with two long, stiff, wing-like flaps. *",
      "* This gift can only be rolled once; treat further rolls of this gift as 1 platinum coin."
    ]
  },
  {
    id: "Event 7",
    key: "ch9-e7-fox",
    name: "Event 7 — The Fox Ghost",
    when: "Any",
    level: "Trivial 8",
    tone: "ember",
    creatures: "Rin, kitsune ghost (1)",
    boxed: "A half-feral girl in a singed dress clutches a burned fox kit. She partially burns anything she touches.",
    quote: "“As soon as I can go, I shall, but this place keeps me here for now.”",
    text: "Rin is a kitsune ghost (Creature 8) who died with her baby brother Yuu when a trapper village burned her mountain home. She hates human trappers and humans; her attitude begins unfriendly. Attack, threat, or a critical failure on Diplomacy inflicts her foxfire curse on the offender and she flees. Indifferent: she answers questions (knows little), stays where found, but refuses to enter Willowshore. Friendly: she plays with local youths. Further help awaits at the end of the act (Concluding the Act).",
    checks: [
      "DC 27 Diplomacy (stop her fleeing; kitsune PCs gain a +2 circumstance bonus)",
      "DC 28 Survival (track her via singe marks)"
    ],
    treasure: "Rin's Gift — if her attitude becomes friendly, she offers a flat stone that floats and ignites, then cools into a flaming weapon runestone (once only).",
    beats: [
      { key: "ch9-e7-friendly", label: "Rin's friendship won", xp: 120, note: "120 XP if her attitude becomes friendly." },
      { key: "ch9-e7-moves-in", label: "Rin comes to live in Willowshore", hope: -1, note: "−1d4 Hope Points initially; then +1 Hope Point at the start of each following week (attrition calculation) as locals warm to her." }
    ]
  },
  {
    id: "Event 8",
    key: "ch9-e8-home",
    name: "Event 8 — A Lonely Home",
    when: "Day 10",
    level: "Trivial 8",
    tone: "slate",
    creatures: "Tenon, silsyche kami (1)",
    boxed: "“No! I need to stay here, at home, where I've always belonged!”",
    text: "Aruka (kitsune woman rescued at Cloud Paper House; substitute another loved NPC if she died) approaches: Myna Kawaka, the tengu guild leader, is holed up in his parents' abandoned farmhouse in the woods south of town next to a mostly collapsed barn (area W34), delirious and crying. The house is haunted — debris flew. Aruka won't enter the clearing. Tenon, a silsyche kami (Creature 8) bound to the home, uses Hallucinatory Home to trap PCs on entry; if that fails he tearfully asks them to stay. He won't attack unless provoked, fights to the death, then rejuvenates a few days later — and dies permanently if the house crumbles.",
    note: "Solving Tenon's Problem (Exploration / secret activity): one day considering a solution and speaking to Kawaka and others; attemptable once only. Other PCs Aid. If a PC volunteers to live in the farmhouse and repair it, adjust the result up one degree of success.",
    checks: [
      "DC 22 Diplomacy, DC 24 Society, or DC 24 Willowshore Lore (solve Tenon's problem — once only)",
      "DC 20 Diplomacy, DC 20 Society, or DC 20 Willowshore Lore (Aid)"
    ],
    outcomes: [
      "Critical success: support from Kawaka, Old Matsuki, and artisans; house shored up for free; visits arranged — 120 XP and 1d4 + 1 Hope Points.",
      "Success: as critical success, but the PCs must spend 400 gp or the town 2 Security Points — 80 XP and 1 Hope Point.",
      "Failure: no volunteers; a PC must keep Tenon company weekly as downtime; if a week is skipped, Tenon's despair collapses the house, killing him permanently — 40 XP and −1 Hope Point.",
      "Critical failure: a grief-stricken local volunteers out of obligation; grief and Tenon compel them to burn the house down with themselves inside — population −1 and −1d4 + 1 Hope Points."
    ],
    treasure: "Floorboards — befriending Tenon reveals his mother's +1 thundering shortbow hidden below a floorboard; Kawaka gifts it to the PCs.",
    beats: [
      { key: "ch9-e8-outcome-crit", label: "Tenon's problem solved — critical success", xp: 120, hope: 1, note: "Tick exactly one outcome. 1d4 + 1 Hope Points; house shored up for free." },
      { key: "ch9-e8-outcome-success", label: "Tenon's problem solved — success", xp: 80, hope: 1, note: "Tick exactly one outcome. Costs 400 gp or 2 Security Points." },
      { key: "ch9-e8-outcome-failure", label: "Tenon's problem solved — failure", xp: 40, hope: -1, note: "Tick exactly one outcome. A PC must keep Tenon company weekly as downtime, or his despair collapses the house (he dies permanently)." },
      { key: "ch9-e8-outcome-critfail", label: "Tenon's problem solved — critical failure", hope: -1, note: "Tick exactly one outcome. −1d4 + 1 Hope Points; population −1 (a grief-stricken local burns the house down with themselves inside)." }
    ]
  },
  {
    id: "Event 9",
    key: "ch9-e9-crane",
    name: "Event 9 — The Crane-Wife",
    when: "Any",
    tone: "muted",
    creatures: "None — a nameless mourner",
    text: "A local hunter kills a large crane and cooks it. The next day a strange, beautiful, nameless woman arrives, sobbing and calling out the most compassionate or nature-tied PC's name — her husband was slain and she seeks death too. She won't leave until killed or starved, and does not become a crane on death. She could be a thoughtform of collective despair, a naiad or nixie, or a grudge-prank with a Mage's Hat — however it's handled matters.",
    note: "Resolved via the Victory Points subsystem (Pathfinder GM Core 184): DC 24 checks to earn Victory Points. Deception, Diplomacy, or Intimidation are great options; Society or Willowshore Lore (folklore), or Nature (primal magic) also work. Each PC can attempt one skill check — max four attempts total.",
    checks: [
      "DC 18 Willowshore Lore or DC 20 Society (understand why this is worrying — cranes mate for life; critical success recalls the old story of the grieving spouse who came seeking death)",
      "DC 24 (any appropriate skill — each PC may attempt one check; max four attempts total)"
    ],
    outcomes: [
      "5+ Victory Points: the town approves — 120 XP.",
      "2–4 Victory Points: 60 XP and −1 Hope Point.",
      "1 or fewer Victory Points: no XP and −1d4 + 1 Hope Points."
    ],
    beats: [
      { key: "ch9-e9-vp5", label: "Crane-wife resolved — 5+ Victory Points", xp: 120, note: "Tick exactly one outcome." },
      { key: "ch9-e9-vp2", label: "Crane-wife resolved — 2–4 Victory Points", xp: 60, hope: -1, note: "Tick exactly one outcome." },
      { key: "ch9-e9-vp1", label: "Crane-wife resolved — 1 or fewer Victory Points", hope: -1, note: "Tick exactly one outcome. No XP; −1d4 + 1 Hope Points." }
    ]
  },
  {
    id: "Event 10",
    key: "ch9-e10-festival",
    name: "Event 10 — The Claylight Festival",
    when: "Day 21 (winter solstice — first actual day of winter)",
    tone: "gold",
    creatures: "Ouh Ba-Ming (1)",
    text: "Ouh Ba-Ming (W16), caretaker of Nine Ear Shrine, proposes the old Claylight tradition: clay huts with small lights in the fields, grilled vegetables, and prayers. Each participating PC devotes that week's downtime to preparing their hut; villagers praise or mock accordingly.",
    note: "Sweetest Solstice ritual (if learned in the previous act, may be included): critical success → +4 Food Points; success → +1 Food Point; critical failure → poisons the town, −2d6 Preparation Points, at least half from Hope, the remainder from Hope/Food/Security (PCs' choice).",
    checks: [
      "DC 25 Crafting (prepare a clay hut — that week's downtime)",
      "DC 24 Religion (prepare a clay hut — that week's downtime)"
    ],
    outcomes: [
      "At least one PC succeeds: +1 Hope Point and 80 XP.",
      "All PCs take part and at least one succeeds: +2 Hope Points and 120 XP.",
      "No PC takes part: the festival fails — −1d4 Hope Points."
    ],
    treasure: "Front Porch — for each PC who succeeded, a moderate healing potion (max 4) appears anonymously on the Cerulean Teahouse's front porch the next morning.",
    beats: [
      { key: "ch9-e10-fest", label: "Claylight Festival held", hope: 1, xp: 80, note: "+1 Hope and 80 XP if ≥1 PC succeeds; +2 Hope and 120 XP if all PCs took part and ≥1 succeeded; −1d4 Hope if no PC took part." },
      { key: "ch9-e10-solstice", label: "Sweetest Solstice ritual", food: 1, note: "Critical success: +4 Food. Success: +1 Food. Critical failure: −2d6 Preparation Points (at least half from Hope, remainder from Hope/Food/Security at the PCs' choice)." }
    ]
  },
  {
    id: "Event 11",
    key: "ch9-e11-nosois",
    name: "Event 11 — Nosois' Brunch",
    when: "Any",
    level: "Moderate 8",
    tone: "plum",
    creatures: "Nosois (4) — Yamaguchi, Sakaguchi, Iguchi, Noguchi",
    text: "Strange crows with glowing green eyes — Yix's professional colleagues — arrive for tea. They believe Shinzo is biased toward mortals (his failure to assist Mago Kai's exorcists was the last straw) and scheme to help banish the mindscape. They don't interfere unless a tempting opportunity (such as killing a nindoru) arises. If confronted in combat, they flee at once and abandon the mindscape when Shinzo next leaves — counts as critically failing the following social encounter.",
    note: "Tea with the Nosois — 4 steps in order; split labor as the PCs wish; failures in one area can be compensated elsewhere. Results are total successes (+1 per critical success, −1 per critical failure).",
    checks: [
      "DC 22 Tea Lore or DC 24 Crafting (prepare the tea; Aid with Tea Lore, Crafting, or Athletics for grinding leaves)",
      "DC 22 Athletics (pounding rice) or DC 24 Crafting (preparing) — the sweet mochi mountain",
      "DC 22 Tea Lore or DC 24 Society (flawless ceremony)",
      "DC 24 Deception or DC 24 Diplomacy (decorums kept; others may Aid only with Diplomacy)"
    ],
    outcomes: [
      "1 or fewer successes: the nosois leave offended; in the final chapter of this act they aid the exorcists in repelling the PCs' ghostly incursion (area C9).",
      "2–3 successes: they lose interest and depart; nothing gained.",
      "4–5 successes: they gossip — Shinzo is still being punished for an infraction against Pharasma, and the punishment prevents him from directly interfering with mortals' fates (each nosoi claims a different story: abused powers / spared a mortal life / let a fiend escape / fell in love with a human). They pay and promise no further trouble while the townsfolk don't offend Pharasma.",
      "6+ successes: as 4–5, plus they offer later aid — \"take the time to purify themselves at any shrine of Pharasma they might encounter… in the living world\" (a reference to area C9 of Karahai in Chapter 10)."
    ],
    treasure: "Nosois' Payment (4+ successes) — a gallows tooth, a jade bauble, a silver and sapphire ring worth 800 gp, and a frost weapon runestone.",
    beats: [
      { key: "ch9-e11-xp", label: "Brunch resolved", xp: 120, note: "120 XP at 4+ successes; 60 XP for 1–3 successes (adjust the XP tick accordingly)." }
    ]
  },
  {
    id: "Event 12",
    key: "ch9-e12-seance-pointer",
    name: "Event 12 — The Seance",
    when: "Any (before Chapter 10)",
    level: "Moderate 8",
    tone: "plum",
    creatures: "Cao Chen · Pan Fenfang · Sha Guanghao (exorcists)",
    text: "Set-piece card in CH9_PIECES. An influence encounter at Karahai's shrine (C11), led by senior exorcist Cao Chen. DC 26 Will saves to answer, DC 24 Will vs Drained at the end, 80/120 XP. Reveals the holy bell is infused with the Eternal Lantern's stolen light — confirming the lantern is unlit and why only 4th-rank Transmigrate can be cast. Carries Two Weavers rework seed #1."
  },
  {
    id: "Event 13",
    key: "ch9-e13-spider-pointer",
    name: "Event 13 — Interview with a Spider",
    when: "Day 71",
    level: "Moderate 8",
    tone: "plum",
    creatures: "Ren Mei Li (1) · thoughtform servants (4)",
    text: "Set-piece card in CH9_PIECES. Ren Mei Li, psyche-copy of the jorogumo princess, arrives expecting a royal welcome at the Cerulean Teahouse. Influence 12 for the Hardwood Chest and the silver collars; below 6 Influence Points (or any attack) she fights — Parting Ways, Extreme 9. 160 XP and 1d4 Hope for a peaceful exit. Carries Two Weavers rework seed #2."
  },
  {
    id: "Event 14",
    key: "ch9-e14-trees",
    name: "Event 14 — The Trees Live",
    when: "Any (optional)",
    level: "Moderate 8",
    tone: "moss",
    creatures: "Arboreal reapers (2) · awakened tree (1)",
    text: "Forest guardians who despise the villagers for past damage demand an accounting. Initial attitude is unfriendly; made indifferent, they let the PCs go; if they abducted an NPC, the NPC is released only at friendly. Any failed attitude attempt shifts them to hostile and they attack to the death.",
    outcomes: [
      "Peaceful solution: XP as if the creatures were defeated in combat.",
      "One week later, a delivery of naturally dead wood appears: +2 Security Points."
    ],
    beats: [
      { key: "ch9-e14-peace", label: "Peaceful resolution with the forest guardians", security: 2, note: "XP as if the creatures were defeated in combat (book-fixed award — GM grants per creature XP). +2 Security Points one week later when the naturally dead wood arrives." }
    ]
  },
  {
    id: "Event 15",
    key: "ch9-e15-reprisal",
    name: "Event 15 — Reprisal",
    when: "Any (optional)",
    level: "Low 8",
    tone: "ember",
    creatures: "Kugaptee's centipede (1)",
    quote: "“Meat… flesh… bones… fingers… hair… skin… eyes…” — “You must pay! Kugaptee will rise! Time to die!”",
    text: "Kugaptee's Centipede — a bright orange centipede nearly a hundred feet long, formed from the dead fiend's thoughts — attacks PCs in the hinterlands or the town's outskirts. If it attacks the town it scuttles toward the PCs; if the party is too slow or flees, Security Points are reduced by 1d4.",
    beats: [
      { key: "ch9-e15-town", label: "The centipede attacks the town", security: -1, note: "−1d4 Security Points if the party is too slow or flees; award XP as if the creature were defeated in combat (book-fixed award — GM grants per creature XP)." }
    ]
  },
  {
    id: "Event 16",
    key: "ch9-e16-favor",
    name: "Event 16 — One Kind Favor",
    when: "Any (optional)",
    level: "Moderate 8",
    tone: "slate",
    creatures: "Ghost (1) · forgotten spirits, revenants (4)",
    quote: "“It wasn't us.” — “We didn't kill her.” — “It was an accident!” — “You'll die just as well!”",
    text: "Rumors of a haunting: a ghost with black hair and white eyes stands silent in a local cemetery, vanishing at dawn. If attacked she vanishes unharmed and returns the next night. Asked what she wants, she beckons and glides into the woods on a circuitous 3-hour route (she nods, counting steps; floats along river edges), stopping at a dry riverbed and pointing at a gravelly patch. About 3 feet down: human bones wrapped in a burlap shroud. She then leads the party back by a direct 30-minute route and points at her original spot — they must rebury the bones there. If they don't, she follows them personally (mirrors, watching them sleep, random distractions).",
    note: "Four long-dead criminals who killed her dig out of their graves. The revenants attack ghost and PCs alike; if the ghost is destroyed she rejuvenates in 2d4 days and the revenants instead focus exclusively on the most empathetic or supportive PC. Defeating the revenants and burying the bones → she sobs in relief and bows. Who she was remains a mystery the GM may resolve or leave open.",
    checks: [
      "DC 22 Survival or DC 25 Perception (keep pace on the journey; others Aid; failure — everyone must hustle and becomes Fatigued)",
      "DC 21 Athletics (two successful checks, or one critical success, digging with proper tools)",
      "DC 25 Athletics (digging by hand; critical failure — the diggers become Fatigued)"
    ],
    beats: [
      { key: "ch9-e16-reburial", label: "Bones reburied", note: "XP as if the ghost were defeated in combat (book-fixed award — GM grants per creature XP)." }
    ]
  },
  {
    id: "Climax",
    key: "ch9-blad-pointer",
    name: "Between Life and Death",
    when: "Day 72 (New Year's Day) or later",
    level: "Severe 8",
    tone: "slate",
    creatures: "Kagekuma nindorus (3)",
    text: "Set-piece card in CH9_PIECES. Cast Transmigrate, then fight through Kugaptee's crumb-catcher borderland (B1–B5) and step through the portal to Dawnstep Bridge — 80 XP, and any PC who died here wakes Doomed 1 as long as at least one PC stepped through."
  }
];

const CH9_RESEARCH = {
  title: "Transmigration",
  subtitle: "Research 8 — completing Governor Heh's ritual to return Willowshore to life. Reading Heh's journals and notes takes 8 hours of work (written in Common); the Ritual Notes handout summarizes the findings. A PC who knows Reincarnate or Resurrect reduces all research check DCs by 2; knowing both reduces them by 4.",
  total: 8,
  modes: [
    { name: "Solo Investigations", max: 3, checks: ["DC 22 Academia Lore", "DC 22 Library Lore", "DC 24 Arcana", "DC 24 Occultism"] },
    { name: "Consulting Experts", max: 2, note: "Max 2 RP per NPC.", checks: ["DC 22 Arcana (Igawa Jubei at Mother's Coil)", "DC 22 Nature (the kodama Great Willow)", "DC 22 Occultism (Shinzo during a visit)", "DC 22 Religion (Elizeth Candora at Her Fluvial Lady of Souls)"] },
    { name: "Introspection at a Shrine", max: 3, checks: ["DC 24 Occultism", "DC 24 Religion"] }
  ],
  thresholds: [
    { rp: 2, xp: 10, title: "The pathway home", text: "No dead body is needed; the Eternal Lantern's light can serve as the pathway home." },
    { rp: 4, xp: 20, title: "The components", text: "Feathers from a living heron (the heron must still be alive when cast), rare incense, and specially treated slats of sakaki wood (expensive and time-consuming to prepare). Hints of a more powerful version that would free many more souls." },
    { rp: 6, xp: 30, title: "The kiln and clay shell", text: "Internalize the sacrifice: fire the traveler in a clay shell within a huge kiln (a botch means painful, potentially lethal burns) instead of sacrificing one life for another. A greater ritual might even transmigrate the town's structures." },
    { rp: 8, xp: 60, title: "Formula complete", text: "The Transmigrate formula is completed. As long as the Eternal Lantern remains unlit in the living world, only the 4th-rank version can be cast — not the 5th-rank permanent version." }
  ],
  components: [
    { key: "kiln", label: "Build the kiln", note: "1 week of work, 25 gp in resources, DC 20 Crafting. Free and automatic in a week with the support of Eternal Blaze Ironworks (owner Yong Wu-Xiu — pottery is outside her skill set, but forges and fire let her build it)." },
    { key: "feathers", label: "Gather heron feathers", note: "1 day hunting in the hinterlands, DC 20 Survival — success: enough feathers for 2 casts; critical success: 6 casts. Free via Silvermist Lodge or Nine Ear Shrine (given a day to gather)." },
    { key: "slats", label: "Prepare the sakaki slats", note: "Soak dozens of slats in special oils — 25 gp (either faction can pay if the PCs are at least admired by one), no check, roughly six weeks, and there is no way to shorten it. The slats are ready on Day 44 (mid-winter) — the earliest possible cast. GM note: consider reducing the time so the PCs get at least a few weeks for Chapter 10." }
  ],
  cast: {
    title: "The casting",
    text: "The party casts Transmigrate on New Year's Day (Day 72), the earliest possible date once the sakaki slats are ready. As the flames bake them in their clay shells, a baleful voice resembling Governor Heh's orders them to give in to desire and be consumed by emotion — have the players describe their characters' strongest feelings; these guide the ghostly powers they gain in modern Shenmen (Haunting the Living, Chapter 10). While the Eternal Lantern stays unlit in the living world, only the 4th-rank version works: the PCs manifest temporarily as spirits and do NOT wake in the living world. The 5th-rank permanent version becomes castable only once the lantern's flame is recovered and relit in Chapter 10 (Karahai)."
  }
};

const CH9_PIECES = [
  {
    id: "Event 12",
    key: "ch9-seance",
    name: "The Seance",
    when: "Any (before Chapter 10)",
    level: "Moderate 8",
    tone: "plum",
    creatures: "Cao Chen (1) · Pan Fenfang (1) · Sha Guanghao (1) · caged songbirds (5)",
    boxed: "You feel yourselves yanked away through layers of reality… into a small windowless room that's dimly lit by burning torches and mostly occupied by a massive bronze temple bell that hangs from the ceiling. Five small cages containing colorful birds are set in a large circle, and a number of scrolls equal to the number of PCs lie on the ground inside this circle. Flickering but strangely familiar-looking light radiates down from the bell above to illuminate those scrolls…",
    text: "About a month after the exorcists' first failed attempt, senior exorcist Cao Chen leads the seance in Karahai's shrine (area C11), joined by Pan Fenfang and Sha \"Shagua\" Guanghao. To the priests, the PCs appear as indistinguishable shimmering forms; rounds last a few minutes. The PCs can't take any actions other than those described during this encounter. The temple bell is a powerful holy item that wards against ghosts and interferes with spiritual and undead magic. If the PCs mention Kugaptee, Chen becomes pensive — his inclination remains to banish both the PCs and Kugaptee.",
    note: "Key reveal: the bell is infused with light stolen from the Eternal Lantern — confirming the lantern is unlit in the living world, which is why only the 4th-rank version of Transmigrate can be cast.",
    checks: [
      "DC 24 Perception (realize you've been pulled east into a chamber within Karahai)",
      "DC 24 Occultism or DC 24 Religion (Recall Knowledge — the center of a seance; the bell wards against ghosts)",
      "DC 26 Will (compelled to answer; success — any PC may answer however they want; failure — the targeted PC answers truthfully)",
      "DC 24 Deception, DC 24 Diplomacy, or DC 24 Intimidation (answer without compulsion; others Aid; success — +2 status bonus to all Influence/Discovery checks that round, +4 on critical success; critical failure — −2 status penalty)",
      "DC 22 Occultism or DC 22 Religion (Recall Knowledge — Pan Fenfang's crimson butterflies reveal nindoru influence)",
      "DC 24 Will (ending — or become Drained 1, Drained 2 on a critical failure)",
      "DC 24 Diplomacy (answer the shocked townsfolk's questions afterward; failure — they fear they'll be next, −1d4 Hope Points)"
    ],
    qa: [
      ["Round 1 — \"Who are you?\"", "Names, roles, and Willowshore citizenship."],
      ["Round 2 — \"What do you want?\"", "\"We seek to come back to life.\" — the PCs may add that they oppose Kugaptee's escape."],
      ["Round 3 — \"Why haven't you moved on?\"", "\"We cannot; we are trapped here.\" — the PCs may mention Kugaptee's will."],
      ["Round 4 — \"How did you die?\"", "\"We were slain when our governor failed at a ritual to imprison the fiend Kugaptee.\""]
    ],
    phases: [
      "Step 1 — Answer: Chen asks that round's question; a randomly determined PC is compelled to reply (not re-selected in later rounds) and must attempt a DC 26 Will save. If no PC is compelled, one PC may answer with DC 24 Deception, Diplomacy, or Intimidation.",
      "Step 2 — Influence/Discover: during the priests' chanting, each PC may Influence or Discover on the priest of their choice.",
      "Ending the Seance: Chen taps the bell with his torch; the PCs are hurled back. Each PC attempts a DC 24 Will save or becomes Drained 1 (Drained 2 on a critical failure). They wake unconscious on the floor; nearby townsfolk are shocked."
    ],
    outcomes: [
      "80 XP if the party gained a total of 4 Influence Points with at least one exorcist.",
      "120 XP if they gained all 12 possible Influence Points among all three."
    ],
    influence: [
      { key: "ch9-seance-chen", label: "Cao Chen — senior exorcist", max: 4, note: "Discovery DC 24 Occultism / DC 26 Perception / DC 22 Religion. Influence DC 22 Diplomacy / DC 24 Religion / DC 26 Intimidation. Influence 2: \"Fear not, my students. We are perfectly safe here. Without a focused purpose, these century-old phantoms can no more affect the material world than a fish can light a fire.\"", reveal: "Influence 4: \"I sense your strength, spirits, but our holy bell, infused with light from your own Eternal Lantern, prevents your fell influence and magic from seeping through to our world. As long as this bell shines in Karahai, you cannot harm us…\" — the key reveal. Cao Chen later stays the shrine maiden's attack in C11 (Chapter 10)." },
      { key: "ch9-seance-fenfang", label: "Pan Fenfang — the nervous exorcist", max: 4, note: "Discovery DC 21 Occultism / DC 23 Perception / DC 25 Religion. Influence DC 21 Deception / DC 23 Intimidation / DC 25 Religion. Weakness: she secretly joined a cult of nindoru followers — a projection of Kugaptee answered her prayers, posing as the spirit of Tan Sui-Jing. Mentioning nindorus reduces all her Discovery/Influence DCs by 1; mentioning Kugaptee reduces them by 2.", reveal: "She is unknowingly influenced by nindorus — the crimson butterflies glimpsed in her mind — leading to the nindoru corruption at C14 (Chapter 10)." },
      { key: "ch9-seance-guanghao", label: "Sha \"Shagua\" Guanghao — the brash apprentice", max: 4, note: "Discovery DC 20 Occultism / DC 24 Perception / DC 22 Religion. Influence DC 20 Deception / DC 22 Religion / DC 24 Diplomacy. Influence 4: \"Lord Mago will come in here with his magic bell ringer and banish you away! Like this—hwahhh!\" (slapped by Fenfang: \"That's not how it works! Did you even read the codex scroll like I told you?\")", reveal: "He is the magic bell ringer — the one who rings Mago Kai's bell at C13 (Chapter 10)." }
    ],
    beats: [
      { key: "ch9-seance-xp80", label: "Seance resolved — 4+ Influence with at least one exorcist", xp: 80, note: "Tick exactly one XP beat." },
      { key: "ch9-seance-xp120", label: "Seance resolved — all 12 Influence Points among all three exorcists", xp: 120, note: "Tick exactly one XP beat; includes the 80 XP tier." },
      { key: "ch9-seance-news", label: "Answering the townsfolk's questions", hope: -1, note: "DC 24 Diplomacy; on failure the townsfolk fear they'll be next — −1d4 Hope Points." },
      { key: "ch9-seance-rework1", label: "Rework seed: a woman in crimson silks", note: "Two Weavers rework — ADD, optional, not in the printed book. Somewhere in the priests' chatter, one exorcist mutters about a woman in crimson silks who visited Mago Kai's camp and left him terrified. Drop it as an aside the party can chase or ignore — the first whisper of the rival jorogumo who drives the Act 4 rework. Don't name her or explain; the unease is the point." }
    ]
  },
  {
    id: "Event 13",
    key: "ch9-spider",
    name: "Interview with a Spider",
    when: "Day 71",
    level: "Moderate 8",
    tone: "plum",
    creatures: "Ren Mei Li (1) · thoughtform servants (4)",
    boxed: "A handsome young man wearing a silver collar arrives at sunrise and announces the town is under Lady Lang Loi's rulership and that Lady Ren arrives that evening expecting a royal welcome — then fades away. He was a precursor thoughtform of the princess.",
    text: "The town elder contacts the PCs; the Cerulean Teahouse is the assumed venue. If the PCs are still in Chapter 10, run this after their return, a day before casting the 5th-level version of Transmigrate. Ren Mei Li is a psyche-copy of the jorogumo princess — not the real one, but she thinks she is, and she can still kill you. She arrives unarmed and unguarded as a show of confidence.",
    note: "Resistances: peachwood or tengu presence → +2 to all DCs to Influence her (a show of burning the item or arresting the tengu placates her; refusal → +2 DCs thereafter). Jealousy of charming or pretty women → +2 DC (a Deception disguise vs her Perception DC, or willingly scarring one's own face, negates it). Charismatic attractive men → −2 DC; but a critical failure by such a man → she declares he comes with her and gives him a silver collar. Arachnid-form talk (\"Ugly Cute\") → −2 DC; calling the spider \"ugly\" provokes a sneer and negates it. Penalty: any time a PC fails to outright lie to her (except white lies), she immediately casts Mind Reading (DC 34 Will save); on a failed save she anticipates their next tactic, automatically reducing the result of their next Influence check by one step; on a critical success the PC learns one piece of information as if they'd succeeded at a Discovery check.",
    checks: [
      "DC 22 Diplomacy or DC 22 Society (Recall Knowledge: jorogumo despise tengu, hate peachwood, keep Shenmen isolated and illiterate, eat beautiful young men and maim pretty women out of jealousy; critical success — prepare a gift worth at least 50 gp)",
      "DC 24 Crafting, DC 24 Society, or DC 24 Tea Lore (Prepare for Royalty — 8 hours, others Aid; −4 circumstance penalty if the site hasn't been built up over the campaign)",
      "DC 24 Society or DC 22 Tea Lore (round 3 — she must be given hot tea at the door, an old Imperial Lung Wa etiquette)",
      "DC 24 Society or DC 22 Tea Lore (round 4 — servers kneeling is correct only for weddings)",
      "DC 24 Crafting or DC 24 Tea Lore (round 4 — extra Influence check, doesn't count as the round's action)",
      "DC 28 Diplomacy (round 4 — calm her over the thrown tea; DC 28 Deception can fake punishing the tea preparer)",
      "DC 24 Diplomacy (each PC — Influence 4: if none succeed she casts Outcast's Curse, DC 34 Will save, on a random PC)",
      "DC 34 Will (Outcast's Curse — Influence 4)",
      "DC 34 Will (Mind Reading — whenever she is not outright lied to)",
      "DC 28 Deception or DC 28 Diplomacy (Parting Ways 7–12 — dissuade her from collecting pretty men and anyone collared)"
    ],
    phases: [
      "Round 1 (1 min) — arrival and greeting. A gift worth ≥50 gp grants 1 Influence Point; >100 gp grants 2 Influence Points, but all Influence check DCs in round 2 increase by 1. Discovery checks allowed; Influence checks are not (the round is only a minute).",
      "Round 2 (30 min) — palanquin tour; villagers must stoop (she forces bows with a spider leg); snarky insults. If Willowshore has fewer than 6 Security Points, she openly mocks the town → −1 Hope Point.",
      "Round 3 (10 min) — she questions the venue choice; she must be given hot tea at the door (DC 24 Society or DC 22 Tea Lore to know this); telling her she's wrong offends her slightly.",
      "Round 4 (30 min) — she refuses alcohol, requests tea, asks about the pot's history, then demands servers kneel (wedding-only). A PC may attempt a DC 24 Crafting or DC 24 Tea Lore Influence; if skipped or failed she feigns burning her lips, throws the tea, and the PCs must succeed at DC 28 Diplomacy or make a show of punishing the tea preparer — else −2 Influence Points (DC 28 Deception can fake the punishment); otherwise she offers the server a silver collar.",
      "Round 5 (30 min) — if she hasn't tormented or punished anyone yet, all further Influence check DCs increase by 1 (cumulative).",
      "Round 6 (1 hour) — post-meal entertainment: each PC may make a free Influence check (Performance, Acrobatics to tumble, Athletics feat of strength, or any justifiable skill); on a critical success she demands the performer visit her later and gives them a silver collar."
    ],
    outcomes: [
      "Under 6 Influence Points or any attack on her → combat: Parting Ways (Extreme 9). She is a level-13 creature — beyond extreme for level 8, dangerous even for 9th–10th level. First turn: Summon Animal (Giant Tarantula), climb to the ceiling, Suggestion and web trap to separate PCs; she tries to incapacitate or capture offenders (or those who drew her eye — −2 circumstance penalty on strikes to deal nonlethal). She flees at 45 or fewer Hit Points. If slain, her thoughtform body vaporizes and her four thoughtform servants fade; the PCs can recover her messenger's ring and dust of corpse animation if not already gifted, but the hardwood chest is nowhere to be found.",
      "7–12 Influence: she attempts to \"collect\" pretty men and anyone collared; each potential victim attempts DC 28 Deception or DC 28 Diplomacy to dissuade her; on failure she insists, then charms, then resorts to violence.",
      "More than 12 Influence: secretly pleased; no one must return with her, but she hints that at the spring tithe she intends to take some or all of them to her palace; then she and her servants fade away. Anyone she took is freed.",
      "Influence 4: annoyed — each PC attempts DC 24 Diplomacy; if none succeed she casts Outcast's Curse (DC 34 Will save) on a random PC. Influence 8: her decrees — (1) yearly tithes to the jorogumo during the season-of-ghosts ritual at the end of each spring (non-negotiable), (2) all tengu in the village executed immediately, (3) no reading or writing — all books turned over, (4) all coins and peachwood destroyed; the town has until the first tithe on the last day of spring. Agreeing wholeheartedly then ignoring her pleases her (+1 status bonus on all future Influence checks); negotiation removes one non-tithe stipulation (the tithe stays). Influence 12: she inquires about the Tan Sugi (ignorance is safe; truth or falsehoods also work — her Penalty doesn't apply); truth → she wishes the tree protected and gives the PCs a messenger's ring; a second stipulation is removed. Influence 16: she gives four doses of dust of corpse animation to help protect the town; a third stipulation is removed."
    ],
    treasure: "Hardwood Chest (12+ Influence Points) — left behind when the procession fades: six moonstones worth 25 gp each, a greater persona mask, and a desolation locket, plus the four silver collars worn by her phantasmal servants (a villager delivers them if the PCs weren't present). All rewards, including collars given during the encounter, persist — the jorogumo was only a thoughtform. Silver collars are recognizable as jorogumo property (Shinzo, or a PC Expert+ in Jorogumo Lore or Willowshore Lore): locked around the neck, unremovable, and they mark the wearer as free to travel, read and write, and trade freely with outsiders in modern Shenmen — valuable social passes for Act 4. Each collar is worth 50 gp and sells for full price.",
    influence: [
      { key: "ch9-ren-meili", label: "Ren Mei Li — Influence Points (silver collars at 12)", max: 12, note: "Discovery DC 20 Jorogumo Lore / DC 22 Diplomacy / DC 24 Society / DC 26 Perception. Influence DC 22 Performance / DC 24 Diplomacy / DC 26 Occultism / DC 28 Deception / DC 30 Intimidation. Below 6 Influence Points (or any attack) → Parting Ways, Extreme 9, against a level-13 creature. Thresholds: 4 — annoyed (DC 24 Diplomacy or Outcast's Curse); 8 — her decrees, one non-tithe stipulation negotiable; 12 — the Tan Sugi and a messenger's ring, a second stipulation negotiable; 16 — four doses of dust of corpse animation, a third stipulation negotiable (tithe is never negotiable).", reveal: "12+: she leaves peacefully and the Hardwood Chest appears — six moonstones (25 gp each), a greater persona mask, a desolation locket, and four silver collars (50 gp each, sell for full price)." }
    ],
    beats: [
      { key: "ch9-spider-peace", label: "Lady Ren leaves without a fight", xp: 160, hope: 1, note: "160 XP and 1d4 Hope Points for a peaceful exit." },
      { key: "ch9-spider-parting", label: "Parting Ways — the fight", note: "Extreme 9 against a level 13 creature; triggered below 6 Influence Points or on any attack. Flees at 45 or fewer Hit Points; if slain, the chest is nowhere to be found." },
      { key: "ch9-spider-rework2", label: "Rework seed: the crimson warning", note: "Two Weavers rework — ADD, optional, not in the printed book. As she takes her leave, Ren Mei Li drops her first warning, verbatim: \"Should a woman in crimson ever offer you anything, little ghosts, decline. She and I are owed a quarrel.\" One line seeds both the Act 4 alliance (Ren Mei Li becomes the party's patron) and the rival in a single breath; if the party heeds it, the crimson roses at the Silkwasp camp (Act 4, Chapter 11) land all the harder. Never name Hong Zhinü, the Crimson Weaver — the payoff is Act 4." }
    ]
  },
  {
    id: "Climax",
    key: "ch9-blad",
    name: "Between Life and Death",
    when: "Day 72 (New Year's Day) or later",
    level: "Severe 8",
    tone: "slate",
    creatures: "Kagekuma nindorus (3)",
    boxed: "Two wooden sliding doors cap the ends of this drab, thirty-by-sixty-foot stone-walled chamber. The wooden doors are ornately carved with depictions of a misshapen giant brutally bludgeoning people to death. Despite the relatively smooth walls and ceilings, the stone floor is crisscrossed with shallow gashes. In the center of the chamber is a ritual altar covered in incense, candles, and other accoutrements.",
    text: "The PCs should be at least 8th level; the sakaki time gate is designed to give them time to play all events except Event 13. The entire borderland is a closed loop — corridors in areas B1, B2, B3, and B4 continue seamlessly into their counterparts. Kagekuma nindorus manifest at each location labeled B5; mocking whispers (lies about abandoning Willowshore) fill the air. They roll Perception for initiative and approach the central chamber; they already have bundles manifested, so their Speed is reduced to 15 feet. Once one spots a PC it sheds its bundle to lurch forward and attack. If reduced to fewer than 50 Hit Points, a kagekuma casts translocate to retreat to its starting point, manifests a new bundle (AC bonus), and begins stalking again.",
    note: "Death rule: any PC who dies here isn't actually slain unless the whole party dies — as long as at least one PC lives and steps through, all PCs wake in the ruins of Willowshore at the start of Chapter 10, but those who died are Doomed 1. Through the portal: once the last kagekuma is slain, the portal flickers and solidifies. Stepping through completes the transmigration and begins Chapter 10.",
    checks: [
      "DC 22 Arcana or DC 22 Occultism (Recall Knowledge — this mindscape is wedged between Willowshore and the living world, a metaphysical \"crumb catcher\" for souls not fully consumed by Kugaptee)"
    ],
    phases: [
      "The Cast: as the flames bake them in their clay shells, a baleful voice resembling Governor Heh's orders them to give in to desire and be consumed by emotion. Have the players describe their characters' strongest feelings — these guide the ghostly powers they gain in modern Shenmen (Haunting the Living, Chapter 10). They do NOT wake in the living world.",
      "The Borderland: DC 22 Arcana or DC 22 Occultism identifies the crumb catcher. Sliding doors: Hardness 5, 20 HP (BT 10); their carved holes allow only greater cover, not full line of sight. The whole borderland is a closed loop (B1–B4).",
      "The Portal: during each round, a shimmering aura above the altar grows clearer, transforming into a portal to Dawnstep Bridge.",
      "Through the Portal: once the last kagekuma is slain, the portal solidifies. Stepping through completes the transmigration (80 XP) and begins Chapter 10."
    ],
    hazard: "Sliding doors — Hardness 5, 20 HP (BT 10); carvings leave holes → only greater cover, not full line of sight.",
    beats: [
      { key: "ch9-blad-feelings", label: "Describe your strongest feelings", note: "During the cast; these guide the ghostly powers gained in modern Shenmen (Haunting the Living, Chapter 10)." },
      { key: "ch9-blad-step", label: "Stepped through the portal", xp: 80, note: "80 XP for completing the transmigration. At least one PC must step through; PCs who died here wake in the ruins Doomed 1 as long as the party survived." }
    ]
  }
];





// Season of Ghosts — Chapter 10 "This Place Is Ours" — data layer.
// Source: wintermacromaterial/digests/chapter3.md (PDF GM guide + book DOCX, cross-checked).

const CH10_TERROR = {
  note: "Terror cuts both ways. High terror buys Frightened enemies — and locked gates, concentrated defenders, and eventually a near-infinite reinforcement tap: Terror 7 stacks nine mercenaries into one room, and Terror 8 means the fight never really ends. The sweet spot is 3–5. Let the party discover this. At the listed thresholds, NPCs may begin combat Frightened (reducing by 1 at the end of each creature's turn as normal).",
  decay: "Terror Points reduce by 2d6 every 24 hours that pass without any PC activity that could potentially increase terror — the party cannot bank terror and go rest.",
  teach: "Teach the Terror mechanic in the first ten minutes. If the party doesn't grasp it: (a) have a villager or merchant panic on sight, scream “ghosts!”, and flee — announce a Terror Point; (b) if the PCs kill an occupant and leave the body, a scream carries later — announce a Terror Point; (c) just tell the players directly. For a fig leaf, gate the hint behind a DC 25 Society Recall Knowledge check (asking about Karahai's defenses or entrances). Reward whatever clever tactics the players use to induce dread: 1 point.",
  thresholds: [
    [0, "—", "None."],
    [1, "—", "None."],
    [2, "—", "The two exorcists from area C1 leave to patrol the village. Villagers and cooks inside the fort retreat to the village."],
    [3, "Frightened 1", "Earth Gate is locked. The Small Wood Gate is locked and guarded by mercenaries from area C6."],
    [4, "Frightened 1", "The shrine maidens from area C15 patrol the periphery hall."],
    [5, "Frightened 1", "All exterior fortress gates (area C2) are closed and locked."],
    [6, "Frightened 2", "Fenfang and two exorcists retreat to area C16."],
    [7, "Frightened 2", "The fortress's nine mercenaries barricade themselves into area C5. Mago Kai retreats to his quarters in area C20."],
    [8, "Frightened 3", "Mago Kai has a shrine maiden cast Sending to report to allies back in the city of Sze and ask for reinforcements. Help won't arrive immediately, but within the next several days, exorcists, mercenaries, and shrine maidens the PCs might have defeated are replaced by new ones. Mago Kai can call for reinforcements up to three times."]
  ],
  menu: [
    { action: "Stage a body grisly", points: 1, note: "2 points on a critical success; DC 25 Intimidation when the body is discovered — timing is yours" },
    { action: "Frighten the two cooks (C7)", points: 1, note: "Trivially easy; they carry on loudly as they flee" },
    { action: "Attack C6 during mealtime", points: 1, note: "More of the fortress is present, too" },
    { action: "Arson in the lumber store (C8)", points: 1, note: "Earthen walls contain the fire; Kai takes a −1 circumstance penalty to all saves vs emotion the next time he is met" },
    { action: "Ablutions at the basin (C9)", points: 1, note: "Once per week; a sense of foreboding settles over the fortress" },
    { action: "Recruit the shimmerthief (C4)", points: 1, note: "1 point per hour for 4 hours; it skulks and torments on its own, then is chased off or slain" },
    { action: "Reveal Fenfang's true form (C14)", points: 3, note: "Only if surviving exorcists escape to spread the word" },
    { action: "Hu Deming shrieks at Terror 6 (C19)", points: 1, note: "Also summons the periphery patrol" },
    { action: "Disable the warding bell", points: 3, note: "Terror jumps to 3 if lower, and can never drop below 3 again for the rest of the act" }
  ]
};

const CH10_AREAS = [
  {
    id: "Village",
    key: "ch10-village",
    name: "Karahai Village",
    when: "Terror cap 2",
    level: "Low 9",
    tone: "rust",
    creatures: "Exorcists (2, Terror 2+) · Villagers (~3 dozen)",
    boxed: "A tiny village on the edge of the Sea of Ghosts: one-story packed-clay houses with thatch roofs, a small dock with a few rickety fishing boats, and about three dozen superstitious Shenmen villagers who have paid human tithes to the jorogumo and often scar their own children's faces to avoid the spider women's attention.",
    text: "Terror cap: acts here do not increase Terror past threshold 2 — the villagers have cried wolf too often; scares must happen inside the fortress to push past 2. At Terror 2+, the two exorcists from C1 are dispatched to patrol the village; they are here to quell villagers' fears and don't expect a real haunting, patrol a little over an hour, then return to C1. If they spot the PCs they attack to banish the ghosts; if one is reduced below 40 HP, both flee back to the barracks (C5).",
    note: "The party steps off the southern side of Dawnstep Bridge into the real Willowshore — ruins for over a century — as temporary constructs of ectoplasm: phantom, not undead, gear intact.",
    beats: [
      { key: "ch10-village-scare", label: "Villager panic in the village", terror: 1, note: "Announce on screams of “ghosts!”; village acts cap at Terror 2" }
    ],
    aside: {
      title: "Ugly Cute",
      text: "The party's stone guardian spider lies smashed on the road out of Willowshore — Mago Kai killed it before the campaign began. Don't comment on it. Describe the fragments and move on."
    }
  },
  {
    key: "ch10-fortress",
    name: "Karahai Fortress Features",
    tone: "slate",
    checks: ["DC 25 Athletics", "DC 10 Athletics", "DC 20 Acrobatics", "DC 25 Thievery"],
    text: "Outer wall 25 ft high — DC 25 Athletics to Climb; the steeply sloped roof rises to 40 ft — DC 10 Athletics to clamber along. Arrow slits: a Small creature Squeezes through with DC 20 Acrobatics; Tiny fits without trouble. Gates are thick wood reinforced with iron, functioning as iron portcullises; each can be locked — four DC 25 Thievery checks to Pick the Lock; they remain unlocked until the Terror thresholds. Doors are reinforced wood. While the warding bell rings, walls, floors and roofs cannot be passed through by incorporeal creatures (including Dematerialize) — doors and gates can, as a 3-action activity with the move trait. Teach the wall-vs-door rule early; it is the chapter's key tactical fact. Combat note: exorcists and shrine maidens open with Holy Water, Heal, Vitality Lash and other anti-undead attacks — which do nothing against phantoms; they adapt mid-fight. Play the first wasted round. If a spellcaster learns this and survives, word spreads and no one in the fortress repeats the mistake — kill every witness and you can farm it twice. No NPC in this act has Banishment.",
    note: "Haunting the Living spirit powers (minor and major, including Dematerialize) live in a separate sidebar — print them before the session; players will want the list at the table. Gear comes with the party; damage to equipment persists normally."
  },
  {
    id: "C1",
    key: "ch10-c1",
    name: "C1 · Upper Ring",
    level: "Severe 9",
    tone: "slate",
    creatures: "Exorcists (2) · Mercenary Enforcers (4)",
    boxed: "A 5-foot-wide enclosed hall circumnavigates the fortress within its outer wall at a height of 15 feet. Ladders in the stable (area C4), the barracks (area C5), and the lumber storage (area C8) allow access to this walkway, and narrow arrow slits face out in all directions. A Small creature can Squeeze through one with a successful DC 20 Acrobatics check, while a Tiny creature can fit through without trouble. The hall passes over each of the gates.",
    text: "The guards pay little attention until Terror 2 (exorcists sent to the village; mercenaries start patrolling the ring). Exorcists fight to the death; mercenaries flee to the barracks (C5) if reduced to 30 or fewer HP. Terror 2: the exorcists are sent into the village to patrol. Terror 7: the mercenaries abandon this area and barricade into C5.",
    checks: ["DC 20 Acrobatics"]
  },
  {
    id: "C2",
    key: "ch10-c2",
    name: "C2 · Fortress Gates",
    when: "All exterior gates locked at Terror 5",
    tone: "slate",
    checks: ["DC 25 Thievery"],
    text: "All four exterior gates are closed and locked at 5 Terror Points. Each gate is thick wood reinforced with iron, functioning as an iron portcullis, and requires four DC 25 Thievery checks to Pick the Lock.",
    qa: [
      ["C2a · Water Gate", "Painted black with a jumping carp; a tiny clay statue of Abadar sits on the ground by one hinge. Always kept locked."],
      ["C2b · Metal Gate", "Painted gray with a faded but majestic white tiger. Normally unlocked and left open — the majority of foot traffic passes this way."],
      ["C2c · Fire Gate", "Painted red with a phoenix, recently touched up by someone with no artistic skill — the bird looks a bit bug-eyed. Normally kept closed."],
      ["C2d · Wood Gate", "Painted green with a golden squiggle vaguely resembling a dragon; the paint is notably fresh. Ruts in the ground suggest heavy objects have been dragged through. Normally kept closed."]
    ]
  },
  {
    id: "C3",
    key: "ch10-c3",
    name: "C3 · Periphery Path",
    level: "Low 9",
    tone: "moss",
    creatures: "Exorcists (2) · Shrine Maidens (2, Terror 4)",
    boxed: "This ten-foot-wide path of packed earth is open to the sky above. The buildings to either side of it appear to have been recently reinforced to be more militaristic in appearance, but here and there, legacies of their prior use as shops and eateries remain in the form of a few golden tassels, hanging bells, or other mercantile adornments.",
    text: "Residents use these buildings for storage, trade deals, and occasional market days — Kai permits it for easier supply access. Below Terror 2, a half-dozen villagers are here by day and pack up at night. Every hour or so, the two exorcists from C1 descend for a quick patrol of this path (unless reassigned to the village). Terror 4: the two shrine maidens from C15 stand guard here instead — one near Metal Gate (C2b), one near Wood Gate (C2d), swapping positions every 10 minutes; a shrine maiden who encounters a PC uses Sending early in the fight to alert Mago Kai of the intrusion."
  },
  {
    id: "C4",
    key: "ch10-c4",
    name: "C4 · Stables",
    level: "Trivial 9",
    tone: "moss",
    creatures: "Shimmerthief (1) · War Horses (2)",
    boxed: "Low fences partition off five pens along the northwest wall of this room. The first two pens by the entrance are occupied by sturdy, shaggy horses, while the other three are empty save for strewn beds of hay. A ladder to the north leads up to a small door that's located in the wall fifteen feet off the ground. The southern portion of the room is shrouded in a mysterious darkness from which a strange, soft clicking sound emanates.",
    text: "The shimmerthief is a lizard-like magical beast captured in the Willowshore ruins, chained into its stall (several iron chains — immobilized) and muzzled tightly: muzzled means it can't cast innate spells, can't use its Unnerving Shriek, and can't talk. Its gleam theft aura keeps the area around it quite dark. It is intelligent and speaks only Draconic — nobody in the fortress speaks it, so its attempts to communicate were mistaken for weird monster sounds. It starts unfriendly but is extremely innocent in nature, closer to a puppy than a wary human. Cao Chen keeps it alive on a pet theory that its light-eating could be retuned to consume undead energy — the more people scoff, the more convinced he becomes. Check the party sheets: if no one has Draconic, the whole encounter changes shape. The war horses are combat-trained but only ridden for speedy messengers or emergencies (now rarely — the shrine maidens' Sending made them redundant); they are very skittish, unnerved by the occupant of the farthest stall, and not a threat.",
    hazard: "The chains: Hardness 5, HP 20 (BT 10). Free the shimmerthief with Chen's key, four DC 25 Thievery checks to Pick the Lock, a DC 25 Athletics check to Force Open, or by destroying the chains. Freeing it automatically adjusts its attitude up one step toward helpful.",
    note: "If freed without communication it flees, but may return to help later at your discretion. If attacked, it fights back if it can and flees the region if reduced to fewer than 40 HP. Canny PCs can make excellent use of its darkness aura in the C11 bell chamber.",
    beats: [
      { key: "ch10-c4-xp", label: "Released and recruited the shimmerthief", xp: 80 },
      { key: "ch10-c4-skulk", label: "Shimmerthief skulks and torments the fortress", terror: 1, note: "1 point per hour for the next 4 hours; it is then discovered and chased off or slain" }
    ]
  },
  {
    id: "C5",
    key: "ch10-c5",
    name: "C5 · Common Barracks",
    tone: "slate",
    creatures: "Mercenary Enforcers (up to 9)",
    boxed: "Neatly arranged bunk beds, each with a small footlocker, line the walls of this curved room. A ladder in the southwest corner leads up to a small door in the wall about fifteen feet off the ground.",
    text: "The total garrison is nine mercenary enforcers and seven exorcists. Day: the room is empty. Night: all (save Cao Chen and Pan Fenfang, who have their own chambers) sleep here. Terror 7: all surviving mercenary enforcers return, lock the door, and barricade in — DC 25 Athletics to Force Open, increasing to DC 30 Athletics if the door is locked. Footlockers contain uniforms, toiletries, and personal items.",
    checks: ["DC 25 Athletics", "DC 30 Athletics"]
  },
  {
    id: "C6",
    key: "ch10-c6",
    name: "C6 · Dining Room",
    level: "Moderate 9",
    tone: "gold",
    creatures: "Mercenary Enforcers (5)",
    boxed: "This area is a large dining room containing two low tables in the middle of the room and a long dining shelf along the southwest wall. Numerous cushions have been arranged along the tables and the shelf, providing several places to sit and relax.",
    text: "During the day the five mercenaries relax, eat, or play tile games here; the room is empty at night. If the PCs infiltrate during mealtime, more occupants might be encountered here — and attacking this room during mealtime grants 1 Terror Point. Terror 3: the mercenaries relocate to C12c, lock the gates, and stand guard within. Terror 7: they relocate to C5 and barricade in.",
    beats: [
      { key: "ch10-c6-mealtime", label: "Attacked the dining room during mealtime", terror: 1, note: "More of the fortress is present, too" }
    ]
  },
  {
    id: "C7",
    key: "ch10-c7",
    name: "C7 · Kitchen",
    tone: "ember",
    creatures: "Servants (2)",
    boxed: "This room has red tiled floors and smoke-stained earthen walls. A brick stove sits against the eastern wall, and the northern side of the room features two large windows for ventilation. Heavy pots and pans hang from wooden pegs, and a large wooden cupboard contains clay bowls and dried spices.",
    text: "The two servants are a pair of cooks busy by day — rolling dough, steaming dumplings — who return to their village homes at night. Frightening them is an easy task; the way they carry on as they flee adds 1 Terror Point. Terror 2: the servants abandon their duties and return to their village homes.",
    treasure: "The cabinets hold supplies for brewing magical tea — 150 gp worth of raw materials — and three heavy, well-seasoned cast iron woks (each 1 Bulk, worth 50 gp, functioning as a sterling artisan's toolkit for Crafting checks to cook meals in them).",
    beats: [
      { key: "ch10-c7-cooks", label: "Frightened the two cooks", terror: 1, note: "Trivially easy; they carry on loudly as they flee" }
    ]
  },
  {
    id: "C8",
    key: "ch10-c8",
    name: "C8 · Lumber Storage",
    tone: "ember",
    boxed: "The walls of this long, curving room are stacked with logs, lumber, and planks of all shapes and sizes, most of them covered in dust. Two ladders, one to the east and one to the south, lead up to small doors in the wall that are located fifteen feet off the ground.",
    text: "Kai's woodcutters harvested inferior timber and were sent back to Sze by end of summer; some lumber partially repaired Karahai Bridge and most has gathered dust. The lumber is dry — a fire here grants 1 Terror Point, and the fortress's earthen walls contain the fire. Kai is especially frustrated by the loss: the next time he's encountered, his frustration imparts a −1 circumstance penalty to all of his saving throws against emotion effects.",
    treasure: "The lumber could go a long way toward fully repairing Karahai Bridge (addressed in the next act). A 10-minute Search: north — a saurian spike lying forgotten amid the stacks; south — a similarly neglected +2 striking handaxe.",
    beats: [
      { key: "ch10-c8-arson", label: "Arson in the lumber store", terror: 1, note: "Earthen walls contain the fire; Kai takes a −1 circumstance penalty to saves vs emotion the next time he is met" }
    ]
  },
  {
    id: "C9",
    key: "ch10-c9",
    name: "C9 · Purification Room",
    level: "Moderate 9",
    tone: "ice",
    boxed: "A stone platform with a five-foot-diameter stone basin built into it sits against the far wall of this room. The basin is filled with clear water, and several bamboo ladles are arranged nearby. A painted ink scroll depicting a sparrow as it perches on the back of a throne hangs on the wall. A blue-skinned woman sits on the throne, her gaze ever watchful.",
    checks: ["DC 10 Religion", "DC 29 Stealth"],
    text: "DC 10 Religion (Recall Knowledge): the scroll depicts Pharasma on her throne in the Boneyard; on a critical success, the PC knows the basin purifies hands by ladling water onto them. Ablutions are a 1-minute activity; regardless of outcome, once per week performing them causes a sense of foreboding over the fortress's inhabitants — +1 Terror Point. Conditional hazard — Nosois' Vengeance: if the PCs seriously offended the visiting nosois during Event 11 (Nosois' Brunch), the vengeful nosois use their contacts and the shrine's sacred nature to create this hazard — Moderate 9: 4 vanths summoned by the vengeful psychopomps. A PC can avoid being noticed by it for 1 round by Sneaking with a successful DC 29 Stealth check. Conditional treasure — Psychopomp's Boon: if the PCs pleased the nosois during Event 11 by achieving at least six successes, a PC who spends 1 minute performing ablutions using water from the basin before the scroll hears sparrows singing, then receives in freshly washed hands one of the following: a moderate elixir of life, a pouch containing a greater potency crystal, a moderate spiritual warhorn, or a scroll of a useful 5th-rank spell from that PC's magical tradition.",
    note: "If no trap awaits because the PCs did well appeasing the nosois, grant XP as if they'd defeated the summoned vanths in combat.",
    beats: [
      { key: "ch10-c9-ablutions", label: "Performed the ablutions at the basin", terror: 1, note: "Once per week; a sense of foreboding settles over the fortress" },
      { key: "ch10-c9-boon", label: "Psychopomp's Boon granted (nosois appeased)", note: "Grant XP as if the 4 summoned vanths were defeated in combat" }
    ]
  },
  {
    id: "C10",
    key: "ch10-c10",
    name: "C10 · Shrine Antechamber",
    tone: "plum",
    boxed: "This stone room is lit by thirty white wax candles that burn along narrow shelves to either side. A raised circular dais sits in the center of the floor, with a carved decorative ring surrounding it. Hundreds of long paper talismans and shide hang like curtains around this ring.",
    treasure: "A 10-minute Search of the hanging shide and talismans turns up a needle thousand-pains fulu."
  },
  {
    id: "C11",
    key: "ch10-c11",
    name: "C11 · Shrine",
    level: "Severe 9",
    tone: "plum",
    creatures: "Cao Chen · Shrine Maiden (1)",
    boxed: "This room is dimly lit by burning torches, and a massive bronze temple bell hangs from the center of the chamber. Five small, empty bird cages are placed around the sides of the room, and the bell's mouth flickers with a pale, eerie radiance.",
    text: "Assuming the PCs endured Event 12 (The Seance), they automatically recognize the glow as the Eternal Lantern's. Chen kneels in prayer near the bell; the maiden busies herself with cleaning and meditation. If either spots the PCs, they attack at once, interpreting them as evil spirits come for vengeance. Cao Chen's Influence-4 branch: if the PCs brought Chen to Influence 4 during the seance, he recognizes them, raises a hand and stays the shrine maiden's attack, and asks the PCs to step out to area C10 to talk. If the PCs turn him down, he sighs sadly, and he and the shrine maiden attack. He won't betray his employer — Kai's resources let his exorcists work in Shenmen with fewer political complications, and he thinks staying with Kai and resealing Kugaptee beats hoping things work out after the lumber lord leaves. If told an exorcist has been corrupted (by Kugaptee): Chen becomes alarmed; he won't act on the PCs' word alone but won't dismiss it either — he sends the shrine maiden to warn Kai and investigate, tells the PCs to stay where he can see them; if they wait patiently, Mago Kai comes to speak with them in person in 15 minutes (his NPC entry, page 354). That is the cleanest possible route to the peace option, available to a party that never draws a weapon.",
    hazard: "The Warding Bell — a level 11 complex hazard. Close proximity exposes the PCs to its sacred aura, causing them to take damage so long as they remain in its presence. Without the bell's ringer — carried by Mago Kai — deactivating or destroying it is difficult. The disarming method (strike it eight times in succession with the ringer) is found in the C20 codex.",
    note: "On disabling: the ghost-proof walls of the fortress drop, Karahai's Terror Points increase to 3 if they aren't there already, and they can't be reduced below 3 for the remainder of this act.",
    beats: [
      { key: "ch10-c11-bell", label: "Warding bell disabled", xp: 80, note: "One of the two tasks required to transmigrate Willowshore back to the living world; plus normal hazard XP" },
      { key: "ch10-c11-bell-spared", label: "Bell disabled without destroying it", xp: 40, note: "Bonus on top of the 80 XP (120 total); the intact bell becomes a +2 divine-skill shrine boon in Ch 11 — tick exactly one of the two bell beats" }
    ]
  },
  {
    id: "C12",
    key: "ch10-c12",
    name: "C12 · Inner Gates",
    when: "Earth Gate and Small Wood Gate locked at Terror 3",
    tone: "slate",
    creatures: "Mercenary Enforcers (5, Terror 3)",
    checks: ["DC 15 Athletics"],
    text: "Each inner gate area is covered and fenced in on either side by stout wooden walls fitted with gates. C12a · Inner Water Gate: black paint fresher and less weathered than C2a; oddly, three hinges normal and one on each gate shaped like a smiling turtle; always kept closed and locked. C12b · Earth Gate: a pair of decorative cow horns affixed to each gate; used as handholds they ease the climb over the gate (DC 15 Athletics); kept closed, locked once the fortress reaches Terror Threshold 3. C12c · Small Wood Gate: left open; when shut, a painted image of a chicken is discernible on each. Terror 3: Earth Gate and Small Wood Gate both closed and locked; the five mercenaries from C6 stand guard within Small Wood Gate, ready to confront anyone entering or stepping into the garden (C22). Terror 7: mercenaries on guard here retreat to C5."
  },
  {
    id: "C13",
    key: "ch10-c13",
    name: "C13 · Bath",
    level: "Trivial 9",
    tone: "ice",
    creatures: "Sha Guanghao (1)",
    boxed: "In contrast to the rest of the fortress, the floor of this room is set with tiles. They form a design of concentric circles on the floor and appear to be freshly cleaned. Three bamboo stalls containing squat toilets stand to the northwest, while to the southeast is a large pool for bathing.",
    checks: ["DC 19 Perception", "DC 24 Deception", "DC 27 Diplomacy"],
    text: "Sha Guanghao — one of the three exorcists from Event 12 (The Seance) — is hunched, scrubbing vigorously at the floor with a small brush; his naginata and unlit torch rest against the northeastern door frame. If confronted without seance rapport, he brandishes the brush and declares: “Stay back! I am adept in the mysteries of the universe. With the slightest glance, I can send you straight to the Boneyard!” A successful DC 19 Perception check to Sense Motive discerns he's all bluster. If attacked, he fights back despite his disadvantages — his poor grasp of his own limits means he inadvertently fights to the death. Influence-4 branch: if the PCs brought him to Influence 4 during the seance, he recognizes them, hesitates, lowers his brush, rubs the back of his head: “Wait a minute, Master Cao said you can't be here. How are you here?” He answers questions (with difficulty) if not attacked or threatened. Remote-control NPC: he can be convinced to do just about any task with a successful DC 24 Deception check to Lie or a DC 27 Diplomacy check to Request — as long as the task doesn't involve directly harming any other fortress resident (opening a gate, carrying a message, standing somewhere at a specific time…).",
    note: "The DOCX encounter header spells him “Sha Guanchao”; body text and PDF use “Sha Guanghao”. Reward: learning information from Guanghao earns XP as if they'd defeated him in combat; getting him to help with a task earns an additional 40 XP.",
    qa: [
      ["Why are you here?", "“Because I've got great spiritual powers. Real prodigy with that stuff. No lie.”"],
      ["Why are you scrubbing?", "“Oh, that. It, uh, builds spiritual energy. Lets me 'cultivate my spirit,'” … in a rote monotone, staring at the floor. “That kind of stuff. At least that's what Master Cao says.”"],
      ["About Master Cao?", "“Knows a lot of stuff for an old man. Surprisingly fast hands.”"],
      ["About the fortress?", "“If memory serves, the foundation was laid down by Imperial Lung Wa about a thousand years ago to rein in the local bandits. Or was it ten thousand years? Anyway, a long time ago. Yeah.”"],
      ["About its current state?", "“It's okay, I guess. The food is all right, especially if you get in the first service. Some of the new mercenaries snore, but if you drop a cloth over their heads, you can barely hear it.”"],
      ["About Mago Kai?", "“The big man? He's pretty tough. Saved me from a giant spider once. I say 'saved,' but I totally had that situation taken care of on my own, you know. But it was still kind of amazing to see him throw that big axe of his; he sliced the bug right in half!”"],
      ["Have you seen a large bronze bell?", "“Uh, yes. You were there a few weeks ago. You aren't too bright, are you?”"],
      ["Where is the bell?", "“Over in the shrine, of course. Where else would it be?” … “Through there, make a right, then head through a couple more doors. You can't miss it.”"],
      ["What happened to the Eternal Lantern's flame?", "“The big man took it and placed it in the bell; you'd have to talk to him to find out more, I suppose.”"]
    ],
    beats: [
      { key: "ch10-c13-info", label: "Learned information from Sha Guanghao", note: "XP as if they'd defeated him in combat" },
      { key: "ch10-c13-task", label: "Guanghao performed a task", xp: 40, note: "Task must not directly harm another fortress resident" }
    ]
  },
  {
    id: "C14",
    key: "ch10-c14",
    name: "C14 · General Storage",
    level: "Severe 9",
    tone: "plum",
    creatures: "“Fenfang” (akashti nindoru) · Exorcists (2)",
    boxed: "This shelf-filled room contains an eclectic mess of anything that might be useful but doesn't have its own dedicated space, such as lumber saws, maintenance equipment, bundles of branches, animal pelts, dried bamboo stalks, and clay for patching up holes in the walls.",
    checks: ["DC 26 Stealth", "DC 22 Perception"],
    text: "First visit, Terror below 6: “Fenfang” plus two exorcists — the three exorcists comprising the total of Fenfang's secret cult: “Fenfang,” a nervous exorcist, and an intent exorcist holding a naginata. Their conversation lasts a few minutes; each minute, all PCs eavesdropping must succeed at a DC 26 Stealth check to Avoid Notice and a DC 22 Perception check to hear the quiet conversation. The horror (dramatic irony): the party has stood in front of the Tan Sugi and knows what is under it — Tan Sui-Jing IS the tree; what whispers her name is the thing she died sealing. Lotus was made by the woman who founded that monastery. If noticed: she accuses the PCs of being evil spirits and orders her allies to fight while she steps back, casting from a distance — opening with Illusory Creature to conjure a Medium serpentine dragon at her side. Though she carries a naginata and torch like the others, she never attacks with them. True form: “Fenfang” is an akashti nindoru. Between the seance and now, Fenfang's corruption by Kugaptee reached its tragic conclusion — she went into the woods alone to fight the influence, was attacked, murdered, and replaced by an akashti that could manifest because her belief was faltering. At 10 damage her manifested body decays away from her frame, revealing her true form. She howls in rage; if any exorcists remain alive they flee the battle at once; if they escape, word of the transformation spreads — +3 Terror Points. Terror 6: the storage room is empty — Fenfang has retreated to C16 with her two exorcist allies until danger passes.",
    phases: [
      "1st minute: Fenfang has the nervous exorcist confirm he is tired of Master Cao's leadership and eager to hear what she has to say.",
      "2nd minute: Fenfang makes him swear secrecy under punishment of death; he agrees; the intent exorcist breathes a sigh of relief, adopts a less antagonistic stance, raising his naginata.",
      "3rd minute: Fenfang says she and her ally have been receiving visions from a spirit named Tan Sui-Jing, a powerful holy woman who died in the area long ago.",
      "4th minute: Sui-Jing's spirit is trapped below a towering tree beyond the ruins of Willowshore; if he joins their plan to free her, he'll share in the great rewards she promised in her visions.",
      "5th minute: he agrees and joins the cult; Fenfang says they'll later speak about seizing the fort's resources and focusing on freeing Tan Sui-Jing. Fenfang retreats to her chambers (C16); the other two head to the dining hall (C6)."
    ],
    beats: [
      { key: "ch10-c14-eavesdrop", label: "Eavesdropped the full conversation", xp: 50, note: "10 XP per minute of information; 50 XP total for the full five minutes" },
      { key: "ch10-c14-truth", label: "Fenfang's true form revealed", terror: 3, note: "Only if surviving exorcists escape to spread the word" }
    ]
  },
  {
    id: "C15",
    key: "ch10-c15",
    name: "C15 · Shrine Maiden Quarters",
    level: "Moderate 9",
    tone: "plum",
    creatures: "Shrine Maidens (2)",
    boxed: "This room contains a small oven, bed rolls, cupboards, a shrine to Pharasma, and a bronze gong set against the wall.",
    text: "There are three shrine maidens total in the fortress; each works an 8-hour shift guarding the warding bell while the other two rest and pray here. Their motive: they agreed to work for Kai solely in return for permission to develop the fortress into a temple to Pharasma once he moves on; they suggested stealing the Eternal Lantern's flame (which they regard as liberating a lost cause from obscurity). They regard the PCs as evil spirits of the region at worst, lost spirits at best — and react by putting them down as quickly as possible so they can move on to Pharasma's embrace. Terror 4: these two exit to patrol the periphery path (C3).",
    treasure: "5-minute Search: a scroll of heal (5th-rank), two scrolls of cleanse affliction (4th-rank), four scrolls of clear mind (4th-rank), and a scroll of sending."
  },
  {
    id: "C16",
    key: "ch10-c16",
    name: "C16 · Fenfang's Chambers",
    level: "Low 9",
    tone: "plum",
    boxed: "The furniture is sparse, with only a wooden cupboard serving as storage for clothing and books. Dyed woven mats cover the floor, and the walls are decorated with painted religious icons of Pharasma and Tsukiyo. The bed is made out of a clay slab that's set over an oven, allowing it to be heated from below.",
    text: "The room now belongs to the akashti nindoru. It disposed of most of Fenfang's remains but sentimentally kept the skull as a trophy, hidden within the oven built into the bed — discovered automatically by anyone who Searches the room. Terror 6: Fenfang and her two exorcists relocate here from C14; if the PCs haven't eavesdropped on their conversation, consider giving them a chance to do so here.",
    treasure: "Tucked into a book titled Grandmasters of Quain is a scroll of vampiric exsanguination."
  },
  {
    id: "C17",
    key: "ch10-c17",
    name: "C17 · Chen's Chambers",
    level: "Trivial 9",
    tone: "plum",
    boxed: "The chamber's bed is a simple mat and blanket on the floor. Neat, lacquered altars and a variety of exorcist implements rest on shelves to the north and south, while a small bronze gong sits in the northwest corner. A large painted drum hangs from the ceiling in the center of the room.",
    text: "Cao Chen's room — he sleeps here a few hours each night but has spent most of his time lately at the shrine (C11). No creatures.",
    treasure: "Hanging from a peg — an elegant incense holder functioning as a moderate thurible of revelation."
  },
  {
    id: "C18",
    key: "ch10-c18",
    name: "C18 · Armory",
    tone: "slate",
    boxed: "Racks of swords, naginatas, and axes split this room into aisles. Thick, plated armor sits on wooden dummies against the far wall, black shields hanging from a few of their arms. Two large war drums sit on the floor. Next to the drums are barrels filled with arrows and crossbow bolts. A workbench in the southwest corner is covered in neatly arranged maintenance tools. At one side is a foot pedal grindstone, while at the other are a small forge and anvil.",
    treasure: "Most items are mundane, but a Search discovers a +2 striking jiu huan dao, a pair of flasks each containing a greater cheetah's elixir, and a silk cloth wrapped around three storm arrows.",
    note: "Plot hook: the same search turns up fragments of broken metal on the ground around the forge; any PC can identify them as having come from the Eternal Lantern's fuel receptacle — someone used the artifact's key part as base metal to forge something new."
  },
  {
    id: "C19",
    key: "ch10-c19",
    name: "C19 · Jail",
    tone: "muted",
    creatures: "Hu Deming (1)",
    boxed: "These jail cells are wretched and sparsely furnished, with a simple metal bed pan and a woven rush mat as the only appointments in each.",
    checks: ["DC 28 Athletics", "DC 25 Thievery", "DC 23 Deception"],
    text: "Hu Deming — Creature −1, Medium, Human, Humanoid — is the only prisoner, chained to the floor in the northeastern cell with a cangue around his neck. He threw a fish at Kai when the lumber baron took over the fortress and has been imprisoned since. Wary of the ghostly PCs but too immobilized to hide or flee — he trades information for freedom. Alternatively, a PC can succeed at a DC 23 Deception check to Lie to get him talking without intending to free him; once he realizes he's been betrayed (or if the PCs fail to Coerce him), he starts yelling — any patrol on the periphery ring comes to check in 1d4 minutes. His information is limited — months of incarceration; his map is out of date and he doesn't know how buildings were repurposed. Cell doors: Force Open with DC 28 Athletics; open with three DC 25 Thievery checks to Pick the Lock; or unlock with the Karahai skeleton key carried by Mago Kai. Terror 6: Deming has been stewing in paranoia about noises outside his cell; if he sees the PCs he lets out a bloodcurdling shriek — +1 Terror Point — alerting the periphery patrol as if he'd called for help (he can't flee; the PCs can question him without bargaining — answers involve a lot more crying and begging).",
    note: "He's inexhaustible, profane, delighted to have an audience. Let the insult tirade run its full five minutes. It is the only warm thing in the chapter.",
    qa: [
      ["Why are you in here?", "“Nothing much, really; just got a little rowdy when that blundering ox Kai had the gall to tell me to get out of my own shop.”"],
      ["About the fortress?", "“Plenty, worked here all my life. Until Mago Kai got here earlier in the year, that is. Fishmongering's a smelly business, but someone's got to do it, right?” … “It's a pretty simple design. Like a big wheel. Shops all around. Stables to the northwest, pig pen just east of here if I recall.”"],
      ["About Mago Kai?", "“That greedy, blockheaded, thieving son of a sow? Sure thing! He's a pig's head shoved up a horse's rear, with plenty of bristles on his face to scrub out the insides. He's a soggy softshell turtle. A fish-eyed, scrambled-up egg. His parents would have been better off if his mother had given birth to a chunk of roasted pork. He's two coppers out of a gold coin.” … The tirade runs at least five minutes of escalating anatomical impossibilities before circling back: “He claims to be some kind of lord from Sze. Doesn't care about us; just whatever lumber and wealth he can squeeze. Carries around a big axe, but I doubt he even knows how to swing it.”"],
      ["Have you seen a large bronze bell?", "“Yeah, they had it on a cart when they got here. Banged on it a bit when they first arrived, but not since. Something that fancy is probably locked up in the vault. Southern inner building in the fort. Watch out, though; I heard talk of a drunken soldier wandering in there and being simultaneously dismembered and having their head bashed in for their trouble.” — he wrongly guesses the vault/southern inner building; the drunken-soldier rumour is a garbled rumour of C20's animated axes — a real warning wrapped in a wrong answer."],
      ["About Kai's followers?", "“Can't say I care for any of them, on account of them being that oaf's lackeys. But when the big bad yokai comes a-knocking, I'd be lying if I said I didn't want these 'virtuous defenders of the light' standing guard. Well, most of them anyway.”"],
      ["Most of them?", "“There's something strange going on. A few of the priests have been sneaking around, whispering when they think no one is listening. I'm no expert, but there's just something wrong about the whole thing. Something evil. The one with the scar on her cheek seems to be the ringleader of them.”"]
    ],
    beats: [
      { key: "ch10-c19-rescue", label: "Rescued Hu Deming and learned his information", xp: 80 },
      { key: "ch10-c19-shriek", label: "Deming's bloodcurdling shriek", terror: 1, note: "At Terror 6; also alerts the periphery patrol as if he'd called for help" }
    ]
  },
  {
    id: "C20",
    key: "ch10-c20",
    name: "C20 · Kai's Quarters",
    level: "Trivial 9",
    tone: "gold",
    creatures: "Animated Axes (4)",
    boxed: "In contrast to the rest of the fortress, a modicum of luxury graces this room. While nothing particularly ostentatious catches the eye, these personal chambers feature solid and polished wooden furniture. Folding screens displaying elegant hunting scenes give parts of the room a nod toward privacy, and a smoking charcoal burner against the north wall provides heat, filling the area with a pleasant smell and warmth. Two low tables, one set with a tea service and snacks and another covered with scrolls, sit in the western portion of the room, while to the east, the chamber seems more akin to a bedroom. A large iron door with an imposing lock sits in the eastern wall, while a pair of expensive-looking axes adorn the walls to either side of it.",
    text: "Once the fort commander's chambers (vacant since the fall of Lung Wa), now Kai's. The scattered scrolls outline his plans for Willowshore's ruins — running from exorcism to razing much of the ruins and then rebuilding a more efficient and industrial logging compound on the town's bones. Several notes map potential nearby regions for rare timber that will certainly appease Governor Chou Mingxia for at least a year — the grove west of town where the Tan Sugi grows is of particular interest. The warding bell codex describes the bell's use — a series of chants, offerings, and rhythmic rings coinciding with the casting of a Consecrate ritual; the notes include how Kai, the shrine maidens, and the exorcists extracted the fuel receptacle from the Eternal Lantern and reforged the metal into a ringer that imbues the bell, through proper rites and sacrifice, with an inversion of the protection the lantern's flame afforded Willowshore — keeping Willowshore's spirits trapped so they can't spread from the ruins. The ringer disarms the bell by striking it solidly eight times in succession. A party that grabs the ringer without ever reading the codex has the key and not the instructions.",
    hazard: "Animated Axes (4): if any creature enters while Kai isn't present, the four axes animate and swoop to attack, flying as if wielded by invisible warriors. If Kai is in the room, he issues a brief command and snaps his fingers — one Interact action to command them — to attack all creatures in the room save himself. They function as animated objects; if destroyed they drop and shatter as if made from glass; they don't pursue foes out of the area.",
    note: "Terror 7: Mago Kai retreats here for safety; as in C22, he'll first try to speak with the PCs, but if battle ensues he fights to the bitter end (below 100 HP in C22 he regroups here)."
  },
  {
    id: "C21",
    key: "ch10-c21",
    name: "C21 · Treasury",
    level: "Moderate 9",
    tone: "gold",
    boxed: "At first glance, the room appears somewhat underwhelming, as its shelves and displays are mostly empty. Unadorned wooden chests sit on the central shelf, while a haphazardly placed idol depicting Kofusachi stands almost as an afterthought on the southeastern shelf.",
    checks: ["DC 30 Athletics", "DC 30 Thievery"],
    text: "The door is iron and kept locked — only the Karahai fortress key (carried by Mago Kai) opens it; otherwise DC 30 Athletics to Force Open, or four DC 30 Thievery checks to Pick the Lock.",
    treasure: "Within the chests — folded bolts of silk, slats of ivory, bronze vessels, and boat-shaped silver ingots, worth 1,400 gp total, along with a fire-jump ring. The square chests can be packed onto lumber wagons in an emergency."
  },
  {
    id: "C22",
    key: "ch10-c22",
    name: "C22 · Garden",
    level: "Moderate 9",
    tone: "moss",
    creatures: "Mago Kai (1)",
    boxed: "A beautifully tended garden occupies the fortress's central courtyard, which features a covered well at the center. Several well-pruned cotton trees dot the area at aesthetically pleasing intervals. Their branches are currently bare, giving the impression of jagged spines reaching up toward the sky. A colorful canopy has been erected on poles in the southern part of the garden, under which rugs, a chair, and a table set with tea and snacks has been set up.",
    text: "Kai is alone. He's grown fond of the garden, thinking of the cotton trees as a captive audience; he waits out the winter here with favorite novels, tea, and springtime harvest plans. Since his followers understand he values his privacy, he's most likely encountered here alone (unless the PCs have been too exuberant spreading terror). His reaction: he leaps up (perhaps spilling tea) and reaches for his axe — then pauses. His exorcists keep him briefed; even at 0 Terror he recognizes them as spirits from Willowshore, and the fact that they made it this far despite the warding bell is warning enough they're dangerous — he would rather talk. If the PCs show hostility he responds in kind; if brought below 100 HP, he attempts to regroup in his quarters (C20). Terror 7: Kai retreats to his quarters in C20 for safety.",
    note: "Reward (peace): if the PCs convince Kai to help without fighting, grant XP as if they'd defeated him in combat, plus additional XP for all exorcists, mercenaries, and shrine maidens who still live, as if defeated — the biggest XP award in the chapter. Regardless of total, they shouldn't earn much more than is needed to reach 10th level, but neither should they be penalized for efficient haunting!",
    beats: [
      { key: "ch10-c22-peace", label: "Peace with Mago Kai", note: "XP as if defeated Kai plus every surviving exorcist, mercenary and shrine maiden" }
    ]
  }
];

const CH10_AFTER = [
  {
    key: "ch10-after-peace",
    name: "Rewards for Peace — Shinzo's Gear Top-Up",
    when: "Aftermath",
    tone: "gold",
    text: "The adventure assumes Kai perishes and the PCs gain most of Karahai's treasure; but most creatures here aren't evil — they merely have plans that ignorantly imperil Willowshore. Chapter 11 still assumes 10th-level gear. If the PCs finish Chapter 10 not particularly richer (likely with a peaceful solution), when they return to Willowshore they're greeted by Shinzo on one of his final visits to the mindscape — his last meeting with him in his role as a merchant. He congratulates them on finding a peaceful solution, noting that even as a god of death, he appreciates when mortals find nonviolent solutions to violent conflicts. He grants each PC credit to shop among his items — enough to bring their gear up to 10th-level expectations: approximately 1,500 gp per PC, adjustable up to a maximum of 3,000 gp per PC if they're particularly resource-poor.",
    note: "Have this ready before the session so peace never feels like a penalty."
  },
  {
    key: "ch10-after-bell",
    name: "The Warding Bell — Spared or Destroyed",
    when: "Aftermath",
    tone: "plum",
    text: "If the bell was disabled without destroying it (120 XP instead of 80 XP), it becomes a +2 divine-skill shrine boon in Chapter 11 — say something in-fiction if the party winds up to smash it. Destroying the bell forfeits the boon.",
    beats: [
      { key: "ch10-after-bell-spared", label: "Bell spared — +2 divine-skill shrine boon in Ch 11", note: "Tick exactly one of these two beats" },
      { key: "ch10-after-bell-destroyed", label: "Bell destroyed — no Ch 11 shrine boon", note: "Tick exactly one of these two beats" }
    ]
  },
  {
    key: "ch10-after-lantern",
    name: "The Eternal Lantern Relit",
    when: "Aftermath",
    tone: "ember",
    text: "Anyone who touches the ringer feels an urge to return it to the Eternal Lantern. Placed inside the Eternal Lantern in the living-world ruins, the ringer instantly reverts to a receptacle and flares into light — no offerings of coins needed. The lantern had stayed dark and the party trapped in the mindscape until the ringer was recovered from Kai; this is the point where it finally relights.",
    note: "Gain the temple bell ringer from Mago Kai — he carries it; the codex in C20 explains the disarming method (eight strikes in succession)."
  },
  {
    key: "ch10-after-clock",
    name: "Running Out of Time",
    when: "Aftermath",
    tone: "muted",
    text: "The PCs have until their mindscape resets on the last day of spring to cast the 5th-rank transmigrate. If not: Mago Kai chops down the Tan Sugi during the last week of spring, Kugaptee is released, and he absorbs the Willowshore mindscape and all who dwell within it — no reset, no afterlife. Shinzo can step in as a last-minute deus ex machina — but the book recommends asking the table first whether they'd rather embrace the failure: a grim, horrific ending to a horror-themed campaign might not be the worst way to close out this tale if everyone agrees to it."
  },
  {
    key: "ch10-after-ch11",
    name: "Lead-In to Chapter 11 — Willowshore's Fate",
    when: "Aftermath",
    tone: "moss",
    text: "The 4th-level transmigrate ritual keeps the PCs manifested for 1 month; if it expires, they fade away from the living world and return to the Willowshore mindscape, taking their gear with them, and must recast the ritual to return. Each return trip adds 4 new Terror Points the PCs must build up before they can affect the fortress again, and Mago Kai recruits reinforcements or bolsters defenses between trips. Time passes equally in the mindscape — deduct Preparation Points each week as appropriate while they're away. Wait until the first day of the lunar new year (Day 72), then cast 5th-rank transmigrate — from inside the mindscape. Whether the party spends the interval as phantoms in the living world or returns to the mindscape is their choice. The ritual's success depends on how many Hope, Food and Security points Willowshore still holds when it is cast; anything at zero costs citizens and buildings. The sooner they cast, the better — tell them so. The full return table opens Chapter 11 (Act 4). Willowshore's salvation is in sight, but living isn't easy: the town must carve a place in a world that has long forgotten it. Chou Mingxia's obsession with Willowshore's forests doesn't die with Mago Kai, and the jorogumo will notice a new village before long. The PCs have finally won their lives back from death. Now, it's up to them to protect their lives from the ambitions of the living.",
    note: "Foundry: change the season on the Willowshore and Willowshore Hinterlands scenes at the act break.",
    beats: [
      { key: "ch10-after-cast", label: "5th-rank Transmigrate cast on Day 72", note: "Preparation Points cash out here — Hope, Food and Security at zero cost citizens and buildings; the full return table opens Ch 11" }
    ]
  }
];



/* ------------------------------------------------------------------- clock
   The act's spine. Preparation Points live in the Fall Downtime Tracker
   (`world.sogFallDowntime.pools`); this console reads them live and writes
   attrition and event-driven changes straight back, so there is one source of
   truth and the campaign tracker's rollup stays correct. */
const CLOCK = {
  attrition: "Each week of winter: −1d4 Hope, −1 Food, −1 Security. No pool drops below 0.",
  depleted: [
    ["No Hope", "Willowshore is despondent — treat it as a level 1 settlement for buying items and services. Each time you would reduce Hope, instead lose 2 Reputation with both factions."],
    ["No Food", "The people are starving. Each time you would reduce Hope, instead reduce Willowshore's population by 2d6."],
    ["No Security", "The people are defenseless. Each time you would reduce Security, instead reduce Willowshore's population by 1d6."]
  ],
  population: "Willowshore starts winter with 225 people. The final number shapes the Adventure Path's ending — track every loss.",
  createFood: "On a 0-Food week, a Hope loss that would kill 2d6 locals is prevented if the PCs cast enough create food to feed at least 12 people within the hour. Meals last less than a day, so it can't top up the pool.",
  troubles: {
    check: "DC 16 flat check at the start of each week — on a success, roll a complication.",
    minimize: "A PC spends the week's downtime to minimise it (others may Aid). Crit success: nothing lost · success: only 1 point · crit failure: twice as much.",
    rows: [
      ["1–2", "1d4 Food Points", "DC 24 Nature or DC 24 Survival"],
      ["3–4", "1d4 + 2 Hope Points", "DC 24 Diplomacy or DC 24 Performance"],
      ["5–6", "1d4 Security Points", "DC 24 Athletics or DC 24 Crafting"]
    ]
  }
};

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "clock", ctab: { ch8: "events", ch9: "timeline", ch10: "terror" }, pcs,
    week: 1, population: 225,
    rp: { ch8: 0, ch9: 0 },
    components: { kiln: false, feathers: false, slats: false },
    terror: 0,
    influence: {},
    cleared: {},          // card key -> true
    beats: {},            // card key -> { beat key: true }
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
  if (!game.settings.settings.has(WNR_ID)) {
    game.settings.register(WNR_NS, WNR_KEY, { scope: "world", config: false, type: Object, default: null });
  }
  /* Registered so this console can read/write the Fall Downtime Tracker's
     pools whether or not that macro has been run yet in this world. */
  if (!game.settings.settings.has(DOWNTIME_ID)) {
    game.settings.register("world", "sogFallDowntime", { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ------------------------------------------------------------- the journal
   Each chapter is a journal entry in the Season of Ghosts module with a fixed
   id. An area resolves from its own code, because the module encodes the area
   code in the page id (`12c1<slug>` is area C1 of chapter 10) even when the
   page is named plainly. None of this is required — the entry resolves by id,
   then name, then through the compendiums, and if the adventure isn't in the
   world no link renders at all. */
const jnorm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function journalEntry(ch) {
  const meta = CHAPTERS[ch].journal;
  const byId = game.journal?.get?.(meta.id);
  if (byId) return byId;
  const want = jnorm(meta.name), all = [...(game.journal ?? [])];
  return all.find(j => jnorm(j.name) === want)
      ?? all.find(j => jnorm(j.name).endsWith(want)) ?? null;
}

async function journalDoc(ch) {
  const local = journalEntry(ch);
  if (local) return local;
  const meta = CHAPTERS[ch].journal, want = jnorm(meta.name);
  for (const pack of game.packs ?? []) {
    if (pack.documentName !== "JournalEntry") continue;
    const idx = [...pack.index];
    const hit = pack.index.get?.(meta.id) ?? idx.find(e => jnorm(e.name) === want);
    if (hit) return pack.getDocument(hit._id);
  }
  return null;
}

/* A ref is either an exact page id or an area code. The guard on the
   character after the code stops C1 matching C11. */
function journalPage(entry, ch, ref) {
  if (!ref) return null;
  const pages = entry?.pages?.contents ?? entry?.pages ?? [];
  if (/^\d/.test(ref)) return pages.find(p => p.id === ref) ?? null;
  const head = `${CHAPTERS[ch].journal.ord}${ref}`.toLowerCase();
  return pages.find(p => p.id.toLowerCase().startsWith(head)
    && !/\d/.test(p.id.charAt(head.length))) ?? null;
}

async function openJournal(ch, ref) {
  const meta = CHAPTERS[ch].journal;
  const entry = await journalDoc(ch);
  if (!entry) {
    ui.notifications.warn(`No journal found for "${meta.name}". Looked for the id ${meta.id}, then that name in the journal directory and the compendiums.`);
    return;
  }
  const page = journalPage(entry, ch, ref);
  entry.sheet.render(true, page ? { pageId: page.id } : {});
}

/* ----------------------------------------------------------------- engine */
class Winter {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 60); }
  async save() { if (this.editable) await game.settings.set(WNR_NS, WNR_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  /* ----- the downtime pools (the single source of truth) ----- */
  downtime() { return game.settings.get("world", "sogFallDowntime"); }
  get hasDowntime() { return !!this.downtime()?.pools; }
  pools() { return this.downtime()?.pools ?? null; }
  pool(p) { return this.pools()?.[p] ?? 0; }

  async adjustPool(p, delta) {
    const dt = this.downtime();
    if (!dt?.pools) return ui.notifications.error("No downtime tracker state found. Run the Fall Downtime Tracker macro once first.");
    dt.pools[p] = (dt.pools[p] ?? 0) + delta;
    if (dt.pools[p] < 0) dt.pools[p] = 0;
    await game.settings.set("world", "sogFallDowntime", dt);
    this.log(`${p[0].toUpperCase()}${p.slice(1)} ${delta >= 0 ? "+" : ""}${delta} (now ${dt.pools[p]}).`);
    this.touch();
  }

  setWeek(delta) { this.s.week = Math.max(1, this.s.week + delta); this.log(`Week ${this.s.week}.`); this.touch(); }
  setPopulation(delta) { this.s.population = Math.max(0, this.s.population + delta); this.log(`Population ${delta >= 0 ? "+" : ""}${delta} (now ${this.s.population}).`); this.touch(); }

  /* ----- research ----- */
  setRp(ch, delta) {
    const R = ch === "ch8" ? CH8_RESEARCH : CH9_RESEARCH;
    const maxRp = Math.max(R.total, ...(R.thresholds ?? []).map(t => t.rp || 0));
    const cur = this.s.rp[ch] ?? 0;
    this.s.rp[ch] = Math.max(0, Math.min(maxRp, cur + delta));
    this.log(`${CHAPTERS[ch].act} research: ${this.s.rp[ch]} RP.`);
    this.touch();
  }
  rpAt(ch, rp) { return (this.s.rp[ch] ?? 0) >= rp; }

  toggleComponent(key) {
    this.s.components[key] = !this.s.components[key];
    this.log(`Component — ${key}: ${this.s.components[key] ? "secured" : "unsecured"}.`);
    this.touch();
  }

  /* ----- terror ----- */
  setTerror(delta) {
    const cur = this.s.terror;
    this.s.terror = Math.min(8, Math.max(0, cur + delta));
    if (this.s.terror !== cur) this.log(`Terror ${cur} → ${this.s.terror}.`);
    this.touch();
  }

  /* ----- influence (the seance) ----- */
  setInfluence(key, delta, max) {
    const cur = this.s.influence[key] ?? 0;
    this.s.influence[key] = Math.min(max ?? 99, Math.max(0, cur + delta));
    this.log(`Influence — ${key}: ${this.s.influence[key]}.`);
    this.touch();
  }

  /* ----- areas / events ----- */
  toggleCleared(key) {
    const on = !!this.s.cleared[key];
    this.s.cleared[key] = !on;
    this.log(`${key}: ${on ? "reopened" : "cleared"}.`);
    this.touch();
  }

  beat(cardKey, beatKey) { return !!this.s.beats[cardKey]?.[beatKey]; }

  async toggleBeat(cardKey, beatKey, beat) {
    const bucket = this.s.beats[cardKey] ?? (this.s.beats[cardKey] = {});
    const on = !!bucket[beatKey];
    bucket[beatKey] = !on;
    const d = on ? -1 : 1;

    if (beat.xp) { this.s.xp += d * beat.xp; if (!on) ui.notifications.info(`Award ${beat.xp} XP.`); }
    if (beat.terror) { this.s.terror = Math.min(8, Math.max(0, this.s.terror + d * beat.terror)); }

    /* Points write through to the downtime tracker's pools. */
    if (beat.hope || beat.food || beat.security || beat.rep) {
      const dt = this.downtime();
      if (dt?.pools) {
        if (beat.hope) dt.pools.hope = (dt.pools.hope ?? 0) + d * beat.hope;
        if (beat.food) dt.pools.food = (dt.pools.food ?? 0) + d * beat.food;
        if (beat.security) dt.pools.security = (dt.pools.security ?? 0) + d * beat.security;
        if (beat.rep) {
          dt.rep = dt.rep ?? { southbank: 0, northridge: 0 };
          dt.rep.southbank = (dt.rep.southbank ?? 0) + d * beat.rep;
          dt.rep.northridge = (dt.rep.northridge ?? 0) + d * beat.rep;
        }
        await game.settings.set("world", "sogFallDowntime", dt);
      }
    }

    this.log(`${cardKey} — ${beat.label}: ${on ? "undone" : "done"}.`);
    this.touch();
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("No Breath to Cry reset.");
    this.touch();
  }

  /* ----- chat ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "slate") {
    const C = { rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12", ice: "#5b7f9e", muted: "#6d6052" };
    await ChatMessage.create({
      content: `<div style="background:#efe6d8;color:#241c18;border:1px solid #b9a687;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.slate};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "No Breath to Cry" }
    });
  }

  postArea(card, ch) {
    if (!card) return;
    const body = `<p style="margin:0 0 6px">${card.boxed ?? ""}</p>` +
      (card.quote ? `<p style="margin:0;font-style:italic">“${card.quote}”</p>` : "");
    return this.postCard(card.level || (ch ? CHAPTERS[ch].act : "Area"), `${card.id ? card.id + ". " : ""}${card.name}`, body, card.tone);
  }
  postChecks(card, ch) {
    if (!card?.checks?.length) return ui.notifications.warn("No checks recorded for this card.");
    return this.postCard("Checks", `${card.id ? card.id + ". " : ""}${card.name}`,
      `<ul style="margin:0;padding-left:1.1em">${card.checks.map(c => `<li style="margin-bottom:4px">${linkify(c)}</li>`).join("")}</ul>`, card.tone);
  }
  postStatus() {
    const p = this.pools();
    return this.postCard("Act 3", "No Breath to Cry",
      `<p style="margin:0 0 6px"><b>Week</b> ${this.s.week} · <b>Population</b> ${this.s.population}</p>
       <p style="margin:0 0 6px"><b>Pools</b> ${p ? `Hope ${p.hope ?? 0} · Food ${p.food ?? 0} · Security ${p.security ?? 0}` : "downtime tracker not run"}</p>
       <p style="margin:0"><b>Terror</b> ${this.s.terror} · <b>Milestone XP</b> ${this.s.xp}</p>`, "ice");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

/* Card schema — see the DATA block above. Every chapter's areas, events,
   dream obstacles and set pieces render through this one renderer. */
const TONES = ["rust", "ember", "moss", "slate", "plum", "gold", "ice", "muted"];

class WNRApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "nbt-console", tag: "div", classes: ["nbt-console"],
    position: { width: 960, height: "auto" },
    window: { title: "No Breath to Cry", icon: "fa-solid fa-snowflake", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "nbt-console", classes: ["nbt-console"], title: "No Breath to Cry",
      width: 960, height: "auto", resizable: true
    });
  }
  get title() { return "No Breath to Cry"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="nbt-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  jbtn(ch, ref, label = "") {
    const entry = journalEntry(ch);
    if (!entry) return "";
    const page = journalPage(entry, ch, ref);
    return `<button type="button" class="jbtn" data-act="journal" data-ch="${ch}" data-r="${esc(ref ?? "")}"
      title="Open the journal: ${esc(page ? page.name : entry.name)}"><i class="fa-solid fa-book-open"></i>${label ? ` ${label}` : ""}</button>`;
  }

  /* -------------------------------------------------------------- markup */
  markup() {
    const t = this.t, s = t.s, ro = !t.editable;
    const chapter = ["ch8", "ch9", "ch10"].includes(s.tab) ? s.tab : null;
    const sub = chapter ? s.ctab[chapter] : null;
    return `${this.styles()}
      <div class="nbt">
        ${this.header(ro)}
        <nav class="tabs">
          ${TABS.map(z => `<button type="button" class="tab ${s.tab === z.key ? "on" : ""}" style="--tt:var(--${z.tone})" data-act="tab" data-k="${z.key}">
            <b><i class="fa-solid ${z.icon}"></i> ${z.label}</b><small>${z.sub}</small></button>`).join("")}
        </nav>
        ${chapter ? this.subtabs(chapter) : ""}
        ${s.tab === "clock" ? this.clockTab(ro) : ""}
        ${s.tab === "ch8" ? this.chapterTab("ch8", ro) : ""}
        ${s.tab === "ch9" ? this.chapterTab("ch9", ro) : ""}
        ${s.tab === "ch10" ? this.chapterTab("ch10", ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t, p = t.pools();
    const flag = (on, label) => `<span class="flag ${on ? "on" : ""}">${label}</span>`;
    return `
      <header class="topbar">
        <div class="pools">
          ${[["Hope", "hope"], ["Food", "food"], ["Security", "security"]].map(([l, k]) =>
            `<span class="pool ${p && (p[k] ?? 0) <= 0 ? "empty" : ""}" title="${l} Points"><b>${p ? (p[k] ?? 0) : "—"}</b><i>${l}</i></span>`).join("")}
        </div>
        <div class="flags">
          ${flag(t.hasDowntime, "Downtime tracker")}
          <span class="flag">Week <b>${t.s.week}</b></span>
          <span class="flag">People <b>${t.s.population}</b></span>
          <span class="flag">Terror <b>${t.s.terror}</b></span>
        </div>
        <div class="xp"><span>Milestone XP</span><b>${t.s.xp}</b></div>
        <button type="button" class="say" data-act="poststatus" title="Post the standing"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset winter" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  subtabs(chapter) {
    const s = this.t.s, c = CHAPTERS[chapter];
    return `<nav class="subtabs">
      ${c.subs.map(z => `<button type="button" class="subtab ${s.ctab[chapter] === z.key ? "on" : ""}" style="--tt:var(--${c.tone})" data-act="sub" data-ch="${chapter}" data-k="${z.key}">
        <i class="fa-solid ${z.icon}"></i> ${z.label}<small>${z.sub}</small></button>`).join("")}
    </nav>`;
  }

  /* --------------------------------------------------------------- clock */
  clockTab(ro) {
    const t = this.t;
    const poolRow = ([label, key]) => `
      <div class="clockrow">
        <span class="clabel">${label}</span>
        <button type="button" class="qbtn" data-act="pool" data-p="${key}" data-d="-1" ${ro || !t.hasDowntime ? "disabled" : ""}>−</button>
        <b class="${(t.pool(key)) <= 0 ? "neg" : ""}">${t.pool(key)}</b>
        <button type="button" class="qbtn" data-act="pool" data-p="${key}" data-d="1" ${ro || !t.hasDowntime ? "disabled" : ""}>+</button>
      </div>`;
    return `
      <section class="panel" style="--tone:var(--ice)">
        <h3>The winter clock <small>draws down the town's Preparation Points</small></h3>
        ${t.hasDowntime
          ? `<div class="poolgrid">${[["Hope", "hope"], ["Food", "food"], ["Security", "security"]].map(poolRow).join("")}</div>`
          : `<p class="hint">Run the Fall Downtime Tracker once and the three pools appear here, live. Until then the buttons are disabled.</p>`}
        <p class="text">${CLOCK.attrition}</p>
        <p class="hint">${CLOCK.createFood}</p>
      </section>

      <section class="panel" style="--tone:var(--slate)">
        <h3>Population <small>starts at 225 — track every loss</small></h3>
        <div class="clockrow">
          <span class="clabel">People</span>
          <button type="button" class="qbtn" data-act="pop" data-d="-1" ${ro ? "disabled" : ""}>−</button>
          <b>${t.s.population}</b>
          <button type="button" class="qbtn" data-act="pop" data-d="1" ${ro ? "disabled" : ""}>+</button>
        </div>
        <p class="text">${CLOCK.population}</p>
      </section>

      <section class="panel" style="--tone:var(--moss)">
        <h3>Week <small>winter is long</small></h3>
        <div class="clockrow">
          <span class="clabel">Week</span>
          <button type="button" class="qbtn" data-act="week" data-d="-1" ${ro ? "disabled" : ""}>−</button>
          <b>${t.s.week}</b>
          <button type="button" class="qbtn" data-act="week" data-d="1" ${ro ? "disabled" : ""}>+</button>
        </div>
      </section>

      <section class="panel" style="--tone:var(--rust)">
        <h3>Unexpected Troubles <small>${CLOCK.troubles.check}</small></h3>
        <p class="text">${CLOCK.troubles.minimize}</p>
        <table class="table">
          <thead><tr><th>Roll</th><th>Loss</th><th>Minimise with</th></tr></thead>
          <tbody>${CLOCK.troubles.rows.map(r =>
            `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${linkify(r[2])}</td></tr>`).join("")}</tbody>
        </table>
      </section>

      <section class="panel" style="--tone:var(--gold)">
        <h3>Depleted tracks <small>what an empty pool costs</small></h3>
        <ul class="checks">${CLOCK.depleted.map(([l, d]) => `<li><b>${l}</b> — ${d}</li>`).join("")}</ul>
      </section>`;
  }

  /* ------------------------------------------------------------- chapters */
  chapterTab(chapter, ro) {
    const s = this.t.s, c = CHAPTERS[chapter], sub = s.ctab[chapter];
    if (chapter === "ch8") {
      if (sub === "events") return CH8_EVENTS.map(a => this.cardMarkup(a, "ch8", ro)).join("");
      if (sub === "research") return this.researchMarkup("ch8", CH8_RESEARCH, ro);
      return CH8_DREAM.map(a => this.cardMarkup(a, "ch8", ro)).join("");
    }
    if (chapter === "ch9") {
      if (sub === "timeline") return CH9_TIMELINE.map(a => this.cardMarkup(a, "ch9", ro)).join("");
      if (sub === "research") return this.researchMarkup("ch9", CH9_RESEARCH, ro);
      return CH9_PIECES.map(a => this.cardMarkup(a, "ch9", ro)).join("");
    }
    if (sub === "terror") return this.terrorMarkup(ro);
    if (sub === "fortress") return CH10_AREAS.map(a => this.cardMarkup(a, "ch10", ro)).join("");
    return CH10_AFTER.map(a => this.cardMarkup(a, "ch10", ro)).join("");
  }

  researchMarkup(ch, R, ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--${CHAPTERS[ch].tone})">
        <h3>${R.title} <small>${R.subtitle}</small>
          ${this.jbtn(ch, "")}
        </h3>
        <div class="clockrow">
          <span class="clabel">Research Points</span>
          <button type="button" class="qbtn" data-act="rp" data-ch="${ch}" data-d="-1" ${ro ? "disabled" : ""}>−</button>
          <b>${t.s.rp[ch] ?? 0}</b>
          <button type="button" class="qbtn" data-act="rp" data-ch="${ch}" data-d="1" ${ro ? "disabled" : ""}>+</button>
        </div>
        <p class="hint">${R.total} RP to finish. Investigation caps apply per mode, not overall.</p>
        <table class="table">
          <thead><tr><th>Mode</th><th>Max RP</th><th>Checks</th></tr></thead>
          <tbody>${R.modes.map(m =>
            `<tr><td>${m.name}</td><td>${m.max}</td><td>${m.checks.map(c => linkify(c)).join(" · ")}</td></tr>`).join("")}</tbody>
        </table>
      </section>

      ${R.thresholds.map(th => `
        <section class="panel rev ${t.rpAt(ch, th.rp) ? "on" : ""}" style="--tone:var(--gold)">
          <h3><span class="eid">${th.rp} RP</span>${th.title ?? `Revelation`}
            ${th.xp ? `<span class="lvl">${th.xp} XP</span>` : ""}</h3>
          <p class="text">${th.text}</p>
        </section>`).join("")}

      ${R.components?.length ? `
        <section class="panel" style="--tone:var(--ember)">
          <h3>Components <small>gathered before the casting</small></h3>
          ${R.components.map(c => `
            <label class="check"><input type="checkbox" data-act="component" data-k="${c.key}" ${t.s.components[c.key] ? "checked" : ""} ${ro ? "disabled" : ""}>
              ${c.label}</label>
            ${c.note ? `<p class="beatnote">${c.note}</p>` : ""}`).join("")}
        </section>` : ""}

      ${R.cast ? `
        <section class="panel" style="--tone:var(--plum)">
          <h3>${R.cast.title}</h3>
          <p class="text">${R.cast.text}</p>
        </section>` : ""}

      ${R.aside ? `
        <section class="panel" style="--tone:var(--slate)">
          <h3>${R.aside.title}</h3>
          <p class="text">${R.aside.text}</p>
        </section>` : ""}`;
  }

  terrorMarkup(ro) {
    const t = this.t, T = CH10_TERROR;
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3>Terror <small>their one real weapon</small></h3>
        <div class="clockrow">
          <span class="clabel">Terror Points</span>
          <button type="button" class="qbtn" data-act="terror" data-d="-1" ${ro ? "disabled" : ""}>−</button>
          <b class="${t.s.terror >= 7 ? "neg" : ""}">${t.s.terror}</b>
          <button type="button" class="qbtn" data-act="terror" data-d="1" ${ro ? "disabled" : ""}>+</button>
        </div>
        <p class="text">${T.note}</p>
        <p class="hint">${T.decay}</p>
        <p class="hint">${T.teach}</p>
      </section>

      <section class="panel" style="--tone:var(--slate)">
        <h3>Thresholds <small>what each Terror level does</small></h3>
        <table class="table terror">
          <thead><tr><th>Terror</th><th>Fear</th><th>Fortress response</th></tr></thead>
          <tbody>${T.thresholds.map(([lv, fear, resp]) =>
            `<tr class="${t.s.terror >= Number(lv) ? "on" : ""}"><td>${lv}</td><td>${fear}</td><td>${resp}</td></tr>`).join("")}</tbody>
        </table>
      </section>

      <section class="panel" style="--tone:var(--rust)">
        <h3>The Terror menu <small>every published way to earn a point</small></h3>
        <table class="table">
          <thead><tr><th>Action</th><th>Points</th><th>Notes</th></tr></thead>
          <tbody>${T.menu.map(m =>
            `<tr><td>${m.action}</td><td>${m.points}</td><td>${m.note ?? ""}</td></tr>`).join("")}</tbody>
        </table>
      </section>`;
  }

  /* ------------------------------------------------------------- the card */
  cardMarkup(card, ch, ro) {
    const t = this.t;
    const cleared = !!t.s.cleared[card.key];
    const beats = card.beats ?? [];
    return `
      <section class="panel area ${cleared ? "done" : ""}" style="--tone:var(--${TONES.includes(card.tone) ? card.tone : "muted"})">
        <h3>${card.id ? `<span class="eid">${card.id}</span>` : ""}${card.name}
          ${card.level ? `<span class="lvl">${card.level}</span>` : ""}
          ${card.when ? `<small>${card.when}</small>` : ""}
          ${card.id ? this.jbtn(ch, card.id) : ""}
          <button type="button" class="say" data-act="postarea" data-k="${card.key}" data-ch="${ch}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
          ${card.checks?.length ? `<button type="button" class="say" data-act="postchecks" data-k="${card.key}" data-ch="${ch}" title="Post the checks"><i class="fa-solid fa-dice-d20"></i></button>` : ""}
        </h3>
        ${card.boxed ? `<p class="boxed">${card.boxed}</p>` : ""}
        ${card.creatures ? `<p class="crea"><b>Creatures</b> ${card.creatures}</p>` : ""}
        ${card.text ? `<p class="text">${card.text}</p>` : ""}
        ${card.quote ? `<p class="quote">“${card.quote}”</p>` : ""}
        ${card.checks?.length ? `<ul class="checks">${card.checks.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
        ${card.note ? `<p class="note">${card.note}</p>` : ""}
        ${card.outcomes?.length ? `<ul class="outcomes">${card.outcomes.map(o => `<li>${o}</li>`).join("")}</ul>` : ""}
        ${card.qa?.length ? `<div class="qa">${card.qa.map(([q, ans]) => `<p><b>${q}</b> “${ans}”</p>`).join("")}</div>` : ""}
        ${card.phases?.length ? `<ol class="phases">${card.phases.map(p => `<li>${p}</li>`).join("")}</ol>` : ""}
        ${card.hazard ? `<p class="loot"><b>Hazard</b> ${card.hazard}</p>` : ""}
        ${card.treasure ? `<p class="loot"><b>Treasure</b> ${card.treasure}</p>` : ""}
        ${card.aside ? `<div class="aside"><b>${card.aside.title}</b><p>${card.aside.text}</p></div>` : ""}
        ${card.influence?.length ? `<div class="sub influence">
          <div class="subhead"><i class="fa-solid fa-scale-balanced"></i> Influence <span>${card.influence.filter(i => (t.s.influence[i.key] ?? 0) >= (i.max ?? 99)).length} of ${card.influence.length} settled</span></div>
          ${card.influence.map(i => `
            <div class="inflrow">
              <span class="ilabel">${i.label}</span>
              <button type="button" class="qbtn" data-act="infl" data-k="${i.key}" data-max="${i.max ?? 99}" data-d="-1" ${ro ? "disabled" : ""}>−</button>
              <b>${t.s.influence[i.key] ?? 0}</b>
              <button type="button" class="qbtn" data-act="infl" data-k="${i.key}" data-max="${i.max ?? 99}" data-d="1" ${ro ? "disabled" : ""}>+</button>
              <span class="itag">${i.max ? `of ${i.max}` : "∞"}</span>
            </div>
            ${i.note ? `<p class="beatnote">${i.note}</p>` : ""}
            ${i.reveal && (t.s.influence[i.key] ?? 0) >= (i.max ?? 99) ? `<p class="bonus">${i.reveal}</p>` : ""}`).join("")}
        </div>` : ""}
        ${beats.length ? `<div class="sub beats">
          <div class="subhead"><i class="fa-solid fa-circle-check"></i> What can happen here <span>${beats.filter(b => t.beat(card.key, b.key)).length} of ${beats.length}</span></div>
          ${beats.map(b => `
            <label class="check"><input type="checkbox" data-act="beat" data-k="${card.key}" data-b="${b.key}" ${t.beat(card.key, b.key) ? "checked" : ""} ${ro ? "disabled" : ""}>
              ${b.label}${b.xp ? ` <span class="tag">${b.xp} XP</span>` : ""}${b.hope ? ` <span class="tag">${b.hope > 0 ? "+" : ""}${b.hope} Hope</span>` : ""}${b.food ? ` <span class="tag">${b.food > 0 ? "+" : ""}${b.food} Food</span>` : ""}${b.security ? ` <span class="tag">${b.security > 0 ? "+" : ""}${b.security} Security</span>` : ""}${b.rep ? ` <span class="tag">${b.rep > 0 ? "+" : ""}${b.rep} Rep</span>` : ""}${b.terror ? ` <span class="tag warn">${b.terror > 0 ? "+" : ""}${b.terror} Terror</span>` : ""}</label>
            ${b.note ? `<p class="beatnote">${b.note}</p>` : ""}`).join("")}
        </div>` : ""}
        <div class="btnrow">
          <button type="button" class="${cleared ? "ghost" : "primary"}" data-act="cleared" data-k="${card.key}" ${ro ? "disabled" : ""}>
            ${cleared ? "Reopen" : "Mark done"}
          </button>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------- listeners */
  wire(root) {
    if (!root || root.dataset?.nbtWired === "1") return;
    if (root.dataset) root.dataset.nbtWired = "1";
    const t = this.t;
    const cardByKey = (k) => {
      for (const arr of [CH8_EVENTS, CH8_DREAM, CH9_TIMELINE, CH9_PIECES, CH10_AREAS, CH10_AFTER]) {
        const hit = arr.find(a => a.key === k);
        if (hit) return hit;
      }
      return null;
    };
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act;
      if (a === "tab") { t.s.tab = btn.dataset.k; t.touch(); }
      else if (a === "sub") { t.s.ctab[btn.dataset.ch] = btn.dataset.k; t.touch(); }
      else if (a === "journal") openJournal(btn.dataset.ch, btn.dataset.r || null);
      else if (a === "pool") t.adjustPool(btn.dataset.p, Number(btn.dataset.d));
      else if (a === "pop") t.setPopulation(Number(btn.dataset.d));
      else if (a === "week") t.setWeek(Number(btn.dataset.d));
      else if (a === "rp") t.setRp(btn.dataset.ch, Number(btn.dataset.d));
      else if (a === "terror") t.setTerror(Number(btn.dataset.d));
      else if (a === "infl") t.setInfluence(btn.dataset.k, Number(btn.dataset.d), Number(btn.dataset.max));
      else if (a === "cleared") t.toggleCleared(btn.dataset.k);
      else if (a === "postarea") t.postArea(cardByKey(btn.dataset.k), btn.dataset.ch ?? "");
      else if (a === "postchecks") t.postChecks(cardByKey(btn.dataset.k), btn.dataset.ch ?? "");
      else if (a === "poststatus") t.postStatus();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "beat") {
        const card = cardByKey(el.dataset.k);
        const beat = card?.beats?.find(b => b.key === el.dataset.b);
        if (beat) t.toggleBeat(el.dataset.k, el.dataset.b, beat);
      } else if (el.dataset.act === "component") {
        t.toggleComponent(el.dataset.k);
      }
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #nbt-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #nbt-console .window-content > * { background:transparent; }
      .nbt { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --ice:${p.ice}; --snow:${p.snow}; --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --plumSoft:${p.plumSoft};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .nbt * { box-sizing:border-box; }
      .nbt button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
      .nbt button:hover:not(:disabled) { background:var(--hover); }
      .nbt button:disabled { opacity:.45; cursor:not-allowed; }
      .nbt input[type="checkbox"] { accent-color:var(--ice); }
      .nbt h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.04em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:2px solid var(--tone, var(--line));
               padding-bottom:.3rem; flex-wrap:wrap; }
      .nbt h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .nbt h1, .nbt h2, .nbt h4, .nbt legend { color:var(--ink); }
      .nbt .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .nbt .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .nbt .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .nbt .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 5px; letter-spacing:.06em; }
      .nbt .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .nbt .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .nbt .say + .say { margin-left:.25rem; }
      .nbt .boxed { font-size:.82rem; line-height:1.5; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; white-space:pre-line; }
      .nbt .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; white-space:pre-line; }
      .nbt .quote { font-size:.82rem; line-height:1.5; margin:.3rem 0 .45rem; padding-left:.55rem;
                   border-left:2px solid var(--tone, var(--line)); font-style:italic; color:var(--ink); }
      .nbt .note { font-size:.78rem; line-height:1.45; color:var(--muted); font-style:italic; margin:.2rem 0 .4rem; white-space:pre-line; }
      .nbt .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .nbt .crea { font-size:.76rem; margin:.1rem 0 .35rem; color:var(--muted); }
      .nbt .crea b { color:var(--tone, var(--ink)); }
      .nbt .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .nbt .req { font-size:.76rem; margin:.1rem 0 .35rem; }
      .nbt .checks { margin:0 0 .45rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; color:var(--muted); }
      .nbt .checks li { margin-bottom:.25rem; }
      .nbt .outcomes { margin:.2rem 0 .3rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; }
      .nbt .outcomes li { margin-bottom:.25rem; }
      .nbt .outcomes b { color:var(--tone, var(--ink)); }
      .nbt .phases { margin:.2rem 0 .3rem; padding-left:1.2rem; font-size:.79rem; line-height:1.5; }
      .nbt .phases li { margin-bottom:.3rem; }
      .nbt .qa { font-size:.78rem; line-height:1.45; margin:.2rem 0 .4rem; }
      .nbt .qa p { margin:.2rem 0; }
      .nbt .qa b { display:block; color:var(--tone, var(--ink)); }
      .nbt .aside { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0;
                   background:var(--stripe); font-size:.78rem; line-height:1.45; }
      .nbt .aside b { display:block; text-transform:uppercase; letter-spacing:.07em; font-size:.68rem;
                     font-weight:700; color:var(--slate); margin-bottom:.25rem; }
      .nbt .aside p { margin:0; }
      .nbt .check { display:block; font-size:.8rem; margin-bottom:.25rem; line-height:1.4; }
      .nbt .check.big { font-size:.84rem; margin:.4rem 0; }
      .nbt .tag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--moss); color:var(--moss); margin-left:.25rem; }
      .nbt .tag.warn { border-color:var(--rust); color:var(--rust); }
      .nbt .beatnote { font-size:.75rem; line-height:1.45; color:var(--muted); margin:.1rem 0 .4rem 1.35rem;
                      padding-left:.5rem; border-left:1px solid var(--line); }

      .nbt .sub { --sub:var(--line); background:var(--stripe); border:1px solid var(--sub);
                 border-radius:4px; overflow:hidden; padding:.4rem .5rem .45rem; margin:.5rem 0; }
      .nbt .sub.beats { --sub:var(--moss); }
      .nbt .sub.influence { --sub:var(--plum); }
      .nbt .subhead { font-size:.66rem; text-transform:uppercase; letter-spacing:.1em; font-weight:700;
                     display:flex; align-items:center; gap:.4rem;
                     background:var(--sub, var(--muted)); color:var(--paper);
                     margin:-.4rem -.5rem .45rem; padding:.28rem .5rem; border-radius:2px 2px 0 0; }
      .nbt .subhead i { color:var(--paper); opacity:.8; font-size:.72rem; }
      .nbt .subhead span { margin-left:auto; font-weight:600; color:var(--paper); letter-spacing:.06em;
                          border-radius:8px; padding:0 7px; background:rgba(0,0,0,.22); }

      .nbt .jbtn { font-size:.62rem; padding:1px 5px; border-radius:3px; color:var(--slate);
                  border-color:var(--line); flex:none; letter-spacing:.04em; }
      .nbt .jbtn i { font-size:.66rem; }
      .nbt .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; }
      .nbt .primary { background:var(--tone, var(--ice)); border-color:var(--tone, var(--ice));
                     color:var(--paper); font-weight:600; padding:.3rem .7rem; font-size:.76rem; }
      .nbt .primary:hover:not(:disabled) { filter:brightness(1.1); background:var(--tone, var(--ice)); }
      .nbt .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .nbt .blocked { font-size:.76rem; color:var(--rust); margin:.2rem 0 .4rem; }
      .nbt .bonus { font-size:.76rem; font-weight:600; color:var(--moss); margin:.3rem 0 0; }

      .nbt .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .nbt .pools { display:flex; align-items:center; gap:.4rem; }
      .nbt .pool { display:flex; align-items:baseline; gap:.25rem; padding:2px 8px; border-radius:10px;
                   border:1px solid var(--ice); }
      .nbt .pool b { font-size:.95rem; line-height:1; color:var(--ice); }
      .nbt .pool i { font-style:normal; font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .nbt .pool.empty { border-color:var(--rust); }
      .nbt .pool.empty b { color:var(--rust); }
      .nbt .flags { display:flex; gap:.3rem; flex-wrap:wrap; }
      .nbt .flag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:2px 7px;
                  border-radius:10px; border:1px solid var(--line); color:var(--muted); }
      .nbt .flag.on { border-color:var(--moss); color:var(--moss); font-weight:700; }
      .nbt .xp { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; }
      .nbt .xp span { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .nbt .xp b { font-size:1rem; line-height:1; }

      .nbt .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .nbt .tab { flex:1; padding:.3rem .2rem; font-size:.76rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .nbt .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .nbt .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .nbt .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .nbt .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .nbt .tab.on b i, .nbt .tab.on small { color:var(--paper); opacity:.85; }

      .nbt .subtabs { display:flex; gap:3px; margin-bottom:.6rem; flex-wrap:wrap; }
      .nbt .subtab { flex:1; padding:.22rem .4rem; font-size:.74rem; gap:.35rem;
                    border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .nbt .subtab i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .nbt .subtab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                           text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .nbt .subtab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .nbt .subtab.on i, .nbt .subtab.on small { color:var(--paper); opacity:.85; }

      .nbt .clockrow { display:flex; align-items:center; gap:.5rem; margin:.3rem 0 .5rem; }
      .nbt .clockrow b { font-size:1.1rem; line-height:1; color:var(--ice); min-width:1.4rem; text-align:center; }
      .nbt .clockrow b.neg { color:var(--rust); }
      .nbt .clabel { font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .nbt .poolgrid { display:grid; grid-template-columns:repeat(3, 1fr); gap:.5rem; margin:.2rem 0 .5rem; }
      .nbt .poolgrid .clockrow { border:1px solid var(--line); border-radius:4px; padding:.35rem .5rem;
                                 background:var(--stripe); justify-content:center; margin:0; }

      .nbt .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }
      .nbt .inflrow { display:flex; align-items:center; gap:.4rem; margin:.2rem 0; }
      .nbt .ilabel { font-size:.76rem; min-width:9rem; }
      .nbt .inflrow b { min-width:1.2rem; text-align:center; }
      .nbt .itag { font-size:.64rem; color:var(--muted); }

      .nbt .table { width:100%; border-collapse:collapse; font-size:.74rem; margin:.3rem 0 .4rem; }
      .nbt .table th { text-align:left; font-size:.62rem; text-transform:uppercase; letter-spacing:.07em;
                       color:var(--muted); border-bottom:1px solid var(--line); padding:.2rem .35rem; }
      .nbt .table td { border-bottom:1px solid var(--stripe); padding:.25rem .35rem; vertical-align:top; line-height:1.4; }
      .nbt .table.terror tr.on td { background:var(--plumSoft); }
      .nbt .table.terror tr.on td:first-child { font-weight:700; color:var(--plum); }

      .nbt .panel.rev { opacity:.55; }
      .nbt .panel.rev.on { opacity:1; box-shadow:inset 0 0 0 1px var(--gold); }

      .nbt .area.done h3 .eid { opacity:.6; }

      @media (max-width:800px) {
        .nbt .poolgrid { grid-template-columns:1fr; }
        .nbt .tabs, .nbt .subtabs { flex-wrap:wrap; }
      }
    </style>`;
  }
}

if (AppV2) {
  WNRApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSettings();
  let state = game.settings.get(WNR_NS, WNR_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(WNR_NS, WNR_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const winter = new Winter(state);
  const app = new WNRApp(winter);

  if (!globalThis.__nbtHook) {
    globalThis.__nbtHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if ((setting.key !== WNR_ID && setting.key !== DOWNTIME_ID) || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { winter.state = fresh; winter.render(); }
    });
  }
  app.render(true);
})();
