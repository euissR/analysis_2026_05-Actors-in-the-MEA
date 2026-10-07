// AF_dipl.js: Africa, diplomatic chapter
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (dipl_1_emb -> dipl_1_emb_AF.csv)
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of the chart module)

import { theme } from "../theme.js";

const crowded = ["DZA", "EGY", "ETH", "KEN", "SEN", "TUN"];
const south = "Southern Africa and Indian Ocean";
const dense = ["COD", "EGY", "MAR", "NGA", "ZAF"]; // highest density of partnerships

export default {
  charts: {
    emb: {
      type: "dotMap",
      data: "dipl_1_emb",
      title: "Embassies in Africa",
      subtitleActor:
        "Countries hosting an embassy of the selected actor, July 2026",
      subtitleAll:
        "Number of actors with an embassy in each country, July 2026",
      source: "Data: EEAS; foreign ministry websites",
      mode: "presence",
      allLabel: "All actors",
      keySize: "Actors with an embassy",
      keyValuesAll: [1, 8, 16],
      tooltipCount: (n, label, total) =>
        `${n} of ${total} actors have an embassy`,
      // presence values in the data -> how they're drawn and described
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
      title: "High-level visits to Africa",
      subtitleActor:
        "Visits by the selected actor's head of state or government and foreign minister, January 2019–July 2026",
      subtitleAll:
        "Visits by heads of state or government and foreign ministers of all actors, January 2019–July 2026",
      source:
        "NB: A joint visit counts once. Data: official government sources and media. ",
      allLabel: "All actors",
      rMaxActor: 12,
      rMaxAll: 20,
      keySize: "Visits",
      keyValuesActor: [1, 5, 15],
      keyValuesAll: [1, 10, 50, 100],
      tooltipCount: (n, label) => `${label}: ${n} visit${n === 1 ? "" : "s"}`,
      shareText: (share, label) =>
        `${share}% of ${label === "All actors" ? "all" : label + "'s"} visits`,
    },

    sum: {
      type: "rangeChart",
      data: "dipl_4_sum",
      title: "Summits with African leaders",
      subtitle:
        "Launch year, latest summit and next scheduled summit of each summit series",
      source: "Data: official government sources and media",
      domain: [1970, 2030],
      keySize: "Summits held to date",
      keyValues: [1, 10, 29],
      keyLast: "Latest summit",
      keyNext: "Next scheduled",
      // actors that are not in actors.csv (and so not on the maps): code -> label
      extraActors: { FRA: "France", ITA: "Italy" },
      // summit names without an acronym in brackets are shown in full; shorten them here
      shortNames: {
        "Sommet France-Afrique / New Africa-France Summit / Africa Forward":
          "Africa–France Summit",
        "Russia–Africa Summit and Economic Forum": "Russia–Africa Summit",
        "Iran-Africa Economic Cooperation Summit": "Iran–Africa Summit",
        "Türkiye–Africa Partnership Summit": "Türkiye–Africa Summit",
      },
    },

    lab: {
      type: "dotMap",
      mode: "presence",
      data: "dipl_3_emblab",
      title: "Formal partnerships with African countries",
      subtitleActor:
        "Countries with which the selected actor has a formalised partnership, by rank of the label",
      subtitleAll:
        "Number of actors with a formalised partnership with each country",
      source: "Data: EEAS; foreign ministry websites",
      allLabel: "All actors",
      keyByActor: true,
      rMaxAll: 14,
      keySize: "Actors with a partnership",
      keyValuesAll: [1, 5, 9],
      tooltipCount: (n) =>
        `${n} actor${n === 1 ? "" : "s"} with a formal partnership`,
      // Ranking values in dipl_3_emblab_AF.csv -> how they're drawn and described.
      // Rank is shown by colour and size.
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

    unga_ukr: {
      type: "tileGrid",
      data: "dipl_5_unga_ukr",
      title: "Voting on Ukraine at the UN General Assembly",
      source: "Source: UN Digital Library",
      actorsLabel: "External actors, for comparison",
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
      periods: {
        all: { label: "all years", short: "All years" },
        1622: { label: "2016–2022", short: "2016–22" },
        2326: { label: "2023–2026", short: "2023–26" },
      },
      measures: {
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
        nv: {
          label: "Non-voting rate",
          subtitle: "Share of votes in which the country did not vote",
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
    emb_chn: { chart: "emb", state: { actor: "CHN" } },
    emb_eu: { chart: "emb", state: { actor: "EU" } },
    emb_us: { chart: "emb", state: { actor: "USA" } },
    emb_all: {
      chart: "emb",
      state: { actor: "all", highlight: crowded, labels: crowded },
    },
    emb_explore: { chart: "emb", state: { actor: "all" } },

    vis_intro: { chart: "vis", state: { actor: "all" } },
    vis_north: {
      chart: "vis",
      state: { actor: "all", subregion: "North Africa" },
    },
    vis_eu: {
      chart: "vis",
      state: { actor: "EU", labels: ["EGY", "ETH", "KEN", "RWA", "ZAF"] },
    },
    vis_tur: {
      chart: "vis",
      state: {
        actor: "TUR",
        subregion: "North Africa",
        labels: ["EGY", "DZA", "LBY"],
      },
    },
    vis_chn: { chart: "vis", state: { actor: "CHN" } },
    vis_ind: {
      chart: "vis",
      state: { actor: "IND", subregion: south, labels: ["ZAF", "MUS"] },
    },
    vis_jpn: {
      chart: "vis",
      state: { actor: "JPN", subregion: south, labels: ["ZAF", "MUS"] },
    },
    vis_kor: {
      chart: "vis",
      state: { actor: "KOR", subregion: south, labels: ["ZAF", "MUS"] },
    },

    sum_intro: { chart: "sum", state: {} },
    sum_au: { chart: "sum", state: { highlight: ["EU"] } },
    sum_crowded: { chart: "sum", state: {} },
    sum_reliable: {
      chart: "sum",
      state: { highlight: ["EU", "CHN", "JPN", "RUS", "TUR", "SAU", "KOR"] },
    },
    sum_iran: { chart: "sum", state: { highlight: ["IRN"] } },

    lab_intro: { chart: "lab", state: { actor: "all" } },
    lab_chn: { chart: "lab", state: { actor: "CHN" } },
    lab_eu: {
      chart: "lab",
      state: { actor: "EU", labels: ["EGY", "ZAF", "NGA"] },
    },
    lab_us: {
      chart: "lab",
      state: { actor: "USA", labels: ["MAR", "TUN", "EGY", "KEN"] },
    },
    lab_uae: { chart: "lab", state: { actor: "ARE" } },
    lab_ind: { chart: "lab", state: { actor: "IND", labels: ["MUS"] } },
    lab_rus: {
      chart: "lab",
      state: { actor: "RUS", labels: ["DZA", "EGY", "ZAF"] },
    },
    lab_all: {
      chart: "lab",
      state: { actor: "all", highlight: dense, labels: dense },
    },

    unga_ukr_intro: {
      chart: "unga_ukr",
      state: { measure: "abs", period: "all" },
    },
    unga_ukr_abst: {
      chart: "unga_ukr",
      state: { measure: "abs", period: ["1621", "2226"] },
    },
    unga_ukr_rus: {
      chart: "unga_ukr",
      state: { measure: "rus", period: "all" },
    },
    unga_ukr_eu: {
      chart: "unga_ukr",
      state: {
        measure: "rus",
        period: "all",
        highlight: ["CPV", "LBR", "SYC"],
        values: ["CPV", "LBR", "SYC"],
      },
    },
    unga_ukr_ru_lean: {
      chart: "unga_ukr",
      state: {
        measure: "rus",
        period: "all",
        highlight: ["ERI", "SDN", "BDI", "ZWE", "MLI"],
        values: ["ERI", "SDN", "BDI", "ZWE", "MLI"],
      },
    },
    unga_ukr_shift: {
      chart: "unga_ukr",
      state: {
        measure: "rus",
        period: ["1621", "2226"],
        highlight: ["BDI", "MLI"],
        values: ["BDI", "MLI"],
      },
    },

    unga_ter_intro: {
      chart: "unga_ter",
      state: { measure: "eu", period: "all" },
    },
    unga_ter_abst: {
      chart: "unga_ter",
      state: { measure: ["abs", "nv"], period: "all" },
    },
    unga_ter_shift: {
      chart: "unga_ter",
      state: { measure: "eu", period: ["1622", "2326"] },
    },

    unga_gaz_abst: {
      chart: "unga_gaz",
      state: { measure: ["abs", "nv"], period: "all" },
    },
    unga_gaz_align: {
      chart: "unga_gaz",
      state: { measure: ["isr", "eu"], period: "all" },
    },
  },
};
