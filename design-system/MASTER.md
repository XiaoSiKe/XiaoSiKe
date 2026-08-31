# pixel-profile visual system

## Direction

The interface is a GitHub profile, so the design is content-first, static, responsive, and readable in GitHub's native light and dark themes. Its signature is the original `pixel-profile` CRT card with a pixelated avatar and live GitHub statistics.

Design keywords: minimal, editorial, premium, CRT, pixel art, content-first.

## Information hierarchy

1. Manifesto: “这场 AI 革命，没有人能够置身事外！”
2. Working philosophy: “以 AI 为引擎，于 零一 之间探索，在 日新 之中迭代！”
3. Identity: “AI 独立开发｜实践分享｜零一 AI 日新社 社长”
4. Live proof: stars, commits, PRs, issues, contributed repositories, and rank.
5. Selected work: project description and direct repository link.

## Tokens

- Spacing follows an 8 px rhythm.
- Corner radii: 20–28 px for the large identity surface; 4 px for pixel details.
- Dark background `#0D1117`; primary text `#F0F6FC`; secondary text `#B7C0CC`.
- Light background `#FFFFFF`; primary text `#1F2328`; secondary text `#59636E`.
- The statistics card uses the reference cyan-to-blue gradient `#2aeeff → #5580eb` with the original curved-screen shader.
- Typography uses the system sans stack for Chinese clarity and the system monospace stack for labels and data.

## Guardrails

- Keep the gradient inside the statistics card; the surrounding README stays visually quiet.
- No emoji as structural icons.
- No badge wall, typing animation, visitor counter, or dense skill-logo collection.
- Do not expose private repositories or private contribution details.
- Keep primary and secondary text at WCAG AA contrast in both themes.
- Motion is intentionally omitted because the README is a static identity surface.
- The card includes meaningful alternative text because the reference CRT palette prioritizes fidelity over text contrast.
