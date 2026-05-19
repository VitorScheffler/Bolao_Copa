// ── VIEW: MINHA CLASSIFICAÇÃO ─────────────────────────────────────────────────

function renderGroups() {
  const grid    = document.getElementById('groups-grid');
  const user    = getUserData();
  if (!grid || !user) return;

  const locked  = isCupStarted();
  const { filled, total } = countFilled(user.palpites);

  const labelEl = document.getElementById('progress-label');
  if (labelEl) labelEl.textContent = `${filled} / ${total} jogos preenchidos`;

  // Mostra/oculta botão salvar
  const saveBtn = document.querySelector('#view-minha-classificacao .view-actions .btn-primary');
  if (saveBtn) saveBtn.style.display = locked ? 'none' : '';

  let html = '';
  if (locked) {
    html += `<div class="cup-started-banner">
      🏆 A Copa do Mundo já começou! Os palpites estão bloqueados.
    </div>`;
  }

  for (const [g, data] of Object.entries(GROUPS)) {
    html += buildGroupCard(g, data.teams, user.palpites[g], locked);
  }

  grid.innerHTML = html;
}

function buildGroupCard(g, teams, matches, locked) {
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
    const hVal   = m.homeGoals !== '' ? m.homeGoals : '';
    const aVal   = m.awayGoals !== '' ? m.awayGoals : '';
    const dis    = locked ? 'disabled' : '';
    const onChgH = locked ? '' : `onchange="onScoreChange('${g}',${mi},'home',this.value)" oninput="onScoreChange('${g}',${mi},'home',this.value)"`;
    const onChgA = locked ? '' : `onchange="onScoreChange('${g}',${mi},'away',this.value)" oninput="onScoreChange('${g}',${mi},'away',this.value)"`;
    return `<div class="match-row">
      <span class="match-home">${escHtml(m.home)}</span>
      <div class="score-box">
        <input class="score-input" type="number" min="0" max="99" value="${hVal}" placeholder="–" ${dis} ${onChgH}>
        <span class="score-sep">×</span>
        <input class="score-input" type="number" min="0" max="99" value="${aVal}" placeholder="–" ${dis} ${onChgA}>
      </div>
      <span class="match-away">${escHtml(m.away)}</span>
    </div>`;
  }).join('');

  return `<div class="group-card" id="card-${g}">
    <div class="group-card-header">
      <div class="group-badge">${g}</div>
      <h3>Grupo ${g}</h3>
    </div>
    <div class="standings-wrap"><table class="standings-table">
      <thead><tr>
        <th>Seleção</th>
        <th title="Pontos">Pts</th><th title="Jogos">J</th>
        <th title="Vitórias">V</th><th title="Empates">E</th><th title="Derrotas">D</th>
        <th title="Gols Marcados">GM</th><th title="Gols Sofridos">GS</th><th title="Saldo">SG</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="matches-section">
      <div class="matches-section-label">Jogos</div>
      ${matchRows}
    </div>
  </div>`;
}

// ── HANDLERS ──────────────────────────────────────────────────────────────────

function onScoreChange(g, mi, side, val) {
  if (isCupStarted()) return;
  updateMatchScore(g, mi, side, val);
  refreshGroupStandings(g);

  const user = getUserData();
  const { filled, total } = countFilled(user.palpites);
  const labelEl = document.getElementById('progress-label');
  if (labelEl) labelEl.textContent = `${filled} / ${total} jogos preenchidos`;
}

function refreshGroupStandings(g) {
  const user      = getUserData();
  const standings = calcStandings(user.palpites[g], GROUPS[g].teams);
  const tbody     = document.querySelector(`#card-${g} .standings-table tbody`);
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  standings.forEach((t, i) => {
    const row = rows[i];
    if (!row) return;
    const sg    = t.gm - t.gs;
    row.className = i === 0 ? 'q1' : i === 1 ? 'q2' : '';
    const cells = row.querySelectorAll('td');
    cells[0].innerHTML = `<div class="team-cell">
      <span class="rank">${i + 1}</span>
      <span class="flag">${FLAGS[t.name] || ''}</span>
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

async function saveAll() {
  if (isCupStarted()) return;
  await saveToServer();
  showToast('Palpites salvos com sucesso!');
}
