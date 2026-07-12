/**
 * daily.js — Daily Hub: Problem of the Day, Tech News, Learning Tracker, Reminders
 */

const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initDaily() {
  renderStreakStats();
  renderLearnHistory();
  renderStreakCalendar();
  loadDailyNews();
  loadProblemOfDay();
  restoreReminder();
}

// ─── PROBLEM OF THE DAY ───────────────────────────────────────────────────────
async function loadProblemOfDay() {
  const el = document.getElementById('pod-wrap');
  if (!el) return;

  // Use cached problem if it's from today
  const cached = S.dailyProblem;
  if (cached && cached.date === TODAY) {
    renderProblem(cached.problem);
    return;
  }

  el.innerHTML = `<div class="pod-loading"><div class="spin"></div> Generating today's problem…</div>`;

  if (!hasAIKey()) {
    el.innerHTML = `<div style="padding:14px;color:var(--muted);font-size:12px;">
      Add your <a href="#" onclick="nav('settings',null)" style="color:var(--accent);">free Gemini API key in Settings</a> to get AI-generated problems.
      <div style="margin-top:10px;"></div>
      ${renderFallbackProblem()}
    </div>`;
    return;
  }

  const categories = ['Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Binary Search',
    'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Stacks & Queues', 'Sorting'];
  const cat = categories[new Date().getDate() % categories.length];

  const prompt = `Generate a coding interview problem in the category "${cat}" — the kind asked at Google, Amazon, Flipkart, or Razorpay for fresher/junior roles.

Return ONLY valid JSON (no markdown, no backticks):
{
  "title": "Problem Name",
  "difficulty": "Easy|Medium|Hard",
  "category": "${cat}",
  "problem": "Full problem statement (2-4 sentences, clear and precise)",
  "examples": [
    { "input": "...", "output": "...", "explanation": "..." }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "hints": ["hint 1 (vague)", "hint 2 (more specific)"],
  "solution": "Optimal solution explanation in 2-3 sentences + Python code",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)"
}`;

  try {
    const text = await callAI(prompt, 1200);
    if (!text) throw new Error('no response');
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const problem = JSON.parse(json);

    S.dailyProblem = { date: TODAY, problem };
    persist('dailyProblem', S.dailyProblem);
    renderProblem(problem);
  } catch {
    el.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:10px 0;">${renderFallbackProblem()}</div>`;
  }
}

function renderFallbackProblem() {
  const fallbacks = [
    { title: 'Two Sum', difficulty: 'Easy', category: 'Arrays & Hashing',
      problem: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume exactly one solution exists.',
      examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: '2 + 7 = 9' }],
      constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹'],
      hints: ['Think about what you need to find for each element', 'A hash map lets you check in O(1)'],
      solution: 'Use a hash map {value → index}. For each number, check if target − num exists in the map.\n\ndef twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen: return [seen[target-n], i]\n        seen[n] = i',
      timeComplexity: 'O(n)', spaceComplexity: 'O(n)' },
    { title: 'Valid Parentheses', difficulty: 'Easy', category: 'Stacks',
      problem: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\', \']\', determine if the input string is valid. An input string is valid if open brackets are closed by the same type and in the correct order.',
      examples: [{ input: 's = "()[]{}"', output: 'true', explanation: 'Each bracket closed correctly' }],
      constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of brackets only'],
      hints: ['Use a stack', 'Push open brackets, pop and match on close brackets'],
      solution: 'Push every opening bracket onto a stack. For each closing bracket, check if the top of the stack matches.\n\ndef isValid(s):\n    stack, m = [], {")":"(","}":"{","]":"["}\n    for c in s:\n        if c in m:\n            if not stack or stack[-1] != m[c]: return False\n            stack.pop()\n        else: stack.append(c)\n    return not stack',
      timeComplexity: 'O(n)', spaceComplexity: 'O(n)' },
  ];
  const p = fallbacks[new Date().getDate() % fallbacks.length];
  S.dailyProblem = { date: TODAY, problem: p };
  persist('dailyProblem', S.dailyProblem);
  return buildProblemHTML(p);
}

