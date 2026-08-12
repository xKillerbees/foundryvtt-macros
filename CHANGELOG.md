# Changelog

## Unreleased

### Added
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
- `tools/journal-check/` — re-checks the tracker's journal tables against an installed copy of
  the module, so a module update that moves an id is caught rather than discovered at the table

### Changed
- Campaign tracker: only **required** items can go overdue. An unticked box in a finished
  chapter is now **skipped** — the party killed the Abacus Sisters rather than saving them,
  and nothing downstream breaks
- Campaign tracker: the `Change Season` cues say which transition they are and which two
  scenes they repaint, instead of naming a playlist that doesn't exist under that name
- Campaign tracker: seven module macros and one audio cue moved off `placed by guess` and
  `act only` onto the chapters the adventure's scene-notes blocks actually link them from
- Campaign tracker: each block inside a chapter card — decisions, treasure, procedures,
  consoles, module macros, audio, cues — is now a tinted well with its own accent colour and
  a labelled head, rather than a dashed rule and a small grey caption. The chapter's own
  checklist gained a head too, which is where its count moved to

### Fixed
- Scoped all CSS under root classes; unscoped selectors were bleeding into PF2e sheets
- Moved persistence from journal flags to world settings to stop update notifications
- Button box model and heading colour corrected for Foundry v13
