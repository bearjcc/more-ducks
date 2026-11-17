#!/usr/bin/env node
/** Rasterize brand SVGs to PNGs for favicon / PWA (Playwright). */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS = path.join(ROOT, "assets");

/** @param {import("playwright").Page} page @param {string} svgName @param {string} pngName @param {number} size */
async function raster(page, svgName, pngName, size) {
  const svgPath = path.join(ASSETS, svgName);
  const fileUrl = `file://${svgPath}`;
  await page.setViewportSize({ width: size, height: size });
  await page.goto(fileUrl, { waitUntil: "load", timeout: 15000 });
  await page.screenshot({
    path: path.join(ASSETS, pngName),
    omitBackground: true,
  });
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
});
const page = await browser.newPage();

await raster(page, "favicon.svg", "favicon-32.png", 32);
await raster(page, "badge-night.svg", "favicon-night-32.png", 32);
await raster(page, "badge-day.svg", "apple-touch-icon.png", 180);
await raster(page, "badge-night.svg", "apple-touch-icon-night.png", 180);
await raster(page, "badge-day.svg", "icon-192.png", 192);
await raster(page, "badge-day.svg", "icon-512.png", 512);
await raster(page, "badge-day.svg", "icon-maskable-512.png", 512);

await browser.close();
console.log("brand PNGs written under assets/");