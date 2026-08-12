/* ============================================================================
   FIRST LONG NIGHT — Festival Console
   Season of Ghosts, Act 2 Chapter 5, week 3 of fall (the 22nd)
   Foundry VTT v11 / v12 / v13  •  built for PF2e
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.
   Points earned here can be pushed straight into the Fall Downtime Tracker.
   ============================================================================ */

const FLN_NS = "world";
const FLN_KEY = "sogFirstLongNight";
const FLN_ID = `${FLN_NS}.${FLN_KEY}`;
const DOWNTIME_ID = "world.sogFallDowntime";
const MAX_PCS = 4;
const DEG = ["cs", "s", "f", "cf"];
const DEG_LABEL = { cs: "Crit Success", s: "Success", f: "Failure", cf: "Crit Failure" };
const VP = { cs: 2, s: 1, f: 0, cf: -1 };

const THEME = "parchment";
const PALETTES = {
  parchment: {
    paper: "#efe6d8", card: "#fbf7f0", ink: "#241c18", line: "#b9a687", muted: "#6d6052",
    track: "rgba(0,0,0,.14)", stripe: "rgba(0,0,0,.05)", hover: "rgba(0,0,0,.07)", field: "#fffdf8",
    rust: "#95381f", ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12"
  },
  dark: {
    paper: "#1f1d1b", card: "#2a2724", ink: "#ece5da", line: "#544d44", muted: "#a4988a",
    track: "rgba(255,255,255,.12)", stripe: "rgba(255,255,255,.04)", hover: "rgba(255,255,255,.08)", field: "#171513",
    rust: "#d4664a", ember: "#e0a052", moss: "#96b06a", slate: "#7fa0bb", plum: "#b98ab0", gold: "#d9b74f"
  }
};
const PC_ACCENTS = ["--ember", "--moss", "--slate", "--plum"];

/* ------------------------------------------------------------ run of show */
const PHASES = [
  { name: "Late afternoon", sub: "Setup and markets", mood: "Wood-smoke, folk songs, the hammering of festival stalls.",
    beat: "Seasonal markets open — visiting merchants and priests. The last food stores are smoked and salted. PCs shop, gather rumours, and sign up for contests. The window for Food and for the markets." },
  { name: "Dusk", sub: "Opening", mood: "Lanterns kindled, the harvest moon rising orange.",
    beat: "The town elder — or a PC, if they've earned it — opens the night with words for the dead. Red strings are tied at the wrist. Admiring the Moon begins as a slow burn in the background." },
  { name: "Deep night", sub: "Games and spectacle", mood: "Cheering, drums, the smell of fried dough.",
    beat: "Contests and booths run in parallel. The bard's grand show is the headline act — build the night toward it." },
  { name: "The witching hours", sub: "Remembrance", mood: "Quiet, candlelit, hushed. The veil feels thin.",
    beat: "Grave-cleaning, last rites, silver dust scattered for Fumeiyoshi. The most personal roleplay lands here, and complications stir." },
  { name: "Dawn", sub: "Closing", mood: "Cold, pale light. Exhaustion and relief.",
    beat: "Everyone lights their miniature lantern and the sky lanterns release at once. Tally the ledger. If neighbouring villages' lanterns rise too, Willowshore knows it isn't alone." }
];

/* -------------------------------------------------------- the grand show */
const THROUGHLINES = {
  remembrance: { label: "Remembrance", sub: "honouring Willowshore's dead", check: "DC 21 Religion", turn: "Name the dead and claim them." },
  defiance:    { label: "Defiance", sub: "quiet rebellion against the spider-courts", check: "DC 21 Deception", turn: "Wrap rebellion in a harmless folk tale under a collaborator's nose." },
  hope:        { label: "Hope", sub: "the tenacity of life", check: "DC 19 Diplomacy", turn: "Promise the town its winter." }
};

const MOVEMENTS = [
  { id: "I", name: "The Setting", sub: "raising the house", tag: "Stagecraft",
    check: "DC 17 Crafting or DC 17 Society",
    text: "Hang the backdrops, place the lanterns, seat the crowd, read the room. Aid magnet — whoever runs the venue.",
    botch: "A lantern line sags and threatens the cloth. A quick DC 15 Reflex, or the show starts on a smell of singe." },
  { id: "II", name: "The Overture", sub: "first notes on the harp", tag: "Performance",
    check: "DC 19 Performance",
    text: "Zhu's opening piece sets the spell. Ask the player to name the tune and one memory it carries. A grieving widow in the front row goes still; a child stops fidgeting.",
    botch: "A string snaps mid-phrase. Recover with a quick DC 18 Performance riff or lose the room." },
  { id: "III", name: "The Turn", sub: "the story's beating heart", tag: "Counts double",
    check: "", dynamic: true,
    text: "Where the chosen through-line pays off. This movement counts double toward the tally.",
    botch: "The heart of the show misses. If a collaborator was watching a Defiance turn, this draws official attention." },
  { id: "IV", name: "The Spectacle", sub: "the moment they'll talk about", tag: "Effects",
    check: "DC 19 Performance, or DC 19 Arcana / Nature / Occultism / Religion if magic carries it",
    text: "Fire-flowers, dancers, conjured lights, the harp swelling into a storm. Aid magnet — Torrance's borrowed fireworks.",
    botch: "A prop lantern flares too bright — a small fire scare. Contain it heroically for a Security moment." },
  { id: "V", name: "The Bow", sub: "sending them into the dark", tag: "Crowd-work",
    check: "DC 19 Performance, or DC 19 Intimidation to leave them defiant",
    text: "The encore and the send-off. Every other PC gets one free Aid here using any skill they can justify — a feat of strength, a juggling bit, a heartfelt toast — so the whole table shares the curtain call.",
    botch: "The send-off lands flat and the crowd drifts out talking about the cold." }
];

const CURTAIN = [
  { min: 8, label: "A triumph", formula: "1d4+3", rep: 2, both: true, food: 1,
    text: "Word spreads and merchants linger to trade. Zhu is offered a standing spot at the teahouse. The story is retold all winter, softening one weekly Hope loss in Act 3." },
  { min: 5, label: "A hit", formula: "1d4+1", rep: 1, both: false,
    text: "A genuinely good night, the kind the town needed." },
  { min: 2, label: "Well-meant", flat: 1,
    text: "Warmly received if uneven. The effort counts." },
  { min: -99, label: "A flop", text: "No Hope gained and none lost — the crowd is kind to a brave attempt. If a collaborator watched a Defiance show, a botch draws unwanted official attention instead." }
];

const SPOTLIGHTS = [
  "A grieving parent in the crowd who lost someone this year. If a PC dedicates a piece to the dead, give that player a quiet, powerful moment.",
  "A heckler — a Northridge skeptic muttering that songs won't fill bellies. Win them over at DC 16 Diplomacy or play them off the stage at DC 20 Performance.",
  "A silver-collared stranger watching too intently from the back. Harmless tonight. A thread for later.",
  "A dead ghost drawn by the music, swaying at the edge of the lantern-light, neither hostile nor at rest."
];

/* --------------------------------------------------- the three contests */
const CONTESTS = {
  moon: {
    name: "Admiring the Moon", tag: "Poetry · about an hour", tone: "gold",
    check: "Four checks — DC 17 Art Lore, DC 19 Performance, or DC 21 Religion, mixed as the verse demands.",
    mini: "Run it as a real round-robin. Each check is a couplet — ask the player to actually offer a line about the moon. Reward an evocative or funny line with a +2 circumstance bonus; a laboured one earns good-natured heckling and no penalty.",
    payoff: "Reputation with the town's elders and scholars. A win marks a PC as cultured — useful with Granny Hu and Old Matsuki alike.",
    win: { rep: 1 }, big: { rep: 2 }
  },
  bundle: {
    name: "Bundle-Cutting", tag: "Escape and cut · 1–2 minutes", tone: "slate",
    check: "First Escape your bonds at DC 17 — one attempt is free, two costs −1 to your checks, three or four costs −2, and a fifth always frees you at −3. Then four checks to slash bundles free: DC 17 Thievery, DC 19 Athletics, or DC 21 Survival.",
    mini: "Run it against a song-tempo clock. A fast farming-song halves the time but adds −1 to the first check; a slow song is safe but a villager rival may pull ahead. It is secretly a jorogumo-web escape drill dressed as folk fun.",
    payoff: "Security — these are the skills that cut townsfolk free of webs come winter. An overwhelming win quietly impresses anyone watching for capable hands.",
    win: { security: 1 }, big: { security: 2 }
  },
  lantern: {
    name: "Lantern Making", tag: "Crafting · about two hours", tone: "ember",
    check: "Four DC 19 Crafting checks across two hours, building a sky lantern of oiled rice-paper and bamboo for the mass release.",
    mini: "Have the player describe their lantern's shape and motif — a koi, a dragon, a willow, a lost loved one's favourite flower. No crows or ravens; jorogumo loathe them. Lanterns double as signal-fires, so a clever PC can encode a message to a neighbouring village at DC 20 Society.",
    payoff: "Hope — a sky full of lights tells every village its neighbours still live. A dark lantern means someone has fallen, and is a ready hook for next session.",
    win: { hope: 1 }, big: { hope: 2 }
  }
};

