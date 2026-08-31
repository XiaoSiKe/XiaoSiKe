import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, "config", "profile.json"), "utf8"));
const readme = await readFile(path.join(root, "README.md"), "utf8");
const card = await readFile(path.join(root, "assets", "github-stats.png"));
const snapshot = JSON.parse(await readFile(path.join(root, "dist", "snapshot.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
assert(card.subarray(0, 8).equals(pngSignature), "The generated stats card is not a valid PNG.");
assert(card.readUInt32BE(16) === 1226, "The pixel-profile card must be 1226 px wide.");
assert(card.readUInt32BE(20) === 430, "The pixel-profile card must be 430 px high.");
assert(card.length > 50_000, "The generated stats card is unexpectedly small.");

for (const line of [config.displayName, config.headline, config.motto, config.role]) {
  assert(readme.includes(line), `README is missing: ${line}`);
}

assert(readme.includes("./assets/github-stats.png"), "README does not reference the generated pixel card.");
assert(readme.includes("LuciNyan/pixel-profile"), "README must attribute the upstream MIT project.");
assert(snapshot.repositories.every((repository) => repository.private === false), "Snapshot contains private repository data.");
assert(!readme.includes("01-ai-club-website"), "A private repository leaked into the profile README.");

console.log("All profile checks passed.");
