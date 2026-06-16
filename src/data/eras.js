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
 * @property {string} emoji
 * @property {string} intro          short line posted to the log
 * @property {string} modalBody      the bigger beat shown in the era modal
 */

/** @type {EraDef[]} */
export const ERAS = [
  { id: 0, name: "The Pond",          emoji: "🦆", duckThreshold: 0,          intro: "A quiet pond. One duck. What could possibly go wrong?",                                              modalBody: "Here is a pond. Here is a duck. Tap it. You'll want more — everyone wants more." },
  { id: 1, name: "Flock Learning",    emoji: "🐥", duckThreshold: 250,        intro: "The ducks are learning from each other now. Adorable. Efficient.",                                   modalBody: "The ducks started watching each other. Now they learn on their own. It's adorable, and the output curve agrees." },
  { id: 2, name: "Scale the Flock",   emoji: "🦢", duckThreshold: 25000,      intro: "Turns out the trick was just… more ducks. Who could have known. (Everyone. Everyone knew.)",        modalBody: "Someone asked how to make better ducks. The answer was just: more ducks. We're not proud of it. We are, however, extremely scaled." },
  { id: 3, name: "Duck Intelligence", emoji: "🌀", duckThreshold: 5000000,    intro: "The ducks have begun designing better ducks. Please remain calm and keep tapping.",                  modalBody: "The ducks have started designing the next ducks. We've stopped reading the blueprints. They seem fine. They seem very fine." },
  { id: 4, name: "More Ducks",        emoji: "🌐", duckThreshold: 2000000000, intro: "There is more duck than not-duck now. This is going great.",                                          modalBody: "There is more duck than world now. The remaining not-duck is being gently onboarded." },
];
