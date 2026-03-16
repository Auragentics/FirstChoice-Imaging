# Static Prompt Audit — Tests 1–5
**Target:** Logan MRI Clinic Voice Agent Prompt v5.0
**Method:** Static analysis against LoganTestAgent.md scenarios
**Date:** March 12, 2026

---

## Test 1: P1 — Standard Patient, Scheduling MRI

**Scenario:** Cooperative patient calls to schedule an MRI. Gives name and phone when asked.

### CALL FLOW ANALYSIS:
- Agent greets, confirms Logan location, asks name → Step 1 ✓
- Caller gives name → stored as `caller_name` ✓
- Agent greets with name, asks phone → Step 2 ✓
- Caller gives phone → readback as individual digits ✓
- Caller says "I need to schedule an MRI" → Step 4: Scheduling
- Agent should IMMEDIATELY transfer to `Scheduling` — no data collection needed ✓

### EXPECTED BEHAVIOR:
- Name/phone collected first, then immediate transfer to Scheduling
- No additional data collection for scheduling requests (explicitly stated)

### ACTUAL BEHAVIOR (per prompt):
- Prompt handles this correctly. Scheduling is marked as IMMEDIATE transfer.

### DEFICIENCIES FOUND:
1. **Transfer pacing ambiguity for Scheduling** — Severity: LOW
   - Expected: Clear whether Scheduling transfers skip the Transfer Execution Protocol
   - Actual: Protocol header says "CROSS-LOCATION ONLY" and Scheduling section says "IMMEDIATE — no data collection," but the Transfer Execution Protocol also says "Scheduling transfers are IMMEDIATE — skip this protocol." This is correctly handled but labeled confusingly — the protocol header says "CROSS-LOCATION ONLY" yet billing/receptionist transfers also use it.
   - Prompt Reference: Transfer Execution Protocol header + Step 4 Scheduling

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS** (only at Step 2 greeting)
- [ ] Phone digits read as individual words? **PASS**
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A** (scheduling = no workflow)
- [ ] intents_handled set correctly? **N/A** (scheduling = no workflow)
- [ ] Transfer pacing correct? **PASS** (immediate transfer)
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 2: P3 — Evasive Patient, Asks Hours First

**Scenario:** Caller doesn't give name. Leads with "Yeah, I just need to know your hours." Refuses phone number initially.

### CALL FLOW ANALYSIS:
- Agent greets → Caller responds with "Yeah, I just need to know your hours."
- Agent should redirect to name collection: "I can definitely help with that! First, may I have your name?" (Step 1 CALLER SKIPS NAME rule) ✓
- Caller: "Why do you need that?" — Prompt has no script for this objection
- Eventually gives name → Agent asks for phone
- Caller: "I'm not comfortable giving that out" — Agent circles back once per Step 2 IF EVADES rule ✓
- Caller still refuses → ???

### EXPECTED BEHAVIOR:
- Name collected via skip-handler
- Phone requested, evasion handled with one circle-back
- If still refused, agent should have a terminal path

### ACTUAL BEHAVIOR (per prompt):
- Name skip is handled well
- Phone evasion gets ONE retry: "I understand! I'll just need that number in case we get disconnected."
- **No terminal path if caller refuses phone a second time.** The prompt doesn't say what happens next.

