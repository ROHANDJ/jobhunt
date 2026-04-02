#!/usr/bin/env node
/**
 * runner.js — JobHunt Pro Automation CLI
 *
 * Usage:
 *   node automation/runner.js run              # Full automation run (analyze + email + fill forms)
 *   node automation/runner.js analyze          # AI resume analysis + job matching only
 *   node automation/runner.js email            # Send bulk application emails
 *   node automation/runner.js fill             # Auto-fill forms on job sites
 *   node automation/runner.js fill --site naukri
 *   node automation/runner.js fill --site internshala
 *   node automation/runner.js fill --site linkedin
 *   node automation/runner.js schedule --daily 09:00
 *   node automation/runner.js schedule --weekly monday 09:00
 *   node automation/runner.js schedule --cron "0 9 * * 1-5"
 *   node automation/runner.js schedule --list
 *   node automation/runner.js schedule --stop
 *   node automation/runner.js status           # Show last run results
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname }                           from 'path';
import { fileURLToPath }                           from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────
const log  = (msg, icon = '→') => console.log(`\x1b[36m${icon}\x1b[0m  ${msg}`);
const ok   = (msg)             => console.log(`\x1b[32m✔\x1b[0m  ${msg}`);
const warn = (msg)             => console.log(`\x1b[33m⚠\x1b[0m  ${msg}`);
const err  = (msg)             => console.log(`\x1b[31m✖\x1b[0m  ${msg}`);
const hr   = ()                => console.log('\x1b[90m' + '─'.repeat(55) + '\x1b[0m');

function loadProfile() {
  const path = join(ROOT, 'profile.json');
  if (!existsSync(path)) {
    err('profile.json not found. Copy the template and fill in your details.');
    process.exit(1);
  }
  const raw = readFileSync(path, 'utf-8')
    .replace(/^\s*"_comment".*$/gm, '')  // strip comment keys
    .replace(/,(\s*[}\]])/g, '$1');      // trailing commas
  try {
    return JSON.parse(raw);
  } catch (e) {
    err('profile.json has invalid JSON: ' + e.message);
    process.exit(1);
  }
}

function saveRunLog(data) {
  const path = join(ROOT, 'automation', '.run-log.json');
  const prev = existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : [];
  prev.unshift({ timestamp: new Date().toISOString(), ...data });
  writeFileSync(path, JSON.stringify(prev.slice(0, 50), null, 2));
}

// ── Commands ─────────────────────────────────────────────────────────────────
async function cmdAnalyze(profile) {
  hr();
  log('Analyzing resume with Claude AI…', '🤖');
  const { analyzeResume } = await import('./modules/resume-parser.js');
  const { matchJobs }     = await import('./modules/job-matcher.js');

  const analysis = await analyzeResume(profile);
  if (analysis) {
    ok(`ATS Score: ${analysis.atsScore}/100  (${analysis.label})`);
    log('Top tips:');
    analysis.tips.slice(0, 3).forEach((t, i) => console.log(`   ${i + 1}. ${t.text}`));
  }

  const matches = await matchJobs(profile, analysis);
  ok(`Found ${matches.length} matching jobs for your profile`);
  matches.slice(0, 5).forEach(j => log(`${j.company} — ${j.title}  (${j.matchScore}% match)`));

  return { analysis, matches };
}

async function cmdEmail(profile) {
  hr();
  log('Starting bulk email campaign…', '📧');
  const { sendCampaign } = await import('./modules/email-sender.js');

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    err('Set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file first.');
    warn('See .env.example for instructions.');
    return null;
  }

  const result = await sendCampaign(profile);
  ok(`Sent ${result.sent} emails  |  Failed: ${result.failed}`);
  return result;
}

async function cmdFill(profile, site) {
  hr();
  const sites = site ? [site] : (profile.applicationSettings?.preferredJobBoards || ['naukri', 'internshala', 'linkedin']);
  log(`Auto-filling forms on: ${sites.join(', ')}`, '🤖');

  const results = {};
  for (const s of sites) {
    try {
      const { fillSite } = await import('./modules/form-filler.js');
      const r = await fillSite(s, profile);
      results[s] = r;
      ok(`${s}: applied to ${r.applied} jobs`);
    } catch (e) {
      err(`${s}: ${e.message}`);
      results[s] = { error: e.message };
    }
  }
  return results;
}

async function cmdDigest(profile) {
  hr();
  log('Sending daily digest email…', '📬');
  const { sendDailyDigest } = await import('./modules/daily-digest.js');
  const result = await sendDailyDigest(profile);
  if (result) ok(`Digest sent — ${result.news} news items, problem: ${result.problem ? 'yes' : 'no'}`);
  return result;
}

async function cmdRun(profile) {
  console.log('\n\x1b[1m\x1b[36m  JobHunt Pro — Full Automation Run\x1b[0m');
  console.log(`  ${new Date().toLocaleString()}\n`);

  const log_data = { profile: profile.personal.name };

  // 1. Analyze resume
  const analysisResult = await cmdAnalyze(profile);
  log_data.analysis = analysisResult?.analysis
    ? { atsScore: analysisResult.analysis.atsScore, matchedJobs: analysisResult.matches?.length }
    : null;

  // 2. Send emails
  const emailResult = await cmdEmail(profile);
  log_data.email = emailResult;

  // 3. Send daily digest
  const digestResult = await cmdDigest(profile);
  log_data.digest = digestResult;

  // 4. Fill forms
  const fillResult = await cmdFill(profile, null);
  log_data.fill = fillResult;

  hr();
  ok('Automation run complete!');
  saveRunLog(log_data);
}

async function cmdSchedule(args) {
  const { setupSchedule } = await import('./scheduler.js');
  await setupSchedule(args);
}

async function cmdStatus() {
  hr();
  log('Last automation runs:', '📊');
  const path = join(ROOT, 'automation', '.run-log.json');
  if (!existsSync(path)) {
    warn('No runs yet. Use: node automation/runner.js run');
    return;
  }
  const logs = JSON.parse(readFileSync(path, 'utf-8'));
  logs.slice(0, 5).forEach(r => {
    const ts = new Date(r.timestamp).toLocaleString();
    const emailInfo = r.email ? `  📧 ${r.email.sent} sent` : '';
    const fillInfo  = r.fill  ? `  🤖 forms filled`         : '';
    console.log(`  ${ts}${emailInfo}${fillInfo}`);
  });
  hr();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const [,, command, ...rest] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    console.log(`
\x1b[1m  JobHunt Pro — Automation CLI\x1b[0m

  \x1b[36mCommands:\x1b[0m
    run                          Full run: analyze + digest + email + fill forms
    digest                       Send daily digest email (news + problem + reminder)
    analyze                      AI resume analysis + job matching
    email                        Send bulk application emails
    fill [--site naukri|internshala|linkedin]
                                 Auto-fill job application forms
    schedule --daily HH:MM       Run every day at given time (e.g. 09:00)
    schedule --weekly DAY HH:MM  Run every week (e.g. monday 09:00)
    schedule --cron "CRON_EXPR"  Custom cron expression
    schedule --list              Show active schedules
    schedule --stop              Cancel active schedule
    status                       Show last 5 run results

  \x1b[36mExamples:\x1b[0m
    node automation/runner.js run
    node automation/runner.js schedule --daily 09:00
    node automation/runner.js schedule --weekly monday 09:00
    node automation/runner.js fill --site naukri
    node automation/runner.js status
`);
    return;
  }

  const profile = loadProfile();

  switch (command) {
    case 'run':      await cmdRun(profile); break;
    case 'digest':   await cmdDigest(profile); break;
    case 'analyze':  await cmdAnalyze(profile); break;
    case 'email':    await cmdEmail(profile); break;
    case 'fill': {
      const siteIdx = rest.indexOf('--site');
      const site    = siteIdx !== -1 ? rest[siteIdx + 1] : null;
      await cmdFill(profile, site);
      break;
    }
    case 'schedule': await cmdSchedule(rest); break;
    case 'status':   await cmdStatus(); break;
    default:
      err(`Unknown command: ${command}. Run with --help for usage.`);
      process.exit(1);
  }
}

main().catch(e => {
  err(e.message);
  process.exit(1);
});
