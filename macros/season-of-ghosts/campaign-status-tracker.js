/* ============================================================================
   SEASON OF GHOSTS — Campaign Status Tracker
   All four acts, thirteen chapters · Foundry VTT v11 / v12 / v13 / v14 · PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   A checklist for the whole Adventure Path. Each chapter carries the decisions
   and items that outlive it; anything with a downstream payoff also appears on
   the Threads tab, which turns red once the party reaches the chapter that
   needs it. Reads the chapter consoles' saved state for a live rollup, and
   shares a handful of toggles with them — the lantern, the ringleaders, the
   named leader, and the shrine lights — as ONE value, settable from here or
   from that chapter's own console.

   Starts at Chapter 1 with nothing ticked. Click a chapter's status button to
   move the table forward; everything else keys off wherever it says you are.
   ============================================================================ */

const CS_NS = "world";
const CS_KEY = "sogCampaign";
const CS_ID = `${CS_NS}.${CS_KEY}`;
const MAX_PCS = 4;

/* The chapter consoles. Read for the rollup strip; the shared toggles in
   BRIDGE below also write back to these, so a value set here is the same one
   the individual console shows. */
const CONSOLES = {
  summer: "world.sogSummer",
  duel: "world.sogWhoLeads",
  downtime: "world.sogFallDowntime",
  festival: "world.sogFirstLongNight",
  path: "world.sogEnlightenedPath",
  ruins: "world.sogRuinsOfWisdom"
};

/* --------------------------------------------------------- shared toggles
   Some checklist items are the SAME value the individual chapter console
   stores — the lantern, the ringleaders, the named leader, the three shrine
   lights. Rather than keep a second copy here, the tracker reads and writes
   the console's own setting field, so ticking a box here is the same toggle
   the console shows, and vice versa. That is what lets you skip Act 1 (never
   run the Summer console) yet still mark the lantern as lit from here.

   Keyed by the tracker's own flag id (`"<chapter>.<itemKey>"`, see flagId).
   `setting` is a key into CONSOLES; `get`/`set` read/write that console's
   state object; `chip` is how the rollup strip renders the toggleable element. */
const BRIDGE = {
  "1.lantern": { setting: "summer",
    get: s => !!s.lantern,
    set: (s, v) => { s.lantern = v; if (!s.ringleaders) s.ringleaders = {}; s.ringleaders.gurglegut = v; },
    chip: { label: "Lantern", on: "lit", off: "dark", tone: "gold" } },

  "2.butcher": { setting: "summer",
    get: s => !!s.ringleaders?.graybutcher,
    set: (s, v) => { if (!s.ringleaders) s.ringleaders = {}; s.ringleaders.graybutcher = v; },
    chip: { label: "Gray Butcher", on: "dead", off: "alive", tone: "rust" } },

  "2.douqiu": { setting: "summer",
    get: s => !!s.ringleaders?.modouqiu,
    set: (s, v) => { if (!s.ringleaders) s.ringleaders = {}; s.ringleaders.modouqiu = v; },
    chip: { label: "Mo Douqiu", on: "dead", off: "alive", tone: "rust" } },

  /* `winner` is "north"|"south"|"third"|"gm" — "gm" is the stand-in when a
     leader was named by fiat rather than by the duel, which is exactly the
     "skipped this chapter" case. */
  "3.duel": { setting: "duel",
    get: s => !!s.winner,
    set: (s, v) => { s.winner = v ? "gm" : ""; },
    chip: { label: "Leader", on: "named", off: "unnamed", tone: "plum" } },

  "6.bridge": { setting: "path",
    get: s => !!(s.shrines?.d1?.cleared && s.shrines?.d1?.slept),
    set: (s, v) => { if (!s.shrines) s.shrines = {}; if (!s.shrines.d1) s.shrines.d1 = {}; s.shrines.d1.cleared = v; s.shrines.d1.slept = v; },
    chip: { label: "Bridge Shrine", on: "lit", off: "dark", tone: "gold" } },

  "6.garden": { setting: "path",
    get: s => !!(s.shrines?.d2?.incense && s.shrines?.d2?.slept),
    set: (s, v) => { if (!s.shrines) s.shrines = {}; if (!s.shrines.d2) s.shrines.d2 = {}; s.shrines.d2.incense = v; s.shrines.d2.slept = v; },
    chip: { label: "Garden Shrine", on: "lit", off: "dark", tone: "gold" } },

  "6.mountain": { setting: "path",
    get: s => !!(s.shrines?.d3?.iogaka && s.shrines?.d3?.bathe && s.shrines?.d3?.slept),
    set: (s, v) => { if (!s.shrines) s.shrines = {}; if (!s.shrines.d3) s.shrines.d3 = {}; s.shrines.d3.iogaka = v; s.shrines.d3.bathe = v; s.shrines.d3.slept = v; },
    chip: { label: "Mountain Shrine", on: "lit", off: "dark", tone: "gold" } }
};

const bridgeFor = (n, key) => BRIDGE[`${n}.${key}`] ?? null;

/* ------------------------------------------------------------- the journals
   The Season of Ghosts Foundry module ships the adventure as journal entries
   with fixed ids, and a Foundry adventure import keeps those ids — so a
   chapter can be opened by id rather than by hunting for a title. The ids and
   names below were read off the module's own cross-links, not guessed.

   Nothing here is required for the tracker to work. If the module isn't
   installed, or the ids differ in your world, every lookup falls through to a
   name match and then to the compendiums, and says what it looked for. */
const JOURNAL = {
  chapters: {
    1:  { id: "pf2apsog03toligh", name: "Act 1.1: To Light the Night" },
    2:  { id: "pf2apsog04reclai", name: "Act 1.2: Reclaiming Willowshire" },
    3:  { id: "pf2apsog05thewil", name: "Act 1.3: The Willowshore Curse" },
    4:  { id: "pf2apsog06thewal", name: "Act 1.4: The Wall of Ghosts" },
    5:  { id: "pf2apsog07turnin", name: "Act 2.1: Turning of the Seasons" },
    6:  { id: "pf2apsog08theenl", name: "Act 2.2: The Enlightened Path" },
    7:  { id: "pf2apsog09inther", name: "Act 2.3: In the Ruins of Wisdom" },
    8:  { id: "pf2apsog10oblivi", name: "Act 3.1: Oblivion of Truth" },
    9:  { id: "pf2apsog11faceto", name: "Act 3.2: Face-to-Face with Death" },
    10: { id: "pf2apsog12thispl", name: "Act 3.3: This Place is Ours" },
    11: { id: "pf2apsog13willow", name: "Act 4.1: Willowshore’s Return" },
    12: { id: "pf2apsog14thepri", name: "Act 4.2: The Princess’s Web" },
    13: { id: "pf2apsog15afiend", name: "Act 4.3: A Fiend in Two Worlds" }
  },
  /* Worth a button of their own — none of them belong to one chapter. */
  reference: [
    { id: "pf2apsog02willow", name: "Willowshore",
      what: "the town gazetteer — every W-numbered building, shop, and shrine" },
    { id: "pf2apsog17firstl", name: "First Long Night", what: "the festival, in full — Chapter 5, week 3" },
    { id: "pf2apsog21bestia", name: "Bestiary and NPCs", what: "who everyone is, in one place" },
    { id: "pf2apsog20advent", name: "Adventure Toolbox", what: "the subsystems and the new rules" },
    { id: "pf2apsog18sangpo", name: "Sangpotshi", what: "the cycle of souls the whole AP turns on" },
    { id: "pf2apsog19cycles", name: "Cycles of Destruction", what: "Kugaptee, and what he is" },
    { id: "pf2apsog16contin", name: "Continuing the Campaign", what: "after the Dusklight Torch" },
    { id: "pf2apsog22sogpgh", name: "Player's Guide", what: "safe to show the table" }
  ]
};

/* Every entry in the adventure, keyed by the two-digit ordinal its documents
   carry. A page id begins with that ordinal, so a page alone is enough to say
   which entry to open — which is what lets a Chapter 1 item point at the
   Chapter 2 page where its payoff actually lives. */
const JOURNAL_BY_ORD = {
  "01": "pf2apsog01frontm", "02": "pf2apsog02willow", "03": "pf2apsog03toligh",
  "04": "pf2apsog04reclai", "05": "pf2apsog05thewil", "06": "pf2apsog06thewal",
  "07": "pf2apsog07turnin", "08": "pf2apsog08theenl", "09": "pf2apsog09inther",
  "10": "pf2apsog10oblivi", "11": "pf2apsog11faceto", "12": "pf2apsog12thispl",
  "13": "pf2apsog13willow", "14": "pf2apsog14thepri", "15": "pf2apsog15afiend",
  "16": "pf2apsog16contin", "17": "pf2apsog17firstl", "18": "pf2apsog18sangpo",
  "19": "pf2apsog19cycles", "20": "pf2apsog20advent", "21": "pf2apsog21bestia",
  "22": "pf2apsog22sogpgh", "23": "pf2apsog23artgal"
};

/* ------------------------------------------------------------ the playlists
   Resolving a sound: the playlist by its module id, then by the name the
   sidebar shows, then any playlist at all that has a sound by this name. The
   last step is what makes `act.amb` work when a world reorganised the
   playlists, and what makes a bed named the same in four acts still play.

   `act.*` is resolved against whichever act the table is in, which is why
   these take the current act rather than reading it themselves. */
function playlistId(ref, act) {
  const [group, kind] = String(ref ?? "").split(".");
  if (!kind) return PLAYLISTS[group] ?? null;
  const g = group === "act" ? PLAYLISTS[`a${act}`] : PLAYLISTS[group];
  return g?.[kind] ?? null;
}

function findSound(ref, act, name) {
  const id = playlistId(ref, act);
  const lists = [...(game.playlists ?? [])];
  const named = (pl) => pl?.sounds?.getName?.(name)
    ?? [...(pl?.sounds ?? [])].find(x => x.name === name) ?? null;

  const byId = id ? game.playlists?.get?.(id) : null;
  let sound = named(byId);
  if (sound) return { playlist: byId, sound };

  const label = (PLAYLIST_NAMES[ref] ?? "").split(" · ").pop();
  for (const pl of lists) {
    if (label && pl.name !== label) continue;
    sound = named(pl);
    if (sound) return { playlist: pl, sound };
  }
  for (const pl of lists) {
    sound = named(pl);
    if (sound) return { playlist: pl, sound };
  }
  return { playlist: null, sound: null };
}

/* Toggle, not play: the same button stops what it started, which is the only
   sane behaviour for an ambient bed you started three scenes ago. */
async function toggleSound(ref, act, name) {
  const { playlist, sound } = findSound(ref, act, name);
  if (!sound) {
    ui.notifications.warn(`No sound named "${name}" in ${playlistLabel(ref, act)}, or anywhere else in this world's playlists.`);
    return;
  }
  if (sound.playing) await playlist.stopSound(sound);
  else await playlist.playSound(sound);
}

/* ------------------------------------------------------- item → journal page
   Read out of the module's own pack (`packs/adventures`), not inferred: every
   id below is a real JournalEntryPage in the shipped adventure. Kept as one
   table rather than a field on each item so the whole mapping can be checked
   against the module in one place.

   A few items are deliberately cross-chapter — Chapter 1's kappas point at
   Chapter 2's bathhouse, Chapter 10's cash-out points at Chapter 8's
   Preparation Points — because that's where the text that matters is.

   Items with no row here still get a link when their label names an area:
   `hintFor` reads the code off the label and resolves it by page id. */
