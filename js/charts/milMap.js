// milMap.js: military bases (dots) and deployments (spikes) on one map.
//
//   const chart = makeMilMap(el, { geo, actors, rows, extra, spec, region });
//   chart.update(state, { animate });
//
// rows (deployments, e.g. mil_3_dep_AF.csv):
//   actor_code, actor, iso3, country, type, mission, n, estimate
// extra.bases (mil_2_bases_AF.csv):
//   iso3, country, actor_code, actor, n_bases, kind, lon, lat
//   lon/lat are optional: where a row has them the dots are drawn there instead of
//   at the country (Diego Garcia)
// extra.pts (mil_AF_countries.csv): iso3, name, subregion, lon, lat
//   where each country and sea area is anchored
//
// spec:
//   title, subtitle (text or (state) => text), source, allLabel
//   types:     [{ id, short, label, color, from: [type names in the data] }], drawing order.
//              Spikes are coloured by actor (like the dots). The steps show one type at a
//              time, so the type needs no visual encoding; the key names it. If a step ever
//              shows several types at once: spikeColor: "type" colours them by type.color,
//              or give types a `fill` (0-1) and `dash` ("3 2") to tell them apart
//   spikeFill: fill opacity of the spikes (0.35)
//   maxLines:  most lines in a label block (6); the rest becomes "+ N more"
//   spikeK:    map units of spike height per person (0.02)
//   spikeW:    spike width (8);  spikeDx: spacing between dodged spikes (9)
//   memberMin: EU member states below this many personnel in a country share one
//              spike (30); larger ones get their own, so the figures match the text
//   dotR:      radius of a base dot (3.6)
//   keyRef:    personnel figure of the reference spike in the key (1000)
//   names:     { iso3: label } where the name from the data is not the one to show
//   offmap:    { "MUS|USA": "Diego Garcia (Chagos Islands)" }  label for a dot group that
//              falls outside the map; it is drawn at the edge with an arrow
//
// state (all optional):
//   bases:     true = draw base dots (colour = actor)
//   types:     deployment types to draw, by id: ["Bilateral", "PMC", "UN", "Other"]
//   spikeK:    spike scale for this step, instead of spec.spikeK (zoom in on small figures)
//   keyRef:    personnel figure of the reference spike in the key, instead of spec.keyRef
//   actors:    actor codes at full strength, everything else dimmed
//              (the legend tiles set this; the choice holds until the next step)
//   labels:    iso3 codes to name on the map, or { iso3, dx, dy, anchor: "start" | "end" }
//   values:    iso3 codes that get a label block listing who deployed how many
//              (name, then one line per spike), or "all"
//   outline:   iso3 codes outlined in black
//   notes:     [{ iso3, lines: [...], dx, dy }]  short text with a leader line
//   footnote:  text under the key

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { theme } from "../theme.js";
import { geoRobinson } from "../robinson.js";

let clipCount = 0;

