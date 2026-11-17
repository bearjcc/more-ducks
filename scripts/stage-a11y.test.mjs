#!/usr/bin/env node
/** Main stage: HUD, chat, input bar — contrast + no dimmed overlays (day + night). */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { STAGE_AUDIT_FN } from "./lib/stage-a11y.mjs";
import { forceTheme } from "./lib/theme-capture.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = 8789;
const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

let failed = 0;
/** @param {boolean} c @param {string} m */
function assert(c, m) {
  if (c) console.log(`  ✓ ${m}`);
  else {
    console.error(`  ✗ ${m}`);
    failed++;
  }
}

/** @param {import("playwright").Page} page @param {string} label */
async function audit(page, label) {
  const r = await page.evaluate(STAGE_AUDIT_FN);
  if (r.error) {
    assert(false, `${label}: ${r.error}`);
    return;
  }
  for (const f of r.stackFails) assert(false, `${label} stack: ${f}`);
  for (const f of r.fails) {
    assert(
      false,
      `${label} ${f.region} contrast ${f.ratio}:1 < ${f.need}:1 — "${f.text}" (${f.where})`,
    );
  }
  if (!r.stackFails.length && !r.fails.length) {
    console.log(`  ✓ ${label}: ${r.pass}/${r.total} text samples pass contrast + stacking`);
  } else if (!r.fails.length && !r.stackFails.length) {
    console.log(`  ✓ ${label}: contrast ok`);
  }
}

const server = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: ROOT, stdio: "ignore" });
try {
  await new Promise((r) => setTimeout(r, 400));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(captureHelper);
  await page.goto(`http://127.0.0.1:${PORT}/?v=stage-a11y`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
  const intro = page.locator(".modal-overlay:not([hidden]) .modal__btn");
  if (await intro.count()) await intro.click();
  await page.evaluate(() => window.__mdCapture.playEarlyUnlock());
  await page.evaluate(() => {
    document.body.dataset.started = "1";
  });

  for (const mode of /** @type {const} */ (["day", "night"])) {
    await forceTheme(page, mode);
    assert(
      (await page.evaluate(() => document.documentElement.dataset.time)) === mode,
      `stage theme is ${mode}`,
    );
    await audit(page, `stage ${mode}`);
  }

  await browser.close();
} finally {
  server.kill("SIGTERM");
}

if (failed) {
  console.error(`\nstage-a11y: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\nstage-a11y: all gates passed");