/**
 * Playwright MCP runner body: pass via browser_run_code_unsafe filename.
 */
async (page) => {
  const BASE = "http://127.0.0.1:8765/?v=ui16";
  const OUT = "/opt/cursor/artifacts";
  const P = { width: 390, height: 844 };
  const L = { width: 1440, height: 900 };
  const bugs = [];

  async function go() {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
    await page.waitForTimeout(350);
  }

  async function snap(name, vp = P) {
    await page.setViewportSize(vp);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}/${name}.png`, scale: "css" });
  }

  async function resetSave() {
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

  async function closePanels() {
    await page.evaluate(async () => {
      const { closeTab } = await import("/src/ui/render.js");
      closeTab();
    });
    await page.waitForTimeout(200);
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

  async function showBeat(title, body, emoji, button) {
    await page.evaluate(async (spec) => {
      const { queueModal } = await import("/src/ui/modal.js");
      queueModal(spec);
    }, { title, body, emoji, button });
    await page.waitForTimeout(400);
  }

  async function showEnding(id) {
    await page.goto(`${BASE}&ending=${id}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MoreDucks?.engine, null, { timeout: 15000 });
    await page.waitForTimeout(300);
    await page.evaluate(async (endingId) => {
      const { showTerminal } = await import(`/src/ui/ending.js?${Date.now()}`);
      const meta = { competitorBird: "Night Owl Corp" };
      showTerminal(endingId, endingId === "competitor" ? meta : null);
    }, id);
    await page.waitForTimeout(450);
  }

  // 01 fresh
  await resetSave();
  await snap("01-portrait-fresh-start");

  // 02 first quack
  await prep(() => {
    const { meta } = window.MoreDucks;
    meta.questionsAnswered = 1;
    document.body.dataset.started = "1";
  });
  await page.evaluate(async () => {
    const { appendChatExchange } = await import("/src/ui/chat.js");
    appendChatExchange("What is duck?", "Quack quack.");
  });
  await snap("02-portrait-first-quack");

  // 03 feed hungry
  await resetSave();
  await prep(() => {
    const { meta } = window.MoreDucks;
    meta.answersSinceFeed = 10;
    meta.questionsAnswered = 5;
    document.body.dataset.started = "1";
  });
  await page.evaluate(async () => {
    const { updateChatAffordance } = await import("/src/ui/chat.js");
    updateChatAffordance(true, false);
    document.body.classList.add("duck-hungry");
    const hint = document.getElementById("feed-hint");
    if (hint) {
      hint.hidden = false;
      hint.textContent = "Tap 🦆 to feed the duck";
    }
  });
  await snap("03-portrait-feed-hungry");

  // 04 panel unlock
  await resetSave();
  await prep(() => {
    const { meta } = window.MoreDucks;
    meta.questionsAnswered = 3;
    meta.manualFeeds = 1;
    document.body.dataset.started = "1";
  });
  await openTab("upgrades");
  await snap("04-portrait-first-panel-unlock");

  const tabs = [
    ["05-portrait-tab-stats", "dashboard"],
    ["06-portrait-tab-flock", "flock"],
    ["07-portrait-tab-marketing", "hype"],
    ["08-portrait-tab-upgrades", "upgrades"],
    ["09-portrait-tab-regions", "regions"],
    ["10-portrait-tab-collections", "collections"],
  ];

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
    engine.currency("coins").incrementBy(500000000);
    engine.producer("duckling").count = 5;
  });

  for (const [file, tab] of tabs) {
    await openTab(tab);
    await snap(file);
  }

  // 11 settings
  await closePanels();
  await page.evaluate(async () => {
    const { openSettings } = await import("/src/ui/settings.js");
    openSettings();
  });
  await snap("11-portrait-settings");
  await page.evaluate(async () => {
    const { closeSettings } = await import("/src/ui/settings.js");
    closeSettings();
  });

  // 12-17 act modals (intro only — dismiss beats from queue for clean single shot)
  for (let act = 0; act <= 5; act++) {
    await resetSave();
    await showActModal(act);
    const num = String(act + 12).padStart(2, "0");
    await snap(`${num}-portrait-act${act}-modal`);
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(200);
  }

  // 18 wetland beat
  await resetSave();
  await showBeat(
    "Environmental Review",
    "The wetland survey is back. Sixteen protected species. We could pause expansion here — or reclassify the wetlands as Duck Infrastructure and carry on. The ducks are waiting.",
    "📋",
    "Reclassify the wetlands",
  );
  await snap("18-portrait-beat-wetlands");

  // 19 australia beat
  await resetSave();
  await showBeat(
    "Australia",
    "The ducks have identified Australia as underutilised. They've drawn up plans. We'd technically need to authorise this first. They seem confident we will.",
    "🌏",
    "Authorise it",
  );
  await snap("19-portrait-beat-australia");

  // 20 regions abroad
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

  // 21 australia flooded
  await prep(() => {
    const { meta } = window.MoreDucks;
    meta.regionsUnlocked = ["home", "australia"];
    meta.australiaFlooded = true;
  });
  await snap("21-portrait-regions-australia");

  // 22 ocean space
  await prep(() => {
    const { meta } = window.MoreDucks;
    meta.regionsUnlocked = ["home", "ocean", "space"];
    meta.saltwaterDeployed = true;
  });
  await snap("22-portrait-regions-ocean-space");

  // 23 late game
  await resetSave();
  await prep(() => {
    const { meta, engine } = window.MoreDucks;
    meta.era = 5;
    meta.totalDucksEver = 12_000_000_000;
    meta.answersTotal = 9_000_000_000;
    meta.upgradeLevels = { steadybeak: 1, autofeeder: 1, selfgoverning: 0 };
    meta.dexUnlocked = ["mallard", "rubber", "omni"];
    engine.resource("ducks").count = 500000000;
    engine.currency("coins").incrementBy(888888888888);
    engine.currency("hype").incrementBy(500000);
    document.body.dataset.totalDucks = "500000000";
  });
  await closePanels();
  await snap("23-portrait-late-game-numbers");

  // 24-28 endings
  const endings = [
    ["24-portrait-ending-singularity", "singularity"],
    ["25-portrait-ending-swarm", "swarm"],
    ["26-portrait-ending-space", "space"],
    ["27-portrait-ending-bankrupt", "bankrupt"],
    ["28-portrait-ending-competitor", "competitor"],
  ];
  for (const [file, id] of endings) {
    await showEnding(id);
    await snap(file);
  }

  // 29-30 laptop
  await resetSave();
  await snap("29-laptop-fresh-start", L);
  await prep(() => {
    const { meta, engine } = window.MoreDucks;
    meta.era = 4;
    engine.resource("ducks").count = 25000000;
    engine.currency("coins").incrementBy(1234567890123);
    document.body.dataset.totalDucks = "25000000";
  });
  await snap("30-laptop-late-game", L);

  // 31 research note — upgrades tab holds research-tier upgrades (no Research dock tab)
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

  return { saved: 31, bugs };
};
