#!/usr/bin/env node
/** Portrait dock band vs panel body separation + dock label contrast. */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { contrastRatio } from "./lib/contrast.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = 8768;
const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

/** @param {string} a @param {string} b */
function colorsDiffer(a, b) {
  if (!a || !b) return false;
  return a.replace(/\s+/g, "") !== b.replace(/\s+/g, "");
}

/** @param {import("playwright").Page} page */
async function prep(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__mdCapture.playMidGame());
  await page.evaluate(() => window.__mdCapture.quietMilestones());
  await page.evaluate(async () => {
    const { openTab, setViewMode } = await import("/src/ui/render.js");
    openTab("flock");
    setViewMode("split");
  });
  await page.waitForTimeout(350);
}

const server = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: ROOT, stdio: "ignore" });

let failed = 0;
try {
  await new Promise((r) => setTimeout(r, 400));
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/google-chrome",
    headless: true,
  });
  for (const night of [false, true]) {
    const page = await browser.newPage();
    await page.addInitScript(captureHelper);
    await page.goto(`http://127.0.0.1:${PORT}/?v=ui27`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
      timeout: 15000,
    });
    await prep(page);
    if (night) {
      await page.evaluate(() => window.__mdCapture.quietMilestones());
      await page.evaluate(async () => {
        const { applyTimeOfDay } = await import("/src/ui/theme.js");
        applyTimeOfDay("night");
      });
      await page.waitForTimeout(400);
    }
    const sample = await page.evaluate(() => {
      const dock = document.querySelector(".dock");
      const panels = document.querySelector(".panels");
      const stage = document.querySelector(".stage");
      const active = document.querySelector(".dock .tab.is-active");
      const label = active?.querySelector(".tab__label");
      if (!dock || !panels || !stage || !active || !label) return { error: "missing nodes" };
      const dockBg = getComputedStyle(dock).backgroundColor;
      const panelBg = getComputedStyle(panels).backgroundColor;
      const stageBg = getComputedStyle(stage).backgroundColor;
      const tabBg = getComputedStyle(active).backgroundColor;
      const labelColor = getComputedStyle(label).color;
      return { dockBg, panelBg, stageBg, tabBg, labelColor, night: document.documentElement.dataset.time === "night" };
    });
    if (sample.error) {
      console.error("  ✗", sample.error);
      failed++;
    } else {
      const mode = night ? "night" : "day";
      if (!colorsDiffer(sample.dockBg, sample.panelBg)) {
        console.error(`  ✗ ${mode}: dock bg matches panel bg (${sample.dockBg})`);
        failed++;
      } else {
        console.log(`  ✓ ${mode}: dock band (${sample.dockBg}) ≠ panel (${sample.panelBg})`);
      }
      if (!colorsDiffer(sample.panelBg, sample.stageBg)) {
        console.error(`  ✗ ${mode}: panel bg matches chat stage (${sample.panelBg})`);
        failed++;
      } else {
        console.log(`  ✓ ${mode}: panel (${sample.panelBg}) ≠ chat stage (${sample.stageBg})`);
      }
      if (!colorsDiffer(sample.tabBg, sample.dockBg)) {
        console.error(`  ✗ ${mode}: active tab should differ from dock band`);
        failed++;
      } else {
        console.log(`  ✓ ${mode}: active tab stands off dock band`);
      }
      const tabLabels = await page.evaluate(() => {
        const out = [];
        for (const tab of document.querySelectorAll(".dock .tab:not([hidden])")) {
          const name = tab.getAttribute("data-tab");
          const label = tab.querySelector(".tab__label");
          if (!name || !label) continue;
          out.push({
            name,
            active: tab.classList.contains("is-active"),
            fg: getComputedStyle(label).color,
            bg: getComputedStyle(tab).backgroundColor,
          });
        }
        return out;
      });
      for (const t of tabLabels) {
        if (!t.active && t.name !== "flock" && t.name !== "regions") continue;
        const min = t.active ? 4.5 : 4;
        const tabRatio = contrastRatio(t.fg, t.bg);
        const tag = `${mode}${t.active ? " active" : ""}`;
        if (!Number.isFinite(tabRatio) || tabRatio < min) {
          console.error(`  ✗ ${tag}: tab ${t.name} label ${String(tabRatio)}:1 (need ${min}:1)`);
          failed++;
        } else {
          console.log(`  ✓ ${tag}: tab ${t.name} label ${tabRatio.toFixed(2)}:1`);
        }
      }
    }
    await page.close();
  }
  await browser.close();
} finally {
  server.kill("SIGTERM");
}

if (failed > 0) {
  console.error(`\ndock-panel-contrast: ${failed} failure(s)`);
  process.exit(1);
}
console.log("\ndock-panel-contrast: all checks passed");
