// periodRange.js: one arrow per actor, from its value in the first period to its value in the second.
// Built for the trade chapter (shares, values and balances, 2019–21 vs 2022–24); fits any
// two-period comparison.
//
//   const chart = makePeriodRange(el, { rows, extra, spec, region, actors });
//   chart.update(state, { animate });
//
// rows (long, one row per geo x actor x period; e.g. trade_2_products_AF.csv):
//   geo, actor, period, and one or more of share_pct, value_usd_bn, balance_usd_bn;
//   optional filter columns: product, basket, flow, component
//
// spec:
//   title, subtitle (text or (state, info) => text), source
//   periods:     ["2019–21", "2022–24"]
//   measure:     "share_pct" | "value_usd_bn" | "balance_usd_bn" (the x axis)
//   filter:      { product, basket, flow, component } rows to use unless a step says otherwise
//   geos:        geographies drawn unless a step says otherwise (default ["Africa"])
//   actors:      actor codes in the rows (default: the nine of the trade chapter)
//   geoLabels:   { geo: label } for the panel headers; geoLabelsShort: the same when
//                several panels share the row
//   labels:      { actor code: label } where actors.csv has none ("other")
//   keyFirst, keyLast: key wording (default: the period labels)
//
// state (all optional):
//   geos:        one geography = one wide panel; several = side-by-side panels on one scale
//   actors:      actor codes to draw (default spec.actors)
//   highlight:   actor codes at full strength, the rest dimmed
//   product, basket, flow, component:  which rows (see spec.filter)
//   measure:     overrides spec.measure for this step
//   title, subtitle, footnote:  override the spec text for this step
//   annual:      { actor } adds that actor's year-by-year share (extra.annual rows:
//                actor, year, share_pct) under the subtitle
//
// Rows are sorted by the second-period value in the first panel.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";

const NUMERIC = ["share_pct", "value_usd_bn", "balance_usd_bn"];
const FILTERS = ["product", "basket", "flow", "component"];
const DEFAULT_ACTORS = [
  "EU",
  "CHN",
  "USA",
  "IND",
  "JPN",
  "KOR",
  "TUR",
  "RUS",
  "GCC",
];

