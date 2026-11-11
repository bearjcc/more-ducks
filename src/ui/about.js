// @ts-check
import {
  BUILD_COMMIT,
  CREDITS_BLOCKS,
  GAME_NAME,
  GAME_TAGLINE,
  GAME_VERSION,
  LICENSE_BLOCKS,
  QLM_URL,
} from "../data/about.js";

/** @type {HTMLElement|null} */
let aboutPanel = null;
/** @type {HTMLElement|null} */
let settingsPanel = null;
/** @type {HTMLElement|null} */
let titleEl = null;
/** @type {HTMLButtonElement|null} */
let backBtn = null;

/**
 * @param {{
 *   shell: HTMLElement,
 *   settingsBody: HTMLElement,
 *   onBack: () => void,
 * }} opts
 */
export function mountAboutPanel(opts) {
  settingsPanel = opts.settingsBody;
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
      `<p><a class="about__link" href="${QLM_URL}" target="_blank" rel="noopener noreferrer">Play Quack Language Model (QLM)</a></p>` +
    `</section>` +
    creditsHtml(CREDITS_BLOCKS) +
    licencesHtml(LICENSE_BLOCKS) +
    `<p class="about__fine">Made with ducks. Not financial advice.</p>`;

  opts.shell.appendChild(aboutPanel);

  titleEl = opts.shell.querySelector("#settings-modal-title");
  backBtn = /** @type {HTMLButtonElement|null} */ (opts.shell.querySelector("#settings-about-back"));
  backBtn?.addEventListener("click", () => {
    showAbout(false);
    opts.onBack();
  });
}

/** @param {{ heading: string, lines: string[] }[]} blocks */
function creditsHtml(blocks) {
  return blocks
    .map(
      (b) =>
        `<section class="about__block">` +
          `<h3 class="about__heading">${b.heading}</h3>` +
          `<ul class="about__list">${b.lines.map(lineToLi).join("")}</ul>` +
        `</section>`,
    )
    .join("");
}

/** @param {{ heading: string, lines: string[] }[]} blocks */
function licencesHtml(blocks) {
  return (
    `<section class="about__block">` +
      `<h3 class="about__heading">Licences</h3>` +
      blocks
        .map(
          (b) =>
            `<div class="about__licence">` +
              `<h4 class="about__subheading">${b.heading}</h4>` +
              `<ul class="about__list">${b.lines.map(lineToLi).join("")}</ul>` +
            `</div>`,
        )
        .join("") +
    `</section>`
  );
}

/** @param {string} line */
function lineToLi(line) {
  const urlMatch = line.match(/(https?:\/\/[^\s)]+)/);
  if (!urlMatch) return `<li>${line}</li>`;
  const url = urlMatch[1];
  const before = line.slice(0, urlMatch.index);
  const after = line.slice(urlMatch.index + url.length);
  return `<li>${before}<a class="about__link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${after}</li>`;
}

/** @param {boolean} open */
export function showAbout(open) {
  if (!aboutPanel || !settingsPanel) return;
  aboutPanel.hidden = !open;
  settingsPanel.hidden = open;
  if (titleEl) titleEl.textContent = open ? "About" : "Settings";
  if (backBtn) backBtn.hidden = !open;
  if (open) {
    aboutPanel.scrollTop = 0;
    backBtn?.focus({ preventScroll: true });
  }
}
