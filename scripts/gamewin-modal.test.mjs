#!/usr/bin/env node
/** Gamewin modals: theme, contrast (WCAG AA), stacking opacity. */
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { GAMEWIN_AUDIT_FN } from "./lib/gamewin-a11y.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = 8779;

let failed = 0;
/** @param {boolean} c @param {string} m */
function assert(c, m) {
  if (c) console.log(`  ✓ ${m}`);
  else {
    console.error(`  ✗ ${m}`);
    failed++;
  }
}

/** @param {import("playwright").Page} page @param {"day"|"night"} mode */
async function forceTheme(page, mode) {
  await page.evaluate(async (m) => {
    const { applyTimeOfDay } = await import("/src/ui/theme.js");
    window.MoreDucks.meta.settings.timeOfDay = m;
    applyTimeOfDay(m);
  }, mode);
  await page.waitForFunction(
    (m) => document.documentElement.dataset.time === m,
    mode,
    { timeout: 3000 },
  );
  await page.waitForTimeout(350);
}

/** @param {import("playwright").Page} page @param {string} label */
async function audit(page, label) {
  const r = await page.evaluate(GAMEWIN_AUDIT_FN);
  if (r.error) {
    assert(false, `${label}: ${r.error}`);
    return;
  }
  for (const f of r.stackFails) assert(false, `${label} stack: ${f}`);
  for (const f of r.fails) {
    assert(
      false,
      `${label} contrast ${f.ratio}:1 < ${f.need}:1 — "${f.text}" (${f.where}) fg=${f.fg} bg=${f.bg}`,
    );
  }
  if (r.stackFails.length === 0 && r.fails.length === 0) {
    console.log(`  ✓ ${label}: ${r.pass}/${r.total} text samples pass contrast + stacking`);
  }
}

const server = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: ROOT, stdio: "ignore" });
try {
  await new Promise((r) => setTimeout(r, 400));
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/google-chrome",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://127.0.0.1:${PORT}/?v=gw-a11y`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
  const intro = page.locator(".modal-overlay:not([hidden]) .modal__btn");
  if (await intro.count()) await intro.click();
  await page.waitForTimeout(300);

  for (const mode of /** @type {const} */ (["day", "night"])) {
    await forceTheme(page, mode);
    await page.click("#settings-gear");
    await page.waitForSelector(".settings-overlay:not([hidden]) .gamewin");
    await page.evaluate(() => {
      for (const g of document.querySelectorAll(".gamewin")) {
        g.style.animation = "none";
        g.style.opacity = "1";
      }
    });
    await page.waitForTimeout(200);
    assert(
      (await page.evaluate(() => document.documentElement.dataset.time)) === mode,
      `settings open theme is ${mode}`,
    );
    await audit(page, `settings ${mode}`);
    await page.click(".settings-overlay .gamewin__close");
    await page.waitForTimeout(150);
  }

  await forceTheme(page, "night");
  await page.click("#settings-gear");
  await page.click("#set-about");
  await page.waitForSelector("#about-panel:not([hidden])");
  await page.waitForTimeout(200);
  await audit(page, "about night");

  await page.click(".gamewin__back");
  await page.click(".settings-overlay .gamewin__close");
  await forceTheme(page, "day");
  await page.evaluate(() =>
    import("/src/ui/modal.js").then((m) => m.queueWelcomeBack({ mins: 3, ducks: "1", coins: "1" })),
  );
  await page.waitForSelector(".modal-overlay:not(.settings-overlay):not([hidden]) .gamewin");
  await page.waitForTimeout(250);
  await audit(page, "offline day");

  await browser.close();
} finally {
  server.kill("SIGTERM");
}

if (failed) {
  console.error(`\ngamewin-modal: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\ngamewin-modal: all gates passed");
