#!/usr/bin/env node
import { formatNumber, setNotation, suffixForTier } from "../src/game/format.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

console.log("\n(a) suffixForTier");
{
  assert(suffixForTier(0) === "", "tier 0 empty");
  assert(suffixForTier(1) === "K", "tier 1 K");
  assert(suffixForTier(4) === "T", "tier 4 T");
  assert(suffixForTier(5) === "aa", "tier 5 aa");
  assert(suffixForTier(6) === "ab", "tier 6 ab");
  assert(suffixForTier(31) === "ba", "tier 31 ba");
  assert(suffixForTier(30) === "az", "tier 30 az");
}

console.log("\n(b) formatNumber suffix");
{
  setNotation("suffix");
  assert(formatNumber(999) === "999", "under 1000 plain");
  assert(formatNumber(1500) === "1.5K", "1.5K");
  assert(formatNumber(2_500_000) === "2.5M", "2.5M");
  assert(formatNumber(1e12) === "1T", "1T");
  assert(formatNumber(1.5e15) === "1.5aa", "1.5aa");
  assert(formatNumber(1.23e18) === "1.23ab", "1.23ab");
}

console.log("\n(c) formatNumber scientific");
{
  setNotation("scientific");
  assert(formatNumber(1.5e6) === "1.5e6", "1.5e6");
  assert(formatNumber(1.5e15) === "1.5e15", "1.5e15");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
