/**
 * state.js — Global application state with localStorage persistence.
 * Import and mutate S from any module.
 */

// ── Load persisted state from localStorage ────────────────────────────────────
function loadPersisted(key, fallback) {
  try {
    const raw = localStorage.getItem('jhp_' + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function persist(key, value) {
  try { localStorage.setItem('jhp_' + key, JSON.stringify(value)); } catch {}
}

const S = {
  apps:          loadPersisted('apps',           []),
  skills:        loadPersisted('skills',         ['Python', 'Data Structures', 'SQL', 'React', 'Git', 'Machine Learning', 'Java']),
  applied:       new Set(loadPersisted('applied', [])),
  recs:          loadPersisted('recs',           []),
  sentCt:        loadPersisted('sentCt',         0),
  newsCache:     null,
  emailVarIdx:   0,
  resumeFile:    null,

  // Daily Hub state
  learningLog:    loadPersisted('learningLog',    []),
  solvedProblems: loadPersisted('solvedProblems', []),
  dailyProblem:   loadPersisted('dailyProblem',   null),
  reminderTime:   loadPersisted('reminderTime',   null),
};

// ── Auto-save on mutation ─────────────────────────────────────────────────────
// Wrap with Proxy so any write triggers persistence
const handler = {
  set(target, prop, value) {
    target[prop] = value;
    if (['apps', 'skills', 'recs', 'sentCt'].includes(prop)) {
      persist(prop, value);
    }
    if (prop === 'applied' && value instanceof Set) {
      persist('applied', [...value]);
    }
    return true;
  },
};

// Note: Set.add/delete don't trigger the proxy setter, so we patch them
const origAdd    = Set.prototype.add;
const origDelete = Set.prototype.delete;
S.applied.add = function(v) {
  origAdd.call(this, v);
  persist('applied', [...this]);
  return this;
};
S.applied.delete = function(v) {
  origDelete.call(this, v);
  persist('applied', [...this]);
  return this;
};

// ── Profile fields: load from localStorage ────────────────────────────────────
function loadProfileFields() {
  const saved = loadPersisted('profile', null);
  if (!saved) return;
  const fields = ['p-name','p-email','p-phone','p-loc','p-col','p-deg','p-grad','p-cgpa','p-bio','p-li','p-gh'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && saved[id]) el.value = saved[id];
  });
}

function saveProfileFields() {
  const fields = ['p-name','p-email','p-phone','p-loc','p-col','p-deg','p-grad','p-cgpa','p-bio','p-li','p-gh'];
  const data   = {};
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });
  persist('profile', data);
}
