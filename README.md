# CompTIA Study Games

A small, modular arcade of self-graded drills for the CompTIA trifecta (A+,
Network+, Security+). Built as study tooling for one learner working through
ACI Learning's program, but public so anyone prepping for the same exams can
use or fork it.

The design rule that matters: **every game is split into a pure grading engine
and a UI.** The engine generates problems and grades answers with no DOM and no
globals, so *answer accuracy is a property we prove in tests* — not something we
eyeball. A study tool that grades you wrong is worse than no tool, because it
teaches you the wrong thing with confidence.

## The games

| Game | What you drill | Exam home |
|------|----------------|-----------|
| **Base Conversion Drill** | binary ↔ decimal ↔ hex, all six directions, at nibble / byte / word width | A+ Core 1 & Network+ (number systems) |
| **What PSU Do You Need?** | sum a complete parts list, add headroom, size the power supply (compute-the-wattage *and* pick-the-PSU modes) | A+ Core 1 (hardware / power) |

More games slot in over time — the suite is built to grow (see
[Adding a game](#adding-a-game)).

## Run it

```bash
npm install
npm run dev      # local dev server
npm test         # run the grader contract tests
npm run build    # static bundle in dist/ — serve from anywhere
```

The build is a plain static site (no framework runtime); it deploys to GitHub
Pages, Cloudflare Pages, or any static host.

## How it's built

```
src/
  types.ts                 # the Game/Engine/Problem/GradeResult contracts
  registry.ts              # the catalog — the dashboard renders whatever is here
  main.ts                  # entry point
  lib/
    quiz-ui.ts             # the shared prompt→grade→next loop (restyle target)
    rng.ts                 # seedable PRNG, used only to make tests deterministic
  dashboard/               # the flash-portal shell (grid of cards + game stage)
  games/
    base-conversion/       # engine.ts · ui.ts · manifest.ts · engine.test.ts
    psu-sizing/            # engine.ts · ui.ts · manifest.ts · engine.test.ts
  styles/base.css
```

Each game is a self-contained folder exporting a **manifest**
(`{ id, title, blurb, examDomain, engine, mount }`). The engine is pure and
independently testable; the `mount` function renders the UI and returns a handle
the shell can tear down.

### Verifiable grading

The graders are contract-tested with two kinds of check:

- **Round-trip / canonical-answer tests** — for every value in range and every
  conversion direction, the engine's own rendered answer must grade as correct,
  and an off-by-one answer must grade as wrong.
- **Metamorphic invariants** — e.g. the PSU recommender must always return the
  *smallest* standard supply that covers the required wattage, and must be
  monotonic (a bigger build never selects a smaller PSU). The worked examples
  from the class notes are pinned as fixtures.

If a change breaks a grader, a test goes red. That's the whole point.

## Adding a game

1. `src/games/<your-id>/engine.ts` — a `GameEngine` (`next()` + `grade()`), pure.
2. `src/games/<your-id>/engine.test.ts` — prove `grade()` on canonical answers
   and any invariants. Don't ship a grader you haven't pinned.
3. `src/games/<your-id>/ui.ts` — a `mount()` using the shared `mountQuiz` helper
   (or your own DOM).
4. `src/games/<your-id>/manifest.ts` — export the manifest.
5. Add one line to `src/registry.ts`.

The dashboard picks it up automatically. No shell changes.

## Frontend / design

The visual layer is intentionally plain and lives entirely in the `csg-*` CSS
classes (`src/styles/base.css` + `src/dashboard/shell.css`) and each game's
`ui.ts`. It is designed to be restyled without touching any engine or grader —
retokenize `:root`, rework the layout, done. See
[`docs/frontend.md`](docs/frontend.md) for the design brief and the DOM contract.

## License

MIT — see [LICENSE](LICENSE).
