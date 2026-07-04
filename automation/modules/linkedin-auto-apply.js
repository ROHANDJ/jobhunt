/**
 * linkedin-auto-apply.js — Dedicated LinkedIn auto-apply + referral outreach.
 *
 * Pipeline (one LinkedIn session):
 *   1. Log in to LinkedIn (credentials from .env)
 *   2. Search jobs by your roles / location / filters (Easy Apply, fresher, recent)
 *   3. For each job:
 *        • record it to automation/applications.json  (always, even in dry-run)
 *        • if --auto: auto-fill & submit the Easy Apply form
 *        • if --auto: email the job poster / hiring team a tailored application
 *   4. If --referrals: find colleagues at that company, grab/guess their email,
 *      and send them a short, polite referral request.
 *
 * Everything is logged to JSON so n8n (or you) can read the results.
 *
 * Safety:
 *   • DRY-RUN by default. Nothing is submitted or emailed unless `auto: true`.
 *   • Human-like typing + randomised delays, and a hard daily apply cap.
 *
 * Usage (via runner.js):
 *   node automation/runner.js linkedin                     # dry-run: search + log only
 *   node automation/runner.js linkedin --auto              # really apply + email HR
 *   node automation/runner.js linkedin --auto --referrals  # also email referral contacts
 *   node automation/runner.js linkedin --role "Backend Developer" --location Remote --limit 8
 *
 * Required .env:
 *   LINKEDIN_EMAIL, LINKEDIN_PASSWORD
 *   GMAIL_USER, GMAIL_APP_PASSWORD          (only needed when --auto / --referrals email)
 * Optional .env:
 *   HEADLESS=false            # watch the browser (recommended for first runs / 2FA)
 *   DAILY_APPLY_LIMIT=5       # max Easy Apply submissions per run
 *   REFERRALS_PER_JOB=2       # colleagues to contact per company
 *   COMPANY_EMAIL_PATTERN=first.last   # first.last | firstlast | flast | first
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname }                           from 'path';
import { fileURLToPath }                           from 'url';
import nodemailer                                  from 'nodemailer';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, '..', '..');
const APPS_FILE   = join(ROOT, 'automation', 'applications.json');
const CONTACTS_FILE = join(ROOT, 'automation', 'hr-contacts.json');

const log  = (m) => console.log(`\x1b[36m  →\x1b[0m  ${m}`);
const ok   = (m) => console.log(`\x1b[32m  ✔\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m  ⚠\x1b[0m  ${m}`);
const err  = (m) => console.log(`\x1b[31m  ✖\x1b[0m  ${m}`);

const sleep  = (ms) => new Promise(r => setTimeout(r, ms));
const jitter = (base, spread = 900) => sleep(base + Math.random() * spread);
// Gap between outbound emails so Gmail doesn't flag the burst (min 10s + jitter).
const emailGap = () => sleep(Math.max(10000, parseInt(process.env.EMAIL_SEND_GAP_MS || '10000')) + Math.random() * 3000);

// ── JSON application log ───────────────────────────────────────────────────────
function loadJson(file) {
  if (!existsSync(file)) return [];
  try { return JSON.parse(readFileSync(file, 'utf-8')); } catch { return []; }
}
function saveJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// Record (or update) one application. Deduped by job id/url.
function recordApplication(record, all) {
  const idx = all.findIndex(a => a.id === record.id || (record.url && a.url === record.url));
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...record, updatedAt: new Date().toISOString() };
    return false; // already known
  }
  all.unshift({ ...record, loggedAt: new Date().toISOString() });
  return true; // new
}

function alreadyApplied(id, url, all) {
  return all.some(a => (a.id === id || (url && a.url === url)) && a.status === 'applied');
}

// ── Browser + human-like helpers ──────────────────────────────────────────────
async function launchBrowser() {
  const { chromium } = await import('playwright');
  const headless = process.env.HEADLESS !== 'false';
  return chromium.launch({
    headless,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
}

async function safeClick(page, selector, timeout = 6000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    await jitter(500, 700);
    return true;
  } catch { return false; }
}

async function typeSlowly(page, selector, text) {
  try {
    await page.click(selector);
    await page.fill(selector, '');
    for (const ch of String(text)) {
      await page.type(selector, ch, { delay: 35 + Math.random() * 55 });
    }
    await jitter(150, 350);
    return true;
  } catch { return false; }
}

// ── LinkedIn login ─────────────────────────────────────────────────────────────
async function loginLinkedIn(page) {
  const email    = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;
  if (!email || !password) throw new Error('LINKEDIN_EMAIL / LINKEDIN_PASSWORD not set in .env');

  log('Logging into LinkedIn…');
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await jitter(1200, 900);

  await typeSlowly(page, '#username', email);
  await typeSlowly(page, '#password', password);
  await safeClick(page, 'button[type="submit"]');
  await jitter(3500, 2000);

  const url = page.url();
  if (url.includes('checkpoint') || url.includes('challenge') || url.includes('/uas/')) {
    warn('LinkedIn wants verification (2FA/CAPTCHA). Complete it in the browser — waiting 40s…');
    warn('Tip: run with HEADLESS=false so you can see & solve it.');
    await sleep(40000);
  }
  if (page.url().includes('/feed') || await page.$('.global-nav__me')) {
    ok('LinkedIn login successful');
    return true;
  }
  throw new Error('LinkedIn login failed — check credentials or complete verification with HEADLESS=false.');
}

// ── Build the job search URL ───────────────────────────────────────────────────
function buildSearchUrl(query, location, { easyApplyOnly = true } = {}) {
  const params = new URLSearchParams({
    keywords: query,
    location,
    f_E:   '1,2',       // entry-level + internship
    f_TPR: 'r604800',   // posted in the last 7 days
    sortBy: 'DD',       // most recent first
  });
  if (easyApplyOnly) params.set('f_AL', 'true'); // Easy Apply only
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

// ── Read the currently-open job's header (title / company / location) ──────────
async function readJobHeader(page) {
  const pick = async (sels) => {
    for (const s of sels) {
      const el = await page.$(s);
      const t  = (await el?.textContent())?.trim();
      if (t) return t;
    }
    return '';
  };
  const title = await pick([
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title',
    'h1',
  ]);
  const company = await pick([
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
  ]);
  const location = await pick([
    '.job-details-jobs-unified-top-card__primary-description-container',
    '.jobs-unified-top-card__bullet',
  ]);
  return { title, company, location };
}

// ── Extract the hiring team / job poster ───────────────────────────────────────
async function extractHiringTeam(page) {
  try {
    const posterEl = await page.$('.hirer-card__hirer-information a, .jobs-poster__name a, .jobs-poster__name');
    if (!posterEl) return null;
    const name = (await posterEl.textContent())?.trim();
    let href   = await posterEl.getAttribute('href');
    if (href && !href.startsWith('http')) href = `https://www.linkedin.com${href}`;
    const titleEl = await page.$('.hirer-card__hirer-job-title, .jobs-poster__occupation');
    const title   = (await titleEl?.textContent())?.trim() || 'Recruiter / Hiring Manager';
    return { name: name || 'Hiring Manager', title, linkedinUrl: href || '' };
  } catch { return null; }
}

// Try to read a real email from a profile's Contact-info overlay.
async function readEmailFromProfile(page, profileUrl) {
  if (!profileUrl) return null;
  try {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await jitter(1800, 1200);
    const contactBtn = page.locator('a[href*="overlay/contact-info"]');
    if (await contactBtn.count() > 0) {
      await contactBtn.first().click();
      await jitter(1600, 900);
      const mailto = await page.$('a[href^="mailto:"]');
      const href   = await mailto?.getAttribute('href');
      await safeClick(page, '[aria-label="Dismiss"]', 3000);
      if (href) return href.replace('mailto:', '').trim();
    }
  } catch { /* ignore */ }
  return null;
}

