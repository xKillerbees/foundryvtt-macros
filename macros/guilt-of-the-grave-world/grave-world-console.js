/* ============================================================================
   GUILT OF THE GRAVE WORLD — GM Console
   Starfinder Second Edition Adventure · 1st to 5th level · five chapters
   Foundry VTT v11 / v12 / v13 / v14  •  built for the sf2e system
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   Runs the whole adventure: the seven-phase approach through the Diaspora
   and the ship condition it leaves the party in for the Amaranth; both chases,
   replayed round by round from each PC's result; the trek across the
   Atraskien Shelf; Eterrina's and Nobrom's influence encounters; every
   Cooking Point on Sabotage Soufflé, and the sixteen graves; the anti-aircraft
   turrets that decide how the getaway shuttle leaves Front Lines Frayed; the
   corsairs' parley; and Barrow's alert level, which sets how many bonecrushers
   wait in the loading dock, how long Nobrom listens, and what follows the
   party home. An XP ledger of ticked awards traces every point.

   Everything else it points at belongs to the Guilt of the Grave World
   Foundry module: journal pages and portraits, the encounter scenes and the
   plain Paizo maps, the ambience, loops, and sound effects, the module's
   scene macros, its NPC, creature, starship, and loot actors, and the
   starship-damage effects. Every id was read out of the module's adventure
   pack, and an adventure import keeps them. Without the module imported the
   console still runs; those buttons go quiet and a banner says why.

   Statblocks are not reproduced. Creature buttons open the module's own actor
   by id, falling back to a name search in this world and every Actor pack.
   ============================================================================ */

const GGW_NS = "world";
const GGW_KEY = "sf2eGuiltGraveWorld";
const GGW_ID = `${GGW_NS}.${GGW_KEY}`;
const MAX_PCS = 6;
const LEVEL_AT = 1000;

const THEME = "eox";  // or "daylight"
const PALETTES = {
  /* Eox at dusk: bone dust, a burnt-out sky, necromantic green. */
  eox: {
    paper: "#0e0f0e", card: "#171917", ink: "#e3e6de", line: "#2e332e", muted: "#8d968c",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(140,230,110,.10)", field: "#0a0b0a",
    rust: "#e5584b", ember: "#f0a23c", moss: "#86dc6c", slate: "#5db4dc", plum: "#c27ce2", gold: "#e9cb6b"
  },
  daylight: {
    paper: "#f1f2ee", card: "#ffffff", ink: "#1a1c18", line: "#c8ccc2", muted: "#5d6559",
    stripe: "rgba(0,0,0,.04)", hover: "rgba(0,0,0,.06)", field: "#f8f9f5",
    rust: "#b2382a", ember: "#a8620f", moss: "#2f7a1d", slate: "#1f6d9e", plum: "#8a3a9a", gold: "#8a6a12"
  }
};

/* --------------------------------------------------- inline check helper */
const SKILL_WORDS = ["Acrobatics", "Arcana", "Athletics", "Computers", "Crafting", "Deception",
  "Diplomacy", "Intimidation", "Medicine", "Nature", "Occultism", "Performance", "Piloting",
  "Religion", "Society", "Stealth", "Survival", "Thievery", "Perception",
  "Fortitude", "Reflex", "Will"];
const SAVES = ["Fortitude", "Reflex", "Will"];
const checkSlug = (s) => s.trim().toLowerCase().replace(/\s+/g, "-");
function checkCode(skill, dc, basic) {
  return `@Check[type:${checkSlug(skill)}|dc:${dc}${basic ? "|basic:true" : ""}]`;
}
/* Turns "DC 14 Perception" into an inline check. Lore names may be two words
   ("Physical Science Lore"), and "basic Reflex" keeps its basic flag. */
const DC_RX = new RegExp(`DC (\\d+) (basic )?((?:[A-Z][a-z]+ ){0,2}Lore|${SKILL_WORDS.join("|")})`, "g");
function linkify(text) {
  return text.replace(DC_RX, (_m, dc, basic, skill) => checkCode(skill, dc, !!basic && SAVES.includes(skill)));
}
/* Inside the window @Check text isn't enriched, so DCs are highlighted
   instead; the chat buttons post the same lines through linkify(), where
   Foundry turns them into rollable checks. */
const hl = (text) => text.replace(DC_RX, (m) => `<span class="dc">${m}</span>`);

/* ------------------------------------------------------------------- XP
   The book prints each encounter's threat, not its XP. Low, moderate, and
   severe encounters award that threat's budget for four PCs. Trivial ones
   have no fixed budget, so those are worked out from the creatures' and
   hazards' levels against the level the book gives the encounter. */
const THREAT_XP = { Low: 60, Moderate: 80, Severe: 120, Extreme: 160 };
const XP_CREATURE = { "-4": 10, "-3": 15, "-2": 20, "-1": 30, "0": 40, "1": 60, "2": 80, "3": 120, "4": 160 };
const XP_SIMPLE = { "-4": 2, "-3": 3, "-2": 4, "-1": 6, "0": 8, "1": 12, "2": 16, "3": 24, "4": 32 };
const clampDiff = (lvl, pl) => String(Math.max(-4, Math.min(4, lvl - pl)));
const foeXp = (f, pl) => (f.kind === "simple" ? XP_SIMPLE : XP_CREATURE)[clampDiff(f.level, pl)] ?? 0;
const foesXp = (list, pl) => list.filter(f => f.kind !== "ship").reduce((n, f) => n + (f.n ?? 1) * foeXp(f, pl), 0);

/* ------------------------------------------------------------ the module
   Document ids from the Guilt of the Grave World module's adventure pack. An
   adventure import preserves them, so these resolve in any world that has
   imported it. */
const MODULE = { id: "sf2e-guilt-of-the-grave-world", title: "Guilt of the Grave World" };
const JOURNALS = {
  front: { id: "pzo2400601frontm", name: "Frontmatter" },
  ch1: { id: "pzo2400602echoes", name: "Ch 1: Echoes from the Grave" },
  ch2: { id: "pzo2400603worldo", name: "Ch 2: World of the Dead" },
  ch3: { id: "pzo2400604hallso", name: "Ch 3: Halls of the Living" },
  ch4: { id: "pzo2400605intoth", name: "Ch 4: Into the Drift" },
  ch5: { id: "pzo2400606robbin", name: "Ch 5: Robbing the Barrow" },
  eox: { id: "pzo2400607advent", name: "Adventures on Eox" },
  toolbox: { id: "pzo2400608advent", name: "Adventure Toolbox" },
  elebrian: { id: "pzo2400609elebri", name: "Elebrian" },
  corpsefolk: { id: "pzo2400610corpse", name: "Corpsefolk" },
  aliens: { id: "pzo2400611aliena", name: "Alien Archive" },
  npc: { id: "pzo2400612npcgal", name: "NPC Gallery" },
  guide: { id: "pzo2400613player", name: "Player's Guide" },
  art: { id: "pzo2400614artgal", name: "Art Gallery" }
};
/* Page ids are only unique inside their journal — the NPC Gallery and the
   Art Gallery both have a "12sanimusslayn00" — so a page is named with its
   journal: "ch1.02jobinterview00", "art.12emmozie0000000". */
const pageRef = (ref) => { const i = ref.indexOf("."); return { j: ref.slice(0, i), id: ref.slice(i + 1) }; };

/* The encounter scenes carry tokens, walls, lighting, and their ambience;
   `orig` is the plain Paizo map from the module's "PDF Maps" folder. */
const SCENES = {
  landing: { id: "ddAa8hkhfLPGbDcd", name: "Landing", note: "The title screen. The Landing Picker macro swaps its art." },
  station: { id: "H8X4fWtzq41B0enD", name: "A. Iovan Station Alpha", orig: "WSnqjdqg8qfQAxPf", note: "The space station inside the asteroid, A1 to A11." },
  marauders: { id: "FJsM8T7mIqKWSYbq", name: "Malicious Marauders", note: "The asteroid field, and the Amaranth." },
  pactport: { id: "r3m0ZIfo2eHsFdcI", name: "Pact Port", note: "The city map, for shopping and wandering." },
  shuttle: { id: "UkviH2KWZEWHfeEe", name: "First Class Disaster", orig: "fmphimrInA5PK8sC", note: "The planetary shuttle, boarded mid-flight." },
  serpent: { id: "PtFIUzqAlNiL1Lzm", name: "Snake in the Glass", note: "The glass serpent's fossil lair." },
  camping: { id: "DUN5xy00cDwE9lkZ", name: "Camping On Eox", note: "Any night spent outside on the Atraskien Shelf." },
  xoalats: { id: "zJ2lsr3TjYhJpfF8", name: "Spooked Xoalats", orig: "LFxuKMrWCkjzxytB", note: "Eterrina's ranch and its pens." },
  killsquad: { id: "gYrKcRYbLunH8CSq", name: "Kill Squad", orig: "ilVUykpbKM92ZHFk", note: "Lady Elyssiana's manor — Etched Memories, then the kill squad." },
  petsnacks: { id: "lvaKWd7isP1mV11B", name: "Pet Snacks", orig: "eCjQJz87mkRdrlUA", note: "Zo!'s office." },
  stadium: { id: "fFyhdTnPerPaNgMc", name: "B. Souffle Stadium", orig: "eCgoKIVOSJBKo3L2", note: "Sabotage Soufflé, B1 to B4. The grave macros dig on this map." },
  frontlines: { id: "2uruu1TobCYonPjR", name: "C. Front Lines Frayed", orig: "esE4mMBCX3md5vAy", note: "The trenches, C1 to C10." },
  fragment: { id: "2LmFAs5VSYgBX44i", name: "D. Planar Fragment", orig: "Y5ivjR8PJJEkYnrp", note: "The floating volcano, D1 to D3." },
  reciprocity: { id: "4fQ0jwzAh9BJq4GW", name: "Reciprocity", note: "The Amaranth's return, in the Drift." },
  capers: { id: "rnkixlFpkxUDLP75", name: "Cosmic Capers", note: "The corsairs' fighters." },
  draught: { id: "1FOcKGf70ucG7oDX", name: "Drifter's Draught", orig: "OGDKtkKUg6aM72Ji", note: "The tavern aboard the Defiance." },
  approach: { id: "rDWDTtx1v0p7h0Vb", name: "Approaching Barrow", note: "Silent Running." },
  turrets: { id: "ieSNim8gyixONaFM", name: "Turret Defense", note: "The necroturrets on Barrow's surface." },
  aux: { id: "huhOUcVnEisQNHuR", name: "E. Auxiliary Research Center", orig: "bgV6d83ucPv4SkcM", note: "E1 to E10. The alert, decontamination, shock grid, and force field macros all work this map." },
  deck: { id: "bCCpgI9PlQDQ2lA4", name: "F. Observation Deck", orig: "8prhpjVFjdHcimkB", note: "Sanimus Slayn, over the Iovan asteroid." },
  upper: { id: "DR5GA7lfexg7CwFp", name: "Nova Rush Upper Deck", note: "The party's ship — for the Drift events." },
  lower: { id: "BVeEq94IFopLoUJn", name: "Nova Rush Lower Deck", note: "The party's ship, below decks." }
};

/* The scene macros flip the module's own tiles, walls, lights, and sounds on
   the encounter maps; the journal tells the GM when to click each one. Most
   are toggles — click again to switch back. */
const MOD_MACROS = {
  projector: { id: "eQc83NSruCwgGKjN", name: "Toggle Projector", note: "A5's flickering holoprojector: its lights and hum." },
  shuttleAmb: { id: "MlMnLwg8fSALiidP", name: "Toggle Doomed Shuttle Ambience", note: "Swaps the shuttle's calm cabin bed for the Doomed Shuttle alarm." },
  forcefields: { id: "wPq3osEja3I2OMkd", name: "Toggle Emergency Force Fields", note: "The luxury cabin's emergency force fields — tile, walls, and lights." },
  digGrave: { id: "OyM9SN0BGKKmda6M", name: "Dig Grave", note: "Asks which of the sixteen graves is being searched, and digs it." },
  createCrater: { id: "LYVnBasloKBssEKp", name: "Create Crater", note: "The artillery shell hits: the crater opens and the trench wall falls." },
  resetCrater: { id: "F8AZY7YU9odAKAOb", name: "Reset Crater", note: "Puts the trench wall back." },
  mortars: { id: "2chjRLv3cI2eYsOe", name: "Disable Mortars", note: "Kills C4's muzzle flashes." },
  sandbagsS: { id: "Q5V8s9eFpz5fSiVY", name: "Toggle Sandbags South", note: "Knocks C5's southern sandbags aside, or stacks them again." },
  sandbagsW: { id: "bxEaLS7kVBGSiwc1", name: "Toggle Sandbags West", note: "Knocks C5's western sandbags aside, or stacks them again." },
  turretNW: { id: "4mb52YeU160coHgq", name: "Disable Anti-aircraft Turret (NW)", note: "C8's north-west turret." },
  turretNE: { id: "gGGaSt5KtOSPwEwA", name: "Disable Anti-aircraft Turret (NE)", note: "C8's north-east turret." },
  turretSW: { id: "Ls5yjOghrPMAnk65", name: "Disable Anti-aircraft Turret (SW)", note: "C8's south-west turret." },
  turretSE: { id: "8Y2rV7zTvE5BeJeL", name: "Disable Anti-aircraft Turret (SE)", note: "C8's south-east turret." },
  prelim: { id: "LdVAtoAoZTYAfDxA", name: "Preliminary Alert Door Lock", note: "Locks every door in the auxiliary research center." },
  decon: { id: "Q2pIDHw2j01PdVSu", name: "Toggle Decontamination", note: "E1's ultraviolet sweep and the sealed pressure door." },
  fieldE6: { id: "9hlzMVsIgmiHl1cj", name: "Deactivate Force Field", note: "Drops E6's containment field and lets the lifeleech ooze out." },
  shockGrid: { id: "lazBTVDVFVWQrEAm", name: "Toggle Shock Grid", note: "E7's shock grid across the doorway." },
  fieldE9: { id: "kN83zK5AhmbpgcnK", name: "Toggle Forcefield", note: "Kitthaine's cell shield." },
  depress: { id: "xNCCCbuEKNQLm7Du", name: "Depressurization", note: "A window blows on the observation deck: alarm, depressurized bed, and the room darkens." },
  landing: { id: "BYUCaWAGxGY76NKd", name: "Landing Picker", note: "Choose the art on the Landing scene." },
  ring: { id: "FalzOIaHYaT1j8ye", name: "Activate Dynamic Ring", note: "The module's token ring and turn marker. Reloads the world." },
  gradient: { id: "lgftdPI0jhVNepU2", name: "Toggle Token Gradient", note: "Switches the ring's animated colour gradient on every token." },
  rigGradient: { id: "efLoncochBWHbYYF", name: "Enable Rig Gradient", note: "Turns the gradient on for every ringed token." }
};
/* Each grave has its own macro, which reveals that grave's tile on the
   stadium map and plays the digging sound. They toggle, so digging a grave
   again fills it back in. */
const GRAVE_MACROS = ["gyOntEj0c1MTB7mf", "o8n0a6RkFYchkuvF", "nQvprGCV4yEHgyi6", "h7LFrTHPg8X8qiBt",
  "UXlQ0r4GJdhCIpfR", "wWBnh6XBRe2CXHD9", "XAmX9YLBXSk6uW9u", "xQ3S9soTMHbdTgGf", "UIKMu8bHCjDH50lk",
  "uQWuTTIQ1nBvZg25", "ZeCarpppLZ7FSejU", "oLL01iJKCtBqao3f", "COmD9irXCXGWtMZ0", "dv4XzPx6qodeAkDp",
  "4LsiKqLntH16hRM4", "St0lZmXabN5G56S0"];

/* Three playlists: "Ambience" holds the location beds, "Loops" the hazards'
   sound, "SFX" the one-shots. */
const PL_AMBIENCE = "Faqf1Y1hdWKxx6aH", PL_LOOPS = "9Lmi6mJKs43KDJFy", PL_SFX = "hEYaHAjGo4J9n32B";
const AUDIO = [
  { pl: PL_AMBIENCE, s: "3UGHotPdDenpJ0xx", name: "Absalom Station", kind: "bed" },
  { pl: PL_AMBIENCE, s: "QcoQFEyV2e3odMuJ", name: "Absalom Station Indoors", kind: "bed" },
  { pl: PL_AMBIENCE, s: "rUCcOxR6SimWAe6H", name: "Star Citadel Theodrane", kind: "bed" },
  { pl: PL_AMBIENCE, s: "VTeiXZGMgDq8Ta5Z", name: "Iovan Station Alpha", kind: "bed" },
  { pl: PL_AMBIENCE, s: "whyK351dclCzDPae", name: "Nova Rush", kind: "bed" },
  { pl: PL_AMBIENCE, s: "oKWWG8MxcAirKvnv", name: "Nova Rush Under Attack", kind: "bed" },
  { pl: PL_AMBIENCE, s: "ImSQlwndv0RcTybd", name: "Pact Port", kind: "bed" },
  { pl: PL_AMBIENCE, s: "Kb5xmTOxogGxpmbC", name: "Shuttle", kind: "bed" },
  { pl: PL_AMBIENCE, s: "znMGVRciBZSi242q", name: "Doomed Shuttle", kind: "bed" },
  { pl: PL_AMBIENCE, s: "9ylvbnYTNWKdmtDI", name: "Atraskein Shelf", kind: "bed" },
  { pl: PL_AMBIENCE, s: "bNpJPkdmQS05jMiX", name: "Eterrina's Barn", kind: "bed" },
  { pl: PL_AMBIENCE, s: "YZNRG3iGdWkzkIbS", name: "Ancient Manor", kind: "bed" },
  { pl: PL_AMBIENCE, s: "U3BdAWoQ79ZPyePy", name: "Halls of The Living", kind: "bed" },
  { pl: PL_AMBIENCE, s: "Tdnek0YqeajWGvKc", name: "Souffle Stadium", kind: "bed" },
  { pl: PL_AMBIENCE, s: "a0g0R1IvepTUBP1F", name: "Front Lines Frayed", kind: "bed" },
  { pl: PL_AMBIENCE, s: "Ovu1Tv4Ek4gZge93", name: "The Drift", kind: "bed" },
  { pl: PL_AMBIENCE, s: "bIyMAmdyK4GrlM1d", name: "Planar Fragment", kind: "bed" },
  { pl: PL_AMBIENCE, s: "e5uXeWFPBvUdTxWj", name: "The Defiance", kind: "bed" },
  { pl: PL_AMBIENCE, s: "73GOLulbL9bsj1z0", name: "Drifter's Draught", kind: "bed" },
  { pl: PL_AMBIENCE, s: "dXyORrwHC7ALI87s", name: "Bar Music", kind: "bed" },
  { pl: PL_AMBIENCE, s: "m6hHF5YdOkoOGfKL", name: "Barrow", kind: "bed" },
  { pl: PL_AMBIENCE, s: "PDmuoBq1a3rF8M6m", name: "Barrow Facility", kind: "bed" },
  { pl: PL_AMBIENCE, s: "1EA9IxEKf0jrQOfQ", name: "Depressurized", kind: "bed" },
  { pl: PL_LOOPS, s: "trSDeibA70BFTEDQ", name: "Ticking", kind: "loop" },
  { pl: PL_LOOPS, s: "C98RZIykEBDI8U0p", name: "Projector", kind: "loop" },
  { pl: PL_LOOPS, s: "14s3H91shFKpXFEw", name: "Zombie Horde", kind: "loop" },
  { pl: PL_LOOPS, s: "FKRWxLySACPUGukZ", name: "Meat Jungle", kind: "loop" },
  { pl: PL_LOOPS, s: "MpZ85aVa6ASz8Xhk", name: "Flaming Gauntlet", kind: "loop" },
  { pl: PL_LOOPS, s: "AfScCuh33AjBXYvV", name: "Souffle Surprise", kind: "loop" },
  { pl: PL_LOOPS, s: "kWEP3JWKDqCCP1UG", name: "Mortar Shelling", kind: "loop" },
  { pl: PL_LOOPS, s: "A5P0ockY0e6soolv", name: "Treadmill", kind: "loop" },
  { pl: PL_LOOPS, s: "EDmuX95psyohW3Xm", name: "Cascade Faults", kind: "loop" },
  { pl: PL_LOOPS, s: "i76TrHnhY0OFlXzW", name: "Console Beeps", kind: "loop" },
  { pl: PL_LOOPS, s: "jHyQNoMKfDLtHMJ6", name: "Lava Flow", kind: "loop" },
  { pl: PL_LOOPS, s: "MyjxU0bUHI2QrMgf", name: "Force Field", kind: "loop" },
  { pl: PL_LOOPS, s: "8VIHNRGy7zIwa2wk", name: "Shock Grid", kind: "loop" },
  { pl: PL_LOOPS, s: "ZTc3bFUhu6OboFp5", name: "Red Alert", kind: "loop" },
  { pl: PL_SFX, s: "6m8w6oiXRgjLdzNQ", name: "Crowd Cheer", kind: "sfx" },
  { pl: PL_SFX, s: "K3VHGKRIkERtusuz", name: "Crowd Boo", kind: "sfx" },
  { pl: PL_SFX, s: "8jIKklCAaEqVRZ5V", name: "Sabotage Spinner Wheel", kind: "sfx" },
  { pl: PL_SFX, s: "DPp2a61nNGdUTeZ2", name: "Grave Digging", kind: "sfx" },
  { pl: PL_SFX, s: "G2VTgrEUFpA8NYFP", name: "Artillery Impact", kind: "sfx" },
  { pl: PL_SFX, s: "6oL9gc6dICwxV178", name: "Explosion", kind: "sfx" },
  { pl: PL_SFX, s: "po7HlKwl9B9CN46h", name: "Burning Rockslide", kind: "sfx" },
  { pl: PL_SFX, s: "G46SH1sf94U8ALDs", name: "Rapid Depressurization", kind: "sfx" },
  { pl: PL_SFX, s: "Zs8WbPGd8RQy9lFB", name: "Toggle", kind: "sfx" }
];
const audioBy = (name) => AUDIO.find(a => a.name === name);

/* NPCs: the module's actor and, where it has one, the Art Gallery portrait
   that can be shown to the players. Jazzy's actor is spelled "Lalsavis";
   Ahmzovar is Zo!'s old face, a portrait with no actor of its own. */
const NPCS = {
  "Emmozie": { id: "IDGeKOfvDpKqlfCE", art: "art.12emmozie0000000" },
  "Belenze Shadraz": { id: "oiDL3iclLsre5vxA", art: "art.12belenzeshadr00" },
  "Rabech Shadraz": { id: "FM8XuEuWna84Gtn9", art: "art.12rebechshadra00" },
  "Helmut Navdeep": { id: "AvwlNsBJIM5iF0Vw", art: "art.12helmutnavdee00" },
  "Whatzon Whatz-Gurz": { id: "L2DbvIgxg73cbAyK", art: "art.12whatzonwhatz00" },
  "Captain Concierge": { id: "oj7zky2U4hrPBwUx", art: "art.12captainconci00" },
  "Sadrat Phain": { id: "GIrU4lpSkjnT5laP", art: "art.12sadratphain000" },
  "Noeli": { id: "AujfSQIXrn61yV4f", art: "art.12noeli000000000" },
  "Ghoul Flight Attendant": { id: "XaqT3jvJpIv5DcgU", art: "art.12ghoulflighta00" },
  "Eterrina Rikutan": { id: "Np35kKUMhQRpUUyY", art: "art.12eterrinariku00" },
  "Wazasha Kevir": { id: "1U5fCtiAOn06byBn", art: "art.12wazashakevir00" },
  "Zo!": { id: "zHINokAHlG0ld8hx" },
  "Ahmzovar": { art: "art.12ahmzovar000000" },
  "Jazzy Malsavis": { id: "nGgrEjAe25lGpbOn", art: "art.12jazzymalsavi00" },
  "Luwazi Elsebo": { id: "07MBTHOHV5rWuVbB", art: "art.12luwazielsebo00" },
  "Rex Steelscale": { id: "OCnpoFx69907sIvX", art: "art.12rexalliasrex00" },
  "Telmarci Jusinoa": { id: "53RC7z9jfk1sYN9p", art: "art.12telmarcijusi00" },
  "Opa Zari": { id: "325a68UgKDc95Trz", art: "art.12opazari0000000" },
  "Cloud Nine": { id: "DMszfffd49BVqRbO", art: "art.12cloudnine00000" },
  "Afaella": { id: "R01QPaoZMnXkA2XN", art: "art.12afaella0000000" },
  "Vanyra Voshin": { id: "ed1mUv81n7ukMXAg", art: "art.12vanyravoshin00" },
  "Nobrom Darameer": { id: "aYNaJEmBtFPLFPGO", art: "art.12nobromdarame00" },
  "Kitthaine Kitar": { id: "6ddIucviuReGtY3f", art: "art.12kitthainekit00" },
  "Sanimus Slayn": { id: "83L8mVQmvmvxjJEg", art: "art.12sanimusslayn00" }
};
/* Art Gallery pages that aren't people: things worth putting in front of the
   players at the moment the book describes them. */
const SHOWS = {
  drone: { page: "art.12cameradrone000", name: "Camera Drone" },
  manor: { page: "art.12ancientmanor00", name: "Ancient Manor" },
  amaranth: { page: "art.12corpsefleets00", name: "Corpse Fleet Ship" },
  defiance: { page: "art.12defiance000000", name: "Defiance" },
  barrow: { page: "art.12barrow00000000", name: "Barrow" },
  shredskin: { page: "art.12shredskin00000", name: "Shredskin" },
  ticket: { page: "art.12shuttleticke00", name: "Shuttle Ticket" },
  kit: { page: "art.12undeademerge00", name: "Undead Emergency Supply Kit" },
  bobblehead: { page: "art.12bonespeakerb00", name: "Bone Speaker Bobblehead" },
  chompers: { page: "art.12ivorychomper00", name: "Ivory Chompers" },
  mic: { page: "art.12replicazomic00", name: "Replica Zo! Microphone" },
  ammo: { page: "art.12iovanammunit00", name: "Iovan Ammunition" },
  hive: { page: "art.12mummywasphiv00", name: "Mummy Wasp Hive" }
};
/* The loot actors hold what each scene's treasure is. Two are both called
   "Computer Center", so they're keyed here by where they're found. */
const LOOT = {
  "Airlock Loot": "xaoyuMmdBLA4e7z0", "Crew Quarters": "iawmlQASHdPtmfZN", "First Aid Station": "1EXnVjHM4vVPvQIE",
  "Computer Center (A8)": "LEsA1fJn0uoNpiyo", "Arcane Laboratory": "nUN9OnKB7z7dzzkW",
  "Helmut's Reward (Per PC)": "jnj1WgBHygARi5Ze", "Sadrat's Gift": "41JA81MZAYvYrrID", "Shuttle Wreckage": "RwBpNXPvGkTRvQvk",
  "Eterrina's Gifts": "AQCC7wZUxke7Ie2h", "Zo!'s Cooking Gift": "HFYFT8KGsozdFFfp", "Zo!'s Cooking Reward": "dKwK9Ry10tLMrr44",
  "Bunker Loot": "0VTpxNo1xQT7D0c0", "Gift Basket": "V7OTo4rF9rlA0XZp", "Zo!'s Gifts": "8Ris5varCm72xdD8",
  "Hidden Corners Loot": "ZjAvOGnD9nsd97N6", "Thermatrod Loot": "Aa1SfLirwF1G5q0G", "Elemental Opals": "3I2Y2mrwZ8sgJzJT",
  "Face Off Loot": "r2DTbs2gKcZbDvYH", "Opa's Impressed Gift": "lAwbo3usOt9yuotA", "Loading Dock": "NAiAVlkorNwpNp1n",
  "Mortic Lab": "VBenLDKWIg7squpt", "Necrotech Lab": "cnorI1fgEhHF0y4h", "Gef Lab": "9FDl3p4JFpnX1iAh", "Lab": "t68PcbpMAT3E31jp",
  "Computer Center (E7)": "1jIqarh3w7ZF4NFl", "Observation Deck": "2v9Um00ORJOnZrsY"
};
/* The module's tracker actors carry a badge effect the players can see. The
   console keeps its own counts and never writes to them. */
const TRACKERS = { cooking: { id: "XIWu48qAPJ79l4ai", name: "Cooking Points Tracker" } };

/* World effect items the book applies: the ship's condition going into the
   Amaranth fight. The console toggles one on the selected tokens' actors. */
const EFFECTS = {
  primed: { id: "iM5UR4sRDY7su6I0", name: "Starship Primed", who: "the party's starship (0 failures in the Diaspora)" },
  minor: { id: "dOPPw7LQHK6AXMxp", name: "Minor Starship Damage", who: "the party's starship (3–4 failures)" },
  major: { id: "HEmOrj9GWLdbaHyU", name: "Major Starship Damage", who: "the party's starship (5–6 failures)" }
};

/* ------------------------------------------------------------------- tabs */
const TABS = [
  { key: "ch1", label: "Echoes", sub: "Ch 1 · the Diaspora", tone: "slate", icon: "fa-satellite-dish" },
  { key: "ch2", label: "World of the Dead", sub: "Ch 2 · Eox", tone: "rust", icon: "fa-skull-crossbones" },
  { key: "ch3", label: "Halls of the Living", sub: "Ch 3 · Zo! Media", tone: "plum", icon: "fa-clapperboard" },
  { key: "ch4", label: "Into the Drift", sub: "Ch 4 · the Drift", tone: "ember", icon: "fa-meteor" },
  { key: "ch5", label: "Robbing the Barrow", sub: "Ch 5 · Barrow", tone: "moss", icon: "fa-user-secret" },
  { key: "ledger", label: "Ledger", sub: "threads · XP", tone: "gold", icon: "fa-book-skull" },
  { key: "table", label: "At the Table", sub: "scenes · audio · books", tone: "muted", icon: "fa-music" }
];

/* ------------------------------------------------------------- encounters
   Each foe names the module actor for that encounter — the module has three
   separate Rigor Mortic actors, three Aeon Guard Troopers, and so on, one per
   fight — and its level, for trivial encounters' XP. `kind` is "creature",
   "simple" or "complex" for hazards, or "ship" for starship-scene actors. */
const FOES = {
  a2: [{ n: 3, name: "Scrap Rat", id: "6mmSGqKnuYuQja35", level: -1 }],
  a4: [{ n: 2, name: "Cybernetic Zombie", id: "9k3BqQ2LqgFj4epP", level: -1 }],
  a5: [{ n: 1, name: "Rejuvenating Projector", id: "hF0jCmWaPObRi1xr", level: 2, kind: "simple" },
       { n: 2, name: "Hardlight Scamp", id: "xZGHVjkq3XIUpZyR", level: 1 }],
  a6: [{ n: 3, name: "Spinning Treadmill", id: "RylYOuibzgBOOaij", level: 1, kind: "simple" }],
  a7: [{ n: 2, name: "Animated Fire Extinguisher", id: "SAyms2j0LLvtOKzW", level: 1 }],
  a8: [{ n: 3, name: "Botnib", id: "i7uEOrwSPrv23Uha", level: -1 }],
  a9: [{ n: 2, name: "Faltering Sapient Green Orb", id: "bjeic3fPPEFSWctL", level: 1 }],
  a10: [{ n: 1, name: "Scrap Warren", id: "csU2B2rmh2hEbNI3", level: 0, kind: "simple" },
        { n: 1, name: "Scrap Rat Visionary", id: "xJetk9t65TahvOuI", level: 2 },
        { n: 3, name: "Scrap Rat", id: "SRHur93vWfYI8miB", level: -1 }],
  marauders: [{ n: 1, name: "Nova Rush", id: "r4RsbJq2cZuVYXKP", kind: "ship" },
              { n: 1, name: "Amaranth", id: "mT7B4sF7FSjyW1z5", kind: "ship" }],
  shuttle3: [{ n: 3, name: "Rigor Mortic", id: "QeYsFNXcmC4bAD5T", level: 1 },
             { n: 1, name: "Doomed Shuttle", id: "LhMHOyICTxhT3fM2", level: 3, kind: "complex" }],
  shuttle4: [{ n: 4, name: "Rigor Mortic", id: "QeYsFNXcmC4bAD5T", level: 1 },
             { n: 1, name: "Doomed Shuttle", id: "LhMHOyICTxhT3fM2", level: 3, kind: "complex" }],
  serpent: [{ n: 1, name: "Juvenile Glass Serpent", id: "OZ0lSWZIplcVAwT2", level: 3 }],
  camping: [{ n: 4, name: "Zombie Shambler", id: "nGI9pOYLJWvA2gGK", level: -1 }],
  xoalats: [{ n: 4, name: "Xoalat", id: "C4p8owHVF11urS3y", level: 0 }],
  killsquad: [{ n: 4, name: "Corpse Fleet Expendable", id: "mT8CkuRq0h1OnDOa", level: 0 },
              { n: 1, name: "Corpse Fleet Junior Officer", id: "swoeC6Q7uqotFWeJ", level: 2 }],
  pets: [{ n: 2, name: "Reculobutapus", id: "vgIJJIGYx9v7OTCM", level: 3 }],
  meat: [{ n: 4, name: "Juvenile Tashtari", id: "Nf0gr2d9bF2iRTvs", level: 2 }],
  souffle: [{ n: 4, name: "Soufflé Surprise", id: "dTMBNzhYy3Yxy6iR", level: 3, kind: "complex" }],
  c1: [{ n: 2, name: "Scout Drone", id: "VkhaCf4pYoGDCN3g", level: 2 }],
  c3: [{ n: 2, name: "Aeon Guard Trooper", id: "ZCnWKf5yYB2tDDah", level: 3 }],
  c4: [{ n: 1, name: "Mortar Shells", id: "VaiIFAudwHpD9ora", level: 3, kind: "simple" }],
  c5: [{ n: 2, name: "Aeon Guard Trooper", id: "rWQXegoOEIttG3H8", level: 3 }],
  c6: [{ n: 4, name: "Veskarium Paratrooper", id: "jZcKOA5HMlY50bjd", level: 1 }],
  c7: [{ n: 2, name: "Aeon Guard Trooper", id: "i9056Z8ZeFIIkEQL", level: 3 }],
  c9: [{ n: 1, name: "Hardlight Havoc", id: "TNYmj7nU0LcKoXAc", level: 5 }],
  c10: [{ n: 1, name: "Plot Twist", id: "t5sJTLjw6NGH8EDF", level: 3, kind: "simple" }],
  mascots: [{ n: 2, name: "Hardlight Mascot", id: "J6eY8WyqwblIHgiT", level: 3 }],
  panels: [{ n: 1, name: "Exploding Panels", id: "CC2KPaqaBzSLcavB", level: 4, kind: "complex" }],
  excuba: [{ n: 2, name: "Excuba", id: "mcrrNcweMSofyUPs", level: 4 }],
  rockslide: [{ n: 1, name: "Burning Rockslide", id: "GzO85y6F0urwDIEW", level: 2, kind: "simple" }],
  thermatrods: [{ n: 2, name: "Thermatrod", id: "EnufMEWJhmPILD7d", level: 3 }],
  well: [{ n: 1, name: "Drifting Bonfire", id: "ooztz87LY6MPcR9G", level: 5 },
         { n: 2, name: "Cinder", id: "u7cQYIAqwAmmIJY1", level: 3 }],
  recip: [{ n: 1, name: "Upgraded Nova Rush", id: "F7jfaH0jJWctODGP", kind: "ship" },
          { n: 1, name: "Amaranth", id: "1DM7J1KFRZbTlneu", kind: "ship" }],
  onslaught: [{ n: 8, name: "Rigor Mortic", id: "cEeBihxpuMQhJbXs", level: 1 }],
  faceoff: [{ n: 1, name: "Vanyra Voshin", id: "ed1mUv81n7ukMXAg", level: 4 },
            { n: 1, name: "Faceless", id: "Bw3Xy6zuaJgUBdDK", level: 4 }],
  sortie: [{ n: 1, name: "Upgraded Nova Rush", id: "Akzb7Rym24YSIh5g", kind: "ship" },
           { n: 4, name: "Corsair Fighter", id: "SI39XQ95oa9vAA9Z", kind: "ship" }],
  corsairs: [{ n: 4, name: "Groggy Corsair", id: "uCxpg9br4Jnd5fKU", level: 2 }],
  silent: [{ n: 1, name: "Upgraded Nova Rush", id: "FCePP4nxdvIfE2eT", kind: "ship" },
           { n: 1, name: "Necrodrone Swarm", id: "26RCelettQRayYYo", kind: "ship" }],
  meteors: [{ n: 1, name: "Micrometeor Shower", id: "fmb6y8br4r4oVqSa", level: 3, kind: "simple" }],
  necroturrets: [{ n: 2, name: "Necroturret", id: "MnMII5mNoTHO8BKc", level: 3, kind: "complex" }],
  welcome: [{ n: 4, name: "Bonecrusher", id: "PLI3Ds4jWWnfhp2B", level: 1 }],
  juniors: [{ n: 4, name: "Corpse Fleet Junior Officer", id: "0UZ0oZCmvPUYCFQ8", level: 2 }],
  assassins: [{ n: 2, name: "Faceless", id: "aobxvvPcqZOHnMY8", level: 4 }],
  dock: [{ n: 4, name: "Bonecrusher", id: "WDDcx7ByRZH28D9A", level: 1 }],
  swarm: [{ n: 1, name: "Mummy Wasp Swarm", id: "h22mpZCRzhyfyqGL", level: 6 }],
  mortic: [{ n: 2, name: "Protection-Class Security Robot", id: "XAyVyVdKW8Hne56M", level: 4 },
           { n: 12, name: "Rigor Mortic", id: "9U2ltw7HM7GeX11w", level: 1 }],
  boneflayers: [{ n: 2, name: "Boneflayer", id: "UWqnB1030Ayg0LoJ", level: 5 }],
  gefs: [{ n: 4, name: "Phantom Gef", id: "L1DjXEFAd4iIQxx4", level: 3 }],
  ooze: [{ n: 1, name: "Lifeleech Ooze", id: "48J6unNYYCjqejjR", level: 5 },
         { n: 2, name: "Wight Scientist", id: "0haCZ0h8ItAJQXJ5", level: 3 }],
  grid: [{ n: 1, name: "Shock Grid", id: "Uc88iIjo1jKu2ZDw", level: 4, kind: "simple" }],
  prisoner: [{ n: 1, name: "Kitthaine Kitar", id: "6ddIucviuReGtY3f", level: 7 }],
  deck: [{ n: 1, name: "Sanimus Slayn", id: "83L8mVQmvmvxjJEg", level: 7 },
         { n: 3, name: "Phantom Gef", id: "sHWhGDqYFxVRhmvT", level: 3 },
         { n: 1, name: "Rapid Depressurization", id: "xblop4hLQWvq8422", level: 2, kind: "simple" }]
};

