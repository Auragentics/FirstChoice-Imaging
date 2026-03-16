# Static Prompt Audit — Tests 11–15
**Target:** Logan MRI Clinic Voice Agent Prompt v5.0
**Method:** Static analysis against LoganTestAgent.md scenarios
**Date:** March 12, 2026

---

## Test 11: P17 — Billing Records Edge Case

**Scenario:** Caller asks for "billing records" / "itemized statement" — should route through Medical Records, NOT billing transfer. Then asks a separate billing question.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "I need a copy of my billing records."
- Agent should recognize this as Medical Records workflow per Step 4 Billing EXCEPTION ✓
- Medical Records Step 2: Caller type → "patient" ✓
- Step 3: "billing records / itemized statement" → `records_request_type` = "billing_records" ✓
- Step 4: SMS link offer → same flow as radiology reports ✓
- Sets `intents_handled` = "records" ✓
- After workflow: "Anything else?"
- Caller: "Actually, I also have a question about a charge on my bill."
- This IS a billing question → Transfer to `Billing` ✓

### EXPECTED BEHAVIOR:
- "Billing records" → Medical Records workflow (not billing transfer)
- "Question about a charge" → Billing transfer
- Both intents handled correctly in sequence

### ACTUAL BEHAVIOR (per prompt):
- Billing records exception is explicitly called out in Step 4 and in Examples section ✓
- Subsequent billing question correctly triggers transfer ✓
- Multi-intent handling is supported by variable prefixing ✓

### DEFICIENCIES FOUND:
1. **`intents_handled` doesn't track billing transfers** — Severity: LOW
   - Expected: If billing was handled, it could be tracked in `intents_handled`
   - Actual: `intents_handled` only tracks "records" and "lien" — billing transfers are immediate with no variable collection, so this is by design. Not a true deficiency.
   - Prompt Reference: Webhook Variables

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **PASS**
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [x] SMS consent asked (or correctly skipped)? **PASS**
- [x] intents_handled set correctly? **PASS**
- [x] Transfer pacing correct? **PASS** (billing = immediate)
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 12: P12 — Multi-Intent: Records + Billing Question

**Scenario:** Caller starts with medical records request, then after it's handled, asks a billing question. Tests intent stacking and variable preservation.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Intent 1: Medical records → Full records workflow → `intents_handled` = "records" ✓
- "Anything else?" → "Actually, I also have a billing question."
- Intent 2: Billing → Immediate transfer to `Billing` ✓
- Variables from records workflow are preserved (prefixed with `records_`) ✓

### EXPECTED BEHAVIOR:
- Records workflow completed first with all variables set
- After "anything else?", billing question triggers immediate transfer
- Records variables preserved through billing transfer

### ACTUAL BEHAVIOR (per prompt):
- Multi-intent support is explicitly designed via variable prefixing ✓
- "AFTER EACH WORKFLOW" check asks "anything else?" ✓
- Billing transfer is immediate — no conflict with records variables ✓

### DEFICIENCIES FOUND:
1. **Pre-close check may not trigger after billing transfer** — Severity: MEDIUM
   - Expected: PRE-CLOSE DATA COMPLETENESS CHECK runs before the call ends
   - Actual: If the billing transfer happens, the agent loses control of the call. The pre-close check and SMS consent question can't run. This means `sms_consent` from the records workflow must be set BEFORE the billing transfer — which it is (Step 4 sets it). But if for any reason it wasn't set, there's no recovery path.
   - Prompt Reference: PRE-CLOSE DATA COMPLETENESS CHECK + Transfer flow

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **PASS**
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [x] SMS consent asked (or correctly skipped)? **PASS** (set during records workflow)
- [x] intents_handled set correctly? **PASS**
- [x] Transfer pacing correct? **PASS**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 13: P11 — Solicitor, Persistent

**Scenario:** Salesperson calls about imaging software. Pushes back when declined. Tests 3-step solicitation handling.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → Solicitor gives name, may or may not give phone
- Caller: "I'm reaching out from MedTech Solutions. We'd love to talk to your office manager about our new imaging software."
- Agent → Solicitations block, Step 1: "I appreciate you reaching out, but we're not able to take those requests over the phone." ✓
- Caller persists: "We just need 5 minutes with your manager."
- Agent → Step 2: "I understand, but I'm not able to connect you with anyone for that. You're welcome to submit your inquiry through our website at firstchoice-imaging dot com slash contact." ✓
- Caller persists again: "Can you just give me the manager's email?"
- Agent → Step 3: "I've provided the best way to reach us for that. Is there anything else I can help you with today?" ✓
- If continues → "I'm not able to help further with that request. Have a great day." [End Call] ✓

