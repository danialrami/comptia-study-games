import { describe, it, expect } from "vitest";
import { baseConversionGame } from "./games/base-conversion/manifest";
import { psuSizingGame } from "./games/psu-sizing/manifest";
import type { BaseConvSpec } from "./games/base-conversion/engine";
import { render } from "./games/base-conversion/engine";
import type { PsuSpec } from "./games/psu-sizing/engine";
import { requiredWatts, recommendPsu } from "./games/psu-sizing/engine";
import { mulberry32 } from "./lib/rng";

// These lock the *shipped* game configuration (not just the engines' capability):
// the Base Conversion drill is 8-bit-only, and PSU sizing is pick-from-bank.

describe("shipped config: Base Conversion is locked to the 8-bit octet", () => {
  it("only ever generates byte-tier problems (0–255, binary padded to 8 bits)", () => {
    const rng = mulberry32(2026);
    for (let i = 0; i < 1000; i++) {
      const { spec } = baseConversionGame.engine.next(rng) as { spec: BaseConvSpec };
      expect(spec.tier).toBe("byte");
      expect(spec.value).toBeGreaterThanOrEqual(0);
      expect(spec.value).toBeLessThanOrEqual(255);
      // any binary form (shown or expected) is exactly 8 characters
      expect(render(spec.value, 2, "byte", true)).toHaveLength(8);
    }
  });
  it("still grades a canonical answer correct after the lock", () => {
    const rng = mulberry32(1);
    const prob = baseConversionGame.engine.next(rng) as { prompt: string; spec: BaseConvSpec };
    const expected = render(prob.spec.value, prob.spec.to, "byte", true);
    expect(baseConversionGame.engine.grade(prob, expected).correct).toBe(true);
  });
});

describe("shipped config: PSU Sizing is pick-from-bank", () => {
  it("only ever generates psu-pick problems, with a non-empty PSU ladder", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const { spec } = psuSizingGame.engine.next(rng) as { spec: PsuSpec };
      expect(spec.mode).toBe("psu-pick");
      expect(spec.ladder.length).toBeGreaterThan(0);
    }
  });
  it("the smallest-sufficient ladder rung grades correct", () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 200; i++) {
      const prob = psuSizingGame.engine.next(rng) as { prompt: string; spec: PsuSpec };
      const required = requiredWatts(prob.spec.components, prob.spec.headroom);
      const answer = String(recommendPsu(required, prob.spec.ladder));
      expect(psuSizingGame.engine.grade(prob, answer).correct).toBe(true);
    }
  });
});
