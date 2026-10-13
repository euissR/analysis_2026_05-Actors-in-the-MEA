// flowBars.js: two-way trade as a butterfly of bars. Imports go left, exports go right, one row
// per actor; each bar is split into one part of the region (e.g. Israel, next to the centre line)
// and the rest of the region (outside). Built for the high-tech mock visual of the Middle East
// and the Gulf chapter (two-way high-tech trade, Israel vs the rest of the region).
//
//   const chart = makeFlowBars(el, { rows, spec, actors });
//   chart.update(state, { animate });
//
// rows: the same long file as periodRange (trade_2_products_ME.csv):
//   product, basket, flow (imports | exports), geo, actor, period, value_usd_bn
//
// spec:
//   title, subtitle, source, note (text under the chart, e.g. what the percentages are)
//   filter:   { product, basket } rows to use
//   period:   the period shown (default "2022–24")
//   base:     geography of the whole region ("Middle East and the Gulf")
//   part:     geography of the part highlighted ("Israel")
//   partLabel, restLabel:  key wording
//   rows:     [{ id, label?, actors: [codes summed in the region], part?: [codes summed in the
//             part] }]; part defaults to actors (use it where the part cannot trade with itself,
//             e.g. the intra-region row: Israel's trade with the Gulf only)
//   labels:   { actor code: label } where actors.csv has none
//
// state (all optional):
//   exclude:   true drops the part (e.g. Israel) from every bar: what is left of the region
//   highlight: row ids at full strength, the rest dimmed

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";

