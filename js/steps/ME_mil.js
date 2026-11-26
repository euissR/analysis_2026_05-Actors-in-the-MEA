// ME_mil.js: Middle East and the Gulf, military chapter
//
// Same chart modules as AF_mil.js, plus a time series (stackedCols) for the first arms steps.

import { theme } from "../theme.js";

// exercise tiles that are a cut of the exercises (a place's own), not an actor
const CUTS = ["naval", "bilateral"];

export default {
  charts: {
    arms: {
      type: "sankey",
      data: "mil_1_arms",
      title: "Arms transfers to the Middle East and the Gulf",
      subtitle: (s, period) =>
        `SIPRI trend-indicator value (TIV, million) of delivered ${s.drones ? "drones" : "weapons"}, ${period}`,
      source:
        "Data: SIPRI Arms Transfers Database, August 2026. Deliveries 2016–2025; multi-year deliveries are split equally across the years indicated. Not available for all countries; some transfers to non-state armed groups are included.",
      unit: "SIPRI TIV of delivered weapons (million)",
      tipLabel: "TIV (million):",
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
        `SIPRI trend-indicator value (TIV, million) of delivered weapons${s.only?.length ? "" : ", by supplier"}`,
      source:
        "Data: SIPRI Arms Transfers Database, August 2026. Deliveries 2016–2025; multi-year deliveries are split equally across the years indicated. Not available for all countries; some transfers to non-state armed groups are included.",
      unit: "SIPRI TIV (million)",
      stackOrder: [
        "USA",
        "EU",
        "RUS",
        "TUR",
        "KOR",
        "ISR",
        "IRN",
        "CHN",
        "ARE",
        "other",
      ],
      // per supplier (the peaks are by country: US, Italy, Germany, France)
      supplierOrder: ["United States", "France", "Italy", "Germany"],
      supplierColors: {
        "United States": theme.actorColors.USA,
        France: "#309ebe",
        Italy: "#309ebe",
        Germany: "#309ebe",
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
      title: "Foreign military presence in the Middle East and the Gulf (2025)",
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
      ownDots: false, // no dot for places without exercises
      extraTiles: [
        { actor: "naval", label: "Naval" },
        { actor: "bilateral", label: "Bilateral" },
        { actor: "gcc", label: "GCC countries" },
        { actor: "FRA", label: "France" },
      ],
      extra: { pts: "mil_{suffix}_countries" },
      title: "Joint military exercises in the Middle East and the Gulf",
      subtitleActor:
        "Joint exercises led or co-led by the selected actor, by co-leading country or sea area where held, January 2024–July 2026",
      subtitleAll:
        "Joint exercises led or co-led by countries of the region and external partners, by country or sea area where held, January 2024–July 2026",
      source:
        "NB: A country counts the exercises it led or co-led, not those in which it merely participated. Each exercise is counted once for every location involved. Data: official ministry websites, websites of Atalanta and Aspides and news outlets.",
      allLabel: "All actors",
      // one dot-size scale for every step and tile: the same number is the same size everywhere
      sharedScale: true,
      rMax: 22,
      keySize: "Exercises",
      // A country counts the exercises it led or co-led (wherever held); a sea area counts the exercises
      // held there. `place` is the dot, `actor` the selected tile.
      tooltipCount: (n, label, nActors, place, actor) => {
        const ex = `${n} exercise${n === 1 ? "" : "s"}`;
        const tile = label === "All actors" ? "" : `${label}: `;
        if (place.subregion === "Sea")
          return `${tile}${ex} held in the ${place.name}`;
        if (actor === "all" || CUTS.includes(actor))
          return `${tile}${ex} led or co-led by ${place.name}`;
        if (place.iso3 === actor) return `${label}: ${ex} led or co-led`;
        return `${label}: ${ex} co-led with ${place.name}`;
      },
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
        years: [2016, 2025],
        marks: [
          { year: 2021, lines: ["France"] },
          { year: 2022, lines: ["US, Italy,", "Germany"] },
        ],
      },
    },
    arm_russia: {
      chart: "armsT",
      state: {
        only: ["RUS"],
        years: [2018, 2025],
        marks: [{ year: 2019, lines: ["Iraq,", "Syria"] }],
      },
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
      state: {
        subregion: "Middle East",
        years: [2018, 2025],
        highlight: ["RUS", "USA"],
      },
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
          "Bases shown represent an established bilateral presence; presence under other international frameworks is counted under deployments.",
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
        footnote: "Israeli forces are estimates and refer to 2025.",
      },
    },
    // EU Member States and the UNIFIL contributors (India, China, South Korea, Türkiye) on one map
    dep_un_eu: {
      chart: "forces",
      state: {
        types: ["UN"],
        actors: ["EU", "IND", "CHN", "KOR", "TUR"],
        spikeK: 0.04,
        keyRef: 500,
        values: ["LBN", "MEA", "GOL"],
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
          "On 23 September 2026, Türkiye and Iraq agreed that Turkish forces will gradually hand over the Bashiqa-Zilkan base to Iraq. Data refers to 2025.",
      },
    },
    dep_oir_us: {
      chart: "forces",
      state: {
        types: ["OIR"],
        actors: ["USA"],
        values: ["IRQ", "JOR"],
        footnote:
          "US forces ended Operation Inherent Resolve in Iraq on 30 September 2026; the Combined Joint Task Force (CJTF-OIR) remains operational, headquartered in Jordan. Data refers to 2025.",
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
        actor: "FRA",
        highlight: ["ARE"],
        labels: ["ARE"],
      },
    },
    ex_gcc: {
      chart: "ex",
      state: { actor: "gcc", labels: ["SAU", "ARE", "OMN"] },
    },
  },
};
