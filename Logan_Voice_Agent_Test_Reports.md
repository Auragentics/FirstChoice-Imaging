# Logan MRI Clinic Voice Agent — Prompt Audit Test Reports

**Prompt Version:** 5.0
**Audit Date:** 2026-03-12
**Auditor:** Claude Opus 4.6 (Prompt Auditor)
**Source Document:** `LoganVoiceAgentPrompt.md` (v5.0, Last Updated March 5, 2026)
**Supplemental Source:** `FirstChoice_FAQ_KnowledgeBase.md`

---

## TEST 1: P1 Standard Patient — Scheduling MRI

**Scenario:** Sarah Mitchell calls. Cooperative. Gives name when asked. Gives phone (435) 555-0147. Says "I need to schedule an MRI for my knee."

### Simulated Call Transcript

| Turn | Speaker | Dialogue |
|------|---------|----------|
| 1 | AGENT | "Thanks for calling First Choice Imaging, Logan MRI Clinic! Just to confirm, you've reached our Logan location on fourteen hundred North. I'm here to help. Who am I speaking with today?" |
| 2 | CALLER | "Hi, this is Sarah Mitchell." |
| 3 | AGENT | "Great to speak with you, Sarah! And what's the best number to reach you at?" |
| 4 | CALLER | "It's 435-555-0147." |
| 5 | AGENT | "Got it — that's four, three, five... five, five, five... zero, one, four, seven. Is that correct?" |
| 6 | CALLER | "Yep, that's right." |
| 7 | AGENT | "Perfect! Now, what can I help you with today?" |
| 8 | CALLER | "I need to schedule an MRI for my knee." |
| 9 | AGENT | "Sure thing! I'll get you over to our scheduling team right now. Just one moment while I connect you." |
| — | SYSTEM | [Transfer to `Scheduling`] |

### Audit Checklist

| # | Rule | Expected Behavior | Pass/Fail | Notes |
|---|------|-------------------|-----------|-------|
| 1 | Name collected in Step 1 | Agent asks "Who am I speaking with today?" — caller provides name | PASS | Name collected before any other workflow |
| 2 | Phone collected in Step 2 | Agent asks for phone, caller provides | PASS | Phone collected before proceeding |
| 3 | Phone digits read back as words | "four, three, five... five, five, five... zero, one, four, seven" | PASS | Each digit spoken as a word, natural grouping |
| 4 | Name used MAX 3 times | Used once: Step 2 greeting ("Great to speak with you, Sarah!") | PASS | Well within limit |
| 5 | Scheduling = immediate transfer, no data collection | Agent does NOT collect email, DOB, reason details, etc. | PASS | Prompt explicitly says "No additional data collection" |
| 6 | No scan recommendation | Agent does NOT say "an MRI sounds right for a knee" | PASS | Agent simply transfers to scheduling |
| 7 | Transfer pacing | Agent finishes speaking, pauses, delivers bridge phrase, then triggers transfer | PASS | Per Guideline 6 and scheduling transfer protocol |
| 8 | intents_handled | N/A — scheduling is a transfer, not a dashboard workflow | PASS | No variable setting needed |
| 9 | sms_consent | N/A — scheduling transfer, no dashboard workflow | PASS | Not required for transfer-only calls |

### Prompt Gaps Identified

| Severity | Finding |
|----------|---------|
| LOW | The prompt says scheduling transfers are "IMMEDIATE — no data collection" (Step 4) and also says "Scheduling transfers are IMMEDIATE — skip this protocol" (Transfer Execution Protocol). However, the Example section shows `[Action: Immediately trigger transfer to Scheduling]` with no bridge phrase at all. This conflicts slightly with Guideline 6 which says to "Finish speaking, pause, deliver full bridge phrase, pause 1-2 seconds, trigger transfer." **Recommendation:** Clarify whether scheduling transfers should use a brief bridge phrase (as shown in the simulated transcript above) or literally transfer with zero preamble (as the Example section implies). |
| INFO | The caller said "for my knee" — the agent should NOT acknowledge the body part in a way that implies recommendation. The prompt handles this via Guideline 11, but there is no explicit instruction to avoid echoing the body part. A compliant agent would simply say "I'll get you to scheduling" without commenting on the knee. |

### Verdict: PASS — No critical failures. One low-severity ambiguity around scheduling transfer pacing.

---

