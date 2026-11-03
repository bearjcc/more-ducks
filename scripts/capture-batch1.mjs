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
  async function openTab(name) {
    await page.evaluate(async (tab) => {
      const { openTab } = await import("/src/ui/render.js");
      openTab(tab);
    }, name);
    await page.waitForTimeout(300);
  }
  await resetSave();
  await snap("01-portrait-fresh-start");
  await prep(() => {
    window.MoreDucks.meta.questionsAnswered = 1;
    document.body.dataset.started = "1";
  });
  await page.evaluate(async () => {
    const { appendChatExchange } = await import("/src/ui/chat.js");
    appendChatExchange("What is duck?", "Quack quack.");
  });
  await snap("02-portrait-first-quack");
  await resetSave();
  await prep(() => {
    window.MoreDucks.meta.answersSinceFeed = 10;
    document.body.dataset.started = "1";
  });
  await page.evaluate(async () => {
    const { updateChatAffordance } = await import("/src/ui/chat.js");
    updateChatAffordance(true, false);
  });
  await snap("03-portrait-feed-hungry");
  await resetSave();
  await prep(() => {
    const { meta } = window.MoreDucks;
    meta.questionsAnswered = 3;
    meta.manualFeeds = 1;
    meta.answersSinceFeed = 0;
    meta.flags.upgradesTabToast = true;
    meta.flags.flockTabToast = true;
    document.body.dataset.started = "1";
  });
  await page.evaluate(() => {
    document.querySelectorAll(".toast").forEach((el) => el.remove());
  });
  await openTab("upgrades");
  await snap("04-portrait-first-panel-unlock");
  await prep(() => {
    const { meta, engine } = window.MoreDucks;
    meta.questionsAnswered = 3;
    meta.manualFeeds = 1;
    meta.upgradeLevels = { steadybeak: 1, autofeeder: 1 };
    meta.autoFeederOwned = true;
    meta.era = 4;
    meta.answerdexSeen = ["Quack?", "Quack quack", "Quack quack quack"];
    meta.dexUnlocked = ["mallard", "rubber", "decoy", "downy"];
    meta.regionsUnlocked = ["home", "europe", "asia", "australia", "ocean", "space"];
    meta.achievements = [
      "first_feed", "first_producer", "hundred_ducks", "answer_collector", "first_duckdex",
      "era1", "auto_feeder", "million_ducks", "half_dex", "rare_answer", "era3",
      "singularity", "full_dex", "australia", "billion_ducks", "ending",
    ];
    engine.currency("coins").incrementBy(500000000);
    engine.producer("duckling").count = 5;
  });
  await page.evaluate(() => {
    document.querySelectorAll(".toast").forEach((el) => el.remove());
  });
  for (const [file, tab] of [
    ["05-portrait-tab-stats", "dashboard"],
    ["06-portrait-tab-flock", "flock"],
    ["07-portrait-tab-marketing", "hype"],
    ["08-portrait-tab-upgrades", "upgrades"],
    ["09-portrait-tab-regions", "regions"],
    ["10-portrait-tab-collections", "collections"],
  ]) {
    await openTab(tab);
    if (tab === "collections") {
      await page.evaluate(() => {
        document.getElementById("duckdex-grid")?.scrollIntoView({ block: "center" });
      });
      await page.waitForTimeout(250);
    }
    await snap(file);
  }
  await page.evaluate(async () => {
    const { closeTab } = await import("/src/ui/render.js");
    closeTab();
    const { openSettings } = await import("/src/ui/settings.js");
    openSettings();
  });
  await snap("11-portrait-settings");
  return "batch1 ok";
}
