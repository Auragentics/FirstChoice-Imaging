import { updateUnit } from '../sheets-client.js';

export async function updateUnitHandler(args: {
  unit_number: string;
  status?: string;
  tenant_name?: string;
  contact_id?: string;
  notes?: string;
}) {
  const updates: Parameters<typeof updateUnit>[1] = {};

  if (args.status !== undefined) {
    const s = args.status.toLowerCase();
    if (s === 'available' || s === 'occupied' || s === 'reserved') {
      updates.status = s;
    }
  }
  if (args.tenant_name !== undefined) updates.tenantName = args.tenant_name;
  if (args.contact_id !== undefined) updates.tenantContactId = args.contact_id;
  if (args.notes !== undefined) updates.notes = args.notes;

  const success = await updateUnit(args.unit_number, updates);

  if (!success) {
    return {
      content: [{ type: 'text' as const, text: `Unit "${args.unit_number}" not found in the inventory sheet.` }],
    };
  }

  const changes = Object.entries({
    status: args.status,
    tenant: args.tenant_name,
    contact_id: args.contact_id,
    notes: args.notes,
  })
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k} → "${v}"`)
    .join(', ');

  return {
    content: [{ type: 'text' as const, text: `Unit ${args.unit_number} updated: ${changes}` }],
  };
}
