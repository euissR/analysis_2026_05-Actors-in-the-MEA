// ME_infra.js: Middle East and the Gulf, infrastructure chapter ("Anchoring Ties: infrastructure and construction")
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (infra_1_shares -> infra_1_shares_ME.csv)
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of js/charts/panelBars.js)
//
// Text as in 3_4_Middle_East_and_the_Gulf_-_Infrastructure.docx. Data: Middle_East_Infrastructure_Visual_Ready_final_23_10_2026.xlsx.
// No map: the hosts are six low- and middle-income economies (three to six with data per measure). Charts:
//   shares   suppliers vs sponsors: PPI sponsor share (left) and non-domestic award share (right), same actor order;
//            the works-only share is a dot on the procurement panel (steps pro_*, ppi_*)
//   conc     host concentration (panelBars, rows picked per step): Jordan's share of all, EU27 and Gulf
//            sponsor stakes (PPI); Iraq's share of all, Türkiye and Gulf award value, with Iraq's share of works
//            awards as the dot on the "all" row (steps conc_*)
//
// PINNED: where the text and the charts differ. The text is as written; the charts show the data.
//   split sentences (one chart shows one panel at a time): pro_tur / pro_other, ppi_other / ppi_uae
//   ppi_vintage    "95.7% foreign-linked proxies closed before 2019": the workbook's 95.7% is the share of attributed
//                  PPI weight; counted as proxies it is 58 of 61 = 95.1% (checked in infra_2_concentration_me.R).
//                  Text as written; author to check. No series for closure year: the step keeps the PPI panel,
//                  the 58 / 3 split is not drawn
//   PPI caption    "The detailed attribution and deduplication rules are consolidated in note 6": note 6 is the
//                  MPE concentration note, no note holds the attribution rules. Sentence left out of the chart footnote
//   pro_works      12 contracts, $209.8 m and the 25.3% of all works value are reproduced, not drawn; the dot
//                  shows the works share on the same axis as the broad bar (own denominator)
//   conc_ppi       "40 of the 61 foreign-linked proxies" reproduced, not drawn
//   conc_ipf       footnote 6 (the two MPE contracts; Türkiye 16.3% and other African/Middle Eastern 30.2% without
//                  them) reproduced, not drawn. Iraq's share of works awards is the dot on the "all" row
//   ppi_uae        "China's 0.9% ... one Jordanian power project": one Jordanian proxy reproduced; the sector is not
//                  in the workbook
//   shares         the rows are the actors the text names plus India and Japan; Israel (0.3% of broad awards), Iran
//                  and Russia (0) are in the data but not drawn. The Gulf is one row: UAE in full colour, other
//                  Gulf states as a tint. Other African and Middle Eastern economies (REG) have no actor colour: grey.
//                  Displayed shares do not sum to 100% (77.6% PPI, 72.9% broad, 83.2% works shown): UK, other
//                  Western and Asian, Malaysia, offshore centres and World/UN stay in the denominator
//   shares         hosts differ by measure: PPI six, broad awards four (no Syria, Yemen), works three (no Jordan)
//   footnotes 3, 4 33.9% / 24.2% / 13.8%, 64.6% / 1.5%, 171 contracts, 12 works contracts: reproduced, not drawn
//   intro          GCC awards ($105.8 bn -> 212.4 bn, 70.7% -> 84.4%): reproduced; reconstruction needs ($216 bn,
//                  82 bn, 71.4 bn, 11 bn, 1 bn, 20-25 bn): intro text, not checked. No chart
//   Palestine*     the source has no designation note: the standard EU wording is added before the first endnote
//                  (draft, to be confirmed)
//   short summary  the third bullet is "(…)" in the source: left out of the dev page
//   footnotes      all footnotes and captions on the charts are drafts, from the caption column of the source
//                  document; FN_BROAD, FN_DENOM and FN_STAKES are shortened from endnotes 4 and 5 and the visual notes

const SRC =
  "Data: World Bank, Private Participation in Infrastructure Database; World Bank, Contract Awards in Investment Project Financing (since FY2020).";

// footnotes (drafts from the source document)
const FN_DIFF =
  "The panels show different forms of participation, periods and denominators. PPI sponsor shares are not weighted by project value; procurement shares measure award value in a selected World Bank portfolio. They are not shares of a common infrastructure market.";
const FN_BROAD =
  "The broad measure covers infrastructure-related awards, including goods and services, not only construction.";
const FN_DENOM =
  "Other African and Middle Eastern suppliers, World/UN awards and residual categories stay in the denominator, so the bars do not sum to 100%.";
const FN_REG = "Supplier country records registration, not ultimate ownership; subcontractors are not observed.";
const FN_PPI =
  "The PPI sample contains 70 project proxies with financial closure in 2000–2024, of which 61 have an identified foreign sponsor. “Active” is the source classification. This is neither a reconstructed ownership stock at the end of 2024 nor a complete inventory of active regional infrastructure.";
const FN_PPI_ACTIVE =
  "“Active” is the source classification. This is neither a reconstructed ownership stock at the end of 2024 nor a complete inventory of active regional infrastructure.";
const FN_STAKES = "The measure sums sponsor stakes without weighting by project value.";

const ROWS = ["TUR", "GCC", "EU", "USA", "CHN", "REG", "KOR", "JPN", "IND"];

