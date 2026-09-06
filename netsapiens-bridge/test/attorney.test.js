// Offline tests for attorney intake validation. No network, no PHI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateIntake, formatEmail, fromName, routeTo } from '../src/attorney.js';

const goodRecords = {
  type: 'records',
  caller_name: 'Jane Paralegal',
  firm_name: 'Smith & Co',
  attorney_name: 'John Smith',
  paralegal_name: 'Jane Paralegal',
  callback_phone: '(801) 555-1234',
  caller_email: 'jane@smithco.com',
  patient_name: 'Pat Client',
  patient_dob: '1980-05-01',
};

test('valid records intake passes', () => {
  const r = validateIntake(goodRecords);
  assert.equal(r.ok, true);
  assert.equal(r.missing.length, 0);
  assert.equal(r.invalid.length, 0);
});

test('missing type is rejected', () => {
  const r = validateIntake({ firm_name: 'X' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ['type']);
});

test('missing required fields are listed', () => {
  const r = validateIntake({ type: 'records', firm_name: 'Smith & Co' });
  assert.equal(r.ok, false);
  assert.ok(r.missing.includes('caller_email'));
  assert.ok(r.missing.includes('patient_dob'));
});

test('bad email and dob are flagged as invalid', () => {
  const r = validateIntake({ ...goodRecords, caller_email: 'not-an-email', patient_dob: 'nope' });
  assert.equal(r.ok, false);
  assert.ok(r.invalid.includes('caller_email'));
  assert.ok(r.invalid.includes('patient_dob'));
});

test('lien requires clinic_location', () => {
  const { clinic_location, ...rest } = { ...goodRecords, type: 'lien' };
  const r = validateIntake(rest);
  assert.equal(r.ok, false);
  assert.ok(r.missing.includes('clinic_location'));
});

test('re-ask message uses friendly labels', () => {
  const r = validateIntake({ type: 'records', firm_name: 'Smith & Co' });
  assert.match(r.message, /date of birth|email/);
});

test('From name differs by type', () => {
  assert.equal(fromName('lien'), 'AI Voice Agent - Lien Request');
  assert.equal(fromName('records'), 'AI Voice Agent Medical Records Request');
});

test('routing: override wins; otherwise per-type', () => {
  const prod = { INTAKE_EMAIL_RECORDS: 'medicalrecords@fci.com', INTAKE_EMAIL_LIEN: 'office@fci.com' };
  assert.equal(routeTo('lien', prod), 'office@fci.com');
  assert.equal(routeTo('records', prod), 'medicalrecords@fci.com');
  const test = { ...prod, INTAKE_EMAIL_OVERRIDE: 'brian@auragentics.ai' };
  assert.equal(routeTo('lien', test), 'brian@auragentics.ai');
  assert.equal(routeTo('records', test), 'brian@auragentics.ai');
});

test('email keeps patient name out of the subject', () => {
  const { subject, text } = formatEmail(goodRecords);
  assert.ok(!subject.includes('Pat Client'));
  assert.ok(subject.includes('Smith & Co'));
  assert.ok(text.includes('Pat Client'));
});
