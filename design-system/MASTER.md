# 01 AI Club profile visual system

## Direction

The interface is a GitHub profile introducing 零一 AI 日新社｜01 AI ClUB. Use GitHub's native typography, a numbered list, bold lead paragraphs, and blockquotes. The profile is static, responsive, and readable in GitHub's native light and dark themes.

Design keywords: community, learning, public service, practice, content-first.

## Information hierarchy

1. Bilingual motto, two bold lines at GitHub's native H3 size (20 px): “从零到一，让技术进步成为每个人的机会！” and “From Zero to One, Turning Technology into Opportunity for Everyone！”.
2. Club identity, founding date, the founder's introduction, and links to 启航导师、领军团队、领航先锋.
3. Founding purpose and a new approach to university learning through practice.
4. Invitation with links to join the club and read the recruitment plan.
5. The original pixel-profile statistics card.
6. Eight recently updated public repositories in a vertical list inspired by GitHub's repository rows, with blue names, muted metadata, thin borders, and real green weekly commit sparklines.

## Tokens

- Typography, paragraph spacing, quote borders, and colors follow GitHub's native Markdown theme.
- Lead paragraphs and the supplied quote text stay bold as requested.
- Natural line wrapping supports narrow screens; the bilingual motto keeps its explicit line break.
- The statistics card uses the original cyan-to-blue CRT palette. Repository rows use GitHub's light and dark colors with green activity curves.
- Repository picture sources select desktop or mobile variants and the matching light or dark theme. Each row links to its repository.

## Guardrails

- Preserve the user's wording, bilingual motto, quote grouping, emphasis, and joining link.
- Apply editing notes as formatting; omit parenthetical instructions and copied whitespace entities from the rendered text.
- `config/introduction.md` is the body source; `config/profile.json` supplies the two motto lines.
- The complete visible profile includes the introduction, statistics card, and vertical repository list in that order.
