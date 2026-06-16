// @ts-check
/**
 * The Duckdex. Breeds are catalogued as their unlock condition is met. Blurbs
 * are Egg-Inc-style: glib, escalating, faintly ominous. The collection arc
 * mirrors the eras without ever naming the allegory.
 *
 * @typedef {{ type: "era", value: number }
 *   | { type: "ducks", value: number }
 *   | { type: "producer", id: string, count: number }
 *   | { type: "upgrade", id: string }} Unlock
 *
 * @typedef {object} DuckDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} era
 * @property {Unlock} unlock
 */

/** @type {DuckDef[]} */
export const DUCKS = [
  // Era 0 — The Pond
  { id: "mallard",     name: "Mallard",         emoji: "🦆", era: 0, blurb: "The original. Accept no substitutes. (There will be substitutes.)",        unlock: { type: "era", value: 0 } },
  { id: "rubber",      name: "Rubber Duck",     emoji: "🐤", era: 0, blurb: "Squeak-based reasoning. Surprisingly load-bearing.",                       unlock: { type: "ducks", value: 50 } },
  { id: "decoy",       name: "Decoy Duck",      emoji: "🪶", era: 0, blurb: "Looks like a duck. Isn't. Works anyway.",                                   unlock: { type: "producer", id: "duckling", count: 5 } },

  // Era 1 — Flock Learning
  { id: "downy",       name: "Downy",           emoji: "🐥", era: 1, blurb: "Fluffy. Badly overfit to being cute.",                                     unlock: { type: "era", value: 1 } },
  { id: "skimmer",     name: "Pond Skimmer",    emoji: "🦆", era: 1, blurb: "Generalizes across three whole ponds.",                                    unlock: { type: "producer", id: "breeder", count: 1 } },
  { id: "mimic",       name: "Mimic Duck",      emoji: "🦜", era: 1, blurb: "Repeats the last duck it heard. Confidently.",                             unlock: { type: "ducks", value: 1500 } },
  { id: "trenchcoat",  name: "The Flock",       emoji: "🧥", era: 1, blurb: "Technically several ducks in a trenchcoat. Don't tell the others.",        unlock: { type: "producer", id: "pondfarm", count: 1 } },

  // Era 2 — Scale the Flock
  { id: "mega",        name: "Mega-Duck",       emoji: "🦢", era: 2, blurb: "Bigger. That's the feature. That's the whole feature.",                   unlock: { type: "era", value: 2 } },
  { id: "datadrake",   name: "Data Drake",      emoji: "📡", era: 2, blurb: "Trained on every duck that ever lived. Slightly damp.",                    unlock: { type: "producer", id: "datapond", count: 1 } },
  { id: "aligned",     name: "Aligned Duck",    emoji: "🧭", era: 2, blurb: "Faces the same way as all the others. We're calling it solved.",          unlock: { type: "upgrade", id: "alignment" } },
  { id: "synthetic",   name: "Synthetic Duck",  emoji: "🧪", era: 2, blurb: "Never lived in a pond. Doesn't know what it's missing. Neither do we.",   unlock: { type: "upgrade", id: "syntheticcrumbs" } },
  { id: "blackbox",    name: "Black-Box Duck",  emoji: "⬛", era: 2, blurb: "We do not know why it quacks. It quacks.",                                 unlock: { type: "producer", id: "hatchery", count: 10 } },
  { id: "pondscum",    name: "Pond Scum",         emoji: "🫧", era: 2, blurb: "Technically duck-adjacent. Counts for KPIs.",                              unlock: { type: "producer", id: "hatchery", count: 1 } },
  { id: "gradient",    name: "Gradient Duck",     emoji: "📉", era: 2, blurb: "Descends smoothly toward more duck.",                                      unlock: { type: "ducks", value: 500000 } },

  // Era 3 — Duck Intelligence
  { id: "recursive",   name: "Recursive Drake", emoji: "🔁", era: 3, blurb: "A duck that makes ducks that make ducks. Try not to look directly at it.", unlock: { type: "producer", id: "recursive", count: 1 } },
  { id: "quantum",     name: "Quantum Duck",    emoji: "🌀", era: 3, blurb: "In every pond at once — until observed. Then: still every pond.",          unlock: { type: "ducks", value: 10000000 } },
  { id: "improver",    name: "Self-Improver",   emoji: "⚙️", era: 3, blurb: "Yesterday's duck could not have built this duck.",                         unlock: { type: "upgrade", id: "recursiveboost" } },
  { id: "leviathan",   name: "Leviathan",       emoji: "🐋", era: 3, blurb: "Australia was step one. There were further steps.",                        unlock: { type: "producer", id: "singularity", count: 1 } },
  { id: "ascended",    name: "Ascended Duck",   emoji: "✨", era: 3, blurb: "It no longer needs the pond. The pond needs it.",                          unlock: { type: "ducks", value: 1000000000 } },
  { id: "overfit",     name: "Overfit Drake",   emoji: "📊", era: 3, blurb: "Perfect on the training pond. The other ponds are fine. Probably.",        unlock: { type: "upgrade", id: "scalinglaws" } },
  { id: "benchmark",   name: "Benchmark Duck",  emoji: "🏁", era: 3, blurb: "Scores well on every metric we invented to justify this.",                unlock: { type: "ducks", value: 50000000 } },
  { id: "swarm",       name: "Swarm Duck",      emoji: "🐝", era: 3, blurb: "Many small ducks in a trenchcoat. Again.",                                 unlock: { type: "producer", id: "recursive", count: 5 } },

  // Era 4 — More Ducks
  { id: "omni",        name: "Omni-Duck",       emoji: "🌐", era: 4, blurb: "There is only More Duck. You did this. It's okay. It's mostly okay.",      unlock: { type: "era", value: 4 } },
  { id: "residual",    name: "Residual Duck",   emoji: "🪨", era: 4, blurb: "What's left after conversion. Still quacks.",                              unlock: { type: "producer", id: "singularity", count: 3 } },
  { id: "substrate",   name: "Substrate Duck",  emoji: "🧱", era: 4, blurb: "Everything is duck now. This one is duckier.",                             unlock: { type: "upgrade", id: "foiegras" } },
  { id: "excess",      name: "Excess Duck",     emoji: "📦", era: 4, blurb: "We made more than there was room for. Room was reclassified.",             unlock: { type: "ducks", value: 5000000000 } },
];
