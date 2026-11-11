#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { GAMEWIN_AUDIT_FN } from "./lib/gamewin-a11y.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = "/opt/cursor/artifacts";
const STORE = "/cursor/stores/self/artifacts/modals-v3";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(STORE, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "8778"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

let gateFailed = 0;

async function dismissIntro() {
  await page.goto("http://127.0.0.1:8778/?v=gw-cap3", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
  const intro = page.locator(".modal-overlay:not([hidden]) .modal__btn");
  if (await intro.count()) await intro.click();
  await settle();
}

async function settle() {
  await page.evaluate(() => {
    document.querySelectorAll(".gamewin").forEach((el) => {
      el.style.animation = "none";
      el.style.opacity = "1";
    });
    document.querySelectorAll(".toast").forEach((t) => t.remove());
  });
  await page.waitForTimeout(500);
}

/** @param {"day"|"night"} mode */
async function setTheme(mode) {
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
  await settle();
}

/** @param {"day"|"night"} mode @param {string} shotLabel */
async function assertTheme(mode, shotLabel) {
  const got = await page.evaluate(() => document.documentElement.dataset.time);
  if (got !== mode) {
    console.error(`  ✗ ${shotLabel}: expected theme ${mode}, got ${got}`);
    gateFailed++;
  }
}

/** @param {string} label */
async function runGates(label) {
  const r = await page.evaluate(GAMEWIN_AUDIT_FN);
  if (r.error) {
    console.error(`  ✗ ${label}: ${r.error}`);
    gateFailed++;
    return;
  }
  for (const f of r.stackFails) {
    console.error(`  ✗ ${label} stack: ${f}`);
    gateFailed++;
  }
  for (const f of r.fails) {
    console.error(
      `  ✗ ${label} contrast ${f.ratio}:1 < ${f.need}:1 — "${f.text}" (${f.where})`,
    );
    gateFailed++;
  }
  if (!r.stackFails.length && !r.fails.length) {
    console.log(`  ✓ ${label}: contrast ${r.pass}/${r.total}, stacking OK (theme=${r.theme})`);
  }
}

/** @param {string} name @param {"day"|"night"} mode @param {string} label */
async function snap(name, mode, label) {
  await assertTheme(mode, label);
  await runGates(label);
  await settle();
  const dests = [path.join(OUT, name), path.join(STORE, name)];
  for (const p of dests) {
    await page.screenshot({ path: p, scale: "css" });
  }
}

async function openSettings() {
  await page.click("#settings-gear");
  await page.waitForSelector(".settings-overlay:not([hidden]) .gamewin");
  await settle();
}

await dismissIntro();

await setTheme("day");
await openSettings();
await snap("ui-settings-game-390-day-all-on.png", "day", "settings all-on day");

await page.click("#set-music-tile");
await page.click("#set-amb-tile");
await page.click("#set-sfx-tile-vol .gw-pip[data-step='1']");
await snap("ui-settings-game-390-day-some-off.png", "day", "settings some-off day");

await setTheme("night");
await snap("ui-settings-game-390-night-some-off.png", "night", "settings some-off night");

await setTheme("day");
await page.click("#set-paste-toggle");
await page.waitForSelector("#set-import-panel:not([hidden])");
await snap("ui-settings-game-390-day-paste-open.png", "day", "settings paste day");

await page.click("#set-about");
await page.waitForSelector("#about-panel:not([hidden])");
await snap("ui-about-game-390-day.png", "day", "about day");

await setTheme("night");
await snap("ui-about-game-390-night.png", "night", "about night");

await page.click(".gamewin__back");
await page.waitForSelector("#settings-root:not([hidden])");
await page.click(".settings-overlay .gamewin__close");
await settle();

await setTheme("day");
await page.evaluate(() =>
  import("/src/ui/modal.js").then((m) =>
    m.queueWelcomeBack({ mins: 12, ducks: "1.2K", coins: "840" }),
  ),
);
await page.waitForSelector(".modal-overlay:not(.settings-overlay):not([hidden]) .gamewin");
await settle();
await snap("ui-modal-offline-390-day.png", "day", "offline day");

await setTheme("night");
await snap("ui-modal-offline-390-night.png", "night", "offline night");
await page.locator(".modal-overlay:not(.settings-overlay) [data-modal-close]").click();
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
await page.click(".confirm-overlay [data-confirm-cancel]");

await page.setViewportSize({ width: 1280, height: 800 });
await setTheme("day");
await openSettings();
await page.click("#set-music-tile");
await page.click("#set-amb-tile");
await snap("ui-settings-game-landscape-day.png", "day", "settings landscape day");

await browser.close();
server.kill();

if (gateFailed) {
  console.error(`\ncapture-game-modals: ${gateFailed} gate failure(s)`);
  process.exit(1);
}
console.log("\ncapture-game-modals: all gates passed");
console.log("artifacts:", OUT, "and", STORE);
