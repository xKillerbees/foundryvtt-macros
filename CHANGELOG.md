# Changelog

## Unreleased

### Added
- Menace Under Otari — a console for the Pathfinder Beginner Box adventure: all nineteen
  rooms across both floors, each with its read-aloud text, checks, and the rule the room is
  there to teach
- Menace Under Otari: the XP ledger. Twenty ticked awards worth 1,344 XP, with the three
  conditional rows greyed until the choice that pays them goes the right way, and the
  1,000-XP level-up called out with the module's own Leveling Up handout
- Menace Under Otari: the four choices that reach forward — the barricade the undead did or
  didn't hear, the puzzle that opens Abadar's vault, the lever that turns the spear trap on
  the kobolds, and the two different ways to put the warren on alert (derived from both of
  its causes, so undoing one doesn't undo the other)
- Menace Under Otari: drives the official Beginner Box module rather than duplicating it —
  journal pages, creature and loot actors, playlists as play/stop buttons, scene activation,
  and the module's own four area macros, all by ids read out of its adventure pack
- Menace Under Otari: eight optional Sequencer cues with JB2A keys verified against the
  installed database, each pairing its animation with the adventure's own sound
- Preview stub: `game.macros` and `game.scenes`, Beginner Box journal/playlist/macro/scene
  documents by their real ids, and explicit sound ids on stub playlists
- `tools/sequencer-keys/` — lists the exact keys a JB2A or PSFX install has, so an effect
  cue can be written against a key that exists. A stale key doesn't error, it silently
  plays nothing, and the preview harness can't catch it either. All 34 keys across the
  Nova Rush and Menace Under Otari consoles verified with it
- Mark of the Mantis — a console for the PF2e one-shot, running the whole Infiltration
  subsystem: both legwork phases with their six preparation activities, the five obstacles
  with per-turn tracking, the four complications, Red Mantis Assassination, and all sixteen
  manor areas plus the cellar
- Mark of the Mantis: Infiltration, Awareness, and Edge Points are derived from the degrees
  ticked rather than accumulated, so every Awareness Point names its own cause and unticking
  a result rewinds the board exactly — including Cornered's 4-point cap, the distraction's
  negative point, and the +1 to every obstacle DC at 8 Awareness
- Mark of the Mantis: every check names the PC best suited to it, read live from the PF2e
  actors in the world rather than from a copy of the pregens' sheets
- Mark of the Mantis: the adventure's replay options as a switchboard — the villain, both
  guardians, the traps and their locations, and the route to the cellar — with the legwork
  facts, area cards, and creature buttons all following the switch
- Preview stub: sample actors now carry PF2e-shaped `skills`, `perception`, and `saves`, so
  macros that ask the party who should take a check can be exercised
- Battle for Nova Rush — a console for the free Starfinder 2e adventure, with the escape
  check's modifiers calculated and a per-round battle damage roller for the bridge fight
- Nova Rush: the escape can be run as a Cinematic Starship Scene — six roles, a Victory
  Point goal, and a hull clock — alongside the printed single-check version
- Nova Rush: optional Sequencer effect cues — JB2A animation plus PSFX sound, every key
  verified against the real databases, with a tester and graceful fallbacks
- Campaign Status Tracker — a checklist across all thirteen chapters, with a Threads view
  that flags a prerequisite the moment the table reaches the chapter that needs it, a loot
  ledger of every named treasure, per-chapter scene and cue lists, and the Season of Ghosts
  module's own macro directory and playlists mapped chapter by chapter
- In the Ruins of Wisdom — Chapter 7's Tan Sugi monastery: statue purification with ordered
  events, sixteen areas, and an aftermath ledger feeding the Fall Downtime Tracker
- Repository laid out for more than one collection — macros live under
  `macros/<collection>/`, with generated screenshots in `screenshots/`
- `tools/preview/` — renders a macro against a stubbed Foundry API and captures the
  README screenshots from the code itself
- MIT licence for the code
- Fall Downtime Tracker — twelve-week preparation subsystem, town events, curse research,
  player board, chat and journal summaries
- First Long Night Console — run of show, grand show, three contests, eight booths,
  twelve PC games with medal tracking, GM kit
- Enlightened Path Console — ritual, vision beats, three shrine days, enlightenment tracking
- Campaign tracker: clicking a party member opens their character sheet, and the party panel
  shows the titles and keepsakes each PC won at the First Long Night
- Campaign tracker: the four consoles in this collection are listed against the chapters
  they're for, and Chapter 3 carries the hinterlands wandering-monster procedure
- Campaign tracker: a legend under the chapter list explaining the spider icon and the columns
- Campaign tracker: journal links. 120 of 128 checklist items and 40 of 42 treasure rows open
  the page of the Season of Ghosts module's journal that covers them, mapped from the module's
  own pack; the eight without a link are Two Weavers beats that aren't in the book. Items the
  table doesn't name still link if their label carries an area code. Entries resolve by id,
  then by name, then through the compendiums, and the links hide themselves entirely when the
  adventure isn't in the world
- `tools/module-check/` — re-checks the tracker's journal tables against an installed copy of
  the module, so a module update that moves an id is caught rather than discovered at the table

- The other four consoles carry the same reading system as the campaign tracker — panel titles
  over a rule in their tone, filled bars on the blocks inside them, and a colour and icon per
  tab — plus journal links into the module and clickable PCs
- Journal links in every Season of Ghosts console: the Ruins of Wisdom's sixteen areas and the
  Enlightened Path's encounters resolve from their own area codes, the Fall Downtime Tracker
  links each week's event and each preparation activity, and the First Long Night reaches both
  the module's festival entry and the chapter's week 3 page
- `tools/module-check/` covers all five macros, not just the tracker

- Campaign tracker: every audio name is a play button. It starts and stops the sound in the
  module's own playlist, shows what's currently running, and repaints when playback changes
  anywhere — including from the sidebar

- Nova Rush: the Effects tab is gone — each cue is now a button beside the beat it belongs to,
  reporting its own state, with an FX lamp in the header for whether Sequencer was detected
- Macros ship with no campaign of their own: the tracker starts at Chapter 1 with nothing
  ticked, `ARCS` is empty for you to fill in, and no note names another table's PCs

### Changed
- Every macro tested on Foundry v14; the supported range is now v11–v14, in the collection
  READMEs and in each macro's own header
- Campaign tracker: only **required** items can go overdue. An unticked box in a finished
  chapter is now **skipped** — the party killed the Abacus Sisters rather than saving them,
  and nothing downstream breaks
- Campaign tracker: the `Change Season` cues say which transition they are and which two
  scenes they repaint, instead of naming a playlist that doesn't exist under that name
- Campaign tracker: seven module macros and one audio cue moved off `placed by guess` and
  `act only` onto the chapters the adventure's scene-notes blocks actually link them from
- Campaign tracker: each block inside a chapter card — decisions, treasure, procedures,
  consoles, module macros, audio, cues — is now a tinted well headed by a filled bar in its
  own accent, rather than a dashed rule and a small grey caption. The chapter's own checklist
  gained a head too, which is where its count moved to
- Campaign tracker: the tab strip carries the same colours — an act tab wears its season, and
  the four views are plum with an icon each — and panel titles sit over a rule in their tone,
  so the two levels of heading don't compete

### Fixed
- Scoped all CSS under root classes; unscoped selectors were bleeding into PF2e sheets
- Moved persistence from journal flags to world settings to stop update notifications
- Button box model and heading colour corrected for Foundry v13
