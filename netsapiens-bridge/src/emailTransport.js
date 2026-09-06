// Pluggable email transport.
//   EMAIL_MODE=dryrun  → sends nothing, logs no PHI (default; dependency-free)
//   EMAIL_MODE=smtp    → sends via SMTP (Auragentics Google Workspace)
// nodemailer is imported lazily so dry-run never needs the dependency.
import './env.js';

const MODE = process.env.EMAIL_MODE || 'dryrun';

let _transport = null;
async function transport() {
  if (_transport) return _transport;
  const nodemailer = (await import('nodemailer')).default;
  const port = Number(process.env.SMTP_PORT || 465);
  _transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transport;
}

/**
 * @param {{to:string, fromName?:string, subject:string, text:string}} msg
 * @returns {Promise<{sent:boolean, dryrun:boolean}>}
 */
export async function sendEmail({ to, fromName, subject, text }) {
  if (MODE === 'dryrun') {
    // Non-PHI facts only: recipient + payload size. Never the subject/body.
    console.log(`[email dryrun] would send to=${to || '(unset)'} from="${fromName || ''}" bytes=${subject.length + text.length}`);
    return { sent: false, dryrun: true };
  }

  if (MODE === 'smtp') {
    if (!to) throw new Error('no destination address (INTAKE_EMAIL_* not set)');
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) throw new Error('SMTP_USER / SMTP_PASS not set');
    // The address must be one the SMTP account is allowed to send as; the
    // display name is free text.
    const addr = process.env.SMTP_FROM || process.env.SMTP_USER;
    const from = fromName ? `"${fromName}" <${addr}>` : addr;
    await (await transport()).sendMail({ from, to, subject, text });
    return { sent: true, dryrun: false };
  }

  throw new Error(`EMAIL_MODE="${MODE}" has no transport implemented`);
}
