#!/usr/bin/env node
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const batches = [
  "capture-batch1.mjs",
  "capture-batch2.mjs",
  "capture-batch3.mjs",
  "capture-batch4.mjs",
];

const captureHelper = readFileSync(new URL("capture-page.js", import.meta.url), "utf8");

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
});

async function runBatches(files) {
  const page = await browser.newPage();
  await page.addInitScript(captureHelper);
  for (const file of files) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    const fn = /** @type {(page: import('playwright').Page) => Promise<unknown>} */ (
      // eslint-disable-next-line no-new-func
      new Function("page", `return (${src})(page)`)
    );
    const out = await fn(page);
    console.log(file, out);
  }
  await page.close();
}

for (const file of batches) {
  await runBatches([file]);
}
await browser.close();
console.log("done");
