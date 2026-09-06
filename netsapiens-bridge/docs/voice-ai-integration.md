# Voice AI ↔ Bridge integration (repeat-caller check)

How the Retell/GHL voice agent calls the bridge live, mid-call, to detect a
caller who's already in the queue (holding a callback) and avoid creating a
duplicate.

## When it fires

At the **scheduling gate** — after the Provider Gate confirms a patient and the
intent is scheduling (especially "did my callback go through / where am I in
line" or a new booking). Fire it **before** transferring to the queue, so we can
short-circuit if they're already holding a spot.

Do NOT fire it on every call — only scheduling-related intents. That keeps
lookups targeted (~57% of calls) instead of ~500/day.

It **also** fires in the **after-hours branch**: when the clinic is closed the
scheduling queue is off and callers go straight to voicemail, so the callback
signal doesn't exist — the check runs to catch `voicemailFound` ("we already have
your voicemail from earlier"). Same provider rule applies (below).

### PROVIDER EXCLUSION (critical — do not skip)

**Only run this check for confirmed PATIENTS.** Provider / doctor's-office callers
must NEVER be run through it, and must NEVER be told "you're already in line" *or*
"we already have your voicemail."

Why: the bridge matches on **phone number only**. A provider office calls from the
same number about *different patients* all day (e.g., `GRANGER MEDICAL` is literally
in queue 2002 right now). A number match there is NOT a duplicate — it's a
different patient/request. Providers are transferred to the front desk regardless,
so the check is both unnecessary and harmful for them. Note the voicemail path has
**no `matchedName` guardrail** (that's populated only from the callback/queue
match), so after hours the provider gate is the *only* thing protecting them —
gating there is mandatory, not optional.

Rule (applies to BOTH the business-hours scheduling gate AND the after-hours
branch): provider / doctor's office → straight to `Receptionist`, no lookup, no
deflection. Confirmed patient → then (and only then) `check_repeat_caller`.

## The endpoint contract

```
POST  https://<BRIDGE_HOST>/lookup
Header: x-bridge-secret: <BRIDGE_SHARED_SECRET>
Body:   { "caller": "<inbound caller number>" }

200 →
{
  "found": true,
  "degraded": false,
  "callbackHold": true,        // already requested a callback, holding place
  "matchedName": "GRANGER MEDICAL",  // name on the matched entry (provider guardrail)
  "summary": "This caller already requested a callback and is holding their place in line.",
  "counts": { "voicemails": 0, "callbacks": 1, "recentCalls": 4 },
  "mostRecent": "2026-08-05T16:36:34+00:00"
}
```

The response is **PHI-minimized**: it returns the verdict, counts, and one name
for the guardrail — never voicemail transcripts, raw queue records, or the
caller's number.

Guarantees: hard timeout (`LOOKUP_TIMEOUT_MS`, default 900 ms) and **fail-open** —
on error/timeout it returns `found:false, degraded:true`, so the AI just proceeds
with the normal flow. Never blocks the call.

## Retell / GHL custom function config

| Field | Value |
|---|---|
| **Name** | `check_repeat_caller` |
| **Description** | "Check whether this caller is already waiting in the scheduling queue or has a pending callback, so we don't create a duplicate. Call this when a patient asks about scheduling, a callback, or where they are in line — before transferring to Scheduling." |
| **Speak During Execution** | ON — message: *"Let me check on that real quick…"* |
| **Method** | `POST` |
| **URL** | `https://<BRIDGE_HOST>/lookup` |
| **Headers** | `x-bridge-secret: <BRIDGE_SHARED_SECRET>` |
| **Parameters (JSON schema)** | see below |
| **Timeout** | ~2500 ms (the bridge caps its own work at 1500 ms; signals run concurrently) |

**Parameters schema:**
```json
{
  "type": "object",
  "properties": {
    "caller": {
      "type": "string",
      "description": "The caller's phone number (the inbound caller ID)."
    }
  },
  "required": ["caller"]
}
```

**Mapping the caller number:** map your platform's inbound-ANI variable into
`caller`. In Retell that's the call's from-number dynamic variable; through GHL it
may be the contact phone. Confirm the exact variable name in your setup and bind
it so `caller` is filled automatically — don't ask the patient to read their
number.

## How the AI uses the result

Only reached for confirmed patients (see PROVIDER EXCLUSION above).

- `callbackHold: true` → *"Good news — you already requested a callback and you're
  holding your place in line. There's no need to call back or request another one;
  a scheduler will reach you. Is there anything else I can help with?"* → do NOT
  transfer, do NOT create a new request.
- `voicemailFound: true` (mainly the after-hours branch) → *"We already have your
  voicemail from earlier, and a specialist will get back to you within one business
  day — no need to leave another message."* → do NOT send them to leave another VM.
- `found: true` but `callbackHold: false` (recent calls only, no active hold) →
  acknowledge and proceed normally (offer to transfer / take the request).
- `found: false` or `degraded: true` → proceed with the normal scheduling flow.

Note on `callbackHold`: it reflects only a **live wait-callback hold in the
queue**. A callback that was already *dispatched* is deliberately NOT treated as a
hold — the caller is dropped from the queue at dispatch and it's one-shot (no
retry), so a caller ringing back then needs to reach staff, not be told to wait.

**Second guardrail — `matchedName`:** the name on the matched queue entry. If it
reads like a clinic or office rather than the patient in front of you (a provider
who slipped past the gate calling about a different patient), treat it as NOT a
duplicate and proceed normally. Number match + mismatched identity = different
request.

## Prerequisite: hosting

The bridge currently runs locally. Before the voice AI can call it, it needs a
**public HTTPS URL** on a **HIPAA-compliant, BAA-covered host** (it handles PHI —
queue caller identity, voicemail transcriptions). Set `BRIDGE_SHARED_SECRET` in
production and put the same value in the custom-function header.
