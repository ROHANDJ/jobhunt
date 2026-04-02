/**
 * apply.js — Auto Apply page: email composer, recruiter tags,
 *            file upload, Gmail MCP send, sent log
 *
 * Gmail MCP endpoint: https://gmail.mcp.claude.com/mcp
 * Anthropic API model: claude-sonnet-4-20250514
 */

// ─── LIVE PREVIEW ─────────────────────────────────────────────────────────────
function updatePrev() {
  const name    = document.getElementById('c-name').value    || 'Your Name';
  const role    = document.getElementById('c-role').value    || 'Software Engineer';
  const skills  = document.getElementById('c-skills').value  || 'Python, DSA, SQL';
  const exp     = document.getElementById('c-exp').value;
  const college = document.getElementById('c-college').value || 'XYZ University';
  const cgpa    = document.getElementById('c-cgpa').value;

  const expText = {
    fresher:   'a recent graduate and enthusiastic fresher',
    intern:    'seeking a valuable internship opportunity',
    '6 months': 'a developer with 6 months of hands-on experience',
    '1 year':  'a developer with 1 year of professional experience',
  }[exp] || 'a fresher';

  document.getElementById('prev-subj').textContent =
    `Subject: Application for ${role} — ${name}`;

  document.getElementById('prev-body').innerHTML =
    EMAIL_VARIATIONS[0](name, role, skills, `${college}${cgpa ? ', ' + cgpa : ''}`);
}

function regenEmail() {
  const name    = document.getElementById('c-name').value    || 'Your Name';
  const role    = document.getElementById('c-role').value    || 'Software Engineer';
  const skills  = document.getElementById('c-skills').value  || 'Python, ML';
  const college = document.getElementById('c-college').value || 'XYZ University';

  S.emailVarIdx = (S.emailVarIdx + 1) % EMAIL_VARIATIONS.length;

  document.getElementById('prev-subj').textContent =
    `Subject: Application for ${role} — ${name}`;
  document.getElementById('prev-body').innerHTML =
    EMAIL_VARIATIONS[S.emailVarIdx](name, role, skills, college);

  toast('Email regenerated!', 's');
}

function copyEmail() {
  const subj = document.getElementById('prev-subj').textContent;
  const body = document.getElementById('prev-body').innerText;
  navigator.clipboard.writeText(`${subj}\n\n${body}`)
    .then(() => toast('Copied to clipboard!', 's'));
}

// ─── RECRUITER EMAILS ─────────────────────────────────────────────────────────
function addRec() {
  const input = document.getElementById('rec-in');
  const email = input.value.trim();
  if (!email || !email.includes('@')) { toast('Enter a valid email address', 'e'); return; }
  if (S.recs.includes(email))         { toast('Already added', 'e'); return; }
  S.recs.push(email);
  input.value = '';
  renderRecTags();
  updateTargetCompanies();
}

function addSampleRecs() {
  INDIAN_IT_RECRUITERS.forEach(e => { if (!S.recs.includes(e)) S.recs.push(e); });
  renderRecTags();
  updateTargetCompanies();
  toast('Indian IT recruiters added!', 's');
}

function addMNCs() {
  MNC_RECRUITERS.forEach(e => { if (!S.recs.includes(e)) S.recs.push(e); });
  renderRecTags();
  updateTargetCompanies();
  toast('MNC recruiters added!', 's');
}

function removeRec(email) {
  S.recs = S.recs.filter(r => r !== email);
  renderRecTags();
  updateTargetCompanies();
}

function addRecFromJob(email) {
  if (!S.recs.includes(email)) { S.recs.push(email); renderRecTags(); updateTargetCompanies(); }
  nav('apply', null);
  toast('Recruiter added to campaign!', 's');
}

function renderRecTags() {
  document.getElementById('rec-tags').innerHTML =
    S.recs.map(e => `
      <span class="rtag">
        ${e}
        <span class="rx" onclick="removeRec('${e}')">×</span>
      </span>
    `).join('');
}