const PAGES = {
  "1.lantern": "03lightthenigh00",   "1.abacus": "03a1thetrapped00",
  "1.sumika": "03a1thetrapped00",    "1.kappas": "04b15mostlyhap00",
  "1.elders": "03meetinggrann00",    "1.returning": "03returninghom00",

  "2.butcher": "04liberatingdo00",   "2.douqiu": "04c3privateban00",
  "2.prison": "04b4prison000000",    "2.will": "04c1publicfloo00",
  "2.elope": "04b11mudwallho00",

  "3.governor": "05themissinggo00",  "3.xungu": "05d7infestedgr00",
  "3.willow": "05talkingwithg00",    "3.teahouse": "05d9eyesoffume00",
  "3.teafarm": "05opportunitie00",   "3.expansion": "05d8oldvillage00",
  "3.duel": "05wholeadswill00",      "3.peachwood": "05ppeachwoodgr00",
  "3.cloak": "05songsatcanar00",     "3.shinzo": "05themysteriou00",
  "3.lesson1": "05talkingwithg00",

  "4.ledger": "06zoudousrite000",    "4.advance": "06advanceknowl00",
  "4.bargain": "06e14workersdo00",   "4.gift": "06themerchantr00",
  "4.effigy": "06e14workersdo00",    "4.irondoor": "06e11campoffic00",
  "4.intime": "06theritualsit00",    "4.mengsung": "06interrupting00",
  "4.pledge": "06zoudousrite000",    "4.abductees": "06concludingac00",

  "5.research": "07researchingt00",  "5.restored": "07restoringthe00",
  "5.food": "07gatheringfoo00",      "5.security": "07increasingse00",
  "5.yami": "07week5themiss00",      "5.festival": "07week3firstlo00",
  "5.feast": "07week10feasto00",     "5.curse": "07week11thefac00",
  "5.vanishing": "07week12vanish00", "5.lesson2": "07researchingt00",

  "6.seed": "08plantingthes00",      "6.bridge": "08b3bridgeshri00",
  "6.garden": "08c3gardenshri00",    "6.mountain": "08d3mountainsh00",
  "6.iogaka": "08d3mountainsh00",    "6.enko": "08b1tormentedk00",
  "6.bracelet": "08c2thegirlint00",  "6.gifts": "08thefinalday000",
  "6.lesson3": "08thepilgrimsp00",

  "7.statues": "09purifyingthe00",   "7.yenrui": "09e11hiddenlib00",
  "7.watchers": "09e11hiddenlib00",  "7.head": "09e13thetansug00",
  "7.tea": "09e6refectory000",       "7.yuni": "09e2courtyard000",
  "7.xinyue": "09e16kugaptees00",    "7.truth": "09returntowill00",
  "7.lesson": "09purifyingthe00",

  "8.clock": "10weeklyattrit00",     "8.rescue": "10event1struct00",
  "8.jelly": "10event1struct00",     "8.mill": "10event1struct00",
  "8.shift": "10anotherwillo00",     "8.talked": "10knowanddespa00",
  "8.journal": "10endofthedrea00",   "8.jorogumo": "10knowanddespa00",

  "9.answers": "11event4shinzo00",   "9.told": "11spreadingthe00",
  "9.faceless": "11event5facele00",  "9.chen": "11event12these00",
  "9.fenfang": "11event12these00",   "9.guanghao": "11event12these00",
  "9.renmeili": "11event13inter00",  "9.transres": "11researchingt00",
  "9.kiln": "11researchingt00",      "9.feathers": "11researchingt00",
  "9.slats": "11researchingt00",     "9.emotions": "11transmigrati00",
  "9.between": "11betweenlifea00",

  "10.teach": "12thehauntingo00",    "10.sweet": "12thehauntingo00",
  "10.shrine": "12c11shrine00000",   "10.ringer": "12c20kaisquart00",
  "10.relit": "12concludingth00",    "10.peace": "12runningoutof00",
  "10.bell": "12concludingth00",     "10.uglycute": "12ontokarahai000",
  "10.transmigrate": "12runningoutof00", "10.cashout": "10preparationp00",

  "11.fate": "13determiningw00",     "11.ancestry": "13wakinginwill00",
  "11.pass": "13approachingt00",     "11.false": "13a8primarysui00",
  "11.bridge": "13rebuildingth00",   "11.clues": "13thesilkwaspc00",
  "11.lokuon": "13thesilkwaspc00",   "11.farewell": "13shinzosfarew00",

  "12.alliance": "14meetingthepr00", "12.collars": "13silvercollar00",
  "12.spring": "14event1bright00",   "12.summer": "14event2fieryf00",
  "12.autumn": "14event3fallss00",   "12.winter": "14event5spiced00",
  "12.beyond": "14walkingthego00",   "12.witness": "14event6thesec00",
  "12.tokens": "14treasureandm00",   "12.prevented": "14treasureandm00",
  "12.fang": "14thefangandke00",     "12.door": "14thefangandke00",

  "13.portrait": "15c2courtyard000", "13.sages": "15c4meetingare00",
  "13.letter": "15c4meetingare00",   "13.camellia": "15c8masterbedr00",
  "13.mantra": "15c4meetingare00",   "13.souls": "15thechainedsp00",
  "13.redeem": "15speakingwith00",   "13.breach": "15hehshanbaofr00",
  "13.ending": "15concludingth00"
};

/* The same, for the loot ledger. Most rows say their area in `where` and are
   resolved from that; these are the ones that don't. */
const LOOT_PAGES = {
  "2.care": "04liberatingdo00",
  "3.peachwood": "05ppeachwoodgr00",
  "4.gift": "06themerchantr00",
  "5.yami": "07restoringthe00",    "5.shinzo": "07week3firstlo00",
  "6.feathers": "08intothewallo00",
  "6.enko": "08b1tormentedk00",    "6.charges": "08b3bridgeshri00",
  "6.orchids": "08c3gardenshri00", "6.soap": "08d3mountainsh00",
  "6.thurible": "08d3mountainsh00",
  "8.boots": "10event1struct00",   "8.tome": "10endofthedrea00",
  "8.formula": "10endofthedrea00",
  "9.legacy": "11event4shinzo00",  "9.collars": "11event13inter00",
  "9.msgring": "11event13inter00", "9.dust": "11event13inter00",
  "10.topup": "12runningoutof00",
  "11.lantern": "13theeternalla00", "11.bell": "13thewardingbe00",
  "11.farewell": "13shinzosfarew00",
  "12.rites": "14treasureandm00",  "12.bombs": "14event8thethi00"
};

