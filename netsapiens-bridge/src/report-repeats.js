// Repeat-caller baseline report. Pulls the day's call records, isolates true
// inbound calls (direction=1 legs — an external caller dialing an FCI DID),
// collapses the multi-leg records into distinct calls, tracks which callers left
// a voicemail/callback, and summarizes repeat-caller volume + duplicate rate.
//
// Call model (validated Aug 2026 against the live CDR feed):
//   • Inbound call     = call-direction "1" leg; caller in call-orig-from-uri
//                        (sip:+1XXXXXXXXXX@...); the dialed FCI number is in
//                        call-orig-request-user. Distinct calls = cluster a
//                        caller's dir=1 legs by a 1-minute gap (validated: this
//                        reproduces the phone system's own inbound-call count).
//   • VM/callback left = call-term-to-uri VMail / CallBack-Queue (these land on
//                        direction "2" terminating legs); caller in from-uri or
//                        call-orig-caller-id. A 2nd+ from one number = a duplicate.
//
// Usage:
//   node src/report-repeats.js                 (today, local midnight -> now)
//   node src/report-repeats.js --day 2026-08-06 (a specific local calendar day)
//   node src/report-repeats.js --hours 24      (last 24 hours)
//   node src/report-repeats.js --min 3         (list callers with >= 3 calls)
//   node src/report-repeats.js --gap 2         (minutes gap that starts a new call; default 1)
//
// Caveat: caller ID can't tell patients from provider offices, so clinics that
// call about many patients inflate the count. Directional baseline, not exact.
import './env.js';
import { nsGet, DOMAIN } from './nsClient.js';
import { normalize } from './lookup.js';
import { mkdirSync, existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(here, '..', 'logs');

// Best-effort provider classifier. (a) A manual, reliable list you maintain at
// logs/known-providers.txt (one phone number per line). (b) A name heuristic —
// caller names that read like a business/clinic. Individual names and
// carrier placeholders (e.g. "LOGAN UT", "WIRELESS CALLER") are treated as patients.
const knownProviders = new Set();
const knownFile = path.join(logsDir, 'known-providers.txt');
if (existsSync(knownFile)) {
  for (const line of readFileSync(knownFile, 'utf8').split(/\r?\n/)) {
    const n = normalize(line.split('#')[0].trim());
    if (n.length === 10) knownProviders.add(n);
  }
}
const PROVIDER_HINTS =
  /\b(MEDICAL|CLINIC|HEALTH|HOSPITAL|CANCER|IMAGING|RADIOL|ORTHO|PEDIATR|DERM|FAMILY|FMLY|MED|CARE|CENTER|ASSOC|PLLC|LLC|INC|CORP|TELECOM|PHARMAC|SURG|URGENT|WELLNESS|THERAPY|CHIRO|DENTAL|VISION|CARDIO|NEURO|OBGYN|ONE CALL|PHYSIC)\b/;
const isProvider = (num, name) =>
  knownProviders.has(num) || PROVIDER_HINTS.test(String(name || '').toUpperCase());

function arg(name, fb) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fb;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const hours = Number(arg('hours', 0));
const minList = Number(arg('min', 2));
const gapMs = Number(arg('gap', 0.25)) * 60 * 1000; // 15s: merges only near-simultaneous re-rings
const day = arg('day', ''); // YYYY-MM-DD (local calendar day)

let now = new Date();
let start;
if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
  const [y, m, dd] = day.split('-').map(Number);
  start = new Date(y, m - 1, dd, 0, 0, 0, 0);
  now = new Date(y, m - 1, dd + 1, 0, 0, 0, 0); // end = next local midnight
} else {
  start = hours > 0 ? new Date(now.getTime() - hours * 3600e3) : new Date(now);
  if (hours <= 0) start.setHours(0, 0, 0, 0);
}

// The caller's number lives in call-orig-from-uri (sip:+1XXXXXXXXXX@...) on the
// inbound leg; fall back to call-orig-caller-id on terminating (VM/callback) legs.
function callerFromUri(c) {
  const m = String(c['call-orig-from-uri'] ?? '').match(/sip:\+?1?(\d{10})@/);
  return m ? m[1] : '';
}
function callerAny(c) {
  const u = callerFromUri(c);
  if (u.length === 10) return u;
  const cid = normalize(c['call-orig-caller-id'] ?? '');
  return cid.length === 10 ? cid : '';
}

