/**
 * ui.js — Shared UI utilities
 * Navigation, modals, toasts, settings, accent color
 */

// ─── PAGE TITLES ─────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: '⚡ Dashboard',
  jobs:      '🔍 Job Board',
  apply:     '✉️ Auto Apply',
  tracker:   '📊 Tracker',
  daily:     '🔥 Daily Hub',
  news:      '📰 Tech News',
  resume:    '🤖 Resume AI',
  roadmap:   '🗺️ DSA Roadmap',
  profile:   '👤 My Profile',
  settings:  '⚙️ Settings',
};

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function nav(pg, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));

  document.getElementById('pg-' + pg).classList.add('active');

  if (el) {
    el.classList.add('active');
  } else {
    document.querySelectorAll('.ni').forEach(n => {
      const oc = n.getAttribute('onclick') || '';
      if (oc.includes("'" + pg + "'")) n.classList.add('active');
    });
  }

  document.getElementById('page-ttl').textContent = PAGE_TITLES[pg] || pg;

  // Sync bottom nav
  syncBottomNav(pg);

  // Close mobile sidebar if open
  closeSidebar();

  // Page-specific init
  if (pg === 'news')    loadNews();
  if (pg === 'jobs')    renderJobs();
  if (pg === 'tracker') renderTracker();
  if (pg === 'roadmap') renderRoadmap();
  if (pg === 'daily')   initDaily();
}

// Bottom nav navigation (mobile)
function navMobile(pg, el) {
  nav(pg, null);
  document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  // Scroll to top on mobile
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function syncBottomNav(pg) {
  const map = { dashboard: 'bn-dashboard', jobs: 'bn-jobs', daily: 'bn-daily', apply: 'bn-apply', profile: 'bn-profile' };
  document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
  if (map[pg]) document.getElementById(map[pg])?.classList.add('active');
}

// ─── MOBILE SIDEBAR ───────────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const isOpen   = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function openM(id)  { document.getElementById(id).classList.add('open'); }
function closeM(id) { document.getElementById(id).classList.remove('open'); }

// Close modal when clicking backdrop
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-ov').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
});

// ─── TOASTS ──────────────────────────────────────────────────────────────────
/**
 * Show a toast notification.
 * @param {string} msg   - Message to display
 * @param {string} type  - 's' (success), 'e' (error), 'i' (info)
 * @param {number} dur   - Duration in ms (default 3500)
 */
function toast(msg, type = 'i', dur = 3500) {
  const icons = { s: '✅', e: '❌', i: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast t${type}_`;
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toastc').appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(16px)';
    el.style.transition = 'all 0.3s';
    setTimeout(() => el.remove(), 300);
  }, dur);
}

// ─── GLOBAL SEARCH ───────────────────────────────────────────────────────────
function doSearch(q) {
  if (!q) { renderJobs(); return; }
  const matches = JOBS.filter(j =>
    j.title.toLowerCase().includes(q.toLowerCase()) ||
    j.company.toLowerCase().includes(q.toLowerCase()) ||
    j.tags.some(t => t.toLowerCase().includes(q.toLowerCase()))
  );
  if (document.getElementById('pg-jobs').classList.contains('active')) {
    document.getElementById('jct').textContent = `(${matches.length} results for "${q}")`;
    renderJobCards(matches);
  }
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function saveSettings() {
  toast('Settings saved!', 's');
}

function setAcc(color) {
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--ah', color + '22');
  toast('Theme updated!', 's');
}

// ─── QUICK APPLY MODAL ───────────────────────────────────────────────────────
function doQA() {
  const co    = document.getElementById('qac').value;
  const pos   = document.getElementById('qap').value;
  const email = document.getElementById('qae').value;
  if (!co || !pos || !email) { toast('Fill all fields!', 'e'); return; }

  addToTracker({ title: pos, company: co, logo: '⚡', rec: email });
  addAct(`Quick applied to <strong>${pos}</strong> at ${co}`, '⚡', 'var(--orange)');
  closeM('qa-modal');
  updateStats();
  toast(`Applied to ${co}!`, 's');

  // Clear form
  ['qac', 'qap', 'qae', 'qan'].forEach(id => document.getElementById(id).value = '');
}
