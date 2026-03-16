import { ghlRequest } from '../ghl-client.js';
export function makeAddNoteHandler(tenant) {
    return async (args) => {
        await ghlRequest(tenant, 'POST', `/contacts/${args.contact_id}/notes`, {
            body: args.note,
            userId: 'voice-ai',
        });
        return {
            content: [{ type: 'text', text: `Note added to contact ${args.contact_id}: "${args.note}"` }],
        };
    };
}
