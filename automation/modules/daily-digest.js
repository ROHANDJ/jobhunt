/**
 * daily-digest.js — Beautiful daily email digest for rohandj200@gmail.com
 *
 * Sections:
 *   1. 📰 Today's Top Tech News      (5 stories, live via Claude web_search)
 *   2. 🧩 Problem of the Day         (AI-generated DSA problem with solution)
 *   3. 💼 Fresher Job Picks           (3 jobs from the board)
 *   4. 💡 Dev Tip of the Day          (AI-generated learning tip)
 *   5. 🛠 Tool Spotlight               (useful tool/library to check out)
 *   6. 📚 Daily Checklist             (learning goals)
 *   7. 💬 Quote of the Day            (motivational)
 */

import nodemailer from 'nodemailer';

const GEMINI_URL = (model = 'gemini-1.5-flash') =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function geminiCall(prompt, maxTokens = 1200, useSearch = false) {
  const model = 'gemini-2.5-flash';
  const body = {
    contents:         [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } },
  };
  if (useSearch) body.tools = [{ google_search: {} }];
  const res = await fetch(GEMINI_URL(model), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
}

// ── Robust JSON extraction (handles markdown fences, prose, trailing text) ─────
function extractJsonArray(text) {
  if (!text) return null;
  const t = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = t.indexOf('[');
  const end   = t.lastIndexOf(']');           // greedy: last bracket, not first
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch { return null; }
}

// Build a durable fallback when a direct listing/article is no longer available.
function searchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function newsSearchUrl(title, source) {
  return `https://news.google.com/search?q=${encodeURIComponent(`${title} ${source}`.trim())}&hl=en-IN&gl=IN&ceid=IN:en`;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (host === 'localhost' || host === '::1' || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

// AI-grounded answers can still contain a stale or invented URL. Verify it from
// the runner before placing it in an email; use the search fallback otherwise.
async function verifyExternalUrl(value) {
  const url = safeHttpUrl(value);
  if (!url) return null;

  const request = async (method) => {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: method === 'GET' ? { Range: 'bytes=0-1024' } : undefined,
    });
    return response.ok ? response.url : null;
  };

  try {
    return await request('HEAD') || await request('GET');
  } catch {
    return null;
  }
}

const RECIPIENT = 'rohandj200@gmail.com';
const SENDER_NAME = 'Rohan';

const log  = (m) => console.log(`\x1b[36m→\x1b[0m  ${m}`);
const ok   = (m) => console.log(`\x1b[32m✔\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m⚠\x1b[0m  ${m}`);

const NOW = new Date();
const TODAY_STR = NOW.toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  timeZone: 'Asia/Kolkata',
});
const DAY_OF_WEEK = NOW.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });
const IS_MONDAY   = NOW.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }) === 'Mon';

// ── Static job picks (rotated daily) ─────────────────────────────────────────
const JOBS = [
  { co: 'Google',       role: 'ML Engineer Intern',          salary: '₹1L+/mo',    logo: '🔵', tags: 'Python · TensorFlow · Research' },
  { co: 'Razorpay',     role: 'Software Engineer',           salary: '₹12-18 LPA', logo: '💳', tags: 'DSA · System Design · APIs' },
  { co: 'Fractal',      role: 'Data Science Intern',         salary: '₹40-60K/mo', logo: '🧮', tags: 'Python · ML · Statistics' },
  { co: 'PhonePe',      role: 'SDE-1',                       salary: '₹14-20 LPA', logo: '📱', tags: 'Java · Spring · React' },
  { co: 'Swiggy',       role: 'Backend Engineer',            salary: '₹12-18 LPA', logo: '🛵', tags: 'Python · Kafka · Microservices' },
  { co: 'Amazon',       role: 'SDE-1',                       salary: '₹15-22 LPA', logo: '📦', tags: 'Java · DSA · OOP' },
  { co: 'Microsoft',    role: 'Software Engineer',           salary: '₹20-30 LPA', logo: '🪟', tags: 'C# · Azure · DSA' },
  { co: 'Zepto',        role: 'Backend Engineer',            salary: '₹10-16 LPA', logo: '⚡', tags: 'Node.js · Go · Redis' },
  { co: 'TCS',          role: 'SDE Trainee',                 salary: '₹3.5-4.5 LPA',logo:'🔷',tags: 'Java · Python · Data Structures' },
  { co: 'Mu Sigma',     role: 'Trainee Decision Scientist',  salary: '₹5-8 LPA',   logo: '📊', tags: 'Python · Statistics · SQL' },
  { co: 'IISc',         role: 'ML Research Intern',          salary: '₹25K/mo',    logo: '🏫', tags: 'Python · PyTorch · Research' },
  { co: 'Juspay',       role: 'Software Developer',          salary: '₹8-14 LPA',  logo: '💡', tags: 'Haskell · React · Node.js' },
];

