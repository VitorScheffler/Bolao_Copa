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
