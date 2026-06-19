#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { contrastRatio, mixHex } from "./lib/contrast.mjs";

const cssPath = join(dirname(fileURLToPath(import.meta.url)), "..", "styles", "main.css");
const css = readFileSync(cssPath, "utf8");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}

/**
 * @param {string} block
 * @returns {Record<string, string>}
 */
function parseVars(block) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

/**
 * @param {string} selectorPattern  regex source for selector before `{`
 * @returns {Record<string, string>}
 */
function extractBlock(selectorPattern) {
  const re = new RegExp(selectorPattern + "\\s*\\{([^}]+)\\}", "m");
  const m = css.match(re);
  return m ? parseVars(m[1]) : {};
}

const root = extractBlock(":root");
const night = extractBlock('\\[data-time="night"\\]');
/** @type {Record<string, Record<string, string>>} */
const eraDay = {};
/** @type {Record<string, Record<string, string>>} */
const eraNight = {};
for (let e = 1; e <= 4; e++) {
  eraDay[String(e)] = extractBlock(`body\\[data-era="${e}"\\]`);
  eraNight[String(e)] = extractBlock(`\\[data-time="night"\\] body\\[data-era="${e}"\\]`);
}

/**
 * @param {"day"|"night"} mode
 * @param {number} era
 */
function palette(mode, era) {
  const tokens = { ...root };
  if (mode === "night") Object.assign(tokens, night);
  if (era > 0) {
    const key = String(era);
    if (mode === "night" && Object.keys(eraNight[key]).length) Object.assign(tokens, eraNight[key]);
    else if (Object.keys(eraDay[key]).length) Object.assign(tokens, eraDay[key]);
  }
  return tokens;
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

console.log("\nTheme contrast (WCAG)");

for (const mode of /** @type {const} */ (["day", "night"])) {
  for (let era = 0; era <= 4; era++) {
    const t = palette(mode, era);
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
