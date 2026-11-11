#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "8778"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

async function dismissIntro() {
  await page.goto("http://127.0.0.1:8778/?v=gw-cap2", { waitUntil: "domcontentloaded" });
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
  await page.waitForTimeout(450);
}

async function setTheme(mode) {
  await page.evaluate((m) => {
    window.MoreDucks.meta.settings.timeOfDay = m;
    document.body.dataset.time = m;
  }, mode);
  await settle();
}

async function snap(name) {
  await settle();
  await page.screenshot({ path: path.join(OUT, name), scale: "css" });
}

async function openSettings() {
  await page.click("#settings-gear");
  await page.waitForSelector(".settings-overlay:not([hidden]) .gamewin");
  await settle();
}

await dismissIntro();

await setTheme("day");
await openSettings();
await snap("ui-settings-game-390-day-all-on.png");

await page.click("#set-music-tile");
await page.click("#set-amb-tile");
await page.click("#set-sfx-tile-vol .gw-pip[data-step='1']");
await snap("ui-settings-game-390-day-some-off.png");

await setTheme("night");
await snap("ui-settings-game-390-night-some-off.png");

await page.click("#set-paste-toggle");
await page.waitForSelector("#set-import-panel:not([hidden])");
await snap("ui-settings-game-390-day-paste-open.png");

await page.click("#set-about");
await page.waitForSelector("#about-panel:not([hidden])");
await snap("ui-about-game-390-night.png");
await setTheme("day");
await snap("ui-about-game-390-day.png");

await page.click(".gamewin__back");
await page.waitForSelector("#settings-root:not([hidden])");
await page.click(".settings-overlay .gamewin__close");
await settle();

await page.evaluate(() =>
  import("/src/ui/modal.js").then((m) =>
    m.queueWelcomeBack({ mins: 12, ducks: "1.2K", coins: "840" }),
  ),
);
await page.waitForSelector(".modal-overlay:not(.settings-overlay):not([hidden])");
await settle();
await setTheme("day");
await snap("ui-modal-offline-390-day.png");
await setTheme("night");
await snap("ui-modal-offline-390-night.png");
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
await page.waitForSelector(".confirm-overlay:not([hidden])");
await setTheme("day");
await snap("ui-modal-confirm-reset-390-day.png");
await setTheme("night");
await snap("ui-modal-confirm-reset-390-night.png");
await page.click(".confirm-overlay [data-confirm-cancel]");

await page.setViewportSize({ width: 1280, height: 800 });
await setTheme("day");
await openSettings();
await page.click("#set-music-tile");
await page.click("#set-amb-tile");
await snap("ui-settings-game-landscape-day.png");

await browser.close();
server.kill();
console.log("game modal screenshots ->", OUT);
