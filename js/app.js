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

// ═══════════════════════════════════════════════════════════════════
// CHAVEAMENTO — substitui a função renderChaveamento em app.js
// ═══════════════════════════════════════════════════════════════════

// Nomes das fases
const PHASE_NAMES = {
  r32:   'Oitavas',
  r16:   'Quartas',
  r8:    'Semi',
  r4:    'Final',
  r2:    '🏆'
};

// Estado do chaveamento em memória (separado do palpites de grupos)
// Estrutura: { r32: [{home,away,homeGoals,awayGoals}, ...], r16: [...], ... }
let bracketState = null;

// ── Inicializa estado vazio do bracket ───────────────────────────────
function initBracketState() {
  return {
    r32: Array.from({length: 16}, () => ({ homeGoals: '', awayGoals: '' })),
    r16: Array.from({length:  8}, () => ({ homeGoals: '', awayGoals: '' })),
    r8:  Array.from({length:  4}, () => ({ homeGoals: '', awayGoals: '' })),
    r4:  Array.from({length:  2}, () => ({ homeGoals: '', awayGoals: '' })),
    r2:  Array.from({length:  1}, () => ({ homeGoals: '', awayGoals: '' })),
  };
}

// ── Calcula quem avança com base nos placares ────────────────────────
function getWinner(match) {
  const h = parseInt(match.homeGoals);
  const a = parseInt(match.awayGoals);
  if (isNaN(h) || isNaN(a)) return null;
  if (h > a) return match.home;
  if (a > h) return match.away;
  return null; // empate — sem prorrogação no palpite
}

// ── Monta os 16 jogos das oitavas a partir dos resultados da fase de grupos ──
function buildR32fromGroups(palpitesOficial, savedBracket) {
  // Classificados por grupo
  const cls = {};
  for (const [g, data] of Object.entries(GROUPS)) {
    const st = calcStandings(palpitesOficial[g], data.teams);
    cls[g] = st.map(t => t.name);
  }

  // Template dos 16 jogos das oitavas (Copa do Mundo 2026 — 48 times → 32 avançam)
  // 24 primeiros/segundos + 8 melhores terceiros
  // Usamos o template definido em data.js (CHAVEAMENTO_TEMPLATE)
  const matches = CHAVEAMENTO_TEMPLATE.map((t, i) => {
    const saved = savedBracket?.r32?.[i] || {};

    const homeTeam = cls[t.home.grupo]?.[t.home.pos - 1] || `${t.home.pos}º ${t.home.grupo}`;

    let awayTeam;
    if (t.type === 'fixed') {
      awayTeam = cls[t.away.grupo]?.[t.away.pos - 1] || `${t.away.pos}º ${t.away.grupo}`;
    } else {
      // 3º classificado: editável manualmente
      awayTeam = saved.awayOverride || t.away.placeholder;
    }

    return {
      id: t.id,
      label: t.label,
      type: t.type,
      home: homeTeam,
      away: awayTeam,
      awayOverride: saved.awayOverride || '',
      homeGoals: saved.homeGoals ?? '',
      awayGoals: saved.awayGoals ?? '',
    };
  });
  return matches;
}

// ── Propaga vencedores para a fase seguinte ──────────────────────────
function propagateWinners(bracket) {
  const phases = ['r32', 'r16', 'r8', 'r4'];
  const nextPhase = { r32: 'r16', r16: 'r8', r8: 'r4', r4: 'r2' };

  for (const phase of phases) {
    const games = bracket[phase];
    const next  = bracket[nextPhase[phase]];
    if (!games || !next) continue;

    for (let i = 0; i < games.length; i += 2) {
      const slot = Math.floor(i / 2);
      if (!next[slot]) next[slot] = { homeGoals: '', awayGoals: '' };

      const g1 = games[i];
      const g2 = games[i + 1];
      const w1 = g1 ? getWinner(g1) : null;
      const w2 = g2 ? getWinner(g2) : null;

      // Só sobrescreve o nome se ainda não foi editado manualmente
      if (!next[slot].homeManual) next[slot].home = w1 || `Vencedor J${i+1}`;
      if (!next[slot].awayManual) next[slot].away = w2 || `Vencedor J${i+2}`;
    }
  }
}