const THEME = "parchment";
const PALETTES = {
  parchment: {
    paper: "#efe6d8", card: "#fbf7f0", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
    stripe: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.07)", field: "#fffdf8",
    rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12", teal: "#3f6f68"
  },
  dark: {
    paper: "#1f1d1b", card: "#2a2724", ink: "#ece5da", line: "#544d44", muted: "#a4988a",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(255,255,255,.08)", field: "#171513",
    rust: "#d4664a", ember: "#e0a052", moss: "#96b06a", slate: "#7fa0bb", plum: "#b98ab0", gold: "#d9b74f", teal: "#7fc0b4"
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
    note: "The one chapter with no encounter-by-encounter breakdown here — the items below are reconstructed from what later chapters refer back to.",
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
      { key: "gifts", label: "All three shrines reached — Pilgrimage Gifts at the crest",
        pays: "Ch 7 · one magic item per PC from the small shrine", at: 7,
        note: "Fewer than three and there are no gifts at all — only Zhi Hui's disappointment and an invitation to walk back." },
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
        note: "A critical success also reveals where Pharasma's head went. If a PC owns the teahouse, this is their scene." },
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
        note: "Severe 11 if it turns violent, and the rework adds +2 to the social DCs. If a PC owns the teahouse, this is their scene — push toward the ceremony." },
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
    { key: "feathers", label: "Two gemini trophy feathers", where: "The Soulthief's nest, inside the Wall" },
    { key: "gems", label: "Two fear gem talismans", where: "C1 — a clot of crystallised blood in each slain mandragora" },
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
    { key: "seasons", label: "Both scenes confirmed on Summer · `Enable Rain` for the rainy summer",
      note: "`Change Season` (Submacros) is what sets it — the campaign notes call the pair of scenes `Willowshore Seasons`." },
    { key: "rollers", label: "Both encounter rollers armed — the town table and the hinterlands table",
      note: "The town table died the moment the Eternal Lantern was relit; from here it's the hinterlands table that runs. See the procedure below." },
    { key: "singing", label: "`Singing` loop for the Canary Inn approach" }
  ],
  4: [
    { key: "chant", label: "`Ritual Chanting` loop underneath the approach" },
    { key: "stop", label: "`Stop Chanting` one-shot at the disruption · `Interrupting The Ritual` SFX",
      note: "Cut the chant audio the instant the ritual breaks — the silence is the cue for the rumble beyond the Wall." }
  ],
  5: [
    { key: "consoles", label: "Fall Downtime Tracker and First Long Night Console open" },
    { key: "seasons", label: "`Change Season` run once — summer to fall",
      note: "It repaints both the Willowshore and Willowshore Hinterlands scenes; the campaign notes call that pair `Willowshore Seasons`. It belongs at the end of Chapter 4, so if fall is already on the maps this is nothing to do." },
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
    { key: "season", label: "`Change Season` at the act transition — fall to winter",
      note: "Same submacro as the fall swap: both the Willowshore and Willowshore Hinterlands scenes, run at Return to Willowshore." },
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
    { key: "season", label: "`Change Season` at the act break — winter to spring",
      note: "The last of the four seasons on the Willowshore and Willowshore Hinterlands scenes, run at Running out of Time." }
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

/* ------------------------------------------------------ random encounters
   The module ships no RollTable documents — the two Act 1 random-encounter
   tables are HTML tables inside journal pages. So the dice live here: a flat
   check to gate the encounter, then a die against the rows, rolled with the
   Foundry dice API and posted to chat. Rows transcribed from the module's
   own pages. */
const ENCOUNTERS = {
  hinterlands: {
    page: "05exploringthe00", title: "Hinterlands Random Encounters",
    flat: 17, flatNote: "once per day in the hinterlands",
    dice: [
      { key: "near", die: "d12", label: "within 2 hexes of Willowshore" },
      { key: "far", die: "d20", label: "deeper wilderness" }
    ],
    rows: [
      { lo: 1, hi: 3, name: "2 Giant Centipedes", threat: "Trivial 2" },
      { lo: 4, hi: 6, name: "1 Slime Mold", threat: "Trivial 2" },
      { lo: 7, hi: 9, name: "2 Thatchlings", threat: "Trivial 2" },
      { lo: 10, hi: 11, name: "2 Hunting Spiders", threat: "Low 2" },
      { lo: 12, hi: 13, name: "2 Wolves", threat: "Low 2" },
      { lo: 14, hi: 15, name: "3 Thatchlings", threat: "Low 2" },
      { lo: 16, hi: 17, name: "2 Jinkins", threat: "Low 2" },
      { lo: 18, hi: 18, name: "1 Giant Stag Beetle", threat: "Moderate 2" },
      { lo: 19, hi: 19, name: "4 Noppera-bo Grunts", threat: "Moderate 2" },
      { lo: 20, hi: 20, name: "2 Boars", threat: "Moderate 2" }
    ]
  },
  town: {
    page: "03randomencoun00", title: "Willowshore Random Encounters",
    flat: 10, flatNote: "every 4–8 hours in town; +5 at night (over 20 = 20); ends once the Eternal Lantern is lit",
    dice: [
      { key: "near", die: "d20", label: "in town" }
    ],
    rows: [
      { lo: 1, hi: 2, name: "1 Giant Cockroach", threat: "Trivial 1" },
      { lo: 3, hi: 4, name: "Haunting Presence", threat: "Trivial 1" },
      { lo: 5, hi: 6, name: "1 Jinkin", threat: "Trivial 1" },
      { lo: 7, hi: 8, name: "1 Spider Swarm", threat: "Trivial 1" },
      { lo: 9, hi: 10, name: "Haunting Presence", threat: "Trivial 1" },
      { lo: 11, hi: 12, name: "Haunting Presences (2)", threat: "Low 1" },
      { lo: 13, hi: 14, name: "1 Jinkin and 1 Viper", threat: "Low 1" },
      { lo: 15, hi: 16, name: "3 Phantom Ravens", threat: "Low 1" },
      { lo: 17, hi: 18, name: "1 Phantom Boar", threat: "Low 1" },
      { lo: 19, hi: 20, name: "2 Phantom Wolves", threat: "Moderate 1" }
    ]
  }
};

/* ------------------------------------------------------- table procedures
   Running rules that aren't a decision to tick — they're a loop you keep
   turning for a whole chapter. Kept out of `items` so they don't dilute the
   checklist count, and rendered wherever the chapter is on screen. */
const PROCEDURES = {
  1: [{
    key: "townwander",
    title: "Town random encounters",
    sub: "the Willowshore table, until the lantern is lit",
    lines: [
      "While the town is monster-held, roll a <b>DC 10 flat check</b> every four to eight hours the party travels town. At night, add +5 to the table roll, treating results over 20 as a 20.",
      "Each PC Avoiding Notice or Scouting raises the flat-check DC by 1; each Hustling or Searching lowers it by 2. At most one random encounter a day."
    ],
    note: "These stop once the Eternal Lantern is lit. Phantoms outdoors by day are no encounter; the vermin fight to the death under Kugaptee's growing influence.",
    roll: "town"
  }],
  3: [{
    key: "wander",
    title: "Hinterlands random encounters",
    sub: "the wandering monster table, D1–D13",
    roll: "hinterlands",
    lines: [
      "<b>Once per day</b> the party spends in the hinterlands, roll a <b>DC 17 flat check</b>. On a success, an encounter happens — you decide whether it lands while they travel or while they camp.",
      "Roll on the <b>Hinterlands Random Encounters</b> table. The book uses one die within <b>2 hexes of Willowshore</b> and another further out into the wilderness; the two rolls are not the same.",
      "Threats run <b>Trivial 2 to Moderate 2</b> and are written for a 2nd-level party, because that's when the hexploration happens."
    ],
    what: [
      "<b>Animals</b> — wary, and they only fight if attacked first. There is exactly <b>one</b> giant stag beetle in the region.",
      "<b>Jinkins</b> — survivors of the invasion. One shrieks and flees into the wild the moment it takes any damage.",
      "<b>Noppera-bos</b> — outcasts who never got into the lumber camp gathering. They fight to the death hoping the party's heads buy them a place.",
      "<b>Slime molds</b> — wandered out of the fungal infestation at D7. <b>Six</b> in the whole hinterlands, and no more.",
      "<b>Thatchlings</b> — not the ones at Canary Inn."
    ],
    note: "Don't power the table up as the party levels. The book is explicit: a hinterlands that scales with them stops reading like somewhere a town could survive. Once Act 2 starts, either drop wandering monsters or narrate them without rolling initiative.",
    foundry: "`Hinterlands Control` (Act 1) drives every tile on the Willowshore Hinterlands scene, and the module ships a party token for the hexploration."
  }]
};

/* ------------------------------------------------------------- side quests
   The optional asks in Act 1 — Granny Hu's two extra requests and the eight
   hinterlands opportunities. Kept apart from the decisions checklist, because
   a side quest the party never took isn't a skipped obligation; it's a road
   not walked. The Summer Console carries the full VP trackers for the eight;
   these are the tick-it-done reminders with a link into the book. */
const SIDE_QUESTS = {
  1: [
    { key: "doctor", name: "Checking the Doctor — Clash at the Clinic", page: "03a2clashatthe00",
      note: "Granny Hu's request. Giant centipedes swarm the Hand of Spring clinic; keep Doctor Dami alive." },
    { key: "children", name: "Missing Grandchildren — The Worst Puzzle", page: "03theworstpuzz00",
      note: "Granny Hu's request. Four revelers stranded in a jinkin-rigged drying yard." }
  ],
  3: [
    { key: "boats", name: "Missing Boats (D2)", page: "05d2gourdlake000",
      note: "Rajul Samudra's boats, at Gourd Lake. Win three-of-five sumo matches to get them back." },
    { key: "ranch", name: "Fixing the Ranch (W2)", page: "05opportunitie00",
      note: "Kum Soon-chong's stables. Round up livestock and mend the fence — 10 VP." },
    { key: "shrine", name: "Moving Desna's Shrine (W8)", page: "05opportunitie00",
      note: "Choe Chung-hu's shrine. Sway the kami Kohoshi, then move it — 5 VP." },
    { key: "expansion", name: "Investigate the Old Expansion (D8)", page: "05d8oldvillage00",
      note: "Matsuki Shou's survey for emergency cropland — 8 VP, pays off in Act 2." },
    { key: "smith", name: "Smith Troubles (W1)", page: "05opportunitie00",
      note: "Yong Wu-Xiu vs. the guards. Two exclusive outcomes — 6 VP." },
    { key: "peachwood", name: "Collecting Peachwood", page: "05ppeachwoodgr00",
      note: "Yun Mong-un's rare fulus. A crit failure loses a grove for the campaign." },
    { key: "teahouse", name: "The Teahouse Owner's Will (D9)", page: "05d9eyesoffume00",
      note: "Two pearls from the Eyes of Fumeiyoshi. Triggers the Tea Farm quest a week later." },
    { key: "teafarm", name: "Tea Farm Infestation (W35)", page: "05opportunitie00",
      note: "Mountain Summit Grass's blight — 10 VP." }
  ]
};

/* ---------------------------------------------------- this repo's consoles
   The other macros in this collection, against the chapters they're for. The
   tracker can't launch them — they're separate macros in your directory — so
   this is a pointer, the same as the module macro lists. */
const OUR_MACROS = {
  1: [
    { name: "Summer Console", file: "summer-console.js",
      what: "the whole of Act 1 — the town tab (lantern, ringleaders, level, reputation) and Chapter 1's lantern quest" }
  ],
  2: [
    { name: "Summer Console", file: "summer-console.js",
      what: "Act 1's console — Chapter 2's downtown clearance and the Cerulean Teahouse" }
  ],
  3: [
    { name: "Who Leads Willowshore Console", file: "who-leads-willowshore-console.js",
      what: "the Chapter 3 champions' duel for the town's leadership — the Level 3 milestone" },
    { name: "Summer Console", file: "summer-console.js",
      what: "Act 1's console — Chapter 3's hinterlands sandbox, the eight opportunities, and the three investigations" }
  ],
  4: [
    { name: "Summer Console", file: "summer-console.js",
      what: "Act 1's console — Chapter 4's lumber camp, the Ritual Site, and the Horror from Beyond" }
  ],
  5: [
    { name: "Fall Downtime Tracker", file: "fall-downtime-tracker.js",
      what: "the whole twelve weeks — Hope, Food, Security, teahouse restoration, the research caps, and every weekly event" },
    { name: "First Long Night Console", file: "first-long-night-console.js",
      what: "week 3's festival — the grand show, the three contests, the twelve games, and the titles they hand out" }
  ],
  6: [
    { name: "Enlightened Path Console", file: "enlightened-path-console.js",
      what: "the soul-seed ritual and the four days — the three shrines and their enlightenment conditions" }
  ],
  7: [
    { name: "Ruins of Wisdom Console", file: "ruins-of-wisdom-console.js",
      what: "the four statue purifications, Zhi Hui's manifestations, the per-area beats, and the aftermath ledger back into the downtime tracker" }
  ],
  10: [
    { name: "Fall Downtime Tracker", file: "fall-downtime-tracker.js",
      what: "still worth opening — the pools it banked are the Preparation Points counted when Transmigrate fires" }
  ]
};

/* ------------------------------------------------- the module's own macros
   The Season of Ghosts Foundry module ships a macro directory organised by
   act. These are reminders that the macro exists and where it lives — nothing
   here clicks them for you, because they're run from the directory.

   `chapters` holds the ones whose chapter is certain, either because the
   campaign notes name them or because the adventure text links them from a
   scene-notes block. `acts` holds the ones that could only be placed to an
   act; move them into `chapters` once you know. `always` is the Submacros
   folder, useful anywhere. */
const MODULE_MACROS = {
  chapters: {
    1: [{ name: "Light Eternal Lantern", folder: "Act 1" },
        { name: "Enable Blood Moon", folder: "Act 1", note: "Maze of Mist, Rain of Blood" },
        { name: "Enable Rain", folder: "Act 1", note: "same encounter" }],
    3: [{ name: "Enable Rain", folder: "Act 1" },
        { name: "Toggle Mindscape Border Visibility", folder: "Act 1", note: "The Mindscape Border" },
        { name: "Hinterlands Control", folder: "Act 1", note: "every tile on the Willowshore Hinterlands scene" }],
    4: [{ name: "Stop Chanting", folder: "Act 1" },
        { name: "Change Season", folder: "Submacros", note: "Concluding Act 1 — summer to fall" }],
    6: [{ name: "Open the Wall of Ghosts", folder: "Act 2" },
        { name: "Reveal Mandragora", folder: "Act 2" }],
    7: [{ name: "Return Head", folder: "Act 2" },
        { name: "Change Season", folder: "Submacros", note: "Return to Willowshore — fall to winter" }],
    9: [{ name: "Open Portal", folder: "Act 3", note: "Between Life and Death" },
        { name: "Partially Open Portal", folder: "Act 3", note: "Between Life and Death" }],
    10: [{ name: "Terror in Karahai", folder: "Act 3" },
         { name: "Warding Bell", folder: "Act 3" },
         { name: "Pan Fenfang True Form", folder: "Act 3", note: "General Storage — C14" },
         { name: "Change Season", folder: "Submacros", note: "Running out of Time — winter to spring" },
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
  acts: {},
  always: [
    { name: "Change Season", folder: "Submacros" },
    { name: "Change Dynamic Ring and Turn Marker", folder: "Submacros" },
    { name: "Landing Picker", folder: "Submacros" },
    { name: "Roof Control", folder: "Submacros" },
    { name: "Toggle Party Platter (4 Characters)", folder: "Submacros" },
    { name: "Toggle Party Platter (6 Characters)", folder: "Submacros" }
  ]
};

/* -------------------------------------------------- the module's playlists
   The same module ships playlists per act — Ambience, Loop, and SFX — plus a
   soundtrack and a looped soundtrack whose track names line up with the
   chapters almost exactly.

   Unlike the macros, these are remote control: every sound below carries the
   id of the playlist it lives in, so the console can start and stop it. The
   ids are the module's own and a Foundry adventure import keeps them.

   `always` holds the generic beds that appear in nearly every act's ambience
   list, so they aren't repeated against all thirteen chapters. Those resolve
   against whichever act the table is in — `act.amb` means "this act's
   ambience playlist". */
const PLAYLISTS = {
  a1: { amb: "HgqDtdyAVJFT3Dr1", sfx: "PM69203E3Y3UrHfA", loop: "zLGowtHaJW7U2VZM" },
  a2: { amb: "jXKZ6O8NnYJaazKE", sfx: "kcrfM86DAcpOfBrs", loop: "e2Pf6JGVba202cFB" },
  a3: { amb: "gTnkl7DUH19mzyJj", sfx: "0GuH1kstxWaqGSJx", loop: "TmxsF1RiQJ0m8o5M",
        seance: "h82ztCVRXELKQI8K" },
  a4: { amb: "FGK5jsYreqU1AR5o", sfx: "Mv66f1NNleR53M5o", loop: "xYqkP4IEtZhyaILa" },
  track: "7AzVaYG1M2yMtzIu", looped: "dbfW0zvQ2tf5VOCx"
};
/* What each playlist is called in the sidebar. Act 2 spells it "Ambiance"
   and Act 3 "Ambiances"; both are the module's own spelling, not a typo
   here. */
const PLAYLIST_NAMES = {
  "a1.amb": "Act 1 · Ambience", "a1.sfx": "Act 1 · SFX", "a1.loop": "Act 1 · Loop",
  "a2.amb": "Act 2 · Ambiance", "a2.sfx": "Act 2 · SFX", "a2.loop": "Act 2 · Loop",
  "a3.amb": "Act 3 · Ambiances", "a3.sfx": "Act 3 · SFX", "a3.loop": "Act 3 · Loop",
  "a3.seance": "Act 3 · Seance",
  "a4.amb": "Act 4 · Ambience", "a4.sfx": "Act 4 · SFX", "a4.loop": "Act 4 · Loop",
  "track": "Soundtrack", "looped": "Looped Soundtrack"
};
/* `act.amb` is whichever act the table is in, so its label is too. */
const playlistLabel = (ref, act) => PLAYLIST_NAMES[String(ref).replace(/^act\./, `a${act}.`)] ?? ref;

const AUDIO = {
  /* `acts` narrows a row to the acts whose playlist actually has the sound —
     the generic beds are not as uniform across the four as they look. */
  always: [
    { pl: "act.amb", sounds: ["Indoors", "Woods", "Willowshore", "Willowshore Hinterlands"] },
    { pl: "act.amb", sounds: ["Mist Indoors", "Mist Outdoors"], acts: [2, 3, 4] },
    { pl: "a1.amb", sounds: ["Mist Urban", "Mist Nature"], acts: [1],
      note: "Act 1's names for the same two beds" },
    { pl: "act.amb", sounds: ["Dense Fog"], acts: [1, 2, 3] },
    { pl: "a4.sfx", sounds: ["Dense Fog"], acts: [4], note: "Act 4 files it under SFX" },
    { pl: "act.loop", sounds: ["River"], acts: [1, 2, 4] }
  ],
  chapters: {
    1: [{ pl: "a1.amb", sounds: ["Occupied Willowshore"] },
        { pl: "a1.loop", sounds: ["Eternal Lantern"] },
        { pl: "a1.sfx", sounds: ["Lighting The Eternal Lantern"] }],
    2: [{ pl: "a1.amb", sounds: ["Occupied Willowshore"] },
        { pl: "a1.loop", sounds: ["Rowdy Celebration"] },
        { pl: "a1.sfx", sounds: ["Rowdy Celebration 1"] }],
    3: [{ pl: "a1.amb", sounds: ["Canary Inn"] },
        { pl: "a1.loop", sounds: ["Singing"], note: "the Canary Inn approach" },
        { pl: "a1.amb", sounds: ["Wind"] }],
    4: [{ pl: "a1.amb", sounds: ["The Lumber Camp"] },
        { pl: "a1.loop", sounds: ["Ritual Chanting"] },
        { pl: "a1.sfx", sounds: ["Interrupting The Ritual"], note: "cut the chant the instant it breaks" }],
    5: [{ pl: "a2.amb", sounds: ["Festival"], note: "week 3" },
        { pl: "a2.amb", sounds: ["Barn Fire"], note: "week 8" },
        { pl: "a2.amb", sounds: ["Feast Of The Kami"], note: "week 10" }],
    6: [{ pl: "a2.amb", sounds: ["Rain", "Thunderstorm"], note: "days 2 and 3" },
        { pl: "a2.loop", sounds: ["Waterfall"], note: "the Mountain Shrine" },
        { pl: "a2.sfx", sounds: ["Arms of the Drowned"], note: "the Bridge Shrine haunt" },
        { pl: "a2.sfx", sounds: ["Terrifying Roar"] },
        { pl: "a2.sfx", sounds: ["Lightning Bolt"], note: "Iogaka" }],
    7: [{ pl: "a2.amb", sounds: ["Old Large Monastery"] },
        { pl: "a2.amb", sounds: ["Kugaptees Grave"], note: "E16" }],
    8: [{ pl: "a3.amb", sounds: ["Governor's Manor"] },
        { pl: "a3.amb", sounds: ["Dark Willowshore"] },
        { pl: "a3.loop", sounds: ["Buildings Collapsing"], note: "the Structural Collapse" },
        { pl: "a3.loop", sounds: ["Pounding at the Manor Walls", "Howling Crowd"], note: "the nightly crowd" },
        { pl: "a3.sfx", sounds: ["Mindscape Shift"] },
        { pl: "a3.sfx", sounds: ["The Manor is Breached"] }],
    9: [{ pl: "a3.seance", sounds: ["Seance 1", "Seance 2"], note: "Event 12" },
        { pl: "a3.sfx", sounds: ["Ending the Seance"] },
        { pl: "a3.amb", sounds: ["Borderlands"], note: "Between Life and Death" },
        { pl: "a3.sfx", sounds: ["Portal Opens"], note: "Between Life and Death, with the portal macros" }],
    10: [{ pl: "a3.amb", sounds: ["Karahai Village Day", "Karahai Village Night"] },
         { pl: "a3.amb", sounds: ["Karahai Fortress"], note: "also in Act 3 · Loop" },
         { pl: "a3.loop", sounds: ["Dining Hall", "Shrine", "Baths"], note: "fortress rooms" },
         { pl: "a3.amb", sounds: ["Invisible Flames"], guess: true },
         { pl: "a3.sfx", sounds: ["Warding Bell"], note: "C11" }],
    11: [{ pl: "a4.amb", sounds: ["Dark Willowshore", "Governors Manor"] },
         { pl: "a4.amb", sounds: ["Creek"], note: "the bridge" },
         { pl: "a4.loop", sounds: ["Coastline"], note: "the camp" },
         { pl: "a4.sfx", sounds: ["Clouds Of Butterflies"], note: "the False Governor in A8" }],
    12: [{ pl: "a4.amb", sounds: ["Softly Playing Flute"], note: "the yohoi fears it" },
         { pl: "a4.amb", sounds: ["Creaky Building"], guess: true }],
    13: [{ pl: "a4.amb", sounds: ["Below Kugaptees Claw", "Kuraptees Rise"] },
         { pl: "a4.sfx", sounds: ["Old Tree Falling"], note: "D2, with the Sugi Tree Falls macros" },
         { pl: "a4.sfx", sounds: ["Crashing Arms"], note: "Kugaptee's Final Death — the Sealing's pulses" },
         { pl: "a4.sfx", sounds: ["Death Roar", "Demonic Roar"] },
         { pl: "a4.sfx", sounds: ["Mindscape Shift"] }]
  },
  /* The looped soundtrack, by the chapter each track was clearly written for.
     Named exactly as the Looped Soundtrack playlist has them, trailing "Loop"
     and all — the plain Soundtrack playlist holds one-shot versions of the
     same pieces under slightly different names. */
  track: {
    1: ["02 The Summer That Never Was Loop", "03 Relight the Eternal Lantern Loop"],
    2: ["04 Town of Willowshore Loop"],
    3: ["06 The Hinterlands Loop", "05 The Mysterious Merchant Loop"],
    4: ["07 The Wall of Ghosts Loop", "08 Horror From Beyond Loop"],
    5: ["09 Let The Leaves Fall Loop", "10 Researching The Curse Loop", "13 First Long Night Loop"],
    6: ["11 The Pilgrim's Path Loop"],
    7: ["12 Tan Sugi Monastery Loop"],
    8: ["14 Oblivion of Truth Loop", "17 Worlds Within the Mind Loop"],
    9: ["15 The Ritual Loop"],
    10: ["16 Fortress of Karahai Loop"],
    11: ["18 The Plum Knows Before The Cherry Loop", "19 Bridges and Bandits Loop"],
    12: ["20 The Princess's Web Loop"],
    13: ["21 Into The Corruption Loop", "22 The Governor's Den Loop"]
  },
  theme: "01 Season of Ghosts Loop"
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

/* ------------------------------------------------ what the festival handed out
   The First Long Night console awards a gold medal per game, and each gold
   carries a title and a keepsake. Mirrored here — key, title, prize and
   discipline — so the party panel can name what each PC walked away with
   without the festival console being open. Sweeping a discipline's events
   adds its champion title on top. Keep in step with GAMES and DISCIPLINES in
   `first-long-night-console.js`. */
const FESTIVAL_TITLES = {
  sprint:   { disc: "body", title: "The Quick-Hand", prize: "A frayed-rope bracelet" },
  pole:     { disc: "body", title: "The High-Reacher", prize: "The Crown Lantern, released at dawn" },
  cricket:  { disc: "body", title: "Cricket-Friend", prize: "A carved cricket-cage" },
  riddle:   { disc: "wit", title: "The Sharp-Tongue", prize: "A brushed riddle-scroll" },
  stones:   { disc: "wit", title: "Luck of the Moon", prize: "A pouch of moon-tokens" },
  cipher:   { disc: "wit", title: "The Far-Speaker", prize: "First pick of any released lantern" },
  poetry:   { disc: "heart", title: "Moon-Poet", prize: "A lacquered fan", favor: "First toast at the feast" },
  boast:    { disc: "heart", title: "Teller of Tall Tales", prize: "Free drinks all night" },
  catwalk:  { disc: "heart", title: "Forest-Clad", prize: "A fine straw-and-bamboo cape" },
  drinking: { disc: "daring", title: "Iron-Gut", prize: "A gourd flask" },
  toss:     { disc: "daring", title: "True-Aim", prize: "A granted wish — a small story boon", favor: "Your festival wish is granted" },
  ghost:    { disc: "daring", title: "The Unseen, or Ghost-Catcher", prize: "The paper ghost-mask itself" }
};
const FESTIVAL_SWEEPS = {
  body: "Champion of Body", wit: "Champion of Wit",
  heart: "Champion of Heart", daring: "Champion of Daring"
};

/* Your own PCs' campaign arcs, keyed by the actor's name, shown under them on
   the party panel. Empty by design — this is the one place in the macro that
   can't be filled in from the book. A line each is enough:

     const ARCS = {
       "Some Bard": "Harpist, 17, tool-shop family",
       "Some Monk": "Created by Master Zhi Hui — the Unfinished Lesson lands in Ch 7"
     };

   A name with no entry simply shows no arc line. */
const ARCS = {};

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "campaign", pcs,
    /* Chapter 1, running. Advance it from the act tabs. */
    chapters: { 1: "active" },
    flags: {},
    quests: {},
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

/* ------------------------------------------------------- journal resolution
   Three ways in, tried in order, because a world can hold the adventure in
   three different shapes: imported with its ids intact, imported and renamed
   or re-created, or still sitting in the module's compendiums.

   Page lookup has two forms. An `area` code resolves against the page *id*,
   because the module builds those as `<entry ordinal><area code><name slug>`
   — `05d11lumbercam00` is Chapter 3's D11. That needs no guess about what the
   page is called. A `page` hint is a page *name*, matched loosely, for the
   pages that carry no area code. */
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function journalOf(n) { return JOURNAL.chapters[n] ?? null; }

/* World only, and synchronous — the UI uses this to decide whether a link is
   worth offering before anyone clicks it. */
function findEntry(desc) {
  if (!desc) return null;
  const byId = game.journal?.get?.(desc.id);
  if (byId) return byId;
  const want = norm(desc.name);
  const all = [...(game.journal ?? [])];
  /* Exact before loose: "Willowshore" must not swallow "Willowshore's Return". */
  return all.find(j => norm(j.name) === want)
      ?? all.find(j => norm(j.name).endsWith(want))
      ?? null;
}

/* Adds the compendiums, which have to be awaited. */
async function loadEntry(desc) {
  const local = findEntry(desc);
  if (local) return local;
  const want = norm(desc.name);
  for (const pack of game.packs ?? []) {
    if (pack.documentName !== "JournalEntry") continue;
    const idx = [...pack.index];
    const hit = pack.index.get?.(desc.id)
      ?? idx.find(e => norm(e.name) === want)
      ?? idx.find(e => norm(e.name).endsWith(want));
    if (hit) return pack.getDocument(hit._id);
  }
  return null;
}

function findPage(entry, { area, pageId } = {}) {
  const pages = entry?.pages?.contents ?? entry?.pages ?? [];
  if (pageId) {
    const hit = pages.find(p => p.id === pageId);
    if (hit) return hit;
  }
  if (area) {
    /* The entry ordinal is the two digits in the middle of its id. */
    const ord = String(entry.id ?? "").slice(8, 10);
    for (const code of [area, area.replace(/[a-z]+$/i, "")]) {
      if (!code) continue;
      const head = `${ord}${code}`.toLowerCase();
      /* `05d1` must not match `05d10…`, so the next character can't be a digit. */
      const hit = pages.find(p => p.id.toLowerCase().startsWith(head) && !/\d/.test(p.id.charAt(head.length)));
      if (hit) return hit;
    }
  }
  return null;
}

/* The one entry point the UI calls. Never throws; says what it looked for. */
async function openJournal(desc, hint = {}) {
  if (!desc) return;
  const entry = await loadEntry(desc);
  if (!entry) {
    ui.notifications.warn(`No journal found for "${desc.name}". Looked for the id ${desc.id}, then that name in the journal directory and the compendiums.`);
    return;
  }
  const page = findPage(entry, hint);
  entry.sheet.render(true, page ? { pageId: page.id } : {});
  if ((hint.area || hint.pageId) && !page) {
    ui.notifications.info(`Opened "${entry.name}" — no page in it matched ${hint.area ? `area ${hint.area}` : hint.pageId}.`);
  }
}

/* An item's link target. The mapped page wins; failing that, an area code
   read off the label — the labels name areas the way the book does, "(D7)",
   "B4 —", "(E11) found", so a standalone code is safe to pick up.

   A mapped page can belong to a different entry than the item's chapter, so
   the descriptor comes back with the hint rather than being assumed. */
const AREA_RE = /(?:^|[\s(])([A-E]\d{1,2}[a-d]?)(?=[\s),.:—→]|$)/;

function targetFor(n, item, { loot = false } = {}) {
  const pageId = loot ? LOOT_PAGES[`${n}.${item.key}`] : PAGES[`${n}.${item.key}`];
  if (pageId) {
    const id = JOURNAL_BY_ORD[pageId.slice(0, 2)];
    const known = Object.values(JOURNAL.chapters).find(d => d.id === id)
      ?? JOURNAL.reference.find(d => d.id === id);
    return { desc: known ?? { id, name: id }, pageId };
  }
  /* A loot row says where it is in `where`; a checklist item says it in the
     label. Either way the code is read off the book's own phrasing. */
  const m = AREA_RE.exec((loot ? item.where : item.label) ?? "");
  if (m && journalOf(n)) return { desc: journalOf(n), area: m[1] };
  return null;
}

/* A journal target from a bare page id, for content that lives on a page but
   isn't a chapter decision (side quests, the encounter tables). */
function pageTarget(pageId) {
  const id = JOURNAL_BY_ORD[pageId.slice(0, 2)];
  const desc = Object.values(JOURNAL.chapters).find(d => d.id === id)
    ?? JOURNAL.reference.find(d => d.id === id)
    ?? { id, name: id };
  return { desc, pageId };
}

/* Roll a formula with whatever dice API this Foundry version exposes. Null
   when there is none, and the caller falls back to an inline roll. */
async function rollDie(formula) {
  const C = globalThis.Roll ?? foundry.dice?.Roll ?? foundry.dice?.terms?.Roll;
  if (!C) return null;
  try { return await new C(formula).evaluate({ async: true }); } catch { return null; }
}

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
  flag(n, key) {
    const b = bridgeFor(n, key);
    if (b) return b.get(this.consoleState(b.setting) ?? {});
    return !!this.s.flags[this.flagId(n, key)];
  }
  toggleFlag(n, key) {
    const b = bridgeFor(n, key);
    const item = chapter(n)?.items.find(i => i.key === key);
    if (b) { this.toggleConsole(b, item?.label ?? key); return; }
    const id = this.flagId(n, key);
    const on = !!this.s.flags[id];
    if (on) delete this.s.flags[id]; else this.s.flags[id] = true;
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
  procsFor(n) { return PROCEDURES[n] ?? []; }
  oursFor(n) { return OUR_MACROS[n] ?? []; }

  audioFor(n) { return AUDIO.chapters[n] ?? []; }
  trackFor(n) { return AUDIO.track[n] ?? []; }

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

  /* ----- side quests -----
     The Act 1 asks: Granny Hu's two extra requests and the eight hinterlands
     opportunities. Same toggle shape as flags, kept in their own bucket so
     the decisions count isn't diluted by quests the party simply never took. */
  questsFor(n) { return SIDE_QUESTS[n] ?? []; }
  quested(n, key) { return !!this.s.quests[`${n}.${key}`]; }
  toggleQuest(n, key) {
    const id = `${n}.${key}`;
    const on = !!this.s.quests[id];
    if (on) delete this.s.quests[id]; else this.s.quests[id] = true;
    const q = this.questsFor(n).find(x => x.key === key);
    this.log(`Ch ${n} quest — ${q?.name ?? key}: ${on ? "unticked" : "done"}.`);
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
     Anything with a downstream payoff, sorted by when it comes due.

     Only `hard` items can go overdue. Everything else is a thing the party
     could have done and didn't — the Abacus Sisters don't survive if the
     party kills them — so once its chapter is behind you it reads as skipped,
     not as a failure. A thread that's still due but whose chapter is still
     running stays pending: there's time. */
  itemState(n, item) {
    if (this.flag(n, item.key)) return "ok";
    if (!item.at || this.current.n < item.at) return "pending";
    if (item.hard) return "overdue";
    return this.statusOf(n) === "done" ? "skipped" : "pending";
  }

  get threads() {
    const out = [];
    for (const c of CHAPTERS) {
      for (const item of c.items) {
        if (!item.at) continue;
        const state = this.itemState(c.n, item);
        out.push({
          from: c.n, at: item.at, label: item.label, pays: item.pays ?? "",
          hard: !!item.hard, rework: !!item.rework, carried: state === "ok", state
        });
      }
    }
    return out.sort((a, b) => a.at - b.at || a.from - b.from);
  }
  get overdue() { return this.threads.filter(t => t.state === "overdue"); }

  /* ----- the festival -----
     Titles and keepsakes a PC won at the First Long Night, read straight from
     that console's saved medals. Matched on actor id, falling back to name,
     because the two macros detect the party independently. */
  festivalFor(pc) {
    const fln = this.consoleState("festival");
    const games = fln?.games;
    if (!games || !pc) return null;
    const list = fln.pcs ?? [];
    let idx = list.findIndex(p => pc.actorId && p.actorId === pc.actorId);
    if (idx < 0) idx = list.findIndex(p => p.name === pc.name);
    if (idx < 0) return null;

    const golds = Object.entries(games).filter(([, g]) => g?.gold === idx).map(([k]) => k);
    if (!golds.length) return null;

    const titles = golds.map(k => FESTIVAL_TITLES[k]?.title).filter(Boolean);
    for (const [disc, sweep] of Object.entries(FESTIVAL_SWEEPS)) {
      const events = Object.keys(FESTIVAL_TITLES).filter(k => FESTIVAL_TITLES[k].disc === disc);
      if (events.length && events.every(k => games[k]?.gold === idx)) titles.push(sweep);
    }
    const keeps = golds.map(k => FESTIVAL_TITLES[k]).filter(Boolean)
      .map(g => g.favor ? `${g.prize} · ${g.favor}` : g.prize);
    const silver = Object.values(games).filter(g => g?.silver === idx).length;
    return { titles, keeps, gold: golds.length, silver };
  }

  /* ----- the chapter consoles ----- */
  consoleState(which) { return game.settings.get("world", CONSOLES[which].split(".")[1]); }

  /* Toggle a console-backed value from this tracker. Reads the console's own
     setting, flips the field, and writes the whole object back — so a console
     open in another window sees a complete state, never a partial one. When the
     setting is still null the console has never been run (and can't be open),
     so a minimal seed is safe: that console's boot merges blankState over it. */
  async toggleConsole(b, label) {
    const ckey = CONSOLES[b.setting].split(".")[1];
    const st = game.settings.get("world", ckey) ?? {};
    const on = !b.get(st);
    b.set(st, on);
    if (this.editable) await game.settings.set("world", ckey, st);
    this.log(`${b.chip.label} — ${on ? b.chip.on : b.chip.off}.`);
    this.touch();
  }
  toggleConsoleByKey(id) {
    const b = BRIDGE[id];
    if (!b) return;
    this.toggleConsole(b, b.chip.label);
  }

  get rollup() {
    const dt = this.consoleState("downtime");
    const ruins = this.consoleState("ruins");
    const out = [];

    /* The toggleable elements — always shown, so a chapter you skipped (say,
       Act 1's Summer console) can still be marked here. Each reads and writes
       the same setting field the individual console uses. */
    for (const [id, b] of Object.entries(BRIDGE)) {
      const on = b.get(this.consoleState(b.setting) ?? {});
      out.push({ key: id, label: b.chip.label, value: on ? b.chip.on : b.chip.off,
        tone: b.chip.tone, on, toggle: true });
    }

    /* The numeric/derived values — read-only; the consoles manage these. */
    if (dt?.pools) {
      out.push({ label: "Hope", value: dt.pools.hope, tone: "ember" });
      out.push({ label: "Food", value: `${dt.pools.food}/12`, tone: "moss" });
      out.push({ label: "Security", value: `${dt.pools.security}/12`, tone: "slate" });
      out.push({ label: "Teahouse", value: `${dt.pools.restoration}/5`, tone: "rust" });
      const rp = Object.values(dt.research ?? {}).reduce((a, b) => a + b, 0);
      out.push({ label: "Research", value: `${rp}/10 RP`, tone: "plum" });
      out.push({ label: "Week", value: `${dt.week} of 12`, tone: "gold" });
    }
    if (ruins?.order) out.push({ label: "Statues", value: `${ruins.order.length} of 4`, tone: "plum" });
    return out;
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Campaign tracker reset to the start of Chapter 1.");
    this.touch();
  }

  /* ----- random encounters ----- */
  async rollFlat(key) {
    const e = ENCOUNTERS[key];
    if (!e) return;
    const r = await rollDie("1d20");
    if (!r) {
      this.postCard(e.title, "Flat check", `Roll a <b>@Check[type:flat|dc:${e.flat}]</b> — ${e.flatNote}.`, "moss");
      return;
    }
    const hit = r.total >= e.flat;
    this.postCard(e.title, hit ? "An encounter happens" : "All quiet",
      `Flat check DC ${e.flat} → rolled <b>${r.total}</b>.${hit ? " Roll the table below." : " No encounter today."}`, "moss");
  }
  async rollTable(key, dieKey) {
    const e = ENCOUNTERS[key];
    const d = e?.dice.find(x => x.key === dieKey);
    if (!d) return;
    const r = await rollDie(`1${d.die}`);
    if (!r) {
      this.postCard(e.title, "Encounter roll", `Roll <b>[[/r 1${d.die}]]</b>${d.label ? ` (${d.label})` : ""} and read the row against the table.`, "rust");
      return;
    }
    const row = e.rows.find(x => r.total >= x.lo && r.total <= x.hi);
    if (!row) return;
    this.postCard(e.title, row.name, `Rolled <b>${r.total}</b>${d.label ? ` · ${d.label}` : ""} — threat <b>${row.threat}</b>.`, "rust");
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
    /* An act tab carries its season's colour, which is the same colour that
       act's chapter cards and its checklist heads use — so the strip says
       where you are before you read it. The four views are plum, and told
       apart by their icon rather than by hue. */
    const tabs = [
      { key: "campaign", label: "Campaign", sub: "where the table is", tone: "plum", icon: "fa-compass" },
      { key: "act1", label: "Act 1", sub: ACTS[1].name, tone: ACTS[1].tone, icon: "fa-sun" },
      { key: "act2", label: "Act 2", sub: ACTS[2].name, tone: ACTS[2].tone, icon: "fa-leaf" },
      { key: "act3", label: "Act 3", sub: ACTS[3].name, tone: ACTS[3].tone, icon: "fa-snowflake" },
      { key: "act4", label: "Act 4", sub: ACTS[4].name, tone: ACTS[4].tone, icon: "fa-seedling" },
      { key: "threads", label: "Threads", sub: "what carries forward", tone: "plum", icon: "fa-diagram-project" },
      { key: "loot", label: "Treasure", sub: "the loot ledger", tone: "plum", icon: "fa-sack-xmark" },
      { key: "rework", label: "Two Weavers", sub: "rework continuity", tone: "plum", icon: "fa-spider" }
    ];
    const actTab = /^act[1-4]$/.test(s.tab) ? Number(s.tab.slice(3)) : null;
    return `${this.styles()}
      <div class="cst">
        ${this.header(ro)}
        <nav class="tabs">
          ${tabs.map(x => `<button type="button" class="tab ${s.tab === x.key ? "on" : ""}" style="--tt:var(--${x.tone})" data-act="tab" data-k="${x.key}">
            <b><i class="fa-solid ${x.icon}"></i> ${x.label}</b><small>${x.sub}</small></button>`).join("")}
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


  /* A journal link, or nothing at all when the adventure isn't in this world.
     Rendering a button that can only ever say "not found" would be worse than
     rendering none — but the reference panel explains the absence once. */
  journalBtn(target, title) {
    if (!target?.desc) return "";
    const entry = findEntry(target.desc);
    if (!entry) return "";
    const page = findPage(entry, target);
    /* An area code is worth showing on the button; a page name is not — the
       item label beside it already says what the page is. */
    const label = target.area ? ` ${target.area}` : "";
    const where = page ? `${entry.name} — ${page.name}` : entry.name;
    return `<button type="button" class="jbtn${label ? " coded" : ""}" data-act="journal"
      data-e="${esc(target.desc.id)}" data-p="${esc(target.pageId ?? "")}" data-a="${esc(target.area ?? "")}"
      title="${title}: ${esc(where)}"><i class="fa-solid fa-book-open"></i>${label}</button>`;
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

  /* The other consoles in this collection. Also reference only — they're
     separate macros in your own directory, not something this one can open. */
  ourList(list) {
    if (!list.length) return "";
    return `<div class="macros">
      ${list.map(m => `<div class="mrow ours"><i class="fa-solid fa-ghost"></i>
          <span class="mname">${m.name}<small>${m.what}</small></span></div>`).join("")}
    </div>`;
  }

  /* A running procedure — the loop you keep turning for a whole chapter. */
  procBlock(p) {
    return `
      <div class="proc">
        <div class="subhead"><i class="fa-solid fa-dice-d20"></i> ${p.title} <span>${p.sub}</span></div>
        ${p.lines.map(l => `<p class="text">${l}</p>`).join("")}
        ${p.what?.length ? `<ul class="bullets">${p.what.map(w => `<li>${w}</li>`).join("")}</ul>` : ""}
        ${p.note ? `<p class="note">${p.note}</p>` : ""}
        ${this.rollRow(p)}
        ${p.foundry ? `<p class="hint"><i class="fa-solid fa-bolt"></i> ${p.foundry}</p>` : ""}
      </div>`;
  }
  rollRow(p) {
    const e = ENCOUNTERS[p.roll];
    if (!e) return "";
    return `
      <div class="rollrow">
        <button type="button" class="rollbtn" data-act="rollflat" data-k="${p.roll}"
          title="Roll the gate: a flat check against DC ${e.flat}"><i class="fa-solid fa-dice"></i> Flat check DC ${e.flat}</button>
        ${e.dice.map(d => `<button type="button" class="rollbtn" data-act="rolltable" data-k="${p.roll}" data-die="${d.key}"
          title="Roll 1${d.die} and read the row"><i class="fa-solid fa-dice-d20"></i> 1${d.die} · ${d.label}</button>`).join("")}
        ${this.journalBtn(pageTarget(e.page), "Open the table's page")}
      </div>
      <div class="rolltable">
        ${e.rows.map(r => `<div class="rtrow"><span class="rtd">${r.lo === r.hi ? r.lo : `${r.lo}–${r.hi}`}</span>
          <span class="rtn">${r.name}</span><span class="rtt">${r.threat}</span></div>`).join("")}
      </div>`;
  }

  /* One button per sound rather than per row, because a row like
     "Dining Hall · Shrine · Baths" is three separate beds. The icon is the
     sound's own state, so a bed you started three scenes ago is visibly
     still running. */
  playBtn(ref, name) {
    const act = ACTS[this.t.current.act] ? this.t.current.act : 1;
    const { sound } = findSound(ref, act, name);
    const on = !!sound?.playing;
    const missing = !sound;
    return `<button type="button" class="playbtn ${on ? "on" : ""} ${missing ? "gone" : ""}"
      data-act="sound" data-pl="${esc(ref)}" data-s="${esc(name)}"
      title="${missing ? `Not found in this world: ${esc(name)}` : on ? `Stop ${esc(name)}` : `Play ${esc(name)}`}">
      <i class="fa-solid ${missing ? "fa-volume-xmark" : on ? "fa-stop" : "fa-play"}"></i>${esc(name)}</button>`;
  }

  audioList(list, tracks) {
    if (!list.length && !tracks.length) return "";
    const act = ACTS[this.t.current.act] ? this.t.current.act : 1;
    const havePlaylists = !!game.playlists?.size;
    list = list.filter(a => !a.acts || a.acts.includes(act));
    if (!list.length && !tracks.length) return "";
    const row = (icon, ref, names, sub, pip) => `<div class="mrow"><i class="fa-solid ${icon}"></i>
        <span class="mname">${havePlaylists
          ? `<span class="plays">${names.map(n => this.playBtn(ref, n)).join("")}</span>`
          : names.join(" · ")}<small>${sub}</small></span>${pip ?? ""}</div>`;
    return `<div class="macros">
      ${tracks.map(t => row("fa-music", "looped", [t], "Looped Soundtrack")).join("")}
      ${list.map(a => row("fa-volume-high", a.pl, a.sounds,
        `${playlistLabel(a.pl, act)}${a.note ? ` · ${a.note}` : ""}`,
        a.guess ? `<span class="pip">placed by guess</span>` : "")).join("")}
    </div>`;
  }

  /* ------------------------------------------------------------ campaign */
  campaignTab(ro) {
    const t = this.t, c = t.current, roll = t.rollup;
    const od = t.overdue;
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>Live from the chapter consoles</h3>
        <div class="rollup">
          ${roll.map(r => r.toggle ? `
            <button type="button" class="meter ${r.on ? "on" : ""}" style="--tone:var(--${r.tone})"
              data-act="console" data-k="${r.key}" ${ro ? "disabled" : ""}
              title="Shared with the ${r.label} toggle in its own chapter console">
              <span>${r.label}</span><b>${r.value}</b></button>` : `
            <div class="meter" style="--tone:var(--${r.tone})">
              <span>${r.label}</span><b>${r.value}</b></div>`).join("")}
        </div>
      </section>

      ${od.length ? `
      <section class="panel" style="--tone:var(--rust)">
        <h3>Required, due now, not carried <small>${od.length} thread${od.length === 1 ? "" : "s"}</small></h3>
        ${od.map(x => `<p class="alarmrow"><span class="chip">Ch ${x.from} → ${x.at}</span> ${x.label}${x.pays ? ` <em>${x.pays}</em>` : ""}</p>`).join("")}
        <p class="hint">Only items tagged <b>required</b> appear here. Anything else the party left undone is on the Threads tab as skipped.</p>
      </section>` : ""}

      ${(() => {
        const cues = t.cuesFor(c.n), loot = t.lootFor(c.n).filter(i => !t.claimed(c.n, i.key));
        const macros = t.macrosFor(c.n), ours = t.oursFor(c.n), procs = t.procsFor(c.n);
        const audio = t.audioFor(c.n), tracks = t.trackFor(c.n);
        if (!cues.length && !loot.length && !macros.length && !audio.length && !ours.length && !procs.length) return "";
        return `
        <section class="panel" style="--tone:var(--ember)">
          <h3>Before this session <small>Chapter ${c.n}</small></h3>
          <div class="cols">
            ${cues.length ? `<div class="sub cues">
              <div class="subhead"><i class="fa-solid fa-clapperboard"></i> Scenes and cues <span>${t.cuesFor(c.n).filter(q => t.cued(c.n, q.key)).length} of ${cues.length}</span></div>
              ${cues.map(q => `<label class="check ${t.cued(c.n, q.key) ? "on" : ""}">
                  <input type="checkbox" data-act="cue" data-n="${c.n}" data-k="${q.key}" ${t.cued(c.n, q.key) ? "checked" : ""} ${ro ? "disabled" : ""}>
                  <span class="lbl">${q.label}</span></label>`).join("")}
            </div>` : ""}
            ${ours.length ? `<div class="sub ours">
              <div class="subhead"><i class="fa-solid fa-ghost"></i> Consoles for this chapter <span>${ours.length}</span></div>
              ${this.ourList(ours)}
            </div>` : ""}
            ${macros.length ? `<div class="sub macros">
              <div class="subhead"><i class="fa-solid fa-bolt"></i> Module macros <span>${macros.length}</span></div>
              ${this.macroList(macros)}
            </div>` : ""}
            ${(audio.length || tracks.length) ? `<div class="sub audio">
              <div class="subhead"><i class="fa-solid fa-headphones"></i> Audio to have queued <span>${audio.length + tracks.length}</span></div>
              ${this.audioList(audio, tracks)}
            </div>` : ""}
            ${loot.length ? `<div class="sub loot">
              <div class="subhead"><i class="fa-solid fa-sack-xmark"></i> Treasure still on the table <span>${loot.length}</span></div>
              ${loot.map(it => `<div class="itemrow">
                  <label class="check">
                    <input type="checkbox" data-act="loot" data-n="${c.n}" data-k="${it.key}" ${ro ? "disabled" : ""}>
                    <span class="lbl">${it.label}${it.where ? `<em class="pays">${it.where}</em>` : ""}</span></label>
                  ${this.journalBtn(targetFor(c.n, it, { loot: true }), "Open")}
                </div>`).join("")}
            </div>` : ""}
          </div>
        </section>`;
      })()}

      ${t.procsFor(c.n).length ? `
      <section class="panel" style="--tone:var(--moss)">
        <h3>Running all chapter <small>Chapter ${c.n}</small></h3>
        ${t.procsFor(c.n).map(p => this.procBlock(p)).join("")}
      </section>` : ""}

      <div class="cols">
        <section class="panel" style="--tone:var(--plum)">
          <h3>The party <small>click a name for the sheet</small></h3>
          ${t.s.pcs.map(pc => {
            const fest = t.festivalFor(pc);
            const body = `
              <img src="${pc.img}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
              <div><b>${esc(pc.name)}</b>${ARCS[pc.name] ? `<small>${ARCS[pc.name]}</small>` : ""}
                ${fest ? `<small class="fest"><i class="fa-solid fa-medal"></i> ${fest.titles.join(" · ")}</small>
                  ${fest.keeps.length ? `<small class="keep">${fest.keeps.join(" · ")}</small>` : ""}` : ""}
              </div>`;
            return pc.actorId
              ? `<button type="button" class="pc" data-act="sheet" data-id="${pc.actorId}"
                   title="Open ${esc(pc.name)}'s character sheet">${body}</button>`
              : `<div class="pc">${body}</div>`;
          }).join("")}
          ${t.s.pcs.some(pc => t.festivalFor(pc)) ? `
          <p class="hint"><i class="fa-solid fa-medal"></i> Titles and keepsakes won at the First Long Night, read from that console. They cost the winter ledger nothing — but a PC who is <em>Iron-Gut</em> to the whole town is worth remembering in Act 4.</p>` : ""}
        </section>

        <section class="panel" style="--tone:var(--ember)">
          <h3>Always to hand <small>any chapter</small></h3>
          ${this.macroList(MODULE_MACROS.always)}
          ${this.audioList(AUDIO.always, [AUDIO.theme])}
        </section>

        ${(() => {
          const found = JOURNAL.reference.filter(r => findEntry(r));
          const here = findEntry(journalOf(c.n));
          if (!found.length && !here) return `
            <section class="panel">
              <h3>The adventure's journals</h3>
              <p class="hint">Not in this world. The tracker looks for the Season of Ghosts module's journal entries by their own ids, then by name, then through the compendiums — install or import the adventure and the chapter and area links appear on every card.</p>
            </section>`;
          return `
            <section class="panel" style="--tone:var(--slate)">
              <h3>The adventure's journals <small>the book itself</small></h3>
              ${here ? `<div class="jrow">${this.journalBtn({ desc: journalOf(c.n) }, "Open")}
                <span class="mname">${esc(here.name)}<small>Chapter ${c.n}, where the table is</small></span></div>` : ""}
              ${found.map(r => `<div class="jrow">
                ${this.journalBtn({ desc: r }, "Open")}
                <span class="mname">${esc(r.name)}<small>${r.what}</small></span></div>`).join("")}
              <p class="hint">Area links jump to the page itself — <b>D7</b> on a Chapter 3 item opens the Infested Grove, not the chapter's first page.</p>
            </section>`;
        })()}

        <section class="panel" style="--tone:var(--slate)">
          <h3>Milestone leveling <small>level = chapter − 1</small></h3>
          <div class="miles">
            ${MILESTONES.map(([lvl, what]) => `
              <div class="mile ${c.level >= lvl ? "got" : ""}"><b>${lvl}</b><span>${what}</span></div>`).join("")}
          </div>
        </section>
      </div>

      <section class="panel">
        <h3>All thirteen chapters <small>click a row for its act</small></h3>
        <p class="legend">
          <span><i class="fa-solid fa-spider"></i> a chapter the <b>Two Weavers</b> rework changes — see that tab</span>
          <span><b>Lv</b> the level the party should be at</span>
          <span><b>0/0</b> decisions logged, out of the chapter's checklist</span>
          <span><b>Not started · Running · Done</b> where the table is</span>
        </p>
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
          ${this.journalBtn({ desc: journalOf(c.n) }, "Open this chapter's journal")}
          ${c.rework ? `<span class="tag web">Two Weavers</span>` : ""}
          ${c.console ? `<span class="tag">${c.console} console</span>` : ""}
          <button type="button" class="statbtn ${st}" data-act="cycle" data-n="${c.n}" ${ro ? "disabled" : ""}
            title="Click to advance status">${STATUS[st].label}</button>
        </h3>
        <p class="text">${c.spine}</p>
        ${c.note ? `<p class="note">${c.note}</p>` : ""}

        <div class="sub decisions">
          <div class="subhead"><i class="fa-solid fa-list-check"></i> Decisions <span>${p.done} of ${p.total}</span></div>
          <div class="items">
          ${c.items.map(i => {
            const st = t.itemState(c.n, i);
            const on = st === "ok";
            const target = targetFor(c.n, i);
            const shared = bridgeFor(c.n, i.key);
            /* The link sits outside the <label>, or clicking it would also
               toggle the checkbox the label wraps. */
            return `
              <div class="itemrow">
                <label class="check ${on ? "on" : ""} ${st === "overdue" ? "overdue" : ""} ${st === "skipped" ? "skipped" : ""}">
                  <input type="checkbox" data-act="flag" data-n="${c.n}" data-k="${i.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}${shared ? ` title="Shared with the ${shared.chip.label} toggle in its chapter console"` : ""}>
                  <span class="lbl">${i.label}
                    ${i.hard ? `<span class="pip hard" title="A later chapter depends on this">required</span>` : ""}
                    ${i.danger ? `<span class="pip danger" title="Permanent or costly consequence">consequence</span>` : ""}
                    ${i.rework ? `<span class="pip web" title="Two Weavers rework">rework</span>` : ""}
                    ${st === "skipped" ? `<span class="pip" title="Nothing later requires it, and the chapter is behind you">skipped</span>` : ""}
                    ${i.pays ? `<em class="pays">→ ${i.pays}</em>` : ""}
                  </span>
                </label>
                ${this.journalBtn(target, "Open")}
              </div>
              ${i.note ? `<p class="itemnote">${i.note}</p>` : ""}`;
          }).join("")}
          </div>
        </div>

        ${(() => {
          const qs = t.questsFor(c.n);
          if (!qs.length) return "";
          const qdone = qs.filter(q => t.quested(c.n, q.key)).length;
          return `
        <div class="sub quests">
          <div class="subhead"><i class="fa-solid fa-compass"></i> Side quests <span>${qdone} of ${qs.length}</span></div>
          <div class="items">
          ${qs.map(q => {
            const on = t.quested(c.n, q.key);
            return `
              <div class="itemrow">
                <label class="check ${on ? "on" : ""}">
                  <input type="checkbox" data-act="quest" data-n="${c.n}" data-k="${q.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}>
                  <span class="lbl">${q.name}${q.note ? `<em class="pays">${q.note}</em>` : ""}</span>
                </label>
                ${q.page ? this.journalBtn(pageTarget(q.page), "Open") : ""}
              </div>`;
          }).join("")}
          </div>
        </div>`;
        })()}

        ${p.lootTotal ? `
        <div class="sub loot">
          <div class="subhead"><i class="fa-solid fa-sack-xmark"></i> Treasure <span>${p.loot} of ${p.lootTotal}</span></div>
          ${t.lootFor(c.n).map(it => {
            const on = t.claimed(c.n, it.key);
            return `<div class="itemrow">
                <label class="check ${on ? "on" : ""}">
                  <input type="checkbox" data-act="loot" data-n="${c.n}" data-k="${it.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}>
                  <span class="lbl">${it.label}${it.where ? `<em class="pays">${it.where}</em>` : ""}</span>
                </label>
                ${this.journalBtn(targetFor(c.n, it, { loot: true }), "Open")}
              </div>
              ${it.note ? `<p class="itemnote">${it.note}</p>` : ""}`;
          }).join("")}
        </div>` : ""}

        ${t.procsFor(c.n).length ? `
        <div class="sub proc">
          ${t.procsFor(c.n).map(p => this.procBlock(p)).join("")}
        </div>` : ""}

        ${t.oursFor(c.n).length ? `
        <div class="sub ours">
          <div class="subhead"><i class="fa-solid fa-ghost"></i> Consoles in this collection <span>${t.oursFor(c.n).length}</span></div>
          ${this.ourList(t.oursFor(c.n))}
        </div>` : ""}

        ${t.macrosFor(c.n).length ? `
        <div class="sub macros">
          <div class="subhead"><i class="fa-solid fa-bolt"></i> Module macros <span>${t.macrosFor(c.n).length}</span></div>
          ${this.macroList(t.macrosFor(c.n))}
        </div>` : ""}

        ${(t.audioFor(c.n).length || t.trackFor(c.n).length) ? `
        <div class="sub audio">
          <div class="subhead"><i class="fa-solid fa-headphones"></i> Audio <span>${t.audioFor(c.n).length + t.trackFor(c.n).length}</span></div>
          ${this.audioList(t.audioFor(c.n), t.trackFor(c.n))}
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
            <div class="itemrow">
              <label class="check ${r.claimed ? "on" : ""} ${r.here && !r.claimed ? "here" : ""}">
                <input type="checkbox" data-act="loot" data-n="${r.ch}" data-k="${r.key}" ${r.claimed ? "checked" : ""} ${ro ? "disabled" : ""}>
                <span class="lbl"><span class="chip">Ch ${r.ch}</span> ${r.label}
                  ${r.where ? `<em class="pays">${r.where}</em>` : ""}</span>
              </label>
              ${this.journalBtn(targetFor(r.ch, r, { loot: true }), "Open")}
            </div>
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
        <p class="text">Every item whose payoff lands in a later chapter, sorted by when it comes due. Only the ones tagged <b>required</b> go red — a later chapter genuinely cannot proceed without them. Everything else the party left undone is listed as skipped, because most of these are choices rather than obligations: the Abacus Sisters don't survive if the party kills them, and nothing downstream breaks.</p>
      </section>
      ${group("overdue", "Overdue", "rust", "Required, and the table has reached the chapter that wanted them. Either they happened and want ticking, or you need a workaround.")}
      ${group("skipped", "Skipped", "muted", "The chapter that offered these is behind you and the box is empty. Nothing later requires them — this is the shape the campaign actually took. Tick any that did happen.")}
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
            const past = !on && t.current.n >= r.ch;
            return `<label class="check ${on ? "on" : ""} ${past && !r.optional ? "overdue" : ""} ${past && r.optional ? "skipped" : ""}">
              <input type="checkbox" data-act="rework" data-k="${r.key}" ${on ? "checked" : ""} ${ro ? "disabled" : ""}>
              <span class="lbl"><span class="chip">Ch ${r.ch}</span> ${r.label}
                ${r.optional ? `<span class="pip">optional</span>` : ""}
                ${past && r.optional ? `<span class="pip" title="Its chapter has passed and nothing depends on it">skipped</span>` : ""}</span>
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
      else if (a === "sound") {
        const act = ACTS[t.current.act] ? t.current.act : 1;
        toggleSound(btn.dataset.pl, act, btn.dataset.s);
      }
      else if (a === "journal") {
        const id = btn.dataset.e;
        const desc = Object.values(JOURNAL.chapters).find(d => d.id === id)
          ?? JOURNAL.reference.find(d => d.id === id)
          ?? { id, name: id };
        openJournal(desc, { pageId: btn.dataset.p || undefined, area: btn.dataset.a || undefined });
      }
      else if (a === "sheet") {
        const actor = game.actors.get(btn.dataset.id);
        if (actor) actor.sheet?.render(true);
        else ui.notifications.warn("That character's actor is no longer in this world.");
      }
      else if (a === "rollflat") t.rollFlat(btn.dataset.k);
      else if (a === "rolltable") t.rollTable(btn.dataset.k, btn.dataset.die);
      else if (a === "postrecap") t.postRecap();
      else if (a === "reset") t.reset();
      else if (a === "console") t.toggleConsoleByKey(btn.dataset.k);
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "flag") t.toggleFlag(el.dataset.n, el.dataset.k);
      else if (el.dataset.act === "loot") t.toggleLoot(el.dataset.n, el.dataset.k);
      else if (el.dataset.act === "cue") t.toggleCue(el.dataset.n, el.dataset.k);
      else if (el.dataset.act === "quest") t.toggleQuest(el.dataset.n, el.dataset.k);
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
             --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold}; --teal:${p.teal};
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
      /* Two levels, and they must not compete: a panel is titled in large ink
         over a thick rule in its own tone, a block inside it is titled in a
         small filled bar. Outer reads first, inner sorts what's under it. */
      .cst h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.04em; text-transform:uppercase;
                display:flex; align-items:center; gap:.5rem; border-bottom:2px solid var(--tone, var(--line));
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
                  overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .cst .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .cst .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .cst .tab small { font-size:.58rem; color:var(--muted); font-weight:400; white-space:nowrap;
                        text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .cst .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .cst .tab.on b i, .cst .tab.on small { color:var(--paper); opacity:.85; }

      .cst .cols { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
      .cst .rollup { display:flex; gap:.5rem; flex-wrap:wrap; }
      .cst .meter { border-top:2px solid var(--tone); padding:.25rem .6rem .1rem 0; min-width:78px; }
      .cst .meter span { display:block; font-size:.58rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .cst .meter b { font-size:1rem; color:var(--tone); line-height:1.2; }
      .cst .rollup button.meter { appearance:none; background:none; color:inherit; text-align:left;
        cursor:pointer; font:inherit; border-left:0; border-right:0; border-bottom:0; }
      .cst .rollup button.meter:hover { background:var(--hover); border-radius:2px; }
      .cst .rollup button.meter.on { background:var(--stripe); }
      .cst .rollup button.meter:disabled { cursor:default; opacity:.6; }

      .cst .alarmrow { font-size:.79rem; line-height:1.45; margin:.25rem 0; }
      .cst .alarmrow em { color:var(--muted); font-size:.74rem; }

      .cst .pc { display:flex; gap:.5rem; align-items:center; margin-bottom:.4rem; width:100%;
                 text-align:left; justify-content:flex-start; padding:.2rem .25rem;
                 border-color:transparent; background:transparent; }
      .cst button.pc:hover:not(:disabled) { border-color:var(--line); background:var(--hover); }
      .cst .pc img { width:30px; height:30px; border-radius:3px; object-fit:cover; border:1px solid var(--line); flex:none; }
      .cst .pc b { font-size:.82rem; display:block; }
      .cst .pc small { font-size:.7rem; color:var(--muted); line-height:1.35; display:block; }
      .cst .pc .fest { color:var(--gold); }
      .cst .pc .fest i { font-size:.62rem; margin-right:.2rem; }
      .cst .pc .keep { font-style:italic; }

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
      .cst .itemrow { display:flex; align-items:flex-start; gap:.25rem; }
      .cst .itemrow .check { flex:1; }
      /* A sound, as a button. Filled while it's playing, struck through and
         muted when this world hasn't got it. */
      .cst .plays { display:flex; flex-wrap:wrap; gap:.2rem; margin-bottom:.1rem; }
      .cst .playbtn { font-size:.72rem; font-weight:600; padding:1px 7px 1px 5px; border-radius:3px;
                      border-color:var(--line); color:var(--ink); gap:.3rem; letter-spacing:0; }
      .cst .playbtn i { font-size:.6rem; color:var(--muted); }
      .cst .playbtn.on { background:var(--moss); border-color:var(--moss); color:var(--paper); }
      .cst .playbtn.on i { color:var(--paper); }
      .cst .playbtn.gone { color:var(--muted); border-style:dashed; text-decoration:line-through;
                           text-decoration-color:var(--line); }

      .cst .jbtn { font-size:.62rem; padding:1px 5px; border-radius:3px; color:var(--slate);
                   border-color:var(--line); flex:none; margin-top:.15rem; letter-spacing:.04em; }
      .cst .jbtn i { font-size:.66rem; }
      .cst .jbtn.coded { color:var(--slate); font-weight:700; }
      .cst h3 .jbtn { margin-top:0; }
      .cst .jrow { display:flex; gap:.45rem; align-items:baseline; font-size:.79rem; padding:.12rem 0; }
      .cst .check { display:flex; gap:.45rem; align-items:flex-start; font-size:.8rem; line-height:1.4;
                    padding:.15rem .25rem; border-radius:3px; }
      .cst .check.on .lbl { color:var(--muted); }
      .cst .check.overdue { background:rgba(149,56,31,.09); }
      .cst .check.overdue .lbl { color:var(--rust); }
      .cst .check.skipped .lbl { color:var(--muted); }
      .cst .check.skipped .lbl > em.pays { opacity:.7; }
      .cst .check.here { background:rgba(164,92,20,.10); }
      .cst .lbl { flex:1; }
      .cst .pays { color:var(--muted); font-size:.72rem; display:block; }

      /* Every block inside a card is the same shape — a tinted well with a
         coloured spine and a labelled head — so the eye can sort decisions
         from treasure from audio without reading any of it. Each block sets
         its own accent in --sub, which the head and spine both read. */
      .cst .sub { --sub:var(--line); background:var(--stripe); border:1px solid var(--sub);
                  border-radius:4px; overflow:hidden;
                  padding:.4rem .5rem .45rem; margin-top:.5rem; }
      /* Ink rather than the act's tone: the act tone is a different colour in
         each act, so it would collide with audio in winter and with the
         procedure block in spring. Ink also puts the chapter's own checklist
         above the reference blocks in the hierarchy, which is right. */
      .cst .sub.decisions { --sub:var(--ink); }
      .cst .sub.loot   { --sub:var(--gold); }
      .cst .sub.proc   { --sub:var(--moss); }
      .cst .sub.ours   { --sub:var(--plum); }
      .cst .sub.macros { --sub:var(--ember); }
      .cst .sub.audio  { --sub:var(--slate); }
      .cst .sub.cues   { --sub:var(--rust); }
      .cst .sub.quests { --sub:var(--teal); }

      /* The head is a filled bar in the block's accent, bled to the well's
         edges. On parchment a tinted label reads as decoration; a solid one
         reads as a heading, which is the whole point of it. */
      .cst .subhead { font-size:.66rem; text-transform:uppercase; letter-spacing:.1em;
                      font-weight:700; display:flex; align-items:center; gap:.4rem;
                      background:var(--sub, var(--muted)); color:var(--paper);
                      margin:-.4rem -.5rem .45rem; padding:.28rem .5rem; border-radius:2px 2px 0 0; }
      .cst .subhead i { color:var(--paper); opacity:.8; font-size:.72rem; }
      .cst .subhead span { margin-left:auto; font-weight:600; color:var(--paper); letter-spacing:.06em;
                           border-radius:8px; padding:0 7px; background:rgba(0,0,0,.22); }
      .cst .sub.loot .check.on .lbl { text-decoration:line-through; text-decoration-color:var(--line); }
      .cst .itemnote { font-size:.74rem; line-height:1.45; color:var(--muted); margin:.1rem 0 .35rem 1.55rem;
                       padding-left:.5rem; border-left:1px solid var(--line); }

      /* Side by side, things size to their contents and start level with each
         other rather than a short one stretching to match a tall neighbour. */
      .cst .cols > * { align-self:start; }
      .cst .cols > .sub { margin-top:0; }
      .cst .cols > .panel { margin-bottom:0; }

      .cst .macros { display:flex; flex-direction:column; gap:1px; }
      .cst .mrow { display:flex; gap:.45rem; align-items:baseline; font-size:.79rem; padding:.12rem 0; }
      .cst .mrow i { color:var(--muted); font-size:.7rem; width:.9rem; flex:none; }
      .cst .mname { font-weight:600; }
      .cst .mname small { display:block; font-weight:400; font-size:.68rem; color:var(--muted); }
      .cst .mitems { color:var(--muted); font-size:.72rem; flex:1; }
      .cst .mrow.group .mname { color:var(--ember); }
      .cst .mrow.ours i { color:var(--plum); }
      .cst .mrow.ours .mname { color:var(--plum); }

      /* A procedure is the same block, whether it's nested in a chapter card
         or standing alone in a panel on the campaign tab. */
      .cst .proc { --sub:var(--moss); }
      .cst .proc + .proc { border-top:1px dashed var(--line); margin-top:.5rem; padding-top:.45rem; }
      .cst .proc .subhead span { margin-left:.35rem; text-transform:none; letter-spacing:0; font-style:italic;
                                 font-weight:400; padding:0; background:none; opacity:.85; }
      .cst .bullets { margin:.2rem 0 .4rem; padding-left:1.1rem; font-size:.79rem; line-height:1.5; }
      .cst .bullets li { margin-bottom:.15rem; }
      .cst .rollrow { display:flex; flex-wrap:wrap; gap:.3rem; align-items:center; margin:.35rem 0; }
      .cst .rollbtn { font-size:.72rem; font-weight:600; padding:2px 8px; border-radius:3px;
                      border-color:var(--moss); color:var(--moss); gap:.3rem; }
      .cst .rollbtn i { font-size:.62rem; }
      .cst .rolltable { display:flex; flex-direction:column; margin:.3rem 0 .4rem; border:1px solid var(--line);
                         border-radius:3px; overflow:hidden; font-size:.76rem; }
      .cst .rtrow { display:grid; grid-template-columns:2.6rem 1fr 5.5rem; gap:.4rem; align-items:baseline;
                     padding:.16rem .4rem; border-top:1px solid var(--stripe); }
      .cst .rtrow:first-child { border-top:0; }
      .cst .rtrow:nth-child(odd) { background:var(--stripe); }
      .cst .rtd { color:var(--muted); font-size:.7rem; white-space:nowrap; }
      .cst .rtt { color:var(--muted); font-size:.68rem; text-align:right; white-space:nowrap; }

      .cst .legend { display:flex; flex-wrap:wrap; gap:.2rem 1rem; font-size:.7rem; color:var(--muted);
                     margin:0 0 .4rem; line-height:1.5; }
      .cst .legend b { color:var(--ink); }
      .cst .legend i { color:var(--plum); }

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
  /* Migrate any checklist ticks the tracker already held into the console
     settings those items now mirror, so pre-existing ticks aren't lost when the
     bridged items switch to reading the console's value. */
  if (game.user.isGM) {
    let changed = false;
    for (const id of Object.keys(BRIDGE)) {
      if (!state.flags?.[id]) continue;
      const b = BRIDGE[id];
      const ckey = CONSOLES[b.setting].split(".")[1];
      const st = game.settings.get("world", ckey) ?? {};
      if (!b.get(st)) { b.set(st, true); await game.settings.set("world", ckey, st); }
      delete state.flags[id];
      changed = true;
    }
    if (changed) await game.settings.set(CS_NS, CS_KEY, state);
  }

  const campaign = new Campaign(state);
  const app = new CSApp(campaign);

  if (!globalThis.__cstHook) {
    const consoleIds = new Set(Object.values(CONSOLES));
    globalThis.__cstHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (userId === game.user.id) return;
      if (setting.key === CS_ID) {
        const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
        if (fresh) { campaign.state = fresh; campaign.render(); }
      } else if (consoleIds.has(setting.key)) {
        campaign.render();
      }
    });
  }

  /* Playback state lives on the playlist, not in this console's state, so the
     play buttons only look right if something repaints them when a sound
     starts or stops — including when it was started from the sidebar. */
  if (!globalThis.__cstSoundHook) {
    globalThis.__cstSoundHook = Hooks.on("updatePlaylistSound", () => campaign.render());
    globalThis.__cstPlaylistHook = Hooks.on("updatePlaylist", () => campaign.render());
  }
  app.render(true);
})();