// A SCHEDULING duplicate = a voicemail in mailbox 2002 (Scheduling) or a scheduling
// callback. Voicemails on OTHER lines (front desk 2004/2006, authorizations 2003,
// billing, etc.) are a DIFFERENT matter (or a mis-route) — the caller is entitled to
// leave that message, so it is intentionally NOT counted as a duplicate. The goal is
// to eliminate duplicate messages for the SAME scheduling request.
function isSchedulingVmcb(term, termUser) {
  if (/CallBack-Queue/.test(term)) return true; // scheduling callback (queue 2002)
  return /VMail/.test(term) && String(termUser ?? '') === '2002'; // scheduling VM only
}

// Collapse a sorted list of timestamps into distinct events (gap > gapMs = new).
function collapse(times) {
  times.sort((a, b) => a - b);
  let n = 0, last = -Infinity;
  for (const t of times) { if (t - last > gapMs) n++; last = t; }
  return n;
}

// The CDR feed caps a single query at ~1000 legs and offset paging doesn't
// advance, so pull the window in time chunks (each well under the cap) and
// de-dupe legs by their unique id.
const d = encodeURIComponent(DOMAIN);
const legs = [];
const seen = new Set();
const LIMIT = 1000;
const CHUNK_MS = 2 * 3600e3; // 2-hour chunks
let truncated = false;
for (let t0 = start.getTime(); t0 < now.getTime(); t0 += CHUNK_MS) {
  const t1 = Math.min(t0 + CHUNK_MS, now.getTime());
  const res = await nsGet(`/domains/${d}/cdrs`, {
    'datetime-start': new Date(t0).toISOString(), 'datetime-end': new Date(t1).toISOString(), limit: LIMIT,
  });
  const page = Array.isArray(res) ? res : res?.data ?? [];
  if (page.length >= LIMIT) truncated = true; // a 2h chunk shouldn't hit the cap
  for (const c of page) {
    const id = c.id ?? `${c['call-orig-from-uri']}|${c['call-start-datetime']}|${c['call-term-to-uri']}`;
    if (seen.has(id)) continue;
    seen.add(id); legs.push(c);
  }
}

// FCI published lines that forward to the GHL/Retell AI agents (dialed DID ->
// location). Only calls to these lines reach the AI, so only these can be
// deflected by it — this is the realistic denominator for "100%". Everything
// else dials a direct staff/scheduling line the AI never sees.
const AI_LINES = new Map([
  ['4352589598', 'Logan'],
  ['4358821674', 'Tooele'],
  ['8015761290', 'Sandy'],
  ['4352756210', 'St. George'],
]);
const dialedDid = (c) => normalize(c['call-orig-request-user'] ?? '');

// Cluster a caller's legs into distinct calls (gap > gapMs = new call), and mark
// each call AI-handled if any of its legs dialed an AI line. Returns one entry
// per distinct call. (Legs of one call share a dialed number, so this is a clean
// per-call classification — unlike a per-caller flag, which over-credits the AI.)
function clusterCalls(items) { // items: [{ t, ai }]
  items.sort((a, b) => a.t - b.t);
  const calls = [];
  let last = -Infinity, cur = null;
  for (const x of items) {
    if (x.t - last > gapMs) { cur = { ai: false }; calls.push(cur); }
    if (x.ai) cur.ai = true;
    last = x.t;
  }
  return calls;
}

// Pass 1 — inbound calls. A real inbound call is a direction "1" leg that dialed
// one of the 4 published AI numbers. Direction-1 legs to the front-desk /
// scheduling lines are the SAME call's second hop (the AI transferring the caller
// onward), NOT new inbound calls — so we skip them here (they'd otherwise split a
// single call into two when the AI conversation runs past the 1-min gap).
const inbound = new Map(); // caller -> { legs:[{t}], name, locs:Set }
let transferLegs = 0;
for (const c of legs) {
  if (String(c['call-direction']) !== '1') continue;
  const caller = callerFromUri(c);
  if (caller.length !== 10) continue;
  const loc = AI_LINES.get(dialedDid(c));
  if (!loc) { transferLegs++; continue; } // transfer to staff/scheduling line
  const t = Date.parse(c['call-start-datetime'] ?? '');
  if (Number.isNaN(t)) continue;
  if (!inbound.has(caller)) inbound.set(caller, { legs: [], name: '', locs: new Set() });
  const g = inbound.get(caller);
  g.legs.push({ t, ai: true });
  if (!g.name && c['call-orig-from-name']) g.name = c['call-orig-from-name'];
  g.locs.add(loc);
}

// Pass 2 — voicemails/callbacks left (leg terminates at VMail / CallBack-Queue).
const vmcb = new Map(); // caller -> [t]
for (const c of legs) {
  if (!isSchedulingVmcb(String(c['call-term-to-uri'] ?? ''), c['call-term-user'])) continue;
  const caller = callerAny(c);
  if (caller.length !== 10) continue;
  const t = Date.parse(c['call-start-datetime'] ?? '');
  if (Number.isNaN(t)) continue;
  if (!vmcb.has(caller)) vmcb.set(caller, []);
  vmcb.get(caller).push(t);
}

