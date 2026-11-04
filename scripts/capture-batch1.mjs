async (page) => {
  const BASE = "http://127.0.0.1:8765/?v=ui22";
  const OUT = "/opt/cursor/artifacts";
  const P = { width: 390, height: 844 };
  async function snap(name) {
    await page.setViewportSize(P);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/${name}.png`, scale: "css" });
  }
  async function resetSave() {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      document.querySelector(".ending")?.remove();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MoreDucks?.engine && window.__mdCapture, null, {
      timeout: 15000,
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => window.__mdCapture.dismissModals());
  }
  async function openTab(name) {
    await page.evaluate(async (tab) => {
      const { openTab } = await import("/src/ui/render.js");
      if (document.body.dataset.panelOpen !== tab) openTab(tab);
    }, name);
    await page.waitForTimeout(350);
  }
  await resetSave();
  await snap("01-portrait-fresh-start");
  await page.evaluate(async () => {
    const { meta } = window.MoreDucks;
    meta.questionsAnswered = 1;
    document.body.dataset.started = "1";
    await window.__mdCapture.chat("What is duck?", "Quack quack.");
  });
  await snap("02-portrait-first-quack");
  await resetSave();
  await page.evaluate(() => {
    const { meta } = window.MoreDucks;
    meta.answersSinceFeed = 10;
    meta.questionsAnswered = 5;
    document.body.dataset.started = "1";
  });
  await page.evaluate(async () => {
    const { updateChatAffordance } = await import("/src/ui/chat.js");
    updateChatAffordance(true, false);
    document.body.classList.add("duck-hungry");
  });
  await snap("03-portrait-feed-hungry");
  await resetSave();
  await page.evaluate(() => window.__mdCapture.playEarlyUnlock());
  await openTab("upgrades");
  await page.evaluate(() => window.__mdCapture.clearToasts());
  await snap("04-portrait-first-panel-unlock");
  await page.evaluate(() => window.__mdCapture.playMidGame());
  for (const [file, tab] of [
    ["05-portrait-tab-stats", "dashboard"],
    ["06-portrait-tab-flock", "flock"],
    ["07-portrait-tab-marketing", "hype"],
    ["08-portrait-tab-upgrades", "upgrades"],
    ["09-portrait-tab-regions", "regions"],
    ["10-portrait-tab-collections", "collections"],
  ]) {
    await openTab(tab);
    if (tab === "regions") {
      await page.evaluate(() => {
        const { meta, engine } = window.MoreDucks;
        meta.era = 4;
        meta.regionsUnlocked = ["home", "europe", "asia"];
        meta.regionsRented = ["europe"];
        engine.currency("coins").incrementBy(12_000_000);
      });
      await page.waitForTimeout(200);
    }
    if (tab === "collections") {
      await page.evaluate(() => {
        document.getElementById("duckdex-grid")?.scrollIntoView({ block: "center" });
      });
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.__mdCapture.clearToasts());
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
