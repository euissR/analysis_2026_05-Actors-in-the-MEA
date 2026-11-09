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

REPO      <- "analysis_2026_05-Actors-in-the-MEA"
BASE      <- paste0("https://euissr.github.io/", REPO)
DEV_DIR   <- "."
EMBED_DIR <- "embed"
STEPS_DIR <- "js/steps"

region_names <- c(AF = "Africa", ME = "Middle East and the Gulf")

dir.create(EMBED_DIR, showWarnings = FALSE)

# read/write as raw bytes so UTF-8 text (’, Türkiye) is never re-encoded on Windows
read_lines  <- function(f) sub("[[:space:]]+$", "", readLines(f, warn = FALSE), useBytes = TRUE)
write_lines <- function(x, f) {
  con <- file(f, "wb")
  on.exit(close(con))
  writeLines(x, con, sep = "\n", useBytes = TRUE)
}

dev_files <- list.files(DEV_DIR, pattern = "^index_[a-z]+_(af|me)\\.html$", full.names = TRUE)
if (!length(dev_files)) stop("No index_{chapter}_{region}.html files found in ", DEV_DIR)

for (f in dev_files) {
  nm      <- basename(f)
  chapter <- sub("^index_([a-z]+)_([a-z]+)\\.html$", "\\1", nm)
  region  <- toupper(sub("^index_([a-z]+)_([a-z]+)\\.html$", "\\2", nm))
  id      <- paste0(region, "_", chapter)
  x       <- read_lines(f)

  # the block = from the .fa-scrolly div up to (not including) the main.js script tag
  start <- grep('<div class="fa-scrolly"', x, fixed = TRUE)[1]
  end   <- grep('src="js/main.js"', x, fixed = TRUE)[1]
  if (is.na(start) || is.na(end) || end <= start) {
    warning(nm, ": could not find the .fa-scrolly block or the main.js script; skipped")
    next
  }
  blk <- x[start:(end - 1)]
  while (length(blk) && !nzchar(blk[length(blk)])) blk <- blk[-length(blk)]
  blk[1] <- sub("^ +", "", blk[1])

  # checks ------------------------------------------------------------------
  # 1. relative paths left in the block
  rel <- grep('(src|href)="(?!https?://|#|mailto:)', blk, perl = TRUE, useBytes = TRUE)
  if (length(rel)) warning(id, ": relative src/href in the block (lines ", paste(rel, collapse = ", "), " of the block)")

  # 2. every data-step id has an entry in js/steps/{REGION}_{chapter}.js
  ids <- unique(sub('data-step="([^"]+)"', "\\1",
                    regmatches(paste(blk, collapse = "\n"),
                               gregexpr('data-step="[^"]+"', paste(blk, collapse = "\n")))[[1]]))
  steps_js <- file.path(STEPS_DIR, paste0(id, ".js"))
  if (file.exists(steps_js)) {
    js   <- paste(read_lines(steps_js), collapse = "\n")
    js   <- substring(js, max(gregexpr("steps:", js, fixed = TRUE)[[1]]))
    keys <- sub("^\\s+|:$", "", regmatches(js, gregexpr("(?m)^\\s+[A-Za-z0-9_]+:", js, perl = TRUE))[[1]])
    keys <- gsub("[[:space:]:]", "", keys)
    miss <- setdiff(ids, keys)
    if (length(miss)) warning(id, ": data-step ids with no entry in ", steps_js, ": ", paste(miss, collapse = ", "))
  } else {
    warning(id, ": ", steps_js, " not found, step ids not checked")
  }

  # build -------------------------------------------------------------------
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

  out_file <- file.path(EMBED_DIR, paste0(id, ".html"))
  status <- if (!file.exists(out_file)) "new"
            else if (identical(read_lines(out_file), out)) "unchanged"
            else "updated"
  write_lines(out, out_file)
  message(sprintf("%-12s %-10s <- %s", basename(out_file), status, nm))
}

setwd(wd1)
