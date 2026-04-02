/**
 * tracker.js — Application Tracker page
 */

function addToTracker(job) {
  S.apps.push({
    company: job.company,
    title:   job.title,
    date:    new Date().toLocaleDateString('en-IN'),
    status:  'sent',
    rec:     job.rec || '—',
    logo:    job.logo || '🏢',
  });
  renderTracker();
}

function renderTracker(filter = 'all') {
  const list = filter === 'all' ? S.apps : S.apps.filter(a => a.status === filter);

  document.getElementById('t-empty').style.display = list.length ? 'none' : 'block';

  document.getElementById('tbody').innerHTML = list.map(a => `
    <tr>
      <td data-label="Company">${a.logo} ${a.company}</td>
      <td data-label="Role">${a.title}</td>
      <td data-label="Date">${a.date}</td>
      <td data-label="Status"><span class="sbdg s-${a.status}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span></td>
      <td data-label="Recruiter" style="font-size:11px;color:var(--muted);">${a.rec}</td>
      <td data-label="Update">
        <select
          style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);padding:5px 8px;font-size:12px;cursor:pointer;"
          onchange="updSt(${S.apps.indexOf(a)}, this.value)">
          <option value="sent"      ${a.status === 'sent'      ? 'selected' : ''}>Sent</option>
          <option value="interview" ${a.status === 'interview' ? 'selected' : ''}>Interview</option>
          <option value="offer"     ${a.status === 'offer'     ? 'selected' : ''}>Offer 🎉</option>
          <option value="rejected"  ${a.status === 'rejected'  ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function updSt(idx, status) {
  S.apps[idx].status = status;
  renderTracker();
  updateStats();
  toast('Status updated!', 's');
}

function sTab(filter, el) {
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderTracker(filter);
}
