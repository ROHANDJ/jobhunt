/**
 * main.js — App entry point
 * Runs on DOMContentLoaded to initialize all pages.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Profile / skills
  renderSkills();
  loadProfileFields();     // restore from localStorage
  importProfileJSON();     // auto-load from profile.json if served via local server

  // ── Job board
  renderJobs();

  // ── Dashboard widgets
  buildBarChart();
  buildDashboardJobs();
  buildDashboardNews();
  buildDefaultActivity();
  updateStats();

  // ── Auto Apply
  buildFresherTips();
  updatePrev();

  // ── Daily Hub (init stats + streak pill even before page is opened)
  initDaily();
  const streak = calcStreak();
  const pill = document.getElementById('streak-pill');
  if (pill) pill.textContent = streak + '🔥';
  document.getElementById('pod-date') && (document.getElementById('pod-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }));

  // ── Keyboard shortcut: Escape closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-ov.open').forEach(m => m.classList.remove('open'));
    }
  });

  console.log('🚀 JobHunt Pro — Fresher Edition loaded!');
  console.log('📧 Gmail MCP: connected');
  console.log('🤖 Anthropic API: claude-sonnet-4-20250514');
});
