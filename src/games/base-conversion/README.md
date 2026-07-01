# Base Conversion Drill

Show a value in one base (binary, decimal, hex), ask for it in another. All six
directions. Difficulty tiers are grounded in real objects from A+ Day 1:

- **nibble** — 4 bits / one hex digit (0–15)
- **byte** — 8 bits (0–255)
- **word** — 16 bits (0–65535)

## Grading

Exact and deterministic. The answer is normalized (trim, drop whitespace,
lower-case, strip a `0x`/`0b` prefix), validated against the target base's
charset, parsed, and compared by integer value. Case and prefixes don't matter;
the *number* does.

**Binary padding:** when `requireBinaryPadding` is on (default), a binary answer
must be zero-padded to the tier width (`1010` is wrong for a byte; `00001010` is
right). Leading zeros carry meaning for octets and MAC pairs — that's the point
of the drill. Turn it off with `createBaseConversionEngine({ requireBinaryPadding: false })`.

**A+ vs Network+:** binary↔decimal is fair game on A+ now; binary↔hex is formally
Network+. Restrict with `createBaseConversionEngine({ bases: [2, 10] })`.

See `engine.test.ts` for the round-trip and normalization proofs.
