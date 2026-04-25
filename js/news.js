/**
 * news.js — Tech News page
 * Fetches live news via Gemini API (free) or Anthropic fallback.
 * Falls back to static NEWS data if no API key is set.
 */

async function loadNews() {
  if (S.newsCache) { renderNews(S.newsCache, 'all'); return; }

  document.getElementById('nload').style.display  = 'block';
  document.getElementById('ngrid').style.display  = 'none';

  if (!hasAIKey()) {
    S.newsCache = NEWS;
    renderNews(NEWS, 'all');
    document.getElementById('nload').style.display = 'none';
    document.getElementById('ngrid').style.display = 'grid';
    return;
  }

  const prompt = `Search your knowledge for the latest news (as of today) about:
1. AI/ML model releases and developer tools
2. Software engineering job market in India 2025-2026
3. Indian tech startups and funding news
4. New developer tools, frameworks, GitHub trends

Return ONLY a JSON array with exactly 4 items. Each item must have these fields:
- title: string (headline)
- source: string (news source name)
- cat: string (exactly one of: AI, jobs, startup, tools)
- excerpt: string (1-2 sentence summary, factual)

Raw JSON array only — no markdown backticks, no explanation outside the array.`;

  try {
    const text = await callAI(prompt, 900);
    let liveNews = null;

    if (text) {
      try {
        const match = text.match(/\[[\s\S]*?\]/);
        if (match) liveNews = JSON.parse(match[0]);
      } catch (e) { /* JSON parse failed — use static fallback */ }
    }

    const colors = ['#7c6dfa', '#fb923c', '#34d399', '#38bdf8'];
    const all = liveNews?.length
      ? [...liveNews.map((n, i) => ({ ...n, id: 'L' + i, time: 'Live', col: colors[i % 4] })), ...NEWS]
      : NEWS;

    S.newsCache = all;
    renderNews(all, 'all');

  } catch (e) {
    S.newsCache = NEWS;
    renderNews(NEWS, 'all');
  }

  document.getElementById('nload').style.display = 'none';
  document.getElementById('ngrid').style.display = 'grid';
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
const CAT_CLASS = { AI: 'cai', jobs: 'cjobs', startup: 'cst', tools: 'ctool' };

function renderNews(list, filter) {
  const filtered = filter === 'all'
    ? list
    : list.filter(n => (n.cat || '').toLowerCase() === filter.toLowerCase());

  document.getElementById('ngrid').innerHTML = filtered.map(n => `
    <div class="ncard">
      <div class="nsrc">
        <div class="ndot" style="background:${n.col || '#7c6dfa'}"></div>
        ${n.source}
        ${n.time === 'Live' ? '<span style="font-size:9px;background:var(--accent);color:#fff;border-radius:3px;padding:1px 5px;margin-left:4px;">LIVE</span>' : ''}
      </div>
      <div class="ntl">${n.title}</div>
      <div class="nex">${n.excerpt || n.exc || ''}</div>
      <div class="nfoot">
        <span class="ntime">${n.time || 'Today'}</span>
        <span class="ncat ${CAT_CLASS[n.cat] || 'cai'}">${n.cat}</span>
      </div>
    </div>
  `).join('');
}

// ─── FILTER TABS ─────────────────────────────────────────────────────────────
function fnews(filter, el) {
  document.querySelectorAll('#nfil .fbtn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (S.newsCache) renderNews(S.newsCache, filter);
}

function refreshNews() {
  S.newsCache = null;
  loadNews();
  toast('Refreshing news…', 's');
}
