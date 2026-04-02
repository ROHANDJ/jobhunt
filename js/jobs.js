/**
 * jobs.js — Job Board page logic
 * Rendering, filtering, applying, job detail modal
 */

// ─── RENDER ───────────────────────────────────────────────────────────────────
function renderJobs(filter = 'all') {
  let list;
  switch (filter) {
    case 'swe':     list = JOBS.filter(j => j.dom === 'swe');         break;
    case 'ds':      list = JOBS.filter(j => j.dom === 'ds');          break;
    case 'intern':  list = JOBS.filter(j => j.intern);                break;
    case 'remote':  list = JOBS.filter(j => j.remote);                break;
    case 'applied': list = JOBS.filter(j => S.applied.has(j.id));     break;
    default:        list = JOBS;
  }
  document.getElementById('jct').textContent = `(${list.length} openings)`;
  renderJobCards(list);
}

function renderJobCards(list) {
  const grid = document.getElementById('jgrid');
  if (!list.length) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="emico">🔍</div><p class="emtxt">No jobs match this filter.</p></div>';
    return;
  }
  grid.innerHTML = list.map(j => `
    <div class="jcard" onclick="openJD(${j.id})">
      <div class="fok">✓ Fresher OK</div>
      <div class="jcard-top">
        <div class="clogo">${j.logo}</div>
        <div>
          <div class="jt">${j.title}</div>
          <div class="jco">${j.company}</div>
        </div>
      </div>
      <div class="jtags">
        ${j.remote  ? '<span class="tag tr">🌍 Remote</span>' : ''}
        ${j.intern  ? '<span class="tag tf">🎓 Intern</span>' : ''}
        <span class="tag ts">${j.salary}</span>
        <span class="tag tt">${j.exp}</span>
        ${j.tags.map(t => `<span class="tag tt">${t}</span>`).join('')}
      </div>
      <div class="jfoot">
        <span class="jtime">Posted ${j.posted}</span>
        ${S.applied.has(j.id)
          ? '<span class="ap">✅ Applied</span>'
          : `<button class="jbtn" onclick="event.stopPropagation();applyJob(${j.id})">Apply</button>`
        }
      </div>
    </div>
  `).join('');
}

// ─── FILTER TABS ─────────────────────────────────────────────────────────────
function fjobs(filter, el) {
  document.querySelectorAll('#jfil .fbtn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderJobs(filter);
}

// ─── APPLY ───────────────────────────────────────────────────────────────────
function applyJob(id) {
  const j = JOBS.find(x => x.id === id);
  if (!j) return;

  S.applied.add(id);
  addToTracker(j);
  addAct(`Applied to <strong>${j.title}</strong> at ${j.company}`, '✉️', 'var(--accent)');
  updateStats();
  renderJobs();
  toast(`Applied to ${j.company}!`, 's');
}

// ─── JOB DETAIL MODAL ────────────────────────────────────────────────────────
function openJD(id) {
  const j = JOBS.find(x => x.id === id);
  if (!j) return;

  document.getElementById('jdm-ttl').textContent = `${j.logo} ${j.title} @ ${j.company}`;
  document.getElementById('jdm-body').innerHTML = `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:13px;">
      ${j.remote ? '<span class="tag tr">🌍 Remote</span>' : '<span class="tag tt">🏢 On-site</span>'}
      ${j.intern ? '<span class="tag tf">🎓 Internship</span>' : '<span class="tag tt">Full-time</span>'}
      <span class="tag ts">${j.salary}</span>
      <span class="tag tt">${j.exp}</span>
    </div>
    <div style="font-size:12.5px;color:var(--muted);line-height:1.8;margin-bottom:13px;">${j.desc}</div>
    <div style="margin-bottom:9px;font-size:12.5px;"><strong>Required skills:</strong> ${j.tags.join(', ')}</div>
    <div style="margin-bottom:14px;font-size:11px;color:var(--muted);">Recruiter: ${j.rec}</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;">
      ${S.applied.has(j.id)
        ? '<span class="ap" style="padding:8px 16px;">✅ Already Applied</span>'
        : `<button class="btn btn-p" onclick="applyJob(${j.id});closeM('jd-modal')">⚡ Apply Now</button>`
      }
      <button class="btn btn-g" onclick="addRecFromJob('${j.rec}')">+ Add to Campaign</button>
    </div>
  `;
  openM('jd-modal');
}
