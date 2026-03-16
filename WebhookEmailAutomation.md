# Webhook Email Automation Workflow

> **Purpose:** Route post-call webhook payloads to send intent-specific emails
> **Version:** 2.0
> **Last Updated:** March 3, 2026

---

## Overview

When a call ends, the voice agent triggers a webhook containing all collected variables. The `{{intents_handled}}` variable tells us which workflows were completed during the call, allowing us to send the appropriate emails.

**Key Concept:** A single call can trigger **multiple emails** if the caller addressed multiple intents (e.g., requested medical records AND had a billing question AND established a lien).

---

## Webhook Payload Structure

### Universal Variables (Always Present)

| Variable | Description | Example |
|----------|-------------|---------|
| `{{caller_name}}` | Caller's full name | "Jane Doe" |
| `{{caller_phone}}` | Caller's phone number | "435-555-1234" |
| `{{caller_email}}` | Caller's email address | "jane@example.com" |
| `{{intents_handled}}` | Comma-separated list of completed workflows | "records,billing" |

### SMS Consent Variable

| Variable | Description |
|----------|-------------|
| `{{sms_consent}}` | "YES" or "NO" — whether caller consented to text updates |

### Intent-Specific Variables

**Medical Records** (present when `intents_handled` contains "records"):
| Variable | Description |
|----------|-------------|
| `{{records_caller_type}}` | "patient" (includes parent/guardian, third party), "provider", or "attorney" |
| `{{records_request_type}}` | "medical_records" (records transfer) or "radiology_report" |

**Billing Inquiry** (present when `intents_handled` contains "billing"):
| Variable | Description |
|----------|-------------|
| `{{billing_patient_name}}` | Patient's full name |
| `{{billing_patient_dob}}` | Patient's date of birth |
| `{{billing_reason}}` | Reason for billing inquiry |

**Lien Request** (present when `intents_handled` contains "lien"):
| Variable | Description |
|----------|-------------|
| `{{lien_patient_name}}` | Client/patient's full name |
| `{{lien_patient_dob}}` | Client/patient's date of birth |
| `{{lien_firm_name}}` | Name of the law firm |
| `{{lien_paralegal_name}}` | Paralegal or point of contact |
| `{{lien_callback_phone}}` | Best callback number for the firm |
| `{{lien_clinic_location}}` | Clinic where patient was seen |

---

## Automation Logic

### Step 1: Receive Webhook

When the call ends, your automation receives the webhook payload containing all variables.

### Step 2: Parse `intents_handled`

Check the `{{intents_handled}}` variable to determine which emails to send.

```
Example values:
- "records"            → Send 1 email (Records)
- "billing"            → Send 1 email (Billing)
- "lien"               → Send 1 email (Lien)
- "records,billing"    → Send 2 emails (Records + Billing)
- "records,lien"       → Send 2 emails (Records + Lien)
```

### Step 3: Route to Email Templates

Based on the parsed intents, trigger the appropriate email(s):

| If `intents_handled` contains... | Send Email |
|----------------------------------|------------|
| `records` | Medical Records Request Email |
| `billing` | Billing Inquiry Email |
| `lien` | Lien Request Email |


### Step 4: Send Email(s)

Each email uses the corresponding prefixed variables.

---

## Email Templates

### Medical Records Request Email

**Subject (dynamic):**
- If `records_request_type` = `radiology_report`: `RADIOLOGY REPORT | {{caller_name}}`
- Otherwise: `MED RECORDS TRANSFER | {{caller_name}}`

**Body:**
```
MEDICAL RECORDS REQUEST

Caller Information:
- Name: {{caller_name}}
- Phone: {{caller_phone}}
- Email: {{caller_email}}

Request Details:
- Caller Type: {{records_caller_type}}
- Request Type: {{records_request_type}}

---
Call Summary and Transcription attached.
```

### Billing Inquiry Email

**Subject:** `BILLING INQUIRY | {{billing_patient_name}}`

**Body:**
```
BILLING INQUIRY

Caller Information:
- Name: {{caller_name}}
- Phone: {{caller_phone}}
- Email: {{caller_email}}

Patient Information:
- Patient Name: {{billing_patient_name}}
- Date of Birth: {{billing_patient_dob}}

Inquiry Details:
- Reason: {{billing_reason}}

---
Call Summary and Transcription attached.
```

### Lien Request Email

**Subject:** `LIEN REQUEST | {{lien_patient_name}}`

