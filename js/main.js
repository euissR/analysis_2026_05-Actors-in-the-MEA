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

// chart types available to the chapter configs
const CHART_TYPES = {
  dotMap: makeDotMap,
  rangeChart: makeRangeChart,
  tileGrid: makeTileGrid,
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

async function init(root) {
  const region = REGIONS[root.dataset.region];
  const chapterId = `${root.dataset.region}_${root.dataset.chapter}`;
  const { default: chapter } = await import(`./steps/${chapterId}.js`);

  const stage = root.querySelector(".fa-stage");
  const steps = [...root.querySelectorAll("[data-step]")];
  const base = await loadBase(region);

  // build every chart of the chapter (hidden until one of its steps is active)
  const charts = {};
  await Promise.all(
    Object.entries(chapter.charts).map(async ([id, spec]) => {
      const [rows, sub] = await Promise.all([
        d3.csv(url(`${spec.data}_${region.suffix}.csv`)),
        // optional subregion aggregates (e.g. dipl_2_vis_sub_AF.csv)
        spec.sub ? d3.csv(url(`${spec.sub}_${region.suffix}.csv`)) : [],
      ]);
      const el = document.createElement("div");
      el.className = "fa-chart";
      stage.append(el);
      charts[id] = CHART_TYPES[spec.type](el, {
        ...base,
        rows,
        sub,
        spec,
        region,
      });
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

document
  .querySelectorAll(".fa-scrolly")
  .forEach((root) =>
    init(root).catch((err) =>
      console.error("Scrollytelling failed to load:", err),
    ),
  );
