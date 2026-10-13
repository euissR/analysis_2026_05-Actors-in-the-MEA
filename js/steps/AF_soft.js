// AF_soft.js: Africa, soft power chapter ("Shaping Perceptions: cooperation, people and culture")
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (soft_1_dev -> soft_1_dev_AF.csv)
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of js/charts/dotMap.js, panelBars.js and sankey.js)
//
// Text as in 2_5_Africa_-_soft_power.docx. Data: the four workbooks of the chapter (see R/soft_*_af.R). Charts:
//   dev      dotMap (presence): one tile per development agency group + the EIB; "all" = number of non-EU actors with an office
//   devms    dotMap (count): EU member states, offices -> + partner countries -> + ODA recipients and the rest ("all")
//   lang     panelBars: countries and centres of the cultural / language institutes (ECON 7-9)
//   cov      panelBars: regional coverage of one actor (share of a subregion's countries with at least one centre)
//   stud     sankey (reverse): African students by region of origin (left) and host actor (right)
//   migFrom  sankey (reverse): migrants from African regions (left) living in each actor (right), 2015 and 2024
//   migTo    sankey: migrants from each actor (left) living in African regions or countries (right), 2015 and 2024
//
// PINNED: where the text and the charts differ. The text is as written; the charts show the data.
//   split sentences (one chart state shows one actor or one measure at a time): w_jpn / w_tur, c_msoff / c_eib,
//     c_ind / c_gulf, n_eib / n_eu, st_tur_reg / st_us_reg, st_sau_w / st_irn_w, st_sau / st_sau_c, st_ind / st_ind_c,
//     mt_eu_mar / mt_egy / mt_lby, mt_ind / mt_ind_zaf, mf_* (one actor per step). Splits at a comma or "and" keep the
//     lower-case start of the second part.
//   several actors in one clause, one actor drawn (the others are one tile away on the map): w_jpn (JICA shown; Qatar
//     Charity, also eight countries, via the Qatar tile), e_jpn (JICA; Qatar Charity six), c_gulf (UAE / ADFD shown;
//     Qatar QFFD and Saudi KSrelief via their tiles)
//   dev "all"     = non-EU actors with an OFFICE (the text counts offices); the 73 offices of w_all (EIB 2 + member states 45 +
//                 others 26) are carried by the text, the map shows the 26. Projects, grants and "sector in embassy" (Israel)
//                 are not counted in "all"; they show on the actor's own tile.
//   dev           one dot per country: the strongest channel decides (office > sector in embassy > projects > grants); Qatar
//                 shows the office where it has one, the projects elsewhere; India the Exim Bank office, else MEA grants. The
//                 tooltip lists every agency. Reference years run from 2020 (India grants) to 2026 and are not drawn. CIDCA
//                 (China) has no data. Actors: Türkiye, Japan, South Korea, Qatar, UAE, Saudi Arabia, India, Russia, Israel, US.
//   s_eib         "Eswatini, Mauritius and Seychelles partnerships through the EU Delegations": no data; only the EIB office
//                 in South Africa is drawn
//   devms         member states in three cumulative stages (office; + partner / priority / project countries; + ODA recipients and
//                 the rest). The text's "second partner countries, ODA recipients, and the rest" may mean two stages: confirm.
//                 n = number of member states, not offices. The text's office counts (45, 19; Germany, France, Italy) are
//                 office counts: GIZ / AFD / AICS are named in the text, not drawn.
//   w_ms, e_msoff office counts per country are member-state counts; "GIZ widest network" has no separate series
//   lang          rows: the actors the text names (EU member states, of which France, China, Russia, Türkiye). Other actors in the
//                 data (India, South Korea, Iran, Japan, Saudi Arabia, Kuwait, Oman, Bahrain) are not drawn. China: Confucius
//                 institutes (70) and classrooms (11) are one bar of 81 centres; the split is in the text.
//   l_cov         coverage = share of the subregion's countries with at least one centre; "84%" and "89%" are the mean of the four
//                 regions other than Central Africa (France 83.95, EU member states 89.1)
//   l_rus         the eight further affiliated institutions and the eight announced Russian Houses (Sept 2026) have no data
//   students      one nominal year (2023); real years per actor in the data (ref_year): Iran 2022, Saudi Arabia 2024, UAE 2012,
//                 Kuwait 2009, Israel 2014. EU without Ireland and the Netherlands. China has no data. The two "Not classified"
//                 rows of the sheet (Iran and Israel as countries of origin) are not African and are left out. "France alone
//                 about half of the EU": no member-state split in the data, not drawn.
//   st_*          "(9595)" and "(4958)" Egypt and Morocco, shown in the country view of North Africa (origin left, Türkiye right)
//   migrants      stocks 2015 and 2024 only (2020 not drawn). Only the actors of the workbooks' "Africa per actor" sheets are
//                 drawn (not the Gulf states, Israel, Oman). Mixed definitions: foreign-born (EU, US, Russia, Türkiye) vs foreign
//                 citizens (China, India, Iran, Japan). No migrants from Africa recorded in South Korea.
//   mf_tur        the dashed outlines show every actor's 2015 level; the label gives the change for Türkiye only
//   mt_chn_eth15  the step shows 2015 (54,628) before the 2024 figure of mt_chn_eth (26,824); the chart animates between them
//   typos         kept as in the source: "Western Africa", "field office overall", "than in West Africa", "out the nine",
//                 "Qatar charity", "has largest network", "an average that reaches 89% on average", "other affiliated
//                 institutions", "The second destinations ... was", "the EU is the only external actors"
//   footnotes     all footnotes and captions on the charts are drafts, shortened from the source document