**Body:**
```
ATTORNEY LIEN REQUEST

Caller Information:
- Name: {{caller_name}}
- Phone: {{caller_phone}}
- Email: {{caller_email}}

Lien Details:
- Patient Name: {{lien_patient_name}}
- Patient DOB: {{lien_patient_dob}}
- Law Firm: {{lien_firm_name}}
- Paralegal/Contact: {{lien_paralegal_name}}
- Callback Phone: {{lien_callback_phone}}
- Clinic Location: {{lien_clinic_location}}

---
Call Summary and Transcription attached.
```

---

## Workflow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CALL ENDS                                       │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌────────────────────────┐                                │
│                    │   WEBHOOK TRIGGERED    │                                │
│                    │   (All variables sent) │                                │
│                    └────────────────────────┘                                │
│                                 │                                            │
│                                 ▼                                            │
│                    ┌────────────────────────┐                                │
│                    │  PARSE intents_handled │                                │
│                    └────────────────────────┘                                │
│                                 │                                            │
│           ┌─────────────────────┼─────────────────────┐                      │
│           ▼                     ▼                     ▼                      │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│   │ Contains     │     │ Contains     │     │ Contains     │                │
│   │ "records"?   │     │ "billing"?   │     │ "lien"?      │                │
│   └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                     │                     │                        │
│    YES  │                YES  │                YES  │                        │
│         ▼                     ▼                     ▼                        │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│   │ SEND RECORDS │     │ SEND BILLING │     │ SEND LIEN    │                │
│   │ EMAIL        │     │ EMAIL        │     │ EMAIL        │                │
│   │              │     │              │     │              │                │
│   │ Uses:        │     │ Uses:        │     │ Uses:        │                │
│   │ records_*    │     │ billing_*    │     │ lien_*       │                │
│   │ variables    │     │ variables    │     │ variables    │                │
│   └──────────────┘     └──────────────┘     └──────────────┘                │
│           │                     │                     │                      │
│           └─────────────────────┼─────────────────────┘                      │
│                                 ▼                                            │
│                    ┌────────────────────────┐                                │
│                    │   SEND SMS TO CALLER   │                                │
│                    │  (if sms_consent=YES)  │                                │
│                    └────────────────────────┘                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### Parsing `intents_handled`

The `{{intents_handled}}` variable is a comma-separated string. To check which emails to send:

**Pseudo-code:**
```
intents = split(intents_handled, ",")

if "records" in intents:
    send_records_email()

if "billing" in intents:
    send_billing_email()

if "lien" in intents:
    send_lien_email()
```

### GHL Workflow Implementation

In GoHighLevel, you can use conditional branches:

4. **Branch 3:** If `{{intents_handled}}` contains "lien" → Send Lien Request Email
5. **Final Step:** Send SMS confirmation to `{{caller_phone}}` (if `{{sms_consent}}` = YES)

### Email Destination

Configure your email destination based on your needs:
- Single inbox for all requests
- Separate inboxes per intent type
- Distribution list

---

## Example Scenarios

### Scenario 1: Single Intent (Medical Records Only)

**Webhook Payload:**
```json
{
  "caller_name": "Jane Doe",
  "caller_phone": "435-555-1234",
  "caller_email": "jane@example.com",
  "intents_handled": "records",
  "sms_consent": "YES",
  "records_caller_type": "patient",
  "records_request_type": "medical_records"
}
```

**Result:** 1 email sent (Medical Records Request)

---

### Scenario 2: Multi-Intent (Records + Billing)

**Webhook Payload:**
```json
{
  "caller_name": "John Smith",
  "caller_phone": "435-555-5678",
  "caller_email": "john@example.com",
  "intents_handled": "records,billing",
  "sms_consent": "YES",
  "records_caller_type": "provider",
  "records_request_type": "radiology_report",
  "billing_patient_name": "John Smith",
  "billing_patient_dob": "1975-05-12",
  "billing_reason": "Question about bill amount"
}
```

**Result:** 2 emails sent (Medical Records Request + Billing Inquiry)

---

### Scenario 3: Lien Request

**Webhook Payload:**
```json
{
  "caller_name": "Rachel Torres",
  "caller_phone": "801-555-1234",
  "caller_email": "rachel@smithlaw.com",
  "intents_handled": "lien",
  "sms_consent": "YES",
  "lien_patient_name": "Sarah Johnson",
  "lien_patient_dob": "1990-07-12",
  "lien_firm_name": "Smith & Associates",
  "lien_paralegal_name": "Rachel Torres",
  "lien_callback_phone": "801-555-1234",
  "lien_clinic_location": "Logan"
}
```

**Result:** 1 email sent (Lien Request)

---

*Document Version: 2.0*
*Last Updated: March 3, 2026*