/* --------------------------------------------------------------- booths */
const BOOTHS = [
  { key: "mooncake", tone: "moss", name: "The Mooncake Bake-Off", tag: "Food",
    run: "DC 17 Cooking Lore or DC 20 Crafting to bake salt-and-pepper mooncakes, then a second check to plate and present.",
    rp: "Mama Bao judges with theatrical cruelty. Granny Hu and Old Matsuki feud over the proper filling. A PC who befriends a humble baker learns a secret family recipe.",
    payoff: "+1 Food per success to a maximum of 2, and Reputation for the winning batch.",
    awards: [{ label: "+1 Food", delta: { food: 1 } }, { label: "+1 Rep (winner)", rep: 1 }] },
  { key: "crickets", tone: "ember", name: "Drinking with the Crickets", tag: "Hope · comedy",
    run: "A press-your-luck round of grain-mush toasts to the cricket-spirits. DC 16 Fortitude, rising +2 each toast.",
    rp: "The crickets are sacrificial proxies for the spiders — toasting them is half apology, half gallows humour. A drunk villager confesses something real.",
    payoff: "Surviving three or more toasts earns 1 Hope and a free Gather Information. A crit failure is a comedic mishap and a rumour at your expense.",
    awards: [{ label: "+1 Hope (3+ toasts)", delta: { hope: 1 } }] },
  { key: "silver", tone: "slate", name: "Bribing Fumeiyoshi", tag: "Security · a choice",
    run: "Scatter hoarded silver dust at the gravesites to placate the god of envy — DC 18 Religion for the proper rite. Bandits lurk to pocket the dust; catching one is DC 20 Perception.",
    rp: "A moral knot for a thief: protect the offering, look the other way, or pocket it and risk a very literal curse.",
    payoff: "The rite done well means fewer winter undead. Letting thieves take it seeds a wasting-curse rumour and a future encounter.",
    awards: [{ label: "+1 Security (rite done well)", delta: { security: 1 } }] },
  { key: "strings", tone: "plum", name: "Red String Fortunes", tag: "Roleplay · foreshadowing",
    run: "A fortune-teller ties a red string and reads what clings to it. No check needed. DC 16 Occultism tells true sight from showmanship.",
    rp: "Your mouthpiece for ominous foreshadowing of Acts 3 and 4 — a man wears your face; you have walked among the dead and not known it; the lantern's light will leave Willowshore.",
    payoff: "No points. Pure flavour, dread, and player paranoia.",
    awards: [] },
  { key: "tea", tone: "gold", name: "The Moonlit Tea Ceremony", tag: "Reputation · the teahouse",
    run: "DC 18 Tea Lore or DC 20 Diplomacy to host visiting elders, merchants, and a priest gracefully.",
    rp: "The teahouse as community hearth, and a chance to charm both factions at one table. A quiet word with a mysterious traveller.",
    payoff: "1–2 Reputation and a standing discount with a merchant. Sets the teahouse up as the venue for the show.",
    awards: [{ label: "+1 Rep", rep: 1 }, { label: "+2 Rep", rep: 2 }] },
  { key: "strength", tone: "ember", name: "Strength of the Harvest", tag: "Bragging rights",
    run: "Haul the log, ring the gong, out-arm-wrestle the blacksmith. Best of three DC 19 Athletics.",
    rp: "The loud, sweaty, joyful core of the festival — a reminder to the living and the dead of the tenacity of life. A friendly rivalry with a local strongman who becomes an ally.",
    payoff: "1 Hope on an overwhelming win, and a sturdy keepsake.",
    awards: [{ label: "+1 Hope (overwhelming)", delta: { hope: 1 } }] },
  { key: "riddles", tone: "plum", name: "Lantern Riddles", tag: "Wits",
    run: "Riddles brushed onto hanging lantern-slips. Solve three of five at DC 18 Society or DC 18 relevant Lore — or let the players solve the real ones.",
    rp: "A surreptitious literacy drill under jorogumo noses. The riddle-master is a retired scholar hiding forbidden learning, and a research ally for later acts.",
    payoff: "A minor prize, goodwill with the scholar, and a hint toward a town opportunity.",
    awards: [{ label: "+1 Rep", rep: 1 }] },
  { key: "forest", tone: "gold", name: "Wearing the Forest", tag: "Fashion · social",
    run: "A costume promenade — waxed-straw capes, conical hats, miniature lanterns, glowing weapons. DC 17 Crafting or DC 17 Performance to turn heads.",
    rp: "Pure character expression. Let each PC describe their festival fit; the best-dressed verdict is crowd cheer, not dice.",
    payoff: "Reputation and a small token. Glowing-weapon wearers get a nod toward winter's undead-versus-light tactics.",
    awards: [{ label: "+1 Rep", rep: 1 }] }
];

/* -------------------------------------------------------- complications */
const COMPLICATIONS = [
  { name: "Grave-robbers at the silver", text: "Bandits work the cemetery edge, scooping up scattered silver dust. Confront them, scare them off, or let Fumeiyoshi handle it — with consequences either way. Security is on the line." },
  { name: "The string that fell", text: "A frightened villager's red string drops, and something starts following them home. A bite-sized exorcism the PCs can resolve before dawn." },
  { name: "A guest who shouldn't be here", text: "A silver-collared stranger attends, all smiles. Tonight they only watch — but a too-bold Defiance show or a careless word becomes a thread that tightens in Act 4." },
  { name: "The lantern that fell from the sky", text: "An echo of the golden-spider-lantern disaster: a rogue sky lantern threatens a thatch roof. A quick DC 18 Athletics or Reflex rescue earns a heroic Security point and a great image." },
  { name: "A dark horizon", text: "When the lanterns rise, a neighbouring village's sky stays empty. Have they fallen to ghosts? A clean lead-in to the next session." },
  { name: "The uninvited mourner", text: "A genuine ghost — not hostile, just lost — lingers at the festival's edge, drawn by music and remembrance. Lay it to rest with the right words for a Hope reward and a poignant beat." }
];

/* --------------------------------------------------- the games tournament */
const DISCIPLINES = {
  body:   { tone: "slate", label: "Feats of Body", sub: "speed, strength, nerve", sweep: "Champion of Body" },
  wit:    { tone: "plum", label: "Feats of Wit", sub: "cleverness and nerve of mind", sweep: "Champion of Wit" },
  heart:  { tone: "ember", label: "Feats of Heart", sub: "showmanship, charm, sheer audacity", sweep: "Champion of Heart" },
  daring: { label: "Feats of Luck and Daring", sub: "guts, chance, and mischief", sweep: "Champion of Daring" }
};

