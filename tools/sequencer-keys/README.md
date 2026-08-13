# Sequencer key lookup

Lists the exact keys a JB2A or PSFX install actually has, so a macro's effect
cues can be written against keys that exist.

```bash
node keys.mjs ~/Documents/modules jb2a breath poison cone
node keys.mjs ~/Documents/modules psfx impact
node keys.mjs ~/Documents/modules both fire
```

The first argument is your Foundry `modules` directory. The second picks a library —
`jb2a`, `psfx`, or `both`. Everything after is a filter: a key has to contain every term
to be listed. With no filter it prints the lot, which for a full JB2A install is over
ten thousand lines.

No install step and no dependencies — it reads the modules you already have.

## Why

A Sequencer cue built on a key that doesn't exist doesn't throw. It plays nothing, and
the macro looks like it worked. That failure is invisible in the preview harness too,
because the harness's Sequencer stand-in reports every `jb2a.` or `psfx.` key as
installed on purpose — it is testing the macro's wiring, not the library.

So the keys in a macro's `FX` block are checked against a real install before they go in,
and re-checked when a module updates.

## How it works

Both libraries export their database object *and* a builder function. The object starts
empty; Foundry calls the builder at startup to fill it in. Importing the script and
reading the object straight away gives you `{}` — the builder has to be called first,
which is what this does before flattening the nested object down to dotted keys.

`_metadata`, `_template`, and `_templates` entries are dropped: they are the module's own
bookkeeping, not playable keys.

## Which macros use this

Every cue in [`nova-rush-console.js`](../../macros/battle-for-nova-rush/nova-rush-console.js)
and [`menace-under-otari-console.js`](../../macros/beginner-box/menace-under-otari-console.js)
was verified this way. Both give each cue a list of keys rather than one, so the first key
the world actually has is the one that plays, and both report an unresolved cue in the
button's tooltip instead of failing silently.
