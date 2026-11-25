/* ============================================================================
   TO BLOOM BELOW THE WEB — Spring Console (Act 4)
   Season of Ghosts, Act 4 · Chapters 11–13 · party levels 10–12
   Foundry VTT v11 / v12 / v13 / v14  •  built for PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.
   Runs the whole of spring with the Two Weavers rework layered in: the
   return and Willowshore's Fate, the ruined manor and the bandits, Ren Mei
   Li's five rites and the yohoi murders, Kugaptee's Grasp, the governor's
   fate, and the finale — the Crimson Weaver, the marrow, and the Sealing of
   Five Seasons.

   It reads what earlier acts left behind — the downtime pools and winter's
   population for the Fate, whether the warding bell was spared, the silver
   collars, the rework seeds — and its checklist items are the same values the
   Campaign Status Tracker shows for Chapters 11–13.
   ============================================================================ */

const SPR_NS = "world";
const SPR_KEY = "sogSpring";
const SPR_ID = `${SPR_NS}.${SPR_KEY}`;
/* Read only: earlier acts' macros own these. */
const DOWNTIME_ID = "world.sogFallDowntime";
const WINTER_ID = "world.sogWinter";
const SUMMER_ID = "world.sogSummer";
const MAX_PCS = 4;

const DEG = ["cs", "s", "f", "cf"];
const DEG_LABEL = { cs: "Crit Success", s: "Success", f: "Failure", cf: "Crit Failure" };

const THEME = "parchment";
const PALETTES = {
  parchment: {
    paper: "#efe6d8", card: "#fbf7f0", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
    stripe: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.07)", field: "#fffdf8",
    rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12",
    bloom: "#9a4566", silver: "#5f6b73"
  },
  dark: {
    paper: "#1f1d1b", card: "#2a2724", ink: "#ece5da", line: "#544d44", muted: "#a4988a",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(255,255,255,.08)", field: "#171513",
    rust: "#d4664a", ember: "#e0a052", moss: "#96b06a", slate: "#7fa0bb", plum: "#b98ab0", gold: "#d9b74f",
    bloom: "#d98aa8", silver: "#aab6bd"
  }
};

/* --------------------------------------------------- inline check helper */
const SKILL_WORDS = ["Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy",
  "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Religion", "Society",
  "Stealth", "Survival", "Thievery", "Perception", "Fortitude", "Reflex", "Will",
  "Engineering Lore", "Herbalism Lore", "Tea Lore", "Theater Lore", "Willowshore Lore",
  "Farming Lore", "Nindoru Lore", "Academia Lore", "Arts Lore"];
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
   Three chapters, one window. The top strip carries the act's landing view
   and the three chapters; a second strip switches views inside a chapter.
   `rework` on a card or beat marks Two Weavers content — homebrew, not the
   printed book — so the two stay distinguishable at a glance. */
const CHAPTERS = {
  ch11: {
    key: "ch11", title: "Willowshore's Return", level: 10, act: "Ch 11",
    journal: { id: "pf2apsog13willow", name: "Act 4.1: Willowshore’s Return", ord: "13" },
    tone: "moss", icon: "fa-seedling",
    subs: [
      { key: "return", label: "The Return", sub: "fate · lantern · Shinzo", icon: "fa-sun" },
      { key: "manor", label: "The Manor", sub: "A1–A8 · the false governor", icon: "fa-house-chimney-crack" },
      { key: "bandits", label: "Bridges and Bandits", sub: "the bridge · the Silkwasps", icon: "fa-bridge" }
    ]
  },
  ch12: {
    key: "ch12", title: "The Princess's Web", level: 11, act: "Ch 12",
    journal: { id: "pf2apsog14thepri", name: "Act 4.2: The Princess’s Web", ord: "14" },
    tone: "silver", icon: "fa-spider",
    subs: [
      { key: "princess", label: "The Princess", sub: "Amai · the meeting", icon: "fa-crown" },
      { key: "rites", label: "Five Seasons", sub: "the rites · Victory Points", icon: "fa-gem" },
      { key: "murders", label: "The Murders", sub: "the yohoi · three victims", icon: "fa-magnifying-glass" },
      { key: "fang", label: "Fang and Key", sub: "stewardship · the Un-Weavers", icon: "fa-key" }
    ]
  },
  ch13: {
    key: "ch13", title: "A Fiend in Two Worlds", level: 12, act: "Ch 13",
    journal: { id: "pf2apsog15afiend", name: "Act 4.3: A Fiend in Two Worlds", ord: "15" },
    tone: "rust", icon: "fa-hand",
    subs: [
      { key: "manor", label: "Restored Manor", sub: "C1–C8 · the freeing-objects", icon: "fa-door-closed" },
      { key: "grasp", label: "The Grasp", sub: "the chained souls", icon: "fa-link-slash" },
      { key: "grave", label: "The Grave", sub: "D1–D4 · four seasons", icon: "fa-dungeon" },
      { key: "den", label: "Governor's Den", sub: "Heh Shan-Bao's fate", icon: "fa-user-tie" },
      { key: "finale", label: "Finale", sub: "the Weaver · the Sealing", icon: "fa-spider" }
    ]
  }
};

const TABS = [
  { key: "spring", label: "Spring", sub: "what the act inherits", tone: "bloom", icon: "fa-fan" },
  { key: "order", label: "Run order", sub: "the act, step by step", tone: "gold", icon: "fa-list-ol" },
  { key: "ch11", label: "Return", sub: "Ch 11", tone: CHAPTERS.ch11.tone, icon: CHAPTERS.ch11.icon },
  { key: "ch12", label: "The Web", sub: "Ch 12", tone: CHAPTERS.ch12.tone, icon: CHAPTERS.ch12.icon },
  { key: "ch13", label: "Two Worlds", sub: "Ch 13", tone: CHAPTERS.ch13.tone, icon: CHAPTERS.ch13.icon }
];

/* ------------------------------------------------------------------ DATA
   Card schema — every area, event and set piece renders through one
   renderer, `cardMarkup()`. Fields, all optional but `key` and `name`:
     id        the area code (A1, C4, D2), which also finds its journal page
     page      an exact journal page id, for cards with no area code
     level     the encounter's threat, as printed
     boxed     read-aloud text (posted to chat with the speech button)
     creatures who's there — name and count; statblocks stay in the compendium
     text/note the run notes, and the GM's side-note
     checks    DCs, posted as rollable inline checks
     outcomes  degree-of-success lines
     treasure  what's found; gets a hand-out toggle shared with the tracker
     rework    Two Weavers overlay text, shown apart from the book's
     beats     checkboxes: { key, label, xp?, note?, rework? } — XP moves on tick
     widget    a live tracker drawn into the card (fate, rites, murders…) */
const CH11_RETURN = [
  {
    key: "ch11-waking", name: "Waking in Willowshore", page: "13wakinginwill00", tone: "moss",
    boxed: "The world feels subtly but unmistakably different now, as though it has become more finely grained. Motes of dust shimmer in the sunlight, the breeze carries vibrant scents on its wings, and even the ground seems somehow more solid. This is no longer a mindscape. This is true, living reality.",
    text: "The PCs wake on the south end of Dawnstep Bridge beside the relit Eternal Lantern. Before the session, they level to 10th — and may reincarnate into an entirely new ancestry, or keep their body and swap ancestry feats anyway. Every PC reselects their 1st, 5th and 9th level ancestry feats and may pick from the Reincarnation Ancestry Feats in the Adventure Toolbox. Willowshore's named NPCs return in their familiar bodies.\nGive them time to look around. The town elder thanks them — or asks whether to rebuild or abandon the ruins, depending on the Fate below. Over a century has passed: friends beyond the borders are dead, and anyone who hears of Willowshore's return assumes its people are vengeful ghosts.",
    note: "Spring is mild and sunny; rain is rare all act.",
    beats: [
      { key: "ch11-ancestry", label: "The ancestry swap offered a session ahead", note: "A one-time offer at level 10 — it deserves thought, not a scramble." }
    ]
  },
  {
    key: "ch11-fate", name: "Determining Willowshore's Fate", page: "13determiningw00", tone: "gold",
    text: "While the players level up, total the Hope, Food and Security Willowshore had left when the transmigrate ritual fired — its Preparation Points. +12 if the ritual was a critical success; +4 if the population was 100 or more. The total decides who comes back, the town's condition, and the level cap on Earn Income and purchases for the rest of the adventure.",
    note: "Open with the description, not the math.",
    widget: "fate",
    beats: [
      { key: "ch11-fate-told", label: "The Fate described to the table" }
    ]
  },
  {
    key: "ch11-lantern", name: "The Eternal Lantern", page: "13theeternalla00", tone: "ember",
    text: "With Willowshore back in the living world, the PCs' spiritual tie to the town grows stronger: the item bonus to skill checks from invoking the Eternal Lantern rises to +2.",
    widget: "lantern"
  },
  {
    key: "ch11-bell", name: "The Warding Bell", page: "13thewardingbe00", tone: "plum",
    text: "If the party disabled Karahai's warding bell in Act 3 without destroying it, the villagers gift it to them on their first visit to Karahai, in thanks for driving out Mago Kai. Installed at any Willowshore shrine, it grants a +2 item bonus to all skill checks tied to that shrine deity's divine skill. At a different shrine from the lantern's, that's a second skill.",
    widget: "bell"
  },
  {
    key: "ch11-beyond", name: "Beyond Willowshore", tone: "slate",
    text: "For the first time the PCs can leave the old borders, but what they know is a century stale. The modern truth of each road:\n• Northwest Trail — the Whisperweb Shrine (Chapter 12).\n• Central Northern Road — overgrown ruins and Moon Marsh, all but forgotten (Chapter 12).\n• Eastern Northern Road — every settlement toward the Gossamer Mountains is a ghost town now.\n• Northeastern Road — the abandoned farmstead is the Silkwasp Bandits' hideout.\n• Eastern Road — to Karahai, across a destroyed bridge.\n• Southern Road — the \"Apple Road\", in ill repair, to the apple grove (Chapter 12).",
    aside: { title: "Silver collars", text: "Those the jorogumo choose as allies or pets wear silver collars (non-magical, 50 gp). They allow free travel in Shenmen, the right to read and write, and to trade beyond its borders. If the party didn't learn of them from Ren Mei Li in Act 3, it's one of the first things anyone in Karahai tells them. Quickly displaying a collar is usually enough to avoid a jorogumo's wrath." }
  },
  {
    key: "ch11-karahai", name: "Returning to Karahai", tone: "slate",
    text: "Karahai is a level 3 village now, and Willowshore's link to every trade route on the Sea of Ghosts. Once Shinzo is gone, orders go through Karahai: items up to level 11, a week to ship in from Sze. Until Karahai Bridge is rebuilt, Willowshore's food and supplies stay sparse.",
    note: "This act assumes Mago Kai was defeated; see the book's Mago Kai's Fate sidebar if he wasn't."
  },
  {
    key: "ch11-farewell", name: "Shinzo's Farewell", page: "13shinzosfarew00", tone: "gold",
    text: "A few days after the return, Shinzo arrives one last time. The party is back in the natural cycle, so he moves on. He still won't show his true form in public — \"I have come to know you as you know me, and for us, this form is what is truth now\" — though he may show a curious PC for a moment, privately.\nThis is the last chance to buy from his store; it's also the place to offer any magic item the party missed earlier.",
    treasure: "Just before he leaves: a phoenix fulu holder with an anathema fulu, a needle thousand-pains fulu, and two greater potency crystals. Then he and Yix fade from view.",
    beats: [
      { key: "ch11-farewell", label: "Shinzo's farewell — the last chance to shop" }
    ]
  }
];

const CH11_MANOR = [
  {
    key: "ch11-manor", name: "The Governor's Manor", page: "13approachingt00", tone: "plum", level: "Trivial 10",
    boxed: "Even by daylight, the abandoned governor's manor is a foreboding place. The unnatural chill that lingers in the hallways seems almost to seep into the surrounding grounds. Tattered tapestries whisper when no wind is present, portraits of past governors are faded to an eerie facelessness while their regalia remains bright and crisp, and beaten silver mirrors are all tarnished with odd, looping patterns.",
    text: "The manor returns in ruin regardless of the town's state, and the townsfolk fear it. If the PCs don't investigate, the town elder asks them to before their first day back reaches twilight. There are two manors: this ruin, full of Kugaptee's creatures, and a restored one the Fang and Key will unlock in Chapter 12.\nCustom demands an authorization pass to enter the absent governor's home. The elder grants one with the request; otherwise a PC recalls it with DC 20 Society. Without it, every hazard in the manor gets +2 to its Stealth, Disable and save DCs.\nApproach: the front door with the pass in view is safest. Walls: DC 20 Athletics to Climb. Flyers can drop into A2, or Squeeze through the roof into A3–A7 with DC 25 Acrobatics (A4's holes need no Squeeze). Nothing reaches A8.",
    hazard: "Unwelcoming Facade — the aura around the manor seeks to repel them, whatever route they take.",
    checks: ["DC 20 Society to recall the authorization pass", "DC 20 Athletics to Climb the walls", "DC 25 Acrobatics to Squeeze through the roof"],
    beats: [
      { key: "ch11-pass", label: "Authorization pass in hand before entering", note: "Without it, every manor hazard DC is +2." }
    ]
  },
  {
    id: "A1", key: "ch11-a1", name: "Manor Entrance", tone: "muted",
    boxed: "The temperature drops enough to frost breath within this ruined entrance. Moldering mats lie on the stained wood floor. The walls are overgrown with patches of fungi and coiling moist vines. A thick curtain of vines hangs over the roof to the north, forming a wall of dripping vegetation that blocks the view into the courtyard.",
    text: "The warped floor creaks: anyone not trying to be stealthy alerts A2. Sneaking on the floor here takes a –4 circumstance penalty."
  },
  {
    id: "A2", key: "ch11-a2", name: "Courtyard", level: "Low 10", tone: "moss",
    boxed: "This formerly elegant courtyard once featured sparkling pools of water, a rock garden fountain, and artfully arranged foliage, but it has since decayed into a swampy, overgrown mess. Fungi and mold grow through much of the dilapidated foliage, the water is thick with algae to the consistency of pudding, and sheets of moist vines hanging down from the roof obscure all exits into the surrounding building.",
    creatures: "Kugaptee's drakauthixes (2)",
    text: "A rotted version of the courtyard they saw in Chapter 8. The sky over it is winter-grey; fly above 20 feet and it's spring again. Two drakauthixes with cruel intellects and a few occult innate spells lurk SW and NE; hearing anyone in A1, they Sneak over to ambush with their 30-foot tendrils (Stealth for initiative; Perception if intruders come from above)."
  },
  {
    id: "A3", key: "ch11-a3", name: "Servants' Rooms", level: "Low 10", tone: "rust",
    boxed: "Moldering fulus once hung from the walls in these rooms, but now, only fluttering tatters remain amid deep claw marks in the walls. Bunk beds, dressers, chairs, and other furnishings lie in crumbling heaps on the floor, tangled amid the scattered bones of several human skeletons.",
    creatures: "Elite hungry ghosts (4)",
    text: "Four servants died in their beds. A claw with leathery flesh is lodged in the gouges — DC 29 Religion identifies an akashti nindoru (the one in A8). The ghosts rise as red skeletons, pursue through the manor but not beyond, and rejuvenate until the manor is cleansed. A3a is a lounge with nothing in it.",
    checks: ["DC 29 Religion to identify the akashti's claw"],
    treasure: "A trio of Taljjae tassels on a bunk-bed post in A3b, and a duskwood batsbreath cane on the restroom floor off A3c."
  },
  {
    id: "A4", key: "ch11-a4", name: "Meeting Area", level: "Low 10", tone: "ember",
    boxed: "This expansive room formerly hosted two long, elegant meeting tables surrounded by comfortable low chairs, with sideboards capable of displaying all manner of tea and snack services. Today, the furniture within this chamber lies in ruins. The ceiling above features several large holes that reveal the leaden sky above. An unassuming woodcutter's axe with a cold iron blade hangs on the southern wall in a partially collapsed display.",
    hazard: "Weakened Floor — mold and fungi have eaten the supports from below; the floor is about to give way.",
    treasure: "The lumber lord's axe on the display — a gift to the governor from a long-defunct lumber consortium."
  },
  {
    id: "A5", key: "ch11-a5", name: "Guest Quarters", level: "Low 10", tone: "plum",
    boxed: "This once-elegant bedroom used to feature all the comforts a traveling aristocrat expected, but now, the furniture is in disrepair. A musty stink lingers in the air, and a pair of skeletal remains clad in rotting vestments lie sprawled on the ruined beds.",
    creatures: "War wraiths (2)",
    text: "A5b and A5c were empty; A5a held two Senhang Monastery priests who'd helped design the ritual and died when he forged ahead without them. DC 22 Religion recognises the robes (critical: ritual specialists). Their wraiths lurk in the beds, roll Stealth for initiative when anyone nears the remains, fight to destruction and pursue through the manor.",
    checks: ["DC 22 Religion to recognise the Senhang robes", "DC 30 Arcana to identify the cracked crystal"],
    treasure: "A 10-minute Search of A5a: burned Tian-Jing incense in brass holders, a destroyed skyfang crystal in one skeleton's fist (a 5 gp curiosity now — DC 30 to Identify Magic), and a moonsilver necklace on the other."
  },
  {
    id: "A6", key: "ch11-a6", name: "Dining Area", tone: "muted",
    boxed: "Mildew and water stains drip down the kitchen's walls in long, swelling streaks that ruin the plasterwork. The main room features a moldering seating area for eating, while to the north, a pair of ancient stoves rest in a side room.",
    treasure: "A high shelf in the kitchen (A6b): a dozen bottles — ten of rice wine and liquor worth 50 gp each, one dose of ascendant dragon spirit, and one of vengeful demon's tears."
  },
  {
    id: "A7", key: "ch11-a7", name: "Storage Rooms", tone: "muted",
    boxed: "Most of the contents of these storage rooms appear to have crumbled and decayed into ruin. Crates have broken open as wooden slats decayed, spilling moldering contents over the floor, and empty barrels are surrounded by old stains caused by the leakage of their contents over the years.",
    checks: ["DC 28 Perception after a 10-minute Search of A7c"],
    treasure: "A7b, a 10-minute Search: a wooden box of six energizing pills. A7c, a 10-minute Search and DC 28 Perception: a lacquered waist drum fallen through a hole behind the shelves."
  },
  {
    id: "A8", key: "ch11-a8", name: "Primary Suite", level: "Moderate 10", tone: "rust",
    boxed: "The manor's primary bedroom, as with the rest of the building, is in poor repair, but here at least the ceiling seems to have held up, resulting in a chamber that hasn't been colonized by fungi and creeping vines. Nonetheless, the furniture lies in rubble, and a musty stink fills the air. Dozens of candles and sticks of incense burn in a circle in the middle of the room, as if a ritual were in progress here.",
    creatures: "The False Governor",
    quote: "I offer thee my name, Great Kugaptee! Unbind me from those whom I called friends. I offer thee my blood, Great Kugaptee! Unbind me from those whom I called family. I offer thee my flesh, Great Kugaptee! Unbind me from the body I called my own. I offer thee my soul, Great Kugaptee! Unbind me from that which was my fate.",
    text: "The only working doors in the manor; a soft chant carries through them. This is where the ritual failed — DC 20 Occultism or Religion realises it (critical: how rushed it was). The chant comes from a mass of red butterflies on the ceiling. Below kneels \"Heh Shan-Bao\", alive and well, who thanks them, apologises, and asks to be escorted to the new governor.\nIt's a nindoru in a suit of his flesh. Taken to the elder, it declares \"Great Kugaptee shall rule where you once ruled!\" and casts illusory creature to kill them. The tell: it has never met the party and remembers nothing of Act 3. Refused or attacked, it hisses \"You'll do just as well for Kugaptee's inaugural meal!\", fights with spells until it sheds its flesh, then uses Stunning Despair and claws, to the death and beyond the manor. Unbeaten ghosts from A3 and wraiths from A5 come running at the Stunning Despair.",
    note: "Drag the False Governor True Form effect onto his token when he sheds the disguise.",
    checks: ["DC 20 Occultism to recognise the ritual site"],
    treasure: "A 10-minute Search of the ruined rooms: a dented red-and-gold chamber pot (150 gp), a gold-rimmed monocle (100 gp), a fan of falling words in a cherry-wood case (90 gp), and a coiled-dragon potion holder (50 gp) with a panaceatic salve, a potion of quickness and a greater healing potion.",
    beats: [
      { key: "ch11-a8-false", label: "The False Governor slain — the trapped souls move on", xp: 80,
        note: "Kugaptee's hold breaks at once: the Facade and the undead in A3 and A5 vanish. Also grant XP for any of those encounters not yet fought." }
    ]
  },
  {
    key: "ch11-elder", name: "Reporting to the Town Elder", tone: "moss",
    text: "Repairs on the manor can begin; the PCs needn't be involved. The elder tells them to keep everything they found — the manor's riches are worth more than anything the villagers could give them — and asks them to travel east to Karahai at their earliest convenience to begin reconnecting Willowshore to the living world."
  }
];

