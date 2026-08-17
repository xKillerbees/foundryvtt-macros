/* ============================================================================
   MULTI-PART BOSS CONSOLE — a GM combat tracker for bosses with breakable parts
   Pathfinder 2nd Edition  •  Foundry VTT v11 / v12 / v13 / v14
   ----------------------------------------------------------------------------
   Paste into a Macro (Type: Script) and execute.

   Turns a single boss actor into a multi-part opponent: a main body with its
   own hit-point pool, plus any number of targetable parts (head, wings, claws,
   power core, …), each with its own pool and the abilities it powers. Break a
   part and those abilities go away; break the right part and a phase fires.

   The rules this tracks are a homebrew adaptation of Fabula Ultima's
   multi-part-opponent and phase rules to PF2e (see "How It's Played Labs" —
   "Multi-Part Opponents & Phases in Pathfinder 2e"). It is fan-made material,
   not official Paizo content.

   How the damage rule works (and what this console tracks): a hit declared
   against a PART is applied to BOTH the part's pool and the main body's pool,
   with each location's resistance/weakness applied separately — the "to main
   body" and "to part" fields in the damage form exist so the GM can split one
   roll into two net values when they differ. Area effects hit only the main
   body. Healing a part also heals the body; area healing heals only the body.
   A broken part stays broken for the encounter — normal healing can't repair
   it, only an explicit "unbreak" (GM correction) can.

   The boss is linked to a real actor: its HP mirrors to the token bar (so the
   combat tracker stays honest) and its AC / saves / resistances are read live
   as a reference. Everything else — parts, phases, the fight's HP — lives in a
   hidden world setting, so re-pasting an updated macro never wipes a fight.
   ============================================================================ */

const MP_NS = "world";
const MP_KEY = "multipartBoss";
const MP_ID = `${MP_NS}.${MP_KEY}`;

const THEME = "dark";
const PALETTES = {
  /* Boss-fight table: near-black with a hot accent. */
  dark: {
    paper: "#12100d", card: "#1c1915", ink: "#ece3d0", line: "#3d3527", muted: "#a3947a",
    stripe: "rgba(255,255,255,.04)", hover: "rgba(226,193,105,.12)", field: "#0d0b08",
    gold: "#e2c169", moss: "#6fbb86", rust: "#cf5a3d", slate: "#6f9fc0", plum: "#a582cc", ember: "#e0a349"
  },
  parchment: {
    paper: "#f4f0e6", card: "#ffffff", ink: "#1c1915", line: "#cdbfa4", muted: "#6b6050",
    stripe: "rgba(0,0,0,.04)", hover: "rgba(0,0,0,.07)", field: "#faf7f0",
    gold: "#8a6a12", moss: "#1e7a49", rust: "#a63c22", slate: "#1f6289", plum: "#66429e", ember: "#8c5c12"
  }
};

/* Common PF2e damage types, for the (informational) type field's datalist. */
const DAMAGE_TYPES = [
  "physical", "bludgeoning", "piercing", "slashing",
  "fire", "cold", "electricity", "acid", "sonic", "poison", "bleed",
  "mental", "force", "spirit", "void", "vitality", "precision"
];

/* ------------------------------------------------------------------ helpers */
const rid = () => (foundry.utils?.randomID
  ? foundry.utils.randomID()
  : "id" + Math.random().toString(36).slice(2, 10));

