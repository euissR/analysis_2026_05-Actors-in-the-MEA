// stackedCols.js: stacked columns over time, one stack segment per actor.
// Built for arms transfers by year (the same file as the sankey); also fits other yearly series.
//
//   const chart = makeStackedCols(el, { rows, spec, region, actors });
//   chart.update(state, { animate });
//
// rows (e.g. mil_1_arms_ME.csv): supplier, actor_code, iso3, country, subregion, year, tiv
//
// spec:
//   title, source, subtitle (text or (state) => text)
//   unit:        axis title and tooltip ("SIPRI TIV")
//   stackOrder:  actor codes from the bottom of the stack up; "other" last (default: actors.csv order)
//   labels:      { actor code: label } where actors.csv has none ("other")
//
// state (all optional):
//   only:        actor codes to draw; the other actors are left out and the axis rescales
//   highlight:   actor codes at full strength, the rest dimmed
//   subregion:   only transfers to this subregion
//   marks:       [{ year, lines: ["2019:", "Iraq, Syria"] }]  text above a column

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";

export function makeStackedCols(el, { rows, spec, region, actors = [] }) {
  const { width: W, height: H } = region;
  const M = { top: 34, right: 12, bottom: 30, left: 52 };
  const fmt = d3.format(",.0f");

  const data = rows.map((r) => ({
    actor: r.actor_code,
    supplier: r.supplier,
    country: r.country,
    subregion: r.subregion,
    year: +r.year,
    tiv: +r.tiv,
  }));
  const years = d3.sort([...new Set(data.map((d) => d.year))]);
  const label = (a) =>
    spec.labels?.[a] ?? actors.find((x) => x.actor === a)?.label ?? (a === "other" ? "Other suppliers" : a);
  const color = (a) => theme.actorColors?.[a] ?? theme.light;
  const order = spec.stackOrder ?? [...actors.map((a) => a.actor), "other"];
  const rank = new Map(order.map((a, i) => [a, i]));

  // ── markup ──────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="fa-head">
      <div class="fa-title"></div>
      <div class="fa-subtitle"></div>
    </div>
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

  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", spec.title);

  const x = d3
    .scaleBand()
    .domain(years)
    .range([M.left, W - M.right])
    .paddingInner(0.18)
    .paddingOuter(0.05);
  const y = d3.scaleLinear().range([H - M.bottom, M.top]);

  const gGrid = svg.append("g");
  const gBars = svg.append("g");
  const gAxis = svg.append("g");
  const gMarks = svg.append("g").attr("class", "fa-labels");

  // x axis (static)
  gAxis
    .append("g")
    .selectAll("text")
    .data(years)
    .join("text")
    .attr("x", (d) => x(d) + x.bandwidth() / 2)
    .attr("y", H - M.bottom + 17)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", theme.ink)
    .text((d) => d);
  gAxis
    .append("line")
    .attr("x1", M.left)
    .attr("x2", W - M.right)
    .attr("y1", H - M.bottom)
    .attr("y2", H - M.bottom)
    .attr("stroke", theme.grey);
  const yTitle = svg
    .append("text")
    .attr("x", M.left - 44)
    .attr("y", M.top - 18)
    .attr("font-size", 12)
    .attr("fill", theme.muted)
    .text(spec.unit ?? "");

  // ── one state -> stacks ───────────────────────────────────────────────────
  function build(state) {
    const only = state.only?.length ? new Set(state.only) : null;
    const keep = data.filter(
      (d) =>
        (!only || only.has(d.actor)) &&
        (!state.subregion || d.subregion === state.subregion),
    );
    const cells = [];
    const totals = new Map();
    d3.group(keep, (d) => d.year).forEach((byYear, year) => {
      let base = 0;
      const byActor = d3.group(byYear, (d) => d.actor);
      [...byActor.keys()]
        .sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99))
        .forEach((actor) => {
          const v = byActor.get(actor);
          const tiv = d3.sum(v, (d) => d.tiv);
          const recs = [
            ...d3.rollup(v, (z) => d3.sum(z, (d) => d.tiv), (d) => d.country),
          ].sort((a, b) => b[1] - a[1]);
          cells.push({ key: `${year}|${actor}`, year, actor, y0: base, y1: base + tiv, tiv, recs });
          base += tiv;
        });
      totals.set(year, base);
    });
    return { cells, totals, only };
  }

  // ── render ──────────────────────────────────────────────────────────────
  let current = null;

  function render(state, animate) {
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const g = (current = build(state));
    const { cells, totals } = g;

    y.domain([0, d3.max(totals.values()) || 1]).nice();
    const hi = state.highlight?.length ? new Set(state.highlight) : null;

    $(".fa-subtitle").textContent =
      typeof spec.subtitle === "function" ? spec.subtitle(state) : (spec.subtitle ?? "");

    // gridlines and y labels
    const ticks = y.ticks(5);
    gGrid
      .selectAll("g.tick")
      .data(ticks, (d) => d)
      .join(
        (enter) => {
          const e = enter.append("g").attr("class", "tick").attr("opacity", 0);
          e.append("line")
            .attr("x1", M.left)
            .attr("x2", W - M.right)
            .attr("stroke", theme.border)
            .attr("stroke-width", 0.6);
          e.append("text")
            .attr("x", M.left - 6)
            .attr("text-anchor", "end")
            .attr("font-size", 12)
            .attr("fill", theme.muted)
            .attr("dy", "0.32em")
            .text((d) => fmt(d));
          return e;
        },
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .transition(t)
      .attr("opacity", 1)
      .attr("transform", (d) => `translate(0,${y(d)})`);
    yTitle.text(spec.unit ?? "");

    // columns
    gBars
      .selectAll("rect")
      .data(cells, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x(d.year))
            .attr("width", x.bandwidth())
            .attr("y", y(0))
            .attr("height", 0)
            .attr("fill", (d) => color(d.actor))
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .on("pointerenter pointermove", showTip)
            .on("pointerleave", () => tooltip.style("opacity", 0)),
        (update) => update,
        (exit) =>
          exit
            .transition(t)
            .attr("y", y(0))
            .attr("height", 0)
            .remove(),
      )
      .attr("fill", (d) => color(d.actor))
      .transition(t)
      .attr("x", (d) => x(d.year))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.y1))
      .attr("height", (d) => Math.max(0, y(d.y0) - y(d.y1)))
      .attr("opacity", (d) => (!hi || hi.has(d.actor) ? 1 : theme.dim));

    // marks above a column
    const marks = (state.marks ?? []).filter((m) => totals.has(m.year));
    gMarks
      .selectAll("text")
      .data(marks, (d) => d.year)
      .join(
        (enter) => enter.append("text").attr("opacity", 0).attr("text-anchor", "middle"),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .each(function (d) {
        d3.select(this)
          .selectAll("tspan")
          .data(d.lines)
          .join("tspan")
          .attr("x", x(d.year) + x.bandwidth() / 2)
          .attr("dy", (l, i) => (i ? "1.15em" : 0))
          .attr("font-weight", (l, i) => (i ? 400 : 700))
          .text((l) => l);
      })
      .transition(t)
      .attr("x", (d) => x(d.year) + x.bandwidth() / 2)
      .attr("y", (d) => y(totals.get(d.year)) - 8 - (d.lines.length - 1) * 13.8)
      .attr("opacity", 1);

    drawKey(cells);
  }

  function drawKey(cells) {
    const key = d3.select($(".fa-key")).style("flex-wrap", "wrap");
    key.selectAll("*").remove();
    [...new Set(cells.map((c) => c.actor))]
      .sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99))
      .forEach((a) =>
        key
          .append("span")
          .attr("class", "fa-key-item")
          .html(
            `<svg width="12" height="12" aria-hidden="true"><rect width="12" height="12" fill="${color(a)}"/></svg>${label(a)}`,
          ),
      );
  }

  function showTip(event, d) {
    const box = el.getBoundingClientRect();
    const top = d.recs
      .slice(0, 3)
      .map(([c, v]) => `${c}: ${fmt(v)}`)
      .join("<br>");
    tooltip
      .html(
        `<strong>${label(d.actor)}, ${d.year}</strong><br>${spec.unit ?? "TIV"}: ${fmt(d.tiv)}<br>${top}`,
      )
      .style("opacity", 1)
      .style("left", `${Math.min(event.clientX - box.left + 12, box.width - 190)}px`)
      .style("top", `${event.clientY - box.top + 12}px`);
  }

  return {
    el,
    update(state, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
