// deck.js: the slide deck. No charts of its own: each slide points at a step of a chapter,
// so edits to the chapter's chart or state carry over here (same idea as landing.js).
// Read by js/slides.js.
//
// One list per chapter id (dipl, soft, trade, invest, infra, mil). The sections appear in the
// order of ORDER in chapters.js; the slides inside a section appear in the order listed here.
// A section with an empty list is left out of the contents.
//
// slide:
//   chapter:  "AF_dipl", "ME_trade", ... (the file js/steps/{chapter}.js)
//   step:     step id in that file
//   override: optional, merged over the step's state (same as landing.js; use sparingly), e.g.
//             override: { highlight: ["CHN"], footnote: "" }
//
// Order inside a section follows the Word document: Africa, then Middle East and the Gulf,
// topic by topic.
//
// Lines starting with "// [actors]" are the steps that "scroll through different actors" on
// the same chart in the page. They are off: remove the two slashes to add them as slides.

// The two opening slides: a title slide on a full-page picture, then the overview of the sections
// (number, title, subtitle and picture of each, as the theme cards on the landing page).
// Images are looked up under BASE_URL, like the data.
export const INTRO = {
  title: "Levers of influence",
  subtitle:
    "Mapping international engagement across Africa, the Middle East and the Gulf",
  hero: "src/hero.jpg",
  // section id -> picture on the overview slide
  images: {
    dipl: "src/dip.jpg",
    soft: "src/sop.jpg",
    trade: "src/trade.jpg",
    invest: "src/invest.jpg",
    infra: "src/infra.jpg",
    mil: "src/sec.jpg",
  },
};

