/** Playwright helper: apply day/night without mid-transition screenshots. */

/** @param {import("playwright").Page} page @param {"day"|"night"} mode */
export async function forceTheme(page, mode) {
  await page.evaluate(async (m) => {
    document.documentElement.classList.add("theme-instant");
    const { applyTimeOfDay } = await import("/src/ui/theme.js");
    if (window.MoreDucks?.meta?.settings) window.MoreDucks.meta.settings.timeOfDay = m;
    applyTimeOfDay(m);
  }, mode);
  await page.waitForFunction((m) => document.documentElement.dataset.time === m, mode, {
    timeout: 3000,
  });
  await page.waitForTimeout(150);
}