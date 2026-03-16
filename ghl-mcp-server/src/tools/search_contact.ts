import { ghlRequest, getLocationId } from '../ghl-client.js';

interface GhlContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
}

interface SearchContactsResponse {
  contacts: GhlContact[];
  total: number;
}

export function makeSearchContactHandler(tenant: string) {
  return async (args: { query: string }) => {
    const locationId = getLocationId(tenant);

    const result = await ghlRequest<SearchContactsResponse>(
      tenant,
      'POST',
      '/contacts/search',
      {
        locationId,
        searchText: args.query,
        page: 1,
        pageLimit: 5,
      }
    );

    if (!result.contacts || result.contacts.length === 0) {
      return {
        content: [{ type: 'text' as const, text: `No contacts found for query: "${args.query}"` }],
      };
    }

    const contactList = result.contacts
      .map((c) => {
        const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '(No name)';
        return [
          `ID: ${c.id}`,
          `Name: ${name}`,
          `Email: ${c.email ?? '(none)'}`,
          `Phone: ${c.phone ?? '(none)'}`,
          `Tags: ${c.tags?.join(', ') || '(none)'}`,
        ].join('\n');
      })
      .join('\n\n---\n\n');

    return {
      content: [{ type: 'text' as const, text: `Found ${result.contacts.length} contact(s):\n\n${contactList}` }],
    };
  };
}
