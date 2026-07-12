/**
 * main.js — App entry point
 * Runs on DOMContentLoaded to initialize all pages.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Profile / skills
  renderSkills();
  loadProfileFields();
  importProfileJSON();

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

  // ── Daily Hub
  initDaily();
  const streak = calcStreak();
  const pill = document.getElementById('streak-pill');
  if (pill) pill.textContent = streak + '🔥';
  const podDate = document.getElementById('pod-date');
  if (podDate) podDate.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── HR Contacts: update sidebar count
  updateHRCount();

  // ── Check mail server status on startup (silent — just updates the pill)
  checkMailServer(true);

  // ── Load saved API key status into settings when navigating there
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-ov.open').forEach(m => m.classList.remove('open'));
    }
  });

  console.log('🔒 Locked In loaded! Careers + MS Abroad · AI: Gemini (free) + Anthropic (fallback)');
});

// ─── HR CONTACTS (LinkedIn Scraper) ─────────────────────────────────────────

function loadHRContacts() {
  const contacts = getHRContacts();
  const el       = document.getElementById('hr-contacts-list');
  const total    = document.getElementById('hr-total');
  if (!el) return;

  if (total) total.textContent = `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`;
  updateHRCount();

  if (!contacts.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="emico">🎯</div>
        <p class="emtxt">No HR contacts yet. Run:<br/><code style="font-size:10px;background:var(--surface2);padding:2px 7px;border-radius:4px;">node automation/runner.js scrape-hr</code></p>
      </div>`;
    return;
  }

  el.innerHTML = contacts.map((c, i) => `
    <div style="display:flex;align-items:flex-start;gap:11px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="width:34px;height:34px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">
        ${c.name ? c.name[0].toUpperCase() : '👤'}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12.5px;font-weight:600;">${c.name || 'HR / Recruiter'}</div>
        <div style="font-size:10.5px;color:var(--muted);">${c.company || ''} ${c.position ? '· ' + c.position : ''}</div>
        <div style="font-size:10.5px;color:var(--accent);margin-top:2px;">${c.email || ''}</div>
        ${c.linkedinUrl ? `<a href="${c.linkedinUrl}" target="_blank" style="font-size:9.5px;color:var(--muted);">View on LinkedIn ↗</a>` : ''}
        ${c.scrapedAt ? `<div style="font-size:9px;color:var(--muted);margin-top:2px;">Scraped ${new Date(c.scrapedAt).toLocaleDateString('en-IN')}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
        <button class="btn btn-p bsm" style="font-size:9.5px;padding:3px 8px;" onclick="addSingleHR('${c.email}')">✉ Add</button>
        <button class="btn btn-g bsm" style="font-size:9.5px;padding:3px 8px;" onclick="deleteHRContact(${i})">🗑</button>
      </div>
    </div>
  `).join('');
}

function getHRContacts() {
  try {
    return JSON.parse(localStorage.getItem('jhp_hrContacts') || '[]');
  } catch { return []; }
}

function saveHRContacts(contacts) {
  localStorage.setItem('jhp_hrContacts', JSON.stringify(contacts));
  updateHRCount();
}

function updateHRCount() {
  const n  = getHRContacts().length;
  const el = document.getElementById('hr-count');
  if (el) el.textContent = n > 0 ? n : '0';
}

function addManualHR() {
  const name     = document.getElementById('hr-name')?.value?.trim();
  const email    = document.getElementById('hr-email')?.value?.trim();
  const company  = document.getElementById('hr-company')?.value?.trim();
  const position = document.getElementById('hr-position')?.value?.trim();

  if (!email || !email.includes('@')) { toast('Enter a valid email', 'e'); return; }

  const contacts = getHRContacts();
  if (contacts.some(c => c.email === email)) { toast('Contact already exists', 'e'); return; }

  contacts.unshift({ name, email, company, position, scrapedAt: new Date().toISOString(), source: 'manual' });
  saveHRContacts(contacts);
  loadHRContacts();

  ['hr-name','hr-email','hr-company','hr-position'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  toast(`HR contact added: ${name || email}`, 's');
}

function addSingleHR(email) {
  if (!email) return;
  if (!S.recs.includes(email)) {
    S.recs.push(email);
    renderRecTags();
    updateTargetCompanies();
    toast(`${email} added to campaign!`, 's');
  } else {
    toast('Already in campaign', 'w');
  }
}

function addHRContactsToCampaign() {
  const contacts = getHRContacts();
  if (!contacts.length) { toast('No HR contacts to add', 'w'); return; }
  let added = 0;
  contacts.forEach(c => {
    if (c.email && !S.recs.includes(c.email)) { S.recs.push(c.email); added++; }
  });
  renderRecTags();
  updateTargetCompanies();
  nav('apply', null);
  toast(`Added ${added} HR contact(s) to email campaign!`, 's', 4000);
}

function deleteHRContact(idx) {
  const contacts = getHRContacts();
  contacts.splice(idx, 1);
  saveHRContacts(contacts);
  loadHRContacts();
  toast('Contact removed', 's');
}

function clearHRContacts() {
  if (!confirm('Clear all scraped HR contacts?')) return;
  saveHRContacts([]);
  loadHRContacts();
  toast('All HR contacts cleared', 's');
}