function renderProblem(p) {
  const el = document.getElementById('pod-wrap');
  if (!el) return;
  const alreadySolved = (S.solvedProblems || []).some(s => s.date === TODAY && s.title === p.title);
  el.innerHTML = buildProblemHTML(p, alreadySolved);
}

function buildProblemHTML(p, solved = false) {
  const diffColor = { Easy: 'var(--green)', Medium: 'var(--orange)', Hard: 'var(--red)' }[p.difficulty] || 'var(--accent)';
  const diffBg    = { Easy: 'var(--gh)',    Medium: 'var(--oh)',     Hard: 'var(--rh)'  }[p.difficulty] || 'var(--ah)';

  const examplesHTML = (p.examples || []).map(ex => `
    <div class="pod-example">
      <div><span class="pod-ex-lbl">Input:</span>  <code>${ex.input}</code></div>
      <div><span class="pod-ex-lbl">Output:</span> <code>${ex.output}</code></div>
      ${ex.explanation ? `<div><span class="pod-ex-lbl">Explanation:</span> ${ex.explanation}</div>` : ''}
    </div>
  `).join('');

  const constraintsHTML = (p.constraints || []).map(c => `<li>${c}</li>`).join('');
  const hintsHTML       = (p.hints || []).map((h, i) => `<div class="pod-hint">💡 Hint ${i + 1}: ${h}</div>`).join('');
  const solutionCode    = (p.solution || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `
    <div class="pod-header">
      <div>
        <div class="pod-title">${p.title}</div>
        <div class="pod-meta">
          <span class="pod-diff" style="color:${diffColor};background:${diffBg};">${p.difficulty}</span>
          <span class="pod-cat">${p.category || ''}</span>
          <span class="pod-complexity">⏱ ${p.timeComplexity || '?'} · 💾 ${p.spaceComplexity || '?'}</span>
        </div>
      </div>
      ${solved
        ? `<div class="pod-solved-badge">✅ Solved Today!</div>`
        : `<button class="btn btn-g bsm" onclick="markSolved('${p.title.replace(/'/g,"\\'")}')">✅ Mark Solved</button>`}
    </div>

    <div class="pod-problem">${p.problem}</div>

    ${examplesHTML ? `<div class="pod-section-lbl">Examples</div>${examplesHTML}` : ''}
    ${constraintsHTML ? `<div class="pod-section-lbl">Constraints</div><ul class="pod-constraints">${constraintsHTML}</ul>` : ''}

    <div class="pod-toggles">
      <button class="btn btn-g bsm" onclick="togglePodSection('pod-hints-body')">💡 Show Hints</button>
      <button class="btn btn-g bsm" onclick="togglePodSection('pod-sol-body')">🔍 Show Solution</button>
      <button class="btn btn-p bsm" onclick="loadProblemOfDay()">🔄 New Problem</button>
    </div>

    <div id="pod-hints-body" class="pod-collapse">
      ${hintsHTML}
    </div>
    <div id="pod-sol-body" class="pod-collapse">
      <pre class="pod-code">${solutionCode}</pre>
    </div>
  `;
}

function togglePodSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open');
}

function markSolved(title) {
  if (!S.solvedProblems) S.solvedProblems = [];
  if (!S.solvedProblems.some(s => s.date === TODAY && s.title === title)) {
    S.solvedProblems.push({ date: TODAY, title, difficulty: S.dailyProblem?.problem?.difficulty || '?' });
    persist('solvedProblems', S.solvedProblems);
  }
  renderProblem(S.dailyProblem.problem);
  renderStreakStats();
  addAct(`Solved today's problem: <strong>${title}</strong>`, '🧩', 'var(--green)');
  toast('Problem marked as solved! Great work! 🎉', 's');
}

