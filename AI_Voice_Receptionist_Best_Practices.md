# AI Voice Receptionist for Medical Clinics — Best Practices Guide

> **Prepared by:** Brian Randall — Auragentics LLC
> **Date:** March 5, 2026
> **Based on:** Production deployment across First Choice Imaging (5 locations)

---

## Table of Contents

1. [Prompt Architecture](#1--prompt-architecture)
2. [Call Flow Design](#2--call-flow-design)
3. [Data Collection & Webhook Variables](#3--data-collection--webhook-variables)
4. [Transfer Logic & Gatekeeping](#4--transfer-logic--gatekeeping)
5. [TTS Optimization & Natural Speech](#5--tts-optimization--natural-speech)
6. [HIPAA Compliance & PHI Handling](#6--hipaa-compliance--phi-handling)
7. [SMS Automation & A2P 10DLC Compliance](#7--sms-automation--a2p-10dlc-compliance)
8. [Multi-Location Architecture](#8--multi-location-architecture)
9. [Common Mistakes & How to Avoid Them](#9--common-mistakes--how-to-avoid-them)
10. [Client Discovery Questionnaire](#10--client-discovery-questionnaire)

---

## 1 — Prompt Architecture

### Structure Every Prompt with Clear Sections

A well-structured voice agent prompt should contain distinct, labeled sections. This prevents the AI from blending instructions and makes maintenance easier.

**Recommended prompt sections (in order):**

| Section | Purpose |
|---------|---------|
| **ROLE** | Agent personality, tone, speaking style, name constraints |
| **PRIORITY OBJECTIVES** | The single most important rule (e.g., collect name + phone first) |
| **WEBHOOK VARIABLES** | All data fields the agent must collect, with exact variable names and types |
| **TASK (Script Flow)** | Step-by-step call flow from greeting to close |
| **GUIDELINES (Guardrails)** | Rules the agent must never break (no diagnoses, no pricing, etc.) |
| **KNOWLEDGE BASE** | Location-specific info: address, hours, services, FAQs |
| **EXAMPLES** | Concrete dialogue samples showing correct behavior for tricky scenarios |

### One Prompt Per Location

Each clinic location should have its own prompt file, even if 90% of the logic is identical. Location-specific elements include:

- Greeting with correct clinic name and address
- Knowledge base (hours, services, providers)
- Cross-location transfer directory
- Lien workflow location confirmation language

Maintain a "template" prompt (e.g., the first location you build) and replicate changes across all locations when updating shared logic.

### Version Control Everything

Track prompt versions with a version number and date at the bottom of every prompt file. When you make structural changes (new workflows, new variables), bump the version. This prevents confusion when multiple people are testing or when the client asks "which version is live?"

---

## 2 — Call Flow Design

### Always Collect Identity First

The single most important design decision: **collect the caller's name and phone number before doing anything else.** This ensures:

- You have contact info if the call drops
- Webhook data is never missing the caller's identity
- The agent sounds professional and organized

**Pattern:**
```
Step 1: Greet + get name
Step 2: Get phone number
Step 3: Ask reason for call
Step 4: Handle inquiry
Step 5: Close
```

Never let the caller skip past identity collection. If they jump ahead to their question, acknowledge it but circle back: *"I can definitely help with that! First, may I have your name?"*

### Separate Transfer Workflows from Data Collection Workflows

Divide call outcomes into two categories:

1. **Transfer workflows** — Caller needs to speak with someone (scheduling, complaints). Transfer immediately. No data collection beyond name/phone.
2. **Dashboard workflows** — Caller needs something processed (records, billing, lien). Collect all required data verbally, store as webhook variables, end call. Staff receives a structured email.

This distinction is critical. Mixing them (e.g., collecting billing data AND transferring) creates confusion and duplicate work.

### Handle Multi-Intent Calls

Callers often have more than one reason for calling. Design the flow so the agent asks *"Is there anything else I can help you with?"* after each completed workflow. Use a comma-separated intent tracker (e.g., `intents_handled = "records,billing"`) so the webhook system knows which follow-up actions to fire.

### Build a Pre-Close Completeness Check

Before ending any call where data was collected, the agent should silently verify all required variables are filled. If anything is missing, circle back naturally: *"Before I wrap up — I don't think I got your date of birth. Could you give me that real quick?"*

This catches the #1 source of incomplete webhook data: the agent moving too fast through the flow.

---

## 3 — Data Collection & Webhook Variables

### Use Intent-Prefixed Variable Names

When a caller can complete multiple workflows in one call, variable names must be prefixed by intent to prevent overwrites:

| Intent | Variable Pattern | Example |
|--------|-----------------|---------|
| Records | `records_*` | `records_caller_type`, `records_request_type` |
| Billing | `billing_*` | `billing_patient_name`, `billing_patient_dob` |
| Lien | `lien_*` | `lien_patient_name`, `lien_firm_name` |

Universal variables (collected on every call) don't need prefixes: `caller_name`, `caller_phone`, `sms_consent`.

### Define Variable Types Explicitly

Tell the AI what format each variable should be in. Use enum types for controlled values:

```
records_caller_type = (enum) values: "patient", "provider", "attorney"
records_request_type = (enum) values: "medical_records", "radiology_report"
sms_consent = (enum) values: "YES", "NO"
billing_patient_dob = DOB in YYYY-MM-DD format
```

Without explicit types, the AI will store inconsistent values (e.g., "yes", "Yeah", "sure" instead of "YES"), which breaks downstream automation.

### Map Variables to Post-Call Analysis Fields

If using Retell AI, every webhook variable must be defined in the Post-Call Analysis configuration with:

- A field name matching the prompt variable
- A description of what to extract from the transcript
- The expected data type (string, enum, etc.)

This is the bridge between the voice conversation and your automation system. Mismatches here cause silent data loss.

---

## 4 — Transfer Logic & Gatekeeping

### Immediate vs. Gated Transfers

Not all transfers should work the same way:

| Transfer Type | When | Protocol |
|---------------|------|----------|
| **Immediate** | Scheduling (book, reschedule, cancel) | Transfer as soon as intent is clear. No questions. |
| **Gated** | Live operator / front desk | 3-step gatekeeping protocol to prevent unnecessary transfers |

### The 3-Step Gatekeeper Protocol

When callers demand a "real person," many are actually looking for scheduling, records, or billing — things the AI can handle. Use this escalation:

1. **Deflection:** *"I can help you right here with scheduling, medical records, and billing. What specifically do you need?"*
2. **Interrogation:** *"Our staff are currently likely with patients. If you tell me the reason, I can ensure you get to the right person. Is this about an appointment or a bill?"*
3. **Decision:** If legitimate (complaint, complex issue) → transfer. If vague/refuses → *"I cannot transfer without a specific inquiry type."*

This reduces unnecessary transfers by 40–60% while still routing legitimate needs through.

### Block Solicitations Explicitly

Without explicit blocking rules, the AI will cheerfully transfer sales calls, donation requests, and vendor solicitations to staff. Add a dedicated solicitation blocking protocol:

1. Polite decline: *"We're not able to take those requests over the phone."*
2. If persistent: Direct to website contact form.
3. If still persistent: *"I'm not able to help further with that request. Have a great day."* → End call.

Never include "vendor" or "sales" as valid transfer reasons in the gatekeeper logic.

### Provider-Specific Routing

Healthcare providers calling about records should NOT go through the same workflow as patients. They have PACS access and portal logins. Redirect them immediately:

*"As a provider, you can access records through PACS or through our website. Would you like me to transfer you to the front desk?"*

This saves time for both the provider and the clinic staff.

---

## 5 — TTS Optimization & Natural Speech

### Name Usage Limits

The fastest way to make an AI sound robotic is to overuse the caller's name. Set a hard limit:

**Rule: Maximum 3 name uses per entire call.**
1. Greeting: *"Great to speak with you, Sarah!"*
2. Optionally once for clarification mid-call
3. Closing: *"You're all set, Sarah! Have a wonderful day."*

Never insert the caller's name into mid-conversation responses. *"Sure thing, Sarah. Got it, Sarah. Let me check that for you, Sarah."* — this immediately signals "AI."

### Speak Addresses and Numbers Naturally

TTS engines read addresses and phone numbers robotically by default. Instruct the agent to:

- **Addresses:** *"Six thirty East, fourteen hundred North"* — not *"630 E 1400 N"*
- **Phone numbers:** Natural pauses between groups: *"four, three, five... two, five, eight... nine, five, nine, eight"*
- **Emails:** Spell out symbols: "at" for @, "dot" for period, "underscore" for _, "dash" for hyphen

### Use Casual Affirmations

Replace formal language with conversational responses:

| Robotic | Natural |
|---------|---------|
| "Understood." | "Got it!" |
| "Certainly." | "Sure thing!" |
| "I will assist you with that." | "I can help with that!" |
| "Please hold while I process your request." | "Just one moment." |

### Silence Handling

Define explicit silence timeouts to prevent dead air:

```
4s silence → "Are you there?"
4s more silence → "I'm here to help! May I start with your name?"
5s more silence → "I can't hear you, so I'm going to hang up.
                    Please call back if you need help." [End Call]
```

### One Question Per Turn

Never stack multiple questions in a single response. The caller can only answer one thing at a time, and stacking causes confusion and missed data:

- **Wrong:** *"What's your name, and what are you calling about today?"*
- **Right:** *"Who am I speaking with today?"* → wait → *"What can I help you with?"*

---

## 6 — HIPAA Compliance & PHI Handling

### Platform BAA Chain

Every platform that touches patient data needs a Business Associate Agreement (BAA). The typical chain:

```
Covered Entity (Clinic) ← BAA → AI/Tech Provider
                         ← BAA → Voice Platform (Retell AI)
                         ← BAA → CRM (GoHighLevel)
                         ← BAA → SMS/Telephony (Twilio)
```

If any link in this chain is missing, the system is non-compliant. Verify BAA status with every vendor before go-live.

### Prompt-Level HIPAA Guardrails

Build these rules directly into the prompt:

1. **Never provide medical diagnoses or treatment advice.** The AI is a receptionist, not a clinician.
2. **Never read back test results or imaging findings.** Always defer: *"Your results would come from your referring physician."*
3. **Never recommend specific scans based on symptoms.** The AI can describe what a scan does generally but cannot recommend one over another.
4. **Defer clinical questions to the referring physician.** *"That's something your doctor would need to determine based on your specific situation."*
5. **Keep SMS messages generic.** Never include patient names, diagnoses, appointment details, or any PHI in text messages.

### Call Recording & Transcript Retention

- Call recordings and transcripts are retained by the voice platform under their data retention policies
- Ensure the voice platform's retention settings align with the clinic's records retention requirements
- Staff emails containing intake data should go to clinic-controlled inboxes (not personal email)

---

## 7 — SMS Automation & A2P 10DLC Compliance

### A2P 10DLC Registration is Mandatory

Any business sending automated SMS messages in the US must register through the A2P 10DLC system. Without registration, carriers (AT&T, Verizon, T-Mobile) will block or throttle messages.

**Registration checklist:**

| Item | Details |
|------|---------|
| Brand Registration | Business name, EIN, address, contact info |
| Campaign Registration | Use case (e.g., `customer-care`), description, sample messages |
| Website compliance | SMS Terms page with opt-out language, Privacy Policy with SMS section |
| Keyword auto-responses | STOP, HELP, START keywords configured |
| Estimated cost | ~$59 one-time (brand + vetting + campaign) + ~$10/month |

### Verbal SMS Consent Collection

The AI must collect explicit verbal consent before sending any SMS. Include standard disclosure language:

*"Would you like to receive updates via text to this number? Standard message and data rates may apply."*

Store consent as a binary variable (`sms_consent = "YES" / "NO"`). Never send SMS without a "YES" on record.

### SMS Message Design Rules

1. **Include business name** at the start of every message: *"First Choice Imaging: ..."*
2. **Include STOP opt-out** at the end: *"Reply STOP to unsubscribe."*
3. **No PHI** — keep messages generic. Link to forms/portals rather than including patient details.
4. **Intent-specific links** — different SMS templates for different caller types (patients vs. providers vs. attorneys).

---

## 8 — Multi-Location Architecture

### One Agent Per Location, Shared Logic

Each location gets its own AI agent with:
- Location-specific greeting, address, hours, and services
- Location-specific knowledge base and FAQ answers
- Shared call flow structure, webhook variables, and guardrails

### Cross-Location Transfer Directory

Include a phone directory in each prompt so the AI can offer transfers to other locations:

```
| Location              | Phone Number   | Transfer Trigger       |
|-----------------------|----------------|------------------------|
| Tooele Valley Imaging | (435) 882-1674 | Transfer to `Tooele`   |
| Sandy (Wasatch)       | (801) 576-1290 | Transfer to `Sandy`    |
```

### Central Hub Agent (Optional)

For organizations with a shared main number, a "hub" agent can:
- Identify which location the caller needs
- Route to the correct location-specific agent
- Handle general inquiries that don't require a specific location

The hub agent has the most complex routing logic and should be built last, after all location agents are stable.

### Forwarding DIDs

Provision dedicated phone numbers for call transfer destinations:

1. **Scheduling DID** — Where scheduling transfers land
2. **Front Desk / Miscellaneous DID** — Where gated live operator transfers land

These DIDs must be provisioned and configured before transfers go live.

---

## 9 — Common Mistakes & How to Avoid Them

### 1. Overusing the Caller's Name
**Problem:** AI says the caller's name in every response, sounding robotic.
**Fix:** Hard limit of 3 name uses per call. Greeting, optional mid-call, closing.

### 2. Not Collecting Identity First
**Problem:** Caller asks a question, AI answers, call drops — no contact info on record.
**Fix:** Make name + phone collection mandatory before any workflow begins. The AI should deflect questions until identity is captured.

### 3. Missing Webhook Variables
**Problem:** Call ends but webhook data is incomplete — staff can't act on the intake.
**Fix:** Pre-close completeness check built into the prompt. Agent silently verifies all required fields before saying goodbye.

### 4. Transferring Solicitations to Staff
**Problem:** Sales calls, donation requests, and vendor pitches get transferred to busy staff.
**Fix:** Dedicated solicitation blocking protocol with 3-step escalation. Never include "vendor" or "sales" as valid transfer reasons.

### 5. Reading Robotic Addresses and Numbers
**Problem:** TTS reads "630 E 1400 N" as individual characters.
**Fix:** Instruct the agent to speak naturally: "Six thirty East, fourteen hundred North."

### 6. Stacking Multiple Questions
**Problem:** AI asks name and reason in one breath — caller answers one, the other is lost.
**Fix:** One question per turn. Wait for a response before asking the next question.

### 7. No Silence Handling
**Problem:** Dead air on the call with no recovery.
**Fix:** Define explicit silence timeouts with escalating prompts, ending in a polite disconnect.

### 8. Providing Medical Advice
**Problem:** AI recommends scans or interprets symptoms, creating liability.
**Fix:** Hard guardrail in the prompt: never diagnose, never recommend scans, always defer to the physician.

### 9. Sending SMS Without Consent
**Problem:** Automated texts sent without explicit opt-in — compliance violation.
**Fix:** Verbal consent collection with binary storage. No SMS without "YES."

### 10. Variable Name Conflicts in Multi-Intent Calls
**Problem:** Caller asks about records AND billing — billing patient name overwrites records caller name.
**Fix:** Intent-prefixed variables: `records_caller_type`, `billing_patient_name`, etc.

---

## 10 — Client Discovery Questionnaire

> Use these questions during the discovery phase to gather the information needed to build a voice AI receptionist for a new medical clinic client. Organize the conversation around these categories.

### A. Business Overview

1. What is the full legal name of the practice or clinic?
2. How many locations do you operate? List each with address and phone number.
3. What are the hours of operation for each location?
4. What services does each location offer? (e.g., MRI, CT, X-ray, Ultrasound, Physical Therapy)
5. Do any locations share a phone line or function under a parent brand?
6. What is the main website URL? Are there location-specific pages?

### B. Current Phone Workflow

7. Who currently answers the phones? (receptionist, call center, voicemail, phone tree)
8. What are the most common reasons patients call? Rank by volume.
9. What percentage of calls are scheduling vs. billing vs. records vs. other?
10. Are there peak call times or days where calls are frequently missed?
11. What happens to calls that go unanswered today?
12. How many calls per day/week does each location typically receive?

### C. Scheduling

13. What scheduling system do you use? (Epic, Athena, NextGen, GHL, etc.)
14. Can the AI book appointments directly, or should it transfer to a scheduler?
15. Do patients need a referral or order before scheduling?
16. Are there self-referral services (no doctor's order needed)?
17. What preparation instructions exist for each service type?

### D. Medical Records & Reports

18. How do patients currently request medical records?
19. Do you use an online form or portal for records requests? What is the URL?
20. Do you distinguish between medical records transfers and radiology report requests?
21. How do providers access records? (PACS, portal, fax, email)
22. Do attorneys contact you about records or liens? If so, what information do you need from them?

### E. Billing

23. Who handles billing inquiries? (in-house team, third-party billing company)
24. What email address should billing inquiries be routed to?
25. What patient information do you need to look up a billing account? (name, DOB, account number)
26. Are there common billing questions you'd want the AI to answer directly? (accepted insurance, payment plans, etc.)

### F. Call Transfers & Staff Routing

27. What departments or roles should the AI be able to transfer calls to?
28. For each transfer destination, provide the forwarding phone number or extension.
29. Should any transfers be "gated" (AI tries to help first) vs. immediate?
30. Are there call types you explicitly do NOT want transferred to staff? (sales, solicitations, surveys)

### G. Compliance & Technology

31. Is the practice a HIPAA covered entity? (If medical, yes.)
32. Do you have existing BAAs with your CRM and phone system vendors?
33. What CRM or patient management system do you use?
34. Do you currently send SMS/text messages to patients? If so, through what platform?
35. Have you completed A2P 10DLC registration for SMS? If not, do you have an EIN available?
36. Does your website have a Privacy Policy page? An SMS Terms page?

### H. AI Agent Preferences

37. What should the AI agent's name be? (e.g., "Ashley," "Jessica")
38. What tone should the agent use? (warm and casual, professional and formal, somewhere in between)
39. Are there specific phrases or language the practice uses that the AI should adopt?
40. Are there topics the AI should absolutely never discuss? (pricing, specific results, insurance eligibility)
41. Should the AI attempt to answer clinical questions at a general level, or refuse all medical questions entirely?
42. What should happen if a caller insists on speaking to a human?

### I. Automation & Follow-Up

43. What should happen after a call ends? (email to staff, SMS to caller, CRM update, all of the above)
44. Which staff email addresses should receive intake notifications? Map by intent type.
45. What information should each notification email contain?
46. Should callers receive a follow-up SMS after the call? If so, with what content?
47. Do you want different SMS messages for different caller types? (patients vs. attorneys vs. providers)

### J. Success Metrics

48. What does success look like for this project? (fewer missed calls, reduced hold times, staff time saved)
49. How will you measure whether the AI is performing well?
50. What's your timeline for go-live? Is there a phased rollout plan?
51. Who is the primary point of contact for testing and feedback?

---

*AI Voice Receptionist Best Practices Guide*
*Prepared by Brian Randall, Auragentics LLC | March 5, 2026*
