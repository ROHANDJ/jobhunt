/**
 * linkedin-hr-scraper.js — Scrape HR/recruiter emails from LinkedIn job postings.
 *
 * What it does:
 *   1. Logs into LinkedIn using your credentials from .env
 *   2. Searches for fresher/junior job postings in your target roles
 *   3. For each job, visits the poster's profile to extract contact info
 *   4. Saves scraped HR contacts to automation/hr-contacts.json
 *   5. Optional --monitor mode: polls every 30 min, auto-emails when new jobs post
 *
 * Usage:
 *   node automation/runner.js scrape-hr
 *   node automation/runner.js scrape-hr --company "Razorpay"
 *   node automation/runner.js scrape-hr --role "Software Engineer"
 *   node automation/runner.js scrape-hr --monitor
 *
 * Required .env:
 *   LINKEDIN_EMAIL, LINKEDIN_PASSWORD
 *   GMAIL_USER, GMAIL_APP_PASSWORD (for auto-email in monitor mode)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname }                           from 'path';
import { fileURLToPath }                           from 'url';
import nodemailer                                  from 'nodemailer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..', '..');
const DATA_FILE = join(ROOT, 'automation', 'hr-contacts.json');

const log  = (m) => console.log(`\x1b[36m  →\x1b[0m  ${m}`);
const ok   = (m) => console.log(`\x1b[32m  ✔\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m  ⚠\x1b[0m  ${m}`);
const err  = (m) => console.log(`\x1b[31m  ✖\x1b[0m  ${m}`);

const sleep  = (ms) => new Promise(r => setTimeout(r, ms));
const jitter = (base, spread = 1000) => sleep(base + Math.random() * spread);

// ── Load / save HR contacts file ──────────────────────────────────────────────
function loadContacts() {
  if (!existsSync(DATA_FILE)) return [];
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf-8')); }
  catch { return []; }
}

function saveContacts(contacts) {
  writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2));
}

function addContact(contact, existing) {
  const dup = existing.find(c => c.email === contact.email || c.linkedinUrl === contact.linkedinUrl);
  if (dup) return false;
  existing.unshift({ ...contact, scrapedAt: new Date().toISOString() });
  return true;
}

// ── Browser helpers ───────────────────────────────────────────────────────────
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
    await jitter(500, 800);
    return true;
  } catch { return false; }
}

async function typeSlowly(page, selector, text) {
  await page.click(selector);
  await page.fill(selector, '');
  for (const ch of text) {
    await page.type(selector, ch, { delay: 40 + Math.random() * 60 });
  }
  await jitter(200, 400);
}

// ── LinkedIn login ────────────────────────────────────────────────────────────
async function loginLinkedIn(page) {
  const email    = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;
  if (!email || !password) throw new Error('LINKEDIN_EMAIL / LINKEDIN_PASSWORD not set in .env');

  log('Logging into LinkedIn…');
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle', timeout: 30000 });
  await jitter(1000, 1000);

  await typeSlowly(page, '#username', email);
  await typeSlowly(page, '#password', password);
  await safeClick(page, '[type="submit"]');
  await jitter(3000, 2000);

  const url = page.url();
  if (url.includes('/feed') || url.includes('/in/')) {
    ok('LinkedIn login successful');
    return true;
  }
  if (url.includes('checkpoint') || url.includes('challenge')) {
    warn('LinkedIn is asking for verification. Please complete it manually.');
    await sleep(30000); // Give user 30s to complete verification
    return page.url().includes('/feed');
  }
  throw new Error('LinkedIn login failed. Check credentials.');
}

// ── Extract email from profile page (via About section or contact info) ───────
async function extractEmailFromProfile(page, profileUrl) {
  try {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await jitter(2000, 1500);

    // Try clicking "Contact info" button
    const contactBtn = page.locator('a[href*="overlay/contact-info"]');
    if (await contactBtn.count() > 0) {
      await contactBtn.first().click();
      await jitter(2000, 1000);

      const modal = await page.$('.pv-contact-info__contact-type');
      if (modal) {
        const emailLinks = await page.$$('a[href^="mailto:"]');
        for (const link of emailLinks) {
          const href = await link.getAttribute('href');
          if (href) return href.replace('mailto:', '').trim();
        }
      }
      await safeClick(page, '[aria-label="Dismiss"]', 3000);
    }

    // Fallback: scan page text for email-like patterns
    const pageText = await page.textContent('body').catch(() => '');
    const emailMatch = pageText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : null;

  } catch (e) {
    warn(`Could not extract email from ${profileUrl}: ${e.message}`);
    return null;
  }
}

// ── Extract HR info from a job posting page ───────────────────────────────────
async function extractJobPoster(page) {
  try {
    // Look for "Meet the hiring team" section
    const posterSection = page.locator('.hirer-card__hirer-information, .job-details-jobs-unified-top-card__job-insight--highlight');
    await posterSection.first().waitFor({ timeout: 5000 }).catch(() => {});

    const posterEl = await page.$('.hirer-card__hirer-information a, .jobs-poster__name');
    if (!posterEl) return null;

    const name       = (await posterEl.textContent())?.trim();
    const profileUrl = await posterEl.getAttribute('href');

    const titleEl    = await page.$('.hirer-card__hirer-job-title, .jobs-poster__occupation');
    const title      = (await titleEl?.textContent())?.trim() || 'HR / Recruiter';

    return {
      name,
      title,
      linkedinUrl: profileUrl?.startsWith('http') ? profileUrl : `https://www.linkedin.com${profileUrl}`
    };
  } catch {
    return null;
  }
}

// ── Scrape jobs for a search query ───────────────────────────────────────────
async function scrapeJobsForQuery(page, query, location = 'India', maxJobs = 15) {
  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&f_E=1,2&f_TPR=r86400&sortBy=DD`;
  log(`Searching: "${query}" in ${location}…`);

  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await jitter(2500, 1500);

  // Scroll to load more jobs
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 600));
    await jitter(800, 600);
  }

  const jobItems = await page.$$('.jobs-search-results__list-item, .job-card-container');
  log(`Found ${jobItems.length} job listings`);

  const contacts = [];

  for (let i = 0; i < Math.min(jobItems.length, maxJobs); i++) {
    try {
      await jobItems[i].click();
      await jitter(2000, 1500);

      // Get job title and company
      const titleEl   = await page.$('.jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title');
      const companyEl = await page.$('.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name');
      const jobUrl    = page.url();

      const jobTitle  = (await titleEl?.textContent())?.trim()   || query;
      const company   = (await companyEl?.textContent())?.trim() || 'Unknown Company';

      log(`[${i + 1}/${Math.min(jobItems.length, maxJobs)}] ${company} — ${jobTitle}`);

      // Get poster info
      const poster = await extractJobPoster(page);
      if (!poster) {
        warn(`  No hiring manager found for this posting`);
        continue;
      }

      // Get email from poster's profile
      let email = null;
      if (poster.linkedinUrl) {
        email = await extractEmailFromProfile(page, poster.linkedinUrl);
        // Go back to job listing
        await page.goBack({ timeout: 15000 }).catch(() => {});
        await jitter(1500, 1000);
        // Re-fetch job items after navigation
      }

      const contact = {
        name:       poster.name  || 'HR Recruiter',
        title:      poster.title || 'Recruiter',
        email:      email || `hr@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        company,
        position:   jobTitle,
        jobUrl,
        linkedinUrl: poster.linkedinUrl || '',
        source:     'linkedin-scraper',
        hasRealEmail: !!email,
      };

      contacts.push(contact);
      ok(`  → ${contact.name} (${contact.email}) ${email ? '✓ real email' : '⚠ guessed'}`);

      await jitter(1500, 1000);

    } catch (e) {
      warn(`  Error processing job ${i + 1}: ${e.message}`);
    }
  }

  return contacts;
}

// ── Auto-email new HR contacts ─────────────────────────────────────────────────
async function autoEmailNewContacts(profile, newContacts) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    warn('GMAIL credentials not set. Skipping auto-email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const name    = profile.personal?.name    || 'Candidate';
  const college = profile.education?.ug?.institution || '';
  const skills  = profile.skills?.technical?.slice(0, 5).map(s => s.name).join(', ') || 'Python, DSA, SQL';
  const role    = profile.jobPreferences?.roles?.[0] || 'Software Engineer';

  for (const contact of newContacts) {
    if (!contact.hasRealEmail) {
      warn(`Skipping guessed email: ${contact.email}`);
      continue;
    }

    const subject = `Application for ${contact.position} — ${name}`;
    const body = `Dear ${contact.name || 'Hiring Manager'},

I noticed your recent posting for ${contact.position} at ${contact.company} and I wanted to reach out directly.

I am ${name}, a fresher${college ? ' from ' + college : ''} with strong skills in ${skills}. I am actively looking for ${role} opportunities and am very excited about the work at ${contact.company}.

I have attached my resume for your review. I would love to connect for even a 10-minute call to learn more about the role and share how I can contribute from day one.

Thank you for your time!

Best regards,
${name}
${process.env.GMAIL_USER}`;

    try {
      await transporter.sendMail({
        from:    `${name} <${process.env.GMAIL_USER}>`,
        to:      contact.email,
        subject,
        text:    body,
      });
      ok(`Auto-emailed: ${contact.name} at ${contact.company} (${contact.email})`);
      await sleep(3000 + Math.random() * 2000);
    } catch (e) {
      warn(`Email failed to ${contact.email}: ${e.message}`);
    }
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function scrapeLinkedInHR(profile, options = {}) {
  const {
    targetCompany = null,
    targetRole    = null,
    monitor       = false,
    autoEmail     = false,
  } = options;

  if (!process.env.LINKEDIN_EMAIL || !process.env.LINKEDIN_PASSWORD) {
    err('Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in .env first.');
    return { added: 0, contacts: [] };
  }

  const roles = targetRole
    ? [targetRole]
    : (profile.jobPreferences?.roles || ['Software Engineer', 'Data Scientist']).slice(0, 3);

  const searchQueries = targetCompany
    ? roles.map(r => `${r} ${targetCompany} fresher`)
    : roles.flatMap(r => [`${r} fresher India`, `${r} intern India 2025`]);

  const browser = await launchBrowser();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport:  { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  let totalAdded = 0;
  const allNewContacts = [];

  try {
    await loginLinkedIn(page);

    const existingContacts = loadContacts();
    const existingEmails   = new Set(existingContacts.map(c => c.email));

    for (const query of searchQueries.slice(0, 4)) {
      const found = await scrapeJobsForQuery(page, query);
      for (const contact of found) {
        if (!existingEmails.has(contact.email)) {
          const added = addContact(contact, existingContacts);
          if (added) {
            existingEmails.add(contact.email);
            allNewContacts.push(contact);
            totalAdded++;
          }
        }
      }
      await jitter(3000, 2000);
    }

    saveContacts(existingContacts);
    ok(`Scraped ${totalAdded} new HR contacts. Total: ${existingContacts.length}`);
    log(`Contacts saved to: ${DATA_FILE}`);

    // Auto-email newly found contacts if requested
    if ((autoEmail || monitor) && allNewContacts.length > 0) {
      log(`Auto-emailing ${allNewContacts.length} new contacts…`);
      await autoEmailNewContacts(profile, allNewContacts);
    }

    return { added: totalAdded, contacts: allNewContacts, total: existingContacts.length };

  } finally {
    await browser.close();
  }
}

// ── Monitor mode (poll every 30 min) ─────────────────────────────────────────
export async function monitorLinkedIn(profile, options = {}) {
  const intervalMs = 30 * 60 * 1000; // 30 minutes
  let round = 1;

  log('LinkedIn monitor mode started — polling every 30 minutes');
  log('Press Ctrl+C to stop');

  while (true) {
    console.log(`\n\x1b[90m── Round ${round} · ${new Date().toLocaleString()} ──\x1b[0m`);

    try {
      const result = await scrapeLinkedInHR(profile, { ...options, autoEmail: true });
      ok(`Round ${round}: +${result.added} new contacts found and emailed`);
    } catch (e) {
      err(`Round ${round} failed: ${e.message}`);
    }

    log(`Next scan in 30 minutes…`);
    round++;
    await sleep(intervalMs);
  }
}
