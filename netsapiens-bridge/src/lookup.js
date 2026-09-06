// Repeat-caller lookup: given a caller's number, decide whether they've
// already left a voicemail, requested a callback (in-queue), or called
// recently. This is the exact logic the live Retell webhook calls — keep it
// self-contained and side-effect free.
//
// The Net Sapiens calls are injected via `client` so this can be unit-tested
// offline with fixtures (see test/lookup.test.js).
import * as ns from './nsClient.js';

const defaultClient = {
  readVoicemails: ns.readVoicemails,
  searchCdrs: ns.searchCdrs,
  readQueuedCalls: ns.readQueuedCalls,
};

/** Reduce any phone string to its last 10 digits for reliable matching. */
export function normalize(num) {
  const digits = String(num || '').replace(/\D/g, '');
  return digits.slice(-10);
}

function hoursAgoISO(hours, now = new Date()) {
  return new Date(now.getTime() - hours * 3600 * 1000).toISOString();
}

// Queued-call field names, confirmed against a live queue-2002 sample. The
// caller's number/name live in the dial-rule-translation-source-* fields; the
// UI "Waiting for Callback" / "Dispatching" status is
// callqueue-agent-availability-for-dispatch. Fallbacks kept for safety.
function queueCallerOf(entry) {
  return (
    entry?.['dial-rule-translation-source-user'] ??
    entry?.NmsAni ?? entry?.ani ?? entry?.callerid ?? ''
  );
}
function queueNameOf(entry) {
  return (
    entry?.['dial-rule-translation-source-name'] ??
    entry?.cnam ?? entry?.orig_from_name ?? ''
  );
}
function queueStatusOf(entry) {
  return (
    entry?.['callqueue-agent-availability-for-dispatch'] ??
    entry?.status ?? entry?.state ?? ''
  );
}
function queueTimeOf(entry) {
  return entry?.time_queued ?? entry?.entered ?? entry?.timestamp ?? '';
}

/**
 * @param {object} opts
 * @param {string}   opts.caller        the current caller's number
 * @param {string[]} [opts.mailboxes]   mailbox extensions to scan for voicemails
 * @param {string}   [opts.queue]       call-queue extension to scan for callback holds
 * @param {number}   [opts.lookbackHours=72]   VM presence cap (days-ish) + CDR history window
 * @param {number}   [opts.vmCdrWindowMin=15]  fast-VM CDR signal window (minutes)
 * @param {object}   [opts.client]      injected NS calls (defaults to real client)
 * @returns {Promise<object>}
 */
