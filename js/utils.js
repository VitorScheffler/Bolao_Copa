// ── UTILITÁRIOS ───────────────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML para evitar XSS.
 * @param {*} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Exibe um toast flutuante por 2,5 segundos.
 * @param {string} msg
 */
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

/**
 * Retorna se um nome de time é um placeholder (não foi definido ainda).
 * @param {string} name
 * @returns {boolean}
 */
function isTbd(name) {
  if (!name) return true;
  return (
    name.startsWith('Venc.') ||
    name.startsWith('Vencedor') ||
    name.startsWith('3º') ||
    name.startsWith('1º') ||
    name.startsWith('2º')
  );
}

// ── TEMA ──────────────────────────────────────────────────────────────────────

function initTheme() {
  const saved      = localStorage.getItem('bolao_theme');
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved ? saved === 'dark' : preferDark);
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

// ── TELAS ─────────────────────────────────────────────────────────────────────

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
}

// ── NAVEGAÇÃO DE VIEWS ────────────────────────────────────────────────────────

const VIEW_RENDERERS = {}; // preenchido em app.js após cada módulo carregar

/**
 * Ativa uma view pelo nome e executa seu renderer se houver.
 * @param {string} name
 * @param {HTMLElement|null} btn  - botão que foi clicado (para marcar como active)
 */
function setView(name, btn) {
  setCurrentView(name);

  // Atualiza nav principal
  document.querySelectorAll('.main-nav .nav-btn').forEach(b => b.classList.remove('active'));
  if (btn?.closest('.main-nav')) btn.classList.add('active');

  // Atualiza todas as views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + name);
  if (!target) { console.error('View não encontrada:', name); return; }
  target.classList.add('active');

  // Chama o renderer registrado
  if (VIEW_RENDERERS[name]) VIEW_RENDERERS[name]();
}

/**
 * Registra um renderer para uma view.
 * @param {string} name
 * @param {Function} fn
 */
function registerView(name, fn) {
  VIEW_RENDERERS[name] = fn;
}

function togglePalpitesMenu(button) {
  const dropdown = button.parentElement;

  document.querySelectorAll('.nav-dropdown').forEach(el => {
    if (el !== dropdown) {
      el.classList.remove('open');
    }
  });

  dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-dropdown')) {
    document.querySelectorAll('.nav-dropdown').forEach(el => {
      el.classList.remove('open');
    });
  }
});

function selectPalpiteView(view, element) {
  setView(view, element);

  document.querySelectorAll('.nav-dropdown').forEach(el => {
    el.classList.remove('open');
  });
}