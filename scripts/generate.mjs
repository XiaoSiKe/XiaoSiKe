import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fetchStats, renderStats } from "pixel-profile";

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, "config", "profile.json"), "utf8"));
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || process.env.PAT_1 || "";

if (!token) {
  throw new Error("A GitHub token is required. Set GH_TOKEN or GITHUB_TOKEN before generating the profile.");
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": "xiaosike-github-profile",
  "X-GitHub-Api-Version": "2022-11-28"
};

async function github(pathname) {
  const response = await fetch(`https://api.github.com${pathname}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 240)}`);
  }
  return response.json();
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
const repositories = await getPublicRepositories(config.username);
const selectedRepositories = selectRepositories(repositories);
const stats = await fetchStats(
  config.username,
  false,
  config.excludeRepositories,
  false,
  false,
  false,
  token
);
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
