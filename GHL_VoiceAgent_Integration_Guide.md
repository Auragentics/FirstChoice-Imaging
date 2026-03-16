# GHL Voice Agent — Email Workflow Integration Guide

> **Purpose:** This guide documents how to configure GoHighLevel (GHL) to send **structured data emails to First Choice Imaging staff** after your AI voice agent collects caller information. These emails feed data into the staff's CRM/EHR system.
> **Version:** 3.0
> **Last Updated:** March 3, 2026

---

## Overview

When the voice agent completes a call involving **Medical Records**, **Billing**, or **Lien** inquiries, the following automated pipeline runs:

1. **Retell AI Post-Call Analysis** extracts variables from the call transcript
2. **Webhook fires** (`call_analyzed` event) delivering extracted data to GHL
3. **GHL Workflow** creates/updates a contact, branches on `intents_handled`, and sends the appropriate email(s)
4. **SMS confirmation** is sent to the caller

> **See also:** [RetellPostCallAnalysisFields.md](RetellPostCallAnalysisFields.md) for Retell AI configuration.

---

## Part 1: Staff Intake Email Templates

> These emails go to First Choice Imaging staff. The structured format allows easy copy/paste or automated parsing into CRM/EHR.

### 1.1 Medical Records Request — Staff Intake

**To:** `orders@firstchoice-imaging.com`
**Subject (dynamic):**
- If `records_request_type` = `radiology_report`: `RADIOLOGY REPORT | {{contact.full_name}}`
- Otherwise: `MED RECORDS TRANSFER | {{contact.full_name}}`

**Body:**
```
MEDICAL RECORDS REQUEST
TIMESTAMP: {{current_date_time}}

--- CALLER ---
Caller Name: {{contact.full_name}}
Caller Phone: {{contact.phone}}
Caller Email: {{contact.email}}

--- REQUEST DETAILS ---
Caller Type: {{contact.records_caller_type}}
Request Type: {{contact.records_request_type}}

--- CALL DATA ---
Summary: {{contact.call_summary}}
Duration: {{contact.call_duration}}
```

> **Caller Type values:** `patient` (includes parent/guardian and third party), `provider` (healthcare provider), `attorney` (law firm)
> **Request Type values:** `medical_records` (records transfer) or `radiology_report`

---

### 1.2 Billing Inquiry — Staff Intake

**To:** `orders@firstchoice-imaging.com`
**Subject:** `BILLING INQUIRY | {{contact.billing_patient_name}}`

**Body:**
```
BILLING INQUIRY
TIMESTAMP: {{current_date_time}}

--- CALLER ---
Caller Name: {{contact.full_name}}
Caller Phone: {{contact.phone}}
Caller Email: {{contact.email}}

--- PATIENT ---
Patient Name: {{contact.billing_patient_name}}
Patient DOB: {{contact.billing_patient_dob}}

--- BILLING DETAILS ---
Reason: {{contact.billing_reason}}

--- CALL DATA ---
Summary: {{contact.call_summary}}
Duration: {{contact.call_duration}}
```

---

### 1.3 Lien Request — Staff Intake

**To:** `orders@firstchoice-imaging.com`
**Subject:** `LIEN REQUEST | {{contact.lien_patient_name}}`

**Body:**
```
ATTORNEY LIEN REQUEST
TIMESTAMP: {{current_date_time}}

--- CALLER ---
Caller Name: {{contact.full_name}}
Caller Phone: {{contact.phone}}
Caller Email: {{contact.email}}

--- LIEN DETAILS ---
Patient Name: {{contact.lien_patient_name}}
Patient DOB: {{contact.lien_patient_dob}}
Law Firm: {{contact.lien_firm_name}}
Paralegal/Contact: {{contact.lien_paralegal_name}}
Callback Phone: {{contact.lien_callback_phone}}
Clinic Location: {{contact.lien_clinic_location}}

--- CALL DATA ---
Summary: {{contact.call_summary}}
Duration: {{contact.call_duration}}
```

---

### 1.4 Caller Confirmation SMS Templates

**Medical Records SMS (conditional):**
```
# If records_request_type = "radiology_report":
Hi {{contact.first_name}}, thank you for contacting First Choice Imaging. Here is the link to request your radiology report: [RADIOLOGY_REPORT_LINK]. Questions? Call (435) 258-9598.

# If records_request_type = "medical_records":
Hi {{contact.first_name}}, thank you for contacting First Choice Imaging. Here is the link to submit your medical records transfer request: [RECORDS_TRANSFER_LINK]. Questions? Call (435) 258-9598.
```

**Billing SMS:**
```
Hi {{contact.first_name}}, thank you for your billing inquiry with First Choice Imaging. Our billing team has received your information and will follow up shortly. Questions? Call (435) 258-9598.
```

**Lien SMS:**
```
Hi {{contact.first_name}}, thank you for contacting First Choice Imaging regarding the lien request. Our team has received your information and will follow up with your office shortly. Questions? Call (435) 258-9598.
```

---

## Part 2: Custom Fields Required in GHL

Before workflows can use these templates, create these **Custom Contact Fields** in GHL:

### Universal Fields
| Field Name | Field ID (suggested) | Type |
|------------|---------------------|------|
| Intents Handled | `intents_handled` | Single-line Text |
| SMS Consent | `sms_consent` | Dropdown: YES, NO |

