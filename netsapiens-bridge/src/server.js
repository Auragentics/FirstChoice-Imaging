// Live webhook the Retell/GHL voice AI calls mid-conversation to check whether
// a caller has already left a voicemail / callback. Zero-dependency (node:http).
//
// Contract:
//   POST /lookup            body: { "caller": "4355551234" }
//   headers: x-bridge-secret: <BRIDGE_SHARED_SECRET>   (if the secret is set)
//   -> 200 { found, degraded, summary, counts, mostRecent, details }
//   GET  /health            -> 200 { ok: true }
//
// Two guarantees for a live phone call:
//   • Hard timeout (LOOKUP_TIMEOUT_MS) so we never stall the call.
//   • Fail-open: on timeout or any error we return found:false, degraded:true
//     so the AI just proceeds with the normal flow.
import './env.js';
import { createServer } from 'node:http';
import { lookupRepeatCaller, normalize } from './lookup.js';
import { validateIntake, formatEmail, incompleteBanner, fromName, routeTo } from './attorney.js';
import { sendEmail } from './emailTransport.js';

const PORT = Number(process.env.PORT || 8787);
const SECRET = process.env.BRIDGE_SHARED_SECRET || '';
const TIMEOUT_MS = Number(process.env.LOOKUP_TIMEOUT_MS || 1500);
const LOOKBACK_HOURS = Number(process.env.LOOKBACK_HOURS || 72);
// Fast-VM CDR signal window (minutes) — only covers the mailbox indexing lag.
const VM_CDR_WINDOW_MIN = Number(process.env.VM_CDR_WINDOW_MIN || 15);
const CALLBACK_WINDOW_MIN = Number(process.env.CALLBACK_WINDOW_MIN || 5);
const MAILBOXES = String(process.env.NS_MAILBOXES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const QUEUE = (process.env.NS_QUEUE || '').trim() || null;

// Strip anything phone-number-like and cap length, so PHI never lands in logs
// (Cloud Run streams stdout/stderr to Cloud Logging).
function redact(s) {
  return String(s).replace(/\d[\d\-.\s()]{6,}\d/g, '[redacted-number]').slice(0, 300);
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`lookup timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

/** Turn a raw verdict into a compact result the voice AI can act on. */
function shape(result) {
  const counts = {
    voicemails: result.voicemails.length,
    callbacks: result.callbacks.length,
    recentCalls: result.recentCalls.length,
  };
  const stamps = [
    ...result.voicemails.map((v) => v.at),
    ...result.recentCalls.map((c) => c.at),
  ].filter(Boolean).sort();
  const mostRecent = stamps[stamps.length - 1] || null;

  // Any source error means the answer isn't authoritative — flag it degraded
  // for monitoring. Behaviour stays fail-open: the AI proceeds normally.
  const degraded = result.errors.length > 0;

  // Deflect ONLY on a live wait-callback hold in the queue. We deliberately do
  // NOT treat a recent "Queue Callback" dispatch as an active hold: per the phone
  // system, the caller is dropped from the queue the instant the agent accepts
  // and the outbound call fires, and it is ONE-SHOT — no retry on no-answer / VM
  // / reject. So a dispatched callback is already SPENT; a caller ringing back
  // then needs to reach staff, and "you're still in line" would trap them (the
  // callback is not coming again). The live queue already drops them at dispatch,
  // which is exactly the right boundary. (result.recentCallbackDispatch is still
  // computed upstream for observability but must not drive deflection.)
  const callbackHold =
    result.callbacks.some((c) => /callback/i.test(c.status || ''));
  const liveHold = result.callbacks.some((c) => !/callback/i.test(c.status || ''));
  // The caller already left a scheduling voicemail. Two sources OR'd together:
  //   • the mailbox read found the recording, and
  //   • a recent CDR shows a VMail-to-scheduling-mailbox leg — which appears
  //     immediately, before the mailbox indexes it (closes the fast-re-call gap
  //     where a caller re-dials minutes after leaving a VM).
  const voicemailFound = result.voicemails.length > 0 || result.recentSchedulingVm === true;

  let summary;
  if (degraded && !result.found) {
    summary = 'Lookup incomplete — proceed with normal flow.';
  } else if (!result.found) {
    summary = 'No prior voicemail or callback found for this number.';
  } else if (callbackHold) {
    summary = 'This caller already requested a callback and is holding their place in line.';
  } else if (liveHold) {
    summary = 'This caller is currently waiting in the queue.';
  } else if (counts.voicemails || result.recentSchedulingVm) {
    summary = 'This caller already left a voicemail.';
  } else {
    summary = 'This number called recently but left no voicemail.';
  }

  // The name on the matched queue entry — a cross-check for the AI. If it looks
  // like a clinic/office (a provider calling about a patient), the AI should NOT
  // treat it as a duplicate even though the number matched.
  const matchedName = result.callbacks[0]?.name || null;

  // Minimum necessary (HIPAA): return only what the AI needs to act. Do NOT
  // return raw voicemail transcriptions, raw queue records, or the caller's
  // number back over the wire — just the verdict + one name for the guardrail.
  return {
    found: result.found,
    degraded,
    callbackHold,
    voicemailFound,
    matchedName,
    summary,
    counts,
    mostRecent,
  };
}

const server = createServer(async (req, res) => {
  // Parse path + query so a trailing ?debug=1 (or any query) still routes.
  const parsed = new URL(req.url, 'http://localhost');
  const path = parsed.pathname;
  const debug = parsed.searchParams.get('debug') === '1';

  if (req.method === 'GET' && path === '/health') {
    return send(res, 200, { ok: true });
  }

  if (req.method === 'POST' && path === '/lookup') {
    if (SECRET && req.headers['x-bridge-secret'] !== SECRET) {
      return send(res, 401, { error: 'unauthorized' });
    }

    let caller;
    let raw = '';
    try {
      raw = (await readBody(req)) || '{}';
      const body = JSON.parse(raw);
      caller = body.caller;
    } catch {
      if (debug) console.log(`[debug] unparseable body: ${raw}`);
      return send(res, 400, { error: 'invalid JSON body' });
    }

    // Debug (only when ?debug=1): log the exact body GHL sent, so we can see
    // which merge-field variables resolved. Off in production.
    if (debug) console.log(`[debug] raw body: ${raw}`);

    if (!caller) return send(res, 400, { error: 'missing "caller"' });

    try {
      const result = await withTimeout(
        lookupRepeatCaller({
          caller,
          mailboxes: MAILBOXES,
          queue: QUEUE,
          lookbackHours: LOOKBACK_HOURS,
          callbackWindowMin: CALLBACK_WINDOW_MIN,
          vmCdrWindowMin: VM_CDR_WINDOW_MIN,
        }),
        TIMEOUT_MS
      );
      const payload = shape(result);
      // Per-lookup trace (PHI-safe: last-4 only) so a missed deflection can be
      // diagnosed from logs — did we get the number, and what did we return?
      console.log(
        `[lookup] last4=${normalize(caller).slice(-4) || 'none'} ` +
          `vm=${payload.voicemailFound} cb=${payload.callbackHold} degraded=${payload.degraded}`
      );
      // Recognition counter (no PHI — type only): log when the AI is told the
      // caller already has a request, so preventions can be measured from logs.
      if (payload.callbackHold || payload.voicemailFound) {
        const kinds = [payload.callbackHold && 'callback', payload.voicemailFound && 'voicemail']
          .filter(Boolean).join('+');
        console.log(`[detect] recognized: ${kinds}`);
      }
      if (debug) payload.receivedLast4 = normalize(caller).slice(-4) || '(empty)';
      return send(res, 200, payload);
    } catch (err) {
      // Fail-open: never block the call on a slow/broken lookup.
      console.error(`[lookup] degraded: ${redact(err.message)}`);
      return send(res, 200, {
        found: false,
        degraded: true,
        summary: 'Lookup unavailable — proceed with normal flow.',
        counts: { voicemails: 0, callbacks: 0, recentCalls: 0 },
        mostRecent: null,
        ...(debug ? { receivedLast4: normalize(caller).slice(-4) || '(empty)' } : {}),
      });
    }
  }

  if (req.method === 'POST' && path === '/attorney-intake') {
    if (SECRET && req.headers['x-bridge-secret'] !== SECRET) {
      return send(res, 401, { error: 'unauthorized' });
    }

    let payload;
    try {
      payload = JSON.parse((await readBody(req)) || '{}');
    } catch {
      return send(res, 400, { error: 'invalid JSON body' });
    }

    const check = validateIntake(payload);

    // Default (in-call): if the data isn't clean yet, report what to re-ask and
    // send NOTHING — the AI fixes it on the call, then fires again. Also covers
    // an explicit validate_only pre-check.
    if (payload.validate_only || (!check.ok && !payload.force)) {
      return send(res, 200, { ok: check.ok, missing: check.missing, invalid: check.invalid, message: check.message });
    }

    // Clean (or force=true for a post-call send): email staff. A forced but
    // incomplete send is flagged with the ⚠️ INCOMPLETE banner.
    try {
      const type = payload.type === 'lien' ? 'lien' : 'records';
      const { subject, text } = formatEmail(payload, incompleteBanner(check));
      const result = await sendEmail({ to: routeTo(type), fromName: fromName(type), subject, text });
      return send(res, 200, {
        ok: true,
        sent: result.sent,
        dryrun: result.dryrun ?? false,
        incomplete: !check.ok,
        message: 'Request routed to our records team.',
      });
    } catch (err) {
      console.error(`[attorney-intake] send failed: ${redact(err.message)}`);
      return send(res, 502, { ok: false, message: 'Could not route the request — please try again or transfer to staff.' });
    }
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`FCI Net Sapiens bridge listening on :${PORT}`);
  console.log(`  mailboxes: ${MAILBOXES.join(', ') || '(none)'}  queue: ${QUEUE || '(none)'}`);
  console.log(`  timeout: ${TIMEOUT_MS}ms  lookback: ${LOOKBACK_HOURS}h  auth: ${SECRET ? 'on' : 'off'}`);
});
