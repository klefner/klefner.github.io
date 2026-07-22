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

// Comments are backed by giscus (GitHub Discussions) -- Discussions is
// enabled, the giscus app is installed, and these are the real IDs from
// giscus.app for this repo.
const GISCUS_CONFIG = {
  repo: 'klefner/klefner.github.io',
  repoId: 'R_kgDOTgWUww',
  category: 'General',
  categoryId: 'DIC_kwDOTgWUw84DBv2S',
};

function renderFeedbackWidgets() {
  const mounts = document.querySelectorAll('.giscus-mount');
  const configured = GISCUS_CONFIG.repoId && GISCUS_CONFIG.categoryId;

  mounts.forEach((mount) => {
    if (!configured) {
      mount.innerHTML = '<p class="giscus-placeholder">💬 Comments are being set up for this page — check back soon!</p>';
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', GISCUS_CONFIG.repo);
    script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
    script.setAttribute('data-category', GISCUS_CONFIG.category);
    script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', mount.dataset.term);
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'dark_dimmed');
    script.setAttribute('data-lang', 'en');
    script.crossOrigin = 'anonymous';
    script.async = true;
    mount.appendChild(script);
  });
}

renderGameGrid();
setupFeedbackTabs();
renderFeedbackWidgets();
