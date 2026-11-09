// landing.js: the "Main findings" scrollytelling on the landing page (index_landing_v3.html).
// No charts of its own: each landing step points at a step of a chapter, so edits to the
// chapter's chart or state carry over here. Read by js/landing_scrolly.js.
//
// steps: one entry per data-step="..." in the landing text
//   chapter:  chapter config, imported below (by reference)
//   region:   "AF" | "ME" (the region of that chapter)
//   step:     step id in that chapter's config
//   override: optional, merged over the chapter step's state (use sparingly)
//
// Leading endnote markers of the chapters ("¹⁵ Afrobarometer ...") are stripped from the
// footnotes by landing_scrolly.js; the rest of the footnote stays.

import AF_dipl from "./AF_dipl.js";
import AF_trade from "./AF_trade.js";
import AF_invest from "./AF_invest.js";
import AF_mil from "./AF_mil.js";
import AF_soft from "./AF_soft.js";
import ME_dipl from "./ME_dipl.js";
import ME_mil from "./ME_mil.js";

export const CHAPTERS = { AF_dipl, AF_trade, AF_invest, AF_mil, AF_soft, ME_dipl, ME_mil };

export default {
  steps: {
    // EU: Africa's largest single trading partner, China and the Asian four alongside
    lf_eu: { chapter: "AF_trade", region: "AF", step: "tra_eu" },

    // China: embassies in all 53 African states it recognises
    lf_chn: { chapter: "AF_dipl", region: "AF", step: "emb_chn" },

    // US: bases and deployments in the Gulf (no ME military state compares deployments across actors)
    lf_usa: { chapter: "ME_mil", region: "ME", step: "dep_us" },

    // Gulf: recorded FDI stock in Africa, USD bn (38.3 -> 53.7, the "around 40%"), instead of the share
    lf_gulf: {
      chapter: "AF_invest",
      region: "AF",
      step: "fdi_scale_gulf",
      override: {
        measure: "value_usd_bn",
        subtitle: "Recorded inward FDI stock held by each investor, USD bn",
      },
    },

    // Türkiye: widest diplomatic network in the Middle East and the Gulf
    lf_tur: { chapter: "ME_dipl", region: "ME", step: "emb_tur" },

    // Russia: arms transfers to Africa down by more than four-fifths (Russia added to the highlight)
    lf_rus: {
      chapter: "AF_mil",
      region: "AF",
      step: "arm_change",
      override: {
        highlight: [...AF_mil.steps.arm_change.state.highlight, "Russia"],
      },
    },

    // India (and Russia): outsized shares of Africa's cereal imports
    lf_conc: { chapter: "AF_trade", region: "AF", step: "cer_ind" },

    // perceptions: China's influence viewed more positively than the EU's
    lf_partners: { chapter: "AF_soft", region: "AF", step: "pc_chn" },
  },
};
