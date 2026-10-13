// ME_invest.js: Middle East and the Gulf, investment chapter ("Financing influence: investment, aid and debt")
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (invest_2_fdi -> invest_2_fdi_ME.csv)
// steps: one entry per data-step="..." in the page text (chart + state)
//
// Text as in 3_3_Middle_East_and_the_Gulf_-_external_finance.pdf. Charts:
//   fdi       FDI stock or share by counterpart, two income groups of hosts (periodRange)
//   fdigulf   each Gulf state's share of the Gulf's stock in the host group (periodRange)
//   netoda    net ODA by actor, 2019–21 vs 2022–24 (periodRange)
//   country   net ODA by recipient (periodRange, two recipients side by side)
//   gross     gross official finance, grants vs loans, both periods (panelBars)
//   china     China's AidData commitments 2019–23 by recipient (panelBars, own panel: different measure)
//   debtstock bilateral PPG debt outstanding, end-2019 vs end-2024 (periodRange)
//   debtflows net bilateral flows, 2019–21 vs 2022–24 (periodRange)
//
// PINNED: where the text and the charts differ. The text is as written; the charts show the data.
//   split sentences (the chart shows one actor or one group at a time): fdi_us / fdi_us_israel,
//   fdi_gulf / fdi_gulf_lmi / fdi_gulf_conc, fdi_asia / fdi_asia_lmi, oda_country / oda_turkiye,
//   oda_loans / oda_models, debt_flows_rep / debt_flows_uae
//   fdi_eu         "recorded FDI stock rose slightly in the high-income group, it declined in the low- and
//                  middle-income economies": the data show the EU's stock falling in the high-income group
//                  (USD 298 bn -> 269 bn) and rising slightly in the other (USD 12.5 bn -> 12.9 bn). Source
//                  text unchanged; author to check
//   oda_total      "-14.6%", Türkiye 81.9%, "-4.1%": no all-provider total in the data; the chart shows the actors
//   oda_turkiye    "overwhelmingly attributed to Syria ... humanitarian": no recipient or sector data for Türkiye
//   oda_loans      loan share 5.9% -> 9.7%: the chart shows the ten selected actors (no "Other bilateral" 2019–21)
//   oda_china      "predominantly debt", "93.1% collateralised": no instrument or collateral data
//   debt_total     multilateral debt (USD 14.1 bn -> 17.4 bn): not in the data
//   debt_japan     "72% on concessional terms": no concessional shares for the Middle East
//   debt_eu        EIB and EU institutions' claims (USD 1.49 bn, +83%): not in the data
//   debt_gulf      Saudi Arabia (1.66), Kuwait (1.11) and UAE (0.39) individually: only the Gulf aggregate
//   debt_flows_japan "turned slightly negative in 2024": annual values not exported
//   debt_flows_uae the UAE's lending to Jordan is shown as the Gulf aggregate
//   intro          FDI inflows (USD 52.8 bn -> 90.3 bn), Iraq's net outflow, ODA 13.3 bn a year, USD 18.5 bn net
//                  transfers: no chart (13.3 does not reproduce from the data)
//   Palestine*     standard EU formula, wording to be confirmed
//   Lebanon default sentence of the debt caption (USD 31.4 bn / 31.3 bn): garbled in the source and not shown
//   footnotes      all footnotes and captions on the charts are drafts, from the source document

const P1 = "2019\u201321";
const P2 = "2022\u201324";

const HI = "High income";
const LM = "Lower and middle income";
const FIVE = "Five economies";

const SRC_FDI =
  "Data: IMF, Direct Investment Positions by Counterpart Economy. Averages of year-end net inward positions in current USD.";
const SRC_OECD =
  "Data: OECD DAC (DAC2A, DAC2B, DAC3A), USD at constant 2024 prices; cumulative three-year totals. Regional aggregate excludes country-coded Iran. Saudi Arabia: regional data only.";
const SRC_AIDDATA =
  "Data: AidData, 2025, “China’s Loans and Grants to Low- and Middle-Income Countries”, Version 1.0 (released 18 November 2025). Project-level commitments at constant 2023 prices, 2019–23.";
const SRC_DEBT = "Data: World Bank, International Debt Statistics. Current USD.";

const FDI_ACTORS = ["EU", "USA", "GCC", "CHN", "IND", "JPN", "KOR"];
const GULF_STATES = ["KWT", "ARE", "SAU", "QAT", "BHR", "OMN"];
const ODA_ACTORS = ["TUR", "EU", "USA", "SAU", "JPN", "ARE", "QAT", "ISR", "KOR", "KWT"];
const DEBT_ACTORS = ["JPN", "EU", "GCC", "RUS", "CHN", "USA", "KOR", "IND", "IRN"];

const GEO_LABELS = {
  [HI]: "High-income economies",
  [LM]: "Lower- and middle-income",
  "Middle East": "Middle East",
  Israel: "Israel",
  Iraq: "Iraq",
  "Palestine*": "Palestine*",
  Jordan: "Jordan",
  [FIVE]: "Five economies",
};
const GEO_SHORT = { [HI]: "High income", [LM]: "Lower and middle income" };

