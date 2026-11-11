#!/usr/bin/env node
import {
  setHoldRepeatActive,
  quackKindForHoldTick,
  resetHoldRepeatState,
  HOLD_FULL_QUACK_MIN_MS,
} from "../src/audio/holdRepeat.js";

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

resetHoldRepeatState();
let t = 1_000_000;
setHoldRepeatActive(true);
assert(quackKindForHoldTick(t) === "full", "first hold tick may quack");
t += 120;
assert(quackKindForHoldTick(t) === "pip", "120ms repeat is pip not full quack");
t += 120;
assert(quackKindForHoldTick(t) === "pip", "still pip");
t += HOLD_FULL_QUACK_MIN_MS;
assert(quackKindForHoldTick(t) === "full", "full quack throttled");
resetHoldRepeatState();
assert(quackKindForHoldTick(t) === "full", "not holding → full");

if (failed) process.exit(1);
console.log(`\n${passed} passed`);
