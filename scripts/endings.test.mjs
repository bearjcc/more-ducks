import { defaultMeta } from "../src/game/meta.js";
import { createGame } from "../src/game/economy.js";
import { checkEndings, VERTICAL_CAPSTONE, HORIZONTAL_CAPSTONE } from "../src/game/endings.js";

const engine = createGame();
const meta = defaultMeta();

console.assert(checkEndings(engine, meta) === null, "no ending at start");

meta.upgradeLevels[VERTICAL_CAPSTONE] = 1;
console.assert(checkEndings(engine, meta) === "singularity", "vertical capstone");

meta.upgradeLevels = { [HORIZONTAL_CAPSTONE]: 1 };
console.assert(checkEndings(engine, meta) === "swarm", "horizontal capstone");

meta.upgradeLevels = {};
meta.spaceDeployed = true;
console.assert(checkEndings(engine, meta) === "space", "orbital deployment");

meta.spaceDeployed = false;
meta.regionsRented = ["europe"];
engine.currency("coins").incrementBy(-100);
console.assert(checkEndings(engine, meta) === "bankrupt", "bankrupt when negative coins renting");

console.log("endings.test.mjs OK");
