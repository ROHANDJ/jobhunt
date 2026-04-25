/**
 * ai.js — Shared AI helper for the browser.
 *
 * PRIMARY:  Google Gemini 1.5 Flash (FREE — no credit card needed)
 *           Get your key at: https://aistudio.google.com/apikey
 *           Limits: 15 req/min · 1M tokens/day — plenty for personal use.
 *
 * FALLBACK: Anthropic Claude (paid, but works if you already have a key)
 *
 * Both keys are stored in localStorage (never sent anywhere except the
 * respective AI provider's own API endpoint).
 */

// ─── Core AI call ──────────────────────────────────────────────────────────────
async function callAI(prompt, maxTokens = 1500) {
  const geminiKey    = localStorage.getItem('jhp_geminiKey')    || '';
  const anthropicKey = localStorage.getItem('jhp_apiKey')       || '';

  // ── Try Gemini first (free, CORS-friendly) ──────────────────────────────────
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents:         [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
          })
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.warn('[Gemini API]', e.message);
    }
  }

  // ── Fallback: Anthropic Claude ───────────────────────────────────────────────
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model:     'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          messages:  [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      return data.content?.[0]?.text || null;
    } catch (e) {
      console.warn('[Anthropic API]', e.message);
    }
  }

  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function hasAIKey() {
  return !!(localStorage.getItem('jhp_geminiKey') || localStorage.getItem('jhp_apiKey'));
}

function getActiveKeyLabel() {
  if (localStorage.getItem('jhp_geminiKey')) return 'Gemini';
  if (localStorage.getItem('jhp_apiKey'))    return 'Anthropic';
  return null;
}

// ─── Settings helpers (called from index.html) ────────────────────────────────
function saveGeminiKey() {
  const key = document.getElementById('s-geminikey')?.value?.trim();
  if (!key) { toast('Enter your Gemini API key first', 'e'); return; }
  localStorage.setItem('jhp_geminiKey', key);
  document.getElementById('s-geminikey').value = '';
  toast('Gemini API key saved — AI features unlocked! ✅', 's', 4000);
}

function saveApiKey() {
  const key = document.getElementById('s-apikey')?.value?.trim();
  if (!key) { toast('Enter your Anthropic API key first', 'e'); return; }
  localStorage.setItem('jhp_apiKey', key);
  document.getElementById('s-apikey').value = '';
  toast('Anthropic API key saved ✅', 's');
}

function clearAIKeys() {
  localStorage.removeItem('jhp_geminiKey');
  localStorage.removeItem('jhp_apiKey');
  toast('API keys cleared', 's');
}

// ─── Load saved keys into settings form ───────────────────────────────────────
function loadSavedKeys() {
  const gemini    = localStorage.getItem('jhp_geminiKey');
  const anthropic = localStorage.getItem('jhp_apiKey');
  const statusEl  = document.getElementById('ai-key-status');
  if (!statusEl) return;
  if (gemini) {
    statusEl.innerHTML = `<span style="color:var(--green);font-size:11px;">✓ Gemini key active · AI features enabled</span>`;
  } else if (anthropic) {
    statusEl.innerHTML = `<span style="color:var(--orange);font-size:11px;">✓ Anthropic key active (switch to free Gemini?)</span>`;
  } else {
    statusEl.innerHTML = `<span style="color:var(--red);font-size:11px;">⚠ No AI key set — ATS, news, and daily features won't work</span>`;
  }
}
