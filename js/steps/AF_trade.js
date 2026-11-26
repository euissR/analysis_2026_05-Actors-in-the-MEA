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
// All charts compare annual averages 2019–21 and 2022–24, current US dollars (Growth Lab, HS12).
//   partners  total trade, share of each actor (ECON 1.1, 1.2)
//   exports   the region's goods exports to each actor, share of its exports (agri_cen_goods)
//   balances  trade balance of each actor, total / hydrocarbon / non-hydrocarbon (ECON 1.3, 1.4)
//   products  green energy, high-tech (incl. pharma), agri-food, cereals, fertilizers (ECON 2.1 to 2.6)
//
// PINNED: where the text and the charts differ. The text is as written; the charts
// show the data.
//   split sentences (the chart shows one actor or one basket at a time, so a sentence with
//   two is cut at the clause boundary): bal_eu_hydro / bal_eu_nonhydro, pha_total / pha_india,
//   hit_eu / hit_chn, cer_intro / cer_eu, fer_intro / fer_na_exp,
//   fer_ssa_imp / fer_ssa_sup / fer_na_eu
//   merged sentences (one step, one chart state; the text keeps both parts): tra_transition (+ bal_eu_total: EU and China highlighted),
//   cer_ind (+ cer_rus: India and Russia highlighted). Merged with the chart of the first part only: bal_chn_total (+ bal_chn_nonhydro:
//   the non-hydrocarbon surplus is text only), bal_na_regions (+ bal_na_values: the North Africa values are text only), agri_eu_exp
//   (+ agri_eu_imp: the EU's share of imports is text only), agri_cen (+ agri_cen_goods: the 19% is text only; the "exports" chart is
//   no longer used by any step)
//   Sub-Saharan Africa is not in the workbook (Africa + five regions). The R scripts add it as
//   "Sub-Saharan Africa": the four regions summed (shares: summed values over summed totals).
//   tra_eu         the Asian four (28.7%) are four separate rows; the sum is not drawn
//   tra_na         "over half of the EU's trade with Africa" is the EU's own trade by region,
//                  not a share of a region's trade: not drawn (the chart shows the EU's
//                  share of North African trade)
//   bal_na_regions the 70% share of the EU's continent-wide swing is not drawn
//   gre_intro      the $2.2bn total is in the subtitle; the rows are the actors' own values
//   hit_eu         "pharmaceuticals and aircrafts": the pharma basket is shown (aerospace is
//                  in the data, basket "aerospace")
//   pha_total      India's 6.2% of total trade is shown on the partners chart
//   agri_cen       "39% in West and North Africa" is 38.8% and 39.0%: the three regions are shown
//   agri_cen_goods (merged into agri_cen, no longer drawn) the 19% is the EU's share of Central Africa's goods exports (all goods, not
//                  agriculture), from trade_1_flows
//   agri_cen_share "less than 5% of EU–Africa goods trade" (4.8%) is not drawn: the chart shows
//                  the EU's trade with each region in $bn
//   agri_chn       the chart shows North Africa next to Sub-Saharan Africa (imports); the
//                  sentence is as in the source, but "former’s" no longer has a clear referent
//                  after the new Central Africa sentences
//   cer_rus        the year-by-year shares sit in the line under the subtitle
//   cer_ind        "However, two partners ..." opens the step; India and Russia are both
//                  highlighted
//   fer_intro      the divide between regions is shown as values by region ($bn)
//   fer_na_exp     the continent and North Africa side by side, values ($bn); the 83%, 96%
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
//   gre_intro      the $2.2bn total is in the subtitle; the rows are the actors' own values
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
//                  values by region ($bn), the shares are in the tooltips of fer_na_exp
//   fer_na_exp     the continent and North Africa side by side, values ($bn); the 83%,
//                  96% and 93% are not drawn
//   fer_ssa_imp    the 87% is not drawn; North Africa and Sub-Saharan Africa are shown in $bn
//   footnotes 2 to 4 and the cereals asterisk are drafts, from the source document;
//   the fertilizers asterisk is the source's wording
//   typos kept as in the source: "former’s agricultural trade", "in SSA."
//   not in the data: the Gulf as separate states (GCC only), South Korea / Japan / Iran /
//   Israel have rows but no text of their own

const SOURCE =
  "Data: Growth Lab, Harvard University, 2026, ‘International Trade Data (HS12)’, Harvard Dataverse, https://doi.org/10.7910/DVN/YAVJDF. Period averages, 2019–2021 vs 2022–2024. Values in current USD.";

