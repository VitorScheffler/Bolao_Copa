// ── ESTADO DA APLICAÇÃO ───────────────────────────────────────────────────────

let currentUser = null;
let allUsers = {};      // { nome: { palpites: {...} } }
let currentView = 'meus-palpites';

// ── INICIALIZAÇÃO ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadFromServer();

  // Enter no campo de nome faz login
  document.getElementById('login-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
});

// ── PERSISTÊNCIA (servidor via PHP) ──────────────────────────────────────────

async function loadFromServer() {
  try {
    const res = await fetch('api/load.php');
    const data = await res.json();
    if (data && data.users) {
      allUsers = data.users;
    }
  } catch (e) {
    // Fallback para localStorage se não tiver PHP
    const saved = localStorage.getItem('bolao_data');
    if (saved) allUsers = JSON.parse(saved);
  }
  renderLoginUsers();
}

async function saveToServer() {
  // Envia APENAS os dados do usuário atual — o servidor faz o merge
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
    // Fallback para localStorage
    localStorage.setItem('bolao_data', JSON.stringify(allUsers));
  }
  // Cache local sempre atualizado
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

  // Recarrega dados frescos do servidor antes de entrar,
  // para pegar participantes que entraram enquanto esta aba estava aberta
  loadFromServer().then(() => {
    if (!allUsers[name]) {
      allUsers[name] = { palpites: createEmptyPalpites() };
    }

    currentUser = name;
    errEl.style.display = 'none';
    nameEl.value = '';

    // Salva o novo usuário (merge no servidor)
    saveToServer();

    showScreen('main');
    renderApp();
  });
}

function logout() {
  currentUser = null;
  showScreen('login');
  // Recarrega lista de participantes ao voltar para o login
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

  // Reset nav para "meus palpites"
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-view="meus-palpites"]').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-meus-palpites').classList.add('active');
  currentView = 'meus-palpites';

  renderGroups();
}

// ── RENDER: GRUPOS ────────────────────────────────────────────────────────────

function renderGroups() {
  const grid = document.getElementById('groups-grid');
  const user = allUsers[currentUser];
  const { filled, total } = countFilled(user.palpites);
  document.getElementById('progress-label').textContent =
    `${filled} / ${total} jogos preenchidos`;

  let html = '<div class="legend">';
  html += '</div>';

  html += '<div class="groups-grid-inner" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(370px,1fr));gap:1.25rem">';

  for (const [g, data] of Object.entries(GROUPS)) {
    html += buildGroupCard(g, data.teams, user.palpites[g]);
  }
  html += '</div>';
  grid.innerHTML = html;
}

function buildGroupCard(g, teams, matches) {
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
    html += `<div class="match-row">
      <span class="match-home">${escHtml(m.home)}</span>
      <div class="score-box">
        <input class="score-input" type="number" min="0" max="99"
          value="${hVal}" placeholder="–"
          onchange="updateScore('${g}',${mi},'home',this.value)"
          oninput="updateScore('${g}',${mi},'home',this.value)">
        <span class="score-sep">×</span>
        <input class="score-input" type="number" min="0" max="99"
          value="${aVal}" placeholder="–"
          onchange="updateScore('${g}',${mi},'away',this.value)"
          oninput="updateScore('${g}',${mi},'away',this.value)">
      </div>
      <span class="match-away">${escHtml(m.away)}</span>
    </div>`;
  });

  html += '</div></div>';
  return html;
}

// ── UPDATE DE PLACAR ──────────────────────────────────────────────────────────

function updateScore(g, mi, side, val) {
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
  await saveToServer();
  showToast('Palpites salvos com sucesso!');
}

// ── RENDER: COMPARAR ──────────────────────────────────────────────────────────

function renderCompare() {
  // Recarrega dados frescos antes de comparar
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