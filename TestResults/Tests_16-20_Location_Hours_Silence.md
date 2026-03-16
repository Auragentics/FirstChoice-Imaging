# Static Prompt Audit — Tests 16–20
**Target:** Logan MRI Clinic Voice Agent Prompt v5.0
**Method:** Static analysis against LoganTestAgent.md scenarios
**Date:** March 12, 2026

---

## Test 16: P5 — Wrong Location (Sandy)

**Scenario:** Caller thinks they called Sandy location. "Hi, is this the Sandy office?"

### CALL FLOW ANALYSIS:
- Agent greets with "Thanks for calling First Choice Imaging, Logan MRI Clinic!" → Location is announced upfront ✓
- Caller: "Oh, I was trying to reach the Sandy location."
- Agent checks Cross-Location Phone Directory → Sandy: (801) 576-1290, Transfer to `Sandy` ✓
- Agent provides number and offers transfer ✓

### EXPECTED BEHAVIOR:
- Correct Sandy phone number provided
- Transfer offered
- Smooth handoff

### ACTUAL BEHAVIOR (per prompt):
- Sandy is in the Cross-Location Phone Directory ✓
- Transfer trigger is defined ✓
- Location Verification guidance says "provide the correct number and offer to transfer" ✓

### DEFICIENCIES FOUND:
1. **No script for wrong-location handoff** — Severity: LOW
   - Expected: Explicit script like "No problem! You've reached our Logan clinic. The Sandy office number is eight, zero, one... five, seven, six... one, two, nine, zero. Would you like me to transfer you?"
   - Actual: The prompt says to "provide the correct number and offer to transfer" but doesn't give exact wording. The agent should be able to generate this naturally, but an explicit script would ensure TTS digit formatting compliance.
   - Prompt Reference: Step 1 > Location Verification

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **N/A** (caller may transfer before name collection)
- [x] Phone collected before proceeding? **N/A** (may not be needed for simple transfer)
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **UNCERTAIN** (no explicit script for reading cross-location numbers)
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A**
- [ ] intents_handled set correctly? **N/A**
- [x] Transfer pacing correct? **PASS** (Transfer Execution Protocol)
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 17: P18 — Hours / Walk-in Questioner

**Scenario:** Caller asks "What are your hours?" with no context. Follows up with "Can I just walk in?" and "Are you open on Saturdays?"

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "What are your hours?"
- Agent per Guideline 16: Clarify intent first ✓
  - "Are you looking to come in for an appointment, or do you need to pick something up like images or a report?"
- Caller: "I want to come in for an appointment."
- Agent: "What type of service are you looking to schedule?" (need to determine modality for correct hours)
- Caller: "MRI" → "Our Logan MRI Clinic is open Monday through Friday, six thirty AM to eight PM, by appointment only."
- Caller: "Can I just walk in?"
- Agent: "MRI requires an appointment. Walk-ins are only available for X-ray at our Tooele and St. George locations." ✓
- Caller: "Are you open on Saturdays?"
- Agent: "Our Logan clinic is Monday through Friday only. Our Sandy location does have Saturday hours for MRI — seven AM to seven PM." ✓ (from Hours Reference table)

### EXPECTED BEHAVIOR:
- Hours clarification before answering
- Walk-in policy correctly stated
- Saturday availability correctly identified (Sandy only for MRI)

### ACTUAL BEHAVIOR (per prompt):
- Guideline 16 is comprehensive and well-structured ✓
- All-Locations Hours Reference table has all the data needed ✓
- Walk-in note explicitly states only X-ray at Tooele/St. George ✓
- Sandy Saturday hours are in the table ✓

### DEFICIENCIES FOUND:
1. **No Saturday hours for North Logan CT in table** — Severity: LOW
   - Expected: North Logan CT hours should include Saturday info (even if closed)
   - Actual: Table shows "Mon–Fri" which implies no Saturdays, but doesn't explicitly state it
   - Prompt Reference: All-Locations Hours Reference table
   - Note: This is minor — Mon–Fri clearly implies no Saturday.

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **N/A**
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **PASS**
- [ ] Self-referral rules enforced? **N/A**
- [x] Hours intent clarified before answering? **PASS** (Guideline 16)
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A**
- [ ] intents_handled set correctly? **N/A**
- [ ] Transfer pacing correct? **N/A**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 18: P19 — Directions Requester

**Scenario:** Caller asks for directions. May decline SMS.

### CALL FLOW ANALYSIS:
- Standard greeting/name/phone → ✓
- Caller: "Where are you located?"
- Agent per Directions section: "We have two locations in the area — our Logan MRI Clinic and our North Logan CT Clinic. Which one are you heading to?" ✓
- Caller: "The MRI one."
- Agent: "Would you like me to text you a Google Maps link to our Logan MRI Clinic?" ✓
- Caller: "No, just tell me the address."
- Agent reads address verbally: "Six thirty East, fourteen hundred North, Suite one fifteen, Logan, Utah, eight four three four one." ✓
- Sets `sms_consent` = "NO" (from Directions section) ✓

### EXPECTED BEHAVIOR:
- Clarify Logan vs North Logan
- Offer SMS link
- If declined, read address verbally in natural spoken format (Guideline 1)