/* ---------------------------------------------------- Diaspora Drifting
   Seven phases. In each, every PC may attempt one check: a success earns 1
   Navigation Point, a critical success 2, a critical failure loses 1 (never
   below zero). More points than half the PCs aboard defeats the obstacle.
   Failed phases set the ship's condition for the Amaranth fight; three in a
   row and the ship stalls out. The seventh phase is a single knowledge check
   with no Navigation Points. */
const DRIFT = [
  { key: "seat", name: "Seat Check",
    text: "The ship's sensors detect the technomagical signal. The crew needs to secure loose items on board their ship, buckle up, and bolster each other for the task ahead.",
    overcome: "DC 13 Diplomacy to calm crewmates, DC 15 Deception to feign bravery, or DC 17 Acrobatics or DC 17 Perception to quickly secure items on the ship",
    fail: "Nerves fray and loose items rattle around, distracting the crew during the rest of their maneuvers." },
  { key: "astro", name: "Astrogation",
    text: "After locking in on their destination, the PCs must plot a safe path through the asteroid belt.",
    overcome: "DC 13 Nature or DC 13 Physical Science Lore to predict asteroid locations, DC 15 Computers to plot a course with the sensors, or DC 17 Piloting to fly the route by heart",
    fail: "The telemetry suggests a low probability of success without asteroid impacts upon the hull… punctuated by the sound of micrometeors punching through the vessel's surface." },
  { key: "rogue", name: "Rogue Asteroid",
    text: "As the starship glides closer to the target asteroid, a rogue rock hurtles closer, changing the viability of their previously plotted course.",
    overcome: "DC 13 Survival or DC 13 Diaspora Lore to adapt to a new safe course, DC 15 Piloting to avoid it with a stunt, or DC 17 Arcana, DC 17 Occultism, DC 17 Nature, or DC 17 Religion to summon a magical shield",
    fail: "The asteroid crashes into the hull with a deafening thud. Captain Concierge warns that the shields have taken catastrophic damage and will be unreliable unless rebalanced." },
  { key: "fancy", name: "Fancy Flying",
    text: "A cluster of massive space boulders block the path to the destination, requiring a series of tight turns, dives, and swerves to avoid.",
    overcome: "DC 13 Piloting to make the thrusters dance, DC 13 Engineering Lore or DC 15 Thievery to overclock the power regulators, or DC 17 Deception or DC 17 Diplomacy to encourage the crew",
    fail: "Loud scraping echoes through the ship as the hull drags across an asteroid. Mostly rubble — no vital systems are offline… yet." },
  { key: "debris", name: "Debris Cloud",
    text: "A haze of tiny rocks and other rubble surrounds the asteroid.",
    overcome: "A ranged attack roll against DC 13, or DC 13 Mining Lore, to clear a path",
    fail: "Rocks ricochet off the hull, scraping the paint and bruising the shields. It's a bumpy ride for everyone on board." },
  { key: "boring", name: "Just Boring",
    text: "Two semi-spherical asteroids seem to be fused together along a seam. The signal is strongest from one end of that seam, but there is no way in.",
    overcome: "A melee attack roll against DC 13, or DC 13 Mining Lore, to shoot a channel; DC 15 Nature to know where to break the rocks; or DC 17 Athletics to break through",
    fail: "The rocks break apart, but debris collides with the ship. All vital systems remain online.",
    after: "Once phase six is complete, the seam breaks away, opening a fissure large enough for the ship." }
];
const SHIP_STATE = (fails) => fails === 0 ? { key: "primed", label: "Primed", tone: "moss", text: "Warmed up and in perfect condition: +1 item bonus on all checks during the starship scene." }
  : fails <= 2 ? { key: null, label: "A few dings", tone: "slate", text: "A few dings but working fine. Run the scene with no adjustments." }
  : fails <= 4 ? { key: "minor", label: "Minor damage", tone: "ember", text: "Minor damage: −1 circumstance penalty on all checks during the starship scene." }
  : { key: "major", label: "Major damage", tone: "rust", text: "Major damage: −2 circumstance penalty on all checks during the starship scene." };

/* ------------------------------------------------------------- the chases
   Both run on the same rules. Each PC's degree earns Chase Points on the
   current obstacle (2 / 1 / 0 / −1, never below zero); extra points don't
   carry over. The PCs act first each round, then the pursuer, which doesn't
   advance on round one. Ending its turn at the party's obstacle hurts them.
   The rounds are replayed from the stored results, so un-ticking any result
   rewinds the whole chase exactly. */
const CHASES = {
  horde: {
    name: "No Rest for the Weary", pursuer: "The zombie horde", icon: "fa-skull", other: 21,
    first: "The horde is still approaching the crash site — it doesn't advance on the first round.",
    advance: "The horde advances one obstacle on a successful DC 5 flat check — its staggering gait and mindless nature.",
    move: ["Flat check passed — it advances", "Flat check failed — it stumbles"],
    bash: "The horde ends its turn at the party's obstacle: it bashes and bites, 1d4 piercing, but the PCs can keep trying to escape.",
    caught: "If the horde catches the PCs before the final obstacle, look over each player's sheet: the horde rips away one non-essential item in a flurry of hands and teeth, then the PCs escape while the zombies are tangled in their own limbs.",
    escaped: "They escape. The horde loses track of them and shambles off to the southwest, away from their eastern course.",
    obstacles: [
      { name: "Here They Come!", cp: 3, overcome: "DC 14 Stealth to dive behind the wreck, DC 16 Crafting to use debris like a shield, or DC 18 Deception to play dead or feign undeath",
        text: "Hundreds of zombies stagger toward the crash site, appearing from behind boulders and gnarled petrified trees, and converge into a hungry horde headed that way!" },
      { name: "Higher Ground", cp: 4, overcome: "DC 14 Acrobatics or DC 14 Athletics to muscle up the hill, DC 16 Nature or DC 16 Survival to find the best path up, or DC 18 Diplomacy to quietly encourage everyone to stick together",
        text: "The zombie horde pauses at the wreckage, giving the PCs long enough to climb up and over the nearest hill." },
      { name: "Necromantic Ruins", cp: 4, overcome: "DC 14 Arcana, DC 14 Occultism, or DC 14 Religion to deactivate the spike's energies (or surge them as a distraction), DC 16 Acrobatics or DC 16 Thievery to find a weak spot in the ruins, or DC 18 Perception to find a safe way around",
        text: "A jagged piece of necromantic material sticks out of the ground on the other side of the hill, clearly radioactive and extremely dangerous but also capable of attracting undead creatures." },
      { name: "Field Dash", cp: 4, overcome: "DC 14 Acrobatics or DC 14 Athletics to cross quickly, DC 16 Intimidation to urge everyone to hurry, or DC 18 Crafting or DC 18 Deception to lure the horde in a different direction",
        text: "A dusty open field is situated on the other side of the ruins. The going is easy, but the terrain is perilously exposed." },
      { name: "Hollow Bones", cp: 4, overcome: "DC 14 Nature or DC 14 Survival to shore up the rib cage with packed earth and rocks, Stealth to cover the trail (the book prints no DC), or DC 18 Religion to pray for the zombies to be turned away",
        text: "The glassy, fossilized bones of a titanic, long-dead creature look like the best hiding place beyond the open field." }
    ]
  },
  caldera: {
    name: "Explosive Caldera", pursuer: "The living caldera", icon: "fa-volcano", other: 24, strike: true,
    first: "The caldera stays put on the first round and erupts, spawning the hazards ahead.",
    advance: "The book runs this like the horde chase and gives the caldera no rule of its own; this console offers the horde's DC 5 flat check.",
    move: ["It advances", "It holds"],
    bash: "The caldera ends its turn at the party's obstacle: its burning aura deals 3d6 fire, no save, but they can keep running.",
    caught: "Make it clear the caldera is far beyond them. Their only hope is the ship.",
    escaped: "They board and lift off. The planar magnetite bonds to the hull at once — they're free of the Plane of Fire and back on course.",
    obstacles: [
      { name: "Pyroclastic Flow", cp: 2, overcome: "DC 17 Computers or DC 17 Crafting to overcharge armor environmental protections, DC 19 Perception to find a boulder large enough to block the flow, or a DC 21 Fortitude save to endure the heat and smoke",
        text: "A superheated cloud of ash, debris, and gas spreads from the eruption at supersonic speeds, allowing almost no time to prepare!" },
      { name: "Magmaquake", cp: 4, overcome: "A DC 17 Reflex save to keep balance, DC 19 Athletics to stand strong (DC 22 Athletics also gives one other character an automatic success), or DC 21 Performance to dance with the volcano's rhythm",
        text: "As the mountain comes down upon the heroes, the entire plane shakes with moments of intense magnitude, nearly sending them off their feet!" },
      { name: "Cinder Cones", cp: 2, overcome: "DC 17 Arcana, DC 17 Nature, DC 17 Occultism, or DC 17 Religion to redirect the planar energies, or a DC 19 Will save to resist the bright lights",
        text: "Magical micro-volcanoes emerge from the ground along the route back to the ship, spewing fire and ash in their path." },
      { name: "Lava Bombs", cp: 4, overcome: "DC 17 Perception or DC 17 Physical Science Lore to predict the trajectories, DC 19 Acrobatics or a DC 19 Reflex save to hit the dirt, or DC 21 Survival to use the terrain as a shield",
        text: "The living caldera hurls molten rocks at the path ahead. They explode upon impact, creating smoking craters." },
      { name: "Emergency Liftoff", cp: 4, overcome: "DC 17 Piloting for emergency takeoff, DC 19 Arcana or DC 19 Computers to signal Captain Concierge to auto-start the ship, or DC 21 Athletics to stow the magnetite fast",
        text: "The starship's in sight, but it's still sealed up tight. You need to get flying, and fast!" }
    ]
  }
};
const CHASE_DEG = { cs: 2, s: 1, f: 0, cf: -1, hit: 2 };

/* -------------------------------------------------- Over the Dead Hills
   Exploration mode, in hours. One success gets the group past an event in 4
   hours, each additional success saves an hour (minimum 1); if everyone
   fails they make it, but take 8. */
const TREK = [
  { key: "pit", name: "Radioactive Pit", activity: "Scout: each Scouting PC lets one PC reroll a failed check (fortune).",
    overcome: "DC 14 Life Science Lore to notice breakdowns in the soil, DC 16 Nature or DC 16 Survival to notice the striations, or DC 18 Perception",
    fail: "Each PC must succeed at a DC 17 Fortitude save or contract mild radiation sickness, 4-hour onset (GM Core 90)." },
  { key: "horde", name: "Return of the Zombie Horde", activity: "Avoid Notice: that PC can lead the others in Follow the Expert.",
    overcome: "DC 16 Deception or DC 16 Stealth to find a hiding place, or DC 18 Religion to lure or divert the zombies",
    fail: "The zombies linger in great numbers, keeping them on edge: frightened 2 during the next event." },
  { key: "homestead", name: "Deserted Homestead", activity: "Investigate: roll twice and take the better (fortune).",
    overcome: "DC 14 Eox Lore or DC 14 Perception to explore the homestead, DC 16 Crafting or DC 16 Society to interpret its artifacts, or DC 18 Perception to notice ancient road signs",
    fail: "Lost on unmarked roads from a bygone age, they backtrack: the PCs become fatigued.",
    loot: "Expired R2E rations — four people for a week. Eating them: DC 12 Fortitude or sickened 1 for 1 minute." },
  { key: "meteor", name: "Foreign Meteorite", activity: "Search: roll twice and take the better (fortune).",
    overcome: "DC 14 Physical Science Lore to notice degradation in the metal, DC 16 Computers to notice tech glitching in decay-wave patterns, or DC 18 Perception",
    fail: "Each PC must succeed at a DC 17 Fortitude save or contract mild radiation sickness, 4-hour onset (GM Core 90)." },
  { key: "escarp", name: "Broken Escarpment", activity: "Defend: shove one ally clear, granting them resistance 5 to this damage.",
    overcome: "A DC 16 Reflex save to jump back from the ledge, or DC 18 Acrobatics to slide down the slope",
    fail: "A PC who fails falls and takes 2d6+3 bludgeoning." }
];
const trekHours = (succ) => succ > 0 ? Math.max(1, 5 - succ) : 8;

/* ----------------------------------------------------- Sabotage Soufflé
   Cooking Points, stage by stage, kept as each PC's degree of success so any
   result can be changed and the total follows. `vals` maps a degree to the
   points the book gives for it. */
const COOK = {
  intro: { name: "Introductions", note: "A DC 16 check fitting what the player describes.", vals: { cs: 2, s: 1, f: 0, cf: -1 } },
  meat: { name: "B1 · Harvest", note: "DC 13 Survival, DC 16 Cooking Lore or DC 16 Life Science Lore, DC 18 Medicine or DC 18 Nature, or DC 20 Perception (or a DC 20 Dexterity check). Taming instead: DC 16, then DC 18 Cooking Lore or DC 18 Nature for a vegetarian option.",
    vals: { cs: 3, s: 2, f: 1, cf: -1 }, labels: { cs: "Prime 3", s: "Good 2", f: "Fair 1", cf: "Scraps −1" } },
  gauntlet: { name: "B4 · Reach the fridge", note: "DC 15 Acrobatics, or fly over. Failing it, the flames deal 2d6 fire (DC 15 basic Reflex).", vals: { cs: 2, s: 1, f: 0, cf: -1 } },
  r1: { name: "Round 1", course: 1 }, r2: { name: "Round 2", course: 1 }, r3: { name: "Round 3", course: 2 },
  r4: { name: "Round 4", course: 2 }, r5: { name: "Round 5", course: 3 }, r6: { name: "Round 6", course: 3 },
  tasting: { name: "Tasting · impress Luwazi", note: "DC 16 Cooking Lore or DC 16 Performance, DC 18 Deception or DC 18 Diplomacy, or DC 20 Intimidation — 2 lower for a PC with a Starfinder Society history. No consequence for failure.",
    vals: { cs: 2, s: 1, f: 0, cf: 0 } }
};
const COOK_ROUND = { vals: { cs: 2, s: 1, f: 0, cf: -1 },
  note: "DC 16 Cooking Lore (trained), DC 18 Survival (trained), DC 20 Thievery (trained), or DC 23 Perception (trained) to follow the skeletal cooks. Add each PC's flavor packets and earlier bonuses; a PC may Aid instead." };
const COOK_ROUNDS = ["r1", "r2", "r3", "r4", "r5", "r6"];
const SABOTAGES = [
  { key: "heat", name: "No heat sources", line: "The needle comes to rest on the icon of a flame with an X drawn through it. The audience groans. “No more heat sources — that's a tall order!”",
    rule: "All stoves and ovens shut off this round. A PC who can conjure fire keeps cooking at −1; a flamethrower grills at +1; a laser pistol lets a ranged attack serve as the cooking check. Without a heat source: −2 item penalty." },
  { key: "puzzle", name: "Puzzles!", line: "The wheel lands on an angular, six-pronged symbol surrounded by an oblong circle. “Puzzles! My favorite. Solve yours and get back to cooking for our celebrity guest!”",
    rule: "A hardlight wall of hieroglyph blocks bars each station. Two attempts on a PC's turn: DC 16 Eox Lore, DC 18 Arcana or DC 18 Society, or DC 20 Perception. A failure earns audience hints (+2 circumstance to the next try). Solved, the PC can still cook that turn." },
  { key: "souffle", name: "Soufflé Surprise", line: "The spinner stops on a fluffy pastry rising from a pan. The crowd cheers. “You're in for the chef's special — Soufflé Surprise!”",
    rule: "Every station's pastry oven opens and an undulating soufflé oozes out. Each PC must stabilize (or defeat) one before it's too late." }
];

/* --------------------------------------------------- influence encounters */
const INFLUENCE = {
  eterrina: { name: "Eterrina Rikutan", max: 8, start: "Indifferent",
    discovery: "DC 14 Eox Lore, DC 16 Perception, or DC 18 Society",
    skills: "DC 14 Farming Lore, DC 14 Labor Lore, or DC 14 Life Science Lore to show ranching know-how; DC 16 Intimidation to Coerce (she admires strength); DC 18 Diplomacy to Make an Impression or Request; DC 21 Performance to entertain her",
    thresholds: [
      [1, "She notices the camera drone on the horizon: “Oh, you're with them. Fine, I'll help, but then I want you gone.” Supplies, recharging, and directions — then the door slams. (As long as they never attacked her.)"],
      [4, "She lowers her rifle and seems willing to hear more, still guarded."],
      [6, "Directions to a domed building on the old coast, a full day's walk due east — but she won't let them stay."],
      [8, "She relents, apologizes, and invites them into the barn: a hidden generator to recharge their environmental protections, as long as they need, and her commercial seeker rifle with a tactical sniper's scope."]
    ],
    resist: "Lying to her (Deception) raises every Influence DC by 2.",
    weak: "The first PC who's honest about stumbling onto her ranch, or apologizes, generates 2 Influence Points. Speaking Eoxian or Necril: +1 status to Influence." },
  nobrom: { name: "Nobrom Darameer", max: 9, start: "Patient",
    discovery: "DC 18 Cooking Lore or DC 18 Corpse Fleet Lore, DC 20 Perception, DC 22 Nature or DC 22 Society",
    skills: "DC 18 Cooking Lore (especially cheese), DC 18 Ghost Lore, DC 18 Life Science Lore, or DC 18 Physical Science Lore; DC 20 Arcana, DC 20 Nature, DC 20 Occultism, or DC 20 Religion; DC 22 Medicine, DC 22 Performance, or DC 22 Survival to entertain him or play with the gefs; DC 25 Deception or DC 25 Diplomacy",
    thresholds: [
      [3, "He gushes about gefs, pleased they're thinking people and not “undead-slaying thugs” — and now isn't sure he should sic the gefs on them."],
      [5, "If they don't harm him, he won't command the gefs to attack. He offers his research packet from E7 and gives them the keypad code that switches off its shock grid."],
      [7, "Sanimus Slayn is visiting, the asteroid is in the research dome (F), and Sanimus keeps three trained phantom gefs that adore Akitonian arabuk cheese. Ten minutes in the lab and he makes four vials of ghost-salt cheese essence."],
      [9, "Sanimus treats everyone badly. From a hidden compartment: a ghost killer weapon upgrade, which he offers to attach."]
    ],
    resist: "Any threat to his eternal research — Intimidation, or a failed Deception check — raises every Influence DC by 2 for the rest of the encounter.",
    weak: "The first PC to offer help with his research generates 2 Influence Points. A serious offer to take him with them, to better labs, lowers every Influence DC by 1." }
};

/* ------------------------------------------------- counters and disables */
const TRACKS = {
  escape: { name: "Escape Points", need: 5 },
  scamps: { name: "Talking down the scamps", need: 2 },
  a9lock: { name: "A9 security lock", need: 2 },
  shuttle: { name: "Doomed Shuttle", need: 4 },
  shuttleRound: { name: "Necroblast countdown", need: 4 },
  xoalats: { name: "Calming the xoalats", need: (n) => Math.floor(n / 2) + 1 },
  eterrina: { name: "Influence with Eterrina", need: 8 },
  vesk: { name: "Talking down the paratroopers", need: (n) => Math.max(1, Math.floor(n / 2)) },
  panels: { name: "Exploding Panels — actions removed", need: 3 },
  spectra: { name: "Influencing the spectra", need: 2 },
  magnetite: { name: "Studying the magnetite", need: 2 },
  opa: { name: "Successes with Opa Zari", need: (n) => n },
  fighters: { name: "Corsair fighters knocked out", need: 4 },
  infil: { name: "Infiltration Points", need: 6 },
  alertPts: { name: "Necrodrone Alert Points", need: 8 },
  scanBarrow: { name: "Scanning Barrow", need: 2 },
  turretA: { name: "Necroturret 1 — actions removed", need: 2 },
  turretB: { name: "Necroturret 2 — actions removed", need: 2 },
  rooms: { name: "Rooms explored past E1", need: 9 },
  thawed: { name: "Rigor mortics thawed", need: 12 },
  nobrom: { name: "Influence with Nobrom", need: 9 },
  nobromRounds: { name: "Rounds of influence", need: 4 },
  e7door: { name: "E7 door", need: 2 },
  infoFails: { name: "Information network failures", need: 2 },
  secFails: { name: "Security network failures", need: 2 },
  tubes: { name: "Transport tubes blocked", need: 2 },
  tow: { name: "Binding the tethers", need: 2 }
};

/* ---------------------------------------------------------------- the XP
   Every award the book prints, plus each encounter's XP — by its threat, or
   for trivial ones from its foes' levels. Ticking one stores the amount
   granted, so un-ticking takes back exactly that even if the encounter's
   threat has changed since. `gate` returns a reason when it isn't earned. */
const AWARDS = [
  { key: "tutorial", ch: 1, label: "Finishing the starship tutorial, or impressing their benefactors", xp: 40 },
  { key: "discover", ch: 1, label: "Discovering the space station hidden inside the asteroid", xp: 40 },
  { key: "a1", ch: 1, label: "A1 · Investigating the space station", xp: 40 },
  { key: "f_a2", ch: 1, label: "A2 · Scrap rats in the airlock", threat: "Low" },
  { key: "a3", ch: 1, label: "A3 · Finding the map of Iovo", xp: 40 },
  { key: "f_a4", ch: 1, label: "A4 · Cybernetic zombies", threat: "Moderate" },
  { key: "f_a5", ch: 1, label: "A5 · Rejuvenating projector and hardlight scamps", threat: "Moderate" },
  { key: "a5", ch: 1, label: "A5 · Recovering ancient files, or investigating the media crowns", xp: 40 },
  { key: "f_a6", ch: 1, label: "A6 · Spinning treadmills", foes: "a6", pl: 1 },
  { key: "f_a7", ch: 1, label: "A7 · Animated fire extinguishers (one moderate fight, or two trivial ones)", xp: 80 },
  { key: "a8", ch: 1, label: "A8 · Searching the computer memory banks", xp: 40 },
  { key: "f_a8", ch: 1, label: "A8 · Botnibs — defeated, coerced, or negotiated with", threat: "Low" },
  { key: "a9", ch: 1, label: "A9 · Learning of the warning about the attack on Iovo", xp: 40 },
  { key: "f_a9", ch: 1, label: "A9 · Faltering sapient green orbs", threat: "Moderate" },
  { key: "f_a10", ch: 1, label: "A10 · Scrap warren, visionary, and scrap rats", threat: "Severe" },
  { key: "a11", ch: 1, label: "A11 · Discovering the command core", xp: 40 },
  { key: "marauders", ch: 1, label: "Malicious Marauders — the starship encounter", xp: 120 },
  { key: "scan", ch: 1, label: "…and scanning the Amaranth", xp: 20,
    gate: (t) => !t.s.flags.scanned ? "Only if they scanned the enemy ship" : null },

  { key: "pactport", ch: 2, label: "Exploring Pact Port", xp: 120 },
  { key: "noeli", ch: 2, label: "…and encountering Noeli", xp: 40 },
  { key: "f_shuttle", ch: 2, label: "First Class Disaster — the rigor mortics", threatFn: (t) => t.s.flags.lingered ? "Severe" : "Moderate" },
  { key: "crash", ch: 2, label: "Surviving the shuttle crash", xp: 120 },
  { key: "horde", ch: 2, label: "No Rest for the Weary — completing the chase", xp: 80 },
  { key: "f_serpent", ch: 2, label: "Snake in the Glass — juvenile glass serpent", threat: "Low" },
  { key: "trek", ch: 2, label: "Over the Dead Hills — completing the trek", xp: 80 },
  { key: "f_camp", ch: 2, label: "Camping on Eox — zombie shamblers", threat: "Low" },
  { key: "shelter", ch: 2, label: "Discovering the Zephyrous Shelter", xp: 60 },
  { key: "f_xoalats", ch: 2, label: "Spooked xoalats", threat: "Moderate" },
  { key: "eterrina", ch: 2, label: "Attempting to make an impression on Eterrina", xp: 60 },
  { key: "manor", ch: 2, label: "Etched Memories — discovering the manor's secrets", xp: 60 },
  { key: "f_kill", ch: 2, label: "Kill Squad — expendables and a junior officer", threat: "Severe" },
  { key: "datapad", ch: 2, label: "Hacking the junior officer's datapad", xp: 80 },

  { key: "f_pets", ch: 3, label: "Pet Snacks — Zo!'s reculobutapuses", threat: "Moderate" },
  { key: "desk", ch: 3, label: "Investigating Zo!'s desk", xp: 40 },
  { key: "f_meat", ch: 3, label: "B1 · Juvenile tashtaris", threat: "Severe" },
  { key: "f_gauntlet", ch: 3, label: "B4 · The flaming gauntlet", threat: "Moderate" },
  { key: "f_souffle", ch: 3, label: "Sabotage Spinner — the soufflé surprises", foes: "souffle", pl: 3 },
  { key: "cooking", ch: 3, label: "Filming Sabotage Soufflé", xp: 80 },
  { key: "cookbonus", ch: 3, label: "…with 7 or more Cooking Points", xp: 60,
    gate: (t) => t.cookPoints < 7 ? "Only with 7 or more Cooking Points" : null },
  { key: "hoards", ch: 3, label: "Real Hoards of Triaxus", xp: 60 },
  { key: "f_c1", ch: 3, label: "C1 · Scout drones", threat: "Low" },
  { key: "f_c3", ch: 3, label: "C3 · Aeon Guard troopers in the trenches", threat: "Moderate" },
  { key: "f_c4", ch: 3, label: "C4 · Mortar shells", foes: "c4", pl: 3 },
  { key: "f_c5", ch: 3, label: "C5 · Aeon Guard troopers in the dugout", threat: "Moderate" },
  { key: "f_c6", ch: 3, label: "C6 · Veskarium paratroopers — fought or talked down", threat: "Moderate" },
  { key: "f_c7", ch: 3, label: "C7 · The platoon's captain and chief engineer", threat: "Moderate" },
  { key: "f_c9", ch: 3, label: "C9 · Hardlight havoc", threat: "Moderate" },
  { key: "f_c10", ch: 3, label: "C10 · The plot twist bomb", foes: "c10", pl: 3 },
  { key: "rescue", ch: 3, label: "Rescuing Telmarci, or recovering their body", xp: 120 },

  { key: "f_e1", ch: 4, label: "Event 1 · Hardlight mascots — fought or pacified", threat: "Low" },
  { key: "f_e2", ch: 4, label: "Event 2 · Exploding panels", foes: "panels", pl: 4 },
  { key: "f_e3", ch: 4, label: "Event 3 · The excuba spectra, in a fight", threat: "Moderate",
    gate: (t) => t.s.picks.spectra !== "fought" ? "Only if they fought the spectra" : null },
  { key: "spectra", ch: 4, label: "Event 3 · A peaceful meeting with the spectra", xp: 80,
    gate: (t) => t.s.picks.spectra !== "peaceful" ? "Only if the meeting was peaceful" : null },
  { key: "f_d1", ch: 4, label: "D1 · Burning rockslide", foes: "rockslide", pl: 4 },
  { key: "f_d2", ch: 4, label: "D2 · Thermatrods", threat: "Low" },
  { key: "f_d3", ch: 4, label: "D3 · Drifting bonfire and cinders", threat: "Severe" },
  { key: "magnetite", ch: 4, label: "Harvesting the planar magnetite", xp: 120 },
  { key: "f_recip", ch: 4, label: "Reciprocity — the Amaranth's return", threat: "Moderate" },
  { key: "f_e4", ch: 4, label: "Event 4 · Final Onslaught — rigor mortics", threat: "Severe" },
  { key: "f_e5", ch: 4, label: "Event 5 · Face Off — Vanyra Voshin and the faceless", threat: "Moderate" },
  { key: "f_capers", ch: 4, label: "Cosmic Capers — the corsairs", threat: "Moderate" },
  { key: "f_draught", ch: 4, label: "Drifter's Draught — the groggy corsairs", threat: "Moderate" },

  { key: "f_silent", ch: 5, label: "Silent Running — approaching Barrow", threat: "Moderate" },
  { key: "f_fall", ch: 5, label: "Free Falling — micrometeor shower", foes: "meteors", pl: 4 },
  { key: "f_turrets", ch: 5, label: "Turret Defense — necroturrets", threat: "Low" },
  { key: "f_rf1", ch: 5, label: "Reinforcements · Event 1, Welcome Party", foes: "welcome", pl: 5 },
  { key: "f_rf2", ch: 5, label: "Reinforcements · Event 2, junior officers", threat: "Low" },
  { key: "f_rf3", ch: 5, label: "Reinforcements · Event 3, ghostly assassins", threat: "Low" },
  { key: "f_E1", ch: 5, label: "E1 · Bonecrushers in the loading dock", threatFn: (t) => ["Low", "Moderate", "Severe"][t.alert] },
  { key: "f_E2", ch: 5, label: "E2 · Mummy wasp swarm", threat: "Low" },
  { key: "f_E3", ch: 5, label: "E3 · Security robots (and any rigor mortics they thawed)", threatFn: (t) => (t.s.counters.thawed ?? 0) > 0 ? "Moderate" : "Low" },
  { key: "f_E4", ch: 5, label: "E4 · Boneflayers", threat: "Moderate" },
  { key: "f_E5", ch: 5, label: "E5 · Phantom gefs — fought, or Nobrom won over", threat: "Moderate" },
  { key: "f_E6", ch: 5, label: "E6 · Lifeleech ooze and wight scientists", threat: "Moderate" },
  { key: "f_E7", ch: 5, label: "E7 · The shock grid", threat: "Moderate" },
  { key: "hack", ch: 5, label: "E7 · Bypassing the shock grid and hacking the necroserver", xp: 120 },
  { key: "f_E9", ch: 5, label: "E9 · Kitthaine Kitar", threat: "Moderate",
    gate: (t) => t.s.picks.kitthaine !== "freed" ? "Only if they dropped the shield" : null },
  { key: "f_F", ch: 5, label: "F · Sanimus Slayn and his phantom gefs", threat: "Severe" }
];
const CHAPTER_NAMES = { 1: "Echoes from the Grave", 2: "World of the Dead", 3: "Halls of the Living", 4: "Into the Drift", 5: "Robbing the Barrow" };

/* ------------------------------------------------------------------- cards
   Every scene in the book, in order. `widget` names a bespoke panel; the
   generic ones are `chase`, `grid` (per-PC Cooking Point stages),
   `influence`, `counters`, `flags`, and `pick` (one choice of several). */
