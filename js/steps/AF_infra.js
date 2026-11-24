// AF_infra.js: Africa, infrastructure chapter ("Anchoring Ties: infrastructure and construction", ECON 4.x)
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (infra_1_shares -> infra_1_shares_AF.csv)
//   extra: further data files, { name: "file_{suffix}" } -> extra.name
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of js/charts/panelBars.js and geoBubbles.js)
//
// Text as in 2_4_Africa_-_instrastructure.pdf. Data: Africa_infrastructure_visual_ready_FINAL.xlsx. Charts:
//   shares   sponsors vs builders: PPI sponsor share (left) and foreign works-contract award share (right),
//            same actor order; the works-only share is a dot on the procurement panel (ECON 4.1, 4.2)
//   map      one bubble per country: PPI sponsor stakes by host country, foreign
//            works awards by borrower country; all actors (colour = largest actor) or one actor (ECON 4.1, 4.2)
//
// PINNED: where the text and the charts differ. The text is as written; the charts show the data.
//   split sentences (one chart shows one measure at a time): geo_ppi / geo_works, eu_ppi / eu_works,
//   chn_ppi / chn_works
//   merged sentences (one step, one chart state; highlights added up, the text keeps both parts): ppi_eu (+ ppi_uae: five rows
//   highlighted, both footnotes), chn_works (+ chn_dominant: the six countries with more than 90%; Tanzania, Ethiopia and Kenya are
//   among them), small_are (+ small_usa: UAE and US on one map, each in its own colour, ONE bubble scale for both, unlike the
//   single-actor maps)
//   pro_divide     "European suppliers perform much better in North Africa, China's advantage is in sub-Saharan Africa":
//                  no figure in the text. The works map shows it by the colour of the leading actor; only Egypt
//                  and Tunisia have works awards in North Africa. No separate chart.
//   geo_works      "one third of foreign works-award value" (East Africa and HoA): highlighted on the map; 33.6% in the data
//   chn_works      "spans 35 and is especially strong in East Africa": the word "countries" is missing in the source, kept
//   chn_ppi        "markedly different pattern": article missing in the source, kept
//   shares         the rows are the actors the text names plus India, Türkiye, Japan and South Korea; Russia, Iran and
//                  Israel (about 0) are in the data but not drawn. The Gulf is one row: UAE in full colour, other Gulf
//                  states as a tint. "Regional" = African and MENA actors foreign to the host/borrower country.
//                  Displayed shares do not sum to 100% (other foreign categories stay in the denominator).
//   shares         footnote 1 (sample: 548 / 525 / 491 rows and names, Middle East 58 / 55, combined 606 / 580) is not drawn
//   map            bubbles sit on the country dots, not on project sites (no coordinates in the data); the bubble is
//                  the country's total, not funding. PPI = sponsor-stake equivalents, not money. Single-actor maps scale the bubbles to that actor's
//                  largest country, so sizes do not compare across actors.
//   map            "Other", UK, Other Western/Asia, Malaysia, offshore centres and multilateral/UN are all light grey
//   intro          $155 bn a year, 41% / 48%, seven times debt service, EUR 120 bn of 150 bn, $29.2 bn BRI construction:
//                  intro text, no chart
//   footnotes      all footnotes and captions on the charts are drafts, from the source document

const SRC_SHARES =
  "Data: World Bank, Private Participation in Infrastructure (PPI) Database; World Bank, Contract Awards (Investment Project Financing) Database. Sponsors and contractors are identified using different datasets, periods and denominators; their shares are not directly comparable. For details see methodological note. *Regional includes other African, Middle Eastern and Gulf actors. Contract-award data cover July 2019–December 2024.";
const SRC_MAP =
  "Data: World Bank, PPI Database; World Bank, Contract Awards (Investment Project Financing). Bubbles sit on the country dots, not on project sites.";

