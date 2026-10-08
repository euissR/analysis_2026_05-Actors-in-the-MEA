// ME_mil.js: Middle East and the Gulf, military chapter
//
// Same chart modules as AF_mil.js, plus a time series (stackedCols) for the first arms steps.
//
// PINNED: where the text and the data differ. The text is as written; the charts show the data.
//   arm_intro    text: US arms "particularly to Saudi Arabia and Israel": data US -> Saudi Arabia 5,147,
//                Qatar 4,821, Kuwait 2,712, UAE 2,424; Israel is further down
//   arm_russia   text: "by 2024 ... air systems for Iran": the arms file has no Iran as a recipient,
//                and Russia's transfers to the region stop after 2021 in the data
//   arm_israel   text: UAE "the only country in the region" Israel supplied: data also has
//                Israel -> Iraq in 2023 (15)
//   arm_gulf     text "four countries increased ... to the Gulf": the data also has Spain (+966%),
//                which the pivot does not list; shown (dimmed) in the chart
//   dep_us       text 20,000 US personnel: US bilateral in the data adds up to about 29,000
//                (Kuwait 10,000, Qatar 9,000, UAE 4,000, Bahrain 3,750, Saudi Arabia 2,000, Israel 250;
//                plus 750 on the Red Sea)
//   dep_un_eu    text "Italy and France provided the largest EU contingents": data Italy 916,
//                Spain 662, France 646 in UNIFIL
//   dep_nato     text EU 567: data 569 (Latvia is 75, same as Italy: check)
//   dep_oir_us   text 2,000 US in Jordan: data 3,000
//   dep_oir_us   footnote about the US withdrawal from Iraq is a draft, from the comments in the text
//   deployments  India UNDOF 197 appears twice in the sheet (rows 43 and 49): doubled in the spikes
//   UNTSO        drawn at sea off the Israeli-Lebanese coast ("Middle East (UNTSO)"), UNDOF at the Golan
//   ex_us_fr     text "The US has the largest footprint ..., while France and India ...": split in two
//                steps at the comma ("while" dropped), because the map shows one actor at a time
//   ex_fr_in     text France and India with "the UAE and Oman": in the data France leads exercises with
//                the UAE only (8); India leads with both (Oman 3, UAE 2). Shown together as one tile
//   ex_naval     the text gives no figure for naval or air defence exercises; the "Naval" tile shows
//                the naval ones (type), "Bilateral" those with two countries
//   typos kept as in the source: none found so far

import { theme } from "../theme.js";

