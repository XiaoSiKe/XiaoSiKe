# 01 AI Club profile visual system

## Direction

The interface is a GitHub profile introducing 零一 AI 日新社｜01 AI Club. Use GitHub's native typography, bold lead paragraphs, blockquotes, and the supplied black-and-white club poster. The profile is static, responsive, and readable in GitHub's native light and dark themes.

Design keywords: community, learning, public service, practice, content-first.

## Information hierarchy

1. Bilingual motto, two bold lines at GitHub's native H3 size (20 px): “从零到一，让技术进步成为每个人的机会！” and “From Zero to One, Turning Technology into Opportunity for Everyone！”.
2. Club identity, founding date, and the founder's introduction.
3. Founding purpose: a new approach to university learning, public-interest teaching, and practical progress.
4. Invitation: daily improvement, the supplied WeChat article, and the original club poster with its joining QR code.

## Tokens

- Typography, paragraph spacing, quote borders, and colors follow GitHub's native Markdown theme.
- Lead paragraphs and the supplied quote text stay bold as requested.
- Natural line wrapping supports narrow screens; the bilingual motto keeps its explicit line break.
- The poster uses `assets/01-ai-club.png`, with descriptive alternative text and its original resolution for QR-code clarity.

## Guardrails

- Preserve the user's wording, bilingual motto, quote grouping, emphasis, and joining link.
- Apply editing notes as formatting; omit parenthetical instructions and copied whitespace entities from the rendered text.
- Keep the poster in the repository so the profile remains independent of the temporary Feishu download URL.
- `config/introduction.md` is the body source; `config/profile.json` supplies the two motto lines.
- Supporting GitHub statistics and repository assets continue to be generated independently of the visible introduction.
