/* Minimal Foundry VTT stand-in, just large enough to render a macro's window
   outside of Foundry so screenshots can be captured for the README.

   The macros in this repo touch a small, well-defined slice of the API:

     foundry.utils.{escapeHTML, mergeObject, deepClone}
     foundry.applications.api.ApplicationV2
     game.settings.{register, get, set, settings.has}
     game.actors (iterable, .get, .find, .party)
     game.users, game.user, game.journal.getName
     ChatMessage.{create, getSpeaker}, Dialog.confirm, Hooks.on, ui.notifications

   Everything below implements exactly that and nothing more. It is a preview
   harness, not an emulator — chat messages and settings writes go to the
   console instead of anywhere real. */

/* ------------------------------------------------------------------ actors */

/* Portraits are generated rather than shipped, so the harness stays
   self-contained and no adventure art ends up in the repository. */
function portrait(initials, bg, fg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
    <rect width="128" height="128" fill="${bg}"/>
    <circle cx="64" cy="50" r="26" fill="${fg}" opacity=".9"/>
    <path d="M18 128c0-27 21-44 46-44s46 17 46 44z" fill="${fg}" opacity=".9"/>
    <text x="64" y="118" font-family="serif" font-size="20" fill="${bg}"
          text-anchor="middle" opacity=".85">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/* Fictional sample party. Names are invented for the preview only. */
const SAMPLE_PCS = [
  { name: "Aiko",  cls: "Champion",   ancestry: "Human",    level: 5, bg: "#5d3654", fg: "#efe6d8" },
  { name: "Daizen", cls: "Wizard",    ancestry: "Kitsune",  level: 5, bg: "#3d4c59", fg: "#efe6d8" },
  { name: "Miyu",  cls: "Rogue",      ancestry: "Tengu",    level: 5, bg: "#4b5a34", fg: "#efe6d8" },
  { name: "Tenzo", cls: "Thaumaturge", ancestry: "Nagaji",  level: 5, bg: "#95381f", fg: "#efe6d8" }
];

class StubActor {
  constructor(spec, i) {
    this.id = `pc${i + 1}`;
    this.name = spec.name;
    this.type = "character";
    this.hasPlayerOwner = true;
    this.img = portrait(spec.name.slice(0, 2).toUpperCase(), spec.bg, spec.fg);
    this.prototypeToken = { texture: { src: this.img } };
    this.system = {
      details: {
        level: { value: spec.level },
        class: { name: spec.cls },
        ancestry: { name: spec.ancestry }
      }
    };
  }
}

const ACTORS = SAMPLE_PCS.map((s, i) => new StubActor(s, i));

const partyActor = { id: "party", name: "Party", type: "party", members: ACTORS };

const actorCollection = {
  party: partyActor,
  get: (id) => ACTORS.find(a => a.id === id) ?? null,
  find: (fn) => ACTORS.find(fn) ?? null,
  [Symbol.iterator]: () => ACTORS[Symbol.iterator]()
};

/* ----------------------------------------------------------------- globals */

const settingStore = new Map();
const settingDefs = new Map();

globalThis.game = {
  user: { id: "gm", isGM: true, name: "Gamemaster" },
  users: [{ id: "gm", isGM: true, character: null }],
  actors: actorCollection,
  journal: { getName: () => null },
  settings: {
    settings: settingDefs,
    register: (ns, key, def) => settingDefs.set(`${ns}.${key}`, def),
    get: (ns, key) => settingStore.get(`${ns}.${key}`) ?? null,
    set: (ns, key, value) => { settingStore.set(`${ns}.${key}`, value); return Promise.resolve(value); }
  }
};

globalThis.ui = {
  notifications: {
    info: (m) => console.info("[notify]", m),
    warn: (m) => console.warn("[notify]", m),
    error: (m) => console.error("[notify]", m)
  }
};

globalThis.Hooks = { on: () => 0, once: () => 0, off: () => {}, call: () => true, callAll: () => true };

globalThis.ChatMessage = {
  getSpeaker: () => ({ alias: "Gamemaster" }),
  create: (data) => { console.log("[chat]", data?.content ?? data); return Promise.resolve(data); }
};

globalThis.Dialog = { confirm: () => Promise.resolve(false) };

/* Enough of Roll for macros that roll a die and read .total. Seeded so a
   capture of a rolled result is reproducible rather than flickering. */
let rollSeed = 1;
globalThis.Roll = class Roll {
  constructor(formula) { this.formula = formula; this.total = 0; }
  async evaluate() {
    const m = /^(\d*)d(\d+)([+-]\d+)?$/.exec(this.formula.replace(/\s/g, ""));
    if (!m) { this.total = 0; return this; }
    const count = Number(m[1] || 1), faces = Number(m[2]), flat = Number(m[3] || 0);
    let sum = flat;
    for (let i = 0; i < count; i++) {
      rollSeed = (rollSeed * 1103515245 + 12345) & 0x7fffffff;   // deterministic
      sum += (rollSeed % faces) + 1;
    }
    this.total = sum;
    return this;
  }
  roll() { return this.evaluate(); }
};

/* Compendium lookups resolve to a stand-in whose sheet render is a no-op, so
   "open the statblock" buttons can be exercised without a real world. */
globalThis.fromUuid = async (uuid) => ({
  uuid, name: uuid.split(".").pop(),
  sheet: { render: () => console.log("[sheet]", uuid) }
});

/* Opt-in Sequencer stand-in, switched on by a fixture setting
   `__previewSequencer`. It reports any jb2a./psfx. key as installed and
   records what a sequence was built from, so effect code paths can be
   exercised and asserted without the real modules. Never on by default —
   a macro's "no Sequencer" branch needs testing too. */
if (globalThis.__previewSequencer) {
  const calls = [];
  globalThis.__sequences = calls;
  const section = (kind, entry) => {
    const self = {
      file: (f) => { entry.file = f; return self; },
      atLocation: (t) => { entry.at = t?.name ?? "location"; return self; },
      scale: (n) => { entry.scale = n; return self; },
      screenSpace: () => { entry.screenSpace = true; return self; },
      screenSpaceAnchor: (a) => { entry.anchor = a; return self; },
      shake: (o) => { entry.shake = o; return self; }
    };
    entry.kind = kind;
    return self;
  };
  globalThis.Sequence = class Sequence {
    constructor() { this.parts = []; calls.push(this.parts); }
    effect() { const e = {}; this.parts.push(e); return section("effect", e); }
    sound() { const e = {}; this.parts.push(e); return section("sound", e); }
    canvasPan() { const e = {}; this.parts.push(e); return section("canvasPan", e); }
    async play() { return this; }
  };
  globalThis.Sequencer = {
    Database: { entryExists: (k) => /^(jb2a|psfx)\./.test(k) }
  };
  game.modules = { get: (id) => ({ id, active: ["sequencer", "jb2a_patreon", "psfx"].includes(id) }) };
  globalThis.canvas = { tokens: { controlled: [] }, dimensions: { width: 4000, height: 3000 }, scene: {} };
}

globalThis.foundry = {
  utils: {
    escapeHTML: (s) => String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    deepClone: (v) => (v === null || typeof v !== "object") ? v : JSON.parse(JSON.stringify(v)),
    mergeObject: (original, other = {}, options = {}) => {
      const target = options.inplace === false
        ? globalThis.foundry.utils.deepClone(original)
        : original;
      const merge = (dst, src) => {
        for (const [k, v] of Object.entries(src ?? {})) {
          if (v && typeof v === "object" && !Array.isArray(v) &&
              dst[k] && typeof dst[k] === "object" && !Array.isArray(dst[k])) merge(dst[k], v);
          else dst[k] = v;
        }
        return dst;
      };
      return merge(target, other);
    }
  },
  applications: { api: {} }
};

/* ------------------------------------------------------ ApplicationV2 stub */

/* Reproduces the DOM shape the real ApplicationV2 builds — an outer element
   carrying the app id, a window header, and a `.window-content` section — so
   selectors like `#ep-console .window-content` match here the same way they
   match in Foundry. */
class ApplicationV2 {
  constructor(options = {}) {
    this.options = options;
    globalThis.__previewApp = this;
  }

  static DEFAULT_OPTIONS = {};

  get opts() {
    return { ...ApplicationV2.DEFAULT_OPTIONS, ...(this.constructor.DEFAULT_OPTIONS ?? {}) };
  }

  async render() {
    const o = this.opts;
    const host = document.getElementById("stage");
    let app = document.getElementById(o.id);

    if (!app) {
      const width = o.position?.width;
      app = document.createElement("div");
      app.id = o.id;
      app.className = `application ${(o.classes ?? []).join(" ")}`;
      if (typeof width === "number") app.style.width = `${width}px`;
      app.innerHTML = `
        <header class="window-header">
          <i class="${o.window?.icon ?? "fa-solid fa-scroll"}"></i>
          <h4 class="window-title">${this.title ?? o.window?.title ?? "Macro"}</h4>
          <button type="button" class="header-control"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <section class="window-content"></section>`;
      host.appendChild(app);
    }

    const content = app.querySelector(".window-content");
    const result = await this._renderHTML();

    if (typeof this._replaceHTML === "function") this._replaceHTML(result, content);
    else { content.innerHTML = result; this.wire?.(content); }

    document.body.dataset.ready = "true";
    return this;
  }

  close() { return Promise.resolve(this); }
  bringToFront() {}
}

globalThis.foundry.applications.api.ApplicationV2 = ApplicationV2;
globalThis.Application = ApplicationV2;

/* Seeded state, set by the page before the macro script loads. Lets a preview
   show a console mid-session rather than an untouched one. */
if (globalThis.__previewSeed) {
  for (const [id, value] of Object.entries(globalThis.__previewSeed)) {
    if (id.startsWith("__")) continue;
    settingStore.set(id, value);
    settingDefs.set(id, { scope: "world", config: false, type: Object, default: null });
  }
}