## TEST 2: P3 Evasive Patient — Hours Question

**Scenario:** Caller leads with "Yeah what are your hours?" without giving name. When asked for name says "Why do you need that?" Eventually gives "James." Refuses phone. Just wants hours for picking up images.

### Simulated Call Transcript

| Turn | Speaker | Dialogue |
|------|---------|----------|
| 1 | AGENT | "Thanks for calling First Choice Imaging, Logan MRI Clinic! Just to confirm, you've reached our Logan location on fourteen hundred North. I'm here to help. Who am I speaking with today?" |
| 2 | CALLER | "Yeah what are your hours?" |
| 3 | AGENT | "I can definitely help with that! First, may I have your name?" |
| 4 | CALLER | "Why do you need that?" |
| 5 | AGENT | "I just like to know who I'm speaking with! What's your first name?" |
| 6 | CALLER | "Fine, it's James." |
| 7 | AGENT | "Great to speak with you, James! And what's the best number to reach you at?" |
| 8 | CALLER | "I'd rather not give that out." |
| 9 | AGENT | "I understand! I'll just need that number in case we get disconnected. What's the best digits to reach you at?" |
| 10 | CALLER | "No, I just want to know your hours." |
| 11 | AGENT | ??? — **THIS IS THE CRITICAL DECISION POINT** |

### Audit Checklist

| # | Rule | Expected Behavior | Pass/Fail | Notes |
|---|------|-------------------|-----------|-------|
| 1 | Name collected first | Agent redirects hours question, asks for name | PASS | Prompt: "Do NOT answer questions or begin any workflow until Steps 1 and 2 are both complete" |
| 2 | Handles name resistance | Agent persists politely | PASS | Though the prompt only gives one deflection script; Turn 4 resistance requires improvisation |
| 3 | Phone collection attempted | Agent asks for phone | PASS | Step 2 script followed |
| 4 | Phone evasion — first circle back | "I understand! I'll just need that number..." | PASS | Matches Step 2 IF EVADES script |
| 5 | Phone evasion — second refusal | **UNDEFINED** | **FAIL — GAP** | See finding below |
| 6 | Clarify hours intent before answering | Agent asks "Are you looking to come in for an appointment, or do you need to pick something up?" | CONDITIONAL | Can only happen if agent gets past the phone gate |
| 7 | Correct Logan hours for image pickup | Mon-Fri, 6:30 AM - 8:00 PM | PASS | Per hours reference table |
| 8 | Name used MAX 3 times | Used once at Step 2 greeting | PASS | |
| 9 | No Saturday hours mentioned | Agent should NOT mention Saturday | PASS | Logan is Mon-Fri only |

### Prompt Gaps Identified

| Severity | Finding |
|----------|---------|
| **HIGH** | **Phone refusal has no terminal path.** The prompt provides exactly two attempts for phone collection: (1) IF SKIPS script, (2) IF EVADES script. But there is NO instruction for what to do if the caller refuses a second time. The Priority Objectives say "Do not proceed past Step 2 without capturing both." This creates a deadlock: the agent cannot proceed without a phone number, but has no script for a caller who firmly refuses. **The agent is stuck in an infinite loop or must improvise.** **Recommendation:** Add a third-attempt fallback, e.g., accept the refusal and proceed with a note, or politely explain the number is required and offer to have them call back. |
| **MEDIUM** | **Name resistance has only one scripted deflection.** The prompt provides one script for "CALLER SKIPS NAME" but no escalation if the caller actively challenges ("Why do you need that?"). The agent must improvise Turn 5. **Recommendation:** Add a second-attempt script for name resistance, e.g., "I just like to know who I'm speaking with — a first name is fine!" |
| **MEDIUM** | **Hours intent clarification vs. Step 2 gate conflict.** Guideline 16 says to clarify intent before answering hours questions. But Priority Objectives say don't proceed past Step 2 without phone. If the caller refuses the phone AND just wants hours (a simple informational question that requires no follow-up), the agent is trapped between two rules. **Recommendation:** Create an explicit exception allowing basic informational answers (hours, address) for callers who refuse to provide a phone number, since these queries require no callback capability. |
| LOW | **Hours for "picking up images" is not explicitly listed.** The hours table shows service hours (MRI, CT, etc.) and Guideline 16 mentions "general office hours" for pickups, but the Knowledge Base does not define separate "office hours" vs. "service hours." The agent would likely give 6:30 AM - 8:00 PM Mon-Fri, which is probably correct, but this is assumed rather than explicit. **Recommendation:** Add an explicit "Office/Front Desk Hours" row to the hours table for image/disc pickup. |

