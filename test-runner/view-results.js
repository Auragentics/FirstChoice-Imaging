#!/usr/bin/env node
// FCI Test Results Viewer
// Usage:
//   node view-results.js                 # View latest run
//   node view-results.js --all           # List all runs
//   node view-results.js --run <runId>   # View specific run
//   node view-results.js --transcript S-01  # Print full transcript for a scenario

import fs from 'fs';
import path from 'path';

const resultsDir = (() => {
  const raw = path.join(path.dirname(new URL(import.meta.url).pathname), 'results');
  return process.platform === 'win32' ? raw.replace(/^\//, '') : raw;
})();

const args = process.argv.slice(2);
const showAll         = args.includes('--all');
const runFlag         = args.indexOf('--run');
const transcriptFlag  = args.indexOf('--transcript');

function getResultFiles() {
  if (!fs.existsSync(resultsDir)) return [];
  return fs.readdirSync(resultsDir)
    .filter(f => f.startsWith('run-') && f.endsWith('.json'))
    .sort()
    .reverse();
}

function loadRun(filename) {
  const raw = fs.readFileSync(path.join(resultsDir, filename), 'utf-8');
  return JSON.parse(raw);
}

function printSummary(data) {
  const { runId, timestamp, results } = data;
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║  Test Run: ${runId}`);
  console.log(`║  Date: ${timestamp}`);
  console.log(`║  Total Scenarios: ${results.length}`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Group by category
  const categories = {};
  for (const r of results) {
    if (!categories[r.category]) categories[r.category] = [];
    categories[r.category].push(r);
  }

  let totalPass = 0;
  let totalFail = 0;
  let totalError = 0;

  for (const [cat, catResults] of Object.entries(categories)) {
    console.log(`── ${cat} (${ catResults.length} scenarios) ──`);
    for (const r of catResults) {
      const statusIcon = r.status === 'error' ? '✗' : '○';
      const duration = r.duration != null ? `${r.duration}s` : '—';

      if (r.status === 'error') {
        totalError++;
        console.log(`  ${statusIcon} ${r.scenarioId}  ERROR  ${r.error || ''}`);
      } else {
        // Basic automated checks
        const checks = [];

        // Check if expected transfer was detected
        if (r.expectedTransfer) {
          const transcriptLower = (r.transcript || '').toLowerCase();
          const transferLower = r.expectedTransfer.toLowerCase();
          if (transcriptLower.includes('transfer') || transcriptLower.includes(transferLower)) {
            checks.push('transfer:✓');
          } else {
            checks.push('transfer:?');
          }
        }

        // Check call completed (not errored)
        if (r.disconnectReason === 'agent_hangup' || r.disconnectReason === 'call_transfer') {
          checks.push('end:clean');
        } else if (r.disconnectReason) {
          checks.push(`end:${r.disconnectReason}`);
        }

        console.log(`  ${statusIcon} ${r.scenarioId}  ${duration.padEnd(5)} ${r.persona.padEnd(35)} ${checks.join('  ')}`);
        totalPass++; // All non-error calls count — manual review needed for pass/fail
      }
    }
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════════');
  console.log(`Completed: ${totalPass}  |  Errors: ${totalError}  |  Total: ${results.length}`);
  console.log('\nNote: Automated checks are preliminary. Review transcripts');
  console.log('for full pass/fail evaluation against expected behavior.');
  console.log('\nView a transcript: node view-results.js --transcript <scenario-id>');
}

function printTranscript(data, scenarioId) {
  const id = scenarioId.toUpperCase();
  const result = data.results.find(r => r.scenarioId === id);

  if (!result) {
    console.error(`Scenario ${id} not found in this run.`);
    console.error('Available:', data.results.map(r => r.scenarioId).join(', '));
    return;
  }

  console.log(`\n═══ ${result.scenarioId} — ${result.persona} ═══`);
  console.log(`Category: ${result.category}`);
  console.log(`Call ID: ${result.callId}`);
  console.log(`Duration: ${result.duration != null ? result.duration + 's' : 'unknown'}`);
  console.log(`Disconnect: ${result.disconnectReason || 'unknown'}`);
  console.log(`Expected transfer: ${result.expectedTransfer || 'none'}`);
  console.log(`Expected behavior: ${result.expectedBehavior}`);

  console.log('\n── Transcript ──\n');
  if (result.transcript) {
    console.log(result.transcript);
  } else {
    console.log('(No transcript available)');
  }

  if (result.callAnalysis) {
    console.log('\n── Call Analysis ──\n');
    console.log(JSON.stringify(result.callAnalysis, null, 2));
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const files = getResultFiles();

if (files.length === 0) {
  console.log('No test results found. Run tests first: npm test');
  process.exit(0);
}

if (showAll) {
  console.log('Available test runs:\n');
  for (const f of files) {
    const data = loadRun(f);
    console.log(`  ${data.runId}  —  ${data.results.length} scenarios  —  ${data.timestamp}`);
  }
  console.log(`\nView a run: node view-results.js --run <runId>`);
  process.exit(0);
}

// Determine which run to display
let targetFile = files[0]; // default to latest

if (runFlag !== -1 && args[runFlag + 1]) {
  const runId = args[runFlag + 1];
  const match = files.find(f => f.includes(runId));
  if (!match) {
    console.error(`No run found matching: ${runId}`);
    console.error('Available runs:', files.map(f => f.replace('run-', '').replace('.json', '')).join(', '));
    process.exit(1);
  }
  targetFile = match;
}

const data = loadRun(targetFile);

if (transcriptFlag !== -1 && args[transcriptFlag + 1]) {
  printTranscript(data, args[transcriptFlag + 1]);
} else {
  printSummary(data);
}
