# First Choice Imaging — Voice Agent Variables Reference

> **Version:** 3.5
> **Last Updated:** March 4, 2026
> **Applies To:** Logan MRI Clinic, Central Hub, All Locations

---

## Variable Naming Convention

All variables follow the pattern: `{{contact.variable_name}}`

- Use lowercase with underscores for multi-word names
- **All variables use the `contact.` prefix** for webhook payload delivery
- **Intent-specific variables are additionally prefixed** by intent (`records_`, `billing_`, `lien_`) to support multi-intent calls
- Variables are stored during the call and extracted via **Retell AI Post-Call Analysis**
- Extracted data is delivered via webhook to GHL workflows

> **See also:** [RetellPostCallAnalysisFields.md](RetellPostCallAnalysisFields.md) for Retell AI configuration details.

---

## Universal Variables (All Call Types)

These variables are collected early in every call, regardless of intent.

| Variable | Data Type | Description | Example |
|----------|-----------|-------------|---------|
| `{{contact.caller_name}}` | `string` | Full name of the person making the call | "Jane Doe" |
| `{{contact.caller_phone}}` | `string` | Phone number of caller | "435-555-1234" |
| `{{contact.intents_handled}}` | `string` (CSV) | Completed workflows during this call — values: "records", "billing", "lien" | "records,billing" |
| `{{contact.sms_consent}}` | `enum` | Whether caller consented to SMS status updates | "YES" or "NO" |

---

## Medical Record Request Variables

Collected when a caller requests medical records or a radiology report. The agent first identifies the caller type (patient/representative, provider, or attorney), then asks non-attorney callers whether they want a medical records transfer or a radiology report.

| Variable | Data Type | Description | Required | Example |
|----------|-----------|-------------|----------|---------|
| `{{contact.records_caller_type}}` | `enum` | Caller category: "patient" (includes parent/guardian and third party), "provider", or "attorney" | Always | "patient" |
| `{{contact.records_request_type}}` | `enum` | Type of request: "medical_records" or "radiology_report" | Always | "medical_records" |

> **Note:** Attorneys are automatically set to `records_caller_type` = "attorney" and `records_request_type` = "medical_records" (they do not get the radiology report option). Attorneys requesting a lien are routed to the Lien workflow instead.

---

## Billing Inquiry Variables (prefix: `billing_`)

Collected when caller has questions about bills, payments, or statements.

| Variable | Data Type | Description | Required | Example |
|----------|-----------|-------------|----------|---------|
| `{{contact.billing_patient_name}}` | `string` | Full name of the patient | Always | "Jane Doe" |
| `{{contact.billing_patient_dob}}` | `string` (YYYY-MM-DD) | Patient's date of birth | Always | "1985-03-15" |
| `{{contact.billing_reason}}` | `string` | Reason for the billing inquiry | Always | "Question about bill amount" |

---

## Lien Request Variables (prefix: `lien_`)

Collected when an attorney calls to establish a direct lien (routed from the Attorney branch in Medical Records).

| Variable | Data Type | Description | Required | Example |
|----------|-----------|-------------|----------|---------|
| `{{contact.lien_patient_name}}` | `string` | Client/patient's full name | Always | "Sarah Johnson" |
| `{{contact.lien_patient_dob}}` | `string` (YYYY-MM-DD) | Client/patient's date of birth | Always | "1990-07-12" |
| `{{contact.lien_firm_name}}` | `string` | Name of the law firm | Always | "Smith & Associates" |
| `{{contact.lien_paralegal_name}}` | `string` | Paralegal or point of contact | Always | "Rachel Torres" |
| `{{contact.lien_callback_phone}}` | `string` | Best callback number for the firm — **auto-set from `caller_phone`** (not asked separately) | Always | "801-555-1234" |
| `{{contact.lien_clinic_location}}` | `string` | Clinic where patient was seen | Always | "Logan" |

---

## Variable Collection Summary by Intent

| Intent | Variables Collected |
|--------|---------------------|
| **Medical Records** | `contact.caller_name`, `contact.caller_phone`, `contact.records_caller_type`, `contact.records_request_type`, `contact.intents_handled`, `contact.sms_consent` |
| **Billing** | `contact.caller_name`, `contact.caller_phone`, `contact.billing_patient_name`, `contact.billing_patient_dob`, `contact.billing_reason`, `contact.intents_handled`, `contact.sms_consent` |
| **Lien** | `contact.caller_name`, `contact.caller_phone`, `contact.lien_patient_name`, `contact.lien_patient_dob`, `contact.lien_firm_name`, `contact.lien_paralegal_name`, `contact.lien_callback_phone`, `contact.lien_clinic_location`, `contact.intents_handled`, `contact.sms_consent` |
| **Scheduling** | `contact.caller_name`, `contact.caller_phone` *(then immediate transfer — no further collection)* |

---

## Data Pipeline

```
Voice Agent Prompt          Retell Post-Call Analysis       GHL Webhook           GHL Workflow
─────────────────           ────────────────────────        ───────────           ────────────
Ensures AI asks             Extracts variables from         Delivers data         Creates/updates
the right questions  ──▶    the call transcript      ──▶    to GHL         ──▶    contact & sends
                                                                                  email(s)
```

---

## Webhook Payload Examples

### Single Intent (Medical Records)

```json
{
  "contact.caller_name": "Jane Doe",
  "contact.caller_phone": "435-555-1234",
  "contact.intents_handled": "records",
  "contact.sms_consent": "YES",
  "contact.records_caller_type": "patient",
  "contact.records_request_type": "medical_records"
}
```

### Single Intent (Lien)

```json
{
  "contact.caller_name": "Rachel Torres",
  "contact.caller_phone": "801-555-1234",
  "contact.intents_handled": "lien",
  "contact.lien_patient_name": "Sarah Johnson",
  "contact.lien_patient_dob": "1990-07-12",
  "contact.lien_firm_name": "Smith & Associates",
  "contact.lien_paralegal_name": "Rachel Torres",
  "contact.lien_callback_phone": "801-555-1234",
  "contact.lien_clinic_location": "Logan",
  "contact.sms_consent": "YES"
}
```

### Multi-Intent (Records + Billing)

```json
{
  "contact.caller_name": "John Smith",
  "contact.caller_phone": "435-555-5678",
  "contact.intents_handled": "records,billing",
  "contact.records_caller_type": "patient",
  "contact.records_request_type": "radiology_report",
  "contact.billing_patient_name": "John Smith",
  "contact.billing_patient_dob": "1975-05-12",
  "contact.billing_reason": "Question about bill amount",
  "contact.sms_consent": "YES"
}
```

---

## Data Type Reference

| Data Type | Format | Validation Notes |
|-----------|--------|------------------|
| `string` | Free text | Max 255 characters recommended |
| `string` (YYYY-MM-DD) | `YYYY-MM-DD` | Standard date format, or approximate description |
| `enum` | Predefined values | Must match one of the specified values |
| `string` (CSV) | Comma-separated values | Free text, comma-separated list of completed intents |

---

*Document Version: 3.7*
*Last Updated: March 4, 2026*
