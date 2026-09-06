// Connectivity + discovery probe. Proves the API key, base URL, domain, and
// mailboxes all work against the real Net Sapiens instance, and shows the raw
// shape of the data we care about.
//
// Usage:
//   node src/probe.js --caller 4355551234 [--mailbox 1001] [--hours 72] [--raw]
//
// --caller   number to look up (required)
// --mailbox  override NS_MAILBOXES for this run (comma-separated)
// --hours    CDR lookback window (default 72)
// --raw      also dump the first raw voicemail + CDR object (field discovery)
import './env.js';
import { readVoicemails, searchCdrs, readQueuedCalls, DOMAIN } from './nsClient.js';
import { lookupRepeatCaller, normalize } from './lookup.js';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

const caller = arg('caller');
const hours = Number(arg('hours', 72));
const raw = arg('raw', false);
const queue = String(arg('queue', process.env.NS_QUEUE || '')).trim() || null;
const mailboxes = String(arg('mailbox', process.env.NS_MAILBOXES || ''))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Atomic self-test: read the queue, list everyone in it (extracted fields),
// then run the real lookup against the FIRST person currently in it — no race,
// proves extraction + matching against live data. Usage: --queuelist
if (arg('queuelist', false)) {
  const q = await readQueuedCalls(queue);
  const list = Array.isArray(q) ? q : q?.data ?? [];
  console.log(`\nQueue ${queue}: ${list.length} waiting\n`);
  for (const e of list) {
    console.log(
      `  ${e['dial-rule-translation-source-user'] ?? '?'}  ` +
        `${e['dial-rule-translation-source-name'] ?? ''}  ` +
        `[${e['callqueue-agent-availability-for-dispatch'] ?? '?'}]  ${e.time_queued ?? ''}`
    );
  }
  if (list.length) {
    const first = String(list[0]['dial-rule-translation-source-user']);
    const r = await lookupRepeatCaller({ caller: first, queue });
    console.log(`\nself-test → lookup(${first}) => callbacks in queue: ${r.callbacks.length}` +
      (r.callbacks.length ? '  ✓ MATCH' : '  ✗ no match (extraction bug?)'));
  } else {
    console.log('\n(queue empty right now — try again when callers are waiting)');
  }
  process.exit(0);
}

if (!caller) {
  console.error('Missing --caller. Example:\n  node src/probe.js --caller 4355551234 --mailbox 1001');
  process.exit(1);
}

console.log(`\nDomain: ${DOMAIN}`);
console.log(`Caller: ${caller}  (normalized ${normalize(caller)})`);
console.log(`Mailboxes: ${mailboxes.length ? mailboxes.join(', ') : '(none set)'}`);
console.log(`Queue: ${queue || '(none set)'}`);
console.log(`CDR lookback: ${hours}h\n`);

if (raw) {
  // Field-discovery mode: dump the first object from each source verbatim.
  if (queue) {
    try {
      const q = await readQueuedCalls(queue);
      const list = Array.isArray(q) ? q : q?.data ?? [];
      console.log(`--- raw queued-call sample (queue ${queue}, ${list.length} waiting) ---`);
      console.log(JSON.stringify(list[0] ?? {}, null, 2), '\n');
    } catch (err) {
      console.log(`queue read failed: ${err.message}\n`);
    }
  }
  if (mailboxes[0]) {
    try {
      const vms = await readVoicemails(mailboxes[0], 'new');
      const list = Array.isArray(vms) ? vms : vms?.data ?? [];
      console.log(`--- raw voicemail sample (mailbox ${mailboxes[0]}, ${list.length} in "new") ---`);
      console.log(JSON.stringify(list[0] ?? {}, null, 2), '\n');
    } catch (err) {
      console.log(`voicemail read failed: ${err.message}\n`);
    }
  }
  try {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const cdrs = await searchCdrs({ caller: normalize(caller), start, end });
    const list = Array.isArray(cdrs) ? cdrs : cdrs?.data ?? [];
    console.log(`--- raw CDR sample (${list.length} matched) ---`);
    console.log(JSON.stringify(list[0] ?? {}, null, 2), '\n');
  } catch (err) {
    console.log(`cdr search failed: ${err.message}\n`);
  }
}

const result = await lookupRepeatCaller({ caller, mailboxes, queue, lookbackHours: hours });

console.log('=== Repeat-caller verdict ===');
console.log(`found: ${result.found}`);
console.log(`voicemails: ${result.voicemails.length}`);
for (const vm of result.voicemails) {
  console.log(`  • mailbox ${vm.mailbox} @ ${vm.at} (${vm.seconds}s) — ${vm.transcription?.slice(0, 80) || '(no transcript)'}`);
}
console.log(`callbacks in queue: ${result.callbacks.length}`);
for (const cb of result.callbacks) {
  console.log(`  • queue ${cb.queue} — ${cb.from} ${cb.name ? `(${cb.name})` : ''} [${cb.status || 'status?'}] ${cb.at || ''}`);
}
console.log(`recent calls: ${result.recentCalls.length}`);
for (const c of result.recentCalls.slice(0, 10)) {
  console.log(`  • ${c.at} — ${c.disposition} (${c.seconds}s)`);
}
if (result.errors.length) {
  console.log('\nErrors:');
  for (const e of result.errors) console.log(`  ! ${e}`);
}
console.log('');
