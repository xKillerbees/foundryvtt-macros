/* Seed states for the preview harness.

   Each fixture is keyed by the world setting id the macro reads, and is merged
   over the macro's own blankState(), so only the fields worth showing need to
   be present. The point is screenshots of a console mid-session — an untouched
   board shows nothing but zeroes.

   All values here are invented for illustration. */

globalThis.FIXTURES = {

  /* Fall Downtime Tracker, part way through the twelve weeks: a few weeks of
     preparation banked, the teahouse partly restored, research under way. */
  "downtime": {
    "world.sogFallDowntime": {
      week: 4,
      leader: "matsuki",
      pools: { hope: 9, food: 7, security: 5, restoration: 4 },
      rep: { southbank: 2, northridge: 1 },
      research: { sojin: 2, igawa: 1, willow: 1, solo: 2, zoudou: 1 },
      opts: { expansion: false, teaware: true },
      yami: { bonded: true, pc: "Miyu", lockUntil: 0 },
      ui: { eventOpen: true },
      weeks: {
        4: {
          entries: {
            0: { activity: "repair",    skill: "Crafting|19",        result: "s",  delta: { restoration: 1 }, second: "Research the Curse" },
            1: { activity: "harvest",   skill: "Farming Lore|17",    result: null, delta: null, second: "—" },
            2: { activity: "hunt",      skill: "Fishing Lore|17",    result: "cs", delta: { food: 2 },        second: "Earn Income" },
            3: { activity: "reinforce", skill: "Engineering Lore|17", result: null, delta: null, second: "—" }
          },
          locks: {}, pen: {}, eventDone: false, log: []
        }
      }
    }
  },

  /* The fall tracker's player board, switched on, mid-week 5. One character
     has already rolled and is waiting on the GM; the rest are part way
     through choosing. Rendered as a player by flipping game.user — see
     tools/preview/README.md. */
  "downtime-player": {
    __player: "pc1",
    "world.sogFallDowntime": {
      week: 5,
      playerVisible: true,
      pools: { hope: 16, food: 9, security: 6, restoration: 5 },
      rep: { southbank: 2, northridge: 1 },
      research: { sojin: 2, igawa: 0, willow: 1, solo: 2, zoudou: 3 },
      opts: { expansion: false, teaware: true },
      weeks: {
        5: {
          entries: {
            0: { activity: "harvest",   skill: "Farming Lore|17",     result: null, delta: null, rolled: "cs",
                 second: "Research the Curse",
                 sec: { key: "research", src: "igawa", skill: "Arcana|19", rolled: "s", applied: false, note: "" } },
            1: { activity: "reinforce", skill: "Engineering Lore|17", result: "s",  delta: { security: 1 }, rolled: null,
                 second: "Earn Income",
                 sec: { key: "income", skill: "crafting", task: 4, days: 7, rolled: "s", applied: false, note: "" } },
            2: { activity: "ceremony",  skill: "Performance|19",      result: null, delta: null, rolled: null,
                 second: "Craft",
                 sec: { key: "craft", skill: "crafting", item: "Ghost touch rune", ilvl: 4, price: 200, rolled: null, applied: false, note: "" } },
            3: { activity: null,        skill: "",                    result: null, delta: null, rolled: null, second: "—" }
          },
          locks: {}, pen: {}, eventDone: false, log: []
        }
      }
    }
  },

  /* Week 10 — the Feast of the Kami. The preparations are banked, the Night
     of the Feast is resolved (ceremony recorded, three PCs succeeded at the
     entertainment), and part of the After-the-Feast rewards are toggled on. */
  "downtime-feast": {
    "world.sogFallDowntime": {
      week: 10,
      pools: { hope: 8, food: 5, security: 4, restoration: 5 },
      rep: { southbank: 1, northridge: 2 },
      research: { sojin: 3, igawa: 1, willow: 1, solo: 2, zoudou: 1 },
      opts: { expansion: false, teaware: true },
      feast: {
        decoration: 6, banquet: 7, entertainment: 4,
        ceremony: "s", entertain: { 0: "cs", 1: "s", 2: "f", 3: "cs" },
        after: { base: true, deco: true }
      },
      weeks: {
        10: {
          entries: {}, locks: {}, pen: {}, eventDone: false, log: [],
          feastPcs: {
            0: [
              { act: "decorate", skill: "Art Lore|17", rolled: "s", applied: true },
              { act: "banquet", skill: "Food Lore|17", rolled: "s", applied: true },
              { act: "invite", skill: "Religion|17", rolled: null, applied: false }
            ],
            1: [
              { act: "banquet", skill: "Drink Lore|17", rolled: "cs", applied: true },
              { act: "decorate", skill: "Performance|19", rolled: null, applied: false },
              {}
            ],
            2: [
              { act: "invite", skill: "Diplomacy|19", rolled: "s", applied: true },
              {}, {}
            ],
            3: [{}, {}, {}]
          }
        }
      }
    }
  },

  /* First Long Night, with the grand show under way and the ledger filling. */
  "festival": {
    "world.sogFirstLongNight": {
      tab: "show",
      phase: 2,
      show: {
        line: "remembrance",
        rehearsed: "III",
        results: { I: "s", II: "cs", III: "s" },
        paid: false, paidValues: null
      },
      ledger: { hope: 2, food: 1, security: 0, rep: 1 }
    }
  },

  /* The same console on its games tab, with a few medals already awarded so
     the tracker, the titles, and the Lantern Crown all have something to show. */
  "games": {
    "world.sogFirstLongNight": {
      tab: "games",
      phase: 3,
      games: {
        sprint:  { gold: 2, silver: 0 },
        pole:    { gold: 0, silver: 2 },
        cricket: { gold: 2, silver: 3 },
        riddle:  { gold: 1, silver: 3 },
        stones:  { gold: 3, silver: 1 }
      },
      ledger: { hope: 2, food: 1, security: 0, rep: 1 }
    }
  },

  /* In the Ruins of Wisdom, two statues down: the hidden library has opened,
     Zhi Hui has manifested twice, and the storm is still running. Includes an
     Enlightened Path state so the arrival tab has a pilgrimage to read. */
  "monastery": {
    "world.sogEnlightenedPath": {
      shrines: {
        d1: { cleared: true, slept: true },
        d2: { incense: true, slept: true },
        d3: { iogaka: true, bathe: true, slept: true }
      }
    },
    "world.sogRuinsOfWisdom": {
      tab: "statues",
      statues: { e2: { result: "cs" }, e3: { result: "s" }, e12: { result: "f" } },
      order: ["e2", "e3"],
      zhi: { 1: 1, 2: 1 },
      cleared: { e2: true, e3: true, e12: true },
      beats: { e13: { head: true } },
      xp: 80
    }
  },

  /* The same console on the grove tab, where the tree and the libraries sit. */
  "monastery-grove": {
    "world.sogRuinsOfWisdom": {
      tab: "grove",
      statues: { e2: { result: "cs" }, e3: { result: "s" } },
      order: ["e2", "e3"],
      cleared: { e2: true, e3: true, e10: true },
      beats: { e10: { door: true }, e11: { yenrui: true } },
      xp: 200
    }
  },

  /* Summer console (Act 1) on its landing tab — lantern relit, Gurglegut
     down, reputation already banked with both factions. */
  "summer": {
    "world.sogFallDowntime": {
      pools: { hope: 0, food: 0, security: 0, restoration: 0 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogSummer": {
      lantern: true,
      ringleaders: { gurglegut: true, graybutcher: false, modouqiu: false },
      level: 2,
      xp: 80
    }
  },

  /* The same console in a world without the adventure module, so the journal
     links stand down and the panel says why. */
  "summer-nojournal": {
    __journals: false,
    "world.sogSummer": { lantern: false, level: 1 }
  },

  /* Per-tab seeds for the render smoke test — the cards are static data, so
     only the tab / sub-tab need to be set. */
  "summer-ch1-town":      { "world.sogSummer": { tab: "ch1", ctab: { ch1: "town" } } },
  "summer-ch1-lantern":   { "world.sogSummer": { tab: "ch1", ctab: { ch1: "lantern" } } },
  "summer-ch2-downtown":  { "world.sogSummer": { tab: "ch2", ctab: { ch2: "downtown" } } },
  "summer-ch2-butcher":   { "world.sogSummer": { tab: "ch2", ctab: { ch2: "butcher" } } },
  "summer-ch2-teahouse":  { "world.sogSummer": { tab: "ch2", ctab: { ch2: "teahouse" } } },
  "summer-ch3-town":      { "world.sogSummer": { tab: "ch3", ctab: { ch3: "town" } } },
  "summer-ch3-hinterlands": { "world.sogSummer": { tab: "ch3", ctab: { ch3: "hinterlands" } } },
  "summer-ch3-curse":     { "world.sogSummer": { tab: "ch3", ctab: { ch3: "curse" } } },
  "summer-ch3-duel":      { "world.sogSummer": { tab: "ch3", ctab: { ch3: "duel" } } },
  "summer-ch4-camp":      { "world.sogSummer": { tab: "ch4", ctab: { ch4: "camp" } } },
  "summer-ch4-ritual":    { "world.sogSummer": { tab: "ch4", ctab: { ch4: "ritual" } } },

  /* Campaign Status Tracker at the table's real position — Act 2, Chapter 5,
     week 3 — with the downtime tracker's state present so the rollup strip has
     something live to read. */
  "campaign": {
    "world.sogFallDowntime": {
      week: 3,
      pools: { hope: 8, food: 3, security: 2, restoration: 2 },
      rep: { southbank: 1, northridge: 2 },
      research: { sojin: 2, igawa: 0, willow: 0, solo: 4, zoudou: 0 },
      opts: { expansion: true, teaware: false },
      yami: { bonded: true, pc: "Tenzo", lockUntil: 0 }
    },
    /* Week 3's festival, resolved — so the party panel has titles to show.
       `pcs` is spelled out because this fixture is read by a macro other than
       the one that wrote it, so nothing fills the roster in for it. */
    "world.sogFirstLongNight": {
      pcs: [
        { name: "Aiko", actorId: "pc1" }, { name: "Daizen", actorId: "pc2" },
        { name: "Miyu", actorId: "pc3" }, { name: "Tenzo", actorId: "pc4" }
      ],
      games: {
        sprint:  { gold: 2, silver: 0 },
        pole:    { gold: 0, silver: 2 },
        cricket: { gold: 2, silver: 3 },
        riddle:  { gold: 1, silver: 3 },
        stones:  { gold: 3, silver: 1 },
        drinking: { gold: 3, silver: 1 }
      }
    },
    "world.sogCampaign": {
      tab: "campaign",
      chapters: { 1: "done", 2: "done", 3: "done", 4: "done", 5: "active" },
      flags: {
        "1.lantern": true, "1.abacus": true, "1.kappas": true, "1.elders": true,
        "2.butcher": true, "2.douqiu": true, "2.prison": true, "2.will": true,
        "3.governor": true, "3.xungu": true, "3.willow": true, "3.teahouse": true,
        "3.teafarm": true, "3.expansion": true, "3.duel": true, "3.shinzo": true, "3.lesson1": true,
        "4.ledger": true, "4.advance": true, "4.bargain": true, "4.gift": true,
        "4.intime": true, "4.mengsung": true, "4.abductees": true,
        "5.festival": true, "5.yami": true
      }
    },
    "world.sogSummer": {
      lantern: true,
      ringleaders: { gurglegut: true, graybutcher: true, modouqiu: true },
      level: 4
    },
    "world.sogWhoLeads": {
      winner: "south",
      leveled: true
    }
  },

  /* The Treasure tab — the loot ledger, with an earlier chapter's haul
     partly claimed so all four groupings appear. */
  "campaign-loot": {
    "world.sogCampaign": {
      tab: "loot",
      chapters: { 1: "done", 2: "done", 3: "done", 4: "done", 5: "active" },
      loot: {
        "2.care": true, "3.pearls": true, "4.pendant": true, "4.gift": true,
        "4.iron": true, "5.yami": true
      }
    }
  },

  /* Act 1, which is where the finished chapters are: skipped items, and the
     hinterlands wandering-monster procedure on Chapter 3. */
  "campaign-act1": {
    "world.sogCampaign": {
      tab: "act1",
      chapters: { 1: "done", 2: "done", 3: "done", 4: "done", 5: "active" },
      flags: {
        "1.lantern": true, "1.kappas": true, "1.elders": true,
        "2.butcher": true, "2.douqiu": true, "2.prison": true, "2.will": true,
        "3.governor": true, "3.xungu": true, "3.willow": true, "3.teahouse": true,
        "3.teafarm": true, "3.expansion": true, "3.duel": true, "3.shinzo": true, "3.lesson1": true,
        "4.ledger": true, "4.advance": true, "4.bargain": true, "4.gift": true,
        "4.intime": true, "4.mengsung": true, "4.abductees": true
      },
      cues: { "3.rollers": true, "3.seasons": true },
      quests: { "3.boats": true, "3.teahouse": true, "3.peachwood": true }
    }
  },

  /* The same board in a world without the adventure module, so the journal
     links stand down and the panel says why. */
  "campaign-nojournal": {
    __journals: false,
    "world.sogCampaign": {
      tab: "campaign",
      chapters: { 1: "done", 2: "done", 3: "done", 4: "done", 5: "active" }
    }
  },

  /* The campaign tab wound back to Chapter 3, the one chapter that carries a
     running procedure — the hinterlands wandering-monster table. */
  "campaign-hinterlands": {
    "world.sogCampaign": {
      tab: "campaign",
      /* Spelled out past the running chapter so nothing reads as played
         that shouldn't, and so two chapters never read as running at once. */
      chapters: { 1: "done", 2: "done", 3: "active", 4: "todo", 5: "todo" },
      flags: {
        "1.lantern": true, "1.kappas": true, "1.elders": true,
        "2.butcher": true, "2.douqiu": true, "2.prison": true, "2.will": true,
        "3.governor": true, "3.xungu": true
      },
      cues: { "3.singing": true }
    },
    "world.sogSummer": {
      lantern: true,
      ringleaders: { gurglegut: true, graybutcher: true, modouqiu: false }
    }
  },

  /* An act tab, showing the per-chapter checklist, module macros, and cues. */
  "campaign-act4": {
    "world.sogCampaign": {
      tab: "act4",
      chapters: { 1: "done", 2: "done", 3: "done", 4: "done", 5: "active" }
    }
  },

  /* The Threads tab, which is where the tracker earns its keep. */
  "campaign-threads": {
    "world.sogCampaign": {
      tab: "threads",
      chapters: { 1: "done", 2: "done", 3: "done", 4: "done", 5: "active" },
      flags: {
        "1.abacus": true, "1.kappas": true, "2.will": true, "3.xungu": true,
        "3.willow": true, "3.teahouse": true, "3.expansion": true, "3.lesson1": true,
        "4.ledger": true
      }
    }
  },

  /* Battle for Nova Rush, part way through: the brig is behind them, the
     reactor is fixed, Polly was saved from the sinkwell. */
  "novarush": {
    "world.sf2eNovaRush": {
      tab: "upper",
      brig: { mods: { flattery: true }, escaped: "brinn", brinnHelped: true, compartment: true },
      areas: { a2: true, a8: true },
      repairs: { reactor: true, launcher: false },
      allies: { brinn: true, polly: true },
      sinkwell: { successes: 3, active: false, defeated: true }
    }
  },

  /* The bridge fight, mid-round, with a battle-damage result showing. */
  "novarush-bridge": {
    "world.sf2eNovaRush": {
      tab: "bridge",
      repairs: { reactor: true, launcher: true },
      allies: { brinn: true, polly: true },
      round: 3, lastDamage: 4
    }
  },

  /* The conclusion, with the crew assigned and the checks half rolled. */
  "novarush-escape": {
    "world.sf2eNovaRush": {
      tab: "escape",
      repairs: { reactor: true, launcher: true },
      allies: { brinn: true, polly: false },
      crew: {
        0: { role: "pilot", result: "success" },
        1: { role: "gunner", result: "success" },
        2: { role: "skill", result: "failure" },
        3: { role: "skill", result: "success" }
      }
    }
  },

  /* The cinematic escape, two rounds in. */
  "novarush-scene": {
    "world.sf2eNovaRush": {
      tab: "escape", mode: "cinematic",
      repairs: { reactor: true, launcher: true },
      allies: { brinn: true, polly: true },
      scene: { rounds: [
        { assign: { 0: "pilot", 1: "gunner", 2: "engineer", 3: "science" },
          results: { 0: "cs", 1: "s", 2: "f", 3: "s" } },
        { assign: { 0: "pilot", 1: "gunner", 2: "captain", 3: "magic" },
          results: { 0: "s", 1: "cs", 2: "s" } }
      ] }
    }
  },

  /* The bridge with the Sequencer stand-in switched on, so the effect cues
     beside each battle-damage face show what they look like once the modules
     are installed. */
  "novarush-fx": {
    __sequencer: true,
    "world.sf2eNovaRush": {
      tab: "bridge",
      repairs: { reactor: true, launcher: true },
      allies: { brinn: true, polly: true },
      round: 2, lastDamage: 1
    }
  },

  /* Abadar's coin puzzle, one judgement in. Three coins against three, the
     left hand rose, so the fake is among 4, 5, and 6 — which is what the
     deduction panel works out without naming it. */
  "coins": {
    "world.abadarCoinPuzzle": {
      coins: 9, hard: false, allowed: 2, round: 1,
      fake: 5, fakeHeavy: false,
      place: { 4: "left", 5: "right" },
      weighings: [{ left: [1, 2, 3], right: [4, 5, 6], verdict: "left" }],
      accused: null, phase: "weigh", won: null, showHints: true, revealed: false
    }
  },

  /* Menace Under Otari, part way through floor 1: the crypt and the storeroom
     behind them, the barricade taken apart quietly, the puzzle solved and the
     spear trap armed against its owners. */
  "otari": {
    "world.pf2eMenaceUnderOtari": {
      tab: "start",
      xp: { a1: true, a2: true, a3: true, a4: true, a5: true, a7: true, a8: true, a9: true, a10: true },
      areas: { a1: true, a2: true, a3: true, a4: true, a5: true, a6: true, a7: true, a8: true, a9: true, a10: true },
      loot: { a3: true, a5: true, a7: true },
      flags: { barricade: "quiet", puzzle: "solved", lever: "armed", wall: null, fountain: null }
    }
  },

  /* The same session, read on the floor 1 tab so the forks and their
     downstream notes are visible. */
  "otari-floor1": {
    "world.pf2eMenaceUnderOtari": {
      tab: "f1",
      xp: { a1: true, a2: true, a3: true, a4: true, a5: true, a7: true, a8: true, a9: true, a10: true },
      areas: { a1: true, a2: true, a3: true, a4: true, a5: true },
      loot: { a3: true, a5: true },
      flags: { barricade: "quiet", puzzle: "solved", lever: "armed", wall: null, fountain: null }
    }
  },

  /* Floor 2, with the warren already alerted by a botched wall and enough XP
     banked that the party has hit 2nd level before the boss. */
  "otari-floor2": {
    "world.pf2eMenaceUnderOtari": {
      tab: "f2",
      xp: { a1: true, a2: true, a3: true, a4: true, a5: true, a7: true, a8: true, a9: true, a10: true,
            a11: true, a12: true, a14: true, a15: true, a16: true, a17: true, "a17:boss": true },
      areas: { a12: true, a13: true, a14: true, a15: true, a16: true },
      loot: { a15: true, a16: true },
      flags: { barricade: "quiet", puzzle: "solved", lever: "armed", wall: "loud", fountain: null }
    }
  },

  /* The table tab — the module's own audio, scenes, and effect cues, with the
     Sequencer stand-in switched on so the cues report as ready. */
  "otari-table": {
    __sequencer: true,
    "world.pf2eMenaceUnderOtari": {
      tab: "table",
      xp: { a1: true, a2: true, a3: true },
      flags: { barricade: "quiet", puzzle: null, lever: null, wall: null, fountain: null }
    }
  },

  /* Mark of the Mantis, with both legwork phases resolved: a scoped manor, a
     tool, a security key, and one botched round of prying that has already
     cost the party a point of Awareness. */
  "mantis": {
    "world.pf2eMarkOfMantis": {
      tab: "plan",
      plan: {
        entries: {
          "1:0": { activity: "scope", result: "cs" },
          "1:1": { activity: "prepare", result: "s" },
          "1:2": { activity: "keys", result: "cs" },
          "1:3": { activity: "manor", result: "cf" },
          "2:0": { activity: "distraction", result: "s" },
          "2:1": { activity: "doatara", result: "s" },
          "2:2": { activity: "manor", result: "s" },
          "2:3": { activity: "prepare", result: "f" }
        },
        spent: {},
        facts: {
          doatara: { history: true, poisoner: true },
          manor: { ruins: true, iomedae: true, cellars: true },
          scope: { windows: true, doors: true, roof: true, guardian: true }
        }
      },
      apAdd: [{ n: 1, label: "Inexpert task" }]
    }
  },

  /* The break-in itself: one obstacle beaten, a second under way, guards
     thinning, and Awareness far enough up that the house has tightened. */
  "mantis-infiltration": {
    "world.pf2eMarkOfMantis": {
      tab: "infil",
      plan: {
        entries: {
          "1:0": { activity: "scope", result: "cs" },
          "1:1": { activity: "prepare", result: "s" },
          "1:2": { activity: "keys", result: "cs" },
          "2:3": { activity: "distraction", result: "s" }
        },
        spent: { "1:1": true },
        facts: { doatara: {}, manor: {}, scope: {} }
      },
      obstacles: {
        opening: { turns: [
          { results: { 0: "cs", 1: "s", 2: "f", 3: "s" }, auto: 0, closed: true }
        ] },
        silent: { turns: [
          { results: { 0: "s", 1: "f", 2: "cf", 3: "s" }, auto: 0, closed: true },
          { results: { 0: "s" }, auto: 1, closed: false }
        ] }
      },
      comps: [{ key: "socialites", deg: "f" }, { key: "cornered", deg: "cf" }],
      kills: [{ how: "assassination", deg: "cs" }, { how: "assassination", deg: "sw" },
              { how: "combat", deg: "combat" }],
      apAdd: [{ n: 2, label: "A ruckus" }],
      fired: { 3: true }
    }
  },

  /* The manor with the alternate challenges switched on — the ahuizotl in the
     pond, terra-cotta warriors inside, the ghostly choir moved into the
     chapel, and the way down hidden behind the gallery's liquor shelves. */
  "mantis-alternates": {
    "world.pf2eMarkOfMantis": {
      tab: "alt",
      alt: { doatara: "priest", exterior: "ahuizotl", interior: "terracotta", cellar: "a15" },
      traps: { t1: { type: "choir", where: "a11" }, t2: { type: "scythe", where: "a9" } }
    }
  },

  /* The manor tab, read with those same alternates in play. */
  "mantis-manor": {
    "world.pf2eMarkOfMantis": {
      tab: "manor",
      alt: { doatara: "priest", exterior: "ahuizotl", interior: "terracotta", cellar: "a15" },
      traps: { t1: { type: "choir", where: "a11" }, t2: { type: "scythe", where: "a9" } },
      areas: { a6: true, a7: true, a8: true }
    }
  },

  /* The planner as it ships: rules as written, every house rule switched off.
     No Dedicated Study in the activity list, no 75% option on the Craft row,
     and the side panel says so. */
  "planner-raw": {
    "world.pf2eDowntimePlan": {
      period: 1,
      settlement: 5,
      house: { study: false, craft75: false, lore: false },
      ui: { sel: "pc2" },
      periods: {
        1: {
          label: "The lull after Willowshore",
          days: 14,
          plans: {
            pc1: { rows: [
              { id: "q1", act: "income", days: 10, degree: "s", done: false, note: "",
                cfg: { skill: "diplomacy", task: 5, what: "Standing watch for the trade office" } },
              { id: "q2", act: "rest", days: 4, degree: null, done: true, note: "",
                cfg: { note: "Recovering from the wight" } }
            ] },
            pc2: { rows: [
              { id: "q3", act: "income", days: 5, degree: "s", done: false, note: "",
                cfg: { skill: "arcana", task: 5, what: "Copying scrolls for Igawa Jubei" } },
              { id: "q4", act: "spell", days: 1, degree: "s", done: false, note: "",
                cfg: { spell: "Wall of Fire", rank: 4, skill: "arcana" } },
              /* Dragged in from a compendium — the uuid is what draws the item
                 chip and lets the planner check the formula. */
              { id: "q5", act: "craft", days: 8, degree: "s", done: false, note: "",
                cfg: { item: "+1 Striking Longsword", ilvl: 4, price: 35, skill: "crafting", hr75: "0",
                       uuid: "Compendium.pf2e.equipment-srd.Item.bbbb0000", rarity: "common", formula: false } }
            ] },
            pc3: { rows: [
              { id: "q6", act: "income", days: 12, degree: "cs", done: false, note: "",
                cfg: { skill: "thievery", task: 5, what: "Quiet work for the Abacus Sisters" } }
            ] },
            pc4: { rows: [
              { id: "q7", act: "subsist", days: 6, degree: null, done: false, note: "",
                cfg: { skill: "survival", dc: 15, where: "The hinterlands" } },
              { id: "q8", act: "retrain", days: 7, degree: null, done: false, note: "",
                cfg: { what: "feat", from: "Toughness", to: "Fleet" } }
            ] }
          }
        }
      }
    }
  },

  /* The same fortnight with the table's house rules switched on. Daizen is
     halfway through Dedicated Study on Absalom Lore, which is why he has no
     Earn Income row and the tuition line has something to say, and his Craft
     row is running at 75%. */
  "planner": {
    "world.pf2eDowntimePlan": {
      period: 1,
      settlement: 5,
      house: { study: true, craft75: true, lore: true },
      ui: { sel: "pc2" },
      periods: {
        1: {
          label: "The lull after Willowshore",
          days: 14,
          plans: {
            pc1: { rows: [
              { id: "r1", act: "income", days: 10, degree: "s", done: false, note: "",
                cfg: { skill: "diplomacy", task: 5, what: "Standing watch for the trade office" } },
              { id: "r2", act: "rest", days: 4, degree: null, done: true, note: "",
                cfg: { note: "Recovering from the wight" } }
            ] },
            pc2: { rows: [
              { id: "r3", act: "study", days: 7, degree: null, done: true, note: "",
                cfg: { lore: "Absalom Lore", rank: "2", teacher: "Igawa Jubei's collection" } },
              { id: "r4", act: "spell", days: 1, degree: "s", done: false, note: "",
                cfg: { spell: "Wall of Fire", rank: 4, skill: "arcana" } },
              /* Uncommon and with the formula known — the chip carries both the
                 rarity flag and what the 75% house rule asks for. */
              { id: "r5", act: "craft", days: 8, degree: "s", done: false, note: "",
                cfg: { item: "Ghost Touch Rune", ilvl: 4, price: 77, skill: "crafting", hr75: "1",
                       uuid: "Compendium.pf2e.equipment-srd.Item.cccc0000", rarity: "uncommon", formula: true } }
            ] },
            pc3: { rows: [
              { id: "r6", act: "income", days: 12, degree: "cs", done: false, note: "",
                cfg: { skill: "thievery", task: 5, what: "Quiet work for the Abacus Sisters" } }
            ] },
            pc4: { rows: [
              { id: "r7", act: "subsist", days: 6, degree: null, done: false, note: "",
                cfg: { skill: "survival", dc: 15, where: "The hinterlands" } },
              { id: "r8", act: "retrain", days: 7, degree: null, done: false, note: "",
                cfg: { what: "feat", from: "Toughness", to: "Fleet" } }
            ] }
          }
        }
      },
      study: { pc3: { held: { lore: "Underworld Lore", rank: 2 }, prevHeld: null } }
    }
  },

  /* Enlightened Path, opened on the first day of the pilgrimage with the
     ritual behind the party. */
  "path": {
    "world.sogEnlightenedPath": {
      tab: "d1",
      ritual: { components: true, cast: "success", xp: true },
      days: { d1: { B1: true, B2: true }, d2: {}, d3: {} },
      shrines: { d1: { cleared: true, slept: true }, d2: {}, d3: {} },
      xp: 280
    }
  },

  /* No Breath to Cry, mid-winter: the clock running, research part way on both
     rituals, and Chapter 10's Terror climbing as the party works the fortress. */
  "winter": {
    "world.sogFallDowntime": {
      week: 6,
      pools: { hope: 5, food: 3, security: 2, restoration: 5 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogWinter": {
      tab: "ch10",
      ctab: { ch8: "events", ch9: "timeline", ch10: "fortress" },
      week: 6,
      population: 208,
      rp: { ch8: 8, ch9: 6 },
      components: { kiln: true, feathers: true, slats: false },
      terror: 4,
      xp: 540
    }
  },

  /* The landing view: the winter clock, with the pools live from the downtime
     tracker and the attrition/complication tables front and centre. */
  "winter-clock": {
    "world.sogFallDowntime": {
      week: 6,
      pools: { hope: 5, food: 3, security: 2, restoration: 5 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogWinter": {
      tab: "clock",
      week: 6,
      population: 208,
      terror: 4,
      xp: 540
    }
  },

  /* Chapter 8's mindscape: part way through the dream, the governor run to
     ground, several obstacles behind them. */
  "winter-dream": {
    "world.sogFallDowntime": {
      week: 2,
      pools: { hope: 9, food: 5, security: 4, restoration: 5 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogWinter": {
      tab: "ch8",
      ctab: { ch8: "dream", ch9: "timeline", ch10: "terror" },
      week: 2,
      population: 221,
      rp: { ch8: 8, ch9: 0 },
      xp: 180
    }
  },

  /* Chapter 9's set pieces: the seance resolved enough to settle Cao Chen, and
     the interview with the jorogumo princess under way. */
  "winter-seance": {
    "world.sogFallDowntime": {
      week: 9,
      pools: { hope: 6, food: 2, security: 3, restoration: 5 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogWinter": {
      tab: "ch9",
      ctab: { ch8: "events", ch9: "pieces", ch10: "terror" },
      week: 9,
      population: 215,
      rp: { ch8: 8, ch9: 8 },
      components: { kiln: true, feathers: true, slats: true },
      influence: { chen: 4 },
      xp: 700
    }
  },

  /* Chapter 10's Terror engine, mid-raid, the table lit up at 4. */
  "winter-terror": {
    "world.sogFallDowntime": {
      week: 10,
      pools: { hope: 4, food: 1, security: 2, restoration: 5 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogWinter": {
      tab: "ch10",
      ctab: { ch8: "events", ch9: "timeline", ch10: "terror" },
      week: 10,
      population: 212,
      terror: 4,
      xp: 800
    }
  },

  /* Chapter 8's opening: the three fights and the rescue ledger. */
  "winter-events": {
    "world.sogFallDowntime": {
      week: 1,
      pools: { hope: 9, food: 5, security: 4, restoration: 5 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogWinter": {
      tab: "ch8",
      ctab: { ch8: "events", ch9: "timeline", ch10: "terror" },
      week: 1,
      population: 223,
      xp: 120
    }
  },

  /* Chapter 9's research: the transmigrate ritual, components gathered. */
  "winter-research": {
    "world.sogFallDowntime": {
      week: 9,
      pools: { hope: 6, food: 2, security: 3, restoration: 5 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogWinter": {
      tab: "ch9",
      ctab: { ch8: "events", ch9: "research", ch10: "terror" },
      week: 9,
      population: 215,
      rp: { ch8: 8, ch9: 8 },
      components: { kiln: true, feathers: true, slats: false },
      xp: 700
    }
  },

  /* Chapter 8's research: Mindscape Shift discovered, Softened Death to hand. */
  "winter-ch8research": {
    "world.sogFallDowntime": {
      week: 2,
      pools: { hope: 9, food: 5, security: 4, restoration: 5 },
      rep: { southbank: 2, northridge: 1 }
    },
    "world.sogWinter": {
      tab: "ch8",
      ctab: { ch8: "research", ch9: "timeline", ch10: "terror" },
      week: 2,
      population: 221,
      rp: { ch8: 8, ch9: 0 },
      xp: 300
    }
  },

  /* Who Leads Willowshore? — the champions' duel, mid-Trial: PC vs PC (Aiko
     for Northridge, Daizen for Southbank), three rounds in, Southbank ahead. */
  "duel": {
    "world.sogWhoLeads": {
      tab: "trial",
      mode: "trial",
      north: { kind: "pc", actorId: "pc1", name: "Aiko" },
      south: { kind: "pc", actorId: "pc2", name: "Daizen" },
      favorStart: { north: 2, south: 1 },
      rounds: { r1: "n", r2: "s", r3: "S", r4: null, r5: null },
      crowd: { r1: "cn", r2: "cN", r3: "bs", r4: null, r5: null },
      winner: "",
      leadup: { courted: true, rallied: true }
    },
    "world.sogFallDowntime": {
      pools: { hope: 8, food: 6, security: 5, restoration: 2 },
      rep: { southbank: 1, northridge: 2 }
    }
  },

  /* The player-facing board, mid-Trial: PC vs PC champions (Aiko for
     Northridge, Daizen for Southbank) plus a third candidate (Miyu), three
     rounds in, Southbank ahead. Rendered as a player via __player. */
  "duel-player": {
    __player: "pc1",
    "world.sogWhoLeads": {
      tab: "trial",
      mode: "trial",
      north: { kind: "pc", actorId: "pc1", name: "Aiko" },
      south: { kind: "pc", actorId: "pc2", name: "Daizen" },
      third: { on: true, kind: "pc", actorId: "pc3", name: "Miyu" },
      favorStart: { north: 2, south: 1 },
      rounds: { r1: "n", r2: "s", r3: "S", r4: null, r5: null },
      crowd: { r1: "cn", r2: "cN", r3: "bs", r4: null, r5: null },
      winner: "",
      leadup: { courted: true, rallied: true }
    },
    "world.sogFallDowntime": {
      pools: { hope: 8, food: 6, security: 5, restoration: 2 },
      rep: { southbank: 1, northridge: 2 }
    }
  },

  /* The player board in thrown mode: the fix and the Suspicion track are
     invisible to players — they see only the champions and the round progress
     (four sold, no score). Regression guard for the thrown-mode non-leak. */
  "duel-player-thrown": {
    __player: "pc1",
    "world.sogWhoLeads": {
      tab: "trial",
      mode: "thrown",
      north: { kind: "pc", actorId: "pc3", name: "Miyu" },
      south: { kind: "pc", actorId: "pc4", name: "Tenzo" },
      thrownWinner: "north",
      knows: "in",
      rounds: { r1: "k", r2: "b", r3: "c", r4: "k", r5: null },
      crowd: { r1: "q1", r2: "qx", r3: "q1", r4: null, r5: null },
      winner: "north",
      leadup: { rehearsed: true, defused: true }
    },
    "world.sogFallDowntime": {
      pools: { hope: 8, food: 6, security: 5, restoration: 2 },
      rep: { southbank: 1, northridge: 2 }
    }
  },

  /* The same event thrown: Hu has conceded privately and the party stages the
     fix. Four rounds sold, Suspicion at 4 (Whispers), Matsuki in on it. */
  "duel-thrown": {
    "world.sogWhoLeads": {
      tab: "trial",
      mode: "thrown",
      north: { kind: "pc", actorId: "pc3", name: "Miyu" },
      south: { kind: "pc", actorId: "pc4", name: "Tenzo" },
      thrownWinner: "north",
      knows: "in",
      rounds: { r1: "k", r2: "b", r3: "c", r4: "k", r5: null },
      crowd: { r1: "q1", r2: "qx", r3: "q1", r4: null, r5: null },
      winner: "north",
      leadup: { rehearsed: true, defused: true }
    },
    "world.sogFallDowntime": {
      pools: { hope: 8, food: 6, security: 5, restoration: 2 },
      rep: { southbank: 1, northridge: 2 }
    }
  },

  /* The landing (setup) tab in thrown mode: PC vs PC champions, the
     knows-panel, and a couple of lead-up levers already toggled. */
  "duel-setup": {
    "world.sogWhoLeads": {
      tab: "setup",
      mode: "thrown",
      north: { kind: "pc", actorId: "pc1", name: "Aiko" },
      south: { kind: "pc", actorId: "pc2", name: "Daizen" },
      thrownWinner: "south",
      knows: "won",
      favorStart: { north: 2, south: 1 },
      leadup: { courted: true, rallied: true, rehearsed: true }
    }
  },

  /* The thrown duel reversed — Granny Hu is the fixed winner, so Matsuki's
     champion (Aiko) throws. Read on the trial tab to see the round text flip. */
  "duel-thrown-south": {
    "world.sogWhoLeads": {
      tab: "trial",
      mode: "thrown",
      north: { kind: "pc", actorId: "pc1", name: "Aiko" },
      south: { kind: "pc", actorId: "pc2", name: "Daizen" },
      thrownWinner: "south",
      knows: "concession",
      rounds: { r1: "c", r2: "k", r3: "c", r4: "g", r5: null }
    }
  },

  /* The verdict tab: Southbank carries the town, the rift healed, the party
     levelled to 3. */
  "duel-verdict": {
    "world.sogWhoLeads": {
      tab: "verdict",
      mode: "trial",
      north: { kind: "pc", actorId: "pc1", name: "Aiko" },
      south: { kind: "pc", actorId: "pc2", name: "Daizen" },
      favorStart: { north: 2, south: 1 },
      rounds: { r1: "n", r2: "s", r3: "S", r4: "s", r5: "t" },
      winner: "south",
      beats: { rift: true },
      leveled: true
    },
    "world.sogFallDowntime": {
      pools: { hope: 8, food: 6, security: 5, restoration: 2 },
      rep: { southbank: 1, northridge: 2 }
    }
  },

  /* The verdict tab in thrown mode: the fix delivers to Old Matsuki, no
     winner buttons, the write-through beats still offered. */
  "duel-verdict-thrown": {
    "world.sogWhoLeads": {
      tab: "verdict",
      mode: "thrown",
      north: { kind: "pc", actorId: "pc3", name: "Miyu" },
      south: { kind: "pc", actorId: "pc4", name: "Tenzo" },
      thrownWinner: "north",
      knows: "in",
      rounds: { r1: "c", r2: "c", r3: "g", r4: "c", r5: "c" },
      winner: "north",
      leveled: true
    },
    "world.sogFallDowntime": {
      pools: { hope: 8, food: 6, security: 5, restoration: 2 },
      rep: { southbank: 1, northridge: 2 }
    }
  },

  /* The multi-part boss console, mid-fight: Menare the Great Worm at 412 HP,
     the head and wings both broken, one phase already running (Cornered Beast),
     the head-break phase armed, and a back-pocket phase waiting in reserve. */
  "boss": {
    "world.multipartBoss": {
      v: 1,
      tab: "fight",
      actorId: "boss1",
      actorName: "Menare the Great Worm",
      bodyMaxHp: 575,
      bodyHp: 412,
      syncToken: true,
      stats: { level: 23, ac: 50, fort: 40, ref: 38, will: 42, defenses: "" },
      round: 2,
      parts: [
        { id: "p_head", name: "Head", maxHp: 230, hp: 0, broken: true,
          abilities: "frightful presence · jaws · horns · breath weapon · arcane spells",
          brokenEffect: "loses frightful presence, jaws, horns, breath weapon, and spellcasting",
          acNote: "AC +2, Reflex +4 — a smaller target", saveNote: "",
          resistNote: "physical 10", weakNote: "" },
        { id: "p_wings", name: "Wings", maxHp: 170, hp: 0, broken: true,
          abilities: "flight",
          brokenEffect: "falls if flying",
          acNote: "", saveNote: "", resistNote: "", weakNote: "cold 5" }
      ],
      phases: [
        { id: "ph_cornered", name: "Cornered Beast", triggerType: "part-broken", triggerPartId: "p_wings",
          triggerHp: 0, triggerRound: 0, backpocket: false,
          effects: "Falls if flying. Becomes quickened 1 — the extra action only to Stride or make melee Strikes.",
          active: true, skipped: false, armed: false },
        { id: "ph_fury", name: "Worm's Fury", triggerType: "part-broken", triggerPartId: "p_head",
          triggerHp: 0, triggerRound: 0, backpocket: false,
          effects: "Loses spellcasting, frightful presence, jaws, horns and breath weapon. Free Stride + two claw Strikes against whoever broke it; +2 status to claw and tail attack and damage; adamantine-scales reaction (resistance 15 against one damaging effect, main body only); stunned 1 for two turns.",
          active: false, skipped: false, armed: false },
        { id: "ph_stand", name: "Righteous Stand", triggerType: "hp-below", triggerPartId: null,
          triggerHp: 250, triggerRound: 0, backpocket: true,
          effects: "Free action to ignite in Draconic Radiance; +1 status to AC and all saves. Creatures perceiving him through vision who later target him with a melee attack must succeed a DC 45 Will save or be blinded 1 minute.",
          active: false, skipped: false, armed: false }
      ],
      log: [
        { t: 1755462900000, text: "Trigger met — phase \"Worm's Fury\" armed" },
        { t: 1755462600000, text: "\"Head\" broken" },
        { t: 1755462300000, text: "Phase began — \"Cornered Beast\"" },
        { t: 1755461700000, text: "\"Wings\" broken" }
      ]
    }
  }
};
