// bubble.js: one bubble per actor, three measures at once: x, y and area. One panel, or several
// small panels on shared axes. Built for the debt chart of the investment chapter (net financial
// flows on x, concessional share on y, debt outstanding as area); fits any three-measure comparison.
//
//   const chart = makeBubble(el, { rows, spec, actors });
//   chart.update(state, { animate });
//
// rows (wide, one row per geo x actor; e.g. invest_3_bubble_AF.csv): geo, actor and the three
//   measure columns named in the spec
//
// spec:
//   title, subtitle (text or (state) => text), source
//   x, y, size:   column names (x: signed values with a zero line; y: 0 to 100; size: area)
//   xTitle, yTitle, sizeTitle:  axis and key wording
//   actors:       actor codes to draw (default: all in the rows)
//   labels:       { code: label } where actors.csv has none
//   geoLabels:    { geo: label } for panel headers when several panels are drawn
//   geos:         geographies drawn unless a step says otherwise (default ["Africa"])
//   keySizes:     reference values for the size key (default [10, 30])
//
// state (all optional):
//   geos:         one geography = one large panel; several = a grid of small panels on one scale
//   highlight:    actor codes at full strength, the rest dimmed (labelled in small panels)
//   title, subtitle, footnote: override the spec text for this step

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";
import { makeHover } from "./hover.js";