// Per-caller rollup: distinct calls (with per-call AI flag), distinct VM/callbacks.
const byCaller = new Map(); // caller -> { count, aiCount, vmcbCount, name, aiLine, locs }
let totalCalls = 0, aiCalls = 0, duplicatesCreated = 0;
const allCallers = new Set([...inbound.keys(), ...vmcb.keys()]);
for (const caller of allCallers) {
  const g = inbound.get(caller);
  const calls = g ? clusterCalls(g.legs.slice())
    : (vmcb.get(caller) || []).map((t) => ({ ai: false })); // VM/callback-only caller
  const count = g ? calls.length : collapse((vmcb.get(caller) || []).slice());
  const aiCount = g ? calls.filter((c) => c.ai).length : 0;
  const vmcbCount = vmcb.has(caller) ? collapse(vmcb.get(caller).slice()) : 0;
  totalCalls += count;
  aiCalls += aiCount;
  duplicatesCreated += Math.max(0, vmcbCount - 1);
  byCaller.set(caller, {
    count, aiCount, vmcbCount,
    name: g?.name || '',
    aiLine: aiCount > 0,
    locs: g ? [...g.locs] : [],
  });
}
const directCalls = totalCalls - aiCalls;

const uniqueCallers = byCaller.size;
const repeats = [...byCaller.entries()].filter(([, g]) => g.count >= 2);
const repeatCallers = repeats.length;
const repeatAttempts = repeats.reduce((s, [, g]) => s + (g.count - 1), 0);

// Split repeat callers into likely patients vs likely providers.
let providerRepeaters = 0, patientRepeaters = 0, patientRepeatAttempts = 0;
for (const [num, g] of repeats) {
  if (isProvider(num, g.name)) providerRepeaters++;
  else { patientRepeaters++; patientRepeatAttempts += g.count - 1; }
}

// Deflection proxy. A "request on file" = the caller left >=1 VM/callback. Among
// repeat callers with a request on file:
//   • duplicated  = left a 2nd+ VM/callback (vmcbCount >= 2)   -> NOT deflected
//   • deflected   = called back but added no 2nd VM/callback (vmcbCount == 1)
// Deflection rate = deflected / (deflected + duplicated). Split out AI-handled,
// since that is the only population the AI can act on.
// Attempt-level: among callers who already had a request on file (vmcbCount>=1),
// count the repeat CALLS that did NOT add a new VM/callback = deflected attempts.
// Everything is tracked twice: ALL callers, and PATIENTS only (excluding the
// name/list-flagged provider offices, which call about many different patients so
// a number match there is not a duplicate and is never deflected live).
let deflected = 0, duplicated = 0, deflectedAttempts = 0;
let pDeflected = 0, pDuplicated = 0, pDeflectedAttempts = 0;
for (const [num, g] of repeats) {
  const patient = !isProvider(num, g.name);
  if (g.vmcbCount === 1) { deflected++; if (patient) pDeflected++; }
  else if (g.vmcbCount >= 2) { duplicated++; if (patient) pDuplicated++; }
  if (g.vmcbCount >= 1) {
    const att = Math.max(0, g.count - g.vmcbCount);
    deflectedAttempts += att;
    if (patient) pDeflectedAttempts += att;
  }
}
// Duplicates actually created (2nd+ VM/callback per number), across all callers.
let patientDuplicatesCreated = 0;
for (const [num, g] of byCaller) {
  if (!isProvider(num, g.name)) patientDuplicatesCreated += Math.max(0, g.vmcbCount - 1);
}
const rate = (a, b) => (a + b ? ((a / (a + b)) * 100).toFixed(0) : '—') + '%';

const dist = {};
for (const [, g] of byCaller) { const k = g.count >= 4 ? '4+' : String(g.count); dist[k] = (dist[k] || 0) + 1; }
const pct = (n, dd) => (dd ? ((n / dd) * 100).toFixed(1) : '0.0') + '%';

