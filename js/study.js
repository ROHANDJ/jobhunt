/**
 * study.js — MS Abroad / Higher Studies hub
 * Renders the Study page: timeline, university explorer (search + filter),
 * scholarships, exams, tips & tricks, playbook/resources, and a saved checklist.
 */

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function sStudyTab(tab, el) {
  document.querySelectorAll('#study-tabs .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('.study-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('st-' + tab);
  if (panel) panel.style.display = 'block';
}

// ─── MAIN ENTRY (called from nav) ─────────────────────────────────────────────
function initStudy() {
  renderStudyTimeline();
  renderStudyUnis('all');
  renderScholarships();
  renderExams();
  renderStudyTips();
  renderStudyResources();
  renderStudyChecklist();
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────
function renderStudyTimeline() {
  const el = document.getElementById('st-timeline-grid');
  if (!el) return;
  el.innerHTML = STUDY_TIMELINE.map(t => `
    <div class="card" style="border-left:3px solid ${t.sc};">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px;">
        <div style="font-size:20px;">${t.icon}</div>
        <div>
          <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:9px;background:${t.sc}20;color:${t.sc};border:1px solid ${t.sc}40;">${t.when}</span>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-top:4px;">${t.title}</div>
        </div>
      </div>
      <div style="font-size:11px;">
        ${t.items.map(i => `<div style="padding:5px 0;border-bottom:1px solid var(--border);display:flex;gap:6px;"><span style="color:${t.sc};">→</span><span style="color:var(--muted);">${i}</span></div>`).join('')}
      </div>
    </div>`).join('');
}

// ─── UNIVERSITY EXPLORER ──────────────────────────────────────────────────────
function renderStudyUnis(region, el) {
  if (el) {
    document.querySelectorAll('#uni-filters .fbtn').forEach(f => f.classList.remove('active'));
    el.classList.add('active');
  }
  const q = (document.getElementById('uni-search')?.value || '').toLowerCase();
  let list = STUDY_UNIS.filter(u => region === 'all' || u.region === region);
  if (q) list = list.filter(u =>
    u.name.toLowerCase().includes(q) || u.country.toLowerCase().includes(q) || u.program.toLowerCase().includes(q));

  const grid = document.getElementById('uni-grid');
  const ct   = document.getElementById('uni-ct');
  if (ct) ct.textContent = `(${list.length})`;
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `<div class="empty"><div class="emico">🔍</div><p class="emtxt">No universities match. Try another filter or search.</p></div>`;
    return;
  }

  grid.innerHTML = list.map(u => `
    <div class="jcard">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:9px;">
        <div style="display:flex;gap:9px;align-items:center;min-width:0;">
          <div style="font-size:24px;">${u.flag}</div>
          <div style="min-width:0;">
            <div style="font-weight:700;font-size:13px;line-height:1.25;">${u.name}</div>
            <div style="font-size:10.5px;color:var(--muted);">${u.country}</div>
          </div>
        </div>
        <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:9px;background:var(--ah);color:var(--accent);white-space:nowrap;">${u.rank}</span>
      </div>
      <div style="font-size:11.5px;font-weight:600;margin-bottom:9px;color:var(--sky);">${u.program}</div>
      <div style="font-size:11px;line-height:1.9;color:var(--muted);">
        <div>💵 <strong style="color:var(--text);">${u.tuition}</strong></div>
        <div>📝 ${u.tests}</div>
        <div>📅 Deadline: <strong style="color:var(--text);">${u.deadline}</strong></div>
        <div>🎁 ${u.funding}</div>
      </div>
      <a href="${u.link}" target="_blank" class="btn btn-g bsm" style="margin-top:11px;display:inline-block;text-decoration:none;">Official page ↗</a>
    </div>`).join('');
}

function filterUnisSearch() {
  const active = document.querySelector('#uni-filters .fbtn.active');
  const region = active ? (active.getAttribute('data-region') || 'all') : 'all';
  renderStudyUnis(region);
}

// ─── SCHOLARSHIPS ─────────────────────────────────────────────────────────────
function renderScholarships() {
  const el = document.getElementById('schol-grid');
  if (!el) return;
  el.innerHTML = STUDY_SCHOLARSHIPS.map(s => `
    <div class="jcard">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:7px;">
        <div style="font-weight:700;font-size:12.5px;">${s.flag} ${s.name}</div>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--green);margin-bottom:8px;">${s.amount}</div>
      <div style="font-size:11px;line-height:1.9;color:var(--muted);">
        <div>📍 ${s.where}</div>
        <div>👤 ${s.who}</div>
        <div>📅 Deadline: <strong style="color:var(--text);">${s.deadline}</strong></div>
      </div>
      <a href="${s.link}" target="_blank" class="btn btn-g bsm" style="margin-top:10px;display:inline-block;text-decoration:none;">Apply / info ↗</a>
    </div>`).join('');
}

// ─── EXAMS ────────────────────────────────────────────────────────────────────
function renderExams() {
  const el = document.getElementById('exam-grid');
  if (!el) return;
  el.innerHTML = STUDY_EXAMS.map(e => `
    <div class="card" style="border-top:3px solid ${e.sc};">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;">
        <div style="font-size:22px;">${e.icon}</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;">${e.name}</div>
      </div>
      <div style="font-size:11px;line-height:2;color:var(--muted);">
        <div>💸 Fee: <strong style="color:var(--text);">${e.cost}</strong></div>
        <div>⏳ Valid: ${e.valid}</div>
        <div>🎯 Target: <strong style="color:${e.sc};">${e.score}</strong></div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:9px;line-height:1.6;border-top:1px solid var(--border);padding-top:9px;">${e.note}</div>
      <a href="${e.link}" target="_blank" class="btn btn-g bsm" style="margin-top:10px;display:inline-block;text-decoration:none;">Register ↗</a>
    </div>`).join('');
}

// ─── TIPS & TRICKS ────────────────────────────────────────────────────────────
function renderStudyTips() {
  const el = document.getElementById('tips-grid');
  if (!el) return;
  el.innerHTML = STUDY_TIPS.map(t => `
    <div class="card" style="border-left:3px solid ${t.sc};">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:11px;">
        <div style="font-size:20px;">${t.icon}</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13.5px;">${t.title}</div>
      </div>
      <div style="font-size:11.5px;">
        ${t.items.map(i => `<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;gap:7px;line-height:1.55;"><span style="color:${t.sc};flex-shrink:0;">✦</span><span style="color:var(--muted);">${i}</span></div>`).join('')}
      </div>
    </div>`).join('');
}

// ─── PLAYBOOK / RESOURCES ─────────────────────────────────────────────────────
function renderStudyResources() {
  const el = document.getElementById('res-grid');
  if (!el) return;
  el.innerHTML = STUDY_RESOURCES.map(r => `
    <div class="card">
      <div class="stl" style="font-size:13px;margin-bottom:12px;">${r.cat}</div>
      ${r.links.map(l => `<a href="${l.u}" target="_blank" style="display:flex;gap:7px;padding:7px 0;border-bottom:1px solid var(--border);font-size:11.5px;color:var(--text);text-decoration:none;align-items:center;">
        <span style="color:var(--accent);">↗</span><span>${l.t}</span></a>`).join('')}
    </div>`).join('');
}

// ─── PERSONAL CHECKLIST (localStorage) ────────────────────────────────────────
const STUDY_CHECKLIST_ITEMS = [
  'Shortlisted 8–12 universities',
  'Registered for GRE (if needed)',
  'Booked IELTS / TOEFL',
  'Prepared & polished CV / resume',
  'Drafted first SOP',
  'Tailored SOP per university',
  'Requested 3 LORs',
  'Ordered official transcripts / WES',
  'Applied to 6+ scholarships',
  'Submitted all applications',
  'Emailed professors for RA/TA funding',
  'Arranged loan / proof of funds',
  'Received admit + accepted offer',
  'Started visa application',
];

function getStudyChecklist() {
  try { return JSON.parse(localStorage.getItem('li_study_checklist') || '{}'); }
  catch { return {}; }
}

function toggleChecklist(idx) {
  const state = getStudyChecklist();
  state[idx] = !state[idx];
  localStorage.setItem('li_study_checklist', JSON.stringify(state));
  renderStudyChecklist();
}

function renderStudyChecklist() {
  const el = document.getElementById('study-checklist');
  if (!el) return;
  const state = getStudyChecklist();
  const done  = STUDY_CHECKLIST_ITEMS.filter((_, i) => state[i]).length;
  const pct   = Math.round((done / STUDY_CHECKLIST_ITEMS.length) * 100);

  const bar = document.getElementById('checklist-bar');
  if (bar) bar.style.width = pct + '%';
  const lbl = document.getElementById('checklist-lbl');
  if (lbl) lbl.textContent = `${done}/${STUDY_CHECKLIST_ITEMS.length} done · ${pct}%`;

  el.innerHTML = STUDY_CHECKLIST_ITEMS.map((item, i) => {
    const checked = !!state[i];
    return `<label style="display:flex;gap:9px;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;cursor:pointer;align-items:center;${checked ? 'opacity:.55;' : ''}">
      <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleChecklist(${i})" style="accent-color:var(--accent);width:15px;height:15px;"/>
      <span style="${checked ? 'text-decoration:line-through;' : ''}">${item}</span>
    </label>`;
  }).join('');
}
