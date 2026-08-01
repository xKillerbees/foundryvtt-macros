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
