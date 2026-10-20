import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { renderStats } from "pixel-profile";
import { renderRepositorySvg, selectRepositories } from "./repositories.mjs";

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, "config", "profile.json"), "utf8"));
const introduction = await readFile(path.join(root, "config", "introduction.md"), "utf8");
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || process.env.PAT_1 || "";

const baseHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "xiaosike-github-profile",
  "X-GitHub-Api-Version": "2022-11-28"
};

async function github(pathname, { optional = false } = {}) {
  let response = await fetch(`https://api.github.com${pathname}`, {
    headers: { ...baseHeaders, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  if (response.status === 403 && token) {
    response = await fetch(`https://api.github.com${pathname}`, { headers: baseHeaders });
  }
  if (optional && (!response.ok || response.status === 202 || response.status === 204)) return null;
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

function calculatePublicRank({ commits, prs, issues, reviews, stars, followers }) {
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
    totalCommits,
    totalIssues,
    totalStars,
    contributedTo: contributedRepositories.size,
    rank: null
  };
  stats.rank = calculatePublicRank({
    commits: stats.totalCommits,
    prs: stats.totalPRs,
    issues: stats.totalIssues,
    // Public REST endpoints do not expose review-contribution totals.
    reviews: 0,
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

function renderReadme() {
  return `<!-- Generated automatically. Edit config/profile.json or config/introduction.md instead. -->

<h3><strong>${escapeHtml(config.motto)}</strong><br>
<strong>${escapeHtml(config.mottoEnglish)}</strong></h3>

${introduction.trim()}
`;
}

const generatedAt = new Date().toISOString();
const [user, repositories] = await Promise.all([
  github(`/users/${encodeURIComponent(config.username)}`),
  getPublicRepositories(config.username)
]);
const listedRepositories = await Promise.all(
  selectRepositories(repositories, config).map(async (repository) => {
    const participation = await github(
      `/repos/${encodeURIComponent(config.username)}/${encodeURIComponent(repository.name)}/stats/participation`,
      { optional: true }
    ).catch(() => null);
    return {
      name: repository.name,
      url: repository.html_url,
      description: repository.description || "",
      language: repository.language,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      issues: repository.open_issues_count,
      license: repository.license?.spdx_id === "NOASSERTION" ? null : repository.license?.spdx_id,
      updatedAt: repository.updated_at,
      weeklyCommits: Array.isArray(participation?.all) ? participation.all : null
    };
  })
);
const stats = await collectPublicStats(user, repositories);
const card = await renderStats(stats, {
  background: config.card.background,
  color: config.card.color,
  screenEffect: config.card.screenEffect,
  pixelateAvatar: config.card.pixelateAvatar,
  includeAllCommits: false,
  isFastMode: true
});
const readme = renderReadme();

await mkdir(path.join(root, "assets"), { recursive: true });
await mkdir(path.join(root, "dist"), { recursive: true });
const repositoryAssets = path.join(root, "assets", "repositories");
await rm(repositoryAssets, { recursive: true, force: true });
await mkdir(repositoryAssets, { recursive: true });
await Promise.all([
  ...listedRepositories.flatMap((repository, index) =>
    ["dark", "light"].flatMap((theme) =>
      [false, true].map((compact) =>
        writeFile(
          path.join(repositoryAssets, `${index + 1}-${theme}${compact ? "-mobile" : ""}.svg`),
          renderRepositorySvg(repository, { theme, compact })
        )
      )
    )
  ),
  writeFile(path.join(root, "assets", "github-stats.png"), card),
  writeFile(path.join(root, "README.md"), readme),
  writeFile(path.join(root, "dist", "README.md"), readme),
  writeFile(
    path.join(root, "dist", "snapshot.json"),
    `${JSON.stringify(
      {
        generatedAt,
        stats,
        repositories: listedRepositories
      },
      null,
      2
    )}\n`
  )
]);

console.log(`Generated the club introduction and supporting profile assets for ${config.username}.`);
