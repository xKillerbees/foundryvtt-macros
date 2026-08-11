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
`foundry.utils`, `game.settings`, `game.actors`, `ChatMessage`, `Hooks`, `ui.notifications`,
and an `ApplicationV2` that builds the same window / `.window-content` DOM shape the real one
does. `index.html` loads a stub, then a macro, and the macro boots and renders as it would in
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

## Limits

This is a preview harness, not an emulator. It knows nothing about actors beyond the four
sample PCs it invents, rolls nothing, and posts nothing. If a macro starts using a part of the
Foundry API the stub doesn't cover, the page will throw — add the stub rather than working
around it.
