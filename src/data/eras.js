// @ts-check
/**
 * The five eras. Entering an era is driven by lifetime ducks. `intro` is posted
 * to the log (and, later, an era modal). Keep the tone glib and earnest — never
 * preachy. The allegory should land on its own.
 *
 * @typedef {object} EraDef
 * @property {number} id
 * @property {string} name
 * @property {number} duckThreshold  lifetime ducks needed to enter
 * @property {string} intro
 */

/** @type {EraDef[]} */
export const ERAS = [
  { id: 0, name: "The Pond",           duckThreshold: 0,          intro: "A quiet pond. One duck. What could possibly go wrong?" },
  { id: 1, name: "Flock Learning",     duckThreshold: 250,        intro: "The ducks are learning from each other now. Adorable. Efficient." },
  { id: 2, name: "Scale the Flock",    duckThreshold: 25000,      intro: "Turns out the trick was just… more ducks. Who could have known. (Everyone. Everyone knew.)" },
  { id: 3, name: "Duck Intelligence",  duckThreshold: 5000000,    intro: "The ducks have begun designing better ducks. Please remain calm and keep tapping." },
  { id: 4, name: "More Ducks",         duckThreshold: 2000000000, intro: "There is more duck than not-duck now. This is going great." },
];
