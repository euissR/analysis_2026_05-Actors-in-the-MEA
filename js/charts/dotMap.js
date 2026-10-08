// dotMap.js: one dot per country, switchable by actor.
//
//   const chart = makeDotMap(el, { geo, lookup, actors, rows, sub, spec, region });
//   chart.update(state, { animate });
//
// spec.mode:
//   "presence" (embassies): rows iso3, actor, presence, n
//      presence = Embassy / Office / Consulate / None / blank (= own country)
//      actor "all": n = number of actors present
//      detail (optional) = exact wording for the tooltip, e.g. a partnership label;
//        when blank the category's tooltip text is used
//   "count" (visits): rows iso3, actor, n   (n blank = own country)
//      actor "all": n = all actors combined
// sub (optional): subregion, actor, n, share
// spec.extraTiles (optional): [{ actor, label }] tiles beyond actors.csv, with rows of their own
// spec.ownDots (optional): false = places without a row get no dot (default: a small
//   ring, the actor's own country, as in the visits chart)
// spec.tilesWithData (optional): true = legend tiles only for actors that have data
// spec.extra { pts: "mil_{suffix}_countries" } (optional): sea areas drawn as extra places
// spec.keyByActor (optional, presence mode): true = the key lists only the categories
//   the selected actor has; default lists every category in the data
//
// state:
//   actor:     actor code, or "all"
//   highlight: iso3 codes at full strength; all other dots dimmed (optional)
//   subregion: highlight a whole subregion and label its share (optional)
//   labels:    iso3 codes to label on the map (optional)
//
// The legend tiles let the reader pick another actor. That choice holds until
// the next step, which resets the map to the narrated state.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";
import { geoRobinson } from "../robinson.js";

let clipCount = 0;