// ── Guess a corporate email from a name + company (flagged as guessed) ─────────
function guessCompanyDomain(company) {
  return company.toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|inc|llc|technologies|technology|labs|solutions|systems|india)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim() + '.com';
}
function guessEmail(fullName, company) {
  const parts = fullName.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/);
  const first = parts[0] || '';
  const last  = parts.length > 1 ? parts[parts.length - 1] : '';
  const domain  = guessCompanyDomain(company);
  const pattern = (process.env.COMPANY_EMAIL_PATTERN || 'first.last').toLowerCase();
  let local;
  switch (pattern) {
    case 'firstlast': local = `${first}${last}`; break;
    case 'flast':     local = `${first.charAt(0)}${last}`; break;
    case 'first':     local = first; break;
    default:          local = last ? `${first}.${last}` : first; // first.last
  }
  return local ? `${local}@${domain}` : null;
}

// ── Auto-fill & submit an Easy Apply form (multi-step) ─────────────────────────
// Returns { applied, reason }
async function submitEasyApply(page, profile, dryRun) {
  const easyBtn = await page.$('button.jobs-apply-button:has-text("Easy Apply"), button.jobs-apply-button');
  if (!easyBtn) return { applied: false, reason: 'no-easy-apply (external application)' };

  if (dryRun) return { applied: false, reason: 'dry-run (would Easy Apply)' };

  await easyBtn.click();
  await jitter(1800, 800);

  const phone    = profile.personal?.phone || '';
  const location = profile.personal?.currentLocation || '';

  // Walk up to 12 steps of the modal.
  for (let step = 0; step < 12; step++) {
    // Phone
    const phoneField = await page.$('input[id*="phoneNumber"], input[id*="phone"]');
    if (phoneField && !(await phoneField.inputValue())) await phoneField.fill(phone).catch(() => {});

    // City / location typeahead
    const locField = await page.$('input[id*="city"], input[id*="location"]');
    if (locField && !(await locField.inputValue())) {
      await locField.fill(location).catch(() => {});
      await jitter(900, 400);
      await safeClick(page, '.basic-typeahead__selectable', 2500);
    }

    // Any empty required numeric answers (years of experience etc.) → default 0/1
    const numInputs = await page.$$('input[type="text"][id*="numeric"], input[type="number"]');
    for (const n of numInputs) {
      if (!(await n.inputValue())) await n.fill('1').catch(() => {});
    }

    // Cover letter (optional)
    const coverField = await page.$('textarea[id*="coverLetter"], textarea[id*="cover"]');
    if (coverField && !(await coverField.inputValue())) {
      const { company, title } = await readJobHeader(page);
      await coverField.fill(buildCoverLetter(profile, company || 'your company', title || (profile.jobPreferences?.roles?.[0] || 'Software Engineer'))).catch(() => {});
    }

    const submitBtn = await page.$('button[aria-label*="Submit application"], button:has-text("Submit application")');
    const reviewBtn = await page.$('button[aria-label*="Review"], button:has-text("Review")');
    const nextBtn   = await page.$('button[aria-label*="Continue to next step"], button:has-text("Next")');

    if (submitBtn) {
      await submitBtn.click();
      await jitter(1800, 700);
      // Dismiss the post-apply "done" modal
      await safeClick(page, 'button[aria-label="Dismiss"]', 4000);
      return { applied: true, reason: 'submitted' };
    }
    if (reviewBtn) { await reviewBtn.click(); await jitter(1200, 500); continue; }
    if (nextBtn)   { await nextBtn.click();   await jitter(1200, 500); continue; }

    // Nothing actionable → likely a question we can't answer safely. Bail out cleanly.
    await safeClick(page, 'button[aria-label="Dismiss"]', 2500);
    await safeClick(page, 'button:has-text("Discard")', 2500);
    return { applied: false, reason: `stuck at step ${step + 1} (extra questions) — apply manually` };
  }
  return { applied: false, reason: 'too many steps — apply manually' };
}

