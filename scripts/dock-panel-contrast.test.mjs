#!/usr/bin/env node
/** Portrait dock band vs panel body separation + dock label contrast. */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

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
    await page.goto(`http://127.0.0.1:${PORT}/?v=ui26`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__mdCapture && window.MoreDucks?.engine, null, {
      timeout: 15000,
    });
    await prep(page);
    if (night) {
      await page.evaluate(() => window.__mdCapture.quietMilestones());
      await page.click("#time-toggle");
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
      const ratio = await page.evaluate(
        ({ labelColor, tabBg }) => {
          const norm = (value, prop) => {
            const el = document.createElement("span");
            el.style[prop] = value;
            document.body.appendChild(el);
            const out = getComputedStyle(el)[prop];
            el.remove();
            return out;
          };
          const fg = norm(labelColor, "color");
          const bg = norm(tabBg, "backgroundColor");
          const lum = (c) => {
            const parts = c.match(/rgba?\(([^)]+)\)/)?.[1]?.split(",").map((s) => parseFloat(s.trim()));
            const m = parts && parts.length >= 3 ? parts.slice(0, 3) : [0, 0, 0];
            const [r, g, b] = m.map((v) => {
              const x = v / 255;
              return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          const l1 = lum(fg);
          const l2 = lum(bg);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        },
        { labelColor: sample.labelColor, tabBg: sample.tabBg },
      );
      if (ratio < 4.5) {
        console.error(`  ✗ ${mode}: active tab label contrast ${ratio.toFixed(2)}:1 (need 4.5:1)`);
        failed++;
      } else {
        console.log(`  ✓ ${mode}: active tab label ${ratio.toFixed(2)}:1`);
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
