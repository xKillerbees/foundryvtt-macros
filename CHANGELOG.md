# Changelog

## Unreleased

### Added
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
