// print-all.mjs: saves every page of "Levers of influence" as an A4 PDF with
// all its charts, then merges them into one file in reading order:
// landing page, Africa chapters, Middle East chapters, methodology.
//
//   cd tools/print
//   npm install                        (once: playwright + pdf-lib)
//   npx playwright install chromium    (once)
//   node print-all.mjs                 -> pdf/NN_*.pdf + pdf/levers-of-influence.pdf
//   node print-all.mjs trade           only pages whose name contains "trade", no merge
//
// Each page is opened with ?print (js/main.js, js/landing_scrolly.js: one chart
// per step, right after its text) from a small web server on 127.0.0.1, so the
// page list and file names come from js/chapters.js, as on the dev site.
// Needs internet for d3 (jsdelivr) and the fonts (Google Fonts).

import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(WEB, "pdf");
const MERGED = "levers-of-influence.pdf";
const filter = process.argv[2];

// A4 minus the 15 mm margins of @page in fa.css, in CSS pixels: the charts are
// built at the width they will have on paper
const PAGE_W = Math.round((180 / 25.4) * 96); // 680

// ── static web server for the web/ folder ────────────────────────────────────
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json",
  ".geojson": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function serve() {
  const server = http.createServer(async (req, res) => {
    const file = path.join(WEB, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!file.startsWith(WEB)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, {
        "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// ── one page -> one PDF ──────────────────────────────────────────────────────
async function printPage(context, root, { name, href }) {
  const page = await context.newPage();
  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("requestfailed", (r) => problems.push(`failed to load ${r.url()}`));

  // print media before the scripts run, so charts measure their print layout
  await page.emulateMedia({ media: "print" });
  await page.goto(`${root}/${href}?print`, { waitUntil: "networkidle", timeout: 120_000 });

  // every scrolly has built its charts (data-fa-status set by main.js / landing_scrolly.js)
  await page.waitForFunction(
    () => [...document.querySelectorAll(".fa-scrolly")].every((r) => r.dataset.faStatus),
    null,
    { timeout: 120_000 },
  );
  // landing page: the overview map (landing.js)
  await page.waitForFunction(
    () => [...document.querySelectorAll(".fa-overview")].every((o) => o.querySelector("svg")),
    null,
    { timeout: 60_000 },
  );
  await page.evaluate(() => document.fonts.ready);
  // zero-length d3 transitions and ResizeObservers finish on the next frames
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 500)))),
  );

  const failed = await page.$$eval(".fa-scrolly[data-fa-status='failed']", (n) => n.length);
  const charts = await page.$$eval(".fa-print .fa-chart", (n) => n.length);
  const file = path.join(OUT, `${name}.pdf`);
  await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
  await page.close();

  console.log(`${name}.pdf  (${charts} charts)`);
  if (failed) problems.unshift(`${failed} scrollytelling block(s) failed to build`);
  for (const p of problems) console.warn(`  ! ${p}`);
  return file;
}

// ── main ─────────────────────────────────────────────────────────────────────
const server = await serve();
const root = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: PAGE_W, height: 1000 } });

try {
  // reading order from js/chapters.js (evaluated in the browser: it reads location)
  const probe = await context.newPage();
  await probe.goto(`${root}/js/chapters.js`);
  const pages = await probe.evaluate(async () => {
    const c = await import("/js/chapters.js");
    const list = [{ key: "landing", href: c.pageHref("landing") }];
    for (const region of Object.keys(c.REGION_NAV))
      for (const id of c.ORDER[region] ?? [])
        list.push({ key: `${region}_${id}`, href: c.chapterHref(region, id) });
    list.push({ key: "methodology", href: c.pageHref("methodology") });
    return list;
  });
  await probe.close();

  // file names carry the reading order: 00_landing, 01_AF_dipl ... 13_methodology
  const todo = pages
    .map((p, i) => ({ ...p, name: `${String(i).padStart(2, "0")}_${p.key}` }))
    .filter((p) => !filter || p.name.includes(filter));

  await mkdir(OUT, { recursive: true });
  const files = [];
  for (const p of todo) files.push(await printPage(context, root, p));

  if (!filter) {
    const merged = await PDFDocument.create();
    for (const f of files) {
      const src = await PDFDocument.load(await readFile(f));
      for (const pg of await merged.copyPages(src, src.getPageIndices())) merged.addPage(pg);
    }
    await writeFile(path.join(OUT, MERGED), await merged.save());
    console.log(`${MERGED}  (${merged.getPageCount()} pages)`);
  }
} finally {
  await browser.close();
  server.close();
}