export function makeFlowBars(el, { rows, spec, actors = [] }) {
  const W = 600;
  const H = 450;
  const M = { top: 78, right: 24, bottom: 34, left: 92 };
  const half = (W - M.left - M.right) / 2;
  const cx = M.left + half;
  const period = spec.period ?? "2022–24";
  const fmt = d3.format(",.1f");

  // ── data ────────────────────────────────────────────────────────────────
  const filter = spec.filter ?? {};
  const val = new Map(
    rows
      .filter((r) => r.period === period && Object.entries(filter).every(([k, v]) => r[k] === v))
      .map((r) => [`${r.geo}|${r.actor}|${r.flow}`, +r.value_usd_bn]),
  );
  const sum = (geo, codes, flow) => d3.sum(codes, (a) => val.get(`${geo}|${a}|${flow}`) ?? 0);
  const label = (a) => spec.labels?.[a] ?? actors.find((x) => x.actor === a)?.label ?? a;

  const data = spec.rows.map((d) => {
    const o = { id: d.id, label: d.label ?? label(d.actors[0]) };
    ["imports", "exports"].forEach((flow) => {
      const total = sum(spec.base, d.actors, flow);
      const part = sum(spec.part, d.part ?? d.actors, flow);
      o[flow] = { total, part, rest: total - part, share: total ? part / total : 0 };
    });
    return o;
  });
  const max = d3.max(data, (d) => Math.max(d.imports.total, d.exports.total));
  // the bars stop short of the plot edge so the end values fit beside the row names
  const x = d3.scaleLinear().domain([0, max]).nice(4).range([0, half - 34]);

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
  $(".fa-title").textContent = spec.title ?? "";
  $(".fa-subtitle").textContent = spec.subtitle ?? "";
  $(".fa-credit").textContent = spec.source ?? "";
  $(".fa-footnote").textContent = spec.note ?? "";
  const tooltip = d3.select($(".fa-tooltip"));

  const partColor = theme.actorColors?.ISR ?? theme.teal;
  const restColor = theme.light;
  d3.select($(".fa-key"))
    .style("flex-wrap", "wrap")
    .html(
      `<span class="fa-key-item"><svg width="12" height="12" aria-hidden="true"><rect width="12" height="12" fill="${partColor}"/></svg>${spec.partLabel ?? spec.part}</span>` +
        `<span class="fa-key-item"><svg width="12" height="12" aria-hidden="true"><rect width="12" height="12" fill="${restColor}"/></svg>${spec.restLabel ?? "Rest of the region"}</span>`,
    );

  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMin meet")
    .attr("role", "img")
    .attr("aria-label", spec.title ?? "Two-way trade");
  const gGrid = svg.append("g").attr("class", "fa-range-grid");
  const gAxis = svg.append("g").attr("class", "fa-axis");
  const gLabels = svg.append("g");
  const gBars = svg.append("g");
  const gText = svg.append("g");

  // ── render ──────────────────────────────────────────────────────────────
  function render(state, animate) {
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const exclude = !!state.exclude;
    const hi = state.highlight?.length ? new Set(state.highlight) : null;
    const op = (id) => (!hi || hi.has(id) ? 1 : theme.dim);
    const n = data.length;
    const rowH = Math.min(46, (H - M.top - M.bottom) / n);
    const barH = Math.min(24, rowH * 0.5);
    const yMid = (i) => M.top + i * rowH + rowH / 2;
    const bottom = M.top + n * rowH;
    // fit the frame to the rows: a chart with few rows gets a shorter frame, so the key moves up with the bars
    const Hc = Math.round(bottom + M.bottom);
    svg.attr("viewBox", `0 0 ${W} ${Hc}`);
    el.style.setProperty("--fa-aspect", `${W} / ${Hc}`);

    // grid, axis, centre line, headers (redrawn)
    gGrid.selectAll("*").remove();
    gAxis.selectAll("*").remove();
    const ticks = x.ticks(4).filter((v) => v > 0);
    [-1, 1].forEach((side) =>
      ticks.forEach((v) => {
        gGrid
          .append("line")
          .attr("x1", cx + side * x(v))
          .attr("x2", cx + side * x(v))
          .attr("y1", M.top - 10)
          .attr("y2", bottom);
        gAxis
          .append("text")
          .attr("x", cx + side * x(v))
          .attr("y", bottom + 17)
          .attr("text-anchor", "middle")
          .text(v);
      }),
    );
    gAxis.append("text").attr("x", cx).attr("y", bottom + 17).attr("text-anchor", "middle").text(0);
    gGrid
      .append("line")
      .attr("x1", cx)
      .attr("x2", cx)
      .attr("y1", M.top - 10)
      .attr("y2", bottom)
      .style("stroke", theme.grey)
      .style("stroke-opacity", 1);
    gAxis
      .append("text")
      .attr("x", cx - 6)
      .attr("y", M.top - 44)
      .attr("text-anchor", "end")
      .text("← region’s imports from");
    gAxis
      .append("text")
      .attr("x", cx + 6)
      .attr("y", M.top - 44)
      .attr("text-anchor", "start")
      .text("region’s exports to →");

    // row labels
    gLabels
      .selectAll("text")
      .data(data, (d) => d.id)
      .join((enter) =>
        enter
          .append("text")
          .attr("class", "fa-row-actor")
          .attr("text-anchor", "end")
          .attr("dy", "0.35em")
          .attr("x", M.left - 10)
          .text((d) => d.label),
      )
      .attr("y", (d, i) => yMid(i))
      .attr("opacity", (d) => op(d.id));

    // bars: part next to the centre line, the rest outside it
    const segs = data.flatMap((d, i) =>
      [
        ["imports", -1],
        ["exports", 1],
      ].flatMap(([flow, side]) => {
        const f = d[flow];
        const part = exclude ? 0 : f.part;
        return [
          { key: `${d.id}|${flow}|part`, id: d.id, i, side, start: 0, len: part, color: partColor, d, flow },
          { key: `${d.id}|${flow}|rest`, id: d.id, i, side, start: part, len: f.rest, color: restColor, d, flow },
        ];
      }),
    );
    const rx = (s) => (s.side < 0 ? cx - x(s.start + s.len) : cx + x(s.start));
    gBars
      .selectAll("rect")
      .data(segs, (s) => s.key)
      .join((enter) =>
        enter
          .append("rect")
          .attr("x", cx)
          .attr("width", 0)
          .attr("rx", 0)
          .on("pointerenter pointermove", showTip)
          .on("pointerleave", () => tooltip.style("opacity", 0)),
      )
      .attr("fill", (s) => s.color)
      .transition(t)
      .attr("x", rx)
      .attr("width", (s) => Math.max(0, x(s.len)))
      .attr("y", (s) => yMid(s.i) - barH / 2)
      .attr("height", barH)
      .attr("opacity", (s) => op(s.id));

    // end values and Israel's share, per flow
    const texts = data.flatMap((d, i) =>
      [
        ["imports", -1],
        ["exports", 1],
      ].flatMap(([flow, side]) => {
        const f = d[flow];
        const end = exclude ? f.rest : f.total;
        const out = [
          { key: `${d.id}|${flow}|v`, id: d.id, i, side, kind: "v", x: cx + side * (x(end) + 5), text: fmt(end) },
        ];
        if (!exclude)
          out.push({
            key: `${d.id}|${flow}|p`,
            id: d.id,
            i,
            side,
            kind: "p",
            x: cx + side * 4,
            text: `${Math.round(f.share * 100)}%`,
          });
        return out;
      }),
    );
    gText
      .selectAll("text")
      .data(texts, (s) => s.key)
      .join((enter) =>
        enter
          .append("text")
          .attr("font-size", (s) => (s.kind === "p" ? 11 : 12))
          .attr("fill", (s) => (s.kind === "p" ? theme.muted : theme.ink))
          .attr("dy", (s) => (s.kind === "p" ? "0em" : "0.35em"))
          .attr("x", (s) => s.x),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("text-anchor", (s) => (s.side < 0 ? "end" : "start"))
      .text((s) => s.text)
      .transition(t)
      .attr("x", (s) => s.x)
      .attr("y", (s) => (s.kind === "p" ? yMid(s.i) - barH / 2 - 4 : yMid(s.i)))
      .attr("opacity", (s) => op(s.id));
  }

  function showTip(event, s) {
    const box = el.getBoundingClientRect();
    const f = s.d[s.flow];
    tooltip
      .html(
        `<strong>${s.d.label}</strong><br>${s.flow === "imports" ? "Region’s imports from" : "Region’s exports to"} (${period})<br>` +
          `Total: USD ${fmt(f.total)} bn<br>${spec.partLabel ?? spec.part}: USD ${fmt(f.part)} bn (${Math.round(f.share * 100)}%)`,
      )
      .style("opacity", 1)
      .style("left", `${Math.min(event.clientX - box.left + 12, box.width - 190)}px`)
      .style("top", `${event.clientY - box.top + 12}px`);
  }

  return {
    el,
    update(state = {}, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
