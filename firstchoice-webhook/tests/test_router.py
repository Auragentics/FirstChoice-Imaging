"""Tests for intent parsing and ExtractedData model."""

from app.models import ExtractedData


def test_parse_single_intent():
    data = ExtractedData(intents_handled="records")
    assert data.intents == ["records"]


def test_parse_multi_intent():
    data = ExtractedData(intents_handled="records,billing")
    assert data.intents == ["records", "billing"]


def test_parse_multi_intent_with_spaces():
    data = ExtractedData(intents_handled="records, billing, lien")
    assert data.intents == ["records", "billing", "lien"]


def test_parse_empty_intents():
    data = ExtractedData(intents_handled="")
    assert data.intents == []


def test_parse_invalid_intents_filtered():
    data = ExtractedData(intents_handled="records,unknown,billing")
    assert data.intents == ["records", "billing"]


def test_first_name_extraction():
    data = ExtractedData(caller_name="Jane Doe")
    assert data.first_name == "Jane"


def test_first_name_single_name():
    data = ExtractedData(caller_name="Jane")
    assert data.first_name == "Jane"


def test_first_name_empty():
    data = ExtractedData(caller_name="")
    assert data.first_name == ""


def test_from_query_params():
    raw = {
        "caller_name": "Jane%20Doe",
        "caller_phone": "435-555-1234",
        "intents_handled": "billing",
        "billing_patient_name": "Jane%20Doe",
        "billing_patient_dob": "1985-03-15",
        "billing_reason": "Insurance%20question",
        "unknown_field": "should be ignored",
    }
    data = ExtractedData.from_query_params(raw)
    assert data.caller_name == "Jane Doe"
    assert data.billing_reason == "Insurance question"


def test_from_query_params_decodes_special_chars():
    raw = {
        "caller_name": "John%20Smith",
        "caller_email": "john%40example.com",
        "intents_handled": "records%2C%20billing",
        "lien_firm_name": "Siegfried%20%26%20Jensen",
    }
    data = ExtractedData.from_query_params(raw)
    assert data.caller_name == "John Smith"
    assert data.caller_email == "john@example.com"
    assert data.intents_handled == "records, billing"
    assert data.lien_firm_name == "Siegfried & Jensen"


def test_custom_fields_dict_excludes_universal():
    data = ExtractedData(
        caller_name="Jane Doe",
        caller_phone="435-555-1234",
        caller_email="jane@example.com",
        intents_handled="billing",
        billing_patient_name="Jane Doe",
        billing_patient_dob="1985-03-15",
        billing_reason="Question",
    )
    fields = data.custom_fields_dict()
    # Should not include caller_name, caller_phone, caller_email
    assert "caller_name" not in fields
    assert "caller_phone" not in fields
    assert "caller_email" not in fields
    # Should include intent-specific fields
    assert fields["billing_patient_name"] == "Jane Doe"
    assert fields["intents_handled"] == "billing"


def test_custom_fields_dict_excludes_empty():
    data = ExtractedData(
        caller_name="Jane Doe",
        caller_phone="435-555-1234",
        intents_handled="billing",
        billing_patient_name="Jane Doe",
        # billing_patient_dob left empty
    )
    fields = data.custom_fields_dict()
    assert "billing_patient_dob" not in fields
