from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

API_VERSION = "2021-07-28"
MAX_RETRIES = 3
BACKOFF_BASE = 1  # seconds


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.ghl_api_token}",
        "Content-Type": "application/json",
        "Version": API_VERSION,
    }


async def _request_with_retry(
    method: str,
    url: str,
    *,
    json: dict | None = None,
    context: str = "",
) -> dict[str, Any]:
    """Make an HTTP request to GHL API with retry logic."""
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.request(method, url, headers=_headers(), json=json)

                if response.status_code in (200, 201):
                    data = response.json()
                    logger.info(
                        "GHL API success: %s (attempt %d) status=%d",
                        context,
                        attempt,
                        response.status_code,
                    )
                    return data

                # Don't retry client errors (4xx) except 429 (rate limit)
                if 400 <= response.status_code < 500 and response.status_code != 429:
                    logger.error(
                        "GHL API client error: %s status=%d body=%s",
                        context,
                        response.status_code,
                        response.text[:500],
                    )
                    return {"error": response.text, "status_code": response.status_code}

                # Server error or rate limit — retry
                logger.warning(
                    "GHL API retryable error: %s status=%d attempt=%d/%d",
                    context,
                    response.status_code,
                    attempt,
                    MAX_RETRIES,
                )
                last_error = Exception(f"HTTP {response.status_code}: {response.text[:200]}")

        except httpx.RequestError as exc:
            logger.warning(
                "GHL API request error: %s error=%s attempt=%d/%d",
                context,
                str(exc),
                attempt,
                MAX_RETRIES,
            )
            last_error = exc

        if attempt < MAX_RETRIES:
            wait = BACKOFF_BASE * (2 ** (attempt - 1))
            await asyncio.sleep(wait)

    logger.error("GHL API failed after %d attempts: %s error=%s", MAX_RETRIES, context, last_error)
    return {"error": str(last_error)}


async def upsert_contact(
    phone: str,
    name: str,
    email: str,
    custom_fields: dict[str, str] | None = None,
) -> str | None:
    """Create or update a contact in GHL. Returns contactId or None on failure."""
    # Split name into first/last
    parts = name.strip().split(maxsplit=1)
    first_name = parts[0] if parts else ""
    last_name = parts[1] if len(parts) > 1 else ""

    body: dict[str, Any] = {
        "locationId": settings.ghl_location_id,
        "phone": phone,
        "firstName": first_name,
        "lastName": last_name,
    }

    if email:
        body["email"] = email

    if custom_fields:
        body["customFields"] = [
            {"key": k, "value": v} for k, v in custom_fields.items()
        ]

    result = await _request_with_retry(
        "POST",
        f"{settings.ghl_api_base}/contacts/upsert",
        json=body,
        context=f"upsert_contact phone={phone}",
    )

    contact = result.get("contact", {})
    contact_id = contact.get("id")

    if contact_id:
        logger.info("Contact upserted: id=%s name=%s", contact_id, name)
    else:
        logger.error("Failed to upsert contact: result=%s", result)

    return contact_id


async def send_email(
    contact_id: str,
    subject: str,
    html_body: str,
) -> bool:
    """Send an email via GHL Conversations API. Returns True on success."""
    body = {
        "type": "Email",
        "contactId": contact_id,
        "subject": subject,
        "message": html_body,
        "emailFrom": settings.staff_email_from,
        "emailTo": settings.staff_email,
    }

    result = await _request_with_retry(
        "POST",
        f"{settings.ghl_api_base}/conversations/messages",
        json=body,
        context=f"send_email contact={contact_id} subject={subject[:50]}",
    )

    return "error" not in result


async def send_sms(contact_id: str, message: str) -> bool:
    """Send an SMS via GHL Conversations API. Returns True on success."""
    body = {
        "type": "SMS",
        "contactId": contact_id,
        "message": message,
    }

    result = await _request_with_retry(
        "POST",
        f"{settings.ghl_api_base}/conversations/messages",
        json=body,
        context=f"send_sms contact={contact_id}",
    )

    return "error" not in result


async def add_tag(contact_id: str, tag: str) -> bool:
    """Add a tag to a GHL contact. Returns True on success."""
    body = {"tags": [tag]}

    result = await _request_with_retry(
        "POST",
        f"{settings.ghl_api_base}/contacts/{contact_id}/tags",
        json=body,
        context=f"add_tag contact={contact_id} tag={tag}",
    )

    return "error" not in result
