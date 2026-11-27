# build_fulltext.R: page text of every index_*.html (reading order) with the chart caption of each step
# placed after the paragraph that triggers it. One .docx and one .txt.
#
#   Rscript tools/caption_export/build_fulltext.R <web dir> <this dir> <output path without extension>

args <- commandArgs(trailingOnly = TRUE)
web <- args[1]; here <- args[2]; out_base <- args[3]
source(file.path(here, "load.R"), encoding = "UTF-8") # -> chapters (captions per step), desc
suppressMessages({ library(officer); library(xml2) })

# ── page order (js/chapters.js: ORDER) ─────────────────────────────────────────
ORDER <- c("dipl", "soft", "trade", "invest", "infra", "mil")
REGION <- c(AF = "Africa", ME = "Middle East and the Gulf")
pages <- c(
  list(list(file = "index_landing.html", key = "landing", label = "Landing page")),
  unlist(lapply(names(REGION), function(r) lapply(ORDER, function(c)
    list(file = sprintf("index_%s_%s.html", c, tolower(r)), key = paste0(r, "_", c),
         label = paste0(REGION[[r]], ": ", c)))), recursive = FALSE),
  list(list(file = "index_methodology.html", key = NA, label = "Methodology"))
)

cap_by <- setNames(chapters, sapply(chapters, `[[`, "name"))
nz <- function(x) !is.null(x) && length(x) && !is.na(x[1]) && nzchar(x[1])
clean <- function(s) trimws(gsub("[ \t\r\n ]+", " ", s))

# ── docx helpers ───────────────────────────────────────────────────────────────
doc <- read_docx()
txt <- character()
FS <- 10.5
st_body <- fp_text(font.size = FS)
cap_par <- fp_par(padding.left = 10, padding.top = 1, padding.bottom = 1, shading.color = "#EAF1F7",
                  border.left = fp_border(color = "#4A7AA7", width = 2.5))
H <- function(text, level) { doc <<- body_add_par(doc, text, style = paste("heading", level)); txt <<- c(txt, "", if (level == 1) strrep("=", 80), toupper_if(text, level), if (level == 1) strrep("=", 80)) }
toupper_if <- function(t, l) if (l == 1) toupper(t) else if (l == 2) paste("##", t) else paste("###", t)

# runs of an HTML element, keeping italics, bold and superscripts
runs <- function(node, it = FALSE, b = FALSE, sup = FALSE) {
  out <- list()
  for (ch in xml_contents(node)) {
    if (xml_type(ch) == "text") {
      s <- gsub("[ \t\r\n ]+", " ", xml_text(ch))
      if (nzchar(s)) out[[length(out) + 1]] <- list(s = s, it = it, b = b, sup = sup)
    } else if (xml_type(ch) == "element") {
      n <- xml_name(ch)
      if (n %in% c("script", "style", "link")) next
      if (n == "br") { out[[length(out) + 1]] <- list(s = " ", it = it, b = b, sup = sup); next }
      out <- c(out, runs(ch, it || n %in% c("em", "i"), b || n %in% c("strong", "b"), sup || n == "sup"))
    }
  }
  out
}
para <- function(node, prefix = "", indent = 0) {
  r <- runs(node)
  if (!length(r)) return()
  r[[1]]$s <- sub("^ +", "", r[[1]]$s); r[[length(r)]]$s <- sub(" +$", "", r[[length(r)]]$s)
  if (!nzchar(paste(sapply(r, `[[`, "s"), collapse = ""))) return()
  ft <- lapply(r, function(x) ftext(x$s, fp_text(font.size = FS, italic = x$it, bold = x$b,
                                                vertical.align = if (x$sup) "superscript" else "baseline")))
  if (nzchar(prefix)) ft <- c(list(ftext(prefix, st_body)), ft)
  doc <<- body_add_fpar(doc, do.call(fpar, c(ft, list(fp_p = fp_par(padding.left = indent, padding.bottom = 4)))))
  txt <<- c(txt, paste0(prefix, clean(paste(sapply(r, `[[`, "s"), collapse = ""))))
}
cap_lines <- function(lines) {
  for (l in lines) {
    doc <<- body_add_fpar(doc, fpar(ftext(paste0(l[1], ": "), fp_text(font.size = 9, bold = TRUE, color = "#2F5F8A")),
                                    ftext(l[2], fp_text(font.size = 9)), fp_p = cap_par))
  }
  txt <<- c(txt, sapply(lines, function(l) paste0("    [", l[1], "] ", l[2])), "")
}
table_out <- function(node) {
  rows <- xml_find_all(node, ".//tr")
  cells <- lapply(rows, function(r) sapply(xml_find_all(r, "./th|./td"), function(c) clean(xml_text(c))))
  w <- max(lengths(cells))
  m <- t(sapply(cells, function(x) c(x, rep("", w - length(x)))))
  df <- as.data.frame(m[-1, , drop = FALSE], stringsAsFactors = FALSE); names(df) <- make.unique(m[1, ])
  doc <<- body_add_table(doc, df, style = "table_template")
  txt <<- c(txt, apply(m, 1, paste, collapse = " | "), "")
}

