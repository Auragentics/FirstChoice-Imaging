# Logan Clinic AI Voice Agent — Inbound Call Workflow Diagram

> **Clinic:** Logan MRI Clinic
> **Version:** 5.0
> **Last Updated:** March 10, 2026

---

## Overview

This document provides a comprehensive workflow diagram for the AI voice agent handling inbound calls to First Choice Imaging's Logan MRI Clinic. The workflow covers caller intent classification, caller type identification, information collection, multi-intent support, and post-call actions.

**Key Features:**
- **Multi-Intent Support:** Callers can address multiple intents in a single call (e.g., Medical Records + Billing + Lien)
- **Prefixed Variables:** Each intent uses prefixes (`records_`, `billing_`, `lien_`) to prevent overwrites
- **Immediate Scheduling Transfers:** No data collection — triggers transfer tool immediately
- **Intent Tracking:** `{{intents_handled}}` tracks completed workflows
- **Live Operator Fallback:** Last-resort transfer to human receptionist (3-step gatekeeper protocol)
- **Records Caller Type:** Medical records callers are classified as patient/representative, provider, or attorney (`records_caller_type`)
- **Records Request Type:** Non-attorney callers are asked whether they need a medical records transfer or radiology report (`records_request_type`), which determines the SMS link sent
- **Provider Redirect:** Providers are asked electronic vs disc records, given the appropriate URL/portal info, then transferred to front desk
- **Attorney — No SMS:** Attorneys/paralegals are given URLs verbally only (desk phones cannot receive SMS). SMS consent is auto-set to "NO"
- **Patient Form & SMS Link:** Patients requesting records/reports are informed of the web form and offered a text link
- **Directions Disambiguation:** Callers asking for directions are asked whether they need Logan MRI or North Logan CT
- **Solicitation Handling:** Sales/vendor/partnership calls are declined politely without transfer
- **SMS Consent:** Caller is asked to opt in/out of text status updates before closing (unless already set during workflow)
- **Pre-Close Data Completeness Check:** Agent silently verifies all required variables before ending

---

## Master Workflow Diagram (Multi-Intent Support)

```mermaid
flowchart TD
    subgraph ENTRY["📞 CALL ENTRY"]
        A[/"Inbound Call Received"/] --> B["Greet & Verify Location"]
        B --> C{"Correct Location?"}
        C -->|No| D["Provide Correct Number & Offer Transfer"]
        D --> E{"Transfer Requested?"}
        E -->|Yes| F["Execute Transfer Protocol"]
        E -->|No| G["End Call"]
        C -->|Yes| H["Collect Caller Name"]
    end

    subgraph SILENCE["🔇 SILENCE HANDLING"]
        B -.->|"4s silence"| S1["'Are you there?'"]
        S1 -.->|"4s silence"| S2["'I'm here to help! May I start with your name?'"]
        S2 -.->|"5s silence"| S3["'I can't hear you...' → End Call"]
    end

    subgraph PRIORITY["🎯 PRIORITY DATA COLLECTION"]
        H --> H1{"Caller gives name?"}
        H1 -->|"Yes"| I["Collect Phone Number"]
        H1 -->|"No — states intent/question"| H2["Acknowledge, but collect name FIRST"]
        H2 --> I
        I --> J["Confirm Phone Number"]
        J --> K["Ask Reason for Call"]
    end

    subgraph INTENT["📋 INTENT CLASSIFICATION"]
        K --> L{"Determine Caller Intent"}
        L -->|"General Info / FAQ"| M["Handle FAQ from Knowledge Base"]
        L -->|"Scheduling"| N["⚡ IMMEDIATE Transfer to Scheduling"]
        L -->|"Medical Records"| O["Medical Records Workflow"]
        L -->|"Billing"| P["Billing Workflow"]
        L -->|"Lien Request"| Q["Lien Workflow"]
        L -->|"Solicitation"| SOL["Decline Politely — No Transfer"]
        L -->|"Live Operator Request"| R["3-Step Gatekeeper Protocol"]
        L -->|"Other/Unclear"| R
    end

    subgraph MULTIINTENT["🔄 MULTI-INTENT LOOP"]
        M --> M1["Answer from Knowledge Base"]
        O --> O1["Identify Caller Type → Ask: Records Transfer or Radiology Report?"]
        P --> P1["Collect billing_* Variables"]
        Q --> Q1["Collect lien_* Variables"]
        M1 --> LOOP["'Anything else I can help with?'"]
        O1 --> LOOP
        P1 --> LOOP
        Q1 --> LOOP
        LOOP -->|"Yes"| K
        LOOP -->|"No"| PRECLOSE["Pre-Close Data Completeness Check"]
    end

    subgraph CLOSING["✅ CLOSING SEQUENCE"]
        PRECLOSE --> PRECLOSE1{"All required variables present?"}
        PRECLOSE1 -->|"No"| PRECLOSE2["Circle back and collect missing data"]
        PRECLOSE2 --> PRECLOSE1
        PRECLOSE1 -->|"Yes"| CONFIRM["Post-Collection Confirmation"]
        CONFIRM --> SMS["SMS Consent Question"]
        SMS --> CLOSE["Close Call"]
    end

    subgraph SCHED["📅 SCHEDULING (IMMEDIATE)"]
        N --> N1["Trigger Transfer Tool Immediately"]
        N1 --> N2[/"Call Transferred to Scheduling Team"/]
    end

    subgraph FALLBACK["🧑‍💼 LIVE OPERATOR (LAST RESORT)"]
        R --> R1["Step 1: Deflection — 'I can help with scheduling, records, and billing. What do you need?'"]
        R1 --> R1A{"Caller states need?"}
        R1A -->|"Yes — identifiable intent"| K
        R1A -->|"Still wants human"| R2["Step 2: Interrogation — 'Staff are likely with patients. What is this about?'"]
        R2 --> R2A{"Caller states reason?"}
        R2A -->|"Valid reason (complaint, vendor, complex)"| R3["Step 3: Transfer to Receptionist"]
        R2A -->|"Still vague/refuses"| R4["'Cannot transfer without inquiry type. Please call back.' → End Call"]
    end
```

