function renderGameGrid() {
  const grid = document.getElementById('game-grid');
  grid.innerHTML = GAMES.map((game) => `
    <a class="game-card" href="${game.url}" style="--accent: ${game.accent}">
      <div class="game-shot-wrap">
        <img class="game-shot" src="${game.screenshot}" alt="Screenshot of ${game.title}" loading="lazy" />
        <span class="beta-tag">BETA</span>
      </div>
      <div class="game-card-body">
        <h3 class="game-title">${game.title}</h3>
        <p class="game-tagline">${game.tagline}</p>
        <p class="game-desc">${game.description}</p>
        <span class="play-button">Play now →</span>
      </div>
    </a>
  `).join('');
}

// Feedback is a plain embedded Google Form (see FEEDBACK_FORM_EMBED_URL)
// rather than giscus/GitHub Discussions -- playtesters shouldn't need a
// GitHub account just to leave a comment. The form itself asks which game
// the feedback is about, so there's only one embed to maintain instead of
// a per-game mount point. Responses land in a Google Sheet and email the
// form owner directly; nothing here is public.
const FEEDBACK_FORM_EMBED_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeHQnFBg76Bxkbz7tLZaKZ5LP_1dXWpTAJZTbJnqyj5eMNVvQ/viewform?embedded=true';

function renderFeedbackForm() {
  const mount = document.getElementById('feedback-form-mount');
  const iframe = document.createElement('iframe');
  iframe.src = FEEDBACK_FORM_EMBED_URL;
  iframe.title = 'Beta Arcade feedback form';
  iframe.loading = 'lazy';
  mount.appendChild(iframe);
}

renderGameGrid();
renderFeedbackForm();