import { theme } from "../theme.js";

const W = "West Africa";
const E = "East Africa and HoA";
const S = "Southern Africa and Indian Ocean";
const C = "Central Africa";
const N = "North Africa";

// footnotes (drafts from the source document)
const FN3 = "³ European Investment Bank (EIB), ‘Sub-Saharan Africa’, eib.org.";
const FN4 = "⁴ Abu Dhabi Fund for Development (ADFD), Annual Report 2025.";
const FN5 = "⁵ Where French cooperation is complemented by other EU member states: Goethe-Institut in Namibia; Instituto Camões in Guinea-Bissau and Mozambique.";
const FN6 = "⁶ Confucius Institute, ‘Confucius Institutes in Africa’, ci.cn.";
const FN789 = "⁷ Russkiy Mir Foundation; Rossotrudnichestvo. ⁸ Marangio, R., Chaillot Paper 186, EUISS, 2025, p. 48. ⁹ In the DRC, Kenya, Madagascar, Mali, São Tomé and Príncipe, Senegal, Sierra Leone and Togo (BBC News, 10 September 2026).";
const FN10 = "¹⁰ Yunus Emre Institute, ‘Merkezlerimiz’, yee.org.tr.";
const FN11 = "¹¹ Most data refer to 2023; Iran 2022, Saudi Arabia 2024, UAE 2012, Kuwait 2009, Israel 2014. EU: sum of member states, without Ireland and the Netherlands.";
const FN12 = "¹² UNDESA, International Migrant Stock 2024 (both sexes, mid-year). No records of migrants from Africa in South Korea. Definitions differ: foreign-born (EU, US, Russia, Türkiye) or foreign citizens (China, India, Iran, Japan).";
const FN13 = "¹³ UNDESA, International Migrant Stock 2024 (both sexes, mid-year). Estimates rest on country of birth for 36 African countries and on citizenship for 13; refugees are included for 48.";
const FN14 = "¹⁴ These concentrations may partly reflect dual citizenship; historical migration patterns and diaspora ties may also play a role.";
const FN_ETH = "2015 level shown (54,628); 2024: 26,824. " + FN13;

const SRC_DEV = "Data: official websites of agencies, ministries and entities, most recent report available (2023–2025).";

