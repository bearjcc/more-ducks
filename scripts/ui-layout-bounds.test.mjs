#!/usr/bin/env node
/**
 * Playwright bounds: composer vs mode bar, half/half split, focus + keyboard sim.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = 8765;
const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

/** @param {DOMRect} a @param {{top:number,bottom:number,left:number,right:number}} b */
function intersects(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

/** @param {import('playwright').Page} page */
async function rects(page) {
  return page.evaluate(() => {
    const r = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const vh = window.innerHeight;
    const hud = r(".hud");
    const input = r(".chat-input__field");
    const send = r(".chat-input__send");
    const auto = r(".chat-input__auto");
    const tray = r(".bottom-tray");
    const rimDock = r("#sheet-rim-dock");
    const rimUp = r(".sheet-rim__arrow--up");
    const panel = r(".panels");
    const header = r(".panel-header");
    const thread = r(".chat-thread");
    return {
      vh,
      mode: document.body.dataset.viewMode,
      panelOpen: document.body.dataset.panelOpen ?? null,
      hudH: hud?.height ?? 0,
      hudBottom: hud?.bottom ?? 0,
      tray,
      input,
      send,
      auto,
      rimDock,
      rimUp,
      panel,
      header,
      thread,
    };
  });
}

/** @param {import('playwright').Page} page */
async function assertNoOverlap(page, aSel, bSel, label) {
  const hit = await page.evaluate(
    ({ aSel, bSel }) => {
      const a = document.querySelector(aSel)?.getBoundingClientRect();
      const b = document.querySelector(bSel)?.getBoundingClientRect();
      if (!a || !b) return { ok: false, error: "missing" };
      const x = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      return { ok: !x, a, b };
    },
    { aSel, bSel },
  );
  if (!hit.ok) throw new Error(`${label}: overlap ${JSON.stringify(hit)}`);
}

/** @param {import('playwright').Page} page @param {string} mode */
async function setMode(page, mode) {
  await page.evaluate(async (m) => {
    const { setViewMode, openTab } = await import("/src/ui/render.js");
    if (m !== "chat" && !document.body.dataset.panelOpen) openTab("flock");
    setViewMode(m);
  }, mode);
  await page.waitForTimeout(320);
}

/** @param {import('playwright').Page} page @param {number} w @param {number} h */
async function prepMid(page, w, h) {
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate(async () => {
    const { updateTabUnlocks } = await import("/src/ui/render.js");
    await window.__mdCapture.playMidGame();
    window.__mdCapture.quietMilestones();
    const { engine, meta } = window.MoreDucks;
    updateTabUnlocks({ meta, coins: engine.currency("coins").value, engine, answersPerSec: 2 });
  });
  await page.waitForTimeout(200);
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
  for (const vp of [
    { w: 390, h: 844, tag: "390x844" },
    { w: 360, h: 800, tag: "360x800" },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.addInitScript(captureHelper);
    await page.goto(`http://127.0.0.1:${PORT}/?v=ui25`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
      timeout: 15000,
    });
    await page.evaluate(() => {
      localStorage.clear();
      document.querySelector(".ending")?.remove();
    });
    await page.reload();
    await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
      timeout: 15000,
    });

    await prepMid(page, vp.w, vp.h);
    await setMode(page, "split");
    const split = await rects(page);
    const half = split.vh / 2;
    const panelTop = split.panel?.top ?? 0;
    const trayBottom = split.tray?.bottom ?? 0;
    const gap = panelTop - trayBottom;
    if (gap > 3 || gap < -2) {
      throw new Error(`${vp.tag} split gap tray→panel: ${gap.toFixed(1)}px (want ~0)`);
    }
    const lowerH = split.vh - panelTop;
    const upperH = trayBottom - split.hudBottom;
    const ratio = upperH / lowerH;
    if (ratio < 0.85 || ratio > 1.15) {
      throw new Error(`${vp.tag} split ratio upper/lower ${ratio.toFixed(2)} (want ~1)`);
    }
  const stageTraySeam = await page.evaluate(() => {
    const stage = document.querySelector(".stage")?.getBoundingClientRect();
    const tray = document.querySelector(".bottom-tray")?.getBoundingClientRect();
    if (!stage || !tray) return { ok: false, delta: null };
    const delta = tray.top - stage.bottom;
    return { ok: Math.abs(delta) <= 2, delta };
  });
  if (!stageTraySeam.ok) {
    throw new Error(`${vp.tag} stage→tray seam ${stageTraySeam.delta}px (want ≤2px)`);
  }

    await setMode(page, "manage");
    const mg = await rects(page);
    const hudGap = (mg.panel?.top ?? 0) - mg.hudBottom;
    if (hudGap > 2) throw new Error(`${vp.tag} manage HUD gap ${hudGap}px`);
    const trayHidden = await page.evaluate(
      () => getComputedStyle(document.querySelector(".bottom-tray")).display === "none",
    );
    if (!trayHidden) throw new Error(`${vp.tag} tray visible in manage`);

    const arrowTouch = await page.evaluate(() => {
      const up = document.querySelector(".panel-header .sheet-rim__arrow--up");
      const buy = document.querySelector(".card__buy");
      if (!up) return { ok: true, skip: true };
      const ur = up.getBoundingClientRect();
      if (ur.width < 40 || ur.height < 28) return { ok: false, size: ur };
      if (!buy) return { ok: true, ur };
      const br = buy.getBoundingClientRect();
      const hit = !(ur.right <= br.left || ur.left >= br.right || ur.bottom <= br.top || ur.top >= br.bottom);
      return { ok: !hit, ur, br };
    });
    if (!arrowTouch.ok && !arrowTouch.skip) {
      throw new Error(`${vp.tag} arrow touches buy ${JSON.stringify(arrowTouch)}`);
    }

    const tabKeep = await page.evaluate(async () => {
      const { setViewMode, getViewMode } = await import("/src/ui/render.js");
      const start = document.querySelector(".tab.is-active")?.getAttribute("data-tab");
      setViewMode("chat");
      setViewMode("manage");
      setViewMode("split");
      const end = document.querySelector(".tab.is-active")?.getAttribute("data-tab");
      return { start, end, mode: getViewMode() };
    });
    if (tabKeep.start !== tabKeep.end) {
      throw new Error(`${vp.tag} tab not retained ${JSON.stringify(tabKeep)}`);
    }

    await setMode(page, "chat");
    await assertNoOverlap(page, ".chat-input__field", ".sheet-rim__arrow", `${vp.tag} chat input vs rim`);
    await assertNoOverlap(page, ".chat-input__send", ".sheet-rim__arrow", `${vp.tag} send vs rim`);
    await assertNoOverlap(page, ".chat-input__auto", ".sheet-rim__arrow", `${vp.tag} auto vs rim`);

    const focusOk = await page.evaluate(() => {
      const field = document.querySelector(".chat-input__field");
      if (!(field instanceof HTMLInputElement)) return false;
      field.focus();
      return document.activeElement === field;
    });
    if (!focusOk) throw new Error(`${vp.tag} composer focus failed`);

    await page.close();
  }

  // Night: no day-bright chrome leaking between chat log and composer (all view modes)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(captureHelper);
    await page.goto(`http://127.0.0.1:${PORT}/?v=ui27`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
      timeout: 15000,
    });
    await page.evaluate(() => {
      localStorage.clear();
      document.querySelector(".ending")?.remove();
    });
    await page.reload();
    await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
      timeout: 15000,
    });
    await prepMid(page, 390, 844);
    await page.evaluate(() => window.__mdCapture.quietMilestones());
    await page.evaluate(async () => {
      const { applyTimeOfDay } = await import("/src/ui/theme.js");
      applyTimeOfDay("night");
    });
    await page.waitForTimeout(400);
    for (const mode of ["chat", "split", "manage"]) {
      await setMode(page, mode);
      const leak = await page.evaluate((m) => {
        const relLum = (c) => {
          const okLab = c.match(/^oklab\(\s*([\d.]+)/i)?.[1];
          if (okLab) return parseFloat(okLab);
          const okLch = c.match(/^oklch\(\s*([\d.]+)/i)?.[1];
          if (okLch) return parseFloat(okLch);
          const parts = c.match(/rgba?\(([^)]+)\)/)?.[1]?.split(",").map((s) => parseFloat(s.trim()));
          const rgb = parts && parts.length >= 3 ? parts.slice(0, 3) : [255, 255, 255];
          const chan = rgb.map((v) => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
        };
        /** @type {{ where: string, lum: number, bg: string }[]} */
        const samples = [];
        const stage = document.querySelector(".stage");
        const tray = document.querySelector(".bottom-tray");
        if (stage && getComputedStyle(stage).display !== "none") {
          const bg = getComputedStyle(stage).backgroundColor;
          samples.push({ where: "stage", lum: relLum(bg), bg });
        }
        if (tray && getComputedStyle(tray).display !== "none") {
          const bg = getComputedStyle(tray).backgroundColor;
          samples.push({ where: "tray", lum: relLum(bg), bg });
        }
        if (m === "split") {
          const thread = document.querySelector(".chat-thread");
          const trayEl = document.querySelector(".bottom-tray");
          if (thread && trayEl) {
            const tr = thread.getBoundingClientRect();
            const br = trayEl.getBoundingClientRect();
            const y = (tr.bottom + br.top) / 2;
            const x = Math.round(window.innerWidth / 2);
            const hit = document.elementFromPoint(x, y);
            if (hit) {
              const bg = getComputedStyle(/** @type {Element} */ (hit)).backgroundColor;
              samples.push({ where: `seam:${hit.className || hit.tagName}`, lum: relLum(bg), bg });
            }
          }
        }
        return {
          mode: m,
          night: document.documentElement.dataset.time === "night",
          samples,
        };
      }, mode);
      if (!leak.night) throw new Error("night mode not active");
      for (const s of leak.samples) {
        if (s.lum > 0.68) {
          throw new Error(`night ${mode} ${s.where} too bright L=${s.lum.toFixed(2)} ${s.bg}`);
        }
      }
    }
    await page.close();
  }

  // Keyboard-height simulation (separate page — does not poison layout vars)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(captureHelper);
    await page.goto(`http://127.0.0.1:${PORT}/?v=ui25`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
      timeout: 15000,
    });
    await prepMid(page, 390, 844);
    await setMode(page, "chat");
    await page.evaluate(() => {
      window.dispatchEvent(new Event("resize"));
      document.documentElement.style.setProperty("--kb-sim", "0.62");
    });
    await assertNoOverlap(page, ".chat-input__field", ".sheet-rim__arrow", "keyboard-sim overlap");
    await page.close();
  }

  // Fresh pre-unlock: dock hidden
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(captureHelper);
    await page.goto(`http://127.0.0.1:${PORT}/?v=ui25`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
    const fresh = await page.evaluate(() => ({
      dockHidden: document.querySelector(".dock")?.hidden,
      rimBar: document.querySelector("#sheet-rim-dock")?.hidden,
    }));
    if (!fresh.dockHidden) throw new Error("fresh dock should be hidden");
    if (!fresh.rimBar) throw new Error("fresh rim should hide with dock");
    await page.close();
  }

  // Laptop wide
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(captureHelper);
    await page.goto(`http://127.0.0.1:${PORT}/?v=ui25`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
      timeout: 15000,
    });
    await prepMid(page, 1440, 900);
    await setMode(page, "split");
    const ok = await page.evaluate(() => {
      const stage = document.querySelector(".stage")?.getBoundingClientRect();
      const panels = document.querySelector(".panels")?.getBoundingClientRect();
      return stage && panels && stage.right <= panels.left + 1;
    });
    if (!ok) throw new Error("laptop: expected two-column stage left of panels");
    await page.close();
  }

  console.log("ui-layout-bounds.test.mjs: all passed");
} finally {
  await browser.close();
  server.kill();
}
