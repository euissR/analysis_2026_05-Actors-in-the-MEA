// tileGrid.js: one square per country on a tile-grid map, coloured by a rate.
//
//   const chart = makeTileGrid(el, { rows, spec });
//   chart.update(state, { animate });
//
// rows (e.g. dipl_5_unga_AF.csv): iso3, name, kind, subregion, x, y, then one
//   column per measure and period, named {measure}_{period}
//   (abs_all, abs_1621, abs_2226, rus_all, ...). Values are shares from 0 to 1;
//   blank = no votes cast in that period.
//   kind: "country" (position from worldtilegrid.csv) or "actor" (external actor,
//   laid out by the R script in a row below the grid, x and y already set).
//
// spec:
//   title, source
//   measures: { abs: { label, subtitle, color }, rus: { ... } }
//   periods (optional): { all: { label, short }, 1621: {...}, 2226: {...} }
//   actorsLabel (optional): text above the row of external actors
//   sideCols (optional): empty tile columns of white space on each side of the grid
//   playDelay (optional): ms before a two-period state moves on (default 1500)
//   gridSize (optional): [columns, rows], the least frame the grid is sized against,
//     in tiles. The rows set the height the tile size is based on, so it stays the
//     same whatever the layout; use 0 for columns. Title, grid and key are centred
//     in the stage as one block.
//
// state:
//   measure:   key of spec.measures
//   period:    "all" | "1621" | "2226", or [from, to] to play from one to the other
//   highlight: iso3 codes outlined in black and drawn on top; no tile is faded, so
//              every colour keeps its value (optional)
//   values:    iso3 codes that show their percentage on the tile (optional)
//
// The period buttons let the reader look at another period. That choice holds
// until the next step, which resets the grid to the narrated state.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";

let patternCount = 0;

const PERIODS = {
  all: { label: "2016–2026", short: "2016–26" },
  1621: { label: "2016–2021", short: "2016–21" },
  2226: { label: "2022–2026", short: "2022–26" },
};

// share -> class: 0%, up to 25%, up to 50%, up to 75%, above 75%
const BREAKS = [0, 0.25, 0.5, 0.75];
const BIN_LABELS = ["0%", "1–25%", "26–50%", "51–75%", "76–100%"];
// binned on the rounded percentage, so a tile never shows a colour class that
// disagrees with the "0%" printed on it (0.2% is class 0%, not "1-25%")
const bin = (v, breaks = BREAKS) =>
  breaks.filter((b) => Math.round(v * 100) / 100 > b).length;
const pct = (v) => `${Math.round(v * 100)}%`;

