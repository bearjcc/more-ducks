async (page) => {
  const BASE = "http://127.0.0.1:8765/?v=cardcopy";
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
  await page.evaluate(() => window.__mdCapture.playMidGame());
  await page.evaluate(() => window.__mdCapture.dismissModals());
  await openTab("upgrades");
  await snap("cardcopy-portrait-upgrades");
  await openTab("flock");
  await snap("cardcopy-portrait-flock");
  await openTab("hype");
  await snap("cardcopy-portrait-marketing");
  await page.evaluate(() => window.__mdCapture.playRegionsAbroad());
  await openTab("regions");
  await snap("cardcopy-portrait-regions");
  await openTab("dashboard");
  await snap("cardcopy-portrait-phone-stats");
  return "cardcopy shots ok";
}
