source(file.path(commandArgs(trailingOnly = TRUE)[2], "load.R"))
suppressMessages(library(officer))
out_base <- commandArgs(trailingOnly = TRUE)[3]

titles <- c(AF = "Africa", ME = "Middle East and the Gulf")
nz <- function(x) !is.null(x) && length(x) && nzchar(x)

# groups of consecutive steps with identical captions
group_steps <- function(steps) {
  key <- sapply(steps, function(s) paste(s$chart, s$title, s$subtitle, s$source, s$footnote, s$note,
                                          paste(unlist(s$extras), collapse = "|"), sep = "\u0001"))
  grp <- cumsum(c(TRUE, key[-1] != key[-length(key)]))
  lapply(split(seq_along(steps), grp), function(i) list(ids = sapply(steps[i], `[[`, "step"), s = steps[[i[1]]]))
}

doc <- read_docx()
txt <- character()
P <- function(text, style = "Normal") { doc <<- body_add_par(doc, text, style = style) }
F <- function(label, value) {
  doc <<- body_add_fpar(doc, fpar(ftext(paste0(label, ": "), fp_text(bold = TRUE, font.size = 10)),
                                  ftext(value, fp_text(font.size = 10))))
  txt <<- c(txt, paste0("  ", label, ": ", value))
}

P("Chart captions: Actors in the MEA (web)", "heading 1")
P(paste0("Exported ", format(Sys.Date(), "%d %B %Y"),
         " from js/steps/*.js. Each chapter lists (1) the fixed labels of each chart (legend, panels, keys) and ",
         "(2) the captions as shown on screen, step by step in scroll order. Consecutive steps with identical captions are merged. ",
         "Subtitles marked [+ totals computed from the data] show figures the page computes from the data when it loads; those figures are not included here."))
txt <- c(txt, "CHART CAPTIONS: ACTORS IN THE MEA (WEB)", paste("Exported", format(Sys.Date(), "%d %B %Y"), "from js/steps/*.js"), "")

for (ch in chapters) {
  name <- ch$name
  head <- if (name == "landing") "Landing page: main findings" else paste0(name, ": ", desc[[name]])
  P(head, "heading 1")
  txt <- c(txt, strrep("=", 80), toupper(head), strrep("=", 80), "")

  if (length(ch$charts)) {
    P("Charts and their fixed labels", "heading 2")
    txt <- c(txt, "-- CHARTS AND THEIR FIXED LABELS --", "")
    for (c in ch$charts) {
      ct <- if (nz(c$def$title)) c$def$title else "(title set per step)"
      P(paste0(ct, "  [", c$id, "]"), "heading 3")
      txt <- c(txt, paste0("# ", ct, "  [", c$id, "]"))
      if (nz(c$def$source)) F("Source", c$def$source)
      labs <- Filter(function(l) !grepl("^\\[varies", l[[2]]) && !(l[[1]] %in% c("title", "source")), c$labels)
      for (l in labs) F(sub("^\\.", "", l[[1]]), l[[2]])
      txt <- c(txt, "")
    }
  }

  P("Captions by step (scroll order)", "heading 2")
  txt <- c(txt, "-- CAPTIONS BY STEP (SCROLL ORDER) --", "")
  srcs <- setNames(lapply(ch$charts, function(c) c$def$source), sapply(ch$charts, `[[`, "id"))
  for (g in group_steps(ch$steps)) {
    s <- g$s
    lab <- paste0(if (length(g$ids) > 1) "Steps " else "Step ", paste(g$ids, collapse = ", "), "  [chart: ", s$chart, "]")
    P(lab, "heading 3")
    txt <- c(txt, paste0("> ", lab))
    if (nz(s$title)) F("Title", s$title)
    if (nz(s$subtitle)) F("Subtitle", s$subtitle)
    if (nz(s$source) && (name == "landing" || !identical(s$source, srcs[[s$chart]]))) F("Source", s$source)
    if (nz(s$footnote)) F("Footnote", s$footnote)
    for (e in unlist(s$extras)) F("On chart", e)
    if (nz(s$note)) F("Note", s$note)
    txt <- c(txt, "")
  }
}

print(doc, target = paste0(out_base, ".docx"))
con <- file(paste0(out_base, ".txt"), open = "w", encoding = "UTF-8")
writeLines(txt, con); close(con)
cat("written:", out_base, "\n")
