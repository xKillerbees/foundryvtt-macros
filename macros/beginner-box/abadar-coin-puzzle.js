/* ============================================================================
   ABADAR'S COIN PUZZLE — a playable board
   Pathfinder Beginner Box · Menace Under Otari, Area 9
   Foundry VTT v11 / v12 / v13 / v14  •  system-agnostic
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   Nine coins, one of them a fake worth less than the rest, and a statue of
   Abadar that raises whichever hand holds the greater value. Two judgements to
   find the fake.

   This is meant to be handed to the players. Give the macro OBSERVER
   permission and anyone at the table can run it — it keeps its board in a
   client-scoped setting, so it needs no GM and writes nothing to the world.
   Everyone who opens it gets their own board to think on; the "Tell the table"
   buttons post the statue's answers to chat so the group works from the same
   information.

   The fake is picked at random and never revealed until the puzzle ends, so
   the GM can play it blind alongside everyone else.

   Expanded past the book: any number of coins from 3 to 27, the matching
   number of judgements, and an optional hard mode where the fake might be
   worth more instead of less — the classic twelve-coin problem.
   ============================================================================ */

const CP_NS = "world";
const CP_KEY = "abadarCoinPuzzle";
const CP_ID = `${CP_NS}.${CP_KEY}`;

const THEME = "gilt";
const PALETTES = {
  /* Abadar's vault: dark stone, gold leaf. */
  gilt: {
    paper: "#12100d", card: "#1c1915", ink: "#ece3d0", line: "#3d3527", muted: "#a3947a",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(226,193,105,.10)", field: "#0d0b08",
    gold: "#e2c169", moss: "#6fbb86", rust: "#cf5a3d", slate: "#6f9fc0", plum: "#a582cc", ember: "#e0a349"
  },
  daylight: {
    paper: "#f4f0e6", card: "#ffffff", ink: "#1c1915", line: "#cdbfa4", muted: "#6b6050",
    stripe: "rgba(0,0,0,.04)", hover: "rgba(0,0,0,.06)", field: "#faf7f0",
    gold: "#8a6a12", moss: "#1e7a49", rust: "#a63c22", slate: "#1f6289", plum: "#66429e", ember: "#8c5c12"
  }
};

/* The statue's own words, and the room's read-aloud. */
const TEXT = {
  boxed: "The door to this chamber silently glides open to reveal a long room. Two stone statues of priests stand in the corners along one side of the room, facing a towering statue of a man holding out both of his hands, palms up. In front of this statue is a stone altar holding nine golden coins. A voice booms out from the statue.",
  riddle: "In my hands I judge the value of all wealth, raising up whichever is greater. One of these coins is a deception. Find it using only two judgments and receive my blessing.",
  rules: [
    "Put coins in either hand and the statue raises the hand holding the greater value.",
    "Every coin looks identical and weighs exactly the same. The fake is simply worth less.",
    "After the judgements are spent, name the coin you believe is false.",
    "Name it wrongly and the coins vanish, reappear in a new order, and the puzzle begins again."
  ],
  win: "The real coins fall to the floor — each is worth 1 gp — and the false one turns to lead. The stone door to Abadar's vault grinds open.",
  lose: "The coins vanish and reappear on the altar in a new order. Nothing is lost but time; the heroes can try as often as they like.",
  gmNote: "Failing this puzzle doesn't block the adventure. It only means no vault, and no chance to turn the spear trap in Area 11 against the kobolds.",
  solution: [
    "Split the nine coins into three groups of three.",
    "Judgement one: put one group in each hand and leave the third on the altar. If a hand rises, the fake is in the other hand. If neither rises, the fake is in the group left on the altar.",
    "Judgement two: take the group holding the fake and repeat — one coin in each hand, one left on the altar. If a hand rises, the fake is the coin in the other hand. If neither rises, it is the coin on the altar.",
    "The reason it works is that each judgement has three possible answers, so two of them tell three-by-three apart: nine coins exactly."
  ],
  wisdom: "Every judgement has three answers — left, right, or neither — so N judgements can tell 3^N coins apart. Two judgements is exactly nine."
};

/* ------------------------------------------------------------------ setup */
const LIMITS = { min: 3, max: 27 };
const idealWeighings = (n) => Math.max(1, Math.ceil(Math.log(n) / Math.log(3) - 1e-9));

