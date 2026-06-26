#!/usr/bin/env node
import { DUCKS } from "../src/data/ducks.js";
import { RARE_ANSWER_COUNT, isRareAnswer } from "../src/data/quacks.js";
import { ACHIEVEMENT_COUNT, MILESTONES } from "../src/game/achievements.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) Collection catalog sizes");
{
  assert(DUCKS.length >= 16, `at least 16 ducks to collect (${DUCKS.length})`);
  assert(RARE_ANSWER_COUNT >= 16, `at least 16 rare answers (${RARE_ANSWER_COUNT})`);
  assert(ACHIEVEMENT_COUNT === 16, `exactly 16 achievements (${ACHIEVEMENT_COUNT})`);
  assert(MILESTONES.length === ACHIEVEMENT_COUNT, "MILESTONES matches ACHIEVEMENT_COUNT");
}

console.log("\n(b) Rare answer helper");
{
  assert(isRareAnswer("🦆👑"), "profession emoji with low weight is rare");
  assert(!isRareAnswer("🦆💦"), "common profession emoji is not rare");
  assert(isRareAnswer("You're absolutely right!"), "easter egg text is rare");
}

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
