// ── API ───────────────────────────────────────────────────────────────────────
// Comunicação com o servidor PHP. Fallback para localStorage quando offline.

const LS_KEY = 'bolao_data';

/**
 * Carrega todos os usuários do servidor.
 * Em caso de falha, tenta o localStorage.
 * @returns {Promise<void>}
 */
async function loadFromServer() {
  try {
    const res  = await fetch('api/load.php');
    const data = await res.json();
    if (data?.users) {
      setAllUsers(data.users);
    }
  } catch {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try { setAllUsers(JSON.parse(saved)); } catch { /* JSON inválido */ }
    }
  }
}

/**
 * Salva os dados do usuário atual no servidor.
 * Sempre persiste também no localStorage como backup.
 * @returns {Promise<void>}
 */
async function saveToServer() {
  const user = getCurrentUser();
  if (!user) return;

  const payload = {
    userName: user,
    userData: getAllUsers()[user],
  };

  try {
    const res = await fetch('api/save.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('saveToServer falhou, usando localStorage:', err);
  }

  // Backup local sempre
  localStorage.setItem(LS_KEY, JSON.stringify(getAllUsers()));
}
