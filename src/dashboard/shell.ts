import type { GameInstance, GameManifest } from "../types";
import { GAMES } from "../registry";

// The LUFS Arcade shell. A tiny hash-routed SPA over a persistent nav + footer:
//   #            → home (tag-filterable grid of game cards)
//   #about       → about (the "drill it…" pitch + notes)
//   #<game-id>   → a mounted game (centered stage)
// The game engines/graders are never touched here — the shell only lists, routes,
// mounts, and destroys. Adding a game stays "one folder + one registry line".

/** Roadmap placeholders — presentational only, not playable, not in the registry.
    They preview what's coming and make the tag filter meaningful (incl. a future
    non-CompTIA "audio" machine). */
interface Roadmap {
  title: string;
  blurb: string;
  tags: string[];
  badge: string;
  accent: string;
}
const ROADMAP: Roadmap[] = [
  { title: "Subnet Host Math", blurb: "CIDR → usable-host counts and address ranges.", tags: ["comptia", "network"], badge: "/24", accent: "blue" },
  { title: "OSI ↔ PDU", blurb: "Match the seven layers to their data units and devices.", tags: ["comptia", "network"], badge: "OSI", accent: "gold" },
  { title: "RAID Minimums", blurb: "Disks, fault tolerance, and usable capacity per level.", tags: ["comptia", "hardware"], badge: "R5", accent: "teal" },
  { title: "Interval Ear Trainer", blurb: "Name the interval by ear — a future non-CompTIA machine.", tags: ["audio", "ear-training"], badge: "Hz", accent: "blue" },
];

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "comptia", label: "CompTIA" },
  { key: "hardware", label: "Hardware" },
  { key: "network", label: "Network" },
  { key: "audio", label: "Audio" },
];

const ACCENTS = new Set(["teal", "rust", "gold", "blue"]);
const accentVar = (a?: string): string => `var(--csg-${a && ACCENTS.has(a) ? a : "teal"})`;
const tagChips = (tags: string[]): string =>
  tags.slice(0, 2).map((t) => `<span>${t.replace(/-/g, " ")}</span>`).join("");

