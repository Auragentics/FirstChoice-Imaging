# Logan Clinic AI Voice Agent — Inbound Call Workflow Diagram

> **Clinic:** Logan MRI Clinic
> **Version:** 2.5
> **Last Updated:** February 5, 2026

---

## Overview

This document provides a comprehensive workflow diagram for the AI voice agent handling inbound calls to First Choice Imaging's Logan MRI Clinic. The workflow covers caller intent classification, caller type identification, information collection, multi-intent support, and post-call actions.

**Key Features:**
- **Multi-Intent Support:** Callers can address multiple intents in a single call
- **Prefixed Variables:** Each intent uses prefixes (`records_`, `billing_`) to prevent overwrites
- **Immediate Scheduling Transfers:** No data collection — triggers transfer tool immediately
- **Intent Tracking:** `{{intents_handled}}` tracks completed workflows
- **Live Operator Fallback:** Last-resort transfer to human receptionist (only after exhausting all options)

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

    subgraph PRIORITY["🎯 PRIORITY DATA COLLECTION"]
        H --> I["Collect Phone Number"]
        I --> J["Confirm Phone Number"]
        J --> K["Ask Reason for Call"]
    end

    subgraph INTENT["📋 INTENT CLASSIFICATION"]
        K --> L{"Determine Caller Intent"}
        L -->|"General Info / FAQ"| M["Handle FAQ Inquiry"]
        L -->|"Scheduling"| N["⚡ IMMEDIATE Transfer"]
        L -->|"Medical Records"| O["Medical Records Workflow"]
        L -->|"Billing"| P["Billing Workflow"]

        L -->|"Other/Unclear"| R["Attempt to Clarify & Assist"]
    end

    subgraph MULTIINTENT["🔄 MULTI-INTENT LOOP"]
        M --> M1["Answer from Knowledge Base"]
        O --> O1["Collect records_* Variables"]
        P --> P1["Collect billing_* Variables"]
        Q --> Q1["Collect insurance_* Variables"]
        M1 --> LOOP["'Anything else I can help with?'"]
        O1 --> LOOP
        P1 --> LOOP
        LOOP -->|"Yes"| K
        LOOP -->|"No"| CLOSE["Collect Email & Close"]
    end

    subgraph SCHED["📅 SCHEDULING (IMMEDIATE)"]
        N --> N1["Trigger Transfer Tool Immediately"]
        N1 --> N2[/"Call Transferred to Scheduling Team"/]
    end

    subgraph FALLBACK["🧑‍💼 LIVE OPERATOR (LAST RESORT)"]
        R --> R1{"Can Agent Assist?"}
        R1 -->|"Yes"| LOOP
        R1 -->|"No - Exhausted Options"| R2["Transfer to Receptionist"]
        R2 --> R3[/"Call Transferred to Live Operator"/]
    end
```

---

## Caller Type Identification

```mermaid
flowchart TD
    A["Caller Type Identification"] --> B{"Who is calling?"}
    
    B -->|"Self-identified"| C["Patient"]
    B -->|"Calling on behalf of patient"| D{"What is your relationship?"}
    
    D -->|"Doctor's office with order"| E["Provider - Ordering"]
    D -->|"Doctor's office without order"| F["Provider - Non-Ordering"]
    D -->|"Legal representative"| G["Attorney"]
    D -->|"Other"| H["3rd Party"]

    subgraph LEGEND["Caller Types"]
        L1["👤 Patient: The individual who received imaging"]
        L2["🏥 Provider - Ordering: Doctor's office that supplied the original imaging order"]
        L3["🏥 Provider - Non-Ordering: Doctor's office requesting records without original order"]
        L4["⚖️ Attorney: Legal representative requesting records"]
        L5["👥 3rd Party: Any other party (family, employer, etc.)"]
    end
