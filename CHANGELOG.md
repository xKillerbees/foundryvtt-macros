# Changelog

## Unreleased

### Fixed
- Downtime Planner: the day count didn't follow the formula. Craft's setup is two days without
  the item's formula and one with it, so dropping an item can move the floor under the days —
  they now move with it while they're still sitting on that floor, and never sit below it. Days
  you set deliberately are left alone
- Fall Downtime Tracker: the Craft second activity wouldn't accept a dragged item — the
  planner had it and this didn't. It does now, with the same chip, the same rarity and formula
  reading, and the formula setting the setup days
- Fall Downtime Tracker: the player board's week table stacked the avatar on top of each name.
  The `td` shared the `.who` class with the PC card's header, which is a column flexbox; the
  table cell has its own class now rather than relying on an override winning
- Downtime Planner: Craft was running on the pre-remaster rules. It is not a flat four days —
  it's **two days of setup before the check, or one with the item's formula**. The per-day
  reduction after that was also priced off the item's level; it goes off the **crafter's** level
  and Crafting rank, a level higher on a critical success. Craft now also carries the
  requirements it's easiest to plan past: an item above your own level, the master and legendary
  ranks that level 9 and 17 items need, being trained at all, and anything uncommon or rare
  needing access before you can make one
- Downtime Planner and Fall Downtime Tracker: dropdowns opened black-on-black in worlds using
  Foundry's dark theme. The control inherited the page's `color-scheme`, so the native popup
  painted itself dark while the options stayed dark-on-dark. Both boards now pin the scheme to
  their own palette and paint the options explicitly
- Downtime Planner: a Craft row on a character untrained in Crafting offered Acrobatics, because
  the field filtered to trained skills and fell through to the first one. It always offers
  Crafting now, and says if you aren't trained in it
- Fall Downtime Tracker: the second activity's number inputs were unstyled, the CSS only having
  covered text inputs and selects

### Added
- Fall Downtime Tracker: the player board is no longer read-only. Each player gets a card per
  character they own — this week's preparation activity, the skill for it, a roll button, and
  the second activity slot — while characters they don't own stay a read-only row
- Fall Downtime Tracker: a player's roll uses their character's own statistic where the system
  offers one and records the degree as a **proposal**. The GM's card shows what was rolled and
  highlights that degree; clicking it is still what moves Hope, Food, or Security. Recording a
  result locks the player's controls for the week
- Fall Downtime Tracker: players can't write world settings, so their changes relay to the GM's
  client over `game.socket`, which re-checks ownership rather than trusting the sender. The
  relayed op set is deliberately narrow — choose, roll, propose — and none of it touches a
  pool, a milestone, or another character
- Fall Downtime Tracker: the second activity is doable rather than just named, on both boards.
  **Research the Curse** picks a source and one of its two skills and rolls it, with exhausted
  sources disabled and the insights remaining called out; the roll proposes, and the GM gets a
  **Bank it** button that feeds it through the same Research Point tally, caps and revelation
  text included. **Earn Income** takes a skill, task level, and days, priced off the real Income
  Earned table by proficiency rank and opening on the character's best-paying skill at their own
  level. **Craft** takes an item, level, and Price, with the DC and materials owed. Retraining
  and Other take a line of text
- Preview stub: `__player` on a fixture boots the preview as a player who owns one actor, with
  a GM left active, so a player-facing board can be exercised and screenshotted
- Preview stub: sample physical items with coin-purse Prices, levels, and rarities that
  `fromUuid` resolves, `TextEditor.getDragEventData` on both its v11 and v13 homes, and
  crafting formulas on the sample party — enough to exercise a drag-and-drop path for real

### Fixed
- Fall Downtime Tracker: the player board went dark and unreadable in some worlds. Two causes —
  the board blanked its own background and leaned on `.window-content`, so wherever the host
  theme won that rule there was nothing underneath the panels; and the week's table inherited
  the PF2e system's own table styling, a tinted header and row striping picked for a dark
  theme. The board now paints its own background, and the table sets its colours explicitly
  under the window id
- Fall Downtime Tracker: the week table's Who column stacked the avatar on top of the name,
  having picked up the card header's column flexbox from the shared `.who` class

