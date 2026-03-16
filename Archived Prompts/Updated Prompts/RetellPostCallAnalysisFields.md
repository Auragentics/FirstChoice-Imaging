# Retell AI — Post-Call Analysis Field Definitions

> **Purpose:** Configure these fields in your Retell AI agent's **Post-Call Analysis** section so that call data is extracted from transcripts and delivered in the webhook payload to GHL.
> **Version:** 1.1
> **Last Updated:** February 27, 2026

---

## How This Works

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Voice Agent │     │ Retell Post-Call  │     │  GHL Inbound    │     │  GHL Workflow │
│  Prompt      │────▶│ Analysis Fields   │────▶│  Webhook        │────▶│  Email Action │
│              │     │                   │     │                 │     │              │
│ (Ensures the │     │ (Extracts data    │     │ (Delivers       │     │ (Uses contact │
│  conversation│     │  from transcript) │     │  extracted data) │     │  fields to    │
│  captures    │     │                   │     │                 │     │  populate     │
│  the data)   │     │                   │     │                 │     │  email body)  │
└──────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘
```

> [!IMPORTANT]
> The prompt tells the AI *what to ask*. The Post-Call Analysis fields tell Retell *what to extract* from the transcript. **Both must be configured** for variables to reach your GHL workflow.

---

## How To Add These Fields

1. Open your **Retell AI agent** dashboard
2. Navigate to the **Post-Call Analysis** section (sometimes labeled "Custom Analysis")
3. For each field below, click **Add Custom Field**
4. Set the **Name**, **Type**, and **Description** exactly as shown
5. The Description acts as an extraction prompt — it tells Retell's AI what to look for in the transcript

> [!TIP]
> The Description/Prompt for each field is the most important part. Be specific and give Retell clear instructions on exactly what to extract and in what format.

---

## Field Definitions

### Routing Variable

| Field Name | Type | Extraction Prompt |
|---|---|---|
| `intents_handled` | **Text** | *"What request types were handled during this call? Return a comma-separated list using only these values: `medical_records`, `billing`, `lien`. If the caller only had a medical records request, return `medical_records`. If only billing, return `billing`. If an attorney lien was established, return `lien`. If multiple were discussed, return them comma-separated (e.g., `medical_records,billing` or `medical_records,lien`). If neither was discussed (e.g., general info, scheduling transfer), return empty string."* |

> [!IMPORTANT]
> This is the **critical routing variable**. Your GHL workflow's If/Else branch checks this value to determine which email template(s) to send.

---

### Universal Caller Variables

These should be extracted on **every call**.

| Field Name | Type | Extraction Prompt |
|---|---|---|
| `caller_name` | **Text** | *"What is the full name of the person who called? Extract their first and last name as provided."* |
| `caller_phone` | **Text** | *"What phone number did the caller provide when asked for the best number to reach them? Return digits only in format like 435-555-1234."* |
| `caller_email` | **Text** | *"What email address did the caller provide? If no email was given, return empty."* |

---

### Medical Records Variables

These are only populated when `intents_handled` contains `medical_records`.

| Field Name | Type | Extraction Prompt |
|---|---|---|
| `records_caller_type` | **Selector** | *"What is the caller's relationship to the patient for the medical records request?"* **Options:** `patient`, `parent_guardian`, `ordering_provider`, `non_ordering_provider`, `attorney`, `third_party` |
| `records_release_required` | **Selector** | *"Was a HIPAA release form noted as required for this medical records request?"* **Options:** `YES`, `NO` |
| `records_patient_name` | **Text** | *"What is the full name of the patient whose medical records were requested? If the caller is the patient, this is the caller's name."* |
| `records_patient_dob` | **Text** | *"What is the date of birth of the patient whose medical records were requested? This is only collected for provider, attorney, or third-party callers. Return in YYYY-MM-DD format if given. If not collected, return empty."* |
| `records_request_type` | **Selector** | *"What type of records request did the caller make? This is only asked of patients and parents/guardians."* **Options:** `transfer_to_provider`, `radiology_report` |
| `records_sms_link_sent` | **Selector** | *"Was an SMS link to the medical records web form sent to the caller during the call?"* **Options:** `YES`, `NO` |

---

### Lien Request Variables

These are only populated when `intents_handled` contains `lien`.

| Field Name | Type | Extraction Prompt |
|---|---|---|
| `lien_patient_name` | **Text** | *"What is the full name of the client or patient the attorney lien is for?"* |
| `lien_patient_dob` | **Text** | *"What is the date of birth of the client or patient for the attorney lien? Return in YYYY-MM-DD format."* |
| `lien_firm_name` | **Text** | *"What is the name of the law firm establishing the lien?"* |
| `lien_paralegal_name` | **Text** | *"Who is the point of contact or paralegal at the law firm?"* |
| `lien_callback_phone` | **Text** | *"What is the best callback phone number for the law firm? Return in format like 801-555-1234."* |
| `lien_clinic_location` | **Text** | *"Which First Choice Imaging clinic location was the patient seen at for the lien request? (e.g., Logan, North Logan, Sandy, Tooele, St. George)"* |

---

### Billing Inquiry Variables

These are only populated when `intents_handled` contains `billing`.

| Field Name | Type | Extraction Prompt |
|---|---|---|
| `billing_patient_name` | **Text** | *"What is the full name of the patient the billing inquiry is about? If the caller is the patient, this is the caller's name."* |
| `billing_patient_dob` | **Text** | *"What is the date of birth of the patient the billing inquiry is about? Return in YYYY-MM-DD format."* |
| `billing_reason` | **Text** | *"What is the specific reason for the billing inquiry? Summarize the caller's billing question or concern."* |

---

## GHL Custom Contact Field Mapping

After the webhook fires, map the Retell post-call analysis fields to your **GHL custom contact fields**:

| Retell Post-Call Field | GHL Custom Contact Field | GHL Field Type |
|---|---|---|
| `intents_handled` | `intents_handled` | Single-line Text |
| `caller_name` | Contact: Full Name | Standard |
| `caller_phone` | Contact: Phone | Standard |
| `caller_email` | Contact: Email | Standard |
| `records_caller_type` | `records_caller_type` | Dropdown |
| `records_release_required` | `records_release_required` | Dropdown |
| `records_patient_name` | `records_patient_name` | Single-line Text |
| `records_patient_dob` | `records_patient_dob` | Single-line Text |
| `records_request_type` | `records_request_type` | Dropdown |
| `records_sms_link_sent` | `records_sms_link_sent` | Dropdown |
| `lien_patient_name` | `lien_patient_name` | Single-line Text |
| `lien_patient_dob` | `lien_patient_dob` | Single-line Text |
| `lien_firm_name` | `lien_firm_name` | Single-line Text |
| `lien_paralegal_name` | `lien_paralegal_name` | Single-line Text |
| `lien_callback_phone` | `lien_callback_phone` | Single-line Text |
| `lien_clinic_location` | `lien_clinic_location` | Single-line Text |
| `billing_patient_name` | `billing_patient_name` | Single-line Text |
| `billing_patient_dob` | `billing_patient_dob` | Single-line Text |
| `billing_reason` | `billing_reason` | Multi-line Text |

> [!NOTE]
> The custom field names in GHL should match the Retell field names to keep things simple. If your existing GHL custom fields use different names (from the older integration guide), update the mapping accordingly.

---

## GHL Workflow: If/Else Branching

In your GHL workflow, after the contact is created/updated:

```
IF {{contact.intents_handled}} contains "medical_records"
  → Send Medical Records Staff Email

