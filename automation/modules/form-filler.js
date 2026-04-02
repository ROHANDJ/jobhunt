/**
 * form-filler.js — Auto-fill and submit job applications on major Indian job sites.
 *
 * Supported sites:
 *   naukri       — Naukri.com (profile update + job apply)
 *   internshala  — Internshala (job/internship apply)
 *   linkedin     — LinkedIn Easy Apply
 *
 * Credentials must be set in .env:
 *   NAUKRI_EMAIL / NAUKRI_PASSWORD
 *   INTERNSHALA_EMAIL / INTERNSHALA_PASSWORD
 *   LINKEDIN_EMAIL / LINKEDIN_PASSWORD
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync }    from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..', '..');

const log  = (m) => console.log(`\x1b[36m  →\x1b[0m  ${m}`);
const ok   = (m) => console.log(`\x1b[32m  ✔\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m  ⚠\x1b[0m  ${m}`);

// ── Human-like helpers ────────────────────────────────────────────────────────
const sleep   = (ms) => new Promise(r => setTimeout(r, ms));
const jitter  = (base, spread = 800) => sleep(base + Math.random() * spread);

async function typeSlowly(page, selector, text) {
  await page.click(selector);
  await page.fill(selector, '');
  for (const ch of text) {
    await page.type(selector, ch, { delay: 30 + Math.random() * 60 });
  }
  await jitter(200, 400);
}

async function safeClick(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
    await jitter(500, 600);
    return true;
  } catch { return false; }
}

async function safeFill(page, selector, value, timeout = 4000) {
  try {
    await page.waitForSelector(selector, { timeout });
    await page.fill(selector, value);
    await jitter(200, 300);
    return true;
  } catch { return false; }
}

// ── Launch browser ────────────────────────────────────────────────────────────
async function launchBrowser() {
  const { chromium } = await import('playwright');
  const headless = process.env.HEADLESS !== 'false';
  return chromium.launch({
    headless,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });
}

// ── NAUKRI.COM ────────────────────────────────────────────────────────────────
async function fillNaukri(profile) {
  const email    = process.env.NAUKRI_EMAIL;
  const password = process.env.NAUKRI_PASSWORD;
  if (!email || !password) {
    warn('NAUKRI_EMAIL / NAUKRI_PASSWORD not set in .env. Skipping Naukri.');
    return { applied: 0, error: 'credentials missing' };
  }

  const browser = await launchBrowser();
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
  const page    = await context.newPage();
  let applied   = 0;

  try {
    // ── Login ─────────────────────────────────────────────────────────────────
    log('Naukri: Logging in…');
    await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'domcontentloaded' });
    await jitter(1500, 1000);

    await safeFill(page, 'input[placeholder="Enter your active Email ID / Username"]', email);
    await safeFill(page, 'input[placeholder="Enter your password"]', password);
    await safeClick(page, 'button[type="submit"]');
    await jitter(3000, 1000);

    // Check if logged in
    const loggedIn = await page.$('a[title="View and update your profile"]');
    if (!loggedIn) {
      warn('Naukri: Login failed. Check your credentials.');
      await browser.close();
      return { applied: 0, error: 'login failed' };
    }
    ok('Naukri: Logged in successfully');

    // ── Update profile headline ───────────────────────────────────────────────
    await page.goto('https://www.naukri.com/mnjuser/profile', { waitUntil: 'domcontentloaded' });
    await jitter(2000, 500);
    log('Naukri: Profile page loaded');

    // ── Search and apply to jobs ──────────────────────────────────────────────
    const roles = profile.jobPreferences?.roles || ['Software Engineer'];
    const limit = parseInt(process.env.DAILY_APPLY_LIMIT || '10');

    for (const role of roles.slice(0, 2)) {
      const query = encodeURIComponent(`${role} fresher`);
      log(`Naukri: Searching "${role} fresher"…`);
      await page.goto(`https://www.naukri.com/jobs-in-india?k=${query}&experience=0`, { waitUntil: 'domcontentloaded' });
      await jitter(2500, 1000);

      // Get apply buttons
      const applyBtns = await page.$$('.apply-button, button[id^="applyButton"]');
      log(`Naukri: Found ${applyBtns.length} jobs to apply`);

      for (const btn of applyBtns.slice(0, Math.ceil(limit / roles.length))) {
        try {
          // Open job in new tab
          const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            btn.click(),
          ]);
          await newPage.waitForLoadState('domcontentloaded');
          await jitter(2000, 800);

          // Click Apply / Easy Apply
          const applied_btn = await newPage.$('button:has-text("Apply"), button:has-text("Easy Apply"), a:has-text("Apply Now")');
          if (applied_btn) {
            await applied_btn.click();
            await jitter(2000, 500);

            // Handle any confirmation dialog
            const confirm = await newPage.$('button:has-text("Apply"), button:has-text("Submit")');
            if (confirm) {
              await confirm.click();
              await jitter(1500, 500);
            }

            const company = await newPage.$eval('.company-name, .jd-header-comp-name', el => el.innerText.trim()).catch(() => 'Unknown');
            ok(`Naukri: Applied to ${company}`);
            applied++;
          }

          await newPage.close();
          await jitter(3000, 1000);

          if (applied >= limit) break;
        } catch (e) {
          // Skip this job and continue
        }
      }
      if (applied >= limit) break;
    }

  } catch (e) {
    warn(`Naukri error: ${e.message}`);
  } finally {
    await browser.close();
  }

  return { applied };
}

// ── INTERNSHALA ───────────────────────────────────────────────────────────────
async function fillInternshala(profile) {
  const email    = process.env.INTERNSHALA_EMAIL;
  const password = process.env.INTERNSHALA_PASSWORD;
  if (!email || !password) {
    warn('INTERNSHALA_EMAIL / INTERNSHALA_PASSWORD not set in .env. Skipping Internshala.');
    return { applied: 0, error: 'credentials missing' };
  }

  const browser = await launchBrowser();
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' });
  const page    = await context.newPage();
  let applied   = 0;

  try {
    // ── Login ─────────────────────────────────────────────────────────────────
    log('Internshala: Logging in…');
    await page.goto('https://internshala.com/login/student', { waitUntil: 'domcontentloaded' });
    await jitter(1500, 500);

    await safeFill(page, '#email',    email);
    await safeFill(page, '#password', password);
    await safeClick(page, '#login_submit');
    await jitter(3000, 1000);

    const loggedIn = await page.$('.profile-img, .student-name');
    if (!loggedIn) {
      warn('Internshala: Login failed. Check credentials.');
      await browser.close();
      return { applied: 0, error: 'login failed' };
    }
    ok('Internshala: Logged in');

    // ── Search jobs/internships ───────────────────────────────────────────────
    const p     = profile.personal;
    const roles = profile.jobPreferences?.roles || ['Software Engineer'];
    const limit = parseInt(process.env.DAILY_APPLY_LIMIT || '10');

    for (const role of roles.slice(0, 2)) {
      const category = role.toLowerCase().includes('data') ? 'data-science' : 'computer-science';
      log(`Internshala: Browsing ${category} listings…`);

      await page.goto(`https://internshala.com/jobs/computer-science-jobs/`, { waitUntil: 'domcontentloaded' });
      await jitter(2500, 800);

      const listings = await page.$$('.individual_internship');
      log(`Internshala: Found ${listings.length} listings`);

      for (const listing of listings.slice(0, limit)) {
        try {
          const link = await listing.$('a.view_detail_button');
          if (!link) continue;

          const href = await link.getAttribute('href');
          const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            link.click(),
          ]);

          await newPage.waitForLoadState('domcontentloaded');
          await jitter(2000, 800);

          // Click Apply button
          const applyBtn = await newPage.$('button#apply_now_btn, a#easy_apply_btn, button:has-text("Apply Now")');
          if (!applyBtn) { await newPage.close(); continue; }

          await applyBtn.click();
          await jitter(2000, 500);

          // Fill cover letter if required
          const coverLetterField = await newPage.$('textarea[name="cover_letter"], #cover_letter');
          if (coverLetterField) {
            const coverLetter = buildCoverLetter(profile, 'this company', role);
            await typeSlowly(newPage, 'textarea[name="cover_letter"], #cover_letter', coverLetter);
          }

          // Answer availability question
          const availField = await newPage.$('input[name="availability"], #availability');
          if (availField) await availField.fill('Immediately');

          // Submit
          const submitBtn = await newPage.$('button[type="submit"], input[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            await jitter(2000, 500);
            const title = await newPage.title();
            ok(`Internshala: Applied — ${title.slice(0, 50)}`);
            applied++;
          }

          await newPage.close();
          await jitter(3000, 1000);

          if (applied >= limit) break;
        } catch {
          // Skip and continue
        }
      }
      if (applied >= limit) break;
    }

  } catch (e) {
    warn(`Internshala error: ${e.message}`);
  } finally {
    await browser.close();
  }

  return { applied };
}

// ── LINKEDIN EASY APPLY ───────────────────────────────────────────────────────
async function fillLinkedIn(profile) {
  const email    = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;
  if (!email || !password) {
    warn('LINKEDIN_EMAIL / LINKEDIN_PASSWORD not set in .env. Skipping LinkedIn.');
    return { applied: 0, error: 'credentials missing' };
  }

  const browser = await launchBrowser();
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' });
  const page    = await context.newPage();
  let applied   = 0;

  try {
    // ── Login ─────────────────────────────────────────────────────────────────
    log('LinkedIn: Logging in…');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });
    await jitter(2000, 500);

    await safeFill(page, '#username', email);
    await safeFill(page, '#password', password);
    await safeClick(page, 'button[type="submit"]');
    await jitter(4000, 1000);

    const loggedIn = await page.$('.global-nav__me');
    if (!loggedIn) {
      warn('LinkedIn: Login failed (may require CAPTCHA or 2FA — open manually once).');
      await browser.close();
      return { applied: 0, error: 'login failed' };
    }
    ok('LinkedIn: Logged in');

    // ── Job search with Easy Apply filter ────────────────────────────────────
    const role     = (profile.jobPreferences?.roles?.[0] || 'Software Engineer').replace(/\s+/g, '%20');
    const location = (profile.personal?.currentLocation || 'India').split(',')[0].trim().replace(/\s+/g, '%20');
    const limit    = parseInt(process.env.DAILY_APPLY_LIMIT || '5'); // LinkedIn limit lower

    log(`LinkedIn: Searching "${decodeURIComponent(role)}" in ${decodeURIComponent(location)}…`);
    await page.goto(
      `https://www.linkedin.com/jobs/search/?keywords=${role}&location=${location}&f_AL=true&f_E=1&f_WT=2`,
      { waitUntil: 'domcontentloaded' }
    );
    await jitter(3000, 1000);

    const jobCards = await page.$$('.job-card-container');
    log(`LinkedIn: Found ${jobCards.length} Easy Apply jobs`);

    for (const card of jobCards.slice(0, limit)) {
      try {
        await card.click();
        await jitter(2000, 500);

        const easyApplyBtn = await page.$('button.jobs-apply-button:has-text("Easy Apply")');
        if (!easyApplyBtn) continue;

        await easyApplyBtn.click();
        await jitter(2000, 500);

        // Multi-step form filler
        let step = 0;
        while (step < 10) {
          // Phone number
          await safeFill(page, 'input[id*="phoneNumber"]', profile.personal?.phone || '');

          // Location
          const locationField = await page.$('input[id*="location"]');
          if (locationField) {
            await locationField.fill(profile.personal?.currentLocation || '');
            await jitter(1000, 300);
            await safeClick(page, '.basic-typeahead__selectable');
          }

          // Resume already uploaded on LinkedIn profile
          // Cover letter (optional)
          const coverField = await page.$('textarea[id*="coverLetter"]');
          if (coverField) {
            const company = await page.$eval('.jobs-unified-top-card__company-name', el => el.innerText.trim()).catch(() => 'this company');
            await coverField.fill(buildCoverLetter(profile, company, profile.jobPreferences?.roles?.[0] || 'Software Engineer'));
          }

          // Next / Submit
          const nextBtn   = await page.$('button:has-text("Next"), button:has-text("Review")');
          const submitBtn = await page.$('button:has-text("Submit application")');

          if (submitBtn) {
            await submitBtn.click();
            await jitter(2000, 500);
            const company = await page.$eval('.jobs-unified-top-card__company-name', el => el.innerText.trim()).catch(() => 'Company');
            ok(`LinkedIn: Applied → ${company}`);
            applied++;
            break;
          } else if (nextBtn) {
            await nextBtn.click();
            await jitter(1500, 500);
            step++;
          } else {
            // Dismiss
            await safeClick(page, 'button[aria-label="Dismiss"]');
            break;
          }
        }

        await jitter(3000, 1000);
        if (applied >= limit) break;
      } catch {
        // Skip job
      }
    }

  } catch (e) {
    warn(`LinkedIn error: ${e.message}`);
  } finally {
    await browser.close();
  }

  return { applied };
}

// ── Cover letter builder ──────────────────────────────────────────────────────
function buildCoverLetter(profile, company, role) {
  const p      = profile.personal;
  const edu    = profile.education?.ug;
  const skills = profile.skills?.technical?.slice(0, 4).map(s => s.name).join(', ');
  const proj   = profile.projects?.[0];

  return `Dear Hiring Manager,

I am writing to apply for the ${role} position at ${company}. I am a ${edu?.degree} graduate in ${edu?.branch} from ${edu?.institution} (CGPA: ${edu?.cgpa}/${edu?.cgpaScale}, ${edu?.endYear}).

My technical skills include ${skills}. ${proj ? `I recently built ${proj.title} — ${proj.description.slice(0, 120)}.` : ''}

I am available immediately and am excited about the opportunity to contribute to ${company}'s team.

Regards,
${p.name}  |  ${p.email}  |  ${p.phone}`;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function fillSite(site, profile) {
  switch (site.toLowerCase()) {
    case 'naukri':       return fillNaukri(profile);
    case 'internshala':  return fillInternshala(profile);
    case 'linkedin':     return fillLinkedIn(profile);
    default:
      warn(`Unknown site: ${site}. Supported: naukri, internshala, linkedin`);
      return { applied: 0, error: `unknown site: ${site}` };
  }
}