const CH11_BANDITS = [
  {
    key: "ch11-rebuild", name: "Rebuilding Karahai Bridge", page: "13rebuildingth00", tone: "slate",
    text: "Six of the eight wooden supports still stand; five planks across the southern pilings make a 5-foot temporary bridge that's sturdier than it looks (DC 20 Crafting or Engineering Lore confirms). Crossing by Striding is safe, but a critical failure on any violent or defensive action drops a PC 30 feet into 20-foot water (DC 20 Reflex to Grab the Edge). Gorge walls: DC 30 Athletics to Climb (DC 10 along the old mudslide); the river: DC 15 to Swim. A Large mount crosses as difficult terrain with DC 25 Nature to Command it each Stride.\nRebuild Karahai Bridge (3 days of downtime; others can Aid). Without a PC, the elder takes it on and it counts as a failure. Each spellcaster whose magic helps adds +1 status, to +3.",
    checks: ["DC 25 Engineering Lore to Rebuild Karahai Bridge", "DC 27 Crafting to Rebuild Karahai Bridge", "DC 29 Society to Rebuild Karahai Bridge"],
    widget: "bridge",
    beats: [
      { key: "ch11-bridge-built", label: "Karahai Bridge rebuilt", xp: 120 }
    ]
  },
  {
    key: "ch11-bridge-fight", name: "Silkwasps at the Bridge", level: "Moderate 10", tone: "rust",
    creatures: "Lo Kuon · Silkwasp bandits (6)",
    text: "A week into the work, a breathless messenger: \"bandits have come to Karahai Bridge and are claiming they're in charge!\" — six rough men and women with bloodstained bandages round their necks. Three wait in two tents on the west side of the gorge; four more hide in the forest across it, two north and two south.\nLo Kuon, the band's charming \"face\": \"Welcome to my bridge! I'm sure you know who I am?\" — a patron of the people and foe to the web-spinners, he says. Since last summer he and his crew are inveigled by Hong Meigui, a jiang-shi; the bandages hide a seeping root-knot wound on each throat, Kugaptee's symbol (DC 28 Religion). He fishes for what the party knows about Kugaptee, and if they think the threat is over, he congratulates them.\nHis price: 200 gp a month, 50 once the bridge is done, halved the moment they haggle. Pay, and they pack up and leave. Refuse: \"I was afraid that'd be your response. Well then… no bridge for anyone, I suppose!\" — Deception for initiative. He and two bandits hold the near side; the four across the gorge each fire their two explosive arrows at the bridge (AC 24). Two hits blow the planks apart; five destroy all the work, and the rebuild starts over.\nInveigled, they fight to the death. Captured alive, or with Hong Meigui's ritual dispelled, they surrender and Lo Kuon begs the party to come and kill her.",
    checks: ["DC 28 Religion to recognise Kugaptee's mark"],
    rework: "Hong Meigui is the herald of Hong Zhinü, the Crimson Weaver — sent ahead to scout Kugaptee's grave, test the town, and seed her mistress's roses. Lo Kuon's questions about Kugaptee are him fishing on the Weaver's behalf. The fight, the thralls and the threat to the bridge are unchanged; only who they answer to changes.\nThe Weaver: a jorogumo countess stripped of her holdings by the Silken Court a century ago. Her thesis — Kugaptee can't be killed, but a fiend's marrow can be drawn out like silk. She works through proxies; her tell is a perfume of rose over rot, the scent that clings to Hong Meigui.",
    widget: "silkwasps",
    beats: [
      { key: "ch11-herald", label: "Hong Meigui re-flagged as the Weaver's herald", rework: true }
    ]
  },
  {
    key: "ch11-dealing", name: "Dealing with Bandits", tone: "ember",
    text: "Paying only starts the trouble: stolen livestock, robbed travellers, strangers skulking in the northeast of town — Hong Meigui testing the defences. Left alone, she leads every remaining bandit against the party in town at the start of Chapter 13, as an Extreme encounter. If the party fought at the bridge, the trouble starts within days, not weeks.\nGather Information in Karahai (2 hours):",
    checks: ["DC 22 Diplomacy to Gather Information about the Silkwasps"],
    outcomes: [
      "<b>Critical Success</b> — Locals beg the Silkwasps' aid by hiding notes in wasp nests, but no reply has come since early last summer; most assume they were wiped out.",
      "<b>Success</b> — Named for the silkwasp, which preys on spiders; they've opposed the jorogumo for years, and Lo Kuon is something of a local hero.",
      "<b>Critical Failure</b> — The Silkwasps died years ago and their ghosts demand tribute on the roads; those who pay waste away by the next full moon."
    ]
  },
  {
    key: "ch11-camp", name: "The Silkwasp Camp", page: "13thesilkwaspc00", level: "Severe 10", tone: "rust",
    boxed: "A humble farmstead sits on a low bluff overlooking the Sea of Ghosts, its western half nestled within rings of overgrown, ramshackle fences. Reeds surround a large fishpond at the western end, near the gates that lead up through the outermost fence. The farmhouse appears to be in dire repair, and the barn is in even worse shape with a partially collapsed roof.",
    creatures: "Hong Meigui · elite emperor cobras (2) · Silkwasp bandits (5)",
    text: "A freed bandit gives directions; only Lo Kuon comes along, and only he knows she's a jiang-shi — bring hand mirrors, and 1 Bulk of glutinous rice or hen eggs to put her to rest. She keeps something she fears and craves wrapped in silk in her room. Otherwise: a few hours north of Karahai on a bluff, via the overgrown trail northeast of town, nearly 3 miles beyond the map's edge — or Track them after any bandit encounter (DC 20 Survival).\nB1 front gates · B2 shack by the fishpond · B3 inner gates · B4 granary (the cobras) · B5 barracks · B6 Lo Kuon's barracks · B7 pantry · B8 workshop barracks · B9 back porch · B10 Hong Meigui's bedroom.\nSwamp and thicket are difficult terrain; the pond is 10 feet deep. Fences: 8 feet, DC 15 Athletics (critical failure collapses the section). Gates B1 and B3 don't open but a Medium creature can slip through. The east cliff drops 50 feet to shallow surf (DC 30 Athletics). Boarded windows work as arrow slits (greater cover). A buried rope from B5 pulls open B4's doors (DC 22 Perception to find it).\nUnexpected visit: Lo Kuon meets them at a gate to stall while the camp readies. On the defensive (for a week after any clash): watches at B2 and southwest of B3, three more in B5 and B8, Lo Kuon in B5, Hong Meigui in B10. Bows from cover; a bandit in B5 pulls the rope to free the cobras, which obey only her. She casts through the boarded windows of B10 and closes to melee the moment the house is entered. While she lives, the bandits fight to the death; once she falls, survivors flee.\nBandits survived the bridge? Whittle them down in the wild, or raise this to Extreme 10.",
    checks: ["DC 20 Survival to Track the bandits to the camp", "DC 22 Perception to spot the hidden rope", "DC 30 Thievery to Pick the Lock (three successes)", "DC 28 Perception to find the false bottom"],
    treasure: "In B10, a padlocked chest (Hong Meigui's key, or three DC 30 Thievery checks): silk pouches holding 3,500 sp, 220 gp, 120 gp of jewelry, a vanishing coin talisman and a 4th-rank wand of soothe. Under a false bottom (DC 28 Perception): a jiang-shi bell wrapped in fine spidersilk (60 gp) — kept hidden so no one can use it on her.",
    beats: [
      { key: "ch11-lokuon", label: "Lo Kuon freed from the Inveigle", note: "Only a freed Lo Kuon knows to tell them about mirrors and glutinous rice." },
      { key: "ch11-camp-cleared", label: "Hong Meigui destroyed and the camp cleared" }
    ]
  },
  {
    key: "ch11-clues", name: "Three Clues at the Cleared Camp", page: "13thesilkwaspc00", tone: "bloom",
    text: "Once the camp is cleared, the silk-wrapped bell and these clues are the Crimson Weaver's thread — give them the weight of a mystery, not a coin.",
    rework: "Clue one, the letters: correspondence on red silk in a spidery hand — the town breathes again better than hoped, living soil ripens the marrow; count the souls, water the roses, and don't touch the silver princess's pets. Signed H. Z. DC 20 Society pegs the seal as a deposed house of the Silken Court.\nClue two, the roses: unseasonal crimson roses with hair-fine silk threading the stems — scrying anchors. DC 22 Occultism reveals that destroying them blinds someone's distant eyes. If Ren Mei Li told them in Act 3 to burn red roses, this is the payoff.\nClue three, the count: a tally-book of Willowshore's returned population in the same hand — names, ages, and one column headed \"ripeness\".\nIf they never raid the camp, keep Hong Meigui's assault on the town, and let her dying words name her mistress: \"the Weaver comes for the marrow, and you are all thread.\" Either way, by the chapter's end the party should know that a woman in red, of the spider-courts, is watching Willowshore and counting its souls.",
    checks: ["DC 20 Society to place the seal", "DC 22 Occultism to understand the roses"],
    beats: [
      { key: "ch11-clue-letters", label: "Clue one — the letters, signed H. Z.", rework: true },
      { key: "ch11-clue-roses", label: "Clue two — the crimson roses found", rework: true },
      { key: "ch11-clue-count", label: "Clue three — the tally-book and its \"ripeness\" column", rework: true },
      { key: "ch11-roses", label: "The roses destroyed — someone's distant eyes go blind", rework: true }
    ]
  }
];

const CH12_PRINCESS = [
  {
    key: "ch12-amai", name: "A Feline Emissary", level: "Trivial 11", tone: "plum",
    creatures: "Amai, the dweomercat (creature 7)",
    text: "A week before her visit, Ren Mei Li sends Amai, a sapphire dweomercat with violet spirals and an elegant silver-and-spidersilk collar. She watches the town, then the PCs, from hiding — DC 27 Perception spots her. If the party is still friends with Yami, the two cats meet first and are amused by their names.\nAmai isn't magically bound and is insulted to be asked; she serves because her mistress pampers her, and gossips freely. Each question the PCs ask earns a blunt question back. After five minutes she leaves. If attacked she flees — and Ren Mei Li treats them as criminals working off a debt instead of allies.",
    quote: "Greetings, Willowshore. I am Amai. I have the honor of serving Lady Ren Mei Li, the Silversilk Princess, Resplendent Daughter of Yin-Sichasi. My mistress is curious about you, and wishes to make your acquaintance. Will you meet with her for tea in seven days' time?",
    qa: [
      ["Who's Lady Ren Mei Li?", "She's one of this land's rulers, of course! My, my! You have been out of it! She's a jorogumo, and she's glorious!"],
      ["Why does she want to meet us?", "She's curious about you. Also, this town needs an official steward. Perhaps one or all of you will suit."],
      ["What will we get out of it?", "Do you not wish to continue living here? My mistress can help you in so many ways. Even if only reporting back a favorable visit to prevent punishment."],
      ["Can we trust a jorogumo?", "Would you trust my answer? Speak to her directly. Then decide."]
    ],
    checks: ["DC 27 Perception to spot Amai"],
    widget: "amai",
    beats: [
      { key: "ch12-amai", label: "Took the time to speak with Amai", xp: 40 }
    ]
  },
  {
    key: "ch12-prep", name: "Preparing for the Visit", tone: "slate",
    text: "A full week this time, and Ren Mei Li has had a century to curb her impatience. The Cerulean Teahouse is still the best venue, but the PCs needn't hide tengu and peachwood. Have them describe their preparations — no checks. Respect delights her; disrespect only confirms her expectations.\nAsking about her at Karahai (or of a surviving Silkwasp), a few hours:",
    checks: ["DC 25 Diplomacy to Gather Information about Ren Mei Li"],
    outcomes: [
      "<b>Critical Success</b> — As success, and she's exceptionally adept in the arcane and warms to anyone who shows real interest in it.",
      "<b>Success</b> — She's one of the \"less harrowing\" jorogumo; locals keep her happy because her replacement would be worse. She accepts tengu and rarely demands people as tribute. Wear your silver collars in her presence.",
      "<b>Critical Failure</b> — She sounds as imperious and violent as her echo in the mindscape."
    ],
    beats: [
      { key: "ch12-asked", label: "At least a success asking around about her", xp: 40 }
    ]
  },
  {
    key: "ch12-meeting", name: "Meeting the Princess", page: "14meetingthepr00", tone: "silver",
    boxed: "At the appointed hour, a shimmering silver mist fills the Cerulean Teahouse. From it steps a silver-haired woman of extraordinary beauty, clad in pale blue and sea green silk of the finest quality. Silver sticks, ornamented with jeweled spiders, bind up her hair. Her voice is gentle and her smile serene. The only aspects of her appearance that might be unsettling are the silver sheen over her eyes and the movements of the spiders in her hair, which are living creatures and not, after all, decorations made of gemstones.",
    quote: "How nice to meet you. I am Ren Mei Li. I will not draw you away from your duties for long, as I understand Willowshore demands your attention. I hope you will not find my directness too rude. In short, I wish to offer you an alliance. I understand that Sze has cast its greedy eyes upon Willowshore's resources and wishes to cast its greedy hands upon it as well. I can prevent this. I am even willing to offer Willowshore a considerable degree of autonomy, provided its stewards are people I can trust. Do you suppose that some, or all, of you might serve as my stewards?",
    text: "She comes alone and without her legs extended. Interest in the stewardship pleases her; over tea she asks how they brought Willowshore back, believes the truth (it matches her theories), and demands every detail of her mindscape echo. Her attitude starts indifferent; visibly displayed silver collars make it friendly at once. Impress her over the meal — 3 Victory Points improve her attitude a step. She's impressed by inventive tactics and concrete plans for the town, and isn't opposed to a Silver Seal for Willowshore \"but, of course, that would depend on having a trustworthy steward.\"",
    checks: ["DC 28 Diplomacy to impress Ren Mei Li", "DC 28 Performance to impress Ren Mei Li", "DC 28 Society to impress Ren Mei Li", "DC 28 Tea Lore to impress Ren Mei Li", "DC 23 Arcana to impress Ren Mei Li"],
    rework: "The meeting is an alliance, and she says who is coming. Her crimson cousin is coming for the thing beneath the manor; the five treasures aren't heirlooms but anchors for a sealing ritual she'll teach them — jorogumo essence can't anchor the rite, she needs mortal hands. Roughly: five seasons bound the fiend once; bring me their tokens and I will teach your hands the rite; wear my collar, keep my town, and we need never speak of what you owe me.\nShe still asks fealty to herself, not to Lady Lang Loi, and it stays live. The party is choosing the better spider, not a saint — don't sand off that tension. The Weaver stays offstage all chapter: felt, not seen.",
    widget: "meeting",
    beats: [
      { key: "ch12-collars", label: "Silver collars displayed — friendly at once" },
      { key: "ch12-alliance", label: "The alliance reveal — her cousin, and why she needs mortal hands", rework: true }
    ]
  },
  {
    key: "ch12-requests", name: "The Princess's Requests", tone: "silver",
    quote: "It is time to discuss the Five-Season Treasures. Tradition demands that new stewards complete a ritual to prove their loyalty, courage, and capacity to serve as ambassadors… Four of these treasures symbolize the four seasons of life: the bright bird of spring, the fiery flowers of summer, the sweet fruits of autumn, and the spiced tea of winter. Once gathered, the gifts of the living must then be offered to the honored dead — this is the fifth season, a season beyond mortal life. If the ancestors accept, and grant their blessing, then all you need do is swear fealty to me, and the stewardship is yours.",
    text: "Point out that she asked fealty to herself and she smiles: \"Oh, was that what I said?\" She sets two silver pins with cloisonné balls in the mat, sets the first task — the Bright Spring Bird, a performance within the week — and leaves in silver mist.",
    rework: "Run each rite exactly as written; the rework only adds the anchor each yields for the sealing ritual and an optional beat of the Weaver's interference. Victory Points and rewards are unchanged.",
    beats: [
      { key: "ch12-agreed", label: "Agreed to work with her and pursue the requests", xp: 60 },
      { key: "ch12-anchors", label: "The five treasures framed as the seal's anchors", rework: true }
    ]
  }
];

/* The five rites. Each carries a Victory Point tally (0–4) and its XP,
   which follows the VP: earned once the rite is marked done. */
const RITES = {
  spring: { label: "Bright Spring Bird", season: "Spring", anchor: "Renewal", xp1: 80, xp4: 120 },
  summer: { label: "Fiery Flowers", season: "Summer", anchor: "Vigor", xp1: 60, xp4: 80 },
  autumn: { label: "Sweet Fruits", season: "Autumn", anchor: "Harvest", xp1: 60, xp4: 80 },
  winter: { label: "Spiced Tea", season: "Winter", anchor: "Endurance", xp1: 60, xp4: 80 },
  beyond: { label: "Gossamer Path", season: "Beyond", anchor: "Passage", xp1: 0, xp4: 0 }
};

const CH12_RITES = [
  {
    key: "ch12-r-spring", name: "Event 1 — Bright Spring Bird", page: "14event1bright00", tone: "bloom", when: "Spring · a week",
    text: "A theatrical performance celebrating the greatest thing they've done for Willowshore — freeing it from the mindscape, likely — with costumes, backdrops, effects and music, at the Seven-Colored Songbird. A chance for NPCs to speak: Luo Xi Yang fears her Lung Wa law is useless now; Huo Tian-Zhe's inventions are quaint curios; Kim Gu-won mourns old trading partners but loves the new samples. Let the PCs meet Kazuma Oono, the director, before his fate.\nEach player says how their PC makes it a success and rolls a DC 28 check for a Victory Point. Afterwards she compliments even the worst roll, gives the bird ball to the highest roller, keeps the fireworks ball, and sets the next task: Hei Feng's horn from Moon Marsh, within a week.",
    checks: ["DC 28 Performance to act, sing or play", "DC 28 Crafting for sets and costumes", "DC 28 Arcana for magical effects", "DC 28 Athletics for stagework", "DC 28 Diplomacy to host Ren Mei Li"],
    rework: "Anchor of Renewal — the performance's joy, caught in a cloisonné songbird. Optional interference: a stagehand is one of her thralls; on opening night the lanterns flare crimson, a Trivial 11 effort to douse — a message that she is watching.",
    widget: "rite:spring",
    beats: [
      { key: "ch12-int-spring", label: "Interference — the lanterns flare crimson", rework: true }
    ]
  },
  {
    key: "ch12-r-summer", name: "Event 2 — Fiery Flower Fireworks", page: "14event2fieryf00", tone: "ember", when: "Summer · a week",
    text: "Real fireworks, in the exact fiery orange tradition demands, need fresh petals of Hei Feng's horn from Moon Marsh, ~18 miles north (follow the dry Moon Creek). 8 hours of daylight search, or 1 hour after dark when it glows. Astrolabes, lenses and inscribed glass beads hang from the branches: Isori's observatory.\nIsori, a vicharamuni naga (creature 6), rises from the water. Attacked, he fights only reluctantly, offering a truce every round, saving the fallen with breath of life, fleeing below 75 HP. Spoken to, he asks about Willowshore and about the \"creeping chains\" his instruments show reaching for the natural world — Kugaptee. DC 27 Diplomacy to Make an Impression makes him friendly (one dragonroot) or helpful (all three). Friendly, he advises on the harvest: all harvesting DCs –4.\nHarvest: one PC rolls (others Aid at DC 20). Critical success +2 to the fireworks checks; failure –2; critical failure –4. Back in town, each PC rolls DC 28 to build and launch the display for Victory Points.",
    checks: ["DC 27 Diplomacy to Make an Impression on Isori", "DC 28 Nature to harvest the petals", "DC 28 Herbalism Lore to harvest the petals", "DC 28 Crafting to build the fireworks", "DC 28 Performance to stage the display", "DC 30 Perception to find the dragonroots"],
    rework: "Anchor of Vigor — Hei Feng's horn-fire, the festival's roar. Optional interference: Isori has seen red silk in the marsh and warns of it, and jiang-shi ambush the return trip while the party carries the horn — a Low 11 encounter.",
    treasure: "Isori's hidden tree hollow: three thousand-year dragonroots — one if he's friendly, all three if helpful, or found with an hour's Search and DC 30 Perception.",
    widget: "rite:summer",
    beats: [
      { key: "ch12-isori", label: "Isori made at least friendly", xp: 40 },
      { key: "ch12-int-summer", label: "Interference — the red silk, and the jiang-shi ambush", rework: true }
    ]
  },
  {
    key: "ch12-r-autumn", name: "Event 3 — Fall's Sweet Fruits", page: "14event3fallss00", level: "Moderate 11", tone: "gold", when: "Autumn · a week",
    boxed: "Where once stood a beautiful clearing in which grew dozens of fine apple trees, now creeps an overgrown tangle of weeds and brambles. Here and there, apple trees still stand among the undergrowth, but wide animal trails left by something the size of an elephant do as well — trails lined with the crunched and chewed remnants of countless enormous spiders.",
    creatures: "Khravgodons (4)",
    text: "The apple grove, 20 miles south, has been the lair of four khravgodons — giant spider-eating opossums — for seven years. They attack from the undergrowth (Stealth for initiative), flee below 40 HP but come back. Talk them into moving, or kill them. Ren Mei Li is more pleased the beasts are dead than about the grove.\nThe preliminary planning must be done before the next rite; each PC rolls DC 28 for Victory Points.",
    checks: ["DC 28 Nature to restore the grove", "DC 28 Farming Lore to prune and weed", "DC 28 Diplomacy to recruit workers", "DC 28 Survival to protect the trees", "DC 23 Nature to find the rose-vines"],
    rework: "Anchor of Harvest — the grove's first restored apple, preserved in gold. Optional interference: the khravgodons were driven here on purpose; rose-vines at the grove's heart, found with DC 23 Nature, prove the infestation was placed.",
    treasure: "An hour's Search (or automatically, once work begins): a long-dead adventurer still in dragon turtle armor, with a dragon turtle artillery.",
    widget: "rite:autumn",
    beats: [
      { key: "ch12-int-autumn", label: "Interference — the rose-vines prove it was placed", rework: true }
    ]
  },
  {
    key: "ch12-r-winter", name: "Event 5 — Spiced Tea of Winter", page: "14event5spiced00", level: "Severe 11", tone: "slate", when: "Winter · a week",
    boxed: "The winding path opens here into an idyllic clearing, at the heart of which shines an achingly beautiful pond. Ornaments hang from tree branches overhead: paper lanterns, gilt masks, braids of woven silk, and, hung among the rest with equal prominence, the mummified corpses of animals and more than a few people. Their silent screams are preserved in tight, suffocating layers of silk.",
    creatures: "Algrievers (6)",
    quote: "You intrude upon sacred ground. Your kind abandoned this shrine to us. By what right do you claim such a return?",
    text: "Her intensity shows now — the silver over her eyes, the tips of her fangs. The task: spiced tea strained through the fine silk of Whisperweb Shrine, a dozen miles north of the trail's end. (The name dates from after Willowshore vanished; ask in Karahai or Lo Kuon.) Pond 20 feet deep (DC 10 Athletics); the creek 2 feet, difficult terrain.\nSix algrievers keep the shrine, once Daikitsu's. They won't hand over silk on request: the PCs must first perform rites to \"those you have forgotten\" — a tea ceremony for Daikitsu. Refuse, attack or take silk, and they fight to capture, not kill, then make the captives perform it. Killing them yields the silk but no Victory Points.\nCeremony checks at DC 28: +2 if offered unprompted, –2 if forced after a fight, DCs –2 for a memorable roleplayed ceremony. Even with no VP they let the PCs harvest if they tried. 3+ VP: up to six willing PCs receive a Pilgrim's Ward (for as long as they keep Daikitsu's edicts).",
    checks: ["DC 28 Religion to honor the shrine", "DC 28 Tea Lore for the ceremony", "DC 28 Diplomacy with the algrievers", "DC 28 Performance to accompany it"],
    rework: "Anchor of Endurance — algriever spidersilk, white as the long night. Optional interference: the algrievers are agitated because a red-silk woman asked for their silk first and was refused; they test the party's manners doubly hard — +2 to the rite DCs.",
    treasure: "With 3 or more Victory Points, the algrievers give up to 6 willing PCs a Pilgrim's Ward.",
    widget: "rite:winter",
    beats: [
      { key: "ch12-algrievers-peace", label: "Resolved without violence", note: "XP as if the algrievers were defeated — standard creature XP; award by hand." },
      { key: "ch12-int-winter", label: "Interference — a red-silk woman asked first (+2 to the rite DCs)", rework: true }
    ]
  },
  {
    key: "ch12-r-beyond", name: "Event 7 — The Final Season", page: "14walkingthego00", level: "Low 11", tone: "plum", when: "Beyond · a week",
    quote: "I am prepared to accept you all as stewards. I am also prepared to offer considerable autonomy to Willowshore with a Silver Seal… In exchange, what I want is this: an oath of personal fealty, superseding any loyalty you may have to Lady Lang Loi or the rest of the jorogumo court. I wish for you to be my agents, and mine alone… What do you say?",
    creatures: "Path maiden",
    text: "She drinks the silk-strained tea and, the four rites done, unfurls her eight legs. The offer: fealty to her alone, kept discreet; ask her to intercede with her kindred rather than act alone; her protection in return. Agree (or Lie, DC 39 Deception) and she sends them to the path maidens with a gossamer sash and four doses of sanctified beans. Refuse, and she gives only a scroll of sending to apologise with later.\nWith the sash, up to 4 PCs walk any Shenmen road for an hour after midnight and step into a mountain-path mindscape. A veiled path maiden asks: \"Warm-bloods, living-bloods, fragile mortal feasts. Why do you tread the Gossamer Path? Whose dead secrets do you seek, and for whose lives would you use them?\" (Without the sash, each PC rolls DC 34 Diplomacy at once — one success and no critical failure stays her attack.)\nOne question. Ask about Kugaptee, Heh Shan-Bao or the murders, and a silver mirror shows the restored manor, the primary suite, and a new cypress door with a fanged golden lock that becomes Heh's face: \"…only a rightful ruler shall carry the key to my domain!\"",
    checks: ["DC 39 Deception to Lie about the oath", "DC 34 Diplomacy to stay the path maiden"],
    rework: "Anchor of Passage — the path maiden's veil-thread. Run this one clean: the mirror reveal must land undiluted. The only addition is one line from the path maiden: \"two webs close on the grave, and hers is red.\"",
    treasure: "Ren Mei Li's supplies: a gossamer sash and four doses of sanctified beans — or, if the offer is refused, a scroll of sending.",
    widget: "rite:beyond",
    beats: [
      { key: "ch12-oath", label: "Swore fealty to Ren Mei Li (or Lied, DC 39)" },
      { key: "ch12-question", label: "Asked the right question — the mirror's vision", note: "XP as if the path maiden were defeated — standard creature XP; award by hand." }
    ]
  }
];