// footnotes: one per product basket (editors' revision, November 2026)
const FN_GREEN =
  "Trade in green energy products is approximated using five six-digit HS 2012 codes covering wind turbines, solar photovoltaic products and liquid biofuels, based on Eurostat’s product groups. For details see methodological note.";
const FN_HITECH =
  "High-tech products follow Eurostat’s definition and use the high-tech aggregation under SITC Revision 4. The list is based on the OECD definition and covers technical products whose manufacture involves high R&D intensity. For details see methodological note.";
const FN_PHARMA =
  "Pharmaceutical products are defined following Eurostat’s high-technology classification, using selected six-digit HS2012 codes covering hormones, antibiotics, vaccines, immunological products and certain medicines. The basket does not include all pharmaceutical products. For details see methodological note.";
const FN_ELEC =
  "Electronics and telecommunications products are defined following Eurostat’s high-technology classification, using selected six-digit HS2012 codes covering telecommunications and networking equipment, semiconductors, integrated circuits, selected audiovisual and radar equipment, and optical-fibre cables. For details see methodological note.";
const FN_AGRI =
  "Agricultural goods are defined following Eurostat’s classification (HS chapters 01–24), (sections I–IV), covering animals and animal products, vegetable products, fats and oils, and prepared foodstuffs, beverages and tobacco. For details see methodological note.";
const FN_CEREALS =
  "Cereals are defined using HS Chapter 10, covering wheat, rice, maize, barley and other cereals, but excluding cereal flours and prepared cereal-based food products classified under other chapters. For details see methodological note.";
const FN_FERT =
  "* Fertilisers are defined using HS Chapter 31, covering organic, mineral and chemical fertilisers and their mixtures, but excluding fertiliser inputs and related chemicals classified under other chapters. For details see methodological note.";

const GEO_SHORT = {
  "North Africa": "North Africa",
  "West Africa": "West Africa",
  "Central Africa": "Central Africa",
  "East Africa and HoA": "East & Horn of Africa",
  "Southern Africa and Indian Ocean": "Southern Africa",
};

const FIVE = [
  "North Africa",
  "West Africa",
  "Central Africa",
  "East Africa and HoA",
  "Southern Africa and Indian Ocean",
];

