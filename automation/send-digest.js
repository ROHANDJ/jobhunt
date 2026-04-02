/**
 * send-digest.js — Standalone entry point for the daily digest.
 *
 * Used by:
 *   - GitHub Actions (runs every day at 9 AM IST automatically)
 *   - Local:  node automation/send-digest.js
 */

import 'dotenv/config';
import { sendDailyDigest } from './modules/daily-digest.js';

console.log('\n\x1b[1m\x1b[36m  JobHunt Pro — Daily Digest\x1b[0m');
console.log(`  ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`);

sendDailyDigest()
  .then(r => {
    if (r) {
      console.log(`\n  📰 News: ${r.news} stories`);
      console.log(`  🧩 Problem: ${r.problem ? 'generated' : 'skipped'}`);
      console.log(`  💡 Tip: ${r.tip ? 'generated' : 'skipped'}`);
      console.log('\n  \x1b[32m✔ Digest sent successfully!\x1b[0m\n');
    }
  })
  .catch(e => {
    console.error('\n  \x1b[31m✖ Error:\x1b[0m', e.message);
    process.exit(1);
  });
