import { ghlRequest } from '../ghl-client.js';
export function makeAddTagHandler(tenant) {
    return async (args) => {
        const tagList = args.tags.split(',').map((t) => t.trim()).filter(Boolean);
        await ghlRequest(tenant, 'POST', `/contacts/${args.contact_id}/tags`, {
            tags: tagList,
        });
        return {
            content: [{ type: 'text', text: `Tags added to contact ${args.contact_id}: ${tagList.join(', ')}` }],
        };
    };
}
