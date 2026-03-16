# A2P 10DLC Registration Plan — First Choice Imaging

## Overview

This document is a complete walkthrough for registering an A2P 10DLC SMS campaign for **Tooele Valley Imaging (dba First Choice Imaging)** to send customer care SMS messages to callers who opt in via the AI voice agent.

---

## STEP 1: Brand Registration

All fields below are pre-filled and confirmed. These will be submitted via **GoHighLevel (GHL)**, which uses Twilio under the hood to register with The Campaign Registry (TCR).

| Field | Value | Status |
|---|---|---|
| **Registration Type** | `standard` | CONFIRMED |
| **SMS Provider** | GoHighLevel (via Twilio) | CONFIRMED |
| **10DLC Phone Number** | Already acquired through GHL | CONFIRMED |
| **Business Name** | Tooele Valley Imaging | READY |
| **DBA Name** | First Choice Imaging | READY |
| **Business Type** | LLC | READY |
| **Company Status** | Private | READY |
| **EIN (Tax ID)** | 27-0983614 | READY (format validated) |
| **Street Address** | 2356 N 400 E #103 | READY |
| **City** | Tooele | READY |
| **State** | UT | READY |
| **Postal Code** | 84074 | READY |
| **Country** | US | READY |
| **Industry** | Healthcare | CONFIRMED |
| **Website** | https://firstchoice-imaging.com | READY |
| **Contact Name** | David Carter | READY |
| **Contact Email** | dcarter@firstchoice-imaging.com | READY (corporate domain) |
| **Contact Phone** | +1(435) 232-6457 | READY |
| **Contact Title** | Owner / General Manager | READY |
| **Est. Monthly Volume** | < 100,000 messages/month | CONFIRMED |
| **Consent Logging** | Call platform logs | CONFIRMED |

### Registration Type Note

**Selected: `standard`** — With an estimated volume of up to 100,000 messages/month (~3,300/day), `standard` registration provides the throughput headroom needed. The `low-volume-standard` tier caps at roughly 2,000-6,000 segments/day depending on trust score, which could become a bottleneck. Standard registration requires a one-time secondary vetting fee (~$40 via Twilio/GHL) but delivers higher trust scores and throughput limits.

---

## STEP 2: Campaign Registration

### Use Case

| Field | Value |
|---|---|
| **Campaign Use Case** | `customer-care` |

This is the correct use case — SMS messages are sent to support customer care inquiries about medical imaging services.

### Campaign Description (Suggested)

> Tooele Valley Imaging (dba First Choice Imaging) uses SMS to send customer care status updates to callers who contact our business. During an inbound phone call handled by our AI voice agent, callers are asked for verbal consent to receive SMS updates about their imaging inquiry. Only callers who verbally opt in will receive messages. Messages include inquiry status updates, appointment-related information, and follow-up communications. Message frequency varies based on the customer's active inquiry. Customers can opt out at any time by replying STOP.

**Length:** 560 characters | **Includes:** opt-in method, consent details, message types, frequency, opt-out

### Opt-In Method (Suggested)

> Customers opt in via verbal consent during an inbound phone call. The AI voice agent asks: "To keep you updated on your inquiry, would you like to receive status updates via text message to this phone number? Standard message and data rates may apply." Only callers who affirmatively agree are enrolled. Verbal consent is recorded and logged by the AI voice system. The customer's caller ID phone number is used as the SMS recipient number.

### Opt-In Message (Exact Script — As Spoken by AI Agent)

> "To keep you updated on your inquiry, would you like to receive status updates via text message to this phone number? Standard message and data rates may apply."

### Sample Messages

**Sample Message 1 (with opt-out):**
> First Choice Imaging: Your imaging inquiry has been received and is being processed. We'll update you when more information is available. Reply STOP to opt out or HELP for assistance. Msg & data rates may apply.

**Analysis:** 213 chars | 2 segments | Contains STOP | Contains HELP

**Sample Message 2 (status update):**
> First Choice Imaging: Update on your inquiry — your requested imaging information is now ready. Please call us at (435) 232-6457 if you have questions. Reply STOP to unsubscribe.

**Analysis:** 178 chars | 2 segments | Contains STOP

### Keywords

