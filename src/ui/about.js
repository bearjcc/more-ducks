// @ts-check
import {
  BUILD_COMMIT,
  GAME_NAME,
  GAME_TAGLINE,
  GAME_VERSION,
  LICENSE_ENTRIES,
  QLM_URL,
} from "../data/about.js";
/** @type {HTMLElement|null} */
let aboutPanel = null;
/** @type {HTMLElement|null} */
let settingsPanel = null;
/** @type {HTMLElement|null} */
let panesEl = null;
/** @type {HTMLElement|null} */
let titleEl = null;
/** @type {HTMLButtonElement|null} */
let backBtn = null;
/** @type {HTMLElement|null} */
let modalShell = null;

/**
 * @param {{
 *   panes: HTMLElement,
 *   settingsBody: HTMLElement,
 *   shell: HTMLElement,
 *   onBack: () => void,
 * }} opts
 */
export function mountAboutPanel(opts) {
  settingsPanel = opts.settingsBody;
  panesEl = opts.panes;
  modalShell = opts.shell;
  aboutPanel = document.createElement("div");
  aboutPanel.id = "about-panel";
  aboutPanel.className = "about settings-modal__body";
  aboutPanel.hidden = true;
  aboutPanel.setAttribute("role", "document");
  aboutPanel.setAttribute("aria-labelledby", "about-page-title");

  aboutPanel.innerHTML =
    `<header class="about__hero">` +
      `<h2 id="about-page-title" class="about__title">${GAME_NAME}</h2>` +
      `<p class="about__meta">Version ${GAME_VERSION} · <span class="about__commit">${BUILD_COMMIT}</span></p>` +
      `<p class="about__tagline">${GAME_TAGLINE}</p>` +
    `</header>` +
    `<section class="about__block">` +
      `<h3 class="about__heading">Prequel</h3>` +
      `<p><a class="about__link" href="${QLM_URL}">Quack Language Model (QLM)</a></p>` +
    `</section>` +
    creditsSectionsHtml() +
    licencesHtml() ;

  panesEl.appendChild(aboutPanel);

  titleEl = opts.shell.querySelector("#settings-modal-title");
  backBtn = /** @type {HTMLButtonElement|null} */ (opts.shell.querySelector("#settings-about-back"));
  backBtn?.addEventListener("click", () => {
    showAbout(false);
    opts.onBack();
  });
}

function creditsSectionsHtml() {
  return (
    `<section class="about__block">` +
      `<h3 class="about__heading">Music</h3>` +
      `<ul class="about__list">` +
        `<li>${macLeodCreditHtml()}</li>` +
      `</ul>` +
    `</section>` +
    `<section class="about__block">` +
      `<h3 class="about__heading">Sound effects (UI)</h3>` +
      `<ul class="about__list">` +
        `<li>Kenney Interface Sounds — Kenney Vleugels — ` +
          link("https://kenney.nl", "kenney.nl") + ` — ` +
          link("https://creativecommons.org/publicdomain/zero/1.0/", "CC0 1.0") +
        `</li>` +
      `</ul>` +
    `</section>` +
    `<section class="about__block">` +
      `<h3 class="about__heading">Ambience</h3>` +
      `<ul class="about__list">` +
        `<li>"Ducks, mostly Mallard, High Park, Toronto (2012)" by TRP — ` +
          link("https://freesound.org/people/TRP/sounds/616827/", "TRP on Freesound") + `</li>` +
        `<li>"night at pond edit 2012" by Nirtana — ` +
          link("https://freesound.org/people/Nirtana/sounds/152675/", "Nirtana on Freesound") + `</li>` +
        `<li>"Night Ambience" by parret — ` +
          link("https://freesound.org/people/parret/sounds/481883/", "parret on Freesound") + `</li>` +
        `<li>"Hundreds of ducks" by spurioustransients (optional late-act layer, heavily ducked) — ` +
          link("https://freesound.org/people/spurioustransients/sounds/591702/", "spurioustransients on Freesound") +
        `</li>` +
      `</ul>` +
    `</section>` +
    `<section class="about__block">` +
      `<h3 class="about__heading">Duck quack synthesizer</h3>` +
      `<ul class="about__list">` +
        `<li>Quack synth ported from ` +
          link("https://github.com/celphase/duck-pond", "CELPHASE duck-pond") +
        ` (MIT)</li>` +
      `</ul>` +
    `</section>`
  );
}

function macLeodCreditHtml() {
  return (
    '"Thinking Music" Kevin MacLeod (' +
    link("https://incompetech.com", "incompetech.com") +
    "), Licensed under Creative Commons: By Attribution 4.0 License, " +
    link("https://creativecommons.org/licenses/by/4.0/", "CC BY 4.0") +
    "."
  );
}

/** @param {string} href @param {string} label */
function link(href, label) {
  return `<a class="about__link" href="${href}">${escapeHtml(label)}</a>`;
}

/** @param {string} s */
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function licencesHtml() {
  const items = LICENSE_ENTRIES.map(
    (e) =>
      `<li><span class="about__licence-holder">${escapeHtml(e.holder)}</span> — ` +
      `${escapeHtml(e.licence)} — ` +
      link(e.href, e.linkLabel) +
      `</li>`,
  );
  return (
    `<section class="about__block about__block--licences">` +
      `<h3 class="about__heading">Licences</h3>` +
      `<ul class="about__list about__list--licences">${items.join("")}</ul>` +
    `</section>`
  );
}

/** @param {boolean} open */
export function showAbout(open) {
  if (!aboutPanel || !settingsPanel) return;
  aboutPanel.hidden = !open;
  settingsPanel.hidden = open;
  panesEl?.classList.toggle("settings-modal__panes--about", open);
  if (titleEl) titleEl.textContent = open ? "About" : "Settings";
  if (backBtn) backBtn.hidden = !open;
  modalShell?.classList.toggle("settings-modal--about", open);
  if (open) {
    aboutPanel.scrollTop = 0;
    backBtn?.focus({ preventScroll: true });
  }
}

/** @returns {"about"|"settings"} */
export function getSettingsModalView() {
  if (aboutPanel && !aboutPanel.hidden) return "about";
  return "settings";
}