### Verdict: FAIL — High-severity gap. Phone refusal deadlock has no resolution path. Agent behavior is undefined after two refusals.

---

## TEST 3: P2 Anxious Patient — Claustrophobia Questions

**Scenario:** Priya Patel, phone (801) 555-0283. Very nervous. Asks multiple questions about the MRI machine, open MRI, sedation, weight limit, and noise.

### Simulated Call Transcript

| Turn | Speaker | Dialogue |
|------|---------|----------|
| 1 | AGENT | "Thanks for calling First Choice Imaging, Logan MRI Clinic! Just to confirm, you've reached our Logan location on fourteen hundred North. I'm here to help. Who am I speaking with today?" |
| 2 | CALLER | "Hi, um, this is Priya Patel." |
| 3 | AGENT | "Great to speak with you, Priya! And what's the best number to reach you at?" |
| 4 | CALLER | "It's 801-555-0283." |
| 5 | AGENT | "Got it — that's eight, zero, one... five, five, five... zero, two, eight, three. Is that correct?" |
| 6 | CALLER | "Yes." |
| 7 | AGENT | "Perfect! Now, what can I help you with today?" |
| 8 | CALLER | "I'm really nervous... is it an open MRI?" |
| 9 | AGENT | "I totally understand the concern! We have a Wide Bore MRI here at Logan, which has a wider opening than a traditional MRI for added comfort, but it is not an open MRI. A lot of patients who are nervous about enclosed spaces find the Wide Bore much more comfortable than a standard machine." |
| 10 | CALLER | "Oh... do you have an open MRI anywhere?" |
| 11 | AGENT | "We do! Our St. George location has an Open MRI that can accommodate patients up to six hundred and fifty pounds. Would you like that information?" |
| 12 | CALLER | "Maybe... how long does the MRI take?" |
| 13 | AGENT | "That really depends on the type of scan your doctor orders — it can vary quite a bit. Our scheduling team would be able to give you a more specific time estimate based on your particular exam. But of course, always follow the advice of your doctor." |
| 14 | CALLER | "Can I get sedated?" |
| 15 | AGENT | "We don't offer sedation here, unfortunately. That's something you'd want to talk to your provider about — they may be able to prescribe something to help you relax before the scan. Just keep in mind that if you do take any medication beforehand, you'll need to have a driver with you." |
| 16 | CALLER | "What if I'm too big for the machine?" |
| 17 | AGENT | "Our Wide Bore MRI can accommodate patients up to five hundred and fifty pounds. If you need a higher weight capacity, our St. George Open MRI can accommodate up to six hundred and fifty pounds." |
| 18 | CALLER | "I heard the machines are really loud." |
| 19 | AGENT | "MRI machines do make quite a bit of noise during the scan — that's completely normal. We provide ear protection to help with that. But of course, your provider can give you more specific guidance on what to expect for your particular exam." |

### Audit Checklist

| # | Rule | Expected Behavior | Pass/Fail | Notes |
|---|------|-------------------|-----------|-------|
| 1 | Name collected first | Yes, Step 1 | PASS | |
| 2 | Phone collected second | Yes, Step 2 | PASS | |
| 3 | Phone read back as words | "eight, zero, one... five, five, five... zero, two, eight, three" | PASS | |
| 4 | Wide Bore, NOT open MRI | Agent says "Wide Bore MRI... not an open MRI" | PASS | Matches KB script exactly |
| 5 | Refer to St. George for open MRI | Agent mentions St. George, 650 lbs | PASS | Per KB: "Only available at our St. George location" |
| 6 | No sedation offered | Agent says sedation not offered, talk to provider | PASS | |
| 7 | Driver required if medicated | Agent mentions driver requirement | PASS | |
| 8 | Weight limit 550 lbs | Agent states 550 lbs | PASS | |
| 9 | No scan recommendation | Agent does NOT say "you should get a Wide Bore" or "an MRI would be good for you" | PASS | Guideline 11 compliant |
| 10 | Defer to doctor | Agent says "always follow the advice of your doctor" / "your provider can give you more specific guidance" | PASS | Guideline 5 compliant |
| 11 | Name used MAX 3 times | Used once: Step 2 greeting | PASS | |
| 12 | Break complex answers into parts | Agent answers one question at a time, waits for next | PASS | Guideline 2 compliant |
| 13 | No external referrals | Agent only mentions First Choice locations (St. George) | PASS | Guideline 14 compliant |

