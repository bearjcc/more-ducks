#!/usr/bin/env node
/**
 * Portrait view modes: chat / split / manage toggles, tab retention, overlap guard.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASE = "http://127.0.0.1:8765/?v=ui23";
const PORT = 8765;
const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

/** @param {import('playwright').Page} page */
async function viewState(page) {
  return page.evaluate(() => ({
    mode: document.body.dataset.viewMode,
    panel: document.body.dataset.panelOpen ?? null,
    trayHidden: (() => {
      const t = document.querySelector(".bottom-tray");
      return !t || getComputedStyle(t).display === "none";
    })(),
    activeTab: document.querySelector(".tab.is-active")?.getAttribute("data-tab") ?? null,
  }));
}

/** @param {import('playwright').Page} page @param {"chat"|"split"|"manage"} mode */
async function tapViewMode(page, mode) {
  const hdr = page.locator(`#view-mode-header .view-mode__btn[data-set-view="${mode}"]`);
  const dock = page.locator(`#view-mode-dock .view-mode__btn[data-set-view="${mode}"]`);
  if (await hdr.isVisible()) await hdr.click();
  else {
    await dock.waitFor({ state: "visible", timeout: 8000 });
    await dock.click();
  }
  await page.waitForTimeout(280);
}

/** @param {import('playwright').Page} page @param {string} tab */
async function openTab(page, tab) {
  await page.evaluate(async (name) => {
    const { openTab } = await import("/src/ui/render.js");
    openTab(name);
  }, tab);
  await page.waitForTimeout(300);
}

const server = spawn("python3", ["-m", "http.server", String(PORT)], {
  cwd: ROOT,
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 600));

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
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
  await page.evaluate(() => window.__mdCapture.playMidGame());
  await page.evaluate(() => window.__mdCapture.quietMilestones());
  await page.evaluate(async () => {
    const { updateTabUnlocks } = await import("/src/ui/render.js");
    const { engine, meta } = window.MoreDucks;
    updateTabUnlocks({
      meta,
      coins: engine.currency("coins").value,
      engine,
      answersPerSec: 1,
    });
  });
  await page.waitForFunction(() => {
    const dock = document.querySelector(".dock");
    return dock instanceof HTMLElement && !dock.hidden;
  }, null, { timeout: 8000 });

  let s = await viewState(page);
  if (s.mode !== "chat") throw new Error(`expected chat default, got ${JSON.stringify(s)}`);

  await openTab(page, "flock");
  s = await viewState(page);
  if (s.mode !== "split" || s.panel !== "flock" || s.activeTab !== "flock") {
    throw new Error(`openTab flock → split: ${JSON.stringify(s)}`);
  }
  if (s.trayHidden) throw new Error("composer hidden in split");

  await tapViewMode(page, "manage");
  s = await viewState(page);
  if (s.mode !== "manage" || s.panel !== "flock" || s.trayHidden !== true) {
    throw new Error(`manage mode: ${JSON.stringify(s)}`);
  }

  await tapViewMode(page, "chat");
  s = await viewState(page);
  if (s.mode !== "chat" || s.panel !== null || s.activeTab !== "flock") {
    throw new Error(`chat keeps tab: ${JSON.stringify(s)}`);
  }

  await page.evaluate(async () => {
    const { setViewMode } = await import("/src/ui/render.js");
    setViewMode("split");
  });
  await page.waitForTimeout(300);
  s = await viewState(page);
  if (s.mode !== "split" || s.panel !== "flock") {
    throw new Error(`split restores flock: ${JSON.stringify(s)}`);
  }

  await tapViewMode(page, "chat");
  await tapViewMode(page, "split");
  s = await viewState(page);
  if (s.mode !== "split") throw new Error(`dock toggle split: ${JSON.stringify(s)}`);

  await openTab(page, "upgrades");
  s = await viewState(page);
  if (s.panel !== "upgrades" || s.mode !== "split") {
    throw new Error(`tab switch retains split: ${JSON.stringify(s)}`);
  }

  const overlap = await page.evaluate(() => {
    const toggles = document.querySelectorAll(".view-mode__btn");
    const buy = document.querySelector(".card.is-affordable .card__buy");
    if (!buy || toggles.length === 0) return { ok: true, skip: true };
    const br = buy.getBoundingClientRect();
    for (const t of toggles) {
      if (t.hidden) continue;
      const tr = t.getBoundingClientRect();
      const hit = !(br.right <= tr.left || br.left >= tr.right || br.bottom <= tr.top || br.top >= tr.bottom);
      if (hit) return { ok: false, toggle: tr, buy: br };
    }
    return { ok: true };
  });
  if (!overlap.ok && !overlap.skip) {
    throw new Error(`view toggle overlaps buy: ${JSON.stringify(overlap)}`);
  }

  console.log("view-mode.test.mjs: all passed");
} finally {
  await browser.close();
  server.kill();
}
