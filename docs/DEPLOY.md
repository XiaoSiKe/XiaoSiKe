# XiaoSiKe GitHub profile

GitHub renders this README as the profile because the public repository is named exactly `XiaoSiKe/XiaoSiKe`.

## How it updates

The **Refresh pixel profile** workflow runs once per day at 09:17 Asia/Shanghai (01:17 UTC), and remains available for manual dispatch. It uses the upstream MIT package `pixel-profile@1.3.0` to render the CRT-style statistics card from public GitHub data. The profile README intentionally does not include a project list or generated footer.

The workflow only needs the repository-scoped `GITHUB_TOKEN` supplied by GitHub Actions. No personal token is stored as a repository secret.

## Data boundary

Repository totals are fetched through public GitHub endpoints for the statistics card. Private repository names, descriptions, and project listings are never written to the README or snapshot.

## Local commands

```bash
GH_TOKEN="..." npm run generate
npm test
```

Edit copy, featured repositories, limits, or card colors in `config/profile.json`; generated README and PNG files should not be edited by hand.
