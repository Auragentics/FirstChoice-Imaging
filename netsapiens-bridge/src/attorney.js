// Attorney-office intake: validate the data the voice AI collected for a
// records or lien request, and format a clean staff email. Returning what's
// missing/invalid lets the AI re-ask on the call before anything is sent.

const REQUIRED = {
  records: ['caller_name', 'firm_name', 'attorney_name', 'paralegal_name', 'callback_phone', 'caller_email', 'patient_name', 'patient_dob'],
  lien: ['caller_name', 'patient_name', 'patient_dob', 'firm_name', 'attorney_name', 'paralegal_name', 'caller_email', 'callback_phone', 'clinic_location'],
};

// Friendly labels for the re-ask message the AI speaks.
const LABEL = {
  caller_name: 'your name',
  firm_name: 'the law firm name',
  attorney_name: 'the attorney on the case',
  paralegal_name: 'the best point of contact',
  callback_phone: 'the best callback number',
  caller_email: 'the email address',
  patient_name: "the patient or client's name",
  patient_dob: "the patient's date of birth",
  clinic_location: 'which clinic the patient will be seen at',
};

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
const digits = (s) => String(s || '').replace(/\D/g, '');
const isPhone = (s) => digits(s).length >= 10;
// Accept YYYY-MM-DD, or anything the AI might pass that still parses to a date.
const isDob = (s) => {
  const v = String(s || '').trim();
  if (!v) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
  return !Number.isNaN(Date.parse(v));
};

/**
 * @param {object} p  intake payload (type + fields)
 * @returns {{ok:boolean, type:string, missing:string[], invalid:string[], message:string}}
 */
export function validateIntake(p = {}) {
  const type = p.type === 'lien' ? 'lien' : p.type === 'records' ? 'records' : null;
  if (!type) {
    return { ok: false, type: '', missing: ['type'], invalid: [], message: 'Missing request type (records or lien).' };
  }

  const missing = [];
  for (const field of REQUIRED[type]) {
    if (!String(p[field] ?? '').trim()) missing.push(field);
  }

  const invalid = [];
  if (p.caller_email && !isEmail(p.caller_email)) invalid.push('caller_email');
  if (p.callback_phone && !isPhone(p.callback_phone)) invalid.push('callback_phone');
  if (p.patient_dob && !isDob(p.patient_dob)) invalid.push('patient_dob');

  const ok = missing.length === 0 && invalid.length === 0;
  const ask = [...missing, ...invalid].map((f) => LABEL[f] || f);
  const message = ok
    ? 'All required details are present.'
    : `Before this can be submitted, please collect or re-confirm: ${ask.join('; ')}.`;

  return { ok, type, missing, invalid, message };
}

/** Build the staff email in FCI's established layout. Patient name is kept OUT
 *  of the subject to limit PHI in subject lines / mail logs; it lives in the
 *  body. `warning` (optional) is prepended when the intake was incomplete. */
export function formatEmail(p, warning = '') {
  const isLien = p.type === 'lien';
  const reason = isLien ? 'Direct Lien' : 'Medical Records Request';
  const subject = `New attorney ${isLien ? 'lien' : 'records'} request — ${p.firm_name || 'Unknown firm'}`;

  const L = [];
  if (warning) L.push(warning, '');
  L.push(`Reason for Call: ${reason}`, '');
  L.push('👤 Caller Information');
  L.push(`Name: ${p.caller_name || ''}`);
  L.push(`Phone: ${p.caller_phone || ''}`);
  L.push(`Email: ${p.caller_email || ''}`, '');
  L.push('🏥 Patient/Client Information');
  L.push(`Name: ${p.patient_name || ''}`);
  L.push(`Date of Birth: ${p.patient_dob || ''}`, '');
  L.push('⚖️ Legal Firm Details');
  L.push(`Law Firm: ${p.firm_name || ''}`);
  L.push(`Attorney Name: ${p.attorney_name || ''}`);
  L.push(`Paralegal: ${p.paralegal_name || ''}`);
  L.push(`Callback Phone: ${p.callback_phone || ''}`);
  if (isLien) L.push(`Clinic Lien Location: ${p.clinic_location || ''}`);
  if (p.request_type) L.push(`Records Requested: ${p.request_type}`);
  L.push('');
  L.push('🎙️ Call Analytics');
  L.push(`Total Duration: ${p.duration || ''}`, '');
  L.push('Executive Summary:');
  L.push(p.summary || '', '');
  L.push('📜 Transcripts');
  L.push('AI-Generated Transcript:');
  L.push(p.transcript || '');

  return { subject, text: L.join('\n') };
}

/** One-line incomplete banner for post-call sends (call is over — send anyway,
 *  but flag the gaps for staff). */
export function incompleteBanner(check) {
  const items = [...check.missing, ...check.invalid];
  return items.length ? `⚠️ INCOMPLETE — staff review needed. Missing/unclear: ${items.join(', ')}.` : '';
}

/** The "From" display name shown to staff, per request type. */
export function fromName(type) {
  return type === 'lien'
    ? 'AI Voice Agent - Lien Request'
    : 'AI Voice Agent Medical Records Request';
}

/** Where the staff email is routed, per type — with a testing override that
 *  sends everything to one address until go-live. */
export function routeTo(type, env = process.env) {
  if (env.INTAKE_EMAIL_OVERRIDE) return env.INTAKE_EMAIL_OVERRIDE;
  return (type === 'lien' ? env.INTAKE_EMAIL_LIEN : env.INTAKE_EMAIL_RECORDS) || '';
}
