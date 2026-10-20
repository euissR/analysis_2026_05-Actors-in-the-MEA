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
//   debtflows annual net bilateral flows 2019–24 by creditor, total as columns, for the five economies or one borrower (lineChart)
//   debtterms concessional share (y) against net flow (x), area = bilateral stock end-2024 (bubble). The step
//             debt_terms shows it as one measure (layout "column", overplotted), debt_terms_others animates it into x and y
//
// PINNED: where the text and the charts differ. The text is as written; the charts show the data.
//   split sentences (the chart shows one actor or one group at a time): fdi_us / fdi_us_israel,
//   fdi_gulf / fdi_gulf_lmi / fdi_gulf_conc, fdi_asia / fdi_asia_lmi, oda_country / oda_turkiye,
//   oda_loans / oda_models, debt_flows_rep / debt_flows_uae
//   fdi_eu         "its recorded FDI stock rose in both groups": the data show the EU's stock lower in both
//                  (high income USD 299 bn -> 270 bn, not strictly comparable because of the 2024 source
//                  switch; lower and middle income USD 13.1 bn -> 13.0 bn). Source text unchanged; author to check
//   fdi (all)      2022-24 high-income values are not fully comparable with 2019-21 (Saudi Arabia's 2024 source
//                  switch, positions missing in 2024); the chart notes say so. Averages are over the years
//                  observed, missing years are never zero
//   oda_total      "-14.8%", Türkiye 86.3%, "-3.2%": now reproduced from the headline workbook (all official
//                  providers, OECD ALLD less Iran); the chart still shows the selected actors only
//   oda_turkiye    Syria/humanitarian: now reproducible from the country workbook (95% of Türkiye's net ODA is
//                  attributed to Syria, 99% of that humanitarian); the chart shows Türkiye's total only
//   oda_loans      loan share 5.9% -> 9.7%: now reproduced (state donors + EU Institutions, incl. other bilateral);
//                  the chart shows the ten selected actors
//   oda_china      "predominantly debt", "93.1% collateralised": no instrument or collateral data
//   debt (all)     text and data updated (workbook of 15 Oct 2026, tabs visual_stocks / visual_flows /
//                  visual_concession, creditor groups are exclusive). Every figure in the debt text now
//                  reproduces from the workbook (see the checks in invest_3_debt_me.R)
//   debt_total     multilateral debt (USD 14.1 bn -> 17.4 bn): reproduced, not drawn (the chart is bilateral only)
//   debt_japan     "72% on concessional terms": reproduced (72.4%, full terms coverage), not drawn
//   debt_eu        EIB + EU claims USD 1.49 bn (2024): reproduced, not drawn (multilateral). The "+83%" is gone
//                  from the text: the EU's 2019 position is not reported (not a zero), so no change can be computed
//   debt_gulf      Saudi Arabia (1.66), Kuwait (1.11) and UAE (0.39): reproduced from the creditor-level series,
//                  but the chart shows the Gulf aggregate only
//   debt_flows_japan "turned slightly negative in 2024": reproduced (USD -71 mn), not drawn
//   debt_terms     45% / 31% concessional totals and Japan's 56%: reproduced from the World totals, not drawn
//                  (the bubble shows the shares by creditor). Reported shares are minimum indicators
//   debt_flows_total  "USD 433 million in net repayments": the total as columns plus the dashed 2022–24 average
//                  (−0.43). The annual totals (USD bn: −0.39, −0.29, −1.07, −0.22, +0.08, −1.16) show that the average
//                  hides a volatile series; 2024 is the largest repayment year
//   debt_flows_uae the UAE's lending to Jordan (USD +279 mn in 2022, one-off) is shown as the Gulf aggregate
//   intro          FDI inflows (USD 52.8 bn -> 90.3 bn), Iraq's net outflow, ODA 13.3 bn a year, USD 18.5 bn net
//                  transfers: no chart. 13.3 reproduces only for five recipients (without Syria); all six: 22.5
//   Palestine*     standard EU formula, wording to be confirmed
//   Lebanon default sentence of the debt caption: reworded (the source sentence was garbled); private creditors
//                  USD 31.4 bn, of which bonds 31.3 bn, both reproduced from the IDS series
//   intro fn 2     deleted (Yemen footnote); the footnotes are now 1-4 (FDI 2, ODA 3, China 4)
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
  "Averages of year-end net inward FDI positions in current USD for 2019–21 and 2022–24, not investment flows. Positions are attributed to immediate counterpart economies, which may differ from ultimate investors. Each position is averaged over the years in which it is observed; missing years are never set to zero or carried forward.";
