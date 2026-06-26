// @ts-check
// aislop-ignore-file security/innerhtml -- audited: all interpolated values are dev-authored constants (MILESTONES, emoji).
import { MILESTONES } from "../game/achievements.js";
/** @type {HTMLElement|null} */ let listEl = null;
export function initAchievements() {
  listEl = document.getElementById("achievement-list");
}

/**
 * @param {import("../game/meta.js").Meta} meta
 */
export function updateAchievements(meta) {
  if (!listEl) return;
  listEl.replaceChildren();
  const earned = new Set(meta.achievements);
  for (const m of MILESTONES) {
    const li = document.createElement("li");
    li.className = "achievement";
    const done = earned.has(m.id);
    if (done) li.classList.add("is-earned");
    else li.classList.add("is-locked");
    li.innerHTML =
      `<span class="achievement__mark" aria-hidden="true">${done ? "✓" : "·"}</span>` +
      `<div class="achievement__body">` +
        `<span class="achievement__title">${done ? m.title : "???"}</span>` +
        (done ? `<span class="achievement__blurb">${m.body}</span>` : "") +
      `</div>`;
    li.setAttribute("aria-label", done ? `${m.title}. ${m.body}` : "Locked achievement");
    listEl.appendChild(li);
  }
}
