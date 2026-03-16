import { ghlRequest } from '../ghl-client.js';
export function makeSendSmsHandler(tenant) {
    return async (args) => {
        const body = {
            type: 'SMS',
            contactId: args.contact_id,
            message: args.message,
        };
        if (args.from_number) {
            body.fromNumber = args.from_number;
        }
        const result = await ghlRequest(tenant, 'POST', '/conversations/messages', body);
        return {
            content: [{ type: 'text', text: `SMS sent successfully!\nMessage ID: ${result.id}\nStatus: ${result.status}` }],
        };
    };
}
