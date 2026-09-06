// Nightly repeat-caller / deflection summary — built to run as a Cloud Run JOB
// triggered by Cloud Scheduler (e.g. 11:55 PM America/Denver). It pulls the current
// local day's CDRs, computes the PATIENT-ONLY deflection metrics, and emails a
// plain-text summary. The email contains AGGREGATE COUNTS ONLY (no phone numbers,
// names, or transcripts) — so it is not PHI.
//
// Env it needs (set on the job):
//   TZ=America/Denver                 so "today" = the Mountain business day
//   NS_API_BASE, NS_DOMAIN            Net Sapiens (same as the bridge)
//   NS_API_KEY                        secret (same as the bridge)
//   EMAIL_MODE=smtp                   + SMTP_HOST/PORT/USER/PASS/FROM (same as attorney-intake)
//   REPORT_EMAIL=you@domain           recipient(s), comma-separated
//   REPORT_PROVIDERS=8778746385,...   optional: provider numbers to exclude from patient stats
//
// The analysis mirrors report-repeats.js (kept self-contained so the job has no
// dependency on the local logs/ dir or the CLI wrapper).
import './env.js';
import { nsGet, DOMAIN } from './nsClient.js';
import { normalize } from './lookup.js';
import { sendEmail } from './emailTransport.js';

const GAP_MS = 15 * 1000; // 15s: merges only near-simultaneous re-rings
const AI_LINES = new Map([
  ['4352589598', 'Logan'],
  ['4358821674', 'Tooele'],
  ['8015761290', 'Sandy'],
  ['4352756210', 'St. George'],
]);
const PROVIDER_HINTS =
  /\b(MEDICAL|CLINIC|HEALTH|HOSPITAL|CANCER|IMAGING|RADIOL|ORTHO|PEDIATR|DERM|FAMILY|FMLY|MED|CARE|CENTER|ASSOC|PLLC|LLC|INC|CORP|TELECOM|PHARMAC|SURG|URGENT|WELLNESS|THERAPY|CHIRO|DENTAL|VISION|CARDIO|NEURO|OBGYN|ONE CALL|PHYSIC)\b/;
const PROVIDERS = new Set(
  String(process.env.REPORT_PROVIDERS || '')
    .split(',')
    .map((s) => normalize(s.trim()))
    .filter((n) => n.length === 10)
);
const isProvider = (num, name) =>
  PROVIDERS.has(num) || PROVIDER_HINTS.test(String(name || '').toUpperCase());

const callerFromUri = (c) => {
  const m = String(c['call-orig-from-uri'] ?? '').match(/sip:\+?1?(\d{10})@/);
  return m ? m[1] : '';
};
const callerAny = (c) => {
  const u = callerFromUri(c);
  if (u.length === 10) return u;
  const cid = normalize(c['call-orig-caller-id'] ?? '');
  return cid.length === 10 ? cid : '';
};
const dialedDid = (c) => normalize(c['call-orig-request-user'] ?? '');
// Scheduling duplicate only: VM in mailbox 2002 or a scheduling callback. VMs on
// other lines (front desk / auth / billing) are a different matter, not a duplicate.
function isSchedulingVmcb(term, termUser) {
  if (/CallBack-Queue/.test(term)) return true;
  return /VMail/.test(term) && String(termUser ?? '') === '2002';
}

function collapse(times) {
  times.sort((a, b) => a - b);
  let n = 0, last = -Infinity;
  for (const t of times) { if (t - last > GAP_MS) n++; last = t; }
  return n;
}

async function fetchLegs(start, end) {
  const d = encodeURIComponent(DOMAIN);
  const legs = [];
  const CHUNK_MS = 2 * 3600e3;
  for (let t0 = start.getTime(); t0 < end.getTime(); t0 += CHUNK_MS) {
    const t1 = Math.min(t0 + CHUNK_MS, end.getTime());
    const res = await nsGet(`/domains/${d}/cdrs`, {
      'datetime-start': new Date(t0).toISOString(),
      'datetime-end': new Date(t1).toISOString(),
      limit: 1000,
    });
    const page = Array.isArray(res) ? res : res?.data ?? [];
    legs.push(...page);
  }
  return legs;
}

