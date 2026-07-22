# klefner.github.io
Home index for all games

Live at https://klefner.github.io/ once GitHub Pages finishes its first deploy (Settings → Pages → Source: deploy from the `main` branch, root — this is the default for a repo named exactly `<username>.github.io`, no workflow needed).

## Adding a new game

Add one entry to the `GAMES` array in `games.js` (title, tagline, description, a screenshot in `assets/`, and the game's live URL) — the grid and everything else picks it up automatically. No other file needs to change.

## One-time giscus setup (comments)

The comment widgets on the page are placeholders until this is done once:

1. In this repo's **Settings → General → Features**, check **Discussions**.
2. Visit https://giscus.app, sign in, and point it at `klefner/klefner.github.io`. It'll ask you to install the giscus GitHub App on the repo if you haven't already — do that.
3. Giscus will generate a config snippet with your real `data-repo-id` and `data-category-id` values. Copy those two values into **both** `<script>` blocks in `index.html` (the ones with `src="https://giscus.app/client.js"`), replacing `REPLACE_WITH_REPO_ID` and `REPLACE_WITH_CATEGORY_ID`. Everything else (the two different `data-term` values, one per game) can stay as-is — that's what keeps Lumina's comments and Downtown Devour's comments in separate threads under the hood, even though the category is shared.
