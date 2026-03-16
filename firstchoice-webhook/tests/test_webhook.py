"""Integration tests for the webhook endpoint."""

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch
from urllib.parse import urlencode

import pytest
from fastapi.testclient import TestClient

from app.main import app, _processed_calls

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(autouse=True)
def clear_processed_cache():
    """Clear the idempotency cache between tests."""
    _processed_calls.clear()


@pytest.fixture
def client():
    return TestClient(app)


def _load_fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text())


def _fixture_query_string(name: str) -> str:
    """Load fixture and convert to URL query string."""
    return urlencode(_load_fixture(name))


def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_no_query_params(client):
    resp = client.post("/webhook/retell")
    assert resp.status_code == 200
    assert resp.json()["status"] == "no_data"


def test_no_valid_intents(client):
    resp = client.post("/webhook/retell?caller_name=John&intents_handled=unknown")
    assert resp.status_code == 200
    assert resp.json()["status"] == "no_intents"


@patch("app.main.process_call", new_callable=AsyncMock)
def test_accepts_records_patient(mock_process, client):
    mock_process.return_value = {"intents_processed": ["records"], "errors": []}
    qs = _fixture_query_string("call_records_patient.json")
    resp = client.post(f"/webhook/retell?{qs}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


@patch("app.main.process_call", new_callable=AsyncMock)
def test_accepts_billing(mock_process, client):
    mock_process.return_value = {"intents_processed": ["billing"], "errors": []}
    qs = _fixture_query_string("call_billing.json")
    resp = client.post(f"/webhook/retell?{qs}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


@patch("app.main.process_call", new_callable=AsyncMock)
def test_accepts_lien(mock_process, client):
    mock_process.return_value = {"intents_processed": ["lien"], "errors": []}
    qs = _fixture_query_string("call_lien.json")
    resp = client.post(f"/webhook/retell?{qs}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


@patch("app.main.process_call", new_callable=AsyncMock)
def test_accepts_multi_intent(mock_process, client):
    mock_process.return_value = {"intents_processed": ["records", "billing"], "errors": []}
    qs = _fixture_query_string("call_multi_intent.json")
    resp = client.post(f"/webhook/retell?{qs}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"


@patch("app.main.process_call", new_callable=AsyncMock)
def test_duplicate_request_id_rejected(mock_process, client):
    mock_process.return_value = {"intents_processed": ["billing"], "errors": []}
    qs = _fixture_query_string("call_billing.json")

    # First request — accepted
    resp1 = client.post(
        f"/webhook/retell?{qs}",
        headers={"x-request-id": "req-123"},
    )
    assert resp1.json()["status"] == "accepted"

    # Second request with same request-id — duplicate
    resp2 = client.post(
        f"/webhook/retell?{qs}",
        headers={"x-request-id": "req-123"},
    )
    assert resp2.json()["status"] == "duplicate"


@patch("app.main.process_call", new_callable=AsyncMock)
def test_no_request_id_allows_both(mock_process, client):
    """Without x-request-id, requests are not deduped."""
    mock_process.return_value = {"intents_processed": ["billing"], "errors": []}
    qs = _fixture_query_string("call_billing.json")

    resp1 = client.post(f"/webhook/retell?{qs}")
    resp2 = client.post(f"/webhook/retell?{qs}")
    assert resp1.json()["status"] == "accepted"
    assert resp2.json()["status"] == "accepted"


@patch("app.main.process_call", new_callable=AsyncMock)
def test_url_encoded_params_decoded(mock_process, client):
    """Verify URL-encoded values are properly decoded."""
    mock_process.return_value = {"intents_processed": ["lien"], "errors": []}
    qs = "caller_name=John%20Smith&intents_handled=lien&lien_firm_name=Siegfried%20%26%20Jensen&lien_patient_name=Jane&lien_patient_dob=1990-01-01&lien_paralegal_name=Sue&lien_callback_phone=555-1234&lien_clinic_location=Logan"
    resp = client.post(f"/webhook/retell?{qs}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"
    # Verify the data passed to process_call was decoded
    call_args = mock_process.call_args[0][0]
    assert call_args.caller_name == "John Smith"
    assert call_args.lien_firm_name == "Siegfried & Jensen"
