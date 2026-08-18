# Changelog

## 2026-08-18 17:04

### Added
- **Who Leads Willowshore? — a "how a round runs" panel on both boards.** The round skills and
  the scoring came from different parts of the source and read as two unrelated systems: the GM
  tally spoke about Deception/Performance while each round named its own different skills, so
  nothing said when the sell was rolled or how it landed on a +1 rather than a +2. Both boards
  now open on an explainer. The GM's Trial tab gets a numbered loop above the tally, token-filled
  with the actual champions' names: who rolls what, and the full mapping — critical success −1
  Gorgeous · success +0 Clean · failure +1 Shaky · critical failure +2 Botched, with Blowout
  called out as a GM judgement recorded *in place of* the sell's own result rather than a roll of
  its own. The player board gets the same loop prepended in the crowd's voice, and, for a player
  whose character holds a seat, a numbered "your part" beneath it: in the Trial, one roll of the
  round's own skill (set DC in III/IV, opposed in I/II, none in V unless the town is split); in a
  thrown duel, the thrower is told to play the round out and *then* roll once to sell the loss,
  and that the sell — not the round's own skill — is the roll that counts, while the other seat is
  told to play every round straight and that Round V isn't theirs. No Favor number, Suspicion
  number, or band label appears in any of it, and the panel drops away once the verdict is in.

### Fixed
- **Who Leads Willowshore? — two leaks in the same area.** The player board's roll card named
  Suspicion outright ("keeps Suspicion down", "bonus if Suspicion is low"), against the board's own
  reskinning of that track as the crowd's doubt; both notes are now in crowd voice. And the
  Suspicion tally's hint hardcoded "Hu's champion" and "Matsuki", so it read backwards whenever the
  fix delivered to Hu — it is now token-filled from the selected sides.

## 2026-08-18 15:51

### Fixed
- **Who Leads Willowshore? — the thrown duel's winner-side champion had no roll of their own.**
  The previous fix gave only the *thrower's* champion a roll card in the thrown duel; the other
  seat (the elder who's actually winning) got nothing at all, so a table with PCs on both sides
  still had one player unable to roll. The winner's champion now gets the same honest round card
  Trial mode uses (III/IV's printed DC, I/II's skill menu) for Rounds I–IV; Round V stays
  thrower-only, since the book gives the money shot entirely to the sell.

## 2026-08-18 15:32

### Fixed
- **Who Leads Willowshore? — champion self-rolling now works in the thrown duel, not just the
  Trial.** The Roll card was gated on trial mode only, so a champion seated for a thrown duel
  never saw a roll option on any round, even mid-Trial with a fixed DC on the books. In thrown
  mode the board now gives the *thrower's* champion (and only them — the winner's champion is
  playing it straight) a Deception/Performance DC 18 "sell it" roll on whichever round is next,
  matching the tally panel's existing DC note. Round V's card adds a line about the money-shot's
  Suspicion-based bonus/penalty.

## 2026-08-18 15:19

### Changed
- **Who Leads Willowshore? — champion self-rolling now covers all five rounds, not just III and
  IV.** The player board's Roll buttons previously only appeared on the Trial's two fixed-DC
  rounds; the opposed rounds (I, II) and the tie-break line in V were GM-only, so a champion
  assigned to those steps had nothing to click. Round I now offers Diplomacy / Performance /
  Deception; Round II offers Athletics / Acrobatics (the "Attack" option stays on the character
  sheet — a strike needs a weapon picked, not a button); Round V offers a Diplomacy roll only when
  Favor is tied going into it, matching the book's tie-break rule. None of these carry a DC — the
  roll posts to chat and the GM reads the total, same as the fixed-DC rounds already did.

## 2026-08-17 14:02

### Added
- **Who Leads Willowshore? — a crowd-whispers meter and champion self-rolling on the player
  board.** In the thrown duel the player board now carries the Suspicion track reskinned as the
  crowd's growing doubt: a single bar that fills (tinted by band — moss/gold/rust) as the sell
  wobbles, captioned in the crowd's voice ("The crowd is convinced — a clean, hard-fought contest"
  → "Whispers ripple through the crowd — something about the fight doesn't sit right" → "The crowd
  has seen through it — the bout reads false"), with no Suspicion number or band label — the fix
  and sell notes stay off the board. And a champion whose character is assigned to a seat can now
  roll the Trial's fixed-DC rounds straight from the board: the upcoming round (III's DC 20 Society,
  IV's DC 18 Society / Medicine) shows a Roll button that rolls that character's statistic with the
  DC and posts the degree to chat, falling back to the posted inline checks; the opposed,
  no-fixed-DC rounds (I, II, V) remain with the GM. A `duel-player-thrown` screenshot was added.

