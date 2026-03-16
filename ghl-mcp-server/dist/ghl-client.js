const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';
// ── Tenant registry ─────────────────────────────────────────────────────────
const tenants = {};
export function registerTenant(name, config) {
    tenants[name] = config;
}
export function getTenant(name) {
    const t = tenants[name];
    if (!t)
        throw new Error(`Tenant "${name}" is not registered.`);
    return t;
}
// ── Per-tenant GHL helpers ──────────────────────────────────────────────────
export function getGhlHeaders(tenant) {
    const { apiKey } = getTenant(tenant);
    return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Version: GHL_API_VERSION,
    };
}
export function getLocationId(tenant) {
    return getTenant(tenant).locationId;
}
export async function ghlRequest(tenant, method, path, body) {
    const url = `${GHL_BASE_URL}${path}`;
    const response = await fetch(url, {
        method,
        headers: getGhlHeaders(tenant),
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) {
        const errData = data;
        throw new Error(`GHL API error ${response.status}: ${errData.message ?? JSON.stringify(data)}`);
    }
    return data;
}
