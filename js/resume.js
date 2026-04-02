/**
 * resume.js — Resume AI page
 * Upload resume, paste JD, get AI-powered ATS score + improvement tips.
 */

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────
function raiUp(input) {
  const file = input.files[0];
  if (!file) return;
  S.resumeFile = file;

  document.getElementById('rai-at').innerHTML = `
    <div class="fok-box" style="margin-top:7px;">
      <span>📄</span>
      <div>
        <div style="font-size:12px;font-weight:600;">${file.name}</div>
        <div style="font-size:9.5px;color:var(--muted);">${(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <span style="margin-left:auto;color:var(--green);font-weight:700;">✓</span>
    </div>
  `;
  toast('Resume uploaded!', 's');
}

// ─── ANALYZE ─────────────────────────────────────────────────────────────────
async function runRAI() {
  const jd   = document.getElementById('jd-txt').value;
  const role = document.getElementById('rai-role').value;
  const btn  = document.getElementById('rai-btn');

  btn.innerHTML = '<span class="spin"></span> Analyzing…';
  btn.disabled  = true;

  document.getElementById('sug-el').innerHTML = `
    <div style="color:var(--muted);font-size:12px;display:flex;align-items:center;gap:7px;">
      <div class="spin"></div>Getting AI tips for fresher…
    </div>
  `;

  const prompt = `You are an expert resume coach for fresh graduates in India targeting ${role} roles.
${jd ? 'Job Description:\n' + jd : '(No JD provided — give general fresher advice)'}

Give 5 highly specific, actionable resume improvement tips for a fresher.
Also provide an ATS compatibility score from 0 to 100.

Return ONLY this exact JSON structure (no markdown, no explanation):
{
  "tips": [
    { "icon": "emoji", "tip": "specific actionable advice here", "priority": "high|medium|low" }
  ],
  "atsScore": 72,
  "atsLabel": "Good Match",
  "improvements": ["quick win 1", "quick win 2"]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');

    let parsed = null;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch (e) { /* JSON parse failed */ }

    if (parsed) {
      renderATSScore(parsed);
      renderTips(parsed.tips);
    } else {
      document.getElementById('sug-el').innerHTML =
        '<div style="font-size:12px;color:var(--muted);">Got insights! Paste a specific JD for more targeted tips.</div>';
    }

  } catch (err) {
    document.getElementById('sug-el').innerHTML =
      '<div style="color:var(--red);font-size:12px;">⚠️ Could not reach AI. Check your connection and try again.</div>';
  }

  btn.innerHTML = '🤖 Analyze with AI';
  btn.disabled  = false;
}

// ─── RENDER RESULTS ───────────────────────────────────────────────────────────
function renderATSScore(data) {
  const score = data.atsScore || 65;
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--orange)' : 'var(--red)';

  const wins = data.improvements && data.improvements.length
    ? `<div style="margin-top:11px;">
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;">⚡ Quick Wins</div>
        ${data.improvements.map(i => `<div style="font-size:11.5px;padding:5px 0;border-bottom:1px solid var(--border);color:var(--muted);">→ ${i}</div>`).join('')}
      </div>`
    : '';

  document.getElementById('ats-el').innerHTML = `
    <div style="text-align:center;padding:10px;">
      <div style="font-family:'Syne',sans-serif;font-size:48px;font-weight:800;color:${color};">${score}</div>
      <div style="font-size:11.5px;color:var(--muted);">/ 100 · ${data.atsLabel || 'ATS Match Score'}</div>
      <div class="pbar-w" style="margin-top:9px;">
        <div class="pbar" style="width:${score}%;background:${color};"></div>
      </div>
    </div>
    ${wins}
  `;
}

function renderTips(tips) {
  if (!tips || !tips.length) {
    document.getElementById('sug-el').innerHTML =
      '<div class="empty"><div class="emico">🤖</div><p class="emtxt">No tips generated. Try again with a JD.</p></div>';
    return;
  }

  const priorityColor = {
    high:   'var(--red)',
    medium: 'var(--orange)',
    low:    'var(--green)',
  };

  document.getElementById('sug-el').innerHTML = tips.map(t => `
    <div style="padding:11px;background:var(--surface2);border-radius:9px;margin-bottom:7px;border-left:3px solid ${priorityColor[t.priority] || 'var(--accent)'};">
      <div style="font-size:12.5px;font-weight:600;margin-bottom:2px;">${t.icon} ${t.tip}</div>
      <div style="font-size:9.5px;font-weight:700;color:${priorityColor[t.priority] || 'var(--accent)'};">
        ${(t.priority || 'medium').toUpperCase()} PRIORITY
      </div>
    </div>
  `).join('');
}
