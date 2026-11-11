#!/usr/bin/env node
/** Settings ↔ About: only one pane visible at a time. */
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = 8772;

const server = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: ROOT, stdio: "ignore" });
let failed = 0;

function assert(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

try {
  await new Promise((r) => setTimeout(r, 400));
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/google-chrome",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://127.0.0.1:${PORT}/?v=about-view`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
  const intro = page.locator(".modal-overlay:not([hidden]) .modal__btn");
  if (await intro.count()) await intro.click();
  await page.waitForTimeout(200);

  await page.click("#settings-gear");
  await page.waitForSelector(".settings-overlay:not([hidden])");

  const vis = () =>
    page.evaluate(() => {
      const settings = document.getElementById("settings-root");
      const about = document.getElementById("about-panel");
      if (!settings || !about) return { error: "missing panels" };
      const cs = (el) => getComputedStyle(el).display;
      return {
        settingsHidden: settings.hidden,
        aboutHidden: about.hidden,
        settingsDisplay: cs(settings),
        aboutDisplay: cs(about),
        soundVisible: Boolean(
          settings.querySelector("#set-sfx")?.offsetParent && !settings.hidden && cs(settings) !== "none",
        ),
        aboutHeroVisible: Boolean(
          about.querySelector(".about__title")?.offsetParent && !about.hidden && cs(about) !== "none",
        ),
      };
    });

  let v = await vis();
  assert(!v.error, "panels mounted");
  assert(v.settingsHidden === false, "settings not hidden initially");
  assert(v.aboutHidden === true, "about hidden initially");
  assert(v.settingsDisplay === "flex" || v.settingsDisplay === "block", "settings displayed");
  assert(v.aboutDisplay === "none", "about display none");
  assert(v.soundVisible, "sound controls visible in settings");
  assert(!v.aboutHeroVisible, "about hero not visible in settings");

  await page.click("#set-about");
  await page.waitForFunction(
    () => {
      const about = document.getElementById("about-panel");
      const settings = document.getElementById("settings-root");
      return about && settings && !about.hidden && settings.hidden;
    },
    null,
    { timeout: 3000 },
  );

  v = await vis();
  assert(v.settingsHidden === true, "settings hidden on about");
  assert(v.aboutHidden === false, "about visible");
  assert(v.settingsDisplay === "none", "settings display none on about");
  assert(!v.soundVisible, "sound controls not visible on about");
  assert(v.aboutHeroVisible, "about hero visible");

  await page.click("#settings-about-back");
  await page.waitForFunction(
    () => {
      const about = document.getElementById("about-panel");
      const settings = document.getElementById("settings-root");
      return about && settings && about.hidden && !settings.hidden;
    },
    null,
    { timeout: 3000 },
  );

  v = await vis();
  assert(v.settingsHidden === false, "settings back after about");
  assert(v.aboutHidden === true, "about hidden after back");

  await browser.close();
} finally {
  server.kill("SIGTERM");
}

if (failed) {
  console.error(`\nabout-settings-view: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\nabout-settings-view: all checks passed");
