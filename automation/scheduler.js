/**
 * scheduler.js — Schedule automation runs via node-cron.
 * Also supports creating a Windows Task Scheduler entry for system-level scheduling.
 *
 * Supported commands:
 *   node runner.js schedule --daily 09:00
 *   node runner.js schedule --weekly monday 09:00
 *   node runner.js schedule --cron "0 9 * * 1-5"
 *   node runner.js schedule --list
 *   node runner.js schedule --stop
 */

import cron         from 'node-cron';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, '..');
const CONFIG_PATH = join(__dirname, '.schedule-config.json');

const DAYS = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

const log  = (m) => console.log(`\x1b[36m→\x1b[0m  ${m}`);
const ok   = (m) => console.log(`\x1b[32m✔\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m⚠\x1b[0m  ${m}`);
const err  = (m) => console.log(`\x1b[31m✖\x1b[0m  ${m}`);
const hr   = ()  => console.log('\x1b[90m' + '─'.repeat(55) + '\x1b[0m');

// ── Cron expression builders ─────────────────────────────────────────────────
function dailyCron(time) {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) throw new Error(`Invalid time format: ${time}. Use HH:MM`);
  return `${m} ${h} * * *`;
}

function weeklyCron(day, time) {
  const dayNum = DAYS[day.toLowerCase()];
  if (dayNum === undefined) throw new Error(`Invalid day: ${day}. Use: monday, tuesday, …`);
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) throw new Error(`Invalid time format: ${time}. Use HH:MM`);
  return `${m} ${h} * * ${dayNum}`;
}

// ── Windows Task Scheduler helper ────────────────────────────────────────────
function createWindowsTask(label, cronExpr, nodeExe) {
  // Convert simple daily/weekly cron to schtasks format
  const parts = cronExpr.split(' ');
  const minute = parts[0], hour = parts[1], dayOfWeek = parts[4];

  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  const runnerPath = join(ROOT, 'automation', 'runner.js').replace(/\//g, '\\');
  const command = `"${nodeExe}" "${runnerPath}" run`;

  let schedule = '/SC DAILY';
  if (dayOfWeek !== '*') {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)]).join(',');
    schedule = `/SC WEEKLY /D ${days}`;
  }

  const cmd = `schtasks /Create /TN "JobHuntPro_${label}" /TR ${JSON.stringify(command)} ${schedule} /ST ${time} /F`;
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function deleteWindowsTask(label) {
  try {
    execSync(`schtasks /Delete /TN "JobHuntPro_${label}" /F`, { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

// ── Save/load schedule config ────────────────────────────────────────────────
function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return { schedules: [] };
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function setupSchedule(args) {
  hr();

  // List schedules
  if (args.includes('--list')) {
    const cfg = loadConfig();
    if (!cfg.schedules.length) {
      warn('No active schedules. Set one with --daily or --weekly.');
      return;
    }
    log('Active schedules:');
    cfg.schedules.forEach(s => {
      console.log(`  \x1b[32m•\x1b[0m  ${s.label}  (${s.cron})  — created ${new Date(s.created).toLocaleString()}`);
    });
    hr();
    return;
  }

  // Stop all schedules
  if (args.includes('--stop')) {
    const cfg = loadConfig();
    cfg.schedules.forEach(s => deleteWindowsTask(s.label));
    saveConfig({ schedules: [] });
    ok('All schedules stopped.');
    hr();
    return;
  }

  // Daily schedule
  if (args.includes('--daily')) {
    const time = args[args.indexOf('--daily') + 1];
    if (!time) { err('Usage: --daily HH:MM  (e.g. --daily 09:00)'); return; }
    const cronExpr = dailyCron(time);
    await activateSchedule('daily', cronExpr, `Every day at ${time}`);
    return;
  }

  // Weekly schedule
  if (args.includes('--weekly')) {
    const idx  = args.indexOf('--weekly');
    const day  = args[idx + 1];
    const time = args[idx + 2];
    if (!day || !time) { err('Usage: --weekly <day> HH:MM  (e.g. --weekly monday 09:00)'); return; }
    const cronExpr = weeklyCron(day, time);
    await activateSchedule('weekly', cronExpr, `Every ${day} at ${time}`);
    return;
  }

  // Custom cron
  if (args.includes('--cron')) {
    const cronExpr = args[args.indexOf('--cron') + 1];
    if (!cronExpr) { err('Usage: --cron "CRON_EXPRESSION"'); return; }
    if (!cron.validate(cronExpr)) { err(`Invalid cron expression: ${cronExpr}`); return; }
    await activateSchedule('custom', cronExpr, `Custom: ${cronExpr}`);
    return;
  }

  err('No schedule option given. Options: --daily, --weekly, --cron, --list, --stop');
}

async function activateSchedule(label, cronExpr, description) {
  if (!cron.validate(cronExpr)) {
    err(`Invalid cron expression: ${cronExpr}`);
    return;
  }

  const cfg = loadConfig();
  cfg.schedules = cfg.schedules.filter(s => s.label !== label); // replace existing
  cfg.schedules.push({ label, cron: cronExpr, description, created: new Date().toISOString() });
  saveConfig(cfg);

  // Try Windows Task Scheduler for persistence across reboots
  const nodeExe = process.execPath;
  const taskCreated = createWindowsTask(label, cronExpr, nodeExe);

  if (taskCreated) {
    ok(`Scheduled via Windows Task Scheduler: ${description}`);
    log('Runs automatically even when this terminal is closed.');
  } else {
    ok(`Schedule saved: ${description}`);
    warn('Windows Task Scheduler setup failed — starting in-process daemon instead.');
    warn('Keep this terminal open for scheduling to work.');
    startDaemon(cronExpr, label);
  }

  hr();
  log('To check schedules: node automation/runner.js schedule --list');
  log('To stop:           node automation/runner.js schedule --stop');
  hr();
}

// ── In-process daemon (fallback when Task Scheduler fails) ───────────────────
export function startDaemon(cronExpr, label = 'daemon') {
  log(`Starting in-process scheduler (${cronExpr})…`);

  cron.schedule(cronExpr, async () => {
    console.log(`\n[${new Date().toLocaleString()}] Running scheduled job: ${label}`);
    try {
      const { execSync } = await import('child_process');
      const runnerPath = join(ROOT, 'automation', 'runner.js');
      execSync(`node "${runnerPath}" run`, { stdio: 'inherit' });
    } catch (e) {
      console.error('Scheduled run failed:', e.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  ok('Scheduler is running. Press Ctrl+C to stop.');

  // Keep process alive
  process.stdin.resume();
}