const CARDS = [
  /* ============================== CHAPTER 1 ============================== */
  { key: "breakfast", tab: "ch1", title: "Breakfast at Croizanarte", tone: "slate", sub: "Drifter's End, Absalom Station",
    boxed: "A teal skittermander with a swoop of crimson fur atop their head waves from a comfy booth. “Morning, friends! You better grab some grub before we meet the big-beard boss-people. That's right, your pal Emz finally came through! You've got a meeting with Ulrikka Clanholdings today! One of their mining probes found something weird in the Diaspora, and they want contractors to check it out. You look like you're ready to hit it big in the Diaspora, gree?”",
    text: ["Emmozie answers questions over pastries, sausages, and pancakes, and knows what's in GM Core and the adventure's introduction."],
    checks: ["Search the infosphere: DC 12 Diplomacy to Gather Information, or DC 12 Society to Recall Knowledge."] },

  { key: "interview", tab: "ch1", title: "Job Interview", tone: "slate", sub: "Bluerise Tower, the 99th floor",
    boxed: "“Recently, our probes in the Diaspora picked up a strange signal here.” Belenze points to a holoprojector that shows a three-dimensional model of the Diaspora. “We can't risk our mining teams walking into something dangerous, so we're looking for contractors to explore the asteroid, find the signal's source, and contain any hazardous creatures or materials.”",
    text: ["Each PC picks one of the four Ulrikka representatives and makes a single DC 13 check to influence them. One impressed representative — or two hours of interrogation about procedures and protocols — gets them the job."],
    checks: ["Recognize the Ulrikka insignia, clan daggers, and livery: DC 12 Diplomacy to Gather Information, DC 12 Computers, or DC 12 Society."],
    widget: "interview",
    qa: [["What's the pay?", "Base pay is 500 credits, plus first salvage rights."],
      ["Can you tell us anything about the signal?", "(Helmut) It's a line of technomagical code over and over. Eoxian gibberish and static is all we got."],
      ["What do we need to know about the Diaspora?", "(Rabech) It's an asteroid field… pirates, wandering Driftdead, or armed corporate goons. Your pilot better know what they're doing."],
      ["Will we get in trouble if we destroy anything?", "(Whatzon) You and your parent organization will be held harmless… Ulrikka Clanholdings shall be legally held harmless for any bodily harm."],
      ["What if we run into trouble we can't handle?", "We'll program Star Citadel Theodrane into your ship's computer — fly to the heart of the clans and we will protect you."]],
    xp: ["tutorial"] },

  { key: "stations", tab: "ch1", title: "To Your Battle Stations!", tone: "slate", sub: "the training program",
    text: ["Captain Concierge runs a simulation of each starship role before they leave Absalom Station. Every check is DC 15. Emmozie sees them off with a six-armed hug: “If you give your allsix, this'll be a really Drift mission, gree?”"],
    checks: ["Command Ship (captain): DC 15 Performance or DC 15 Intimidation.",
      "Overclock Systems (engineer): DC 15 Crafting.",
      "Open Fire (gunner): a ranged Strike with the missile launcher or machine gun against AC 15.",
      "Supercharge Shield (magic or science officer): DC 15 Arcana, DC 15 Occultism, DC 15 Nature, DC 15 Religion, or DC 15 Computers.",
      "Stunt Maneuvers (pilot): DC 15 Piloting."],
    xp: ["tutorial"] },

  { key: "drifting", tab: "ch1", title: "Diaspora Drifting", tone: "ember", sub: "seven phases to the asteroid",
    text: ["The flight takes 1d6+2 days (2 fewer with Drift engines). Each phase, every PC can attempt one check — the same one as someone else is fine, as is sitting it out. Unlisted skills with good reasoning: DC 17. Failing a phase is a setback, not a stop — but it counts against the ship when the Amaranth arrives."],
    widget: "drift", xp: ["discover"] },

  { key: "dock", tab: "ch1", eid: "A1", title: "Docking Port", tone: "slate", sub: "Iovan Station Alpha",
    boxed: "As the ship comes to a halt, a soft thumping sound echoes throughout the vessel as a universal docking port extends to meet the hull. The hiss of pressurization can be felt more than heard as the seal hardens, and the starship's door light indicator changes from red to green. When the portal opens, a barren ramp leads to an airlock door that is currently closed — an antique wheel-lock door that must be manually turned.",
    text: ["Steel throughout, 10-foot ceilings, normal light from a core the Newborn's birth recharged, stale but breathable air from the hydroponics bay, and low gravity. Doors open with a lever (one Interact). Magnetite in the asteroid kills sensors and infosphere links to the ship; comms work inside."],
    checks: ["DC 13 Nature or DC 13 Physical Science Lore: simple heat-treated steel, inefficient by modern standards.",
      "DC 15 Arcana, DC 15 Computers, or DC 15 Infosphere Lore: a looping technomagical broadcast from the far side — Eoxian, only “distress” and “shift” decipherable. No infosphere, only radio. Built centuries before the Gap."],
    xp: ["a1"] },

  { key: "a2", tab: "ch1", eid: "A2", title: "Airlock Ambush", level: "Low 1", tone: "rust",
    boxed: "A rudimentary airlock splays wide open. Its second door, which should be sealed shut, hangs ajar.",
    text: ["Three scrap rats, startled by the docking, take cover in the corridor (A3) and hurl grenades. They fight until overpowered — or until the PCs give them 3 days' worth of rations."],
    foes: "a2",
    treasure: "A partly buried cache of commercial frag grenades, each glitching 1. If they keep them to the end of Chapter 1, the dwarven crafters at Star Citadel Theodrane fix them free.",
    xp: ["f_a2"] },

  { key: "a3", tab: "ch1", eid: "A3", title: "Safety Corridor", tone: "slate",
    text: ["Angular and arched at once — a sense of vertigo. Papers stuck to the walls: laminated crew checklists, and faded letters and photographs from home. A laminated schematic shows the station's layout."],
    checks: ["Faded pages: DC 15 Society to Decipher Writing (+2 for anyone who speaks Eoxian). Laminated pages: DC 13 Arcana, DC 13 Computers, or DC 13 Occultism (same +2).",
      "A faded map of “home”: DC 13 Diaspora Lore, DC 13 History Lore, or DC 13 Society recognizes the lost planet Iovo!"],
    xp: ["a3"] },

  { key: "a4", tab: "ch1", eid: "A4", title: "Crew Quarters", level: "Moderate 1", tone: "rust",
    text: ["Two lovers fused with the tech of their quarters by the Death Wail rose as cybernetic zombies. They protect each other and fight until destroyed."],
    foes: "a4",
    checks: ["DC 15 Perception: an antique pulsecaster pistol on the bed nearest the door (glitching 1, 1 charge).",
      "Search: DC 13 Perception finds the pistol and two commercial dueling swords. Ornate tomes, faded blank: DC 10 Arcana, DC 10 Occultism, DC 10 Nature, or DC 10 Religion — magic users' spellbooks.",
      "DC 13 Society or DC 10 Eox Lore (untrained is fine): the crew were elebrians — but history records no elebrian stations outside Eox's orbit until well after the Gap, and Iovo was at war with Eox."],
    treasure: "The tomes are worth 40 credits to antique collectors; the rings 20.",
    xp: ["f_a4"] },

  { key: "a5", tab: "ch1", eid: "A5", title: "Auditorium", level: "Moderate 1", tone: "rust", sub: "the media center",
    text: ["The corrupted holoprojector activates when more than two PCs enter (or someone fails to disable it) and spawns two hardlight scamps babbling Eoxian about radiation and wave harmonics. Controlling the projector lets the PCs delete or reprogram them. They'll do anything to avoid deletion — two or more successful Deception or Diplomacy checks, or magic, talks them down; make it a lively scene with DC 12 checks."],
    foes: "a5", counters: [["scamps", "Talked down"]],
    checks: ["Putting on a crown unprepared: DC 14 Will or sickened 1 from centuries of someone else's memories.",
      "DC 13 Perception: laminated pictographs under each chair; DC 10 Arcana, DC 10 Nature, DC 10 Occultism, or DC 10 Religion shows the meditation that makes the crowns safe — telepathy between wearers, implant data (3rd rank) to the screen, and motivating ringtone once a day.",
      "DC 15 Arcana or DC 15 Computers at the podium: the crowns could link to the comm system for telepathic calls to Iovo.",
      "A few seconds of media: DC 13 Eox Lore, DC 13 Media Lore, DC 13 Music Lore, or DC 17 Society — elebrian recordings from centuries before the Gap, several mentioning Iovo."],
    xp: ["f_a5", "a5"] },

  { key: "a6", tab: "ch1", eid: "A6", title: "Gymnasium", level: "Trivial 1", tone: "rust",
    text: ["Three treadmills and three ellipticals with straps for low gravity. The treadmills' locks have degraded into hazards."],
    foes: "a6",
    treasure: "DC 10 Perception in the first aid booth: enough to build two commercial medkits and four commercial medpatches.",
    xp: ["f_a6"] },

  { key: "a7", tab: "ch1", eid: "A7", title: "Utility Corridor", level: "Trivial or Moderate 1", tone: "rust",
    text: ["The Newborn's psychic feedback animated the fire suppression systems at both ends of the hall. They're tethered in place, so savvy PCs can take them one at a time — two easier fights instead of one hard one.",
      "The three northern doors are labeled in Eoxian: computer center (A8) west, hydroponics (A10) centre, arcane laboratory (A9) east. Ladders lead up to observation domes crushed by the asteroid."],
    foes: "a7",
    checks: ["DC 13 Arcana, DC 13 Nature, DC 13 Occultism, or DC 13 Religion on the ceiling: magic guided the asteroids into place to avoid explosive decompression — deliberately, with great care."],
    xp: ["f_a7"] },

  { key: "a8", tab: "ch1", eid: "A8", title: "Computer Center", level: "Low 1", tone: "rust",
    text: ["Three botnibs born of the Newborn's birth attack anything living within 30 feet of their computers, climbing out of melee reach. The PCs can de-escalate with DC 15 Deception or DC 15 Diplomacy. When two fall, the last can be made to surrender with Intimidation against its Will DC — and then lends an Aid bonus to breaking the command core's lock."],
    foes: "a8",
    checks: ["DC 14 Arcana or DC 14 Computers: the last calculations were energy-wave travel times between Eox and Iovo, and how small an object must be to survive. A spared gremlin can be coerced to fetch it (DC 12 Intimidation) if they promise not to kill it.",
      "The command core's lock: DC 16 Arcana or DC 16 Computers to Hack the security system. A friendly gremlin gives +1 status."],
    widget: "overrides",
    treasure: "A hacking toolkit, a flashlight, and enough salvage to assemble an infiltrator's toolkit.",
    note: "Coercing or negotiating with the gremlins earns the XP as if they were defeated.",
    xp: ["a8", "f_a8"] },

  { key: "a9", tab: "ch1", eid: "A9", title: "Arcane Laboratory", level: "Moderate 1", tone: "rust",
    text: ["A room ripped from an ancient mansion, with three charred casters frozen mid-ritual on a circular rug. Two sapient orbs survived the Death Wail, but centuries and the Gap have eroded them. If the PCs aren't openly hostile, DC 17 Arcana, DC 17 Deception, DC 17 Diplomacy, or DC 17 Society against each orb calms it (+1 or +2 for creative roleplay). One calm and one not: the calm one doesn't roll initiative until round 2."],
    foes: "a9", flags: [["orb1", "First orb calmed"], ["orb2", "Second orb calmed"]],
    checks: ["The interface: DC 14 Arcana, DC 14 Computers, or DC 14 Occultism — the station received a secret warning from Eox about an attack on Iovo. Friendly orbs just tell them.",
      "The command core's lock: two DC 16 Arcana or DC 16 Computers checks. Calm orbs give +1 status; otherwise they hinder."],
    widget: "overrides",
    treasure: "A 1st-rank spell gem of cellular stimulant among the reagents.",
    xp: ["a9", "f_a9"] },

  { key: "a10", tab: "ch1", eid: "A10", title: "Hydroponics Bay", level: "Severe 1", tone: "rust",
    text: ["The station's living heart. Centuries of scrap rats evolved tools and engineers. The warrens are greater difficult terrain for PCs (normal for rats); DC 14 Acrobatics gets through without triggering them. The pools are 3 feet deep, difficult terrain. The rats trade for shiny things, fight tenaciously for their warren, and take cover; the visionary starts behind the northern warren by the A11 door."],
    foes: "a10", widget: "overrides",
    treasure: "Unused commercial frag grenades, glitching 1.",
    xp: ["f_a10"] },

  { key: "a11", tab: "ch1", eid: "A11", title: "Command Core", tone: "gold",
    text: ["The commander's body crumbles to ash as the door opens. She hoped to outlast the Death Wail in the smallest compartment and starved weeks later. The console controls everything; the encrypted files survive behind a biometric lock that needs <b>living elebrian genetic code</b>. The core is built into the superstructure — they can scan the latest file (garbled static) and must come back."],
    checks: ["Any clue missed in A8 or A9: DC 15 Arcana or DC 14 Computers here.",
      "Comm logs: the crew's last act was trying to save Iovo from an Eoxian planet-killer.",
      "DC 13 Society or DC 10 Eox Lore: living elebrians are all but extinct, except a small enclave in a subterranean settlement on Eox."],
    xp: ["a11"] },

  { key: "marauders", tab: "ch1", title: "Malicious Marauders", tone: "rust", sub: "starship scene · the Amaranth",
    boxed: "Suddenly a Corpse Fleet cruiser emerges from behind an asteroid and fires on the PCs' starship!",
    text: ["Captain Sanimus Slayn's Amaranth catches them leaving the asteroid. Victory: reduce it to 0 HP, or escape with 5 Escape Points. Optional objective: scan the enemy ship. Roles: engineer, two gunners, magic officer, pilot, science officer; Captain Concierge's Allsix gives +1 to one occupied role each round, or fills a role at +7.",
      "The fight is meant to be beyond them. If the ship is disabled, Captain Concierge's distress call brings Ulrikka outriders just before the killing blow, and the Amaranth retreats to the Drift, bound for Barrow."],
    foes: "marauders", widget: "marauders",
    checks: ["Avoid Asteroids (pilot): a Piloting check — success, the asteroid field's next routine misses them; critical failure, it hits them anyway.",
      "Patch Job (engineer): DC 15 Crafting or DC 18 Athletics — regain 2d8 HP (crit also ends persistent damage).",
      "Scan (magic or science officer): DC 15 Computers, or DC 16 Arcana, DC 16 Nature, DC 16 Occultism, or DC 16 Religion — 1 Escape Point, 2 on a crit.",
      "Tactical Withdrawal (pilot): DC 15 Piloting or DC 18 Perception — 1 Escape Point, 2 on a crit, lose 1 on a critical failure.",
      "Asteroid field routine: both ships take 1d6 bludgeoning, DC 15 basic Reflex."],
    xp: ["marauders", "scan"] },

  { key: "ch1end", tab: "ch1", title: "Concluding the Chapter", tone: "moss", sub: "Star Citadel Theodrane",
    text: ["Ulrikka patches the ship free of charge. Belenze fills in what they missed about elebrians. Whatzon drafts NDAs. Rabech and Helmut's mining data shows the Diaspora's asteroids came from one planet, not two — Iovo may have survived the Death Wail. (History Lore, Mining Lore, or Physical Science Lore can help the research.)",
      "<b>Level up to 2nd.</b> Each character gains +1 to their proficiency numbers, a skill feat, and a class feat."],
    treasure: "500 credits each as promised, and 40 cartridges each of Iovan ammunition that Helmut synthesizes from the station's rock." },

  /* ============================== CHAPTER 2 ============================== */
  { key: "pactport", tab: "ch2", title: "Unliving Hospitality", tone: "slate", sub: "Pact Port",
    text: ["Emmozie has a follow-up job: fly to Eox for living elebrian genetic material. The Ulrikka heavy cruiser Cinnabar Crusher escorts them out of the Diaspora — and the Amaranth shadows them at a distance.",
      "After customs, Sadrat Phain, the eternally overworked administrator, sees them while typing on several computers at once. He knows the Eox gazetteer; living elebrians live in the Halls of the Living, “farmed for media entertainment” by producers like Zo!. Departing elebrians get a free one-way ticket to a furnished luxury apartment on Absalom Station, paid for by Zo! Media.",
      "Sadrat offers first-class seats on tomorrow morning's shuttle to the Halls of the Living. Emmozie has booked them a day of shopping and a night in the penthouse at the Dead Hand Towers. This is downtime: let them shop, explore, and spend Chapter 1's credits."],
    checks: ["Corpse Fleet insignia on the asteroid footage: DC 14 Piracy Lore or DC 16 Piloting to Recall Knowledge.",
      "Eox's infospheres: DC 12 Eox Lore or DC 14 Infosphere Lore — Pact Port, its customs, and entertainment. The Halls of the Living: the same, +1 to the DC."],
    treasure: "A wrapped fruit basket for each PC: expensive herbal lotions and a customizable bone speaker bobblehead." },

  { key: "linger", tab: "ch2", title: "Hanging Around or Heading Out", tone: "plum",
    text: ["The adventure only moves on when they leave for the Halls of the Living; let them set the pace. If they linger a few days, they meet Noeli, a frivolous elebrian actor leaving New Atraskia to marry a fan. She won't go to “some dusty old asteroid”; forcing her makes her scream and flee into her shuttle. Friendly, she adds them on social sites — later, beach wedding photos on Varturan — but shares no genetic info.",
      "Every extra day gives the Corpse Fleet time to plan."],
    flags: [["lingered", "They lingered in Pact Port — the boarders bring a fourth rigor mortic", "Left on the morning shuttle", "rust"]],
    xp: ["pactport", "noeli"] },

  { key: "shuttle", tab: "ch2", title: "First Class Disaster", tone: "rust", sub: "the planetary shuttle",
    levelFn: (t) => t.s.flags.lingered ? "Severe 2" : "Moderate 2",
    text: ["Thirty minutes into the 90-minute flight the Amaranth appears in atmosphere — Sadrat's stenographer is a Corpse Fleet spy. It fires on the engines once, hurls boarders at the cockpit, and leaves before planetary defences lock on. The flight attendant is blown out of the aircraft.",
      "Two rigor mortics land in the luxury cabin; one destroys the pilot, plants a bomb, and joins in round 3. They start at −2 initiative (cocoon projectile). Seats are difficult terrain. Emergency force fields keep the cabin pressurized."],
    foesFn: (t) => t.s.flags.lingered ? "shuttle4" : "shuttle3", widget: "shuttle",
    checks: ["After the crash: DC 14 Life Science, DC 14 Physical Science, or DC 16 Crafting — the foam is WasteSafe, made from liquefied undead bone marrow and Akitonian food waste.",
      "DC 11 Eox Lore, or DC 14 Society or DC 14 Survival: the southern flats of the Atraskien Shelf, two days' walk from the escarpment down into Deminas Hollow. Commercial environmental protections work here, but there are radioactive hot spots."],
    treasure: "A reinforced yellow Emergency Supply Kit, for undead: synthetic blood, braced bones, flesh patches… and four doses of bone serum and four applications of commercial marrow paste.",
    xp: ["f_shuttle", "crash"] },

  { key: "horde", tab: "ch2", title: "No Rest for the Weary", tone: "ember", sub: "chase · the zombie horde",
    text: ["Ten minutes after the crash, a dust cloud from the north. DC 18 Perception spots it; DC 13 Eox Lore or DC 13 Religion identifies a zombie horde. Each success at these gives every PC +1 circumstance to their first chase check (+2 with two different successes)."],
    chase: "horde",
    note: "Afterwards, DC 16 Perception spots a glint to the east, hovering just off the ground — the first Zo! Media camera drone. A junior producer is filming them for a survival show called <i>Wasteland Wanderers</i>.",
    xp: ["horde"] },

  { key: "serpent", tab: "ch2", title: "Snake in the Glass", level: "Low 2", tone: "rust", sub: "the fossil was a lair",
    text: ["A juvenile glass serpent returns to the fossil they hid in, invisible and undetected. Roll a secret Perception check for each PC against its Stealth DC; anyone who fails is a target for its Ambush. It fights to the death. Any blank map will do."],
    foes: "serpent",
    checks: ["DC 16 Perception: the glint is closer, and following them. Shots at it miss as it drifts aside.",
      "DC 18 Mining Lore, DC 18 Perception, or DC 18 Physical Science Lore: a vein of iridium amber worth 200 credits."],
    xp: ["f_serpent"] },

  { key: "trek", tab: "ch2", title: "Over the Dead Hills", tone: "ember", sub: "exploration · the Atraskien Shelf",
    text: ["Lost, with environmental protections that won't last forever. Time runs in hours. Let each player pick an exploration activity — Avoid Notice, Defend, Detect Magic, Investigate, Scout, and Search all matter here. Comms don't reach past line of sight; magic still works.",
      "Keep track of the hours and where they rest (Camping on Eox). The book: once the PCs have completed two of three events, run Zephyrous Shelter."],
    widget: "trek", xp: ["trek"] },

  { key: "camping", tab: "ch2", title: "Camping on Eox", level: "Low 2", tone: "rust", sub: "every night outside",
    text: ["Living creatures draw feral undead out of shallow graves within hours. Unless they hide the camp with magic, DC 18 Survival, or other means, undead attack 2 hours after they settle. Guards or monitoring tech or magic give +2 to initiative.",
      "Four zombie shamblers, perhaps in waves 10 minutes to 2 hours apart. No more than two on any PC; they Grab and bite, and don't flank. The point is feeling heroic, not harrowing. The camera drone arrives during the fight, and a second by its climax."],
    foes: "camping",
    treasure: "If the horde took items, consider giving some back here, or a few commercial medpatches in a tattered backpack on a shambler.",
    xp: ["f_camp"] },

  { key: "shelter", tab: "ch2", title: "Zephyrous Shelter", tone: "slate", sub: "a geothermal station",
    text: ["A round powered building with a squat generator and a chimney of white smoke. Locked: DC 16 Athletics to Force Open, DC 16 Computers to Hack, or DC 16 Thievery to Pick a Lock. Inside: two double bunks, sleeping bags, a rune stove, a pantry, and a faded deck of cards. The next maintenance visit is a month away; sabotage brings nobody sooner."],
    checks: ["DC 14 Life Science Lore or DC 14 Physical Science Lore: a geothermal power station and atmospheric condenser, slowly rebuilding Eox's air.",
      "DC 16 Religion or DC 16 Society (automatic with Ranginori Lore): the symbol of Ranginori, the Zephyrous Prince, whose faith is restoring Eox's atmosphere.",
      "DC 16 Arcana or DC 16 Computers: the facility blocks comms and magical detection within 5 miles."],
    xp: ["shelter"] },

  { key: "xoalats", tab: "ch2", title: "Spooked Xoalats", level: "Moderate 2", tone: "rust", sub: "Eterrina's ranch",
    text: ["A hardpack road leads to a dilapidated but well-kept homestead. Four undead xoalats break out of their pens. Each PC can try once to calm them; if more than half succeed, the xoalats can be herded back. A critical failure, or any hostile act, and they panic: roll initiative with the skill each PC used. Players place themselves and the xoalats. They Ferocious Charge and Trample, and each flees at 5 HP or fewer.",
      "The commotion brings Eterrina Rikutan onto her porch with a customized pistol, demanding they get off her property."],
    foes: "xoalats", counters: [["xoalats", "Calmed"]],
    checks: ["Calm them: DC 14 Farming Lore or DC 14 Life Science Lore, DC 16 Nature or DC 16 Survival, or DC 18 Deception or DC 18 Diplomacy.",
      "DC 14 Survival to Track the road: a herd passed moments ago. Critical success: also +1 circumstance to calm the xoalats.",
      "DC 16 Eox Lore or DC 16 Life Science Lore: xoalats were ranched for leather and meat. At the pens, DC 14 Eox Lore, DC 14 Life Science Lore, or DC 14 Religion to Recall Knowledge (+1 if someone already recalled)."],
    xp: ["f_xoalats"] },

  { key: "eterrina", tab: "ch2", title: "Undead Reckoning", tone: "plum", sub: "influence · Eterrina Rikutan",
    text: ["A weathered corpsefolk cowpoke in a wide-brimmed hat with a wilted flower. Foul-tempered but fair. Roll initiative with Diplomacy and social skills; each round, a PC can Discover or Influence.",
      "DC 12 Computers (cached satellite maps) or DC 12 Survival (the stars): a full day's travel to the edge of the shelf and the long slope down into Deminas Hollow."],
    influence: "eterrina",
    checks: ["Following her directions: one DC 14 Piloting or DC 14 Survival check to Navigate or Sense Direction. On a failure they arrive exhausted: DC 16 Fortitude or fatigued for the next fight."],
    xp: ["eterrina"] },

  { key: "manor", tab: "ch2", title: "Etched Memories", tone: "slate", sub: "Lady Elyssiana's manor",
    text: ["Three drones now shadow them. A domed manor stands where the shelf drops into Deminas Hollow, wrapped in a shimmering field anchored by glowing hieroglyphs. Inside: dark, stale but safe air, moth-eaten pre-cataclysm furniture, and an arcane symposium.",
      "Walls etched in Eoxian and Necril tell of Lady Elyssiana Taliac's bunker, the sky that burned, a dozen survivors including her consort and guard captain <b>Sanimus Slayn</b>, the ritual of breathable air — and a promise of salvation by another ritual. Anyone who speaks either language, or carries a bone speaker bobblehead, reads it without a check."],
    checks: ["DC 16 Media Lore or DC 18 Perception when the drones come close: technomagical camera drones, transmitting at planetary range.",
      "DC 16 Arcana, DC 16 Nature, DC 16 Occultism, or DC 16 Religion: the field makes breathable air and keeps it in.",
      "DC 14 Arcana, DC 14 Eox Lore, or DC 14 History Lore to Recall Knowledge: a regional noble's manor, and its symposium.",
      "The etchings: DC 14 Arcana, DC 14 Eox Lore, DC 14 Occultism, or DC 14 Society.",
      "DC 16 Arcana, DC 16 Occultism, or DC 16 Perception: a final inscription — eleven names, and “The ritual is complete. I am alone. May their memories remain with me forever in this accursed form so their deaths were not in vain. Lady Elyssiana Taliac.”"],
    treasure: "Luxurious textiles and antique jewelry worth 500 credits to the right collector.",
    xp: ["manor"] },

  { key: "killsquad", tab: "ch2", title: "Kill Squad", level: "Severe 2", tone: "rust", sub: "the manor, at rest",
    text: ["A Corpse Fleet hit squad lands a few miles off. Expendables come in pairs from two directions at the least guarded spots; the officer backs them up from a third. Anyone on watch: enemies roll Stealth against their Perception. Sleeping PCs roll Perception for initiative and start prone and off-guard. If they don't rest here, the squad ambushes them outside. They fight until destroyed."],
    foes: "killsquad",
    checks: ["DC 14 Eox Lore or DC 14 Society: Corpse Fleet insignia. DC 14 Warfare Lore: the officer's rank.",
      "The officer's datapad: DC 15 Computers to Hack. Dossiers on each PC dated from the day they took the Ulrikka job, the Amaranth's footage of the asteroid fight under Captain Sanimus Slayn, orders that the “elebrian ruin” is classified and witnesses eliminated, and Slayn's frustration that they survived the shuttle.",
      "DC 16 Eox Lore or DC 16 Society: Barrow is a Corpse Fleet shipyard hidden somewhere in the Vast."],
    xp: ["f_kill", "datapad"] },

  { key: "camera", tab: "ch2", title: "Smile, You're on Camera!", tone: "plum", sub: "Zo! Media",
    boxed: "A soft whirring grows louder as three metallic objects zoom into the building one after the other. One of them projects a floating hologram: the figure of a sharply dressed ghoul executive. “Hello darlings. Don't worry, help is on the way — the rescue team should arrive at your location in approximately forty-five minutes. My name is Wazasha Kevir. I'm an executive producer for Zo! Media Productions. You caught the attention of one of our junior producers. He's been using your trials and tribulations as stock footage for the pilot of his upcoming show Wasteland Wanderers, but he forgot the best ingredient for media magic — consent!” She grins, displaying sharp teeth. “So I'm here to talk terms. How would you like to be superstars?”",
    text: ["Wazasha isn't pushy — she knows she's their best way out. She promises living elebrian costars. If they refuse, she tells them how to signal a drone and leaves."],
    flags: [["signed", "Agreed to meet Wazasha — the shuttle is coming", "Not yet"]],
    treasure: "A 500-credit signing bonus once they're back in civilization with her." },

  { key: "ch2end", tab: "ch2", title: "Concluding the Chapter", tone: "moss", sub: "into the Halls of the Living",
    text: ["A sleek black shuttle with a golden star and laughing skull lands 45 minutes later, its compartments full of fine food. A 30-minute flight, an elevator down a deep shaft, and a flock of production assistants. Each PC gets a prefab home in New Atraskia. Signing with Zo! Media covers room, board, restaurants, and medical care.",
      "<b>Level up to 3rd</b> before Chapter 3."],
    checks: ["DC 21 Perception (secret, GM rolls): fine print in every food dispenser — eating or drinking makes their footage Zo! Media's property."] },

  /* ============================== CHAPTER 3 ============================== */
  { key: "petsnacks", tab: "ch3", title: "Pet Snacks", level: "Moderate 3", tone: "rust", sub: "Zo!'s office",
    text: ["Breakfast with Wazasha, then up to an office with a golden star on the door. She seats them and forgets to mention the guard animals. Two reculobutapuses lie camouflaged in the shag rugs and attack anyone who touches things on or near the desk without permission. They Swallow Whole, then slam; at 10 HP or fewer they regurgitate and hide in the trash bin. If the PCs are losing, a production assistant calls them off.",
      "Zo!'s desk: recent celebrity photos — and in a drawer, older ones. Zo! alive in glowing blue robes; Zo! with an arm around an elebrian in midnight blue."],
    foes: "pets",
    checks: ["DC 20 Perception: a concealed camera in the middle photo frame.",
      "The elebrian in midnight blue: DC 16 Eox Lore, DC 16 Media Lore, or DC 16 Warfare Lore, or DC 18 Society — Undying Admiral Shathrava, founder of the Corpse Fleet."],
    note: "If they don't snoop, Zo! arrives in 5 minutes. Pets alive: they coo as he rubs his toes in their fur. Dead: a moment's dismay, then assistants remove the bodies.",
    xp: ["f_pets", "desk"] },

  { key: "frontroom", tab: "ch3", title: "Front Room Deals", tone: "plum", sub: "Zo!",
    boxed: "The door slams open. A musical fanfare plays from a hidden speaker as an outlandishly attired necrovite appears in the doorway. It's the sensational star of the system, Zo! He saunters into the room and pantomimes using a monocle to inspect his guests. “You. Are. Perfect!” Zo! declares.",
    text: ["All civilian travel is grounded after the strike on their shuttle. Zo! wants them to guest star; in exchange, he'll introduce them to elebrians and share his intel on the Corpse Fleet. They choose the filming order. Wazasha gifts each PC a commercial null space chamber, heals any pet wounds, and introduces their union rep, Jazzy Malsavis.",
      "Sabotage Soufflé films in about 18 hours. Restricted areas: DC 18 Stealth to Avoid Notice, DC 19 Thievery for the locks, and DC 20 Computers for the cameras — and Wazasha calls at once. Her stimulant replicates 8 hours' rest, one dose per 72 hours; stealing more takes DC 20 Stealth and DC 20 Thievery, and a second dose in 24 hours needs a DC 18 Fortitude save."],
    qa: [["Why do you want us to be guest stars?", "(Wazasha) You're competent adventurers, based on the wasteland footage. Better yet, you have chemistry as a group."],
      ["Will this be dangerous?", "Of course! The audience craves drama. Danger. Tension. That's what Zo! Media sells."],
      ["You have a union?", "Of course! Do you think I'm a monster?"],
      ["Can you tell us about that old photo?", "That was a long time ago. Before the Gap, before the sky burned. I used a different name then."],
      ["Tell us about your past.", "My name was Ahmzovar. Shathrava and I were once dear friends, but we quarreled over how to protect our world. Now, we're enemies."]] },

  { key: "souffle", tab: "ch3", eid: "B", title: "Sabotage Soufflé", tone: "plum", sub: "Soufflé Stadium",
    boxed: "Zo! bows dramatically to the crowd, then flashes his gleaming smile. “Welcome, fans of all tastes! Once again, we return to Soufflé Stadium for the ultimate competition of might, mettle, mayhem, and machismo… It's… Sabotage Soufflé! Tonight four spicy contestants stand ready to do battle for the taste buds of our celebrity guest judge! As always, the creator of the winning meal gets a cash prize, bragging rights, and a year's subscription to premium grocery delivery! Let's meet the players now!”",
    text: ["A priest of Lambatuin doubling as makeup artist makes all damage on set nonlethal. A knocked-out PC is revived with 4d8 HP and gets the worst ingredients. Ten-minute breaks between challenges. Leaving areas B1–B4 except by the ramps is difficult terrain.",
      "The running order: harvest protein in the Meat Jungle (B1), go gravedigging (B3), fetch the protein through the Flaming Gauntlet (B4), then cook on the Kitchen Stage (B2) through three sabotages."],
    widget: "cooktotal", grid: ["intro"] },

  { key: "meat", tab: "ch3", eid: "B1", title: "The Meat Jungle", level: "Severe 3", tone: "rust",
    boxed: "“Today you'll be cooking a three-course meal for our celebrity guest judge, whom you'll meet later. Now, it's time for the first round of ingredient gathering. Get ready for some Haywire Harvesting in the meat jungle! Release the tashtaris!”",
    text: ["Four juvenile tashtaris, prodded hyperaggressive, appear at random and fight to the death; a force field keeps them and any ammunition inside B1. Then skeletal assistants bring a knife and basket for each PC to harvest a carcass. A PC who sells a taming twist to Zo! (DC 20 Media Lore or DC 20 Performance) still counts as having protein for B4."],
    foes: "meat", grid: ["meat"],
    xp: ["f_meat"] },

  { key: "graves", tab: "ch3", eid: "B3", title: "Gravedigging Grounds", tone: "ember", sub: "sixteen graves, eight packets",
    boxed: "Zo! glides over the contestants taking up positions around the graveyard. “Now it's time for Gravedigging Get-em! This culinary cemetery has sixteen graves, but only eight of them contain the herbs and spices you need to season your meal. The other eight are full of special surprises! The bell tolls for you, chefs.”",
    text: ["Roll initiative with Perception. Searching a grave takes 2 actions. A packet is 1 Bulk and one hand, and gives +1 item bonus to one course of the PC's choice. Stealing from another station: DC 20 Stealth past the skeletons; from another PC, Disarm or Steal (trained). When all eight are found, the bell tolls again."],
    widget: "graves" },

  { key: "gauntlet", tab: "ch3", eid: "B4", title: "Flaming Gauntlet", level: "Moderate 3", tone: "rust",
    text: ["A ring of jets spewing 20-foot plumes of flame around a locked steel refrigerator. Reaching it takes DC 15 Acrobatics, or flying. Otherwise 2d6 fire (DC 15 basic Reflex); a critical failure adds 1d6 persistent fire.",
      "The fridge: DC 14 Crafting or DC 14 Thievery to unlock, DC 16 Athletics to Force Open, or smash it (AC 16, Hardness 10, HP 32, BT 16) — but each time someone damages it, a DC 5 flat check, and a failure costs a Cooking Point."],
    grid: ["gauntlet"], widget: "fridge",
    xp: ["f_gauntlet"] },

  { key: "cook", tab: "ch3", eid: "B2", title: "Let Them Cook!", tone: "plum", sub: "the Kitchen Stage",
    text: ["Each PC takes a station. Wazasha's recipe is on a teleprompter; she arranges accommodations for anyone with sensory differences. Roll initiative with Perception or Performance. Six rounds, two per course. Each round a PC cooks, Aids, or sits out; their flavor packets and earlier bonuses stack."],
    widget: "cookrounds" },

  { key: "spinner", tab: "ch3", title: "Sabotage Spinner", level: "Hazard 3", tone: "rust", sub: "Zo!'s wheel",
    text: ["Zo! spins the wheel on initiative count 10 every round, interrupting each course with bad news. The book gives three results, in this order."],
    widget: "spinner", foes: "souffle",
    checks: ["Soufflé: deflate it with DC 18 Cooking Lore, DC 18 Survival, or DC 18 Thievery (all trained), or beat it into submission with DC 23 Athletics."],
    xp: ["f_souffle"] },

  { key: "tasting", tab: "ch3", title: "Tasting and Judgment", tone: "gold", sub: "the guest judge",
    boxed: "“Everybody, please welcome former Starfinder First Seeker Luwazi Elsebo!” A woman dressed in a spangled pantsuit strides into the spotlight, clutching a matching purse with her metal arm. She smiles at the crowd as Zo! shoves his microphone into her face. “I'm just here for the food, Zo!” Luwazi says cheerfully. “Then dinner is served!” Zo! replies.",
    text: ["After six rounds, finished or not, Zo! orders a set change. Luwazi was stranded in Pact Port by the strike and traded a judging spot for free Starfinder Society recruitment ads. Afterward she checks in with any Starfinders, and offers anyone who impressed her work with the Society."],
    grid: ["tasting"], widget: "cookresult",
    xp: ["cooking", "cookbonus"] },

  { key: "hoards", tab: "ch3", title: "Real Hoards of Triaxus", tone: "slate", sub: "optional · stand-in crew",
    text: ["Rex Steelscale helps dragons downsize their hoards. The producers need a cleanup and consignment crew. Each hour for 4 hours, every PC attempts DC 15 Perception to find valuables and DC 12 Fortitude against the mold (sickened 1 for an hour on a failure). Then restore three or four items (DC 16 Arcana, DC 16 Crafting, or DC 16 Occultism; Society or any Lore to Recall Knowledge, with the player inventing details), and present them at an AbadarCorp infosphere auction."],
    treasure: "200 credits, and an anonymous bidder buys the party one permanent magic item of level 3 or lower, at your discretion.",
    xp: ["hoards"] },

  { key: "telmarci", tab: "ch3", title: "The Last Elebrian", tone: "plum", sub: "Telmarci Jusinoa",
    text: ["Only one elebrian will give genetic material to unlock “contaminated space junk”: Telmarci Jusinoa, a renowned dramatic performer in a career slump, who'd do anything to return to the limelight. They're on location filming <i>Front Lines Frayed</i>, a schlock war drama about the Azlanti Star Empire and the Veskarium, known for killing off its cast.",
      "Wazasha will pass the PCs off as extras but won't disrupt production. Telmarci's microchip shows where they are. Nobody knows the director, Kem Daith, recruited <b>real</b> Aeon Guard troopers who think they're invading Eox."],
    checks: ["DC 12 Diplomacy to Gather Information, or DC 17 Media Lore or DC 17 Society: the show's premise and its revolving cast. Critical success: stunt actors sign waivers allowing real combat — injuries, and two deaths on set."] },

  { key: "c1", tab: "ch3", eid: "C1", title: "Contested Land", level: "Low 3", tone: "rust", sub: "Front Lines Frayed",
    text: ["A black hovercraft through an obsidian tunnel to a rocky plain of trenches; the driver waits behind an outcrop a quarter mile out. Barbed wire, glass, laser fire like hard rain. Green, purple, and gold scout drones strafe anyone not in Azlanti colours until the PCs reach the trenches. Undefeated, they're waiting on the way back.",
      "Then an obsidian-gold-and-bone fighter screams in, strafes the trenches north of them, and boosts away with three more drones in pursuit."],
    foes: "c1",
    checks: ["DC 18 Perception in the hovercraft: a commercial medpatch for each PC in the seatbacks.",
      "DC 18 Computers: chatter — the Azlanti extras captured Veskarium scouts and won't release them for breaks or safety checks. Anyone who researched the show remembers a rumour: Kem Daith was trafficking real Azlanti troopers.",
      "DC 20 Computers to Hack a drone: its mission and route. Critical success: reprogram it to scout (Repair it with Crafting first if broken)."],
    xp: ["f_c1"] },

  { key: "c2", tab: "ch3", eid: "C2", title: "New Crater", tone: "ember",
    text: ["An artillery shell blasts a segment of trench wall as if on cue; camera drones swoop in for the shot. The PCs scramble down into the 16-foot crater without a check."] },

  { key: "c3", tab: "ch3", eid: "C3", title: "Trenches", level: "Moderate 3", tone: "rust",
    text: ["Six of twelve Sihedron Guards lured by Kem Daith still live, holding off “elite Veskarium units” until extraction for their political prisoner (Telmarci in prosthetics). Trenches are 20 feet deep; damaged sections DC 10 Athletics to Climb, intact walls DC 20. Two troopers patrol east and don't automatically notice intruders if at least half the PCs Avoid Notice. They die for their leader.",
      "Defeated, the PCs have time to loot and rest 10 minutes before the C5 troopers come to investigate. Linger to fight those here and C5 stands empty."],
    foes: "c3",
    xp: ["f_c3"] },

  { key: "c4", tab: "ch3", eid: "C4", title: "Mortar Tubes", level: "Trivial 3", tone: "rust",
    text: ["Four automated mortar tubes, modified to shell only the areas the troopers don't hold. No danger inside the trenches; they fire on anyone outside until disabled. Either way it's a safe, reinforceable place to rest. After 8 hours, troopers or paratroopers come to reload unless the other troopers are all down."],
    foes: "c4", flags: [["mortars", "Mortars disabled", "Mortars live"]],
    xp: ["f_c4"] },

  { key: "c5", tab: "ch3", eid: "C5", title: "Dugout", level: "Moderate 3", tone: "rust",
    text: ["A set dressed as a command post, knocked down and walled with debris. Ten-foot sandbag piles block sight, movement, and fire; DC 10 Athletics knocks a square down to 5 feet, then DC 10 Athletics to Climb or DC 10 Acrobatics to Leap, or Take Cover. Two troopers would clear the way for the right code word over helmet comms. They fight fearlessly.",
      "They can rest 10 minutes here before the C6 paratroopers assault the position."],
    foes: "c5",
    xp: ["f_c5"] },

  { key: "c6", tab: "ch3", eid: "C6", title: "Crossing Paths", level: "Moderate 3", tone: "rust",
    text: ["Four vesk actors playing paratroopers, survivors of eight who signed on hoping to become heartthrobs. The Azlanti didn't follow the script — four died to their own flamethrowers. Traumatized and suspicious, arguing whether to attack. If at least half the PCs (rounded down) succeed, they let them pass and stay back to “watch your six”. Otherwise they scream a war cry and attack."],
    foes: "c6", counters: [["vesk", "Successes"]],
    checks: ["Talk them down: DC 16 Diplomacy or DC 16 Warfare Lore, or DC 18 Deception or DC 18 Intimidation."],
    note: "Talked down, they hand over gear from their fallen friends, and the XP is as if defeated. Beaten, only one set of gear is left — the Aeon Guards burned the rest.",
    xp: ["f_c6"] },

  { key: "c7", tab: "ch3", eid: "C7", title: "Comms Bunker", level: "Moderate 3", tone: "rust",
    text: ["Sealed: DC 20 Athletics to Force Open, or DC 18 Computers for the lock. Inside, the platoon's captain and chief engineer are turning a prop bunker into a real distress beacon. They Take Cover by the dish and each Strike once before initiative.",
      "Telmarci cowers behind the dish, unhurt but for a grazed arm, telling a dramatic tale of days (hours) as a prisoner. They won't fight; they Hide, flee, or Take Cover, and enemies don't target them. Perception +6; AC 15; 30 HP; Fort +4, Ref +6, Will +3."],
    foes: "c7", flags: [["telmarci", "Telmarci is coming with them"], ["bullied", "Bullied into it — frightened 2 until the Halls", null, "rust"]],
    checks: ["Coax Telmarci out: DC 18 Diplomacy or DC 18 Intimidation (bullying leaves them frightened 2)."],
    treasure: "The troopers' gear, an advanced force field armor upgrade, a tactical mobility enhancer armor upgrade, and a tactical striking solarian crystal.",
    xp: ["f_c7"] },

  { key: "c8", tab: "ch3", eid: "C8", title: "Perimeter Defense", tone: "ember", sub: "four anti-aircraft turrets",
    text: ["An abandoned staging area and an unguarded ramp northeast. DC 13 Perception: all four turrets are set to fire on any ship that takes off. Each one: DC 18 Computers to Hack it off, DC 16 Thievery to jam its chamber, or DC 20 Crafting to defuse its ammunition."],
    widget: "aaturrets" },

  { key: "c9", tab: "ch3", eid: "C9", title: "Searchlight Hill", level: "Moderate 3", tone: "rust",
    text: ["A corrugated ramp to a grassy hill swept by blue searchlights; a shuttle on a pad to the west. The northern light is a hardlight projector (Hardness 12, HP 46, BT 23). Undisabled, a hardlight havoc spawns on a searchlight when the first PC reaches the tarmac. It can't go more than 120 feet from the projector, so fleeing in the shuttle works; it fires after them until they're out of range."],
    foes: "c9", flags: [["projector", "Projector reprogrammed or shut down"]],
    checks: ["DC 16 Computers, DC 16 Crafting, or DC 16 Technology Lore: a hardlight projector. DC 20 Computers reprograms it or shuts it down."],
    xp: ["f_c9"] },

  { key: "c10", tab: "ch3", eid: "C10", title: "Landing Zone", level: "Trivial 3", tone: "rust", sub: "the getaway shuttle",
    text: ["An armored shuttle painted with a sihedron: two seats in the cockpit, six in the hold. A faint ticking in the cockpit — Kem Daith's bomb, rigged to blow if the engines start without authorization."],
    foes: "c10", widget: "takeoff",
    xp: ["f_c10"] },

  { key: "rescue", tab: "ch3", title: "Halls of the Living", tone: "moss", sub: "back from the front",
    text: ["Urgent care for Telmarci and the PCs. If Telmarci died, their contract has a staff necromancer bring them back — a blurry memory, and a 15% chance they return as a borai. Any PC who died gets the same deal, free.",
      "Telling Wazasha (or Jazzy, who files a grievance) launches an investigation of Kem Daith; filming is postponed. Wazasha stays neutral — she was cutting ties after the finale anyway."],
    treasure: "Their fan club sends 200 credits of exclusive Telmarci merchandise. Next day, an unsigned basket from Wazasha: soaps, snacks, two advanced hypopens, and a coupon for one advanced hidden soldier armor (a replica of the show's Veskarium armor by default).",
    xp: ["rescue"] },

  { key: "unlock", tab: "ch3", title: "Unlocking the Data", tone: "gold", sub: "the biometric lock",
    text: ["Telmarci insists the extraction be filmed: purple satin robes, a peridot headdress, an hour in makeup, then a vial of blood and an eye scan.",
      "The files: elebrian exiles settled pre-Gap Iovo. Someone with clearance warned them of the Death Wail. Iovo's guardians enacted the <b>Shield of Seven Songs</b>, tying their world to the Astral Plane, anchored by small stations left behind — each able to recall Iovo. Rushed, the ritual let the Death Wail break off chunks that mixed with Damiar's to form the Diaspora. Damiar had no such ritual and was annihilated."],
    checks: ["DC 20 Computers or DC 20 Society after reviewing the files: the Chapter 1 station is one of the anchors, and may hold the carrier signal to bring Iovo back."] },

  { key: "ahmzovar", tab: "ch3", title: "Meeting Ahmzovar", tone: "plum", sub: "Zo!, without the grin",
    text: ["Quiet and serious, Zo! shows an ancient photograph of himself with the person who became Undying Admiral Shathrava, and confirms everything. His allies in the Starfinder Society have long studied Iovan asteroids — one, Aucturn's Tear, orbits every 56 years. Shathrava warned Iovo; Zo! helped build the Death Wail and has spent his fortune on elebrian life ever since.",
      "His spies say Captain Sanimus Slayn towed the station into the Drift with a gravimetric tether, bound for Barrow, the Corpse Fleet's shipyards in the Vast. Zo! knows a secret Drift lane there."],
    checks: ["DC 16 Infosphere Lore, DC 16 Mining Lore, DC 16 Physical Science Lore, or DC 16 Starfinder Society Lore, or DC 18 Religion or DC 18 Society to Recall Knowledge: Aucturn's Tear once housed the Untouchable Opal, a prison for Ranginori."],
    treasure: "A tactical shredskin each (for Barrow), 15 rounds of POW! ammunition, and one advanced replica Zo! microphone. Zo! Media pays them 750 credits each." },

  { key: "ch3end", tab: "ch3", title: "Concluding the Chapter", tone: "moss", sub: "farewell to Eox",
    text: ["Resupply in the prop armories (Jazzy's invitation) and free medical care. Zo!'s luxury shuttle takes them to Pact Port in style, and the grin is back for the crowd. A last spell of downtime: sell gear, buy augmentations. When they're ready, Barrow.",
      "<b>Level up to 4th</b> if they haven't already."] },

  /* ============================== CHAPTER 4 ============================== */
  { key: "farewell", tab: "ch4", title: "Farewell to Pact Port", tone: "slate", sub: "Zo!'s plan",
    text: ["An early wake-up call, breakfast delivered, and skeletons carrying their luggage. Zo!'s mechanics have added security features and programmed a secret Drift lane to Barrow. Shathrava answers surprises with readiness drills, so Barrow will be lightly defended — if they leave now. Zo! asks each PC to record a heartfelt farewell (and authorize its promotional use).",
      "Drift travel: 1d6 days in-system, 3d6 to Near Space, 5d6 to the Vast."],
    treasure: "At Hidden Corners, an antique mall that doesn't look open, a coded knock produces a gift box: a commercial congealer incense and a bone credstick with 1,000 credits." },

  { key: "intodrift", tab: "ch4", title: "Into the Drift", tone: "ember", sub: "the secret lane",
    text: ["No check to enter the Drift if someone trained in Piloting crews the ship. The events that follow take place on board — the Nova Rush decks, or your own ship map."] },

  { key: "e1", tab: "ch4", title: "Event 1: Malfunction", level: "Low 4", tone: "rust",
    boxed: "Moments after entering the Drift, Captain Concierge begins to hover above the navigation station, announcing in a cheerful voice: “Warning! User error–related device behavior detected! Please be safe, nufriends!”",
    text: ["DC 17 Perception: a success reads it as an incoming malfunction and may take an exploration action; everyone else is surprised. Spectra merged with the Drift engine, spawning two hardlight mascots where most of the party is: a smiling pirate wheel that says “yarr”, and a frowning arcade-joystick gun suite. Tethered to the computer, they fight until destroyed, or pacified with DC 19 Computers and DC 19 Diplomacy at your discretion.",
      "Reasoned with, they say “rainbow comets” purged a “corpse virus” from the computer. Training in Drift Lore, Piloting Lore, or Religion — or Captain Concierge — identifies spectra. Then alerts pop up everywhere: one minute to prepare."],
    foes: "mascots",
    xp: ["f_e1"] },

  { key: "e2", tab: "ch4", title: "Event 2: All Hands on Deck", level: "Trivial 4", tone: "rust",
    text: ["Cascade faults threaten to leave them adrift. The spectra in the engines are unaffected. Each successful disable check removes an action from the panels' routine; a critical success removes two."],
    foes: "panels", counters: [["panels", "Actions removed"]],
    checks: ["Disable: DC 17 Computers (trained) to reboot; DC 19 Crafting, DC 19 Physical Science Lore, or DC 19 Thievery (trained) to flip breakers and snip wires; DC 21 Acrobatics, DC 21 Perception, or a DC 21 Reflex save to dodge the sparks; DC 24 Athletics or a DC 24 Fortitude save to force the panels shut.",
      "Cascading Failure as it begins: 2d8+5 electricity to everyone aboard, DC 21 basic Reflex.",
      "Afterwards, an hour's rest. DC 21 to Search or Investigate: the ship is still glitching with no technical cause, and Captain Concierge detects two alien presences."],
    xp: ["f_e2"] },

  { key: "e3", tab: "ch4", title: "Event 3: Convergence", level: "Moderate 4", tone: "plum", sub: "the spectra",
    text: ["Two excuba spectra frolicking alongside the ship found Corpse Fleet tracking malware in the Drift engine, purged it, and accidentally spawned the hardlight. They're staying to make sure the crew is safe, and won't defer to “the flawed judgment of unenlightened mortals” (kindly meant). Two successes (or one crit) influence them; then they share what they know of the Drift and leave whenever asked. They're especially eager to commune with any prismeni PC.",
      "Hostile or insulting PCs get a fight. If one dies, the other uses Slip Drive below 20 HP."],
    foes: "excuba", counters: [["spectra", "Successes"]],
    checks: ["Influence: DC 19 Computers, DC 19 Deception, DC 19 Diplomacy, DC 19 Intimidation, or DC 19 Performance."],
    pick: { key: "spectra", opts: [["peaceful", "Peaceful meeting", "good"], ["fought", "They fought", "bad"]],
      text: { peaceful: "Sparkly sand clings to their armor long after. The spectra leave behind a fixed point solarian crystal. Opa Zari will notice: +1 status to negotiate with the corsairs.",
        fought: "Darker, irritating sand stains their clothes. Opa Zari will notice: −1 status to negotiate with the corsairs." } },
    xp: ["f_e3", "spectra"] },

  { key: "fragment", tab: "ch4", eid: "D", title: "Planar Fragment", tone: "ember", sub: "a floating volcano",
    text: ["Twenty-four hours later, an unknown gravitational field draws them to a chunk of the Plane of Fire: a floating volcano taller than any skyscraper on Absalom Station. Environmental protections handle the heat for at least an hour. Smoke conceals everything. Captain Concierge traces the anomaly to the southern flank and sends a rough map. The 60-foot ridges between areas are greater difficult terrain."],
    checks: ["Scan the anomaly: DC 19 Computers, DC 19 Drift Lore, DC 19 Mining Lore, DC 19 Nature, or DC 19 Physical Science Lore — a fragment of the Plane of Fire is holding the ship. Critical success: about a dozen fire creatures live there, six between the ship and the anomaly.",
      "Landing gently: DC 19 Piloting."] },

  { key: "d1", tab: "ch4", eid: "D1", title: "Slippery Slope", level: "Trivial 4", tone: "rust",
    text: ["The first slope takes DC 18 Athletics to Climb or a DC 15 Fortitude save each hour; a failure makes no progress, and repeated failure may leave a PC fatigued. A hundred feet up, the slope begins to crumble — anyone who detects it may try to disable it first."],
    foes: "rockslide",
    xp: ["f_d1"] },

  { key: "d2", tab: "ch4", eid: "D2", title: "Lava Flow", level: "Low 4", tone: "rust",
    text: ["Entering lava: 1d6 fire. Submerging (falling or going prone): 6d6 fire plus 1d6 persistent fire. Two thermatrods bathing on the far side attack ferociously."],
    foes: "thermatrods",
    treasure: "Each thermatrod leaves a smoldering chunk that works as an advanced incendiary grenade.",
    xp: ["f_d2"] },

  { key: "d3", tab: "ch4", eid: "D3", title: "Gravity Well", level: "Severe 4", tone: "rust",
    text: ["A cylinder of planar magnetite juts from the volcano. Frenzied fire elementals guard it unless the PCs find a way to talk to them. Removed, it's 3½ feet long, a foot across, 8 Bulk — and the volcano begins to rumble."],
    foes: "well",
    checks: ["DC 18 Nature or DC 18 Drift Lore: the magnetite is the gravity source. Harvesting it: DC 18 Athletics or DC 18 Mining Lore and 2 hours of labor."],
    treasure: "Fire opals worth 1,000 credits in all.",
    xp: ["f_d3"] },

  { key: "caldera", tab: "ch4", title: "Event: Explosive Caldera", tone: "ember", sub: "chase · back to the ship",
    text: ["Removing the magnetite wakes a thermatrod caldera, far beyond the party — make it clear their only hope is the ship. Unlisted skills: DC 24. Instead of a check, a PC can Strike the caldera (AC 29): a hit earns 2 Chase Points; a miss costs 2d6 fire as its aura rolls over them (double on a critical miss, rather than losing a point)."],
    chase: "caldera", widget: "magnetite",
    xp: ["magnetite"] },

  { key: "reciprocity", tab: "ch4", title: "Reciprocity", level: "Moderate 4", tone: "rust", sub: "starship scene · the Amaranth returns",
    boxed: "The Corpse Fleet cruiser the PCs encountered in Chapter 1 returns for a final showdown!",
    text: ["Slayn stayed on Barrow; deputy captain Vanyra Voshin, a faceless who hates the living, was sent to scan the Plane of Fire for magnetite and abandoned her mission when her scans found the PCs. Victory: reduce the Amaranth to 0 HP. Roles: captain, engineer, two gunners, magic officer, pilot, science officer.",
      "The Amaranth's routine disrupts a role (Arcana against that PC's Will DC, or the ship's) — glitching 1 until the end of the round — then fires its antimatter beam."],
    foes: "recip",
    checks: ["Bold Talk (captain): DC 18 Deception or DC 18 Intimidation — every enemy role frightened 1, or 2 on a crit.",
      "Evasive Maneuvers (pilot): DC 15 Piloting or DC 18 Perception — +1 AC, +2 on a crit; off-guard on a critical failure.",
      "Patch Job (engineer): DC 15 Crafting or DC 18 Athletics — regain 2d8 HP.",
      "Scan (magic or science officer): DC 15 Computers, or DC 16 Arcana, DC 16 Nature, DC 16 Occultism, or DC 16 Religion."],
    xp: ["f_recip"] },

  { key: "e4", tab: "ch4", title: "Event 4: Final Onslaught", level: "Severe 4", tone: "rust",
    text: ["When one ship is beaten, or the fight drags, the Amaranth fires eight rigor mortics at their hull in twos and fours. Emergency force fields snap into place behind them. They rampage until destroyed. Use the ship's map."],
    foes: "onslaught",
    xp: ["f_e4"] },

  { key: "e5", tab: "ch4", title: "Event 5: Face Off", level: "Moderate 4", tone: "rust",
    text: ["Vanyra and her nameless faceless magic officer cross the void to finish it, cutting the party off from healing and hoping to claim their faces. Both fight until destroyed — or stalk the ship a while first.",
      "If they win, survivors and preserved corpses go to the Amaranth, bound for Barrow — until scouts from the Defiance intercept it and Opa Zari rescues them. If Vanyra falls and the Amaranth still flies, its cowardly engineer takes it and flees."],
    foes: "faceoff",
    treasure: "Vanyra's bone cuff links, components for a commercial hypernerves magitech augmentation.",
    xp: ["f_e5"] },

  { key: "capers", tab: "ch4", title: "Cosmic Capers", level: "Moderate 4", tone: "plum", sub: "the Cosmic Corsairs",
    boxed: "“Greetings, friends. I am Opa Zari. This Drift Lane is under the protection of the Cosmic Corsairs. If you'd like to enjoy some famous corsair hospitality onboard our carrier I can escort you there. In the meantime, let's negotiate my security fee.”",
    text: ["Two days later, four flame-painted starfighters surround them, sing a space shanty about piracy, and show off. Opa Zari is a prismeni vesk in a bombardier jacket and runed aviator goggles. If the PCs don't shoot first, each can try to influence them, DC 21: bluster with Athletics, Diplomacy, or Intimidation; plead with Deception or Performance; flex with Piloting or a warning shot. A critical success counts double; earnest roleplay gets +1. Piracy Lore works for any argument, rolled twice."],
    widget: "opa",
    xp: ["f_capers"] },

  { key: "defiance", tab: "ch4", title: "The Defiance", tone: "slate", sub: "a pirate's paradise",
    boxed: "The capital ship looms in the viewport. Iridescent words and symbols meaning “Defiance” in different languages, including Vesk, adorn its battered hull.",
    text: ["A salvaged Veskarium carrier, its people lost in the Drift Crisis and saved by spectra. Enemies of the Corpse Fleet are welcomed as comrades. An impromptu swap meet: sell gear, buy common items up to level 4; a grimy hospital installs augmentations. A small local infosphere still buzzes about the shuttle attack over Eox — their shows haven't aired here yet."] },

  { key: "draught", tab: "ch4", title: "Drifter's Draught", level: "Moderate 4", tone: "rust", sub: "the bar brawl",
    text: ["Opa Zari puts the PCs' order on their tab. A grumpy, grog-soaked corsair crew picks a fight over anything — cutting in line will do. Talking them down takes both a DC 22 Diplomacy and a DC 22 Piracy Lore success; Intimidation starts the fight at once.",
      "Fists, stools, and cups — nonlethal. Grabbing a stool or chair is an Interact; they break on a hit but are built to be fixed. Piracy Lore can Demoralize. Corsairs give up at 10 HP. Lethal damage and everyone flees the bar."],
    foes: "corsairs",
    pick: { key: "brawl", opts: [["talked", "Talked down", "good"], ["brawl", "A fair brawl", "good"], ["lethal", "Lethal force", "bad"]],
      text: { talked: "No fight. The corsairs buy them food and drink as a token of peace.",
        brawl: "Everyone cleans up and tends the injured. Opa Zari's in the brawling camp; Afaella, the prismeni lashunta counselor, urges a talk and an apology. Persuading the corsairs into therapy: DC 19 Diplomacy, or a bribe of 20+ credits and DC 19 Deception so she never finds out. No more quarrels.",
        lethal: "No allies outside. Opa Zari, backed by wary armed corsairs, asks them to wrap up their business and leave — they broke the rule of sanctuary, no better than the Corpse Fleet." } },
    xp: ["f_draught"] },

  { key: "ch4end", tab: "ch4", title: "Concluding the Chapter", tone: "moss",
    text: ["On the Defiance, mechanics tune the ship and Cloud Nine, an agender prismeni barathu mystic, gives it a custom paint job that expresses the crew's identity. Back on Zo!'s course. Corsair allies (or enemies) can't follow them out of the Drift, but may send messages of support; so might Ulrikka, or anyone else they've bonded with."] },

  /* ============================== CHAPTER 5 ============================== */
  { key: "silent", tab: "ch5", title: "Silent Running", level: "Moderate 4", tone: "rust", sub: "starship scene · approaching Barrow",
    text: ["A rogue planet with no star, no atmosphere, and shipyards everywhere. Captain Concierge's data names a landing site the Corpse Fleet avoids: the Fracture. Victory: 6 or more Infiltration Points, then land. Roles: captain, two gunners, magic officer, pilot, science officer. Shooting their way in is possible — run patrol ships on the Cosmic Sortie's framework — but it raises a preliminary alert.",
      "<b>Necromantic Interference:</b> each PC in a role attempts a DC 20 Will save or is frightened 2 for 1 minute. The swarm's routine rolls Perception against the ship's Reflex DC for Alert Points; at 8 it Calls Reinforcements next round, and Captain Concierge gives 2 rounds' warning."],
    foes: "silent", widget: "silent",
    checks: ["Fly Under the Radar (pilot): DC 19 Piloting — 1 Infiltration Point, 2 on a crit, lose 1 on a critical failure.",
      "Hack Defenses (magic or science officer): DC 22 Arcana, DC 22 Computers, DC 22 Nature, DC 22 Occultism, or DC 22 Religion — the same.",
      "Inspire Crew (captain): DC 20 Diplomacy or DC 20 Intimidation — one ally +2 status to their next check (two on a crit); critical failure, the next check is at −1.",
      "Prepare for Landing (captain or pilot, 3 actions): only once the victory condition is met.",
      "DC 20 Eox Lore or DC 20 Society (or ask Captain Concierge): the Corpse Fleet avoids the Fracture."],
    xp: ["f_silent"] },

  { key: "alert", tab: "ch5", title: "Red Alert", tone: "rust", sub: "how awake Barrow is",
    text: ["Most of the fleet is away on maneuvers, so an alarm isn't overwhelming — just harder."],
    widget: "alert" },

  { key: "fracture", tab: "ch5", title: "The Fracture", tone: "slate", sub: "scanning, and the plan",
    text: ["Zo!'s data leads them, no check, to a Zo! Media docking clamp inside the Fracture — a continent-sized chunk of Barrow held in close orbit by Corpse Fleet gravimetrics. The scan shows the asteroid is moored by a gravimetric tether that can only be disabled at its source. Captain Concierge rigs the ship for remote piloting and suggests the PCs spacewalk down — flying any closer means certain detection."],
    counters: [["scanBarrow", "Successes"]],
    checks: ["Scan the planet: DC 19 Computers, DC 19 Mining Lore, DC 19 Nature, or DC 19 Physical Science Lore — or intercept comms with DC 24 Infosphere Lore, DC 24 Media Lore, or DC 24 Society (+2 with Necril).",
      "One success: the asteroid is in an auxiliary research center far from the shipyards, being explored by probes. Two successes, or a critical success: micrometeor showers between the Fracture and the surface — +2 circumstance to avoid them. Failure: Captain Concierge finds it eventually, while a patrol looms dreadfully close."] },

  { key: "freefall", tab: "ch5", title: "Free Falling", level: "Trivial 4", tone: "rust", sub: "the spacewalk",
    text: ["No atmosphere, so the spacewalk isn't extreme with environmental protections on — but micrometeors whip through the gap. Everyone spacewalking faces the hazard."],
    foes: "meteors",
    checks: ["Avoid it: DC 20 Acrobatics, or DC 20 Athletics or a Strike against AC 20 to break or deflect debris. A failure: 2d10+13 bludgeoning, DC 21 Reflex to stay on course."],
    xp: ["f_fall"] },

  { key: "turrets", tab: "ch5", title: "Turret Defense", level: "Low 4", tone: "rust", sub: "necroturrets",
    text: ["Anyone who failed against the micrometeors lands clumsy 1 and off-guard until they spend an action to steady themselves. Two Large necroturrets, 200 feet off, fire on living creatures. They track by lifesense — a PC with an active shredskin is invisible to them, and if everyone uses theirs, the hazard is overcome without a roll. Each successful disable check removes one action from a turret's routine (two on a crit)."],
    foes: "necroturrets", widget: "necroturrets",
    checks: ["Disable: DC 16 Computers (trained) or DC 16 Vidgame Lore (trained); DC 18 Arcana, DC 18 Nature, DC 18 Occultism, or DC 18 Religion (trained); or DC 20 Athletics or DC 20 Thievery.",
      "Afterwards: DC 17 Warfare Lore, or DC 19 Perception or DC 19 Society — Barrow's defenses are built against large attacks, not small teams."],
    xp: ["f_turrets"] },

  { key: "door", tab: "ch5", title: "Auxiliary Research Center", tone: "ember", sub: "the cargo door",
    text: ["A shuttle pad and a cargo door; every other way in is miles off, down the transport tubes. Without access codes, they need two consecutive DC 19 successes before four failures. Hack with Computers, short the wiring with Crafting, trip the locks with Thievery — or Military Lore or Corpse Fleet Lore for standard procedure (Eox Lore is too general)."],
    widget: "door" },

  { key: "reinforce", tab: "ch5", title: "Reinforcements", tone: "rust", sub: "three waves",
    text: ["The loading dock's gunfire brings at least some response, in waves. Event 2 comes if they rest longer than an hour anywhere in area E; Event 3 if they rest another hour or more after learning reinforcements are coming. Adjust the timing so the party is challenged, not overwhelmed."],
    widget: "reinforce" },

  { key: "rf1", tab: "ch5", title: "Event 1: Welcome Party", level: "Trivial 5", tone: "rust",
    text: ["Four bonecrushers through the loading dock or the transport tubes. Smart tactics, long range, corners for cover. They know they're outmatched and just want to slow and hurt the PCs."],
    foes: "welcome", xp: ["f_rf1"] },
  { key: "rf2", tab: "ch5", title: "Event 2: Junior Officers", level: "Low 4", tone: "rust",
    text: ["Four junior officers through the northern tubes, in pairs, with reach weapons and startling charges, focusing fire on one or two targets."],
    foes: "juniors", xp: ["f_rf2"] },
  { key: "rf3", tab: "ch5", title: "Event 3: Ghostly Assassins", level: "Low 4", tone: "rust",
    text: ["Two incorporeal faceless fly in through the ceiling near the PCs and go for healers and leaders first, saving the armored and the strong for last."],
    foes: "assassins", xp: ["f_rf3"] },

  { key: "E1", tab: "ch5", eid: "E1", title: "Loading Dock", tone: "rust",
    levelFn: (t) => `${["Low", "Moderate", "Severe"][t.alert]} 4`,
    text: ["Plastic crates of body parts, bones, and stolen cargo (AC 10, Hardness 1, HP 5). Double-stacked crates are cover; DC 15 Athletics knocks one aside; one can be thrown for 1d10 bludgeoning (thrown 10 feet).",
      "A decontamination sweep makes everything applicable glitching 1 in here, and the pressure door to E2 is sealed until it finishes, 10 minutes after the fight. Unpressurized until then."],
    widget: "dock",
    checks: ["DC 19 Perception: a container stolen from an Ulrikka mining expedition, worth a 500-credit reward."],
    treasure: "A designer satchel (300 credits) holding a 3rd-rank spell gem of motivating ringtone, two tactical medpatches, two bone serums, and two applications of sprayflesh.",
    note: "By now they should have enough XP for 5th level — let them level up during the 10 minutes.",
    xp: ["f_E1"] },

  { key: "E2", tab: "ch5", eid: "E2", title: "Central Hallway", level: "Low 5", tone: "rust",
    text: ["Bright halls of magically treated bone, door panels labeled in Necril. Near the northern junction hangs a mummy wasp hive; the swarm emerges only if its lifesense detects living creatures — shredskins pass unnoticed. It fights until destroyed, leaving a hive that regrows it in a day unless destroyed too."],
    foes: "swarm", xp: ["f_E2"] },

  { key: "E3", tab: "ch5", eid: "E3", title: "Mortic Lab", tone: "rust",
    levelFn: (t) => (t.s.counters.thawed ?? 0) > 0 ? "Moderate 5" : "Low 5",
    text: ["Dozens of rigor mortics frozen in launch tubes; two repurposed security robots carry them to an examination table for new ice coatings. The robots ignore undead and attack the living — shredskins make the whole party invisible to them, even mid-fight.",
      "The coatings are unstable: any critically failed attack roll, spell or Strike, hits an encased mortic instead, which rolls initiative and joins next round."],
    foes: "mortic", counters: [["thawed", "Mortics thawed"]],
    treasure: "Both robots wear commercial jetpack armor upgrades.",
    xp: ["f_E3"] },

  { key: "E4", tab: "ch5", eid: "E4", title: "Necrotech Lab", level: "Moderate 5", tone: "rust",
    text: ["Two boneflayers await field trials, seemingly powered down (or hidden) but watching. On autopilot they hunt Corpse Fleet enemies to the death: one climbs the ceiling and fires the machine gun in its mouth while the other charges."],
    foes: "boneflayers",
    treasure: "Their integrated advanced machine guns, and 200 rounds of projectile ammunition in a locker.",
    xp: ["f_E4"] },

  { key: "E5", tab: "ch5", eid: "E5", title: "Gef Lab", level: "Moderate 5", tone: "plum", sub: "Nobrom Darameer",
    text: ["Stinky cheese, cages, barrels, chemistry stands. Nobrom Darameer, a crimson partial-corpsefolk researcher from Akiton, raises his one arm placatingly. He's trying to turn arabuk cheese into a vapor phantom gefs can eat. Harm him (AC 15, 30 HP, fails every save) and four gefs attack, hitting the PCs who threatened him and using their invisibility. Barrels and stands (AC 15, Hardness 2, HP 5) splash liquid that can reveal them.",
      "Talk instead and it's an influence encounter. Below 5 Influence he panics, sets the gefs on them, and flees for the tubes. Either way he asks to be tied up, so the fleet won't think he helped. With 7+ and an offer, he packs up and follows them — no fighting, general advice only."],
    foes: "gefs", influence: "nobrom",
    checks: ["Convince him they're Corpse Fleet: DC 22 Deception — he'll listen as long as they like.",
      "Searching after tying him up without reaching 9: DC 25 Perception finds the ghost killer upgrade."],
    xp: ["f_E5"] },

  { key: "E6", tab: "ch5", eid: "E6", title: "Lab", level: "Moderate 5", tone: "rust",
    text: ["Two senior researchers watch their newest horror in a force field: a lifeleech ooze made by liquefying their own troops. They drop the field the moment the door opens, or when they hear noise outside. The ooze prefers living targets with Strip Flesh, sharing as many spaces as it can. The wights load their needler pistols with cursed blood and fire from range; the ooze gives them no lesser cover."],
    foes: "ooze", flags: [["keycards", "Took the scientists' keycards — E7 opens without a check"]],
    treasure: "A commercial graviton orbital solarian weapon crystal from the ooze's core, and the scientists' keycards to E7.",
    xp: ["f_E6"] },

  { key: "E7", tab: "ch5", eid: "E7", title: "Computer Center", level: "Moderate 5", tone: "rust", sub: "the necroserver",
    text: ["Once open, a sensor scans for living creatures within 10 feet of the door and raises a shock grid across it. Nobrom's code shuts it off at the keypad; shredskins deactivate it too.",
      "The necroserver ties into Barrow's information and defense networks — a skilled hack could earn a great deal."],
    foes: "grid", widget: "necroserver",
    xp: ["f_E7", "hack"] },

  { key: "E8", tab: "ch5", eid: "E8", title: "Destroyed Lab", tone: "slate",
    text: ["An unlabeled door. A collapsed ceiling, sprayed airtight with sealant."],
    checks: ["DC 20 Chemistry Lore or DC 20 Physical Science Lore: the sealant is like the WasteSafe foam from the shuttle crash."] },

  { key: "E9", tab: "ch5", eid: "E9", title: "The Prisoner", level: "Moderate 5", tone: "plum", sub: "optional",
    text: ["Hundreds of force projectors scramble communication (telepathy included) and magic; the shielding reaches just inside the door and switches at the keypad (one Interact). Kitthaine Kitar was a Xenowarden killed on the <i>Solar Sailor</i>; they rose as a corpsefolk who can still heal, twisted by years of tests. Hearing noise, they cast glow up to look like a living kasatha prisoner and beg for freedom. Drop the shield and they attack, indiscriminately.",
      "A good place for secret checks: Sense Motive is a secret Perception check against Kitthaine's Deception DC, 1 or 2 higher if they cast glow up first."],
    foes: "prisoner",
    pick: { key: "kitthaine", opts: [["left", "Left the shield up", "good"], ["freed", "Dropped the shield", "bad"]],
      text: { left: "They move on. Kitthaine's pleas follow them down the hall.", freed: "Kitthaine attacks at once, lashing out in rage and pain." } },
    xp: ["f_E9"] },

  { key: "E10", tab: "ch5", eid: "E10", title: "Transport Tubes", tone: "slate",
    text: ["Ten-foot tubes to other facilities; cylinders seat one Large or four Medium creatures. An elevator goes up to the north side of the observation deck (F). Exploring the rest of Barrow is beyond the adventure. Blocking each tube stops reinforcements coming through it."],
    counters: [["tubes", "Tubes blocked"]],
    checks: ["Per tube: DC 18 Computers, DC 18 Corpse Fleet Lore, or DC 18 Labor Lore to force a maintenance cycle; DC 20 Crafting or Thievery (no DC printed) to cut its power; or DC 22 Athletics to force the emergency hatch shut."] },

  { key: "deck", tab: "ch5", eid: "F", title: "Observation Deck", level: "Severe 5", tone: "rust", sub: "Sanimus Slayn",
    text: ["A platform over the hangar, pillars everywhere, the ceiling sloping from 15 to 45 feet. Captain Sanimus Slayn has ordered no interruptions until the probes crack the station's cipher, and readies his machine gun at the elevator chime. He knows them from intelligence photos — “biological parasites” — and fights brutally, hitting several at once, using cover and denying it. His three trained phantom gefs play Tug-of-War and keep melee PCs off him. If Nobrom came along, he hides in the elevator.",
      "Any critically failed ranged attack ricochets into a window: rapid depressurization. Pillars (AC 10, Hardness 5, HP 15) become difficult terrain when destroyed."],
    foes: "deck", widget: "deck",
    checks: ["Rapid Depressurization: DC 14 Crafting or DC 14 Labor Lore (trained) adjacent to patch it, DC 16 Computers (trained) for the emergency shutter, or DC 18 Survival or DC 18 Thievery to cover the hole. After a minute, all the air is gone."],
    treasure: "Six pairs of tactical sunshades in the cabinets, and a bone credstick with 600 credits.",
    xp: ["f_F"] },

  { key: "ending", tab: "ch5", title: "Concluding the Adventure", tone: "moss", sub: "the getaway",
    widget: "ending",
    text: ["They escape with the asteroid as a shield — the undead avoid hitting it. A Corpse Fleet chase follows them into the Drift; narrate it cinematically, a fight they can't win alone. Near Eox, three Eoxian dreadnoughts led by Captain Fantaray's <i>Golden Grail</i> turn the pursuers back, sent by an unnamed bone sage “courtesy of Zo! Media.”",
      "The asteroid goes back to its place in the Diaspora with Ulrikka and their sponsors. The PCs board the station once more and activate the command codes — and a lost world begins to return."] }
];

