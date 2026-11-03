async (page) => {
  const BASE = "http://127.0.0.1:8765/?v=ui16";
  const OUT = "/opt/cursor/artifacts";
  const P = { width: 390, height: 844 };
  async function snap(name) {
    await page.setViewportSize(P);
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
  async function closePanels() {
    await page.evaluate(async () => {
      const { closeTab } = await import("/src/ui/render.js");
      closeTab();
    });
    await page.waitForTimeout(200);
  }
  async function showEnding(id) {
    await page.goto(`${BASE}&e=${id}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
    await page.waitForTimeout(300);
    await page.evaluate(async (endingId) => {
      const { showTerminal } = await import(`/src/ui/ending.js?${Date.now()}`);
      const meta = { competitorBird: "Night Owl Corp" };
      showTerminal(endingId, endingId === "competitor" ? meta : null);
    }, id);
    await page.waitForTimeout(450);
  }
  await resetSave();
  await prep(() => {
    const { meta, engine } = window.MoreDucks;
    meta.era = 5;
    meta.totalDucksEver = 12_000_000_000;
    meta.answersTotal = 9_000_000_000;
    meta.dexUnlocked = ["mallard", "rubber", "omni"];
    meta.achievements = [
      "first_feed", "first_producer", "hundred_ducks", "answer_collector", "first_duckdex",
      "era1", "auto_feeder", "million_ducks", "half_dex", "rare_answer", "era3",
      "singularity", "full_dex", "australia", "billion_ducks", "ending",
    ];
    meta.flags.upgradesTabToast = true;
    meta.flags.flockTabToast = true;
    const ducks = engine.resource("ducks");
    const target = 500_000_000;
    const delta = target - ducks.count;
    if (delta > 0) ducks.incrementBy(delta);
    engine.currency("coins").incrementBy(888888888888);
    engine.currency("hype").incrementBy(500000);
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    document.querySelectorAll(".toast").forEach((el) => el.remove());
  });
  await closePanels();
  await snap("23-portrait-late-game-numbers");
  for (const [file, id] of [
    ["24-portrait-ending-singularity", "singularity"],
    ["25-portrait-ending-swarm", "swarm"],
    ["26-portrait-ending-space", "space"],
    ["27-portrait-ending-bankrupt", "bankrupt"],
    ["28-portrait-ending-competitor", "competitor"],
  ]) {
    await showEnding(id);
    await snap(file);
  }
  return "batch3 ok";
}