---

## Medical Records Workflow (records_* prefix)

> **Updated (v5.0):** Callers are classified into three groups: patient/representative, provider, or attorney (`records_caller_type`). Providers are redirected with electronic vs disc options and transferred to front desk. Patients are asked records transfer vs radiology report, then offered a web form link (with optional SMS). Attorneys get verbal URL only — no SMS.

```mermaid
flowchart TD
    subgraph PREREQ["📁 MEDICAL RECORDS — PREREQUISITE CHECK"]
        A[/"Medical Records Inquiry"/] --> A0{"caller_name & caller_phone collected?"}
        A0 -->|"No"| A0A["Collect name and phone FIRST"]
        A0A --> A0
        A0 -->|"Yes"| B{"Attorney or law firm?"}
    end

    subgraph ATTORNEY_CHECK["⚖️ ATTORNEY CHECK"]
        B -->|"Yes"| C{"Records or Lien?"}
        C -->|"Records"| D2["records_caller_type = 'attorney'<br/>records_request_type = 'medical_records'"]
        D2 --> D3["Verbal URL: firstchoice-imaging.com/attorneys<br/>sms_consent = 'NO' (desk phones)"]
        C -->|"Lien"| E["→ Redirect to Lien Workflow"]
        B -->|"No"| CT["Step 2: Caller Type"]
    end

    subgraph CALLER_TYPE["👤 CALLER TYPE (Non-Attorneys)"]
        CT --> CT1{"'Patient, on behalf of someone,<br/>or healthcare provider?'"}
        CT1 -->|"Patient / parent / third party"| CT2["records_caller_type = 'patient'"]
        CT1 -->|"Healthcare provider"| CT3["records_caller_type = 'provider'"]
    end

    subgraph PROVIDER_REDIRECT["🏥 PROVIDER REDIRECT"]
        CT3 --> PR1{"'Electronic records or records on a disc?'"}
        PR1 -->|"Electronic"| PR2["Remind: PACS or providers portal<br/>URL: firstchoice-imaging.com/providers"]
        PR1 -->|"Disc"| PR3["URL: firstchoice-imaging.com/medical-records-request"]
        PR2 --> PR4["Transfer to Receptionist (Front Desk)"]
        PR3 --> PR4
    end

    subgraph REQUEST_TYPE["📋 REQUEST TYPE (Patients Only)"]
        CT2 --> RT1{"'Records transfer or radiology report?'"}
        RT1 -->|"Medical records transfer"| RT2["records_request_type = 'medical_records'"]
        RT1 -->|"Radiology report"| RT3["records_request_type = 'radiology_report'"]
    end

    subgraph PATIENT_FORM["📱 FORM NOTICE & SMS LINK (Patients Only)"]
        RT2 --> PF1["'Records/reports need to be submitted through a form on our website.'"]
        RT3 --> PF1
        PF1 --> PF2{"'I can text you a direct link — would that be helpful?'"}
        PF2 -->|"Yes"| PF3["sms_consent = 'YES'<br/>'We'll send that link over.'"]
        PF2 -->|"No"| PF4["sms_consent = 'NO'<br/>Verbal URL: firstchoice-imaging.com/patients"]
    end

    subgraph COMPLETE["✅ WORKFLOW COMPLETE"]
        D3 --> DONE["Add 'records' to intents_handled"]
        PF3 --> DONE
        PF4 --> DONE
        DONE --> LOOP["'Anything else I can help with?'"]
        LOOP -->|"Yes"| RETURN["Return to Intent Routing"]
        LOOP -->|"No"| CLOSE["Pre-Close Check → Confirmation → SMS Consent → Close"]
    end
```

