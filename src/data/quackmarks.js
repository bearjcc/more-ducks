// @ts-check
/**
 * Benchmark badges in the Marks vanity panel. Raise Intelligence Score, not answer quality.
 *
 * @typedef {object} QuackmarkDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} cost         coins
 * @property {number} era          minimum era to appear
 * @property {number} scoreMult    Intelligence multiplier (1.14 = +14%)
 * @property {string} label        shown on purchase toast, e.g. "+14% PONDMLU"
 * @property {string} [needsDex]  duck id that must be catalogued first
 */

/** @type {QuackmarkDef[]} */
export const QUACKMARKS = [
  { id: "breadbench",  name: "BreadBench",    emoji: "🥖", blurb: "The original benchmark. Solved years ago. Still cited in every deck.",     cost: 8_000,       era: 1, scoreMult: 1.08, label: "+8% BreadBench" },
  { id: "bread8k",     name: "BREAD-8K",      emoji: "🍞", blurb: "Measures breadcrumb reasoning across eight thousand crumbs.",                cost: 35_000,      era: 1, scoreMult: 1.1,  label: "+10% BREAD-8K" },
  { id: "bathtubqa",   name: "BathTubQA",     emoji: "🛁", blurb: "General question answering in controlled shallow-water conditions.",         cost: 120_000,     era: 2, scoreMult: 1.12, label: "+12% BathTubQA" },
  { id: "pondmlu",     name: "PONDMLU",       emoji: "🌊", blurb: "Massive Language Understanding, but wet.",                                   cost: 450_000,     era: 2, scoreMult: 1.14, label: "+14% PONDMLU", needsDex: "benchmark" },
  { id: "squeakeval",  name: "SQUEAK-Eval",   emoji: "📢", blurb: "Tests answer confidence, volume, and circularity.",                            cost: 1_200_000,   era: 2, scoreMult: 1.12, label: "+12% SQUEAK-Eval" },
  { id: "waddlemath",  name: "WaddleMath",    emoji: "🔢", blurb: "Arithmetic by arranging crumbs. Results are wet but decisive.",              cost: 4_000_000,   era: 2, scoreMult: 1.15, label: "+15% WaddleMath" },
  { id: "gooseguard",  name: "GooseGuard",    emoji: "🪿", blurb: "Safety benchmark. Mostly checks whether the duck is secretly a goose.",        cost: 18_000_000,  era: 3, scoreMult: 1.12, label: "+12% GooseGuard" },
  { id: "mallardarena", name: "MALLARD Arena", emoji: "🏟️", blurb: "Two duck answers enter. One is declared more authoritative.",                 cost: 75_000_000,  era: 3, scoreMult: 1.18, label: "+18% MALLARD Arena" },
  { id: "feathercode", name: "FeatherCode",   emoji: "💻", blurb: "Code-like quacks scored by indentation quality.",                            cost: 300_000_000, era: 3, scoreMult: 1.16, label: "+16% FeatherCode" },
  { id: "honktruth",   name: "HonkTruthfulQA", emoji: "📋", blurb: "Penalizes goose-like confidence. Does not work.",                           cost: 900_000_000, era: 4, scoreMult: 1.1,  label: "+10% HonkTruthfulQA" },
];
