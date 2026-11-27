# Caption export

Exports every caption the charts show (titles, subtitles per step, sources, footnotes, legend, panel,
axis and button labels) from `js/steps/*.js` to a .docx and a .txt for the editors.

Needs R with the packages V8, officer and jsonlite (installed in the user library). From `web/`:

```sh
Rscript tools/caption_export/build.R "$(pwd)" tools/caption_export ../text/chart_captions
```

writes `../text/chart_captions.docx` and `.txt` (third argument: output path without extension).

Page text and captions together, in reading order (index_*.html in web/, order as in js/chapters.js):

```sh
Rscript tools/caption_export/build_fulltext.R "$(pwd)" tools/caption_export ../text/full_text_and_captions
```

- `build_fulltext.R` walks each page; after every `data-step` paragraph it adds that step's caption,
               and flags steps that exist only on the page or only in the code
- `load.R`     evaluates the step configs in V8 (imports dropped, `export default` wrapped)
- `extract.js` resolves each step's caption the way the chart modules do (js/charts/*.js);
               keep it in line when a module changes how it builds its title or subtitle
- `build.R`    writes the docx/txt
- `parse.R`    reads an edited export back (docx or txt) into fields, for comparing the editors'
               version with the code
