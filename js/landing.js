// landing.js: the landing page. Builds the overview map (.fa-overview) and the
// key-insights slider (.fa-slider). The chapter pages use main.js instead.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CONFIG } from "./config.js";
import { makeOverviewMap } from "./charts/overviewMap.js";

// landing-page cards (links, numbers, titles from chapters.js) and back to top; a failure here must not stop the map
import("./nav.js").catch((err) => console.error("Navigation failed to load:", err));

// slider: PNGs in img/slider/
const SLIDER_IMAGES = [
  "landing_1b emb pack.png",
  "landing_13 debt.png",
  "12_invest fdi.png",
  "landing_11 trade china green.png",
  "landing_10 trade china hydro.png",
  "landing_4b exe isotype.png",
  "landing_3 dia map.png",
  "landing_2b vis pack.png",
  "landing_1a emb map.png",
];
const SLIDER_INTERVAL = 5500; // ms between images

// slider button icons (inline SVG, take the button's text colour)
const ICON_PREV =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_NEXT =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_PAUSE =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
const ICON_PLAY =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';

const url = (file) => `${CONFIG.BASE_URL}/data/${file}`;

// ── overview map ──────────────────────────────────────────────────────────

async function initMap(el) {
  const [countries, disputed] = await Promise.all([
    d3.json(url("world_countries.geojson")),
    d3.json(url("world_disputed.geojson")),
  ]);
  makeOverviewMap(el, { countries, disputed });
}

// ── slider ────────────────────────────────────────────────────────────────

function initSlider(el) {
  if (!SLIDER_IMAGES.length) {
    el.style.display = "none";
    return;
  }

  const imgs = SLIDER_IMAGES.map((file, i) => {
    const img = document.createElement("img");
    img.className = "fa-slider-img" + (i === 0 ? " on" : "");
    img.src = `${CONFIG.BASE_URL}/src/${encodeURI(file)}`;
    img.alt = "";
    el.appendChild(img);
    return img;
  });

  let dots = [];
  if (imgs.length > 1) {
    const dotsWrap = document.createElement("div");
    dotsWrap.className = "fa-slider-dots";
    dots = SLIDER_IMAGES.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "fa-slider-dot" + (i === 0 ? " on" : "");
      dot.setAttribute("aria-label", `Show image ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
      return dot;
    });
    el.appendChild(dotsWrap);
  }

  let current = 0;
  let timer = null;
  let paused = false; // true once the visitor has pressed pause

  function goTo(i) {
    imgs[current].classList.remove("on");
    if (dots.length) dots[current].classList.remove("on");
    current = i;
    imgs[current].classList.add("on");
    if (dots.length) dots[current].classList.add("on");
  }
  const next = () => goTo((current + 1) % imgs.length);
  const prev = () => goTo((current - 1 + imgs.length) % imgs.length);

  function start() {
    if (imgs.length > 1 && !paused && !timer)
      timer = setInterval(next, SLIDER_INTERVAL);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }

  // buttons: previous, play/pause, next
  if (imgs.length > 1) {
    const makeBtn = (cls, label, icon) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `fa-slider-btn ${cls}`;
      b.setAttribute("aria-label", label);
      b.innerHTML = icon;
      el.appendChild(b);
      return b;
    };

    const prevBtn = makeBtn("fa-slider-prev", "Previous image", ICON_PREV);
    const nextBtn = makeBtn("fa-slider-next", "Next image", ICON_NEXT);
    const toggleBtn = makeBtn(
      "fa-slider-toggle",
      "Pause slideshow",
      ICON_PAUSE,
    );

    // after a manual click the timer restarts, so the new image gets a full interval
    prevBtn.addEventListener("click", () => {
      stop();
      prev();
      start();
    });
    nextBtn.addEventListener("click", () => {
      stop();
      next();
      start();
    });
    toggleBtn.addEventListener("click", () => {
      paused = !paused;
      toggleBtn.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
      toggleBtn.setAttribute(
        "aria-label",
        paused ? "Play slideshow" : "Pause slideshow",
      );
      if (paused) stop();
      else start();
    });
  }

  el.addEventListener("mouseenter", stop);
  el.addEventListener("mouseleave", start);

  // swipe (touch and mouse drag, Pointer Events)
  if (imgs.length > 1) {
    const SWIPE_THRESHOLD = 40;
    let dragStartX = null;
    let dragging = false;

    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return; // buttons are not swipes
      dragStartX = e.clientX;
      dragging = true;
      stop();
    });
    el.addEventListener("pointermove", (e) => {
      if (dragging) e.preventDefault();
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - dragStartX;
      if (dx <= -SWIPE_THRESHOLD) next();
      else if (dx >= SWIPE_THRESHOLD) prev();
      start();
    };
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("pointerleave", () => {
      dragging = false;
    });
  }

  start();
}

// ── executive summary ─────────────────────────────────────────────────────
// Each paragraph shows its first sentence plus an inline "Read more"; the rest
// (.fa-more-rest) opens in the same paragraph and the button goes away. Only
// one is open at a time: opening another closes the previous one and brings
// its button back. Without this script the full text stays visible.

const SUMMARY_MS = 320; // open / close animation
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function initSummary(box) {
  const rests = [...box.querySelectorAll(".fa-more-rest")];
  if (!rests.length) return;
  box.classList.add("fa-js");

  let open = null; // { rest, btn }

  // switch one item open or closed, gliding its paragraph between the two heights
  function setOpen(item, isOpen) {
    const p = item.rest.parentElement;
    const before = p.offsetHeight;

    item.rest.classList.toggle("on", isOpen);
    item.btn.hidden = isOpen;
    item.btn.setAttribute("aria-expanded", String(isOpen));

    const after = p.offsetHeight;
    if (reduceMotion.matches || before === after || !p.animate) return;

    p.style.overflow = "hidden";
    const glide = p.animate(
      [{ height: `${before}px` }, { height: `${after}px` }],
      { duration: SUMMARY_MS, easing: "ease-in-out" },
    );
    if (isOpen) {
      item.rest.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: SUMMARY_MS,
        easing: "ease-in",
      });
    }
    const done = () => {
      p.style.overflow = "";
    };
    glide.addEventListener("finish", done);
    glide.addEventListener("cancel", done);
  }

  rests.forEach((rest, i) => {
    rest.id = rest.id || `fa-more-${i + 1}`;
    rest.tabIndex = -1; // lets focus move into the text once the button is gone
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fa-more-btn";
    btn.textContent = "Read more";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", rest.id);
    rest.before(btn);

    const item = { rest, btn };
    btn.addEventListener("click", () => {
      if (open) setOpen(open, false);
      setOpen(item, true);
      open = item;
      rest.focus({ preventScroll: true });
    });
  });
}

// ── go ────────────────────────────────────────────────────────────────────

document
  .querySelectorAll(".fa-overview")
  .forEach((el) =>
    initMap(el).catch((err) =>
      console.error("Overview map failed to load:", err),
    ),
  );
document.querySelectorAll(".fa-slider").forEach(initSlider);
document.querySelectorAll(".fa-box--summary").forEach(initSummary);
