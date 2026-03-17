# Business Associate Agreement

**Between Tooele Valley Imaging LLC (dba First Choice Imaging) and Auragentics LLC**

---

**This Business Associate Agreement** ("BAA" or "Agreement") is entered into as of March 16, 2026 ("Effective Date"), by and between:

**Tooele Valley Imaging LLC, doing business as First Choice Imaging** ("Covered Entity"), a Utah limited liability company, with its principal place of business at 2356 N 400 E #103, Tooele, Utah 84074;

and

**Auragentics LLC** ("Business Associate"), a Utah limited liability company, with its principal place of business at 3533 N 2900 E, Eden, Utah 84310.

Covered Entity and Business Associate are each referred to herein as a "Party" and collectively as the "Parties."

---

## RECITALS

**WHEREAS,** Covered Entity is a healthcare provider that operates medical imaging clinics under the trade name "First Choice Imaging" and is a "Covered Entity" as defined under the Health Insurance Portability and Accountability Act of 1996, as amended ("HIPAA"), and its implementing regulations, including the Privacy Rule (45 CFR Part 160 and Part 164, Subparts A and E), the Security Rule (45 CFR Part 160 and Part 164, Subparts A and C), and the Breach Notification Rule (45 CFR Part 164, Subpart D), as amended by the Health Information Technology for Economic and Clinical Health Act ("HITECH Act") (collectively, the "HIPAA Rules");

**WHEREAS,** Business Associate provides technology services to Covered Entity, including AI voice agent services, A2P SMS messaging services, CRM automation, and a SaaS analytics dashboard, in the course of which Business Associate may create, receive, maintain, or transmit Protected Health Information ("PHI") on behalf of Covered Entity;

**WHEREAS,** the Parties wish to enter into this BAA to ensure compliance with the HIPAA Rules and to establish the permitted and required uses and disclosures of PHI by Business Associate;

**NOW, THEREFORE,** in consideration of the mutual promises and covenants set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

---

## 1. DEFINITIONS

All capitalized terms used but not otherwise defined in this Agreement shall have the meanings ascribed to them under the HIPAA Rules.

**"Breach"** shall have the meaning given to such term under 45 CFR § 164.402, as amended.

**"Designated Record Set"** shall have the meaning given to such term under 45 CFR § 164.501.

**"Electronic Protected Health Information" or "ePHI"** shall have the meaning given to such term under 45 CFR § 160.103.

**"Individual"** shall have the meaning given to such term under 45 CFR § 160.103 and shall include a person who qualifies as a personal representative under 45 CFR § 164.502(g).

**"Protected Health Information" or "PHI"** shall have the meaning given to such term under 45 CFR § 160.103, limited to the information created, received, maintained, or transmitted by Business Associate on behalf of Covered Entity pursuant to this Agreement.

**"Required by Law"** shall have the meaning given to such term under 45 CFR § 164.103.

**"Secretary"** shall mean the Secretary of the United States Department of Health and Human Services or the Secretary's designee.

**"Security Incident"** shall have the meaning given to such term under 45 CFR § 164.304.

**"Subcontractor"** shall have the meaning given to such term under 45 CFR § 160.103.

**"Unsecured Protected Health Information"** shall have the meaning given to such term under 45 CFR § 164.402.

---

## 2. SCOPE OF PHI

### 2.1 Categories of PHI
The Parties acknowledge that Business Associate may create, receive, maintain, or transmit the following categories of PHI in connection with the Services:

(a) **Caller/Patient Identifiers:** Names, phone numbers, dates of birth, and email addresses collected during AI voice agent interactions.

(b) **Inquiry and Request Information:** Nature of medical service inquiries, scheduling requests, records requests, and other information voluntarily provided by callers during voice agent interactions.

(c) **Voice Recordings:** Audio recordings of calls between callers and the AI voice agent.

(d) **Call Transcripts:** Text transcriptions of voice agent interactions.

(e) **Call Metadata:** Call logs, timestamps, call duration, caller intent classifications, and call disposition data.

(f) **SMS Data:** Phone numbers, message content related to appointment or records information, delivery status, and consent records.

### 2.2 Exclusions
Business Associate does not create, receive, maintain, or transmit the following on behalf of Covered Entity:

(a) Medical records, imaging results, radiology reports, or clinical data.

(b) Insurance or billing records containing diagnosis codes, procedure codes, or claims data.

