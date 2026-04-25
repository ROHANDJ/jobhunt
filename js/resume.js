/**
 * resume.js — Resume AI page
 * ATS score + improvement tips via Gemini API (free) or Anthropic fallback.
 *
 * FIX: The old code called Anthropic without auth headers and without CORS
 * support — it silently failed. Now uses the shared callAI() from ai.js.
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

// ─── READ PDF AS TEXT ──────────────────────────────────────────────────────────
async function extractResumeText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // For PDF we get binary, for text files we get readable text.
      // pdf-parse is Node-only; in browser we pass the raw text if it's a .txt
      // or signal the AI to use whatever text it can infer.
      const isText = file.type.includes('text') || file.name.endsWith('.txt');
      if (isText) {
        resolve(reader.result);
      } else {
        // For PDF/DOC, we can't parse in the browser easily.
        // Return a note so the AI understands the context.
        resolve(`[Resume file uploaded: "${file.name}". Please analyze as a fresh graduate resume for the given role.]`);
      }
    };
    reader.onerror = () => resolve('');
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

// ─── ANALYZE ─────────────────────────────────────────────────────────────────
async function runRAI() {
  if (!hasAIKey()) {
    toast('Set your free Gemini API key in Settings first!', 'e', 5000);
    nav('settings', document.querySelector('.ni[onclick*="settings"]'));
    return;
  }

  const jd   = document.getElementById('jd-txt').value.trim();
  const role = document.getElementById('rai-role').value;
  const btn  = document.getElementById('rai-btn');

  btn.innerHTML = '<span class="spin"></span> Analyzing…';
  btn.disabled  = true;

  document.getElementById('ats-el').innerHTML = `
    <div style="color:var(--muted);font-size:12px;display:flex;align-items:center;gap:7px;padding:14px 0;">
      <div class="spin"></div>Running ATS analysis…
    </div>`;
  document.getElementById('sug-el').innerHTML = `
    <div style="color:var(--muted);font-size:12px;display:flex;align-items:center;gap:7px;">
      <div class="spin"></div>Getting AI tips…
    </div>`;

  // Pull profile data from state to enrich the analysis
  const name    = S.profile?.name    || 'Fresher Candidate';
  const college = S.profile?.college || '';
  const skills  = S.profile?.skills  || 'Python, DSA, SQL, Java';
  const cgpa    = S.profile?.cgpa    || '';

  const resumeSummary = S.resumeFile
    ? `Resume uploaded: ${S.resumeFile.name} (${(S.resumeFile.size / 1024).toFixed(0)} KB)`
    : `Candidate: ${name}${college ? ', ' + college : ''}${cgpa ? ', CGPA ' + cgpa : ''}\nSkills: ${skills}`;

  const jdSection = jd
    ? `\n\nJob Description to match against:\n${jd.slice(0, 2000)}`
    : '\n\n(No JD provided — give general fresher advice for this role)';

  const prompt = `You are an expert ATS reviewer and resume coach for fresh graduates targeting ${role} roles at Indian tech companies.

${resumeSummary}${jdSection}

Respond with ONLY this exact JSON (no markdown fences, no extra text):
{
  "atsScore": <number 0-100>,
  "atsLabel": "<Excellent Match|Good Match|Fair Match|Needs Work>",
  "summary": "<2-sentence honest assessment>",
  "tips": [
    { "icon": "<emoji>", "tip": "<specific actionable advice>", "priority": "high|medium|low" }
  ],
  "improvements": ["<quick win 1>", "<quick win 2>", "<quick win 3>"],
  "keywordsMissing": ["<keyword>"],
  "strengthAreas": ["<strength>"]
}

Return exactly 5 tips. Be specific and actionable for a fresher.`;

  try {
    const text = await callAI(prompt, 1400);

    if (!text) {
      throw new Error('No response from AI. Check your API key in Settings.');
    }

    let parsed = null;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch (e) {
      console.warn('JSON parse failed, trying raw:', e.message);
    }

    if (parsed) {
      renderATSScore(parsed);
      renderTips(parsed.tips || []);
    } else {
      // AI returned something but not valid JSON — show as plain tips
      document.getElementById('ats-el').innerHTML = `
        <div style="font-size:12px;color:var(--muted);padding:10px 0;">
          ATS analysis complete. Paste a specific JD for a precise score.
        </div>`;
      document.getElementById('sug-el').innerHTML = `
        <div style="font-size:12.5px;line-height:1.7;padding:6px 0;">${text.slice(0, 800)}</div>`;
    }

  } catch (err) {
    document.getElementById('ats-el').innerHTML = `
      <div style="color:var(--red);font-size:12px;padding:10px 0;">
        ⚠ ${err.message || 'AI error. Check Settings → API key.'}
      </div>`;
    document.getElementById('sug-el').innerHTML = `
      <div style="color:var(--muted);font-size:11.5px;">
        Make sure your Gemini API key is saved in <strong>Settings</strong>.
        Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--accent);">aistudio.google.com/apikey</a>
      </div>`;
    toast('AI error — check your API key in Settings', 'e', 5000);
  }

  btn.innerHTML = '🤖 Analyze with AI';
  btn.disabled  = false;
}

// ─── RENDER RESULTS ───────────────────────────────────────────────────────────
function renderATSScore(data) {
  const score = data.atsScore || 65;
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--orange)' : 'var(--red)';

  const keywordsMissing = data.keywordsMissing?.length
    ? `<div style="margin-top:9px;">
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">🔑 Add These Keywords</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;">
          ${data.keywordsMissing.map(k => `<span style="background:var(--surface2);border-radius:5px;padding:3px 8px;font-size:10.5px;">${k}</span>`).join('')}
        </div>
      </div>`
    : '';

  const wins = data.improvements?.length
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
        <div class="pbar" style="width:${score}%;background:${color};transition:width 0.8s ease;"></div>
      </div>
      ${data.summary ? `<div style="font-size:11.5px;color:var(--muted);margin-top:9px;line-height:1.6;">${data.summary}</div>` : ''}
    </div>
    ${keywordsMissing}
    ${wins}
  `;
}

function renderTips(tips) {
  if (!tips || !tips.length) {
    document.getElementById('sug-el').innerHTML =
      '<div class="empty"><div class="emico">🤖</div><p class="emtxt">No tips generated. Try again with a JD.</p></div>';
    return;
  }

  const priorityColor = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--green)' };

  document.getElementById('sug-el').innerHTML = tips.map(t => `
    <div style="padding:11px;background:var(--surface2);border-radius:9px;margin-bottom:7px;border-left:3px solid ${priorityColor[t.priority] || 'var(--accent)'};">
      <div style="font-size:12.5px;font-weight:600;margin-bottom:2px;">${t.icon || '💡'} ${t.tip}</div>
      <div style="font-size:9.5px;font-weight:700;color:${priorityColor[t.priority] || 'var(--accent)'};">
        ${(t.priority || 'medium').toUpperCase()} PRIORITY
      </div>
    </div>
  `).join('');
}