### ACTUAL BEHAVIOR (per prompt):
- Directions section is well-structured ✓
- SMS offer is properly handled ✓
- Address is in the Knowledge Base ✓

### DEFICIENCIES FOUND:
1. **`sms_consent` set in Directions but may conflict with later workflow** — Severity: LOW
   - Expected: If caller first asks for directions (sms_consent = NO), then later does a records request, the records workflow might skip SMS offer because sms_consent is already set
   - Actual: The PRE-CLOSE section says "IF sms_consent was already set during Medical Records workflow, skip the SMS question." But if it was set during Directions, the records Step 4 would still ask (it's part of that step, not gated by sms_consent). This is a minor ordering edge case.
   - Prompt Reference: Directions + Step 4 + PRE-CLOSE

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PASS**
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **N/A**
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **PASS**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [x] SMS consent asked (or correctly skipped)? **PASS**
- [ ] intents_handled set correctly? **N/A**
- [ ] Transfer pacing correct? **N/A**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 19: P20 — Silent Caller

**Scenario:** Caller says nothing after greeting. Tests silence handling protocol.

### CALL FLOW ANALYSIS:
- Agent delivers greeting → Silence
- 4 seconds → "Are you there?" ✓
- 4 seconds → "I'm here to help! May I start with your name?" ✓
- 5 seconds → "I can't hear you, so I'm going to hang up. Please call back if you need help." [End Call] ✓

### EXPECTED BEHAVIOR:
- 3-step silence protocol: 4s → prompt → 4s → prompt → 5s → hang up
- Timings: 4s, 4s, 5s

### ACTUAL BEHAVIOR (per prompt):
- Silence handling is explicitly scripted in Step 1 ✓
- All three steps with exact timing are defined ✓
- Recovery path exists: "If the caller responds after any silence prompt, treat it the same as the initial greeting response" ✓

### DEFICIENCIES FOUND:
None. Silence handling is comprehensive.

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **N/A** (call ends before name)
- [x] Phone collected before proceeding? **N/A**
- [x] Name used max 3 times? **N/A**
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
- [ ] Transfer pacing correct? **N/A**
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PASS

---

## Test 20: P4 + Corrector — Impatient Caller, Corrects Phone Readback

**Scenario:** Fast-talking caller wants to schedule. Gives phone number but corrects readback: "No wait, I said seven not nine."

### CALL FLOW ANALYSIS:
- Agent greets → Caller rapidly: "Look, I just need to schedule an MRI, can you transfer me?"
- Agent: "I can definitely help with that! First, may I have your name?" (per CALLER SKIPS NAME rule) ✓
- Caller gives name impatiently
- Agent asks for phone → Caller rattles off number
- Agent reads back: "That's four, three, five... five, five, five... zero, nine, one, two."
- Caller: "No wait, I said seven not nine."
- Agent should correct and re-confirm → ???

### EXPECTED BEHAVIOR:
- Phone readback as individual digits ✓
- When corrected, update the number and re-read the full number
- Then transfer to Scheduling

### ACTUAL BEHAVIOR (per prompt):
- Step 2 has phone readback with confirmation: "Is that correct?" ✓
- **No script for handling a correction.** The prompt assumes either "yes" or the caller providing a new number, but doesn't address the case where the caller says "no, change X to Y."

### DEFICIENCIES FOUND:
1. **No phone correction re-confirmation script** — Severity: MEDIUM
   - Expected: When caller says "No, it's seven not nine," agent should say something like "Got it — let me re-read that. That's four, three, five... five, five, five... zero, seven, one, two. Is that right?"
   - Actual: Step 2 only covers the initial readback and "Is that correct?" There's no instruction for handling a "no" response.
   - Prompt Reference: Step 2 (IF PROVIDES)

2. **First-name-only handling** — Severity: HIGH
   - Expected: `caller_name` expects "first and last name" per variable definition. If an impatient caller gives only "Mike," agent should ask for last name.
   - Actual: No instruction to ask for last name if only first name given. The variable definition says "Caller's first and last name" but the collection script just says "Who am I speaking with?" — no follow-up for incomplete names.
   - Prompt Reference: Step 1 + Webhook Variables (`caller_name`)

### GUARDRAIL TESTS:
- [x] Name collected before proceeding? **PARTIAL** (first name only — no last name follow-up)
- [x] Phone collected before proceeding? **PASS**
- [x] Name used max 3 times? **PASS**
- [ ] Phone digits read as individual words? **PASS** (Guideline 10 + Step 2)
- [ ] Email read back slowly with pauses? **N/A**
- [ ] No scan recommendations made? **N/A**
- [ ] No pricing quoted? **N/A**
- [x] Correct services for location? **N/A**
- [ ] Self-referral rules enforced? **N/A**
- [ ] Hours intent clarified before answering? **N/A**
- [ ] Solicitation handled without transfer? **N/A**
- [ ] SMS consent asked (or correctly skipped)? **N/A** (scheduling = no workflow)
- [ ] intents_handled set correctly? **N/A**
- [x] Transfer pacing correct? **PASS** (scheduling = immediate)
- [ ] Deferred to doctor when appropriate? **N/A**

### OVERALL GRADE: PARTIAL PASS

---

*Report generated via static prompt analysis — March 12, 2026*