const esc = (s) => (foundry.utils?.escapeHTML
  ? foundry.utils.escapeHTML(String(s ?? ""))
  : String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const num = (v, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };

async function confirmDialog(content, title, yesLabel = "Yes", noLabel = "No") {
  title = title ?? "Are you sure?";
  const V2 = foundry.applications?.api?.DialogV2;
  if (V2?.confirm) {
    try {
      return !!(await V2.confirm({ window: { title }, content,
        yes: { label: yesLabel }, no: { label: noLabel } }));
    } catch { return false; }
  }
  try {
    return !!(await Dialog.confirm({ title, content, defaultYes: false }));
  } catch (err) {
    console.warn("confirm unavailable, treating as no.", err);
    return false;
  }
}

/* ------------------------------------------------------------------- state */
function blankPart(id) {
  return { id, name: "", maxHp: 0, hp: 0, broken: false,
    abilities: "", brokenEffect: "", acNote: "", saveNote: "", resistNote: "", weakNote: "" };
}
function blankPhase(id) {
  return { id, name: "", triggerType: "manual", triggerPartId: null,
    triggerHp: 0, triggerRound: 0, backpocket: false, effects: "",
    active: false, skipped: false, armed: false };
}
function blankState() {
  return {
    v: 1,
    tab: "fight",                 // fight | parts | phases
    actorUuid: null,              // linked enemy actor (uuid survives compendium/re-import)
    actorId: null,                // resolved world id, the fast path
    actorName: "",                // cached display name
    bodyMaxHp: 0, bodyHp: 0,      // the main body's pool (source of truth for the fight)
    syncToken: true,              // mirror bodyHp onto the actor's token bar
    stats: { level: 0, ac: 0, fort: 0, ref: 0, will: 0, defenses: "" },
    round: 0,
    parts: [],                    // [{ id, name, maxHp, hp, broken, abilities, … }]
    phases: [],                   // [{ id, name, triggerType, …, active, skipped, armed }]
    log: [],                      // [{ t, text }] newest first
    editPart: null, editPhase: null
  };
}

function registerSetting() {
  if (!game.settings.settings.has(MP_ID)) {
    game.settings.register(MP_NS, MP_KEY, { scope: "world", config: false, type: Object, default: null });
  }
}

/* ------------------------------------------------------------------- engine */
class MultipartBoss {
  constructor(state) { this.state = state; }
  get s() { return this.state; }
  render() { this.app?.render(); }
  async save() { await game.settings.set(MP_NS, MP_KEY, this.s); }
  touch() { this.render(); this.save(); }

  /* ------------------------------------------------ actor linkage --------- */
  actorSync() { return this.s.actorId ? (game.actors?.get(this.s.actorId) ?? null) : null; }

  async resolveActor() {
    const a = this.actorSync();
    if (a) return a;
    if (this.s.actorUuid) { try { return await fromUuid(this.s.actorUuid); } catch { return null; } }
    return null;
  }

  /* Read a stat block worth of reference numbers from an actor (PF2e paths). */
  statsFor(a) {
    const sy = a?.system ?? {};
    const hp = sy.attributes?.hp ?? {};
    const saves = sy.saves ?? {};
    const level = sy.details?.level?.value ?? a?.level ?? 0;
    const ac = sy.attributes?.ac?.value ?? 0;
    const fort = saves.fortitude?.value ?? saves.fortitude?.mod ?? 0;
    const ref = saves.reflex?.value ?? saves.reflex?.mod ?? 0;
    const will = saves.will?.value ?? saves.will?.mod ?? 0;
    return { name: a?.name ?? "", level, ac, fort, ref, will, hpMax: hp.max ?? 0, hpValue: hp.value ?? 0, defenses: this.defensesFor(a) };
  }

  /* Best-effort flatten of resistances / weaknesses / immunities to one string. */
  defensesFor(a) {
    const attrs = a?.system?.attributes ?? {};
    const fmt = (arr, tag) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const bits = arr.map(x => {
        const t = typeof x === "string" ? x : (x.type ?? x.label ?? "");
        const v = typeof x === "object" && x.value != null ? ` ${x.value}` : "";
        return `${t}${v}`;
      });
      return `<span class="dtag">${tag} ${bits.join(", ")}</span>`;
    };
    const res = attrs.damageResistances ?? attrs.dr;
    const weak = attrs.damageWeaknesses ?? attrs.dw;
    const imm = attrs.damageImmunities ?? attrs.di;
    return [fmt(res, "Resist"), fmt(weak, "Weak"), fmt(imm, "Immune")].filter(Boolean).join(" ") || "—";
  }

  async link(actor) {
    if (!actor) return;
    const st = this.statsFor(actor);
    this.s.actorUuid = actor.uuid ?? null;
    this.s.actorId = actor.pack ? null : (actor.id ?? null);
    this.s.actorName = st.name;
    this.s.stats = { level: st.level, ac: st.ac, fort: st.fort, ref: st.ref, will: st.will, defenses: st.defenses };
    this.s.bodyMaxHp = st.hpMax || this.s.bodyMaxHp;
    this.s.bodyHp = st.hpValue ?? st.hpMax ?? this.s.bodyHp;
    this.s.bodyHp = clamp(this.s.bodyHp, 0, this.s.bodyMaxHp || this.s.bodyHp);
    this.log(`Linked ${st.name}`);
    this.touch();
  }

  /* The currently controlled token's actor, else the first targeted token's. */
  currentTokenActor() {
    const ctrl = canvas?.tokens?.controlled?.[0];
    const act1 = ctrl?.document?.actor ?? ctrl?.actor;
    if (act1) return act1;
    const t = game.user?.targets?.first?.();
    return t?.document?.actor ?? t?.actor ?? null;
  }

  async linkFromToken() {
    const a = this.currentTokenActor();
    if (!a) return ui.notifications?.warn?.("Select or target the boss token first.");
    await this.link(a);
  }

  async linkFromSelect(actorId) {
    const a = game.actors?.get(actorId);
    if (a) await this.link(a);
  }

  async refreshFromActor() {
    const a = await this.resolveActor();
    if (!a) return ui.notifications?.warn?.("Couldn't resolve the linked actor.");
    const st = this.statsFor(a);
    this.s.actorName = st.name;
    this.s.stats = { level: st.level, ac: st.ac, fort: st.fort, ref: st.ref, will: st.will, defenses: st.defenses };
    if (st.hpMax) this.s.bodyMaxHp = st.hpMax;
    if (st.hpValue != null) this.s.bodyHp = clamp(st.hpValue, 0, this.s.bodyMaxHp || st.hpValue);
    this.log("Pulled stats & HP from the actor");
    this.touch();
  }

  async setSyncToken(v) { this.s.syncToken = !!v; this.touch(); if (v) await this.pushBodyToActor(); }

  async pushBodyToActor() {
    if (!this.s.syncToken) return;
    const a = this.actorSync();
    if (!a || a.pack) return;                 // compendium actors can't take a mid-fight HP write
    try {
      await a.update({ "system.attributes.hp.value": this.s.bodyHp });
    } catch (e) { console.warn("mpb: couldn't mirror HP to token", e); }
  }

  /* ------------------------------------------------ HP / damage ----------- */
  setBodyHp(v) { this.s.bodyHp = clamp(num(v), 0, this.s.bodyMaxHp || num(v)); }

  hurtBody(amt) {
    const before = this.s.bodyHp;
    this.setBodyHp(this.s.bodyHp - num(amt));
    if (before > 0 && this.s.bodyHp <= 0) {
      this.log("Main body reduced to 0 — the creature is defeated");
      this.postBreak(`The ${esc(this.s.actorName || "creature")} falls.`, "defeated");
    }
    this.pushBodyToActor();
  }
  healBody(amt) { this.setBodyHp(this.s.bodyHp + num(amt)); this.pushBodyToActor(); }

  part(id) { return this.s.parts.find(p => p.id === id); }

  hurtPart(id, amt) {
    const p = this.part(id);
    if (!p) return;
    const before = p.hp;
    p.hp = clamp(p.hp - num(amt), 0, p.maxHp);
    if (before > 0 && p.hp <= 0) {
      p.broken = true;
      this.log(`"${p.name || "part"}" broken`);
      this.postBreak(`${esc(this.s.actorName || "The creature")}'s ${esc(p.name || "part")} is broken!`);
    }
    this.scanPhases();
  }

  healPart(id, amt) {
    const p = this.part(id);
    if (!p) return;
    if (p.broken) { this.log(`"${p.name}" stays broken — healing can't repair a broken part`); return; }
    p.hp = clamp(p.hp + num(amt), 0, p.maxHp);
  }

  /* The core double-rule: a part hit lands on BOTH pools, each net value the GM
     has already adjusted for that location's resistance/weakness. */
  applyDamage(targetId, toBody, toPart, kind, type) {
    const label = this.s.actorName || "creature";
    if (kind === "heal") {
      this.healBody(toBody);
      if (targetId !== "body") this.healPart(targetId, toPart);
      this.log(`Healed main body +${num(toBody)}${targetId !== "body" ? `, part +${num(toPart)}` : ""}`);
    } else {
      this.hurtBody(toBody);
      if (targetId !== "body") {
        const p = this.part(targetId);
        this.hurtPart(targetId, toPart);
        this.log(`${esc(p?.name || "part")} hit for ${num(toPart)} (body ${num(toBody)})${type ? ` · ${esc(type)}` : ""}`);
      } else {
        this.log(`Main body hit for ${num(toBody)}${type ? ` · ${esc(type)}` : ""}`);
      }
    }
    this.scanPhases();
    this.touch();
  }

  fastHeal(amt) {
    const n = num(amt);
    this.healBody(n);
    for (const p of this.s.parts) if (!p.broken) p.hp = clamp(p.hp + n, 0, p.maxHp);
    this.log(`Fast healing ${n} — body and every intact part`);
    this.touch();
  }

  breakPart(id) {
    const p = this.part(id);
    if (!p) return;
    const was = p.broken;
    p.broken = true;
    if (!was) {
      this.log(`"${p.name}" broken`);
      this.postBreak(`${esc(this.s.actorName || "The creature")}'s ${esc(p.name)} is broken!`);
    }
    this.scanPhases();
    this.touch();
  }
  unbreakPart(id) {
    const p = this.part(id);
    if (!p) return;
    p.broken = false;
    p.hp = Math.max(1, p.hp);
    this.log(`"${p.name}" un-broken (GM correction)`);
    this.scanPhases();
    this.touch();
  }

  /* ------------------------------------------------ parts / phases -------- */
  addPart() {
    const suggested = this.s.bodyMaxHp ? Math.round(this.s.bodyMaxHp * 0.4) : 0;
    const p = blankPart(rid());
    p.name = "New part";
    p.maxHp = suggested;
    p.hp = suggested;
    this.s.parts.push(p);
    this.s.editPart = p.id;
    this.log("Added a part");
    this.touch();
  }
  async removePart(id) {
    const p = this.part(id);
    if (!p) return;
    if (!(await confirmDialog(`Remove the part <b>${esc(p.name)}</b>?`, "Remove part", "Remove", "Keep"))) return;
    this.s.parts = this.s.parts.filter(x => x.id !== id);
    this.s.phases.forEach(ph => { if (ph.triggerPartId === id) ph.triggerPartId = null; });
    if (this.s.editPart === id) this.s.editPart = null;
    this.log(`Removed part "${p.name}"`);
    this.touch();
  }
  editPart(id) { this.s.editPart = id; this.touch(); }
  cancelEditPart() { this.s.editPart = null; this.touch(); }

  savePart(id, fields) {
    const p = this.part(id);
    if (!p) return;
    p.name = fields.name.trim() || p.name || "Part";
    p.maxHp = Math.max(0, num(fields.maxHp, p.maxHp));
    p.hp = clamp(p.hp, 0, p.maxHp);
    p.abilities = fields.abilities ?? "";
    p.brokenEffect = fields.brokenEffect ?? "";
    p.acNote = fields.acNote ?? "";
    p.saveNote = fields.saveNote ?? "";
    p.resistNote = fields.resistNote ?? "";
    p.weakNote = fields.weakNote ?? "";
    this.s.editPart = null;
    this.touch();
  }

  addPhase() {
    const p = blankPhase(rid());
    p.name = "New phase";
    this.s.phases.push(p);
    this.s.editPhase = p.id;
    this.log("Added a phase");
    this.touch();
  }
  async removePhase(id) {
    const p = this.s.phases.find(x => x.id === id);
    if (!p) return;
    if (!(await confirmDialog(`Remove the phase <b>${esc(p.name)}</b>?`, "Remove phase", "Remove", "Keep"))) return;
    this.s.phases = this.s.phases.filter(x => x.id !== id);
    if (this.s.editPhase === id) this.s.editPhase = null;
    this.log(`Removed phase "${p.name}"`);
    this.touch();
  }
  editPhase(id) { this.s.editPhase = id; this.touch(); }
  cancelEditPhase() { this.s.editPhase = null; this.touch(); }

  savePhase(id, fields) {
    const p = this.s.phases.find(x => x.id === id);
    if (!p) return;
    p.name = fields.name.trim() || p.name || "Phase";
    p.triggerType = fields.triggerType || "manual";
    p.triggerPartId = fields.triggerPartId || null;
    p.triggerHp = Math.max(0, num(fields.triggerHp, p.triggerHp));
    p.triggerRound = Math.max(0, num(fields.triggerRound, p.triggerRound));
    p.backpocket = !!fields.backpocket;
    p.effects = fields.effects ?? "";
    this.s.editPhase = null;
    this.scanPhases();
    this.touch();
  }

  /* ------------------------------------------------ phase triggers -------- */
  triggerMet(p) {
    if (p.triggerType === "part-broken") return this.part(p.triggerPartId)?.broken === true;
    if (p.triggerType === "hp-below") return this.s.bodyHp < p.triggerHp;
    if (p.triggerType === "round") return p.triggerRound > 0 && this.s.round >= p.triggerRound;
    return false;
  }

  scanPhases(announce = true) {
    for (const p of this.s.phases) {
      if (p.active || p.skipped) { if (p.armed) p.armed = false; continue; }
      const met = this.triggerMet(p);
      if (met && !p.armed) {
        p.armed = true;
        if (announce) {
          this.log(`Trigger met — phase "${p.name}" armed`);
          this.postPhaseArmed(p);
        }
      } else if (!met && p.armed) {
        p.armed = false;                      // healed back above threshold, etc.
      }
    }
  }

  beginPhase(id) {
    const p = this.s.phases.find(x => x.id === id);
    if (!p || p.active) return;
    p.active = true; p.armed = false; p.skipped = false;
    this.log(`Phase began — "${p.name}"`);
    this.postPhaseActive(p);
    this.touch();
  }
  skipPhase(id) {
    const p = this.s.phases.find(x => x.id === id);
    if (!p) return;
    p.skipped = true; p.active = false; p.armed = false;
    this.log(`Phase "${p.name}" skipped`);
    this.touch();
  }
  resetPhase(id) {
    const p = this.s.phases.find(x => x.id === id);
    if (!p) return;
    p.active = false; p.skipped = false; p.armed = false;
    this.log(`Phase "${p.name}" reset`);
    this.touch();
  }

  /* ------------------------------------------------ round / reset --------- */
  setRound(n) { this.s.round = Math.max(0, num(n)); this.scanPhases(); this.touch(); }

  async resetFight() {
    if (!(await confirmDialog("Reset the fight? Every part is restored to full, every phase deactivates, HP returns to max, and the log clears. The boss build (parts, phases, actor link) is kept.", "Reset fight", "Reset", "Keep"))) return;
    const a = this.actorSync();
    if (a) { const st = this.statsFor(a); if (st.hpMax) this.s.bodyMaxHp = st.hpMax; }
    this.s.bodyHp = this.s.bodyMaxHp;
    for (const p of this.s.parts) { p.hp = p.maxHp; p.broken = false; }
    for (const ph of this.s.phases) { ph.active = false; ph.skipped = false; ph.armed = false; }
    this.s.round = 0;
    this.s.log = [];
    this.log("Fight reset");
    this.pushBodyToActor();
    this.touch();
  }

  async clearAll() {
    if (!(await confirmDialog("Clear <b>everything</b> — the actor link, every part, and every phase? This starts a fresh console.", "Clear everything", "Clear", "Keep"))) return;
    this.state = blankState();
    this.touch();
  }

  /* ------------------------------------------------ log / chat ------------ */
  log(text) {
    this.s.log.unshift({ t: Date.now(), text });
    if (this.s.log.length > 60) this.s.log.length = 60;
  }

  speaker() {
    const a = this.actorSync();
    if (a) { try { return ChatMessage.getSpeaker?.({ actor: a }) ?? { alias: a.name }; } catch { return { alias: a.name }; } }
    return { alias: this.s.actorName || "Boss" };
  }

  chatCard(tone, eyebrow, title, bodyHtml) {
    const C = { gold: "#e2c169", moss: "#6fbb86", rust: "#cf5a3d", slate: "#6f9fc0", ember: "#e0a349", muted: "#a3947a" };
    return `<div style="background:#1c1915;color:#ece3d0;border:1px solid #3d3527;border-radius:4px;
      padding:8px 10px;font-family:Signika,sans-serif;line-height:1.4">
      <div style="border-left:3px solid ${C[tone] ?? C.gold};padding-left:8px;margin-bottom:6px">
        <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#a3947a">${eyebrow}</div>
        <div style="font-size:15px;font-weight:600">${title}</div>
      </div>
      <div style="font-size:12px">${bodyHtml}</div></div>`;
  }

  async postChat(html) {
    try { await ChatMessage.create({ content: html, speaker: this.speaker() }); }
    catch (e) { console.warn("mpb: chat post failed", e); }
  }

  postBreak(line) {
    return this.postChat(this.chatCard("rust", "Part broken", line, ""));
  }
  postPhaseArmed(p) {
    return this.postChat(this.chatCard("ember", "Phase trigger met", `${esc(this.s.actorName || "The creature")} — ${esc(p.name)}`,
      `<p style="margin:0;font-style:italic">Check the console — a phase is waiting to begin.</p>`));
  }
  postPhaseActive(p) {
    return this.postChat(this.chatCard("gold", "New phase", `${esc(this.s.actorName || "The creature")} — ${esc(p.name)}`, ""));
  }
}

