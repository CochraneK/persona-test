const STORAGE_KEY = 'persona_recent_tests_v1';
const LIMIT = 6;

function safeRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string') : [];
  } catch {
    return [];
  }
}

function safeWrite(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, LIMIT)));
  } catch {}
}

export function rememberTest(id, name) {
  if (!id || !name) return;
  const now = Date.now();
  const items = safeRead().filter((item) => item.id !== id);
  items.unshift({ id, name, at: now });
  safeWrite(items);
}

export function getRecentTests() {
  return safeRead().slice(0, LIMIT);
}

export function clearRecentTests() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
