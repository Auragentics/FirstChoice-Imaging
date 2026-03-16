# Logan Voice Agent Prompt v5.0 — Static Audit Executive Summary
**Date:** March 12, 2026
**Method:** 20 test scenarios from LoganTestAgent.md audited against prompt logic
**Auditor:** Static prompt analysis (no live calls)

---

## Overall Results

| Grade | Count | Tests |
|-------|-------|-------|
| **PASS** | 12 | #1, #6, #8, #11, #12, #13, #14, #15, #16, #17, #18, #19 |
| **PARTIAL PASS** | 7 | #2, #3, #4, #5, #7, #10, #20 |
| **FAIL** | 1 | #9 |

**Pass Rate:** 12/20 PASS, 7/20 PARTIAL, 1/20 FAIL

---

## Deficiencies by Severity

### CRITICAL (3)

| # | Issue | Test | Prompt Location |
|---|-------|------|-----------------|
| C1 | **Results timeline/turnaround info missing from Knowledge Base** — Agent has no sourced data for "when will results be ready?" Violates ZERO HALLUCINATION rule. Extremely common caller question. | #10 | Knowledge Base |
| C2 | **`records_request_type` never set in provider path** — Provider redirect skips Steps 3-4, leaving this required variable empty for webhook. | #9 | Provider Redirect flow |
| C3 | **`intents_handled` never set in provider path** — Same skip. Violates INITIALIZATION rule: "Never leave this variable empty if a workflow was completed." | #9 | Provider Redirect + INITIALIZATION rule |

### HIGH (5)

| # | Issue | Test | Prompt Location |
|---|-------|------|-----------------|
| H1 | **No terminal path for phone refusal** — After 2 failed phone collection attempts, no instruction on how to proceed. Agent is stuck. | #2 | Step 2 (IF EVADES) |
| H2 | **First-name-only handling missing** — `caller_name` variable expects "first and last name" but no instruction to ask for last name if only first name given. | #20 | Step 1 + Webhook Variables |
| H3 | **$299 self-referral pricing conflict** — Guideline 8 says "never quote prices" but FAQ KB says $299 may be shared. No exception in the prompt. | #4 | Guideline 8 vs FAQ KB |
| H4 | **`sms_consent` never set in provider path** — Provider is transferred without SMS consent being addressed. | #9 | Provider Redirect |
| H5 | **St. George missing from Cross-Location Phone Directory** — Agent refers callers to St. George for Open MRI and X-ray but has no phone number to provide. | #5 | Step 1, Phone Directory |

### MEDIUM (7)

| # | Issue | Test | Prompt Location |
|---|-------|------|-----------------|
| M1 | **No phone correction re-confirmation script** — When caller says "no, that's wrong" during phone readback, no handling instruction. | #20 | Step 2 |
| M2 | **No script for "Why do you need my name?"** — Only handles skipping, not active objection. | #2 | Step 1 |
| M3 | **MRI scan duration missing from Knowledge Base** — Common question with no sourced answer. | #3 | Knowledge Base |
| M4 | **"That's me"/"myself" pronoun resolution lacks confirmation** — Silently maps to `caller_name` without verifying. | #7 | Lien Steps 4-5 |
| M5 | **Long email readback has no segmented confirmation** — 35+ char emails are hard to verify in one pass. | #7 | Lien Step 6 + Guideline 10 |
| M6 | **Provider path skips "Anything else?" before transfer** — Bypasses AFTER EACH WORKFLOW check. | #9 | Provider Redirect |
| M7 | **Ultrasound/DEXA redirect lacks explicit script** — X-ray and mammogram have redirect scripts, but ultrasound/DEXA don't. | #5 | Knowledge Base |

### LOW (5)

| # | Issue | Test | Prompt Location |
|---|-------|------|-----------------|
| L1 | Transfer Execution Protocol labeled "CROSS-LOCATION ONLY" but billing/receptionist use it too | #1 | Protocol header |
| L2 | No reassurance script for anxious/claustrophobic callers | #3 | Knowledge Base |
| L3 | `+` character not in Guideline 10 symbol list | #7 | Guideline 10 |
| L4 | Complaint routing lacks specific bridge phrase | #14 | Gatekeeper Step 3 |
| L5 | Wrong-location handoff has no scripted digit-format phone readback | #16 | Step 1 > Location Verification |

