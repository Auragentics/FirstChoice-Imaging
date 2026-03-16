import { ghlRequest, getLocationId } from '../ghl-client.js';
export function makeCreateContactHandler(tenant) {
    return async (args) => {
        const locationId = getLocationId(tenant);
        const body = {
            locationId,
            firstName: args.first_name,
            lastName: args.last_name || '',
            source: args.source || 'Voice AI',
        };
        if (args.phone)
            body.phone = args.phone;
        if (args.email)
            body.email = args.email;
        const data = await ghlRequest(tenant, 'POST', '/contacts/', body);
        const contact = data.contact;
        return {
            content: [
                {
                    type: 'text',
                    text: `Contact created successfully.\nID: ${contact.id}\nName: ${contact.firstName} ${contact.lastName || ''}\nPhone: ${contact.phone || 'N/A'}\nEmail: ${contact.email || 'N/A'}`,
                },
            ],
        };
    };
}
