# AI Voice Agent Implementation Plan: Infrastructure & Routing

Client: First Choice Imaging Prepared By: Auragentics LLC Subject: Resolving the "Extension Bottleneck" for AI Routing  
---

## 1\. Executive Summary

First Choice Imaging currently utilizes a legacy-style VoIP configuration: one main number per location with internal extensions. To implement high-performance AI Voice Agents that can route calls to specific departments (Scheduling, Billing, Records), the underlying telephony infrastructure must be modernized.  
The Current Pain Point: The current IVR system ("Press 1 for Scheduling, Press 2 for Records...") is causing significant friction. High call volumes combined with rigid menu structures lead to caller backlogs, frequent hang-ups, and "redial loops"—exacerbating the very problem the IVR was meant to solve.  
The Solution: By deploying an AI Voice Agent as a "Smart Switch," we can eliminate the "Press X" menu entirely. The AI engages callers naturally, handles basic FAQs immediately, and routes technical requests directly to departmental DIDs, relieving the backlog and improving patient satisfaction.  
---

## 2\. Resolving the "Extension Bottleneck"

Modern AI Voice Agents process handoffs as peer-to-peer transfers. They are designed to "flash hook" or "blind transfer" to a standard 10-digit phone number (DID).

### The Problem

AI agents cannot reliably dial a main number, wait for an IVR, and then enter an extension (e.g., 555-0101 \-\> Wait \-\> "2" for Billing). This leads to dropped calls, "dead air," or failure to connect to the right desk.

### The Requirement: Internal VoIP Upgrade (DIDs)

To modernize the setup while keeping your current provider:

* Action: Your current VoIP provider must assign a unique 10-digit number (Direct Inward Dial) to every department or "ring group."  
* How it Works: The AI agent perceives "Billing" as a direct number (e.g., 555-0200) rather than an extension.  
* Pros: Minimal change to existing hardware/contracts.  
* Cons: Requires manual technical coordination with your current phone vendor; potentially higher monthly costs per DID.

---

## 3. Architecture: Local Personalities Model

Each location has its own dedicated AI voice agent, customized for that specific clinic.

* **How it works:** Each location stays 100% independent. Sandy's AI only knows Sandy; Tooele's AI only knows Tooele; etc.
* **Pros:** Highest level of local personalization; no location switching risk; each agent verifies caller reached the correct location.
* **Cons:** Requires maintaining separate prompts per location (mitigated by consistent structure across all prompts).

### Initial Rollout Locations

| Location | Agent Prompt | Status |
| :---- | :---- | :---- |
| Logan MRI Clinic | LoganVoiceAgentPrompt.md | Ready |
| North Logan CT Clinic | NorthLoganVoiceAgentPrompt.md | Ready |
| Tooele Valley Imaging | TooeleVoiceAgentPrompt.md | Ready |
| Sandy (Wasatch Imaging) | SandyVoiceAgentPrompt.md | Ready |
| St. George | StGeorgeVoiceAgentPrompt.md | Coming Soon |

---

## 4. HIPAA & PHI Compliance

Auragentics LLC implements and maintains full HIPAA compliance to protect Protected Health Information (PHI). As the AI agent will be accepting inbound calls and interacting with patients, Auragentics operates under a Business Associate relationship with First Choice Imaging (the Covered Entity).  
Compliance Highlights:

* Infrastructure Isolation: Compliance is maintained by isolating the call processing and data storage within a dedicated, HIPAA-compliant secure environment.  
* Encryption: All data, including voice streams and transcripts, are encrypted in transit and at rest using industry-standard protocols.  
* Contractual Security: Auragentics will execute a Business Associate Agreement (BAA) with First Choice Imaging to formalize these security and privacy obligations.

---

## 5. Universal Routing Logic

The AI will utilize the following triggers to route calls directly to the departmental DIDs:

| Destination | Trigger Keywords | Operational Requirement |
| :---- | :---- | :---- |
| Scheduling | "appt," "book," "MRI," "X-ray" | Dedicated DID (No Extension) |
| Records | "results," "CD," "medical records" | Dedicated DID (No Extension) |
| Billing | "cost," "invoice," "pay my bill" | Dedicated DID (No Extension) |
| Gen Info | "hours," "fax," "address" | AI Answers Directly |

---

## 6. Implementation Roadmap

### Phase 1: Initial Launch (4 Locations)
1. **DID Provisioning:** Secure dedicated 10-digit numbers for Scheduling, Records, Billing, and Insurance for Logan, North Logan, Tooele, and Sandy.
2. **Forwarding Logic:** Configure call forwarding from each location's main line to its dedicated AI agent.
3. **AI Training:** Load location-specific data (address, hours, services, pricing) into each agent's knowledge base.
4. **Testing:** Pilot test at each location before going live.
5. **Go Live:** Launch AI agents at all 4 locations.

### Phase 2: St. George (Coming Soon)
6. **St. George Launch:** Deploy AI agent when location opens, following the same process.

---

## 7. Next Steps

* **Action Item:** Provide current VoIP contract details and initiate DID provisioning with your provider for all 4 launch locations.
* **Action Item:** Confirm department DIDs (Scheduling, Records, Billing, Insurance) for Logan, North Logan, Tooele, and Sandy.
* **Action Item:** Schedule pilot testing window for each location.

