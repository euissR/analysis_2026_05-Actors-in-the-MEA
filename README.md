# Foreign Actors scrollytelling (EUISS)

## Run locally
From this folder: `python -m http.server`, then open http://localhost:8000.
`index.html` is a dev page that wraps the embed in a Drupal-like body field.
No config toggle needed: `js/config.js` finds the data from wherever the code is served.

## Put it in Drupal
1. Push the repo; enable GitHub Pages.
2. Open `embed/AF_dipl.html`, replace `REPO` with the repository name (3 places).
3. Paste it into the Drupal body in source mode.

Step text lives in Drupal. Each step is a `<p class="fa-step" data-step="...">`;
the id links it to its chart state in `js/steps/AF_dipl.js`.

## Where to change what
| To change | Edit |
|---|---|
| What a step shows (actor, highlights, labels) | `js/steps/{region}_{chapter}.js` → `steps` |
| Chart title, subtitle, source, key wording, category colours | same file → `charts` |
| Map centre, zoom area, aspect ratio per region | `js/regions.js` |
| Palette, ocean/land colours, dimming, animation speed | `js/theme.js` |
| Spacing between steps, layout, mobile behaviour | `css/fa.css` |
| Data | R exports into `data/` |

## Files
```
index.html            dev page (not used in Drupal)
embed/AF_dipl.html    snippet to paste into Drupal
css/fa.css            all styles, scoped to .fa-*
js/main.js            loads data + chapter config, builds charts, runs the scroll engine
js/scroll.js          step activation (trigger line: 50% desktop, 75% mobile)
js/charts/dotMap.js   dot map with actor tiles (contract at the top of the file)
js/steps/AF_dipl.js   Africa · diplomatic chapter: charts and steps
js/regions.js         per-region map setup
js/theme.js           EUISS palette
js/robinson.js        Robinson projection (no extra dependency)
data/                 data from R (written by the R scripts via d3_dir)
```
