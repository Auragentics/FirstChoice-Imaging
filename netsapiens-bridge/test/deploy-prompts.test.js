import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PROMPTS, last10, agentId, agentName, agentDid, resolveMatch, diffSummary,
} from '../src/promptDeploy.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('last10 normalizes DIDs to their last 10 digits', () => {
  assert.equal(last10('+14352589598'), '4352589598');
  assert.equal(last10('4352589598'), '4352589598');
  assert.equal(last10('(435) 258-9598'), '4352589598');
  assert.equal(last10('sip:+14352589598@x'), '4352589598');
  assert.equal(last10(''), '');
  assert.equal(last10(null), '');
});

test('agent accessors tolerate GHL field-name variants', () => {
  assert.equal(agentId({ id: 'a1' }), 'a1');
  assert.equal(agentId({ _id: 'a2' }), 'a2');
  assert.equal(agentId({ agentId: 'a3' }), 'a3');
  assert.equal(agentName({ agentName: 'Ethan' }), 'Ethan');
  assert.equal(agentName({ name: 'Leo' }), 'Leo');
  assert.equal(agentDid({ inboundNumber: '+14358821674' }), '4358821674');
  assert.equal(agentDid({ phoneNumber: '435-882-1674' }), '4358821674');
});

test('resolveMatch: unambiguous DID match wins', () => {
  const agents = [
    { id: 'x', agentName: 'Ethan', inboundNumber: '+14352589598' },
    { id: 'y', agentName: 'Leo', inboundNumber: '+14358821674' },
  ];
  const logan = PROMPTS.find((p) => p.label === 'Logan');
  const r = resolveMatch(agents, logan);
  assert.equal(r.agent.id, 'x');
  assert.equal(r.count, 1);
  assert.equal(r.by, 'did');
});

test('resolveMatch: falls back to name when no DID present', () => {
  const agents = [{ id: 'z', agentName: 'Marcus - Sandy', inboundNumber: '' }];
  const sandy = PROMPTS.find((p) => p.label === 'Sandy');
  const r = resolveMatch(agents, sandy);
  assert.equal(r.agent.id, 'z');
  assert.equal(r.by, 'name');
});

test('resolveMatch: ambiguous or missing returns null agent (never auto-commits)', () => {
  const dupes = [
    { id: 'a', agentName: 'Logan A', inboundNumber: '+14352589598' },
    { id: 'b', agentName: 'Logan B', inboundNumber: '+14352589598' },
  ];
  const logan = PROMPTS.find((p) => p.label === 'Logan');
  assert.equal(resolveMatch(dupes, logan).agent, null);
  assert.equal(resolveMatch(dupes, logan).count, 2);
  assert.equal(resolveMatch([], logan).agent, null);
});

test('diffSummary reports SAME / DIFF / UNKNOWN', () => {
  assert.equal(diffSummary('abc\n', 'abc\n').status, 'SAME');
  const d = diffSummary('line1\nline2\n', 'line1\nCHANGED\n');
  assert.equal(d.status, 'DIFF');
  assert.match(d.detail, /first change at line 2/);
  assert.equal(diffSummary(null, 'anything\n').status, 'UNKNOWN');
});

test('PROMPTS covers exactly the 4 live agents — North Logan is NOT deployed', () => {
  assert.equal(PROMPTS.length, 4);
  const labels = PROMPTS.map((p) => p.label);
  assert.deepEqual(labels, ['Logan', 'Tooele', 'Sandy', 'StGeorge']);
  assert.ok(!labels.some((l) => /north/i.test(l)), 'North Logan must not be in the deploy set');
});

test('every deployed prompt file exists in the repo root', () => {
  for (const p of PROMPTS) {
    assert.ok(existsSync(join(REPO_ROOT, p.file)), `missing prompt file: ${p.file}`);
  }
});
