#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "8766"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));

const browser = await chromium.launch({
  channel: "chrome",
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto("http://127.0.0.1:8766/?v=about-lic", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
const intro = page.locator(".modal-overlay:not([hidden]) .modal__btn");
if (await intro.count()) await intro.click();
await page.click("#settings-gear");
await page.click("#set-about");
await page.waitForSelector("#about-panel:not([hidden])");
await page.locator(".about__block--licences").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({
  path: path.join(OUT, "ui-about-licences-390-day.png"),
  scale: "css",
});
await browser.close();
server.kill();
console.log("saved ui-about-licences-390-day.png");
