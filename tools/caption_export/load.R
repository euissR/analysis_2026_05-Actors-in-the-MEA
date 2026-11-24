.libPaths(c(Sys.getenv("R_LIBS_USER"), .libPaths()))
suppressMessages({ library(V8); library(jsonlite) })

args <- commandArgs(trailingOnly = TRUE)
web <- args[1]
scratch <- args[2]
stepdir <- file.path(web, "js", "steps")

order <- c("AF_dipl", "AF_trade", "AF_invest", "AF_infra", "AF_mil", "AF_soft",
           "ME_dipl", "ME_trade", "ME_invest", "ME_infra", "ME_mil", "ME_soft")

ctx <- v8()
ctx$eval('var theme = new Proxy({}, { get: function (t, k) { return k === "actorColors" ? {} : String(k); } }); var CFG = {};')

load_cfg <- function(name) {
  src <- readLines(file.path(stepdir, paste0(name, ".js")), encoding = "UTF-8", warn = FALSE)
  src <- src[!grepl("^\\s*import\\s", src)]
  src <- sub("^export default\\s*", "return ", src)
  src <- sub("^export const\\s+", "const ", src)
  ctx$eval(paste0("CFG['", name, "'] = (function () {\n", paste(src, collapse = "\n"), "\n})();"))
}
for (n in order) load_cfg(n)
for (n in order) ctx$eval(sprintf("var %s = CFG['%s'];", n, n))
load_cfg("landing")
ctx$source(file.path(scratch, "extract.js"))

ctx$eval(sprintf("var OUT = %s.map(extractChapter).concat([extractLanding()]);", toJSON(order)))
chapters <- ctx$get("OUT", simplifyVector = FALSE)
# header comment, line 1 of each file, as chapter description
desc <- sapply(c(order, "landing"), function(n) {
  l1 <- readLines(file.path(stepdir, paste0(n, ".js")), n = 1, encoding = "UTF-8")
  sub("^//\\s*[^:]+:\\s*", "", l1)
})
