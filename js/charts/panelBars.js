// panelBars.js: small multiples of horizontal bars, one panel per measure, one row per actor
// (or per geography). Each panel has its own scale unless told otherwise; bars can be stacked.
// Built for the investment chapter (FDI: scale / concentration / GDP-weighted share; official
// finance: grants vs loans, China's commitments, regional spread); fits any "same rows, several
// measures" view.
//
//   const chart = makePanelBars(el, { rows, extra, spec, actors });
//   chart.update(state, { animate });
//
// rows: any long or wide csv (invest_2_fdi_AF.csv, invest_1_gross_AF.csv, ...). spec.prepare can
//   reshape them first: prepare({ rows, extra }) => rows (extra = further files of the chart).
//
// spec:
//   title, subtitle (text or (state) => text), source
//   rowKey:     column that identifies a row (default "actor"; "geo" for a view by geography)
//   rows:       row ids in display order (default: the first panel's rows, largest first)
//   rowLabels:  { id: label } where actors.csv has none (or a different wording is wanted)
//   labelWidth: room for the row names on the left, in chart units (default 92; longer names such as subregions need more)
//   panels:     [{ id, title, subtitle,
//                  where:    { column: value } rows used by this panel (e.g. { period: "2022–24" })
//                  segments: [{ column, label, color, opacity }]  stacked in this order;
//                            color: "actor" (the row's actor colour), an actor code ("CHN"),
//                            a theme colour name ("light", "teal3") or a hex value
//                  domain:   [min, max] fixed axis (e.g. [0, 100]); otherwise
//                  scale:    "own" (default) or "shared" (one axis for all panels that say so)
//                  format:   "pct" (1 decimal) | "pct0" | "bn" | "num" (whole numbers, thousands separator: counts)
//                  endLabel: "total" (default) | { column } | false  the value written after the bar }]
//   key:        [{ label, color, shape }] legend (same colour words as segments); shape: "dot" draws the marker
//   dot:        (per panel, optional) { column, label }: a marker at that value on the same axis, e.g. the
//               works-only share next to the bar of all awards. The value is written in brackets after the bar.
//
// state (all optional):
//   rows:       row ids to draw (default spec.rows)
//   panels:     panel ids to draw (default all)
//   highlight:  row ids at full strength, the rest dimmed
//   dots:       false = hide the markers of panels that have `dot` (default: shown)
//   title, subtitle, footnote: override the spec text for this step

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";
import { makeHover } from "./hover.js";