const PLACES = ["altar", "left", "right"];
const NEXT_PLACE = { altar: "left", left: "right", right: "altar" };

/* ------------------------------------------------------------------ logic
   A real coin is worth 1 and the fake is worth 1 ± e for some 0 < e < 1, so a
   hand with more coins in it always outweighs a hand with fewer no matter
   where the fake sits. That is what makes an uneven judgement worthless, and
   the board says so rather than letting a player waste one by accident. */
function verdictFor(left, right, fakeId, heavy) {
  if (left.length !== right.length) return left.length > right.length ? "left" : "right";
  const bias = heavy ? 1 : -1;
  const l = left.includes(fakeId) ? bias : 0;
  const r = right.includes(fakeId) ? bias : 0;
  if (l === r) return "neither";
  return l > r ? "left" : "right";
}

/* Which coins are still possible, given everything judged so far. In hard mode
   a candidate is a coin *and* a direction, because a heavy fake and a light
   fake explain opposite outcomes. */
function candidates(state) {
  const out = [];
  const dirs = state.hard ? [true, false] : [false];
  for (let id = 1; id <= state.coins; id++) {
    for (const heavy of dirs) {
      const fits = state.weighings.every(w => verdictFor(w.left, w.right, id, heavy) === w.verdict);
      if (fits) out.push({ id, heavy });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ state */
function blankState(prev = {}) {
  const coins = prev.coins ?? 9;
  const hard = prev.hard ?? false;
  const allowed = prev.allowed ?? idealWeighings(coins);
  return {
    v: 1, coins, hard, allowed,
    /* The fake, and in hard mode whether it is heavy. Never rendered until the
       round is over. */
    fake: 1 + Math.floor(Math.random() * coins),
    fakeHeavy: hard ? Math.random() < 0.5 : false,
    place: {},            // coin id -> "altar" | "left" | "right"
    weighings: [],        // { left:[], right:[], verdict }
    accused: null,
    phase: "weigh",       // "weigh" | "accuse" | "done"
    won: null,
    round: (prev.round ?? 0) + 1,
    showHints: prev.showHints ?? true,
    revealed: false
  };
}

function registerSetting() {
  if (!game.settings.settings.has(CP_ID)) {
    /* Client scope on purpose: a player running this macro has to be able to
       write its board, and nothing here belongs to the world. */
    game.settings.register(CP_NS, CP_KEY, { scope: "client", config: false, type: Object, default: null });
  }
}
const esc = (s) => foundry.utils.escapeHTML ? foundry.utils.escapeHTML(String(s))
  : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ----------------------------------------------------------------- engine */
class CoinPuzzle {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  render() { this.app?.render(); }
  async save() { await game.settings.set(CP_NS, CP_KEY, this.s); }
  touch() { this.render(); this.save(); }

  handOf(place) {
    return Array.from({ length: this.s.coins }, (_, i) => i + 1)
      .filter(id => (this.s.place[id] ?? "altar") === place);
  }
  get left() { return this.handOf("left"); }
  get right() { return this.handOf("right"); }
  get altar() { return this.handOf("altar"); }
  get used() { return this.s.weighings.length; }
  get remaining() { return Math.max(0, this.s.allowed - this.used); }
  get candidates() { return candidates(this.s); }

  cycle(id) {
    if (this.s.phase !== "weigh") return;
    this.s.place[id] = NEXT_PLACE[this.s.place[id] ?? "altar"];
    this.touch();
  }
  clearHands() {
    this.s.place = {};
    this.touch();
  }

  judge() {
    if (this.s.phase !== "weigh") return;
    const left = this.left, right = this.right;
    if (!left.length && !right.length) return ui.notifications.warn("Put some coins in the statue's hands first.");
    if (this.remaining <= 0) return;
    const verdict = verdictFor(left, right, this.s.fake, this.s.fakeHeavy);
    this.s.weighings.push({ left, right, verdict });
    this.s.place = {};
    if (this.remaining <= 0) this.s.phase = "accuse";
    this.touch();
    this.postVerdict(this.s.weighings.length - 1);
  }

  undoJudgement() {
    if (!this.s.weighings.length) return;
    const w = this.s.weighings.pop();
    this.s.phase = "weigh";
    this.s.accused = null; this.s.won = null; this.s.revealed = false;
    this.s.place = {};
    for (const id of w.left) this.s.place[id] = "left";
    for (const id of w.right) this.s.place[id] = "right";
    this.touch();
  }

  accuse(id) {
    if (this.s.phase === "done") return;
    this.s.accused = id;
    this.s.won = id === this.s.fake;
    this.s.phase = "done";
    this.s.revealed = true;
    this.touch();
    this.postResult();
  }

  /* A wrong answer resets the puzzle with a new fake, exactly as the statue
     does. Settings — coin count, judgements, hard mode — carry over. */
  newRound() {
    this.state = blankState(this.s);
    this.touch();
  }
  reveal() { this.s.revealed = true; this.touch(); }
  toggleHints() { this.s.showHints = !this.s.showHints; this.touch(); }

  setCoins(n) {
    const coins = Math.max(LIMITS.min, Math.min(LIMITS.max, n));
    this.state = blankState({ ...this.s, coins, allowed: idealWeighings(coins), round: this.s.round - 1 });
    this.touch();
  }
  setAllowed(n) {
    const allowed = Math.max(1, Math.min(6, n));
    this.state = blankState({ ...this.s, allowed, round: this.s.round - 1 });
    this.touch();
  }
  toggleHard() {
    this.state = blankState({ ...this.s, hard: !this.s.hard, round: this.s.round - 1 });
    this.touch();
  }

  /* ------------------------------------------------------------- chat --- */
  async postCard(eyebrow, title, bodyHtml, tone = "gold") {
    const C = { gold: "#e2c169", moss: "#6fbb86", rust: "#cf5a3d", slate: "#6f9fc0", muted: "#a3947a" };
    await ChatMessage.create({
      content: `<div style="background:#1c1915;color:#ece3d0;border:1px solid #3d3527;border-radius:4px;
                            padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
        <div style="border-left:3px solid ${C[tone] ?? C.gold};padding-left:8px;margin-bottom:6px">
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#a3947a">${eyebrow}</div>
          <div style="font-size:15px;font-weight:600">${title}</div>
        </div>
        <div style="font-size:12px">${bodyHtml}</div></div>`,
      speaker: { alias: "The Statue of Abadar" }
    });
  }
  coinList(ids) { return ids.length ? ids.map(i => `#${i}`).join(", ") : "nothing"; }

  postRiddle() {
    return this.postCard("Area 9 · Gold Puzzle", "Abadar speaks",
      `<p style="margin:0 0 6px;font-style:italic">${TEXT.boxed}</p>
       <p style="margin:0;font-style:italic">“${TEXT.riddle}”</p>`, "gold");
  }
  postVerdict(i) {
    const w = this.s.weighings[i];
    if (!w) return;
    const said = w.verdict === "neither"
      ? "Neither hand rises. The two are of equal value."
      : `The <b>${w.verdict}</b> hand rises.`;
    const uneven = w.left.length !== w.right.length
      ? `<p style="margin:6px 0 0;color:#cf5a3d">The hands held different numbers of coins, so this judgement proves nothing.</p>` : "";
    return this.postCard(`Judgement ${i + 1} of ${this.s.allowed}`, "The statue weighs",
      `<p style="margin:0 0 4px"><b>Left hand</b> ${this.coinList(w.left)}</p>
       <p style="margin:0 0 6px"><b>Right hand</b> ${this.coinList(w.right)}</p>
       <p style="margin:0">${said}</p>${uneven}`,
      w.verdict === "neither" ? "slate" : "gold");
  }
  postResult() {
    const won = this.s.won;
    return this.postCard("The judgement is made", won ? "Abadar's blessing" : "The coins vanish",
      `<p style="margin:0 0 6px">Named coin <b>#${this.s.accused}</b>. The false coin was <b>#${this.s.fake}</b>${this.s.hard ? ` — and it was worth <b>${this.s.fakeHeavy ? "more" : "less"}</b>` : ""}.</p>
       <p style="margin:0">${won ? TEXT.win : TEXT.lose}</p>`,
      won ? "moss" : "rust");
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class CPApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "cp-puzzle", tag: "div", classes: ["cp-puzzle"],
    position: { width: 720, height: "auto" },
    window: { title: "Abadar's Coin Puzzle", icon: "fa-solid fa-coins", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "cp-puzzle", classes: ["cp-puzzle"], title: "Abadar's Coin Puzzle",
      width: 720, height: "auto", resizable: true
    });
  }
  get title() { return "Abadar's Coin Puzzle"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="cp-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  markup() {
    const t = this.t;
    return `${this.styles()}
      <div class="cp">
        ${this.header()}
        ${this.riddlePanel()}
        ${t.s.phase === "done" ? this.resultPanel() : this.boardPanel()}
        ${this.historyPanel()}
        ${t.s.showHints ? this.hintPanel() : ""}
        ${this.setupPanel()}
      </div>`;
  }

  header() {
    const t = this.t, s = t.s;
    return `
      <header class="topbar">
        <div class="score">
          <span>Judgements</span><b class="${t.remaining ? "" : "spent"}">${t.used}<i>/${s.allowed}</i></b>
        </div>
        <div class="score">
          <span>Coins</span><b>${s.coins}</b>
        </div>
        <div class="badges">
          <span class="pill ${s.hard ? "on" : ""}" title="${s.hard ? "The fake might be worth more or less — you don't know which" : "The fake is worth less than a real coin"}">
            <i class="fa-solid ${s.hard ? "fa-scale-unbalanced" : "fa-scale-balanced"}"></i>${s.hard ? "Unknown direction" : "Worth less"}</span>
          <span class="pill" title="How many rounds this board has played">Round ${s.round}</span>
        </div>
        <button type="button" class="say" data-act="postriddle" title="Read the statue's riddle to the table"><i class="fa-solid fa-comment"></i></button>
        <button type="button" class="say" data-act="newround" title="Start over with a new false coin"><i class="fa-solid fa-rotate-left"></i></button>
      </header>`;
  }

  riddlePanel() {
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>The statue speaks</h3>
        <p class="quote">“${TEXT.riddle}”</p>
        <ul class="rules">${TEXT.rules.map(r => `<li>${r}</li>`).join("")}</ul>
      </section>`;
  }

  coin(id, mode) {
    const t = this.t, s = t.s;
    const place = s.place[id] ?? "altar";
    const isFake = s.revealed && id === s.fake;
    const accused = s.accused === id;
    const cand = t.s.showHints && s.phase !== "done"
      ? t.candidates.some(c => c.id === id) : null;
    const cls = [
      "coin", mode === "accuse" ? "accusable" : `at-${place}`,
      isFake ? "fake" : "", accused ? "accused" : "",
      cand === false ? "ruled-out" : ""
    ].filter(Boolean).join(" ");
    const title = mode === "accuse"
      ? `Name coin #${id} as the false one`
      : cand === false ? `Coin #${id} — ruled out by the judgements so far`
      : `Coin #${id} — click to move it between the altar and the statue's hands`;
    return `<button type="button" class="${cls}" data-act="${mode === "accuse" ? "accuse" : "cycle"}" data-k="${id}" title="${esc(title)}">
      <span class="num">${id}</span>
      ${isFake ? `<i class="fa-solid fa-skull mark"></i>` : place !== "altar" && mode !== "accuse" ? `<i class="fa-solid fa-hand ${place}"></i>` : ""}
    </button>`;
  }

  boardPanel() {
    const t = this.t, s = t.s;
    if (s.phase === "accuse") {
      return `
        <section class="panel" style="--tone:var(--rust)">
          <h3>Name the false coin <small>the judgements are spent</small></h3>
          <p class="text">The statue's hands lower and it waits. Choose one coin.</p>
          <div class="tray accuse">${Array.from({ length: s.coins }, (_, i) => this.coin(i + 1, "accuse")).join("")}</div>
          <div class="btnrow"><button type="button" class="ghost" data-act="undo"><i class="fa-solid fa-rotate-left"></i> Take back the last judgement</button></div>
        </section>`;
    }
    const left = t.left, right = t.right, uneven = left.length !== right.length && (left.length || right.length);
    return `
      <section class="panel" style="--tone:var(--gold)">
        <h3>The altar <small>click a coin to move it — altar, left hand, right hand</small></h3>
        <div class="tray">${Array.from({ length: s.coins }, (_, i) => this.coin(i + 1, "board")).join("")}</div>

        <div class="hands">
          <div class="hand">
            <div class="subhead">Left hand</div>
            <div class="held">${left.length ? left.map(i => `<span class="chip">${i}</span>`).join("") : `<span class="empty">empty</span>`}</div>
          </div>
          <div class="scales"><i class="fa-solid fa-scale-balanced"></i></div>
          <div class="hand">
            <div class="subhead">Right hand</div>
            <div class="held">${right.length ? right.map(i => `<span class="chip">${i}</span>`).join("") : `<span class="empty">empty</span>`}</div>
          </div>
        </div>

        ${uneven ? `<p class="danger"><i class="fa-solid fa-triangle-exclamation"></i>
          Uneven hands. The fuller hand always rises, whichever coin is false — this judgement would tell you nothing.</p>` : ""}

        <div class="btnrow">
          <button type="button" class="primary" data-act="judge" ${!left.length && !right.length ? "disabled" : ""}>
            <i class="fa-solid fa-scale-balanced"></i> Ask for judgement ${t.used + 1}</button>
          <button type="button" class="ghost" data-act="clear">Take the coins back</button>
          ${t.used ? `<button type="button" class="ghost" data-act="undo">Undo the last judgement</button>` : ""}
        </div>
      </section>`;
  }

  resultPanel() {
    const t = this.t, s = t.s;
    return `
      <section class="panel result ${s.won ? "won" : "lost"}" style="--tone:var(--${s.won ? "moss" : "rust"})">
        <h3>${s.won ? "Abadar's blessing" : "The coins vanish"}</h3>
        <p class="text">You named <b>#${s.accused}</b>. The false coin was <b>#${s.fake}</b>${s.hard ? `, and it was worth <b>${s.fakeHeavy ? "more" : "less"}</b> than the others` : ""}.</p>
        <p class="text">${s.won ? TEXT.win : TEXT.lose}</p>
        <div class="tray">${Array.from({ length: s.coins }, (_, i) => this.coin(i + 1, "done")).join("")}</div>
        <div class="btnrow">
          <button type="button" class="primary" data-act="newround"><i class="fa-solid fa-arrows-rotate"></i> ${s.won ? "Play it again" : "Try again"}</button>
          <button type="button" class="ghost" data-act="postresult">Tell the table</button>
        </div>
        ${s.won ? "" : `<p class="note">${TEXT.gmNote}</p>`}
      </section>`;
  }

  historyPanel() {
    const t = this.t;
    if (!t.s.weighings.length) return "";
    return `
      <section class="panel" style="--tone:var(--slate)">
        <h3>What the statue has said</h3>
        ${t.s.weighings.map((w, i) => {
          const said = w.verdict === "neither" ? "neither hand rose" : `the <b>${w.verdict}</b> hand rose`;
          const bad = w.left.length !== w.right.length;
          return `<div class="wrow ${bad ? "bad" : ""}">
            <span class="wnum">${i + 1}</span>
            <span class="wside">L ${w.left.map(x => `<span class="chip sm">${x}</span>`).join("") || "—"}</span>
            <span class="wside">R ${w.right.map(x => `<span class="chip sm">${x}</span>`).join("") || "—"}</span>
            <span class="wsaid">${said}${bad ? ` <em>uneven — proves nothing</em>` : ""}</span>
            <button type="button" class="say" data-act="postweigh" data-k="${i}" title="Post this judgement to chat"><i class="fa-solid fa-comment"></i></button>
          </div>`;
        }).join("")}
      </section>`;
  }

  /* The teaching panel. It never names the fake — it says how many coins are
     still possible, which is the deduction the puzzle is actually about. */
  hintPanel() {
    const t = this.t, s = t.s;
    if (s.phase === "done") return "";
    const cands = t.candidates;
    const ids = [...new Set(cands.map(c => c.id))].sort((a, b) => a - b);
    const enough = Math.pow(3, t.remaining) >= cands.length;
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3>Working it out <small>no spoilers — only what follows from the answers</small>
          <button type="button" class="say" data-act="hints" title="Hide this panel"><i class="fa-solid fa-eye-slash"></i></button>
        </h3>
        <p class="text"><b>${cands.length}</b> ${s.hard ? (cands.length === 1 ? "possibility" : "possibilities") : (cands.length === 1 ? "coin" : "coins")}
          still fit${cands.length === 1 ? "s" : ""} everything the statue has said${ids.length <= 12 ? `: ${ids.map(i => `#${i}`).join(", ")}` : ""}.</p>
        ${t.remaining
          ? `<p class="${enough ? "bonus" : "danger"}">${enough
              ? `${t.remaining} judgement${t.remaining === 1 ? "" : "s"} left, which can tell up to ${Math.pow(3, t.remaining)} apart. Still winnable.`
              : `${t.remaining} judgement${t.remaining === 1 ? "" : "s"} left can only tell ${Math.pow(3, t.remaining)} apart, and ${cands.length} are still possible. This round can no longer be solved by reasoning alone — a guess might still get lucky.`}</p>`
          : `<p class="text">No judgements left. Name one.</p>`}
        <details class="sol">
          <summary>Show how the nine-coin puzzle is solved</summary>
          <ol>${TEXT.solution.map(x => `<li>${x}</li>`).join("")}</ol>
          <p class="note">${TEXT.wisdom}</p>
        </details>
      </section>`;
  }

  setupPanel() {
    const t = this.t, s = t.s;
    const ideal = idealWeighings(s.coins);
    return `
      <section class="panel" style="--tone:var(--muted)">
        <h3>Setup <small>changing anything here starts a fresh round</small></h3>
        <div class="setrow">
          <span class="subhead">Coins</span>
          <div class="btnrow">
            ${[3, 9, 12, 27].map(n => `<button type="button" class="opt sm ${s.coins === n ? "on" : ""}" data-act="coins" data-k="${n}">${n}</button>`).join("")}
            <button type="button" class="qbtn" data-act="coins" data-k="${s.coins - 1}" ${s.coins <= LIMITS.min ? "disabled" : ""}>−</button>
            <button type="button" class="qbtn" data-act="coins" data-k="${s.coins + 1}" ${s.coins >= LIMITS.max ? "disabled" : ""}>+</button>
          </div>
        </div>
        <div class="setrow">
          <span class="subhead">Judgements</span>
          <div class="btnrow">
            <button type="button" class="qbtn" data-act="allowed" data-k="${s.allowed - 1}" ${s.allowed <= 1 ? "disabled" : ""}>−</button>
            <span class="pip">${s.allowed}</span>
            <button type="button" class="qbtn" data-act="allowed" data-k="${s.allowed + 1}">+</button>
            ${s.allowed !== ideal ? `<button type="button" class="opt sm" data-act="allowed" data-k="${ideal}">Back to ${ideal}</button>`
              : `<span class="hint">Exactly enough for ${s.coins} coins.</span>`}
          </div>
        </div>
        <div class="setrow">
          <span class="subhead">Difficulty</span>
          <div class="btnrow">
            <button type="button" class="opt sm ${!s.hard ? "on" : ""}" data-act="hard" data-k="0">Worth less <em>as printed</em></button>
            <button type="button" class="opt sm ${s.hard ? "on" : ""}" data-act="hard" data-k="1">Worth more or less <em>you don't know which</em></button>
          </div>
        </div>
        <div class="setrow">
          <span class="subhead">Help</span>
          <div class="btnrow">
            <button type="button" class="opt sm ${s.showHints ? "on" : ""}" data-act="hints">${s.showHints ? "Deduction panel on" : "Deduction panel off"}</button>
            ${!s.revealed && s.phase !== "done" ? `<button type="button" class="ghost sm" data-act="reveal" title="Give up and show the answer">Give up</button>` : ""}
          </div>
        </div>
        <p class="hint">Twelve coins with an unknown direction is the classic version of this puzzle, and it is genuinely hard — three judgements, and the direction has to be worked out alongside the coin.</p>
      </section>`;
  }

  wire(root) {
    if (!root || root.dataset?.cpWired === "1") return;
    if (root.dataset) root.dataset.cpWired = "1";
    const t = this.t;
    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const d = btn.dataset, a = d.act;
      if (a === "cycle") t.cycle(Number(d.k));
      else if (a === "accuse") t.accuse(Number(d.k));
      else if (a === "judge") t.judge();
      else if (a === "clear") t.clearHands();
      else if (a === "undo") t.undoJudgement();
      else if (a === "newround") t.newRound();
      else if (a === "reveal") t.reveal();
      else if (a === "hints") t.toggleHints();
      else if (a === "coins") t.setCoins(Number(d.k));
      else if (a === "allowed") t.setAllowed(Number(d.k));
      else if (a === "hard") { if (!!Number(d.k) !== t.s.hard) t.toggleHard(); }
      else if (a === "postriddle") t.postRiddle();
      else if (a === "postweigh") t.postVerdict(Number(d.k));
      else if (a === "postresult") t.postResult();
    });
  }

  styles() {
    const p = PALETTES[THEME] ?? PALETTES.gilt;
    return `<style>
      #cp-puzzle .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
             overflow-y:auto; max-height:calc(100vh - 140px); }
      #cp-puzzle .window-content > * { background:transparent; }
      .cp { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line}; --gold:${p.gold};
            --moss:${p.moss}; --rust:${p.rust}; --slate:${p.slate}; --plum:${p.plum}; --ember:${p.ember};
            --muted:${p.muted}; --stripe:${p.stripe}; --hover:${p.hover}; --field:${p.field};
            font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .cp * { box-sizing:border-box; }
      .cp button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
                   border:1px solid var(--line); border-radius:3px; line-height:1.25;
                   display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
                   height:auto; min-height:0; }
      .cp button:hover:not(:disabled) { background:var(--hover); }
      .cp button:disabled { opacity:.4; cursor:not-allowed; }
      .cp h3 { color:var(--ink); font-size:.95rem; margin:0 0 .55rem; letter-spacing:.05em; text-transform:uppercase;
               display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
               padding-bottom:.3rem; flex-wrap:wrap; }
      .cp h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .cp h1, .cp h2, .cp h4, .cp legend, .cp summary { color:var(--ink); }
      .cp .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem; background:var(--card); }
      .cp .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .cp .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .cp .text { font-size:.83rem; line-height:1.5; margin:.2rem 0 .45rem; }
      .cp .note { font-size:.78rem; line-height:1.45; color:var(--muted); margin:.3rem 0 0; }
      .cp .hint { font-size:.74rem; color:var(--muted); line-height:1.4; margin:.3rem 0 0; }
      .cp .quote { font-size:.88rem; line-height:1.55; margin:.2rem 0 .5rem; padding:.45rem .6rem;
                   border-left:2px solid var(--gold); background:var(--stripe); font-style:italic; }
      .cp .rules { margin:.2rem 0 0; padding-left:1.1rem; font-size:.78rem; line-height:1.5; color:var(--muted); }
      .cp .rules li { margin-bottom:.2rem; }
      .cp .danger { font-size:.79rem; line-height:1.45; color:var(--rust); margin:.4rem 0; font-weight:600;
                    display:flex; gap:.4rem; align-items:flex-start; }
      .cp .bonus { font-size:.79rem; line-height:1.45; color:var(--moss); margin:.4rem 0; font-weight:600; }
      .cp .subhead { font-size:.64rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .cp .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.4rem 0 .1rem; }
      .cp .primary { background:var(--gold); border-color:var(--gold); color:var(--paper);
                     font-weight:700; padding:.35rem .8rem; font-size:.8rem; }
      .cp .primary:hover:not(:disabled) { filter:brightness(1.12); background:var(--gold); }
      .cp .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .cp .ghost.sm, .cp .opt.sm { padding:.22rem .5rem; font-size:.7rem; }
      .cp .opt { padding:.28rem .6rem; font-size:.75rem; }
      .cp .opt.on { background:var(--gold); border-color:var(--gold); color:var(--paper); font-weight:600; }
      .cp .opt em { font-style:normal; opacity:.7; font-size:.9em; }
      .cp .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }
      .cp .pip { font-size:.75rem; border:1px solid var(--line); border-radius:8px; padding:1px 8px; color:var(--muted); }
      .cp .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .cp .say + .say { margin-left:.25rem; }

      .cp .topbar { display:flex; align-items:center; gap:.8rem; border:1px solid var(--line);
                    border-radius:4px; background:var(--card); padding:.45rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .cp .score { display:flex; flex-direction:column; }
      .cp .score span { font-size:.56rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
      .cp .score b { font-size:1.15rem; line-height:1; color:var(--gold); }
      .cp .score b i { font-size:.7rem; font-style:normal; color:var(--muted); }
      .cp .score b.spent { color:var(--rust); }
      .cp .badges { display:flex; gap:.35rem; flex-wrap:wrap; }
      .cp .pill { display:inline-flex; align-items:center; gap:.3rem; font-size:.67rem; text-transform:uppercase;
                  letter-spacing:.05em; color:var(--muted); border:1px solid var(--line); border-radius:10px; padding:2px 8px; }
      .cp .pill.on { color:var(--plum); border-color:var(--plum); font-weight:700; }

      .cp .tray { display:flex; gap:.4rem; flex-wrap:wrap; margin:.3rem 0 .6rem; }
      .cp .coin { width:46px; height:46px; border-radius:50%; border:2px solid var(--gold);
                  background:radial-gradient(circle at 35% 30%, rgba(255,255,255,.18), transparent 60%), var(--field);
                  color:var(--gold); font-weight:700; position:relative; flex-direction:column; gap:0; }
      .cp .coin .num { font-size:.95rem; line-height:1; }
      .cp .coin i { position:absolute; bottom:3px; font-size:.55rem; opacity:.9; }
      .cp .coin i.left { color:var(--slate); }
      .cp .coin i.right { color:var(--plum); }
      .cp .coin.at-left { border-color:var(--slate); color:var(--slate); box-shadow:0 0 0 2px rgba(111,159,192,.25); }
      .cp .coin.at-right { border-color:var(--plum); color:var(--plum); box-shadow:0 0 0 2px rgba(165,130,204,.25); }
      .cp .coin.ruled-out { opacity:.33; border-style:dashed; }
      .cp .coin.accusable { border-color:var(--rust); color:var(--rust); }
      .cp .coin.accusable:hover { background:var(--rust); color:var(--paper); }
      .cp .coin.accused { background:var(--rust); border-color:var(--rust); color:var(--paper); }
      .cp .coin.fake { border-color:var(--moss); color:var(--moss); box-shadow:0 0 10px rgba(111,187,134,.5); opacity:1; }
      .cp .coin.fake .mark { color:var(--moss); }

      .cp .hands { display:grid; grid-template-columns:1fr auto 1fr; gap:.6rem; align-items:center; margin:.2rem 0 .4rem; }
      .cp .hand { border:1px dashed var(--line); border-radius:4px; padding:.4rem .5rem; min-height:56px; background:var(--stripe); }
      .cp .held { display:flex; gap:.25rem; flex-wrap:wrap; margin-top:.25rem; min-height:22px; align-items:center; }
      .cp .empty { font-size:.73rem; color:var(--muted); font-style:italic; }
      .cp .scales { color:var(--gold); font-size:1.2rem; opacity:.7; }
      .cp .chip { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px;
                  border-radius:11px; border:1px solid var(--gold); color:var(--gold); font-size:.74rem; font-weight:600; padding:0 5px; }
      .cp .chip.sm { min-width:19px; height:19px; font-size:.68rem; }

      .cp .wrow { display:grid; grid-template-columns:1.4rem 1fr 1fr 1.6fr auto; gap:.5rem; align-items:center;
                  padding:.3rem .2rem; border-top:1px solid var(--stripe); font-size:.78rem; }
      .cp .wrow.bad { color:var(--muted); }
      .cp .wrow .wnum { font-weight:700; color:var(--muted); text-align:center; }
      .cp .wside { display:flex; gap:.2rem; align-items:center; flex-wrap:wrap; font-size:.7rem; color:var(--muted); }
      .cp .wsaid em { color:var(--rust); font-style:normal; font-size:.92em; }
      .cp .wrow .say { margin-left:0; }

      .cp .result.won { box-shadow:inset 0 0 0 1px var(--moss); }
      .cp .result.lost { box-shadow:inset 0 0 0 1px var(--rust); }

      .cp .sol { margin-top:.4rem; font-size:.79rem; }
      .cp .sol summary { cursor:pointer; color:var(--muted); font-size:.75rem; }
      .cp .sol ol { margin:.4rem 0 0; padding-left:1.2rem; line-height:1.5; }
      .cp .sol li { margin-bottom:.25rem; }

      .cp .setrow { display:grid; grid-template-columns:5.5rem 1fr; gap:.5rem; align-items:center; margin:.25rem 0; }

      @media (max-width:620px) {
        .cp .hands { grid-template-columns:1fr; }
        .cp .scales { display:none; }
        .cp .wrow { grid-template-columns:1.4rem 1fr auto; }
        .cp .setrow { grid-template-columns:1fr; }
      }
    </style>`;
  }
}

if (AppV2) {
  CPApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSetting();
  let state = game.settings.get(CP_NS, CP_KEY);
  if (!state?.fake) state = blankState();
  else state = foundry.utils.mergeObject(blankState(state), state, { inplace: false });
  const puzzle = new CoinPuzzle(state);
  new CPApp(puzzle).render(true);
})();
