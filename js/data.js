// ── GRUPOS ────────────────────────────────────────────────────────────────────

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
  L: { teams: ['Inglaterra', 'Croácia', 'Gana', 'Panamá'] },
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
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croácia': '🇭🇷', 'Gana': '🇬🇭', 'Panamá': '🇵🇦',
};

// ── CHAVEAMENTO: 16 jogos das oitavas-de-final (Copa 2026) ────────────────────
// Ordem dos 16 jogos:
//   Lado esquerdo: jogos 0-7   → r16[0-3] → r8[0-1] → r4[0] → Final (esquerda)
//   Lado direito : jogos 8-15  → r16[4-7] → r8[2-3] → r4[1] → Final (direita)
const CHAVEAMENTO_TEMPLATE = [
  // ── LADO ESQUERDO ──────────────────────────────────────────────
  { id: 73, label: 'Jogo 73', type: 'fixed',    home: { grupo: 'A', pos: 2 }, away: { grupo: 'B', pos: 2 } },
  { id: 74, label: 'Jogo 74', type: 'terceiro', home: { grupo: 'E', pos: 1 }, away: { placeholder: '3º A/B/C/D/F' } },
  { id: 75, label: 'Jogo 75', type: 'fixed',    home: { grupo: 'F', pos: 1 }, away: { grupo: 'C', pos: 2 } },
  { id: 76, label: 'Jogo 76', type: 'fixed',    home: { grupo: 'C', pos: 1 }, away: { grupo: 'F', pos: 2 } },
  { id: 77, label: 'Jogo 77', type: 'terceiro', home: { grupo: 'I', pos: 1 }, away: { placeholder: '3º C/D/F/G/H' } },
  { id: 78, label: 'Jogo 78', type: 'fixed',    home: { grupo: 'E', pos: 2 }, away: { grupo: 'I', pos: 2 } },
  { id: 79, label: 'Jogo 79', type: 'terceiro', home: { grupo: 'A', pos: 1 }, away: { placeholder: '3º C/E/F/H/I' } },
  { id: 80, label: 'Jogo 80', type: 'terceiro', home: { grupo: 'L', pos: 1 }, away: { placeholder: '3º E/H/I/J/K' } },
  // ── LADO DIREITO ───────────────────────────────────────────────
  { id: 81, label: 'Jogo 81', type: 'terceiro', home: { grupo: 'D', pos: 1 }, away: { placeholder: '3º B/E/F/I/J' } },
  { id: 82, label: 'Jogo 82', type: 'terceiro', home: { grupo: 'G', pos: 1 }, away: { placeholder: '3º A/E/H/I/J' } },
  { id: 83, label: 'Jogo 83', type: 'fixed',    home: { grupo: 'K', pos: 2 }, away: { grupo: 'L', pos: 2 } },
  { id: 84, label: 'Jogo 84', type: 'fixed',    home: { grupo: 'H', pos: 1 }, away: { grupo: 'J', pos: 2 } },
  { id: 85, label: 'Jogo 85', type: 'terceiro', home: { grupo: 'B', pos: 1 }, away: { placeholder: '3º E/F/G/I/J' } },
  { id: 86, label: 'Jogo 86', type: 'fixed',    home: { grupo: 'J', pos: 1 }, away: { grupo: 'H', pos: 2 } },
  { id: 87, label: 'Jogo 87', type: 'terceiro', home: { grupo: 'K', pos: 1 }, away: { placeholder: '3º D/E/I/J/L' } },
  { id: 88, label: 'Jogo 88', type: 'fixed',    home: { grupo: 'D', pos: 2 }, away: { grupo: 'G', pos: 2 } },
];

// Fases do chaveamento em ordem
const BRACKET_PHASES = [
  { key: 'r32', label: '16 Avos',   count: 16 },
  { key: 'r16', label: 'Oitavas',   count: 8  },
  { key: 'r8',  label: 'Quartas',   count: 4  },
  { key: 'r4',  label: 'Semifinais',count: 2  },
  { key: 'r2',  label: 'Final',     count: 1  },
];
