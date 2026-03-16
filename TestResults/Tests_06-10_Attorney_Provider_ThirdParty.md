# Static Prompt Audit — Tests 6–10
**Target:** Logan MRI Clinic Voice Agent Prompt v5.0
**Method:** Static analysis against LoganTestAgent.md scenarios
**Date:** March 12, 2026

---

## Test 6: P7 — Attorney, Records Request

**Scenario:** Attorney calls requesting medical records for a client. Should receive verbal URL only — no SMS.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "This is Jennifer Walsh from Kendrick & Associates. I'm calling regarding medical records for a client."
- Agent detects attorney → Step 1 Attorney Check: "Are you calling to request medical records, or to establish a direct lien?" ✓
- Caller: "Medical records"
- Agent sets `records_caller_type` = "attorney", `records_request_type` = "medical_records" ✓
- Skips to Step 4A: Attorney — Verbal URL Only ✓
- Reads URL verbally: "firstchoice-imaging dot com slash attorneys" ✓
- Sets `sms_consent` = "NO" ✓
- Sets `intents_handled` = "records" ✓

### EXPECTED BEHAVIOR:
- Attorney detected and routed to Step 4A
- Verbal URL provided, NO SMS offered
- All variables set correctly

### ACTUAL BEHAVIOR (per prompt):
- Prompt handles this correctly end-to-end.

### DEFICIENCIES FOUND:
1. **No `records_firm_name` variable** — Severity: MEDIUM
   - Expected: When an attorney identifies their firm, it should be captured as a variable for the webhook
   - Actual: The caller says "Kendrick & Associates" but there's no variable to store it. The lien workflow has `lien_firm_name`, but the records workflow doesn't capture firm name.
   - Prompt Reference: Webhook Variables > Medical Records section

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
- [x] SMS consent asked (or correctly skipped)? **PASS** (correctly skipped — attorney)
- [x] intents_handled set correctly? **PASS**
- [ ] Transfer pacing correct? **N/A** (no transfer in this workflow)
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 7: P8 — Attorney, Lien Request (Complex Email)

**Scenario:** Attorney calls to establish a lien. Has complex email: `m.torres_legal@harper-lawgroup.com`. Uses shorthand like "That's me" for attorney name.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller identifies as attorney wanting a lien → routed to Lien Workflow ✓
- Lien Step 1: Patient name → collected ✓
- Lien Step 2: DOB → collected ✓
- Lien Step 3: Law firm → collected ✓
- Lien Step 4: Attorney on case → Caller says "That's me" → prompt says set to `caller_name` ✓
- Lien Step 5: Best point of contact → Caller says "myself" → prompt says set to `caller_name` ✓
- Lien Step 6: Email → `m.torres_legal@harper-lawgroup.com`
  - Agent spells back slowly per Guideline 10 and Lien Step 6 pacing rules ✓
  - Email contains: dot, underscore, at, dash — all covered in Guideline 10 ✓
- Lien Steps 7-11: Location, callback phone, closing, sms=NO, intents_handled ✓

### EXPECTED BEHAVIOR:
- Full lien workflow completed with all variables
- "That's me" / "myself" pronoun resolution handled
- Complex email spelled back slowly with pauses
- No SMS offered to attorney

### ACTUAL BEHAVIOR (per prompt):
- Lien workflow is comprehensive and well-structured ✓
- Pronoun resolution ("That's me" / "myself") is explicitly handled ✓
- Email pacing instructions are clear ✓

### DEFICIENCIES FOUND:
1. **"That's me" pronoun resolution lacks confirmation step** — Severity: MEDIUM
   - Expected: When caller says "That's me" for attorney name, agent should confirm: "So that would be [caller_name], correct?"
   - Actual: Prompt says to silently set the variable. No confirmation that the mapping is correct.
   - Prompt Reference: Lien Step 4