function analyze(legs) {
  // Inbound calls = dir "1" legs dialing one of the 4 published AI lines.
  const inbound = new Map(); // caller -> { times, name }
  for (const c of legs) {
    if (String(c['call-direction']) !== '1') continue;
    if (!AI_LINES.has(dialedDid(c))) continue;
    const caller = callerFromUri(c);
    if (caller.length !== 10) continue;
    const t = Date.parse(c['call-start-datetime'] ?? '');
    if (Number.isNaN(t)) continue;
    if (!inbound.has(caller)) inbound.set(caller, { times: [], name: '' });
    const g = inbound.get(caller);
    g.times.push(t);
    if (!g.name && c['call-orig-from-name']) g.name = c['call-orig-from-name'];
  }
  // Voicemails / callbacks left.
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

  let totalCalls = 0, uniqueCallers = 0, repeatCallers = 0;
  let pDeflected = 0, pDuplicated = 0, pDuplicatesCreated = 0, pDeflectedAttempts = 0;
  for (const [caller, g] of inbound) {
    uniqueCallers++;
    const count = collapse(g.times.slice());
    totalCalls += count;
    const vmcbCount = vmcb.has(caller) ? collapse(vmcb.get(caller).slice()) : 0;
    if (count >= 2) repeatCallers++;
    if (isProvider(caller, g.name)) continue; // patient-only from here
    pDuplicatesCreated += Math.max(0, vmcbCount - 1);
    if (count >= 2 && vmcbCount >= 1) {
      if (vmcbCount === 1) pDeflected++;
      else pDuplicated++;
      pDeflectedAttempts += Math.max(0, count - vmcbCount);
    }
  }
  const rate = pDeflected + pDuplicated
    ? Math.round((pDeflected / (pDeflected + pDuplicated)) * 100) : null;
  return { totalCalls, uniqueCallers, repeatCallers, pDeflected, pDuplicated, pDuplicatesCreated, pDeflectedAttempts, rate };
}

// --- run ---
const now = new Date();
const start = new Date(now);
start.setHours(0, 0, 0, 0); // local midnight (TZ=America/Denver on the job)
const dayLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

let legs = [];
let err = null;
try {
  legs = await fetchLegs(start, now);
} catch (e) {
  err = e.message;
}

const r = err ? null : analyze(legs);
const rateStr = r?.rate == null ? 'n/a' : `${r.rate}%`;
const subject = err
  ? `FCI deflection report — ${dayLabel} — ERROR`
  : `FCI deflection — ${dayLabel} — ${rateStr} patient deflection, ${r.pDuplicatesCreated} duplicates`;

const text = err
  ? `The nightly repeat-caller report failed to pull call data.\n\nError: ${err}\n\nWindow: ${start.toLocaleString()} -> ${now.toLocaleString()}`
  : [
      `First Choice Imaging — repeat-caller deflection summary`,
      `Day: ${dayLabel}  (window: 12:00 AM -> ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`,
      ``,
      `Inbound calls (via the 4 published AI lines): ${r.totalCalls}`,
      `Unique callers: ${r.uniqueCallers}   |   Repeat callers (2+): ${r.repeatCallers}`,
      ``,
      `PATIENT-ONLY (providers excluded):`,
      `  Deflection rate: ${rateStr}   (${r.pDeflected} deflected / ${r.pDuplicated} duplicated)`,
      `  Duplicate voicemails/callbacks created: ${r.pDuplicatesCreated}`,
      `  Duplicate attempts deflected: ${r.pDeflectedAttempts}`,
      ``,
      `Pre-fix baseline band (Aug 6/7/10): 85-96% deflection, ~0.8-1.9 duplicates per 100 calls.`,
      `CDR legs scanned: ${legs.length}. Aggregate counts only (no PHI).`,
    ].join('\n');

const to = String(process.env.REPORT_EMAIL || '').trim();
if (!to) {
  console.error('REPORT_EMAIL not set — printing instead of emailing:\n' + subject + '\n\n' + text);
} else {
  const res = await sendEmail({ to, fromName: 'FCI Deflection Report', subject, text });
  console.log(`[nightly-report] ${res.dryrun ? 'DRYRUN' : 'sent'} to ${to} | ${subject}`);
}