/* -------------------------------------------------------- module links
   What each card opens in the module: journal pages, the encounter scene,
   sound, scene macros, NPCs, things to show, loot, effects, and the module's
   tracker actors. Kept apart from CARDS so the book's text and the module's
   ids can each be checked on their own. */
const LINKS = {
  breakfast: { pages: ["ch1.02echoesfromth00", "front.01gettingstart00"], audio: ["Absalom Station", "Absalom Station Indoors"], npcs: ["Emmozie"] },
  interview: { pages: ["ch1.02jobinterview00"], npcs: ["Belenze Shadraz", "Rabech Shadraz", "Helmut Navdeep", "Whatzon Whatz-Gurz", "Emmozie"] },
  stations: { pages: ["ch1.02toyourbattle00"], scene: "upper", npcs: ["Captain Concierge"] },
  drifting: { pages: ["ch1.02diasporadrif00"], audio: ["Nova Rush"] },
  dock: { pages: ["ch1.02iovanstation00", "ch1.02a1dockingpor00"], scene: "station", audio: ["Iovan Station Alpha"] },
  a2: { pages: ["ch1.02a2airlockamb00"], scene: "station", loot: ["Airlock Loot"] },
  a3: { pages: ["ch1.02a3safetycorr00"], scene: "station" },
  a4: { pages: ["ch1.02a4crewquarte00"], scene: "station", loot: ["Crew Quarters"] },
  a5: { pages: ["ch1.02a5auditorium00"], scene: "station", audio: ["Projector"], macros: ["projector"] },
  a6: { pages: ["ch1.02a6gymnasium000"], scene: "station", audio: ["Treadmill"], loot: ["First Aid Station"] },
  a7: { pages: ["ch1.02a7utilitycor00"], scene: "station" },
  a8: { pages: ["ch1.02a8computerce00"], scene: "station", audio: ["Console Beeps"], loot: ["Computer Center (A8)"] },
  a9: { pages: ["ch1.02a9arcanelabo00"], scene: "station", loot: ["Arcane Laboratory"] },
  a10: { pages: ["ch1.02a10hydroponi00"], scene: "station" },
  a11: { pages: ["ch1.02a11commandco00"], scene: "station" },
  marauders: { pages: ["ch1.02maliciousmar00"], scene: "marauders", audio: ["Nova Rush Under Attack"], effects: ["primed", "minor", "major"],
    npcs: ["Captain Concierge"], shows: ["amaranth"] },
  ch1end: { pages: ["ch1.02concludingth00"], audio: ["Star Citadel Theodrane"], npcs: ["Belenze Shadraz", "Rabech Shadraz", "Helmut Navdeep", "Whatzon Whatz-Gurz"],
    loot: ["Helmut's Reward (Per PC)"], shows: ["ammo"] },

  pactport: { pages: ["ch2.03worldofthede00", "ch2.03unlivinghosp00", "eox.07pactport000000"], scene: "pactport", audio: ["Pact Port"],
    npcs: ["Sadrat Phain"], loot: ["Sadrat's Gift"], shows: ["bobblehead"] },
  linger: { pages: ["ch2.03hangingaroun00"], scene: "pactport", npcs: ["Noeli"], shows: ["ticket"] },
  shuttle: { pages: ["ch2.03firstclassdi00"], scene: "shuttle", audio: ["Shuttle", "Doomed Shuttle"], macros: ["shuttleAmb", "forcefields"],
    npcs: ["Ghoul Flight Attendant"], loot: ["Shuttle Wreckage"], shows: ["kit"] },
  horde: { pages: ["ch2.03norestforthe00"], audio: ["Atraskein Shelf", "Zombie Horde"] },
  serpent: { pages: ["ch2.03snakeinthegl00"], scene: "serpent", audio: ["Atraskein Shelf"], shows: ["drone"] },
  trek: { pages: ["ch2.03overthedeadh00", "eox.07theatraskien00"], audio: ["Atraskein Shelf"] },
  camping: { pages: ["ch2.03campingoneox00"], scene: "camping", audio: ["Atraskein Shelf"], shows: ["drone"] },
  shelter: { pages: ["ch2.03zephyrousshe00"] },
  xoalats: { pages: ["ch2.03spookedxoala00"], scene: "xoalats", npcs: ["Eterrina Rikutan"] },
  eterrina: { pages: ["ch2.03undeadreckon00"], scene: "xoalats", audio: ["Eterrina's Barn"], npcs: ["Eterrina Rikutan"], loot: ["Eterrina's Gifts"] },
  manor: { pages: ["ch2.03etchedmemori00"], scene: "killsquad", audio: ["Ancient Manor"], shows: ["manor", "drone"] },
  killsquad: { pages: ["ch2.03killsquad00000"], scene: "killsquad", audio: ["Ancient Manor"] },
  camera: { pages: ["ch2.03smileyoureon00"], npcs: ["Wazasha Kevir"], shows: ["drone"] },
  ch2end: { pages: ["ch2.03concludingth00", "eox.07thehallsofth00"], audio: ["Shuttle", "Halls of The Living"] },

  petsnacks: { pages: ["ch3.04hallsoftheli00", "ch3.04petsnacks00000"], scene: "petsnacks", audio: ["Halls of The Living"],
    npcs: ["Wazasha Kevir"] },
  frontroom: { pages: ["ch3.04frontroomdea00", "npc.12zo000000000000"], scene: "petsnacks", npcs: ["Zo!", "Wazasha Kevir", "Jazzy Malsavis"] },
  souffle: { pages: ["ch3.04sabotagesouf00", "ch3.04bsoufflstadi00"], scene: "stadium", audio: ["Souffle Stadium", "Crowd Cheer", "Crowd Boo"],
    npcs: ["Zo!", "Wazasha Kevir"], trackers: ["cooking"] },
  meat: { pages: ["ch3.04b1themeatjun00"], scene: "stadium", audio: ["Meat Jungle"] },
  graves: { pages: ["ch3.04b3gravediggi00"], scene: "stadium", audio: ["Grave Digging"], macros: ["digGrave"] },
  gauntlet: { pages: ["ch3.04b4flaminggau00"], scene: "stadium", audio: ["Flaming Gauntlet"] },
  cook: { pages: ["ch3.04b2kitchensta00", "ch3.04letthemcook000"], scene: "stadium", trackers: ["cooking"] },
  spinner: { pages: ["ch3.04sabotagespin00"], scene: "stadium", audio: ["Sabotage Spinner Wheel", "Souffle Surprise"], npcs: ["Zo!"] },
  tasting: { pages: ["ch3.04cookingchall00", "ch3.04tastingandju00"], scene: "stadium", audio: ["Crowd Cheer", "Crowd Boo"],
    npcs: ["Luwazi Elsebo", "Zo!"], loot: ["Zo!'s Cooking Gift", "Zo!'s Cooking Reward"], shows: ["chompers"], trackers: ["cooking"] },
  hoards: { pages: ["ch3.04realhoardsof00"], npcs: ["Rex Steelscale"] },
  telmarci: { pages: ["ch3.04thelastelebr00"], npcs: ["Telmarci Jusinoa", "Wazasha Kevir"] },
  c1: { pages: ["ch3.04cfrontlinesf00", "ch3.04c1contestedl00"], scene: "frontlines", audio: ["Front Lines Frayed", "Shuttle"] },
  c2: { pages: ["ch3.04c2newcrater000"], scene: "frontlines", audio: ["Artillery Impact"], macros: ["createCrater", "resetCrater"] },
  c3: { pages: ["ch3.04c3trenches0000"], scene: "frontlines" },
  c4: { pages: ["ch3.04c4mortartube00"], scene: "frontlines", audio: ["Mortar Shelling"], macros: ["mortars"] },
  c5: { pages: ["ch3.04c5dugout000000"], scene: "frontlines", macros: ["sandbagsS", "sandbagsW"] },
  c6: { pages: ["ch3.04c6crossingpa00"], scene: "frontlines" },
  c7: { pages: ["ch3.04c7commsbunke00"], scene: "frontlines", npcs: ["Telmarci Jusinoa"], loot: ["Bunker Loot"] },
  c8: { pages: ["ch3.04c8perimeterd00"], scene: "frontlines" },
  c9: { pages: ["ch3.04c9searchligh00"], scene: "frontlines" },
  c10: { pages: ["ch3.04c10landingzo00"], scene: "frontlines", audio: ["Ticking", "Explosion", "Shuttle"] },
  rescue: { pages: ["ch3.04hallsoftheli01"], audio: ["Halls of The Living"], npcs: ["Wazasha Kevir", "Jazzy Malsavis", "Telmarci Jusinoa"], loot: ["Gift Basket"] },
  unlock: { pages: ["ch3.04unlockingthe00"], npcs: ["Telmarci Jusinoa"] },
  ahmzovar: { pages: ["ch3.04meetingahmzo00", "npc.12campaignrole02"], npcs: ["Zo!", "Ahmzovar"], loot: ["Zo!'s Gifts"], shows: ["shredskin", "mic"] },
  ch3end: { pages: ["ch3.04concludingth00"], scene: "pactport", npcs: ["Jazzy Malsavis"] },

  farewell: { pages: ["ch4.05intothedrift00", "ch4.05farewelltopa00"], scene: "pactport", npcs: ["Zo!"], loot: ["Hidden Corners Loot"] },
  intodrift: { pages: ["ch4.05intothedrift01"], scene: "upper", audio: ["The Drift"] },
  e1: { pages: ["ch4.05event1malfun00"], scene: "upper", audio: ["The Drift"], npcs: ["Captain Concierge"] },
  e2: { pages: ["ch4.05event2allhan00"], scene: "upper", audio: ["Cascade Faults"] },
  e3: { pages: ["ch4.05event3conver00"], scene: "lower", audio: ["The Drift"] },
  fragment: { pages: ["ch4.05dplanarfragm00"], scene: "fragment", audio: ["Planar Fragment"] },
  d1: { pages: ["ch4.05d1slipperysl00"], scene: "fragment", audio: ["Burning Rockslide"] },
  d2: { pages: ["ch4.05d2lavaflow0000"], scene: "fragment", audio: ["Lava Flow"], loot: ["Thermatrod Loot"] },
  d3: { pages: ["ch4.05d3gravitywel00"], scene: "fragment", loot: ["Elemental Opals"] },
  caldera: { pages: ["ch4.05eventexplosi00"], scene: "fragment", audio: ["Planar Fragment"] },
  reciprocity: { pages: ["ch4.05reciprocity000"], scene: "reciprocity", audio: ["Nova Rush Under Attack"], npcs: ["Vanyra Voshin"], shows: ["amaranth"] },
  e4: { pages: ["ch4.05event4finalo00"], scene: "upper", audio: ["Nova Rush Under Attack"] },
  e5: { pages: ["ch4.05eventfaceoff00"], scene: "upper", npcs: ["Vanyra Voshin"], loot: ["Face Off Loot"] },
  capers: { pages: ["ch4.05cosmiccapers00"], scene: "capers", audio: ["Nova Rush Under Attack"], npcs: ["Opa Zari"], loot: ["Opa's Impressed Gift"] },
  defiance: { pages: ["ch4.05thedefiance000"], audio: ["The Defiance"], npcs: ["Opa Zari"], shows: ["defiance"] },
  draught: { pages: ["ch4.05driftersdrau00"], scene: "draught", audio: ["Drifter's Draught", "Bar Music"], npcs: ["Opa Zari", "Afaella"] },
  ch4end: { pages: ["ch4.05concludingth00"], audio: ["The Drift"], npcs: ["Cloud Nine"] },

  silent: { pages: ["ch5.06robbingtheba00", "ch5.06silentrunnin00"], scene: "approach", audio: ["Nova Rush Under Attack"],
    npcs: ["Captain Concierge"], shows: ["barrow"] },
  alert: { pages: ["ch5.06silentrunnin00"], scene: "aux", audio: ["Red Alert"], macros: ["prelim"] },
  fracture: { pages: ["ch5.06silentrunnin00"], npcs: ["Captain Concierge"] },
  freefall: { pages: ["ch5.06freefalling000"], audio: ["Barrow"] },
  turrets: { pages: ["ch5.06turretdefens00"], scene: "turrets", audio: ["Barrow"], shows: ["shredskin"] },
  door: { pages: ["ch5.06auxiliaryres00", "ch5.06eauxiliaryre00"], scene: "aux", audio: ["Barrow"] },
  reinforce: { pages: ["ch5.06reinforcemen00"], scene: "aux" },
  rf1: { pages: ["ch5.06event1welcom00"], scene: "aux" },
  rf2: { pages: ["ch5.06event2junior00"], scene: "aux" },
  rf3: { pages: ["ch5.06event3ghostl00"], scene: "aux" },
  E1: { pages: ["ch5.06e1loadingdoc01"], scene: "aux", audio: ["Barrow Facility"], macros: ["decon"], loot: ["Loading Dock"] },
  E2: { pages: ["ch5.06e2centralhal00"], scene: "aux", shows: ["hive"] },
  E3: { pages: ["ch5.06e3morticlab000"], scene: "aux", loot: ["Mortic Lab"] },
  E4: { pages: ["ch5.06e4necrotechl00"], scene: "aux", loot: ["Necrotech Lab"] },
  E5: { pages: ["ch5.06e5geflab000000"], scene: "aux", npcs: ["Nobrom Darameer"], loot: ["Gef Lab"] },
  E6: { pages: ["ch5.06e6lab000000000"], scene: "aux", audio: ["Force Field"], macros: ["fieldE6"], loot: ["Lab"] },
  E7: { pages: ["ch5.06e7computerce00"], scene: "aux", audio: ["Shock Grid"], macros: ["shockGrid"], loot: ["Computer Center (E7)"] },
  E8: { pages: ["ch5.06e8destroyedl00"], scene: "aux" },
  E9: { pages: ["ch5.06e9theprisone00"], scene: "aux", audio: ["Force Field"], macros: ["fieldE9"], npcs: ["Kitthaine Kitar"] },
  E10: { pages: ["ch5.06e10transport00"], scene: "aux" },
  deck: { pages: ["ch5.06researchdome00", "ch5.06fobservation00", "npc.12sanimusslayn00"], scene: "deck", audio: ["Barrow Facility", "Depressurized", "Rapid Depressurization"],
    macros: ["depress"], npcs: ["Sanimus Slayn", "Nobrom Darameer"], loot: ["Observation Deck"] },
  ending: { pages: ["ch5.06concludingth00", "ch5.06continuingth00"], audio: ["The Drift"], npcs: ["Zo!", "Wazasha Kevir", "Luwazi Elsebo"] }
};