---

## Top Priority Fixes (Recommended Order)

### Immediate (CRITICAL + blocking HIGH)

1. **Add results turnaround info to Knowledge Base** (C1)
   - Add: "Results are typically sent to your ordering physician within [X] business days. For questions about specific results, we recommend contacting your provider's office."

2. **Fix provider path variable gaps** (C2, C3, H4)
   - After provider redirect, add:
     - SET `records_request_type` = "provider_records" (or appropriate value)
     - SET `intents_handled` = "records"
     - SET `sms_consent` = "NO" (providers don't need SMS)

3. **Add St. George to Cross-Location Phone Directory** (H5)
   - Add row: St. George | (phone number) | Transfer to `St. George`

4. **Add terminal path for phone refusal** (H1)
   - After 2nd refusal: "No problem! I can still help you — just keep in mind I won't be able to call you back if we get disconnected. Now, what can I help you with?"

5. **Add last-name collection follow-up** (H2)
   - After Step 1, if only first name given: "And your last name?"

6. **Resolve $299 pricing conflict** (H3)
   - Add to Guideline 8: "EXCEPTION: You may share the $299 self-pay MRI price when a caller specifically asks about self-referral pricing."

### Short-Term (MEDIUM)

7. Add phone correction handling to Step 2
8. Add "why do you need my name?" script to Step 1
9. Add MRI duration range to Knowledge Base
10. Add confirmation step for pronoun resolution in Lien Steps 4-5
11. Add "Anything else?" check to provider redirect path
12. Add explicit ultrasound/DEXA redirect scripts to Knowledge Base

### Nice-to-Have (LOW)

13. Rename Transfer Execution Protocol header
14. Add anxious caller reassurance script
15. Add `+` ("plus") to Guideline 10 symbol list
16. Add complaint-specific bridge phrase to Gatekeeper
17. Add scripted phone readback for cross-location transfers

---

## Strengths Noted

The prompt excels in several areas:
- **Solicitation handling** — 3-step protocol is airtight (Test #13: PASS)
- **Silence protocol** — Well-defined timing and recovery (Test #19: PASS)
- **Scan recommendation guardrail** — Guideline 11 is comprehensive (Test #15: PASS)
- **Billing records exception** — Correctly routes to records workflow (Test #11: PASS)
- **Lien workflow** — Thorough data collection with good sequencing (Tests #7, #8: PASS)
- **Multi-intent support** — Variable prefixing prevents data overwrites (Test #12: PASS)
- **Hours clarification** — Guideline 16 forces intent check before answering (Test #17: PASS)
- **Email readback pacing** — New Guideline 10 addition is clear and well-referenced (Test #7: PASS)
- **Self-referral rules** — Guideline 15 is comprehensive and strict (Test #4: mostly PASS)

---

## Files in This Report Set

| File | Tests Covered |
|------|---------------|
| [Tests_01-05_Baseline_SelfReferral.md](Tests_01-05_Baseline_SelfReferral.md) | Standard patient, Evasive, Anxious, Self-referral, Services |
| [Tests_06-10_Attorney_Provider_ThirdParty.md](Tests_06-10_Attorney_Provider_ThirdParty.md) | Attorney records, Attorney lien, Paralegal, Provider, Family member |
| [Tests_11-15_Billing_Solicitor_Confused.md](Tests_11-15_Billing_Solicitor_Confused.md) | Billing edge case, Multi-intent, Solicitor, Live operator, Confused caller |
| [Tests_16-20_Location_Hours_Silence.md](Tests_16-20_Location_Hours_Silence.md) | Wrong location, Hours, Directions, Silent caller, Impatient+corrector |

---

*Static Prompt Audit v1.0 — Logan MRI Clinic Voice Agent Prompt v5.0*
