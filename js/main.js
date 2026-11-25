// main.js: finds each .fa-scrolly on the page, loads its region data and
// chapter config (js/steps/{region}_{chapter}.js), builds the charts and
// connects them to the scroll engine.
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

// chapter navigation (top link, previous/next bar, back to top); a failure here must not stop the charts
import("./nav.js").catch((err) =>
  console.error("Navigation failed to load:", err),
);

// chart types available to the chapter configs
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

// basemap + lookups, loaded once per region and shared by all charts
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

// extra data files of a chart: { bases: "mil_2_bases_{suffix}" } -> { bases: [rows] }
async function loadExtra(files = {}, region) {
  const entries = await Promise.all(
    Object.entries(files).map(async ([name, file]) => [
      name,
      await d3.csv(url(`${file.replace("{suffix}", region.suffix)}.csv`)),
    ]),
  );
  return Object.fromEntries(entries);
}

// the data files of one chart
async function loadData(spec, region) {
  const [rows, sub, extra] = await Promise.all([
    d3.csv(url(`${spec.data}_${region.suffix}.csv`)),
    // optional subregion aggregates (e.g. dipl_2_vis_sub_AF.csv)
    spec.sub ? d3.csv(url(`${spec.sub}_${region.suffix}.csv`)) : [],
    // optional further files, { name: "file_{suffix}" } -> extra.name (rows)
    loadExtra(spec.extra, region),
  ]);
  return { rows, sub, extra };
}

// ?print in the address: no scrolling, every step gets its own chart right
// after its text, already in that step's state (for saving the page as PDF)
const PRINT =new URLSearchParams(location.search).has("print");

async function init(root) {
  const region = REGIONS[root.dataset.region];
  const chapterId = `${root.dataset.region}_${root.dataset.chapter}`;
  const { default: chapter } = await import(`./steps/${chapterId}.js`);

  const stage = root.querySelector(".fa-stage");
  const steps = [...root.querySelectorAll("[data-step]")];
  const base = await loadBase(region);

  colourActorNames(steps, chapter, base.actors);

  if (PRINT) {
    root.classList.add("fa-print");
    await Promise.all(
      steps.map(async (stepEl) => {
        const step = chapter.steps[stepEl.dataset.step];
        if (!step)
          return console.warn(`No config for step "${stepEl.dataset.step}" in ${chapterId}.js`);
        const spec = chapter.charts[step.chart];
        const data = await loadData(spec, region);
        // step text + chart as one block, so a page break never separates them;
        // in the page before the chart is built, so it measures its print width
        const el = document.createElement("div");
        el.className = "fa-chart";
        const pair = document.createElement("div");
        pair.className = "fa-print-step";
        stepEl.before(pair);
        pair.append(stepEl, el);
        const chart = CHART_TYPES[spec.type](el, { ...base, ...data, spec, region, print: true });
        chart.update(step.state, { animate: false });
      }),
    );
    return;
  }

  // build every chart of the chapter (hidden until one of its steps is active)
  const charts = {};
  await Promise.all(
    Object.entries(chapter.charts).map(async ([id, spec]) => {
      const data = await loadData(spec, region);
      const el = document.createElement("div");
      el.className = "fa-chart";
      stage.append(el);
      charts[id] = CHART_TYPES[spec.type](el, { ...base, ...data, spec, region });
    }),
  );

  let active = null;
  scrollEngine(steps, (stepId) => {
    const step = chapter.steps[stepId];
    if (!step)
      return console.warn(`No config for step "${stepId}" in ${chapterId}.js`);
    const chart = charts[step.chart];
    if (chart !== active) {
      Object.values(charts).forEach((c) =>
        c.el.classList.toggle("is-active", c === chart),
      );
    }
    // animate within a chart; switch instantly when a new chart comes in
    chart.update(step.state, { animate: chart === active });
    active = chart;
  });
}

// data-fa-status = "ready" | "failed": tools/print/print-all.mjs waits for it
document.querySelectorAll(".fa-scrolly").forEach((root) =>
  init(root).then(
    () => (root.dataset.faStatus = "ready"),
    (err) => {
      root.dataset.faStatus = "failed";
      console.error("Scrollytelling failed to load:", err);
    },
  ),
);
