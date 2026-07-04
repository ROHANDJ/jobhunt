/**
 * job-leads.js — Discover REAL fresher job openings via live Google search.
 *
 * Replaces the old hardcoded/guessed recruiter list (campus@google.com etc.)
 * with actual, currently-open listings for candidates with < 1 year experience.
 *
 * What it does:
 *   1. Uses Gemini + Google-search grounding to find current fresher openings
 *   2. Keeps ONLY roles requiring ≤ 1 year experience (fresher / intern / entry)
 *   3. Saves a clean JSON to automation/job-leads.json, e.g.:
 *        {
 *          "company": "Razorpay",
 *          "role": "Software Engineer (Entry Level)",
 *          "experienceRequired": "0-1 years",
 *          "location": "Bangalore / Remote",
 *          "type": "Full-time",
 *          "applyUrl": "https://…",          // always present when found
 *          "contactEmail": null,             // ONLY set if a real email is found
 *          "source": "LinkedIn Jobs",
 *          "postedWhen": "2 days ago",
 *          "fetchedAt": "…"
 *        }
 *
 * IMPORTANT: contactEmail is left null unless a genuine, published email is found.
 * We never fabricate generic addresses — apply via applyUrl for those.
 *
 * Usage:
 *   node automation/runner.js leads                 # fetch + save leads JSON
 *   node automation/runner.js leads --role "Data Scientist" --count 15
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname }                           from 'path';
import { fileURLToPath }                           from 'url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..', '..');
const LEADS_FILE = join(ROOT, 'automation', 'job-leads.json');

const log  = (m) => console.log(`\x1b[36m  →\x1b[0m  ${m}`);
const ok   = (m) => console.log(`\x1b[32m  ✔\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m  ⚠\x1b[0m  ${m}`);

// ── Gemini (with Google-search grounding) ──────────────────────────────────────
const GEMINI_URL = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function geminiSearch(prompt, maxTokens = 2500) {
  const body = {
    contents:         [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } },
    tools:            [{ google_search: {} }],
  };
  const res  = await fetch(GEMINI_URL('gemini-2.5-flash'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
}

// Robust JSON array extraction (handles fences / prose / trailing text).
function extractJsonArray(text) {
  if (!text) return null;
  const t = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = t.indexOf('[');
  const end   = t.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch { return null; }
}

// ── Experience filter: keep only ≤ 1 year requirement ──────────────────────────
export function meetsFresherBar(exp) {
  if (!exp) return true; // unknown → keep, we asked for freshers anyway
  const s = String(exp).toLowerCase();
  if (/(fresher|entry|graduate|trainee|intern|no experience)/.test(s)) return true;
  const nums = s.match(/\d+(\.\d+)?/g);
  if (!nums) return true;
  return Math.min(...nums.map(Number)) <= 1;
}

// Only treat as a real contact email if it's a plausible, non-generic address.
function realEmailOrNull(email) {
  if (!email || typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(e)) return null;
  // Reject obvious placeholder guesses the model might hallucinate.
  if (/^(campus|careers?|hr|jobs?|hiring|talent|recruit(ing|ment)?|apply|info|contact)@/.test(e)) return null;
  if (/example\.com|company\.com|domain\.com/.test(e)) return null;
  return e;
}

// ── Fetch fresher job leads ─────────────────────────────────────────────────────
export async function fetchJobLeads(profile, options = {}) {
  if (!process.env.GEMINI_API_KEY) {
    warn('GEMINI_API_KEY not set — cannot search for live job leads.');
    return [];
  }

  const roles = options.role
    ? [options.role]
    : (profile.jobPreferences?.roles || ['Software Engineer', 'Data Scientist']).slice(0, 3);
  const count    = parseInt(options.count || '12');
  const location = options.location || 'India (or remote, India-friendly)';

  const prompt = `Search the web for ${count} CURRENTLY OPEN job/internship listings for FRESHERS in India.

Target roles: ${roles.join(', ')}.
Location: ${location}.

STRICT requirements:
- Experience required must be 1 year or LESS (fresher / entry-level / graduate / intern only).
- Real, currently accepting applications, posted within the last ~30 days.
- "applyUrl" MUST be a real, working link to the actual listing or company careers page (LinkedIn Jobs, Wellfound, Naukri, Instahyre, or the company site). Never invent a URL.
- "contactEmail": include ONLY if a genuine recruiter/HR email is actually published in the posting. If none is published, use null. Do NOT guess or construct emails like campus@company.com.

Return ONLY a JSON array, no markdown:
[
  {
    "company": "...",
    "role": "...",
    "experienceRequired": "e.g. 0-1 years / Fresher / Internship",
    "location": "...",
    "type": "Full-time|Internship",
    "salary": "if stated else 'Not disclosed'",
    "applyUrl": "direct working link",
    "contactEmail": null,
    "source": "where it was found (e.g. LinkedIn Jobs)",
    "postedWhen": "e.g. 3 days ago"
  }
]`;

  log(`Searching live for fresher openings: ${roles.join(', ')}…`);
  let parsed = null;
  for (let attempt = 1; attempt <= 2 && !parsed; attempt++) {
    try {
      const text = await geminiSearch(prompt);
      parsed = extractJsonArray(text);
      if (!parsed) warn(`Could not parse search results (attempt ${attempt}/2)`);
    } catch (e) { warn(`Search failed (attempt ${attempt}/2): ${e.message}`); }
  }
  if (!Array.isArray(parsed) || !parsed.length) {
    warn('No job leads returned.');
    return [];
  }

  const now = new Date().toISOString();
  const leads = parsed
    .filter(j => j && j.company && j.role)
    .filter(j => meetsFresherBar(j.experienceRequired))
    .map(j => ({
      company:            j.company,
      role:               j.role,
      experienceRequired: j.experienceRequired || 'Fresher',
      location:           j.location || location,
      type:               j.type || 'Full-time',
      salary:             j.salary || 'Not disclosed',
      applyUrl:           (j.applyUrl && /^https?:\/\//.test(j.applyUrl)) ? j.applyUrl : null,
      contactEmail:       realEmailOrNull(j.contactEmail),
      source:             j.source || 'web',
      postedWhen:         j.postedWhen || '',
      fetchedAt:          now,
    }))
    .filter(j => j.applyUrl || j.contactEmail); // must have at least a way to apply

  ok(`Kept ${leads.length} fresher leads (≤ 1 yr experience)`);
  return leads;
}

// ── Persist + merge (dedupe by company+role) ────────────────────────────────────
export function loadLeads() {
  if (!existsSync(LEADS_FILE)) return [];
  try { return JSON.parse(readFileSync(LEADS_FILE, 'utf-8')); } catch { return []; }
}

export function saveLeads(leads) {
  writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  return LEADS_FILE;
}

export async function refreshJobLeads(profile, options = {}) {
  const fresh    = await fetchJobLeads(profile, options);
  const existing = loadLeads();
  const key      = (j) => `${(j.company || '').toLowerCase()}::${(j.role || '').toLowerCase()}`;
  const seen     = new Set(existing.map(key));
  const added    = [];
  for (const lead of fresh) {
    if (!seen.has(key(lead))) { seen.add(key(lead)); existing.unshift(lead); added.push(lead); }
  }
  saveLeads(existing.slice(0, 200));
  return { added: added.length, total: Math.min(existing.length, 200), leads: fresh, withEmail: fresh.filter(l => l.contactEmail).length };
}
