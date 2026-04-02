/**
 * profile.js — Profile page: skills management, score calculation,
 *              sync to composer, sidebar sync
 */

// ─── IMPORT FROM profile.json ────────────────────────────────────────────────
/**
 * Load profile.json (served alongside index.html) and populate all fields.
 * Works when served via a local server; silently skips if file not found.
 */
async function importProfileJSON() {
  try {
    const res = await fetch('./profile.json');
    if (!res.ok) return;
    const data = await res.json();

    // Personal
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('p-name',  data.personal?.name);
    set('p-email', data.personal?.email);
    set('p-phone', data.personal?.phone);
    set('p-loc',   data.personal?.currentLocation);
    set('p-li',    data.links?.linkedin);
    set('p-gh',    data.links?.github);
    set('p-bio',   data.bio);

    // Education
    const edu = data.education?.ug;
    if (edu) {
      set('p-col',  edu.institution);
      set('p-deg',  `${edu.degree} ${edu.branch}`);
      set('p-grad', edu.endYear);
      set('p-cgpa', edu.cgpa);
    }

    // Skills
    const techSkills = (data.skills?.technical || []).map(s => typeof s === 'string' ? s : s.name);
    if (techSkills.length) {
      techSkills.forEach(sk => { if (!S.skills.includes(sk)) S.skills.push(sk); });
      renderSkills();
    }

    syncSide();
    saveProfileFields();
    toast('Profile loaded from profile.json!', 's');
  } catch {
    // Silently skip if profile.json not available
  }
}

// ─── EXPORT profile as JSON ───────────────────────────────────────────────────
function exportProfileJSON() {
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  const profile = {
    personal: {
      name:            get('p-name'),
      email:           get('p-email'),
      phone:           get('p-phone'),
      currentLocation: get('p-loc'),
    },
    links: {
      linkedin: get('p-li'),
      github:   get('p-gh'),
    },
    education: {
      ug: {
        institution: get('p-col'),
        degree:      get('p-deg').split(' ')[0] || 'B.Tech',
        branch:      get('p-deg').split(' ').slice(1).join(' ') || 'Computer Science',
        cgpa:        get('p-cgpa'),
        endYear:     get('p-grad'),
      }
    },
    skills: {
      technical: S.skills.map(s => ({ name: s, proficiency: 'Intermediate', yearsOfExperience: 1 })),
    },
    bio: get('p-bio'),
  };
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'profile.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('profile.json downloaded!', 's');
}

// ─── SKILLS ──────────────────────────────────────────────────────────────────
function addSkill() {
  const input = document.getElementById('skill-in');
  const skill = input.value.trim();
  if (!skill) return;
  if (!S.skills.includes(skill)) S.skills.push(skill);
  input.value = '';
  renderSkills();
}

function bulkS(arr) {
  arr.forEach(s => { if (!S.skills.includes(s)) S.skills.push(s); });
  renderSkills();
  toast(`${arr.length} skills added!`, 's');
}

function removeSkill(skill) {
  S.skills = S.skills.filter(s => s !== skill);
  renderSkills();
}

function renderSkills() {
  document.getElementById('skills-wrap').innerHTML =
    S.skills.map(s => `
      <span class="stag" onclick="removeSkill('${s}')" title="Click to remove">
        ${s} ×
      </span>
    `).join('');
}

// ─── SIDEBAR SYNC ─────────────────────────────────────────────────────────────
function syncSide() {
  const name = document.getElementById('p-name').value;
  if (!name) return;
  document.getElementById('s-name').textContent = name;
  document.getElementById('s-ava').textContent  = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── SAVE & SCORE ─────────────────────────────────────────────────────────────
function saveProfile() {
  syncSide();
  calcScore();
  saveProfileFields();  // persist to localStorage
  toast('Profile saved!', 's');
}

function calcScore() {
  const fields = [
    'p-name', 'p-email', 'p-phone', 'p-loc',
    'p-col',  'p-deg',   'p-grad',  'p-bio',
    'p-li',   'p-gh'
  ];
  const filled     = fields.filter(id => document.getElementById(id).value.trim()).length;
  const fieldScore = Math.round((filled / fields.length) * 60);
  const skillScore = Math.min(35, S.skills.length * 7);
  const score      = Math.min(100, fieldScore + skillScore);

  document.getElementById('ds-score').textContent = score + '%';

  const sub = document.getElementById('ds-score-sub');
  if (score >= 80) { sub.textContent = '↑ Looking great!';  sub.className = 'ssub sup'; }
  else if (score >= 50) { sub.textContent = '↑ Getting there'; sub.className = 'ssub sup'; }
  else { sub.textContent = '↓ Fill profile'; sub.className = 'ssub sdn'; }

  toast(`Profile score: ${score}%`, 'i');
}

// ─── SYNC TO COMPOSER ─────────────────────────────────────────────────────────
function syncComposer() {
  const name   = document.getElementById('p-name').value;
  const email  = document.getElementById('p-email').value;
  const col    = document.getElementById('p-col').value;
  const deg    = document.getElementById('p-deg').value;
  const grad   = document.getElementById('p-grad').value;
  const cgpa   = document.getElementById('p-cgpa').value;

  if (name)  document.getElementById('c-name').value   = name;
  if (email) document.getElementById('c-email').value  = email;
  if (cgpa)  document.getElementById('c-cgpa').value   = cgpa;

  if (col || deg) {
    const colStr = `${deg || ''}${grad ? ', ' + grad : ''}, ${col || ''}`.trim().replace(/^,\s*/, '');
    document.getElementById('c-college').value = colStr;
  }

  if (S.skills.length) {
    document.getElementById('c-skills').value = S.skills.slice(0, 7).join(', ');
  }

  updatePrev();
  nav('apply', null);
  toast('Profile synced to composer!', 's');
}
