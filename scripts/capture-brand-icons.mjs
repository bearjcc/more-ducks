#!/usr/bin/env node
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { readFileSync } from "node:fs";
import { forceTheme } from "./lib/theme-capture.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = "/opt/cursor/artifacts";
const STORE = "/cursor/stores/self/artifacts/brand-icons";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(STORE, { recursive: true });

const captureHelper = readFileSync(path.join(ROOT, "scripts/capture-page.js"), "utf8");

const server = spawn("python3", ["-m", "http.server", "8782"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 400));

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(captureHelper);

async function snap(name) {
  for (const p of [path.join(OUT, name), path.join(STORE, name)]) {
    await page.screenshot({ path: p, scale: "css" });
  }
}

async function prep() {
  await page.goto("http://127.0.0.1:8782/?v=brand-cap2", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
  const intro = page.locator(".modal-overlay:not([hidden]) .modal__btn");
  if (await intro.count()) await intro.click();
  await page.evaluate(async () => {
    await window.__mdCapture.playMidGame();
    window.MoreDucks.engine.currency("coins").incrementBy(50000);
    const { closeTab } = await import("/src/ui/render.js");
    closeTab();
    window.__mdCapture.clearToasts();
  });
  await page.waitForTimeout(200);
}

await prep();
await forceTheme(page, "day");
await page.evaluate(async () => {
  const { flushModalQueue } = await import("/src/ui/modal.js");
  flushModalQueue();
});
await page.waitForTimeout(150);
await snap("ui-brand-hud-coin-day-390.png");

await forceTheme(page, "night");
await page.waitForTimeout(150);
await snap("ui-brand-hud-coin-night-390.png");

async function snapUpgradeCard(mode) {
  await forceTheme(page, mode);
  await page.evaluate(async () => {
    const { openTab, setViewMode } = await import("/src/ui/render.js");
    const { flushModalQueue } = await import("/src/ui/modal.js");
    flushModalQueue();
    openTab("upgrades");
    setViewMode("split");
  });
  await page.waitForFunction(
    () => document.body.dataset.viewMode === "split" && !document.querySelector('[data-panel="upgrades"][hidden]'),
    null,
    { timeout: 5000 },
  );
  await page.waitForSelector("#upgrade-list .card .coin-cost, #upgrade-list .card__cost", { timeout: 5000 });
  await page.waitForTimeout(250);
  await snap(`ui-brand-upgrade-card-${mode}-390.png`);
}

await snapUpgradeCard("night");
await snapUpgradeCard("day");

for (const name of ["icon-192.png", "icon-512.png", "favicon-32.png"]) {
  const src = path.join(ROOT, "assets", name);
  const dest = path.join(STORE, `manifest-${name}`);
  fs.copyFileSync(src, dest);
  fs.copyFileSync(src, path.join(OUT, `manifest-${name}`));
}

await browser.close();
server.kill();
console.log("brand captures →", STORE, OUT);