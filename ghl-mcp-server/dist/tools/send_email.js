import { ghlRequest } from '../ghl-client.js';
export function makeSendEmailHandler(tenant) {
    return async (args) => {
        const reqBody = {
            type: 'Email',
            contactId: args.contact_id,
            subject: args.subject,
            html: args.body,
        };
        if (args.from_email) {
            reqBody.emailFrom = args.from_email;
        }
        const result = await ghlRequest(tenant, 'POST', '/conversations/messages', reqBody);
        return {
            content: [{ type: 'text', text: `Email sent successfully!\nMessage ID: ${result.id}\nStatus: ${result.status}` }],
        };
    };
}
