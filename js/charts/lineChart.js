// lineChart.js: one line per actor over years, with an optional column for a total behind the lines
// and an optional dashed average. Built for the annual net bilateral flows of the debt section of the
// investment chapter (negative values = repayments); fits any short yearly series with a zero line.
//
//   const chart = makeLineChart(el, { rows, spec, actors });
//   chart.update(state, { animate });
//
// rows (long; e.g. invest_3_flows_annual_ME.csv): geo, actor, year and the value column named in the spec.
//   A missing value (empty cell) breaks the line: it is never drawn as zero. The actor named
//   spec.total ("total") is drawn as columns, not as a line.
//
// spec:
//   title, subtitle (text or (state) => text), source
//   value:        column with the values
//   actors:       actor codes drawn as lines (the total is separate)
//   total:        actor code of the total (default "total"); totalLabel: its label
//   labels:       { code: label } where actors.csv has none
//   geoLabels:    { geo: label } for the title suffix
//   geos:         geography drawn unless a step says otherwise
//   yTitle:       axis title (with the unit); format: d3 format of the values in the tooltip (default "+,.2f")
//
// state (all optional):
//   geos:         [one geography]
//   highlight:    actor codes at full strength, the rest dimmed; only these are labelled (all, if none)
//   showTotal:    true draws the total as columns behind the lines
//   average:      { from, to }: dashed mean of the total over these years (recorded years only), labelled
//   title, subtitle, footnote: override the spec text for this step

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";
import { makeHover } from "./hover.js";

