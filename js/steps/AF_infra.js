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
//   chn_ppi / chn_works, small_are / small_usa
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
//   intro          USD 155 bn a year, 41% / 48%, seven times debt service, EUR 120 bn of 150 bn, USD 29.2 bn BRI construction:
//                  intro text, no chart
//   footnotes      all footnotes and captions on the charts are drafts, from the source document

const SRC =
  "Data: World Bank, PPI Database; World Bank, Contract Awards (Investment Project Financing).";

// footnotes (drafts from the source document)
const FN_PRO_1 = "* Data available for July 2019 – December 2024.";
const FN_PRO_2 =
  "** These figures are likely to understate the Chinese-controlled footprint. Supplier nationality in the World Bank database reflects the country of registration rather than ultimate ownership, meaning that locally incorporated subsidiaries of foreign firms are recorded as domestic suppliers. The findings should not be generalised to the continent’s infrastructure market as a whole.";
const FN_PPI_1 =
  "* Actor shares use reported sponsor stakes where available; where all stakes are missing, shares are split equally across named sponsors, while in mixed cases any unallocated residual is divided equally among sponsors without reported stakes. Domestic sponsor stakes and sponsor-country slots that cannot be attributed are excluded from the foreign denominator. The measure captures sponsor participation, not equity ownership, investment value or financing.";
const FN_PPI_2 =
  "** These arrangements include projects reaching financial close before 2019; the figures measure the active sponsor footprint through 2024, not only new activity during 2019–2024.";
const FN_PPI_3 =
  "*** PPI sponsor shares and procurement shares use different sources, periods and denominators. The data do not support a direct comparison of investment amounts, capital deployed or asset ownership.";
const FN_MAP_PPI =
  "All-active PPI stock through 2024, including arrangements reaching financial close before 2019. Sponsor-stake PPI measure indicates attributed sponsor participation, not investment value, financing or current asset ownership. PPI uses host country.";
const FN_MAP_WORKS =
  "Supplier nationality in contracts database is country of registration; subcontractors are not observed. Shares cover foreign works awards in this World Bank sample, not the construction market as a whole. Construction uses borrower country.";
const FN_MAP_RESIDUAL =
  " Context/residual categories are retained where they are part of the denominator so country shares remain complete.";

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
        "Sponsors (PPI) and builders (World Bank-financed procurement): different sources, periods and denominators. *Other African and MENA actors.",
      source: SRC,
      panels: [
        {
          id: "ppi",
          title: "PPI sponsors",
          subtitle: "Share of attributed foreign sponsor stakes, active arrangements through 2024",
          segments: [
            { column: "ppi_a_pct", label: "Share (Gulf row: UAE)", color: "actor" },
            { column: "ppi_b_pct", label: "Other Gulf states", color: "actor", opacity: 0.45 },
          ],
          domain: [0, 80],
          format: "pct",
        },
        {
          id: "proc",
          title: "Procurement",
          subtitle: "Share of foreign infrastructure-related award value, Jul 2019–Dec 2024",
          segments: [
            { column: "broad_a_pct", label: "All infrastructure-related awards (Gulf row: UAE)", color: "actor" },
            { column: "broad_b_pct", label: "Other Gulf states", color: "actor", opacity: 0.45 },
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
      source: `${SRC} Bubbles sit on the country dots, not on project sites.`,
      labels: { EU: "EU27", REG: "Regional (African / MENA)", GBR: "UK", other: "Other", GCC: "Gulf" },
      measures: {
        ppi: {
          title: "PPI sponsor stakes, by host country",
          subtitle: (a, label) =>
            a === "all"
              ? "Attributed foreign sponsor stakes in active PPI arrangements through 2024. Bubble area: sponsor-stake equivalents."
              : `${label}: attributed sponsor stakes in active arrangements through 2024. Bubble area scaled to the actor’s largest country.`,
          unit: "sponsor-stake equivalents",
          sizeTitle: "Sponsor-stake equivalents",
          format: ",.0f",
          keyAll: [5, 20, 50],
        },
        works: {
          title: "Foreign works awards, by borrower country",
          subtitle: (a, label) =>
            a === "all"
              ? "World Bank-financed works awards to foreign firms, July 2019–December 2024. Bubble area: USD m."
              : `${label}: works award value, July 2019–December 2024. Bubble area scaled to the actor’s largest country.`,
          unit: "USD m",
          sizeTitle: "Works awards, USD m",
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
      state: { panels: ["proc"], dots: false, highlight: ["CHN", "EU"], footnote: FN_PRO_1 },
    },
    pro_works: {
      chart: "shares",
      state: { panels: ["proc"], dots: true, highlight: ["CHN", "EU"], footnote: FN_PRO_2 },
    },
    pro_divide: {
      chart: "map",
      state: { measure: "works", footnote: FN_MAP_WORKS + FN_MAP_RESIDUAL },
    },

    // ── ECON 4.2: private participation in infrastructure ───────────────────
    ppi_eu: {
      chart: "shares",
      state: { panels: ["ppi"], highlight: ["EU", "REG"], footnote: FN_PPI_2 },
    },
    ppi_uae: {
      chart: "shares",
      state: { panels: ["ppi"], highlight: ["GCC", "USA", "CHN"], footnote: FN_PPI_1 },
    },
    ppi_contrast: {
      chart: "shares",
      state: { panels: ["ppi", "proc"], dots: true, highlight: ["EU", "CHN"], footnote: FN_PPI_3 },
    },

    // ── geography and actor patterns ────────────────────────────────────────
    geo_ppi: {
      chart: "map",
      state: { measure: "ppi", footnote: FN_MAP_PPI + FN_MAP_RESIDUAL },
    },
    geo_works: {
      chart: "map",
      state: { measure: "works", subregion: "East Africa and HoA", footnote: FN_MAP_WORKS + FN_MAP_RESIDUAL },
    },
    eu_ppi: {
      chart: "map",
      state: { measure: "ppi", actor: "EU", labels: ["ZAF", "EGY", "MAR"], footnote: FN_MAP_PPI },
    },
    eu_works: {
      chart: "map",
      state: { measure: "works", actor: "EU", subregion: "North Africa", labels: ["EGY"], footnote: FN_MAP_WORKS },
    },
    chn_ppi: {
      chart: "map",
      state: { measure: "ppi", actor: "CHN", footnote: FN_MAP_PPI },
    },
    chn_works: {
      chart: "map",
      state: { measure: "works", actor: "CHN", highlight: ["TZA", "ETH", "KEN"], labels: ["TZA", "ETH", "KEN"], footnote: FN_MAP_WORKS },
    },
    chn_dominant: {
      chart: "map",
      state: { measure: "works", actor: "CHN", highlight: CN90, labels: CN90 },
    },
    small_are: {
      chart: "map",
      state: { measure: "works", actor: "ARE", labels: ["NGA", "NER"] },
    },
    small_usa: {
      chart: "map",
      state: { measure: "works", actor: "USA", labels: ["SOM", "ETH"] },
    },
  },
};
