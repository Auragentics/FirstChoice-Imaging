import { ghlRequest } from '../ghl-client.js';

export function makeAddNoteHandler(tenant: string) {
  return async (args: { contact_id: string; note: string }) => {
    await ghlRequest(tenant, 'POST', `/contacts/${args.contact_id}/notes`, {
      body: args.note,
      userId: 'voice-ai',
    });

    return {
      content: [{ type: 'text' as const, text: `Note added to contact ${args.contact_id}: "${args.note}"` }],
    };
  };
}
