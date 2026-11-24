// Runs inside R's V8 after the chapter configs are loaded into CFG[name].
var ACTOR = {
  all: "All actors", EU: "EU", USA: "US", US: "US", CHN: "China", RUS: "Russia", TUR: "Türkiye",
  IND: "India", JPN: "Japan", KOR: "South Korea", ARE: "UAE", SAU: "Saudi Arabia", QAT: "Qatar",
  IRN: "Iran", ISR: "Israel", GCC: "Gulf", KWT: "Kuwait", OMN: "Oman", BHR: "Bahrain", EGY: "Egypt",
};

function isFn(v) { return typeof v === "function"; }
function usesInfoTotal(fn) { return isFn(fn) && /info\.total/.test(fn.toString()); }

function call(fn, args) {
  try { return fn.apply(null, args); } catch (e) { return "[computed at runtime: " + e.message + "]"; }
}

function actorLabel(spec, a) {
  if (Array.isArray(a)) a = a[0];
  if (spec.labels && spec.labels[a]) return spec.labels[a];
  if (spec.allLabel && a === "all") return spec.allLabel;
  var x = (spec.extraTiles || []).find(function (t) { return t.actor === a; });
  if (x) return x.label;
  return ACTOR[a] || a;
}

// chart modules that ignore state.title / state.subtitle (they always draw spec text)
var FIXED_TITLE = { dotMap: 1, milMap: 1, sankey: 1, stackedCols: 1, rangeChart: 1, tileGrid: 1, flowBars: 1 };
var FIXED_SUB = { milMap: 1, sankey: 1, stackedCols: 1, rangeChart: 1, tileGrid: 1, flowBars: 1 };

// tileGrid.js default periods (used when the spec has none)
var TILE_PERIODS = {
  all: { label: "2016–2026" },
  1621: { label: "2016–2021" },
  2226: { label: "2022–2026" },
};

function resolveTileGrid(spec, state) {
  var ms = [].concat(state.measure), ps = [].concat(state.period || "all");
  var n = Math.max(ms.length, ps.length), subs = [];
  for (var i = 0; i < n; i++) {
    var m = spec.measures[ms[Math.min(i, ms.length - 1)]];
    var p = (spec.periods || TILE_PERIODS)[ps[Math.min(i, ps.length - 1)]];
    var s = m ? m.subtitle + ", " + (p ? p.label : "?") : "[unknown measure]";
    if (subs.indexOf(s) < 0) subs.push(s);
  }
  return {
    title: spec.title || "",
    subtitle: subs.join("  →  then: "),
    source: spec.source || "",
    footnote: state.footnote || "",
    note: n > 1 ? "step animates through " + n + " frames" : "",
  };
}

function resolve(spec, state) {
  state = state || {};
  if (spec.type === "tileGrid" && state.measure != null) return resolveTileGrid(spec, state);
  var ignored = [];
  if (FIXED_TITLE[spec.type] && state.title != null) { ignored.push("state.title"); state = Object.assign({}, state); delete state.title; }
  if (FIXED_SUB[spec.type] && state.subtitle != null) { ignored.push("state.subtitle"); state = Object.assign({}, state); delete state.subtitle; }
  var info = { total: [NaN, NaN] };
  var note = ignored.length ? ["IGNORED by the chart module: " + ignored.join(", ")] : [];
  var title, subtitle, sub;

  // title
  var ms = null;
  if (spec.measures) {
    var m = state.measure || spec.defaultMeasure || Object.keys(spec.measures)[0];
    ms = spec.measures[m] || null;
  }
  title = state.title != null ? state.title : (ms && ms.title) || spec.title;
  if (isFn(title)) title = call(title, [state, info]);

  // subtitle
  if (state.subtitle != null) sub = state.subtitle;
  else if (spec.type === "dotMap") sub = state.actor === "all" ? spec.subtitleAll : spec.subtitleActor;
  else if (ms && ms.subtitle) sub = ms.subtitle;
  else sub = spec.subtitle;

  if (isFn(sub)) {
    if (spec.type === "sankey") {
      var p = spec.periods[state.period || spec.defaultPeriod || "all"];
      subtitle = call(sub, [state, p ? p.label : ""]);
    } else if (ms && sub === ms.subtitle) {
      var a = state.actor != null ? state.actor : "all";
      subtitle = call(sub, [a, state.actorLabel || actorLabel(spec, a)]);
    } else {
      subtitle = call(sub, [state, info]);
      if (usesInfoTotal(sub) && call(sub, [state, { total: [1, 2] }]) !== subtitle)
        subtitle += " [+ totals computed from the data]";
    }
  } else subtitle = sub;

  return {
    title: title || "",
    subtitle: subtitle || "",
    source: (state.source != null ? state.source : spec.source) || "",
    footnote: state.footnote || "",
    note: note.join("; "),
  };
}

