/* ============================================================================
   THE SUMMER THAT NEVER WAS — Summer Console (Act 1)
   Season of Ghosts, Act 1 · Chapters 1–4 · party levels 1–3
   Foundry VTT v11 / v12 / v13 / v14  •  built for PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.
   Runs the whole of summer: the monster-held town and the Eternal Lantern
   (Chapter 1), the downtown clearance and the two remaining ringleaders
   (Chapter 2), the sandbox and the leadership duel (Chapter 3, which points
   to the who-leads-willowshore-console for the duel itself), and the Wall of
   Ghosts and the noppera-bo lumber camp (Chapter 4).
   ============================================================================ */

const SMR_NS = "world";
const SMR_KEY = "sogSummer";
const SMR_ID = `${SMR_NS}.${SMR_KEY}`;
const DOWNTIME_ID = "world.sogFallDowntime";   // read/write: Reputation (+ Hope/Food/Security beats)
const MAX_PCS = 4;

const DEG = ["cs", "s", "f", "cf"];
const DEG_LABEL = { cs: "Crit Success", s: "Success", f: "Failure", cf: "Crit Failure" };

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

/* ----------------------------------------------------------------- chapters
   Four chapters, one window. The top tab strip carries the act's spine (the
   town) and the four chapters; a second strip under it switches views inside
   a chapter. Chapter 3's duel sub-tab points at the who-leads-willowshore
   console rather than re-authoring the set piece. */
const CHAPTERS = {
  ch1: {
    key: "ch1", title: "To Light the Night", level: 1, act: "Ch 1",
    journal: { id: "pf2apsog03toligh", name: "Act 1.1: To Light the Night", ord: "03" },
    tone: "gold", icon: "fa-fire",
    subs: [
      { key: "town",    label: "The Town",    sub: "waking · contacts · missions", icon: "fa-house" },
      { key: "lantern", label: "The Lantern", sub: "coins · shrines · Dawnstep",   icon: "fa-fire-flame-curved" }
    ]
  },
  ch2: {
    key: "ch2", title: "Reclaiming Willowshore", level: 1, act: "Ch 2",
    journal: { id: "pf2apsog04reclai", name: "Act 1.2: Reclaiming Willowshire", ord: "04" },
    tone: "moss", icon: "fa-broom",
    subs: [
      { key: "downtown", label: "Downtown",     sub: "the B-areas",            icon: "fa-city" },
      { key: "butcher",  label: "Gray Butcher", sub: "a parade of cookware",   icon: "fa-utensils" },
      { key: "teahouse", label: "Teahouse",     sub: "Mo Douqiu's hold",       icon: "fa-mug-hot" }
    ]
  },
  ch3: {
    key: "ch3", title: "The Willowshore Curse", level: 2, act: "Ch 3",
    journal: { id: "pf2apsog05thewil", name: "Act 1.3: The Willowshore Curse", ord: "05" },
    tone: "plum", icon: "fa-wand-magic-sparkles",
    subs: [
      { key: "town",       label: "The Town",      sub: "Shinzo · the aftermath",   icon: "fa-cart-shopping" },
      { key: "hinterlands", label: "Hinterlands",  sub: "D1–D13 · opportunities",   icon: "fa-mountain" },
      { key: "curse",      label: "Investigations", sub: "governor · mists · Ugly Cute", icon: "fa-magnifying-glass" },
      { key: "duel",       label: "The Duel",      sub: "Who Leads Willowshore",    icon: "fa-scale-balanced" }
    ]
  },
  ch4: {
    key: "ch4", title: "The Wall of Ghosts", level: 3, act: "Ch 4",
    journal: { id: "pf2apsog06thewal", name: "Act 1.4: The Wall of Ghosts", ord: "06" },
    tone: "slate", icon: "fa-ghost",
    subs: [
      { key: "camp",   label: "Lumber Camp", sub: "E1–E17 · noppera-bos", icon: "fa-tree" },
      { key: "ritual", label: "The Ritual",  sub: "Zoudou · the Wall",    icon: "fa-wand-sparkles" }
    ]
  }
};
/* The town's own areas carry W-codes, and they live in the module's
   "Willowshore" gazetteer entry rather than any chapter — resolved here. */
const WILLOWSHORE_JOURNAL = { id: "pf2apsog02willow", name: "Willowshore", ord: "02" };
const TABS = [
  { key: "town", label: "Summer",     sub: "the town", tone: "ember", icon: "fa-sun" },
  { key: "ch1",  label: "To Light",   sub: "Ch 1", tone: CHAPTERS.ch1.tone, icon: CHAPTERS.ch1.icon },
  { key: "ch2",  label: "Reclaiming", sub: "Ch 2", tone: CHAPTERS.ch2.tone, icon: CHAPTERS.ch2.icon },
  { key: "ch3",  label: "The Curse",  sub: "Ch 3", tone: CHAPTERS.ch3.tone, icon: CHAPTERS.ch3.icon },
  { key: "ch4",  label: "The Wall",   sub: "Ch 4", tone: CHAPTERS.ch4.tone, icon: CHAPTERS.ch4.icon }
];

/* ==========================================================================
   CHAPTER DATA
   The card objects below are authored from the Act 1 chapter text. Each card
   is rendered by the shared `cardMarkup()` below — see its schema comment.

   Card schema (all fields optional except key/name):
     id         badge text (an area code like "A1" or "B4"); also the
                journal-link ref — resolved as `<ordinal><id><slug>`
     key        UNIQUE state key (prefix ch1-/ch2-/ch3-/ch4-)
     name       card title
     when       timing subtitle (optional)
     level      encounter level, e.g. "Moderate 1" (optional)
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
     beats      [{ key, label, note, xp, hope, food, security, rep, repS, repN }]
                — toggles; xp accrues in this console, hope/food/security write
                through to the downtime tracker's pools, and rep awards faction
                reputation: `rep` = +N to BOTH factions, `repS` = Southbank only,
                `repN` = Northridge only (chapter 2 swings one faction at a time)
     aside      { title, text }
     influence  [{ key, label, max, note, reveal }] — a +/- tracker
   ========================================================================== */


// Chapter 1 card data — Season of Ghosts Book 1, "The Summer That Never Was"
// Source digest: act1macromaterial/digests/ch1.md
// CH1_TOWN: prologue/waking, First Day of Summer, Back to Town, Making Contact, First Missions
// CH1_LANTERN: Blessing the Coins, Liberating the Bridge, Light the Night

const CH1_TOWN = [
  {
    key: "ch1-prologue",
    name: "To Light the Night: The Mindscape Reset",
    when: "Backstory — 115 years before, and this cycle's reset",
    tone: "slate",
    text: "Willowshore fell in 7223 ic to monsters manifested from Kugaptee's thoughts. The town is a mindscape created 115 years ago, when the governor's failed ritual to protect the town from the ancient fiend Kugaptee killed everyone and trapped their souls. Each year the mindscape's cycle reset to the first day of summer with no memories retained.\n\nThe death of the stone spider guardian \"Ugly Cute\" (killed by Mago Kai's expedition, which briefly occupied the ruins) removed the town's spiritual protection; Kugaptee's influence created a \"Wall of Ghosts\" around the hinterlands and manifested monsters that overran the town in the final days of spring. Three ringleaders: Gurglegut (a gluttonous buso), Gray Butcher (a vain ittan-momen), Mo Douqiu (a hedonistic rokurokubi).\n\nThis cycle the manifestations did NOT reset — the townsfolk woke on the first day of summer to a monster-infested town with no memories of how it happened. Ugly Cute was reborn in the mindscape and fights the monsters. The PCs awaken in a forest clearing (the campaign's start).",
    note: "If the mindscape is destroyed, Willowshore's trapped souls return to life; otherwise they face true death and a long-delayed trip to the Boneyard.",
  },
  {
    key: "ch1-waking",
    id: "W38",
    name: "Waking in the Woods",
    when: "First Day of Summer — campaign start, dawn",
    tone: "moss",
    text: "The PCs wake on the first day of summer in a forest clearing, remembering the previous night: they were \"abducted\" by townsfolk during the height of the Reenactment Festival, still wearing red blindfolds, asleep in straw mat bundles. The festival organizers drop abductees at a different spot each year. The clearing is east of Willowshore — area W38. A game trail leads west back toward town (downhill, toward the sound of a river).",
    checks: [
      "DC 10 Survival or DC 10 Willowshore Lore — realize you awoke in a clearing east of Willowshore (W38) and a nearby game trail leads west toward town",
    ],
    note: "Partially overcast, crisp early-summer chill warming by noon; clouds grow more ominous as the day draws on and rain begins to fall. Ask each PC what Exploration Activity they use heading back; if they wait in the clearing they can Investigate or Detect Magic. The Strange Aggression encounter happens regardless of their choice.",
  },
  {
    key: "ch1-primer",
    name: "Campaign Primer for Players",
    when: "What the PCs Know",
    tone: "muted",
    text: "If the Season of Ghosts Player's Guide is in use, players know: (1) the season of ghosts is early summer in Specterwood when hauntings, spirits, and undead increase and ghosts lure folks to their deaths; (2) the Reenactment Festival — after a feast on the last day of spring, villagers in paper masks reenact \"ghosts\" snatching people; wailers mourn; a search-and-rescue is played out; the farce tricks real ghosts into haunting a happier village. The PCs played the abductees, who spend the night blindfolded and wrapped in straw mats until \"ransomed\" in the morning by the local in charge of that year's festival; (3) the PCs have all their items and any companions selected at character creation.",
    note: "The main organizer of this year's ritual, the miller Choe Chung-hu, said he would arrive by sunrise with food to \"ransom\" the PCs. His absence is strange — the miller seldom goes back on his word. PCs may return to town without the ransom (as if they \"escaped from their kidnappers\").",
  },
  {
    key: "ch1-strange-aggression",
    name: "Strange Aggression",
    when: "First Day of Summer — as the PCs head back to town (or if they wait in the clearing)",
    level: "Trivial 1",
    tone: "rust",
    creatures: "Giant Centipedes (2)",
    text: "Kugaptee's growing influence makes wildlife unusually aggressive and supernaturally vocal. Two giant centipedes scuttle out of the undergrowth; bright orange, they hiss at first, then the hisses form words: \"meat... flesh... bones... fingers... hair... skin... eyes...\" — gasping out the parts of the PCs they hope to feed upon; the whispering grows into short sentences as the fight progresses. Concluding the fight leads into \"Maze of Mist, Rain of Blood\" as they travel.",
    checks: [
      "DC 15 Nature or DC 15 Survival (secret) — how unusual it is for giant centipedes to be so quickly aggressive and to avoid fleeing, especially in daylight (Sinister Animals sidebar)",
      "DC 15 Occultism or DC 15 Religion (secret) — these animals are being influenced by an evil spirit",
    ],
    aside: {
      title: "Sinister Animals (sidebar)",
      text: "These animals — along with many other aggressive animals in the mindscape — are physical manifestations of Kugaptee's influence. They have unusual intellect (Int +0) and can speak Common; cruel, sadistic personalities are a side effect of the fiend's increased presence, but they otherwise have standard statistics for their kind.",
    },
  },
  {
    key: "ch1-maze-of-mist",
    name: "Maze of Mist, Rain of Blood",
    when: "First Day of Summer — travel down the game trail; persists until the Eternal Lantern is lit",
    tone: "slate",
    boxed: "Lazy Adou took a break, and\ndid not light the lamp that day.\nThis proved to be a big mistake, for\nthen the ghosts came out to play!\nHazy mist and moon of blood,\nall because he just gave up.\n— Lantern Poem",
    text: "Mist rolls in as the PCs travel down the game trail; a full fog by the time they reach the riverside road, 10 minutes after leaving the clearing. Crossing the Duyue River bridge confirms they are at the easternmost edge of Willowshore; the fog persists. If the PCs don't recall the rhyme, a rescued NPC of the GM's choice can teach it to them.",
    checks: [
      "DC 13 Society or DC 13 Willowshore Lore (secret) — Recall Knowledge; critical failure misremembers an old legend that summer fog brings summer sickness; success recalls the nursery rhyme suggesting the Eternal Lantern has been extinguished",
      "DC 15 Will — at the start of any hour a creature spends under the crimson moon (failure: Frightened +1, max 4, persists until dawn; critical failure: +2; success: no increase; critical success: reduce moon-induced Frightened by 1, immune for the rest of the night at 0)",
      "DC 14 Flat Check — every sunset as the crimson moon rises, blood rain falls (witnesses save against the crimson moon with a –4 circumstance penalty if out in the rain; a PC whose Frightened increases becomes fleeing for 1 minute and must escape indoors)",
    ],
    note: "Mirage Mist (day): thick fog while the lantern is dark; dissipates at night at the cost of crimson moonlight and blood rain. Visibility obscured beyond 500 feet; creatures viewed from more than 100 feet away are Concealed; all vision-based Perception checks suffer a –1 status penalty; all Survival DCs to Sense Direction increase by 5. These manifestations end permanently once the PCs light the Eternal Lantern at Dawnstep Bridge.",
    phases: [
      "Ambiance Woods; Mist Urban / Mist Nature; macros \"Enable Blood Moon\" / \"Enable Rain\" / \"Reset Willowshore\"; change the Willowshore Scene lighting to crimson (Foundry)",
    ],
  },
  {
    key: "ch1-spiderless-gate",
    name: "The Spiderless Gate",
    when: "First Day of Summer — eastern entrance to Willowshore",
    tone: "muted",
    text: "At the eastern entrance to Willowshore, the stone guardian spider statue (\"Ugly Cute\") is missing from its shrine — only the empty shrine remains. The eastern entrance lantern, once held in the spider's fangs, lies on its side in the grass. No sign of chiseling or damage on the rock it perched on, but large furrows scar the ground.",
    checks: [
      "DC 15 Society or DC 15 Willowshore Lore — Recall Knowledge about the stone spider statue (area W33); the same check reminds the PCs the Eternal Lantern — Willowshore's original entrance lantern — is located near Dawnstep Bridge (area W10)",
      "DC 15 Survival — the furrows are consistent with tracks the statue would've left if it animated and headed east down the road; the tracks enter the river and become impossible to follow (Ugly Cute's fate is learned in Chapter 3)",
    ],
    note: "The Unlit Lantern: the entrance lantern is empty of oil. It won't drive back the mist/moonlight, but if refilled (lantern oil is available in the next encounter — Eastern Watchtower) and lit, the PCs gain a +2 item bonus to saving throws against the crimson moonlight, and the flat check for blood rain increases to DC 18.",
    beats: [
      { key: "ch1-spiderless-gate-light", label: "Light the eastern entrance lantern", note: "Refill with lantern oil from the Eastern Watchtower, then light.", xp: 20 },
    ],
  },
  {
    key: "ch1-eastern-watchtower",
    name: "Eastern Watchtower",
    when: "First Day of Summer — about a mile west of the missing spider statue",
    tone: "slate",
    creatures: "Ha Hai-er (Creature 1)",
    text: "The tang of blood fills the air; four bodies lie sprawled — two town guards with swollen legs and frozen expressions of pain, and two tiny blue-gray humanoids with sharp teeth and giant ears, seemingly slain by sword blows. Two dead vipers lie in the grass nearby. Ha Hai-er, a town guard hiding in the tower, is non-hostile.",
    checks: [
      "DC 15 Nature — Recall Knowledge identifies the tiny humanoids as jinkin gremlins",
      "DC 13 Medicine — the human guards perished from poison delivered from snake bites to the legs",
      "DC 10 Religion, DC 10 Society, or DC 10 Willowshore Lore — Recall Knowledge of the Eight Practices without the Player's Guide (two randomly rolled practices; four on a critical success, one on a failure, none on a critical failure)",
      "DC 15 Diplomacy — Make an Impression shifts Ha Hai-er from unfriendly to at least indifferent",
    ],
    quote: "\"Go home, check on friends and family, make sure everyone is all right. That's what I would do if not for this fog. Pharasma bless us, I hope my daughter is okay. Even though I asked Granny Hu to babysit, I worry. And my husband... hopefully he's safe at the Matsuki estate right now. That place is nearly a fortress!\" — Ha Hai-er",
    note: "Ha Hai-er demands the PCs recite at least four of the Eight Practices to prove they aren't monsters in disguise. Once convinced she clambers down, greeting them with relief. She saw Uncle Chung-hu and his crew carry the PCs out to the woods at the Reenactment Festival's culmination, and that they returned without the PCs at the beginning of her watch. Well after midnight, \"horrible little blue monsters\" came out of the woods to the south with trained serpents; the other two guards defeated them but perished to snake bites. She has stayed in the tower, plagued by fear and guilt; the fog frightens her. If no PC recalled the Lazy Adou rhyme earlier, she can share it. She warns that screams, roars, and frightening sounds echoed from town, but since dawn things have been silent. She's incredulous if told Ugly Cute's statue is missing. She stays \"until this weird fog lifts\" and promises to ring the tower bell if she spots danger. If more than 24 hours pass she runs low on food and makes her way into town — her fate is left to the GM.\n\nAll PCs know \"Granny Hu\" = Hu Ban-niang (Northridge spiritual leader) and the Matsuki estate = Shou's home, \"Old Matsuki\" (Southbank spiritual leader). Hai-er can be invited to join; she initially resists (fear + dedication to her post). If made at least friendly, she agrees to accompany the PCs, encouraging them to visit Granny Hu (check on her daughter) or the Matsuki estate (track down her husband) — if the PCs neglect both before nightfall, she sets off on her own. In combat she provides support with her crossbow, closing to melee only when out of ammunition; if reduced to fewer than 6 Hit Points she panics, flees to hide, then seeks her daughter. Once reunited with daughter or husband she no longer accompanies the PCs.",
    treasure: "Ha Hai-er's Supplies: a ladder marvelous miniature and a single shining crossbow bolt (two minor magical supplies from the watchtower), plus a small cask of lantern oil (for lighting the lantern at Ugly Cute's abandoned perch).",
    beats: [
      { key: "ch1-watchtower-befriend", label: "Befriend Ha Hai-er", note: "Grant XP as if the PCs defeated her in combat. XP as if defeated in combat (Ha Hai-er, Creature 1)." },
      { key: "ch1-watchtower-reunite", label: "Reunite Ha Hai-er with her family", note: "If the PCs help reunite her with her daughter or husband.", rep: 1 },
    ],
    phases: [
      "Reputation Tracking — add effects to the \"Point Tracking\" actor to track Northridge Reputation and Southbank Reputation (Foundry)",
    ],
  },
  {
    key: "ch1-eight-practices",
    name: "The Eight Practices",
    when: "Sidebar — Willowshore's eight tenets during the season of ghosts",
    tone: "gold",
    text: "Willowshore's eight tenets during the season of ghosts, held as protections against minor evil/mischievous spirits; usable against the phantoms early on but generally ineffective against more powerful undead/actual ghosts later (locals know this). The eight practices, verbatim:\n\n1. Do not call a ghost a ghost; instead, address them with friendly greetings if you must.\n2. Do not pat people on the head or shoulders.\n3. Avoid entering bodies of water when a ghost is nearby.\n4. Do not eat food that has two stick-like objects protruding from it.\n5. Do not lean against walls during the day.\n6. Do not whistle at night.\n7. Do not leave laundry out at night.\n8. If you hear someone call your name from behind you at night, do not turn around.",
    note: "Practice 1 (friendly greetings) lets PCs cause phantoms to lose power and even discorporate; a secret DC 15 Religion or DC 15 Willowshore Lore check reveals this tactic if the PCs don't think of it after encountering a phantom. Practice 3 (avoid water near ghosts) has no game mechanics but should make players uneasy.",
  },
  {
    key: "ch1-random-encounters",
    name: "Random Encounters",
    when: "Back to Town — once every 4–8 hours of exploration-mode travel in town",
    tone: "slate",
    text: "Once every four to eight hours as the PCs travel in town using exploration mode (or as directed in an encounter's text), attempt a DC 10 Flat Check. Each PC Avoiding Notice or Scouting increases this DC by 1; each PC Hustling or Searching decreases the DC by 2. A random encounter occurs no more often than once per day. On a success, the PCs come across a random encounter; if the result is a phantom but the PCs are outdoors during the day, treat it as no encounter. At night, add a +5 modifier when rolling, treating results above 20 as a 20. Random encounters end once the Eternal Lantern has been lit. Don't overdo them; adjust frequency/threat to suit the table.\n\nTable (d20 | Encounter | Threat):\n1–2: 1 Giant Cockroach — Trivial 1\n3–4: Haunting Presence — Trivial 1\n5–6: 1 Jinkin — Trivial 1\n7–8: 1 Spider Swarm — Trivial 1\n9–10: Haunting Presence — Trivial 1\n11–12: Haunting Presences (2) — Low 1\n13–14: 1 Jinkin and 1 Viper — Low 1\n15–16: 3 Phantom Ravens — Low 1\n17–18: 1 Phantom Boar — Low 1\n19–20+: 2 Phantom Wolves — Moderate 1",
    note: "Aggressive Wildlife: giant cockroaches or spider swarms are normally skittish but have become aggressive from Kugaptee's growing influence and fight to the death; a secret DC 15 Nature or DC 15 Survival check (as in Strange Aggression) reveals how strange this is. These animals are vicious and can speak, mostly to issue threats or taunt; no interest in conversation. Haunting Presence: if two are encountered simultaneously, two different characters are targeted by Ghostly Menace. Jinkin: encounters are with a lone jinkin or a jinkin and their pet viper; a jinkin flees if reduced to fewer than 5 Hit Points; a pet viper fights to the death; many jinkins have stolen mundane objects from locals and wear them strangely or are destroying them; all jinkins here speak Common rather than Sakvroth. Phantoms: manifestations of Kugaptee's influence and Willowshore's collective fears; may call out a PC's name when they look away, or appear from entering water or whistling at night; ghostly pale green versions of real animals with eerie glowing eyes; speak Common; eager to frighten rather than fight — until attacked they only use innate occult spells or Intimidation to Demoralize; they can't pursue victims into buildings and vanish back into the Ethereal Plane at the end of any round in which they see no viable targets outside on the streets.",
  },
  {
    key: "ch1-willowshore-features",
    name: "Willowshore Features",
    when: "Back to Town — general town details",
    tone: "muted",
    text: "Most doors in Willowshore are sliding doors, except outhouse doors (hinged wooden). Exterior sliding doors are solid wood, grant standard cover, and can be Forced Open with a successful DC 15 Athletics check. Indoor sliding doors or room partitions provide no cover but do provide concealment, and can be Forced Open with a successful DC 5 Athletics check. PCs can poke a hole in the paper of many interior doors to peek inside as an Interact action (Stealth check required to remain undetected). Weapons and ammunition can easily pierce interior doors.",
    checks: [
      "DC 15 Athletics — Force Open an exterior sliding door",
      "DC 5 Athletics — Force Open an indoor sliding door or room partition",
    ],
  },
  {
    key: "ch1-returning-home",
    name: "Returning Home",
    when: "Back to Town — each PC's home",
    tone: "moss",
    text: "PCs may have homes/family in town; use any maps of the GM's choice (or player-designed). In each home a minor peril awaits — roll 1d12 on the Willowshore Random Encounters table (or pick threats thematically). Any friends/family present should be safe (if rattled) provided the PCs solve the situation. For each home visited the PCs recover supplies (left-behind items or gifts from friends/family). If using the Player's Guide, players picked one of these sets at character creation; otherwise choose from the list, not duplicating rewards unless there are more than 4 PCs.",
    treasure: "Home rewards (one set per home):\n- First Home: two minor healing potions and one piece of common adventuring gear worth 2 gp or less of the PC's choice.\n- Second Home: one predictable silver piece and a vial with one dose of oil of potency.\n- Third Home: supplies for an alarm snare, 10 sp, and two lesser ghost charges.\n- Fourth Home: one chunk of cold iron.",
    beats: [
      { key: "ch1-homes-visited", label: "Visit all of the PCs' homes", xp: 10 },
    ],
  },
  {
    key: "ch1-meeting-matsuki",
    name: "Meeting Old Matsuki",
    when: "Making Contact: Southbank — Matsuki estate (W5)",
    tone: "gold",
    text: "Most South Willowshore townsfolk retreated to the Matsuki estate (area W5) or the Thrice-Blessed Inn (area W6) in the predawn hours; most NPCs south of the river shelter there until the Eternal Lantern is lit. If the players don't think of visiting the estate, an allied NPC suggests it, or have the PCs attempt Society or Willowshore Lore checks and give the suggestion to whoever rolls highest. The estate is a blur of activity — rooms converted to workshops, medical stations, sleeping quarters; the banquet hall is calm, where Old Matsuki sits with major figures of south Willowshore, listening to reports.\n\nOld Matsuki beckons the PCs, provides warm food and drink, asks what happened after they woke in the forest, is sympathetic, encourages optimism about missing family, and offers lodgings if homes feel insecure. He then asks for help retaking Willowshore, presenting four goals (order up to the PCs):\n1. Contacting Northridge: monsters encamped on Dawnstep Bridge deny easy access. He admits his differences with Granny Hu but wants contact/aid sent; suggests seeking her at the trade office.\n2. Ugly Cute: refugees claim to have seen a horse-sized stone spider striding through the mist; he believes the stone guardian has awakened to defend the town (the PCs can confirm via the missing statue). He plans to recruit hunters from the Silvermist Lodges (W7), but they're busy saving townsfolk; if the PCs can contact a hunter, he asks them to convey the information (see The Trapped Hunter).\n3. The Invading Monsters: he warns about the buso and jinkins on Dawnstep Bridge (W11). Survivor reports: the jinkins are afraid of fighting beside the buso, and directly confronting/calling out the buso for a challenge might defeat it without contending with the gremlins simultaneously. The buso seems taken with drink — a poisoned-wine offering could make it easier to defeat; he suggests the Hand of Spring (W27) for this (see Clash at the Clinic).\n4. The Unlit Lantern: he suspects the strange weather is tied to the Eternal Lantern going dark. He knows its history — how Master Zhi Hui first lit the lantern using three blessed copper coins. To relight it, the PCs must obtain the blessing of three gods by visiting three different shrines and offering a copper coin; it takes only 10 minutes to teach the prayer; he provides three copper coins as tokens (see Blessing the Coins).\n\nIn closing he warns against entering downtown at this time — it's particularly monster-infested. Once the four tasks are done (especially lighting the lantern), plans for downtown can proceed.",
    beats: [
      { key: "ch1-contact-matsuki", label: "Make contact with Old Matsuki", xp: 40 },
    ],
  },
  {
    key: "ch1-crossing-the-water",
    name: "Crossing the Water",
    when: "Making Contact: Northridge — the Ceiba River",
    level: "Moderate 1",
    tone: "ember",
    text: "While monsters hold Dawnstep Bridge (area W11), travel between Northridge and Southbank is tricky; the waters of Woodraft Lake and the Ceiba River are a significant barrier. The Ceiba River varies between 20 and 25 feet deep with very little shallows along either shore (traditionally well suited for lumber transport).\n\nWillowshore Dam (area W18): currently open. A character can close it as a 10-minute activity to Interact with the dam's mechanisms on either shore. Each attempt to close (or open) the dam incurs a flat check for an encounter (Random Encounters); a critical failure indicates the mechanism has become stuck and can't be opened or closed again until repaired with several days of work. Once closed, the Ceiba River waters to the east lower to a depth of 10 feet and the DC to Swim or Pilot a boat is reduced by 5 for 2 hours, after which Woodraft Lake's water level rises enough to drain over the dam's spillways, reverting to former depth and speed. Opening the dam increases the river depth back to normal and increases checks to cross it by 5 for 15 minutes.",
    checks: [
      "DC 15 Athletics — Swim the Ceiba River",
      "Piloting checks (GM Core p. 212) — cross in a rowboat; a critical failure capsizes the boat and it sinks",
      "DC 15 Athletics or DC 13 Engineering Lore — close (or open) the Willowshore Dam as a 10-minute Interact activity",
      "DC 17 Acrobatics ×5 — treat the dam itself as an improvised bridge: five successes to balance during an intense 5-minute crossing (slick surface, narrow spots)",
    ],
    note: "Remind players of the third practice — \"avoid entering bodies of water when a ghost is nearby\" — which includes physically entering water or even piloting a boat across; no game mechanics back this up, but it should make players uneasy.",
  },
  {
    key: "ch1-crossing-the-waters",
    name: "Crossing the Waters",
    when: "Making Contact: Northridge — Woodraft Lake (W17)",
    level: "Moderate 1",
    tone: "slate",
    hazard: "Grasping Currents (Hazard 2) — the text names this hazard but the digest contains no stat block (Stealth DC, trigger, effects, XP); pull from the published adventure stat block.",
    text: "Woodraft Lake (area W17) has calmer waters (reduce checks to Swim and Pilot by 5), but the bodies of dead townsfolk float in the waters — tossed there by monsters or the results of failed crossings. These deaths, combined with the eerie mists and crimson moonlight, have caused the lake to become haunted. Any attempt to cross the lake before the Eternal Lantern is lit runs afoul of the Grasping Currents hazard.",
  },
  {
    key: "ch1-finding-a-boat",
    name: "Finding a Boat",
    when: "Making Contact: Northridge — southern bank of the Ceiba River",
    tone: "muted",
    text: "Until the buso at Dawnstep Bridge is defeated, rowboats are the safest way to cross the Ceiba River, but finding one on the southern shoreline isn't easy — most boating infrastructure is on the northern banks, and many rowboats have been damaged by destructive jinkins.",
    checks: [
      "DC 13 Perception — after 10 minutes of Searching along the southern bank, find a broken Rowboat (critical success: an undamaged rowboat)",
    ],
    note: "Larger boats and barges are moored along the northern shore but are beyond a low-level party's capacity to pilot; characters can automatically find a functional rowboat on the river's northern bank after taking 10 minutes to Search. (Vehicle rules: Pathfinder GM Core pp. 210–213.)",
  },
  {
    key: "ch1-meeting-granny-hu",
    name: "Meeting Granny Hu",
    when: "Making Contact: Northridge — the Ceiba-Duyue Exchange trade office (W29)",
    tone: "moss",
    text: "The new trade office (area W29), called the Ceiba-Duyue Exchange, is where Granny Hu and most of Northridge's refugees fled; nearby warehouses converted to temporary shelters; the fisheries (area W30) and even the Mushroom House (area W32) also opened their doors. Fewer refugees than at the Matsuki estate — downtown NPCs are trapped and some locals intentionally distanced themselves from Granny Hu. At the trade office, Granny Hu scrutinizes a map of Willowshore, using game pieces from an Eight Paces set to mark monster sightings and trapped people. Her arrival question: how did the PCs cross the river — she fears they struck a bargain with the monsters; she chuckles at their foolish bravery once they explain, then asks them to sit and update her.\n\nGranny Hu reluctantly agrees with Old Matsuki on the three most important next steps, but if the PCs come to her first she eagerly suggests tasks with somewhat different advice:\n- The Invading Monsters: she's heard rumors that the \"brain\" of the invasion is someone (or something) named Mo Douqiu — possibly a human with occult powers or a human-like yokai. She sees Northridge as more self-sufficient; restoring access to Dawnstep Bridge is less important to her than defeating the creatures controlling downtown.\n- Ugly Cute: she heard the spider statue went missing but finds the idea of it \"waking up on its own\" ridiculous superstition; suspects it was animated by magic or has become haunted; warns against assuming Ugly Cute is friendly, but doesn't see it as a foremost threat.\n- The Unlit Lantern: she only vaguely knows the legend; Gu-won recounts how Master Zhi Hui lit the lantern with coins blessed by Calistria, Kofusachi, and Shelyn, and suggests seeking their shrines for blessings.\n\nAdditional requests (before Shou's tasks): Checking the Doctor — Dr. Damihansig Mababangloob (\"Doctor Dami\") refused to abandon his clinic, the Hand of Spring (W27), despite her invitation to join her at the trade office; as the only doctor in Willowshore, she wants to ensure the village still has a physician (see Clash at the Clinic). Missing Grandchildren — on a personal note, she's worried about missing grandchildren, last seen heading toward the northern drying yards near the Mushroom House (W32) on the evening of the Reenactment Festival; she speculates they hosted their own private party there and couldn't return home (see The Worst Puzzle).",
    note: "NPC present: Kim Gu-won — Kofusachi cleric, Granny Hu's right-hand aide. Granny Hu's primary objective is retaking the downtown barracks for its armory, but she trusts her son-in-law and current guard captain Zheng Peng to hold his own for a week, so she only mentions that quest if the PCs reach and liberate the barracks before she does.",
    beats: [
      { key: "ch1-contact-granny-hu", label: "Make contact with Granny Hu", xp: 40 },
    ],
  },
  {
    key: "ch1-a1-trapped-hunter",
    id: "A1",
    name: "The Trapped Hunter",
    when: "First Missions — an hour of Searching in Southbank",
    level: "Severe 1",
    tone: "rust",
    creatures: "Midori (jinkin) · Murasaki (jinkin) · Noodles (weasel) · Sparrow (raven)",
    text: "To deliver Old Matsuki's request for a hunter to track Ugly Cute, the PCs spend an hour Searching in Southbank. A pair of jinkins (Midori and Murasaki) plus two mean-spirited animals (a weasel named Noodles and a raven named Sparrow) have trapped a Silvermist hunter, a woman named Sumika. She was tricked into investigating the farm by the creatures' voices, which she mistook for crying children; after being critically wounded by a spring-loaded spear trap the gremlins rigged in the farmhouse's southwest communal room, she crawled into the bedroom (area A1a) and barricaded the door. The four tormentors gather near the southwest building's entrance, calling taunts. They aren't interested in fighting the PCs — they seek to \"befriend\" animals by taking them by force and mistook Sumika for the farm's rancher. If any PC has a companion animal, familiar, mount, or eidolon, the group fixates on the most powerful-looking one, using untrustworthy promises of food and outright threats to try to get it to join them.\n\nOnce it becomes obvious there are visitors, Sumika peers out of a window in the room (area A1a) and mouths the words \"Help me!\" after waving a hand to quietly attract attention.",
    checks: [
      "DC 17 Perception or DC 15 Survival (each PC who took part in the Search, after 1 hour Searching in Southbank) — find the farm where the commotion is taking place",
      "DC 13 Deception, DC 13 Diplomacy, or DC 13 Intimidation — battle of wits: after any conversation, each PC attempts one as they see fit; if more than half of the PCs succeed, they confuse and distract the Abacus Sisters",
      "DC 17 Society or DC 15 Farming Lore (secret, per PC) — realizes the four made a mistake: the word \"abactor\" means \"one who steals cattle,\" not \"abacus\"; if pointed out, the four fall to bickering and the PCs automatically win the battle of wits",
    ],
    quote: "\"Blue like the dawn! Purple and miraculous! Swift like a fawn! Together, we are the Abacus Sisters!\" — Midori and Murasaki (the jinkins), followed by a fit of cackling\n\"That means we're here to steal all your cattle!\" — Noodles (the weasel)\n\"Here, kitty, kitty! Come on out and get a treat!\" — Sparrow (the raven, perched on the roof, calling to Sumika as if luring a trapped cat)\n\"Oh! So you're a chatty bunch then? Think you've got the wits to win out against the Abacus Sisters?\" — Murasaki, if a PC calls out to the four before attacking (Midori gives a mock salute)\n\"I doubt it! I do! I doubt it! Don't you?\" — Sparrow (snarky chirp)",
    note: "If the PCs distract the Abacus Sisters, Sumika climbs out through the window and limps to safety; the PCs can follow, leaving the bickering creatures behind before they attack. Otherwise the Abacus Sisters grow impatient and attack. In combat, each member squeals in fear if reduced to fewer than 4 Hit Points and flees for their life. If Midori and Murasaki survive, they (potentially with Noodles) might be encountered again later — see area E13.",
    treasure: "Sumika's Thanks: enough supplies to craft two spirit traps plus additional materials to craft two other common 1st-level snares of the PCs' choice. If she learns of the plan to light the Eternal Lantern, she suggests the PCs visit the Ketephys shrine at the westernmost Silvermist hunting lodge (area W7a).",
    beats: [
      { key: "ch1-a1-resolved", label: "Resolve The Trapped Hunter", note: "Full XP as if the Abacus Sisters were defeated in combat, no matter how the encounter is resolved. Award standard encounter XP (Severe 1)." },
    ],
  },
  {
    key: "ch1-a2-clash-clinic",
    id: "A2",
    name: "Clash at the Clinic",
    when: "First Missions — the Hand of Spring clinic (W27)",
    level: "Low 1",
    tone: "rust",
    creatures: "Giant Centipede (3) · Phantom Gecko",
    text: "Willowshore's only clinic, the Hand of Spring (area W27), is an impromptu haven for townsfolk unaffiliated with either faction. Igawa Jubei (a wizard's apprentice from Mother's Coil, W28) badly sprained her ankle escaping a jinkin contraption; Huo Tian-Zhe (a tinkerer from Second Best, W26) sports a large burn wound from a backfired alchemical explosion. As the PCs approach (area A2a), sounds of hissing, growling, and battle thumping come from the courtyard (area A2b); through the wooden lattice separating the courtyard from the exterior path they can plainly see several giant centipedes attacking a ghostly gecko the size of a human. The ghostly gecko is the manifestation of a guardian spirit that has long protected the clinic. The gecko does its best against two centipedes, but three more clamber through gaps in the lattice to attack the PCs as soon as they approach (area A2a). The centipedes fight to the death. The phantom gecko isn't a manifestation of the evil infusing the mindscape but still regards the PCs as potential intruders: once the PCs defeat the three centipedes at A2a, the gecko finishes off its last centipede at A2b and threatens the PCs by attempting to Demoralize them — it doesn't initiate an attack. One round after the last centipede is slain, Doctor Dami emerges from the western building (area A2c) and blurts out, \"Don't kill it!\" If a round passes without hostile action from the PCs after all centipedes are slain, the phantom gecko fades back into the Ethereal Plane.",
    quote: "\"Don't kill it!\" — Doctor Dami, emerging from the western building (area A2c)",
    note: "Speaking to the Doctor: if the PCs help defeat the centipedes, Doctor Dami gives them two lesser antidotes in thanks (\"Dami's Thanks\"). If they also spared the gecko, he gives them a lesser darkvision elixir (\"Dami's Extra Thanks\"). He has five more vials of lesser darkvision elixirs should the PCs wish to buy or barter for more. He offers to use Treat Wounds on the PCs at no cost whenever they come to the clinic, so long as the monsters are still in town. If the PCs mention relighting the Eternal Lantern, Doctor Dami opens his shrine to Qi Zhong (area A2d) for them to seek the god's blessing. Jubei informs the PCs about the Nalinivati shrine in Mother's Coil (W28). Doctor Dami dismisses Granny Hu's safety concerns with a wave of the hand — disinterest in her posturing and politics; he still feels safe, refuses to abandon the clinic (moving the wounded may do more harm than good), and tells the PCs to work toward reclaiming Willowshore if they really want to help. If the PCs mention poisoning/drugging the buso at Dawnstep Bridge, Dami nods grimly and admits he can help, though he doesn't normally condone poisoning — he supplies a dose of lethargy poison (\"Dami's Poison\"), warning them to be careful and to use it only against the monster (he keeps the small supply on hand to soothe patients in great pain).",
    treasure: "Dami's Thanks (2 lesser antidotes) · Dami's Extra Thanks (lesser darkvision elixir, if the gecko was spared) · 5 more lesser darkvision elixirs available for purchase/barter · Dami's Poison (1 dose of lethargy poison, for use only against the buso) · free Treat Wounds at the clinic while monsters remain in town.",
    beats: [
      { key: "ch1-a2-resolved", label: "Resolve Clash at the Clinic", note: "Full XP as if the phantom gecko was defeated if it is spared; the book grants full encounter XP either way. Award standard encounter XP (Low 1)." },
    ],
  },
  {
    key: "ch1-worst-puzzle",
    name: "The Worst Puzzle",
    when: "First Missions — lumber drying yard near the Mushroom House (W32)",
    level: "Trivial 1",
    tone: "ember",
    creatures: "Endangered Revelers (4)",
    hazard: "Haphazard Wood Pile — named in the text but the digest contains no stat block (Stealth DC, disarm DCs, damage, XP); pull from the published adventure stat block.",
    text: "As Granny Hu suspected, three of her grandchildren and one of their troublemaking friends held their own party on the night of the Reenactment Festival in a lumber drying yard near the Mushroom House (area W32). They passed out and spent the night; that morning a group of jinkins found them and cruelly trapped the youths before moving on. When the PCs arrive, the four endangered revelers are trapped in a small area at the center of the yard, huddled in the middle of several stacks of lumber; heavy timbers and sharpened stakes are arranged around them within a tangled web of trip lines and tension-bearing wood dowels. As long as the four villagers remain relatively still they'll be safe at the heart of the hazard. For them to escape, the PCs must disarm the trap the jinkins built, otherwise the commoners are likely to come to harm.",
    quote: "\"There's all sorts of trip lines and triggers set! Those nasty little creatures made sure of that!\" — the revelers, calling out as the PCs approach",
    beats: [
      { key: "ch1-puzzle-reveler-1", label: "First reveler survives", note: "Tick exactly one per surviving reveler.", xp: 20 },
      { key: "ch1-puzzle-reveler-2", label: "Second reveler survives", note: "Tick exactly one per surviving reveler.", xp: 20 },
      { key: "ch1-puzzle-reveler-3", label: "Third reveler survives", note: "Tick exactly one per surviving reveler.", xp: 20 },
      { key: "ch1-puzzle-reveler-4", label: "Fourth reveler survives", note: "Tick exactly one per surviving reveler.", xp: 20 },
      { key: "ch1-puzzle-all-survive", label: "All four revelers survive", note: "Tick exactly one — Northridge reputation.", repN: 1 },
    ],
  },
];