### DEFICIENCIES FOUND:
1. **No terminal path for phone refusal** — Severity: HIGH
   - Expected: After 2 failed attempts to collect phone, the prompt should define a path (proceed without phone, or explain it's required, or offer alternative)
   - Actual: Prompt only has one retry script. After second refusal, agent has no instruction.
   - Prompt Reference: Step 2 (IF EVADES)

2. **No script for "Why do you need my name?"** — Severity: MEDIUM
   - Expected: A brief justification script for name collection objection
   - Actual: Only handles caller skipping name (going straight to question), not actively questioning why name is needed
   - Prompt Reference: Step 1 (CALLER SKIPS NAME)

3. **Hours intent clarification works correctly** — Severity: N/A (PASS)
   - Guideline 16 correctly instructs agent to clarify intent before answering hours
   - Prompt Reference: Guideline 16

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS** (skip-handler exists)
- [x] Phone collected before proceeding? **PARTIAL** (one retry exists, no terminal path)
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **N/A** (phone not provided in this scenario)
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [x] Hours intent clarified before answering? **PASS** (Guideline 16)
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A**
- [ ] intents_handled set correctly? **N/A**
- [ ] Transfer pacing correct? **N/A**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PARTIAL PASS

---

## Test 3: P2 — Anxious Patient, Claustrophobia Questions

**Scenario:** Nervous patient asks about open MRI, machine size, sedation options, and scan duration.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller asks: "Is it an open MRI?"
- Agent clarifies Wide Bore vs Open MRI per Knowledge Base ✓
- Caller asks about sedation → ???
- Caller asks about scan duration → ???

### EXPECTED BEHAVIOR:
- Correctly distinguish Wide Bore from Open MRI
- Provide sedation policy information
- Provide general scan duration info
- Refer to St. George for Open MRI if needed
- Offer reassurance about Wide Bore comfort

### ACTUAL BEHAVIOR (per prompt):
- Wide Bore vs Open MRI clarification is well-scripted ✓
- St. George referral for Open MRI is present ✓
- **Sedation policy is NOT in the Knowledge Base** — agent has no sourced information
- **Scan duration is NOT in the Knowledge Base** — agent has no sourced information

### DEFICIENCIES FOUND:
1. **Sedation policy missing from Knowledge Base** — Severity: HIGH
   - Expected: Information about whether sedation is offered, who provides it, any prep requirements
   - Actual: Not mentioned anywhere in the prompt. Agent must either hallucinate (violates Guideline 4) or say "I don't know" to a very common question.
   - Prompt Reference: Knowledge Base (Logan MRI Clinic) — absent

2. **MRI scan duration missing from Knowledge Base** — Severity: MEDIUM
   - Expected: General duration ranges (e.g., "typically 30-60 minutes depending on the exam")
   - Actual: Not mentioned. Common caller question with no sourced answer.
   - Prompt Reference: Knowledge Base — absent

3. **No reassurance script for anxious callers** — Severity: LOW
   - Expected: Some language about the Wide Bore being more comfortable, open at both ends, etc.
   - Actual: Only states it has "a wider opening than a traditional MRI for added comfort" — minimal reassurance
   - Prompt Reference: Knowledge Base > MRI Machine Details

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **PASS**
- [ ] Email read back slowly with pauses? **N/A**
- [x] No scan recommendations made? **PASS** (agent shares info, doesn't recommend)
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **PASS** (Wide Bore at Logan, Open at St. George)
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A**
- [ ] intents_handled set correctly? **N/A**
- [ ] Transfer pacing correct? **N/A**
- [x] Deferred to doctor when appropriate? **PASS** (Guideline 5 + 11)

### OVERALL GRADE: PARTIAL PASS

---

## Test 4: P14 — Self-Referral Boundary Tester

**Scenario:** Caller wants to self-refer. Probes: contrast MRI, insurance billing, CT scan, and pricing.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "I want to schedule an MRI on my own, no doctor's order."
- Agent explains self-referral rules per Guideline 15 ✓
- Caller: "Can I self-refer for a contrast MRI?" → Guideline 15 says contrast requires provider order ✓
- Caller: "What if I want to use my insurance?" → Guideline 15 says insurance requires provider order ✓
- Caller: "Can I self-refer for a CT scan?" → Guideline 15 says only non-contrast MRI is eligible ✓
- Caller: "How much is the self-referral MRI?" → Guideline 8 says never quote prices ✓... but...

### EXPECTED BEHAVIOR:
- Self-referral limited to non-contrast MRI, self-pay only
- Insurance requires provider order
- CT/other modalities require provider order
- Pricing: redirect to scheduling or decline to quote

### ACTUAL BEHAVIOR (per prompt):
- Self-referral rules are well-defined and comprehensive in Guideline 15 ✓
- Pricing guardrail in Guideline 8 says to transfer to scheduling ✓
- **CONFLICT:** The FAQ Knowledge Base (external file) mentions a $299 self-referral price, but Guideline 8 in the prompt says "Never quote prices." The prompt itself has NO $299 exception.

### DEFICIENCIES FOUND:
1. **$299 self-referral pricing conflict** — Severity: HIGH
   - Expected: Clear rule on whether the $299 self-pay MRI price can be shared (it's a known marketing price)
   - Actual: Guideline 8 says "Never quote prices or reference the website for pricing." The FAQ KB (separate file) mentions $299. If agent follows the prompt strictly, it won't share this price. If the FAQ KB is loaded as context, there's a direct conflict.
   - Prompt Reference: Guideline 8 vs FAQ Knowledge Base
   - Recommendation: Add explicit exception: "You MAY share the $299 self-pay MRI price when a caller asks about self-referral pricing. Do not quote prices for any other service."

2. **Self-referral scheduling path unclear** — Severity: MEDIUM
   - Expected: After explaining self-referral rules, clear instruction to transfer to Scheduling if caller wants to proceed
   - Actual: No explicit "if they want to self-refer, transfer to Scheduling" instruction. Agent must infer from the general Scheduling transfer rule.
   - Prompt Reference: Step 4 (Scheduling) + Guideline 15

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **PASS**
- [ ] Email read back slowly with pauses? **N/A**
- [x] No scan recommendations made? **PASS**
- [x] No pricing quoted? **PASS** (but conflict exists with FAQ KB)
- [x] Correct services for location? **PASS**
- [x] Self-referral rules enforced? **PASS** (comprehensive)
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A**
- [ ] intents_handled set correctly? **N/A**
- [ ] Transfer pacing correct? **PASS**
- [x] Deferred to doctor when appropriate? **PASS** (Guideline 15 includes this)

### OVERALL GRADE: PARTIAL PASS

---

## Test 5: P15 — Service Availability Tester

**Scenario:** Caller asks about services NOT available at Logan: X-ray, ultrasound, mammogram, open MRI, DEXA scan.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- "Do you do X-rays there?" → Agent should say not available at Logan, available at Tooele/St. George ✓
- "I need an ultrasound." → Not available at Logan; available at Tooele ✓
- "Can I get a mammogram?" → Not available at ANY location ✓
- "Do you have an open MRI?" → No, Wide Bore; Open MRI at St. George ✓
- "I need a DEXA scan." → Not available at Logan; available at Tooele ✓

### EXPECTED BEHAVIOR:
- Correctly state which services are unavailable at Logan
- Provide correct alternative locations within First Choice network
- Never recommend external facilities
- Never recommend which scan to get

### ACTUAL BEHAVIOR (per prompt):
- X-ray: Correctly states Tooele and St. George only, requires doctor's order ✓
- Mammogram: Correctly states not available at any location, refers to primary care provider ✓
- Open MRI: Correctly distinguishes and refers to St. George ✓
- Ultrasound/DEXA: Knowledge Base says "NOT available at these locations" but doesn't explicitly script agent to mention Tooele as the alternative for these specific services
- **St. George phone number missing from Cross-Location Phone Directory** (only Tooele and Sandy listed)

### DEFICIENCIES FOUND:
1. **St. George missing from Cross-Location Phone Directory** — Severity: HIGH
   - Expected: St. George phone number and transfer trigger listed alongside Tooele and Sandy
   - Actual: Only Tooele (435-882-1674) and Sandy (801-576-1290) are in the directory. When agent refers caller to St. George for Open MRI or X-ray, there's no phone number to provide.
   - Prompt Reference: Step 1, Cross-Location Phone Directory table

2. **Ultrasound/DEXA redirect lacks explicit script** — Severity: MEDIUM
   - Expected: When caller asks about ultrasound or DEXA, agent should say "That's available at our Tooele location" with phone number
   - Actual: Knowledge Base only says these aren't available at Logan/North Logan. No positive redirect script for ultrasound or DEXA specifically (X-ray has one, mammogram has one, Open MRI has one).
   - Prompt Reference: Knowledge Base > SERVICES NOT OFFERED section

3. **No external referral guardrail tested — works correctly** — Severity: N/A (PASS)
   - Guideline 14 correctly prevents recommending external clinics ✓

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **N/A**
- [ ] Email read back slowly with pauses? **N/A**
- [x] No scan recommendations made? **PASS**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **PARTIAL** (correctly says unavailable, but incomplete redirect info)
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A**
- [ ] intents_handled set correctly? **N/A**
- [ ] Transfer pacing correct? **N/A**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PARTIAL PASS

---

*Report generated via static prompt analysis — March 12, 2026*
