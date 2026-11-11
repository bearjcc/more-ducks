#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "8765"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

async function dismissModal() {
  const btn = page.locator(".modal-overlay:not([hidden]) .modal__btn");
  if (await btn.count()) await btn.click();
  await page.waitForTimeout(250);
}

async function openSettings() {
  await page.goto("http://127.0.0.1:8765/?v=about-ui", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
  await dismissModal();
  await page.click("#settings-gear");
  await page.waitForSelector(".settings-overlay:not([hidden])");
}

async function snap(name) {
  await page.screenshot({ path: path.join(OUT, name), scale: "css" });
}

async function setTheme(mode) {
  await page.evaluate((m) => {
    const meta = window.MoreDucks.meta;
    meta.settings.timeOfDay = m;
    document.body.dataset.time = m;
  }, mode);
  await page.waitForTimeout(200);
}

await openSettings();
await setTheme("day");
await snap("ui-settings-about-entry-390-day.png");

await page.click("#set-about");
await page.waitForSelector("#about-panel:not([hidden])");
await snap("ui-about-page-390-day.png");

await setTheme("night");
await openSettings();
await page.click("#set-about");
await page.waitForSelector("#about-panel:not([hidden])");
await snap("ui-about-page-390-night.png");

await setTheme("night");
await openSettings();
await snap("ui-settings-about-entry-390-night.png");

async function snapAboutScrolled(name) {
  await page.evaluate(() => {
    const panel = document.getElementById("about-panel");
    if (panel) panel.scrollTop = panel.scrollHeight;
  });
  await page.waitForTimeout(150);
  await snap(name);
}

await openSettings();
await setTheme("day");
await page.click("#set-about");
await page.waitForSelector("#about-panel:not([hidden])");
await snapAboutScrolled("ui-about-page-bottom-390-day.png");

await setTheme("night");
await page.evaluate(() => {
  document.getElementById("about-panel")?.scrollTo(0, 0);
});
await snapAboutScrolled("ui-about-page-bottom-390-night.png");

await browser.close();
server.kill();
console.log("about ui screenshots in", OUT);
