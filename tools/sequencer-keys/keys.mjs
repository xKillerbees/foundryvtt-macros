/* Lists the exact Sequencer database keys a JB2A or PSFX install actually has,
   so an effect cue can be written against a key that exists rather than one
   that looks plausible.

     node keys.mjs /path/to/modules jb2a breath poison cone
     node keys.mjs /path/to/modules psfx impact
     node keys.mjs /path/to/modules both fire

   The first argument is the Foundry `modules` directory. The second picks a
   library: `jb2a`, `psfx`, or `both`. Anything after that is a filter — a key
   has to contain every term to be listed. With no terms it prints everything,
   which is a lot: a full JB2A install is upwards of ten thousand keys.

   Nothing in the repository depends on this. It is what you run before adding
   a cue to a macro's `FX` block, and again if a module updates and you want to
   confirm the keys still resolve. A cue whose key has gone stale doesn't
   error — it silently plays nothing, which is why this exists.

   Module directory names are the defaults Foundry installs under. Both the
   free `jb2a_patreon` and the Patreon build export the same symbols; point
   `--jb2a-dir` at whichever you have if it differs. */

import fs from "node:fs";
import path from "node:path";

const LIBS = {
  jb2a: {
    dir: "jb2a_patreon",
    script: "scripts/jb2a_sequencer.js",
    database: "patreonDatabase",
    builder: "jb2aPatreonDatabase",
    prefix: "jb2a"
  },
  psfx: {
    dir: "psfx",
    script: "scripts/psfx_sequencer.js",
    database: "psfxDatabase",
    builder: "registerPSFXDatabase",
    prefix: "psfx"
  }
};

const args = process.argv.slice(2);
const modulesDir = args[0];
const which = (args[1] ?? "both").toLowerCase();
const terms = args.slice(2).map(t => t.toLowerCase());

if (!modulesDir || !["jb2a", "psfx", "both"].includes(which)) {
  console.error("usage: node keys.mjs /path/to/modules <jb2a|psfx|both> [filter ...]");
  process.exit(2);
}

/* The database object is exported, but it starts empty — the module fills it
   in when Foundry calls the builder at startup. So call the builder first,
   then read the object. Importing and reading it straight away gives you {}. */
async function load(lib) {
  const file = path.join(modulesDir, lib.dir, lib.script);
  if (!fs.existsSync(file)) {
    console.error(`# ${lib.prefix}: nothing at ${file} — skipped`);
    return null;
  }
  const src = fs.readFileSync(file, "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(src).toString("base64");
  const mod = await import(url);
  if (typeof mod[lib.builder] !== "function") {
    console.error(`# ${lib.prefix}: no ${lib.builder}() export — the module's layout has changed`);
    return null;
  }
  await mod[lib.builder]("modules");
  return mod[lib.database] ?? null;
}

/* The database nests objects until it reaches a file path or an array of
   them; the key is the dotted path to that leaf. `_metadata` and `_template`
   entries are the module's own bookkeeping, not playable keys. */
function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (k === "_metadata" || k === "_template" || k === "_templates") continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out.push(key);
  }
  return out;
}

const keys = [];
for (const name of which === "both" ? ["jb2a", "psfx"] : [which]) {
  const db = await load(LIBS[name]);
  if (db) {
    const before = keys.length;
    flatten(db, LIBS[name].prefix, keys);
    console.error(`# ${LIBS[name].prefix}: ${keys.length - before} keys`);
  }
}

const hits = terms.length
  ? keys.filter(k => terms.every(t => k.toLowerCase().includes(t)))
  : keys;

for (const h of hits) console.log(h);
console.error(`# ${hits.length} of ${keys.length} keys matched`);