// ── Search + apply loop for one query ──────────────────────────────────────────
async function processQuery(page, query, location, profile, opts, apps) {
  const { auto, limit } = opts;
  const url = buildSearchUrl(query, location, { easyApplyOnly: opts.easyApplyOnly });
  log(`Searching "${query}" in ${location}${opts.easyApplyOnly ? ' (Easy Apply)' : ''}…`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await jitter(2500, 1500);

  for (let i = 0; i < 4; i++) { await page.evaluate(() => window.scrollBy(0, 700)); await jitter(700, 500); }

  const cards = await page.$$('.job-card-container, .jobs-search-results__list-item');
  log(`Found ${cards.length} job cards`);

  const results = [];
  for (let i = 0; i < cards.length; i++) {
    if (opts.appliedThisRun.count >= limit) { warn(`Daily apply cap (${limit}) reached — stopping.`); break; }
    try {
      await cards[i].click();
      await jitter(1800, 1200);

      const { title, company, location: jobLoc } = await readJobHeader(page);
      const jobUrl = page.url().split('?')[0];
      const idMatch = jobUrl.match(/\/view\/(\d+)/) || page.url().match(/currentJobId=(\d+)/);
      const id = `linkedin-${idMatch ? idMatch[1] : jobUrl}`;

      if (!title || !company) continue;

      if (alreadyApplied(id, jobUrl, apps)) {
        log(`↷ Skip (already applied): ${company} — ${title}`);
        continue;
      }

      log(`[${company}] ${title}`);

      const poster = await extractHiringTeam(page);

      const record = {
        id, source: 'linkedin', company, role: title, location: jobLoc || location,
        url: jobUrl, mode: auto ? 'auto' : 'dry-run',
        easyApply: opts.easyApplyOnly,
        hrContact: poster ? { name: poster.name, title: poster.title, linkedinUrl: poster.linkedinUrl } : null,
        emailedHR: false, referralsSent: 0,
      };

      const { applied, reason } = await submitEasyApply(page, profile, !auto);
      record.status = applied ? 'applied' : (auto ? 'skipped' : 'pending');
      record.reason = reason;
      if (applied) { opts.appliedThisRun.count++; ok(`  Applied ✓ (${opts.appliedThisRun.count}/${limit})`); }
      else         { warn(`  Not applied — ${reason}`); }

      recordApplication(record, apps);
      results.push(record);
      saveJson(APPS_FILE, apps); // persist after each job so nothing is lost

      await jitter(2500, 1500);
    } catch (e) {
      warn(`  Error on job ${i + 1}: ${e.message}`);
    }
  }
  return results;
}

// ── Email templates ─────────────────────────────────────────────────────────────
function buildCoverLetter(profile, company, role) {
  const edu    = profile.education?.ug || {};
  const skills = profile.skills?.technical?.slice(0, 4).map(s => s.name).join(', ') || 'Python, SQL, DSA';
  const proj   = profile.projects?.[0];
  return `Dear Hiring Manager,

I am applying for the ${role} position at ${company}. I am a ${edu.degree || 'B.Tech'} graduate in ${edu.branch || 'Computer Science'} from ${edu.institution || 'my university'} with hands-on skills in ${skills}.${proj ? ` I recently built ${proj.title} — ${(proj.description || '').slice(0, 110)}.` : ''}

I am available to join immediately and would be glad to contribute from day one.

Regards,
${profile.personal?.name || 'Candidate'} | ${profile.personal?.email || ''} | ${profile.personal?.phone || ''}`;
}

function hrEmail(profile, contact) {
  const name    = profile.personal?.name || 'Candidate';
  const role    = contact.position || contact.role || (profile.jobPreferences?.roles?.[0] || 'Software Engineer');
  const skills  = profile.skills?.technical?.slice(0, 5).map(s => s.name).join(', ') || 'Python, SQL, DSA';
  const edu     = profile.education?.ug || {};
  const proj    = profile.projects?.[0];
  const links   = profile.links || {};
  const subject = `Application for ${role} at ${contact.company} — ${name}`;
  const body =
`Dear ${contact.name || 'Hiring Manager'},

I came across the ${role} opening at ${contact.company} and wanted to reach out directly, as I'm genuinely excited about the work your team is doing.

A quick snapshot of my background:
• ${edu.degree || 'B.Tech'} in ${edu.branch || 'Computer Science'}, ${edu.institution || ''}${edu.cgpa ? ` (CGPA ${edu.cgpa}/${edu.cgpaScale || '10'})` : ''}
• Core skills: ${skills}
${proj ? `• Recent project: ${proj.title} — ${(proj.description || '').slice(0, 120)}` : ''}

I'm available to start immediately and have attached my resume for your review. I'd be grateful for even a brief conversation about how I can add value to the team.

Thank you for your time and consideration.

Best regards,
${name}
${profile.personal?.phone || ''} | ${profile.personal?.email || ''}
${[links.linkedin, links.github].filter(Boolean).join(' | ')}`;
  return { subject, body };
}

function referralEmail(profile, contact) {
  const name    = profile.personal?.name || 'Candidate';
  const role    = contact.position || (profile.jobPreferences?.roles?.[0] || 'Software Engineer');
  const skills  = profile.skills?.technical?.slice(0, 3).map(s => s.name).join(', ') || 'Python, SQL';
  const subject = `Quick referral request — ${role} at ${contact.company}`;
  const body =
`Hi ${(contact.name || '').split(' ')[0] || 'there'},

Apologies for reaching out cold — I really admire the work at ${contact.company} and noticed you're on the team there.

I'm ${name}, a fresher with hands-on experience in ${skills}, and I'm applying for the ${role} role. If you feel it's appropriate, I'd be truly grateful for a referral — and I completely understand if not.

I've attached my resume so you can take a quick look. Happy to share anything else that would help.

Thank you so much for your time!

Warm regards,
${name}
${profile.personal?.email || ''}`;
  return { subject, body };
}

// ── Mailer ───────────────────────────────────────────────────────────────────
function makeTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    pool: true, maxConnections: 2,
  });
}

