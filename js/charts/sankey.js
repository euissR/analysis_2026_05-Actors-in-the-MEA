// sankey.js: flows from suppliers (left) to recipients (right).
// Built for arms transfers; the soft power chapter can reuse it.
//
//   const chart = makeSankey(el, { rows, spec, region });
//   chart.update(state, { animate });
//
// rows (from R, e.g. mil_1_arms_AF.csv): supplier, actor_code, iso3, country, subregion, ssa, year, drone, tiv
//
// spec:
//   title, source
//   subtitle:        (state, periodLabel) => text
//   periods:         { all: { label }, p1: { label, from, to }, p2: { ... } }
//   supplierLabels:  supplier name in the data -> label (optional)
//   Suppliers and their flows are coloured by actor (theme.actorColors, via the
//   actor_code column); "other" suppliers are light grey.
//   countryLabels:   iso3 -> label (optional)
//   regionLabels:    subregion in the data -> label (optional)
//   changeSuppliers: suppliers shown with growth labels when state.change is on
//   nSuppliers (8), nCountries (10): how many nodes before the rest is lumped together
//                    (nodes are ordered largest first, "other" last)
//   unit:            wording of the key ("SIPRI TIV of delivered weapons")
//   tipLabel:        word before the figure in the tooltips (default "TIV"; "Students", "Migrants")
//   defaultPeriod:   period used when a step names none (default "all")
//   otherSuppliers, otherRecipients: wording of the lumped "other" nodes
//   reverse:         true = recipients on the left, suppliers on the right (see state.reverse)
//
// state (all optional):
//   period:     "all" (default) | "p1" | "p2"   (keys of spec.periods)
//   scope:      "all" (default) | "ssa"         (sub-Saharan Africa only)
//   subregion:  only flows to this subregion ("Gulf", "Middle East")
//   group:      "actor" = one node per actor (the EU member states become one "EU"),
//               instead of one per supplier country; highlight and change names are then
//               actor codes ("EU", "USA")
//   depth:      "region" (default) | "country"  what the right-hand nodes are
//   drones:     true = drone deliveries only
//   highlight:  flows at full strength, the rest dimmed. Entries are a supplier
//               name ("China", or an actor code with group: "actor") or { from, to }; `to` is an iso3 (country depth)
//               or a subregion name (region depth). Leave out `from` or `to` to match any.
//   show:       iso3 codes always shown as their own node (country depth)
//   changeSuppliers: suppliers that get change labels in this step, instead of spec.changeSuppliers
//   changeValues: true = the change labels show the figures ("199 → 877") instead of the percentage
//   change:     true = change labels, and dashed outlines at the 2016-21 level for
//               suppliers that grew.
//               Meant for period "p2".
//   recipients: true = show the number of recipient countries (non-state recipients not counted;
//               "+ AU" if the African Union is among them) instead of the share
//   nCountries: override spec.nCountries for this step
//   footnote:   text under the chart for this step (optional)
//   reverse:    true = the recipient nodes (regions or countries) on the left and the suppliers
//               on the right, for flows that run from Africa to an actor (students, migrants);
//               the ribbons keep the supplier's colour. Default: spec.reverse, else false.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
} from "https://cdn.jsdelivr.net/npm/d3-sankey@0.12/+esm";
import { theme } from "../theme.js";
import { makeHover } from "./hover.js";

const OTHER_S = "_other_suppliers";
const OTHER_T = "_other_recipients";
const UNKNOWN = "unknown supplier(s)";