// ─── DAILY NEWS ───────────────────────────────────────────────────────────────
async function loadDailyNews() {
  const el = document.getElementById('daily-news-list');
  if (!el) return;

  if (S.newsCache) { renderDailyNews(S.newsCache.slice(0, 4)); return; }

  el.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:8px 0;"><span class="spin"></span> Fetching latest news…</div>`;

  if (!hasAIKey()) {
    renderDailyNews(NEWS.slice(0, 4));
    return;
  }

  try {
    const prompt = 'List the 4 most important tech news stories from the past week: AI/ML breakthroughs, software engineering jobs in India, startup funding, developer tools. Return ONLY a JSON array: [{"title":"...","source":"...","cat":"AI|jobs|startup|tools","excerpt":"1 sentence factual summary","col":"#7c6dfa"}]';
    const text = await callAI(prompt, 600);
    const match = text?.match(/\[[\s\S]*?\]/);
    if (match) {
      const live = JSON.parse(match[0]);
      S.newsCache = [...live, ...NEWS];
      renderDailyNews(live.slice(0, 4));
    } else {
      renderDailyNews(NEWS.slice(0, 4));
    }
  } catch {
    renderDailyNews(NEWS.slice(0, 4));
  }
}

function renderDailyNews(list) {
  const el = document.getElementById('daily-news-list');
  if (!el) return;
  const colors = ['#7c6dfa', '#fb923c', '#34d399', '#38bdf8'];
  el.innerHTML = list.map((n, i) => `
    <div class="daily-news-item">
      <div class="dni-dot" style="background:${n.col || colors[i % 4]};"></div>
      <div class="dni-body">
        <div class="dni-title">${n.title}</div>
        <div class="dni-meta">${n.source || ''} · <span class="ncat" style="font-size:9px;">${n.cat || 'Tech'}</span></div>
        <div class="dni-exc">${n.excerpt || n.exc || ''}</div>
      </div>
    </div>
  `).join('');
}

// ─── LEARNING TRACKER ─────────────────────────────────────────────────────────
function saveLearnEntry() {
  const input = document.getElementById('learn-input');
  const tagEl = document.getElementById('learn-tags');
  const text  = input?.value?.trim();
  if (!text) { toast('Write what you learned first!', 'e'); return; }

  const tags = (tagEl?.value || '').split(',').map(t => t.trim()).filter(Boolean);
  const entry = { id: Date.now(), date: TODAY, text, tags };

  if (!S.learningLog) S.learningLog = [];
  // Replace today's entry if exists, else add
  const existingIdx = S.learningLog.findIndex(e => e.date === TODAY);
  if (existingIdx !== -1) S.learningLog[existingIdx] = entry;
  else S.learningLog.unshift(entry);
  persist('learningLog', S.learningLog);

  if (input) input.value  = '';
  if (tagEl) tagEl.value  = '';
  renderLearnHistory();
  renderStreakStats();
  renderStreakCalendar();
  addAct(`Logged today's learning: <strong>${text.slice(0, 40)}${text.length > 40 ? '…' : ''}</strong>`, '📚', 'var(--sky)');
  toast('Learning entry saved! Keep it up! 🔥', 's');
}

function renderLearnHistory() {
  const el = document.getElementById('learn-history');
  if (!el) return;
  const log = S.learningLog || [];
  if (!log.length) {
    el.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:12px 0;">No entries yet. Write what you learned today!</div>`;
    return;
  }
  el.innerHTML = log.slice(0, 10).map(e => `
    <div class="learn-entry">
      <div class="le-date">${formatDate(e.date)}</div>
      <div class="le-text">${e.text}</div>
      ${e.tags?.length ? `<div class="le-tags">${e.tags.map(t => `<span class="stag" style="font-size:9px;padding:1px 7px;">${t}</span>`).join('')}</div>` : ''}
      <button class="le-del" onclick="deleteLearnEntry('${e.id}')" title="Delete">×</button>
    </div>
  `).join('');
}

function deleteLearnEntry(id) {
  S.learningLog = (S.learningLog || []).filter(e => String(e.id) !== String(id));
  persist('learningLog', S.learningLog);
  renderLearnHistory();
  renderStreakStats();
  renderStreakCalendar();
}

