# XiaoSiKe GitHub profile

GitHub renders this README as the profile because the public repository is named exactly `XiaoSiKe/XiaoSiKe`.

## How it updates

The **Refresh pixel profile** workflow runs once per day at 09:17 Asia/Shanghai (01:17 UTC), and remains available for manual dispatch. It uses the upstream MIT package `pixel-profile@1.3.0` to render the CRT-style statistics card from public GitHub data. It also generates a list of the eight most recently updated public repositories, with clickable rows, repository metadata, and weekly commit sparklines from GitHub's participation endpoint.

Repository rows have light, dark, and mobile SVG variants selected by `<picture>` media sources. The README links directly to each repository and to GitHub's full repository tab. GitHub provides search, type, language, and sort controls on that tab. Long descriptions are shortened visually; their full text remains in the alternative text and SVG description.

The workflow only needs the repository-scoped `GITHUB_TOKEN` supplied by GitHub Actions. No personal token is stored as a repository secret.

## Data boundary

Repository totals and list entries are fetched through public GitHub endpoints. Only entries explicitly marked public are eligible for the list; configured exclusions apply before its limit. Private repository names and descriptions are never written to the README, generated assets, or snapshot. The snapshot records the displayed public repository metadata and the real weekly commit counts used in each chart.

If GitHub is preparing participation statistics or the optional endpoint is unavailable, the row displays “Activity unavailable” and refreshes on the next workflow run. A valid year with no commits is shown as a flat line.

Only metrics actually returned by those public endpoints are written to the snapshot. The displayed rank is a public-data estimate: unavailable private activity and review totals are not inferred.

## Local commands

```bash
GH_TOKEN="..." npm run generate
npm test
```

Edit the heading, Chinese and English mottos, repository limit, exclusions, or card colors in `config/profile.json`; generated README, PNG, and SVG files should not be edited by hand. `scripts/repositories.mjs` controls the repository row layout. The generated `assets/repositories/` directory is replaced on each run so removed entries leave no stale assets.
