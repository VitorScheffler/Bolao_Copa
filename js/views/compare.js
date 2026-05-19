// ── VIEW: COMPARAR CLASSIFICAÇÃO ─────────────────────────────────────────────

async function renderCompare() {
  await loadFromServer();
  renderLoginUsers();

  const container = document.getElementById('compare-content');
  if (!container) return;

  const users = getAllUsers();
  const names = Object.keys(users);

  if (names.length < 2) {
    container.innerHTML = `<div class="empty-state">
      <p>Adicione pelo menos 2 participantes para comparar.</p>
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
        <div class="compare-group-line"></div>
      </div>
      <div class="compare-standings-row">`;

    for (const name of names) {
      const userData = users[name];
      if (!userData?.palpites?.[g]) continue;

      const standings = calcStandings(userData.palpites[g], data.teams);
      html += buildCompareBlock(name, standings);
    }

    html += `</div></div>`;
  }

  container.innerHTML = html;
}

function buildCompareBlock(name, standings) {
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

  return `<div class="compare-user-block">
    <div class="compare-user-name">${escHtml(name)}</div>
    <table class="standings-table">
      <thead><tr>
        <th>Seleção</th>
        <th title="Pontos">Pts</th><th title="Jogos">J</th>
        <th title="Vitórias">V</th><th title="Empates">E</th><th title="Derrotas">D</th>
        <th title="GM">GM</th><th title="GS">GS</th><th title="SG">SG</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