const PRODUCT = {
  green: "Green energy products",
  hitech: "High-tech products",
  agri: "Agri-food products",
  cereals: "Cereals",
  fertilizers: "Fertilisers",
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

const where = (s) => (s.geos?.length > 1 ? ", by region" : "");

export default {
  charts: {
    partners: {
      type: "periodRange",
      data: "trade_1_partners",
      measure: "share_pct",
      title: "Africa’s trading partners",
      subtitle: (s) =>
        s.measure === "value_usd_bn"
          ? `Average annual trade with each actor, $ billion${where(s)}`
          : `Share of total trade (imports and exports) with each actor, %${where(s)}`,
      source: SOURCE,
      geoLabelsShort: GEO_SHORT,
    },

    exports: {
      type: "periodRange",
      data: "trade_1_flows",
      measure: "share_pct",
      filter: { flow: "exports" },
      title: "Africa’s trading partners: exports",
      subtitle: (s) =>
        s.measure === "value_usd_bn"
          ? `Average annual goods exports to each actor, $ billion${where(s)}`
          : `Share of goods exports to each actor, %${where(s)}`,
      source: SOURCE,
      geoLabelsShort: GEO_SHORT,
    },

    balances: {
      type: "periodRange",
      data: "trade_1_balances",
      measure: "balance_usd_bn",
      filter: { component: "total" },
      title: "Trade balances with Africa",
      subtitle: (s) =>
        `Average annual balance of each actor in ${COMPONENT[s.component ?? "total"]}, $ billion${where(s)}. A positive balance means the actor sells more than it buys.`,
      source: SOURCE,
      geoLabelsShort: GEO_SHORT,
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
        const dir = flow === "exports" ? "exports to" : "imports from";
        const base =
          s.measure === "value_usd_bn"
            ? `Average annual ${dir} each actor, $ billion`
            : `Share of Africa’s ${dir} each actor, %`;
        const tot =
          s.measure === "value_usd_bn" && Number.isFinite(info.total[0])
            ? ` (all partners: ${info.total[0].toFixed(1)} → ${info.total[1].toFixed(1)})`
            : "";
        return `${base}${tot}${where(s)}`;
      },
      source: SOURCE,
      geoLabelsShort: GEO_SHORT,
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
    bal_eu_hydro: {
      chart: "balances",
      state: { component: "hydrocarbon", highlight: ["EU"] },
    },
    bal_eu_nonhydro: {
      chart: "balances",
      state: { component: "non_hydrocarbon", highlight: ["EU"] },
    },
    bal_chn_total: { chart: "balances", state: { highlight: ["CHN"] } },
    bal_na_regions: {
      chart: "balances",
      state: { geos: FIVE, highlight: ["EU", "CHN"] },
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
        footnote: FN_GREEN,
      },
    },
    gre_share: {
      chart: "products",
      state: { product: "green", highlight: ["CHN", "EU"], footnote: FN_GREEN },
    },
    gre_na: {
      chart: "products",
      state: {
        product: "green",
        geos: ["North Africa"],
        highlight: ["CHN", "EU"],
        footnote: FN_GREEN,
      },
    },

    // ── ECON 2.2: high-tech ─────────────────────────────────────────────────
    hit_intro: {
      chart: "products",
      state: {
        product: "hitech",
        highlight: ["EU", "CHN"],
        footnote: FN_HITECH,
      },
    },
    hit_eu: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "pharma",
        highlight: ["EU", "CHN"],
        footnote: FN_PHARMA,
      },
    },
    hit_chn: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "electronics",
        highlight: ["CHN", "EU"],
        footnote: FN_ELEC,
      },
    },

    // ── ECON 2.3: pharma (India) ────────────────────────────────────────────
    pha_total: { chart: "partners", state: { highlight: ["IND"] } },
    pha_india: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "pharma",
        highlight: ["IND", "EU"],
        footnote: FN_PHARMA,
      },
    },
    pha_regions: {
      chart: "products",
      state: {
        product: "hitech",
        basket: "pharma",
        geos: ["West Africa", "Central Africa", "East Africa and HoA"],
        highlight: ["IND"],
        footnote: FN_PHARMA,
      },
    },

    // ── ECON 2.4: agri-food ─────────────────────────────────────────────────
    agri_intro: {
      chart: "products",
      state: {
        product: "agri",
        flow: "imports",
        highlight: ["EU", "CHN", "USA", "IND"],
        footnote: FN_AGRI,
      },
    },
    agri_eu_exp: {
      chart: "products",
      state: {
        product: "agri",
        flow: "exports",
        highlight: ["EU"],
        footnote: FN_AGRI,
      },
    },
    agri_cen: {
      chart: "products",
      state: {
        product: "agri",
        flow: "exports",
        geos: ["North Africa", "West Africa", "Central Africa"],
        highlight: ["EU"],
        footnote: FN_AGRI,
      },
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
        footnote: FN_AGRI,
      },
    },

    // ── ECON 2.5: cereals ───────────────────────────────────────────────────
    cer_intro: {
      chart: "products",
      state: { product: "cereals", footnote: FN_CEREALS },
    },
    cer_eu: {
      chart: "products",
      state: { product: "cereals", highlight: ["EU"], footnote: FN_CEREALS },
    },
    cer_ind: {
      chart: "products",
      state: {
        product: "cereals",
        highlight: ["IND", "RUS"],
        footnote: `${FN_CEREALS} * Despite restrictions on wheat exports from 2022 and on some rice categories from 2023, both of which were lifted by 2026 and 2024/25, respectively.`,
      },
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
        footnote: FN_FERT,
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
        footnote: FN_FERT,
      },
    },
    fer_eu_exp: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "exports",
        highlight: ["EU", "IND", "USA"],
        footnote: FN_FERT,
      },
    },
    fer_ssa_imp: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "imports",
        measure: "value_usd_bn",
        geos: ["North Africa", "Sub-Saharan Africa"],
        footnote: FN_FERT,
      },
    },
    fer_ssa_sup: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "imports",
        geos: ["Sub-Saharan Africa"],
        highlight: ["GCC", "RUS", "EU"],
        footnote: FN_FERT,
      },
    },
    fer_na_eu: {
      chart: "products",
      state: {
        product: "fertilizers",
        flow: "imports",
        geos: ["North Africa", "Sub-Saharan Africa"],
        highlight: ["EU"],
        footnote: FN_FERT,
      },
    },
  },
};
