// Net Sapiens API v2 client — the reusable core for the probe, the Retell
// webhook, and the (optional) MCP server. Uses API-key (bearer) auth.
import './env.js';

const BASE = (process.env.NS_API_BASE || '').replace(/\/+$/, '');
const KEY = process.env.NS_API_KEY || '';
export const DOMAIN = process.env.NS_DOMAIN || '~';

// Env is validated lazily (inside nsGet) rather than at import time, so this
// module can be imported without credentials — e.g. by the offline test suite,
// which injects a fake client and never makes a real request.
function requireConfig() {
  if (!BASE) throw new Error('NS_API_BASE is not set (see .env.example).');
  if (!KEY) throw new Error('NS_API_KEY is not set (see .env.example).');
}

/**
 * Low-level GET against the Net Sapiens API.
 * @param {string} path  e.g. "/domains/~/cdrs"
 * @param {Record<string,string|number>} [params] query string params
 */
export async function nsGet(path, params = {}) {
  requireConfig();
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${KEY}`,
      Accept: 'application/json',
    },
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(
      `Net Sapiens ${res.status} ${res.statusText} for GET ${url.pathname}\n` +
        body.slice(0, 800)
    );
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Expected JSON from ${url.pathname} but got:\n${body.slice(0, 800)}`);
  }
}

/**
 * Read voicemails in a mailbox folder.
 * @param {string} mailbox  user extension of the mailbox
 * @param {'new'|'save'|'trash'} [folder]
 * @param {string} [domain]
 */
export function readVoicemails(mailbox, folder = 'new', domain = DOMAIN) {
  const d = encodeURIComponent(domain);
  const u = encodeURIComponent(mailbox);
  return nsGet(`/domains/${d}/users/${u}/voicemails/${folder}`);
}

/**
 * List the call queues configured in the domain (metadata / discovery).
 * @param {string} [domain]
 */
export function listCallQueues(domain = DOMAIN) {
  const d = encodeURIComponent(domain);
  return nsGet(`/domains/${d}/callqueues`);
}

/**
 * Read the live list of calls in a call queue. For FCI's queue 2002 this list
 * INCLUDES "Waiting for Callback" entries (callers who hung up and are holding
 * their place) — our primary repeat-caller signal.
 * @param {string} queue  queue extension, e.g. "2002"
 * @param {string} [domain]
 */
export function readQueuedCalls(queue, domain = DOMAIN) {
  const d = encodeURIComponent(domain);
  const q = encodeURIComponent(queue);
  return nsGet(`/domains/${d}/queuedcall/${q}`);
}

/**
 * Search domain CDRs by caller number over a time window.
 * @param {object} opts
 * @param {string} opts.caller       caller id (partial match allowed)
 * @param {string} opts.start        RFC3339 datetime-start
 * @param {string} opts.end          RFC3339 datetime-end
 * @param {string} [opts.domain]
 */
export function searchCdrs({ caller, start, end, domain = DOMAIN }) {
  const d = encodeURIComponent(domain);
  return nsGet(`/domains/${d}/cdrs`, {
    caller,
    'datetime-start': start,
    'datetime-end': end,
  });
}
