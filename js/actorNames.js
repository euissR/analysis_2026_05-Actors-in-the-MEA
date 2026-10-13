// actorNames.js: sets an actor's name in bold and in the actor's colour in the step text,
// at its first mention in the step, when the step's chart highlights that actor.
//
// Used by main.js:   colourActorNames(steps, chapter, base.actors);
//
// Only the names in actors.csv are matched (plus the aliases below), not adjectives
// ("Russian") and not countries that are not actors. To keep a word plain where it
// means something else, wrap it in the text: <span class="fa-plain">Gulf</span>

import { theme } from "./theme.js";

// colour used for the name in the text where the actor colour is too light to read on white
// (darker shades of the same colours; the charts keep theme.actorColors)
const TEXT_COLOURS = {
  TUR: "#c26a0f", // lightorange, darkened
  IRN: "#4f8f4a", // mint, darkened
  IND: "#a98300", // egg, darkened
  KOR: "#14968f", // aqua, darkened
};

// other spellings of an actor, as written in the text or in a step's state
const ALIASES = {
  USA: ["United States"],
  ARE: ["United Arab Emirates"],
  EU: ["European Union", "EU27"],
  GCC: ["GCC"],
};

// which part of a step's state names the actors it highlights, per chart type
// (chart types not listed here are left alone)
const ACTOR_KEYS = {
  dotMap: (s) => s.actor,
  milMap: (s) => s.actors,
  rangeChart: (s) => s.highlight,
  periodRange: (s) => s.highlight ?? s.actors,
  stackedCols: (s) => s.highlight ?? s.only,
  sankey: (s) => s.highlight,
  panelBars: (s) => s.highlight,
  bubble: (s) => s.highlight,
  geoBubbles: (s) => s.actor, // its highlight is a list of countries
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function colourActorNames(steps, chapter, actors) {
  // every written form of an actor -> its code
  const forms = new Map();
  for (const a of actors) {
    for (const f of [a.label, ...(ALIASES[a.actor] ?? [])])
      forms.set(f, a.actor);
  }
  const codeOf = (v) => {
    if (v && typeof v === "object") v = v.from; // sankey: { from, to }
    if (typeof v !== "string") return null;
    if (theme.actorColors[v]) return v;
    for (const [f, code] of forms)
      if (f.toLowerCase() === v.toLowerCase()) return code;
    return null;
  };
  const colourOf = (code) => TEXT_COLOURS[code] ?? theme.actorColors[code];

  for (const step of steps) {
    const cfg = chapter.steps[step.dataset.step];
    const chartType = chapter.charts[cfg?.chart]?.type;
    const pick = ACTOR_KEYS[chartType]?.(cfg.state ?? {});
    const codes = new Set(
      [pick]
        .flat()
        .map(codeOf)
        .filter((c) => c && colourOf(c)),
    );
    if (!codes.size) continue;

    // forms of the highlighted actors only, longest first
    const mine = [...forms]
      .filter(([, code]) => codes.has(code))
      .sort((a, b) => b[0].length - a[0].length);
    if (!mine.length) continue; // an actor without a written name in actors.csv (EIB, France): nothing to colour
    const re = new RegExp(
      `(?<![\\p{L}\\p{N}])(${mine.map(([f]) => escapeRe(f)).join("|")})(?![\\p{L}\\p{N}])`,
      "gu",
    );

    // wrap the first mention of each actor in the step (other markup, e.g. <sup>, stays)
    const done = new Set();
    const walker = document.createTreeWalker(step, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (node.parentElement.closest(".fa-plain")) continue;
      const hits = [...node.nodeValue.matchAll(re)].filter((h) => {
        const code = forms.get(h[0]);
        if (done.has(code)) return false;
        done.add(code);
        return true;
      });
      if (!hits.length) continue;
      const frag = document.createDocumentFragment();
      let last = 0;
      for (const hit of hits) {
        frag.append(node.nodeValue.slice(last, hit.index));
        const b = document.createElement("b");
        b.className = "fa-actor";
        b.style.color = colourOf(forms.get(hit[0]));
        b.style.fontWeight = "700";
        b.textContent = hit[0];
        frag.append(b);
        last = hit.index + hit[0].length;
      }
      frag.append(node.nodeValue.slice(last));
      node.replaceWith(frag);
    }
  }
}