// footnotes (editors' revision, November 2026)
const FN_REG = "*Regional includes other African, Middle Eastern and Gulf actors.";
const FN_PRO_1 = `${FN_REG} Contract-award data cover July 2019–December 2024.`;
const FN_PRO_2 = `${FN_PRO_1} ** These figures may understate the presence of Chinese-controlled firms. Suppliers are classified by country of registration rather than ultimate ownership, so locally incorporated subsidiaries of Chinese firms may be recorded as domestic, while those registered in third countries may be attributed elsewhere. Subcontractors are not captured. As the data covers only World Bank-financed contracts, the findings should not be generalised to Africa’s construction market as a whole. For details see methodological note.`;
const FN_PPI_1 = `${FN_REG} Sponsor shares are based on attributed foreign stakes in PPI arrangements recorded as active and reaching financial closure in 2000–24. ‘Active’ reflects the database classification, not necessarily current operation. For details see methodological note.`;
const FN_PPI_3 = `${FN_REG} *** PPI sponsor shares and procurement shares use different sources, periods and denominators. They are not directly comparable and should not be interpreted as shares of a common infrastructure market, investment value or asset ownership. For details see methodological note.`;
const FN_MAP_PPI =
  "Figures cover PPI arrangements reaching financial closure in 2000–24, including before 2019. Sponsor stakes measure attributed participation, unweighted by project value, not financing, investment amounts or verified current ownership. ‘Active’ reflects database status, not necessarily current operation. For details see methodological note.";
const FN_MAP_WORKS =
  "Suppliers are classified by country of registration, not ultimate ownership; subcontractors are not captured. Shares reflect the value of Works contracts awarded to identified non-domestic suppliers in this World Bank-financed sample, not Africa’s construction market as a whole. For details see methodological note.";
const FN_MAP_WORKS_ACTOR =
  "Suppliers are classified by country of registration; subcontractors are not captured. Awards are attributed to borrower countries, excluding multi-country borrowers. Figures cover World Bank-financed Works contracts, not Africa’s construction market as a whole. For details see methodological note.";

const ROWS = ["EU", "REG", "CHN", "GCC", "USA", "IND", "TUR", "JPN", "KOR"];
const CN90 = ["AGO", "KEN", "MDG", "COD", "TZA", "ETH"];

