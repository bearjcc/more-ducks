#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASE = "http://127.0.0.1:8765/?v=ui25";
const PORT = 8765;
const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

/** @param {import('playwright').Page} page */
async function viewState(page) {
  return page.evaluate(() => ({
    mode: document.body.dataset.viewMode,
    panel: document.body.dataset.panelOpen ?? null,
    activeTab: document.querySelector(".tab.is-active")?.getAttribute("data-tab") ?? null,
    upDisabled: document.querySelector(".sheet-rim__arrow--up:not(:disabled)") === null,
    downDisabled: document.querySelector(".sheet-rim__arrow--down:not(:disabled)") === null,
  }));
}

/** @param {import('playwright').Page} page @param {"up"|"down"} dir */
async function clickArrow(page, dir) {
  const vis = page.locator(`.sheet-rim__arrow--${dir}:visible`).first();
  await vis.click();
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
  await page.evaluate(async () => {
    const { updateTabUnlocks } = await import("/src/ui/render.js");
    await window.__mdCapture.playMidGame();
    window.__mdCapture.quietMilestones();
    const { engine, meta } = window.MoreDucks;
    updateTabUnlocks({ meta, coins: engine.currency("coins").value, engine, answersPerSec: 2 });
  });
  await openTab(page, "flock");

  await page.evaluate(async () => {
    const { setViewMode } = await import("/src/ui/render.js");
    setViewMode("chat");
  });
  await page.waitForTimeout(200);

  let s = await viewState(page);
  if (s.mode !== "chat" || s.activeTab !== "flock") {
    throw new Error(`chat baseline: ${JSON.stringify(s)}`);
  }
  if (!s.downDisabled) throw new Error("down should be disabled in chat");

  await clickArrow(page, "up");
  s = await viewState(page);
  if (s.mode !== "split" || s.panel !== "flock") throw new Error(`up→split: ${JSON.stringify(s)}`);

  await clickArrow(page, "up");
  s = await viewState(page);
  if (s.mode !== "manage") throw new Error(`up→manage: ${JSON.stringify(s)}`);
  if (!s.upDisabled) throw new Error("up should be disabled in manage");

  await clickArrow(page, "down");
  s = await viewState(page);
  if (s.mode !== "split") throw new Error(`down→split: ${JSON.stringify(s)}`);

  await clickArrow(page, "down");
  s = await viewState(page);
  if (s.mode !== "chat" || s.activeTab !== "flock") {
    throw new Error(`down→chat keeps tab: ${JSON.stringify(s)}`);
  }

  const sep = await page.evaluate(() => {
    const up = document.querySelector("#sheet-rim-dock .sheet-rim__arrow--up");
    const down = document.querySelector("#sheet-rim-dock .sheet-rim__arrow--down");
    if (!up || !down) return { ok: true, skip: true };
    const ur = up.getBoundingClientRect();
    const dr = down.getBoundingClientRect();
  const overlap = !(ur.right <= dr.left + 0.5 || dr.right <= ur.left + 0.5);
    return { ok: !overlap, ur, dr };
  });
  if (!sep.ok && !sep.skip) throw new Error(`arrow overlap ${JSON.stringify(sep)}`);

  await page.evaluate(async () => {
    const { setViewMode, stepViewMode, getViewMode } = await import("/src/ui/render.js");
    setViewMode("split");
    stepViewMode("up");
    stepViewMode("up");
    if (getViewMode() !== "manage") throw new Error("no wrap up");
    stepViewMode("down");
    stepViewMode("down");
    stepViewMode("down");
    if (getViewMode() !== "chat") throw new Error("no wrap down");
  });

  console.log("view-mode.test.mjs: all passed");
} finally {
  await browser.close();
  server.kill();
}
