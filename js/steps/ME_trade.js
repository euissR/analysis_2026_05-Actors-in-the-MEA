// ME_trade.js: Middle East and the Gulf, trade chapter
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (trade_1_partners -> trade_1_partners_ME.csv)
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of js/charts/periodRange.js)
//
// All charts compare annual averages 2019–21 and 2022–24, current USD (Growth Lab, HS12).
// Geographies: the region, the two income groups, and GCC and Israel on their own
// (they are inside the high-income group).
//   partners  total trade, share of each actor (ECON 1.1, 1.2)
//   balances  trade balance of each actor with the region (ECON 1.3, 1.4)
//   products  green energy, high-tech (incl. armament and pharma), agri-food, cereals (ECON 2.1 to 2.5)
//
// PINNED: where the text and the charts differ. The text is as written; the charts
// show the data.
//   missing data (good to fix; see PINNED 4 to 7 in 0 trade.R)
//     tra_eu_bal, bal_chn   the non-hydrocarbon surplus (EU 90.8bn, China 115.3bn) is not in the
//                           workbook: the charts show the total balance
//     bal_groups, bal_tur_iraq   Iraq's part of the EU, US and Türkiye balances is not in the
//                           workbook: the charts show the two income groups
//     gre_gulf              no green-energy shares for Israel and the GCC (no denominators):
//                           values in USD bn instead
//     hit_us, hit_ind, hit_kor   no world totals per high-tech basket, so the armament and
//                           pharma charts show values in USD bn, not the shares the text quotes
//                           (US 55.8% of armament, India 10.8% of pharma, South Korea 10.2%)
//   split sentences (the chart shows one geography, actor or basket at a time, so a sentence with
//   two is cut at the clause boundary): tra_hi / tra_hi_detail / tra_lmi, bal_intro / bal_tur,
//   hit_israel / hit_excl, hit_us / hit_ind / hit_kor, agri_eu / agri_mix / agri_isr
//   tra_eu_bal            sentence 2 of the opening paragraph is about balances, so the step
//                         shows the balances chart and then goes back to partners
//   tra_chn               41.3% is the 2024 value (annual data); the chart shows period averages
//   tra_hi                86.6% (the income group's weight in regional trade) is not drawn
//   tra_lmi               Iraq's oil exports are not drawn
//   gre_total             the three-year total (USD 12.1bn) is not drawn; the chart shows annual
//                         averages, with the total of all partners in the subtitle
//   agri_def              the deficit (USD 72.6bn, +34%) is not drawn; the step shows the
//                         region's imports by actor
//   hit_intro             "largest external partner, counting both imports and exports": the
//                         chart shows import shares only (hit_israel shows both flows)
//   hit_israel, hit_excl  the butterfly chart from the mock on page 7 of the source (two-way
//                         high-tech trade, Israel vs the rest of the region). The sentence is cut
//                         in two; the second step takes Israel out of the bars. The intra-region
//                         row is the region's trade with the Gulf and Israel: imports 15.2 (mock
//                         15.4) and exports 11.4 (mock 15.4: the mock uses one value for both sides);
//                         Israel's part of it is its trade with the Gulf. Other regional countries
//                         are not partners in the data
//   footnotes 3 to 5, the armament note and the Palestine* wording are drafts, from the
//   source document (the Palestine* line is the standard EU wording: to be confirmed)
//   typos kept as in the source: "Further differences re visible", "where shift towards
//   renewable-energy", "Türkiye surplus"
//   empty in the source: the short summary
//   the Gulf as separate states is not in the data (GCC only)

const SOURCE =
  "Data: Growth Lab, Harvard University, 2026, “International Trade Data (HS12)”, Harvard Dataverse, https://doi.org/10.7910/DVN/YAVJDF. Period averages, 2019–21 vs 2022–24. Values in current USD.";

const REG = "Middle East and the Gulf";
const HI = "High-income";
const LMI = "Low- and middle-income";

const PAL =
  "* This designation shall not be construed as recognition of a State of Palestine and is without prejudice to the individual positions of the Member States on this issue.";
const GROUPS =
  "Countries are divided in two groups: high-income economies (Bahrain, Israel, Kuwait, Oman, Qatar, Saudi Arabia and United Arab Emirates) and low- and middle-income economies (Iraq, Jordan, Lebanon, Palestine*, Syria and Yemen).";
const GROUPS_FOOT = `${GROUPS} ${PAL}`;