// ── Salva bracket no allUsers ────────────────────────────────────────
async function saveBracket() {
  if (!currentUser || !bracketState) return;
  if (!allUsers[currentUser]) return;
  allUsers[currentUser].bracket = bracketState;
  await saveToServer();
  showToast('Chaveamento salvo!');
}

// ── Update de placar do bracket ──────────────────────────────────────
function updateBracketScore(phase, idx, side, val) {
  if (!bracketState) return;
  const match = bracketState[phase][idx];
  if (!match) return;
  match[side === 'home' ? 'homeGoals' : 'awayGoals'] = val === '' ? '' : String(parseInt(val) || 0);

  // Propaga automaticamente
  propagateWinners(bracketState);

  // Re-renderiza o bracket sem recarregar tudo
  renderBracketUI();
  saveBracket();
}

// ── Update de time 3º classificado ──────────────────────────────────
function updateBracketAwayOverride(idx, val) {
  if (!bracketState) return;
  bracketState.r32[idx].awayOverride = val;
  bracketState.r32[idx].away = val || CHAVEAMENTO_TEMPLATE[idx]?.away?.placeholder || '?';
  propagateWinners(bracketState);
  renderBracketUI();
  saveBracket();
}

// ── Render principal do chaveamento ─────────────────────────────────
function renderChaveamento() {
  loadFromServer().then(() => {
    const container = document.getElementById('chaveamento-content');
    const oficial   = allUsers['OFICIAL'];

    if (!oficial) {
      container.innerHTML = `
        <div class="empty-state" style="padding:3rem;text-align:center;color:var(--text-muted)">
          <div style="font-size:48px;margin-bottom:1rem">⏳</div>
          <p style="font-size:16px;font-weight:600;margin-bottom:8px">Aguardando resultados</p>
          <p style="font-size:13px">Os resultados da fase de grupos ainda não foram inseridos pelo administrador (OFICIAL).</p>
        </div>`;
      return;
    }

    // Inicializa ou carrega estado salvo
    const savedBracket = allUsers[currentUser]?.bracket || {};
    if (!bracketState) {
      bracketState = initBracketState();
      // Copia dados salvos
      for (const phase of ['r32','r16','r8','r4','r2']) {
        if (savedBracket[phase]) {
          savedBracket[phase].forEach((g, i) => {
            if (bracketState[phase][i]) Object.assign(bracketState[phase][i], g);
          });
        }
      }
    }

    // Monta oitavas a partir dos grupos oficiais
    const r32 = buildR32fromGroups(oficial.palpites, bracketState);
    r32.forEach((g, i) => {
      Object.assign(bracketState.r32[i], g);
    });

    // Propaga vencedores
    propagateWinners(bracketState);

    // Renderiza
    renderBracketUI();
  });
}

