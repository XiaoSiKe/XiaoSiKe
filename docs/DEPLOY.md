# XiaoSiKe GitHub profile

GitHub renders this README as the profile because the public repository is named exactly `XiaoSiKe/XiaoSiKe`.

## How it updates

The **Refresh pixel profile** workflow runs every 30 minutes and on manual dispatch. It uses the upstream MIT package `pixel-profile@1.3.0` to render the same CRT-style statistics card seen in the reference profile, then rebuilds the project list from public GitHub repositories.

The workflow only needs the repository-scoped `GITHUB_TOKEN` supplied by GitHub Actions. No personal token is stored as a repository secret.

## Data boundary

The project list is fetched through the public `/users/XiaoSiKe/repos` endpoint. Forks, archived repositories, the profile repository, and the `pixel-profile` fork are excluded. Private repository names and descriptions are never written to the README or snapshot.

## Local commands

```bash
GH_TOKEN="..." npm run generate
npm test
```

Edit copy, featured repositories, limits, or card colors in `config/profile.json`; generated README and PNG files should not be edited by hand.
