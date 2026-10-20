// AF_invest.js: Africa, investment chapter ("Financing influence: investment, aid and debt", ECON 3.x)
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (invest_2_fdi -> invest_2_fdi_AF.csv)
//   extra: further data files, { name: "file_{suffix}" } -> extra.name
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of js/charts/periodRange.js, panelBars.js, bubble.js)
//
// Text as in 2_3_Africa_-_external_finance.pdf. Charts:
//   fdiscale  share of recorded African inward FDI stock by investor, 2019–21 vs 2022–24*, with and without Mauritius (ECON 3.2)
//   fdimap    map of host economies: bubble = recorded stock (all investors, coloured by the leading one) or one investor's position (ECON 3.2)
//   fdi       three panels per counterpart: scale, concentration (Mauritius split), GDP-weighted share (ECON 3.2)
//   netoda    net ODA by actor, 2019–21 vs 2022–24 (ECON 3.1)
//   gross     gross official finance, grants vs loans, both periods (ECON 3.1)
//   china     China's AidData commitments 2019–23, by region (ECON 3.1, own panel: different measure)
//   geo       where each actor's finance went, 2022–24, by subregion (ECON 3.1)
//   context   gross official finance by type of provider (ECON 3.1)
//   debtstock bilateral PPG debt outstanding, end-2019 vs end-2024 (ECON 3.3)
//   debtflows net bilateral flows, 2019–21 vs 2022–24 (ECON 3.3)
//   debtterms bubble per creditor: net flows x concessional share x debt outstanding (ECON 3.3)
//
// PINNED: where the text and the charts differ. The text is as written; the charts show the data.
//   split sentences (the chart shows one actor at a time, or the sentence needs two charts): fdi_gulf / fdi_us,
//   oda_europe / oda_us / oda_saudi, oda_geo / oda_geo_uae / oda_geo_chn, debt_china / debt_china_flows,
//   debt_europe / debt_gulf, debt_terms / debt_terms_cn
//   fdi_*          all figures of the FDI text are in the workbook and are checked in invest_2 fdi_af.R. Not drawn as such:
//                  the counts (18 of 52 over half, EU 12 / China 5 / Türkiye 1; EU leads 35, China 13) and the GDP and stock
//                  shares of the economies led (86%, 5.5%, ~12%): the map highlights those economies instead. The highlight
//                  lists (OVER_HALF, EU_LED, CHN_LED) are typed in below: the R script prints them, compare after a data update
//   fdi_scale*     the first paragraph is split at sentence level (EU / Gulf / India / US and China); chart shows the seven named
//                  investors, "other" (43.7% of the stock) is in the data but not drawn
//   fdi_chn_gdp    split from fdi_chn (the map shows where China leads, the three-panel chart its scale vs GDP-weighted share)
//   fdi_gulf       text says "eld" in the source (pasted); read as "held"
//   fdimap         "all" = total recorded stock per host, tooltip reads "All foreign actors" (it includes unlisted counterparts);
//                  Sudan and South Sudan are not drawn (no shares); one bubble scale throughout (Mauritius, USD 342 bn, sets it)
//   oda_europe     "most of the decline coming from EU Institutions": no EU institutions / member states split
//   oda_china      "two-thirds infrastructure-related": no sector data. China is commitments (2019–23, constant 2023 USD),
//                  its own chart, never on the OECD axis
//   oda_geo_uae    "49.3% in Chad": country level, not in the data; Central Africa's share is shown
//   oda_geo        China's row in the regional chart is the share of its AidData commitments, flagged in the subtitle
//   oda_multi      the changes (donors down, multilateral +19.7%, total +2.6%) are in the text only; the chart shows totals
//   debt_europe    "European institutions held USD 13.8 bn (multilateral)": not in the data
//   debt_shift     USD 1,175.5 bn total external debt (+21%) and USD 264.5 bn multilateral PPG claims (+49%): not in the
//                  data; the chart shows bilateral stocks (total in the subtitle)
//   debt_gulf      "Sudan³ Russia’s": full stop missing in the source, kept
//   intro          remittances / FDI / ODA by region and the net-transfer figures (USD 97.0 bn → −7.5 bn): no chart
//   footnotes      all footnotes and captions on the charts are drafts, from the source document
//   ODA actors     Israel (0.02 bn) has rows in the data but no text and is not drawn. Kuwait and "Other bilateral"
//                  (13 further donors) are drawn for context only (ODA_CONTEXT): they are already inside the donor
//                  aggregate and are never added to Europe, the US or any total. Kuwait's tiny negative net ODA no
//                  longer stretches the axis (periodRange.js)
//   Gulf states    the individual Gulf states (Saudi Arabia, UAE, Qatar, Kuwait) share the Gulf colour

