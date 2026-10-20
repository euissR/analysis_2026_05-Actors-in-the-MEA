// AF_trade.js: Africa, trade chapter
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (trade_1_partners -> trade_1_partners_AF.csv)
//   extra: further data files, { name: "file_{suffix}" } -> extra.name
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of js/charts/periodRange.js)
//
// All charts compare annual averages 2019–21 and 2022–24, current USD (Growth Lab, HS12).
//   partners  total trade, share of each actor (ECON 1.1, 1.2)
//   exports   the region's goods exports to each actor, share of its exports (agri_cen_goods)
//   balances  trade balance of each actor, total / hydrocarbon / non-hydrocarbon (ECON 1.3, 1.4)
//   products  green energy, high-tech (incl. pharma), agri-food, cereals, fertilizers (ECON 2.1 to 2.6)
//
// PINNED: where the text and the charts differ. The text is as written; the charts
// show the data.
//   split sentences (the chart shows one actor or one basket at a time, so a sentence with
//   two is cut at the clause boundary): bal_eu_total / bal_eu_hydro / bal_eu_nonhydro,
//   bal_chn_total / bal_chn_nonhydro, bal_na_regions / bal_na_values, pha_total / pha_india,
//   hit_eu / hit_chn, agri_eu_exp / agri_eu_imp, cer_intro / cer_eu, fer_intro / fer_na_exp,
//   fer_ssa_imp / fer_ssa_sup / fer_na_eu
//   Sub-Saharan Africa is not in the workbook (Africa + five regions). The R scripts add it as
//   "Sub-Saharan Africa": the four regions summed (shares: summed values over summed totals).
//   tra_eu         the Asian four (28.7%) are four separate rows; the sum is not drawn
//   tra_na         "over half of the EU's trade with Africa" is the EU's own trade by region,
//                  not a share of a region's trade: not drawn (the chart shows the EU's
//                  share of North African trade)
//   bal_na_regions the 70% share of the EU's continent-wide swing is not drawn
//   gre_intro      the USD 2.2bn total is in the subtitle; the rows are the actors' own values
//   hit_eu         "pharmaceuticals and aircrafts": the pharma basket is shown (aerospace is
//                  in the data, basket "aerospace")
//   pha_total      India's 6.2% of total trade is shown on the partners chart
//   agri_cen       "39% in West and North Africa" is 38.8% and 39.0%: the three regions are shown
//   agri_cen_goods the 19% is the EU's share of Central Africa's goods exports (all goods, not
//                  agriculture), from trade_1_flows
//   agri_cen_share "less than 5% of EU–Africa goods trade" (4.8%) is not drawn: the chart shows
//                  the EU's trade with each region in USD bn
//   agri_chn       the chart shows North Africa next to Sub-Saharan Africa (imports); the
//                  sentence is as in the source, but "former’s" no longer has a clear referent
//                  after the new Central Africa sentences
//   cer_rus        the year-by-year shares sit in the line under the subtitle
//   cer_ind        "However, two partners ..." opens the step; India and Russia are both
//                  highlighted
//   fer_intro      the divide between regions is shown as values by region (USD bn)
//   fer_na_exp     the continent and North Africa side by side, values (USD bn); the 83%, 96%
//                  and 93% are North Africa's part of Africa's exports (all, to the EU, to
//                  India): not drawn
//   fer_ssa_imp / fer_ssa_sup / fer_na_eu
//   Sub-Saharan Africa is not in the workbook (Africa + five regions). The R scripts add it as
//   "Sub-Saharan Africa": the four regions summed (shares: summed values over summed totals).
//   tra_eu         the Asian four (28.7%) are four separate rows; the sum is not drawn
//   tra_na         "over half of the EU's trade with Africa" is the EU's own trade by region,
//                  not a share of a region's trade: not drawn (the chart shows the EU's
//                  share of North African trade)
//   bal_na_regions the 70% share of the EU's continent-wide swing is not drawn
//   gre_intro      the USD 2.2bn total is in the subtitle; the rows are the actors' own values
//   hit_eu         "pharmaceuticals and aircrafts": the pharma basket is shown (aerospace is
//                  in the data, basket "aerospace")
//   pha_total      India's 6.2% of total trade is shown on the partners chart
//   agri_chn       the chart shows North Africa next to Sub-Saharan Africa (imports); the
//                  text no longer gives the 39% / 28% / 28% / 20% figures (agri_na was cut from
//                  the source) and "the opposite geography" / "former's" have lost their
//                  referent: left as in the source
//   cer_rus        the year-by-year shares sit in the line under the subtitle
//   cer_ind        "However, two partners ..." opens the step; India and Russia are both
//                  highlighted
//   fer_intro      "83% of exports", "96% to the EU" and "93% to India" are shares of
//                  Africa's flow to a partner, not of a partner's share: the step shows the
//                  values by region (USD bn), the shares are in the tooltips of fer_na_exp
//   fer_na_exp     the continent and North Africa side by side, values (USD bn); the 83%,
//                  96% and 93% are not drawn
//   fer_ssa_imp    the 87% is not drawn; North Africa and Sub-Saharan Africa are shown in USD bn
//   footnotes 2 to 4 and the cereals asterisk are drafts, from the source document;
//   the fertilizers asterisk is the source's wording
//   typos kept as in the source: "former’s agricultural trade", "in SSA."
//   not in the data: the Gulf as separate states (GCC only), South Korea / Japan / Iran /
//   Israel have rows but no text of their own

