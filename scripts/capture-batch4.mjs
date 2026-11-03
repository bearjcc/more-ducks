async (page) => {
  const BASE = "http://127.0.0.1:8765/?v=ui16";
  const OUT = "/opt/cursor/artifacts";
  const P = { width: 390, height: 844 };
  const L = { width: 1440, height: 900 };
  async function snap(name, vp = P) {
    await page.setViewportSize(vp);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}/${name}.png`, scale: "css" });
  }
  async function resetSave() {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
    await page.waitForTimeout(350);
  }
  async function prep(fn) {
    await page.evaluate(fn);
    await page.waitForTimeout(400);
  }
  async function openTab(name) {
    await page.evaluate(async (tab) => {
      const { openTab } = await import("/src/ui/render.js");
      openTab(tab);
    }, name);
    await page.waitForTimeout(300);
  }
  await resetSave();
  await snap("29-laptop-fresh-start", L);
  await prep(() => {
    const { meta, engine } = window.MoreDucks;
    meta.era = 4;
    meta.totalDucksEver = 30_000_000;
    const ducks = engine.resource("ducks");
    const delta = 25_000_000 - ducks.count;
    if (delta > 0) ducks.incrementBy(delta);
    engine.currency("coins").incrementBy(1234567890123);
  });
  await page.waitForTimeout(500);
  await snap("30-laptop-late-game", L);
  await resetSave();
  await prep(() => {
    const { meta, engine } = window.MoreDucks;
    meta.questionsAnswered = 3;
    meta.manualFeeds = 1;
    meta.era = 3;
    meta.upgradeLevels = { scalinglaws: 1 };
    engine.currency("coins").incrementBy(5000000);
  });
  await openTab("upgrades");
  await snap("31-portrait-tab-research-upgrades");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MoreDucks?.engine);
  await page.waitForTimeout(200);
  await snap("32-phone-landscape-rotate-hint", { width: 844, height: 390 });
  return "batch4 ok";
}
