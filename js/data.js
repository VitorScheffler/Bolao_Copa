// ── DADOS DOS GRUPOS ──────────────────────────────────────────────────────────

const GROUPS = {
  A: { teams: ['México', 'África do Sul', 'Coreia do Sul', 'Rep. Tcheca'] },
  B: { teams: ['Canadá', 'Bósnia-Herzegovina', 'Catar', 'Suíça'] },
  C: { teams: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'] },
  D: { teams: ['EUA', 'Paraguai', 'Austrália', 'Turquia'] },
  E: { teams: ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'] },
  F: { teams: ['Países Baixos', 'Japão', 'Suécia', 'Tunísia'] },
  G: { teams: ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'] },
  H: { teams: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'] },
  I: { teams: ['França', 'Senegal', 'Iraque', 'Noruega'] },
  J: { teams: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'] },
  K: { teams: ['Portugal', 'R.D. Congo', 'Uzbequistão', 'Colômbia'] },
  L: { teams: ['Inglaterra', 'Croácia', 'Gana', 'Panamá'] }
};

const FLAGS = {
  'México': '🇲🇽', 'África do Sul': '🇿🇦', 'Coreia do Sul': '🇰🇷', 'Rep. Tcheca': '🇨🇿',
  'Canadá': '🇨🇦', 'Bósnia-Herzegovina': '🇧🇦', 'Catar': '🇶🇦', 'Suíça': '🇨🇭',
  'Brasil': '🇧🇷', 'Marrocos': '🇲🇦', 'Haiti': '🇭🇹', 'Escócia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'EUA': '🇺🇸', 'Paraguai': '🇵🇾', 'Austrália': '🇦🇺', 'Turquia': '🇹🇷',
  'Alemanha': '🇩🇪', 'Curaçao': '🇨🇼', 'Costa do Marfim': '🇨🇮', 'Equador': '🇪🇨',
  'Países Baixos': '🇳🇱', 'Japão': '🇯🇵', 'Suécia': '🇸🇪', 'Tunísia': '🇹🇳',
  'Bélgica': '🇧🇪', 'Egito': '🇪🇬', 'Irã': '🇮🇷', 'Nova Zelândia': '🇳🇿',
  'Espanha': '🇪🇸', 'Cabo Verde': '🇨🇻', 'Arábia Saudita': '🇸🇦', 'Uruguai': '🇺🇾',
  'França': '🇫🇷', 'Senegal': '🇸🇳', 'Iraque': '🇮🇶', 'Noruega': '🇳🇴',
  'Argentina': '🇦🇷', 'Argélia': '🇩🇿', 'Áustria': '🇦🇹', 'Jordânia': '🇯🇴',
  'Portugal': '🇵🇹', 'R.D. Congo': '🇨🇩', 'Uzbequistão': '🇺🇿', 'Colômbia': '🇨🇴',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croácia': '🇭🇷', 'Gana': '🇬🇭', 'Panamá': '🇵🇦'
};

// Gera todos os jogos de um grupo (todos contra todos)
function generateMatches(teams) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({ home: teams[i], away: teams[j], homeGoals: '', awayGoals: '' });
    }
  }
  return matches;
}

// Calcula a tabela de classificação a partir dos palpites
function calcStandings(matches, teams) {
  const stats = {};
  teams.forEach(t => {
    stats[t] = { pts: 0, pj: 0, v: 0, e: 0, d: 0, gm: 0, gs: 0 };
  });

  for (const m of matches) {
    const hg = parseInt(m.homeGoals);
    const ag = parseInt(m.awayGoals);
    if (isNaN(hg) || isNaN(ag)) continue;

    stats[m.home].pj++;
    stats[m.away].pj++;
    stats[m.home].gm += hg;
    stats[m.home].gs += ag;
    stats[m.away].gm += ag;
    stats[m.away].gs += hg;

    if (hg > ag) {
      stats[m.home].pts += 3; stats[m.home].v++;
      stats[m.away].d++;
    } else if (hg < ag) {
      stats[m.away].pts += 3; stats[m.away].v++;
      stats[m.home].d++;
    } else {
      stats[m.home].pts += 1; stats[m.home].e++;
      stats[m.away].pts += 1; stats[m.away].e++;
    }
  }

  return teams
    .map(t => ({ name: t, ...stats[t], sg: stats[t].gm - stats[t].gs }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.sg !== a.sg) return b.sg - a.sg;
      return b.gm - a.gm;
    });
}

// Calcula pontuação de acertos do bolão (comparando com resultados reais)
// Para uso futuro: 3pts = placar exato, 1pt = resultado certo (V/E/D)
function calcBolaoScore(userMatches, realMatches) {
  let pts = 0, exatos = 0, resultados = 0;

  for (let i = 0; i < realMatches.length; i++) {
    const r = realMatches[i];
    const u = userMatches[i];
    if (!r || !u) continue;

    const rh = parseInt(r.homeGoals), ra = parseInt(r.awayGoals);
    const uh = parseInt(u.homeGoals), ua = parseInt(u.awayGoals);
    if (isNaN(rh) || isNaN(ra) || isNaN(uh) || isNaN(ua)) continue;

    if (rh === uh && ra === ua) {
      pts += 3; exatos++;
    } else {
      const rResult = Math.sign(rh - ra);
      const uResult = Math.sign(uh - ua);
      if (rResult === uResult) { pts += 1; resultados++; }
    }
  }

  return { pts, exatos, resultados };
}

// Inicializa palpites zerados para um usuário
function createEmptyPalpites() {
  const palpites = {};
  for (const [g, data] of Object.entries(GROUPS)) {
    palpites[g] = generateMatches(data.teams);
  }
  return palpites;
}

// Conta quantos jogos o usuário preencheu
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

// ── CHAVEAMENTO ──────────────────────────────────────────────────────────

// Os 16 jogos do Round of 32, conforme regulamento FIFA
// type: 'fixed' = calculável dos palpites | 'terceiro' = depende dos 3ºs classificados
const CHAVEAMENTO_TEMPLATE = [
  { id: 73, label: 'Jogo 1',  type: 'fixed',    home: { grupo: 'A', pos: 2 }, away: { grupo: 'B', pos: 2 } },
  { id: 74, label: 'Jogo 2',  type: 'terceiro', home: { grupo: 'E', pos: 1 }, away: { placeholder: '3º A/B/C/D/F' } },
  { id: 75, label: 'Jogo 3',  type: 'fixed',    home: { grupo: 'F', pos: 1 }, away: { grupo: 'C', pos: 2 } },
  { id: 76, label: 'Jogo 4',  type: 'fixed',    home: { grupo: 'C', pos: 1 }, away: { grupo: 'F', pos: 2 } },
  { id: 77, label: 'Jogo 5',  type: 'terceiro', home: { grupo: 'I', pos: 1 }, away: { placeholder: '3º C/D/F/G/H' } },
  { id: 78, label: 'Jogo 6',  type: 'fixed',    home: { grupo: 'E', pos: 2 }, away: { grupo: 'I', pos: 2 } },
  { id: 79, label: 'Jogo 7',  type: 'terceiro', home: { grupo: 'A', pos: 1 }, away: { placeholder: '3º C/E/F/H/I' } },
  { id: 80, label: 'Jogo 8',  type: 'terceiro', home: { grupo: 'L', pos: 1 }, away: { placeholder: '3º E/H/I/J/K' } },
  { id: 81, label: 'Jogo 9',  type: 'terceiro', home: { grupo: 'D', pos: 1 }, away: { placeholder: '3º B/E/F/I/J' } },
  { id: 82, label: 'Jogo 10', type: 'terceiro', home: { grupo: 'G', pos: 1 }, away: { placeholder: '3º A/E/H/I/J' } },
  { id: 83, label: 'Jogo 11', type: 'fixed',    home: { grupo: 'K', pos: 2 }, away: { grupo: 'L', pos: 2 } },
  { id: 84, label: 'Jogo 12', type: 'fixed',    home: { grupo: 'H', pos: 1 }, away: { grupo: 'J', pos: 2 } },
  { id: 85, label: 'Jogo 13', type: 'terceiro', home: { grupo: 'B', pos: 1 }, away: { placeholder: '3º E/F/G/I/J' } },
  { id: 86, label: 'Jogo 14', type: 'fixed',    home: { grupo: 'J', pos: 1 }, away: { grupo: 'H', pos: 2 } },
  { id: 87, label: 'Jogo 15', type: 'terceiro', home: { grupo: 'K', pos: 1 }, away: { placeholder: '3º D/E/I/J/L' } },
  { id: 88, label: 'Jogo 16', type: 'fixed',    home: { grupo: 'D', pos: 2 }, away: { grupo: 'G', pos: 2 } },
];

// Resolve os times de cada jogo baseado nos palpites do usuário OFICIAL
// Para os 3ºs, usa o valor editado manualmente (awayOverride)
function resolveChaveamento(palpitesOficial, chaveamentoSalvas) {
  // Monta classificados do OFICIAL
  const classificados = {};
  for (const [g, data] of Object.entries(GROUPS)) {
    const standings = calcStandings(palpitesOficial[g], data.teams);
    classificados[g] = standings.map(t => t.name);
  }

  return CHAVEAMENTO_TEMPLATE.map((template, i) => {
    const salvo = chaveamentoSalvas?.[i] || {};

    const homeTime = classificados[template.home.grupo]?.[template.home.pos - 1] || `${template.home.pos}º ${template.home.grupo}`;

    let awayTime;
    if (template.type === 'fixed') {
      awayTime = classificados[template.away.grupo]?.[template.away.pos - 1] || `${template.away.pos}º ${template.away.grupo}`;
    } else {
      // Para 3ºs: usa o valor salvo (editável pelo OFICIAL) ou o placeholder
      awayTime = salvo.awayOverride || template.away.placeholder;
    }

    return {
      id: template.id,
      label: template.label,
      type: template.type,
      home: homeTime,
      away: awayTime,
      awayOverride: salvo.awayOverride || '',
      homeGoals: salvo.homeGoals ?? '',
      awayGoals: salvo.awayGoals ?? '',
    };
  });
}