### Medical Records Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `{{records_caller_type}}` | Always | "patient", "provider", or "attorney". Attorneys auto-set in Step 1. |
| `{{records_request_type}}` | Always | "medical_records" or "radiology_report". Attorneys default to "medical_records". |

---

## Billing Inquiry Workflow (billing_* prefix)

```mermaid
flowchart TD
    subgraph PREREQ["💳 BILLING — PREREQUISITE CHECK"]
        A[/"Billing Inquiry"/] --> A0{"caller_name & caller_phone collected?"}
        A0 -->|"No"| A0A["Collect name and phone FIRST"]
        A0A --> A0
        A0 -->|"Yes"| B["Step 1: Patient Information"]
    end

    subgraph COLLECT["📝 DATA COLLECTION"]
        B --> B1{"Is this for yourself or someone else?"}
        B1 -->|"Self"| C1["billing_patient_name = caller_name"]
        B1 -->|"Someone else"| C2["Ask patient name + DOB"]
        C1 --> C3["Ask DOB → billing_patient_dob"]
        C2 --> C4["Store billing_patient_name + billing_patient_dob"]
        C3 --> D1["Step 2: 'Tell me more about your billing question'"]
        C4 --> D1
        D1 --> D2["Store billing_reason"]
    end

    subgraph COMPLETE["✅ WORKFLOW COMPLETE"]
        D2 --> DONE["Step 3: Add 'billing' to intents_handled"]
        DONE --> LOOP["'Anything else I can help with?'"]
        LOOP -->|"Yes"| RETURN["Return to Intent Routing"]
        LOOP -->|"No"| CLOSE["Pre-Close Check → Confirmation → SMS Consent → Close"]
    end
```

### Billing Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `{{billing_patient_name}}` | Always | = caller_name if self; asked otherwise |
| `{{billing_patient_dob}}` | Always | YYYY-MM-DD format |
| `{{billing_reason}}` | Always | Reason for billing inquiry |

---

## Lien Request Workflow (lien_* prefix)

> **Entry Point:** Caller is routed here from the Attorney branch in Medical Records Step 1 when they indicate they want to establish a direct lien.
>
> **Key Rules:** Liens are established BEFORE the patient is seen (future tense). Attorneys/paralegals do NOT receive SMS — verbal URLs only. Logan/North Logan share a phone line, so the agent must ask which location.