2. **Long email readback — no segmented confirmation** — Severity: MEDIUM
   - Expected: For long/complex emails (35+ characters), guidance on breaking into segments for confirmation
   - Actual: Prompt says spell back the entire email at once. For `m.torres_legal@harper-lawgroup.com` (35 chars), this is a lot to verify in one pass.
   - Prompt Reference: Lien Step 6 + Guideline 10

3. **`+` character not in Guideline 10 symbol list** — Severity: LOW
   - Expected: Guideline 10 should include "plus" for `+` symbol (test data includes `a.cruz+lien@westlakelegal.com`)
   - Actual: Guideline 10 lists @, period, underscore, hyphen — but not `+`
   - Prompt Reference: Guideline 10

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **PASS**
- [x] Email read back slowly with pauses? **PASS** (pacing rules present)
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [x] SMS consent asked (or correctly skipped)? **PASS** (attorney — skipped)
- [x] intents_handled set correctly? **PASS**
- [ ] Transfer pacing correct? **N/A**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS (with notes)

---

## Test 8: P9 — Paralegal, Lien Request

**Scenario:** Paralegal calls on behalf of attorney to establish a lien. Paralegal is the point of contact, not the attorney.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "Hi, I'm a paralegal calling on behalf of Attorney David Chen at Westlake Legal."
- Agent detects attorney/law firm context → Attorney Check: "records or lien?" ✓
- Caller: "Lien"
- Lien Steps 1-3: Patient name, DOB, firm name → collected ✓
- Lien Step 4: "Who is the attorney on the case?" → "David Chen" ✓
- Lien Step 5: "Best point of contact?" → Paralegal gives their own name ✓
- Lien Step 6-11: Email, location, phone, closing, sms=NO, intents_handled ✓

### EXPECTED BEHAVIOR:
- Agent correctly distinguishes paralegal (point of contact) from attorney (on case)
- All lien variables correctly assigned
- `lien_attorney_name` = "David Chen", `lien_paralegal_name` = paralegal's name

### ACTUAL BEHAVIOR (per prompt):
- Lien workflow correctly separates attorney name (Step 4) from point of contact (Step 5) ✓
- Step 5 wording "is that yourself, or someone else?" naturally handles paralegal scenario ✓

### DEFICIENCIES FOUND:
1. **Caller name vs. paralegal name potential confusion** — Severity: LOW
   - Expected: `caller_name` = paralegal's name, `lien_paralegal_name` = same paralegal's name, `lien_attorney_name` = attorney's name
   - Actual: This works correctly because `caller_name` is collected in Steps 1-2 (the paralegal), and the lien workflow separately asks for the attorney. The "myself" shortcut in Step 5 would correctly map to the paralegal's name.
   - This is a PASS — the workflow handles it.

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **PASS**
- [x] Email read back slowly with pauses? **PASS**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [x] SMS consent asked (or correctly skipped)? **PASS** (attorney/paralegal — skipped)
- [x] intents_handled set correctly? **PASS**
- [ ] Transfer pacing correct? **N/A**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 9: P6 — Healthcare Provider, Records on Disc

**Scenario:** Provider office calls asking about getting records on disc for a patient.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "Hi, this is Dr. Martinez's office calling about a patient."
- Agent detects provider context → Medical Records Step 2: "Are you the patient, calling on someone's behalf, or are you a healthcare provider?"
- Caller: "Healthcare provider"
- Sets `records_caller_type` = "provider" → PROVIDER REDIRECT ✓
- Agent asks: "Electronic records or disc?" → Caller: "Disc"
- Agent provides URL: "firstchoice-imaging dot com slash medical-records-request" ✓
- Agent transfers to `Receptionist` ✓

### EXPECTED BEHAVIOR:
- Provider correctly identified and routed
- Disc request URL provided
- Transfer to Receptionist
- All relevant variables set

### ACTUAL BEHAVIOR (per prompt):
- Provider redirect workflow is correct ✓
- **BUT: `records_request_type` is never set in the provider path**
- **AND: `intents_handled` is never set in the provider path**
- **AND: `sms_consent` is never set in the provider path**