| Type | Keywords |
|---|---|
| **Opt-In Keywords** | START, YES, SUBSCRIBE |
| **Opt-Out Keywords** | STOP, CANCEL, END, QUIT, UNSUBSCRIBE |
| **Help Keywords** | HELP, INFO |

### Required Auto-Responses (configure in your SMS platform)

| Trigger | Auto-Response |
|---|---|
| **STOP** | "First Choice Imaging: You have been unsubscribed and will no longer receive SMS messages from us. Reply START to resubscribe." |
| **HELP** | "First Choice Imaging: For assistance, call (435) 232-6457 or email dcarter@firstchoice-imaging.com. Reply STOP to unsubscribe. Msg & data rates may apply." |
| **START** | "First Choice Imaging: You have been resubscribed to status update messages. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out or HELP for assistance." |

---

## STEP 3: Compliance — Policy & Terms Review

### Current Status & Gaps

Your Privacy Policy (`/privacy`) and SMS Terms (`/sms-terms`) have been reviewed against A2P 10DLC compliance requirements from the validation tool.

| Requirement | Status | Severity | Notes |
|---|---|---|---|
| **No mobile info sharing statement** | PASS | -- | "Mobile information will not be shared with third parties/affiliates for marketing/promotional purposes..." is present |
| **Opt-in disclosure** | PASS | -- | "We collect your phone number when you provide verbal consent to our AI voice agent to receive status updates via SMS" |
| **Opt-out instructions** | MISSING | **CRITICAL** | **REGISTRATION WILL BE REJECTED** without "Reply STOP to unsubscribe" in the written policy |
| **Message frequency disclosure** | MISSING | Warning | Should add "Message frequency varies" |
| **Message & data rates disclosure** | MISSING | Warning | Should add "Message and data rates may apply" (present in voice script but must also appear in written policy) |
| **Help/support instructions** | MISSING | Warning | Should add "Reply HELP for assistance" |

### CRITICAL: SMS Terms Page Must Be Updated

The `/sms-terms` page currently contains a copy of the Privacy Policy and is **missing opt-out instructions** — this is flagged as an **ERROR** by the compliance tool and **will cause the campaign registration to be rejected by TCR/carriers**. This is not optional.

**Minimum required addition** to the existing `/sms-terms` page (append to current content):

> **To stop receiving messages:** Reply **STOP** to any message to unsubscribe. Reply **HELP** for assistance. Message frequency varies. Message and data rates may apply.

This single paragraph resolves all 4 missing items. It can be appended to the bottom of the current page content without rewriting anything else.

### RECOMMENDED: Full SMS Terms Replacement

For a stronger registration (higher compliance score), the full replacement below is recommended but not strictly required if the minimum addition above is applied:

---

#### Suggested SMS Terms & Conditions (for FirstChoice-Imaging.com/sms-terms)

> **Toolee Valley Imaging (dba First Choice Imaging) — SMS Terms & Conditions**
>
> By providing verbal consent to our AI voice agent during a phone call, you agree to receive SMS text messages from Tooele Valley Imaging (dba First Choice Imaging) regarding the status of your medical imaging inquiry and customer care communications.
>
> **Message Frequency:** Message frequency varies based on your active inquiry. Typically 1-5 messages per inquiry.
>
> **Message & Data Rates:** Message and data rates may apply. Check with your mobile carrier for details.
>
> **Opt-Out:** You may opt out of receiving SMS messages at any time by replying **STOP** to any message. You will receive a one-time confirmation message, and no further messages will be sent.
>
> **Help:** For assistance, reply **HELP** to any message, or contact us at (435) 232-6457 or dcarter@firstchoice-imaging.com.
>
> **Privacy:** Your mobile number is used strictly for communication regarding your medical imaging requests and customer care inquiries. Mobile information will not be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
>
> **Carriers Supported:** Service is available on all major US mobile carriers.
>
> **Contact Us:**
> Tooele Valley Imaging
> 2356 N 400 E #103
> Tooele, UT 84074
> Phone: (435) 232-6457
> Email: dcarter@firstchoice-imaging.com

---

#### Suggested Privacy Policy Addition (for FirstChoice-Imaging.com/privacy)

Add the following to the existing Privacy Policy:

> **SMS Communications:** Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for assistance. See our [SMS Terms & Conditions](/sms-terms) for full details.

---

## STEP 4: Registration Submission Checklist

