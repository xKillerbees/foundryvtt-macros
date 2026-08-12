# Season of Ghosts — Foundry VTT Macros

GM consoles for running Paizo's *Season of Ghosts* Adventure Path in Foundry VTT.
Each macro is a single self-contained script — no module, no manifest, no install step.

Built for **PF2e** on Foundry **v11–v13**.

| Macro | Covers | Status |
|---|---|---|
| [`fall-downtime-tracker.js`](fall-downtime-tracker.js) | Act 2 Ch. 5 — the twelve-week fall preparation subsystem | Complete |
| [`first-long-night-console.js`](first-long-night-console.js) | Act 2 Ch. 5, week 3 — the First Long Night festival | Complete |
| [`enlightened-path-console.js`](enlightened-path-console.js) | Act 2 Ch. 6 — the Wall of Ghosts and the Pilgrim's Path | Complete |
| [`ruins-of-wisdom-console.js`](ruins-of-wisdom-console.js) | Act 2 Ch. 7 — the ruined Tan Sugi monastery | Complete |
| [`campaign-status-tracker.js`](campaign-status-tracker.js) | All four acts — a checklist for the whole AP | Complete |

## Install

1. In Foundry, open the **Macro Directory** and create a new macro.
2. Set **Type** to `Script`.
3. Paste the entire contents of the `.js` file.
4. Save, then execute.

State is stored in a hidden world setting and persists across reloads. Re-pasting an
updated version of a macro does **not** wipe saved progress.

## The macros

### Fall Downtime Tracker

![The Fall Downtime Tracker on week four](../../screenshots/season-of-ghosts/fall-downtime-tracker.png)

The Hope / Food / Security preparation subsystem, plus teahouse restoration and curse research.

- Four PC cards pulled from the PF2e party actor, with token art, level, ancestry, and class
- Every preparation activity with its skill options and DCs; a d20 button posts the check to chat as a rollable PF2e inline check
- Activity gating enforced automatically — Aid Hunt closes for the week on a success or crit failure, Host Ceremony stays locked until the teahouse is restored and tea ware acquired, Aid Festival Preparations only appears in week 3
- Twelve-week tab strip with the town event for each week, its hook, its checks, and toggleable outcome buttons
- Research Points tracked per source with the book's caps, firing the revelation text at 2 / 4 / 6 / 8 / 10 RP
- Milestone detection at 12 points in any category
- A separate read-only player board (opt-in) that hides point targets, the log, and future events
- Chat summary card and an optional journal-page writeup
- Journal links to the module's own pages — the week's event, the chosen preparation activity,
  the research rules — and a PC's name opens their character sheet

### First Long Night Console

![The grand show tab of the First Long Night Console](../../screenshots/season-of-ghosts/first-long-night-console.png)

The autumn-equinox festival — the toolkit and the PC games companion in one window.

- Five-phase run of show, each postable to chat as read-aloud
- The bard's grand show: through-line selection that rewrites the Turn's check, five movements with degree tracking, the Turn counting double, and a curtain call that rolls the Hope reward
- The three traditional contests with four-check victory-point tracking
- Eight festival booths with toggleable point awards
- Twelve head-to-head PC games across four disciplines, with a medal tracker, discipline sweeps, titles, and the Lantern Crown
- GM kit: six riddles with answers, the lantern cipher key, the poetry scaffold, and the moon-stones rules
- A ledger that pushes earned Hope / Food / Security into the Fall Downtime Tracker's week 3
- Journal links into both the module's *First Long Night* entry and the chapter's week 3 page,
  and a medal row opens that PC's character sheet

![The games tab, with the medal tracker](../../screenshots/season-of-ghosts/first-long-night-games.png)

The tournament deliberately awards nothing that touches the winter ledger — medals,
titles, and one-night favours only.

### Enlightened Path Console

![The Enlightened Path Console on the first day of the pilgrimage](../../screenshots/season-of-ghosts/enlightened-path-console.png)

The ritual, the vision inside the Wall, and the four-day pilgrimage.

- *Open the Wall of Ghosts* ritual with component and outcome tracking
- The four vision beats inside Kugaptee's dream
- Three day tabs, each with weather, travel description, two wilderness encounters, and a shrine
- Enlightenment tracked per shrine against the book's actual conditions; completing one awards XP and activates its save bonus
- Header lamps and Reflex / Will / Fortitude badges showing what the party carries into Chapter 7
- A final-day tab summarising what the party banked and which threads are live
- Journal links on every encounter and shrine, resolved from the encounter's own letter-number