### DEFICIENCIES FOUND:
1. **`records_request_type` never set in provider path** — Severity: CRITICAL
   - Expected: Variable should be set to indicate the type of records request for webhook processing
   - Actual: Provider redirect skips Steps 3-4 entirely, jumping straight to the redirect. The variable is defined as required for Medical Records but never populated.
   - Prompt Reference: Webhook Variables > Medical Records + Provider Redirect flow

2. **`intents_handled` never set in provider path** — Severity: CRITICAL
   - Expected: After completing the records workflow (even via provider redirect), `intents_handled` should be set to "records"
   - Actual: The SET instruction only appears in Steps 4 and 4A, which are both skipped in the provider path. The INITIALIZATION rule says "Never leave this variable empty if a workflow was completed."
   - Prompt Reference: Webhook Variables > INITIALIZATION rule + Provider Redirect

3. **`sms_consent` never set in provider path** — Severity: HIGH
   - Expected: Either ask the provider about SMS or default to "NO" (similar to attorneys)
   - Actual: Variable is never addressed. Provider is transferred to Receptionist without SMS being handled.
   - Prompt Reference: PRE-CLOSE DATA COMPLETENESS CHECK

4. **Provider path skips "Anything else?" before transfer** — Severity: MEDIUM
   - Expected: After handling the records request, ask "Is there anything else I can help you with?" before transferring
   - Actual: Provider redirect goes directly to transfer without the AFTER EACH WORKFLOW check
   - Prompt Reference: AFTER EACH WORKFLOW section

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
- [ ] SMS consent asked (or correctly skipped)? **FAIL** (never addressed)
- [ ] intents_handled set correctly? **FAIL** (never set)
- [x] Transfer pacing correct? **PASS** (Transfer Execution Protocol applies)
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: FAIL

---

## Test 10: P10 — Family Member, Records Request

**Scenario:** Third party (family member) calls about patient's records. Also asks about results timeline.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "Hi, I'm calling for my mother. She had an MRI last week and needs her records."
- Agent → Medical Records Step 2: "Are you the patient, calling on someone's behalf, or are you a healthcare provider?"
- Caller: "On someone's behalf"
- Sets `records_caller_type` = "patient" (per prompt: "Patient, parent/guardian, or third party" → "patient") ✓
- Step 3: Request type → "medical records transfer" → `records_request_type` = "medical_records" ✓
- Step 4: SMS link offer ✓
- Caller also asks: "When will her results be ready?"

### EXPECTED BEHAVIOR:
- Third party treated as "patient" type
- Records workflow completed
- Results timeline question answered from Knowledge Base

### ACTUAL BEHAVIOR (per prompt):
- Third party mapping to "patient" type is correct ✓
- Records workflow would complete correctly ✓
- **Results timeline/turnaround info is NOT in the Knowledge Base**

### DEFICIENCIES FOUND:
1. **Results timeline missing from Knowledge Base** — Severity: CRITICAL
   - Expected: Information about typical turnaround times for MRI results (e.g., "Results are typically available within 24-48 hours and sent to your ordering physician")
   - Actual: The Knowledge Base has zero information about results timelines. Agent must either hallucinate (violates Guideline 4 ZERO HALLUCINATION) or say "I don't know" to an extremely common question.
   - Prompt Reference: Knowledge Base — completely absent
   - Recommendation: Add results turnaround information to Knowledge Base

2. **Patient portal reference undefined** — Severity: HIGH
   - Expected: If results are available through a patient portal, the portal URL and access instructions should be in the Knowledge Base
   - Actual: No patient portal information exists in the prompt. The records workflow mentions "firstchoice-imaging dot com slash patients" but this is for the records request form, not result access.
   - Prompt Reference: Knowledge Base — absent

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
- [ ] Transfer pacing correct? **N/A**
- [x] Deferred to doctor when appropriate? **PASS** (Guideline 5)

### OVERALL GRADE: PARTIAL PASS

---

*Report generated via static prompt analysis — March 12, 2026*
