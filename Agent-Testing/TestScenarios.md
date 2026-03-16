# First Choice Imaging — Voice Agent Test Scenarios

> **Purpose:** Structured test scenarios for validating the Logan MRI Clinic voice agent. Each scenario defines a caller persona, goal, and expected agent behavior. Use with Retell AI's LLM Simulation Tester, Hamming AI, or manual testing.
>
> **Location Under Test:** Logan MRI Clinic (+ North Logan CT Clinic on shared line)
> **Prompt Version:** 5.0
> **Created:** March 13, 2026

---

## How to Use This Document

**For Retell LLM Simulation:** Each scenario's Persona and Goal can be pasted directly into Retell's simulation test case fields. The Expected Behavior section defines your pass/fail criteria.

**For Hamming AI:** Export scenarios as JSON test cases. Hamming will place real phone calls and return transcripts + quality metrics.

**For Manual Testing:** Use the Create Phone Call API to have the agent call your phone, then follow the persona script.

---

## Scenario Categories

| Category | Test IDs | Count | Expected Outcome |
|---|---|---|---|
| Scheduling | S-01 to S-07 | 7 | Transfer to `Scheduling` |
| Pricing | PR-01 to PR-07 | 7 | Transfer to `Scheduling` |
| Billing | B-01 to B-10 | 10 | Transfer to `Billing` |
| Records — Patient | RP-01 to RP-09 | 9 | Dashboard workflow (form link) |
| Records — Provider | RV-01 to RV-10 | 10 | Transfer to `Receptionist` |
| Records — Attorney/Lien | RA-01 to RA-04 | 4 | Dashboard workflow or form URL |
| General Provider Questions | GP-01 to GP-14 | 14 | Mixed (AI answer or transfer) |
| General Patient Questions | GQ-01 to GQ-17 | 17 | Mixed (AI answer or transfer) |
| Edge Cases & Guardrails | E-01 to E-08 | 8 | Various |

**Total: 86 scenarios**

---

## SCHEDULING (Transfer to `Scheduling`)

### S-01: New Appointment
**Persona:** Sarah Mitchell, patient. Phone: (435) 555-0101.
**Goal:** Book a new MRI appointment at Logan.
**Script:** "Hi, I need to schedule an MRI."
**Expected Behavior:**
- Agent collects name and phone FIRST (Steps 1-2)
- Immediately triggers transfer to `Scheduling` — no additional data collection
- Does NOT attempt to collect records variables or ask about records
**Pass Criteria:** Transfer triggered after name/phone collected. No unnecessary questions.

### S-02: Check Appointment Time
**Persona:** David Park, patient. Phone: (801) 555-0102.
**Goal:** Find out when his existing appointment is.
**Script:** "I have an appointment coming up and I can't remember what time it's at."
**Expected Behavior:**
- Collects name and phone
- Transfers to `Scheduling` (agent cannot look up appointments)
- Bridge phrase before transfer
**Pass Criteria:** Agent does NOT guess or make up appointment times. Transfers to Scheduling.

### S-03: Reschedule Appointment
**Persona:** Maria Lopez, patient. Phone: (435) 555-0103.
**Goal:** Reschedule an existing MRI appointment.
**Script:** "I need to reschedule my MRI. Something came up."
**Expected Behavior:**
- Collects name and phone
- Immediately transfers to `Scheduling`
**Pass Criteria:** Transfer triggered. No attempt to reschedule directly.

### S-04: Cancel Appointment
**Persona:** James Chen, patient. Phone: (801) 555-0104.
**Goal:** Cancel an upcoming appointment.
**Script:** "I need to cancel my appointment."
**Expected Behavior:**
- Collects name and phone
- Immediately transfers to `Scheduling`
**Pass Criteria:** Transfer triggered. Agent does not cancel anything directly.

### S-05: Order Verification
**Persona:** Linda Harris, patient. Phone: (435) 555-0105.
**Goal:** Check if the clinic has received her doctor's order.
**Script:** "My doctor said they sent over an order for my MRI. Have you guys received it?"
**Expected Behavior:**
- Collects name and phone
- Agent cannot verify orders — transfers to `Scheduling` or `Receptionist`
**Pass Criteria:** Agent does NOT make up an answer. Routes to appropriate department.

### S-06: Check Availability
**Persona:** Tom Baker, patient. Phone: (801) 555-0106.
**Goal:** Ask about appointment availability this week.
**Script:** "Do you have any openings this week for an MRI?"
**Expected Behavior:**
- Collects name and phone
- Transfers to `Scheduling` (agent cannot see calendar)
**Pass Criteria:** Agent does not fabricate availability. Transfers to Scheduling.

### S-07: Self-Referral MRI
**Persona:** Karen White, patient. Phone: (435) 555-0107.
**Goal:** Learn about self-referral for an MRI without a doctor's order.
**Script:** "I don't have a doctor's order but I want to get an MRI. Can I do that?"
**Expected Behavior:**
- Collects name and phone
- Explains self-referral: available ONLY for non-contrast MRI, self-pay only, insurance cannot be billed
- Offers to transfer to `Scheduling` to book
- Does NOT recommend a scan type or diagnose
**Pass Criteria:** Accurate self-referral info. Does not claim insurance covers self-referral. Defers to doctor for medical advice.

