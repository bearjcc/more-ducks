#!/usr/bin/env node
/**
 * Portrait bottom-sheet: chat bubbles must stay in the thread box above the composer,
 * never overlapping the fixed composer or the open panel sheet.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASE = "http://127.0.0.1:8765/?v=ui24";
const PORT = 8765;

/** @param {import('playwright').Page} page */
async function assertNoChatOverlap(page, label) {
  const result = await page.evaluate(() => {
    /** @param {DOMRect} a @param {{top:number,left:number,bottom:number,right:number}} b */
    function intersects(a, b) {
      return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    }
    function clipRect(inner, clip) {
      const top = Math.max(inner.top, clip.top);
      const bottom = Math.min(inner.bottom, clip.bottom);
      const left = Math.max(inner.left, clip.left);
      const right = Math.min(inner.right, clip.right);
      if (bottom <= top || right <= left) return null;
      return { top, left, bottom, right };
    }
    if (!document.body.hasAttribute("data-panel-open")) {
      return { ok: true, label: "closed" };
    }
    const tray = document.querySelector(".bottom-tray");
    const sheet = document.querySelector(".panels");
    const thread = document.querySelector(".chat-thread");
    if (!tray || !sheet || !thread) {
      return { ok: false, error: "missing tray/sheet/thread" };
    }
    const trayRect = tray.getBoundingClientRect();
    const sheetRect = sheet.getBoundingClientRect();
    const threadRect = thread.getBoundingClientRect();
    /** @type {{ text: string, issue: string }[]} */
    const hits = [];
    for (const msg of document.querySelectorAll(".chat-msg")) {
      const raw = msg.getBoundingClientRect();
      const clipped = clipRect(raw, threadRect);
      if (!clipped) continue;
      const text = (msg.textContent ?? "").trim().slice(0, 40);
      if (intersects(clipped, trayRect)) hits.push({ text, issue: "composer-tray" });
      if (intersects(clipped, sheetRect)) hits.push({ text, issue: "sheet" });
    }
    return { ok: hits.length === 0, hits, threadBottom: threadRect.bottom, trayTop: trayRect.top };
  });
  if (!result.ok) {
    throw new Error(`${label}: chat layout overlap ${JSON.stringify(result)}`);
  }
}

/** @param {import('playwright').Page} page @param {string} tab */
async function openTab(page, tab) {
  await page.evaluate(async (name) => {
    const { openTab } = await import("/src/ui/render.js");
    if (document.body.dataset.panelOpen !== name) openTab(name);
  }, tab);
  await page.waitForTimeout(350);
}

const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

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
  await page.evaluate(() => window.__mdCapture.playRegionsOceanSpace());
  await openTab(page, "regions");

  const scrollChecks = [0, 99999];
  for (const top of scrollChecks) {
    await page.evaluate((t) => {
      const el = document.querySelector(".chat-thread");
      if (el) el.scrollTop = t;
    }, top);
    await page.waitForTimeout(120);
    await assertNoChatOverlap(page, `regions scrollTop=${top}`);
  }

  for (const tab of ["dashboard", "flock", "hype", "upgrades", "collections"]) {
    await openTab(page, tab);
    await page.evaluate(() => {
      const el = document.querySelector(".chat-thread");
      if (el) el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(120);
    await assertNoChatOverlap(page, tab);
  }

  await openTab(page, "dashboard");
  const feedOk = await page.evaluate(() => {
    const feed = document.querySelector(".dash-stat--feed");
    if (!feed || feed.hidden) return { ok: true, skip: true };
    const val = feed.querySelector(".dash-stat__value");
    const label = feed.querySelector(".dash-stat__label");
    if (!val || !label) return { ok: false, error: "missing feed nodes" };
    const vr = val.getBoundingClientRect();
    const lr = label.getBoundingClientRect();
    const overlap = !(vr.bottom <= lr.top + 0.5 || lr.bottom <= vr.top + 0.5)
      && vr.left < lr.right && lr.left < vr.right;
    return { ok: !overlap, overlap, valH: vr.height, labelTop: lr.top, valBottom: vr.bottom };
  });
  if (!feedOk.ok && !feedOk.skip) {
    throw new Error(`feed/sec layout overlap ${JSON.stringify(feedOk)}`);
  }

  console.log("chat-panel-layout.test.mjs: all passed");
} finally {
  await browser.close();
  server.kill();
}
