/**
 * dashboard.js — Dashboard widgets: stats, bar chart, activity feed,
 *                job picks, news highlights, roadmap
 */

// ─── STATS ────────────────────────────────────────────────────────────────────
function updateStats() {
  const totalSent = S.sentCt + S.apps.length;
  document.getElementById('ds-sent').textContent = totalSent;
  document.getElementById('ds-sub').textContent  = totalSent > 0
    ? `↑ ${totalSent} total sent`
    : 'Start your campaign ↗';

  const responses = S.apps.filter(a => a.status === 'interview' || a.status === 'offer').length;
  document.getElementById('ds-resp').textContent = responses;
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
/**
 * Add an activity item to the dashboard feed.
 * @param {string} text  - HTML string for the activity
 * @param {string} icon  - emoji icon
 * @param {string} color - CSS color for the dot
 */
function addAct(text, icon, color) {
  const feed = document.getElementById('actfeed');
  const item = document.createElement('div');
  item.className = 'ai';
  item.innerHTML = `
    <div class="adot" style="background:${color};"></div>
    <div>
      <div class="atxt">${icon} ${text}</div>
      <div class="atime">Just now</div>
    </div>
  `;
  feed.prepend(item);
  // Keep feed to last 7 items
  if (feed.children.length > 7) feed.lastChild.remove();
}

function buildDefaultActivity() {
  [
    { t: 'Welcome! Complete your profile for better job matches.', i: '👋', c: 'var(--accent)' },
    { t: '18 fresher-friendly openings in SWE & DS/ML today.',    i: '🔍', c: 'var(--green)'  },
    { t: 'Tech news updated — AI & hiring news available.',        i: '📰', c: 'var(--orange)' },
  ].forEach(a => addAct(a.t, a.i, a.c));
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function buildBarChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [1, 3, 2, 5, 3, 0, S.sentCt];
  const max  = Math.max(...data, 1);

  document.getElementById('bchart').innerHTML = data.map((v, i) => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
      <div class="bbar" style="height:${Math.max(4, (v / max) * 62)}px;width:100%;" data-v="${v}"></div>
      <div class="blab">${days[i]}</div>
    </div>
  `).join('');
}

// ─── TOP JOB PICKS (Dashboard) ───────────────────────────────────────────────
function buildDashboardJobs() {
  document.getElementById('d-jobs').innerHTML = JOBS.slice(0, 4).map(j => `
    <div style="padding:9px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:9px;cursor:pointer;"
         onclick="openJD(${j.id})">
      <div class="clogo" style="width:30px;height:30px;font-size:13px;">${j.logo}</div>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:600;">${j.title}</div>
        <div style="font-size:10px;color:var(--muted);">${j.company} · ${j.salary}${j.intern ? ' · Intern' : ''}</div>
      </div>
      <span style="font-size:8.5px;padding:2px 6px;border-radius:7px;background:var(--gh);color:var(--green);font-weight:700;">Fresher OK</span>
    </div>
  `).join('');
}

// ─── NEWS HIGHLIGHTS (Dashboard) ──────────────────────────────────────────────
function buildDashboardNews() {
  document.getElementById('d-news').innerHTML = NEWS.slice(0, 3).map(n => `
    <div style="padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="font-size:11.5px;font-weight:600;line-height:1.4;margin-bottom:2px;">${n.title}</div>
      <div style="font-size:9.5px;color:var(--muted);">${n.source} · ${n.time}</div>
    </div>
  `).join('');
}

// ─── DSA ROADMAP ─────────────────────────────────────────────────────────────
function renderRoadmap() {
  document.getElementById('rm-grid').innerHTML = ROADMAP.map(r => `
    <div class="card" style="border-left:3px solid ${r.sc};">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:11px;">
        <div style="font-size:20px;">${r.icon}</div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;">${r.title}</div>
          <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:9px;
            background:${r.sc}20;color:${r.sc};border:1px solid ${r.sc}40;display:inline-block;margin-top:3px;">
            ${r.status}
          </span>
        </div>
      </div>
      <div style="font-size:11.5px;color:var(--muted);line-height:1.65;margin-bottom:11px;">${r.sub}</div>
      <div style="font-size:11px;">
        ${r.items.map(item => `
          <div style="padding:5px 0;border-bottom:1px solid var(--border);display:flex;gap:6px;">
            <span style="color:${r.sc};">→</span>
            <span style="color:var(--muted);">${item}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}
