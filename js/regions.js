// regions.js: one entry per region; charts read their map setup from here.
//   geo:    prefix of the basemap files in data/ (from 0 d3_geojson.R)
//   suffix: suffix of the chart data files (dipl_1_emb_AF.csv)
//   center: longitude the projection is centred on
//   fit:    [[west, south], [east, north]], the area the map zooms to
//   width/height: map drawing size; sets the map's fixed aspect ratio
//   note:   [x, y] in map units where subregion shares are written

export const REGIONS = {
  AF: {
    geo: "africa",
    suffix: "AF",
    center: [20, 0],
    fit: [[-26, -36], [60, 38]],
    width: 600,
    height: 560,
    note: [20, 470], // open Atlantic, south-west of the continent
  },
  ME: {
    geo: "me_gulf",
    suffix: "ME",
    center: [44, 24],
    fit: [[33, 12], [60, 38]],
    width: 600,
    height: 560,
  },
};
