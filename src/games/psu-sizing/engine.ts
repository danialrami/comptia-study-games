import type { GameEngine, GradeResult, Problem } from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// PSU Sizing — A+ Day 2 (PC power).
//
// Show a complete parts list with realistic wattages and a target headroom %,
// ask what power supply is needed. Two modes:
//
//   "wattage"  — answer the minimum required wattage = Σ(parts) × (1 + headroom).
//                Graded numerically within a ±1 W rounding tolerance.
//   "psu-pick" — choose a PSU off the standard retail ladder. The correct answer
//                is the SMALLEST rung ≥ the required wattage.
//
// The ladder and the rounding rule are the single source of truth, pinned by the
// worked examples from the Day 2 study guide (see engine.test.ts).
// ─────────────────────────────────────────────────────────────────────────────

export interface Component {
  name: string;
  watts: number;
}

export type PsuMode = "wattage" | "psu-pick";

export interface PsuSpec {
  components: Component[];
  /** Headroom as a fraction (0.20, 0.25, 0.30). */
  headroom: number;
  mode: PsuMode;
  ladder: number[];
}

/** Common retail ATX PSU wattages. The single source of truth for "psu-pick". */
export const PSU_LADDER = [400, 450, 500, 550, 600, 650, 700, 750, 850, 1000, 1200, 1500];

const HEADROOM_CHOICES = [0.2, 0.25, 0.3];

/** Realistic per-component wattage ranges for a complete desktop build. */
const PART_SPECS: { name: string; min: number; max: number; step: number }[] = [
  { name: "CPU", min: 65, max: 170, step: 5 },
  { name: "GPU", min: 120, max: 400, step: 10 },
  { name: "Motherboard", min: 40, max: 80, step: 5 },
  { name: "RAM (per module ×2)", min: 6, max: 12, step: 2 },
  { name: "NVMe SSD", min: 5, max: 8, step: 1 },
  { name: "HDD", min: 6, max: 9, step: 1 },
  { name: "CPU cooler / AIO pump", min: 5, max: 15, step: 1 },
  { name: "Case fans (×3)", min: 6, max: 15, step: 3 },
];

/** Minimum continuous wattage a build needs = sum × (1 + headroom). */
export function requiredWatts(components: Component[], headroom: number): number {
  const sum = components.reduce((acc, c) => acc + c.watts, 0);
  return sum * (1 + headroom);
}

/** The smallest ladder rung ≥ required. Clamps to the top rung if off-ladder. */
export function recommendPsu(required: number, ladder: number[] = PSU_LADDER): number {
  for (const w of ladder) if (w >= required) return w;
  return ladder[ladder.length - 1]!;
}

/** Whether the required wattage exceeds the whole ladder (recommendation clamped). */
export function isOverLadder(required: number, ladder: number[] = PSU_LADDER): boolean {
  return required > ladder[ladder.length - 1]!;
}

function pickInRange(min: number, max: number, step: number, rng: () => number): number {
  const steps = Math.floor((max - min) / step) + 1;
  return min + step * Math.floor(rng() * steps);
}

function parseWatts(answer: string): number | null {
  const cleaned = answer.trim().toLowerCase().replace(/watts?|w/g, "").replace(/,/g, "").trim();
  if (cleaned.length === 0) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export interface PsuConfig {
  mode?: PsuMode | "mixed";
  ladder?: number[];
}

export function createPsuSizingEngine(config: PsuConfig = {}): GameEngine<PsuSpec> {
  const ladder = config.ladder ?? PSU_LADDER;
  const modeConfig = config.mode ?? "mixed";

  return {
    id: "psu-sizing",

    next(rng: () => number = Math.random): Problem<PsuSpec> {
      const components: Component[] = PART_SPECS.map((p) => ({
        name: p.name,
        watts: pickInRange(p.min, p.max, p.step, rng),
      }));
      const headroom = HEADROOM_CHOICES[Math.floor(rng() * HEADROOM_CHOICES.length)]!;
      const mode: PsuMode =
        modeConfig === "mixed" ? (rng() < 0.5 ? "wattage" : "psu-pick") : modeConfig;
      const spec: PsuSpec = { components, headroom, mode, ladder };
      const pct = Math.round(headroom * 100);
      const prompt =
        mode === "wattage"
          ? `Given these components and ${pct}% headroom, what is the minimum PSU wattage required?`
          : `Given these components and ${pct}% headroom, which PSU should you buy from the ladder [${ladder.join(", ")}]?`;
      return { prompt, spec };
    },

    grade(problem: Problem<PsuSpec>, answer: string): GradeResult {
      const { components, headroom, mode, ladder } = problem.spec;
      const sum = components.reduce((acc, c) => acc + c.watts, 0);
      const required = requiredWatts(components, headroom);
      const pct = Math.round(headroom * 100);
      const given = parseWatts(answer);

      if (mode === "wattage") {
        const expectedNum = required;
        const expected = `${expectedNum} W`;
        if (given === null) {
          return { correct: false, expected, explanation: wattageExplain(sum, pct, required) };
        }
        // ±1 W tolerance absorbs rounding of the ×(1+headroom) product.
        const correct = Math.abs(given - expectedNum) <= 1;
        return {
          correct,
          expected,
          explanation: wattageExplain(sum, pct, required),
          normalizedAnswer: `${given} W`,
        };
      }

      // psu-pick
      const rung = recommendPsu(required, ladder);
      const expected = `${rung} W`;
      if (given === null) {
        return { correct: false, expected, explanation: pickExplain(sum, pct, required, rung) };
      }
      const correct = given === rung;
      return {
        correct,
        expected,
        explanation: pickExplain(sum, pct, required, rung),
        normalizedAnswer: `${given} W`,
      };
    },
  };
}

function wattageExplain(sum: number, pct: number, required: number): string {
  return `Sum of components = ${sum} W. Add ${pct}% headroom: ${sum} × ${(1 + pct / 100).toFixed(2)} = ${required} W minimum.`;
}

function pickExplain(sum: number, pct: number, required: number, rung: number): string {
  return `${sum} W × ${(1 + pct / 100).toFixed(2)} = ${required} W required → smallest standard PSU that covers it is ${rung} W.`;
}