export default {
  // ── Talking power ─────────────────────────────────────────────────────────
  dipl: [
    // high-level visits
    { chapter: "AF_dipl", step: "vis_eu" },
    { chapter: "AF_dipl", step: "vis_chn" },
    { chapter: "ME_dipl", step: "vis_usa" },
    // summits
    { chapter: "AF_dipl", step: "sum_intro" },
    { chapter: "ME_dipl", step: "sum_intro" },
    // formal partnerships
    { chapter: "AF_dipl", step: "lab_intro" },
    { chapter: "AF_dipl", step: "lab_chn" },
    { chapter: "AF_dipl", step: "lab_eu" },
    { chapter: "AF_dipl", step: "lab_uae" },
    { chapter: "ME_dipl", step: "lab_intro" },
    // voting on Ukraine (the screenshot shows the 2022–26 tab; the step is "all": check)
    { chapter: "AF_dipl", step: "unga_ukr_ru_lean" },
    { chapter: "ME_dipl", step: "unga_ukr_chn_ind_abs" },
    // voting on the territories occupied by Israel
    { chapter: "AF_dipl", step: "unga_ter_shift" },
    { chapter: "ME_dipl", step: "unga_ter_eu" },
  ],

  // ── Shaping perceptions ───────────────────────────────────────────────────
  soft: [
    // development agencies
    { chapter: "AF_soft", step: "n_ms" },
    { chapter: "AF_soft", step: "n_are" },
    { chapter: "ME_soft", step: "d_all" },
    // cultural cooperation and language institutes
    { chapter: "AF_soft", step: "l_intro" },
    { chapter: "AF_soft", step: "l_cov" },
    { chapter: "AF_soft", step: "l_chn_cov" },
    { chapter: "ME_soft", step: "l_intro" },
    { chapter: "ME_soft", step: "l_eu" },
    { chapter: "ME_soft", step: "l_tur" },
    // students
    { chapter: "AF_soft", step: "st_intro" },
    { chapter: "ME_soft", step: "s_intro" },
    // migrants from Africa / the Middle East and the Gulf to external actors
    { chapter: "AF_soft", step: "mf_intro" },
    { chapter: "ME_soft", step: "f_intro" },
    // migrants from external actors to Africa / the Middle East and the Gulf
    { chapter: "AF_soft", step: "mt_intro" },
    { chapter: "ME_soft", step: "t_ind" },
    // perceived influence
    { chapter: "AF_soft", step: "pc_intro" },
    { chapter: "ME_soft", step: "pc_intro" },
    { chapter: "ME_soft", step: "pc_law" },
  ],

  // ── Shaping markets ───────────────────────────────────────────────────────
  trade: [
    // Africa
    { chapter: "AF_trade", step: "tra_eu" },
    { chapter: "AF_trade", step: "tra_na" },
    { chapter: "AF_trade", step: "bal_na_regions" },
    { chapter: "AF_trade", step: "gre_share" },
    { chapter: "AF_trade", step: "hit_intro" },
    { chapter: "AF_trade", step: "hit_eu" },
    { chapter: "AF_trade", step: "pha_india" },
    { chapter: "AF_trade", step: "agri_intro" },
    { chapter: "AF_trade", step: "agri_eu_exp" },
    { chapter: "AF_trade", step: "cer_intro" },
    // Middle East and the Gulf
    { chapter: "ME_trade", step: "tra_eu" },
    { chapter: "ME_trade", step: "tra_hi" },
    { chapter: "ME_trade", step: "gre_hi" },
    { chapter: "ME_trade", step: "gre_gulf" },
    { chapter: "ME_trade", step: "hit_israel" },
    { chapter: "ME_trade", step: "hit_excl" },
    { chapter: "ME_trade", step: "agri_eu" },
    { chapter: "ME_trade", step: "agri_mix" },
    { chapter: "ME_trade", step: "agri_isr" },
  ],

  // ── Financing influence ───────────────────────────────────────────────────
  invest: [
    // Africa: foreign direct investment
    { chapter: "AF_invest", step: "fdi_scale" },
    { chapter: "AF_invest", step: "fdi_conc" }, // the map; the screenshot has no actor selected
    // [actors] { chapter: "AF_invest", step: "fdi_eu" },
    // [actors] { chapter: "AF_invest", step: "fdi_gulf" },
    // [actors] { chapter: "AF_invest", step: "fdi_us" },
    // Africa: official development finance
    { chapter: "AF_invest", step: "oda_europe" },
    { chapter: "AF_invest", step: "oda_china" },
    { chapter: "AF_invest", step: "oda_geo" },
    // Africa: official bilateral lending
    { chapter: "AF_invest", step: "debt_china" },
    // [actors] { chapter: "AF_invest", step: "debt_europe" },

    // Middle East and the Gulf: foreign direct investment
    { chapter: "ME_invest", step: "fdi_eu" },
    // [actors] { chapter: "ME_invest", step: "fdi_us" },
    // [actors] { chapter: "ME_invest", step: "fdi_us_israel" },
    // [actors] { chapter: "ME_invest", step: "fdi_gulf" },
    // [actors] { chapter: "ME_invest", step: "fdi_gulf_lmi" },
    // [actors] { chapter: "ME_invest", step: "fdi_asia" },
    // [actors] { chapter: "ME_invest", step: "fdi_asia_lmi" },
    // Middle East and the Gulf: official development finance
    { chapter: "ME_invest", step: "oda_total" },
    // [actors] { chapter: "ME_invest", step: "oda_expand" },
    // [actors] { chapter: "ME_invest", step: "oda_turkiye" },
    { chapter: "ME_invest", step: "oda_china" },
    // Middle East and the Gulf: official bilateral lending
    { chapter: "ME_invest", step: "debt_total" },
    // [actors] { chapter: "ME_invest", step: "debt_japan" },
    // [actors] { chapter: "ME_invest", step: "debt_others" },
    // [actors] { chapter: "ME_invest", step: "debt_gulf" },
    { chapter: "ME_invest", step: "debt_flows_intro" },
    // [actors] { chapter: "ME_invest", step: "debt_flows_japan" },
    // [actors] { chapter: "ME_invest", step: "debt_flows_rep" },
    // [actors] { chapter: "ME_invest", step: "debt_flows_total" },
  ],

  // ── Anchoring ties ────────────────────────────────────────────────────────
  infra: [
    // World Bank-financed procurement
    { chapter: "AF_infra", step: "pro_china" },
    { chapter: "AF_infra", step: "pro_works" },
    { chapter: "ME_infra", step: "pro_tur" },
    { chapter: "ME_infra", step: "pro_works" },
    // private participation in infrastructure (PPI sponsors); the Middle East screenshot has all rows
    // in full colour, which is the ppi_vintage step (ppi_gulf highlights five rows)
    { chapter: "AF_infra", step: "ppi_eu" },
    { chapter: "ME_infra", step: "ppi_vintage" },
    // where the foreign works awards go
    { chapter: "AF_infra", step: "pro_divide" },
    // host concentration
    { chapter: "ME_infra", step: "conc_ppi" },
    { chapter: "ME_infra", step: "conc_ipf" },
  ],

  // ── Securing interests ────────────────────────────────────────────────────
  mil: [
    // arms transfers
    { chapter: "AF_mil", step: "arm_intro" },
    { chapter: "AF_mil", step: "arm_change" },
    { chapter: "ME_mil", step: "arm_peak" },
    { chapter: "ME_mil", step: "arm_me_fall", override: { highlight: [] } },
    // foreign military presence
    { chapter: "AF_mil", step: "dep_bilat" },
    { chapter: "ME_mil", step: "mil_trans" },
    { chapter: "ME_mil", step: "dep_un_eu" },
    // military exercises
    { chapter: "AF_mil", step: "ex_all" },
    { chapter: "AF_mil", step: "ex_us" },
    { chapter: "AF_mil", step: "ex_chn" },
    { chapter: "AF_mil", step: "ex_ind" },
    { chapter: "ME_mil", step: "ex_naval" },
    { chapter: "ME_mil", step: "ex_gcc" },
  ],
};