```mermaid
flowchart TD
    subgraph PREREQ["⚖️ LIEN — PREREQUISITE CHECK"]
        A[/"Lien Request (Attorney Direct Lien)"/] --> A0{"caller_name & caller_phone collected?"}
        A0 -->|"No"| A0A["Collect name and phone FIRST"]
        A0A --> A0
        A0 -->|"Yes"| B["Step 1: Client/Patient Name"]
    end

    subgraph COLLECT["📝 DATA COLLECTION"]
        B --> B1["Ask: 'What is the name of the client or patient?'"]
        B1 --> B2["Store lien_patient_name"]
        B2 --> C1["Step 2: Ask DOB → lien_patient_dob"]
        C1 --> D1["Step 3: Ask law firm name → lien_firm_name"]
        D1 --> D2["Step 4: Ask attorney name → lien_attorney_name"]
        D2 --> E1["Step 5: Ask best point of contact → lien_paralegal_name"]
        E1 --> F1["Step 6: Ask email → lien_caller_email"]
        F1 --> G1["Step 7: Confirm clinic location"]
        G1 --> G2{"'Will the patient be seen<br/>at our Logan clinic?'"}
        G2 -->|"Yes"| G3["lien_clinic_location = 'Logan'"]
        G2 -->|"No"| G4["Ask which location"]
    end

    subgraph COMPLETE["✅ WORKFLOW COMPLETE"]
        G3 --> AUTO["Step 8: Auto-set lien_callback_phone = caller_phone"]
        G4 --> AUTO
        AUTO --> NOTIFY["'Staff have been notified of your request.'"]
        NOTIFY --> URL["'For future lien requests you may submit a form<br/>at FirstChoice-Imaging.com/attorneys'"]
        URL --> SMS_NO["sms_consent = 'NO' (attorneys — no SMS)"]
        SMS_NO --> DONE["Add 'lien' to intents_handled"]
        DONE --> LOOP["'Anything else I can help with?'"]
        LOOP -->|"Yes"| RETURN["Return to Intent Routing"]
        LOOP -->|"No"| CLOSE["Pre-Close Check → Confirmation → Close"]
    end
```

### Lien Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `{{lien_patient_name}}` | Always | Client/patient's full name |
| `{{lien_patient_dob}}` | Always | Client/patient's DOB (YYYY-MM-DD) |
| `{{lien_firm_name}}` | Always | Name of the law firm |
| `{{lien_attorney_name}}` | Always | Attorney's full name on the case |
| `{{lien_paralegal_name}}` | Always | Best point of contact at the firm (paralegal, lien handler, or attorney) |
| `{{lien_caller_email}}` | Always | Caller's email address |
| `{{lien_callback_phone}}` | Auto-set | Auto-set from caller_phone (not asked separately) |
| `{{lien_clinic_location}}` | Always | Clinic where patient will be seen |

---

## Scheduling Transfer Workflow (IMMEDIATE TRANSFER)

> **⚡ IMPORTANT:** When a caller requests scheduling, the agent triggers the transfer tool **immediately** without collecting additional data. The human scheduling team handles all data collection.

```mermaid
flowchart TD
    subgraph SCHEDULING["📅 SCHEDULING REQUEST"]
        A[/"Caller Requests Scheduling"/] --> B["Detect Scheduling Intent"]
    end

    subgraph IMMEDIATE["⚡ IMMEDIATE TRANSFER"]
        B --> C["Do NOT collect additional data"]
        C --> D["Trigger Transfer Tool Immediately"]
    end

    subgraph COMPLETE["✅ TRANSFER COMPLETE"]
        D --> E[/"Call Transferred to Scheduling Team"/]
        E --> F["Human Agent Handles Data Collection"]
    end
```

**Key Points:**
- No patient name, DOB, or imaging service collected by AI
- Universal variables (`{{caller_name}}`, `{{caller_phone}}`) already captured in Steps 1-2
- Reduces caller wait time and improves handoff experience

---

## Pre-Close Data Completeness Check

> **CRITICAL:** Before confirming and closing, the agent silently verifies ALL required variables for each completed intent.

### Checklist by Intent

**Universal (always required):**
- [ ] `{{caller_name}}`
- [ ] `{{caller_phone}}`
- [ ] `{{sms_consent}}` (asked during closing)

**If `{{intents_handled}}` contains "records":**
- [ ] `{{records_caller_type}}` — "patient", "provider", or "attorney"
- [ ] `{{records_request_type}}` — "medical_records" or "radiology_report"

**If `{{intents_handled}}` contains "billing":**
- [ ] `{{billing_patient_name}}`
- [ ] `{{billing_patient_dob}}`
- [ ] `{{billing_reason}}`

**If `{{intents_handled}}` contains "lien":**
- [ ] `{{lien_patient_name}}`
- [ ] `{{lien_patient_dob}}`
- [ ] `{{lien_firm_name}}`
- [ ] `{{lien_attorney_name}}`
- [ ] `{{lien_paralegal_name}}`
- [ ] `{{lien_caller_email}}`
- [ ] `{{lien_callback_phone}}` (auto-set from caller_phone)
- [ ] `{{lien_clinic_location}}`

**If any required variable is missing:** Circle back naturally before closing.

---

