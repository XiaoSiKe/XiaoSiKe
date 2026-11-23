# XiaoSiKe GitHub profile

GitHub renders this README as the profile because the public repository is named exactly `XiaoSiKe/XiaoSiKe`.

## How it updates

The **Refresh pixel profile** workflow runs once per day at 09:17 Asia/Shanghai (01:17 UTC), and remains available for manual dispatch. It builds the profile README from `config/introduction.md`. It opens with the banner in `assets/01player-banner.png`, followed by the author's current work and the founding purpose of the 01PLAYER community.

The data pipeline refreshes the original `pixel-profile@1.3.0` statistics card, repository SVG assets, and snapshot. After the introduction, the visible README displays the statistics card and eight recently updated public repositories as clickable vertical rows with real weekly commit curves. Repository rows provide light, dark, and mobile picture sources. A final link opens GitHub's complete repository tab.

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

Edit the profile text in `config/introduction.md`, then generate the README files. Supporting repository limits, exclusions, and card colors remain in `config/profile.json`, with row rendering in `scripts/repositories.mjs`. The generated `assets/repositories/` directory is replaced on each run so removed entries leave no stale assets.
