import { ghlRequest } from '../ghl-client.js';

interface Message {
  id: string;
  body: string;
  type: string;       // SMS, Email, etc.
  direction: string;  // inbound, outbound
  status: string;
  dateAdded: string;
  contactId: string;
}

interface ConversationSearchResponse {
  conversations: Array<{ id: string; contactId: string }>;
  total: number;
}

interface MessagesResponse {
  messages: Message[];
  total?: number;
}

export function makeGetMessagesHandler(tenant: string) {
  return async (args: { contact_id: string; limit?: number }) => {
    // Step 1: Find conversation for this contact
    const convSearch = await ghlRequest<ConversationSearchResponse>(
      tenant,
      'GET',
      `/conversations/search?contactId=${args.contact_id}`
    );

    if (!convSearch.conversations || convSearch.conversations.length === 0) {
      return {
        content: [{ type: 'text' as const, text: `No conversations found for contact ${args.contact_id}` }],
      };
    }

    const conversationId = convSearch.conversations[0].id;
    const limit = args.limit || 20;

    // Step 2: Get messages from the conversation
    const msgData = await ghlRequest<MessagesResponse>(
      tenant,
      'GET',
      `/conversations/${conversationId}/messages?limit=${limit}`
    );

    if (!msgData.messages || msgData.messages.length === 0) {
      return {
        content: [{ type: 'text' as const, text: `No messages in conversation ${conversationId}` }],
      };
    }

    const msgLines = msgData.messages.map((m) =>
      `[${m.dateAdded}] ${m.direction.toUpperCase()} (${m.type}) — ${m.status}\n${m.body}`
    ).join('\n\n---\n\n');

    return {
      content: [{ type: 'text' as const, text: `${msgData.messages.length} message(s):\n\n${msgLines}` }],
    };
  };
}