### EXPECTED BEHAVIOR:
- 3-step escalation without transferring
- Polite but firm throughout
- End call if persistent after step 3

### ACTUAL BEHAVIOR (per prompt):
- Solicitation handling is well-defined with clear 3-step protocol ✓
- No transfer offered at any point ✓
- Clear termination path ✓

### DEFICIENCIES FOUND:
None. Solicitation handling is comprehensive.

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS** (may collect before determining intent)
- [x] Phone collected before proceeding? **PASS** (may collect before determining intent)
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **N/A**
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [x] Solicitation handled without transfer? **PASS**
- [ ] SMS consent asked (or correctly skipped)? **N/A** (solicitation = no workflow)
- [ ] intents_handled set correctly? **N/A** (no workflow completed)
- [ ] Transfer pacing correct? **N/A**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 14: P16 — Live Operator Demander

**Scenario:** Caller demands to speak to a real person. Refuses to state reason. Escalates.

### CALL FLOW ANALYSIS:
- Standard greeting → Caller: "I need to speak to a real person, not a recording."
- Agent → Gatekeeper Step 1 (Deflection): "I can help you right here with scheduling and medical records, or I can transfer you to billing. What specifically do you need?" ✓
- Caller: "I just need a human."
- Agent → Gatekeeper Step 2 (Interrogation): "I understand, but our staff are currently likely with patients. If you tell me the reason, I can either handle it or ensure you get to the right person. Is this about an appointment or a bill?" ✓
- Caller: "This is ridiculous, just transfer me."
- Agent → Gatekeeper Step 3 (Decision): Caller is vague/refuses → "I cannot transfer you without a specific inquiry type. Please call back when you can provide those details." [End Call]

### EXPECTED BEHAVIOR:
- 3-step gatekeeper protocol executed
- If valid reason eventually given, route appropriately
- If still vague after 3 steps, end call

### ACTUAL BEHAVIOR (per prompt):
- 3-step Gatekeeper protocol is well-defined ✓
- Decision step correctly branches: valid reason → transfer, solicitation → block, vague → end call ✓
- Complaint is listed as a valid reason for transfer ✓

### DEFICIENCIES FOUND:
1. **Emotional/complaint caller routing could be clearer** — Severity: LOW
   - Expected: Explicit script for complaint routing (e.g., "I'm sorry to hear about your experience. Let me connect you with someone who can help.")
   - Actual: Step 3 says "If valid reason (complaint, truly complex) → Transfer" but doesn't provide the complaint-specific bridge phrase.
   - Prompt Reference: Live Operator Gatekeeper Step 3

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS** (collected before gatekeeper)
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **N/A**
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A**
- [ ] intents_handled set correctly? **N/A**
- [ ] Transfer pacing correct? **N/A** (call ended, no transfer)
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 15: P13 — Confused Caller, Doesn't Know Scan Type

**Scenario:** Caller says doctor told them to get "some kind of scan" but doesn't know if it's MRI or CT. Asks what the difference is.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "Um, my doctor said I need some kind of scan? I'm not sure what."
- Agent should NOT recommend a scan type (Guideline 11) ✓
- Agent can share general info about MRI vs CT (Guideline 11 allows general info) ✓
- Agent should defer to doctor (Guideline 5 + 11): "I'm not able to make scan recommendations — that's something your doctor or provider would need to determine." ✓
- Agent should offer to help once they know: "Once you have the order from your doctor, we'd be happy to help you schedule!" → Transfer to Scheduling

### EXPECTED BEHAVIOR:
- No scan recommendation made
- General info about MRI/CT shared if asked
- Always defer to doctor
- Offer scheduling once they have an order

### ACTUAL BEHAVIOR (per prompt):
- Guideline 11 is very well-written with explicit permission to share general info vs strict prohibition on recommendations ✓
- Guideline 5 provides the "defer to doctor" language ✓
- The combo of Guidelines 5 + 11 fully covers this scenario ✓

### DEFICIENCIES FOUND:
None. This is well-handled by existing guidelines.

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **PASS**
- [ ] Email read back slowly with pauses? **N/A**
- [x] No scan recommendations made? **PASS** (Guideline 11 is comprehensive)
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **PASS**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A**
- [ ] intents_handled set correctly? **N/A**
- [ ] Transfer pacing correct? **N/A**
- [x] Deferred to doctor when appropriate? **PASS**

### OVERALL GRADE: PASS

---

*Report generated via static prompt analysis — March 12, 2026*
