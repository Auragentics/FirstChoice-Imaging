# Deploying the bridge to Google Cloud Run (HIPAA)

The bridge handles PHI, so the order matters: **accept the BAA before anything
touches real data.** Cloud Run is a HIPAA-eligible service under Google Cloud's
BAA.

Prereqs: the `gcloud` CLI installed and a Google Cloud project with billing on.

---

## 0. Accept the Google Cloud BAA (do this first)

In the Cloud Console: **Account/Organization → Compliance / Legal → Business
Associate Agreement**, and accept it for the account that owns this project.
Without this, nothing below is compliant.

## 1. Point gcloud at your project

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## 2. Enable the APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

## 3. Store the secrets in Secret Manager

Never pass the API key as a plain env var. Generate a strong shared secret first:

```bash
# a random 32-byte secret for the webhook header
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create the two secrets (paste the real values when prompted, or pipe them):

```bash
printf '%s' 'nsd_YOUR_ROTATED_KEY'      | gcloud secrets create ns-api-key   --data-file=-
printf '%s' 'YOUR_GENERATED_SECRET'     | gcloud secrets create bridge-secret --data-file=-
```

> Use the **rotated** Net Sapiens key here (the earlier one was exposed).

Grant the Cloud Run runtime service account read access:

```bash
PN=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
SA="${PN}-compute@developer.gserviceaccount.com"
for S in ns-api-key bridge-secret; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

## 4. Deploy

From the `netsapiens-bridge/` folder (it has the `Dockerfile`):

```bash
gcloud run deploy fci-netsapiens-bridge \
  --source . \
  --region us-west3 \
  --allow-unauthenticated \
  --min-instances 1 \
  --set-env-vars 'NS_API_BASE=https://api.ucaasnetwork.com/ns-api/v2,NS_DOMAIN=fci.36350.service,NS_QUEUE=2002,LOOKUP_TIMEOUT_MS=1500,LOOKBACK_HOURS=72,VM_CDR_WINDOW_MIN=15' \
  --set-secrets 'NS_API_KEY=ns-api-key:latest,BRIDGE_SHARED_SECRET=bridge-secret:latest'
```

Notes:
- **`us-west3`** is Salt Lake City — lowest latency for FCI. Change if you prefer.
- **`--allow-unauthenticated`** is required because Retell/GHL can't do Google IAM
  auth. The `BRIDGE_SHARED_SECRET` header is what actually protects the endpoint —
  that's why it must be strong.
- **`--min-instances 1`** keeps one instance warm so the live-call lookup doesn't
  eat a cold start. Costs a few dollars/month; worth it here.
- **`NS_MAILBOXES` is intentionally omitted** — the queue is the primary signal,
  the voicemail read came back empty/unconfirmed, and skipping it means we don't
  pull PHI transcriptions we aren't using. Re-add it once the correct mailbox
  extension is confirmed.

The command prints a service URL like
`https://fci-netsapiens-bridge-xxxxx-uw.a.run.app`.

## 5. Test it

```bash
URL=https://fci-netsapiens-bridge-xxxxx-uw.a.run.app
curl -s "$URL/health"

curl -s -X POST "$URL/lookup" \
  -H "x-bridge-secret: YOUR_GENERATED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"caller":"18665350905"}'
```

You should get `{"ok":true}` and a lookup verdict. A wrong/missing secret → 401.

## 6. Wire the voice AI

Point the Retell `check_repeat_caller` custom function at `<URL>/lookup` and set
its `x-bridge-secret` header to the same generated secret. See
`docs/voice-ai-integration.md`.

---

## Compliance checklist (steady state)

- [x] Google Cloud BAA accepted before real PHI.
- [x] Secrets in Secret Manager, not code or plain env vars.
- [x] TLS enforced (Cloud Run is HTTPS-only).
- [x] Minimum-necessary response (no transcripts/numbers returned; see `shape()`).
- [x] PHI-safe logging (`redact()` strips numbers from error logs).
- [x] Stateless — no PHI stored at rest, no database.
- [ ] Rotate the Net Sapiens key that was exposed earlier (do before go-live).
- [ ] Confirm BAAs exist with GHL, Retell, and Net Sapiens/Crexendo.

## Redeploying

Re-run the `gcloud run deploy` command. To change a secret value:

```bash
printf '%s' 'NEW_VALUE' | gcloud secrets versions add ns-api-key --data-file=-
# then redeploy so :latest is picked up
```