const FDI_DISCONTINUITY =
  "2022–24 high-income values are not fully comparable with 2019–21. Saudi Arabia’s 2024 figures are counterpart-derived and record far less investment, and the data do not show how much of the fall reflects the change of source rather than investment movements. Several positions are also missing for 2024, among them the UK’s and the Gulf states’ in Saudi Arabia.";
const FDI_JORDAN =
  "A UK position in Jordan of about USD 8 bn, recorded only in 2021–23, raises the lower- and middle-income total in both periods; without it, the EU’s share falls from 48.3% to 46.0%.";

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
    debtterms: {
      type: "bubble",
      data: "invest_3_bubble",
      x: "net_flow_usd_bn",
      y: "concessional_pct",
      size: "stock_usd_bn",
      actors: DEBT_ACTORS,
      geos: [FIVE],
      geoLabels: GEO_LABELS,
      labels: { EU: "EU27", GCC: "Gulf" },
      title: "Lending terms of bilateral creditors",
      subtitle: "Share of each creditor’s bilateral debt that is concessional, end-2024. Bubble area: debt outstanding",
      yTitle: "Concessional share of the creditor’s claims, 2024",
      xTitle: "average annual net flow 2022–24, USD bn",
      sizeTitle: "Debt outstanding, USD bn",
      keySizes: [1, 5],
      xShort: "Net flow, USD bn a year",
      yShort: "Concessional share",
      source: SRC_DEBT,
    },
    debtflows: {
      type: "lineChart",
      data: "invest_3_flows_annual",
      value: "net_flow_usd_bn",
      actors: ["JPN", "EU", "GCC", "RUS", "CHN", "USA", "KOR"],
      total: "total",
      totalLabel: "All creditors",
      geos: [FIVE],
      geoLabels: GEO_LABELS,
      labels: { EU: "EU27", GCC: "Gulf" },
      title: "Net bilateral financial flows",
      subtitle: "Disbursements minus principal repayments, USD bn a year. Below zero: the creditor was repaid more than it lent",
      yTitle: "USD bn",
      source: SRC_DEBT,
    },
  },

  steps: {
    // ── FDI ─────────────────────────────────────────────────────────────────
    fdi_eu: { chart: "fdi", state: { highlight: ["EU"], footnote: `${FDI_NOTE} ${FDI_DISCONTINUITY} ${FDI_JORDAN}` } },
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
        highlight: ["GCC", "CHN", "IND", "JPN", "KOR"],
        footnote: FDI_DISCONTINUITY,
      },
    },
    fdi_gulf_lmi: { chart: "fdi", state: { geos: [LM], highlight: ["GCC"], footnote: FDI_JORDAN } },
    fdi_gulf_conc: { chart: "fdigulf", state: { highlight: ["ARE", "KWT"], footnote: `${FDI_DISCONTINUITY} ${FDI_JORDAN}` } },
    fdi_asia: { chart: "fdi", state: { geos: [HI], highlight: ["CHN", "IND", "JPN", "KOR"], footnote: FDI_DISCONTINUITY } },
    fdi_asia_lmi: { chart: "fdi", state: { geos: [LM], highlight: ["CHN", "USA", "IND"], footnote: FDI_JORDAN } },

    // ── official development finance ────────────────────────────────────────
    oda_total: {
      chart: "netoda",
      state: {
        highlight: ["TUR"],
        footnote:
          "4 The analysis now turns exclusively to the lower- and middle-income economies. Gulf countries and Israel don’t qualify for official development assistance under OECD rules anymore, while the World Bank's external debt statistics cover only reporting low- and middle-income economies.",
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
          "Debt stocks are compared at end-2019 and end-2024; net flows are presented as annual averages for 2019–2021 and 2022–2024. All values in current US dollars. The chart shows bilateral creditors only; multilateral debt rose from USD 14.1 billion to USD 17.4 billion. Lebanon has been in sovereign default since March 2020. Of its reported USD 31.4 billion in public and publicly guaranteed external debt owed to private creditors at end-2024, USD 31.3 billion consisted of defaulted bonds on which payments remained suspended.",
      },
    },
    debt_japan: {
      chart: "debtstock",
      state: {
        highlight: ["JPN"],
        footnote:
          "Concessional debt follows the World Bank definition of an original grant element of at least 35%. Japan’s reported terms data cover its entire stock.",
      },
    },
    debt_eu: {
      chart: "debtstock",
      state: {
        highlight: ["EU"],
        footnote:
          "The chart shows EU member states only. Claims of the European Investment Bank and the European Union are classified as multilateral and not drawn; the EU’s 2019 position is not reported (not an observed zero).",
      },
    },
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
          "The chart shows the Gulf as one aggregate; Saudi Arabia, Kuwait and the UAE are reported separately in the source. Creditor-level analysis relies primarily on reported public and publicly guaranteed external debt and may exclude off-budget, politically contested or otherwise unreported liabilities, including financing channelled through state-owned entities or linked to military support.",
      },
    },
    debt_terms: {
      chart: "debtterms",
      state: {
        layout: "column",
        highlight: ["JPN"],
        subtitle: "Share of each creditor’s bilateral debt that is concessional, end-2024. Bubble area: debt outstanding",
        footnote:
          "Concessional debt follows the World Bank definition of an original grant element of at least 35%. The shares of concessional debt in the text (31% in 2019, 45% in 2024; Japan 56% of the total) are calculated against the World totals of bilateral PPG debt.",
      },
    },
    debt_terms_others: {
      chart: "debtterms",
      state: {
        highlight: ["KOR", "EU", "GCC", "CHN"],
        subtitle: "Concessional share of bilateral debt (end-2024) against average annual net flows (2022–24). Bubble area: debt outstanding",
        footnote:
          "Creditor-level concessional shares are calculated against total bilateral PPG stocks. Where concessionality observations are missing, the resulting shares represent minimum recorded estimates rather than directly comparable portfolio averages.",
      },
    },
    debt_flows_intro: {
      chart: "debtflows",
      state: {
        highlight: [],
        footnote:
          "Negative net flows indicate that principal repayments exceeded new disbursements; net transfers additionally account for interest payments. Missing observations are excluded, never counted as zero; Syria’s 2022 flow is missing.",
      },
    },
    debt_flows_japan: {
      chart: "debtflows",
      state: {
        highlight: ["JPN"],
        footnote: "Annual values; Japan’s net flow was USD 0.63 billion in 2022, 0.85 billion in 2023 and −0.07 billion in 2024.",
      },
    },
    debt_flows_rep: { chart: "debtflows", state: { highlight: ["EU", "CHN", "USA"] } },
    debt_flows_uae: {
      chart: "debtflows",
      state: {
        geos: ["Jordan"],
        title: "Net bilateral financial flows to Jordan",
        highlight: ["GCC"],
        footnote:
          "The Gulf line adds Saudi Arabia, Kuwait and the UAE. The 2022 peak is the UAE’s lending to Jordan (USD 0.28 billion, against about zero in the other years).",
      },
    },
    debt_flows_total: {
      chart: "debtflows",
      state: {
        highlight: [],
        showTotal: true,
        average: { from: 2022, to: 2024 },
        footnote:
          "All bilateral creditors together; the dashed line is the 2022–24 average of the annual totals. Missing observations are excluded, never counted as zero; Syria’s 2022 flow is missing.",
      },
    },
  },
};
