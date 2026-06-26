#!/usr/bin/env node

import { contrastRatio, mixHex } from "./lib/contrast.mjs";

import { buildPaletteIndex, loadThemeCss, palette } from "./lib/theme-palette.mjs";

import { PALETTES, WEIGHTS, assertScales, makeScale } from "./gen-colors.mjs";



const css = loadThemeCss();

const index = buildPaletteIndex(css);



let passed = 0;

let failed = 0;



function assert(cond, msg) {

  if (cond) { console.log(`  ✓ ${msg}`); passed++; }

  else { console.error(`  ✗ ${msg}`); failed++; }

}



/**

 * @param {string} label

 * @param {string} fg

 * @param {string} bg

 * @param {number} min

 */

function assertContrast(label, fg, bg, min) {

  const ratio = contrastRatio(fg, bg);

  assert(ratio >= min, `${label}: ${ratio.toFixed(2)}:1 (need ${min}:1)`);

}



console.log("\nAtomic scales (500 = brand anchor)");

assertScales();

for (const [mode, paletteDef] of Object.entries(PALETTES)) {

  for (const [name, hex] of Object.entries(paletteDef)) {

    const scale = makeScale(hex);

    for (const w of WEIGHTS) {

      const key = `${name}-${w}`;

      const cssVal = (mode === "day" ? index.rootTokens : { ...index.rootTokens, ...index.nightTokens })[key];

      assert(cssVal === scale[w], `${mode} ${key} matches generator (${cssVal})`);

    }

  }

}



console.log("\nTheme DRY (no literal colors in rules)");

const rules = css.replace(/^[\s\S]*\/\* ===== BASE ===== \*\/\s*/, "");

assert(!/oklch\(/i.test(rules), "component rules must not contain oklch()");

const hexInRules = rules.match(/#[0-9A-Fa-f]{3,8}/g) ?? [];

assert(hexInRules.length === 0, `component rules must not contain hex (${hexInRules.join(", ")})`);



console.log("\nTheme contrast (WCAG)");



for (const mode of /** @type {const} */ (["day", "night"])) {

  for (let era = 0; era <= 5; era++) {

    const t = palette(index, mode, era);

    const name = `${mode} era ${era}`;

    const surface = t.surface;

    const ink = t.ink;

    const muted = t.muted;

    const accent = t.accent;

    const accentInk = t["accent-ink"];

    const skyMid = mixHex(t["sky-1"], t["sky-2"]);



    console.log(`\n(${name})`);

    assertContrast(`${name} ink/surface`, ink, surface, 4.5);

    assertContrast(`${name} muted/surface`, muted, surface, 4.5);

    assertContrast(`${name} accent-ink/accent`, accentInk, accent, 4.5);

    assertContrast(`${name} ink/sky-mid`, ink, skyMid, 3);

  }

}



console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);

if (failed > 0) process.exit(1);

