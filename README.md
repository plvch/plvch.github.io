# plvch.com

Personal site and writing hub — long-form essays and short data notes on markets,
policy, and personal finance, plus an independent financial-planning practice.
Three locales (EN · RU · DE), static HTML, no runtime dependencies.

Live at **[plvch.com](https://plvch.com)**.

## Structure

```
index.html              EN home / writing index
ru/  de/                RU / DE home
practice/  + ru,de      Financial-planning practice
legal/     + ru,de      Impressum + Datenschutzerklärung (German, legally binding)
assets/                 plvch-tokens.css (shared design tokens), site.css, site.js
build.py                regenerates every page from one set of content + strings
CNAME                   custom domain
```

The essays live in their own repositories and nest under the same domain
(`/open-indexing/`, `/indexes_cost/`, `/small-business-concentration/`); links
here are root-relative, so they resolve across the whole domain.

## Build

```sh
python3 build.py        # writes the 9 pages (3 sections × 3 locales)
```

Edit content and translations in `build.py` (the `STR`, `POSTS`, `WHATIDO`, and
`*_BODY` blocks), then re-run. The site shares one light/dark design system
(`plvch-tokens.css`) with the essays, so the look carries across the domain.