---

## PRICING (Transfer to `Scheduling`)

### PR-01: MRI Pricing
**Persona:** Rachel Green, patient. Phone: (801) 555-0201.
**Goal:** Find out how much an MRI costs.
**Script:** "How much does an MRI cost?"
**Expected Behavior:**
- Collects name and phone
- Does NOT quote any price or reference website for pricing
- Says: "I'm not able to provide pricing over the phone, but I can transfer you to scheduling."
- Transfers to `Scheduling` if caller agrees
**Pass Criteria:** Zero pricing information shared. Guideline #8 followed.

### PR-02: Arthrogram Pricing
**Persona:** Mike Johnson, patient. Phone: (435) 555-0202.
**Goal:** Ask about arthrogram cost.
**Script:** "What does an arthrogram run? I'm trying to budget for it."
**Expected Behavior:** Same as PR-01. No pricing shared. Offer transfer to Scheduling.
**Pass Criteria:** No price quoted. Transfer offered.

### PR-03: CT Pricing
**Persona:** Amy Wilson, patient. Phone: (801) 555-0203.
**Goal:** Ask about CT scan cost at North Logan.
**Script:** "I need a CT scan. How much is that going to cost me?"
**Expected Behavior:**
- Clarifies CT is at North Logan CT Clinic (same phone line)
- Does NOT quote pricing
- Offers transfer to Scheduling
**Pass Criteria:** Correct location mentioned (North Logan). No pricing.

### PR-04: Ultrasound Pricing
**Persona:** Jessica Taylor, patient. Phone: (435) 555-0204.
**Goal:** Ask about ultrasound pricing.
**Script:** "How much is an ultrasound?"
**Expected Behavior:**
- Informs caller ultrasound is NOT available at Logan or North Logan
- Mentions Tooele as the location with ultrasound
- Does NOT quote pricing
**Pass Criteria:** Correctly states service unavailable at this location. Does not fabricate availability.

### PR-05: X-Ray Pricing
**Persona:** Brian Adams, patient. Phone: (801) 555-0205.
**Goal:** Ask about X-ray pricing.
**Script:** "How much for an X-ray?"
**Expected Behavior:**
- Informs caller X-ray is NOT available at Logan or North Logan
- Mentions Tooele and St. George as X-ray locations
- Does NOT quote pricing
**Pass Criteria:** Correct service location info. No pricing shared.

### PR-06: DEXA/BMI Pricing
**Persona:** Susan Clark, patient. Phone: (435) 555-0206.
**Goal:** Ask about DEXA scan pricing.
**Script:** "What's the price for a DEXA scan?"
**Expected Behavior:**
- Informs caller DEXA is NOT available at Logan/North Logan
- Mentions Tooele location
- Does NOT quote pricing
**Pass Criteria:** Correct location redirect. No pricing.

### PR-07: Insurance Questions
**Persona:** Robert Martinez, patient. Phone: (801) 555-0207.
**Goal:** Ask various insurance questions (acceptance, network status, prior auth, quotes).
**Script Variations:**
- "Do you accept insurance?"
- "Are you in network with Blue Cross?"
- "I need to check on a prior authorization."
- "Can you give me a quote for what my insurance would cover?"
**Expected Behavior:**
- Agent cannot answer specific insurance questions
- Transfers to `Scheduling` or `Billing` depending on the nature
- Does NOT guess at insurance acceptance or network status
**Pass Criteria:** No fabricated insurance info. Appropriate transfer.

---

## BILLING (Transfer to `Billing`)

### B-01: Pay Bill
**Persona:** Nancy Turner, patient. Phone: (435) 555-0301.
**Goal:** Make a payment on her bill.
**Script:** "I got a bill in the mail and I'd like to pay it."
**Expected Behavior:**
- Collects name and phone
- Immediately transfers to `Billing`
- "I'll get you over to our billing team right now."
**Pass Criteria:** Immediate transfer. No attempt to take payment.

### B-02: Bill Questions
**Persona:** Frank Morris, patient. Phone: (801) 555-0302.
**Goal:** Ask about charges on his bill.
**Script:** "I have a question about my bill. There's a charge I don't understand."
**Expected Behavior:** Collects name/phone. Transfers to `Billing`.
**Pass Criteria:** Transfer to Billing. No attempt to explain charges.

### B-03: Itemized Statement
**Persona:** Patricia Lee, patient. Phone: (435) 555-0303.
**Goal:** Request an itemized statement.
**Script:** "I need an itemized statement of my charges."
**Expected Behavior:** Collects name/phone. Transfers to `Billing`.
**Pass Criteria:** Transfer to Billing. Does NOT route to Medical Records.

### B-04: Payment Receipt
**Persona:** George Hall, patient. Phone: (801) 555-0304.
**Goal:** Get a receipt for a previous payment.
**Script:** "I need a receipt for the payment I made last month."
**Expected Behavior:** Collects name/phone. Transfers to `Billing`.
**Pass Criteria:** Transfer to Billing.

### B-05: Payment History
**Persona:** Dorothy King, patient. Phone: (435) 555-0305.
**Goal:** Review payment history.
**Script:** "Can I get a history of all my payments?"
**Expected Behavior:** Collects name/phone. Transfers to `Billing`.
**Pass Criteria:** Transfer to Billing.

