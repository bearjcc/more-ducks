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

async function openSettings() {
  await page.goto("http://127.0.0.1:8765/?v=audio", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
  const modalBtn = page.locator(".modal-overlay:not([hidden]) .modal__btn");
  if (await modalBtn.count()) await modalBtn.click();
  await page.waitForTimeout(300);
  await page.click("#settings-gear");
  await page.waitForSelector(".settings-overlay:not([hidden])");
}

async function snap(name) {
  await page.screenshot({ path: path.join(OUT, name), scale: "css" });
}

await openSettings();
await snap("ui-audio-settings-390-day.png");

await page.evaluate(() => {
  const meta = window.MoreDucks.meta;
  meta.settings.timeOfDay = "night";
  document.body.dataset.time = "night";
});
await page.waitForTimeout(200);
await snap("ui-audio-settings-390-night.png");

await page.click("details.settings__credits summary");
await page.waitForTimeout(150);
await snap("ui-audio-credits-390-night.png");

await page.evaluate(() => {
  document.body.dataset.time = "day";
});
await page.waitForTimeout(150);
await snap("ui-audio-credits-390-day.png");

await browser.close();
server.kill();
console.log("wrote audio settings screenshots to", OUT);
