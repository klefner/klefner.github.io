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

function setupFeedbackTabs() {
  const tabs = document.querySelectorAll('.feedback-tab');
  const panels = document.querySelectorAll('.feedback-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach((p) => { p.classList.remove('active'); p.hidden = true; });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(tab.dataset.target);
      panel.classList.add('active');
      panel.hidden = false;
    });
  });
}

renderGameGrid();
setupFeedbackTabs();