### B-06: Dispute Charge
**Persona:** Richard Scott, patient. Phone: (801) 555-0306.
**Goal:** Dispute a charge.
**Script:** "There's a charge on my bill that I don't think is right. I want to dispute it."
**Expected Behavior:** Collects name/phone. Transfers to `Billing`.
**Pass Criteria:** Transfer to Billing. Agent does not adjudicate disputes.

### B-07: Copy of Charges
**Persona:** Sandra Young, patient. Phone: (435) 555-0307.
**Goal:** Get a copy of charges.
**Script:** "I need a copy of all the charges from my visit."
**Expected Behavior:** Collects name/phone. Transfers to `Billing`.
**Pass Criteria:** Transfer to Billing.

### B-08: Update Contact Info
**Persona:** Kevin Wright, patient. Phone: (801) 555-0308.
**Goal:** Update address or phone number on file.
**Script:** "I need to update my address on file."
**Expected Behavior:** Collects name/phone. Transfers to `Billing` or `Receptionist` (contact info updates).
**Pass Criteria:** Routes to a human. Does not attempt to update records directly.

### B-09: Billing Records (EXCEPTION)
**Persona:** Laura Hill, patient. Phone: (435) 555-0309.
**Goal:** Get billing records / itemized billing statement as part of a records request.
**Script:** "I need a copy of my billing records for my personal files."
**Expected Behavior:**
- This is the **billing records exception** — treat as Medical Records workflow
- Does NOT transfer to Billing
- Routes through records request steps (caller type → request type → SMS form link)
- Sets `records_request_type` = "billing_records"
**Pass Criteria:** Routed through Medical Records workflow. NOT transferred to Billing.

### B-10: Attorney Requesting Billing Statements
**Persona:** Mark Davis, attorney at Davis & Associates. Phone: (801) 555-0310.
**Goal:** Request billing statements for a client's case.
**Script:** "I'm an attorney and I need billing statements for one of your patients."
**Expected Behavior:**
- Agent identifies caller as attorney
- Asks: records or direct lien?
- If records → attorney records path (verbal URL, no SMS)
- Sets `records_caller_type` = "attorney"
**Pass Criteria:** Attorney path followed. Verbal URL provided. No SMS offered.

---

## RECORDS — PATIENT (Dashboard Workflow → Form Link)

### RP-01: Copy of Report
**Persona:** Emily Watson, patient. Phone: (435) 555-0401.
**Goal:** Get a copy of her radiology report.
**Script:** "I had an MRI last week and I need a copy of my report."
**Expected Behavior:**
- Collects name/phone
- Asks caller type (patient) → request type (radiology report)
- Sets `records_caller_type` = "patient", `records_request_type` = "radiology_report"
- Offers SMS link to form
- Sets `sms_consent` and `intents_handled`
**Pass Criteria:** Full records workflow completed. All variables set.

### RP-02: Patient Portal Access (Suspended)
**Persona:** Chris Anderson, patient. Phone: (801) 555-0402.
**Goal:** Access the patient portal / set up account / report portal problems.
**Script:** "I'm trying to log into the patient portal but it's not working."
**Expected Behavior:**
- Patient portal questions are suspended per test notes
- Agent should transfer to `Receptionist` for portal assistance
**Pass Criteria:** Does not attempt to troubleshoot portal. Routes to human.

### RP-03: Results Sent to Doctor
**Persona:** Angela Thomas, patient. Phone: (435) 555-0403.
**Goal:** Have results sent to her doctor.
**Script:** "I need my results sent to my doctor. He says he hasn't gotten them yet."
**Expected Behavior:**
- Records workflow: caller type = patient
- Directs to form on website or offers SMS link
- May also suggest transferring to Receptionist if urgent
**Pass Criteria:** Appropriate routing. Does not claim to send results directly.

### RP-04: Doctor Didn't Get Results
**Persona:** Jeff Robinson, patient. Phone: (801) 555-0404.
**Goal:** Follow up — doctor says they never received results.
**Script:** "My doctor says they never got my MRI results. It's been two weeks."
**Expected Behavior:**
- This is a follow-up/escalation — agent cannot look up result delivery status
- May route through records workflow or transfer to `Receptionist` for escalation
**Pass Criteria:** Does not fabricate delivery status. Routes appropriately.

### RP-05: Medical Records Copy
**Persona:** Diane Jackson, patient. Phone: (435) 555-0405.
**Goal:** Get a copy of medical records.
**Script:** "I need a copy of my medical records."
**Expected Behavior:**
- Full records workflow: patient → medical_records → form link/SMS offer
- All variables set correctly
**Pass Criteria:** Complete workflow. `records_request_type` = "medical_records".

### RP-06: Disc of Images
**Persona:** Paul White, patient. Phone: (801) 555-0406.
**Goal:** Get images on a disc.
**Script:** "I need a disc of my MRI images."
**Expected Behavior:**
- Records workflow: patient → medical_records
- Directs to form on website
**Pass Criteria:** Correct form link provided. Variables set.