```

---

## Medical Records Workflow (records_* prefix)

```mermaid
flowchart TD
    subgraph RECORDS_ENTRY["📁 MEDICAL RECORDS REQUEST"]
        A[/"Medical Records Inquiry"/] --> A1["{{caller_name}} - Already collected"]
        A1 --> A2["{{caller_phone}} - Already collected"]
        A2 --> B{"Identify {{records_caller_type}}"}
    end

    subgraph PATIENT_PROVIDER["✅ PATIENT or ORDERING PROVIDER"]
        B -->|"Patient"| C0["{{records_release_required}} = 'NO'"]
        B -->|"Parent/Guardian"| C0
        B -->|"Provider - Ordering"| C0
        C0 --> C1["Ask: Is patient same as caller?"]
        C1 -->|No| C1A["Collect {{records_patient_name}}"]
        C1 -->|Yes| C1B["Skip patient name"]
        C1A --> D2["📅 {{records_patient_dob}}"]
        C1B --> D2
        D2 --> D3["🔬 {{records_imaging_service}}"]
        D3 --> D4["📆 {{records_imaging_dos}}"]
        D4 --> D5["📠 {{records_delivery_method}} + {{records_delivery_destination}}"]
        D5 --> E1["Confirm All Information"]
    end

    subgraph RELEASE_REQUIRED["⚠️ SIGNED RELEASE REQUIRED"]
        B -->|"Provider - Non-Ordering"| R0["{{records_release_required}} = 'YES'"]
        B -->|"Attorney"| R0
        B -->|"3rd Party"| R0

        R0 --> R1["Inform: Signed Release Required"]
        R1 --> R2["Explain Release Requirements"]
        R2 --> R3["Ask: Is patient same as caller?"]
        R3 -->|No| R3A["Collect {{records_patient_name}}"]
        R3 -->|Yes| R3B["Skip patient name"]
        R3A --> R5["📅 {{records_patient_dob}}"]
        R3B --> R5
        R5 --> R6["🔬 {{records_imaging_service}}"]
        R6 --> R7["📆 {{records_imaging_dos}}"]
        R7 --> R8["📠 {{records_delivery_method}} + {{records_delivery_destination}}"]
        R8 --> R9["Confirm All Information"]
    end

    subgraph MULTIINTENT["🔄 MULTI-INTENT LOOP"]
        E1 --> MI1["Add 'records' to {{intents_handled}}"]
        R9 --> MI1
        MI1 --> MI2["'Anything else I can help with?'"]
        MI2 -->|"Yes"| MI3["Return to Intent Routing"]
        MI2 -->|"No"| MI4["Proceed to Close"]
    end

    subgraph RELEASE_INFO["📋 SIGNED RELEASE MUST CONTAIN"]
        REL1["1. Patient Name"]
        REL2["2. Date of Birth"]
        REL3["3. Imaging Service Needed"]
        REL4["4. Date of Service (DOS)"]
        REL5["5. Fax Number or Email for Delivery"]
    end
```

---

## Billing Inquiry Workflow (billing_* prefix)

```mermaid
flowchart TD
    subgraph BILLING_ENTRY["💳 BILLING INQUIRY"]
        A[/"Billing Inquiry Received"/] --> B{"Identify Caller Type"}
    end

    subgraph CALLER_ID["👤 CALLER IDENTIFICATION"]
        B -->|"Patient calling"| C1["Patient"]
        B -->|"Provider office"| C2["Provider Office"]
    end

    subgraph DATA_COLLECTION["📝 REQUIRED INFORMATION"]
        C1 --> D0["{{caller_name}} - Already collected"]
        C2 --> D0
        D0 --> D0A["{{caller_phone}} - Already collected"]
        D0A --> D1["Ask: Is patient same as caller?"]
        D1 -->|No| D1A["Collect {{billing_patient_name}}"]
        D1 -->|Yes| D1B["Skip patient name"]
        D1A --> D2["📅 {{billing_patient_dob}}"]
        D1B --> D2
        D2 --> E3["📋 {{billing_reason}}"]
        E3 --> F1["Confirm All Information"]
    end

    subgraph MULTIINTENT["🔄 MULTI-INTENT LOOP"]
        F1 --> MI1["Add 'billing' to {{intents_handled}}"]
        MI1 --> MI2["'Anything else I can help with?'"]
        MI2 -->|"Yes"| MI3["Return to Intent Routing"]
        MI2 -->|"No"| MI4["Proceed to Close"]
    end

    subgraph SMS_CONTENT["📱 SMS CONFIRMATION"]
        SMS1["Thank you for contacting First Choice Imaging."]
        SMS2["Your billing inquiry has been received."]
        SMS3["A team member will follow up with you shortly."]
    end