export function makeSankey(el, { rows, spec, region, actors = [] }) {
  // On a phone the drawing is narrower, so the labels stay readable when it scales to the screen.
  const phone = matchMedia("(max-width: 768px)");
  let W, H, M;
  function setSize() {
    W = phone.matches ? 440 : region.width;
    H = phone.matches ? 430 : region.height;
    M = phone.matches
      ? { top: 6, right: 112, bottom: 6, left: 118 }
      : {
          top: 6,
          right: spec.marginRight ?? 150,
          bottom: 6,
          left: spec.marginLeft ?? 128,
        };
  }
  setSize();
  const NODE_W = 12;
  const fmt = d3.format(",.0f");
  const pct = (v) => (v > 0 && v < 0.005 ? "<1%" : `${Math.round(v * 100)}%`);
  // long names wrap onto two lines
  const wrap = (label, max = phone.matches ? 14 : 20) => {
    const lines = [];
    let line = "";
    for (const word of label.split(" ")) {
      if (line && `${line} ${word}`.length > max) {
        lines.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    return [...lines, line];
  };
  const signed = (v) => `${v < 0 ? "−" : "+"}${Math.abs(Math.round(v * 100))}%`;

  // ── data ────────────────────────────────────────────────────────────────
  const truthy = (v) => v === true || /^true$/i.test(v);
  const data = rows.map((r) => ({
    supplier: r.supplier,
    actor: r.actor_code,
    iso3: r.iso3,
    country: r.country,
    subregion: r.subregion,
    ssa: truthy(r.ssa),
    drone: truthy(r.drone),
    year: +r.year,
    tiv: +r.tiv,
  }));

  const actorOf = new Map(data.map((d) => [d.supplier, d.actor]));
  const actorName = new Map(actors.map((a) => [a.actor, a.label]));
  // raw = a supplier name, or (group: "actor") an actor code
  const colorOf = (raw) =>
    theme.actorColors?.[actorOf.get(raw)] ?? theme.actorColors?.[raw] ?? theme.light;

  const countryName = new Map(
    data.map((d) => [d.iso3, spec.countryLabels?.[d.iso3] ?? d.country]),
  );
  const supplierLabel = (id) =>
    id === OTHER_S
      ? (spec.otherSuppliers ?? "Other suppliers")
      : (spec.supplierLabels?.[id] ?? actorName.get(id) ?? id);
  const targetLabel = (id, depth) =>
    id === OTHER_T
      ? (spec.otherRecipients ?? "Other countries")
      : depth === "country"
        ? (countryName.get(id) ?? id)
        : (spec.regionLabels?.[id] ?? id);

  const inPeriod = (d, p) =>
    (p.from == null || d.year >= p.from) && (p.to == null || d.year <= p.to);

  // ── one state -> nodes and links ──────────────────────────────────────────
  function build(state) {
    const depth = state.depth ?? "region";
    const reverse = state.reverse ?? spec.reverse ?? false;
    const period = spec.periods[state.period ?? spec.defaultPeriod ?? "all"];
    const base = data.filter(
      (d) =>
        (state.scope !== "ssa" || d.ssa) &&
        (!state.subregion || d.subregion === state.subregion) &&
        (!state.drones || d.drone),
    );
    // the supplier node of a row: the supplier country, or its actor (EU member states -> "EU")
    const nodeOf = (d) =>
      state.group === "actor" && d.actor !== "other" ? d.actor : d.supplier;
    const keep = base.filter((d) => inPeriod(d, period));
    const hl = (state.highlight ?? []).map((h) =>
      typeof h === "string" ? { from: h } : h,
    );

    // suppliers: the biggest, plus any the step names; the rest become "Other"
    const supTotals = d3.rollup(keep, (v) => d3.sum(v, (d) => d.tiv), nodeOf);
    const forced = new Set([
      ...hl.map((h) => h.from).filter(Boolean),
      ...(state.change ? (state.changeSuppliers ?? spec.changeSuppliers ?? []) : []),
    ]);
    const top = new Set(
      [...supTotals]
        .filter(([k]) => k !== UNKNOWN)
        .sort((a, b) => b[1] - a[1])
        .slice(0, state.nSuppliers ?? spec.nSuppliers ?? 8)
        .map(([k]) => k),
    );
    const supId = (s) => (top.has(s) || forced.has(s) ? s : OTHER_S);

    // recipients: subregions, or the biggest countries plus the ones the step names
    let tgtId;
    if (depth === "country") {
      const tot = d3.rollup(keep, (v) => d3.sum(v, (d) => d.tiv), (d) => d.iso3);
      const topC = new Set(
        [...tot]
          .sort((a, b) => b[1] - a[1])
          .slice(0, state.nCountries ?? spec.nCountries ?? 10)
          .map(([k]) => k),
      );
      const force = new Set([
        ...hl.map((h) => h.to).filter(Boolean),
        ...(state.show ?? []),
      ]);
      tgtId = (d) => (topC.has(d.iso3) || force.has(d.iso3) ? d.iso3 : OTHER_T);
    } else {
      tgtId = (d) => d.subregion;
    }
    const tgtKey = (d) => (depth === "country" ? d.iso3 : d.subregion);

    const links = [
      ...d3.rollup(
        keep,
        (v) => d3.sum(v, (d) => d.tiv),
        (d) => supId(nodeOf(d)),
        tgtId,
      ),
    ]
      .flatMap(([s, m]) => [...m].map(([t, v]) => ({ s, t, value: v })))
      .filter((l) => l.value > 0)
      .map((l) => ({ source: `s:${l.s}`, target: `t:${l.t}`, value: l.value }))
      // reverse: drawn from the recipient (left) to the supplier (right)
      .map((l) => (reverse ? { ...l, source: l.target, target: l.source } : l));

    // nodes ordered by what the step shows: largest first, "other" last
    const totals = new Map();
    links.forEach((l) => {
      totals.set(l.source, (totals.get(l.source) ?? 0) + l.value);
      totals.set(l.target, (totals.get(l.target) ?? 0) + l.value);
    });
    const ids = new Map();
    const node = (id, side) => {
      if (ids.has(id)) return;
      const raw = id.slice(2);
      ids.set(id, {
        id,
        side,
        left: (side === "s") !== reverse, // drawn in the left column
        raw,
        order: raw === OTHER_S || raw === OTHER_T ? 1e9 : -totals.get(id),
        label: side === "s" ? supplierLabel(raw) : targetLabel(raw, depth),
        color: side === "s" ? (raw === OTHER_S ? theme.light : colorOf(raw)) : theme.grey,
      });
    };
    links.forEach((l) => {
      node(l.source, l.source[0]);
      node(l.target, l.target[0]);
    });

    const layout = d3Sankey()
      .nodeId((d) => d.id)
      .nodeWidth(NODE_W)
      .nodePadding(spec.nodePadding ?? 9)
      .nodeSort((a, b) => a.order - b.order)
      .extent([
        [M.left, M.top],
        [W - M.right, H - M.bottom],
      ]);
    const graph = layout({ nodes: [...ids.values()], links });

    const total = d3.sum(graph.links, (l) => l.value);
    const ky = (() => {
      const n = graph.nodes.find((d) => d.value > 0);
      return n ? (n.y1 - n.y0) / n.value : 0;
    })();

    // extras for the labels
    const before = new Map();
    if (state.change) {
      const p1 = spec.periods.p1;
      d3.rollup(
        base.filter((d) => inPeriod(d, p1)),
        (v) => d3.sum(v, (d) => d.tiv),
        (d) => `s:${supId(nodeOf(d))}`,
      ).forEach((v, k) => k !== `s:${OTHER_S}` && before.set(k, v));
    }
    const reach = new Map();
    if (state.recipients) {
      // countries only: non-state recipients are left out of the count (spec.nonCountries);
      // the African Union is added as "+ AU" when the supplier reached it
      const non = new Set(spec.nonCountries ?? ["HOR", "RSF", "HZB", "HTH", "SYX", "AUC"]);
      d3.rollup(
        keep,
        (v) => ({
          n: new Set(v.filter((d) => !non.has(d.iso3)).map((d) => d.iso3)).size,
          au: v.some((d) => d.iso3 === "AUC"),
        }),
        (d) => `s:${supId(nodeOf(d))}`,
      ).forEach((v, k) => k !== `s:${OTHER_S}` && reach.set(k, v));
    }

    return { nodes: graph.nodes, links: graph.links, hl, total, ky, before, reach, depth, period };
  }

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

  const applySize = () => {
    el.style.setProperty("--fa-aspect", `${W} / ${H}`);
    svg.attr("viewBox", `0 0 ${W} ${H}`);
  };
  const $ = (sel) => el.querySelector(sel);
  $(".fa-title").textContent = spec.title;
  $(".fa-credit").textContent = spec.source ?? "";
  const tooltip = d3.select($(".fa-tooltip"));
  const hover = makeHover(el, tooltip);

  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", spec.title);

  applySize();
  const gLinks = svg.append("g");
  const gGhost = svg.append("g");
  const gNodes = svg.append("g");
  const gLabels = svg.append("g").attr("class", "fa-labels");

  const linkPath = sankeyLinkHorizontal();
  const linkKey = (d) => `${d.source.id}>${d.target.id}`;

  // ── render ──────────────────────────────────────────────────────────────
  let shown = null;
  let current = null;

  function render(state, animate) {
    shown = state;
    const g = (current = build(state));
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const { nodes, links, hl, total, ky, before, reach, period } = g;

    const hasHl = hl.length > 0;
    const supNode = (l) => (l.source.side === "s" ? l.source : l.target);
    const tgtNode = (l) => (l.source.side === "s" ? l.target : l.source);
    const linkHi = (l) =>
      hl.some(
        (h) =>
          (!h.from || h.from === supNode(l).raw) &&
          (!h.to || h.to === tgtNode(l).raw),
      );
    const lit = new Set();
    links.forEach((l) => {
      if (linkHi(l)) {
        lit.add(l.source.id);
        lit.add(l.target.id);
      }
    });
    const nodeLit = (n) => !hasHl || lit.has(n.id);

    $(".fa-subtitle").textContent =
      typeof spec.subtitle === "function"
        ? spec.subtitle(state, period.label)
        : spec.subtitle;

    // links
    gLinks
      .selectAll("path")
      .data(links, linkKey)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("fill", "none")
            .attr("stroke-opacity", 0)
            .attr("d", linkPath)
            .attr("stroke-width", (d) => Math.max(1, d.width))
            .on("pointerenter pointermove", (e, d) => showLink(e, d))
            .on("pointerleave", hideTip),
        (update) => update,
        (exit) => exit.transition(t).attr("stroke-opacity", 0).remove(),
      )
      .attr("stroke", (d) => supNode(d).color)
      .transition(t)
      .attr("d", linkPath)
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .attr("stroke-opacity", (d) => (!hasHl ? 0.6 : linkHi(d) ? 0.9 : theme.dim * 0.7));

    // dashed outlines: where each supplier stood in the first period
    const ghosts = state.change
      ? nodes.filter(
          (n) => n.side === "s" && before.get(n.id) > 0 && before.get(n.id) < n.value,
        ) // growth only: an outline taller than the node would overlap its neighbours
      : [];
    gGhost
      .selectAll("rect")
      .data(ghosts, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("fill", "none")
            .attr("stroke", theme.ink)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2 2")
            .attr("opacity", 0)
            .attr("x", (d) => d.x0 - 2)
            .attr("y", (d) => d.y0)
            .attr("width", NODE_W + 4)
            .attr("height", (d) => before.get(d.id) * ky),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .transition(t)
      .attr("x", (d) => d.x0 - 2)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => before.get(d.id) * ky)
      .attr("opacity", 1);

    // nodes
    gNodes
      .selectAll("rect")
      .data(nodes, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("opacity", 0)
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .attr("width", NODE_W)
            .attr("height", (d) => Math.max(1, d.y1 - d.y0))
            .on("pointerenter pointermove", (e, d) => showNode(e, d))
            .on("pointerleave", hideTip),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .attr("fill", (d) => d.color)
      .transition(t)
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => Math.max(1, d.y1 - d.y0))
      .attr("opacity", (d) => (nodeLit(d) ? 1 : theme.dim));

    // labels: name in bold, then a muted figure (share, growth or number of recipients)
    const extra = (n) => {
      if (n.side === "s" && state.recipients && reach.has(n.id)) {
        const r = reach.get(n.id);
        return `${r.n} countries${r.au ? " + AU" : ""}`;
      }
      if (n.side === "s" && state.change && before.get(n.id) > 0)
        return state.changeValues
          ? `${fmt(before.get(n.id))} → ${fmt(n.value)}`
          : signed(n.value / before.get(n.id) - 1);
      return pct(n.value / total);
    };
    // room for the dashed outline of the change labels on the supplier nodes
    const labelX = (n) => {
      const pad = state.change && n.side === "s" ? 7 : 5;
      return n.left ? n.x0 - pad : n.x1 + pad;
    };
    const showLabel = (n) =>
      hasHl ? lit.has(n.id) || n.y1 - n.y0 > 9 : n.y1 - n.y0 > 7;

    // label spacing: labels that would overlap are pushed apart, top to bottom, per side
    [true, false].forEach((left) => {
      let bottom = -Infinity;
      nodes
        .filter((n) => n.left === left && showLabel(n))
        .sort((a, b) => a.y0 + a.y1 - (b.y0 + b.y1))
        .forEach((n) => {
          const h = wrap(n.label).length * 13.8;
          const c = Math.max((n.y0 + n.y1) / 2, bottom + 1 + h / 2);
          n.yl = c;
          bottom = c + h / 2;
        });
    });

    gLabels
      .selectAll("text")
      .data(nodes, (d) => d.id)
      .join(
        (enter) => enter.append("text").attr("opacity", 0),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .attr("text-anchor", (d) => (d.left ? "end" : "start"))
      .attr("x", labelX)
      .each(function (d) {
        const text = d3.select(this);
        const x = labelX(d);
        text.selectAll("tspan").remove();
        const lines = wrap(d.label);
        lines.forEach((line, i) => {
          text
            .append("tspan")
            .attr("x", x)
            .attr("dy", i ? "1.1em" : 0)
            .text(line);
        });
        text
          .append("tspan")
          .attr("dx", 4)
          .attr("font-weight", 400)
          .attr("fill", theme.muted)
          .text(extra(d));
      })
      .transition(t)
      .attr("y", (d) => (d.yl ?? (d.y0 + d.y1) / 2) + 4 - (wrap(d.label).length - 1) * 6.5)
      .attr("opacity", (d) => (showLabel(d) && nodeLit(d) ? 1 : showLabel(d) ? theme.dim + 0.2 : 0));

    $(".fa-footnote").textContent = state.footnote ?? "";
    drawKey(state);
  }

  function drawKey(state) {
    const key = d3.select($(".fa-key"));
    key.selectAll("*").remove();
    key
      .append("span")
      .attr("class", "fa-key-item")
      .html(
        `<svg width="26" height="14" aria-hidden="true"><path d="M0 3C10 3 12 11 26 11" fill="none" stroke="${theme.grey}" stroke-opacity="0.5" stroke-width="5"/></svg>Width: ${spec.unit ?? "SIPRI TIV of delivered weapons"}`,
      );
    if (state.change)
      key
        .append("span")
        .attr("class", "fa-key-item")
        .html(
          `<svg width="14" height="14" aria-hidden="true"><rect x="1" y="1" width="12" height="12" fill="none" stroke="${theme.ink}" stroke-dasharray="2 2"/></svg>${spec.periods.p1.label} level; label = change to ${spec.periods.p2.label}`,
        );
  }

  // ── tooltip ─────────────────────────────────────────────────────────────
  function show(event, html, opts = {}) {
    tooltip
      .html(html)
      .style("opacity", 1);
    hover.enter(event, opts);
  }
  const hideTip = hover.leave;

  function showLink(event, d) {
    show(
      event,
      `<strong>${d.source.label} → ${d.target.label}</strong><br>${spec.tipLabel ?? "TIV"} ${fmt(d.value)} (${pct(d.value / current.total)} of the total)`,
      { follow: true, soft: true }, // ribbons: follow the mouse, darken
    );
  }
  function showNode(event, d) {
    show(
      event,
      `<strong>${d.label}</strong><br>${spec.tipLabel ?? "TIV"} ${fmt(d.value)} (${pct(d.value / current.total)} of the total)`,
      { raise: true },
    );
  }

  phone.addEventListener("change", () => {
    setSize();
    applySize();
    if (shown) render(shown, false);
  });

  return {
    el,
    update(state, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
