import { ghlRequest, getLocationId } from '../ghl-client.js';

interface CreateContactArgs {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  source?: string;
}

export function makeCreateContactHandler(tenant: string) {
  return async (args: CreateContactArgs) => {
    const locationId = getLocationId(tenant);

    const body: Record<string, unknown> = {
      locationId,
      firstName: args.first_name,
      lastName: args.last_name || '',
      source: args.source || 'Voice AI',
    };

    if (args.phone) body.phone = args.phone;
    if (args.email) body.email = args.email;

    const data = await ghlRequest(tenant, 'POST', '/contacts/', body) as {
      contact: { id: string; firstName: string; lastName?: string; phone?: string; email?: string };
    };

    const contact = data.contact;
    return {
      content: [
        {
          type: 'text' as const,
          text: `Contact created successfully.\nID: ${contact.id}\nName: ${contact.firstName} ${contact.lastName || ''}\nPhone: ${contact.phone || 'N/A'}\nEmail: ${contact.email || 'N/A'}`,
        },
      ],
    };
  };
}
