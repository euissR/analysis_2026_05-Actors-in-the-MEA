// wrapLabel.js: wrap an SVG <text> label onto several lines when it is wider than maxW.
//
// The text must already be set (selection.text(...)). Lines are broken at spaces; the last line
// stays at the text's y, earlier lines move up by lineH (em, so it follows the font scale), so a
// wrapped panel header grows upwards and does not run into the gridlines or tick labels below it.
// Labels that fit are left as they are.
//
//   wrapLabel(sel, maxW, { lineH: 1.15 })

const CHAR_W = 0.58; // average glyph width as a share of the font size, when the label cannot be measured

export function wrapLabel(sel, maxW, { lineH = 1.15 } = {}) {
  sel.each(function () {
    const node = this;
    const full = node.textContent ?? "";
    const words = full.split(/\s+/).filter(Boolean);
    if (words.length < 2) return;

    // measured width (user units); a hidden chart measures 0, then estimate from the font size
    let width = node.getComputedTextLength?.() ?? 0;
    if (!width) {
      const fs = parseFloat(getComputedStyle(node).fontSize) || 13;
      width = full.length * fs * CHAR_W;
    }
    if (width <= maxW) return;
    const perChar = width / full.length;

    // greedy: fill each line up to maxW
    const lines = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (line && next.length * perChar > maxW) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    lines.push(line);
    if (lines.length < 2) return;

    const x = node.getAttribute("x") ?? 0;
    node.textContent = "";
    lines.forEach((l, i) => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      t.setAttribute("x", x);
      t.setAttribute("dy", `${i === 0 ? -(lines.length - 1) * lineH : lineH}em`);
      t.textContent = l;
      node.appendChild(t);
    });
  });
  return sel;
}
