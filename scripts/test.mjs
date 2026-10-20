import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { renderRepositorySvg, selectRepositories } from "./repositories.mjs";

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, "config", "profile.json"), "utf8"));
const introduction = await readFile(path.join(root, "config", "introduction.md"), "utf8");
const clubPoster = await readFile(path.join(root, "assets", "01-ai-club.png"));
const readme = await readFile(path.join(root, "README.md"), "utf8");
const distReadme = await readFile(path.join(root, "dist", "README.md"), "utf8");
const card = await readFile(path.join(root, "assets", "github-stats.png"));
const snapshot = JSON.parse(await readFile(path.join(root, "dist", "snapshot.json"), "utf8"));
const workflow = await readFile(path.join(root, ".github", "workflows", "update-profile.yml"), "utf8");
const deployGuide = await readFile(path.join(root, "docs", "DEPLOY.md"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
assert(card.subarray(0, 8).equals(pngSignature), "The generated stats card is not a valid PNG.");
assert(card.readUInt32BE(16) === 1226, "The pixel-profile card must be 1226 px wide.");
assert(card.readUInt32BE(20) === 430, "The pixel-profile card must be 430 px high.");
assert(card.length > 50_000, "The generated stats card is unexpectedly small.");

for (const line of [config.motto, config.mottoEnglish]) {
  assert(readme.includes(line), `README is missing: ${line}`);
}

assert(readme === distReadme, "README.md and dist/README.md must be identical.");
assert(readme.includes(introduction.trim()), "README must preserve the complete club introduction.");
assert(clubPoster.subarray(0, 8).equals(pngSignature), "The club poster is not a valid PNG.");
assert(readme.includes("./assets/01-ai-club.png"), "README must reference the local club poster.");
assert(!readme.includes("feishu.cn"), "README must not depend on the temporary Feishu image link.");
assert(!readme.includes("这句话加粗") && !readme.includes("&#x20;"), "Editing instructions and pasted whitespace entities must not appear in the profile.");
assert(!readme.includes("Hi, I'm") && !readme.includes("./assets/github-stats.png") && !readme.includes("### Repositories"), "The club introduction must replace the previous profile content.");
assert(!readme.includes("这场 AI 革命"), "README still contains the removed manifesto line.");
assert(!readme.includes("AI 独立开发｜零一 AI 日新社 社长"), "README still contains the removed role line.");
assert(readme.includes(`<strong>${config.motto}</strong>`), "The Chinese motto must be bold.");
assert(readme.includes(`<strong>${config.mottoEnglish}</strong>`), "The English motto must be bold.");
assert(!readme.includes("以 AI 为引擎"), "README still contains the old motto.");
assert(Number.isInteger(config.repositoryLimit) && config.repositoryLimit > 0, "Repository limit must be a positive integer.");
assert(snapshot.repositories.length > 0 && snapshot.repositories.length <= config.repositoryLimit, "Generated repository count is invalid.");
for (const [index, repository] of snapshot.repositories.entries()) {
  assert(!config.excludeRepositories.includes(repository.name), "An excluded repository appears in the list.");
  assert(repository.url === `https://github.com/${config.username}/${repository.name}`, "Repository link is invalid.");
  assert(repository.weeklyCommits === null || repository.weeklyCommits.every((count) => Number.isFinite(count) && count >= 0), "Commit activity contains invalid values.");
  for (const theme of ["dark", "light"]) {
    for (const suffix of ["", "-mobile"]) {
      const asset = `./assets/repositories/${index + 1}-${theme}${suffix}.svg`;
      const svg = await readFile(path.join(root, asset), "utf8");
      assert(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), `Invalid SVG: ${asset}`);
      assert(svg.includes('aria-labelledby="title description"'), `SVG is missing accessible labels: ${asset}`);
    }
  }
}

const fixture = (name, privateValue, updatedAt) => ({ name, private: privateValue, updated_at: updatedAt });
const selected = selectRepositories([
  fixture("private-fixture", true, "2026-10-20"),
  fixture("excluded-fixture", false, "2026-10-19"),
  fixture("old-public", false, "2026-10-01"),
  fixture("latest-public", false, "2026-10-18"),
  fixture("middle-public", false, "2026-10-10")
], { excludeRepositories: ["excluded-fixture"], repositoryLimit: 2 });
assert(selected.map((repository) => repository.name).join(",") === "latest-public,middle-public", "Repository selection must exclude private repositories, respect exclusions, sort by update, and apply the limit.");
const svgFixture = { ...snapshot.repositories[0], name: 'long-repository-name-'.repeat(4), description: '<script>alert("test")</script> & 中文简介'.repeat(8), weeklyCommits: null };
const mobileSvg = renderRepositorySvg(svgFixture, { compact: true });
assert(!mobileSvg.includes("<script>"), "Repository content must be XML-escaped.");
assert(mobileSvg.includes("&lt;script&gt;"), "Escaped descriptions must remain readable.");
assert(mobileSvg.includes("Activity unavailable"), "Missing activity must not become a fabricated sparkline.");
assert(!mobileSvg.includes("<polyline"), "Missing activity must not draw a sparkline.");
const zeroActivity = renderRepositorySvg({ ...svgFixture, weeklyCommits: Array(52).fill(0) });
assert(zeroActivity.includes("<polyline") && !zeroActivity.includes("NaN"), "Zero commits must render a valid flat sparkline.");
for (const key of [
  "totalPRsMerged",
  "mergedPRsPercentage",
  "totalReviews",
  "totalDiscussionsStarted",
  "totalDiscussionsAnswered"
]) {
  assert(!(key in snapshot.stats), `Snapshot contains unsupported metric: ${key}`);
}
for (const key of ["brand", "featuredRepositories", "refreshTimezone"]) {
  assert(!(key in config), `Config contains unused field: ${key}`);
}
assert(!readme.includes("PROJECTS / 代表项目"), "README still contains the removed projects section.");
assert(!readme.includes("<table>"), "README still contains the removed project table.");
assert(!readme.includes("BUILD IN PUBLIC"), "README still contains the removed English footer.");
assert(!readme.includes("自动更新于"), "README still contains the removed update timestamp.");
assert(!readme.includes("LuciNyan/pixel-profile"), "README still contains the removed pixel-profile attribution.");
assert(workflow.includes('cron: "17 1 * * *"'), "Workflow must run daily at 01:17 UTC.");
assert(
  deployGuide.includes("once per day at 09:17 Asia/Shanghai (01:17 UTC)"),
  "Deployment guide does not match the daily workflow schedule."
);
assert(deployGuide.includes("public-data estimate"), "Deployment guide must explain the rank data boundary.");

console.log("All profile checks passed.");
