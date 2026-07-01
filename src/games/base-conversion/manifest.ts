import type { GameManifest } from "../../types";
import { createBaseConversionEngine } from "./engine";
import { mount } from "./ui";

export const baseConversionGame: GameManifest = {
  id: "base-conversion",
  title: "Base Conversion Drill",
  blurb: "Binary ↔ decimal ↔ hex, all six directions. Place values until automatic.",
  examDomain: "A+ Core 1 / Network+ · Number systems",
  tags: ["comptia", "number-systems"],
  badge: "01",
  accent: "teal",
  engine: createBaseConversionEngine(),
  mount,
};