function resumeAttachment(profile) {
  const rel = profile.resume?.filePath;
  if (!rel) return [];
  const abs = join(ROOT, rel.replace(/^\.\//, ''));
  if (!existsSync(abs)) return [];
  return [{ filename: `${(profile.personal?.name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`, path: abs }];
}

async function sendMail(transporter, profile, to, subject, body) {
  await transporter.sendMail({
    from:        `"${profile.personal?.name || 'Candidate'}" <${process.env.GMAIL_USER}>`,
    to, subject, text: body,
    attachments: resumeAttachment(profile),
    headers:     { 'X-Mailer': 'JobHunt Pro' },
  });
}

// ── Referral outreach: find colleagues at a company & email them ───────────────
async function outreachReferrals(page, transporter, profile, company, perJob, contacts) {
  const found = [];
  try {
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(company)}&origin=SWITCH_SEARCH_VERTICAL`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 22000 });
    await jitter(2200, 1200);

    const people = await page.$$('.reusable-search__result-container, .entity-result');
    for (const p of people.slice(0, perJob * 3)) {
      if (found.length >= perJob) break;
      const linkEl = await p.$('a[href*="/in/"]');
      const nameEl = await p.$('.entity-result__title-text a span[aria-hidden="true"], .entity-result__title-text span[aria-hidden="true"]');
      const name   = (await nameEl?.textContent())?.trim();
      let   href   = await linkEl?.getAttribute('href');
      if (!name || !href) continue;
      if (href && !href.startsWith('http')) href = `https://www.linkedin.com${href}`;
      href = href.split('?')[0];

      // Try a real email; fall back to a pattern guess (flagged).
      let email = await readEmailFromProfile(page, href);
      const hasRealEmail = !!email;
      if (!email) email = guessEmail(name, company);
      if (!email) continue;

      found.push({ name, company, email, hasRealEmail, linkedinUrl: href,
                   position: profile.jobPreferences?.roles?.[0] || 'Software Engineer',
                   source: 'linkedin-referral', scrapedAt: new Date().toISOString() });
      await page.goBack({ timeout: 12000 }).catch(() => {});
      await jitter(1500, 900);
    }
  } catch (e) { warn(`  Referral search failed for ${company}: ${e.message}`); }

  let sent = 0;
  for (const c of found) {
    // de-dupe against existing contacts
    if (contacts.some(x => x.email === c.email)) continue;
    contacts.unshift(c);
    if (transporter) {
      const { subject, body } = referralEmail(profile, c);
      try {
        await sendMail(transporter, profile, c.email, subject, body);
        sent++;
        ok(`  Referral emailed: ${c.name} <${c.email}>${c.hasRealEmail ? '' : ' (guessed)'}`);
        await emailGap();
      } catch (e) { warn(`  Referral email failed → ${c.email}: ${e.message}`); }
    } else {
      log(`  Referral contact saved (no mailer): ${c.name} <${c.email}>`);
    }
  }
  return sent;
}

