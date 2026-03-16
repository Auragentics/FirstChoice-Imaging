# First Choice Imaging — AI Voice Agent Implementation Plan

## Overview

This document outlines the implementation plan for deploying AI voice agents across First Choice Imaging clinic locations to handle incoming calls, answer common questions, and route callers to appropriate departments.

---

## Architecture: Local Personalities Model

Each clinic location will have its **own dedicated AI voice agent** with a phone number and prompt customized for that location. This model provides:

- **Location-specific knowledge** — Each agent knows only its own clinic's address, hours, services, and pricing
- **Simplified call routing** — Agents transfer to local departments only, no cross-location routing needed
- **Caller verification** — Each agent confirms the caller has reached the intended location
- **Scalability** — New locations can be added independently

---

## Rollout Plan

### Phase 1: Initial Launch (4 Locations)

| Location | Status | Agent Prompt |
|----------|--------|--------------|
| **Logan MRI Clinic** | Ready | LoganVoiceAgentPrompt.md |
| **North Logan CT Clinic** | Ready | NorthLoganVoiceAgentPrompt.md |
| **Tooele Valley Imaging** | Ready | TooeleVoiceAgentPrompt.md |
| **Sandy (Wasatch Imaging)** | Ready | SandyVoiceAgentPrompt.md |

### Phase 2: Coming Soon

| Location | Status | Agent Prompt |
|----------|--------|--------------|
| **St. George** | Opening Soon | StGeorgeVoiceAgentPrompt.md |

---

## Per-Location Configuration

Each location requires:

1. **Dedicated phone number** — Assigned to the AI voice agent
2. **Location-specific prompt** — Customized with local address, hours, services, pricing
3. **Department transfer DIDs** — Local numbers for Scheduling, Records, Insurance, Billing
4. **Knowledge base** — Location-specific FAQ and service information

---

## Department Transfer Routing

Each AI agent can transfer callers to the following departments at their respective location:

| Transfer Trigger | Department |
|------------------|------------|
| Scheduling appointments | Scheduling |
| Medical records/reports | Medical Records |
| Insurance questions | Insurance |
| Billing/payments | Billing |

---

## Agent Capabilities

Each AI voice agent is designed to:

### Answer Directly (No Transfer Needed)
- Clinic location and hours
- Services offered and self-pay pricing
- Preparation instructions (what to wear, fasting, contrast)
- Walk-in policies (X-ray walk-ins at Tooele)
- General imaging FAQs

### Transfer to Human Staff
- Appointment scheduling, rescheduling, cancellation
- Medical records requests
- Insurance/prior authorization questions
- Billing inquiries

---

## Data Collection

Every call collects:
1. Caller name
2. Phone number
3. Email address
4. Reason for call

---

## Guardrails

All agents are instructed to:
- Never provide medical advice
- Never make up answers (only use Knowledge Base/FAQ)
- Defer to the caller's doctor for medical guidance
- Follow the Transfer Execution Protocol (complete speech before triggering transfer)

---

## Prompt Files

| Location | Prompt File |
|----------|-------------|
| Sandy (Wasatch Imaging) | `SandyVoiceAgentPrompt.md` |
| Logan MRI Clinic | `LoganVoiceAgentPrompt.md` |
| North Logan CT Clinic | `NorthLoganVoiceAgentPrompt.md` |
| Tooele Valley Imaging | `TooeleVoiceAgentPrompt.md` |
| St. George (Coming Soon) | `StGeorgeVoiceAgentPrompt.md` |

---

*Last Updated: January 18, 2026*