### Added
- Downtime Planner — a new `pf2e-downtime` collection, and the first macro here that isn't
  tied to an adventure. The party's downtime on one board: thirteen activities, days budgeted
  against days available, and a card per character
- Downtime Planner: Earn Income costed out of the real Income Earned table, by task level and
  proficiency rank, showing what each degree pays per day and in total — with a critical
  success paying at one task level higher, as the book has it
- Downtime Planner: drag an item onto a Craft card — from a compendium, the items sidebar, or a
  character sheet — and its name, level, and Price fill themselves in, with a coin-purse Price
  flattened to gp so 15 gp 5 sp arrives as 15.5. Dropping on the panel instead starts a new
  Craft row. The chip that appears carries the two things that change the answer: the item's
  rarity, and whether that character knows its formula, read off their own formula book. Both
  feed the rules directly: the formula is what halves the setup days, and rarity is what decides
  whether you need access. A non-physical item is refused rather than crafted against a Price it
  doesn't have
- Downtime Planner: rolls the character's own statistic and records the degree where the
  system offers one, falling back to a rollable `@Check` in chat where it doesn't
- Downtime Planner: the party is **the party actor**, not a directory scan. Eidolons,
  companions, and the utility actors that collect in a long-running world are all
  player-owned, so ownership alone doesn't make something a party member; the directory
  fallbacks only run in a world with no party actor at all
- Downtime Planner: the earnings table sets its own backgrounds and colours under the window
  id, because the PF2e system styles tables inside application windows and its tinted header
  and row striping otherwise show through as a muddy, low-contrast band
- Preview stub: two player-owned actors outside the party — a summoner's eidolon and a
  utility macro actor — so a macro that scans the directory instead of reading the party
  shows that mistake in the preview
- Downtime Planner: written to be handed to the players. Players edit only the characters they
  own and the calendar stays the GM's, enforced on the GM's side rather than trusted from the
  sender. Since players can't write world settings, their edits relay over `game.socket` to
  the GM's client, which runs the same reducer the GM's own clicks do
- Downtime Planner: **rules as written by default.** Three optional house rules ship switched
  off behind GM-only toggles — with all three off the planner computes nothing the Player Core
  doesn't. A rule tags an activity, a field, or a piece of derived maths, so switching one off
  un-applies it rather than leaving stale numbers behind: a Craft row that opted into 75%
  reverts to 50% + 50%, and a plan still holding Dedicated Study days says so instead of being
  quietly costed. Players see which rules are live but can't change them, on both sides of the
  socket
- Downtime Planner: the optional **Dedicated Study** house rule — 2 / 4 / 8 weeks to expert,
  master, legendary — with the level minimums enforced, the teacher required before days can
  be committed, one Lore holding the rank at a time, and no benefit lent to Earn Income.
  Progress is derived from the days actually booked across every period, so editing a row
  walks the study back by exactly that much
- Downtime Planner: because Dedicated Study and Earn Income compete for the same days, the
  board prices the weeks in gold forgone at that character's best rate — the house rule's
  actual cost, made visible instead of implied
- Downtime Planner: the optional **75% crafting** house rule, recalculating the balance owed
  while leaving the 50% due up front alone
- Preview stub: `game.socket` (looped back, so a relayed write round-trips with one browser
  open), `game.users.get` / `activeGM`, `foundry.utils.randomID`, actor `itemTypes.lore`,
  `system.abilities`, `testUserPermission`, and proficiency ranks on the sample party's skills
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
- Abadar's Coin Puzzle — Area 9's logic puzzle as a playable board, and the first macro here
  meant for the players. Client-scoped state, so it needs no GM and writes nothing to the
  world; the fake is random and hidden until the round ends, so the GM can play it blind
- Coin puzzle: a deduction panel that says how many coins still fit the statue's answers and
  dims the ones ruled out, without naming the fake, and calls out when the remaining
  judgements can no longer tell the survivors apart. Uneven hands are flagged before a
  judgement is wasted on them
- Coin puzzle: expands to 3–27 coins with the matching number of judgements, and to an
  unknown-direction mode — the classic twelve-coin problem
- Menace Under Otari: the Area 9 card opens the coin puzzle board
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
