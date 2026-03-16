const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

export interface TenantConfig {
  apiKey: string;
  locationId: string;
}

// ── Tenant registry ─────────────────────────────────────────────────────────

const tenants: Record<string, TenantConfig> = {};

export function registerTenant(name: string, config: TenantConfig) {
  tenants[name] = config;
}

export function getTenant(name: string): TenantConfig {
  const t = tenants[name];
  if (!t) throw new Error(`Tenant "${name}" is not registered.`);
  return t;
}

// ── Per-tenant GHL helpers ──────────────────────────────────────────────────

export function getGhlHeaders(tenant: string): Record<string, string> {
  const { apiKey } = getTenant(tenant);
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Version: GHL_API_VERSION,
  };
}

export function getLocationId(tenant: string): string {
  return getTenant(tenant).locationId;
}

export async function ghlRequest<T>(
  tenant: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${GHL_BASE_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: getGhlHeaders(tenant),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as T;

  if (!response.ok) {
    const errData = data as { message?: string };
    throw new Error(`GHL API error ${response.status}: ${errData.message ?? JSON.stringify(data)}`);
  }

  return data;
}