const GAMES = [
  { key: "sprint", disc: "body", name: "Bundle-Cutting Sprint", format: "Head-to-head heats",
    run: "The festival classic run as a race. Each PC starts bound — Escape DC 17 — then sprints for a stone dagger and cuts straw bundles free against the clock. Three rounds of DC 17 checks: Thievery to slip the knots, Athletics to dash, Survival to cut clean. Most bundles in three rounds wins; a botched escape costs precious tempo.",
    crown: "A frayed-rope bracelet", title: "The Quick-Hand" },
  { key: "pole", disc: "body", name: "The Greased Crown-Pole", format: "First to the top",
    run: "A tall, lard-slicked pole with a golden lantern lashed at the peak. DC 20 Athletics or DC 22 Acrobatics per round; first to three successes, or the highest total after three rounds. A failed round means sliding back a length.",
    crown: "The actual Crown Lantern, to release at dawn", title: "The High-Reacher" },
  { key: "cricket", disc: "body", name: "Cricket Catch", format: "Simultaneous, one minute",
    run: "A basket of festival crickets is loosed. Three DC 18 Acrobatics or DC 18 Reflex checks; each success is a handful caught, a crit is double. Chaos, leaping, and one cricket that always gets away.",
    crown: "A carved cricket-cage", title: "Cricket-Friend" },
  { key: "riddle", disc: "wit", name: "The Riddle Gauntlet", format: "Buzzer-style, first to answer",
    run: "The riddle-master reads six festival riddles — all six are in the kit below. First player to call the right answer takes the point; most points after six wins. Let the players solve them for real, and fall back on DC 18 Society or a relevant Lore only if someone wants their character to be cleverer than they are.",
    crown: "A brushed riddle-scroll", title: "The Sharp-Tongue" },
  { key: "stones", disc: "wit", name: "Moon-Stones", format: "A real bead game — rules in the kit",
    run: "A fan-tan-style guessing game with stones and a bowl: bet on the remainder when the hidden pile is counted out in fours. Pure table play with moon-tokens, worthless past tonight. Most tokens after five rounds wins.",
    crown: "A pouch of moon-tokens", title: "Luck of the Moon" },
  { key: "cipher", disc: "wit", name: "The Lantern Cipher", format: "First to decode",
    run: "Sky lanterns are signals. Given the motif key in the kit, race to read a string of painted lanterns into a message. First correct reading wins, or DC 20 Society to puzzle it out character-side.",
    crown: "First pick of any released lantern", title: "The Far-Speaker" },
  { key: "poetry", disc: "heart", name: "Admiring the Moon — poetry duel", format: "Compose and recite",
    run: "Each player composes a short verse for real — the prompt scaffold in the kit is there for anyone who freezes — then recites it. The table votes and you judge on evocativeness. Back it with DC 19 Performance only if a player wants their bard's polish to outshine their own poetry. Best of three rounds.",
    crown: "A lacquered fan", title: "Moon-Poet", favor: "First toast at the feast" },
  { key: "boast", disc: "heart", name: "The Boast-Off", format: "Improv, table votes",
    run: "Players take turns telling ever-taller tales of their own deeds, each one-upping the last. The crowd cheers the most gloriously absurd yet charming boast. A DC 18 Deception sells a truly outrageous claim straight-faced.",
    crown: "Free drinks all night", title: "Teller of Tall Tales" },
  { key: "catwalk", disc: "heart", name: "Wearing the Forest — the catwalk", format: "Best-dressed, crowd cheer",
    run: "Each PC describes their festival fit: waxed-straw cape, conical hat, glowing weapon, miniature lantern. Decided by crowd cheer rather than dice. DC 17 Crafting matters only if someone made their own.",
    crown: "A fine straw-and-bamboo cape", title: "Forest-Clad" },
  { key: "drinking", disc: "daring", name: "Drinking with the Crickets", format: "Last one standing",
    run: "Round after round of grain-mush toasts to the cricket-spirits. DC 16 Fortitude, rising +2 every round. Fail and you're out, and gently roasted by the crowd. Last drinker upright wins.",
    crown: "A gourd flask", title: "Iron-Gut" },
  { key: "toss", disc: "daring", name: "The Wishing Toss", format: "Accuracy, best of five",
    run: "Toss rings onto floating lantern-posts. Five throws each at DC 18 Reflex or a Dex-based skill; count the ringers. Ties settle with a single sudden-death throw.",
    crown: "A granted wish — a small story boon at your discretion", title: "True-Aim", favor: "Your festival wish is granted" },
  { key: "ghost", disc: "daring", name: "The Ghost in the Lanterns", format: "Hide-and-tag, one masked ghost",
    run: "One player draws the paper ghost-mask and gets a head start to vanish into the lantern-lit grounds. The rest are ghost-catchers. Over three rounds the ghost rolls Stealth to slip between zones while catchers roll Perception, then DC 18 Athletics to close and tag. Untagged after three rounds, the ghost wins; otherwise the tagger does. Rotate the mask and run it a few times.",
    crown: "The paper ghost-mask itself", title: "The Unseen, or Ghost-Catcher" }
];

const KIT_RIDDLES = [
  ["Born of paper and small flame, I climb to carry a wish; cut my tether and I roam the sky, yet home is the one place I never fly.", "a sky lantern"],
  ["I am fullest the night you honour your dead, then I waste away till I've gone instead; wait a while and I swell once more.", "the moon"],
  ["Tie me close and the dead stay shy; should I slip and fall, let me lie — lift me up, and they'll return.", "a red string"],
  ["I chirp in the grass and I'm given to spiders, a tattler's stand-in, a wager against the dark.", "a cricket"],
  ["Clean me and I am family and blessing; neglect me and I rise as a threat.", "an ancestor's grave"],
  ["Round as the harvest, sweet or salted within; share me with strangers and good fortune begins.", "a mooncake"]
];

const CIPHER_KEY = [
  ["Koi", "all is well"], ["Crane", "we need aid"], ["Willow", "we mourn a death"],
  ["Dragon", "monsters, danger"], ["Sparrow", "good news, a birth"], ["Carp leaping", "come celebrate"]
];

/* ------------------------------------------------------------------ state */
function blankState(pcs) {
  return {
    v: 1,
    tab: "show",
    phase: 0,
    pcs,
    show: { line: "remembrance", rehearsed: "", results: {}, paid: false, paidValues: null },
    contests: { moon: [null, null, null, null], bundle: [null, null, null, null], lantern: [null, null, null, null] },
    contestApplied: {},
    booths: {},
    games: {},
    ledger: { hope: 0, food: 0, security: 0, rep: 0 },
    log: []
  };
}

function pickArt(actor) {
  const token = actor.prototypeToken?.texture?.src ?? "";
  const usable = token && !/\.(webm|mp4|m4v)$/i.test(token) && !token.includes("*");
  return usable ? token : (actor.img || "icons/svg/mystery-man.svg");
}
function pcInfo(actor) {
  return { name: actor.name, actorId: actor.id, img: pickArt(actor) };
}
function detectPCs() {
  const seen = new Map();
  const add = (a) => { if (a?.id && !seen.has(a.id)) seen.set(a.id, pcInfo(a)); };
  const party = game.actors.party ?? game.actors.find(a => a.type === "party");
  for (const m of party?.members ?? []) add(m);
  if (seen.size < MAX_PCS) for (const u of game.users) { if (!u.isGM) add(u.character); }
  if (seen.size < MAX_PCS) {
    for (const a of game.actors) {
      if (seen.size >= MAX_PCS) break;
      if (a.hasPlayerOwner && (a.type === "character" || a.type === "PC")) add(a);
    }
  }
  const list = [...seen.values()].slice(0, MAX_PCS);
  while (list.length < MAX_PCS) list.push({ name: `PC ${list.length + 1}`, actorId: "", img: "icons/svg/mystery-man.svg" });
  return list;
}
function refreshPCs(pcs) {
  const detected = detectPCs();
  return (pcs ?? []).map((pc, i) => {
    const actor = pc.actorId ? game.actors.get(pc.actorId) : null;
    if (actor) return pcInfo(actor);
    if (detected[i]?.actorId) return detected[i];
    return { name: pc.name ?? `PC ${i + 1}`, actorId: "", img: pc.img || "icons/svg/mystery-man.svg" };
  });
}

