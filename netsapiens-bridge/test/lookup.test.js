// Offline tests for the repeat-caller matching logic. No network, no key —
// injects a fake Net Sapiens client with fixtures. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, lookupRepeatCaller } from '../src/lookup.js';

// A fake client whose responses mimic the shapes the docs describe. Numbers are
// deliberately formatted differently to prove normalization works.
function fakeClient({ voicemails = [], queued = [], cdrs = [] } = {}) {
  return {
    readVoicemails: async () => voicemails,
    readQueuedCalls: async () => queued,
    searchCdrs: async () => cdrs,
  };
}

test('normalize strips formatting down to last 10 digits', () => {
  assert.equal(normalize('+1 (435) 555-1234'), '4355551234');
  assert.equal(normalize('14355551234'), '4355551234');
  assert.equal(normalize('435.555.1234'), '4355551234');
  assert.equal(normalize(''), '');
});

test('matches a voicemail despite different number formatting', async () => {
  const client = fakeClient({
    voicemails: [
      { 'voicemail-from-caller-id-number': '1-435-555-1234', 'recorded-datetime': '2026-08-05T14:00:00Z', 'file-duration-seconds': 22, 'file-script-text': 'please call me back' },
      { 'voicemail-from-caller-id-number': '4355559999', 'recorded-datetime': '2026-08-05T13:00:00Z' },
    ],
  });
  const r = await lookupRepeatCaller({ caller: '(435) 555-1234', mailboxes: ['2002'], lookbackHours: 1e7, client });
  assert.equal(r.found, true);
  assert.equal(r.voicemails.length, 1);
  assert.equal(r.voicemails[0].seconds, 22);
});

test('voicemail: recent trash VM matches, stale one excluded, no dupes', async () => {
  const recent = new Date(Date.now() - 3600 * 1000).toISOString(); // 1h ago
  const client = {
    // trash holds recent VMs after the email-notify moves them out of "new"
    readVoicemails: async (_mb, folder) =>
      folder === 'trash'
        ? [
            { 'voicemail-from-caller-id-number': '18017928495', 'recorded-datetime': recent, filename: 'a.wav' },
            { 'voicemail-from-caller-id-number': '18017928495', 'recorded-datetime': '2026-01-01T00:00:00Z', filename: 'b.wav' },
          ]
        : [],
    readQueuedCalls: async () => [],
    searchCdrs: async () => [],
  };
  const r = await lookupRepeatCaller({ caller: '(801) 792-8495', mailboxes: ['2002'], lookbackHours: 72, client });
  assert.equal(r.found, true);
  assert.equal(r.voicemails.length, 1); // recent kept, months-old excluded
  assert.equal(r.voicemails[0].folder, 'trash');
});

test('matches a callback held in the queue (real field names)', async () => {
  const client = fakeClient({
    queued: [
      {
        'dial-rule-translation-source-user': '18015296615',
        'dial-rule-translation-source-name': 'VOLT,HEIDI',
        'callqueue-agent-availability-for-dispatch': 'waiting for callback',
        time_queued: '2026-08-05 16:06:52',
      },
      { 'dial-rule-translation-source-user': '4355550000' },
    ],
  });
  const r = await lookupRepeatCaller({ caller: '(801) 529-6615', queue: '2002', client });
  assert.equal(r.found, true);
  assert.equal(r.callbacks.length, 1);
  assert.equal(r.callbacks[0].name, 'VOLT,HEIDI');
  assert.equal(r.callbacks[0].status, 'waiting for callback');
});

test('matches a recent CDR when no voicemail exists', async () => {
  const client = fakeClient({
    cdrs: [{ 'call-start-datetime': '2026-08-05T12:00:00Z', 'call-disconnect-reason-text': 'Caller Abandoned', 'call-total-duration-seconds': 40 }],
  });
  const r = await lookupRepeatCaller({ caller: '4355551234', client });
  assert.equal(r.found, true);
  assert.equal(r.recentCalls.length, 1);
});

