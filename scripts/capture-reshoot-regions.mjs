#!/usr/bin/env node
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
await page.evaluate(() => window.__mdCapture.playRegionsAbroad());
await openTab("regions");
await page.evaluate(() => window.__mdCapture.clearToasts());
await snap("20-portrait-regions-abroad");
await page.evaluate(() => window.__mdCapture.applyAustraliaFlooded());
await openTab("regions");
await page.evaluate(() => window.__mdCapture.clearToasts());
await snap("21-portrait-regions-australia");
await page.evaluate(() => window.__mdCapture.applyOceanSpaceReady());
await openTab("regions");
await page.evaluate(() => {
  window.__mdCapture.clearToasts();
  const panel = document.querySelector('.tab-panel[data-panel="regions"].is-active');
  const spaceCard = panel?.querySelector('[data-region="space"]')?.closest(".card");
  spaceCard?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(250);
await snap("22-portrait-regions-ocean-space");

await page.close();
await browser.close();
console.log("regions reshoot ok");
