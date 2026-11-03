async (page) => {
  const BASE = "http://127.0.0.1:8765/?v=ui17";
  const OUT = "/opt/cursor/artifacts";
  const P = { width: 390, height: 844 };
  const L = { width: 1440, height: 900 };
  async function snap(name, vp = P) {
    await page.setViewportSize(vp);
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
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(250);
  await snap("32-phone-landscape-rotate-hint", { width: 844, height: 390 });
  await resetSave();
  await snap("29-laptop-fresh-start", L);
  await resetSave();
  await page.evaluate(() => window.__mdCapture.playMidGame());
  await page.evaluate(() => window.__mdCapture.dismissModals());
  await page.evaluate(async () => {
    const { openTab } = await import("/src/ui/render.js");
    if (document.body.dataset.panelOpen !== "dashboard") openTab("dashboard");
  });
  await page.waitForFunction(
    () =>
      document.body.hasAttribute("data-panel-open")
      && document.querySelector('.tab-panel[data-panel="dashboard"].is-active'),
    null,
    { timeout: 10000 },
  );
  await page.waitForTimeout(400);
  await snap("30-laptop-late-game", L);
  await resetSave();
  await page.evaluate(async () => {
    await window.__mdCapture.playMidGame();
    const { meta, engine, mods, advanceGame } = window.MoreDucks;
    meta.era = 3;
    meta.flags.upgradesTabToast = true;
    engine.currency("coins").incrementBy(5_000_000);
    const { buyUpgrade } = await import("/src/game/upgrades.js");
    buyUpgrade(engine, meta, mods, "scalinglaws");
    advanceGame(0.2);
    await window.__mdCapture.dismissModals();
    window.__mdCapture.clearToasts();
  });
  await openTab("upgrades");
  await snap("31-portrait-tab-research-upgrades");
  return "batch4 ok";
}