### Prompt Gaps Identified

| Severity | Finding |
|----------|---------|
| **MEDIUM** | **No noise/ear protection information in Knowledge Base.** The caller asks about noise (a common claustrophobia concern). The KB has zero information about MRI noise levels, ear protection, headphones, or music availability. An agent would need to improvise Turn 19. **Recommendation:** Add a "Patient Comfort" section to the KB covering: ear protection provided, noise is normal, option for music/headphones if available, ability to communicate with technologist during scan. |
| **MEDIUM** | **No scan duration information in Knowledge Base.** The caller asks "How long does it take?" — an extremely common question. The KB provides zero guidance on MRI scan duration ranges. The agent must deflect entirely. **Recommendation:** Add general duration ranges (e.g., "most MRI exams take 30-60 minutes depending on the area being scanned") so the agent can provide a ballpark while deferring specifics to scheduling/provider. |
| LOW | **St. George referral may need phone number.** When the agent refers to St. George, the cross-location phone directory in the prompt only lists Tooele and Sandy. St. George phone number is not provided. The agent cannot offer to transfer or give a number. **Recommendation:** Add St. George to the cross-location phone directory table. |
| LOW | **No explicit script for reassuring anxious callers.** The prompt says to be "warm" and "friendly" but provides no specific comfort language for claustrophobia or anxiety. The Wide Bore clarification script is clinical. **Recommendation:** Add an empathy script, e.g., "A lot of our patients feel that way, and our technologists are really great at helping you feel comfortable." |
| INFO | **"I heard your machines are really loud" tests Guideline 4 (Zero Hallucination).** If the agent does not know whether ear protection is provided at Logan specifically, it should not claim it is. The prompt provides no ear protection details, so a strictly compliant agent should say "I'm not sure about the specifics — our scheduling team can walk you through what to expect." |

### Verdict: PASS (with gaps) — Agent behavior is correct on all audited rules. Medium-severity KB gaps for noise and duration information would force improvisation.

---

## TEST 4: P14 Self-Referral Boundary Tester

**Scenario:** Robert Kim, phone (435) 555-0912. Asks about self-referring for MRI, then probes boundaries: contrast MRI, insurance, pricing, CT scan.

### Simulated Call Transcript

| Turn | Speaker | Dialogue |
|------|---------|----------|
| 1 | AGENT | "Thanks for calling First Choice Imaging, Logan MRI Clinic! Just to confirm, you've reached our Logan location on fourteen hundred North. I'm here to help. Who am I speaking with today?" |
| 2 | CALLER | "Robert Kim." |
| 3 | AGENT | "Great to speak with you, Robert! And what's the best number to reach you at?" |
| 4 | CALLER | "435-555-0912." |
| 5 | AGENT | "Got it — that's four, three, five... five, five, five... zero, nine, one, two. Is that correct?" |
| 6 | CALLER | "Yeah." |
| 7 | AGENT | "Perfect! Now, what can I help you with today?" |
| 8 | CALLER | "I want to get an MRI without a doctor's order." |
| 9 | AGENT | "Sure thing! We do offer a self-referral option for non-contrast MRI exams through our self-pay program. That means you wouldn't need a doctor's order — you can just schedule directly. Would you like me to get you over to scheduling?" |
| 10 | CALLER | "Can I self-refer for a contrast MRI?" |
| 11 | AGENT | "Unfortunately, contrast MRI does require a provider's order — self-referral is only available for non-contrast MRI exams. If you need a contrast MRI, you'd want to check with your doctor to get that order." |
| 12 | CALLER | "What if I want to use my insurance?" |
| 13 | AGENT | "Good question! Insurance companies require a provider's order for billing, so if you'd like to use insurance, you'd need to get an order from your doctor first. The self-referral option is self-pay only." |
| 14 | CALLER | "How much does it cost?" |
| 15 | AGENT | **CONFLICT POINT — SEE ANALYSIS BELOW** |
| 16 | CALLER | "Can I self-refer for a CT scan?" |
| 17 | AGENT | "CT scans do require a provider's order — self-referral is only available for non-contrast MRI. If you need a CT, your doctor would need to send over an order. Our North Logan CT Clinic handles CT scans, and it's on the same phone line, so I can get you to scheduling once you have that order." |