export function makeDotMap(
  el,
  { geo, lookup, actors, rows, sub = [], extra = {}, spec, region },
) {
  const { width: W, height: H } = region;
  const counting = spec.mode === "count";
  const cats = spec.categories ?? {};
  const nActors = actors.length;
  // spec.extraTiles: [{ actor, label }], further legend tiles with their own rows in the data
  // (e.g. "naval", "bilateral": a cut of the exercises rather than an actor)
  const extraTiles = spec.extraTiles ?? [];
  const actorLabel = new Map([...actors, ...extraTiles].map((a) => [a.actor, a.label]));
  actorLabel.set("all", spec.allLabel);

  // ── data ────────────────────────────────────────────────────────────────
  const byKey = new Map(rows.map((r) => [`${r.iso3}|${r.actor}`, r]));
  const subByKey = new Map(sub.map((r) => [`${r.subregion}|${r.actor}`, r]));
  const value = (iso3, actor) => byKey.get(`${iso3}|${actor}`);

  const projection = geoRobinson()
    .rotate([-region.center[0], 0])
    .fitExtent(
      [
        [8, 8],
        [W - 8, H - 8],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          region.fit[0],
          region.fit[1],
          [region.fit[0][0], region.fit[1][1]],
          [region.fit[1][0], region.fit[0][1]],
        ],
      },
    );
  const path = d3.geoPath(projection);

  // places: the countries, plus (optional) sea areas from extra.pts, which is a file of
  // iso3, name, subregion, lon, lat (e.g. mil_AF_countries.csv); countries in it are skipped
  const known = new Set(lookup.map((d) => d.iso3));
  const places = [
    ...lookup,
    ...(extra.pts ?? []).filter((d) => !known.has(d.iso3)),
  ];
  const countries = places.map((d) => {
    const [x, y] = projection([+d.lon, +d.lat]);
    return { ...d, x, y };
  });

  // dot size: number of actors (presence) or number of visits (count).
  // Two scales: one shared by all single actors (so they compare across
  // steps), one for "all actors" combined, whose totals are much larger.
  const maxOf = (f) => d3.max(rows.filter(f), (r) => +r.n || 0);
  const scales = {
    actor: d3
      .scaleSqrt()
      .domain([0, maxOf((r) => r.actor !== "all")])
      .range([0, spec.rMaxActor ?? 14]),
    all: d3
      .scaleSqrt()
      .domain([0, counting ? maxOf((r) => r.actor === "all") : nActors])
      .range([0, spec.rMaxAll ?? 11]),
  };
  const scaleFor = (state) =>
    state.actor === "all" ? scales.all : scales.actor;

  // ── markup ──────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="fa-head">
      <div class="fa-title"></div>
      <div class="fa-subtitle"></div>
    </div>
    <div class="fa-tiles" role="group" aria-label="Select an actor"></div>
    <div class="fa-map"></div>
    <div class="fa-foot">
      <div class="fa-key"></div>
      <div class="fa-source"></div>
    </div>
    <div class="fa-tooltip" aria-hidden="true"></div>`;

  el.style.setProperty("--fa-aspect", `${W} / ${H}`);
  const $ = (sel) => el.querySelector(sel);
  $(".fa-title").textContent = spec.title;
  $(".fa-source").textContent = spec.source;
  const tooltip = d3.select($(".fa-tooltip"));

  // ── legend tiles (actor selector) ───────────────────────────────────────
  const tiles = d3
    .select($(".fa-tiles"))
    .selectAll("button")
    .data([
      { actor: "all", label: spec.allLabel },
      // spec.tilesWithData: only the actors that have rows in this chart's data
      ...actors.filter(
        (a) => !spec.tilesWithData || rows.some((r) => r.actor === a.actor),
      ),
      ...extraTiles.filter((a) => rows.some((r) => r.actor === a.actor)),
    ])
    .join("button")
    .attr("type", "button")
    .attr("class", "fa-tile")
    .text((d) => d.label)
    .on("click", (event, d) => {
      render({ actor: d.actor }, true);
    });

  // ── map ─────────────────────────────────────────────────────────────────
  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", spec.title);

  // region countries only: white land, light-grey outlines, no ocean fill
  svg
    .append("g")
    .selectAll("path")
    .data(geo.countries.features)
    .join("path")
    .attr("d", path)
    .attr("fill", theme.land)
    .attr("stroke", theme.border)
    .attr("stroke-width", 0.5);

  // disputed borders, clipped to the region's land so lines between
  // non-region countries (e.g. Israel/Palestine on the Africa map) drop out
  const clipId = `fa-clip-${++clipCount}`;
  svg
    .append("clipPath")
    .attr("id", clipId)
    .selectAll("path")
    .data(geo.countries.features)
    .join("path")
    .attr("d", path);

  svg
    .append("g")
    .attr("clip-path", `url(#${clipId})`)
    .selectAll("path")
    .data(geo.disputed.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", theme.land)
    .attr("stroke-width", 0.9)
    .attr("stroke-dasharray", "2 2");

  const dots = svg
    .append("g")
    .selectAll("circle")
    .data(countries, (d) => d.iso3)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 0)
    .attr("stroke-width", 0.75)
    .on("pointerenter pointermove", showTooltip)
    .on("pointerleave", () => tooltip.style("opacity", 0));

  const labelLayer = svg.append("g").attr("class", "fa-labels");
  const noteLayer = svg.append("g").attr("class", "fa-labels");

  // ── encodings ───────────────────────────────────────────────────────────
  const OWN = { r: 3.5, fill: theme.land, stroke: theme.grey }; // actor's own country
  const ZERO = { r: 2, fill: theme.light, stroke: theme.land };
  const NONE = { r: 0, fill: "none", stroke: "none" }; // nothing drawn, nothing to hover

  function look(d, state) {
    const row = value(d.iso3, state.actor);
    if (counting || state.actor === "all") {
      // no row = no dot, if the chart says so (exercises); in the visits chart a place
      // without a row is the actor's own country
      if (!row && spec.ownDots === false) return NONE;
      if (row?.n === "" || row?.n == null) return OWN;
      const n = +row.n;
      return n
        ? { r: scaleFor(state)(n), fill: theme.teal, stroke: theme.land }
        : ZERO;
    }
    const presence = row?.presence ?? "";
    if (!presence) return OWN;
    const cat = cats[presence] ?? cats.None;
    return { r: cat.r, fill: cat.color, stroke: theme.land };
  }

  function tooltipLine(d, state) {
    const row = value(d.iso3, state.actor);
    const label = actorLabel.get(state.actor);
    if (counting || state.actor === "all") {
      if (row?.n === "" || row?.n == null) return `${label}: own country`;
      return spec.tooltipCount(+row.n, label, nActors);
    }
    const presence = row?.presence ?? "";
    if (!presence) return `${label}: own country`;
    const cat = cats[presence] ?? cats.None;
    return row.detail
      ? `${label}: ${cat.tooltip} (${row.detail})`
      : `${label}: ${cat.tooltip}`;
  }

  // ── render ──────────────────────────────────────────────────────────────
  let shown = null; // state on screen (the step's, or the reader's choice)

  function render(state, animate) {
    shown = state;
    const t = d3.transition().duration(animate ? theme.duration : 0);

    const hi = new Set(
      state.subregion
        ? countries
            .filter((d) => d.subregion === state.subregion)
            .map((d) => d.iso3)
        : (state.highlight ?? []),
    );

    tiles.attr("aria-pressed", (d) => d.actor === state.actor);
    $(".fa-subtitle").textContent =
      state.actor === "all" ? spec.subtitleAll : spec.subtitleActor;

    dots
      .each(function (d) {
        d.look = look(d, state);
      })
      .sort((a, b) => b.look.r - a.look.r) // small dots on top
      .transition(t)
      .attr("r", (d) => d.look.r)
      .attr("fill", (d) => d.look.fill)
      .attr("stroke", (d) => d.look.stroke)
      .attr("opacity", (d) => (hi.size && !hi.has(d.iso3) ? theme.dim : 1));

    // country labels, to the right of their dots
    const labelled = countries.filter((d) =>
      (state.labels ?? []).includes(d.iso3),
    );
    labelLayer
      .selectAll("text")
      .data(labelled, (d) => d.iso3)
      .join(
        (enter) => enter.append("text").attr("opacity", 0),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      // labels go to the right of the dot, to the left near the map's east edge
      .attr("text-anchor", (d) => (d.x > W * 0.78 ? "end" : "start"))
      .attr("x", (d) => d.x + (d.x > W * 0.78 ? -(d.look.r + 3) : d.look.r + 3))
      .attr("y", (d) => d.y + 4)
      .text((d) => d.name)
      .transition(t)
      .attr("opacity", 1);

    // subregion share, in a fixed corner of the map (region.note)
    const share =
      state.subregion && subByKey.get(`${state.subregion}|${state.actor}`);
    const [nx, ny] = region.note ?? [12, H - 40];
    const notes = share
      ? [
          {
            key: state.subregion,
            x: nx,
            y: ny,
            lines: [
              state.subregion,
              spec.shareText(share.share, actorLabel.get(state.actor)),
            ],
          },
        ]
      : [];
    noteLayer
      .selectAll("text")
      .data(notes, (d) => d.key)
      .join(
        (enter) =>
          enter.append("text").attr("class", "fa-note").attr("opacity", 0),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .each(function (d) {
        d3.select(this)
          .selectAll("tspan")
          .data(d.lines)
          .join("tspan")
          .attr("x", d.x)
          .attr("dy", (l, i) => (i ? "1.2em" : 0))
          .attr("font-weight", (l, i) => (i ? 400 : 700))
          .text((l) => l);
      })
      .transition(t)
      .attr("opacity", 1);

    renderKey(state);
  }

  // Pixels per map unit as drawn. The SVG scales to fit the width AND the height
  // of its box (meet), so the width alone is not enough: on a short, wide stage
  // the height decides, and the key would no longer match the dots.
  const mapScale = () => svg.node().getScreenCTM()?.a || 1;

  // The key's height changes the map's height, which changes the map scale, which
  // changes the key. Draw, re-measure and redraw until the two agree (2-3 passes).
  function renderKey(state) {
    for (let i = 0; i < 6; i++) {
      const k = mapScale();
      drawKey(state, k);
      if (Math.abs(mapScale() - k) / k < 0.002) break;
    }
  }

  function drawKey(state, k) {
    const key = d3.select($(".fa-key"));
    key.selectAll("*").remove();

    if (counting || state.actor === "all") {
      // size key
      const rSize = scaleFor(state);
      const top = rSize.domain()[1];
      const values = (state.actor === "all"
        ? spec.keyValuesAll
        : spec.keyValuesActor) ?? [1, Math.round(top / 2), top];
      const maxR = rSize(d3.max(values)) * k;
      const step = maxR * 2 + 12;
      const s = key
        .append("svg")
        .attr("width", values.length * step)
        .attr("height", maxR * 2 + 16)
        .attr("aria-hidden", true);
      const g = s
        .selectAll("g")
        .data(values)
        .join("g")
        .attr("transform", (v, i) => `translate(${i * step + step / 2},0)`);
      g.append("circle")
        .attr("cy", (v) => maxR * 2 - rSize(v) * k + 1)
        .attr("r", (v) => rSize(v) * k)
        .attr("fill", theme.teal);
      g.append("text")
        .attr("y", maxR * 2 + 14)
        .attr("text-anchor", "middle")
        .text((v) => v);
      key.append("span").attr("class", "fa-key-label").text(spec.keySize);
      return;
    }

    // category key: only categories that occur in this region's data
    const present = new Set(
      rows
        .filter((r) =>
          spec.keyByActor ? r.actor === state.actor : r.actor !== "all",
        )
        .map((r) => r.presence),
    );
    key
      .selectAll("span.fa-key-item")
      .data(Object.entries(cats).filter(([k]) => present.has(k)))
      .join("span")
      .attr("class", "fa-key-item")
      .html(([, c]) => {
        const r = c.r * k;
        return `<svg width="${r * 2 + 2}" height="${r * 2 + 2}" aria-hidden="true"><circle cx="${r + 1}" cy="${r + 1}" r="${r}" fill="${c.color}"/></svg>${c.label}`;
      });
  }

  function showTooltip(event, d) {
    const box = el.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    tooltip
      .html(`<strong>${d.name}</strong><br>${tooltipLine(d, shown)}`)
      .style("opacity", 1)
      .style("left", `${Math.min(x + 12, box.width - 180)}px`)
      .style("top", `${y + 12}px`);
  }

  // the key is drawn in pixels, the dots in map units: redraw the key when the map is resized
  new ResizeObserver(() => {
    if (shown) renderKey(shown);
  }).observe($(".fa-map"));

  return {
    el,
    update(state, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