export async function lookupRepeatCaller({
  caller,
  mailboxes = [],
  queue = null,
  lookbackHours = 72,
  callbackWindowMin = 30,
  vmCdrWindowMin = 15,
  client = defaultClient,
}) {
  const target = normalize(caller);

  // Fail safe: a short/empty number means the caller value didn't resolve (e.g.
  // an unresolved "{{contact.phone}}"). Never run an unfiltered search — the CDR
  // filter would be dropped and match EVERY recent call. Return a clean no-match.
  if (target.length < 10) {
    return {
      found: false,
      caller: target,
      voicemails: [],
      callbacks: [],
      recentCalls: [],
      recentCallbackDispatch: false,
      recentSchedulingVm: false,
      errors: ['caller number missing or invalid'],
    };
  }

  const start = hoursAgoISO(lookbackHours);
  const end = new Date().toISOString();

  const voicemails = [];
  const callbacks = [];
  const recentCalls = [];
  const errors = [];
  // A recent "Queue Callback" CDR = a callback that was DISPATCHED. NOTE: the
  // phone system drops the caller from the queue the instant the agent accepts /
  // the outbound fires, and it is one-shot (no retry). So this flag means the
  // callback is already SPENT, not "in flight" — it is NO LONGER used to deflect
  // (see server.js shape()); retained only for observability/logging.
  let recentCallbackDispatch = false;
  // Fast VM signal (see cdrTask): true when a recent CDR shows this caller left a
  // scheduling voicemail, even before the mailbox listing indexes the recording.
  let recentSchedulingVm = false;
  const callbackCutoff = Date.now() - callbackWindowMin * 60 * 1000;

  // All three signal groups run CONCURRENTLY — on a live call, total latency
  // must be ~the slowest single request, not the sum. Each task catches its own
  // errors (fail-soft) so one slow/broken source never rejects the whole lookup.

  // 1. Voicemails (PRESENCE-BASED): a new VM lands in "new", the email-notify
  //    moves it to "trash", and staff DELETE it once they handle the request —
  //    so a VM still sitting in new/trash means the request is still PENDING.
  //    (We do NOT scan "save"; those are intentionally-kept old messages.) We
  //    therefore deflect on presence, capped by lookbackHours (~3 days) purely
  //    as a safety net against a straggler a scheduler forgot to clear.
  const VM_FOLDERS = ['new', 'trash'];
  const vmCutoff = Date.now() - lookbackHours * 3600 * 1000;
  const vmSeen = new Set();
  const voicemailTask = Promise.all(
    mailboxes.flatMap((mailbox) =>
      VM_FOLDERS.map(async (folder) => {
        try {
          const vms = await client.readVoicemails(mailbox, folder);
          const list = Array.isArray(vms) ? vms : vms?.data ?? [];
          for (const vm of list) {
            const from = vm['voicemail-from-caller-id-number'] ?? vm['voicemail-from-user'] ?? '';
            if (normalize(from) !== target) continue;
            const at = vm['recorded-datetime'] ?? '';
            const t = Date.parse(at);
            if (!Number.isNaN(t) && t < vmCutoff) continue; // too old
            const key = vm.filename || `${normalize(from)}|${at}`;
            if (vmSeen.has(key)) continue; // de-dup across folders
            vmSeen.add(key);
            voicemails.push({
              mailbox,
              folder,
              from,
              name: vm['voicemail-from-name'] ?? '',
              at,
              seconds: Number(vm['file-duration-seconds'] ?? 0),
              transcription: vm['file-script-text'] ?? '',
            });
          }
        } catch (err) {
          errors.push(`voicemail ${mailbox}/${folder}: ${err.message}`);
        }
      })
    )
  );

  // 2. Call queue: if this queue holds callback requests, match on caller.
  const queueTask = (async () => {
    if (!queue) return;
    try {
      const q = await client.readQueuedCalls(queue);
      const list = Array.isArray(q) ? q : q?.data ?? [];
      for (const entry of list) {
        if (normalize(queueCallerOf(entry)) === target) {
          callbacks.push({
            queue,
            from: queueCallerOf(entry),
            name: queueNameOf(entry),
            status: queueStatusOf(entry),
            at: queueTimeOf(entry),
          });
        }
      }
    } catch (err) {
      errors.push(`queue ${queue}: ${err.message}`);
    }
  })();

  // 3. CDRs: recent calls from this number (catches missed / callback too).
  const cdrTask = (async () => {
    try {
      const cdrs = await client.searchCdrs({ caller: target, start, end });
      const list = Array.isArray(cdrs) ? cdrs : cdrs?.data ?? [];
      for (const c of list) {
        const at = c['call-start-datetime'] ?? '';
        const disposition = c['call-disconnect-reason-text'] ?? '';
        recentCalls.push({ at, disposition, seconds: Number(c['call-total-duration-seconds'] ?? 0) });
        if (/queue callback/i.test(disposition)) {
          const t = Date.parse(at);
          if (!Number.isNaN(t) && t >= callbackCutoff) recentCallbackDispatch = true;
        }
        // Fast VM signal: a scheduling voicemail leg (VMail -> a scanned mailbox,
        // e.g. 2002) appears in the CDR immediately, before the mailbox listing
        // indexes the recording. Catches a caller who re-calls within minutes of
        // leaving a scheduling VM, when the mailbox read would still return empty.
        if (
          /VMail/i.test(String(c['call-term-to-uri'] ?? '')) &&
          mailboxes.includes(String(c['call-term-user'] ?? ''))
        ) {
          // Only the last few minutes: this signal exists solely to bridge the
          // mailbox indexing lag (a just-left VM is definitely still pending).
          // Beyond that, the mailbox presence check is authoritative — so an
          // already-handled/cleared VM never re-deflects via a stale CDR leg.
          const t = Date.parse(at);
          if (!Number.isNaN(t) && t >= Date.now() - vmCdrWindowMin * 60 * 1000) {
            recentSchedulingVm = true;
          }
        }
      }
    } catch (err) {
      errors.push(`cdr search: ${err.message}`);
    }
  })();

  await Promise.all([voicemailTask, queueTask, cdrTask]);

  return {
    found: voicemails.length > 0 || callbacks.length > 0 || recentCalls.length > 0,
    caller: target,
    voicemails,
    callbacks,
    recentCalls,
    recentCallbackDispatch,
    recentSchedulingVm,
    errors,
  };
}