(c) Any other clinical, diagnostic, or treatment information.

---

## 3. OBLIGATIONS OF BUSINESS ASSOCIATE

### 3.1 Permitted Uses and Disclosures
Business Associate shall not use or disclose PHI other than as permitted or required by this Agreement or as Required by Law. Business Associate is permitted to use and disclose PHI solely for the following purposes:

(a) To perform the Services on behalf of Covered Entity, including operating AI voice agents, processing and delivering SMS messages, storing and displaying call data in the analytics dashboard, and generating reports.

(b) For the proper management and administration of Business Associate, provided that any disclosure for such purpose is Required by Law or Business Associate obtains reasonable assurances from the recipient that the PHI will be held confidentially, used or further disclosed only as Required by Law or for the purpose for which it was disclosed, and the recipient will notify Business Associate of any instances of which it becomes aware in which the confidentiality of the PHI has been breached.

(c) To provide Data Aggregation services to Covered Entity, as permitted by 45 CFR § 164.504(e)(2)(i)(B).

(d) To de-identify PHI in accordance with 45 CFR § 164.514(a)-(c).

### 3.2 Safeguards
Business Associate shall implement and maintain appropriate administrative, physical, and technical safeguards to protect PHI from any intentional or unintentional use or disclosure in violation of this Agreement and the HIPAA Rules. Without limiting the foregoing, Business Associate shall:

(a) Implement the administrative, physical, and technical safeguards required by the Security Rule (45 CFR §§ 164.308, 164.310, 164.312, and 164.316) to protect the confidentiality, integrity, and availability of ePHI that it creates, receives, maintains, or transmits on behalf of Covered Entity.

(b) Encrypt ePHI in transit using TLS 1.2 or higher and at rest using AES-256 or equivalent encryption standards.

(c) Implement role-based access controls to ensure that only authorized personnel may access PHI.

(d) Maintain audit logs of access to and use of PHI.

(e) Conduct periodic risk assessments and implement reasonable measures to address identified risks.

(f) Train personnel who have access to PHI on their obligations under HIPAA and this Agreement.

### 3.3 Subcontractors
Business Associate shall ensure that any Subcontractor that creates, receives, maintains, or transmits PHI on behalf of Business Associate agrees to the same restrictions, conditions, and requirements with respect to PHI as set forth in this Agreement, by entering into a written agreement with each such Subcontractor that complies with 45 CFR § 164.504(e).

The Parties acknowledge that, as of the Effective Date, Business Associate engages the following categories of Subcontractors that may have access to PHI:

(a) **AI Voice Agent Platform Provider** (Retell AI) — processes voice interactions and generates transcripts.

(b) **SMS and Telecommunications Provider** (Twilio) — transmits SMS messages containing PHI.

(c) **CRM Platform Provider** (GoHighLevel) — stores and processes caller data and workflow automations. Business Associate maintains a separate BAA with this provider.

(d) **Cloud Infrastructure Provider** (Amazon Web Services) — hosts the Platform and stores ePHI.

Business Associate shall notify Covered Entity prior to engaging any new Subcontractor that will have access to PHI and shall provide Covered Entity with a reasonable opportunity to review and approve such engagement.

### 3.4 Reporting
Business Associate shall report to Covered Entity:

(a) Any use or disclosure of PHI not provided for by this Agreement of which Business Associate becomes aware, including any Security Incident, within ten (10) business days of discovery.

(b) Any Breach of Unsecured PHI in accordance with Section 4 of this Agreement.

### 3.5 Access to PHI
Business Associate shall make PHI maintained in a Designated Record Set available to Covered Entity, or at the direction of Covered Entity, to an Individual, within fifteen (15) business days of a written request, in order to meet the requirements of 45 CFR § 164.524.

### 3.6 Amendment of PHI
Business Associate shall make PHI maintained in a Designated Record Set available to Covered Entity for amendment and shall incorporate any amendments to PHI directed by Covered Entity within fifteen (15) business days, in order to meet the requirements of 45 CFR § 164.526.

### 3.7 Accounting of Disclosures
Business Associate shall make available to Covered Entity the information required to provide an accounting of disclosures in accordance with 45 CFR § 164.528 within thirty (30) days of a written request. Business Associate shall maintain records of disclosures of PHI for a period of six (6) years from the date of the disclosure.