// ── Main export ─────────────────────────────────────────────────────────────────
export async function runLinkedInAutoApply(profile, options = {}) {
  const opts = {
    auto:          options.auto === true,           // false ⇒ dry-run
    referrals:     options.referrals === true,
    easyApplyOnly: options.easyApplyOnly !== false,  // default true
    limit:         parseInt(options.limit || process.env.DAILY_APPLY_LIMIT || '5'),
    location:      options.location || (profile.personal?.currentLocation || 'India').split(',')[0].trim(),
    roles:         options.role ? [options.role] : (profile.jobPreferences?.roles || ['Software Engineer']).slice(0, 3),
    perJob:        parseInt(process.env.REFERRALS_PER_JOB || '2'),
    appliedThisRun: { count: 0 },
  };

  if (!process.env.LINKEDIN_EMAIL || !process.env.LINKEDIN_PASSWORD) {
    err('Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in .env first.');
    return { ok: false, error: 'linkedin credentials missing' };
  }
  if (opts.auto && (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)) {
    warn('GMAIL creds missing — will auto-apply but skip HR/referral emails.');
  }

  console.log(`\x1b[1m\x1b[36m  LinkedIn Auto-Apply\x1b[0m  ${opts.auto ? '\x1b[31m[LIVE]\x1b[0m' : '\x1b[33m[DRY-RUN]\x1b[0m'}`);
  log(`Roles: ${opts.roles.join(', ')}  |  Location: ${opts.location}  |  Cap: ${opts.limit}  |  Referrals: ${opts.referrals ? 'on' : 'off'}`);

  const apps        = loadJson(APPS_FILE);
  const contacts    = loadJson(CONTACTS_FILE);
  const transporter = makeTransporter();

  const browser = await launchBrowser();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport:  { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const summary = { applied: 0, logged: 0, hrEmailed: 0, referralsSent: 0, jobs: [] };

  try {
    await loginLinkedIn(page);

    for (const role of opts.roles) {
      const query = `${role} fresher`;
      const results = await processQuery(page, query, opts.location, profile, opts, apps);
      summary.logged += results.length;

      for (const rec of results) {
        if (rec.status === 'applied') summary.applied++;

        // Email the HR / job poster (only in live mode, only if we have a route)
        if (opts.auto && transporter && rec.hrContact?.linkedinUrl) {
          let email = await readEmailFromProfile(page, rec.hrContact.linkedinUrl);
          if (email) {
            const { subject, body } = hrEmail(profile, { ...rec.hrContact, company: rec.company, position: rec.role });
            try {
              await sendMail(transporter, profile, email, subject, body);
              rec.emailedHR = true; summary.hrEmailed++;
              ok(`  HR emailed: ${rec.hrContact.name} <${email}>`);
              contacts.unshift({ name: rec.hrContact.name, title: rec.hrContact.title, email,
                                 company: rec.company, position: rec.role, source: 'linkedin-hr',
                                 hasRealEmail: true, scrapedAt: new Date().toISOString() });
              await emailGap();
            } catch (e) { warn(`  HR email failed: ${e.message}`); }
          }
        }

        // Referral outreach for this company
        if (opts.referrals) {
          const sent = await outreachReferrals(page, opts.auto ? transporter : null, profile, rec.company, opts.perJob, contacts);
          rec.referralsSent = sent; summary.referralsSent += sent;
        }
      }
      saveJson(APPS_FILE, apps);
      saveJson(CONTACTS_FILE, contacts);
      summary.jobs.push(...results);
      await jitter(3000, 2000);
    }

    saveJson(APPS_FILE, apps);
    saveJson(CONTACTS_FILE, contacts);

    console.log('');
    ok(`Done. Applied: ${summary.applied} · Logged: ${summary.logged} · HR emailed: ${summary.hrEmailed} · Referrals sent: ${summary.referralsSent}`);
    log(`Applications JSON: ${APPS_FILE}`);
    log(`Contacts JSON:     ${CONTACTS_FILE}`);
    return { ok: true, mode: opts.auto ? 'auto' : 'dry-run', ...summary };

  } catch (e) {
    err(`Auto-apply failed: ${e.message}`);
    return { ok: false, error: e.message, ...summary };
  } finally {
    await browser.close();
  }
}
