// hover.js: shared hover behaviour for every chart.
//   1. marks the hovered data point (dark outline, see .fa-hover in fa.css)
//   2. snaps the tooltip to the centre of that point instead of following the mouse
//
//   const hover = makeHover(el, tooltip);        // once per chart
//   ...                                          // in the handler, after tooltip.html(...)
//   tooltip.html(...).style("opacity", 1);
//   hover.enter(event);                          // marks event.currentTarget, places the tooltip
//   .on("pointerleave", hover.leave);            // clears the mark, hides the tooltip
//
// Options for hover.enter(event, { ... }):
//   mark    element(s) to outline            default: event.currentTarget
//   anchor  element(s) the tooltip snaps to  default: same as mark
//   follow  true = follow the mouse instead (long shapes such as sankey ribbons)
//   soft    true = darken instead of outlining (ribbons)
//   raise   true = bring the marked element to the front so its outline is not covered
//           (only for charts whose shapes do not overlap)

export function makeHover(el, tooltip) {
  let marked = [];

  const list = (x) => (x == null ? [] : x instanceof Element ? [x] : Array.from(x));

  function clear() {
    marked.forEach((n) => n.classList.remove("fa-hover", "fa-hover-soft"));
    marked = [];
  }

  function place(event, anchors, follow) {
    const box = el.getBoundingClientRect();
    const tip = tooltip.node();
    tooltip.style("left", "0px"); // measure at full width, not squeezed by the right edge
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;

    let cx = event.clientX;
    let cy = event.clientY;
    let dx = 12;
    let dy = 12;
    if (!follow && anchors.length) {
      const r = anchors.map((n) => n.getBoundingClientRect());
      const x0 = Math.min(...r.map((b) => b.left));
      const x1 = Math.max(...r.map((b) => b.right));
      const y0 = Math.min(...r.map((b) => b.top));
      const y1 = Math.max(...r.map((b) => b.bottom));
      cx = (x0 + x1) / 2;
      cy = (y0 + y1) / 2;
      // clear the point itself: half its size (max 14px) plus a little air
      dx = Math.min((x1 - x0) / 2, 14) + 6;
      dy = Math.min((y1 - y0) / 2, 14) + 6;
    }

    let left = cx - box.left + dx;
    let top = cy - box.top + dy;
    if (left + tw > box.width) left = cx - box.left - dx - tw; // flip to the left
    if (top + th > box.height) top = cy - box.top - dy - th; // flip above
    tooltip.style("left", `${Math.max(0, left)}px`).style("top", `${Math.max(0, top)}px`);
  }

  function enter(event, { mark = event.currentTarget, anchor = mark, follow = false, soft = false, raise = false } = {}) {
    const m = list(mark);
    if (m.length !== marked.length || m.some((n, i) => n !== marked[i])) {
      clear();
      m.forEach((n) => {
        n.classList.add(soft ? "fa-hover-soft" : "fa-hover");
        if (raise && n.parentNode && n.parentNode.lastChild !== n) n.parentNode.appendChild(n);
      });
      marked = m;
    }
    place(event, list(anchor), follow);
  }

  function leave() {
    clear();
    tooltip.style("opacity", 0);
  }

  return { enter, leave };
}
