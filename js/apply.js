/**
 * apply.js — Auto Apply page: email composer, recruiter tags,
 *            resume upload, SMTP send via local mail server.
 *
 * Email sending flow:
 *   1. User fills the composer form + adds recruiter emails
 *   2. Clicks "Send via SMTP" → browser calls localhost:3001/api/send-bulk
 *   3. Local mail-server.js (nodemailer + Gmail App Password) sends real emails
 *   4. Attachments work — resume PDF is read as base64, sent to server
 *
 * Start the mail server once before using:
 *   npm run mail-server
 *   (or: node automation/mail-server.js)
 */

const MAIL_SERVER = 'http://localhost:3001';

// ─── MAIL SERVER STATUS ───────────────────────────────────────────────────────
let _serverOnline = false;

async function checkMailServer(silent = false) {
  try {
    const res  = await fetch(`${MAIL_SERVER}/api/status`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    _serverOnline = data.ok === true;
  } catch {
    _serverOnline = false;
  }
  updateServerPill(_serverOnline);
  if (!silent && !_serverOnline) showServerOfflineHint();
  return _serverOnline;
}

function updateServerPill(online) {
  const pill = document.getElementById('smtp-pill');
  if (!pill) return;
  if (online) {
    pill.innerHTML = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);margin-right:5px;"></span>SMTP Ready';
    pill.style.color = 'var(--green)';
  } else {
    pill.innerHTML = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--red);margin-right:5px;"></span>Mail Server Offline';
    pill.style.color = 'var(--red)';
  }
}

function showServerOfflineHint() {
  const el = document.getElementById('smtp-hint');
  if (!el) return;
  el.style.display = 'block';
}

function hideServerOfflineHint() {
  const el = document.getElementById('smtp-hint');
  if (el) el.style.display = 'none';
}

// Poll server status every 10 seconds
setInterval(() => checkMailServer(true), 10000);