export default {
  charts: {
    arms: {
      type: "sankey",
      data: "mil_1_arms",
      title: "Arms transfers to the Middle East and the Gulf",
      subtitle: (s, period) =>
        `SIPRI trend-indicator value (TIV) of delivered ${s.drones ? "drones" : "weapons"}, ${period}`,
      source:
        "Data: SIPRI Arms Transfers Database, August 2026. Not available for all countries; for countries in conflict some transfers to non-state armed groups are included.",
      unit: "SIPRI TIV of delivered weapons",
      periods: {
        all: { label: "2016–2025" },
        p1: { label: "2016–2021", from: 2016, to: 2021 },
        p2: { label: "2022–2025", from: 2022, to: 2025 },
      },
      nSuppliers: 9,
      nCountries: 14,
      changeSuppliers: [],
      supplierLabels: {
        "United States": "US",
        Turkiye: "Türkiye",
        "United Arab Emirates": "UAE",
        "European Union": "EU institutions",
      },
      countryLabels: { ARE: "UAE" },
    },

    armsT: {
      type: "stackedCols",
      data: "mil_1_arms",
      title: "Arms transfers to the Middle East and the Gulf, by year",
      subtitle: (s) =>
        `SIPRI trend-indicator value (TIV) of delivered weapons${s.only?.length ? "" : ", by supplier"}`,
      source:
        "Data: SIPRI Arms Transfers Database, August 2026. Not available for all countries; for countries in conflict some transfers to non-state armed groups are included.",
      unit: "SIPRI TIV",
      stackOrder: ["USA", "EU", "RUS", "TUR", "KOR", "ISR", "IRN", "CHN", "ARE", "other"],
    },

    forces: {
      type: "milMap",
      data: "mil_3_dep",
      extra: {
        bases: "mil_2_bases_{suffix}",
        pts: "mil_{suffix}_countries",
      },
      title: "Foreign military presence in the Middle East and the Gulf",
      subtitle: (s) => {
        const parts = [];
        if (s.types?.length) parts.push("personnel deployed in 2025 (spikes)");
        if (s.bases) parts.push("military bases (dots)");
        const text = parts.join(" and ");
        return text.charAt(0).toUpperCase() + text.slice(1);
      },
      source: "Data: IISS, The Military Balance 2026",
      allLabel: "All actors",
      keyBases: "Military base (colour: actor)",
      spikeK: 0.01, // the Gulf deployments are 2-3 times the African ones
      spikeFill: 0.35,
      keyRef: 5000,
      memberMin: 100, // EU member states below this share one spike per country
      maxLines: 6,
      types: [
        {
          id: "Bilateral",
          short: "bilateral",
          label: "Bilateral deployments",
          color: theme.typeColors.Bilateral,
          from: ["Bilateral"],
        },
        {
          id: "UN",
          short: "UN",
          label: "UN missions",
          color: theme.typeColors.UN,
          from: ["UN"],
        },
        {
          id: "NATO",
          short: "NATO",
          label: "NATO Mission Iraq",
          color: theme.typeColors.Other,
          from: ["NATO"],
        },
        {
          id: "OIR",
          short: "coalition",
          label: "Coalition against Daesh (Operation Inherent Resolve)",
          color: theme.typeColors.Other,
          from: ["Other multilateral"],
        },
        {
          id: "EU",
          short: "EU",
          label: "EU naval missions",
          color: theme.typeColors.Other,
          from: ["EU"],
        },
      ],
      names: { GOL: "Golan (UNDOF)", MEA: "Middle East (UNTSO)" },
    },

    ex: {
      type: "dotMap",
      mode: "count",
      data: "mil_4_ex_map",
      tilesWithData: true,
      ownDots: false, // no dot for places without exercises
      extraTiles: [
        { actor: "naval", label: "Naval" },
        { actor: "bilateral", label: "Bilateral" },
        { actor: "gcc", label: "GCC countries" },
        { actor: "fra_ind", label: "France and India" },
      ],      extra: { pts: "mil_{suffix}_countries" },
      title: "Joint military exercises in the Middle East and the Gulf",
      subtitleActor:
        "Joint exercises led or co-led by the selected actor, by country or sea area, January 2024–July 2026",
      subtitleAll:
        "Joint exercises involving external partners and countries of the region, by country or sea area, January 2024–July 2026",
      source:
        "NB: An exercise counts once for each place it involves. Joint exercises are those described as such by the mission themselves; training activities are excluded. Data: official ministry websites and news outlets.",
      allLabel: "All actors",
      rMaxActor: 12,
      rMaxAll: 22,
      keySize: "Exercises",
      keyValuesActor: [1, 3, 8],
      keyValuesAll: [1, 5, 15],
      tooltipCount: (n, label) =>
        `${label === "All actors" ? "" : `${label}: `}${n} exercise${n === 1 ? "" : "s"}`,
      shareText: () => "",
    },
  },

  steps: {
    // arms transfers
    arm_intro: {
      chart: "arms",
      state: {
        group: "actor",
        depth: "country",
        highlight: [
          { from: "USA", to: "SAU" },
          { from: "USA", to: "ISR" },
          { from: "EU", to: "QAT" },
        ],
      },
    },
    arm_peak: {
      chart: "armsT",
      state: { highlight: ["USA", "EU"], marks: [{ year: 2022, lines: ["Peak"] }] },
    },
    arm_russia: {
      chart: "armsT",
      state: { only: ["RUS"], marks: [{ year: 2019, lines: ["Iraq,", "Syria"] }] },
    },
    arm_israel: {
      chart: "armsT",
      state: { only: ["ISR"], marks: [{ year: 2022, lines: ["UAE"] }] },
    },
    arm_gulf: {
      chart: "arms",
      state: {
        period: "p2",
        subregion: "Gulf",
        depth: "country",
        change: true,
        changeSuppliers: ["France", "Italy", "South Korea", "United States"],
        highlight: ["France", "Italy", "South Korea", "United States"],
      },
    },
    arm_me: {
      chart: "arms",
      state: {
        period: "p2",
        subregion: "Middle East",
        depth: "country",
        change: true,
        changeSuppliers: ["France", "Iran", "Turkiye", "United States"],
        highlight: ["France", "Iran", "Turkiye", "United States"],
      },
    },

    // bases and deployments
    mil_trans: { chart: "forces", state: { bases: true } },
    bas_us: {
      chart: "forces",
      state: {
        bases: true,
        actors: ["USA"],
        labels: ["KWT", "BHR", "QAT", "ARE"],
        footnote:
          "Bases shown are established bilateral presence; presence under other international frameworks is counted under deployments.",
      },
    },
    dep_trans: { chart: "forces", state: { bases: true } },
    dep_us: {
      chart: "forces",
      state: {
        bases: true,
        types: ["Bilateral"],
        actors: ["USA"],
        values: ["KWT", "QAT", "ARE", "BHR", "SAU"],
      },
    },
    dep_un_eu: {
      chart: "forces",
      state: {
        types: ["UN"],
        actors: ["EU"],
        spikeK: 0.04,
        keyRef: 500,
        values: ["LBN", "MEA", "GOL"],
      },
    },
    dep_un_unifil: {
      chart: "forces",
      state: {
        types: ["UN"],
        actors: ["IND", "CHN", "KOR", "TUR"],
        spikeK: 0.04,
        keyRef: 500,
        values: ["LBN"],
      },
    },
    dep_nato: {
      chart: "forces",
      state: {
        types: ["NATO"],
        spikeK: 0.08,
        keyRef: 100,
        values: ["IRQ"],
      },
    },
    dep_tur: {
      chart: "forces",
      state: {
        types: ["Bilateral"],
        actors: ["TUR"],
        values: ["IRQ"],
      },
    },
    dep_oir_us: {
      chart: "forces",
      state: {
        types: ["OIR"],
        actors: ["USA"],
        values: ["IRQ", "JOR"],
        footnote: "The US deployment to Iraq is due to withdraw in October 2026.",
      },
    },
    dep_oir_eu: {
      chart: "forces",
      state: {
        types: ["OIR"],
        actors: ["EU"],
        values: ["IRQ", "JOR", "KWT"],
      },
    },

    // exercises
    ex_trans: { chart: "ex", state: { actor: "all" } },
    ex_naval: { chart: "ex", state: { actor: "naval" } },
    ex_us: { chart: "ex", state: { actor: "USA" } },
    ex_fr_in: {
      chart: "ex",
      state: {
        actor: "fra_ind",
        highlight: ["ARE", "OMN"],
        labels: ["ARE", "OMN"],
      },
    },
    ex_gcc: {
      chart: "ex",
      state: { actor: "gcc", labels: ["SAU", "ARE", "OMN"] },
    },
  },
};
