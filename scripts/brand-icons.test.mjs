#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ASSETS = path.resolve(import.meta.dirname, "../assets");
const required = [
  "favicon.svg",
  "icon.svg",
  "badge-day.svg",
  "badge-night.svg",
  "coin-token.svg",
  "favicon-32.png",
  "favicon-night-32.png",
  "apple-touch-icon.png",
  "apple-touch-icon-night.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
];

let failed = 0;
for (const name of required) {
  const p = path.join(ASSETS, name);
  if (!fs.existsSync(p) || fs.statSync(p).size < 100) {
    console.error(`  ✗ missing or tiny: ${name}`);
    failed++;
  } else {
    console.log(`  ✓ ${name}`);
  }
}
const iconSvg = fs.readFileSync(path.join(ASSETS, "icon.svg"), "utf8");
if (/🦆/.test(iconSvg)) {
  console.error("  ✗ icon.svg still contains emoji");
  failed++;
} else {
  console.log("  ✓ icon.svg is vector favicon mark");
}

if (failed) process.exit(1);
console.log("\nbrand-icons: ok");