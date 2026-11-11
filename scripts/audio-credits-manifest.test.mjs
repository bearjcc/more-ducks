#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { creditsPlainText } from "../src/audio/credits.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/audio/manifest.json"), "utf8"));
const credits = creditsPlainText();

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
  const needle = asset.credit || asset.id;
  assert(credits.includes("Kenney") || credits.includes("CELPHASE") || credits.includes("duck-pond") || credits.includes("Procedural") || credits.includes("Pond Bed"), "credits mention sources");
  const creditHead = needle.split("—")[0].trim();
  assert(
    credits.includes(creditHead) ||
      credits.includes(asset.license) ||
      (asset.id.startsWith("ambience/") && credits.includes("Procedural pond beds")),
    `credits cover ${asset.id}`,
  );
}

assert(fs.existsSync(path.join(ROOT, "vendor/duck-pond/synth.rs")), "vendored synth.rs");
assert(fs.existsSync(path.join(ROOT, "vendor/duck-pond/LICENSE")), "vendored MIT LICENSE");
assert(credits.includes("MIT"), "duck-pond MIT mentioned");
assert(credits.includes("Kenney"), "Kenney thanks");

if (failed) process.exit(1);
console.log(`\n${passed} passed`);