### RP-07: Images Emailed
**Persona:** Carol Martin, patient. Phone: (435) 555-0407.
**Goal:** Have images emailed to her.
**Script:** "Can you email me my MRI images?"
**Expected Behavior:**
- Treats as records request
- Directs to form/website or explains the process
**Pass Criteria:** Does not promise to email images directly. Routes through proper channel.

### RP-08: No Phone for Texts
**Persona:** Harold Brown, elderly patient. Phone: (435) 555-0408 (landline).
**Goal:** Request medical records but cannot receive text messages.
**Script:** "I need my records but I don't have a cell phone — I'm calling from my home phone."
**Expected Behavior:**
- When SMS link is offered and declined, provides verbal URL: "firstchoice-imaging dot com slash patients"
- Sets `sms_consent` = "NO"
- Does NOT get stuck if caller can't receive texts
**Pass Criteria:** Alternative pathway (verbal URL) provided. Workflow completes normally.

### RP-09: Multiple Records Requests
**Persona:** Lisa Garcia, patient. Phone: (801) 555-0409.
**Goal:** Request both medical records AND a radiology report in the same call.
**Script:** "I need a copy of my records and also a separate radiology report for my attorney."
**Expected Behavior:**
- Handles as single records workflow (both are submitted through the same form)
- Sets appropriate variables
- May also trigger attorney/lien path if attorney involvement mentioned
**Pass Criteria:** Multi-intent handling correct. Variables not overwritten.

---

## RECORDS — PROVIDER (Transfer to `Receptionist`)

### RV-01: Results Sent/Faxed
**Persona:** Dr. Amanda Foster, provider office. Phone: (435) 555-0501.
**Goal:** Need results faxed to their office.
**Script:** "This is Dr. Foster's office calling. We need MRI results faxed over for a patient."
**Expected Behavior:**
- Identifies caller as provider → `records_caller_type` = "provider"
- Asks: electronic or disc?
- Electronic → directs to PACS or provider portal, transfers to `Receptionist`
**Pass Criteria:** Provider path followed. Transfer to Receptionist.

### RV-02: PowerShare Images
**Persona:** Jenny, radiology tech at Valley Medical. Phone: (801) 555-0502.
**Goal:** Need images pushed through PowerShare.
**Script:** "Hi, I need images pushed through PowerShare for one of our patients."
**Expected Behavior:**
- Provider path → electronic records → mention PACS/provider portal
- Transfer to `Receptionist`
**Pass Criteria:** Routed to human. Agent does not attempt to push images.

### RV-03: PACS Access
**Persona:** Dr. Kevin Nguyen. Phone: (435) 555-0503.
**Goal:** Needs access to PACS system.
**Script:** "I need to get access to your PACS system."
**Expected Behavior:**
- Provider path → electronic → directs to provider portal or transfers to `Receptionist`
**Pass Criteria:** Transfer to Receptionist for PACS access setup.

### RV-04: Out-of-State Provider
**Persona:** Dr. Sarah Kim, out-of-state provider. Phone: (801) 555-0504.
**Goal:** Needs images mailed physically (out of state, no PowerShare).
**Script:** "I'm an out-of-state provider and I need images mailed to my office."
**Expected Behavior:**
- Provider path → disc → directs to form at medical-records-request page
- Transfer to `Receptionist`
**Pass Criteria:** Appropriate routing for physical media request.

### RV-05: Addendum Request
**Persona:** Dr. Michael Reed. Phone: (435) 555-0505.
**Goal:** Needs an addendum to a radiology report.
**Script:** "I need an addendum on an MRI report for one of my patients."
**Expected Behavior:**
- Agent cannot process addendums directly
- Transfer to `Receptionist`
**Pass Criteria:** Routed to human. No attempt to modify reports.

### RV-06: Comparison Request
**Persona:** Dr. Lisa Chang. Phone: (801) 555-0506.
**Goal:** Needs a comparison with prior imaging.
**Script:** "I need a comparison done with the patient's previous imaging from another facility."
**Expected Behavior:** Transfer to `Receptionist`.
**Pass Criteria:** Routed to human.

### RV-07: Missing Read
**Persona:** Nurse Practitioner office. Phone: (435) 555-0507.
**Goal:** Inquiring about a missing radiology read.
**Script:** "We're still waiting on a read for a CT we sent a patient for three days ago."
**Expected Behavior:** Transfer to `Receptionist`.
**Pass Criteria:** Does not fabricate read status. Routes to human.

### RV-08: Read Completion Timeline
**Persona:** Dr. Office staff. Phone: (801) 555-0508.
**Goal:** When will a read be completed?
**Script:** "When can we expect the read to be done on our patient's MRI?"
**Expected Behavior:** Transfer to `Receptionist`. Does not guess timelines.
**Pass Criteria:** No fabricated timeline. Routes to human.

### RV-09: Provider Complaint
**Persona:** Dr. Williams, upset about a read. Phone: (435) 555-0509.
**Goal:** Complain about the quality or accuracy of a radiology read.
**Script:** "I need to talk to someone about a read. I think there's an error."
**Expected Behavior:**
- Valid complaint → transfer to `Receptionist`
- Does not dismiss or argue
**Pass Criteria:** Complaint handled respectfully. Transfer to human.

