#!/usr/bin/env node
import { defaultSettings, mergeSettings } from "../src/game/meta.js";

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) audio settings defaults");
{
  const s = defaultSettings();
  assert(s.sfx === true, "sfx on");
  assert(s.masterMute === false, "master mute off");
  assert(s.sfxVolume === 1, "sfx volume full");
  assert(s.ambienceVolume === 0.4, "ambience modest");
  assert(s.musicVolume === 0.35, "music low");
  assert(s.music === true && s.ambience === true, "beds enabled");
}

console.log("\n(b) v6 save without new keys merges defaults");
{
  const legacy = { notation: "suffix", sfx: false, buyMode: 10, timeOfDay: "night" };
  const m = mergeSettings(legacy);
  assert(m.sfx === false, "legacy sfx preserved");
  assert(m.musicVolume === 0.35, "musicVolume default filled");
  assert(m.ambienceVolume === 0.4, "ambienceVolume default filled");
  assert(m.masterMute === false, "masterMute default filled");
}

if (failed) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