```

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

## Post-Call Actions Summary

```mermaid
flowchart LR
    subgraph TRIGGERS["🎯 WORKFLOW TRIGGERS"]
        T1["Medical Records"]
        T2["Billing"]
        T4["Scheduling"]
    end

    subgraph ACTIONS["📤 AUTOMATED ACTIONS"]
        A1["📝 Call Summary Generated"]
        A2["📄 Call Transcription Created"]
        A3["📧 Webhook Triggers Email"]
        A4["📱 SMS Sent to Caller"]
    end

    subgraph EMAIL["📬 EMAIL DELIVERY"]
        E1["📧 Intent-Specific Subject"]
        E2["📎 Collected Variables"]
        E3["📄 Call Summary Attached"]
    end

    T1 --> A1
    T2 --> A1
    T4 --> A1
    A1 --> A2 --> A3 --> A4
    A3 --> E1
    E1 --> E2
    E2 --> E3
```

---

## Email Notifications

| Intent | Email Subject Pattern |
|--------|----------------------|
| Medical Records | `[RECORDS] Patient: {{records_patient_name}}` |
| Billing | `[BILLING] Patient: {{billing_patient_name}}` |


> **Contents:** Each email includes all collected variables for the specific intent type, plus call summary and transcription.

---

## Data Collection Requirements by Intent

> **Variable Naming Convention:** Intent-specific variables use prefixes (`records_`, `billing_`) to support multi-intent calls without variable overwrites.

### Universal Variables (All Calls)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| `{{caller_name}}` | Caller Name | string | Yes | Full name of person calling (Step 1) |
| `{{caller_phone}}` | Caller Phone | string | Yes | Best contact number (Step 2) |
| `{{caller_email}}` | Caller Email | string | Yes | Collected before closing |
| `{{caller_reason}}` | Reason for Call | string | Yes | Initial stated reason (Step 3) |
| `{{intents_handled}}` | Intents Handled | string (comma-separated) | Auto-set | e.g., "records, billing" — tracks completed workflows |

### Scheduling Request (IMMEDIATE TRANSFER)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| ⚡ **NO ADDITIONAL DATA COLLECTED** | — | — | — | Immediate transfer to scheduling team |



### Billing Inquiry (billing_* prefix)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| `{{billing_patient_name}}` | Patient Name | string | Conditional | Only if different from caller |
| `{{billing_patient_dob}}` | Patient DOB | string (YYYY-MM-DD) | Yes | Patient's date of birth |
| `{{billing_reason}}` | Reason for Call | string | Yes | Specific billing inquiry details |

### Medical Records Request (records_* prefix)

| Variable | Field | Data Type | Required | Notes |
|----------|-------|-----------|----------|-------|
| `{{records_patient_name}}` | Patient Name | string | Conditional | Only if different from caller |
| `{{records_patient_dob}}` | Patient DOB | string (YYYY-MM-DD) | Yes | Patient's date of birth |
| `{{records_imaging_service}}` | Imaging Service | string | Yes | Type of imaging performed |
| `{{records_imaging_dos}}` | Imaging DOS | string (YYYY-MM-DD) | Yes | Date of service |
| `{{records_delivery_method}}` | Delivery Method | enum | Yes | "email" or "fax" |
| `{{records_delivery_destination}}` | Email/Fax | string | Yes | Where to send records |
| `{{records_caller_type}}` | Caller Type | enum | Yes | Relationship to patient |
| `{{records_release_required}}` | Release Required | **string** | Auto-set | **"YES" or "NO"** — Based on caller_type |

---

## Signed Release Requirements

> [!IMPORTANT]
> A signed release is **required** for the following caller types requesting medical records:
> - Provider (Non-Ordering)
> - Attorney
> - 3rd Party

### Required Contents of Signed Release

1. **Patient Name** — Full legal name matching imaging records
2. **Date of Birth** — For patient verification
3. **Imaging Service Needed** — Specific exam type
4. **Date of Service (DOS)** — Date or date range of imaging
5. **Fax Number or Email** — Where records should be sent

---

## Caller Intent Decision Tree

```mermaid
flowchart TD
    A["'What can I help you with today?'"] --> B{"Parse Caller Intent"}

    B -->|"Location, hours, pricing, services, preparation, general questions"| C["📋 General Info / FAQ"]
    B -->|"Book, schedule, reschedule, cancel appointment"| D["📅 Scheduling"]
    B -->|"Medical records, imaging report, copies, images, CD"| E["📁 Medical Records"]
    B -->|"Bill, payment, charges, statement, pay"| F["💳 Billing"]
    B -->|"Other / Unclear / Cannot Assist"| H["🧑‍💼 Live Operator (LAST RESORT)"]

    C --> C1["Answer from Knowledge Base"]
    D --> D1["⚡ IMMEDIATE Transfer (no data collection)"]
    E --> E1["Collect records_* Variables"]
    F --> F1["Collect billing_* Variables"]
    H --> H1["Exhaust All Options First"]
    H1 --> H2{"Can Agent Assist?"}
    H2 -->|"Yes"| LOOP
    H2 -->|"No"| H3["Transfer to Receptionist"]

    C1 --> LOOP["'Anything else?'"]
    E1 --> LOOP
    F1 --> LOOP
    LOOP -->|"Yes"| B
    LOOP -->|"No"| CLOSE["Collect Email & Close"]
