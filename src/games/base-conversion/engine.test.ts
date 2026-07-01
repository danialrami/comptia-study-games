import { describe, it, expect } from "vitest";
import {
  createBaseConversionEngine,
  render,
  normalize,
  TIER_MAX,
  type Base,
  type BaseConvSpec,
} from "./engine";
import type { Problem } from "../../types";
import { mulberry32 } from "../../lib/rng";

const BASES: Base[] = [2, 10, 16];

function problemFor(
  value: number,
  from: Base,
  to: Base,
  pad = true,
): Problem<BaseConvSpec> {
  return { prompt: "", spec: { value, from, to, tier: "byte", requireBinaryPadding: pad } };
}

describe("base-conversion: render is an exact inverse of parseInt", () => {
  it("round-trips every byte value in every base", () => {
    for (let v = 0; v <= 255; v++) {
      for (const b of BASES) {
        const s = render(v, b, "byte", true);
        expect(parseInt(normalize(s, b)!, b)).toBe(v);
      }
    }
  });
});

describe("base-conversion: grading the canonical answer is always correct", () => {
  const engine = createBaseConversionEngine();
  it("accepts the rendered expected answer for all values × all directions", () => {
    for (let v = 0; v <= 255; v++) {
      for (const from of BASES) {
        for (const to of BASES) {
          if (from === to) continue;
          const p = problemFor(v, from, to, true);
          const expected = render(v, to, "byte", true);
          const res = engine.grade(p, expected);
          expect(res.correct, `value ${v} ${from}->${to}`).toBe(true);
          expect(res.expected).toBe(expected);
        }
      }
    }
  });

  it("rejects a value that is off by one", () => {
    for (let v = 0; v < 255; v++) {
      const p = problemFor(v, 10, 16, true);
      const wrong = render(v + 1, 16, "byte", true);
      expect(engine.grade(p, wrong).correct).toBe(false);
    }
  });
});

describe("base-conversion: input normalization", () => {
  const engine = createBaseConversionEngine();
  it("accepts 0x prefix, mixed case, and surrounding whitespace for hex", () => {
    const p = problemFor(31, 10, 16, true); // 31 = 0x1F
    for (const ans of ["1F", "1f", "0x1f", "  0X1F  ", "0x1F"]) {
      expect(engine.grade(p, ans).correct, ans).toBe(true);
    }
  });
  it("accepts 0b prefix for binary and treats value equality", () => {
    const p = problemFor(10, 16, 2, false); // padding off → any width ok
    for (const ans of ["1010", "0b1010", " 1010 "]) {
      expect(engine.grade(p, ans).correct, ans).toBe(true);
    }
  });
  it("rejects out-of-charset input", () => {
    const p = problemFor(10, 2, 10, true);
    expect(engine.grade(p, "10x").correct).toBe(false);
    expect(engine.grade(p, "").correct).toBe(false);
  });
});

describe("base-conversion: binary padding pedagogy", () => {
  it("requires zero-padding to the tier width when configured", () => {
    const p = problemFor(10, 10, 2, true); // byte tier → expect 00001010
    expect(render(10, 2, "byte", true)).toBe("00001010");
    // value-correct but unpadded is WRONG when padding is required
    expect(createBaseConversionEngine().grade(p, "1010").correct).toBe(false);
    // fully padded is right
    expect(createBaseConversionEngine().grade(p, "00001010").correct).toBe(true);
  });
  it("accepts unpadded binary when padding is disabled", () => {
    const p = problemFor(10, 10, 2, false);
    expect(createBaseConversionEngine({ requireBinaryPadding: false }).grade(p, "1010").correct).toBe(
      true,
    );
  });
});

describe("base-conversion: generation", () => {
  it("is deterministic for a fixed seed", () => {
    const a = createBaseConversionEngine().next(mulberry32(42));
    const b = createBaseConversionEngine().next(mulberry32(42));
    expect(a).toEqual(b);
  });
  it("never generates from === to, and stays within tier bounds", () => {
    const engine = createBaseConversionEngine();
    const rng = mulberry32(7);
    for (let i = 0; i < 2000; i++) {
      const { spec } = engine.next(rng);
      expect(spec.from).not.toBe(spec.to);
      expect(spec.value).toBeGreaterThanOrEqual(0);
      expect(spec.value).toBeLessThanOrEqual(TIER_MAX[spec.tier]);
    }
  });
  it("honors a restricted base set (decimal↔binary only, for A+)", () => {
    const engine = createBaseConversionEngine({ bases: [2, 10] });
    const rng = mulberry32(99);
    for (let i = 0; i < 500; i++) {
      const { spec } = engine.next(rng);
      expect([2, 10]).toContain(spec.from);
      expect([2, 10]).toContain(spec.to);
    }
  });
});
