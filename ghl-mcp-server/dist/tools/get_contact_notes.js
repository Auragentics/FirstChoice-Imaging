import { ghlRequest } from '../ghl-client.js';
export function makeGetContactNotesHandler(tenant) {
    return async (args) => {
        const data = await ghlRequest(tenant, 'GET', `/contacts/${args.contact_id}/notes`);
        if (!data.notes || data.notes.length === 0) {
            return {
                content: [{ type: 'text', text: `No notes found for contact ${args.contact_id}` }],
            };
        }
        const noteLines = data.notes.map((n) => `[${n.dateAdded}] (by: ${n.userId || 'unknown'})\n${n.body}`).join('\n\n---\n\n');
        return {
            content: [{ type: 'text', text: `${data.notes.length} note(s):\n\n${noteLines}` }],
        };
    };
}