IF {{contact.intents_handled}} contains "billing"
  → Send Billing Staff Email

IF {{contact.intents_handled}} contains "lien"
  → Send Lien Request Staff Email

THEN → Send SMS confirmation to {{contact.phone}}
```

> [!CAUTION]
> Use **"contains"** (not "equals") for the If/Else condition. This ensures multi-intent calls (e.g., `"medical_records,billing"`) correctly trigger **both** email templates.

---

## Webhook Event Type

> [!WARNING]
> Make sure your webhook is configured to fire on the **`call_analyzed`** event, NOT `call_ended`. The Post-Call Analysis fields are only available after Retell finishes analyzing the transcript, which happens slightly after the call ends.

---

## Verification Checklist

- [ ] Post-Call Analysis fields added in Retell AI agent dashboard
- [ ] Webhook configured for `call_analyzed` event
- [ ] GHL custom contact fields created (including new lien_ and records_ fields)
- [ ] GHL workflow maps webhook payload to contact fields
- [ ] GHL workflow uses "contains" logic on `intents_handled`
- [ ] Test call: Medical Records only → verify 1 email sent
- [ ] Test call: Billing only → verify 1 email sent
- [ ] Test call: Lien only → verify 1 email sent
- [ ] Test call: Multiple intents → verify correct emails sent
- [ ] Test call: SMS link sent for medical records → verify `records_sms_link_sent` = "YES"

---

*Document Version: 1.1*
*Last Updated: February 27, 2026*