### 3.8 Government Access
Business Associate shall make its internal practices, books, and records relating to the use and disclosure of PHI available to the Secretary for purposes of determining Covered Entity's and Business Associate's compliance with the HIPAA Rules.

### 3.9 Minimum Necessary
Business Associate shall limit its use, disclosure, and request of PHI to the minimum necessary to accomplish the intended purpose, in accordance with the HIPAA Rules and any guidance issued by the Secretary.

### 3.10 Prohibited Uses and Disclosures
Business Associate shall not:

(a) Use or disclose PHI for marketing purposes without the prior written authorization of the Individual, except as permitted under 45 CFR § 164.508(a)(3).

(b) Sell PHI, as defined under 45 CFR § 164.502(a)(5)(ii).

(c) Use or disclose PHI in a manner that would violate the HIPAA Rules if done by Covered Entity, except as expressly permitted under this Agreement.

---

## 4. BREACH NOTIFICATION

### 4.1 Discovery and Notification
Business Associate shall notify Covered Entity of any Breach of Unsecured PHI without unreasonable delay and in no event later than sixty (60) calendar days after the discovery of the Breach. A Breach shall be treated as discovered by Business Associate as of the first day on which such Breach is known to Business Associate or, by exercising reasonable diligence, would have been known to Business Associate.

### 4.2 Content of Notification
Business Associate's notification shall include, to the extent available:

(a) The identification of each Individual whose Unsecured PHI has been, or is reasonably believed by Business Associate to have been, accessed, acquired, used, or disclosed during the Breach.

(b) A description of what happened, including the date of the Breach and the date of discovery.

(c) A description of the types of Unsecured PHI that were involved in the Breach (e.g., full name, date of birth, phone number, etc.).

(d) Any steps Business Associate has taken or will take to investigate the Breach, mitigate harm to the affected Individuals, and protect against future Breaches.

(e) Contact information for Business Associate's designated representative for Breach-related communications.

### 4.3 Cooperation
Business Associate shall cooperate with Covered Entity in the investigation and remediation of any Breach and shall provide Covered Entity with all information reasonably necessary for Covered Entity to fulfill its notification obligations under 45 CFR §§ 164.404, 164.406, and 164.408.

### 4.4 Costs
Each Party shall bear its own costs and expenses in connection with Breach investigation, notification, and remediation, except that Business Associate shall bear the costs of notification to affected Individuals and credit monitoring services (if applicable) to the extent the Breach was caused by Business Associate's acts or omissions.

---

## 5. OBLIGATIONS OF COVERED ENTITY

### 5.1 Permissions and Consents
Covered Entity shall:

(a) Obtain any necessary consents, authorizations, or permissions from Individuals as required under the HIPAA Rules or applicable law prior to providing PHI to Business Associate.

(b) Notify Business Associate of any limitations in its notice of privacy practices under 45 CFR § 164.520, to the extent that such limitations may affect Business Associate's use or disclosure of PHI.

(c) Notify Business Associate of any changes in, or revocation of, the authorization or permission of an Individual to use or disclose PHI, to the extent that such changes may affect Business Associate's use or disclosure of PHI.

(d) Notify Business Associate of any restriction on the use or disclosure of PHI that Covered Entity has agreed to or is required to abide by under 45 CFR § 164.522, to the extent that such restriction may affect Business Associate's use or disclosure of PHI.

### 5.2 Representations
Covered Entity represents and warrants that:

(a) It is a Covered Entity as defined under the HIPAA Rules.

(b) It has implemented and maintains a Notice of Privacy Practices in accordance with 45 CFR § 164.520.

(c) It shall not request Business Associate to use or disclose PHI in any manner that would not be permissible under the HIPAA Rules if done by Covered Entity.

---

## 6. TERM AND TERMINATION

### 6.1 Term
This Agreement shall commence on the Effective Date and shall remain in effect for the duration of the Parties' business relationship, unless earlier terminated in accordance with this Section 6.

### 6.2 Termination for Cause
Either Party may terminate this Agreement if the other Party materially breaches any provision of this Agreement and fails to cure such breach within thirty (30) days of receiving written notice of the breach. If cure is not feasible, the non-breaching Party may terminate this Agreement immediately upon written notice.

### 6.3 Termination of Underlying Agreement
This Agreement shall automatically terminate upon the termination or expiration of all service agreements between the Parties under which Business Associate creates, receives, maintains, or transmits PHI on behalf of Covered Entity.