### Pre-Submission Checklist

- [x] **Registration type confirmed** — `standard`
- [x] **Industry classification confirmed** — Healthcare
- [x] **SMS provider set up** — GoHighLevel (via Twilio)
- [x] **10DLC phone number acquired** — through GHL
- [x] **AI voice agent script confirmed** with exact opt-in language
- [x] **Consent logging** — call platform logs
- [ ] **SMS Terms & Conditions page updated** at FirstChoice-Imaging.com/sms-terms (CRITICAL — see Step 3)
- [ ] **Privacy Policy updated** at FirstChoice-Imaging.com/privacy (recommended — add SMS section)
- [ ] **Auto-responses configured** in GHL for STOP, HELP, and START keywords
- [ ] **Campaign description reviewed** and approved
- [ ] **Sample messages reviewed** and approved
- [ ] **Run the A2P-10DLC Registration Compliance Tool** to validate all inputs before submission

### Submission Process (GoHighLevel)

1. **In GHL:** Go to **Settings > Phone Numbers > Trust Center** (or **Settings > Business Profile > A2P Registration**)
2. **Register the Brand** — enter all brand details from Step 1 above. GHL submits to Twilio/TCR.
3. **Wait for brand verification** (~1-7 business days; GHL shows status in Trust Center)
4. **Request Secondary Vetting** — required for `standard` registration (one-time $40 fee). This is initiated through GHL after initial brand registration.
5. **Register the Campaign** — select `customer-care` use case, enter campaign description, sample messages, and opt-in details from Step 2
6. **Wait for campaign approval** (~1-7 business days)
7. **Associate your 10DLC phone number** with the approved campaign in GHL
8. **Configure auto-responses** for STOP/HELP/START keywords in GHL's automation/workflow settings
9. **Begin sending messages** — only to opted-in recipients

### Expected Costs (GHL/Twilio)

| Item | Estimated Cost |
|---|---|
| Brand Registration (one-time) | $4 |
| Secondary Vetting (one-time, standard tier) | $40 |
| Campaign Registration (one-time) | $15 |
| Monthly Campaign Fee | $10/month |
| Per-message surcharge (carrier fees) | ~$0.003-$0.005/msg |
| GHL SMS cost | Per your GHL plan pricing |

*Exact costs may vary. Check GHL's current pricing in Settings > Billing.*

---

## STEP 5: Ongoing Compliance Requirements

1. **Honor all STOP requests immediately** — No messages after opt-out
2. **Maintain consent records** — Log verbal opt-ins with timestamp and phone number
3. **Keep policies up to date** — Privacy policy and SMS terms must remain accessible
4. **Do not send messages outside the registered use case** — customer-care only (no marketing)
5. **Monitor for delivery issues** — Carrier filtering can increase if complaints rise
6. **HIPAA considerations** — Do NOT include Protected Health Information (PHI) in SMS messages. Keep messages generic (e.g., "your inquiry has been updated" not "your MRI results are ready")

---

## REMAINING ACTION ITEMS

All registration information has been gathered. The following actions remain before submission:

| # | Action | Priority | Owner |
|---|---|---|---|
| 1 | **Update `/sms-terms` page** — add opt-out, help, frequency, and data rates language (see Step 3 for minimum required text) | **CRITICAL** | Web admin |
| 2 | **Update `/privacy` page** — add SMS communications section (recommended) | Recommended | Web admin |
| 3 | **Configure STOP/HELP/START auto-responses** in GHL | Required | GHL admin |
| 4 | **Review and approve** campaign description and sample messages in this document | Required | David Carter |
| 5 | **Run compliance validation tool** against final inputs | Recommended | Developer |
| 6 | **Submit registration** through GHL Trust Center | Required | GHL admin |

---

## Validation Tool

Before submitting, run all inputs through the project's **A2P-10DLC Registration Compliance Tool** located at:

```
FirstChoice-Imaging/A2P-10DLC_RegistrationComplianceTool/
```

This tool will:
- Validate all brand details (EIN format, address, email domain, phone format)
- Analyze sample messages for prohibited content and spam triggers
- Check privacy policy and SMS terms URLs for required compliance language
- Generate an audit report with a compliance score (target: 90+)

To run the tool: `cd A2P-10DLC_RegistrationComplianceTool && npm install && npm run dev`
