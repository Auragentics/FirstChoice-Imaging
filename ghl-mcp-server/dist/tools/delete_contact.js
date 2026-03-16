import { ghlRequest } from '../ghl-client.js';
export function makeDeleteContactHandler(tenant) {
    return async (args) => {
        await ghlRequest(tenant, 'DELETE', `/contacts/${args.contact_id}`);
        return {
            content: [{ type: 'text', text: `Contact ${args.contact_id} deleted successfully.` }],
        };
    };
}
