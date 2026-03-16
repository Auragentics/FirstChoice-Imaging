import { ghlRequest } from '../ghl-client.js';

interface SendMessageResponse {
  id: string;
  status: string;
  messageType: string;
  direction: string;
}

export function makeSendSmsHandler(tenant: string) {
  return async (args: { contact_id: string; message: string; from_number?: string }) => {
    const body: Record<string, unknown> = {
      type: 'SMS',
      contactId: args.contact_id,
      message: args.message,
    };

    if (args.from_number) {
      body.fromNumber = args.from_number;
    }

    const result = await ghlRequest<SendMessageResponse>(
      tenant,
      'POST',
      '/conversations/messages',
      body
    );

    return {
      content: [{ type: 'text' as const, text: `SMS sent successfully!\nMessage ID: ${result.id}\nStatus: ${result.status}` }],
    };
  };
}
