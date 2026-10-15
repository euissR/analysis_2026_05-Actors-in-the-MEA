// AF_mil.js: Africa, military chapter
//
// charts: one entry per chart in the chapter
//   type: chart module (see CHART_TYPES in main.js)
//   data: data file in data/, without the region suffix (mil_1_arms -> mil_1_arms_AF.csv)
//
// steps: one entry per data-step="..." in the page text
//   chart: which chart the step shows
//   state: what the chart shows (see the top of the chart module)
//
// Arms transfers (sankey), bases + deployments (milMap), exercises (dotMap, count mode).
//
// PINNED: where the text and the data still differ. The text is as written; the charts show the data.
//   Arms data: Arms_Deliveries_Repaired_08.10.2026.xlsx (sheet "Annual deliveries"); comparison baseline
//   2018-2021 vs 2022-2025, as in the text.
//   arm_intro    text "about 80%" for the top five suppliers; data 83% (Russia 9,273, France 4,810, US 3,605,
//                Germany 2,968, China 2,447)
//   arm_china    text and data agree. The Libyan House of Representatives is left out of the count of
//                countries (footnote 2) but its 321 TIV is in the flows and totals (North Africa)
//   arm_egy      text 43%; data 42.7% (the chart label reads 43%)
//   arm_change   text and data agree (the chart labels read Israel +881%, Italy -81%). Iran's rise is
//                0.15 -> 0.70 TIV: a hairline on the chart
//   arm_regions  text China North Africa +88%; data +87.5%
//   dep_eu       data: Spain adds 65 in Senegal, so the EU spike there reads 415 (the label block lists
//                France 350 and Spain 65); France in Tunisia (750) is not in the text (author's choice)
//   dep_pmc      data adds Russian PMCs in Burkina Faso, Equatorial Guinea and Niger (200 each)
//                (author's choice)
//   dep_un_chn   Abyei sits under Sudan in the data; the chart footnote is footnote 8 of the document
//   ex_intro     text: Gulf of Guinea and Gulf of Aden/Western Indian Ocean "stand out": on the map Egypt (14
//                exercises) and Djibouti (10) are the biggest places; the sea areas are smaller dots. The
//                Red Sea is in the third key takeaway, not in this sentence
//   ex_all       text 55 exercises, 52% / 26% / 7% / 11%: check against mil_4_ex_AF.csv
//   ex_atalanta, ex_fr_es: no separate France / Spain data in the map; the steps highlight
//                the places named in the text (the EU actor covers all member states)
//   typos kept as in the source: "Egypt is the main recipients", "Israeli's transfers", "considers on
//                deliveries" (footnote 1), "Russia run", "interforce"

import { theme } from "../theme.js";

