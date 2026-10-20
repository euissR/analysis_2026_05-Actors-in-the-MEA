// overviewMap.js: world map of the countries and actors in the analysis (landing page).
//
//   makeOverviewMap(el, { countries, disputed, spec });
//
// countries: world_countries.geojson, features with iso3, name, category
//            (category: "country" | "actor" | "both" | blank = not part of the analysis)
// disputed:  world_disputed.geojson, drawn as white dashes on top
// spec (optional): { width, alt }
//
// Same map style as the chapter maps: Robinson projection, white land with light-grey
// outlines, no ocean fill, disputed borders dashed white. Hovering a coloured country
// outlines it in black and names it. No state, no scroll: a static overview.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";
import { geoRobinson } from "../robinson.js";

// the three categories: colours as in the first Flourish version
// (country = grey, actor = fuchsia, both = mauve)
const CATEGORIES = {
  country: {
    label: "Country",
    color: theme.grey,
    tooltip: "Country in the analysis",
  },
  actor: {
    label: "Actor",
    color: theme.fuchsia,
    tooltip: "External actor in the analysis",
  },
  both: {
    label: "Both",
    color: theme.mauve,
    tooltip: "Country and external actor",
  },
};

export function makeOverviewMap(el, { countries, disputed, spec = {} }) {
  const W = spec.width ?? 1000;
  const M = 4; // margin inside the drawing

  // ── projection: the whole world from 84°N down to Tierra del Fuego (56°S),
  // fitted to the width; the height follows from it
  const extent = {
    type: "MultiPoint",
    coordinates: [
      [-180, 0],
      [180, 0],
      [0, 84],
      [0, -56],
    ],
  };
  const projection = geoRobinson().fitWidth(W - 2 * M, extent);
  const [tx, ty] = projection.translate();
  projection.translate([tx + M, ty + M]);
  const path = d3.geoPath(projection);
  const H = Math.ceil(path.bounds(extent)[1][1] + M);

  // ── markup ──────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="fa-head">
      <div class="fa-title">
        <span style="color:${CATEGORIES.country.color}">Countries</span> and
        <span style="color:${CATEGORIES.actor.color}">actors</span> in the analysis
      </div>
      <div class="fa-key"></div>
    </div>
    <div class="fa-map"></div>
    <div class="fa-tooltip" aria-hidden="true"></div>`;
  el.style.setProperty("--fa-aspect", `${W} / ${H}`);
  const tooltip = d3.select(el.querySelector(".fa-tooltip"));

  // ── key ─────────────────────────────────────────────────────────────────
  d3.select(el.querySelector(".fa-key"))
    .selectAll("span")
    .data(Object.values(CATEGORIES))
    .join("span")
    .attr("class", "fa-key-item")
    .html(
      (c) =>
        `<svg width="14" height="14" aria-hidden="true"><rect width="14" height="14" rx="2" fill="${c.color}"/></svg>${c.label}`,
    );

  // ── map ─────────────────────────────────────────────────────────────────
  const svg = d3
    .select(el.querySelector(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("role", "img")
    .attr(
      "aria-label",
      spec.alt ??
        "World map showing the countries covered by the analysis, the external actors, and the states that are both.",
    );

  const category = (d) => CATEGORIES[d.properties.category];

  // land that is not part of the analysis first, coloured countries on top
  const ordered = [...countries.features].sort(
    (a, b) => Boolean(category(a)) - Boolean(category(b)),
  );

  const land = svg
    .append("g")
    .selectAll("path")
    .data(ordered)
    .join("path")
    .attr("d", path)
    .attr("fill", (d) => category(d)?.color ?? theme.land)
    .attr("stroke", (d) => (category(d) ? theme.land : theme.border))
    .attr("stroke-opacity", 0.5)
    .attr("stroke-width", 0.25)
    .attr("pointer-events", (d) => (category(d) ? null : "none"));

  // disputed borders on top, as GISCO has them
  svg
    .append("g")
    .attr("pointer-events", "none")
    .selectAll("path")
    .data(disputed.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", theme.border)
    .attr("stroke-width", 0.6)
    .attr("stroke-dasharray", "1 1");

  // ── hover: thick black outline + name ───────────────────────────────────
  function place(event) {
    const box = el.getBoundingClientRect();
    tooltip
      .style(
        "left",
        `${Math.min(event.clientX - box.left + 12, box.width - 180)}px`,
      )
      .style("top", `${event.clientY - box.top + 12}px`);
  }

  land
    .filter((d) => category(d))
    .on("pointerenter", function (event, d) {
      d3.select(this).raise().attr("stroke", "#000").attr("stroke-width", 1.6);
      tooltip
        .html(`<strong>${d.properties.name}</strong><br>${category(d).tooltip}`)
        .style("opacity", 1);
      place(event);
    })
    .on("pointermove", place)
    .on("pointerleave", function () {
      d3.select(this).attr("stroke", theme.land).attr("stroke-width", 0.5);
      tooltip.style("opacity", 0);
    });

  return { el };
}
