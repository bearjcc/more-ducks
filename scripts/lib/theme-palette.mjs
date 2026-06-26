/** Resolve semantic CSS tokens to hex for day/night (+ era). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseColor } from "./contrast.mjs";

const stylesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "styles");

/** @returns {string} */
export function loadThemeCss() {
  return readFileSync(join(stylesDir, "tokens.css"), "utf8")
    + "\n"
    + readFileSync(join(stylesDir, "main.css"), "utf8").replace(/^@import[^;]+;\s*/, "");
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
 * @param {string} css
 * @param {string} selectorPattern
 */
function extractBlock(css, selectorPattern) {
  const re = new RegExp(selectorPattern + "\\s*\\{([^}]+)\\}", "m");
  const m = css.match(re);
  return m ? parseVars(m[1]) : {};
}

/**
 * @param {string} css
 * @param {string} selectorPattern
 */
function mergedBlock(css, selectorPattern) {
  /** @type {Record<string, string>} */
  const out = {};
  const re = new RegExp(selectorPattern + "\\s*\\{([^}]+)\\}", "gm");
  for (const m of css.matchAll(re)) Object.assign(out, parseVars(m[1]));
  return out;
}

/** @param {[number, number, number]} rgb */
function rgbToHex([r, g, b]) {
  const h = (n) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * @param {string} color
 * @param {Record<string, string>} tokens
 * @param {Set<string>} seen
 */
function resolveColor(color, tokens, seen = new Set()) {
  const s = color.trim();
  if (s.startsWith("#")) return s;
  if (s === "white") return "#ffffff";
  if (s === "black") return "#000000";
  if (s === "transparent") return "#000000";

  const varMatch = s.match(/^var\(--([\w-]+)(?:,\s*(.+))?\)$/);
  if (varMatch) {
    const key = varMatch[1];
    const chain = `--${key}`;
    if (seen.has(chain)) return s;
    seen.add(chain);
    if (tokens[key]) return resolveColor(tokens[key], tokens, seen);
    if (varMatch[2]) return resolveColor(varMatch[2].trim(), tokens, seen);
    return s;
  }

  const mixMatch = s.match(
    /^color-mix\(in (?:oklch|srgb),\s*(.+?)\s+(\d+)%,\s*(.+?)\)$/,
  );
  if (mixMatch) {
    const left = resolveColor(mixMatch[1], tokens, new Set(seen));
    const right = resolveColor(mixMatch[3], tokens, new Set(seen));
    const pct = Number(mixMatch[2]) / 100;
    if (!left.startsWith("#") || !right.startsWith("#")) return s;
    const [r1, g1, b1] = parseColor(left);
    const [r2, g2, b2] = parseColor(right);
    const mix = (a, b) => Math.round(a * pct + b * (1 - pct));
    return rgbToHex([mix(r1, r2), mix(g1, g2), mix(b1, b2)]);
  }

  return s;
}

/** @param {Record<string, string>} raw */
function resolveTokens(raw) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = resolveColor(value, raw);
  }
  return out;
}

/** @param {string} css */
export function buildPaletteIndex(css) {
  /** @type {Record<string, Record<string, string>>} */
  const eraDay = {};
  /** @type {Record<string, Record<string, string>>} */
  const eraNight = {};
  for (let e = 1; e <= 5; e++) {
    eraDay[String(e)] = extractBlock(css, `body\\[data-era="${e}"\\]`);
    eraNight[String(e)] = extractBlock(css, `\\[data-time="night"\\] body\\[data-era="${e}"\\]`);
  }
  return {
    rootTokens: mergedBlock(css, ":root"),
    nightTokens: mergedBlock(css, '\\[data-time="night"\\]'),
    eraDay,
    eraNight,
  };
}

/**
 * @param {ReturnType<typeof buildPaletteIndex>} index
 * @param {"day"|"night"} mode
 * @param {number} era
 */
export function palette(index, mode, era) {
  const tokens = { ...index.rootTokens };
  if (mode === "night") Object.assign(tokens, index.nightTokens);
  if (era > 0) {
    const key = String(era);
    if (mode === "night" && Object.keys(index.eraNight[key]).length) {
      Object.assign(tokens, index.eraNight[key]);
    } else if (Object.keys(index.eraDay[key]).length) {
      Object.assign(tokens, index.eraDay[key]);
    }
  }
  return resolveTokens(tokens);
}