### 6.4 Obligations Upon Termination
Upon termination of this Agreement, Business Associate shall:

(a) **Return or Destroy PHI.** Within thirty (30) days of termination, return to Covered Entity or destroy all PHI in Business Associate's possession or control, including all copies in any form or medium. Business Associate shall certify in writing to Covered Entity that all PHI has been returned or destroyed.

(b) **Retention Exception.** If return or destruction of PHI is not feasible (e.g., PHI is maintained in backup systems or is required to be retained by law), Business Associate shall: (i) retain only the PHI that cannot feasibly be returned or destroyed; (ii) continue to extend the protections of this Agreement to such PHI for as long as it is retained; (iii) limit further uses and disclosures to the purposes that make return or destruction infeasible; and (iv) return or destroy such PHI when the purpose requiring retention no longer applies.

(c) **Survival.** The obligations of Business Associate under this Section 6.4 and Sections 3 and 4 shall survive the termination of this Agreement.

---

## 7. GENERAL PROVISIONS

### 7.1 Regulatory References
Any reference in this Agreement to a section of the HIPAA Rules shall mean the section as in effect or as amended. The Parties agree to take such action as is necessary to amend this Agreement from time to time to ensure compliance with the requirements of the HIPAA Rules and any other applicable law.

### 7.2 Interpretation
Any ambiguity in this Agreement shall be resolved to permit compliance with the HIPAA Rules. In the event of a conflict between this Agreement and any other agreement between the Parties, this Agreement shall control with respect to the use and disclosure of PHI.

### 7.3 Indemnification
Business Associate shall indemnify, defend, and hold harmless Covered Entity from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to Business Associate's breach of this Agreement or violation of the HIPAA Rules, to the extent caused by Business Associate's acts or omissions. This indemnification obligation is subject to the limitations of liability set forth in the Liability Release and Limitation of Liability Agreement between the Parties dated March 16, 2026.

### 7.4 No Third-Party Beneficiaries
Nothing in this Agreement shall confer any rights upon any person or entity other than the Parties and their respective successors and assigns.

### 7.5 Governing Law
This Agreement shall be governed by and construed in accordance with the laws of the State of Utah, without regard to its conflict of laws principles. To the extent that any provision of this Agreement conflicts with applicable federal law (including the HIPAA Rules), federal law shall control.

### 7.6 Amendment
This Agreement may not be amended except by a written instrument executed by both Parties. The Parties agree to amend this Agreement as necessary to comply with changes in the HIPAA Rules or other applicable law.

### 7.7 Severability
If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.

### 7.8 Waiver
The failure of either Party to enforce any provision of this Agreement shall not constitute a waiver of that provision or the right to enforce it thereafter.

### 7.9 Assignment
Neither Party may assign this Agreement without the prior written consent of the other Party, except that Business Associate may assign this Agreement in connection with a merger, acquisition, or sale of all or substantially all of its assets, provided the assignee agrees in writing to be bound by the terms of this Agreement.

### 7.10 Notices
All notices under this Agreement shall be in writing and delivered to:

**To Covered Entity:**
Tooele Valley Imaging LLC (dba First Choice Imaging)
Attn: David Carter, Owner/General Manager
2356 N 400 E #103
Tooele, Utah 84074

**To Business Associate:**
Auragentics LLC
Attn: Brian L. Randall, Owner
3533 N 2900 E
Eden, Utah 84310
Email: legal@auragentics.ai

### 7.11 Counterparts
This Agreement may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Electronic and digital signatures shall be deemed valid and binding.

---

## SIGNATURES

**IN WITNESS WHEREOF,** the Parties have executed this Business Associate Agreement as of the Effective Date first written above.

&nbsp;

**TOOELE VALLEY IMAGING LLC (dba FIRST CHOICE IMAGING) — COVERED ENTITY**

Signature: /sn2/ ___________________________________

Printed Name: /na2/ David Carter

Title: /ti2/ Owner / General Manager

Date: /da2/ ___________________________________

&nbsp;

**AURAGENTICS LLC — BUSINESS ASSOCIATE**

Signature: /sn1/ ___________________________________

Printed Name: /na1/ Brian L. Randall

Title: /ti1/ Owner

Date: /da1/ ___________________________________
