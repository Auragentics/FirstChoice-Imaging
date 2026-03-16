# First Choice Imaging — AI Voice Agent Executive Summary

> **Confidential — Executive Document**

| | |
|---|---|
| **Prepared For** | David Carter, CEO & Jeremy Bennett, COO — First Choice Imaging |
| **Prepared By** | Brian Randall — Auragentics LLC |
| **Date** | March 13, 2026 |
| **Project Status** | Systems Go — Pending BAA |

---

## Project Overview

First Choice Imaging has engaged Auragentics LLC to design and deploy an AI-powered voice agent system across its clinic network. The system replaces a traditional phone tree and receptionist intake workflow with a conversational AI that handles inbound patient calls 24/7. The AI answers patient questions, collects structured intake data, routes calls to the appropriate department, and automatically triggers follow-up communications — all without manual staff intervention.

The project spans five clinic locations, a centralized data pipeline, compliant SMS communication infrastructure, and HIPAA-aware architecture decisions throughout.

---

## What Was Built

### 1 — Voice AI & Prompt Engineering

Each clinic location has a dedicated AI voice agent with a custom "personality" — its own clinic knowledge, services, hours, and call handling rules. The agents were built using Retell AI and configured with detailed natural-language instructions (prompts) that govern exactly how the AI behaves on every call.

| Clinic Location | AI Agent Name | Status |
|---|---|---|
| Logan MRI Clinic / North Logan CT Clinic | Ethan AI | Ready |
| Tooele Valley Imaging | Leo AI | Ready |
| Sandy — Wasatch Imaging | Marcus AI | Ready |
| St. George | Luke AI | Ready |
| Central Hub (Multi-location routing) | — | In Progress |

**Agent Capabilities (Prompt v6.0):**
- Answer questions about services, FAQs, general information, hours, locations, and insurance
- Route scheduling and billing calls immediately — no data collection needed
- Handle medical records requests with caller type routing (patient → online form + SMS link, provider → PACS/portal + front desk, attorney → collect full intake data)
- Handle attorney lien requests — collecting all required intake data verbally
- Live person escalation protocol — attempt to help before transferring (up to 3 attempts)
- Route callers by intent to Scheduling, Billing, or Receptionist, with inter-clinic transfers
- Offer SMS opt-in for follow-up communications (compliant verbal consent)
- PACS/Provider Portal guidance for providers requesting access or password resets

**Deliverables (16 files + archives):**
- 6 location-specific agent prompt files (Logan, North Logan, Tooele, Sandy, St. George, Central Hub) — v6.0
- Agent variable definitions, call flow diagram, and interactive workflow visualization
- AI rollout architecture and location phasing plan
- 3 compiled knowledge bases (FAQs, Exam Prep, General)
- Test scenarios and automated test runner for voice agent QA
- 22-version archived prompt revision history

### 2 — Webhook Automation

When a call ends, Retell AI analyzes the call transcript and automatically extracts all collected information into structured data fields. That data is fired as a webhook directly into GHL, where it creates or updates a contact record and triggers automated workflows.

> **GHL Configuration Completed:** All inter-clinic call transfer functions, custom webhook integration, and contact information update triggers and workflows were built and configured directly within GHL — no external server required.

**Data Flow:**

```
Call Ends → Retell Analyzes Transcript → Webhook Fires → GHL Receives Data
→ Contact Created/Updated → Email(s) Sent to Staff → SMS Sent to Caller
```

**Key capability — Intent Routing:** A routing variable tells the system which workflows the caller completed (e.g., `records,lien`). GHL uses this to fire multiple emails simultaneously if a caller addressed more than one topic. Scheduling and billing calls are transferred immediately without data collection or webhook triggers.

**Deliverables (5 files):**
- Full automation logic, payload structure, and routing rules document
- Visual diagram of the automation workflow
- Configuration guide for all 16 AI-extracted data fields in Retell
- Step-by-step GHL setup guide: custom fields, workflow logic, webhook mapping
- Visual diagram of the GHL workflow

### 3 — Email & SMS Automation

#### Staff Email Notifications

After each call, structured intake emails are automatically sent to the appropriate First Choice Imaging staff inbox. Every email is pre-populated with the caller and patient data the AI collected during the call — no manual transcription required.

| Intent | Email Sent To | Subject Line Format |
|---|---|---|
| Billing Inquiry | billing@firstchoice-imaging.com | `BILLING INQUIRY | [Patient]` |
| Attorney Lien Request | orders@firstchoice-imaging.com | `LIEN REQUEST | [Patient]` |

Each email includes caller name, phone number, patient details (for billing and lien), and a link to the call recording and transcript.

#### SMS Messages Sent to Callers

When a caller consents to SMS, the system sends a targeted text message based on the caller type and intent. Medical records and report requests are handled entirely via SMS — directing callers to the appropriate online form or portal.

