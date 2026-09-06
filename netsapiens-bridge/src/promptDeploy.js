// Pure (network-free) helpers for deploy-prompts.js — kept separate so they can
// be unit-tested without any GHL credentials or HTTP.

// The 4 LIVE GHL Voice AI agents and the repo prompt file that feeds each one.
//
// North Logan is INTENTIONALLY absent: both Logan clinics share ONE call desk
// and central schedulers, so they run on the single Logan agent. The file
// NorthLoganVoiceAgentPrompt.md is kept in the repo for reference/consistency
// but is NEVER deployed. (There are 4 agents, not 5.)
//
// `did` = the published inbound DID that reaches the agent (primary match key);
// `names` = display-name fragments used as a fallback match.
export const PROMPTS = [
  { label: 'Logan',    file: 'LoganVoiceAgentPrompt.md',    did: '4352589598', names: ['ethan', 'logan'] },
  { label: 'Tooele',   file: 'TooeleVoiceAgentPrompt.md',   did: '4358821674', names: ['leo', 'tooele', 'tewilla'] },
  { label: 'Sandy',    file: 'SandyVoiceAgentPrompt.md',    did: '8015761290', names: ['marcus', 'sandy', 'wasatch'] },
  { label: 'StGeorge', file: 'StGeorgeVoiceAgentPrompt.md', did: '4352756210', names: ['luke', 'george'] },
];

/** Reduce a phone/DID to its last 10 digits for tolerant matching. */
export function last10(s) {
  const d = String(s ?? '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : d;
}

// Field accessors that tolerate GHL's naming variations across API versions.
export const agentId = (a) => a?.id ?? a?._id ?? a?.agentId ?? a?.agent_id ?? null;
export const agentName = (a) => a?.agentName ?? a?.name ?? a?.agent_name ?? '';
export const agentDid = (a) => last10(a?.inboundNumber ?? a?.phoneNumber ?? a?.inbound_number ?? '');

/**
 * Match one prompt entry to exactly ONE agent — by DID first, then by name.
 * Returns { agent, count, by }. `agent` is null unless the match is unambiguous
 * (exactly one), so a commit never runs on a fuzzy/zero/multiple match.
 */
export function resolveMatch(agents, p) {
  let matches = agents.filter((a) => agentDid(a) && agentDid(a) === p.did);
  let by = 'did';
  if (matches.length === 0) {
    matches = agents.filter((a) => p.names.some((nm) => agentName(a).toLowerCase().includes(nm)));
    by = 'name';
  }
  return { agent: matches.length === 1 ? matches[0] : null, count: matches.length, by };
}

/**
 * Cheap line-level diff summary for the dry-run. No dependency on a diff lib.
 * @param {string|null} oldText  current agentPrompt (null = couldn't read it)
 * @param {string} newText       prompt from the repo file
 */
export function diffSummary(oldText, newText) {
  const n = newText.split('\n');
  if (oldText == null) return { status: 'UNKNOWN', detail: `${newText.length} chars, ${n.length} lines (current prompt not readable)` };
  if (oldText === newText) return { status: 'SAME', detail: `${newText.length} chars` };
  const o = oldText.split('\n');
  let i = 0;
  while (i < o.length && i < n.length && o[i] === n[i]) i++;
  return {
    status: 'DIFF',
    detail: `${oldText.length} → ${newText.length} chars; first change at line ${i + 1}`,
    firstOld: o[i] ?? '(end of old)',
    firstNew: n[i] ?? '(end of new)',
  };
}
