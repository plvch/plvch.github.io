# plvch.com

Personal site and writing hub — long-form essays and short data notes on markets,
policy, and personal finance, plus an independent financial-planning practice.
Three locales (EN · RU · DE), static HTML, no runtime dependencies, no third-party requests.

Live at **[plvch.com](https://plvch.com)**.

## Layout

```
build.py                 hub pages, notes, 404, sitemap → dist/ (content and translations live here)
assets/                  plvch-tokens.css (shared design tokens), site.css, site.js
static/                  copied into dist/ as is: _headers, _redirects, robots.txt, favicons
essays/<slug>/           published files of each essay, copied from its own repo
essays/manifest.json     which files each essay publishes, from which repo and commit
scripts/sync_essays.py   refresh essays/ from the essay repos
scripts/check_site.py    links resolve; nothing loads from another host
wrangler.jsonc           Cloudflare Worker "plvch-site" that serves dist/
```

The essays keep their research, drafts and build scripts in their own repositories
(`plvch/open-indexing`, `indexes-cost`, `small-business-concentration`, `turnover-vs-gdp`).
Only the files listed in `essays/manifest.json` are published. Third-party scripts an
essay needs are served from plvch.com (`vendor` in the manifest, checked against the
page's integrity hash).

## Build and check

```sh
python3 build.py              # writes dist/ from scratch
python3 scripts/check_site.py # fails on a broken internal link or a third-party request
```

Edit content and translations in `build.py` (`STR`, `POSTS`, `WHATIDO`, `*_BODY`).
The legal text (`LEGAL_BODY_DE`) follows the masters in the private
`plvch/administrative` repo (`plvch/site/legal/`); change both together.

After an essay changes in its repo: `python3 scripts/sync_essays.py <slug>`, review
the diff, commit.

Preview locally: `npx wrangler@4.151.3 dev` (serves dist/ on http://localhost:8787).

## Deploy

`.github/workflows/site.yml` builds and checks every push and PR. On `main` it deploys
the Worker; on a PR it uploads a preview (`pr-<n>-plvch-site.<account>.workers.dev`).
Both need the `CLOUDFLARE_API_TOKEN` repo secret.
