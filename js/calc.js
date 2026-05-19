// ── CÁLCULOS ──────────────────────────────────────────────────────────────────
// Funções puras sem efeitos colaterais — dependem apenas de data.js

/**
 * Gera todos os jogos de um grupo (todos contra todos).
 * @param {string[]} teams
 * @returns {Match[]}
 */
function generateMatches(teams) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({ home: teams[i], away: teams[j], homeGoals: '', awayGoals: '' });
    }
  }
  return matches;
}

/**
 * Calcula a tabela de classificação de um grupo.
 * @param {Match[]} matches
 * @param {string[]} teams
 * @returns {StandingRow[]}
 */
function calcStandings(matches, teams) {
  const stats = {};
  teams.forEach(t => {
    stats[t] = { pts: 0, pj: 0, v: 0, e: 0, d: 0, gm: 0, gs: 0 };
  });

  for (const m of matches) {
    const hg = parseInt(m.homeGoals);
    const ag = parseInt(m.awayGoals);
    if (isNaN(hg) || isNaN(ag)) continue;

    stats[m.home].pj++; stats[m.away].pj++;
    stats[m.home].gm += hg; stats[m.home].gs += ag;
    stats[m.away].gm += ag; stats[m.away].gs += hg;

    if (hg > ag)      { stats[m.home].pts += 3; stats[m.home].v++; stats[m.away].d++; }
    else if (hg < ag) { stats[m.away].pts += 3; stats[m.away].v++; stats[m.home].d++; }
    else              { stats[m.home].pts += 1; stats[m.home].e++; stats[m.away].pts += 1; stats[m.away].e++; }
  }

  return teams
    .map(t => ({ name: t, ...stats[t], sg: stats[t].gm - stats[t].gs }))
    .sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gm - a.gm);
}

/**
 * Inicializa palpites zerados para um usuário.
 * @returns {Record<string, Match[]>}
 */
function createEmptyPalpites() {
  const palpites = {};
  for (const [g, data] of Object.entries(GROUPS)) {
    palpites[g] = generateMatches(data.teams);
  }
  return palpites;
}

/**
 * Conta quantos jogos foram preenchidos.
 * @param {Record<string, Match[]>} palpites
 * @returns {{ filled: number, total: number }}
 */
function countFilled(palpites) {
  let filled = 0, total = 0;
  for (const g of Object.values(palpites)) {
    for (const m of g) {
      total++;
      if (m.homeGoals !== '' && m.awayGoals !== '') filled++;
    }
  }
  return { filled, total };
}

// ── BRACKET ───────────────────────────────────────────────────────────────────

/**
 * Retorna o vencedor de um jogo, ou null se empate/incompleto.
 * @param {{ home: string, away: string, homeGoals: string|number, awayGoals: string|number }} match
 * @returns {string|null}
 */
function getWinner(match) {
  if (!match) return null;
  const h = parseInt(match.homeGoals);
  const a = parseInt(match.awayGoals);
  if (isNaN(h) || isNaN(a)) return null;
  if (h > a) return match.home;
  if (a > h) return match.away;
  return null;
}

/**
 * Inicializa estrutura vazia do bracket para todas as fases.
 * @returns {BracketState}
 */
function initBracketState() {
  return {
    r32: Array.from({ length: 16 }, () => ({ homeGoals: '', awayGoals: '' })),
    r16: Array.from({ length:  8 }, () => ({ homeGoals: '', awayGoals: '' })),
    r8:  Array.from({ length:  4 }, () => ({ homeGoals: '', awayGoals: '' })),
    r4:  Array.from({ length:  2 }, () => ({ homeGoals: '', awayGoals: '' })),
    r2:  Array.from({ length:  1 }, () => ({ homeGoals: '', awayGoals: '' })),
  };
}

/**
 * Monta os 16 jogos das oitavas a partir da classificação OFICIAL.
 * @param {Record<string, Match[]>} palpitesOficial
 * @param {BracketState} savedBracket
 * @returns {BracketMatch[]}
 */
function buildR32fromGroups(palpitesOficial, savedBracket) {
  const cls = {};
  for (const [g, data] of Object.entries(GROUPS)) {
    cls[g] = calcStandings(palpitesOficial[g], data.teams).map(t => t.name);
  }

  return CHAVEAMENTO_TEMPLATE.map((tpl, i) => {
    const saved = savedBracket?.r32?.[i] || {};

    const homeTeam = cls[tpl.home.grupo]?.[tpl.home.pos - 1]
      || `${tpl.home.pos}º ${tpl.home.grupo}`;

    let awayTeam;
    if (tpl.type === 'fixed') {
      awayTeam = cls[tpl.away.grupo]?.[tpl.away.pos - 1]
        || `${tpl.away.pos}º ${tpl.away.grupo}`;
    } else {
      awayTeam = saved.awayOverride || tpl.away.placeholder;
    }

    return {
      id:           tpl.id,
      label:        tpl.label,
      type:         tpl.type,
      home:         homeTeam,
      away:         awayTeam,
      awayOverride: saved.awayOverride || '',
      homeGoals:    saved.homeGoals ?? '',
      awayGoals:    saved.awayGoals ?? '',
    };
  });
}

/**
 * Propaga vencedores de cada fase para a próxima.
 * Só preenche o time se o slot ainda não foi editado manualmente.
 * @param {BracketState} bracket
 */
function propagateWinners(bracket) {
  const progression = [
    { from: 'r32', to: 'r16' },
    { from: 'r16', to: 'r8'  },
    { from: 'r8',  to: 'r4'  },
    { from: 'r4',  to: 'r2'  },
  ];

  for (const { from, to } of progression) {
    const src  = bracket[from];
    const dest = bracket[to];
    if (!src || !dest) continue;

    for (let i = 0; i < src.length; i += 2) {
      const slotIdx = Math.floor(i / 2);
      if (!dest[slotIdx]) dest[slotIdx] = { homeGoals: '', awayGoals: '' };

      const slot = dest[slotIdx];
      const g1   = src[i];
      const g2   = src[i + 1];

      const w1 = g1 ? getWinner(g1) : null;
      const w2 = g2 ? getWinner(g2) : null;

      // Label de fallback quando vencedor ainda não definido
      const fallbackHome = `Venc. J${g1?.id || (i + 1)}`;
      const fallbackAway = `Venc. J${g2?.id || (i + 2)}`;

      slot.home = w1 || fallbackHome;
      slot.away = w2 || fallbackAway;
    }
  }
}
