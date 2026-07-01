import type { GameManifest } from "../../types";
import { createPsuSizingEngine } from "./engine";
import { mount } from "./ui";

export const psuSizingGame: GameManifest = {
  id: "psu-sizing",
  title: "What PSU Do You Need?",
  blurb: "Sum a full parts list, add headroom, size the power supply. Two modes.",
  examDomain: "A+ Core 1 · Hardware / power",
  engine: createPsuSizingEngine(),
  mount,
};