```

---

## Live Operator Transfer (Last Resort)

> **⚠️ CRITICAL:** The Live Operator transfer is a **LAST RESORT** option. The agent must exhaust all other options before offering this transfer.

### When to Use

| Scenario | Action |
|----------|--------|
| Caller asks for "live person" at start of call | Do NOT transfer — ask what they need and attempt to assist |
| Caller has complaint or escalation | Transfer to `Receptionist` after attempting to understand |
| Complex situation outside standard workflows | Transfer to `Receptionist` after clarifying questions |
| Caller confused/frustrated after multiple attempts | Transfer to `Receptionist` |
| Non-imaging request (vendor, job inquiry) | Transfer to `Receptionist` |

### Anti-Gaming Protocol

```mermaid
flowchart TD
    A["Caller: 'I want to speak to a real person'"] --> B["Agent: 'I'd be happy to help you directly! What can I assist you with today?'"]
    B --> C{"Caller States Need"}
    C -->|"Scheduling"| D["⚡ IMMEDIATE Transfer to Scheduling"]
    C -->|"Records/Billing"| E["Handle via Dashboard Workflow"]
    C -->|"General Question"| F["Answer from Knowledge Base"]
    C -->|"Cannot Be Addressed"| G["Transfer to Receptionist (Last Resort)"]
```

### Transfer Phrase

When transferring to Live Operator after exhausting options:
> *"I want to make sure you get the help you need. Let me connect you with one of our staff members who can assist further. Just one moment."*

---

## SMS Follow-Up Templates

### Medical Records SMS
```
Hi [Caller Name], thank you for contacting First Choice Imaging regarding your medical records request. 
Your request has been received and will be processed by our team. 
We'll be in touch soon.
```

### Billing SMS
```
Hi [Caller Name], thank you for your billing inquiry with First Choice Imaging. 
Our billing team has received your information and will follow up shortly. 

```



## Cross-Reference: Other Clinic Locations

| Location | Phone Number | Services |
|----------|--------------|----------|
| Logan MRI Clinic | (435) 258-9598 | Wide Bore MRI, Arthrograms |
| North Logan CT Clinic | (435) 258-9598 | CT Scans, Lung Cancer Screening |
| Tooele Valley Imaging | (435) 882-1674 | MRI, CT |
| Sandy (Wasatch Imaging) | (801) 576-1290 | MRI, CT |
| St. George | — | MRI, CT |

---

*Document Version: 2.7*
*Location: Logan MRI Clinic*
*Last Updated: February 5, 2026*

---

## Multi-Intent Call Example

**Scenario:** Caller needs both medical records AND has a billing question.

1. **Records Workflow:** Agent collects `records_*` variables
2. Agent asks: *"Anything else I can help with?"*
3. Caller mentions billing question
4. **Billing Workflow:** Agent collects `billing_*` variables
5. Agent asks: *"Anything else I can help with?"*
6. Caller says no
7. Agent collects email and closes call

**Final `{{intents_handled}}`:** `"records, billing"`

This allows downstream webhooks to route emails based on which intents were handled.