const PRODUCT = {
  green: "Green-energy products",
  hitech: "High-tech products",
  agri: "Agri-food products",
  cereals: "Cereals",
};
const BASKET = {
  armament: "High-tech armament basket",
  pharma: "High-tech pharmaceuticals",
};
const COMPONENT = {
  total: "all goods",
  hydrocarbon: "hydrocarbons",
  non_hydrocarbon: "goods other than hydrocarbons",
};

const labels = {
  geoLabels: {
    "Middle East and the Gulf": "Middle East and the Gulf",
    GCC: "Gulf (GCC)",
  },
  geoLabelsShort: {
    "Middle East and the Gulf": "Region",
    "Low- and middle-income": "Low/middle income",
    GCC: "Gulf (GCC)",
  },
};

export default {
  charts: {
    partners: {
      type: "periodRange",
      data: "trade_1_partners",
      measure: "share_pct",
      geos: [REG],
      title: "Trading partners of the Middle East and the Gulf",
      subtitle: (s) =>
        s.measure === "value_usd_bn"
          ? "Average annual trade with each actor, USD bn"
          : "Share of total trade (imports and exports) with each actor, %",
      source: SOURCE,
      ...labels,
    },

    balances: {
      type: "periodRange",
      data: "trade_1_balances",
      measure: "balance_usd_bn",
      filter: { component: "total" },
      geos: [REG],
      title: "Trade balances with the Middle East and the Gulf",
      subtitle: (s) =>
        `Average annual balance of each actor in ${COMPONENT[s.component ?? "total"]}, USD bn. Positive: the actor sells more than it buys`,
      source: SOURCE,
      ...labels,
    },

    products: {
      type: "periodRange",
      data: "trade_2_products",
      measure: "share_pct",
      filter: { product: "green", basket: "all", flow: "imports" },
      geos: [REG],
      title: (s) => BASKET[s.basket] ?? PRODUCT[s.product ?? "green"],
      subtitle: (s, info) => {
        const flow = s.flow ?? "imports";
        const dir = flow === "exports" ? "exports going to" : "imports coming from";
        const base =
          s.measure === "value_usd_bn"
            ? `Average annual ${flow === "exports" ? "exports to" : "imports from"} each actor, USD bn`
            : `Share of ${dir} each actor, %`;
        const tot =
          s.measure === "value_usd_bn" && !(s.geos?.length > 1) && Number.isFinite(info.total[0])
            ? ` (all partners: ${info.total[0].toFixed(1)} → ${info.total[1].toFixed(1)})`
            : "";
        return `${base}${tot}`;
      },
      source: SOURCE,
      ...labels,
    },

    // two-way high-tech trade, Israel vs the rest of the region (the mock on page 7 of the source)
    hitflow: {
      type: "flowBars",
      data: "trade_2_products",
      filter: { product: "hitech", basket: "all" },
      period: "2022–24",
      base: REG,
      part: "Israel",
      partLabel: "Israel",
      restLabel: "Rest of the region",
      title: "Two-way high-tech trade with the region, 2022–2024 average, USD bn",
      subtitle: "",
      note: "Percentages give Israel’s share of each flow.",
      source: SOURCE,
      rows: [
        { id: "EU", actors: ["EU"] },
        { id: "intra", label: "Intra-region", actors: ["GCC", "ISR"], part: ["GCC"] },
        { id: "CHN", actors: ["CHN"] },
        { id: "USA", actors: ["USA"] },
        { id: "IND", actors: ["IND"] },
        { id: "KOR", actors: ["KOR"] },
      ],
    },
  },

  steps: {
    // ── ECON 1.1, 1.2: partners ─────────────────────────────────────────────
    tra_eu: { chart: "partners", state: { highlight: ["EU"] } },
    tra_eu_bal: { chart: "balances", state: { highlight: ["EU"] } },
    tra_chn: {
      chart: "partners",
      state: { highlight: ["CHN", "IND", "JPN", "KOR"] },
    },
    tra_hi: {
      chart: "partners",
      state: { geos: [HI, LMI], footnote: GROUPS_FOOT },
    },
    tra_hi_detail: {
      chart: "partners",
      state: {
        geos: [HI],
        highlight: ["CHN", "EU", "USA", "GCC", "IND", "JPN", "KOR"],
        footnote: PAL,
      },
    },
    tra_lmi: {
      chart: "partners",
      state: {
        geos: [LMI],
        highlight: ["CHN", "EU", "IND", "TUR", "USA"],
        footnote: PAL,
      },
    },

    // ── ECON 1.3, 1.4: balances ─────────────────────────────────────────────
    bal_intro: { chart: "balances", state: { highlight: ["EU"] } },
    bal_tur: { chart: "balances", state: { highlight: ["TUR"] } },
    bal_chn: { chart: "balances", state: { highlight: ["CHN", "EU"] } },
    bal_groups: {
      chart: "balances",
      state: { geos: [HI, LMI], highlight: ["EU", "USA"], footnote: PAL },
    },
    bal_tur_iraq: {
      chart: "balances",
      state: { geos: [HI, LMI], highlight: ["TUR"], footnote: PAL },
    },
    pro_intro: { chart: "balances", state: { highlight: ["CHN", "EU"] } },

    // ── ECON 2.1: green energy ──────────────────────────────────────────────
    gre_intro: {
      chart: "products",
      state: {
        product: "green",
        highlight: ["CHN", "EU"],
        footnote:
          "Energy-related trade is approximated using an HS2012 basket informed by Eurostat’s green-energy categories. As the underlying Harvard University dataset contains data on HS six digit rather than 8 digit level, some source codes are broader than the technologies concerned: notably, HS854140 includes photovoltaic cells, other photosensitive devices and LEDs, while HS290919 exceeds the specific biofuel-related subheading. Reported shares therefore refer to the mapped basket rather than exclusively to solar panels or biofuels.",
      },
    },
    gre_hi: {
      chart: "products",
      state: { product: "green", geos: [HI], highlight: ["CHN", "EU"], footnote: PAL },
    },
    gre_gulf: {
      chart: "products",
      state: {
        product: "green",
        geos: ["GCC", "Israel"],
        measure: "value_usd_bn",
        scale: "free", // Israel's imports are small next to the Gulf's
        highlight: ["CHN", "EU"],
      },
    },
    gre_lmi: {
      chart: "products",
      state: { product: "green", geos: [LMI], highlight: ["CHN", "EU"], footnote: PAL },
    },
    gre_total: {
      chart: "products",
      state: { product: "green", measure: "value_usd_bn", highlight: ["CHN"] },
    },

    // ── ECON 2.2: high-tech ─────────────────────────────────────────────────
    hit_intro: {
      chart: "products",
      state: {
        product: "hitech",
        highlight: ["EU", "CHN"],
        footnote:
          "High-tech products follow Eurostat’s definition, using the high-tech aggregation under SITC Rev. 4. Based on the OECD definition, the list covers technical products whose manufacture involves high R&D intensity.",
      },
    },
    hit_israel: { chart: "hitflow", state: { highlight: ["EU", "intra", "USA", "KOR"] } },
    hit_excl: { chart: "hitflow", state: { exclude: true, highlight: ["CHN"] } },
    hit_us: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "armament",
        measure: "value_usd_bn",
        highlight: ["USA"],
        footnote:
          "* Armament sub-basket in hi-tech products group is not a comprehensive measure of arms transfers or defence dependence.",
      },
    },
    hit_ind: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "pharma",
        geos: [LMI],
        measure: "value_usd_bn",
        highlight: ["IND"],
        footnote: PAL,
      },
    },
    hit_kor: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "armament",
        measure: "value_usd_bn",
        highlight: ["KOR"],
        footnote:
          "* Armament sub-basket in hi-tech products group is not a comprehensive measure of arms transfers or defence dependence.",
      },
    },

    // ── ECON 2.4: agri-food ─────────────────────────────────────────────────
    agri_eu: {
      chart: "products",
      state: {
        product: "agri",
        flow: "imports",
        highlight: ["EU"],
        footnote:
          "Agricultural goods follow the Eurostat definition: HS chapters 1–24 (sections I–IV), covering animal products, vegetable products, fats and oils, and prepared foodstuffs, beverages and tobacco.",
      },
    },
    agri_mix: {
      chart: "products",
      state: {
        product: "agri",
        flow: "imports",
        geos: ["GCC", LMI],
        highlight: ["TUR"],
        footnote: PAL,
      },
    },
    agri_isr: {
      chart: "products",
      state: { product: "agri", flow: "imports", geos: ["Israel"], highlight: ["EU"] },
    },
    agri_def: {
      chart: "products",
      state: { product: "agri", flow: "imports", measure: "value_usd_bn", highlight: ["EU"] },
    },

    // ── ECON 2.5: cereals ───────────────────────────────────────────────────
    cer_intro: {
      chart: "products",
      state: { product: "cereals", geos: [HI, LMI], highlight: ["IND"], footnote: PAL },
    },
    cer_rus: {
      chart: "products",
      state: {
        product: "cereals",
        geos: ["GCC", "Israel", LMI],
        highlight: ["RUS"],
        footnote: PAL,
      },
    },
  },
};
