# klefner.github.io
Home index for all games

Live at https://klefner.github.io/ once GitHub Pages finishes its first deploy (Settings → Pages → Source: deploy from the `main` branch, root — this is the default for a repo named exactly `<username>.github.io`, no workflow needed).

## Adding a new game

Add one entry to the `GAMES` array in `games.js` (title, tagline, description, a screenshot in `assets/`, and the game's live URL) — the grid and everything else picks it up automatically. No other file needs to change.

## Feedback form

Feedback is a plain embedded Google Form, not a public comment thread — playtesters shouldn't need a GitHub
account just to leave feedback. The embed URL lives in `FEEDBACK_FORM_EMBED_URL` in `main.js`. The form itself
asks which game the feedback is about, so there's one form (and one Sheet) covering every game, rather than a
separate widget per game.

To point it at a different form (or add a field), edit the form itself in Google Forms, then update
`FEEDBACK_FORM_EMBED_URL` only if the form's ID changes — grab it from **Send → embed (`<>`) → the URL inside
`src="..."`**.
