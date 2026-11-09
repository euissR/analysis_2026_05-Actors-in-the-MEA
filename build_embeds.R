# build_embeds.R
# Builds the Drupal embed files (embed/{REGION}_{chapter}.html) from the dev
# pages (index_{chapter}_{region}.html). Edit the dev page, run this, paste the
# result into Drupal. Run from the repo root; no packages needed.
#
# Covers the chapter pages only (the ones with a .fa-scrolly block). The landing
# and methodology pages are not touched.

# wd1 <- "C:/Users/cdietrich/EU Institute for Security Studies/EDITORIAL TEAM - reports/2026_11 Actors in the MEA/graphics"
wd1 <- getwd()
wd2 <- "C:/Users/cdietrich/EU Institute for Security Studies/EDITORIAL TEAM - reports/2026_11 Actors in the MEA/web"
setwd(wd2)

# build_embeds.R
# Builds the Drupal embed files in embed/ from the dev pages in the repo root:
#   index_{chapter}_{region}.html  ->  embed/{REGION}_{chapter}.html
#   index_landing.html             ->  embed/landing.html
#   index_methodology.html         ->  embed/methodology.html
# Edit the dev page, run this, paste the result into Drupal (source mode).
# Run from the repo root; no packages needed.

REPO      <- "analysis_2026_05-Actors-in-the-MEA"
BASE      <- paste0("https://euissr.github.io/", REPO)
DEV_DIR   <- "."
EMBED_DIR <- "embed"
STEPS_DIR <- "js/steps"

# TRUE = leave the <h1> of the landing page out of the embed (Drupal shows its own page title)
LANDING_DROP_H1 <- FALSE

region_names <- c(AF = "Africa", ME = "Middle East and the Gulf")

dir.create(EMBED_DIR, showWarnings = FALSE)

# ── helpers ──────────────────────────────────────────────────────────────────
# read/write as raw bytes so UTF-8 text (’, Türkiye) is never re-encoded on Windows
read_lines  <- function(f) sub("[[:space:]]+$", "", readLines(f, warn = FALSE), useBytes = TRUE)
write_lines <- function(x, f) {
  con <- file(f, "wb")
  on.exit(close(con))
  writeLines(x, con, sep = "\n", useBytes = TRUE)
}

# relative asset paths -> absolute GitHub Pages URLs
absolutize <- function(x) {
  x <- gsub('href="css/fa.css"', sprintf('href="%s/css/fa.css"', BASE), x, fixed = TRUE)
  x <- gsub('src="js/',          sprintf('src="%s/js/', BASE),          x, fixed = TRUE)
  x <- gsub('src="src/',         sprintf('src="%s/src/', BASE),         x, fixed = TRUE)
  x
}

# remove the indentation of the first line from every line
dedent <- function(x) {
  n <- nchar(sub("^( *).*$", "\\1", x[1], useBytes = TRUE))
  sub(paste0("^ {0,", n, "}"), "", x, useBytes = TRUE)
}

drop_trailing_blank <- function(x) {
  while (length(x) && !nzchar(x[length(x)])) x <- x[-length(x)]
  x
}

# lines of a dev page between the first line matching `from` and the first matching `to`
# (fixed strings); `to_inclusive` keeps the closing line
cut_block <- function(x, from, to, to_inclusive = FALSE) {
  s <- grep(from, x, fixed = TRUE)[1]
  e <- grep(to,   x, fixed = TRUE)[1]
  if (is.na(s) || is.na(e) || e <= s) return(NULL)
  x[s:(if (to_inclusive) e else e - 1)]
}

# warn about relative src/href left in an embed (index_*.html links are filled by nav.js)
check_relative <- function(id, blk) {
  rel <- grep('(src|href)="(?!https?://|#|mailto:|index_)', blk, perl = TRUE, useBytes = TRUE)
  if (length(rel)) warning(id, ": relative src/href at lines ", paste(rel, collapse = ", "), " of the embed")
}

finish <- function(out_file, out, dev_name) {
  status <- if (!file.exists(out_file)) "new"
  else if (identical(read_lines(out_file), out)) "unchanged"
  else "updated"
  write_lines(out, out_file)
  message(sprintf("%-18s %-10s <- %s", basename(out_file), status, dev_name))
}