const SOURCE =
  "Data: Growth Lab, Harvard University, 2026, “International Trade Data (HS12)”, Harvard Dataverse, https://doi.org/10.7910/DVN/YAVJDF. Period averages, 2019–21 vs 2022–24. Values in current USD.";

const FIVE = [
  "North Africa",
  "West Africa",
  "Central Africa",
  "East Africa and HoA",
  "Southern Africa and Indian Ocean",
];

const PRODUCT = {
  green: "Green-energy products",
  hitech: "High-tech products",
  agri: "Agri-food products",
  cereals: "Cereals",
  fertilizers: "Fertilizers",
};
const BASKET = {
  pharma: "Pharmaceuticals",
  electronics: "Electronics and telecommunications",
  aerospace: "Aerospace",
};

const COMPONENT = {
  total: "all goods",
  hydrocarbon: "hydrocarbons",
  non_hydrocarbon: "goods other than hydrocarbons",
};

const where = (s) => (s.geos?.length > 1 ? "by region" : "");

export default {
  charts: {
    partners: {
      type: "periodRange",
      data: "trade_1_partners",
      measure: "share_pct",
      title: "Africa’s trading partners",
      subtitle: (s) =>
        s.measure === "value_usd_bn"
          ? `Average annual trade with each actor, USD bn ${where(s)}`
          : `Share of total trade (imports and exports) with each actor, % ${where(s)}`,
      source: SOURCE,
      geoLabelsShort: {
        "North Africa": "North",
        "West Africa": "West",
        "Central Africa": "Central",
        "East Africa and HoA": "East & Horn",
        "Southern Africa and Indian Ocean": "Southern",
      },
    },

    exports: {
      type: "periodRange",
      data: "trade_1_flows",
      measure: "share_pct",
      filter: { flow: "exports" },
      title: "Africa’s trading partners: exports",
      subtitle: (s) =>
        s.measure === "value_usd_bn"
          ? `Average annual goods exports to each actor, USD bn ${where(s)}`
          : `Share of goods exports going to each actor, % ${where(s)}`,
      source: SOURCE,
      geoLabelsShort: {
        "North Africa": "North",
        "West Africa": "West",
        "Central Africa": "Central",
        "East Africa and HoA": "East & Horn",
        "Southern Africa and Indian Ocean": "Southern",
      },
    },

    balances: {
      type: "periodRange",
      data: "trade_1_balances",
      measure: "balance_usd_bn",
      filter: { component: "total" },
      title: "Trade balances with Africa",
      subtitle: (s) =>
        `Average annual balance of each actor in ${COMPONENT[s.component ?? "total"]}, USD bn ${where(s)}. Positive: the actor sells more than it buys`,
      source: SOURCE,
      geoLabelsShort: {
        "North Africa": "North",
        "West Africa": "West",
        "Central Africa": "Central",
        "East Africa and HoA": "East & Horn",
        "Southern Africa and Indian Ocean": "Southern",
      },
    },

    products: {
      type: "periodRange",
      data: "trade_2_products",
      extra: { annual: "trade_2_cereals_annual_{suffix}" },
      measure: "share_pct",
      filter: { product: "green", basket: "all", flow: "imports" },
      title: (s) => BASKET[s.basket] ?? PRODUCT[s.product ?? "green"],
      subtitle: (s, info) => {
        const flow = s.flow ?? "imports";
        const dir =
          flow === "exports" ? "exports going to" : "imports coming from";
        const base =
          s.measure === "value_usd_bn"
            ? `Average annual ${flow === "exports" ? "exports to" : "imports from"} each actor, USD bn`
            : `Share of Africa’s ${dir} each actor, %`;
        const tot =
          s.measure === "value_usd_bn" && Number.isFinite(info.total[0])
            ? ` (all partners: ${info.total[0].toFixed(1)} → ${info.total[1].toFixed(1)})`
            : "";
        return `${base}${tot} ${where(s)}`;
      },
      source: SOURCE,
      geoLabelsShort: {
        "North Africa": "North",
        "West Africa": "West",
        "Central Africa": "Central",
        "East Africa and HoA": "East & Horn",
        "Southern Africa and Indian Ocean": "Southern",
      },
    },
  },

  steps: {
    // ── ECON 1.1, 1.2: partners ─────────────────────────────────────────────
    tra_eu: {
      chart: "partners",
      state: { highlight: ["EU", "CHN", "IND", "JPN", "KOR"] },
    },
    tra_reg_intro: { chart: "partners", state: { geos: FIVE } },
    tra_na: {
      chart: "partners",
      state: { geos: ["North Africa"], highlight: ["EU", "CHN"] },
    },
    tra_ssa: {
      chart: "partners",
      state: { geos: ["Sub-Saharan Africa"], highlight: ["CHN", "EU"] },
    },
    tra_central: {
      chart: "partners",
      state: { geos: ["Central Africa"], highlight: ["CHN", "EU"] },
    },

    // ── ECON 1.3, 1.4: balances ─────────────────────────────────────────────
    tra_transition: {
      chart: "balances",
      state: { highlight: ["EU", "CHN"] },
    },
    bal_eu_total: { chart: "balances", state: { highlight: ["EU"] } },
    bal_eu_hydro: {
      chart: "balances",
      state: { component: "hydrocarbon", highlight: ["EU"] },
    },
    bal_eu_nonhydro: {
      chart: "balances",
      state: { component: "non_hydrocarbon", highlight: ["EU"] },
    },
    bal_chn_total: { chart: "balances", state: { highlight: ["CHN"] } },
    bal_chn_nonhydro: {
      chart: "balances",
      state: { component: "non_hydrocarbon", highlight: ["CHN", "EU"] },
    },
    bal_na_regions: {
      chart: "balances",
      state: { geos: FIVE, highlight: ["EU", "CHN"] },
    },
    bal_na_values: {
      chart: "balances",
      state: { geos: ["North Africa"], highlight: ["EU", "CHN"] },
    },
    pro_intro: {
      chart: "balances",
      state: { highlight: ["EU", "CHN"] },
    },

    // ── ECON 2.1: green energy ──────────────────────────────────────────────
    gre_intro: {
      chart: "products",
      state: {
        product: "green",
        measure: "value_usd_bn",
        highlight: ["CHN"],
        footnote:
          "Energy-related trade is approximated using an HS2012 basket informed by Eurostat’s green-energy categories. As the underlying Harvard University dataset contains data on HS six digit rather than 8 digit level, some source codes are broader than the technologies concerned: notably, HS854140 includes photovoltaic cells, other photosensitive devices and LEDs, while HS290919 exceeds the specific biofuel-related subheading. Reported shares therefore refer to the mapped basket rather than exclusively to solar panels or biofuels.",
      },
    },
    gre_share: {
      chart: "products",
      state: { product: "green", highlight: ["CHN", "EU"] },
    },
    gre_na: {
      chart: "products",
      state: {
        product: "green",
        geos: ["North Africa"],
        highlight: ["CHN", "EU"],
      },
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
    hit_eu: {
      chart: "products",
      state: { product: "hitech", basket: "pharma", highlight: ["EU", "CHN"] },
    },
    hit_chn: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "electronics",
        highlight: ["CHN", "EU"],
      },
    },

    // ── ECON 2.3: pharma (India) ────────────────────────────────────────────
    pha_total: { chart: "partners", state: { highlight: ["IND"] } },
    pha_india: {
      chart: "products",
      state: { product: "hitech", basket: "pharma", highlight: ["IND", "EU"] },
    },
    pha_regions: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "pharma",
        geos: ["West Africa", "Central Africa", "East Africa and HoA"],
        highlight: ["IND"],
      },
    },

    // ── ECON 2.4: agri-food ─────────────────────────────────────────────────
    agri_intro: {
      chart: "products",
      state: {
        product: "agri",
        flow: "imports",
        highlight: ["EU", "CHN", "USA", "IND"],
        footnote:
          "Agricultural goods follow the Eurostat definition: HS chapters 1–24 (sections I–IV), covering animal products, vegetable products, fats and oils, and prepared foodstuffs, beverages and tobacco.",
      },
    },
    agri_eu_exp: {
      chart: "products",
      state: { product: "agri", flow: "exports", highlight: ["EU"] },
    },
    agri_eu_imp: {
      chart: "products",
      state: { product: "agri", flow: "imports", highlight: ["EU"] },
    },
    agri_cen: {
      chart: "products",
      state: {
        product: "agri",
        flow: "exports",
        geos: ["North Africa", "West Africa", "Central Africa"],
        highlight: ["EU"],
      },
    },
    agri_cen_goods: {
      chart: "exports",
      state: { geos: ["Central Africa"], highlight: ["EU"] },
    },
    agri_cen_share: {
      chart: "partners",
      state: { geos: FIVE, measure: "value_usd_bn", highlight: ["EU"] },
    },
    agri_chn: {
      chart: "products",
      state: {
        product: "agri",
        flow: "imports",
        geos: ["North Africa", "Sub-Saharan Africa"],
        highlight: ["CHN"],
      },
    },

    // ── ECON 2.5: cereals ───────────────────────────────────────────────────
    cer_intro: {
      chart: "products",
      state: { product: "cereals" },
    },
    cer_eu: {
      chart: "products",
      state: { product: "cereals", highlight: ["EU"] },
    },
    cer_ind: {
      chart: "products",
      state: {
        product: "cereals",
        highlight: ["IND", "RUS"],
        footnote:
          "* Despite restrictions on wheat exports from 2022 and on some rice categories from 2023 (both lifted as of 2026 and 2024/25 respectively).",
      },
    },
    cer_rus: {
      chart: "products",
      state: { product: "cereals", highlight: ["RUS"] },
    },

    // ── ECON 2.6: fertilizers (HS31) ────────────────────────────────────────
    fer_intro: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "exports",
        measure: "value_usd_bn",
        geos: FIVE,
        highlight: ["EU", "IND"],
        footnote:
          "* Fertilizers (HS31) are separate from the agri-food HS Sections I–IV basket.",
      },
    },
    fer_na_exp: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "exports",
        measure: "value_usd_bn",
        geos: ["Africa", "North Africa"],
        highlight: ["EU", "IND"],
      },
    },
    fer_eu_exp: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "exports",
        highlight: ["EU", "IND", "USA"],
      },
    },
    fer_ssa_imp: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "imports",
        measure: "value_usd_bn",
        geos: ["North Africa", "Sub-Saharan Africa"],
      },
    },
    fer_ssa_sup: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "imports",
        geos: ["Sub-Saharan Africa"],
        highlight: ["GCC", "RUS", "EU"],
      },
    },
    fer_na_eu: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "imports",
        geos: ["North Africa", "Sub-Saharan Africa"],
        highlight: ["EU"],
      },
    },
  },
};
