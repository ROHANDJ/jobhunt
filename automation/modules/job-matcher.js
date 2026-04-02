/**
 * job-matcher.js — Fetch live jobs and match them against the user's profile.
 *
 * Sources:
 *   1. Static job list (data.js jobs, parsed from the SPA)
 *   2. Naukri public search (via Playwright)
 *   3. Internshala public search (via Playwright)
 *   4. Claude AI for ranking + match scoring
 */

import Anthropic from '@anthropic-ai/sdk';

const warn = (m) => console.log(`\x1b[33m⚠\x1b[0m  ${m}`);
const log  = (m) => console.log(`\x1b[36m→\x1b[0m  ${m}`);

// ── Static fallback jobs ──────────────────────────────────────────────────────
const STATIC_JOBS = [
  { id: 1,  company: 'TCS',          title: 'Software Engineer',          tags: ['Python','Java','DSA'],    salary: '3.5–7 LPA',  applyUrl: 'https://careers.tcs.com' },
  { id: 2,  company: 'Infosys',      title: 'Systems Engineer',           tags: ['Java','Python','SQL'],    salary: '3.6–6 LPA',  applyUrl: 'https://career.infosys.com' },
  { id: 3,  company: 'Wipro',        title: 'Project Engineer',           tags: ['Java','C++','DSA'],       salary: '3.5–5 LPA',  applyUrl: 'https://careers.wipro.com' },
  { id: 4,  company: 'Google',       title: 'Software Engineer (NEW)',     tags: ['Python','DSA','System Design'], salary: '18–25 LPA', applyUrl: 'https://careers.google.com' },
  { id: 5,  company: 'Amazon',       title: 'SDE-1',                      tags: ['Java','DSA','OOP'],       salary: '15–22 LPA',  applyUrl: 'https://amazon.jobs' },
  { id: 6,  company: 'Razorpay',     title: 'Software Engineer',          tags: ['Go','React','MySQL'],     salary: '12–18 LPA',  applyUrl: 'https://razorpay.com/jobs' },
  { id: 7,  company: 'PhonePe',      title: 'SDE-1',                      tags: ['Java','Spring','React'],  salary: '14–20 LPA',  applyUrl: 'https://phonepe.com/en/careers' },
  { id: 8,  company: 'Fractal',      title: 'Data Scientist',             tags: ['Python','ML','SQL'],      salary: '8–14 LPA',   applyUrl: 'https://fractal.ai/careers' },
  { id: 9,  company: 'Mu Sigma',     title: 'Trainee Decision Scientist', tags: ['Python','Statistics','SQL'], salary: '5–8 LPA', applyUrl: 'https://musigma.com/careers' },
  { id: 10, company: 'Zepto',        title: 'Backend Engineer',           tags: ['Node.js','Go','Redis'],   salary: '10–16 LPA',  applyUrl: 'https://www.zepto.com/careers' },
  { id: 11, company: 'Swiggy',       title: 'SDE-1',                      tags: ['Java','Python','Kafka'],  salary: '12–18 LPA',  applyUrl: 'https://careers.swiggy.com' },
  { id: 12, company: 'IISc',         title: 'ML Research Intern',         tags: ['Python','PyTorch','ML'],  salary: '25k/mo',     applyUrl: 'https://iisc.ac.in', intern: true },
  { id: 13, company: 'Microsoft',    title: 'Software Engineer FTE',      tags: ['C#','Azure','DSA'],       salary: '20–30 LPA',  applyUrl: 'https://careers.microsoft.com' },
  { id: 14, company: 'Juspay',       title: 'Software Developer',         tags: ['Haskell','React','Node'], salary: '8–14 LPA',   applyUrl: 'https://careers.juspay.in' },
  { id: 15, company: 'Walmart Labs', title: 'Software Engineer',          tags: ['Java','Scala','Spark'],   salary: '10–18 LPA',  applyUrl: 'https://careers.walmart.com' },
];

// ── AI matching ───────────────────────────────────────────────────────────────
async function aiMatchJobs(profile, jobs) {
  if (!process.env.ANTHROPIC_API_KEY) return jobs.map(j => ({ ...j, matchScore: 50 }));

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userSkills  = profile.skills?.technical?.map(s => s.name) || [];
  const targetRoles = profile.jobPreferences?.roles || [];

  const prompt = `You are a job matching engine. For each job, score how well it matches the candidate.

Candidate:
- Skills: ${userSkills.join(', ')}
- Target roles: ${targetRoles.join(', ')}
- Experience: ${profile.jobPreferences?.totalExperience || 'Fresher'}
- Preferred locations: ${profile.personal?.preferredLocations?.join(', ') || 'Any'}

Jobs:
${jobs.map((j, i) => `${i + 1}. ${j.company} — ${j.title} | Tags: ${j.tags?.join(', ')}`).join('\n')}

Return ONLY a JSON array of match scores (0-100) in the same order as the jobs list:
[85, 72, 90, ...]`;

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }],
    });
    const text   = response.content[0].text.trim();
    const scores = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
    return jobs.map((j, i) => ({ ...j, matchScore: scores[i] ?? 50 }));
  } catch {
    return jobs.map(j => ({ ...j, matchScore: 50 }));
  }
}

// ── Live job fetching via Playwright (Naukri) ────────────────────────────────
async function fetchNaukriJobs(profile) {
  try {
    const { chromium } = await import('playwright');
    const roles   = profile.jobPreferences?.roles?.[0] || 'Software Engineer';
    const browser = await chromium.launch({ headless: true });
    const page    = await browser.newPage();

    log('Fetching jobs from Naukri.com…');
    const query = encodeURIComponent(`${roles} fresher`);
    await page.goto(`https://www.naukri.com/jobs-in-india?k=${query}&experience=0`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const jobs = await page.$$eval('.srp-jobtuple-wrapper', (cards) =>
      cards.slice(0, 10).map(card => ({
        company:  card.querySelector('.comp-name')?.innerText?.trim() || '',
        title:    card.querySelector('.title')?.innerText?.trim()     || '',
        tags:     [...(card.querySelectorAll('.tag-li') || [])].map(t => t.innerText.trim()).slice(0, 5),
        salary:   card.querySelector('.salary-link')?.innerText?.trim() || 'Not disclosed',
        applyUrl: card.querySelector('a.title')?.href || 'https://naukri.com',
        source:   'naukri',
      }))
    );

    await browser.close();
    return jobs.filter(j => j.company && j.title);
  } catch (e) {
    warn(`Naukri job fetch failed: ${e.message}`);
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function matchJobs(profile, resumeAnalysis = null) {
  log('Fetching and matching jobs…');

  // Combine static + live jobs
  const liveJobs = await fetchNaukriJobs(profile);
  const allJobs  = [...STATIC_JOBS, ...liveJobs];

  // Filter by preferred roles (basic keyword match)
  const roles   = (profile.jobPreferences?.roles || []).map(r => r.toLowerCase());
  const filtered = allJobs.filter(j => {
    if (!roles.length) return true;
    const titleLower = j.title.toLowerCase();
    return roles.some(r => titleLower.includes(r.split(' ')[0].toLowerCase()));
  });

  // AI match scoring
  const scored = await aiMatchJobs(profile, filtered.length ? filtered : allJobs);

  // Sort by match score descending, return top 20
  return scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 20);
}
