#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = "/opt/cursor/artifacts";
const STORE = "/cursor/stores/self/artifacts/brand-icons";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(STORE, { recursive: true });

const server = spawn("python3", ["-m", "http.server", "8782"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 400));

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

async function snap(name) {
  for (const p of [path.join(OUT, name), path.join(STORE, name)]) {
    await page.screenshot({ path: p, scale: "css" });
  }
}

async function prep() {
  await page.goto("http://127.0.0.1:8782/?v=brand-cap", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
  const intro = page.locator(".modal-overlay:not([hidden]) .modal__btn");
  if (await intro.count()) await intro.click();
  await page.evaluate(async () => {
    const { applyTimeOfDay } = await import("/src/ui/theme.js");
    window.MoreDucks.engine.currency("coins").incrementBy(50000);
    applyTimeOfDay("day");
  });
  await page.waitForTimeout(300);
}

await prep();
await snap("ui-brand-hud-coin-day-390.png");

await page.evaluate(async () => {
  const { applyTimeOfDay } = await import("/src/ui/theme.js");
  applyTimeOfDay("night");
});
await page.waitForTimeout(350);
await snap("ui-brand-hud-coin-night-390.png");

await page.evaluate(async () => {
  const { openTab } = await import("/src/ui/render.js");
  openTab("upgrades");
});
await page.waitForTimeout(400);
await snap("ui-brand-upgrade-card-night-390.png");

await page.evaluate(async () => {
  const { applyTimeOfDay } = await import("/src/ui/theme.js");
  applyTimeOfDay("day");
});
await page.waitForTimeout(350);
await snap("ui-brand-upgrade-card-day-390.png");

for (const name of ["icon-192.png", "icon-512.png", "favicon-32.png"]) {
  const src = path.join(ROOT, "assets", name);
  const dest = path.join(STORE, `manifest-${name}`);
  fs.copyFileSync(src, dest);
  fs.copyFileSync(src, path.join(OUT, `manifest-${name}`));
}

await browser.close();
server.kill();
console.log("brand captures →", STORE, OUT);