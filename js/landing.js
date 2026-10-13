// landing.js: the landing page. Builds the overview map (.fa-overview) and the
// key-insights slider (.fa-slider). The chapter pages use main.js instead.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CONFIG } from "./config.js";
import { makeOverviewMap } from "./charts/overviewMap.js";

// slider: PNGs in img/slider/
const SLIDER_IMAGES = [
  "key visual mil_ex.png",
  "key visual sop_dia_ext.png",
  "key visual eco_hydro.png",
  "key visual mil_dep.png",
  "key visual eco_green.png",
  "key visual eco_aid.png",
];
const SLIDER_INTERVAL = 4500; // ms between images

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
    img.src = `${CONFIG.BASE_URL}/img/slider/${encodeURI(file)}`;
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
    if (imgs.length > 1 && !timer) timer = setInterval(next, SLIDER_INTERVAL);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }

  el.addEventListener("mouseenter", stop);
  el.addEventListener("mouseleave", start);

  // swipe (touch and mouse drag, Pointer Events)
  if (imgs.length > 1) {
    const SWIPE_THRESHOLD = 40;
    let dragStartX = null;
    let dragging = false;

    el.addEventListener("pointerdown", (e) => {
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

// ── go ────────────────────────────────────────────────────────────────────

document.querySelectorAll(".fa-overview").forEach((el) =>
  initMap(el).catch((err) => console.error("Overview map failed to load:", err)),
);
document.querySelectorAll(".fa-slider").forEach(initSlider);