# ── chapters ─────────────────────────────────────────────────────────────────
dev_files <- list.files(DEV_DIR, pattern = "^index_[a-z]+_(af|me)\\.html$", full.names = TRUE)

for (f in dev_files) {
  nm      <- basename(f)
  chapter <- sub("^index_([a-z]+)_([a-z]+)\\.html$", "\\1", nm)
  region  <- toupper(sub("^index_([a-z]+)_([a-z]+)\\.html$", "\\2", nm))
  id      <- paste0(region, "_", chapter)
  
  # the block = from the .fa-scrolly div up to (not including) the main.js script tag
  blk <- cut_block(read_lines(f), '<div class="fa-scrolly"', 'src="js/main.js"')
  if (is.null(blk)) {
    warning(nm, ": could not find the .fa-scrolly block or the main.js script; skipped")
    next
  }
  blk    <- drop_trailing_blank(blk)
  blk[1] <- sub("^ +", "", blk[1])
  
  # every data-step id must have an entry in js/steps/{REGION}_{chapter}.js
  txt  <- paste(blk, collapse = "\n")
  ids  <- unique(sub('data-step="([^"]+)"', "\\1",
                     regmatches(txt, gregexpr('data-step="[^"]+"', txt))[[1]]))
  steps_js <- file.path(STEPS_DIR, paste0(id, ".js"))
  if (file.exists(steps_js)) {
    js   <- paste(read_lines(steps_js), collapse = "\n")
    js   <- substring(js, max(gregexpr("steps:", js, fixed = TRUE)[[1]]))
    keys <- gsub("[[:space:]:]", "", regmatches(js, gregexpr("(?m)^\\s+[A-Za-z0-9_]+:", js, perl = TRUE))[[1]])
    miss <- setdiff(ids, keys)
    if (length(miss)) warning(id, ": data-step ids with no entry in ", steps_js, ": ", paste(miss, collapse = ", "))
  } else {
    warning(id, ": ", steps_js, " not found, step ids not checked")
  }
  
  out <- c(
    sprintf("<!-- Levers of influence | %s | %s", region_names[[region]], chapter),
    sprintf("     Generated from %s by build_embeds.R: edit the dev page and rebuild, not this file.", nm),
    "     Paste into the Drupal body (source mode). The intro text is typed into the body outside this block. -->",
    "",
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Sans+Narrow:wght@400;700&display=swap" />',
    sprintf('<link rel="stylesheet" href="%s/css/fa.css" />', BASE),
    "",
    blk,
    "",
    sprintf('<script type="module" src="%s/js/main.js"></script>', BASE)
  )
  check_relative(id, out)
  finish(file.path(EMBED_DIR, paste0(id, ".html")), out, nm)
}

# ── landing page: from its header comment to the landing.js script tag ──────
f <- file.path(DEV_DIR, "index_landing.html")
if (file.exists(f)) {
  blk <- cut_block(read_lines(f), "<!-- =====", 'src="js/landing.js"', to_inclusive = TRUE)
  if (is.null(blk)) {
    warning("index_landing.html: could not find the header comment or the landing.js script; skipped")
  } else {
    blk <- absolutize(dedent(blk))
    if (LANDING_DROP_H1) blk <- blk[!grepl("^\\s*<h1[ >].*</h1>\\s*$", blk, useBytes = TRUE)]
    check_relative("landing", blk)
    finish(file.path(EMBED_DIR, "landing.html"), blk, basename(f))
  }
}

# ── methodology page: from the breadcrumb to the nav.js script tag ───────────
f <- file.path(DEV_DIR, "index_methodology.html")
if (file.exists(f)) {
  blk <- cut_block(read_lines(f), '<div class="fa-crumb"', 'src="js/nav.js"', to_inclusive = TRUE)
  if (is.null(blk)) {
    warning("index_methodology.html: could not find the fa-crumb div or the nav.js script; skipped")
  } else {
    blk <- absolutize(dedent(blk))
    check_relative("methodology", blk)
    finish(file.path(EMBED_DIR, "methodology.html"), blk, basename(f))
  }
}