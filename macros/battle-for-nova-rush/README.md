# Battle for Nova Rush — Foundry VTT Macro

A GM console for Paizo's free Starfinder Second Edition adventure *Battle for Nova Rush*
(Free RPG Day 2025) — four 1st-level characters, one hijacked starship, one very short fuse.

Built for the **sf2e** system on Foundry **v11–v13**.

| Macro | Covers | Status |
|---|---|---|
| [`nova-rush-console.js`](nova-rush-console.js) | The whole adventure, A1 through the escape | Complete |

## Install

1. In Foundry, open the **Macro Directory** and create a new macro.
2. Set **Type** to `Script`.
3. Paste the entire contents of the `.js` file.
4. Save, then execute.

State lives in a hidden world setting, so re-pasting an updated version doesn't wipe a
session in progress.

![The upper deck, with the sinkwell part way through being disabled](../../screenshots/battle-for-nova-rush/nova-rush-console.png)

## What it does

The adventure hangs everything on four switches — the reactor, the missile launcher, and
whether Brinn and Polly were won over — and then cashes them all in at the very end. The
console keeps those four lit across the top and does the arithmetic for you.

- **A1 Brig** — the three escape routes side by side, with their modifiers as toggles: the
  −2 for complimenting Brinn or insulting Firestorm, the −2 for a distraction, and the note
  that threats can't be talked down. Recording *how* they got out matters, because a party
  that never escaped on its own doesn't find the smuggling compartment.
- **Lower deck** — A2's ambush and its Corpse Fleet Recall Knowledge with all three degrees,
  Captain Concierge's full Q&A and briefing, then A3–A8 with their treasure.
- **Upper deck** — Polly, and the Spiritual Sinkwell with a three-success disable counter
  and both disable DCs. Fleeing it kills Polly; disabling it recruits her.
- **B5 Bridge** — the fight, plus a **battle damage roller**: one button rolls 1d4, advances
  the round counter, and posts the effect to chat with its save already an inline check.
- **Escape** — the conclusion, in either of two versions (switch at the top of the tab):
  - **As printed** — one DC 15 check each, calculated. It applies the reactor's −1, the
    ally's +1, and the launcher's second gunner slot, warns if nobody took Piloting or there
    are more gunners than slots, and calls the result against the half-the-party threshold.
  - **Cinematic starship scene** — the same escape run under the SF2e framework, below.
- **Effects** — the optional Sequencer / JB2A cue list, with a Test button per cue.

![The bridge, with the battle damage roller](../../screenshots/battle-for-nova-rush/nova-rush-bridge.png)

![The conclusion, with the crew assigned](../../screenshots/battle-for-nova-rush/nova-rush-escape.png)

## The cinematic escape

The adventure ends the escape with a single check per PC. The console can instead run it as a
**Cinematic Starship Scene** — the SF2e GM Core framework of roles that reset each round, PCs
switching between them, and a Victory Point victory condition.

That framework deliberately leaves the scene itself to the GM, so this is one build of it,
pitched at the adventure's own DC 15: six roles with an action each, **10 Victory Points** to
break away, a **6-point hull** clock, and **5 rounds** before the raiders close. Every modifier
the book grants still counts — the reactor lowers the DCs, an ally gives the circumstance
bonus, the missile launcher opens the second gunner seat, and Polly swallows the surge that
would otherwise cost hull on an engineer's critical failure.

At the end of each round the raiders fire for 1 hull, unless someone critically succeeded
that round. Reaching the goal is the adventure's clean getaway; running out of hull or rounds
is its "severely damaged" ending. Nothing here can destroy the ship.

Totals are replayed from the recorded rounds rather than accumulated, so un-ticking any
result rewinds the tracks exactly.

![The cinematic escape, two rounds in](../../screenshots/battle-for-nova-rush/nova-rush-scene.png)

## Effects — Sequencer and JB2A

Both modules are **optional**. Without them every button still works and the console simply
says the effect didn't play.

With them, eight cues are available: the Corpse Fleet's first hit in the brig, the reactor's
shock, the sinkwell's wave, each of the four battle-damage results on the bridge (these fire
automatically as you roll), and the breakaway at the end of the cinematic escape.

JB2A's free and Patreon libraries carry different files, so each cue lists several Sequencer
database keys and uses the first one your world actually has. The **Effects** tab shows which
key resolved for each cue — or flags the ones that found nothing — and gives you a Test
button. To substitute your own, open Sequencer's Database Viewer, find a file, and put its
key at the top of that cue's list in the `FX` block near the top of the macro.

![The effects tab](../../screenshots/battle-for-nova-rush/nova-rush-fx.png)

## Statblocks

None are reproduced here. The creature buttons open the actors the sf2e system already
ships:

| Creature | Compendium |
|---|---|
| Captain Phaedra Firestorm | `sf2e.standalone-adventure-bestiary` |
| Nova Pirate | `sf2e.standalone-adventure-bestiary` |
| Spiritual Sinkwell | `sf2e.standalone-adventure-bestiary` |

If a UUID doesn't resolve, the button says so rather than failing silently — check that the
system's bestiary pack is enabled in your world.

## Theming

Near the top of the file:

```js
const THEME = "console";  // or "daylight"
```

`console` is the dark starship palette shown above; `daylight` is a light variant for anyone
running Foundry's light theme.

## Licence

Code is MIT — see [LICENSE](../../LICENSE).

Adventure content — read-aloud text, DCs, NPC names, and rewards — is derived from Paizo's
*Battle for Nova Rush* and remains Paizo's intellectual property. This macro is unofficial,
is not endorsed by Paizo, and is intended as an aid for GMs running the adventure, which
Paizo distributes for free.
