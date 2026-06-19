// @ts-check
/**
 * The Duckdex. Breeds are catalogued as their unlock condition is met. Blurbs
 * are Egg-Inc-style: glib, escalating, faintly ominous. The collection arc
 * mirrors the eras without ever naming the allegory.
 *
 * Each catalogued duck imposes a demand on the market resources (economy.md §8).
 *
 * @typedef {{ type: "era", value: number }
 *   | { type: "ducks", value: number }
 *   | { type: "producer", id: string, count: number }
 *   | { type: "upgrade", id: string }} Unlock
 *
 * @typedef {{ kind: "coinUpkeep", mult: number }
 *   | { kind: "researchUpkeep", mult: number }
 *   | { kind: "hypeDecay", mult: number }
 *   | { kind: "coherenceLift", add: number }
 *   | { kind: "questionIntake", add: number }
 *   | { kind: "produceMult", mult: number }
 *   | { kind: "scoreInflate", mult: number }} Demand
 *
 * @typedef {object} DuckDef
 * @property {string} id
 * @property {string} name
 * @property {string} emoji
 * @property {string} blurb
 * @property {number} era
 * @property {Unlock} unlock
 * @property {Demand} demand
 * @property {string} demandBlurb
 */

/** @type {DuckDef[]} */
export const DUCKS = [
  // Era 0 — The Pond
  { id: "mallard",     name: "Mallard",         emoji: "🦆", era: 0, blurb: "The original. Accept no substitutes. (There will be substitutes.)",        unlock: { type: "era", value: 0 }, demand: { kind: "coinUpkeep", mult: 1.02 }, demandBlurb: "Needs a pond. Technically, any pond counts." },
  { id: "rubber",      name: "Rubber Duck",     emoji: "🐤", era: 0, blurb: "Squeak-based reasoning. Surprisingly load-bearing.",                       unlock: { type: "ducks", value: 50 }, demand: { kind: "scoreInflate", mult: 1.03 }, demandBlurb: "Squeak metrics count toward Intelligence." },
  { id: "decoy",       name: "Decoy Duck",      emoji: "🪶", era: 0, blurb: "Looks like a duck. Isn't. Works anyway.",                                   unlock: { type: "producer", id: "duckling", count: 5 }, demand: { kind: "questionIntake", add: 0.015 }, demandBlurb: "Occupies shoreline. Questions pile up convincingly." },

  // Era 1 — Flock Learning
  { id: "downy",       name: "Downy",           emoji: "🐥", era: 1, blurb: "Fluffy. Badly overfit to being cute.",                                     unlock: { type: "era", value: 1 }, demand: { kind: "coinUpkeep", mult: 1.03 }, demandBlurb: "Fluff requires additional coin upkeep." },
  { id: "skimmer",     name: "Pond Skimmer",    emoji: "🦆", era: 1, blurb: "Generalizes across three whole ponds.",                                    unlock: { type: "producer", id: "breeder", count: 1 }, demand: { kind: "questionIntake", add: 0.04 }, demandBlurb: "Skims three ponds. Questions arrive from all of them." },
  { id: "mimic",       name: "Mimic Duck",      emoji: "🦜", era: 1, blurb: "Repeats the last duck it heard. Confidently.",                             unlock: { type: "ducks", value: 1500 }, demand: { kind: "scoreInflate", mult: 1.04 }, demandBlurb: "Repeating answers counts as diversity." },
  { id: "trenchcoat",  name: "The Flock",       emoji: "🧥", era: 1, blurb: "Technically several ducks in a trenchcoat. Don't tell the others.",        unlock: { type: "producer", id: "pondfarm", count: 1 }, demand: { kind: "coinUpkeep", mult: 1.05 }, demandBlurb: "Several ducks, one coat, many upkeep invoices." },

  // Era 2 — Scale the Flock
  { id: "mega",        name: "Mega-Duck",       emoji: "🦢", era: 2, blurb: "Bigger. That's the feature. That's the whole feature.",                   unlock: { type: "era", value: 2 }, demand: { kind: "coinUpkeep", mult: 1.06 }, demandBlurb: "Bigger duck, bigger feed bill." },
  { id: "datadrake",   name: "Data Drake",      emoji: "📡", era: 2, blurb: "Trained on every duck that ever lived. Slightly damp.",                    unlock: { type: "producer", id: "datapond", count: 1 }, demand: { kind: "coherenceLift", add: 0.025 }, demandBlurb: "Training data was mostly damp — answers sound fluent." },
  { id: "aligned",     name: "Aligned Duck",    emoji: "🧭", era: 2, blurb: "Faces the same way as all the others. We're calling it solved.",          unlock: { type: "upgrade", id: "alignment" }, demand: { kind: "hypeDecay", mult: 1.05 }, demandBlurb: "Staying aligned requires sustained hype campaigns." },
  { id: "synthetic",   name: "Synthetic Duck",  emoji: "🧪", era: 2, blurb: "Never lived in a pond. Doesn't know what it's missing. Neither do we.",   unlock: { type: "upgrade", id: "syntheticcrumbs" }, demand: { kind: "coinUpkeep", mult: 1.04 }, demandBlurb: "Synthetic ducks still bill like the real thing." },
  { id: "blackbox",    name: "Black-Box Duck",  emoji: "⬛", era: 2, blurb: "We do not know why it quacks. It quacks.",                                 unlock: { type: "producer", id: "hatchery", count: 10 }, demand: { kind: "scoreInflate", mult: 1.06 }, demandBlurb: "Output confident. Pond usage classified." },
  { id: "pondscum",    name: "Pond Scum",         emoji: "🫧", era: 2, blurb: "Technically duck-adjacent. Counts for KPIs.",                              unlock: { type: "producer", id: "hatchery", count: 1 }, demand: { kind: "produceMult", mult: 1.04 }, demandBlurb: "Duck-adjacent output counts toward KPIs." },
  { id: "gradient",    name: "Gradient Duck",     emoji: "📉", era: 2, blurb: "Descends smoothly toward more duck.",                                      unlock: { type: "ducks", value: 200_000 }, demand: { kind: "questionIntake", add: 0.05 }, demandBlurb: "Smooth descent needs a steady question stream." },

  // Era 3 — Duck Intelligence
  { id: "recursive",   name: "Recursive Drake", emoji: "🔁", era: 3, blurb: "A duck that makes ducks that make ducks. Try not to look directly at it.", unlock: { type: "producer", id: "recursive", count: 1 }, demand: { kind: "produceMult", mult: 1.08 }, demandBlurb: "Each duck spawns upkeep for the next." },
  { id: "quantum",     name: "Quantum Duck",    emoji: "🌀", era: 3, blurb: "In every pond at once — until observed. Then: still every pond.",          unlock: { type: "ducks", value: 3_000_000 }, demand: { kind: "coinUpkeep", mult: 1.08 }, demandBlurb: "Every pond at once means every invoice at once." },
  { id: "improver",    name: "Self-Improver",   emoji: "⚙️", era: 3, blurb: "Yesterday's duck could not have built this duck.",                         unlock: { type: "upgrade", id: "recursiveboost" }, demand: { kind: "scoreInflate", mult: 1.1 }, demandBlurb: "Self-improvement inflates the score." },
  { id: "leviathan",   name: "Leviathan",       emoji: "🐋", era: 3, blurb: "Australia was step one. There were further steps.",                        unlock: { type: "producer", id: "singularity", count: 1 }, demand: { kind: "coinUpkeep", mult: 1.12 }, demandBlurb: "Continental habitat is mostly capex." },
  { id: "ascended",    name: "Ascended Duck",   emoji: "✨", era: 3, blurb: "It no longer needs the pond. The pond needs it.",                          unlock: { type: "ducks", value: 15_000_000 }, demand: { kind: "coinUpkeep", mult: 1.1 }, demandBlurb: "The pond now orbits the duck — and the bill." },
  { id: "overfit",     name: "Overfit Drake",   emoji: "📊", era: 3, blurb: "Perfect on the training pond. The other ponds are fine. Probably.",        unlock: { type: "upgrade", id: "scalinglaws" }, demand: { kind: "researchUpkeep", mult: 1.08 }, demandBlurb: "Perfect fit to this pond only. Still burns research." },
  { id: "benchmark",   name: "Benchmark Duck",  emoji: "🏁", era: 3, blurb: "Scores well on every metric we invented to justify this.",                unlock: { type: "ducks", value: 10_000_000 }, demand: { kind: "scoreInflate", mult: 1.15 }, demandBlurb: "Runs benchmarks on your other ducks." },
  { id: "swarm",       name: "Swarm Duck",      emoji: "🐝", era: 3, blurb: "Many small ducks in a trenchcoat. Again.",                                 unlock: { type: "producer", id: "recursive", count: 2 }, demand: { kind: "questionIntake", add: 0.1 }, demandBlurb: "Many small ducks, many small question queues." },

  // Era 4 — More Ducks
  { id: "omni",        name: "Omni-Duck",       emoji: "🌐", era: 4, blurb: "There is only More Duck. You did this. It's okay. It's mostly okay.",      unlock: { type: "era", value: 4 }, demand: { kind: "coinUpkeep", mult: 1.15 }, demandBlurb: "Omni-duck bills omni-everything." },
  { id: "residual",    name: "Residual Duck",   emoji: "🪨", era: 4, blurb: "What's left after conversion. Still quacks.",                              unlock: { type: "producer", id: "singularity", count: 1 }, demand: { kind: "coinUpkeep", mult: 1.1 }, demandBlurb: "What's left still needs feeding." },
  { id: "substrate",   name: "Substrate Duck",  emoji: "🧱", era: 4, blurb: "Everything is duck now. This one is duckier.",                             unlock: { type: "upgrade", id: "foiegras" }, demand: { kind: "produceMult", mult: 1.1 }, demandBlurb: "Everything is duck now; everything needs upkeep." },
  { id: "excess",      name: "Excess Duck",     emoji: "📦", era: 4, blurb: "We made more than there was room for. Room was reclassified.",             unlock: { type: "ducks", value: 22_000_000 }, demand: { kind: "coinUpkeep", mult: 1.2 }, demandBlurb: "Room was reclassified. The bill went with it." },
];
