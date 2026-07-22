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

// Comments are backed by giscus (GitHub Discussions), but giscus requires
// a one-time manual setup only the repo owner can do (enable Discussions,
// install the giscus app, then fill in the real repoId/categoryId below --
// see README.md). Until that's done, GISCUS_CONFIG stays unset and every
// mount point shows a friendly placeholder instead of giscus's own raw
// "not installed on this repo" error, which is what real playtesters were
// seeing here before this existed.
const GISCUS_CONFIG = {
  repo: 'klefner/klefner.github.io',
  repoId: null,     // fill in once giscus.app gives you the real value
  category: 'General',
  categoryId: null,  // fill in once giscus.app gives you the real value
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