// ─── STREAK ───────────────────────────────────────────────────────────────────
function calcStreak() {
  const log   = S.learningLog || [];
  const dates = [...new Set(log.map(e => e.date))].sort((a, b) => b.localeCompare(a));
  if (!dates.length) return 0;

  let streak = 0;
  let cursor = new Date(TODAY);

  for (const d of dates) {
    const diff = Math.round((cursor - new Date(d)) / 86400000);
    if (diff === 0 || diff === 1) { streak++; cursor = new Date(d); }
    else break;
  }
  return streak;
}

function renderStreakStats() {
  const streak   = calcStreak();
  const solved   = (S.solvedProblems || []).length;
  const daysLog  = new Set((S.learningLog || []).map(e => e.date)).size;
  const todayLog = (S.learningLog || []).some(e => e.date === TODAY);

  const sEl = document.getElementById('daily-streak');
  const pEl = document.getElementById('daily-solved');
  const dEl = document.getElementById('daily-days');
  const rEl = document.getElementById('daily-today');
  if (sEl) sEl.textContent = streak;
  if (pEl) pEl.textContent = solved;
  if (dEl) dEl.textContent = daysLog;
  if (rEl) { rEl.textContent = todayLog ? '✅ Done' : '⏳ Pending'; rEl.style.color = todayLog ? 'var(--green)' : 'var(--orange)'; }
}

// ─── STREAK CALENDAR (last 35 days grid) ──────────────────────────────────────
function renderStreakCalendar() {
  const el = document.getElementById('streak-cal');
  if (!el) return;

  const learnDates  = new Set((S.learningLog || []).map(e => e.date));
  const solvedDates = new Set((S.solvedProblems || []).map(p => p.date));
  const days = 35;
  let html = '';

  for (let i = days - 1; i >= 0; i--) {
    const d    = new Date();
    d.setDate(d.getDate() - i);
    const key  = d.toISOString().slice(0, 10);
    const day  = d.getDate();
    const both = learnDates.has(key) && solvedDates.has(key);
    const learn = learnDates.has(key);
    const solve = solvedDates.has(key);
    const isToday = key === TODAY;

    let bg = 'var(--surface2)';
    let title = `${key}: no activity`;
    if (both)   { bg = 'var(--accent)'; title = `${key}: learned + solved`; }
    else if (learn) { bg = 'var(--sky)';  title = `${key}: learning logged`; }
    else if (solve) { bg = 'var(--green)';title = `${key}: problem solved`; }

    html += `<div class="cal-day${isToday ? ' cal-today' : ''}" style="background:${bg};" title="${title}">${isToday ? '·' : ''}</div>`;
  }

  el.innerHTML = html;
}

// ─── REMINDER ────────────────────────────────────────────────────────────────
function setReminder() {
  const time = document.getElementById('reminder-time')?.value;
  if (!time) return;
  S.reminderTime = time;
  persist('reminderTime', time);
  scheduleNotification(time);
  updateReminderStatus(time);
  toast(`Daily reminder set for ${time} ✅`, 's');
}

function restoreReminder() {
  const saved = loadPersisted('reminderTime', null);
  if (saved) {
    S.reminderTime = saved;
    const el = document.getElementById('reminder-time');
    if (el) el.value = saved;
    updateReminderStatus(saved);
    scheduleNotification(saved);
  }
}

function updateReminderStatus(time) {
  const el = document.getElementById('reminder-status');
  if (!el) return;
  el.innerHTML = `<div class="reminder-badge">🔔 Reminder active: ${time} daily</div>`;
}

function scheduleNotification(time) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  Notification.requestPermission().then(perm => {
    if (perm !== 'granted') return;

    const [h, m]  = time.split(':').map(Number);
    const now     = new Date();
    const next    = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay   = next - now;

    clearTimeout(window._reminderTimer);
    window._reminderTimer = setTimeout(() => {
      new Notification('Locked In — Daily Reminder 🔔', {
        body: '📚 Log what you learned today!\n🧩 Solve your daily problem!\n📰 Check today\'s tech news!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="28" font-size="28">🔒</text></svg>'
      });
      // Reschedule for tomorrow
      scheduleNotification(time);
    }, delay);
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  if (dateStr === TODAY) return 'Today';
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// saveApiKey and saveGeminiKey are defined in js/ai.js (loaded before this file)