function pickJobs(count = 3) {
  const seed  = NOW.getDate() + NOW.getMonth();
  const start = seed % (JOBS.length - count);
  return JOBS.slice(start, start + count);
}

// ── Quotes (rotated daily) ────────────────────────────────────────────────────
const QUOTES = [
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.',   author: 'Chinese Proverb' },
  { text: 'An investment in knowledge pays the best interest.',                             author: 'Benjamin Franklin' },
  { text: 'The only way to do great work is to love what you do.',                         author: 'Steve Jobs' },
  { text: 'Code is like humor. When you have to explain it, it\'s bad.',                   author: 'Cory House' },
  { text: 'First, solve the problem. Then, write the code.',                               author: 'John Johnson' },
  { text: 'Experience is the name everyone gives to their mistakes.',                       author: 'Oscar Wilde' },
  { text: 'In order to be irreplaceable one must always be different.',                     author: 'Coco Chanel' },
  { text: 'The secret of getting ahead is getting started.',                               author: 'Mark Twain' },
  { text: 'It\'s not about ideas. It\'s about making ideas happen.',                       author: 'Scott Belsky' },
  { text: 'Don\'t watch the clock; do what it does. Keep going.',                          author: 'Sam Levenson' },
  { text: 'Opportunities don\'t happen. You create them.',                                 author: 'Chris Grosser' },
  { text: 'You miss 100% of the shots you don\'t take.',                                   author: 'Wayne Gretzky' },
  { text: 'Simplicity is the soul of efficiency.',                                         author: 'Austin Freeman' },
  { text: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Harold Abelson' },
];

function pickQuote() {
  return QUOTES[NOW.getDate() % QUOTES.length];
}

// ── Fetch live tech news ──────────────────────────────────────────────────────
async function fetchNews() {
  log('Fetching today\'s tech news…');
  const prompt = `Search and return today's top 5 tech news stories covering:
1. AI/ML breakthroughs or product launches
2. Indian startup funding or tech hiring news
3. New developer tools or frameworks released
4. Software engineering trends
5. Any major tech company announcement

Return ONLY a JSON array with no markdown:
[
  {"title":"...","source":"...","category":"AI|Jobs|Startup|Tools|Industry","summary":"1 concise sentence","url":"..."}
]`;
  // Search grounding is flaky — retry once before giving up so news shows daily
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const text   = await geminiCall(prompt, 2000, true);
      const parsed = extractJsonArray(text);
      if (Array.isArray(parsed) && parsed.length) {
        const rawStories = parsed.slice(0, 5).map(n => ({
          title:    n.title || 'Tech update',
          source:   n.source || '',
          category: n.category || 'Tech',
          summary:  n.summary || '',
          // Guarantee a clickable link — fall back to a search for the headline
          url:      n.url || searchUrl(`${n.title || ''} ${n.source || ''}`.trim()),
        }));
        const stories = await Promise.all(rawStories.map(async story => {
          const directUrl = await verifyExternalUrl(story.url);
          return {
            ...story,
            url: directUrl || newsSearchUrl(story.title, story.source),
            linkLabel: directUrl ? 'Read full story' : 'Find latest coverage',
          };
        }));
        ok(`Fetched ${stories.length} news stories`);
        return stories;
      }
      warn(`News response could not be parsed (attempt ${attempt}/2)`);
    } catch (e) { warn(`News fetch failed (attempt ${attempt}/2): ${e.message}`); }
  }
  return [];
}

