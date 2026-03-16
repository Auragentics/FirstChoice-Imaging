#!/usr/bin/env node
// FCI Voice Agent Test Runner
// Creates real outbound phone calls via Retell SDK, one per scenario.
// Usage:
//   node run-tests.js                        # Run all 86 scenarios
//   node run-tests.js --scenario S-01        # Run a single scenario
//   node run-tests.js --category Scheduling  # Run one category
//   node run-tests.js --dry-run              # Preview without calling
//   node run-tests.js --delay 30             # Seconds between calls (default: 20)

import Retell from 'retell-sdk';
import { scenarios } from './scenarios.js';
import fs from 'fs';
import path from 'path';

// ── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  // Set these via environment variables or edit directly
  retellApiKey:       process.env.RETELL_API_KEY       || '',
  testCallerAgentId:  process.env.TEST_CALLER_AGENT_ID || '', // Your test-caller agent in Retell
  fciPhoneNumber:     process.env.FCI_PHONE_NUMBER     || '', // FCI inbound number (e.g., +14351234567)
  fromPhoneNumber:    process.env.FROM_PHONE_NUMBER    || '', // Retell phone number assigned to test caller
  delayBetweenCalls:  20, // seconds — gives previous call time to finish
  maxCallDuration:    120, // seconds — auto-hang-up safety net
  pollInterval:       5,  // seconds — how often to check if call ended
  pollTimeout:        180, // seconds — max wait for a single call to finish
};

// ── CLI argument parsing ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun       = args.includes('--dry-run');
const scenarioFlag = args.indexOf('--scenario');
const categoryFlag = args.indexOf('--category');
const delayFlag    = args.indexOf('--delay');

if (delayFlag !== -1 && args[delayFlag + 1]) {
  CONFIG.delayBetweenCalls = parseInt(args[delayFlag + 1], 10);
}

let selectedScenarios = scenarios;

if (scenarioFlag !== -1 && args[scenarioFlag + 1]) {
  const id = args[scenarioFlag + 1].toUpperCase();
  selectedScenarios = scenarios.filter(s => s.id === id);
  if (selectedScenarios.length === 0) {
    console.error(`No scenario found with id: ${id}`);
    process.exit(1);
  }
}

if (categoryFlag !== -1 && args[categoryFlag + 1]) {
  const cat = args[categoryFlag + 1].toLowerCase();
  selectedScenarios = scenarios.filter(s => s.category.toLowerCase() === cat);
  if (selectedScenarios.length === 0) {
    console.error(`No scenarios found for category: ${args[categoryFlag + 1]}`);
    process.exit(1);
  }
}

