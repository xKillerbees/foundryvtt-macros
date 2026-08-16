# Preview harness

Renders a macro's window outside Foundry so the README screenshots can be regenerated from
the code instead of re-captured by hand every time the UI changes.

```bash
python3 tools/preview/capture.py            # every screenshot
python3 tools/preview/capture.py downtime   # one, by name
```

Output lands in `screenshots/`. The only requirement is Chrome or Chromium — on `PATH`, or
installed as the `com.google.Chrome` Flatpak.

## How it works

`foundry-stub.js` implements the slice of the Foundry API these macros actually touch —
`foundry.utils`, `game.settings`, `game.actors`, `game.users`, `game.socket`, `ChatMessage`,
`Hooks`, `ui.notifications`, and an `ApplicationV2` that builds the same window /
`.window-content` DOM shape the real one does. `index.html` loads a stub, then a macro, and the macro boots and renders as it would in
Foundry. `capture.py` serves the repo, loads each page in headless Chrome, and screenshots it.

Because every console clamps its scroll area to `calc(100vh - 140px)`, the capture runs twice:
once with the clamp lifted so the page can report how tall it wants to be, then again at that
size so the window fills the shot without being cut off mid-panel.

## Looking at one by hand

Serve the repository root and open the harness with a macro and a fixture:

```bash
python3 -m http.server 8817
```

Then visit
`http://localhost:8817/tools/preview/?macro=season-of-ghosts/fall-downtime-tracker.js&seed=downtime`.
Add `&fit=1` to lift the height clamp. Buttons work, state changes re-render — it's the real
macro, just talking to a fake Foundry. Settings writes and chat messages go to the console.

## Adding a screenshot

1. Add a state to `fixtures.js`, keyed by the world setting id the macro reads. It is merged
   over the macro's own `blankState()`, so only the interesting fields are needed.
2. Add an entry to `SHOTS` in `capture.py`.
3. Run the capture and commit the PNG.

## Testing effect code

Macros that drive Sequencer can be exercised without the real modules. Set `__sequencer: true`
on a fixture and the stub installs a recording stand-in: it reports any `jb2a.` or `psfx.` key
as installed, and every sequence built is pushed to `globalThis.__sequences` as plain data, so
a test can assert what a cue actually constructed. It is off by default, because the "no
Sequencer installed" branch needs testing too.

## Testing a macro the players run

A player's relay goes through `game.user.setFlag`, which the stub models by firing `updateUser`
with the same `changes` shape Foundry sends, so a macro that relays a write to the GM can be
exercised with one browser open. The sample party carries proficiency ranks, Lore items, and
`testUserPermission`, which is enough to drive the player path by hand:
reassign `game.user` to a non-GM who owns one actor, re-evaluate the macro, and the read-only
branches, the ownership checks, and the relay all run for real.

Set `__player: "pc1"` on a fixture to boot the whole preview that way instead — the previewing
user becomes a player who owns only that actor, and a GM stays active so the "no GM logged in"
branch doesn't fire. That's what lets `capture.py` screenshot a player-facing board.

## Testing the player→GM relay in Node

The browser harness can't exercise a two-client relay — one browser is one `game.user`, and its
`settings.set` doesn't broadcast `updateSetting`. The relay (a player's edits reaching the GM's
world-setting write, and the GM's ownership re-check) is the part that bites silently, so it has
its own Node harness that loads a real macro against a stubbed Foundry and drives the relay both
ways:

```bash
node tools/preview/relay-test/test-downtime-planner.js
```

`relay-test/harness.js` is the stubbed Foundry (actors, users, settings, hooks — no DOM), and
`loadMacro(path, { user, expose })` evaluates the macro with named top-level identifiers exposed
on `globalThis.__macro` after its boot IIFE finishes. The test covers the two invariants the relay
depends on: row ids are minted once and carried through the op, and the GM's handler applies to
the live state so back-to-back relays see each other. Add a `test-<macro>.js` beside it for any
new player-facing macro.

## Testing journal links

The stub ships a small journal directory whose ids follow the Season of Ghosts module's own
scheme, so a macro's chapter and area lookups can be exercised. Set `__journals: false` on a
fixture to empty it and preview what a world without the adventure module looks like.

## Limits

This is a preview harness, not an emulator. It knows nothing about actors beyond the four
sample PCs it invents, rolls nothing, and posts nothing. If a macro starts using a part of the
Foundry API the stub doesn't cover, the page will throw — add the stub rather than working
around it.
