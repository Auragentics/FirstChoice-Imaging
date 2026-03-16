import { ghlRequest } from '../ghl-client.js';

interface GhlContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  customFields: Array<{ id: string; key: string; value: unknown; fieldKey: string }>;
  dateAdded: string;
  source: string;
}

export function makeGetContactHandler(tenant: string) {
  return async (args: { contact_id: string }) => {
    const data = await ghlRequest<{ contact: GhlContact }>(
      tenant,
      'GET',
      `/contacts/${args.contact_id}`
    );

    const c = data.contact;
    const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '(No name)';

    const customFieldLines = (c.customFields || [])
      .filter((f) => f.value !== null && f.value !== undefined && f.value !== '')
      .map((f) => `  ${f.fieldKey || f.key || f.id}: ${JSON.stringify(f.value)}`);

    const lines = [
      `ID: ${c.id}`,
      `Name: ${name}`,
      `Email: ${c.email ?? '(none)'}`,
      `Phone: ${c.phone ?? '(none)'}`,
      `Tags: ${c.tags?.join(', ') || '(none)'}`,
      `Source: ${c.source ?? '(none)'}`,
      `Date Added: ${c.dateAdded ?? 'unknown'}`,
    ];

    if (customFieldLines.length > 0) {
      lines.push(`Custom Fields:\n${customFieldLines.join('\n')}`);
    }

    return {
      content: [{ type: 'text' as const, text: lines.join('\n') }],
    };
  };
}
