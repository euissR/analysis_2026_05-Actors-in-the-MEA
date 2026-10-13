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
//   fdi_conc       "18 of 52 economies", EU 12 / China 5 / Türkiye 1: host-level counts are not in the workbook
//                  (the three actors are highlighted instead)
//   fdi_eu, fdi_chn, fdi_us  86% of GDP, China's 5.5% / ~12%, US 22% of Egypt and 29% of Algeria, Mauritius at 36%:
//                  host-level, not drawn. The counts of economies led (EU 35, China 13) are in the data, not drawn
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
//   ODA actors     Kuwait (net ODA −0.03 bn, loans only) and Israel (0.02 bn) have rows in the data but no text and are not
//                  drawn (Kuwait's negative value would stretch the axis); the other eight actors are
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
  "Data: IMF, Direct Investment Positions by Counterpart Economy (extract 10 December 2025); World Bank, WDI. Averages of year-end net inward positions in current USD, 2022–24; positions by immediate counterpart economy, not ultimate owner.";
const SRC_OECD =
  "Data: OECD DAC (DAC2A, DAC2B, DAC3A), USD at constant 2024 prices. Europe = EU27 + EU institutions. Three-year totals.";
const SRC_AIDDATA =
  "Data: AidData, 2025, “China’s Loans and Grants to Low- and Middle-Income Countries”, Version 1.0 (released 18 November 2025). Project-level commitments at constant 2023 prices, 2019–23.";
const SRC_OECD_PLAIN = "Data: OECD DAC (DAC2A, DAC2B, DAC3A), USD at constant 2024 prices. Three-year totals.";
const SRC_DEBT = "Data: World Bank, International Debt Statistics. Current USD.";

const ODA_ACTORS = ["EU", "USA", "SAU", "JPN", "KOR", "ARE", "QAT", "TUR"];
const DEBT_ACTORS = ["CHN", "EU", "GCC", "JPN", "IND", "RUS", "KOR", "USA", "TUR"];

const sum = (a, f) => a.reduce((s, r) => s + +f(r), 0);

export default {
  charts: {
    // ── ECON 3.2: FDI ───────────────────────────────────────────────────────
    fdi: {
      type: "panelBars",
      data: "invest_2_fdi",
      rowKey: "actor",
      rows: ["EU", "USA", "GCC", "IND", "CHN", "JPN", "TUR"],
      title: "Foreign investment positions in Africa",
      subtitle:
        "Three dimensions of each counterpart’s position, 2022–24 averages. Each panel has its own scale; bars are not comparable across panels.",
      source: SRC_FDI,
      panels: [
        {
          id: "scale",
          title: "Scale",
          subtitle: "% of recorded African inward stock",
          segments: [{ column: "scale_pct", label: "Share of African inward stock", color: "actor" }],
          format: "pct",
        },
        {
          id: "conc",
          title: "Concentration",
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
          title: "GDP-weighted share",
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
      actors: ODA_ACTORS,
      labels: { EU: "Europe" },
      title: "Net official development assistance to Africa",
      subtitle: "Net ODA, total over three years, USD bn at constant 2024 prices",
      source: SRC_OECD,
    },

    gross: {
      type: "panelBars",
      data: "invest_1_gross",
      rowKey: "actor",
      rows: ODA_ACTORS,
      rowLabels: { EU: "Europe" },
      title: "Grants and loans in official finance to Africa",
      subtitle:
        "Gross official finance (ODA and OOF) split into grants and loans, % of the total. The figure after each bar is the loans’ share.",
      source: SRC_OECD,
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
    fdi_conc: {
      chart: "fdi",
      state: {
        highlight: ["EU", "CHN", "TUR"],
        footnote:
          "* Headline continental totals require caution. Mauritius accounted for 36% of recorded African inward FDI stock in 2022–24, and its role as a financial-intermediation hub strongly shaped several actors’ apparent scale, particularly the US, India and Japan. These positions should not be equated with investment in Mauritius’s domestic productive economy.",
      },
    },
    fdi_eu: {
      chart: "fdi",
      state: {
        highlight: ["EU"],
        footnote:
          "GDP-weighted investor share is the average of the actor’s shares of individual hosts’ inward FDI stock, weighted by host GDP. This last measure is distinct from the share of African GDP represented by countries where the actor ranks first; neither measures ownership of African GDP.",
      },
    },
    fdi_chn: { chart: "fdi", state: { highlight: ["CHN"] } },
    fdi_gulf: {
      chart: "fdi",
      state: {
        highlight: ["GCC"],
        footnote:
          "Gulf positions should be treated as lower bounds because most Gulf states do not report outward positions to the IMF, leaving some bilateral relationships observable only where the African host reports them.",
      },
    },
    fdi_us: { chart: "fdi", state: { highlight: ["USA"] } },

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
