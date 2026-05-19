// ── APP.JS — Orquestrador principal ───────────────────────────────────────────
// Inicializa tudo, registra views e expõe funções globais para o HTML.

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadFromServer().then(renderLoginUsers);

  document.getElementById('login-name')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

  // Registra renderers para cada view
  registerView('minha-classificacao', renderGroups);
  registerView('meu-chaveamento',     renderChaveamento);
  registerView('comparar',            renderCompare);
  registerView('classificacao',       renderClassificacao);
  registerView('chaveamento',         renderChaveamento);
});

// ── Render pós-login ──────────────────────────────────────────────────────────

function renderApp() {
  const user     = getCurrentUser();
  const initials = user.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  document.getElementById('user-badge').innerHTML =
    `<div class="avatar">${initials}</div><span>${escHtml(user)}</span>`;

  // Reset navegação
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-view="meus-palpites"]')?.classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-meus-palpites')?.classList.add('active');
  setCurrentView('meus-palpites');
}

// ── Helpers globais chamados pelo HTML ────────────────────────────────────────
// (precisam ser globais pois são chamados via atributos onclick no markup)

window.login        = login;
window.logout       = logout;
window.loginChip    = loginChip;
window.toggleTheme  = toggleTheme;
window.setView      = setView;
window.saveAll      = saveAll;
window.saveBracket  = saveBracket;

// Score handlers (chamados pelos inputs gerados dinamicamente)
window.onScoreChange        = onScoreChange;
window.onOfficialScore      = onOfficialScore;
window.onBracketScore       = onBracketScore;
window.onBracketAwayOverride = onBracketAwayOverride;
