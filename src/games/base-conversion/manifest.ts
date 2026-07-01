import type { GameManifest } from "../../types";
import { createBaseConversionEngine } from "./engine";
import { mount } from "./ui";

export const baseConversionGame: GameManifest = {
  id: "base-conversion",
  title: "Base Conversion Drill",
  blurb: "8-bit binary ↔ decimal ↔ hex, all six directions. Octet place values until automatic.",
  examDomain: "A+ Core 1 / Network+ · Number systems",
  tags: ["comptia", "number-systems"],
  badge: "01",
  accent: "teal",
  // Locked to the 8-bit octet — the unit CompTIA actually tests (IP octets,
  // 0–255, all-ones = 255). No nibble/16-bit tiers. Binary answers stay
  // zero-padded to 8 bits (00000000) by the engine default.
  engine: createBaseConversionEngine({ tiers: ["byte"] }),
  mount,
};
