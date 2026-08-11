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
  module's own macro directory mapped chapter by chapter
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

### Fixed
- Scoped all CSS under root classes; unscoped selectors were bleeding into PF2e sheets
- Moved persistence from journal flags to world settings to stop update notifications
- Button box model and heading colour corrected for Foundry v13