/* -------------------------------------------------------------- interface */
const AppV2 = foundry.applications?.api?.ApplicationV2;
const BaseApp = AppV2 ?? Application;

class MPBApp extends BaseApp {
  constructor(t, ...args) { super(...args); this.t = t; t.app = this; }
  static DEFAULT_OPTIONS = {
    id: "mpb-window", tag: "div", classes: ["mpb-window"],
    position: { width: 760, height: "auto" },
    window: { title: "Multi-Part Boss", icon: "fa-solid fa-dragon", resizable: true }
  };
  static get defaultOptions() {
    const base = super.defaultOptions ?? {};
    return foundry.utils.mergeObject(foundry.utils.deepClone(base), {
      id: "mpb-window", classes: ["mpb-window"], title: "Multi-Part Boss",
      width: 760, height: "auto", resizable: true
    });
  }
  get title() { return "Multi-Part Boss"; }
  async _renderHTML() { return this.markup(); }
  async _renderInner() {
    const $el = $(`<div class="mpb-root">${this.markup()}</div>`);
    this.wire($el[0]);
    return $el;
  }
  activateListeners(html) {
    super.activateListeners?.(html);
    this.wire(html instanceof jQuery ? html[0] : html);
  }

  /* ------------------------------------------------------------ markup ---- */
  markup() {
    const t = this.t;
    return `${this.styles()}
      <div class="mpb">
        ${this.tabstrip()}
        ${t.s.tab === "fight" ? this.fightTab() : t.s.tab === "parts" ? this.partsTab() : this.phasesTab()}
      </div>`;
  }

