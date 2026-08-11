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
      yami: { bonded: true, pc: "Re Tang", lockUntil: 0 }
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

  /* The effects tab, with no Sequencer in the harness. */
  "novarush-fx": {
    "world.sf2eNovaRush": {
      tab: "fx",
      repairs: { reactor: true, launcher: true },
      allies: { brinn: true, polly: true }
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
  }
};