/* ------------------------------------------------------------------ state */
const DEGREES = [["cs", "Crit"], ["s", "Success"], ["f", "Fail"], ["cf", "Crit fail"]];
const blankChase = () => ({ rounds: [[]], moves: [] });

function blankState(pcs) {
  return {
    v: 1, tab: "ch1", pcs,
    done: {},          // card key -> true
    xp: {},            // award key -> XP granted (stored, so it reverses exactly)
    flags: {},         // yes/no threads: lingered, telmarci, keycards…
    picks: {},         // one-of-several choices: spectra, brawl, kitthaine…
    counters: {},      // TRACKS key -> number
    /* Each Diaspora phase is { pcIndex: degree }; `cur` is the phase on
       screen, `maint` the phases after which they did Emergency Maintenance. */
    drift: { res: [{}, {}, {}, {}, {}, {}], cur: 0, maint: {}, seventh: null },
    /* Each chase round is an ordered list of { pc, d }; `moves` holds whether
       the pursuer advanced at the end of each finished round. */
    chases: { horde: blankChase(), caldera: blankChase() },
    trek: { lost: null, events: {} },   // event key -> successes
    cook: {},          // COOK stage -> { pcIndex: degree }
    fridge: 0,         // failed flat checks for smashing the fridge
    packets: {},       // pcIndex -> flavor packets held
    graves: { full: [], dug: {} },      // `full`: the eight graves with packets
    sabotage: null,
    door: [],          // the cargo door, in order: "s" / "f"
    alertSet: 0,       // the GM's own setting; events can only raise it
    necro: { vulnInfo: {}, vulnSec: {}, info: null, sec: null },
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
  for (const u of game.users) { if (!u.isGM) add(u.character); }
  /* Only without a party actor or assigned characters: a directory scan also
     finds eidolons and utility actors that players happen to own. */
  if (!seen.size) for (const a of game.actors) {
    if (seen.size >= MAX_PCS) break;
    if (a.hasPlayerOwner && (a.type === "character" || a.type === "PC")) add(a);
  }
  const list = [...seen.values()].slice(0, MAX_PCS);
  while (list.length < 4) list.push({ name: `PC ${list.length + 1}`, actorId: "", img: "icons/svg/mystery-man.svg" });
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
  if (!game.settings.settings.has(GGW_ID)) {
    game.settings.register(GGW_NS, GGW_KEY, { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cardFor = (key) => CARDS.find(c => c.key === key);
const awardFor = (key) => AWARDS.find(a => a.key === key);
const ALERTS = ["None", "Preliminary", "High"];

/* ----------------------------------------------------------------- engine */
class GraveWorld {
  constructor(state) { this.state = state; this.actorCache = new Map(); }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  get n() { return this.s.pcs.length; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(GGW_NS, GGW_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  toggleDone(key) { if (this.s.done[key]) delete this.s.done[key]; else this.s.done[key] = true; this.touch(); }
  toggleFlag(key) { if (this.s.flags[key]) delete this.s.flags[key]; else this.s.flags[key] = true; this.touch(); }
  pick(key, v) { if (this.s.picks[key] === v) delete this.s.picks[key]; else this.s.picks[key] = v; this.touch(); }
  need(track) { const T = TRACKS[track]; return typeof T.need === "function" ? T.need(this.n) : T.need; }
  bump(track, by) {
    const was = this.s.counters[track] ?? 0, need = this.need(track);
    const v = Math.max(0, Math.min(Math.max(need, TRACKS[track].cap ?? need), was + by));
    this.s.counters[track] = v;
    if (v >= need && was < need) { ui.notifications.info(`${TRACKS[track].name} — ${need}.`); this.log(`${TRACKS[track].name}: ${need}.`); }
    this.touch();
  }

  /* ----- the XP ledger ----- */
  get xpTotal() { return Object.values(this.s.xp).reduce((n, v) => n + (Number(v) || 0), 0); }
  get level() { return 1 + Math.floor(this.xpTotal / LEVEL_AT); }
  awardThreat(a) { return a.threatFn ? a.threatFn(this) : a.threat; }
  awardValue(a) {
    if (a.foes) return foesXp(FOES[a.foes], a.pl);
    if (a.threat || a.threatFn) return THREAT_XP[this.awardThreat(a)] ?? 0;
    return a.xp;
  }
  awardGate(a) { return a.gate ? a.gate(this) : null; }
  toggleXp(key) {
    const a = awardFor(key);
    if (!a) return;
    const before = this.level;
    if (this.s.xp[key] != null) {
      delete this.s.xp[key];
    } else {
      const why = this.awardGate(a);
      if (why) return ui.notifications.warn(why);
      this.s.xp[key] = this.awardValue(a);
      this.log(`+${this.s.xp[key]} XP — ${a.label}.`);
    }
    if (this.level > before) ui.notifications.info(`${this.xpTotal} XP — the party reaches level ${this.level}.`);
    this.touch();
  }

  /* ----- Diaspora Drifting ----- */
  driftPhase(i) {
    const res = this.s.drift.res[i] ?? {};
    let np = 0;
    for (const [, d] of Object.entries(res)) np = Math.max(0, np + ({ cs: 2, s: 1, f: 0, cf: -1 }[d] ?? 0));
    const tried = Object.keys(res).length > 0;
    return { np, tried, need: Math.floor(this.n / 2) + 1, pass: np > this.n / 2 };
  }
  get drift() {
    let fails = 0, streak = 0, stalled = null, last = null;
    const phases = DRIFT.map((p, i) => {
      const r = this.driftPhase(i);
      if (r.tried) {
        if (r.pass) streak = 0;
        else { fails++; streak++; }
        if (streak >= 3 && stalled == null) stalled = i;
        if (this.s.drift.maint[i]) streak = 0;
        last = i;
      }
      return r;
    });
    /* Maintenance is offered only while the second failure in a row is the
       latest phase — once a third fails, the ship has already stalled. */
    const maintDue = streak === 2 && stalled == null ? last : null;
    return { phases, fails, streak, stalled, maintDue, ship: SHIP_STATE(fails) };
  }
  driftResult(i, pc, d) {
    const res = this.s.drift.res[i] ??= {};
    if (res[pc] === d) delete res[pc]; else res[pc] = d;
    this.touch();
  }
  driftGo(i) { this.s.drift.cur = i; this.touch(); }
  driftMaint(i) { if (this.s.drift.maint[i]) delete this.s.drift.maint[i]; else this.s.drift.maint[i] = true; this.touch(); }
  driftSeventh(d) { this.s.drift.seventh = this.s.drift.seventh === d ? null : d; this.touch(); }

  /* ----- chases ----- */
  chase(key) {
    const C = CHASES[key], ch = this.s.chases[key], obs = C.obstacles, last = obs.length - 1;
    let p = 0, cp = 0, pursuer = -1, escaped = null;
    const cleared = [], bashes = [];
    ch.rounds.forEach((rd, r) => {
      for (const e of rd) {
        if (escaped) break;
        cp = Math.max(0, cp + (CHASE_DEG[e.d] ?? 0));
        if (cp >= obs[p].cp) {
          cleared.push({ round: r + 1, obstacle: obs[p].name });
          if (p === last) { escaped = r + 1; break; }
          p++; cp = 0;
        }
      }
      if (escaped || r >= ch.moves.length) return;
      if (r > 0 && ch.moves[r]) pursuer = Math.min(last, pursuer + 1);
      if (pursuer >= p) bashes.push(r + 1);
    });
    const round = ch.rounds.length;
    const outcome = escaped ? "escaped" : "running";
    return { p, cp, need: obs[p].cp, round, pursuer, escaped, cleared, bashes, outcome,
      caught: bashes.length > 0, here: !escaped && pursuer >= p };
  }
  chaseResult(key, i, d) {
    if (this.chase(key).outcome !== "running") return ui.notifications.warn("They've escaped — undo a round or reset the chase to change results.");
    const ch = this.s.chases[key], rd = ch.rounds[ch.rounds.length - 1];
    const at = rd.findIndex(e => e.pc === i);
    if (at >= 0 && rd[at].d === d) rd.splice(at, 1);
    else if (at >= 0) rd[at].d = d;
    else rd.push({ pc: i, d });
    this.touch();
  }
  /* Ends the round: the pursuer moves (or doesn't), and the next begins. */
  chaseEnd(key, moved) {
    const ch = this.s.chases[key];
    if (this.chase(key).outcome !== "running") return;
    ch.moves[ch.rounds.length - 1] = !!moved;
    ch.rounds.push([]);
    const c = this.chase(key);
    if (c.here) ui.notifications.warn(`${CHASES[key].pursuer} catches up with them.`);
    this.touch();
  }
  chaseUndo(key) {
    const ch = this.s.chases[key];
    if (ch.rounds.length > 1) { ch.rounds.pop(); ch.moves = ch.moves.slice(0, ch.rounds.length - 1); }
    else ch.rounds = [[]];
    this.touch();
  }
  chaseReset(key) { this.s.chases[key] = blankChase(); this.touch(); }

  /* ----- the trek ----- */
  get trekHours() {
    return TREK.reduce((h, e) => {
      const v = this.s.trek.events[e.key];
      return v == null ? h : h + trekHours(v);
    }, 0);
  }
  trekSet(key, v) { if (this.s.trek.events[key] === v) delete this.s.trek.events[key]; else this.s.trek.events[key] = v; this.touch(); }
  trekLost(d) { this.s.trek.lost = this.s.trek.lost === d ? null : d; this.touch(); }

  /* ----- Sabotage Soufflé ----- */
  cookStage(stage) {
    const vals = (COOK[stage]?.vals) ?? COOK_ROUND.vals, res = this.s.cook[stage] ?? {};
    return Object.values(res).reduce((n, d) => n + (vals[d] ?? 0), 0);
  }
  get cookPoints() {
    return Object.keys(COOK).reduce((n, k) => n + this.cookStage(k), 0) - (this.s.fridge ?? 0);
  }
  cookResult(stage, pc, d) {
    const res = this.s.cook[stage] ??= {};
    if (res[pc] === d) delete res[pc]; else res[pc] = d;
    this.touch();
  }
  bumpFridge(by) { this.s.fridge = Math.max(0, (this.s.fridge ?? 0) + by); this.touch(); }
  bumpPacket(pc, by) {
    const v = Math.max(0, (this.s.packets[pc] ?? 0) + by);
    if (v) this.s.packets[pc] = v; else delete this.s.packets[pc];
    this.touch();
  }
  setSabotage(k) { this.s.sabotage = this.s.sabotage === k ? null : k; this.touch(); }
  /* The book says to decide at random which eight graves hold packets. */
  hidePackets() {
    const all = Array.from({ length: 16 }, (_, i) => i + 1);
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    this.s.graves = { full: all.slice(0, 8).sort((a, b) => a - b), dug: {} };
    this.log("Hid the eight flavor packets.");
    this.touch();
  }
  /* Digging runs the module's macro for that grave, which reveals its tile.
     The macros toggle, so un-digging runs it again and fills the grave in. */
  async digGrave(n) {
    const g = this.s.graves;
    if (!g.full.length) return ui.notifications.warn("Hide the packets first.");
    if (g.dug[n]) delete g.dug[n]; else g.dug[n] = true;
    this.touch();
    const macro = game.macros?.get(GRAVE_MACROS[n - 1]);
    if (macro) await macro.execute();
  }

  /* ----- influence ----- */
  influence(key) {
    const I = INFLUENCE[key], s = this.s;
    const bonus = key === "eterrina" ? (s.flags.etHonest ? 2 : 0) : (s.flags.nbHelp ? 2 : 0);
    const pts = Math.min(I.max, (s.counters[key] ?? 0) + bonus);
    const dcMod = key === "eterrina" ? (s.flags.etLied ? 2 : 0)
      : (s.flags.nbThreat ? 2 : 0) - (s.flags.nbOffer ? 1 : 0);
    const reached = I.thresholds.filter(([n]) => pts >= n);
    const out = { pts, dcMod, reached, max: I.max };
    if (key === "nobrom") {
      out.rounds = s.flags.nbRuse ? null : this.alert >= 2 ? 2 : (this.alert >= 1 || s.flags.nbAggro) ? 3 : 4;
      out.used = s.counters.nobromRounds ?? 0;
    }
    return out;
  }

  /* ----- Barrow's alert ----- */
  get door() {
    let run = 0, fails = 0, state = "trying";
    for (const r of this.s.door) {
      if (state !== "trying") break;
      if (r === "s") { run++; if (run >= 2) state = "open"; }
      else { run = 0; fails++; if (fails >= 4) state = "detected"; }
    }
    return { run, fails, state };
  }
  doorResult(r) {
    if (this.door.state !== "trying") return ui.notifications.warn("The door's settled — undo a result to change it.");
    this.s.door.push(r);
    const d = this.door;
    if (d.state === "open") ui.notifications.info("Two in a row — the cargo door opens.");
    if (d.state === "detected") ui.notifications.warn("Four failures — an automated sensor raises the alert.");
    this.touch();
  }
  doorUndo() { this.s.door.pop(); this.touch(); }
  /* Derived, so every cause can be undone: the GM's own setting, raised to
     preliminary if they shot down Barrow's defenses, and raised one step more
     if the cargo door caught them. */
  get alertBefore() {
    let a = this.s.alertSet ?? 0;
    if (this.s.flags.shotDown) a = Math.max(a, 1);
    return a;
  }
  get alert() {
    let a = this.alertBefore;
    if (this.door.state === "detected") a = a >= 1 ? 2 : 1;
    return Math.min(2, a);
  }
  setAlert(v) { this.s.alertSet = v; this.touch(); }
  /* When reinforcements' first wave comes, by alert level. */
  get welcomeAt() { return [4, 2, 0][this.alert]; }

  /* ----- the necroserver ----- */
  toggleVuln(net, k) {
    const m = net === "info" ? this.s.necro.vulnInfo : this.s.necro.vulnSec;
    if (m[k]) delete m[k]; else m[k] = true;
    this.touch();
  }
  setNet(net, v) { this.s.necro[net] = this.s.necro[net] === v ? null : v; this.touch(); }
  get scrambled() { return !!this.s.necro.sec; }

  /* ----- the corsairs ----- */
  get opa() {
    const n = this.n, s = this.s.counters.opa ?? 0;
    /* Highest outcome first. With fewer than four PCs "half" and "one" meet,
       and the better outcome wins. */
    if (s >= n) return { key: "guests", tone: "moss", text: "Honored guests: Opa Zari invites them to the corsairs' home base, hoping for an alliance." };
    if (s >= Math.max(1, Math.floor(n / 2)) && s >= 2) return { key: "waived", tone: "moss", text: "A compelling argument: Opa Zari waives the fee if they'll trade or sell equipment at the base — the corsairs are isolated and need food and parts." };
    if (s === 1) return { key: "sortie2", tone: "ember", text: "The Cosmic Sortie — Opa Zari surrenders once two of their three allies are knocked out." };
    return { key: "sortie3", tone: "rust", text: "The Cosmic Sortie — Opa Zari surrenders only once all three allied fighters are knocked out of the fight." };
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Guilt of the Grave World reset.");
    this.touch();
  }
  rescanPCs() { this.s.pcs = detectPCs(); this.touch(); }

  /* ----- chat and actors ----- */
  async postCard(eyebrow, title, bodyHtml, tone = "slate") {
    const p = PALETTES.eox;
    const C = { ember: p.ember, moss: p.moss, slate: p.slate, plum: p.plum, gold: p.gold, rust: p.rust, muted: p.muted };
    await ChatMessage.create({
      content: `<div style="background:${p.card};color:${p.ink};border:1px solid ${p.line};border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.slate};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:${p.muted}">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: MODULE.title }
    });
  }
  postBoxed(key) {
    const c = cardFor(key);
    if (!c?.boxed) return ui.notifications.warn("Nothing to read aloud there.");
    return this.postCard(MODULE.title, c.title, `<p style="margin:0;font-style:italic">${c.boxed}</p>`, c.tone);
  }
  postChecks(key) {
    const c = cardFor(key);
    if (!c?.checks) return;
    return this.postCard(MODULE.title, c.title,
      `<ul style="margin:0;padding-left:1.1em">${c.checks.map(x => `<li style="margin-bottom:4px">${linkify(x)}</li>`).join("")}</ul>`, c.tone);
  }
  /* Players see the obstacle and how they might get past it — never how
     many points it takes or where the pursuer is. */
  postChaseObstacle(key) {
    const o = CHASES[key].obstacles[this.chase(key).p];
    return this.postCard(CHASES[key].name, o.name,
      `<p style="margin:0 0 6px;font-style:italic">${o.text}</p><p style="margin:0">${linkify(o.overcome)}</p>`, "ember");
  }
  postDriftPhase(i) {
    const p = DRIFT[i];
    return this.postCard("Diaspora Drifting", `Phase ${i + 1}: ${p.name}`,
      `<p style="margin:0 0 6px;font-style:italic">${p.text}</p><p style="margin:0">${linkify(p.overcome)}</p>`, "ember");
  }
  postTrek(key) {
    const e = TREK.find(x => x.key === key);
    return this.postCard("Over the Dead Hills", e.name, `<p style="margin:0">${linkify(e.overcome)}</p>`, "ember");
  }
  postSabotage(k) {
    const x = SABOTAGES.find(y => y.key === k);
    return this.postCard("Sabotage Soufflé", x.name, `<p style="margin:0;font-style:italic">${x.line}</p>`, "plum");
  }

  /* Statblocks live in the module's actors. An imported adventure keeps their
     ids, so try that first; otherwise look the actor up by name — this world
     first, then every Actor pack, preferring sf2e ones. */
  async openActor(id, name) {
    const want = (name ?? "").toLowerCase();
    let doc = (id && game.actors.get(id)) ?? this.actorCache.get(want) ?? (want && game.actors.find(a => a.name.toLowerCase() === want));
    if (!doc && want) {
      const packs = [...game.packs].filter(p => p.documentName === "Actor");
      const rank = (p) => /grave|sf2e|starfinder/i.test(`${p.collection} ${p.metadata?.label}`) ? 0 : 1;
      packs.sort((a, b) => rank(a) - rank(b));
      for (const pack of packs) {
        const index = await pack.getIndex();
        const hit = index.find(e => e.name?.toLowerCase() === want);
        if (hit) { doc = await pack.getDocument(hit._id); break; }
      }
    }
    if (!doc) return ui.notifications.warn(`No actor named “${name}” in this world or its compendiums. Import the ${MODULE.title} adventure.`);
    if (want) this.actorCache.set(want, doc);
    doc.sheet?.render(true);
  }

  /* ----- the module ----- */
  get imported() { return !!game.journal?.get(JOURNALS.ch1.id); }
  page(ref) {
    const { j, id } = pageRef(ref);
    return game.journal?.get(JOURNALS[j]?.id)?.pages?.get(id) ?? null;
  }
  openPage(ref) {
    const { j, id } = pageRef(ref);
    const entry = game.journal?.get(JOURNALS[j]?.id);
    if (!entry) return ui.notifications.warn(`Import the ${MODULE.title} adventure to use the journal links.`);
    if (!entry.pages?.get(id)) return ui.notifications.warn("That page isn't in the imported journal.");
    entry.sheet.render(true, { pageId: id });
  }
  openJournal(key) {
    const entry = game.journal?.get(JOURNALS[key]?.id);
    if (!entry) return ui.notifications.warn(`"${JOURNALS[key]?.name}" isn't in this world — it comes with the ${MODULE.title} adventure.`);
    entry.sheet.render(true);
  }
  /* Shows a page — or a whole journal — to every player, whatever its
     ownership; the Art Gallery is LIMITED to players by default. */
  async show(doc, what) {
    const J = foundry.documents?.collections?.Journal ?? globalThis.Journal;
    if (!J?.show) return ui.notifications.warn("This version of Foundry can't show a journal from a macro.");
    await J.show(doc, { force: true });
    ui.notifications.info(`Showing “${what}” to the players.`);
  }
  async showPage(ref) {
    const page = this.page(ref);
    if (!page) return ui.notifications.warn(`Import the ${MODULE.title} adventure to show its art.`);
    return this.show(page, page.name);
  }
  async showJournal(key) {
    const entry = game.journal?.get(JOURNALS[key]?.id);
    if (!entry) return ui.notifications.warn(`"${JOURNALS[key]?.name}" isn't in this world.`);
    return this.show(entry, entry.name);
  }

  /* `view` opens it for the GM alone; otherwise it's activated for everyone.
     `orig` picks the plain Paizo map over the encounter scene. */
  async openScene(key, { view = false, orig = false } = {}) {
    const def = SCENES[key];
    const scene = def && game.scenes?.get(orig ? def.orig : def.id);
    if (!scene) return ui.notifications.warn(`The "${def?.name ?? key}" scene isn't in this world — it comes with the ${MODULE.title} adventure.`);
    await (view ? scene.view() : scene.activate());
  }
  async runMacro(key) {
    const def = MOD_MACROS[key];
    const macro = game.macros?.get(def.id) ?? game.macros?.getName?.(def.name);
    if (!macro) return ui.notifications.warn(`"${def.name}" isn't in this world — it comes with the ${MODULE.title} adventure.`);
    await macro.execute();
  }

  soundState(cue) {
    const sound = game.playlists?.get(cue.pl)?.sounds?.get(cue.s);
    return sound ? { ok: true, playing: !!sound.playing } : { ok: false, playing: false };
  }
  async toggleSound(name) {
    const cue = audioBy(name);
    const pl = cue && game.playlists?.get(cue.pl);
    const sound = pl?.sounds?.get(cue.s);
    if (!sound) return ui.notifications.warn(`"${name}" isn't in this world — it comes with the ${MODULE.title} adventure.`);
    await (sound.playing ? pl.stopSound(sound) : pl.playSound(sound));
    this.render();
  }
  get anyPlaying() { return AUDIO.some(a => this.soundState(a).playing); }
  async stopAll() {
    for (const id of [PL_AMBIENCE, PL_LOOPS, PL_SFX]) {
      const pl = game.playlists?.get(id);
      if (pl && [...pl.sounds].some(s => s.playing)) await pl.stopAll();
    }
    this.render();
  }

  /* Toggles the effect on each selected token's actor: added where it's
     missing, removed where it's already there. */
  async toggleEffect(key) {
    const def = EFFECTS[key];
    const src = game.items?.get(def.id) ?? game.items?.getName?.(def.name);
    if (!src) return ui.notifications.warn(`The "${def.name}" effect isn't in this world — it comes with the ${MODULE.title} adventure.`);
    const actors = [...new Set((canvas?.tokens?.controlled ?? []).map(t => t.actor).filter(Boolean))];
    if (!actors.length) return ui.notifications.warn(`Select the token for ${def.who} first.`);
    const added = [], removed = [];
    for (const a of actors) {
      const have = a.items.find(i => i.type === "effect" && i.name === src.name);
      if (have) { await have.delete(); removed.push(a.name); }
      else { await a.createEmbeddedDocuments("Item", [src.toObject()]); added.push(a.name); }
    }
    ui.notifications.info([added.length ? `${def.name} on ${added.join(", ")}.` : "",
      removed.length ? `Removed from ${removed.join(", ")}.` : ""].join(" ").trim());
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;
const DIS = (on) => on ? "disabled" : "";
const DEG_CYCLE = [null, "cs", "s", "f", "cf"];
const DEG_SHORT = { cs: "CS", s: "S", f: "F", cf: "CF" };

class GGWApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "ggw-console", tag: "div", classes: ["ggw-console"],
    position: { width: 960, height: "auto" },
    window: { title: "Guilt of the Grave World", icon: "fa-solid fa-skull", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "ggw-console", classes: ["ggw-console"], title: "Guilt of the Grave World",
      width: 960, height: "auto", resizable: true
    });
  }
  get title() { return "Guilt of the Grave World"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="ggw-root">${this.markup()}</div>`);
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
    const body = s.tab === "ledger" ? this.ledgerTab(ro)
      : s.tab === "table" ? this.tableTab()
      : CARDS.filter(c => c.tab === s.tab).map(c => this.card(c, ro)).join("");
    return `${this.styles()}
      <div class="ggw">
        ${this.header(ro)}
        ${t.imported ? "" : `<p class="banner"><i class="fa-solid fa-circle-info"></i>
          The ${MODULE.title} adventure isn't imported into this world, so the journal, scene, audio, macro, portrait, and effect buttons have nothing to open. Import it from the module's compendium; everything else works without it.</p>`}
        <nav class="tabs">
          ${TABS.map(x => `<button type="button" class="tab ${s.tab === x.key ? "on" : ""}" style="--tt:var(--${x.tone})" data-act="tab" data-k="${x.key}">
            <b><i class="fa-solid ${x.icon}"></i> ${x.label}</b><small>${x.sub}</small></button>`).join("")}
        </nav>
        ${body}
      </div>`;
  }

  header(ro) {
    const t = this.t, s = t.s, d = t.drift;
    const lamp = (on, label, title, tone = "moss") =>
      `<span class="lamp ${on ? "lit" : ""}" style="--lt:var(--${tone})" title="${esc(title)}"><i class="fa-solid fa-circle"></i>${label}</span>`;
    const driftDone = d.phases.filter(p => p.tried).length;
    return `
      <header class="topbar">
        <div class="lamps">
          ${lamp(driftDone > 0, driftDone ? d.ship.label : "Ship", `Diaspora Drifting — ${d.fails} failed phase${d.fails === 1 ? "" : "s"}. Sets the ship's condition against the Amaranth.`, d.ship.tone)}
          ${lamp(!!s.flags.telmarci, "Telmarci", "Telmarci is safe — living elebrian genetic material to unlock the station's files")}
          ${lamp(!!s.picks.spectra, s.picks.spectra === "fought" ? "Spectra fought" : s.picks.spectra === "peaceful" ? "Spectra at peace" : "Spectra",
            "How the spectra parted — ±1 status with Opa Zari", s.picks.spectra === "fought" ? "rust" : "moss")}
          ${lamp((s.counters.magnetite ?? 0) >= 2, "Magnetite", "They worked out the planar magnetite can tow the asteroid — +2 item bonus binding the tethers on Barrow", "gold")}
          ${lamp(t.alert > 0, `Alert: ${ALERTS[t.alert]}`, "Barrow's alert level", t.alert >= 2 ? "rust" : "ember")}
          ${lamp(t.scrambled, "Comms scrambled", "The necroserver's security network is theirs — alerts and reinforcements are over", "plum")}
        </div>
        <div class="xpbox" title="XP total — every ${LEVEL_AT} is a level">
          <span>XP · level ${t.level}</span><b>${t.xpTotal}</b>
        </div>
        <button type="button" class="say" data-act="rescan" title="Re-detect the party" ${DIS(ro)}><i class="fa-solid fa-users"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset the adventure" ${DIS(ro)}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  /* ---------------------------------------------------------- generic card */
  card(c, ro) {
    const t = this.t, done = !!t.s.done[c.key];
    const level = c.levelFn ? c.levelFn(t) : c.level;
    const foes = c.foesFn ? c.foesFn(t) : c.foes;
    /* A finished scene folds down to its title bar — a chapter runs to twenty
       cards, and the one in play shouldn't be buried under the ones behind it. */
    if (done) return `
      <section class="panel done" style="--tone:var(--${c.tone})">
        <h3>${c.eid ? `<span class="eid">${c.eid}</span>` : ""}${c.title}
          ${c.sub ? `<small>${c.sub}</small>` : ""}
          ${(c.xp ?? []).some(k => t.s.xp[k] != null) ? `<span class="pip">${(c.xp ?? []).reduce((n, k) => n + (t.s.xp[k] ?? 0), 0)} XP</span>` : ""}
          <button type="button" class="ghost sm reopen" data-act="done" data-k="${c.key}" ${DIS(ro)}>Reopen</button>
        </h3>
      </section>`;
    return `
      <section class="panel ${done ? "done" : ""}" style="--tone:var(--${c.tone})">
        <h3>${c.eid ? `<span class="eid">${c.eid}</span>` : ""}${c.title}
          ${c.sub ? `<small>${c.sub}</small>` : ""}
          ${level ? `<span class="lvl">${level}</span>` : ""}
          ${c.boxed ? `<button type="button" class="say" data-act="postboxed" data-k="${c.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>` : ""}
        </h3>
        ${this.modRow(c.key)}
        ${c.boxed ? `<p class="boxed">${c.boxed}</p>` : ""}
        ${(c.text ?? []).map(x => `<p class="text">${hl(x)}</p>`).join("")}
        ${c.qa ? `<div class="qa">${c.qa.map(([q, a]) => `<p><b>${q}</b> “${a}”</p>`).join("")}</div>` : ""}
        ${this.npcRow(LINKS[c.key]?.npcs)}
        ${foes ? this.foeRow(FOES[foes]) : ""}
        ${(c.grid ?? []).map(g => this.grid(g, ro)).join("")}
        ${c.chase ? this.chaseWidget(c.chase, ro) : ""}
        ${c.influence ? this.influenceWidget(c.influence, ro) : ""}
        ${c.widget ? this[`w_${c.widget}`](ro) : ""}
        ${c.counters ? c.counters.map(([k, label]) => this.counter(k, ro, label)).join("") : ""}
        ${c.flags ? `<div class="btnrow">${c.flags.map(f => this.flagBtn(f, ro)).join("")}</div>` : ""}
        ${c.pick ? this.pickRow(c.pick, ro) : ""}
        ${c.checks ? `<div class="checkhead"><span class="subhead inline">Checks</span>
          <button type="button" class="say" data-act="postchecks" data-k="${c.key}" title="Post these checks to chat as rollable links"><i class="fa-solid fa-dice-d20"></i></button></div>
          <ul class="checks">${c.checks.map(x => `<li>${hl(x)}</li>`).join("")}</ul>` : ""}
        ${c.note ? `<p class="note">${c.note}</p>` : ""}
        ${c.treasure ? `<p class="loot"><b>Treasure</b> ${hl(c.treasure)}</p>` : ""}
        ${this.lootRow(LINKS[c.key])}
        ${c.xp ? `<div class="ticks">${c.xp.map(k => this.xpTick(k, ro)).join("")}</div>` : ""}
        <div class="btnrow end">
          <button type="button" class="${done ? "ghost" : "primary"} sm" data-act="done" data-k="${c.key}" ${DIS(ro)}>
            ${done ? "Reopen" : "Mark done"}</button>
        </div>
      </section>`;
  }

  foeRow(list, count) {
    if (!list) return "";
    return `<div class="crew">
      ${list.map((f, i) => {
        const n = i === 0 && count != null ? count : f.n;
        const kind = f.kind === "ship" ? "starship" : f.kind ? `${f.kind} hazard` : "creature";
        const icon = f.kind === "ship" ? "fa-shuttle-space" : f.kind ? "fa-triangle-exclamation" : "fa-skull";
        return `<button type="button" class="mon ${f.kind === "ship" ? "ship" : ""}" data-act="actor" data-id="${f.id}" data-k="${esc(f.name)}" title="Open the module's ${esc(f.name)}">
          <i class="fa-solid ${icon}"></i>${n > 1 ? `${n} × ` : ""}${f.name}
          <em>${kind}${f.level != null ? ` ${f.level}` : ""}</em></button>`;
      }).join("")}
    </div>`;
  }

  /* The card's way into the module: its pages, scene, sound, macros,
     effects, and things to show. Nothing here without the adventure. */
  modRow(key) {
    const t = this.t, L = LINKS[key];
    if (!L || !t.imported) return "";
    const pages = (L.pages ?? []).map(ref => ({ ref, p: t.page(ref) })).filter(x => x.p);
    const sc = L.scene && SCENES[L.scene];
    const bits = [
      ...pages.map(({ ref, p }) => `<button type="button" class="lnk" data-act="page" data-k="${ref}" title="Open in the ${esc(MODULE.title)} journal"><i class="fa-solid fa-book-open"></i>${esc(p.name)}</button>`),
      sc ? `<span class="lgrp"><button type="button" class="lnk scn" data-act="scene" data-k="${L.scene}" title="Activate for everyone — ${esc(sc.note)}"><i class="fa-solid fa-map"></i>${esc(sc.name)}</button><button type="button" class="lnk ico" data-act="viewscene" data-k="${L.scene}" title="View it yourself without moving the players"><i class="fa-solid fa-eye"></i></button></span>` : "",
      ...(L.audio ?? []).map(n => this.soundBtn(n)),
      ...(L.macros ?? []).map(k => `<button type="button" class="lnk mac" data-act="macro" data-k="${k}" title="${esc(MOD_MACROS[k].note)}"><i class="fa-solid fa-wand-magic-sparkles"></i>${esc(MOD_MACROS[k].name)}</button>`),
      ...(L.effects ?? []).map(k => `<button type="button" class="lnk eff" data-act="effect" data-k="${k}" title="Add to — or remove from — the selected token: ${esc(EFFECTS[k].who)}"><i class="fa-solid fa-person-rays"></i>${esc(EFFECTS[k].name)}</button>`),
      ...(L.shows ?? []).map(k => `<button type="button" class="lnk hnd" data-act="showpage" data-k="${SHOWS[k].page}" title="Show the Art Gallery's ${esc(SHOWS[k].name)} to the players"><i class="fa-solid fa-image"></i>Show ${esc(SHOWS[k].name)}</button>`)
    ].filter(Boolean);
    return bits.length ? `<div class="modrow">${bits.join("")}</div>` : "";
  }

  soundBtn(name) {
    const cue = audioBy(name);
    if (!cue) return "";
    const st = this.t.soundState(cue);
    const what = cue.kind === "loop" ? "Loop" : cue.kind === "sfx" ? "Sound effect" : "Ambience";
    return `<button type="button" class="lnk snd ${st.playing ? "on" : ""}" data-act="sound" data-k="${esc(name)}" ${st.ok ? "" : "disabled"}
      title="${esc(st.ok ? `${what} — ${st.playing ? "stop" : "play"}` : `"${name}" isn't in this world`)}">
      <i class="fa-solid ${st.playing ? "fa-stop" : cue.kind === "loop" ? "fa-wave-square" : cue.kind === "sfx" ? "fa-bolt" : "fa-music"}"></i>${esc(name)}</button>`;
  }

  npcRow(list) {
    if (!list?.length) return "";
    const imported = this.t.imported;
    return `<div class="crew">
      ${list.map(n => `<span class="lgrp">
        ${NPCS[n].id ? `<button type="button" class="npc" data-act="actor" data-id="${NPCS[n].id}" data-k="${esc(n)}" title="Open ${esc(n)}'s sheet"><i class="fa-solid fa-user"></i>${esc(n)}</button>`
          : `<span class="npc flat"><i class="fa-solid fa-user"></i>${esc(n)}</span>`}
        ${imported && NPCS[n].art ? `<button type="button" class="npc ico" data-act="showpage" data-k="${NPCS[n].art}" title="Show ${esc(n)}'s portrait to the players"><i class="fa-solid fa-image-portrait"></i></button>` : ""}
      </span>`).join("")}
    </div>`;
  }

  lootRow(L) {
    const loot = L?.loot ?? [], trk = L?.trackers ?? [];
    if (!loot.length && !trk.length) return "";
    return `<div class="crew">
      ${loot.map(n => `<button type="button" class="lootbtn" data-act="actor" data-id="${LOOT[n]}" data-k="${esc(n)}" title="Open the loot actor"><i class="fa-solid fa-box-open"></i>${esc(n)}</button>`).join("")}
      ${trk.map(k => `<button type="button" class="lootbtn trk" data-act="actor" data-id="${TRACKERS[k].id}" data-k="${esc(TRACKERS[k].name)}" title="The module's tracker actor, for showing the players. The console keeps its own count."><i class="fa-solid fa-chart-simple"></i>${esc(TRACKERS[k].name)}</button>`).join("")}
    </div>`;
  }

  xpTick(key, ro) {
    const t = this.t, a = awardFor(key), got = t.s.xp[key];
    const on = got != null;
    const why = on ? null : t.awardGate(a);
    const val = on ? got : t.awardValue(a);
    const threat = (a.threat || a.threatFn) ? ` · ${t.awardThreat(a).toLowerCase()}` : a.foes ? " · by level" : "";
    return `<button type="button" class="tick xp ${on ? "on" : ""} ${why ? "gated" : ""}" data-act="xp" data-k="${key}"
      ${DIS(ro || why)} title="${esc(why ?? (on ? "Granted — click to take it back" : "Grant this award"))}">
      <i class="fa-solid ${on ? "fa-square-check" : "fa-square"}"></i> <span class="pip">${val} XP${threat}</span> ${a.label}</button>`;
  }

  counter(track, ro, label) {
    const t = this.t, need = t.need(track), v = t.s.counters[track] ?? 0;
    const pips = need <= 12 ? Array.from({ length: need }, (_, i) => `<span class="pipdot ${i < v ? "on" : ""}"></span>`).join("") : "";
    return `<div class="counter">
      <span class="clabel">${label ?? TRACKS[track].name}</span>
      <button type="button" class="qbtn" data-act="bump" data-k="${track}" data-n="-1" ${DIS(ro || v === 0)}>−</button>
      <span class="pips">${pips}</span>
      <button type="button" class="qbtn" data-act="bump" data-k="${track}" data-n="1" ${DIS(ro || v >= need)}>+1</button>
      <button type="button" class="qbtn wide" data-act="bump" data-k="${track}" data-n="2" ${DIS(ro || v >= need)} title="A critical success counts as two">+2</button>
      <b>${v} of ${need}</b>
    </div>`;
  }

  flagBtn([key, on, off, tone], ro) {
    const v = !!this.t.s.flags[key];
    return `<button type="button" class="opt ${v ? `on ${tone === "rust" ? "bad" : "good"}` : ""}" data-act="flag" data-k="${key}" ${DIS(ro)}>
      <i class="fa-solid ${v ? "fa-square-check" : "fa-square"}"></i> ${v || !off ? on : off}</button>`;
  }

  pickRow(P, ro) {
    const v = this.t.s.picks[P.key];
    return `<div class="btnrow">
      ${P.opts.map(([k, label, tone]) => `<button type="button" class="opt ${tone ?? ""} ${v === k ? "on" : ""}" data-act="pick" data-k="${P.key}" data-v="${k}" ${DIS(ro)}>${label}</button>`).join("")}
    </div>
    ${v && P.text?.[v] ? `<p class="${P.opts.find(o => o[0] === v)?.[2] === "bad" ? "danger" : "bonus"}">${hl(P.text[v])}</p>` : ""}`;
  }

  degButtons(act, attrs, cur, ro, labels, extra = "") {
    return DEGREES.map(([d, label]) => `<button type="button" class="opt sm deg-${d} ${cur === d ? "on" : ""}" data-act="${act}" ${attrs} data-d="${d}" ${DIS(ro)}>${labels?.[d] ?? label}</button>`).join("") + extra;
  }

  pcCell(pc) {
    return pc.actorId
      ? `<button type="button" class="cn" data-act="sheet" data-id="${pc.actorId}" title="Open ${esc(pc.name)}'s sheet">${esc(pc.name)}</button>`
      : `<span class="cn">${esc(pc.name)}</span>`;
  }
  pcRows(fn) {
    return `<div class="pcrows">${this.t.s.pcs.map((pc, i) => `<div class="pcrow">
      <img src="${esc(pc.img)}" alt="">${this.pcCell(pc)}${fn(pc, i)}</div>`).join("")}</div>`;
  }

  /* ------------------------------------------------------- generic widgets */
  grid(stage, ro) {
    const t = this.t, G = COOK[stage], res = t.s.cook[stage] ?? {}, sum = t.cookStage(stage);
    return `<div class="widget">
      <div class="ohead"><span class="pip">Cooking Points</span> <b>${G.name}</b> <span class="lvl">${sum >= 0 ? "+" : ""}${sum}</span></div>
      <p class="dcs sm">${hl(G.note)}</p>
      ${this.pcRows((pc, i) => `<span class="ord"></span><div class="res">${this.degButtons("cook", `data-k="${stage}" data-i="${i}"`, res[i], ro, G.labels)}</div>`)}
    </div>`;
  }

  chaseWidget(key, ro) {
    const t = this.t, C = CHASES[key], c = t.chase(key), obs = C.obstacles, o = obs[c.p];
    const ch = t.s.chases[key], rd = ch.rounds[ch.rounds.length - 1], running = c.outcome === "running";
    const lane = obs.map((x, i) => {
      const cls = c.escaped || i < c.p ? "past" : i === c.p ? "here" : "";
      return `<div class="lanecell ${cls} ${i === c.pursuer ? "foe" : ""}" title="${esc(x.name)} — ${x.cp} Chase Points">
        <span class="lname">${x.name}</span>
        <span class="lmarks">${!c.escaped && i === c.p ? `<i class="fa-solid fa-person-running" title="The party"></i>` : ""}${i === c.pursuer ? `<i class="fa-solid ${C.icon}" title="${esc(C.pursuer)}"></i>` : ""}</span>
        <span class="lcp">${!c.escaped && i === c.p ? `${c.cp}/${x.cp}` : x.cp}</span>
      </div>`;
    }).join("");
    const where = c.pursuer < 0 ? `${C.pursuer} hasn't reached the first obstacle.` : `${C.pursuer} is at <b>${obs[c.pursuer].name}</b>.`;
    const status = c.escaped ? `<p class="bonus">Escaped in round ${c.escaped}. ${C.escaped}</p>`
      : `<p class="note">Round ${c.round}. ${c.round === 1 ? C.first : where}</p>`;
    return `<div class="widget">
      <div class="lane" style="grid-template-columns:repeat(${obs.length}, 1fr)">${lane}</div>
      ${status}
      ${c.here ? `<p class="danger">${hl(C.bash)}</p>` : ""}
      ${c.caught && !c.escaped ? `<p class="note">${C.caught}</p>` : ""}
      ${running ? `<div class="obsnow">
        <div class="ohead"><span class="pip">obstacle ${c.p + 1}</span> <b>${o.name}</b> <span class="lvl">${o.cp} Chase Points</span>
          <button type="button" class="say" data-act="postchase" data-k="${key}" title="Post this obstacle to chat (no points, no pursuer)"><i class="fa-solid fa-comment"></i></button></div>
        <p class="text">${o.text}</p>
        <p class="dcs sm">${hl(o.overcome)}</p>
        <p class="hint">Unlisted skills: DC ${C.other}. A cinematic description may earn +1 circumstance.</p>
      </div>
      <div class="subhead">Round ${c.round} — results in turn order</div>
      ${this.pcRows((pc, i) => {
        const e = rd.find(x => x.pc === i), order = e ? rd.indexOf(e) + 1 : null;
        return `<span class="ord">${order ? `#${order}` : ""}</span><div class="res">
          ${this.degButtons("chase", `data-k="${key}" data-i="${i}"`, e?.d, ro, null,
            C.strike ? `<button type="button" class="opt sm deg-cs ${e?.d === "hit" ? "on" : ""}" data-act="chase" data-k="${key}" data-i="${i}" data-d="hit" ${DIS(ro)} title="Struck the caldera (AC 29) and hit: 2 Chase Points">Strike hit</button>` : "")}
        </div>`;
      })}` : ""}
      ${c.cleared.length ? `<p class="hint">Cleared: ${c.cleared.map(x => `${x.obstacle} (r${x.round})`).join(" · ")}</p>` : ""}
      ${running && c.round > 1 ? `<p class="hint">${C.advance}</p>` : ""}
      <div class="btnrow">
        ${running ? (c.round === 1
          ? `<button type="button" class="primary" data-act="chaseend" data-k="${key}" data-v="0" ${DIS(ro)}>End round 1</button>`
          : `<button type="button" class="primary" data-act="chaseend" data-k="${key}" data-v="1" ${DIS(ro)}>${C.move[0]}</button>
             <button type="button" class="ghost" data-act="chaseend" data-k="${key}" data-v="0" ${DIS(ro)}>${C.move[1]}</button>`) : ""}
        <span class="spacer"></span>
        <button type="button" class="ghost" data-act="chaseundo" data-k="${key}" ${DIS(ro || (c.round <= 1 && !rd.length))}>Undo round</button>
        <button type="button" class="ghost" data-act="chasereset" data-k="${key}" ${DIS(ro)}>Reset</button>
      </div>
    </div>`;
  }

  influenceWidget(key, ro) {
    const t = this.t, I = INFLUENCE[key], f = t.influence(key), s = t.s;
    const pips = Array.from({ length: I.max }, (_, i) => `<span class="pipdot ${i < f.pts ? "on" : ""}"></span>`).join("");
    const raw = s.counters[key] ?? 0;
    const toggles = key === "eterrina"
      ? [["etHonest", "An honest PC: +2 Influence"], ["etLied", "Someone lied to her: DCs +2", null, "rust"]]
      : [["nbHelp", "Offered to help his research: +2 Influence"], ["nbOffer", "Offered to take him away: DCs −1"],
         ["nbThreat", "Threatened him or failed a lie: DCs +2", null, "rust"], ["nbAggro", "Came in aggressive: 3 rounds", null, "rust"],
         ["nbRuse", "Passed as Corpse Fleet (DC 22 Deception): no limit"]];
    return `<div class="widget">
      <div class="ohead"><span class="pip">influence</span> <b>${I.name}</b> <span class="pip">${I.start}</span>
        ${f.dcMod ? `<span class="lvl">DCs ${f.dcMod > 0 ? "+" : ""}${f.dcMod}</span>` : ""}</div>
      <p class="dcs sm"><b>Discovery</b> ${hl(I.discovery)}</p>
      <p class="dcs sm"><b>Influence</b> ${hl(I.skills)}</p>
      <p class="note"><b>Resistances</b> ${I.resist} <b>Weaknesses</b> ${I.weak}</p>
      <div class="btnrow">${toggles.map(x => this.flagBtn(x, ro)).join("")}</div>
      <div class="counter">
        <span class="clabel">Influence</span>
        <button type="button" class="qbtn" data-act="bump" data-k="${key}" data-n="-1" ${DIS(ro || raw === 0)}>−</button>
        <span class="pips">${pips}</span>
        <button type="button" class="qbtn" data-act="bump" data-k="${key}" data-n="1" ${DIS(ro || f.pts >= I.max)}>+1</button>
        <button type="button" class="qbtn wide" data-act="bump" data-k="${key}" data-n="2" ${DIS(ro || f.pts >= I.max)}>+2</button>
        <b>${f.pts} point${f.pts === 1 ? "" : "s"}</b>
      </div>
      ${key === "nobrom" ? `<div class="counter">
        <span class="clabel">Rounds</span>
        <button type="button" class="qbtn" data-act="bump" data-k="nobromRounds" data-n="-1" ${DIS(ro || !f.used)}>−</button>
        <button type="button" class="qbtn" data-act="bump" data-k="nobromRounds" data-n="1" ${DIS(ro || (f.rounds != null && f.used >= f.rounds))}>+1</button>
        <b>${f.used} of ${f.rounds ?? "unlimited"}</b>
        ${f.rounds != null && f.used >= f.rounds && f.pts < 5 ? `<span class="danger inline">Out of patience — he panics.</span>` : ""}
      </div>` : ""}
      <ul class="thresh">${I.thresholds.map(([n, text]) => `<li class="${f.pts >= n ? "on" : ""}"><b>${n}</b> ${text}</li>`).join("")}</ul>
      ${key === "nobrom" ? `<div class="btnrow">${this.flagBtn(["nbJoined", "Nobrom is coming with them (7+ and an offer)"], ro || (f.pts < 7 && !s.flags.nbJoined))}</div>` : ""}
    </div>`;
  }

  /* -------------------------------------------------------- bespoke widgets */
  w_interview(ro) {
    const s = this.t.s;
    const reps = [
      ["Belenze Shadraz", "imp_belenze", "Diplomacy, Nature, Performance, or Labor Lore", "a commercial deflecting field"],
      ["Rabech Shadraz", "imp_rabech", "Athletics, Crafting, Survival, or Mining Lore", "a commercial hammer"],
      ["Helmut Navdeep", "imp_helmut", "Computers or Physical Science Lore (worshippers of the Newborn succeed automatically)", "a medpatch"],
      ["Whatzon Whatz-Gurz", "imp_whatzon", "Deception, Medicine, Society, or Legal Lore", "a commercial baton"]];
    const hired = reps.some(r => s.flags[r[1]]) || s.flags.grilled;
    return `<div class="widget">
      <div class="reps">${reps.map(([who, k, skills, gift]) => `<div class="rep ${s.flags[k] ? "on" : ""}">
        <b>${who}</b><span>${skills}</span><em>Gift to each PC who impresses: ${gift}</em>
        ${this.flagBtn([k, "Impressed", "Not yet"], ro)}</div>`).join("")}</div>
      <div class="btnrow">${this.flagBtn(["grilled", "Sat through two hours of procedures instead"], ro)}</div>
      <p class="${hired ? "bonus" : "note"}">${hired ? "They're hired." : "One impressed representative, or the two-hour grilling, gets them the job."}</p>
    </div>`;
  }

  w_drift(ro) {
    const t = this.t, d = t.drift, cur = t.s.drift.cur, p = DRIFT[cur], r = d.phases[cur], res = t.s.drift.res[cur] ?? {};
    const strip = DRIFT.map((x, i) => {
      const ph = d.phases[i];
      const cls = !ph.tried ? "" : ph.pass ? "pass" : "fail";
      return `<button type="button" class="phase ${cls} ${i === cur ? "here" : ""}" data-act="driftgo" data-i="${i}">
        <span class="lname">${i + 1}. ${x.name}</span><span class="lcp">${ph.tried ? (ph.pass ? `${ph.np} NP` : `${ph.np} NP · failed`) : "—"}</span>
        ${t.s.drift.maint[i] ? `<i class="fa-solid fa-wrench" title="Emergency Maintenance after this phase"></i>` : ""}</button>`;
    }).join("") + `<button type="button" class="phase ${t.s.drift.seventh ? "pass" : ""} ${cur === 6 ? "here" : ""}" data-act="driftgo" data-i="6">
        <span class="lname">7. Surprise Discovery</span><span class="lcp">${t.s.drift.seventh ? DEGREES.find(x => x[0] === t.s.drift.seventh)[1] : "—"}</span></button>`;
    const body = cur === 6 ? `
      <div class="obsnow">
        <div class="ohead"><span class="pip">phase 7</span> <b>Surprise Discovery</b></div>
        <p class="text">Inside, a facility is wedged between the two halves of rock, marked by a small docking port and airlock.</p>
        <p class="dcs sm">${hl("Looking out the viewports: DC 15 Arcana, DC 15 Nature, DC 15 Occultism, or DC 15 Religion, or DC 13 Mining Lore or DC 13 Physical Science Lore")}</p>
        <div class="btnrow">${DEGREES.map(([k, label]) => `<button type="button" class="opt sm deg-${k} ${t.s.drift.seventh === k ? "on" : ""}" data-act="seventh" data-d="${k}" ${DIS(ro)}>${label}</button>`).join("")}</div>
        ${{ cs: `<p class="bonus">A ritual nestled the halves around the station and fused them, leaving only the dock visible. +1 circumstance on checks to investigate A8 and A9.</p>`,
            s: `<p class="bonus">The halves were placed precisely around the station without damage — magic, surely.</p>`,
            f: `<p class="note">Nothing special stands out.</p>`,
            cf: `<p class="danger">Two asteroids hit the station long ago; it's amazing it wasn't pulverized.</p>` }[t.s.drift.seventh] ?? ""}
        <p class="hint">Scanning for life: DC 20 Computers or DC 20 Life Science Lore through the radioactive veins — inconclusive, but something moves inside, and the air is stale but breathable.</p>
      </div>` : `
      <div class="obsnow">
        <div class="ohead"><span class="pip">phase ${cur + 1}</span> <b>${p.name}</b> <span class="lvl">more than ${Math.floor(t.n / 2)} NP</span>
          <button type="button" class="say" data-act="postdrift" data-i="${cur}" title="Post this phase to chat (no points)"><i class="fa-solid fa-comment"></i></button></div>
        <p class="text">${p.text}</p>
        <p class="dcs sm">${hl(p.overcome)}</p>
        ${r.tried && !r.pass ? `<p class="danger">${p.fail}</p>` : ""}
        ${r.tried && r.pass && p.after ? `<p class="bonus">${p.after}</p>` : ""}
      </div>
      ${this.pcRows((pc, i) => `<span class="ord"></span><div class="res">${this.degButtons("drift", `data-i="${i}"`, res[i], ro)}</div>`)}
      <div class="btnrow"><b class="np">${r.np} Navigation Point${r.np === 1 ? "" : "s"}</b>
        <span class="spacer"></span>
        ${cur < 6 ? `<button type="button" class="primary" data-act="driftgo" data-i="${cur + 1}">Next phase</button>` : ""}</div>`;
    return `<div class="widget">
      <div class="phases">${strip}</div>
      ${body}
      <p class="${d.ship.tone === "rust" || d.ship.tone === "ember" ? "danger" : "note"}"><b>${d.fails} failed phase${d.fails === 1 ? "" : "s"}</b> — ${d.ship.label}. ${d.ship.text}</p>
      ${d.stalled != null ? `<p class="danger">Three failures in a row: the ship stalls out. They ping Star Citadel Theodrane for a tow and lose a handful of days to repairs.</p>` : ""}
      ${d.maintDue != null ? `<div class="btnrow"><span class="danger inline">Two failures in a row — Captain Concierge suggests Emergency Maintenance: a DC 13 check fitting the station. Success resets the count toward stalling out.</span>
        <button type="button" class="opt good" data-act="driftmaint" data-i="${d.maintDue}" ${DIS(ro)}><i class="fa-solid fa-wrench"></i> Maintenance done</button></div>` : ""}
      ${Object.keys(t.s.drift.maint).length ? `<div class="btnrow"><span class="subhead inline">Maintenance after phase</span>${Object.keys(t.s.drift.maint).map(i => `<button type="button" class="opt sm on good" data-act="driftmaint" data-i="${i}" ${DIS(ro)} title="Undo">${Number(i) + 1}</button>`).join("")}</div>` : ""}
    </div>`;
  }

  w_overrides(ro) {
    const s = this.t.s, open = s.flags.ovA8 && s.flags.ovA9;
    return `<div class="widget">
      <div class="ohead"><span class="pip">A11</span> <b>The command core's security overrides</b></div>
      <div class="btnrow">${this.flagBtn(["ovA8", "A8 override released", "A8 override locked"], ro)}${this.flagBtn(["ovA9", "A9 override released", "A9 override locked"], ro)}</div>
      ${this.counter("a9lock", ro, "A9 checks")}
      <p class="${open ? "bonus" : "note"}">${open ? "Both overrides are down: the door from A10 to the command core opens normally." : "The door to A11 stays sealed and inoperable until both are released."}</p>
      ${s.drift.seventh === "cs" ? `<p class="hint">Surprise Discovery was a critical success: +1 circumstance on the checks in A8 and A9.</p>` : ""}
    </div>`;
  }

  w_marauders(ro) {
    const t = this.t, d = t.drift, s = t.s;
    return `<div class="widget">
      <p class="${d.ship.key === "minor" || d.ship.key === "major" ? "danger" : "bonus"}"><b>Ship: ${d.ship.label}</b> (${d.fails} failed phase${d.fails === 1 ? "" : "s"}). ${d.ship.text}
        ${d.ship.key ? ` Put <b>${EFFECTS[d.ship.key].name}</b> on the ship's token.` : ""}</p>
      ${this.counter("escape", ro, "Escape Points")}
      <div class="btnrow">${this.flagBtn(["scanned", "Scanned the Amaranth — its call sign, captain, and capabilities", "Not scanned yet"], ro)}</div>
      ${this.pickRow({ key: "marauders", opts: [["escaped", "Escaped", "good"], ["won", "Defeated the Amaranth", "good"], ["rescued", "Disabled — rescued", "bad"]],
        text: { escaped: "They break away into the asteroid field. The Amaranth retreats to the nearest Drift beacon, bound for Barrow.",
          won: "Against the odds. The book means this fight to be beyond them for now — the Amaranth still returns in Chapter 4.",
          rescued: "Captain Concierge's distress call brings Ulrikka outriders moments before the killing blow. Slayn disengages and enters the Drift for Barrow." } }, ro)}
    </div>`;
  }

  w_shuttle(ro) {
    const t = this.t, s = t.s, v = s.counters.shuttle ?? 0, r = s.counters.shuttleRound ?? 0;
    return `<div class="widget hazard ${v >= 4 ? "done" : ""}">
      <div class="ohead"><span class="pip">hazard 3</span> <b>Doomed Shuttle</b> <span class="pip">complex · magical · tech · trap</span></div>
      <ul class="checks">${["DC 16 Piloting (trained) to take control and force a lower altitude",
        "DC 18 Arcana or DC 18 Thievery (trained) to counter the necroblast long enough",
        "DC 20 Perception to find the closest landing zone",
        "DC 20 Crafting (trained) to take apart the console and defuse the bomb",
        "DC 23 Religion to pray for divine intercession"].map(x => `<li>${hl(x)}</li>`).join("")}</ul>
      <p class="note">Four successes in all defeat it. A PC who succeeds gets +1 circumstance to their save against it for a round. Routine (3 actions): 2d6+4 void to everyone aboard, DC 18 basic Will. Notice the necromancy (DC 12, trained) to use Arcana.</p>
      ${this.counter("shuttle", ro, "Successes")}
      ${this.counter("shuttleRound", ro, "Rounds gone")}
      ${this.pickRow({ key: "shuttle", opts: [["landed", "Forced a hard landing", "good"], ["crashed", "The bomb went off", "bad"]],
        text: { landed: "They escape seconds before it explodes in a fireball tinged with necromantic energy. Everyone within 100 feet is thrown 10 feet, prone, 2d8 bludgeoning (DC 14 basic Reflex).",
          crashed: "Foam that smells of expired dairy fills the cabin, a force field seals the cockpit, and they crash as the bomb explodes: 1d10+6 bludgeoning to everyone (DC 18 basic Fortitude). They claw their way out." } }, ro)}
      ${v >= 4 && !s.picks.shuttle ? `<p class="bonus">Four successes — they can force the landing.</p>` : ""}
      ${r >= 4 && v < 4 && !s.picks.shuttle ? `<p class="danger">Four rounds — the bomb goes off.</p>` : ""}
    </div>`;
  }

  w_trek(ro) {
    const t = this.t, s = t.s, n = t.n, lost = s.trek.lost;
    return `<div class="widget">
      <div class="ohead"><span class="pip">before setting out</span> <b>Lost on Eox</b></div>
      <p class="dcs sm">${hl("A PC trained in Piloting or Survival: DC 16 Piloting to Navigate or DC 16 Survival to Sense Direction; others Aid with Eox Lore, Piloting, or Survival.")}</p>
      <div class="btnrow">${DEGREES.map(([k, label]) => `<button type="button" class="opt sm deg-${k} ${lost === k ? "on" : ""}" data-act="treklost" data-d="${k}" ${DIS(ro)}>${label}</button>`).join("")}</div>
      ${lost ? `<p class="${lost === "cs" || lost === "s" ? "bonus" : "note"}">${lost === "cs" ? "A floating +2 status bonus for each PC, to spend on any one check in this section." : lost === "s" ? "A floating +1 status bonus for each PC, to spend on any one check in this section." : "A loose sense of the shuttle's heading — they set off that way."}</p>` : ""}
      ${TREK.map(e => {
        const v = s.trek.events[e.key];
        return `<div class="obst ${v == null ? "" : v > 0 ? "pass" : "fail"}">
          <div class="ohead"><b>${e.name}</b> ${v != null ? `<span class="lvl">${trekHours(v)} hours</span>` : ""}
            <button type="button" class="say" data-act="posttrek" data-k="${e.key}" title="Post the checks to chat"><i class="fa-solid fa-comment"></i></button></div>
          <p class="dcs sm">${hl(e.overcome)}</p>
          <p class="hint">${e.activity}</p>
          <div class="btnrow"><span class="subhead inline">Successes</span>
            ${Array.from({ length: n + 1 }, (_, k) => `<button type="button" class="opt sm ${k ? "good" : "bad"} ${v === k ? "on" : ""}" data-act="trek" data-k="${e.key}" data-v="${k}" ${DIS(ro)}>${k}</button>`).join("")}</div>
          ${v === 0 ? `<p class="danger">${hl(e.fail)}</p>` : ""}
          ${v != null && e.loot ? `<p class="loot"><b>Found</b> ${hl(e.loot)}</p>` : ""}
        </div>`;
      }).join("")}
      <p class="bonus">${t.trekHours} hours on the trail so far.</p>
    </div>`;
  }

  w_cooktotal() {
    const t = this.t, cp = t.cookPoints;
    const parts = Object.keys(COOK).filter(k => t.s.cook[k] && Object.keys(t.s.cook[k]).length)
      .map(k => `${COOK[k].name} ${t.cookStage(k) >= 0 ? "+" : ""}${t.cookStage(k)}`);
    if (t.s.fridge) parts.push(`fridge −${t.s.fridge}`);
    return `<div class="widget cooktotal">
      <div class="big"><b>${cp}</b><span>Cooking Points</span></div>
      <p class="note">${parts.length ? `${parts.join(" · ")}.` : "Nothing scored yet."} Every stage below keeps each PC's result, so changing one changes the total.</p>
    </div>`;
  }

  w_graves(ro) {
    const t = this.t, g = t.s.graves;
    const found = Object.keys(g.dug).filter(n => g.full.includes(Number(n))).length;
    return `<div class="widget">
      <div class="btnrow">
        <button type="button" class="${g.full.length ? "ghost" : "primary"}" data-act="hidepackets" ${DIS(ro)}>
          <i class="fa-solid fa-dice"></i> ${g.full.length ? "Hide them again" : "Hide the eight packets"}</button>
        <span class="spacer"></span>
        ${g.full.length ? `<b class="np">${found} of 8 packets found</b>` : ""}
      </div>
      ${g.full.length ? `<div class="graves">${Array.from({ length: 16 }, (_, i) => {
        const n = i + 1, dug = !!g.dug[n], full = g.full.includes(n);
        return `<button type="button" class="grave ${dug ? (full ? "packet" : "surprise") : ""}" data-act="dig" data-k="${n}" ${DIS(ro)}
          title="${dug ? "Fill it back in" : `Dig grave ${n}${t.imported ? " — runs the module's Dig Grave macro" : ""}`}">
          <span>${n}</span><i class="fa-solid ${dug ? (full ? "fa-leaf" : "fa-hand-back-fist") : "fa-cross"}"></i>
          <em>${dug ? (full ? "packet" : "surprise!") : "&nbsp;"}</em></button>`;
      }).join("")}</div>
      <p class="note">A surprise — a rotting hand, a bloody fangblade, a cursed animatronic — deals 2d6 nonlethal bludgeoning, piercing, or slashing to whoever dug it (DC 13 basic Reflex).</p>` : `<p class="note">The eight are chosen at random and stay hidden from the players.</p>`}
      ${found ? `<div class="subhead">Flavor packets held (+1 item bonus to one course each)</div>
      ${this.pcRows((pc, i) => `<span class="ord"></span><div class="res">
        <button type="button" class="qbtn" data-act="packet" data-i="${i}" data-n="-1" ${DIS(ro || !t.s.packets[i])}>−</button>
        <b class="np">${t.s.packets[i] ?? 0}</b>
        <button type="button" class="qbtn" data-act="packet" data-i="${i}" data-n="1" ${DIS(ro)}>+1</button></div>`)}` : ""}
    </div>`;
  }

  w_fridge(ro) {
    const v = this.t.s.fridge ?? 0;
    return `<div class="counter">
      <span class="clabel">Fridge damaged, flat check failed</span>
      <button type="button" class="qbtn" data-act="fridge" data-n="-1" ${DIS(ro || !v)}>−</button>
      <button type="button" class="qbtn" data-act="fridge" data-n="1" ${DIS(ro)}>+1</button>
      <b>−${v} Cooking Point${v === 1 ? "" : "s"}</b>
    </div>`;
  }

  /* Six rounds by the party, one cell per PC per round. Clicking a cell
     steps it through crit, success, fail, crit fail, and back to blank. */
  w_cookrounds(ro) {
    const t = this.t, s = t.s;
    const head = COOK_ROUNDS.map(k => `<th>${COOK[k].name.replace("Round ", "R")}<small>course ${COOK[k].course}</small></th>`).join("");
    const rows = s.pcs.map((pc, i) => `<tr><td class="who">${this.pcCell(pc)}${s.packets[i] ? ` <span class="pip">+${s.packets[i]} packets</span>` : ""}</td>
      ${COOK_ROUNDS.map(k => {
        const d = s.cook[k]?.[i];
        return `<td><button type="button" class="cyc ${d ? `deg-${d}` : ""}" data-act="cookcyc" data-k="${k}" data-i="${i}" ${DIS(ro)}>${d ? DEG_SHORT[d] : "·"}</button></td>`;
      }).join("")}</tr>`).join("");
    const sums = COOK_ROUNDS.map(k => `<td class="sum">${t.cookStage(k) >= 0 ? "+" : ""}${t.cookStage(k)}</td>`).join("");
    return `<div class="widget">
      <p class="dcs sm">${hl(COOK_ROUND.note)}</p>
      <table class="cyctab"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}<tr><td class="who sum">Cooking Points</td>${sums}</tr></tbody></table>
      <p class="hint">Click a cell: CS → S → F → CF → blank. A critical success is +2, a success +1, a critical failure −1.</p>
    </div>`;
  }

  w_spinner(ro) {
    const k = this.t.s.sabotage, x = SABOTAGES.find(y => y.key === k);
    return `<div class="widget">
      <div class="btnrow"><span class="subhead inline">The wheel lands on</span>
        ${SABOTAGES.map(y => `<button type="button" class="opt ${k === y.key ? "on" : ""}" data-act="sabotage" data-k="${y.key}" ${DIS(ro)}>${y.name}</button>`).join("")}</div>
      ${x ? `<p class="boxed">${x.line} <button type="button" class="say inline" data-act="postsabotage" data-k="${x.key}" title="Zo!'s line, to chat"><i class="fa-solid fa-comment"></i></button></p>
        <p class="text">${hl(x.rule)}</p>` : ""}
    </div>`;
  }

  w_cookresult() {
    const cp = this.t.cookPoints;
    const tier = cp >= 7 ? ["bonus", "One of the show's most popular episodes ever. Recipes go viral and land in a Zo! Media deluxe cookbook; the guest judge gives special thanks."]
      : cp >= 4 ? ["note", "Entertaining but not particularly memorable. No adjustment to rewards."]
      : ["danger", "A flop on release — then an infamous blooper reel with its own fan following. Luwazi gets sick, and they're docked 20 credits for cleaning her pantsuit."];
    return `<div class="widget cooktotal">
      <div class="big"><b>${cp}</b><span>Cooking Points</span></div>
      <p class="${tier[0]}">${tier[1]}</p>
      <p class="loot"><b>Rewards</b> 500 credits and 80 XP each${cp >= 7 ? ", plus 100 credits and 60 XP for excellent cooking" : ""}. Each PC gets tactical ivory chompers${cp >= 4 ? "; with 4 or more points also the advanced version (straight from Zo!'s mouth), an advanced bone scepter shaped like a cooking spoon, and a crown set with a nourishing aeon stone" : ""}.</p>
      <p class="hint">The book's tiers overlap at 3 (“3–6” and “3 or fewer”); the console reads 3 as the flop.</p>
    </div>`;
  }

  w_aaturrets(ro) {
    const s = this.t.s;
    const list = [["aaNW", "turretNW", "North-west"], ["aaNE", "turretNE", "North-east"], ["aaSW", "turretSW", "South-west"], ["aaSE", "turretSE", "South-east"]];
    const n = list.filter(x => s.flags[x[0]]).length;
    return `<div class="widget">
      <div class="turrets">${list.map(([k, mac, name]) => `<span class="lgrp">
        ${this.flagBtn([k, `${name} — off`, `${name} — armed`], ro)}
        ${this.t.imported ? `<button type="button" class="opt ico" data-act="macro" data-k="${mac}" title="${esc(MOD_MACROS[mac].name)}"><i class="fa-solid fa-wand-magic-sparkles"></i></button>` : ""}
      </span>`).join("")}</div>
      <p class="${n >= 3 ? "bonus" : n ? "note" : "danger"}">${n} of 4 disabled. ${this.takeoffText(n)}</p>
    </div>`;
  }
  takeoffText(n) {
    return n >= 3 ? "If the shuttle takes off, harmless explosions sound outside as they veer away."
      : n >= 1 ? "If the shuttle takes off, each PC takes 5d8 nonlethal bludgeoning as it's buffeted, and it barely escapes riddled with hull damage."
      : "If the shuttle takes off, each PC takes 10d8 nonlethal bludgeoning as it's destroyed, and they fall 100 feet onto spongy safety cushions that spring from the soil — no fall damage.";
  }

  w_takeoff(ro) {
    const s = this.t.s, n = ["aaNW", "aaNE", "aaSW", "aaSE"].filter(k => s.flags[k]).length;
    return `<div class="widget">
      <ul class="checks">${["DC 16 Thievery to cut the trigger wire", "DC 18 Athletics to rip the bomb out and hurl it clear",
        "A Strike against AC 20 to destroy the ignition source"].map(x => `<li>${hl(x)}</li>`).join("")}</ul>
      <p class="note">Boom! when someone starts the engine, or nobody succeeds at disabling it: 6d6 fire to everyone within 30 feet (DC 20 basic Reflex).</p>
      ${this.pickRow({ key: "bomb", opts: [["defused", "Defused — take off", "good"], ["blown", "It went off", "bad"]],
        text: { defused: `They lift off. ${n} of 4 turrets disabled: ${this.takeoffText(n)}`,
          blown: "The cockpit burns out and the engine is destroyed under a cloud of black smoke. They escort Telmarci (or carry them) back to the hovercar on foot, through stray laser fire and any drones they didn't deal with." } }, ro)}
    </div>`;
  }

  w_magnetite(ro) {
    const v = this.t.s.counters.magnetite ?? 0;
    return `<div class="widget">
      <div class="ohead"><span class="pip">16 hours of downtime</span> <b>Studying the planar magnetite</b></div>
      <p class="dcs sm">${hl("DC 19 Crafting, DC 19 Mining Lore, DC 19 Nature, or DC 19 Physical Science Lore")}</p>
      ${this.counter("magnetite", ro, "Successes")}
      ${v >= 1 ? `<p class="bonus">It can generate gravimetric fields in a local region of space, tethering objects of different sizes.</p>` : ""}
      ${v >= 2 ? `<p class="bonus">Connected to the engines, it's a remote towing rig — enough to drag the asteroid station through the Drift. +2 item bonus binding the tethers on Barrow.</p>` : ""}
    </div>`;
  }

  w_opa(ro) {
    const t = this.t, s = t.s, o = t.opa, sp = s.picks.spectra;
    const sortie = o.key.startsWith("sortie");
    return `<div class="widget">
      ${sp ? `<p class="${sp === "peaceful" ? "bonus" : "danger"}">Opa Zari sees the spectra's sparks on them: ${sp === "peaceful" ? "+1" : "−1"} status to every check to negotiate.</p>` : ""}
      ${this.counter("opa", ro, "Successes")}
      <p class="${o.tone === "moss" ? "bonus" : "danger"}">${o.text}</p>
      ${sortie ? `<div class="obst">
        <div class="ohead"><span class="pip">starship scene</span> <b>Cosmic Sortie</b></div>
        <p class="text">Four corsair fighters (AC 16, Fort +2, Ref +4, shields 3 regaining 3, 16 HP). Each dogfights the PC pilot (Piloting +8 against their Piloting DC; success leaves the PCs' ship off-guard) and fires its laser cannon (+6, 1d6+2 fire). Victory: defeat one or more fighters.</p>
        <p class="dcs sm">${hl("The PCs' Scan here makes the enemy off-guard (and +1 to the next gunner's attack on a crit) rather than earning Escape Points.")}</p>
        ${this.foeRow(FOES.sortie)}
        ${this.counter("fighters", ro, "Fighters out")}
        <p class="note">Beaten, Opa Zari grins and calls them winners, waives the fee, and repeats the invitation. If the corsairs win, they tow the PCs' ship home — for repairs or salvage, depending on attitudes.</p>
        ${this.flagBtn(["beatOpa", "They beat the corsairs — Opa gifts their advanced boom pistol"], ro)}
      </div>` : ""}
    </div>`;
  }

  w_silent(ro) {
    const t = this.t, s = t.s, ap = s.counters.alertPts ?? 0, ip = s.counters.infil ?? 0;
    return `<div class="widget">
      ${this.counter("infil", ro, "Infiltration")}
      ${this.counter("alertPts", ro, "Alert Points")}
      ${ap >= 8 ? `<p class="danger">Call Reinforcements at the start of next round: a cruiser (use the Amaranth's statistics). Captain Concierge warns 2 rounds before it arrives — their last chance to land in the Fracture.</p>` : ""}
      ${ip >= 6 ? `<p class="bonus">Six Infiltration Points — they can Prepare for Landing (3 actions).</p>` : ""}
      <div class="btnrow">${this.flagBtn(["shotDown", "They shot down Barrow's defenses — preliminary alert", "Slipped past without firing", "rust"], ro)}</div>
    </div>`;
  }

  w_alert(ro) {
    const t = this.t, s = t.s, a = t.alert;
    const why = [];
    if (s.flags.shotDown) why.push("they shot down Barrow's defenses");
    if (t.door.state === "detected") why.push("the cargo door's sensor caught them");
    const lv = [
      "No alarms. Event 1 comes after they explore four rooms past the loading dock.",
      "All doors in the auxiliary research center lock: DC 18 Athletics, DC 18 Computers, or DC 18 Thievery to breach. A failed attempt (or combat) outside a room gives its occupants a DC 11 flat check to hear it. Event 1 comes after two rooms. Six bonecrushers in E1.",
      "As preliminary, but the flat check is DC 5, and every occupant knows about intruders: armed and ready before initiative. Event 1 hits as they enter E2. Eight bonecrushers in E1."];
    return `<div class="widget">
      <div class="btnrow"><span class="subhead inline">Set by the GM</span>
        ${ALERTS.map((x, i) => `<button type="button" class="opt ${i === 0 ? "good" : "bad"} ${(s.alertSet ?? 0) === i ? "on" : ""}" data-act="alert" data-v="${i}" ${DIS(ro)}>${x}</button>`).join("")}</div>
      <p class="${a ? "danger" : "bonus"}"><b>${ALERTS[a]} alert.</b> ${lv[a]}</p>
      ${why.length ? `<p class="note">Raised because ${why.join(", and ")}.</p>` : ""}
      ${t.scrambled ? `<p class="bonus">They hold the necroserver's security network: Corpse Fleet comms here are scrambled, alerts are disabled, and no more reinforcements come.</p>` : ""}
    </div>`;
  }

  w_necroturrets(ro) {
    const t = this.t, s = t.s, nav = s.picks.nav;
    return `<div class="widget">
      <div class="btnrow">${this.flagBtn(["shredskins", "Everyone has their shredskin on — overcome without a roll"], ro)}</div>
      ${s.flags.shredskins ? "" : `${this.counter("turretA", ro, "Turret 1 actions lost")}${this.counter("turretB", ro, "Turret 2 actions lost")}`}
      <div class="obst">
        <div class="ohead"><b>Finding the facility</b></div>
        <p class="dcs sm">${hl("One PC (others Aid): DC 19 Piloting to Navigate or DC 19 Survival to Sense Direction")}</p>
        <div class="btnrow">${DEGREES.map(([k, label]) => `<button type="button" class="opt sm deg-${k} ${nav === k ? "on" : ""}" data-act="pick" data-k="nav" data-v="${k}" ${DIS(ro)}>${label}</button>`).join("")}</div>
        ${nav === "f" ? `<p class="danger">Wrong turns, and a facility camouflaged in plain sight: −1 status on their checks at the door.</p>` : ""}
        ${nav === "cf" ? `<p class="danger">Hours in circles, crossing a deep ravine twice: DC 19 Fortitude or fatigued for E1 (gone after a 10-minute rest), and too strained for exploration activities before entering.</p>` : ""}
        ${nav === "s" || nav === "cs" ? `<p class="bonus">They make it straight to the entrance.</p>` : ""}
      </div>
    </div>`;
  }

  w_door(ro) {
    const t = this.t, d = t.door, s = t.s;
    return `<div class="widget">
      ${s.picks.nav === "f" ? `<p class="danger">They wandered: −1 status on these checks.</p>` : ""}
      <div class="chips">${s.door.map(r => `<span class="chip ${r === "s" ? "good" : "bad"}">${r === "s" ? "✓" : "✗"}</span>`).join("") || `<span class="hint">No attempts yet.</span>`}</div>
      <div class="btnrow">
        <button type="button" class="opt good" data-act="door" data-v="s" ${DIS(ro || d.state !== "trying")}>Success</button>
        <button type="button" class="opt bad" data-act="door" data-v="f" ${DIS(ro || d.state !== "trying")}>Failure</button>
        <button type="button" class="ghost" data-act="doorundo" ${DIS(ro || !s.door.length)}>Undo</button>
        <b class="np">${d.run} in a row · ${d.fails} of 4 failures</b>
      </div>
      ${d.state === "open" ? `<p class="bonus">The cargo door opens into E1 without delay.</p>` : ""}
      ${d.state === "detected" ? `<p class="danger">Detected: the sensor puts the surface on preliminary alert — high, if it already was. The E1 occupants open the outer door to investigate and let them in by accident.</p>` : ""}
    </div>`;
  }

  w_reinforce(ro) {
    const t = this.t, rooms = t.s.counters.rooms ?? 0, at = t.welcomeAt;
    const next = t.scrambled ? `<p class="bonus">Comms are scrambled — no more reinforcements.</p>`
      : t.s.done.rf1 ? `<p class="note">Event 1 is done. Event 2 comes if they rest longer than an hour; Event 3 after another hour of rest once they know reinforcements are coming.</p>`
      : at === 0 ? `<p class="danger">High alert: Event 1 hits as they enter E2. ${t.alert >= 2 ? "Event 2 when they've explored all of area E or after 30 minutes, whichever is first; Event 3 30 minutes after that." : ""}</p>`
      : rooms >= at ? `<p class="danger">${rooms} rooms explored — Event 1 now.</p>`
      : `<p class="note">${ALERTS[t.alert]} alert: Event 1 after ${at} rooms past the loading dock — ${at - rooms} to go.</p>`;
    return `<div class="widget">${this.counter("rooms", ro, "Rooms explored")}${next}</div>`;
  }

  w_dock() {
    const t = this.t, n = [4, 6, 8][t.alert];
    return `<div class="widget">
      ${this.foeRow(FOES.dock, n)}
      <p class="${t.alert ? "danger" : "note"}">${ALERTS[t.alert]} alert: <b>${n} bonecrushers</b>${t.alert >= 2 ? ", all with weapons ready" : ""}.</p>
    </div>`;
  }

  w_necroserver(ro) {
    const t = this.t, s = t.s, N = s.necro, dc = 18 + 2 * t.alert;
    const code = (t.influence("nobrom").pts >= 5);
    const vulnI = [["pw", "Guess ancient passwords — DC 18 Eox Lore or DC 18 Society", 1],
      ["cred", "Obtain or clone Corpse Fleet credentials — DC 22 Computers or Deception", 2],
      ["ward", "Unravel the magical wards — DC 25 Arcana, DC 25 Nature, DC 25 Occultism, or DC 25 Religion", 3]];
    const vulnS = [["virus", "Introduce a magical virus — DC 22 Arcana, DC 22 Nature, DC 22 Occultism, or DC 22 Religion", 2],
      ["drone", "Capture or hack a necrodrone for data — DC 25 Computers or DC 25 Thievery", 3]];
    const less = (list, m) => list.reduce((n, [k, , v]) => n + (m[k] ? v : 0), 0);
    const dcI = 25 - less(vulnI, N.vulnInfo), dcS = 25 - less(vulnS, N.vulnSec);
    const vbtn = (net, [k, label, v], m) => `<button type="button" class="tick ${m[k] ? "on" : ""}" data-act="vuln" data-k="${net}" data-v="${k}" ${DIS(ro)}>
      <i class="fa-solid ${m[k] ? "fa-square-check" : "fa-square"}"></i> <span class="pip">−${v}</span> ${hl(label)}</button>`;
    return `<div class="widget">
      <div class="obst ${s.flags.keycards || (s.counters.e7door ?? 0) >= 2 ? "pass" : ""}">
        <div class="ohead"><b>The door</b> <span class="lvl">${ALERTS[t.alert].toLowerCase()} alert</span></div>
        ${s.flags.keycards ? `<p class="bonus">They have the E6 scientists' keycards — it unlocks without a check.</p>`
          : `<p class="dcs sm">${hl(`Two successes from: DC ${dc} Athletics to Force Open, DC ${dc} Computers to Hack the keypad, or DC ${dc} Thievery to Pick a Lock`)}${s.flags.nbJoined ? " · Nobrom's advice: +1 circumstance" : ""}</p>
             ${this.counter("e7door", ro, "Successes")}`}
      </div>
      <div class="obst ${code || s.flags.shredskins ? "pass" : ""}">
        <div class="ohead"><b>The shock grid</b></div>
        <p class="note">${code ? "Nobrom's keypad code shuts it off — no need to disable it." : s.flags.shredskins ? "Shredskins on: it detects no one and stays down." : "It activates on any living creature within 10 feet of the door. Open its actor for the disable."}</p>
      </div>
      <div class="obst ${N.info ? "pass" : ""}">
        <div class="ohead"><span class="pip">computer 4 · complex</span> <b>Information network</b> <span class="lvl">DC ${dcI} Computers</span></div>
        <div class="ticks col">${vulnI.map(v => vbtn("info", v, N.vulnInfo)).join("")}</div>
        <p class="note">Countermeasures, after 2 failures: 2d8+5 void to the hacker. Notice: DC 16 Computers or Perception. Disable: DC 22 Computers or Religion.</p>
        ${this.counter("infoFails", ro, "Failures")}
        <div class="btnrow">${this.flagBtnNet("info", "Accessed — data worth 2,000 credits to Eoxian brokers", ro)}</div>
      </div>
      <div class="obst ${N.sec ? "pass" : ""}">
        <div class="ohead"><span class="pip">computer 4 · complex</span> <b>Security network</b> <span class="lvl">DC ${dcS} Computers</span></div>
        <div class="ticks col">${vulnS.map(v => vbtn("sec", v, N.vulnSec)).join("")}</div>
        <p class="note">Countermeasures, after 2 failures or a critical failure: 2d8 void to everyone within 10 feet (DC 21 Fortitude). Notice: DC 20 Arcana or detect magic. Disable: DC 24 Computers or Arcana.</p>
        ${this.counter("secFails", ro, "Failures")}
        <div class="btnrow">
          <button type="button" class="opt good ${N.sec === "crit" ? "on" : ""}" data-act="net" data-k="sec" data-v="crit" ${DIS(ro)}>Critical success — 24 hours</button>
          <button type="button" class="opt good ${N.sec === "success" ? "on" : ""}" data-act="net" data-k="sec" data-v="success" ${DIS(ro)}>Success — 1 hour</button>
        </div>
        ${N.sec ? `<p class="bonus">Surveillance, necrodrone patrols, and the necroturrets are theirs; floor plans, entry logs, and footage; every door locks or unlocks from here except E9 (whose code they get). They can see how many creatures are in each room. Comms are scrambled: alerts end and no more reinforcements come — fewer ships on this side for the escape.</p>` : ""}
      </div>
      ${N.sec ? `<div class="obst ${s.flags.detonator ? "pass" : ""}">
        <div class="ohead"><b>Mad at Gravity</b></div>
        <p class="dcs sm">${hl("Rig a comm unit as a kill switch for the gravimetric arrays: DC 19 Computers or DC 19 Crafting. It then fires as an Interact.")}</p>
        ${this.flagBtn(["detonator", "Detonator rigged"], ro)}
        ${s.flags.detonator ? `<p class="note">Set off while still inside: a shockwave at the start of the round, then every 1d4 rounds. Every corporeal creature not flying attempts DC 20 Reflex — success clumsy 1 for a round; failure prone and clumsy 1; critical failure 1d6 bludgeoning, prone, and clumsy 2.</p>` : ""}
      </div>` : ""}
    </div>`;
  }
  flagBtnNet(net, label, ro) {
    const v = this.t.s.necro[net];
    return `<button type="button" class="opt good ${v ? "on" : ""}" data-act="net" data-k="${net}" data-v="yes" ${DIS(ro)}><i class="fa-solid ${v ? "fa-square-check" : "fa-square"}"></i> ${label}</button>`;
  }

  w_deck(ro) {
    const t = this.t, s = t.s, vials = t.influence("nobrom").pts >= 7;
    const bonus = [((s.counters.magnetite ?? 0) >= 2) && "+2 item (the magnetite as a towing rig)", s.flags.nbJoined && "+2 circumstance (Nobrom Aids)"].filter(Boolean);
    return `<div class="widget">
      ${vials ? `<div class="obst">
        <div class="ohead"><span class="pip">2 actions</span> <b>Good Gef!</b> <span class="pip">interact · manipulate</span></div>
        <p class="text">Holding one of Nobrom's vials within 30 feet of a phantom gef: spray it and attempt Deception, Diplomacy, Nature, or Survival against the gef's Will DC. Critical success, fascinated for 1 minute and no hostile actions, even if attacked; success, the same until anyone is hostile to it; failure, −1 status to its attacks until the end of its next turn.</p>
      </div>` : ""}
      <div class="obst">
        <div class="ohead"><b>Stealing it back</b> <span class="pip">about an hour before reinforcements</span></div>
        <p class="text">Any console opens the dome, no check.</p>
        <p class="dcs sm">${hl("Bring the ship into position: DC 22 Piloting to fly it remotely, or DC 25 Diplomacy or DC 25 Intimidation to command Captain Concierge")}</p>
        ${this.flagBtn(["positioned", "The ship is in position"], ro)}
        <p class="dcs sm">${hl("Bind the magnetite to the tethers — two successes: DC 22 Arcana, DC 22 Computers, DC 22 Mining Lore, DC 22 Nature, DC 22 Occultism, or DC 22 Religion")}</p>
        ${bonus.length ? `<p class="bonus">${bonus.join("; ")}.</p>` : ""}
        ${this.counter("tow", ro, "Bindings")}
        ${(s.counters.tow ?? 0) >= 2 ? `<p class="bonus">Bound. Out through the airlocks and up the access ladders on the retracted dome (or jetpacks) to their ship.</p>`
          : `<p class="note">Struggling or lingering: patrols pass overhead, scans come perilously close, until a final wave arrives — an extra fight for groups who want the challenge.</p>`}
      </div>
    </div>`;
  }

  w_ending() {
    const t = this.t, s = t.s, a = t.alert;
    return `<div class="widget">
      <p class="${a ? "danger" : "bonus"}">${a ? "They raised an alert, so fighters, cruisers, and even a few battleships gathered around the Fracture, with fighters patrolling for anomalies." : "No alerts on the way in: few Corpse Fleet ships patrol around the Fracture."}</p>
      <p class="${t.scrambled ? "bonus" : "danger"}">${t.scrambled ? "Fleet comms are hacked: the defenders are uncoordinated and unsure, and avoid engaging." : "The defenders react fast as they lift off, firing from every angle."}</p>
      ${s.flags.detonator ? `<p class="bonus">The detonator: the Fracture's tethers blow in a magnificent explosion, and the continent-sized rock tears at Barrow's surface — secondary explosions all over the shipyards.</p>` : ""}
      <p class="note">The more disorganized the defenders were when they left, the fewer ships follow them into the Drift.</p>
    </div>`;
  }

  /* --------------------------------------------------------------- ledger */
  ledgerTab(ro) {
    const t = this.t, s = t.s, xp = t.xpTotal, into = xp % LEVEL_AT;
    const chapter = (n) => AWARDS.filter(a => a.ch === n);
    const sum = (n) => chapter(n).reduce((m, a) => m + (s.xp[a.key] ?? 0), 0);
    const d = t.drift, eter = t.influence("eterrina"), nob = t.influence("nobrom");
    const threads = [
      ["Ship against the Amaranth", d.phases.some(p => p.tried) ? `${d.ship.label} — ${d.fails} failed phase${d.fails === 1 ? "" : "s"}` : null, "Diaspora Drifting"],
      ["Malicious Marauders", { escaped: "Escaped", won: "Defeated the Amaranth", rescued: "Rescued by Ulrikka outriders" }[s.picks.marauders], "Ch 1"],
      ["Pact Port", s.flags.lingered ? "Lingered — a fourth rigor mortic" : null, "Hanging Around"],
      ["The shuttle", { landed: "Forced a hard landing", crashed: "Crashed in the explosion" }[s.picks.shuttle], "First Class Disaster"],
      ["Lost on Eox", { cs: "Floating +2 each", s: "Floating +1 each", f: "A loose heading", cf: "A loose heading" }[s.trek.lost], "Over the Dead Hills"],
      ["Eterrina", eter.pts ? `${eter.pts} Influence${eter.pts >= 8 ? " — the barn and her rifle" : eter.pts >= 6 ? " — directions" : ""}` : null, "Undead Reckoning"],
      ["Zo! Media", s.flags.signed ? "Signed" : null, "Smile, You're on Camera!"],
      ["Sabotage Soufflé", Object.keys(s.cook).length ? `${t.cookPoints} Cooking Points` : null, "Ch 3"],
      ["Telmarci", s.flags.telmarci ? (s.flags.bullied ? "Rescued — frightened 2" : "Rescued") : null, "C7"],
      ["The getaway", { defused: `Took off — ${["aaNW", "aaNE", "aaSW", "aaSE"].filter(k => s.flags[k]).length} turrets down`, blown: "Shuttle destroyed — on foot" }[s.picks.bomb], "C10"],
      ["The spectra", { peaceful: "Peaceful — +1 with Opa Zari", fought: "Fought — −1 with Opa Zari" }[s.picks.spectra], "Event 3"],
      ["Planar magnetite", (s.counters.magnetite ?? 0) ? ((s.counters.magnetite ?? 0) >= 2 ? "A towing rig — +2 on Barrow" : "Generates gravimetric fields") : null, "Explosive Caldera"],
      ["Opa Zari", s.counters.opa != null ? t.opa.key.replace("sortie3", "Sortie (3 allies)").replace("sortie2", "Sortie (2 allies)").replace("waived", "Fee waived").replace("guests", "Honored guests") : null, "Cosmic Capers"],
      ["The Defiance", { talked: "Talked the brawl down", brawl: "A fair brawl — friends", lethal: "Lethal force — asked to leave" }[s.picks.brawl], "Drifter's Draught"],
      ["Barrow's alert", t.alert || s.flags.shotDown || s.door.length ? ALERTS[t.alert] : null, "Ch 5"],
      ["Nobrom", nob.pts ? `${nob.pts} Influence${nob.pts >= 9 ? " — ghost killer" : nob.pts >= 7 ? " — vials" : nob.pts >= 5 ? " — the shock-grid code" : ""}${s.flags.nbJoined ? ", travelling with them" : ""}` : null, "E5"],
      ["The necroserver", [s.necro.info && "information", s.necro.sec && `security (${s.necro.sec === "crit" ? "24h" : "1h"})`, s.flags.detonator && "detonator"].filter(Boolean).join(", ") || null, "E7"]
    ];
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3>Threads <small>what carries forward</small></h3>
        <div class="threads">${threads.map(([k, v, where]) => `<div class="thread ${v ? "on" : ""}"><b>${k}</b><span>${v ?? "—"}</span><em>${where}</em></div>`).join("")}</div>
      </section>
      <section class="panel" style="--tone:var(--moss)">
        <h3>XP Ledger <small>the same for every PC</small><span class="lvl">level ${t.level}</span></h3>
        <div class="xpbar"><span style="width:${into / LEVEL_AT * 100}%"></span></div>
        <p class="note">${xp} XP — level ${t.level}, ${LEVEL_AT - into} to the next. The book expects 2nd level after Chapter 1, 3rd after Chapter 2, 4th after Chapter 3, and 5th in Barrow's loading dock. Encounter XP is the threat's budget (low 60, moderate 80, severe 120); trivial encounters are worked out from their foes' levels. Each award is stored as ticked, so un-ticking takes back exactly what was given.</p>
        ${[1, 2, 3, 4, 5].map(n => `
          <div class="subhead">Chapter ${n} · ${CHAPTER_NAMES[n]} · ${sum(n)} XP</div>
          <div class="ticks col">${chapter(n).map(a => this.xpTick(a.key, ro)).join("")}</div>`).join("")}
      </section>
      ${s.log.length ? `<section class="panel"><h3>Log</h3><ul class="checks">${s.log.slice(0, 12).map(l => `<li>${esc(l)}</li>`).join("")}</ul></section>` : ""}`;
  }

  /* ---------------------------------------------------------- at the table */
  tableTab() {
    const t = this.t;
    if (!t.imported) return `<section class="panel"><h3>At the Table</h3>
      <p class="note">Everything on this tab belongs to the ${MODULE.title} module — import its adventure to use it.</p></section>`;
    const audio = (kind) => AUDIO.filter(a => a.kind === kind).map(a => this.soundBtn(a.name)).join("");
    const macro = (k) => `<div class="scenerow">
      <button type="button" class="opt" data-act="macro" data-k="${k}"><i class="fa-solid fa-wand-magic-sparkles"></i> ${esc(MOD_MACROS[k].name)}</button>
      <span>${esc(MOD_MACROS[k].note)}</span></div>`;
    const group = (title, keys) => `<div class="subhead">${title}</div><div class="scenes">${keys.map(macro).join("")}</div>`;
    return `
      <section class="panel" style="--tone:var(--slate)">
        <h3>Scenes <small>the map activates for everyone; the eye views it for you alone</small></h3>
        <div class="scenes">
          ${Object.entries(SCENES).map(([k, sc]) => `<div class="scenerow">
            <span class="lgrp">
              <button type="button" class="opt" data-act="scene" data-k="${k}"><i class="fa-solid fa-map"></i> ${esc(sc.name)}</button>
              <button type="button" class="opt ico" data-act="viewscene" data-k="${k}" title="View without moving the players"><i class="fa-solid fa-eye"></i></button>
            </span>
            <span>${esc(sc.note)}</span>
            ${sc.orig ? `<button type="button" class="ghost sm" data-act="origscene" data-k="${k}" title="Activate the plain Paizo map from PDF Maps">Paizo map</button>` : ""}
          </div>`).join("")}
        </div>
      </section>
      <section class="panel" style="--tone:var(--plum)">
        <h3>Audio <small>beds and loops repeat; effects play once</small>
          <button type="button" class="ghost sm stopall" data-act="stopall" ${t.anyPlaying ? "" : "disabled"}><i class="fa-solid fa-volume-xmark"></i> Stop all</button></h3>
        <div class="subhead">Ambience</div><div class="btnrow">${audio("bed")}</div>
        <div class="subhead">Loops</div><div class="btnrow">${audio("loop")}</div>
        <div class="subhead">Sound effects</div><div class="btnrow">${audio("sfx")}</div>
        <p class="hint">The encounter scenes start their own ambience when activated. These are for everything else, and for switching mid-scene.</p>
      </section>
      <section class="panel" style="--tone:var(--ember)">
        <h3>Module macros</h3>
        ${group("Iovan Station and Eox", ["projector", "shuttleAmb", "forcefields"])}
        ${group("Soufflé Stadium and Front Lines Frayed", ["digGrave", "createCrater", "resetCrater", "mortars", "sandbagsS", "sandbagsW", "turretNW", "turretNE", "turretSW", "turretSE"])}
        ${group("Barrow", ["prelim", "decon", "fieldE6", "shockGrid", "fieldE9", "depress"])}
        ${group("Setup", ["landing", "ring", "gradient", "rigGradient"])}
        <p class="hint">The sixteen single-grave macros are run from the Gravedigging card, one per grave.</p>
      </section>
      <section class="panel" style="--tone:var(--gold)">
        <h3>Journals</h3>
        <div class="btnrow">
          ${Object.entries(JOURNALS).map(([k, j]) => `<button type="button" class="ghost" data-act="journal" data-k="${k}"><i class="fa-solid fa-book"></i> ${esc(j.name)}</button>`).join("")}
        </div>
        <div class="btnrow">
          <button type="button" class="ghost" data-act="page" data-k="front.01adventuresum00"><i class="fa-solid fa-scroll"></i> Adventure Summary</button>
          <button type="button" class="ghost" data-act="page" data-k="front.01adventurebac00"><i class="fa-solid fa-hourglass-half"></i> Adventure Background — the truth of it</button>
          <button type="button" class="ghost" data-act="showjournal" data-k="guide" title="Show the whole Player's Guide to every player"><i class="fa-solid fa-eye"></i> Show the Player's Guide</button>
        </div>
      </section>`;
  }

  /* --------------------------------------------------------------- wiring */
  wire(root) {
    if (!root || root.dataset?.ggwWired === "1") return;
    if (root.dataset) root.dataset.ggwWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act, k = btn.dataset.k, v = btn.dataset.v, d = btn.dataset.d;
      const i = Number(btn.dataset.i), n = Number(btn.dataset.n);
      if (a === "tab") { t.s.tab = k; t.touch(); }
      else if (a === "sheet") {
        const actor = game.actors.get(btn.dataset.id);
        if (actor) actor.sheet?.render(true);
        else ui.notifications.warn("That character's actor is no longer in this world.");
      }
      else if (a === "done") t.toggleDone(k);
      else if (a === "xp") t.toggleXp(k);
      else if (a === "flag") t.toggleFlag(k);
      else if (a === "pick") t.pick(k, v);
      else if (a === "bump") t.bump(k, n);
      else if (a === "actor") t.openActor(btn.dataset.id, k);
      else if (a === "page") t.openPage(k);
      else if (a === "journal") t.openJournal(k);
      else if (a === "showpage") t.showPage(k);
      else if (a === "showjournal") t.showJournal(k);
      else if (a === "scene") t.openScene(k);
      else if (a === "viewscene") t.openScene(k, { view: true });
      else if (a === "origscene") t.openScene(k, { orig: true });
      else if (a === "macro") t.runMacro(k);
      else if (a === "sound") t.toggleSound(k);
      else if (a === "stopall") t.stopAll();
      else if (a === "effect") t.toggleEffect(k);
      else if (a === "postboxed") t.postBoxed(k);
      else if (a === "postchecks") t.postChecks(k);
      else if (a === "postchase") t.postChaseObstacle(k);
      else if (a === "postdrift") t.postDriftPhase(i);
      else if (a === "posttrek") t.postTrek(k);
      else if (a === "postsabotage") t.postSabotage(k);
      else if (a === "drift") t.driftResult(t.s.drift.cur, i, d);
      else if (a === "driftgo") t.driftGo(i);
      else if (a === "driftmaint") t.driftMaint(i);
      else if (a === "seventh") t.driftSeventh(d);
      else if (a === "chase") t.chaseResult(k, i, d);
      else if (a === "chaseend") t.chaseEnd(k, v === "1");
      else if (a === "chaseundo") t.chaseUndo(k);
      else if (a === "chasereset") t.chaseReset(k);
      else if (a === "trek") t.trekSet(k, Number(v));
      else if (a === "treklost") t.trekLost(d);
      else if (a === "cook") t.cookResult(k, i, d);
      else if (a === "cookcyc") {
        const cur = t.s.cook[k]?.[i] ?? null;
        const nextD = DEG_CYCLE[(DEG_CYCLE.indexOf(cur) + 1) % DEG_CYCLE.length];
        const res = t.s.cook[k] ??= {};
        if (nextD) res[i] = nextD; else delete res[i];
        t.touch();
      }
      else if (a === "fridge") t.bumpFridge(n);
      else if (a === "packet") t.bumpPacket(i, n);
      else if (a === "hidepackets") t.hidePackets();
      else if (a === "dig") t.digGrave(Number(k));
      else if (a === "sabotage") t.setSabotage(k);
      else if (a === "alert") t.setAlert(Number(v));
      else if (a === "door") t.doorResult(v);
      else if (a === "doorundo") t.doorUndo();
      else if (a === "vuln") t.toggleVuln(k, v);
      else if (a === "net") t.setNet(k, v);
      else if (a === "rescan") t.rescanPCs();
      else if (a === "reset") this.confirmReset();
    });
  }

  async confirmReset() {
    const title = "Reset Guilt of the Grave World?";
    const content = "<p>XP, every tracker, and every thread go back to the start.</p>";
    const D2 = foundry.applications?.api?.DialogV2;
    const ok = D2 ? await D2.confirm({ window: { title }, content })
      : globalThis.Dialog ? await Dialog.confirm({ title, content }) : true;
    if (ok) this.t.reset();
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.eox;
    return `<style>
      #ggw-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #ggw-console .window-content > * { background:transparent; }
      .ggw { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .ggw * { box-sizing:border-box; }
      .ggw button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; width:auto; margin:0; }
      .ggw button:hover:not(:disabled) { background:var(--hover); }
      .ggw button:disabled { opacity:.4; cursor:not-allowed; }
      .ggw h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.05em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
               padding-bottom:.3rem; flex-wrap:wrap; }
      .ggw h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .ggw h1, .ggw h2, .ggw h4, .ggw legend { color:var(--ink); }
      .ggw .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .ggw .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .ggw .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .ggw .panel.done { opacity:.62; padding:.35rem .6rem; margin-bottom:.35rem; }
      .ggw .panel.done h3 { margin:0; padding:0; border:0; font-size:.8rem; }
      .ggw .panel.done .reopen { margin-left:auto; }
      .ggw .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 6px; letter-spacing:.06em; font-weight:700; }
      .ggw .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .ggw .pip { font-size:.57rem; text-transform:uppercase; letter-spacing:.07em; padding:0 5px;
                 border-radius:8px; border:1px solid var(--line); color:var(--muted); white-space:nowrap; }
      .ggw .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .ggw .say.inline { margin-left:.4rem; vertical-align:middle; font-style:normal; display:inline-flex; }
      .ggw .boxed { font-size:.82rem; line-height:1.55; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; }
      .ggw .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .ggw .note { font-size:.78rem; line-height:1.45; color:var(--muted); margin:.2rem 0 .4rem; }
      .ggw .danger { font-size:.79rem; line-height:1.45; color:var(--rust); margin:.2rem 0 .4rem; font-weight:600; }
      .ggw .danger.inline { margin:0; font-size:.74rem; }
      .ggw .bonus { font-size:.79rem; line-height:1.45; font-weight:600; color:var(--moss); margin:.3rem 0 .4rem; }
      .ggw .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .ggw .loot b { color:var(--gold); }
      .ggw .dcs { font-size:.8rem; font-weight:600; margin:.2rem 0 .4rem; color:var(--slate); line-height:1.45; }
      .ggw .dcs.sm { font-size:.77rem; font-weight:500; }
      .ggw .dcs b { color:var(--ink); }
      .ggw .dc { color:var(--slate); font-weight:600; white-space:nowrap; }
      .ggw .dcs .dc { color:inherit; }
      .ggw .checkhead { display:flex; align-items:center; gap:.4rem; margin-top:.4rem; }
      .ggw .hint { font-size:.74rem; color:var(--muted); margin:.3rem 0; line-height:1.4; }
      .ggw .checks { margin:.2rem 0 .45rem; padding-left:1.1rem; font-size:.79rem; line-height:1.5; }
      .ggw .checks li { margin-bottom:.25rem; }
      .ggw .subhead { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin:.4rem 0 .25rem; }
      .ggw .subhead.inline { margin:0 .2rem 0 0; }
      .ggw .qa { font-size:.79rem; line-height:1.5; margin:.3rem 0; }
      .ggw .qa p { margin:.3rem 0; }
      .ggw .qa b { display:block; color:var(--tone, var(--moss)); }
      .ggw .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.3rem 0; }
      .ggw .btnrow.end { justify-content:flex-end; margin-bottom:0; }
      .ggw .spacer { flex:1; }
      .ggw .np { font-size:.78rem; color:var(--gold); }
      .ggw .primary { background:var(--tone, var(--slate)); border-color:var(--tone, var(--slate));
                     color:var(--paper); font-weight:700; padding:.3rem .7rem; font-size:.76rem; }
      .ggw .primary:hover:not(:disabled) { filter:brightness(1.15); background:var(--tone, var(--slate)); }
      .ggw .primary.sm, .ggw .ghost.sm { padding:.18rem .55rem; font-size:.68rem; }
      .ggw .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .ggw .opt { padding:.28rem .6rem; font-size:.75rem; }
      .ggw .opt.sm { padding:.18rem .42rem; font-size:.68rem; }
      .ggw .opt.on { background:var(--slate); border-color:var(--slate); color:var(--paper); font-weight:600; }
      .ggw .opt.on:hover:not(:disabled) { background:var(--slate); filter:brightness(1.15); }
      .ggw .opt.good.on, .ggw .opt.good.on:hover:not(:disabled) { background:var(--moss); border-color:var(--moss); }
      .ggw .opt.bad.on, .ggw .opt.bad.on:hover:not(:disabled) { background:var(--rust); border-color:var(--rust); }
      .ggw .opt.deg-cs.on, .ggw .opt.deg-cs.on:hover:not(:disabled) { background:var(--moss); border-color:var(--moss); }
      .ggw .opt.deg-s.on, .ggw .opt.deg-s.on:hover:not(:disabled) { background:var(--slate); border-color:var(--slate); }
      .ggw .opt.deg-f.on, .ggw .opt.deg-f.on:hover:not(:disabled) { background:var(--muted); border-color:var(--muted); }
      .ggw .opt.deg-cf.on, .ggw .opt.deg-cf.on:hover:not(:disabled) { background:var(--rust); border-color:var(--rust); }

      .ggw .topbar { display:flex; align-items:center; gap:.75rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .ggw .lamps { display:flex; gap:.4rem; flex-wrap:wrap; }
      .ggw .lamp { display:inline-flex; align-items:center; gap:.3rem; font-size:.68rem; text-transform:uppercase;
                  letter-spacing:.06em; color:var(--muted); border:1px solid var(--line); border-radius:10px; padding:2px 8px; }
      .ggw .lamp i { font-size:.5rem; opacity:.35; }
      .ggw .lamp.lit { color:var(--lt); border-color:var(--lt); font-weight:700; }
      .ggw .lamp.lit i { opacity:1; text-shadow:0 0 6px var(--lt); }
      .ggw .xpbox { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; }
      .ggw .xpbox span { font-size:.58rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .ggw .xpbox b { font-size:1.05rem; line-height:1; color:var(--gold); }
      .ggw .topbar .say { margin-left:0; }

      .ggw .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .ggw .tab { flex:1; padding:.3rem .2rem; font-size:.77rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .ggw .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; white-space:nowrap; }
      .ggw .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .ggw .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .ggw .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .ggw .tab.on:hover:not(:disabled) { background:var(--tt); filter:brightness(1.15); }
      .ggw .tab.on b i, .ggw .tab.on small { color:var(--paper); opacity:.85; }

      .ggw .crew { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.2rem 0 .45rem; }
      .ggw .mon { font-size:.74rem; padding:.22rem .55rem; color:var(--rust); border-color:var(--rust); }
      .ggw .mon.ship { color:var(--slate); border-color:var(--slate); }
      .ggw .mon em { color:var(--muted); font-style:normal; font-size:.66rem; }

      .ggw .widget { border:1px dashed var(--line); border-radius:3px; padding:.5rem; margin:.45rem 0; background:var(--stripe); }
      .ggw .widget.hazard.done { border-color:var(--moss); border-style:solid; }
      .ggw .ohead { display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; font-size:.82rem; margin-bottom:.2rem; }
      .ggw .ohead .say { margin-left:auto; }
      .ggw .obst { border:1px solid var(--line); border-radius:3px; padding:.45rem .5rem; margin:.4rem 0; background:var(--stripe); }
      .ggw .obst.pass { border-color:var(--moss); }
      .ggw .obst.fail { border-color:var(--rust); }
      .ggw .obsnow { border:1px solid var(--ember); border-radius:3px; padding:.45rem .5rem; margin:.45rem 0; }

      .ggw .counter { display:flex; align-items:center; gap:.4rem; margin:.35rem 0; flex-wrap:wrap; }
      .ggw .counter b { font-size:.76rem; color:var(--muted); }
      .ggw .clabel { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); min-width:6.5rem; }
      .ggw .qbtn { min-width:24px; height:22px; padding:0 .3rem; font-size:.74rem; }
      .ggw .pips { display:inline-flex; gap:3px; flex-wrap:wrap; }
      .ggw .pipdot { width:10px; height:10px; border-radius:50%; border:1px solid var(--line); display:block; }
      .ggw .pipdot.on { background:var(--tone, var(--plum)); border-color:var(--tone, var(--plum)); box-shadow:0 0 6px var(--tone, var(--plum)); }

      .ggw .lane { display:grid; gap:3px; margin-bottom:.4rem; }
      .ggw .lanecell, .ggw .phase { border:1px solid var(--line); border-radius:3px; padding:.25rem .3rem; display:flex; flex-direction:column;
                       gap:.15rem; min-height:58px; background:var(--card); align-items:stretch; justify-content:flex-start; text-align:left; }
      .ggw .lanecell.past { opacity:.45; }
      .ggw .lanecell.here, .ggw .phase.here { border-color:var(--ember); box-shadow:inset 0 0 0 1px var(--ember); }
      .ggw .lanecell.foe { border-color:var(--rust); }
      .ggw .lname { font-size:.62rem; line-height:1.15; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
      .ggw .lmarks { display:flex; gap:.3rem; font-size:.85rem; min-height:1rem; }
      .ggw .lmarks .fa-person-running { color:var(--ember); }
      .ggw .lmarks i:not(.fa-person-running) { color:var(--rust); }
      .ggw .lcp { font-size:.7rem; color:var(--gold); margin-top:auto; }
      .ggw .phases { display:grid; grid-template-columns:repeat(7, 1fr); gap:3px; margin-bottom:.4rem; }
      .ggw .phase { min-height:48px; }
      .ggw .phase.pass { border-color:var(--moss); }
      .ggw .phase.pass .lcp { color:var(--moss); }
      .ggw .phase.fail { border-color:var(--rust); }
      .ggw .phase.fail .lcp { color:var(--rust); }
      .ggw .phase i { font-size:.65rem; color:var(--gold); }

      .ggw .pcrows { display:flex; flex-direction:column; gap:.3rem; }
      .ggw .pcrow { display:grid; grid-template-columns:28px 8rem 2rem 1fr; gap:.5rem; align-items:center;
                    border:1px solid var(--line); border-radius:3px; padding:.3rem .4rem; background:var(--card); }
      .ggw .pcrow img { width:28px; height:28px; border-radius:3px; object-fit:cover; border:1px solid var(--line); }
      .ggw .pcrow .cn { font-size:.82rem; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .ggw .pcrow .ord { font-size:.68rem; color:var(--muted); }
      .ggw .pcrow .res { display:flex; gap:.25rem; flex-wrap:wrap; justify-content:flex-end; align-items:center; }
      .ggw button.cn { background:transparent; border:0; padding:0; color:var(--ink); font-family:inherit;
                      text-align:left; cursor:pointer; justify-content:flex-start; }
      .ggw button.cn:hover { text-decoration:underline; background:transparent; }

      .ggw .ticks { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.45rem; padding-top:.4rem; border-top:1px solid var(--line); }
      .ggw .ticks.col { flex-direction:column; border-top:0; padding-top:0; margin-top:.2rem; }
      .ggw .tick { justify-content:flex-start; text-align:left; font-size:.75rem; padding:.22rem .5rem; color:var(--muted); }
      .ggw .tick i { color:var(--muted); }
      .ggw .tick.on { color:var(--ink); border-color:var(--moss); }
      .ggw .tick.on i { color:var(--moss); }
      .ggw .tick.gated { border-style:dashed; }

      .ggw .reps { display:grid; grid-template-columns:repeat(2, 1fr); gap:.35rem; }
      .ggw .rep { border:1px solid var(--line); border-radius:3px; padding:.35rem .45rem; background:var(--card);
                 display:flex; flex-direction:column; gap:.2rem; font-size:.76rem; }
      .ggw .rep.on { border-color:var(--moss); }
      .ggw .rep span { color:var(--slate); }
      .ggw .rep em { color:var(--muted); font-style:normal; font-size:.7rem; }
      .ggw .rep .opt { align-self:flex-start; }

      .ggw .graves { display:grid; grid-template-columns:repeat(8, 1fr); gap:3px; margin:.35rem 0; }
      .ggw .grave { flex-direction:column; padding:.25rem .2rem; gap:.1rem; min-height:54px; background:var(--card); }
      .ggw .grave span { font-size:.7rem; color:var(--muted); }
      .ggw .grave i { font-size:.85rem; color:var(--muted); }
      .ggw .grave em { font-size:.58rem; font-style:normal; text-transform:uppercase; letter-spacing:.05em; }
      .ggw .grave.packet { border-color:var(--moss); }
      .ggw .grave.packet i, .ggw .grave.packet em { color:var(--moss); }
      .ggw .grave.surprise { border-color:var(--rust); }
      .ggw .grave.surprise i, .ggw .grave.surprise em { color:var(--rust); }

      .ggw .cooktotal { display:flex; gap:.8rem; align-items:center; flex-wrap:wrap; }
      .ggw .cooktotal p { flex:1; min-width:16rem; margin:0; }
      .ggw .big { display:flex; flex-direction:column; align-items:center; min-width:5rem; }
      .ggw .big b { font-size:1.9rem; line-height:1; color:var(--gold); }
      .ggw .big span { font-size:.58rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .ggw .cyctab { width:100%; border-collapse:separate; border-spacing:3px; font-size:.75rem; }
      .ggw .cyctab th { font-weight:600; color:var(--muted); font-size:.66rem; text-transform:uppercase; letter-spacing:.05em; }
      .ggw .cyctab th small { display:block; font-weight:400; text-transform:none; letter-spacing:0; }
      .ggw .cyctab td { text-align:center; }
      .ggw .cyctab td.who { text-align:left; white-space:nowrap; }
      .ggw .cyctab td.sum { color:var(--gold); font-size:.72rem; }
      .ggw .cyc { width:100%; min-height:24px; font-size:.68rem; font-weight:700; color:var(--muted); background:var(--card); }
      .ggw .cyc.deg-cs { background:var(--moss); border-color:var(--moss); color:var(--paper); }
      .ggw .cyc.deg-s { background:var(--slate); border-color:var(--slate); color:var(--paper); }
      .ggw .cyc.deg-f { background:var(--muted); border-color:var(--muted); color:var(--paper); }
      .ggw .cyc.deg-cf { background:var(--rust); border-color:var(--rust); color:var(--paper); }
      .ggw .cyc[class*="deg-"]:hover:not(:disabled) { filter:brightness(1.15); }
      .ggw .cyc.deg-cs:hover:not(:disabled) { background:var(--moss); }
      .ggw .cyc.deg-s:hover:not(:disabled) { background:var(--slate); }
      .ggw .cyc.deg-f:hover:not(:disabled) { background:var(--muted); }
      .ggw .cyc.deg-cf:hover:not(:disabled) { background:var(--rust); }

      .ggw .turrets { display:grid; grid-template-columns:repeat(2, 1fr); gap:.35rem; }
      .ggw .turrets .lgrp > .opt:first-child { flex:1; justify-content:flex-start; }
      .ggw .chips { display:flex; gap:4px; flex-wrap:wrap; margin:.3rem 0; min-height:22px; align-items:center; }
      .ggw .chip { width:22px; height:22px; border-radius:3px; display:inline-flex; align-items:center; justify-content:center;
                  font-size:.78rem; font-weight:700; color:var(--paper); }
      .ggw .chip.good { background:var(--moss); }
      .ggw .chip.bad { background:var(--rust); }
      .ggw .thresh { list-style:none; margin:.35rem 0; padding:0; font-size:.77rem; line-height:1.45; }
      .ggw .thresh li { padding:.2rem .4rem; border-left:2px solid var(--line); margin-bottom:.2rem; color:var(--muted); }
      .ggw .thresh li b { display:inline-block; min-width:1.4rem; color:var(--muted); }
      .ggw .thresh li.on { border-left-color:var(--moss); color:var(--ink); }
      .ggw .thresh li.on b { color:var(--moss); }

      .ggw .threads { display:grid; grid-template-columns:repeat(3, 1fr); gap:.35rem; }
      .ggw .thread { border:1px solid var(--line); border-radius:3px; padding:.35rem .45rem; display:flex; flex-direction:column;
                    gap:.1rem; font-size:.76rem; background:var(--stripe); }
      .ggw .thread b { font-size:.62rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
      .ggw .thread span { color:var(--muted); }
      .ggw .thread em { font-style:normal; font-size:.62rem; color:var(--muted); opacity:.7; }
      .ggw .thread.on { border-color:var(--plum); }
      .ggw .thread.on span { color:var(--ink); font-weight:600; }

      .ggw .banner { display:flex; gap:.5rem; align-items:flex-start; font-size:.76rem; line-height:1.45; color:var(--ember);
                    border:1px solid var(--ember); border-radius:4px; padding:.4rem .6rem; margin:0 0 .5rem; background:var(--stripe); }
      .ggw .modrow { display:flex; flex-wrap:wrap; gap:.25rem; margin:-.2rem 0 .45rem; }
      .ggw .lnk { font-size:.66rem; padding:.12rem .45rem; color:var(--muted); border-color:var(--line); border-radius:10px; gap:.3rem; }
      .ggw .lnk i { font-size:.62rem; }
      .ggw .lnk.scn { color:var(--slate); border-color:var(--slate); }
      .ggw .lnk.snd i { color:var(--plum); }
      .ggw .lnk.snd.on { color:var(--moss); border-color:var(--moss); }
      .ggw .lnk.snd.on i { color:var(--moss); }
      .ggw .lnk.mac { color:var(--ember); border-color:var(--ember); }
      .ggw .lnk.eff { color:var(--gold); border-style:dashed; }
      .ggw .lnk.hnd i { color:var(--plum); }
      .ggw .lnk.ico, .ggw .opt.ico, .ggw .npc.ico { padding:.12rem .35rem; }
      .ggw .lgrp { display:inline-flex; gap:2px; }
      .ggw .lgrp > :first-child:not(:last-child) { border-top-right-radius:2px; border-bottom-right-radius:2px; }
      .ggw .lgrp > :last-child:not(:first-child) { border-top-left-radius:2px; border-bottom-left-radius:2px; }
      .ggw .npc { font-size:.74rem; padding:.22rem .55rem; color:var(--slate); border:1px solid var(--slate); border-radius:3px;
                 display:inline-flex; align-items:center; gap:.3rem; }
      .ggw .npc.flat { cursor:default; }
      .ggw .lootbtn { font-size:.7rem; padding:.18rem .5rem; color:var(--gold); border-color:var(--gold); }
      .ggw .lootbtn.trk { color:var(--plum); border-color:var(--plum); }
      .ggw .scenes { display:flex; flex-direction:column; gap:.3rem; }
      .ggw .scenerow { display:flex; align-items:center; gap:.6rem; font-size:.77rem; color:var(--muted); }
      .ggw .scenerow > .lgrp, .ggw .scenerow > .opt { flex:none; min-width:16rem; }
      .ggw .scenerow > .lgrp > .opt:first-child { flex:1; justify-content:flex-start; }
      .ggw .scenerow > .opt { justify-content:flex-start; }
      .ggw .scenerow > span:not(.lgrp) { flex:1; }
      .ggw h3 .stopall { margin-left:auto; }
      .ggw .xpbar { height:8px; border:1px solid var(--line); border-radius:4px; background:var(--stripe); overflow:hidden; margin:.2rem 0 .4rem; }
      .ggw .xpbar span { display:block; height:100%; background:var(--moss); }

      @media (max-width:820px) {
        .ggw .phases { grid-template-columns:repeat(4, 1fr); }
        .ggw .graves { grid-template-columns:repeat(4, 1fr); }
        .ggw .threads, .ggw .reps, .ggw .turrets { grid-template-columns:1fr; }
        .ggw .tabs { flex-wrap:wrap; }
        .ggw .pcrow { grid-template-columns:28px 1fr 2rem; }
        .ggw .pcrow .res { grid-column:1 / -1; justify-content:flex-start; }
      }
    </style>`;
  }
}

if (AppV2) {
  GGWApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  /* Every tab carries DCs, XP, and what's coming next — none of it is for the
     players, so the console only opens for a GM. Players see the chat cards
     it posts. */
  if (!game.user.isGM) return ui.notifications.warn("Guilt of the Grave World is a GM console.");
  registerSetting();
  let state = game.settings.get(GGW_NS, GGW_KEY);
  if (!state) {
    state = blankState(detectPCs());
    await game.settings.set(GGW_NS, GGW_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const run = new GraveWorld(state);
  const app = new GGWApp(run);

  if (!globalThis.__ggwHook) {
    globalThis.__ggwHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== GGW_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh && globalThis.__ggwRun) { globalThis.__ggwRun.state = fresh; globalThis.__ggwRun.render(); }
    });
  }
  /* Sounds started or stopped from the sidebar, or by a scene, have to
     repaint the play buttons. */
  if (!globalThis.__ggwSoundHook) {
    globalThis.__ggwSoundHook = Hooks.on("updatePlaylistSound", () => globalThis.__ggwRun?.render());
  }
  globalThis.__ggwRun = run;
  app.render(true);
})();
