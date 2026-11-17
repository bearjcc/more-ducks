/** Browser-side audit for main stage: HUD, chat, input bar (contrast + stacking). */

export const STAGE_AUDIT_FN = () => {
  function oklchToRgb(l, c, h) {
    const hr = (h * Math.PI) / 180;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const cube = (x) => x ** 3;
    const r =
      4.0767416621 * cube(l_) - 3.3077115913 * cube(m_) + 0.2309699292 * cube(s_);
    const g =
      -1.2684380046 * cube(l_) + 2.6097574011 * cube(m_) - 0.3413193965 * cube(s_);
    const bVal =
      -0.0041960863 * cube(l_) - 0.7034186147 * cube(m_) + 1.707614701 * cube(s_);
    const toSrgb = (x) => {
      const clamped = Math.max(0, Math.min(1, x));
      return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
    };
    return [Math.round(toSrgb(r) * 255), Math.round(toSrgb(g) * 255), Math.round(toSrgb(bVal) * 255)];
  }
  /** @param {string} c */
  function parseRgb(c) {
    const s = c.trim();
    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/);
    if (m) return [+m[1], +m[2], +m[3]];
    const o = s.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
    if (o) return oklchToRgb(+o[1], +o[2], +o[3]);
    const lab = s.match(/^oklab\(\s*([\d.]+)\s+([-\d.]+)\s+([-\d.]+)/i);
    if (lab) {
      const l = +lab[1];
      const a = +lab[2];
      const b = +lab[3];
      const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = l - 0.0894841775 * a - 1.291485548 * b;
      const cube = (x) => x ** 3;
      const r =
        4.0767416621 * cube(l_) - 3.3077115913 * cube(m_) + 0.2309699292 * cube(s_);
      const g =
        -1.2684380046 * cube(l_) + 2.6097574011 * cube(m_) - 0.3413193965 * cube(s_);
      const bVal =
        -0.0041960863 * cube(l_) - 0.7034186147 * cube(m_) + 1.707614701 * cube(s_);
      const toSrgb = (x) => {
        const clamped = Math.max(0, Math.min(1, x));
        return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
      };
      return [
        Math.round(toSrgb(r) * 255),
        Math.round(toSrgb(g) * 255),
        Math.round(toSrgb(bVal) * 255),
      ];
    }
    return [0, 0, 0];
  }
  /** @param {number[]} rgb */
  function lum(rgb) {
    const [r, g, b] = rgb.map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  /** @param {string} fg @param {string} bg */
  function contrast(fg, bg) {
    const l1 = lum(parseRgb(fg));
    const l2 = lum(parseRgb(bg));
    const hi = Math.max(l1, l2);
    const lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  /** @param {string} c */
  function isOpaque(c) {
    const m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/);
    if (!m) return true;
    if (m[4] == null) return true;
    return parseFloat(m[4]) >= 0.92;
  }
  /** @param {Element} el */
  function effectiveBg(el) {
    let node = el;
    while (node && node instanceof Element) {
      const bg = getComputedStyle(node).backgroundColor;
      if (isOpaque(bg)) return bg;
      node = node.parentElement;
    }
    return getComputedStyle(document.documentElement).backgroundColor;
  }
  /** @param {Element} root */
  function visibleTexts(root) {
    /** @type {{ text: string, tag: string, cls: string, fg: string, bg: string, ratio: number, min: number }[]} */
    const out = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    /** @type {Text|null} */
    let n;
    while ((n = walker.nextNode())) {
      const text = n.textContent?.trim() ?? "";
      if (!text) continue;
      const el = n.parentElement;
      if (!el || !(el instanceof HTMLElement)) continue;
      if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const fg = cs.color;
      const bg = effectiveBg(el);
      const ratio = contrast(fg, bg);
      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const large = size >= 18 || (size >= 14 && weight >= 700);
      const min = large ? 3 : 4.5;
      out.push({
        text: text.slice(0, 48),
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === "string" ? el.className : "").split(/\s+/).slice(0, 2).join("."),
        fg,
        bg,
        ratio,
        min,
      });
    }
    return out;
  }

  const regions = [
    { name: "hud", el: document.querySelector(".hud") },
    { name: "chat", el: document.querySelector(".chat-thread") },
    { name: "input", el: document.querySelector(".bottom-tray") },
  ];
  /** @type {string[]} */
  const missing = [];
  /** @type {{ text: string, where: string, ratio: number, need: number, fg: string, bg: string, region: string }[]} */
  const fails = [];
  let total = 0;
  let pass = 0;

  for (const { name, el } of regions) {
    if (!el) {
      missing.push(name);
      continue;
    }
    const samples = visibleTexts(el);
    total += samples.length;
    for (const s of samples) {
      if (s.ratio >= s.min) pass++;
      else {
        fails.push({
          region: name,
          text: s.text,
          where: `${s.tag}.${s.cls}`,
          ratio: +s.ratio.toFixed(2),
          need: s.min,
          fg: s.fg,
          bg: s.bg,
        });
      }
    }
  }

  /** @type {string[]} */
  const stackFails = [];
  const app = document.querySelector("main.app");
  if (app) {
    for (const kid of app.children) {
      const cs = getComputedStyle(/** @type {Element} */ (kid));
      if (parseFloat(cs.opacity) < 1) stackFails.push(`opacity ${cs.opacity} on ${kid.className || kid.tagName}`);
      if (cs.filter && cs.filter !== "none")
        stackFails.push(`filter ${cs.filter} on ${kid.className || kid.tagName}`);
    }
  }

  if (missing.length) return { error: `missing regions: ${missing.join(", ")}` };

  return {
    theme: document.documentElement.dataset.time ?? "",
    stackFails,
    pass,
    total,
    fails,
  };
};