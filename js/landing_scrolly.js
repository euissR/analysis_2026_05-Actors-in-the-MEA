// landing_scrolly.js: the "Main findings" scrollytelling on the landing page.
// Reuses the chapter charts: each step of js/steps/landing.js points at a chapter step.
// Unlike main.js (one region + one chapter, every chart built up front), charts come from
// several chapters and both regions, and each is built only when its step gets near.
//   - step activation: scroll.js, as in the chapters
//   - preloading: an IntersectionObserver, one screen ahead (data + chart of the step and the next one)
// landing.js still draws the overview map and the theme cards; this file only does the scrolly.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CONFIG } from "./config.js";
import { REGIONS } from "./regions.js";
import { scrollEngine } from "./scroll.js";
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
import { colourActorNames } from "./actorNames.js";
import landing, { CHAPTERS } from "./steps/landing.js";

// same as main.js (kept in step by hand: main.js runs on import, so it cannot be imported here)
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

// actors.csv once, shared by both regions and the name colouring
let actorsP;
const loadActors = () =>
  (actorsP ??= d3
    .csv(url("actors.csv"), d3.autoType)
    .then((a) => a.sort((x, y) => x.order - y.order)));

// basemap + lookups, loaded once per region (as in main.js)
const baseCache = {};
function loadBase(region) {
  baseCache[region.geo] ??= Promise.all([
    d3.json(url(`${region.geo}_countries.geojson`)),
    d3.json(url(`${region.geo}_disputed.geojson`)),
    d3.csv(url(`${region.geo}_countries.csv`), d3.autoType),
    loadActors(),
  ]).then(([countries, disputed, lookup, actors]) => ({
    geo: { countries, disputed },
    lookup,
    actors,
  }));
  return baseCache[region.geo];
}

// extra data files of a chart (as in main.js)
async function loadExtra(files = {}, region) {
  const entries = await Promise.all(
    Object.entries(files).map(async ([name, file]) => [
      name,
      await d3.csv(url(`${file.replace("{suffix}", region.suffix)}.csv`)),
    ]),
  );
  return Object.fromEntries(entries);
}

// chapter endnote markers at the start of a footnote ("¹⁵ Afrobarometer ...") mean nothing here
const stripMarker = (s) =>
  typeof s === "string" ? s.replace(/^[¹²³⁰-⁹]+\s*/, "") : s;

// one landing step -> { key, spec, region, state }; key = "AF_dipl:emb" (chart ids repeat across chapters)
function resolve(id) {
  const cfg = landing.steps[id];
  if (!cfg) return null;
  const chapter = CHAPTERS[cfg.chapter];
  const step = chapter?.steps[cfg.step];
  if (!step) {
    console.warn(`Landing step "${id}": no step "${cfg.step}" in ${cfg.chapter}.js`);
    return null;
  }
  const state = { ...step.state, ...cfg.override };
  if (state.footnote) state.footnote = stripMarker(state.footnote);
  return {
    key: `${cfg.chapter}:${step.chart}`,
    spec: chapter.charts[step.chart],
    region: REGIONS[cfg.region],
    state,
  };
}

function init(root) {
  const stage = root.querySelector(".fa-stage");
  const steps = [...root.querySelectorAll("[data-step]")];
  const resolved = Object.fromEntries(steps.map((s) => [s.dataset.step, resolve(s.dataset.step)]));

  // ── charts, built on demand ────────────────────────────────────────────
  const built = {}; // key -> Promise<chart>
  function ensure(r) {
    if (!r) return Promise.resolve(null);
    built[r.key] ??= (async () => {
      const { spec, region } = r;
      const [base, rows, sub, extra] = await Promise.all([
        loadBase(region),
        d3.csv(url(`${spec.data}_${region.suffix}.csv`)),
        spec.sub ? d3.csv(url(`${spec.sub}_${region.suffix}.csv`)) : [],
        loadExtra(spec.extra, region),
      ]);
      const el = document.createElement("div");
      el.className = "fa-chart";
      stage.append(el);
      return CHART_TYPES[spec.type](el, { ...base, rows, sub, extra, spec, region });
    })().catch((err) => {
      console.error(`Landing chart ${r.key} failed to load:`, err);
      delete built[r.key]; // try again next time
      return null;
    });
    return built[r.key];
  }

  // ── step activation (scroll.js) ────────────────────────────────────────
  let near = false; // nothing is loaded before the scrolly comes close
  let currentId = null;
  let active = null;
  const charts = new Set();

  async function show(id) {
    const r = resolved[id];
    const chart = await ensure(r);
    if (!chart || id !== currentId) return; // the reader has moved on meanwhile
    charts.add(chart);
    if (chart !== active)
      charts.forEach((c) => c.el.classList.toggle("is-active", c === chart));
    // animate within a chart; switch instantly when a new chart comes in
    chart.update(r.state, { animate: chart === active });
    active = chart;
  }

  scrollEngine(steps, (id) => {
    currentId = id;
    if (near) show(id);
  });

  // ── preloading (IntersectionObserver, one screen ahead) ────────────────
  const preload = (i) => {
    [steps[i], steps[i + 1]].forEach((s) => s && ensure(resolved[s.dataset.step]));
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        preload(steps.indexOf(e.target));
        if (!near) {
          near = true;
          colourNames();
          show(currentId);
        }
      });
    },
    { rootMargin: "100% 0px 100% 0px" },
  );
  steps.forEach((s) => io.observe(s));

  // actor names in the text, as in the chapters (synthetic chapter: landing step -> chart + state)
  function colourNames() {
    const chapter = { steps: {}, charts: {} };
    for (const [id, r] of Object.entries(resolved)) {
      if (!r) continue;
      chapter.steps[id] = { chart: r.key, state: r.state };
      chapter.charts[r.key] = r.spec;
    }
    loadActors()
      .then((actors) => colourActorNames(steps, chapter, actors))
      .catch((err) => console.error("Actor names failed:", err));
  }
}

document.querySelectorAll(".fa-scrolly[data-landing]").forEach((root) => {
  try {
    init(root);
  } catch (err) {
    console.error("Landing scrollytelling failed to load:", err);
  }
});
