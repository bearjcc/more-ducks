// Auto must send immediately, not fill the composer.
import { initChat } from "../src/ui/chat.js";

/** @type {Record<string, unknown>} */
const nodes = {
  "question-input": { value: "", disabled: false, addEventListener: () => {} },
  "send-btn": { disabled: false, addEventListener: () => {} },
  "auto-btn": {
    disabled: false,
    classList: { add() {}, remove() {} },
    addEventListener(/** @type {string} */ ev, /** @type {() => void} */ fn) {
      if (ev === "click") globalThis._autoClick = fn;
    },
    setPointerCapture() {},
  },
};

globalThis.document = {
  getElementById: (/** @type {string} */ id) => nodes[id] ?? null,
  body: { dataset: { totalDucks: "5" }, classList: { toggle() {} } },
};

/** @type {string|null} */
let sent = null;
initChat({ canAsk: () => true, onSend: (/** @type {string} */ t) => { sent = t; } });
globalThis._autoClick();

console.assert(typeof sent === "string" && sent.length > 0, "auto sends a question");
console.assert(nodes["question-input"].value === "", "auto does not leave text in composer");
console.log("chat.test.mjs ok");