const P1 = "2019\u201321";
const P2 = "2022\u201324";

const FIVE = [
  "North Africa",
  "West Africa",
  "Central Africa",
  "East Africa and HoA",
  "Southern Africa and Indian Ocean",
];
const GEO_SHORT = {
  Africa: "Africa",
  "North Africa": "North",
  "West Africa": "West",
  "Central Africa": "Central",
  "East Africa and HoA": "East & Horn",
  "Southern Africa and Indian Ocean": "Southern",
};

const SRC_FDI =
  "Data: IMF, Direct Investment Positions by Counterpart Economy (extract 10 December 2025); World Bank, WDI. Averages of year-end net inward FDI stocks (not flows) in current USD, by immediate counterpart (not ultimate owner); official data where available, otherwise counterpart-derived, each position averaged over the years observed. * 2022–24: eight economies switch from official to counterpart-derived data in 2023 or 2024; read changes as indicative.";
const SRC_FDI_NOTES =
  "Mauritius, a financial hub, holds 36% of recorded stock, including most US, Indian and Japanese positions; about a third of stock is attributed to other non-African economies, notably the UK and financial centres. Gulf (six GCC states): lower bound, as only Kuwait reports outward positions. EU: 27 member states.";
const FDI_GEO_LABELS = { Africa: "Africa (54 economies)", "Africa excl. Mauritius": "Africa excl. Mauritius (53)" };
const FDI_GEO_SHORT = { Africa: "All of Africa", "Africa excl. Mauritius": "Excluding Mauritius" };
// economies highlighted on the map (from the workbook, tab visual_detail; printed by invest_2 fdi_af.R)
const OVER_HALF = ["EGY", "MAR", "ETH", "AGO", "COD", "UGA", "CMR", "TUN", "LBY", "GAB", "TCD", "NER", "COG", "SOM", "MRT", "CPV", "STP", "ERI"]; // 18
const EU_LED = ["NGA", "EGY", "ZAF", "DZA", "MAR", "KEN", "AGO", "CIV", "GHA", "TZA", "UGA", "CMR", "TUN", "LBY", "SEN", "ZMB", "BFA", "GAB", "BWA", "BEN", "MDG", "COG", "RWA", "GNQ", "MWI", "MRT", "TGO", "SLE", "LBR", "CAF", "CPV", "GMB", "SYC", "GNB", "STP"]; // 35
const CHN_LED = ["ETH", "COD", "ZWE", "MLI", "GIN", "TCD", "NER", "NAM", "DJI", "BDI", "LSO", "COM", "ERI"]; // 13
const SRC_OECD =
  "Data: OECD DAC (DAC2A, DAC2B, DAC3A), USD at constant 2024 prices. Europe = EU27 + EU institutions. Three-year totals.";
const SRC_AIDDATA =
  "Data: AidData, 2025, “China’s Loans and Grants to Low- and Middle-Income Countries”, Version 1.0 (released 18 November 2025). Project-level commitments at constant 2023 prices, 2019–23.";
const SRC_OECD_PLAIN = "Data: OECD DAC (DAC2A, DAC2B, DAC3A), USD at constant 2024 prices. Three-year totals.";
const SRC_DEBT = "Data: World Bank, International Debt Statistics. Current USD.";

const ODA_ACTORS = ["EU", "USA", "SAU", "JPN", "KOR", "ARE", "QAT", "TUR"];
// drawn for context, already included in the donor aggregate (invest_1_context): never added to any total
const ODA_CONTEXT = ["KWT", "other"];
const ODA_LABELS = { EU: "Europe", KWT: "Kuwait", other: "Other bilateral" };
const CONTEXT_NOTE =
  "Other bilateral: 13 further donors (among them the UK, Canada, Norway and Switzerland). Kuwait and other bilateral donors are shown for context; they are already counted in the donor aggregate.";