export default {
  charts: {
    shares: {
      type: "panelBars",
      data: "infra_1_shares",
      rowKey: "actor",
      rows: ROWS,
      rowLabels: { EU: "EU27", REG: "Regional*", GCC: "Gulf" },
      title: "Foreign actors in Middle East infrastructure",
      subtitle:
        "Sponsors (PPI) and suppliers (World Bank-financed procurement): different sources, periods and denominators. *Other African and Middle Eastern economies.",
      source: SRC,
      panels: [
        {
          id: "ppi",
          title: "PPI sponsors",
          subtitle:
            "Share of attributed foreign sponsor stakes, active arrangements with financial closure in 2000–2024",
          segments: [
            { column: "ppi_a_pct", label: "Share (Gulf row: UAE)", color: "actor" },
            { column: "ppi_b_pct", label: "Other Gulf states", color: "actor", opacity: 0.45 },
          ],
          domain: [0, 50],
          format: "pct",
        },
        {
          id: "proc",
          title: "Procurement",
          subtitle:
            "Share of identified non-domestic infrastructure-related award value, July 2019–December 2024",
          segments: [
            { column: "broad_a_pct", label: "Infrastructure-related awards (Gulf row: UAE)", color: "actor" },
            { column: "broad_b_pct", label: "Other Gulf states", color: "actor", opacity: 0.45 },
          ],
          dot: { column: "works_pct", label: "Works awards only" },
          domain: [0, 50],
          format: "pct",
        },
      ],
      key: [
        { label: "UAE (Gulf)", color: "GCC" },
        { label: "Other Gulf states", color: "GCC", opacity: 0.45 },
        { label: "Dot: works awards only (in brackets)", shape: "dot" },
      ],
    },

    // host concentration: rows are picked per step (state.rows); the long csv is reshaped to one row per actor
    conc: {
      type: "panelBars",
      data: "infra_2_concentration",
      rowKey: "row",
      rows: ["all", "EU", "GCC", "TUR"],
      rowLabels: { all: "All foreign\nactors", EU: "EU27", GCC: "Gulf", TUR: "Türkiye" },
      rowColors: { all: "#333333" },
      prepare: ({ rows }) => {
        const by = new Map();
        for (const r of rows) {
          const o = by.get(r.row) ?? { row: r.row };
          o[`${r.measure}_pct`] = r.share_pct;
          by.set(r.row, o);
        }
        return [...by.values()];
      },
      title: "Host concentration",
      subtitle: "",
      source: SRC,
      panels: [
        {
          id: "ppi",
          title: "PPI sponsors: Jordan",
          subtitle:
            "Jordan’s share of attributed foreign sponsor stakes, active arrangements with financial closure in 2000–2024",
          segments: [{ column: "ppi_pct", label: "Jordan’s share", color: "actor" }],
          domain: [0, 100],
          format: "pct",
        },
        {
          id: "proc",
          title: "Procurement: Iraq",
          subtitle:
            "Iraq’s share of identified non-domestic infrastructure-related award value, July 2019–December 2024. Dot and brackets: works awards only",
          segments: [{ column: "broad_pct", label: "Iraq’s share, all awards", color: "actor" }],
          dot: { column: "works_pct", label: "Iraq’s share, works awards only" },
          domain: [0, 100],
          format: "pct",
        },
      ],
    },
  },

  steps: {
    // ── World Bank-financed procurement ─────────────────────────────────────
    pro_tur: {
      chart: "shares",
      state: { panels: ["proc"], dots: false, highlight: ["TUR"], footnote: FN_DIFF },
    },
    pro_other: {
      chart: "shares",
      state: {
        panels: ["proc"],
        dots: false,
        highlight: ["GCC", "EU", "USA", "CHN"],
        footnote: `${FN_DENOM}\n${FN_BROAD}`,
      },
    },
    pro_works: {
      chart: "shares",
      state: { panels: ["proc"], dots: true, highlight: ["TUR"], footnote: FN_REG },
    },

    // ── private participation in infrastructure ─────────────────────────────
    ppi_gulf: {
      chart: "shares",
      state: { panels: ["ppi"], highlight: ["GCC", "EU"], footnote: FN_PPI },
    },
    ppi_other: {
      chart: "shares",
      state: { panels: ["ppi"], highlight: ["REG", "USA", "KOR"], footnote: FN_STAKES },
    },
    ppi_uae: {
      chart: "shares",
      state: { panels: ["ppi"], highlight: ["GCC", "CHN"], footnote: FN_STAKES },
    },
    ppi_vintage: {
      chart: "shares",
      state: { panels: ["ppi"], footnote: FN_PPI_ACTIVE },
    },

    // ── geographic and contract concentration ───────────────────────────────
    conc_ppi: {
      chart: "conc",
      state: {
        panels: ["ppi"],
        rows: ["all", "EU", "GCC"],
        highlight: ["all", "EU", "GCC"], // all rows at full strength; names coloured in the text
        footnote: FN_STAKES,
      },
    },
    conc_ipf: {
      chart: "conc",
      state: {
        panels: ["proc"],
        rows: ["all", "TUR", "GCC"],
        highlight: ["all", "TUR", "GCC"],
        footnote: FN_REG,
      },
    },
  },
};