export function makeBubble(el, { rows, spec, actors = [] }) {
  const W = 600;
  const H = 450;
  const M = { top: 22, right: 22, bottom: 58, left: 66 };

  // ── data ────────────────────────────────────────────────────────────────
  const num = (v) => (v === "" || v == null ? NaN : +v);
  const data = rows.map((r) => ({ ...r, _x: num(r[spec.x]), _y: num(r[spec.y]), _s: num(r[spec.size]) }));
  const label = (a) => spec.labels?.[a] ?? actors.find((x) => x.actor === a)?.label ?? a;
  const color = (a) => theme.actorColors?.[a] ?? theme.light;
  const inSpec = (a) => !spec.actors || spec.actors.includes(a);
  const maxSize = d3.max(data.filter((d) => inSpec(d.actor)), (d) => d._s) ?? 1;
  const geoLabel = (g) => spec.geoLabels?.[g] ?? g;

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
  el.classList.add("fa-chart--range");
  el.style.setProperty("--fa-aspect", `${W} / ${H}`);
  const $ = (sel) => el.querySelector(sel);
  $(".fa-credit").textContent = spec.source ?? "";
  const tooltip = d3.select($(".fa-tooltip"));
  const hover = makeHover(el, tooltip);

  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMin meet")
    .attr("role", "img")
    .attr("aria-label", typeof spec.title === "string" ? spec.title : "Bubble chart");
  const gAxes = svg.append("g");
  const gBubbles = svg.append("g");
  const gLabels = svg.append("g").attr("class", "fa-labels");

  // ── render ──────────────────────────────────────────────────────────────
  function render(state, animate) {
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const geos = state.geos ?? spec.geos ?? ["Africa"];
    const n = geos.length;
    const cols = n === 1 ? 1 : n <= 4 ? 2 : 3;
    const nrows = Math.ceil(n / cols);
    const top = M.top + (n > 1 ? 18 : 0);
    const GX = 16;
    const GY = n > 1 ? 34 : 0;
    const cw = (W - M.left - M.right - GX * (cols - 1)) / cols;
    const ch = (H - top - M.bottom - GY * (nrows - 1)) / nrows;
    const hi = state.highlight?.length ? new Set(state.highlight) : null;
    const op = (a) => (!hi || hi.has(a) ? 0.9 : theme.dim);

    const rMax = n === 1 ? 38 : n <= 4 ? 22 : 15;
    const rs = d3.scaleSqrt().domain([0, maxSize]).range([0, rMax]);

    const pts = data
      .filter((d) => geos.includes(d.geo) && inSpec(d.actor) && Number.isFinite(d._x) && Number.isFinite(d._y) && d._s > 0)
      .map((d) => ({ ...d, c: geos.indexOf(d.geo) }));

    // one horizontal scale for all panels (so panels compare), 0 to 100 vertically
    const [xlo, xhi] = d3.extent(pts, (d) => d._x);
    const pad = rMax * 0.7;
    const xDom = d3
      .scaleLinear()
      .domain([Math.min(0, xlo ?? 0), Math.max(0, xhi ?? 1)])
      .nice(4)
      .domain();
    const px = d3.scaleLinear().domain(xDom).range([pad, cw - pad]);
    const py = d3.scaleLinear().domain([0, 100]).range([ch, 0]);
    const ox = (c) => M.left + (c % cols) * (cw + GX);
    const oy = (c) => top + Math.floor(c / cols) * (ch + GY);

    // text
    const text = (v) => (typeof v === "function" ? v(state) : v);
    $(".fa-title").textContent = text(state.title ?? spec.title) ?? "";
    $(".fa-subtitle").textContent = text(state.subtitle ?? spec.subtitle) ?? "";
    $(".fa-footnote").textContent = state.footnote ?? "";

    // size key (reference circles on the current scale)
    const sizes = (spec.keySizes ?? [10, 30]).filter((v) => v <= maxSize);
    d3.select($(".fa-key"))
      .style("flex-wrap", "wrap")
      .html(
        `<span class="fa-key-label">${spec.sizeTitle ?? "Bubble area"}:</span>` +
          sizes
            .map((v) => {
              const r = rs(v);
              return `<span class="fa-key-item"><svg width="${2 * r + 2}" height="${2 * r + 2}" aria-hidden="true"><circle cx="${r + 1}" cy="${r + 1}" r="${r}" fill="none" stroke="${theme.grey}" stroke-width="1.25"/></svg>${v}</span>`;
            })
            .join(""),
      );

    // axes (redrawn): gridlines per panel, tick labels on the left column and the bottom row
    gAxes.selectAll("*").remove();
    const yTicks = n === 1 ? [0, 25, 50, 75, 100] : [0, 50, 100];
    const xTicks = px.ticks(n === 1 ? 5 : 3);
    geos.forEach((g, c) => {
      const a = gAxes.append("g").attr("transform", `translate(${ox(c)},${oy(c)})`);
      if (n > 1) {
        a.append("text").attr("class", "fa-row-actor").attr("x", 0).attr("y", -8).text(geoLabel(g));
      }
      a.append("g")
        .attr("class", "fa-range-grid")
        .selectAll("line")
        .data(yTicks)
        .join("line")
        .attr("x1", 0)
        .attr("x2", cw)
        .attr("y1", (d) => py(d))
        .attr("y2", (d) => py(d));
      // zero line of the horizontal measure
      a.append("line")
        .attr("x1", px(0))
        .attr("x2", px(0))
        .attr("y1", 0)
        .attr("y2", ch)
        .attr("stroke", theme.grey)
        .attr("stroke-width", 1);
      if (c % cols === 0) {
        a.append("g")
          .attr("class", "fa-axis")
          .selectAll("text")
          .data(yTicks)
          .join("text")
          .attr("x", -8)
          .attr("y", (d) => py(d))
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text((d) => `${d}%`);
      }
      if (c + cols >= n) {
        a.append("g")
          .attr("class", "fa-axis")
          .selectAll("text")
          .data(xTicks)
          .join("text")
          .attr("x", (d) => px(d))
          .attr("y", ch + 17)
          .attr("text-anchor", "middle")
          .text((d) => (d > 0 ? `+${d}` : d));
      }
    });
    // axis titles
    const plotMid = M.left + (cols * cw + GX * (cols - 1)) / 2;
    const titles = gAxes.append("g").attr("class", "fa-axis");
    titles
      .append("text")
      .attr("x", plotMid)
      .attr("y", H - 14)
      .attr("text-anchor", "middle")
      .text(`← ${spec.xTitleLeft ?? "net repayment"}  ·  ${spec.xTitle ?? ""}  ·  ${spec.xTitleRight ?? "net lending"} →`);
    titles
      .append("text")
      .attr("transform", `translate(14,${top + (nrows * ch + GY * (nrows - 1)) / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .text(spec.yTitle ?? "");

    // bubbles, largest first so the small ones stay visible
    const sorted = d3.sort(pts, (a, b) => d3.descending(a._s, b._s));
    const cx = (d) => ox(d.c) + px(d._x);
    const cy = (d) => oy(d.c) + py(d._y);
    gBubbles
      .selectAll("circle")
      .data(sorted, (d) => `${d.geo}|${d.actor}`)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 0)
            .attr("opacity", 0)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.25)
            .on("pointerenter pointermove", showTip)
            .on("pointerleave", hover.leave),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).attr("r", 0).remove(),
      )
      .attr("fill", (d) => color(d.actor))
      .order()
      .transition(t)
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", (d) => rs(d._s))
      .attr("opacity", (d) => op(d.actor));

    // labels: all in a single panel, only the highlighted in small panels; nudged apart vertically
    const labelled = pts.filter((d) => n === 1 || (hi && hi.has(d.actor)));
    const lab = labelled.map((d) => {
      const r = rs(d._s);
      const right = px(d._x) + r + 4 + 60 < cw;
      return { d, x: right ? cx(d) + r + 4 : cx(d) - r - 4, y: cy(d), anchor: right ? "start" : "end", c: d.c };
    });
    d3.group(lab, (l) => l.c).forEach((g) => {
      d3.sort(g, (a, b) => d3.ascending(a.y, b.y)).forEach((l, i, arr) => {
        const prev = arr[i - 1];
        if (prev && Math.abs(l.x - prev.x) < 90 && l.y - prev.y < 13) l.y = prev.y + 13;
      });
    });
    gLabels
      .selectAll("text")
      .data(lab, (l) => `${l.d.geo}|${l.d.actor}`)
      .join(
        (enter) => enter.append("text").attr("dy", "0.35em").attr("opacity", 0).attr("x", (l) => l.x).attr("y", (l) => l.y),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("text-anchor", (l) => l.anchor)
      .text((l) => label(l.d.actor))
      .transition(t)
      .attr("x", (l) => l.x)
      .attr("y", (l) => l.y)
      .attr("opacity", (l) => (!hi || hi.has(l.d.actor) ? 1 : theme.dim));
  }

  function showTip(event, d) {
    const f = (v, p) => (Number.isFinite(v) ? v : null) && `${d3.format(p)(v)}`;
    tooltip
      .html(
        `<strong>${label(d.actor)}</strong>, ${geoLabel(d.geo)}<br>` +
          `${spec.sizeTitle ?? "Size"}: ${f(d._s, ",.1f")}<br>${spec.yShort ?? "y"}: ${f(d._y, ".1f")}%<br>${spec.xShort ?? "x"}: ${f(d._x, "+,.2f")}`,
      )
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
