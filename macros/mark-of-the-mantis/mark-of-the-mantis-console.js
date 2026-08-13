/* ============================================================================
   MARK OF THE MANTIS — GM Console
   Pathfinder Second Edition · four 6th-level pregens · Pathfinder One-Shot
   Foundry VTT v11 / v12 / v13  •  built for the pf2e system
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   Runs the whole one-shot: the two legwork phases and the six preparation
   activities, the Infiltration subsystem's Infiltration / Awareness / Edge
   Points, every obstacle and complication, all sixteen manor areas, and the
   cellar. The Awareness ladder fires itself as the total climbs.

   Every counter is derived from the results you tick rather than accumulated,
   so un-ticking any one of them rewinds the board exactly.

   Stat blocks are not reproduced. Creature buttons search your world's actor
   compendiums by name and open what they find; each one also carries the page
   its stat block is printed on, so a creature with no compendium entry can
   still be looked up in the book.
   ============================================================================ */

const MM_NS = "world";
const MM_KEY = "pf2eMarkOfMantis";
const MM_ID = `${MM_NS}.${MM_KEY}`;
const MAX_PCS = 4;

const THEME = "crimson";
const PALETTES = {
  /* Lacquer and blood: the Red Mantis palette, for a job done after dark. */
  crimson: {
    paper: "#130b0e", card: "#1d1216", ink: "#ece0e2", line: "#3b2630", muted: "#a6868f",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(230,90,90,.10)", field: "#0e0709",
    rust: "#d9483f", ember: "#dd9046", moss: "#5fbb8b", slate: "#6f9fca", plum: "#a97fd2", gold: "#d9b45f"
  },
  daylight: {
    paper: "#f4eff0", card: "#ffffff", ink: "#1d1216", line: "#d0bfc5", muted: "#6b565d",
    stripe: "rgba(0,0,0,.04)", hover: "rgba(0,0,0,.06)", field: "#faf6f7",
    rust: "#a8281f", ember: "#8f5613", moss: "#1c7a52", slate: "#1f6193", plum: "#6b3fa8", gold: "#8a6612"
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

/* ------------------------------------------------------------------- tabs */
const TABS = [
  { key: "plan", label: "Planning", sub: "the legwork", tone: "slate", icon: "fa-map-location-dot" },
  { key: "infil", label: "Infiltration", sub: "IP · AP · EP", tone: "rust", icon: "fa-user-ninja" },
  { key: "grounds", label: "Grounds", sub: "A1 – A5", tone: "moss", icon: "fa-tree" },
  { key: "manor", label: "The Manor", sub: "A6 – A16", tone: "ember", icon: "fa-door-closed" },
  { key: "cellar", label: "Cellar", sub: "B · the kill", tone: "plum", icon: "fa-skull" },
  { key: "alt", label: "Alternates", sub: "replay options", tone: "gold", icon: "fa-shuffle" }
];

/* --------------------------------------------------------------- the brief */
const OPENING = {
  where: "The private dining room of the Caliphas Dream, a cafe and wine bar in Eastgate. Its owner Dehrig (N male halfling) is paid well to shelter Red Mantis operatives without asking questions.",
  boxed: "Two platters of dumplings slide onto the private dining room's low table. The proprietor, a tight-lipped halfling named Dehrig, reports, \"Chicken and leek, plus the three-mushroom special. Still no sign of your gnome.\" With a shallow bow, he withdraws, letting early afternoon light spill into the room before he closes the door.\n\nAlready the mission has complications. Teskorbito — a gnome alchemist and fellow Red Mantis assassin — hasn't appeared to join the infiltration team as ordered. Instead, the resourceful mercenary Kangir arrived this morning, having anticipated the Red Mantis's vendetta against his former boss, Doatara, and wanting a piece of the action. The enemy of my enemy and all.\n\nBy now, though, part of the day is already gone. The Vernai's orders are to gather intelligence, plan our attack, and strike after nightfall, felling Doatara before midnight. There's enough light left in the day for each team member to perform two significant tasks. Now the only question is: where to begin?",
  shopping: "Each PC has 5 gp for extra common gear. Dehrig's niece runs a delivery business and will quietly buy and drop off the purchases in time for the infiltration, so the legwork isn't spent shopping.",
  truth: "Teskorbito arrived early, scouted the manor alone, and was killed by Doatara. His Crimson Shroud dissolved his body into red mist; Doatara took his sawtooth saber as a trophy and believes herself safe.",
  handouts: "Hand out the Red Mantis Primer and the Orders from the Vernai before play. All four pregens are evil — talk to the table about boundaries and safety tools first.",
  clock: "The Vernai's deadline is midnight. From nightfall that leaves three hours, which is more than enough — there is time to retreat and Treat Wounds repeatedly if the party needs it."
};

/* --------------------------------------------------- preparation activities
   Two phases; each PC performs one activity per phase, and each PC can attempt
   each activity only once. Uncover Everbloom Manor's Secrets is the exception:
   the party as a whole gets two attempts at it.

   `awards` is what the result does to the board and is applied automatically —
   nothing here is entered twice. */
const ACTIVITIES = [
  {
    key: "prepare", label: "Prepare Tools for Assassination", short: "Prepare Tools",
    traits: ["Uncommon", "Exploration"], tone: "ember", icon: "fa-screwdriver-wrench",
    lead: "A tool built for an obstacle you expect: an outfit, a cloak that matches the gardens, forged invitations, a prybar sized for the manor's windows, carefully formulated bait. As a master assassin, whatever comes your way, you've thought of it.",
    checks: [{ dc: 20, skills: ["Crafting"] }],
    degrees: [
      ["s", "You create an effective tool worth 1 Edge Point. Spend it at any point in the infiltration to describe a flashback of preparing exactly the right tool — and say how it beats the obstacle in front of you."],
      ["f", "You create a middling tool. You gain 1 Edge Point that, unknown to you, provides no benefit at all when used."],
      ["cf", "As a failure, but a PC who spends that Edge Point gets a critical failure — even if they spend it after rolling a failure."]
    ]
  },
  {
    key: "doatara", label: "Uncover Doatara's Secrets", short: "Doatara's Secrets",
    traits: ["Uncommon", "Exploration", "Secret"], tone: "rust", icon: "fa-user-secret",
    lead: "Key information about Doatara Kelorbeyan, drawn out of people who know her.",
    checks: [{ dc: 20, skills: ["Diplomacy", "Intimidation", "Society"] },
             { dc: 18, skills: ["Assassin Lore", "Underworld Lore"] }],
    degrees: [
      ["s", "You learn her history — and, if she is the Poisoner, the tell that gives away the alchemist."],
      ["cf", "You come away with a confident, wrong picture of her."]
    ],
    facts: "doatara"
  },
  {
    key: "manor", label: "Uncover Everbloom Manor's Secrets", short: "Manor's Secrets",
    traits: ["Uncommon", "Exploration", "Secret"], tone: "slate", icon: "fa-book-open",
    lead: "Interviews and archival investigation into the house itself. Cumulatively the party can attempt this twice.",
    partyLimit: 2,
    checks: [{ dc: 20, skills: ["Diplomacy", "Intimidation", "Society"] },
             { dc: 18, skills: ["Absalom Lore"] }],
    degrees: [
      ["s", "You learn two of the facts below."],
      ["cf", "You learn nothing of note, and your prying draws unwanted attention. Gain 1 AP."]
    ],
    awards: { cf: { ap: 1 } },
    facts: "manor"
  },
  {
    key: "distraction", label: "Orchestrate Timely Distraction", short: "Distraction",
    traits: ["Uncommon", "Exploration"], tone: "plum", icon: "fa-bullhorn",
    lead: "An attention-grabbing event primed to go off near the manor this evening — an unsanctioned street performance, an explosion, a brawl.",
    checks: [{ dc: 20, skills: ["Deception", "Performance", "Religion", "Society"] }],
    degrees: [
      ["cs", "As a success, and the distraction is spectacular enough to pull the manor staff's attention away and drown out subtle signs of your presence. Reduce the Awareness total by 1."],
      ["s", "You gain 1 Edge Point that you can spend while outside the manor."],
      ["f", "The manor's guards hold fast to their duties."],
      ["cf", "The distraction backfires, reminding the guards to stay vigilant. Gain 1 AP."]
    ],
    awards: { cs: { ap: -1 }, cf: { ap: 1 } }
  },
  {
    key: "scope", label: "Scope Everbloom Manor", short: "Scope the Manor",
    traits: ["Uncommon", "Exploration", "Secret"], tone: "moss", icon: "fa-binoculars",
    lead: "Study the manor from several vantage points, reading its layout, obstacles, and defences. A PC with a spyglass who succeeds gets the critical success result instead.",
    checks: [{ dc: 20, skills: ["Perception", "Stealth", "Survival"] },
             { dc: 18, skills: ["Warfare Lore"] }],
    degrees: [
      ["cs", "The unmarked map, plus three facts nobody has discovered yet."],
      ["s", "The unmarked map, plus one fact nobody has discovered yet."],
      ["f", "The unmarked map and nothing else."],
      ["cf", "The unmarked map, plus two of the topics below — misjudged. Put the obstacles in the wrong place, or name the wrong creature outside."]
    ],
    facts: "scope"
  },
  {
    key: "keys", label: "Swipe Manor Keys", short: "Swipe Keys",
    traits: ["Uncommon", "Exploration"], tone: "gold", icon: "fa-key",
    lead: "Lift one of the manor's keys off a servant or guard without anyone noticing.",
    checks: [{ dc: 22, skills: ["Thievery"] }],
    kangirDc: 20,
    kangirNote: "DC 20 for Kangir, whose Pickpocket feat covers exactly this.",
    degrees: [
      ["cs", "As a success, and you also lift a security key that deactivates the manor's traps. Whoever holds it has a +2 circumstance bonus to Disable traps inside."],
      ["s", "A key to one locked obstacle inside — the doors to A5, the desk in A10, whatever you like. Decide which when you use it; after that the key only works on that lock."],
      ["f", "You don't acquire keys."],
      ["cf", "You get away before you're caught, but you've raised the guards' suspicion. Gain 1 AP."]
    ],
    awards: { cf: { ap: 1 } }
  }
];

/* What the secret activities actually reveal. The GM ticks off what the party
   has been told, because the book hands out a number of facts rather than
   particular ones. */
const FACTS = {
  doatara: {
    title: "What they learn about Doatara", tone: "rust",
    items: [
      { k: "history", text: "Once an Osirian cotton merchant of some repute, Doatara married the heiress of the Kelorbeyan fortune. Months later footpads killed her wife in a bungled robbery, leaving the estate under the young widow's control. She has since become an outspoken anti-crime advocate running for a district council seat, and has trained tirelessly with fencing masters." },
      { k: "poisoner", text: "She wears heavy perfume and dresses extravagantly, yet witnesses report she also smells of bitter herbs — and she regularly orders strange powders, animal parts, and glassware. She is an accomplished alchemist. Expect powerful toxins and explosives.", only: "poisoner" },
      { k: "priest", text: "She spends considerable time in the Ascendant Court, where temples of nearly every god stand. Combine the reports of her vanishing from parties with what you know of her patron and the conclusion is a cleric of Norgorber. Expect defensive and evasive spells, plus void energy attacks.", only: "priest" },
      { k: "poisonerFalse", text: "She spends time in the Ascendant Court and vanishes magically from parties, so she must be a cleric of Norgorber. Expect defensive spells and void energy.", bad: true, only: "poisoner" },
      { k: "priestFalse", text: "The perfume, the bitter herbs, the strange powders and glassware: she must be an accomplished alchemist. Expect toxins and explosives.", bad: true, only: "priest" }
    ]
  },
  manor: {
    title: "What they learn about the manor", tone: "slate",
    items: [
      { k: "ruins", text: "Everbloom Manor stands on the ruins of an estate destroyed during a siege a millennium ago. It takes its name from its myriad red-flowering bushes, at least one of which is always in bloom regardless of season." },
      { k: "cellars", text: "Absalom is so old that the city's surface rests on countless layers of older construction. Many Petal District manors have cellars built into the millennia-old ruins beneath, though the way in is often hidden." },
      { k: "iomedae", text: "The Kelorbeyan family tree boasts many proud worshippers of Iomedae. The manor has a private chapel, and the family celebrates Iomedaean holidays with large picnics — though the most recent passed with little fanfare. Their founders were divine champions who defeated myriad arctic beasts before settling in Absalom, and their motto is \"A green wall against evil winds.\"" },
      { k: "guards", text: "Discouraged by Doatara's rhetoric, the district's Lotus Guard tends to avoid her manor. She has hired her own household guards, with several on duty at all hours." }
    ]
  },
  scope: {
    title: "What they see from the vantage points", tone: "moss",
    items: [
      { k: "windows", text: "Several of the manor's windows are barred — those into A6, A8, A11, A12, and A13." },
      { k: "doors", text: "Several doors are kept locked: the west door near A8, and the doors into A5. The main door into A3 seems to be left unlocked." },
      { k: "roof", text: "The flat roof has limited access. A hatch toward the north leads into the manor, and a ladder is stowed in the bushes east of the round tower. Two large skylights probably can't take a human's weight." },
      { k: "guardian", text: "", dynamic: "exterior" },
      { k: "inside", text: "", dynamic: "interior" },
      { k: "count", text: "Six guards are on duty now, and there will be 10–12 during the evening event. The flat roof makes a natural vantage point for a few of them; most will be patrolling the grounds." }
    ]
  }
};

const DEGREES = [["cs", "Crit success"], ["s", "Success"], ["f", "Failure"], ["cf", "Crit failure"]];
const DEG_LABEL = { cs: "Critical Success", s: "Success", f: "Failure", cf: "Critical Failure" };

/* ---------------------------------------------------------- the infiltration
   Every obstacle needs 4 Infiltration Points and the job needs 8, so two
   obstacles run over the course of the break-in. The book's results are the
   same for all of them. */
const OB_RESULT = [
  ["cs", "The PCs gain 2 Infiltration Points."],
  ["s", "The PCs gain 1 Infiltration Point."],
  ["f", "The PCs gain 1 Awareness Point."],
  ["cf", "The PCs gain 2 Awareness Points."]
];
const OB_TURN = "After every PC has attempted a check — or declined to — the party gains 1 Awareness Point, and takes another turn if the obstacle isn't beaten. An action that helps automatically without a check, like the right spell, is worth 1 IP.";
const IP_GOAL = 8;
const OB_IP = 4;

const OBSTACLES = [
  { key: "opening", label: "Find Opening", tone: "slate", icon: "fa-magnifying-glass",
    checks: [{ dc: 24, skills: ["Perception"] }, { dc: 22, skills: ["Thievery"] }],
    text: "With guards and party guests milling about the grounds, the first step in passing through undetected is finding the right opening. That might be a sneaky path into the manor, or carefully plotting a route once inside." },
  { key: "bodies", label: "Hide Bodies", tone: "rust", icon: "fa-person-falling",
    checks: [{ dc: 22, skills: ["Athletics", "Medicine"] }],
    text: "Dead men may tell no tales, but their bodies have a way of capturing attention. Your actions have left corpses in your wake, and if you don't clean them up quickly, panic is sure to follow. It'll be easier if you can stop the bleeding first." },
  { key: "guest", label: "On the Guest List", tone: "plum", icon: "fa-champagne-glasses",
    checks: [{ dc: 22, skills: ["Deception", "Performance", "Society"] }],
    text: "You might not be on the guest list, but if you play your cards right, the guests won't know any better. With charm or social graces, you pretend to belong." },
  { key: "precarious", label: "Precarious Position", tone: "ember", icon: "fa-person-falling-burst",
    checks: [{ dc: 22, skills: ["Acrobatics"] }, { dc: 24, skills: ["Reflex"] }],
    text: "For all your preparations, you misjudged something about the building. Perhaps the place you latched your grappling hook wasn't as sturdy as it looked, or the roof is slippery with moss. Indoors this is a floor that creaks loudly unless walked on with great care. You aren't in danger of harm — but you'll attract notice if you don't watch your step." },
  { key: "silent", label: "Silent as the Grave", tone: "moss", icon: "fa-volume-xmark",
    checks: [{ dc: 22, skills: ["Intimidation", "Stealth"] }],
    text: "A sizable group of guards or guests has congregated in a room along your path. You'll need to sneak past them, or quietly persuade anyone who noticed you to keep their mouths shut." }
];

const COMPLICATIONS = [
  { key: "cornered", label: "Cornered", tone: "slate", icon: "fa-arrows-to-dot", cap: 4,
    checks: [{ dc: 18, skills: ["Assassin Lore"] }, { dc: 20, skills: ["Stealth"] }],
    text: "Backed into a corner, you hear approaching footsteps — or people are closing from several directions at once, leaving no easy exit. Every PC must attempt this check.",
    note: "However badly it goes, this situation can't generate more than 4 Awareness Points.",
    degrees: [["s", "You escape detection."], ["f", "They catch sight of you out of the corner of an eye and grow wary. 1 AP."], ["cf", "Witnesses clearly see the PC. 2 AP."]],
    awards: { f: 1, cf: 2 } },
  { key: "know", label: "Do I Know You?", tone: "rust", icon: "fa-eye",
    checks: [{ dc: 18, skills: ["Deception", "Diplomacy"], who: "Kangir" }],
    text: "One of the manor guards used to work with Kangir and recognises her, forcing her to invent a cover story — or rely on her allies to silence him.",
    note: "Any other PC using the Red Mantis Assassination activity can assassinate the guard instead of letting Kangir talk.",
    degrees: [["s", "The guard buys her story — or dies before he can raise the alarm."], ["f", "He's suspicious of the cover story. 1 AP."], ["cf", "He realises Kangir means harm and cries out, forcing the PCs to subdue him. 2 AP."]],
    awards: { f: 1, cf: 2 } },
  { key: "socialites", label: "Shake Off Socialites", tone: "plum", icon: "fa-martini-glass-citrus",
    checks: [{ dc: 22, skills: ["Deception", "Diplomacy", "Intimidation"] }],
    text: "The good news is that nobody suspects your nefarious intentions. The bad news? You've become the life of the party, and people are pestering you to dance, drink, and be merry — or a knot of aristocrats has pulled you into a spirited debate. Leave carelessly and they'll come looking.",
    degrees: [["s", "You slip away without a fuss."], ["f", "They accept your refusal eventually, but extricating yourself takes a while. 1 AP."], ["cf", "The noble you refused is not used to being told no, and storms off in a screaming rage. 2 AP."]],
    awards: { f: 1, cf: 2 } },
  { key: "witnesses", label: "Silence Witnesses", tone: "ember", icon: "fa-user-slash",
    checks: [{ dc: 22, skills: ["Intimidation"] }, { dc: 22, skills: ["Strike"], strike: true }],
    text: "A pair of partygoers catches you in the act — maybe only the break-in, maybe you with a bloody saber in hand. Either way they're about to run screaming, and both have to be stopped. Each PC gets one turn.",
    degrees: [["cs", "With trickery, terror, or blood, you stop both witnesses in one stroke."], ["s", "One partygoer is disinclined to report you, or dead. If a witness remains, another PC can try to silence them."], ["f", "A witness calls for help. 1 AP."], ["cf", "A witness screams, throws things at you, and makes themself as loud as possible. 2 AP."]],
    awards: { f: 1, cf: 2 } }
];

/* The exploration activity every PC has in this adventure. */
const ASSASSINATION = {
  title: "Red Mantis Assassination", traits: ["Rare", "Exploration", "Move"],
  lead: "You stalk the shadows, watching for targets and preparing to dispatch them with a quiet, decisive blow. While using this activity, if you are unnoticed by a humanoid of your level or lower, you can Stride up to half your Speed, ending adjacent to the target.",
  roll: "Attempt either an attack roll against the target's AC + 5, or a Deception or Stealth check against the target's Perception DC.",
  special: "Kangir and Zeah can do this with a ranged weapon, so long as they end their movement within the first range increment.",
  degrees: [
    { k: "cs", ap: 0, label: "Crit success", text: "You kill the target and earn no Awareness Point, even if another creature could witness the attack." },
    { k: "s", ap: 0, label: "Success — unseen", text: "You kill the target without earning an Awareness Point, because nothing else saw it." },
    { k: "sw", ap: 1, label: "Success — witnessed", text: "You kill the target, but something saw it. 1 AP." },
    { k: "f", ap: 1, label: "Failure", text: "You kill the target but make noise. 1 AP." },
    { k: "cf", ap: 2, label: "Crit failure", text: "You kill the target after a prolonged struggle. 2 AP." }
  ]
};

/* Awareness sources that aren't attached to a check anywhere else. */
const AP_SOURCES = [
  { n: 1, label: "Inexpert task", why: "A failed Stealth check crossing an observed area, a failed Deception at the garden party, fumbling a lock within earshot." },
  { n: 1, label: "Round of combat", why: "One per round, unless the PCs took precautions such as luring their targets somewhere isolated." },
  { n: 2, label: "A ruckus", why: "A critically failed Stealth check, Forcing Open a door, falling off a wall, leaving a corpse where it can be found." },
  { n: 4, label: "Audacious act", why: "Diving through a skylight, setting fire to the manor, terrorising the partygoers." }
];

const LADDER = [
  { at: 3, tone: "moss", label: "The garden turns hostile",
    text: "The creature outside moves to a spot better suited to watching for and ambushing intruders. The first time the party reaches this total, a complication occurs.",
    fires: true },
  { at: 5, tone: "ember", label: "A patrol finds them",
    text: "A patrol of three guards finds the PCs and confronts them in combat." },
  { at: 8, tone: "rust", label: "The house tightens up",
    text: "Every obstacle's DC increases by 1. The first time the party reaches this total, a complication occurs.",
    fires: true },
  { at: 11, tone: "rust", label: "Doatara is ready",
    text: "She and her ceustodaemon ally gain a +2 circumstance bonus to initiative — she is expecting an attack at any moment." },
  { at: 16, tone: "plum", label: "Doatara runs",
    text: "She panics and flees the manor. The infiltration has failed. The contract lives on, as does the party's duty to hunt her down." }
];

/* ---------------------------------------------------------------- guards */
const GUARDS = {
  total: 12,
  name: "Kelorbeyan Guard", level: "Creature 4", source: "Adventure page 11",
  posts: "Three on the roof, three inside the manor, three at the garden party out front, and three wandering the grounds.",
  text: "The PCs aren't expected to fight all of them — at least not in conventional, round-by-round combat. The guards are meandering threats to evade and occasionally kill with Red Mantis Assassination. Don't track every guard's exact position; place the few the PCs can see and move a couple around to open and close gaps.",
  joinRules: [
    { min: 9, text: "Two guards are close enough to join the shambler or the pairaka when one of them is met — and one of those two joins any fight that starts with guards." },
    { min: 5, text: "Eight or fewer left: only one guard joins the encounter." },
    { min: 0, text: "Four or fewer left: no guards join at all, or the shambler's or pairaka's arrival is delayed by 1 round." }
  ]
};

/* ------------------------------------------------------ alternate challenges
   The adventure's headline feature: swap challenges to make it play
   differently each time. Every switch here rewrites what the console shows —
   the legwork facts, the area cards, and the creature buttons all follow. */
const ALTS = {
  doatara: {
    label: "Doatara", icon: "fa-user-secret", tone: "rust",
    lead: "Master alchemist as printed, or a cleric of Norgorber. The switch also flips what Uncover Doatara's Secrets tells the party: the alchemist tell and the Ascendant Court lead trade places, so the true reading is always the one that matches her.",
    options: [
      { key: "poisoner", label: "The Poisoner", creatureName: "Doatara the Poisoner", page: "Adventure page 19",
        note: "Bombs, injury poisons, Blackfingers's Blessing, and Reckless Toxin. Adventure page 19." },
      { key: "priest", label: "The Priest", creatureName: "Doatara the Priest", page: "Adventure page 22",
        note: "Invisibility, harm, Channel Smite, Poison Weapon. Adventure page 22." }
    ]
  },
  exterior: {
    label: "Exterior guardian", icon: "fa-tree", tone: "moss",
    lead: "The creature loose in the grounds. Whichever it is, it repositions to ambush intruders once the party reaches 3 Awareness Points.",
    options: [
      { key: "shambler", label: "Shambler", note: "Creature 6, Bestiary 290. Rests in mound form north of the kitchen, waiting to Shamble anyone who comes within 10 feet.",
        creature: { name: "Shambler", source: "Bestiary 290" },
        scope: "The manor grounds show signs of recent excavation and renovation. More than a dozen flowering bushes have been removed, stacked as brush in several places behind the manor — and the birds and squirrels seem to avoid those piles on purpose." },
      { key: "hellcat", label: "Hellcat", note: "Creature 7, Bestiary 2 141 — invisible in bright light, and a level higher than the shambler. Consider dropping the guards who join by one. It hates the guards and may strand one among the PCs.",
        creature: { name: "Hellcat", source: "Bestiary 2 141" },
        scope: "A PC watching the back garden sees several guards eyeing the cage in A2 before one tosses a pebble between the bars. The pebble strikes something unseen, the whole structure rattles as its invisible occupant rouses and growls, and the guards retreat. There are also tracks where a clawed predator the size of a bear has prowled the gardens." },
      { key: "ahuizotl", label: "Ahuizotl", note: "Creature 6, Bestiary 2 12 — lives in the fishpond and uses Voice Imitation to sound like a drowning child. Adopted as a pup; it doesn't eat servants.",
        creature: { name: "Ahuizotl", source: "Bestiary 2 12" },
        scope: "Clusters of duck feathers around A2, where a waterfowl was snagged by something. Wet tracks near the fishpond suggest something recently came out of it. The PC also witnesses a cry for help that draws a few guards to the back garden — and when they find nobody, they swear and shake their heads as though this happens all the time." }
    ]
  },
  interior: {
    label: "Interior guardian", icon: "fa-ghost", tone: "plum",
    lead: "Doatara's ally inside the house, and the one who plays her body double at the windows.",
    options: [
      { key: "pairaka", label: "Pairaka div", note: "Creature 7, variant of Bestiary 3 70. Impersonates Doatara, hates the colour red, and leads intruders into the trap in A9.",
        creature: { name: "Pairaka", source: "Bestiary 3 70" },
        scope: "The manor has many flowering bushes, and some should be in bloom — yet the red flowers have been pruned so none are visible from the manor itself. There are several red blankets and tapestries in the estate's rubbish." },
      { key: "shadow", label: "Greater shadow", note: "Creature 7, Bestiary 289. Grimly fascinated by Norgorber's faithful; haunts the stuffed owlbear in A5, the altar in A11, and the mannequin in A15.",
        creature: { name: "Greater Shadow", source: "Bestiary 289" },
        scope: "Servants cleaning a room with windows suddenly jump in alarm and run out into the sun. As they calm down they speculate as to whether the manor has always been haunted, or whether it's just their bad luck." },
      { key: "terracotta", label: "Terra-cotta warriors", note: "Two, Creature 5 each, Bestiary 3 263 — reattuned to be more aggressive. Stand in A3, or one in A3 and one in A15, or patrolling to meet the PCs as Awareness climbs.",
        creature: { name: "Terra-Cotta Warrior", source: "Bestiary 3 263" },
        scope: "A crash from inside the manor, followed by servants fleeing into the gardens. Taking cover, they fearfully insist that \"they\" were never so aggressive, and question indignantly whether \"they\" even recognise that the servants are supposed to be there. What would the founding Kelorbeyans think of being portrayed so violently, the servants muse as they dust themselves off." }
    ]
  },
  cellar: {
    label: "Route down to the cellar", icon: "fa-stairs", tone: "gold",
    lead: "Where the way into area B is hidden.",
    options: [
      { key: "a11", label: "A11 Chapel", note: "Lower and latch the window shades, then shift the weapon rack: the chapel turns Norgorberite and part of the floor recesses to reveal the shaft. DC 24 Perception to identify the moving parts." },
      { key: "a7", label: "A7 Pantry", note: "A smaller shelf has a hidden latch — DC 24 Perception to find — that lets it slide forward and aside, revealing a vertical shaft and ladder. Revealing Norgorber's paraphernalia in the chapel no longer opens anything." },
      { key: "a15", label: "A15 Gallery", note: "A false bottle twists and pulls out to unlatch one of the liquor shelves, which swings open like a door. The shaft is hidden under the stairs. Revealing Norgorber's paraphernalia in the chapel no longer opens anything." }
    ]
  }
};

/* Two trap slots, each of which can move and change type. The book's defaults
   are the boreal rage trap in A5 and the hail of darts in A9. */
const TRAP_TYPES = {
  boreal: { label: "Boreal rage trap", level: "Hazard 6", tone: "slate", source: "Adventure page 13",
    stealth: "Stealth DC 25 (expert)", disable: "DC 22 Thievery (expert) on the owlbear's base",
    text: "A stuffed arctic owlbear twists toward intruders and breathes a gust of frigid air at anyone passing through the room. It triggers on entering either marked area, or on remaining in the room for a minute, and resets after 10 minutes.",
    bypass: "Sneaking in past it without being detected is DC 22 Stealth — the whole group can do this, or one PC can stealth up to disarm it. It can also be switched off for 5 minutes by speaking the Kelorbeyan motto, \"A green wall against evil winds\", aloud — but saying it loudly enough to work earns 1 AP. The party may have learned the motto during the legwork." },
  darts: { label: "Hail of darts", level: "Hazard 6", tone: "ember", source: "Adventure page 15",
    stealth: "Stealth DC 22 (expert)", disable: "DC 25 Thievery (expert) on the floor tile or wall socket",
    text: "Spring-loaded, ceiling-mounted darts fire down the hallway when a pressure plate is stepped on, striking everything in a 30-foot line and delivering old giant wasp venom." },
  scythe: { label: "Scythe blade traps (a pair)", level: "Hazard 4 each", tone: "rust", source: "Core Rulebook 523",
    text: "Well suited to guarding tighter spaces. Two of them replace a single trap." },
  powder: { label: "Hallucination powder trap", level: "Hazard 6", tone: "plum", source: "Core Rulebook 524",
    text: "An excellent choice when paired with an interior guardian that's immune to poison." },
  choir: { label: "Ghostly choir", level: "Hazard 6 · haunt", tone: "moss", source: "Gamemastery Guide 78, reprinted in the adventure",
    stealth: "Stealth DC 20 (expert)", disable: "DC 28 Performance (trained) to disrupt the song's resonance with another tune, or DC 28 Religion (trained) to ritually silence the spirits",
    text: "A choir of righteous Iomedaean souls rises out of the floor to reclaim the space, singing an eerie chant that terrifies listeners and buffets their bodies with walls of sound. Its Profane Chant harms evil creatures only — which is every one of the PCs. A natural fit for the chapel." }
};
const TRAP_SPOTS = [
  { key: "a5", label: "A5 Great Hall" }, { key: "a9", label: "A9 South Hall" },
  { key: "a10", label: "A10 Study" }, { key: "a11", label: "A11 Chapel" },
  { key: "a15", label: "A15 Gallery" }, { key: "a16", label: "A16 Main Bedroom" }
];

/* ---------------------------------------------------------------- the manor */
const FEATURES = [
  ["Barred windows", "The windows into A6, A8, A11, A12, and A13 have metal grates too narrow to Squeeze through. Forcing one open is DC 24 Athletics."],
  ["Bushes", "Heavy undergrowth: greater difficult terrain that provides cover."],
  ["Climbing", "DC 20 Athletics for the estate's outer wall, DC 22 for the manor's walls, DC 20 for the ivy on the tower."],
  ["Doors", "Exterior doors are reinforced wood, interior doors plain wood. Forcing a locked door open is DC 24 Athletics."],
  ["Eaves", "They extend far enough that anyone next to the manor has cover against anyone on the roof."],
  ["Gate", "A service gate in the north wall, securely locked: three successful DC 22 Thievery checks."],
  ["Lights", "Each room has a magical light switched on by touching a panel and speaking a command word. Only A3, A4, A6, A7, and A8 are lit during the infiltration, which leaves dim light in A5, A9, and A15. The PCs don't know the command word, but a DC 20 Arcana check while Interacting with a panel overrides it. Exterior lights under the eaves shed dim light in a 20-foot radius."],
  ["Locks", "Three successful DC 20 Thievery checks except where noted. Locked: the exterior door near A8, the exterior doors into A5, the doors into A10, and the door into A16."],
  ["Outer wall", "10 feet tall, along the north and east borders of the map. West and south aren't depicted."],
  ["Roof access", "A groundskeeper's ladder stowed in the bushes 20 feet east of the tower, and an affixed ladder in a small room off A6 leading up to a hatch."],
  ["Skylights", "Two, above A3 and A5. Walking across one is DC 20 Acrobatics or Reflex or it breaks, dropping the PC 15 feet. Forced onto one, or deliberately breaking it with body weight, always breaks it."],
  ["Tower", "30 feet tall, with four narrow windows 20 feet up. They only open a little, so getting through means removing the pane — quietly, with DC 20 Thievery — and then Squeezing, DC 22 Acrobatics. West windows open into A16; east windows open above the stairs in A15."],
  ["Anything else", "If a PC attempts a challenging task the book doesn't cover, use DC 22."]
];

const AREAS = [
  { id: "A1", key: "a1", zone: "grounds", name: "Front Garden", tone: "moss",
    boxed: "Eleven columns, each carved with one of the then-mortal Iomedae's famous acts, are arrayed in front of Everbloom Manor's main entrance. Paved pathways lead throughout the estate, including to the gate to the southwest. Slightly to the manor's south is a cheery patio set with narrow tables. Ornamental bushes, some trimmed to resemble fanciful beasts, surround the patio.",
    text: "Twenty-three partygoers, three guards, six servants, and a musician at a massive harp. Political discourse, half-informed philosophy, and elite rumourmongering make a cheerful din that drowns out most of what happens outside the gathering.",
    beats: [
      ["Listening in", "Doatara was expected to appear by now but is apparently waylaid inside — nobody is sure whether she's taken ill or is dealing with some other drama. Some attendees believe they've spotted her through the southern windows, which means A9 and the rooms beside it."],
      ["Guests", "The front garden is open to them. A guard escorts any visitor in need through the foyer (A3) and the hall to the guest bathroom (A8), and guards firmly redirect anyone who wanders further."]
    ] },

  { id: "A2", key: "a2", zone: "grounds", name: "Back Garden", level: "Trivial 6", tone: "rust",
    boxed: "Reserved for the residents and select guests, the back garden centres on an L-shaped loggia porch overlooking a deep, stone-lined fishpond half covered with lily pads. The deck stands 10 feet above the ground, with two uncovered staircases descending toward the pond. Paved pathways lead around the manor.",
    text: "A locked gate in the estate's north wall takes three successful DC 22 Thievery checks. Against the wall toward the northwest corner stands a large cage built for kennelling guard dogs — unused, and unlocked.",
    guardian: "exterior" },

  { id: "A3", key: "a3", zone: "grounds", name: "Foyer", tone: "slate",
    boxed: "The elegant entry hall features a broad skylight and hardwood floors painted with green-and-silver geometric designs, though a wide rug covers the centre. Flanking the main door stand two lifelike terra-cotta statues of the Kelorbeyan founding ancestors, each holding a sword close to the breast in salute and resting another hand atop a shield bearing the family's silverfern heraldry. Broad hallways lead to the rest of the manor, and a doorless opening leads to the dining room to the northwest. A long wardrobe against the northeast wall serves as a coat room.",
    beats: [
      ["Under the rug", "A red flower design, which Doatara covered over to appease her pairaka ally."],
      ["Guests", "Escorted, this is one of the few rooms they're allowed into. Servants pass through, politely redirecting the unescorted and cowering from obvious intruders."]
    ],
    altNote: { interior: { terracotta: "These statues are the animated terra-cotta warriors. They engage obvious intruders; otherwise they wander short distances to investigate disturbances as Awareness climbs." } } },

  { id: "A4", key: "a4", zone: "grounds", name: "Dining Room", tone: "ember",
    boxed: "A long table with fourteen chairs spans much of the room. Along the north wall stands an elegant, glass-fronted cabinet displaying the estate's finest porcelain and silver services, while the east wall holds a long, low cabinet of additional flatware with a wide surface for staging dishes.",
    text: "This is where Doatara killed Teskorbito, and the room still carries the evidence.",
    checks: [
      "DC 22 Perception — shallow cuts gouge the dining table where Doatara and Teskorbito's blades clashed, and a faint red speckled stain marks part of the ceiling.",
      "DC 15 Assassin Lore — the stain is all that remains of Teskorbito, whose Crimson Shroud dissolved his body into red mist when he died. Yacob has the same ability, and the Red Mantis Primer handout describes it, so the players may make the connection themselves.",
      "DC 20 Crafting or Nature — broken glass, and floorboards scorched by electricity and fire from Doatara's bombs. This tells the party which element to guard against with Eteleon's scroll of resist energy."
    ],
    only: { doatara: "poisoner", check: 2 } },

  { id: "A5", key: "a5", zone: "grounds", name: "Great Hall", tone: "plum",
    boxed: "With a high ceiling, leather couches, broad windows, and a large but unlit fireplace, this spacious hall is built for comfort. To the west towers a white-feathered arctic owlbear, artfully posed on its hind feet and preserved with taxidermy as a fierce trophy. An array of weapons is mounted above the fireplace mantle.",
    treasure: "Two spears of Ulfen design, a Shoanti-made greataxe, and a sawtooth saber. The first three are fairly mundane; the saber is a magical bloodletting sawtooth saber, and it belonged to Teskorbito. DC 16 Assassin Lore recognises the signature blade as the missing gnome's.",
    altNote: { interior: { shadow: "The owlbear houses the greater shadow, in service to Norgorber, which peeks out to watch for intruders." } } },

  { id: "A6", key: "a6", zone: "manor", name: "Kitchen", tone: "ember",
    boxed: "This well-outfitted kitchen contains terra-cotta ovens, low grills, and tables for preparing food. A storage closet to the northeast holds sundry pots and pans. The southeast door leads to a vertical tunnel and ladder that ascend to a hatch and the manor's roof.",
    text: "A key to the pantry hangs beside the door into A7. Two or three servants are here at any time, preparing food, refilling hors d'oeuvre trays, or mixing lightly spiced wine.",
    checks: [
      "DC 15 Stealth — sneak past the servants.",
      "DC 17 Intimidation — Coerce them into silence."
    ],
    note: "The servants are noncombatants. They take reasonable action to preserve their own lives and only try to escape for help given a clear opportunity." },

  { id: "A7", key: "a7", zone: "manor", name: "Pantry", tone: "moss",
    boxed: "A plethora of dry goods, canned fruits, bottled beverages, spices, and cooking fuel line this large pantry's shelves.",
    text: "The door has a basic lock — two successful DC 20 Thievery checks — and the key hangs near the entrance in A6. Senior staff lock it during off hours to keep servants from pilfering expensive food.",
    cellarRoute: "a7" },

  { id: "A8", key: "a8", zone: "manor", name: "Guest Bathroom", tone: "muted",
    boxed: "This softly illuminated bathroom includes a flushing toilet, a sink with running water, clean towels, and fragrant soaps.",
    text: "The one interior room guests are escorted to, which makes it the obvious cover story for being inside at all." },

  { id: "A9", key: "a9", zone: "manor", name: "South Hall", tone: "rust",
    boxed: "This hallway opens into a small antechamber with many doors.",
    text: "Doatara lets staff into the south wing only occasionally, for cleaning, and forbids everyone else. Guests at the party think they've glimpsed her through these windows — that is the body double at work." },

  { id: "A10", key: "a10", zone: "manor", name: "Study", tone: "slate",
    boxed: "This spacious study contains shelves along each wall, wide windows to capture the afternoon sun, a sturdy desk, and several cushy chairs around a low table. The books range from fanciful fiction and exhilarating travelogues to political treatises and records tied to the estate's long history.",
    text: "Both doors are locked, requiring three successful DC 22 Thievery checks. The desk holds writing materials and half-filled ledgers showing a marked increase in spending on ambiguously referenced \"contractors\" — the mercenaries and trap-builders who have quietly helped guard and renovate the property.",
    checks: [
      "Two successful DC 24 Thievery checks — the desk's smallest drawer, holding a scroll of heal (3rd level) and a thin encoded journal.",
      "10 minutes and DC 25 Society to Decipher the Writing — the journal is a hit list of Doatara's past and future victims. The most recent kill is squeezed into the margin as though unexpected: a Red Mantis assassin, slain two days ago. The next target isn't named, but the entry reads \"Poison — prepare dose by 15th.\""
    ],
    note: "She is in area B right now, brewing that very toxin.",
    treasure: "A scroll of heal (3rd level), in the locked drawer." },

  { id: "A11", key: "a11", zone: "manor", name: "Chapel", tone: "gold",
    boxed: "A handsome private chapel dedicated to Iomedae, this room features an altar, a small statue of the goddess, carvings of old Kelorbeyan scions bearing articles of the faith, a solidly built wooden chest, and a weapon rack with two blunted longswords for drills and ceremonies in the Inheritor's name. The bottom half of each window is clear; the top half depicts one of Iomedae's legendary acts in stained glass. Each window has a set of shades, currently raised.",
    text: "Doatara secretly contracted renovators loyal to Norgorber. Lowering and latching each window shade loosens the weapon rack's wall mount, and shifting that horizontally transforms several of the room's religious fixtures.",
    checks: ["DC 24 Perception — identify the moving parts in the altar and the weapon mount, and how to work them."],
    beats: [
      ["In its Norgorberite configuration", "Iomedae's statue sinks into the altar, the lights dim, narrow black tapestries unfurl from several walls, and four panels in the altar rotate to reveal masks of Norgorber's four guises — the Gray Master, Father Skinsaw, Blackfingers, and the Reaper of Reputation."]
    ],
    treasure: "The heavy chest holds cleanly folded Iomedaean vestments, cloth ritual objects, a finely tooled longsword sheath, and four flasks of holy water.",
    cellarRoute: "a11" },

  { id: "A12", key: "a12", zone: "manor", name: "Guest Bedroom", tone: "muted",
    boxed: "This bedroom contains a bed, a dresser, and a standing vanity with a wash basin. The room is neatly prepared, as if ready for use, yet it seems untouched for a month or more; dust lines the basin, the bedsheets are musty, and motes of dust float through the air." },

  { id: "A13", key: "a13", zone: "manor", name: "Main Bathroom", tone: "slate",
    boxed: "This spacious bathroom includes a bathtub, sink, toilet, and cabinets stocked with a handful of toiletries. A wall-mounted tank bears a minor enchantment that slowly fills it with water, with pipes channelling it to the room's other features.",
    checks: ["DC 20 Perception — recent, faint bloody residue, left when Doatara washed her hands after killing Teskorbito."] },

  { id: "A14", key: "a14", zone: "manor", name: "Closet", tone: "ember",
    boxed: "This large closet contains an assortment of linens and other household goods.",
    text: "Doatara disposed of Teskorbito's armour here after killing him in A4, and its bloody residue has stained several folded sheets. The armour has settled against the door, and opening the closet brings it tumbling out.",
    checks: ["DC 20 Reflex — an adjacent PC catches the falling armour. Otherwise it hits the ground with a jarring clatter and the party earns 1 AP."],
    treasure: "Teskorbito's +1 studded leather and a Red Mantis mask, both sized for a Small user.",
    apRisk: 1 },

  { id: "A15", key: "a15", zone: "manor", name: "Gallery", level: "Low 6", tone: "plum",
    boxed: "The oldest part of the manor's surface construction, the 30-foot tower has two levels connected by a banistered staircase along the eastern edge. The ground floor has been converted into a combination lounge and art gallery. Shelves of liquor are built under the staircase, with an oak bar in front of them for mixing drinks. A low table stands to one side, surrounded by plush chairs. The walls feature artwork from around the Inner Sea, favouring the subarctic: scrimshaw from the Lands of the Linnorm Kings, a winter wolf pelt from Irrisen, a ceremonial Kellid helmet of mammoth ivory scales, a mannequin wearing Sarkorian battle regalia, and more.",
    guardian: "interior",
    treasure: "A wealth of uncommon and pricey alcohol: a particularly old bottle of Taldan fire-brandy, a dusty glass of the widely sought-after Oldlaw whiskey, and a smaller bottle of Urglin gin, potent enough to burn.",
    treasureAlt: { doatara: { poisoner: "Stowed among the bottles are a moderate quicksilver mutagen and a moderate mistform elixir." } },
    cellarRoute: "a15",
    altNote: { interior: { terracotta: "The mannequin in Sarkorian regalia is the second terra-cotta warrior, with the first among the statues in A3." } } },

  { id: "A16", key: "a16", zone: "manor", name: "Main Bedroom", tone: "gold",
    boxed: "This is the manor's main bedroom, which Doatara uses regularly. It has two narrow windows looking out onto the roof, a soft bed, nightstands, a wardrobe, a washstand, and a low bookshelf.",
    text: "The door is locked, requiring three successful DC 22 Thievery checks. The tower's western windows open into this room.",
    treasure: "Arrayed above the bed is a semicircular sunburst of eleven crossbow bolts — five low-grade cold iron, five low-grade silver, and one beacon shot. Stowed beneath the bed is a +1 crossbow." }
];

/* -------------------------------------------------------------- the cellar */
const CELLAR = {
  id: "B", name: "Forgotten Cellar", level: "Severe 6", tone: "plum",
  boxed: "Everbloom Manor rests atop four millennia of construction in layers over 50 feet thick. A great set of ruins, undisturbed for centuries, lies beneath it — half-collapsed palace ruins dating back to Absalom's Age of Excess, used for some unknown purpose in that time.",
  text: "Doatara rediscovered them. The space is large enough to hide in, and a passage east eventually reaches a secret door in Absalom's sewers, giving her a covert way in and out.",
  features: [
    ["The floor", "Uneven flagstones under 10-foot ceilings. An impermeable stretch of sinking flagstones has collected standing water about eight inches deep — not enough to impede movement, but enough to show where an invisible creature is standing."],
    ["The light", "Unlit except in the northwest, where two lanterns hang from the wall over a workbench, and obscuring robes have been draped over the statue of a forgotten noble to make the figure look like Norgorber."]
  ],
  scene: "Doatara is preparing the tools for her next assassination — most notably a venom she has almost finished brewing. She's still in her fine clothing, planning to clean up by magical or alchemical means and make a stylishly late appearance at her own party. A ceustodaemon, a willing servant granted by Norgorber, stands watch.",
  creatures: [
    { name: "Doatara Kelorbeyan", level: "Creature 7 · unique", source: "Adventure page 19 or 22", alt: "doatara" },
    { name: "Ceustodaemon", level: "Creature 6", source: "Bestiary 71" }
  ],
  tactics: [
    "If she hears the PCs coming, she Hides behind the statue and waits to ambush them.",
    "She prefers off-guard targets, flanking with the ceustodaemon or Feinting to make them off-guard whenever it's convenient.",
    "The ceustodaemon acts as a bodyguard: pinning down a few PCs, serving as a flanking partner, or using its Breath Weapon on a cluster of them.",
    "She taunts throughout — promising to kill the Red Mantis as she did their gnome friend, and swearing to gut Kangir for turning on her employer."
  ],
  tacticsAlt: {
    poisoner: "Her favoured strategy is melee with her poisoned shortsword; she carries several bombs for when a ranged attack suits better.",
    priest: "She casts invisibility and tries to assassinate PCs with Channel Smite and spellcasting. Against opponents who resist her harm effectively, she switches to poisoning her weapon — and with enough actions she'll poison the weapon and Channel Smite for one devastating attack."
  },
  conclusion: {
    lead: "Once Doatara is dead the PCs need to leave, and that's a victory lap rather than a challenge. There is no wrong approach.",
    prompts: [
      "Do they slip away, leaving her body beside a blood-scrawled warning to respect the Red Mantis?",
      "Do they crash the party, hurling proof of the deed among the terrified guests?",
      "Something else entirely — let each player add their own touch to the narration.",
      "Does Eteleon intend to recruit Kangir into the Red Mantis? Have Yacob and Zeah settled their rivalry? What do they do with Teskorbito's gear, and how do they send him off?"
    ],
    after: "In the following days the Vernai make contact and congratulate them. Back at the Crimson Citadel their fellow assassins whisper approvingly of the deed, and it's only a matter of time before they're called to take another life."
  }
};

/* --------------------------------------------------------------- the pregens
   Named only. Their sheets are in the free pregenerated characters PDF; what
   matters here is which of them a rule singles out. */
const PREGENS = [
  { name: "Eteleon", role: "the Mentor", cls: "Cleric 6", tone: "rust",
    hook: "Choose a skill to become trained in with Ancestral Longevity once the plan is settled. Carries the scroll of resist energy that A4's scorch marks tell you how to use." },
  { name: "Kangir", role: "the Muscle", cls: "Fighter 6", tone: "ember",
    hook: "Swipes manor keys at DC 20 rather than 22, thanks to Pickpocket. She's the one the guard in Do I Know You? recognises, and she can assassinate at range." },
  { name: "Yacob", role: "the Deadly Doctor", cls: "Monk 6", tone: "moss",
    hook: "Has Crimson Shroud, the same ability that left the stain on A4's ceiling — the players may recognise it before any check is rolled." },
  { name: "Zeah", role: "the Perfectionist", cls: "Rogue 6", tone: "plum",
    hook: "Prepares spells after the plan is settled, not before — jump, pest form, and spider climb open infiltration routes; blur and true strike serve the fight. She can assassinate at range." }
];

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1, tab: "plan", pcs,
    alt: { doatara: "poisoner", exterior: "shambler", interior: "pairaka", cellar: "a11" },
    traps: { t1: { type: "boreal", where: "a5" }, t2: { type: "darts", where: "a9" } },
    /* Legwork: one entry per phase per PC, keyed `phase:pcIndex`. Everything
       the legwork contributes — Edge Points, Awareness — is read back out of
       these, so changing a result changes the board and nothing else. */
    plan: { entries: {}, spent: {}, facts: { doatara: {}, manor: {}, scope: {} } },
    /* Obstacles: only the ones brought into play have turns. A turn holds a
       degree per PC plus any no-check help; closing it costs the party 1 AP. */
    obstacles: {},
    comps: [],      // [{ key, deg }] — one entry per complication check attempted
    kills: [],      // [{ how, deg }] — Red Mantis Assassination and open combat
    apAdd: [],      // [{ n, label }] — the awareness the book charges by hand
    fired: {},      // which ladder rungs have had their complication run
    areas: {},      // area key -> cleared
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
  while (list.length < MAX_PCS) {
    const p = PREGENS[list.length];
    list.push({ name: p ? p.name : `PC ${list.length + 1}`, actorId: "", img: "icons/svg/mystery-man.svg" });
  }
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
  if (!game.settings.settings.has(MM_ID)) {
    game.settings.register(MM_NS, MM_KEY, { scope: "world", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const areaFor = (key) => AREAS.find(a => a.key === key);
const activityFor = (key) => ACTIVITIES.find(a => a.key === key);
const obstacleFor = (key) => OBSTACLES.find(o => o.key === key);
const compFor = (key) => COMPLICATIONS.find(c => c.key === key);

/* ------------------------------------------------------- reading the actors
   The party's own modifiers turn each check into an assignment decision, so
   every activity and obstacle can say who should take it. Read live from the
   PF2e actors; a world without them simply shows nothing. */
function modFor(actor, name) {
  if (!actor) return null;
  const n = String(name).trim();
  if (n === "Perception") {
    const v = actor.perception?.mod ?? actor.system?.perception?.mod ?? actor.system?.attributes?.perception?.value;
    return Number.isFinite(v) ? v : null;
  }
  if (SAVES.includes(n)) {
    const key = n.toLowerCase();
    const v = actor.saves?.[key]?.mod ?? actor.system?.saves?.[key.slice(0, 3)]?.value;
    return Number.isFinite(v) ? v : null;
  }
  const skills = actor.skills;
  if (!skills) return null;
  const direct = skills[checkSlug(n)];
  if (Number.isFinite(direct?.mod)) return direct.mod;
  const named = Object.values(skills).find(s => String(s?.label ?? "").toLowerCase() === n.toLowerCase());
  return Number.isFinite(named?.mod) ? named.mod : null;
}

/* ----------------------------------------------------------------- engine */
class Mantis {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }
  log(m) { this.s.log.unshift(m); this.s.log = this.s.log.slice(0, 40); }
  async save() { if (this.editable) await game.settings.set(MM_NS, MM_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  actorOf(i) { return this.s.pcs[i]?.actorId ? game.actors.get(this.s.pcs[i].actorId) : null; }

  /* Best d20 result each PC needs, across every way the check can be made.
     Returns null when no actor in the world can answer the question. */
  needsFor(checks, { pcIndex = null, dcShift = 0 } = {}) {
    const rows = [];
    const idx = pcIndex === null ? this.s.pcs.map((_, i) => i) : [pcIndex];
    for (const i of idx) {
      const actor = this.actorOf(i);
      if (!actor) continue;
      let best = null;
      for (const c of checks) {
        if (c.strike) continue;
        /* A check the book hands to one named PC isn't an assignment choice. */
        if (c.who && !new RegExp(c.who, "i").test(this.s.pcs[i]?.name ?? "")) continue;
        const dc = this.dcFor(c, i) + dcShift;
        for (const skill of c.skills) {
          const mod = modFor(actor, skill);
          if (mod === null) continue;
          const need = dc - mod;
          if (!best || need < best.need) best = { need, skill, mod, dc };
        }
      }
      if (best) rows.push({ i, name: this.s.pcs[i].name, ...best });
    }
    return rows.sort((a, b) => a.need - b.need);
  }

  /* Kangir's Pickpocket lowers the Swipe Manor Keys DC, and she's named for it
     in the book, so a PC actually called Kangir gets it. */
  dcFor(check, pcIndex) {
    if (check.kangirDc && /kangir/i.test(this.s.pcs[pcIndex]?.name ?? "")) return check.kangirDc;
    return check.dc;
  }

  /* ------------------------------------------------------------- legwork */
  entry(phase, pc) { return this.s.plan.entries[`${phase}:${pc}`] ?? null; }
  usedActivity(pc, key, phase) {
    return [1, 2].some(p => p !== phase && this.entry(p, pc)?.activity === key);
  }
  manorAttempts() {
    return Object.values(this.s.plan.entries).filter(e => e.activity === "manor" && e.result).length;
  }
  setActivity(phase, pc, key) {
    const id = `${phase}:${pc}`;
    const cur = this.s.plan.entries[id];
    if (cur?.activity === key) delete this.s.plan.entries[id];
    else this.s.plan.entries[id] = { activity: key, result: cur?.activity === key ? cur.result : null };
    delete this.s.plan.spent[id];
    this.touch();
  }
  setPlanResult(phase, pc, deg) {
    const id = `${phase}:${pc}`;
    const e = this.s.plan.entries[id];
    if (!e) return ui.notifications.warn("Pick the activity first.");
    e.result = e.result === deg ? null : deg;
    if (!e.result) delete this.s.plan.spent[id];
    this.log(`${this.s.pcs[pc].name}: ${activityFor(e.activity).short} — ${e.result ? DEG_LABEL[e.result] : "cleared"}.`);
    this.touch();
  }
  toggleFact(group, key) {
    const set = this.s.plan.facts[group];
    if (set[key]) delete set[key]; else set[key] = true;
    this.touch();
  }
  toggleSpend(id) {
    if (this.s.plan.spent[id]) delete this.s.plan.spent[id];
    else this.s.plan.spent[id] = true;
    this.touch();
  }

  /* Edge Points, read back out of the legwork rather than counted separately. */
  get epList() {
    const out = [];
    for (const [id, e] of Object.entries(this.s.plan.entries)) {
      if (!e.result) continue;
      const [phase, pc] = id.split(":");
      const who = this.s.pcs[Number(pc)]?.name ?? `PC ${Number(pc) + 1}`;
      if (e.activity === "prepare" && ["s", "f", "cf"].includes(e.result)) {
        out.push({
          id, who, phase: Number(phase), from: "Prepare Tools",
          note: e.result === "s" ? "A tool for one obstacle — describe the flashback when it's spent."
            : "Looks like a tool. Does nothing when spent.",
          dud: e.result !== "s", cursed: e.result === "cf",
          spent: !!this.s.plan.spent[id]
        });
      }
      if (e.activity === "distraction" && ["cs", "s"].includes(e.result)) {
        out.push({
          id, who, phase: Number(phase), from: "Timely Distraction",
          note: "Spendable while the party is still outside the manor.",
          dud: false, cursed: false, spent: !!this.s.plan.spent[id]
        });
      }
    }
    return out.sort((a, b) => a.phase - b.phase);
  }
  get keysWon() {
    let plain = 0, security = false;
    for (const e of Object.values(this.s.plan.entries)) {
      if (e.activity !== "keys" || !e.result) continue;
      if (e.result === "cs") { plain++; security = true; }
      else if (e.result === "s") plain++;
    }
    return { plain, security };
  }
  get hasMap() {
    return Object.values(this.s.plan.entries).some(e => e.activity === "scope" && e.result);
  }

  /* ---------------------------------------------------------- obstacles */
  ob(key) { return this.s.obstacles[key] ?? null; }
  toggleObstacle(key) {
    if (this.s.obstacles[key]) delete this.s.obstacles[key];
    else this.s.obstacles[key] = { turns: [{ results: {}, auto: 0, closed: false }] };
    this.log(`${obstacleFor(key).label}: ${this.s.obstacles[key] ? "in play" : "removed"}.`);
    this.touch();
  }
  setObResult(key, turn, pc, deg) {
    const t = this.s.obstacles[key]?.turns?.[turn];
    if (!t) return;
    t.results[pc] = t.results[pc] === deg ? null : deg;
    if (!t.results[pc]) delete t.results[pc];
    this.touch();
  }
  bumpAuto(key, turn, n) {
    const t = this.s.obstacles[key]?.turns?.[turn];
    if (!t) return;
    t.auto = Math.max(0, (t.auto ?? 0) + n);
    this.touch();
  }
  closeTurn(key) {
    const o = this.s.obstacles[key];
    if (!o) return;
    const last = o.turns[o.turns.length - 1];
    last.closed = true;
    if (this.obIp(key) < OB_IP) o.turns.push({ results: {}, auto: 0, closed: false });
    this.log(`${obstacleFor(key).label}: turn ended, +1 AP.`);
    this.touch();
  }
  undoTurn(key) {
    const o = this.s.obstacles[key];
    if (!o) return;
    if (o.turns.length > 1 && !o.turns[o.turns.length - 1].closed) o.turns.pop();
    const last = o.turns[o.turns.length - 1];
    if (last) last.closed = false;
    this.touch();
  }
  obIp(key) {
    const o = this.s.obstacles[key];
    if (!o) return 0;
    let ip = 0;
    for (const t of o.turns) {
      ip += t.auto ?? 0;
      for (const deg of Object.values(t.results)) ip += deg === "cs" ? 2 : deg === "s" ? 1 : 0;
    }
    return Math.min(ip, OB_IP);
  }
  obApParts(key) {
    const o = this.s.obstacles[key];
    if (!o) return [];
    const out = [];
    o.turns.forEach((t, i) => {
      for (const deg of Object.values(t.results)) {
        if (deg === "f") out.push({ n: 1, why: `${obstacleFor(key).label} — a failure` });
        if (deg === "cf") out.push({ n: 2, why: `${obstacleFor(key).label} — a critical failure` });
      }
      if (t.closed) out.push({ n: 1, why: `${obstacleFor(key).label} — end of turn ${i + 1}` });
    });
    return out;
  }
  get ip() {
    return Object.keys(this.s.obstacles).reduce((n, k) => n + this.obIp(k), 0);
  }

  /* ------------------------------------------------------- complications */
  addComp(key, deg) { this.s.comps.push({ key, deg }); this.log(`${compFor(key).label}: ${DEG_LABEL[deg]}.`); this.touch(); }
  dropComp(i) { this.s.comps.splice(i, 1); this.touch(); }

  /* -------------------------------------------------------------- kills */
  addKill(how, deg) {
    this.s.kills.push({ how, deg });
    this.log(how === "assassination" ? `Assassination: ${deg === "sw" ? "success, witnessed" : DEG_LABEL[deg] ?? deg}.` : "A guard killed in open combat.");
    this.touch();
  }
  dropKill(i) { this.s.kills.splice(i, 1); this.touch(); }
  get guardsLeft() { return Math.max(0, GUARDS.total - this.s.kills.length); }
  get joinRule() { return GUARDS.joinRules.find(r => this.guardsLeft >= r.min) ?? GUARDS.joinRules[GUARDS.joinRules.length - 1]; }

  /* ----------------------------------------------------------- awareness */
  addAp(n, label) { this.s.apAdd.push({ n, label }); this.touch(); }
  dropAp(i) { this.s.apAdd.splice(i, 1); this.touch(); }

  /* Every source of Awareness in one place, each traceable to what caused it.
     Nothing is stored as a running total, so any tick can be taken back. */
  get apParts() {
    const out = [];
    for (const [id, e] of Object.entries(this.s.plan.entries)) {
      if (!e.result) continue;
      const a = activityFor(e.activity);
      const award = a?.awards?.[e.result];
      if (award?.ap) {
        const who = this.s.pcs[Number(id.split(":")[1])]?.name ?? "A PC";
        out.push({ n: award.ap, why: `${a.short} — ${who}` });
      }
    }
    for (const key of Object.keys(this.s.obstacles)) out.push(...this.obApParts(key));

    /* Cornered can't cost more than 4 however many PCs botch it. */
    const byComp = {};
    for (const c of this.s.comps) {
      const def = compFor(c.key);
      const n = def?.awards?.[c.deg] ?? 0;
      if (n) (byComp[c.key] ??= []).push(n);
    }
    for (const [key, list] of Object.entries(byComp)) {
      const def = compFor(key);
      let total = list.reduce((a, b) => a + b, 0);
      if (def.cap && total > def.cap) total = def.cap;
      if (total) out.push({ n: total, why: `${def.label}${def.cap && list.reduce((a, b) => a + b, 0) > def.cap ? " (capped)" : ""}` });
    }

    for (const k of this.s.kills) {
      if (k.how !== "assassination") continue;
      const d = ASSASSINATION.degrees.find(x => x.k === k.deg);
      if (d?.ap) out.push({ n: d.ap, why: `Assassination — ${d.label.toLowerCase()}` });
    }
    for (const a of this.s.apAdd) out.push({ n: a.n, why: a.label });
    return out;
  }
  get ap() { return Math.max(0, this.apParts.reduce((n, p) => n + p.n, 0)); }
  get dcBump() { return this.ap >= 8 ? 1 : 0; }
  get rungs() { return LADDER.filter(r => this.ap >= r.at); }
  toggleFired(at) {
    if (this.s.fired[at]) delete this.s.fired[at]; else this.s.fired[at] = true;
    this.touch();
  }

  /* ----------------------------------------------------------- alternates */
  setAlt(group, value) {
    this.s.alt[group] = value;
    this.log(`${ALTS[group].label}: ${ALTS[group].options.find(o => o.key === value).label}.`);
    this.touch();
  }
  setTrap(slot, field, value) {
    this.s.traps[slot][field] = value;
    this.touch();
  }
  trapsAt(where) {
    return Object.entries(this.s.traps).filter(([, t]) => t.where === where)
      .map(([slot, t]) => ({ slot, ...t, def: TRAP_TYPES[t.type] }));
  }
  altOption(group) {
    return ALTS[group].options.find(o => o.key === this.s.alt[group]) ?? ALTS[group].options[0];
  }

  toggleArea(key) {
    const on = !!this.s.areas[key];
    this.s.areas[key] = !on;
    this.log(`${areaFor(key).id}: ${on ? "reopened" : "done"}.`);
    this.touch();
  }

  reset() {
    this.state = blankState(this.s.pcs);
    ui.notifications.info("Mark of the Mantis reset.");
    this.touch();
  }

  /* --------------------------------------------------- chat and compendium */
  async postCard(eyebrow, title, bodyHtml, tone = "rust") {
    const C = { ember: "#dd9046", moss: "#5fbb8b", slate: "#6f9fca", plum: "#a97fd2",
                gold: "#d9b45f", rust: "#d9483f", muted: "#a6868f" };
    await ChatMessage.create({
      content: `<div style="background:#1d1216;color:#ece0e2;border:1px solid #3b2630;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.rust};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#a6868f">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "Mark of the Mantis" }
    });
  }

  /* No adventure module ships this one-shot, so a creature is found by name
     across whatever actor compendiums the world has. The page is in the
     button's tooltip either way, so a miss still tells the GM where to look. */
  async openCreature(name, source) {
    if (!game.packs) return ui.notifications.warn("No compendiums available here.");
    const packs = [...game.packs].filter(p => p.documentName === "Actor");
    for (const pack of packs) {
      const index = await pack.getIndex();
      const hit = [...index].find(e => e.name?.toLowerCase() === name.toLowerCase());
      if (hit) {
        const doc = await pack.getDocument(hit._id);
        if (doc) return doc.sheet.render(true);
      }
    }
    ui.notifications.warn(`No compendium actor named "${name}". Its stat block is in ${source}.`);
  }

  postBoxed(key) {
    if (key === "opening") return this.postCard("Planning the Strike", "The Caliphas Dream",
      OPENING.boxed.split("\n\n").map(p => `<p style="margin:0 0 6px;font-style:italic">${p}</p>`).join(""), "rust");
    if (key === "cellar") return this.postCard(`${CELLAR.id} · ${CELLAR.level}`, CELLAR.name,
      `<p style="margin:0 0 6px;font-style:italic">${CELLAR.boxed}</p><p style="margin:0">${CELLAR.text}</p>`, CELLAR.tone);
    const a = areaFor(key);
    if (a?.boxed) return this.postCard(`${a.id}${a.level ? ` · ${a.level}` : ""}`, a.name,
      `<p style="margin:0;font-style:italic">${a.boxed}</p>`, a.tone);
    return ui.notifications.warn("Nothing to read aloud there.");
  }

  postActivity(key) {
    const a = activityFor(key);
    const checks = a.checks.map(c => linkify(`DC ${c.dc} ${c.skills.join(" or DC " + c.dc + " ")}`)).join(" · ");
    return this.postCard(a.traits.join(" · "), a.label,
      `<p style="margin:0 0 6px">${a.lead}</p><p style="margin:0 0 6px"><b>${checks}</b></p>
       ${a.degrees.map(([d, t]) => `<p style="margin:0 0 4px"><b>${DEG_LABEL[d]}</b> ${t}</p>`).join("")}`,
      a.tone);
  }

  postObstacle(key) {
    const o = obstacleFor(key);
    const bump = this.dcBump;
    const checks = o.checks.map(c => linkify(c.skills.map(s => `DC ${c.dc + bump} ${s}`).join(" or "))).join(" · ");
    return this.postCard(`Obstacle · ${OB_IP} Infiltration Points (group)`, o.label,
      `<p style="margin:0 0 6px;font-style:italic">${o.text}</p><p style="margin:0"><b>${checks}</b>${bump ? " — including the +1 from 8 Awareness Points" : ""}</p>`,
      o.tone);
  }

  postStatus() {
    const ap = this.ap, rung = this.rungs[this.rungs.length - 1];
    const ep = this.epList.filter(e => !e.spent).length;
    return this.postCard("Mark of the Mantis", "The job so far",
      `<p style="margin:0 0 6px"><b>Infiltration</b> ${this.ip} of ${IP_GOAL} · <b>Edge Points</b> ${ep} unspent · <b>Guards</b> ${this.guardsLeft} of ${GUARDS.total}</p>
       <p style="margin:0"><b>Awareness</b> ${ap}${rung ? ` — ${rung.label.toLowerCase()}` : ""}</p>`,
      ap >= 11 ? "rust" : ap >= 5 ? "ember" : "moss");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class MMApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "mm-console", tag: "div", classes: ["mm-console"],
    position: { width: 940, height: "auto" },
    window: { title: "Mark of the Mantis", icon: "fa-solid fa-bug", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "mm-console", classes: ["mm-console"], title: "Mark of the Mantis",
      width: 940, height: "auto", resizable: true
    });
  }
  get title() { return "Mark of the Mantis"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="mm-root">${this.markup()}</div>`);
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
    return `${this.styles()}
      <div class="mm">
        ${this.header(ro)}
        <nav class="tabs">
          ${TABS.map(x => `<button type="button" class="tab ${s.tab === x.key ? "on" : ""}" style="--tt:var(--${x.tone})" data-act="tab" data-k="${x.key}">
            <b><i class="fa-solid ${x.icon}"></i> ${x.label}</b><small>${x.sub}</small></button>`).join("")}
        </nav>
        ${s.tab === "plan" ? this.planTab(ro) : ""}
        ${s.tab === "infil" ? this.infilTab(ro) : ""}
        ${s.tab === "grounds" ? this.zoneTab("grounds", ro) : ""}
        ${s.tab === "manor" ? this.zoneTab("manor", ro) : ""}
        ${s.tab === "cellar" ? this.cellarTab(ro) : ""}
        ${s.tab === "alt" ? this.altTab(ro) : ""}
      </div>`;
  }

  header(ro) {
    const t = this.t, ap = t.ap, ip = t.ip;
    const rung = t.rungs[t.rungs.length - 1];
    const ep = t.epList.filter(e => !e.spent).length;
    const keys = t.keysWon;
    return `
      <header class="topbar">
        <div class="score">
          <span>Infiltration</span><b class="${ip >= IP_GOAL ? "hit" : ""}">${ip}<i>/${IP_GOAL}</i></b>
        </div>
        <div class="score aw ${ap >= 11 ? "hot" : ap >= 5 ? "warm" : ""}">
          <span>Awareness</span><b>${ap}</b>
        </div>
        <div class="lamps">
          <span class="lamp ${ep ? "lit" : ""}" title="Edge Points earned in the legwork and not yet spent"><i class="fa-solid fa-certificate"></i>${ep} EP</span>
          <span class="lamp ${keys.plain || keys.security ? "lit" : ""}" title="${keys.security ? "Including the security key: +2 circumstance to Disable the manor's traps" : "Keys lifted during the legwork"}"><i class="fa-solid fa-key"></i>${keys.plain}${keys.security ? " +sec" : ""}</span>
          <span class="lamp ${t.hasMap ? "lit" : ""}" title="The unmarked map at the back of the adventure"><i class="fa-solid fa-map"></i>Map</span>
          <span class="lamp ${t.guardsLeft < GUARDS.total ? "lit" : ""}" title="${esc(t.joinRule.text)}"><i class="fa-solid fa-shield-halved"></i>${t.guardsLeft} guards</span>
        </div>
        <div class="rung ${rung ? "on" : ""}" style="--tone:var(--${rung?.tone ?? "muted"})">
          ${rung ? `<b>${rung.label}</b><small>at ${rung.at} AP</small>` : `<b>Unnoticed</b><small>nothing has stirred</small>`}
        </div>
        <button type="button" class="say" data-act="poststatus" title="Post the state of the job to chat"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="reset" title="Reset the adventure" ${ro ? "disabled" : ""}><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  /* Who should take this check — the party's own modifiers, best first. */
  whoRow(checks, opts = {}) {
    const rows = this.t.needsFor(checks, opts);
    if (!rows.length) return "";
    return `<div class="who">${rows.map((r, i) => `
      <span class="cand ${i === 0 ? "best" : ""}" title="${esc(`${r.skill} ${r.mod >= 0 ? "+" : ""}${r.mod} against DC ${r.dc}`)}">
        ${esc(r.name)} <em>${r.skill}</em> <b>${Math.max(2, Math.min(20, r.need))}+</b>
      </span>`).join("")}</div>`;
  }

  checkLine(checks, dcShift = 0) {
    return checks.map(c => c.strike
      ? `a Strike against AC ${c.dc + dcShift}`
      : `DC ${c.dc + dcShift} ${c.skills.join(" or ")}${c.who ? ` (${c.who} only)` : ""}`).join(" · ");
  }

  creatureBtn(name, source, extra = "") {
    return `<button type="button" class="mon" data-act="creature" data-k="${esc(name)}" data-src="${esc(source)}"
      title="${esc(`Open ${name} from a compendium. Stat block: ${source}.`)}">
      <i class="fa-solid fa-skull"></i>${esc(name)}${extra ? ` <em>${esc(extra)}</em>` : ""}</button>`;
  }

  /* --------------------------------------------------------- planning tab */
  planTab(ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--rust)">
        <h3>Planning the Strike <small>${OPENING.where.split(".")[0]}</small>
          <button type="button" class="say" data-act="postboxed" data-k="opening" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        ${OPENING.boxed.split("\n\n").map(p => `<p class="boxed">${p}</p>`).join("")}
        <p class="note">${OPENING.shopping}</p>
        <p class="note"><b>What's actually happened:</b> ${OPENING.truth}</p>
        <p class="note">${OPENING.handouts}</p>
      </section>

      ${this.phaseBlock(1, ro)}
      ${this.phaseBlock(2, ro)}
      ${this.epPanel(ro)}
      ${["doatara", "manor", "scope"].map(g => this.factPanel(g, ro)).join("")}

      <section class="panel" style="--tone:var(--gold)">
        <h3>Before they go in</h3>
        <ul class="checks">
          <li>Time to refine the plan and make any last purchases.</li>
          ${PREGENS.filter(p => /Ancestral Longevity|Prepares spells/.test(p.hook)).map(p =>
            `<li><b>${p.name}</b> — ${p.hook.split(".")[0]}.</li>`).join("")}
          <li>Answer any remaining questions, then begin the infiltration.</li>
        </ul>
        <p class="note">${OPENING.clock}</p>
      </section>`;
  }

  phaseBlock(phase, ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--slate)">
        <h3>Phase ${phase} <small>one activity each, then they reconvene and share</small></h3>
        <div class="legwork">
          ${t.s.pcs.map((pc, i) => this.legworkRow(phase, i, pc, ro)).join("")}
        </div>
      </section>`;
  }

  legworkRow(phase, i, pc, ro) {
    const t = this.t, e = t.entry(phase, i);
    const act = e ? activityFor(e.activity) : null;
    const manorFull = t.manorAttempts() >= 2;
    return `
      <div class="lw ${e?.result ? `res-${e.result}` : ""}">
        <img src="${pc.img}" alt="">
        <button type="button" class="cn" data-act="sheet" data-id="${pc.actorId}" title="Open this character's sheet">${esc(pc.name)}</button>
        <div class="acts">
          ${ACTIVITIES.map(a => {
            const used = t.usedActivity(i, a.key, phase);
            const blocked = a.key === "manor" && manorFull && e?.activity !== "manor";
            const on = e?.activity === a.key;
            const why = used ? "Already attempted in the other phase — each PC can attempt each activity only once."
              : blocked ? "The party has used both of its attempts at this one."
              : a.label;
            return `<button type="button" class="opt sm ${on ? "on" : ""}" data-act="activity" data-p="${phase}" data-i="${i}" data-k="${a.key}"
              ${ro || ((used || blocked) && !on) ? "disabled" : ""} title="${esc(why)}">
              <i class="fa-solid ${a.icon}"></i> ${a.short}</button>`;
          }).join("")}
        </div>
        <div class="res">
          ${act ? act.degrees.map(([d]) => `<button type="button" class="opt sm deg-${d} ${e.result === d ? "on" : ""}"
              data-act="planres" data-p="${phase}" data-i="${i}" data-k="${d}" ${ro ? "disabled" : ""}>${DEG_LABEL[d].replace("Critical", "Crit")}</button>`).join("")
            : `<span class="hint">pick an activity</span>`}
        </div>
        ${act ? `<div class="lwdetail">
          <p class="dcs">${this.checkLine(act.checks)}${act.kangirNote && /kangir/i.test(pc.name) ? ` — ${act.kangirNote}` : ""}
            <button type="button" class="say inline" data-act="postactivity" data-k="${act.key}" title="Post this activity to chat"><i class="fa-solid fa-comment"></i></button></p>
          ${this.whoRow(act.checks.map(c => ({ ...c, kangirDc: act.kangirDc })), { pcIndex: i })}
          ${e.result ? `<p class="deg"><b>${DEG_LABEL[e.result]}</b> ${(act.degrees.find(([d]) => d === e.result) ?? [null, ""])[1]}</p>` : `<p class="text">${act.lead}</p>`}
        </div>` : ""}
      </div>`;
  }

  epPanel(ro) {
    const list = this.t.epList;
    return `
      <section class="panel" style="--tone:var(--ember)">
        <h3>Edge Points <small>${list.filter(e => !e.spent).length} unspent</small></h3>
        <p class="text">An Edge Point is a specific advantage — a tool, a favour, a piece of knowledge. When a PC fails or critically fails a check to overcome an obstacle or a complication, they can spend one to succeed instead. It works for the broad activity it was earned for, so keep it flexible when the plan changes on the fly.</p>
        ${list.length ? `<div class="eplist">
          ${list.map(e => `
            <div class="ep ${e.spent ? "spent" : ""} ${e.dud ? "dud" : ""}">
              <button type="button" class="opt sm ${e.spent ? "on" : ""}" data-act="spend" data-k="${e.id}" ${ro ? "disabled" : ""}>${e.spent ? "Spent" : "Spend"}</button>
              <div>
                <b>${esc(e.who)}</b> <span class="pip">${e.from}</span> <span class="pip">phase ${e.phase}</span>
                ${e.dud ? `<span class="pip bad">${e.cursed ? "poisoned" : "worthless"}</span>` : ""}
                <div class="hint">${e.note}${e.cursed ? " Spending it turns the roll into a critical failure." : ""}</div>
              </div>
            </div>`).join("")}
        </div>` : `<p class="hint">None yet. Prepare Tools for Assassination and Orchestrate Timely Distraction are the two activities that grant them.</p>`}
        <p class="note">Failed and critically failed tools still appear here, because the PC who made one has no idea it doesn't work.</p>
      </section>`;
  }

  factPanel(group, ro) {
    const t = this.t, f = FACTS[group], set = t.s.plan.facts[group];
    const items = f.items.filter(it => !it.only || it.only === t.s.alt.doatara);
    return `
      <section class="panel" style="--tone:var(--${f.tone})">
        <h3>${f.title} <small>tick what they've been told</small></h3>
        ${items.map(it => {
          const text = it.dynamic ? t.altOption(it.dynamic).scope : it.text;
          return `<label class="check ${set[it.k] ? "known" : ""}">
            <input type="checkbox" data-act="fact" data-g="${group}" data-k="${it.k}" ${set[it.k] ? "checked" : ""} ${ro ? "disabled" : ""}>
            <span>${it.bad ? `<span class="pip bad">false</span> ` : ""}${text}</span></label>`;
        }).join("")}
      </section>`;
  }

  /* ----------------------------------------------------- infiltration tab */
  infilTab(ro) {
    const t = this.t;
    return `
      ${this.ladderPanel(ro)}
      <section class="panel" style="--tone:var(--rust)">
        <h3>Obstacles <small>${t.ip} of ${IP_GOAL} Infiltration Points</small></h3>
        <p class="text">The specific challenges depend on the party's strategy. Beyond the threats in each area, they should face two obstacles at appropriate points in the story — ${OB_IP} Infiltration Points each, for the ${IP_GOAL} the whole job needs. Bring one into play when the story reaches it.</p>
        <ul class="checks">${OB_RESULT.map(([d, txt]) => `<li><b>${DEG_LABEL[d]}</b> ${txt}</li>`).join("")}</ul>
        <p class="note">${OB_TURN}</p>
        ${t.dcBump ? `<p class="danger">Awareness is at ${t.ap}: every obstacle DC below already includes the +1.</p>` : ""}
        <div class="btnrow">
          ${OBSTACLES.map(o => `<button type="button" class="opt ${t.ob(o.key) ? "on" : ""}" data-act="obstacle" data-k="${o.key}" ${ro ? "disabled" : ""}>
            <i class="fa-solid ${o.icon}"></i> ${o.label}</button>`).join("")}
        </div>
      </section>
      ${OBSTACLES.filter(o => t.ob(o.key)).map(o => this.obstaclePanel(o, ro)).join("")}
      ${this.assassinPanel(ro)}
      ${this.guardPanel(ro)}
      ${COMPLICATIONS.map(c => this.compPanel(c, ro)).join("")}
      ${this.apPanel(ro)}`;
  }

  ladderPanel(ro) {
    const t = this.t, ap = t.ap;
    return `
      <section class="panel" style="--tone:var(--ember)">
        <h3>Awareness <small>${ap} point${ap === 1 ? "" : "s"}</small></h3>
        <div class="ladder">
          ${LADDER.map(r => {
            const on = ap >= r.at;
            return `<div class="rungrow ${on ? "on" : ""}" style="--tone:var(--${r.tone})">
              <b>${r.at}</b>
              <div>
                <span class="rlabel">${r.label}</span>
                <div class="hint">${r.text}</div>
              </div>
              ${r.fires ? `<button type="button" class="opt sm ${t.s.fired[r.at] ? "on" : ""}" data-act="fired" data-k="${r.at}"
                ${ro || !on ? "disabled" : ""} title="The complication this threshold calls for, run once">${t.s.fired[r.at] ? "Ran it" : "Complication"}</button>` : `<span></span>`}
            </div>`;
          }).join("")}
        </div>
      </section>`;
  }

  obstaclePanel(o, ro) {
    const t = this.t, st = t.ob(o.key), ip = t.obIp(o.key), done = ip >= OB_IP;
    const bump = t.dcBump;
    return `
      <section class="panel ${done ? "done" : ""}" style="--tone:var(--${o.tone})">
        <h3><i class="fa-solid ${o.icon}"></i> ${o.label}
          <span class="lvl">${ip} / ${OB_IP} IP</span>
          <button type="button" class="say" data-act="postobstacle" data-k="${o.key}" title="Post this obstacle to chat"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="boxed">${o.text}</p>
        <p class="dcs">Overcome ${this.checkLine(o.checks, bump)}${bump ? " (including the +1 from Awareness)" : ""}</p>
        ${this.whoRow(o.checks, { dcShift: bump })}
        <div class="pips">${Array.from({ length: OB_IP }, (_, i) => `<span class="pipdot ${i < ip ? "on" : ""}"></span>`).join("")}</div>
        ${st.turns.map((turn, ti) => `
          <div class="turn ${turn.closed ? "closed" : ""}">
            <div class="subhead">Turn ${ti + 1}${turn.closed ? " — closed, +1 AP" : ""}</div>
            ${t.s.pcs.map((pc, i) => `
              <div class="turnrow">
                <span class="cn">${esc(pc.name)}</span>
                <div class="res">
                  ${DEGREES.map(([d, label]) => `<button type="button" class="opt sm deg-${d} ${turn.results[i] === d ? "on" : ""}"
                    data-act="obres" data-k="${o.key}" data-t="${ti}" data-i="${i}" data-d="${d}" ${ro || turn.closed ? "disabled" : ""}>${label}</button>`).join("")}
                </div>
              </div>`).join("")}
            <div class="counter">
              <b>Helped without a check</b>
              <button type="button" class="qbtn" data-act="auto" data-k="${o.key}" data-t="${ti}" data-n="-1" ${ro || turn.closed ? "disabled" : ""}>−</button>
              <span class="pip">${turn.auto ?? 0} IP</span>
              <button type="button" class="qbtn" data-act="auto" data-k="${o.key}" data-t="${ti}" data-n="1" ${ro || turn.closed ? "disabled" : ""}>+</button>
              <span class="hint">A spell or trick that simply works is worth 1 IP.</span>
            </div>
          </div>`).join("")}
        <div class="btnrow">
          <button type="button" class="${done ? "ghost" : "primary"}" data-act="closeturn" data-k="${o.key}" ${ro || done ? "disabled" : ""}>End the turn — +1 AP</button>
          <button type="button" class="ghost" data-act="undoturn" data-k="${o.key}" ${ro ? "disabled" : ""}>Undo turn</button>
          <button type="button" class="ghost" data-act="obstacle" data-k="${o.key}" ${ro ? "disabled" : ""}>Take out of play</button>
        </div>
        ${done ? `<p class="bonus">Overcome. ${t.ip >= IP_GOAL ? `That's all ${IP_GOAL} Infiltration Points — they've reached Doatara.` : `${IP_GOAL - t.ip} Infiltration Points still to find.`}</p>` : ""}
      </section>`;
  }

  assassinPanel(ro) {
    const t = this.t;
    const kills = t.s.kills.filter(k => k.how === "assassination");
    return `
      <section class="panel" style="--tone:var(--rust)">
        <h3>${ASSASSINATION.title} <small>${ASSASSINATION.traits.join(" · ").toLowerCase()}</small></h3>
        <p class="boxed">${ASSASSINATION.lead}</p>
        <p class="dcs">${ASSASSINATION.roll}</p>
        <p class="note">${ASSASSINATION.special}</p>
        <div class="faces">
          ${ASSASSINATION.degrees.map(d => `
            <div class="face">
              <b>${d.label}</b>
              <i>${d.ap ? `+${d.ap} AP` : "no AP"}</i>
              <span>${d.text}</span>
              <button type="button" class="opt sm" data-act="kill" data-k="${d.k}" ${ro ? "disabled" : ""}>Record</button>
            </div>`).join("")}
        </div>
        ${kills.length ? `<div class="killlist">
          ${t.s.kills.map((k, i) => k.how !== "assassination" ? "" : `
            <span class="tagx">${ASSASSINATION.degrees.find(d => d.k === k.deg)?.label ?? k.deg}
              <button type="button" class="x" data-act="dropkill" data-i="${i}" ${ro ? "disabled" : ""} title="Take it back">×</button></span>`).join("")}
        </div>` : ""}
      </section>`;
  }

  guardPanel(ro) {
    const t = this.t, left = t.guardsLeft;
    return `
      <section class="panel" style="--tone:var(--slate)">
        <h3>Guards <small>${left} of ${GUARDS.total} still on their feet</small></h3>
        <div class="crew">${this.creatureBtn(GUARDS.name, GUARDS.source, GUARDS.level)}</div>
        <p class="text">${GUARDS.text}</p>
        <p class="note"><b>Posted</b> ${GUARDS.posts}</p>
        <div class="bar"><span class="guards" style="width:${(left / GUARDS.total) * 100}%"></span></div>
        <p class="bonus">${t.joinRule.text}</p>
        <div class="btnrow">
          <button type="button" class="ghost" data-act="kill" data-k="combat" ${ro || !left ? "disabled" : ""}>A guard died in open combat</button>
          ${t.s.kills.length ? `<button type="button" class="ghost" data-act="dropkill" data-i="${t.s.kills.length - 1}" ${ro ? "disabled" : ""}>Undo the last kill</button>` : ""}
        </div>
        <p class="hint">Kills recorded through Red Mantis Assassination count here too — the two panels share one tally.</p>
      </section>`;
  }

  compPanel(c, ro) {
    const t = this.t;
    const mine = t.s.comps.map((x, i) => ({ ...x, i })).filter(x => x.key === c.key);
    const raw = mine.reduce((n, x) => n + (c.awards?.[x.deg] ?? 0), 0);
    return `
      <section class="panel" style="--tone:var(--${c.tone})">
        <h3><i class="fa-solid ${c.icon}"></i> ${c.label} <small>complication</small>
          ${raw ? `<span class="lvl">${c.cap && raw > c.cap ? `${c.cap} AP (capped from ${raw})` : `${raw} AP`}</span>` : ""}
        </h3>
        <p class="boxed">${c.text}</p>
        <p class="dcs">Overcome ${this.checkLine(c.checks)}</p>
        ${this.whoRow(c.checks)}
        ${c.note ? `<p class="note">${c.note}</p>` : ""}
        ${c.degrees.map(([d, txt]) => `<p class="deg"><b>${DEG_LABEL[d]}</b> ${txt}</p>`).join("")}
        <div class="btnrow">
          ${c.degrees.map(([d]) => `<button type="button" class="opt sm deg-${d}" data-act="comp" data-k="${c.key}" data-d="${d}" ${ro ? "disabled" : ""}>${DEG_LABEL[d].replace("Critical", "Crit")}</button>`).join("")}
        </div>
        ${mine.length ? `<div class="killlist">
          ${mine.map(x => `<span class="tagx deg-${x.deg}">${DEG_LABEL[x.deg]}
            <button type="button" class="x" data-act="dropcomp" data-i="${x.i}" ${ro ? "disabled" : ""} title="Take it back">×</button></span>`).join("")}
        </div>` : ""}
      </section>`;
  }

  apPanel(ro) {
    const t = this.t, parts = t.apParts;
    return `
      <section class="panel" style="--tone:var(--ember)">
        <h3>Everything else that draws attention <small>${t.ap} AP in total</small></h3>
        <div class="btnrow">
          ${AP_SOURCES.map((s, i) => `<button type="button" class="opt" data-act="addap" data-i="${i}" ${ro ? "disabled" : ""} title="${esc(s.why)}">
            +${s.n} ${s.label}</button>`).join("")}
        </div>
        ${t.s.apAdd.length ? `<div class="killlist">
          ${t.s.apAdd.map((a, i) => `<span class="tagx">+${a.n} ${esc(a.label)}
            <button type="button" class="x" data-act="dropap" data-i="${i}" ${ro ? "disabled" : ""} title="Take it back">×</button></span>`).join("")}
        </div>` : ""}
        ${parts.length ? `<div class="know">
          <div class="subhead">Where the ${t.ap} came from</div>
          ${parts.map(p => `<p class="deg"><b>${p.n > 0 ? `+${p.n}` : p.n}</b> ${esc(p.why)}</p>`).join("")}
        </div>` : `<p class="hint">Nothing has drawn attention yet.</p>`}
      </section>`;
  }

  /* --------------------------------------------------------- area tabs */
  zoneTab(zone, ro) {
    const t = this.t;
    const intro = zone === "grounds" ? `
      <section class="panel" style="--tone:var(--muted)">
        <h3>The manor and its features</h3>
        <p class="text">Everbloom Manor is a handsome, walled estate deep in Absalom's Petal District, built in two styles. The rounded tower is Azlanti Revival — 30 feet tall, a verdigris bronze dome, four narrow windows on its upper level. The rest is single-storey Kortos Revival from centuries later: a flat roof with a low railing, heavily carved eaves, exterior columns. The manor sits on a low hill, its small backyard descending to a deep pool overlooked by an elegant deck and loggia stairs. The grounds run about 100 feet south and west, mostly artful arrays of flowering bushes, stucco-lined ponds, and flagstone paths with a few outlying storage buildings.</p>
        <div class="feat">${FEATURES.map(([k, v]) => `<p class="branch"><b>${k}</b>${v}</p>`).join("")}</div>
        <p class="bonus">The grounds have enough cover that the PCs can readily hole up for 10 minutes out of sight — Treat Wounds, Refocus, clean up — whenever they need to.</p>
      </section>` : "";
    return intro + AREAS.filter(a => a.zone === zone).map(a => this.areaCard(a, ro)).join("");
  }

  areaCard(a, ro) {
    const t = this.t, done = !!t.s.areas[a.key];
    const traps = t.trapsAt(a.key);
    const guardian = a.guardian ? t.altOption(a.guardian) : null;
    const altNote = a.altNote?.interior?.[t.s.alt.interior];
    const cellarHere = a.cellarRoute && t.s.alt.cellar === a.cellarRoute;
    const cellarOpt = cellarHere ? ALTS.cellar.options.find(o => o.key === a.cellarRoute) : null;
    const checks = (a.checks ?? []).filter((_, i) => !(a.only && a.only.check === i && t.s.alt.doatara !== a.only.doatara));
    const treasureAlt = a.treasureAlt?.doatara?.[t.s.alt.doatara];
    return `
      <section class="panel area ${done ? "done" : ""}" style="--tone:var(--${a.tone})">
        <h3><span class="eid">${a.id}</span>${a.name}
          ${a.level ? `<span class="lvl">${a.level}</span>` : ""}
          ${guardian ? `<span class="lvl">${guardian.label}</span>` : ""}
          ${a.boxed ? `<button type="button" class="say" data-act="postboxed" data-k="${a.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>` : ""}
        </h3>
        ${a.boxed ? `<p class="boxed">${a.boxed}</p>` : ""}
        ${guardian ? `
          <div class="crew">${this.creatureBtn(guardian.creature.name, guardian.creature.source)}</div>
          <p class="text">${guardian.note}</p>` : ""}
        ${a.text ? `<p class="text">${a.text}</p>` : ""}
        ${altNote ? `<p class="text alt"><span class="pip">alternate</span> ${altNote}</p>` : ""}
        ${a.beats ? a.beats.map(([when, line]) => `<p class="branch"><b>${when}</b>${line}</p>`).join("") : ""}
        ${checks.length ? `<ul class="checks">${checks.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
        ${traps.map(tr => this.trapBlock(tr)).join("")}
        ${cellarOpt ? `<p class="branch cellar"><b>The way down to area B</b>${cellarOpt.note}</p>` : ""}
        ${a.note ? `<p class="note">${a.note}</p>` : ""}
        ${a.apRisk ? `<p class="danger">Worth ${a.apRisk} Awareness Point if it goes wrong — record it on the Infiltration tab.</p>` : ""}
        ${a.treasure ? `<p class="loot"><b>Treasure</b> ${a.treasure}</p>` : ""}
        ${treasureAlt ? `<p class="loot"><b>Also</b> ${treasureAlt}</p>` : ""}
        <div class="btnrow">
          <button type="button" class="${done ? "ghost" : "primary"}" data-act="area" data-k="${a.key}" ${ro ? "disabled" : ""}>${done ? "Reopen" : "Mark done"}</button>
        </div>
      </section>`;
  }

  trapBlock(tr) {
    const d = tr.def;
    return `
      <div class="hazard" style="--tone:var(--${d.tone})">
        <div class="subhead">Hazard — ${d.level}</div>
        <b class="hz">${d.label}</b> <span class="pip">${d.source}</span>
        <p class="text">${d.text}</p>
        ${d.stealth ? `<p class="dcs sm">${d.stealth} · Disable ${d.disable}</p>` : `<p class="hint">Stat block in ${d.source}.</p>`}
        ${d.bypass ? `<p class="note">${d.bypass}</p>` : ""}
      </div>`;
  }

  /* ------------------------------------------------------------ cellar tab */
  cellarTab(ro) {
    const t = this.t, which = t.altOption("doatara");
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3><span class="eid">${CELLAR.id}</span>${CELLAR.name} <span class="lvl">${CELLAR.level}</span>
          <button type="button" class="say" data-act="postboxed" data-k="cellar" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
        </h3>
        <p class="boxed">${CELLAR.boxed}</p>
        <p class="text">${CELLAR.text}</p>
        ${CELLAR.features.map(([k, v]) => `<p class="branch"><b>${k}</b>${v}</p>`).join("")}
        <p class="note">The way in is currently ${ALTS.cellar.options.find(o => o.key === t.s.alt.cellar).label} — change that on the Alternates tab.</p>
      </section>

      <section class="panel" style="--tone:var(--rust)">
        <h3>The kill <small>${which.label.toLowerCase()}</small></h3>
        <div class="crew">
          ${CELLAR.creatures.map(c => this.creatureBtn(
            c.alt === "doatara" ? which.creatureName : c.name,
            c.alt === "doatara" ? which.page : c.source,
            c.level)).join("")}
        </div>
        <p class="boxed">${CELLAR.scene}</p>
        <ul class="checks">
          ${CELLAR.tactics.map(x => `<li>${x}</li>`).join("")}
          <li>${CELLAR.tacticsAlt[t.s.alt.doatara]}</li>
        </ul>
        ${t.ap >= 11 ? `<p class="danger">Awareness is at ${t.ap}: Doatara and the ceustodaemon take a +2 circumstance bonus to initiative.</p>` : ""}
        ${t.ap >= 16 ? `<p class="danger">At ${t.ap} Awareness Points she has already fled. The infiltration has failed — the contract lives on.</p>` : ""}
      </section>

      <section class="panel" style="--tone:var(--gold)">
        <h3>Concluding the adventure</h3>
        <p class="text">${CELLAR.conclusion.lead}</p>
        <ul class="checks">${CELLAR.conclusion.prompts.map(p => `<li>${p}</li>`).join("")}</ul>
        <p class="text">${CELLAR.conclusion.after}</p>
      </section>

      <section class="panel" style="--tone:var(--slate)">
        <h3>The team <small>who each rule singles out</small></h3>
        ${PREGENS.map(p => `<p class="branch" style="--tone:var(--${p.tone})"><b>${p.name}, ${p.role} — ${p.cls}</b>${p.hook}</p>`).join("")}
      </section>`;
  }

  /* -------------------------------------------------------- alternates tab */
  altTab(ro) {
    const t = this.t;
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>Alternate challenges <small>everything below rewrites the rest of the console</small></h3>
        <p class="text">Mark of the Mantis is built to be swapped around. Change a challenge here and the legwork facts, the area cards, and the creature buttons all follow — so the party scoping the manor learns about whichever guardian is actually out there.</p>
      </section>
      ${Object.entries(ALTS).map(([group, def]) => `
        <section class="panel" style="--tone:var(--${def.tone})">
          <h3><i class="fa-solid ${def.icon}"></i> ${def.label}</h3>
          <p class="text">${def.lead}</p>
          <div class="btnrow">
            ${def.options.map(o => `<button type="button" class="opt ${t.s.alt[group] === o.key ? "on" : ""}" data-act="alt" data-g="${group}" data-k="${o.key}" ${ro ? "disabled" : ""}>${o.label}</button>`).join("")}
          </div>
          ${def.options.map(o => t.s.alt[group] === o.key ? `<p class="deg"><b>In play</b> ${o.note}</p>` : "").join("")}
        </section>`).join("")}

      <section class="panel" style="--tone:var(--rust)">
        <h3>Traps <small>what they are and where they sit</small></h3>
        <p class="text">Traps work best where there isn't much servant traffic and where the PCs are most likely to travel. As printed they guard the otherwise-unwatched doors into A5 and the narrow hallway into A9; the study, the eastern half of the gallery, and the door to the main bedroom are all good alternatives.</p>
        ${Object.entries(t.s.traps).map(([slot, tr]) => `
          <div class="trapslot">
            <div class="subhead">Trap ${slot.slice(1)}</div>
            <div class="btnrow">
              ${Object.entries(TRAP_TYPES).map(([k, d]) => `<button type="button" class="opt sm ${tr.type === k ? "on" : ""}" data-act="trap" data-s="${slot}" data-f="type" data-k="${k}" ${ro ? "disabled" : ""}>${d.label}</button>`).join("")}
            </div>
            <div class="btnrow">
              ${TRAP_SPOTS.map(sp => `<button type="button" class="opt sm ghosty ${tr.where === sp.key ? "on" : ""}" data-act="trap" data-s="${slot}" data-f="where" data-k="${sp.key}" ${ro ? "disabled" : ""}>${sp.label}</button>`).join("")}
            </div>
            ${this.trapBlock({ slot, ...tr, def: TRAP_TYPES[tr.type] })}
          </div>`).join("")}
      </section>`;
  }

  /* -------------------------------------------------------------- wiring */
  wire(root) {
    if (!root || root.dataset?.mmWired === "1") return;
    if (root.dataset) root.dataset.mmWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const d = btn.dataset, a = d.act;
      if (a === "tab") { t.s.tab = d.k; t.touch(); }
      else if (a === "sheet") {
        const actor = game.actors.get(d.id);
        if (actor) actor.sheet?.render(true);
        else ui.notifications.warn("That character's actor is no longer in this world.");
      }
      else if (a === "activity") t.setActivity(Number(d.p), Number(d.i), d.k);
      else if (a === "planres") t.setPlanResult(Number(d.p), Number(d.i), d.k);
      else if (a === "spend") t.toggleSpend(d.k);
      else if (a === "obstacle") t.toggleObstacle(d.k);
      else if (a === "obres") t.setObResult(d.k, Number(d.t), Number(d.i), d.d);
      else if (a === "auto") t.bumpAuto(d.k, Number(d.t), Number(d.n));
      else if (a === "closeturn") t.closeTurn(d.k);
      else if (a === "undoturn") t.undoTurn(d.k);
      else if (a === "comp") t.addComp(d.k, d.d);
      else if (a === "dropcomp") t.dropComp(Number(d.i));
      else if (a === "kill") t.addKill(d.k === "combat" ? "combat" : "assassination", d.k);
      else if (a === "dropkill") t.dropKill(Number(d.i));
      else if (a === "addap") { const s = AP_SOURCES[Number(d.i)]; t.addAp(s.n, s.label); }
      else if (a === "dropap") t.dropAp(Number(d.i));
      else if (a === "fired") t.toggleFired(Number(d.k));
      else if (a === "alt") t.setAlt(d.g, d.k);
      else if (a === "trap") t.setTrap(d.s, d.f, d.k);
      else if (a === "area") t.toggleArea(d.k);
      else if (a === "creature") t.openCreature(d.k, d.src);
      else if (a === "postboxed") t.postBoxed(d.k);
      else if (a === "postactivity") t.postActivity(d.k);
      else if (a === "postobstacle") t.postObstacle(d.k);
      else if (a === "poststatus") t.postStatus();
      else if (a === "reset") t.reset();
    });
    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "fact") t.toggleFact(el.dataset.g, el.dataset.k);
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.crimson;
    return `<style>
      #mm-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #mm-console .window-content > * { background:transparent; }
      .mm { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
            --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum}; --gold:${p.gold};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .mm * { box-sizing:border-box; }
      .mm button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; }
      .mm button:hover:not(:disabled) { background:var(--hover); }
      .mm button:disabled { opacity:.4; cursor:not-allowed; }
      .mm input[type="checkbox"] { accent-color:var(--rust); margin-top:.15rem; flex:none; }
      .mm h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.05em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
               padding-bottom:.3rem; flex-wrap:wrap; }
      .mm h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .mm h1, .mm h2, .mm h4, .mm legend { color:var(--ink); }
      .mm .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                   background:var(--card); }
      .mm .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .mm .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .mm .panel.done { opacity:.72; }
      .mm .eid { font-size:.7rem; color:var(--paper); background:var(--tone, var(--muted));
                 border-radius:3px; padding:1px 6px; letter-spacing:.06em; font-weight:700; }
      .mm .lvl { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                 border-radius:10px; border:1px solid var(--tone, var(--line)); color:var(--tone, var(--muted)); }
      .mm .pip { font-size:.57rem; text-transform:uppercase; letter-spacing:.07em; padding:0 5px;
                 border-radius:8px; border:1px solid var(--line); color:var(--muted); white-space:nowrap; }
      .mm .pip.bad { color:var(--rust); border-color:var(--rust); }
      .mm .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .mm .say.inline { margin-left:.35rem; width:20px; height:18px; vertical-align:middle; }
      .mm .say + .say { margin-left:.25rem; }
      .mm .boxed { font-size:.82rem; line-height:1.55; margin:.2rem 0 .5rem; padding:.45rem .55rem;
                   border-left:2px solid var(--tone, var(--line)); background:var(--stripe); font-style:italic; }
      .mm .text { font-size:.82rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .mm .text.alt { color:var(--muted); }
      .mm .note { font-size:.78rem; line-height:1.45; color:var(--muted); margin:.2rem 0 .4rem; }
      .mm .danger { font-size:.79rem; line-height:1.45; color:var(--rust); margin:.2rem 0 .4rem; font-weight:600; }
      .mm .bonus { font-size:.78rem; font-weight:600; color:var(--moss); margin:.3rem 0 .4rem; line-height:1.45; }
      .mm .loot { font-size:.78rem; line-height:1.45; margin:.2rem 0 .45rem; }
      .mm .loot b { color:var(--gold); }
      .mm .branch { font-size:.79rem; line-height:1.5; margin:.25rem 0; }
      .mm .branch b { display:block; color:var(--tone, var(--muted)); font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; }
      .mm .branch.cellar b { color:var(--gold); }
      .mm .dcs { font-size:.8rem; font-weight:600; margin:.2rem 0 .4rem; color:var(--slate); line-height:1.45; }
      .mm .dcs.sm { font-size:.75rem; font-weight:500; }
      .mm .hint { font-size:.73rem; color:var(--muted); margin:.2rem 0 0; line-height:1.4; }
      .mm .checks { margin:0 0 .45rem; padding-left:1.1rem; font-size:.79rem; line-height:1.5; color:var(--muted); }
      .mm .checks li { margin-bottom:.25rem; }
      .mm .checks b { color:var(--ink); }
      .mm .check { display:flex; gap:.45rem; align-items:flex-start; font-size:.79rem; line-height:1.45; margin:.3rem 0;
                   color:var(--muted); }
      .mm .check.known { color:var(--ink); }
      .mm .subhead { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin-bottom:.25rem; }
      .mm .know { border:1px dashed var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0; background:var(--stripe); }
      .mm .deg { font-size:.78rem; line-height:1.45; margin:.25rem 0; }
      .mm .deg b { color:var(--tone, var(--ink)); }
      .mm .feat { columns:2; column-gap:1rem; }
      .mm .feat .branch { break-inside:avoid; }
      .mm .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.35rem 0 .2rem; }
      .mm .primary { background:var(--tone, var(--rust)); border-color:var(--tone, var(--rust));
                     color:var(--paper); font-weight:700; padding:.3rem .7rem; font-size:.76rem; }
      .mm .primary:hover:not(:disabled) { filter:brightness(1.15); background:var(--tone, var(--rust)); }
      .mm .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .mm .opt { padding:.28rem .6rem; font-size:.75rem; }
      .mm .opt.sm { padding:.2rem .45rem; font-size:.68rem; }
      .mm .opt.on { background:var(--rust); border-color:var(--rust); color:var(--paper); font-weight:600; }
      .mm .opt.ghosty { color:var(--muted); }
      .mm .opt.ghosty.on { background:var(--slate); border-color:var(--slate); color:var(--paper); }
      .mm .opt.deg-cs.on { background:var(--moss); border-color:var(--moss); color:var(--paper); }
      .mm .opt.deg-s.on { background:var(--slate); border-color:var(--slate); color:var(--paper); }
      .mm .opt.deg-f.on { background:var(--muted); border-color:var(--muted); color:var(--paper); }
      .mm .opt.deg-cf.on { background:var(--rust); border-color:var(--rust); color:var(--paper); }

      .mm .topbar { display:flex; align-items:center; gap:.7rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .mm .score { display:flex; flex-direction:column; }
      .mm .score span { font-size:.56rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .mm .score b { font-size:1.15rem; line-height:1; color:var(--slate); }
      .mm .score b i { font-size:.7rem; font-style:normal; color:var(--muted); }
      .mm .score b.hit { color:var(--moss); }
      .mm .score.aw b { color:var(--muted); }
      .mm .score.aw.warm b { color:var(--ember); }
      .mm .score.aw.hot b { color:var(--rust); }
      .mm .lamps { display:flex; gap:.35rem; flex-wrap:wrap; }
      .mm .lamp { display:inline-flex; align-items:center; gap:.3rem; font-size:.67rem; text-transform:uppercase;
                  letter-spacing:.05em; color:var(--muted); border:1px solid var(--line); border-radius:10px; padding:2px 8px; }
      .mm .lamp i { font-size:.6rem; opacity:.35; }
      .mm .lamp.lit { color:var(--gold); border-color:var(--gold); font-weight:700; }
      .mm .lamp.lit i { opacity:1; }
      .mm .rung { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end;
                  border-right:3px solid var(--tone); padding-right:.5rem; }
      .mm .rung b { font-size:.8rem; color:var(--tone); }
      .mm .rung small { font-size:.6rem; color:var(--muted); }

      .mm .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .mm .tab { flex:1; padding:.3rem .2rem; font-size:.77rem; display:flex; flex-direction:column; line-height:1.2;
                 overflow:hidden; border-top:3px solid var(--tt, var(--line)); border-radius:3px 3px 2px 2px; }
      .mm .tab b { display:flex; align-items:center; justify-content:center; gap:.3rem; }
      .mm .tab b i { font-size:.66rem; color:var(--tt, var(--muted)); }
      .mm .tab small { font-size:.6rem; color:var(--muted); font-weight:400; white-space:nowrap;
                       text-overflow:ellipsis; overflow:hidden; max-width:100%; }
      .mm .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); }
      .mm .tab.on b i, .mm .tab.on small { color:var(--paper); opacity:.85; }

      .mm button.cn { background:transparent; border:0; padding:0; color:var(--ink); font-family:inherit;
                      text-align:left; cursor:pointer; justify-content:flex-start; font-size:.82rem; font-weight:600;
                      overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .mm button.cn:hover { text-decoration:underline; background:transparent; }
      .mm span.cn { font-size:.8rem; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

      .mm .crew { display:flex; gap:.35rem; flex-wrap:wrap; margin:.1rem 0 .45rem; }
      .mm .mon { font-size:.74rem; padding:.22rem .55rem; color:var(--rust); border-color:var(--rust); }
      .mm .mon em { color:var(--muted); font-style:normal; font-size:.68rem; }

      /* legwork */
      .mm .legwork { display:flex; flex-direction:column; gap:.4rem; }
      .mm .lw { display:grid; grid-template-columns:30px 7rem 1fr; gap:.5rem; align-items:start;
                border:1px solid var(--line); border-radius:3px; padding:.4rem .45rem; }
      .mm .lw img { width:30px; height:30px; border-radius:3px; object-fit:cover; border:1px solid var(--line); }
      .mm .lw .acts, .mm .lw .res { display:flex; gap:.25rem; flex-wrap:wrap; }
      .mm .lw .res { grid-column:3; margin-top:.25rem; }
      .mm .lwdetail { grid-column:2 / -1; margin-top:.3rem; border-top:1px dashed var(--line); padding-top:.35rem; }
      .mm .lw.res-cs { border-color:var(--moss); }
      .mm .lw.res-s { border-color:var(--slate); }
      .mm .lw.res-f { border-color:var(--muted); }
      .mm .lw.res-cf { border-color:var(--rust); }

      .mm .who { display:flex; gap:.3rem; flex-wrap:wrap; margin:.25rem 0 .35rem; }
      .mm .cand { font-size:.68rem; border:1px solid var(--line); border-radius:10px; padding:1px 7px; color:var(--muted); }
      .mm .cand em { font-style:normal; opacity:.75; }
      .mm .cand b { color:var(--ink); }
      .mm .cand.best { border-color:var(--moss); color:var(--ink); }
      .mm .cand.best b { color:var(--moss); }

      .mm .eplist { display:flex; flex-direction:column; gap:.3rem; }
      .mm .ep { display:grid; grid-template-columns:auto 1fr; gap:.5rem; align-items:start;
                border:1px solid var(--line); border-radius:3px; padding:.35rem .45rem; font-size:.78rem; }
      .mm .ep.spent { opacity:.55; }
      .mm .ep.dud { border-style:dashed; }

      /* awareness ladder */
      .mm .ladder { display:flex; flex-direction:column; gap:.25rem; }
      .mm .rungrow { display:grid; grid-template-columns:2rem 1fr auto; gap:.6rem; align-items:center;
                     border:1px solid var(--line); border-left:3px solid var(--line); border-radius:3px;
                     padding:.35rem .45rem; opacity:.55; }
      .mm .rungrow.on { opacity:1; border-left-color:var(--tone); }
      .mm .rungrow b { font-size:1rem; text-align:center; color:var(--muted); }
      .mm .rungrow.on b { color:var(--tone); }
      .mm .rlabel { font-size:.8rem; font-weight:600; }

      /* obstacles */
      .mm .pips { display:inline-flex; gap:4px; margin:.2rem 0 .45rem; }
      .mm .pipdot { width:11px; height:11px; border-radius:50%; border:1px solid var(--line); display:block; }
      .mm .pipdot.on { background:var(--tone, var(--moss)); border-color:var(--tone, var(--moss)); }
      .mm .turn { border:1px dashed var(--line); border-radius:3px; padding:.4rem; margin:.35rem 0; background:var(--stripe); }
      .mm .turn.closed { opacity:.7; }
      .mm .turnrow { display:grid; grid-template-columns:7rem 1fr; gap:.5rem; align-items:center; margin:.2rem 0; }
      .mm .turnrow .res { display:flex; gap:.22rem; flex-wrap:wrap; }
      .mm .counter { display:flex; align-items:center; gap:.4rem; margin-top:.4rem; flex-wrap:wrap; }
      .mm .counter b { font-size:.72rem; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
      .mm .counter .hint { margin:0; }
      .mm .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }

      .mm .faces { display:grid; grid-template-columns:1fr 1fr; gap:.35rem; margin-top:.4rem; }
      .mm .face { display:grid; grid-template-columns:auto auto 1fr auto; gap:.4rem; align-items:center;
                  font-size:.76rem; line-height:1.4; border:1px solid var(--line); border-radius:3px; padding:.35rem .45rem; }
      .mm .face b { color:var(--ink); }
      .mm .face i { font-style:normal; font-size:.62rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
      .mm .face span { color:var(--muted); font-size:.73rem; }

      .mm .killlist { display:flex; gap:.3rem; flex-wrap:wrap; margin-top:.4rem; }
      .mm .tagx { display:inline-flex; align-items:center; gap:.3rem; font-size:.68rem; border:1px solid var(--line);
                  border-radius:10px; padding:1px 3px 1px 8px; color:var(--muted); }
      .mm .tagx.deg-cs { border-color:var(--moss); }
      .mm .tagx.deg-cf { border-color:var(--rust); }
      .mm .tagx .x { width:15px; height:15px; padding:0; border:0; font-size:.72rem; color:var(--muted); border-radius:50%; }

      .mm .bar { height:8px; border:1px solid var(--line); border-radius:4px; background:var(--stripe);
                 overflow:hidden; margin:.3rem 0; }
      .mm .bar span { display:block; height:100%; }
      .mm .bar .guards { background:var(--slate); }

      .mm .hazard { border:1px solid var(--tone, var(--line)); border-left-width:3px; border-radius:3px;
                    padding:.45rem; margin:.4rem 0; background:var(--stripe); }
      .mm .hazard .hz { font-size:.85rem; color:var(--tone); }
      .mm .trapslot { border:1px solid var(--line); border-radius:3px; padding:.45rem; margin:.4rem 0; }

      @media (max-width:860px) {
        .mm .faces, .mm .feat { grid-template-columns:1fr; columns:1; }
        .mm .tabs { flex-wrap:wrap; }
        .mm .lw { grid-template-columns:30px 1fr; }
        .mm .lw .acts, .mm .lw .res { grid-column:2; }
        .mm .lwdetail { grid-column:1 / -1; }
        .mm .turnrow { grid-template-columns:1fr; }
        .mm .face { grid-template-columns:1fr auto; }
        .mm .face span { grid-column:1 / -1; }
      }
    </style>`;
  }
}

if (AppV2) {
  MMApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSetting();
  let state = game.settings.get(MM_NS, MM_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(MM_NS, MM_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }
  const run = new Mantis(state);
  const app = new MMApp(run);

  if (!globalThis.__mmHook) {
    globalThis.__mmHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== MM_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { run.state = fresh; run.render(); }
    });
  }
  app.render(true);
})();