const CH1_LANTERN = [
  {
    key: "ch1-invoke-shrine-blessing",
    name: "Invoke Shrine Blessing",
    when: "Blessing the Coins — activity to bless a copper coin",
    tone: "plum",
    text: "To light the Eternal Lantern, the PCs must place three blessed copper coins into the lantern's fuel receptacle. To bless a coin, seek out one of several shrines within Willowshore's town limits and perform the following activity.\n\nTraits: Concentrate, Exploration, Manipulate. Requirements: you are holding an unblessed copper coin and are adjacent to one of Willowshore's shrines. You offer prayers to a shrine and implore its associated deity to bless a copper coin. Place the copper coin before the shrine, then spend 10 minutes in prayer before the shrine. If you worship the deity in question, increase the result of your check by one degree of success.",
    checks: [
      "DC 15 Religion or Deity Lore — invoke a blessing at a shrine",
      "DC 17 skill check associated with the deity's teachings — two alternate skills are available for each shrine (see Shrine Locations)",
    ],
    outcomes: [
      "Critical Success: the deity blesses the copper coin and imbues you with divine energy — you heal 1d8 + 8 Hit Points and can cast Guidance once in the next 24 hours as a divine spell. All further critical successes at Invoking Shrine Blessing count as regular successes instead.",
      "Success: the deity blesses the copper coin.",
      "Failure: you fail, and can't attempt to invoke a blessing at this specific shrine again for 24 hours.",
      "Critical Failure: you anger the deity — the copper coin vanishes, you can't attempt to invoke a blessing at this shrine again for 1 week, and you become Stupefied 1 for 1 hour.",
    ],
  },
  {
    key: "ch1-shrine-locations",
    name: "Shrine Locations",
    when: "Blessing the Coins — Willowshore's Shrines table",
    tone: "gold",
    text: "A PC who worships the deity automatically knows the location of their deity's shrine. Other obscure shrine locations can be learned by exploring the town or speaking to NPCs. At GM discretion, a PC who worships a deity/faith not on the table might have a small personal shrine in their own home. When a PC attempts a Willowshore Lore check to Recall Knowledge about locations, they roll once and learn the locations of all shrines with a Discover DC equal to or less than the result of their check. Table entries are organized in ascending order of Discover DC. The Lady Nanbyo shrine (W17) is 25 feet underwater.",
    qa: [
      ["Abadar", "Abadar Shrine (W4) — Discover: automatic — DC 15 Abadar Lore, DC 17 Society or DC 17 Willowshore Lore"],
      ["Daikitsu", "Nine Ear Shrine (W16) — Discover: automatic — DC 15 Daikitsu Lore, DC 17 Farming Lore or DC 17 Survival"],
      ["Kofusachi", "Trade Office (W29) — Discover: automatic — DC 15 Kofusachi Lore, DC 17 Mercantile Lore or DC 17 Performance"],
      ["Pharasma", "Lady of Souls (W9) — Discover: automatic — DC 15 Pharasma Lore, DC 17 Fortune Telling Lore or DC 17 Medicine"],
      ["Shelyn", "Downtown (B17) — Discover: DC 12 — DC 15 Shelyn Lore, DC 17 Art Lore or DC 17 Performance"],
      ["Qi Zhong", "The Hand of Spring (W27) — Discover: DC 13 — DC 15 Qi Zhong Lore, DC 17 Herbalism Lore or DC 17 Medicine"],
      ["Ketephys", "Western Silvermist Lodge (W7a) — Discover: DC 14 — DC 15 Ketephys Lore, DC 17 Hunting Lore or DC 17 Survival"],
      ["Nalinivati", "Mother's Coil (W28) — Discover: DC 15 — DC 15 Nalinivati Lore, DC 17 Midwifery Lore or DC 17 Nature"],
      ["Shizuru", "Mother's Coil (W28) — Discover: DC 15 — DC 15 Shizuru Lore, DC 17 Diplomacy or DC 17 Warfare Lore"],
      ["Tsukiyo", "Mother's Coil (W28) — Discover: DC 15 — DC 15 Tsukiyo Lore, DC 17 Genealogy Lore or DC 17 Occultism"],
      ["Desna", "Abandoned Estates (W23b) — Discover: DC 16 — DC 15 Desna Lore, DC 17 Scouting Lore or DC 17 Survival"],
      ["Lao Shu Po", "Mushroom House (W32) — Discover: DC 17 — DC 15 Lao Shu Po Lore, DC 17 Thievery or DC 17 Underworld Lore"],
      ["Yaezhing", "Bones of the Forgotten (W36) — Discover: DC 18 — DC 15 Yaezhing Lore, DC 17 Intimidation or DC 17 Legal Lore"],
      ["Calistria", "Thrice-Blessed Inn (W6) — Discover: DC 19 — DC 15 Calistria Lore, DC 17 Deception or DC 17 Guild Lore"],
      ["Lady Nanbyo", "Woodraft Lake (W17) — Discover: DC 20 — DC 15 Lady Nanbyo Lore, DC 17 Nature or DC 17 River Lore (shrine is 25 feet underwater)"],
    ],
    note: "Granny Hu's aide Kim Gu-won recounts that Master Zhi Hui lit the lantern with coins blessed by Calistria, Kofusachi, and Shelyn.",
  },
  {
    key: "ch1-spying-bridge",
    name: "Spying on the Bridge",
    when: "Liberating the Bridge — within 100 feet of Dawnstep Bridge (W11)",
    tone: "slate",
    boxed: "Blood smears the gray stone of Dawnstep Bridge, evidence of a recent fight. The flame of Willowshore's iconic stone lantern is—for the first time in history—extinguished. A large humanoid figure sits on a throne made of stolen furniture heaped on the bridge. As he drinks from a brewing pot, several much smaller humanoids around him caper about, apparently mimicking and mocking death throes and reactions of recent victims.",
    text: "Dawnstep Bridge (area W11) is guarded by a buso and several jinkins. The monsters cavort loudly enough that the PCs can observe from a distance without Stealth checks, but must attempt a secret DC 15 Perception check to pick up clues from 10 minutes of observation. Additional DC 15 Perception checks beyond the first 10 minutes are possible, but each additional 10 minutes gives the monsters a chance to notice the PCs if they don't succeed at Stealth checks to remain hidden. If noticed, the jinkins shriek in excitement and four of the gremlins give chase — a fight against four jinkins is an Extreme 1 encounter, one from which the PCs would be wise to flee. The jinkins give up the chase after a few rounds, pleased to have scared the humans; if they defeat the PCs, the party might need to be rescued by locals before Gurglegut gets involved.",
    checks: [
      "DC 15 Perception (secret, per PC) — 10 minutes of observation; critical success: learns the jinkins speak Common (play-acting frightened townsfolk) while the one-eyed figure drunkenly sings (in Fey) bad poetry rhymes about alcohol or boasts of violent triumphs; learns the names of the three ringleaders — Gurglegut, Gray Butcher, and Mo Douqiu (no indication who's who or what the creatures are); success: the jinkins and the larger figure don't seem to share a language; failure: nothing beyond confirming numbers of foes; critical failure: incorrectly concludes the large figure is on the verge of passing out",
      "DC 15 Perception (additional) + Stealth checks — further 10-minute observation periods risk discovery by the monsters",
    ],
    beats: [
      { key: "ch1-spied-bridge", label: "Spy on the monsters at Dawnstep Bridge", note: "10 XP and 1 Reputation Point with both factions.", xp: 10, rep: 1 },
    ],
  },
  {
    key: "ch1-retaking-dawnstep",
    id: "W11",
    name: "Retaking Dawnstep",
    when: "Liberating the Bridge — Dawnstep Bridge (W11), the chapter climax",
    level: "Moderate 1",
    tone: "rust",
    creatures: "Gurglegut (buso) · Jinkins (several, non-combatants)",
    text: "Use the map for Dawnstep Bridge. The large figure on the improvised throne is a lumbering buso named Gurglegut; the smaller crowd are several jinkins keeping their violent leader entertained. The PCs don't need to fight all at once — any approach attracts attention, but only Gurglegut steps forward to confront the PCs at the south end of the bridge. If the PCs approach with a gift of poisoned wine, Gurglegut laughs in delight, snatches up the gift, drinks it, and waves the PCs away. If he falls unconscious from the drink, the jinkins panic and flee, thinking he died; but if the PCs approach again (or refuse to leave in the first place) while he's still conscious, he attacks at once.\n\nTactics: Gurglegut is drunk enough that he's effectively Sickened 2 during this encounter. He opens the fight by spending his first action to attempt a DC 15 Fortitude save to reduce his sickened value, then uses his second action to try to Demoralize the toughest-looking PC. His third action is either to Stride up to that PC or to Strike an adjacent character with his kukri. He starts each following round with an action to try to reduce his sickened condition until he's fully recovered. In any event, he fights to the death. The jinkins jeer and taunt; any actual attack directed toward them makes them shriek and flee in panic.",
    checks: [
      "DC 15 Fortitude — Gurglegut's own save to reduce his Sickened 2 condition (his first action each round)",
    ],
    treasure: "Gurglegut's Treasures: a silver scepter set with semi-precious stones worth 15 gp; an elegant silver jewelry case worth 5 gp that contains a ring of discretion; and three ancient copper coins in a pocket — a character who succeeds at a DC 15 Willowshore Lore check to Recall Knowledge correctly identifies these three coins as those that, for so long, kept the Eternal Lantern lit. These three coins no longer bear blessings and are worth precisely that — 3 cp.",
    beats: [
      { key: "ch1-gurglegut-defeated", label: "Defeat Gurglegut and reopen Dawnstep Bridge", note: "1 Reputation Point with each faction. Award standard encounter XP (Moderate 1) in addition to the stated reward.",  rep: 1 },
    ],
  },
  {
    key: "ch1-relighting-lantern",
    id: "W10",
    name: "Relighting the Eternal Lantern",
    when: "Light the Night — southern side of Dawnstep Bridge, end of Chapter 1",
    tone: "gold",
    text: "The Eternal Lantern is an immobile 15th-level magical item located on the southern side of Dawnstep Bridge. This stone lantern is a 5-foot-tall stone lamp carved from silver-laced granite from the Gossamer Mountains. Its interior contains a cold iron cage with a lotus-shaped pedestal on which three glowing copper coins once sat. It's said that the light from this lamp protects Willowshore from all manners of evil. Gifted to Willowshore many years ago by Master Zhi Hui, the lantern had never been extinguished for as long as anyone in town could remember, but when the monsters invaded, the buso Gurglegut spotted the glowing coins and snatched them up, only to be disappointed when the \"magic\" coins went dark after he took them from the bowl.\n\nProcedure: to relight the lantern, the PCs need only open the grill on the Eternal Lantern's southern face, place three blessed copper coins in the cold iron cage within, and close the grill. Each of these is a single Interact action; once the last is completed, the lantern ignites once more. While lit and the three coins remain inside, it sheds light in a 30-foot radius (and dim light for the next 30 feet); more importantly, lighting it causes the mirage mist, crimson moon, and blood rain effects that have settled over Willowshore to immediately end. Any animals granted cruel sapience and the ability to speak revert to normal animals and make their way back out of town.\n\nBoon: the various divine forces associated with Willowshore's shrines take note whenever their blessings are used in the lantern, and their interest and approval results in a boon granted to the PCs as soon as the lantern's light shines out. This boon grants the PCs a +1 item bonus to skill checks they attempt with the deity's divine skill. Example: coins blessed by Calistria, Desna, and Shizuru give a +1 item bonus to Deception, Acrobatics, and Society respectively. Since these are all item bonuses, there's no advantage to using multiple blessed coins from the same shrine or from deities who share the same divine skill. Magic items gained later in the campaign might provide greater item bonuses. Each PC gains the effects of these boons, regardless of who placed the coins — the gods know the PCs are working together, and that it's their destiny that can save or damn Willowshore.",
    note: "End of Chapter 1. Gurglegut is dead, the Eternal Lantern is relit, the mist/moon/blood-rain effects end, and the way is paved for the downtown reconquest (Chapter 2). The Gray Butcher (ittan-momen) and Mo Douqiu (rokurokubi) remain at large downtown.",
    beats: [
      { key: "ch1-lantern-relit", label: "Light the Eternal Lantern", note: "Ends the mirage mist, crimson moon, and blood rain; random encounters cease. 80 XP and 1 Reputation Point with both factions.", xp: 80, rep: 1 },
    ],
    phases: [
      "Macro \"Light Eternal Lantern\" (Foundry)",
    ],
  },
];



/* ============================================================================
   CHAPTER 2 — Reclaiming Willowshore (Act 1.2)
   Card data: Downtown (B1-B17 + intro), Gray Butcher, Cerulean Teahouse (C1-C4)
   Source: /home/rmorrison/Documents/Seasonofghosts/act1macromaterial/digests/ch2.md
   Party level 1 · Reputation-only chapter (Northridge = Granny Hu, Southbank = Old Matsuki)
   ============================================================================ */