export function mountDashboard(app: HTMLElement): void {
  let live: GameInstance | null = null;
  let eqStop: (() => void) | null = null;

  // ── Persistent chrome ──────────────────────────────────────────────────────
  const nav = document.createElement("nav");
  nav.className = "csg-nav";

  const brand = document.createElement("button");
  brand.type = "button";
  brand.className = "csg-nav__brand";
  brand.innerHTML = `<span class="csg-mark"><i></i><i></i><i></i><i></i></span><span class="csg-nav__word">lufs<b>.</b></span>`;
  brand.addEventListener("click", () => go("home"));

  const links = document.createElement("div");
  links.className = "csg-nav__links";
  const navHome = document.createElement("button");
  navHome.type = "button";
  navHome.className = "csg-navbtn";
  navHome.textContent = "Arcade";
  navHome.addEventListener("click", () => go("home"));
  const navAbout = document.createElement("button");
  navAbout.type = "button";
  navAbout.className = "csg-navbtn";
  navAbout.textContent = "About";
  navAbout.addEventListener("click", () => go("about"));
  links.append(navHome, navAbout);
  nav.append(brand, links);

  const main = document.createElement("main");
  main.className = "csg-main csg-wrap";

  const footer = document.createElement("footer");
  footer.className = "csg-footer";
  footer.innerHTML = `
    <div class="csg-footer__left">
      <span class="csg-mark"><i></i><i></i><i></i><i></i></span>
      <span class="csg-footer__txt"><b>LUFS.</b> ARCADE</span>
    </div>
    <a class="csg-footer__link" href="https://lufs.audio" target="_blank" rel="noopener noreferrer">lufs.audio</a>`;

  app.replaceChildren(nav, main, footer);
  initCursor();

  // ── Teardown / nav state ─────────────────────────────────────────────────────
  function teardown() {
    if (live) { live.destroy(); live = null; }
    if (eqStop) { eqStop(); eqStop = null; }
  }
  function setActiveNav(which: "home" | "about" | "none") {
    navHome.classList.toggle("csg-navbtn--on", which === "home");
    navAbout.classList.toggle("csg-navbtn--on", which === "about");
  }

  // ── Views ────────────────────────────────────────────────────────────────────
  function showHome() {
    teardown();
    setActiveNav("home");
    main.replaceChildren(renderHome());
    scrollTo(0, 0);
  }

  function renderHome(): HTMLElement {
    const home = document.createElement("section");
    home.className = "csg-home";

    const head = document.createElement("div");
    head.className = "csg-home__head";
    const titles = document.createElement("div");
    titles.innerHTML = `
      <h1 class="csg-home__title"><span class="c1">LUFS</span> <span class="c2">ARCADE</span></h1>
      <div class="csg-home__sub">Self-graded lab drills · pick a machine</div>`;
    const eq = document.createElement("canvas");
    eq.className = "csg-eq";
    eq.width = 66;
    eq.height = 26;
    eq.setAttribute("aria-hidden", "true");
    head.append(titles, eq);

    const filter = document.createElement("div");
    filter.className = "csg-filter";
    filter.innerHTML = `<span class="csg-filter__label">Filter —</span>`;

    const grid = document.createElement("section");
    grid.className = "csg-grid";
    for (const game of GAMES) grid.append(renderGameCard(game));
    for (const r of ROADMAP) grid.append(renderRoadmapCard(r));
    const empty = document.createElement("div");
    empty.className = "csg-empty";
    empty.textContent = "No machines with that tag — yet.";
    empty.style.display = "none";
    grid.append(empty);

    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".csg-card"));
    for (const f of FILTERS) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "csg-fchip" + (f.key === "all" ? " csg-fchip--on" : "");
      chip.textContent = f.label;
      chip.addEventListener("click", () => {
        filter.querySelectorAll(".csg-fchip").forEach((c) => c.classList.remove("csg-fchip--on"));
        chip.classList.add("csg-fchip--on");
        let shown = 0;
        for (const card of cards) {
          const tags = ` ${card.dataset.tags ?? ""} `;
          const ok = f.key === "all" || tags.includes(` ${f.key} `);
          card.style.display = ok ? "" : "none";
          if (ok) shown += 1;
        }
        empty.style.display = shown ? "none" : "block";
      });
      filter.append(chip);
    }

    home.append(head, filter, grid);
    eqStop = startEq(eq);
    return home;
  }

  function renderGameCard(game: GameManifest): HTMLElement {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "csg-card";
    card.style.setProperty("--acc", accentVar(game.accent));
    card.dataset.tags = (game.tags ?? []).join(" ");
    const badge = game.badge ?? game.title.slice(0, 2).toUpperCase();
    card.innerHTML = `
      <span class="csg-card__badge">${badge}</span>
      <span class="csg-card__tags">${tagChips(game.tags ?? [])}</span>
      <span class="csg-card__title">${game.title}</span>
      <span class="csg-card__blurb">${game.blurb}</span>
      <span class="csg-card__play">▶ Play</span>`;
    card.addEventListener("click", () => openGame(game));
    return card;
  }

  function renderRoadmapCard(r: Roadmap): HTMLElement {
    const card = document.createElement("div");
    card.className = "csg-card csg-card--soon";
    card.style.setProperty("--acc", accentVar(r.accent));
    card.dataset.tags = r.tags.join(" ");
    card.innerHTML = `
      <span class="csg-card__badge">${r.badge}</span>
      <span class="csg-card__tags">${tagChips(r.tags)}</span>
      <span class="csg-card__title">${r.title}</span>
      <span class="csg-card__blurb">${r.blurb}</span>
      <span class="csg-card__play">Soon</span>`;
    return card;
  }

  function showAbout() {
    teardown();
    setActiveNav("about");
    const about = document.createElement("section");
    about.className = "csg-about";
    about.innerHTML = `
      <h1 class="csg-about__title">Drill it<br><span class="dim">till it's</span> automatic.</h1>
      <p class="csg-about__lead">A small arcade of <b>self-graded CompTIA drills</b>, built by
        <a class="csg-about__link" href="https://daniel-ramirez.io" target="_blank" rel="noopener noreferrer">Daniel Ramirez</a>
        as active-recall study tooling — and public, so anyone grinding the same certs can drill too.
        A LUFS lab tool wearing its 16-bit heart on its sleeve.</p>
      <div class="csg-about__notes">
        <div class="csg-note"><h4>Proven graders</h4><p>Every game is a pure, contract-tested grader. It never marks you wrong when you're right.</p></div>
        <div class="csg-note"><h4>Grows over time</h4><p>New machine = one folder + one line. Tag it and it drops into the filter — CompTIA today, audio tomorrow.</p></div>
        <div class="csg-note"><h4>Zero dependencies</h4><p>Vanilla, static, no framework. Pixel-perfect and light enough to serve from anywhere.</p></div>
      </div>`;
    main.replaceChildren(about);
    scrollTo(0, 0);
  }

  function openGame(game: GameManifest) {
    teardown();
    setActiveNav("none");
    history.replaceState(null, "", `#${game.id}`);

    const view = document.createElement("section");
    view.className = "csg-gameview";

    const top = document.createElement("div");
    top.className = "csg-gametop";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "csg-btn csg-back";
    back.textContent = "◄ All games";
    back.addEventListener("click", () => go("home"));
    const name = document.createElement("span");
    name.className = "csg-gamename";
    name.textContent = game.title;
    top.append(back, name);

    const stage = document.createElement("div");
    stage.className = "csg-stage";

    view.append(top, stage);
    main.replaceChildren(view);
    scrollTo(0, 0);
    live = game.mount(stage, game.engine);
  }

  // ── Routing ──────────────────────────────────────────────────────────────────
  /** Programmatic navigation: set the hash, then render. */
  function go(target: "home" | "about") {
    if (target === "home") history.replaceState(null, "", location.pathname + location.search);
    else history.replaceState(null, "", "#about");
    route();
  }
  function route() {
    const hash = location.hash.slice(1);
    if (hash === "about") { showAbout(); return; }
    const game = GAMES.find((g) => g.id === hash);
    if (game) { openGame(game); return; }
    showHome();
  }

  route();
  window.addEventListener("hashchange", route);
  window.addEventListener("beforeunload", teardown);
}

