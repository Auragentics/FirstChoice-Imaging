// deploy-prompts.js — push the FCI voice-agent prompts from the repo .md files
// into the GHL-native Voice AI agents (the agentPrompt field), replacing the
// manual copy-paste into the GHL dashboard.
//
// SAFE BY DEFAULT: dry-run unless you pass --commit. The prompt→agent mapping is
// resolved fresh each run (no hard-coded agent IDs) — each prompt matches exactly
// ONE agent by its published inbound DID (name as fallback); anything ambiguous
// is reported and SKIPPED, never written.
//
// Usage:
//   node src/deploy-prompts.js --list         # show every agent GHL returns
//   node src/deploy-prompts.js                # dry-run: resolve mapping + diff
//   node src/deploy-prompts.js --only logan   # limit to one location
//   node src/deploy-prompts.js --commit       # actually PATCH agentPrompt
//   node src/deploy-prompts.js --only logan --commit   # deploy one, for a first live test
//
// Requires GHL_PIT + GHL_LOCATION_ID (see .env.example).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { listVoiceAgents, getVoiceAgent, patchVoiceAgent, LOCATION_ID } from './ghlClient.js';
import { PROMPTS, resolveMatch, diffSummary, agentId, agentName, agentDid } from './promptDeploy.js';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, '..', '..'); // prompts live in the project root, above netsapiens-bridge/

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const only = (() => {
  const i = args.indexOf('--only');
  return i >= 0 ? String(args[i + 1] || '').toLowerCase() : null;
})();

/** Read a prompt file → LF line endings, single trailing newline. GHL stores
 *  LF, and the repo files are Windows CRLF, so normalize to avoid sending \r and
 *  to keep diffs content-only rather than line-ending noise. */
function readPrompt(file) {
  return readFileSync(join(REPO_ROOT, file), 'utf8').replace(/\r\n?/g, '\n').replace(/\s+$/, '') + '\n';
}

async function main() {
  const commit = has('--commit');
  const agents = await listVoiceAgents();
  console.log(`\nLocation ${LOCATION_ID}: ${agents.length} Voice AI agent(s) returned by GHL.\n`);

  if (has('--list')) {
    for (const a of agents) {
      console.log(`  • ${agentName(a).padEnd(24)} id=${agentId(a)}  did=${agentDid(a) || '(none)'}`);
    }
    console.log('');
    return;
  }

  const plan = PROMPTS.filter((p) => !only || p.label.toLowerCase().includes(only));
  if (only && plan.length === 0) {
    console.error(`No prompt matches --only "${only}". Known: ${PROMPTS.map((p) => p.label).join(', ')}`);
    process.exit(1);
  }

  let willWrite = 0, wrote = 0, skipped = 0, same = 0;
  for (const p of plan) {
    const { agent, count, by } = resolveMatch(agents, p);
    if (!agent) {
      console.log(`  ⚠️  ${p.label.padEnd(9)} — ${count === 0 ? 'no agent matched' : count + ' agents matched (ambiguous)'} by ${by}; SKIPPED`);
      skipped++;
      continue;
    }
    const id = agentId(agent);
    const newText = readPrompt(p.file);

    let current = null;
    try {
      const full = await getVoiceAgent(id);
      current = full?.agentPrompt ?? null;
      if (current != null) current = current.replace(/\r\n?/g, '\n'); // normalize for a content-only diff
    } catch {
      current = null; // read failed (scope/endpoint) — fall through as UNKNOWN
    }

    const d = diffSummary(current, newText);
    const glyph = d.status === 'SAME' ? '=' : d.status === 'DIFF' ? '~' : '?';
    console.log(`  [${glyph}] ${p.label.padEnd(9)} → ${agentName(agent)} (id=${id}, did=${agentDid(agent) || '?'}, matched-by-${by})  ${d.status}: ${d.detail}`);
    if (d.status === 'DIFF') {
      console.log(`        old: ${JSON.stringify(String(d.firstOld).slice(0, 90))}`);
      console.log(`        new: ${JSON.stringify(String(d.firstNew).slice(0, 90))}`);
    }

    if (d.status === 'SAME') { same++; continue; }
    willWrite++;

    if (commit) {
      if (d.status === 'UNKNOWN') console.log(`        (note: couldn't read the current prompt — writing anyway, verify in the UI)`);
      await patchVoiceAgent(id, { agentPrompt: newText });
      console.log(`        ✔ committed`);
      wrote++;
    }
  }

  console.log('');
  if (commit) {
    console.log(`Done. Wrote ${wrote}, unchanged ${same}, skipped ${skipped}.\n`);
  } else {
    console.log(`Dry-run. Would write ${willWrite}, unchanged ${same}, skipped ${skipped}. Pass --commit to apply.\n`);
  }
}

main().catch((e) => {
  console.error('\n✗ ' + e.message + '\n');
  process.exit(1);
});
