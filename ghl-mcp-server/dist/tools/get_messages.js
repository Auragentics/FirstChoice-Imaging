import { ghlRequest } from '../ghl-client.js';
export function makeGetMessagesHandler(tenant) {
    return async (args) => {
        // Step 1: Find conversation for this contact
        const convSearch = await ghlRequest(tenant, 'GET', `/conversations/search?contactId=${args.contact_id}`);
        if (!convSearch.conversations || convSearch.conversations.length === 0) {
            return {
                content: [{ type: 'text', text: `No conversations found for contact ${args.contact_id}` }],
            };
        }
        const conversationId = convSearch.conversations[0].id;
        const limit = args.limit || 20;
        // Step 2: Get messages from the conversation
        const msgData = await ghlRequest(tenant, 'GET', `/conversations/${conversationId}/messages?limit=${limit}`);
        if (!msgData.messages || msgData.messages.length === 0) {
            return {
                content: [{ type: 'text', text: `No messages in conversation ${conversationId}` }],
            };
        }
        const msgLines = msgData.messages.map((m) => `[${m.dateAdded}] ${m.direction.toUpperCase()} (${m.type}) — ${m.status}\n${m.body}`).join('\n\n---\n\n');
        return {
            content: [{ type: 'text', text: `${msgData.messages.length} message(s):\n\n${msgLines}` }],
        };
    };
}