// ── Fetch live startup jobs ─────────────────────────────────────────────────
async function fetchJobs(count = 4) {
  log('Fetching remote startup jobs for freshers…');
  try {
    const prompt = `Search for ${count} CURRENTLY OPEN remote (India-friendly) openings for FRESHERS / entry-level candidates (0-2 years experience) at startups. Give a mix of:
- Software Engineer / SDE (backend, frontend, full-stack)
- Data Science / ML / AI roles
- At least one Internship

Strict requirements:
- Remote, or remote-friendly for someone based in India.
- Real, recently posted (within ~30 days), currently accepting applications.
- The "url" MUST be a direct, working link to the application or listing page (company careers page, Wellfound/AngelList, LinkedIn Jobs, or the job board) — never invent URLs.

Return ONLY a JSON array, no markdown:
[
  {"co":"Company","role":"Job title","type":"Full-time|Internship","salary":"pay if known else 'Not disclosed'","tags":"key tech/skills · separated · by dots","url":"direct application URL","logo":"one relevant emoji"}
]`;
    const text   = await geminiCall(prompt, 2000, true);
    const parsed = extractJsonArray(text);
    if (Array.isArray(parsed) && parsed.length) {
      const rawJobs = parsed.slice(0, count).map(j => {
        const co   = j.co || 'Startup';
        const role = j.role || 'Software Engineer';
        return {
          co,
          role,
          salary: j.salary || 'Not disclosed',
          logo:   j.logo || '🚀',
          tags:   [j.type, j.tags].filter(Boolean).join(' · '),
          // Guarantee a working link — fall back to a job search for co + role
          url: j.url,
        };
      });
      const jobs = await Promise.all(rawJobs.map(async job => {
        const directUrl = await verifyExternalUrl(job.url);
        return {
          ...job,
          url: directUrl || searchUrl(`${job.co} ${job.role} remote India fresher apply`),
          linkLabel: directUrl ? 'Apply' : 'Find current listing',
        };
      }));
      ok(`Fetched ${jobs.length} startup jobs`);
      return jobs;
    }
  } catch (e) { warn(`Job fetch failed: ${e.message}`); }
  warn('Job fetch failed — using static fallback list');
  // Even the static fallback gets a search link so every card is clickable
  return pickJobs(count).map(j => ({
    ...j,
    url: searchUrl(`${j.co} ${j.role} remote India fresher apply`),
    linkLabel: 'Find current listing',
  }));
}

// ── Generate problem of the day ───────────────────────────────────────────────
async function generateProblem() {
  const categories = [
    'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Binary Search',
    'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Stacks & Queues',
    'Greedy Algorithms', 'Backtracking', 'Sorting',
  ];
  const cat = categories[NOW.getDate() % categories.length];
  log(`Generating ${cat} problem…`);

  try {
    const prompt = `Generate a coding interview problem in the category "${cat}". Make it the type asked at Google, Amazon, Razorpay, or Flipkart for freshers.

Return ONLY valid JSON:
{
  "title": "...",
  "difficulty": "Easy|Medium|Hard",
  "category": "${cat}",
  "problem": "Clear problem statement in 2-3 sentences",
  "input": "Input description",
  "output": "Output description",
  "example": {
    "input": "example input",
    "output": "example output",
    "explanation": "why this output"
  },
  "constraints": ["constraint 1", "constraint 2"],
  "approach": "Optimal approach in 2-3 sentences explaining the key insight",
  "code": "def solution(...):\\n    # Python solution\\n    pass",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)"
}`;
    const text = (await geminiCall(prompt, 900)).trim();
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const p    = JSON.parse(json);
    ok(`Problem generated: ${p.title} (${p.difficulty})`);
    return p;
  } catch (e) {
    warn(`Problem generation failed: ${e.message}`);
    return null;
  }
}

// ── Generate dev tip + tool spotlight ────────────────────────────────────────
async function generateTipAndTool() {
  log('Generating dev tip and tool spotlight…');
  try {
    const prompt = `Generate two things for a fresher software engineer / data scientist:

1. A practical "Dev Tip of the Day" — a concrete actionable tip about coding, system design, interviews, or career growth. 2-3 sentences.

2. A "Tool Spotlight" — one useful tool, library, or resource a fresher should know about. Include name, what it does (1 sentence), and why it's useful.

Return ONLY valid JSON:
{
  "tip": "...",
  "tool": {
    "name": "...",
    "description": "...",
    "why": "..."
  }
}`;
    const text = (await geminiCall(prompt, 500)).trim();
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return JSON.parse(json);
  } catch { return null; }
}