/* The murders. Each investigation's clue text unlocks by the degree the
   party rolled: critical success shows all three clues, success minor and
   moderate, failure minor, critical failure the false lead. */
const INVESTIGATIONS = {
  "m1-scene": { murder: "m1", label: "Scene of the Crime", check: "DC 25 Perception",
    minor: "The killer entered calmly and left by smashing out through the paper doorway, leaving no tracks in the courtyard.",
    moderate: "Bloody handprints on a trunk of Oono's annotated plays; someone pawed through them. DC 25 Theater Lore or Willowshore Lore: The Chronicle of the Water-Weaver is missing.",
    major: "The missing play is obvious — and behind the desk lies the draft of The Endless Shore, his new play about the mindscape inspired by their performance. It's Oono's significant personal token for Chapter 13.",
    false: "Oono mocked Southbankers; perhaps an insulted Southbanker did this." },
  "m1-play": { murder: "m1", label: "The Chronicle of the Water-Weaver", check: "DC 22 Willowshore Lore",
    minor: "A monk weaves cloth from water and is drawn into a plot of bickering silk traders and a fickle governor.",
    moderate: "Oono staged it every summer solstice — but not this year, likely because of the curse.",
    major: "He was making it a blatant critique of Governor Heh. The governor visited at the end of spring, and the production went silent.",
    false: "He'd lost interest in the play; its absence means nothing." },
  "m1-interviews": { murder: "m1", label: "Interviews", check: "DC 22 Diplomacy",
    minor: "Last seen before dusk at the Happy Kappa bathhouse, chatting cheerfully with Hua De-ge.",
    moderate: "He'd had a breakthrough on a play about the PCs' time in the mindscape and hurried back to write it down.",
    major: "No enemies — except the heated argument with Governor Heh a few weeks before the last day of spring, after which he was depressed.",
    false: "He reduced bad actors to tears; a spurned actor, perhaps." },
  "m2-scene": { murder: "m2", label: "Scene of the Crime", check: "DC 25 Perception",
    minor: "Her broken flute lies by Oono's grave — destroyed by sonic force, not a blow (DC 20 to Identify Magic: shatter). It's Elizeth's significant personal token for Chapter 13.",
    moderate: "She played over the newly dead to guide them on; breaking her flute may have been meant to strand Oono's soul. The damage was a shatter spell.",
    major: "The broken flute suggests a yohoi — they loathe flute music played by the faithful.",
    false: "Her visits to Oono's grave suggest a secret affair, and a jealous lover." },
  "m3-scene": { murder: "m3", label: "Scene of the Crime", check: "DC 27 Perception",
    minor: "Unlike the others, the killer stayed a long time — fighting, or tearing the place apart.",
    moderate: "She died as fast as the others; the wreckage was a frenzied search, worst in the lab. Ten more minutes and DC 27 Perception finds her family journal on a small metal case behind a dresser — So-Jin's token for Chapter 13.",
    major: "The PCs automatically find You So-Jin's journal and the silversoul bombs.",
    false: "She put up a ferocious fight; her herbalism must have protected her." }
};

const MURDERS = {
  m1: { victim: "Kazuma Oono", where: "the Seven-Colored Songbird", token: "the draft of The Endless Shore" },
  m2: { victim: "Elizeth Candora", where: "the graveyard by Her Fluvial Lady of Souls", token: "her broken flute" },
  m3: { victim: "You So-Jin", where: "Graveside Manners", token: "her family journal" }
};

const CH12_MURDERS = [
  {
    key: "ch12-yohoi", name: "The Murders Begin — What's a Yohoi?", page: "14treasureandm00", tone: "rust",
    text: "While the PCs chase the treasures, Heh Shan-Bao — now a yohoi — comes through a portal in his ruined manor at night, Translocates to a victim he's seen before, kills them alone, and flies back. Nothing to track.\nSearch for Clues (exploration, secret): 10 minutes Investigating a body, evidence or place, or 2 hours Gathering Information. Critical success: minor, moderate and major clues. Success: minor and moderate. Failure: minor. Critical failure: the false lead, believed to be a minor clue. Investigators can Pursue a Lead and Clue In.\nAll three bodies share emaciated frames, missing eyes and strange runes burned on the wrists — the yohoi investigations sit with his statblock in the book.\nRecall Knowledge (DC 20 Occultism, Society or Willowshore Lore, or DC 20 Diplomacy to Gather Information) yields one of these; a critical success two:\n• Rural boogeymen, once thought to be the ghosts of neglected ancestors.\n• Bulging yellow eyes, crooked hairy necks, long filthy nails; their weapons kill by anguish.\n• They fear flute music, especially played by the faithful.\n• Their bodies fade within minutes; unless society believes them gone, they return.\n• Born of a person's or a whole town's fears — \"brainchildren\" elsewhere.",
    checks: ["DC 20 Occultism to Recall Knowledge about yohoi", "DC 20 Willowshore Lore to Recall Knowledge about yohoi"],
    rework: "The murders now feed two monsters: the Weaver's jiang-shi harvest souls in the yohoi's wake, skimming what Heh Shan-Bao ripens. The first murder runs straight; the second gets the red-clad witness; the third runs as written — make sure they recover So-Jin's bombs.",
    beats: [
      { key: "ch12-yohoi", label: "The party learns a yohoi is involved", xp: 80 }
    ]
  },
  {
    key: "ch12-m1", name: "Event 4 — The First Murder", tone: "rust",
    text: "While the PCs are at the apple grove, Heh kills Kazuma Oono at his writing desk and takes his notebook — bitter over The Chronicle of the Water-Weaver, and afraid Oono could help the PCs. He's found in his locked office at the Seven-Colored Songbird: the lock undisturbed, a paper wall smashed outward from inside with bloody smears, no struggle, copious blood, as if he simply fell from his chair. Willowshore mourns and looks to the PCs.",
    widget: "murder:m1",
    beats: [
      { key: "ch12-m1-lead", label: "First link to Heh Shan-Bao, or the token found", xp: 80, note: "The first time either happens in the investigation." },
      { key: "ch12-m1-token", label: "Oono's token kept — the draft of The Endless Shore" },
      { key: "ch12-m1-prevented", label: "This murder prevented — Heh confronted first", xp: 80, note: "Staking out the manor at night can catch him: Moderate 11. Slain, he re-forms in the Grasp and doesn't return to kill." }
    ]
  },
  {
    key: "ch12-m2", name: "Event 6 — The Second Murder", page: "14event6thesec00", tone: "rust",
    text: "Heh kills Elizeth Candora of Her Fluvial Lady of Souls as she plays her flute over the graves — hating Pharasma's claim on souls, and the flute itself. She's found sprawled over Oono's fresh grave. The town goes on alert: a sundown curfew, children kept in, no foraging. While it lasts, the PCs take –1 circumstance to Earn Income and Gather Information in Willowshore.",
    rework: "A witness saw two figures: the faceless thing, and a woman in red who arrived after it and breathed in over the body. DC 22 Religion reveals a soul was skimmed like cream off milk.",
    checks: ["DC 22 Religion to understand what the woman in red did"],
    widget: "murder:m2",
    beats: [
      { key: "ch12-m2-flute", label: "Elizeth's broken flute found — her token", xp: 60 },
      { key: "ch12-witness", label: "The red-clad witness planted", rework: true },
      { key: "ch12-m2-prevented", label: "This murder prevented", xp: 80 }
    ]
  },
  {
    key: "ch12-m3", name: "Event 8 — The Third Murder", page: "14event8thethi00", tone: "rust",
    text: "After the Gossamer Path, before Ren Mei Li's last visit, Heh kills You So-Jin — he can sense her new bomb, built to kill nindorus. A customer finds her late the next morning amid wrecked stock and a lab smashed to splinters. If the PCs dawdle, he strikes again at whoever he finds alone, even a lone PC; later sites have no clues.",
    treasure: "Read the journal for an hour and it holds the rare silversoul bomb formula her mother began and she finished, and her plan to give it to the PCs. The metal case beneath: three silversoul bombs and 500 gp of powdered silver and supplies (+2 item bonus to Craft more). If her murder was prevented, she gives them all this at the start of Chapter 13.",
    widget: "murder:m3",
    beats: [
      { key: "ch12-m3-bombs", label: "The silversoul bombs and formula found — her token", xp: 80 },
      { key: "ch12-m3-prevented", label: "This murder prevented", xp: 80 }
    ]
  },
  {
    key: "ch12-trouble", name: "Murder Scene Troubleshooting", tone: "muted",
    text: "Ren Mei Li won't investigate — it's a steward's job — but she can help connect dots, and chides them for paranoia if they suspect her.\nSpeaking to the dead gives what investigation would, focused on the rootlike body, butterflies from his eyes, long broken arms — or a distorted Governor Heh.\nThe restored manor can't be entered without the Fang and Key, and the ruin holds no new clues; a night stakeout may catch him before or after a murder (Moderate 11), 80 XP per murder prevented."
  }
];

const CH12_FANG = [
  {
    key: "ch12-fang", name: "The Fang and Key", page: "14thefangandke00", tone: "gold",
    text: "A week after the Gossamer Path she returns for a full report (disappointed if they asked the wrong question, but she still wants them). She produces a large golden key with four hollows in its shaft and spider fangs on silk threads; the cloisonné balls lock into it and it glows. \"Swear yourself to the office and to serve as Willowshore's stewards wisely and well.\" Accepting it makes them stewards of Shenmen's jorogumo court and rightful rulers alongside the governor.\nIt's ceremonial — an Everlight Crystal otherwise — but while a PC carries it, Heh Shan-Bao's domain welcomes them: the restored manor and its mindscape door open.",
    rework: "As she hands it over: guard it, because a door opened once is a door my cousin can follow through. That seed pays off in Chapter 13, when the Crimson Weaver breaches the grave on the party's heels.",
    treasure: "Traditionally nothing — but at 10+ Victory Points she produces a spidersilk type II spacious pouch with an evil-reflecting shield, a fortune cord, a purgatory emissary's staff and a sensei's parasol. One choice at 10, one more per VP above; at 14+, all four and the bag.",
    widget: "vp",
    beats: [
      { key: "ch12-fang", label: "Stewards of Willowshore — the Fang and Key claimed", xp: 80 },
      { key: "ch12-door", label: "The warning: a door opened once is a door my cousin can follow through", rework: true }
    ]
  },
  {
    key: "ch12-unweavers", name: "The Un-Weavers", level: "Severe 11", tone: "plum",
    creatures: "Quintessivores (4)",
    text: "An optional encounter. Four spider-like soul-eaters fade into view atop a roof or in an alley: \"Where did all you fresh souls hail from?\" Their offer: one of Willowshore's fresh souls today, and one each season after, for protection from other predators. Accept, and the town turns on the party and Ren Mei Li may confront them. Refuse: \"Then we shall simply take yours as tribute and feed on your friends as we see fit!\" — Deception, Diplomacy or Intimidation for initiative. Any street map works; Act 1's downtown is ideal.",
    note: "This act needn't end on the season's last day. If the party is short on XP or gear, add encounters — further murders, or the town adjusting to the living world."
  }
];

const CH13_MANOR = [
  {
    key: "ch13-restored", name: "The Restored Manor", tone: "plum",
    text: "Once stewards, within 30 feet of the ruin the PCs see it restored: red-lit lanterns on the eaves, red light in the windows, and the longer they look, the more unsettled they feel. Only the town elder sees it too. A PC who concentrates for a round outside can shift focus between ruin and restoration; inside, they can't. DC 25 Arcana or Occultism: it's a mindscape rightful rulers may come and go from. Anyone touching them crosses with them — how Heh installed its guardians. Only the front doors (C1) lead in or out; exterior walls and the courtyard from above lead only into the ruin.\nThe silver accents are stripped; paper walls show hunts and gatherings; the lanterns hold writhing balls of nindoru butterflies.",
    checks: ["DC 25 Occultism to understand the restored manor"]
  },
  {
    id: "C1", key: "ch13-c1", name: "Manor Entrance", tone: "muted",
    boxed: "A pair of stone lions flanks the manor's entrance, their eyes shimmering with crimson light. To the north, sliding paper walls block the view into the manor's inner courtyard.",
    text: "The lions raise their forepaws in salute, relieved the house is in trustworthy hands; harmless. Unless the PCs hold their breath or sneak, the jiang-shi in C3a hear them and come to \"greet\" them."
  },
  {
    id: "C2", key: "ch13-c2", name: "Courtyard", tone: "moss",
    boxed: "A sparkling pool, a rock garden fountain, and artfully arranged foliage turn the manor's heart into an elegant courtyard. Koi swim lazily in the pool, while songbirds sing in the shrubbery. Numerous glowing red lanterns hang along the edges of the courtyard, while the moonless night sky above is filled with stars. Elegant, framed scrolls depicting dragons, phoenixes, and dignitaries adorn the inner walls of the colonnade, but one of them on the central northern wall has been torn apart.",
    text: "Always a clear, moonless night; an invisible ceiling at 15 feet. The torn scroll shows a solemn dark-haired woman in a Hwanggot princess's dress, her face untouched though the frame is smashed and the edges clawed. The Fang and Key quivers within 10 feet. DC 30 Society: Princess Ok Jinju, his fellow student and the great love he could never marry; the camellia and gold ribbon she gave him (C8) are in the portrait.",
    checks: ["DC 30 Society to identify Princess Ok Jinju"],
    beats: [
      { key: "ch13-portrait", label: "Freeing-object — Princess Ok Jinju's torn portrait", note: "Negates the Flesh Tears pulse. Worth 5 gp; no power of its own." }
    ]
  },
  {
    id: "C3", key: "ch13-c3", name: "Servants' Quarters", level: "Low 12", tone: "rust",
    boxed: "Although they're plainly decorated, these servants' quarters look comfortable and inviting, even without any sort of decor to give them personalities of their own.",
    creatures: "Jiang-shi (2)",
    text: "Two jiang-shi accountants endlessly re-sort ledgers in C3a. They come to C1 to demand how the PCs got in and that they leave at once; anything else and they attack, to the death."
  },
  {
    id: "C4", key: "ch13-c4", name: "Meeting Area", tone: "ember",
    boxed: "Elaborate lanterns generously illuminate this room. A pair of long, low meeting tables fills most of the room, with shelves along the walls packed with regimented compartments for the organization of bureaucratic scrolls and missives. A stout bronze safe with a formidable-looking lock recessed inside a stern golden lion's maw sits under the shelves in the southwest corner. An empty weapon display hangs on the southern wall.",
    hazard: "Witherweird Runes — guard the safe's hidden compartment. Its wail wakes the jiang-shi in C6.",
    text: "The safe: four DC 30 Thievery checks, or a touch of the Fang and Key (it vibrates within 10 feet). DC 30 Perception finds the trapped compartment at the back. Searching the shelves 10 minutes finds The Wisdom of the Seven Sages, with his parents' letter of pride folded inside.\nThe hidden ledgers prove he sold lumber illegally to fund his lifestyle, and bought an occult living rune to guard his \"wartime collectibles\" in the northwest storeroom — with a smudged deactivation mantra.",
    checks: ["DC 30 Thievery to Pick the Lock (four successes)", "DC 30 Perception to find the hidden compartment"],
    treasure: "The safe: ten silk pouches of 100 gp each, and dozens of worthless expired vouchers and bonds.",
    beats: [
      { key: "ch13-sages", label: "Freeing-object — The Wisdom of the Seven Sages", note: "Negates the Mind Recoils pulse." },
      { key: "ch13-letter", label: "Freeing-object — his parents' letter, folded in the scroll", note: "Negates the World Trembles pulse." },
      { key: "ch13-mantra", label: "The living rune's smudged deactivation mantra found", note: "For C7c." }
    ]
  },
  {
    id: "C5", key: "ch13-c5", name: "Guest Quarters", tone: "plum",
    boxed: "This finely appointed bedroom features all the comforts a traveling aristocrat would've expected, including amenities such as private baths and lockable personal chests. A key, likely for the guest's use of the chest, sits atop the container's closed lid.",
    text: "The Tianjing priests' room (C5a) smells of incense and the beds are rumpled, but they're not here — they were the war wraiths in Chapter 11.",
    treasure: "The skyfang crystal, intact here, tossed on a bed in C5a — it can Track spirits in the Grasp. Under another bed's sheets: a cypress meditation mandala from the Tan Sugi Monastery, wearable, functioning as a countering charm holding warp mind; it can also free the corrupted monks."
  },
  {
    id: "C6", key: "ch13-c6", name: "Dining Area", level: "Moderate 12", tone: "rust",
    boxed: "The fine plasterwork of this room's walls has been molded into the shapes of birds roosting in the branches of willow trees in a forest. Three wooden tables with padded benches sit in the main dining area, and the appetizing scent of a cooking feast wafts through the open doors from the kitchen to the north.",
    creatures: "Jiang-shi (3)",
    text: "The celebration feast for a ritual that never succeeded cooks forever and is never done. Three jiang-shi guards mill about, sunk in melancholy; they ignore talk and fight only if attacked (or roused by C4's wail). In combat they start stupefied 2 for a minute — –2 to Perception for initiative — but immune to Bitter Epiphany for that minute. To destruction."
  },
  {
    id: "C7", key: "ch13-c7", name: "Storage Rooms", level: "Low 12", tone: "slate",
    boxed: "The walls of this storage room are hidden behind stacks of barrels, crates, and other containers, all of which are coated in thick layers of dust.",
    creatures: "Living rune (occult)",
    text: "C7a and C7b hold nothing. In C7c an occult living rune waits in a scroll of an Imperial Lung Wa swordswoman under a sun marked \"Protection\", attacking the round after anyone enters without the mantra. The mantra is a 2-action auditory, concentrate activity and DC 37 Occultism: success sends it back to the scroll until attacked or the room is left empty a minute; critical success destroys it; critical failure makes it immune to the mantra. The DC can drop by up to 10 if the party restored the smudged text by extraordinary means.",
    checks: ["DC 37 Occultism to perform the deactivation mantra"],
    treasure: "A 10-minute Search of C7c: a dragonfire halfbow, a four-tiger blade, and a thundering fury dadao."
  },
  {
    id: "C8", key: "ch13-c8", name: "Master Bedroom", level: "Trivial 12", tone: "gold",
    boxed: "This lavishly furnished bedroom reeks of decadent trappings. Remnants of half-eaten oranges, sweet rice cakes, and candied nuts lie on a platter atop the canopied bed. A nearby writing stand holds an unfinished calligraphy scroll, and dry inkwells sit on the side shelf. The wall to the right side of the bed features a large door made of fine cypress wood. An ornate golden lock worked into a hideous fiend's face is clasped around the door's handle.",
    creatures: "Ithiniak, an imprecasia",
    text: "The Fang and Key tugs violently toward the flickering door — the mindscape door Heh comes and goes by. Ithiniak, a curse-eating fey trapped here since the return, is sniffing the \"gloriously potent curse\" through the keyhole. Cornered, he fights to the death if attacked, but would rather talk: escort him out and he flees without thanks. He's glimpsed beyond the door red skies, an oppressed city, and a claw reaching from a hill into the clouds — \"as bad as the place looks, it smells… so… delicious!\" Indifferent, he'll remove a PC's curse in return for escape — but unless friendly, he uses Devour Curse to get the full flavour. Peacefully settled, he waits here and asks them to bring back any curses they find.\nThrough the door: touch the Fang and Key to the lock and it opens for a minute; from the far side, it stays unlocked for them from then on.",
    treasure: "Under the writing stand, Heh's private diary — his fears of the ritual, and his excuse for changing it: \"all pay some, and none pays all.\" In the wardrobe, a pink camellia in a cushioned box, its stem wrapped in a gold ribbon: \"Summer's virtues never fade.\" (DC 30 Society or Academia Lore: from Princess Adavisha's Lament.)",
    checks: ["DC 30 Society to place the ribbon's quotation"],
    beats: [
      { key: "ch13-camellia", label: "Freeing-object — the camellia and gold ribbon", note: "Negates the Final Death pulse." }
    ]
  }
];

