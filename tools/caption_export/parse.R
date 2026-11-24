# Parse caption exports into a long table: chapter, kind (chart|step), key, field, value, flags
.libPaths(c(Sys.getenv("R_LIBS_USER"), .libPaths()))
suppressMessages(library(officer))

STEP_RE  <- "(Steps? [A-Za-z0-9_, ]+?)\\s*\\[chart: ([^\\]]+)\\]"
CHART_RE <- "^(.*?)\\s*\\[?([A-Za-z0-9_]+)\\]\\s*(.*)$"
STD_LAB  <- c("Title", "Subtitle", "Source", "Footnote", "Note", "On chart")
LAB_RE   <- "^\\s*([A-Za-z][A-Za-z0-9_]*(?:\\.[^:]+?|\\[[0-9]+\\][A-Za-z0-9_.\\[\\]]*)?|On chart):\\s?(.*)$"

# paras: data.frame(style, text). From the txt export: synthesise styles.
read_txt_export <- function(path) {
  x <- readLines(path, encoding = "UTF-8", warn = FALSE)
  style <- rep(NA_character_, length(x)); text <- x
  for (i in seq_along(x)) {
    if (grepl("^=+$", x[i]) || grepl("^-- ", x[i]) || !nzchar(trimws(x[i]))) { style[i] <- "skip"; next }
    if (i > 1 && grepl("^=+$", x[i - 1]) && i < length(x) && grepl("^=+$", x[i + 1])) { style[i] <- "heading 1"; next }
    if (grepl("^# ", x[i])) { style[i] <- "heading 3"; text[i] <- sub("^# ", "", x[i]); next }
    if (grepl("^> ", x[i])) { style[i] <- "heading 3"; text[i] <- sub("^> ", "", x[i]); next }
    text[i] <- sub("^  ", "", x[i])
  }
  d <- data.frame(style = style, text = text, stringsAsFactors = FALSE)
  # section markers
  d$style[is.na(d$style)] <- "Normal"
  d$style[grepl("^-- CHARTS", x)] <- "sec_charts"; d$style[grepl("^-- CAPTIONS", x)] <- "sec_steps"
  d[d$style != "skip", ]
}

read_docx_export <- function(path) {
  d <- docx_summary(read_docx(path))
  d <- d[d$content_type == "paragraph", c("style_name", "text")]
  names(d) <- c("style", "text")
  d$style[is.na(d$style)] <- "Normal"
  d$style[d$style == "heading 2" & grepl("^Charts", d$text)] <- "sec_charts"
  d$style[d$style == "heading 2" & grepl("^Captions", d$text)] <- "sec_steps"
  d
}

chapter_id <- function(t) {
  t <- toupper(t)
  if (grepl("LANDING", t)) return("landing")
  m <- regmatches(t, regexpr("^(AF|ME)_[A-Z]+", t))
  if (length(m)) return(paste0(substr(m, 1, 3), tolower(substr(m, 4, 99))))
  NA
}

parse_export <- function(d) {
  rows <- list(); ch <- NA; kind <- NA; key <- NA; field <- NA
  add <- function(f, v, flag = "") rows[[length(rows) + 1]] <<- data.frame(chapter = ch, kind = kind, key = key, field = f, value = v, flag = flag, stringsAsFactors = FALSE)
  append_prev <- function(v, flag) {
    n <- length(rows)
    if (n && identical(rows[[n]]$key, key)) {
      rows[[n]]$value <<- paste0(rows[[n]]$value, "\n", v)
      rows[[n]]$flag <<- paste(trimws(paste(rows[[n]]$flag, flag)))
    } else add("(untagged)", v, flag)
  }
  for (i in seq_len(nrow(d))) {
    s <- d$style[i]; t <- d$text[i]
    if (s == "heading 1") { c2 <- chapter_id(t); if (!is.na(c2)) { ch <- c2; kind <- NA; key <- NA }; next }
    if (s == "sec_charts") { kind <- "chart"; next }
    if (s == "sec_steps")  { kind <- "step";  next }
    if (is.na(ch)) next
    # step heading, possibly glued to the end of another paragraph
    if (grepl(STEP_RE, t, perl = TRUE)) {
      m <- regmatches(t, regexec(STEP_RE, t, perl = TRUE))[[1]]
      pos <- regexpr(STEP_RE, t, perl = TRUE)
      before <- trimws(substr(t, 1, pos - 1)); after <- trimws(substr(t, pos + attr(pos, "match.length"), nchar(t)))
      if (nzchar(before)) {
        if (grepl(LAB_RE, before, perl = TRUE)) {
          mm <- regmatches(before, regexec(LAB_RE, before, perl = TRUE))[[1]]; add(mm[2], mm[3], "GLUED_TO_HEADING")
        } else append_prev(before, "GLUED_TO_HEADING")
      }
      if (is.na(kind)) kind <- "step"
      ids <- trimws(strsplit(sub("^Steps? ", "", m[2]), ",")[[1]])
      key <- paste(ids, collapse = ","); kind <- "step"
      if (s != "heading 3") add("(heading)", "", "HEADING_NOT_STYLED")
      if (nzchar(after)) append_prev(after, "TEXT_IN_HEADING")
      next
    }
    if (s == "heading 3" && identical(kind, "chart") && grepl(CHART_RE, t, perl = TRUE)) {
      m <- regmatches(t, regexec(CHART_RE, t, perl = TRUE))[[1]]
      key <- m[3]; add("(chart title)", trimws(m[2]))
      if (nzchar(trimws(m[4]))) add("(untagged)", trimws(m[4]), "TEXT_IN_HEADING")
      next
    }
    if (s == "heading 3") { add("(unknown heading)", t, "UNKNOWN_HEADING"); next }
    if (is.na(key)) next
    if (!nzchar(trimws(t))) next
    if (grepl(LAB_RE, t, perl = TRUE)) {
      mm <- regmatches(t, regexec(LAB_RE, t, perl = TRUE))[[1]]
      add(mm[2], mm[3])
    } else append_prev(t, "UNTAGGED_LINE")
  }
  do.call(rbind, rows)
}
