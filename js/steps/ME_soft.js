// ME_soft.js: Middle East and the Gulf, soft power chapter ("Shaping Perceptions: cooperation, people and cultural reach")
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (soft_1_dev -> soft_1_dev_ME.csv)
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of js/charts/dotMap.js, panelBars.js, geoBubbles.js and sankey.js)
//
// Text as in 3_5_Middle_East_and_the_Gulf_-_soft_power.docx (first four columns). Data: the four workbooks of the chapter
// (see R/soft_*_me.R). Charts, as in AF_soft.js:
//   dev      dotMap (presence): one tile per agency group; "all" = number of non-EU actors with an office
//   devms    dotMap (count): EU member states: offices; partner countries and projects; any presence ("all")
//   lang     panelBars: countries and centres of the cultural institutes and missions per actor
//   langmap  geoBubbles: centres per country, all actors or one actor
//   stud     sankey (reverse): students by country of origin (left) and host actor (right)
//   migFrom  sankey (reverse): migrants from the region by country of origin (left) living in each actor (right), 2015 and 2024
//   migTo    sankey: migrants from each actor (left) living in the countries of the region (right), 2015 and 2024
//   perc     panelBars: opinion of each actor (favourable, don't know, unfavourable), one panel per country, Arab Barometer wave VIII
//   econ     panelBars: wish for stronger / same / weaker economic ties with each actor, one panel per country (not Kuwait)
//
// PINNED: where the text and the charts differ. The text is as written; the charts show the data.
//   split sentences (one chart state shows one actor or one measure at a time): d_adfd / d_ksr, d_rus / d_qffd / d_dfc, l_kor / l_ind,
//     f_chg / f_jpn. Splits at a comma keep the lower-case start of the second part.
//   several actors in one clause, one actor drawn: d_proj ("Russia, Qatar, the UAE, and Saudi Arabia": Russia shown, the others on
//     their tiles), d_qffd (QFFD shown; ADFD, which covers the same countries, on the UAE tile), l_fra (France and Germany both
//     highlighted), l_gulf_loc (Saudi Arabia drawn; Bahrain, Kuwait and Oman via their own bars), d_ms (see EIB)
//   EIB           no map of its own: the EIB sentence stands at the end of the EU / member states paragraph (d_ms); the text's order is
//                 changed for this (the EIB sentence comes first in the source). The map shows member states only.
//   dev "all"     = non-EU actors with an OFFICE (the text counts offices); projects and grants show on the actor's own tile
//   dev           one dot per country: the strongest channel decides (office > sector in embassy > projects > grants); Qatar shows its office
//                 where it has one (Qatar Charity: Jordan, Lebanon, Yemen, not in the text), the QFFD projects elsewhere. Reference years not
//                 drawn. Iran is an external actor only, not drawn as a country. "Iraq, Jordan, Lebanon, Syria" (one multi-country row) not drawn.
//   devms         three separate counts (not cumulative): offices; partner / priority / project countries only; any presence (incl. ODA recipients
//                 and "not specified", footnote). n = number of member states, not offices; GIZ / AFD / AICS are named in the text, not drawn.
//                 The five agencies' member states (France, Germany, Italy, Portugal, Spain) are text only.
//   dot size      the same scale as the Africa maps (21 = the largest count), so sizes compare across regions
//   lang          rows: the actors the text names. China: the source table has NO row for the region, so "10 Confucius Institutes" (l_chn) has no
//                 bar and no bubbles; check the sheet. India: the data have two centres in Israel, the text says one centre.
//   l_eu, l_it, l_cz  Italy, Spain, the Czech Republic, Hungary, Poland and Finland are not separate series: the map shows the EU total per country
//   l_rus         "Iran hosts four offices of the Russkiy Mir Foundation": Iran is not drawn as a country of the region (text only)
//   l_gulf_loc    "These are located mainly in other Gulf states, ...": only Saudi Arabia is drawn (Jordan, Lebanon labelled); the locations of Oman, Bahrain
//                 and Kuwait are in the data but not drawn
//   students      origins: the 13 countries of the region, with Israel (filed "Not classified" in the sheet); Iran is an external actor. One nominal
//                 year (2023); real years: Iran 2022, Saudi Arabia 2024, UAE 2012, Kuwait 2009, Israel 2014. EU without Ireland and the Netherlands.
//                 China: no data. The shares within an actor (59 % from Syria ...) are in the R checks, not labelled on the chart.
//   migrants      stocks 2015 and 2024 only. From the region: the sheet's actors without Iran, plus the six Gulf states as destinations (the text
//                 needs Saudi Arabia, which the sheet leaves out); Israel and Iran are not drawn as destinations. To the region: the sheet's nine
//                 actors (Iran included). "overall 8 million" (India) is a rounding of 8.3 million. Mixed definitions: foreign-born (EU, US, Russia,
//                 Türkiye) vs foreign citizens (China, India, Iran, Japan).
//   f_chg, f_jpn  the dashed outlines show every actor's 2015 level; the labels give the percentage change of every actor (Japan: +201%, "tripling";
//                 482 and 1 451 are in the text). Türkiye shows +81% (80.6) where the text says 80 %.
//   Palestine*    the asterisk footnote ("standard EU formula") is not in the source; wording to be confirmed
//   perc, econ    Arab Barometer wave VIII (2023-2024), weighted shares of one country's answers. Panels = countries (Iraq, Jordan, Kuwait,
//                 Lebanon, Palestine*), no average across countries: Saudi Arabia and Qatar were not rated in Kuwait, and the economic-ties
//                 question was not asked there. Rows = the seven actors the text names; France (Lebanon only) and Israel are not drawn, the
//                 EU is not in the survey. Bars are coloured by answer, not by actor (row ids \"perc_*\" / \"econ_*\" on purpose, as in AF_soft.js).
//                 pc_us: the text says the US is viewed most negatively \"particularly in Iraq and Kuwait\"; Palestine* (74.0 %) is above Iraq
//                 (72.0 %). pc_ec_irn: the association between views of Iran and the wish to weaken ties is not in the aggregate data (see
//                 soft_5_perc_me.R). Steps about unfavourable views use the panels with the unfavourable share first (ids ending in \"_neg\").
//   footnotes     numbered 3 to 17: the intro notes 1 and 2 are typed in the body (as in the Africa chapters); the source numbers its own notes
//                 1 to 14. All footnotes and captions on the charts are drafts, shortened from the source document (no URLs).
//   typos         corrected: "Middle Easte" (l_intro), thousands separators in t_eu, t_us, t_rus ("370 082", "131 572", "126 966"); the source
//                 itself now reads "Middle East". Percent signs are as in the source ("92%" in t_*, "59 %" in s_* and f_*).

