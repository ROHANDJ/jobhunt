/**
 * news.js — Tech News page
 * Fetches live news via Anthropic API + web_search tool.
 * Falls back to static NEWS data if API is unavailable.
 */

async function loadNews() {
  // Return cached news if already fetched
  if (S.newsCache) { renderNews(S.newsCache, 'all'); return; }

  document.getElementById('nload').style.display = 'block';
  document.getElementById('ngrid').style.display = 'none';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: 'Search for the latest tech news today about: AI/ML developments, software engineering jobs in India, Indian startups, and developer tools. Give me 4 real current headlines with 1-sentence summaries. Return ONLY a JSON array with these fields for each: title, source, cat (AI|jobs|startup|tools), excerpt. Raw JSON only — no markdown, no backticks, no explanation.'
        }]
      })
    });

    const data = await res.json();
    const text = (data.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    let liveNews = null;
    try {
      const match = text.match(/\[[\s\S]*?\]/);
      if (match) liveNews = JSON.parse(match[0]);
    } catch (e) { /* JSON parse failed, use fallback */ }

    const colors = ['#7c6dfa', '#fb923c', '#34d399', '#38bdf8'];
    const all = liveNews && liveNews.length
      ? [...liveNews.map((n, i) => ({ ...n, id: 'L' + i, time: 'Just now', col: colors[i % 4] })), ...NEWS]
      : NEWS;

    S.newsCache = all;
    renderNews(all, 'all');

  } catch (e) {
    // Network or API error — use static news
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
    <div class="ncard" onclick="window.open('#', '_blank')">
      <div class="nsrc">
        <div class="ndot" style="background:${n.col || '#7c6dfa'}"></div>
        ${n.source}
      </div>
      <div class="ntl">${n.title}</div>
      <div class="nex">${n.excerpt || n.exc || ''}</div>
      <div class="nfoot">
        <span class="ntime">${n.time}</span>
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