export function makePeriodRange(el, { rows, extra = {}, spec, actors = [] }) {
  const W = 600;
  const H = 450;
  const M = { top: 66, right: 20, bottom: 34, left: 92 };
  const GAP = 16;
  const ROW_MAX = 38;
  const [P1, P2] = spec.periods ?? ["2019–21", "2022–24"];

  // ── data ────────────────────────────────────────────────────────────────
  const data = rows.map((r) => {
    const o = { ...r };
    NUMERIC.forEach((k) => {
      if (k in r) o[k] = r[k] === "" || r[k] == null ? NaN : +r[k];
    });
    return o;
  });
  const annual = (extra.annual ?? []).map((r) => ({
    actor: r.actor,
    year: +r.year,
    share: +r.share_pct,
  }));

  const label = (a) =>
    spec.labels?.[a] ??
    actors.find((x) => x.actor === a)?.label ??
    (a === "other" ? "Other" : a);
  const color = (a) => theme.actorColors?.[a] ?? theme.light;
  const geoLabel = (g, many = false) =>
    (many ? spec.geoLabelsShort?.[g] : null) ?? spec.geoLabels?.[g] ?? g;

  const fmtShare = (v) => `${v.toFixed(1)}%`;
  const fmtBn = (v) => `USD ${d3.format(",.1f")(v)} bn`;
  const fmtBal = (v) => `USD ${d3.format("+,.1f")(v)} bn`;
  const formatters = {
    share_pct: fmtShare,
    value_usd_bn: fmtBn,
    balance_usd_bn: fmtBal,
  };
  const labelFmt = {
    share_pct: fmtShare,
    value_usd_bn: (v) =>
      Math.abs(v) < 1 ? v.toFixed(2) : d3.format(",.1f")(v),
    balance_usd_bn: (v) => d3.format("+,.1f")(v),
  };

  // ── markup ──────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="fa-head">
      <div class="fa-title"></div>
      <div class="fa-subtitle"></div>
      <div class="fa-subtitle fa-annual" style="font-size:0.9375rem"></div>
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

  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMin meet")
    .attr("role", "img")
    .attr(
      "aria-label",
      typeof spec.title === "string"
        ? spec.title
        : "Change between two periods",
    );
  const gCols = svg.append("g");
  const gLabels = svg.append("g");
  const gRows = svg.append("g");

  // key (drawn once): hollow dot = first period, solid dot = second period
  (function drawKey() {
    const dot = (fill, stroke) =>
      `<svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="${fill}" stroke="${stroke}" stroke-width="1.75"/></svg>`;
    d3.select($(".fa-key"))
      .style("flex-wrap", "wrap")
      .html(
        `<span class="fa-key-item">${dot("#fff", theme.ink)}${spec.keyFirst ?? P1}</span>` +
          `<span class="fa-key-item">${dot(theme.ink, theme.ink)}${spec.keyLast ?? P2}</span>`,
      );
  })();

  // ── one state -> arrows ───────────────────────────────────────────────────
  function build(state) {
    const geos = state.geos ?? spec.geos ?? ["Africa"];
    const list = state.actors ?? spec.actors ?? DEFAULT_ACTORS;
    const measure = state.measure ?? spec.measure ?? "share_pct";
    const filter = { ...(spec.filter ?? {}) };
    FILTERS.forEach((k) => state[k] != null && (filter[k] = state[k]));
    const use = data.filter((r) =>
      Object.entries(filter).every(([k, v]) => !(k in r) || r[k] === v),
    );

    // look-ups: measure -> "geo|actor|period" -> value
    const maps = {};
    NUMERIC.forEach((k) => {
      if (use.length && k in use[0])
        maps[k] = new Map(
          use.map((r) => [`${r.geo}|${r.actor}|${r.period}`, r[k]]),
        );
    });
    const get = (k, g, a, p) => maps[k]?.get(`${g}|${a}|${p}`);

    const order = d3.sort(list, (a, b) =>
      d3.descending(
        get(measure, geos[0], a, P2) ?? -Infinity,
        get(measure, geos[0], b, P2) ?? -Infinity,
      ),
    );
    const entries = [];
    geos.forEach((g, c) =>
      order.forEach((a, i) => {
        const v1 = get(measure, g, a, P1);
        const v2 = get(measure, g, a, P2);
        if (!Number.isFinite(v1) || !Number.isFinite(v2)) return;
        const all = {};
        Object.keys(maps).forEach(
          (k) => (all[k] = [get(k, g, a, P1), get(k, g, a, P2)]),
        );
        entries.push({ key: `${g}|${a}`, geo: g, actor: a, c, i, v1, v2, all });
      }),
    );

    // totals of the first panel (all actors incl. "other"), for subtitles
    const total = (p) =>
      maps.value_usd_bn
        ? d3.sum(
            use.filter((r) => r.geo === geos[0] && r.period === p),
            (r) => r.value_usd_bn,
          )
        : NaN;
    return {
      geos,
      order,
      entries,
      measure,
      info: { geos, measure, total: [total(P1), total(P2)] },
    };
  }

  // ── render ──────────────────────────────────────────────────────────────
  function render(state, animate) {
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const { geos, order, entries, measure, info } = build(state);
    const hi = state.highlight?.length ? new Set(state.highlight) : null;
    const op = (a) => (!hi || hi.has(a) ? 1 : theme.dim);

    const n = order.length;
    const rowH = Math.min(ROW_MAX, (H - M.top - M.bottom) / Math.max(n, 1));
    const bottom = M.top + n * rowH;
    const right = geos.length === 1 ? 52 : M.right; // room for the value label
    const colW = (W - M.left - right - GAP * (geos.length - 1)) / geos.length;
    const x0 = (c) => M.left + c * (colW + GAP);
    const yMid = (i) => M.top + i * rowH + rowH / 2;

    const vals = entries.flatMap((e) => [e.v1, e.v2]);
    const x = d3
      .scaleLinear()
      .domain([Math.min(0, d3.min(vals) ?? 0), Math.max(0, d3.max(vals) ?? 1)])
      .nice(5)
      .range([0, colW]);

    // text
    const text = (v) => (typeof v === "function" ? v(state, info) : v);
    $(".fa-title").textContent = text(state.title ?? spec.title) ?? "";
    $(".fa-subtitle:not(.fa-annual)").textContent =
      text(state.subtitle ?? spec.subtitle) ?? "";
    $(".fa-footnote").textContent = state.footnote ?? "";
    const an = state.annual?.actor;
    $(".fa-annual").textContent = an
      ? `${label(an)}’s share by year: ` +
        annual
          .filter((r) => r.actor === an)
          .sort((a, b) => a.year - b.year)
          .map((r) => `${r.year} ${fmtShare(r.share)}`)
          .join(" · ")
      : "";

    // panels: headers, gridlines, tick labels (redrawn; the arrows are what moves)
    gCols.selectAll("*").remove();
    // narrow panels: only the two ends (the zero line is drawn anyway) so labels do not run into the next panel
    const narrow = colW < 150;
    const [d0, d1] = x.domain();
    const ticks = narrow ? [d0, d1] : x.ticks(colW > 250 ? 5 : 3);
    const anchor = (d) =>
      !narrow ? "middle" : d === d0 ? "start" : d === d1 ? "end" : "middle";
    const tickText = (d) =>
      measure === "share_pct" ? `${d}%` : d3.format(",")(+d.toFixed(2));
    geos.forEach((g, c) => {
      const col = gCols.append("g").attr("transform", `translate(${x0(c)},0)`);
      col
        .append("text")
        .attr("x", colW / 2)
        .attr("y", M.top - 34)
        .attr("text-anchor", "middle")
        .attr("class", "fa-row-actor")
        .text(geoLabel(g, geos.length > 1));
      const grid = col.append("g").attr("class", "fa-range-grid");
      grid
        .selectAll("line")
        .data(ticks)
        .join("line")
        .attr("x1", (d) => x(d))
        .attr("x2", (d) => x(d))
        .attr("y1", M.top - 8)
        .attr("y2", bottom);
      col
        .append("g")
        .attr("class", "fa-axis")
        .selectAll("text")
        .data(ticks)
        .join("text")
        .attr("x", (d) => x(d))
        .attr("y", bottom + 17)
        .attr("text-anchor", anchor)
        .text(tickText);
      col
        .append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", M.top - 8)
        .attr("y2", bottom)
        .attr("stroke", theme.grey)
        .attr("stroke-width", 1);
    });

    // row labels
    gLabels
      .selectAll("text")
      .data(order, (a) => a)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "fa-row-actor")
            .attr("text-anchor", "end")
            .attr("dy", "0.35em")
            .attr("x", M.left - 10)
            .attr("y", (a, i) => yMid(i))
            .attr("opacity", 0)
            .text(label),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .transition(t)
      .attr("y", (a, i) => yMid(i))
      .attr("opacity", op);

    // arrows
    const pos = (d) => `translate(${x0(d.c)},${yMid(d.i)})`;
    const place = (g) => {
      g.select("line")
        .attr("x1", (d) => x(d.v1))
        .attr("x2", (d) => x(d.v2))
        .attr("stroke", (d) => color(d.actor));
      g.select(".c1")
        .attr("cx", (d) => x(d.v1))
        .attr("stroke", (d) => color(d.actor));
      g.select(".c2")
        .attr("cx", (d) => x(d.v2))
        .attr("fill", (d) => color(d.actor));
      g.select(".val")
        .attr("x", (d) => Math.max(x(d.v1), x(d.v2)) + 10)
        .text((d) => (geos.length === 1 ? labelFmt[measure](d.v2) : ""));
    };

    const sel = gRows.selectAll("g.arrow").data(entries, (d) => d.key);
    sel.exit().transition(t).attr("opacity", 0).remove();
    const enter = sel
      .enter()
      .append("g")
      .attr("class", "arrow")
      .attr("opacity", 0)
      .attr("transform", pos);
    enter
      .append("line")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round");
    enter
      .append("circle")
      .attr("class", "c1")
      .attr("r", 5)
      .attr("fill", "#fff")
      .attr("stroke-width", 2);
    enter.append("circle").attr("class", "c2").attr("r", 5.5);
    enter
      .append("text")
      .attr("class", "val")
      .attr("dy", "0.35em")
      .attr("font-size", 12)
      .attr("fill", theme.ink);
    enter
      .append("rect")
      .attr("class", "hit")
      .attr("x", 0)
      .attr("width", colW)
      .attr("fill", "transparent");
    place(enter);

    const all = enter.merge(sel);
    all
      .select(".hit")
      .attr("y", -rowH / 2)
      .attr("height", rowH)
      .attr("width", colW);
    all
      .on("pointerenter pointermove", showTip)
      .on("pointerleave", () => tooltip.style("opacity", 0));
    all
      .transition(t)
      .attr("transform", pos)
      .attr("opacity", (d) => op(d.actor));
    all
      .select("line")
      .transition(t)
      .attr("x1", (d) => x(d.v1))
      .attr("x2", (d) => x(d.v2))
      .attr("stroke", (d) => color(d.actor));
    all
      .select(".c1")
      .transition(t)
      .attr("cx", (d) => x(d.v1))
      .attr("stroke", (d) => color(d.actor));
    all
      .select(".c2")
      .transition(t)
      .attr("cx", (d) => x(d.v2))
      .attr("fill", (d) => color(d.actor));
    all
      .select(".val")
      .attr("x", (d) => Math.max(x(d.v1), x(d.v2)) + 10)
      .text((d) => (geos.length === 1 ? labelFmt[measure](d.v2) : ""));
  }

  function showTip(event, d) {
    const box = el.getBoundingClientRect();
    const lines = Object.entries(d.all)
      .filter(([, [a, b]]) => Number.isFinite(a) && Number.isFinite(b))
      .map(([k, [a, b]]) => `${formatters[k](a)} → ${formatters[k](b)}`)
      .join("<br>");
    tooltip
      .html(
        `<strong>${label(d.actor)}</strong>, ${geoLabel(d.geo)}<br>${P1} → ${P2}<br>${lines}`,
      )
      .style("opacity", 1)
      .style(
        "left",
        `${Math.min(event.clientX - box.left + 12, box.width - 190)}px`,
      )
      .style("top", `${event.clientY - box.top + 12}px`);
  }

  return {
    el,
    update(state = {}, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
