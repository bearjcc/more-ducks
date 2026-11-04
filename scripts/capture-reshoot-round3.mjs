#!/usr/bin/env node
/** Re-shoot portrait frames that show an open bottom sheet (chat composer lifted). */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = "http://127.0.0.1:8765/?v=ui22";
const OUT = "/opt/cursor/artifacts";
const P = { width: 390, height: 844 };
const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
});
const page = await browser.newPage();
await page.addInitScript(captureHelper);

async function snap(name) {
  await page.setViewportSize(P);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/${name}.png`, scale: "css" });
}
async function resetSave() {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    document.querySelector(".ending")?.remove();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine && window.__mdCapture, null, {
    timeout: 15000,
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__mdCapture.dismissModals());
}
async function openTab(name) {
  await page.evaluate(async (tab) => {
    const { openTab } = await import("/src/ui/render.js");
    if (document.body.dataset.panelOpen !== tab) openTab(tab);
  }, name);
  await page.waitForTimeout(350);
}

await resetSave();
await page.evaluate(() => window.__mdCapture.playEarlyUnlock());
await openTab("upgrades");
await page.evaluate(() => window.__mdCapture.clearToasts());
await snap("04-portrait-first-panel-unlock");
await page.evaluate(() => window.__mdCapture.playMidGame());
for (const [file, tab] of [
  ["05-portrait-tab-stats", "dashboard"],
  ["06-portrait-tab-flock", "flock"],
  ["07-portrait-tab-marketing", "hype"],
  ["08-portrait-tab-upgrades", "upgrades"],
  ["09-portrait-tab-regions", "regions"],
  ["10-portrait-tab-collections", "collections"],
]) {
  await openTab(tab);
  if (tab === "regions") {
    await page.evaluate(() => {
      const { meta, engine } = window.MoreDucks;
      meta.era = 4;
      meta.regionsUnlocked = ["home", "europe", "asia"];
      meta.regionsRented = ["europe"];
      engine.currency("coins").incrementBy(12_000_000);
    });
    await page.waitForTimeout(200);
  }
  if (tab === "collections") {
    await page.evaluate(() => {
      document.getElementById("duckdex-grid")?.scrollIntoView({ block: "center" });
    });
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => window.__mdCapture.clearToasts());
  await snap(file);
}

await resetSave();
await page.evaluate(() => window.__mdCapture.playRegionsAbroad());
await openTab("regions");
await page.evaluate(() => window.__mdCapture.clearToasts());
await snap("20-portrait-regions-abroad");
await page.evaluate(() => window.__mdCapture.playRegionsAustralia());
await snap("21-portrait-regions-australia");
await page.evaluate(() => window.__mdCapture.playRegionsOceanSpace());
await openTab("regions");
await page.evaluate(() => window.__mdCapture.clearToasts());
await snap("22-portrait-regions-ocean-space");

await resetSave();
await page.evaluate(async () => {
  await window.__mdCapture.playMidGame();
  const { meta, engine, mods, advanceGame } = window.MoreDucks;
  meta.era = 3;
  meta.flags.upgradesTabToast = true;
  engine.currency("coins").incrementBy(5_000_000);
  const { buyUpgrade } = await import("/src/game/upgrades.js");
  buyUpgrade(engine, meta, mods, "scalinglaws");
  advanceGame(0.2);
  await window.__mdCapture.dismissModals();
  window.__mdCapture.clearToasts();
});
await openTab("upgrades");
await snap("31-portrait-tab-research-upgrades");

await page.close();
await browser.close();
console.log("reshoot round3 ok");
