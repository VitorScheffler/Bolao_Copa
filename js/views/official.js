// ── VIEW: CLASSIFICAÇÃO OFICIAL ───────────────────────────────────────────────

function renderClassificacao() {
  const container = document.getElementById('classificacao-content');
  if (!container) return;

  // Garante que o usuário OFICIAL existe
  const users = getAllUsers();
  if (!users['OFICIAL']) users['OFICIAL'] = {};
  if (!users['OFICIAL'].palpites) users['OFICIAL'].palpites = createEmptyPalpites();

  const oficial = users['OFICIAL'];
  const admin   = isAdmin();

  let html = '';
  for (const [g, data] of Object.entries(GROUPS)) {
    html += buildOfficialGroupCard(g, data.teams, oficial.palpites[g], !admin);
  }

  container.innerHTML = html;
}

function buildOfficialGroupCard(g, teams, matches, disabled) {
  const standings = calcStandings(matches, teams);

  const rows = standings.map((t, i) => {
    const rc = i === 0 ? 'q1' : i === 1 ? 'q2' : '';
    const sg = t.gm - t.gs;
    return `<tr class="${rc}">
      <td><div class="team-cell">
        <span class="rank">${i + 1}</span>
        <span class="team-name">${escHtml(t.name)}</span>
      </div></td>
      <td class="pts">${t.pts}</td>
      <td>${t.pj}</td><td>${t.v}</td><td>${t.e}</td><td>${t.d}</td>
      <td>${t.gm}</td><td>${t.gs}</td>
      <td>${sg >= 0 ? '+' + sg : sg}</td>
    </tr>`;
  }).join('');

  const matchRows = matches.map((m, mi) => {
    const dis    = disabled ? 'disabled' : '';
    const onChgH = disabled ? '' : `onchange="onOfficialScore('${g}',${mi},'home',this.value)" oninput="onOfficialScore('${g}',${mi},'home',this.value)"`;
    const onChgA = disabled ? '' : `onchange="onOfficialScore('${g}',${mi},'away',this.value)" oninput="onOfficialScore('${g}',${mi},'away',this.value)"`;
    return `<div class="match-row">
      <span class="match-home">${escHtml(m.home)}</span>
      <div class="score-box">
        <input class="score-input" type="number" min="0" max="99"
          value="${m.homeGoals}" placeholder="–" ${dis} ${onChgH}>
        <span class="score-sep">×</span>
        <input class="score-input" type="number" min="0" max="99"
          value="${m.awayGoals}" placeholder="–" ${dis} ${onChgA}>
      </div>
      <span class="match-away">${escHtml(m.away)}</span>
    </div>`;
  }).join('');

  const adminBadge = !disabled
    ? `<span style="margin-left:auto;font-size:10px;color:var(--amber);font-weight:600;
        background:var(--amber-bg);padding:2px 8px;border-radius:4px;letter-spacing:.05em">
        ✏️ ADMIN
      </span>`
    : '';

  return `<div class="group-card" id="official-card-${g}">
    <div class="group-card-header">
      <div class="group-badge">${g}</div>
      <h3>Grupo ${g}</h3>
      ${adminBadge}
    </div>
    <div class="standings-wrap"><table class="standings-table">
      <thead><tr>
        <th>Seleção</th>
        <th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th>
        <th>GM</th><th>GS</th><th>SG</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="matches-section">
      <div class="matches-section-label">Resultados Oficiais</div>
      ${matchRows}
    </div>
  </div>`;
}

async function onOfficialScore(g, mi, side, val) {
  if (!isAdmin()) return;
  const users  = getAllUsers();
  const match  = users['OFICIAL'].palpites[g][mi];
  const key    = side === 'home' ? 'homeGoals' : 'awayGoals';
  match[key]   = val === '' ? '' : String(parseInt(val) || 0);
  await saveToServer();
  renderClassificacao();
}
