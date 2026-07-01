# What PSU Do You Need?

Show a complete PC parts list with realistic wattages and a target headroom
percentage, ask what power supply the build needs.

## The rule (single source of truth)

```
required = Σ(component watts) × (1 + headroom)
```

Two modes:

- **`wattage`** — answer the minimum required wattage. Graded numerically within
  a ±1 W rounding tolerance.
- **`psu-pick`** — choose a supply off the standard retail ladder
  (`PSU_LADDER` = 400/450/500/550/600/650/700/750/850/1000/1200/1500 W). The
  correct answer is the **smallest rung ≥ required**.

Headroom is drawn from 20% / 25% / 30% per the class guidance ("component sum ×
1.2–1.3").

## Why these vectors

The grader is pinned to the worked examples from A+ Day 2:

| Build sum | Headroom | Required | PSU |
|-----------|----------|----------|-----|
| 445 W | 20% | 534 W | 550 W |
| 445 W | 30% | 578.5 W | 600 W |
| 470 W | 25% | 587.5 W | 600 W |

(The class gave the 445 W case a looser verbal "600–650 W"; this game returns the
*minimum sufficient* rung so there's one deterministic correct answer.)

Invariants proven in `engine.test.ts`: the recommendation is always ≥ required,
is the smallest sufficient rung, and is monotonic in build size.
