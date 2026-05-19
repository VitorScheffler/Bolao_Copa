// ── AUTH ──────────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'COPA2026';

/**
 * Tenta fazer login com o nome digitado.
 */
async function login() {
  const nameEl = document.getElementById('login-name');
  const errEl  = document.getElementById('login-error');
  const name   = nameEl.value.trim();

  if (!name) {
    showError(errEl, 'Por favor, informe seu nome.');
    return;
  }

  if (name === 'OFICIAL') {
    const senha = prompt('Digite a senha do administrador:');
    if (senha !== ADMIN_PASSWORD) {
      showError(errEl, 'Senha inválida.');
      return;
    }
  }

  await loadFromServer();

  ensureUser(name);
  setCurrentUser(name);

  errEl.style.display = 'none';
  nameEl.value = '';

  await saveToServer();

  showScreen('main');
  renderApp();

  if (!isCupStarted()) showCountdownModal();
}

/**
 * Encerra a sessão do usuário atual.
 */
async function logout() {
  setCurrentUser(null);
  showScreen('login');
  await loadFromServer();
  renderLoginUsers();
}

/**
 * Clique em chip de usuário existente.
 * @param {string} name
 */
function loginChip(name) {
  document.getElementById('login-name').value = name;
  login();
}

function showError(el, msg) {
  el.textContent    = msg;
  el.style.display  = 'block';
}

// ── RENDER: LISTA DE USUÁRIOS NA TELA DE LOGIN ────────────────────────────────

function renderLoginUsers() {
  const names     = Object.keys(getAllUsers()).filter(n => n !== 'OFICIAL');
  const container = document.getElementById('login-users-list');
  if (!container) return;

  if (!names.length) { container.innerHTML = ''; return; }

  const chips = names.map(n => {
    const initials = n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `<div class="user-chip" onclick="loginChip('${escHtml(n)}')">
      <div class="user-avatar">${initials}</div>
      ${escHtml(n)}
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="login-users-title">Participantes cadastrados</div>
    <div class="user-list">${chips}</div>`;
}

function showCountdownModal() {
  const overlay = document.createElement('div');
  overlay.id = 'countdown-overlay';

  const pad = n => String(n).padStart(2, '0');

  overlay.innerHTML = `
    <div class="cd-modal">
      <div class="contagem">
        <div class="contagem-item"><span id="m-dias">--</span><small>Dias</small></div>
        <div class="contagem-item"><span id="m-horas">--</span><small>Horas</small></div>
        <div class="contagem-item"><span id="m-min">--</span><small>Min</small></div>
        <div class="contagem-item"><span id="m-seg">--</span><small>Seg</small></div>
      </div>

      <h2 class="cd-title">A Copa está chegando!</h2>

      <p class="cd-sub">
        Faltam <strong id="m-text">--</strong> para o primeiro jogo.
      </p>

       <div class="cd-warn">
        ⚠️ Participantes sem palpites completos serão
        <strong>desclassificados</strong> do bolão.
        Preencha todos os 72 jogos antes de 11/06/2026.
      </div>

      <button class="btn btn-primary btn-full"
        onclick="document.getElementById('countdown-overlay').remove()">
        Entendido, vou preencher!
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  function update() {
    const t = window.getCupCountdown();
    if (!t) return;

    document.getElementById('m-dias').textContent = t.dias;
    document.getElementById('m-horas').textContent = pad(t.horas);
    document.getElementById('m-min').textContent = pad(t.min);
    document.getElementById('m-seg').textContent = pad(t.seg);

    document.getElementById('m-text').innerHTML =
      `${t.dias} dia${t.dias !== 1 ? 's' : ''}`;
  }

  update();
  const interval = setInterval(update, 1000);

  // limpa o intervalo quando fechar modal
  overlay.querySelector('button').addEventListener('click', () => {
    clearInterval(interval);
    overlay.remove();
  });
}