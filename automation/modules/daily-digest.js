/**
 * daily-digest.js — Generate and email a daily digest.
 *
 * Contains:
 *   - Today's tech news (via Claude + web_search)
 *   - A coding problem to solve (AI-generated)
 *   - Learning reminder
 *   - Job stats summary
 *
 * Run: node automation/runner.js digest
 * Schedule: node automation/runner.js schedule --daily 08:00
 */

import Anthropic   from '@anthropic-ai/sdk';
import nodemailer  from 'nodemailer';

const log  = (m) => console.log(`\x1b[36m→\x1b[0m  ${m}`);
const ok   = (m) => console.log(`\x1b[32m✔\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m⚠\x1b[0m  ${m}`);

const TODAY_STR = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// ── Fetch news via Claude web_search ─────────────────────────────────────────
async function fetchNews(client) {
  try {
    const res = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 800,
      tools:      [{ type: 'web_search_20250305', name: 'web_search' }],
      messages:   [{
        role: 'user',
        content: 'Find today\'s top 3 tech news stories about AI/ML, software engineering jobs in India, or developer tools. Return ONLY a JSON array: [{"title":"...","source":"...","summary":"1 sentence"}]'
      }],
    });
    const text  = res.content.filter(c => c.type === 'text').map(c => c.text).join('');
    const match = text.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch { return []; }
}

// ── Generate a coding problem ─────────────────────────────────────────────────
async function generateProblem(client) {
  const categories = ['Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'Two Pointers', 'Binary Search'];
  const cat = categories[new Date().getDate() % categories.length];

  try {
    const res = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages:   [{
        role: 'user',
        content: `Give me a ${cat} coding problem commonly asked at Indian tech companies (Google, Amazon, Flipkart, Razorpay). Include: title, difficulty (Easy/Medium/Hard), problem statement (2-3 sentences), 1 example, and the optimal approach (2 sentences + Python code snippet). Keep it concise. No markdown, just plain text with clear sections labeled: PROBLEM, DIFFICULTY, STATEMENT, EXAMPLE, APPROACH`
      }],
    });
    return res.content[0].text;
  } catch { return null; }
}

// ── Build HTML email ──────────────────────────────────────────────────────────
function buildDigestEmail(profile, news, problem) {
  const name = profile.personal?.name || 'there';

  const newsHTML = news.length
    ? news.map(n => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #1e1e30;">
          <div style="font-size:13px;font-weight:600;color:#dde1f0;">${n.title}</div>
          <div style="font-size:11px;color:#5a5a7a;margin-top:2px;">${n.source} — ${n.summary}</div>
        </td>
      </tr>`).join('')
    : `<tr><td style="color:#5a5a7a;font-size:12px;padding:8px 0;">No news fetched today — check API key in .env</td></tr>`;

  const problemHTML = problem
    ? `<pre style="background:#0f0f1a;border:1px solid #1e1e30;border-radius:8px;padding:14px;font-family:monospace;font-size:12px;color:#dde1f0;white-space:pre-wrap;line-height:1.7;">${problem}</pre>`
    : `<p style="color:#5a5a7a;font-size:12px;">No problem generated — check ANTHROPIC_API_KEY in .env</p>`;

  return {
    subject: `🔥 Your Daily JobHunt Digest — ${TODAY_STR}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#07070e;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07070e;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#0d0d1a;border-radius:16px;border:1px solid #1e1e30;overflow:hidden;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#7c6dfa,#38bdf8);padding:24px 28px;">
        <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">JobHunt Pro</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:3px;">Daily Digest — ${TODAY_STR}</div>
      </td></tr>

      <!-- Greeting -->
      <tr><td style="padding:22px 28px 10px;">
        <p style="font-size:14px;color:#dde1f0;margin:0;">Good morning, <strong>${name}</strong>! Here's your daily dose of tech, learning, and prep. 🚀</p>
      </td></tr>

      <!-- News -->
      <tr><td style="padding:10px 28px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7c6dfa;margin-bottom:10px;">📰 Today's Tech News</div>
        <table width="100%">${newsHTML}</table>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 28px;"><hr style="border:none;border-top:1px solid #1e1e30;"/></td></tr>

      <!-- Problem -->
      <tr><td style="padding:18px 28px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#34d399;margin-bottom:10px;">🧩 Today's Coding Problem</div>
        ${problemHTML}
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 28px;"><hr style="border:none;border-top:1px solid #1e1e30;"/></td></tr>

      <!-- Reminder -->
      <tr><td style="padding:18px 28px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fb923c;margin-bottom:10px;">📚 Daily Learning Reminder</div>
        <div style="background:#0f0f1a;border-left:3px solid #fb923c;border-radius:0 8px 8px 0;padding:13px 16px;">
          <p style="font-size:13px;color:#dde1f0;margin:0 0 8px;">What will you learn today? Even 30 minutes compounds over time.</p>
          <ul style="font-size:12px;color:#5a5a7a;margin:0;padding-left:18px;line-height:1.9;">
            <li>Solve today's problem above</li>
            <li>Read 1 tech article or documentation</li>
            <li>Work on your GitHub project for 30 min</li>
            <li>Log your learning in <strong>JobHunt Pro → Daily Hub</strong></li>
          </ul>
        </div>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:10px 28px 24px;" align="center">
        <div style="display:inline-block;background:linear-gradient(135deg,#7c6dfa,#38bdf8);border-radius:10px;padding:12px 28px;">
          <span style="color:#fff;font-weight:700;font-size:13px;">Open JobHunt Pro → localhost:3000</span>
        </div>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#07070e;padding:14px 28px;border-top:1px solid #1e1e30;">
        <div style="font-size:10px;color:#5a5a7a;text-align:center;">
          JobHunt Pro Automation · To stop: <code>node automation/runner.js schedule --stop</code>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function sendDailyDigest(profile) {
  if (!process.env.ANTHROPIC_API_KEY) { warn('ANTHROPIC_API_KEY missing — skipping digest.'); return null; }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) { warn('Gmail credentials missing — skipping digest email.'); return null; }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  log('Fetching today\'s news…');
  const news = await fetchNews(client);
  ok(`Got ${news.length} news items`);

  log('Generating today\'s coding problem…');
  const problem = await generateProblem(client);
  ok('Problem generated');

  const { subject, html } = buildDigestEmail(profile, news, problem);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from:    `"JobHunt Pro" <${process.env.GMAIL_USER}>`,
    to:      profile.personal?.email || process.env.GMAIL_USER,
    subject,
    html,
  });

  ok(`Daily digest sent to ${profile.personal?.email || process.env.GMAIL_USER}`);
  return { news: news.length, problem: !!problem };
}