export function makeTileGrid(el, { rows, spec }) {
  const periods = spec.periods ?? PERIODS;
  const periodIds = Object.keys(periods);

  // ── data ────────────────────────────────────────────────────────────────
  const num = (d, col) =>
    d[col] === "" || d[col] == null ? null : Math.round(+d[col] * 1000) / 1000;

  const cell = 44; // tile pitch in map units
  const gap = 3;
  const pad = 6;
  const xs = rows.map((r) => +r.x);
  const ys = rows.map((r) => +r.y);
  const [x0, y0] = [d3.min(xs), d3.min(ys)];
  const [minCols, minRows] = spec.gridSize ?? [0, 0];
  const usedCols = d3.max(xs) - x0 + 1;
  const usedRows = d3.max(ys) - y0 + 1;
  const nCols = Math.max(usedCols, minCols);
  const nRows = Math.max(usedRows, minRows);
  const offX = (nCols - usedCols) / 2; // centre the tiles in the frame
  // frame = the space the grid is sized against (fixes the tile size);
  // content = what is actually drawn
  const W = nCols * cell + pad * 2;
  const H = nRows * cell + pad * 2;
  const side = spec.sideCols ?? 0; // empty tile columns of white space left and right
  const contentW = (usedCols + side * 2) * cell + pad * 2;
  const contentH = usedRows * cell + pad * 2;

  const tiles = rows.map((r) => ({
    ...r,
    px: pad + (offX + +r.x - x0) * cell,
    py: pad + (+r.y - y0) * cell,
  }));

  // one colour ramp per measure, light grey-blue to the measure's colour
  const ramps = Object.fromEntries(
    Object.entries(spec.measures).map(([k, m]) => [
      k,
      [0, 0.3, 0.5, 0.75, 1].map((t) =>
        d3.interpolateRgb("#eceff1", m.color)(t),
      ),
    ]),
  );

  // ── markup ──────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="fa-head">
      <div class="fa-title"></div>
      <div class="fa-subtitle"></div>
    </div>
    <div class="fa-tiles" role="group" aria-label="Select a period"></div>
    <div class="fa-map"></div>
    <div class="fa-foot">
      <div class="fa-key"></div>
      <div class="fa-source"></div>
    </div>
    <div class="fa-tooltip" aria-hidden="true"></div>`;

  const $ = (sel) => el.querySelector(sel);
  $(".fa-title").textContent = spec.title;
  $(".fa-source").textContent = spec.source;
  const subtitle = $(".fa-subtitle");
  const tooltip = d3.select($(".fa-tooltip"));

  // ── period buttons ──────────────────────────────────────────────────────
  const buttons = d3
    .select($(".fa-tiles"))
    .selectAll("button")
    .data(periodIds)
    .join("button")
    .attr("type", "button")
    .attr("class", "fa-tile")
    .text((id) => periods[id].short)
    .on("click", (event, id) => {
      clearTimeout(timer);
      paint({ ...shown, period: id }, true);
    });

  if (periodIds.length < 2) $(".fa-tiles").style.display = "none"; // one period: nothing to switch

  // ── grid ────────────────────────────────────────────────────────────────
  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `${(offX - side) * cell} 0 ${contentW} ${contentH}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", spec.title);

  // ── fit: size the grid from the frame, then centre title + grid + key as one
  // block in the stage (as the range chart does), so they stay together
  // however small the grid is ───────────────────────────────────────────────
  const mapEl = $(".fa-map");
  el.style.justifyContent = "center";
  mapEl.style.flex = "none";
  mapEl.style.aspectRatio = "auto";

  const room = (n) => {
    const cs = getComputedStyle(n);
    if (cs.display === "none") return 0;
    return n.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
  };
  function fit() {
    const availW = el.clientWidth;
    const availH =
      el.clientHeight -
      room($(".fa-head")) -
      room($(".fa-tiles")) -
      room($(".fa-foot"));
    if (availW <= 0 || availH <= 0) return;
    // pixels per map unit. Height: from the frame, so the tile size does not
    // depend on how many rows are drawn. Width: from what is drawn, so a narrow
    // screen is not sized for columns that are not there.
    const k = Math.min(availW / contentW, availH / H);
    mapEl.style.height = `${contentH * k}px`;
    svg
      .style("position", "relative")
      .style("display", "block")
      .style("margin", "0 auto")
      .style("width", `${contentW * k}px`)
      .style("height", `${contentH * k}px`);
  }
  new ResizeObserver(fit).observe(el);
  fit();

  // hatching for "no votes cast"
  const patId = `fa-nodata-${++patternCount}`;
  svg
    .append("defs")
    .append("pattern")
    .attr("id", patId)
    .attr("width", 6)
    .attr("height", 6)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(45)")
    .call((p) => {
      p.append("rect").attr("width", 6).attr("height", 6).attr("fill", "#fff");
      p.append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", 6)
        .attr("stroke", theme.light)
        .attr("stroke-width", 2);
    });

  // label above the row of external actors
  const actors = tiles.filter((d) => d.kind === "actor");
  if (actors.length && spec.actorsLabel) {
    svg
      .append("g")
      .attr("class", "fa-labels")
      .append("text")
      .attr(
        "x",
        d3.min(actors, (d) => d.px),
      )
      .attr("y", d3.min(actors, (d) => d.py) - 8)
      .text(spec.actorsLabel);
  }

  const cells = svg
    .append("g")
    .selectAll("g")
    .data(tiles, (d) => d.iso3)
    .join("g")
    .attr("transform", (d) => `translate(${d.px},${d.py})`)
    .on("pointerenter pointermove", showTooltip)
    .on("pointerleave", () => tooltip.style("opacity", 0));

  const size = cell - gap;
  cells
    .append("rect")
    .attr("width", size)
    .attr("height", size)
    .attr("rx", 2)
    .attr("stroke", theme.light)
    .attr("stroke-width", 0.75);

  const textAttrs = (sel, weight, fontSize) =>
    sel
      .attr("x", size / 2)
      .attr("text-anchor", "middle")
      .attr("font-family", theme.font)
      .attr("font-weight", weight)
      .attr("font-size", fontSize)
      .attr("pointer-events", "none");
  const codes = textAttrs(cells.append("text"), 700, 13).text((d) => d.iso3);
  const vals = textAttrs(cells.append("text"), 400, 13);

  // ── encodings ───────────────────────────────────────────────────────────
  function look(d, state) {
    const v = num(d, `${state.measure}_${state.period}`);
    if (v === null) return { v, fill: `url(#${patId})`, ink: theme.muted };
    const fill =
      ramps[state.measure][bin(v, spec.measures[state.measure].breaks)];
    return { v, fill, ink: d3.lab(fill).l > 62 ? theme.ink : "#fff" };
  }

  function tooltipHtml(d, state) {
    const m = spec.measures[state.measure];
    const lines = periodIds.map((id) => {
      const v = num(d, `${state.measure}_${id}`);
      return `${periods[id].label}: ${v === null ? "no votes" : pct(v)}`;
    });
    const where = d.subregion
      ? `<br><span style="color:${theme.muted}">${d.subregion}</span>`
      : "";
    // other measures for the period on screen, e.g. non-voting next to EU alignment
    const also = (spec.tooltipAlso ?? [])
      .filter((k) => k !== state.measure)
      .map((k) => {
        const v = num(d, `${k}_${state.period}`);
        return `${spec.measures[k].label}: ${v === null ? "no votes" : pct(v)}`;
      });
    const extra = also.length ? `<br>${also.join("<br>")}` : "";
    return `<strong>${d.name}</strong>${where}<br>${m.label}<br>${lines.join("<br>")}${extra}`;
  }

  // ── render ──────────────────────────────────────────────────────────────
  let shown = null; // state on screen (the step's, or the reader's choice)
  let timer = null;

  function render(state, animate) {
    clearTimeout(timer);
    const ms = [].concat(state.measure);
    const ps = [].concat(state.period ?? "all");
    const frames = Array.from(
      { length: Math.max(ms.length, ps.length) },
      (_, i) => ({
        ...state,
        measure: ms[Math.min(i, ms.length - 1)],
        period: ps[Math.min(i, ps.length - 1)],
      }),
    );
    paint(frames[0], animate);
    if (frames.length > 1) {
      timer = setTimeout(() => paint(frames[1], true), spec.playDelay ?? 3000);
    }
  }

  function paint(state, animate) {
    shown = state;
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const m = spec.measures[state.measure];
    const hi = state.highlight?.length ? new Set(state.highlight) : null;
    const show = new Set(state.values ?? []);

    subtitle.textContent = `${m.subtitle}, ${periods[state.period].label}`;
    buttons.attr("aria-pressed", (id) => String(id === state.period));

    const looks = new Map(tiles.map((d) => [d.iso3, look(d, state)]));

    // highlighted tiles: thick black outline, drawn last so it sits on top of
    // the neighbours. Nothing is faded, so no colour loses its value.
    const on = (d) => !!hi?.has(d.iso3);
    cells.sort((a, b) => on(a) - on(b));
    cells
      .select("rect")
      .transition(t)
      .attr("fill", (d) => looks.get(d.iso3).fill)
      .attr("stroke", (d) => (on(d) ? "#000" : theme.light))
      .attr("stroke-width", (d) => (on(d) ? 3 : 0.75));

    codes
      .attr("y", (d) => (show.has(d.iso3) ? size * 0.44 : size * 0.58))
      .transition(t)
      .attr("fill", (d) => looks.get(d.iso3).ink);
    vals
      .text((d) => {
        const v = looks.get(d.iso3).v;
        return show.has(d.iso3) && v !== null ? pct(v) : "";
      })
      .attr("y", size * 0.78)
      .transition(t)
      .attr("fill", (d) => looks.get(d.iso3).ink);

    renderKey(state);
  }

  function renderKey(state) {
    const key = d3.select($(".fa-key"));
    key.selectAll("*").remove();
    const m = spec.measures[state.measure];
    const col = `${state.measure}_${state.period}`;
    const hasGap = tiles.some((d) => num(d, col) === null);

    key.append("span").attr("class", "fa-key-label").text(m.label);
    const items = ramps[state.measure].map((c, i) => ({
      fill: c,
      label: (m.binLabels ?? BIN_LABELS)[i],
    }));
    if (hasGap) items.push({ fill: `url(#${patId})`, label: "No votes cast" });
    key
      .selectAll("span.fa-key-item")
      .data(items)
      .join("span")
      .attr("class", "fa-key-item")
      .html(
        (d) =>
          `<svg width="14" height="14" aria-hidden="true"><rect width="14" height="14" rx="2" fill="${d.fill}" stroke="${theme.light}" stroke-width="0.75"/></svg>${d.label}`,
      );
  }

  function showTooltip(event, d) {
    const box = el.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    tooltip
      .html(tooltipHtml(d, shown))
      .style("opacity", 1)
      .style("left", `${Math.min(x + 12, box.width - 180)}px`)
      .style("top", `${y + 12}px`);
  }

  return {
    el,
    update(state, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