console.log(`\n=== Repeat-caller baseline — ${DOMAIN} ===`);
console.log(`Window: ${start.toLocaleString()}  ->  ${now.toLocaleString()}`);
console.log(`(CDR legs scanned: ${legs.length}; new-call gap: ${gapMs / 60000} min)`);
if (truncated) console.log('⚠️  A 2-hour chunk hit the 1000-record cap — some calls may be missed. Narrow the window or chunk size.');
console.log('');
console.log(`Distinct inbound calls:        ${totalCalls}  (all via the 4 published AI lines)`);
console.log(`  (AI transfer legs onward to front-desk/scheduling/billing/auth: ${transferLegs})`);
console.log(`Unique caller numbers:         ${uniqueCallers}`);
console.log(`Repeat callers (2+ calls):     ${repeatCallers}  (${pct(repeatCallers, uniqueCallers)} of callers)`);
console.log(`Repeat attempts (beyond 1st):  ${repeatAttempts}  (${pct(repeatAttempts, totalCalls)} of all calls)`);
console.log(`  likely patients:   ${patientRepeaters} repeat callers, ${patientRepeatAttempts} repeat attempts`);
console.log(`  likely providers:  ${providerRepeaters} repeat callers (flagged by name/list)\n`);
console.log('Voicemails / callbacks left:');
console.log(`  Total VM/callback events:                       ${[...byCaller.values()].reduce((s, g) => s + g.vmcbCount, 0)}`);
console.log(`  Callers who left one:                           ${[...byCaller.values()].filter((g) => g.vmcbCount >= 1).length}`);
console.log(`  Duplicate VMs/callbacks created (2nd+ per num):  ${duplicatesCreated} all  |  ${patientDuplicatesCreated} patients-only\n`);
console.log('Deflection (proxy — callers who already had a request on file):');
console.log('  (Providers are NEVER deflected live — the Provider Gate excludes them. They');
console.log('   appear here only because the CDR proxy can\'t see intent; PATIENTS-ONLY is the real figure.)');
console.log(`  Callers deflected / duplicated — ALL:           ${deflected} / ${duplicated}   (rate ${rate(deflected, duplicated)})`);
console.log(`  Callers deflected / duplicated — PATIENTS-ONLY: ${pDeflected} / ${pDuplicated}   (rate ${rate(pDeflected, pDuplicated)})`);
console.log(`  Duplicate ATTEMPTS deflected (all | patients):  ${deflectedAttempts} | ${pDeflectedAttempts}`);
console.log(`  Duplicate ATTEMPTS slipped   (all | patients):  ${duplicatesCreated} | ${patientDuplicatesCreated}\n`);
console.log('Calls-per-number distribution:');
for (const k of ['1', '2', '3', '4+']) console.log(`  ${k} call${k === '1' ? '' : 's'}: ${dist[k] || 0} numbers`);
console.log(`\nTop repeat callers (>= ${minList} calls):`);
for (const [num, g] of repeats.filter(([, g]) => g.count >= minList).sort((a, b) => b[1].count - a[1].count).slice(0, 25)) {
  const tag = isProvider(num, g.name) ? '  [provider?]' : (g.aiLine ? `  [${g.locs.join(',')}]` : '  [direct]');
  console.log(`  ${String(g.count).padStart(2)}x  ${num}  vm/cb:${g.vmcbCount}  ${(g.name || '').slice(0, 22).padEnd(22)}${tag}`);
}
console.log('');

// --- CSV output (logs/ is gitignored — these contain PHI) ---
mkdirSync(logsDir, { recursive: true });
const runAt = now.toISOString();
const ds = runAt.slice(0, 16).replace(/[-:T]/g, '');
const stamp = `${ds.slice(0, 8)}-${ds.slice(8)}`;
const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

const summaryCsv = path.join(logsDir, 'repeat-callers-summary.csv');
if (!existsSync(summaryCsv)) {
  writeFileSync(summaryCsv, 'run_at,window_start,window_end,total_calls,unique_callers,repeat_callers,patient_repeaters,provider_repeaters,duplicates_created,duplicates_patients,deflected,duplicated,deflected_patients,duplicated_patients,deflected_attempts,deflected_attempts_patients\n');
}
appendFileSync(summaryCsv, [runAt, start.toISOString(), now.toISOString(), totalCalls, uniqueCallers, repeatCallers, patientRepeaters, providerRepeaters, duplicatesCreated, patientDuplicatesCreated, deflected, duplicated, pDeflected, pDuplicated, deflectedAttempts, pDeflectedAttempts].join(',') + '\n');

const detailCsv = path.join(logsDir, `repeat-callers-${stamp}.csv`);
const rows = ['caller,name,calls,vm_cb,classification,line'];
for (const [num, g] of [...byCaller.entries()].sort((a, b) => b[1].count - a[1].count)) {
  const line = g.aiLine ? g.locs.join('|') || 'AI' : 'direct';
  rows.push([num, esc(g.name), g.count, g.vmcbCount, isProvider(num, g.name) ? 'provider?' : 'patient?', line].join(','));
}
writeFileSync(detailCsv, rows.join('\n') + '\n');

console.log(`Saved trend row → ${path.relative(process.cwd(), summaryCsv)}`);
console.log(`Saved run detail → ${path.relative(process.cwd(), detailCsv)}\n`);