# ── captions ───────────────────────────────────────────────────────────────────
caption_of <- function(cap, step) {
  s <- Find(function(x) identical(x$step, step), cap$steps)
  if (is.null(s)) return(NULL)
  l <- list()
  if (nz(s$title)) l[[length(l) + 1]] <- c("Chart", s$title)
  if (nz(s$subtitle)) l[[length(l) + 1]] <- c("Subtitle", s$subtitle)
  if (nz(s$source)) l[[length(l) + 1]] <- c("Source", s$source)
  if (nz(s$footnote)) l[[length(l) + 1]] <- c("Footnote", s$footnote)
  for (e in unlist(s$extras)) l[[length(l) + 1]] <- c("On chart", e)
  if (nz(s$note)) l[[length(l) + 1]] <- c("Note", s$note)
  l
}

chart_labels <- function(cap) {
  if (!length(cap$charts)) return()
  H("Chart labels (legends, panels, axes, buttons)", 3)
  for (c in cap$charts) {
    labs <- Filter(function(l) !grepl("^\\[varies", l[[2]]) && !(l[[1]] %in% c("title", "source")), c$labels)
    if (!length(labs)) next
    t <- if (nz(c$def$title)) c$def$title else c$id
    doc <<- body_add_fpar(doc, fpar(ftext(paste0(t, "  [", c$id, "]"), fp_text(font.size = FS, bold = TRUE))))
    txt <<- c(txt, paste0("# ", t, "  [", c$id, "]"))
    cap_lines(lapply(labs, function(l) c(sub("^\\.", "", l[[1]]), l[[2]])))
  }
}

# ── walk a page ────────────────────────────────────────────────────────────────
SKIP_CLASS <- "fa-stage|fa-nav|fa-crumb"
walk <- function(node, ctx) {
  for (ch in xml_children(node)) {
    n <- xml_name(ch); cls <- xml_attr(ch, "class"); cls <- ifelse(is.na(cls), "", cls)
    if (n %in% c("script", "style", "link", "meta") || grepl(SKIP_CLASS, cls)) next
    if (n %in% c("h1", "h2")) { if (nzchar(clean(xml_text(ch)))) H(clean(xml_text(ch)), 2); next }
    if (n %in% c("h3", "h4", "h5", "h6")) { if (nzchar(clean(xml_text(ch)))) H(clean(xml_text(ch)), 3); next }
    if (n == "table") { table_out(ch); next }
    if (n == "li") { para(ch, "• ", 14); next }
    if (n == "p") {
      para(ch)
      step <- xml_attr(ch, "data-step")
      if (!is.na(step)) {
        ctx$seen <- c(ctx$seen, step)
        l <- if (!is.null(ctx$cap)) caption_of(ctx$cap, step) else NULL
        if (is.null(l)) cap_lines(list(c("Note", paste0("no chart state for step '", step, "' in the code"))))
        else if (identical(l, ctx$last)) cap_lines(list(c("Chart", paste0("caption as above  [", step, "]"))))
        else cap_lines(c(l, list(c("Step", step))))
        ctx$last <- l
      }
      next
    }
    walk(ch, ctx)
  }
}

for (pg in pages) {
  f <- file.path(web, pg$file)
  if (!file.exists(f)) { message("missing page: ", pg$file); next }
  h <- read_html(f, encoding = "UTF-8")
  title <- clean(xml_text(xml_find_first(h, "//title")))
  H(paste0(sub("^Dev: ", "", title), "  (", pg$file, ")"), 1)
  ctx <- new.env(); ctx$seen <- character(); ctx$last <- NULL
  ctx$cap <- if (!is.na(pg$key)) cap_by[[pg$key]] else NULL
  body <- xml_find_first(h, "//*[contains(@class,'field__item')]")
  if (inherits(body, "xml_missing")) body <- xml_find_first(h, "//body")
  walk(body, ctx)
  if (!is.null(ctx$cap)) {
    orphans <- setdiff(sapply(ctx$cap$steps, `[[`, "step"), ctx$seen)
    if (length(orphans)) cap_lines(list(c("Note", paste0("chart states in the code without a paragraph on this page: ", paste(orphans, collapse = ", ")))))
    chart_labels(ctx$cap)
  }
}

print(doc, target = paste0(out_base, ".docx"))
con <- file(paste0(out_base, ".txt"), open = "w", encoding = "UTF-8"); writeLines(txt, con); close(con)
cat("written:", out_base, "\n")