// ── Renderiza o bracket visual ───────────────────────────────────────
function renderBracketUI() {
  const container = document.getElementById('chaveamento-content');
  if (!container || !bracketState) return;

  const isOficial = currentUser === 'OFICIAL';

  const phases = [
    { key: 'r32', label: 'Oitavas de Final',  count: 16 },
    { key: 'r16', label: 'Quartas de Final',   count: 8  },
    { key: 'r8',  label: 'Semifinais',         count: 4  },
    { key: 'r4',  label: 'Final',              count: 2  },
    { key: 'r2',  label: '🏆 Campeão',         count: 1  },
  ];

  // ── Divide as oitavas em dois lados (esquerdo / direito) ──────────
  // Lado E: jogos 0–7, Lado D: jogos 8–15 (espelhados)
  const leftR32  = bracketState.r32.slice(0, 8);
  const rightR32 = bracketState.r32.slice(8, 16);
  const leftR16  = bracketState.r16.slice(0, 4);
  const rightR16 = bracketState.r16.slice(4, 8);
  const leftR8   = bracketState.r8.slice(0, 2);
  const rightR8  = bracketState.r8.slice(2, 4);
  const leftR4   = bracketState.r4.slice(0, 1);
  const rightR4  = bracketState.r4.slice(1, 2);

  // ── Botão salvar ──────────────────────────────────────────────────
  const saveBtn = isOficial
    ? `<button class="btn btn-primary btn-sm" onclick="saveBracket()" style="margin-left:auto">💾 Salvar chaveamento</button>`
    : '';

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:8px">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div class="bracket-legend-item"><div class="bracket-legend-dot" style="background:var(--green)"></div>Classificado</div>
        <div class="bracket-legend-item"><div class="bracket-legend-dot" style="background:var(--border-md)"></div>Aguardando</div>
        ${isOficial ? '<div class="bracket-legend-item"><div class="bracket-legend-dot" style="background:var(--amber)"></div>Editável</div>' : ''}
      </div>
      ${saveBtn}
    </div>
    <div class="bracket-outer">
      <div class="bracket-scroll" id="bracket-scroll">`;

  // ── Renderiza lado esquerdo ───────────────────────────────────────
  html += buildColumn('Oitavas', leftR32,  'r32', 0, 8, isOficial);
  html += buildConnectors(8);
  html += buildColumn('Quartas', leftR16,  'r16', 0, 4, isOficial);
  html += buildConnectors(4);
  html += buildColumn('Semi',    leftR8,   'r8',  0, 2, isOficial);
  html += buildConnectors(2);
  html += buildColumn('Final',   leftR4,   'r4',  0, 1, isOficial);

  // ── Centro: troféu ────────────────────────────────────────────────
  html += buildCenterTrophy();

  // ── Renderiza lado direito (espelhado) ────────────────────────────
  html += buildColumn('Final',   rightR4,  'r4',  1, 2, isOficial);
  html += buildConnectors(2, true);
  html += buildColumn('Semi',    rightR8,  'r8',  2, 4, isOficial);
  html += buildConnectors(4, true);
  html += buildColumn('Quartas', rightR16, 'r16', 4, 8, isOficial);
  html += buildConnectors(8, true);
  html += buildColumn('Oitavas', rightR32, 'r32', 8, 16, isOficial);

  html += `</div></div>`;
  container.innerHTML = html;
}

// ── Constrói uma coluna de jogos ──────────────────────────────────────
function buildColumn(label, games, phase, startIdx, endIdx, isOficial) {
  // Calcula espaçamento vertical baseado no número de jogos
  const totalGames = endIdx - startIdx;
  const justify = totalGames === 1 ? 'center' : 'space-around';

  let html = `
    <div class="bracket-col" style="justify-content:${justify}">
      <div class="bracket-col-label">${escHtml(label)}</div>`;

  games.forEach((game, localIdx) => {
    const globalIdx = startIdx + localIdx;
    const w = getWinner(game);
    const isPending = !game.home && !game.away;
    const canEdit = isOficial;

    html += buildMatchCard(game, phase, globalIdx, w, isPending, canEdit);
  });

  html += `</div>`;
  return html;
}

// ── Constrói um card de jogo ──────────────────────────────────────────
function buildMatchCard(game, phase, idx, winner, isPending, canEdit) {
  const homeFlag = FLAGS[game.home] || '';
  const awayFlag = FLAGS[game.away] || '';
  const homeTbd  = !game.home || game.home.startsWith('Vencedor') || game.home.startsWith('3º') || game.home.startsWith('1º') || game.home.startsWith('2º');
  const awayTbd  = !game.away || game.away.startsWith('Vencedor') || game.away.startsWith('3º') || game.away.startsWith('1º') || game.away.startsWith('2º');

  const hWin = winner && winner === game.home;
  const aWin = winner && winner === game.away;

  const cardClass = isPending ? 'b-card pending' : 'b-card';

  // Para times 3º classificados, exibe input de texto se for OFICIAL
  const isThirdPlace = phase === 'r32' && CHAVEAMENTO_TEMPLATE[idx]?.type === 'terceiro';
  let awayDisplay;
  if (isThirdPlace && canEdit) {
    awayDisplay = `<input
      type="text"
      class="b-score-input"
      style="width:90px;font-size:11px;font-weight:400;padding:2px 4px"
      value="${escHtml(game.awayOverride || '')}"
      placeholder="${escHtml(CHAVEAMENTO_TEMPLATE[idx]?.away?.placeholder || '?')}"
      onchange="updateBracketAwayOverride(${idx}, this.value)"
      title="Editar 3º classificado">`;
  } else {
    awayDisplay = '';
  }

  const scoreDisabled = !canEdit ? 'disabled' : '';
  const hScoreVal = game.homeGoals !== '' ? game.homeGoals : '';
  const aScoreVal = game.awayGoals !== '' ? game.awayGoals : '';

  // Número do jogo
  const matchNum = game.id || (phase.replace('r','') + (idx+1));

  return `
    <div class="b-slot">
      <div class="b-card-label">Jogo ${matchNum}</div>
      <div class="${cardClass}">
        <div class="b-team${hWin ? ' winner' : ''}">
          <span class="b-team-flag">${homeFlag}</span>
          <span class="b-team-name${homeTbd ? ' tbd' : ''}">${escHtml(game.home || '—')}</span>
          <input
            type="number"
            class="b-score-input"
            value="${hScoreVal}"
            placeholder="–"
            min="0" max="30"
            ${scoreDisabled}
            onchange="updateBracketScore('${phase}',${idx},'home',this.value)"
            oninput="updateBracketScore('${phase}',${idx},'home',this.value)">
        </div>
        <div class="b-team${aWin ? ' winner' : ''}">
          <span class="b-team-flag">${awayFlag}</span>
          ${isThirdPlace && canEdit
            ? `<input type="text" class="b-score-input" style="width:100px;font-size:10px;font-weight:400;padding:2px 4px;flex:1" value="${escHtml(game.awayOverride || '')}" placeholder="${escHtml(CHAVEAMENTO_TEMPLATE[idx]?.away?.placeholder || '?')}" onchange="updateBracketAwayOverride(${idx}, this.value)" title="3º classificado (editável)">`
            : `<span class="b-team-name${awayTbd ? ' tbd' : ''}">${escHtml(game.away || '—')}</span>`
          }
          <input
            type="number"
            class="b-score-input"
            value="${aScoreVal}"
            placeholder="–"
            min="0" max="30"
            ${scoreDisabled}
            onchange="updateBracketScore('${phase}',${idx},'away',this.value)"
            oninput="updateBracketScore('${phase}',${idx},'away',this.value)">
        </div>
      </div>
    </div>`;
}

// ── Constrói os conectores CSS entre colunas ──────────────────────────
function buildConnectors(pairCount, reversed = false) {
  // Gera linhas em formato bracket: ┐ ┘ → ─ para cada par
  let html = `<div class="connector-wrap" style="display:flex;flex-direction:column;justify-content:space-around;width:28px;flex-shrink:0;align-self:stretch;gap:0">`;

  for (let i = 0; i < pairCount / 2; i++) {
    html += `<div style="flex:1;display:flex;flex-direction:column;justify-content:space-around;position:relative;min-height:20px">
      ${buildConnectorPairSVG(reversed)}
    </div>`;
  }

  html += `</div>`;
  return html;
}

function buildConnectorPairSVG(reversed) {
  // SVG simples de bracket connector
  // reversed: conectores do lado direito (espelhados)
  const color = 'var(--border-md)';

  if (!reversed) {
    // → saindo da coluna esquerda, dois cards → um card
    return `<svg viewBox="0 0 28 100" preserveAspectRatio="none" style="width:28px;height:100%;display:block">
      <polyline points="0,25 14,25 14,75 0,75" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      <line x1="14" y1="50" x2="28" y2="50" stroke="${color}" stroke-width="2"/>
    </svg>`;
  } else {
    // ← entrando no lado direito
    return `<svg viewBox="0 0 28 100" preserveAspectRatio="none" style="width:28px;height:100%;display:block">
      <polyline points="28,25 14,25 14,75 28,75" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      <line x1="14" y1="50" x2="0" y2="50" stroke="${color}" stroke-width="2"/>
    </svg>`;
  }
}

// ── Troféu central ────────────────────────────────────────────────────
function buildCenterTrophy() {
  const final = bracketState?.r2?.[0];
  const champion = final ? getWinner(final) : null;
  const flag = champion ? (FLAGS[champion] || '') : '';

  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 16px;min-width:100px;gap:8px">
      <div style="font-size:42px;filter:drop-shadow(0 2px 12px rgba(245,158,11,0.6));animation:trophyPulse 2s ease-in-out infinite">🏆</div>
      ${champion
        ? `<div style="text-align:center">
            <div style="font-size:24px">${flag}</div>
            <div style="font-size:12px;font-weight:700;color:var(--amber);text-align:center;max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(champion)}</div>
           </div>`
        : `<div style="font-size:11px;color:var(--text-faint);font-style:italic;text-align:center">Campeão</div>`
      }
    </div>`;
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