export function makePanelBars(el, { rows, extra = {}, spec, actors = [] }) {
  const W = 600;
  const H = 450;
  const GAP = 14;
  const ROW_MAX = 40;
  const RESERVE = 40; // room after the longest bar for its value
  const DOT_RESERVE = 88; // the same when the value is followed by the marker's value in brackets
  const rowKey = spec.rowKey ?? "actor";

  // ── data ────────────────────────────────────────────────────────────────
  const raw = spec.prepare ? spec.prepare({ rows, extra }) : rows;
  const numeric = new Set();
  spec.panels.forEach((p) => {
    p.segments.forEach((s) => numeric.add(s.column));
    if (p.endLabel?.column) numeric.add(p.endLabel.column);
    if (p.dot?.column) numeric.add(p.dot.column);
  });
  const table = raw.map((r) => {
    const o = { ...r };
    numeric.forEach((c) => {
      if (c in r) o[c] = r[c] === "" || r[c] == null ? NaN : +r[c];
    });
    return o;
  });

  const label = (k) => spec.rowLabels?.[k] ?? actors.find((x) => x.actor === k)?.label ?? k;
  const colorOf = (tok, row) =>
    tok === "actor" ? (theme.actorColors?.[row] ?? theme.light) : (theme.actorColors?.[tok] ?? theme[tok] ?? tok);
  const formats = {
    pct: (v) => `${v.toFixed(1)}%`,
    pct0: (v) => `${Math.round(v)}%`,
    bn: (v) => d3.format(",.1f")(v),
    num: (v) => d3.format(",.0f")(v),
  };
  const fmtOf = (p) => formats[p.format ?? "pct"];
  const matches = (p, r) => Object.entries(p.where ?? {}).every(([k, v]) => r[k] === v);

  // one cell = one row in one panel: its segment values, their total and the optional end value
  const cell = (p, row) => {
    const d = table.find((r) => r[rowKey] === row && matches(p, r));
    if (!d) return null;
    const vals = p.segments.map((s) => d[s.column]);
    if (!vals.some(Number.isFinite)) return null;
    const total = d3.sum(vals.filter(Number.isFinite));
    const end = p.endLabel?.column ? d[p.endLabel.column] : total;
    const dot = p.dot ? d[p.dot.column] : NaN;
    return { d, vals, total, end, dot };
  };

  const defaultRows = (p) =>
    d3
      .sort(
        [...new Set(table.filter((r) => matches(p, r)).map((r) => r[rowKey]))],
        (a, b) => d3.descending(cell(p, a)?.total ?? -Infinity, cell(p, b)?.total ?? -Infinity),
      )
      .filter((r) => cell(p, r));

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

  if (spec.key?.length) {
    d3.select($(".fa-key"))
      .style("flex-wrap", "wrap")
      .html(
        spec.key
          .map(
            (k) =>
              `<span class="fa-key-item"><svg width="12" height="12" aria-hidden="true">${
                k.shape === "dot"
                  ? `<circle cx="6" cy="6" r="4.5" fill="${theme.ink}" stroke="#fff" stroke-width="1.25"/>`
                  : `<rect width="12" height="12" fill="${colorOf(k.color, null)}" fill-opacity="${k.opacity ?? 1}"/>`
              }</svg>${k.label}</span>`,
          )
          .join(""),
      );
  }

  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMin meet")
    .attr("role", "img")
    .attr("aria-label", typeof spec.title === "string" ? spec.title : "Bar chart");
  const gCols = svg.append("g");
  const gLabels = svg.append("g");
  const gBars = svg.append("g");
  const gDots = svg.append("g");
  const gText = svg.append("g");

  const wrap = (s, max) => {
    const out = [];
    let line = "";
    s.split(" ").forEach((w) => {
      if (`${line} ${w}`.trim().length > max) {
        out.push(line);
        line = w;
      } else line = `${line} ${w}`.trim();
    });
    if (line) out.push(line);
    return out;
  };

  // ── render ──────────────────────────────────────────────────────────────
  function render(state, animate) {
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const panels = state.panels ? spec.panels.filter((p) => state.panels.includes(p.id)) : spec.panels;
    const np = panels.length;
    const hasSub = panels.some((p) => p.subtitle);
    const M = { top: hasSub ? 90 : 62, right: 16, bottom: 30, left: spec.labelWidth ?? 92 };
    const colW = (W - M.left - M.right - GAP * (np - 1)) / np;
    const x0 = (c) => M.left + c * (colW + GAP);

    const list = state.rows ?? spec.rows ?? defaultRows(panels[0]);
    const n = list.length;
    const rowH = Math.min(ROW_MAX, (H - M.top - M.bottom) / Math.max(n, 1));
    const barH = Math.min(22, rowH * 0.62);
    const yMid = (i) => M.top + i * rowH + rowH / 2;
    const bottom = M.top + n * rowH;
    // fit the frame to the rows: a chart with few rows gets a shorter frame, so the key moves up with the bars
    const Hc = Math.round(bottom + M.bottom);
    svg.attr("viewBox", `0 0 ${W} ${Hc}`);
    el.style.setProperty("--fa-aspect", `${W} / ${Hc}`);
    const hi = state.highlight?.length ? new Set(state.highlight) : null;
    const op = (row) => (!hi || hi.has(row) ? 1 : theme.dim);
    const dotsOn = (p) => !!p.dot && state.dots !== false;

    // scales: each panel on its own axis unless it says "shared" (or has a fixed domain)
    const totals = panels.map((p) => list.map((r) => cell(p, r)?.total).filter(Number.isFinite));
    const sharedMax = d3.max(panels.flatMap((p, c) => (p.scale === "shared" ? totals[c] : []))) ?? 1;
    const xs = panels.map((p, c) => {
      const s = d3
        .scaleLinear()
        .domain(p.domain ?? [0, p.scale === "shared" ? sharedMax : (d3.max(totals[c]) ?? 1)])
        .range([0, colW - (dotsOn(p) ? DOT_RESERVE : RESERVE)]);
      return p.domain ? s : s.nice(3);
    });

    // text
    const text = (v) => (typeof v === "function" ? v(state) : v);
    $(".fa-title").textContent = text(state.title ?? spec.title) ?? "";
    $(".fa-subtitle").textContent = text(state.subtitle ?? spec.subtitle) ?? "";
    $(".fa-footnote").textContent = state.footnote ?? "";

    // panel headers, gridlines, tick labels (redrawn; the bars are what moves)
    gCols.selectAll("*").remove();
    panels.forEach((p, c) => {
      const x = xs[c];
      const col = gCols.append("g").attr("transform", `translate(${x0(c)},0)`);
      const maxChars = Math.floor(colW / 5.2);
      const head = col
        .append("text")
        .attr("class", "fa-row-actor")
        .attr("x", 0)
        .attr("y", hasSub ? 18 : M.top - 30);
      head.text(p.title ?? "");
      if (p.subtitle) {
        col
          .append("g")
          .selectAll("text")
          .data(wrap(p.subtitle, maxChars).slice(0, 3))
          .join("text")
          .attr("class", "fa-row-name")
          .attr("x", 0)
          .attr("y", (d, i) => 33 + i * 13)
          .text((d) => d);
      }
      // narrow panels: only the two ends, so tick labels do not run into each other
      const narrow = colW < 150;
      const [d0, d1] = x.domain();
      const ticks = narrow ? [d0, d1] : x.ticks(3);
      const anchor = (d) => (!narrow ? "middle" : d === d0 ? "start" : d === d1 ? "end" : "middle");
      const fmtTick = (d) => ((p.format ?? "pct").startsWith("pct") ? `${d}%` : d3.format(",")(d));
      col
        .append("g")
        .attr("class", "fa-range-grid")
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
        .text(fmtTick);
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
      .data(list, (r) => r)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "fa-row-actor")
            .attr("text-anchor", "end")
            .attr("dy", "0.35em")
            .attr("x", M.left - 10)
            .attr("y", (r, i) => yMid(i))
            .attr("opacity", 0)
            .text(label),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .transition(t)
      .attr("y", (r, i) => yMid(i))
      .attr("opacity", op);

    // bars: segments stacked from the axis outwards
    const segs = panels.flatMap((p, c) =>
      list.flatMap((row, i) => {
        const cl = cell(p, row);
        if (!cl) return [];
        let acc = 0;
        return p.segments.map((s, k) => {
          const v = Number.isFinite(cl.vals[k]) ? cl.vals[k] : 0;
          const o = {
            key: `${p.id}|${row}|${k}`,
            row, c, i, p, s, cl,
            start: acc,
            len: v,
            color: colorOf(s.color ?? "actor", row),
            opacity: s.opacity ?? 1,
          };
          acc += v;
          return o;
        });
      }),
    );
    const bx = (d) => x0(d.c) + xs[d.c](d.start);
    const bw = (d) => Math.max(0, xs[d.c](d.start + d.len) - xs[d.c](d.start));
    gBars
      .selectAll("rect")
      .data(segs, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => x0(d.c))
            .attr("width", 0)
            .attr("y", (d) => yMid(d.i) - barH / 2)
            .attr("height", barH)
            .attr("opacity", 0)
            .on("pointerenter pointermove", showTip)
            .on("pointerleave", hover.leave),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", (d) => d.opacity)
      .transition(t)
      .attr("x", bx)
      .attr("width", bw)
      .attr("y", (d) => yMid(d.i) - barH / 2)
      .attr("height", barH)
      .attr("opacity", (d) => op(d.row));

    // markers (works-only share): a dark dot on the same axis as the bar
    const dots = panels.flatMap((p, c) =>
      !dotsOn(p)
        ? []
        : list.flatMap((row, i) => {
            const cl = cell(p, row);
            return cl && Number.isFinite(cl.dot) ? [{ key: `${p.id}|${row}|dot`, row, c, i, p, cl, v: cl.dot }] : [];
          }),
    );
    gDots
      .selectAll("circle")
      .data(dots, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("r", 5)
            .attr("fill", theme.ink)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.25)
            .attr("cx", (d) => x0(d.c))
            .attr("cy", (d) => yMid(d.i))
            .attr("opacity", 0)
            .on("pointerenter pointermove", showTip)
            .on("pointerleave", hover.leave),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .transition(t)
      .attr("cx", (d) => x0(d.c) + xs[d.c](d.v))
      .attr("cy", (d) => yMid(d.i))
      .attr("opacity", (d) => op(d.row));

    // values after the bars (and after the marker, if it lies further out)
    const ends = panels.flatMap((p, c) =>
      p.endLabel === false
        ? []
        : list.flatMap((row, i) => {
            const cl = cell(p, row);
            if (!cl || !Number.isFinite(cl.end)) return [];
            const withDot = dotsOn(p) && Number.isFinite(cl.dot);
            const reach = withDot ? Math.max(cl.total, cl.dot) : cl.total;
            const f = fmtOf(p);
            return [
              {
                key: `${p.id}|${row}`,
                row, c, i,
                text: withDot ? `${f(cl.end)} (${f(cl.dot)})` : f(cl.end),
                x: x0(c) + xs[c](reach) + (withDot ? 10 : 5),
              },
            ];
          }),
    );
    gText
      .selectAll("text")
      .data(ends, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("font-size", 12)
            .attr("fill", theme.ink)
            .attr("dy", "0.35em")
            .attr("x", (d) => d.x)
            .attr("opacity", 0),
        (update) => update,
        (exit) => exit.remove(),
      )
      .text((d) => d.text)
      .transition(t)
      .attr("x", (d) => d.x)
      .attr("y", (d) => yMid(d.i))
      .attr("opacity", (d) => op(d.row));
  }

  function showTip(event, d) {
    const fmt = fmtOf(d.p);
    const lines = d.p.segments
      .map((s, k) => (Number.isFinite(d.cl.vals[k]) ? `${s.label ?? d.p.title}: ${fmt(d.cl.vals[k])}` : null))
      .filter(Boolean)
      .join("<br>");
    const dotLine = d.cl.dot != null && Number.isFinite(d.cl.dot) && d.p.dot ? `<br>${d.p.dot.label ?? "Marker"}: ${fmt(d.cl.dot)}` : "";
    tooltip
      .html(`<strong>${label(d.row)}</strong><br>${d.p.title ?? ""}<br>${lines}${dotLine}`)
      .style("opacity", 1);
    hover.enter(event, { raise: true });
  }

  return {
    el,
    update(state = {}, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