const CH13_GRASP = [
  {
    key: "ch13-grasp", name: "Into Kugaptee's Grasp", tone: "rust",
    boxed: "Beyond the door sprawls a nightmarish landscape under a sky that looks like boiled blood. The clouds are churning masses of bruised violet and red, devoid of a sun. Instead of stars, the sky is spangled with enormous, glowing eyes. Beneath that alien sky lies the landscape of Willowshore, yet only the topography remains the same — a massive city after a century of growth. The river and lake are lifeless black voids. In the distance to the north, where once stood Great Willow atop a forested hill, rises a massive urban sprawl over which looms an immense, disfigured arm, its twisted talons reaching up as if to rip at the glaring sky above.",
    text: "The mindscape the party left was flooded with Kugaptee's influence and drew Heh in by his shame; for him, 115 years passed as the deathless ruler of a city of monsters. Three ripened souls is his minimum; given time he kills more. No hard timer — a month is plenty.\nThey arrive in a plaza by a mindscape door back to the manor, unlocked for them from now on. Spectral chains appear on every wrist: DC 30 to Identify Magic shows each PC is doomed 1 here and can't go lower; critical success: a PC who dies here is Kugaptee's, and returning them to life or animating them must overcome a counteract (+23, rank 7). Carrying any of the four freeing-objects (worn or in a carried container) dissolves the chains; defeating Heh ends them for all.\nFaceless phantoms trudge the streets. Buildings are flat stage-sets of wicker figures with Heh's face painted on; in the Cerulean Teahouse, effigies of the PCs. Shops: \"ALL GOODS TO BE SENT TO THE MOST GLORIOUS GOVERNOR'S GRASP.\" The skyfang crystal Tracks Heh toward the claw.",
    note: "Switch the Willowshore scene's lighting to red.",
    checks: ["DC 30 Arcana to Identify Magic on the spectral chains"],
    rework: "Someone got inside ahead of the party. Salt in quiet signs as they free the souls: web-strands dyed red, a thrall's drained corpse, rose petals floating on the black water. Atmosphere only — no checks — but it makes the Breach land as a payoff, not a surprise.",
    beats: [
      { key: "ch13-signs", label: "Signs of the Weaver inside the Grasp", rework: true }
    ]
  },
  {
    key: "ch13-curios", name: "Curiosities and Nightmares", tone: "muted",
    text: "Illusory fragments that trigger as the PCs pass:\n• The Lumber Scales (an industrial area): a pony-sized crow vomits bones onto a pierced dish that never falls; on the other side, a wicker Heh digs through silver and lumber until his fingers fray, butterflies rattling: \"Where are you? My precious ones, where are you?…\"\n• The Peddler of Glories (a market): a wicker herald proclaims \"All hail the most glorious of governors, in all his glory!\" DC 25 Society: a Lung Wa herald would praise virtue, never glory — a fool's tragedy.\n• The Puppet Mother (a residential street): a wicker peasant woman with Heh's face gazes at a window: \"My son. My wonderful son. How proud I am of my wonderful son!\"",
    checks: ["DC 25 Society to understand the herald's empty praise"]
  },
  {
    key: "ch13-chained", name: "The Chained Spirits", page: "15thechainedsp00", tone: "plum",
    text: "Each of Heh's victims is bound as a weeping shade near where they died. As they acclimate, each PC rolls DC 30 Perception (+4 with the Fang and Key): success hears Oono's voice from the Songbird Theater, ~200 feet southwest.\nFree Shackled Soul (10 minutes; auditory, concentrate, exploration, linguistic, mental): the soul's own DC 28 check, or DC 32 Diplomacy or Intimidation; +3 item bonus showing the soul's token from Chapter 12. Critical success: the soul returns to life (as a 7th-rank resurrect). Success: it moves on to the Boneyard. Failure: try again. Critical failure: bound until Heh falls; no more attempts.\nFreeing a soul takes its eyes from Heh's altar. A murder the party prevented counts as freed: grant its blessing and XP on entering the Grasp.",
    checks: ["DC 30 Perception to hear Oono", "DC 32 Diplomacy to Free a Shackled Soul", "DC 32 Intimidation to Free a Shackled Soul"],
    widget: "soulsummary"
  },
  {
    key: "ch13-oono", name: "The Silenced Songbird", tone: "ember",
    text: "Oono, blinded, is chained to his desk endlessly revising The Chronicle of the Water-Weaver into a caricature of Heh, the changes fading as fast as he writes. \"I only have a few hours to get these changes made, so unless you've got some bright ideas, please keep quiet!\" Help him make the satire subtler (DC 28 Deception).\nFreed: the play completes itself and returns to his real office; the PCs gain +2 status to Will saves for the rest of the adventure.",
    checks: ["DC 28 Deception to help Oono finish the play"],
    widget: "soul:m1"
  },
  {
    key: "ch13-elizeth", name: "The Wandering Grave Keeper", tone: "slate",
    text: "Behind the defiled ruin of Her Fluvial Lady of Souls, every grave dug up and empty, Elizeth drags her buried chains from grave to grave; each time she lifts her flute it falls apart. \"If only my flute were not so broken, I could bring a moment of peace to these tormented souls!\" Help her play (DC 28 Performance).\nFreed: a final mournful dirge; +2 status to Reflex saves for the rest of the adventure.",
    checks: ["DC 28 Performance to help Elizeth play"],
    widget: "soul:m2"
  },
  {
    key: "ch13-sojin", name: "The Herbalist's Final Creation", tone: "moss",
    text: "So-Jin is chained to her workstation, her bomb exploding and resetting forever — harmless to the PCs, harrowing to watch. \"I've almost perfected my latest invention, and it will aid you in defeating your enemies… but this last bit always spirals out of control, no matter what I do!\" Help her finish (DC 28 Crafting).\nFreed: she caps the final bomb; spring-woodland vapors give +2 status to Fortitude saves for the rest of the adventure.",
    checks: ["DC 28 Crafting to help So-Jin finish the bomb"],
    widget: "soul:m3"
  }
];

const CH13_GRAVE = [
  {
    key: "ch13-grave", name: "Entering Kugaptee's Grave", tone: "rust",
    text: "Near the claw — or once all three souls are freed, when Kugaptee seeks the fight — the buildings grow taller, the streets narrower, the sky lower, until the city is a cavern of facades. South for a minute leads back out; any other approach to the claw leads back in. Walls can be Climbed (DC 20 Athletics) to an invisible ceiling at 30 feet (100 in the chambers). Only the doors at each alley's end open, each onto a different place.",
    rework: "Optionally, show one season-room already fought through when they arrive — torn webbing, a Weaver thrall's body. Flavor only; the room still runs as written if you'd rather.",
    beats: [
      { key: "ch13-cleared-room", label: "A grave-room found already cleared by the Weaver", rework: true }
    ]
  },
  {
    id: "D1", key: "ch13-d1", name: "Summertime Guard", level: "Moderate 12", tone: "ember",
    boxed: "The door opens not into the expected building, but instead onto a familiar, wide stone bridge — Dawnstep Bridge. The panorama of Willowshore as it existed last spring lies beyond the bridge's rails, including the eerie fog that plagued the town. Above, a moon in the shape of a red eye looms in the night sky. In the middle of the northern end of the bridge, an immense golden throne has been built to resemble a seated demon.",
    creatures: "Gurglegut · mountain oni (4)",
    quote: "And here we are again, heroes of Willowshore, only this time you shall not catch me at a disadvantage. This time, my guardians are competent. This time, I am not drunk and distracted. This time, I will be eating your flesh and crunching your bones when all is said and done!",
    text: "Gurglegut, remade and 13 feet tall, with four mountain oni. Hostile; the PCs have one round to shift him to indifferent (Quick Coercion and the like; magic works only if the oni don't notice). If they do, he'll let them pass for a gift worth 2,000 gp (1,000 if it's food or drink), a good Lie, or a critical success to Coerce.\nIn a fight, two oni close, two shoot from the throne, and he harries with his crossbow. At 40 HP he retreats; cornered, or with every oni dead, he begs for mercy — and surviving oni turn on him. Spared, he shrinks to his Act 1 self, gives them his gear, and warns: \"be aware of dead bodies, for the playthings of Kugaptee enjoy using the dead as disguises!\" Then he sees something behind them, shrieks, and his head bursts into crimson butterflies.",
    treasure: "Gurglegut's magical gear, if they spared him.",
    beats: [
      { key: "ch13-d1-mercy", label: "Gurglegut spared — his gear and his warning" }
    ]
  },
  {
    id: "D2", key: "ch13-d2", name: "A Fallen Tree", level: "Moderate 12", tone: "moss",
    boxed: "The door opens through a crumbling, vine-covered stone wall into an overgrown monastery courtyard. Thick tangles of brambles and weeds grow on the ground, while to the left and right, a wall of densely packed trees blocks the way. In the middle rises a single towering tree, its trunk diseased and its branches bare. The upper half looks more like a twisted claw reaching up into the overcast sky above than anything else.",
    creatures: "Corpse sugi · kagekuma nindorus (4)",
    text: "The Tan Sugi courtyard, the tree dead. DC 38 Perception spots screaming faces in the bark (critical: some eyes follow them) — a corpseroot. If unnoticed, it tears free with four kagekuma in monks' robes (all roll Stealth) and fells the tree in a 40-foot cone of its choosing: 8d6 bludgeoning, DC 27 basic Reflex, critical failure immobilized (Escape DC 27). If the PCs strike first, everything rolls Perception and the tree falls in a random direction (+4 to the save). \"Interlopers! Unbelievers! Slay them!\" Xin Yue's face grows from the trunk, cursing the PC who beat her. All fight to destruction.",
    checks: ["DC 38 Perception to spot the faces in the bark", "DC 27 Reflex against the falling tree"]
  },
  {
    id: "D3", key: "ch13-d3", name: "Lord of Winter", level: "Moderate 12", tone: "slate",
    boxed: "This overgrown garden is surrounded by a circular stone wall. Trees grow around the perimeter, while in the center sits an open stone well that's nearly full to the brim with water. Above, storm clouds fill the sky, pelting the area with driving rain and turning the ground into a morass of weeds and mud, while to the south stands a large canopy erected on poles that offers some shelter from the downpour. Below the brightly colored tent rest several colorful blankets, a small table atop which sits a tea set with four silver cups, and a large chair with a golden cushion.",
    creatures: "Argyrzei (as \"Mago Kai\") · akashti (as a dead friend)",
    text: "Karahai's courtyard, disordered. Mud is difficult terrain; anyone ending a turn in the rain rolls DC 27 Fortitude or is enfeebled 2 (enfeebled 2 on a critical failure) to the end of their next turn. The canopy protects fully; the trees give +2.\n\"Mago Kai\", unarmed, sips tea; a dead NPC the PCs were fond of serves. They offer silver cups (a Tea Lore master notes silver is odd for tea) and the cups as gifts, and wave the PCs on to D4, following whoever carries one to strike at the right moment — or join Heh's fight. Refused or attacked, both roll Deception: the argyrzei's body melts away to a headless thing that draws a silver sword from its neck.",
    note: "Drag the \"Mago Kai\" True Form effect onto him when the disguise drops.",
    checks: ["DC 27 Fortitude against the winter rain"],
    treasure: "Four silver teacups, 50 gp each — each carrying the argyrzei's infected silver curse. When the argyrzei dies its gore flows into a +2 greater striking silver weapon of a slashing type a PC favors, also cursed (DC 33 Will)."
  },
  {
    id: "D4", key: "ch13-d4", name: "Spring's Path", level: "Moderate 12", tone: "plum",
    boxed: "Sheer cliff walls stretch in both directions, up to a cloudless night sky above and down into a dizzying cloudy depth below. A ten-foot-wide ledge winds along the cliffs, crossing twice via five-foot-wide natural stone bridges as it winds its way north to a set of wooden doors built into the stone wall. Eerie whispers and distant, mournful cries echo up from the mists below.",
    creatures: "Path maidens (2)",
    text: "The Gossamer Path; the far door is the manor's front door. A fall is 100 feet (DC 25 Reflex to Grab the Edge); DC 30 Athletics to Climb. Two path maidens of Kugaptee's dreaming, wreathed in red butterflies, take the midpoint bridge: \"turn back—what lies beyond this path is not for you!\" — and attack unless the PCs turn back at once. They have Blasphemous Aura and Corrupting Doubt in place of Scorn Fate and Vengeful Frenzy.",
    checks: ["DC 25 Reflex to Grab the Edge"]
  }
];

const CH13_DEN = [
  {
    key: "ch13-den", name: "The Governor's Den", tone: "rust",
    text: "Through D4's doors a haze resolves into C1 of the manor — its walls covered in hundreds of red eyes (Perception +26; if they spot intruders, Heh knows). The PCs can go back south to the Grasp (and walk the Grave again to return) or go on. C3–C8 are empty. Opening any door into the courtyard starts the final encounter."
  },
  {
    key: "ch13-claw", name: "Below Kugaptee's Claw", level: "Varies 12", tone: "plum",
    boxed: "A glistening pool of blood, a bone garden fountain, and clusters of diseased foliage turn the heart of the manor into a nightmare. Barely glimpsed creatures splash in the bloody pond, while red-winged butterflies gather in the foliage. Here and there, familiar looking bodies lie strewn on the ground. Grisly yet well-made lanterns crafted with skinned human faces hang along the edges of the courtyard. The night sky above shines with the light of an immense red eye-shaped moon. At the courtyard's northern end, a wood burl sits on the ground between two reed mats. The roots of the burl twist upward like grasping tendrils, and each glistens with blood.",
    creatures: "Shisagishin nindorus (2 to 4)",
    text: "The burl is Kugaptee's heart. For every soul still shackled, a pair of eyes is impaled on its roots. The bodies are beloved NPCs — fakes, and some are shisagishin in Corpse Shells. Touch one and it uses Burst From Death to Strike, then all roll Stealth; untouched for a minute (or once the courtyard empties), they rise without it. To the death.\nWhen the last falls, the claw flexes and the courtyard trembles.",
    widget: "shisagishin"
  },
  {
    key: "ch13-heh", name: "Heh Shan-Bao Arrives", page: "15speakingwith00", level: "Severe 12", tone: "rust",
    creatures: "Heh Shan-Bao · Unlived Lives (2 unrisen)",
    quote: "And so, you finally stand before me, in the shadow of my lord above. His time of return has come, and there is nothing you can do to stop it, yet still… here you are. By what right do you dare meddle in the affairs of rulers and gods?",
    text: "He enters with two unrisen bearing his face — the governor he might have been, and the scholar. Calm if every eye remains on the burl; barely restraining fury if some are gone. He fights only if the PCs try to leave, attack, or the talk fails.\nInfluence: one round a minute — 1, plus one per freeing-object the party carries (5 at most). Discovery: DC 29 Willowshore Lore, DC 30 Society, DC 32 Perception. Influence: DC 28 Nindoru Lore, DC 30 Religion, DC 32 Society, DC 30 Diplomacy, DC 31 Intimidation, DC 33 Deception.\nResistance: +2 to the DC whenever a PC says his actions harmed the town. Weakness: –2 for a PC visibly carrying a freeing-object; –2 more for everyone if a PC gives him the Fang and Key. Penalty: +2 for a PC visibly carrying the Fang and Key, even if they later hide it — unless it's given to him.\n4: his living memories (the Fang and Key penalty ends). 7: he breaks down in grief — freed, but his soul is Kugaptee's. 10: fierce resolve — the encounter ends.\nShort of 7 when time runs out: \"Die, pretenders, die, and be chained outside the cycle of souls forevermore.\"\nFighting: the unrisen open with Awful Approach on two different PCs; he hangs back with innate spells, then claws, and goes for Steal Soul whenever he can (once, if it fails).",
    checks: ["DC 28 Nindoru Lore to Influence Heh Shan-Bao", "DC 30 Religion to Influence Heh Shan-Bao", "DC 32 Society to Influence Heh Shan-Bao", "DC 30 Diplomacy to Influence Heh Shan-Bao", "DC 31 Intimidation to Influence Heh Shan-Bao", "DC 33 Deception to Influence Heh Shan-Bao"],
    rework: "Redemption now matters more: reach Influence 7 and his freed soul lingers a beat at the finale to shred the Crimson Weaver's opening shield. Nothing changes in the encounter itself. And however his fate resolves, do not run the book's Kugaptee's Final Death — go to the Finale tab.",
    widget: "heh"
  }
];

const CH13_FINALE = [
  {
    key: "ch13-breach", name: "The Breach", page: "15hehshanbaofr00", tone: "bloom",
    text: "The instant Heh Shan-Bao's fate resolves, the courtyard shudders — not from his passing.",
    rework: "Above Kugaptee's half-buried claw, the air splits along a seam of red silk, and Hong Zhinü follows the opened door, exactly as Ren Mei Li warned. She descends spinning a crimson drawing-loom around the claw, already siphoning hair-thin strands of black marrow, and greets the party as the little stewards who have tidied the grave for her.",
    beats: [
      { key: "ch13-breach", label: "The breach staged after his fate resolved, not before", rework: true }
    ]
  },
  {
    key: "ch13-phase1", name: "Phase One — the Crimson Weaver", level: "Severe 12", tone: "rust",
    creatures: "Hong Zhinü (jorogumo, level 13) · jiang-shi (2)",
    rework: "Build her as a level 13 jorogumo — the same chassis as Ren Mei Li's Act 3 echo — plus two jiang-shi for Severe 12. If the party is fresh, drop the minions and make her elite (level 14).\nThe loom is terrain: three red-silk anchor-strands from the claw to the walls, each Hardness 10, 30 HP. While two or more stand, she has fast healing 10 and Web Walks between them — cutting them is the martials' side-objective.\nShe opens with a woven ward: resist 10 physical and 50 temporary HP — unless Heh Shan-Bao was redeemed, in which case his departing soul has already shredded it.\nAt half HP she offers terms: walk away, keep your town, and she'll even leave them the silver princess to serve. Take it, and she completes the siphon — and phase two happens anyway, to her, mid-gloat, with the party standing far too close.",
    widget: "weaver",
    beats: [
      { key: "ch13-phase1", label: "The Crimson Weaver defeated", rework: true }
    ]
  },
  {
    key: "ch13-phase2", name: "Phase Two — the Marrow Wears Her", level: "Severe–Extreme 12", tone: "plum",
    rework: "When she drops, don't end the scene: the drawn marrow recoils into her corpse and Kugaptee pours a fragment of himself in. She rises wrong — reversed joints, eight shadow-limbs, a voice layered over something vast. The party fights a finger of Kugaptee wearing his would-be thief, without breaking the lore that he can't truly die.\nSame chassis, re-armed: full HP restored; immune to mental and poison; in place of charm and venom, void lashes (reach 20 feet, 3d10+10 void) and Marrow Breath (three actions, 60-foot cone, 12d6 void, basic Fortitude, recharge 1d4). No minions, no loom.\nAs she re-rises, give the party one free round: the freed souls' light heals every PC 4d8 and lets them reposition. Every banked edge pays off: the Soul Blessings' +2 saves, the four freeing-objects (each still negates one Sealing pulse), and the silversoul bombs, which treat the vessel as a nindoru.",
    widget: "edges",
    beats: [
      { key: "ch13-bombs", label: "You So-Jin's silversoul bombs used on the vessel", rework: true },
      { key: "ch13-phase2", label: "The vessel destroyed", rework: true }
    ]
  },
  {
    key: "ch13-sealing", name: "The Sealing of Five Seasons", tone: "gold",
    text: "This replaces the book's Kugaptee's Final Death; the four canon pulses are kept, because the Sealing reuses them. If the PCs had all fallen, the claw would slam down and Kugaptee be reborn into Shenmen.",
    rework: "When the vessel falls, Kugaptee's fragment has nowhere to go and the grave convulses. The party has the five anchors and Ren Mei Li's rite. Five rounds: each round one PC Interacts to place the next anchor — spring, summer, autumn, winter, beyond — and the group makes one DC 30 check with Religion, Occultism, Nature or Performance. In each of the first four rounds the matching pulse hits; a freeing-object a PC carries negates it entirely (and vanishes). A failed group check adds 2d6 to that round's pulse. Round five has no pulse: the fifth anchor slides home and the seal shuts.",
    checks: ["DC 30 Religion for the Sealing", "DC 30 Occultism for the Sealing", "DC 30 Nature for the Sealing", "DC 30 Performance for the Sealing"],
    widget: "sealing",
    beats: [
      { key: "ch13-sealing", label: "The Sealing of Five Seasons run — the seal shut", rework: true }
    ]
  },
  {
    key: "ch13-heroine", name: "A Heroine Passes Her Burden", page: "15concludingth00", tone: "moss",
    text: "Mist rolls in over the ruin, and a softly played flute winds through it — a simple song the PCs know in their bones, carrying hope, fear, pride and defiance. DC 25 Arts Lore or Performance: \"The Dusklight Torch\", an old heroic opera about a new generation claiming the light from a fallen predecessor.\nEach PC (the dead included) sees a moment of their own bravery or compassion, then a swordswoman in ancient dress silhouetted against the sunset; she drops her sword and their own hand takes it. DC 20 Perception: Tan Sui-Jing.\nEveryone is fully healed, every condition removed, and the dead return to life. She draws on their experiences to restore the sugi over Kugaptee's grave for generations. Overwhelming weariness — and they wake in the real world, in the governor's manor, now restored in the living world too.",
    checks: ["DC 25 Performance to recognise the song", "DC 20 Perception to recognise Tan Sui-Jing"],
    beats: [
      { key: "ch13-ending", label: "The Dusklight Torch — Tan Sui-Jing restores the party and the tree" }
    ]
  },
  {
    key: "ch13-aftermath", name: "Concluding the Adventure", tone: "gold",
    text: "The Tan Sugi is healthier than ever, its leaves silver after dark; pilgrims begin to come. Lo Kuon, Great Willow and Isori visit if on good terms: Lo Kuon offers the rebuilt Silkwasps as road agents; the omens are gone, though Isori still sees faint disquiet at the edges. The months pass pleasantly, Ren Mei Li keeps her word, and Willowshore becomes whispered of as a sanctuary.\nKugaptee is quiet and dead below the Tan Sugi — but as with every nindoru, he may reincarnate. Ending him entirely would mean a journey into his own mind.",
    rework: "Ren Mei Li keeps every promise — and is now indebted to the party, which unsettles her more than the Weaver ever did. The Silken Court is quietly delighted, and unnerved, that mortals killed one of their own.",
    widget: "aftermath",
    treasure: "The Weaver's hoard: her loom's red silk (a suit of silkweave armor, or three potent crafting components) and her court regalia (a level-12 treasure allotment in jewelry); and her research folio on Kugaptee — dangerous to keep, burn, or trade to Ren Mei Li."
  }
];

/* ------------------------------------------------- treasure and media
   Where this macro's rewards and the module's audio and macros sit. Keys:
   `card:<card>` on a card, `chapter:<ch>` (or another named panel) at the top
   of a view, `landing` for the beds and submacros that belong to no one
   scene. SOG_SPLIT gives a card one toggle per reward instead of one for
   its whole treasure line; SOG_SKIP is treasure that's a shop or a pointer,
   not something to hand over. The ids are shared with the Campaign Status
   Tracker's Treasure tab, so don't rename a key without moving it there. */