### Medical Records Fields
| Field Name | Field ID (suggested) | Type |
|------------|---------------------|------|
| Records - Caller Type | `records_caller_type` | Dropdown: patient, provider, attorney |
| Records - Request Type | `records_request_type` | Dropdown: medical_records, radiology_report |

### Billing Fields
| Field Name | Field ID (suggested) | Type |
|------------|---------------------|------|
| Billing - Patient Name | `billing_patient_name` | Single-line Text |
| Billing - Patient DOB | `billing_patient_dob` | Single-line Text |
| Billing - Reason | `billing_reason` | Multi-line Text |

### Lien Fields
| Field Name | Field ID (suggested) | Type |
|------------|---------------------|------|
| Lien - Patient Name | `lien_patient_name` | Single-line Text |
| Lien - Patient DOB | `lien_patient_dob` | Single-line Text |
| Lien - Firm Name | `lien_firm_name` | Single-line Text |
| Lien - Paralegal Name | `lien_paralegal_name` | Single-line Text |
| Lien - Callback Phone | `lien_callback_phone` | Single-line Text |
| Lien - Clinic Location | `lien_clinic_location` | Single-line Text |

---

## Part 3: Webhook Configuration

### 3.1 Webhook Event Type

> **CRITICAL:** Configure the webhook to fire on `call_analyzed` (not `call_ended`). Post-Call Analysis fields are only available after Retell finishes analyzing the transcript.

### 3.2 GHL Webhook Field Mapping

After receiving the webhook, map the Retell Post-Call Analysis fields to GHL contact fields:

| Webhook Field | GHL Contact Field | Notes |
|--------------|-------------------|-------|
| `caller_name` | Full Name | Split first/last if needed |
| `caller_phone` | Phone | |
| `caller_email` | Email | |
| `intents_handled` | Custom: `intents_handled` | **Critical** — used for If/Else branching (values: records, billing, lien) |
| `sms_consent` | Custom: `sms_consent` | YES or NO |
| `records_caller_type` | Custom: `records_caller_type` | patient, provider, or attorney |
| `records_request_type` | Custom: `records_request_type` | medical_records or radiology_report |
| `billing_patient_name` | Custom: `billing_patient_name` | |
| `billing_patient_dob` | Custom: `billing_patient_dob` | |
| `billing_reason` | Custom: `billing_reason` | |
| `lien_patient_name` | Custom: `lien_patient_name` | |
| `lien_patient_dob` | Custom: `lien_patient_dob` | |
| `lien_firm_name` | Custom: `lien_firm_name` | |
| `lien_paralegal_name` | Custom: `lien_paralegal_name` | |
| `lien_callback_phone` | Custom: `lien_callback_phone` | |
| `lien_clinic_location` | Custom: `lien_clinic_location` | |

---

## Part 4: GHL Workflow Logic

### 4.1 Workflow Structure

```
┌─────────────────────────────────────────────┐
│  TRIGGER: Inbound Webhook (call_analyzed)   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  ACTION: Find or Create Contact             │
│  Match by: Phone Number                     │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  ACTION: Update Contact Custom Fields       │
│  Map webhook data to contact fields         │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  IF/ELSE: intents_handled CONTAINS?         │
│  (Use "contains" — NOT "equals")            │
└─────────────────────────────────────────────┘
    │                │                │
    ▼                ▼                ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Contains   │ │ Contains   │ │ Contains   │
│ "records"  │ │ "billing"  │ │ "lien"     │
│     ↓      │ │     ↓      │ │     ↓      │
│ Send Rec   │ │ Send Bill  │ │ Send Lien  │
│ Email(1.1) │ │ Email(1.2) │ │ Email(1.3) │
└────────────┘ └────────────┘ └────────────┘
    │                │                │
    └────────────────┼────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  ACTION: Send SMS (to caller)               │
│  Use appropriate template (1.4)             │
│  (Only if sms_consent = YES)                │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  ACTION: Add Tag                            │
│  Tag: "AI Voice Agent Inquiry"              │
└─────────────────────────────────────────────┘
```

> **KEY:** All three If/Else branches run independently. A multi-intent call (e.g., `"records,billing"`) triggers **both** matching branches, sending **two** separate emails.

### 4.2 Staff Email Recipient

| Request Type | Send To |
|--------------|---------|
| Medical Records | `orders@firstchoice-imaging.com` |
| Billing | `orders@firstchoice-imaging.com` |
| Lien | `orders@firstchoice-imaging.com` |

> The subject line prefix (MED RECORDS TRANSFER / RADIOLOGY REPORT, BILLING INQUIRY, LIEN REQUEST) allows staff to filter/sort by request type.

---

## Part 5: Testing Checklist

- [ ] Create all custom fields in GHL (Part 2)
- [ ] Configure Retell Post-Call Analysis fields (see RetellPostCallAnalysisFields.md)
- [ ] Verify webhook fires on `call_analyzed` event
- [ ] Verify GHL workflow maps webhook fields to contact fields
- [ ] Verify If/Else uses "contains" on `intents_handled`
- [ ] Test with a live call:
  - [ ] Medical Records request → 1 email to orders@ (verify caller type + request type)
  - [ ] Billing inquiry → 1 email to orders@
  - [ ] Lien request → 1 email to orders@
  - [ ] Multi-intent call → correct number of emails to orders@
- [ ] Verify contact record created with correct custom fields
- [ ] Verify SMS confirmation received by caller (only if sms_consent = YES)

---

*Document Version: 3.0*
*Last Updated: March 3, 2026*
