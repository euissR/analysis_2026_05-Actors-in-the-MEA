// slides.js: presentation mode. The same charts as the chapter pages, one per slide, no step text.
// The slides are listed in steps/deck.js; each one points at a step of a chapter (chart + state),
// so nothing is configured twice. Flip with the arrow keys, space, the buttons or a swipe;
// F toggles full screen; the number in the address (#12) is the slide, so a slide can be linked.
//
// Markup it needs (see index_slides.html):
//   <div class="fa-slides"></div>
// It builds the rest itself: the chart stage, the floating contents (the six sections, current one
// marked) and the bar with previous / next and the slide counter.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CONFIG } from "./config.js";
import { REGIONS } from "./regions.js";
import { CHAPTERS, ORDER } from "./chapters.js";
import DECK from "./steps/deck.js";
import { makeDotMap } from "./charts/dotMap.js";
import { makeRangeChart } from "./charts/rangeChart.js";
import { makeTileGrid } from "./charts/tileGrid.js";
import { makeSankey } from "./charts/sankey.js";
import { makeMilMap } from "./charts/milMap.js";
import { makeStackedCols } from "./charts/stackedCols.js";
import { makePeriodRange } from "./charts/periodRange.js";
import { makeFlowBars } from "./charts/flowBars.js";
import { makePanelBars } from "./charts/panelBars.js";
import { makeBubble } from "./charts/bubble.js";
import { makeLineChart } from "./charts/lineChart.js";
import { makeGeoBubbles } from "./charts/geoBubbles.js";

// chart types: keep in step with CHART_TYPES in main.js
const CHART_TYPES = {
  dotMap: makeDotMap,
  rangeChart: makeRangeChart,
  tileGrid: makeTileGrid,
  sankey: makeSankey,
  milMap: makeMilMap,
  stackedCols: makeStackedCols,
  periodRange: makePeriodRange,
  flowBars: makeFlowBars,
  panelBars: makePanelBars,
  bubble: makeBubble,
  lineChart: makeLineChart,
  geoBubbles: makeGeoBubbles,
};

const url = (file) => `${CONFIG.BASE_URL}/data/${file}`;

// basemap + lookups, loaded once per region and shared by all charts (as in main.js)
const baseCache = {};
function loadBase(region) {
  baseCache[region.geo] ??= Promise.all([
    d3.json(url(`${region.geo}_countries.geojson`)),
    d3.json(url(`${region.geo}_disputed.geojson`)),
    d3.csv(url(`${region.geo}_countries.csv`), d3.autoType),
    d3.csv(url("actors.csv"), d3.autoType),
  ]).then(([countries, disputed, lookup, actors]) => ({
    geo: { countries, disputed },
    lookup,
    actors: actors.sort((a, b) => a.order - b.order),
  }));
  return baseCache[region.geo];
}

// extra data files of a chart: { bases: "mil_2_bases_{suffix}" } -> { bases: [rows] } (as in main.js)
async function loadExtra(files = {}, region) {
  const entries = await Promise.all(
    Object.entries(files).map(async ([name, file]) => [
      name,
      await d3.csv(url(`${file.replace("{suffix}", region.suffix)}.csv`)),
    ]),
  );
  return Object.fromEntries(entries);
}