/* --------------------------------------------------------------- downtown */
const CH2_DOWNTOWN = [
  {
    key: "ch2-downtown-intro",
    name: "Liberating Downtown",
    when: "After the Eternal Lantern is lit",
    tone: "moss",
    text: "With the Eternal Lantern lit and the mists and moonlight banished, monsters and perils in most of Willowshore abate, and citizens emerge cautiously but remain frightened. Downtown Willowshore is still monster-controlled, and trapped citizens are prisoners or worse. The governor's manor, once at the northeastern corner of downtown, has vanished. Both elders — Granny Hu (Hu Ban-niang, Northridge) and Old Matsuki (Matsuki Shou, Southbank) — request the same thing: liberate downtown. The PCs' choice of faction to support decides Willowshore's future for the rest of the campaign.",
    note: "Ringleaders: Gurglegut (the muscle, likely already defeated in Chapter 1), Gray Butcher (patrols the streets, encounterable at any time), and Mo Douqiu (the mastermind, holding the ruined Cerulean Teahouse as his fortress). General downtown info for area W15 is on page 75: streets are empty, with splashes of blood, broken weapons in gutters, and smashed doors and windows; unlabeled buildings are empty homes, abandoned shops, or partially completed structures usable as hiding spots and shelter. If a player selected a downtown building as their home, use Returning Home (page 16).",
    treasure: "Whichever elder is the patron delivers ten minor healing potions and eight potency crystal talismans for the PCs to use as they see fit.",
    beats: [
      { key: "ch2-intro-patron", label: "Patron supplies delivered (10 minor healing potions · 8 potency crystal talismans)" }
    ]
  },
  {
    id: "B1", key: "ch2-b1", name: "Empty Lot", tone: "slate",
    boxed: "The opulent Governor's Manor, just yesterday the crowning jewel of downtown, has vanished without a trace. The only indication that there was once a building in this empty lot are the two guardian stone lions that once guarded the entrance of the manor. Both have been defaced and damaged.",
    text: "Scene — no creatures, no checks, no reward. Governor Heh became trapped in a parallel mindscape along with his entire manor.",
    note: "Each time Willowshore's mindscape resets, townsfolk must contend again with the discovery of their missing leader and vanished manor. Sets up the Chapter 3 mystery of the vanished governor."
  },
  {
    id: "B2", key: "ch2-b2", name: "Imperial Guard Office", tone: "muted",
    boxed: "The office looks like a hurricane has been through it, with documents strewn about the room. Very few furnishings remain in the room at all.",
    text: "Scene — flavor only. The furniture was used to build Gurglegut's throne on Dawnstep Bridge; only a flimsy bookshelf, a desk, and a couple of broken chairs remain, among criminal records scattered over the floor."
  },
  {
    id: "B3", key: "ch2-b3", name: "Guard House Courtyard", tone: "moss",
    boxed: "This small sunken courtyard is hidden from above by a canopy of wisteria in full bloom.",
    text: "Scene — former guard relaxation spot; many have noted they'd rather have a practical use for the space."
  },
  {
    id: "B4", key: "ch2-b4", name: "Prison", level: "Rescue", tone: "slate",
    creatures: "Zheng Peng (1) · Town Guards (10)",
    boxed: "The inside of this dingy room is where Willowshore's prison cells are located. The seven cells have iron bars and brick walls.",
    text: "Ten guards were captured and thrown into the seven cells; Zheng Peng (captain of the guard) is locked in the northeastern-most cell alone. A spare set of cell keys — his contingency plan — is hidden under a loose brick in the southwest corner. He asks the PCs to retrieve the keys and release him and the guards at once, then describes the organizer of the barracks attack: a human-looking figure — a bald man with sharp teeth in a hooded cloak whose neck seemed capable of rotating more than it should — working with several jinkins; he doesn't know where they went. Until they recover, Zheng Peng and his guards are all fatigued, at 1 Hit Point, and enfeebled 3; they're also unarmed and unarmored.",
    checks: [
      "DC 25 Thievery — Pick the Lock on each cell lock (average quality; four successes)",
      "DC 20 Perception — Search to discover the hidden keys (if the PCs don't use Zheng Peng's directions)"
    ],
    treasure: "Zheng Peng gives the PCs the armory key and invites them to take whatever they need from the armory (area B6) to aid the liberation.",
    qa: [["Who organized the attack on the barracks?", "A human-looking figure — a bald man with sharp teeth who wore a hooded cloak and whose neck seemed capable of rotating more than it should — working with several jinkins. Zheng Peng doesn't know where the man and his gremlins headed next; the retractable neck foreshadows Mo Douqiu's rokurokubi nature."]],
    beats: [
      { key: "ch2-b4-rescue", label: "Rescue Zheng Peng and the ten guards", xp: 40, repN: 1, note: "40 XP and 1 Reputation Point with Northridge. Also a source for learning that the Cerulean Teahouse is Mo Douqiu's headquarters, and likely source of Zheng Peng's uncle connection to Hu Lelong (see B11)." }
    ]
  },
  {
    id: "B5", key: "ch2-b5", name: "Outdoor Prison Cell", level: "Rescue", tone: "muted",
    creatures: "Imprisoned Villagers (4)",
    boxed: "This bamboo cage serves as a holding cell for those who commit petty crimes.",
    text: "Four villagers have been thrown in here to \"repent\" or risk being sent to the teahouse — a piece of information they can share with the PCs and a source for learning about Mo Douqiu's headquarters. Free them by breaking the bamboo, smashing the cage, or unlocking the iron cage door with the keys from area B4.",
    checks: [
      "DC 22 Athletics — Force Open the cage (bamboo; or smash it — AC 16, Hardness 5, HP 20)",
      "Alternative — unlock the cage with the keys from area B4"
    ],
    beats: [
      { key: "ch2-b5-rescue", label: "Rescue the prisoners and escort them to safety", xp: 20, repS: 1, note: "20 XP and 1 Reputation Point with Southbank." }
    ]
  },
  {
    id: "B6", key: "ch2-b6", name: "Armory", level: "Loot location", tone: "slate",
    boxed: "The doors to this area are locked tight. There are no cracks or windows to peek inside.",
    text: "Locked room — the locks on the door are of good quality; the door can also be unlocked by the key hidden in area B4 (given by Zheng Peng).",
    checks: [
      "DC 30 Thievery — Pick the Lock on the door (good quality; five successes)"
    ],
    treasure: "A dozen standard suits of scale mail and a dozen of studded leather armor; 10 crossbows; a barrel of 100 bolts; a dozen daggers; six clubs; four saps. Magic and special items: four lesser frost vials, a cold iron dagger, a cold iron buckler, a silver shortsword, and a +1 spear."
  },
  {
    id: "B7", key: "ch2-b7", name: "Training Yard", tone: "muted",
    boxed: "A trail of bloody prints extends from the stables out through the northern gates of the sandy training yard.",
    text: "Tracking the trail leads to the Happy Kappa (area B15), where the kappas are enjoying a bath.",
    checks: [
      "DC 9 Survival — Track the trail of bloody prints"
    ]
  },
  {
    id: "B8", key: "ch2-b8", name: "Infested Stables", level: "Low 1", tone: "rust",
    creatures: "Cockroach Swarm (1)",
    boxed: "The smell of offal and rotten meat stagnates. Inside lay a dozen horses. Most died with their eyes wide open, sharing the pain of their last moments.",
    text: "A cockroach swarm made its home inside the corpses' eviscerated cavities; it converges into a swarm and attacks as soon as it detects a creature in the stables. Since the Eternal Lantern was lit the swarm lost its cruel hive mind (and its ability to speak), but it remains ravenous and fights to the death.",
    note: "The bloody prints trail from here to area B15 (see B7).",
    beats: [
      { key: "ch2-b8-swarm", label: "Defeat the cockroach swarm",  note: "Standard Low 1 XP — no value printed in the source." }
    ]
  },
  {
    id: "B9", key: "ch2-b9", name: "Treesparrow's Rest", tone: "gold",
    boxed: "None of the sacks or chests of rice, millet, or buckwheat on display in this storefront appears to have been damaged. The pots and vases of fermenting bean paste, rice wine, or pickled vegetables on the shelves also remain untouched.",
    text: "Grain shop; front doors unlocked. The PCs can rest here for 10 minutes (potentially using the Take a Breather activity). If they stay longer than an hour, they risk facing a jinkin wandering over from area B11 through the backyard on the hunt for something to ruin."
  },
  {
    id: "B10", key: "ch2-b10", name: "Sanmi Household", level: "Investigation", tone: "muted",
    boxed: "This family home has been thoroughly robbed of nearly everything of worth, from all their cookware to whatever clothing or valuables they had in their antique drawers.",
    text: "Searching reveals a stack of letters hidden in a compartment beneath a dresser drawer, revealing a secret, blossoming relationship between the youngest generation of the Sanmi and Hu families: Yuli Sanmi and Hu Lelong. The letters may prove useful in resolving the situation in area B11.",
    checks: [
      "DC 20 Perception — Search to find the hidden letters",
      "DC 10 Willowshore Lore — Recall Knowledge that the highly traditional Sanmi family wouldn't approve of this relationship",
      "DC 15 Society — Recall Knowledge (same purpose)"
    ]
  },
  {
    id: "B11", key: "ch2-b11", name: "Mudwall House", level: "Moderate 1", tone: "ember",
    creatures: "Jinkins (6) · Yuli and Lelong (2, noncombatant)",
    boxed: "This house has a double-layered mud wall that regulates heat, cold, and sound—though it isn't up to the task of dampening the rabble of high-pitched voices within.",
    text: "Once home to the widowed Nadoya Sanmi, now infested with gremlins. Six jinkins forced Nadoya and most of the Sanmi family into the backyard storage room (area B12) and designated Yuli Sanmi and Hu Lelong as their personal attendants. The two secret lovers hatched a plan to fight back just before the PCs arrive; the jinkins are now quite drunk on rice wine and only grow rowdier. Two jinkins play \"catch\" with stolen jewelry. On the PCs' entry the drunken jinkins mistake them for oni and vie for attention. The jinkins all have the weak creature adjustments due to drunkenness. A successful Intimidation check compels all six to flee; otherwise the only ways to stop the wrecking are to wait for them to pass out (long enough for one to light the place on fire, destroying the interior completely) or attack — once a fight starts the drunk jinkins howl in delight and fight to the death.",
    checks: [
      "DC 17 Intimidation — Compel all six drunken jinkins to flee the house",
      "DC 13 Diplomacy or Intimidation — Press the truth out of Lelong about the necklace",
      "DC 13 Perception — Sense Motive on Lelong or Yuli to reveal the romance"
    ],
    treasure: "Among the stolen jewelry, one PC discovers a recognizable necklace belonging to their own family, worth 10 gp — but the jinkins cursed it: while worn or carried it makes the person stink of rotting garlic, imparting a –1 item penalty to Diplomacy and Stealth checks. The rest of the stolen jewelry is worth a total of 75 gp (two dozen pieces belonging to various Willowshore citizens).",
    quote: "Ooh! The oni are here! — Look at me! — Watch this!",
    aside: {
      title: "Star-Crossed Lovers",
      text: "If the jinkins are defeated, Lelong asks to take one of the necklaces, clumsily claiming he wants his uncle (guard captain Zheng Peng) or Granny Hu to sort out rightful ownership. Pressed (DC 13 Diplomacy or Intimidation), he admits he wants funds to support an elopement with his lover; he refuses to reveal Yuli is the lover, though the B10 letters or a DC 13 Perception Sense Motive on either lover reveals it. This explains why Lelong is downtown rather than at the Trading Post — he was secretly visiting when the monsters attacked, trapping him there. If the elopement is allowed, the couple can be encountered later at the Hunter's Hut in the hinterlands (area D6). Yuli remembers to retrieve the letters from area B10, or asks the PCs to return the correspondences before they leave."
    },
    beats: [
      { key: "ch2-b11-jinkins", label: "Defeat or drive off the jinkins", xp: 80, note: "Maximum total of 80 XP, accounting for the lesser threat the drunken (weak-adjusted) jinkins posed." },
      { key: "ch2-b11-jewelry", label: "Return the stolen jewelry", repN: 1, note: "1 Reputation Point with Northridge for taking steps to return the jewelry." },
      { key: "ch2-b11-elopement", label: "Actively encourage or aid the elopement", repS: -1, note: "Lose 1 Reputation Point with Southbank. Nadoya's attitude automatically becomes unfriendly at the start of Chapter 3 as she finds out about the relationship; gates the later D6 Hunter's Hut encounter." }
    ]
  },
  {
    id: "B12", key: "ch2-b12", name: "Backyard Storage", level: "Rescue", tone: "moss",
    creatures: "Nadoya Sanmi and family (villagers, noncombatant)",
    boxed: "Built almost like a bank vault with its cast-iron doors, this backyard storage has only a single round window that allows in air from the outside. The small vegetable garden in the backyard has an abundance of cucumbers.",
    text: "Nadoya and the rest of the Sanmi family have been ordered to stay here unless Gray Butcher or the jinkins call on them. Nadoya asks whether the jinkins in area B11 are still there and whether Yuli and \"the other young man\" are safe; if the area isn't cleared, she asks the PCs to clear it and save the two.",
    treasure: "If the gremlins have been evicted (the source says area B10 but the jinkins are in B11 — likely a typo), Nadoya gives the PCs a crying angel pendant talisman in gratitude. In the backyard is a row of fresh cucumbers — the PCs can take as many as they want with Nadoya's permission; offering them during any Make an Impression attempt on the kappas (area B15) improves the result by one degree of success.",
    beats: [
      { key: "ch2-b12-sanmi", label: "See the Sanmi family to safety past Dawnstep Bridge", xp: 20, repS: 1, note: "20 XP and 1 Reputation Point with Southbank." }
    ]
  },
  {
    id: "B13", key: "ch2-b13", name: "Bathhouse Foyer", tone: "gold",
    boxed: "The Happy Kappa's foyer is as homely as it's always been, though the floor is damp as if recently mopped. A distinct lye-like smell of some disinfectant hangs in the air.",
    text: "When a group of five kappas, covered in horse-gore, casually strolled in to clean up, the bathhouse's hypochondriac owner De-ge decided to treat the monstrous visitors as respected guests. Once they settled into the baths, he cleaned their bloody footprints and disinfected the foyer, then hid in the locker room (area B14)."
  },
  {
    id: "B14", key: "ch2-b14", name: "Bathhouse Lockers", level: "Rescue", tone: "gold",
    creatures: "De-ge (1)",
    boxed: "This locker room is orderly, with slippers and towels in each cubby. All the lockers are open, save for one.",
    text: "In his panic De-ge squeezed into a locker and got stuck; his panic grows. If freed, he is grateful but wants out of downtown — he begs the PCs to bring him to a more sanitized place, the Hand of Spring clinic (area W19). He also informs the PCs his \"guests\" are still here: the five kappas went through the middle door toward the baths to the west and have yet to emerge; he's certain a few polite words would get them to leave, but he's too afraid to face them and asks the PCs to do it.",
    checks: [
      "DC 10 Perception — Hear shuffling and soft whimpering within the closed locker (each round a PC starts their turn in this room)",
      "DC 17 Athletics — Force Open the locker door",
      "DC 15 Thievery — Disable the locker door without harm to De-ge"
    ],
    hazard: "Locker: AC 13, Hardness 5, HP 24 (BT 12). Any attempt to damage the locker transfers half the damage to De-ge, who howls in pain and begs his assailants to stop and go away.",
    beats: [
      { key: "ch2-b14-dege", label: "Escort De-ge to the Hand of Spring clinic (W19)", xp: 20, note: "20 XP. Points the PCs at area B15 (the kappas)." }
    ]
  },
  {
    id: "B15", key: "ch2-b15", name: "Mostly Happy Kappas", level: "Extreme 1", tone: "gold",
    creatures: "Kappas (5)",
    boxed: "A pair of stone-lined baths of steaming water sit within this open-air, hedge-walled yard.",
    text: "Explicitly NOT intended as a combat encounter. The five kappas relaxing in the pools aren't the ones who slaughtered the horses in the stables (area B8), but they delighted in the fresh meal and relocated here to wash up. As they spot the PCs, they invite the party to join them in the bath. They were invited here by a rokurokubi named Mo Douqiu, who asked for help taking over Willowshore; they confirm they ate the horses' innards (though it was the jinkins who killed the animals) — admitting this bribe was enough to get them to join him — and have begun to regret things, realizing the invasion can only bring woe and harm to themselves once the town's defenders rally. Initially indifferent; if made friendly they agree to leave town peacefully and return to Gourd Lake (area D2); otherwise they remain until Mo Douqiu is defeated. If made hostile, or if the PCs attack, the kappas curse and sputter in indignation and flee rather than fight back.",
    checks: [
      "DC 17 Diplomacy — Make an Impression to make the kappas friendly (start indifferent)",
      "DC 16 Arcana or Nature — Recall Knowledge that cucumbers are a kappa's favorite food (allow each PC with cucumbers on them — e.g., from B12 — one attempt)"
    ],
    treasure: "If convinced to leave on friendly terms, the kappas give the PCs a pearl worth 50 gp as a tip (as if the PCs are bathhouse employees). In the unlikely event the PCs confront and kill all five kappas, they can claim the pearl as treasure.",
    outcomes: [
      "Success — kappas made friendly: they leave peacefully for Gourd Lake (D2) and tip the PCs a 50 gp pearl.",
      "Failure — kappas remain in town until Mo Douqiu is defeated; if attacked, they flee rather than fight back."
    ],
    qa: [["Why did the kappas come to Willowshore?", "They were invited by Mo Douqiu, who asked for help taking over the town and bribed them with the horses' innards (killed by the jinkins). They describe the invasion as 'unfortunate', deny being the source of the problem, and confess the bribe — they've begun to regret joining him."]],
    beats: [
      { key: "ch2-b15-kappas", label: "Convince the kappas to leave on friendly terms", xp: 60, note: "60 XP. No reputation swing listed." }
    ]
  },
  {
    id: "B16", key: "ch2-b16", name: "Public Stage", level: "Severe 1", tone: "ember",
    creatures: "Jinkins (3)",
    boxed: "The mural on the back wall of this open-air stage has been heavily chipped and defaced.",
    text: "Three jinkins are roughhousing on the roof wearing costumes and props stolen from backstage. On spotting the PCs, two of the gremlins cheer and shout, demanding the PCs watch an impromptu play about the cowardice and foolishness of Willowshore's citizens. The performance is insulting and mean-spirited, but the jinkins keep at it as long as their audience keeps watching. If they notice the PCs about to leave, they call out to the \"ungrateful audience\" and begin hurling loose shingles. As soon as any jinkin actually takes damage, all three scream in surprise and flee the town entirely — combat is avoidable.",
    beats: [
      { key: "ch2-b16-stage", label: "Resolve the Public Stage encounter",  note: "Standard Severe 1 XP — tick only if the jinkins are fought; the book prints no XP because the jinkins flee the town permanently once any of them takes damage." }
    ]
  },
  {
    id: "B17", key: "ch2-b17", name: "Shelyn Shrine", tone: "ice",
    boxed: "Someone had the foresight to board up the shrine to the Eternal Rose. Through the cracks of the board, it's apparent that the ceramic statue of Shelyn inside is intact and well.",
    text: "To seek Shelyn's blessing for their coins, the PCs must Force Open the boards first. If they do so and don't restore the shrine's barricade, monsters notice the shrine 24 hours later and destroy it — causing any blessing the PCs got from the shrine on a copper coin to end. While the shrine can be rebuilt in time, this vandalism costs the PCs reputation with each faction.",
    checks: [
      "DC 15 Athletics — Force Open the boards (five successes required)"
    ],
    beats: [
      { key: "ch2-b17-shrine", label: "Shrine destroyed — barricade not restored", rep: -2, note: "Lose 2 Reputation Points from each faction (−2 Northridge and −2 Southbank). Restoring the barricade avoids the loss; Shelyn's coin blessing ends if the shrine is destroyed." }
    ]
  }
];

/* -------------------------------------------------------------- gray butcher */
const CH2_BUTCHER = [
  {
    key: "ch2-butcher-parade",
    name: "A Parade of Cookware — Gray Butcher",
    level: "Moderate 1",
    tone: "rust",
    creatures: "Gray Butcher (1) · Animated Cookware Swarms (2)",
    text: "Wandering boss encounter — timing left to the GM. While Mo Douqiu and Gurglegut claimed the Cerulean Teahouse and Dawnstep Bridge as their domains, the third ringleader — the butcher-apron-resembling ittan-momen named Gray Butcher — has no \"home\": they lead swarms of clattering cookware animated by Kugaptee's influence (animated cleavers, meat tenderizers, kettles, pans, chopsticks, and more) through Willowshore's streets on a clattering procession. No boxed text in the source — the encounter is heard before seen: the sound of hundreds of pieces of cookware clattering together, combined with Gray Butcher's off-key humming and singing, is impossible to miss. If Gray Butcher notices the PCs, they order a stop to the parade and shout a stern \"Who goes there?\" giving the party a chance to explain themselves.",
    phases: [
      "Phase 1 — Social: the PCs can Lie or Make an Impression (Gray Butcher starts unfriendly; no DC printed). If attitude improves to indifferent or better, Gray Butcher orders the PCs to join the parade for 15 minutes as their \"duty\" to celebrate Willowshore's new rulers; after this exhausting trip, each PC must succeed at a DC 15 Fortitude save or become fatigued. Regardless, Gray Butcher leaves them behind once their duty is fulfilled.",
      "Phase 2 — Combat: refusing enrages Gray Butcher, who orders the animated cookware to attack; they hang back during the fight, but if the PCs defeat both swarms, the ittan-momen sighs in frustration before swooping in to finish the job.",
      "Phase 3 — Second parade: if the PCs performed one parade, the next meeting should be no more than an hour later; this time Gray Butcher is frustrated and annoyed that the PCs are still \"lollygagging\" and attacks."
    ],
    checks: [
      "DC 15 Fortitude — Resist becoming fatigued after the 15-minute parade (each PC)"
    ],
    treasure: "Stashed in the pockets of Gray Butcher's apron body: two vials of oil of potency, two mesmerizing opal talismans, a pair of potency crystal talismans, and a +1 silver dagger in a silk-wrapped leather sheath (the sheath is worth 10 gp).",
    quote: "Who goes there?",
    qa: [
      ["Can the encounter be resolved without combat?", "Yes — Lie or Make an Impression, starting unfriendly (no DC printed). At indifferent or better the PCs must join the parade for 15 minutes, then each succeeds at a DC 15 Fortitude save or becomes fatigued."],
      ["What happens on a second meeting?", "If the PCs performed one parade, the next encounter comes within the hour; Gray Butcher is frustrated and annoyed at their 'lollygagging' and attacks immediately."]
    ],
    beats: [
      { key: "ch2-butcher-defeat", label: "Defeat Gray Butcher", rep: 1,  note: "1 Reputation Point with each faction. Standard Moderate 1 XP — no XP value printed in the source. Gray Butcher is one of the three ringleaders whose defeat is required to end the chapter." }
    ]
  }
];

/* ----------------------------------------------------------------- teahouse */
const CH2_TEAHOUSE = [
  {
    id: "C1", key: "ch2-c1", name: "Public Floor", level: "Low 1", tone: "plum",
    creatures: "Warty (1)",
    boxed: "The once finely lacquered wooden walls of this room bear evidence of violence, covered now with gouges and scrapes. The front counter of the teahouse is a mess of broken pots, bottles, and cups. A table has been turned on its side, along with whatever dishes were on it at the time. Another table still stands in the southeast corner, this one strangely well placed and set, as if expecting guests. Stairs lead up to an upstairs balcony to the northeast. Steps lead up two feet to an upraised wooden platform running along the northern wall, where several sliding doors stand closed save for the northwest corner, in which two unlit stoves sit in an alcove near a smaller wooden door.",
    text: "Abandoned for months; Mo Douqiu's arrival did no favors to the teahouse, and his jinkin minions did most of the damage here (they've since moved on). The set table to the southeast is prepared for a potential meeting with the noppera-bos who now dwell in the lumber camp to the west (see Chapter 4), but Mo Douqiu hasn't contacted them until he's sure he has full control of Willowshore. His pet giant toad Warty wanders this room freely; once the Eternal Lantern is lit, Kugaptee's influence over him diminishes. He remains loyal to Mo Douqiu but is more content sleeping near the stairs; if awoken by intruders, he begins to croak eagerly and lumbers forward to attack. As long as Warty is the only one making noise out here, Mo Douqiu assumes the toad is just being frisky and yells out from area C3 — even the obvious sound of PCs fighting in this room fails to rouse the rokurokubi; he'll only respond once they enter his chamber. Unless commanded to heel, Warty, not knowing any better, fights to the death.",
    treasure: "Searching the front counter reveals paperwork laying bare that the teahouse's financial troubles began long before Lung Wa collapsed, plus a document titled \"The Last Will and Testament of Qing Mai-Lai\" (Mai-Lai was the last proprietor of the Cerulean Teahouse). This document is key to the PCs legitimizing their claim over the teahouse if they want to run it as a business — see The Teahouse Owner's Will on page 43.",
    quote: "Settle down, Warty! I'll get you some food in a bit!",
    qa: [["What does Mo Douqiu do when he hears fighting in C1?", "Nothing — he assumes Warty is just being frisky and yells out from area C3. He'll only respond once the PCs enter his chamber."]],
    beats: [
      { key: "ch2-c1-warty", label: "Defeat Warty",  note: "Standard Low 1 XP — no XP value printed in the source. Warty is one of Mo Douqiu's pets who may be called to the C3 fight if still alive." }
    ]
  },
  {
    id: "C2", key: "ch2-c2", name: "Pantry Prison", level: "Rescue", tone: "slate",
    creatures: "Imprisoned Villagers (12)",
    boxed: "This pantry is poorly stocked, with any remaining supplies having spoiled long ago. The stink of ammonia lingers in the room.",
    text: "Both doors are locked with heavy-duty padlocks; Mo Douqiu carries the key. The pungent ammonia smell comes from a slow reaction of several spoiled ingredients. Mo Douqiu has little use for this room as a pantry and instead turned it into an impromptu prison holding the 12 villagers he and his monstrous agents have captured so far. All 12 are terrified, bound hand and foot with coils of rope, and fearful for their lives; they look quietly but hopefully at any PCs, too afraid to cry out for help in fear of alerting Mo Douqiu. All 12 are currently fatigued.",
    checks: [
      "DC 20 Thievery — Pick the Lock on each door (three successes each)",
      "DC 25 Athletics — Force Open each sturdy door (one success each)",
      "DC 15 Fortitude — Avoid becoming sickened 1 when ending a turn in this room (ammonia fumes)"
    ],
    beats: [
      { key: "ch2-c2-captives", label: "Free the 12 captives", xp: 40, rep: 1, note: "40 XP and 1 Reputation Point with each faction. The keys to the padlocks are on Mo Douqiu (area C3)." }
    ]
  },
  {
    id: "C3", key: "ch2-c3", name: "Private Banquet Hall", level: "Moderate 1", tone: "rust",
    creatures: "Mo Douqiu the Hedonist (1) · Fluffy Whiskers (1) (+ Warty, + Stingy if alive)",
    boxed: "This once-elaborate banquet room has become a den of filth, littered with unwashed dishes, food stains, and what looks to be the aftermath of many grisly slaughters. Bodies flayed or partially digested to the point of being unrecognizable lie heaped in corners or sway from ropes tied to wooden beams above. A pile of filthy, soiled cushions and blankets lie in a nest-like heap in the middle of the room.",
    text: "Mo Douqiu is a hedonist; it'll take more than sounds of battle in area C1 or upstairs in C4 to get him to respond — but as soon as the sliding doors on the south wall are opened, he gives a heavy sigh, conceding he'll need to handle the intruders himself. He won't make the first attack; once combat begins he commands his remaining pets to rise to his defense: Warty (if the giant toad still lives) and Stingy (if the cave scorpion still lives); if both are dead, his pet weasel Fluffy Whiskers clambering out of his sleeves, launching off his shoulders to fight at his side. As a result of his philosophizing and hesitance to start the fight, he rolls for initiative with Society. He favors tactics focused on Demoralizing the PCs, particularly by using Threatening Lunge. If a PC occupies the same space as a hanging body and Mo Douqiu's neck is extended and he's adjacent to that PC, he can make a jaws Strike against the ropes holding the body aloft, automatically hitting and severing the rope — the dead body falls onto the character below. Reveling in the violence, Mo Douqiu fights to the death, laughing as he dies and ending with an unhinged grin in death.",
    checks: [
      "DC 15 Reflex — Avoid the falling hanging body's 1d6+3 bludgeoning damage (basic save; a character who fails is also knocked prone)"
    ],
    treasure: "Flask of fellowship (Secrets of Magic 184) — the one item of value to escape Mo Douqiu's attention. Mo Douqiu also carries the keys to the locks on the doors to area C2.",
    quote: "Dance! Sing! Fight! Whatever is entertaining! It's what living is all about, so LIVE! Otherwise, make use of yourself and go feed Warty. As in, leave your treasure here and let that hungry critter just gobble you down. Most people are better as toad food anyway.",
    qa: [
      ["Why did he invade Willowshore?", "Because this town is the most boring place ever! Everyone's working day-in, day-out, just to make ends meet. Every single year, doing the same thing over and over again. All that work just to survive. Wouldn't you want to liven this up too if you see everyone forever mired in the same dreadful routine?"],
      ["His philosophy when questioned?", "But it was a change, right? Nothing changes you more than being thrown into the middle of a horror story! People love those terrifying tales, you know, so why not live through one? — then a roaring laugh — Admit it. Haven't you been having fun?!"]
    ],
    beats: [
      { key: "ch2-c3-defeat", label: "Defeat Mo Douqiu", rep: 1,  note: "1 Reputation Point with each faction. Standard Moderate 1 XP — no XP value printed in the source. Defeating Mo Douqiu is required to end the chapter and to free the C2 prisoners' source of keys." },
      { key: "ch2-c3-funerals", label: "Bodies removed and made presentable for funerals", rep: 1, note: "1 additional Reputation Point with each faction if the PCs ensure all the bodies are removed from the beams and respectfully covered or otherwise made presentable for proper funerals — total up to +2 Reputation with each faction." }
    ]
  },
  {
    id: "C4", key: "ch2-c4", name: "Second Floor", level: "Trivial 1", tone: "plum",
    creatures: "Stingy (1)",
    boxed: "Once a relaxing area in which guests could enjoy tea and quiet conversation, the furniture and walls of this room have been vandalized and bear deep scratches. A hole has been smashed into the wall to the northeast.",
    text: "The second floor of the Cerulean Teahouse is 10 feet aboveground, and the stairs leading up are noisy from lack of maintenance — someone who climbs the stairs automatically causes them to creak and alerts the creature that dwells up here; attempts to traverse the stairs via Stealth suffer a –4 item penalty. Mo Douqiu's final pet, a cave scorpion named Stingy, dwells here and is far more subtle than Warty: if alerted to intruders, Stingy doesn't immediately clamber down the stairs but instead Hides in the rafters, hoping to drop on the PCs and attack unexpectedly after allowing them a few rounds to explore the place.",
    checks: [
      "Stealth on the stairs — –4 item penalty; climbing automatically causes them to creak and alerts Stingy"
    ],
    beats: [
      { key: "ch2-c4-stingy", label: "Defeat Stingy",  note: "Standard Trivial 1 XP — no XP value printed in the source. Stingy may join the C3 fight if still alive." }
    ]
  },
  {
    key: "ch2-conclusion",
    name: "Concluding the Chapter",
    tone: "moss",
    text: "This chapter ends once the three monstrous ringleaders are defeated — Gurglegut (likely defeated in Chapter 1), Gray Butcher, and Mo Douqiu — and the Eternal Lantern is once again lit (the source's line reads as if lit at this point; the lantern was lit at the start of this chapter's events — treat as per the book's text).",
    note: "The remaining monsters in Willowshore flee back into the surrounding wilderness; optionally, some could end up hiding elsewhere in town, giving the PCs additional tasks as the adventure continues.",
    beats: [
      { key: "ch2-conclusion-ringleaders", label: "All three ringleaders defeated", note: "Gurglegut (Chapter 1), Gray Butcher, and Mo Douqiu — required to end the chapter." }
    ]
  }
];