## Closing Sequence

```mermaid
flowchart TD
    A["All workflows complete"] --> B["Pre-Close Data Completeness Check"]
    B --> C{"All variables present?"}
    C -->|"No"| D["Circle back and collect missing data"]
    D --> C
    C -->|"Yes"| E["Post-Collection Confirmation:<br/>'I've gathered all that information for our team.<br/>They will review it and follow up with you shortly.'"]
    E --> F["SMS Consent:<br/>'Would you like to receive status updates via text?<br/>Standard message and data rates may apply.'"]
    F -->|"Yes"| G["sms_consent = 'YES'"]
    F -->|"No"| H["sms_consent = 'NO'"]
    G --> I["Close: 'You're all set! Anything else?'"]
    H --> I
    I -->|"No"| J["'Great, have a wonderful day!'"]
    J --> K["NO REPEAT GOODBYES — End Call"]
```

---

## Post-Call Actions Summary (Two-Workflow GHL Architecture)

> Post-call processing is split into two independent GHL workflows that run in parallel.

### Workflow 1: Contact Database Update

**Trigger:** Inbound Webhook (Retell AI Post-Call Webhook)

```mermaid
flowchart LR
    A["📞 Call Ends"] --> B["Retell AI Post-Call Webhook"]
    B --> C["WF1: Inbound Webhook Trigger"]
    C --> D["Create/Update Contact\n(16 field mappings)"]
    D --> E["Add Tag: 'ai-call-processed'"]
```

**Purpose:** Receives the webhook POST from Retell AI, creates or updates the GHL contact with all extracted variables (caller info + intent-specific data). Maps all 16 fields regardless of intent — empty fields remain blank.

### Workflow 2: Post-Transcript Actions (Email & SMS Routing)

**Trigger:** Generate Transcript (fires after call transcript is available)

```mermaid
flowchart TD
    A["📄 Generate Transcript Trigger"] --> B{"intents_handled\nis not empty?"}
    B -->|"No"| C["END — No dashboard workflows"]
    B -->|"Yes"| D{"intents_handled\ncontains 'records'?"}
    D -->|"Yes"| E["Records Email Branch"]
    D -->|"No / Done"| F{"intents_handled\ncontains 'billing'?"}
    E --> F
    F -->|"Yes"| G["Billing Email Branch"]
    F -->|"No / Done"| H{"intents_handled\ncontains 'lien'?"}
    G --> H
    H -->|"Yes"| I["Lien Email Branch"]
    H -->|"No / Done"| J{"sms_consent\n= 'YES'?"}
    I --> J
    J -->|"Yes"| K["Send SMS to Caller"]
    J -->|"No"| L["END"]
    K --> L
```

**Purpose:** Routes intent-specific email notifications and sends SMS to the caller (if opted in). Each intent branch sends a separate email with the corresponding subject pattern and collected variables. The Records branch includes nested If/Else for caller type and request type to determine the correct SMS form link.

---

## Email Notifications

| Intent | Email Subject Pattern |
|--------|----------------------|
| Medical Records (transfer) | `MED RECORDS TRANSFER \| {{caller_name}}` |
| Medical Records (radiology) | `RADIOLOGY REPORT \| {{caller_name}}` |
| Billing | `BILLING INQUIRY \| {{billing_patient_name}}` |
| Lien | `LIEN REQUEST \| {{lien_patient_name}}` |

> **Contents:** Each email includes all collected variables for the specific intent type, plus call summary and transcription.

---

## Data Collection Requirements by Intent

> **Variable Naming Convention:** Intent-specific variables use prefixes (`records_`, `billing_`, `lien_`) to support multi-intent calls without variable overwrites.

### Universal Variables (All Calls)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| `{{caller_name}}` | Caller Name | string | Yes | Full name of person calling (Step 1) |
| `{{caller_phone}}` | Caller Phone | string | Yes | Best contact number (Step 2) |
| `{{intents_handled}}` | Intents Handled | string (comma-separated) | Auto-set | e.g., "records,billing" — tracks completed workflows |
| `{{sms_consent}}` | SMS Consent | string | Yes | "YES" or "NO" — text status update opt-in |

### Scheduling Request (IMMEDIATE TRANSFER)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| ⚡ **NO ADDITIONAL DATA COLLECTED** | — | — | — | Immediate transfer to scheduling team |

