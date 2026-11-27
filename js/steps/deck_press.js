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

  // ── Competing for markets ─────────────────────────────────────────────────
  trade: [
    {
      chapter: "AF_trade",
      step: "bal_na_regions",
      override: { highlight: [] },
    }, // 40
    { chapter: "ME_trade", step: "tra_hi" }, // 49
  ],

  // ── Financing influence ───────────────────────────────────────────────────
  invest: [
    { chapter: "AF_invest", step: "fdi_conc", override: { highlight: [] } }, // 59
    {
      chapter: "ME_invest",
      step: "debt_terms_others",
      override: { highlight: [] },
    }, // not in the full deck
  ],

  // ── Anchoring ties ────────────────────────────────────────────────────────
  infra: [
    // the two Middle East slides sit next to each other
    { chapter: "AF_infra", step: "ppi_contrast", override: { highlight: [] } }, // not in the full deck; Türkiye with the works-award dots
    { chapter: "ME_infra", step: "pro_works", override: { highlight: [] } }, // not in the full deck; Türkiye with the works-award dots
    { chapter: "ME_infra", step: "ppi_gulf", override: { highlight: [] } }, // not in the full deck (it has ppi_vintage)
  ],

  // ── Securing interests ────────────────────────────────────────────────────
  mil: [
    { chapter: "AF_mil", step: "ex_all" }, // 87
    { chapter: "ME_mil", step: "ex_naval" }, // 91
  ],
};