import { theme } from "../theme.js";

// footnotes (drafts from the source document)
const FN3 =
  "³ EIB, ‘Offices’; Agence Française de Développement (AFD), ‘Our network in the Orient’; AICS, ‘Field offices’; AECID, ‘Oficinas de la Cooperación Española’; Camões, ‘Co-operation’.";
const FN4 = "⁴ Japan International Cooperation Agency (JICA), ‘Middle East’.";
const FN5 =
  "⁵ Abu Dhabi Fund for Development (ADFD), Annual Report 2025; King Salman Humanitarian Aid and Relief Centre (KSrelief), ‘Statistics’, 2025–2026.";
const FN6 = "⁶ Turkish Cooperation and Coordination Agency (TİKA), ‘Offices’.";
const FN7 = "⁷ Rossotrudnichestvo, ‘Map’, projects.";
const FN8 =
  "⁸ US International Development Finance Corporation (DFC), 2025 Annual Report, 2025.";
const FN85 = "\n\n\n\n\n";
const FN9 =
  "⁹ Czech Centres; Finnish Institute in the Middle East; Alliances Françaises; Institut français; Goethe-Institut; Hungarian Academy in Jerusalem; Italian MFA, ‘Mappa’; Polish MFA, ‘Polish Institutes’; Instituto Cervantes.";
