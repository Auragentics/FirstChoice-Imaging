# First Choice Imaging — Phone System Integration Specification

## AI Voice Agent Connection & Call Forwarding Guide

> **Document Purpose:** This specification provides First Choice Imaging technical staff with complete instructions for connecting clinic phone lines to the AI Voice Agent system, including call forwarding configuration, new DID line requirements, and SMS routing details.
>
> **Change Requests:** Direct all change requests, questions, or issues to **Brian Randall** at **brandall@auragentics.ai**

---

## 1. System Overview

Each First Choice Imaging clinic will forward its main phone line to an assigned AI Voice Agent. The AI agent answers inbound calls, handles caller inquiries, and transfers callers to the appropriate department when needed. Transfers to **Scheduling** and **Live Operator** are routed to new dedicated DID lines provisioned per clinic.

---

## 2. AI Voice Agent Directory

Each clinic is assigned a dedicated AI Voice Agent with a unique inbound phone number. All inbound AI numbers are **A2P 10DLC verified**.

| Clinic Location | AI Agent Name | AI Inbound Number | Forwarding Source |
|-----------------|---------------|--------------------|-------------------|
| Logan MRI Clinic / North Logan CT Clinic | Ethan AI | **+1 (435) 292-5652** | (435) 258-9598 |
| Sandy (Wasatch Imaging) | Marcus AI | **+1 (385) 458-4168** | (801) 576-1290 |
| Tooele Valley Imaging | Leo AI | **+1 (435) 557-4243** | (435) 882-1674 |
| St. George | Luke AI | **+1 (435) 241-1182** | TBD |

> **Note:** Logan MRI Clinic and North Logan CT Clinic share the same main line — **(435) 258-9598**. Ethan AI handles calls for both locations.

---

## 3. Caller Greeting Format

All AI Voice Agents will greet callers with the following standardized opening:

> *"Hi, thank you for calling First Choice Imaging in [Clinic Location]. This is [AI Voice Agent Name]. I am generative artificial intelligence and not a human. How can I help you today?"*

**Examples by location:**

| Location | Greeting |
|----------|----------|
| Logan / North Logan | *"Hi, thank you for calling First Choice Imaging in Logan. This is Ethan. I am generative artificial intelligence and not a human. How can I help you today?"* |
| Sandy | *"Hi, thank you for calling First Choice Imaging in Sandy. This is Marcus. I am generative artificial intelligence and not a human. How can I help you today?"* |
| Tooele | *"Hi, thank you for calling First Choice Imaging in Tooele. This is Leo. I am generative artificial intelligence and not a human. How can I help you today?"* |
| St. George | *"Hi, thank you for calling First Choice Imaging in Saint George. This is Jeff. I am generative artificial intelligence and not a human. How can I help you today?"* |

---

## 4. New DID Lines Required

Each clinic must provision **two (2) new 10DLC DID phone lines** for transfer destinations. These lines receive calls transferred by the AI agent and must be staffed or routed to the appropriate personnel.

| Line Purpose | Description | Staffing |
|-------------|-------------|----------|
| **Scheduling Line** | Receives transferred calls for booking, rescheduling, or canceling appointments | Scheduling staff |
| **Miscellaneous Line** | Receives transferred calls for live operator requests, complaints, vendor calls, and other inquiries the AI cannot resolve | Front desk / receptionist |

### DID Line Provisioning Checklist

| Clinic | Scheduling DID | Miscellaneous DID | Status |
|--------|---------------|-------------------|--------|
| Logan / North Logan | _________________ | _________________ | Pending |
| Sandy (Wasatch Imaging) | _________________ | _________________ | Pending |
| Tooele Valley Imaging | _________________ | _________________ | Pending |
| St. George | _________________ | _________________ | Pending |

> **Action Required:** Once provisioned, provide the new DID numbers to Brian Randall at **brandall@auragentics.ai** so they can be configured as transfer destinations in the AI Voice Agent system.

---

## 5. Call Forwarding Instructions

Forward each clinic's main phone line to the corresponding AI Voice Agent inbound number. Two forwarding methods are available depending on your preferred call handling approach.

### Option A: Standard Call Forwarding (Immediate)

All inbound calls are forwarded directly to the AI agent with no delay. The clinic phone does not ring.

**Generic Steps (most phone systems):**

1. Access your phone system admin panel or pick up the clinic handset
2. Activate **Unconditional Call Forwarding** (also called "Forward All Calls")
3. Enter the AI agent's inbound number for your location (see Section 2)
4. Confirm the forwarding is active by calling the clinic's main number from an external line
5. Verify the AI agent answers with the correct greeting

**Common Activation Codes (landline/PBX):**

| Action | Code | Example (Logan) |
|--------|------|-----------------|
| Activate forwarding | `*72` + AI number | `*72 4352925652` |
| Deactivate forwarding | `*73` | `*73` |

> **Note:** Activation codes vary by carrier and phone system. Consult your phone provider's documentation if `*72`/`*73` do not work. VoIP systems (e.g., RingCentral, 8x8, Vonage) typically use a web portal or admin app to configure forwarding rules.

### Option B: Time-Delay Forwarding (Delayed / No-Answer)

The clinic phone rings for a set number of seconds before forwarding to the AI agent. This allows staff to answer calls during business hours while the AI handles overflow and after-hours calls.

**Generic Steps:**

