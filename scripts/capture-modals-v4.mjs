#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { GAMEWIN_AUDIT_FN } from "./lib/gamewin-a11y.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const STORE = "/cursor/stores/self/artifacts/modals-v4";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(STORE, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "8781"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

let gateFailed = 0;

async function settle() {
  await page.evaluate(() => {
    document.querySelectorAll(".gamewin").forEach((el) => {
      el.style.animation = "none";
      el.style.opacity = "1";
    });
    document.querySelectorAll(".toast").forEach((t) => t.remove());
  });
  await page.waitForTimeout(450);
}

/** @param {"day"|"night"} mode */
async function setTheme(mode) {
  await page.evaluate(async (m) => {
    const { applyTimeOfDay } = await import("/src/ui/theme.js");
    window.MoreDucks.meta.settings.timeOfDay = m;
    applyTimeOfDay(m);
  }, mode);
  await page.waitForFunction((m) => document.documentElement.dataset.time === m, mode, { timeout: 3000 });
  await settle();
}

/** @param {string} name @param {"day"|"night"} mode @param {string} label */
async function snap(name, mode, label) {
  const got = await page.evaluate(() => document.documentElement.dataset.time);
  if (got !== mode) {
    console.error(`  ✗ ${label}: theme expected ${mode}, got ${got}`);
    gateFailed++;
  }
  const r = await page.evaluate(GAMEWIN_AUDIT_FN);
  if (r.error || r.stackFails.length || r.fails.length) {
    console.error(`  ✗ ${label}: audit failed`, r);
    gateFailed++;
  } else {
    console.log(`  ✓ ${label}: contrast ${r.pass}/${r.total}, stacking OK`);
  }
  await settle();
  for (const p of [path.join(STORE, name), path.join(OUT, name)]) {
    await page.screenshot({ path: p, scale: "css" });
  }
}

await page.goto("http://127.0.0.1:8781/?v=v4", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
const intro = page.locator(".modal-overlay:not([hidden]) .modal__btn");
if (await intro.count()) await intro.click();
await settle();

await setTheme("day");
await page.click("#settings-gear");
await page.waitForSelector(".settings-overlay:not([hidden]) .gamewin");
await snap("ui-settings-game-390-day-all-on.png", "day", "settings all-on");

await page.click("#set-music-tile");
await page.click("#set-amb-tile");
await snap("ui-settings-game-390-day-some-off.png", "day", "settings some-off day");

await setTheme("night");
await snap("ui-settings-game-390-night-some-off.png", "night", "settings some-off night");

await page.click(".settings-overlay .gamewin__close");
await settle();

await page.evaluate(async () => {
  const { showConfirm } = await import("/src/ui/confirm.js");
  showConfirm({
    title: "Reset save?",
    body: "This erases your pond on this device.",
    okLabel: "Yes, reset",
    cancelLabel: "Keep playing",
    onConfirm: () => {},
  });
});
await page.waitForSelector(".confirm-overlay:not([hidden]) .gamewin");

await setTheme("day");
await snap("ui-modal-confirm-reset-390-day.png", "day", "confirm day");

await setTheme("night");
await snap("ui-modal-confirm-reset-390-night.png", "night", "confirm night");

await browser.close();
server.kill();

if (gateFailed) {
  console.error(`\ncapture-modals-v4: ${gateFailed} gate failure(s)`);
  process.exit(1);
}
console.log("\ncapture-modals-v4: done →", STORE);
