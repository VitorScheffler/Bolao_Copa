// ── ESTADO DA APLICAÇÃO ───────────────────────────────────────────────────────

let currentUser = null;
let allUsers = {};      // { nome: { palpites: {...} } }
let currentView = 'meus-palpites';

const CUP_START = new Date('2026-06-11T00:00:00');

// ── INICIALIZAÇÃO ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadFromServer();
  initTheme();

  document.getElementById('login-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
});

// ── TEMA (DARK MODE) ──────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('bolao_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  applyTheme(isDark);
}

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = dark ? '☀️' : '🌙';
  localStorage.setItem('bolao_theme', dark ? 'dark' : 'light');
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
}

// ── PERSISTÊNCIA (servidor via PHP) ──────────────────────────────────────────

async function loadFromServer() {
  try {
    const res = await fetch('api/load.php');
    const data = await res.json();
    if (data && data.users) {
      allUsers = data.users;
    }
  } catch (e) {
    const saved = localStorage.getItem('bolao_data');
    if (saved) allUsers = JSON.parse(saved);
  }
  renderLoginUsers();
}

async function saveToServer() {
  const payload = {
    userName: currentUser,
    userData: allUsers[currentUser]
  };

  try {
    await fetch('api/save.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    localStorage.setItem('bolao_data', JSON.stringify(allUsers));
  }
  localStorage.setItem('bolao_data', JSON.stringify(allUsers));
}

// ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────────

function login() {
  const nameEl = document.getElementById('login-name');
  const errEl  = document.getElementById('login-error');
  const name   = nameEl.value.trim();

  if (!name) {
    showError(errEl, 'Por favor, informe seu nome.');
    return;
  }

  loadFromServer().then(() => {
    if (!allUsers[name]) {
      allUsers[name] = { palpites: createEmptyPalpites() };
    }

    currentUser = name;
    errEl.style.display = 'none';
    nameEl.value = '';

    saveToServer();

    showScreen('main');
    renderApp();

    if (new Date() < CUP_START) {
      showCountdownModal();
    }
  });
}

function logout() {
  currentUser = null;
  showScreen('login');
  loadFromServer();
}

function loginChip(name) {
  document.getElementById('login-name').value = name;
  login();
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

// ── NAVEGAÇÃO ─────────────────────────────────────────────────────────────────

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

function setView(name, btn) {
  currentView = name;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  if (name === 'comparar') renderCompare();
  if (name === 'chaveamento')  renderChaveamento();
}

// ── RENDER: LOGIN ─────────────────────────────────────────────────────────────

function renderLoginUsers() {
  const names = Object.keys(allUsers);
  const container = document.getElementById('login-users-list');
  if (!names.length) { container.innerHTML = ''; return; }

  let html = '<div class="login-users-title" style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Participantes cadastrados</div>';
  html += '<div class="user-list">';
  for (const n of names) {
    const initials = n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    html += `<div class="user-chip" onclick="loginChip('${escHtml(n)}')">
      <div class="user-avatar">${initials}</div>
      ${escHtml(n)}
    </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

// ── RENDER: APP PRINCIPAL ─────────────────────────────────────────────────────

function renderApp() {
  const initials = currentUser.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  document.getElementById('user-badge').innerHTML =
    `<div class="avatar">${initials}</div> <span>${escHtml(currentUser)}</span>`;

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-view="meus-palpites"]').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-meus-palpites').classList.add('active');
  currentView = 'meus-palpites';

  renderGroups();
}

// ── RENDER: GRUPOS ────────────────────────────────────────────────────────────

function renderGroups() {
  const cupStarted = new Date() >= CUP_START;
  const grid = document.getElementById('groups-grid');
  const user = allUsers[currentUser];
  const { filled, total } = countFilled(user.palpites);

  document.getElementById('progress-label').textContent =
    `${filled} / ${total} jogos preenchidos`;

  // Esconde botão salvar se copa já começou
  const saveBtn = document.querySelector('.view-actions .btn-primary');
  if (saveBtn) saveBtn.style.display = cupStarted ? 'none' : '';

  // Banner de copa iniciada
  let bannerHtml = '';
  if (cupStarted) {
    bannerHtml = `<div class="cup-started-banner">
      🏆 A Copa do Mundo já começou! Os palpites estão bloqueados.
    </div>`;
  }

  let html = bannerHtml;

  for (const [g, data] of Object.entries(GROUPS)) {
    html += buildGroupCard(g, data.teams, user.palpites[g], cupStarted);
  }
  html += '</div>';
  grid.innerHTML = html;
}

function buildGroupCard(g, teams, matches, cupStarted) {
  const standings = calcStandings(matches, teams);

  let html = `<div class="group-card" id="card-${g}">`;

  html += `<div class="group-card-header">
    <div class="group-badge">${g}</div>
    <h3>Grupo ${g}</h3>
  </div>`;

  html += `<div class="standings-wrap"><table class="standings-table">
    <thead><tr>
      <th>Seleção</th>
      <th title="Pontos">Pts</th>
      <th title="Jogos">J</th>
      <th title="Vitórias">V</th>
      <th title="Empates">E</th>
      <th title="Derrotas">D</th>
      <th title="Gols Marcados">GM</th>
      <th title="Gols Sofridos">GS</th>
      <th title="Saldo de Gols">SG</th>
    </tr></thead><tbody>`;

  standings.forEach((t, i) => {
    const rc = i === 0 ? 'q1' : i === 1 ? 'q2' : '';
    const sg = t.gm - t.gs;
    html += `<tr class="${rc}">
      <td><div class="team-cell">
        <span class="rank">${i + 1}</span>
        <span class="team-name">${escHtml(t.name)}</span>
      </div></td>
      <td class="pts">${t.pts}</td>
      <td>${t.pj}</td>
      <td>${t.v}</td>
      <td>${t.e}</td>
      <td>${t.d}</td>
      <td>${t.gm}</td>
      <td>${t.gs}</td>
      <td>${sg >= 0 ? '+' + sg : sg}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';

  html += `<div class="matches-section">
    <div class="matches-section-label">Jogos</div>`;

  matches.forEach((m, mi) => {
    const hVal = m.homeGoals !== '' ? m.homeGoals : '';
    const aVal = m.awayGoals !== '' ? m.awayGoals : '';
    const disabledAttr = cupStarted ? 'disabled' : '';
    const changeHandlers = cupStarted ? '' :
      `onchange="updateScore('${g}',${mi},'home',this.value)" oninput="updateScore('${g}',${mi},'home',this.value)"`;
    const changeHandlersAway = cupStarted ? '' :
      `onchange="updateScore('${g}',${mi},'away',this.value)" oninput="updateScore('${g}',${mi},'away',this.value)"`;

    html += `<div class="match-row">
      <span class="match-home">${escHtml(m.home)}</span>
      <div class="score-box">
        <input class="score-input" type="number" min="0" max="99"
          value="${hVal}" placeholder="–" ${disabledAttr} ${changeHandlers}>
        <span class="score-sep">×</span>
        <input class="score-input" type="number" min="0" max="99"
          value="${aVal}" placeholder="–" ${disabledAttr} ${changeHandlersAway}>
      </div>
      <span class="match-away">${escHtml(m.away)}</span>
    </div>`;
  });

  html += '</div></div>';
  return html;
}

// ── UPDATE DE PLACAR ──────────────────────────────────────────────────────────

function updateScore(g, mi, side, val) {
  if (new Date() >= CUP_START) return;

  const user  = allUsers[currentUser];
  const match = user.palpites[g][mi];

  if (side === 'home') match.homeGoals = val === '' ? '' : String(parseInt(val) || 0);
  else                 match.awayGoals = val === '' ? '' : String(parseInt(val) || 0);

  updateGroupStandings(g);

  const { filled, total } = countFilled(user.palpites);
  document.getElementById('progress-label').textContent =
    `${filled} / ${total} jogos preenchidos`;
}

function updateGroupStandings(g) {
  const user      = allUsers[currentUser];
  const matches   = user.palpites[g];
  const teams     = GROUPS[g].teams;
  const standings = calcStandings(matches, teams);

  const table = document.querySelector(`#card-${g} .standings-table tbody`);
  if (!table) return;

  const rows = table.querySelectorAll('tr');
  standings.forEach((t, i) => {
    const row = rows[i];
    if (!row) return;
    const sg = t.gm - t.gs;
    row.className = i === 0 ? 'q1' : i === 1 ? 'q2' : '';
    const cells = row.querySelectorAll('td');
    cells[0].innerHTML = `<div class="team-cell">
      <span class="rank">${i + 1}</span>
      <span class="team-name">${escHtml(t.name)}</span>
    </div>`;
    cells[1].textContent = t.pts;
    cells[2].textContent = t.pj;
    cells[3].textContent = t.v;
    cells[4].textContent = t.e;
    cells[5].textContent = t.d;
    cells[6].textContent = t.gm;
    cells[7].textContent = t.gs;
    cells[8].textContent = (sg >= 0 ? '+' : '') + sg;
  });
}

// ── SALVAR ────────────────────────────────────────────────────────────────────

async function saveAll() {
  if (new Date() >= CUP_START) return;
  await saveToServer();
  showToast('Palpites salvos com sucesso!');
}

// ── MODAL CONTAGEM REGRESSIVA ─────────────────────────────────────────────────

function showCountdownModal() {
  const agora = new Date();
  const diffMs = CUP_START - agora;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const hours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) /
    (1000 * 60 * 60)
  );

  const minutes = Math.floor(
    (diffMs % (1000 * 60 * 60)) /
    (1000 * 60)
  );

  const seconds = Math.floor(
    (diffMs % (1000 * 60)) / 1000
  );

  const overlay = document.createElement('div');

  overlay.id = 'countdown-overlay';

  overlay.innerHTML = `
    <div class="cd-modal">

      <div class="contagem">

        <div class="contagem-item">
          <span>${days}</span>
          <small>Dias</small>
        </div>

        <div class="contagem-item">
          <span>${String(hours).padStart(2, '0')}</span>
          <small>Horas</small>
        </div>

        <div class="contagem-item">
          <span>${String(minutes).padStart(2, '0')}</span>
          <small>Minutos</small>
        </div>

        <div class="contagem-item">
          <span>${String(seconds).padStart(2, '0')}</span>
          <small>Segundos</small>
        </div>

      </div>

      <h2 class="cd-title">
        A Copa está chegando! ⚽
      </h2>

      <p class="cd-sub">
        Faltam
        <strong>
          ${days} dia${days !== 1 ? 's' : ''}
        </strong>
        para a Copa do Mundo.
        <br>
        Não deixe para a última hora!
      </p>

      <div class="cd-warn">
        ⚠️ Participantes sem palpites completos serão
        <strong>desclassificados</strong>
        do bolão. Preencha todos os 72 jogos antes do início da competição.
      </div>

      <button
        class="btn btn-primary btn-full"
        onclick="document.getElementById('countdown-overlay').remove()"
      >
        Entendido, vou preencher!
      </button>

    </div>
  `;

  document.body.appendChild(overlay);
}

// ── RENDER: COMPARAR ──────────────────────────────────────────────────────────

function renderCompare() {
  loadFromServer().then(() => {
    const names     = Object.keys(allUsers);
    const container = document.getElementById('compare-content');

    if (names.length < 2) {
      container.innerHTML = `<div class="empty-state">
        <p>Adicione pelo menos 2 participantes para comparar palpites.</p>
      </div>`;
      return;
    }

    let html = '';

    for (const [g, data] of Object.entries(GROUPS)) {
      html += `<div class="compare-group-block">
        <div class="compare-group-divider">
          <div class="compare-group-title">
            <div class="compare-badge">${g}</div>
            Grupo ${g}
          </div>
        </div>
        <div class="compare-standings-row">`;

      for (const name of names) {
        const matches   = allUsers[name].palpites[g];
        const standings = calcStandings(matches, data.teams);

        html += `<div class="compare-user-block">
          <div class="compare-user-name">${escHtml(name)}</div>
          <table class="standings-table">
            <thead><tr>
              <th>Seleção</th>
              <th title="Pontos">Pts</th>
              <th title="Jogos">J</th>
              <th title="Vitórias">V</th>
              <th title="Empates">E</th>
              <th title="Derrotas">D</th>
              <th title="Gols Marcados">GM</th>
              <th title="Gols Sofridos">GS</th>
              <th title="Saldo de Gols">SG</th>
            </tr></thead><tbody>`;

        standings.forEach((t, i) => {
          const rc = i === 0 ? 'q1' : i === 1 ? 'q2' : '';
          const sg = t.gm - t.gs;
          html += `<tr class="${rc}">
            <td><div class="team-cell">
              <span class="rank">${i + 1}</span>
              <span class="team-name">${escHtml(t.name)}</span>
            </div></td>
            <td class="pts">${t.pts}</td>
            <td>${t.pj}</td>
            <td>${t.v}</td>
            <td>${t.e}</td>
            <td>${t.d}</td>
            <td>${t.gm}</td>
            <td>${t.gs}</td>
            <td>${sg >= 0 ? '+' + sg : sg}</td>
          </tr>`;
        });

        html += `</tbody></table></div>`;
      }

      html += `</div></div>`;
    }

    container.innerHTML = html;
  });
}

function renderChaveamento() {
  loadFromServer().then(() => {
    const user = allUsers[currentUser];
    const oficial = allUsers['OFICIAL'];

    if (!oficial) {
      document.getElementById('chaveamento-content').innerHTML = `
        <div class="empty-state">
          <p>Os resultados ainda não foram inseridos.</p>
        </div>
      `;
      return;
    }

    const jogos = resolveChaveamento(
      oficial.palpites,
      user.chaveamento
    );

    if (!user.chaveamento) {
      user.chaveamento = jogos;
    }

    const fases = {
      '16avos': jogos.slice(0, 16),
      'oitavas': jogos.slice(16, 24),
      'quartas': jogos.slice(24, 28),
      'semi': jogos.slice(28, 30),
      'final': jogos.slice(30, 31)
    };

    let html = `
      <div class="bracket">
    `;

    Object.entries(fases).forEach(([fase, partidas]) => {

      html += `
        <div class="round">
          <div class="round-title">${fase.toUpperCase()}</div>
      `;

      partidas.forEach((jogo, i) => {

        const index = jogos.indexOf(jogo);

        html += `
          <div class="match-card">

            <div class="team-row">
              <span>${escHtml(jogo.home)}</span>

              <input
                type="number"
                value="${jogo.homeGoals || ''}"
                onchange="updateChaveamentoScore(${index}, 'home', this.value)"
              >
            </div>

            <div class="team-row">
              <span>${escHtml(jogo.away)}</span>

              <input
                type="number"
                value="${jogo.awayGoals || ''}"
                onchange="updateChaveamentoScore(${index}, 'away', this.value)"
              >
            </div>

          </div>
        `;
      });

      html += `</div>`;
    });

    html += `</div>`;

    document.getElementById('chaveamento-content').innerHTML = html;

    user.chaveamento = jogos;
  });
}
// ── UTILS ─────────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}