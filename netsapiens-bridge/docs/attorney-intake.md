# Attorney intake → staff email (`/attorney-intake`)

Replaces the flaky GHL email automation for attorney records/lien requests.

**Default flow is IN-CALL:** a Voice AI custom action POSTs the collected data to
the bridge at the end of the records/lien workflow. The bridge validates it and,
when clean, emails staff in FCI's format via Auragentics Workspace SMTP. If data
is missing/garbled it returns what to re-ask, so the AI fixes it *on the call* —
which is why summary/transcript aren't needed (their purpose was a garble
fallback, now handled at the source). This removes the GHL email automation and
the post-call workflow entirely.

**Optional post-call mode** (`force:true`): a GHL post-call workflow can send the
email WITH duration/summary/transcript (which only exist after the call). Kept as
an option; not the default.

## Endpoint

```
POST https://fci-bridge-114119212314.us-west3.run.app/attorney-intake
Header: x-bridge-secret: <bridge-secret>

Body (lien):
{"type":"lien","caller_name":"{{contact.caller_name}}","caller_phone":"{{contact.caller_phone}}",
 "caller_email":"{{contact.lien_caller_email}}","patient_name":"{{contact.lien_patient_name}}",
 "patient_dob":"{{contact.lien_patient_dob}}","firm_name":"{{contact.lien_firm_name}}",
 "attorney_name":"{{contact.lien_attorney_name}}","paralegal_name":"{{contact.lien_paralegal_name}}",
 "callback_phone":"{{contact.lien_callback_phone}}","clinic_location":"{{contact.lien_clinic_location}}",
 "duration":"{{voice_ai.duration}}","summary":"{{voice_ai.summary}}","transcript":"{{chatgpt.2.response}}"}

Body (records): same shape with type="records", records_* vars,
 "request_type":"{{contact.records_request_type}}", and NO clinic_location.
```

Behavior:
- **Incomplete (default)** → returns `{ ok:false, missing, invalid, message }`,
  sends nothing. The AI re-asks and fires again.
- **Clean** → sends the email, returns `{ ok:true, sent }`.
- `validate_only:true` → report only, never send.
- `force:true` → send regardless (post-call use), flagging gaps with a
  `⚠️ INCOMPLETE` banner.

## Routing & From

| Type | Destination (prod) | From name |
|------|--------------------|-----------|
| records | `medicalrecords@firstchoice-imaging.com` | AI Voice Agent Medical Records Request |
| lien | `office@firstchoice-imaging.com` | AI Voice Agent - Lien Request |

- **From address:** `noreply@auragentics.ai` (a verified send-as alias on the SMTP account).
- **Testing:** set `INTAKE_EMAIL_OVERRIDE` to route ALL mail to one inbox; clear it for production.

## SMTP setup (one-time)

On the sending account (`brianlrandall@auragentics.ai`): enable 2-Step
Verification, generate an **App Password** → that's `SMTP_PASS`. `noreply@auragentics.ai`
must be a verified "Send mail as" alias on that account.

## Env / secrets (Cloud Run)

Env vars: `EMAIL_MODE=smtp`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`,
`SMTP_USER=brianlrandall@auragentics.ai`, `SMTP_FROM=noreply@auragentics.ai`,
`INTAKE_EMAIL_RECORDS`, `INTAKE_EMAIL_LIEN`, and (testing only) `INTAKE_EMAIL_OVERRIDE`.
Secret: `SMTP_PASS` (Secret Manager).

## GHL wiring (in-call, default)

A **Voice AI custom action** (same mechanism as `check_repeat_caller`):
- Fires at the end of the records/lien workflow.
- POSTs the collected fields (no analytics/transcript) to the endpoint.
- The prompt handles the response: if `missing`/`invalid`, re-ask those items and
  fire again; if `ok`, confirm to the caller.

Use one action per type (records, lien), or one action with `type` set per path.

**Post-call option:** to include analytics/transcript, add a post-call GHL
workflow whose Webhook posts the full body (incl. `duration`/`summary`/
`transcript`) with `"force": true`.
