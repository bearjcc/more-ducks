#!/usr/bin/env node
/** Dock tab band + panel layer screenshots (day + night). */
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = "http://127.0.0.1:8765/?v=ui27";
const OUT = "/opt/cursor/artifacts";
const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

/** @param {import("playwright").Page} page @param {"chat"|"split"|"manage"} mode */
async function setMode(page, mode) {
  await page.evaluate(async (m) => {
    const { setViewMode, openTab } = await import("/src/ui/render.js");
    if (m !== "chat" && !document.body.dataset.panelOpen) openTab("flock");
    setViewMode(m);
    window.__mdCapture?.clearToasts();
  }, mode);
  await page.waitForTimeout(400);
}

/** @typedef {{ name: string, tab: string, mode: string, setup?: string, w?: number, h?: number, night?: boolean }} Shot */

/** @type {Shot[]} */
const shots = [
  { name: "ui27-flock-chat-390-day", tab: "flock", mode: "chat", setup: "mid" },
  { name: "ui27-flock-chat-390-night", tab: "flock", mode: "chat", setup: "mid", night: true },
  { name: "ui27-flock-split-390-day", tab: "flock", mode: "split", setup: "mid" },
  { name: "ui27-flock-split-390-night", tab: "flock", mode: "split", setup: "mid", night: true },
  { name: "ui27-flock-manage-390-day", tab: "flock", mode: "manage", setup: "mid" },
  { name: "ui27-flock-manage-390-night", tab: "flock", mode: "manage", setup: "mid", night: true },
  { name: "ui27-upgrades-split-390-day", tab: "upgrades", mode: "split", setup: "mid" },
  { name: "ui27-upgrades-split-390-night", tab: "upgrades", mode: "split", setup: "mid", night: true },
  { name: "ui27-laptop-split-1440-day", tab: "flock", mode: "split", setup: "late", w: 1440, h: 900 },
  { name: "ui27-laptop-split-1440-night", tab: "flock", mode: "split", setup: "late", w: 1440, h: 900, night: true },
];

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
});

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
  if (shot.setup === "late") {
    await page.evaluate(() => window.__mdCapture.playLateGame());
  } else {
    await page.evaluate(() => window.__mdCapture.playMidGame());
  }
  await page.evaluate(() => window.__mdCapture.quietMilestones());
  if (shot.night) {
    await page.evaluate(() => window.__mdCapture.quietMilestones());
    await page.click("#time-toggle");
    await page.waitForTimeout(450);
  }
  await page.evaluate(async (tab) => {
    const { openTab } = await import("/src/ui/render.js");
    openTab(tab);
  }, shot.tab);
  await setMode(page, shot.mode);
  await page.screenshot({ path: `${OUT}/${shot.name}.png`, scale: "css" });
  await page.close();
}

writeFileSync(`${OUT}/ui27-capture-manifest.txt`, shots.map((s) => s.name + ".png").join("\n"));
console.log("Captured", shots.length, "→", OUT);
await browser.close();
