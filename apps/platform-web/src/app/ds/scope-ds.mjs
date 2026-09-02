// Generate galleon-ui.css from galleon-ui.source.css by scoping every rule
// under `.galleon-ds`, so the broadsheet theme only styles the dashboards and
// never leaks onto the marketing site (which shares the gl-* / :root namespace
// via the app's own globals.css).
//
//   node scope-ds.mjs
//
// Transform, block by block:
//   :root { … }                       -> .galleon-ds { … }   (tokens scoped to the wrapper)
//   [data-gl-theme=publisher] { … }   -> .galleon-ds[data-gl-theme=publisher] { … }
//   .gl-foo, .gl-bar:hover { … }       -> .galleon-ds .gl-foo, .galleon-ds .gl-bar:hover { … }
//   @media (…) { <nested rules scoped> }
// Dropped entirely: the bare `html`, `body`, `*` base resets and the
// `:where(a,button,…):focus-visible` rule — globals.css already owns the page
// box, and a scoped copy of those would fight it. box-sizing is re-added scoped.

import { readFileSync, writeFileSync } from "node:fs";

const SCOPE = ".galleon-ds";
const src = readFileSync(new URL("./galleon-ui.source.css", import.meta.url), "utf8");

// Selectors to drop (bare element / global resets that must not be scoped-in).
const DROP = new Set(["*", "*::before", "*::after", "html", "body", "a", "button"]);

function scopeSelector(sel) {
  return sel
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (s.startsWith(":root")) return SCOPE + s.slice(":root".length);
      if (s.startsWith("[data-gl-theme")) return SCOPE + s;
      // Anything that is only bare element selectors / global pseudo we drop.
      const bare = s.replace(/:[a-z-]+(\([^)]*\))?/g, "").trim();
      if (DROP.has(bare) || s.startsWith(":where(")) return null;
      return `${SCOPE} ${s}`;
    })
    .filter(Boolean)
    .join(",\n");
}

// Tokenize into top-level blocks: either `@media (...) { ... }` or `selector { ... }`.
function transform(css) {
  let out = "";
  let i = 0;
  while (i < css.length) {
    // skip comments verbatim
    if (css.startsWith("/*", i)) {
      const end = css.indexOf("*/", i + 2) + 2;
      out += css.slice(i, end);
      i = end;
      continue;
    }
    if (/\s/.test(css[i])) { out += css[i++]; continue; }

    // read a "prelude" up to { or ;
    let j = i;
    while (j < css.length && css[j] !== "{" && css[j] !== "}") j++;
    const prelude = css.slice(i, j).trim();

    if (css[j] !== "{") { i = j; continue; }

    // find matching close brace
    let depth = 1, k = j + 1;
    while (k < css.length && depth > 0) {
      if (css[k] === "{") depth++;
      else if (css[k] === "}") depth--;
      k++;
    }
    const body = css.slice(j + 1, k - 1);

    if (prelude.startsWith("@media")) {
      const inner = transform(body).trim();
      if (inner) out += `${prelude} {\n${inner}\n}\n`;
    } else if (prelude.includes(":where(")) {
      // Global focus-visible reset — drop entirely (commas inside :where()
      // would break a naive per-selector split, and globals owns focus).
    } else {
      const sel = scopeSelector(prelude);
      if (sel) out += `${sel} {${body}}\n`;
    }
    i = k;
  }
  return out;
}

const header =
  "/* GENERATED from galleon-ui.source.css by scope-ds.mjs — do not edit.\n" +
  "   Every rule is scoped under .galleon-ds so the broadsheet Galleon design\n" +
  "   system styles only the dashboards, never the marketing site. */\n";

// The upstream bundle set font-family/color/background on bare `html`, which we
// drop (it would fight globals.css). Re-establish them on the wrapper so the
// broadsheet fonts and ink apply inside the dashboards instead of inheriting the
// marketing site's font.
const base =
  `${SCOPE} {\n` +
  `  color: var(--gl-text);\n` +
  `  font-family: var(--gl-font-body);\n` +
  `  font-synthesis: none;\n` +
  `}\n` +
  `${SCOPE}, ${SCOPE} *, ${SCOPE} *::before, ${SCOPE} *::after {\n  box-sizing: border-box;\n}\n`;

writeFileSync(
  new URL("./galleon-ui.css", import.meta.url),
  header + base + transform(src),
);
console.log("wrote galleon-ui.css");