const SOG_PREFIX = "spring";
const SOG_ACT = 4;
const SOG_SPLIT = {
  "ch11-lantern": [{ key: "bonus", label: "The Eternal Lantern's skill bonus rises to +2" }],
  "ch11-bell": [{ key: "bell", label: "The warding bell, gifted back by Karahai (only if it was spared)" }],
  "ch11-farewell": [{ key: "gifts", label: "Shinzo's parting gifts — the phoenix fulu holder and its fulus, two greater potency crystals" }],
  "ch11-a7": [{ key: "pills", label: "Six energizing pills (A7b)" }, { key: "drum", label: "Lacquered waist drum (A7c)" }],
  "ch11-camp": [{ key: "chest", label: "The chest — 3,500 sp, 220 gp, 120 gp of jewelry, vanishing coin, wand of soothe" },
                { key: "bell", label: "The jiang-shi bell in spidersilk, under the false bottom" }],
  "ch12-r-winter": [{ key: "ward", label: "Pilgrim's Ward for up to six willing PCs (3+ VP)" }],
  "ch12-r-beyond": [{ key: "sash", label: "Gossamer sash and four doses of sanctified beans" },
                    { key: "scroll", label: "Scroll of sending (only if the offer was refused)" }],
  "ch12-m3": [{ key: "bombs", label: "Three silversoul bombs, the formula, and 500 gp of supplies" }],
  "ch12-fang": [{ key: "gift", label: "Ren Mei Li's gift — one item per VP from 10; all four and the pouch at 14+" }],
  "ch13-c4": [{ key: "safe", label: "The safe — ten silk pouches of 100 gp" }],
  "ch13-c5": [{ key: "crystal", label: "The skyfang crystal" }, { key: "mandala", label: "The meditation mandala (countering charm)" }],
  "ch13-d1": [{ key: "gear", label: "Gurglegut's magical gear (if spared)" }],
  "ch13-d3": [{ key: "weapon", label: "The cursed +2 greater striking silver weapon" }, { key: "teacups", label: "Four silver teacups, 50 gp each (cursed)" }],
  "ch13-aftermath": [{ key: "hoard", label: "The Weaver's hoard — her loom's red silk and court regalia" },
                     { key: "folio", label: "Her research folio on Kugaptee" }]
};
/* C8's "treasure" is the diary and the camellia: a freeing-object (a
   checklist item) and lore, not loot. */
const SOG_SKIP = new Set(["ch13-c8"]);
const SOG_MEDIA = {
  landing: { tracks: ["01 Season of Ghosts Loop"],
    audio: [{ pl: "act.amb", sounds: ["Indoors", "Woods", "Willowshore", "Willowshore Hinterlands"] },
      { pl: "act.amb", sounds: ["Mist Indoors", "Mist Outdoors"] },
      { pl: "a4.sfx", sounds: ["Dense Fog"], note: "Act 4 files it under SFX" },
      { pl: "act.loop", sounds: ["River"] }],
    macros: [{ name: "Change Season", folder: "Submacros" },
      { name: "Change Dynamic Ring and Turn Marker", folder: "Submacros" },
      { name: "Landing Picker", folder: "Submacros" },
      { name: "Roof Control", folder: "Submacros" },
      { name: "Toggle Party Platter (4 Characters)", folder: "Submacros" },
      { name: "Toggle Party Platter (6 Characters)", folder: "Submacros" }] },
  "chapter:ch11": { tracks: ["18 The Plum Knows Before The Cherry Loop", "19 Bridges and Bandits Loop"],
    audio: [{ pl: "a4.amb", sounds: ["Dark Willowshore"] }],
    macros: [{ name: "Reset Willowshore", folder: "Act 4" }] },
  "card:ch11-waking": { audio: [{ pl: "a4.sfx", sounds: ["Mindscape Shift"], note: "as they wake" }] },
  "card:ch11-manor": { audio: [{ pl: "a4.amb", sounds: ["Governors Manor"] }],
    macros: [{ name: "Toggle Governor's Manor", folder: "Act 4", note: "shows the manor on the Willowshore scene" }] },
  "card:ch11-a8": { audio: [{ pl: "a4.sfx", sounds: ["Clouds Of Butterflies"], note: "when he sheds his flesh" }] },
  "card:ch11-rebuild": { audio: [{ pl: "a4.amb", sounds: ["Creek"], note: "the gorge" }] },
  "card:ch11-bridge-fight": { audio: [{ pl: "a4.amb", sounds: ["Creek"], note: "the gorge" }] },
  "card:ch11-camp": { audio: [{ pl: "a4.loop", sounds: ["Coastline"] }],
    macros: [{ name: "The Silkwasp Camp Alert Levels", folder: "Act 4" },
             { group: "The Silkwasp Camp Alert Levels", folder: "Act 4", items: ["Bandits on the Defensive", "Bridge Bandits Defeated", "Night", "Unexpected Visit"] }] },
  "chapter:ch12": { tracks: ["20 The Princess's Web Loop"],
    audio: [{ pl: "a4.amb", sounds: ["Softly Playing Flute"], note: "the yohoi fears it" },
            { pl: "a4.amb", sounds: ["Creaky Building"], guess: true }] },
  "card:ch12-r-winter": { macros: [{ name: "The Algrievers Emerge", folder: "Act 4" },
                                   { group: "Algrievers", folder: "Act 4", items: ["Emerge", "Retreat"] }] },
  "chapter:ch13": { tracks: ["21 Into The Corruption Loop", "22 The Governor's Den Loop"],
    audio: [{ pl: "a4.amb", sounds: ["Below Kugaptees Claw"] }] },
  "card:ch13-grasp": { audio: [{ pl: "a4.sfx", sounds: ["Mindscape Shift"] }, { pl: "a4.amb", sounds: ["Dark Willowshore"] }],
    macros: [{ name: "Willowshore to Kugaptee's Grave", folder: "Act 4", note: "the scene's red lighting" }, { name: "Reset Willowshore", folder: "Act 4" }] },
  "card:ch13-grave": { macros: [{ name: "Kugaptee's Grave Weather Control", folder: "Act 4" },
                                { group: "Kugaptee's Grave Weather Control", folder: "Act 4", items: ["Summer", "Winter", "Other"] }] },
  "card:ch13-d2": { audio: [{ pl: "a4.sfx", sounds: ["Old Tree Falling"] }],
    macros: [{ name: "Sugi Tree Falls", folder: "Act 4", note: "the trunk's fall direction" },
             { group: "Sugi Tree Falls", folder: "Act 4", items: ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "Reset"] }] },
  "card:ch13-claw": { audio: [{ pl: "a4.amb", sounds: ["Below Kugaptees Claw"] }] },
  "card:ch13-phase2": { audio: [{ pl: "a4.sfx", sounds: ["Death Roar", "Demonic Roar"] }] },
  "card:ch13-sealing": { audio: [{ pl: "a4.amb", sounds: ["Kuraptees Rise"] },
    { pl: "a4.sfx", sounds: ["Crashing Arms", "Clouds Of Butterflies", "Demonic Roar", "Death Roar"], note: "pulses 1 to 4, in order" }] }
};

/* ------------------------------------------ shared across Season of Ghosts
   This block is the same in every Season of Ghosts chapter macro; only the
   SOG_* tables above it differ.

   TREASURE. One world setting, `world.sogTreasure`, records what has been
   handed out: `{ "<macro>:<card>[:<item>]": true }`. Each card's treasure
   gets a toggle, and the Campaign Status Tracker's Treasure tab shows the
   same row — it's one value, so ticking either ticks both. Nothing rides on
   it but the reminder, so it toggles freely.

   MEDIA. The Season of Ghosts module's own playlists and macros, placed on
   the card or chapter that wants them. A play button starts and stops that
   sound in the module's playlist (and repaints when it's started from the
   sidebar instead); a macro button runs the module's macro. Ids are the
   module's own, and a name match is the fallback.

   Both are GM-only: nothing here reaches a player board. */
const SOG_TREASURE_KEY = "sogTreasure";
const SOG_TREASURE_ID = `world.${SOG_TREASURE_KEY}`;
function sogRegisterShared() {
  if (!game.settings.settings.has(SOG_TREASURE_ID))
    game.settings.register("world", SOG_TREASURE_KEY, { scope: "world", config: false, type: Object, default: null });
}
const sogLedger = () => game.settings.get("world", SOG_TREASURE_KEY) ?? {};
const sogHanded = (id) => !!sogLedger()[id];
async function sogToggleHanded(id) {
  if (!game.user.isGM || !id) return;
  const L = sogLedger();
  if (L[id]) delete L[id]; else L[id] = true;
  await game.settings.set("world", SOG_TREASURE_KEY, L);
}
/* A card's rewards: its split list when it has one, otherwise one toggle for
   the whole treasure line. */
function sogRewards(key, hasTreasure) {
  if (SOG_SPLIT[key]) return SOG_SPLIT[key].map(r => ({ id: `${SOG_PREFIX}:${key}:${r.key}`, label: r.label }));
  if (hasTreasure && !SOG_SKIP.has(key)) return [{ id: `${SOG_PREFIX}:${key}`, label: null }];
  return [];
}
function sogHandouts(rewards, ro) {
  if (!game.user.isGM || !rewards?.length) return "";
  return `<div class="sog-handouts">${rewards.map(r => {
    const on = sogHanded(r.id);
    return `<button type="button" class="sog-handout ${on ? "on" : ""}" data-act="sog-handout" data-id="${esc(r.id)}" ${ro ? "disabled" : ""}
      title="${on ? "Handed out — click to take the tick back" : "Tick once the party has it"}. The same value as the Campaign Status Tracker's Treasure tab.">
      <i class="fa-${on ? "solid fa-square-check" : "regular fa-square"}"></i>${esc(r.label ?? (on ? "Handed out" : "Not handed out yet"))}</button>`;
  }).join("")}</div>`;
}
const sogCardRewards = (key, hasTreasure, ro) => sogHandouts(sogRewards(key, hasTreasure), ro);

/* The module's playlists, by the ids it ships with. `act.*` means this
   macro's own act. */
const SOG_PLAYLISTS = {
  a1: { amb: "HgqDtdyAVJFT3Dr1", sfx: "PM69203E3Y3UrHfA", loop: "zLGowtHaJW7U2VZM" },
  a2: { amb: "jXKZ6O8NnYJaazKE", sfx: "kcrfM86DAcpOfBrs", loop: "e2Pf6JGVba202cFB" },
  a3: { amb: "gTnkl7DUH19mzyJj", sfx: "0GuH1kstxWaqGSJx", loop: "TmxsF1RiQJ0m8o5M", seance: "h82ztCVRXELKQI8K" },
  a4: { amb: "FGK5jsYreqU1AR5o", sfx: "Mv66f1NNleR53M5o", loop: "xYqkP4IEtZhyaILa" },
  track: "7AzVaYG1M2yMtzIu", looped: "dbfW0zvQ2tf5VOCx"
};
const SOG_PLAYLIST_NAMES = {
  "a1.amb": "Act 1 · Ambience", "a1.sfx": "Act 1 · SFX", "a1.loop": "Act 1 · Loop",
  "a2.amb": "Act 2 · Ambiance", "a2.sfx": "Act 2 · SFX", "a2.loop": "Act 2 · Loop",
  "a3.amb": "Act 3 · Ambiances", "a3.sfx": "Act 3 · SFX", "a3.loop": "Act 3 · Loop", "a3.seance": "Act 3 · Seance",
  "a4.amb": "Act 4 · Ambience", "a4.sfx": "Act 4 · SFX", "a4.loop": "Act 4 · Loop",
  "track": "Soundtrack", "looped": "Looped Soundtrack"
};
const sogRef = (ref) => String(ref ?? "").replace(/^act\./, `a${SOG_ACT}.`);
function sogFindSound(ref, name) {
  ref = sogRef(ref);
  const [group, kind] = ref.split(".");
  const id = kind ? SOG_PLAYLISTS[group]?.[kind] : SOG_PLAYLISTS[group];
  const named = (pl) => pl?.sounds?.getName?.(name) ?? [...(pl?.sounds ?? [])].find(x => x.name === name) ?? null;
  const byId = id ? game.playlists?.get?.(id) : null;
  let sound = named(byId);
  if (sound) return { playlist: byId, sound };
  const label = (SOG_PLAYLIST_NAMES[ref] ?? "").split(" · ").pop();
  const lists = [...(game.playlists ?? [])];
  for (const pl of lists) { if (label && pl.name !== label) continue; sound = named(pl); if (sound) return { playlist: pl, sound }; }
  for (const pl of lists) { sound = named(pl); if (sound) return { playlist: pl, sound }; }
  return { playlist: null, sound: null };
}
/* Toggle, not play: the button stops what it started. */
async function sogToggleSound(ref, name) {
  const { playlist, sound } = sogFindSound(ref, name);
  if (!sound) return ui.notifications.warn(`No sound named "${name}" in ${SOG_PLAYLIST_NAMES[sogRef(ref)] ?? ref}, or anywhere else in this world's playlists.`);
  if (sound.playing) await playlist.stopSound(sound); else await playlist.playSound(sound);
}
function sogFindMacro(name, folder) {
  const all = [...(game.macros ?? [])].filter(m => m.name === name);
  return all.find(m => m.folder?.name === folder) ?? all[0] ?? null;
}
async function sogRunMacro(name, folder) {
  const m = sogFindMacro(name, folder);
  if (!m) return ui.notifications.warn(`No macro named "${name}" in this world — import the Season of Ghosts module's macro folders.`);
  return m.execute();
}
function sogMedia(media) {
  if (!game.user.isGM || !media) return "";
  const tracks = media.tracks ?? [], audio = media.audio ?? [], macros = media.macros ?? [];
  if (!tracks.length && !audio.length && !macros.length) return "";
  const play = (ref, n) => {
    const { sound } = sogFindSound(ref, n), on = !!sound?.playing;
    return `<button type="button" class="sog-play ${on ? "on" : ""} ${sound ? "" : "gone"}" data-act="sog-sound" data-pl="${esc(ref)}" data-s="${esc(n)}"
      title="${!sound ? `Not found in this world: ${esc(n)}` : on ? `Stop ${esc(n)}` : `Play ${esc(n)}`}">
      <i class="fa-solid ${!sound ? "fa-volume-xmark" : on ? "fa-stop" : "fa-play"}"></i>${esc(n)}</button>`;
  };
  const run = (name, folder) => {
    const found = !!sogFindMacro(name, folder);
    return `<button type="button" class="sog-play sog-macro ${found ? "" : "gone"}" data-act="sog-macro" data-name="${esc(name)}" data-folder="${esc(folder ?? "")}"
      title="${found ? `Run the module's ${esc(name)} macro` : `Not found in this world: ${esc(name)}`}"><i class="fa-solid fa-bolt"></i>${esc(name)}</button>`;
  };
  const row = (icon, buttons, sub) => `<div class="sog-mrow"><i class="fa-solid ${icon}"></i><span class="sog-mbody">
    <span class="sog-plays">${buttons}</span>${sub ? `<small>${sub}</small>` : ""}</span></div>`;
  return `<div class="sog-media">
    ${tracks.map(n => row("fa-music", play("looped", n), "Looped Soundtrack")).join("")}
    ${audio.map(a => row("fa-volume-high", a.sounds.map(n => play(a.pl, n)).join(""),
      `${SOG_PLAYLIST_NAMES[sogRef(a.pl)] ?? a.pl}${a.note ? ` · ${a.note}` : ""}${a.guess ? " · placed by guess" : ""}`)).join("")}
    ${macros.map(m => m.items
      ? row("fa-bolt", m.items.map(n => run(n, m.folder)).join(""), `${m.group} · ${m.folder} macros${m.note ? ` · ${m.note}` : ""}`)
      : row("fa-bolt", run(m.name, m.folder), `${m.folder} macro${m.note ? ` · ${m.note}` : ""}`)).join("")}
  </div>`;
}
/* A panel of media for a whole chapter or tab. */
const sogMediaPanel = (key, title) => {
  const body = sogMedia(SOG_MEDIA[key]);
  return body ? `<section class="panel sog-mediapanel" style="--tone:var(--slate)"><h3>Audio and module macros <small>${title}</small></h3>${body}</section>` : "";
};
const sogCardMedia = (key) => sogMedia(SOG_MEDIA[`card:${key}`]);

/* The three button kinds above, for the macro's own click handler. */
function sogClick(a, btn) {
  if (a === "sog-handout") { sogToggleHanded(btn.dataset.id); return true; }
  if (a === "sog-sound") { sogToggleSound(btn.dataset.pl, btn.dataset.s); return true; }
  if (a === "sog-macro") { sogRunMacro(btn.dataset.name, btn.dataset.folder || null); return true; }
  return false;
}
/* Repaint on a treasure tick from anywhere (the tracker included) and on any
   sound starting or stopping. Re-registered per run, so a reopened window is
   the one that hears it. */
function sogWire(engine) {
  const slot = `__sogShared_${SOG_PREFIX}`, old = globalThis[slot];
  if (old) for (const [hook, id] of old) Hooks.off(hook, id);
  const repaint = () => engine.render();
  globalThis[slot] = [
    ["updateSetting", Hooks.on("updateSetting", (setting) => { if (setting.key === SOG_TREASURE_ID) repaint(); })],
    ["updatePlaylistSound", Hooks.on("updatePlaylistSound", repaint)],
    ["updatePlaylist", Hooks.on("updatePlaylist", repaint)]
  ];
}
const SOG_CSS = (root) => `
  .${root} .sog-handouts { display:flex; flex-wrap:wrap; gap:.3rem; margin:.1rem 0 .5rem; }
  .${root} button.sog-handout { display:inline-flex; align-items:center; gap:.35rem; height:auto; width:auto; line-height:1.3;
    padding:.2rem .55rem; font-size:.74rem; border:1px dashed var(--gold, var(--ember)); border-radius:3px; background:none; color:var(--ink); cursor:pointer; }
  .${root} button.sog-handout.on { border-style:solid; background:var(--stripe); color:var(--muted); }
  .${root} button.sog-handout.on i { color:var(--moss); }
  .${root} button.sog-handout:not(.on) i { color:var(--gold, var(--ember)); }
  .${root} .sog-media { margin:.3rem 0 .45rem; display:flex; flex-direction:column; gap:.25rem; }
  .${root} .sog-mrow { display:flex; gap:.45rem; align-items:flex-start; font-size:.76rem; }
  .${root} .sog-mrow > i { color:var(--muted); width:1rem; text-align:center; margin-top:.3rem; }
  .${root} .sog-mbody { display:flex; flex-direction:column; gap:.1rem; }
  .${root} .sog-mbody small { color:var(--muted); font-size:.7rem; }
  .${root} .sog-plays { display:flex; flex-wrap:wrap; gap:.25rem; }
  .${root} button.sog-play { display:inline-flex; align-items:center; gap:.3rem; height:auto; width:auto; line-height:1.3;
    padding:.15rem .5rem; font-size:.74rem; font-weight:600; border:1px solid var(--line); border-radius:3px; background:var(--card); color:var(--ink); cursor:pointer; }
  .${root} button.sog-play:hover { background:var(--hover); }
  .${root} button.sog-play.on { background:var(--slate); border-color:var(--slate); color:var(--paper); }
  .${root} button.sog-play.gone { opacity:.55; font-weight:400; }
  .${root} button.sog-play i { font-size:.65rem; }
  .${root} .sog-mediapanel h3 { color:var(--ink); }
`;


/* ------------------------------------------------------------- run order
   The act in the order it's played. The chapter tabs group cards by place;
   this is the sequence, which matters most in Chapter 12, where Ren Mei Li's
   weekly visits pace the rites and the murders land between them.

   Act 4 isn't pinned to calendar days the way winter is — the book counts in
   "a few days later" and "a week" — so `when` is relative, and the dates slide
   to wherever the table is. `kind` follows the campaign timeline's legend:
   main story, decision or social, side or optional, combat, and rework.
   A step is done when its own test says so, or when every card it names is
   marked done; the first step not done is where the table is. Optional
   steps and `background` ones (the bridge's months of building) never hold
   that marker — they show as optional or running beside it instead. */
