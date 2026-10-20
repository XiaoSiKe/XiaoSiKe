# pixel-profile visual system

## Direction

The interface is a GitHub profile, so the design is content-first, static, responsive, and readable in GitHub's native light and dark themes. Its signature is the original `pixel-profile` CRT card with a pixelated avatar and live GitHub statistics.

Design keywords: minimal, editorial, premium, CRT, pixel art, content-first.

## Information hierarchy

1. Greeting: “Hi, I'm 01Yang 👋” — GitHub-native H1 with its built-in divider.
2. Working philosophy, two bold lines: “从零到一，让技术进步成为每个人的机会！” and “From Zero to One, Turning Technology into Opportunity for Everyone！”.
3. Live proof: stars, commits, PRs, issues, contributed repositories, and rank.
4. Repositories: eight recently updated public repositories in a vertical list inspired by GitHub's native repository rows, with blue names, muted metadata, thin borders, and green weekly commit sparklines.

## Tokens

- Spacing follows an 8 px rhythm.
- Corner radii: 20–28 px for the large identity surface; 4 px for pixel details.
- Dark background `#0D1117`; primary text `#F0F6FC`; secondary text `#B7C0CC`.
- Light background `#FFFFFF`; primary text `#1F2328`; secondary text `#59636E`.
- The statistics card uses the reference cyan-to-blue gradient `#2aeeff → #5580eb` with the original curved-screen shader.
- Repository rows use 6 px corners, GitHub blue `#4493F8` / `#0969DA`, and activity green `#3FB950` / `#1A7F37` in dark / light mode.
- Each repository links to its source. Picture sources select light or dark assets and a taller mobile layout below 768 px, with wrapping for long names and Chinese descriptions.
- Typography uses the system sans stack for Chinese clarity and the system monospace stack for labels and data.

## Guardrails

- Keep the gradient inside the statistics card; the surrounding README stays visually quiet.
- The wave emoji is the single explicit decorative identity mark; it is not used as a structural control.
- No badge wall, typing animation, visitor counter, or dense skill-logo collection.
- Do not expose private repositories or private contribution details.
- Keep primary and secondary text at WCAG AA contrast in both themes.
- Motion is intentionally omitted because the README is a static identity surface.
- The card includes meaningful alternative text because the reference CRT palette prioritizes fidelity over text contrast.
- The bilingual philosophy sits beneath the native H1. The repository list follows the statistics card and ends with a link to the complete GitHub repository tab.
- Sparklines only render real public weekly commit counts; an unavailable response gets an explicit text state. Repository cards provide accessible titles, descriptions, and image alternative text.
