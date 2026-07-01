import type { GameInstance, GameManifest } from "../types";
import { GAMES } from "../registry";

// The flash-portal dashboard: a grid of game cards. Click a card to mount the
// game; "All games" tears it down and returns to the grid. Optional deep-link
// via the URL hash (#base-conversion) so a game is shareable/bookmarkable.

export function mountDashboard(app: HTMLElement): void {
  let live: GameInstance | null = null;

  const header = document.createElement("header");
  header.className = "csg-header";
  const brand = document.createElement("button");
  brand.className = "csg-header__brand";
  brand.type = "button";
  brand.textContent = "CompTIA Study Games";
  brand.addEventListener("click", () => showGrid());
  header.append(brand);

  const main = document.createElement("main");
  main.className = "csg-main";

  app.replaceChildren(header, main);

  function teardown() {
    if (live) {
      live.destroy();
      live = null;
    }
  }

  function showGrid() {
    teardown();
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    header.classList.remove("csg-header--in-game");
    main.replaceChildren(renderGrid());
  }

  function renderGrid(): HTMLElement {
    const grid = document.createElement("section");
    grid.className = "csg-grid";
    for (const game of GAMES) grid.append(renderCard(game));
    return grid;
  }

  function renderCard(game: GameManifest): HTMLElement {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "csg-card";
    card.innerHTML = `
      <span class="csg-card__tag">${game.examDomain}</span>
      <span class="csg-card__title">${game.title}</span>
      <span class="csg-card__blurb">${game.blurb}</span>
      <span class="csg-card__play">Play →</span>`;
    card.addEventListener("click", () => openGame(game));
    return card;
  }

  function openGame(game: GameManifest) {
    teardown();
    history.replaceState(null, "", `#${game.id}`);
    header.classList.add("csg-header--in-game");

    const back = document.createElement("button");
    back.type = "button";
    back.className = "csg-btn csg-back";
    back.textContent = "← All games";
    back.addEventListener("click", () => showGrid());

    const title = document.createElement("h1");
    title.className = "csg-game__title";
    title.textContent = game.title;

    const stage = document.createElement("div");
    stage.className = "csg-stage";

    main.replaceChildren(back, title, stage);
    live = game.mount(stage, game.engine);
  }

  // Deep-link support on first load.
  const initial = GAMES.find((g) => g.id === location.hash.slice(1));
  if (initial) openGame(initial);
  else showGrid();

  window.addEventListener("beforeunload", teardown);
}