### In the Ruins of Wisdom

![The statue tab of the Ruins of Wisdom console](../../screenshots/season-of-ghosts/ruins-of-wisdom-console.png)

The ruined Tan Sugi monastery, from the arch at the end of the Path to Kugaptee's grave.

- Arrival reads the Enlightened Path's saved state and tells you whether the party earned
  the Pilgrimage Gifts or an unseen disappointment
- The Purify Statue activity with all four degrees, gated per statue — the area has to be
  cleared first, and Pharasma's statue stays locked until her head comes down from the tree
- Purification order is tracked, so the four escalating events fire in the order the party
  earns them, each with Zhi Hui's question budget of 1, 2, 3, then unlimited
- The hidden library, the storm, and the ward over Kugaptee's grave are derived from the
  purified count rather than stored, so undoing a purification undoes everything it opened
- All sixteen areas across four tabs, with read-aloud text, creatures, checks, treasure,
  and per-area beats: the tea ceremony chain, Yuni and her sister's charm, the nindorus'
  circuit challenge, Kalen Bray, the axe and its quirk
- An aftermath ledger for the return to Willowshore that pushes Hope and Reputation into
  the Fall Downtime Tracker
- Journal links on all sixteen areas, resolved from the area's own E-number, plus the
  purification rules, the resting rules, and the act's conclusion

![The libraries and the sugi tree](../../screenshots/season-of-ghosts/ruins-of-wisdom-grove.png)

### Campaign Status Tracker

![The campaign tab, on Act 2 Chapter 5](../../screenshots/season-of-ghosts/campaign-status-tracker.png)

A checklist for all thirteen chapters — the decisions and items that outlive the chapter that
produced them.

- Every chapter with its spine, level, and a status that cycles not started → running → done;
  only one chapter runs at a time, and the current one drives everything else
- ~130 checklist items drawn from the campaign's own prep notes, tagged where they matter:
  **required** when a later chapter can't proceed without them, **consequence** when the
  choice is permanent, **rework** when it belongs to the Two Weavers changes
- A **Threads** tab built from those items: anything with a downstream payoff, sorted by when
  it comes due. Only **required** items go red — everything else the table walked past is
  listed as **skipped**, because most of these are choices rather than obligations. The Abacus
  Sisters don't survive if the party kills them, and nothing downstream breaks; an unticked box
  in a finished chapter is the shape the campaign took, not a warning
- A live rollup strip read from the other four consoles' saved state — pools, week, shrine
  enlightenments, statues purified — so the campaign view doesn't need re-typing
- The party panel reads the **First Long Night** console too: the titles and keepsakes each PC
  won at the games, so *Iron-Gut* and the gourd flask are still on the table's mind in Act 4.
  Clicking a name opens that character's sheet
- A **Treasure** tab holding all 42 named pieces of loot in the campaign, grouped into what's
  on the table in the chapter you're running, what earlier chapters were left holding, what's
  still ahead, and what's been claimed
- Scene and cue checklists per chapter — the Foundry playlists and scene swaps from the
  campaign notes, plus the prep that has to happen before session rather than during it
- **Module macros** per chapter — all 58 macros from the Season of Ghosts Foundry module's
  directory, named exactly as they appear there, with their folder. Reference only: they're
  run from the macro directory, so there's nothing to tick
- **Consoles in this collection** per chapter — the other four macros here, against the
  chapters they're for, so the Enlightened Path console is named where Chapter 6 is on screen
  rather than remembered
- **Journal links** — 120 of the 128 checklist items and 40 of the 42 treasure rows open the
  page of the Season of Ghosts module's own journal that covers them. Xungu opens the Infested
  Grove, the Week 11 curse opens *The Face at the Foot of the Bed*, Yen Rui opens the Hidden
  Library. The eight items with no link are the Two Weavers beats, which aren't in the book.
  A few links deliberately cross chapters, because that's where the text is: Chapter 1's
  kappas open Chapter 2's bathhouse, Chapter 10's Preparation Points cash-out opens Chapter
  8's page on them.

  Every id was read out of the module's pack, not inferred, and
  [`tools/journal-check/`](../../tools/journal-check) re-checks the whole table against an
  installed copy. Items the table doesn't name still link if their label carries an area
  code — that's resolved by page id, since the module builds page ids as
  `<entry ordinal><area code><name slug>`, so `C1` can't be confused with `C11`. Entries
  resolve by id, then by name, then through the compendiums; without the adventure in the
  world the links don't render at all and the journals panel says why