## 2026-08-17 13:47

### Changed
- **Who Leads Willowshore? — the player board now reads the crowd, not the score.** The player
  view's mechanical Favor tally (raw `Northridge N · Southbank M` numbers) is gone, reskinned as
  a **crowd meter**: the same two-tone bar now leans with the town, ends labelled by faction, and
  a caption that says how hard the crowd is pulling ("The crowd is split down the middle", "…edges
  toward …", "…sways toward …", "…roars for …"). Each settled round of the five-round stepper now
  reads in the square's own voice too — "the crowd cheers Northridge", "the crowd roars for
  Southbank", "the crowd applauds both" — styled as a filled chip instead of a plain text label,
  and it updates as the GM records the round through the existing sync hook. In the thrown duel
  each settled round reads a neutral "settled" and the crowd meter stays hidden, so nothing scores
  the fix. The raw Favor numbers remain only on the GM console.

## 2026-08-17 13:32

### Added
- **Who Leads Willowshore? — a spoiler-free player board.** Players given OBSERVER permission on
  the macro now get a read-only board instead of the GM console: the two champions (plus any third
  candidate), a five-round stepper marking which rounds are decided, and the live Favor tallies
  once the Trial is underway, ending in the announced verdict. It re-renders on every GM update
  through the existing world-setting sync hook, so the board moves as the GM records the duel with
  nothing to re-post. Everything the crowd can't see stays off it — the thrown duel's Suspicion
  track, sell notes, and fix, the cast's GM-only cards, the beats, and the level flag — and the
  verdict is withheld in thrown mode until all five rounds are done, so the fix's target is never
  revealed early. A `duel-player` preview fixture (plus a `duel-player-thrown` regression fixture)
  and a README screenshot were added.

### Fixed
- Who Leads Willowshore?: **Post the standing** no longer leaks the Suspicion track into public
  chat during a thrown duel — the standing now posts only the champions when the fight is fixed.

## 2026-08-17 01:09

### Added
- **PF2e Multi-Part Boss** — a new collection with `multipart-boss-console.js`, a
  GM combat console that turns a single boss actor into a multi-part opponent with
  breakable parts and phases. It links to a real enemy actor (reading its AC, saves,
  and resistances live as a reference and mirroring the main body's HP to the token
  bar), tracks a main-body pool plus any number of part pools, and runs the
  double-application damage rule (a part hit lands on both the part and the main body,
  each net value adjustable for that location's resistance/weakness). Phases arm on a
  part breaking, the body falling below a HP threshold, or a round count, and can be
  marked back-pocket to hold in reserve; a broken part stays broken until explicitly
  un-broken. The rules are a homebrew adaptation of Fabula Ultima's multi-part and
  phase rules to PF2e, after How It's Played Labs. State persists in a hidden world
  setting; the preview stub gained a boss NPC actor and a `boss` fixture, and a
  screenshot was added.

## 2026-08-17 00:42

### Fixed
- No Breath to Cry console: every table — the Winter-clock **Unexpected Troubles**
  table, the research **Mode** table, and Chapter 10's Terror **Thresholds** and
  **menu** — rendered as an unreadable dark band in Foundry. The PF2e system styles
  tables inside application windows (a dark-tinted `thead` plus its own row striping,
  chosen for its dark theme), and the console's bare class selectors (`.nbt .table
  th/td`) lost to it: header labels sat on a near-black bar and body rows got a grey
  zebra stripe. The table rules are now prefixed with the window id
  (`#nbt-console .nbt .table …`) and explicitly reset `background`/`border` on the
  table, `thead`, `tbody`, `tr`, `th`, and `td`, so the parchment card shows through
  and the muted headers / dark-ink body read as intended.

## 2026-08-16 21:56

### Changed
- Campaign Status Tracker: the decisions that mirror a chapter console — the Eternal Lantern, the
  three ringleaders (Gray Butcher, Mo Douqiu, and Gurglegut, who rides on the lantern), the named
  leader, and the three shrine lights — are no longer a private second copy. They read and write
  the console's own setting field (`world.sogSummer`, `world.sogWhoLeads`,
  `world.sogEnlightenedPath`), so ticking a box here is the same toggle the Summer / Who Leads
  Willowshore / Enlightened Path console shows, and vice versa. Skip Act 1 entirely and you can
  still mark the lantern lit from the tracker; the Summer console agrees when it's next run.
- The **Live from the chapter consoles** rollup strip's boolean elements are now toggle buttons
  instead of read-only text — click Lantern / Gray Butcher / Mo Douqiu / Leader / the three
  shrines to flip the shared value straight from the campaign view. The numeric values (Hope,
  Food, Security, Teahouse, Research, Week, Statues) stay read-only; the consoles own those.
- A one-time migration pushes any ticks the tracker already held into the matching console
  setting, so existing progress isn't lost when those items switch to the shared value.
- Console writes are read-merge-write, so a console open in another window sees a complete state
  rather than a partial one; a never-run console is seeded minimally and its own boot fills in
  the rest.

## 2026-08-16 09:52

### Added
- Campaign Status Tracker: now reads the **Summer** and **Who Leads Willowshore?** consoles, not
  just the four it was built around. The live rollup strip gains the Act 1 spine — the Eternal
  Lantern lit or dark, the three ringleaders down, and the leader named once the duel resolves —
  read straight from `world.sogSummer` and `world.sogWhoLeads`, and both consoles are listed
  against their Act 1 chapters in the "Consoles in this collection" block (with
  `tools/module-check` now scanning their journal ids too).
- Campaign Status Tracker: an **Act 1 side-quest checklist**, kept in its own bucket so it never
  dilutes the decisions count. Granny Hu's two extra requests in Chapter 1 (Checking the Doctor,
  Missing Grandchildren) and all eight hinterlands opportunities in Chapter 3 (Missing Boats,
  Fixing the Ranch, Moving Desna's Shrine, Investigate the Old Expansion, Smith Troubles,
  Collecting Peachwood, The Teahouse Owner's Will, Tea Farm Infestation), each with a journal
  link into the book.
- Campaign Status Tracker: the Act 1 random-encounter tables are now **rollable from the macro**
  instead of prose you hand-rolled. The module ships no RollTable documents, so the two tables
  are transcribed and rolled in place: Chapter 1's Willowshore table (DC 10 flat check, d20, +5
  at night, gone once the lantern is lit) and Chapter 3's Hinterlands table (DC 17 flat check,
  then a d12 within two hexes of Willowshore or a d20 deeper out). Every row and threat is
  printed beside the roll buttons, and the result posts to chat as a card.


