import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, "config", "profile.json"), "utf8"));
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

for (const line of [config.displayName, config.heading, config.motto]) {
  assert(readme.includes(line), `README is missing: ${line}`);
}

assert(readme === distReadme, "README.md and dist/README.md must be identical.");
assert(readme.includes("./assets/github-stats.png"), "README does not reference the generated pixel card.");
assert(readme.includes(`# ${config.heading}`), "README is missing the configured heading.");
assert(!readme.includes("这场 AI 革命"), "README still contains the removed manifesto line.");
assert(!readme.includes("AI 独立开发｜零一 AI 日新社 社长"), "README still contains the removed role line.");
assert(!("repositories" in snapshot), "Snapshot must not contain the removed project listing.");
for (const key of [
  "totalPRsMerged",
  "mergedPRsPercentage",
  "totalReviews",
  "totalDiscussionsStarted",
  "totalDiscussionsAnswered"
]) {
  assert(!(key in snapshot.stats), `Snapshot contains unsupported metric: ${key}`);
}
for (const key of ["brand", "featuredRepositories", "repositoryLimit", "refreshTimezone"]) {
  assert(!(key in config), `Config contains unused field: ${key}`);
}
assert(!readme.includes("PROJECTS / 代表项目"), "README still contains the removed projects section.");
assert(!readme.includes("<table>"), "README still contains the removed project table.");
assert(!readme.includes("BUILD IN PUBLIC"), "README still contains the removed English footer.");
assert(!readme.includes("自动更新于"), "README still contains the removed update timestamp.");
assert(!readme.includes("LuciNyan/pixel-profile"), "README still contains the removed pixel-profile attribution.");
assert(!readme.includes("01-ai-club-website"), "A private repository leaked into the profile README.");
assert(workflow.includes('cron: "17 1 * * *"'), "Workflow must run daily at 01:17 UTC.");
assert(
  deployGuide.includes("once per day at 09:17 Asia/Shanghai (01:17 UTC)"),
  "Deployment guide does not match the daily workflow schedule."
);
assert(deployGuide.includes("public-data estimate"), "Deployment guide must explain the rank data boundary.");

console.log("All profile checks passed.");
