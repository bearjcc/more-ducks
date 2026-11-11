/** Browser-side audit for .gamewin contrast, stacking, and theme. */

export const GAMEWIN_AUDIT_FN = () => {
  function oklchToRgb(l, c, h) {
    const hr = (h * Math.PI) / 180;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const cube = (x) => x ** 3;
    const l3 = cube(l_);
    const m3 = cube(m_);
    const s3 = cube(s_);
    const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const bVal = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
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
      const r = 4.0767416621 * cube(l_) - 3.3077115913 * cube(m_) + 0.2309699292 * cube(s_);
      const g = -1.2684380046 * cube(l_) + 2.6097574011 * cube(m_) - 0.3413193965 * cube(s_);
      const bVal = -0.0041960863 * cube(l_) - 0.7034186147 * cube(m_) + 1.707614701 * cube(s_);
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
    /** @type {{ text: string, el: Element, fg: string, bg: string, ratio: number, min: number, large: boolean }[]} */
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
        large,
      });
    }
    return out;
  }

  const overlay = [...document.querySelectorAll(".modal-overlay")].find(
    (o) => !(/** @type {HTMLElement} */ (o).hidden),
  );
  const gamewin = overlay?.querySelector(".gamewin") ?? document.querySelector(".gamewin");
  if (!gamewin) return { error: "no gamewin" };

  /** @type {string[]} */
  const stackFails = [];
  let node = gamewin;
  while (node) {
    const cs = getComputedStyle(/** @type {Element} */ (node));
    if (parseFloat(cs.opacity) < 1) stackFails.push(`opacity ${cs.opacity} on ${/** @type {Element} */ (node).className || node.nodeName}`);
    if (cs.filter && cs.filter !== "none")
      stackFails.push(`filter ${cs.filter} on ${/** @type {Element} */ (node).className || node.nodeName}`);
    node = node.parentElement;
  }

  const rect = gamewin.getBoundingClientRect();
  const pts = [
    ["center", rect.left + rect.width / 2, rect.top + rect.height / 2],
    ["tl", rect.left + 12, rect.top + 12],
    ["tr", rect.right - 12, rect.top + 12],
    ["bl", rect.left + 12, rect.bottom - 12],
    ["br", rect.right - 12, rect.bottom - 12],
  ];
  for (const [name, x, y] of pts) {
    const stack = document.elementsFromPoint(x, y);
    const inside = stack.some((el) => el === gamewin || gamewin.contains(el));
    if (!inside) {
      const top = stack[0];
      stackFails.push(
        `elementFromPoint(${name}) top=${top ? `${top.tagName}.${top.className}` : "null"} (gamewin not in stack)`,
      );
    }
  }

  const samples = visibleTexts(gamewin);
  const fails = samples.filter((s) => s.ratio < s.min);
  return {
    theme: document.documentElement.dataset.time ?? "",
    stackFails,
    pass: samples.length - fails.length,
    total: samples.length,
    fails: fails.map((f) => ({
      text: f.text,
      where: `${f.tag}.${f.cls}`,
      ratio: +f.ratio.toFixed(2),
      need: f.min,
      fg: f.fg,
      bg: f.bg,
    })),
  };
};