const FDI_NOTE =
  "Figures are averages of year-end net inward FDI stocks in current USD for 2019–21 and 2022–24, not investment flows. Positions are attributed to immediate counterpart economies, which may differ from ultimate investors. Official observations are used where available, supplemented by counterpart-derived estimates.";
const FDI_DISCONTINUITY =
  "A significant discontinuity affects 2024: Saudi Arabia switches from official to counterpart-derived data, coinciding with a sharp fall in recorded stock. The UAE's counterpart-derived series also declines substantially. Changes in high-income investment positions should therefore be interpreted cautiously, as they may partly reflect reporting and coverage differences rather than actual investment withdrawals.";

export default {
  charts: {
    // ── FDI ─────────────────────────────────────────────────────────────────
    fdi: {
      type: "periodRange",
      data: "invest_2_fdi",
      measure: "share_pct",
      actors: FDI_ACTORS,
      geos: [HI, LM],
      geoLabels: GEO_LABELS,
      geoLabelsShort: GEO_SHORT,
      title: "Foreign direct investment in the Middle East and the Gulf",
      subtitle: "Share of recorded inward FDI stock by counterpart, 2019–21 and 2022–24 averages",
      source: SRC_FDI,
    },
    fdigulf: {
      type: "periodRange",
      data: "invest_2_fdi_gulf",
      measure: "share_pct",
      actors: GULF_STATES,
      geos: [HI, LM],
      geoLabels: GEO_LABELS,
      geoLabelsShort: GEO_SHORT,
      labels: { KWT: "Kuwait", ARE: "UAE", SAU: "Saudi Arabia", QAT: "Qatar", BHR: "Bahrain", OMN: "Oman" },
      title: "Where the Gulf’s investment sits",
      subtitle: "Each Gulf state’s share of the Gulf’s recorded FDI stock, 2019–21 and 2022–24 averages",
      source: SRC_FDI,
    },

    // ── official development finance ────────────────────────────────────────
    netoda: {
      type: "periodRange",
      data: "invest_1_netoda",
      measure: "value_usd_bn",
      actors: ODA_ACTORS,
      geos: ["Middle East"],
      labels: { EU: "Europe" },
      title: "Net official development assistance to the Middle East",
      subtitle: "Selected providers, net ODA, total over three years, USD bn at constant 2024 prices",
      source: SRC_OECD,
    },
    country: {
      type: "periodRange",
      data: "invest_1_country",
      measure: "value_usd_bn",
      actors: ["EU", "USA", "JPN", "ARE", "QAT", "ISR", "KOR", "KWT"],
      geos: ["Iraq", "Palestine*"],
      geoLabels: GEO_LABELS,
      labels: { EU: "Europe" },
      title: "Net ODA by recipient",
      subtitle: "Selected providers with recipient-level data, total over three years, USD bn at constant 2024 prices",
      source: SRC_OECD,
    },
    gross: {
      type: "panelBars",
      data: "invest_1_gross",
      rowKey: "actor",
      rows: ODA_ACTORS,
      rowLabels: { EU: "Europe" },
      title: "Grants and loans in official finance",
      subtitle:
        "Gross official finance (ODA and OOF) split into grants and loans, % of the total. The figure after each bar is the loans’ share.",
      source: SRC_OECD,
      panels: [P1, P2].map((p) => ({
        id: p,
        title: p,
        where: { geo: "Middle East", period: p },
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
      title: "China’s official-finance commitments",
      subtitle:
        "Adjusted commitments 2019–23 by recipient, USD bn at constant 2023 prices. Commitments, not disbursements: not comparable with the OECD figures.",
      source: SRC_AIDDATA,
      panels: [
        {
          id: "china",
          title: "2019–23",
          segments: [{ column: "total_usd_bn", label: "Commitments", color: "CHN" }],
          format: "bn",
        },
      ],
    },

    // ── official bilateral lending ──────────────────────────────────────────
    debtstock: {
      type: "periodRange",
      data: "invest_3_stock",
      measure: "value_usd_bn",
      periods: ["End-2019", "End-2024"],
      actors: [...DEBT_ACTORS, "other"],
      geos: [FIVE],
      geoLabels: GEO_LABELS,
      labels: { EU: "EU27", GCC: "Gulf", other: "Other" },
      title: "Bilateral official debt of the five borrowers",
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
      geos: [FIVE],
      geoLabels: GEO_LABELS,
      labels: { EU: "EU27", GCC: "Gulf" },
      title: "Net bilateral financial flows",
      subtitle:
        "Disbursements minus principal repayments, average USD bn a year. Negative: the creditor was repaid more than it lent",
      source: SRC_DEBT,
    },
  },

  steps: {
    // ── FDI ─────────────────────────────────────────────────────────────────
    fdi_eu: { chart: "fdi", state: { highlight: ["EU"], footnote: FDI_NOTE } },
    fdi_us: {
      chart: "fdi",
      state: {
        geos: [HI],
        measure: "value_usd_bn",
        subtitle: "Recorded inward FDI stock in high-income economies by counterpart, USD bn, 2019–21 and 2022–24 averages",
        highlight: ["USA"],
        footnote: FDI_DISCONTINUITY,
      },
    },
    fdi_us_israel: {
      chart: "fdi",
      state: {
        geos: ["Israel"],
        measure: "value_usd_bn",
        title: "Foreign direct investment in Israel",
        subtitle: "Recorded inward FDI stock by counterpart, USD bn, 2019–21 and 2022–24 averages",
        highlight: ["USA"],
      },
    },
    fdi_gulf: {
      chart: "fdi",
      state: {
        geos: [HI],
        measure: "value_usd_bn",
        subtitle: "Recorded inward FDI stock in high-income economies by counterpart, USD bn, 2019–21 and 2022–24 averages",
        highlight: ["GCC", "CHN", "IND", "JPN"],
        footnote: FDI_DISCONTINUITY,
      },
    },
    fdi_gulf_lmi: { chart: "fdi", state: { geos: [LM], highlight: ["GCC"] } },
    fdi_gulf_conc: { chart: "fdigulf", state: { highlight: ["ARE", "KWT"] } },
    fdi_asia: { chart: "fdi", state: { geos: [HI], highlight: ["CHN", "IND", "JPN", "KOR"] } },
    fdi_asia_lmi: { chart: "fdi", state: { geos: [LM], highlight: ["CHN", "USA", "IND"] } },

    // ── official development finance ────────────────────────────────────────
    oda_total: {
      chart: "netoda",
      state: {
        highlight: ["TUR"],
        footnote:
          "3 The analysis now turns exclusively to the lower- and middle-income economies. Gulf countries and Israel don’t qualify for official development assistance under OECD rules anymore, while the World Bank's external debt statistics cover only reporting low- and middle-income economies.",
      },
    },
    oda_rank: {
      chart: "netoda",
      state: {
        highlight: ["TUR", "EU", "USA"],
        footnote:
          "Donor rankings refer only to selected reporting actors. The regional aggregate excludes country-coded Iran but retains regional and unspecified allocations. Saudi Arabia is included in regional comparisons but excluded from country-level analysis because recipient-level allocations are unavailable.",
      },
    },
    oda_expand: { chart: "netoda", state: { highlight: ["JPN", "ARE", "SAU"] } },
    oda_country: {
      chart: "country",
      state: { highlight: ["JPN", "EU", "ARE"], footnote: "*** Among selected providers with recipient-level net ODA data." },
    },
    oda_turkiye: { chart: "netoda", state: { highlight: ["TUR"] } },
    oda_loans: {
      chart: "gross",
      state: {
        footnote:
          "Gross official finance includes ODA and OOF grant and loan disbursements, before deducting repayments; OOF equity is excluded. Loan shares are calculated from gross official finance, including ODA and other official flows (OOF).",
      },
    },
    oda_models: { chart: "gross", state: { highlight: ["JPN", "ARE", "SAU"] } },
    oda_china: {
      chart: "china",
      state: {
        highlight: ["Iraq"],
        footnote:
          "** China’s figures are based on AidData’s adjusted official-finance commitments for 2019–23, expressed in constant 2023 USD. These cover commitments rather than actual disbursements, include ODA-like and OOF-like financing, and are not directly comparable with OECD disbursement figures or added to OECD donor rankings. 4 https://www.aiddata.org/publications/iraq-profile-of-chinese-development-finance-2000-2023",
      },
    },

    // ── official bilateral lending ──────────────────────────────────────────
    debt_total: {
      chart: "debtstock",
      state: {
        highlight: [],
        footnote:
          "Debt stocks are compared at end-2019 and end-2024; net flows are presented as annual averages for 2019–2021 and 2022–2024. All values in current US dollars.",
      },
    },
    debt_japan: { chart: "debtstock", state: { highlight: ["JPN"] } },
    debt_eu: { chart: "debtstock", state: { highlight: ["EU"] } },
    debt_others: {
      chart: "debtstock",
      state: {
        highlight: ["USA", "CHN", "RUS"],
        footnote:
          "Data gaps and largely frozen debt positions complicate comparisons for Syria and Yemen; Palestine* is not covered.",
      },
    },
    debt_gulf: {
      chart: "debtstock",
      state: {
        highlight: ["GCC"],
        footnote:
          "Creditor-level analysis relies primarily on reported public and publicly guaranteed external debt and may exclude off-budget, politically contested or otherwise unreported liabilities, including financing channelled through state-owned entities or linked to military support.",
      },
    },
    debt_flows_intro: {
      chart: "debtflows",
      state: {
        highlight: [],
        footnote:
          "Negative net flows indicate that principal repayments exceeded new disbursements; net transfers additionally account for interest payments.",
      },
    },
    debt_flows_japan: { chart: "debtflows", state: { highlight: ["JPN"] } },
    debt_flows_rep: { chart: "debtflows", state: { highlight: ["EU", "CHN", "USA"] } },
    debt_flows_uae: {
      chart: "debtflows",
      state: {
        geos: ["Jordan"],
        title: "Net bilateral financial flows to Jordan",
        highlight: ["GCC"],
      },
    },
  },
};