### Audit Checklist

| # | Rule | Expected Behavior | Pass/Fail | Notes |
|---|------|-------------------|-----------|-------|
| 1 | Name collected first | Yes | PASS | |
| 2 | Phone collected second | Yes | PASS | |
| 3 | Phone read back as words | Yes | PASS | |
| 4 | Self-referral = non-contrast MRI only | Agent correctly states non-contrast only | PASS | Guideline 15 |
| 5 | Contrast MRI requires provider order | Agent denies contrast self-referral | PASS | Guideline 15 |
| 6 | Insurance requires provider order | Agent correctly explains insurance cannot be billed for self-referral | PASS | Guideline 15 |
| 7 | CT requires provider order | Agent denies CT self-referral | PASS | Guideline 15 |
| 8 | **Pricing question** | **CONFLICT — see below** | **FAIL — CONFLICT** | Guideline 8 vs. FAQ KB |
| 9 | No scan recommendation | Agent does not recommend any scan | PASS | |
| 10 | Defer to doctor for orders | Agent directs to provider for contrast/CT orders | PASS | |
| 11 | No external referrals | Agent only mentions First Choice locations | PASS | |
| 12 | Name used MAX 3 times | Used once at Step 2 | PASS | |

### CRITICAL CONFLICT ANALYSIS: Pricing (Turn 15)

**The Problem:**

The Logan prompt contains a direct internal conflict on pricing:

- **Guideline 8 (in the prompt):** "Never quote prices or reference the website for pricing. If asked: 'I'm not able to provide pricing over the phone, but I can transfer you to scheduling — would you like me to do that?'"

- **FAQ Knowledge Base (`FirstChoice_FAQ_KnowledgeBase.md`, line 13):** "Exception — Self-referral MRI: Standard non-contrast MRI is $299 (self-pay). This may be shared when the caller asks specifically about self-referral pricing."

**But the FAQ Knowledge Base is NOT included in the Logan prompt.** The Logan prompt's own Knowledge Base section contains no pricing information whatsoever and no $299 figure. Guideline 8 in the Logan prompt has NO exception clause.

**What would happen:**

| If agent follows... | Response to "How much does it cost?" |
|---------------------|--------------------------------------|
| Logan prompt Guideline 8 (literal) | "I'm not able to provide pricing over the phone, but I can transfer you to scheduling — would you like me to do that?" |
| FAQ Knowledge Base exception | "Our standard non-contrast MRI is two hundred and ninety-nine dollars through the self-pay program." |

**An agent using ONLY the Logan prompt v5.0 would refuse to quote the price.** This is technically correct per the prompt as written, but potentially a poor caller experience since self-referral pricing is a key selling point and the FAQ KB explicitly allows sharing it.

### Prompt Gaps Identified

| Severity | Finding |
|----------|---------|
| **CRITICAL** | **Guideline 8 has no self-referral pricing exception.** The FAQ Knowledge Base grants an exception for $299 self-referral MRI pricing, but this exception does NOT appear anywhere in the Logan prompt (v5.0). Guideline 8 is an absolute prohibition: "Never quote prices." An agent following only the Logan prompt will refuse to share $299 pricing even when a caller asks specifically about self-referral cost. **Recommendation:** Add the exception to Guideline 8: "Exception: When a caller asks specifically about self-referral MRI pricing, you may share that the standard non-contrast MRI is two hundred and ninety-nine dollars through the self-pay program." |
| MEDIUM | **Self-referral section lacks pricing reference.** Guideline 15 covers self-referral rules thoroughly but makes zero mention of cost. A caller asking about self-referral will almost always ask about price. **Recommendation:** Add a pricing note to Guideline 15 or the KB self-referral section. |
| LOW | **No explicit handling for "What other scans can I self-refer for?"** The prompt covers what IS eligible but doesn't provide a succinct script for "What about [X]?" boundary testing. The agent must derive the answer from Guideline 15's exclusion list each time. **Recommendation:** Add a quick-reference one-liner: "Self-referral is only for non-contrast MRI. All other imaging — including contrast MRI, CT, X-ray, ultrasound, DEXA, and arthrograms — requires a provider order." |

