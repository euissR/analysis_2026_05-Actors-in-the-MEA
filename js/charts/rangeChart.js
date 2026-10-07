// rangeChart.js: one row per summit series, from launch year to latest and next summit.
//
//   const chart = makeRangeChart(el, { actors, rows, spec });
//   chart.update(state, { animate });
//
// rows (long format, one row per milestone): id, actor, name, n, when, value
//   when = start_year   value = launch year,  n = summits held to date
//   when = last_summit  value = year of the latest summit
//   when = next_summit  value = year of the next scheduled summit (blank = none announced)
//
// state:
//   highlight: actor codes and/or series ids (as strings) at full strength; all
//              other rows dimmed (optional). An id picks one summit series, an
//              actor code picks all of that actor's series.
//
// spec.postponed (optional): { id: plannedYear }. Series that were planned but
//   postponed. Drawn as a dashed hollow marker at the planned year instead of a
//   scheduled summit; a series that has never met is shown too (marker only).
//   spec.keyPostponed: key wording.
//
// Rows are sorted by launch year. The block (title, chart, key) is centred
// vertically in the stage.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";

export function makeRangeChart(el, { actors, rows, spec }) {
  const actorLabel = new Map(actors.map((a) => [a.actor, a.label]));
  Object.entries(spec.extraActors ?? {}).forEach(([code, label]) => actorLabel.set(code, label));
  const labelOf = (code) => actorLabel.get(code) ?? code;

  // ── data: one record per summit series ─────────────────────────────────
  const year = (v) => (v === "" || v == null ? null : +v);
  const series = d3
    .rollups(
      rows,
      (g) => {
        const at = (w) => g.find((r) => r.when === w);
        return {
          id: g[0].id,
          actor: g[0].actor,
          name: g[0].name,
          count: +at("start_year")?.n || 0,
          start: year(at("start_year")?.value),
          last: year(at("last_summit")?.value),
          next: year(at("next_summit")?.value),
          postponed: spec.postponed?.[g[0].id] ?? null,
        };
      },
      (r) => r.id
    )
    .map(([, s]) => s)
    // skip series that have not met yet (no launch year, or zero summits held)
    .filter((s) => s.postponed != null || (s.start != null && (s.count > 0 || s.last != null)))
    .sort((a, b) => d3.ascending(a.start ?? a.postponed, b.start ?? b.postponed) || d3.ascending(a.name, b.name));

  const maxCount = d3.max(series, (s) => s.count);
  const rSize = d3.scaleSqrt().domain([0, maxCount]).range([3, 10]);
  const R_END = 4.5; // latest / next summit dots

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

  const $ = (sel) => el.querySelector(sel);
  const mapEl = $(".fa-map");
  $(".fa-title").textContent = spec.title;
  $(".fa-subtitle").textContent = spec.subtitle;
  $(".fa-source").textContent = spec.source;
  const tooltip = d3.select($(".fa-tooltip"));
  el.classList.add("fa-chart--range");

  // ── key (drawn once) ────────────────────────────────────────────────────
  (function drawKey() {
    const key = d3.select($(".fa-key"));
    const values = spec.keyValues ?? [1, Math.round(maxCount / 2), maxCount];
    const maxR = rSize(d3.max(values));
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
    g.append("circle").attr("cy", (v) => maxR * 2 - rSize(v) + 1).attr("r", (v) => rSize(v)).attr("fill", theme.teal);
    g.append("text").attr("y", maxR * 2 + 14).attr("text-anchor", "middle").text((v) => v);
    key.append("span").attr("class", "fa-key-label").text(spec.keySize);

    const dot = (fill, stroke) =>
      `<svg width="${R_END * 2 + 4}" height="${R_END * 2 + 4}" aria-hidden="true"><circle cx="${R_END + 2}" cy="${R_END + 2}" r="${R_END}" fill="${fill}" stroke="${stroke}" stroke-width="1.75"/></svg>`;
    key.append("span").attr("class", "fa-key-item").html(`${dot(theme.teal, theme.land)}${spec.keyLast}`);
    key.append("span").attr("class", "fa-key-item").html(`${dot(theme.land, theme.teal)}${spec.keyNext}`);
    if (series.some((s) => s.postponed != null)) {
      key.append("span").attr("class", "fa-key-item").html(
        `<svg width="${R_END * 2 + 4}" height="${R_END * 2 + 4}" aria-hidden="true"><circle cx="${R_END + 2}" cy="${R_END + 2}" r="${R_END}" fill="${theme.land}" stroke="${theme.teal}" stroke-width="1.5" stroke-dasharray="2 1.5"/></svg>${spec.keyPostponed ?? "Postponed"}`,
      );
    }
  })();

  // ── chart (redrawn when the width changes, so text keeps its size) ─────
  const ROW_H = 38;
  let svg;
  let rowSel;
  let shown = {};

  function draw(w) {
    const compact = w < 520;
    const m = { top: 6, right: 16, bottom: 26, left: compact ? 112 : 190 };
    const H = m.top + series.length * ROW_H + m.bottom;
    const [d0, d1] = spec.domain ?? [1970, 2030];
    const x = d3.scaleLinear().domain([d0, d1]).range([m.left, w - m.right]);
    const maxChars = Math.floor((m.left - 8) / 5.4);
    const short = (s) => {
      const t = spec.shortNames?.[s.name] ?? s.name.match(/\(([^)]+)\)\s*$/)?.[1] ?? s.name;
      return t.length > maxChars ? t.slice(0, maxChars - 1).trimEnd() + "…" : t;
    };

    el.style.setProperty("--fa-aspect", `${w} / ${H}`);
    mapEl.innerHTML = "";
    svg = d3
      .select(mapEl)
      .append("svg")
      .attr("viewBox", `0 0 ${w} ${H}`)
      .attr("preserveAspectRatio", "xMidYMin meet")
      .attr("role", "img")
      .attr("aria-label", spec.title);

    // year grid + axis
    // spec.tickStep (optional): ticks on round multiples, e.g. 5 -> 2015, 2020, 2025
    const step = spec.tickStep ?? (compact ? 20 : 10);
    const ticks = spec.tickStep
      ? d3.range(Math.ceil(d0 / step) * step, d1 + 1, step)
      : d3.range(d0, d1 + 1, step);
    svg
      .append("g")
      .attr("class", "fa-range-grid")
      .selectAll("line")
      .data(ticks)
      .join("line")
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", m.top)
      .attr("y2", H - m.bottom);
    svg
      .append("g")
      .attr("class", "fa-axis")
      .selectAll("text")
      .data(ticks)
      .join("text")
      .attr("x", x)
      .attr("y", H - 8)
      .attr("text-anchor", "middle")
      .text((t) => t);

    // one group per summit series
    rowSel = svg
      .append("g")
      .selectAll("g")
      .data(series, (s) => s.id)
      .join("g")
      .attr("transform", (s, i) => `translate(0,${m.top + i * ROW_H})`);

    const cy = ROW_H / 2;
    rowSel.append("text").attr("class", "fa-row-actor").attr("x", 0).attr("y", cy - 3).text((s) => labelOf(s.actor));
    rowSel.append("text").attr("class", "fa-row-name").attr("x", 0).attr("y", cy + 11).text(short);

    // launch -> latest: solid; latest -> next: dotted
    rowSel
      .filter((s) => s.last != null && s.last > s.start)
      .append("line")
      .attr("x1", (s) => x(s.start))
      .attr("x2", (s) => x(s.last))
      .attr("y1", cy)
      .attr("y2", cy)
      .attr("stroke", theme.teal)
      .attr("stroke-width", 2.5);
    // dotted lead-in to a scheduled or a postponed summit
    rowSel
      .filter((s) => s.postponed != null || s.next != null)
      .filter((s) => (s.last ?? s.start) != null && (s.last ?? s.start) < (s.postponed ?? s.next))
      .filter((s) => s.count > 0)
      .append("line")
      .attr("x1", (s) => x(s.last ?? s.start))
      .attr("x2", (s) => x(s.postponed ?? s.next))
      .attr("y1", cy)
      .attr("y2", cy)
      .attr("stroke", theme.teal)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "2 3");

    rowSel
      .filter((s) => s.next != null && s.postponed == null)
      .append("circle")
      .attr("cx", (s) => x(s.next))
      .attr("cy", cy)
      .attr("r", R_END)
      .attr("fill", theme.land)
      .attr("stroke", theme.teal)
      .attr("stroke-width", 1.75);
    rowSel
      .filter((s) => s.last != null && s.last > s.start)
      .append("circle")
      .attr("cx", (s) => x(s.last))
      .attr("cy", cy)
      .attr("r", R_END)
      .attr("fill", theme.teal)
      .attr("stroke", theme.land)
      .attr("stroke-width", 1.25);
    // postponed: dashed hollow marker at the planned year
    rowSel
      .filter((s) => s.postponed != null)
      .append("circle")
      .attr("cx", (s) => x(s.postponed))
      .attr("cy", cy)
      .attr("r", R_END)
      .attr("fill", theme.land)
      .attr("stroke", theme.teal)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "2 1.5");
    rowSel
      .filter((s) => s.count > 0)
      .append("circle")
      .attr("cx", (s) => x(s.start))
      .attr("cy", cy)
      .attr("r", (s) => rSize(s.count))
      .attr("fill", theme.teal)
      .attr("stroke", theme.land)
      .attr("stroke-width", 1.25);

    // transparent hit area on top, for the tooltip
    rowSel
      .append("rect")
      .attr("width", w)
      .attr("height", ROW_H)
      .attr("fill", "transparent")
      .on("pointerenter pointermove", showTooltip)
      .on("pointerleave", () => tooltip.style("opacity", 0));
  }

  // ── render: which rows are at full strength ────────────────────────────
  function render(state, animate) {
    shown = state;
    const hi = new Set(state.highlight ?? []);
    const on = (s) => (hi.size ? hi.has(s.actor) || hi.has(String(s.id)) : true);

    rowSel
      .transition()
      .duration(animate ? theme.duration : 0)
      .attr("opacity", (s) => (on(s) ? 1 : theme.dim));
  }

  function showTooltip(event, s) {
    const box = el.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const held = s.count > 0
      ? `${s.count} summit${s.count === 1 ? "" : "s"} held since ${s.start}`
      : "no summit held yet";
    const next = s.postponed != null
      ? `planned for ${s.postponed}, postponed`
      : s.next != null ? `next scheduled: ${s.next}` : "no next summit announced";
    tooltip
      .html(`<strong>${s.name}</strong><br>${labelOf(s.actor)}<br>${held}<br>${s.count > 0 ? `latest: ${s.last ?? "–"}; ` : ""}${next}`)
      .style("opacity", 1)
      .style("left", `${Math.min(x + 12, box.width - 180)}px`)
      .style("top", `${y + 12}px`);
  }

  // first draw, then redraw whenever the width changes
  let width = Math.round(mapEl.getBoundingClientRect().width) || 640;
  draw(width);
  render(shown, false);
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w && w !== width) {
      width = w;
      draw(w);
      render(shown, false);
    }
  }).observe(mapEl);

  return {
    el,
    update(state, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
