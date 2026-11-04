async (page) => {
  const BASE = "http://127.0.0.1:8765/?v=ui21";
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
      await window.__mdCapture.dismissModals();
      const { showTerminal } = await import(`/src/ui/ending.js?${Date.now()}`);
      const meta = { competitorBird: "Night Owl Corp" };
      showTerminal(endingId, endingId === "competitor" ? meta : null);
    }, id);
    await page.waitForTimeout(450);
  }
  await resetSave();
  await page.evaluate(() => window.__mdCapture.playLateGame());
  await closePanels();
  await page.evaluate(() => window.__mdCapture.clearToasts());
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
