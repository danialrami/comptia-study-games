import type { GameEngine, GameInstance, Problem } from "../types";

// A shared "prompt → answer → grade → next" loop. This is the ONE place the core
// game chrome lives — score, streak, feedback, keyboard flow. Amacher can restyle
// every game by restyling the `csg-*` classes here plus each view's prompt markup;
// none of this touches an engine or a grader.

export interface QuizView<Spec> {
  /** Render the question body into `host` (a big number, a parts table, …). */
  renderPrompt(host: HTMLElement, problem: Problem<Spec>): void;
  /**
   * Render the answer control into `host`. Return a getter for the current
   * answer string. `submit` should be called when the learner commits (Enter,
   * button click) so the view can wire its own affordances.
   */
  renderInput(host: HTMLElement, problem: Problem<Spec>, submit: () => void): () => string;
}

const el = (tag: string, cls?: string, text?: string): HTMLElement => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

export function mountQuiz<Spec>(
  root: HTMLElement,
  engine: GameEngine<Spec>,
  view: QuizView<Spec>,
): GameInstance {
  let total = 0;
  let correct = 0;
  let streak = 0;
  let current: Problem<Spec> = engine.next();
  let readAnswer: () => string = () => "";
  let graded = false;

  root.replaceChildren();
  const wrap = el("div", "csg-quiz");

  const bar = el("div", "csg-quiz__scorebar");
  const score = el("span", "csg-quiz__score");
  const streakEl = el("span", "csg-quiz__streak");
  bar.append(score, streakEl);

  const card = el("div", "csg-quiz__card");
  const promptHost = el("div", "csg-quiz__prompt");
  const inputHost = el("div", "csg-quiz__input");
  const feedback = el("p", "csg-quiz__feedback");
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");

  const actions = el("div", "csg-quiz__actions");
  const submitBtn = el("button", "csg-btn csg-btn--primary", "Check") as HTMLButtonElement;
  const nextBtn = el("button", "csg-btn", "Next →") as HTMLButtonElement;
  nextBtn.disabled = true;
  actions.append(submitBtn, nextBtn);

  card.append(promptHost, inputHost, feedback, actions);
  wrap.append(bar, card);
  root.append(wrap);

  function refreshScore() {
    score.textContent = `Score ${correct}/${total}`;
    streakEl.textContent = streak > 1 ? `🔥 ${streak} streak` : "";
  }

  function loadProblem() {
    graded = false;
    feedback.textContent = "";
    feedback.className = "csg-quiz__feedback";
    submitBtn.disabled = false;
    nextBtn.disabled = true;
    promptHost.replaceChildren();
    inputHost.replaceChildren();
    view.renderPrompt(promptHost, current);
    readAnswer = view.renderInput(inputHost, current, doSubmit);
  }

  function doSubmit() {
    if (graded) return;
    const res = engine.grade(current, readAnswer());
    graded = true;
    total += 1;
    if (res.correct) {
      correct += 1;
      streak += 1;
      feedback.className = "csg-quiz__feedback csg-quiz__feedback--right";
      feedback.textContent = `✓ Correct. ${res.explanation}`;
    } else {
      streak = 0;
      feedback.className = "csg-quiz__feedback csg-quiz__feedback--wrong";
      feedback.textContent = `✗ Answer: ${res.expected}. ${res.explanation}`;
    }
    submitBtn.disabled = true;
    nextBtn.disabled = false;
    nextBtn.focus();
    refreshScore();
  }

  function doNext() {
    current = engine.next();
    loadProblem();
  }

  submitBtn.addEventListener("click", doSubmit);
  nextBtn.addEventListener("click", doNext);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (!graded) doSubmit();
    else doNext();
  };
  wrap.addEventListener("keydown", onKey);

  refreshScore();
  loadProblem();

  return {
    destroy() {
      wrap.removeEventListener("keydown", onKey);
      root.replaceChildren();
    },
  };
}
