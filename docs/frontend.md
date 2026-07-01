# Frontend brief & DOM contract

The engines are done and tested. This document is the seam: everything below is
yours to design without touching a grader.

## What you can change freely

- **Tokens** — `:root` custom properties in `src/styles/base.css` (color, radius,
  spacing, fonts). Retheme the whole suite from here.
- **Layout & chrome** — `src/dashboard/shell.css` (header, the card grid, the
  in-game stage) and the quiz-loop styling in `base.css` (`.csg-quiz*`).
- **Markup within a view** — each game's `ui.ts` builds its own prompt/input DOM.
  Restructure it as long as the contract below holds.

## What must keep working (the contract)

1. **The score is the engine's, not the UI's.** The UI never decides
   correctness — it calls `engine.grade(problem, answerString)` and renders the
   returned `{ correct, expected, explanation }`. Don't reimplement grading in
   the view.
2. **`renderInput` returns an answer getter.** The shared loop
   (`lib/quiz-ui.ts`) reads the current answer via the function you return, and
   calls your `submit` callback when the learner commits. Keep both wires intact.
3. **`mount(root, engine)` returns `{ destroy() }`.** The dashboard calls
   `destroy()` when leaving a game; clean up listeners there.
4. **Keyboard flow.** Enter checks an answer, then Enter advances. Preserve it —
   it's most of the feel of a fast drill.

## Design intent

Think old-school browser flash-game portal: a grid of game cards you click into
and back out of quickly. Fast, legible, low-ceremony. The current theme is a
neutral dark placeholder — the LUFS brand system (Host Grotesk / Public Sans /
Space Mono, the brand palette) is the obvious direction if we want it on-brand,
but it's a study toy first, so play is welcome.

Accessibility to keep: focus states on inputs/buttons, the `aria-live` feedback
line, and sensible tab order.
