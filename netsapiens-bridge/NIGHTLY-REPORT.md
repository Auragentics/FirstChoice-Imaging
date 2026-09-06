# Nightly deflection report — Cloud Run Job + Cloud Scheduler

Runs `src/nightly-report.js` every night at **11:55 PM America/Denver**, pulls the
day's CDRs, and **emails an aggregate patient-deflection summary** (counts only —
no PHI). Runs in the cloud, independent of any local machine.

Reuses the existing bridge image (same `Dockerfile`), the `ns-api-key` secret, and
the same SMTP setup the attorney-intake feature uses.

Prereqs: `gcloud` authenticated (`gcloud auth login`) and pointed at the project
(`gcloud config set project fci-integrations-504618`).

---

## 1. Enable the APIs (once)

```bash
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com
```

## 2. Make sure the SMTP password is in Secret Manager

The job sends email via SMTP, so it needs the sending account's **app password**.
If the bridge already has it as a secret, reuse that name below. Otherwise create it:

```bash
printf '%s' 'YOUR_SMTP_APP_PASSWORD' | gcloud secrets create smtp-pass --data-file=-
# grant the runtime SA read access
gcloud secrets add-iam-policy-binding smtp-pass \
  --member="serviceAccount:114119212314-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 3. Deploy the job

From `netsapiens-bridge/` (it has the `Dockerfile`). Note the `^##^` prefix — it
tells gcloud to split env vars on `##` instead of comma, so the comma-separated
`REPORT_PROVIDERS` list survives.

```bash
gcloud run jobs deploy fci-nightly-report \
  --source . \
  --region us-west3 \
  --command node \
  --args src/nightly-report.js \
  --set-env-vars "^##^TZ=America/Denver##NS_API_BASE=https://api.ucaasnetwork.com/ns-api/v2##NS_DOMAIN=fci.36350.service##EMAIL_MODE=smtp##SMTP_HOST=smtp.gmail.com##SMTP_PORT=465##SMTP_USER=brianlrandall@auragentics.ai##SMTP_FROM=noreply@auragentics.ai##REPORT_EMAIL=brianlrandall@auragentics.ai##REPORT_PROVIDERS=8778746385,2086126100" \
  --set-secrets "NS_API_KEY=ns-api-key:latest,SMTP_PASS=smtp-pass:latest"
```

- **`REPORT_EMAIL`** — change to whoever should receive it (comma-separate for several).
- **`REPORT_PROVIDERS`** — provider numbers to exclude from the patient stats
  (keep it in sync with `logs/known-providers.txt`).

### Test it once (fires immediately, no waiting for 10 PM)

```bash
gcloud run jobs execute fci-nightly-report --region us-west3
```

Check your inbox for the summary, and the logs:

```bash
gcloud run jobs executions list --job fci-nightly-report --region us-west3
```

## 4. Schedule it for 11:55 PM Mountain nightly

Grant Cloud Scheduler permission to run the job, then create the schedule:

```bash
gcloud run jobs add-iam-policy-binding fci-nightly-report \
  --region us-west3 \
  --member="serviceAccount:114119212314-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker"

gcloud scheduler jobs create http fci-nightly-report-trigger \
  --location us-west3 \
  --schedule "55 23 * * *" \
  --time-zone "America/Denver" \
  --uri "https://us-west3-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/fci-integrations-504618/jobs/fci-nightly-report:run" \
  --http-method POST \
  --oauth-service-account-email "114119212314-compute@developer.gserviceaccount.com"
```

Verify / trigger the schedule manually:

```bash
gcloud scheduler jobs list --location us-west3
gcloud scheduler jobs run fci-nightly-report-trigger --location us-west3
```

---

## Notes
- **Window:** the report covers **12:00 AM → 11:55 PM Mountain** (the run time) — the
  full calendar day, including late-night after-hours voicemails. (For a
  business-day-only view instead, use `0 22 * * *` = 10 PM.)
- **No PHI:** the email is aggregate counts only. The per-caller detail CSV that the
  local `report-repeats.js` writes is NOT produced or sent by the job.
- **To change the report/recipient/providers:** edit env vars with
  `gcloud run jobs update fci-nightly-report --region us-west3 --update-env-vars ...`
  (use the same `^##^` delimiter trick if a value contains commas).
- **To change the code:** edit `src/nightly-report.js`, then re-run the
  `gcloud run jobs deploy ...` command in step 3.
