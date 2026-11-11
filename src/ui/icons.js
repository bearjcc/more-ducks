// @ts-check
/** Inline SVG icons — single stroke style for game UI (not emoji). */

const NS = ' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** @param {string} inner @param {string} [cls] */
function svg(inner, cls = "gw-icon") {
  return `<svg class="${cls}"${NS} aria-hidden="true">${inner}</svg>`;
}

export const iconGear = () =>
  svg('<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>');

export const iconClose = () =>
  svg('<path d="M6 6l12 12M18 6L6 18"/>');

export const iconBack = () =>
  svg('<path d="M14 6l-6 6 6 6"/>');

export const iconSpeaker = () =>
  svg('<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16 9a4 4 0 010 6M18 7a7 7 0 010 10"/>');

export const iconMusic = () =>
  svg('<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>');

export const iconWaves = () =>
  svg('<path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>');

export const iconMute = () =>
  svg('<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/>');

export const iconSun = () =>
  svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>');

export const iconMoon = () =>
  svg('<path d="M21 14.5A8.5 8.5 0 1111.5 3a7 7 0 109 11.5z"/>');

export const iconAuto = () =>
  svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 12h8M12 8v8"/>');

export const iconHash = () =>
  svg('<path d="M4 9h16M4 15h16M10 3v18M14 3v18"/>');

export const iconMotion = () =>
  svg('<path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>');

export const iconInfo = () =>
  svg('<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>');

export const iconCopy = () =>
  svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>');

export const iconDownload = () =>
  svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>');

export const iconPaste = () =>
  svg('<path d="M15 4h2a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="9" y="2" width="6" height="4" rx="1"/>');

export const iconTrash = () =>
  svg('<path d="M4 7h16M9 7V5h6v2M6 7l1 14h10l1-14"/>');

export const iconDuck = () =>
  svg('<path d="M4 14c0-4 3-7 7-7 2 0 4 .8 5.5 2.2C18 8 20 8.5 21 10c-2 .5-3.5 2-4 4H4z"/><circle cx="9" cy="11" r="1" fill="currentColor" stroke="none"/>');

export const iconStrike = () =>
  svg('<circle cx="12" cy="12" r="9" fill="var(--bad)" stroke="none"/><path d="M8 8l8 8M16 8l-8 8" stroke="var(--on-primary)" stroke-width="2.5"/>', "gw-icon gw-icon--badge");