## 2026-08-16 09:20

### Added
- Season of Ghosts: the **summer console** — the whole of Act 1 (*The Summer That Never Was*)
  in one window, the Act 1 counterpart to the winter console. A **town tab** carries the act's
  spine: the Eternal Lantern (lit or dark, with the mirage-mist / blood-rain manifestations it
  gates), the three monster ringleaders (Gurglegut, Gray Butcher, Mo Douqiu) as defeat toggles,
  a level stepper with the act's milestones, and Southbank / Northridge reputation read and
  written live from the Fall Downtime Tracker. Four chapter tabs follow: **To Light the Night**
  (waking, the first day, contacting both elders, the First Missions A1/A2, then the lantern
  quest — bless the coins, the shrines, retake Dawnstep, and the Gurglegut fight),
  **Reclaiming Willowshore** (all seventeen B-areas, the wandering Gray Butcher's parade of
  cookware, and the Cerulean Teahouse with Mo Douqiu — reputation recorded per faction, since
  nearly every room swings Northridge or Southbank), **The Willowshore Curse** (Shinzo the
  merchant with his GM-only identity kept out of the read-aloud, the D1–D13 hinterlands sandbox
  and eight opportunities, and the three investigations), and **The Wall of Ghosts** (the E1–E17
  lumber camp split between the Prayers and the Rovers, then the Ritual Site, Zoudou's Consecrate
  rite, and the Horror from Beyond). Chapter 3's duel is a pointer panel to the
  who-leads-willowshore console, not a re-authoring. Journal links resolve across the act's five
  entries — the four chapters plus the Willowshore gazetteer, so W-area cards open the town
  gazetteer rather than a chapter. Beats write reputation (both factions, or Southbank /
  Northridge separately) through to the Fall Downtime Tracker so the campaign tracker's rollup
  stays correct.