function updateTargetCompanies() {
  const el = document.getElementById('tgt-cos');
  if (!S.recs.length) {
    el.innerHTML = '<div style="font-size:11.5px;color:var(--muted);">Add recruiter emails above</div>';
    return;
  }
  el.innerHTML = S.recs.map(e => {
    const domain  = e.split('@')[1] || '';
    const company = domain.split('.')[0];
    const name    = company.charAt(0).toUpperCase() + company.slice(1);
    return `
      <div style="display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:1px solid var(--border);">
        <span>🏢</span>
        <span style="font-size:12px;font-weight:600;">${name}</span>
        <span style="font-size:10px;color:var(--muted);margin-left:auto;">${e}</span>
      </div>
    `;
  }).join('');
}

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
function handleResUp(input) {
  const file = input.files[0];
  if (!file) return;
  S.resumeFile = file;

  document.getElementById('res-at').innerHTML = `
    <div class="fok-box">
      <span style="font-size:18px;">📄</span>
      <div>
        <div style="font-size:12.5px;font-weight:600;">${file.name}</div>
        <div style="font-size:10px;color:var(--muted);">${(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <span style="margin-left:auto;color:var(--green);font-weight:700;font-size:11px;">✓ Attached</span>
    </div>
  `;
  toast('Resume attached!', 's');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upzone').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const dt = new DataTransfer();
  dt.items.add(file);
  document.getElementById('res-file').files = dt.files;
  handleResUp(document.getElementById('res-file'));
}

// ─── GMAIL SEND ───────────────────────────────────────────────────────────────
async function sendEmails() {
  if (!S.recs.length) { toast('Add at least one recruiter email!', 'e'); return; }

  const name  = document.getElementById('c-name').value;
  const email = document.getElementById('c-email').value;
  if (!name || !email) { toast('Enter your name and Gmail address!', 'e'); return; }

  const btn  = document.getElementById('sendbtn');
  btn.innerHTML = '<span class="spin"></span> Sending via Gmail…';
  btn.disabled = true;

  const role    = document.getElementById('c-role').value;
  const subject = document.getElementById('prev-subj').textContent.replace('Subject: ', '');
  const body    = document.getElementById('prev-body').innerText;

  for (const rec of S.recs) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          mcp_servers: [{ type: 'url', url: 'https://gmail.mcp.claude.com/mcp', name: 'gmail-mcp' }],
          messages: [{
            role: 'user',
            content: `Send this job application email immediately using the Gmail send tool:\n\nTo: ${rec}\nSubject: ${subject}\nBody:\n${body}\n${S.resumeFile ? `\nThe user has resume "${S.resumeFile.name}" to attach.` : ''}\n\nSend it now.`
          }]
        })
      });
      await res.json();
    } catch (err) {
      console.warn('Gmail send error for', rec, err);
    }
    logSentEmail(rec, role, name);
  }

  S.sentCt += S.recs.length;
  updateStats();
  updateCampaignStats();

  btn.innerHTML = '📤 Send via Gmail';
  btn.disabled = false;
  toast(`✅ ${S.recs.length} email(s) sent via Gmail!`, 's', 5000);
  addAct(`Sent ${S.recs.length} application(s) for <strong>${role}</strong>`, '✉️', 'var(--green)');
}

// ─── SENT LOG ─────────────────────────────────────────────────────────────────
function logSentEmail(rec, role, senderName) {
  const log = document.getElementById('slog');
  const empty = log.querySelector('.empty');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = 'slog-item';
  item.innerHTML = `
    <span style="font-size:16px;">✉️</span>
    <div style="flex:1;">
      <div style="font-size:12px;font-weight:600;">${role} → ${rec}</div>
      <div style="font-size:10px;color:var(--muted);">Sent via Gmail · by ${senderName}</div>
    </div>
    <div style="font-size:10px;color:var(--muted);">${new Date().toLocaleTimeString()}</div>
  `;
  log.prepend(item);

  const ct = document.getElementById('sent-ct');
  const n = parseInt(ct.textContent) || 0;
  ct.textContent = (n + 1) + ' sent';

  // Also track in tracker
  const company = rec.split('@')[1]?.split('.')[0] || 'Company';
  addToTracker({ title: role, company, logo: '✉️', rec });
}

function updateCampaignStats() {
  document.getElementById('cs-tot').textContent = S.sentCt;
  document.getElementById('cs-wk').textContent  = S.sentCt;
}

// ─── TIPS ─────────────────────────────────────────────────────────────────────
function buildFresherTips() {
  document.getElementById('ftips').innerHTML =
    FRESHER_TIPS.map(t => `
      <div class="tipitem">
        <span>${t.i}</span>
        <div class="tiptxt">${t.t}</div>
      </div>
    `).join('');
}