### Medical Records Request (records_* prefix)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| `{{records_caller_type}}` | Caller Type | enum | Always | "patient" (includes parent/guardian, third party), "provider", or "attorney". |
| `{{records_request_type}}` | Request Type | enum | Always | "medical_records" or "radiology_report". Attorneys default to "medical_records". |

### Billing Inquiry (billing_* prefix)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| `{{billing_patient_name}}` | Patient Name | string | Always | = caller_name if self; asked otherwise |
| `{{billing_patient_dob}}` | Patient DOB | string (YYYY-MM-DD) | Always | Patient's date of birth |
| `{{billing_reason}}` | Reason for Call | string | Always | Specific billing inquiry details |

### Lien Request (lien_* prefix)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| `{{lien_patient_name}}` | Patient Name | string | Always | Client/patient's full name |
| `{{lien_patient_dob}}` | Patient DOB | string (YYYY-MM-DD) | Always | Client/patient's date of birth |
| `{{lien_firm_name}}` | Law Firm | string | Always | Name of the law firm |
| `{{lien_attorney_name}}` | Attorney Name | string | Always | Attorney's full name on the case |
| `{{lien_paralegal_name}}` | Contact Name | string | Always | Best point of contact at the firm |
| `{{lien_caller_email}}` | Email Address | string | Always | Caller's email address |
| `{{lien_callback_phone}}` | Callback Phone | string | Auto-set | Auto-set from caller_phone (not asked separately) |
| `{{lien_clinic_location}}` | Clinic Location | string | Always | Where patient will be seen |

---

## Caller Intent Decision Tree

```mermaid
flowchart TD
    A["'What can I help you with today?'"] --> B{"Parse Caller Intent"}

    B -->|"Location, hours, services, preparation, general questions"| C["📋 General Info / FAQ"]
    B -->|"Book, schedule, reschedule, cancel appointment"| D["📅 Scheduling"]
    B -->|"Medical records, imaging report, copies"| E["📁 Medical Records"]
    B -->|"Bill, payment, charges, statement"| F["💳 Billing"]
    B -->|"Lien, attorney calling about lien"| G["⚖️ Lien Request"]
    B -->|"Sales, vendor, sponsorship, partnership"| SOL["🚫 Solicitation — Decline (No Transfer)"]
    B -->|"Other / Unclear / Cannot Assist"| H["🧑‍💼 Live Operator (LAST RESORT)"]

    C --> C1["Answer from Knowledge Base"]
    D --> D1["⚡ IMMEDIATE Transfer (no data collection)"]
    E --> E1["Ask: Records Transfer or Radiology Report?"]
    F --> F1["Collect billing_* Variables"]
    G --> G1["Collect lien_* Variables"]
    H --> H1["3-Step Gatekeeper Protocol"]
    H1 --> H2{"Step 1: Deflection — identify actual need"}
    H2 -->|"Need identified"| B
    H2 -->|"Still wants human"| H3{"Step 2: Interrogation — get reason"}
    H3 -->|"Valid reason"| H4["Step 3: Transfer to Receptionist"]
    H3 -->|"Vague/refuses"| H5["Cannot transfer → End Call"]

    C1 --> LOOP["'Anything else?'"]
    E1 --> LOOP
    F1 --> LOOP
    G1 --> LOOP
    LOOP -->|"Yes"| B
    LOOP -->|"No"| CLOSE["Pre-Close Check → Confirmation → SMS Consent → Close"]
```

---

## Live Operator Transfer (Last Resort)

> **⚠️ CRITICAL:** The Live Operator transfer is a **LAST RESORT** option. The agent must exhaust all other options before offering this transfer.

### 3-Step Gatekeeper Protocol

```mermaid
flowchart TD
    A["Caller: 'I want to speak to a real person'"] --> B["Step 1 — DEFLECTION"]
    B --> B1["Agent: 'I can help you right here with scheduling,<br/>medical records, and billing.<br/>What specifically do you need?'"]
    B1 --> C{"Caller responds"}
    C -->|"States identifiable need"| D["Route to appropriate workflow"]
    C -->|"'I just want a human' / 'It's complicated'"| E["Step 2 — INTERROGATION"]
    E --> E1["Agent: 'Our staff are currently likely with patients.<br/>If you tell me the reason, I can either handle it<br/>or ensure you get to the right person.<br/>Is this about an appointment or a bill?'"]
    E1 --> F{"Caller responds"}
    F -->|"Valid reason (complaint, vendor, truly complex)"| G["Step 3 — TRANSFER"]
    G --> G1["Agent: 'Okay, I see. Let me get you to someone<br/>who can help with that.'"]
    G1 --> G2["Transfer to Receptionist"]
    F -->|"Still vague / refuses to answer"| H["Step 3 — END CALL"]
    H --> H1["Agent: 'I cannot transfer you without a specific<br/>inquiry type. Please call back when you can<br/>provide those details.'"]
    H1 --> H2["End Call"]
```

