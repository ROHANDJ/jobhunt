#!/usr/bin/env node
/**
 * setup.js — First-time setup wizard for JobHunt Pro automation.
 *
 * Run: node automation/setup.js
 */

import { execSync }    from 'child_process';
import { existsSync, copyFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

const ok   = (m) => console.log(`\x1b[32m✔\x1b[0m  ${m}`);
const log  = (m) => console.log(`\x1b[36m→\x1b[0m  ${m}`);
const warn = (m) => console.log(`\x1b[33m⚠\x1b[0m  ${m}`);
const hr   = ()  => console.log('\x1b[90m' + '─'.repeat(55) + '\x1b[0m');

console.log(`
\x1b[1m\x1b[36m  JobHunt Pro — Setup Wizard\x1b[0m
  This will configure your automation environment.
`);

async function main() {
  hr();

  // Step 1: Install Node dependencies
  log('Installing Node.js dependencies…');
  try {
    execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
    ok('Dependencies installed');
  } catch {
    warn('npm install failed — run it manually: npm install');
  }
  hr();

  // Step 2: Install Playwright browsers
  log('Installing Playwright browsers (needed for form-filling)…');
  log('This downloads ~200MB of browsers. Wait…');
  try {
    execSync('npx playwright install chromium', { cwd: ROOT, stdio: 'inherit' });
    ok('Playwright Chromium installed');
  } catch {
    warn('Playwright install failed — run: npx playwright install chromium');
  }
  hr();

  // Step 3: Create .env file
  if (!existsSync(join(ROOT, '.env'))) {
    log('Creating .env from template…');
    copyFileSync(join(ROOT, '.env.example'), join(ROOT, '.env'));
    ok('.env file created');
  } else {
    ok('.env already exists');
  }

  // Step 4: Guide user to fill .env
  console.log(`
\x1b[1m  Next steps:\x1b[0m

  1. \x1b[33mFill in profile.json\x1b[0m with your personal details, education, skills, etc.
     Open: \x1b[36mprofile.json\x1b[0m

  2. \x1b[33mSet up your credentials in .env\x1b[0m:
     • GEMINI_API_KEY — get free at https://aistudio.google.com/apikey
     • GMAIL_USER + GMAIL_APP_PASSWORD — for sending emails
       (App password: https://myaccount.google.com/apppasswords)
     • NAUKRI_EMAIL + NAUKRI_PASSWORD — for Naukri.com
     • INTERNSHALA_EMAIL + INTERNSHALA_PASSWORD — for Internshala
     • LINKEDIN_EMAIL + LINKEDIN_PASSWORD — for LinkedIn

  3. \x1b[33mAdd your resume PDF\x1b[0m to: \x1b[36massets/resume.pdf\x1b[0m

  4. \x1b[33mRun the automation:\x1b[0m
     \x1b[36mnode automation/runner.js run\x1b[0m

  5. \x1b[33mSchedule it:\x1b[0m
     \x1b[36mnode automation/runner.js schedule --daily 09:00\x1b[0m
`);

  hr();
  const proceed = await ask('Open .env file now to fill in credentials? (y/n): ');
  if (proceed.trim().toLowerCase() === 'y') {
    try {
      execSync(`start notepad "${join(ROOT, '.env')}"`, { stdio: 'ignore' });
    } catch {
      log(`.env is at: ${join(ROOT, '.env')}`);
    }
  }

  rl.close();
  ok('Setup complete!');
}

main().catch(e => {
  console.error(e.message);
  rl.close();
  process.exit(1);
});
