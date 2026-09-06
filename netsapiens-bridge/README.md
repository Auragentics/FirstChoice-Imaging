# FCI Net Sapiens Bridge

Bridges the First Choice Imaging voice AI (Retell via GHL) to the **Net Sapiens API**
so the AI can detect, *live on the call*, whether a caller has already left a
voicemail or callback — and avoid spawning a duplicate request.

This repo starts with a **probe**: a read-only script that authenticates with your
API key and shows what the real instance returns. It proves feasibility and reveals
the exact field shapes before we build the live webhook + MCP server.

## What it does

Two signals, combined into one verdict (`src/lookup.js`):

1. **Voicemail** — reads the `new` folder of the scheduling/front-desk mailboxes and
   matches the caller's number against `NmsAni`.
2. **CDR search** — domain-wide search by caller number over a lookback window
   (catches callbacks / missed calls even when no voicemail was left).

## Setup

Requires Node 18+.

```bash
cd netsapiens-bridge
cp .env.example .env
# edit .env with the 4 values below
```

`.env` fields:

| Var | What | Notes |
|-----|------|-------|
| `NS_API_BASE` | API base incl. version prefix, no trailing slash | e.g. `https://core1.yourprovider.com/ns-api/v2` — **get the exact host from your VoIP manager** |
| `NS_API_KEY` | Full 60-char domain key | starts with `nsd_` |
| `NS_DOMAIN` | tenant/domain name | `~` = the key's own domain |
| `NS_MAILBOXES` | mailbox extensions that receive callback VMs | comma-separated, e.g. `1001,1002` |

## Run the probe

```bash
# Basic verdict for a caller:
npm run probe -- --caller 4355551234

# Field-discovery mode (dumps the first raw voicemail + CDR object):
npm run probe -- --caller 4355551234 --mailbox 1001 --raw
```

Use a number you *know* recently called and left a voicemail, so we can confirm the
match works end to end.

## Two things still needed

1. **`NS_API_BASE`** — the exact API host for FCI's Net Sapiens/Crexendo instance.
2. **`NS_MAILBOXES`** — which mailbox extension(s) actually receive the
   scheduling/front-desk callback voicemails.

## Live webhook (for the Retell/GHL custom function)

```bash
npm start          # boots the bridge on PORT (default 8787)
```

Contract:

```
POST /lookup   body: { "caller": "4355551234" }
               header: x-bridge-secret: <BRIDGE_SHARED_SECRET>   (if set)
  -> 200 { found, degraded, summary, counts, mostRecent, details }
GET  /health   -> 200 { ok: true }
```

Two guarantees for a live call: a hard `LOOKUP_TIMEOUT_MS` cap so it never stalls
the call, and **fail-open** — on timeout or error it returns `found:false,
degraded:true` so the AI just proceeds normally.

## Tests

```bash
npm test           # offline; injects a fake client, no key needed
```

## Roadmap

- [x] Net Sapiens client + repeat-caller lookup (`nsClient.js`, `lookup.js`)
- [x] Probe / discovery CLI (`probe.js`) — supports `--queue`
- [x] Live HTTP endpoint for the Retell/GHL custom function (fail-open, timeout cap)
- [x] Offline test suite (`test/lookup.test.js`)
- [ ] Confirm field shapes against the live instance (run `probe --raw`)
- [ ] Pin down queued-call field names (see `queueCallerOf` in `lookup.js`) once
      the VoIP manager sends a sample from queue 2002
- [ ] Optional MCP server (same client) for the dashboard + Claude tooling
