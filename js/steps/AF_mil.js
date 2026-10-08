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
// PINNED: where the text and the data differ. The text is as written; the
// charts show the data.
//   arm_intro    text "top five suppliers also include France, Italy and Germany": that is
//                six in all (US, Russia, China, France, Italy, Germany)
//   arm_egy      text 31%; data 30.7%
//   arm_mar_alg  text Algeria 60% of Russian transfers; data 52%.
//                Morocco 66% of Israeli: data 66.5%
//   arm_change   text China +15%, Türkiye +78% (from the pivot); data +20%, +84%.
//                Text says 2022–2026; the data ends in 2025
//   arm_nga      text "mostly from China and Türkiye"; data China 201, France 76, Türkiye 68
//   arm_drones   text "armed drones"; the data flag also includes reconnaissance
//                and one-way attack drones
//   dep_eu       text "France ... Senegal (250)"; data France 350 (the source cell is marked "?"),
//                plus Spain 65, so the EU spike in Senegal reads 415. The data also has
//                France in Tunisia (750), which the text does not mention
//   dep_pmc      text "approximately" 3,500 / 1,500 / 1,500: the data matches. The data adds
//                Russian PMCs in Burkina Faso, Equatorial Guinea and Niger (200 each)
//   dep_un_chn   Abyei sits under Sudan in the data. Footnote wording (here and under bas_intro
//                and dep_pmc) is a draft, from the comments in the source document
//   ex_intro     text "Gulf of Guinea and Gulf of Aden/Western Indian Ocean stand out as
//                particularly crowded maritime areas": on the map Egypt (14 exercises) and
//                Djibouti (10) are the biggest places; the sea areas are smaller dots
//   ex_all       text 55 exercises, 52% / 26% / 7% / 11%: check against mil_4_ex_AF.csv
//   ex_us        text 15 US-led: the older export had 17 (two Red Sea exercises), 15 after
//                the area patch
//   ex_eu        text "about 29"; data 28 EU-led
//   ex_atalanta, ex_fr_es: no separate France / Spain data in the map; the steps highlight
//                the places named in the text (the EU actor covers all member states)
//   typos kept as in the source: "Egypt is the main recipients", "Israeli's transfers",
//                "China results the first supplier"

import { theme } from "../theme.js";

export default {
  charts: {
    arms: {
      type: "sankey",
      data: "mil_1_arms",
      title: "Arms transfers to Africa",
      subtitle: (s, period) =>
        `SIPRI trend-indicator value (TIV) of delivered ${s.drones ? "drones" : "weapons"}${s.scope === "ssa" ? " to sub-Saharan Africa" : ""}, ${period}`,
      source: "Data: SIPRI Arms Transfers Database, August 2026",
      unit: "SIPRI TIV of delivered weapons",
      periods: {
        all: { label: "2016–2025" },
        p1: { label: "2016–2021", from: 2016, to: 2021 },
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
      ],
      supplierLabels: {
        "United States": "US",
        Turkiye: "Türkiye",
        "United Arab Emirates": "UAE",
        "European Union": "EU institutions",
      },
      countryLabels: {
        COD: "DR Congo",
        CIV: "Côte d’Ivoire",
        TZA: "Tanzania",
        CAF: "Central African Rep.",
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
        "NB: An exercise counts once for each place it involves. Joint exercises are those described as such by the mission themselves; training activities are excluded. Data: official ministry websites and news outlets.",
      allLabel: "All actors",
      rMaxActor: 12,
      rMaxAll: 22,
      keySize: "Exercises",
      keyValuesActor: [1, 3, 6],
      keyValuesAll: [1, 5, 14],
      tooltipCount: (n, label) =>
        `${label === "All actors" ? "" : `${label}: `}${n} exercise${n === 1 ? "" : "s"}`,
      shareText: () => "",
    },
  },

  steps: {
    arm_intro: { chart: "arms", state: {} },
    arm_china: {
      chart: "arms",
      state: { highlight: ["China"], recipients: true },
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
        highlight: [
          "China",
          { from: "Russia", to: "ETH" },
          { from: "Russia", to: "MLI" },
          { from: "Russia", to: "UGA" },
        ],
      },
    },
    arm_nga: {
      chart: "arms",
      state: { scope: "ssa", depth: "country", highlight: [{ to: "NGA" }] },
    },
    arm_drones: {
      chart: "arms",
      state: {
        drones: true,
        depth: "country",
        nCountries: 24,
        highlight: ["Turkiye", "China", "Iran"],
      },
    },
    // bases and deployments
    bas_intro: {
      chart: "forces",
      state: {
        bases: true,
        labels: ["DJI"],
        outline: ["KEN"],
        footnote:
          "Bases shown are established bilateral presence; presence under other international frameworks is counted under deployments.",
        notes: [
          {
            iso3: "KEN",
            lines: ["Camp Simba:", "US cooperative", "security location"],
            dx: -150,
            dy: 12,
          },
        ],
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
        footnote:
          "Figures for Russian PMCs are estimates. Numbers for other private military companies are hard to find.",
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
          "* Abyei is a disputed region between Sudan and South Sudan. The borders shown do not imply support for any claim.",
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