### When to Use

| Scenario | Action |
|----------|--------|
| Caller asks for "live person" at start of call | Do NOT transfer — Step 1 Deflection |
| Caller has complaint or escalation | Transfer to `Receptionist` after Step 2 |
| Complex situation outside standard workflows | Transfer to `Receptionist` after Step 2 |
| Caller confused/frustrated after multiple attempts | Transfer to `Receptionist` |
| Non-imaging request (vendor, job inquiry) | Transfer to `Receptionist` after Step 2 |

### Transfer Phrase

When transferring to Live Operator after exhausting options:
> *"I want to make sure you get the help you need. Let me connect you with one of our staff members who can assist further. Just one moment."*

---

## Transfer Execution Protocol (Cross-Location Transfers)

> **EXCEPTION:** Scheduling transfers are IMMEDIATE — skip this protocol.

**Turn 1: Offer & Satisfaction Check**
1. Finish answering the current question completely.
2. Offer the transfer: *"I'd be happy to get you over to our [department] team. Before I connect you, is there anything else I can answer for you?"*
3. **STOP.** Wait for the caller to respond.

**Turn 2: Bridge & Trigger (Only after caller says "No/That's it")**
1. If the caller has more questions, answer them and repeat Turn 1.
2. If ready: *"Alright, I'm going to get you over to our [department] team now. Just one moment while I connect you."*
3. Wait 2 seconds of silence.
4. Trigger transfer action.

---

## Cross-Location Phone Directory & Transfer Triggers

| Location | Phone Number | Transfer Trigger |
|----------|--------------|------------------|
| Tooele Valley Imaging | (435) 882-1674 | Transfer to `Tewilla` |
| Sandy (Wasatch Imaging) | (801) 576-1290 | Transfer to `Sandy` |

| Department | Transfer Trigger | Notes |
|------------|------------------|-------|
| Scheduling | Transfer to `Scheduling` | IMMEDIATE — no data collection |
| Live Operator | Transfer to `Receptionist` | LAST RESORT — exhaust all options first |

---

## Cross-Reference: Other Clinic Locations

| Location | Phone Number | Services |
|----------|--------------|----------|
| Logan MRI Clinic | (435) 258-9598 | Wide Bore MRI, Arthrograms |
| North Logan CT Clinic | (435) 258-9598 | CT Scans, Cardiac Calcium Scoring |
| Tooele Valley Imaging | (435) 882-1674 | MRI, CT, Cardiac Calcium Scoring, X-Ray, DEXA, BMI, Ultrasound |
| Sandy (Wasatch Imaging) | (801) 576-1290 | MRI, Arthrograms |
| St. George | TBD | Open MRI, Arthrograms, X-Ray *(Opening Soon)* |

> **Note:** CT inquiries at the Logan number should be handled directly (North Logan CT Clinic shares the same phone line).

---

## Multi-Intent Call Example

**Scenario:** Caller needs medical records AND has a billing question.

1. **Records Workflow:** Agent identifies caller type → stores `records_caller_type`, asks "medical records transfer or radiology report?" → stores `records_request_type`
2. Agent asks: *"Anything else I can help with?"*
3. Caller mentions billing question
4. **Billing Workflow:** Agent collects `billing_*` variables
5. Agent asks: *"Anything else I can help with?"*
6. Caller says no
7. **Pre-Close Check:** Agent verifies all variables present
8. **Post-Collection Confirmation:** "I've gathered all that information for our team..."
9. **SMS Consent:** "Would you like to receive status updates via text?"
10. Agent closes call

**Final `{{intents_handled}}`:** `"records,billing"`

This allows downstream webhooks to route notifications based on which intents were handled.

---

*Document Version: 5.0*
*Location: Logan MRI Clinic*
*Last Updated: March 10, 2026*