function make(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

async function init(root) {
  root.classList.add("is-loading");

  // 1. the slides, in reading order (sections as on the page)
  const sectionIds = ORDER.AF.filter((id) => DECK[id]?.length);
  const listed = sectionIds.flatMap((section) =>
    DECK[section].map((s) => ({ ...s, section })),
  );

  // 2. the chapter configs the slides point at
  const chapterKeys = [...new Set(listed.map((s) => s.chapter))];
  const chapters = Object.fromEntries(
    await Promise.all(
      chapterKeys.map(async (k) => [k, (await import(`./steps/${k}.js`)).default]),
    ),
  );

  // 3. each slide = the step's chart and state, with the slide's override on top
  const slides = [];
  listed.forEach((s) => {
    const step = chapters[s.chapter].steps[s.step];
    if (!step) return console.warn(`slides: no step "${s.step}" in ${s.chapter}.js`);
    slides.push({
      section: s.section,
      chartKey: `${s.chapter}:${step.chart}`,
      state: { ...step.state, ...s.override },
    });
  });
  if (!slides.length) return console.warn("slides: the deck is empty");

  // 4. page furniture: contents | stage | bar
  const toc = make("nav", "fa-slides-toc");
  toc.setAttribute("aria-label", "Sections");
  const tocList = make("ol");
  toc.append(tocList);
  const stage = make("div", "fa-slides-stage");
  const bar = make("div", "fa-slides-bar");
  const prev = make("button", "fa-slides-btn", "←");
  const next = make("button", "fa-slides-btn", "→");
  const count = make("span", "fa-slides-count");
  prev.type = next.type = "button";
  prev.setAttribute("aria-label", "Previous slide");
  next.setAttribute("aria-label", "Next slide");
  count.setAttribute("aria-live", "polite");
  const hint = make("span", "fa-slides-hint", "← → to flip · F full screen");
  bar.append(prev, count, next, hint);
  root.append(toc, stage, bar);

  const tocItems = {};
  let number = 0; // numbered by what is in the deck, so an empty section leaves no gap
  sectionIds.forEach((id) => {
    const first = slides.findIndex((s) => s.section === id);
    if (first < 0) return;
    const li = make("li");
    const a = make("a");
    a.href = `#${first + 1}`;
    a.append(
      make("span", "fa-slides-toc-n", String(++number)),
      make("span", "fa-slides-toc-t", CHAPTERS[id].title),
      make("span", "fa-slides-toc-s", CHAPTERS[id].subtitle),
    );
    li.append(a);
    tocList.append(li);
    tocItems[id] = { li, a };
  });

  // 5. build the charts the slides use (hidden until a slide shows them)
  const charts = {};
  await Promise.all(
    [...new Set(slides.map((s) => s.chartKey))].map(async (key) => {
      try {
        const [chapterKey, id] = key.split(":");
        const region = REGIONS[chapterKey.split("_")[0]];
        const spec = chapters[chapterKey].charts[id];
        const base = await loadBase(region);
        const [rows, sub, extra] = await Promise.all([
          d3.csv(url(`${spec.data}_${region.suffix}.csv`)),
          spec.sub ? d3.csv(url(`${spec.sub}_${region.suffix}.csv`)) : [],
          loadExtra(spec.extra, region),
        ]);
        const el = make("div", "fa-chart");
        stage.append(el);
        charts[key] = CHART_TYPES[spec.type](el, {
          ...base,
          rows,
          sub,
          extra,
          spec,
          region,
        });
      } catch (err) {
        console.error(`slides: chart ${key} failed to build`, err);
      }
    }),
  );

  // 6. show a slide
  let index = -1;
  let active = null;

  function show(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === index) return;
    index = i;
    const slide = slides[i];
    const chart = charts[slide.chartKey];
    if (chart) {
      if (chart !== active) {
        Object.values(charts).forEach((c) =>
          c.el.classList.toggle("is-active", c === chart),
        );
      }
      // animate within a chart; switch instantly when a new chart comes in
      chart.update(slide.state, { animate: chart === active });
      active = chart;
    }

    count.textContent = `${i + 1} / ${slides.length}`;
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    Object.entries(tocItems).forEach(([id, { li, a }]) => {
      const here = id === slide.section;
      li.classList.toggle("is-current", here);
      if (here) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    history.replaceState(null, "", `#${i + 1}`);
  }

  const fromHash = () => {
    const n = parseInt(location.hash.slice(1), 10);
    show(Number.isFinite(n) ? n - 1 : 0);
  };

  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  window.addEventListener("hashchange", fromHash);

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select")) return;
    const key = e.key;
    if (key === " " && e.target.closest?.("button, a")) return; // let the control take the space
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(key)) show(index + 1);
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(key)) show(index - 1);
    else if (key === "Home") show(0);
    else if (key === "End") show(slides.length - 1);
    else if (key === "f" || key === "F") {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    } else return;
    e.preventDefault();
  });

  // swipe on touch screens
  let x0 = null;
  root.addEventListener("touchstart", (e) => (x0 = e.changedTouches[0].clientX), {
    passive: true,
  });
  root.addEventListener("touchend", (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 60) show(index + (dx < 0 ? 1 : -1));
  });

  root.classList.remove("is-loading");
  fromHash();
}

document
  .querySelectorAll(".fa-slides")
  .forEach((root) =>
    init(root).catch((err) => console.error("Slides failed to load:", err)),
  );
