// stackedCols.js: stacked columns over time, one stack segment per actor or supplier.
// Built for arms transfers by year (the same file as the sankey); also fits other yearly series.
//
//   const chart = makeStackedCols(el, { rows, spec, region, actors });
//   chart.update(state, { animate });
//
// rows (e.g. mil_1_arms_ME.csv): supplier, actor_code, iso3, country, subregion, year, tiv
//
// spec:
//   title, source, subtitle (text or (state) => text)
//   unit:           axis title and tooltip ("SIPRI TIV")
//   stackOrder:     actor codes from the bottom of the stack up; "other" last (default: actors.csv order)
//   labels:         { actor code or supplier: label } where actors.csv has none
//   supplierColors: { supplier: colour } for stackBy: "supplier"
//   supplierOrder:  suppliers from the bottom up (default: largest first)
//
// state (all optional):
//   only:        actors (or suppliers) to draw; the rest are left out and the axis rescales
//   stackBy:     "actor" (default; the EU member states form one "EU" stack) or "supplier"
//   years:       [from, to] years shown
//   highlight:   actors (or suppliers) at full strength, the rest dimmed
//   subregion:   only transfers to this subregion
//   marks:       [{ year, lines: ["2019:", "Iraq, Syria"] }]  text above a column

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";
import { makeHover } from "./hover.js";

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
  const allYears = d3.sort([...new Set(data.map((d) => d.year))]);
  const actorOf = new Map(data.map((d) => [d.supplier, d.actor]));
  const label = (a) =>
    spec.labels?.[a] ??
    actors.find((x) => x.actor === a)?.label ??
    (a === "other" ? "Other suppliers" : a);
  const colorOf = (a, bySupplier) =>
    bySupplier
      ? (spec.supplierColors?.[a] ?? theme.actorColors?.[actorOf.get(a)] ?? theme.light)
      : (theme.actorColors?.[a] ?? theme.light);
  const order = spec.stackOrder ?? [...actors.map((a) => a.actor), "other"];
  const actorRank = new Map(order.map((a, i) => [a, i]));

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
  const hover = makeHover(el, tooltip);

  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", spec.title);

  const x = d3.scaleBand().range([M.left, W - M.right]).paddingInner(0.18).paddingOuter(0.05);
  const y = d3.scaleLinear().range([H - M.bottom, M.top]);

  const gGrid = svg.append("g");
  const gBars = svg.append("g");
  const gAxis = svg.append("g");
  const gMarks = svg.append("g").attr("class", "fa-labels");

  gAxis
    .append("line")
    .attr("x1", M.left)
    .attr("x2", W - M.right)
    .attr("y1", H - M.bottom)
    .attr("y2", H - M.bottom)
    .attr("stroke", theme.grey);
  const gYears = gAxis.append("g");
  const yTitle = svg
    .append("text")
    .attr("x", M.left - 44)
    .attr("y", M.top - 18)
    .attr("font-size", 12)
    .attr("fill", theme.muted);

  // ── one state -> stacks ───────────────────────────────────────────────────
  function build(state) {
    const bySupplier = state.stackBy === "supplier";
    const key = (d) => (bySupplier ? d.supplier : d.actor);
    const only = state.only?.length ? new Set(state.only) : null;
    const [y0, y1] = state.years ?? [allYears[0], allYears.at(-1)];
    const years = allYears.filter((yr) => yr >= y0 && yr <= y1);
    const keep = data.filter(
      (d) =>
        d.year >= y0 &&
        d.year <= y1 &&
        (!only || only.has(key(d))) &&
        (!state.subregion || d.subregion === state.subregion),
    );
    // stack order
    const totalBy = d3.rollup(keep, (v) => d3.sum(v, (d) => d.tiv), key);
    const rank = bySupplier
      ? new Map(
          (spec.supplierOrder ?? [...totalBy].sort((a, b) => b[1] - a[1]).map(([k]) => k)).map(
            (k, i) => [k, i],
          ),
        )
      : actorRank;

    const cells = [];
    const totals = new Map();
    d3.group(keep, (d) => d.year).forEach((byYear, year) => {
      let base = 0;
      const byKey = d3.group(byYear, key);
      [...byKey.keys()]
        .sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99))
        .forEach((k) => {
          const v = byKey.get(k);
          const tiv = d3.sum(v, (d) => d.tiv);
          const recs = [
            ...d3.rollup(v, (z) => d3.sum(z, (d) => d.tiv), (d) => d.country),
          ].sort((a, b) => b[1] - a[1]);
          cells.push({ id: `${year}|${k}`, year, k, y0: base, y1: base + tiv, tiv, recs });
          base += tiv;
        });
      totals.set(year, base);
    });
    return { cells, totals, years, bySupplier, rank };
  }

  // ── render ──────────────────────────────────────────────────────────────
  function render(state, animate) {
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const g = build(state);
    const { cells, totals, years, bySupplier, rank } = g;

    x.domain(years);
    y.domain([0, d3.max(totals.values()) || 1]).nice();
    const hi = state.highlight?.length ? new Set(state.highlight) : null;
    const color = (k) => colorOf(k, bySupplier);

    $(".fa-subtitle").textContent =
      typeof spec.subtitle === "function" ? spec.subtitle(state) : (spec.subtitle ?? "");
    yTitle.text(spec.unit ?? "");

    // x axis
    gYears
      .selectAll("text")
      .data(years, (d) => d)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("fill", theme.ink)
            .attr("y", H - M.bottom + 17)
            .attr("x", (d) => x(d) + x.bandwidth() / 2)
            .attr("opacity", 0)
            .text((d) => d),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .transition(t)
      .attr("x", (d) => x(d) + x.bandwidth() / 2)
      .attr("opacity", 1);

    // gridlines and y labels
    gGrid
      .selectAll("g.tick")
      .data(y.ticks(5), (d) => d)
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

    // columns
    gBars
      .selectAll("rect")
      .data(cells, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x(d.year))
            .attr("width", x.bandwidth())
            .attr("y", y(0))
            .attr("height", 0)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .on("pointerenter pointermove", (e, d) => showTip(e, d, bySupplier))
            .on("pointerleave", hover.leave),
        (update) => update,
        (exit) => exit.transition(t).attr("y", y(0)).attr("height", 0).remove(),
      )
      .attr("fill", (d) => color(d.k))
      .transition(t)
      .attr("x", (d) => x(d.year))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.y1))
      .attr("height", (d) => Math.max(0, y(d.y0) - y(d.y1)))
      .attr("opacity", (d) => (!hi || hi.has(d.k) ? 1 : theme.dim));

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

    drawKey(cells, rank, bySupplier);
  }

  function drawKey(cells, rank, bySupplier) {
    const key = d3.select($(".fa-key")).style("flex-wrap", "wrap");
    key.selectAll("*").remove();
    [...new Set(cells.map((c) => c.k))]
      .sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99))
      .forEach((k) =>
        key
          .append("span")
          .attr("class", "fa-key-item")
          .html(
            `<svg width="12" height="12" aria-hidden="true"><rect width="12" height="12" fill="${colorOf(k, bySupplier)}"/></svg>${label(k)}`,
          ),
      );
  }

  function showTip(event, d) {
    const top = d.recs
      .slice(0, 3)
      .map(([c, v]) => `${c}: ${fmt(v)}`)
      .join("<br>");
    tooltip
      .html(
        `<strong>${label(d.k)}, ${d.year}</strong><br>${spec.unit ?? "TIV"}: ${fmt(d.tiv)}<br>${top}`,
      )
      .style("opacity", 1);
    hover.enter(event, { raise: true });
  }

  return {
    el,
    update(state, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
