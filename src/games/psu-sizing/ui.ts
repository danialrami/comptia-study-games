import type { GameEngine, GameInstance } from "../../types";
import { mountQuiz, type QuizView } from "../../lib/quiz-ui";
import type { PsuSpec } from "./engine";

const view: QuizView<PsuSpec> = {
  renderPrompt(host, problem) {
    const spec = problem.spec;
    const pct = Math.round(spec.headroom * 100);

    const table = document.createElement("table");
    table.className = "csg-psu__parts";
    const tbody = document.createElement("tbody");
    for (const c of spec.components) {
      const tr = document.createElement("tr");
      const name = document.createElement("td");
      name.textContent = c.name;
      const w = document.createElement("td");
      w.className = "csg-mono csg-psu__w";
      w.textContent = `${c.watts} W`;
      tr.append(name, w);
      tbody.append(tr);
    }
    table.append(tbody);

    const head = document.createElement("p");
    head.className = "csg-psu__ask";
    head.innerHTML =
      spec.mode === "wattage"
        ? `Minimum PSU wattage with <strong>${pct}%</strong> headroom?`
        : `Which PSU should you buy with <strong>${pct}%</strong> headroom?`;

    host.append(head, table);
  },

  renderInput(host, problem, submit) {
    const spec = problem.spec;

    if (spec.mode === "psu-pick") {
      let selected = "";
      const grid = document.createElement("div");
      grid.className = "csg-psu__ladder";
      for (const w of spec.ladder) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "csg-chip";
        b.textContent = `${w} W`;
        b.addEventListener("click", () => {
          selected = String(w);
          grid.querySelectorAll(".csg-chip").forEach((c) => c.classList.remove("csg-chip--on"));
          b.classList.add("csg-chip--on");
        });
        grid.append(b);
      }
      host.append(grid);
      return () => selected;
    }

    const input = document.createElement("input");
    input.className = "csg-input csg-mono";
    input.type = "number";
    input.inputMode = "numeric";
    input.placeholder = "watts…";
    host.append(input);
    queueMicrotask(() => input.focus());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    return () => input.value;
  },
};

export function mount(root: HTMLElement, engine: GameEngine): GameInstance {
  return mountQuiz(root, engine as GameEngine<PsuSpec>, view);
}
