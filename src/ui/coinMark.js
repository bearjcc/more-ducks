// @ts-check
/** Shared coin token artwork (replaces 🪙 in UI). */

export const COIN_TOKEN_SRC = "assets/coin-token.svg";

/** @param {string} [extraClass] */
export function coinIconImg(extraClass = "") {
  const cls = extraClass ? `coin-icon ${extraClass}` : "coin-icon";
  return (
    `<img class="${cls}" src="${COIN_TOKEN_SRC}" width="16" height="16" alt="" ` +
    `aria-hidden="true" decoding="async" />`
  );
}

/**
 * @param {string} amountText  Already formatted number (no HTML).
 * @param {string} [suffix]
 */
export function coinCostHtml(amountText, suffix = "") {
  const tail = suffix ? ` ${suffix}` : "";
  return `<span class="coin-cost">${coinIconImg()}<span class="coin-cost__text">${amountText}${tail}</span></span>`;
}

/**
 * @param {HTMLElement} el
 * @param {string} amountText
 * @param {string} [prefix]  e.g. "×10 "
 */
export function setCoinCost(el, amountText, prefix = "") {
  const text = `${prefix}${amountText}`;
  el.innerHTML = coinCostHtml(text);
}