#!/usr/bin/env node
/**
 * mail-server.js — Local SMTP relay server for JobHunt Pro.
 *
 * Runs on http://localhost:3001 and lets the browser send real emails
 * via your Gmail App Password (nodemailer). No 3rd-party service, no
 * API key required — just your existing Gmail credentials in .env.
 *
 * Start it once, leave it running while you use the web UI:
 *   node automation/mail-server.js
 *   npm run mail-server
 *
 * Endpoints:
 *   GET  /api/status      — health check (browser polls this)
 *   POST /api/send        — send one email
 *   POST /api/send-bulk   — send to multiple recipients
 *
 * POST /api/send body (JSON):
 *   {
 *     to:           "recruiter@company.com",
 *     subject:      "Application for SWE — Rohan",
 *     body:         "Dear Hiring Manager…",
 *     senderName:   "Rohan D J",          // used in From: header
 *     resumeBase64: "<base64 string>",    // optional PDF attachment
 *     resumeName:   "Rohan_Resume.pdf"    // optional filename
 *   }
 *
 * POST /api/send-bulk body (JSON):
 *   {
 *     recipients: [ { to, subject, body } ],   // overrides per-recipient
 *     template: { subject, body, senderName, resumeBase64, resumeName }
 *   }
 */

import 'dotenv/config';
import http         from 'http';
import nodemailer   from 'nodemailer';
import { spawn }    from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname }            from 'path';
import { fileURLToPath }            from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = join(__dirname, '..');
const APPS_FILE  = join(ROOT, 'automation', 'applications.json');
const LEADS_FILE = join(ROOT, 'automation', 'job-leads.json');

// Guard so n8n can't spawn 10 overlapping browser runs at once.
let linkedinRunning = false;

const PORT = parseInt(process.env.MAIL_SERVER_PORT || '3001');

// ── Colours ──────────────────────────────────────────────────────────────────
const ok   = (m) => console.log(`\x1b[32m✔\x1b[0m  ${m}`);
const info = (m) => console.log(`\x1b[36m→\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m⚠\x1b[0m  ${m}`);
const err  = (m) => console.log(`\x1b[31m✖\x1b[0m  ${m}`);

// ── Nodemailer transporter ────────────────────────────────────────────────────
function makeTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    err('GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env');
    err('Generate a Gmail App Password at: https://myaccount.google.com/apppasswords');
    process.exit(1);
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    pool:       true,   // keep connections alive between sends
    maxConnections: 3,
  });
}

const transporter = makeTransporter();

// ── Verify credentials on startup ────────────────────────────────────────────
transporter.verify().then(() => {
  ok(`Gmail SMTP verified: ${process.env.GMAIL_USER}`);
}).catch(e => {
  warn(`Gmail SMTP verify failed: ${e.message}`);
  warn('Check GMAIL_USER and GMAIL_APP_PASSWORD in .env');
});

// ── CORS headers (allow localhost origins only) ───────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── JSON response helpers ─────────────────────────────────────────────────────
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── Read request body ─────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end',  () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

// ── Send one email ────────────────────────────────────────────────────────────
async function sendOne({ to, subject, body, senderName, resumeBase64, resumeName }) {
  const from = senderName
    ? `"${senderName}" <${process.env.GMAIL_USER}>`
    : process.env.GMAIL_USER;

  const attachments = resumeBase64 ? [{
    filename:    resumeName    || 'Resume.pdf',
    content:     resumeBase64,
    encoding:    'base64',
    contentType: 'application/pdf',
  }] : [];

  await transporter.sendMail({
    from,
    to,
    subject,
    text: body,
    attachments,
    headers: { 'X-Mailer': 'JobHunt Pro', 'X-Priority': '3' },
  });
}

