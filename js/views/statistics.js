// ── VIEW: COMPARAR CLASSIFICAÇÃO ─────────────────────────────────────────────

async function renderEstatisticas() {
  await loadFromServer();
  renderLoginUsers();

  const container = document.getElementById('estatisticas-content');
  if (!container) return;

  const users = getAllUsers();
  const names = Object.keys(users);
    container.innerHTML = html;
}