const FN10 = "¹⁰ Yunus Emre Enstitüsü, ‘Merkezlerimiz’.\n\n\n\n";
const FN11 =
  "¹¹ Russkiy Mir Foundation, catalogue of Russian centres and ‘cabinets’; Rossotrudnichestvo, ‘Russian houses abroad’.\n\n\n\n";
const FN115 = "\n";
const FN12 =
  "¹² Indian Council for Cultural Relations (ICCR); Korean Cultural Centers; King Sejong Institute Foundation; Confucius Institute, ‘Global Network’.";
const FN13 =
  "¹³ Ministries of Education and Higher Education of Bahrain, Kuwait, Oman and Saudi Arabia (cultural attachés, offices and missions).";
const FN14 =
  "¹⁴ Most data refer to 2023; Iran 2022, Saudi Arabia 2024, UAE 2012, Kuwait 2009, Israel 2014. EU: sum of member states, without Ireland and the Netherlands. UNESCO UIS, OPRI, February 2026.";
const FN15 =
  "¹⁵ UNDESA, International Migrant Stock 2024 (both sexes, mid-year). Definitions differ: foreign-born (EU, US, Russia, Türkiye) or foreign citizens (China, India, Iran, Japan); overseas territories excluded.";
const FN16 =
  "¹⁶ UNDESA, International Migrant Stock 2024 (both sexes, mid-year). Definitions differ by reporting country: foreign-born, foreign citizens, refugees, imputed stock.";
const FN17 =
  "¹⁷ Arab Barometer, wave VIII (2023–2024), weighted shares of each country’s answers. Countries surveyed: Iraq, Jordan, Kuwait, Lebanon, Palestine*. Saudi Arabia and Qatar were not rated in Kuwait, and the question on economic ties was not asked there. France, the only EU actor in the survey, was rated in Lebanon only and is not shown.";
const FN_ANY =
  "Any presence: office, partner country or project, ODA recipient, or presence not specified.";

// perceptions (Arab Barometer): rows, panels and segments; bars are coloured by answer (see PINNED)
const SRC_PERC =
  "Data: Arab Barometer, wave VIII (2023–2024); weighted shares of each country’s answers.";
const PERC_ROWS = [
  "perc_CHN",
  "perc_TUR",
  "perc_QAT",
  "perc_SAU",
  "perc_USA",
  "perc_IRN",
  "perc_RUS",
]; // order of the text
const PERC_ROWS_KWT = PERC_ROWS.filter(
  (r) => r !== "perc_QAT" && r !== "perc_SAU",
); // not rated in Kuwait
const PERC_LABELS = {
  perc_CHN: "China",
  perc_TUR: "Türkiye",
  perc_QAT: "Qatar",
  perc_SAU: "Saudi Arabia",
  perc_USA: "US",
  perc_IRN: "Iran",
  perc_RUS: "Russia",
};
const ECON_ROWS = PERC_ROWS.map((r) => r.replace("perc_", "econ_"));
const ECON_LABELS = Object.fromEntries(
  Object.entries(PERC_LABELS).map(([k, v]) => [k.replace("perc_", "econ_"), v]),
);
// [iso3, panel title, respondents]
const PERC_COUNTRIES = [
  ["IRQ", "Iraq", "1 190"],
  ["JOR", "Jordan", "1 192"],
  ["KWT", "Kuwait", "1 210"],
  ["LBN", "Lebanon", "1 227"],
  ["PSE", "Palestine*", "616"],
];
const ECON_COUNTRIES = [
  ["IRQ", "Iraq", "1 221"],
  ["JOR", "Jordan", "1 208"],
  ["LBN", "Lebanon", "1 176"],
  ["PSE", "Palestine*", "573"],
];
const PERC_ALL = PERC_COUNTRIES.map(([g]) => g);
const PERC_ALL_NEG = PERC_ALL.map((g) => `${g}_neg`);
const ECON_ALL = ECON_COUNTRIES.map(([g]) => g);
const PERC_P = { column: "favourable", label: "Favourable", color: "teal2" };
const PERC_DK = {
  column: "dontknow",
  label: "Don’t know",
  color: "light",
  opacity: 0.5,
};
const PERC_NG = {
  column: "unfavourable",
  label: "Unfavourable",
  color: "fuchsia2",
};
const percPanel = (id, title, n, geo, negFirst = false) => ({
  id,
  title,
  subtitle: `n = ${n}`,
  where: { geo },
  segments: negFirst ? [PERC_NG, PERC_DK, PERC_P] : [PERC_P, PERC_DK, PERC_NG],
  domain: [0, 100],
  format: "pct0",
  endLabel: { column: negFirst ? "unfavourable" : "favourable" },
});
const pc = (panels, highlight, extra = {}) => ({
  chart: "perc",
  state: { panels, highlight, footnote: FN17, ...extra },
});
const ec = (panels, highlight, extra = {}) => ({
  chart: "econ",
  state: { panels, highlight, footnote: FN17, ...extra },
});

