# XiaoSiKe GitHub profile

GitHub renders this README as the profile because the public repository is named exactly `XiaoSiKe/XiaoSiKe`.

## How it updates

The **Refresh pixel profile** workflow runs once per day at 09:17 Asia/Shanghai (01:17 UTC), and remains available for manual dispatch. It generates the visible club introduction from the bilingual motto in `config/profile.json` and the complete body in `config/introduction.md`. The README contains the supplied club identity, founding purpose, invitation, joining link, and poster.

The poster is stored at `assets/01-ai-club.png`; the README references that local image rather than the expiring Feishu download link. GitHub's native Markdown handles typography, quote blocks, light and dark themes, and responsive wrapping. The bilingual motto uses a bold H3 at approximately 20 px.

The existing data pipeline continues to refresh the supporting `pixel-profile@1.3.0` statistics card, repository SVG assets, and snapshot independently. These supporting assets are available in the repository; the visible README is the club introduction.

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

Edit the Chinese and English mottos in `config/profile.json` and the body in `config/introduction.md`; generated README files should not be edited by hand. The supplied `assets/01-ai-club.png` is a source asset and is preserved during generation. Supporting repository limits, exclusions, and card colors remain in `config/profile.json`, with row rendering in `scripts/repositories.mjs`. The generated `assets/repositories/` directory is replaced on each run so removed entries leave no stale assets.