// ── Validation ───────────────────────────────────────────────────────────────
function validateConfig() {
  const missing = [];
  if (!CONFIG.retellApiKey)      missing.push('RETELL_API_KEY');
  if (!CONFIG.testCallerAgentId) missing.push('TEST_CALLER_AGENT_ID');
  if (!CONFIG.fciPhoneNumber)    missing.push('FCI_PHONE_NUMBER');
  if (!CONFIG.fromPhoneNumber)   missing.push('FROM_PHONE_NUMBER');

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('\nSet them before running:');
    console.error('  export RETELL_API_KEY="your-key"');
    console.error('  export TEST_CALLER_AGENT_ID="agent-id"');
    console.error('  export FCI_PHONE_NUMBER="+14351234567"');
    console.error('  export FROM_PHONE_NUMBER="+18015559999"');
    process.exit(1);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function buildDynamicVariables(scenario) {
  // Pass scenario details to the test caller agent via dynamic variables
  // so it knows which persona/script to use for this call
  return {
    test_scenario_id: scenario.id,
    test_persona: scenario.persona,
    test_opening: scenario.opening || '(silence — do not speak first)',
    test_phone: scenario.phone || 'none',
    test_expected_transfer: scenario.expectedTransfer || 'none',
    test_expected_behavior: scenario.expectedBehavior,
    test_follow_up: scenario.followUp
      ? (Array.isArray(scenario.followUp) ? scenario.followUp.join(' | ') : scenario.followUp)
      : 'none',
    test_lien_data: scenario.lienTestData ? JSON.stringify(scenario.lienTestData) : 'none',
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   FCI Voice Agent Test Runner                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Scenarios: ${selectedScenarios.length} of ${scenarios.length}`);
  console.log(`  Delay between calls: ${CONFIG.delayBetweenCalls}s`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN (no calls will be made)' : 'LIVE'}`);
  console.log('');

  if (dryRun) {
    console.log('Scenarios that would be executed:\n');
    selectedScenarios.forEach(s => {
      console.log(`  ${s.id} [${s.category}] — ${s.persona}`);
      console.log(`    Opening: "${s.opening || '(silence)'}"`);
      console.log(`    Expected transfer: ${s.expectedTransfer || 'none'}`);
      console.log('');
    });
    console.log(`Total: ${selectedScenarios.length} calls`);
    return;
  }

  validateConfig();

  const client = new Retell({ apiKey: CONFIG.retellApiKey });

  const results = [];
  const resultsDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'results');

  // Handle Windows paths (URL pathname starts with / on Windows)
  const normalizedResultsDir = process.platform === 'win32'
    ? resultsDir.replace(/^\//, '')
    : resultsDir;

  if (!fs.existsSync(normalizedResultsDir)) {
    fs.mkdirSync(normalizedResultsDir, { recursive: true });
  }

  const runId = timestamp();
  console.log(`Run ID: ${runId}\n`);

  for (let i = 0; i < selectedScenarios.length; i++) {
    const scenario = selectedScenarios[i];
    const progress = `[${i + 1}/${selectedScenarios.length}]`;

    console.log(`${progress} ${scenario.id} — ${scenario.persona}`);
    console.log(`  Opening: "${scenario.opening || '(silence)'}"`);

    try {
      // Create the outbound call
      const call = await client.call.createPhoneCall({
        from_number: CONFIG.fromPhoneNumber,
        to_number: CONFIG.fciPhoneNumber,
        override_agent_id: CONFIG.testCallerAgentId,
        retell_llm_dynamic_variables: buildDynamicVariables(scenario),
      });

      console.log(`  Call created: ${call.call_id}`);

      // Poll until the call ends
      let callData = null;
      const startTime = Date.now();

      while (true) {
        await sleep(CONFIG.pollInterval);
        const elapsed = (Date.now() - startTime) / 1000;

        if (elapsed > CONFIG.pollTimeout) {
          console.log(`  ⚠ Timed out waiting for call to end (${CONFIG.pollTimeout}s)`);
          break;
        }

        try {
          callData = await client.call.retrieve(call.call_id);

          if (callData.call_status === 'ended' || callData.call_status === 'error') {
            const duration = callData.end_timestamp && callData.start_timestamp
              ? Math.round((callData.end_timestamp - callData.start_timestamp) / 1000)
              : 0;
            console.log(`  Call ended — duration: ${duration}s, disconnect: ${callData.disconnection_reason || 'unknown'}`);
            break;
          }
        } catch (pollErr) {
          // Call might not be retrievable yet
          if (elapsed > 30) {
            console.log(`  ⚠ Error polling call: ${pollErr.message}`);
          }
        }
      }

      // Extract transcript
      const transcript = callData?.transcript || '';
      const transferDetected = callData?.call_analysis?.call_summary?.includes('transfer') || false;

      const result = {
        scenarioId: scenario.id,
        category: scenario.category,
        persona: scenario.persona,
        callId: call.call_id,
        status: callData?.call_status || 'unknown',
        duration: callData?.end_timestamp && callData?.start_timestamp
          ? Math.round((callData.end_timestamp - callData.start_timestamp) / 1000)
          : null,
        disconnectReason: callData?.disconnection_reason || null,
        expectedTransfer: scenario.expectedTransfer,
        expectedBehavior: scenario.expectedBehavior,
        transferDetected,
        transcript,
        callAnalysis: callData?.call_analysis || null,
      };

      results.push(result);
      console.log(`  ✓ Result captured\n`);

    } catch (err) {
      console.error(`  ✗ Error: ${err.message}\n`);
      results.push({
        scenarioId: scenario.id,
        category: scenario.category,
        persona: scenario.persona,
        callId: null,
        status: 'error',
        error: err.message,
        expectedTransfer: scenario.expectedTransfer,
        expectedBehavior: scenario.expectedBehavior,
      });
    }

    // Wait between calls
    if (i < selectedScenarios.length - 1) {
      console.log(`  Waiting ${CONFIG.delayBetweenCalls}s before next call...`);
      await sleep(CONFIG.delayBetweenCalls);
    }
  }

  // Save results
  const resultsFile = path.join(normalizedResultsDir, `run-${runId}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify({ runId, timestamp: new Date().toISOString(), results }, null, 2));
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Results saved to: ${resultsFile}`);
  console.log(`Total: ${results.length} | Errors: ${results.filter(r => r.status === 'error').length}`);
  console.log('\nView results: npm run results');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
