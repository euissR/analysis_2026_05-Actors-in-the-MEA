// geoBubbles.js: one bubble per country on the map (area = the measure). Built for the infrastructure chapter (PPI sponsor stakes by host country, World
// Bank works awards by borrower country); fits any "value per country" map.
//
//   const chart = makeGeoBubbles(el, { geo, lookup, actors, rows, extra, spec, region });
//   chart.update(state, { animate });
//
// The bubbles sit on the country dots of {region}_countries.csv (lookup: iso3, name, subregion, lon, lat),
// not on project sites: the data has no coordinates.
//
// rows (infra_2_map_AF.csv): iso3, measure, actor, value, share_country_pct, share_actor_pct,
//   lead_actor, lead_share_pct. actor "all" = every foreign actor together (with the largest one in
//   lead_actor, which colours the bubble); any other actor code = that actor alone.
//
// spec:
//   title, source
//   measures:   { ppi: { title, subtitle: (actor, label) => text, unit, format, sizeTitle, keyAll }, works: {...} }
//                 unit: wording after the value in the tooltip; format: d3 format; keyAll: reference sizes
//                 for "all actors" (a single actor gets 10%, 1/3 and 100% of its own largest bubble)
//   Bubble area: one scale per measure for "all actors"; each single actor has its own scale (its largest country).
//   labels:     { code: label } where actors.csv has none (REG, GBR, other, GCC ...)
//   greyLabel:  key wording for the actors without a colour (default "Regional, UK or other")
//   rMax:       radius of the largest bubble in map units (default 30)
//
// state:
//   measure:    "ppi" | "works"
//   actor:      "all" (default) or an actor code
//   highlight:  iso3 codes at full strength, the rest dimmed (optional)
//   subregion:  highlight a whole subregion (optional)
//   labels:     iso3 codes to name on the map (optional)
//   title, footnote: override for this step

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";
import { geoRobinson } from "../robinson.js";
import { makeHover } from "./hover.js";

let clipCount = 0;
const GULF = new Set(["ARE", "SAU", "QAT", "KWT", "OMN", "BHR"]);