## 2026-08-16 08:44

### Changed
- Who Leads Willowshore?: the thrown-duel variant no longer hardcodes Granny Hu as the
  conceding elder. A **"the fix delivers to"** selector on the Challenge tab picks the fixed
  winner — Old Matsuki or Granny Hu — and the whole thrown surface follows it: the
  "does the winner know?" panel (and its "knows the other conceded" option), every round's
  sell text (which champion throws, which lands the money-shot blow, which elder concedes),
  and the verdict tab's "the fix delivers to" line all re-name themselves to the chosen
  elder and champions.

## 2026-08-16 03:31

### Added
- Season of Ghosts: the **Who Leads Willowshore?** console — the Chapter 3 set-piece and the Level 3
  milestone in one window. Champion selection for both seats (any PC, with Capt. Zheng Peng and
  Yong Wu-Xiu as the NPC stand-ins, plus a third-candidate option), the seven-day lead-up
  (starting-Favor steppers alongside the reputation / influence / rally / rehearse / defuse
  checklist), and the five-round Trial of Champions on two live Favor tallies — the Address, the
  best-of-3 bout, the winter riddle, the People at double Favor, and the Verdict — with each round's
  checks posted to chat as rollable inline checks. The **thrown-duel** variant from "The Worked
  Duel" swaps Favor for a Suspicion track (0–3 Flawless / 4–6 Whispers / 7+ Exposed) with per-round
  sell deltas, a blowout toggle, and the money-shot finale. The verdict tab declares the winner,
  applies reversible write-through beats (heal the rift → Hope + Reputation, back the winner, or a
  bloodbath) to the Fall Downtime Tracker's pools, and marks the level-up to 3. Read-aloud for the
  challenge and the verdict posts in-world; no GM-only chapter structure is ever posted to chat.

## 2026-08-16 02:37

