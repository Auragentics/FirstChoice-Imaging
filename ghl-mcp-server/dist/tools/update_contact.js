import { ghlRequest } from '../ghl-client.js';
export function makeUpdateContactHandler(tenant) {
    return async (args) => {
        const body = {};
        if (args.first_name)
            body.firstName = args.first_name;
        if (args.last_name)
            body.lastName = args.last_name;
        if (args.phone)
            body.phone = args.phone;
        if (args.email)
            body.email = args.email;
        // custom_fields expects JSON string: {"field_key": "value", ...}
        if (args.custom_fields) {
            try {
                const parsed = JSON.parse(args.custom_fields);
                const cfArray = Object.entries(parsed).map(([key, value]) => ({
                    key,
                    field_value: value,
                }));
                body.customFields = cfArray;
            }
            catch {
                return {
                    content: [{ type: 'text', text: 'Error: custom_fields must be valid JSON (e.g. {"field_key": "value"})' }],
                };
            }
        }
        const data = await ghlRequest(tenant, 'PUT', `/contacts/${args.contact_id}`, body);
        return {
            content: [{ type: 'text', text: `Contact ${data.contact.id} updated: ${data.contact.firstName} ${data.contact.lastName || ''}` }],
        };
    };
}
