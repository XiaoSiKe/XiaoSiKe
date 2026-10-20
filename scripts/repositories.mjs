const themes = {
  dark: { background: "#0d1117", border: "#30363d", text: "#9198a1", link: "#4493f8", green: "#3fb950" },
  light: { background: "#ffffff", border: "#d1d9e0", text: "#59636e", link: "#0969da", green: "#1a7f37" }
};

const languageColors = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572a5", Go: "#00add8", HTML: "#e34c26", Shell: "#89e051" };

function escape(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function textWidth(value, size) {
  return [...value].reduce((width, character) => width + (/[^\x00-\xff]/u.test(character) ? size : size * 0.56), 0);
}

// Wrap Chinese and long repository names as well as space-separated descriptions.
function wrap(value, width, size, limit) {
  const characters = [...value.replace(/\s+/g, " ").trim()];
  const lines = [];
  while (characters.length && lines.length < limit) {
    let line = characters.shift();
    while (characters.length && textWidth(line + characters[0], size) <= width) {
      line += characters.shift();
    }
    if (characters.length && /[a-z0-9]/i.test(characters[0])) {
      const breakAt = Math.max(line.lastIndexOf(" "), line.lastIndexOf("-"), line.lastIndexOf("/"));
      if (breakAt > line.length / 2) {
        characters.unshift(...line.slice(breakAt + 1));
        line = line.slice(0, breakAt + 1);
      }
    }
    lines.push(line.trim());
  }
  if (characters.length) lines[limit - 1] = `${[...lines[limit - 1]].slice(0, -2).join("")}…`;
  return lines;
}

export function selectRepositories(repositories, config) {
  return repositories
    .filter((repository) => repository.private === false && !config.excludeRepositories.includes(repository.name))
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at) || a.name.localeCompare(b.name))
    .slice(0, config.repositoryLimit);
}

function activitySvg(commits, x, y, width, height, color) {
  if (!Array.isArray(commits) || !commits.length) {
    return `<text x="${x + width}" y="${y + height / 2}" text-anchor="end" font-size="12">Activity unavailable</text>`;
  }
  const values = commits.slice(-52).map((count) => Math.max(0, Number(count) || 0));
  const maximum = Math.max(1, ...values);
  const points = values.map((count, index) => `${(x + (index / Math.max(1, values.length - 1)) * width).toFixed(1)},${(y + height - (count / maximum) * height).toFixed(1)}`).join(" ");
  return `<g><title>Weekly commits over the past year</title><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></g>`;
}

const icons = {
  star: '<path d="m8 1.5 2 4.2 4.6.7-3.3 3.3.8 4.6L8 12.1l-4.1 2.2.8-4.6L1.4 6.4l4.6-.7Z"/>',
  fork: '<circle cx="4" cy="3" r="1.7"/><circle cx="12" cy="3" r="1.7"/><circle cx="8" cy="13" r="1.7"/><path d="M4 5v2c0 2 4 1 4 4m4-6v2c0 2-4 1-4 4"/>',
  issue: '<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r=".9" fill="currentColor"/>',
  license: '<path d="M8 2v12m-4 0h8M2 5l6-2 6 2M3 5l-2 5h4Zm10 0-2 5h4Z"/>'
};

export function renderRepositorySvg(repository, { theme = "dark", compact = false } = {}) {
  const colors = themes[theme];
  const width = compact ? 480 : 896;
  const padding = compact ? 20 : 16;
  const titleSize = compact ? 19 : 16;
  const descriptionSize = compact ? 16 : 14;
  const textArea = compact ? width - padding * 2 : 658;
  const titleLines = wrap(repository.name, textArea - 64, titleSize, 3);
  const titleBottom = 32 + (titleLines.length - 1) * 25;
  const descriptionLines = wrap(repository.description, textArea, descriptionSize, compact ? 3 : 2);
  const descriptionTop = titleBottom + (compact ? 30 : 28);
  const metadataTop = descriptionTop + Math.max(1, descriptionLines.length) * (compact ? 23 : 20) + 16;
  const metadata = [
    ...(repository.language ? [{ language: repository.language, label: repository.language }] : []),
    { icon: "star", label: String(repository.stars) },
    ...(repository.license ? [{ icon: "license", label: repository.license }] : []),
    { icon: "fork", label: String(repository.forks) },
    { icon: "issue", label: String(repository.issues) }
  ];
  let metadataX = padding;
  let metadataY = metadataTop;
  const metadataSvg = metadata.map((item) => {
    const itemWidth = 22 + textWidth(item.label, compact ? 14 : 12) + 18;
    if (compact && metadataX + itemWidth > width - padding) {
      metadataX = padding;
      metadataY += 25;
    }
    const icon = item.language
      ? `<circle cx="7" cy="-4" r="5.5" fill="${languageColors[item.language] || colors.text}"/>`
      : `<g transform="translate(0,-12)" fill="none" stroke="currentColor" stroke-width="1.2">${icons[item.icon]}</g>`;
    const result = `<g transform="translate(${metadataX},${metadataY})">${icon}<text x="21" font-size="${compact ? 14 : 12}">${escape(item.label)}</text></g>`;
    metadataX += itemWidth;
    return result;
  }).join("");
  const date = new Date(repository.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const height = compact ? metadataY + 64 : Math.max(124, metadataY + 22);
  const badgeX = padding + textWidth(titleLines.at(-1), titleSize) + 12;
  const chartX = compact ? width - padding - 132 : width - padding - 152;
  const chartY = compact ? height - 49 : 42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escape(repository.name)} · Public</title>
  <desc id="description">${escape(repository.description)}. ${escape(repository.language || "")} · ${repository.stars} stars · ${repository.forks} forks · ${repository.issues} open issues and pull requests. Updated ${date}. ${repository.weeklyCommits ? "Weekly commit activity over the past year." : "Commit activity is unavailable."}</desc>
  <rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="6" fill="${colors.background}" stroke="${colors.border}"/>
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif" fill="${colors.text}" color="${colors.text}">
    ${titleLines.map((line, index) => `<text x="${padding}" y="${32 + index * 25}" fill="${colors.link}" font-size="${titleSize}" font-weight="600">${escape(line)}</text>`).join("")}
    <rect x="${badgeX}" y="${titleBottom - 14}" width="46" height="19" rx="9.5" fill="none" stroke="${colors.border}"/>
    <text x="${badgeX + 23}" y="${titleBottom}" text-anchor="middle" font-size="12">Public</text>
    ${descriptionLines.map((line, index) => `<text x="${padding}" y="${descriptionTop + index * (compact ? 23 : 20)}" font-size="${descriptionSize}">${escape(line)}</text>`).join("")}
    ${metadataSvg}
    <text x="${compact ? padding : metadataX}" y="${compact ? height - 24 : metadataY}" font-size="${compact ? 12 : 11}">Updated ${date}</text>
    ${activitySvg(repository.weeklyCommits, chartX, chartY, compact ? 132 : 152, compact ? 30 : 38, colors.green)}
  </g>
</svg>
`;
}