1. Access your phone system admin panel
2. Activate **No-Answer Call Forwarding** (also called "Forward on No Answer" or "Delayed Forwarding")
3. Enter the AI agent's inbound number for your location
4. Set the **ring delay** (recommended: 15–20 seconds, typically 3–4 rings)
5. Confirm by calling the main line, letting it ring past the delay, and verifying the AI agent picks up

**Common Activation Codes (landline/PBX):**

| Action | Code | Example (Logan) |
|--------|------|-----------------|
| Activate no-answer forwarding | `*92` + AI number | `*92 4352925652` |
| Deactivate no-answer forwarding | `*93` | `*93` |

> **Note:** The ring delay duration is typically configured in your phone system's admin settings, not via star codes. Contact your phone provider to set the specific delay duration if needed.

### Option C: Combined Forwarding (Busy + No-Answer)

For maximum coverage, enable both **Busy Forwarding** and **No-Answer Forwarding** so the AI agent catches calls when lines are occupied or unanswered.

| Condition | Code | Deactivate |
|-----------|------|------------|
| Forward on Busy | `*90` + AI number | `*91` |
| Forward on No Answer | `*92` + AI number | `*93` |

### VoIP / Cloud PBX Systems

If your clinic uses a VoIP or cloud-based phone system, forwarding is typically configured through the provider's web admin portal:

| Provider | Navigation Path |
|----------|----------------|
| RingCentral | Admin Portal > Phone System > Call Handling > Forwarding Rules |
| 8x8 | Admin Console > Users > Call Forwarding |
| Vonage | Admin Portal > Extensions > Call Routing |
| Nextiva | Admin > Users > Call Flow > Forwarding |
| Generic SIP/PBX | PBX admin panel > Inbound Routes > Destination |

> **Tip:** For VoIP systems, set the forwarding destination as a standard phone number (e.g., `14352925652`), not a SIP URI.

---

## 6. SMS Configuration

### Outbound SMS

All outbound SMS messages sent by the AI system (confirmation texts, status updates, form links) will originate from:

> **+1 (888) 610-1566** (A2P 10DLC Verified)

Or from another number in the verified number pool. Callers who opt in to SMS during their call will receive messages from this number.

### SMS Consent

SMS messages are only sent to callers who provide verbal consent during their call. The AI agent asks:

> *"Would you like to receive status updates via text to this number? Standard message and data rates may apply."*

Callers may opt out at any time by replying **STOP** to any message.

### A2P 10DLC Verification Status

| Number | Type | A2P Status |
|--------|------|------------|
| +1 (435) 292-5652 | AI Inbound (Logan) | Verified |
| +1 (385) 458-4168 | AI Inbound (Sandy) | Verified |
| +1 (435) 557-4243 | AI Inbound (Tooele) | Verified |
| +1 (435) 241-1182 | AI Inbound (St. George) | Verified |
| +1 (888) 610-1566 | Outbound SMS | Verified |

---

## 7. Call Flow Summary

```
Caller dials clinic main number
        │
        ▼
┌─────────────────────────┐
│  Call Forwarding Active  │
│  (Immediate or Delayed)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   AI Voice Agent         │
│   Answers & Greets       │
│   Collects Name & Phone  │
│   Handles Inquiry        │
└───────────┬─────────────┘
            │
     ┌──────┼──────────┐
     ▼      ▼          ▼
 Resolved  Transfer   Transfer
 by AI     to         to Misc
           Scheduling  (Live Op)
     │      │          │
     ▼      ▼          ▼
   [End]  Scheduling  Miscellaneous
          DID Line    DID Line
```

---

## 8. Go-Live Checklist

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Provision 2 new DID lines per clinic (Scheduling + Miscellaneous) | FCI Telecom | [ ] |
| 2 | Provide new DID numbers to Brian Randall (brandall@auragentics.ai) | FCI Telecom | [ ] |
| 3 | Configure AI transfer destinations with new DID numbers | Auragentics | [ ] |
| 4 | Activate call forwarding on clinic main line(s) to AI inbound number | FCI Telecom | [ ] |
| 5 | Test: Call main line → verify AI agent answers with correct greeting | FCI / Auragentics | [ ] |
| 6 | Test: Request scheduling → verify transfer reaches Scheduling DID | FCI / Auragentics | [ ] |
| 7 | Test: Request live operator → verify transfer reaches Miscellaneous DID | FCI / Auragentics | [ ] |
| 8 | Test: Opt in to SMS → verify confirmation text received from (888) 610-1566 | FCI / Auragentics | [ ] |
| 9 | Confirm after-hours behavior (if using time-delay forwarding) | FCI Telecom | [ ] |
| 10 | Staff training: inform team about new Scheduling & Misc DID lines | FCI Management | [ ] |

---

## 9. Troubleshooting

| Issue | Possible Cause | Resolution |
|-------|---------------|------------|
| AI agent doesn't answer | Call forwarding not active | Verify forwarding is enabled; redial `*72` + AI number |
| Caller hears clinic voicemail instead of AI | Voicemail picks up before forwarding triggers | Increase voicemail ring count or switch to immediate forwarding |
| Transfers don't connect | DID lines not provisioned or not configured in AI system | Confirm DID numbers were provided to Auragentics |
| No SMS received after opt-in | Number not in verified pool or carrier filtering | Contact brandall@auragentics.ai |
| Wrong AI agent greeting | Forwarding pointed to wrong AI number | Verify the AI inbound number matches your location (Section 2) |

---

> **Questions or Changes?** Contact **Brian Randall** — **brandall@auragentics.ai**

---

*Document Version: 1.0*
*Last Updated: March 4, 2026*
