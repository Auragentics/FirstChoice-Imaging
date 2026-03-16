import { ghlRequest } from '../ghl-client.js';

export function makeDeleteContactHandler(tenant: string) {
  return async (args: { contact_id: string }) => {
    await ghlRequest(tenant, 'DELETE', `/contacts/${args.contact_id}`);

    return {
      content: [{ type: 'text' as const, text: `Contact ${args.contact_id} deleted successfully.` }],
    };
  };
}