// ── HTML helpers ──────────────────────────────────────────────────────────────
const BG       = '#07070f';
const CARD     = '#0e0e1c';
const CARD2    = '#131325';
const BORDER   = '#1a1a2e';
const TEXT     = '#e2e6f5';
const MUTED    = '#636385';
const PURPLE   = '#7c6dfa';
const GREEN    = '#34d399';
const ORANGE   = '#fb923c';
const SKY      = '#38bdf8';
const RED      = '#f87171';

const CAT_COLOR = {
  AI:       [PURPLE, '#7c6dfa22'],
  Jobs:     [GREEN,  '#34d39922'],
  Startup:  [ORANGE, '#fb923c22'],
  Tools:    [SKY,    '#38bdf822'],
  Industry: [RED,    '#f8717122'],
};

function sectionHeader(icon, title, color) {
  return `
    <tr><td style="padding:22px 28px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-left:3px solid ${color};padding-left:12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${color};margin-bottom:3px;">${icon} ${title}</div>
          </td>
        </tr>
      </table>
    </td></tr>`;
}

function divider() {
  return `<tr><td style="padding:0 28px;"><div style="height:1px;background:${BORDER};"></div></td></tr>`;
}

function newsSection(items) {
  if (!items.length) return `
    <tr><td style="padding:0 28px 22px;color:${MUTED};font-size:12px;">
      No news available today.
    </td></tr>`;

  return `<tr><td style="padding:0 28px 22px;">` +
    items.map((n, i) => {
      const [color, bg] = CAT_COLOR[n.category] || [PURPLE, '#7c6dfa22'];
      return `
        <table width="100%" cellpadding="0" cellspacing="0"
          style="margin-bottom:10px;background:${CARD2};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:14px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;
                      color:${color};background:${bg};padding:3px 9px;border-radius:20px;">${n.category || 'Tech'}</span>
                    <span style="font-size:10px;color:${MUTED};margin-left:8px;">${n.source || ''}</span>
                  </td>
                  <td align="right" style="font-size:10px;color:${MUTED};">#${i + 1}</td>
                </tr>
                <tr><td colspan="2" style="padding-top:8px;">
                  <div style="font-size:13.5px;font-weight:600;line-height:1.5;">
                    ${n.url
                      ? `<a href="${n.url}" target="_blank" style="color:${TEXT};text-decoration:none;">${n.title} <span style="color:${color};font-weight:700;">↗</span></a>`
                      : `<span style="color:${TEXT};">${n.title}</span>`}
                  </div>
                  <div style="font-size:11.5px;color:${MUTED};margin-top:5px;line-height:1.6;">${n.summary}</div>
                  ${n.url ? `<a href="${n.url}" target="_blank" style="display:inline-block;margin-top:8px;font-size:10px;color:${color};text-decoration:none;">${n.linkLabel || 'Read full story'} →</a>` : ''}
                </td></tr>
              </table>
            </td>
          </tr>
        </table>`;
    }).join('') + `</td></tr>`;
}

