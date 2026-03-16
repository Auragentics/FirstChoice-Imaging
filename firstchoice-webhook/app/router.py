from __future__ import annotations

import logging

from app import ghl_client
from app.models import ExtractedData
from app.template_renderer import render_email, render_sms

logger = logging.getLogger(__name__)

TAG_NAME = "AI Voice Agent Inquiry"


async def process_call(data: ExtractedData) -> dict:
    """
    Main routing logic. Upserts contact, sends emails per intent,
    sends SMS if consented, and tags the contact.

    Returns a result dict with status of each operation.
    """
    results: dict = {"intents_processed": [], "errors": []}

    # 1. Upsert contact in GHL
    contact_id = await ghl_client.upsert_contact(
        phone=data.caller_phone,
        name=data.caller_name,
        email=data.caller_email,
        custom_fields=data.custom_fields_dict(),
    )

    if not contact_id:
        results["errors"].append("Failed to upsert contact in GHL")
        logger.error("Aborting: could not upsert contact for phone=%s", data.caller_phone)
        return results

    results["contact_id"] = contact_id

    # Build template context from extracted data
    template_data = {**data.model_dump(), "first_name": data.first_name}

    # 2. Process each intent independently (error isolation)
    for intent in data.intents:
        try:
            subject, html_body = render_email(intent, template_data)
            email_sent = await ghl_client.send_email(contact_id, subject, html_body)

            if email_sent:
                results["intents_processed"].append(intent)
                logger.info("Email sent for intent=%s contact=%s", intent, contact_id)
            else:
                results["errors"].append(f"Email send failed for intent={intent}")
                logger.error("Email send failed: intent=%s contact=%s", intent, contact_id)

        except Exception:
            results["errors"].append(f"Error processing intent={intent}")
            logger.exception("Exception processing intent=%s", intent)

    # 3. Send SMS confirmation if caller consented
    if data.sms_consent.upper() == "YES" and data.intents:
        try:
            # Use the first intent for the SMS template
            primary_intent = data.intents[0]
            sms_text = render_sms(primary_intent, template_data)
            sms_sent = await ghl_client.send_sms(contact_id, sms_text)

            results["sms_sent"] = sms_sent
            if sms_sent:
                logger.info("SMS confirmation sent to contact=%s", contact_id)
            else:
                results["errors"].append("SMS send failed")

        except Exception:
            results["errors"].append("Error sending SMS")
            logger.exception("Exception sending SMS to contact=%s", contact_id)
    else:
        results["sms_sent"] = False

    # 4. Tag the contact
    try:
        tagged = await ghl_client.add_tag(contact_id, TAG_NAME)
        results["tagged"] = tagged
    except Exception:
        results["errors"].append("Error adding tag")
        logger.exception("Exception adding tag to contact=%s", contact_id)

    return results
