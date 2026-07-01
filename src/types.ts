// Shared contracts for every game in the suite.
//
// The load-bearing design rule: a game is split into a PURE engine (problem
// generation + grading, no DOM, no globals) and a UI mount function. The engine
// is what gets contract-tested; the UI is what Amacher restyles. Nothing in the
// grading path ever touches the DOM, so "the grading is accurate" is a property
// we can prove in a unit test rather than hope for.

/** The result of grading one answer. Everything the UI needs to give feedback. */
export interface GradeResult {
  /** Was the answer correct? The single source of truth for scoring. */
  correct: boolean;
  /** The canonical correct answer, in display form (for "the answer was …"). */
  expected: string;
  /** A short, human-readable "here's how you get there" note. */
  explanation: string;
  /** The learner's answer after normalization (trimmed/parsed), if parseable. */
  normalizedAnswer?: string;
}

/** One generated question. `spec` is the structured data the grader needs. */
export interface Problem<Spec = unknown> {
  /** Human-readable question text. */
  prompt: string;
  /** Structured problem data — the grader reads this, never the prompt string. */
  spec: Spec;
}

/**
 * A pure game engine. `rng` is injectable so tests can generate deterministic
 * problems; production passes nothing and gets `Math.random`.
 */
export interface GameEngine<Spec = unknown> {
  readonly id: string;
  next(rng?: () => number): Problem<Spec>;
  grade(problem: Problem<Spec>, answer: string): GradeResult;
}

/** A live, mounted game instance the shell can tear down. */
export interface GameInstance {
  destroy(): void;
}

/**
 * Everything the dashboard needs to list and launch a game. Adding a game to
 * the suite = author one of these and add a line to the registry. Nothing else
 * in the shell changes — the filesystem folder plus this manifest IS the entry.
 */
export interface GameManifest {
  /** kebab-case, unique across the suite. */
  id: string;
  title: string;
  /** One-line pitch shown on the dashboard card. */
  blurb: string;
  /** e.g. "A+ Core 1 · Networking" — shown as a tag, used for filtering later. */
  examDomain: string;
  /**
   * Machine-readable tags for the home-page filter (lowercase-kebab, e.g.
   * "comptia", "hardware", "network", "audio"). Optional & purely presentational
   * — the filter and card chips read this; nothing in the grading path does.
   */
  tags?: string[];
  /** Short pixel badge glyph for the card (e.g. "01", "W", "/24"). Presentational. */
  badge?: string;
  /** Card accent color key. Presentational; defaults to teal. */
  accent?: "teal" | "rust" | "gold" | "blue";
  /** The pure engine (also directly importable by tests). */
  engine: GameEngine;
  /** Render the game into `root`; return a handle the shell can destroy(). */
  mount(root: HTMLElement, engine: GameEngine): GameInstance;
}
