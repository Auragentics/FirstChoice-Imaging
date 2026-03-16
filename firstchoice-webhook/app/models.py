from __future__ import annotations

from urllib.parse import unquote

from pydantic import BaseModel


class ExtractedData(BaseModel):
    """All variables extracted from GHL webhook query parameters."""

    # Universal
    caller_name: str = ""
    caller_phone: str = ""
    caller_email: str = ""
    intents_handled: str = ""
    sms_consent: str = ""

    # GHL Call Metadata
    call_transcript: str = ""
    call_duration: str = ""
    call_summary: str = ""
    caller_id_name: str = ""

    # Medical Records (records_ prefix)
    records_caller_type: str = ""  # "patient", "provider", or "attorney"
    records_request_type: str = ""  # "medical_records" or "radiology_report"

    # Billing (billing_ prefix)
    billing_patient_name: str = ""
    billing_patient_dob: str = ""
    billing_reason: str = ""

    # Lien (lien_ prefix)
    lien_patient_name: str = ""
    lien_patient_dob: str = ""
    lien_firm_name: str = ""
    lien_paralegal_name: str = ""
    lien_callback_phone: str = ""
    lien_clinic_location: str = ""

    @classmethod
    def from_query_params(cls, params: dict[str, str]) -> ExtractedData:
        """Parse URL-encoded GHL query parameters into typed ExtractedData."""
        decoded = {k: unquote(v) for k, v in params.items() if k in cls.model_fields}
        return cls(**decoded)

    @property
    def first_name(self) -> str:
        """Extract first name from caller_name."""
        return self.caller_name.split()[0] if self.caller_name else ""

    @property
    def intents(self) -> list[str]:
        """Parse intents_handled into a list of valid intent strings."""
        if not self.intents_handled:
            return []
        valid = {"records", "billing", "lien"}
        return [i.strip() for i in self.intents_handled.split(",") if i.strip() in valid]

    def custom_fields_dict(self) -> dict[str, str]:
        """Return all non-empty fields as a dict for GHL custom field update."""
        skip = {"caller_name", "caller_phone", "caller_email",
                "call_transcript", "call_duration", "call_summary", "caller_id_name"}
        return {
            k: v
            for k, v in self.model_dump().items()
            if v and k not in skip
        }