export function makeMilMap(el, { geo, actors, rows, extra, spec, region }) {
  const { width: W, height: H } = region;
  const fmt = d3.format(",");
  const SPIKE_K = spec.spikeK ?? 0.02;
  const SPIKE_W = spec.spikeW ?? 8;
  const SPIKE_DX = spec.spikeDx ?? 9;
  const SPIKE_FILL = spec.spikeFill ?? 0.35;
  const MEMBER_MIN = spec.memberMin ?? 30;
  const DOT_R = spec.dotR ?? 3.6;
  const DOT_GAP = DOT_R * 2 + 1.5;
  const EDGE = 12;

  const order = new Map(actors.map((a) => [a.actor, a.order]));
  const actorLabel = new Map(actors.map((a) => [a.actor, a.label]));
  const colorOf = (a) => theme.actorColors?.[a] ?? theme.light;
  const byType = spec.spikeColor === "type";
  const spikeFill = (d) => (byType ? d.type.color : colorOf(d.actor));
  // a darker outline, so pale actor colours (India's yellow) stay visible on white
  const spikeStroke = (d) =>
    byType ? d.type.color : d3.color(colorOf(d.actor)).darker(0.8).formatHex();
  const typeOf = new Map();
  spec.types.forEach((t) => t.from.forEach((f) => typeOf.set(f, t)));
  const typeIndex = new Map(spec.types.map((t, i) => [t.id, i]));
  const byOrder = (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99);
  const truthy = (v) => v === true || /^true$/i.test(v);

  // ── projection, anchors ─────────────────────────────────────────────────
  const projection = geoRobinson()
    .rotate([-region.center[0], 0])
    .fitExtent(
      [
        [8, 8],
        [W - 8, H - 8],
      ],
      {
        type: "MultiPoint",
        coordinates: [
          region.fit[0],
          region.fit[1],
          [region.fit[0][0], region.fit[1][1]],
          [region.fit[1][0], region.fit[0][1]],
        ],
      },
    );
  const path = d3.geoPath(projection);

  // a point on the map; `off` = outside the drawing, pulled back to its edge
  function place(lon, lat) {
    const [x, y] = projection([+lon, +lat]);
    const cx = Math.min(Math.max(x, EDGE), W - EDGE);
    const cy = Math.min(Math.max(y, EDGE), H - EDGE);
    return { x: cx, y: cy, off: cx !== x || cy !== y };
  }
  const anchors = new Map(
    extra.pts.map((d) => [d.iso3, { ...d, ...place(d.lon, d.lat) }]),
  );
  const nameOf = (iso3) => spec.names?.[iso3] ?? anchors.get(iso3)?.name ?? iso3;

  // ── data ────────────────────────────────────────────────────────────────
  // One spike per actor x country x type. EU member states get their own spike, so that
  // France's 1,500 in Djibouti is not hidden in an EU total; the small ones share one.
  const spikes = [];
  d3.group(
    rows
      .filter((r) => r.n !== "" && r.n != null && typeOf.has(r.type))
      .map((r) => ({ ...r, n: +r.n, t: typeOf.get(r.type) })),
    (d) => `${d.iso3}|${d.actor_code}|${d.t.id}`,
  ).forEach((v, key) => {
    const first = v[0];
    const eu = first.actor_code === "EU";
    const big = [];
    const small = [];
    d3.groups(v, (d) => (eu ? d.actor : first.actor_code)).forEach(([m, mv]) => {
      (eu && d3.sum(mv, (d) => d.n) < MEMBER_MIN ? small : big).push({ m, mv });
    });
    const emit = (m, mv, who) =>
      spikes.push({
        key: `${key}|${m}`,
        iso3: first.iso3,
        actor: first.actor_code,
        who,
        type: first.t,
        value: d3.sum(mv, (d) => d.n),
        estimate: mv.some((d) => truthy(d.estimate)),
        parts: mv,
      });
    big.forEach(({ m, mv }) =>
      emit(m, mv, eu ? m : (actorLabel.get(first.actor_code) ?? first.actor_code)),
    );
    if (small.length)
      emit(
        "others",
        small.flatMap((x) => x.mv),
        big.length ? "Other EU states" : "EU Member States",
      );
  });

  // one dot per base
  const baseDots = extra.bases
    .filter((r) => +r.n_bases > 0)
    .flatMap((r) =>
      d3.range(+r.n_bases).map((j) => ({
        key: `${r.iso3}|${r.actor_code}|${r.actor}|${j}`,
        iso3: r.iso3,
        actor: r.actor_code,
        member: r.actor,
        light: r.kind === "light footprint",
        custom: r.lon !== "" && r.lon != null && r.lat !== "" && r.lat != null,
        lon: r.lon,
        lat: r.lat,
      })),
    );
  baseDots.forEach((d) => {
    d.gkey = d.custom ? `${d.iso3}|${d.actor}|custom` : d.iso3;
  });

  // ── markup ──────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="fa-head">
      <div class="fa-title"></div>
      <div class="fa-subtitle"></div>
    </div>
    <div class="fa-tiles" role="group" aria-label="Highlight an actor"></div>
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

  // legend tiles: the actors on screen; the reader can pick one. The choice holds
  // until the next step.
  const tileBox = d3.select($(".fa-tiles"));
  function drawTiles(state, onScreen) {
    const data = [
      { actor: "all", label: spec.allLabel ?? "All actors" },
      ...actors.filter((a) => onScreen.has(a.actor)),
    ];
    const lit = state.actors?.length ? new Set(state.actors) : null;
    tileBox
      .selectAll("button")
      .data(data, (d) => d.actor)
      .join((enter) => {
        const b = enter
          .append("button")
          .attr("type", "button")
          .attr("class", "fa-tile")
          .on("click", (event, d) => {
            render({ ...shown, actors: d.actor === "all" ? [] : [d.actor] }, true);
          });
        b.filter((d) => d.actor !== "all")
          .append("span")
          .style("display", "inline-block")
          .style("width", "0.6em")
          .style("height", "0.6em")
          .style("border-radius", "50%")
          .style("margin-right", "0.35em")
          .style("background", (d) => colorOf(d.actor))
          .style("box-shadow", `0 0 0 0.75px ${theme.ink}`);
        b.append("span").text((d) => d.label);
        return b;
      })
      .order()
      .attr("aria-pressed", (d) =>
        d.actor === "all" ? !lit : !!lit && lit.size === 1 && lit.has(d.actor),
      );
  }

  // ── map ─────────────────────────────────────────────────────────────────
  const svg = d3
    .select($(".fa-map"))
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("role", "img")
    .attr("aria-label", spec.title);

  svg
    .append("g")
    .selectAll("path")
    .data(geo.countries.features)
    .join("path")
    .attr("d", path)
    .attr("fill", theme.land)
    .attr("stroke", theme.border)
    .attr("stroke-width", 0.5);

  const clipId = `fa-clip-${++clipCount}`;
  svg
    .append("clipPath")
    .attr("id", clipId)
    .selectAll("path")
    .data(geo.countries.features)
    .join("path")
    .attr("d", path);
  svg
    .append("g")
    .attr("clip-path", `url(#${clipId})`)
    .selectAll("path")
    .data(geo.disputed.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", theme.land)
    .attr("stroke-width", 0.9)
    .attr("stroke-dasharray", "2 2");

  const outlineLayer = svg.append("g");
  const spikeLayer = svg.append("g");
  const dotLayer = svg.append("g");
  const labelLayer = svg.append("g").attr("class", "fa-labels");
  const noteLayer = svg.append("g").attr("class", "fa-labels");

  // ── layout of one state ─────────────────────────────────────────────────
  function layout(state) {
    const k = state.spikeK ?? SPIKE_K;
    const showTypes = new Set(state.types ?? []);
    const vis = spikes.filter((s) => showTypes.has(s.type.id));

    // spikes dodge sideways among the spikes shown at the same place
    const spikeGroups = d3.group(vis, (s) => s.iso3);
    spikeGroups.forEach((arr, iso3) => {
      const a = anchors.get(iso3);
      arr.sort(
        (p, q) =>
          byOrder(p.actor, q.actor) ||
          p.who.localeCompare(q.who) ||
          typeIndex.get(p.type.id) - typeIndex.get(q.type.id),
      );
      arr.forEach((s, i) => {
        s.x = a.x + (i - (arr.length - 1) / 2) * SPIKE_DX;
        s.y = a.y;
        s.h = s.value * k;
      });
    });

    // base dots in a row, below the spikes where there are any
    const dots = [];
    if (state.bases) {
      d3.group(baseDots, (d) => d.gkey).forEach((arr) => {
        const first = arr[0];
        const a = first.custom ? place(first.lon, first.lat) : anchors.get(first.iso3);
        if (!a) return;
        arr.sort((p, q) => byOrder(p.actor, q.actor));
        const shift = !first.custom && spikeGroups.has(first.iso3) ? DOT_R * 2.6 : 0;
        arr.forEach((d, i) => {
          d.x = a.x + (i - (arr.length - 1) / 2) * DOT_GAP;
          d.y = a.y + shift;
          d.off = a.off;
        });
        dots.push(...arr);
      });
    }
    return { vis, dots, spikeGroups };
  }

  // ── render ──────────────────────────────────────────────────────────────
  let shown = null;

  function render(state, animate) {
    shown = state;
    const t = d3.transition().duration(animate ? theme.duration : 0);
    const { vis, dots, spikeGroups } = layout(state);

    const lit = state.actors?.length ? new Set(state.actors) : null;
    const opacity = (d) => (!lit || lit.has(d.actor) ? 1 : theme.dim);

    drawTiles(state, new Set([...vis.map((v) => v.actor), ...dots.map((v) => v.actor)]));

    $(".fa-subtitle").textContent =
      typeof spec.subtitle === "function" ? spec.subtitle(state) : (spec.subtitle ?? "");

    // outlined countries (e.g. Kenya)
    const outlined = geo.countries.features.filter((f) =>
      (state.outline ?? []).includes(f.properties.iso3),
    );
    outlineLayer
      .selectAll("path")
      .data(outlined, (d) => d.properties.iso3)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", theme.ink)
            .attr("stroke-width", 1.6)
            .attr("opacity", 0),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .transition(t)
      .attr("opacity", 1);

    // spikes
    const tri = (d, h) =>
      `M${d.x - SPIKE_W / 2},${d.y}L${d.x},${d.y - h}L${d.x + SPIKE_W / 2},${d.y}Z`;
    spikeLayer
      .selectAll("path")
      .data(
        [...vis].sort((a, b) => b.value - a.value), // small spikes on top
        (d) => d.key,
      )
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("d", (d) => tri(d, 0))
            .attr("opacity", 0)
            .attr("stroke-width", 1.2)
            .attr("stroke-linejoin", "round")
            .on("pointerenter pointermove", showSpike)
            .on("pointerleave", () => tooltip.style("opacity", 0)),
        (update) => update,
        (exit) =>
          exit
            .transition(t)
            .attr("d", (d) => tri(d, 0))
            .attr("opacity", 0)
            .remove(),
      )
      .attr("fill", spikeFill)
      .attr("fill-opacity", (d) => d.type.fill ?? SPIKE_FILL)
      .attr("stroke", spikeStroke)
      .attr("stroke-dasharray", (d) => d.type.dash ?? null)
      .transition(t)
      .attr("d", (d) => tri(d, d.h))
      .attr("opacity", opacity);

    // base dots
    dotLayer
      .selectAll("circle")
      .data(dots, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", 0)
            .on("pointerenter pointermove", showDot)
            .on("pointerleave", () => tooltip.style("opacity", 0)),
        (update) => update,
        (exit) => exit.transition(t).attr("r", 0).remove(),
      )
      .attr("fill", (d) => (d.light ? theme.land : colorOf(d.actor)))
      .attr("stroke", theme.ink)
      .attr("stroke-width", 0.8)
      .transition(t)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", DOT_R)
      .attr("opacity", opacity);

    // label blocks: country name, then who deployed how many
    const named = new Map(
      (state.labels ?? [])
        .map((l) => (typeof l === "string" ? { iso3: l } : l))
        .map((l) => [l.iso3, l]),
    );
    const valued =
      state.values === "all"
        ? [...spikeGroups.keys()]
        : (state.values ?? []).filter((i) => spikeGroups.has(i));
    valued.forEach((iso3) => {
      if (!named.has(iso3)) named.set(iso3, { iso3 });
    });
    const MAX_LINES = spec.maxLines ?? 6;
    const blocks = [...named.values()]
      .filter((l) => anchors.has(l.iso3))
      .map((l) => {
        const a = anchors.get(l.iso3);
        const group = spikeGroups.get(l.iso3) ?? [];
        const row = dots.filter((p) => p.iso3 === l.iso3 && !p.custom).length;
        const half = (Math.max(group.length * SPIKE_DX, row * DOT_GAP) + SPIKE_W) / 2;
        let lines = valued.includes(l.iso3)
          ? group
              .filter((sp) => !lit || lit.has(sp.actor)) // only what is highlighted
              .sort((p, q) => q.value - p.value)
              .map((sp) => {
                const multi = group.filter((o) => o.who === sp.who).length > 1;
                return `${sp.who}${multi ? ` (${sp.type.short ?? sp.type.id})` : ""} ${sp.estimate ? "~" : ""}${fmt(sp.value)}`;
              })
          : [];
        if (lines.length > MAX_LINES)
          lines = [...lines.slice(0, MAX_LINES - 1), `+ ${lines.length - MAX_LINES + 1} more`];
        const tall = d3.max(group, (sp) => sp.h) ?? 0;
        const end = l.anchor === "end";
        const all = [nameOf(l.iso3), ...lines];
        const x = a.x + (end ? -half - 5 : half + 5) + (l.dx ?? 0);
        const y = a.y - Math.min(tall, 26) + (l.dy ?? 4);
        return {
          iso3: l.iso3,
          lines: all,
          anchor: l.anchor ?? "start",
          x,
          y,
          y0: y,
          gx: a.x + (end ? -half : half),
          gy: a.y - Math.min(tall, 26),
          w: Math.max(...all.map((t) => t.length)) * 5.9,
          h: all.length * 13.8,
        };
      });

    // blocks that would overlap are pushed down; a thin line ties them to their place
    blocks.sort((p, q) => p.y - q.y);
    blocks.forEach((b, i) => {
      const b0 = b.anchor === "end" ? b.x - b.w : b.x;
      for (let j = 0; j < i; j++) {
        const p = blocks[j];
        const p0 = p.anchor === "end" ? p.x - p.w : p.x;
        const overlapX = b0 < p0 + p.w + 4 && b0 + b.w + 4 > p0;
        const gap = b.y - 10 - (p.y - 10 + p.h + 2);
        if (overlapX && gap < 0) b.y -= gap;
      }
    });
    const leaders = blocks.filter((b) => b.y - b.y0 > 6);

    labelLayer
      .selectAll("text.block")
      .data(blocks, (d) => d.iso3)
      .join(
        (enter) => enter.append("text").attr("class", "block").attr("opacity", 0),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .attr("text-anchor", (d) => d.anchor)
      .each(function (d) {
        d3.select(this)
          .selectAll("tspan")
          .data(d.lines)
          .join("tspan")
          .attr("x", d.x)
          .attr("dy", (l, i) => (i ? "1.15em" : 0))
          .attr("font-weight", (l, i) => (i ? 400 : 700))
          .text((l) => l);
      })
      .transition(t)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("opacity", 1);

    noteLayer
      .selectAll("line.lead")
      .data(leaders, (d) => d.iso3)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("class", "lead")
            .attr("stroke", theme.ink)
            .attr("stroke-width", 0.6)
            .attr("opacity", 0),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .attr("x1", (d) => d.gx)
      .attr("y1", (d) => d.gy)
      .attr("x2", (d) => d.x + (d.anchor === "end" ? 3 : -3))
      .attr("y2", (d) => d.y - 3)
      .attr("opacity", 0.7);

    // dot groups outside the drawing: a label with an arrow at the edge
    const offGroups = [];
    d3.group(
      dots.filter((d) => d.off),
      (d) => d.gkey,
    ).forEach((arr) => {
      const label =
        spec.offmap?.[`${arr[0].iso3}|${arr[0].actor}`] ?? nameOf(arr[0].iso3);
      offGroups.push({
        key: arr[0].gkey,
        x: d3.min(arr, (d) => d.x),
        y: arr[0].y,
        label,
      });
    });
    noteLayer
      .selectAll("text.off")
      .data(offGroups, (d) => d.key)
      .join(
        (enter) => enter.append("text").attr("class", "off").attr("opacity", 0),
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      )
      .attr("text-anchor", "end")
      .attr("x", (d) => d.x - DOT_R - 5)
      .attr("y", (d) => d.y + 4)
      .text((d) => `${d.label} →`)
      .transition(t)
      .attr("opacity", 1);

    // notes with a leader line
    const notes = (state.notes ?? []).filter((n) => anchors.has(n.iso3));
    const noteSel = noteLayer
      .selectAll("g.note")
      .data(notes, (d) => d.iso3)
      .join(
        (enter) => {
          const g = enter.append("g").attr("class", "note").attr("opacity", 0);
          g.append("line").attr("stroke", theme.ink).attr("stroke-width", 0.75);
          g.append("text");
          return g;
        },
        (update) => update,
        (exit) => exit.transition(t).attr("opacity", 0).remove(),
      );
    noteSel.each(function (d) {
      const a = anchors.get(d.iso3);
      const g = d3.select(this);
      const tx = a.x + (d.dx ?? 20);
      const ty = a.y + (d.dy ?? 26);
      g.select("line")
        .attr("x1", a.x)
        .attr("y1", a.y)
        .attr("x2", tx - 2)
        .attr("y2", ty - 4);
      g.select("text")
        .attr("x", tx)
        .attr("y", ty)
        .selectAll("tspan")
        .data(d.lines)
        .join("tspan")
        .attr("x", tx)
        .attr("dy", (l, i) => (i ? "1.15em" : 0))
        .attr("font-weight", (l, i) => (i ? 400 : 700))
        .text((l) => l);
    });
    noteSel.transition(t).attr("opacity", 1);

    renderKey(state);
  }

  // ── tooltips ────────────────────────────────────────────────────────────
  function tip(event, html) {
    const box = el.getBoundingClientRect();
    tooltip
      .html(html)
      .style("opacity", 1)
      .style("left", `${Math.min(event.clientX - box.left + 12, box.width - 200)}px`)
      .style("top", `${event.clientY - box.top + 12}px`);
  }

  function showSpike(event, d) {
    // breakdown by member state (EU) and mission
    const lines = [
      ...d3.rollup(
        d.parts,
        (v) => d3.sum(v, (x) => x.n),
        (x) => [d.actor === "EU" ? x.actor : "", x.mission].filter(Boolean).join(" · "),
      ),
    ]
      .slice(0, 8)
      .map(([k, v]) => `${k}: ${fmt(v)}`);
    tip(
      event,
      `<strong>${d.who} in ${nameOf(d.iso3)}</strong><br>${d.type.label}: ${d.estimate ? "about " : ""}${fmt(d.value)} personnel` +
        (lines.length > 1 || d.parts[0].mission ? `<br>${lines.join("<br>")}` : ""),
    );
  }

  function showDot(event, d) {
    const who = actorLabel.get(d.actor) ?? d.actor;
    tip(
      event,
      `<strong>${nameOf(d.iso3)}</strong><br>${d.member === who ? who : `${d.member} (${who})`}: base`,
    );
  }

  // ── key ─────────────────────────────────────────────────────────────────
  const mapScale = () => svg.node().getScreenCTM()?.a || 1;

  function renderKey(state) {
    for (let i = 0; i < 6; i++) {
      const k = mapScale();
      drawKey(state, k);
      if (Math.abs(mapScale() - k) / k < 0.002) break;
    }
  }

  function drawKey(state, k) {
    const key = d3.select($(".fa-key")).style("flex-wrap", "wrap");
    key.selectAll("*").remove();

    if (state.bases)
      key
        .append("span")
        .attr("class", "fa-key-item")
        .html(
          `<svg width="${DOT_R * 2 * k + 2}" height="${DOT_R * 2 * k + 2}" aria-hidden="true"><circle cx="${DOT_R * k + 1}" cy="${DOT_R * k + 1}" r="${DOT_R * k}" fill="${theme.light}" stroke="${theme.ink}" stroke-width="0.8"/></svg>${spec.keyBases ?? "Military base (colour: actor)"}`,
        );

    spec.types
      .filter((tp) => (state.types ?? []).includes(tp.id))
      .forEach((tp) => {
        const c = byType ? tp.color : theme.grey; // by actor: the key shows the type style only
        key
          .append("span")
          .attr("class", "fa-key-item")
          .html(
            `<svg width="${SPIKE_W * k + 4}" height="14" aria-hidden="true"><path d="M2,13L${2 + (SPIKE_W * k) / 2},2L${2 + SPIKE_W * k},13Z" fill="${c}" fill-opacity="${tp.fill ?? SPIKE_FILL}" stroke="${c}" stroke-width="1.2" stroke-linejoin="round"${tp.dash ? ` stroke-dasharray="${tp.dash}"` : ""}/></svg>${tp.label}`,
          );
      });

    // height scale: a spike as tall as the reference figure
    if ((state.types ?? []).length) {
      const ref = state.keyRef ?? spec.keyRef ?? 1000;
      const h = ref * (state.spikeK ?? SPIKE_K) * k;
      key
        .append("span")
        .attr("class", "fa-key-item")
        .html(
          `<svg width="${SPIKE_W * k + 4}" height="${h + 3}" aria-hidden="true"><path d="M2,${h + 2}L${2 + (SPIKE_W * k) / 2},2L${2 + SPIKE_W * k},${h + 2}Z" fill="none" stroke="${theme.grey}" stroke-width="1"/></svg>${fmt(ref)} personnel`,
        );
    }

    if (state.footnote)
      key
        .append("div")
        .style("flex-basis", "100%")
        .style("font-size", "0.85em")
        .style("color", theme.muted)
        .text(state.footnote);
  }

  // the key is drawn in pixels, the map in map units: redraw the key when the map is resized
  new ResizeObserver(() => {
    if (shown) renderKey(shown);
  }).observe($(".fa-map"));

  return {
    el,
    update(state, { animate = true } = {}) {
      render(state, animate);
    },
  };
}