const STEPS = [
  { ch: "ch11", when: "Before play", kind: "main", title: "Level to 10, offer the ancestry swap, total the Fate",
    cards: ["ch11-fate", "ch11-waking"], done: t => t.beat("ch11-fate", "ch11-fate-told") },
  { ch: "ch11", when: "Day 1", kind: "main", title: "Waking in Willowshore — the lantern, the bell, the roads beyond",
    cards: ["ch11-waking", "ch11-lantern", "ch11-bell", "ch11-beyond"] },
  { ch: "ch11", when: "Day 1, before twilight", kind: "combat", title: "The ruined manor and the false governor",
    note: "The town elder asks them to look before their first day back ends. Get the authorization pass first.",
    cards: ["ch11-manor", "ch11-a1", "ch11-a2", "ch11-a3", "ch11-a4", "ch11-a5", "ch11-a6", "ch11-a7", "ch11-a8", "ch11-elder"],
    done: t => t.beat("ch11-a8", "ch11-a8-false") },
  { ch: "ch11", when: "A few days after waking", kind: "main", title: "Shinzo's farewell — the last chance to shop",
    cards: ["ch11-farewell"], done: t => t.beat("ch11-farewell", "ch11-farewell") },
  { ch: "ch11", when: "After the manor", kind: "main", title: "To Karahai — the bell is gifted on the first visit",
    cards: ["ch11-karahai"] },
  { ch: "ch11", when: "3 days of downtime", kind: "decision", title: "Rebuild Karahai Bridge — plan it and roll",
    cards: ["ch11-rebuild"], done: t => !!t.s.bridge.degree },
  { ch: "ch11", when: "About a week into the work", kind: "combat", rework: true, title: "Silkwasps at the Bridge — pay Lo Kuon, or fight",
    cards: ["ch11-bridge-fight"], done: t => !!t.s.bridge.outcome },
  { ch: "ch11", when: "Days (if they fought) or weeks (if they paid)", kind: "side", title: "Bandit trouble, and asking about the Silkwasps in Karahai",
    cards: ["ch11-dealing"] },
  { ch: "ch11", when: "When they find it — before Chapter 13", kind: "combat", rework: true, title: "The Silkwasp camp, Hong Meigui, and the three clues",
    note: "Left alone, Hong Meigui storms the town at the start of Chapter 13 as an Extreme encounter.",
    cards: ["ch11-camp", "ch11-clues"], done: t => t.beat("ch11-camp", "ch11-camp-cleared") },
  { ch: "ch11", when: "1–3 months after the roll", kind: "main", background: true, title: "Karahai Bridge finished",
    note: "A critical success finishes it before Chapter 12; a failure probably not before the Adventure Path ends. This runs alongside Chapter 12 — don't wait for it.",
    cards: ["ch11-rebuild"], done: t => t.beat("ch11-rebuild", "ch11-bridge-built") },

  { ch: "ch12", week: 0, when: "Week 0", kind: "decision", title: "Amai, the feline emissary — tea in seven days",
    cards: ["ch12-amai"], done: t => t.beat("ch12-amai", "ch12-amai") },
  { ch: "ch12", week: 0, when: "The seven days", kind: "side", title: "Preparing for her visit, and asking about her in Karahai",
    cards: ["ch12-prep"] },
  { ch: "ch12", week: 1, when: "Week 1 — her first visit", kind: "decision", rework: true, title: "Meeting the Princess — the stewardship offer, and who is coming",
    cards: ["ch12-meeting", "ch12-requests"], done: t => t.beat("ch12-requests", "ch12-agreed") },
  { ch: "ch12", week: 2, when: "Week 2 — she returns for the show", kind: "decision", rework: true, title: "Event 1 · Bright Spring Bird — the performance",
    cards: ["ch12-r-spring"], done: t => t.s.rites.spring.done },
  { ch: "ch12", week: 3, when: "Week 3 — she returns for the display", kind: "decision", rework: true, title: "Event 2 · Fiery Flowers — Moon Marsh, Isori, the fireworks",
    cards: ["ch12-r-summer"], done: t => t.s.rites.summer.done },
  { ch: "ch12", week: 3, when: "Weeks 3–4 — on the way to the grove", kind: "combat", rework: true, title: "Event 3 · Sweet Fruits — the khravgodons and the apple grove",
    cards: ["ch12-r-autumn"], done: t => t.s.rites.autumn.done },
  { ch: "ch12", week: 3, when: "While they're at the grove", kind: "main", rework: true, title: "Event 4 · The first murder — Kazuma Oono",
    note: "Found as they return. Restoring the grove and investigating run side by side.",
    cards: ["ch12-m1", "ch12-yohoi", "ch12-trouble"], done: t => t.beat("ch12-m1", "ch12-m1-lead") || t.prevented("m1") },
  { ch: "ch12", week: 4, when: "Week 4 — she returns", kind: "combat", rework: true, title: "Event 5 · Spiced Tea — Whisperweb Shrine and the algrievers",
    cards: ["ch12-r-winter"], done: t => t.s.rites.winter.done },
  { ch: "ch12", week: 4, when: "Found on the return from Whisperweb", kind: "main", rework: true, title: "Event 6 · The second murder — Elizeth Candora",
    note: "The curfew starts: –1 to Earn Income and Gather Information in town.",
    cards: ["ch12-m2"], done: t => t.beat("ch12-m2", "ch12-m2-flute") || t.prevented("m2") },
  { ch: "ch12", week: 5, when: "Week 5 — she returns for tea", kind: "decision", rework: true, title: "Event 7 · The Final Season — the oath, and the Gossamer Path",
    cards: ["ch12-r-beyond"], done: t => t.s.rites.beyond.done },
  { ch: "ch12", week: 5, when: "After the Path, before her last visit", kind: "main", title: "Event 8 · The third murder — You So-Jin",
    cards: ["ch12-m3"], done: t => t.beat("ch12-m3", "ch12-m3-bombs") || t.prevented("m3") },
  { ch: "ch12", week: 6, when: "Week 6 — her last visit", kind: "main", rework: true, title: "The Fang and Key — the party become stewards",
    cards: ["ch12-fang"], done: t => t.beat("ch12-fang", "ch12-fang") },
  { ch: "ch12", when: "Any time — optional", kind: "side", title: "The Un-Weavers",
    cards: ["ch12-unweavers"] },

  { ch: "ch13", when: "Once they're stewards", kind: "main", title: "The restored manor — the four freeing-objects, and Ithiniak at the door",
    note: "No hard timer from here, but if they dawdle Heh kills again. A month is plenty.",
    cards: ["ch13-restored", "ch13-c1", "ch13-c2", "ch13-c3", "ch13-c4", "ch13-c5", "ch13-c6", "ch13-c7", "ch13-c8"] },
  { ch: "ch13", when: "Through the door", kind: "main", rework: true, title: "Kugaptee's Grasp — free the three chained souls, in any order",
    cards: ["ch13-grasp", "ch13-curios", "ch13-chained", "ch13-oono", "ch13-elizeth", "ch13-sojin"], done: t => t.soulsFreed >= 3 },
  { ch: "ch13", when: "Toward the claw — in order", kind: "combat", title: "Kugaptee's Grave — D1 summer, D2 fall, D3 winter, D4 spring",
    cards: ["ch13-grave", "ch13-d1", "ch13-d2", "ch13-d3", "ch13-d4"] },
  { ch: "ch13", when: "Through D4's door", kind: "combat", title: "The Governor's Den — the shisagishin, then Heh Shan-Bao: redeem or fight",
    cards: ["ch13-den", "ch13-claw", "ch13-heh"] },
  { ch: "ch13", when: "The instant his fate resolves", kind: "combat", rework: true, title: "The Breach — the Crimson Weaver, then the marrow wears her",
    note: "Do not run the book's Kugaptee's Final Death.",
    cards: ["ch13-breach", "ch13-phase1", "ch13-phase2"], done: t => t.beat("ch13-phase2", "ch13-phase2") },
  { ch: "ch13", when: "When the vessel falls", kind: "main", rework: true, title: "The Sealing of Five Seasons — five rounds, five anchors",
    cards: ["ch13-sealing"], done: t => t.beat("ch13-sealing", "ch13-sealing") },
  { ch: "ch13", when: "The end", kind: "main", title: "A Heroine Passes Her Burden, and the aftermath",
    cards: ["ch13-heroine", "ch13-aftermath"], done: t => t.beat("ch13-heroine", "ch13-ending") }
];
const KINDS = {
  main: { label: "Story", tone: "moss" }, decision: { label: "Decision", tone: "ember" },
  side: { label: "Optional", tone: "muted" }, combat: { label: "Combat", tone: "rust" }
};
/* The step a card belongs to, for the chip on its header — its first step. */
const stepOfCard = (key) => { const i = STEPS.findIndex(x => x.cards.includes(key)); return i < 0 ? null : i + 1; };
const subOfCard = (key) => {
  const M = { ch11: { return: CH11_RETURN, manor: CH11_MANOR, bandits: CH11_BANDITS },
    ch12: { princess: CH12_PRINCESS, rites: CH12_RITES, murders: CH12_MURDERS, fang: CH12_FANG },
    ch13: { manor: CH13_MANOR, grasp: CH13_GRASP, grave: CH13_GRAVE, den: CH13_DEN, finale: CH13_FINALE } };
  for (const [ch, subs] of Object.entries(M)) for (const [sub, arr] of Object.entries(subs))
    if (arr.some(c => c.key === key)) return { ch, sub };
  return null;
};

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "spring", ctab: { ch11: "return", ch12: "princess", ch13: "manor" }, pcs,
    xp: 0,
    cleared: {},          // card key -> true
    beats: {},            // card key -> { beat key: 1 }
    fate: { crit: false, pop: null, adjust: 0, granted: 0 },
    bridge: { degree: null, hits: 0, outcome: null },
    meetingVp: 0,
    rites: { spring: { vp: 0, done: false }, summer: { vp: 0, done: false }, autumn: { vp: 0, done: false },
             winter: { vp: 0, done: false }, beyond: { vp: 0, done: false } },
    clues: {},            // investigation key -> degree
    souls: { m1: null, m2: null, m3: null },   // degree of Free Shackled Soul
    heh: { influence: 0, round: 0, fangGiven: false, fought: false },
    weaver: { strands: 0, bargain: false },
    sealing: {},          // round -> "pass" | "fail"
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
  sogRegisterShared();
  for (const id of [SPR_ID, DOWNTIME_ID, WINTER_ID, SUMMER_ID]) {
    if (game.settings.settings.has(id)) continue;
    const [ns, key] = id.split(".");
    game.settings.register(ns, key, { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const readSetting = (id) => { try { return game.settings.get("world", id.split(".")[1]) ?? null; } catch { return null; } };

/* ------------------------------------------------------------- the journal
   Each chapter is a journal entry in the Season of Ghosts module with a fixed
   id. A card resolves from its area code (the module builds page ids as
   `<ordinal><area code><slug>`) or an exact page id. Nothing here is required:
   the entry resolves by id, then name, then the compendiums, and without the
   adventure in the world no link renders at all. */
const jnorm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
function journalEntry(ch) {
  const meta = CHAPTERS[ch].journal;
  const byId = game.journal?.get?.(meta.id);
  if (byId) return byId;
  const want = jnorm(meta.name), all = [...(game.journal ?? [])];
  return all.find(j => jnorm(j.name) === want) ?? all.find(j => jnorm(j.name).endsWith(want)) ?? null;
}
async function journalDoc(ch) {
  const local = journalEntry(ch);
  if (local) return local;
  const meta = CHAPTERS[ch].journal, want = jnorm(meta.name);
  for (const pack of game.packs ?? []) {
    if (pack.documentName !== "JournalEntry") continue;
    const hit = pack.index.get?.(meta.id) ?? [...pack.index].find(e => jnorm(e.name) === want);
    if (hit) return pack.getDocument(hit._id);
  }
  return null;
}
function journalPage(entry, ch, ref) {
  if (!ref) return null;
  const pages = entry?.pages?.contents ?? entry?.pages ?? [];
  if (/^\d/.test(ref)) return pages.find(p => p.id === ref) ?? null;
  const head = `${CHAPTERS[ch].journal.ord}${ref}`.toLowerCase();
  return pages.find(p => p.id.toLowerCase().startsWith(head) && !/\d/.test(p.id.charAt(head.length))) ?? null;
}
async function openJournal(ch, ref) {
  const meta = CHAPTERS[ch].journal;
  const entry = await journalDoc(ch);
  if (!entry) return ui.notifications.warn(`No journal found for "${meta.name}". Looked for the id ${meta.id}, then that name in the journal directory and the compendiums.`);
  const page = journalPage(entry, ch, ref);
  entry.sheet.render(true, page ? { pageId: page.id } : {});
}

/* ----------------------------------------------------------------- engine */
const ALL_CARDS = () => [...CH11_RETURN, ...CH11_MANOR, ...CH11_BANDITS, ...CH12_PRINCESS, ...CH12_RITES,
  ...CH12_MURDERS, ...CH12_FANG, ...CH13_MANOR, ...CH13_GRASP, ...CH13_GRAVE, ...CH13_DEN, ...CH13_FINALE];
const cardByKey = (k) => ALL_CARDS().find(c => c.key === k) ?? null;
const chapterOf = (k) => k.startsWith("ch11") ? "ch11" : k.startsWith("ch12") ? "ch12" : "ch13";

/* The four freeing-objects, in the Sealing's pulse order. */
const LINKS = [
  { key: "letter", card: "ch13-c4", beat: "ch13-letter", label: "his parents' letter", pulse: "The World Trembles",
    dmg: "5d6 bludgeoning, DC 30 basic Reflex", season: "spring" },
  { key: "portrait", card: "ch13-c2", beat: "ch13-portrait", label: "Ok Jinju's portrait", pulse: "The Flesh Tears",
    dmg: "5d6 slashing, DC 30 basic Fortitude", season: "summer" },
  { key: "sages", card: "ch13-c4", beat: "ch13-sages", label: "The Wisdom of the Seven Sages", pulse: "The Mind Recoils",
    dmg: "5d6 mental, DC 30 basic Will", season: "autumn" },
  { key: "camellia", card: "ch13-c8", beat: "ch13-camellia", label: "the camellia and ribbon", pulse: "The Final Death",
    dmg: "5d6 void, DC 30 basic Fortitude, Reflex or Will (the PC's choice)", season: "winter" }
];
const SOUL_SAVE = { m1: "Will", m2: "Reflex", m3: "Fortitude" };

class Spring {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 60); }
  async save() { if (this.editable) await game.settings.set(SPR_NS, SPR_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  /* ----- what earlier acts left behind (read only) ----- */
  get downtime() { return readSetting(DOWNTIME_ID); }
  get winter() { return readSetting(WINTER_ID); }
  winterBeat(card, beat) { return !!this.winter?.beats?.[card]?.[beat]; }
  get population() { return this.s.fate.pop ?? this.winter?.population ?? null; }
  get bellState() {
    if (this.winterBeat("ch10-after-bell", "ch10-after-bell-spared")) return "spared";
    if (this.winterBeat("ch10-after-bell", "ch10-after-bell-destroyed")) return "destroyed";
    return null;
  }

  /* ----- Willowshore's Fate ----- */
  get fate() {
    const p = this.downtime?.pools ?? null;
    const base = p ? (p.hope ?? 0) + (p.food ?? 0) + (p.security ?? 0) : 0;
    const pop = this.population;
    const total = base + (this.s.fate.adjust ?? 0) + (this.s.fate.crit ? 12 : 0) + (pop != null && pop >= 100 ? 4 : 0);
    const tier = total <= 0 ? 0 : total <= 4 ? 1 : total <= 12 ? 2 : 3;
    return { pools: p, base, pop, total, tier, xp: [0, 10, 60, 120][tier] };
  }
  setFate(field, value) {
    this.s.fate[field] = value;
    this.log(`Fate — ${field}: ${value}.`);
    this.touch();
  }
  /* The tier's XP is granted once and stored, so taking it back is exact even
     if the points have moved since. */
  toggleFateXp() {
    const F = this.s.fate;
    if (F.granted) { this.s.xp -= F.granted; this.log(`Fate XP taken back (${F.granted}).`); F.granted = 0; }
    else { const xp = this.fate.xp; F.granted = xp; this.s.xp += xp; if (xp) ui.notifications.info(`Award ${xp} XP.`); this.log(`Fate XP granted (${xp}).`); }
    this.touch();
  }

  /* ----- beats and cleared ----- */
  beat(card, key) { return !!this.s.beats[card]?.[key]; }
  toggleBeat(card, key) {
    const def = cardByKey(card)?.beats?.find(b => b.key === key);
    const B = (this.s.beats[card] ??= {});
    const on = !!B[key];
    B[key] = on ? false : 1;
    if (def?.xp) { this.s.xp += on ? -def.xp : def.xp; if (!on) ui.notifications.info(`Award ${def.xp} XP.`); }
    this.log(`${card} — ${def?.label ?? key}: ${on ? "undone" : "done"}.`);
    this.touch();
  }
  toggleCleared(key) {
    this.s.cleared[key] = !this.s.cleared[key];
    this.touch();
  }

  /* ----- the bridge ----- */
  setBridge(field, value) {
    const B = this.s.bridge;
    if (field === "hits") B.hits = Math.max(0, Math.min(5, (B.hits ?? 0) + value));
    else B[field] = B[field] === value ? null : value;
    this.touch();
  }

  /* ----- the rites ----- */
  setVp(rite, d) {
    if (rite === "meeting") this.s.meetingVp = Math.max(0, Math.min(6, (this.s.meetingVp ?? 0) + d));
    else { const R = this.s.rites[rite]; R.vp = Math.max(0, Math.min(4, (R.vp ?? 0) + d)); }
    this.touch();
  }
  toggleRite(rite) {
    const R = this.s.rites[rite];
    R.done = !R.done;
    const xp = this.riteXp(rite, true);
    if (R.done && xp) ui.notifications.info(`Award ${xp} XP.`);
    this.log(`${RITES[rite].label}: ${R.done ? "done" : "reopened"}.`);
    this.touch();
  }
  riteXp(rite, ignoreDone = false) {
    const R = this.s.rites[rite], D = RITES[rite];
    if (!R || (!R.done && !ignoreDone)) return 0;
    return R.vp >= 4 ? D.xp4 : R.vp >= 1 ? D.xp1 : 0;
  }
  get totalVp() { return Object.keys(RITES).reduce((n, k) => n + (this.s.rites[k]?.vp ?? 0), 0); }
  get ritesDone() { return Object.keys(RITES).filter(k => this.s.rites[k]?.done).length; }

  /* ----- the murders ----- */
  setClue(inv, deg) {
    this.s.clues[inv] = this.s.clues[inv] === deg ? null : deg;
    this.touch();
  }
  prevented(m) { const c = { m1: "ch12-m1", m2: "ch12-m2", m3: "ch12-m3" }[m]; return this.beat(c, `${c}-prevented`); }
  tokenKept(m) {
    return { m1: this.beat("ch12-m1", "ch12-m1-token"), m2: this.beat("ch12-m2", "ch12-m2-flute"),
             m3: this.beat("ch12-m3", "ch12-m3-bombs") }[m] || this.prevented(m);
  }

  /* ----- the shackled souls ----- */
  setSoul(m, deg) {
    this.s.souls[m] = this.s.souls[m] === deg ? null : deg;
    const freed = ["cs", "s"].includes(this.s.souls[m]);
    if (freed) ui.notifications.info(`Award 80 XP — and +2 status to ${SOUL_SAVE[m]} saves.`);
    this.log(`${MURDERS[m].victim}'s soul: ${this.s.souls[m] ? DEG_LABEL[this.s.souls[m]] : "cleared"}.`);
    this.touch();
  }
  soulFreed(m) { return this.prevented(m) || ["cs", "s"].includes(this.s.souls[m]); }
  get soulsFreed() { return ["m1", "m2", "m3"].filter(m => this.soulFreed(m)).length; }
  soulXp() { return ["m1", "m2", "m3"].filter(m => this.soulFreed(m)).length * 80; }

  /* ----- Heh Shan-Bao ----- */
  linkFound(L) { return this.beat(L.card, L.beat); }
  get linksFound() { return LINKS.filter(L => this.linkFound(L)).length; }
  get hehRounds() { return 1 + this.linksFound; }
  setHeh(field, d) {
    const H = this.s.heh;
    if (field === "influence") H.influence = Math.max(0, Math.min(10, H.influence + d));
    else if (field === "round") H.round = Math.max(0, Math.min(this.hehRounds, H.round + d));
    else H[field] = !H[field];
    this.touch();
  }
  get redeemed() { return this.s.heh.influence >= 7; }

  /* ----- the finale ----- */
  setWeaver(field, d) {
    const W = this.s.weaver;
    if (field === "strands") W.strands = Math.max(0, Math.min(3, W.strands + d));
    else W[field] = !W[field];
    this.touch();
  }
  setSeal(round, r) {
    this.s.sealing[round] = this.s.sealing[round] === r ? null : r;
    this.touch();
  }

  stepDone(st) {
    if (st.done?.(this)) return true;
    return st.cards.every(k => this.s.cleared[k]);
  }
  get currentStep() {
    const i = STEPS.findIndex(x => !x.background && x.kind !== "side" && !this.stepDone(x));
    return i < 0 ? STEPS.length : i;
  }

  get totalXp() {
    return this.s.xp + Object.keys(RITES).reduce((n, k) => n + this.riteXp(k), 0) + this.soulXp();
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("To Bloom Below the Web reset.");
    this.touch();
  }

  /* ----- chat ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "slate") {
    const C = { rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12",
                bloom: "#9a4566", silver: "#5f6b73", muted: "#6d6052" };
    await ChatMessage.create({
      content: `<div style="background:#efe6d8;color:#241c18;border:1px solid #b9a687;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.slate};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "To Bloom Below the Web" }
    });
  }
  postArea(card) {
    if (!card) return;
    const read = card.boxed ?? card.quote;
    if (!read) return ui.notifications.warn("No read-aloud text on this card.");
    const body = `<p style="margin:0 0 6px;font-style:italic">${card.boxed ?? ""}</p>` +
      (card.boxed && card.quote ? `<p style="margin:0">“${card.quote}”</p>` : !card.boxed ? `<p style="margin:0">“${card.quote}”</p>` : "");
    return this.postCard(card.level || CHAPTERS[chapterOf(card.key)].act, `${card.id ? card.id + ". " : ""}${card.name}`, body, card.tone);
  }
  postChecks(card) {
    if (!card?.checks?.length) return ui.notifications.warn("No checks recorded for this card.");
    return this.postCard("Checks", `${card.id ? card.id + ". " : ""}${card.name}`,
      `<ul style="margin:0;padding-left:1.1em">${card.checks.map(c => `<li style="margin-bottom:4px">${linkify(c)}</li>`).join("")}</ul>`, card.tone);
  }
  /* Player-facing: where spring stands, no targets and no future events. */
  postStatus() {
    const done = Object.keys(RITES).filter(k => this.s.rites[k]?.done).map(k => RITES[k].label);
    const bits = [];
    if (this.beat("ch11-a8", "ch11-a8-false")) bits.push("The false governor is gone from the manor.");
    if (this.beat("ch11-rebuild", "ch11-bridge-built")) bits.push("Karahai Bridge stands again.");
    if (done.length) bits.push(`Treasures offered to Ren Mei Li: ${done.join(", ")}.`);
    if (this.beat("ch12-fang", "ch12-fang")) bits.push("The party are Willowshore's stewards.");
    return this.postCard("Act 4", "To Bloom Below the Web",
      `<p style="margin:0">Spring in the living world.</p>${bits.length ? `<ul style="margin:6px 0 0;padding-left:1.1em">${bits.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}`, "bloom");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;
const TONES = ["rust", "ember", "moss", "slate", "plum", "gold", "bloom", "silver", "muted"];
const tone = (t) => TONES.includes(t) ? t : "muted";

class TBWApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "tbw-console", tag: "div", classes: ["tbw-console"],
    position: { width: 960, height: "auto" },
    window: { title: "To Bloom Below the Web", icon: "fa-solid fa-spider", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "tbw-console", classes: ["tbw-console"], title: "To Bloom Below the Web",
      width: 960, height: "auto", resizable: true
    });
  }
  get title() { return "To Bloom Below the Web"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="tbw-root">${this.markup()}</div>`);
    this.wire($el[0]);
    setTimeout(() => this.scrollToCard(document.getElementById("tbw-console") ?? $el[0]), 30);
    return $el;
  }
  /* After a Go from the run order, bring that card into view. */
  scrollToCard(root) {
    const k = this.scrollTo;
    if (!k || !root) return;
    this.scrollTo = null;
    setTimeout(() => root.querySelector?.(`[data-card="${k}"]`)?.scrollIntoView?.({ block: "start", behavior: "smooth" }), 30);
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

  markup() {
    const t = this.t, s = t.s, ro = !t.editable;
    const chapter = CHAPTERS[s.tab] ? s.tab : null;
    return `${this.styles()}
      <div class="tbw">
        ${this.header(ro)}
        <nav class="tabs">
          ${TABS.map(z => `<button type="button" class="tab ${s.tab === z.key ? "on" : ""}" style="--tt:var(--${z.tone})" data-act="tab" data-k="${z.key}">
            <b><i class="fa-solid ${z.icon}"></i> ${z.label}</b><small>${z.sub}</small></button>`).join("")}
        </nav>
        ${chapter ? this.subtabs(chapter) : ""}
        ${s.tab === "spring" ? this.springTab(ro) : ""}
        ${s.tab === "order" ? this.orderTab(ro) : ""}
        ${chapter ? this.chapterTab(chapter, ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t, F = t.fate;
    const flag = (on, label) => `<span class="flag ${on ? "on" : ""}">${label}</span>`;
    return `
      <header class="topbar">
        <div class="flags">
          <span class="flag">Fate <b>${F.pools ? F.total : "—"}</b></span>
          <span class="flag">Rite VP <b>${t.totalVp}</b></span>
          ${flag(t.beat("ch12-fang", "ch12-fang"), "Stewards")}
          <span class="flag">Souls freed <b>${t.soulsFreed}</b> of 3</span>
          <span class="flag">Freeing-objects <b>${t.linksFound}</b> of 4</span>
        </div>
        <div class="xp"><span>Milestone XP</span><b>${t.totalXp}</b></div>
        <button type="button" class="say" data-act="poststatus" title="Post where spring stands (spoiler-free)"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset spring" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  subtabs(chapter) {
    const s = this.t.s, c = CHAPTERS[chapter];
    return `<nav class="subtabs">
      ${c.subs.map(z => `<button type="button" class="subtab ${s.ctab[chapter] === z.key ? "on" : ""}" style="--tt:var(--${c.tone})" data-act="sub" data-ch="${chapter}" data-k="${z.key}">
        <i class="fa-solid ${z.icon}"></i> ${z.label}<small>${z.sub}</small></button>`).join("")}
    </nav>`;
  }

  /* -------------------------------------------------------- landing view
     What spring inherits. Everything here is read from the macros that own
     it — this console never writes another act's state. */
  springTab(ro) {
    const t = this.t, W = t.winter, D = t.downtime, F = t.fate;
    const row = (label, value, note, tone = "muted") =>
      `<div class="inh"><span class="ilab">${label}</span><b class="itone" style="--it:var(--${tone})">${value}</b>${note ? `<em>${note}</em>` : ""}</div>`;
    const seed = (card, beat) => t.winterBeat(card, beat);
    const yami = !!D?.yami?.bonded;
    const rin = seed("ch9-e7-fox", "ch9-e7-friendly") || seed("ch9-e7-fox", "ch9-e7-moves-in");
    const collars = (W?.influence?.["ch9-ren-meili"] ?? 0) >= 12;
    const collarsOut = !!sogLedger()["winter:ch9-spider:collars"];
    const summer = readSetting(SUMMER_ID);
    const willow = !!summer?.beats?.["ch3-mists-gw-visit"]?.["gw-friendly"];
    return `
      ${sogMediaPanel("landing", "all spring — the beds, the theme, and the submacros")}
      <section class="panel" style="--tone:var(--bloom)">
        <h3>Carried into spring <small>read live from the earlier acts' macros</small></h3>
        <div class="inhgrid">
          ${row("Preparation Points", F.pools ? F.total : "no downtime state", F.pools ? `Hope ${F.pools.hope} + Food ${F.pools.food} + Security ${F.pools.security} = ${F.base}${F.total !== F.base ? `; ${F.total} with the bonuses — see the Fate card` : ""}` : "Run the Fall Downtime Tracker once", "gold")}
          ${row("Population", F.pop ?? "—", F.pop != null ? (F.pop >= 100 ? "100 or more: +4 to the Fate" : "under 100: no bonus") : "No winter state", "rust")}
          ${row("Transmigrate cast", seed("ch10-after-ch11", "ch10-after-cast") ? "yes" : "not marked", "No Breath to Cry · Lead-In to Chapter 11", "moss")}
          ${row("The warding bell", t.bellState ?? "not marked", t.bellState === "spared" ? "Karahai gifts it back — Chapter 11" : t.bellState === "destroyed" ? "No shrine boon" : "Mark it on winter's Aftermath tab", "plum")}
          ${row("Silver collars", collars ? (collarsOut ? "earned and handed out" : "earned") : "not earned", collars ? "Display them and Ren Mei Li starts friendly" : "Learned of in Karahai instead", "silver")}
          ${row("Heh Shan-Bao, in the dream", seed("ch8-end-of-dream", "ch8-end-help-xp") ? "helped willingly" : "fought or not marked", "", "slate")}
          ${row("Rework seed 1", seed("ch9-seance", "ch9-seance-rework1") ? "planted" : "not planted", "the woman in crimson silks", "bloom")}
          ${row("Rework seed 2", seed("ch9-spider", "ch9-spider-rework2") ? "planted" : "not planted", "\"burn red roses\" — pays off at the Silkwasp camp", "bloom")}
          ${row("Yami", yami ? "bonded" : "not bonded", yami ? "She meets Amai first" : "", "plum")}
          ${row("Rin", rin ? "befriended" : "—", rin ? "Restored to life at 13+ Preparation Points" : "", "ember")}
          ${row("Great Willow", willow ? "friendly" : "—", willow ? "Visits at the end of the act" : "", "moss")}
        </div>
      </section>
      <section class="panel" style="--tone:var(--silver)">
        <h3>The act at a glance</h3>
        <ul class="checks">
          <li><b>Ch 11</b> — level 10. The Fate, the ruined manor and the false governor, the bridge, and the Silkwasps.</li>
          <li><b>Ch 12</b> — level 11. Ren Mei Li's five rites (Victory Points), three murders, and the Fang and Key.</li>
          <li><b>Ch 13</b> — level 12. The restored manor, the Grasp, the Grave, the governor's fate — then the Weaver and the Sealing.</li>
        </ul>
        <p class="hint">Items with the spider mark are the Two Weavers rework, not the printed book. Every checklist item here is the same value as the Campaign Status Tracker's.</p>
      </section>`;
  }

  /* ------------------------------------------------------------ run order */
  orderTab(ro) {
    const t = this.t, now = t.currentStep;
    const doneCount = STEPS.filter(x => t.stepDone(x)).length;
    let html = `
      <section class="panel" style="--tone:var(--gold)">
        <h3>Run order <small>${doneCount} of ${STEPS.length} steps done</small></h3>
        <p class="text">The chapter tabs group the cards by place. This is the order to play them in. Chapter 11 runs mostly top to bottom; Chapter 12 is paced by Ren Mei Li's weekly visits, with each murder landing between two rites; Chapter 13 has no timer. Act 4 isn't pinned to calendar days — the book counts in "a few days" and "a week" — so the timings are relative and slide to wherever your table is.</p>
        <p class="hint">A step is done when its key result is recorded, or when every card in it is marked done. The highlighted step is the next one to run; optional steps and the bridge's months of building sit beside it rather than blocking it. <b>Go</b> opens the step's first card, and the gold number on every card says which step it belongs to.</p>
      </section>`;
    for (const ch of ["ch11", "ch12", "ch13"]) {
      const c = CHAPTERS[ch];
      html += `<section class="panel order" style="--tone:var(--${c.tone})">
        <h3>${c.act} — ${c.title} <small>level ${c.level}${ch === "ch12" ? " · Ren Mei Li's weekly visits set the pace" : ch === "ch13" ? " · no timer; a month is plenty" : ""}</small></h3>
        <ol class="steps">`;
      let lastWeek = null;
      STEPS.forEach((st, i) => {
        if (st.ch !== ch) return;
        if (st.week != null && st.week !== lastWeek) {
          lastWeek = st.week;
          html += `<li class="weekrow"><span>Week ${st.week}</span>${st.week === 0 ? "Amai arrives" : st.week === 1 ? "first visit" : "Ren Mei Li returns"}</li>`;
        }
        const done = t.stepDone(st), here = i === now, K = KINDS[st.kind];
        html += `<li class="step ${done ? "done" : ""} ${here ? "here" : ""}" style="--k:var(--${K.tone})">
          <span class="snum">${i + 1}</span>
          <span class="sbody">
            <span class="swhen">${st.when}</span>
            <b>${st.title}</b>
            ${st.note ? `<em>${st.note}</em>` : ""}
          </span>
          <span class="stags">
            <span class="kind">${K.label}</span>
            ${st.rework ? `<i class="fa-solid fa-spider web-ic" title="Two Weavers rework"></i>` : ""}
            ${done ? `<span class="kind ok">done</span>` : here ? `<span class="kind now">now</span>` : st.background && i < now ? `<span class="kind run">running</span>` : ""}
            <button type="button" class="ghost go" data-act="goto" data-k="${st.cards[0]}">Go</button>
          </span>
        </li>`;
      });
      html += `</ol></section>`;
    }
    return html;
  }

  /* ------------------------------------------------------------- chapters */
  chapterTab(chapter, ro) {
    const sub = this.t.s.ctab[chapter];
    const M = {
      ch11: { return: CH11_RETURN, manor: CH11_MANOR, bandits: CH11_BANDITS },
      ch12: { princess: CH12_PRINCESS, rites: CH12_RITES, murders: CH12_MURDERS, fang: CH12_FANG },
      ch13: { manor: CH13_MANOR, grasp: CH13_GRASP, grave: CH13_GRAVE, den: CH13_DEN, finale: CH13_FINALE }
    };
    return sogMediaPanel(`chapter:${chapter}`, CHAPTERS[chapter].title) +
      (M[chapter][sub] ?? []).map(c => this.cardMarkup(c, chapter, ro)).join("");
  }

  cardMarkup(card, ch, ro) {
    const t = this.t;
    const done = !!t.s.cleared[card.key];
    const beats = card.beats ?? [];
    const jref = card.id ?? card.page;
    return `
      <section class="panel area ${done ? "done" : ""} ${card.rework && !card.boxed && !card.text ? "web" : ""}" data-card="${card.key}" style="--tone:var(--${tone(card.tone)})">
        <h3>${stepOfCard(card.key) ? `<button type="button" class="stepchip" data-act="tab" data-k="order" title="Step ${stepOfCard(card.key)} of the run order">${stepOfCard(card.key)}</button>` : ""}${card.id ? `<span class="eid">${card.id}</span>` : ""}${card.name}
          ${card.rework ? `<i class="fa-solid fa-spider web-ic" title="Two Weavers rework"></i>` : ""}
          ${card.level ? `<span class="lvl">${card.level}</span>` : ""}
          ${card.when ? `<small>${card.when}</small>` : ""}
          ${jref ? this.jbtn(ch, jref) : ""}
          ${card.boxed || card.quote ? `<button type="button" class="say" data-act="postarea" data-k="${card.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>` : ""}
          ${card.checks?.length ? `<button type="button" class="say" data-act="postchecks" data-k="${card.key}" title="Post the checks"><i class="fa-solid fa-dice-d20"></i></button>` : ""}
        </h3>
        ${sogCardMedia(card.key)}
        ${card.boxed ? `<p class="boxed">${card.boxed}</p>` : ""}
        ${card.creatures ? `<p class="crea"><b>Creatures</b> ${card.creatures}</p>` : ""}
        ${card.quote ? `<p class="quote">“${card.quote}”</p>` : ""}
        ${card.text ? `<p class="text">${card.text}</p>` : ""}
        ${card.qa?.length ? `<div class="qa">${card.qa.map(([q, a]) => `<p><b>${q}</b> “${a}”</p>`).join("")}</div>` : ""}
        ${card.checks?.length ? `<ul class="checks">${card.checks.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
        ${card.outcomes?.length ? `<ul class="outcomes">${card.outcomes.map(o => `<li>${o}</li>`).join("")}</ul>` : ""}
        ${card.note ? `<p class="note">${card.note}</p>` : ""}
        ${card.hazard ? `<p class="loot"><b>Hazard</b> ${card.hazard}</p>` : ""}
        ${card.rework ? (typeof card.rework === "string" ? `<div class="aside web"><b><i class="fa-solid fa-spider"></i> Two Weavers rework</b><p>${card.rework}</p></div>` : "") : ""}
        ${card.aside ? `<div class="aside"><b>${card.aside.title}</b><p>${card.aside.text}</p></div>` : ""}
        ${card.widget ? this.widget(card.widget, ro) : ""}
        ${card.treasure ? `<p class="loot"><b>Treasure</b> ${card.treasure}</p>` : ""}
        ${sogCardRewards(card.key, !!card.treasure, ro)}
        ${beats.length ? `<div class="sub beats">
          <div class="subhead"><i class="fa-solid fa-circle-check"></i> What can happen here <span>${beats.filter(b => t.beat(card.key, b.key)).length} of ${beats.length}</span></div>
          ${beats.map(b => `
            <label class="check"><input type="checkbox" data-act="beat" data-k="${card.key}" data-b="${b.key}" ${t.beat(card.key, b.key) ? "checked" : ""} ${ro ? "disabled" : ""}>
              ${b.rework ? `<i class="fa-solid fa-spider web-ic" title="Two Weavers rework"></i> ` : ""}${b.label}${b.xp ? ` <span class="tag">${b.xp} XP</span>` : ""}</label>
            ${b.note ? `<p class="beatnote">${b.note}</p>` : ""}`).join("")}
        </div>` : ""}
        <div class="btnrow"><button type="button" class="${done ? "ghost" : "primary"}" data-act="cleared" data-k="${card.key}" ${ro ? "disabled" : ""}>${done ? "Reopen" : "Mark done"}</button></div>
      </section>`;
  }

  /* ------------------------------------------------------------- widgets */
  degBtns(act, key, cur, ro, extra = "") {
    return `<div class="degs">${DEG.map(d => `<button type="button" class="dg ${d} ${cur === d ? "on" : ""}" data-act="${act}" data-k="${key}" data-d="${d}" ${extra} ${ro ? "disabled" : ""}>${DEG_LABEL[d]}</button>`).join("")}</div>`;
  }
  stepper(act, key, value, ro, label, of) {
    return `<div class="inflrow"><span class="ilabel">${label}</span>
      <button type="button" class="qbtn" data-act="${act}" data-k="${key}" data-d="-1" ${ro ? "disabled" : ""}>−</button>
      <b>${value}</b>
      <button type="button" class="qbtn" data-act="${act}" data-k="${key}" data-d="1" ${ro ? "disabled" : ""}>+</button>
      ${of != null ? `<span class="itag">of ${of}</span>` : ""}</div>`;
  }

  widget(w, ro) {
    const t = this.t, s = t.s;
    const [kind, arg] = w.split(":");
    if (kind === "fate") {
      const F = t.fate;
      const tiers = [
        "0 — Only the PCs and the named NPCs return. Willowshore stays a ruin; no Earn Income, no ordinary goods.",
        "1–4 — The PCs, named NPCs and 40% of the population. Badly damaged; a grueling year. Income and goods capped at level 3. 10 XP.",
        "5–12 — The PCs, named NPCs and 80%. Decent repair; grief, but determination. Capped at level 5. 60 XP.",
        "13+ — Everyone, including those met in the hinterlands such as Rin's ghost. As they knew it; fields plantable at once. Capped at the town's level (7). 120 XP."
      ];
      return `<div class="sub" style="--sub:var(--gold)">
        <div class="subhead"><i class="fa-solid fa-scale-balanced"></i> Preparation Points <span>${F.pools ? F.total : "—"}</span></div>
        ${F.pools ? `<p class="hint">Hope ${F.pools.hope} + Food ${F.pools.food} + Security ${F.pools.security} = ${F.base}, read live from the Fall Downtime Tracker's pools as they stand now. If they've moved since the casting, correct it with the adjustment.</p>`
          : `<p class="blocked">No downtime state in this world — run the Fall Downtime Tracker once, or set the adjustment to the total by hand.</p>`}
        ${this.stepper("fate-adjust", "adjust", (s.fate.adjust ?? 0) >= 0 ? `+${s.fate.adjust ?? 0}` : s.fate.adjust, ro, "Adjustment")}
        <label class="check"><input type="checkbox" data-act="fate-crit" ${s.fate.crit ? "checked" : ""} ${ro ? "disabled" : ""}> The transmigrate ritual was a critical success <span class="tag">+12</span></label>
        <p class="hint">Population at the casting: <b>${F.pop ?? "unknown"}</b>${s.fate.pop != null ? " (set here)" : F.pop != null ? " — from No Breath to Cry" : ""}${F.pop != null && F.pop >= 100 ? " — +4" : ""}.
          ${this.stepper("fate-pop", "pop", s.fate.pop ?? "auto", ro, "Override")}</p>
        <ul class="tiers">${tiers.map((x, i) => `<li class="${F.tier === i ? "on" : ""}">${x}</li>`).join("")}</ul>
        <div class="btnrow"><button type="button" class="${s.fate.granted ? "ghost" : "primary"}" data-act="fate-xp" ${ro ? "disabled" : ""}>
          ${s.fate.granted ? `Take back the ${s.fate.granted} Fate XP` : `Award the Fate's ${F.xp} XP`}</button></div>
      </div>`;
    }
    if (kind === "lantern") return `<p class="bonus">The Eternal Lantern's bonus is now +2.</p>`;
    if (kind === "bell") {
      const b = t.bellState;
      return b === "spared" ? `<p class="bonus">The bell was spared in Act 3 — Karahai gifts it back.</p>`
        : b === "destroyed" ? `<p class="blocked">The bell was destroyed in Act 3 — there's no gift.</p>`
        : `<p class="hint">Act 3 didn't record whether the bell was spared (No Breath to Cry · Aftermath).</p>`;
    }
    if (kind === "bridge") {
      const B = s.bridge;
      const res = { cs: "1 month — done before Chapter 12.", s: "2 months.", f: "3 months — likely not before the Adventure Path ends.",
                    cf: "Disaster: deaths (1d8 if you wish). Start again with –4." }[B.degree];
      return `<div class="sub" style="--sub:var(--slate)"><div class="subhead"><i class="fa-solid fa-bridge"></i> Rebuild Karahai Bridge</div>
        ${this.degBtns("bridge-deg", "degree", B.degree, ro)}
        ${res ? `<p class="bonus">${res}</p>` : ""}</div>`;
    }
    if (kind === "silkwasps") {
      const B = s.bridge, hits = B.hits ?? 0;
      return `<div class="sub" style="--sub:var(--rust)"><div class="subhead"><i class="fa-solid fa-bullseye"></i> At the bridge</div>
        <div class="btnrow">${[["paid", "Paid him off"], ["fought", "Refused — a fight"]].map(([k, l]) =>
          `<button type="button" class="dg ${B.outcome === k ? "on s" : ""}" data-act="bridge-out" data-k="${k}" ${ro ? "disabled" : ""}>${l}</button>`).join("")}</div>
        ${B.outcome === "fought" ? this.stepper("bridge-hits", "hits", hits, ro, "Explosive arrows on the bridge", 5) : ""}
        ${hits >= 5 ? `<p class="blocked">Five hits: the work is destroyed. Rebuild Karahai Bridge from scratch.</p>` : hits >= 2 ? `<p class="blocked">The planks are blown apart — no easy crossing.</p>` : ""}
        ${B.outcome === "paid" ? `<p class="hint">The extortion is only the start: trouble every few weeks, and Hong Meigui's Extreme assault on the town by Chapter 13 if nobody deals with the camp.</p>`
          : B.outcome === "fought" ? `<p class="hint">Hong Meigui speeds up: the first reports of trouble come within days.</p>` : ""}
      </div>`;
    }
    if (kind === "amai") return yamiNote(t);
    if (kind === "meeting") {
      const vp = s.meetingVp ?? 0, collars = t.beat("ch12-meeting", "ch12-collars");
      const att = collars ? (vp >= 3 ? "helpful" : "friendly") : (vp >= 3 ? "friendly" : "indifferent");
      return `<div class="sub" style="--sub:var(--silver)"><div class="subhead"><i class="fa-solid fa-mug-hot"></i> Over tea <span>${att}</span></div>
        ${this.stepper("vp", "meeting", vp, ro, "Victory Points", 3)}
        <p class="hint">Her attitude starts indifferent${collars ? " — the collars made it friendly" : ""}; 3 VP improves it one step.</p></div>`;
    }
    if (kind === "rite") {
      const R = s.rites[arg], D = RITES[arg];
      const xp = t.riteXp(arg, true);
      return `<div class="sub" style="--sub:var(--gold)"><div class="subhead"><i class="fa-solid fa-gem"></i> ${D.season} — anchor of ${D.anchor} <span>${R.done ? "done" : "open"}</span></div>
        ${arg === "beyond" ? "" : this.stepper("vp", arg, R.vp, ro, "Victory Points", 4)}
        ${arg === "beyond" ? "" : `<p class="hint">${D.xp1} XP at 1+ VP, ${D.xp4} at 4. ${xp ? `This rite: <b>${xp} XP</b>` : "No VP yet."}</p>`}
        <div class="btnrow"><button type="button" class="${R.done ? "ghost" : "primary"}" data-act="rite-done" data-k="${arg}" ${ro ? "disabled" : ""}>
          ${R.done ? "Reopen the rite" : arg === "beyond" ? "The path walked" : `Mark the rite done${xp ? ` · ${xp} XP` : ""}`}</button></div>
        ${arg === "winter" && R.vp >= 3 ? `<p class="bonus">3+ VP: the algrievers give up to six willing PCs a Pilgrim's Ward.</p>` : ""}
      </div>`;
    }
    if (kind === "vp") {
      const vp = t.totalVp, picks = vp >= 14 ? "all four items and the pouch" : vp >= 10 ? `${vp - 9} of the four` : "no gift";
      return `<div class="sub" style="--sub:var(--gold)"><div class="subhead"><i class="fa-solid fa-gem"></i> The five rites <span>${vp} VP</span></div>
        <p class="hint">${t.ritesDone} of 5 rites done. At ${vp} Victory Points, Ren Mei Li's gift is <b>${picks}</b>.</p></div>`;
    }
    if (kind === "murder") {
      const invs = Object.entries(INVESTIGATIONS).filter(([, v]) => v.murder === arg);
      const M = MURDERS[arg];
      return `<div class="sub" style="--sub:var(--rust)"><div class="subhead"><i class="fa-solid fa-magnifying-glass"></i> Search for Clues — ${M.victim} <span>${t.prevented(arg) ? "prevented" : ""}</span></div>
        ${invs.map(([k, v]) => {
          const d = s.clues[k];
          const shown = d === "cs" ? ["minor", "moderate", "major"] : d === "s" ? ["minor", "moderate"] : d === "f" ? ["minor"] : d === "cf" ? ["false"] : [];
          return `<div class="inv"><div class="invhead"><b>${v.label}</b> <span class="itag">${linkify(v.check)}</span></div>
            ${this.degBtns("clue", k, d, ro)}
            ${shown.map(lv => `<p class="clue ${lv}"><span>${lv === "false" ? "false lead (as minor)" : lv}</span> ${v[lv]}</p>`).join("")}</div>`;
        }).join("")}
        <p class="hint">Token for Chapter 13: ${M.token} — ${t.tokenKept(arg) ? "<b>kept</b>" : "not yet"}.</p>
      </div>`;
    }
    if (kind === "soulsummary") {
      return `<div class="sub" style="--sub:var(--plum)"><div class="subhead"><i class="fa-solid fa-link-slash"></i> The souls <span>${t.soulsFreed} of 3 freed</span></div>
        <ul class="checks">${["m1", "m2", "m3"].map(m => `<li><b>${MURDERS[m].victim}</b> — ${t.prevented(m) ? "murder prevented; freed on entering the Grasp" : t.soulFreed(m) ? (s.souls[m] === "cs" ? "freed and returned to life" : "freed to the Boneyard") : s.souls[m] === "cf" ? "bound until Heh falls" : "shackled"} · +2 ${SOUL_SAVE[m]} when free</li>`).join("")}</ul></div>`;
    }
    if (kind === "soul") {
      const M = MURDERS[arg], d = s.souls[arg];
      if (t.prevented(arg)) return `<p class="bonus">This murder was prevented: the soul is free already — grant the +2 ${SOUL_SAVE[arg]} and 80 XP on entering the Grasp.</p>`;
      const res = { cs: "Freed, and returned to life in Willowshore.", s: "Freed to the Boneyard; dead in the living world.",
                    f: "Not yet — try again.", cf: "Spiralled deeper: bound until Heh Shan-Bao falls. No more attempts." }[d];
      return `<div class="sub" style="--sub:var(--plum)"><div class="subhead"><i class="fa-solid fa-link-slash"></i> Free Shackled Soul <span>${t.soulFreed(arg) ? "free" : "shackled"}</span></div>
        <p class="hint">${t.tokenKept(arg) ? `They carry ${M.token}: +3 item bonus.` : `Without ${M.token}: no token bonus.`}</p>
        ${this.degBtns("soul", arg, d, ro)}
        ${res ? `<p class="${["cs", "s"].includes(d) ? "bonus" : "blocked"}">${res}${["cs", "s"].includes(d) ? ` +2 status to ${SOUL_SAVE[arg]} saves for the rest of the adventure · 80 XP.` : ""}</p>` : ""}</div>`;
    }
    if (kind === "shisagishin") {
      const n = t.soulsFreed, count = n >= 3 ? 2 : n >= 1 ? 3 : 4, lvl = n >= 3 ? "Moderate 12" : n >= 1 ? "Severe 12" : "Extreme 12";
      return `<p class="bonus">${n} of 3 souls freed: <b>${count} shisagishin</b> among the dead — ${lvl}. ${3 - n ? `${3 - n} pair${3 - n === 1 ? "" : "s"} of eyes on the burl.` : "The burl's roots are only bloodstained."}</p>`;
    }
    if (kind === "heh") {
      const H = s.heh, n = t.soulsFreed;
      const lost = n >= 3 ? "frightful presence, the slashing damage from his Strikes, and his physical resistance" : n === 2 ? "frightful presence and the slashing damage from his Strikes" : n === 1 ? "frightful presence" : "nothing";
      const out = H.influence >= 10 ? "Freed. The unrisen vanish; his soul goes to the Boneyard to be judged."
        : H.influence >= 7 ? "Freed, but his soul is Kugaptee's — the two unrisen still attack and must be beaten."
        : H.round >= t.hehRounds ? "Out of time: \"Die, pretenders.\" Fight him and the Unlived Lives." : "";
      return `<div class="sub" style="--sub:var(--rust)"><div class="subhead"><i class="fa-solid fa-scale-balanced"></i> Influence <span>${H.influence} of 10</span></div>
        <p class="hint">${t.linksFound} freeing-object${t.linksFound === 1 ? "" : "s"} carried: <b>${t.hehRounds} round${t.hehRounds === 1 ? "" : "s"}</b> to reach him. ${LINKS.map(L => `${t.linkFound(L) ? "✓" : "✗"} ${L.label}`).join(" · ")}</p>
        ${this.stepper("heh", "round", H.round, ro, "Rounds used", t.hehRounds)}
        ${this.stepper("heh", "influence", H.influence, ro, "Influence", 10)}
        <label class="check"><input type="checkbox" data-act="heh-fang" ${H.fangGiven ? "checked" : ""} ${ro ? "disabled" : ""}> A PC gave him the Fang and Key (all DCs –2)</label>
        ${out ? `<p class="${H.influence >= 7 ? "bonus" : "blocked"}">${out}</p>` : ""}
        <p class="hint">If it comes to a fight, ${n} freed soul${n === 1 ? "" : "s"}: he loses ${lost}; each unrisen Rises Again with ${n ? `${20 * n} fewer HP${n >= 3 ? " — only 40" : ""}` : "full HP"}.</p>
        ${t.redeemed ? `<p class="bonus"><i class="fa-solid fa-spider"></i> Redeemed: his departing soul will shred the Crimson Weaver's woven ward.</p>` : ""}
      </div>`;
    }
    if (kind === "weaver") {
      const W = s.weaver, standing = 3 - W.strands;
      return `<div class="sub" style="--sub:var(--bloom)"><div class="subhead"><i class="fa-solid fa-spider"></i> The loom <span>${standing} strand${standing === 1 ? "" : "s"} standing</span></div>
        ${this.stepper("weaver", "strands", W.strands, ro, "Strands cut", 3)}
        <p class="${standing >= 2 ? "blocked" : "bonus"}">${standing >= 2 ? "Two or more stand: fast healing 10, and she Web Walks between them." : "Fewer than two stand: no fast healing, no Web Walk."}</p>
        <p class="${t.redeemed ? "bonus" : "blocked"}">${t.redeemed ? "Woven ward: shredded by Heh Shan-Bao's freed soul." : "Woven ward up: resist 10 physical and 50 temporary HP."}</p>
        <label class="check"><input type="checkbox" data-act="weaver-bargain" ${W.bargain ? "checked" : ""} ${ro ? "disabled" : ""}> The party took her half-HP bargain</label>
        ${W.bargain ? `<p class="hint">She completes the siphon — and phase two happens to her mid-gloat, with the party far too close.</p>` : ""}
      </div>`;
    }
    if (kind === "edges") {
      const blessings = ["m1", "m2", "m3"].filter(m => t.soulFreed(m)).map(m => `+2 ${SOUL_SAVE[m]}`);
      return `<div class="sub" style="--sub:var(--plum)"><div class="subhead"><i class="fa-solid fa-shield-heart"></i> Banked edges</div>
        <ul class="checks">
          <li>Soul Blessings: ${blessings.length ? blessings.join(", ") : "none"}</li>
          <li>Freeing-objects for the Sealing: ${t.linksFound} of 4</li>
          <li>Silversoul bombs: ${t.tokenKept("m3") ? "found — the vessel counts as a nindoru" : "not found"}</li>
          <li>The breather round: 4d8 healing to every PC, and a chance to reposition</li>
        </ul></div>`;
    }
    if (kind === "sealing") {
      const rows = [...LINKS, { pulse: null, season: "beyond" }];
      return `<div class="sub" style="--sub:var(--gold)"><div class="subhead"><i class="fa-solid fa-circle-nodes"></i> Five rounds, five anchors</div>
        ${rows.map((L, i) => {
          const r = i + 1, res = s.sealing[r], rite = RITES[L.season];
          const neg = L.pulse && t.linkFound(L);
          return `<div class="seal"><div class="invhead"><b>Round ${r} — ${rite.season}, ${rite.label}</b>
              <span class="itag">${t.s.rites[L.season]?.done ? "anchor in hand" : "anchor not earned"}</span></div>
            ${L.pulse ? `<p class="${neg ? "bonus" : "text"}">${L.pulse}: ${neg ? `negated by ${L.label}, which vanishes.` : `${L.dmg}${res === "fail" ? " — plus 2d6 for the failed group check" : ""}.`}</p>`
              : `<p class="bonus">No pulse. The fifth anchor slides home and the seal shuts.</p>`}
            <div class="btnrow">${[["pass", "Group check passed"], ["fail", "Failed (+2d6)"]].map(([k, l]) =>
              `<button type="button" class="dg ${res === k ? `on ${k === "pass" ? "s" : "cf"}` : ""}" data-act="seal" data-k="${r}" data-d="${k}" ${ro ? "disabled" : ""}>${l}</button>`).join("")}</div></div>`;
        }).join("")}</div>`;
    }
    if (kind === "aftermath") {
      return `<p class="hint">Heh Shan-Bao: ${s.heh.influence >= 10 ? "freed to the Boneyard" : s.heh.influence >= 7 ? "freed, his soul consumed" : "slain"}. Lo Kuon: ${t.beat("ch11-camp", "ch11-lokuon") ? "freed — the rebuilt Silkwasps" : "not freed"}. Isori: ${t.beat("ch12-r-summer", "ch12-isori") ? "friendly — he visits" : "—"}.</p>`;
    }
    return "";
  }

  /* --------------------------------------------------------------- wiring */
  wire(root) {
    if (!root || root.dataset?.tbwWired === "1") return;
    if (root.dataset) root.dataset.tbwWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act, k = btn.dataset.k, d = btn.dataset.d;
      if (sogClick(a, btn)) return;
      if (!t.editable && !["tab", "sub", "journal", "postarea", "postchecks", "goto"].includes(a)) return;
      if (a === "tab") { t.s.tab = k; t.touch(); }
      else if (a === "sub") { t.s.ctab[btn.dataset.ch] = k; t.touch(); }
      else if (a === "journal") openJournal(btn.dataset.ch, btn.dataset.r || null);
      else if (a === "postarea") t.postArea(cardByKey(k));
      else if (a === "goto") {
        const where = subOfCard(k);
        if (!where) return;
        t.s.tab = where.ch; t.s.ctab[where.ch] = where.sub;
        this.scrollTo = k;
        t.touch();
      }
      else if (a === "cleared") t.toggleCleared(k);
      else if (a === "postchecks") t.postChecks(cardByKey(k));
      else if (a === "poststatus") t.postStatus();
      else if (a === "reset") Dialog.confirm({ title: "Reset spring?", content: "<p>Clear every Act 4 tick, tally and roll? The other acts' macros aren't touched.</p>" })
        .then(ok => ok && t.reset());
      else if (a === "fate-adjust") t.setFate("adjust", (t.s.fate.adjust ?? 0) + Number(d));
      else if (a === "fate-pop") {
        const cur = t.s.fate.pop ?? t.winter?.population ?? 100;
        t.setFate("pop", Math.max(0, cur + Number(d) * 5));
      }
      else if (a === "fate-xp") t.toggleFateXp();
      else if (a === "bridge-deg") t.setBridge("degree", d);
      else if (a === "bridge-out") t.setBridge("outcome", k);
      else if (a === "bridge-hits") t.setBridge("hits", Number(d));
      else if (a === "vp") t.setVp(k, Number(d));
      else if (a === "rite-done") t.toggleRite(k);
      else if (a === "clue") t.setClue(k, d);
      else if (a === "soul") t.setSoul(k, d);
      else if (a === "heh") t.setHeh(k, Number(d));
      else if (a === "weaver") t.setWeaver(k, Number(d));
      else if (a === "seal") t.setSeal(k, d);
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON" || !t.editable) return;
      if (el.dataset.act === "beat") t.toggleBeat(el.dataset.k, el.dataset.b);
      else if (el.dataset.act === "fate-crit") t.setFate("crit", el.checked);
      else if (el.dataset.act === "heh-fang") t.setHeh("fangGiven");
      else if (el.dataset.act === "weaver-bargain") t.setWeaver("bargain");
    });
  }

  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #tbw-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #tbw-console .window-content > * { background:transparent; }
      .tbw { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --bloom:${p.bloom}; --silver:${p.silver}; --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .tbw * { box-sizing:border-box; }
      .tbw button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
      .tbw button:hover:not(:disabled) { background:var(--hover); }
      .tbw button:disabled { opacity:.45; cursor:not-allowed; }
      .tbw input[type="checkbox"] { accent-color:var(--bloom); }
      .tbw h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.04em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:2px solid var(--tone, var(--line));
               padding-bottom:.3rem; flex-wrap:wrap; }
      .tbw h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .tbw h1, .tbw h2, .tbw h4, .tbw legend { color:var(--ink); }
      .tbw .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem; background:var(--card); }
      .tbw .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .tbw .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .tbw .panel.web { border-style:dashed; }
      .tbw .web-ic { color:var(--bloom); font-size:.75rem; }
      .tbw .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted)); border-radius:3px; padding:1px 5px; letter-spacing:.06em; }
      .tbw .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .tbw .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .tbw .say + .say { margin-left:.25rem; }
      .tbw .boxed { font-size:.82rem; line-height:1.5; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; white-space:pre-line; }
      .tbw .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; white-space:pre-line; }
      .tbw .quote { font-size:.82rem; line-height:1.5; margin:.3rem 0 .45rem; padding-left:.55rem;
                   border-left:2px solid var(--tone, var(--line)); font-style:italic; }
      .tbw .note { font-size:.78rem; line-height:1.45; color:var(--muted); font-style:italic; margin:.2rem 0 .4rem; white-space:pre-line; }
      .tbw .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .tbw .crea { font-size:.76rem; margin:.1rem 0 .35rem; color:var(--muted); }
      .tbw .crea b { color:var(--tone, var(--ink)); }
      .tbw .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0 0; line-height:1.4; }
      .tbw .checks { margin:0 0 .45rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; color:var(--muted); }
      .tbw .checks li { margin-bottom:.25rem; }
      .tbw .checks b { color:var(--ink); }
      .tbw .outcomes { margin:.2rem 0 .3rem; padding-left:1.1rem; font-size:.78rem; line-height:1.45; }
      .tbw .outcomes li { margin-bottom:.25rem; }
      .tbw .outcomes b { color:var(--tone, var(--ink)); }
      .tbw .qa { font-size:.78rem; line-height:1.45; margin:.2rem 0 .4rem; }
      .tbw .qa p { margin:.2rem 0; }
      .tbw .qa b { display:block; color:var(--tone, var(--ink)); }
      .tbw .aside { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0;
                   background:var(--stripe); font-size:.78rem; line-height:1.45; }
      .tbw .aside b { display:block; text-transform:uppercase; letter-spacing:.07em; font-size:.68rem;
                     font-weight:700; color:var(--slate); margin-bottom:.25rem; }
      .tbw .aside p { margin:0; white-space:pre-line; }
      .tbw .aside.web { border-color:var(--bloom); }
      .tbw .aside.web b { color:var(--bloom); }
      .tbw .check { display:block; font-size:.8rem; margin-bottom:.25rem; line-height:1.4; }
      .tbw .tag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--moss); color:var(--moss); margin-left:.25rem; }
      .tbw .beatnote { font-size:.75rem; line-height:1.45; color:var(--muted); margin:.1rem 0 .4rem 1.35rem;
                      padding-left:.5rem; border-left:1px solid var(--line); }
      .tbw .sub { --sub:var(--line); background:var(--stripe); border:1px solid var(--sub);
                 border-radius:4px; overflow:hidden; padding:.4rem .5rem .45rem; margin:.5rem 0; }
      .tbw .sub.beats { --sub:var(--moss); }
      .tbw .subhead { font-size:.66rem; text-transform:uppercase; letter-spacing:.1em; font-weight:700;
                     display:flex; align-items:center; gap:.4rem; background:var(--sub, var(--muted)); color:var(--paper);
                     margin:-.4rem -.5rem .45rem; padding:.28rem .5rem; border-radius:2px 2px 0 0; }
      .tbw .subhead i { color:var(--paper); opacity:.8; font-size:.72rem; }
      .tbw .subhead span { margin-left:auto; font-weight:600; color:var(--paper); letter-spacing:.06em;
                          border-radius:8px; padding:0 7px; background:rgba(0,0,0,.22); }
      .tbw .jbtn { font-size:.62rem; padding:1px 5px; border-radius:3px; color:var(--slate); border-color:var(--line); flex:none; }
      .tbw .jbtn i { font-size:.66rem; }
      .tbw .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; margin:.3rem 0; }
      .tbw .primary { background:var(--tone, var(--bloom)); border-color:var(--tone, var(--bloom));
                     color:var(--paper); font-weight:600; padding:.3rem .7rem; font-size:.76rem; }
      .tbw .primary:hover:not(:disabled) { filter:brightness(1.1); background:var(--tone, var(--bloom)); }
      .tbw .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .tbw .blocked { font-size:.76rem; color:var(--rust); margin:.2rem 0 .4rem; }
      .tbw .bonus { font-size:.76rem; font-weight:600; color:var(--moss); margin:.3rem 0 0; }
      .tbw .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .tbw .flags { display:flex; gap:.3rem; flex-wrap:wrap; }
      .tbw .flag { font-size:.66rem; text-transform:uppercase; letter-spacing:.06em; padding:2px 7px;
                  border-radius:10px; border:1px solid var(--line); color:var(--muted); }
      .tbw .flag b { color:var(--ink); }
      .tbw .flag.on { border-color:var(--moss); color:var(--moss); font-weight:700; }
      .tbw .xp { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; }
      .tbw .xp span { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .tbw .xp b { font-size:1rem; line-height:1; }
      .tbw .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .tbw .tab { flex:1; padding:.3rem .2rem; font-size:.76rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .tbw .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .tbw .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .tbw .tab small { font-size:.6rem; color:var(--muted); font-weight:400; }
      .tbw .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .tbw .tab.on b i, .tbw .tab.on small { color:var(--paper); opacity:.85; }
      .tbw .subtabs { display:flex; gap:3px; margin-bottom:.6rem; flex-wrap:wrap; }
      .tbw .subtab { flex:1; padding:.22rem .4rem; font-size:.74rem; gap:.35rem;
                    border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .tbw .subtab i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .tbw .subtab small { font-size:.6rem; color:var(--muted); font-weight:400; }
      .tbw .subtab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .tbw .subtab.on i, .tbw .subtab.on small { color:var(--paper); opacity:.85; }
      .tbw .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }
      .tbw .inflrow { display:flex; align-items:center; gap:.4rem; margin:.2rem 0; }
      .tbw .ilabel { font-size:.76rem; min-width:11rem; }
      .tbw .inflrow b { min-width:1.6rem; text-align:center; }
      .tbw .itag { font-size:.64rem; color:var(--muted); }
      .tbw .degs { display:grid; grid-template-columns:repeat(4, 1fr); gap:2px; margin:.2rem 0; }
      .tbw .dg { font-size:.66rem; padding:.2rem .35rem; color:var(--muted); }
      .tbw .dg.on.cs, .tbw .dg.on.s { background:var(--moss); border-color:var(--moss); color:var(--paper); }
      .tbw .dg.on.f { background:var(--ember); border-color:var(--ember); color:var(--paper); }
      .tbw .dg.on.cf { background:var(--rust); border-color:var(--rust); color:var(--paper); }
      .tbw .inv, .tbw .seal { border-top:1px dashed var(--line); padding-top:.35rem; margin-top:.35rem; }
      .tbw .inv:first-of-type, .tbw .seal:first-of-type { border-top:none; margin-top:0; }
      .tbw .invhead { display:flex; align-items:baseline; gap:.5rem; font-size:.8rem; }
      .tbw .clue { font-size:.78rem; line-height:1.45; margin:.2rem 0; }
      .tbw .clue span { font-size:.6rem; text-transform:uppercase; letter-spacing:.07em; padding:0 5px; border-radius:8px;
                        border:1px solid var(--line); color:var(--muted); margin-right:.3rem; }
      .tbw .clue.major span { border-color:var(--moss); color:var(--moss); }
      .tbw .clue.false span { border-color:var(--rust); color:var(--rust); }
      .tbw .tiers { margin:.3rem 0; padding-left:1.1rem; font-size:.78rem; line-height:1.45; color:var(--muted); }
      .tbw .tiers li.on { color:var(--ink); font-weight:600; }
      .tbw .inhgrid { display:grid; grid-template-columns:repeat(2, 1fr); gap:.35rem .8rem; }
      .tbw .inh { display:flex; flex-direction:column; border-left:3px solid var(--it, var(--line)); padding-left:.45rem; }
      .tbw .inh .ilab { font-size:.62rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .tbw .inh .itone { --it:var(--muted); color:var(--it); font-size:.9rem; }
      .tbw .inh em { font-size:.72rem; color:var(--muted); }
      .tbw .area.done h3 .eid { opacity:.6; }
      .tbw .area.done { opacity:.85; }
      .tbw .stepchip { font-size:.62rem; font-weight:700; min-width:1.4rem; height:1.25rem; padding:0 .3rem; border-radius:10px;
                      border-color:var(--gold); color:var(--gold); flex:none; }
      .tbw .steps { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:3px; }
      .tbw .step { display:grid; grid-template-columns:1.8rem 1fr auto; gap:.5rem; align-items:start; padding:.35rem .45rem;
                  border:1px solid var(--line); border-left:4px solid var(--k, var(--line)); border-radius:3px; background:var(--card); }
      .tbw .step.done { opacity:.55; }
      .tbw .step.here { box-shadow:0 0 0 2px var(--gold); background:var(--stripe); opacity:1; }
      .tbw .snum { font-weight:700; font-size:.85rem; color:var(--muted); text-align:right; padding-top:.1rem; }
      .tbw .step.here .snum { color:var(--gold); }
      .tbw .sbody { display:flex; flex-direction:column; gap:.1rem; font-size:.8rem; line-height:1.35; }
      .tbw .swhen { font-size:.62rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .tbw .sbody em { font-size:.74rem; color:var(--muted); }
      .tbw .step.done b { text-decoration:line-through; }
      .tbw .stags { display:flex; align-items:center; gap:.3rem; }
      .tbw .kind { font-size:.6rem; text-transform:uppercase; letter-spacing:.07em; padding:1px 6px; border-radius:10px;
                  border:1px solid var(--k, var(--line)); color:var(--k, var(--muted)); }
      .tbw .kind.ok { border-color:var(--moss); color:var(--moss); }
      .tbw .kind.now { border-color:var(--gold); background:var(--gold); color:var(--paper); }
      .tbw .kind.run { border-color:var(--slate); color:var(--slate); border-style:dashed; }
      .tbw .go { font-size:.68rem; padding:.15rem .5rem; }
      .tbw .weekrow { display:flex; gap:.5rem; align-items:baseline; font-size:.72rem; color:var(--muted); margin:.45rem 0 .1rem;
                     padding-left:.3rem; border-bottom:1px dashed var(--line); }
      .tbw .weekrow span { font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--silver); }
      @media (max-width:800px) {
        .tbw .inhgrid { grid-template-columns:1fr; }
        .tbw .tabs, .tbw .subtabs { flex-wrap:wrap; }
      }
      ${SOG_CSS("tbw")}
    </style>`;
  }
}

/* Amai's card says whether Yami — the teahouse's bakeneko — meets her first. */
function yamiNote(t) {
  const bonded = !!t.downtime?.yami?.bonded;
  return bonded ? `<p class="bonus">Yami is bonded to the party: she meets Amai first, befriends her, and introduces her.</p>` : "";
}

if (AppV2) {
  TBWApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    this.scrollToCard(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSettings();
  let state = game.settings.get(SPR_NS, SPR_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(SPR_NS, SPR_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const spring = new Spring(state);
  const app = new TBWApp(spring);
  sogWire(spring);

  /* Re-registered on every run: the hook closes over this run's window. Our
     own setting is adopted whenever it differs from memory — including a write
     from this same client by the campaign tracker, which shares this act's
     checklist. The earlier acts' settings are read live, so a write there only
     needs a repaint. */
  {
    if (globalThis.__tbwHook) Hooks.off("updateSetting", globalThis.__tbwHook);
    globalThis.__tbwHook = Hooks.on("updateSetting", (setting) => {
      if ([DOWNTIME_ID, WINTER_ID, SUMMER_ID].includes(setting.key)) return spring.render();
      if (setting.key !== SPR_ID) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(spring.state)) { spring.state = fresh; spring.render(); }
    });
  }
  app.render(true);
})();
