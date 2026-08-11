# Working on this repo

Foundry VTT GM macros. Each file under `macros/<collection>/` is a standalone script macro,
pasted whole into Foundry. There is no build step and no bundler. Collections may target
different systems — Season of Ghosts is PF2e, Battle for Nova Rush is sf2e (a PF2e fork, so
the same inline-check syntax and application classes apply).

```
macros/<collection>/   macros plus a collection README
screenshots/           README images, mirroring the macros/ layout
tools/preview/         renders a macro outside Foundry so screenshots can be regenerated
```

## Before changing anything

Read the Architecture section of the collection's README — for Season of Ghosts,
`macros/season-of-ghosts/README.md`. The conventions there are load-bearing, not stylistic
preferences; several were adopted after fixing real bugs.

## Hard rules

1. **Scope every CSS selector.** Generic selectors like `.card`, `.panel`, `.bar`, `.tag`, or
   `.actions` must be namespaced under the root class (`.sog`, `.fln`, `.ep`). Unscoped rules
   leak into PF2e character sheets and chat messages across the whole world.
2. **Style buttons explicitly.** Foundry v13 applies a fixed button height and tints `h1`–`h4`
   inside application windows. Buttons need `height: auto` and `display: inline-flex`;
   headings need an explicit `color`.
3. **Never store state on documents.** Use `game.settings`, not journal or actor flags —
   document updates fire visible "updated" notifications on every write.
4. **Point awards must be reversible.** Every button that grants points toggles and reverses
   exactly what it granted. Store the granted values if the amount was rolled or conditional.
5. **Player-facing output hides targets.** No `/12`, no `/10 RP`, no progress bars implying a
   goal, no future event names, no log lines. This applies to the player board, chat cards,
   and journal pages.
6. **Don't duplicate statblocks.** Reference the compendium. Encounter level and a name are
   enough.

## Testing

There is no test runner in the repo. Changes are verified by:

- `node --check macros/<collection>/<file>.js` for syntax
- Loading the macro in `tools/preview/` — it renders and reacts against a stubbed Foundry,
  which catches layout and wiring mistakes without a live world
- Pasting into Foundry and exercising the changed path

## Screenshots

`screenshots/` is generated, never hand-edited. After any UI change, regenerate:

```bash
python3 tools/preview/capture.py
```

If a macro starts calling part of the Foundry API that `tools/preview/foundry-stub.js` doesn't
cover, extend the stub rather than special-casing the macro.

## Adventure content

DCs, rewards, and encounter text come from the published adventure. When adding content,
match the book rather than improvising, and note anything invented (for example, the
Research Point award per degree of success is an inference, not printed).
