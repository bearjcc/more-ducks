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
  async function showActModal(actId) {
    await page.evaluate(async (id) => {
      const { queueActEntry } = await import("/src/ui/modal.js");
      const { closeTab } = await import("/src/ui/render.js");
      closeTab();
      queueActEntry(id);
    }, actId);
    await page.waitForTimeout(450);
  }
  async function showBeat(spec) {
    await page.evaluate(async (s) => {
      const { queueModal } = await import("/src/ui/modal.js");
      queueModal(s);
    }, spec);
    await page.waitForTimeout(400);
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
  for (let act = 0; act <= 5; act++) {
    await resetSave();
    await showActModal(act);
    await snap(`${String(act + 12).padStart(2, "0")}-portrait-act${act}-modal`);
  }
  await resetSave();
  await showBeat({
    title: "Environmental Review",
    body: "The wetland survey is back. Sixteen protected species. We could pause expansion here — or reclassify the wetlands as Duck Infrastructure and carry on. The ducks are waiting.",
    emoji: "📋",
    button: "Reclassify the wetlands",
  });
  await snap("18-portrait-beat-wetlands");
  await resetSave();
  await showBeat({
    title: "Australia",
    body: "The ducks have identified Australia as underutilised. They've drawn up plans. We'd technically need to authorise this first. They seem confident we will.",
    emoji: "🌏",
    button: "Authorise it",
  });
  await snap("19-portrait-beat-australia");
  await resetSave();
  await prep(() => {
    const { meta, engine } = window.MoreDucks;
    meta.era = 4;
    meta.regionsUnlocked = ["home", "europe", "asia"];
    meta.regionsRented = ["europe"];
    engine.currency("coins").incrementBy(10000000);
  });
  await openTab("regions");
  await snap("20-portrait-regions-abroad");
  await prep(() => {
    const { meta } = window.MoreDucks;
    meta.regionsUnlocked = ["home", "australia"];
    meta.australiaFlooded = true;
  });
  await snap("21-portrait-regions-australia");
  await prep(() => {
    const { meta } = window.MoreDucks;
    meta.regionsUnlocked = ["home", "ocean", "space"];
    meta.saltwaterDeployed = true;
  });
  await snap("22-portrait-regions-ocean-space");
  return "batch2 ok";
}
