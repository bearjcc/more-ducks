#!/usr/bin/env node
/** Screenshot pass: three portrait view modes + representative tabs. */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8765/?v=ui23";
const OUT = "/opt/cursor/artifacts";
const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

/** @param {import('playwright').Page} page @param {"chat"|"split"|"manage"} mode */
async function setMode(page, mode) {
  await page.evaluate(async (m) => {
    const { setViewMode, openTab } = await import("/src/ui/render.js");
    if (m !== "chat" && !document.body.dataset.panelOpen) openTab("flock");
    setViewMode(m);
    window.__mdCapture?.clearToasts();
  }, mode);
  await page.waitForTimeout(400);
}

const shots = [
  { name: "ui23-flock-chat-390", tab: "flock", mode: "chat", setup: "mid" },
  { name: "ui23-flock-split-390", tab: "flock", mode: "split", setup: "mid" },
  { name: "ui23-flock-manage-390", tab: "flock", mode: "manage", setup: "mid" },
  { name: "ui23-upgrades-split-390", tab: "upgrades", mode: "split", setup: "mid" },
  { name: "ui23-marketing-manage-390", tab: "hype", mode: "manage", setup: "mid" },
  { name: "ui23-regions-split-390", tab: "regions", mode: "split", setup: "regions" },
  { name: "ui23-stats-manage-360", tab: "dashboard", mode: "manage", setup: "mid", w: 360, h: 800 },
  { name: "ui23-laptop-split-1440", tab: "flock", mode: "split", setup: "late", w: 1440, h: 900 },
];

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
});
const metrics = [];

for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.w ?? 390, height: shot.h ?? 844 },
  });
  await page.addInitScript(captureHelper);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
    timeout: 15000,
  });
  await page.evaluate(() => {
    localStorage.clear();
    document.querySelector(".ending")?.remove();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
    timeout: 15000,
  });
  if (shot.setup === "regions") {
    await page.evaluate(() => window.__mdCapture.playRegionsAbroad());
  } else if (shot.setup === "late") {
    await page.evaluate(() => window.__mdCapture.playLateGame());
  } else {
    await page.evaluate(() => window.__mdCapture.playMidGame());
    if (shot.tab === "hype") {
      await page.evaluate(() => window.MoreDucks.engine.currency("coins").incrementBy(500_000));
    }
  }
  await page.evaluate(() => window.__mdCapture.quietMilestones());
  await page.evaluate(async (tab) => {
    const { openTab } = await import("/src/ui/render.js");
    openTab(tab);
  }, shot.tab);
  await setMode(page, shot.mode);
  const m = await page.evaluate(() => {
    const panel = document.querySelector(".tab-panel.is-active");
    const rows = panel?.querySelectorAll(".card") ?? [];
    let visible = 0;
    const vh = window.innerHeight;
    for (const row of rows) {
      const r = row.getBoundingClientRect();
      if (r.height > 0 && r.top < vh && r.bottom > 0) visible++;
    }
    return {
      mode: document.body.dataset.viewMode,
      tab: document.body.dataset.panelOpen ?? null,
      visibleRows: visible,
      composer: getComputedStyle(document.querySelector(".bottom-tray")).display !== "none",
    };
  });
  metrics.push({ shot: shot.name, ...m });
  await page.screenshot({ path: `${OUT}/${shot.name}.png`, scale: "css" });
  await page.close();
}

writeFileSync(`${OUT}/ui23-capture-metrics.json`, JSON.stringify(metrics, null, 2));
console.log("Captured", shots.length, "screenshots →", OUT);
await browser.close();
