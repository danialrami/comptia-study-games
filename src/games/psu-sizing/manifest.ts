import type { GameManifest } from "../../types";
import { createPsuSizingEngine } from "./engine";
import { mount } from "./ui";

export const psuSizingGame: GameManifest = {
  id: "psu-sizing",
  title: "What PSU Do You Need?",
  blurb: "Sum a full parts list, add headroom, then pick the right PSU from the bank.",
  examDomain: "A+ Core 1 · Hardware / power",
  tags: ["comptia", "hardware"],
  badge: "W",
  accent: "rust",
  // Pick-from-bank: the learner applies the headroom themselves and chooses the
  // smallest real PSU wattage that covers it, from the standard retail ladder.
  engine: createPsuSizingEngine({ mode: "psu-pick" }),
  mount,
};
