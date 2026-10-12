// ME_mil.js: Middle East and the Gulf, military chapter
//
// Same chart modules as AF_mil.js, plus a time series (stackedCols) for the first arms steps.
//
// PINNED: where the text and the data differ. The text is as written; the charts show the data.
//   Source of the arms data: Arms_Deliveries_Repaired_08.10.2026.xlsx (sheet "Annual deliveries").
//   Comparison baseline is 2018-2021 vs 2022-2025 (four years each), as in the text.
//   arm_intro    text and data agree (US: Saudi Arabia 19,220, Qatar 6,861, UAE 4,888; France and
//                Italy next, Qatar first for both)
//   arm_peak     text: US, Italy, Germany peak in 2022, France in 2021. Holds for 2018-2025 (the series is
//                cut there); with 2016-2017 the US is higher in 2016 (6,255 vs 5,334 in 2022).
//                "all transfers declined" afterwards: France rose slightly in 2024 (458 -> 507)
//   arm_russia   footnote 3 (Russia -> Iran, about 31.5 TIV in 2023 and 2024): Iran is not a recipient
//                in the workbook, so the chart cannot show it; the footnote belongs in the page body
//   arm_israel   text and data agree (UAE 2022: SPYDER-MR air defence and air-to-air missiles; Iraq 2023:
//                SandCat armoured vehicles)
//   arm_gulf     text: "rose from three suppliers": Italy, Spain and South Korea are the three largest
//                increases; Israel (0 -> 187.5 in 2022), Belgium (+33%) and the UAE (+73%) also rose.
//                Gulf total only +5%
//   arm_me_fall  text and data agree: -19% (3,531 -> 2,862); Russia -1,009, US -428
//   arm_me_up    text and data agree: Germany 198.9 -> 877.0 (four frigates to Israel 729), France 9.2 ->
//                142.4 (Iraq 130), Turkiye 0.8 -> 8.2, Iran 30.4 -> 35.7 (Houthis 34.9)
//   typos in the text kept: "Transfers from Germany increased from 199 to 877 TIV was mainly driven", "Norther Iraq",
//                "equips African forces" (intro), "pinpoint to trade links"
//   dep_us       text 20,000 US personnel: US bilateral in the data adds up to about 29,000
//                (Kuwait 10,000, Qatar 9,000, UAE 4,000, Bahrain 3,750, Saudi Arabia 2,000, Israel 250;
//                plus 750 on the Red Sea)
//   dep_un_eu    text "Italy and France provided the largest EU contingents": data Italy 916,
//                Spain 662, France 646 in UNIFIL
//   dep_nato     text EU 567: data 569 (Latvia is 75, same as Italy: check)
//   dep_oir_us   text 2,000 US in Jordan: data 3,000
//   dep_oir_us   footnote on the end of Operation Inherent Resolve in Iraq and dep_tur footnote on the
//                Bashiqa handover are drafts, from footnote 1 of the new text; the deployment data are 2025
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
        "Data: SIPRI Arms Transfers Database, August 2026. Deliveries 2016–2025; multi-year deliveries are split equally across the years indicated. Not available for all countries; some transfers to non-state armed groups are included.",
      unit: "SIPRI TIV of delivered weapons",
      periods: {
        all: { label: "2016–2025" },
        p1: { label: "2018–2021", from: 2018, to: 2021 },
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
      countryLabels: { PSE: "Palestine" },
    },

    armsT: {
      type: "stackedCols",
      data: "mil_1_arms",
      title: "Arms transfers to the Middle East and the Gulf, by year",
      subtitle: (s) =>
        `SIPRI trend-indicator value (TIV) of delivered weapons${s.only?.length ? "" : ", by supplier"}`,
      source:
        "Data: SIPRI Arms Transfers Database, August 2026. Deliveries 2016–2025; multi-year deliveries are split equally across the years indicated. Not available for all countries; some transfers to non-state armed groups are included.",
      unit: "SIPRI TIV",
      stackOrder: ["USA", "EU", "RUS", "TUR", "KOR", "ISR", "IRN", "CHN", "ARE", "other"],
      // per supplier (the peaks are by country: US, Italy, Germany, France)
      supplierOrder: ["United States", "France", "Italy", "Germany"],
      supplierColors: {
        "United States": theme.actorColors.USA,
        France: "#309ebe",
        Italy: "#64c2c7",
        Germany: "#3E4E6F",
      },
      labels: { "United States": "US" },
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
        depth: "country",
        highlight: [
          { from: "United States", to: "SAU" },
          { from: "United States", to: "QAT" },
          { from: "United States", to: "ARE" },
          { from: "France", to: "QAT" },
          { from: "Italy", to: "QAT" },
        ],
      },
    },
    arm_peak: {
      chart: "armsT",
      state: {
        stackBy: "supplier",
        only: ["United States", "France", "Italy", "Germany"],
        years: [2018, 2025],
        marks: [
          { year: 2021, lines: ["France"] },
          { year: 2022, lines: ["US, Italy,", "Germany"] },
        ],
      },
    },
    arm_russia: {
      chart: "armsT",
      state: { only: ["RUS"], years: [2018, 2025], marks: [{ year: 2019, lines: ["Iraq,", "Syria"] }] },
    },
    arm_israel: {
      chart: "armsT",
      state: {
        only: ["ISR"],
        years: [2018, 2025],
        marks: [
          { year: 2022, lines: ["UAE"] },
          { year: 2023, lines: ["Iraq"] },
        ],
      },
    },
    arm_gulf: {
      chart: "arms",
      state: {
        period: "p2",
        subregion: "Gulf",
        depth: "country",
        change: true,
        changeSuppliers: ["Italy", "Spain", "South Korea"],
        highlight: ["Italy", "Spain", "South Korea"],
      },
    },
    arm_me_fall: {
      chart: "armsT",
      state: { subregion: "Middle East", years: [2018, 2025], highlight: ["RUS", "USA"] },
    },
    arm_me_up: {
      chart: "arms",
      state: {
        period: "p2",
        subregion: "Middle East",
        depth: "country",
        change: true,
        changeValues: true,
        changeSuppliers: ["Germany", "France", "Turkiye", "Iran"],
        highlight: ["Germany", "France", "Turkiye", "Iran"],
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
        footnote:
          "On 23 September 2026, Türkiye and Iraq agreed that Turkish forces will gradually hand over the Bashiqa-Zilkan base to Iraq. Data refer to 2025.",
      },
    },
    dep_oir_us: {
      chart: "forces",
      state: {
        types: ["OIR"],
        actors: ["USA"],
        values: ["IRQ", "JOR"],
        footnote:
          "US forces ended Operation Inherent Resolve in Iraq on 30 September 2026; the Combined Joint Task Force (CJTF-OIR) remains operational, headquartered in Jordan. Data refer to 2025.",
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