// ── Custom pixel cursor (dot + lagging square ring) ────────────────────────────
function initCursor(): void {
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;
  const a = document.createElement("div");
  a.className = "csg-cur-a";
  const b = document.createElement("div");
  b.className = "csg-cur-b";
  document.body.append(a, b);
  let mx = innerWidth / 2, my = innerHeight / 2, bx = mx, by = my;
  addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    a.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  }, { passive: true });
  const loop = () => {
    bx += (mx - bx) * 0.2; by += (my - by) * 0.2;
    b.style.transform = `translate(${bx}px,${by}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  };
  loop();
  const hot = (e: Event) => {
    const t = e.target as Element | null;
    b.style.borderColor = t && t.closest("button,input,.csg-card,.csg-chip,a")
      ? "var(--csg-teal)" : "rgba(251,249,226,0.7)";
  };
  addEventListener("mouseover", hot);
  addEventListener("mouseout", hot);
}

// ── Pixel EQ easter egg (LUFS = loudness units). Canvas2D, no smoothing. ───────
function startEq(cv: HTMLCanvasElement): (() => void) | null {
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLS = 11, ROWS = 7, cw = cv.width / COLS, ch = cv.height / ROWS;
  const PAL = ["#78beba", "#78beba", "#78beba", "#e7b225", "#d35233"];
  const col = (i: number): string => PAL[Math.max(0, Math.min(PAL.length - 1, i))] ?? "#78beba";
  let t = 0, raf = 0;
  const frame = () => {
    t += reduce ? 0 : 0.05;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let x = 0; x < COLS; x++) {
      const v = reduce ? 0.5 : (0.5 + 0.5 * Math.sin(t + x * 0.7)) * (0.6 + 0.4 * Math.sin(t * 0.7 + x));
      const lit = Math.max(1, Math.round(v * ROWS));
      for (let y = 0; y < ROWS; y++) {
        const on = ROWS - 1 - y < lit;
        const idx = Math.floor(((ROWS - 1 - y) / ROWS) * PAL.length);
        ctx.fillStyle = on ? col(idx) : "rgba(251,249,226,0.06)";
        ctx.fillRect(Math.round(x * cw) + 1, Math.round(y * ch) + 1, Math.ceil(cw) - 2, Math.ceil(ch) - 2);
      }
    }
    if (!reduce) raf = requestAnimationFrame(frame);
  };
  frame();
  return () => { if (raf) cancelAnimationFrame(raf); };
}
