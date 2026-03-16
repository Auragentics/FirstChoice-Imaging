# First Choice Imaging — Voice Agent Variables Reference

> **Version:** 3.0
> **Last Updated:** February 27, 2026
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
| `{{contact.caller_email}}` | `string` | Email address of caller | "jane@example.com" |
| `{{contact.intents_handled}}` | `string` (comma-separated) | Completed workflows during this call | "records,billing" |
| `{{contact.sms_consent}}` | `enum` | Whether caller consented to SMS status updates | "YES" or "NO" |

---

## Medical Record Request Variables (prefix: `records_`)

Collected when caller requests copies of imaging records or reports.

| Variable | Data Type | Description | Required | Example |
|----------|-----------|-------------|----------|---------|
| `{{contact.records_caller_type}}` | `enum` | Relationship of caller to patient | Always | See enum values below |
| `{{contact.records_release_required}}` | `enum` | Whether a signed HIPAA release is required | Auto-set | "YES" or "NO" |
| `{{contact.records_patient_name}}` | `string` | Full name of the patient | Always | "Timmy Doe" |
| `{{contact.records_request_type}}` | `enum` | What the caller wants done with records | Patient/Guardian only | "transfer_to_provider" or "radiology_report" |
| `{{contact.records_patient_dob}}` | `string` (YYYY-MM-DD) | Patient's date of birth | Provider/Attorney/3rd Party only | "2015-05-05" |
| `{{contact.records_sms_link_sent}}` | `enum` | Whether the web form SMS link was texted | Always | "YES" or "NO" |

### Caller Type Enum Values & Release Logic

| Caller Type | `records_caller_type` Value | `records_release_required` |
|---|---|---|
| Patient themselves | `"patient"` | `"NO"` |
| Parent or legal guardian | `"parent_guardian"` | `"NO"` |
| Ordering provider (doctor who ordered imaging) | `"ordering_provider"` | `"NO"` |
| Non-ordering provider (different doctor) | `"non_ordering_provider"` | `"YES"` |
| Attorney / Law firm (records path) | `"attorney"` | `"YES"` |
| Any other third party | `"third_party"` | `"YES"` |

### Conditional Variable Logic

| Caller Type | Collects `records_request_type`? | Collects `records_patient_dob`? |
|---|---|---|
| Patient | Yes | No |
| Parent/Guardian | Yes | No |
| Ordering Provider | No | Yes |
| Non-Ordering Provider | No | Yes |
| Attorney | No | Yes |
| 3rd Party | No | Yes |

> **Note:** All callers are directed to the web form. `records_sms_link_sent` tracks whether they accepted the SMS link.

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
| `{{contact.lien_callback_phone}}` | `string` | Best callback number for the firm | Always | "801-555-1234" |
| `{{contact.lien_clinic_location}}` | `string` | Clinic where patient was seen | Always | "Logan" |

---

## Variable Collection Summary by Intent

| Intent | Variables Collected |
|--------|---------------------|
| **Medical Records** | `contact.caller_name`, `contact.caller_phone`, `contact.caller_email`, `contact.records_caller_type`, `contact.records_release_required`, `contact.records_patient_name`, `contact.records_request_type` (patient/guardian), `contact.records_patient_dob` (provider/attorney/3rd party), `contact.records_sms_link_sent`, `contact.intents_handled`, `contact.sms_consent` |
| **Billing** | `contact.caller_name`, `contact.caller_phone`, `contact.caller_email`, `contact.billing_patient_name`, `contact.billing_patient_dob`, `contact.billing_reason`, `contact.intents_handled`, `contact.sms_consent` |
| **Lien** | `contact.caller_name`, `contact.caller_phone`, `contact.caller_email`, `contact.lien_patient_name`, `contact.lien_patient_dob`, `contact.lien_firm_name`, `contact.lien_paralegal_name`, `contact.lien_callback_phone`, `contact.lien_clinic_location`, `contact.intents_handled`, `contact.sms_consent` |
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

### Single Intent (Medical Records — Patient)

```json
{
  "contact.caller_name": "Jane Doe",
  "contact.caller_phone": "435-555-1234",
  "contact.caller_email": "jane@example.com",
  "contact.intents_handled": "records",
  "contact.records_caller_type": "patient",
  "contact.records_release_required": "NO",
  "contact.records_patient_name": "Jane Doe",
  "contact.records_request_type": "transfer_to_provider",
  "contact.records_sms_link_sent": "YES",
  "contact.sms_consent": "YES"
}
```

### Single Intent (Medical Records — Non-Ordering Provider)

```json
{
  "contact.caller_name": "Dr. Office Staff",
  "contact.caller_phone": "435-555-9999",
  "contact.caller_email": "staff@clinic.com",
  "contact.intents_handled": "records",
  "contact.records_caller_type": "non_ordering_provider",
  "contact.records_release_required": "YES",
  "contact.records_patient_name": "Timmy Doe",
  "contact.records_patient_dob": "2015-05-05",
  "contact.records_sms_link_sent": "YES",
  "contact.sms_consent": "NO"
}
```

### Single Intent (Lien)

```json
{
  "contact.caller_name": "Rachel Torres",
  "contact.caller_phone": "801-555-1234",
  "contact.caller_email": "rachel@smithlaw.com",
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
  "contact.caller_email": "john@example.com",
  "contact.intents_handled": "records,billing",
  "contact.records_caller_type": "patient",
  "contact.records_release_required": "NO",
  "contact.records_patient_name": "John Smith",
  "contact.records_request_type": "radiology_report",
  "contact.records_sms_link_sent": "YES",
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

---

*Document Version: 3.0*
*Last Updated: February 27, 2026*