// ─── FILE → BASE64 ────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      // result is "data:application/pdf;base64,<b64>" — strip the prefix
      const b64 = reader.result.split(',')[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── LIVE PREVIEW ─────────────────────────────────────────────────────────────
function updatePrev() {
  const name    = document.getElementById('c-name').value    || 'Your Name';
  const role    = document.getElementById('c-role').value    || 'Software Engineer';
  const skills  = document.getElementById('c-skills').value  || 'Python, DSA, SQL';
  const college = document.getElementById('c-college').value || 'XYZ University';
  const cgpa    = document.getElementById('c-cgpa').value;

  document.getElementById('prev-subj').textContent =
    `Subject: Application for ${role} — ${name}`;
  document.getElementById('prev-body').innerHTML =
    EMAIL_VARIATIONS[S.emailVarIdx || 0](name, role, skills, `${college}${cgpa ? ', ' + cgpa : ''}`);
}

function regenEmail() {
  const name    = document.getElementById('c-name').value    || 'Your Name';
  const role    = document.getElementById('c-role').value    || 'Software Engineer';
  const skills  = document.getElementById('c-skills').value  || 'Python, ML';
  const college = document.getElementById('c-college').value || 'XYZ University';

  S.emailVarIdx = ((S.emailVarIdx || 0) + 1) % EMAIL_VARIATIONS.length;
  document.getElementById('prev-subj').textContent =
    `Subject: Application for ${role} — ${name}`;
  document.getElementById('prev-body').innerHTML =
    EMAIL_VARIATIONS[S.emailVarIdx](name, role, skills, college);

  toast('Email regenerated!', 's');
}

async function aiGenEmail() {
  if (!hasAIKey()) {
    toast('Add your free Gemini API key in Settings to use AI generation!', 'w', 4000);
    return;
  }

  const name    = document.getElementById('c-name').value    || 'Your Name';
  const role    = document.getElementById('c-role').value    || 'Software Engineer';
  const skills  = document.getElementById('c-skills').value  || 'Python, DSA, SQL';
  const college = document.getElementById('c-college').value || 'Your University';
  const cgpa    = document.getElementById('c-cgpa').value;

  const btn = document.getElementById('aigen-btn');
  if (btn) { btn.innerHTML = '<span class="spin"></span>'; btn.disabled = true; }

  const prompt = `Write a short professional job application email for a fresher.

Candidate: ${name}, from ${college}${cgpa ? ', CGPA ' + cgpa : ''}
Applying for: ${role}
Key skills: ${skills}

Rules:
- 3 short paragraphs only
- Professional but enthusiastic tone
- End with a CTA asking for a 10-minute call
- No markdown, no HTML, no bullet points — plain text only
- Max 150 words total
- Do NOT include a subject line or "Dear X" — start from the first body paragraph`;

  const text = await callAI(prompt, 400);
  if (text) {
    document.getElementById('prev-body').innerText = text.trim();
    toast('AI email generated! ✨', 's');
  } else {
    toast('AI generation failed — using template instead', 'w');
  }

  if (btn) { btn.innerHTML = '✨ AI Generate'; btn.disabled = false; }
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

// Load REAL fresher job leads (≤1yr exp) discovered by `runner.js leads`.
// Only adds leads that have a genuine published contact email — no guessed
// generic addresses. Leads that only have an apply URL are reported, not emailed.
async function loadRealLeads() {
  const online = await checkMailServer();
  if (!online) {
    toast('Start the mail server first: npm run mail-server', 'e', 6000);
    return;
  }
  try {
    const res  = await fetch(`${MAIL_SERVER}/api/job-leads`);
    const data = await res.json();
    if (!data.ok || !data.count) {
      toast('No leads yet. Run: node automation/runner.js leads', 'w', 6000);
      return;
    }
    const emailable = data.leads.filter(l => l.contactEmail);
    let added = 0;
    emailable.forEach(l => { if (!S.recs.includes(l.contactEmail)) { S.recs.push(l.contactEmail); added++; } });
    renderRecTags();
    updateTargetCompanies();

    const urlOnly = data.count - data.withEmail;
    if (added) toast(`Added ${added} real fresher contact(s) ✅`, 's', 4000);
    else       toast('No leads have a public email — apply via their URL or use the LinkedIn module', 'w', 6000);
    if (urlOnly > 0) toast(`${urlOnly} more lead(s) have only an apply link (see Jobs page)`, 'i', 5000);
  } catch (e) {
    toast(`Could not load leads: ${e.message}`, 'e', 6000);
  }
}

function addHRContacts() {
  const scraped = JSON.parse(localStorage.getItem('jhp_hrContacts') || '[]');
  if (!scraped.length) {
    toast('No scraped HR contacts yet. Run the LinkedIn HR Scraper first!', 'w', 4000);
    return;
  }
  let added = 0;
  scraped.forEach(c => {
    if (c.email && !S.recs.includes(c.email)) { S.recs.push(c.email); added++; }
  });
  renderRecTags();
  updateTargetCompanies();
  toast(`Added ${added} scraped HR contacts!`, 's');
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
  const el = document.getElementById('rec-tags');
  if (!el) return;
  el.innerHTML = S.recs.map(e => `
    <span class="rtag">
      ${e}
      <span class="rx" onclick="removeRec('${e}')">×</span>
    </span>
  `).join('');
}

function updateTargetCompanies() {
  const el = document.getElementById('tgt-cos');
  if (!el) return;
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
  toast('Resume attached — will be included in every email! 📎', 's');
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

// ─── SMTP SEND ────────────────────────────────────────────────────────────────
async function sendEmails() {
  if (!S.recs.length) { toast('Add at least one recruiter email!', 'e'); return; }

  const name    = document.getElementById('c-name').value.trim();
  const myEmail = document.getElementById('c-email').value.trim();
  if (!name || !myEmail) { toast('Enter your name and Gmail address!', 'e'); return; }

  // Check mail server
  const online = await checkMailServer();
  if (!online) {
    showServerOfflineHint();
    toast('Mail server is offline. Start it with: npm run mail-server', 'e', 6000);
    return;
  }

  const role    = document.getElementById('c-role').value;
  const subject = document.getElementById('prev-subj').textContent.replace('Subject: ', '');
  const body    = document.getElementById('prev-body').innerText;

  const btn = document.getElementById('sendbtn');
  btn.innerHTML = '<span class="spin"></span> Sending…';
  btn.disabled  = true;

  // Convert resume to base64 if uploaded
  let resumeBase64 = null;
  let resumeName   = null;
  if (S.resumeFile) {
    try {
      resumeBase64 = await fileToBase64(S.resumeFile);
      resumeName   = S.resumeFile.name;
      toast('Resume attached to all emails 📎', 's');
    } catch (e) {
      warn('Could not read resume file:', e);
    }
  }

  // Build recipients list
  const recipients = S.recs.map(to => ({ to, subject, body }));

  try {
    const res = await fetch(`${MAIL_SERVER}/api/send-bulk`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: { subject, body, senderName: name, resumeBase64, resumeName },
        recipients,
      }),
    });

    const data = await res.json();

    if (!data.ok) throw new Error(data.error || 'Send failed');

    // Log each recipient
    data.results.forEach(r => {
      if (r.ok) logSentEmail(r.to, role, name);
    });

    S.sentCt += data.sent;
    updateStats?.();
    updateCampaignStats();

    const failMsg = data.failed > 0 ? ` (${data.failed} failed — check terminal)` : '';
    toast(`✅ ${data.sent} email(s) sent via SMTP!${failMsg}`, 's', 5000);
    addAct?.(`Sent ${data.sent} application(s) for <strong>${role}</strong>`, '✉️', 'var(--green)');

    if (resumeBase64) {
      addAct?.(`Resume attached to all emails`, '📎', 'var(--sky)');
    }

  } catch (e) {
    toast(`Send error: ${e.message}`, 'e', 6000);
    console.error('[SMTP send]', e);
  }

  btn.innerHTML = '📤 Send via SMTP';
  btn.disabled  = false;
}

