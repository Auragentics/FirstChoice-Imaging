from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

TEMPLATES_DIR = Path(__file__).parent / "templates"

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=True,
)

# Email subject patterns per intent
SUBJECT_PATTERNS = {
    "records": "MED RECORDS REQUEST | {caller_name}",
    "billing": "BILLING INQUIRY | {billing_patient_name} | {billing_patient_dob}",
    "lien": "LIEN REQUEST | {lien_patient_name} | {lien_patient_dob}",
}

# Template file mapping
EMAIL_TEMPLATES = {
    "records": "email_records.html",
    "billing": "email_billing.html",
    "lien": "email_lien.html",
}

SMS_TEMPLATES = {
    "records": "sms_records.txt",
    "billing": "sms_billing.txt",
    "lien": "sms_lien.txt",
}


def render_email(intent: str, data: dict) -> tuple[str, str]:
    """Render an email template. Returns (subject, html_body)."""
    template_name = EMAIL_TEMPLATES.get(intent)
    if not template_name:
        raise ValueError(f"Unknown intent for email: {intent}")

    context = {
        **data,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    }

    # Build subject — records intent uses dynamic subject based on request type
    if intent == "records":
        rtype = data.get("records_request_type", "medical_records")
        if rtype == "radiology_report":
            subject = f"RADIOLOGY REPORT | {data.get('caller_name', '')}"
        else:
            subject = f"MED RECORDS TRANSFER | {data.get('caller_name', '')}"
    else:
        pattern = SUBJECT_PATTERNS[intent]
        subject = pattern.format(**data)

    # Render HTML body
    template = _env.get_template(template_name)
    html_body = template.render(**context)

    return subject, html_body


def render_sms(intent: str, data: dict) -> str:
    """Render an SMS template. Returns the message text."""
    template_name = SMS_TEMPLATES.get(intent)
    if not template_name:
        raise ValueError(f"Unknown intent for SMS: {intent}")

    template = _env.get_template(template_name)
    return template.render(**data)
