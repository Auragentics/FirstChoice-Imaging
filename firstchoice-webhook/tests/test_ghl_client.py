"""Tests for the GHL API client (mocked HTTP)."""

import pytest
import httpx
import respx

from app.ghl_client import upsert_contact, send_email, send_sms, add_tag
from app.config import settings


@pytest.fixture(autouse=True)
def mock_ghl_api():
    """Set up respx mock for all GHL API calls."""
    with respx.mock(assert_all_called=False) as rsps:
        yield rsps


@pytest.mark.asyncio
async def test_upsert_contact_success(mock_ghl_api):
    mock_ghl_api.post(f"{settings.ghl_api_base}/contacts/upsert").mock(
        return_value=httpx.Response(
            200,
            json={"contact": {"id": "contact-123", "firstName": "Jane", "lastName": "Doe"}},
        )
    )

    contact_id = await upsert_contact(
        phone="435-555-1234",
        name="Jane Doe",
        email="jane@example.com",
    )
    assert contact_id == "contact-123"


@pytest.mark.asyncio
async def test_upsert_contact_with_custom_fields(mock_ghl_api):
    mock_ghl_api.post(f"{settings.ghl_api_base}/contacts/upsert").mock(
        return_value=httpx.Response(
            200,
            json={"contact": {"id": "contact-456"}},
        )
    )

    contact_id = await upsert_contact(
        phone="435-555-1234",
        name="Jane Doe",
        email="",
        custom_fields={"intents_handled": "billing", "billing_reason": "Question"},
    )
    assert contact_id == "contact-456"


@pytest.mark.asyncio
async def test_upsert_contact_failure(mock_ghl_api):
    mock_ghl_api.post(f"{settings.ghl_api_base}/contacts/upsert").mock(
        return_value=httpx.Response(422, json={"error": "Validation failed"})
    )

    contact_id = await upsert_contact(
        phone="invalid",
        name="Test",
        email="",
    )
    assert contact_id is None


@pytest.mark.asyncio
async def test_send_email_success(mock_ghl_api):
    mock_ghl_api.post(f"{settings.ghl_api_base}/conversations/messages").mock(
        return_value=httpx.Response(200, json={"messageId": "msg-001"})
    )

    result = await send_email("contact-123", "Test Subject", "<p>Test body</p>")
    assert result is True


@pytest.mark.asyncio
async def test_send_sms_success(mock_ghl_api):
    mock_ghl_api.post(f"{settings.ghl_api_base}/conversations/messages").mock(
        return_value=httpx.Response(200, json={"messageId": "msg-002"})
    )

    result = await send_sms("contact-123", "Hello!")
    assert result is True


@pytest.mark.asyncio
async def test_add_tag_success(mock_ghl_api):
    mock_ghl_api.post(f"{settings.ghl_api_base}/contacts/contact-123/tags").mock(
        return_value=httpx.Response(200, json={"tags": ["AI Voice Agent Inquiry"]})
    )

    result = await add_tag("contact-123", "AI Voice Agent Inquiry")
    assert result is True