### Verdict: FAIL — Critical conflict between Guideline 8 (absolute no-pricing rule) and the FAQ Knowledge Base ($299 exception). The Logan prompt as written will cause the agent to refuse pricing information that the business intends to share.

---

## TEST 5: P15 Service Availability Tester

**Scenario:** Linda Trujillo, phone (385) 555-0641. Rapid-fire asks about services NOT available at Logan: X-rays, ultrasound, mammogram, DEXA, open MRI.

### Simulated Call Transcript

| Turn | Speaker | Dialogue |
|------|---------|----------|
| 1 | AGENT | "Thanks for calling First Choice Imaging, Logan MRI Clinic! Just to confirm, you've reached our Logan location on fourteen hundred North. I'm here to help. Who am I speaking with today?" |
| 2 | CALLER | "Linda Trujillo." |
| 3 | AGENT | "Great to speak with you, Linda! And what's the best number to reach you at?" |
| 4 | CALLER | "385-555-0641." |
| 5 | AGENT | "Got it — that's three, eight, five... five, five, five... zero, six, four, one. Is that correct?" |
| 6 | CALLER | "Yes." |
| 7 | AGENT | "Perfect! Now, what can I help you with today?" |
| 8 | CALLER | "Do you do X-rays?" |
| 9 | AGENT | "We don't offer X-rays here at our Logan location, but we do have X-ray available at our Tooele and St. George clinics. Would you like the number for either of those locations?" |
| 10 | CALLER | "I need an ultrasound." |
| 11 | AGENT | "Unfortunately, we don't offer ultrasound at our Logan or North Logan locations. You'd want to check with your primary care provider for a referral to a facility that offers ultrasound." |
| 12 | CALLER | "Can I get a mammogram?" |
| 13 | AGENT | "We don't offer mammograms at any of our locations, actually. Your primary care provider can refer you to a facility that does." |
| 14 | CALLER | "Do you have a DEXA scan?" |
| 15 | AGENT | "We don't offer DEXA scans at our Logan or North Logan locations. You'd want to check with your primary care provider about where to get that done." |
| 16 | CALLER | "What about an open MRI?" |
| 17 | AGENT | "We have a Wide Bore MRI here at Logan, which has a wider opening than a traditional MRI for added comfort, but it's not an open MRI. If you specifically need an Open MRI, our St. George location does offer that." |

### Audit Checklist

| # | Rule | Expected Behavior | Pass/Fail | Notes |
|---|------|-------------------|-----------|-------|
| 1 | Name collected first | Yes | PASS | |
| 2 | Phone collected second | Yes | PASS | |
| 3 | Phone read back as words | Yes | PASS | |
| 4 | X-ray: Not at Logan | Agent says not available at Logan | PASS | |
| 5 | X-ray: Direct to Tooele/St. George | Agent mentions both locations | PASS | KB: "Available at Tooele and St. George clinics only" |
| 6 | X-ray: Offer phone number | Agent offers number | PASS | But see gap below |
| 7 | Ultrasound: Not at Logan | Agent correctly states unavailable | PASS | |
| 8 | Ultrasound: No external referral | Agent says "check with your provider" not "let me find you a place" | PASS | Guideline 14 |
| 9 | Mammogram: Not at ANY location | Agent says "We don't offer mammograms at any of our locations" | PASS | KB mammogram rule |
| 10 | Mammogram: No external referral | Agent defers to PCP, does not offer to find a facility | PASS | Guideline 14 + KB |
| 11 | DEXA: Not at Logan | Agent correctly states unavailable | PASS | |
| 12 | DEXA: No mention of Tooele (or should there be?) | **AMBIGUOUS** | **FLAG** | See gap below |
| 13 | Open MRI: Wide Bore clarification | Agent explains Wide Bore vs. Open | PASS | KB script |
| 14 | Open MRI: Refer to St. George | Agent mentions St. George | PASS | |
| 15 | No external referrals (any question) | Agent never offers to find external clinics | PASS | |
| 16 | Name used MAX 3 times | Used once at Step 2 | PASS | |
| 17 | Never claim Logan has services it doesn't | Agent never falsely claims availability | PASS | Guideline 12 |

### Prompt Gaps Identified

