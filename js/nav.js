// nav.js: navigation between the landing page, chapters and notes.
// Loaded by main.js (chapter pages), landing.js (landing page) and a script
// tag on the methodology page. Everything it does is optional and keyed off
// markup it finds on the page:
//   <div class="fa-crumb" data-region="AF"></div>           link back to the landing page (top of page)
//   <div class="fa-nav" data-region="AF" data-chapter="dipl"></div>   previous | all chapters | next (end of page)
//   <div class="fa-nav" data-page="methodology"></div>  same bar on a page that is not a chapter
//   <div class="fa-card" data-region data-chapter>      landing card: link, number, title filled from chapters.js
//   <a data-page="methodology">                         link filled from chapters.js
// A back-to-top button is added on every page.
import { CHAPTERS, ORDER, PAGES, REGION_NAV, TITLE, chapterHref, pageHref } from "./chapters.js";

function btn(cls, href, label, title) {
  const a = document.createElement("a");
  a.className = `fa-nav-btn ${cls}`;
  a.href = href;
  if (label) {
    const l = document.createElement("span");
    l.className = "fa-nav-label";
    l.textContent = label;
    a.append(l);
  }
  const t = document.createElement("span");
  t.className = "fa-nav-title";
  t.textContent = title;
  a.append(t);
  return a;
}

// ── top of page: Levers of influence / Africa ───────────────────────────────
function crumb(el) {
  el.classList.add("fa-crumb");
  const a = document.createElement("a");
  a.href = pageHref("landing");
  a.textContent = TITLE;
  el.append(a);
  const region = REGION_NAV[el.dataset.region];
  if (region) el.append(` / ${region.name}`);
}

// ── end of page: previous | all chapters | next ─────────────────────────────
function bar(el) {
  el.classList.add("fa-nav");
  el.setAttribute("role", "navigation");
  el.setAttribute("aria-label", "Chapter navigation");

  const { region, chapter, page } = el.dataset;
  let prev = null;
  let next = null;

  if (!page) {
    const order = ORDER[region];
    const i = order ? order.indexOf(chapter) : -1;
    if (i < 0) return console.warn(`nav: ${region}_${chapter} is not in ORDER`);
    if (i > 0) {
      const id = order[i - 1];
      prev = btn("fa-nav-prev", chapterHref(region, id), "Previous", CHAPTERS[id].title);
    }
    if (i < order.length - 1) {
      const id = order[i + 1];
      next = btn("fa-nav-next", chapterHref(region, id), "Next", CHAPTERS[id].title);
    } else {
      // after the last chapter comes the methodology note
      next = btn("fa-nav-next", pageHref("methodology"), "Next", PAGES.methodology.title);
    }
  }

  if (prev) el.append(prev);
  el.append(btn("fa-nav-home", pageHref("landing", "#chapters"), "", PAGES.landing.title));
  if (next) el.append(next);
}

// ── landing page cards ──────────────────────────────────────────────────────
function cards() {
  document.querySelectorAll(".fa-card[data-chapter]").forEach((card) => {
    const { region, chapter } = card.dataset;
    const i = ORDER[region] ? ORDER[region].indexOf(chapter) : -1;
    if (i < 0) {
      card.style.display = "none"; // not live yet
      return;
    }
    const c = CHAPTERS[chapter];
    card.querySelector(".fa-card-link").href = chapterHref(region, chapter);
    card.querySelector(".fa-card-number").textContent = i + 1;
    card.querySelector(".fa-card-title").textContent = c.title;
    card.querySelector(".fa-card-subtitle").textContent = c.subtitle;
  });
  document.querySelectorAll("a[data-page]").forEach((a) => {
    a.href = pageHref(a.dataset.page);
  });
}

// ── back to top ─────────────────────────────────────────────────────────────
function top() {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "fa-top";
  b.textContent = "↑";
  b.setAttribute("aria-label", "Back to top");
  b.hidden = true;
  b.addEventListener("click", () => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  });
  document.body.append(b);

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      b.hidden = window.scrollY < window.innerHeight;
    });
  }, { passive: true });
}

document.querySelectorAll(".fa-crumb").forEach(crumb);
document.querySelectorAll(".fa-nav").forEach(bar);
cards();
top();
