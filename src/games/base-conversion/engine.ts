import type { GameEngine, GradeResult, Problem } from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// Base Conversion Drill — A+ Day 1 (binary / decimal / hex).
//
// Show a value in one base, ask for it in another. Grading is exact and
// deterministic: normalize the input, parse it in the target base, compare the
// integer value. There is no fuzzy matching — a number is either equal or not.
// ─────────────────────────────────────────────────────────────────────────────

export type Base = 2 | 10 | 16;

/** Difficulty tiers, each grounded in a real object from the Day 1 notes. */
export type Tier = "nibble" | "byte" | "word";

/** Bit width per tier. nibble = 1 hex digit / 4 bits; byte = 8 bits, 0–255. */
export const TIER_BITS: Record<Tier, number> = { nibble: 4, byte: 8, word: 16 };
export const TIER_MAX: Record<Tier, number> = { nibble: 15, byte: 255, word: 65535 };

const BASE_LABEL: Record<Base, string> = {
  2: "binary",
  10: "decimal",
  16: "hexadecimal",
};
const ALL_BASES: Base[] = [2, 10, 16];

export interface BaseConvSpec {
  value: number;
  from: Base;
  to: Base;
  tier: Tier;
  requireBinaryPadding: boolean;
}

const CHARSET: Record<Base, RegExp> = {
  2: /^[01]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-f]+$/,
};

/** Render an integer in a base for display. Hex is upper-cased (MAC style). */
export function render(value: number, base: Base, tier: Tier, pad: boolean): string {
  if (base === 16) return value.toString(16).toUpperCase();
  if (base === 2) {
    const bits = value.toString(2);
    return pad ? bits.padStart(TIER_BITS[tier], "0") : bits;
  }
  return value.toString(10);
}

/**
 * Normalize a learner's answer for a given target base: trim, drop internal
 * whitespace, lower-case, strip a 0x/0b prefix, and validate the charset.
 * Returns null if the string can't be a number in that base.
 */
export function normalize(answer: string, base: Base): string | null {
  let s = answer.trim().toLowerCase().replace(/\s+/g, "");
  if (base === 16 && s.startsWith("0x")) s = s.slice(2);
  if (base === 2 && s.startsWith("0b")) s = s.slice(2);
  if (s.length === 0) return null;
  if (!CHARSET[base].test(s)) return null;
  return s;
}

function explain(value: number, to: Base, tier: Tier): string {
  if (to === 2) {
    const bits = render(value, 2, tier, true);
    const places = bits
      .split("")
      .map((b, i) => (b === "1" ? 2 ** (bits.length - 1 - i) : 0))
      .filter((n) => n > 0);
    return `${value} = ${bits} → place values ${places.join(" + ") || "0"}.`;
  }
  if (to === 16) {
    return `${value} ÷ 16 → each hex digit is one nibble (4 bits). ${value} = ${value
      .toString(16)
      .toUpperCase()} in hex.`;
  }
  return `Sum the set place values: ${value}.`;
}

export interface BaseConvConfig {
  /** Which tiers to draw from. Default: all three. */
  tiers?: Tier[];
  /** Restrict to specific source bases (e.g. only decimal↔binary for A+). */
  bases?: Base[];
  /** Require binary answers to be zero-padded to the tier width. Default true. */
  requireBinaryPadding?: boolean;
}

export function createBaseConversionEngine(
  config: BaseConvConfig = {},
): GameEngine<BaseConvSpec> {
  const tiers = config.tiers ?? ["nibble", "byte", "word"];
  const bases = config.bases ?? ALL_BASES;
  const requireBinaryPadding = config.requireBinaryPadding ?? true;

  function pick<T>(arr: readonly T[], rng: () => number): T {
    return arr[Math.floor(rng() * arr.length)]!;
  }

  return {
    id: "base-conversion",

    next(rng: () => number = Math.random): Problem<BaseConvSpec> {
      const tier = pick(tiers, rng);
      const from = pick(bases, rng);
      let to = pick(bases, rng);
      let guard = 0;
      while (to === from && guard++ < 100) to = pick(bases, rng);
      const value = Math.floor(rng() * (TIER_MAX[tier] + 1));
      const shown = render(value, from, tier, requireBinaryPadding);
      const spec: BaseConvSpec = { value, from, to, tier, requireBinaryPadding };
      const prompt =
        `Convert ${BASE_LABEL[from]} ${shown} ` +
        `to ${BASE_LABEL[to]}.`;
      return { prompt, spec };
    },

    grade(problem: Problem<BaseConvSpec>, answer: string): GradeResult {
      const { value, to, tier, requireBinaryPadding } = problem.spec;
      const expected = render(value, to, tier, requireBinaryPadding);
      const norm = normalize(answer, to);
      if (norm === null) {
        return {
          correct: false,
          expected,
          explanation: `That isn't a valid ${BASE_LABEL[to]} number. ${explain(value, to, tier)}`,
        };
      }
      const parsed = parseInt(norm, to);
      let correct = parsed === value;
      // When padding is required, a value-correct-but-unpadded binary answer
      // (e.g. "1010" instead of "00001010") is marked wrong — leading zeros
      // carry meaning for octets/MACs, which is the whole point of the drill.
      if (correct && to === 2 && requireBinaryPadding) {
        correct = norm === expected.toLowerCase();
      }
      return {
        correct,
        expected,
        explanation: explain(value, to, tier),
        normalizedAnswer: norm,
      };
    },
  };
}