// dot sizes compare across the maps and across regions (same as AF_soft.js): the same value gets the same radius
const DOT_MAX = 42;
const DOT_R = 24;

const SRC_DEV =
  "Data: official websites of agencies, ministries and entities, most recent report available (2023–2025).";
const SRC_CULT =
  "Data: websites of the institutes, cultural centres and ministries.";

export default {
  charts: {
    dev: {
      type: "dotMap",
      mode: "presence",
      data: "soft_1_dev",
      sub: "soft_1_dev_sub",
      title:
        "Development and humanitarian agencies in the Middle East and the Gulf",
      subtitleActor:
        "Countries where the selected actor’s agencies are present, by strongest type of presence",
      subtitleAll:
        "Number of actors with an office in each country (EU institutions and member states not included)",
      source: SRC_DEV,
      allLabel: "All actors (offices)",
      tilesWithData: true,
      sharedScale: true,
      scaleMax: DOT_MAX,
      rMax: DOT_R,
      keySize: "Actors with an office",
      keyValuesAll: [1, 3, 6],
      tooltipCount: (n) => `${n} actor${n === 1 ? "" : "s"} with an office`,
      shareText: (share, label) =>
        label === "All actors (offices)"
          ? `At least one office in ${share}% of countries`
          : `${label}: present in ${share}% of countries`,
      categories: {
        Office: { label: "Office", tooltip: "office", color: theme.navy, r: 5 },
        "Sector in embassy": {
          label: "Sector in embassy",
          tooltip: "sector in embassy",
          color: theme.teal2,
          r: 4.5,
        },
        Projects: {
          label: "Projects",
          tooltip: "projects",
          color: theme.teal,
          r: 4.5,
        },
        Grants: {
          label: "Grants",
          tooltip: "grants",
          color: theme.muted,
          r: 3.5,
        },
        None: {
          label: "No presence",
          tooltip: "no presence",
          color: theme.light,
          r: 2.5,
        },
      },
    },

    devms: {
      type: "dotMap",
      mode: "count",
      data: "soft_1_dev_ms",
      title:
        "EU member states’ development agencies in the Middle East and the Gulf",
      subtitleActor:
        "Number of EU member states present in each country, by the type of presence selected (separate counts)",
      subtitleAll:
        "Number of EU member states with any presence in each country (office, partner country or project, ODA recipient, not specified)",
      source:
        "Data: websites of EU member states’ development agencies and ministries.",
      allLabel: "Any presence",
      tilesWithData: true,
      extraTiles: [
        { actor: "MS_office", label: "Offices" },
        { actor: "MS_partner", label: "Partner countries and projects" },
      ],
      ownDots: false,
      sharedScale: true,
      scaleMax: DOT_MAX,
      rMax: DOT_R,
      keySize: "Member states",
      keyValuesActor: [1, 5, 10, 20],
      keyValuesAll: [1, 5, 10, 20],
      tooltipCount: (n) => `${n} EU member state${n === 1 ? "" : "s"}`,
      shareText: (share) => `${share}%`,
    },

    lang: {
      type: "panelBars",
      data: "soft_2_lang",
      rowKey: "actor",
      rows: [
        "EU",
        "FRA",
        "DEU",
        "TUR",
        "CHN",
        "RUS",
        "KOR",
        "IND",
        "SAU",
        "OMN",
        "BHR",
        "KWT",
      ],
      rowLabels: {
        EU: "EU member states",
        FRA: "of which France",
        DEU: "of which Germany",
      },
      labelWidth: 150,
      title: "Cultural and language institutes in the Middle East and the Gulf",
      subtitle:
        "Countries with at least one centre, and number of centres (institutes, centres, missions, attachés and offices), 2026",
      source: SRC_CULT,
      panels: [
        {
          id: "countries",
          title: "Countries",
          subtitle: "With at least one centre",
          segments: [
            { column: "countries", label: "Countries", color: "actor" },
          ],
          format: "num",
        },
        {
          id: "centres",
          title: "Centres",
          subtitle: "All types",
          segments: [{ column: "centres", label: "Centres", color: "actor" }],
          format: "num",
        },
      ],
    },

    langmap: {
      type: "geoBubbles",
      data: "soft_2_lang_map",
      title: "Cultural and language institutes by country",
      source: SRC_CULT,
      rMax: 22,
      labels: { EU: "EU member states", FRA: "France", DEU: "Germany" },
      greyLabel: "Other",
      measures: {
        centres: {
          title: "Cultural and language institutes by country",
          subtitle: (a, label) =>
            a === "all"
              ? "Number of centres (institutes, missions, attachés and offices) of all actors in each country, 2026. Bubble area: number of centres."
              : `${label}: number of centres in each country, 2026. Bubble area: number of centres, same scale in every view.`,
          unit: "centres",
          sizeTitle: "Centres",
          format: ",.0f",
          keyAll: [1, 5, 10, 15],
          sharedScale: true,
        },
      },
    },

    stud: {
      type: "sankey",
      data: "soft_3_stud",
      title: "Students from the Middle East and the Gulf in external actors",
      subtitle: () =>
        "Students by country of origin (left) and host actor (right), 2023 (latest available year for some actors)",
      source:
        "Data: UNESCO Institute for Statistics (UIS), OPRI inbound international students, February 2026.",
      unit: "Number of students",
      tipLabel: "Students",
      reverse: true,
      depth: "country",
      periods: { all: { label: "2023" } },
      nSuppliers: 6,
      nCountries: 13,
      otherSuppliers: "Other destinations",
      otherRecipients: "Other origins",
      marginLeft: 120,
      marginRight: 120,
    },

    migFrom: {
      type: "sankey",
      data: "soft_4_mig_from",
      title:
        "Migrants from the Middle East and the Gulf in the external actors",
      subtitle: (s, period) =>
        `Stock of migrants by country of origin (left) and host actor (right), ${period}`,
      source: "Data: UNDESA, International Migrant Stock 2024.",
      unit: "Migrants (stock, mid-year)",
      tipLabel: "Migrants",
      reverse: true,
      depth: "country",
      defaultPeriod: "p2",
      periods: {
        p1: { label: "2015", from: 2015, to: 2015 },
        p2: { label: "2024", from: 2024, to: 2024 },
      },
      nSuppliers: 6,
      nCountries: 13,
      otherSuppliers: "Other destinations",
      otherRecipients: "Other origins",
      marginLeft: 120,
      marginRight: 195,
    },

    migTo: {
      type: "sankey",
      data: "soft_4_mig_to",
      title:
        "Migrants from the external actors in the Middle East and the Gulf",
      subtitle: (s, period) =>
        `Stock of migrants by actor of origin (left) and country of residence (right), ${period}`,
      source: "Data: UNDESA, International Migrant Stock 2024.",
      unit: "Migrants (stock, mid-year)",
      tipLabel: "Migrants",
      depth: "country",
      defaultPeriod: "p2",
      periods: {
        p1: { label: "2015", from: 2015, to: 2015 },
        p2: { label: "2024", from: 2024, to: 2024 },
      },
      nSuppliers: 7,
      nCountries: 13,
      otherSuppliers: "Other origins",
      otherRecipients: "Other countries",
      marginLeft: 110,
      marginRight: 120,
    },

    // ── perceptions (Arab Barometer): bars are coloured by answer, not by actor ──
    perc: {
      type: "panelBars",
      data: "soft_5_perc",
      rowKey: "row",
      prepare: ({ rows }) =>
        rows.map((r) => ({ ...r, row: `perc_${r.actor}` })),
      rows: PERC_ROWS,
      rowLabels: PERC_LABELS,
      labelWidth: 92,
      title: "Opinion of external actors in the Middle East and the Gulf",
      subtitle:
        "Share of respondents by how favourably they view each actor, 2023–2024",
      source: SRC_PERC,
      key: [
        { label: "Favourable", color: "teal2" },
        { label: "Don’t know", color: "light", opacity: 0.5 },
        { label: "Unfavourable", color: "fuchsia2" },
      ],
      panels: [
        ...PERC_COUNTRIES.map(([geo, title, n]) =>
          percPanel(geo, title, n, geo),
        ),
        ...PERC_COUNTRIES.map(([geo, title, n]) =>
          percPanel(`${geo}_neg`, title, n, geo, true),
        ),
      ],
    },

    econ: {
      type: "panelBars",
      data: "soft_5_econ",
      rowKey: "row",
      prepare: ({ rows }) =>
        rows.map((r) => ({ ...r, row: `econ_${r.actor}` })),
      rows: ECON_ROWS,
      rowLabels: ECON_LABELS,
      labelWidth: 92,
      title: "Preferred future economic relations with external actors",
      subtitle:
        "Share of respondents by whether their country’s economic ties with each actor should become stronger, stay the same or become weaker, 2023–2024",
      source: SRC_PERC,
      key: [
        { label: "Stronger", color: "teal2" },
        { label: "Same", color: "light" },
        { label: "Don’t know", color: "light", opacity: 0.5 },
        { label: "Weaker", color: "fuchsia2" },
      ],
      panels: ECON_COUNTRIES.map(([geo, title, n]) => ({
        id: geo,
        title,
        subtitle: `n = ${n}`,
        where: { geo },
        segments: [
          { column: "stronger", label: "Stronger", color: "teal2" },
          { column: "same", label: "Same", color: "light" },
          { column: "dontknow", label: "Don’t know", color: "light", opacity: 0.5 },
          { column: "weaker", label: "Weaker", color: "fuchsia2" },
        ],
        domain: [0, 100],
        format: "pct0",
        endLabel: { column: "stronger" },
      })),
    },
  },

  steps: {
    // ── Geographical distribution of development agencies, grants and projects in the Middle East and the Gulf ──────────
    d_all: { chart: "dev", state: { actor: "all", subregion: "Middle East" } },
    d_ms: { chart: "devms", state: { actor: "MS_office", footnote: FN3 } },
    d_jpn: {
      chart: "dev",
      state: {
        actor: "JPN",
        subregion: "Gulf",
        labels: ["SAU"],
        footnote: FN4,
      },
    },
    d_adfd: {
      chart: "dev",
      state: { actor: "ARE", subregion: "Gulf", labels: ["BHR", "OMN"] },
    },
    d_ksr: {
      chart: "dev",
      state: {
        actor: "SAU",
        subregion: "Gulf",
        labels: ["OMN"],
        footnote: FN5,
      },
    },
    d_tika: {
      chart: "dev",
      state: { actor: "TUR", subregion: "Middle East", footnote: FN6 },
    },
    d_jica: { chart: "dev", state: { actor: "JPN", subregion: "Middle East" } },
    d_rus: {
      chart: "dev",
      state: {
        actor: "RUS",
        subregion: "Middle East",
        labels: ["PSE", "SYR", "LBN", "JOR"],
        footnote: FN7,
      },
    },
    d_qffd: { chart: "dev", state: { actor: "QAT", subregion: "Middle East" } },
    d_dfc: {
      chart: "dev",
      state: {
        actor: "USA",
        subregion: "Middle East",
        labels: ["JOR"],
        footnote: FN8,
      },
    },
    // ── Cultural cooperation and language institutes ──────────
    l_intro: { chart: "lang", state: {} },
    l_eu: { chart: "langmap", state: { measure: "centres", actor: "EU" } },
    l_fra: { chart: "lang", state: { highlight: ["FRA", "DEU"] } },
    l_it: {
      chart: "langmap",
      state: {
        measure: "centres",
        actor: "EU",
        highlight: ["ISR", "LBN", "ARE", "JOR"],
        labels: ["ISR", "LBN", "ARE", "JOR"],
        footnote: FN85,
      },
    },
    l_cz: {
      chart: "langmap",
      state: {
        measure: "centres",
        actor: "EU",
        highlight: ["ISR", "LBN"],
        labels: ["ISR", "LBN"],
        footnote: FN9,
      },
    },
    l_tur: {
      chart: "langmap",
      state: {
        measure: "centres",
        actor: "TUR",
        labels: ["SYR", "PSE"],
        footnote: FN10,
      },
    },
    l_rus: {
      chart: "langmap",
      state: {
        measure: "centres",
        actor: "RUS",
        labels: ["ISR", "PSE", "JOR", "SYR", "ARE", "LBN"],
        footnote: FN11,
      },
    },
    l_chn: { chart: "lang", state: { highlight: ["CHN", "KOR", "IND"] } },
    l_kor: {
      chart: "langmap",
      state: { measure: "centres", actor: "KOR", footnote: FN115 },
    },
    l_ind: {
      chart: "langmap",
      state: {
        measure: "centres",
        actor: "IND",
        labels: ["ISR"],
        footnote: FN12,
      },
    },
    l_gulf: {
      chart: "lang",
      state: { highlight: ["SAU", "OMN", "BHR", "KWT"] },
    },
    l_gulf_loc: {
      chart: "langmap",
      state: {
        measure: "centres",
        actor: "SAU",
        labels: ["JOR", "LBN"],
        footnote: FN13,
      },
    },
    // ── Students from the Middle East and the Gulf in external actors14 ──────────
    s_intro: { chart: "stud", state: { footnote: FN14 } },
    s_tur: {
      chart: "stud",
      state: {
        highlight: [
          { from: "Türkiye", to: "SYR" },
          { from: "Türkiye", to: "IRQ" },
        ],
        show: ["SYR", "IRQ"],
        footnote: FN14,
      },
    },
    s_eu: {
      chart: "stud",
      state: {
        highlight: [
          { from: "EU", to: "SYR" },
          { from: "EU", to: "LBN" },
        ],
        show: ["SYR", "LBN"],
        footnote: FN14,
      },
    },
    s_irn: {
      chart: "stud",
      state: {
        highlight: [{ from: "Iran", to: "IRQ" }],
        show: ["IRQ"],
        footnote: FN14,
      },
    },
    s_us: {
      chart: "stud",
      state: {
        highlight: [
          { from: "US", to: "SAU" },
          { from: "US", to: "KWT" },
        ],
        show: ["SAU", "KWT"],
        footnote: FN14,
      },
    },
    s_sau: {
      chart: "stud",
      state: {
        highlight: [
          { from: "Saudi Arabia", to: "YEM" },
          { from: "Saudi Arabia", to: "SYR" },
          { from: "Saudi Arabia", to: "PSE" },
        ],
        show: ["YEM", "SYR", "PSE"],
        footnote: FN14,
      },
    },
    // ── Recorded migrant stocks from the Middle East and the Gulf in the external actors considered15 ──────────
    f_intro: { chart: "migFrom", state: { period: "p2", footnote: FN15 } },
    f_tur: {
      chart: "migFrom",
      state: {
        period: "p2",
        highlight: [
          { from: "Türkiye", to: "SYR" },
          { from: "Türkiye", to: "IRQ" },
        ],
        show: ["SYR", "IRQ"],
        footnote: FN15,
      },
    },
    f_sau: {
      chart: "migFrom",
      state: {
        period: "p2",
        highlight: [
          { from: "Saudi Arabia", to: "YEM" },
          { from: "Saudi Arabia", to: "SYR" },
          { from: "Saudi Arabia", to: "JOR" },
        ],
        show: ["YEM", "SYR", "JOR"],
        footnote: FN15,
      },
    },
    f_eu: {
      chart: "migFrom",
      state: {
        period: "p2",
        highlight: [
          { from: "EU", to: "SYR" },
          { from: "EU", to: "IRQ" },
        ],
        show: ["SYR", "IRQ"],
        footnote: FN15,
      },
    },
    f_chg: {
      chart: "migFrom",
      state: {
        period: "p2",
        change: true,
        changeSuppliers: ["EU", "Türkiye", "Saudi Arabia"],
        highlight: ["EU", "Türkiye", "Saudi Arabia"],
        footnote: FN15,
      },
    },
    f_jpn: {
      chart: "migFrom",
      state: {
        period: "p2",
        change: true,
        changeSuppliers: ["Japan"],
        highlight: ["Japan"],
        footnote: FN15,
      },
    },
    // ── Recorded migrant stocks from the external actors considered to the Middle East and the Gulf16 ──────────
    t_ind: {
      chart: "migTo",
      state: {
        period: "p2",
        highlight: [
          { from: "India", to: "ARE" },
          { from: "India", to: "SAU" },
          { from: "India", to: "KWT" },
        ],
        show: ["ARE", "SAU", "KWT"],
        footnote: FN16,
      },
    },
    t_eu: {
      chart: "migTo",
      state: {
        period: "p2",
        highlight: [
          { from: "EU", to: "ISR" },
          { from: "EU", to: "ARE" },
        ],
        show: ["ISR", "ARE"],
        footnote: FN16,
      },
    },
    t_us: {
      chart: "migTo",
      state: {
        period: "p2",
        highlight: [{ from: "US", to: "ISR" }],
        show: ["ISR"],
        footnote: FN16,
      },
    },
    t_rus: {
      chart: "migTo",
      state: {
        period: "p2",
        highlight: [{ from: "Russia", to: "ISR" }],
        show: ["ISR"],
        footnote: FN16,
      },
    },

    // ── Comparison of perceptions of external actors’ influence¹⁷ ──────────
    pc_intro: pc(PERC_ALL, []),
    pc_top: pc(PERC_ALL, ["perc_CHN", "perc_TUR", "perc_QAT"]),
    pc_chn: pc(PERC_ALL, ["perc_CHN"]),
    pc_chn_pse: pc(["PSE"], ["perc_CHN"]),
    pc_jor: pc(["JOR"], ["perc_QAT", "perc_TUR"]),
    pc_pse: pc(["PSE"], ["perc_TUR", "perc_QAT"]),
    pc_irq: pc(["IRQ"], ["perc_TUR", "perc_QAT"]),
    pc_us: pc(PERC_ALL_NEG, ["perc_USA"]),
    pc_us_rng: pc(["KWT", "JOR"], ["perc_USA"]),
    pc_irn: pc(PERC_ALL_NEG, ["perc_IRN"]),
    pc_irn_fav: pc(["LBN", "IRQ"], ["perc_IRN"]),
    pc_sau: pc(["JOR"], ["perc_SAU"]),
    pc_rus: pc(["KWT"], ["perc_RUS"], { rows: PERC_ROWS_KWT }),
    pc_rus_lim: pc(PERC_ALL, ["perc_RUS"]),
    pc_ec_us: ec(["IRQ", "LBN"], ["econ_USA"]),
    pc_ec_irn: ec(ECON_ALL, ["econ_IRN"]),
  },
};
