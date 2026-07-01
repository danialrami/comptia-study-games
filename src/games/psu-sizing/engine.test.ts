import { describe, it, expect } from "vitest";
import {
  createPsuSizingEngine,
  recommendPsu,
  requiredWatts,
  PSU_LADDER,
  type Component,
  type PsuSpec,
} from "./engine";
import type { Problem } from "../../types";
import { mulberry32 } from "../../lib/rng";

function parts(watts: number): Component[] {
  // A single synthetic component whose wattage is the whole build sum — lets us
  // drive the grader with an exact known total.
  return [{ name: "build", watts }];
}
function problem(watts: number, headroom: number, mode: PsuSpec["mode"]): Problem<PsuSpec> {
  return { prompt: "", spec: { components: parts(watts), headroom, mode, ladder: PSU_LADDER } };
}

describe("psu-sizing: worked examples from the Day 2 study guide", () => {
  // These vectors ARE the spec. Azael's class examples, made deterministic.
  it("445 W build, 20% headroom → 534 W required → 550 W PSU", () => {
    expect(requiredWatts(parts(445), 0.2)).toBeCloseTo(534, 6);
    expect(recommendPsu(534)).toBe(550);
  });
  it("445 W build, 30% headroom → 578.5 W required → 600 W PSU", () => {
    expect(requiredWatts(parts(445), 0.3)).toBeCloseTo(578.5, 6);
    expect(recommendPsu(578.5)).toBe(600);
  });
  it("470 W build, 25% headroom → 587.5 W required → 600 W PSU", () => {
    expect(requiredWatts(parts(470), 0.25)).toBeCloseTo(587.5, 6);
    expect(recommendPsu(587.5)).toBe(600);
  });
});

describe("psu-sizing: recommendPsu invariants (metamorphic)", () => {
  it("always returns a rung ≥ required (within the ladder's range)", () => {
    for (let r = 0; r <= 1500; r += 7) {
      expect(recommendPsu(r)).toBeGreaterThanOrEqual(r);
    }
  });
  it("returns the SMALLEST sufficient rung — no smaller rung also covers it", () => {
    for (let r = 1; r <= 1500; r += 3) {
      const chosen = recommendPsu(r);
      for (const rung of PSU_LADDER) {
        if (rung < chosen) expect(rung).toBeLessThan(r);
      }
    }
  });
  it("is monotonic: a bigger build never picks a smaller PSU", () => {
    let prev = 0;
    for (let r = 0; r <= 1500; r += 5) {
      const chosen = recommendPsu(r);
      expect(chosen).toBeGreaterThanOrEqual(prev);
      prev = chosen;
    }
  });
});

describe("psu-sizing: wattage mode grading", () => {
  const engine = createPsuSizingEngine({ mode: "wattage" });
  it("accepts the exact required value and ±1 W, rejects ±3 W", () => {
    const p = problem(445, 0.3, "wattage"); // required 578.5
    expect(engine.grade(p, "578.5").correct).toBe(true);
    expect(engine.grade(p, "578").correct).toBe(true); // within ±1
    expect(engine.grade(p, "579").correct).toBe(true);
    expect(engine.grade(p, "575").correct).toBe(false);
    expect(engine.grade(p, "582").correct).toBe(false);
  });
  it("parses '600W', '600 w', and comma forms", () => {
    const p = problem(500, 0.2, "wattage"); // required 600
    for (const ans of ["600", "600W", "600 w", "600 watts"]) {
      expect(engine.grade(p, ans).correct, ans).toBe(true);
    }
  });
  it("rejects unparseable input", () => {
    const p = problem(500, 0.2, "wattage");
    expect(engine.grade(p, "a lot").correct).toBe(false);
    expect(engine.grade(p, "").correct).toBe(false);
  });
});

describe("psu-sizing: psu-pick mode grading", () => {
  const engine = createPsuSizingEngine({ mode: "psu-pick" });
  it("accepts the smallest sufficient rung and rejects the rung below it", () => {
    const p = problem(445, 0.3, "psu-pick"); // required 578.5 → 600
    expect(engine.grade(p, "600").correct).toBe(true);
    expect(engine.grade(p, "550").correct).toBe(false); // 550 < 578.5
    expect(engine.grade(p, "650").correct).toBe(false); // sufficient but not smallest
  });
});

describe("psu-sizing: generation", () => {
  it("is deterministic for a fixed seed", () => {
    const a = createPsuSizingEngine().next(mulberry32(123));
    const b = createPsuSizingEngine().next(mulberry32(123));
    expect(a).toEqual(b);
  });
  it("generates a complete, non-empty parts list with positive wattages", () => {
    const engine = createPsuSizingEngine();
    const rng = mulberry32(5);
    for (let i = 0; i < 500; i++) {
      const { spec } = engine.next(rng);
      expect(spec.components.length).toBeGreaterThanOrEqual(8);
      for (const c of spec.components) expect(c.watts).toBeGreaterThan(0);
      expect([0.2, 0.25, 0.3]).toContain(spec.headroom);
    }
  });
  it("self-grades: the engine's own expected answer always scores correct", () => {
    // Round-trip guard — generate, compute the intended answer, feed it back.
    for (const mode of ["wattage", "psu-pick"] as const) {
      const engine = createPsuSizingEngine({ mode });
      const rng = mulberry32(mode === "wattage" ? 11 : 22);
      for (let i = 0; i < 300; i++) {
        const prob = engine.next(rng);
        const required = requiredWatts(prob.spec.components, prob.spec.headroom);
        const answer =
          mode === "wattage" ? String(required) : String(recommendPsu(required, prob.spec.ladder));
        expect(engine.grade(prob, answer).correct).toBe(true);
      }
    }
  });
});