export function makeGeoBubbles(el, { geo, lookup, actors = [], rows, extra = {}, spec, region }) {
  const { width: W, height: H } = region;

  // ── data ────────────────────────────────────────────────────────────────
  const num = (v) => (v === "" || v == null ? NaN : +v);
  const byKey = new Map(rows.map((r) => [`${r.iso3}|${r.measure}|${r.actor}`, { ...r, value: num(r.value), share_country_pct: num(r.share_country_pct), share_actor_pct: num(r.share_actor_pct), lead_share_pct: num(r.lead_share_pct) }]));
  const get = (iso3, m, a) => byKey.get(`${iso3}|${m}|${a}`);
  const actorLabel = (a) => spec.labels?.[a] ?? actors.find((x) => x.actor === a)?.label ?? a;
  const colorOf = (a) => theme.actorColors?.[a] ?? theme.light;
  const rMax = spec.rMax ?? 30;
  // one scale per measure for "all actors"; one per measure and actor for a single actor
  // (the small actors would otherwise vanish next to China's Tanzania)
  const scaleCache = {};
  const scaleFor = (state) => {
    const k = `${state.measure}|${state.actor}`;
    scaleCache[k] ??= d3
      .scaleSqrt()
      .domain([0, d3.max(rows.filter((r) => r.measure === state.measure && r.actor === state.actor), (r) => +r.value) ?? 1])
      .range([0, rMax]);
    return scaleCache[k];
  };

  const projection = geoRobinson()
    .rotate([-region.center[0], 0])
    .fitExtent(
      [[8, 8], [W - 8, H - 8]],
      {
        type: "MultiPoint",
        coordinates: [region.fit[0], region.fit[1], [region.fit[0][0], region.fit[1][1]], [region.fit[1][0], region.fit[0][1]]],
      },
    );
  const path = d3.geoPath(projection);
  const countries = lookup.map((d) => {
    const [x, y] = projection([+d.lon, +d.lat]);
    return { ...d, x, y };
  });

  // ── markup ──────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="fa-head">
      <div class="fa-title"></div>
      <div class="fa-subtitle"></div>
    </div>
    <div class="fa-map"></div>
    <div class="fa-foot">
      <div class="fa-key"></div>
      <div class="fa-source"><span class="fa-footnote" style="display:block;font-size:0.8125rem;line-height:1.25;margin-bottom:0.25rem"></span><span class="fa-credit"></span></div>
    </div>
    <div class="fa-tooltip" aria-hidden="true"></div>`;
  el.style.setProperty("--fa-aspect", `${W} / ${H}`);
  const $ = (sel) => el.querySelector(sel);
  $(".fa-credit").textContent = spec.source ?? "";
  const tooltip = d3.select($(".fa-tooltip"));
  const hover = makeHover(el, tooltip);

  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", spec.title ?? "Map");

  // region countries only: white land, light-grey outlines (as in dotMap)
  svg
    .append("g")
    .selectAll("path")
    .data(geo.countries.features)
    .join("path")
    .attr("d", path)
    .attr("fill", theme.land)
    .attr("stroke", theme.border)
    .attr("stroke-width", 0.5);
  const clipId = `fa-clip-gb-${++clipCount}`;
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

  const gBubbles = svg.append("g");
  const gLabels = svg.append("g").attr("class", "fa-labels");
  const gKey = svg.append("g").attr("class", "fa-axis");

  // ── render ──────────────────────────────────────────────────────────────
  let shown = null;

  function render(state, animate) {
    state = { actor: "all", ...state };
    shown = state;
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const m = state.measure;
    const ms = spec.measures[m];
    const rs = scaleFor(state);
    const single = state.actor !== "all";

    const hi = new Set(
      state.subregion
        ? countries.filter((d) => d.subregion === state.subregion).map((d) => d.iso3)
        : (state.highlight ?? []),
    );
    const dimmed = (iso3) => hi.size && !hi.has(iso3);

    $(".fa-title").textContent = state.title ?? ms.title ?? spec.title ?? "";
    $(".fa-subtitle").textContent = ms.subtitle?.(state.actor, actorLabel(state.actor)) ?? "";
    $(".fa-footnote").textContent = state.footnote ?? "";

    // bubbles: one per country that has a value for this measure and actor
    const pts = countries
      .map((d) => ({ ...d, row: get(d.iso3, m, state.actor) }))
      .filter((d) => d.row && d.row.value > 0)
      .map((d) => ({
        ...d,
        r: rs(d.row.value),
        fill: single ? colorOf(state.actor) : colorOf(d.row.lead_actor),
      }));
    gBubbles
      .selectAll("circle")
      .data(d3.sort(pts, (a, b) => d3.descending(a.r, b.r)), (d) => d.iso3)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", 0)
            .attr("opacity", 0)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("pointerenter pointermove", showTip)
            .on("pointerleave", hover.leave),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).attr("r", 0).remove(),
      )
      .attr("fill", (d) => d.fill)
      .order()
      .transition(t)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("opacity", (d) => (dimmed(d.iso3) ? theme.dim : 0.85));

    // country names: to the right of the bubble, to the left near the map's east edge
    const labelled = pts.filter((d) => (state.labels ?? []).includes(d.iso3));
    gLabels
      .selectAll("text")
      .data(labelled, (d) => d.iso3)
      .join(
        (enter) => enter.append("text").attr("opacity", 0),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .attr("text-anchor", (d) => (d.x > W * 0.78 ? "end" : "start"))
      .attr("x", (d) => d.x + (d.x > W * 0.78 ? -(d.r + 3) : d.r + 3))
      .attr("y", (d) => d.y + 4)
      .text((d) => d.name)
      .transition(t)
      .attr("opacity", 1);

    drawSizeKey(m, rs, single);
    drawColourKey(pts, single, state);
  }

  // size key, bottom left on the open Atlantic: reference circles on the current scale
  function drawSizeKey(m, rs, single) {
    const ms = spec.measures[m];
    const top = rs.domain()[1];
    const values = single
      ? [top / 10, top / 3, top].map((v) => +d3.format(".2r")(v))
      : (ms.keyAll ?? []).filter((v) => v <= top);
    const fmt = (v) => d3.format(v >= 10 || !single ? (ms.format ?? ",.0f") : ".1f")(v);
    const yb = H - 30;
    const maxR = rs(d3.max(values) ?? 0);
    gKey.selectAll("*").remove();
    gKey
      .append("text")
      .attr("x", 12)
      .attr("y", yb - 2 * maxR - 8)
      .attr("font-weight", 700)
      .text(ms.sizeTitle ?? "Bubble area");
    let x = 12;
    values.forEach((v) => {
      const r = rs(v);
      gKey
        .append("circle")
        .attr("cx", x + r)
        .attr("cy", yb - r)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", theme.grey)
        .attr("stroke-width", 1.25);
      gKey
        .append("text")
        .attr("x", x + r)
        .attr("y", yb + 14)
        .attr("text-anchor", "middle")
        .text(fmt(v));
      x += 2 * r + 12;
    });
  }

  // colour key under the map: who leads (all actors) or the single actor
  function drawColourKey(pts, single, state) {
    const items = [];
    if (single) {
      items.push({ label: actorLabel(state.actor), color: colorOf(state.actor), n: 1 });
    } else {
      const grp = (a) => (GULF.has(a) ? "GCC" : a);
      // actors without a colour (regional, UK, other) are all light grey: one key entry for them
      const grey = spec.greyLabel ?? "Regional, UK or other";
      d3.rollups(pts, (v) => v.length, (d) => grp(d.row.lead_actor))
        .map(([a, n]) => ({ label: colorOf(a) === theme.light ? grey : actorLabel(a), color: colorOf(a), n }))
        .sort((x, y) => d3.descending(x.n, y.n))
        .forEach((k) => {
          const hit = items.find((i) => i.label === k.label);
          if (hit) hit.n += k.n;
          else items.push(k);
        });
    }
    const key = d3.select($(".fa-key")).style("flex-wrap", "wrap");
    key.html(
      (single ? "" : `<span class="fa-key-label">Largest actor in the country:</span>`) +
        items
          .map((k) => `<span class="fa-key-item"><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5.5" fill="${k.color}"/></svg>${k.label}</span>`)
          .join(""),
    );
  }

  function showTip(event, d) {
    const st = shown;
    const ms = spec.measures[st.measure];
    const fmt = d3.format(ms.format ?? ",.0f");
    const single = st.actor !== "all";
    const row = d.row;
    const lines = [`${single ? actorLabel(st.actor) : "All foreign actors"}: ${fmt(row.value)} ${ms.unit ?? ""}`];
    if (single) {
      lines.push(`${d3.format(".1f")(row.share_country_pct)}% of the country’s total`);
      lines.push(`${d3.format(".1f")(row.share_actor_pct)}% of ${actorLabel(st.actor)}’s total in Africa`);
    } else {
      lines.push(`Largest: ${actorLabel(row.lead_actor)} (${d3.format(".0f")(row.lead_share_pct)}%)`);
    }
    tooltip
      .html(`<strong>${d.name}</strong><br>${lines.join("<br>")}`)
      .style("opacity", 1);
    hover.enter(event);
  }

  return {
    el,
    update(state = {}, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