export default {
  charts: {
    shares: {
      type: "panelBars",
      data: "infra_1_shares",
      rowKey: "actor",
      rows: ROWS,
      rowLabels: { EU: "EU27", REG: "Regional*", GCC: "Gulf" },
      title: "Foreign actors in African infrastructure",
      subtitle:
        "Foreign project sponsors (PPI) and contractors in World Bank-financed projects",
      source: SRC_SHARES,
      panels: [
        {
          id: "ppi",
          title: "PPI sponsors",
          subtitle:
            "Share of attributed foreign sponsor stakes, active arrangements through 2024",
          segments: [
            {
              column: "ppi_a_pct",
              label: "Share (Gulf row: UAE)",
              color: "actor",
            },
            {
              column: "ppi_b_pct",
              label: "Other Gulf states",
              color: "actor",
              opacity: 0.45,
            },
          ],
          domain: [0, 80],
          format: "pct",
        },
        {
          id: "proc",
          title: "Procurement",
          subtitle:
            "Share of foreign infrastructure-related award value, Jul 2019–Dec 2024",
          segments: [
            {
              column: "broad_a_pct",
              label: "All infrastructure-related awards (Gulf row: UAE)",
              color: "actor",
            },
            {
              column: "broad_b_pct",
              label: "Other Gulf states",
              color: "actor",
              opacity: 0.45,
            },
          ],
          dot: { column: "works_pct", label: "Works awards only" },
          domain: [0, 80],
          format: "pct",
        },
      ],
      key: [
        { label: "UAE (Gulf)", color: "GCC" },
        { label: "Other Gulf states", color: "GCC", opacity: 0.45 },
        { label: "Dot: works awards only (in brackets)", shape: "dot" },
      ],
    },

    map: {
      type: "geoBubbles",
      data: "infra_2_map",
      title: "Foreign actors in African infrastructure",
      source: SRC_MAP,
      labels: {
        EU: "EU27",
        REG: "Regional (African/MENA)",
        GBR: "UK",
        other: "Other",
        GCC: "Gulf",
      },
      measures: {
        ppi: {
          title: "PPI sponsor stakes, by host country",
          subtitle: (a, label) =>
            a === "all"
              ? "Attributed foreign sponsor stakes in PPI arrangements recorded as active. Bubble area: sponsor-stake equivalents."
              : `${label}: attributed sponsor stakes in PPI arrangements recorded as active. Bubble area scaled to the actor’s largest country.`,
          unit: "sponsor-stake equivalents",
          sizeTitle: "Sponsor-stake equivalents",
          format: ",.0f",
          keyAll: [5, 20, 50],
        },
        works: {
          title: "Foreign works awards, by borrower country",
          subtitle: (a, label) =>
            a === "all"
              ? "World Bank-financed works contracts awarded to foreign firms, July 2019–December 2024. Bubble area: award value ($ million)."
              : `${label}: works award value, July 2019–December 2024. Bubble area scaled to the actor’s largest country.`,
          unit: "$ million",
          sizeTitle: "Works awards, $ million",
          format: ",.0f",
          keyAll: [100, 500, 1500],
        },
      },
    },
  },

  steps: {
    // ── ECON 4.1: World Bank-financed procurement ───────────────────────────
    pro_china: {
      chart: "shares",
      state: {
        panels: ["proc"],
        dots: false,
        highlight: ["CHN", "EU"],
        footnote: FN_PRO_1,
      },
    },
    pro_works: {
      chart: "shares",
      state: {
        panels: ["proc"],
        dots: true,
        highlight: ["CHN", "EU"],
        footnote: FN_PRO_2,
      },
    },
    pro_divide: {
      chart: "map",
      state: { measure: "works", footnote: FN_MAP_WORKS },
    },

    // ── ECON 4.2: private participation in infrastructure ───────────────────
    ppi_eu: {
      chart: "shares",
      state: {
        panels: ["ppi"],
        highlight: ["EU", "REG", "GCC", "USA", "CHN"],
        footnote: FN_PPI_1,
      },
    },
    ppi_contrast: {
      chart: "shares",
      state: {
        panels: ["ppi", "proc"],
        dots: true,
        highlight: ["EU", "CHN"],
        footnote: FN_PPI_3,
      },
    },

    // ── geography and actor patterns ────────────────────────────────────────
    geo_ppi: {
      chart: "map",
      state: { measure: "ppi", footnote: FN_MAP_PPI },
    },
    geo_works: {
      chart: "map",
      state: {
        measure: "works",
        subregion: "East Africa and HoA",
        footnote: FN_MAP_WORKS,
      },
    },
    eu_ppi: {
      chart: "map",
      state: {
        measure: "ppi",
        actor: "EU",
        labels: ["ZAF", "EGY", "MAR"],
        footnote: FN_MAP_PPI,
      },
    },
    eu_works: {
      chart: "map",
      state: {
        measure: "works",
        actor: "EU",
        subregion: "North Africa",
        labels: ["EGY"],
        footnote: FN_MAP_WORKS_ACTOR,
      },
    },
    chn_ppi: {
      chart: "map",
      state: { measure: "ppi", actor: "CHN", footnote: FN_MAP_PPI },
    },
    // Tanzania, Ethiopia and Kenya are among the six countries where China has more than 90%
    chn_works: {
      chart: "map",
      state: {
        measure: "works",
        actor: "CHN",
        highlight: CN90,
        labels: CN90,
        labelsLeft: ["COD"],
        footnote: FN_MAP_WORKS_ACTOR,
      },
    },
    // UAE and US on one map, in their own colours, on one bubble scale
    small_are: {
      chart: "map",
      state: {
        measure: "works",
        actor: ["ARE", "USA"],
        actorLabel: "UAE and US",
        subtitle:
          "UAE and US: works award value, July 2019–December 2024. Bubble area: award value ($ million), the same scale for both actors.",
        labels: ["NGA", "NER", "SOM", "ETH"],
        footnote: FN_MAP_WORKS_ACTOR,
      },
    },
  },
};
