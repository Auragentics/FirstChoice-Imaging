import { ghlRequest } from '../ghl-client.js';

export function makeUpdateContactHandler(tenant: string) {
  return async (args: {
    contact_id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    custom_fields?: string;
  }) => {
    const body: Record<string, unknown> = {};

    if (args.first_name) body.firstName = args.first_name;
    if (args.last_name) body.lastName = args.last_name;
    if (args.phone) body.phone = args.phone;
    if (args.email) body.email = args.email;

    // custom_fields expects JSON string: {"field_key": "value", ...}
    if (args.custom_fields) {
      try {
        const parsed = JSON.parse(args.custom_fields);
        const cfArray = Object.entries(parsed).map(([key, value]) => ({
          key,
          field_value: value,
        }));
        body.customFields = cfArray;
      } catch {
        return {
          content: [{ type: 'text' as const, text: 'Error: custom_fields must be valid JSON (e.g. {"field_key": "value"})' }],
        };
      }
    }

    const data = await ghlRequest(tenant, 'PUT', `/contacts/${args.contact_id}`, body) as {
      contact: { id: string; firstName: string; lastName?: string };
    };

    return {
      content: [{ type: 'text' as const, text: `Contact ${data.contact.id} updated: ${data.contact.firstName} ${data.contact.lastName || ''}` }],
    };
  };
}
