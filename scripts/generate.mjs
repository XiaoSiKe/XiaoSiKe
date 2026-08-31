import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { renderStats } from "pixel-profile";

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, "config", "profile.json"), "utf8"));
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || process.env.PAT_1 || "";

const baseHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "xiaosike-github-profile",
  "X-GitHub-Api-Version": "2022-11-28"
};

async function github(pathname) {
  let response = await fetch(`https://api.github.com${pathname}`, {
    headers: { ...baseHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  if (response.status === 403 && token) {
    response = await fetch(`https://api.github.com${pathname}`, { headers: baseHeaders });
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 240)}`);
  }
  return response.json();
}

function startOfYear() {
  const date = new Date();
  return `${date.getUTCFullYear()}-01-01`;
}

function oneYearAgo() {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

async function searchTotal(endpoint, query) {
  const result = await github(`/${endpoint}?q=${encodeURIComponent(query)}&per_page=1`);
  return Number(result.total_count || 0);
}

function calculateRank({ commits, prs, issues, reviews, stars, followers }) {
  const exponentialCdf = (value) => 1 - 2 ** -value;
  const logNormalCdf = (value) => value / (1 + value);
  const score =
    (2 * exponentialCdf(commits / 250) +
      3 * exponentialCdf(prs / 50) +
      exponentialCdf(issues / 25) +
      exponentialCdf(reviews / 2) +
      4 * logNormalCdf(stars / 50) +
      logNormalCdf(followers / 10)) /
    12;
  const percentile = (1 - score) * 100;
  const thresholds = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const levels = ["S", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];
  const index = thresholds.findIndex((threshold) => percentile <= threshold);
  return {
    level: levels[index] || "C",
    percentile,
    score: Number((score * 100).toFixed(1))
  };
}

async function collectPublicStats(user, repositories) {
  const [totalCommits, totalPRs, totalIssues, recentCommits] = await Promise.all([
    searchTotal("search/commits", `author:${config.username} author-date:>=${startOfYear()}`),
    searchTotal("search/issues", `author:${config.username} type:pr`),
    searchTotal("search/issues", `author:${config.username} type:issue`),
    github(
      `/search/commits?q=${encodeURIComponent(`author:${config.username} author-date:>=${oneYearAgo()}`)}&per_page=100`
    )
  ]);
  const contributedRepositories = new Set(
    (recentCommits.items || [])
      .map((commit) => commit.repository?.full_name)
      .filter((name) => name && !name.startsWith(`${config.username}/`))
  );
  const totalStars = repositories
    .filter((repository) => !config.excludeRepositories.includes(repository.name))
    .reduce((total, repository) => total + Number(repository.stargazers_count || 0), 0);
  const stats = {
    name: user.name || user.login,
    username: user.login,
    avatarUrl: user.avatar_url,
    bio: user.bio || "",
    totalPRs,
    totalPRsMerged: 0,
    mergedPRsPercentage: 0,
    totalReviews: 0,
    totalCommits,
    totalIssues,
    totalStars,
    totalDiscussionsStarted: 0,
    totalDiscussionsAnswered: 0,
    contributedTo: contributedRepositories.size,
    rank: null
  };
  stats.rank = calculateRank({
    commits: stats.totalCommits,
    prs: stats.totalPRs,
    issues: stats.totalIssues,
    reviews: stats.totalReviews,
    stars: stats.totalStars,
    followers: Number(user.followers || 0)
  });
  return stats;
}

async function getPublicRepositories(username) {
  const repositories = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await github(
      `/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`
    );
    repositories.push(...batch);
    if (batch.length < 100) break;
  }
  return repositories.filter((repository) => !repository.private);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value) {
  const number = Number(value || 0);
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(number);
}

function selectRepositories(repositories) {
  const visible = repositories.filter(
    (repository) =>
      !repository.fork &&
      !repository.archived &&
      !config.excludeRepositories.includes(repository.name)
  );
  const byName = new Map(visible.map((repository) => [repository.name, repository]));
  const selected = [];

  for (const name of config.featuredRepositories) {
    const repository = byName.get(name);
    if (!repository) continue;
    selected.push(repository);
    byName.delete(name);
  }

  const remaining = [...byName.values()].sort((left, right) => {
    const starDifference = right.stargazers_count - left.stargazers_count;
    if (starDifference !== 0) return starDifference;
    return new Date(right.updated_at) - new Date(left.updated_at);
  });

  return [...selected, ...remaining].slice(0, config.repositoryLimit);
}

function repositoryCard(repository) {
  const language = repository.language ? `<code>${escapeHtml(repository.language)}</code>` : "MULTI-STACK";
  const stars = Number(repository.stargazers_count || 0);
  const forks = Number(repository.forks_count || 0);
  const metadata = [language, `${formatNumber(stars)} STAR${stars === 1 ? "" : "S"}`];
  if (forks > 0) metadata.push(`${formatNumber(forks)} FORKS`);
  const liveLink = repository.homepage
    ? ` · <a href="${escapeHtml(repository.homepage)}">LIVE ↗</a>`
    : "";

  return `<td width="50%" valign="top">
<h3><a href="${escapeHtml(repository.html_url)}">${escapeHtml(repository.name)} ↗</a></h3>
<p>${escapeHtml(repository.description || "持续构建中，保持迭代。")}</p>
<sub>${metadata.join(" &nbsp;·&nbsp; ")}${liveLink}</sub>
</td>`;
}

function renderRepositoryTable(repositories) {
  const rows = [];
  for (let index = 0; index < repositories.length; index += 2) {
    const left = repositoryCard(repositories[index]);
    const right = repositories[index + 1]
      ? repositoryCard(repositories[index + 1])
      : '<td width="50%" valign="top"></td>';
    rows.push(`<tr>\n${left}\n${right}\n</tr>`);
  }
  return `<table>\n${rows.join("\n")}\n</table>`;
}

function renderReadme(repositories, generatedAt) {
  const syncTime = new Intl.DateTimeFormat("zh-CN", {
    timeZone: config.refreshTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(generatedAt));

  return `<!-- Generated automatically. Edit config/profile.json or scripts/generate.mjs instead. -->

<h1 align="center">${escapeHtml(config.displayName)}</h1>

<p align="center"><strong>${escapeHtml(config.headline)}</strong></p>
<p align="center">${escapeHtml(config.motto)}</p>
<p align="center"><strong>${escapeHtml(config.role)}</strong></p>

<br>

<div align="center">
  <img src="./assets/github-stats.png" width="100%" alt="${escapeHtml(config.displayName)} 的像素风 GitHub 数据卡，包含 Star、提交、PR、Issue、贡献仓库与等级统计">
</div>

<br>

## PROJECTS / 代表项目

${renderRepositoryTable(repositories)}

<br>

<div align="center">
  <sub>BUILD IN PUBLIC · KEEP SHIPPING · STAY CURIOUS</sub><br>
  <sub>自动更新于 ${escapeHtml(syncTime)} (UTC+8) · Pixel card powered by <a href="https://github.com/LuciNyan/pixel-profile">pixel-profile</a></sub>
</div>
`;
}

const generatedAt = new Date().toISOString();
const [user, repositories] = await Promise.all([
  github(`/users/${encodeURIComponent(config.username)}`),
  getPublicRepositories(config.username)
]);
const selectedRepositories = selectRepositories(repositories);
const stats = await collectPublicStats(user, repositories);
const card = await renderStats(stats, {
  background: config.card.background,
  color: config.card.color,
  screenEffect: config.card.screenEffect,
  pixelateAvatar: config.card.pixelateAvatar,
  includeAllCommits: false,
  isFastMode: true
});
const readme = renderReadme(selectedRepositories, generatedAt);

await mkdir(path.join(root, "assets"), { recursive: true });
await mkdir(path.join(root, "dist"), { recursive: true });
await Promise.all([
  writeFile(path.join(root, "assets", "github-stats.png"), card),
  writeFile(path.join(root, "README.md"), readme),
  writeFile(path.join(root, "dist", "README.md"), readme),
  writeFile(
    path.join(root, "dist", "snapshot.json"),
    `${JSON.stringify(
      {
        generatedAt,
        stats,
        repositories: selectedRepositories.map((repository) => ({
          name: repository.name,
          description: repository.description,
          html_url: repository.html_url,
          homepage: repository.homepage,
          language: repository.language,
          stargazers_count: repository.stargazers_count,
          forks_count: repository.forks_count,
          updated_at: repository.updated_at,
          private: false
        }))
      },
      null,
      2
    )}\n`
  )
]);

console.log(`Generated the pixel-profile card and ${selectedRepositories.length} project cards for ${config.username}.`);