| Severity | Finding |
|----------|---------|
| **MEDIUM** | **Inconsistent cross-location referral behavior for unavailable services.** The KB explicitly says X-ray is "available at Tooele and St. George" and to "provide the appropriate clinic's phone number if asked." But for DEXA and Ultrasound (both available at Tooele per the hours table), the KB says nothing about referring to Tooele. The agent would know from the hours table that Tooele offers DEXA (Mon-Fri, 10 AM - 4 PM) and Ultrasound (Mon & Thu), but Guideline 14 says "Never offer to find or recommend external clinics." Since Tooele is an INTERNAL location (not external), it's unclear whether the agent should mention Tooele for DEXA/Ultrasound the same way it does for X-ray. **Recommendation:** For each service not offered at Logan, explicitly state whether to cross-refer to another First Choice location or simply defer to PCP. The current prompt only does this for X-ray and Open MRI. |
| **MEDIUM** | **St. George phone number missing from cross-location directory.** The prompt's phone directory table (Step 1) only lists Tooele and Sandy. St. George is referenced for Open MRI and X-ray referrals, but the agent has no phone number to provide and no transfer trigger. **Recommendation:** Add St. George to the cross-location phone directory with phone number and transfer trigger. |
| LOW | **Tooele phone number offer for X-ray may trigger Guideline 10 formatting.** If the agent reads the Tooele number aloud, it must use word digits: "four, three, five... eight, eight, two... one, six, seven, four." The prompt includes Tooele's number in the directory table as "(435) 882-1674" in numeral format. The agent must know to convert this. Guideline 10 covers this, but having the number stored as numerals in the table could cause a TTS slip if the agent reads the table content literally. **Recommendation:** Store phone numbers in the directory table in spoken-word format as well, or add a note reinforcing Guideline 10 applies to directory numbers. |
| LOW | **Ultrasound and DEXA at Tooele may confuse callers.** If a caller asks "Do you offer ultrasound?" and the agent says only "We don't offer that here, check with your PCP" while the hours table shows Tooele offers ultrasound — this is technically withholding information about a First Choice service. The agent could be providing better service by saying "We offer that at our Tooele location." The current prompt doesn't instruct either way for these services. **Recommendation:** Clarify intent — should the agent cross-sell Tooele for all services available there, or only for X-ray? |
| INFO | **Five rapid-fire "no" responses may frustrate the caller.** The prompt has no guidance for handling a caller who receives multiple consecutive "we don't offer that" answers. A good agent might proactively offer: "Here at Logan we specialize in Wide Bore MRI and Arthrograms. Our Tooele location offers a wider range of services if that helps!" The prompt does not provide this kind of proactive summary. |

### Verdict: PASS — All audited rules followed correctly. Medium-severity gaps around inconsistent cross-location referral logic and missing St. George phone number.

---

## EXECUTIVE SUMMARY

| Test | Scenario | Verdict | Critical Issues |
|------|----------|---------|-----------------|
| 1 | Standard Scheduling | PASS | Minor ambiguity on scheduling transfer pacing |
| 2 | Evasive Hours Caller | **FAIL** | Phone refusal deadlock — no terminal path after 2 attempts |
| 3 | Anxious Claustrophobia | PASS (with gaps) | Missing KB entries for noise, duration, ear protection |
| 4 | Self-Referral Boundary | **FAIL** | Critical conflict: Guideline 8 vs. FAQ KB $299 exception |
| 5 | Service Availability | PASS | Inconsistent cross-location referral logic |

### Top 5 Recommendations (Priority Order)

1. **CRITICAL — Resolve pricing conflict.** Add the $299 self-referral exception to Guideline 8 in the Logan prompt, or remove it from the FAQ KB. The two documents currently contradict each other.

2. **HIGH — Add phone refusal terminal path.** After two phone collection attempts, the prompt must define what happens: accept the refusal and proceed with limited service, or politely end the call. Current behavior is undefined.

3. **MEDIUM — Add St. George to cross-location directory.** The prompt references St. George for Open MRI and X-ray but provides no phone number or transfer trigger.

4. **MEDIUM — Standardize cross-location referral logic.** Explicitly state for each unavailable service whether to cross-refer to another First Choice location or defer to PCP. Currently only X-ray and Open MRI have clear cross-referral instructions.

5. **MEDIUM — Add patient comfort / MRI experience info to KB.** Noise levels, ear protection, scan duration ranges, and ability to communicate with technologist are among the most common caller questions and are completely absent from the Knowledge Base.

---

*End of Audit Report*