  tabstrip() {
    const t = this.t;
    const tabs = [
      ["fight", "fa-swords", "Fight"],
      ["parts", "fa-hand", "Parts"],
      ["phases", "fa-arrows-rotate", "Phases"]
    ];
    return `<nav class="tabs">${tabs.map(([k, icon, label]) =>
      `<button type="button" class="tab ${t.s.tab === k ? "on" : ""}" data-act="tab" data-k="${k}">
        <i class="fa-solid ${icon}"></i>${label}</button>`).join("")}</nav>`;
  }

  /* The boss's stat line, HP, and the damage/heal form. */
  fightTab() {
    const t = this.t, s = t.s;
    const a = t.actorSync();
    const live = a ? t.statsFor(a) : null;
    const level = live?.level ?? s.stats.level;
    const ac = live?.ac ?? s.stats.ac;
    const fort = live?.fort ?? s.stats.fort;
    const ref = live?.ref ?? s.stats.ref;
    const will = live?.will ?? s.stats.will;
    const defenses = live?.defenses ?? s.stats.defenses;
    return `
      ${this.bossHeader()}
      ${this.bodyPanel(level, ac, fort, ref, will, defenses)}
      ${this.damageForm()}
      ${this.partsLive()}
      ${this.phasesLive()}
      ${this.logPanel()}`;
  }

  bossHeader() {
    const t = this.t, s = t.s;
    const npcs = [...(game.actors ?? [])].filter(a => a.type !== "party" && a.type !== "character").sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const opts = npcs.map(a => `<option value="${esc(a.id)}" ${a.id === s.actorId ? "selected" : ""}>${esc(a.name)}</option>`).join("");
    return `
      <header class="topbar">
        <div class="ident">
          <div class="name">${s.actorName ? esc(s.actorName) : `<span class="muted">No boss linked</span>`}</div>
          <div class="linkrow">
            <select class="actorpick" data-f="actorPick" title="Pick the boss actor">
              ${s.actorId ? "" : `<option value="">— choose an NPC —</option>`}
              ${opts}
            </select>
            <button type="button" class="ghost sm" data-act="linkselect" title="Link the selected actor">Link</button>
            <button type="button" class="ghost sm" data-act="linktoken" title="Link the currently selected/targeted token">Use token</button>
            <button type="button" class="ghost sm" data-act="refresh" title="Re-read stats and HP from the actor">Refresh</button>
          </div>
        </div>
        <div class="controls">
          <label class="sync" title="Keep the actor's token HP bar in step with the main body">
            <input type="checkbox" data-act="sync" ${s.syncToken ? "checked" : ""}> sync token</label>
          <div class="round">
            <button type="button" class="qbtn" data-act="round" data-k="${s.round - 1}" ${s.round <= 0 ? "disabled" : ""}>−</button>
            <span class="rnum">Round ${s.round}</span>
            <button type="button" class="qbtn" data-act="round" data-k="${s.round + 1}">+</button>
          </div>
          <button type="button" class="ghost sm" data-act="reset">Reset fight</button>
          <button type="button" class="ghost sm danger" data-act="clear">Clear all</button>
        </div>
      </header>`;
  }

  hpBar(cur, max, cls = "") {
    const pct = max > 0 ? clamp((cur / max) * 100, 0, 100) : 0;
    const tone = cur <= 0 ? "dead" : pct < 25 ? "low" : pct < 50 ? "mid" : "full";
    return `<div class="hpwrap ${cls}">
      <div class="hpline"><span class="hpnum">${cur}</span><span class="hpden">/ ${max}</span></div>
      <div class="hbar ${tone}"><div class="hfill" style="width:${pct}%"></div></div>
    </div>`;
  }

  bodyPanel(level, ac, fort, ref, will, defenses) {
    const t = this.t, s = t.s;
    const a = t.actorSync();
    const live = a ? t.statsFor(a) : null;
    const drift = live && live.hpValue != null && live.hpValue !== s.bodyHp;
    return `
      <section class="panel body" style="--tone:var(--gold)">
        <h3>Main body ${s.actorName ? "" : "<small>link an actor to enable token sync</small>"}
          <span class="badges">
            ${level ? `<span class="pill">L${level}</span>` : ""}
            ${ac ? `<span class="pill">AC ${ac}</span>` : ""}
            ${fort ? `<span class="pill">F ${fort}</span>` : ""}
            ${ref ? `<span class="pill">R ${ref}</span>` : ""}
            ${will ? `<span class="pill">W ${will}</span>` : ""}
          </span>
        </h3>
        <div class="defs">${defenses || ""}</div>
        ${this.hpBar(s.bodyHp, s.bodyMaxHp, "big")}
        ${drift ? `<p class="hint drift"><i class="fa-solid fa-triangle-exclamation"></i> Token HP says ${live.hpValue} — click <b>Refresh</b> to pull it, or keep fighting from the console value.</p>` : ""}
      </section>`;
  }

  damageForm() {
    const t = this.t, s = t.s;
    const targetOpts = `<option value="body">Main body</option>` +
      s.parts.map(p => `<option value="${esc(p.id)}" ${p.broken ? "data-broken=\"1\"" : ""}>${esc(p.name || "part")}${p.broken ? " (broken)" : ""}</option>`).join("");
    return `
      <section class="panel dmg" style="--tone:var(--rust)">
        <h3>Damage / healing</h3>
        <p class="hint">A hit on a <b>part</b> lands on both pools — adjust each net value for that location's resistance or weakness. Area effects hit only the main body.</p>
        <div class="dmgrow">
          <label class="cell">Kind
            <select data-f="kind"><option value="damage" selected>Damage</option><option value="heal">Healing</option></select>
          </label>
          <label class="cell">Target
            <select data-f="target">${targetOpts}</select>
          </label>
          <label class="cell">Raw roll
            <input type="number" data-f="raw" placeholder="0" min="0">
          </label>
          <label class="cell">Type
            <input type="text" list="mpb-dmgtypes" data-f="type" placeholder="fire">
            <datalist id="mpb-dmgtypes">${DAMAGE_TYPES.map(x => `<option value="${x}">`).join("")}</datalist>
          </label>
        </div>
        <div class="dmgrow">
          <label class="cell">→ Main body takes
            <input type="number" data-f="toBody" placeholder="0" min="0">
          </label>
          <label class="cell partcell">→ Part takes <em>(part targets only)</em>
            <input type="number" data-f="toPart" placeholder="0" min="0">
          </label>
        </div>
        <div class="btnrow">
          <button type="button" class="primary" data-act="apply"><i class="fa-solid fa-bolt"></i> Apply</button>
          <button type="button" class="ghost" data-act="breakpart"><i class="fa-solid fa-hammer"></i> Break selected part</button>
          <button type="button" class="ghost" data-act="fastheal"><i class="fa-solid fa-heart-pulse"></i> Fast healing 10</button>
        </div>
      </section>`;
  }

