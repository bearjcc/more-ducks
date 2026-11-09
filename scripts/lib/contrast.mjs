/** WCAG 2.1 relative luminance and contrast helpers (hex + oklch). */

/**
 * @param {string} hex  #rgb or #rrggbb
 * @returns {[number, number, number]}
 */
export function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * @param {number} l 0–1
 * @param {number} c chroma
 * @param {number} h hue degrees
 * @returns {[number, number, number]}
 */
function oklchToRgb(l, c, h) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
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

/**
 * @param {string} color  #hex or oklch(...)
 * @returns {[number, number, number]}
 */
export function parseColor(color) {
  const s = color.trim();
  if (s.startsWith("#")) return hexToRgb(s);
  const m = s.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (m) return oklchToRgb(+m[1], +m[2], +m[3]);
  const rgb = s.match(/^rgba?\(\s*([\d.]+)[,%\s]+([\d.]+)[,%\s]+([\d.]+)/i);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
  return [0, 0, 0];
}

/**
 * @param {[number, number, number]} rgb
 */
export function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * @param {string} a  colour string
 * @param {string} b  colour string
 */
export function contrastRatio(a, b) {
  const l1 = relativeLuminance(parseColor(a));
  const l2 = relativeLuminance(parseColor(b));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** @param {string} a @param {string} b */
export function mixHex(a, b) {
  const [r1, g1, b1] = parseColor(a);
  const [r2, g2, b2] = parseColor(b);
  const mix = (x, y) => Math.round((x + y) / 2);
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
}
