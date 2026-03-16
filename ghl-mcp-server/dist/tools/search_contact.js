import { ghlRequest, getLocationId } from '../ghl-client.js';
export function makeSearchContactHandler(tenant) {
    return async (args) => {
        const locationId = getLocationId(tenant);
        const result = await ghlRequest(tenant, 'POST', '/contacts/search', {
            locationId,
            searchText: args.query,
            page: 1,
            pageLimit: 5,
        });
        if (!result.contacts || result.contacts.length === 0) {
            return {
                content: [{ type: 'text', text: `No contacts found for query: "${args.query}"` }],
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
            content: [{ type: 'text', text: `Found ${result.contacts.length} contact(s):\n\n${contactList}` }],
        };
    };
}
