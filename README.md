# Robotics Systems Survey

A source-linked survey of onboard compute, operating systems, resource controls, IPC, workload lifecycles, recording, and experiment provenance across robotics, autonomous vehicles, and drones.

**[Open the survey](https://cutuy.github.io/robotics-systems-survey/)**

## Explore

- **Current practices:** include or exclude labs and filter workflows by technology labels and text; compare compute, resources/IPC, lifecycle, and recording details.
- **CoRL summary:** a visual field guide to compute, software, communication, timing, processes, and recording, with links to supporting workflows.
- **Synthesis:** compare compute, runtime, lifecycle and recording patterns across the original survey and CoRL additions; filter examples and evidence by population.
- **Sources:** follow public papers, repositories, documentation, and company disclosures.
- Each main view has a static page; URLs preserve filters. Legacy `?view=…` links and `labs.html` remain supported.
- [CoRL 2026 additions](https://cutuy.github.io/robotics-systems-survey/?view=practices&cohort=corl-2026-full-scan): 571 source-linked records; [findings and review scope](docs/corl-2026.md).

This is a research snapshot. Individual records distinguish documented implementations, platform options, hiring evidence, and inferences. Source links retain their original targets; upstream material may change.

## Run locally

Requires Python 3:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080/`. The committed HTML is ready to serve. There is no backend, account system, or API key.

After changing data, scripts or styles, regenerate the pages with Node.js 22.18+:

```sh
node scripts/build_site.mts
node scripts/build_site.mts --check
```

The generator uses the existing renderers to write all four views, asset cache keys, metadata and `sitemap.xml`. `--check` fails when generated files are stale.

## Files and maintenance

- `index.html`, `corl-summary.html`, `synthesis.html`, `sources.html` and the `labs.html` alias: generated pages; regenerate instead of editing them.
- `site.js`: page URLs, titles, descriptions and legacy routing.
- `scripts/build_site.mts`: shared HTML template and static generation.
- `labs.js` and `labs.css`: navigation, filtering, counts, and presentation.
- `lab-research.json`: survey records, technology labels, and source references.
- `.nojekyll`: enables direct static-file publication on GitHub Pages.

Run `node scripts/check_survey.mjs` after data or renderer changes; `node scripts/check_summary.mjs` checks the CoRL summary; `node scripts/check_synthesis.mjs` checks both summaries’ section controls, population filters and evidence links.

After CSS changes, check both summary layouts in Chromium using an existing Playwright installation:

```sh
node scripts/check_layout.mjs --playwright /path/to/playwright/index.mjs --browser /path/to/chromium --url http://localhost:8080/
```

Add `--screenshots /tmp/survey-layout` to save desktop and mobile previews. Run `scripts/check_seo.mts` with the same `--playwright`, `--browser` and `--url` arguments to check content without JavaScript, metadata, sitemap, redirects and interactive filters.

Update research records and their source references together. Label counts are computed from the data at runtime. Preserve stable record IDs so existing deep links continue to work.

## GitHub Pages

In repository **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/ (root)**. Asset and data paths are relative, supporting both repository paths and custom domains.

The sitemap is served at `/robotics-systems-survey/sitemap.xml`; submit that URL in Search Console. It lists the four canonical views and excludes filter combinations and legacy aliases. A `robots.txt` inside this project directory would be ignored: sitemap discovery through robots requires an entry in `https://cutuy.github.io/robots.txt`, managed by the domain-root repository.

## Publication scope

The public export contains research summaries and links to published sources. Direct contact records, email addresses, private outreach material, internal change histories, local source-cache metadata, and the original server application are excluded. Public author names and repository handles can remain as source attribution. Source archives are not bundled.

Third-party papers, repositories, and documentation retain their respective ownership and licenses.