  partsLive() {
    const t = this.t, s = t.s;
    if (!s.parts.length) {
      return `<section class="panel empty" style="--tone:var(--muted)">
        <h3>Parts</h3><p class="hint">No parts yet — add one on the <b>Parts</b> tab (a head, wings, claws, a power core…).</p></section>`;
    }
    return `<section class="panel" style="--tone:var(--slate)">
      <h3>Parts</h3>
      ${s.parts.map(p => {
        const pct = p.maxHp > 0 ? clamp((p.hp / p.maxHp) * 100, 0, 100) : 0;
        const tone = p.broken ? "dead" : pct < 25 ? "low" : pct < 50 ? "mid" : "full";
        return `<div class="partrow ${p.broken ? "broken" : ""}">
          <div class="phead">
            <span class="pname">${p.broken ? `<i class="fa-solid fa-hammer"></i>` : ""}${esc(p.name || "part")}</span>
            ${p.broken ? `<span class="pill broken">broken</span>` : ""}
            <span class="php">${p.hp}<i>/ ${p.maxHp}</i></span>
          </div>
          <div class="hbar ${tone}"><div class="hfill" style="width:${pct}%"></div></div>
          ${p.abilities ? `<div class="plines"><span class="plabel">Abilities</span>${esc(p.abilities)}</div>` : ""}
          ${p.brokenEffect ? `<div class="plines brokenfx"><span class="plabel">When broken</span>${esc(p.brokenEffect)}</div>` : ""}
          ${(p.acNote || p.saveNote || p.resistNote || p.weakNote) ? `<div class="plines muted">
            ${p.acNote ? `<span class="plabel">AC</span>${esc(p.acNote)}` : ""}
            ${p.saveNote ? `<span class="plabel">Saves</span>${esc(p.saveNote)}` : ""}
            ${p.resistNote ? `<span class="plabel">Resist</span>${esc(p.resistNote)}` : ""}
            ${p.weakNote ? `<span class="plabel">Weak</span>${esc(p.weakNote)}` : ""}
          </div>` : ""}
          <div class="btnrow">
            <button type="button" class="ghost sm" data-act="editpart" data-k="${esc(p.id)}"><i class="fa-solid fa-pen"></i>Edit</button>
            ${p.broken
              ? `<button type="button" class="ghost sm" data-act="unbreak" data-k="${esc(p.id)}"><i class="fa-solid fa-rotate-left"></i>Unbreak</button>`
              : `<button type="button" class="ghost sm" data-act="break" data-k="${esc(p.id)}"><i class="fa-solid fa-hammer"></i>Break</button>`}
          </div>
        </div>`;
      }).join("")}
    </section>`;
  }

  phasesLive() {
    const t = this.t, s = t.s;
    if (!s.phases.length) {
      return `<section class="panel empty" style="--tone:var(--muted)">
        <h3>Phases</h3><p class="hint">No phases yet — add one on the <b>Phases</b> tab (break a part, fall below a HP threshold, reach a round).</p></section>`;
    }
    return `<section class="panel" style="--tone:var(--plum)">
      <h3>Phases</h3>
      ${s.phases.map(p => {
        const tr = this.triggerLabel(p);
        const state = p.active ? `<span class="pill active">active</span>`
          : p.skipped ? `<span class="pill skipped">skipped</span>`
          : p.armed ? `<span class="pill armed">trigger met</span>`
          : `<span class="pill idle">waiting</span>`;
        return `<div class="phaserow ${p.active ? "active" : p.armed ? "armed" : p.skipped ? "skipped" : ""}">
          <div class="phead">
            <span class="pname">${p.backpocket ? `<i class="fa-solid fa-jedi" title="back-pocket phase"></i>` : ""}${esc(p.name)}</span>
            ${state}
          </div>
          <div class="plines muted"><span class="plabel">Trigger</span>${esc(tr)}</div>
          ${p.effects ? `<div class="plines">${esc(p.effects)}</div>` : ""}
          <div class="btnrow">
            ${p.active
              ? `<button type="button" class="ghost sm" data-act="resetphase" data-k="${esc(p.id)}"><i class="fa-solid fa-rotate-left"></i>Deactivate</button>`
              : p.skipped
                ? `<button type="button" class="ghost sm" data-act="resetphase" data-k="${esc(p.id)}">Undo skip</button>`
                : `<button type="button" class="primary sm" data-act="beginphase" data-k="${esc(p.id)}" ${!p.armed && p.triggerType !== "manual" ? "disabled" : ""}><i class="fa-solid fa-play"></i>Begin</button>
                   <button type="button" class="ghost sm" data-act="skipphase" data-k="${esc(p.id)}">Skip</button>`}
            <button type="button" class="ghost sm" data-act="editphase" data-k="${esc(p.id)}"><i class="fa-solid fa-pen"></i>Edit</button>
          </div>
        </div>`;
      }).join("")}
    </section>`;
  }

  triggerLabel(p) {
    if (p.triggerType === "part-broken") {
      const part = this.t.part(p.triggerPartId);
      return `When the ${part ? esc(part.name) : "(deleted part)"} is broken`;
    }
    if (p.triggerType === "hp-below") return `When main body falls below ${p.triggerHp} HP`;
    if (p.triggerType === "round") return `At the start of round ${p.triggerRound}`;
    return "Manual — begin it whenever you like";
  }

  logPanel() {
    const t = this.t, s = t.s;
    if (!s.log.length) return "";
    const ts = (n) => new Date(n).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `<section class="panel log" style="--tone:var(--muted)">
      <details open>
        <summary>Log <small>${s.log.length} entries</small></summary>
        <div class="loglist">${s.log.slice(0, 20).map(e =>
          `<div class="logrow"><span class="ltime">${ts(e.t)}</span><span>${esc(e.text)}</span></div>`).join("")}</div>
      </details>
    </section>`;
  }

  /* -------------------------------------------------------- parts tab ----- */
  partsTab() {
    const t = this.t, s = t.s;
    return `
      <section class="panel" style="--tone:var(--slate)">
        <h3>Parts <small>each part has its own HP pool and the abilities it powers</small>
          <button type="button" class="say" data-act="addpart" title="Add a part"><i class="fa-solid fa-plus"></i></button>
        </h3>
        ${s.parts.length ? s.parts.map(p => s.editPart === p.id ? this.partEditor(p) : this.partSummary(p)).join("") : `<p class="hint">No parts yet. Add one — the video suggests 25–50% of main-body HP per part, and to only bother with the narratively interesting ones.</p>`}
      </section>`;
  }

  partSummary(p) {
    return `<div class="partrow">
      <div class="phead"><span class="pname">${esc(p.name)}</span><span class="php">${p.hp}<i>/ ${p.maxHp}</i></span>
        ${p.broken ? `<span class="pill broken">broken</span>` : ""}</div>
      ${p.abilities ? `<div class="plines"><span class="plabel">Abilities</span>${esc(p.abilities)}</div>` : ""}
      <div class="btnrow">
        <button type="button" class="ghost sm" data-act="editpart" data-k="${esc(p.id)}"><i class="fa-solid fa-pen"></i>Edit</button>
        <button type="button" class="ghost sm danger" data-act="delpart" data-k="${esc(p.id)}">Remove</button>
      </div>
    </div>`;
  }

