// ── VIEW: CHAVEAMENTO ─────────────────────────────────────────────────────────
//
// Layout: seções empilhadas verticalmente, uma por fase.
// Sem scroll horizontal — grid responsivo dentro de cada fase.
//
//  ┌─ 16 Avos de Final  (16 jogos, grid 4 colunas) ─┐
//  ├─ Oitavas de Final  ( 8 jogos, grid 4 colunas) ──┤
//  ├─ Quartas de Final  ( 4 jogos, grid 4 colunas) ──┤
//  ├─ Semifinais        ( 2 jogos, grid 2 colunas) ──┤
//  └─ 🏆 Final          ( 1 jogo,  centrado)      ───┘
// ─────────────────────────────────────────────────────────────────────────────

async function renderChaveamento() {
  const viewKey   = getCurrentView();
  const container = viewKey === 'meu-chaveamento'
    ? document.getElementById('meu-chaveamento-content')
    : document.getElementById('chaveamento-content');

  if (!container) return;

  await loadFromServer();

  const users   = getAllUsers();
  const oficial = users['OFICIAL'];

  if (!oficial || !oficial.palpites) {
    container.innerHTML = '<div class="empty-state"><p>O chaveamento oficial ainda não foi definido.</p></div>';
    return;
  }

  // ── Monta bracket state ───────────────────────────────────────────────────
  const saved = (users[getCurrentUser()] && users[getCurrentUser()].bracket) || {};
  const bs    = initBracketState();

  // Restaura placares salvos do usuário
  ['r32','r16','r8','r4','r2'].forEach(function(phase) {
    (saved[phase] || []).forEach(function(g, i) {
      if (bs[phase][i]) Object.assign(bs[phase][i], g);
    });
  });

  // Sobrescreve times com base na classificação oficial
  buildR32fromGroups(oficial.palpites, bs).forEach(function(g, i) {
    Object.assign(bs.r32[i], g);
  });

  propagateWinners(bs);
  setBracketState(bs);
  _renderBracketHTML(container);
}

// ── Render principal ──────────────────────────────────────────────────────────

function _renderBracketHTML(container) {
  var bs    = getBracketState();
  var admin = isAdmin();
  if (!bs) return;

  var champion  = getWinner(bs.r2[0]);
  var champFlag = champion ? (FLAGS[champion] || '') : '';

  var phases = [
    { key: 'r32', label: '16 Avos de Final', cols: 4 },
    { key: 'r16', label: 'Oitavas de Final', cols: 4 },
    { key: 'r8',  label: 'Quartas de Final', cols: 4 },
    { key: 'r4',  label: 'Semifinais',       cols: 2 },
  ];

  var html = '<div class="bracket-toolbar">' +
    '<div class="bracket-legend">' +
      '<span class="bl-item"><span class="bl-dot" style="background:var(--green)"></span>Classificado</span>' +
      '<span class="bl-item"><span class="bl-dot" style="background:var(--border-md)"></span>Aguardando</span>' +
      (admin ? '<span class="bl-item"><span class="bl-dot" style="background:var(--amber)"></span>Editável</span>' : '') +
    '</div>' +
    (admin ? '<button class="btn btn-primary btn-sm" onclick="saveBracket()">💾 Salvar chaveamento</button>' : '') +
  '</div>';

  // Fases empilhadas
  phases.forEach(function(p) {
    html += '<div class="bv-phase">';
    html += '<div class="bv-phase-header">';
    html += '<div class="bv-phase-label">' + p.label + '</div>';
    html += '<div class="bv-phase-line"></div>';
    html += '</div>';
    html += '<div class="bv-grid" style="--bv-cols:' + p.cols + '">';

    bs[p.key].forEach(function(game, idx) {
      var winner  = getWinner(game);
      var isThird = p.key === 'r32' && CHAVEAMENTO_TEMPLATE[idx] && CHAVEAMENTO_TEMPLATE[idx].type === 'terceiro';
      html += _buildMatchCard(game, p.key, idx, winner, isThird, admin);
    });

    html += '</div></div>';
  });

  // Final
  html += '<div class="bv-phase">';
  html += '<div class="bv-phase-header">';
  html += '<div class="bv-phase-label bv-phase-label--final">🏆 Final</div>';
  html += '<div class="bv-phase-line"></div>';
  html += '</div>';
  html += '<div class="bv-final-wrap">';
  html += _buildFinalCard(bs.r2[0], champion, champFlag, admin);
  html += '</div></div>';

  container.innerHTML = html;
}

// ── Card de jogo ──────────────────────────────────────────────────────────────

