// ME_dipl.js: Middle East and Gulf, diplomatic chapter
//
// Mirror of AF_dipl.js. Same structure:
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (dipl_1_emb -> dipl_1_emb_ME.csv)
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of the chart module)
//
// Values marked "tune" depend on the real data; check them on the first render.

import { theme } from "../theme.js";

export default {
  charts: {
    emb: {
      type: "dotMap",
      data: "dipl_1_emb",
      title: "Embassies in the Middle East and the Gulf",
      subtitleActor:
        "Countries hosting an embassy of the selected actor, July 2026",
      subtitleAll:
        "Number of actors with an embassy in each country, July 2026",
      source: "Data: EEAS; foreign ministry websites",
      mode: "presence",
      allLabel: "All actors",
      keySize: "Actors with an embassy",
      keyValuesAll: [1, 8, 15], // 15 = every actor but the country's own (tune)
      tooltipCount: (n, label, total) =>
        `${n} of ${total} actors have an embassy`,
      categories: {
        Embassy: {
          label: "Embassy",
          tooltip: "embassy",
          color: theme.teal,
          r: 4.5,
        },
        Office: {
          label: "Office or consulate",
          tooltip: "office or consulate",
          color: theme.navy,
          r: 4.5,
        },
        None: {
          label: "No embassy",
          tooltip: "no embassy",
          color: theme.light,
          r: 2.5,
        },
      },
    },

    vis: {
      type: "dotMap",
      mode: "count",
      data: "dipl_2_vis",
      sub: "dipl_2_vis_sub",
      title: "High-level visits to the Middle East and the Gulf",
      subtitleActor:
        "Visits by the selected actor's head of state or government and foreign minister, January 2019–July 2026",
      subtitleAll:
        "Visits by heads of state or government and foreign ministers of all actors, January 2019–July 2026",
      source:
        "NB: A joint visit counts once. Data: official government sources and media. ",
      allLabel: "All actors",
      // smaller than Africa: Bahrain and Qatar sit ~20px apart on this map (tune)
      rMaxActor: 10,
      rMaxAll: 11,
      keySize: "Visits",
      tooltipCount: (n, label) => `${label}: ${n} visit${n === 1 ? "" : "s"}`,
      shareText: (share, label) =>
        `${share}% of ${label === "All actors" ? "all" : label + "'s"} visits`,
    },

    lab: {
      type: "dotMap",
      mode: "presence",
      data: "dipl_3_emblab",
      title: "Formal partnerships with countries in the Middle East and the Gulf",
      subtitleActor:
        "Countries with which the selected actor has a formalised partnership, by rank of the label",
      subtitleAll:
        "Number of actors with a formalised partnership with each country",
      source: "Data: EEAS; foreign ministry websites",
      allLabel: "All actors",
      keyByActor: true,
      rMaxAll: 10,
      keySize: "Actors with a partnership",
      tooltipCount: (n) =>
        `${n} actor${n === 1 ? "" : "s"} with a formal partnership`,
      categories: {
        High: {
          label: "High rank",
          tooltip: "high-ranking partnership",
          color: theme.navy,
          r: 7,
        },
        Medium: {
          label: "Medium rank",
          tooltip: "medium-ranking partnership",
          color: theme.teal,
          r: 5.5,
        },
        Low: {
          label: "Low rank",
          tooltip: "low-ranking partnership",
          color: "#a9d4e4",
          r: 4,
        },
        None: {
          label: "No partnership",
          tooltip: "no formal partnership",
          color: theme.light,
          r: 2.5,
        },
      },
    },

    sum: {
      type: "rangeChart",
      data: "dipl_4_sum",
      title: "Summits with the Gulf, Arab and Islamic world",
      subtitle:
        "Launch year, latest summit and next scheduled summit of each summit series",
      source: "Data: official government sources and media",
      domain: [2014, 2027], // series run 2015–2026
      tickStep: 5,
      keySize: "Summits held to date",
      keyLast: "Latest summit",
      keyNext: "Next scheduled",
      extraActors: { FRA: "France", ITA: "Italy" },
      // series planned but postponed: id -> planned year (shown as a dashed marker)
      postponed: { 13: 2026, 9: 2025 }, // China–Arab States (sine die), Russia–Arab world
      keyPostponed: "Postponed",
      shortNames: {
        "European Union – Gulf Cooperation Council Summit": "EU–GCC Summit",
        "United States–Gulf Cooperation Council Summit": "US–GCC Summit",
        "Jeddah Security and Development Summit": "Jeddah Security and Development",
      },
    },

    unga_ukr: {
      type: "tileGrid",
      data: "dipl_5_unga_ukr",
      title: "Voting on Ukraine at the UN General Assembly",
      source: "Source: UN Digital Library",
      actorsLabel: "External actors, for comparison",
      gridSize: [0, 9], // frame height in tile rows: keeps the tile size whatever the layout
      sideCols: 2, // two tile columns of white space left and right
      measures: {
        abs: {
          label: "Abstention rate",
          subtitle: "Share of votes in which the country abstained",
          color: theme.teal,
        },
        rus: {
          label: "Alignment with Russia",
          subtitle: "Share of votes in which the country voted with Russia",
          color: theme.fuchsia,
        },
      },
    },

    unga_ter: {
      type: "tileGrid",
      data: "dipl_5_un_ter",
      title:
        "Voting on the Israeli-occupied territories at the UN General Assembly",
      source: "Source: UN Digital Library",
      actorsLabel: "External actors, for comparison",
      gridSize: [0, 9], // frame height in tile rows: keeps the tile size whatever the layout
      sideCols: 2, // two tile columns of white space left and right
      periods: {
        all: { label: "all years", short: "All years" },
        1622: { label: "2016–2022", short: "2016–22" },
        2326: { label: "2023–2026", short: "2023–26" },
      },
      measures: {
        isr: {
          label: "Alignment with Israel",
          subtitle: "Share of votes in which the country voted with Israel",
          color: theme.fuchsia,
        },
        eu: {
          label: "Alignment with the EU",
          subtitle: "Share of votes in which the country voted with the EU",
          color: theme.navy,
          breaks: [0.4, 0.5, 0.6, 0.75],
          binLabels: ["Up to 40%", "41–50%", "51–60%", "61–75%", "Over 75%"],
        },
        abs: {
          label: "Abstention rate",
          subtitle: "Share of votes in which the country abstained",
          color: theme.teal,
        },
      },
    },

    unga_gaz: {
      type: "tileGrid",
      data: "dipl_5_un_gaz",
      title:
        "Voting on Gaza and the Palestinian territories at the UN General Assembly",
      source: "Source: UN Digital Library",
      actorsLabel: "External actors, for comparison",
      gridSize: [0, 9], // frame height in tile rows: keeps the tile size whatever the layout
      sideCols: 2, // two tile columns of white space left and right
      periods: { all: { label: "since 2023", short: "Since 2023" } },
      tooltipAlso: ["nv"],
      measures: {
        abs: {
          label: "Abstention rate",
          subtitle: "Share of votes in which the country abstained",
          color: theme.fuchsia,
        },
        nv: {
          label: "Non-voting rate",
          subtitle: "Share of votes in which the country did not vote",
          color: theme.teal,
        },
        isr: {
          label: "Alignment with Israel",
          subtitle: "Share of votes in which the country voted with Israel",
          color: theme.fuchsia,
        },
        eu: {
          label: "Alignment with the EU",
          subtitle: "Share of votes in which the country voted with the EU",
          color: theme.teal,
          breaks: [0.25, 0.5, 0.75, 0.9],
          binLabels: ["Up to 25%", "26–50%", "51–75%", "76–90%", "Over 90%"],
        },
      },
    },
  },

  steps: {
    emb_tur: { chart: "emb", state: { actor: "TUR" } },
    emb_isr: { chart: "emb", state: { actor: "ISR" } },
    emb_eu: { chart: "emb", state: { actor: "EU", labels: ["OMN"] } },
    emb_explore: { chart: "emb", state: { actor: "all" } },

    vis_intro: { chart: "vis", state: { actor: "all" } },
    vis_top: { chart: "vis", state: { actor: "all" } },
    vis_pattern: { chart: "vis", state: { actor: "all" } },
    vis_usa: {
      chart: "vis",
      state: { actor: "USA", labels: ["ISR", "SAU"] },
    },
    vis_tur: {
      chart: "vis",
      state: { actor: "TUR", labels: ["QAT", "SAU"] },
    },
    vis_irn: {
      chart: "vis",
      state: { actor: "IRN", labels: ["QAT", "IRQ"] },
    },
    vis_eu: {
      chart: "vis",
      state: { actor: "EU", labels: ["JOR", "ARE"] },
    },
    vis_gcc: { chart: "vis", state: { actor: "all" } },

    lab_intro: { chart: "lab", state: { actor: "all" } },
    lab_chn: {
      chart: "lab",
      state: { actor: "CHN", labels: ["BHR", "SAU", "ARE", "ISR"] },
    },
    lab_usa: {
      chart: "lab",
      state: { actor: "USA", labels: ["ISR"] },
    },
    lab_tur: {
      chart: "lab",
      state: { actor: "TUR", labels: ["QAT", "IRQ", "JOR", "ARE"] },
    },
    lab_ind: {
      chart: "lab",
      state: { actor: "IND", labels: ["ARE", "ISR", "KWT", "OMN", "SAU"] },
    },
    lab_rus: {
      chart: "lab",
      state: { actor: "RUS", labels: ["ARE", "SAU"] },
    },
    lab_eu: {
      chart: "lab",
      state: { actor: "EU", labels: ["JOR", "QAT", "ARE", "BHR"] },
    },

    sum_intro: { chart: "sum", state: {} },
    sum_eu_usa: { chart: "sum", state: { highlight: ["2", "5"] } }, // EU–GCC, US–GCC
    sum_chn: { chart: "sum", state: { highlight: ["13"] } },
    sum_rus: { chart: "sum", state: { highlight: ["9"] } },

    unga_ukr_intro: {
      chart: "unga_ukr",
      state: { measure: "abs", period: "all" },
    },
    unga_ukr_abst: {
      chart: "unga_ukr",
      state: { measure: "abs", period: ["1621", "2226"] },
    },
    unga_ukr_isr: {
      chart: "unga_ukr",
      state: {
        measure: "rus",
        period: "all",
        highlight: ["ISR"],
        values: ["ISR"],
      },
    },
    unga_ukr_syr: {
      chart: "unga_ukr",
      state: {
        measure: "rus",
        period: ["1621", "2226"],
        highlight: ["SYR"],
        values: ["SYR"],
      },
    },
    unga_ukr_irn: {
      chart: "unga_ukr",
      state: {
        measure: "rus",
        period: ["1621", "2226"],
        highlight: ["IRN"],
        values: ["IRN"],
      },
    },
    unga_ukr_chn_ind: {
      chart: "unga_ukr",
      state: {
        measure: "rus",
        period: ["1621", "2226"],
        highlight: ["CHN", "IND"],
        values: ["CHN", "IND"],
      },
    },
    unga_ukr_chn_ind_abs: {
      chart: "unga_ukr",
      state: {
        measure: "abs",
        period: ["1621", "2226"],
        highlight: ["CHN", "IND"],
        values: ["CHN", "IND"],
      },
    },
    unga_ukr_west: {
      chart: "unga_ukr",
      state: {
        measure: "rus",
        period: "all",
        highlight: ["USA", "EU", "JPN", "KOR"],
        values: ["USA", "EU", "JPN", "KOR"],
      },
    },

    unga_ter_abst: {
      chart: "unga_ter",
      state: { measure: "abs", period: "all" },
    },
    unga_ter_isr: {
      chart: "unga_ter",
      state: { measure: "isr", period: "all" },
    },
    unga_ter_usa: {
      chart: "unga_ter",
      state: {
        measure: "isr",
        period: ["1622", "2326"],
        highlight: ["USA"],
        values: ["USA"],
      },
    },
    unga_ter_eu: {
      chart: "unga_ter",
      state: { measure: "eu", period: ["1622", "2326"] },
    },
    unga_ter_eums: {
      chart: "unga_ter",
      state: {
        measure: "abs",
        period: ["1622", "2326"],
        highlight: ["EU"],
        values: ["EU"],
      },
    },

    unga_gaz_usa: {
      chart: "unga_gaz",
      state: {
        measure: "isr",
        period: "all",
        highlight: ["USA", "EU"],
        values: ["USA", "EU"],
      },
    },
    unga_gaz_eu: {
      chart: "unga_gaz",
      state: { measure: "eu", period: "all" },
    },
    unga_gaz_isr: {
      chart: "unga_gaz",
      state: {
        measure: "eu",
        period: "all",
        highlight: ["ISR", "USA"],
        values: ["ISR", "USA"],
      },
    },
  },
};