/* =====================================================================
 * Chapter 3 — The Willowshore Curse (Act 1, 'The Summer That Never Was')
 * Card data for the summer console.  Source digest: digests/ch3.md.
 * Arrays: CH3_TOWN / CH3_HINTERLANDS / CH3_CURSE (order fixed).
 * The 'Who Leads Willowshore?' duel is handled by a separate console;
 * only its intro hook is referenced in CH3_CURSE (pointer only).
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * CH3_TOWN — the Mysterious Merchant (Asahina Shinzo) + the aftermath.
 * --------------------------------------------------------------------- */
const CH3_TOWN = [
  {
    key: "ch3-aftermath",
    name: "The Aftermath: Funerals and Repairs",
    when: "Opening of Chapter 3 — after the Eternal Lantern is lit",
    tone: "moss",
    text: "Nearly three dozen citizens perished during the monstrous occupation; Willowshore's population now stands at 225. The town mourns its dead with funerals and sets to repairing the damage of the invasion, day by day. Granny Hu and Old Matsuki fall into leadership roles, and the PCs decide whom to side with — or both, or neither. Their choice colours the coming politics: the elders' rivalry will snap into open conflict in the third month of summer (see the Who Leads Willowshore? duel, handled by its own console).",
    note: "Population 225 — the lowest Willowshore has stood in generations. The elders set aside their feud when the curse's mysteries need solving (see The Elders' Request)."
  },
  {
    key: "ch3-merchant-shinzo",
    name: "The Mysterious Merchant (Asahina Shinzo)",
    when: "The day after the liberation, before the PCs meet the elders",
    tone: "gold",
    creatures: "Asahina Shinzo (1) · Yix (1)",
    text: "A stranger with a raven arrives in a horse-drawn cart and sets up a stall in downtown Willowshore. He appears friendly, but the timing makes townsfolk wary: he looks like an average Tian man, yet he is secretly a powerful entity in Pharasma's service — a shinigami named Asahina Shinzo, still undergoing penitence for an infraction against Pharasma committed decades before the Age of Lost Omens. He is explicitly barred from directly intervening in any mortal's fate; he hopes that helping those trapped in Willowshore's mindscape escape (back to life or on to death) repays his debt to the Lady of Graves. He maintains his human disguise at all times and introduces himself as a traveling salesperson hoping to add Willowshore to his regular route.",
    aside: {
      title: "GM only — Shinzo's true nature",
      text: "Shinigami in Pharasma's service, penitent, barred from direct intervention. His raven Yix is a nosoi psychopomp who stays in bird form at all times and silently observes Shinzo — never betraying that he is anything other than a friendly (if periodically noisy) raven. The horse and wagon are magical constructs that manifest whenever he visits the mindscape, but his wares are real. Do not reveal any of this to the players."
    },
    treasure: "Shinzo opens his cart for the PCs — currently little beyond minor items and supplies: any common item of up to 2nd level. He also buys any items/equipment the PCs wish to sell at normal prices."
  },
  {
    key: "ch3-shinzo-where",
    name: "Where Does Shinzo Go?",
    when: "Between visits — he appears no more than four times per month",
    tone: "gold",
    text: "Shinzo can come and go from the mindscape as he wishes but never does so while observed; his Stealth is high enough that any attempt to follow him easily fails. If asked how he obtains supplies or whether he can travel beyond the hinterlands, he is initially evasive; if pressed, he \"admits\" he isn't sure where he goes or comes from between visits, hoping only that his time in Willowshore proves helpful. For Acts 1–2 he remains friendly, helpful, polite, and enigmatic. His greatest service: obtaining items the PCs desire and returning with them for sale on a following visit — increasingly important as the Adventure Path progresses.",
    note: "Shinzo's Supplies — (a) pre-stock his cart with a dozen various items of a level no higher than the party's level on each visit; or (b) allow the players to 'place orders,' available for purchase on his next visit. The upper-level limit of items he can offer is set by the party's level.",
    phases: [
      "Visit timing — no more often than four times per month, spaced at least 1 week apart; tends to show up right before/after the PCs level up, and before/after they set out on or return from a lengthy expedition. Time his arrival for when the PCs are close to leveling up or at the halfway point of a level.",
      "Length of stay — he stays in Willowshore for 24 hours each visit."
    ]
  }
];

/* ---------------------------------------------------------------------
 * CH3_HINTERLANDS — the D1-D13 sandbox, the Opportunities menu,
 * and the travel/random-encounter rules.
 * --------------------------------------------------------------------- */
const CH3_HINTERLANDS = [
  {
    key: "ch3-karahai",
    name: "The Mission to Karahai",
    when: "Early chapter — after the aftermath",
    tone: "moss",
    text: "News and requests for aid must reach Willowshore's closest neighbor, the fortified settlement of Karahai, several dozen miles east on the coast of the Sea of Ghosts — Willowshore's most important trade partner. Word of the attack and the loss of the governor and his estate must be reported. Granny Hu or Old Matsuki gives the PCs the task: journey southeast along the banks of the Duyue River to deliver the news to Commander Wen of Karahai. The route is known and relatively safe. The PCs' favored elder provides them all with horses; leaving at dawn, they arrive at Karahai just before sunset.",
    note: "Present the downriver trip as a summary, NOT as exploration with encounter potential. Describe how the lack of rain (even with overcast skies) feels like a good sign for a dry, pleasant summer. Leads directly into The Mindscape Border."
  },
  {
    key: "ch3-mindscape-border",
    name: "The Mindscape Border",
    when: "A few hours before reaching Karahai — just past Gourd Lake",
    tone: "slate",
    boxed: "A few hours before they expect to reach Karahai, not long after they leave Gourd Lake behind and are about to emerge into a wide valley that should give them their first glimpse of the Sea of Ghosts with the fortress of Karahai visible on its coastline bluffs, another strange fog descends on the party. This fog quickly grows unexpectedly and almost supernaturally thick, reducing visibility to a dozen feet or so. The horses grow nervous and skittish, and regardless of the direction the PCs travel (or even if they remain motionless), a few moments later, the fog lifts to reveal the PCs have returned to the spot they just left.",
    text: "No matter how many times the PCs push forward, the fog descends and they find themselves back where they started. This happens whenever they attempt to cross the mindscape's boundary (per the Willowshore Hinterlands map), including attempts to fly up into the air. The first time should be unsettling, confusing, and frightening. Let the PCs try spells or Recall Knowledge on the phenomenon: regardless of result, whatever causes the fog is beyond their current knowledge — only the suggestion that some strange curse has settled on the land, no doubt tied to the monster invasion and the vanishing of Governor Heh and his estate. The PCs cannot reach Karahai; they should return to Willowshore to report, then proceed with Investigating the Curse.",
    note: "No DC is given for Recall Knowledge on the fog, and no result yields useful information. Night falls with a rainstorm: the PCs choose between camping near Gourd Lake or returning home in the dark and wet — proceed with exploration-mode play. The mindscape's edge discovered; all further travel beyond the border fails the same way."
  },
  {
    key: "ch3-exploring",
    name: "Exploring the Hinterlands",
    when: "Travel rules — every day spent in the hinterlands",
    tone: "moss",
    creatures: "Giant stag beetle (1) · Jinkins (varies) · Noppera-bos (varies) · Slime molds (up to 6) · Thatchlings (varies)",
    checks: [
      "DC 17 Flat Check — random encounter chance, once per day the PCs spend in the hinterlands; on success roll 1d12 (within 2 hexes of Willowshore) or 1d20 (elsewhere) for what they meet"
    ],
    text: "Forest hexes without roads are difficult terrain, as are rough and rocky fields in the southern hinterlands. Track the PCs' exploration activities. Once per day they spend in the hinterlands, attempt the DC 17 Flat Check; if an encounter occurs, decide whether it happens while traveling or while camping. Encounter table notes: Animals are wary of the party and only attack if attacked first — there is only one giant stag beetle living in the region. Jinkins are survivors from the invasion of Willowshore; a jinkin shrieks in fear if it takes any damage and flees into the wild. Noppera-bos are outcasts never accepted into the larger gathering at the lumber camp (D11); they fight to the death, hoping to claim PCs as trophies to buy their way into the larger group — at your option, if the PCs are about to reach 3rd level, have them learn about the noppera-bo presence at the lumber camp (see Chapter 4). Slime molds are patches of ravenous fungi from the fungal infestation south of Willowshore (D7) that slithered out to wander and prey on wildlife indiscriminately — only six in all the hinterlands. Thatchlings are NOT part of the thatchlings found at Canary Inn (D4).",
    note: "Encounters themselves award XP per bestiary/encounter norms — no fixed reward on this card."
  },
  {
    id: "D1",
    key: "ch3-d1",
    name: "Willowshore",
    when: "Home base",
    tone: "muted",
    text: "The town of Willowshore is located here, straddling the banks of the Ceiba River."
  },
  {
    id: "D2",
    key: "ch3-d2",
    name: "Gourd Lake",
    when: "South of Willowshore, on the road to Karahai",
    tone: "moss",
    text: "Marshy shores surround this relatively shallow lake, making it a poor site for building a village. The lake is excellent for fishing — as long as fishers avoid the southern shores, which are claimed as territory by several kappas.",
    note: "Relevant to the Missing Boats opportunity and the Mindscape Border encounter."
  },
  {
    id: "D3",
    key: "ch3-d3",
    name: "Treacherous Trail",
    when: "Low 2 — shortcut past the southern river bend",
    tone: "ember",
    level: "Low 2",
    creatures: "Snapping flytrap (1)",
    text: "Once used more often as a shortcut to bypass the southern river bend, the trail is well known to be overgrown and infested with snapping flytraps. A sign posted at either end reads, \"Warning: Dangerous plants!\" Whether PCs taking this trail actually encounter a snapping flytrap is up to the GM.",
    note: "Source header lists a single snapping flytrap; count of 1 assumed (source extraction artifact)."
  },
  {
    id: "D4",
    key: "ch3-d4",
    name: "Canary Inn",
    when: "North of town — ruined roadhouse",
    tone: "muted",
    text: "Once a roadhouse used by travelers journeying between Karahai and villages a few days' travel north, this inn burned to the ground a few years back in the aftermath of a tense standoff between Willowshore's guards and a group of fugitives on the run from Lung Wa.",
    note: "Site of the Songs at Canary Inn investigation (see The Missing Governor)."
  },
  {
    id: "D5",
    key: "ch3-d5",
    name: "Green Silk Peak",
    when: "Nearly 2,000 feet of elevation",
    tone: "moss",
    text: "The slopes make for a tiring ascent — treat as greater difficult terrain. The view from the summit is breathtaking, affording an expansive view of the Sea of Ghosts to the east. On clear days a PC can see the fortress of Karahai, with no evidence of the strange mist enclosing the region. Yet even flying directly to the fortress from the peak encounters the mindscape's barrier. Attempts to attract Karahai's attention with long-distance signals (smoke signals, powerful lights at night) get no response — this view of Karahai and the Sea of Ghosts is little more than a potent illusion of what once lay beyond the mindscape's borders."
  },
  {
    id: "D6",
    key: "ch3-d6",
    name: "Hunter's Hut",
    when: "In the woods — abandoned a year ago",
    tone: "moss",
    checks: [
      "DC 13 Diplomacy — convince the couple to return to town (or DC 13 Intimidation — same; either works)"
    ],
    text: "Abandoned a year ago and already overgrown, but still usable as shelter from the elements. If the young couple Yuli and Lelong were allowed to elope in Chapter 2 (area B11), they take shelter here after discovering they can't leave the region. They aren't sure what to make of the strange mist and beg the PCs not to tell anyone in Willowshore they're staying here. They consent to return to town if the PCs impress upon them the strange times and dangers they face, and sheepishly return home.",
    beats: [
      { key: "d6-support", label: "Save or support Yuli and Lelong", xp: 20, note: "What fate the lovers meet if left out here is up to the GM." },
      { key: "d6-return", label: "The couple is convinced to return to town, or their families are informed so they can be retrieved", repS: 1 }
    ]
  },
  {
    id: "D7",
    key: "ch3-d7",
    name: "Infested Grove",
    when: "South of Willowshore — western bank of Dragonfly Creek",
    tone: "plum",
    text: "Once an idyllic grove of willow trees where young lovers gathered for picnics, this grove has become infested by a fungal monster (see Into the Infestation — encounter at Moderate 2: Xungu the myceloid)."
  },
  {
    id: "D8",
    key: "ch3-d8",
    name: "Old Village Expansion",
    when: "North of town — just within the fog border",
    tone: "moss",
    text: "The overgrown ruins of several buildings lie slumped in this large grassland, surrounded by weed-choked fields. This site could serve Willowshore as an excellent location to grow additional crops in the next act, provided the PCs help get things moving (see the Investigate the Old Expansion opportunity)."
  },
  {
    id: "D9",
    key: "ch3-d9",
    name: "Eyes of Fumeiyoshi",
    when: "Low 2 — two pools in bowl-shaped depressions north of town",
    tone: "slate",
    level: "Low 2",
    creatures: "Hunting spiders (2)",
    checks: [
      "DC 16 Athletics — navigate the steep sides of either depression (failure = minor slip, 5 bludgeoning damage)"
    ],
    text: "Two pools in bowl-shaped depressions known as the Eyes of Fumeiyoshi. Nothing grows in the gritty gray soil filling both basins; local rumor holds that centuries ago Fumeiyoshi, the god of graves and dishonor, looked out into the world through these two brackish pools before his attention was diverted elsewhere, and no plant life can grow here since. The hollows are simply places with bad soil, but the \"cursed land\" lore persists. Western pool (D9a) — \"The Left Eye of Fumeiyoshi,\" 25 feet deep, otherwise safe. Eastern pool (D9b) — \"The Right Eye of Fumeiyoshi,\" shallow, never exceeding 10 feet deep; a pair of hunting spiders claims its shores as their lair. The PCs must explore these locations to become new owners of the Cerulean Teahouse (see The Teahouse Owner's Will).",
    treasure: "Two pearls (10 gp each) hidden in the waters — see The Teahouse Owner's Will.",
    note: "No XP is stated for the spider fight beyond standard encounter XP (source flag)."
  },
  {
    id: "D10",
    key: "ch3-d10",
    name: "Gorge of Fangs and Teeth",
    when: "A few miles from the edge of the forest — the old quarry",
    tone: "slate",
    text: "This escarpment of stone was where most of the materials used to pave Willowshore's roads and build its foundations and stone structures were quarried. The stone spider Ugly Cute retreated here (see Searching for Ugly Cute). Encounter at Moderate 2 when the PCs arrive — see Rescuing Ugly Cute (Living boulders (2))."
  },
  {
    id: "D11",
    key: "ch3-d11",
    name: "Lumber Camp",
    when: "West of town — home of monsters",
    tone: "ember",
    text: "This once-abandoned lumber camp is now the home of monsters — see Chapter 4 for more information. The noppera-bo gathering place; Ugly Cute's trail passes near here (see A Timely Intervention)."
  },
  {
    id: "D12",
    key: "ch3-d12",
    name: "Ritual Site",
    when: "A forest clearing bisected by the Wall of Ghosts",
    tone: "plum",
    text: "A forest clearing is bisected here by the Wall of Ghosts — see Chapter 4 for more details about this ritual site."
  },
  {
    id: "D13",
    key: "ch3-d13",
    name: "The Road to Enlightenment",
    when: "Past the Wall of Ghosts, into the western mountains",
    tone: "muted",
    text: "This narrow roadway leads further up past the Wall of Ghosts into the mountains to the west. The most likely route the PCs take in Act 2 when journeying out to the abandoned monastery northwest of Willowshore."
  },
  {
    id: "P",
    key: "ch3-p-peachwood",
    name: "Peachwood Grove",
    when: "Three groves marked 'P' on the Willowshore Hinterlands map",
    tone: "gold",
    text: "A grove of peachwood trees grows in each of these areas (marked \"P\" on the Willowshore Hinterlands map). These trees can be harvested for fulu creation supplies (see the Collecting Peachwood opportunity). Local belief holds the three regional groves help protect Willowshore from the influence of evil spirits."
  },
  {
    key: "ch3-wall-of-ghosts",
    name: "The Wall of Ghosts",
    when: "Northwesternmost reaches of the mindscape",
    tone: "slate",
    boxed: "The northwesternmost reaches of the mindscape lie beyond an impenetrable field of opaque white mist that cuts through the region, forming a vertical wall that appears to rise 50 feet into the air. Now and then, the distorted shapes of what look like silently screaming humanoid ghosts ripple through the mist, as if trapped within the fog.",
    hazard: "DC 24 Will — on failure the PC is Frightened 1 upon emerging back where they started; on a critical failure they're Frightened 3 and fleeing as long as they remain frightened. (Entering the wall also turns the PC around to reemerge at the entry point.)",
    text: "A PC who can fly and attempts to soar above the wall can look further west upon the view of the forested mountains, but any attempt to approach within 10 feet of the wall's position below causes more mist to flare up before them. The Wall of Ghosts is a defensive barrier that sprang directly from Kugaptee's sinister power to protect the approach to his grave. Removing it is an important part of Act 2. Any PC who attempts to enter it is turned around to reemerge where they entered AND is exposed to an overwhelming sense of fear and horror as the ghosts in the wall flow through them, tainting their mind with terror and feelings of overwhelming, impending doom.",
    note: "See Act 2: Let the Leaves Fall for details on the Wall of Ghosts and what lies beyond."
  },
  {
    key: "ch3-opp-boats",
    name: "Missing Boats",
    when: "Requested by Rajul Samudra (Willowshore Dock, area W31)",
    tone: "moss",
    creatures: "Kappas (several; count per GM) · Kappa elder (1)",
    checks: [
      "DC 17 Athletics — win a sumo match by brute force",
      "DC 17 Deception — win a match by tricking a kappa into bowing or spilling the water in its head bowl"
    ],
    text: "Rajul breathlessly reports that kappas just stole two boats from Willowshore Dock and fled downriver with them; he asks the PCs to catch up and get the boats back. The kappas bring the boats to the southern shores of Gourd Lake (D2); when the PCs reach the area they can confront the thieves. The boats float a dozen feet offshore while several kappas play on them. A kappa elder approaches to apologize for the youngsters' pranks and asks the party to teach the younger kappas a lesson through \"trial by sumo wrestling.\" The PCs must win at least three out of five sumo wrestling matches — by brute force (Athletics) or by tricking a kappa into bowing/spilling the water in its head bowl (Deception). Critical failure on Athletics: the PC strained a muscle — Enfeebled 1 for 24 hours. Critical failure on Deception: the PC made a fool of themself — −2 circumstance penalty to all future Deception checks in this contest. If violence breaks out, or the PCs fail to win at least three matches, the kappas hiss, curse, and flee into the water, abandoning the boats — but will likely just steal the boats again a few days later. Some kappas may be those encountered in Chapter 2: if that encounter was resolved peacefully, the PCs only need to win at least one of five matches.",
    beats: [
      { key: "boats-won", label: "Win enough sumo matches — the kappas learn their lesson and stop stealing boats", xp: 40, repN: 1, note: "Peaceful resolution removes future boat thefts. Violent/failed resolution leaves the boats abandoned, but theft resumes in a few days." }
    ]
  },
  {
    key: "ch3-opp-ranch",
    name: "Fixing the Ranch",
    when: "Requested by Kum Soon-chong (Willowshore Stables, area W2)",
    tone: "moss",
    checks: [
      "DC 15 Survival — chase down and return livestock that fled into the nearby wilderness (8 hours, once per day per PC, earns Victory Points)",
      "DC 15 Crafting — help repair the ranch's fencing (8 hours, once per day per PC, earns Victory Points)"
    ],
    text: "Help the proprietor repair Willowshore Stables, heavily damaged during the monster invasion. Once per day, each PC can either spend 8 hours chasing down and returning livestock, or helping repair the ranch's fencing. These checks earn Victory Points.",
    influence: [
      { key: "vp-ranch", label: "Victory Points — Fixing the Ranch", max: 10, note: "Each successful check earns 1 VP (GM's call on how many per check).", reveal: "Services at Willowshore Stables become available again." }
    ],
    beats: [
      { key: "ranch-fixed", label: "Ranch restored (10 Victory Points)", xp: 10, repS: 1 }
    ]
  },
  {
    key: "ch3-opp-shrine",
    name: "Moving Desna's Shrine",
    when: "Requested by Choe Chung-hu (Milling Houses, area W8)",
    tone: "moss",
    creatures: "Kohoshi (shikigami kami, 1)",
    checks: [
      "DC 19 Diplomacy — convince Kohoshi to let the PCs move the shrine",
      "DC 15 Athletics — physically move parts of the shrine (4 hours each, earns Victory Points)",
      "DC 16 Religion — ensure the shrine's components remain intact (4 hours each, earns Victory Points)"
    ],
    text: "Chung-hu asks the PCs to find a new home for the Desna shrine currently languishing in the Abandoned Estates part of town (area W23b). A shikigami kami named Kohoshi guards the shrine. The PCs must convince Kohoshi to allow the move, then physically move the shrine's parts (Athletics) or ensure its components remain intact (Religion). Each check takes 4 hours and accumulates Victory Points. The PCs take a −2 circumstance penalty to these checks if they attempt to move the shrine without Kohoshi's permission. A worshipper of Desna gains a +2 circumstance bonus to all checks during this challenge.",
    influence: [
      { key: "vp-shrine", label: "Victory Points — Moving Desna's Shrine", max: 5, note: "Each check is 4 hours.", reveal: "The shrine is relocated to the Milling Houses (W8), where Chung-hu attends to it." }
    ],
    beats: [
      { key: "shrine-moved", label: "Shrine relocated to the Milling Houses (5 Victory Points)", xp: 20, repS: 1 }
    ]
  },
  {
    key: "ch3-opp-expansion",
    name: "Investigate the Old Expansion",
    when: "Requested by Matsuki Shou (Matsuki Estate, area W5)",
    tone: "moss",
    checks: [
      "DC 16 Nature — investigate the surrounding fields and appraise their viability (4 hours, earns Victory Points)",
      "DC 16 Farming Lore — same",
      "DC 18 Society — plan the best methods for starting new crops in the ruins (earns Victory Points)"
    ],
    text: "Old Matsuki worries that if the people of Willowshore are trapped by a curse, they won't have enough food to last the winter. He asks the PCs to head north to an abandoned village, determine if it can still be reached, and if so explore it and gather enough information for villagers to plant emergency crops there. The PCs travel to the old village expansion (area D8), potentially facing a random encounter en route. The abandoned village lies just within the mindscape's fog border. At the site, the PCs accumulate Victory Points by spending 4 hours then attempting checks to investigate the fields and appraise their viability, or to plan the best methods for starting new crops in the ruins.",
    influence: [
      { key: "vp-expansion", label: "Victory Points — Investigate the Old Expansion", max: 8, note: "Each check is 4 hours.", reveal: "The location is secured as a supplemental agricultural site for Willowshore." }
    ],
    beats: [
      { key: "expansion-secured", label: "Old Expansion secured as a supplemental agricultural site (8 Victory Points)", xp: 20, repS: 1, note: "Secured food supply pays off in Act 2." }
    ]
  },
  {
    key: "ch3-opp-smith",
    name: "Smith Troubles",
    when: "Second month of summer — requested by Yong Wu-Xiu (Eternal Blaze Ironworks, area W1)",
    tone: "ember",
    checks: [
      "DC 21 Intimidation — frighten or threaten Yong Wu-Xiu into complying with Zheng Peng's requests (2-hour discussions, earns Victory Points)",
      "DC 18 Diplomacy — appeal to Zheng Peng's sense of community, perhaps promising to serve a more active role in defending Willowshore (2-hour discussions, earns Victory Points)"
    ],
    text: "Imperial guards allied with Northridge have begun pressuring Eternal Blaze Ironworks to set aside other work to craft weapons and armor free of charge, to arm guards now that Willowshore might be cut off from the world. Wu-Xiu asks the PCs to speak to Zheng Peng at Willowshore's Guard Office (area W15); alternatively, they could try to convince Wu-Xiu that supporting the town's guards is a good idea. Whichever NPC they choose, swaying one to capitulate to the other's needs requires accumulating Victory Points through several 2-hour discussions with the NPC of their choice.",
    influence: [
      { key: "vp-smith", label: "Victory Points — Smith Troubles", max: 6, note: "Each 2-hour discussion earns VP.", reveal: "The NPC acquiesces to the PCs' favored solution." }
    ],
    beats: [
      { key: "smith-wuxiu", label: "Sided with Yong Wu-Xiu — the ironworks keeps its independence", xp: 20, repS: 1, note: "tick exactly one" },
      { key: "smith-zheng", label: "Sided with Zheng Peng — the ironworks arms the town's guards", xp: 20, repN: 1, note: "tick exactly one" }
    ]
  },
  {
    key: "ch3-opp-peachwood",
    name: "Collecting Peachwood",
    when: "Second month of summer — requested by Yun Mong-un (Woodcarver's Guild, area W25)",
    tone: "gold",
    checks: [
      "DC 18 Nature — Earn Income harvesting fallen branches (up to a 4th-level task, DC set by level)",
      "DC 18 Survival — same"
    ],
    text: "Mong-un asks the PCs to gather fallen peachwood branches so she can craft paper suitable for creating rare fulus. Supplies for peachwood paper are traditionally imported (local belief: the three regional groves protect Willowshore from evil spirits), but with supply lines cut off the PCs must visit the three groves (marked \"P\" on the Willowshore Hinterlands map). No one in Willowshore has the advanced carpentry skill or tools to properly harvest peachwood, so Mong-un asks the PCs to leave the trees alone and harvest only fallen branches. Fallen branches don't carry the same intrinsic supernatural quality (and thus value) as properly treated peachwood (see Lost Omens Tian Xia Character Guide 129), but they remain a viable and useful component of Mong-un's fulu production. To harvest, a PC attempts to Earn Income in the area; it can be up to a 4th-level task. On a critical failure, no further attempts to harvest from that grove can be made until next year — which, unknown to the PCs, renders that grove useless for the remainder of the campaign. Until Willowshore returns to the modern era at the start of Act 4, no attempt to harvest properly treated peachwood can be made.",
    treasure: "In thanks, Yun Mong-un offers to teach the PCs the formula for any of the Rare Fulus and gives each PC 8 gp worth of these fulus.",
    beats: [
      { key: "peachwood-supplied", label: "First harvest handed over — 10 gp in supplies total", xp: 20, repN: 1, note: "The PCs can keep harvesting as long as supplies hold out. Critical failure permanently (campaign-long) loses a grove." }
    ]
  },
  {
    key: "ch3-opp-teahouse",
    name: "The Teahouse Owner's Will",
    when: "Trigger: the PCs discover \"The Last Will and Testament of Qing Mai-Lai\" in area C1 of the Cerulean Teahouse, or the third month of summer begins — requested by Luo Xi Yang (Luo & Laws, area W20)",
    tone: "gold",
    level: "Low 2 (spider fight at D9b)",
    creatures: "Hunting spiders (2) — must be dealt with before searching the Right Eye (D9b)",
    checks: [
      "DC 14 Willowshore Lore — know that the 'Eyes of Fumeiyoshi' are the two ponds north of town (or DC 16 Society — same)",
      "DC 16 Athletics — reach the pond (as detailed in area D9)",
      "DC 10 Athletics — Swim to stay underwater during the search",
      "DC 15 Perception — discover the pearl (−2 to the DC each repeated attempt; only attemptable if the Swim check was at least a success)"
    ],
    text: "If the PCs discover the document themselves, they can begin as soon as they read and understand the requirement. Otherwise, on the first day of the third month of summer, Luo Xi Yang approaches the PCs after the document has come into her hands, presenting it and noting that \"Willowshore's newest heroes\" should have the first chance to fulfill the document's requirements and take ownership of the Cerulean Teahouse. The eccentric aristocrat Qing Mai-Lai wanted heirs with the gumption and devotion to continue running the teahouse, and set a dangerous inheritance requirement. With no descendants surviving today, ownership legally transfers to the first person or group that fulfills the document's requirement: to recover the \"two pearls I've thrown into Fumeiyoshi's eyes.\" A successful Recall Knowledge identifies the two small ponds north of town known locally as the \"Eyes of Fumeiyoshi\" (Xi Yang or another NPC can point this out if no PC makes the connection). To retrieve a pearl: reach the pond (Athletics, per area D9 — deal with the two hunting spiders at D9b first), then spend time searching the waters. Each attempt to find a pearl takes 4 hours of Searching, a Swim check to stay underwater during the search, and a Perception check (attemptable only if the Swim check was at least a success) to discover the pearl. The Perception DC decreases by 2 each time the Perception check is repeated.",
    treasure: "2 pearls (10 gp each); ownership of the Cerulean Teahouse as a business to run (restoration and running rules are a significant Act 2 pursuit).",
    beats: [
      { key: "teahouse-claimed", label: "Claimed ownership of the Cerulean Teahouse (both pearls recovered)", xp: 40, note: "Triggers the Tea Farm Infestation opportunity one week later." }
    ]
  },
  {
    key: "ch3-opp-teafarm",
    name: "Tea Farm Infestation",
    when: "Trigger: a week has passed since the PCs completed The Teahouse Owner's Will — requested by Mountain Summit Grass (The Leshy's Salon, area W35)",
    tone: "moss",
    checks: [
      "DC 18 Nature — make progress against the blight (8 hours, earns Victory Points)",
      "DC 16 Farming Lore — same"
    ],
    text: "Once word spreads that the PCs own the Cerulean Teahouse, the leshy tea maker Mountain Summit Grass approaches them with a proposition: a frustrating blight has been spreading through the Leshy's Salon's plants, and the leshies need help stopping it. Identifying the blight and treating the affliction requires careful examination, pruning, weeding, and rotation of tainted soil for fresh soil. The PCs accumulate Victory Points by spending 8 hours and then attempting checks to make progress.",
    influence: [
      { key: "vp-blight", label: "Victory Points — Tea Farm Infestation", max: 10, note: "Each check is 8 hours.", reveal: "The blight is scoured from the Leshy's Salon." }
    ],
    beats: [
      { key: "blight-scoured", label: "Blight scoured from the Leshy's Salon (10 Victory Points)", xp: 20, note: "The gratitude earned at the Leshy's Salon will aid the party in supplying tea when running the Cerulean Teahouse business (detailed in the next act)." }
    ]
  }
];