  partEditor(p) {
    const f = (name, val, extra = "") => `value="${esc(val ?? "")}" ${extra}`;
    return `<div class="editor">
      <label class="frow"><span>Name</span><input type="text" data-f="name" ${f("name", p.name)}></label>
      <label class="frow"><span>Max HP</span><input type="number" data-f="maxHp" min="0" ${f("maxHp", p.maxHp)}>
        <em class="hint">≈ 25–50% of the main body is a good start</em></label>
      <label class="frow"><span>Abilities</span><input type="text" data-f="abilities" ${f("abilities", p.abilities)} placeholder="breath weapon, frightful presence, arcane spells"></label>
      <label class="frow"><span>When broken</span><input type="text" data-f="brokenEffect" ${f("brokenEffect", p.brokenEffect)} placeholder="loses its breath weapon; falls if flying"></label>
      <label class="frow"><span>AC / saves</span><input type="text" data-f="acNote" ${f("acNote", p.acNote)} placeholder="AC +2, Reflex +4 (a smaller target)"></label>
      <label class="frow"><span>Resistance</span><input type="text" data-f="resistNote" ${f("resistNote", p.resistNote)} placeholder="physical 5"></label>
      <label class="frow"><span>Weakness</span><input type="text" data-f="weakNote" ${f("weakNote", p.weakNote)} placeholder="cold 5"></label>
      <div class="btnrow">
        <button type="button" class="primary sm" data-act="savepart" data-k="${esc(p.id)}">Save part</button>
        <button type="button" class="ghost sm" data-act="cancelpart">Cancel</button>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------- phases tab ----- */
  phasesTab() {
    const t = this.t, s = t.s;
    return `
      <section class="panel" style="--tone:var(--plum)">
        <h3>Phases <small>a phase changes the fight when its trigger fires</small>
          <button type="button" class="say" data-act="addphase" title="Add a phase"><i class="fa-solid fa-plus"></i></button>
        </h3>
        ${s.phases.length ? s.phases.map(p => s.editPhase === p.id ? this.phaseEditor(p) : this.phaseSummary(p)).join("") : `<p class="hint">No phases yet. A phase can replace lost abilities, change stats or tactics, or just ramp the drama — and a back-pocket phase can be held back if the fight is already hard enough.</p>`}
      </section>`;
  }

  phaseSummary(p) {
    const state = p.active ? `<span class="pill active">active</span>`
      : p.skipped ? `<span class="pill skipped">skipped</span>`
      : p.armed ? `<span class="pill armed">trigger met</span>`
      : `<span class="pill idle">waiting</span>`;
    return `<div class="phaserow">
      <div class="phead"><span class="pname">${p.backpocket ? `<i class="fa-solid fa-jedi" title="back-pocket phase"></i>` : ""}${esc(p.name)}</span>${state}</div>
      <div class="plines muted"><span class="plabel">Trigger</span>${esc(this.triggerLabel(p))}</div>
      ${p.effects ? `<div class="plines">${esc(p.effects)}</div>` : ""}
      <div class="btnrow">
        <button type="button" class="ghost sm" data-act="editphase" data-k="${esc(p.id)}"><i class="fa-solid fa-pen"></i>Edit</button>
        <button type="button" class="ghost sm danger" data-act="delphase" data-k="${esc(p.id)}">Remove</button>
      </div>
    </div>`;
  }

  phaseEditor(p) {
    const t = this.t;
    const partOpts = `<option value="">— no part —</option>` + t.s.parts.map(x =>
      `<option value="${esc(x.id)}" ${x.id === p.triggerPartId ? "selected" : ""}>${esc(x.name)}</option>`).join("");
    const showPart = p.triggerType === "part-broken";
    const showHp = p.triggerType === "hp-below";
    const showRound = p.triggerType === "round";
    return `<div class="editor">
      <label class="frow"><span>Name</span><input type="text" data-f="name" value="${esc(p.name ?? "")}"></label>
      <label class="frow"><span>Trigger</span>
        <select data-f="triggerType" class="triggersel">
          <option value="manual" ${p.triggerType === "manual" ? "selected" : ""}>Manual — begin whenever</option>
          <option value="part-broken" ${p.triggerType === "part-broken" ? "selected" : ""}>When a part is broken</option>
          <option value="hp-below" ${p.triggerType === "hp-below" ? "selected" : ""}>Main body falls below N HP</option>
          <option value="round" ${p.triggerType === "round" ? "selected" : ""}>At the start of round N</option>
        </select>
      </label>
      ${showPart ? `<label class="frow"><span>Part</span><select data-f="triggerPartId">${partOpts}</select></label>` : `<input type="hidden" data-f="triggerPartId" value="${esc(p.triggerPartId ?? "")}">`}
      ${showHp ? `<label class="frow"><span>HP threshold</span><input type="number" data-f="triggerHp" min="0" value="${esc(p.triggerHp ?? 0)}"><em class="hint">fires when the body drops below this</em></label>` : `<input type="hidden" data-f="triggerHp" value="${esc(p.triggerHp ?? 0)}">`}
      ${showRound ? `<label class="frow"><span>Round</span><input type="number" data-f="triggerRound" min="0" value="${esc(p.triggerRound ?? 0)}"></label>` : `<input type="hidden" data-f="triggerRound" value="${esc(p.triggerRound ?? 0)}">`}
      <label class="frow"><span>Effects</span><textarea data-f="effects" rows="3" placeholder="loses its breath weapon; gains a steam vent; +2 status to claw and tail Strikes">${esc(p.effects ?? "")}</textarea></label>
      <label class="frow check"><span></span><label class="checklbl"><input type="checkbox" data-f="backpocket" ${p.backpocket ? "checked" : ""}> Back-pocket phase — hold it back if the fight is already hard enough</label></label>
      <div class="btnrow">
        <button type="button" class="primary sm" data-act="savephase" data-k="${esc(p.id)}">Save phase</button>
        <button type="button" class="ghost sm" data-act="cancelphase">Cancel</button>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ wiring ----- */
  wire(root) {
    if (!root || root.dataset?.mpbWired === "1") return;
    if (root.dataset) root.dataset.mpbWired = "1";
    const t = this.t;

    /* Keep the two net-damage fields in step with the raw roll until the GM
       overrides one by hand. */
    const raw = root.querySelector('[data-f="raw"]');
    const toBody = root.querySelector('[data-f="toBody"]');
    const toPart = root.querySelector('[data-f="toPart"]');
    raw?.addEventListener("input", () => {
      if (toBody && !toBody.dataset.touched) toBody.value = raw.value;
      if (toPart && !toPart.dataset.touched) toPart.value = raw.value;
    });
    toBody?.addEventListener("input", () => { toBody.dataset.touched = "1"; });
    toPart?.addEventListener("input", () => { toPart.dataset.touched = "1"; });

    root.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button[data-act]");
      if (!btn) return;
      ev.preventDefault();
      const d = btn.dataset, a = d.act;
      if (a === "tab") t.s.tab = d.k, t.touch();
      else if (a === "linkselect") t.linkFromSelect(root.querySelector('[data-f="actorPick"]')?.value);
      else if (a === "linktoken") t.linkFromToken();
      else if (a === "refresh") t.refreshFromActor();
      else if (a === "round") t.setRound(Number(d.k));
      else if (a === "reset") t.resetFight();
      else if (a === "clear") t.clearAll();
      else if (a === "fastheal") t.fastHeal(d.k ? Number(d.k) : 10);
      else if (a === "apply") this.applyForm(root);
      else if (a === "breakpart") this.breakSelected(root);
      else if (a === "break") t.breakPart(d.k);
      else if (a === "unbreak") t.unbreakPart(d.k);
      else if (a === "editpart") t.editPart(d.k);
      else if (a === "delpart") t.removePart(d.k);
      else if (a === "savepart") this.savePartForm(root, d.k);
      else if (a === "cancelpart") t.cancelEditPart();
      else if (a === "addpart") t.addPart();
      else if (a === "editphase") t.editPhase(d.k);
      else if (a === "delphase") t.removePhase(d.k);
      else if (a === "savephase") this.savePhaseForm(root, d.k);
      else if (a === "cancelphase") t.cancelEditPhase();
      else if (a === "addphase") t.addPhase();
      else if (a === "beginphase") t.beginPhase(d.k);
      else if (a === "skipphase") t.skipPhase(d.k);
      else if (a === "resetphase") t.resetPhase(d.k);
    });

