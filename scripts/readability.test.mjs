#!/usr/bin/env node
/**
 * Catches HUD readability regressions: component contrast (day + night, all eras)
 * and text-shadow on tabular counters (blurs digits).
 *
 * Run: npm run readability  (also in npm test)
 * Fix: adjust --counter-*-ink / --warn-ink in styles/main.css, not raw hex in rules.
 */
import { contrastRatio } from "./lib/contrast.mjs";
import { buildPaletteIndex, loadThemeCss, palette } from "./lib/theme-palette.mjs";

const css = loadThemeCss();
const index = buildPaletteIndex(css);

let passed = 0;
let failed = 0;

/** @param {boolean} cond @param {string} msg */
function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

/** @param {string} label @param {string} fg @param {string} bg @param {number} min */
function assertContrast(label, fg, bg, min) {
  const ratio = contrastRatio(fg, bg);
  assert(ratio >= min, `${label}: ${ratio.toFixed(2)}:1 (need ${min}:1)`);
}

/** Pairs tied to real UI surfaces (HUD counters, feed hint tray). */
const COMPONENT_PAIRS = [
  { label: "counter duck", fg: "counter-duck-ink", bg: "surface", min: 4.5 },
  { label: "counter coin", fg: "counter-coin-ink", bg: "surface", min: 4.5 },
  { label: "feed hint", fg: "warn-ink", bg: "surface", min: 4.5 },
  { label: "counter duck (chrome)", fg: "counter-duck-ink", bg: "chrome-bg", min: 4.5 },
  { label: "counter coin (chrome)", fg: "counter-coin-ink", bg: "chrome-bg", min: 4.5 },
];

console.log("\nReadability contrast (component tokens, WCAG AA 4.5:1)");

for (const mode of /** @type {const} */ (["day", "night"])) {
  for (let era = 0; era <= 5; era++) {
    const t = palette(index, mode, era);
    const name = `${mode} era ${era}`;
    console.log(`\n(${name})`);
    for (const { label, fg, bg, min } of COMPONENT_PAIRS) {
      const fgHex = t[fg];
      const bgHex = t[bg];
      if (!fgHex?.startsWith("#") || !bgHex?.startsWith("#")) {
        assert(false, `${name} ${label}: unresolved token (${fg}=${fgHex}, ${bg}=${bgHex})`);
        continue;
      }
      assertContrast(`${name} ${label}/${bg}`, fgHex, bgHex, min);
    }
  }
}

console.log("\nReadability lint (no text-shadow on HUD counters)");

const counterValueBlocks = css.match(/\.counter__value[^{]*\{[^}]+\}/g) ?? [];
for (const block of counterValueBlocks) {
  assert(
    !/text-shadow\s*:/.test(block),
    `counter__value rule must not set text-shadow (${block.slice(0, 60).replace(/\s+/g, " ")}…)`,
  );
}
assert(
  css.includes(".counter--ducks .counter__value { color: var(--counter-duck-ink);"),
  "counter--ducks must use --counter-duck-ink (not raw --primary)",
);
assert(
  css.includes(".counter--coins .counter__value { color: var(--counter-coin-ink);"),
  "counter--coins must use --counter-coin-ink (not raw --currency-bread)",
);
assert(
  /\.feed-hint[\s\S]*?color:\s*var\(--warn-ink\)/.test(css),
  ".feed-hint must use --warn-ink (not raw --warn)",
);

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