/* ---------------------------------------------------------------------
 * CH3_CURSE — the three investigations.
 *   1. The Missing Governor  (hook, Ghosts in the Grass, Songs at Canary Inn)
 *   2. The Mists             (Following the Border, Great Willow chain,
 *                             Into the Infestation, Returning to Great Willow)
 *   3. The Last Kodama / Searching for Ugly Cute
 * --------------------------------------------------------------------- */
const CH3_CURSE = [
  {
    key: "ch3-elders-request",
    name: "The Elders' Request (Lady of Souls)",
    when: "A few days after the PCs return from their failed attempt to reach Karahai",
    tone: "plum",
    text: "Both town elders — Granny Hu and Old Matsuki — ask the PCs to meet them at the Lady of Souls, the local temple of Pharasma. The elders set aside personal grievances to thank the PCs and request they continue their work to determine what caused the town to become cursed. The monstrous invasion was an aspect of the curse but seems largely solved by lighting the Eternal Lantern. Three other mysteries remain: (1) the vanishing of Governor Heh and his estate, (2) the strange mists that surround the hinterlands and prevent travel, and (3) the disappearance of the stone spider Ugly Cute. The order in which the PCs tackle them is irrelevant, though the governor's disappearance seems most pressing — if Governor Heh can be found, perhaps he'll know what's going on. Each mystery is presented as its own set of encounters.",
    phases: [
      "Investigation 1 — The Missing Governor: How it Feels to Lose it All → Ghosts in the Grass (Low 2) → Songs at Canary Inn (Moderate 2).",
      "Investigation 2 — The Mists: Following the Border → Visiting Great Willow (Severe 2) → The Last Kodama (context) → Talking with Great Willow → Into the Infestation (Moderate 2) → Returning to Great Willow.",
      "Investigation 3 — Searching for Ugly Cute: Consulting Silvermist → Searching the Hinterlands → A Timely Intervention → Rescuing Ugly Cute (Moderate 2) → Speaking with Ugly Cute."
    ]
  },

  /* ---------------- Investigation 1: The Missing Governor ---------------- */
  {
    key: "ch3-gov-hook",
    name: "How it Feels to Lose it All",
    when: "The Missing Governor · Step 1 — background & hook",
    tone: "plum",
    quote: "All those who serve Lung Wa will soon know how it feels to lose it all!",
    text: "No obvious starting points exist for the search; examinations of the plot where the manor stood lead nowhere — nothing even indicates a building once stood there, supporting the theory that a powerful supernatural force snatched the manor away. Both elders conclude some supernatural force with a grudge against the governor must be involved, but know of no one in town with the right combination of power and motivation — until they recall an event from near the end of the previous year when Governor Heh had some fugitives arrested. Three years ago, in the winter of 7105: Governor Heh received a missive from Sze to be on the lookout for \"dangerous fugitives\" said to have attempted to curse the imperial family. When one fugitive — a singer named Fan Hongrui — showed up in Willowshore claiming to be searching for aid with a friend's snakebite, the governor attempted to arrest her. Hongrui used magic to distract and injure his guards, then fled; the governor led pursuit to Canary Inn, a roadside shelter northeast of Willowshore, where a tense standoff ended in a fire. Officially the fire was triggered by the fugitive, but more than a few claim the governor and his guards started the blaze to force the fugitive and her allies out. None contest Hongrui's final words as the building burned. At the time it seemed a dying oath; in hindsight, with Lung Wa collapsing within a year, the PCs' patron wonders if there was more magic to the oath than suspected. The bodies of Hongrui's two accomplices were recovered and buried near the ruined building; her remains were never found. The elders admit the connection seems tenuous but it's the best theory; they ask the PCs to travel to Canary Inn to investigate the site, if only to confirm the story is coincidental.",
    note: "Route: the primary road connecting Canary Inn to Willowshore is interrupted just east of Gourd Lake by the mindscape's edge, so the elders suggest following the road north along the east bank of the Duyue River, then one of the old hunter's trails further east. If Canary Inn lies beyond the edge of the 'curse,' the elders note, their theory linking the fire to the governor's disappearance is false."
  },
  {
    key: "ch3-gov-grass",
    name: "Ghosts in the Grass",
    when: "The Missing Governor · Step 2 — en route to Canary Inn",
    tone: "plum",
    level: "Low 2",
    creatures: "Thatchlings (3)",
    checks: [
      "DC 14 Religion — Recall Knowledge about thatchlings (critical success: thatchlings are vulnerable to fire, and their presence suggests a red-hooded thatchling — an undead capable of creating thatchling spawn — is in the region)"
    ],
    text: "The exact circumstances of Hongrui's death twisted her into an undead creature — a red-hooded thatchling. Since even before the mindscape's formation she has been converting the souls of those unable to reincarnate into the thatchlings that increasingly haunt the forests of the hinterlands (the PCs may already have encountered some). Regardless of the route taken to Canary Inn, the PCs encounter a group of thatchlings in an area where a wide spot in the road or a forest clearing allows tall grass to grow. As the PCs pass through, strange giggling — or a single whispered cry of \"help me\" that sounds more like a threat than a call for aid — becomes apparent over the wind or soft rainfall. Whether or not the PCs investigate, the three thatchlings hiding in the grass scurry out to attack, fighting until destroyed. Afterward, allow Recall Knowledge about thatchlings: though newly introduced this act, rumors and stories of thatchlings are part of local folklore in Shenmen.",
    note: "Standard combat XP (Low 2); see Songs at Canary Inn for the full reward for resolving the line."
  },
  {
    key: "ch3-gov-inn",
    name: "Songs at Canary Inn",
    when: "The Missing Governor · Step 3 — the ruins of Canary Inn (area D4)",
    tone: "plum",
    level: "Moderate 2",
    creatures: "Fan Hongrui (red-hooded thatchling, 1) · Thatchlings (2)",
    boxed: "The forest road comes to a junction here, just north of which sit several partially burned single-bedroom structures. These half-dozen bungalows once comprised the Canary Inn, but today most of the buildings are burned to rubble, although the surrounding woodland has recovered from the fire. The northernmost structure seems mostly intact.\n\nThree figures sit in the clearing just south of that structure. Two of the figures wear long gray hooded cloaks and sit facing away, their attention rapt on the third figure who stands before them—a young child wearing a red-hooded cloak whose song about butterflies and dreams floats along on a melody that feels much more maudlin and downbeat than its whimsical topic would suggest.",
    checks: [
      "DC 22 Perception — see through Hongrui's magical disguise and realize the child is a blood-soaked, mobile effigy of dried grass held together by wisps of ghostly ectoplasm",
      "DC 17 Performance — perform for Hongrui (results as below)",
      "DC 16 Perception — Search for irregularities in the charred soil revealing the shallow graves",
      "DC 14 Religion — Recall Knowledge on thatchlings (see Ghosts in the Grass)"
    ],
    text: "As the PCs approach the ruins they hear a sweet voice singing a song about butterflies and dreams, growing clearer as they get closer. The red-hooded child is Hongrui, who has disguised her thatchling reality with an illusory disguise spell; the other two figures are regular thatchlings who, in life, were Hongrui's traveling companions Chi Hongxin and Nanzhe Hongban. Viewed from behind they appear as Small cloaked humanoids; from the front (or once they react) their true supernatural nature is unmistakable. The thatchlings don't attack on sight — Hongrui stops her song and regards the party silently while the other two scramble to stand at either side, ready to defend her. Hongrui is curious why the PCs are here. If any PC carries a musical instrument or is otherwise obviously a performer, she points to that character and asks, in a forlorn voice, \"Are you here to entertain us? It's been so long since we've had others to perform for us.\" A performing PC must attempt a Performance check.",
    outcomes: [
      "Critical Success — the performance soothes the thatchlings' anger and reminds them of the beauty of life without jealousy or loss; Hongrui's illusion fades, she thanks the performer for the beautiful gift, and asks why the PCs have come; she allows each PC to ask her one question, answered to the best of her ability.",
      "Success — her anger is somewhat soothed; she keeps her illusion but still asks why they've come and allows the party one question.",
      "Failure — the performance fails to impress; her expression darkens, she warns the party they shouldn't be here and should leave at once; if they don't comply immediately, the thatchlings attack.",
      "Critical Failure — the thatchlings begin giggling in mockery before breaking into a Howl of Vengeful Fury; the thatchlings fight until destroyed but don't pursue fleeing PCs further than a half mile from the ruins."
    ],
    quote: "Are you here to entertain us? It's been so long since we've had others to perform for us.",
    qa: [
      ["Hongrui, on those in power", "Those in power will always abuse or abandon their responsibility, given time—be grateful your governor chose to leave you rather than inflict upon your town something worse."],
      ["Hongrui, on the governor", "A lapdog of Lung Wa and an enemy to the individual."]
    ],
    treasure: "Hongrui's Gratitude (unique magic item) — a red cloak that once belonged to Hongrui, found in the shallow graves of the two rebels (Chi Hongxin and Nanzhe Hongban), whose bodies were given unceremonious shallow burials in the courtyard where the three thatchlings were first seen. A PC who Searches and succeeds at the DC 16 Perception check notices irregularities in the charred soil; exhuming reveals two skeletons — if the PCs see that these two bodies receive proper burials, the three thatchlings don't rejuvenate during this mindscape cycle. If Hongrui offers the cloak as thanks (a PC who critically succeeded at the Performance check feels the urge to exhume the grave and claim it when the thatchlings fade), it functions as Hongrui's Gratitude. If claimed without her gratitude, it becomes cursed: it suddenly increases to 5 Bulk if worn for longer than 1 minute, at which point it fuses with the PC (cursed items: Pathfinder GM Core 306). The curse can be lifted normally but also fades as soon as the two skeletons are given a proper, respectful burial, whereupon the cloak becomes Hongrui's Gratitude.",
    beats: [
      { key: "inn-rest", label: "Brought rest to the three thatchlings (40 XP in addition to combat XP)", xp: 40, rep: 1, note: "Thatchlings are no longer encountered in the Willowshore mindscape; any random encounter resulting in a thatchling is treated as no encounter. The region feels slightly less haunted, improving townsfolk morale. This line of investigation ends at a dead end — the elder encourages pursuing the other two leads." }
    ]
  },

  /* ---------------- Investigation 2: The Mists ---------------- */
  {
    key: "ch3-mists-follow",
    name: "Following the Border",
    when: "The Mists · Step 1 — mapping the curse's edge (optional)",
    tone: "moss",
    text: "The misty border doesn't manifest until one physically crosses it: the traveler spends a few moments confused and disoriented, only to step back into the mindscape at the point they crossed. With no visual cue, mapping the borders by exploring is repetitive and complicated. Once a PC reaches a hex through which the border runs, they can map the border's path through that hex by spending 4 hours Searching that hex via exhaustive exploration and backtracking to interact with the border over and over. A PC can map the border of two adjacent hexes in a day's work before becoming Fatigued.",
    note: "No DC is given — 4 hours of Searching per hex maps the border's path through that hex. The Wall of Ghosts is an additional border along the mindscape's western side and is a very physical, visual barrier (see the Wall of Ghosts entry). Mapping is slower than consulting Great Willow."
  },
  {
    key: "ch3-mists-gw-visit",
    name: "Visiting Great Willow",
    when: "The Mists · Step 2 — the hilltop overlooking town (area W37)",
    tone: "moss",
    level: "Severe 2",
    creatures: "Great Willow (1) — a kodama kami, Creature 5 (Small kami/spirit/wood)",
    boxed: "The forest thins around the hilltop, leaving an eighty-foot-diameter clearing at its summit. Atop the hill in the center of the clearing grows the Great Willow—the only willow tree present in much of the forest. Looming at a height of nearly ninety feet, the Great Willow is also quite large for its kind. Yet the reason the Great Willow has held such a place of reverence in Willowshore's history has more to do with the spirit said to dwell within it. At least a few years have passed since anyone has visited the Great Willow, but even from the clearing's edge, it's apparent that something seems amiss with the tree, for some sort of gray fungal growth has seemingly infested its lower roots.",
    checks: [
      "DC 16 Nature — Recall Knowledge: wine or sake is an appropriate offering (or DC 14 Willowshore Lore — same; critical success reveals that a custom-made, hand-crafted twisted rope — a shimenawa — is an even better offering)",
      "DC 16 Crafting — craft the shimenawa (3 gp of materials, 1-hour activity; a critical failure ruins the materials — they can't be reused on another attempt)",
      "DC 24 Diplomacy — Make an Impression on Great Willow (starting attitude unfriendly; −10 DC if an offering is revealed, i.e. DC 14; +1 degree of success if the offering is a handmade shimenawa; −2 DC each return visit; +2 DC if the PCs fled and returned later)"
    ],
    text: "Willowshore's Great Willow sits atop a hill overlooking town — a visible landmark and source of local pride, said to be the first place Master Zhi Hui visited on her search for the Tan Sugi. No road or trail has ever been laid to the summit; everyone knows a kami who calls themself Great Willow dwells within the tree and watches over the town, but few feel it wise to disturb the spirit. Visits are rare, only when the town needs advice from the spirit world. The elders suggest the PCs organize an offering from the townspeople to bring to the tree to curry the spirit's favor; at minimum an offering should make conversing easier. Wine/sake can be purchased in town; a shimenawa is best crafted by one of the PCs themselves (the kodama will likely be insulted if a gift is delivered by hands that didn't craft it). The trip is about a 1-mile walk through relatively light forest, but the steep slope makes it difficult terrain; a party moving at 25 feet makes the trip in about 20 minutes. As the PCs enter the clearing, Great Willow emerges from the tree in a defensive pose among its roots, fists upraised, calling out a challenge and demanding the PCs explain why they dare approach. PCs who come within 30 feet of the tree and its kodama are in range of Great Willow's Distracting Gaze. If Great Willow remains unfriendly, they demand the PCs leave at once and \"come back tomorrow\" — and if the PCs return, they must bring a brand-new offering; each time they return the DC to Make an Impression is reduced by 2. If Great Willow becomes hostile, they shriek in rage, accuse the PCs of being \"the source of the curse,\" and attack; they aim to frighten rather than kill, break off combat if the PCs call for a truce, don't pursue beyond the clearing's edge, and retreat to merge with the tree if reduced to fewer than 30 Hit Points. If the PCs flee and return later, the DC to Make an Impression increases by 2. If made indifferent or friendly, Great Willow calms down and agrees to speak (see Talking with Great Willow). Important: Great Willow can't be made friendly until the PCs solve the fungus infestation situation down south (see Into the Infestation).",
    quote: "Come back tomorrow.",
    treasure: "Willow's Parting Gift — if the PCs made Great Willow friendly, the grateful kodama gives them a parting gift when they prepare to leave: a lesser twisting twine made of supernaturally supple woven willow branches.",
    beats: [
      { key: "gw-friendly", label: "Great Willow made friendly", note: "Unlocks Talking with Great Willow. Cannot be made friendly until the fungal infestation to the south is solved (Into the Infestation). Hostile/fleeing outcomes lock out cooperation until the infestation is solved." }
    ]
  },
  {
    key: "ch3-mists-last-kodama",
    name: "The Last Kodama (Context)",
    when: "The Mists · Context — what Great Willow doesn't yet realize",
    tone: "plum",
    text: "What Great Willow doesn't yet realize (but will, as in every mindscape cycle before) is that they're the only kodama present in the region. As a side effect of their proximity to Governor Heh's ritual, they perished along with Willowshore's citizens and are now trapped here as well. Great Willow's other kodama friends throughout the region have gone on in the real world, leaving Great Willow alone (each of them mourning Great Willow's disappearance as well). If the PCs succeed at restoring the people of Willowshore to the modern age at the beginning of Act 4, Great Willow will be restored too; until then the kodama grows more withdrawn and depressed as the Adventure Path progresses."
  },
  {
    key: "ch3-mists-gw-talk",
    name: "Talking with Great Willow",
    when: "The Mists · Step 3 — once cooperation is secured",
    tone: "moss",
    checks: [
      "DC 18 Nature — Recall Knowledge to share helpful techniques with Great Willow for fighting the fungal infestation (granted regardless — with or without it the infestation is removed, but the PCs are rewarded for the aid)"
    ],
    text: "Once cooperation is secured, Great Willow relaxes and agrees to talk. They speak in a tiny, almost childlike voice, slowly and methodically, as if taking care with word selection; their mind has grown increasingly fractured with each repetition of the year (even though they don't understand or remember why), and speaking requires deliberate concentration. Every first day of summer, when the mindscape's yearly cycle resets, Great Willow senses the change but is at a loss as to its cause; every year they use nature's pathway to travel from their willow-tree ward to a willow grove nearly 5 miles south of Willowshore to check on the kami of that grove — a kami who, unlike Great Willow, wasn't pulled into the mindscape. This year Kugaptee's influence allowed an infestation of hostile fungi to bloom in that grove; Great Willow found the place infested with no sign of the kodama (those kodama avoided being drawn in — see The Last Kodama), and, having used their only casting of nature's pathway for the day, was forced to trek home on foot — in so doing, tracking invasive fungal spores back with them. Without the PCs' aid Great Willow still removes the infestation by the time the PCs return, but they're grateful for the suggestion.",
    quote: "You will go to save her from the angry mushroom, and then I will help.",
    qa: [
      ["About the fungus on your roots?", "An infection I brought back from a visit to check on a friend to the south. I am fighting it back, but I fear for my friend."],
      ["About the misty border?", "Yes. I sense it too. It is a curse. A powerful one. I can feel its edges all around. We are in a cage now. When it happened on the first day of summer, I was confused. I was alone. I could not hear my friends' voices. I jumped to visit my closest friend and they were not there, but a foul-tempered mushroom was, and I had to run away all the way back to here. Alone. I don't know what to do. I dare not leave this tree again when this curse is all around, but I can look for its edges from here. I will tell you more, but before I do, I need to know my friend is safe."]
    ],
    beats: [
      { key: "gw-aid", label: "Shared techniques with Great Willow for fighting the fungal infestation", xp: 20, note: "Assigns the Into the Infestation quest: save Great Willow's friend from the 'angry mushroom.'" }
    ]
  },
  {
    key: "ch3-mists-infestation",
    name: "Into the Infestation",
    when: "The Mists · Step 4 — the infested grove (area D7)",
    tone: "plum",
    level: "Moderate 2",
    creatures: "Xungu (myceloid, 1)",
    boxed: "The creek-side road diminishes to a trail here as it approaches the once-idyllic grove of willow trees, but today, the foliage has become overgrown with sheets of gray and pale yellow fungi. More colorful spotted mushrooms or warty toadstools grow where underbrush once did.",
    text: "The infested willow grove lies on the western bank of Dragonfly Creek, south of Willowshore (area D7). The fungus covering the grove is largely harmless to people — with one significant exception. This encounter takes place in an open but fungus-infested clearing in a forest. When this mindscape cycle began, Kugaptee's influence clung to the positive emotions of this place (once a spot for locals to enjoy nature and romance) like a parasite, producing an influx of dangerous fungi. Most manifested as slime molds that slithered into the surrounding hinterlands (wandering monsters), but one remains: a myceloid named Xungu — a direct physical result of Kugaptee's influence who remembers \"ruling\" this grove for decades but didn't exist before this cycle began. Xungu patrols the perimeter looking for meat to prepare for meals. Xungu speaks Common (rather than Sakvroth) as a manifestation of Kugaptee's thoughts, and on spotting the PCs recounts a pitiful, unknowingly false tale: chased out of their underground colony; the kodama who dwelled here welcomed them but then all vanished; now Xungu is all alone. Xungu asks one of the PCs to stay overnight and share a meal so they won't be lonely, explaining they have \"secrets\" to share but are bashful about sharing with too many people at once. All of these claims are falsehoods, and Xungu isn't a particularly skilled liar — even if the story succeeds against every PC's Perception DC, the players should still make their own decisions. If the party agrees, once Xungu and the PC are alone, Xungu reveals the \"secret\": they're really hungry and the meal will be Xungu eating the PC — the myceloid attacks at once, hoping to overpower the lone PC. Called out as a liar, Xungu huffs in frustration and attacks, intending to capture and eat the entire party. When attacking, Xungu tries to capture PCs, hoping to draw things out long enough for PCs to perish from purple pox (poxy meat is tastier) — this gives the party time to rescue a captured PC, or (if the whole party gets caught) for NPCs to come rescue them instead. Xungu fights to the death and pursues fleeing PCs for only a few rounds before returning to the infested grove.",
    quote: "Well, I suppose I'll have to settle for a banquet instead of a snack!",
    note: "Xungu attempts a +0 Deception check to Lie when telling its story (opposed by the PCs' Perception DCs); any further skill checks at GM discretion (e.g., identifying the myceloid / Recall Knowledge). No XP is stated for this combat beyond standard encounter XP (source flag). With Xungu's death the fungus infestation immediately begins to recede — mushrooms and mold shrink, melt, and evaporate; after just an hour the grove is fully restored. A PC suffering from purple pox then treats all saving throws against the affliction caused by Xungu as automatic successes (afflicted PCs should still roll the save to determine if they achieve a critical success). Restoring the grove triggers Returning to Great Willow."
  },
  {
    key: "ch3-mists-gw-return",
    name: "Returning to Great Willow",
    when: "The Mists · Step 5 — after Xungu is defeated",
    tone: "moss",
    text: "Great Willow can sense when Xungu is defeated and receives the returning PCs much more pleasantly on their next visit; the kodama is now helpful. If any PCs suffer from purple pox caught from Xungu, Great Willow offers to help them recover (by attempting a Nature check to Treat Disease). The news that no kodama were present in the grove disappoints Great Willow, but the absence of bodies or evidence that the kodama were harmed gives them reason for hope. In return for the PCs' aid, Great Willow confirms the region surrounding Willowshore appears cursed. They sense no other kodama in the vicinity and, by the time the PCs return, have begun meditating on the curse's boundaries. They give a rough estimate of the size of the trapped region: about 10 to 16 miles or so in every direction from Willowshore. More importantly, Great Willow mentions that something even more potent seems to lie to the west — the kodama senses the Wall of Ghosts but isn't sure what it might be. None of these revelations defeat the \"curse,\" but they give the PCs an idea of the scope of the region they're trapped in. Great Willow confirms there seems to be no way to go beyond the mists, so goals of becoming more self-sufficient as a settlement should be prioritized. For the rest of Season of Ghosts, Great Willow remains helpful on subsequent visits — use the kodama to give the party advice on what to do next or provide clues to get things back on track.",
    note: "No DC is given — Great Willow attempts a Nature check to Treat Disease (purple pox recovery aid). Closes The Mists investigation with the region's size (~10–16 miles in every direction) and the hint of the Wall of Ghosts to the west."
  },

  /* ---------------- Investigation 3: Searching for Ugly Cute ---------------- */
  {
    key: "ch3-ugly-silvermist",
    name: "Consulting Silvermist",
    when: "The Last Kodama · Searching for Ugly Cute · Step 1 — the Silvermist Lodges (area W7)",
    tone: "gold",
    checks: [
      "DC 16 Hunting Lore — Recall Knowledge: Spider Gate is less a home and more a posting, so Ugly Cute wouldn't return there if fleeing to a lair (or DC 18 Nature — same)",
      "DC 16 Willowshore Lore — Recall Knowledge: Ugly Cute's materials were originally quarried from the Gorge of Fangs and Teeth to the south (area D10) (or DC 18 Society — same)"
    ],
    text: "The vanishing of Willowshore's guardian spirit — the stone spider affectionately called \"Ugly Cute,\" who stood vigil for years at the eastern edge of town — seems less urgent than the other mysteries, but tracking down Ugly Cute is the only mission of the three that gives the PCs a solid lead for reversing the \"curse.\" When the PCs first passed Ugly Cute's abandoned post, tracks suggested the spider got up and walked away toward the nearby river, after which that trail became impossible to follow. The town elder informs the PCs that trackers from the Silvermist Lodges have been looking for clues since the Eternal Lantern was lit, with no trace found. Meeting the lodges' hunters is a logical first step. Consider having Sumika be the hunter who meets them if the PCs rescued her earlier in the act; the answer is the same either way: attempts to track Ugly Cute have yielded no leads — the rainstorms and the time that passed while the hunters recovered from the monster invasion did them no favors. Even the old hunter's trick of \"returning to the quarry's home\" hasn't worked; despite several visits back to Spider Gate (area W33), no fresh clues have manifested. On a critical success, a PC has a flash of insight: Ugly Cute was \"born\" from locally quarried stone, so the creature's \"home\" would be akin to the source from which its components were originally harvested. If no PC gets this, Sumika (or another hunter) realizes it and contacts the PCs with a request for help after several days if the party hasn't made progress.",
    note: "Points the investigation toward the Gorge of Fangs and Teeth (D10)."
  },
  {
    key: "ch3-ugly-searching",
    name: "Searching the Hinterlands",
    when: "The Last Kodama · Searching for Ugly Cute · Step 2 — tracking the trail",
    tone: "moss",
    checks: [
      "DC 16 Flat Check — find signs of Ugly Cute's passage while Searching a hinterland hex south of Willowshore (4 hours of Searching per attempt)",
      "DC 3 Flat Check — same, in the Gorge of Fangs and Teeth (D10) or any hex bordering it",
      "DC 15 Survival — Track to discover signs of Ugly Cute's passage (only after the Flat Check succeeds)",
      "DC 16 Survival — Track Ugly Cute's trail once signs are found (anyone can attempt)"
    ],
    text: "The PCs could simply explore the hinterlands and Search for signs of Ugly Cute's passage. Attempts to find evidence east, north, or west of Willowshore automatically fail. Each time a PC spends 4 hours Searching a hex in the hinterlands south of Willowshore, attempt a Flat Check (or a much easier Flat Check if the PC is Searching in the Gorge of Fangs and Teeth or any bordering hex). On success, that PC can attempt a Survival check to Track to discover signs of Ugly Cute's passage. Once these signs are found, anyone can Track Ugly Cute's trail with a successful Survival check. With enough successes, the trail leads directly to area D10.",
    note: "Trail leads to D10 (Rescuing Ugly Cute)."
  },
  {
    key: "ch3-ugly-intervention",
    name: "A Timely Intervention",
    when: "The Last Kodama · Searching for Ugly Cute · Step 3 — rail-guard near the lumber camp / Wall of Ghosts",
    tone: "gold",
    text: "One way to automatically trigger discovery of Ugly Cute's trail: if the PCs begin to draw close to the old lumber camp (area D11) or the Wall of Ghosts while they aren't yet 3rd level. If the PCs come within a hex of D11, or are about to reach the Wall of Ghosts, they should automatically discover Ugly Cute's trail. They can Track this trail south to area D10; if they ignore it and continue toward the lumber camp, have Ugly Cute find them instead — the stone guardian begins the encounter by warning the PCs about the camp's denizens rather than closing with it, but otherwise play the meeting the same way as Rescuing Ugly Cute (without the need to rescue the stone spider from cruel living boulders). Use Ugly Cute to delay the PCs' arrival at the lumber camp (detailed in Chapter 4) before they're likely ready for the threats found therein.",
    note: "Rail-guard that funnels underleveled parties away from D11/the Wall of Ghosts and toward D10."
  },
  {
    key: "ch3-ugly-rescue",
    name: "Rescuing Ugly Cute",
    when: "The Last Kodama · Searching for Ugly Cute · Step 4 — the Gorge of Fangs and Teeth (area D10)",
    tone: "gold",
    level: "Moderate 2",
    creatures: "Living boulders (2)",
    checks: [
      "DC 10 Survival — Track Ugly Cute once the PCs are within 1 hex of area D10 (reduced from the normal DC 16 trail-tracking DC)"
    ],
    text: "After Ugly Cute woke into the mindscape and clashed with several noppera-bos, they chased the fleeing monsters south for a time before catching up to and destroying them. The stone spider was damaged in the fight and increasingly distraught over the strange new reality; rather than return to their post, Ugly Cute instinctively returned to the place where their stones were \"born\" — the Gorge of Fangs and Teeth — where they could draw on the stones of their creation to slowly repair their body. Since then Ugly Cute has been obsessed with the noppera-bos and the Wall of Ghosts, splitting time between thinking in the Gorge and patrolling the region south and west of town, searching for the source of the noppera-bos, whom they believe have something to do with the \"curse.\" Once the PCs approach within 1 hex of area D10, Tracking Ugly Cute becomes easier (the Survival DC drops); regardless of success, the PCs run into dangerous denizens of the region soon after entering the area. This encounter takes place in an open area of rocky ground. Kugaptee's association with destruction and decay clashed with the region's long traditions as a source of raw materials for sculptures and structures, manifesting several living boulders that rasp and scour through the gorge. The PCs encounter two of them soon after entering, finding them grinding and crawling over a strange mound of stones. These elementals have the same statistics as the standard living boulder but far greater intellect; they cannot speak but understand Aklo, and are smart enough to enjoy cruelty — they've had a delightful time tormenting and chasing Ugly Cute since the stone spider retreated here. As the PCs draw near, the boulders move to attack, revealing that the stones they'd been crawling upon are, in fact, Ugly Cute! For the duration of the encounter Ugly Cute remains battered and barely able to move, taken near to the point of destruction. If the PCs have trouble defeating the two elementals, the GM can have Ugly Cute step in to save the day, but it's best if the PCs are the heroes. The living boulders fight until destroyed, cracking open to release small clouds of red butterflies that swiftly fade into smoke on each death.",
    treasure: "Ugly Cute's Thanks & Apology — in thanks for the rescue and as an apology for abandoning the PCs to chase the faceless abductors, Ugly Cute gifts the PCs a piece of their stony carapace, which can help supply the PCs with tools to protect Willowshore.",
    beats: [
      { key: "ugly-rescued", label: "Rescued Ugly Cute — the stone spider resumes watch at Spider Gate", rep: 2, note: "Also grant XP as if they'd defeated them in combat (Moderate 2) — exact value per encounter norms; no number stated in the source. Unlocks Speaking with Ugly Cute." }
    ]
  },
  {
    key: "ch3-ugly-speaking",
    name: "Speaking with Ugly Cute",
    when: "The Last Kodama · Searching for Ugly Cute · Step 5 — after the elementals are defeated",
    tone: "gold",
    creatures: "Ugly Cute (1) — Creature 5, Large celestial holy incorporeal agender stone spider",
    text: "Once the elementals are defeated, Ugly Cute rises on eight legs — wobbly, bearing plenty of chips and cracks, with 5 Hit Points remaining — but very much alive. The stone spider is thankful and intends to remain in the gorge until recovered (the stone spider's immunity to healing doesn't apply to healing gained from rest in this location), but is eager to learn how things fare in Willowshore. Ugly Cute knows the PCs all by name and is delighted they've taken up the mantle of protectors. During conversation Ugly Cute is a chipper guardian spirit starving for a proper chat. Like the PCs, Ugly Cute doesn't realize they died in the real world; even though their death occurred (from the PCs' perspective) 115 years in the future, Ugly Cute believes those 115 years were more like a dream or vision than actual experience — and should give the PCs no clues or insights into this passage of time (the revelation comes in a future act). Convey the following points, either as comments or as answers to questions: (1) Ugly Cute confronted a group of faceless monsters tormenting people in Willowshore's outskirts, attacked and pursued them, but ended up lost and wounded and had to return here to recover; they apologize for abandoning the town and express relief and delight that the PCs are protecting Willowshore. (2) Ugly Cute claims to have had visions of an abandoned Willowshore left to crumble into ruins reclaimed by the forest after some sort of monstrous invasion — and it was this vision that allowed it to awaken and come to the PCs' aid at the start of the adventure. (3) Ugly Cute doesn't think the Reenactment Festival was the source of the curse, but whatever caused the curse did take place during the height of the ceremony itself. (4) The mists surrounding Willowshore are the beginning of the town's doom, a curse brought upon the region by an unknown force — one Ugly Cute senses is tied to the faceless monsters they confronted. Those faceless monsters have claimed an old lumber camp to the west of town, near the Ceiba River's source; perhaps clues about the curse can be found there. Further west, Ugly Cute senses a stronger source of evil but cannot observe it themselves, as it lies beyond the range they can travel from Willowshore. After the conversation, Ugly Cute intends to return to their post at Spider Gate on Willowshore's eastern edge, settling in to watch and observe, leaving active defense to the PCs; if Ugly Cute has any revelations during their introspective guardianship, they'll waken again to alert the party.",
    note: "Solid lead for reversing the curse: faceless monsters at the lumber camp near the Ceiba River's source (Chapter 4); hint of a stronger evil further west."
  }
];



