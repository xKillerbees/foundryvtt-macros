# Pathfinder Beginner Box — Foundry VTT Macro

A GM console for *Menace Under Otari*, the adventure in Paizo's **Pathfinder Beginner Box** —
nineteen rooms under a fishery, a band of kobolds, and the dragon they hatched.

Built for the **pf2e** system on Foundry **v11–v14**.

| Macro | Covers | Status |
|---|---|---|
| [`menace-under-otari-console.js`](menace-under-otari-console.js) | The whole adventure, both floors | Complete |

## Install

1. In Foundry, open the **Macro Directory** and create a new macro.
2. Set **Type** to `Script`.
3. Paste the entire contents of the `.js` file.
4. Save, then execute.

State lives in a hidden world setting, so re-pasting an updated version doesn't wipe a
session in progress.

## It sits on top of the official module

This console assumes the **Pathfinder Beginner Box** module is installed and its *Menace Under
Otari* adventure imported. It doesn't reproduce that content — it drives it. Every id it uses
was read out of the module's own adventure pack rather than transcribed, and an adventure
import preserves those ids, so the buttons resolve in any world that imported it:

- **Journal pages** — each area card opens its own page in the module's journal
- **Creature and loot actors** — the giant rats, the dragon, every loot sheet
- **Playlists** — the adventure's own ambience and soundboard, as play/stop buttons
- **Scenes** — Otari, the Landing, and both dungeon floors
- **The module's four area macros** — the barricades, the cinder rat, the dug tunnel — offered
  beside the room the journal tells you to run them in

Without the module imported the console still opens and still tracks everything; a banner says
what's missing and the buttons explain themselves rather than failing silently.

![Getting started, with the XP ledger part way through floor 1](../../screenshots/beginner-box/menace-under-otari-console.png)

## The XP ledger

The Beginner Box runs on experience points: every hero gets the same award, and 1,000 XP is
2nd level. That single number decides whether the party goes into the last two fights ready or
underpowered, and it is the thing that is easiest to lose track of across sessions.

So the ledger is one ticked box per award — twenty of them, worth 1,344 XP in total. Nothing is
a running tally, so every point traces back to the room that paid it and un-ticking a room takes
it straight off again. The header shows the total, the bar to 1,000, and the level.

Three rows are conditional and stay greyed until the choice on that area's card goes the right
way — the quiet barricade in Area 4, the solved puzzle in Area 9, the armed lever in Area 10.
Two more are bonuses the book only pays in the moment: the surrendering kobold who talks, and
Zolgran fought while the party is still 1st level.

Cross 1,000 and the console says so, offers the module's own **Leveling Up** handout, and plays
the level-up cue.

## The choices that reach forward

Four earlier decisions quietly change a later room, and the console carries them rather than
leaving them in your notes:

| Where | Choice | What it changes |
|---|---|---|
| Area 4 | Barricade taken apart quietly or smashed | Whether the undead in Area 5 are still in their coffins |
| Area 9 | Puzzle solved | Whether Area 10 opens at all |
| Area 10 | Lever set to active | Whether the central spears fire in Area 11 |
| Area 15 / Area 16 | A failed wall check, or smashed fountain mechanisms | Whether the warren in Area 17 is waiting for them |

Each is a pair of buttons on the room that causes it, and the room that inherits it prints the
consequence in place. Area 17's alert state is derived from both of its causes rather than
stored, so undoing one of them still leaves the kobolds ready if the other one happened.

![Floor 2, with the warren already alerted and the party at 2nd level](../../screenshots/beginner-box/menace-under-otari-floor2.png)

## The rooms

All nineteen areas, in order, with the read-aloud text as a chat button, the skill checks, and
the parts of running the room that are easy to forget — the spider's escape DC, the cinder rat's
flat checks, the kobolds' bed cover and oil jars, the dragon's Twisting Tail reaction. Each area
also carries what the Beginner Box is teaching there, since that's the point of this adventure:
initiative in Area 1, degrees of success in Area 2, saving throws in Area 3, flanking in Area 7,
hazards in Area 8, complex hazards in Area 16.

Checks post to chat as rollable PF2e inline checks.

## Audio and effects

Sound comes from the adventure's own playlists rather than a general-purpose library — it was
written for these rooms and it is already in the world. Every cue is a play/stop button that
fills in while it's running and repaints if you start or stop something from the sidebar.

Animation is optional, through **Sequencer** and **JB2A**, and every key ships verified against
the installed database. Eight cues, each on the beat it belongs to: the dead rising, the
spider's Web Strike, the falling ceiling, the fountain's water, the cinder rat igniting,
Zolgran's force barrage, the dragon's poison breath, and reaching 2nd level.

Without Sequencer every cue still plays the module's own sound — only the animation is skipped,
and the button says so in its tooltip.

![The table tab — scenes, ambience, soundboard, and the effect cues](../../screenshots/beginner-box/menace-under-otari-table.png)

## Stat blocks

None are reproduced. Creature and loot buttons open the module's own actors by id, falling back
to a compendium search by name, and say what to import if neither resolves.

## Theming

Near the top of the file:

```js
const THEME = "lantern";  // or "daylight"
```

`lantern` is the torchlight-on-wet-stone palette shown above; `daylight` is a light variant for
anyone running Foundry's light theme.

## Licence

Code is MIT — see [LICENSE](../../LICENSE).

Adventure content — read-aloud text, DCs, NPC names, and rewards — is derived from Paizo's
*Pathfinder Beginner Box* and remains Paizo's intellectual property. This macro is unofficial,
is not endorsed by Paizo, and is intended as an aid for GMs who own the Beginner Box and the
official Foundry module.