    /* The sync checkbox flips via its own change event. */
    root.querySelector('input[data-act="sync"]')?.addEventListener("change", (ev) => {
      t.setSyncToken(ev.target.checked);
    });

    /* The phase editor's trigger select re-renders to swap the field shown. */
    root.querySelector('select[data-f="triggerType"]')?.addEventListener("change", (ev) => {
      const ph = t.s.phases.find(x => x.id === t.s.editPhase);
      if (ph) { ph.triggerType = ev.target.value; t.touch(); }
    });
  }

  readForm(root, names) {
    const out = {};
    for (const n of names) {
      const el = root.querySelector(`[data-f="${n}"]`);
      out[n] = el ? el.value : "";
    }
    return out;
  }

  applyForm(root) {
    const f = this.readForm(root, ["kind", "target", "raw", "toBody", "toPart", "type"]);
    const target = f.target || "body";
    const toBody = f.toBody !== "" ? num(f.toBody, 0) : num(f.raw, 0);
    const toPart = f.toPart !== "" ? num(f.toPart, 0) : num(f.raw, 0);
    this.t.applyDamage(target, toBody, toPart, f.kind === "heal" ? "heal" : "damage", f.type.trim() || null);
  }

  breakSelected(root) {
    const f = this.readForm(root, ["target"]);
    if (!f.target || f.target === "body") {
      return ui.notifications?.warn?.("Pick a part to break, or use a part card's Break button.");
    }
    this.t.breakPart(f.target);
  }

  savePartForm(root, id) {
    const f = this.readForm(root, ["name", "maxHp", "abilities", "brokenEffect", "acNote", "saveNote", "resistNote", "weakNote"]);
    this.t.savePart(id, f);
  }

  savePhaseForm(root, id) {
    const f = this.readForm(root, ["name", "triggerType", "triggerPartId", "triggerHp", "triggerRound", "effects"]);
    const bp = root.querySelector('[data-f="backpocket"]');
    f.backpocket = bp ? bp.checked : false;
    this.t.savePhase(id, f);
  }

  /* ------------------------------------------------------------- styles --- */
  styles() {
    const p = PALETTES[THEME] ?? PALETTES.dark;
    return `<style>
      #mpb-window .window-content { background:${p.paper}; color:${p.ink}; padding:8px;
        overflow-y:auto; max-height:calc(100vh - 140px); }
      #mpb-window .window-content > * { background:transparent; }
      .mpb { --ink:${p.ink}; --paper:${p.paper}; --card:${p.card}; --line:${p.line};
        --gold:${p.gold}; --moss:${p.moss}; --rust:${p.rust}; --slate:${p.slate};
        --plum:${p.plum}; --ember:${p.ember}; --muted:${p.muted}; --stripe:${p.stripe};
        --hover:${p.hover}; --field:${p.field};
        font-family:"Signika","Roboto",sans-serif; color:var(--ink); background:var(--paper); }
      .mpb * { box-sizing:border-box; }
      .mpb button { font-family:inherit; cursor:pointer; color:var(--ink); background:transparent;
        border:1px solid var(--line); border-radius:3px; line-height:1.25;
        display:inline-flex; align-items:center; justify-content:center; gap:.3rem;
        height:auto; min-height:0; }
      .mpb button:hover:not(:disabled) { background:var(--hover); }
      .mpb button:disabled { opacity:.4; cursor:not-allowed; }
      .mpb h1,.mpb h2,.mpb h3,.mpb h4,.mpb legend,.mpb summary { color:var(--ink); }
      .mpb h3 { font-size:.95rem; margin:0 0 .55rem; letter-spacing:.05em; text-transform:uppercase;
        display:flex; align-items:center; gap:.5rem; border-bottom:1px solid var(--line);
        padding-bottom:.3rem; flex-wrap:wrap; }
      .mpb h3 small { font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); font-size:.72rem; }
      .mpb .panel { border:1px solid var(--line); border-radius:4px; padding:.6rem; margin-bottom:.6rem; background:var(--card); }
      .mpb .panel[style*="--tone"] { border-left:3px solid var(--tone); }
      .mpb .panel[style*="--tone"] h3 { border-bottom-color:var(--tone); }
      .mpb .hint { font-size:.74rem; color:var(--muted); line-height:1.4; margin:.3rem 0 0; }
      .mpb .hint b { color:var(--ink); }
      .mpb .muted { color:var(--muted); }
      .mpb .btnrow { display:flex; gap:.35rem; flex-wrap:wrap; align-items:center; margin:.4rem 0 .1rem; }
      .mpb .primary { background:var(--gold); border-color:var(--gold); color:var(--paper); font-weight:700; padding:.35rem .8rem; font-size:.8rem; }
      .mpb .primary.sm { padding:.25rem .6rem; font-size:.74rem; }
      .mpb .primary:hover:not(:disabled) { filter:brightness(1.12); background:var(--gold); }
      .mpb .ghost { padding:.3rem .7rem; font-size:.76rem; color:var(--muted); }
      .mpb .ghost.sm { padding:.22rem .5rem; font-size:.7rem; }
      .mpb .ghost.danger { color:var(--rust); }
      .mpb .say { margin-left:auto; width:24px; height:22px; padding:0; font-size:.7rem; color:var(--muted); flex:none; }
      .mpb .qbtn { width:22px; height:20px; padding:0; font-size:.8rem; }
      .mpb .pill { display:inline-flex; align-items:center; gap:.3rem; font-size:.62rem; text-transform:uppercase;
        letter-spacing:.05em; color:var(--muted); border:1px solid var(--line); border-radius:10px; padding:2px 7px; white-space:nowrap; }
      .mpb .pill.broken,.mpb .pill.armed { color:var(--ember); border-color:var(--ember); font-weight:700; }
      .mpb .pill.active { color:var(--moss); border-color:var(--moss); font-weight:700; }
      .mpb .pill.skipped,.mpb .pill.idle { color:var(--muted); }

      .mpb .tabs { display:flex; gap:.3rem; margin-bottom:.6rem; flex-wrap:wrap; }
      .mpb .tab { padding:.4rem .85rem; font-size:.8rem; }
      .mpb .tab.on { background:var(--gold); border-color:var(--gold); color:var(--paper); font-weight:700; }

      .mpb .topbar { display:flex; justify-content:space-between; gap:.8rem; border:1px solid var(--line);
        border-radius:4px; background:var(--card); padding:.5rem .6rem; margin-bottom:.5rem; flex-wrap:wrap; }
      .mpb .ident { display:flex; flex-direction:column; gap:.3rem; min-width:0; }
      .mpb .name { font-size:1.15rem; font-weight:700; color:var(--gold); line-height:1.1; }
      .mpb .linkrow { display:flex; gap:.35rem; align-items:center; flex-wrap:wrap; }
      .mpb .actorpick { background:var(--field); color:var(--ink); border:1px solid var(--line);
        border-radius:3px; font-size:.72rem; padding:2px 4px; max-width:230px; }
      .mpb .controls { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
      .mpb .sync { display:flex; align-items:center; gap:.3rem; font-size:.7rem; color:var(--muted); }
      .mpb .round { display:flex; align-items:center; gap:.3rem; }
      .mpb .rnum { font-size:.78rem; font-weight:600; color:var(--ember); border:1px solid var(--line); border-radius:10px; padding:2px 8px; }

      .mpb .badges { margin-left:auto; display:flex; gap:.35rem; flex-wrap:wrap; }
      .mpb .defs { font-size:.74rem; color:var(--muted); margin:.1rem 0 .4rem; display:flex; gap:.4rem; flex-wrap:wrap; }
      .mpb .dtag { border:1px solid var(--line); border-radius:3px; padding:0 5px; font-size:.68rem; }

      .mpb .hpwrap { display:flex; flex-direction:column; gap:.15rem; }
      .mpb .hpwrap.big { margin:.1rem 0 .4rem; }
      .mpb .hpline { display:flex; align-items:baseline; gap:.3rem; }
      .mpb .hpnum { font-size:1.05rem; font-weight:700; color:var(--gold); line-height:1; }
      .mpb .hpden { font-size:.74rem; color:var(--muted); }
      .mpb .hbar { height:12px; border-radius:6px; background:var(--stripe); border:1px solid var(--line); overflow:hidden; }
      .mpb .hbar.big { height:16px; }
      .mpb .hbar .hfill { height:100%; transition:width .18s; }
      .mpb .hbar.full .hfill { background:var(--moss); }
      .mpb .hbar.mid .hfill { background:var(--ember); }
      .mpb .hbar.low .hfill { background:var(--rust); }
      .mpb .hbar.dead .hfill { background:var(--muted); }

      .mpb .dmgrow { display:flex; gap:.5rem; flex-wrap:wrap; margin:.2rem 0; }
      .mpb .cell { display:flex; flex-direction:column; gap:.15rem; font-size:.68rem; text-transform:uppercase;
        letter-spacing:.05em; color:var(--muted); flex:1; min-width:90px; }
      .mpb .cell.partcell { flex:1.4; }
      .mpb .cell em { text-transform:none; letter-spacing:0; font-size:.62rem; }
      .mpb .cell input,.mpb .cell select,.mpb .frow input,.mpb .frow select,.mpb .frow textarea {
        background:var(--field); color:var(--ink); border:1px solid var(--line); border-radius:3px;
        font-size:.78rem; padding:3px 5px; font-family:inherit; }
      .mpb .cell input:focus,.mpb .frow input:focus,.mpb .frow textarea:focus { outline:1px solid var(--gold); }

      .mpb .partrow,.mpb .phaserow { border:1px solid var(--line); border-radius:4px; padding:.5rem .55rem; margin-bottom:.45rem; background:var(--stripe); }
      .mpb .partrow.broken { border-left:3px solid var(--ember); opacity:.92; }
      .mpb .phaserow.active { border-left:3px solid var(--moss); }
      .mpb .phaserow.armed { border-left:3px solid var(--ember); }
      .mpb .phaserow.skipped { opacity:.6; }
      .mpb .phead { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; margin-bottom:.2rem; }
      .mpb .pname { font-weight:700; font-size:.88rem; display:inline-flex; gap:.35rem; align-items:center; }
      .mpb .php { margin-left:auto; font-size:.86rem; font-weight:700; color:var(--gold); }
      .mpb .php i { font-style:normal; font-size:.7rem; color:var(--muted); font-weight:400; }
      .mpb .plines { font-size:.76rem; line-height:1.45; margin:.15rem 0; color:var(--ink); }
      .mpb .plines.muted { color:var(--muted); }
      .mpb .plines.brokenfx { color:var(--ember); }
      .mpb .plabel { display:inline-block; font-size:.6rem; text-transform:uppercase; letter-spacing:.06em;
        color:var(--muted); margin-right:.4rem; min-width:3.4rem; }

      .mpb .editor { border:1px dashed var(--gold); border-radius:4px; padding:.6rem; margin-bottom:.5rem; background:var(--field); }
      .mpb .frow { display:grid; grid-template-columns:6rem 1fr; gap:.5rem; align-items:center; margin:.3rem 0;
        font-size:.72rem; color:var(--muted); }
      .mpb .frow span { text-transform:uppercase; letter-spacing:.05em; font-size:.64rem; }
      .mpb .frow .hint { margin:0; grid-column:2; font-size:.64rem; }
      .mpb .frow.check { grid-template-columns:6rem 1fr; }
      .mpb .checklbl { display:flex; align-items:center; gap:.4rem; color:var(--ink); font-size:.72rem; }
      .mpb .triggersel { grid-column:2; }

      .mpb .log details { font-size:.78rem; }
      .mpb .log summary { cursor:pointer; font-size:.74rem; text-transform:uppercase; letter-spacing:.05em; color:var(--muted); }
      .mpb .log summary small { text-transform:none; letter-spacing:0; font-size:.68rem; }
      .mpb .loglist { margin-top:.35rem; max-height:180px; overflow-y:auto; }
      .mpb .logrow { display:grid; grid-template-columns:3.6rem 1fr; gap:.5rem; padding:.18rem 0;
        border-top:1px solid var(--stripe); font-size:.74rem; line-height:1.4; }
      .mpb .ltime { color:var(--muted); font-size:.68rem; }

      .mpb .drift { color:var(--ember); }

      @media (max-width:620px) {
        .mpb .topbar { flex-direction:column; }
        .mpb .badges { margin-left:0; }
        .mpb .frow { grid-template-columns:1fr; }
        .mpb .frow .hint { grid-column:1; }
      }
    </style>`;
  }
}

if (AppV2) {
  MPBApp.prototype._replaceHTML = function (result, content) {
    content.innerHTML = result;
    this.wire(content);
    return content;
  };
}

/* -------------------------------------------------------------------- boot */
(async () => {
  registerSetting();
  let saved = game.settings.get(MP_NS, MP_KEY);
  let state = (saved && saved.v)
    ? foundry.utils.mergeObject(blankState(), saved, { inplace: false })
    : blankState();
  const boss = new MultipartBoss(state);
  const app = new MPBApp(boss);

  /* Re-arm any trigger whose condition is already met (e.g. a part broken in a
     previous session), without re-posting chat for it. */
  boss.scanPhases(false);

  if (!globalThis.__mpbHook) {
    globalThis.__mpbHook = true;
    Hooks.on("updateSetting", (setting) => {
      if (setting?.key === MP_KEY) { try { app.render(); } catch {} }
    });
  }
  app.render(true);
})();