export function makeLineChart(el, { rows, spec, actors = [] }) {
  const W = 600;
  const H = 450;
  const M = { top: 24, right: 78, bottom: 34, left: 52 };
  const totalCode = spec.total ?? "total";
  const fmt = d3.format(spec.format ?? "+,.2f");

  const data = rows.map((r) => ({ geo: r.geo, actor: r.actor, year: +r.year, v: r[spec.value] === "" || r[spec.value] == null ? NaN : +r[spec.value] }));
  const years = d3.sort([...new Set(data.map((d) => d.year))]);
  const label = (a) => (a === totalCode ? (spec.totalLabel ?? "All creditors") : (spec.labels?.[a] ?? actors.find((x) => x.actor === a)?.label ?? a));
  const color = (a) => theme.actorColors?.[a] ?? theme.light;
  const lines = spec.actors;
  const geoLabel = (g) => spec.geoLabels?.[g] ?? g;

  el.innerHTML = `
    <div class="fa-head"><div class="fa-title"></div><div class="fa-subtitle"></div></div>
    <div class="fa-map"></div>
    <div class="fa-foot">
      <div class="fa-source"><span class="fa-footnote" style="display:block;font-size:0.8125rem;line-height:1.25;margin-bottom:0.25rem"></span><span class="fa-credit"></span></div>
    </div>
    <div class="fa-tooltip" aria-hidden="true"></div>`;
  el.classList.add("fa-chart--range");
  el.style.setProperty("--fa-aspect", `${W} / ${H}`);
  const $ = (sel) => el.querySelector(sel);
  $(".fa-credit").textContent = spec.source ?? "";
  const tooltip = d3.select($(".fa-tooltip"));
  const hover = makeHover(el, tooltip);

  const svg = d3.select($(".fa-map")).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMin meet").attr("role", "img").attr("aria-label", typeof spec.title === "string" ? spec.title : "Line chart");
  const gAxes = svg.append("g");
  const gCols = svg.append("g");
  const gLines = svg.append("g");
  const gDots = svg.append("g");
  const gLabels = svg.append("g").attr("class", "fa-labels");

  const x = d3.scalePoint().domain(years).range([M.left + 20, W - M.right]).padding(0);
  const band = (W - M.right - M.left - 20) / Math.max(1, years.length - 1);

  function render(state, animate) {
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const geo = (state.geos ?? [spec.geos?.[0]])[0] ?? [...new Set(data.map((d) => d.geo))][0];
    const hi = state.highlight?.length ? new Set(state.highlight) : null;
    const op = (a) => (!hi || hi.has(a) ? 1 : theme.dim);

    const inGeo = data.filter((d) => d.geo === geo && Number.isFinite(d.v));
    // fixed scale per geography (lines and total), so the axis does not jump between steps
    const [lo, hi_] = d3.extent(inGeo.filter((d) => lines.includes(d.actor) || d.actor === totalCode), (d) => d.v);
    const y = d3.scaleLinear().domain([Math.min(0, lo ?? 0), Math.max(0, hi_ ?? 1)]).nice(5).range([H - M.bottom, M.top]);

    const text = (v) => (typeof v === "function" ? v(state) : v);
    $(".fa-title").textContent = state.title ?? `${text(spec.title) ?? ""}${geo !== spec.geos?.[0] ? `: ${geoLabel(geo)}` : ""}`;
    $(".fa-subtitle").textContent = text(state.subtitle ?? spec.subtitle) ?? "";
    $(".fa-footnote").textContent = state.footnote ?? "";

    // axes
    gAxes.selectAll("*").remove();
    const ticks = y.ticks(5);
    gAxes.append("g").attr("class", "fa-range-grid").selectAll("line").data(ticks).join("line").attr("x1", M.left).attr("x2", W - M.right).attr("y1", (d) => y(d)).attr("y2", (d) => y(d));
    gAxes.append("line").attr("x1", M.left).attr("x2", W - M.right).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", theme.grey).attr("stroke-width", 1);
    gAxes.append("g").attr("class", "fa-axis").selectAll("text").data(ticks).join("text").attr("x", M.left - 8).attr("y", (d) => y(d)).attr("dy", "0.35em").attr("text-anchor", "end").text((d) => (d > 0 ? `+${d}` : d));
    gAxes.append("g").attr("class", "fa-axis").selectAll("text").data(years).join("text").attr("x", (d) => x(d)).attr("y", H - M.bottom + 18).attr("text-anchor", "middle").text((d) => d);
    gAxes.append("g").attr("class", "fa-axis").append("text").attr("x", M.left - 44).attr("y", M.top - 10).attr("text-anchor", "start").text(spec.yTitle ?? "");

    // total as columns behind the lines
    const tot = state.showTotal ? inGeo.filter((d) => d.actor === totalCode) : [];
    const cw = Math.min(46, band * 0.5);
    gCols.selectAll("rect").data(tot, (d) => d.year).join(
      (e) => e.append("rect").attr("fill", theme.light).attr("opacity", 0).attr("x", (d) => x(d.year) - cw / 2).attr("width", cw).attr("y", y(0)).attr("height", 0),
      (u) => u,
      (ex) => ex.transition(t).attr("opacity", 0).remove(),
    ).on("pointerenter pointermove", (ev, d) => showTip(ev, d)).on("pointerleave", hover.leave)
      .transition(t).attr("opacity", 0.9).attr("x", (d) => x(d.year) - cw / 2).attr("width", cw).attr("y", (d) => Math.min(y(0), y(d.v))).attr("height", (d) => Math.abs(y(d.v) - y(0)));

    // lines and points
    const shown = lines.map((a) => ({ a, pts: inGeo.filter((d) => d.actor === a).sort((p, q) => p.year - q.year) })).filter((s) => s.pts.length);
    const path = d3.line().defined((d) => Number.isFinite(d.v)).x((d) => x(d.year)).y((d) => y(d.v));
    const full = (s) => years.map((yr) => s.pts.find((p) => p.year === yr) ?? { year: yr, v: NaN });
    gLines.selectAll("path").data(shown, (s) => s.a).join(
      (e) => e.append("path").attr("fill", "none").attr("stroke-linejoin", "round").attr("stroke-width", 2.25).attr("opacity", 0).attr("stroke", (s) => color(s.a)).attr("d", (s) => path(full(s))),
      (u) => u,
      (ex) => ex.transition(t).attr("opacity", 0).remove(),
    ).transition(t).attr("stroke", (s) => color(s.a)).attr("d", (s) => path(full(s))).attr("opacity", (s) => op(s.a));
    const dots = shown.flatMap((s) => s.pts.map((p) => ({ ...p })));
    gDots.selectAll("circle").data(dots, (d) => `${d.actor}|${d.year}`).join(
      (e) => e.append("circle").attr("r", 3).attr("opacity", 0).attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.v)),
      (u) => u,
      (ex) => ex.transition(t).attr("opacity", 0).remove(),
    ).attr("fill", (d) => color(d.actor)).on("pointerenter pointermove", (ev, d) => showTip(ev, d)).on("pointerleave", hover.leave)
      .transition(t).attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.v)).attr("opacity", (d) => op(d.actor));

    // labels at the right end (highlighted lines only; all when nothing is highlighted), nudged apart
    const lab = shown.filter((s) => !hi || hi.has(s.a)).map((s) => ({ a: s.a, y: y(s.pts.at(-1).v), ...(s.pts.at(-1)) }));
    d3.sort(lab, (p, q) => d3.ascending(p.y, q.y)).forEach((l, i, arr) => { if (i && l.y - arr[i - 1].y < 13) l.y = arr[i - 1].y + 13; });
    const avg = state.average && state.showTotal ? state.average : null;
    const avgVals = avg ? inGeo.filter((d) => d.actor === totalCode && d.year >= avg.from && d.year <= avg.to) : [];
    const avgV = avgVals.length ? d3.mean(avgVals, (d) => d.v) : NaN;
    gLabels.selectAll("text.l").data(lab, (l) => l.a).join(
      (e) => e.append("text").attr("class", "l").attr("dy", "0.35em").attr("opacity", 0).attr("x", W - M.right + 6).attr("y", (l) => l.y),
      (u) => u,
      (ex) => ex.remove(),
    ).attr("text-anchor", "start").text((l) => label(l.a)).transition(t).attr("x", W - M.right + 6).attr("y", (l) => l.y).attr("opacity", 1);
    // dashed average of the total
    gLabels.selectAll("g.avg").data(Number.isFinite(avgV) ? [avgV] : []).join(
      (e) => { const g = e.append("g").attr("class", "avg"); g.append("line"); g.append("text"); return g; },
      (u) => u,
      (ex) => ex.remove(),
    ).each(function (v) {
      const g = d3.select(this);
      g.select("line").attr("x1", x(avg.from) - cw / 2).attr("x2", x(avg.to) + cw / 2).attr("y1", y(v)).attr("y2", y(v)).attr("stroke", theme.neutral).attr("stroke-width", 1.5).attr("stroke-dasharray", "5 3");
      g.select("text").attr("x", x(avg.to) + cw / 2 + 4).attr("y", y(v)).attr("dy", "0.35em").attr("text-anchor", "start").text(`Average ${avg.from}–${String(avg.to).slice(2)}: ${fmt(v)}`);
    });
  }

  function showTip(event, d) {
    tooltip.html(`<strong>${label(d.actor)}</strong>, ${d.year}<br>${spec.yTitle ?? "Value"}: ${fmt(d.v)}`).style("opacity", 1);
    hover.enter(event);
  }

  return { el, update(state = {}, { animate = true } = {}) { render(state, animate); } };
}
