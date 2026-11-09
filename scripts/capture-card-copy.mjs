async (page) => {
  const BASE = "http://127.0.0.1:8765/?v=cardcopy2";
  const OUT = "/opt/cursor/artifacts";
  const P = { width: 390, height: 844 };
  async function snap(name) {
    await page.setViewportSize(P);
    await page.waitForTimeout(250);
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
      const { openTab, setSheet } = await import("/src/ui/render.js");
      if (document.body.dataset.panelOpen !== tab) openTab(tab);
      setSheet("full");
    }, name);
    await page.waitForTimeout(450);
    await page.evaluate(() => window.__mdCapture.clearToasts());
  }
  async function assertPanel(name) {
    await page.waitForFunction(
      (tab) => {
        const panel = document.querySelector(`.tab-panel[data-panel="${tab}"].is-active`);
        const cards = panel?.querySelectorAll(".card");
        return Boolean(panel && !panel.hidden && (cards?.length ?? 0) > 0);
      },
      name,
      { timeout: 8000 },
    );
  }

  await resetSave();
  await page.evaluate(() => window.__mdCapture.playMidGame());
  await page.evaluate(() => window.__mdCapture.dismissModals());
  await openTab("upgrades");
  await assertPanel("upgrades");
  await snap("cardcopy-portrait-upgrades");

  await openTab("flock");
  await assertPanel("flock");
  await snap("cardcopy-portrait-flock");

  await page.evaluate(() => {
    window.MoreDucks.engine.currency("coins").incrementBy(500_000);
    window.MoreDucks.meta.flags.upgradesTabToast = true;
    window.__mdCapture.clearToasts();
  });
  await openTab("hype");
  await assertPanel("hype");
  await snap("cardcopy-portrait-marketing");

  await page.evaluate(() => window.__mdCapture.playRegionsAbroad());
  await openTab("regions");
  await assertPanel("regions");
  await snap("cardcopy-portrait-regions");

  await page.evaluate(() => window.__mdCapture.playMidGame());
  await openTab("dashboard");
  await page.waitForFunction(() => {
    const panel = document.querySelector('.tab-panel[data-panel="dashboard"].is-active');
    const feed = document.querySelector(".dash-stat--feed:not([hidden])");
    return Boolean(panel && !panel.hidden && feed);
  }, null, { timeout: 8000 });
  await snap("cardcopy-portrait-phone-stats");
  return "cardcopy shots ok";
}
