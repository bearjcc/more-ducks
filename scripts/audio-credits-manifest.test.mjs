#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { creditsPlainText } from "../src/audio/credits.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/audio/manifest.json"), "utf8"));
const credits = creditsPlainText();

const MACLEOD =
  '"Thinking Music" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/.';

const CREDIT_NEEDLES = {
  "music/thinking-music": [MACLEOD, "Thinking Music"],
  "ambience/pond-day": ["TRP", "616827"],
  "ambience/pond-night": ["Nirtana", "parret"],
  "ambience/ducks-frenzy": ["spurioustransients", "591702"],
  "code/duck-synth": ["CELPHASE", "MIT"],
};

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

for (const asset of manifest.assets) {
  for (const rel of asset.files) {
    const disk = rel.startsWith("vendor/")
      ? path.join(ROOT, rel)
      : path.join(ROOT, "assets/audio", rel);
    assert(!rel || fs.existsSync(disk), `shipped ${rel || asset.id}`);
  }
  if (asset.id.startsWith("ui/")) {
    assert(credits.includes("Kenney"), `Kenney credit for ${asset.id}`);
  }
  const needles = CREDIT_NEEDLES[asset.id];
  if (needles) {
    for (const n of needles) assert(credits.includes(n), `${asset.id} credits mention ${n}`);
  }
}

assert(fs.existsSync(path.join(ROOT, "vendor/duck-pond/synth.rs")), "vendored synth.rs");
assert(fs.existsSync(path.join(ROOT, "assets/audio/loop-meta.json")), "loop meta for beds");
assert(credits.includes(MACLEOD), "exact MacLeod attribution line");

if (failed) process.exit(1);
console.log(`\n${passed} passed`);