| Caller Type / Intent | SMS Message |
|---|---|
| **Attorney** — Records Request | First Choice Imaging: Thank you for contacting us. Please visit https://firstchoiceimaging.com/attorneys/# select "Request Medical Records" and submit the completed form. Reply STOP to unsubscribe. |
| **Patient** — Radiology Report | First Choice Imaging: Thank you for contacting us. Please visit https://firstchoice-imaging.com/patients/ select "Radiology Report" and submit completed form or email us directly at medicalrecords@firstchoice-imaging.com Reply STOP to unsubscribe. |
| **Patient** — Medical Records | First Choice Imaging: Thank you for contacting us. Please visit https://firstchoice-imaging.com/medical-records-request and submit the completed form or email us directly at medicalrecords@firstchoice-imaging.com Reply STOP to unsubscribe. |
| **Provider** — Records/Reports | First Choice Imaging: Thank you for contacting us. Please visit https://firstchoice-imaging.com/provider/ sign up or log into the portal to request records or email us directly at medicalrecords@firstchoice-imaging.com Reply STOP to unsubscribe. |
| **Attorney** — Lien Request | First Choice Imaging: Thank you for contacting us. Your Lien request has been received by our staff and is currently being processed. Visit https://firstchoice-imaging.com/attorneys/ for portal access, records, direct liens, or funding requests. Reply STOP to unsubscribe. |
| **Billing** — Inquiry Confirmation | First Choice Imaging: Thank you for contacting us. Your billing inquiry has been received by our billing support team. We will contact you with an answer soon. Reply STOP to unsubscribe. |

### 4 — A2P 10DLC SMS Registration

A2P 10DLC ("Application-to-Person, 10-Digit Long Code") is the federal regulatory registration required for any business sending SMS messages at scale in the United States. Without this registration, carrier networks (AT&T, Verizon, T-Mobile) will block or filter messages. This is not optional.

| Completed Step | Status |
|---|---|
| Brand Registration details compiled (EIN, business info, contacts) | Complete |
| Campaign use case defined — `customer-care` | Complete |
| Campaign description written and compliance-reviewed | Complete |
| Opt-in language for voice agent finalized | Complete |
| Sample SMS messages written and analyzed | Complete |
| STOP / HELP / START keyword auto-responses written | Complete |
| Privacy Policy and SMS Terms gap analysis completed | Complete |
| Estimated registration costs documented | Complete |
| Submission process documented step-by-step | Complete |

> **Client-Side Actions — All Complete:**
> 1. ~~Update `/sms-terms` page on firstchoice-imaging.com with opt-out language~~ — **Done**
> 2. ~~Update `/privacy` page to add SMS section~~ — **Done**
> 3. ~~Configure STOP/HELP/START auto-responses in GHL~~ — **Done**
> 4. ~~Submit brand and campaign registration through GHL Trust Center~~ — **Done**

**Registration costs:** ~$59 (brand + vetting + campaign fees) + $10/month ongoing

---

## HIPAA Compliance & BAA Status

### Platform Stack — HIPAA Compliance Complete

| Platform | Role | BAA Status |
|---|---|---|
| **GHL** | CRM, webhook integration, email automation, SMS | Complete |
| **Retell AI** | Voice agent platform, call recording & transcription | Covered under GHL HIPAA package |
| **Twilio** (via GHL) | SMS delivery infrastructure | Covered under GHL HIPAA package |

**AI Voice Agent HIPAA Guardrails (built into all prompts):**
- Agents never provide medical diagnoses, treatment advice, or read back test results
- Agents defer all clinical questions to the patient's referring physician
- SMS messages are intentionally generic — no PHI transmitted via text
- Call recordings and transcripts are retained by Retell AI under their data retention policies

---

## Supporting Infrastructure

| Asset | Purpose |
|---|---|
| `compile_data.py / crawler.js` | Scripts used to crawl firstchoice-imaging.com and compile clinic-specific knowledge for agent training |
| `FirstChoice_Data_Compiled.html` | Compiled website data used as the knowledge base source |
| `First Choice Imaging - Deep Crawl Data.pdf` | Full website data export |
| `First Choice Imaging FAQs_.pdf` | Printable FAQ document |
| AI Voice Agent Implementation Plan (PDF/HTML) | Formatted deliverable versions of the implementation plan |

---

## Complete File Inventory

