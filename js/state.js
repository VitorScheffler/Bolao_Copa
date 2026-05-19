// ── ESTADO GLOBAL ─────────────────────────────────────────────────────────────
// Único ponto de verdade — nunca acesse/modifique diretamente de fora deste módulo
// exceto através das funções exportadas.

let _currentUser  = null;
let _allUsers     = {};
let _currentView  = 'meus-palpites';
let _bracketState = null;

const CUP_START = new Date('2026-06-11T00:00:00');

// ── Getters ───────────────────────────────────────────────────────────────────

function getCurrentUser()  { return _currentUser; }
function getAllUsers()      { return _allUsers; }
function getCurrentView()  { return _currentView; }
function getBracketState() { return _bracketState; }
function isCupStarted()    { return new Date() >= CUP_START; }
function isAdmin()         { return _currentUser === 'OFICIAL'; }

function getUserData(name) {
  return _allUsers[name || _currentUser] || null;
}

// ── Setters ───────────────────────────────────────────────────────────────────

function setCurrentUser(name)    { _currentUser  = name; }
function setAllUsers(data)       { _allUsers     = data; }
function setCurrentView(view)    { _currentView  = view; }
function setBracketState(state)  { _bracketState = state; }

/**
 * Cria usuário na memória se ainda não existir.
 * @param {string} name
 */
function ensureUser(name) {
  if (!_allUsers[name]) {
    _allUsers[name] = { palpites: createEmptyPalpites() };
  }
}

/**
 * Atualiza placar de um jogo nos palpites do usuário atual.
 * @param {string} grupo
 * @param {number} matchIdx
 * @param {'home'|'away'} side
 * @param {string} val
 */
function updateMatchScore(grupo, matchIdx, side, val) {
  const user  = getUserData();
  if (!user || !user.palpites[grupo]) return;
  const match = user.palpites[grupo][matchIdx];
  const key   = side === 'home' ? 'homeGoals' : 'awayGoals';
  match[key]  = val === '' ? '' : String(parseInt(val) || 0);
}

/**
 * Atualiza placar no bracket state.
 * @param {string} phase
 * @param {number} idx
 * @param {'home'|'away'} side
 * @param {string} val
 */
function updateBracketScore(phase, idx, side, val) {
  if (!_bracketState || !_bracketState[phase]?.[idx]) return;
  const key = side === 'home' ? 'homeGoals' : 'awayGoals';
  _bracketState[phase][idx][key] = val === '' ? '' : String(parseInt(val) || 0);
}

/**
 * Atualiza o time 3º classificado de um jogo das oitavas.
 * @param {number} idx
 * @param {string} val
 */
function updateBracketAway(idx, val) {
  if (!_bracketState?.r32?.[idx]) return;
  _bracketState.r32[idx].awayOverride = val;
  _bracketState.r32[idx].away = val || CHAVEAMENTO_TEMPLATE[idx]?.away?.placeholder || '?';
}

/**
 * Salva bracket no objeto do usuário atual.
 */
function persistBracketToUser() {
  const user = getUserData();
  if (!user || !_bracketState) return;
  user.bracket = JSON.parse(JSON.stringify(_bracketState)); // deep copy
}