// ─── SENT LOG ─────────────────────────────────────────────────────────────────
function logSentEmail(rec, role, senderName) {
  const log = document.getElementById('slog');
  if (!log) return;
  const empty = log.querySelector('.empty');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = 'slog-item';
  item.innerHTML = `
    <span style="font-size:16px;">✉️</span>
    <div style="flex:1;">
      <div style="font-size:12px;font-weight:600;">${role} → ${rec}</div>
      <div style="font-size:10px;color:var(--muted);">Sent via SMTP · by ${senderName}${S.resumeFile ? ' · 📎 resume attached' : ''}</div>
    </div>
    <div style="font-size:10px;color:var(--muted);">${new Date().toLocaleTimeString()}</div>
  `;
  log.prepend(item);

  const ct = document.getElementById('sent-ct');
  if (ct) ct.textContent = (parseInt(ct.textContent) || 0) + 1 + ' sent';

  const company = rec.split('@')[1]?.split('.')[0] || 'Company';
  addToTracker?.({ title: role, company, logo: '✉️', rec });
}

function updateCampaignStats() {
  const tot = document.getElementById('cs-tot');
  const wk  = document.getElementById('cs-wk');
  if (tot) tot.textContent = S.sentCt;
  if (wk)  wk.textContent  = S.sentCt;
}

// ─── TIPS ─────────────────────────────────────────────────────────────────────
function buildFresherTips() {
  const el = document.getElementById('ftips');
  if (!el) return;
  el.innerHTML = FRESHER_TIPS.map(t => `
    <div class="tipitem">
      <span>${t.i}</span>
      <div class="tiptxt">${t.t}</div>
    </div>
  `).join('');
}
