/* Minimal Foundry VTT stand-in for Node — just enough to load a player-facing
   macro and drive its reducer + player→GM relay without a browser or DOM.

   It mirrors the browser stub in tools/preview/foundry-stub.js, but drops the
   DOM/ApplicationV2 rendering (render is a no-op) and adds the one thing the
   browser harness can't do: a `loadMacro` that evaluates a macro's source with
   the internals it needs to test exposed on `globalThis.__macro`, plus a
   working two-side relay (a player User's `setFlag` fires `updateUser`, and a
   booted-as-GM macro's handler runs against the same process state).

   The macros in this repo touch a small, well-defined slice of the API:

     foundry.utils.{escapeHTML, mergeObject, deepClone, randomID}
     foundry.applications.api.ApplicationV2   (no-op render)
     game.settings.{register, get, set, settings.has}
     game.actors (party, get, find, iterable), game.users, game.user
     user.{getFlag, setFlag}  — setFlag fires the updateUser hook
     Hooks.{on, off, call, callAll}, ui.notifications, ChatMessage, fromUuid
     actor.{skills, itemTypes.lore, system.abilities, testUserPermission}
 */
"use strict";

const fs = require("fs");

/* ------------------------------------------------------------------- utils */
globalThis.foundry = {
  utils: {
    escapeHTML: (s) => String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    deepClone: (v) => (v === null || typeof v !== "object") ? v : JSON.parse(JSON.stringify(v)),
    randomID: (n = 16) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let out = ""; for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    },
    mergeObject: (original, other = {}, options = {}) => {
      const target = options.inplace === false ? foundry.utils.deepClone(original) : original;
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
  applications: {
    api: { ApplicationV2: class { constructor() {} async render() { return this; } } },
    ux: { TextEditor: { implementation: { getDragEventData: () => null } } }
  }
};
globalThis.Application = foundry.applications.api.ApplicationV2;
globalThis.TextEditor = foundry.applications.ux.TextEditor.implementation;

/* ------------------------------------------------------------------ actors */
function slug(s) { return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function labelFor(s) { return s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" "); }

/* Four fictional PCs, matching the browser stub's party. `lores` are
   [name, rank]; rank lives on the Lore item, as in PF2e. */
const SAMPLE_PCS = [
  { id: "pc1", name: "Aiko",  cls: "Champion",   level: 5, con: 4,
    skills: { diplomacy: 13, athletics: 14 }, lores: [["Warfare Lore", 1]] },
  { id: "pc2", name: "Daizen", cls: "Wizard",    level: 5, con: 1,
    skills: { arcana: 15, crafting: 14 }, lores: [["Absalom Lore", 1], ["Academia Lore", 1]] },
  { id: "pc3", name: "Miyu",  cls: "Rogue",      level: 5, con: 2,
    skills: { stealth: 16, thievery: 15 }, lores: [["Underworld Lore", 2]] },
  { id: "pc4", name: "Tenzo", cls: "Thaumaturge", level: 5, con: 3,
    skills: { intimidation: 15, survival: 11 }, lores: [["Assassin Lore", 1]] }
];

function mkActor(spec) {
  const loreSlugs = (spec.lores ?? []).map(([n]) => slug(n));
  const all = new Set([...Object.keys(spec.skills ?? {}), ...loreSlugs]);
  const actor = {
    id: spec.id, name: spec.name, type: "character", hasPlayerOwner: true,
    img: "icons/svg/mystery-man.svg", prototypeToken: { texture: { src: "" } },
    system: {
      details: { level: { value: spec.level }, class: { name: spec.cls }, ancestry: { name: "Human" } },
      abilities: { con: { mod: spec.con ?? 2 } }, crafting: { formulas: [] }
    },
    itemTypes: { lore: (spec.lores ?? []).map(([n, r]) =>
      ({ name: n, type: "lore", slug: slug(n), system: { proficient: { value: r } } })) },
    skills: {}
  };
  for (const sk of all) {
    const lore = loreSlugs.includes(sk) || sk.endsWith("-lore");
    const fromLore = (spec.lores ?? []).find(([n]) => slug(n) === sk)?.[1];
    actor.skills[sk] = { mod: spec.skills?.[sk] ?? 8, label: labelFor(sk), rank: fromLore ?? 1, lore, slug: sk };
  }
  /* Ownership, exactly as Foundry answers it: the GM owns everything; a player
     owns their own character and nothing else. */
  actor.testUserPermission = (user) => !!user && (user.isGM || user.character?.id === actor.id);
  actor.sheet = { render: () => {} };
  return actor;
}

const ACTORS = SAMPLE_PCS.map(mkActor);
const actorCollection = {
  party: { id: "party", name: "Party", type: "party", members: ACTORS },
  get: (id) => ACTORS.find(a => a.id === id) ?? null,
  find: (fn) => ACTORS.find(fn) ?? null,
  [Symbol.iterator]: () => ACTORS[Symbol.iterator]()
};

/* ------------------------------------------------------------------- users */
function mkUser(id, isGM, characterId) {
  const u = { id, isGM, active: true, flags: {}, name: id,
    character: characterId ? ACTORS.find(a => a.id === characterId) : null };
  u.getFlag = (scope, key) => u.flags?.[scope]?.[key];
  u.setFlag = async (scope, key, value) => {
    (u.flags[scope] ??= {})[key] = value;
    globalThis.Hooks.call("updateUser", u, { flags: { [scope]: { [key]: value } } }, {}, u.id);
    return u;
  };
  return u;
}

/* ------------------------------------------------------------------- hooks */
const hookHandlers = new Map();
let hookId = 0;
globalThis.Hooks = {
  on: (name, fn) => { const id = ++hookId; if (!hookHandlers.has(name)) hookHandlers.set(name, new Map()); hookHandlers.get(name).set(id, fn); return id; },
  once: (name, fn) => globalThis.Hooks.on(name, fn),
  off: (name, id) => { hookHandlers.get(name)?.delete(id); },
  call: (name, ...args) => { for (const fn of hookHandlers.get(name)?.values() ?? []) fn(...args); return true; },
  callAll: (name, ...args) => globalThis.Hooks.call(name, ...args)
};

/* --------------------------------------------------------------- settings */
const settingStore = new Map();
const settingDefs = new Map();

/* ---------------------------------------------------------------- globals */
globalThis.ui = { notifications: { info: () => {}, warn: (m) => console.warn("[warn]", m), error: (m) => console.error("[error]", m) } };
globalThis.__chat = [];
globalThis.ChatMessage = {
  getSpeaker: () => ({ alias: "GM" }),
  create: async (data) => { globalThis.__chat.push(data); return {}; }
};
globalThis.fromUuid = async () => null;

function buildGame(userId) {
  const users = [mkUser("gm", true, null), mkUser("player", false, "pc1")];
  users.get = (id) => users.find(u => u.id === id) ?? null;
  Object.defineProperty(users, "activeGM", { get: () => users.find(u => u.isGM && u.active) ?? null });
  return {
    user: users.find(u => u.id === userId) ?? users[0],
    users,
    actors: actorCollection,
    socket: { on: () => {}, emit: () => {} },
    system: { id: "pf2e" },
    modules: { get: () => ({ active: false }) },
    settings: {
      settings: settingDefs,
      register: (ns, key, def) => settingDefs.set(`${ns}.${key}`, def),
      get: (ns, key) => settingStore.get(`${ns}.${key}`) ?? null,
      set: async (ns, key, value) => { settingStore.set(`${ns}.${key}`, value); return value; }
    }
  };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------- macro load */
/* Evaluates a macro in this process with the stub globals in place, exposes the
   named top-level identifiers on `globalThis.__macro`, and lets the macro's
   async boot IIFE finish (it registers hooks after its first settings write)
   before returning. `user` picks who `game.user` is when the macro boots. */
async function loadMacro(macroPath, { user = "gm", expose = [] } = {}) {
  globalThis.game = buildGame(user);
  const src = fs.readFileSync(macroPath, "utf8");
  const exportLine = expose.length ? `\n;globalThis.__macro = { ${expose.join(", ")} };` : "";
  eval(src + exportLine); // eslint-disable-line no-eval
  await sleep(20); // flush the boot IIFE's microtasks (hook registration)
  return { game: globalThis.game, exports: globalThis.__macro ?? {} };
}

module.exports = { loadMacro, buildGame, sleep, getGame: () => globalThis.game, getHooks: () => globalThis.Hooks };