test('returns found:false for an unknown caller', async () => {
  const client = fakeClient({
    voicemails: [{ NmsAni: '4355559999' }],
    queued: [{ ani: '4355558888' }],
    cdrs: [],
  });
  const r = await lookupRepeatCaller({ caller: '4355551234', mailboxes: ['2002'], queue: '2002', client });
  assert.equal(r.found, false);
  assert.equal(r.errors.length, 0);
});

test('recent Queue Callback dispatch flags within window; old one does not', async () => {
  const mk = (mins) => new Date(Date.now() - mins * 60 * 1000).toISOString();
  const base = { readVoicemails: async () => [], readQueuedCalls: async () => [] }; // NOT in queue
  const recent = await lookupRepeatCaller({
    caller: '4355551234', queue: '2002', callbackWindowMin: 30,
    client: { ...base, searchCdrs: async () => [{ 'call-start-datetime': mk(5), 'call-disconnect-reason-text': 'Spawn: Queue Callback' }] },
  });
  assert.equal(recent.recentCallbackDispatch, true);

  const old = await lookupRepeatCaller({
    caller: '4355551234', queue: '2002', callbackWindowMin: 30,
    client: { ...base, searchCdrs: async () => [{ 'call-start-datetime': mk(120), 'call-disconnect-reason-text': 'Spawn: Queue Callback' }] },
  });
  assert.equal(old.recentCallbackDispatch, false);
});

test('CDR fast-VM signal: VMail to a scanned mailbox flags recentSchedulingVm; other lines do not', async () => {
  const base = { readVoicemails: async () => [], readQueuedCalls: async () => [] }; // mailbox read still empty (not yet indexed)
  const now = new Date().toISOString();
  // A scheduling voicemail (mailbox 2002) shows in the CDR immediately.
  const sched = await lookupRepeatCaller({
    caller: '4355551234', mailboxes: ['2002'],
    client: { ...base, searchCdrs: async () => [{ 'call-start-datetime': now, 'call-term-to-uri': 'VMail', 'call-term-user': '2002' }] },
  });
  assert.equal(sched.recentSchedulingVm, true);

  // A voicemail on a DIFFERENT line (front desk 2004) is a different matter — not flagged.
  const fd = await lookupRepeatCaller({
    caller: '4355551234', mailboxes: ['2002'],
    client: { ...base, searchCdrs: async () => [{ 'call-start-datetime': now, 'call-term-to-uri': 'VMail', 'call-term-user': '2004' }] },
  });
  assert.equal(fd.recentSchedulingVm, false);
});

test('empty/unresolved caller fails safe (no unfiltered search)', async () => {
  let cdrCalled = false;
  const client = {
    readVoicemails: async () => [],
    readQueuedCalls: async () => [{ 'dial-rule-translation-source-user': '4355551234' }],
    searchCdrs: async () => { cdrCalled = true; return [{ 'call-start-datetime': 'x' }]; },
  };
  // Simulates an unresolved "{{contact.phone}}" (no digits).
  const r = await lookupRepeatCaller({ caller: '{{contact.phone}}', queue: '2002', client });
  assert.equal(r.found, false);
  assert.equal(r.recentCalls.length, 0);
  assert.equal(cdrCalled, false); // never queried the API with an empty filter
});

test('one failing source does not sink the whole lookup (fail-soft)', async () => {
  const client = {
    readVoicemails: async () => { throw new Error('mailbox boom'); },
    readQueuedCalls: async () => [{ ani: '4355551234' }],
    searchCdrs: async () => [],
  };
  const r = await lookupRepeatCaller({ caller: '4355551234', mailboxes: ['2002'], queue: '2002', client });
  assert.equal(r.found, true); // queue still matched
  assert.equal(r.callbacks.length, 1);
  assert.ok(r.errors.length >= 1); // the mailbox error(s) reported, not thrown
});
