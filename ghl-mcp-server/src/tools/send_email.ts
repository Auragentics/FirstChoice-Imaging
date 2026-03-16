import { ghlRequest } from '../ghl-client.js';

interface SendMessageResponse {
  id: string;
  status: string;
  messageType: string;
  direction: string;
}

export function makeSendEmailHandler(tenant: string) {
  return async (args: {
    contact_id: string;
    subject: string;
    body: string;
    from_email?: string;
  }) => {
    const reqBody: Record<string, unknown> = {
      type: 'Email',
      contactId: args.contact_id,
      subject: args.subject,
      html: args.body,
    };

    if (args.from_email) {
      reqBody.emailFrom = args.from_email;
    }

    const result = await ghlRequest<SendMessageResponse>(
      tenant,
      'POST',
      '/conversations/messages',
      reqBody
    );

    return {
      content: [{ type: 'text' as const, text: `Email sent successfully!\nMessage ID: ${result.id}\nStatus: ${result.status}` }],
    };
  };
}