const DEBT_ACTORS = ["CHN", "EU", "GCC", "JPN", "IND", "RUS", "KOR", "USA", "TUR"];

const sum = (a, f) => a.reduce((s, r) => s + +f(r), 0);

export default {
  charts: {
    // ── ECON 3.2: FDI ───────────────────────────────────────────────────────
    fdiscale: {
      type: "periodRange",
      data: "invest_2_scale",
      periods: [P1, `${P2}*`],
      measure: "share_pct",
      geos: ["Africa", "Africa excl. Mauritius"],
      geoLabels: FDI_GEO_LABELS,
      geoLabelsShort: FDI_GEO_SHORT,
      actors: ["EU", "USA", "GCC", "IND", "CHN", "JPN", "TUR"],
      labels: { GCC: "Gulf" },
      title: "Who holds Africa’s recorded foreign investment",
      subtitle: (s, info) =>
        `Share of recorded inward FDI stock by investor${
          Number.isFinite(info.total[0])
            ? `. Total stock: USD ${info.total[0].toFixed(0)} bn in ${P1}, USD ${info.total[1].toFixed(0)} bn in ${P2}*`
            : ""
        }`,
      source: `${SRC_FDI} ${SRC_FDI_NOTES}`,
    },

    fdimap: {
      type: "geoBubbles",
      data: "invest_2_map",
      measures: {
        fdi: {
          title: "Where foreign investment is held",
          subtitle: (actor, label) =>
            actor === "all"
              ? `Recorded inward FDI stock by host economy, USD bn, ${P2}*. Colour: the leading listed investor.`
              : `${label}’s recorded FDI position by host economy, USD bn, ${P2}*`,
          unit: "USD bn",
          format: ",.2~f", // 342, 62.6, 0.01: no trailing zeros, also for the size key
          sizeTitle: "Bubble area, USD bn",
          sharedScale: true, // one scale in every step: the same number is the same size
          keyAll: [10, 100, 300],
        },
      },
      labels: { GCC: "Gulf" },
      title: "Where foreign investment is held",
      source: `${SRC_FDI} Sudan and South Sudan are not shown (no shares). ${SRC_FDI_NOTES}`,
    },

    fdi: {
      type: "panelBars",
      data: "invest_2_fdi",
      rowKey: "actor",
      rows: ["EU", "USA", "GCC", "IND", "CHN", "JPN", "TUR"],
      rowLabels: { GCC: "Gulf" },
      title: "Foreign investment positions in Africa",
      subtitle:
        "Three dimensions of each investor’s position, 2022–24*. Each panel has its own scale; bars are not comparable across panels.",
      source: `${SRC_FDI} Scale: share of recorded African stock. Concentration: share of the investor’s African position in its top three hosts (Mauritius shown separately). GDP-weighted investor share: the investor’s average share of host economies’ stock, weighted by their GDP; a lower bound, not a share of African GDP (Sudan, South Sudan and Eritrea excluded). ${SRC_FDI_NOTES}`,
      panels: [
        {
          id: "scale",
          title: "Scale*",
          subtitle: "% of recorded African inward stock",
          segments: [{ column: "scale_pct", label: "Share of African inward stock", color: "actor" }],
          format: "pct",
        },
        {
          id: "conc",
          title: "Concentration*",
          subtitle: "three largest hosts, % of own position",
          segments: [
            { column: "conc_mauritius_pct", label: "of which Mauritius", color: "light" },
            { column: "conc_other_pct", label: "other top-3 hosts", color: "actor" },
          ],
          domain: [0, 100],
          format: "pct",
        },
        {
          id: "gdp",
          title: "GDP-weighted share*",
          subtitle: "average share of host stock, weighted by host GDP",
          segments: [{ column: "gdp_weighted_pct", label: "GDP-weighted investor share", color: "actor" }],
          format: "pct",
        },
      ],
      key: [
        { label: "Mauritius (conduit)", color: "light" },
        { label: "Other top-3 hosts (actor colour)", color: "ink" },
      ],
    },

    // ── ECON 3.1: official development finance ──────────────────────────────
    netoda: {
      type: "periodRange",
      data: "invest_1_netoda",
      measure: "value_usd_bn",
      actors: [...ODA_ACTORS, ...ODA_CONTEXT],
      labels: ODA_LABELS,
      title: "Net official development assistance to Africa",
      subtitle: "Net ODA, total over three years, USD bn at constant 2024 prices",
      source: `${SRC_OECD} ${CONTEXT_NOTE}`,
    },

    gross: {
      type: "panelBars",
      data: "invest_1_gross",
      rowKey: "actor",
      rows: [...ODA_ACTORS, ...ODA_CONTEXT],
      rowLabels: ODA_LABELS,
      rowColors: { other: "#8e8e8e" }, // darker grey than the loans segment, so grants and loans differ
      title: "Grants and loans in official finance to Africa",
      subtitle:
        "Gross official finance (ODA and OOF) split into grants and loans, % of the total. The figure after each bar is the loans’ share.",
      source: `${SRC_OECD} ${CONTEXT_NOTE}`,
      panels: [P1, P2].map((p) => ({
        id: p,
        title: p,
        where: { geo: "Africa", period: p },
        segments: [
          { column: "grant_share_pct", label: "Grants", color: "actor" },
          { column: "loan_share_pct", label: "Gross loans", color: "light" },
        ],
        domain: [0, 100],
        format: "pct0",
        endLabel: { column: "loan_share_pct" },
      })),
      key: [
        { label: "Grants (actor colour)", color: "ink" },
        { label: "Gross loans", color: "light" },
      ],
    },

    china: {
      type: "panelBars",
      data: "invest_1_china",
      rowKey: "geo",
      rows: ["Africa", ...FIVE],
      rowLabels: GEO_SHORT,
      title: "China’s official-finance commitments to Africa",
      subtitle: "Adjusted commitments 2019–23, USD bn at constant 2023 prices. Commitments, not disbursements: not comparable with the OECD figures.",
      source: SRC_AIDDATA,
      panels: [
        {
          id: "china",
          title: "2019–23",
          segments: [
            { column: "oda_like_usd_bn", label: "ODA-like", color: "CHN", opacity: 1 },
            { column: "oof_like_usd_bn", label: "OOF-like", color: "CHN", opacity: 0.55 },
            { column: "vague_usd_bn", label: "Vague (ODA or OOF)", color: "CHN", opacity: 0.25 },
          ],
          format: "bn",
        },
      ],
      key: [
        { label: "ODA-like", color: "CHN", opacity: 1 },
        { label: "OOF-like", color: "CHN", opacity: 0.55 },
        { label: "Vague (ODA or OOF)", color: "CHN", opacity: 0.25 },
      ],
    },

    geo: {
      type: "panelBars",
      data: "invest_1_gross",
      extra: { china: "invest_1_china_{suffix}" },
      rowKey: "actor",
      rows: ["EU", "USA", "JPN", "KOR", "ARE", "QAT", "TUR", "CHN"],
      rowLabels: { EU: "Europe", CHN: "China*" },
      title: "Where official finance went",
      subtitle:
        "Share of each actor’s country-coded gross official finance by subregion, 2022–24, %. *China: share of AidData commitments, 2019–23.",
      source: `${SRC_OECD} ${SRC_AIDDATA}`,
      // OECD: gross finance by subregion as a share of the five subregions; China: the same for commitments
      prepare: ({ rows, extra }) => {
        const out = [];
        const byActor = {};
        rows
          .filter((r) => r.period === P2 && FIVE.includes(r.geo) && r.gross_usd_bn !== "")
          .forEach((r) => (byActor[r.actor] ??= []).push(r));
        Object.entries(byActor).forEach(([actor, rs]) => {
          const tot = sum(rs, (r) => r.gross_usd_bn);
          rs.forEach((r) => out.push({ actor, geo: r.geo, share_pct: tot ? (+r.gross_usd_bn / tot) * 100 : "" }));
        });
        const cn = extra.china.filter((r) => FIVE.includes(r.geo));
        const ctot = sum(cn, (r) => r.total_usd_bn);
        cn.forEach((r) => out.push({ actor: "CHN", geo: r.geo, share_pct: (+r.total_usd_bn / ctot) * 100 }));
        return out;
      },
      panels: FIVE.map((g) => ({
        id: g,
        title: GEO_SHORT[g],
        where: { geo: g },
        segments: [{ column: "share_pct", label: "Share of own finance", color: "actor" }],
        domain: [0, 60],
        format: "pct0",
      })),
    },

    context: {
      type: "panelBars",
      data: "invest_1_context",
      rowKey: "group",
      rows: ["donors", "multilateral", "all"],
      rowLabels: { donors: "Donors*", multilateral: "Multilateral", all: "All official" },
      title: "Gross official finance to Africa, by type of provider",
      subtitle: "Three-year totals, USD bn at constant 2024 prices. *Sovereign donors plus EU institutions.",
      source: SRC_OECD_PLAIN,
      panels: [P1, P2].map((p) => ({
        id: p,
        title: p,
        where: { period: p },
        segments: [
          { column: "grants_usd_bn", label: "Grants", color: "teal3" },
          { column: "loans_usd_bn", label: "Gross loans", color: "light" },
        ],
        scale: "shared",
        format: "bn",
      })),
      key: [
        { label: "Grants", color: "teal3" },
        { label: "Gross loans", color: "light" },
      ],
    },

    // ── ECON 3.3: official bilateral lending ────────────────────────────────
    debtstock: {
      type: "periodRange",
      data: "invest_3_stock",
      measure: "value_usd_bn",
      periods: ["End-2019", "End-2024"],
      actors: [...DEBT_ACTORS, "GBR", "other"],
      labels: { EU: "EU27", GCC: "Gulf", GBR: "UK", other: "Other" },
      title: "Africa’s bilateral official debt",
      subtitle: (s, info) =>
        `Public and publicly guaranteed bilateral debt outstanding by creditor, USD bn${
          Number.isFinite(info.total[0])
            ? `. All creditors: ${info.total[0].toFixed(1)} at end-2019, ${info.total[1].toFixed(1)} at end-2024`
            : ""
        }`,
      source: SRC_DEBT,
    },

    debtflows: {
      type: "periodRange",
      data: "invest_3_flows",
      measure: "net_flow_usd_bn",
      actors: DEBT_ACTORS,
      labels: { EU: "EU27", GCC: "Gulf" },
      title: "Net bilateral financial flows to Africa",
      subtitle:
        "Disbursements minus principal repayments, average USD bn a year. Negative: the creditor was repaid more than it lent",
      source: SRC_DEBT,
    },

    debtterms: {
      type: "bubble",
      data: "invest_3_bubble",
      x: "net_flow_usd_bn_2022_24",
      y: "conc_share_pct_2024",
      size: "stock_usd_bn_2024",
      actors: DEBT_ACTORS,
      labels: { EU: "EU27", GCC: "Gulf" },
      geoLabels: GEO_SHORT,
      xTitle: "net bilateral flows 2022–24, USD bn a year",
      yTitle: "Concessional share of debt outstanding, end-2024",
      sizeTitle: "Debt outstanding, end-2024, USD bn",
      yShort: "Concessional share",
      xShort: "Net flows 2022–24, USD bn a year",
      title: "Africa’s bilateral creditors: terms and direction of lending",
      subtitle: "Net flows, concessional share and debt outstanding of each creditor",
      source: SRC_DEBT,
    },
  },

  steps: {
    // ── ECON 3.2: FDI ───────────────────────────────────────────────────────
    fdi_scale: { chart: "fdiscale", state: { highlight: ["EU"] } },
    fdi_scale_gulf: {
      chart: "fdiscale",
      state: {
        highlight: ["GCC"],
        footnote:
          "Gulf positions should be treated as lower bounds: only Kuwait, of the six Gulf states, reports outward positions to the IMF, leaving other bilateral relationships observable only where the African host reports them.",
      },
    },
    fdi_scale_ind: { chart: "fdiscale", state: { highlight: ["IND"] } },
    fdi_scale_stable: { chart: "fdiscale", state: { highlight: ["USA", "CHN"] } },
    fdi_conc: {
      chart: "fdimap",
      state: {
        measure: "fdi",
        actor: "all",
        highlight: OVER_HALF,
        footnote:
          "* Headline continental totals require caution. Mauritius accounted for 36% of recorded African inward FDI stock in 2022–24, and its role as a financial-intermediation hub strongly shaped several actors’ apparent scale, particularly the US, India and Japan. These positions should not be equated with investment in Mauritius’s domestic productive economy.",
      },
    },
    fdi_eu: { chart: "fdimap", state: { measure: "fdi", actor: "all", highlight: EU_LED } },
    fdi_chn: { chart: "fdimap", state: { measure: "fdi", actor: "all", highlight: CHN_LED } },
    fdi_chn_gdp: {
      chart: "fdi",
      state: {
        highlight: ["CHN"],
        footnote:
          "GDP-weighted investor share is the average of the investor’s shares of individual hosts’ inward FDI stock, weighted by host GDP. This last measure is distinct from the share of African GDP represented by countries where the investor ranks first; neither measures ownership of African GDP.",
      },
    },
    fdi_gulf: {
      chart: "fdimap",
      state: {
        measure: "fdi",
        actor: "GCC",
        labels: ["MOZ", "MUS", "MAR"],
        footnote:
          "Gulf positions should be treated as lower bounds because most Gulf states do not report outward positions to the IMF, leaving some bilateral relationships observable only where the African host reports them.",
      },
    },
    fdi_us: { chart: "fdimap", state: { measure: "fdi", actor: "USA", labels: ["EGY", "DZA", "MUS"] } },

    // ── ECON 3.1: official development finance ──────────────────────────────
    oda_europe: { chart: "netoda", state: { highlight: ["EU"] } },
    oda_us: { chart: "netoda", state: { highlight: ["USA"] } },
    oda_saudi: { chart: "netoda", state: { highlight: ["SAU"] } },
    oda_grants: {
      chart: "gross",
      state: {
        highlight: ["EU", "USA", "SAU", "JPN"],
        footnote:
          "Gross official finance includes ODA and OOF grant and loan disbursements, before deducting repayments; OOF equity is excluded.",
      },
    },
    oda_china: {
      chart: "china",
      state: {
        highlight: ["Africa"],
        footnote:
          "China’s figures are based on AidData’s adjusted official-finance commitments for 2019–23, expressed in constant 2023 USD. These cover commitments rather than actual disbursements, include ODA-like and OOF-like financing, and are not directly comparable with OECD disbursement figures or added to OECD donor rankings.",
      },
    },
    oda_geo: {
      chart: "geo",
      state: {
        highlight: ["EU", "USA", "CHN"],
        footnote:
          "Country-coded refers to OECD flows allocated to individual African recipient countries; regional and unspecified flows are excluded. Saudi Arabia is therefore excluded from this geographic analysis because its reported Africa flows are available only at aggregate level.",
      },
    },
    oda_geo_uae: { chart: "geo", state: { highlight: ["ARE"] } },
    oda_geo_chn: { chart: "geo", state: { highlight: ["CHN"] } },
    oda_multi: { chart: "context", state: {} },

    // ── ECON 3.3: official bilateral lending ────────────────────────────────
    debt_china: {
      chart: "debtstock",
      state: {
        highlight: ["CHN"],
        footnote:
          "* Lack of data for Libya, Namibia, Seychelles and South Sudan. The UAE–Egypt reporting break materially affects bilateral-stock comparisons.",
      },
    },
    debt_china_flows: {
      chart: "debtflows",
      state: {
        highlight: ["CHN"],
        footnote:
          "Net flows are annual measures, shown as average annual values for 2019–2021 and 2022–2024. All monetary values are current US dollars.",
      },
    },
    debt_europe: { chart: "debtstock", state: { highlight: ["EU"] } },
    debt_gulf: {
      chart: "debtstock",
      state: {
        highlight: ["GCC", "RUS", "USA"],
        footnote:
          "3 Their recorded stock was lower than in 2019, but the comparison is materially affected by the UAE–Egypt reporting break and should not be read simply as creditor withdrawal.",
      },
    },
    debt_terms: {
      chart: "debtterms",
      state: {
        highlight: ["JPN", "KOR", "EU"],
        footnote:
          "Concessional per World Bank definition: having an original grant element of 35% or more.",
      },
    },
    debt_terms_cn: {
      chart: "debtterms",
      state: {
        highlight: ["CHN", "GCC"],
        footnote:
          "4 Incomplete reporting means that these figures should be treated as minimum estimates rather than directly comparable portfolio averages.",
      },
    },
    debt_shift: {
      chart: "debtstock",
      state: {
        highlight: [],
        footnote:
          "Debt stocks are point-in-time measures and are compared at end-2019 and end-2024. They are not averaged across three years.",
      },
    },
  },
};
