/** Browser-side capture helpers (injected before navigation). */
window.__mdCapture = {
  async dismissModals() {
    const { flushModalQueue } = await import("/src/ui/modal.js");
    const { closeTab } = await import("/src/ui/render.js");
    flushModalQueue();
    closeTab();
    await new Promise((r) => setTimeout(r, 120));
  },
  clearToasts() {
    document.querySelectorAll(".toast").forEach((el) => el.remove());
  },
  async chat(q, a) {
    const { appendChatExchange } = await import("/src/ui/chat.js");
    appendChatExchange(q, a);
  },
  async refreshUnlocks() {
    const { updateTabUnlocks } = await import("/src/ui/render.js");
    const { meta, engine } = window.MoreDucks;
    const coins = engine.currency("coins")?.value ?? 0;
    updateTabUnlocks({ meta, coins, engine });
  },
  async playEarlyUnlock() {
    await this.dismissModals();
    const { meta, engine, advanceGame } = window.MoreDucks;
    meta.questionsAnswered = 3;
    meta.manualFeeds = 1;
    meta.answersSinceFeed = 0;
    meta.flags.upgradesTabToast = true;
    meta.flags.flockTabToast = true;
    engine.currency("coins").incrementBy(18);
    document.body.dataset.started = "1";
    await this.chat("What is duck?", "Quack.");
    await this.chat("Why pond?", "Quack quack.");
    await this.chat("More ducks?", "Quack quack quack.");
    advanceGame(0.2);
    await this.refreshUnlocks();
    this.clearToasts();
  },
  async playMidGame() {
    await this.playEarlyUnlock();
    const { meta, engine, mods, advanceGame } = window.MoreDucks;
    const { buyUpgrade } = await import("/src/game/upgrades.js");
    const { buyProducer } = await import("/src/game/economy.js");
    buyUpgrade(engine, meta, mods, "steadybeak");
    buyUpgrade(engine, meta, mods, "autofeeder");
    meta.autoFeederOwned = true;
    engine.currency("coins").incrementBy(8000);
    buyProducer(engine, "duckling", 12, meta);
    buyProducer(engine, "nestbox", 3, meta);
    meta.era = 2;
    meta.answerdexSeen = ["Quack?", "Quack quack", "Quack quack quack", "Quack!"];
    meta.dexUnlocked = ["mallard", "rubber", "decoy"];
    advanceGame(180);
    await this.chat("How many ducks?", "Enough.");
    await this.chat("Is this satire?", "Quack quack quack.");
    await this.dismissModals();
    this.clearToasts();
    advanceGame(0.2);
  },
  async playRegionsAbroad() {
    await this.playMidGame();
    const { meta, engine, advanceGame } = window.MoreDucks;
    meta.era = 4;
    engine.currency("coins").incrementBy(20_000_000);
    meta.regionsUnlocked = ["home", "europe", "asia"];
    meta.regionsRented = ["europe"];
    advanceGame(0.2);
    await this.dismissModals();
    this.clearToasts();
  },
  async playRegionsAustralia() {
    await this.playRegionsAbroad();
    const { meta } = window.MoreDucks;
    meta.regionsUnlocked = ["home", "australia"];
    meta.regionsRented = [];
    meta.australiaFlooded = true;
  },
  async playRegionsOceanSpace() {
    await this.playRegionsAbroad();
    const { meta } = window.MoreDucks;
    meta.regionsUnlocked = ["home", "ocean", "space"];
    meta.regionsRented = [];
    meta.saltwaterDeployed = true;
    meta.spaceDeployed = false;
    meta.flags.ended = false;
    meta.endingId = null;
  },
  async playLateGame() {
    await this.playMidGame();
    const { meta, engine, advanceGame } = window.MoreDucks;
    const { buyProducer } = await import("/src/game/economy.js");
    meta.era = 5;
    meta.flags.ended = false;
    meta.endingId = null;
    meta.spaceDeployed = false;
    engine.currency("coins").incrementBy(500_000_000_000);
    buyProducer(engine, "pondfarm", 40, meta);
    buyProducer(engine, "hatchery", 8, meta);
    buyProducer(engine, "duckling", 500, meta);
    buyProducer(engine, "nestbox", 120, meta);
    meta.totalDucksEver = 800_000_000;
    meta.answersTotal = 2_000_000_000;
    advanceGame(600);
    await this.chat("Scale check?", "Quack quack quack quack.");
    await this.dismissModals();
    this.clearToasts();
    document.querySelector(".ending")?.remove();
    advanceGame(0.2);
  },
  /** Plausible economy for act intro modal screenshots (12–17). */
  async playActModalState(actId) {
    await this.dismissModals();
    const { meta, engine, mods, advanceGame } = window.MoreDucks;
    const { buyProducer } = await import("/src/game/economy.js");
    const { buyUpgrade } = await import("/src/game/upgrades.js");
    if (actId <= 0) {
      document.body.removeAttribute("data-started");
      return;
    }
    if (actId === 1) {
      await this.playEarlyUnlock();
      meta.era = 1;
      meta.totalDucksEver = 280;
      engine.currency("coins").incrementBy(420);
      buyProducer(engine, "duckling", 8, meta);
      buyProducer(engine, "breeder", 1, meta);
      advanceGame(0.2);
      await this.dismissModals();
      this.clearToasts();
      return;
    }
    if (actId === 2) {
      await this.playMidGame();
      meta.era = 2;
      meta.totalDucksEver = 2_500_000;
      meta.answersTotal = 90_000_000;
      engine.currency("coins").incrementBy(12_000_000);
      advanceGame(0.2);
      await this.dismissModals();
      this.clearToasts();
      return;
    }
    if (actId === 3) {
      await this.playMidGame();
      meta.era = 3;
      meta.totalDucksEver = 45_000_000;
      meta.answersTotal = 900_000_000;
      engine.currency("coins").incrementBy(80_000_000);
      buyUpgrade(engine, meta, mods, "scalinglaws");
      advanceGame(0.2);
      await this.dismissModals();
      this.clearToasts();
      return;
    }
    if (actId === 4) {
      await this.playRegionsAbroad();
      meta.era = 4;
      meta.totalDucksEver = 3_500_000_000;
      meta.answersTotal = 4_200_000_000;
      advanceGame(0.2);
      await this.dismissModals();
      this.clearToasts();
      return;
    }
    await this.playLateGame();
    meta.era = 5;
    meta.totalDucksEver = 12_000_000_000;
    meta.answersTotal = 8_000_000_000;
    advanceGame(0.2);
    await this.dismissModals();
    this.clearToasts();
  },
  async playBeatWetlandsState() {
    await this.playActModalState(2);
  },
  async playBeatAustraliaState() {
    await this.playRegionsAbroad();
    const { meta, advanceGame } = window.MoreDucks;
    meta.era = 4;
    meta.totalDucksEver = 4_000_000_000;
    meta.regionsUnlocked = ["home", "australia"];
    meta.australiaFlooded = false;
    advanceGame(0.2);
    await this.dismissModals();
    this.clearToasts();
  },
};
