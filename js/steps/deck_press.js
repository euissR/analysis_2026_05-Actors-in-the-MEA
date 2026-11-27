// deck_press.js: the short deck for the press (page: index_slides_press.html).
// Same format as deck.js, which see for the fields. The title slide, the overview and the chapter
// slides come by themselves (INTRO is the one in deck.js); the overview and the contents list only
// the sections that have slides here. Slides keep their place in the order listed.
//
// The numbers in the comments are the slide numbers of the full deck (deck.js) they were picked by.
export { INTRO } from "./deck.js";

export default {
  // ── Talking power ─────────────────────────────────────────────────────────
  dipl: [
    { chapter: "AF_dipl", step: "vis_eu" }, // 4
    { chapter: "ME_dipl", step: "vis_usa" }, // 6
  ],

  // ── Shaping perceptions ───────────────────────────────────────────────────
  soft: [
    { chapter: "AF_soft", step: "pc_intro" }, // 34
    { chapter: "ME_soft", step: "pc_law" }, // 36
  ],

  // ── Securing interests ────────────────────────────────────────────────────
  mil: [
    { chapter: "AF_mil", step: "ex_all" }, // 87
    { chapter: "ME_mil", step: "ex_naval" }, // 91
  ],
};