| # | File / Folder | Category |
|---|---|---|
| 1 | `AI_Voice_Agent_Implementation_Plan.md` | Voice AI — Architecture |
| 2 | `LoganVoiceAgentPrompt.md` | Voice AI — Prompt |
| 3 | `NorthLoganVoiceAgentPrompt.md` | Voice AI — Prompt |
| 4 | `TooeleVoiceAgentPrompt.md` | Voice AI — Prompt |
| 5 | `SandyVoiceAgentPrompt.md` | Voice AI — Prompt |
| 6 | `StGeorgeVoiceAgentPrompt.md` | Voice AI — Prompt |
| 7 | `CentralHubVoiceAgentPrompt.md` | Voice AI — Prompt (Hub) |
| 8 | `LoganVoiceAgentVariables.md` | Voice AI — Configuration |
| 9 | `LoganClinicWorkflowDiagram.md` | Voice AI — Call Flow |
| 10 | `LoganClinicWorkflowVisual.html` | Voice AI — Visual |
| 11 | `First Choice Imaging FAQs.md` | Voice AI — Knowledge Base |
| 12 | `Archived Prompts/` (22 files) | Voice AI — Revision History |
| 13 | `WebhookEmailAutomation.md` | Webhook — Logic |
| 14 | `WebhookEmailAutomationVisual.html` | Webhook — Visual |
| 15 | `RetellPostCallAnalysisFields.md` | Webhook — Retell Config |
| 16 | `GHL_VoiceAgent_Integration_Guide.md` | Email — GHL Setup |
| 17 | `GHL_WorkflowVisual.html` | Email — Visual |
| 18 | `A2P-10DLC-Registration-Plan.md` | SMS — Registration |
| 19 | `PhoneSystem_Integration_Spec.md` | Phone System — Integration Spec |
| 20 | `PhoneSystem_Integration_Spec.html` | Phone System — Visual |
| 21 | `FirstChoice_KnowledgeBase.md` | Voice AI — Knowledge Base |
| 22 | `FirstChoice_FAQ_KnowledgeBase.md` | Voice AI — FAQ Knowledge Base |
| 23 | `FirstChoice_ExamPrep_KnowledgeBase.md` | Voice AI — Exam Prep Knowledge Base |
| 24 | `TestScenarios.md` | Testing — 86 Test Scenarios |
| 25 | `test-runner/` (scenarios.js, run-tests.js, view-results.js) | Testing — Automated Test Runner |
| 26 | `TestAgentPrompt_1.md / TestAgentPrompt_2.md` | Testing — Test Agent Prompts |
| 27 | `Logan_Voice_Agent_Test_Reports.md` | Testing — Test Results |
| 28 | `GHL_Automation_Buildout_Guide.md` | Email — GHL Buildout Guide |
| 29 | `GHL_AutomationsFlowDiagram.html` | Email — Automations Visual |
| 30 | `AI_Voice_Receptionist_Best_Practices.md` | Voice AI — Best Practices |
| 31 | `VPS_Deployment_Instructions.md` | Infrastructure — Deployment |
| 32 | `compile_data.py / crawler.js` | Infrastructure — Data Tools |
| 33 | `FirstChoice_Data_Compiled.html` | Data — Knowledge Base Source |
| 34 | `First Choice Imaging - Deep Crawl Data.pdf` | Data — Website Export |

**Total: 34 primary deliverables** + 22 archived prompt versions

---

## Project Timeline

| Date | Milestone |
|---|---|
| January 18, 2026 | Initial AI Voice Agent implementation plan |
| February 5, 2026 | Webhook email automation workflow designed |
| February 11, 2026 | GHL integration guide completed |
| February 27, 2026 | Retell Post-Call Analysis fields finalized |
| March 2026 | A2P 10DLC registration plan and compliance review |
| March 2026 | All 5 location agent prompts finalized (v5.0) |
| March 2026 | Phone System Integration Spec completed |
| March 10, 2026 | Executive Summary delivered |
| March 13, 2026 | Prompt v6.0 — Intent-based routing restructure, live person escalation, PACS/portal guidance, TTS pronunciation fixes |
| March 13, 2026 | Automated test runner and 86 test scenarios built |

---

## Summary of Remaining Actions

All technical systems are configured and operational. The remaining actions before full go-live are:

### 1. Execute HIPAA Business Associate Agreement (BAA)

**Between:** Auragentics LLC (AI/technology provider) & First Choice Imaging (covered entity)

All vendor-level BAAs (GHL, Retell AI, Twilio) are in place. This final agreement formalizes the business relationship between Auragentics and First Choice Imaging under HIPAA requirements. **Required before go-live.**

### 2. Provision Dedicated Forwarding Phone Numbers (10DLC DIDs)

Two dedicated 10DLC phone numbers are required as transfer destinations from the AI voice agents:

1. **Scheduling DID** — Forwarding destination for all scheduling-related transfers (book, reschedule, cancel appointments)
2. **Front Desk DID** — Forwarding destination for calls that require a live receptionist (complaints, vendor inquiries, complex issues)

These numbers can be provisioned per clinic or shared across all clinics, depending on the inbound call structure for existing scheduling and front desk staff/departments. Numbers must be configured in the phone system before call transfers can go live. **Required before go-live.**

---

*First Choice Imaging — AI Voice Agent Executive Summary*
*Prepared by Brian Randall, Auragentics LLC | March 13, 2026*