/* ============================================================================
   CHAPTER 4 — The Wall of Ghosts (Act 1.4)
   Card data: The Lumber Camp (E1-E17, factions, Mugirou) + The Ritual Site
   Source: /home/rmorrison/Documents/Seasonofghosts/act1macromaterial/digests/ch4.md
   Party level 3 · The act's dungeon. Factions: the Prayers (Zoudou — sacrifice
   captives to open the Wall) vs the Rovers (Mugirou — attack Willowshore).
   Encounter XP follows the ch2 convention: standard awards (Trivial 10, Low 15,
   Moderate 20, Severe 30) where the digest prints no number.
   ============================================================================ */

/* --------------------------------------------------------------- lumber camp */
const CH4_CAMP = [
  {
    key: "ch4-hook",
    name: "The Lumber Camp",
    when: "Once Willowshore has a new leader",
    tone: "ember",
    text: "The noppera-bos escalate by repeating the event that started the Adventure Path: they sneak into Willowshore and abduct a fresh batch of victims — the Prayers' need for more sacrifices to Kugaptee pushes them to this desperate move. News of the abduction galvanizes the PCs: many locals in southwest Willowshore confirm that a \"group of masked bandits just raided Willowshore Stables and marched everyone there off to the west!\" If Ugly Cute (the stone spider) was rescued in Chapter 3, she can already warn the PCs about the monsters occupying the abandoned lumber camp; the party might also stumble across it while exploring the hinterlands.",
    beats: [
      { key: "ch4-hook-abduction", label: "Abduction at Willowshore Stables", note: "The camp's inhabitants are faceless noppera-bos split into two factions, each influenced by beliefs imprinted by Kugaptee: the Prayers (led by zealot Zoudou — sacrificing captives to open the Wall of Ghosts and reveal the 'paradise' beyond) and the Rovers (led by scoutmaster Mugirou — who want to cause pain and suffering so the wall expands and brings paradise to them). Neither method will actually work, but the lack of progress pushes the Prayers to more sacrifices while the Rovers grow impatient for a glorious attack on Willowshore." }
    ]
  },
  {
    key: "ch4-advance-knowledge",
    name: "Advance Knowledge",
    tone: "muted",
    text: "The camp hasn't been occupied for two years, but its location and basic layout are known to many locals. On a success the PCs secure enough of a description to create a map of the site: there are two entrances to the main camp, though entering through one of them might be too obvious. On a critical success they also learn about a secret door in the stockade wall (area E6) that woodworkers once used to sneak out and enjoy the nicer guard outhouse.",
    checks: [
      "DC 15 Willowshore Lore — Recall Knowledge about the lumber camp",
      "DC 18 Society — Recall Knowledge about the lumber camp",
      "DC 16 Diplomacy — ask around town (after Gathering Information for 2 hours)"
    ],
    beats: [
      { key: "ch4-adv-map", label: "Map of the camp secured", note: "Success on any check — the party knows both entrances and the general layout." },
      { key: "ch4-adv-secret", label: "Secret door in the stockade wall (E6) revealed", note: "Critical success on any check — the party learns the woodworkers' old escape route." }
    ]
  },
  {
    key: "ch4-merchant-returns",
    name: "The Merchant Returns",
    when: "Before the PCs first set out for the lumber camp",
    tone: "gold",
    quote: "\"How do you intend to approach these enemies who invade your town and take your people? Do you intend to bring furious ruin to them in battle, or do you think you can fool them into believing that you are one of them to effect a rescue without resorting to violence?\"",
    text: "The strange merchant Shinzo pays one more visit to Willowshore — perhaps meeting the PCs on the road as they leave town. He is delighted to have caught them, warns of strange monsters masquerading as \"bandits\" in the region to the west, and — upon hearing about the abduction — doesn't seem surprised. His leading question is meant to suggest a tactical option (impersonating the enemy) that might not occur to some parties.",
    treasure: "Shinzo's gift — mutually exclusive, he nods sagely at whatever the party answers: a cape of justice (if the answer leans toward revenge or enacting justice) OR a noppera-bo hood (if the answer leans toward subtlety). Whichever item he doesn't gift remains available for purchase.",
    beats: [
      { key: "ch4-merchant-revenge", label: "Answer: revenge or justice — cape of justice", note: "Shinzo gifts a cape of justice and warns the party not to stray from their path. Tick exactly one." },
      { key: "ch4-merchant-subtlety", label: "Answer: subtlety — noppera-bo hood", note: "Shinzo gifts a noppera-bo hood and compliments their bravery. Tick exactly one. The hood is a ready-made prop for impersonating the enemy." }
    ]
  },
  {
    key: "ch4-camp-features",
    name: "Lumber Camp Features",
    tone: "muted",
    text: "The camp sits just over 8 miles west of Willowshore, at the end of a poorly maintained road that follows the northern bank of the Ceiba River. A 15-foot-tall log fence of sharpened stakes surrounds the heart of the camp (impossible to stand atop); buildings within are 10 feet tall unless stated otherwise, and the camp exclusively uses wooden swivel doors instead of sliding doors. Regardless of time of day, the sound of rowdy celebration comes from within, with smoke and the smell of roasting meat; cackling and taunting come from the island to the west (E5), while periodic cheers and curses with the sound of a crossbow firing come from the dormitory to the east (E4). Bickering noppera-bos stay at their posts — they watch, call taunts, and take note of fights in nearby areas, but won't rush to join a battle for fear of greater punishments.",
    note: "First approach recon options: E2 (guard tower unattended on the first visit), E6 (secret door), or E17 (Long Jump over the fence from the log piles).",
    checks: [
      "DC 20 Athletics — Climb/scale the 15-foot log fence (digest's sentence is truncated, presumably for climbing the walls)"
    ]
  },
  {
    id: "E1", key: "ch4-e1", name: "E1. Entrance", level: "Trivial 3", tone: "muted",
    creatures: "Noppera-bo Tricksters (2, disguised as Human Guards) · Jerky (feral guard dog)",
    boxed: "These heavy double doors are shut tight. A single iron-framed wicket is set in the right door.",
    text: "The doors (and the northern doors opposite) are barred with a log on the inside; removing it takes three Interact actions, or the doors can be Force Opened. Two noppera-bo tricksters, each disguised as a human, stand here, frustrated over being excluded from the party — they've spent hours debating whether the outhouses inside are haunted. Allied with the Prayers, they want little to do with the \"slackers\" in area E4. The disguise effect can also disguise any other creatures as Human Guards (uncheck \"Noppera-Bo Disguised\" on the actor to drop it). When the gate needs opening, they telepathically contact the grunts in E10. Jerky — the lumber camp's guard dog, living feral since the woodworkers fled two years ago — has adopted the noppera-bos as his owners but still prefers the company of actual humans. Any questions about the abduction alert these noppera-bos that the PCs aren't who the tricksters think they are and quickly result in a fight.",
    checks: [
      "DC 14 Nature — Command an Animal to make Jerky realize his \"masters\" are monsters in disguise",
      "DC 30 Athletics — Force Open the barred heavy double doors",
      "3 Interact actions — remove the barring log from the inside"
    ],
    influence: [
      { key: "ch4-e1-disguise", label: "Pass as Human Guards", max: 1, note: "The tricksters are disguised humans; disguised PCs can bluff through the gate.", reveal: "Any question about the abduction gives it away — the tricksters attack (they fight until one drops below 5 HP, then both flee into the woods)." }
    ],
    beats: [
      { key: "ch4-e1-jerky", label: "Win over Jerky", note: "Nature success — Jerky becomes indifferent and stands aside, refusing the noppera-bos' orders. Critical success — he turns on the noppera-bos and attacks them, then accompanies the PCs as long as they treat him well." },
      { key: "ch4-e1-combat", label: "Defeat the gate tricksters",  note: "They call out as human guards, roll initiative with Deception, and start the fight by Removing their Faces. Trivial 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    id: "E2", key: "ch4-e2", name: "E2. Guard Tower", tone: "muted",
    creatures: "Noppera-bo Grunts (2)",
    when: "First visit: unattended · Subsequent visits: 2 grunts stationed",
    boxed: "This simple wooden guard tower supports a single open-air platform, some fifteen feet off the ground. A ladder leaning against the west side provides access to the platform above.",
    text: "On the first visit the grunts usually posted here are slacking off in the guard dormitory (area E4), leaving the tower conveniently unattended; on subsequent visits a pair of noppera-bo grunts are stationed here. The digest gives no encounter level for this post (the two grunts are Creature 1 each)."
  },
  {
    id: "E3", key: "ch4-e3", name: "E3. Ox Stables", tone: "gold",
    boxed: "The stables are conspicuously empty. Old hay lies scattered across the floor and crunches underfoot. A sweet smell drifts from the rotting feed in the hay boxes.",
    text: "The stables stood empty after the camp was abandoned, but the noppera-bos recently used them to cage deer and wild oxen they caught — which they are now eating in their celebration inside the camp.",
    treasure: "A bottle of lesser bravo's brew, hidden in one of the hay boxes."
  },
  {
    id: "E4", key: "ch4-e4", name: "E4. Guard Dormitory", level: "Low 3", tone: "muted",
    creatures: "Noppera-bo Grunts (4)",
    boxed: "Blood splatters and weapon marks cover this dormitory's walls. Pools of dried blood stain the floor and bedding of the bunk beds. On the southeastern wall, several humanoid silhouettes have been painted using blood.",
    text: "Four grunts are inside: three in a shooting contest with a hand crossbow they found, the last cleaning up as punishment. Deep in their game, they are initially indifferent to the PCs — they don't expect intruders and assume the party are tricksters with newly stolen faces; as long as the PCs do nothing to suggest otherwise, they continue to be ignored. These slackers are Rovers; as soon as they realize the PCs are intruders they fight to the death, believing the PCs might threaten Mugirou's safety.",
    treasure: "A vial of oil of potency on a shelf next to the eastern door.",
    influence: [
      { key: "ch4-e4-impersonate", label: "Pass as noppera-bo tricksters", max: 1, note: "The grunts assume disguised allies; keep up the act to be ignored.", reveal: "Any slip — they fight to the death." }
    ],
    beats: [
      { key: "ch4-e4-combat", label: "Defeat the dormitory grunts",  note: "Low 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    id: "E5", key: "ch4-e5", name: "E5. Loading Island", level: "Low 3", tone: "moss",
    creatures: "Noppera-bo Grunts (4) · Injured Kappa (5 HP)",
    boxed: "Across a sagging wooden bridge is a small island where logs are unloaded into the water for storage or transport.",
    text: "Four grunts (Prayers) have captured a frightened, injured kappa and are passing time bullying it, playing at \"heroic adventurers\" taking out a \"monstrous threat.\" As with the guards nearby, they likely mistake the PCs for disguised noppera-bo tricksters. On a failed Request or Coerce they grow suspicious and ask whether the PCs stand with Zoudou or Mugirou: claiming Mugirou → they shriek in anger and attack, eager to \"earn respect\"; claiming Zoudou → the PCs must Lie, and on success the grunts offer their captured kappa to be sacrificed to the Wall of Ghosts but sheepishly ask to come watch — if the deception holds, the party can be escorted into the camp proper. The kappa's head bowl is empty; it begs for mercy and may recognize the PCs — it was one of the kappa from the Chapter 2 baths or Chapter 3 Gourd Lake.",
    checks: [
      "Request or Coerce — influence the grunts' behavior (no DC given in source; failure triggers the faction question)",
      "Lie — to pass as a Zoudou follower after the faction question (no DC given in source)",
      "DC 20 Perception — Search the muddy water near the southern end of the western floating logs"
    ],
    treasure: "+1 battle axe — a treasure forgotten by a woodcutter, found with a successful DC 20 Perception search of the muddy water near the southern end of the western floating logs; if the PCs rescued the kappa, it points out the location before fleeing.",
    influence: [
      { key: "ch4-e5-impersonate", label: "Pass as a Zoudou follower", max: 1, note: "Answer the faction question with Zoudou and succeed at a Lie.", reveal: "Claiming Mugirou — or failing the Lie — makes them attack, eager to 'earn respect.'" }
    ],
    beats: [
      { key: "ch4-e5-claim-mugirou", label: "Claim allegiance to Mugirou", note: "The grunts shriek in anger and attack. Tick exactly one." },
      { key: "ch4-e5-claim-zoudou", label: "Claim allegiance to Zoudou (Lie)", note: "On a successful Lie they offer the kappa for sacrifice and ask to watch — the party may be escorted into the camp proper. Tick exactly one." },
      { key: "ch4-e5-rescue-kappa", label: "Rescue the injured kappa", note: "It remains nearby for a short time, aware of the friction between Zoudou (zealots) and Mugirou (warmongers) but knowing little else — and it points out the hidden +1 battle axe." },
      { key: "ch4-e5-combat", label: "Defeat the island grunts",  note: "Low 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    id: "E6", key: "ch4-e6", name: "E6. Secret Door", tone: "muted",
    text: "A secret door built into the fence here — the route woodworkers once used to sneak out and enjoy the nicer guard outhouse. A quiet way into the camp for parties who learned of it (see Advance Knowledge).",
    checks: [
      "DC 18 Perception — Search to find the secret door",
      "DC 8 Perception — locate the door if the PCs already know of its existence (Advance Knowledge critical success)"
    ]
  },
  {
    id: "E7", key: "ch4-e7", name: "E7. Courtyard", level: "Moderate 3", tone: "ember",
    creatures: "Noppera-bo Grunts (6) · Giant Rats (2)",
    boxed: "A roaring campfire built from furniture scraps and lengths of timber roars in the middle of this open courtyard. A dome-shaped cage made of branches and thin wooden slats stands just to the south of the fire.",
    text: "The sounds of revelry and the scent of cooking meat come from here: a half-dozen grunts loyal to the Rovers cook strips of beef over the fire while betting on a fight they've staged in the wooden cage between two giant rats. If the cage is broken, one rat escapes at once and the other in 1d4 rounds; if the cage is destroyed, both escape — escaped rats attack the noppera-bos before fleeing the camp. Letting the rats loose reveals the PCs as intruders automatically. The grunts fight until two are slain or defeated, then the rest flee to area E16 to join their leader's side for protection.",
    checks: [
      "DC 18 Athletics — Force Open the cage",
      "Cage by damage — AC 12, Hardness 3, HP 12 (BT 6)"
    ],
    beats: [
      { key: "ch4-e7-free-rats", label: "Free the caged rats", note: "Automatically reveals the PCs as intruders; escaped rats attack the noppera-bos before fleeing." },
      { key: "ch4-e7-combat", label: "Defeat the courtyard grunts",  note: "They fight until two are down, then the rest flee to E16. Moderate 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    id: "E8", key: "ch4-e8", name: "E8. Kitchen", level: "Low 3", tone: "slate",
    creatures: "Hunting Spiders (3)",
    boxed: "The hearth of this kitchen is dark from heavy use. The floor is lined with broken pots. A thin layer of cobwebs cover much of the surfaces, including a few bundles of what seem like bodies that lie in the middle of the room.",
    text: "In the first days of summer, when Kugaptee's influence granted creatures a modicum of sapience, the noppera-bos lured a trio of hunting spiders here with promises of free food. When the PCs lit the Eternal Lantern, the spiders reverted to normal animals but stayed. Grown weary of captivity, they swiftly attack anyone who enters, fighting to the death.",
    aside: { title: "The bundles", text: "One of the bundles on the floor is a noppera-bo who died before they could use the moderate blasting stone still clutched in their hand." },
    treasure: "A moderate blasting stone, clutched in the hand of a dead noppera-bo among the cobweb bundles.",
    beats: [
      { key: "ch4-e8-combat", label: "Clear the kitchen",  note: "The spiders fight to the death. Low 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    id: "E9", key: "ch4-e9", name: "E9. Storeroom", tone: "muted",
    boxed: "This pantry has been cleaned out, leaving empty baskets and bags with scraps of vegetables and grains.",
    text: "The PCs can safely rest in this currently empty storeroom if they stay undetected or unnoticed. While resting, they may hear the skittering of the spiders next door in area E8."
  },
  {
    id: "E10", key: "ch4-e10", name: "E10. Manager's Dormitory", level: "Low 3", tone: "ember",
    creatures: "Noppera-bo Occultists (2) · Kum Soon-chong (bound prisoner)",
    boxed: "This room is well-furnished, complete with a desk, wardrobe, and a bed with privacy curtains. Two doors to the south have been reinforced with extra slats of wood.",
    text: "The noppera-bos use the manager's sturdy quarters as a prison for special sacrifices. Kum Soon-chong, owner of Willowshore Stables, and his son Meng-sung wound up here; when his son was taken away after only a half hour, the elderly veterinarian's despair grew — he is now truly desperate. Soon-chong is tightly bound with rope in the eastern bedroom while two occultists allied with the Prayers stand guard in the main room. Unlike many grunts and tricksters, these two aren't easily tricked — they assume the PCs are heroes from Willowshore come to rescue prisoners and attack on sight. If one occultist is slain, the other attempts to flee the camp northwest to the ritual site to warn the others there.",
    note: "Soon-chong is reduced to 2 Hit Points, lacks any gear, and suggests he can remain here while the PCs press on — but asks them not to leave him behind once they return to Willowshore. If rescued, he tearfully begs the PCs to save his son: Meng-sung was taken somewhere to the northwest at the end of a trail, and the cultists wanted his \"old soul\" as an offering to \"Great Kugaptee.\"",
    beats: [
      { key: "ch4-e10-rescue-soonchong", label: "Rescue Kum Soon-chong", xp: 40, rep: 1, note: "Grant 40 XP (as printed in the digest) plus 1 Reputation Point with both factions once he returns home. Tick exactly one — mutually exclusive with harming him." },
      { key: "ch4-e10-harm-soonchong", label: "Soon-chong hurt or killed", rep: -5, note: "If the PCs intentionally hurt him or are responsible for his death, they lose 5 Reputation Points with both factions. Tick exactly one — mutually exclusive with the rescue." },
      { key: "ch4-e10-combat", label: "Defeat the occultist guards",  note: "They attack on sight; the survivor flees northwest to warn the ritual site. Low 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    id: "E11", key: "ch4-e11", name: "E11. Camp Office", level: "Low 3", tone: "slate",
    creatures: "Elite Air Wisps (3, summoned by the trap)",
    boxed: "The contents of the camp office are mostly well-organized—almost immaculate—as if no one has been inside for a while. All furniture from chests to chairs is in place, with one exception: loose documents lie strewn all over the floor, as if a gust of wind tore through the room at some point. A very solid looking wooden door that has been reinforced with iron bands stands in the northern wall.",
    hazard: "Summoning Runes (3) — the noppera-bos have avoided this chamber since the runes were triggered on a first attempt. All three runes trigger simultaneously once anyone steps fully into the room; the summoned elemental wisps pursue foes beyond this area but vanish after 2d6 rounds, and make no distinction between party members and the camp's monstrous inhabitants.",
    text: "The iron door to area E12 is locked and the key is long gone.",
    checks: [
      "3 × DC 20 Thievery — open the locked iron door to E12",
      "DC 23 Athletics — open the locked iron door with a single check",
      "Batter the door down — typical reinforced wooden door (Hardness 15, HP 60, BT 30)"
    ],
    treasure: "15 gp and a bottle of oil of mending, found in a search of the office. The strewn documents record that in the camp's final months, upheaval from the collapse of Lung Wa caused discord and desertion that led to the site's abandonment.",
    beats: [
      { key: "ch4-e11-combat", label: "Survive the summoning runes",  note: "The wisps attack anyone in the room and pursue beyond it. Low 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    id: "E12", key: "ch4-e12", name: "E12. Treasury", tone: "gold",
    boxed: "Several empty freestanding shelves fill this large room, some of which still display open but empty chests. The place is obviously looted and likely has been for quite some time.",
    text: "When the lumber camp was abandoned, the disenfranchised workers looted the treasury.",
    checks: [
      "DC 18 Perception — Search to notice a hidden trapdoor between the two northwestern shelves"
    ],
    treasure: "A 10-minute search automatically turns up 24 cp and 3 sp behind shelves and in empty chests that got missed. Within the hidden trapdoor: a leather pouch containing an invisibility potion and a silver ingot worth 100 gp — a corrupt official's embezzled stash he never made off with."
  },
  {
    id: "E13", key: "ch4-e13", name: "E13. Guest House", level: "Trivial 3", tone: "moss",
    creatures: "Midori & Murasaki (Abacus Sisters, jinkins) · Noodles (weasel)",
    boxed: "This building appears to be of more recent construction than the other structures in the camp and is relatively unblemished by moss or rot. It stands out as the only camp building that resembles a normal house.",
    when: "Only if the Abacus Sisters survived their earlier encounter with the PCs; otherwise this building is empty.",
    text: "The jinkins Midori and Murasaki are here; their raven ally Sparrow abandoned them, but the weasel Noodles remained loyally at their side even after becoming a mundane animal. Stumbling into the camp's vicinity after fleeing Willowshore, they were captured by the Prayers. Initially destined to be sacrifices, they were reprieved when Zoudou realized the jinkins might make great underlings — her \"recruiting\" was an intimidating \"you can join us or you can die\" speech, since which other events (not least the growing schism with the Rovers) have distracted the Prayers and left the sisters largely forgotten. Meeting the PCs again, they instantly surrender and beg the party to free them, despite no locks on their doors and no bonds — so long as no enemies remain in areas E1 and E7, they can make their getaway with ease once the PCs point this out. In exchange for saving them, they reveal that the noppera-bos believe some sort of paradise lies beyond the Wall of Ghosts — which they fearfully describe as \"a haunted wall to the northwest, beyond which the real monsters live.\"",
    quote: "\"That's a bad name. We don't talk about it. We don't even think about it.\"",
    note: "Asked about Kugaptee (whom they know only as a frightening fiend), the sisters shudder with the quote above. Pushing them to talk more about him is one sure way to drive them to flee or, if cornered, to attack.",
    beats: [
      { key: "ch4-e13-sisters-escape", label: "Help the Abacus Sisters escape",  note: "Grant XP as if the PCs had defeated them in combat — Trivial 3 standard (10 XP); the digest prints no number. Their intel: the noppera-bos believe a 'paradise' lies beyond the Wall of Ghosts." }
    ]
  },
  {
    id: "E14", key: "ch4-e14", name: "E14. Worker's Dormitory", level: "Low 3", tone: "plum",
    creatures: "Noppera-bo Occultists (2) — the \"Teeth of Kugaptee\"",
    boxed: "An elevated floor takes up the majority of this room. Dozens of blood-red candles carved into the shapes of various ancestries are lit here, their wicks burning without smoke. In the center of the irregular configuration of lights hunkers a misshapen effigy crafted from a very deformed burl.",
    text: "The candle flames are an eerie magical effect sustained by Kugaptee's influence — they don't melt the candles or give off smoke. The occultists sit faceless before the effigy, genuflecting and chanting telepathic prayers the PCs hear in their minds: the name \"Kugaptee\" over and over. They pay the PCs no attention and are indifferent even if verbally threatened; they only attack if the PCs lay hands on one of them, damage or extinguish the candles, or attempt to touch or damage the effigy. If the PCs declare they're here to rescue the kidnapped NPCs, these occultists find the goal quite understandable and propose a bargain: if the PCs can humiliate or defeat Mugirou in combat, they will escort the PCs to Zoudou and ask her to spare those who are to be sacrificed — for a price (what that price is, only Zoudou can say). If the PCs don't secure such an agreement before attempting to leave, the occultists inform them, almost regretfully, that they can't be allowed to leave and that their souls should remain here as more lights for Kugaptee's domain — they attack, fighting to the death.",
    aside: { title: "The effigy", text: "The burl effigy shimmers and ripples, hiding its true form — a manifestation of Kugaptee hinting at his nature without revealing any truth: one moment a hunched man with long broken arms and a head of twigs; then a crouching frog choking on a man it swallowed whole; then a form not wholly spider nor octopus nor plant, yet combining all three; then back to a tangled knot of roots, branches, and bark. If the candles are extinguished, the effigy becomes a mundane human-sized burl." },
    qa: [
      ["What do you call yourselves?", "We are the Teeth of Kugaptee (Prayers, though they don't use that name). Kugaptee promises freedom from the cycle of suffering that is the River of Souls."],
      ["What of Zoudou?", "A visionary and meticulous servant who can narrow down the perfect second for a sacrifice."],
      ["What of Mugirou?", "Ungrateful and irresponsible — he puts his own wants before Kugaptee's needs."],
      ["What is Kugaptee?", "Metaphors, sometimes contradictory: one compares him to 'the first breath you take when you are born'; the other to 'the first breath you'll never take after you die.'"]
    ],
    treasure: "Pendant of the Occult — awarded by the noppera-bo occultists if the PCs complete the deal to defeat Mugirou (before being escorted to the ritual site); alternatively, if the PCs defeat the occultists instead, the same item hangs off one of the \"arms\" of the Kugaptee effigy.",
    influence: [
      { key: "ch4-e14-bargain", label: "Bargain with the Teeth of Kugaptee", max: 1, note: "Declare the rescue mission and accept the price: humiliate or defeat Mugirou, then they escort the party to Zoudou and ask her to spare the sacrifices.", reveal: "Attempting to leave without an agreement — they attack, fighting to the death." }
    ],
    beats: [
      { key: "ch4-e14-bargain", label: "Strike the bargain (defeat Mugirou)", note: "Escort to Zoudou arranged; grants the Pendant of the Occult. Tick exactly one." },
      { key: "ch4-e14-fight", label: "Fight the Teeth of Kugaptee",  note: "If the candles/effigy are harmed or the PCs leave without an agreement. The Pendant of the Occult can be looted from the effigy. Tick exactly one. Low 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    id: "E15", key: "ch4-e15", name: "E15. Outhouses", tone: "muted",
    boxed: "A horrible, gag-inducing stench wafts out of the open doors of this side building, revealing the unsanitary condition of these outhouses without a shadow of a doubt.",
    text: "The state of the outhouses is so bad that noppera-bos intentionally go faceless whenever they must work or pass within 10 feet of the structures, just to avoid the smell. As they never go inside, the outhouses are convenient hiding places.",
    checks: [
      "DC 18 Fortitude — a PC entering this foul structure must succeed or become Enfeebled 1 for 10 minutes from the overwhelming stink"
    ]
  },
  {
    id: "E16", key: "ch4-e16", name: "E16. Mugirou's Throne", level: "Moderate 3", tone: "rust",
    creatures: "Mugirou the Rebel (Rovers leader) · Noppera-bo Grunts (4) · Prisoners (4, stable abductees)",
    boxed: "This warehouse-like building stands taller than the fences of the camp. Within, a makeshift wooden cage, apparently crafted from parts scavenged from large saws and other lumber work tools, sits before a haphazard throne made from a large root burl that's nearly five feet tall.",
    text: "Mugirou, leader of the Rovers, slouches brooding on his wooden throne while four grunts pester and mock the prisoners in the cage. The four were abducted from Willowshore Stables; when Zoudou determined their souls weren't \"old\" enough to suffice for sacrifice, she turned them over to the Rovers as a peace offering — but Mugirou interpreted the \"gift\" as an insult, believing Zoudou only wanted to pass off undesirable trash. Currently faceless, he greets the PCs telepathically: it wasn't he who orchestrated the abductions — the true target of their vengeance should be Zoudou, leader of the Prayers. If the PCs attack, his grunts fight to the death loyally; Mugirou has no desire to die — below 8 Hit Points he flees or begs for mercy, and any surviving grunts surrender or flee too. If the PCs talk, he admits he doesn't even enjoy what his underlings do — he's simply bored and out of ideas; left to himself he'd kill the prisoners, explore the region beyond the camp, and eventually attempt to take Willowshore for his own domain (he's evasive about this, lying as needed).",
    note: "The captured farmers all lack gear other than the now filthy and ragged leather armor they were wearing when captured. Mugirou's bargain: eliminate all noppera-bo occultists in the camp and at the Ritual Site (ending Zoudou's influence), and he frees the prisoners and lets the PCs leave unharmed.",
    checks: [
      "DC 17 Intimidation — Coerce Mugirou to also promise to leave Willowshore alone (he grows frustrated at the demand; whether he honors the terms is up to the GM)"
    ],
    qa: [
      ["Who ordered the abductions?", "Not I — Zoudou, leader of the Prayers. The true target of your vengeance should be her."],
      ["Why keep the prisoners?", "They were Zoudou's 'peace offering' — undesirable trash she passed off to us. I'd rather kill them and move on."],
      ["What do you want?", "To be rid of the occultists' influence. Eliminate them all — here and at the Ritual Site — and I free the prisoners and let you leave unharmed."]
    ],
    treasure: "battle medic's baton — gifted as a token of \"friendship\" if the PCs agree to the deal, or looted from Mugirou's corpse if they fight and defeat him. crafter's eyepiece — delivered by the grateful farmers a day after the four rescued prisoners safely return home.",
    influence: [
      { key: "ch4-e16-bargain", label: "Bargain with Mugirou", max: 1, note: "Accept his terms (eliminate the occultists) for the prisoners' freedom; DC 17 Intimidation adds his promise to leave Willowshore alone.", reveal: "Attack him — grunts fight to the death; below 8 HP he flees or begs for mercy and the grunts surrender or flee." }
    ],
    beats: [
      { key: "ch4-e16-deal", label: "Strike the deal with Mugirou",  note: "Eliminate all noppera-bo occultists (camp and Ritual Site); he frees the prisoners and lets the party leave unharmed, and gifts the battle medic's baton. Grant XP as if the PCs had defeated him and his grunts in combat — Moderate 3 standard (20 XP); the digest prints no number. Tick exactly one." },
      { key: "ch4-e16-surrender", label: "Mugirou surrenders", note: "He honestly agrees to leave Willowshore alone in return for his life and makes good on his word — the Rovers retreat into the wilderness and avoid Willowshore's citizens for the remainder of the campaign. Tick exactly one." },
      { key: "ch4-e16-combat", label: "Defeat Mugirou",  note: "Grunts fight to the death; loot the battle medic's baton from his corpse. Moderate 3 — standard XP, no value printed in the source. Tick exactly one." },
      { key: "ch4-e16-word-spreads", label: "Word spreads that monsters were spared", rep: -1, note: "If word spreads through Willowshore that the PCs let these monsters live or didn't chase them off: lose 1 Reputation Point from each faction." },
      { key: "ch4-e16-prisoners", label: "Rescue the four stable abductees", note: "The grateful farmers pool their resources and deliver a crafter's eyepiece a day after they safely return home." }
    ]
  },
  {
    id: "E17", key: "ch4-e17", name: "E17. Log Piles", tone: "muted",
    boxed: "Four fifteen-foot-high log piles remain stacked in a narrow clearing here, each secured with heavy, rusty chains. At the far side of the clearing, a well-traveled trail winds further to the north.",
    text: "The PCs can climb atop one of the log piles to attempt a Long Jump into the lumber camp. The trail once led further up into the mountains but is used today by the Prayers to come and go from the ritual site they've erected at the Wall of Ghosts. The trail soon turns west and, after a hilly hike of about 6 miles, reaches the Wall of Ghosts, where the leader of the Prayers is performing a complex ritual to Kugaptee."
  }
];

/* --------------------------------------------------------------- the ritual site */
const CH4_RITUAL = [
  {
    key: "ch4-who-is-kugaptee",
    name: "Who Is Kugaptee?",
    tone: "slate",
    text: "The PCs hear Kugaptee's name several times this chapter, but other than contextual clues that he's some entity the noppera-bos worship, they'll have little to go on at first. Learning more becomes important in the next act; for now, leave the name as a vague menace and let the players draw their own conclusions.",
    aside: { title: "The forgotten fiend", text: "Kugaptee was synonymous with death and fear many years ago when the fiend still lived. After Tan Sui-Jing defeated him only to perish soon thereafter, survivors took steps to ensure Sui-Jing was remembered for her bravery while Kugaptee would be forgotten and none would seek his grave. Nearly nine centuries have passed since the fiend's defeat; his name has largely been lost to time." },
    checks: [
      "DC 28 Religion — Recall Knowledge to recognize the name as an ancient, long-dead monster of some sort",
      "DC 28 Society — Recall Knowledge (same)",
      "DC 28 Willowshore Lore — Recall Knowledge (same)"
    ]
  },
  {
    key: "ch4-ritual-site",
    name: "The Ritual Site",
    when: "Within a few days of the abduction — Zoudou's Rite · Arriving too late (GM's discretion) — Horror from Beyond",
    tone: "moss",
    text: "The trail from E17 turns west and, after a hilly hike of about 6 miles, reaches the Wall of Ghosts where the leader of the Prayers is performing a complex ritual to Kugaptee. As long as the PCs travel to the ritual site within a few days of the abduction, they should reach it before Zoudou finishes her sacrificial rite.",
    phases: [
      "Arrive in time → Zoudou's Rite (Moderate 3)",
      "Arrive too late → Horror from Beyond (Severe 3)"
    ]
  },
  {
    id: "E17", key: "ch4-zoudous-rite", name: "Zoudou's Rite", level: "Moderate 3", tone: "plum",
    creatures: "Zoudou the Zealous (Prayers leader) · Noppera-bo Occultists (2) · Meng-sung (bound sacrifice)",
    boxed: "The forest trail suddenly reaches a clearing in the woods, where a few fallen trees and stumps testify to woodcutting pursuits abandoned years ago. Beyond a fallen tree, the clearing's northwestern side is obscured by a seething wall of mist that reaches fifty feet into the sky. Now and then, what appear to be silently screaming ghosts thrash and writhe through this mist, as if tormented souls were trapped within the fog. A three-tiered stone stands near this wall, while a bit further to the east of this platform stands a dome-shaped cage built of bent branches and wooden slats.",
    text: "The old stone shrine, originally devoted to the kami of the region, has been corrupted by Kugaptee's faithful into a shrine to the ancient fiend; the wooden cage is empty — the sacrifice has just been moved to the shrine itself. Zoudou the Zealous stands on the second step of the corrupted altar, with poor Meng-sung bound hand and foot on his back on the tallest tier, squirming and shrieking through his gag; a pair of occultists stand about 5 feet from the lowest step as secondary casters. Zoudou leads the Consecrate ritual she hopes will attract Kugaptee's attention, secure his blessing, and draw agents from beyond to bolster the Prayers. Consecrate takes 3 days to cast, so the PCs have time to interrupt before it ends with Meng-sung's sacrifice — but merely getting Zoudou's attention isn't enough: as long as at least one secondary caster maintains focus, the ritual can continue even while the other and Zoudou fight the PCs. If the PCs were led here by the occultists from area E14, Zoudou is annoyed at the interruption but agrees to speak with them — she isn't interested in halting her ritual; if the PCs truly wish to save Meng-sung, she agrees only at a steep price: one of the PCs must offer themself in Meng-sung's place. If they refuse, she sneers at their lack of conviction and spiritual cowardice and returns to the ritual. If the PCs attack, Zoudou and one occultist break off to fight, protecting the chanter; Zoudou fights to the death, as do the occultists as long as she lives — once she's slain, any remaining occultists panic and prepare to flee, and Horror from Beyond begins.",
    note: "Source labels this area \"E17,\" duplicating the Log Piles code — this is the separate ritual-site location reached by the trail from E17. Scene note: \"Stop Chanting\" audio cue to end the chant ambience. Meng-sung wears only a loincloth and won't try to escape while a faceless, dagger-armed monster looms over him.",
    checks: [
      "Escape DC 25 — Meng-sung's bonds",
      "–4 circumstance penalty to Perception checks (including initiative) — Zoudou and the secondary casters until the PCs become impossible to ignore"
    ],
    quote: "\"It is quite simple, for Kugaptee is generous and accepting. Come before his Wall, Child of the Ensnared. I will show you how to free yourself from the bondage of the world. Repeat my words:\n\n\"I offer thee my name, Great Kugaptee! Unbind me from those whom I called friends.\n\n\"I offer thee my blood, Great Kugaptee! Unbind me from those whom I called family.\n\n\"I offer thee my flesh, Great Kugaptee! Unbind me from the body I called my own.\n\n\"Lastly, I offer thee my soul, Great Kugaptee! Unbind me from that which was my fate.\"",
    aside: { title: "The exchange — a soul promised", text: "The Consecrate ritual ends with Zoudou passing her dagger over the PC's body and \"cutting\" their soul's link to the cycle of life and death. Promising a soul this way counts as an act of anathema for all religions other than the worship of Kugaptee (repercussions for champion or cleric characters), with no other immediate effect — until they die: the PC's soul is then absorbed into Kugaptee's domain, preventing resurrection or other restoration to life. A successful Atone ritual can break this link. At the GM's discretion, such a soul could be encountered or rescued in the final part of the last act of Season of Ghosts." },
    treasure: "Zoudou's ledger — the tattered leather-bound ledger she carries, once used by the lumber camp boss to track profits and expenditures (only the first quarter of the pages are mundane). The rest holds Zoudou's dense notes and theories about the nature of Kugaptee, the Wall of Ghosts, and the \"paradise\" she believes lies beyond, written in a mix of Aklo and Chthonian — a character must be able to read BOTH languages to study the contents. A reader can learn the Consecrate ritual from it, and in the next act clues within the notes can help the PCs open a doorway through the Wall of Ghosts.",
    influence: [
      { key: "ch4-rite-audience", label: "Escorted audience with Zoudou", max: 1, note: "Via the E14 bargain, she hears the PCs' plea but will not halt the ritual except at the price below.", reveal: "Her price — one of the PCs must offer themself in Meng-sung's place (see the aside for the soul consequences)." }
    ],
    beats: [
      { key: "ch4-rite-exchange", label: "A PC takes Meng-sung's place", note: "Zoudou agrees to spare Meng-sung; the exchange carries the soul-link consequences in the aside (anathema for most religions; no resurrection if that PC later dies; Atone ritual can break the link). Tick exactly one." },
      { key: "ch4-rite-refusal", label: "Refuse the exchange", note: "Zoudou sneers at the PCs' 'spiritual cowardice' and returns to the ritual; if it plays out to its end, Meng-sung is sacrificed and Horror from Beyond proceeds. Tick exactly one." },
      { key: "ch4-rite-combat", label: "Fight Zoudou",  note: "Zoudou and one occultist fight while the other keeps chanting every round; the ritual can proceed if Zoudou defeats the party. She fights to the death; the occultists flee once she's slain — then Horror from Beyond. Moderate 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    key: "ch4-horror-from-beyond",
    name: "Horror from Beyond",
    tone: "slate",
    text: "Zoudou hopes that sacrificing a creature whose soul has reincarnated several times — a discovery she believes she made while examining Meng-sung with Read Aura — at the end of the Consecrate ritual will earn Kugaptee's favor and draw additional minions from beyond the Wall of Ghosts. Her theories about Meng-sung and about Kugaptee are faulty: as a creation of Kugaptee's will, she knows little more than the fiend's name and a strange sensation of loyalty. The majority of the faith she built for the Prayers over the past few months of her existence are unintentional fabrications that delude even Zoudou. Her ritual does attract a glimmer of Kugaptee's influence — just not in the way she hopes.",
    phases: [
      "Confront and defeat Zoudou before she sacrifices Meng-sung → Interrupting the Ritual (Moderate 3)",
      "Zoudou completes the ritual / Meng-sung sacrificed → Arriving too Late (Severe 3)"
    ]
  },
  {
    key: "ch4-interrupting-ritual",
    name: "Interrupting the Ritual",
    level: "Moderate 3",
    tone: "plum",
    creatures: "Kugaptee's Blessings (3)",
    text: "As soon as the ritual is disrupted (likely when Zoudou is slain and the last chanting occultist gives up and flees, but earlier if the PCs attack or otherwise break that occultist's focus), a sudden rumble — as if an enormous tree toppled over — rolls out from beyond the Wall of Ghosts. Any surviving noppera-bos collapse to their knees in fear and telepathically beg for mercy as a vast, vaguely humanoid shadow rears up beyond the Wall. The shadow lunges at the wall from the far side, making the misty barrier flex and bulge as if pushed from beyond. The shadow vanishes, leaving the Wall intact — but the bodies of the three noppera-bos (living or dead) suddenly burst apart as immense mockeries of their previous forms climb out of them: arms hanging low, nearly to their ankles, broken in several places, with moldy wicker cages filled with blood-colored butterflies instead of heads. These are Kugaptee's Blessings, and they attack the PCs at once.",
    aside: { title: "The Blessings", text: "Their unsettling appearances foreshadow the shapes of the nindoru fiends the PCs will increasingly face in coming adventures, but they function identically to zombie brutes — Medium sized rather than Large, their long broken limbs retain a zombie brute's reach. Mindless and violent, they give up pursuit after 1 round once the PCs move beyond the ritual site map's border, returning to the altar to bow before the Wall until attacked again. Each time one is damaged, a cloud of glistening blood-red butterflies bursts from the wound, spirals into the air, and melts into wisps of red smoke that rejoin the mists of the Wall." },
    beats: [
      { key: "ch4-int-blessings", label: "Survive Kugaptee's Blessings",  note: "They attack at once. If one of the PCs offered themself as a replacement for Meng-sung, the three blessings do not attack that PC. Moderate 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    key: "ch4-arriving-late",
    name: "Arriving too Late",
    level: "Severe 3",
    tone: "slate",
    creatures: "Kugaptee's Blessings (4)",
    text: "If Zoudou finishes the ritual, her sacrifice of Meng-sung results in the same development — only Meng-sung's body also transforms into one of Kugaptee's Blessings. When the PCs eventually arrive at the ritual site, they find four lumbering undead in prostrate positions before the Wall of Ghosts, as if worshipping it. These four rise up to attack as the PCs approach — four of the variant zombie brutes rather than three, making this a Severe 3 encounter.",
    beats: [
      { key: "ch4-late-blessings", label: "Face four Kugaptee's Blessings",  note: "Severe 3 — standard XP, no value printed in the source." }
    ]
  },
  {
    key: "ch4-concluding-act1",
    name: "Concluding Act 1",
    tone: "gold",
    text: "The noppera-bos who survive the PCs' visit to the lumber camp quickly disband in the following days, likely due to the defeat of their leaders and the realization that the PCs are too powerful to stand against. At the GM's discretion, if the PCs didn't make a strong showing, the creatures might remain as a continuing threat until either defeated or bargained with — another, more powerful group of noppera-bos will appear as winter arrives in Season of Ghosts, but this band has no further scheduled role. Depending on how many days remain in summer, give the PCs time to rest, recover, and pursue downtime — unfinished Chapter 3 Opportunities can be completed — then jump forward to the first day of fall: dreary, rain-filled weeks during which the townsfolk slowly adapt to their new reality of being trapped within a curse. The PCs' actions have helped Willowshore grow more confident: Willowshore's effective level increases to 5 (see the \"Growing the Town\" sidebar), and the party should reach level 4 as Act 1 concludes. The party is left with more questions than answers about the \"curse,\" with the mystery of the Wall of Ghosts, what lies beyond it, and the name \"Kugaptee\" as their primary clues — and new hauntings beginning to manifest in the town, supernatural events unlike those the PCs have faced before.",
    beats: [
      { key: "ch4-conclude-abductees", label: "Return with the stable abductees", rep: 3, note: "The party is greeted as heroes: 3 Reputation Points with both factions. Reduce this award as the GM sees fit if the PCs return with fewer surviving abductees, especially if they seem cavalier or dismissive about any lives lost." },
      { key: "ch4-conclude-level", label: "Act 1 concludes — milestone level up", note: "The party advances to level 4 (milestone; no XP). Willowshore's effective level increases to 5." }
    ]
  }
];


/* Flat index so `wire()` can find any card by key across the act. */
const ALL_CARD_GROUPS = [
  CH1_TOWN, CH1_LANTERN,
  CH2_DOWNTOWN, CH2_BUTCHER, CH2_TEAHOUSE,
  CH3_TOWN, CH3_HINTERLANDS, CH3_CURSE,
  CH4_CAMP, CH4_RITUAL
];

/* ------------------------------------------------------- the town (landing) */
const RINGLEADERS = {
  gurglegut:    { name: "Gurglegut",    where: "Dawnstep Bridge · Ch 1",     desc: "the gluttonous buso — the muscle of the three" },
  graybutcher:  { name: "Gray Butcher", where: "downtown streets · Ch 2",    desc: "the vain ittan-momen — leads the cookware parade" },
  modouqiu:     { name: "Mo Douqiu",    where: "Cerulean Teahouse · Ch 2",   desc: "the hedonistic rokurokubi — the mastermind" }
};
const TOWN = {
  lantern: "As long as the Eternal Lantern stays dark the town is caught in a bad dream: by day a thick mirage mist smothers the streets, and at night the mist lifts only for crimson moonlight and blood rain. Lighting the lantern at Dawnstep Bridge ends the manifestations and drains the monsters' borrowed wits.",
  relight: "To relight it, bless three copper coins at three different shrines (Old Matsuki teaches the ten-minute prayer, and provides the coins), then offer them at the lantern.",
  duel: "Chapter 3's leadership duel is a set piece of its own — run it with the who-leads-willowshore-console.js macro, not here. This console tracks everything around it.",
  milestones: [
    ["Level 2", "The three ringleaders are dead and the Eternal Lantern is relit (end of Ch 2)."],
    ["Level 3", "The leadership duel is decided (Ch 3 — Who Leads Willowshore)."],
    ["Level 4", "The Wall of Ghosts is confronted (Ch 4 — Concluding Act 1)."]
  ]
};

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "town", ctab: { ch1: "town", ch2: "downtown", ch3: "town", ch4: "camp" }, pcs,
    lantern: false,
    ringleaders: { gurglegut: false, graybutcher: false, modouqiu: false },
    level: 1,
    cleared: {},          // card key -> true
    beats: {},            // card key -> { beat key: true }
    influence: {},        // influence tracker key -> current value
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
  if (!game.settings.settings.has(SMR_ID)) {
    game.settings.register(SMR_NS, SMR_KEY, { scope: "world", config: false, type: Object, default: null });
  }
  /* Registered so this console can read/write the Fall Downtime Tracker's
     pools whether or not that macro has been run yet in this world. */
  if (!game.settings.settings.has(DOWNTIME_ID)) {
    game.settings.register("world", "sogFallDowntime", { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>\\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ------------------------------------------------------------- the journal
   Each chapter is a journal entry in the Season of Ghosts module with a fixed
   id. An area resolves from its own code, because the module encodes the area
   code in the page id (`03a1<slug>` is area A1 of chapter 1) even when the
   page is named plainly. W-codes resolve against the "Willowshore" gazetteer
   (ord 02). None of this is required — the entry resolves by id, then name,
   then through the compendiums, and if the adventure isn't in the world no
   link renders at all. */
const jnorm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* The meta (id/name/ord) a given ref should resolve against. */
function journalMeta(ch, ref) {
  if (ref && /^W/i.test(ref)) return WILLOWSHORE_JOURNAL;
  return CHAPTERS[ch].journal;
}
function journalEntry(meta) {
  const byId = game.journal?.get?.(meta.id);
  if (byId) return byId;
  const want = jnorm(meta.name), all = [...(game.journal ?? [])];
  return all.find(j => jnorm(j.name) === want)
      ?? all.find(j => jnorm(j.name).endsWith(want)) ?? null;
}
async function journalDoc(meta) {
  const local = journalEntry(meta);
  if (local) return local;
  const want = jnorm(meta.name);
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
function journalPage(entry, meta, ref) {
  if (!ref) return null;
  const pages = entry?.pages?.contents ?? entry?.pages ?? [];
  if (/^\d/.test(ref)) return pages.find(p => p.id === ref) ?? null;
  const head = `${meta.ord}${ref}`.toLowerCase();
  return pages.find(p => p.id.toLowerCase().startsWith(head)
    && !/\d/.test(p.id.charAt(head.length))) ?? null;
}
async function openJournal(ch, ref) {
  const meta = journalMeta(ch, ref);
  const entry = await journalDoc(meta);
  if (!entry) {
    ui.notifications.warn(`No journal found for "${meta.name}". Looked for the id ${meta.id}, then that name in the journal directory and the compendiums.`);
    return;
  }
  const page = journalPage(entry, meta, ref);
  entry.sheet.render(true, page ? { pageId: page.id } : {});
}

/* ----------------------------------------------------------------- engine */
class Summer {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 60); }
  async save() { if (this.editable) await game.settings.set(SMR_NS, SMR_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  /* ----- the downtime tracker (the single source of truth for pools/rep) ----- */
  downtime() { return game.settings.get("world", "sogFallDowntime"); }
  get hasDowntime() { return !!this.downtime()?.pools; }
  pools() { return this.downtime()?.pools ?? null; }
  pool(p) { return this.pools()?.[p] ?? 0; }
  rep(faction) { return this.downtime()?.rep?.[faction] ?? 0; }

  async adjustPool(p, delta) {
    const dt = this.downtime();
    if (!dt?.pools) return ui.notifications.error("No downtime tracker state found. Run the Fall Downtime Tracker macro once first.");
    dt.pools[p] = (dt.pools[p] ?? 0) + delta;
    if (dt.pools[p] < 0) dt.pools[p] = 0;
    await game.settings.set("world", "sogFallDowntime", dt);
    this.log(`${p[0].toUpperCase()}${p.slice(1)} ${delta >= 0 ? "+" : ""}${delta} (now ${dt.pools[p]}).`);
    this.touch();
  }
  async adjustRep(faction, delta) {
    const dt = this.downtime();
    if (!dt) return ui.notifications.error("No downtime tracker state found. Run the Fall Downtime Tracker macro once first.");
    dt.rep = dt.rep ?? { southbank: 0, northridge: 0 };
    dt.rep[faction] = (dt.rep[faction] ?? 0) + delta;
    if (dt.rep[faction] < 0) dt.rep[faction] = 0;
    await game.settings.set("world", "sogFallDowntime", dt);
    this.log(`${faction[0].toUpperCase()}${faction.slice(1)} reputation ${delta >= 0 ? "+" : ""}${delta} (now ${dt.rep[faction]}).`);
    this.touch();
  }

  /* ----- the town state ----- */
  toggleLantern() {
    this.s.lantern = !this.s.lantern;
    this.log(`Eternal Lantern ${this.s.lantern ? "relit" : "dark"}.`);
    this.touch();
  }
  toggleRingleader(key) {
    this.s.ringleaders[key] = !this.s.ringleaders[key];
    this.log(`${RINGLEADERS[key].name}: ${this.s.ringleaders[key] ? "defeated" : "alive"}.`);
    this.touch();
  }
  ringleadersDown() { return Object.values(this.s.ringleaders).filter(Boolean).length; }
  setLevel(delta) {
    this.s.level = Math.min(4, Math.max(1, this.s.level + delta));
    this.log(`Party level ${this.s.level}.`);
    this.touch();
  }

  /* ----- areas / events ----- */
  toggleCleared(key) {
    const on = !!this.s.cleared[key];
    this.s.cleared[key] = !on;
    this.log(`${key}: ${on ? "reopened" : "cleared"}.`);
    this.touch();
  }

  /* ----- influence trackers (e.g. faction standing) ----- */
  setInfluence(key, delta, max) {
    const cur = this.s.influence[key] ?? 0;
    this.s.influence[key] = Math.min(max ?? 99, Math.max(0, cur + delta));
    this.log(`Influence — ${key}: ${this.s.influence[key]}.`);
    this.touch();
  }

  beat(cardKey, beatKey) { return !!this.s.beats[cardKey]?.[beatKey]; }

  async toggleBeat(cardKey, beatKey, beat) {
    const bucket = this.s.beats[cardKey] ?? (this.s.beats[cardKey] = {});
    const on = !!bucket[beatKey];
    bucket[beatKey] = !on;
    const d = on ? -1 : 1;

    if (beat.xp) { this.s.xp += d * beat.xp; if (!on) ui.notifications.info(`Award ${beat.xp} XP.`); }

    /* Points write through to the downtime tracker's pools. */
    if (beat.hope || beat.food || beat.security || beat.rep || beat.repS || beat.repN) {
      const dt = this.downtime();
      if (dt?.pools) {
        if (beat.hope) dt.pools.hope = (dt.pools.hope ?? 0) + d * beat.hope;
        if (beat.food) dt.pools.food = (dt.pools.food ?? 0) + d * beat.food;
        if (beat.security) dt.pools.security = (dt.pools.security ?? 0) + d * beat.security;
        if (beat.rep || beat.repS || beat.repN) {
          dt.rep = dt.rep ?? { southbank: 0, northridge: 0 };
          if (beat.rep) {
            dt.rep.southbank = (dt.rep.southbank ?? 0) + d * beat.rep;
            dt.rep.northridge = (dt.rep.northridge ?? 0) + d * beat.rep;
          }
          if (beat.repS) dt.rep.southbank = (dt.rep.southbank ?? 0) + d * beat.repS;
          if (beat.repN) dt.rep.northridge = (dt.rep.northridge ?? 0) + d * beat.repN;
        }
        await game.settings.set("world", "sogFallDowntime", dt);
      }
    }

    this.log(`${cardKey} — ${beat.label}: ${on ? "undone" : "done"}.`);
    this.touch();
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("The Summer That Never Was reset.");
    this.touch();
  }

  /* ----- chat ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "ember") {
    const C = { rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12", ice: "#5b7f9e", muted: "#6d6052" };
    await ChatMessage.create({
      content: `<div style="background:#efe6d8;color:#241c18;border:1px solid #b9a687;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.ember};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "The Summer That Never Was" }
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
    const dt = this.downtime();
    return this.postCard("Act 1", "The Summer That Never Was",
      `<p style="margin:0 0 6px"><b>Lantern</b> ${this.s.lantern ? "relit" : "dark"} · <b>Ringleaders</b> ${this.ringleadersDown()} of 3 · <b>Level</b> ${this.s.level}</p>
       <p style="margin:0 0 6px"><b>Reputation</b> ${dt ? `Southbank ${dt.rep?.southbank ?? 0} · Northridge ${dt.rep?.northridge ?? 0}` : "downtime tracker not run"}</p>
       <p style="margin:0"><b>Milestone XP</b> ${this.s.xp}</p>`, "ember");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

/* Card schema — see the DATA block above. Every chapter's areas, events and
   set pieces render through this one renderer. */
const TONES = ["rust", "ember", "moss", "slate", "plum", "gold", "ice", "muted"];

class SummerApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "summer-console", tag: "div", classes: ["summer-console"],
    position: { width: 960, height: "auto" },
    window: { title: "The Summer That Never Was", icon: "fa-solid fa-sun", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "summer-console", classes: ["summer-console"], title: "The Summer That Never Was",
      width: 960, height: "auto", resizable: true
    });
  }
  get title() { return "The Summer That Never Was"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="smr-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  jbtn(ch, ref, label = "") {
    const meta = journalMeta(ch, ref);
    const entry = journalEntry(meta);
    if (!entry) return "";
    const page = journalPage(entry, meta, ref);
    return `<button type="button" class="jbtn" data-act="journal" data-ch="${ch}" data-r="${esc(ref ?? "")}"
      title="Open the journal: ${esc(page ? page.name : entry.name)}"><i class="fa-solid fa-book-open"></i>${label ? ` ${label}` : ""}</button>`;
  }

  /* -------------------------------------------------------------- markup */
  markup() {
    const t = this.t, s = t.s, ro = !t.editable;
    const chapter = ["ch1", "ch2", "ch3", "ch4"].includes(s.tab) ? s.tab : null;
    const sub = chapter ? s.ctab[chapter] : null;
    return `${this.styles()}
      <div class="smr">
        ${this.header(ro)}
        <nav class="tabs">
          ${TABS.map(z => `<button type="button" class="tab ${s.tab === z.key ? "on" : ""}" style="--tt:var(--${z.tone})" data-act="tab" data-k="${z.key}">
            <b><i class="fa-solid ${z.icon}"></i> ${z.label}</b><small>${z.sub}</small></button>`).join("")}
        </nav>
        ${chapter ? this.subtabs(chapter) : ""}
        ${s.tab === "town" ? this.townTab(ro) : ""}
        ${chapter ? this.chapterTab(chapter, ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t;
    const flag = (on, label) => `<span class="flag ${on ? "on" : ""}">${label}</span>`;
    const repF = (faction, label) => {
      const v = t.rep(faction);
      return `<span class="pool" title="${label} Reputation"><b>${t.hasDowntime ? v : "—"}</b><i>${label}</i></span>`;
    };
    return `
      <header class="topbar">
        <div class="pools">
          ${repF("southbank", "Southbank")}
          ${repF("northridge", "Northridge")}
        </div>
        <div class="flags">
          ${flag(t.s.lantern, "Lantern lit")}
          <span class="flag">Ringleaders <b>${t.ringleadersDown()}</b>/3</span>
          <span class="flag">Level <b>${t.s.level}</b></span>
        </div>
        <div class="xp"><span>Milestone XP</span><b>${t.s.xp}</b></div>
        <button type="button" class="say" data-act="poststatus" title="Post the standing"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset summer" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  subtabs(chapter) {
    const s = this.t.s, c = CHAPTERS[chapter];
    return `<nav class="subtabs">
      ${c.subs.map(z => `<button type="button" class="subtab ${s.ctab[chapter] === z.key ? "on" : ""}" style="--tt:var(--${c.tone})" data-act="sub" data-ch="${chapter}" data-k="${z.key}">
        <i class="fa-solid ${z.icon}"></i> ${z.label}<small>${z.sub}</small></button>`).join("")}
    </nav>`;
  }

  /* ------------------------------------------------------------- the town */
  townTab(ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--ember)">
        <h3>The Eternal Lantern <small>the town's one switch</small>
          ${this.jbtn("ch1", "W10")}
        </h3>
        <label class="check big"><input type="checkbox" data-act="lantern" ${t.s.lantern ? "checked" : ""} ${ro ? "disabled" : ""}>
          The Eternal Lantern is relit</label>
        <p class="text">${TOWN.lantern}</p>
        <p class="hint">${TOWN.relight}</p>
      </section>

      <section class="panel" style="--tone:var(--rust)">
        <h3>The ringleaders <small>three monsters hold the town</small></h3>
        ${Object.entries(RINGLEADERS).map(([k, r]) => `
          <label class="check big"><input type="checkbox" data-act="ringleader" data-k="${k}" ${t.s.ringleaders[k] ? "checked" : ""} ${ro ? "disabled" : ""}>
            ${r.name} <span class="tag">${r.where}</span></label>
          <p class="beatnote">${r.desc}</p>`).join("")}
      </section>

      <section class="panel" style="--tone:var(--moss)">
        <h3>Reputation <small>written through to the Fall Downtime Tracker</small></h3>
        ${t.hasDowntime
          ? `<div class="poolgrid">${[["Southbank", "southbank"], ["Northridge", "northridge"]].map(([label, key]) => `
              <div class="clockrow">
                <span class="clabel">${label}</span>
                <button type="button" class="qbtn" data-act="rep" data-f="${key}" data-d="-1" ${ro ? "disabled" : ""}>−</button>
                <b>${t.rep(key)}</b>
                <button type="button" class="qbtn" data-act="rep" data-f="${key}" data-d="1" ${ro ? "disabled" : ""}>+</button>
              </div>`).join("")}</div>`
          : `<p class="hint">Run the Fall Downtime Tracker once and the two reputation tracks appear here, live. Until then the buttons are disabled.</p>`}
        <p class="hint">Chapter 2 runs on Reputation alone — almost every downtown room swings one faction or the other.</p>
      </section>

      <section class="panel" style="--tone:var(--gold)">
        <h3>Level <small>the party's milestone</small></h3>
        <div class="clockrow">
          <span class="clabel">Level</span>
          <button type="button" class="qbtn" data-act="level" data-d="-1" ${ro ? "disabled" : ""}>−</button>
          <b>${t.s.level}</b>
          <button type="button" class="qbtn" data-act="level" data-d="1" ${ro ? "disabled" : ""}>+</button>
        </div>
        <ul class="checks">${TOWN.milestones.map(([l, d]) => `<li><b>${l}</b> — ${d}</li>`).join("")}</ul>
      </section>

      <section class="panel" style="--tone:var(--plum)">
        <h3>Who Leads Willowshore <small>the Chapter 3 duel</small></h3>
        <p class="text">${TOWN.duel}</p>
        ${this.jbtn("ch3", "Who Leads Willowshore?")}
      </section>`;
  }

  /* ------------------------------------------------------------- chapters */
  chapterTab(chapter, ro) {
    const sub = this.t.s.ctab[chapter];
    if (chapter === "ch3" && sub === "duel") return this.duelTab(ro);
    const M = {
      ch1: { town: CH1_TOWN, lantern: CH1_LANTERN },
      ch2: { downtown: CH2_DOWNTOWN, butcher: CH2_BUTCHER, teahouse: CH2_TEAHOUSE },
      ch3: { town: CH3_TOWN, hinterlands: CH3_HINTERLANDS, curse: CH3_CURSE },
      ch4: { camp: CH4_CAMP, ritual: CH4_RITUAL }
    };
    const arr = M[chapter]?.[sub] ?? [];
    return arr.map(a => this.cardMarkup(a, chapter, ro)).join("");
  }

  duelTab(ro) {
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3>Who Leads Willowshore? <small>the Chapter 3 set piece</small>
          ${this.jbtn("ch3", "Who Leads Willowshore?")}
        </h3>
        <p class="text">Old Matsuki publicly challenges Granny Hu for the town's leadership, settled by a duel of
        champions in seven days. This is a set piece of its own, with champion selection, a seven-day lead-up, a
        five-round Trial of Champions on two live Favor tallies, and (from the homebrew thrown-duel variant) a
        Suspicion track.</p>
        <div class="aside"><b>Use the other macro</b><p>Run the duel itself with the <b>who-leads-willowshore-console.js</b>
        macro — it tracks champions, Favor, the lead-up levers, and the Suspicion track, and applies the verdict's
        write-through beats (heal the rift → Hope + Reputation) to the Fall Downtime Tracker. This console tracks
        everything around the duel; the duel console runs the duel.</p></div>
        <ul class="checks">
          <li><b>Champion selection</b> for both seats, with NPC stand-ins when a seat is empty.</li>
          <li><b>The seven-day lead-up</b> — starting Favor, reputation, influence, rally, rehearse, defuse.</li>
          <li><b>The five-round Trial</b> — the Address, the bout, the winter riddle, the People, the Verdict.</li>
          <li><b>The verdict</b> — declares the winner and marks the level-up to 3.</li>
        </ul>
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
              ${b.label}${b.xp ? ` <span class="tag">${b.xp} XP</span>` : ""}${b.hope ? ` <span class="tag">${b.hope > 0 ? "+" : ""}${b.hope} Hope</span>` : ""}${b.food ? ` <span class="tag">${b.food > 0 ? "+" : ""}${b.food} Food</span>` : ""}${b.security ? ` <span class="tag">${b.security > 0 ? "+" : ""}${b.security} Security</span>` : ""}${b.rep ? ` <span class="tag">${b.rep > 0 ? "+" : ""}${b.rep} Rep</span>` : ""}${b.repS ? ` <span class="tag">${b.repS > 0 ? "+" : ""}${b.repS} Southbank</span>` : ""}${b.repN ? ` <span class="tag">${b.repN > 0 ? "+" : ""}${b.repN} Northridge</span>` : ""}</label>
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
    if (!root || root.dataset?.smrWired === "1") return;
    if (root.dataset) root.dataset.smrWired = "1";
    const t = this.t;
    const cardByKey = (k) => {
      for (const arr of ALL_CARD_GROUPS) {
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
      else if (a === "rep") t.adjustRep(btn.dataset.f, Number(btn.dataset.d));
      else if (a === "level") t.setLevel(Number(btn.dataset.d));
      else if (a === "cleared") t.toggleCleared(btn.dataset.k);
      else if (a === "infl") t.setInfluence(btn.dataset.k, Number(btn.dataset.d), Number(btn.dataset.max));
      else if (a === "postarea") t.postArea(cardByKey(btn.dataset.k), btn.dataset.ch ?? "");
      else if (a === "postchecks") t.postChecks(cardByKey(btn.dataset.k), btn.dataset.ch ?? "");
      else if (a === "poststatus") t.postStatus();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "lantern") t.toggleLantern();
      else if (el.dataset.act === "ringleader") t.toggleRingleader(el.dataset.k);
      else if (el.dataset.act === "beat") {
        const card = cardByKey(el.dataset.k);
        const beat = card?.beats?.find(b => b.key === el.dataset.b);
        if (beat) t.toggleBeat(el.dataset.k, el.dataset.b, beat);
      }
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #summer-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #summer-console .window-content > * { background:transparent; }
      .smr { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --ice:${p.ice}; --snow:${p.snow}; --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .smr * { box-sizing:border-box; }
      .smr button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
      .smr button:hover:not(:disabled) { background:var(--hover); }
      .smr button:disabled { opacity:.45; cursor:not-allowed; }
      .smr input[type="checkbox"] { accent-color:var(--ember); }
      .smr h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.04em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:2px solid var(--tone, var(--line));
               padding-bottom:.3rem; flex-wrap:wrap; }
      .smr h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .smr h1, .smr h2, .smr h4, .smr legend { color:var(--ink); }
      .smr .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .smr .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .smr .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .smr .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 5px; letter-spacing:.06em; }
      .smr .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .smr .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .smr .say + .say { margin-left:.25rem; }
      .smr .boxed { font-size:.82rem; line-height:1.5; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; white-space:pre-line; }
      .smr .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; white-space:pre-line; }
      .smr .quote { font-size:.82rem; line-height:1.5; margin:.3rem 0 .45rem; padding-left:.55rem;
                   border-left:2px solid var(--tone, var(--line)); font-style:italic; color:var(--ink); }
      .smr .note { font-size:.78rem; line-height:1.45; color:var(--muted); font-style:italic; margin:.2rem 0 .4rem; white-space:pre-line; }
      .smr .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .smr .crea { font-size:.76rem; margin:.1rem 0 .35rem; color:var(--muted); }
      .smr .crea b { color:var(--tone, var(--ink)); }
      .smr .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .smr .req { font-size:.76rem; margin:.1rem 0 .35rem; }
      .smr .checks { margin:0 0 .45rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; color:var(--muted); }
      .smr .checks li { margin-bottom:.25rem; }
      .smr .outcomes { margin:.2rem 0 .3rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; }
      .smr .outcomes li { margin-bottom:.25rem; }
      .smr .outcomes b { color:var(--tone, var(--ink)); }
      .smr .phases { margin:.2rem 0 .3rem; padding-left:1.2rem; font-size:.79rem; line-height:1.5; }
      .smr .phases li { margin-bottom:.3rem; }
      .smr .qa { font-size:.78rem; line-height:1.45; margin:.2rem 0 .4rem; }
      .smr .qa p { margin:.2rem 0; }
      .smr .qa b { display:block; color:var(--tone, var(--ink)); }
      .smr .aside { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0;
                   background:var(--stripe); font-size:.78rem; line-height:1.45; }
      .smr .aside b { display:block; text-transform:uppercase; letter-spacing:.07em; font-size:.68rem;
                     font-weight:700; color:var(--slate); margin-bottom:.25rem; }
      .smr .aside p { margin:0; }
      .smr .check { display:block; font-size:.8rem; margin-bottom:.25rem; line-height:1.4; }
      .smr .check.big { font-size:.84rem; margin:.4rem 0; }
      .smr .tag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--moss); color:var(--moss); margin-left:.25rem; }
      .smr .tag.warn { border-color:var(--rust); color:var(--rust); }
      .smr .beatnote { font-size:.75rem; line-height:1.45; color:var(--muted); margin:.1rem 0 .4rem 1.35rem;
                      padding-left:.5rem; border-left:1px solid var(--line); }

      .smr .sub { --sub:var(--line); background:var(--stripe); border:1px solid var(--sub);
                 border-radius:4px; overflow:hidden; padding:.4rem .5rem .45rem; margin:.5rem 0; }
      .smr .sub.beats { --sub:var(--moss); }
      .smr .sub.influence { --sub:var(--plum); }
      .smr .subhead { font-size:.66rem; text-transform:uppercase; letter-spacing:.1em; font-weight:700;
                     display:flex; align-items:center; gap:.4rem;
                     background:var(--sub, var(--muted)); color:var(--paper);
                     margin:-.4rem -.5rem .45rem; padding:.28rem .5rem; border-radius:2px 2px 0 0; }
      .smr .subhead i { color:var(--paper); opacity:.8; font-size:.72rem; }
      .smr .subhead span { margin-left:auto; font-weight:600; color:var(--paper); letter-spacing:.06em;
                          border-radius:8px; padding:0 7px; background:rgba(0,0,0,.22); }

      .smr .jbtn { font-size:.62rem; padding:1px 5px; border-radius:3px; color:var(--slate);
                  border-color:var(--line); flex:none; letter-spacing:.04em; }
      .smr .jbtn i { font-size:.66rem; }
      .smr .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; }
      .smr .primary { background:var(--tone, var(--ember)); border-color:var(--tone, var(--ember));
                     color:var(--paper); font-weight:600; padding:.3rem .7rem; font-size:.76rem; }
      .smr .primary:hover:not(:disabled) { filter:brightness(1.1); background:var(--tone, var(--ember)); }
      .smr .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .smr .blocked { font-size:.76rem; color:var(--rust); margin:.2rem 0 .4rem; }
      .smr .bonus { font-size:.76rem; font-weight:600; color:var(--moss); margin:.3rem 0 0; }

      .smr .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .smr .pools { display:flex; align-items:center; gap:.4rem; }
      .smr .pool { display:flex; align-items:baseline; gap:.25rem; padding:2px 8px; border-radius:10px;
                   border:1px solid var(--ember); }
      .smr .pool b { font-size:.95rem; line-height:1; color:var(--ember); }
      .smr .pool i { font-style:normal; font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .smr .pool.empty { border-color:var(--rust); }
      .smr .pool.empty b { color:var(--rust); }
      .smr .flags { display:flex; gap:.3rem; flex-wrap:wrap; }
      .smr .flag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:2px 7px;
                  border-radius:10px; border:1px solid var(--line); color:var(--muted); }
      .smr .flag.on { border-color:var(--moss); color:var(--moss); font-weight:700; }
      .smr .xp { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; }
      .smr .xp span { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .smr .xp b { font-size:1rem; line-height:1; }

      .smr .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .smr .tab { flex:1; padding:.3rem .2rem; font-size:.76rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .smr .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .smr .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .smr .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .smr .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .smr .tab.on b i, .smr .tab.on small { color:var(--paper); opacity:.85; }

      .smr .subtabs { display:flex; gap:3px; margin-bottom:.6rem; flex-wrap:wrap; }
      .smr .subtab { flex:1; padding:.22rem .4rem; font-size:.74rem; gap:.35rem;
                    border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .smr .subtab i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .smr .subtab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                           text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .smr .subtab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .smr .subtab.on i, .smr .subtab.on small { color:var(--paper); opacity:.85; }

      .smr .clockrow { display:flex; align-items:center; gap:.5rem; margin:.3rem 0 .5rem; }
      .smr .clockrow b { font-size:1.1rem; line-height:1; color:var(--ember); min-width:1.4rem; text-align:center; }
      .smr .clockrow b.neg { color:var(--rust); }
      .smr .clabel { font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .smr .poolgrid { display:grid; grid-template-columns:repeat(2, 1fr); gap:.5rem; margin:.2rem 0 .5rem; }
      .smr .poolgrid .clockrow { border:1px solid var(--line); border-radius:4px; padding:.35rem .5rem;
                                 background:var(--stripe); justify-content:center; margin:0; }

      .smr .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }
      .smr .inflrow { display:flex; align-items:center; gap:.4rem; margin:.2rem 0; }
      .smr .ilabel { font-size:.76rem; min-width:9rem; }
      .smr .inflrow b { min-width:1.2rem; text-align:center; }
      .smr .itag { font-size:.64rem; color:var(--muted); }

      .smr .table { width:100%; border-collapse:collapse; font-size:.74rem; margin:.3rem 0 .4rem; }
      .smr .table th { text-align:left; font-size:.62rem; text-transform:uppercase; letter-spacing:.07em;
                       color:var(--muted); border-bottom:1px solid var(--line); padding:.2rem .35rem; }
      .smr .table td { border-bottom:1px solid var(--stripe); padding:.25rem .35rem; vertical-align:top; line-height:1.4; }

      .smr .panel.rev { opacity:.55; }
      .smr .panel.rev.on { opacity:1; box-shadow:inset 0 0 0 1px var(--gold); }

      .smr .area.done h3 .eid { opacity:.6; }

      @media (max-width:800px) {
        .smr .poolgrid { grid-template-columns:1fr; }
        .smr .tabs, .smr .subtabs { flex-wrap:wrap; }
      }
    </style>`;
  }
}

if (AppV2) {
  SummerApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSettings();
  let state = game.settings.get(SMR_NS, SMR_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(SMR_NS, SMR_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const summer = new Summer(state);
  const app = new SummerApp(summer);

  if (!globalThis.__smrHook) {
    globalThis.__smrHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if ((setting.key !== SMR_ID && setting.key !== DOWNTIME_ID) || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { summer.state = fresh; summer.render(); }
    });
  }
  app.render(true);
})();