### Added
- Fall Downtime Tracker: week 10's Feast of the Kami now resolves in the macro instead of stopping
  at the preparations. A **Night of the Feast** block carries the kami's reaction to the decorations
  (toggleable −1/+2 Security at 3-or-fewer / 6+ Decoration Points), the **tea ceremony** itself (Tea
  Lore DC 17 / Society DC 21, with the Banquet-Points degree shift shown and each of the four degrees
  applying its Hope/Food delta and blessing reversibly), and the post-meal **entertainment** (each PC
  vs DC 19 with the Entertainment-Points modifier, tracking who succeeded). An **After the Feast**
  block holds the threshold rewards (Feast complete, Decorations/Banquet/Entertainment 4+, and 10+
  points for a Reputation point to the party's chosen faction), and a **next day** note covers
  Shinzo's gift and the magic-tea book with the Winter's Breath formula. A "Post the night's checks"
  button sends the ceremony and entertainment rolls to chat as rollable checks.

## 2026-08-16 02:04

### Changed
- Fall Downtime Tracker: the "Next steps — Open the Wall of Ghosts" panel now carries the book's
  player-facing ritual description (Consecrate ritual + Sangpotshi theory + Zoudou's notes) instead
  of the "Chapter 6" note — players are no longer told about chapter structure. The ritual's timing
  is now stated as a crescent or new moon (the second half of each month), and the GM's copy is
  flagged as read-aloud text with the 120 XP award kept as a GM-only footnote.

## 2026-08-16 01:47

### Added
- Fall Downtime Tracker: once the GM reaches 10 Research Points and marks the research complete
  (after explaining the milestone to the players), the "Researching the Curse" panel is replaced by
  a "Next steps — Open the Wall of Ghosts" panel — the ritual can now be attempted at their leisure,
  award 120 XP, and Chapter 6 can begin during any remaining week of fall (expect Chapters 6–7 to
  take one to two weeks, with no downtime during those weeks). The same swap appears on the player
  board.
- Fall Downtime Tracker: when Yami is adopted, the bonded PC's card (GM and player views, including
  the Week 10 feast cards) now shows a prominent reminder banner with a button that rolls the DC 11
  flat check and, on a success, the d8 on Yami's Gifts table, naming the gift in chat.

## 2026-08-16 01:22

### Added
- Season of Ghosts: the **No Breath to Cry** winter console — a single GM tool for all of Act 3
  (Chapters 8–10). The landing tab is the winter clock, which reads and writes the Fall Downtime
  Tracker's Hope / Food / Security pools live and tracks the population (225 at the start of
  winter) alongside the weekly attrition, the Unexpected Troubles table, and the depleted-track
  costs. Chapter 8 carries the three fights of Red Smoke, Gold Eyes, the Mindscape Shift research,
  and Heh Shan-Bao's mindscape (the chase, the reveal, End of the Dream). Chapter 9 carries the
  seventy-two-day timeline, the transmigrate research with the kiln / feathers / slats components,
  and the seance and Interview-with-a-Spider set pieces. Chapter 10 carries the Terror engine and
  the whole Karahai fortress. The Two Weavers rework seeds in Chapter 9 (the woman in crimson
  silks, Ren Mei Li's "owed a quarrel") are carried and flagged as rework-only, not printed-book
  content.

## 2026-08-15 23:07

### Fixed
- Downtime Planner: the "house rule" badge on a Dedicated Study card showed even while the GM
  had that rule switched off. It now only appears while the rule is actually in play — the rest
  of the house-rule surface (the top-bar chips, the Add-bar activity, and the Craft 75% field)
  already hid itself from players the moment a rule was unchecked.

## 2026-08-15 22:55

### Fixed
- Downtime Planner: the world-clock fallback for a period's creation stamp read Foundry's
  bare elapsed-time clock ("N days, N hours"), but with the PF2e system installed the world
  clock is the system's own themed calendar. The fallback now reads `game.pf2e.worldClock`
  — month, day, and year from the GM's calendar theme (e.g. "Moonday, 15 of Abadius, 4722
  AR") — instead of the elapsed-seconds string.

### Added
- Downtime Planner: the creation stamp now also reads **Calendaria** (the v14 calendar
  module) when it's installed. The source order is SimpleCalendar → Calendaria → the PF2e
  world clock → Foundry's bare elapsed clock, so the GM's real calendar wins wherever one
  exists, and a world with none still shows a dash rather than a made-up date.

## 2026-08-15 22:17

### Changed
- Downtime Planner: the in-game half of a period's creation stamp now falls back to Foundry's
  native world clock when SimpleCalendar isn't installed, rather than showing a dash. A world
  with SimpleCalendar still gets the calendar date; without it the stamp reads
  `game.time.worldTime` rendered as "N days, N hours", and a world with neither shows a dash
  rather than a made-up date

## 2026-08-15 21:52

### Added
- Downtime Planner: the GM can now manage periods. A "Periods" button in the calendar bar opens
  a ledger of every period in order, each with its days, its row count, and its creation stamp;
  the GM can jump straight to any of them, add the next one explicitly, and remove the ones that
  got there by accident (navigating forward once too often leaves empty periods sitting between
  the real ones). Removing the current period jumps the view to the highest remaining one, and
  removing the last one re-creates a fresh period 1 rather than leaving the planner with none. An
  empty period deletes on the spot; one full of plans asks for confirmation first, and the remove
  is a GM-only op refused from a player relay
- Downtime Planner: every period now records when it was created, in both the real world and the
  game's own calendar — the in-game date is read from SimpleCalendar where that module is
  installed, and left out of worlds without one. The stamp shows in the top bar for the GM and
  the players alike, and is stamped onto the posted chat card for the historical record. Periods
  opened before this feature carry neither and show a plain dash rather than a made-up date

## 2026-08-15 21:35

### Fixed
- Downtime Planner: the request button disappeared once the next period already existed — a
  player couldn't ask for a new period after the GM had opened one and looked back. The button
  is now always visible to a party member, and a request always names the next period that
  doesn't exist yet (latest existing period + 1), so it never targets an already-open period

## 2026-08-15 21:26

### Added
- Downtime Planner: players can now ask the GM for the next downtime period. A "Request a
  new period" button sits in the top bar for each player; it relays to the GM's client (the
  sender is named from the hook, not the payload), and the GM gets a banner listing who's
  asked with a one-click "Open period N", plus a chat notice the moment a request lands.
  Requests live in the world setting until the GM opens the period, and a player can withdraw
  theirs. The button is always available to a party member

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
