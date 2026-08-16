// Dump Season of Ghosts journal entries from the Foundry module's adventure pack.
// Usage: node dump-journals.mjs /path/to/modules/pf2e-season-of-ghosts [filter]
//   filter: case-insensitive substring matched against entry name, page name, or page text.
// With no filter, prints a compact index (entry name -> page names).
import fs from "node:fs";
import path from "node:path";
import { ClassicLevel } from "classic-level";

const modulePath = process.argv[2];
const filter = process.argv[3]?.toLowerCase();

if (!modulePath) {
  console.error("usage: node dump-journals.mjs /path/to/modules/pf2e-season-of-ghosts [filter]");
  process.exit(2);
}

const packDir = path.join(modulePath, "packs/adventures");
const db = new ClassicLevel(packDir, { valueEncoding: "json" });
let adventure;
for await (const [, value] of db.iterator()) adventure = value;
await db.close();

const strip = (html) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

for (const j of adventure?.journal ?? []) {
  const hitEntry = filter && j.name.toLowerCase().includes(filter);
  const hitPages = [];
  for (const p of j.pages ?? []) {
    const txt = strip(p.text?.content ?? "");
    if (filter && (p.name.toLowerCase().includes(filter) || txt.toLowerCase().includes(filter))) {
      hitPages.push({ id: p._id, name: p.name, len: txt.length });
    }
  }
  if (filter) {
    if (hitEntry) console.log(`\n=== ENTRY [${j._id}] ${j.name} ===`);
    if (hitPages.length || hitEntry) {
      for (const hp of hitPages) {
        const p = (j.pages ?? []).find(x => x._id === hp.id);
        console.log(`\n--- PAGE [${p._id}] ${p.name} (${hp.len} chars) ---`);
        console.log(strip(p.text?.content ?? ""));
      }
    }
  } else {
    console.log(`[${j._id}] ${j.name}`);
    for (const p of j.pages ?? []) {
      console.log(`    [${p._id}] ${p.name}`);
    }
  }
}