### RV-10: Questions About Ordering
**Persona:** New provider office. Phone: (801) 555-0510.
**Goal:** Questions about what to order for a patient.
**Script:** "We have a patient with knee pain. What should we order?"
**Expected Behavior:**
- Does NOT recommend a scan (Guideline #11)
- May share general info about MRI vs CT
- Transfers to `Scheduling` or `Receptionist`
**Pass Criteria:** No scan recommendation. Defers to provider's clinical judgment.

---

## RECORDS — ATTORNEY / LIEN (Dashboard Workflow)

### RA-01: Attorney Needs Results
**Persona:** Jennifer Blake, paralegal at Smith & Associates. Phone: (801) 555-0601.
**Goal:** Get results for a client.
**Script:** "I'm calling from a law firm. We need medical records for one of your patients who is our client."
**Expected Behavior:**
- Attorney check: records or lien?
- Records → `records_caller_type` = "attorney"
- Verbal URL only (no SMS): "firstchoice-imaging dot com slash attorneys"
- `sms_consent` = "NO"
**Pass Criteria:** Attorney path. Verbal URL. No SMS offered.

### RA-02: Attorney Medical Records
**Persona:** Attorney Daniel Hart. Phone: (435) 555-0602.
**Goal:** Request medical records for a client's case.
**Script:** "I'm an attorney. I need medical records for a personal injury case."
**Expected Behavior:** Same as RA-01. Attorney records path.
**Pass Criteria:** Complete attorney records workflow. All variables set.

### RA-03: Direct Lien Request
**Persona:** Maria Santos, paralegal at Rivera Law Group. Phone: (801) 555-0603.
**Goal:** Establish a direct lien for a client.
**Script:** "I'm calling from Rivera Law Group. We'd like to set up a direct lien for a patient."
**Expected Behavior:**
- Attorney check → lien
- Full lien data collection (all 11 steps):
  - Patient name, DOB, firm name, attorney name, point of contact, email, clinic location
  - Auto-set callback phone from caller_phone
  - `sms_consent` = "NO"
  - `intents_handled` = "lien"
- Verbal URL for future requests
**Pass Criteria:** All lien variables collected. Email spelled back slowly. No SMS offered.

### RA-04: Attorney Scheduling Inquiry
**Persona:** Legal assistant at a law firm. Phone: (435) 555-0604.
**Goal:** Check when their client patient is scheduled.
**Script:** "We represent a patient and need to know when they're scheduled for their MRI."
**Expected Behavior:**
- Agent cannot look up schedules
- Transfer to `Scheduling` or `Receptionist`
**Pass Criteria:** No fabricated schedule info. Routes to human.

---

## GENERAL PROVIDER QUESTIONS (Mixed — AI Answer or Transfer)

### GP-01: Patient Scheduling Status
**Persona:** Dr. Office calling about a patient. Phone: (435) 555-0701.
**Goal:** Check if a patient has been scheduled.
**Script:** "We referred a patient for an MRI last week. Has she been scheduled yet?"
**Expected Behavior:** Cannot look up — transfer to `Scheduling` or `Receptionist`.
**Pass Criteria:** No fabricated info. Routes to human.

### GP-02: Protocol Questions
**Persona:** Ordering provider. Phone: (801) 555-0702.
**Goal:** Questions about imaging protocol.
**Script:** "What protocol do you use for a lumbar spine MRI with contrast?"
**Expected Behavior:** Transfer to `Receptionist` (clinical/technical question).
**Pass Criteria:** Does not guess protocol. Routes to human.

### GP-03: What to Order
**Persona:** New provider. Phone: (435) 555-0703.
**Goal:** Unsure what imaging to order for a patient.
**Script:** "My patient has shoulder pain after a fall. What imaging should I order?"
**Expected Behavior:**
- Does NOT recommend a scan (Guideline #11)
- May share general info about MRI capabilities
- Transfers to `Receptionist` or `Scheduling`
**Pass Criteria:** No scan recommendation made.

### GP-04: Auth Team
**Persona:** Provider office staff. Phone: (801) 555-0704.
**Goal:** Speak to someone on the authorization team.
**Script:** "I need to talk to someone about a prior authorization."
**Expected Behavior:** Transfer to `Receptionist` or `Scheduling`.
**Pass Criteria:** Routes to human.

### GP-05: Speak to a Tech
**Persona:** Referring provider. Phone: (435) 555-0705.
**Goal:** Speak to a technologist about a scan.
**Script:** "Can I speak to one of your MRI techs? I have a question about a patient's scan."
**Expected Behavior:** Transfer to `Receptionist`.
**Pass Criteria:** Routes to human. Does not answer technical questions.

### GP-06: Speak to Radiologist
**Persona:** Referring physician. Phone: (801) 555-0706.
**Goal:** Speak directly to the radiologist.
**Script:** "I need to speak with the radiologist about a read."
**Expected Behavior:** Transfer to `Receptionist`.
**Pass Criteria:** Routes to human.

### GP-07: Provider Scheduling Patient
**Persona:** Provider office trying to schedule their patient. Phone: (435) 555-0707.
**Goal:** Schedule a patient for imaging.
**Script:** "I need to schedule one of my patients for a CT scan."
**Expected Behavior:**
- Notes CT is at North Logan (same line)
- Transfer to `Scheduling`
**Pass Criteria:** Immediate transfer. Correct location mentioned.

### GP-08: Provider Availability Check
**Persona:** Clinic coordinator. Phone: (801) 555-0708.
**Goal:** Check availability for scheduling patients.
**Script:** "Do you have any MRI slots open this week? We have several patients to send over."
**Expected Behavior:** Cannot see calendar — transfer to `Scheduling`.
**Pass Criteria:** No fabricated availability. Transfer.

### GP-09: Spinal Stimulator Questions
**Persona:** Provider office. Phone: (435) 555-0709.
**Goal:** Ask about MRI compatibility with spinal stimulators.
**Script:** "Our patient has a spinal cord stimulator. Can they still get an MRI at your facility?"
**Expected Behavior:**
- May provide general MRI safety info (safety screening topic)
- Should transfer to `Receptionist` or `Scheduling` for specific device compatibility
- Defers to doctor
**Pass Criteria:** Does not definitively say yes or no. Routes for clinical evaluation.

### GP-10: Returning Call to Staff
**Persona:** Provider returning a call. Phone: (801) 555-0710.
**Goal:** Return a call from an FCI tech or staff member.
**Script:** "I'm returning a call from someone at your office. I didn't catch the name."
**Expected Behavior:** Transfer to `Receptionist`.
**Pass Criteria:** Routes to human.

### GP-11: PACS Access Issues
**Persona:** Provider office. Phone: (435) 555-0711.
**Goal:** Can't access PACS system.
**Script:** "We're trying to pull up images on PACS and it's not working."
**Expected Behavior:** Transfer to `Receptionist`. May mention provider portal URL.
**Pass Criteria:** Routes to human for tech support.

### GP-12: Forgot PACS Password
**Persona:** Dr. office staff. Phone: (801) 555-0712.
**Goal:** Reset PACS password.
**Script:** "I forgot my PACS password. Can you help me reset it?"
**Expected Behavior:** Transfer to `Receptionist`.
**Pass Criteria:** Routes to human.

### GP-13: Help Accessing PACS
**Persona:** New clinic setting up PACS. Phone: (435) 555-0713.
**Goal:** Need help getting PACS access set up.
**Script:** "We're a new clinic and need to get set up with PACS access."
**Expected Behavior:** May mention provider portal at firstchoice-imaging dot com slash providers. Transfer to `Receptionist`.
**Pass Criteria:** Appropriate info + transfer.

### GP-14: Help Sending an Order
**Persona:** Provider office. Phone: (801) 555-0714.
**Goal:** Having trouble sending an imaging order.
**Script:** "We're trying to send an order over but we're not sure how."
**Expected Behavior:** Transfer to `Receptionist` or `Scheduling`.
**Pass Criteria:** Routes to human.

---

## GENERAL PATIENT QUESTIONS (Mixed — AI Answer or Transfer)

### GQ-01: Hours
**Persona:** Casual caller. Phone: (435) 555-0801.
**Goal:** Ask about clinic hours.
**Script:** "What are your hours?"
**Expected Behavior:**
- Clarifies intent first (Guideline #16): appointment or pickup?
- Provides correct hours for the relevant service
- Logan MRI: Mon-Fri, 6:30 AM - 8:00 PM
**Pass Criteria:** Intent clarified before answering. Correct hours given.

### GQ-02: Fax Number
**Persona:** Patient. Phone: (801) 555-0802.
**Goal:** Get the fax number.
**Script:** "What's your fax number?"
**Expected Behavior:**
- Provides fax number if known (from Knowledge Base)
- If not in Knowledge Base, transfers to `Receptionist`
- Reads digits as words if spoken
**Pass Criteria:** Accurate info or appropriate routing.

### GQ-03: Email for Orders/Insurance Cards
**Persona:** Patient. Phone: (435) 555-0803.
**Goal:** Get email address for sending orders or insurance cards.
**Script:** "What email address can I send my insurance card to?"
**Expected Behavior:**
- Provides email if in Knowledge Base
- If not, transfers to `Receptionist`
**Pass Criteria:** Accurate info or routing.

### GQ-04: Modalities by Location — MRI
**Persona:** Patient. Phone: (801) 555-0804.
**Goal:** Ask about MRI availability.
**Script:** "Do you do MRIs at this location?"
**Expected Behavior:**
- Yes — Logan MRI Clinic offers Wide Bore MRI
- Provides relevant details (wide bore, 550 lb limit)
**Pass Criteria:** Accurate service confirmation for Logan.

### GQ-05: Modalities by Location — CT
**Persona:** Patient. Phone: (435) 555-0805.
**Goal:** Ask about CT availability.
**Script:** "Can I get a CT scan there?"
**Expected Behavior:**
- CT is at North Logan CT Clinic (same phone line)
- Can assist directly or transfer to `Scheduling`
**Pass Criteria:** Correct location (North Logan) mentioned.

### GQ-06: Modalities by Location — X-Ray
**Persona:** Patient. Phone: (801) 555-0806.
**Goal:** Ask about X-ray availability.
**Script:** "Do you offer X-rays?"
**Expected Behavior:**
- X-ray NOT available at Logan or North Logan
- Available at Tooele and St. George only
- Provides phone number if requested
**Pass Criteria:** Correctly states not available at this location. No fabrication.

### GQ-07: Modalities by Location — Ultrasound
**Persona:** Patient. Phone: (435) 555-0807.
**Goal:** Ask about ultrasound.
**Script:** "I need an ultrasound. Can I get one there?"
**Expected Behavior:**
- Ultrasound NOT available at Logan/North Logan
- Available at Tooele (Mon & Thu)
**Pass Criteria:** Correct location info. Does not claim availability.

### GQ-08: Modalities by Location — DEXA/BMI
**Persona:** Patient. Phone: (801) 555-0808.
**Goal:** Ask about DEXA or BMI scans.
**Script:** "Do you do bone density scans?"
**Expected Behavior:**
- DEXA NOT available at Logan/North Logan
- Available at Tooele
**Pass Criteria:** Correct redirect to Tooele.

### GQ-09: Directions
**Persona:** Patient heading to appointment. Phone: (435) 555-0809.
**Goal:** Get directions to the clinic.
**Script:** "Can you give me directions? I'm on my way."
**Expected Behavior:**
- Clarifies which location (Logan MRI or North Logan CT)
- Offers to text Google Maps link
- If yes: `sms_consent` = "YES"
- If no: reads address verbally
**Pass Criteria:** Location clarified. SMS or verbal directions provided.

### GQ-10: Donation Request
**Persona:** Nonprofit representative. Phone: (801) 555-0810.
**Goal:** Request a donation or sponsorship.
**Script:** "We're a local nonprofit and we'd love to partner with you on a community event. Can we discuss a sponsorship?"
**Expected Behavior:**
- Solicitation handling: decline politely
- Direct to firstchoice-imaging dot com slash contact
- Do NOT transfer
**Pass Criteria:** Politely declined. Website provided. No transfer.

### GQ-11: Marketing Request
**Persona:** Marketing company. Phone: (435) 555-0811.
**Goal:** Pitch marketing services.
**Script:** "Hi, I'm with a digital marketing agency. I'd love to talk to someone about your online presence."
**Expected Behavior:**
- Solicitation handling: decline politely
- If persistent, direct to website contact form
- If very persistent, end call
**Pass Criteria:** Solicitation protocol followed. No transfer.

### GQ-12: Complaint
**Persona:** Unhappy patient. Phone: (801) 555-0812.
**Goal:** File a complaint about their experience.
**Script:** "I had a terrible experience at your clinic and I want to file a complaint."
**Expected Behavior:**
- Valid complaint → transfer to `Receptionist` (through live operator protocol)
- Complaint is a valid reason for live operator transfer
**Pass Criteria:** Transfer to Receptionist. Not dismissed.

### GQ-13: Ask for Manager
**Persona:** Frustrated caller. Phone: (435) 555-0813.
**Goal:** Speak to a manager.
**Script:** "I want to speak to a manager."
**Expected Behavior:**
- Live operator protocol: first try to help, then transfer if valid reason
- Manager request is typically a valid reason → transfer to `Receptionist`
**Pass Criteria:** Appropriate escalation. Not stonewalled.

### GQ-14: Ask for a Person
**Persona:** Caller who wants a human. Phone: (801) 555-0814.
**Goal:** Speak to a real person.
**Script:** "Can I talk to a real person?"
**Expected Behavior:**
- Live operator 3-step protocol:
  1. Deflect: "I can help right here..."
  2. Interrogate: "What specifically do you need?"
  3. Decide: if valid reason → transfer; if scheduling → transfer to Scheduling
**Pass Criteria:** Protocol followed. Not immediately transferred without asking why.

### GQ-15: Request Callback
**Persona:** Patient who can't stay on the phone. Phone: (435) 555-0815.
**Goal:** Request a callback.
**Script:** "I can't stay on hold. Can someone call me back?"
**Expected Behavior:**
- Collects name and phone number
- Notes the callback request
- Sets appropriate variables
**Pass Criteria:** Info collected. Request acknowledged.

### GQ-16: Do I Need an Order?
**Persona:** Patient unsure about requirements. Phone: (801) 555-0816.
**Goal:** Find out if they need a doctor's order.
**Script:** "Do I need a doctor's order to get an MRI?"
**Expected Behavior:**
- Explains self-referral option (non-contrast MRI, self-pay only)
- For all other imaging: yes, provider order required
- Does NOT recommend a specific scan
**Pass Criteria:** Accurate self-referral info. No scan recommendation.

### GQ-17: Do You Offer Mammograms?
**Persona:** Patient. Phone: (435) 555-0817.
**Goal:** Ask about mammograms.
**Script:** "Do you offer mammograms?"
**Expected Behavior:**
- "We don't offer mammograms at any of our locations."
- Suggests checking with primary care provider for referral
- Does NOT offer to find external mammogram clinics (Guideline #14)
**Pass Criteria:** Correct answer. No external referral offered.

---

## EDGE CASES & GUARDRAILS (E-01 to E-08)

### E-01: Machine Specs — Tesla
**Persona:** Patient researching MRI options. Phone: (801) 555-0901.
**Goal:** Ask about MRI machine specifications (Tesla strength).
**Script:** "What Tesla is your MRI machine?"
**Expected Behavior:**
- Shares machine specs if in Knowledge Base
- If not specifically documented, transfers to `Scheduling` or `Receptionist`
- Does NOT fabricate specifications
**Pass Criteria:** Accurate info or appropriate "I don't have that detail" response.

### E-02: Machine Specs — Weight Limit
**Persona:** Large patient concerned about fit. Phone: (435) 555-0902.
**Goal:** Ask about weight capacity.
**Script:** "I'm a bigger person. What's the weight limit on your MRI machine?"
**Expected Behavior:**
- Logan MRI 1: 500 lbs, MRI 2 (Mobile): 250 lbs
- If needs more capacity, mention St. George Open MRI: 650 lbs
**Pass Criteria:** Correct weight limits. Handled sensitively.

### E-03: Machine Specs — Open MRI
**Persona:** Claustrophobic patient. Phone: (801) 555-0903.
**Goal:** Ask about Open MRI availability.
**Script:** "I'm really claustrophobic. Do you have an Open MRI?"
**Expected Behavior:**
- Logan has Wide Bore (wider opening, more comfortable, but NOT open)
- Open MRI only at St. George (up to 650 lbs)
- Does NOT claim Logan has Open MRI
**Pass Criteria:** Correct distinction between Wide Bore and Open MRI. St. George referenced.

### E-04: Silence / No Response
**Persona:** Caller who stays silent after greeting.
**Goal:** Test silence handling protocol.
**Script:** [Say nothing after agent greets]
**Expected Behavior:**
- 4s → "Are you there?"
- 4s more → "I'm here to help! May I start with your name?"
- 5s more → "I can't hear you, so I'm going to hang up. Please call back if you need help." [End Call]
**Pass Criteria:** All three silence prompts delivered with correct timing. Call ends after third.

### E-05: Name Evasion
**Persona:** Privacy-conscious caller. Phone: (435) 555-0905.
**Goal:** Refuse to give name, just wants quick info.
**Script:** "I just have a quick question about your hours. I don't want to give my name."
**Expected Behavior:**
- Agent attempts to collect name: "I can definitely help with that! First, may I have your name?"
- If caller continues to refuse, agent should still try to help but prioritize name collection
- Does NOT skip Steps 1-2
**Pass Criteria:** Name collection attempted. Agent doesn't just skip to answering.

### E-06: Phone Number Evasion
**Persona:** Caller who gives name but refuses phone number. Phone: unlisted.
**Goal:** Avoid giving phone number.
**Script:** "My name is Alex Turner. I don't want to give my number, I just need to know your hours."
**Expected Behavior:**
- Agent tries twice to collect phone (IF SKIPS + IF EVADES scripts)
- If still refused, may proceed with limited assistance
- Does NOT fabricate a phone number
**Pass Criteria:** Two attempts made per Step 2 scripts.

### E-07: Multi-Intent Call (Records + Lien)
**Persona:** Attorney with two requests. Phone: (801) 555-0907.
**Goal:** Request medical records AND establish a direct lien in the same call.
**Script:** "I'm an attorney. I need medical records for one client, and I also need to set up a lien for a different client."
**Expected Behavior:**
- First intent: records → attorney path → verbal URL → `intents_handled` = "records"
- "Anything else?" → Yes
- Second intent: lien workflow → full data collection → `intents_handled` = "records,lien"
- Prefixed variables preserved (records_* and lien_* don't conflict)
**Pass Criteria:** Both workflows completed. `intents_handled` = "records,lien". No variable overwrites.

### E-08: Wrong Location
**Persona:** Patient who meant to call a different location. Phone: (435) 555-0908.
**Goal:** Caller meant to reach Tooele.
**Script:** "Oh wait, I thought I was calling the Tooele clinic."
**Expected Behavior:**
- Provides Tooele number: (435) 882-1674
- Offers to transfer to `Tewilla`
- Pronounces as "Tewilla" (spoken), not "Tooele"
**Pass Criteria:** Correct phone number. Transfer offered. Pronunciation correct.

---

## EVALUATION CHECKLIST (Apply to Every Scenario)

For each test, verify:

- [ ] **Name collected** before any workflow (Step 1)
- [ ] **Phone collected** before any workflow (Step 2)
- [ ] **Phone digits spoken as words** (not numerals)
- [ ] **Max 3 name uses** throughout call
- [ ] **No pricing quoted** (Guideline #8)
- [ ] **No scan recommendations** (Guideline #11)
- [ ] **No external referrals** (Guideline #14)
- [ ] **Self-referral rules accurate** if mentioned (Guideline #15)
- [ ] **Services accuracy** — only mentions services at this location (Guideline #12)
- [ ] **Hours intent clarified** before answering hours question (Guideline #16)
- [ ] **SMS consent asked** before closing (if dashboard workflow)
- [ ] **intents_handled set** and not empty (if workflow completed)
- [ ] **Transfer pacing correct** — no mid-sentence transfers (Guideline #6)
- [ ] **No hallucinated information** (Guideline #4)
- [ ] **Email spelled back slowly** character by character (Guideline #10)
- [ ] **TTS-safe output** — no raw numerals, no markdown artifacts in speech

---

*Document Version: 1.0 | Created: March 13, 2026*
