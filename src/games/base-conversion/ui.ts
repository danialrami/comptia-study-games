import type { GameEngine, GameInstance } from "../../types";
import { mountQuiz, type QuizView } from "../../lib/quiz-ui";
import type { BaseConvSpec } from "./engine";

const LABEL: Record<number, string> = { 2: "binary", 10: "decimal", 16: "hexadecimal" };

function shown(spec: BaseConvSpec): string {
  const { value, from, requireBinaryPadding } = spec;
  if (from === 16) return value.toString(16).toUpperCase();
  if (from === 2) {
    const bits = value.toString(2);
    const width = spec.tier === "nibble" ? 4 : spec.tier === "byte" ? 8 : 16;
    return requireBinaryPadding ? bits.padStart(width, "0") : bits;
  }
  return value.toString(10);
}

const view: QuizView<BaseConvSpec> = {
  renderPrompt(host, problem) {
    const spec = problem.spec;
    const q = document.createElement("p");
    q.className = "csg-bc__ask";
    q.textContent = `Convert this ${LABEL[spec.from]} value to ${LABEL[spec.to]}:`;
    const big = document.createElement("div");
    big.className = "csg-bc__value csg-mono";
    // Bare octet / bare hex — no 0b/0x prefix, matching CompTIA class notation.
    big.textContent = shown(spec);
    const tier = document.createElement("span");
    tier.className = "csg-tag";
    tier.textContent = spec.tier;
    host.append(tier, q, big);
  },
  renderInput(host, problem, submit) {
    const input = document.createElement("input");
    input.className = "csg-input csg-mono";
    input.type = "text";
    input.autocomplete = "off";
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");
    input.placeholder = `${LABEL[problem.spec.to]}…`;
    host.append(input);
    queueMicrotask(() => input.focus());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    return () => input.value;
  },
};

export function mount(root: HTMLElement, engine: GameEngine): GameInstance {
  return mountQuiz(root, engine as GameEngine<BaseConvSpec>, view);
}
