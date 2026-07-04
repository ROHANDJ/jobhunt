/**
 * email-sender.js — Send bulk job application emails via Gmail SMTP.
 *
 * Requires in .env:
 *   GMAIL_USER=youremail@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
 *
 * How to get a Gmail App Password:
 *   1. Enable 2-Step Verification on your Google account
 *   2. Go to: https://myaccount.google.com/apppasswords
 *   3. Create a new App Password (select "Mail" + "Windows Computer")
 *   4. Paste the 16-char password into .env as GMAIL_APP_PASSWORD
 */

import nodemailer from 'nodemailer';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..', '..');

const log  = (m) => console.log(`\x1b[36m→\x1b[0m  ${m}`);
const ok   = (m) => console.log(`\x1b[32m✔\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m⚠\x1b[0m  ${m}`);

// ── Email templates ───────────────────────────────────────────────────────────
function buildEmail(profile, recruiter, variant = 0) {
  const p       = profile.personal;
  const edu     = profile.education?.ug;
  const skills  = profile.skills?.technical?.slice(0, 5).map(s => s.name).join(', ');
  const role    = profile.jobPreferences?.roles?.[0] || 'Software Engineer';

  const templates = [
    // Variant 0 — direct, achievement-focused
    (name, comp, role, skills, edu) => ({
      subject: `Application for ${role} Position — ${name} | Fresher`,
      body: `Dear Hiring Team at ${comp},

I am writing to express my strong interest in the ${role} position at ${comp}. I am a ${edu?.degree} graduate in ${edu?.branch} from ${edu?.institution} (${edu?.endYear}) with a CGPA of ${edu?.cgpa}/${edu?.cgpaScale}.

My core skills include ${skills}, and I have hands-on experience through projects and internships. I am particularly drawn to ${comp}'s work and believe I can contribute effectively from day one.

I have attached my resume for your consideration and would welcome the opportunity to discuss how I can add value to your team.

Thank you for your time.

Best regards,
${name}
${p.phone}  |  ${p.email}
${p.links?.linkedin ? p.links.linkedin : ''}`,
    }),

    // Variant 1 — problem-solver tone
    (name, comp, role, skills, edu) => ({
      subject: `${role} Application — ${name} | ${edu?.institution} ${edu?.endYear}`,
      body: `Hello,

My name is ${name}, a ${edu?.degree} graduate in ${edu?.branch} from ${edu?.institution}. I'm reaching out because ${comp}'s engineering culture and product vision genuinely excite me.

Technical profile: ${skills}

I've built and shipped projects that deal with real-world data and scale challenges. I take ownership and care about code quality. I'm ready to contribute to ${comp}'s mission starting immediately.

Resume is attached. I'd love to chat if there's a fit.

Regards,
${name}  |  ${p.phone}  |  ${p.email}`,
    }),

    // Variant 2 — concise/modern
    (name, comp, role, skills, edu) => ({
      subject: `Fresher Application: ${role} @ ${comp} — ${name}`,
      body: `Hi,

I'm ${name}, a ${edu?.degree} (${edu?.branch}) fresher from ${edu?.institution}. Looking to join ${comp} as a ${role}.

Skills: ${skills}
CGPA: ${edu?.cgpa}/${edu?.cgpaScale} | Grad Year: ${edu?.endYear}

Resume attached. Happy to take any technical assessment.

Thanks,
${name}
${p.phone} | ${p.email}`,
    }),
  ];

  const template = templates[variant % templates.length];
  return template(
    p.name,
    recruiter.company || recruiter.email.split('@')[1]?.split('.')[0] || 'your company',
    role,
    skills,
    edu
  );
}

// ── Create Gmail SMTP transporter ────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// ── Build recipient list from real job leads (falls back to defaults) ──────────
async function resolveRecruiters(customRecruiters) {
  if (customRecruiters) return customRecruiters;

  // Prefer real, discovered leads that actually have a published email.
  try {
    const { loadLeads } = await import('./job-leads.js');
    const leads = loadLeads().filter(l => l.contactEmail);
    if (leads.length) {
      log(`Using ${leads.length} real job leads with published emails (from job-leads.json)`);
      return leads.map(l => ({ email: l.contactEmail, company: l.company, role: l.role, applyUrl: l.applyUrl }));
    }
    const total = loadLeads().length;
    if (total) {
      warn(`${total} job leads found but none have a published email — apply via their URL, or use "runner.js linkedin" to reach HR.`);
      return [];
    }
  } catch { /* job-leads module optional */ }

  warn('No real leads available. Refusing to email the generic sample list (campus@… etc.).');
  warn('Run "node automation/runner.js leads" first to fetch real fresher openings.');
  return [];
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function sendCampaign(profile, customRecruiters = null) {
  const transporter  = createTransporter();
  const recruiters   = await resolveRecruiters(customRecruiters);
  const limit        = parseInt(process.env.DAILY_APPLY_LIMIT || '20');
  const targets      = recruiters.slice(0, limit);

  if (!targets.length) {
    warn('No valid recipients — nothing sent.');
    return { sent: 0, failed: 0, results: [], skipped: 'no real contacts' };
  }

  let sent   = 0;
  let failed = 0;
  const results = [];

  // Resume attachment
  const pdfPath = profile.resume?.filePath
    ? join(ROOT, profile.resume.filePath.replace('./', ''))
    : null;
  const attachments = pdfPath && existsSync(pdfPath)
    ? [{ filename: `${profile.personal.name.replace(/\s+/g, '_')}_Resume.pdf`, path: pdfPath }]
    : [];

  if (!attachments.length) warn('No resume PDF found. Sending emails without attachment.');

  for (let i = 0; i < targets.length; i++) {
    const rec      = targets[i];
    const variant  = i % 3;
    const { subject, body } = buildEmail(profile, rec, variant);

    try {
      await transporter.sendMail({
        from:        `"${profile.personal.name}" <${process.env.GMAIL_USER}>`,
        to:          rec.email,
        subject,
        text:        body,
        attachments,
        headers: {
          'X-Priority':      '3',
          'X-Mailer':        'JobHunt Pro',
        },
      });

      ok(`Sent → ${rec.email}`);
      sent++;
      results.push({ email: rec.email, status: 'sent', subject });

      // Gap between emails so Gmail doesn't flag the burst (min 10s + jitter)
      if (i < targets.length - 1) {
        const gap = Math.max(10000, parseInt(process.env.EMAIL_SEND_GAP_MS || '10000'));
        await new Promise(r => setTimeout(r, gap + Math.random() * 3000));
      }
    } catch (e) {
      warn(`Failed → ${rec.email}: ${e.message}`);
      failed++;
      results.push({ email: rec.email, status: 'failed', error: e.message });
    }
  }

  return { sent, failed, results };
}