function _buildMatchCard(game, phase, idx, winner, isThird, admin) {
  var homeFlag = FLAGS[game.home] || '';
  var awayFlag = FLAGS[game.away] || '';
  var homeTbd  = isTbd(game.home);
  var awayTbd  = isTbd(game.away);
  var hWin     = !!(winner && winner === game.home);
  var aWin     = !!(winner && winner === game.away);

  var dis    = admin ? '' : 'disabled';
  var hScore = (game.homeGoals !== '') ? game.homeGoals : '';
  var aScore = (game.awayGoals !== '') ? game.awayGoals : '';
  var label  = game.id ? ('J' + game.id) : (phase.toUpperCase() + '-' + (idx + 1));

  var homeRow = '<div class="bv-team' + (hWin ? ' winner' : '') + '">' +
    '<span class="bv-flag">' + homeFlag + '</span>' +
    '<span class="bv-name' + (homeTbd ? ' tbd' : '') + '" title="' + escHtml(game.home || '') + '">' + escHtml(game.home || '—') + '</span>' +
    '<input type="number" class="bv-score" min="0" max="30" value="' + hScore + '" placeholder="–" ' + dis + ' ' +
      'onchange="onBracketScore(\'' + phase + '\',' + idx + ',\'home\',this.value)" ' +
      'oninput="onBracketScore(\'' + phase + '\',' + idx + ',\'home\',this.value)">' +
  '</div>';

  var awayNameEl;
  if (isThird && admin) {
    var ph = escHtml((CHAVEAMENTO_TEMPLATE[idx] && CHAVEAMENTO_TEMPLATE[idx].away && CHAVEAMENTO_TEMPLATE[idx].away.placeholder) || '?');
    awayNameEl = '<input type="text" class="bv-override" value="' + escHtml(game.awayOverride || '') + '" placeholder="' + ph + '" ' +
      'onchange="onBracketAwayOverride(' + idx + ',this.value)" title="3º classificado — editável">';
  } else {
    awayNameEl = '<span class="bv-name' + (awayTbd ? ' tbd' : '') + '" title="' + escHtml(game.away || '') + '">' + escHtml(game.away || '—') + '</span>';
  }

  var awayRow = '<div class="bv-team' + (aWin ? ' winner' : '') + '">' +
    '<span class="bv-flag">' + awayFlag + '</span>' +
    awayNameEl +
    '<input type="number" class="bv-score" min="0" max="30" value="' + aScore + '" placeholder="–" ' + dis + ' ' +
      'onchange="onBracketScore(\'' + phase + '\',' + idx + ',\'away\',this.value)" ' +
      'oninput="onBracketScore(\'' + phase + '\',' + idx + ',\'away\',this.value)">' +
  '</div>';

  return '<div class="bv-slot">' +
    '<div class="bv-slot-label">' + label + '</div>' +
    '<div class="bv-card' + (homeTbd && awayTbd ? ' pending' : '') + '">' +
      homeRow + awayRow +
    '</div>' +
  '</div>';
}

// ── Card da Final ─────────────────────────────────────────────────────────────

function _buildFinalCard(match, champion, champFlag, admin) {
  if (!match) match = { home: '', away: '', homeGoals: '', awayGoals: '' };

  var homeFlag = FLAGS[match.home] || '';
  var awayFlag = FLAGS[match.away] || '';
  var homeTbd  = isTbd(match.home);
  var awayTbd  = isTbd(match.away);
  var hWin     = !!(champion && champion === match.home);
  var aWin     = !!(champion && champion === match.away);
  var dis      = admin ? '' : 'disabled';
  var hScore   = (match.homeGoals !== '') ? match.homeGoals : '';
  var aScore   = (match.awayGoals !== '') ? match.awayGoals : '';

  var trophy = '<div class="bv-trophy">' +
    '<div class="bv-trophy-icon">🏆</div>' +
    (champion
      ? '<div class="bv-champion"><span class="bv-champion-flag">' + champFlag + '</span><span class="bv-champion-name">' + escHtml(champion) + '</span></div>'
      : '<span class="bv-champion-tbd">Campeão</span>') +
  '</div>';

  var card = '<div class="bv-card bv-card--final">' +
    '<div class="bv-final-badge">Final · 19/07/2026</div>' +

    '<div class="bv-team bv-team--final' + (hWin ? ' winner' : '') + '">' +
      '<span class="bv-flag bv-flag--final">' + homeFlag + '</span>' +
      '<span class="bv-name bv-name--final' + (homeTbd ? ' tbd' : '') + '">' + escHtml(match.home || '—') + '</span>' +
      '<input type="number" class="bv-score bv-score--final" min="0" max="30" value="' + hScore + '" placeholder="–" ' + dis + ' ' +
        'onchange="onBracketScore(\'r2\',0,\'home\',this.value)" oninput="onBracketScore(\'r2\',0,\'home\',this.value)">' +
    '</div>' +

    '<div class="bv-team bv-team--final' + (aWin ? ' winner' : '') + '">' +
      '<span class="bv-flag bv-flag--final">' + awayFlag + '</span>' +
      '<span class="bv-name bv-name--final' + (awayTbd ? ' tbd' : '') + '">' + escHtml(match.away || '—') + '</span>' +
      '<input type="number" class="bv-score bv-score--final" min="0" max="30" value="' + aScore + '" placeholder="–" ' + dis + ' ' +
        'onchange="onBracketScore(\'r2\',0,\'away\',this.value)" oninput="onBracketScore(\'r2\',0,\'away\',this.value)">' +
    '</div>' +
  '</div>';

  return '<div class="bv-final-inner">' + trophy + card + '</div>';
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function onBracketScore(phase, idx, side, val) {
  updateBracketScore(phase, idx, side, val);
  var bs = getBracketState();
  propagateWinners(bs);
  setBracketState(bs);
  _rerender();
  saveBracket();
}

function onBracketAwayOverride(idx, val) {
  updateBracketAway(idx, val);
  var bs = getBracketState();
  propagateWinners(bs);
  setBracketState(bs);
  _rerender();
  saveBracket();
}

function _rerender() {
  var viewKey   = getCurrentView();
  var container = viewKey === 'meu-chaveamento'
    ? document.getElementById('meu-chaveamento-content')
    : document.getElementById('chaveamento-content');
  if (container) _renderBracketHTML(container);
}

async function saveBracket() {
  persistBracketToUser();
  await saveToServer();
  showToast('✅ Chaveamento salvo!');
}