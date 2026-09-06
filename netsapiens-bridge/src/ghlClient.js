// GoHighLevel API v2 client — used by deploy-prompts.js to push the FCI voice
// agent prompts from the repo .md files into the GHL-native Voice AI agents
// (the `agentPrompt` field), so the repo is the source of truth instead of a
// hand-paste in the GHL dashboard.
//
// Auth: a Sub-Account Private Integration Token (PIT). Create it in
//   GHL → Settings → Private Integrations  (select the Voice AI read + write scopes).
// The Voice AI API accepts a PIT of a Sub-Account — no OAuth marketplace app
// needed. NEVER commit the token: it lives in Secret Manager (secret `ghl-pit`)
// or a local .env only.
import './env.js';

const BASE = (process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com').replace(/\/+$/, '');
const PIT = process.env.GHL_PIT || '';
export const LOCATION_ID = process.env.GHL_LOCATION_ID || '';
// The Voice AI endpoints use the "v3" API version (distinct from the CRM API's
// date-style versions like 2021-07-28).
const VOICE_VERSION = process.env.GHL_VOICE_API_VERSION || 'v3';

function requireConfig() {
  if (!PIT) throw new Error('GHL_PIT is not set (Private Integration Token — see .env.example).');
  if (!LOCATION_ID) throw new Error('GHL_LOCATION_ID is not set (see .env.example).');
}

/**
 * Low-level GHL request. Returns parsed JSON (or null for an empty 2xx body).
 * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
 * @param {string} path                         e.g. "/voice-ai/agents"
 * @param {object} [opts]
 * @param {Record<string,string|number>} [opts.params]  query string
 * @param {object} [opts.body]                  JSON body (adds Content-Type)
 * @param {string} [opts.version]               Version header (default v3)
 */
export async function ghlFetch(method, path, { params = {}, body, version = VOICE_VERSION } = {}) {
  requireConfig();
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${PIT}`,
      Version: version,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GHL ${res.status} ${res.statusText} for ${method} ${url.pathname}\n${text.slice(0, 800)}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON from ${url.pathname} but got:\n${text.slice(0, 800)}`);
  }
}

/** List every Voice AI agent in the location. Tolerates the common envelopes. */
export async function listVoiceAgents(locationId = LOCATION_ID) {
  const r = await ghlFetch('GET', '/voice-ai/agents', { params: { locationId } });
  const arr = Array.isArray(r) ? r : (r?.agents ?? r?.data ?? r?.voiceAgents ?? []);
  return Array.isArray(arr) ? arr : [];
}

/** Get one agent's full config (includes the current agentPrompt). */
export async function getVoiceAgent(agentId, locationId = LOCATION_ID) {
  const r = await ghlFetch('GET', `/voice-ai/agents/${encodeURIComponent(agentId)}`, { params: { locationId } });
  return r?.agent ?? r; // some responses wrap the object under { agent: {...} }
}

/** Partial-update an agent. We send ONLY the fields we intend to change. */
export function patchVoiceAgent(agentId, patch, locationId = LOCATION_ID) {
  return ghlFetch('PATCH', `/voice-ai/agents/${encodeURIComponent(agentId)}`, {
    params: { locationId },
    body: patch,
  });
}