// chart-level labels shown on screen (legend, panels, keys, units, row labels)
var TEXT_KEY = /^(label|short|title|subtitle|subtitleAll|subtitleActor|unit|tipLabel|sizeTitle|allLabel|keySize|keyBases|keyLight|keyLabel|keyLast|keyNext|keyPostponed|actorsLabel|partLabel|restLabel|totalLabel|greyLabel|other\w*|note|text|caption|yLabel|xLabel|axisLabel|xTitle|yTitle|xShort|yShort)$/;
var MAP_KEY = /^(rowLabels|labels|geoLabels|geoLabelsShort|extraActors|colLabels|seriesLabels|binLabels|shortNames|supplierLabels|countryLabels|names|offmap)$/;
var SKIP_KEY = /^(type|data|sub|mode|rowKey|column|color|colors|rowColors|actorColors|actor|id|format|where|prepare|domain|rows|measure|geo|geos)$/;

function chartLabels(spec) {
  var out = [];
  var seen = {};
  function add(path, v) {
    var s = String(v).replace(/\n/g, " ");
    var k = path + "|" + s;
    if (!seen[k] && s.trim()) { seen[k] = 1; out.push([path, s]); }
  }
  function walk(v, path, key) {
    if (v == null) return;
    if (typeof v === "string") { if (TEXT_KEY.test(key)) add(path, v); return; }
    if (isFn(v)) {
      if (TEXT_KEY.test(key)) add(path, "[varies; template] " + v.toString().replace(/\s+/g, " "));
      return;
    }
    if (Array.isArray(v)) {
      if (MAP_KEY.test(key)) { v.forEach(function (x) { if (typeof x === "string") add(path, x); }); return; }
      v.forEach(function (x, i) { walk(x, path + "[" + i + "]", key); });
      return;
    }
    if (typeof v === "object") {
      Object.keys(v).forEach(function (k) {
        if (SKIP_KEY.test(k) && !TEXT_KEY.test(k)) return;
        if (MAP_KEY.test(k) && v[k] && typeof v[k] === "object" && !Array.isArray(v[k])) {
          Object.keys(v[k]).forEach(function (kk) {
            if (typeof v[k][kk] === "string") add(path + "." + k + "." + kk, v[k][kk]);
          });
          return;
        }
        walk(v[k], path ? path + "." + k : k, k);
      });
    }
  }
  walk(spec, "", "");
  return out;
}

// step-state text other than title / subtitle / footnote (annotations, notes, labels with text)
function stateExtras(state) {
  var out = [];
  function walk(v, path, key) {
    if (v == null) return;
    if (typeof v === "string") {
      if (/^(text|note|label|caption|annotation|title)$/.test(key) && path.indexOf(".") >= 0) out.push(path + ": " + v);
      return;
    }
    if (Array.isArray(v)) { v.forEach(function (x, i) { walk(x, path + "[" + i + "]", key); }); return; }
    if (typeof v === "object") Object.keys(v).forEach(function (k) { walk(v[k], path + "." + k, k); });
  }
  Object.keys(state || {}).forEach(function (k) {
    if (k === "title" || k === "subtitle" || k === "footnote" || k === "source") return;
    var v = state[k];
    if (k === "notes" || k === "annotations" || k === "callouts") walk(v, k, k);
    else if (v && typeof v === "object") walk(v, k, k);
  });
  return out;
}

function extractChapter(name) {
  var cfg = CFG[name];
  var charts = Object.keys(cfg.charts || {}).map(function (id) {
    var spec = cfg.charts[id];
    return { id: id, type: spec.type || "", def: resolve(spec, {}), labels: chartLabels(spec) };
  });
  var steps = Object.keys(cfg.steps || {}).map(function (sid) {
    var st = cfg.steps[sid];
    var spec = cfg.charts[st.chart];
    var r = spec ? resolve(spec, st.state || {}) : { title: "", subtitle: "", source: "", footnote: "", note: "chart not found" };
    r.step = sid; r.chart = st.chart; r.extras = stateExtras(st.state);
    return r;
  });
  return { name: name, charts: charts, steps: steps };
}

function extractLanding() {
  var L = CFG.landing;
  var steps = Object.keys(L.steps).map(function (sid) {
    var ls = L.steps[sid];
    var ch = CFG[ls.chapter];
    var base = ch.steps[ls.step];
    if (!base) return { step: sid, chart: ls.chapter + " / " + ls.step, title: "", subtitle: "", source: "", footnote: "", note: "MISSING: step '" + ls.step + "' not found in " + ls.chapter, extras: [] };
    var state = Object.assign({}, base.state || {}, ls.override || {});
    if (state.footnote) state.footnote = state.footnote.replace(/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+\s*/, "");
    var r = resolve(ch.charts[base.chart], state);
    r.step = sid; r.chart = ls.chapter + " / " + ls.step + " (" + base.chart + ")"; r.extras = [];
    return r;
  });
  return { name: "landing", charts: [], steps: steps };
}