- **Running procedures** — the loops you keep turning for a whole chapter rather than tick
  once. Chapter 3 carries the hinterlands wandering-monster table: the daily DC 17 flat check,
  what's actually out there, the two finite populations, and the book's instruction not to
  scale the table up as the party levels
- **Audio** per chapter — the module's ambience, loops, and SFX matched to the beats that want
  them, plus the looped soundtrack: all 21 numbered tracks placed against the chapter each was
  written for, from *02 The Summer That Never Was* to *22 The Governor's Den*
- A **Before this session** panel on the campaign tab surfacing the current chapter's cues and
  unclaimed treasure without hunting through tabs
- The Two Weavers continuity checklist, the milestone-level table, and per-PC arcs
- A spoiler-free chat recap: act, chapter, level, and the chapters behind them

Two levels of heading, and they don't compete. A panel is titled in large ink over a thick
rule in its own tone; a block inside it wears a small filled bar in its accent — ink for the
chapter's decisions, gold for treasure, moss for a running procedure, plum for this
collection's consoles, ember for module macros, slate for audio, rust for scenes and cues.
The tab strip uses the same colours: an act tab carries its season, and the four views are
plum, told apart by their icon.

Generic beds that appear in every act — Indoors, Woods, Willowshore, the Mist and Fog set, the
River loop — sit on the campaign tab under **Always to hand** rather than repeating against all
thirteen chapters, alongside the Submacros folder and the campaign theme.

Where a macro or audio cue couldn't be pinned to a chapter it's flagged in place — `act only`
for the ones placeable to an act but no further, `placed by guess` for the ones inferred from
the name. Both are one-line edits in the `MODULE_MACROS` and `AUDIO` blocks near the top of
the macro. Three audio cues still carry `placed by guess`; everything else has since been
pinned by the scene-notes blocks in the adventure text.

![Chapter 3 running, with the hinterlands encounter procedure](../../screenshots/season-of-ghosts/campaign-status-hinterlands.png)

![An act tab, with checklist, treasure, module macros, and cues](../../screenshots/season-of-ghosts/campaign-status-act4.png)

![Act 1, with skipped items marked as skipped rather than overdue](../../screenshots/season-of-ghosts/campaign-status-act1.png)

![The Threads tab](../../screenshots/season-of-ghosts/campaign-status-threads.png)

![The loot ledger](../../screenshots/season-of-ghosts/campaign-status-loot.png)

All five consoles share the same reading system: a panel is titled in large ink over a rule
in its own tone, a block inside it wears a small filled bar in its accent, and the tab strip
uses the same colours with an icon each. Where the Season of Ghosts module is installed they
also link into its journals — by document id, so the link survives a rename — and a PC's name
opens their character sheet.

## Architecture

All five share the same shape:

- **Storage** — a hidden world setting (`world.sog*`). Settings don't fire document-update
  notifications, unlike journal flags.
- **Rendering** — one `markup()` method returning an HTML string, re-rendered wholesale on
  every state change. No templates, no partial updates.
- **Compatibility** — extends `ApplicationV2` where available, falls back to `Application`.
  `_replaceHTML` is attached conditionally because v1 and v2 use the same method name with
  incompatible signatures.
- **Styling** — every CSS selector is namespaced under a root class (`.sog`, `.fln`, `.ep`, `.rw`, `.cst`).
  Unscoped generic selectors like `.card` or `.panel` will bleed into PF2e character sheets
  and chat messages.
- **Party detection** — prefers `game.actors.party`, falls back to assigned player characters,
  then to any player-owned character. Actor data is re-read on every open so names, art, and
  levels never go stale.
- **Live sync** — an `updateSetting` hook refreshes open windows for other users.

### Conventions worth keeping

- Point awards toggle. Clicking an outcome applies it; clicking again reverses it exactly.
- Anything player-facing hides point targets and denominators.
- Chat cards carry their own inline styles rather than relying on the window stylesheet.
- DCs written as `DC 17 Farming Lore` in prose are converted to rollable inline checks
  automatically by `linkify()`.

## Theming

Near the top of each file:

```js
const THEME = "parchment";  // or "dark"
```

`parchment` is an autumn paper panel; `dark` sits inside Foundry's dark theme. Both palettes
are defined immediately below the constant.

## Licence

The code is MIT licensed — see [LICENSE](../../LICENSE).

Adventure content — encounter text, DCs, NPC names, and rewards — is derived from Paizo's
*Season of Ghosts* and remains Paizo's intellectual property. This repository is unofficial
and is not endorsed by Paizo. It is intended as a GM aid for people who own the adventure.