function registerSettings() {
  if (!game.settings.settings.has(FLN_ID)) {
    game.settings.register(FLN_NS, FLN_KEY, { scope: "world", config: false, type: Object, default: null });
  }
  if (!game.settings.settings.has(DOWNTIME_ID)) {
    game.settings.register("world", "sogFallDowntime", { scope: "world", config: false, type: Object, default: null });
  }
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ------------------------------------------------------------- the journal
   The Season of Ghosts module ships the festival as its own journal entry —
   seventeen pages of foods, fashion, contests and customs — alongside the
   week 3 page in the chapter itself. Both have fixed ids that a Foundry
   adventure import keeps, so a button can open the page a section came from.
   Ids read out of the module's pack.

   None of this is required. An entry resolves by id, then by name, then
   through the compendiums, and if the adventure isn't in the world no link
   renders at all. */
const JOURNALS = {
  night: { id: "pf2apsog17firstl", name: "First Long Night" },
  chapter: { id: "pf2apsog07turnin", name: "Act 2.1: Turning of the Seasons" }
};
const JPAGE = {
  /* First Long Night */
  festival: "17firstlongnig00", celebrations: "17festivalcele00", contests: "17traditionalc00",
  bundle: "17bundlecuttin00", moon: "17admiringthem00", agility: "17agilityunder00",
  foods: "17festivalfood00", fashion: "17festivalfash00", lanterns: "17lanternmakin00",
  markets: "17seasonalmark00", warmth: "17coldnightswa00", revivals: "17communalrevi00",
  /* Turning of the Seasons */
  week3: "07week3firstlo00", night: "07onthenightof00"
};

const jnorm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const entryFor = (pageId) => pageId.startsWith("17") ? JOURNALS.night : JOURNALS.chapter;

/* World only, and synchronous — the UI uses it to decide whether a link is
   worth offering before anyone clicks it. */
function journalEntry(desc) {
  const byId = game.journal?.get?.(desc.id);
  if (byId) return byId;
  const want = jnorm(desc.name), all = [...(game.journal ?? [])];
  return all.find(j => jnorm(j.name) === want)
      ?? all.find(j => jnorm(j.name).endsWith(want)) ?? null;
}

async function journalDoc(desc) {
  const local = journalEntry(desc);
  if (local) return local;
  const want = jnorm(desc.name);
  for (const pack of game.packs ?? []) {
    if (pack.documentName !== "JournalEntry") continue;
    const idx = [...pack.index];
    const hit = pack.index.get?.(desc.id) ?? idx.find(e => jnorm(e.name) === want);
    if (hit) return pack.getDocument(hit._id);
  }
  return null;
}

const journalPage = (entry, pageId) =>
  (entry?.pages?.contents ?? entry?.pages ?? []).find(p => p.id === pageId) ?? null;

async function openJournal(pageId) {
  const desc = entryFor(pageId);
  const entry = await journalDoc(desc);
  if (!entry) {
    ui.notifications.warn(`No journal found for "${desc.name}". Looked for the id ${desc.id}, then that name in the journal directory and the compendiums.`);
    return;
  }
  const page = journalPage(entry, pageId);
  entry.sheet.render(true, page ? { pageId: page.id } : {});
}


/* ----------------------------------------------------------------- engine */
class Festival {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  get editable() { return game.user.isGM; }

  log(msg) { this.s.log.unshift(msg); this.s.log = this.s.log.slice(0, 50); }
  async save() { if (this.editable) await game.settings.set(FLN_NS, FLN_KEY, this.s); }
  render() { this.app?.render(); }
  touch() { this.render(); this.save(); }

  async postCard(eyebrow, title, bodyHtml, tone = "ember") {
    const C = { ember: "#a45c14", moss: "#4b5a34", slate: "#3d4c59", plum: "#5d3654", gold: "#8a6a12", rust: "#95381f" };
    await ChatMessage.create({
      content: `<div style="background:#efe6d8;color:#241c18;border:1px solid #b9a687;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.ember};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "First Long Night" }
    });
  }

  postContest(key) {
    const c = CONTESTS[key];
    return this.postCard(c.tag, c.name,
      `<p style="margin:0 0 5px"><b>${c.check}</b></p><p style="margin:0">${c.mini}</p>`, c.tone);
  }
  postBooth(key) {
    const b = BOOTHS.find(x => x.key === key);
    return this.postCard(b.tag, b.name,
      `<p style="margin:0 0 5px"><b>${b.run}</b></p><p style="margin:0">${b.rp}</p>`, b.tone);
  }
  postGame(key) {
    const g = GAMES.find(x => x.key === key);
    return this.postCard(g.format, g.name,
      `<p style="margin:0 0 5px">${g.run}</p><p style="margin:0;font-size:11px;color:#6d6052"><b>Prize</b> ${g.crown} · <b>Title</b> ${g.title}</p>`,
      DISCIPLINES[g.disc].tone);
  }
  postComplication(i) {
    const c = COMPLICATIONS[i];
    return this.postCard("A turn in the night", c.name, `<p style="margin:0">${c.text}</p>`, "plum");
  }
  postMovement(id) {
    const m = MOVEMENTS.find(x => x.id === id);
    const line = THROUGHLINES[this.s.show.line];
    const check = m.dynamic ? `${line.check} — ${line.turn}` : m.check;
    return this.postCard(`Movement ${m.id} · ${m.tag}`, `${m.name} — ${m.sub}`,
      `<p style="margin:0 0 5px"><b>${check}</b></p><p style="margin:0">${m.text}</p>`, "ember");
  }

  clearContest(key) {
    this.s.contests[key] = [null, null, null, null];
    if (this.s.contestApplied[key]) this.applyContest(key, true);
    this.log(`${CONTESTS[key].name}: checks cleared.`);
    this.touch();
  }

  clearShow() {
    if (this.s.show.paid) this.payCurtain(true);
    this.s.show.results = {};
    this.log("Grand show cleared.");
    this.touch();
  }

  resetNight() {
    this.state = blankState(this.s.pcs);
    this.touch();
    ui.notifications.info("First Long Night reset.");
  }

  /* ---- the grand show ---- */
  get showVP() {
    return MOVEMENTS.reduce((sum, m) => {
      const d = this.s.show.results[m.id];
      if (!d) return sum;
      return sum + VP[d] * (m.id === "III" ? 2 : 1);
    }, 0);
  }
  get curtain() { return CURTAIN.find(c => this.showVP >= c.min); }

  setMovement(id, deg) {
    const cur = this.s.show.results[id];
    this.s.show.results[id] = cur === deg ? null : deg;
    const m = MOVEMENTS.find(x => x.id === id);
    this.log(`${m.name}: ${this.s.show.results[id] ? DEG_LABEL[deg] : "cleared"}`);
    this.touch();
  }

  async payCurtain(undo = false) {
    if (undo) {
      const v = this.s.show.paidValues;
      if (v) {
        this.s.ledger.hope -= v.hope ?? 0;
        this.s.ledger.food -= v.food ?? 0;
        this.s.ledger.rep -= v.rep ?? 0;
      }
      this.s.show.paid = false;
      this.s.show.paidValues = null;
      this.log("Curtain call payout undone.");
      this.touch();
      return;
    }
    if (this.s.show.paid) return ui.notifications.warn("The curtain call has already been paid out.");
    const band = this.curtain;
    let hope = 0;
    if (band.formula) {
      const roll = await new Roll(band.formula).evaluate();
      hope = roll.total;
      await roll.toMessage({ flavor: `First Long Night — ${band.label}: Hope earned` });
    } else if (band.flat) hope = band.flat;

    this.s.ledger.hope += hope;
    if (band.food) this.s.ledger.food += band.food;
    if (band.rep) this.s.ledger.rep += band.rep * (band.both ? 2 : 1);
    this.s.show.paid = true;
    this.s.show.paidValues = { hope, food: band.food ?? 0, rep: (band.rep ?? 0) * (band.both ? 2 : 1) };
    this.log(`Curtain call — ${band.label}: +${hope} Hope${band.food ? `, +${band.food} Food` : ""}${band.rep ? `, +${band.rep} Rep${band.both ? " with both factions" : ""}` : ""}`);
    ui.notifications.info(`${band.label} — ${hope} Hope earned.`);
    this.touch();
  }

  /* ---- contests ---- */
  contestVP(key) {
    return this.s.contests[key].reduce((n, d) => n + (d ? VP[d] : 0), 0);
  }
  setContest(key, i, deg) {
    const arr = this.s.contests[key];
    arr[i] = arr[i] === deg ? null : deg;
    this.touch();
  }
  applyContest(key, undo = false) {
    const c = CONTESTS[key];
    const prev = this.s.contestApplied[key];
    if (undo || prev) {
      if (prev) for (const [k, v] of Object.entries(prev)) this.s.ledger[k] -= v;
      this.s.contestApplied[key] = null;
      this.log(`${c.name}: payoff undone.`);
      this.touch();
      return;
    }
    const vp = this.contestVP(key);
    if (vp < 4) return ui.notifications.warn(`${c.name} needs 4 victory points to count as a win.`);
    const award = vp >= 6 ? c.big : c.win;
    for (const [k, v] of Object.entries(award)) this.s.ledger[k] += v;
    this.s.contestApplied[key] = { ...award };
    this.log(`${c.name} — ${vp >= 6 ? "overwhelming win" : "win"} (${vp} VP): ${Object.entries(award).map(([k, v]) => `+${v} ${cap(k)}`).join(", ")}`);
    ui.notifications.info(`${c.name}: ${vp >= 6 ? "overwhelming win" : "win"}.`);
    this.touch();
  }

  /* ---- booths ---- */
  toggleBooth(key, idx) {
    const booth = BOOTHS.find(b => b.key === key);
    const award = booth.awards[idx];
    const st = this.s.booths[key] ?? (this.s.booths[key] = {});
    const on = !!st[idx];
    const sign = on ? -1 : 1;
    if (award.delta) for (const [k, v] of Object.entries(award.delta)) this.s.ledger[k] += v * sign;
    if (award.rep) this.s.ledger.rep += award.rep * sign;
    st[idx] = !on;
    this.log(`${booth.name} — ${on ? "undid" : "awarded"} ${award.label}`);
    this.touch();
  }

  /* ---- games ---- */
  medal(gameKey, medal, pcIdx) {
    const g = this.s.games[gameKey] ?? (this.s.games[gameKey] = { gold: null, silver: null });
    g[medal] = g[medal] === pcIdx ? null : pcIdx;
    if (medal === "gold" && g.silver === pcIdx) g.silver = null;
    if (medal === "silver" && g.gold === pcIdx) g.gold = null;
    this.touch();
  }
  medalCount(pcIdx) {
    let gold = 0, silver = 0;
    for (const g of Object.values(this.s.games)) {
      if (g.gold === pcIdx) gold++;
      if (g.silver === pcIdx) silver++;
    }
    return { gold, silver, points: gold * 2 + silver };
  }
  titlesFor(pcIdx) {
    const out = [];
    for (const [k, g] of Object.entries(this.s.games)) {
      if (g.gold !== pcIdx) continue;
      const def = GAMES.find(x => x.key === k);
      if (def) out.push(def.title);
    }
    for (const [dk, d] of Object.entries(DISCIPLINES)) {
      const events = GAMES.filter(g => g.disc === dk);
      if (events.length && events.every(g => this.s.games[g.key]?.gold === pcIdx)) out.push(d.sweep);
    }
    return out;
  }
  get champion() {
    const scored = this.s.pcs.map((pc, i) => ({ i, pc, ...this.medalCount(i) })).filter(x => x.points > 0);
    if (!scored.length) return null;
    const top = Math.max(...scored.map(x => x.points));
    const leaders = scored.filter(x => x.points === top);
    return { leaders, points: top, tied: leaders.length > 1 };
  }

  /* ---- ledger ---- */
  async pushToDowntime() {
    const dt = game.settings.get("world", "sogFallDowntime");
    if (!dt) return ui.notifications.error("No downtime tracker state found. Run the Fall Downtime Tracker macro once first.");
    const l = this.s.ledger;
    dt.pools.hope += l.hope;
    dt.pools.food += l.food;
    dt.pools.security += l.security;
    const wk = dt.weeks?.["3"];
    if (wk?.log) wk.log.unshift(`First Long Night: +${l.hope} Hope, +${l.food} Food, +${l.security} Security, +${l.rep} Reputation to assign.`);
    await game.settings.set("world", "sogFallDowntime", dt);
    ui.notifications.info(`Sent to the downtime tracker: +${l.hope} Hope, +${l.food} Food, +${l.security} Security. Assign ${l.rep} Reputation by hand.`);
    this.log(`Ledger pushed to the downtime tracker.`);
    this.touch();
  }

  async postPhase() {
    const p = PHASES[this.s.phase];
    await ChatMessage.create({
      content: `<div style="font-family:Signika,sans-serif">
        <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052">${p.sub}</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:2px">${p.name}</div>
        <div style="font-style:italic;font-size:12px;margin-bottom:4px">${p.mood}</div>
        <div style="font-size:12px">${p.beat}</div></div>`,
      speaker: { alias: "First Long Night" }
    });
  }

  async postStandings() {
    const rows = this.s.pcs.map((pc, i) => {
      const m = this.medalCount(i);
      const titles = this.titlesFor(i);
      return { pc, m, titles };
    }).sort((a, b) => b.m.points - a.m.points);
    const champ = this.champion;
    const body = rows.map(r => `<tr>
      <td style="padding:3px 8px 3px 0;border-top:1px solid rgba(0,0,0,.1);font-weight:600">${esc(r.pc.name)}</td>
      <td style="padding:3px 8px 3px 0;border-top:1px solid rgba(0,0,0,.1);text-align:center">${r.m.gold}</td>
      <td style="padding:3px 8px 3px 0;border-top:1px solid rgba(0,0,0,.1);text-align:center">${r.m.silver}</td>
      <td style="padding:3px 8px 3px 0;border-top:1px solid rgba(0,0,0,.1);text-align:center;font-weight:600">${r.m.points}</td>
      <td style="padding:3px 0;border-top:1px solid rgba(0,0,0,.1);font-size:11px;font-style:italic">${r.titles.join(", ")}</td>
    </tr>`).join("");

    await ChatMessage.create({
      content: `<div style="background:#efe6d8;color:#241c18;border:1px solid #b9a687;border-radius:4px;padding:8px 10px;font-family:Signika,sans-serif">
        <div style="border-left:3px solid #8a6a12;padding-left:8px;margin-bottom:8px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6d6052">Standings</div>
          <div style="font-size:15px;font-weight:600">First Long Night</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr><th style="text-align:left;font-size:9px;text-transform:uppercase;color:#6d6052">Competitor</th>
          <th style="font-size:9px;text-transform:uppercase;color:#6d6052">Gold</th>
          <th style="font-size:9px;text-transform:uppercase;color:#6d6052">Silver</th>
          <th style="font-size:9px;text-transform:uppercase;color:#6d6052">Pts</th>
          <th style="text-align:left;font-size:9px;text-transform:uppercase;color:#6d6052">Titles</th></tr>
          ${body}
        </table>
        ${champ && !champ.tied ? `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #b9a687;font-size:12px">
          <b>${esc(champ.leaders[0].pc.name)}</b> wears the Lantern Crown and lights the great dawn lantern.</div>` : ""}
        ${champ?.tied ? `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #b9a687;font-size:12px">
          Tied at ${champ.points} — a sudden-death round of the champions' choosing, or co-crown them.</div>` : ""}
      </div>`,
      speaker: { alias: "First Long Night" }
    });
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class FLNApp extends BaseApp {
  constructor(fest, ...args) { super(...args); this.fest = fest; fest.app = this; }

  static DEFAULT_OPTIONS = {
    id: "fln-console", tag: "div", classes: ["fln-console"],
    position: { width: 900, height: "auto" },
    window: { title: "First Long Night", icon: "fa-solid fa-moon", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "fln-console", classes: ["fln-console"], title: "First Long Night",
      width: 900, height: "auto", resizable: true
    });
  }
  get title() { return "First Long Night"; }

  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="fln-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  /* ------------------------------------------------------------- markup */
  markup() {
    const f = this.fest, s = f.s, ro = !f.editable;
    /* The tab strip carries the same colours the panels under it use, so
       the strip says where you are before you read it. */
    const tabs = [
      { k: "show", label: "Grand show", tone: "plum", icon: "fa-masks-theater" },
      { k: "contests", label: "Contests", tone: "ember", icon: "fa-trophy" },
      { k: "booths", label: "Booths", tone: "moss", icon: "fa-store" },
      { k: "games", label: "The games", tone: "gold", icon: "fa-medal" },
      { k: "kit", label: "GM kit", tone: "slate", icon: "fa-toolbox" }
    ];
    return `
      ${this.styles()}
      <div class="fln">
        ${this.phaseStrip(ro)}
        <nav class="tabs">
          ${tabs.map(x => `<button type="button" class="tab ${s.tab === x.k ? "on" : ""}" style="--tt:var(--${x.tone})" data-act="tab" data-k="${x.k}"><i class="fa-solid ${x.icon}"></i> ${x.label}</button>`).join("")}
        </nav>
        ${s.tab === "show" ? this.showTab(ro) : ""}
        ${s.tab === "contests" ? this.contestTab(ro) : ""}
        ${s.tab === "booths" ? this.boothTab(ro) : ""}
        ${s.tab === "games" ? this.gamesTab(ro) : ""}
        ${s.tab === "kit" ? this.kitTab() : ""}
        ${this.ledgerBar(ro)}
      </div>`;
  }

  /* A link into the module's journal, or nothing at all when the adventure
     isn't in this world. A button that could only ever say "not found" would
     be worse than no button. */
  jbtn(pageId, label = "") {
    const entry = journalEntry(entryFor(pageId));
    if (!entry) return "";
    const page = journalPage(entry, pageId);
    return `<button type="button" class="jbtn" data-act="journal" data-r="${esc(pageId)}"
      title="Open the journal: ${esc(page ? page.name : entry.name)}"><i class="fa-solid fa-book-open"></i>${label ? ` ${label}` : ""}</button>`;
  }

  phaseStrip(ro) {
    const s = this.fest.s;
    const p = PHASES[s.phase];
    return `
      <header class="phasebar">
        <div class="phases">
          ${PHASES.map((x, i) => `<button type="button" class="ph ${i === s.phase ? "on" : ""} ${i < s.phase ? "past" : ""}" data-act="phase" data-i="${i}" title="${x.name}">${x.name}</button>`).join("")}
        </div>
        <div class="phasenow">
          <div class="pn-mood">${p.mood}</div>
          <div class="pn-beat">${p.beat}</div>
          <button type="button" class="mini" data-act="postphase"><i class="fa-solid fa-comment"></i> Read to the table</button>
        </div>
      </header>`;
  }

  showTab(ro) {
    const f = this.fest, s = f.s;
    const line = THROUGHLINES[s.show.line];
    const vp = f.showVP;
    const band = f.curtain;

    const movements = MOVEMENTS.map(m => {
      const check = m.dynamic ? `${line.check} — ${line.turn}` : m.check;
      const res = s.show.results[m.id];
      return `
        <article class="mv ${res ? "done" : ""} ${m.id === "III" ? "key" : ""}">
          <div class="mv-head">
            <span class="numeral">${m.id}</span>
            <div class="mv-name"><b>${m.name}</b><small>${m.sub}</small></div>
            <span class="chip">${m.tag}</span>
            <button type="button" class="say" data-act="saymv" data-id="${m.id}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
          </div>
          <div class="mv-check">${check}</div>
          <p class="mv-text">${m.text}</p>
          <div class="degs">
            ${DEG.map(d => `<button type="button" class="deg ${d} ${res === d ? "on" : ""}" data-act="mv" data-id="${m.id}" data-d="${d}" ${ro ? "disabled" : ""}>${DEG_LABEL[d]}</button>`).join("")}
          </div>
          ${res === "cf" ? `<p class="botch">${m.botch}</p>` : ""}
        </article>`;
    }).join("");

    return `
      <section class="panel">
        <h3>Setting the stage ${this.jbtn(JPAGE.night)}</h3>
        <div class="stage">
          <label class="fld">Through-line
            <select data-act="line" ${ro ? "disabled" : ""}>
              ${Object.entries(THROUGHLINES).map(([k, t]) => `<option value="${k}" ${s.show.line === k ? "selected" : ""}>${t.label} — ${t.sub}</option>`).join("")}
            </select>
          </label>
          <label class="fld">Rehearsed movement <small>a downtime block at DC 17 Performance grants +1; a crit grants two</small>
            <select data-act="rehearse" ${ro ? "disabled" : ""}>
              <option value="">— none —</option>
              ${MOVEMENTS.map(m => `<option value="${m.id}" ${s.show.rehearsed === m.id ? "selected" : ""}>${m.id}. ${m.name}</option>`).join("")}
            </select>
          </label>
        </div>
        <p class="hint">Each movement is a single check — the lead performer rolls, others may Aid at DC 15. Crit success 2 VP, success 1, failure 0, crit failure −1 and the complication fires. The Turn counts double.</p>
      </section>

      <section class="movements">${movements}</section>

      <section class="panel curtain ${band.min >= 8 ? "triumph" : ""}">
        <h3>Curtain call <small>${vp} victory points</small></h3>
        <div class="bands">
          ${CURTAIN.map(c => `<div class="band ${c === band ? "on" : ""}"><b>${c.min >= 0 ? `${c.min}+` : "0–1"}</b> ${c.label}</div>`).join("")}
        </div>
        <p class="mv-text">${band.text}</p>
        <p class="reward">${band.formula ? `${band.formula} Hope` : band.flat ? `${band.flat} Hope` : "No Hope gained, none lost"}${band.food ? ` · +${band.food} Food` : ""}${band.rep ? ` · +${band.rep} Reputation${band.both ? " with both factions" : " with one faction"}` : ""}</p>
        <div class="btnrow">
          <button type="button" class="primary" data-act="paycurtain" ${ro || s.show.paid ? "disabled" : ""}>
            ${s.show.paid ? "Curtain call paid" : "Roll the curtain call"}
          </button>
          ${s.show.paid ? `<button type="button" class="ghost" data-act="undocurtain" ${ro ? "disabled" : ""}>Undo payout</button>` : ""}
          <button type="button" class="ghost" data-act="clearshow" ${ro ? "disabled" : ""}>Clear the show</button>
        </div>
      </section>

      <section class="panel">
        <h3>Spotlight beats <small>drop into the show</small> ${this.jbtn(JPAGE.celebrations)}</h3>
        <ul class="checks">${SPOTLIGHTS.map(x => `<li>${x}</li>`).join("")}</ul>
      </section>`;
  }

  contestTab(ro) {
    const f = this.fest;
    const cards = Object.entries(CONTESTS).map(([k, c]) => {
      const vp = f.contestVP(k);
      const state = vp >= 6 ? "overwhelming win" : vp >= 4 ? "win" : "not yet";
      return `
        <article class="panel contest ${vp >= 4 ? "won" : ""}" style="--tone:var(--${c.tone})">
          <h3>${c.name} <small>${c.tag}</small><span class="vp">${vp} VP · ${state}</span>
            <button type="button" class="say" data-act="saycontest" data-k="${k}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
          </h3>
          <div class="mv-check">${c.check}</div>
          <p class="mv-text"><b>Run it as a game:</b> ${c.mini}</p>
          <div class="rounds">
            ${[0, 1, 2, 3].map(i => {
              const cur = f.s.contests[k][i];
              return `<div class="round">
                <span class="rlabel">Check ${i + 1}</span>
                ${DEG.map(d => `<button type="button" class="deg sm ${d} ${cur === d ? "on" : ""}" data-act="contest" data-k="${k}" data-i="${i}" data-d="${d}" title="${DEG_LABEL[d]}" ${ro ? "disabled" : ""}>${d === "cs" ? "CS" : d === "s" ? "S" : d === "f" ? "F" : "CF"}</button>`).join("")}
              </div>`;
            }).join("")}
          </div>
          <p class="hint">${c.payoff}</p>
          <div class="btnrow">
            <button type="button" class="${f.s.contestApplied[k] ? "ghost" : "primary"}" data-act="applycontest" data-k="${k}" ${ro || (vp < 4 && !f.s.contestApplied[k]) ? "disabled" : ""}>
              ${f.s.contestApplied[k] ? "Undo the payoff" : "Award the payoff"}
            </button>
            <button type="button" class="ghost" data-act="clearcontest" data-k="${k}" ${ro ? "disabled" : ""}>Clear checks</button>
          </div>
        </article>`;
    }).join("");
    return `<div class="stack">${cards}</div>`;
  }

  boothTab(ro) {
    const f = this.fest;
    return `<div class="booths">${BOOTHS.map(b => {
      const st = f.s.booths[b.key] ?? {};
      return `
        <article class="panel booth" style="--tone:var(--${b.tone})">
          <h3>${b.name} <small>${b.tag}</small>
            <button type="button" class="say" data-act="saybooth" data-k="${b.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
          </h3>
          <div class="mv-check">${b.run}</div>
          <p class="mv-text">${b.rp}</p>
          <p class="hint">${b.payoff}</p>
          ${b.awards.length ? `<div class="awards">
            ${b.awards.map((a, i) => `<button type="button" class="award ${st[i] ? "on" : ""}" data-act="booth" data-k="${b.key}" data-i="${i}" ${ro ? "disabled" : ""}>${a.label}</button>`).join("")}
          </div>` : `<div class="noaward">No points — flavour, dread, and player paranoia.</div>`}
        </article>`;
    }).join("")}</div>
    <section class="panel">
      <h3>Complications <small>for the witching hours</small> ${this.jbtn(JPAGE.warmth)}</h3>
      <div class="comps">
        ${COMPLICATIONS.map((c, i) => `<div class="comp"><b>${c.name}</b>
          <button type="button" class="say" data-act="saycomp" data-i="${i}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
          <p>${c.text}</p></div>`).join("")}
      </div>
    </section>`;
  }

  gamesTab(ro) {
    const f = this.fest, s = f.s;
    const champ = f.champion;

    const board = `
      <section class="panel">
        <h3>Medal tracker <small>gold counts 2, silver counts 1</small>
          <button type="button" class="mini" data-act="poststandings"><i class="fa-solid fa-comment"></i> Post standings</button>
        </h3>
        <div class="medals">
          ${s.pcs.map((pc, i) => {
            const m = f.medalCount(i);
            const titles = f.titlesFor(i);
            const wearing = champ && !champ.tied && champ.leaders[0].i === i;
            const tag = pc.actorId ? "button" : "div";
            const open = pc.actorId ? ` type="button" data-act="sheet" data-id="${pc.actorId}" title="Open ${esc(pc.name)}'s character sheet"` : "";
            return `<${tag} class="medalrow ${wearing ? "crowned" : ""}"${open} style="--acc:var(${PC_ACCENTS[i % PC_ACCENTS.length]})">
              <img class="avatar" src="${pc.img}" alt="" onerror="this.src='icons/svg/mystery-man.svg'">
              <div class="mname">${esc(pc.name)}${wearing ? `<span class="crown">Lantern Crown</span>` : ""}
                ${titles.length ? `<small>${titles.join(" · ")}</small>` : ""}</div>
              <div class="mcount"><span class="gold">${m.gold}</span><span class="silver">${m.silver}</span><b>${m.points}</b></div>
            </${tag}>`;
          }).join("")}
        </div>
        ${champ?.tied ? `<p class="hint">Tied at ${champ.points}. Sudden-death round of the champions' choosing, or co-crown them and let the rivalry simmer into next year.</p>` : ""}
      </section>`;

    const disciplines = Object.entries(DISCIPLINES).map(([dk, d]) => `
      <section class="panel disc" style="--tone:var(--${d.tone})">
        <h3>${d.label} <small>${d.sub}</small></h3>
        ${GAMES.filter(g => g.disc === dk).map(g => {
          const st = s.games[g.key] ?? {};
          const medalRow = (medal) => `
            <div class="mrow">
              <span class="mlabel ${medal}">${cap(medal)}</span>
              ${s.pcs.map((pc, i) => `<button type="button" class="pcpick ${st[medal] === i ? "on" : ""}" data-act="medal" data-g="${g.key}" data-m="${medal}" data-i="${i}" ${ro ? "disabled" : ""} title="${esc(pc.name)}">
                <img src="${pc.img}" alt="" onerror="this.src='icons/svg/mystery-man.svg'"></button>`).join("")}
            </div>`;
          return `
            <article class="game">
              <div class="g-head"><b>${g.name}</b><span class="chip">${g.format}</span>
                <button type="button" class="say" data-act="saygame" data-k="${g.key}" title="Read to the table"><i class="fa-solid fa-comment"></i></button>
              </div>
              <p class="mv-text">${g.run}</p>
              <div class="prize"><b>Prize</b> ${g.crown} · <b>Title</b> ${g.title}${g.favor ? ` · <b>Favour</b> ${g.favor}` : ""}</div>
              ${medalRow("gold")}
              ${medalRow("silver")}
            </article>`;
        }).join("")}
      </section>`).join("");

    return `${board}
      <p class="hint pad">None of these touch the winter ledger. Medals, titles, keepsakes, and one-night favours only — a champion feels rewarded without tilting the survival maths.</p>
      ${disciplines}`;
  }

  kitTab() {
    return `
      <section class="panel">
        <h3>Six festival riddles <small>for the Riddle Gauntlet</small> ${this.jbtn(JPAGE.festival)}</h3>
        <ol class="riddles">
          ${KIT_RIDDLES.map(([q, a]) => `<li>${q}<span class="answer">${a}</span></li>`).join("")}
        </ol>
      </section>

      <section class="panel">
        <h3>The lantern cipher <small>motif key</small></h3>
        <div class="cipher">
          ${CIPHER_KEY.map(([m, meaning]) => `<div><b>${m}</b> ${meaning}</div>`).join("")}
        </div>
        <p class="hint">Never a crow or a raven — forbidden. Sample message to decode: willow · crane · dragon — "a death; we need aid; monsters are near."</p>
      </section>

      <section class="panel">
        <h3>Poetry duel <small>prompt scaffold</small></h3>
        <p class="mv-text">Line one is a moon-night image. Line two turns it to a feeling.</p>
        <p class="hint"><b>Images</b> a paper lantern rising · frost waiting at the door · a returning ghost · the last warm tea · a string let go<br>
        <b>Feelings</b> longing · quiet defiance · grief · stubborn hope · gratitude</p>
        <p class="quote">The lantern climbs past the cold white moon —<br>carry my wish where winter can't follow soon.</p>
      </section>

      <section class="panel">
        <h3>Moon-stones <small>how to play</small></h3>
        <p class="mv-text"><b>You need</b> a fistful of small stones or dried beans, an opaque bowl, and a pile of moon-tokens split evenly as each player's stake.</p>
        <ol class="steps">
          <li>The banker scoops a hidden handful of stones under the bowl.</li>
          <li>Each player bets a token on 1, 2, 3, or 4 — their guess for the remainder when the pile is counted out in fours.</li>
          <li>Reveal and count the stones into fours. The leftover is the result, and 4 if it divides evenly.</li>
          <li>Right guesses take a token from the pot; wrong guesses forfeit their bet to it.</li>
          <li>Five rounds. Most tokens wins.</li>
        </ol>
        <p class="hint">It is a quiet act of defiance to gamble the night away under jorogumo rule. Let the table trash-talk in character.</p>
      </section>`;
  }

  ledgerBar(ro) {
    const l = this.fest.s.ledger;
    const cell = (label, val, color) => `<div class="lcell"><span>${label}</span><b style="color:var(${color})">${val > 0 ? "+" : ""}${val}</b></div>`;
    return `
      <footer class="ledger">
        <div class="lcells">
          ${cell("Hope", l.hope, "--ember")}${cell("Food", l.food, "--moss")}${cell("Security", l.security, "--slate")}${cell("Reputation", l.rep, "--gold")}
        </div>
        <button type="button" class="primary" data-act="push" ${ro ? "disabled" : ""}><i class="fa-solid fa-right-to-bracket"></i> Send to the downtime tracker</button>
        <button type="button" class="ghost" data-act="resetnight" ${ro ? "disabled" : ""} title="Clear the whole night"><i class="fa-solid fa-rotate-left"></i></button>
      </footer>`;
  }

  /* ---------------------------------------------------------- listeners */
  wire(root) {
    if (!root || root.dataset?.flnWired === "1") return;
    if (root.dataset) root.dataset.flnWired = "1";
    const f = this.fest;

    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const a = btn.dataset.act;
      if (a === "tab") { f.s.tab = btn.dataset.k; f.touch(); }
      else if (a === "journal") openJournal(btn.dataset.r);
      else if (a === "sheet") {
        const actor = game.actors.get(btn.dataset.id);
        if (actor) actor.sheet?.render(true);
        else ui.notifications.warn("That character's actor is no longer in this world.");
      }
      else if (a === "phase") { f.s.phase = Number(btn.dataset.i); f.touch(); }
      else if (a === "postphase") f.postPhase();
      else if (a === "mv") f.setMovement(btn.dataset.id, btn.dataset.d);
      else if (a === "paycurtain") f.payCurtain();
      else if (a === "contest") f.setContest(btn.dataset.k, Number(btn.dataset.i), btn.dataset.d);
      else if (a === "applycontest") f.applyContest(btn.dataset.k);
      else if (a === "booth") f.toggleBooth(btn.dataset.k, Number(btn.dataset.i));
      else if (a === "medal") f.medal(btn.dataset.g, btn.dataset.m, Number(btn.dataset.i));
      else if (a === "poststandings") f.postStandings();
      else if (a === "push") f.pushToDowntime();
      else if (a === "undocurtain") f.payCurtain(true);
      else if (a === "clearshow") f.clearShow();
      else if (a === "clearcontest") f.clearContest(btn.dataset.k);
      else if (a === "saymv") f.postMovement(btn.dataset.id);
      else if (a === "saycontest") f.postContest(btn.dataset.k);
      else if (a === "saybooth") f.postBooth(btn.dataset.k);
      else if (a === "saygame") f.postGame(btn.dataset.k);
      else if (a === "saycomp") f.postComplication(Number(btn.dataset.i));
      else if (a === "resetnight") f.resetNight();
    });

    root.addEventListener("change", (ev) => {
      const el = ev.target.closest("[data-act]");
      if (!el || el.tagName === "BUTTON") return;
      if (el.dataset.act === "line") { f.s.show.line = el.value; f.touch(); }
      else if (el.dataset.act === "rehearse") { f.s.show.rehearsed = el.value; f.touch(); }
    });
  }

  /* -------------------------------------------------------------- styles */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.parchment;
    return `<style>
      #fln-console .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #fln-console .window-content > * { background:transparent; }
      .fln { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --rust:${p.rust};
             --ember:${p.ember}; --moss:${p.moss}; --slate:${p.slate}; --plum:${p.plum};
             --muted:${p.muted}; --track:${p.track}; --stripe:${p.stripe}; --hover:${p.hover};
             --field:${p.field}; --gold:${p.gold};
             font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .fln * { box-sizing:border-box; }
      .fln button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
      .fln button:hover:not(:disabled) { background:var(--hover); }
      .fln button:disabled { opacity:.45; cursor:not-allowed; }
      .fln .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; }
      .fln .primary { background:var(--tone, var(--ember)); border-color:var(--tone, var(--ember));
                      color:var(--paper); font-weight:600; padding:.35rem .8rem; font-size:.78rem; }
      .fln .primary:hover:not(:disabled) { filter:brightness(1.1); background:var(--tone, var(--ember)); }
      .fln .ghost { padding:.35rem .7rem; font-size:.78rem; color:var(--muted); }
      .fln .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted);
                  flex:none; }
      .fln .say:hover { color:var(--ink); }
      .fln select { background:var(--field); color:var(--ink); border:1px solid var(--line);
                    border-radius:3px; height:auto; padding:2px 4px; width:100%; }
      .fln option { background:var(--field); color:var(--ink); }
      /* Two levels of heading that must not compete: a panel is titled in
         large ink over a thick rule in its own tone, a block inside it wears
         a small filled bar. Outer reads first, inner sorts what's under it. */
      .fln h3 { font-size:.95rem; margin:0 0 .55rem; letter-spacing:.04em; text-transform:uppercase;
                display:flex; align-items:center; gap:.5rem; border-bottom:2px solid var(--tone, var(--line));
                padding-bottom:.3rem; color:var(--ink); flex-wrap:wrap; }
      .fln h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .fln .mini { margin-left:auto; font-size:.68rem; padding:.15rem .45rem; border:1px solid var(--line);
                   background:transparent; border-radius:3px; text-transform:none; letter-spacing:0; }
      .fln h1, .fln h2, .fln h4, .fln legend { color:var(--ink); }
      .fln .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem;
                    background:var(--card); }
      .fln .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .fln .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .fln .panel[style*="--tone"] h3 small { color:var(--tone); }
      .fln .booth .mv-check, .fln .contest .mv-check { color:var(--tone, var(--plum)); }
      .fln .hint { font-size:.75rem; color:var(--muted); line-height:1.4; margin:.3rem 0; }
      .fln .hint.pad { padding:0 .2rem .5rem; }
      .fln .mv-text { font-size:.8rem; line-height:1.45; margin:.25rem 0 .4rem; }
      .fln .mv-check { font-size:.76rem; color:var(--plum); font-weight:600; line-height:1.4; margin-bottom:.2rem; }
      .fln .chip { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; padding:1px 6px;
                   border-radius:10px; border:1px solid var(--line); color:var(--muted); white-space:nowrap; }

      .fln .phasebar { border:1px solid var(--line); border-radius:4px; background:var(--card);
                       padding:.5rem; margin-bottom:.5rem; }
      .fln .phases { display:flex; gap:3px; margin-bottom:.45rem; }
      .fln .ph { flex:1; font-size:.68rem; padding:.3rem .2rem; border:1px solid var(--line);
                 background:transparent; border-radius:3px; line-height:1.1; }
      .fln .ph.past { background:var(--stripe); color:var(--muted); }
      .fln .ph.on { background:var(--plum); border-color:var(--plum); color:var(--paper); font-weight:600; }
      .fln .phasenow { display:flex; align-items:flex-start; gap:.5rem; flex-wrap:wrap; }
      .fln .pn-mood { font-style:italic; font-size:.8rem; width:100%; }
      .fln .pn-beat { font-size:.78rem; color:var(--muted); line-height:1.45; flex:1; min-width:220px; }

      .fln .tabs { display:flex; gap:3px; margin-bottom:.6rem; }
      .fln .tab { flex:1; padding:.35rem; font-size:.78rem; border:1px solid var(--line);
                  background:transparent; border-radius:3px 3px 2px 2px;
                  border-top:3px solid var(--tt, var(--line)); display:inline-flex;
                  align-items:center; justify-content:center; gap:.35rem; }
      .fln .tab i { font-size:.68rem; color:var(--tt, var(--muted)); }
      .fln .tab.on { background:var(--tt); border-color:var(--tt); color:var(--paper); font-weight:600; }
      .fln .tab.on i { color:var(--paper); opacity:.85; }

      /* A link into the module's journal. */
      .fln .jbtn { font-size:.62rem; padding:1px 5px; border-radius:3px; color:var(--slate);
                   border:1px solid var(--line); background:transparent; flex:none; letter-spacing:.04em;
                   display:inline-flex; align-items:center; gap:.25rem; cursor:pointer; height:auto; }
      .fln .jbtn:hover { background:var(--hover); }
      .fln .jbtn i { font-size:.66rem; }

      .fln .stage { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
      .fln .fld { display:block; font-size:.68rem; text-transform:uppercase; letter-spacing:.07em; color:var(--muted); }
      .fln .fld small { display:block; text-transform:none; letter-spacing:0; font-size:.66rem; }

      .fln .movements { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-bottom:.6rem; }
      .fln .mv { border:1px solid var(--line); border-radius:4px; padding:.55rem; background:var(--card); }
      .fln .mv.done { border-color:var(--moss); }
      .fln .mv.key { border-left:3px solid var(--plum); }
      .fln .mv-head { display:flex; align-items:center; gap:.45rem; margin-bottom:.3rem; }
      .fln .numeral { font-size:1.1rem; font-weight:700; color:var(--muted); min-width:22px; }
      .fln .mv-name { flex:1; line-height:1.15; }
      .fln .mv-name small { display:block; font-size:.68rem; color:var(--muted); }
      .fln .degs { display:grid; grid-template-columns:repeat(4,1fr); gap:.2rem; }
      .fln .deg { font-size:.65rem; padding:.3rem .1rem; border:1px solid var(--line); background:transparent;
                  border-radius:3px; line-height:1.1; }
      .fln .deg.sm { width:30px; padding:.25rem 0; }
      .fln .deg.cs.on, .fln .deg.cs:hover { background:var(--moss); border-color:var(--moss); color:var(--paper); }
      .fln .deg.s.on, .fln .deg.s:hover { background:rgba(93,107,69,.3); border-color:var(--moss); }
      .fln .deg.f.on, .fln .deg.f:hover { background:var(--hover); }
      .fln .deg.cf.on, .fln .deg.cf:hover { background:var(--rust); border-color:var(--rust); color:var(--paper); }
      .fln .deg:disabled { opacity:.45; cursor:not-allowed; }
      .fln .botch { font-size:.74rem; color:var(--rust); margin:.35rem 0 0; line-height:1.4; }

      .fln .curtain.triumph { border-color:var(--gold); }
      .fln .bands { display:flex; gap:.3rem; margin-bottom:.4rem; flex-wrap:wrap; }
      .fln .band { font-size:.7rem; padding:.2rem .5rem; border:1px solid var(--line); border-radius:3px; color:var(--muted); }
      .fln .band.on { background:var(--gold); border-color:var(--gold); color:var(--paper); }
      .fln .reward { font-size:.8rem; font-weight:600; margin:.2rem 0 .45rem; }
      .fln .checks { margin:0; padding-left:1.1rem; font-size:.78rem; line-height:1.45; color:var(--muted); }
      .fln .checks li { margin-bottom:.25rem; }

      .fln .contest .vp { margin-left:auto; font-size:.72rem; text-transform:none; letter-spacing:0; color:var(--muted); }
      .fln .contest.won { border-color:var(--moss); }
      .fln .rounds { display:flex; gap:.6rem; flex-wrap:wrap; margin:.4rem 0; }
      .fln .round { display:flex; align-items:center; gap:.15rem; }
      .fln .rlabel { font-size:.65rem; color:var(--muted); margin-right:.2rem; }

      .fln .booths { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
      .fln .awards { display:flex; gap:.3rem; flex-wrap:wrap; }
      .fln .award { font-size:.72rem; padding:.25rem .5rem; border:1px solid var(--line);
                    background:transparent; border-radius:3px; }
      .fln .award.on { background:var(--moss); border-color:var(--moss); color:var(--paper); }
      .fln .noaward { font-size:.72rem; color:var(--muted); font-style:italic; }
      .fln .comps { display:grid; grid-template-columns:1fr 1fr; gap:.4rem; }
      .fln .comp { border-left:2px solid var(--plum); padding-left:.5rem; font-size:.76rem;
                   display:grid; grid-template-columns:1fr auto; align-items:start; }
      .fln .comp p { grid-column:1 / -1; }
      .fln .comp p { margin:.1rem 0 0; color:var(--muted); line-height:1.4; }

      .fln .medals { display:grid; gap:.3rem; }
      .fln .medalrow { display:flex; align-items:center; gap:.5rem; padding:.3rem .4rem; width:100%;
                       border-left:3px solid var(--acc); background:var(--stripe); border-radius:3px;
                       text-align:left; font-family:inherit; color:var(--ink); border-top:0; border-right:0; border-bottom:0; }
      /* justify-content only reads as harmless because .mname takes the slack;
         pin it anyway so the row can't re-centre if that ever changes. */
      .fln button.medalrow { cursor:pointer; justify-content:flex-start; }
      .fln button.medalrow:hover { background:var(--hover); }
      .fln .medalrow.crowned { background:rgba(138,106,18,.15); }
      .fln .avatar { width:30px; height:30px; border-radius:50%; object-fit:cover; border:1px solid var(--line); flex:none; }
      .fln .mname { flex:1; font-weight:600; font-size:.85rem; line-height:1.2; }
      .fln .mname small { display:block; font-weight:400; font-size:.68rem; color:var(--muted); font-style:italic; }
      .fln .crown { font-size:.6rem; text-transform:uppercase; letter-spacing:.08em; color:var(--gold);
                    border:1px solid var(--gold); border-radius:10px; padding:0 6px; margin-left:6px; }
      .fln .mcount { display:flex; align-items:center; gap:.5rem; font-size:.8rem; }
      .fln .mcount .gold::before { content:"●"; color:var(--gold); margin-right:3px; }
      .fln .mcount .silver::before { content:"●"; color:var(--muted); margin-right:3px; }

      .fln .disc .game { border-top:1px solid var(--line); padding:.45rem 0; }
      .fln .disc .game:first-of-type { border-top:none; }
      .fln .g-head { display:flex; align-items:center; gap:.5rem; font-size:.85rem; }
      .fln .disc .game { border-left:0; }
      .fln .prize { font-size:.72rem; color:var(--muted); margin-bottom:.3rem; }
      .fln .mrow { display:flex; align-items:center; gap:.25rem; margin-bottom:.2rem; }
      .fln .mlabel { font-size:.62rem; text-transform:uppercase; letter-spacing:.08em; width:42px; color:var(--muted); }
      .fln .mlabel.gold { color:var(--gold); }
      .fln .pcpick { width:28px; height:28px; padding:0; border:1px solid var(--line); border-radius:50%;
                     background:transparent; overflow:hidden; opacity:.45; }
      .fln .pcpick img { width:100%; height:100%; object-fit:cover; display:block; }
      .fln .pcpick.on { opacity:1; border-color:var(--gold); border-width:2px; }

      .fln .riddles { margin:0; padding-left:1.2rem; font-size:.8rem; line-height:1.5; }
      .fln .riddles li { margin-bottom:.35rem; }
      .fln .answer { display:block; font-size:.72rem; color:var(--moss); font-style:italic; }
      .fln .cipher { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.25rem; font-size:.78rem; }
      .fln .quote { font-style:italic; font-size:.82rem; line-height:1.5; border-left:2px solid var(--ember);
                    padding-left:.6rem; margin:.4rem 0 0; }
      .fln .steps { margin:0; padding-left:1.2rem; font-size:.78rem; line-height:1.5; }

      .fln .ledger .primary { --tone:var(--moss); }
      .fln .ledger { display:flex; align-items:center; gap:.6rem; border:1px solid var(--line);
                     border-radius:4px; padding:.45rem .6rem; background:var(--card); }
      .fln .lcells { display:flex; gap:1rem; flex:1; }
      .fln .lcell { display:flex; flex-direction:column; }
      .fln .lcell span { font-size:.62rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .fln .lcell b { font-size:1.05rem; }

      @media (max-width:760px) {
        .fln .movements, .fln .booths, .fln .comps, .fln .stage { grid-template-columns:1fr; }
        .fln .cipher { grid-template-columns:1fr 1fr; }
        .fln .phases, .fln .tabs { flex-wrap:wrap; }
      }
    </style>`;
  }
}

if (AppV2) {
  FLNApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSettings();
  let state = game.settings.get(FLN_NS, FLN_KEY);
  if (!state) {
    state = blankState(detectPCs());
    if (game.user.isGM) await game.settings.set(FLN_NS, FLN_KEY, state);
  } else {
    state = foundry.utils.mergeObject(blankState(detectPCs()), state, { inplace: false });
    state.pcs = refreshPCs(state.pcs);
  }

  const fest = new Festival(state);
  const app = new FLNApp(fest);

  if (!globalThis.__flnHook) {
    globalThis.__flnHook = Hooks.on("updateSetting", (setting, changes, opts, userId) => {
      if (setting.key !== FLN_ID || userId === game.user.id) return;
      const fresh = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      if (fresh) { fest.state = fresh; fest.render(); }
    });
  }

  app.render(true);
})();