export default {
  charts: {
    arms: {
      type: "sankey",
      data: "mil_1_arms",
      title: "Arms transfers to Africa",
      subtitle: (s, period) =>
        `SIPRI trend-indicator value (TIV) of delivered ${s.drones ? "armed drones" : "weapons"}${s.scope === "ssa" ? " to sub-Saharan Africa" : ""}, ${period}`,
      source:
        "Data: SIPRI Arms Transfers Database, August 2026. Deliveries 2016–2025; multi-year deliveries are split equally across the years indicated.",
      unit: "SIPRI TIV of delivered weapons",
      periods: {
        all: { label: "2016–2025" },
        p1: { label: "2018–2021", from: 2018, to: 2021 },
        p2: { label: "2022–2025", from: 2022, to: 2025 },
      },
      nSuppliers: 8,
      nCountries: 10,
      changeSuppliers: [
        "China",
        "France",
        "Germany",
        "Iran",
        "Israel",
        "Turkiye",
        "United States",
        "Russia",
        "Italy",
      ],
      supplierLabels: {
        "United States": "US",
        Turkiye: "Türkiye",
        "United Arab Emirates": "UAE",
        "European Union": "EU institutions",
      },
      countryLabels: {
        COD: "DR Congo",
        COG: "Congo",
        CIV: "Côte d’Ivoire",
        TZA: "Tanzania",
        CAF: "Central African Rep.",
        HOR: "Libyan House of Representatives*",
      },
    },

    forces: {
      type: "milMap",
      data: "mil_3_dep",
      extra: {
        bases: "mil_2_bases_{suffix}",
        pts: "mil_{suffix}_countries",
      },
      title: "Foreign military presence in Africa",
      subtitle: (s) => {
        const parts = [];
        if (s.types?.length) parts.push("personnel deployed in 2025 (spikes)");
        if (s.bases) parts.push("military bases (dots)");
        const text = parts.join(" and ");
        return text.charAt(0).toUpperCase() + text.slice(1);
      },
      source: "Data: IISS, The Military Balance 2026; US Africa Command",
      allLabel: "All actors",
      keyBases: "Military base (colour: actor)",
      keyLight: "Camp Simba",
      spikeK: 0.02,
      spikeFill: 0.35,
      keyRef: 1000,
      types: [
        {
          id: "Bilateral",
          short: "bilateral",
          label: "Bilateral deployments",
          color: theme.typeColors.Bilateral,
          from: ["Bilateral"],
        },
        {
          id: "PMC",
          short: "PMC",
          label: "Private military companies (estimates)",
          color: theme.typeColors.PMC,
          from: ["PMC"],
        },
        {
          id: "UN",
          short: "UN",
          label: "UN missions",
          color: theme.typeColors.UN,
          from: ["UN"],
        },
        {
          id: "Other",
          short: "other",
          label: "EU, NATO and other multilateral missions",
          color: theme.typeColors.Other,
          from: ["EU", "NATO", "Other multilateral"],
        },
      ],
      offmap: { "MUS|USA": "Diego Garcia (Chagos Islands)" },
      names: {
        CIV: "Côte d’Ivoire",
        COD: "DR Congo",
        CAF: "Central African Rep.",
      },
    },
    ex: {
      type: "dotMap",
      mode: "count",
      data: "mil_4_ex_map",
      tilesWithData: true,
      ownDots: false, // no dot for places without exercises
      extra: { pts: "mil_{suffix}_countries" },
      title: "Joint military exercises in Africa",
      subtitleActor:
        "Joint exercises led or co-led by the selected actor, by African partner or sea area, January 2024–July 2026",
      subtitleAll:
        "Joint exercises between external partners and African countries, by African partner or sea area, January 2024–July 2026",
      source:
        "NB: An exercise counts once for each place it involves. Data: official ministry websites and news outlets.",
      allLabel: "All actors",
      // one dot-size scale for every step and tile: the same number is the same size everywhere
      sharedScale: true,
      rMax: 22,
      keySize: "Exercises",
      tooltipCount: (n, label) =>
        `${label === "All actors" ? "" : `${label}: `}${n} exercise${n === 1 ? "" : "s"}`,
      shareText: () => "",
    },
  },

  steps: {
    arm_intro: { chart: "arms", state: {} },
    arm_china: {
      chart: "arms",
      state: {
        highlight: ["China", "United Arab Emirates", "France", "United States", "Russia"],
        recipients: true,
      },
    },
    arm_egy: {
      chart: "arms",
      state: { depth: "country", highlight: [{ to: "EGY" }] },
    },
    arm_mar_alg: {
      chart: "arms",
      state: {
        depth: "country",
        highlight: [
          { from: "United States", to: "MAR" },
          { from: "Israel", to: "MAR" },
          { from: "China", to: "DZA" },
          { from: "Russia", to: "DZA" },
        ],
      },
    },
    arm_isr: {
      chart: "arms",
      state: {
        period: "p2",
        depth: "country",
        highlight: [{ from: "Israel", to: "MAR" }],
      },
    },
    arm_change: {
      chart: "arms",
      state: {
        period: "p2",
        change: true,
        highlight: [
          "China",
          "France",
          "Germany",
          "Iran",
          "Israel",
          "Turkiye",
          "United States",
        ],
      },
    },
    arm_regions: {
      chart: "arms",
      state: {
        period: "p2",
        highlight: [
          { from: "China", to: "West Africa" },
          { from: "China", to: "North Africa" },
          { from: "France", to: "North Africa" },
          { from: "Germany", to: "North Africa" },
          { from: "United States", to: "North Africa" },
          { from: "Iran", to: "East Africa and HoA" },
          { from: "Israel", to: "North Africa" },
          { from: "Israel", to: "East Africa and HoA" },
          { from: "Turkiye", to: "West Africa" },
          { from: "Turkiye", to: "East Africa and HoA" },
        ],
      },
    },

    arm_ssa_intro: { chart: "arms", state: { scope: "ssa" } },
    arm_ssa: {
      chart: "arms",
      state: {
        scope: "ssa",
        highlight: ["China", "Russia", "France", "Turkiye"],
      },
    },
    arm_ssa_conc: {
      chart: "arms",
      state: {
        scope: "ssa",
        depth: "country",
        recipients: true,
        highlight: [
          "China",
          { from: "Russia", to: "AGO" },
          { from: "Russia", to: "ETH" },
          { from: "Russia", to: "MLI" },
        ],
      },
    },
    arm_nga: {
      chart: "arms",
      state: {
        scope: "ssa",
        depth: "country",
        highlight: [{ to: "AGO" }, { to: "NGA" }],
      },
    },
    arm_drones: {
      chart: "arms",
      state: {
        drones: true,
        scope: "ssa",
        depth: "country",
        nCountries: 24,
        highlight: ["Turkiye", "China", "Iran"],
      },
    },

    // bases and deployments
    bas_trans: { chart: "forces", state: { bases: true } },
    bas_intro: {
      chart: "forces",
      state: {
        bases: true,
        labels: ["DJI"],
      },
    },
    dep_intro: { chart: "forces", state: { bases: true } },
    dep_bilat: {
      chart: "forces",
      state: {
        bases: true,
        types: ["Bilateral"],
        labels: [{ iso3: "DJI", dy: -34 }, "SOM"],
        values: ["DJI", "SOM"],
      },
    },
    dep_eu: {
      chart: "forces",
      state: {
        bases: true,
        types: ["Bilateral"],
        actors: ["EU"],
        labels: ["CIV", "GAB", "SEN", "LBY", "NER", "TUN"],
        values: ["CIV", "GAB", "SEN", "LBY", "NER", "TUN"],
      },
    },
    dep_pmc: {
      chart: "forces",
      state: {
        types: ["PMC"],
        labels: ["LBY", "MLI", "CAF"],
        values: ["LBY", "MLI", "CAF"],
      },
    },
    dep_un_intro: { chart: "forces", state: { types: ["UN"] } },
    dep_un_eu: {
      chart: "forces",
      state: {
        types: ["UN"],
        actors: ["USA", "RUS", "EU"],
        labels: ["CAF"],
        values: ["CAF"],
      },
    },
    dep_un_ind: {
      chart: "forces",
      state: {
        types: ["UN"],
        actors: ["IND", "CHN"],
        labels: ["COD", "SSD"],
        values: ["COD", "SSD"],
      },
    },
    dep_un_chn: {
      chart: "forces",
      state: {
        types: ["UN"],
        actors: ["CHN"],
        labels: ["SSD", "SDN"],
        values: ["SSD", "SDN"],
        footnote:
          "Depiction of borders and region on the map is indicative and not supporting any territorial claims.",
      },
    },
    // exercises
    ex_intro: {
      chart: "ex",
      state: { actor: "all", highlight: ["GGU", "GAD"], labels: ["GGU", "GAD"] },
    },
    ex_all: { chart: "ex", state: { actor: "all" } },
    ex_us: { chart: "ex", state: { actor: "USA" } },
    ex_chn: {
      chart: "ex",
      state: { actor: "CHN", labels: ["EGY", "ZAF", "MOZ", "TZA"] },
    },
    ex_rus: { chart: "ex", state: { actor: "RUS", labels: ["EGY"] } },
    ex_ind: {
      chart: "ex",
      state: { actor: "IND", labels: ["GAD", "EGY", "SYC", "ZAF"] },
    },
    ex_eu: { chart: "ex", state: { actor: "EU" } },
    ex_atalanta: {
      chart: "ex",
      state: {
        actor: "EU",
        highlight: ["DJI", "KEN", "SYC", "GAD", "RSE"],
        labels: ["DJI", "KEN", "SYC", "GAD", "RSE"],
      },
    },
    ex_fr_es: {
      chart: "ex",
      state: {
        actor: "EU",
        highlight: ["MAR", "SEN", "GAB", "GGU"],
        labels: ["MAR", "SEN", "GAB", "GGU"],
      },
    },
  },
};