export default {
  charts: {
    dev: {
      type: "dotMap",
      mode: "presence",
      data: "soft_1_dev",
      sub: "soft_1_dev_sub",
      title: "Development and humanitarian agencies in Africa",
      subtitleActor: "Countries where the selected actor’s agencies are present, by strongest type of presence",
      subtitleAll: "Number of actors with an office in each country (EU institutions and member states not included)",
      source: SRC_DEV,
      allLabel: "All actors (offices)",
      tilesWithData: true,
      extraTiles: [{ actor: "EIB", label: "EIB" }],
      rMaxAll: 13,
      keySize: "Actors with an office",
      keyValuesAll: [1, 3, 6],
      tooltipCount: (n) => `${n} actor${n === 1 ? "" : "s"} with an office`,
      shareText: (share, label) =>
        label === "All actors (offices)"
          ? `At least one office in ${share}% of countries`
          : `${label}: present in ${share}% of countries`,
      categories: {
        Office: { label: "Office", tooltip: "office", color: theme.navy, r: 5 },
        "Sector in embassy": { label: "Sector in embassy", tooltip: "sector in embassy", color: theme.teal2, r: 4.5 },
        Projects: { label: "Projects", tooltip: "projects", color: theme.teal, r: 4.5 },
        Grants: { label: "Grants", tooltip: "grants", color: theme.muted, r: 3.5 },
        None: { label: "No presence", tooltip: "no presence", color: theme.light, r: 2.5 },
      },
    },

    devms: {
      type: "dotMap",
      mode: "count",
      data: "soft_1_dev_ms",
      title: "EU member states’ development agencies in Africa",
      subtitleActor: "Number of EU member states present in each country, by the type of presence selected",
      subtitleAll: "Number of EU member states with an office, a partner country or an ODA-recipient relationship in each country",
      source: "Data: websites of EU member states’ development agencies and ministries.",
      allLabel: "Any presence",
      tilesWithData: true,
      extraTiles: [
        { actor: "MS_office", label: "Offices" },
        { actor: "MS_partner", label: "+ partner countries" },
      ],
      ownDots: false,
      rMaxActor: 12,
      rMaxAll: 12,
      keySize: "Member states",
      keyValuesActor: [1, 5, 10],
      keyValuesAll: [1, 5, 10],
      tooltipCount: (n) => `${n} EU member state${n === 1 ? "" : "s"}`,
      shareText: (share) => `${share}%`,
    },

    lang: {
      type: "panelBars",
      data: "soft_2_lang",
      rowKey: "actor",
      rows: ["EU", "FRA", "CHN", "RUS", "TUR"],
      rowLabels: { EU: "EU member states", FRA: "of which France" },
      labelWidth: 125,
      title: "Cultural and language institutes in Africa",
      subtitle: "Countries with at least one centre, and number of centres (all types of institute), 2026",
      source: "Data: websites of the institutes and cultural centres.",
      panels: [
        { id: "countries", title: "Countries", subtitle: "With at least one centre", segments: [{ column: "countries", label: "Countries", color: "actor" }], format: "num" },
        { id: "centres", title: "Centres", subtitle: "All types of institute", segments: [{ column: "centres", label: "Centres", color: "actor" }], format: "num" },
      ],
    },

    cov: {
      type: "panelBars",
      data: "soft_2_lang_cov",
      rowKey: "subregion",
      rows: [N, W, C, E, S],
      labelWidth: 200,
      title: "Regional coverage of cultural and language institutes",
      subtitle: "Share of the subregion’s countries with at least one centre, 2026",
      source: "Data: websites of the institutes and cultural centres.",
      panels: [
        { id: "FRA", title: "France", where: { actor: "FRA" }, segments: [{ column: "coverage_pct", label: "Coverage", color: "EU" }], domain: [0, 100], format: "pct0" },
        { id: "EU", title: "All EU member states", where: { actor: "EU" }, segments: [{ column: "coverage_pct", label: "Coverage", color: "EU" }], domain: [0, 100], format: "pct0" },
        { id: "CHN", title: "China", where: { actor: "CHN" }, segments: [{ column: "coverage_pct", label: "Coverage", color: "CHN" }], domain: [0, 100], format: "pct0" },
        { id: "TUR", title: "Türkiye", where: { actor: "TUR" }, segments: [{ column: "coverage_pct", label: "Coverage", color: "TUR" }], domain: [0, 100], format: "pct0" },
      ],
    },

    stud: {
      type: "sankey",
      data: "soft_3_stud",
      title: "African students in external actors",
      subtitle: () => "Students by region of origin (left) and host actor (right), 2023 (latest available year for some actors)",
      source: "Data: UNESCO Institute for Statistics (UIS), OPRI inbound international students, February 2026.",
      unit: "Number of students",
      tipLabel: "Students",
      reverse: true,
      periods: { all: { label: "2023" } },
      nSuppliers: 8,
      nCountries: 8,
      otherSuppliers: "Other destinations",
      otherRecipients: "Other origins",
      marginLeft: 150,
      marginRight: 120,
    },

    migFrom: {
      type: "sankey",
      data: "soft_4_mig_from",
      title: "Migrants from Africa in the external actors",
      subtitle: (s, period) => `Stock of migrants by region of origin (left) and host actor (right), ${period}`,
      source: "Data: UNDESA, International Migrant Stock 2024.",
      unit: "Migrants (stock, mid-year)",
      tipLabel: "Migrants",
      reverse: true,
      defaultPeriod: "p2",
      periods: { p1: { label: "2015", from: 2015, to: 2015 }, p2: { label: "2024", from: 2024, to: 2024 } },
      nSuppliers: 7,
      otherSuppliers: "Other destinations",
      changeSuppliers: ["Türkiye"],
      marginLeft: 150,
      marginRight: 130,
    },

    migTo: {
      type: "sankey",
      data: "soft_4_mig_to",
      title: "Migrants from the external actors in Africa",
      subtitle: (s, period) => `Stock of migrants by actor of origin (left) and African ${s.depth === "country" ? "country" : "region"} of residence (right), ${period}`,
      source: "Data: UNDESA, International Migrant Stock 2024.",
      unit: "Migrants (stock, mid-year)",
      tipLabel: "Migrants",
      defaultPeriod: "p2",
      periods: { p1: { label: "2015", from: 2015, to: 2015 }, p2: { label: "2024", from: 2024, to: 2024 } },
      nSuppliers: 9,
      nCountries: 8,
      otherSuppliers: "Other origins",
      otherRecipients: "Other countries",
      marginLeft: 110,
      marginRight: 150,
    },
  },

  steps: {
    // ── Geographical distribution of development agencies, grants and projects in Africa ──────────
    w_all: { chart: "dev", state: { actor: "all", subregion: W } },
    w_eib: { chart: "dev", state: { actor: "EIB", subregion: W, labels: ["CIV", "SEN"], footnote: FN3 } },
    w_ms: { chart: "devms", state: { actor: "MS_office", subregion: W } },
    w_ext: { chart: "dev", state: { actor: "all", subregion: W } },
    w_jpn: { chart: "dev", state: { actor: "JPN", subregion: W } },
    w_tur: { chart: "dev", state: { actor: "TUR", subregion: W } },
    e_all: { chart: "dev", state: { actor: "all", subregion: E } },
    e_tur: { chart: "dev", state: { actor: "TUR", subregion: E } },
    e_jpn: { chart: "dev", state: { actor: "JPN", subregion: E } },
    e_ms: { chart: "devms", state: { actor: "all", subregion: E } },
    e_eib: { chart: "dev", state: { actor: "EIB", subregion: E, labels: ["ETH", "KEN"] } },
    e_msoff: { chart: "devms", state: { actor: "MS_office", subregion: E } },
    s_ms: { chart: "devms", state: { actor: "all", subregion: S } },
    s_eib: { chart: "dev", state: { actor: "EIB", subregion: S, labels: ["ZAF"] } },
    s_ext: { chart: "dev", state: { actor: "all", subregion: S } },
    s_jpn: { chart: "dev", state: { actor: "JPN", subregion: S } },
    s_ind: { chart: "dev", state: { actor: "IND", subregion: S, labels: ["ZAF"] } },
    c_ms: { chart: "devms", state: { actor: "all", subregion: C } },
    c_msoff: { chart: "devms", state: { actor: "MS_office", subregion: C } },
    c_eib: { chart: "dev", state: { actor: "EIB", subregion: C, labels: ["CMR"] } },
    c_jpn: { chart: "dev", state: { actor: "JPN", subregion: C } },
    c_ind: { chart: "dev", state: { actor: "IND", subregion: C } },
    c_gulf: { chart: "dev", state: { actor: "ARE", subregion: C } },
    c_rus: { chart: "dev", state: { actor: "RUS", subregion: C, labels: ["BDI", "CAF", "COG", "COD"] } },
    n_ms: { chart: "devms", state: { actor: "all", subregion: N } },
    n_eib: { chart: "dev", state: { actor: "EIB", subregion: N, labels: ["EGY", "MAR", "TUN"] } },
    n_eu: { chart: "devms", state: { actor: "all", subregion: N } },
    n_are: { chart: "dev", state: { actor: "ARE", subregion: N, footnote: FN4 } },
    // ── Cultural cooperation and language institutes ──────────
    l_intro: { chart: "lang", state: {  } },
    l_eu: { chart: "lang", state: { highlight: ["EU"] } },
    l_fra: { chart: "lang", state: { highlight: ["FRA"] } },
    l_cov: { chart: "cov", state: { panels: ["FRA", "EU"], footnote: FN5 } },
    l_chn: { chart: "lang", state: { highlight: ["CHN"], footnote: FN6 } },
    l_chn_cov: { chart: "cov", state: { panels: ["CHN"] } },
    l_rus: { chart: "lang", state: { highlight: ["RUS"], footnote: FN789 } },
    l_tur: { chart: "lang", state: { highlight: ["TUR"], footnote: FN10 } },
    l_tur_cov: { chart: "cov", state: { panels: ["TUR"], highlight: ["North Africa"] } },
    // ── African students in external actors11 ──────────
    st_intro: { chart: "stud", state: { footnote: FN11 } },
    st_main: { chart: "stud", state: { highlight: ["EU", "Türkiye", "US", "Russia"], footnote: FN11 } },
    st_eu: { chart: "stud", state: { highlight: ["EU"], footnote: FN11 } },
    st_tur: { chart: "stud", state: { highlight: ["Türkiye", "US"], footnote: FN11 } },
    st_eu_reg: { chart: "stud", state: { highlight: [{ from: "EU", to: "North Africa" }, { from: "EU", to: "West Africa" }, { from: "EU", to: "Central Africa" }], footnote: FN11 } },
    st_tur_reg: { chart: "stud", state: { highlight: [{ from: "Türkiye", to: "North Africa" }, { from: "Türkiye", to: "East Africa and HoA" }], footnote: FN11 } },
    st_us_reg: { chart: "stud", state: { highlight: [{ from: "US", to: "West Africa" }, { from: "EU", to: "West Africa" }], footnote: FN11 } },
    st_rus_ind: { chart: "stud", state: { highlight: [{ from: "Russia", to: "West Africa" }, { from: "India", to: "West Africa" }], footnote: FN11 } },
    st_sau_w: { chart: "stud", state: { highlight: [{ from: "Saudi Arabia", to: "West Africa" }], footnote: FN11 } },
    st_irn_w: { chart: "stud", state: { highlight: [{ from: "Iran", to: "West Africa" }], footnote: FN11 } },
    st_rus_n: { chart: "stud", state: { subregion: "North Africa", depth: "country", highlight: [{ from: "Russia", to: "EGY" }], show: ["EGY"], footnote: FN11 } },
    st_tur_n: { chart: "stud", state: { subregion: "North Africa", depth: "country", highlight: [{ from: "Türkiye", to: "EGY" }, { from: "Türkiye", to: "MAR" }], show: ["EGY", "MAR"], footnote: FN11 } },
    st_sau_ind: { chart: "stud", state: { highlight: ["Saudi Arabia", "India"], footnote: FN11 } },
    st_sau: { chart: "stud", state: { highlight: [{ from: "Saudi Arabia", to: "West Africa" }, { from: "Saudi Arabia", to: "North Africa" }, { from: "Saudi Arabia", to: "East Africa and HoA" }], footnote: FN11 } },
    st_sau_c: { chart: "stud", state: { depth: "country", highlight: [{ from: "Saudi Arabia", to: "NGA" }, { from: "Saudi Arabia", to: "EGY" }, { from: "Saudi Arabia", to: "SDN" }], show: ["NGA", "EGY", "SDN"], footnote: FN11 } },
    st_ind: { chart: "stud", state: { highlight: [{ from: "India", to: "East Africa and HoA" }, { from: "India", to: "Southern Africa and Indian Ocean" }], footnote: FN11 } },
    st_ind_c: { chart: "stud", state: { depth: "country", highlight: [{ from: "India", to: "TZA" }, { from: "India", to: "ZWE" }], show: ["TZA", "ZWE"], footnote: FN11 } },
    // ── Recorded migrant stocks from Africa in the external actors considered12 ──────────
    mf_intro: { chart: "migFrom", state: { period: "p2", footnote: FN12 } },
    mf_eu: { chart: "migFrom", state: { period: "p2", highlight: ["EU"], footnote: FN12 } },
    mf_us: { chart: "migFrom", state: { period: "p2", highlight: ["US"], footnote: FN12 } },
    mf_tur: { chart: "migFrom", state: { period: "p2", change: true, changeSuppliers: ["Türkiye"], highlight: ["Türkiye"], footnote: FN12 } },
    mf_eu_reg: { chart: "migFrom", state: { period: "p2", highlight: [{ from: "EU", to: "North Africa" }, { from: "EU", to: "West Africa" }], footnote: FN12 } },
    mf_us_reg: { chart: "migFrom", state: { period: "p2", highlight: [{ from: "US", to: "West Africa" }, { from: "US", to: "East Africa and HoA" }], footnote: FN12 } },
    mf_tur_reg: { chart: "migFrom", state: { period: "p2", highlight: [{ from: "Türkiye", to: "North Africa" }, { from: "Türkiye", to: "East Africa and HoA" }], footnote: FN12 } },
    mf_chn_reg: { chart: "migFrom", state: { period: "p2", highlight: [{ from: "China", to: "West Africa" }, { from: "China", to: "Southern Africa and Indian Ocean" }], footnote: FN12 } },
    // ── Recorded migrant stocks from the external actors considered to Africa13 ──────────
    mt_intro: { chart: "migTo", state: { period: "p2", footnote: FN13 } },
    mt_eu: { chart: "migTo", state: { period: "p2", highlight: ["EU"], footnote: FN13 } },
    mt_chn_ind: { chart: "migTo", state: { period: "p2", highlight: ["China", "India"], footnote: FN13 } },
    mt_rus_us: { chart: "migTo", state: { period: "p2", highlight: ["Russia", "US"], footnote: FN13 } },
    mt_north: { chart: "migTo", state: { period: "p2", highlight: [{ from: "EU", to: "North Africa" }, { from: "China", to: "North Africa" }, { from: "Russia", to: "North Africa" }, { from: "US", to: "North Africa" }], footnote: FN13 } },
    mt_eu_mar: { chart: "migTo", state: { period: "p2", depth: "country", highlight: [{ from: "EU", to: "MAR" }], show: ["MAR"], footnote: FN13 } },
    mt_egy: { chart: "migTo", state: { period: "p2", depth: "country", highlight: [{ from: "China", to: "EGY" }, { from: "Russia", to: "EGY" }], show: ["EGY"], footnote: FN13 } },
    mt_lby: { chart: "migTo", state: { period: "p2", depth: "country", highlight: [{ from: "US", to: "LBY" }], show: ["LBY"], footnote: FN13 } },
    mt_ind: { chart: "migTo", state: { period: "p2", highlight: [{ from: "India", to: "Southern Africa and Indian Ocean" }], footnote: FN13 } },
    mt_ind_zaf: { chart: "migTo", state: { period: "p2", depth: "country", highlight: [{ from: "India", to: "ZAF" }], show: ["ZAF"], footnote: FN14 } },
    mt_chn_e: { chart: "migTo", state: { period: "p2", highlight: [{ from: "China", to: "East Africa and HoA" }], footnote: FN13 } },
    mt_chn_eth: { chart: "migTo", state: { period: "p2", subregion: "East Africa and HoA", depth: "country", highlight: [{ from: "China", to: "ETH" }], show: ["ETH"], footnote: FN13 } },
    mt_chn_eth15: { chart: "migTo", state: { period: "p1", subregion: "East Africa and HoA", depth: "country", highlight: [{ from: "China", to: "ETH" }], show: ["ETH"], footnote: FN_ETH } },
  },
};