// ── Rate-limit: gap between emails so Gmail doesn't flag the burst ────────────
// Minimum 10s (configurable via EMAIL_SEND_GAP_MS) + a little jitter.
const sleep       = (ms) => new Promise(r => setTimeout(r, ms));
const EMAIL_GAP_MS = Math.max(10000, parseInt(process.env.EMAIL_SEND_GAP_MS || '10000'));
const emailGap     = () => sleep(EMAIL_GAP_MS + Math.random() * 3000);

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);

  // Preflight
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url?.split('?')[0];

  // GET /api/status
  if (req.method === 'GET' && url === '/api/status') {
    json(res, 200, {
      ok:      true,
      version: '2.0',
      sender:  process.env.GMAIL_USER,
      message: 'JobHunt Pro Mail Server is running',
    });
    return;
  }

  // POST /api/send — single email
  if (req.method === 'POST' && url === '/api/send') {
    try {
      const body = await readBody(req);
      if (!body.to || !body.subject || !body.body) {
        json(res, 400, { ok: false, error: 'Missing required fields: to, subject, body' });
        return;
      }

      await sendOne(body);
      ok(`Sent → ${body.to}`);
      json(res, 200, { ok: true, to: body.to });

    } catch (e) {
      err(`Send failed → ${e.message}`);
      json(res, 500, { ok: false, error: e.message });
    }
    return;
  }

  // POST /api/send-bulk — multiple recipients, shared template
  if (req.method === 'POST' && url === '/api/send-bulk') {
    try {
      const payload = await readBody(req);
      const { template = {}, recipients = [] } = payload;

      if (!recipients.length) {
        json(res, 400, { ok: false, error: 'No recipients provided' });
        return;
      }

      const results = [];
      for (let i = 0; i < recipients.length; i++) {
        const rec = recipients[i];
        const params = {
          to:           rec.to      || rec.email,
          subject:      rec.subject || template.subject,
          body:         rec.body    || template.body,
          senderName:   template.senderName,
          resumeBase64: template.resumeBase64,
          resumeName:   template.resumeName,
        };

        try {
          await sendOne(params);
          ok(`[${i + 1}/${recipients.length}] Sent → ${params.to}`);
          results.push({ to: params.to, ok: true });
        } catch (e) {
          warn(`[${i + 1}/${recipients.length}] Failed → ${params.to}: ${e.message}`);
          results.push({ to: params.to, ok: false, error: e.message });
        }

        // Polite delay between sends (avoids Gmail spam flagging)
        if (i < recipients.length - 1) await emailGap();
      }

      const sent   = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok).length;
      ok(`Bulk send complete: ${sent} sent, ${failed} failed`);
      json(res, 200, { ok: true, sent, failed, results });

    } catch (e) {
      err(`Bulk send error: ${e.message}`);
      json(res, 500, { ok: false, error: e.message });
    }
    return;
  }

  // POST /api/linkedin-apply — trigger a LinkedIn auto-apply run (for n8n)
  // Body (all optional): { auto:true, referrals:true, role:"...", location:"...", limit:5 }
  if (req.method === 'POST' && url === '/api/linkedin-apply') {
    try {
      const body = await readBody(req).catch(() => ({}));
      if (linkedinRunning) {
        json(res, 409, { ok: false, error: 'A LinkedIn run is already in progress' });
        return;
      }

      const args = ['automation/runner.js', 'linkedin'];
      if (body.auto)      args.push('--auto');
      if (body.referrals) args.push('--referrals');
      if (body.role)      args.push('--role', String(body.role));
      if (body.location)  args.push('--location', String(body.location));
      if (body.limit)     args.push('--limit', String(body.limit));

      linkedinRunning = true;
      const child = spawn('node', args, { cwd: ROOT, stdio: 'inherit' });
      info(`LinkedIn run started (pid ${child.pid}): ${args.slice(1).join(' ')}`);
      child.on('exit', (code) => {
        linkedinRunning = false;
        ok(`LinkedIn run finished (exit ${code})`);
      });

      // Return immediately — the browser run takes minutes. Poll /api/applications for results.
      json(res, 202, { ok: true, started: true, mode: body.auto ? 'auto' : 'dry-run', args: args.slice(1) });
    } catch (e) {
      linkedinRunning = false;
      err(`LinkedIn trigger failed: ${e.message}`);
      json(res, 500, { ok: false, error: e.message });
    }
    return;
  }

  // GET /api/applications — read the recorded application log (for n8n)
  if (req.method === 'GET' && url === '/api/applications') {
    const data = existsSync(APPS_FILE)
      ? JSON.parse(readFileSync(APPS_FILE, 'utf-8'))
      : [];
    json(res, 200, { ok: true, running: linkedinRunning, count: data.length, applications: data });
    return;
  }

  // GET /api/job-leads — real fresher openings (from `runner.js leads`)
  // Query: ?withEmail=true → only leads that have a real published contact email
  if (req.method === 'GET' && url === '/api/job-leads') {
    const all = existsSync(LEADS_FILE)
      ? JSON.parse(readFileSync(LEADS_FILE, 'utf-8'))
      : [];
    const wantEmail = /[?&]withEmail=true/.test(req.url || '');
    const leads = wantEmail ? all.filter(l => l.contactEmail) : all;
    json(res, 200, {
      ok: true,
      count: leads.length,
      withEmail: all.filter(l => l.contactEmail).length,
      leads,
    });
    return;
  }

  // 404
  json(res, 404, { ok: false, error: 'Unknown endpoint' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('\x1b[1m\x1b[36m  JobHunt Pro — Mail Server\x1b[0m');
  console.log(`  Listening on \x1b[4mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  Gmail sender : \x1b[33m${process.env.GMAIL_USER}\x1b[0m`);
  console.log('');
  console.log('  Endpoints:');
  console.log('    POST /api/send            POST /api/send-bulk');
  console.log('    POST /api/linkedin-apply  GET  /api/applications   (for n8n)');
  console.log('');
  console.log('  Keep this running while you use the web UI.');
  console.log('  Press Ctrl+C to stop.\n');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    err(`Port ${PORT} is already in use. Mail server may already be running.`);
    err(`If not, change MAIL_SERVER_PORT in .env and restart.`);
  } else {
    err(`Server error: ${e.message}`);
  }
  process.exit(1);
});