function problemSection(p) {
  if (!p) return `<tr><td style="padding:0 28px 22px;color:${MUTED};font-size:12px;">No problem generated today.</td></tr>`;

  const diffColor = { Easy: GREEN, Medium: ORANGE, Hard: RED }[p.difficulty] || PURPLE;
  const diffBg    = { Easy: '#34d39922', Medium: '#fb923c22', Hard: '#f8717122' }[p.difficulty] || '#7c6dfa22';
  const code = (p.code || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const constraints = (p.constraints || []).map(c => `<li style="margin-bottom:4px;">${c}</li>`).join('');

  return `
    <tr><td style="padding:0 28px 22px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:${CARD2};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:18px 20px;">
            <!-- Title row -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td>
                  <div style="font-size:16px;font-weight:700;color:${TEXT};letter-spacing:-0.3px;">${p.title}</div>
                  <div style="margin-top:6px;">
                    <span style="font-size:10px;font-weight:700;color:${diffColor};background:${diffBg};
                      padding:3px 10px;border-radius:20px;">${p.difficulty}</span>
                    <span style="font-size:10px;color:${MUTED};background:${BORDER};padding:3px 10px;
                      border-radius:20px;margin-left:6px;">${p.category}</span>
                    <span style="font-size:10px;color:${MUTED};margin-left:10px;">
                      ⏱ ${p.timeComplexity || '?'} &nbsp;·&nbsp; 💾 ${p.spaceComplexity || '?'}
                    </span>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Problem statement -->
            <div style="background:${CARD};border-left:3px solid ${PURPLE};border-radius:0 10px 10px 0;
              padding:13px 15px;margin-bottom:14px;">
              <div style="font-size:13px;color:${TEXT};line-height:1.75;">${p.problem}</div>
            </div>

            <!-- Example -->
            ${p.example ? `
            <div style="margin-bottom:14px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${MUTED};margin-bottom:8px;">Example</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid ${BORDER};border-radius:10px;">
                <tr><td style="padding:12px 14px;font-size:12px;color:${TEXT};font-family:monospace;line-height:1.8;">
                  <div><span style="color:${MUTED};">Input: </span>${p.example.input}</div>
                  <div><span style="color:${MUTED};">Output: </span>${p.example.output}</div>
                  ${p.example.explanation ? `<div style="color:${MUTED};margin-top:4px;font-family:'Segoe UI',sans-serif;font-size:11px;">${p.example.explanation}</div>` : ''}
                </td></tr>
              </table>
            </div>` : ''}

            <!-- Constraints -->
            ${constraints ? `
            <div style="margin-bottom:14px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${MUTED};margin-bottom:8px;">Constraints</div>
              <ul style="margin:0;padding-left:18px;font-size:12px;color:${MUTED};line-height:1.9;">${constraints}</ul>
            </div>` : ''}

            <!-- Approach -->
            ${p.approach ? `
            <div style="background:${CARD};border:1px solid ${BORDER};border-radius:10px;padding:13px 14px;margin-bottom:14px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${GREEN};margin-bottom:7px;">✅ Optimal Approach</div>
              <div style="font-size:12.5px;color:${TEXT};line-height:1.7;">${p.approach}</div>
            </div>` : ''}

            <!-- Solution code -->
            ${code ? `
            <div>
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${SKY};margin-bottom:8px;">🐍 Python Solution</div>
              <pre style="background:#060612;border:1px solid ${BORDER};border-radius:10px;padding:16px;
                font-family:'Courier New',Consolas,monospace;font-size:12px;color:#a9b1d6;
                white-space:pre-wrap;line-height:1.75;margin:0;overflow-x:auto;">${code}</pre>
            </div>` : ''}
          </td>
        </tr>
      </table>
    </td></tr>`;
}

function jobsSection(jobs) {
  return `
    <tr><td style="padding:0 28px 22px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 8px;">
        ${jobs.map(j => `
          <tr>
            <td style="background:${CARD2};border:1px solid ${BORDER};border-radius:12px;padding:14px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40">
                    <div style="width:38px;height:38px;background:${CARD};border:1px solid ${BORDER};
                      border-radius:10px;display:inline-flex;align-items:center;justify-content:center;
                      font-size:18px;text-align:center;line-height:38px;">${j.logo}</div>
                  </td>
                  <td style="padding-left:12px;">
                    <div style="font-size:13.5px;font-weight:700;color:${TEXT};">${j.role}</div>
                    <div style="font-size:11px;color:${MUTED};margin-top:2px;">${j.co} · ${j.salary}</div>
                  </td>
                  <td align="right" valign="middle">
                    <a href="${j.url}" target="_blank" style="text-decoration:none;"><div style="font-size:10px;color:${PURPLE};background:#7c6dfa18;border:1px solid #7c6dfa33;
                      padding:4px 11px;border-radius:20px;white-space:nowrap;">${j.linkLabel || 'Apply'} →</div></a>
                  </td>
                </tr>
                <tr><td colspan="3" style="padding-top:9px;">
                  <div style="font-size:11px;color:${MUTED};">${j.tags}</div>
                </td></tr>
              </table>
            </td>
          </tr>`).join('')}
      </table>
    </td></tr>`;
}

function tipSection(tipData) {
  if (!tipData) return '';
  return `
    <tr><td style="padding:0 28px 22px;">
      <!-- Tip -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:linear-gradient(135deg,#1a1035,#0f1a2e);border:1px solid #2a2050;
        border-radius:14px;margin-bottom:12px;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${PURPLE};margin-bottom:8px;">💡 Dev Tip</div>
          <div style="font-size:13px;color:${TEXT};line-height:1.75;">${tipData.tip}</div>
        </td></tr>
      </table>

      <!-- Tool spotlight -->
      ${tipData.tool ? `
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:linear-gradient(135deg,#0e1a18,#091520);border:1px solid #153028;border-radius:14px;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${GREEN};margin-bottom:8px;">🛠 Tool Spotlight</div>
          <div style="font-size:14px;font-weight:700;color:${GREEN};margin-bottom:6px;">${tipData.tool.name}</div>
          <div style="font-size:12.5px;color:${TEXT};line-height:1.65;margin-bottom:6px;">${tipData.tool.description}</div>
          <div style="font-size:11.5px;color:${MUTED};line-height:1.6;">Why it matters: ${tipData.tool.why}</div>
        </td></tr>
      </table>` : ''}
    </td></tr>`;
}

function checklistSection() {
  const tasks = [
    'Solve today\'s coding problem',
    'Read one tech article or docs',
    'Work on a project or GitHub for 30 min',
    'Apply to at least 2-3 jobs today',
    'Review one system design concept',
    'Log what you learned in Daily Hub',
  ];
  return `
    <tr><td style="padding:0 28px 22px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:${CARD2};border:1px solid ${BORDER};border-radius:14px;">
        <tr><td style="padding:18px 20px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${ORANGE};margin-bottom:14px;">📚 Today's Learning Checklist</div>
          ${tasks.map((t, i) => `
            <div style="display:flex;align-items:center;padding:7px 0;border-bottom:${i < tasks.length - 1 ? `1px solid ${BORDER}` : 'none'};">
              <div style="width:20px;height:20px;border:2px solid ${BORDER};border-radius:5px;
                flex-shrink:0;margin-right:12px;"></div>
              <div style="font-size:12.5px;color:${TEXT};">${t}</div>
            </div>`).join('')}
        </td></tr>
      </table>
    </td></tr>`;
}

function quoteSection(q) {
  return `
    <tr><td style="padding:0 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:linear-gradient(135deg,#12101f,#0b1422);border:1px solid ${BORDER};border-radius:14px;">
        <tr><td style="padding:20px 22px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${SKY};margin-bottom:10px;">💬 Quote of the Day</div>
          <div style="font-size:15px;color:${TEXT};line-height:1.65;font-style:italic;margin-bottom:8px;">"${q.text}"</div>
          <div style="font-size:11px;color:${MUTED};">— ${q.author}</div>
        </td></tr>
      </table>
    </td></tr>`;
}

// ── Build full email ──────────────────────────────────────────────────────────
function buildEmail(news, problem, jobs, tipData) {
  const quote   = pickQuote();
  const isWeekend = [0, 6].includes(NOW.getDay());
  const greeting = isWeekend
    ? `Happy ${DAY_OF_WEEK}, ${SENDER_NAME}! Even on weekends, small progress adds up. 💪`
    : `Good morning, ${SENDER_NAME}! Here's everything you need to crush it today. 🚀`;

  const subject = `🔥 Daily Digest — ${DAY_OF_WEEK}, ${NOW.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${subject}</title>
<style>
  @media only screen and (max-width:620px){
    .email-wrap{width:100%!important;border-radius:0!important;}
    .pad{padding-left:18px!important;padding-right:18px!important;}
    .hero{padding:22px 18px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BG};padding:24px 16px;">
<tr><td align="center">
<table class="email-wrap" width="600" cellpadding="0" cellspacing="0" role="presentation"
  style="background:${CARD};border-radius:20px;border:1px solid ${BORDER};overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">

  <!-- ══ HEADER ══ -->
  <tr><td class="hero" style="background:linear-gradient(135deg,#5a4fd4 0%,#7c6dfa 40%,#38bdf8 100%);padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">🔒 Locked In</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:3px;letter-spacing:2px;text-transform:uppercase;">Daily Digest</div>
        </td>
        <td align="right" valign="top">
          <div style="font-size:11px;color:rgba(255,255,255,0.75);text-align:right;line-height:1.6;">
            ${DAY_OF_WEEK}<br/>
            <strong style="color:#fff;">${NOW.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}</strong>
          </div>
        </td>
      </tr>
    </table>
    <!-- Greeting -->
    <div style="margin-top:20px;background:rgba(255,255,255,0.12);border-radius:12px;padding:14px 18px;">
      <div style="font-size:14px;color:#fff;font-weight:500;line-height:1.6;">${greeting}</div>
    </div>
  </td></tr>

  <!-- Quick stats row -->
  <tr><td style="padding:18px 28px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${[
          ['📰', news.length || 0, 'News Stories'],
          ['🧩', problem ? '1' : '0', 'Problem Today'],
          ['💼', jobs.length, 'Job Picks'],
          ['🔥', '∞', 'Streak Goals'],
        ].map(([icon, val, label]) => `
          <td align="center" style="background:${CARD2};border:1px solid ${BORDER};border-radius:12px;
            padding:12px 8px;margin:0 4px;" width="25%">
            <div style="font-size:18px;">${icon}</div>
            <div style="font-size:18px;font-weight:800;color:${TEXT};font-family:'Segoe UI',sans-serif;">${val}</div>
            <div style="font-size:9.5px;color:${MUTED};margin-top:2px;">${label}</div>
          </td>`).join('<td width="8"></td>')}
      </tr>
    </table>
  </td></tr>

  <!-- ══ NEWS ══ -->
  ${sectionHeader('📰', "Today's Tech News", PURPLE)}
  ${newsSection(news)}
  ${divider()}

  <!-- ══ PROBLEM ══ -->
  ${sectionHeader('🧩', 'Problem of the Day', GREEN)}
  ${problemSection(problem)}
  ${divider()}

  <!-- ══ JOBS ══ -->
  ${sectionHeader('💼', 'Fresher Job Picks', ORANGE)}
  ${jobsSection(jobs)}
  ${divider()}

  <!-- ══ TIP + TOOL ══ -->
  ${sectionHeader('💡', 'Dev Tip & Tool Spotlight', SKY)}
  ${tipSection(tipData)}
  ${divider()}

  <!-- ══ CHECKLIST ══ -->
  ${sectionHeader('📚', "Today's Learning Checklist", ORANGE)}
  ${checklistSection()}
  ${divider()}

  <!-- ══ QUOTE ══ -->
  ${sectionHeader('💬', 'Quote of the Day', SKY)}
  ${quoteSection(quote)}

  <!-- ══ FOOTER ══ -->
  <tr><td style="background:#050510;padding:18px 28px;border-top:1px solid ${BORDER};">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="font-size:11px;color:${MUTED};line-height:1.7;">
            <strong style="color:${TEXT};">🔒 Locked In</strong> · Your daily career + study-abroad companion<br/>
            Sent to ${RECIPIENT} every morning at 9:00 AM IST
          </div>
        </td>
        <td align="right" valign="middle">
          <div style="font-size:10px;color:${MUTED};">
            <a href="https://jobhunt-pro-navy.vercel.app" style="color:${PURPLE};text-decoration:none;">Open App →</a>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

  return { subject, html };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function sendDailyDigest() {
  if (!process.env.GEMINI_API_KEY) {
    warn('GEMINI_API_KEY not set. Add it to .env or GitHub Secrets.');
    return null;
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    warn('Gmail credentials not set. Add GMAIL_USER and GMAIL_APP_PASSWORD.');
    return null;
  }

  // Fetch all content in parallel
  const [news, problem, tipData, jobs] = await Promise.all([
    fetchNews(),
    generateProblem(),
    generateTipAndTool(),
    fetchJobs(4),
  ]);
  const { subject, html } = buildEmail(news, problem, jobs, tipData);

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from:    `"Locked In 🔒" <${process.env.GMAIL_USER}>`,
    to:      RECIPIENT,
    subject,
    html,
  });

  ok(`✅ Daily digest sent to ${RECIPIENT}`);
  return { news: news.length, problem: !!problem, tip: !!tipData };
}
